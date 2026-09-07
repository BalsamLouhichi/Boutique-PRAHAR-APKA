import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import WholesaleProductCard from '../components/WholesaleProductCard.jsx';
import WholesaleFilterSidebar from '../components/WholesaleFilterSidebar.jsx';
import WholesaleCartDrawer from '../components/WholesaleCartDrawer.jsx';
import { useWholesaleCart } from '../context/WholesaleCartContext.jsx';

export default function WholesaleCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', season: '', gender: '' });
  const { totalItems, setIsOpen } = useWholesaleCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getWholesaleProducts(filters)
      .then(setProducts)
      .catch((err) => {
        if (err.message.includes('401') || err.message.toLowerCase().includes('connexion')) {
          localStorage.removeItem('wholesale_token');
          navigate('/gros/connexion');
        }
      })
      .finally(() => setLoading(false));
  }, [filters]);

  function handleLogout() {
    localStorage.removeItem('wholesale_token');
    navigate('/gros/connexion');
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="bg-white border-b border-[var(--color-line)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-display text-xl">Catalogue en gros</span>
          <div className="flex items-center gap-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex gap-8">
        <WholesaleFilterSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1">
          <p className="text-sm text-[var(--color-muted)] mb-6">{products.length} article(s) disponible(s)</p>
          {loading ? (
            <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
          ) : products.length === 0 ? (
            <p className="text-[var(--color-muted)] text-center py-20">Aucun article ne correspond à ces filtres.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p) => <WholesaleProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      <WholesaleCartDrawer />
    </div>
  );
}
