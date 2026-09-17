const express = require('express');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

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
