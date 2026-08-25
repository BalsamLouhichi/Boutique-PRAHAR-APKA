import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';

export default function WhatsAppFloatingButton() {
  const [number, setNumber] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => setNumber(s.whatsapp_number)).catch(() => {});
  }, []);

  if (!number) return null;

  return (
    <a
      href={buildWhatsAppUrl(number, 'Bonjour, je souhaite avoir des renseignements sur vos articles en gros.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-30 bg-[#25D366] hover:bg-[#1fbd5a] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      aria-label="Contacter sur WhatsApp"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
    </a>
  );
}
