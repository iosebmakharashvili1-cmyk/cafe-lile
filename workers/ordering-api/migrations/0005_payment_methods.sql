-- Relax the payment_method CHECK constraint to allow both cash and card payments.
-- SQLite does not support ALTER TABLE ... ALTER COLUMN for CHECK constraints,
-- so we rebuild the orders table with the updated constraint.

PRAGMA foreign_keys = OFF;

CREATE TABLE orders_new (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN (
    'new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
  )),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_note TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid')),
  currency_code TEXT NOT NULL,
  subtotal_minor INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  delivery_fee_minor INTEGER NOT NULL DEFAULT 0,
  delivery_address TEXT,
  delivery_latitude REAL,
  delivery_longitude REAL,
  fulfillment_method TEXT NOT NULL DEFAULT 'pickup'
    CHECK (fulfillment_method IN ('pickup', 'delivery')),
  idempotency_key TEXT NOT NULL UNIQUE,
  placed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  accepted_at TEXT,
  ready_at TEXT,
  completed_at TEXT
) STRICT;

-- Migrate data: convert old 'cash_pickup' value to new 'cash' value.
INSERT INTO orders_new (
  id, reference, status, customer_name, customer_phone, customer_note,
  payment_method, payment_status, currency_code, subtotal_minor, total_minor,
  delivery_fee_minor, delivery_address, delivery_latitude, delivery_longitude,
  fulfillment_method, idempotency_key, placed_at, updated_at,
  accepted_at, ready_at, completed_at
)
SELECT
  id, reference, status, customer_name, customer_phone, customer_note,
  'cash' AS payment_method,
  'unpaid' AS payment_status,
  currency_code, subtotal_minor, total_minor,
  delivery_fee_minor, delivery_address, delivery_latitude, delivery_longitude,
  fulfillment_method, idempotency_key, placed_at, updated_at,
  accepted_at, ready_at, completed_at
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;

CREATE INDEX idx_orders_active
  ON orders(status, placed_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE INDEX idx_order_events_order ON order_events(order_id, created_at);

CREATE INDEX idx_admin_sessions_expiry ON admin_sessions(expires_at);

PRAGMA foreign_keys = ON;
