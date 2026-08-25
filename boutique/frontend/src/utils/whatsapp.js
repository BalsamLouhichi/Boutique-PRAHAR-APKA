export function buildWhatsAppMessage(items) {
  const lines = items.map((it, idx) => {
    const details = [it.color && `Couleur: ${it.color}`, it.size && `Taille: ${it.size}`]
      .filter(Boolean)
      .join(', ');
    const reference = it.reference ? `Référence: ${it.reference}` : 'Référence: Non renseignée';
    return `${idx + 1}. ${it.product_name} — ${reference} — Qté: ${it.quantity}${details ? ` (${details})` : ''}`;
  });

  return [
    'Bonjour, je souhaite demander un devis pour les articles suivants :',
    '',
    ...lines,
    '',
    'Merci de me confirmer la disponibilité et les prix en gros.',
  ].join('\n');
}

export function buildWhatsAppUrl(phoneNumber, message) {
  const cleanPhone = (phoneNumber || '').replace(/[^\d]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
