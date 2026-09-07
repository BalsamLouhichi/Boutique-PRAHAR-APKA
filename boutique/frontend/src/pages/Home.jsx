import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import WholesaleBanner from '../components/WholesaleBanner.jsx';

const galleryImages = Object.values(import.meta.glob('../assets/gallery/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}));

export default function Home() {
  const [newProducts, setNewProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [settings, setSettings] = useState({});
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.getProducts({ is_new: 'true', limit: 4 }).then((r) => setNewProducts(r.data)).catch(() => {});
    api.getProducts({ limit: 8 }).then((r) => setFeatured(r.data.filter((p) => p))).catch(() => {});
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const heroImages = galleryImages;

  useEffect(() => {
    if (heroImages.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setHeroImageIndex((current) => (current + 1) % heroImages.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImageIndex >= heroImages.length && heroImages.length > 0) setHeroImageIndex(0);
  }, [heroImageIndex, heroImages.length]);

  function scrollCarousel(direction) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  return (
    <div>
      {/* HERO */}
      <section className="bg-[var(--color-ink)] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-[var(--color-amber)] text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                                                 
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight mb-6">
              PRAHAR ŞAPKA
            </h1>
            <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-xl">
              {settings.brand_description ||
                "Türkiye genelindeki geniş dağıtım ağımızla, sektörün en güçlü ekosistemlerinden birini kurduk. Bugün, ulusal çaptaki iş ortaklarımızın %80’i, mağazalarında bizim ürünlerimizi ana koleksiyon olarak konumlandırmakta ve markamızın resmi temsilcisi olarak hareket etmektedir."}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/boutique"
                className="bg-[var(--color-amber)] hover:bg-[var(--color-amber-dark)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Voir le catalogue
              </Link>
              <a
                href="#a-propos"
                className="border border-white/30 hover:border-white text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Découvrir la marque
              </a>
            </div>
          </div>
          <div className="relative lg:block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-2xl">
              {heroImages.length > 0 ? (
                heroImages.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Présentation de la boutique ${index + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === heroImageIndex ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/70">Galerie bientôt disponible</div>
              )}
              {heroImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setHeroImageIndex((heroImageIndex - 1 + heroImages.length) % heroImages.length)}
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-xl text-white backdrop-blur-sm hover:bg-black/50"
                    aria-label="Image précédente"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroImageIndex((heroImageIndex + 1) % heroImages.length)}
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-xl text-white backdrop-blur-sm hover:bg-black/50"
                    aria-label="Image suivante"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {heroImages.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setHeroImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${index === heroImageIndex ? 'w-7 bg-white' : 'w-2 bg-white/50'}`}
                        aria-label={`Afficher l'image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="rib-divider" />
      </section>

      <WholesaleBanner />

      {/* CHIFFRES / RÉASSURANCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid sm:grid-cols-3 gap-6">
        {[
          { label: 'Pazar lideri', value: '#1' },
          { label: "Katalogdaki ürünler", value: '150+' },
          { label: 'İş ortağı mağaza', value: '300+' },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-6 rounded-2xl bg-white border border-[var(--color-line)]">
            <p className="font-display text-4xl text-[var(--color-amber-dark)] mb-1">{stat.value}</p>
            <p className="text-sm text-[var(--color-muted)]">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* NOUVEAUTÉS - carrousel qui glisse */}
      {newProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-1">Tendance</p>
              <h2 className="font-display text-3xl">Les articles les plus modernes</h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scrollCarousel(-1)}
                className="w-10 h-10 rounded-full border border-[var(--color-line)] flex items-center justify-center hover:border-[var(--color-amber)]"
                aria-label="Précédent"
              >
                ←
              </button>
              <button
                onClick={() => scrollCarousel(1)}
                className="w-10 h-10 rounded-full border border-[var(--color-line)] flex items-center justify-center hover:border-[var(--color-amber)]"
                aria-label="Suivant"
              >
                →
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'thin' }}
          >
            {newProducts.map((p) => (
              <div key={p.id} className="w-[280px] min-w-[280px] snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* À PROPOS */}
      <section id="a-propos" className="bg-white border-y border-[var(--color-line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-2">Hakkımızda</p>
            <h2 className="font-display text-3xl mb-4">Küresel Tedarik, Yerel Güç</h2>
            <p className="text-[var(--color-muted)] leading-relaxed mb-4">
              Çin’den dünyaya uzanan aksesuar köprümüzle kaliteli ürünleri uygun fiyatlarla sunuyoruz.
            </p>
            <h3 className="font-display text-xl mb-2">Global Vizyonumuz</h3>
            <p className="text-[var(--color-muted)] leading-relaxed">
              Türkiye’deki deneyimimizi dünyadaki iş ortaklarımızla paylaşıyoruz.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Geniş Ürün Yelpazesi', 'Şapka, bere, şal ve çanta.'],
              ['Çin Ofisi', 'Kaynağında üretim kontrolü.'],
              ['Toptan Dağıtım', 'Dünyaya hızlı sevkiyat.'],
              ['Kalite ve Fiyat', 'Kontrollü kalite, uygun maliyet.'],
            ].map(([title, description]) => (
              <div key={title} className="p-5 rounded-2xl bg-[var(--color-paper)] border border-[var(--color-line)]">
                <p className="font-medium text-sm mb-1">{title}</p>
                <p className="text-xs text-[var(--color-muted)]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUITS EN AVANT */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display text-3xl mb-6">Notre sélection</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="text-center mt-10">
            <Link to="/boutique" className="inline-block border border-[var(--color-ink)] text-[var(--color-ink)] font-semibold px-6 py-3 rounded-lg hover:bg-[var(--color-ink)] hover:text-white transition-colors">
              Voir tout le catalogue
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
