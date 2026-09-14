const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- Upload d'images sécurisé ----
// Les fichiers sont gardés en mémoire puis stockés en base (colonne bytea),
// et servis par GET /api/products/images/:id.
//
// Pourquoi pas le disque ni Vercel Blob :
//  - disque (multer.diskStorage) : le FS de Vercel est éphémère/lecture seule,
//    les fichiers disparaissent et renvoient 404.
//  - Vercel Blob : fonctionne mais impose un service + un jeton à configurer.
// Le catalogue est petit (quelques dizaines d'images de quelques Mo) : les
// mettre dans PostgreSQL/Neon évite toute dépendance externe. AUCUNE variable
// BLOB_* n'est utilisée par le code — le store Vercel Blob peut être supprimé.
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
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

// Sous-requête JSON : stock par couleur d'un article, embarqué directement
// dans les réponses produit pour éviter un aller-retour supplémentaire quand
// le client doit connaître le stock de la couleur sélectionnée.
const VARIANTS_SUBQUERY = `(
  SELECT COALESCE(json_agg(json_build_object('color', pv.color, 'stock_quantity', pv.stock_quantity) ORDER BY pv.id), '[]')
  FROM product_variants pv WHERE pv.product_id = p.id
) AS variants`;

// Normalise le tableau couleur/stock envoyé par l'admin : couleur en chaîne
// (vide si l'article n'a pas de couleurs), stock en entier positif ou nul.
// Ignore les entrées invalides plutôt que de faire échouer toute la sauvegarde.
function normalizeVariants(rawVariants) {
  if (!Array.isArray(rawVariants)) return [];
  const seen = new Set();
  const variants = [];
  for (const v of rawVariants) {
    if (!v || typeof v !== 'object') continue;
    const color = String(v.color || '').trim().slice(0, 50);
    if (seen.has(color)) continue;
    seen.add(color);
    const stock = Math.max(parseInt(v.stock_quantity, 10) || 0, 0);
    variants.push({ color, stock_quantity: stock });
  }
  return variants;
}

// Remplace entièrement le stock par couleur d'un article (le formulaire admin
// envoie toujours l'état complet, plus simple et plus sûr qu'un diff).
async function replaceVariants(client, productId, rawVariants) {
  const variants = normalizeVariants(rawVariants);
  await client.query('DELETE FROM product_variants WHERE product_id = $1', [productId]);
  for (const v of variants) {
    await client.query(
      'INSERT INTO product_variants (product_id, color, stock_quantity) VALUES ($1,$2,$3)',
      [productId, v.color, v.stock_quantity]
    );
  }
  return variants;
}

