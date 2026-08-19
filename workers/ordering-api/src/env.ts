export interface Env {
  DB: D1Database;
  ALLOWED_PUBLIC_ORIGIN: string;
  ALLOWED_ADMIN_ORIGIN: string;
  SESSION_TOKEN_HASH_PEPPER: string;
  IP_HASH_KEY: string;
}
