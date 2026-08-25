import type {
  AdminLoginRequest,
  AdminSessionInfo,
  OrderStatus,
} from "@cafe-lile/contracts";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const code = body?.error?.code ?? "unknown_error";
    const message = body?.error?.message ?? "Something went wrong.";
    throw new ApiError(code, message, res.status);
  }
  return res.json();
}

function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  }).then(handleResponse<T>);
}

export function login(body: AdminLoginRequest): Promise<AdminSessionInfo> {
  return request("/v1/admin/auth/login", { method: "POST", body: JSON.stringify(body) });
}

export function logout(): Promise<{ ok: boolean }> {
  return request("/v1/admin/auth/logout", { method: "POST" });
}

export function getSession(): Promise<AdminSessionInfo> {
  return request("/v1/admin/auth/session");
}

export interface AdminOrderItem {
  id: string;
  menuItemId: string | null;
  itemNameSnapshot: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
  /** Ingredients the customer asked to leave out of this dish. */
  excludedIngredients: string[];
}

export interface AdminOrderRow {
  id: string;
  reference: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string | null;
  customerNote: string | null;
  fulfillmentMethod: "pickup" | "delivery";
  deliveryAddress: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  currencyCode: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  placedAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
}

export async function getActiveOrders(): Promise<{ orders: AdminOrderRow[] }> {
  const res = await request<{ orders: AdminOrderRow[] }>("/v1/admin/orders");
  // Defensive normalization: an older deployed Worker may omit excludedIngredients
  // (the field was added in migration 0004). Never let a missing field crash the board.
  return {
    orders: (res.orders ?? []).map((o) => ({
      ...o,
      items: (o.items ?? []).map((i) => ({
        ...i,
        excludedIngredients: Array.isArray(i.excludedIngredients) ? i.excludedIngredients : [],
      })),
    })),
  };
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ status: OrderStatus }> {
  return request(`/v1/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface AdminSettings {
  restaurantName: string;
  currencyCode: string;
  pickupInstructions: string;
  timezone: string;
  acceptingOrders: number;
  defaultPrepMinutes: number;
}

export function getSettings(): Promise<{ settings: AdminSettings }> {
  return request("/v1/admin/settings");
}

export function updateSettings(patch: Partial<{
  acceptingOrders: boolean;
  pickupInstructions: string;
  defaultPrepMinutes: number;
}>): Promise<{ ok: boolean }> {
  return request("/v1/admin/settings", { method: "PATCH", body: JSON.stringify(patch) });
}

// ---------- Menu management ----------

export interface AdminMenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface AdminMenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  ingredients: string[];
  priceMinor: number;
  imageUrl: string | null;
  sortOrder: number;
  isAvailable: boolean;
  isArchived: boolean;
}

export function getAdminMenu(): Promise<{ categories: AdminMenuCategory[]; items: AdminMenuItem[] }> {
  return request("/v1/admin/menu");
}

export function createCategory(body: { name: string; sortOrder?: number }): Promise<{ category: AdminMenuCategory }> {
  return request("/v1/admin/menu/categories", { method: "POST", body: JSON.stringify(body) });
}

export function updateCategory(
  id: string,
  patch: Partial<{ name: string; sortOrder: number; isVisible: boolean }>
): Promise<{ ok: boolean }> {
  return request(`/v1/admin/menu/categories/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function createMenuItem(body: {
  categoryId: string;
  name: string;
  description?: string;
  ingredients?: string[];
  priceMinor: number;
  imageUrl?: string;
  sortOrder?: number;
}): Promise<{ item: AdminMenuItem }> {
  return request("/v1/admin/menu/items", { method: "POST", body: JSON.stringify(body) });
}

export async function uploadMenuImage(file: File): Promise<{ imageUrl: string }> {
  const res = await fetch(`${API_BASE}/v1/admin/menu/images`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": file.type },
    body: file,
  });
  return handleResponse(res);
}

export function updateMenuItem(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    ingredients: string[];
    priceMinor: number;
    imageUrl: string;
    sortOrder: number;
    isAvailable: boolean;
    isArchived: boolean;
  }>
): Promise<{ ok: boolean }> {
  return request(`/v1/admin/menu/items/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}
