// Stock des articles en détail : un compteur par couleur (product.variants =
// [{ color, stock_quantity }]). color === '' pour un article sans couleurs.

// Stock disponible pour la couleur actuellement sélectionnée.
// Renvoie null si l'info n'est pas chargée (on ne bloque alors rien).
export function getVariantStock(product, color) {
  if (!product?.variants) return null;
  const variant = product.variants.find((v) => (v.color || '') === (color || ''));
  return variant ? variant.stock_quantity : 0;
}

// Stock total toutes couleurs confondues, pour le badge "Rupture de stock"
// affiché avant que le client ait choisi une couleur.
export function getTotalStock(product) {
  if (!product?.variants) return null;
  return product.variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
}
