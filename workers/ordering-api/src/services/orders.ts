import type { Env } from "../env";
import type { CreateOrderRequest, OrderStatus } from "@cafe-lile/contracts";
import { ALLOWED_TRANSITIONS, resolveDeliveryZone } from "@cafe-lile/contracts";
import { ApiHttpError, newId, nowIso } from "../lib/http";

interface CanonicalMenuItem {
  id: string;
  name: string;
  priceMinor: number;
  isAvailable: boolean;
  isArchived: boolean;
  ingredients: string[];
}

/** Safely parses an ingredients JSON column; never throws on malformed/missing data. */
function parseIngredients(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
    return [];
  } catch {
    return [];
  }
}

interface RestaurantSettingsRow {
  restaurant_name: string;
  currency_code: string;
  pickup_instructions: string;
  accepting_orders: number;
}

/**
 * Creates an order. Server is the sole authority on price, availability, and totals.
 * Idempotency: if idempotencyKey already exists, returns the existing order instead
 * of creating a duplicate (protects against retries / double-taps on flaky mobile networks).
 */
export async function createOrder(
  env: Env,
  body: CreateOrderRequest,
  idempotencyKey: string
) {
  // 1. Idempotency check first — cheap read, avoids duplicate work entirely.
  const existing = await env.DB.prepare(
    `SELECT id, reference, status, subtotal_minor as subtotalMinor,
            delivery_fee_minor as deliveryFeeMinor, total_minor as totalMinor,
            currency_code as currencyCode, placed_at as placedAt
     FROM orders WHERE idempotency_key = ?`
  )
    .bind(idempotencyKey)
    .first<{
      id: string;
      reference: string;
      status: OrderStatus;
      subtotalMinor: number;
      deliveryFeeMinor: number;
      totalMinor: number;
      currencyCode: string;
      placedAt: string;
    }>();

  const settings = await env.DB.prepare(
    `SELECT restaurant_name, currency_code, pickup_instructions, accepting_orders
     FROM restaurant_settings WHERE id = 1`
  ).first<RestaurantSettingsRow>();

  if (!settings) {
    throw new ApiHttpError(500, "settings_missing", "რესტორნის პარამეტრები არ არის კონფიგურირებული.");
  }

  if (existing) {
    return {
      order: {
        reference: existing.reference,
        status: existing.status,
        subtotalMinor: existing.subtotalMinor,
        deliveryFeeMinor: existing.deliveryFeeMinor,
        totalMinor: existing.totalMinor,
        currencyCode: existing.currencyCode,
        placedAt: existing.placedAt,
        pickupInstructions: settings.pickup_instructions,
        fulfillmentMethod: body.fulfillmentMethod,
        paymentMethod: (body.paymentMethod ?? "cash") as "cash" | "card",
      },
    };
  }

  if (!settings.accepting_orders) {
    throw new ApiHttpError(409, "not_accepting_orders", "კაფე ლილე ამჟამად არ იღებს შეკვეთებს.");
  }

  // Delivery orders must include a pinned location (address + coordinates from the map picker).
  if (body.fulfillmentMethod === "delivery" && !body.deliveryLocation) {
    throw new ApiHttpError(400, "missing_delivery_location", "გთხოვთ, მონიშნოთ მიტანის მისამართი რუკაზე.");
  }

  // 2. Reject duplicate item ids in the request body.
  const seenIds = new Set<string>();
  for (const line of body.lines) {
    if (seenIds.has(line.menuItemId)) {
      throw new ApiHttpError(400, "duplicate_line_item", "თითოეული პროდუქტი შეიძლება მხოლოდ ერთხელ იყოს მითითებული — გაზარდეთ რაოდენობა.");
    }
    seenIds.add(line.menuItemId);
  }

  // 3. Load canonical menu items for every requested id in one query.
  const ids = body.lines.map((l) => l.menuItemId);
  const placeholders = ids.map(() => "?").join(",");
  const { results: menuRows } = await env.DB.prepare(
    `SELECT id, name, price_minor as priceMinor, ingredients,
            is_available as isAvailable, is_archived as isArchived
     FROM menu_items WHERE id IN (${placeholders})`
  )
    .bind(...ids)
    .all<{ id: string; name: string; priceMinor: number; ingredients: string; isAvailable: number; isArchived: number }>();

  const canonicalById = new Map<string, CanonicalMenuItem>(
    (menuRows ?? []).map((r) => [
      r.id,
      {
        id: r.id,
        name: r.name,
        priceMinor: r.priceMinor,
        ingredients: parseIngredients(r.ingredients),
        isAvailable: Boolean(r.isAvailable),
        isArchived: Boolean(r.isArchived),
      },
    ])
  );

  for (const line of body.lines) {
    const item = canonicalById.get(line.menuItemId);
    if (!item || item.isArchived) {
      throw new ApiHttpError(400, "unknown_item", `პროდუქტი ${line.menuItemId} არ არსებობს.`);
    }
    if (!item.isAvailable) {
      throw new ApiHttpError(409, "item_unavailable", `${item.name} ამჟამად მიუწვდომელია.`);
    }
  }

  // 4. Compute totals server-side. Client-supplied prices/totals are never trusted.
  const orderId = newId("order");
  const reference = generateOrderReference();
  const placedAt = nowIso();

  const orderItemRows = body.lines.map((line) => {
    const item = canonicalById.get(line.menuItemId)!;
    const lineTotal = item.priceMinor * line.quantity;
    // Only keep exclusions that actually match an ingredient of this dish
    // (case-insensitive), so the kitchen never sees phantom requests.
    const requested = new Set(line.excludedIngredients?.map((e) => e.trim().toLowerCase()) ?? []);
    const excludedIngredients = item.ingredients.filter((i) => requested.has(i.toLowerCase()));
    return {
      id: newId("oi"),
      menuItemId: item.id,
      name: item.name,
      unitPriceMinor: item.priceMinor,
      quantity: line.quantity,
      lineTotalMinor: lineTotal,
      excludedIngredients,
    };
  });

  const subtotalMinor = orderItemRows.reduce((sum, r) => sum + r.lineTotalMinor, 0);
  // Fee is decided by which village area the pin falls in (server-authoritative).
  const deliveryFeeMinor =
    body.fulfillmentMethod === "delivery" && body.deliveryLocation
      ? resolveDeliveryZone(body.deliveryLocation.latitude, body.deliveryLocation.longitude).feeMinor
      : 0;
  const totalMinor = subtotalMinor + deliveryFeeMinor;

  // 5. Persist order header + line items + creation event atomically via D1 batch.
  const eventId = newId("evt");
  const paymentMethod = body.paymentMethod ?? "cash";
  const paymentStatus = paymentMethod === "card" ? "unpaid" : "unpaid";

  const statements = [
    env.DB.prepare(
      `INSERT INTO orders (
        id, reference, status, customer_name, customer_phone, customer_note,
        payment_method, payment_status, currency_code, subtotal_minor,
        delivery_fee_minor, total_minor, fulfillment_method, delivery_address,
        delivery_latitude, delivery_longitude, idempotency_key, placed_at, updated_at
      ) VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      orderId,
      reference,
      body.customerName,
      body.customerPhone,
      body.customerNote ?? null,
      paymentMethod,
      paymentStatus,
      settings.currency_code,
      subtotalMinor,
      deliveryFeeMinor,
      totalMinor,
      body.fulfillmentMethod,
      body.deliveryLocation?.address ?? null,
      body.deliveryLocation?.latitude ?? null,
      body.deliveryLocation?.longitude ?? null,
      idempotencyKey,
      placedAt,
      placedAt
    ),
    ...orderItemRows.map((r) =>
      env.DB.prepare(
        `INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_minor, quantity, line_total_minor, excluded_ingredients)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(r.id, orderId, r.menuItemId, r.name, r.unitPriceMinor, r.quantity, r.lineTotalMinor, JSON.stringify(r.excludedIngredients))
    ),
    env.DB.prepare(
      `INSERT INTO order_events (id, order_id, event_type, from_status, to_status, actor, created_at)
       VALUES (?, ?, 'created', NULL, 'new', 'customer', ?)`
    ).bind(eventId, orderId, placedAt),
  ];

  // D1 batch = SQL transaction: if any statement fails, the whole sequence rolls back.
  await env.DB.batch(statements);

  return {
    order: {
      reference,
      status: "new" as OrderStatus,
      subtotalMinor,
      deliveryFeeMinor,
      totalMinor,
      currencyCode: settings.currency_code,
      placedAt,
      pickupInstructions: settings.pickup_instructions,
      fulfillmentMethod: body.fulfillmentMethod,
      paymentMethod,
    },
  };
}

