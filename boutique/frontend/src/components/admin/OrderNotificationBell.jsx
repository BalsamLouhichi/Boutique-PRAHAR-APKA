import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatPrice } from '../../utils/price.js';
import { formatRelativeTime } from '../../utils/relativeTime.js';

// Cloche de notification : liste des commandes pas encore consultées
// (orders.viewed_at IS NULL). Cliquer sur la cloche les marque toutes comme
// vues immédiatement (le badge se vide), tout en gardant la liste affichée
// dans le panneau tant qu'il reste ouvert. Cliquer sur une commande ouvre
// la page Commandes avec cette commande déjà sélectionnée.
export default function OrderNotificationBell({ orders, onOrdersUpdated }) {
  const [open, setOpen] = useState(false);
  const [panelOrders, setPanelOrders] = useState([]);
  const navigate = useNavigate();

  const unviewed = orders.filter((o) => !o.viewed_at);

  function handleToggle() {
    if (!open) {
      setPanelOrders(unviewed.slice(0, 8));
      if (unviewed.length > 0) {
        api.markAllOrdersViewed()
          .then(() => onOrdersUpdated?.())
          .catch(() => {});
      }
    }
    setOpen((o) => !o);
  }

  function handleSelect(order) {
    setOpen(false);
    navigate('/admin/orders', { state: { openOrderId: order.id } });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] hover:border-[var(--color-amber)] transition-colors"
        aria-label={unviewed.length > 0 ? `${unviewed.length} nouvelle(s) commande(s) non consultée(s)` : 'Aucune nouvelle commande'}
        title="Commandes"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unviewed.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unviewed.length > 99 ? '99+' : unviewed.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] rounded-xl border border-[var(--color-line)] bg-white shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-line)]">
              <h3 className="font-display text-lg text-[var(--color-ink)]">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {panelOrders.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--color-muted)] text-center">Aucune nouvelle commande.</p>
              ) : (
                panelOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => handleSelect(order)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[var(--color-line)] last:border-b-0 hover:bg-[var(--color-paper)] transition-colors"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-white text-xs font-bold">
                      {order.customer_name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-[var(--color-ink)]">
                        Nouvelle commande de <b>{order.customer_name}</b> — {formatPrice(order.total, order.currency)}
                      </span>
                      <span className="block text-xs text-[var(--color-muted)] mt-0.5">{formatRelativeTime(order.created_at)}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); navigate('/admin/orders'); }}
              className="w-full text-center text-sm font-medium text-[var(--color-amber-dark)] hover:underline px-4 py-3 border-t border-[var(--color-line)]"
            >
              Voir toutes les commandes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
