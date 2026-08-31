import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, resolveImageUrl } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { effectivePrice, formatPrice, hasPromo } from '../utils/price.js';

const SEASON_LABELS = { hiver: 'Hiver', ete: 'Été' };
const GENDER_LABELS = { homme: 'Homme', femme: 'Femme', enfant: 'Enfant', unisexe: 'Unisexe' };

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setProduct(null);
    api.getProduct(slug).then((data) => {
      setProduct(data);
      setColor(data.colors?.[0] || '');
      setSize(data.sizes?.[0] || '');
      setSelectedImage(0);
    }).catch((err) => setError(err.message || 'Produit introuvable.'));
  }, [slug]);

  const images = useMemo(() => {
    if (!product) return [];
    return [...new Set([product.primary_image, ...(product.images || []).map((image) => image.image_url)].filter(Boolean))];
  }, [product]);

  if (error) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-red-600">{error}</p><Link to="/boutique" className="mt-4 inline-block underline">Retour au catalogue</Link></div>;
  if (!product) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[var(--color-muted)]">Chargement du produit...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/boutique" className="inline-flex text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-7">← Retour au catalogue</Link>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <section>
          <div className="aspect-square rounded-3xl overflow-hidden bg-[var(--color-paper)] border border-[var(--color-line)]">
            {images.length ? <img src={resolveImageUrl(images[selectedImage])} alt={product.name} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[var(--color-muted)]">Photo à venir</div>}
          </div>
          {images.length > 1 && <div className="mt-4 flex gap-3 overflow-x-auto pb-1">{images.map((image, index) => <button key={image} onClick={() => setSelectedImage(index)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${index === selectedImage ? 'border-[var(--color-amber)]' : 'border-transparent'}`}><img src={resolveImageUrl(image)} alt={`${product.name} - vue ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}
        </section>

        <section className="lg:pt-5">
          <p className="text-xs uppercase tracking-wide text-[var(--color-amber-dark)] font-semibold mb-2">{product.category_name}</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-4">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6"><span className="font-display text-3xl">{formatPrice(effectivePrice(product))}</span>{hasPromo(product) && <><span className="text-lg line-through text-[var(--color-muted)]">{formatPrice(product.price)}</span><span className="rounded-full bg-[var(--color-sage)] text-white px-3 py-1 text-xs font-semibold">Promotion</span></>}</div>
          {product.description && <p className="text-[var(--color-muted)] leading-relaxed mb-7">{product.description}</p>}
          <div className="grid sm:grid-cols-2 gap-3 mb-7 text-sm"><div className="rounded-xl bg-[var(--color-paper)] p-3"><b>Saison</b><p className="text-[var(--color-muted)] mt-1">{SEASON_LABELS[product.season]}</p></div><div className="rounded-xl bg-[var(--color-paper)] p-3"><b>Genre</b><p className="text-[var(--color-muted)] mt-1">{GENDER_LABELS[product.gender]}</p></div></div>
          <div className="space-y-5 border-t border-[var(--color-line)] pt-6">
            {product.colors?.length > 0 && <label className="block text-sm font-semibold">Couleur<select value={color} onChange={(e) => setColor(e.target.value)} className="mt-2 block w-full rounded-lg border border-[var(--color-line)] px-3 py-3 font-normal">{product.colors.map((option) => <option key={option}>{option}</option>)}</select></label>}
            {product.sizes?.length > 0 && <label className="block text-sm font-semibold">Taille<select value={size} onChange={(e) => setSize(e.target.value)} className="mt-2 block w-full rounded-lg border border-[var(--color-line)] px-3 py-3 font-normal">{product.sizes.map((option) => <option key={option}>{option}</option>)}</select></label>}
            <div className="flex gap-3"><input aria-label="Quantité" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(Number(e.target.value) || 1, 1))} className="w-24 rounded-lg border border-[var(--color-line)] px-3 py-3" /><button onClick={() => addItem(product, quantity, color, size)} className="flex-1 rounded-lg bg-[var(--color-ink)] px-5 py-3 font-semibold text-white hover:bg-[var(--color-ink-light)]">Ajouter au panier</button></div>
          </div>
        </section>
      </div>
    </div>
  );
}
