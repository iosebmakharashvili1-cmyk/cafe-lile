import type { Env } from "./env";
import { ApiHttpError, errorResponse, newRequestId } from "./lib/http";
import { corsHeadersFor, isPreflight, handlePreflight, assertAdminOriginForMutation } from "./middleware/cors";
import { getPublicMenu, postPublicOrder } from "./routes/public";
import {
  postAdminLogin,
  postAdminLogout,
  getAdminSession,
  getAdminActiveOrders,
  patchAdminOrderStatus,
  getAdminSettings,
  patchAdminSettings,
  getAdminMenu,
  postAdminCategory,
  patchAdminCategory,
  postAdminMenuItem,
  patchAdminMenuItem,
} from "./routes/admin";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = newRequestId();
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get("Origin");

    const isAdminRoute = path.startsWith("/v1/admin/");
    const allowedOrigin = isAdminRoute ? env.ALLOWED_ADMIN_ORIGIN : env.ALLOWED_PUBLIC_ORIGIN;
    const withCredentials = isAdminRoute;

    if (isPreflight(request)) {
      return handlePreflight(request, allowedOrigin, withCredentials);
    }

    const corsHeaders = corsHeadersFor(origin, allowedOrigin, withCredentials);

    try {
      if (isAdminRoute) {
        try {
          assertAdminOriginForMutation(request, env);
        } catch {
          throw new ApiHttpError(403, "origin_rejected", "Request origin not permitted.");
        }
      }

      const response = await route(request, env, path);
      // Attach CORS headers to the actual response too.
      for (const [k, v] of Object.entries(corsHeaders)) {
        response.headers.set(k, v);
      }
      return response;
    } catch (err) {
      const httpErr =
        err instanceof ApiHttpError
          ? err
          : new ApiHttpError(500, "internal_error", "Something went wrong. Please try again.");
      if (!(err instanceof ApiHttpError)) {
        console.error(`[${requestId}]`, err);
      }
      return errorResponse(httpErr, requestId, corsHeaders);
    }
  },
};

async function route(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method;

  // ---------- Public ----------
  if (method === "GET" && path === "/v1/public/menu") {
    return getPublicMenu(env);
  }
  if (method === "POST" && path === "/v1/public/orders") {
    return postPublicOrder(request, env);
  }

  // ---------- Admin: auth ----------
  if (method === "POST" && path === "/v1/admin/auth/login") {
    return postAdminLogin(request, env);
  }
  if (method === "POST" && path === "/v1/admin/auth/logout") {
    return postAdminLogout(request, env);
  }
  if (method === "GET" && path === "/v1/admin/auth/session") {
    return getAdminSession(request, env);
  }

  // ---------- Admin: orders ----------
  if (method === "GET" && path === "/v1/admin/orders") {
    return getAdminActiveOrders(request, env);
  }
  const statusMatch = path.match(/^\/v1\/admin\/orders\/([^/]+)\/status$/);
  if (method === "PATCH" && statusMatch && statusMatch[1]) {
    return patchAdminOrderStatus(request, env, statusMatch[1]);
  }

  // ---------- Admin: settings ----------
  if (method === "GET" && path === "/v1/admin/settings") {
    return getAdminSettings(request, env);
  }
  if (method === "PATCH" && path === "/v1/admin/settings") {
    return patchAdminSettings(request, env);
  }

  // ---------- Admin: menu management ----------
  if (method === "GET" && path === "/v1/admin/menu") {
    return getAdminMenu(request, env);
  }
  if (method === "POST" && path === "/v1/admin/menu/categories") {
    return postAdminCategory(request, env);
  }
  const categoryMatch = path.match(/^\/v1\/admin\/menu\/categories\/([^/]+)$/);
  if (method === "PATCH" && categoryMatch && categoryMatch[1]) {
    return patchAdminCategory(request, env, categoryMatch[1]);
  }
  if (method === "POST" && path === "/v1/admin/menu/items") {
    return postAdminMenuItem(request, env);
  }
  const itemMatch = path.match(/^\/v1\/admin\/menu\/items\/([^/]+)$/);
  if (method === "PATCH" && itemMatch && itemMatch[1]) {
    return patchAdminMenuItem(request, env, itemMatch[1]);
  }

  throw new ApiHttpError(404, "not_found", "No such endpoint.");
}
