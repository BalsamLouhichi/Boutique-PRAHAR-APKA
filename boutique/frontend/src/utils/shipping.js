// Frais de livraison : recalculés côté client pour l'affichage (panier,
// checkout), mais toujours revalidés côté serveur à la commande — jamais de
// confiance dans un montant envoyé par le navigateur.

export function computeShipping(subtotal, settings = {}) {
  const fee = Number(settings.shipping_fee) || 0;
  const threshold = Number(settings.free_shipping_threshold) || 0;
  const freeShipping = threshold > 0 && subtotal >= threshold;

  return {
    fee: freeShipping ? 0 : fee,
    freeShipping,
    remaining: threshold > 0 ? Math.max(threshold - subtotal, 0) : 0,
  };
}
