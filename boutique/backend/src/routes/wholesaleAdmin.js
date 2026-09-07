const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');
const { sendMail } = require('../config/mailer');

const router = express.Router();

// Liste des comptes grossistes
router.get('/accounts', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, company_name, contact_name, email, phone, is_active, can_view_exclusive, created_at
       FROM wholesale_customers ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Activer ou retirer l'accès au catalogue exclusif pour un compte grossiste.
router.put(
  '/accounts/:id/exclusive-access',
  authenticateAdmin,
  [body('can_view_exclusive').isBoolean()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await pool.query(
        `UPDATE wholesale_customers SET can_view_exclusive = $1
         WHERE id = $2 RETURNING id, can_view_exclusive`,
        [req.body.can_view_exclusive, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Compte introuvable.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

// Activer ou désactiver un compte grossiste.
router.put(
  '/accounts/:id/active',
  authenticateAdmin,
  [body('is_active').isBoolean()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await pool.query(
        'UPDATE wholesale_customers SET is_active = $1 WHERE id = $2 RETURNING id, is_active',
        [req.body.is_active, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Compte introuvable.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

module.exports = router;
