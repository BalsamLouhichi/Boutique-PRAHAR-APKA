import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveImageUrl } from '../api/client.js';

// Photo de chaque tuile : dépose un fichier src/assets/seasons/<saison>.jpg
// (ou .png/.webp) — ex: src/assets/seasons/ete.jpg — et il remplace
// automatiquement la photo produit ci-dessous, sans rien coder de plus.
const seasonImages = import.meta.glob('../assets/seasons/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function customImageFor(season) {
  const entry = Object.entries(seasonImages).find(([path]) => path.includes(`/${season}.`));
  return entry ? entry[1] : null;
}

const SEASONS = [
  { value: 'ete', label: 'Été' },
  { value: 'hiver', label: 'Hiver' },
];

export default function SeasonShowcase() {
  const [coverBySeason, setCoverBySeason] = useState(null);

  useEffect(() => {
    api.getProducts({ limit: 50 })
      .then((r) => {
        const covers = {};
        r.data.forEach((p) => {
          if (p.primary_image && !covers[p.season]) covers[p.season] = resolveImageUrl(p.primary_image);
        });
        setCoverBySeason(covers);
      })
      .catch(() => setCoverBySeason({}));
  }, []);

  if (!coverBySeason) return null;

  const tiles = SEASONS
    .map((s) => ({ ...s, image: customImageFor(s.value) || coverBySeason[s.value] }))
    .filter((s) => s.image);

  if (tiles.length < 2) return null; // pas assez de photos pour les deux saisons

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-1">Rayons</p>
        <h2 className="font-display text-3xl">Achetez par saison</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tiles.map((s) => (
          <Link
            key={s.value}
            to={`/boutique?season=${s.value}`}
            className="group relative overflow-hidden rounded-2xl bg-[var(--color-paper)] aspect-[4/3] sm:aspect-[16/9]"
          >
            <img
              src={s.image}
              alt={s.label}
              className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />
            <span className="absolute bottom-4 left-4 bg-[var(--color-amber)] text-white text-sm font-semibold px-4 py-2 rounded-full shadow">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
