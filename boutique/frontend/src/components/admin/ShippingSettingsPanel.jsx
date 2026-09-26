import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';

export default function ShippingSettingsPanel() {
  const [fee, setFee] = useState('');
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSettings()
      .then((s) => {
        setFee(s.shipping_fee ?? '0');
        setThreshold(s.free_shipping_threshold ?? '0');
      })
      .catch(() => setError('Impossible de charger les réglages.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await Promise.all([
        api.updateSetting('shipping_fee', String(Math.max(Number(fee) || 0, 0))),
        api.updateSetting('free_shipping_threshold', String(Math.max(Number(threshold) || 0, 0))),
      ]);
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Échec de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-line)] p-6">
      <h3 className="font-display text-xl text-[var(--color-ink)]">Livraison</h3>
      <p className="text-sm text-[var(--color-muted)] mt-1 mb-5">
        Frais appliqués à chaque commande, et montant à partir duquel elle devient gratuite.
      </p>

      {loading ? (
        <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
      ) : (
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Frais de livraison (TRY)</label>
            <input
              type="number" min={0} step="0.01"
              value={fee}
              onChange={(e) => { setFee(e.target.value); setSaved(false); }}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seuil de livraison gratuite (TRY)</label>
            <input
              type="number" min={0} step="0.01"
              value={threshold}
              onChange={(e) => { setThreshold(e.target.value); setSaved(false); }}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">0 = jamais de livraison gratuite.</p>
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={saving} className="bg-[var(--color-ink)] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            {saved && <span className="text-sm text-[var(--color-sage)]">Enregistré.</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
