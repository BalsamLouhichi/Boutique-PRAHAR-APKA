const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de commandes envoyées. Réessayez plus tard.' },
});

// =========================================================
// POST /api/orders - créer une commande (checkout, public)
// =========================================================
router.post(
  '/',
  checkoutLimiter,
  [
    body('customer_name').trim().isLength({ min: 2, max: 150 }).withMessage('Veuillez indiquer votre nom et prénom.'),
    body('customer_phone').trim().isLength({ min: 6, max: 30 }).withMessage('Numéro de téléphone invalide : indiquez un numéro joignable (au moins 6 chiffres).'),
    body('customer_email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage("L'adresse email n'est pas valide (exemple : nom@email.com)."),
    body('shipping_address').trim().isLength({ min: 3, max: 500 }).withMessage('Veuillez indiquer votre adresse de livraison (rue, quartier…).'),
    body('shipping_city').trim().isLength({ min: 2, max: 100 }).withMessage('Veuillez indiquer votre ville.'),
    body('shipping_postal_code').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Code postal invalide.'),
    body('payment_method').isIn(['card', 'cash_on_delivery']).withMessage('Veuillez choisir un mode de paiement.'),
    body('items').isArray({ min: 1 }).withMessage('Votre panier est vide : ajoutez au moins un article avant de commander.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      customer_name, customer_phone, customer_email,
      shipping_address, shipping_city, shipping_postal_code, customer_note,
      payment_method, items, shipping_fee,
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Recalcule les prix côté serveur à partir de la base (jamais confiance
      // dans les prix envoyés par le navigateur, qui pourraient être trafiqués).
      let subtotal = 0;
      const resolvedItems = [];

      for (const it of items) {
        // FOR UPDATE verrouille la ligne le temps de la transaction : deux
        // commandes simultanées sur le même article ne peuvent pas survendre
        // le stock restant.
        const productResult = await client.query(
          'SELECT id, name, price, promo_price, is_active, stock_quantity FROM products WHERE id = $1 FOR UPDATE',
          [it.product_id]
        );
        if (productResult.rows.length === 0 || !productResult.rows[0].is_active) {
          throw new Error(`Produit introuvable ou indisponible.`);
        }
        const product = productResult.rows[0];
        const unitPrice = product.promo_price != null ? Number(product.promo_price) : Number(product.price);
        const quantity = parseInt(it.quantity) || 1;

        if (product.stock_quantity < quantity) {
          throw new Error(
            product.stock_quantity > 0
              ? `Stock insuffisant pour "${product.name}" : ${product.stock_quantity} disponible(s).`
              : `"${product.name}" est en rupture de stock.`
          );
        }

        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;

        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [quantity, product.id]
        );

        resolvedItems.push({
          product_id: product.id,
          product_name_snapshot: product.name,
          unit_price: unitPrice,
          quantity,
          line_total: lineTotal,
          selected_color: it.color || null,
          selected_size: it.size || null,
        });
      }

      const shippingFeeValue = Number(shipping_fee) || 0;
      const total = subtotal + shippingFeeValue;

      // Paiement à la livraison = statut "pending" jusqu'à réception.
      // Paiement carte = "pending" également ici ; passera à "paid" une fois
      // le prestataire (iyzico/PayTR) branché et son webhook confirmé.
      const orderResult = await client.query(
        `INSERT INTO orders
          (customer_name, customer_phone, customer_email, shipping_address, shipping_city,
           shipping_postal_code, customer_note, payment_method, payment_status,
           subtotal, shipping_fee, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10,$11) RETURNING *`,
        [
          customer_name, customer_phone, customer_email || null, shipping_address, shipping_city,
          shipping_postal_code || null, customer_note || null, payment_method,
          subtotal, shippingFeeValue, total,
        ]
      );
      const order = orderResult.rows[0];

      for (const it of resolvedItems) {
        await client.query(
          `INSERT INTO order_items
            (order_id, product_id, product_name_snapshot, unit_price, quantity, line_total, selected_color, selected_size)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [order.id, it.product_id, it.product_name_snapshot, it.unit_price, it.quantity, it.line_total, it.selected_color, it.selected_size]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        id: order.id,
        total: order.total,
        currency: order.currency,
        payment_method: order.payment_method,
        // TODO: quand l'API iyzico/PayTR sera branchée, renvoyer ici l'URL de
        // paiement à laquelle rediriger le client si payment_method === 'card'.
        payment_redirect_url: null,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(400).json({ error: err.message || 'Impossible de créer la commande.' });
    } finally {
      client.release();
    }
  }
);

// GET /api/orders/:id - suivi public d'une commande (le client peut vérifier son statut)
router.get('/:id', async (req, res) => {
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Commande introuvable.' });

    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =========================================================
// Routes ADMIN
// =========================================================

// Liste des commandes avec filtre optionnel par statut
router.get('/', authenticateAdmin, async (req, res) => {
  const { status } = req.query;
  try {
    const params = [];
    let whereClause = '';
    if (status) {
      params.push(status);
      whereClause = 'WHERE status = $1';
    }
    const result = await pool.query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Détail d'une commande (admin)
router.get('/admin/:id/items', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT oi.*, p.reference AS product_reference
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Changer le statut de la commande (préparation, expédiée, livrée, annulée)
router.put(
  '/:id/status',
  authenticateAdmin,
  [body('status').isIn(['nouvelle', 'en_preparation', 'expediee', 'livree', 'annulee'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const current = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [req.params.id]);
      if (current.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Commande introuvable.' });
      }

      // Annulation : on remet le stock des articles de la commande, une seule
      // fois (si elle n'était pas déjà annulée).
      if (req.body.status === 'annulee' && current.rows[0].status !== 'annulee') {
        await client.query(
          `UPDATE products p SET stock_quantity = p.stock_quantity + oi.quantity
             FROM order_items oi
            WHERE oi.order_id = $1 AND oi.product_id = p.id`,
          [req.params.id]
        );
      }

      const result = await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [req.body.status, req.params.id]
      );
      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    } finally {
      client.release();
    }
  }
);

// Marquer le paiement (utile pour le paiement à la livraison une fois encaissé,
// ou pour un rapprochement manuel avant que le webhook du prestataire soit branché)
router.put(
  '/:id/payment',
  authenticateAdmin,
  [body('payment_status').isIn(['pending', 'paid', 'failed', 'refunded'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const result = await pool.query(
        'UPDATE orders SET payment_status = $1 WHERE id = $2 RETURNING *',
        [req.body.payment_status, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Commande introuvable.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
);

module.exports = router;
