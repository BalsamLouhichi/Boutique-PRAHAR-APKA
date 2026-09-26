import { Link } from 'react-router-dom';

// Cloche de notification : nombre de commandes pas encore consultées par
// l'admin (orders.viewed_at IS NULL). Cliquer amène sur la liste des
// commandes, où ouvrir une commande la marque automatiquement comme vue.
export default function OrderNotificationBell({ count }) {
  return (
    <Link
      to="/admin/orders"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] hover:border-[var(--color-amber)] transition-colors"
      aria-label={count > 0 ? `${count} nouvelle(s) commande(s) non consultée(s)` : 'Aucune nouvelle commande'}
      title="Commandes"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
