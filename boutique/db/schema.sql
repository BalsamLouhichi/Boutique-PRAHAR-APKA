-- ============================================================
-- Schéma PostgreSQL - Boutique en gros (Casquettes / Bonnets / Cache-cols)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- pour gen_random_uuid()

-- ---------------------------------------------------------------
-- Table: admin_users
-- Comptes administrateurs (gestion des articles)
-- ---------------------------------------------------------------
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,      -- bcrypt
    full_name       VARCHAR(150),
    role            VARCHAR(30) NOT NULL DEFAULT 'admin', -- admin | superadmin
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- Table: categories
-- Ex: Casquettes, Bonnets, Cache-cols, Écharpes...
-- ---------------------------------------------------------------
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    slug     VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- Table: products
-- ---------------------------------------------------------------
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference       VARCHAR(50) UNIQUE,             -- SKU / référence interne
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(220) NOT NULL UNIQUE,
    description     TEXT,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

    sale_type       VARCHAR(20) NOT NULL DEFAULT 'detail'
                        CHECK (sale_type IN ('detail','gros')),

    -- Filtres demandés : saison, sexe/genre
    season          VARCHAR(20) NOT NULL DEFAULT 'ete'
                        CHECK (season IN ('hiver','ete')),
    gender          VARCHAR(20) NOT NULL DEFAULT 'unisexe'
                        CHECK (gender IN ('homme','femme','enfant','unisexe')),

    -- Infos commerciales (vente en gros, pas de paiement en ligne)
    min_order_qty   INTEGER NOT NULL DEFAULT 1,      -- quantité minimale de commande
    stock_quantity  INTEGER NOT NULL DEFAULT 0,      -- stock disponible (articles en détail)
    colors          TEXT[],                          -- ex: {'Noir','Gris','Bleu'}
    sizes           TEXT[],                          -- ex: {'S','M','L','XL'} ou {'Taille unique'}
    material        VARCHAR(150),

    is_new          BOOLEAN NOT NULL DEFAULT FALSE,   -- badge "Nouveau" / section "plus modernes"
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,   -- mise en avant page d'accueil
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,    -- visible sur le site

    view_count      INTEGER NOT NULL DEFAULT 0,

    created_by      UUID REFERENCES admin_users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sale_type ON products(sale_type);
CREATE INDEX idx_products_season   ON products(season);
CREATE INDEX idx_products_gender   ON products(gender);
CREATE INDEX idx_products_active   ON products(is_active);
CREATE INDEX idx_products_new      ON products(is_new);

-- ---------------------------------------------------------------
-- Table: product_images
-- Plusieurs images par produit
-- ---------------------------------------------------------------
CREATE TABLE product_images (
    id              SERIAL PRIMARY KEY,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url       VARCHAR(500) NOT NULL,
    -- Contenu binaire de l'image, servi par GET /api/products/images/:id.
    -- (évite un stockage disque, incompatible avec l'hébergement serverless)
    data            BYTEA,
    content_type    VARCHAR(100),
    alt_text        VARCHAR(200),
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ---------------------------------------------------------------
-- Table: quote_requests
-- Historique des "demandes de devis" envoyées vers WhatsApp
-- (utile pour le suivi côté admin, même si la conversation se fait sur WhatsApp)
-- ---------------------------------------------------------------
CREATE TABLE quote_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name     VARCHAR(150),
    client_phone    VARCHAR(30),
    client_note     TEXT,
    total_items     INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'envoye'
                        CHECK (status IN ('envoye','traite','annule')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quote_request_items (
    id              SERIAL PRIMARY KEY,
    quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,   -- garde le nom même si le produit est supprimé
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    selected_color  VARCHAR(50),
    selected_size   VARCHAR(50)
);

-- ---------------------------------------------------------------
-- Table: site_settings
-- Réglages généraux (numéro WhatsApp, textes home page, etc.)
-- ---------------------------------------------------------------
CREATE TABLE site_settings (
    key             VARCHAR(100) PRIMARY KEY,
    value           TEXT
);

INSERT INTO site_settings (key, value) VALUES
    ('whatsapp_number', '21696839006'),
    ('brand_tagline', 'Le N°1 de la vente en gros de casquettes, bonnets et cache-cols'),
    ('brand_description', 'Türkiye genelindeki geniş dağıtım ağımızla, sektörün en güçlü ekosistemlerinden birini kurduk. Bugün, ulusal çaptaki iş ortaklarımızın %80’i, mağazalarında bizim ürünlerimizi ana koleksiyon olarak konumlandırmakta ve markamızın resmi temsilcisi olarak hareket etmektedir.');

-- ---------------------------------------------------------------
-- Trigger générique pour updated_at
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
