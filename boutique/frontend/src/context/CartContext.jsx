import { createContext, useContext, useEffect, useState } from 'react';
import { effectivePrice } from '../utils/price.js';
import { getVariantStock } from '../utils/stock.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'boutique_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product, quantity, color, size) {
    const minQty = 1;
    // Stock connu au moment de l'ajout (peut devenir périmé si le stock
    // change ensuite ailleurs ; le serveur revalide de toute façon à la
    // commande — ceci ne sert qu'à guider la saisie dans le panier).
    const stock = getVariantStock(product, color);
    const qty = Math.max(Math.min(quantity, stock ?? Infinity), minQty);
    const primaryImage = product.primary_image
      || product.images?.find((image) => image.is_primary)?.image_url
      || product.images?.[0]?.image_url
      || null;

    setItems((prev) => {
      const key = `${product.id}-${color || ''}-${size || ''}`;
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, stock ?? Infinity);
        return prev.map((it) => (it.key === key ? { ...it, quantity: nextQty, stock } : it));
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          product_name: product.name,
          reference: product.reference || null,
          image: primaryImage,
          min_order_qty: minQty,
          unit_price: effectivePrice(product),
          quantity: qty,
          color: color || null,
          size: size || null,
          stock,
        },
      ];
    });
    setIsOpen(true);
  }

  // Le composant appelant est responsable de ne pas dépasser it.stock (le
  // champ de saisie du panier affiche "Hors stock" et refuse sinon) : on se
  // contente ici d'un garde-fou minimal.
  function updateQuantity(key, quantity) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, quantity: Math.max(Math.min(quantity, it.stock ?? Infinity), it.min_order_qty) } : it))
    );
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = items.reduce((sum, it) => sum + (Number(it.unit_price) || 0) * it.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalItems, subtotal, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans CartProvider');
  return ctx;
}
