import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { resolveImageUrl } from '../api/client.js';


const SEASON_LABELS = { hiver: 'Hiver', ete: 'Été', printemps: 'Printemps', automne: 'Automne', toutes_saisons: 'Toutes saisons' };
const GENDER_LABELS = { homme: 'Homme', femme: 'Femme', enfant: 'Enfant', unisexe: 'Unisexe' };

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(product.min_order_qty || 1);
  const [color, setColor] = useState(product.colors?.[0] || '');
  const [size, setSize] = useState(product.sizes?.[0] || '');
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="group w-full min-w-0 h-full bg-white rounded-2xl border border-[var(--color-line)] overflow-hidden hover:shadow-lg hover:border-[var(--color-amber)] transition-all flex flex-col">
      <div className="relative aspect-square bg-[var(--color-paper)] overflow-hidden">
        {product.primary_image ? (
          <img
            src={resolveImageUrl(product.primary_image)} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-sm">
            Photo à venir
          </div>
        )}
        {product.is_new && (
          <span className="absolute top-3 left-3 bg-[var(--color-sage)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Nouveau
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col min-h-[220px]">
        <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-1">
          {product.category_name}
        </p>
        <h3 className="font-display text-lg leading-snug mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-[var(--color-muted)] mb-3 min-h-[36px]">
          {SEASON_LABELS[product.season]} · {GENDER_LABELS[product.gender]} · Min. {product.min_order_qty} pièces
        </p>

        {!showOptions ? (
          <button
            onClick={() => setShowOptions(true)}
            className="mt-auto w-full border border-[var(--color-ink)] text-[var(--color-ink)] font-medium py-2 rounded-lg hover:bg-[var(--color-ink)] hover:text-white transition-colors text-sm"
          >
            Ajouter au panier
          </button>
        ) : (
          <div className="mt-auto space-y-2">
            {product.colors?.length > 0 && (
              <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full text-sm border border-[var(--color-line)] rounded-lg px-2 py-1.5">
                {product.colors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {product.sizes?.length > 0 && (
              <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full text-sm border border-[var(--color-line)] rounded-lg px-2 py-1.5">
                {product.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={product.min_order_qty}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || product.min_order_qty)}
                className="w-full text-sm border border-[var(--color-line)] rounded-lg px-2 py-1.5"
              />
              <button
                onClick={() => {
                  addItem(product, quantity, color, size);
                  setShowOptions(false);
                }}
                className="whitespace-nowrap bg-[var(--color-amber)] hover:bg-[var(--color-amber-dark)] text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
