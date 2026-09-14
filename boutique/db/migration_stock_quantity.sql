-- ============================================================
-- Migration : quantité en stock pour les articles en détail
-- À exécuter dans Neon (SQL Editor) et en local si vous utilisez Docker
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
