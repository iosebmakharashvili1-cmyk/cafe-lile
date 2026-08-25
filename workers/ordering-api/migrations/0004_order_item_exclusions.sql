-- Per-line ingredient exclusions chosen by the customer at checkout,
-- stored as a JSON array of strings (same convention as menu_items.ingredients).
ALTER TABLE order_items ADD COLUMN excluded_ingredients TEXT NOT NULL DEFAULT '[]';
