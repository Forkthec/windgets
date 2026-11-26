-- ============================================================================
-- Windgets · 0012_recorte_etiquetas.sql
-- D-14: recorta las asignaciones sobrantes (docs/rediseno.md RD-96). En las tarjetas con más de 3 asignaciones
-- vivas quedan las 3 primeras por (created_at, id), el mismo orden de R7; las demás pasan a eliminadas. El
-- disparador trg_z_updated_seq les da un updated_seq nuevo, así que los computadores las reciben como eliminadas
-- en su próxima descarga. Las tarjetas con 3 o menos no se tocan.
-- Se aplica después de 0011 y en una transacción distinta (como hace `supabase db push` con cada migración): un
-- sync_push que esperara a que terminara la transacción que cambia R7 todavía ejecutaría la R7 anterior.
-- Sin equivalente local: el computador recibe el recorte en la descarga.
-- ============================================================================

-- Un solo bloque, para que los candados duren hasta el recorte también cuando cada sentencia se confirma sola (psql).
-- El orden es el de sync_push (primero la cuenta, después la tabla): así no hay interbloqueo.
DO $$
DECLARE v_uid uuid;
BEGIN
  -- Todas las cuentas: un sync_push en curso puede estar creando la 4.ª asignación de una que aún no se ve.
  FOR v_uid IN SELECT user_id FROM public.profile ORDER BY user_id LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended('windgets:' || v_uid::text, 0));
  END LOOP;
  -- Detiene cualquier otra escritura de asignaciones; las lecturas siguen.
  LOCK TABLE public.card_label IN SHARE ROW EXCLUSIVE MODE;

  UPDATE public.card_label c SET deleted_at = date_trunc('milliseconds', now())
    FROM (SELECT id, row_number() OVER (PARTITION BY card_id ORDER BY created_at, id) AS rn
            FROM public.card_label WHERE deleted_at IS NULL) r
   WHERE c.id = r.id AND r.rn > 3;
END $$;
