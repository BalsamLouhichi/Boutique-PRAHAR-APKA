import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { resolveImageUrl } from '../api/client.js';
import { effectivePrice, formatPrice, hasPromo } from '../utils/price.js';


const SEASON_LABELS = { hiver: 'Hiver', ete: 'Été' };
const GENDER_LABELS = { homme: 'Homme', femme: 'Femme', enfant: 'Enfant', unisexe: 'Unisexe' };

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(product.colors?.[0] || '');
  const [size, setSize] = useState(product.sizes?.[0] || '');
  const [showOptions, setShowOptions] = useState(false);
  // stock_quantity absent (ancien cache navigateur) => on ne bloque pas la vente.
  const stock = product.stock_quantity;
  const outOfStock = stock != null && stock <= 0;
  const lowStock = stock != null && stock > 0 && stock <= 5;

  return (
    <div className="group w-full min-w-0 h-full bg-white rounded-2xl border border-[var(--color-line)] overflow-hidden hover:shadow-lg hover:border-[var(--color-amber)] transition-all flex flex-col">
      <Link to={`/produit/${product.slug}`} className="relative aspect-square bg-[var(--color-paper)] overflow-hidden block">
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
        {outOfStock ? (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Rupture de stock
          </span>
        ) : product.is_new && (
          <span className="absolute top-3 left-3 bg-[var(--color-sage)] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Nouveau
          </span>
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col min-h-[220px]">
        <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-1">
          {product.category_name}
        </p>
        <Link to={`/produit/${product.slug}`} className="font-display text-lg leading-snug mb-1 line-clamp-2 hover:text-[var(--color-amber-dark)]">{product.name}</Link>
        <p className="text-xs text-[var(--color-muted)] mb-3 min-h-[36px]">
          {SEASON_LABELS[product.season]} · {GENDER_LABELS[product.gender]}
        </p>

        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display text-xl text-[var(--color-ink)]">{formatPrice(effectivePrice(product))}</span>
          {hasPromo(product) && <span className="text-sm text-[var(--color-muted)] line-through">{formatPrice(product.price)}</span>}
          {hasPromo(product) && <span className="text-xs font-semibold text-[var(--color-sage)]">Promo</span>}
        </div>
        {lowStock && <p className="mb-3 -mt-2 text-xs font-medium text-[var(--color-amber-dark)]">Plus que {stock} en stock</p>}

        <div className="mb-4 space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm">
          {product.colors?.length > 0 && (
            <p className="leading-snug text-[var(--color-ink)]">
              <span className="font-semibold">Couleurs disponibles</span>
              <span className="text-[var(--color-muted)]"> : {product.colors.join(', ')}</span>
            </p>
          )}
          {product.sizes?.length > 0 && (
            <p className="leading-snug text-[var(--color-ink)]">
              <span className="font-semibold">Tailles disponibles</span>
              <span className="text-[var(--color-muted)]"> : {product.sizes.join(', ')}</span>
            </p>
          )}
        </div>

        <Link to={`/produit/${product.slug}`} className="mb-3 text-center text-sm font-semibold text-[var(--color-amber-dark)] hover:underline">Voir les détails</Link>

        {outOfStock ? (
          <button
            disabled
            className="mt-auto w-full border border-[var(--color-line)] text-[var(--color-muted)] font-medium py-2 rounded-lg text-sm cursor-not-allowed"
          >
            Rupture de stock
          </button>
        ) : !showOptions ? (
          <button
            onClick={() => setShowOptions(true)}
            className="mt-auto w-full border border-[var(--color-ink)] text-[var(--color-ink)] font-medium py-2 rounded-lg hover:bg-[var(--color-ink)] hover:text-white transition-colors text-sm"
          >
            Ajouter au panier
          </button>
        ) : (
          <div className="mt-auto space-y-2">
            {product.colors?.length > 0 && (
              <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full text-sm border border-[var(--color-line)] rounded-lg px-2 py-1.5" aria-label="Choisir une couleur">
                {product.colors.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            )}
            {product.sizes?.length > 0 && (
              <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full text-sm border border-[var(--color-line)] rounded-lg px-2 py-1.5" aria-label="Choisir une taille">
                {product.sizes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={stock ?? undefined}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(Math.max(parseInt(e.target.value) || 1, 1), stock ?? Infinity))}
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
