-- Migration : stocker les images produit dans la base au lieu du disque.
-- À exécuter une fois sur la base existante (Neon, etc.).
--
-- Après cette migration, lancer le script de reprise des images déjà
-- présentes :  cd backend && npm run migrate-images

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS data BYTEA,
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);
