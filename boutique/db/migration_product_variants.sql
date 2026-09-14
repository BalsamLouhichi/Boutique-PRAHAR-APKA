-- ============================================================
-- Migration : stock par couleur
-- Remplace products.stock_quantity par une table product_variants
-- (une ligne par couleur, color='' si l'article n'a pas de couleurs).
-- À exécuter dans Neon (SQL Editor) et en local si vous utilisez Docker
-- ============================================================

CREATE TABLE IF NOT EXISTS product_variants (
    id              SERIAL PRIMARY KEY,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color           VARCHAR(50) NOT NULL DEFAULT '',
    stock_quantity  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, color)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

-- Reprise des articles existants : une ligne par couleur (une seule ligne,
-- color='', si l'article n'a pas de couleurs). Le stock total existant
-- (products.stock_quantity, s'il existe encore) est affecté à la première
-- couleur de chaque article — à répartir ensuite manuellement depuis
-- l'admin (Rose: 3, Noir: 8, etc.).
DO $$
DECLARE
  prod RECORD;
  color_list TEXT[];
  c TEXT;
  first_row BOOLEAN;
  has_stock_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) INTO has_stock_column;

  FOR prod IN
    EXECUTE format(
      'SELECT id, colors, %s AS stock_quantity FROM products WHERE sale_type = ''detail''',
      CASE WHEN has_stock_column THEN 'COALESCE(stock_quantity, 0)' ELSE '0' END
    )
  LOOP
    color_list := CASE WHEN prod.colors IS NULL OR array_length(prod.colors, 1) IS NULL THEN ARRAY['']::TEXT[] ELSE prod.colors END;
    first_row := TRUE;
    FOREACH c IN ARRAY color_list LOOP
      INSERT INTO product_variants (product_id, color, stock_quantity)
      VALUES (prod.id, c, CASE WHEN first_row THEN prod.stock_quantity ELSE 0 END)
      ON CONFLICT (product_id, color) DO NOTHING;
      first_row := FALSE;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE products DROP COLUMN IF EXISTS stock_quantity;