export async function updateOrderStatus(env: Env, orderId: string, nextStatus: OrderStatus) {
  const order = await env.DB.prepare(`SELECT status FROM orders WHERE id = ?`)
    .bind(orderId)
    .first<{ status: OrderStatus }>();

  if (!order) {
    throw new ApiHttpError(404, "order_not_found", "შეკვეთა ვერ მოიძებნა.");
  }

  const allowed = ALLOWED_TRANSITIONS[order.status];
  if (!allowed.includes(nextStatus)) {
    throw new ApiHttpError(
      409,
      "invalid_transition",
      `Cannot move order from ${order.status} to ${nextStatus}.`
    );
  }

  const now = nowIso();
  const timestampColumn: Record<string, string | null> = {
    accepted: "accepted_at",
    ready: "ready_at",
    completed: "completed_at",
  };
  const col = timestampColumn[nextStatus];

  const eventId = newId("evt");

  const statements = [
    col
      ? env.DB.prepare(`UPDATE orders SET status = ?, updated_at = ?, ${col} = ? WHERE id = ?`).bind(
          nextStatus,
          now,
          now,
          orderId
        )
      : env.DB.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).bind(
          nextStatus,
          now,
          orderId
        ),
    env.DB.prepare(
      `INSERT INTO order_events (id, order_id, event_type, from_status, to_status, actor, created_at)
       VALUES (?, ?, 'status_changed', ?, ?, 'admin', ?)`
    ).bind(eventId, orderId, order.status, nextStatus, now),
  ];

  await env.DB.batch(statements);

  return { status: nextStatus };
}

function generateOrderReference(): string {
  // Short, human-readable reference for the pickup counter, e.g. CL-4821
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CL-${num}`;
}
