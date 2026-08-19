// Generates a PBKDF2 password hash + salt matching the Worker's auth scheme
// (see workers/ordering-api/src/services/crypto.ts), so you can seed an admin
// user directly into D1 without ever storing a plaintext password.
//
// Usage:
//   node scripts/hash-password.mjs "your-strong-password-here"
//
// It prints a ready-to-run `wrangler d1 execute` INSERT statement.

import { webcrypto as crypto } from "node:crypto";

const PBKDF2_ITERATIONS = 210_000;
const HASH_BYTE_LEN = 32;

function toBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return Buffer.from(binary, "binary").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomSaltBase64Url() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64Url(bytes);
}

async function derivePasswordHash(password, saltBase64Url) {
  const clipped = password.slice(0, 256);
  const enc = new TextEncoder();
  const saltBinary = Buffer.from(
    saltBase64Url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (saltBase64Url.length % 4)) % 4),
    "base64"
  );
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(clipped), "PBKDF2", false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBinary, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BYTE_LEN * 8
  );
  return toBase64Url(new Uint8Array(derivedBits));
}

const password = process.argv[2];
const username = process.argv[3] || "soso";
const displayName = process.argv[4] || "Soso";

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password> [username] [displayName]");
  process.exit(1);
}

if (password.length < 12) {
  console.error("Use a password of at least 12 characters — this is a privileged staff credential.");
  process.exit(1);
}

const salt = randomSaltBase64Url();
const hash = await derivePasswordHash(password, salt);
const id = "admin_" + crypto.randomUUID().replace(/-/g, "");

console.log("\n--- Generated credential (store the password somewhere safe, it is not recoverable) ---\n");
console.log(`Username:     ${username}`);
console.log(`Display name: ${displayName}`);
console.log(`\nRun this to seed it into your D1 database:\n`);
console.log(
  `npx wrangler d1 execute ordering-staging --local --command "INSERT INTO admin_users (id, username, password_hash, password_salt, display_name, is_active, created_at) VALUES ('${id}', '${username}', '${hash}', '${salt}', '${displayName}', 1, datetime('now'));"`
);
console.log(`\nFor production, swap --local for --remote --env production and the database name for ordering-prod.\n`);
