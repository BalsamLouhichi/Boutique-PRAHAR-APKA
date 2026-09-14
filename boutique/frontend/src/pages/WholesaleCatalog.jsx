import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import WholesaleProductCard from '../components/WholesaleProductCard.jsx';
import WholesaleFilterSidebar from '../components/WholesaleFilterSidebar.jsx';
import WholesaleCartDrawer from '../components/WholesaleCartDrawer.jsx';
import { useWholesaleCart } from '../context/WholesaleCartContext.jsx';
import { getWholesaleAccount, getWholesaleDisplayName } from '../utils/wholesaleAccount.js';

export default function WholesaleCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', season: '', gender: '' });
  const [account] = useState(getWholesaleAccount);
  const { totalItems, setIsOpen } = useWholesaleCart();
  const navigate = useNavigate();

  const displayName = getWholesaleDisplayName(account);
  const initial = displayName.charAt(0).toUpperCase() || '?';

  useEffect(() => {
    setLoading(true);
    api.getWholesaleProducts({ ...filters, search })
      .then(setProducts)
      .catch((err) => {
        if (err.message.includes('401') || err.message.toLowerCase().includes('connexion')) {
          localStorage.removeItem('wholesale_token');
          navigate('/gros/connexion');
        }
      })
      .finally(() => setLoading(false));
  }, [filters, search]);

  function handleLogout() {
    localStorage.removeItem('wholesale_token');
    localStorage.removeItem('wholesale_account');
    navigate('/gros/connexion');
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="bg-white border-b border-[var(--color-line)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors shrink-0"
              title="Retour au site"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Retour au site</span>
            </Link>
            <span className="hidden md:block font-display text-xl truncate">Catalogue en gros</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {displayName && (
              <div
                className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-line)] pl-1.5 pr-3 py-1"
                title={account?.company_name && account.company_name !== displayName ? account.company_name : undefined}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)] text-white text-xs font-semibold">
                  {initial}
                </span>
                <span className="text-sm font-medium text-[var(--color-ink)] max-w-[140px] truncate">{displayName}</span>
              </div>
            )}
            <button onClick={() => setIsOpen(true)} className="relative border border-[var(--color-line)] rounded-full px-4 py-2 text-sm font-medium hover:border-[var(--color-amber)]">
              Panier
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[var(--color-amber)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{totalItems}</span>
              )}
            </button>
            <button onClick={handleLogout} className="text-sm text-[var(--color-muted)] hover:underline">Déconnexion</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl">Catalogue</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">{products.length} article(s) trouvé(s)</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm w-56"
            />
            <button
              type="button"
              onClick={() => { setIsOpen(false); setFiltersOpen(true); }}
              className="lg:hidden border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              Filtres
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          <WholesaleFilterSidebar filters={filters} onChange={setFilters} isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />

          <div className="flex-1">
            {loading ? (
              <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
            ) : products.length === 0 ? (
              <p className="text-[var(--color-muted)] text-center py-20">Aucun article ne correspond à ces filtres.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 items-stretch">
                {products.map((p) => <WholesaleProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <WholesaleCartDrawer />
    </div>
  );
}
