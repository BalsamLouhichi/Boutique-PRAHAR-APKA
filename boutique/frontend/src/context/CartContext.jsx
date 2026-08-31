import { createContext, useContext, useEffect, useState } from 'react';
import { effectivePrice } from '../utils/price.js';

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
    const qty = Math.max(quantity, minQty);
    const primaryImage = product.primary_image
      || product.images?.find((image) => image.is_primary)?.image_url
      || product.images?.[0]?.image_url
      || null;

    setItems((prev) => {
      const key = `${product.id}-${color || ''}-${size || ''}`;
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        return prev.map((it) => (it.key === key ? { ...it, quantity: it.quantity + qty } : it));
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
        },
      ];
    });
    setIsOpen(true);
  }

  function updateQuantity(key, quantity) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, quantity: Math.max(quantity, it.min_order_qty) } : it))
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
