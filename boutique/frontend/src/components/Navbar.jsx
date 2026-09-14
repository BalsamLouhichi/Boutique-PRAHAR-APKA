import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { getWholesaleAccount, getWholesaleDisplayName } from '../utils/wholesaleAccount.js';

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  // Lu une fois au montage : suffisant car ce composant est remonté à chaque
  // fois qu'on revient sur le site public depuis /gros/catalogue.
  const [wholesaleAccount] = useState(getWholesaleAccount);
  const wholesaleName = getWholesaleDisplayName(wholesaleAccount);

  const linkClass = (path) =>
    `text-sm font-medium transition-colors ${
      location.pathname === path ? 'text-[var(--color-amber-dark)]' : 'text-[var(--color-ink)] hover:text-[var(--color-amber-dark)]'
    }`;

  function goToAbout(event) {
    event.preventDefault();
    if (location.pathname === '/') {
      document.getElementById('a-propos')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/#a-propos');
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur border-b border-[var(--color-line)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-[var(--color-ink)]">PRAHAR ŞAPKA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={linkClass('/')}>Accueil</Link>
          <Link to="/boutique" className={linkClass('/boutique')}>Catalogue</Link>
          <a href="/#a-propos" onClick={goToAbout} className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-amber-dark)]">À propos</a>
        </nav>

        <div className="flex items-center gap-3">
          {wholesaleName ? (
            <Link
              to="/gros/catalogue"
              className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--color-line)] pl-1.5 pr-3 py-1 hover:border-[var(--color-amber)] transition-colors"
              title="Accéder à l'espace grossiste"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)] text-white text-xs font-semibold">
                {wholesaleName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-[var(--color-ink)] max-w-[140px] truncate">{wholesaleName}</span>
            </Link>
          ) : (
            <Link
              to="/gros"
              className="hidden sm:inline-block bg-[var(--color-ink)] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[var(--color-ink-light)] transition-colors"
            >
              Acheter en gros
            </Link>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium hover:border-[var(--color-amber)] transition-colors"
            aria-label="Ouvrir le panier"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293A1 1 0 005 17h12" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>
            </svg>
            Panier
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[var(--color-amber)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
