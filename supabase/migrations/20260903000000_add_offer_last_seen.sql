-- Dónde Hay - Offer last_seen_at + Destile del ranking
-- Añade la columna `last_seen_at` a `product_offers` para rastrear el último
-- scrape en el que se "vio" cada oferta, y un índice para el destile.
--
-- Destile: el scraping por cron solo ve una muestra del catálogo de Revolico
-- (primeras páginas). Las ofertas que llevan más de `destile_age` sin reaparecer
-- en un scrape se marcan como `inactive` para no contaminar el ranking con
-- anuncios vencidos. Las ofertas que vuelven a aparecer se re-activan en el
-- upsert del scraper (status='active'), lo que hace el mecanismo autorreversible.

ALTER TABLE public.product_offers
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Backfill: las ofertas activas existentes (previas a esta migración) se
-- consideran "vistas ahora" para no desactivarlas prematuramente por el destile.
-- El WHERE evita sobrescribir un last_seen_at ya definido si esta migración
-- se vuelve a aplicar.
UPDATE public.product_offers
SET last_seen_at = NOW()
WHERE status = 'active'
  AND last_seen_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_offers_last_seen
  ON public.product_offers(last_seen_at)
  WHERE status = 'active';

-- ============================================
-- RPC: destile_stale_offers
-- Marca como 'inactive' las ofertas activas de un source_fuente cuyo
-- `last_seen_at` es más antiguo que `p_age_days`. Devuelve el nº de filas
-- desactivadas. Se invoca desde la Edge Function scrape-revolico al final del
-- ciclo. Solo service_role/authenticated la ejecutan vía RPC de la EF.
-- ============================================
CREATE OR REPLACE FUNCTION public.destile_stale_offers(
  p_source_id TEXT,
  p_age_days INT DEFAULT 7
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ;
  v_count INT;
BEGIN
  v_cutoff := NOW() - make_interval(days => p_age_days);

  UPDATE public.product_offers
  SET status = 'inactive'
  WHERE source_id = p_source_id
    AND status = 'active'
    AND last_seen_at IS NOT NULL
    AND last_seen_at < v_cutoff;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.destile_stale_offers(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.destile_stale_offers(TEXT, INT) TO authenticated;
