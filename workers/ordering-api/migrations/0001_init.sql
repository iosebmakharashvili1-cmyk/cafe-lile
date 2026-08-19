PRAGMA foreign_keys = ON;

CREATE TABLE menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1)),
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_menu_items_public
  ON menu_items(category_id, is_archived, is_available, sort_order);

CREATE TABLE restaurant_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  restaurant_name TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  pickup_instructions TEXT NOT NULL,
  timezone TEXT NOT NULL,
  accepting_orders INTEGER NOT NULL DEFAULT 1 CHECK (accepting_orders IN (0, 1)),
  default_prep_minutes INTEGER NOT NULL DEFAULT 15 CHECK (default_prep_minutes > 0),
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN (
    'new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
  )),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_note TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method = 'cash_pickup'),
  payment_status TEXT NOT NULL CHECK (payment_status = 'unpaid'),
  currency_code TEXT NOT NULL,
  subtotal_minor INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  placed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  accepted_at TEXT,
  ready_at TEXT,
  completed_at TEXT
) STRICT;

CREATE INDEX idx_orders_active
  ON orders(status, placed_at DESC);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  menu_item_id TEXT,
  item_name_snapshot TEXT NOT NULL,
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  line_total_minor INTEGER NOT NULL CHECK (line_total_minor >= 0)
) STRICT;

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_changed')),
  from_status TEXT,
  to_status TEXT,
  actor TEXT NOT NULL CHECK (actor IN ('customer', 'admin')),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_order_events_order ON order_events(order_id, created_at);

CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES admin_users(id),
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_hash TEXT,
  revoked_at TEXT
) STRICT;

CREATE INDEX idx_admin_sessions_expiry ON admin_sessions(expires_at);

-- Seed row: restaurant_settings must always have id = 1
INSERT INTO restaurant_settings (
  id, restaurant_name, currency_code, pickup_instructions, timezone,
  accepting_orders, default_prep_minutes, updated_at
) VALUES (
  1, 'Cafe Lile', 'GEL', 'Come to the counter and give your name and order reference.',
  'Asia/Tbilisi', 1, 15, datetime('now')
);
