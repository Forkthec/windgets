-- ============================================================================
-- Windgets · 0011_etiquetas_por_tarjeta.sql
-- D-14: máximo 3 etiquetas por tarjeta (docs/rediseno.md RD-96; antes eran 5).
--   1. R7 de la sincronización conserva las 3 asignaciones más antiguas de cada tarjeta. La función
--      _sync_apply_change es la de 0003_funciones.sql sin más cambios que ese número. CREATE OR REPLACE
--      conserva el dueño y los permisos, y la definición repite SECURITY DEFINER, search_path y la zona horaria.
--   2. En las tarjetas con más de 3 asignaciones vivas quedan las 3 primeras por (created_at, id), el mismo
--      orden de R7; las demás pasan a eliminadas. El disparador trg_z_updated_seq les da un updated_seq nuevo,
--      así que los computadores las reciben como eliminadas en su próxima descarga. Las tarjetas con 3 o menos
--      no se tocan. Antes del recorte se toma el mismo candado por cuenta que usa sync_push.
-- Equivalente local: docs/local/sqlite_esquema.sql (trg_limit_card_labels, versión 10).
-- ============================================================================

CREATE OR REPLACE FUNCTION public._sync_apply_change(p_uid uuid, p_ch jsonb, p_offset_ms bigint, p_now timestamptz)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  v_cid       jsonb := p_ch->'change_id';
  v_kind      text  := p_ch->>'entity_kind';
  v_op        text  := p_ch->>'op';
  v_fields    jsonb := CASE WHEN jsonb_typeof(p_ch->'fields') = 'object' THEN p_ch->'fields' ELSE '{}'::jsonb END;
  v_id        uuid;
  v_old       jsonb;
  v_new       jsonb;
  v_fm        jsonb;
  v_cur       jsonb;
  v_col       jsonb;
  v_created   boolean := false;
  v_deleted   timestamptz;
  v_ts_chg    timestamptz;
  v_ts_eff    timestamptz;
  v_ts_min    timestamptz;
  v_ts_max    timestamptz;
  v_max_mod   timestamptz;
  v_fts       timestamptz;
  v_ots       timestamptz;
  v_f         text;
  v_fv        jsonb;
  v_raw       jsonb;
  v_val       jsonb;
  v_cval      jsonb;
  v_applied   integer := 0;
  v_lost      integer := 0;
  v_written   text[]  := '{}';
  v_trim      uuid[];
  v_trimmed   boolean := false;
  v_cols      text;
  v_ref       text;
  v_status    text;
  v_reason    text;
  v_existing  jsonb;
  v_sqlstate  text;
  v_constraint text;
  v_msg       text;
