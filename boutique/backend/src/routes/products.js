const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- Upload d'images sécurisé ----
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const storage = multer.diskStorage({
  // backend/src/routes -> ../../uploads = backend/uploads (2 niveaux, pas 3)
  destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé (jpeg, png, webp uniquement).'));
    }
    cb(null, true);
  },
});

// Valide qu'une valeur représente un entier, que ce soit un Number JSON
// ou une chaîne de caractères (contrairement à isInt() qui n'accepte que
// des chaînes et rejette les nombres JSON, causant de faux 400).
function isIntegerLike(value) {
  return Number.isInteger(Number(value)) && value !== '' && value !== null && value !== undefined;
}

// =========================================================
// GET /api/products - liste publique avec filtres + pagination
// =========================================================
router.get('/', async (req, res) => {
  const { category, season, gender, is_new, search } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = (page - 1) * limit;

  const conditions = ['p.is_active = TRUE'];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (season) {
    params.push(season);
    conditions.push(`p.season = $${params.length}`);
  }
  if (gender) {
    params.push(gender);
    conditions.push(`p.gender = $${params.length}`);
  }
  if (is_new === 'true') {
    conditions.push('p.is_new = TRUE');
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM products p JOIN categories c ON c.id = p.category_id ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT p.id, p.reference, p.name, p.slug, p.description, p.season, p.gender,
              p.min_order_qty, p.colors, p.sizes, p.material,
              p.is_new, p.is_featured, c.name AS category_name, c.slug AS category_slug,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id
                 ORDER BY pi.is_primary DESC, pi.created_at DESC, pi.display_order ASC LIMIT 1) AS primary_image
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY p.is_new DESC, p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total: countResult.rows[0].total },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/products/:slug - détail public
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND p.is_active = TRUE`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable.' });

    const images = await pool.query(
      'SELECT image_url, alt_text, is_primary FROM product_images WHERE product_id = $1 ORDER BY display_order ASC',
      [result.rows[0].id]
    );

    await pool.query('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [result.rows[0].id]);

    res.json({ ...result.rows[0], images: images.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =========================================================
// Routes ADMIN protégées
// =========================================================

router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id
                 ORDER BY pi.is_primary DESC, pi.created_at DESC, pi.display_order ASC LIMIT 1) AS primary_image
       FROM products p JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Création produit
router.post(
  '/',
  authenticateAdmin,
  [
    body('name').trim().isLength({ min: 2, max: 200 }),
    body('slug').trim().isLength({ min: 2, max: 220 }),
    body('category_id').custom(isIntegerLike).withMessage('Catégorie invalide.'),
    body('season').isIn(['hiver', 'ete', 'printemps', 'automne', 'toutes_saisons']),
    body('gender').isIn(['homme', 'femme', 'enfant', 'unisexe']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      reference, name, slug, description, category_id, season, gender,
      min_order_qty, colors, sizes, material, is_new, is_featured,
    } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO products
          (reference, name, slug, description, category_id, season, gender,
           min_order_qty, colors, sizes, material, is_new, is_featured, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [
          reference || null, name, slug, description || null, category_id, season, gender,
          min_order_qty || 1, colors || [], sizes || [], material || null,
          !!is_new, !!is_featured, req.admin.id,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Référence ou slug déjà utilisé.' });
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

// Mise à jour produit
router.put('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    reference, name, slug, description, category_id, season, gender,
    min_order_qty, colors, sizes, material, is_new, is_featured, is_active,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products SET
        reference=$1, name=$2, slug=$3, description=$4, category_id=$5, season=$6, gender=$7,
        min_order_qty=$8, colors=$9, sizes=$10, material=$11,
        is_new=$12, is_featured=$13, is_active=$14
       WHERE id=$15 RETURNING *`,
      [
        reference, name, slug, description, category_id, season, gender,
        min_order_qty, colors, sizes, material,
        !!is_new, !!is_featured, is_active !== false, id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Suppression produit
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable.' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Upload d'images pour un produit
router.post('/:id/images', authenticateAdmin, upload.array('images', 6), async (req, res) => {
  const { id } = req.params;
  try {
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ error: 'Aucune image reçue.' });
    }

    const existingImages = await pool.query(
      'SELECT id, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, display_order ASC, created_at ASC',
      [id]
    );

    if (files.length === 1 && existingImages.rows.length > 0) {
      const existing = existingImages.rows[0];
      const newUrl = `/uploads/${files[0].filename}`;

      const result = await pool.query(
        `UPDATE product_images
         SET image_url = $2, alt_text = NULL, is_primary = TRUE, display_order = 0, created_at = now()
         WHERE id = $1 RETURNING *`,
        [existing.id, newUrl]
      );

      await pool.query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = $1 AND id <> $2',
        [id, existing.id]
      );

      return res.status(200).json(result.rows);
    }

    await pool.query('DELETE FROM product_images WHERE product_id = $1', [id]);

    const inserted = [];
    for (let i = 0; i < files.length; i++) {
      const url = `/uploads/${files[i].filename}`;
      const result = await pool.query(
        `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [id, url, i === 0, i]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
});

// Suppression d'une image
router.delete('/images/:imageId', authenticateAdmin, async (req, res) => {
  try {
    const imageResult = await pool.query('SELECT product_id, is_primary FROM product_images WHERE id = $1', [req.params.imageId]);
    if (imageResult.rows.length === 0) return res.status(404).json({ error: 'Image introuvable.' });

    const { product_id, is_primary } = imageResult.rows[0];
    await pool.query('DELETE FROM product_images WHERE id = $1', [req.params.imageId]);

    if (is_primary) {
      const fallback = await pool.query(
        'SELECT id FROM product_images WHERE product_id = $1 ORDER BY display_order ASC, created_at ASC LIMIT 1',
        [product_id]
      );
      if (fallback.rows.length > 0) {
        await pool.query('UPDATE product_images SET is_primary = TRUE WHERE id = $1', [fallback.rows[0].id]);
      }
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;