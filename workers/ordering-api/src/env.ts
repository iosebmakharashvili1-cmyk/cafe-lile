export interface Env {
  DB: D1Database;
  MENU_IMAGES: R2Bucket;
  ALLOWED_PUBLIC_ORIGIN: string;
  ALLOWED_ADMIN_ORIGIN: string;
  MENU_IMAGES_PUBLIC_URL: string;
  SESSION_TOKEN_HASH_PEPPER: string;
  IP_HASH_KEY: string;
}
