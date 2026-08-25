const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');

const router = express.Router();

// Anti brute-force : max 8 tentatives / 15 min par IP sur le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Email ou mot de passe invalide.' });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, full_name, role, is_active FROM admin_users WHERE email = $1',
        [email]
      );

      // Réponse volontairement identique en cas d'email inconnu ou mdp faux
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }

      const admin = result.rows[0];

      if (!admin.is_active) {
        return res.status(403).json({ error: 'Ce compte est désactivé.' });
      }

      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      await pool.query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [admin.id]);

      res.json({
        token,
        admin: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

module.exports = router;
