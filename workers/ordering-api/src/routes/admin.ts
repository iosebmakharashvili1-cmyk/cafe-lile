import type { Env } from "../env";
import {
  AdminLoginRequestSchema,
  UpdateOrderStatusRequestSchema,
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  CreateMenuItemRequestSchema,
  UpdateMenuItemRequestSchema,
} from "@cafe-lile/contracts";
import { ApiHttpError, jsonResponse, newId, nowIso } from "../lib/http";
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

/** Safely parses the ingredients JSON column; never throws on malformed/missing data. */
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

// ---------- Auth ----------

export async function postAdminLogin(request: Request, env: Env): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
  }

  const parsed = AdminLoginRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    // Generic failure message regardless of which validation failed (OWASP guidance).
    throw new ApiHttpError(401, "invalid_credentials", "არასწორი მომხმარებელი ან პაროლი.");
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

  const ok = user && user.isActive && timingSafeEqual(candidateHash, user.passwordHash);
  if (!ok) {
    throw new ApiHttpError(401, "invalid_credentials", "არასწორი მომხმარებელი ან პაროლი.");
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
            fulfillment_method as fulfillmentMethod, payment_method as paymentMethod,
            delivery_address as deliveryAddress,
            delivery_latitude as deliveryLatitude, delivery_longitude as deliveryLongitude,
            subtotal_minor as subtotalMinor, delivery_fee_minor as deliveryFeeMinor,
            total_minor as totalMinor, placed_at as placedAt, updated_at as updatedAt
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
    fulfillmentMethod: string;
    paymentMethod: string;
    deliveryAddress: string | null;
    deliveryLatitude: number | null;
    deliveryLongitude: number | null;
    currencyCode: string;
    subtotalMinor: number;
    deliveryFeeMinor: number;
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
            unit_price_minor as unitPriceMinor, quantity, line_total_minor as lineTotalMinor,
            excluded_ingredients as excludedIngredients
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
      excludedIngredients: string;
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
      fulfillmentMethod: o.fulfillmentMethod,
      paymentMethod: o.paymentMethod,
      deliveryAddress: o.deliveryAddress,
      deliveryLatitude: o.deliveryLatitude,
      deliveryLongitude: o.deliveryLongitude,
      currencyCode: o.currencyCode,
      subtotalMinor: o.subtotalMinor,
      deliveryFeeMinor: o.deliveryFeeMinor,
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
        excludedIngredients: parseIngredients(i.excludedIngredients ?? "[]"),
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
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
  }

  const parsed = UpdateOrderStatusRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ApiHttpError(400, "invalid_status", "სტატუსის არასწორი მნიშვნელობა.");
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
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
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
    throw new ApiHttpError(400, "no_fields", "პარამეტრების ვერცერთი ველი არ არის მითითებული.");
  }

  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(1);

  await env.DB.prepare(`UPDATE restaurant_settings SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  return jsonResponse({ ok: true });
}

// ---------- Menu management ----------

export async function getAdminMenu(request: Request, env: Env): Promise<Response> {
  await requireAdminSession(request, env);

  const { results: categories } = await env.DB.prepare(
    `SELECT id, name, sort_order as sortOrder, is_visible as isVisible
     FROM menu_categories ORDER BY sort_order ASC`
  ).all<{ id: string; name: string; sortOrder: number; isVisible: number }>();

  const { results: items } = await env.DB.prepare(
    `SELECT id, category_id as categoryId, name, description, ingredients,
            price_minor as priceMinor, image_url as imageUrl, sort_order as sortOrder,
            is_available as isAvailable, is_archived as isArchived
     FROM menu_items ORDER BY sort_order ASC`
  ).all<{
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    ingredients: string;
    priceMinor: number;
    imageUrl: string | null;
    sortOrder: number;
    isAvailable: number;
    isArchived: number;
  }>();

  return jsonResponse({
    categories: (categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sortOrder,
      isVisible: Boolean(c.isVisible),
    })),
    items: (items ?? []).map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name,
      description: i.description,
      ingredients: parseIngredients(i.ingredients),
      priceMinor: i.priceMinor,
      imageUrl: i.imageUrl,
      sortOrder: i.sortOrder,
      isAvailable: Boolean(i.isAvailable),
      isArchived: Boolean(i.isArchived),
    })),
  });
}

export async function postAdminCategory(request: Request, env: Env): Promise<Response> {
  await requireAdminSession(request, env);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
  }

  const parsed = CreateCategoryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ApiHttpError(400, "invalid_category", parsed.error.issues[0]?.message ?? "კატეგორია არასწორია.");
  }

  const id = newId("cat");
  const now = nowIso();
  const sortOrder = parsed.data.sortOrder ?? 0;

  await env.DB.prepare(
    `INSERT INTO menu_categories (id, name, sort_order, is_visible, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`
  )
    .bind(id, parsed.data.name, sortOrder, now, now)
    .run();

  return jsonResponse(
    { category: { id, name: parsed.data.name, sortOrder, isVisible: true } },
    { status: 201 }
  );
}

export async function patchAdminCategory(request: Request, env: Env, categoryId: string): Promise<Response> {
  await requireAdminSession(request, env);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
  }

  const parsed = UpdateCategoryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ApiHttpError(400, "invalid_category", parsed.error.issues[0]?.message ?? "კატეგორიის განახლება ვერ მოხერხდა.");
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (parsed.data.name !== undefined) {
    fields.push("name = ?");
    values.push(parsed.data.name);
  }
  if (parsed.data.sortOrder !== undefined) {
    fields.push("sort_order = ?");
    values.push(parsed.data.sortOrder);
  }
  if (parsed.data.isVisible !== undefined) {
    fields.push("is_visible = ?");
    values.push(parsed.data.isVisible ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new ApiHttpError(400, "no_fields", "ვერცერთი ცვლადი ველი არ არის მითითებული.");
  }

  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(categoryId);

  const result = await env.DB.prepare(`UPDATE menu_categories SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  if (result.meta.changes === 0) {
    throw new ApiHttpError(404, "category_not_found", "კატეგორია ვერ მოიძებნა.");
  }

  return jsonResponse({ ok: true });
}

export async function postAdminMenuItem(request: Request, env: Env): Promise<Response> {
  await requireAdminSession(request, env);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
  }

  const parsed = CreateMenuItemRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ApiHttpError(400, "invalid_item", parsed.error.issues[0]?.message ?? "მენიუს პროდუქტი არასწორია.");
  }

  const category = await env.DB.prepare(`SELECT id FROM menu_categories WHERE id = ?`)
    .bind(parsed.data.categoryId)
    .first();
  if (!category) {
    throw new ApiHttpError(400, "unknown_category", "ეს კატეგორია არ არსებობს.");
  }

  const id = newId("item");
  const now = nowIso();
  const sortOrder = parsed.data.sortOrder ?? 0;
  const ingredientsJson = JSON.stringify(parsed.data.ingredients ?? []);

  await env.DB.prepare(
    `INSERT INTO menu_items (
      id, category_id, name, description, ingredients, price_minor, image_url, sort_order,
      is_available, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`
  )
    .bind(
      id,
      parsed.data.categoryId,
      parsed.data.name,
      parsed.data.description ?? null,
      ingredientsJson,
      parsed.data.priceMinor,
      parsed.data.imageUrl ?? null,
      sortOrder,
      now,
      now
    )
    .run();

  return jsonResponse(
    {
      item: {
        id,
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ingredients: parsed.data.ingredients ?? [],
        priceMinor: parsed.data.priceMinor,
        imageUrl: parsed.data.imageUrl ?? null,
        sortOrder,
        isAvailable: true,
        isArchived: false,
      },
    },
    { status: 201 }
  );
}

