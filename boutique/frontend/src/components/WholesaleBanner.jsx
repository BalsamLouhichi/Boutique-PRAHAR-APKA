import { Link } from 'react-router-dom';

export default function WholesaleBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-paper)] via-white to-[var(--color-paper)] border border-[var(--color-line)]">
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-[var(--color-amber)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-[var(--color-sage)]/10 blur-3xl" />

        <div className="relative flex flex-col items-center text-center gap-5 px-6 sm:px-10 py-14 sm:py-20">
          <p className="text-[var(--color-amber-dark)] font-semibold uppercase tracking-wide text-sm">
            Vous êtes une boutique ou un revendeur ?
          </p>
          <h2 className="font-display text-3xl sm:text-5xl leading-tight max-w-2xl text-[var(--color-ink)]">
            Découvrez notre offre Vente en Gros
          </h2>
          <p className="text-[var(--color-muted)] max-w-lg">
            Tarifs préférentiels, catalogue exclusif et accompagnement dédié pour les professionnels.
          </p>

          <Link
            to="/gros"
            className="group mt-2 inline-flex items-center gap-2 bg-[var(--color-amber)] hover:bg-[var(--color-amber-dark)] text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-300 text-lg shadow-lg shadow-[var(--color-amber)]/20 hover:shadow-xl hover:-translate-y-0.5"
          >
            Acheter en gros
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
