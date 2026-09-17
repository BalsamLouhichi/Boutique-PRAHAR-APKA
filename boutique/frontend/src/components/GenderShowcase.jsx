import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveImageUrl } from '../api/client.js';

// Photo de chaque tuile : dépose un fichier src/assets/genders/<genre>.jpg
// (ou .png/.webp) — ex: src/assets/genders/femme.jpg — et il remplace
// automatiquement la photo produit ci-dessous, sans rien coder de plus.
const genderImages = import.meta.glob('../assets/genders/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function customImageFor(gender) {
  const entry = Object.entries(genderImages).find(([path]) => path.includes(`/${gender}.`));
  return entry ? entry[1] : null;
}

// Sur desktop (lg+) : grille 3 colonnes, Femme et Homme prennent toute la
// hauteur, Enfant et Unisexe sont empilés au milieu.
const GENDERS = [
  { value: 'femme', label: 'Femme', desktopClass: 'lg:col-start-1 lg:row-start-1 lg:row-span-2' },
  { value: 'enfant', label: 'Enfant', desktopClass: 'lg:col-start-2 lg:row-start-1' },
  { value: 'unisexe', label: 'Unisexe', desktopClass: 'lg:col-start-2 lg:row-start-2' },
  { value: 'homme', label: 'Homme', desktopClass: 'lg:col-start-3 lg:row-start-1 lg:row-span-2' },
];

export default function GenderShowcase() {
  const [coverByGender, setCoverByGender] = useState(null);

  useEffect(() => {
    api.getProducts({ limit: 50 })
      .then((r) => {
        const covers = {};
        r.data.forEach((p) => {
          if (p.primary_image && !covers[p.gender]) covers[p.gender] = resolveImageUrl(p.primary_image);
        });
        setCoverByGender(covers);
      })
      .catch(() => setCoverByGender({}));
  }, []);

  if (!coverByGender) return null;

  const tiles = GENDERS
    .map((g) => ({ ...g, image: customImageFor(g.value) || coverByGender[g.value] }))
    .filter((g) => g.image);

  if (tiles.length < 3) return null; // pas assez de photos pour un rayon présentable

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-1">Rayons</p>
        <h2 className="font-display text-3xl">Achetez par profil</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:h-[520px]">
        {tiles.map((g) => (
          <Link
            key={g.value}
            to={`/boutique?gender=${g.value}`}
            className={`group relative overflow-hidden rounded-2xl bg-[var(--color-paper)] aspect-[3/4] lg:aspect-auto ${g.desktopClass}`}
          >
            <img
              src={g.image}
              alt={g.label}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />
            <span className="absolute bottom-4 left-4 bg-[var(--color-amber)] text-white text-sm font-semibold px-4 py-2 rounded-full shadow">
              {g.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
