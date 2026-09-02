import type { Env } from "../env";
import { CreateOrderRequestSchema } from "@cafe-lile/contracts";
import { ApiHttpError, jsonResponse } from "../lib/http";
import { createOrder } from "../services/orders";

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

export async function getPublicMenu(env: Env): Promise<Response> {
  const settings = await env.DB.prepare(
    `SELECT restaurant_name as restaurantName, currency_code as currencyCode,
            pickup_instructions as pickupInstructions, accepting_orders as acceptingOrders,
            default_prep_minutes as defaultPrepMinutes
     FROM restaurant_settings WHERE id = 1`
  ).first<{
    restaurantName: string;
    currencyCode: string;
    pickupInstructions: string;
    acceptingOrders: number;
    defaultPrepMinutes: number;
  }>();

  if (!settings) {
    throw new ApiHttpError(500, "settings_missing", "რესტორნის პარამეტრები არ არის კონფიგურირებული.");
  }

  const { results: categories } = await env.DB.prepare(
    `SELECT id, name, sort_order as sortOrder, is_visible as isVisible
     FROM menu_categories WHERE is_visible = 1 ORDER BY sort_order ASC`
  ).all<{ id: string; name: string; sortOrder: number; isVisible: number }>();

  const { results: items } = await env.DB.prepare(
    `SELECT id, category_id as categoryId, name, description, ingredients,
            price_minor as priceMinor, image_url as imageUrl, sort_order as sortOrder,
            is_available as isAvailable, is_archived as isArchived
     FROM menu_items WHERE is_archived = 0 AND is_available = 1 ORDER BY sort_order ASC`
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
    settings: {
      restaurantName: settings.restaurantName,
      currencyCode: settings.currencyCode,
      pickupInstructions: settings.pickupInstructions,
      acceptingOrders: Boolean(settings.acceptingOrders),
      defaultPrepMinutes: settings.defaultPrepMinutes,
    },
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

export async function postPublicOrder(request: Request, env: Env): Promise<Response> {
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 200) {
    throw new ApiHttpError(400, "missing_idempotency_key", "საჭიროა Idempotency-Key სათაური.");
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    throw new ApiHttpError(400, "invalid_json", "მოთხოვნის ფორმატი არასწორია.");
  }

  const parsed = CreateOrderRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ApiHttpError(400, "invalid_order", parsed.error.issues[0]?.message ?? "შეკვეთის მონაცემები არასწორია.");
  }

  // Delivery-location requirement for delivery orders is enforced inside createOrder().

  const result = await createOrder(env, parsed.data, idempotencyKey);
  return jsonResponse(result, { status: 201 });
}
