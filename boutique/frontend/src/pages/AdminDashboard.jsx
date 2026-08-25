import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductForm from '../components/admin/ProductForm.jsx';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isArticleManagement = location.pathname === '/admin/articles';

  function loadData() {
    setLoading(true);
    Promise.all([api.getAdminProducts(), api.getCategories(), api.getAdminQuotes()])
      .then(([p, c, q]) => {
        setProducts(p);
        setCategories(c);
        setQuotes(q);
      })
      .catch((err) => {
        if (err.message.includes('401') || err.message.toLowerCase().includes('session')) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet article définitivement ?')) return;
    await api.deleteProduct(id);
    loadData();
  }

  const activeProducts = products.filter((product) => product.is_active).length;
  const newProducts = products.filter((product) => product.is_new).length;
  const featuredProducts = products.filter((product) => product.is_featured).length;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex">
      <aside className="w-72 bg-[var(--color-ink)] text-white p-6 flex-shrink-0">
        <div className="mb-8">
          <h1 className="font-display text-3xl">PRAHAR ŞAPKA</h1>
          <p className="mt-2 text-sm text-white/70">Admin panel</p>
        </div>

        <nav className="space-y-2">
          <Link to="/admin" className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${!isArticleManagement ? 'bg-white/10 text-white font-medium' : 'text-white/80 hover:bg-white/10'}`}>
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/articles" className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${isArticleManagement ? 'bg-white/10 text-white font-medium' : 'text-white/80 hover:bg-white/10'}`}>
            <span>Gestion des articles</span>
          </Link>
          <Link to="/admin/categories" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">
            <span>Catégories</span>
          </Link>
          <button
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            className="w-full text-left rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors"
          >
            + Nouvel article
          </button>
        </nav>

        <div className="mt-10 pt-6 border-t border-white/10">
          <button onClick={handleLogout} className="text-sm text-white/80 hover:text-white transition-colors">
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1">
        {isArticleManagement ? (
          <header className="bg-white border-b border-[var(--color-line)] px-6 py-5">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl text-[var(--color-ink)]">Gestion des articles</h1>
                <p className="text-sm text-[var(--color-muted)]">Gérez les articles de votre boutique</p>
              </div>
              <button
                onClick={() => { setEditingProduct(null); setShowForm(true); }}
                className="bg-[var(--color-amber)] hover:bg-[var(--color-amber-dark)] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
              >
                + Ajouter un article
              </button>
            </div>
          </header>
        ) : (
          <header className="bg-white border-b border-[var(--color-line)] px-6 py-4 flex items-center justify-between">
            <h2 className="font-display text-xl">Dashboard des statistiques</h2>
          </header>
        )}

        <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
        ) : (
          <>
            {!isArticleManagement && (
            <section className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--color-ink)] text-white rounded-2xl p-5">
                <p className="text-sm text-white/70">Articles total</p>
                <p className="font-display text-4xl mt-3">{products.length}</p>
                <p className="text-xs text-white/60 mt-2">{activeProducts} visibles dans la boutique</p>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--color-line)] p-5">
                <p className="text-sm text-[var(--color-muted)]">Catégories</p>
                <p className="font-display text-4xl text-[var(--color-ink)] mt-3">{categories.length}</p>
                <p className="text-xs text-[var(--color-muted)] mt-2">{categories.filter((category) => category.is_active).length} actives</p>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--color-line)] p-5">
                <p className="text-sm text-[var(--color-muted)]">Demandes de devis</p>
                <p className="font-display text-4xl text-[var(--color-ink)] mt-3">{quotes.length}</p>
                <p className="text-xs text-[var(--color-muted)] mt-2">Dernières demandes reçues</p>
              </div>
              <div className="bg-[var(--color-amber)] text-white rounded-2xl p-5">
                <p className="text-sm text-white/80">Articles masqués</p>
                <p className="font-display text-4xl mt-3">{products.length - activeProducts}</p>
                <p className="text-xs text-white/75 mt-2">Articles non visibles sur le site</p>
              </div>
            </section>
            )}

            {!isArticleManagement && <section className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-[var(--color-line)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-display text-xl text-[var(--color-ink)]">État du catalogue</h3>
                    <p className="text-sm text-[var(--color-muted)] mt-1">Répartition de vos articles</p>
                  </div>
                  <Link to="/admin/articles" className="text-sm font-semibold text-[var(--color-amber-dark)]">Gérer les articles</Link>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--color-muted)]">Articles visibles</span><strong>{activeProducts}</strong></div>
                  <div className="h-2 rounded-full bg-[var(--color-paper)] overflow-hidden"><div className="h-full bg-[var(--color-sage)]" style={{ width: `${products.length ? (activeProducts / products.length) * 100 : 0}%` }} /></div>
                  <div className="flex justify-between"><span className="text-[var(--color-muted)]">Nouveautés</span><strong>{newProducts}</strong></div>
                  <div className="flex justify-between"><span className="text-[var(--color-muted)]">Articles à la une</span><strong>{featuredProducts}</strong></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--color-line)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-display text-xl text-[var(--color-ink)]">Activité récente</h3>
                    <p className="text-sm text-[var(--color-muted)] mt-1">Les derniers articles ajoutés</p>
                  </div>
                  <Link to="/admin/categories" className="text-sm font-semibold text-[var(--color-amber-dark)]">Catégories</Link>
                </div>
                <div className="space-y-3">
                  {products.slice(0, 4).map((product) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-paper)] overflow-hidden flex-shrink-0">
                        {product.primary_image && <img src={product.primary_image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{product.category_name || 'Sans catégorie'}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{product.is_active ? 'Visible' : 'Masqué'}</span>
                    </div>
                  ))}
                  {products.length === 0 && <p className="text-sm text-[var(--color-muted)]">Aucun article ajouté.</p>}
                </div>
              </div>
            </section>}

            {isArticleManagement && <div className="bg-white rounded-2xl border border-[var(--color-line)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-paper)] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Photo</th>
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Saison</th>
                  <th className="px-4 py-3 font-semibold">Genre</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--color-line)]">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--color-paper)] overflow-hidden">
                        {p.primary_image && <img src={p.primary_image} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}{p.is_new && <span className="ml-2 text-xs bg-[var(--color-sage)] text-white px-2 py-0.5 rounded-full">Nouveau</span>}</td>
                    <td className="px-4 py-3">{p.category_name}</td>
                    <td className="px-4 py-3">{p.season}</td>
                    <td className="px-4 py-3">{p.gender}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Visible' : 'Masqué'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => { setEditingProduct(p); setShowForm(true); }} className="text-[var(--color-amber-dark)] hover:underline">Modifier</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-muted)]">Aucun article. Créez le premier !</td></tr>
                )}
              </tbody>
            </table>
            </div>}
          </>
        )}
        </main>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadData(); }}
        />
      )}
    </div>
  );
}