export async function patchAdminMenuItem(request: Request, env: Env, itemId: string): Promise<Response> {
  await requireAdminSession(request, env);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
  }

  const parsed = UpdateMenuItemRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ApiHttpError(400, "invalid_item", parsed.error.issues[0]?.message ?? "მენიუს პროდუქტის განახლება ვერ მოხერხდა.");
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (parsed.data.name !== undefined) {
    fields.push("name = ?");
    values.push(parsed.data.name);
  }
  if (parsed.data.description !== undefined) {
    fields.push("description = ?");
    values.push(parsed.data.description);
  }
  if (parsed.data.ingredients !== undefined) {
    fields.push("ingredients = ?");
    values.push(JSON.stringify(parsed.data.ingredients));
  }
  if (parsed.data.priceMinor !== undefined) {
    fields.push("price_minor = ?");
    values.push(parsed.data.priceMinor);
  }
  if (parsed.data.imageUrl !== undefined) {
    fields.push("image_url = ?");
    values.push(parsed.data.imageUrl);
  }
  if (parsed.data.sortOrder !== undefined) {
    fields.push("sort_order = ?");
    values.push(parsed.data.sortOrder);
  }
  if (parsed.data.isAvailable !== undefined) {
    fields.push("is_available = ?");
    values.push(parsed.data.isAvailable ? 1 : 0);
  }
  if (parsed.data.isArchived !== undefined) {
    fields.push("is_archived = ?");
    values.push(parsed.data.isArchived ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new ApiHttpError(400, "no_fields", "ვერცერთი ცვლადი ველი არ არის მითითებული.");
  }

  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(itemId);

  const result = await env.DB.prepare(`UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  if (result.meta.changes === 0) {
    throw new ApiHttpError(404, "item_not_found", "მენიუს პროდუქტი ვერ მოიძებნა.");
  }

  return jsonResponse({ ok: true });
}

// ---------- Image upload ----------

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function postAdminMenuImage(request: Request, env: Env): Promise<Response> {
  await requireAdminSession(request, env);

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new ApiHttpError(
      400,
      "invalid_image_type",
      "Image must be JPEG, PNG, or WebP."
    );
  }

  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new ApiHttpError(400, "image_too_large", "სურათი უნდა იყოს 5 მბ-ზე ნაკლები.");
  }

  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `menu-items/${newId("img")}.${extension}`;

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_IMAGE_BYTES) {
    throw new ApiHttpError(400, "image_too_large", "სურათი უნდა იყოს 5 მბ-ზე ნაკლები.");
  }

  await env.MENU_IMAGES.put(key, body, {
    httpMetadata: { contentType },
  });

  const publicUrl = `${env.MENU_IMAGES_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

  return jsonResponse({ imageUrl: publicUrl }, { status: 201 });
}
