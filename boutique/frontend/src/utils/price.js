// Formate un prix avec la devise (TRY par défaut). La devise réelle du site
// est stockée dans site_settings et peut être récupérée via api.getSettings().
export function formatPrice(amount, currency = 'TRY') {
  const value = Number(amount) || 0;
  const symbols = { TRY: '₺', TND: 'DT', EUR: '€', USD: '$' };
  const symbol = symbols[currency] || currency;
  return `${value.toFixed(2)} ${symbol}`;
}

// Retourne le prix effectif à payer (promo si présente, sinon prix normal)
export function effectivePrice(product) {
  if (product.promo_price != null && Number(product.promo_price) > 0) {
    return Number(product.promo_price);
  }
  return Number(product.price) || 0;
}

export function hasPromo(product) {
  return product.promo_price != null && Number(product.promo_price) > 0
    && Number(product.promo_price) < Number(product.price);
}
