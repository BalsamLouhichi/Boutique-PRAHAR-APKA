const express = require('express');
const multer = require('multer');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- Bannières de la page d'accueil (ex: tuiles "Achetez par profil") ----
// Clés fixes plutôt qu'arbitraires : évite qu'un client envoie n'importe
// quelle chaîne comme clé de stockage.
const SITE_IMAGE_KEYS = ['femme', 'homme', 'enfant', 'unisexe'];
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const uploadSiteImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé (jpeg, png, webp uniquement).'));
    }
    cb(null, true);
  },
});

// GET /api/settings/images/:key - sert le binaire (public, pas d'auth)
router.get('/images/:key', async (req, res) => {
  if (!SITE_IMAGE_KEYS.includes(req.params.key)) return res.status(404).end();
  try {
    const { rows } = await pool.query('SELECT data, content_type FROM site_images WHERE key = $1', [req.params.key]);
    if (rows.length === 0) return res.status(404).end();
    res.set('Content-Type', rows[0].content_type);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// POST /api/settings/images/:key - remplace la bannière (admin)
router.post('/images/:key', authenticateAdmin, uploadSiteImage.single('image'), async (req, res) => {
  if (!SITE_IMAGE_KEYS.includes(req.params.key)) return res.status(400).json({ error: 'Clé invalide.' });
  if (!req.file) return res.status(400).json({ error: 'Aucune image reçue.' });
  try {
    await pool.query(
      `INSERT INTO site_images (key, data, content_type, updated_at) VALUES ($1,$2,$3,now())
       ON CONFLICT (key) DO UPDATE SET data = $2, content_type = $3, updated_at = now()`,
      [req.params.key, req.file.buffer, req.file.mimetype]
    );
    res.status(201).json({ key: req.params.key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/settings/images/:key - revient à la photo automatique (admin)
router.delete('/images/:key', authenticateAdmin, async (req, res) => {
  if (!SITE_IMAGE_KEYS.includes(req.params.key)) return res.status(400).json({ error: 'Clé invalide.' });
  try {
    await pool.query('DELETE FROM site_images WHERE key = $1', [req.params.key]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    result.rows.forEach((r) => (settings[r.key] = r.value));
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.put('/:key', authenticateAdmin, async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO site_settings (key, value) VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *`,
      [key, value]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
