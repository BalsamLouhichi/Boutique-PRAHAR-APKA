import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', key: 'dashboard' },
  { to: '/admin/articles', label: 'Gestion des articles', key: 'articles' },
  { to: '/admin/categories', label: 'Catégories', key: 'categories' },
  { to: '/admin/orders', label: 'Commandes', key: 'orders' },
  { to: '/admin/comptes-gros', label: 'Comptes grossistes', key: 'wholesale' },
];

// Mise en page partagée par toutes les pages admin : sidebar fixe sur
// desktop, tiroir coulissant déclenché par un bouton hamburger sur mobile.
export default function AdminLayout({ active, extraNavAction, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] lg:flex">
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-[var(--color-ink)] text-white px-4 py-3">
        <Link to="/" className="font-display text-xl">PRAHAR ŞAPKA</Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20"
          aria-label="Ouvrir le menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-[var(--color-ink)] text-white p-6 flex-shrink-0 transform transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-start justify-between gap-3">
          <Link to="/" className="block hover:opacity-80 transition-opacity">
            <h1 className="font-display text-3xl">PRAHAR ŞAPKA</h1>
            <p className="mt-2 text-sm text-white/70">Admin panel</p>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
            aria-label="Fermer le menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${
                active === item.key ? 'bg-white/10 text-white font-medium' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
          {extraNavAction}
        </nav>

        <div className="mt-10 pt-6 border-t border-white/10">
          <button onClick={handleLogout} className="text-sm text-white/80 hover:text-white transition-colors">
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
