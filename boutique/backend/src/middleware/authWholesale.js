const jwt = require('jsonwebtoken');

function authenticateWholesale(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Connexion requise pour accéder au catalogue en gros.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'wholesale') {
      return res.status(403).json({ error: 'Accès réservé aux comptes grossistes.' });
    }
    req.wholesaleCustomer = payload; // { id, email, companyName }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
  }
}

module.exports = { authenticateWholesale };
