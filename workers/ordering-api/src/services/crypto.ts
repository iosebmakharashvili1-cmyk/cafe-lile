const PBKDF2_ITERATIONS = 210_000;
const HASH_BYTE_LEN = 32;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomSaltBase64Url(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64Url(bytes);
}

/** Derives a PBKDF2 hash for a password given a base64url salt. Returns base64url digest. */
export async function derivePasswordHash(password: string, saltBase64Url: string): Promise<string> {
  // Hard cap on input length before derivation (OWASP guidance, blueprint section 5).
  const clipped = password.slice(0, 256);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(clipped),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const salt = fromBase64Url(saltBase64Url);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_BYTE_LEN * 8
  );
  return toBase64Url(new Uint8Array(derivedBits));
}

/** Constant-time comparison of two base64url digests. */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = fromBase64Url(a);
  const bBytes = fromBase64Url(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= (aBytes[i] as number) ^ (bBytes[i] as number);
  }
  return diff === 0;
}

/** Generates a cryptographically random opaque session token (raw, given to client once). */
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

/** SHA-256 hash of the session token (with pepper), stored server-side instead of the raw token. */
export async function hashSessionToken(rawToken: string, pepper: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(rawToken + pepper));
  return toBase64Url(new Uint8Array(digest));
}

/** HMAC-based hash of an IP address for privacy-preserving rate-limit/audit identifiers. */
export async function hashIp(ip: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(ip));
  return toBase64Url(new Uint8Array(sig));
}
