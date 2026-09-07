-- ============================================================
-- Migration : Module Vente en gros (comptes B2B, validation admin)
-- À exécuter dans Neon (SQL Editor) APRÈS migration_vente_detail.sql
-- ============================================================

-- ---------------------------------------------------------------
-- 1. Comptes clients grossistes (B2B), distincts des admin_users
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wholesale_customers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name     VARCHAR(200) NOT NULL,
    contact_name     VARCHAR(150) NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    phone            VARCHAR(30) NOT NULL,

    can_view_exclusive BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wholesale_customers
  ADD COLUMN IF NOT EXISTS can_view_exclusive BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE wholesale_customers
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE wholesale_customers
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS rejection_reason;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wholesale_customers_updated_at') THEN
    CREATE TRIGGER trg_wholesale_customers_updated_at
      BEFORE UPDATE ON wholesale_customers
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ---------------------------------------------------------------
-- 2. Articles exclusifs (visibles uniquement aux comptes gros approuvés)
-- ---------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_products_exclusive ON products(is_exclusive);

-- ---------------------------------------------------------------
-- 3. Rattacher les demandes de devis à un compte grossiste (optionnel)
-- ---------------------------------------------------------------
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS wholesale_customer_id UUID
    REFERENCES wholesale_customers(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- 4. Réglage : email de notification admin pour les nouvelles demandes
-- ---------------------------------------------------------------
INSERT INTO site_settings (key, value) VALUES ('admin_notification_email', 'contact@votre-domaine.com')
  ON CONFLICT (key) DO NOTHING;
/*  */
