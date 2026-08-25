const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

const quoteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de demandes. Réessayez plus tard.' },
});

// Enregistre la demande de devis avant redirection vers WhatsApp
// (simple journal côté admin, aucune donnée sensible ni paiement)
router.post(
  '/',
  quoteLimiter,
  [body('items').isArray({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Panier invalide.' });

    const { client_name, client_phone, client_note, items } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const totalItems = items.reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0);

      const qr = await client.query(
        `INSERT INTO quote_requests (client_name, client_phone, client_note, total_items)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [client_name || null, client_phone || null, client_note || null, totalItems]
      );
      const quoteId = qr.rows[0].id;

      for (const it of items) {
        await client.query(
          `INSERT INTO quote_request_items
            (quote_request_id, product_id, product_name_snapshot, quantity, selected_color, selected_size)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [quoteId, it.product_id || null, it.product_name, it.quantity, it.color || null, it.size || null]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ id: quoteId });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    } finally {
      client.release();
    }
  }
);

// Liste des demandes (admin)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.get('/:id/items', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM quote_request_items WHERE quote_request_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
