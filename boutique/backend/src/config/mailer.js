const nodemailer = require('nodemailer');

// Configuration SMTP générique. Fonctionne avec Gmail (mot de passe
// d'application), Brevo (ex-Sendinblue, offre gratuite généreuse), ou tout
// autre fournisseur SMTP classique. Variables à définir sur Render :
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    console.warn('SMTP non configuré : les emails seront seulement affichés dans les logs.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();

  if (!t) {
    // Pas de SMTP configuré : on log au lieu de planter, pour ne jamais
    // bloquer une inscription ou une validation faute d'email envoyé.
    console.log(`[EMAIL NON ENVOYÉ - SMTP absent] À: ${to} | Sujet: ${subject}`);
    return { sent: false };
  }

  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@votre-domaine.com',
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('Erreur envoi email:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendMail };
