import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatPrice } from '../utils/price.js';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrder(id).then(setOrder).catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center text-red-600">{error}</div>;
  }
  if (!order) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center text-[var(--color-muted)]">Chargement...</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--color-sage)] text-white flex items-center justify-center mx-auto mb-6 text-3xl">
        ✓
      </div>
      <h1 className="font-display text-3xl mb-3">Commande confirmée</h1>
      <p className="text-[var(--color-muted)] mb-8">
        Merci {order.customer_name} ! Votre commande a bien été enregistrée et sera traitée sous peu.
      </p>

      <div className="bg-white border border-[var(--color-line)] rounded-2xl p-6 text-left mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--color-muted)]">Numéro de commande</span>
          <span className="font-mono text-xs">{order.id}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--color-muted)]">Mode de paiement</span>
          <span>{order.payment_method === 'cash_on_delivery' ? 'À la livraison' : 'Carte bancaire'}</span>
        </div>
        <div className="flex justify-between font-display text-lg pt-2 border-t border-[var(--color-line)] mt-2">
          <span>Total</span>
          <span>{formatPrice(order.total, order.currency)}</span>
        </div>
      </div>

      <Link to="/boutique" className="inline-block bg-[var(--color-ink)] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[var(--color-ink-light)] transition-colors">
        Continuer mes achats
      </Link>
    </div>
  );
}