// =========================================================
// GET /api/products - liste publique avec filtres + pagination
// =========================================================
router.get('/', async (req, res) => {
  const { category, season, gender, is_new, search } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = (page - 1) * limit;

  const conditions = ['p.is_active = TRUE', "p.sale_type = 'detail'", 'p.is_exclusive = FALSE'];
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
      `SELECT p.id, p.reference, p.name, p.slug, p.description, p.season, p.gender, p.sale_type,
              p.min_order_qty, p.colors, p.sizes, p.material, p.price, p.promo_price,
              p.is_new, p.is_featured, c.name AS category_name, c.slug AS category_slug,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id
                 ORDER BY pi.is_primary DESC, pi.created_at DESC, pi.display_order ASC LIMIT 1) AS primary_image,
              ${VARIANTS_SUBQUERY}
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

// GET /api/products/images/:id - sert le binaire d'une image stockée en base
router.get('/images/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).end();
  try {
    const { rows } = await pool.query(
      'SELECT data, content_type FROM product_images WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0 || !rows[0].data) return res.status(404).end();
    res.set('Content-Type', rows[0].content_type || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// GET /api/products/:slug - détail public
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${VARIANTS_SUBQUERY}
       FROM products p JOIN categories c ON c.id = p.category_id
      WHERE p.slug = $1 AND p.is_active = TRUE AND p.sale_type = 'detail'`,
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
                 ORDER BY pi.is_primary DESC, pi.created_at DESC, pi.display_order ASC LIMIT 1) AS primary_image,
              (SELECT COALESCE(SUM(pv.stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id)::int AS total_stock
       FROM products p JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Détail complet d'un produit pour l'édition, y compris toutes ses images.
router.get('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const productResult = await pool.query(
      `SELECT p.*, c.name AS category_name, ${VARIANTS_SUBQUERY}
       FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = $1`,
      [req.params.id]
    );
    if (productResult.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable.' });

    const imagesResult = await pool.query(
      'SELECT id, image_url, alt_text, is_primary, display_order FROM product_images WHERE product_id = $1 ORDER BY display_order ASC, created_at ASC',
      [req.params.id]
    );
    res.json({ ...productResult.rows[0], images: imagesResult.rows });
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
    body('season').isIn(['hiver', 'ete']),
    body('gender').isIn(['homme', 'femme', 'enfant', 'unisexe']),
    body('sale_type').optional().isIn(['detail', 'gros']).withMessage('Type de vente invalide.'),
    body('price').custom((value, { req }) => req.body.sale_type === 'gros' || Number(value) > 0)
      .withMessage('Le prix doit être supérieur à zéro pour un article en détail.'),
    body('promo_price').optional({ nullable: true, checkFalsy: true }).isFloat({ gt: 0 })
      .custom((value, { req }) => req.body.sale_type === 'gros' || Number(value) < Number(req.body.price)).withMessage('Le prix promo doit être inférieur au prix normal.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      reference, name, slug, description, category_id, season, gender, sale_type,
        min_order_qty, variants, colors, sizes, material, price, promo_price, is_new, is_featured, is_exclusive,
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO products
          (reference, name, slug, description, category_id, season, gender, sale_type,
            min_order_qty, colors, sizes, material, price, promo_price, is_new, is_featured, is_exclusive, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [
          reference || null, name, slug, description || null, category_id, season, gender, sale_type || 'detail',
          min_order_qty || 1, colors || [], sizes || [], material || null, Number(price) || 0,
           sale_type === 'gros' || promo_price == null || promo_price === '' ? null : Number(promo_price), !!is_new, !!is_featured, !!is_exclusive, req.admin.id,
        ]
      );
      const product = result.rows[0];
      const savedVariants = await replaceVariants(client, product.id, sale_type === 'gros' ? [] : variants);
      await client.query('COMMIT');
      res.status(201).json({ ...product, variants: savedVariants });
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') return res.status(409).json({ error: 'Référence ou slug déjà utilisé.' });
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    } finally {
      client.release();
    }
  }
);

// Mise à jour produit
router.put('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    reference, name, slug, description, category_id, season, gender, sale_type,
    min_order_qty, variants, colors, sizes, material, price, promo_price, is_new, is_featured, is_exclusive, is_active,
  } = req.body;

  if (!['hiver', 'ete'].includes(season)) {
    return res.status(400).json({ error: 'La saison doit être hiver ou ete.' });
  }

  if (!['detail', 'gros'].includes(sale_type)) {
    return res.status(400).json({ error: 'Le type de vente est invalide.' });
  }
  if (sale_type === 'detail' && (!(Number(price) > 0) || (promo_price != null && promo_price !== '' && !(Number(promo_price) > 0 && Number(promo_price) < Number(price))))) {
    return res.status(400).json({ error: 'Le prix doit être supérieur à zéro et le prix promo doit être inférieur au prix normal.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE products SET
        reference=$1, name=$2, slug=$3, description=$4, category_id=$5, season=$6, gender=$7, sale_type=$8,
        min_order_qty=$9, colors=$10, sizes=$11, material=$12, price=$13, promo_price=$14,
        is_new=$15, is_featured=$16, is_exclusive=$17, is_active=$18
             WHERE id=$19 RETURNING *`,
      [
        reference, name, slug, description, category_id, season, gender, sale_type,
        min_order_qty, colors, sizes, material, Number(price) || 0,
        sale_type === 'gros' || promo_price == null || promo_price === '' ? null : Number(promo_price),
        !!is_new, !!is_featured, !!is_exclusive, is_active !== false, id,
      ]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    // Pour un article en gros, variants n'est pas fourni par le formulaire :
    // replaceVariants videra simplement la table pour ce produit.
    const savedVariants = await replaceVariants(client, id, sale_type === 'gros' ? [] : variants);
    await client.query('COMMIT');
    res.json({ ...result.rows[0], variants: savedVariants });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    client.release();
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

    const remainingSlots = 6 - existingImages.rows.length;
    if (files.length > remainingSlots) {
      return res.status(400).json({ error: `Vous pouvez ajouter ${remainingSlots} image(s) au maximum pour cet article.` });
    }

    // L'URL publique dépend de l'id auto-généré : on insère puis on met à jour
    // image_url. (Un CTE « INSERT ... puis UPDATE » ne marche pas : le UPDATE
    // ne voit pas la ligne insérée dans le même snapshot.)
    const client = await pool.connect();
    const inserted = [];
    try {
      await client.query('BEGIN');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ins = await client.query(
          `INSERT INTO product_images (product_id, image_url, data, content_type, is_primary, display_order)
           VALUES ($1, 'pending', $2, $3, $4, $5) RETURNING id`,
          [id, file.buffer, file.mimetype, existingImages.rows.length === 0 && i === 0, existingImages.rows.length + i]
        );
        const imageId = ins.rows[0].id;
        const upd = await client.query(
          `UPDATE product_images SET image_url = $1 WHERE id = $2
           RETURNING id, product_id, image_url, alt_text, is_primary, display_order, created_at`,
          [`/api/products/images/${imageId}`, imageId]
        );
        inserted.push(upd.rows[0]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
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
