-- Widen payment_method to support card-at-delivery (BOG / TBC POS terminal
-- carried by the courier or presented at the counter). Existing 'cash_pickup'
-- rows map to the new generic 'cash' value.
ALTER TABLE orders RENAME TO orders_old;

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN (
    'new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'
  )),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_note TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card_on_delivery')),
  payment_status TEXT NOT NULL CHECK (payment_status = 'unpaid'),
  currency_code TEXT NOT NULL,
  subtotal_minor INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  placed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  accepted_at TEXT,
  ready_at TEXT,
  completed_at TEXT,
  delivery_fee_minor INTEGER NOT NULL DEFAULT 0,
  delivery_address TEXT,
  delivery_latitude REAL,
  delivery_longitude REAL,
  fulfillment_method TEXT NOT NULL DEFAULT 'pickup'
    CHECK (fulfillment_method IN ('pickup', 'delivery'))
) STRICT;

INSERT INTO orders (
  id, reference, status, customer_name, customer_phone, customer_note,
  payment_method, payment_status, currency_code, subtotal_minor,
  total_minor, idempotency_key, placed_at, updated_at, accepted_at,
  ready_at, completed_at, delivery_fee_minor, delivery_address,
  delivery_latitude, delivery_longitude, fulfillment_method
)
SELECT
  id, reference, status, customer_name, customer_phone, customer_note,
  CASE WHEN payment_method = 'cash_pickup' THEN 'cash' ELSE payment_method END,
  payment_status, currency_code, subtotal_minor,
  total_minor, idempotency_key, placed_at, updated_at, accepted_at,
  ready_at, completed_at,
  COALESCE(delivery_fee_minor, 0), delivery_address,
  delivery_latitude, delivery_longitude, fulfillment_method
FROM orders_old;

DROP TABLE orders_old;

-- Recreate the index dropped with the old table.
CREATE INDEX idx_orders_active ON orders(status, placed_at DESC);
