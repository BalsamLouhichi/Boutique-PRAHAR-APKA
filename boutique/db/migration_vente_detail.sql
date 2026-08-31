-- ============================================================
-- Migration : Vente au détail (prix, promotions, commandes)
-- À exécuter dans Neon (SQL Editor) et en local si vous utilisez Docker
-- ============================================================

-- ---------------------------------------------------------------
-- 1. Ajouter le prix et la promo aux produits
-- ---------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_price NUMERIC(10,2);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_promo_price_lower') THEN
    ALTER TABLE products ADD CONSTRAINT chk_promo_price_lower
      CHECK (promo_price IS NULL OR promo_price < price);
  END IF;
END $$;

-- Devise du site (modifiable depuis l'admin plus tard)
INSERT INTO site_settings (key, value) VALUES ('currency', 'TRY')
  ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------
-- 2. Table des commandes (vente au détail)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Client
    customer_name       VARCHAR(150) NOT NULL,
    customer_phone      VARCHAR(30) NOT NULL,
    customer_email      VARCHAR(255),

    -- Livraison
    shipping_address    TEXT NOT NULL,
    shipping_city       VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20),
    customer_note       TEXT,

    -- Paiement
    payment_method      VARCHAR(20) NOT NULL
                            CHECK (payment_method IN ('card', 'cash_on_delivery')),
    payment_status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_provider     VARCHAR(30),              -- ex: 'iyzico', 'paytr' (rempli plus tard)
    payment_provider_ref VARCHAR(255),              -- id de transaction chez le prestataire

    -- Montants (capturés au moment de la commande, indépendants des prix futurs)
    currency             VARCHAR(3) NOT NULL DEFAULT 'TRY',
    subtotal             NUMERIC(10,2) NOT NULL,
    shipping_fee         NUMERIC(10,2) NOT NULL DEFAULT 0,
    total                NUMERIC(10,2) NOT NULL,

    -- Suivi de la commande
    status               VARCHAR(20) NOT NULL DEFAULT 'nouvelle'
                            CHECK (status IN ('nouvelle', 'en_preparation', 'expediee', 'livree', 'annulee')),

    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id                    SERIAL PRIMARY KEY,
    order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id            UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,
    unit_price            NUMERIC(10,2) NOT NULL,     -- prix au moment de l'achat (jamais recalculé après coup)
    quantity              INTEGER NOT NULL CHECK (quantity > 0),
    line_total            NUMERIC(10,2) NOT NULL,
    selected_color        VARCHAR(50),
    selected_size         VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
