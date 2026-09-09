-- Migration : stocker les images produit dans la base au lieu du disque.
-- À exécuter une fois sur la base existante (Neon, etc.).
--
-- Après cette migration, lancer le script de reprise des images déjà
-- présentes :  cd backend && npm run migrate-images

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS data BYTEA,
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(100);

-- Répare les lignes créées avant le correctif d'upload : image_url était resté
-- à la valeur temporaire 'pending'. Celles qui ont bien un binaire stocké
-- sont recâblées vers la route de service.
UPDATE product_images
   SET image_url = '/api/products/images/' || id
 WHERE image_url = 'pending' AND data IS NOT NULL;

-- Nettoie les lignes 'pending' sans binaire (upload échoué) : l'article
-- réapparaîtra sans photo, à ré-uploader depuis l'admin.
DELETE FROM product_images
 WHERE image_url = 'pending' AND data IS NULL;
