-- ============================================================
-- Migration : suivi "vue / non vue" des commandes (notifications admin)
-- À exécuter dans Neon (SQL Editor) et en local si vous utilisez Docker
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Les commandes déjà traitées (au-delà du statut "nouvelle") sont
-- considérées comme vues, pour ne pas rallumer des notifications sur tout
-- l'historique existant.
UPDATE orders SET viewed_at = updated_at WHERE viewed_at IS NULL AND status <> 'nouvelle';
