import type { PublicMenuResponse, CreateOrderRequest, CreateOrderResponse } from "@cafe-lile/contracts";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const code = body?.error?.code ?? "unknown_error";
    const message = body?.error?.message ?? "დაფიქსირდა შეცდომა. გთხოვთ, სცადოთ თავიდან.";
    throw new ApiError(code, message);
  }
  return res.json();
}

export async function fetchMenu(): Promise<PublicMenuResponse> {
  const res = await fetch(`${API_BASE}/v1/public/menu`);
  return handleResponse<PublicMenuResponse>(res);
}

export async function submitOrder(
  body: CreateOrderRequest,
  idempotencyKey: string
): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/v1/public/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  return handleResponse<CreateOrderResponse>(res);
}
