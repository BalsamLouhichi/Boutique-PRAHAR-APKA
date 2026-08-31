import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  is_active: true,
};

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const data = await api.getAdminCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Impossible de charger les catégories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingCategory(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      is_active: category.is_active,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        is_active: Boolean(form.is_active),
      };

      if (!payload.name) {
        throw new Error('Le nom de la catégorie est requis.');
      }

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload);
      } else {
        await api.createCategory(payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category) {
    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) return;

    try {
      await api.deleteCategory(category.id);
      await loadData();
    } catch (err) {
      const message = err.message || 'Impossible de supprimer cette catégorie.';
      const detail = message.toLowerCase().includes('foreign') || message.toLowerCase().includes('constraint') || message.toLowerCase().includes('utilisée') || message.toLowerCase().includes('delete')
        ? 'Cette catégorie est utilisée par des produits et ne peut pas être supprimée.'
        : message;
      setError(detail);
    }
  }

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex">
      <aside className="w-72 bg-[var(--color-ink)] text-white p-6 flex-shrink-0">
        <div className="mb-8">
          <h1 className="font-display text-3xl">PRAHAR ŞAPKA</h1>
          <p className="mt-2 text-sm text-white/70">Admin panel</p>
        </div>

        <nav className="space-y-2">
          <Link to="/admin" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/articles" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">
            <span>Gestion des articles</span>
          </Link>
          <Link to="/admin/categories" className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-white/10 text-white font-medium hover:bg-white/15 transition-colors">
            <span>Catégories</span>
          </Link>
          <Link to="/admin/orders" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">
            <span>Commandes</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="w-full text-left rounded-xl px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors"
          >
            + Nouvelle catégorie
          </button>
        </nav>

        <div className="mt-10 pt-6 border-t border-white/10">
          <button onClick={handleLogout} className="text-sm text-white/80 hover:text-white transition-colors">Déconnexion</button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="bg-white border-b border-[var(--color-line)] px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl text-[var(--color-ink)]">Catégories</h1>
              <p className="text-sm text-[var(--color-muted)]">Gestion des catégories produits</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openCreateModal}
                className="bg-[var(--color-amber)] hover:bg-[var(--color-amber-dark)] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
              >
                + Nouvelle catégorie
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--color-line)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-paper)] text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nom</th>
                    <th className="px-4 py-3 font-semibold">Désignation</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t border-[var(--color-line)]">
                      <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{category.name}</td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">{category.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {category.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => openEditModal(category)} className="text-[var(--color-amber-dark)] hover:underline">Modifier</button>
                          <button onClick={() => handleDelete(category)} className="text-red-500 hover:underline">Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-[var(--color-muted)]">Aucune catégorie pour le moment.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-10">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-xl p-8 mx-4">
            <h2 className="font-display text-2xl mb-6">{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                  }}
                  className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Désignation</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Catégorie active
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-[var(--color-muted)]">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="bg-[var(--color-ink)] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                {submitting ? 'Enregistrement...' : editingCategory ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
