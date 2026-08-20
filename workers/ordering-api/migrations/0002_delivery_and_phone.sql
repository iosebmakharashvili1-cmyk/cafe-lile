-- Add delivery fee tracking and precise delivery coordinates for map-based checkout.
ALTER TABLE orders ADD COLUMN delivery_fee_minor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_latitude REAL;
ALTER TABLE orders ADD COLUMN delivery_longitude REAL;

-- fulfillment_method was always part of the contract (pickup vs delivery) but
-- was never actually persisted as a column — add it now. Default existing
-- rows to 'pickup' since that's what v1 originally assumed exclusively.
ALTER TABLE orders ADD COLUMN fulfillment_method TEXT NOT NULL DEFAULT 'pickup'
  CHECK (fulfillment_method IN ('pickup', 'delivery'));

-- customer_phone becomes conceptually required going forward (enforced at the
-- application layer, since SQLite ALTER TABLE cannot add a NOT NULL column
-- without a default to an existing table with data). Existing rows keep
-- their current value; new rows are validated as required by the Worker.
