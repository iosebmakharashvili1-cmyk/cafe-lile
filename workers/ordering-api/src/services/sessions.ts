import type { Env } from "../env";
import { hashSessionToken, generateSessionToken } from "./crypto";
import { newId, nowIso } from "../lib/http";

const IDLE_LIMIT_MINUTES = 30;
const ABSOLUTE_LIMIT_HOURS = 8;
export const SESSION_COOKIE_NAME = "__Host-admin_session";

export interface AdminSession {
  tokenHash: string;
  adminUserId: string;
  expiresAt: string;
}

export async function createSession(
  env: Env,
  adminUserId: string,
  ipHash: string | null
): Promise<{ rawToken: string; expiresAt: string }> {
  const rawToken = generateSessionToken();
  const tokenHash = await hashSessionToken(rawToken, env.SESSION_TOKEN_HASH_PEPPER);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ABSOLUTE_LIMIT_HOURS * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO admin_sessions (token_hash, admin_user_id, created_at, last_seen_at, expires_at, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(tokenHash, adminUserId, nowIso(), nowIso(), expiresAt, ipHash)
    .run();

  return { rawToken, expiresAt };
}

/** Validates a raw cookie token; returns the session + admin user info, or null if invalid/expired/idle-timed-out. */
export async function validateSession(
  env: Env,
  rawToken: string
): Promise<{ adminUserId: string; displayName: string; expiresAt: string } | null> {
  const tokenHash = await hashSessionToken(rawToken, env.SESSION_TOKEN_HASH_PEPPER);

  const row = await env.DB.prepare(
    `SELECT s.admin_user_id as adminUserId, s.last_seen_at as lastSeenAt, s.expires_at as expiresAt,
            s.revoked_at as revokedAt, u.display_name as displayName, u.is_active as isActive
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.token_hash = ?`
  )
    .bind(tokenHash)
    .first<{
      adminUserId: string;
      lastSeenAt: string;
      expiresAt: string;
      revokedAt: string | null;
      displayName: string;
      isActive: number;
    }>();

  if (!row) return null;
  if (row.revokedAt) return null;
  if (!row.isActive) return null;

  const now = Date.now();
  if (now > new Date(row.expiresAt).getTime()) return null;

  const idleDeadline = new Date(row.lastSeenAt).getTime() + IDLE_LIMIT_MINUTES * 60 * 1000;
  if (now > idleDeadline) return null;

  // Refresh last_seen_at (idle window slides forward on successful admin requests).
  await env.DB.prepare(`UPDATE admin_sessions SET last_seen_at = ? WHERE token_hash = ?`)
    .bind(nowIso(), tokenHash)
    .run();

  return { adminUserId: row.adminUserId, displayName: row.displayName, expiresAt: row.expiresAt };
}

export async function revokeSession(env: Env, rawToken: string): Promise<void> {
  const tokenHash = await hashSessionToken(rawToken, env.SESSION_TOKEN_HASH_PEPPER);
  await env.DB.prepare(`UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ?`)
    .bind(nowIso(), tokenHash)
    .run();
}

export function sessionCookieHeader(rawToken: string, expiresAt: string): string {
  const maxAgeSeconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
  return `${SESSION_COOKIE_NAME}=${rawToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function readSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!match) return null;
  return match.substring(SESSION_COOKIE_NAME.length + 1);
}

// newId re-exported for convenience where session-adjacent ids are needed
export { newId };
