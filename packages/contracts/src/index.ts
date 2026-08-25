import { z } from "zod";

// ---------- Order status ----------

export const ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Legal status transitions, enforced server-side only (see blueprint section 4.2)
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ---------- Menu ----------

export const MenuItemSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()),
  priceMinor: z.number().int().nonnegative(),
  imageUrl: z.string().nullable(),
  sortOrder: z.number().int(),
  isAvailable: z.boolean(),
  isArchived: z.boolean(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
});
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const RestaurantSettingsPublicSchema = z.object({
  restaurantName: z.string(),
  currencyCode: z.string(),
  pickupInstructions: z.string(),
  acceptingOrders: z.boolean(),
  defaultPrepMinutes: z.number().int().positive(),
});
export type RestaurantSettingsPublic = z.infer<typeof RestaurantSettingsPublicSchema>;

export const PublicMenuResponseSchema = z.object({
  settings: RestaurantSettingsPublicSchema,
  categories: z.array(MenuCategorySchema),
  items: z.array(MenuItemSchema),
});
export type PublicMenuResponse = z.infer<typeof PublicMenuResponseSchema>;

// ---------- Menu management (admin) ----------

export const CreateCategoryRequestSchema = z.object({
  name: z.string().trim().min(1).max(60),
  sortOrder: z.number().int().optional(),
});
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

export const UpdateCategoryRequestSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
});
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

export const CreateMenuItemRequestSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(280).optional(),
  ingredients: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  priceMinor: z.number().int().nonnegative(),
  imageUrl: z.string().trim().url().optional(),
  sortOrder: z.number().int().optional(),
});
export type CreateMenuItemRequest = z.infer<typeof CreateMenuItemRequestSchema>;

export const UpdateMenuItemRequestSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(280).optional(),
  ingredients: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  priceMinor: z.number().int().nonnegative().optional(),
  imageUrl: z.string().trim().url().optional(),
  sortOrder: z.number().int().optional(),
  isAvailable: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});
export type UpdateMenuItemRequest = z.infer<typeof UpdateMenuItemRequestSchema>;

// ---------- Delivery zones ----------

export interface DeliveryZone {
  name: string;
  latitude: number;
  longitude: number;
  feeMinor: number;
}

// Village centroids (OpenStreetMap data). Cafe Lile sits in Mukhrani;
// the delivery fee is decided by which village area the customer's pin falls in.
export const DELIVERY_ZONES: DeliveryZone[] = [
  { name: "Mukhrani", latitude: 41.93389, longitude: 44.57667, feeMinor: 200 },
  { name: "Ksovrisi", latitude: 41.98667, longitude: 44.51903, feeMinor: 600 },
  { name: "Dzalisi", latitude: 41.9621, longitude: 44.5979, feeMinor: 600 },
  { name: "Vaziani", latitude: 41.96694, longitude: 44.56556, feeMinor: 600 },
  { name: "Vardisubani", latitude: 41.94895, longitude: 44.53962, feeMinor: 600 },
  { name: "Iltoza", latitude: 42.00853, longitude: 44.53684, feeMinor: 700 },
  { name: "Odzisi", latitude: 42.04571, longitude: 44.49999, feeMinor: 700 },
];

// Pins farther than this from every village centroid count as out-of-area.
export const DELIVERY_ZONE_RADIUS_KM = 4;
export const OUT_OF_AREA_DELIVERY_FEE_MINOR = 700; // highest zone fee

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Resolves the delivery fee for a pinned location. Pure + shared so the client
 * can preview exactly what the server will charge (the server re-runs this on
 * every order — its result is authoritative).
 */
export function resolveDeliveryZone(
  latitude: number,
  longitude: number
): { zone: DeliveryZone | null; feeMinor: number } {
  let best: DeliveryZone | null = null;
  let bestKm = Infinity;
  for (const zone of DELIVERY_ZONES) {
    const km = haversineKm(latitude, longitude, zone.latitude, zone.longitude);
    if (km < bestKm) {
      bestKm = km;
      best = zone;
    }
  }
  if (best && bestKm <= DELIVERY_ZONE_RADIUS_KM) {
    return { zone: best, feeMinor: best.feeMinor };
  }
  return { zone: null, feeMinor: OUT_OF_AREA_DELIVERY_FEE_MINOR };
}

// ---------- Orders: customer-facing ----------

// The customer may ONLY propose item id + quantity (+ which ingredients to leave out).
// Price, availability, totals, status are always server-decided (blueprint section 4.1).
export const OrderLineRequestSchema = z.object({
  menuItemId: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(20),
  // Ingredients the customer wants removed from this dish. Server validates
  // these against the item's actual ingredient list before persisting.
  excludedIngredients: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
});
export type OrderLineRequest = z.infer<typeof OrderLineRequestSchema>;

export const FulfillmentMethodSchema = z.enum(["pickup", "delivery"]);
export type FulfillmentMethod = z.infer<typeof FulfillmentMethodSchema>;

export const DeliveryLocationSchema = z.object({
  address: z.string().trim().min(1).max(240),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type DeliveryLocation = z.infer<typeof DeliveryLocationSchema>;

export const CreateOrderRequestSchema = z.object({
  customerName: z.string().trim().min(1).max(80),
  customerPhone: z.string().trim().min(4).max(30),
  customerNote: z.string().trim().max(280).optional(),
  fulfillmentMethod: FulfillmentMethodSchema,
  deliveryLocation: DeliveryLocationSchema.optional(),
  lines: z.array(OrderLineRequestSchema).min(1).max(40),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const CreateOrderResponseSchema = z.object({
  order: z.object({
    reference: z.string(),
    status: z.enum(ORDER_STATUSES),
    subtotalMinor: z.number().int(),
    deliveryFeeMinor: z.number().int(),
    totalMinor: z.number().int(),
    currencyCode: z.string(),
    placedAt: z.string(),
    pickupInstructions: z.string(),
    fulfillmentMethod: FulfillmentMethodSchema,
  }),
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

// ---------- Orders: admin-facing ----------

export const OrderItemSchema = z.object({
  id: z.string(),
  menuItemId: z.string().nullable(),
  itemNameSnapshot: z.string(),
  unitPriceMinor: z.number().int(),
  quantity: z.number().int(),
  lineTotalMinor: z.number().int(),
  excludedIngredients: z.array(z.string()),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const AdminOrderSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: z.enum(ORDER_STATUSES),
  customerName: z.string(),
  customerPhone: z.string().nullable(),
  customerNote: z.string().nullable(),
  fulfillmentMethod: FulfillmentMethodSchema,
  deliveryAddress: z.string().nullable(),
  deliveryLatitude: z.number().nullable(),
  deliveryLongitude: z.number().nullable(),
  currencyCode: z.string(),
  subtotalMinor: z.number().int(),
  deliveryFeeMinor: z.number().int(),
  totalMinor: z.number().int(),
  placedAt: z.string(),
  updatedAt: z.string(),
  items: z.array(OrderItemSchema),
});
export type AdminOrder = z.infer<typeof AdminOrderSchema>;

export const UpdateOrderStatusRequestSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;

// ---------- Admin auth ----------

export const AdminLoginRequestSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});
export type AdminLoginRequest = z.infer<typeof AdminLoginRequestSchema>;

export const AdminSessionInfoSchema = z.object({
  displayName: z.string(),
  expiresAt: z.string(),
});
export type AdminSessionInfo = z.infer<typeof AdminSessionInfoSchema>;

// ---------- Errors ----------

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
