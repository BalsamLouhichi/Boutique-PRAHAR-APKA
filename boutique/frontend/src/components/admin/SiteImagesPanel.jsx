import { useRef, useState } from 'react';
import { api, siteImageUrl } from '../../api/client.js';

// Bannières des tuiles "Achetez par profil" (page d'accueil). Une clé fixe
// par genre ; sans image envoyée ici, le front retombe automatiquement sur
// une photo produit.
const SLOTS = [
  { key: 'femme', label: 'Femme' },
  { key: 'homme', label: 'Homme' },
  { key: 'enfant', label: 'Enfant' },
  { key: 'unisexe', label: 'Unisexe' },
];

function SiteImageSlot({ slotKey, label }) {
  const [version, setVersion] = useState(0);
  const [broken, setBroken] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await api.uploadSiteImage(slotKey, file);
      setBroken(false);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err.message || 'Échec de l\'envoi.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Retirer la bannière "${label}" ? L'article reviendra à la photo automatique.`)) return;
    try {
      await api.deleteSiteImage(slotKey);
      setBroken(true);
    } catch (err) {
      setError(err.message || 'Échec de la suppression.');
    }
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="relative aspect-[3/4] rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] overflow-hidden">
        {!broken && (
          <img
            src={siteImageUrl(slotKey, version)}
            onError={() => setBroken(true)}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {broken && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-3 text-xs text-[var(--color-muted)]">
            Aucune bannière — photo produit utilisée automatiquement
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex-1 rounded-lg border border-[var(--color-ink)] px-2 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {uploading ? 'Envoi...' : broken ? 'Choisir une image' : 'Remplacer'}
        </button>
        {!broken && (
          <button type="button" onClick={handleRemove} className="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">
            Retirer
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function SiteImagesPanel() {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-line)] p-6">
      <div className="mb-5">
        <h3 className="font-display text-xl text-[var(--color-ink)]">Bannières "Achetez par profil"</h3>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Photo affichée sur chaque tuile de l'accueil. JPEG, PNG ou WebP — 5 Mo maximum.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SLOTS.map((slot) => <SiteImageSlot key={slot.key} slotKey={slot.key} label={slot.label} />)}
      </div>
    </div>
  );
}
