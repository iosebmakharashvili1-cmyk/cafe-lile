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
}

export interface AdminOrderRow {
  id: string;
  reference: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string | null;
  customerNote: string | null;
  currencyCode: string;
  subtotalMinor: number;
  totalMinor: number;
  placedAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
}

export function getActiveOrders(): Promise<{ orders: AdminOrderRow[] }> {
  return request("/v1/admin/orders");
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
