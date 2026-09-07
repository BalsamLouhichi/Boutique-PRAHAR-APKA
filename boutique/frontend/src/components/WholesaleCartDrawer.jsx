import { useState, useEffect } from 'react';
import { useWholesaleCart } from '../context/WholesaleCartContext.jsx';
import { api, resolveImageUrl } from '../api/client.js';
import { buildWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp.js';

export default function WholesaleCartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, totalItems } = useWholesaleCart();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => setWhatsappNumber(s.whatsapp_number)).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  async function handleQuoteRequest() {
    if (items.length === 0) return;
    setSending(true);
    try {
      await api.wholesaleQuote({
        client_note: note || null,
        items: items.map((it) => ({
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: it.quantity,
          color: it.color,
          size: it.size,
        })),
      });
    } catch {
      // Même en cas d'échec de journalisation, on redirige quand même vers WhatsApp
    } finally {
      const message = buildWhatsAppMessage(items);
      const url = buildWhatsAppUrl(whatsappNumber, message);
      window.open(url, '_blank', 'noopener,noreferrer');
      clearCart();
      setSending(false);
    }
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setIsOpen(false)} aria-hidden="true" />}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Panier gros"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-line)]">
          <h2 className="font-display text-xl">Votre sélection ({totalItems})</h2>
          <button onClick={() => setIsOpen(false)} aria-label="Fermer" className="text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <p className="text-[var(--color-muted)] text-sm mt-8 text-center">
              Aucun article sélectionné. Parcourez le catalogue en gros pour demander un devis.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.key} className="flex gap-3 border-b border-[var(--color-line)] pb-4">
                  <div className="w-16 h-16 rounded-lg bg-[var(--color-paper)] flex-shrink-0 overflow-hidden">
                    {it.image && <img src={resolveImageUrl(it.image)} alt={it.product_name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.product_name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{[it.color, it.size].filter(Boolean).join(' · ')}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-xs text-[var(--color-muted)]">Qté</label>
                      <input
                        type="number"
                        min={it.min_order_qty}
                        value={it.quantity}
                        onChange={(e) => updateQuantity(it.key, parseInt(e.target.value) || it.min_order_qty)}
                        className="w-20 border border-[var(--color-line)] rounded px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-[var(--color-muted)]">(min. {it.min_order_qty})</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(it.key)} className="text-xs text-red-500 hover:underline self-start">
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--color-line)] px-6 py-5 space-y-3">
            <textarea
              rows={2}
              placeholder="Note additionnelle (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleQuoteRequest}
              disabled={sending}
              className="w-full bg-[#25D366] hover:bg-[#1fbd5a] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
              Demander un devis via WhatsApp
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
