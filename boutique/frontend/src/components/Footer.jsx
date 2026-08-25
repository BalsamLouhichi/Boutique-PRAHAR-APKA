export default function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] text-white mt-24">
      <div className="rib-divider" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="font-display text-xl mb-3">PRAHAR ŞAPKA</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Leader de la vente en gros de casquettes, bonnets et cache-cols pour professionnels et revendeurs.
          </p>
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
            <p>Taya Hatun Mah. Tarakçılar Cd. No: 8 D Fatih - Mercan / İST.</p>
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
