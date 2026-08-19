#!/usr/bin/env node
/**
 * Generates a PBKDF2 password hash + salt matching the Worker's derivePasswordHash().
 * Prints ready-to-run SQL to insert (or update) an admin user.
 *
 * Usage:
 *   node scripts/create-admin.mjs <username> <password> <display-name>
 *
 * Example:
 *   node scripts/create-admin.mjs soso "correct horse battery staple" "Soso"
 */

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
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(clipped), "PBKDF2", false, ["deriveBits"]);

  const b64 = saltBase64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const salt = Uint8Array.from(Buffer.from(padded, "base64"));

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BYTE_LEN * 8
  );
  return toBase64Url(new Uint8Array(derivedBits));
}

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

async function main() {
  const [username, password, displayName] = process.argv.slice(2);

  if (!username || !password || !displayName) {
    console.error("Usage: node scripts/create-admin.mjs <username> <password> <display-name>");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Password should be at least 12 characters — this is a real staff login.");
    process.exit(1);
  }

  const salt = randomSaltBase64Url();
  const hash = await derivePasswordHash(password, salt);
  const id = newId("admin");

  const sql = `INSERT INTO admin_users (id, username, password_hash, password_salt, display_name, is_active, created_at)
VALUES ('${id}', '${username.replace(/'/g, "''")}', '${hash}', '${salt}', '${displayName.replace(/'/g, "''")}', 1, datetime('now'));`;

  console.log("\n-- Save this SQL, then run it against your D1 database:\n");
  console.log(sql);
  console.log("\n-- Example:");
  console.log(`--   npx wrangler d1 execute ordering-staging --local --command "${sql.replace(/"/g, '\\"')}"`);
  console.log(`--   npx wrangler d1 execute ordering-prod --remote --command "${sql.replace(/"/g, '\\"')}"`);
  console.log("\nPassword is not stored anywhere — only the derived hash above. Keep the password itself somewhere safe (password manager), it cannot be recovered from the hash.\n");
}

main();
