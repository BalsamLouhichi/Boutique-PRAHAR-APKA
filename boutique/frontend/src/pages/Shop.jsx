import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import FilterSidebar from '../components/FilterSidebar.jsx';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', season: '', gender: '', is_new: '' });

  useEffect(() => {
    setLoading(true);
    api.getProducts({ ...filters, search })
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [filters, search]);

  return (
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
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden border border-[var(--color-line)] rounded-lg px-4 py-2 text-sm font-medium"
          >
            Filtres
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <FilterSidebar filters={filters} onChange={setFilters} isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />

        <div className="flex-1">
          {loading ? (
            <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--color-muted)]">Aucun article ne correspond à ces filtres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 items-stretch">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
