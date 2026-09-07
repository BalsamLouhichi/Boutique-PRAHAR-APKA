import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <label className={`flex items-center gap-2 text-xs font-medium text-[var(--color-muted)] ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      {label && <span>{label}</span>}
      <span className="relative inline-flex flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className={`h-5 w-9 rounded-full transition-colors duration-200 ${checked ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-line)]'} ${!disabled ? 'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-[var(--color-amber)]' : ''}`} />
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </label>
  );
}

export default function AdminWholesaleAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  function loadAccounts() {
    setLoading(true);
    api.getWholesaleAccounts().then(setAccounts).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(loadAccounts, []);

  async function updateExclusiveAccess(account, canViewExclusive) {
    setUpdatingId(account.id);
    try {
      await api.updateWholesaleExclusiveAccess(account.id, canViewExclusive);
      setAccounts((current) => current.map((item) => (
        item.id === account.id ? { ...item, can_view_exclusive: canViewExclusive } : item
      )));
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateAccountStatus(account, isActive) {
    setUpdatingId(account.id);
    try {
      await api.updateWholesaleAccountActive(account.id, isActive);
      setAccounts((current) => current.map((item) => (
        item.id === account.id ? { ...item, is_active: isActive } : item
      )));
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex">
      <aside className="w-72 bg-[var(--color-ink)] text-white p-6 flex-shrink-0">
        <div className="mb-8"><h1 className="font-display text-3xl">PRAHAR ŞAPKA</h1><p className="mt-2 text-sm text-white/70">Admin panel</p></div>
        <nav className="space-y-2">
          <Link to="/admin" className="flex rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10">Dashboard</Link>
          <Link to="/admin/articles" className="flex rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10">Gestion des articles</Link>
          <Link to="/admin/categories" className="flex rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10">Catégories</Link>
          <Link to="/admin/orders" className="flex rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10">Commandes</Link>
          <Link to="/admin/comptes-gros" className="flex rounded-xl bg-white/10 px-3 py-2.5 font-medium text-white">Comptes grossistes</Link>
          <Link to="/admin/articles" className="block rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10">+ Nouvel article</Link>
        </nav>
        <div className="mt-10 border-t border-white/10 pt-6"><button onClick={handleLogout} className="text-sm text-white/80 hover:text-white">Déconnexion</button></div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[var(--color-line)] px-6 py-4"><h1 className="font-display text-xl">Comptes grossistes</h1></header>
        <main className="max-w-5xl mx-auto px-6 py-8">
          {loading ? <p className="text-sm text-[var(--color-muted)]">Chargement...</p> : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <article key={account.id} className="bg-white rounded-2xl border border-[var(--color-line)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <h2 className="font-display text-lg">{account.company_name}</h2>
                      <p className="text-sm text-[var(--color-muted)]">{account.contact_name} · {account.email} · {account.phone}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">Compte créé le {new Date(account.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-5">
                      <ToggleSwitch
                        checked={account.is_active}
                        disabled={updatingId === account.id}
                        label="Compte actif"
                        onChange={(isActive) => updateAccountStatus(account, isActive)}
                      />
                      <ToggleSwitch
                        checked={account.can_view_exclusive}
                        disabled={updatingId === account.id || !account.is_active}
                        label="Exclusifs"
                        onChange={(canViewExclusive) => updateExclusiveAccess(account, canViewExclusive)}
                      />
                    </div>
                  </div>
                </article>
              ))}
              {accounts.length === 0 && <p className="py-16 text-center text-[var(--color-muted)]">Aucun compte grossiste pour le moment.</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
