import type { Env } from "../env";

/**
 * Exact-origin CORS. Never uses "*".
 * - Public routes: only ALLOWED_PUBLIC_ORIGIN
 * - Admin routes: only ALLOWED_ADMIN_ORIGIN, with credentials + Vary: Origin
 */
export function corsHeadersFor(
  origin: string | null,
  allowedOrigin: string,
  withCredentials: boolean
): Record<string, string> {
  if (origin !== allowedOrigin) {
    // No CORS headers for disallowed origins -> browser blocks the response.
    return {};
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
  };

  if (withCredentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function isPreflight(request: Request): boolean {
  return request.method === "OPTIONS";
}

export function handlePreflight(
  request: Request,
  allowedOrigin: string,
  withCredentials: boolean
): Response {
  const origin = request.headers.get("Origin");
  const headers = corsHeadersFor(origin, allowedOrigin, withCredentials);
  return new Response(null, { status: 204, headers });
}

/** Reject state-changing admin requests with a missing/unexpected Origin (CSRF defense). */
export function assertAdminOriginForMutation(request: Request, env: Env): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("Origin");
  if (origin !== env.ALLOWED_ADMIN_ORIGIN) {
    throw new Error("origin_rejected");
  }
}
