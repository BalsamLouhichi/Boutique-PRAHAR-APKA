-- Remove stock and wholesale price fields from an existing boutique database.
ALTER TABLE products
  DROP COLUMN IF EXISTS price_wholesale,
  DROP COLUMN IF EXISTS stock_status,
  DROP COLUMN IF EXISTS stock_quantity,
  DROP COLUMN IF EXISTS low_stock_threshold;