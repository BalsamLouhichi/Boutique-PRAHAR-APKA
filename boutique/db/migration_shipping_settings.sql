-- ============================================================
-- Migration : réglages de livraison (frais + seuil gratuit)
-- À exécuter dans Neon (SQL Editor) et en local si vous utilisez Docker
-- ============================================================

INSERT INTO site_settings (key, value) VALUES
    ('shipping_fee', '15'),
    ('free_shipping_threshold', '300')
  ON CONFLICT (key) DO NOTHING;
