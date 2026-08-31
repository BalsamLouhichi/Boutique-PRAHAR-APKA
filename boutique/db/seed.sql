-- ============================================================
-- Données de démonstration
-- Mot de passe admin par défaut : Admin123! (à changer immédiatement)
-- Hash bcrypt généré pour "Admin123!"
-- ============================================================

INSERT INTO categories (name, slug, description) VALUES
    ('Casquettes', 'casquettes', 'Casquettes pour homme, femme et enfant', 1),
    ('Bonnets', 'bonnets', 'Bonnets chauds pour l''hiver', 2),
    ('Cache-cols', 'cache-cols', 'Cache-cols et tours de cou', 3),
    ('Écharpes', 'echarpes', 'Écharpes pour l''été et l''hiver', 4);

-- Compte admin de démonstration (email: admin@boutique.tn / mot de passe: Admin123!)
-- Le hash ci-dessous doit être régénéré via le script backend (voir README)
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES ('admin@boutique.tn', '$2b$10$replaceThisWithRealBcryptHash', 'Administrateur', 'superadmin');

INSERT INTO products (reference, name, slug, description, category_id, season, gender, min_order_qty, colors, sizes, material, is_new, is_featured)
VALUES
('CAS-001', 'Casquette Baseball Classique', 'casquette-baseball-classique', 'Casquette baseball ajustable, tissu coton résistant, idéale pour la revente.', 1, 'ete', 'unisexe', 12, ARRAY['Noir','Bleu marine','Beige'], ARRAY['Taille unique'], 'Coton 100%', TRUE, TRUE),
('CAS-002', 'Casquette Snapback Urbaine', 'casquette-snapback-urbaine', 'Casquette snapback style urbain, visière plate.', 1, 'ete', 'homme', 12, ARRAY['Noir','Gris'], ARRAY['Taille unique'], 'Polyester', TRUE, FALSE),
('BON-001', 'Bonnet Tricot Hiver', 'bonnet-tricot-hiver', 'Bonnet en maille tricotée, doublure polaire.', 2, 'hiver', 'unisexe', 20, ARRAY['Noir','Gris chiné','Bordeaux'], ARRAY['Taille unique'], 'Acrylique', TRUE, TRUE),
('BON-002', 'Bonnet Enfant Pompon', 'bonnet-enfant-pompon', 'Bonnet enfant coloré avec pompon.', 2, 'hiver', 'enfant', 20, ARRAY['Rose','Bleu ciel','Jaune'], ARRAY['Taille unique'], 'Laine mélangée', FALSE, FALSE),
('CC-001', 'Cache-col Polaire', 'cache-col-polaire', 'Cache-col chaud et doux, parfait pour l''hiver.', 3, 'hiver', 'unisexe', 20, ARRAY['Noir','Gris','Marine'], ARRAY['Taille unique'], 'Polaire', TRUE, TRUE),
('ECH-001', 'Écharpe Rayée Légère', 'echarpe-rayee-legere', 'Écharpe rayée légère, idéale pour l''été.', 4, 'ete', 'femme', 15, ARRAY['Beige/Marron','Gris/Noir'], ARRAY['Taille unique'], 'Coton', FALSE, FALSE);
