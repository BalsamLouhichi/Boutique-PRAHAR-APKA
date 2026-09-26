const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/share/1GhNDT5Aeu/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z"/></svg>
    ),
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/prahar.sapka?stkn=MXhob3hycnljeW1rdg==',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>
    ),
  },
  {
    name: 'Youtube',
    url: 'https://www.youtube.com/@praharsapka?si=I03b_egkcckp8I-I',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.2v5.6l5-2.8Z" fill="currentColor" stroke="none" /></svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] text-white mt-24">
      <div className="rib-divider" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-xl mb-3">PRAHAR ŞAPKA</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Leader de la vente en gros de casquettes, bonnets et cache-cols pour professionnels et revendeurs.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">Suivez-nous</h4>
          <ul className="space-y-2.5 text-sm text-white/80">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 hover:text-[var(--color-amber)] transition-colors"
                >
                  {social.icon}
                  {social.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">Navigation</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><a href="/" className="hover:text-[var(--color-amber)]">Accueil</a></li>
            <li><a href="/boutique" className="hover:text-[var(--color-amber)]">Catalogue</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">Contact</h4>
          <div className="space-y-1.5 text-sm text-white/80">
            <a href="https://praharsapka.com" target="_blank" rel="noreferrer" className="block hover:text-[var(--color-amber)]">praharsapka.com</a>
            <p>Ağa mah semaver sok. No 11. Fatih Istanbul</p>
            <p>Taya Hatun Mah. Tarakçılar Cd. No: 11 D Fatih Istanbul</p>
            <p>Muhasebe : <a href="tel:+902125196758" className="hover:text-[var(--color-amber)]">0212 519 67 58</a></p>
            <p><a href="mailto:ender.ert@hotmail.com" className="hover:text-[var(--color-amber)]">ender.ert@hotmail.com</a></p>
            <p>WhatsApp : <a href="tel:+905527832323" className="hover:text-[var(--color-amber)]">0552 783 23 23</a></p>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-white/40 pb-6">
        © {new Date().getFullYear()} PRAHAR ŞAPKA — Tous droits réservés.
      </div>
    </footer>
  );
}
