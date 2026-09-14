import { useEffect, useRef, useState } from 'react';
import { api, resolveImageUrl } from '../../api/client.js';

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductForm({ product, categories, saleType = 'detail', onClose, onSaved }) {
  const [localCategories, setLocalCategories] = useState(categories || []);
  const [form, setForm] = useState({
    reference: product?.reference || '',
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    category_id: product?.category_id || (categories && categories[0]?.id) || '',
    sale_type: product?.sale_type || saleType,
    season: product?.season || 'ete',
    gender: product?.gender || 'unisexe',
    min_order_qty: product?.min_order_qty || 1,
    stock_quantity: product?.stock_quantity ?? 0,
    price: product?.price ?? '',
    promo_price: product?.promo_price ?? '',
    colors: product?.colors?.join(', ') || '',
    sizes: product?.sizes?.join(', ') || '',
    material: product?.material || '',
    is_new: product?.is_new || false,
    is_featured: product?.is_featured || false,
    is_exclusive: product?.is_exclusive || false,
    is_active: product?.is_active ?? true,
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const fileInputRef = useRef(null);
  const [singleSize, setSingleSize] = useState(product?.sizes?.includes('Taille unique') || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  let formTitle = 'Nouvel article en détail';
  if (product) formTitle = 'Modifier l\'article';
  else if (form.sale_type === 'gros') formTitle = 'Nouvel article en gros';

  useEffect(() => {
    setLocalCategories(categories || []);
    if (!product && !form.category_id && (categories || []).length > 0) {
      update('category_id', String(categories[0].id));
    }
  }, [categories]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFilesChange(e) {
    const nextFiles = [...(e.target.files || [])];
    const availableSlots = 6 - existingImages.length - files.length;
    if (nextFiles.length > availableSlots) {
      setError(`Vous pouvez avoir 6 images au maximum. Il reste ${availableSlots} emplacement(s).`);
      e.target.value = '';
      return;
    }
    setError('');
    setFiles((current) => [...current, ...nextFiles]);
    setPreviewUrls((current) => [...current, ...nextFiles.map((file) => URL.createObjectURL(file))]);
    e.target.value = '';
  }

  function removePendingImage(index) {
    URL.revokeObjectURL(previewUrls[index]);
    setFiles((current) => current.filter((_, imageIndex) => imageIndex !== index));
    setPreviewUrls((current) => current.filter((_, imageIndex) => imageIndex !== index));
  }

  async function removeExistingImage(imageId) {
    try {
      await api.deleteProductImage(imageId);
      setExistingImages((current) => current.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(err.message || 'Impossible de supprimer cette image.');
    }
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
        sale_type: form.sale_type,
        is_exclusive: form.sale_type === 'gros' ? form.is_exclusive : false,
        category_id: parseInt(form.category_id),
        min_order_qty: parseInt(form.min_order_qty) || 1,
        stock_quantity: Math.max(parseInt(form.stock_quantity) || 0, 0),
        colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
        sizes: singleSize ? ['Taille unique'] : form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      };

      let saved;
      if (product) {
        saved = await api.updateProduct(product.id, payload);
      } else {
        saved = await api.createProduct(payload);
      }

      if (files.length > 0) {
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-amber-dark)]">{form.sale_type === 'gros' ? 'Catalogue professionnel' : 'Catalogue boutique'}</p>
            <h2 className="font-display text-2xl">{formTitle}</h2>
          </div>
          <span className="rounded-full bg-[var(--color-paper)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]">{form.sale_type === 'gros' ? 'Vente en gros' : 'Vente au détail'}</span>
        </div>

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

        {form.sale_type === 'detail' ? <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prix de vente (TRY) *</label>
            <input required type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prix promo (TRY)</label>
            <input type="number" min={0} step="0.01" value={form.promo_price} onChange={(e) => update('promo_price', e.target.value)} placeholder="Optionnel" className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantité en stock *</label>
            <input required type="number" min={0} step="1" value={form.stock_quantity} onChange={(e) => update('stock_quantity', e.target.value)} className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-[var(--color-muted)]">0 = rupture de stock, l'article s'affiche mais ne peut plus être commandé.</p>
          </div>
        </div> : <div className="mb-4 rounded-xl border border-[var(--color-amber)]/30 bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-muted)]">Les articles en gros sont proposés sur devis. Aucun prix de vente ni stock n’est requis ici.</div>}

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
              <option value="hiver">Hiver</option>
              <option value="ete">Été</option>
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
          <div className="flex items-center justify-between gap-4 mb-2">
            <label className="block text-sm font-medium">Photos de l'article</label>
            <span className="text-xs text-[var(--color-muted)]">{existingImages.length + files.length}/6 images</span>
          </div>
          <div className="rounded-xl border border-dashed border-[var(--color-line)] p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={existingImages.length + files.length >= 6} className="rounded-lg border border-[var(--color-ink)] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">+ Ajouter des images</button>
            <p className="mt-2 text-xs text-[var(--color-muted)]">JPEG, PNG ou WebP — 5 Mo maximum par image.</p>
            {(existingImages.length > 0 || previewUrls.length > 0) && <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {existingImages.map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]">
                  <img src={resolveImageUrl(image.image_url)} alt="Photo enregistrée" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Enregistrée</span>
                  <button type="button" onClick={() => removeExistingImage(image.id)} className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg leading-none shadow hover:bg-red-50 hover:text-red-600" aria-label="Supprimer cette image">×</button>
                </div>
              ))}
              {previewUrls.map((url, index) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--color-amber)] bg-[var(--color-paper)]">
                  <img src={url} alt={`Nouvelle image ${index + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-[var(--color-amber)] px-1.5 py-0.5 text-[10px] text-white">À ajouter</span>
                  <button type="button" onClick={() => removePendingImage(index)} className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg leading-none shadow hover:bg-red-50 hover:text-red-600" aria-label="Retirer cette nouvelle image">×</button>
                </div>
              ))}
            </div>}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_new} onChange={(e) => update('is_new', e.target.checked)} /> Nouveauté</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => update('is_featured', e.target.checked)} /> Mise en avant</label>
          {form.sale_type === 'gros' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_exclusive} onChange={(e) => update('is_exclusive', e.target.checked)} /> Exclusif vente en gros</label>}
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