BEGIN
  BEGIN
    -- Validación de la forma del cambio
    IF v_kind IS NULL OR NOT (v_kind = ANY (public._sync_kinds())) OR v_op IS NULL OR v_op NOT IN ('upsert','delete')
       OR p_ch->>'modified_at' IS NULL THEN
      RETURN public._sync_result(v_cid, 'rejected', false, 'invalid_field', NULL);
    END IF;
    v_id     := (p_ch->>'entity_id')::uuid;
    v_ts_chg := public._sync_corrected(p_ch->>'modified_at', p_offset_ms, p_now);

    -- R1 Propiedad: la fila existente debe ser del usuario
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE t.id = $1', v_kind) INTO v_old USING v_id;
    IF v_old IS NULL AND v_kind = 'card_label' THEN
      -- 1.3: dos computadores que crean la misma unión no duplican la fila
      SELECT to_jsonb(t) INTO v_old FROM public.card_label t
       WHERE t.user_id = p_uid AND t.card_id = (v_fields#>>'{card_id,value}')::uuid
         AND t.label_id = (v_fields#>>'{label_id,value}')::uuid;
    ELSIF v_old IS NULL AND v_kind = 'theme_widget' THEN
      SELECT to_jsonb(t) INTO v_old FROM public.theme_widget t
       WHERE t.user_id = p_uid AND t.theme_id = (v_fields#>>'{theme_id,value}')::uuid
         AND t.widget_id = (v_fields#>>'{widget_id,value}')::uuid;
    END IF;
    IF v_old IS NOT NULL THEN
      IF (v_old->>'user_id')::uuid <> p_uid THEN
        RETURN public._sync_result(v_cid, 'rejected', false, 'not_owner', NULL);
      END IF;
      v_id := (v_old->>'id')::uuid;
    END IF;
    IF v_kind IN ('user_preference','applied_theme') AND v_id <> p_uid THEN   -- id = user_id (1.3)
      RETURN public._sync_result(v_cid, 'rejected', false, 'invalid_field', NULL);
    END IF;

    ---------------------------------------------------------------- eliminar (R6)
    IF v_op = 'delete' THEN
      IF v_old IS NULL THEN
        RETURN public._sync_result(v_cid, 'rejected', false, 'unknown_entity', NULL);   -- 8.6
      END IF;
      IF v_kind IN ('user_preference','applied_theme') THEN
        RETURN public._sync_result(v_cid, 'rejected', false, 'invalid_field', NULL);
      END IF;
      IF (v_old->>'deleted_at') IS NOT NULL THEN                                        -- ya eliminada: idempotente
        RETURN public._sync_result(v_cid, 'applied', false, NULL, public._sync_shape(v_kind, v_old));
      END IF;
      SELECT max(value::timestamptz) INTO v_max_mod FROM jsonb_each_text(v_old->'field_mods');
      IF v_max_mod IS NOT NULL AND v_ts_chg <= v_max_mod THEN
        -- Una modificación igual o posterior a la eliminación: gana la modificación
        RETURN public._sync_result(v_cid, 'superseded', true, NULL, public._sync_shape(v_kind, v_old));
      END IF;
      EXECUTE format('UPDATE public.%I SET deleted_at = $1 WHERE id = $2', v_kind) USING v_ts_chg, v_id;
      -- Cascadas lógicas (8.5) con la misma hora de modificación
      IF v_kind = 'card' THEN
        UPDATE public.card_label SET deleted_at = v_ts_chg WHERE card_id = v_id AND deleted_at IS NULL;
      ELSIF v_kind = 'label' THEN
        UPDATE public.card_label SET deleted_at = v_ts_chg WHERE label_id = v_id AND deleted_at IS NULL;
      ELSIF v_kind = 'widget' THEN
        UPDATE public.theme_widget SET deleted_at = v_ts_chg WHERE widget_id = v_id AND deleted_at IS NULL;
        UPDATE public.widget_carousel_item SET deleted_at = v_ts_chg WHERE widget_id = v_id AND deleted_at IS NULL;
      ELSIF v_kind = 'theme' THEN
        UPDATE public.theme_widget SET deleted_at = v_ts_chg WHERE theme_id = v_id AND deleted_at IS NULL;
      END IF;
      EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE t.id = $1', v_kind) INTO v_cur USING v_id;
      RETURN public._sync_result(v_cid, 'applied', false, NULL, public._sync_shape(v_kind, v_cur));
    END IF;

    ---------------------------------------------------------------- crear o modificar
    FOR v_f IN SELECT jsonb_object_keys(v_fields) LOOP
      IF NOT (v_f = ANY (public._sync_fields(v_kind))) THEN
        RETURN public._sync_result(v_cid, 'rejected', false, 'invalid_field', NULL);
      END IF;
    END LOOP;

    IF v_old IS NULL THEN                                                         -- R3 Creación
      v_created := true;
      FOREACH v_f IN ARRAY public._sync_required(v_kind) LOOP
        IF (v_fields->v_f->'value') IS NULL OR (v_fields->v_f->'value') = 'null'::jsonb THEN
          RETURN public._sync_result(v_cid, 'rejected', false, 'incomplete_create', NULL);
        END IF;
      END LOOP;
      v_new := jsonb_build_object('id', v_id, 'user_id', p_uid);
      v_fm  := '{}'::jsonb;
    ELSE
      v_new     := v_old;
      v_fm      := v_old->'field_mods';
      v_deleted := (v_old->>'deleted_at')::timestamptz;
    END IF;

    -- R4 LWW por campo, R5 campos distintos
    FOR v_f, v_fv IN SELECT key, value FROM jsonb_each(v_fields) LOOP
      v_raw := coalesce(v_fv->'value', 'null'::jsonb);
      v_fts := public._sync_corrected(coalesce(v_fv->>'modified_at', p_ch->>'modified_at'), p_offset_ms, p_now);
      v_ts_min := least(v_ts_min, v_fts);
      -- Normaliza el valor con el tipo de la columna (fechas, colores, números); lanza 22xxx/23514 si no cabe
      EXECUTE format('SELECT to_jsonb(r) -> %L FROM jsonb_populate_record(NULL::public.%I, jsonb_build_object(%L, $1)) r',
                     v_f, v_kind, v_f) INTO v_val USING v_raw;
      v_cval := coalesce(v_new -> v_f, 'null'::jsonb);
      v_ots  := (v_fm ->> v_f)::timestamptz;

      IF v_deleted IS NOT NULL AND v_fts <= v_deleted THEN
        v_lost := v_lost + 1;                                  -- R6: la eliminación es más reciente
      ELSIF v_ots IS NULL OR v_fts > v_ots
            OR (v_fts = v_ots AND v_val IS DISTINCT FROM v_cval AND v_val::text > v_cval::text) THEN
        -- gana la hora más reciente; en empate exacto con valores distintos, desempate determinista
        v_new     := jsonb_set(v_new, ARRAY[v_f], v_val, true);
        v_fm      := jsonb_set(v_fm,  ARRAY[v_f], to_jsonb(public._sync_iso(v_fts)), true);
        v_applied := v_applied + 1;
        v_written := v_written || v_f;
        v_ts_max  := greatest(v_ts_max, v_fts);
      ELSIF v_val IS NOT DISTINCT FROM v_cval THEN
        v_applied := v_applied + 1;                            -- mismo valor: nada que hacer (R11)
      ELSE
        v_lost := v_lost + 1;                                  -- el valor recibido es más antiguo
      END IF;
    END LOOP;

    -- R6: modificar una fila eliminada
    IF v_deleted IS NOT NULL THEN
      IF v_applied = 0 THEN
        RETURN public._sync_result(v_cid, CASE WHEN v_lost > 0 THEN 'deleted' ELSE 'applied' END,
                                   v_lost > 0, NULL, public._sync_shape(v_kind, v_old));
      END IF;
      v_new := jsonb_set(v_new, '{deleted_at}', 'null'::jsonb, true);        -- resucita
    END IF;

    v_ts_eff := coalesce(v_ts_max, v_ts_chg);
    IF v_created THEN
      v_new := jsonb_set(v_new, '{created_at}', to_jsonb(public._sync_iso(coalesce(v_ts_min, v_ts_chg))), true);
    END IF;

    -- Referencias a filas del mismo usuario que estén vivas (R1, 8.5)
    FOREACH v_ref IN ARRAY public._sync_refs(v_kind) LOOP
      v_f := split_part(v_ref, ':', 1);
      IF v_f = ANY (v_written) AND (v_new->>v_f) IS NOT NULL THEN
        PERFORM public._sync_ref_check(p_uid, split_part(v_ref, ':', 2), (v_new->>v_f)::uuid);
      END IF;
    END LOOP;

    -- R8 Normalización de la tarjeta (antes de escribir, para no violar los CHECK)
    IF v_kind = 'card' THEN
      -- (a) la columna debe existir viva y ser del usuario; si no, la columna `todo`
      SELECT to_jsonb(c) INTO v_col FROM public.kanban_column c
       WHERE c.id = (v_new->>'column_id')::uuid AND c.user_id = p_uid AND c.deleted_at IS NULL;
      IF v_col IS NULL THEN
        SELECT to_jsonb(c) INTO v_col FROM public.kanban_column c
         WHERE c.user_id = p_uid AND c.role = 'todo' AND c.deleted_at IS NULL;
        IF v_col IS NULL THEN
          RETURN public._sync_result(v_cid, 'rejected', false, 'parent_deleted', NULL);
        END IF;
        v_new := jsonb_set(v_new, '{column_id}', v_col->'id', true);
        v_fm  := jsonb_set(v_fm, '{column_id}', to_jsonb(public._sync_iso(v_ts_eff)), true);
      END IF;
      IF (v_new->>'previous_column_id') IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM public.kanban_column c WHERE c.id = (v_new->>'previous_column_id')::uuid
              AND c.user_id = p_uid AND c.deleted_at IS NULL) THEN
        v_new := jsonb_set(v_new, '{previous_column_id}', 'null'::jsonb, true);
        v_fm  := jsonb_set(v_fm, '{previous_column_id}', to_jsonb(public._sync_iso(v_ts_eff)), true);
      END IF;
      -- (b) completada si y solo si su columna es `done`
      IF v_col->>'role' = 'done' AND (v_new->>'completed_on') IS NULL THEN
        v_new := jsonb_set(v_new, '{completed_on}', to_jsonb(((v_ts_eff AT TIME ZONE 'UTC')::date)::text), true);
        v_fm  := jsonb_set(v_fm, '{completed_on}', to_jsonb(public._sync_iso(v_ts_eff)), true);
      ELSIF v_col->>'role' <> 'done' AND (v_new->>'completed_on') IS NOT NULL THEN
        v_new := jsonb_set(v_new, '{completed_on}', 'null'::jsonb, true);
        v_fm  := jsonb_set(v_fm, '{completed_on}', to_jsonb(public._sync_iso(v_ts_eff)), true);
      END IF;
      -- (c) bloque horario posterior a la fecha límite: se quita (HE-07-HU04-ET13)
      IF (v_new->>'scheduled_date') IS NOT NULL
         AND (v_new->>'scheduled_date')::date > (v_new->>'due_date')::date THEN
        v_new := jsonb_set(jsonb_set(v_new, '{scheduled_date}', 'null'::jsonb, true), '{scheduled_hour}', 'null'::jsonb, true);
        v_fm  := jsonb_set(jsonb_set(v_fm, '{scheduled_date}', to_jsonb(public._sync_iso(v_ts_eff)), true),
                                           '{scheduled_hour}', to_jsonb(public._sync_iso(v_ts_eff)), true);
      END IF;
    END IF;

    v_new := jsonb_set(v_new, '{field_mods}', v_fm, true);

    -- Escritura (R7: los disparadores y restricciones aplican las invariantes de 8.4)
    IF v_created THEN
      SELECT string_agg(quote_ident(k), ', ') INTO v_cols FROM jsonb_object_keys(v_new) AS k;
      EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)',
                     v_kind, v_cols, v_cols, v_kind) USING v_new;
    ELSIF v_new IS DISTINCT FROM v_old THEN
      SELECT string_agg(quote_ident(e.k), ', ') INTO v_cols
        FROM jsonb_each(v_new) AS e(k, val) WHERE (v_old -> e.k) IS DISTINCT FROM e.val;
      EXECUTE format('UPDATE public.%I SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)) WHERE id = $2',
                     v_kind, v_cols, v_cols, v_kind) USING v_new, v_id;
    END IF;

    -- R7: máximos por padre (se conservan las más antiguas; las demás pasan a eliminadas)
    IF v_kind = 'card_label' THEN
      WITH ranked AS (
        SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn FROM public.card_label
         WHERE card_id = (v_new->>'card_id')::uuid AND deleted_at IS NULL),
      upd AS (
        UPDATE public.card_label c SET deleted_at = v_ts_eff FROM ranked r
         WHERE c.id = r.id AND r.rn > 3 RETURNING c.id)
      SELECT coalesce(array_agg(id), '{}') INTO v_trim FROM upd;
    ELSIF v_kind = 'widget_carousel_item' THEN
      WITH ranked AS (
        SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn FROM public.widget_carousel_item
         WHERE widget_id = (v_new->>'widget_id')::uuid AND deleted_at IS NULL),
      upd AS (
        UPDATE public.widget_carousel_item c SET deleted_at = v_ts_eff FROM ranked r
         WHERE c.id = r.id AND r.rn > 10 RETURNING c.id)
      SELECT coalesce(array_agg(id), '{}') INTO v_trim FROM upd;
    END IF;
    v_trimmed := coalesce(cardinality(v_trim), 0) > 0;

    -- R9 Respuesta con la fila resultante completa
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE t.id = $1', v_kind) INTO v_cur USING v_id;
    v_status := CASE WHEN (v_cur->>'deleted_at') IS NOT NULL THEN 'deleted'
                     WHEN v_lost > 0 AND v_applied = 0 THEN 'superseded'
                     WHEN v_lost > 0 THEN 'merged'
                     ELSE 'applied' END;
    RETURN public._sync_result(v_cid, v_status, v_lost > 0 OR v_trimmed, NULL, public._sync_shape(v_kind, v_cur));

  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE, v_constraint = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    v_reason := CASE
      WHEN v_sqlstate = 'WG001' THEN v_msg
      WHEN v_sqlstate = '23505' THEN
        CASE WHEN v_constraint LIKE '%name%'   THEN 'duplicate_name'
             WHEN v_constraint LIKE '%role%'   THEN 'duplicate_role'
             WHEN v_constraint LIKE '%widget%' THEN 'duplicate_widget'
             ELSE 'invalid_field' END
      WHEN v_sqlstate = '23502' THEN CASE WHEN v_created THEN 'incomplete_create' ELSE 'invalid_field' END
      WHEN v_sqlstate IN ('23503','23514') OR v_sqlstate LIKE '22%' THEN 'invalid_field'
      ELSE NULL END;
    IF v_reason IS NULL THEN
      RAISE;                                     -- error inesperado: no se oculta
    END IF;
    IF v_reason IN ('duplicate_name','duplicate_role','duplicate_widget') AND v_new IS NOT NULL THEN
      v_existing := public._sync_find_existing(p_uid, v_kind, v_reason, v_new);
    END IF;
    RETURN public._sync_result(v_cid, 'rejected', false, v_reason, v_existing);
  END;
END $$;

-- Recorte de las asignaciones sobrantes
DO $$
DECLARE v_uid uuid;
BEGIN
  FOR v_uid IN
    SELECT DISTINCT r.user_id
      FROM (SELECT user_id, row_number() OVER (PARTITION BY card_id ORDER BY created_at, id) AS rn
              FROM public.card_label WHERE deleted_at IS NULL) r
     WHERE r.rn > 3
     ORDER BY r.user_id
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended('windgets:' || v_uid::text, 0));
  END LOOP;

  UPDATE public.card_label c SET deleted_at = date_trunc('milliseconds', now())
    FROM (SELECT id, row_number() OVER (PARTITION BY card_id ORDER BY created_at, id) AS rn
            FROM public.card_label WHERE deleted_at IS NULL) r
   WHERE c.id = r.id AND r.rn > 3;
END $$;
