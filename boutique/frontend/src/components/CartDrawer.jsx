import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { resolveImageUrl } from '../api/client.js';
import { formatPrice } from '../utils/price.js';

// Ligne de panier : quantité modifiable uniquement par les boutons +/- (pas
// de saisie manuelle), bornée au stock connu pour cette couleur.
function CartLineItem({ item, onUpdateQuantity, onRemove }) {
  const atMax = item.stock != null && item.quantity >= item.stock;
  const atMin = item.quantity <= 1;

  return (
    <li className="flex gap-3 border-b border-[var(--color-line)] pb-4">
      <div className="w-16 h-16 rounded-lg bg-[var(--color-paper)] flex-shrink-0 overflow-hidden">
        {item.image && <img src={resolveImageUrl(item.image)} alt={item.product_name} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product_name}</p>
        <p className="text-sm font-semibold text-[var(--color-amber-dark)]">{formatPrice(item.unit_price)}</p>
        {[item.color, item.size].filter(Boolean).length > 0 && (
          <p className="text-xs text-[var(--color-muted)]">{[item.color, item.size].filter(Boolean).join(' · ')}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <label className="text-xs text-[var(--color-muted)]">Qté</label>
          <div className="flex items-center border border-[var(--color-line)] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.key, item.quantity - 1)}
              disabled={atMin}
              aria-label="Diminuer la quantité"
              className="w-7 h-7 flex items-center justify-center text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-paper)]"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
              disabled={atMax}
              aria-label="Augmenter la quantité"
              className="w-7 h-7 flex items-center justify-center text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-paper)]"
            >
              +
            </button>
          </div>
        </div>
        {atMax && <p className="mt-1 text-xs font-medium text-red-600">Stock maximum atteint</p>}
      </div>
      <button onClick={() => onRemove(item.key)} className="text-xs text-red-500 hover:underline self-start" aria-label={`Retirer ${item.product_name}`}>Retirer</button>
    </li>
  );
}

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, totalItems, subtotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setIsOpen(false)} aria-hidden="true" />}
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Panier">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-line)]">
          <h2 className="font-display text-xl">Votre panier ({totalItems})</h2>
          <button onClick={() => setIsOpen(false)} aria-label="Fermer le panier" className="text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm mt-8 text-center">Votre panier est vide. Parcourez le catalogue pour ajouter des articles.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <CartLineItem key={it.key} item={it} onUpdateQuantity={updateQuantity} onRemove={removeItem} />
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--color-line)] px-6 py-5 space-y-3">
            <div className="flex items-center justify-between text-lg font-display"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
            <button onClick={() => { setIsOpen(false); navigate('/checkout'); }} className="w-full bg-[var(--color-ink)] hover:bg-[var(--color-ink-light)] text-white font-semibold py-3 rounded-lg transition-colors">Passer la commande</button>
            <button onClick={clearCart} className="w-full text-xs text-[var(--color-muted)] hover:underline">Vider le panier</button>
          </div>
        )}
      </aside>
    </>
  );
}
