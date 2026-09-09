const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateWholesale } = require('../middleware/authWholesale');
const { sendMail } = require('../config/mailer');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

// =========================================================
// POST /api/wholesale/register - demande de compte grossiste
// =========================================================
router.post(
  '/register',
  authLimiter,
  [
    body('company_name').trim().isLength({ min: 2, max: 200 }),
    body('contact_name').trim().isLength({ min: 2, max: 150 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().isLength({ min: 6, max: 30 }),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { company_name, contact_name, email, phone, password } = req.body;

    try {
      const existing = await pool.query('SELECT id FROM wholesale_customers WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO wholesale_customers (company_name, contact_name, email, phone, password_hash)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, company_name, email`,
        [company_name, contact_name, email, phone, passwordHash]
      );

      // Email au client : confirmation de réception de la demande
      await sendMail({
        to: email,
        subject: 'Votre compte grossiste est créé',
        html: `<p>Bonjour ${contact_name},</p>
               <p>Votre compte grossiste pour <b>${company_name}</b> est créé.</p>
               <p>Vous pouvez dès maintenant vous connecter et consulter le catalogue en gros.</p>`,
      });

      // Email à l'admin : notification de nouvelle demande
      const settingsResult = await pool.query("SELECT value FROM site_settings WHERE key = 'admin_notification_email'");
      const adminEmail = settingsResult.rows[0]?.value;
      if (adminEmail) {
        await sendMail({
          to: adminEmail,
          subject: `Nouveau compte grossiste : ${company_name}`,
          html: `<p>Nouveau compte créé :</p>
                 <ul>
                   <li><b>Entreprise :</b> ${company_name}</li>
                   <li><b>Contact :</b> ${contact_name}</li>
                   <li><b>Email :</b> ${email}</li>
                   <li><b>Téléphone :</b> ${phone}</li>
                 </ul>
                 <p>Vous pouvez gérer son accès aux articles exclusifs dans l'espace admin.</p>`,
        });
      }

      res.status(201).json({
        message: 'Votre compte est créé. Vous pouvez maintenant vous connecter.',
        id: result.rows[0].id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

// =========================================================
// POST /api/wholesale/login - connexion (comptes approuvés uniquement)
// =========================================================
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Email ou mot de passe invalide.' });

    const { email, password } = req.body;

    try {
      const result = await pool.query('SELECT * FROM wholesale_customers WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }

      const account = result.rows[0];
      const match = await bcrypt.compare(password, account.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }
      if (!account.is_active) {
        return res.status(403).json({ error: 'Ce compte a été désactivé. Contactez l’administrateur.' });
      }

      const token = jwt.sign(
        { id: account.id, email: account.email, companyName: account.company_name, role: 'wholesale' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        token,
        account: { id: account.id, company_name: account.company_name, contact_name: account.contact_name, email: account.email },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

// =========================================================
// GET /api/wholesale/products - catalogue en gros (protégé)
// Les articles exclusifs sont renvoyés seulement aux comptes autorisés par l'admin.
// =========================================================
router.get('/products', authenticateWholesale, async (req, res) => {
  const { category, season, gender, search } = req.query;

  try {
    const accessResult = await pool.query(
      'SELECT can_view_exclusive, is_active FROM wholesale_customers WHERE id = $1',
      [req.wholesaleCustomer.id]
    );
    if (accessResult.rows.length === 0) return res.status(401).json({ error: 'Compte grossiste introuvable.' });
    if (!accessResult.rows[0].is_active) return res.status(403).json({ error: 'Ce compte grossiste a été désactivé.' });

    const conditions = ["p.is_active = TRUE", "p.sale_type = 'gros'"];
    const params = [];
    if (category) { params.push(category); conditions.push(`c.slug = $${params.length}`); }
    if (season) { params.push(season); conditions.push(`p.season = $${params.length}`); }
    if (gender) { params.push(gender); conditions.push(`p.gender = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.reference ILIKE $${params.length})`);
    }
    if (!accessResult.rows[0].can_view_exclusive) conditions.push('p.is_exclusive = FALSE');

    const result = await pool.query(
      `SELECT p.id, p.reference, p.name, p.slug, p.description, p.season, p.gender,
              p.min_order_qty, p.colors, p.sizes, p.material, p.is_new, p.is_exclusive,
              c.name AS category_name, c.slug AS category_slug,
              (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id
                 ORDER BY pi.is_primary DESC, pi.display_order ASC LIMIT 1) AS primary_image
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.is_new DESC, p.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =========================================================
// POST /api/wholesale/quote - demande de devis (protégé, → WhatsApp côté client)
// Réutilise la même logique que les devis classiques, en les rattachant
// au compte grossiste connecté.
// =========================================================
router.post(
  '/quote',
  authenticateWholesale,
  [body('items').isArray({ min: 1 }), body('items.*.product_id').isUUID(), body('items.*.quantity').isInt({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Panier invalide.' });

    const { items, client_note } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resolvedItems = [];
      for (const item of items) {
        const productResult = await client.query(
          'SELECT id, name, min_order_qty FROM products WHERE id = $1 AND is_active = TRUE',
          [item.product_id]
        );
        const product = productResult.rows[0];
        if (!product) throw new Error('Un article du devis est introuvable ou indisponible.');

        const quantity = Number.parseInt(item.quantity, 10);
        if (quantity < product.min_order_qty) {
          throw new Error(`La quantité minimale pour ${product.name} est de ${product.min_order_qty}.`);
        }

        resolvedItems.push({
          product,
          quantity,
          color: item.color || null,
          size: item.size || null,
        });
      }
      const totalItems = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);

      const qr = await client.query(
        `INSERT INTO quote_requests (client_name, client_phone, client_note, total_items, wholesale_customer_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [req.wholesaleCustomer.companyName, null, client_note || null, totalItems, req.wholesaleCustomer.id]
      );
      const quoteId = qr.rows[0].id;

      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO quote_request_items
            (quote_request_id, product_id, product_name_snapshot, quantity, selected_color, selected_size)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [quoteId, item.product.id, item.product.name, item.quantity, item.color, item.size]
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

module.exports = router;
