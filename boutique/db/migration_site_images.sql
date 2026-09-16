-- ============================================================
-- Migration : bannières personnalisables (tuiles "Achetez par profil")
-- À exécuter dans Neon (SQL Editor) et en local si vous utilisez Docker
-- ============================================================

CREATE TABLE IF NOT EXISTS site_images (
    key             VARCHAR(50) PRIMARY KEY,
    data            BYTEA NOT NULL,
    content_type    VARCHAR(100) NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
