import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, resolveImageUrl, siteImageUrl } from '../api/client.js';

// Une tuile par genre. Photo choisie depuis l'admin en priorité
// (site_images), sinon la première photo produit trouvée dans ce rayon.
// Sur desktop (lg+) : grille 3 colonnes, Femme et Homme prennent toute la
// hauteur, Enfant et Unisexe sont empilés au milieu.
const GENDERS = [
  { value: 'femme', label: 'Femme', desktopClass: 'lg:col-start-1 lg:row-start-1 lg:row-span-2' },
  { value: 'enfant', label: 'Enfant', desktopClass: 'lg:col-start-2 lg:row-start-1' },
  { value: 'unisexe', label: 'Unisexe', desktopClass: 'lg:col-start-2 lg:row-start-2' },
  { value: 'homme', label: 'Homme', desktopClass: 'lg:col-start-3 lg:row-start-1 lg:row-span-2' },
];

function GenderTile({ gender, label, desktopClass, fallbackSrc }) {
  const [src, setSrc] = useState(() => siteImageUrl(gender));
  const [triedFallback, setTriedFallback] = useState(false);
  const [broken, setBroken] = useState(false);

  function handleError() {
    if (!triedFallback && fallbackSrc) {
      setTriedFallback(true);
      setSrc(fallbackSrc);
    } else {
      setBroken(true);
    }
  }

  if (broken) return null;

  return (
    <Link
      to={`/boutique?gender=${gender}`}
      className={`group relative overflow-hidden rounded-2xl bg-[var(--color-paper)] aspect-[3/4] lg:aspect-auto ${desktopClass}`}
    >
      <img
        src={src}
        onError={handleError}
        alt={label}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />
      <span className="absolute bottom-4 left-4 bg-[var(--color-amber)] text-white text-sm font-semibold px-4 py-2 rounded-full shadow">
        {label}
      </span>
    </Link>
  );
}

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

  // On attend d'avoir les photos produit (repli) avant d'afficher les tuiles,
  // pour éviter un aller-retour visible (bannière -> repli) au chargement.
  if (!coverByGender) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-1">Rayons</p>
        <h2 className="font-display text-3xl">Achetez par profil</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:h-[520px]">
        {GENDERS.map((g) => (
          <GenderTile key={g.value} gender={g.value} label={g.label} desktopClass={g.desktopClass} fallbackSrc={coverByGender[g.value]} />
        ))}
      </div>
    </section>
  );
}
