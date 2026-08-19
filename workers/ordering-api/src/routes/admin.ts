import type { Env } from "../env";
import {
  AdminLoginRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "@cafe-lile/contracts";
import { ApiHttpError, jsonResponse, nowIso } from "../lib/http";
import { derivePasswordHash, timingSafeEqual, hashIp } from "../services/crypto";
import {
  createSession,
  revokeSession,
  readSessionCookie,
  sessionCookieHeader,
  clearSessionCookieHeader,
} from "../services/sessions";
import { requireAdminSession } from "../middleware/auth";
import { updateOrderStatus } from "../services/orders";

// ---------- Auth ----------

export async function postAdminLogin(request: Request, env: Env): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = AdminLoginRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    // Generic failure message regardless of which validation failed (OWASP guidance).
    throw new ApiHttpError(401, "invalid_credentials", "Incorrect username or password.");
  }
  
  const user = await env.DB.prepare(
    `SELECT id, password_hash as passwordHash, password_salt as passwordSalt,
            display_name as displayName, is_active as isActive
     FROM admin_users WHERE username = ?`
  )
    .bind(parsed.data.username)
    .first<{
      id: string;
      passwordHash: string;
      passwordSalt: string;
      displayName: string;
      isActive: number;
    }>();

  // Always derive a hash even on user-not-found, to avoid timing-based username enumeration.
  const candidateSalt = user?.passwordSalt ?? "AAAAAAAAAAAAAAAAAAAAAA";
  const candidateHash = await derivePasswordHash(parsed.data.password, candidateSalt);

  console.log("DEBUG login attempt:", { username: parsed.data.username, userFound: Boolean(user), isActive: user?.isActive, storedSalt: user?.passwordSalt, storedHash: user?.passwordHash, candidateHash });
  const ok = user && user.isActive && timingSafeEqual(candidateHash, user.passwordHash);
  if (!ok) {
    throw new ApiHttpError(401, "invalid_credentials", "Incorrect username or password.");
  }

  const ip = request.headers.get("CF-Connecting-IP");
  const ipHash = ip ? await hashIp(ip, env.IP_HASH_KEY) : null;

  const { rawToken, expiresAt } = await createSession(env, user!.id, ipHash);

  return jsonResponse(
    { displayName: user!.displayName, expiresAt },
    { headers: { "Set-Cookie": sessionCookieHeader(rawToken, expiresAt) } }
  );
}

export async function postAdminLogout(request: Request, env: Env): Promise<Response> {
  const rawToken = readSessionCookie(request);
  if (rawToken) {
    await revokeSession(env, rawToken);
  }
  return jsonResponse({ ok: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
}

export async function getAdminSession(request: Request, env: Env): Promise<Response> {
  const ctx = await requireAdminSession(request, env);
  return jsonResponse({ displayName: ctx.displayName });
}

// ---------- Orders ----------

export async function getAdminActiveOrders(request: Request, env: Env): Promise<Response> {
  await requireAdminSession(request, env);

  const { results: orders } = await env.DB.prepare(
    `SELECT id, reference, status, customer_name as customerName, customer_phone as customerPhone,
            customer_note as customerNote, currency_code as currencyCode,
            subtotal_minor as subtotalMinor, total_minor as totalMinor,
            placed_at as placedAt, updated_at as updatedAt
     FROM orders
     WHERE status IN ('new', 'accepted', 'preparing', 'ready')
     ORDER BY placed_at ASC`
  ).all<{
    id: string;
    reference: string;
    status: string;
    customerName: string;
    customerPhone: string | null;
    customerNote: string | null;
    currencyCode: string;
    subtotalMinor: number;
    totalMinor: number;
    placedAt: string;
    updatedAt: string;
  }>();

  const orderList = orders ?? [];
  if (orderList.length === 0) {
    return jsonResponse({ orders: [] });
  }

  const orderIds = orderList.map((o) => o.id);
  const placeholders = orderIds.map(() => "?").join(",");
  const { results: items } = await env.DB.prepare(
    `SELECT id, order_id as orderId, menu_item_id as menuItemId, item_name_snapshot as itemNameSnapshot,
            unit_price_minor as unitPriceMinor, quantity, line_total_minor as lineTotalMinor
     FROM order_items WHERE order_id IN (${placeholders})`
  )
    .bind(...orderIds)
    .all<{
      id: string;
      orderId: string;
      menuItemId: string | null;
      itemNameSnapshot: string;
      unitPriceMinor: number;
      quantity: number;
      lineTotalMinor: number;
    }>();

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return jsonResponse({
    orders: orderList.map((o) => ({
      id: o.id,
      reference: o.reference,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerNote: o.customerNote,
      currencyCode: o.currencyCode,
      subtotalMinor: o.subtotalMinor,
      totalMinor: o.totalMinor,
      placedAt: o.placedAt,
      updatedAt: o.updatedAt,
      items: (itemsByOrder.get(o.id) ?? []).map((i) => ({
        id: i.id,
        menuItemId: i.menuItemId,
        itemNameSnapshot: i.itemNameSnapshot,
        unitPriceMinor: i.unitPriceMinor,
        quantity: i.quantity,
        lineTotalMinor: i.lineTotalMinor,
      })),
    })),
  });
}

export async function patchAdminOrderStatus(
  request: Request,
  env: Env,
  orderId: string
): Promise<Response> {
  await requireAdminSession(request, env);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = UpdateOrderStatusRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ApiHttpError(400, "invalid_status", "Invalid status value.");
  }

  const result = await updateOrderStatus(env, orderId, parsed.data.status);
  return jsonResponse(result);
}

// ---------- Settings ----------

export async function getAdminSettings(request: Request, env: Env): Promise<Response> {
  await requireAdminSession(request, env);

  const settings = await env.DB.prepare(
    `SELECT restaurant_name as restaurantName, currency_code as currencyCode,
            pickup_instructions as pickupInstructions, timezone,
            accepting_orders as acceptingOrders, default_prep_minutes as defaultPrepMinutes
     FROM restaurant_settings WHERE id = 1`
  ).first();

  return jsonResponse({ settings });
}

export async function patchAdminSettings(request: Request, env: Env): Promise<Response> {
  await requireAdminSession(request, env);

  let rawBody: any;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof rawBody.acceptingOrders === "boolean") {
    fields.push("accepting_orders = ?");
    values.push(rawBody.acceptingOrders ? 1 : 0);
  }
  if (typeof rawBody.pickupInstructions === "string") {
    fields.push("pickup_instructions = ?");
    values.push(rawBody.pickupInstructions);
  }
  if (typeof rawBody.defaultPrepMinutes === "number") {
    fields.push("default_prep_minutes = ?");
    values.push(rawBody.defaultPrepMinutes);
  }

  if (fields.length === 0) {
    throw new ApiHttpError(400, "no_fields", "No valid settings fields provided.");
  }

  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(1);

  await env.DB.prepare(`UPDATE restaurant_settings SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return jsonResponse({ ok: true });
}
