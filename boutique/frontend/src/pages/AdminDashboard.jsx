import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api, resolveImageUrl } from '../api/client.js';
import ProductForm from '../components/admin/ProductForm.jsx';
import { formatPrice } from '../utils/price.js';

const AMBER = '#D98E3F';
const SAGE = '#4E6E58';
const MUTED = '#9CA3AF';
const STATUS_LABELS = {
  nouvelle: 'Nouvelle',
  en_preparation: 'En préparation',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};
const STATUS_COLORS = {
  nouvelle: AMBER,
  en_preparation: '#6B8CAE',
  expediee: SAGE,
  livree: '#1B2A4A',
  annulee: '#E5484D',
};

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isArticleManagement = location.pathname === '/admin/articles';
  const activeSaleType = searchParams.get('type') === 'gros' ? 'gros' : 'detail';

  function loadData() {
    setLoading(true);
    Promise.all([api.getAdminProducts(), api.getCategories(), api.getOrders()])
      .then(([p, c, o]) => {
        setProducts(p);
        setCategories(c);
        setOrders(o);
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

  async function handleEdit(product) {
    try {
      const completeProduct = await api.getAdminProduct(product.id);
      setEditingProduct(completeProduct);
      setShowForm(true);
    } catch (err) {
      alert(err.message || 'Impossible de charger les détails du produit.');
    }
  }

  const activeProducts = products.filter((product) => product.is_active).length;
  const newProducts = products.filter((product) => product.is_new).length;
  const featuredProducts = products.filter((product) => product.is_featured).length;
  const activeOrders = orders.filter((order) => order.status !== 'annulee');
  const revenue = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paidRevenue = orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const newOrders = orders.filter((order) => order.status === 'nouvelle').length;
  const normalizedProductSearch = productSearch.trim().toLocaleLowerCase();
  const productsBySaleType = products.filter((product) => (product.sale_type || 'detail') === activeSaleType);
  const filteredProducts = normalizedProductSearch
    ? productsBySaleType.filter((product) => [product.name, product.reference]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase().includes(normalizedProductSearch)))
    : productsBySaleType;
  const revenueByDay = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let index = 13; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - index);
      days.push({
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        total: 0,
      });
    }

    const daysByDate = Object.fromEntries(days.map((day) => [day.date, day]));
    orders.filter((order) => order.status !== 'annulee').forEach((order) => {
      const date = order.created_at?.slice(0, 10);
      if (daysByDate[date]) daysByDate[date].total += Number(order.total || 0);
    });

    return days;
  }, [orders]);
  const ordersByStatus = useMemo(() => {
    const counts = {};
    orders.forEach((order) => { counts[order.status] = (counts[order.status] || 0) + 1; });

    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || MUTED,
    }));
  }, [orders]);

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
          <Link to="/admin/orders" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">
            <span>Commandes</span>
          </Link>
          <Link to="/admin/comptes-gros" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">
            <span>Comptes grossistes</span>
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
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <div className="bg-[var(--color-ink)] text-white rounded-2xl p-5">
                <p className="text-sm text-white/70">Chiffre d'affaires</p>
                <p className="font-display text-3xl mt-3">{formatPrice(revenue)}</p>
                <p className="text-xs text-white/60 mt-2">Commandes hors annulations</p>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--color-line)] p-5">
                <p className="text-sm text-[var(--color-muted)]">Commandes</p>
                <p className="font-display text-4xl text-[var(--color-ink)] mt-3">{orders.length}</p>
                <p className="text-xs text-[var(--color-muted)] mt-2">{newOrders} nouvelle(s) à traiter</p>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--color-line)] p-5">
                <p className="text-sm text-[var(--color-muted)]">Paiements encaissés</p>
                <p className="font-display text-3xl text-[var(--color-ink)] mt-3">{formatPrice(paidRevenue)}</p>
                <p className="text-xs text-[var(--color-muted)] mt-2">Commandes marquées payées</p>
              </div>
              <div className="bg-[var(--color-amber)] text-white rounded-2xl p-5">
                <p className="text-sm text-white/80">Articles visibles</p>
                <p className="font-display text-4xl mt-3">{activeProducts}</p>
                <p className="text-xs text-white/75 mt-2">sur {products.length} article(s) au total</p>
              </div>
            </section>
            )}

            {!isArticleManagement && <section className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-line)] p-6">
                <h3 className="font-display text-xl text-[var(--color-ink)]">Chiffre d'affaires (14 derniers jours)</h3>
                <p className="text-sm text-[var(--color-muted)] mt-1 mb-4">Total des commandes, hors annulations</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueByDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E2DC" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatPrice(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E4E2DC', fontSize: 12 }} />
                    <Line type="monotone" dataKey="total" stroke={AMBER} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-[var(--color-line)] p-6">
                <h3 className="font-display text-xl text-[var(--color-ink)]">Statuts des commandes</h3>
                <p className="text-sm text-[var(--color-muted)] mt-1 mb-4">Répartition actuelle</p>
                {ordersByStatus.length === 0 ? (
                  <p className="py-16 text-center text-sm text-[var(--color-muted)]">Aucune commande pour le moment.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={ordersByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {ordersByStatus.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E4E2DC', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>}

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
                    <h3 className="font-display text-xl text-[var(--color-ink)]">Dernières commandes</h3>
                    <p className="text-sm text-[var(--color-muted)] mt-1">Suivi des dernières ventes</p>
                  </div>
                  <Link to="/admin/orders" className="text-sm font-semibold text-[var(--color-amber-dark)]">Voir les commandes</Link>
                </div>
                <div className="space-y-3">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-paper)] flex items-center justify-center text-sm font-semibold text-[var(--color-amber-dark)]">#{order.id.slice(0, 4)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{order.customer_name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{formatPrice(order.total, order.currency)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'nouvelle' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{order.status === 'nouvelle' ? 'Nouvelle' : order.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-[var(--color-muted)]">Aucune commande pour le moment.</p>}
                </div>
              </div>
            </section>}

            {isArticleManagement && <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-xl border border-[var(--color-line)] bg-white p-1" role="tablist" aria-label="Type d'article">
                {['detail', 'gros'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="tab"
                    aria-selected={activeSaleType === type}
                    onClick={() => setSearchParams({ type })}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${activeSaleType === type ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                  >
                    {type === 'detail' ? 'Articles en détail' : 'Articles en gros'}
                    <span className="ml-2 text-xs opacity-70">{products.filter((product) => (product.sale_type || 'detail') === type).length}</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Rechercher par nom ou référence..."
                aria-label="Rechercher un article"
                className="w-full sm:w-80 border border-[var(--color-line)] rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
            <div className="bg-white rounded-2xl border border-[var(--color-line)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-paper)] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Photo</th>
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Saison</th>
                  <th className="px-4 py-3 font-semibold">Genre</th>
                  <th className="px-4 py-3 font-semibold">Canal</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--color-line)]">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--color-paper)] overflow-hidden">
                        {p.primary_image && <img src={resolveImageUrl(p.primary_image)} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}{p.is_new && <span className="ml-2 text-xs bg-[var(--color-sage)] text-white px-2 py-0.5 rounded-full">Nouveau</span>}</td>
                    <td className="px-4 py-3">{p.category_name}</td>
                    <td className="px-4 py-3">{p.season}</td>
                    <td className="px-4 py-3">{p.gender}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-[var(--color-paper)] px-2 py-1 text-xs font-medium">{p.sale_type === 'gros' ? 'Gros' : 'Détail'}</span></td>
                    <td className="px-4 py-3">
                      {p.sale_type === 'gros' ? (
                        <span className="text-[var(--color-muted)]">—</span>
                      ) : (
                        <span className={`font-medium ${p.total_stock <= 0 ? 'text-red-600' : p.total_stock <= 5 ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-ink)]'}`}>
                          {p.total_stock <= 0 ? 'Rupture' : p.total_stock}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Visible' : 'Masqué'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => handleEdit(p)} className="text-[var(--color-amber-dark)] hover:underline">Modifier</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-[var(--color-muted)]">Aucun article ne correspond à cette recherche.</td></tr>
                )}
              </tbody>
            </table>
            </div></>}
          </>
        )}
        </main>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          saleType={editingProduct?.sale_type || activeSaleType}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadData(); }}
        />
      )}
    </div>
  );
}
