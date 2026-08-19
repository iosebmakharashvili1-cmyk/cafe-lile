import type { Env } from "../env";
import { ApiHttpError } from "../lib/http";
import { readSessionCookie, validateSession } from "../services/sessions";

export interface AuthedContext {
  adminUserId: string;
  displayName: string;
}

export async function requireAdminSession(request: Request, env: Env): Promise<AuthedContext> {
  const rawToken = readSessionCookie(request);
  if (!rawToken) {
    throw new ApiHttpError(401, "unauthenticated", "Sign in required.");
  }

  const session = await validateSession(env, rawToken);
  if (!session) {
    throw new ApiHttpError(401, "session_invalid", "Session expired or invalid. Please sign in again.");
  }

  return { adminUserId: session.adminUserId, displayName: session.displayName };
}
