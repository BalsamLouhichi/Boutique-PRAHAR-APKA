import { Link } from 'react-router-dom';

export default function WholesaleBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden rounded-2xl bg-[var(--color-paper)] border border-[var(--color-line)]">
        <div className="grid md:grid-cols-2 items-center gap-6 px-8 py-12 md:py-16">
          <div className="text-center md:text-left">
            <p className="text-[var(--color-amber-dark)] font-medium mb-2">Vous êtes une boutique ou un revendeur ?</p>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)] mb-6 leading-tight">
              Découvrez notre offre<br className="hidden md:block" /> Vente en Gros
            </h2>
            <Link
              to="/gros"
              className="inline-block bg-[var(--color-amber)] hover:bg-[var(--color-amber-dark)] text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-lg"
            >
              Acheter en gros
            </Link>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="w-64 h-64 rounded-full bg-white border border-[var(--color-line)] flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber-dark)" strokeWidth="1.5">
                <path d="M20 7h-9M14 17H5M17 4a3 3 0 100 6 3 3 0 000-6zM7 14a3 3 0 100 6 3 3 0 000-6z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
