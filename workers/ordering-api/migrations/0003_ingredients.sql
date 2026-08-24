-- Ingredients are stored as a JSON array of strings in a TEXT column
-- (SQLite has no native array type). Empty/absent -> '[]'.
ALTER TABLE menu_items ADD COLUMN ingredients TEXT NOT NULL DEFAULT '[]';
