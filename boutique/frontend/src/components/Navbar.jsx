import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { getWholesaleAccount, getWholesaleDisplayName } from '../utils/wholesaleAccount.js';
import { navIconBtnClass as iconBtnClass, SearchIcon, UserIcon, CartIcon } from './NavIcons.jsx';

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [wholesaleAccount, setWholesaleAccount] = useState(getWholesaleAccount);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const wholesaleName = getWholesaleDisplayName(wholesaleAccount);

  const linkClass = (path) =>
    `text-sm font-medium transition-colors ${
      location.pathname === path ? 'text-[var(--color-amber)]' : 'text-white/85 hover:text-white'
    }`;

  function goToAbout(event) {
    event.preventDefault();
    setAccountMenuOpen(false);
    if (location.pathname === '/') {
      document.getElementById('a-propos')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/#a-propos');
  }

  function handleWholesaleLogout() {
    localStorage.removeItem('wholesale_token');
    localStorage.removeItem('wholesale_account');
    setWholesaleAccount(null);
    setAccountMenuOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-ink)]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-2xl font-semibold text-white">PRAHAR ŞAPKA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link to="/" className={linkClass('/')}>Accueil</Link>
          <Link to="/boutique" className={linkClass('/boutique')}>Catalogue</Link>
          <a href="/#a-propos" onClick={goToAbout} className="text-sm font-medium text-white/85 hover:text-white transition-colors">À propos</a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/boutique" className={iconBtnClass} aria-label="Rechercher un article" title="Rechercher">
            <SearchIcon />
          </Link>

          <div className="relative">
            <button
              onClick={() => setAccountMenuOpen((open) => !open)}
              className={iconBtnClass}
              aria-label="Mon compte"
              aria-expanded={accountMenuOpen}
              title="Mon compte"
            >
              {wholesaleName ? (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-amber)] text-[var(--color-ink)] text-xs font-bold">
                  {wholesaleName.charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserIcon />
              )}
            </button>

            {accountMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-[var(--color-line)] bg-white shadow-xl z-50 py-2 overflow-hidden">
                  {wholesaleName ? (
                    <>
                      <div className="px-4 py-3 border-b border-[var(--color-line)]">
                        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] font-semibold">Espace grossiste</p>
                        <p className="text-sm font-medium text-[var(--color-ink)] truncate mt-0.5">{wholesaleName}</p>
                      </div>
                      <Link
                        to="/gros/catalogue"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors"
                      >
                        Catalogue en gros
                      </Link>
                      <button
                        onClick={handleWholesaleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-[var(--color-paper)] transition-colors"
                      >
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-[var(--color-line)]">
                        <p className="text-sm font-medium text-[var(--color-ink)]">Espace professionnel</p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">Réservé aux boutiques et revendeurs</p>
                      </div>
                      <Link
                        to="/gros"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors"
                      >
                        Acheter en gros
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(true)} className={`relative ${iconBtnClass}`} aria-label="Ouvrir le panier" title="Panier">
            <CartIcon />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--color-amber)] text-[var(--color-ink)] text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
