import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const SEASONS = [
  { value: '', label: 'Toutes' }, { value: 'hiver', label: 'Hiver' }, { value: 'ete', label: 'Été' },
];
const GENDERS = [
  { value: '', label: 'Tous' }, { value: 'homme', label: 'Homme' }, { value: 'femme', label: 'Femme' },
  { value: 'enfant', label: 'Enfant' }, { value: 'unisexe', label: 'Unisexe' },
];

export default function WholesaleFilterSidebar({ filters, onChange, isOpen, onClose }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  function update(field, value) {
    onChange({ ...filters, [field]: value });
    if (isOpen) onClose();
  }

  const content = (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] mb-3">Catégorie</h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => update('category', '')}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!filters.category ? 'bg-[var(--color-ink)] text-white' : 'hover:bg-[var(--color-paper)]'}`}
          >
            Toutes les catégories
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => update('category', c.slug)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.category === c.slug ? 'bg-[var(--color-ink)] text-white' : 'hover:bg-[var(--color-paper)]'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] mb-3">Saison</h3>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button type="button" key={s.value} onClick={() => update('season', s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.season === s.value ? 'bg-[var(--color-amber)] border-[var(--color-amber)] text-white' : 'border-[var(--color-line)] hover:border-[var(--color-amber)]'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] mb-3">Genre</h3>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button type="button" key={g.value} onClick={() => update('gender', g.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.gender === g.value ? 'bg-[var(--color-ink)] border-[var(--color-ink)] text-white' : 'border-[var(--color-line)] hover:border-[var(--color-ink)]'
              }`}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          onChange({ category: '', season: '', gender: '' });
          if (isOpen) onClose();
        }}
        className="text-sm text-[var(--color-amber-dark)] hover:underline"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop : panneau fixe */}
      <aside className="hidden lg:block w-64 flex-shrink-0 pr-6 border-r border-[var(--color-line)]">
        {content}
      </aside>

      {/* Mobile : panneau glissant depuis la gauche */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[60] lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white z-[60] shadow-2xl transition-transform duration-300 overflow-y-auto p-6 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg">Filtrer les articles</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none" aria-label="Fermer les filtres">&times;</button>
        </div>
        {content}
      </aside>
    </>
  );
}
