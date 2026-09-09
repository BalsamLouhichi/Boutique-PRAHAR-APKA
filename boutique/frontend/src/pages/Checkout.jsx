import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../api/client.js';
import { formatPrice } from '../utils/price.js';

const SHIPPING_FEE = 0; // à ajuster une fois votre grille de livraison définie

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    customer_note: '',
    payment_method: 'cash_on_delivery',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const total = subtotal + SHIPPING_FEE;

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...form,
        shipping_fee: SHIPPING_FEE,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          color: it.color,
          size: it.size,
        })),
      };

      const order = await api.createOrder(payload);

      if (order.payment_method === 'card' && order.payment_redirect_url) {
        // Une fois le prestataire (iyzico/PayTR) branché, cette redirection
        // enverra le client sur la page de paiement sécurisée du prestataire.
        window.location.href = order.payment_redirect_url;
        return;
      }

      clearCart();
      navigate(`/commande-confirmee/${order.id}`);
    } catch (err) {
      setError(err.message || 'Impossible de valider la commande.');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--color-muted)]">Votre panier est vide.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-5 gap-10">
      <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
        <h1 className="font-display text-3xl mb-2">Finaliser la commande</h1>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-pre-line">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet *</label>
            <input required value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone *</label>
            <input required type="tel" value={form.customer_phone} onChange={(e) => update('customer_phone', e.target.value)}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email (optionnel)</label>
          <input type="email" value={form.customer_email} onChange={(e) => update('customer_email', e.target.value)}
            className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Adresse de livraison *</label>
          <textarea required rows={2} value={form.shipping_address} onChange={(e) => update('shipping_address', e.target.value)}
            className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ville *</label>
            <input required value={form.shipping_city} onChange={(e) => update('shipping_city', e.target.value)}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code postal</label>
            <input value={form.shipping_postal_code} onChange={(e) => update('shipping_postal_code', e.target.value)}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note (optionnel)</label>
          <textarea rows={2} value={form.customer_note} onChange={(e) => update('customer_note', e.target.value)}
            className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mode de paiement *</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 border border-[var(--color-line)] rounded-lg px-4 py-3 cursor-pointer has-[:checked]:border-[var(--color-amber)] has-[:checked]:bg-[var(--color-paper)]">
              <input type="radio" name="payment_method" checked={form.payment_method === 'cash_on_delivery'}
                onChange={() => update('payment_method', 'cash_on_delivery')} />
              <div>
                <p className="text-sm font-medium">Paiement à la livraison</p>
                <p className="text-xs text-[var(--color-muted)]">Payez en espèces à la réception de votre colis.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 border border-[var(--color-line)] rounded-lg px-4 py-3 cursor-not-allowed opacity-50">
              <input type="radio" name="payment_method" disabled />
              <div>
                <p className="text-sm font-medium">Carte bancaire</p>
                <p className="text-xs text-[var(--color-muted)]">Bientôt disponible.</p>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-[var(--color-ink)] text-white font-semibold py-3 rounded-lg hover:bg-[var(--color-ink-light)] transition-colors disabled:opacity-60">
          {submitting ? 'Validation en cours...' : 'Confirmer la commande'}
        </button>
      </form>

      <div className="lg:col-span-2">
        <div className="bg-white border border-[var(--color-line)] rounded-2xl p-6 sticky top-24">
          <h2 className="font-display text-xl mb-4">Récapitulatif</h2>
          <ul className="space-y-3 mb-4">
            {items.map((it) => (
              <li key={it.key} className="flex justify-between text-sm">
                <span className="text-[var(--color-muted)]">{it.product_name} × {it.quantity}</span>
                <span className="font-medium">{formatPrice(it.unit_price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--color-line)] pt-4 space-y-2">
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Livraison</span>
              <span>{SHIPPING_FEE === 0 ? 'Gratuite' : formatPrice(SHIPPING_FEE)}</span>
            </div>
            <div className="flex justify-between font-display text-lg pt-2">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
