import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatPrice } from '../utils/price.js';
import OrderNotificationBell from '../components/admin/OrderNotificationBell.jsx';

const STATUS_LABELS = {
  nouvelle: 'Nouvelle', en_preparation: 'En préparation', expediee: 'Expédiée',
  livree: 'Livrée', annulee: 'Annulée',
};
const PAYMENT_LABELS = { pending: 'En attente', paid: 'Payé', failed: 'Échoué', refunded: 'Remboursé' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewedFilter, setViewedFilter] = useState(''); // '' | 'new' | 'seen'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const activeOrders = orders.filter((order) => order.status !== 'annulee');
  const totalRevenue = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paidRevenue = orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const newOrders = orders.filter((order) => order.status === 'nouvelle').length;
  const unviewedCount = useMemo(() => orders.filter((order) => !order.viewed_at).length, [orders]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (viewedFilter === 'new' && order.viewed_at) return false;
    if (viewedFilter === 'seen' && !order.viewed_at) return false;
    if (dateFrom && order.created_at < `${dateFrom}T00:00:00`) return false;
    if (dateTo && order.created_at > `${dateTo}T23:59:59`) return false;
    if (normalizedSearch) {
      const haystack = [order.customer_name, order.customer_phone, order.shipping_address, order.shipping_city].filter(Boolean);
      if (!haystack.some((value) => value.toLocaleLowerCase().includes(normalizedSearch))) return false;
    }
    return true;
  });

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }

  function loadOrders() {
    setLoading(true);
    api.getOrders(statusFilter).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(loadOrders, [statusFilter]);

  // Ouverture directe depuis une notification (cloche) : navigate() passe
  // l'id de la commande visée dans le state de l'historique.
  useEffect(() => {
    const targetId = location.state?.openOrderId;
    if (!targetId || orders.length === 0) return;
    const target = orders.find((o) => o.id === targetId);
    if (target) openOrder(target);
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  async function openOrder(order) {
    setSelectedOrder(order);
    const items = await api.getOrderItems(order.id).catch(() => []);
    setOrderItems(items);

    // Marque la commande comme vue : décrémente le badge de notification
    // sans recharger toute la liste.
    if (!order.viewed_at) {
      api.markOrderViewed(order.id).then((res) => {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, viewed_at: res.viewed_at } : o)));
        setSelectedOrder((o) => (o?.id === order.id ? { ...o, viewed_at: res.viewed_at } : o));
      }).catch(() => {});
    }
  }

  async function changeStatus(id, status) {
    await api.updateOrderStatus(id, status);
    loadOrders();
    if (selectedOrder?.id === id) setSelectedOrder((o) => ({ ...o, status }));
  }

  async function changePayment(id, payment_status) {
    await api.updateOrderPayment(id, payment_status);
    loadOrders();
    if (selectedOrder?.id === id) setSelectedOrder((o) => ({ ...o, payment_status }));
  }

  function resetFilters() {
    setStatusFilter('');
    setViewedFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex">
      <aside className="w-72 bg-[var(--color-ink)] text-white p-6 flex-shrink-0">
        <div className="mb-8">
          <h1 className="font-display text-3xl">PRAHAR ŞAPKA</h1>
          <p className="mt-2 text-sm text-white/70">Admin panel</p>
        </div>
        <nav className="space-y-2">
          <Link to="/admin" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">Dashboard</Link>
          <Link to="/admin/articles" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">Gestion des articles</Link>
          <Link to="/admin/categories" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">Catégories</Link>
          <Link to="/admin/orders" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-white/10 text-white font-medium transition-colors">Commandes</Link>
          <Link to="/admin/comptes-gros" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">Comptes grossistes</Link>
        </nav>
        <div className="mt-10 pt-6 border-t border-white/10">
          <button onClick={handleLogout} className="text-sm text-white/80 hover:text-white transition-colors">Déconnexion</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
      <header className="bg-white border-b border-[var(--color-line)] px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-display text-xl">Commandes</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone ou adresse..."
            className="w-64 border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
            aria-label="Rechercher une commande"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={viewedFilter} onChange={(e) => setViewedFilter(e.target.value)} className="border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm">
            <option value="">Nouvelles + Vues</option>
            <option value="new">Nouvelles uniquement</option>
            <option value="seen">Vues uniquement</option>
          </select>
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-[var(--color-line)] rounded-lg px-2 py-2 text-sm" aria-label="Date de début" />
            <span>—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-[var(--color-line)] rounded-lg px-2 py-2 text-sm" aria-label="Date de fin" />
          </div>
          {(statusFilter || viewedFilter || dateFrom || dateTo || search) && (
            <button onClick={resetFilters} className="text-sm text-[var(--color-amber-dark)] hover:underline">Réinitialiser</button>
          )}
          <OrderNotificationBell orders={orders} onOrdersUpdated={loadOrders} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl bg-[var(--color-ink)] p-5 text-white">
            <p className="text-sm text-white/70">Commandes</p>
            <p className="font-display text-4xl mt-2">{orders.length}</p>
            <p className="text-xs text-white/60 mt-2">Toutes les commandes</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
            <p className="text-sm text-rose-700">Non consultées</p>
            <p className="font-display text-4xl mt-2">{unviewedCount}</p>
            <p className="text-xs text-rose-700 mt-2">{newOrders} au statut "Nouvelle"</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <p className="text-sm text-[var(--color-muted)]">Chiffre d'affaires</p>
            <p className="font-display text-2xl mt-3 text-[var(--color-ink)]">{formatPrice(totalRevenue)}</p>
            <p className="text-xs text-[var(--color-muted)] mt-2">Hors commandes annulées</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-5">
            <p className="text-sm text-[var(--color-muted)]">Paiements encaissés</p>
            <p className="font-display text-2xl mt-3 text-rose-700">{formatPrice(paidRevenue)}</p>
            <p className="text-xs text-[var(--color-muted)] mt-2">Commandes marquées payées</p>
          </div>
        </section>

        <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[var(--color-line)] overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-[var(--color-muted)]">Chargement...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-paper)] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Paiement</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const isNew = !o.viewed_at;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => openOrder(o)}
                      className={`border-t cursor-pointer hover:bg-[var(--color-paper)] ${
                        selectedOrder?.id === o.id
                          ? 'bg-[var(--color-paper)] border-[var(--color-line)]'
                          : isNew
                            ? 'bg-rose-50 border-rose-100'
                            : 'border-[var(--color-line)]'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" aria-hidden="true" />}
                          <div>
                            <p className={isNew ? 'font-semibold' : 'font-medium'}>{o.customer_name}</p>
                            <p className="text-xs text-[var(--color-muted)]">{o.customer_phone}</p>
                          </div>
                          {isNew && <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">Nouveau</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatPrice(o.total, o.currency)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{STATUS_LABELS[o.status]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${o.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {PAYMENT_LABELS[o.payment_status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-[var(--color-muted)]">Aucune commande ne correspond à cette recherche.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-[var(--color-line)] p-6 sticky top-6">
              <h2 className="font-display text-lg mb-1">{selectedOrder.customer_name}</h2>
              <p className="text-sm text-[var(--color-muted)] mb-4">{selectedOrder.customer_phone}</p>

              <p className="text-sm mb-1"><b>Adresse :</b> {selectedOrder.shipping_address}, {selectedOrder.shipping_city}</p>
              {selectedOrder.customer_note && <p className="text-sm mb-1"><b>Note :</b> {selectedOrder.customer_note}</p>}

              <div className="my-4 border-t border-[var(--color-line)] pt-4">
                <p className="text-xs font-semibold uppercase text-[var(--color-muted)] mb-2">Articles</p>
                <ul className="space-y-1 text-sm">
                  {orderItems.map((it) => (
                    <li key={it.id} className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block">{it.product_name_snapshot} × {it.quantity}</span>
                        <span className="block text-xs text-[var(--color-muted)]">Réf. : {it.product_reference || 'non disponible'}</span>
                      </span>
                      <span>{formatPrice(it.line_total, selectedOrder.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase text-[var(--color-muted)] mb-1">Statut de la commande</label>
                <select value={selectedOrder.status} onChange={(e) => changeStatus(selectedOrder.id, e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--color-muted)] mb-1">Statut du paiement</label>
                <select value={selectedOrder.payment_status} onChange={(e) => changePayment(selectedOrder.id, e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm">
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)] p-6">Sélectionnez une commande pour voir le détail.</p>
          )}
        </div>
        </div>
      </main>
      </div>
    </div>
  );
}
