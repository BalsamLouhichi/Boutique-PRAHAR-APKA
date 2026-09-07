import { useState } from 'react';
import { useWholesaleCart } from '../context/WholesaleCartContext.jsx';
import { resolveImageUrl } from '../api/client.js';

const SEASON_LABELS = { hiver: 'Hiver', ete: 'Été' };
const GENDER_LABELS = { homme: 'Homme', femme: 'Femme', enfant: 'Enfant', unisexe: 'Unisexe' };

export default function WholesaleProductCard({ product }) {
  const { addItem } = useWholesaleCart();
  const [quantity, setQuantity] = useState(product.min_order_qty || 1);

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-line)] overflow-hidden hover:shadow-lg hover:border-[var(--color-amber)] transition-all flex flex-col">
      <div className="relative aspect-square bg-[var(--color-paper)] overflow-hidden">
        {product.primary_image ? (
          <img src={resolveImageUrl(product.primary_image)} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-sm">Photo à venir</div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && <span className="bg-[var(--color-sage)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">Nouveau</span>}
          {product.is_exclusive && <span className="bg-[var(--color-ink)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">Exclusif</span>}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-1">{product.category_name}</p>
        <h3 className="font-display text-lg leading-snug mb-1">{product.name}</h3>
        <p className="text-xs text-[var(--color-muted)] mb-2">
          {SEASON_LABELS[product.season]} · {GENDER_LABELS[product.gender]}
        </p>

        {/* Couleurs/tailles affichées en info uniquement, pas de sélection */}
        {(product.colors?.length > 0 || product.sizes?.length > 0) && (
          <div className="text-xs text-[var(--color-muted)] mb-3 space-y-0.5">
            {product.colors?.length > 0 && <p>Couleurs disponibles : {product.colors.join(', ')}</p>}
            {product.sizes?.length > 0 && <p>Tailles disponibles : {product.sizes.join(', ')}</p>}
          </div>
        )}

        <p className="text-xs text-[var(--color-muted)] mb-3">Quantité minimum : {product.min_order_qty} pièces</p>

        <div className="mt-auto flex items-center gap-2">
          <input
            type="number"
            min={product.min_order_qty}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || product.min_order_qty)}
            className="w-full text-sm border border-[var(--color-line)] rounded-lg px-2 py-1.5"
          />
          <button
            onClick={() => addItem(product, quantity)}
            className="whitespace-nowrap bg-[var(--color-ink)] hover:bg-[var(--color-ink-light)] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
