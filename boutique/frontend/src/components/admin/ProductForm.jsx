import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductForm({ product, categories, onClose, onSaved }) {
  const [localCategories, setLocalCategories] = useState(categories || []);
  const [form, setForm] = useState({
    reference: product?.reference || '',
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    category_id: product?.category_id || (categories && categories[0]?.id) || '',
    season: product?.season || 'toutes_saisons',
    gender: product?.gender || 'unisexe',
    min_order_qty: product?.min_order_qty || 12,
    colors: product?.colors?.join(', ') || '',
    sizes: product?.sizes?.join(', ') || '',
    material: product?.material || '',
    is_new: product?.is_new || false,
    is_featured: product?.is_featured || false,
    is_active: product?.is_active ?? true,
  });
  const [files, setFiles] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [singleSize, setSingleSize] = useState(product?.sizes?.includes('Taille unique') || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalCategories(categories || []);
    if (!product && !form.category_id && (categories || []).length > 0) {
      update('category_id', String(categories[0].id));
    }
  }, [categories]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFilesChange(e) {
    const nextFiles = [...(e.target.files || [])];
    setFiles(nextFiles);

    const nextPreviews = nextFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextPreviews);
  }

  function handleSingleSizeToggle(checked) {
    setSingleSize(checked);
    update('sizes', checked ? 'Taille unique' : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        category_id: parseInt(form.category_id),
        min_order_qty: parseInt(form.min_order_qty) || 1,
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        sizes: singleSize ? ['Taille unique'] : form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      };

      let saved;
      if (product) {
        saved = await api.updateProduct(product.id, payload);
      } else {
        saved = await api.createProduct(payload);
      }

      if (files && files.length > 0) {
        await api.uploadProductImages(saved.id, files);
      }

      onSaved();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-10">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-2xl p-8 mx-4">
        <h2 className="font-display text-2xl mb-6">{product ? 'Modifier l\'article' : 'Nouvel article'}</h2>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de l'article *</label>
            <input
              required
              value={form.name}
              onChange={(e) => {
                update('name', e.target.value);
                if (!product) update('slug', slugify(e.target.value));
              }}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Référence (SKU)</label>
            <input value={form.reference} onChange={(e) => update('reference', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie *</label>
            <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm">
              {localCategories.length === 0 ? <option value="">Aucune catégorie</option> : localCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Saison</label>
            <select value={form.season} onChange={(e) => update('season', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm">
              <option value="toutes_saisons">Toutes saisons</option>
              <option value="hiver">Hiver</option>
              <option value="ete">Été</option>
              <option value="printemps">Printemps</option>
              <option value="automne">Automne</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Genre</label>
            <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm">
              <option value="unisexe">Unisexe</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="enfant">Enfant</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Couleurs (séparées par virgule)</label>
            <input value={form.colors} onChange={(e) => update('colors', e.target.value)} placeholder="Noir, Gris, Bleu" className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tailles (séparées par virgule)</label>
            <input
              value={form.sizes}
              onChange={(e) => update('sizes', e.target.value)}
              placeholder="S, M, L, XL"
              disabled={singleSize}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm disabled:bg-[var(--color-paper)] disabled:text-[var(--color-muted)]"
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input
                type="checkbox"
                checked={singleSize}
                onChange={(e) => handleSingleSizeToggle(e.target.checked)}
              />
              Taille unique
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Qté minimum de commande</label>
            <input type="number" min={1} value={form.min_order_qty} onChange={(e) => update('min_order_qty', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Matière</label>
          <input value={form.material} onChange={(e) => update('material', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Photos (jpeg/png/webp, 5 Mo max chacune)</label>
          <div className="flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesChange}
              className="w-full max-w-xl text-sm"
            />

            {previewUrls.length > 0 && (
              <div className="mt-4 w-full max-w-xl">
                <div className="grid grid-cols-3 gap-3 place-items-center">
                  {previewUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="w-full aspect-square rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] overflow-hidden shadow-sm">
                      <img src={url} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_new} onChange={(e) => update('is_new', e.target.checked)} /> Nouveauté</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} /> Mise en avant</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} /> Visible sur le site</label>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--color-muted)]">Annuler</button>
          <button type="submit" disabled={saving} className="bg-[var(--color-ink)] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
