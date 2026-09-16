import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';

const FACEBOOK_URL = 'https://www.facebook.com/share/1GhNDT5Aeu/';
const INSTAGRAM_URL = 'https://www.instagram.com/prahar.sapka?stkn=MXhob3hycnljeW1rdg==';
const CONTACT_EMAIL = 'ender.ert@hotmail.com';
const CONTACT_PHONE_LABEL = '0212 519 67 58';

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8.5 8.7c.3-.6.6-.6.9-.6h.6c.2 0 .4 0 .6.5s.7 1.7.7 1.9c0 .1 0 .3-.1.4-.2.3-.3.4-.5.6-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1s1.5.7 1.8.8c.3.1.4.2.5.3 0 .2 0 .9-.3 1.5-.3.6-1.5 1.2-2 1.3-.6.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.7-1.2-4.5-3.9-4.6-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" /></svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1v3l3.5-3H14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <path d="M18 9h.01A3 3 0 0 1 21 12v3a2 2 0 0 1-2 2h-.5v2l-2.5-2" />
    </svg>
  );
}

export default function ContactSection() {
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => setWhatsappNumber(s.whatsapp_number)).catch(() => {});
  }, []);

  const channels = [
    {
      icon: <WhatsAppIcon />,
      title: 'Contactez-nous sur WhatsApp.',
      description: "Notre équipe répond rapidement à vos questions sur notre ligne d'assistance WhatsApp.",
      href: whatsappNumber ? buildWhatsAppUrl(whatsappNumber, 'Bonjour, je souhaite avoir des renseignements sur vos articles.') : null,
    },
    {
      icon: <InstagramIcon />,
      title: 'Contactez-nous sur Instagram.',
      description: 'Suivez notre actualité et écrivez à notre service client via Instagram.',
      href: INSTAGRAM_URL,
    },
    {
      icon: <FacebookIcon />,
      title: 'Contactez-nous sur Facebook.',
      description: 'Retrouvez-nous et envoyez-nous un message directement sur notre page Facebook.',
      href: FACEBOOK_URL,
    },
    {
      icon: <ChatIcon />,
      title: 'Utilisez le téléphone ou le courriel.',
      description: `Joignez-nous au ${CONTACT_PHONE_LABEL} ou par email à ${CONTACT_EMAIL}.`,
      href: `mailto:${CONTACT_EMAIL}`,
    },
  ];

  return (
    <section className="bg-[var(--color-paper)] py-20 border-t border-[var(--color-line)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--color-ink)] text-[var(--color-ink)]">
          <ChatIcon />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)] mb-3">Entrer en contact.</h2>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Faites la connaissance de notre équipe de professionnels
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-center">
        {channels.map((c) => {
          const external = c.href?.startsWith('http');
          return (
            <a
              key={c.title}
              href={c.href || undefined}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className={`group flex flex-col items-center ${c.href ? '' : 'pointer-events-none opacity-60'}`}
            >
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--color-ink)] text-[var(--color-ink)] group-hover:bg-[var(--color-ink)] group-hover:text-white transition-colors">
                {c.icon}
              </span>
              <h3 className="font-display text-lg text-[var(--color-ink)] mb-2">{c.title}</h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">{c.description}</p>
              <span className="mt-3 text-[var(--color-amber-dark)] group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
