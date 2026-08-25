const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Liste publique des catégories actives
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, designation, description FROM categories WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Liste complète (admin)
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, designation, description, is_active, created_at FROM categories ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Création (admin)
router.post(
  '/',
  authenticateAdmin,
  [body('name').trim().isLength({ min: 2, max: 100 }), body('designation').trim().isLength({ min: 2, max: 100 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, designation, description } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO categories (name, designation, description) VALUES ($1,$2,$3) RETURNING *',
        [name, designation, description || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Cette catégorie existe déjà.' });
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

// Mise à jour (admin)
router.put('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, designation, description, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE categories SET name=$1, designation=$2, description=$3, is_active=$4 WHERE id=$5 RETURNING *`,
      [name, designation, description, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Suppression (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const usage = await pool.query(
      'SELECT COUNT(*)::int AS total FROM products WHERE category_id = $1',
      [req.params.id]
    );

    if (usage.rows[0].total > 0) {
      return res.status(409).json({
        error: 'Cette catégorie est utilisée par des produits et ne peut pas être supprimée.'
      });
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'Cette catégorie est utilisée par des produits et ne peut pas être supprimée.'
      });
    }
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
