-- ============================================================================
-- Windgets · pruebas_etiquetas_por_tarjeta.sql
-- Pruebas de la migración 0011_etiquetas_por_tarjeta.sql (D-14; docs/rediseno.md RD-96) sobre las migraciones
-- reales del repositorio. ejecutar_pruebas.sh la corre en una base con el sustituto de Supabase, 0001 a 0010 y
-- seed.sql, y le pasa `-v repo=<carpeta supabase/>`. Primero crea tarjetas con las asignaciones que se podían tener
-- con el máximo anterior, después aplica 0011 y comprueba el recorte, R7 y que lo demás no cambia.
-- Cualquier fallo lanza una excepción 'FALLO: ...' y detiene el script.
-- ============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null
SET client_min_messages = notice;

CREATE SCHEMA t;

CREATE FUNCTION t.ok(p_cond boolean, p_msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_cond IS TRUE THEN RAISE NOTICE 'ok   - %', p_msg;
  ELSE RAISE EXCEPTION 'FALLO: %', p_msg; END IF;
END $$;

CREATE FUNCTION t.eq(p_got anyelement, p_exp anyelement, p_msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_got IS NOT DISTINCT FROM p_exp THEN RAISE NOTICE 'ok   - %', p_msg;
  ELSE RAISE EXCEPTION 'FALLO: % (obtenido %, esperado %)', p_msg, p_got, p_exp; END IF;
END $$;

-- Identificadores fijos y legibles: t.id('c5', 1) siempre da el mismo uuid y ordena por n.
CREATE FUNCTION t.id(p_grupo text, p_n integer DEFAULT 0) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$$ SELECT (substr(md5(p_grupo), 1, 8) || '-0000-0000-0000-' || lpad(p_n::text, 12, '0'))::uuid $$;

-- Dos cuentas, cada una con 6 etiquetas.
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
  (t.id('ana'),  'ana@example.com',  now(), '{"alias":"Ana"}'),
  (t.id('beto'), 'beto@example.com', now(), '{"alias":"Beto"}');
INSERT INTO public.label (id, user_id, name, color_id)
SELECT t.id('lab-' || u, n), t.id(u), 'Etq ' || n, 'blue'
  FROM unnest(ARRAY['ana', 'beto']) u, generate_series(1, 6) n;

-- Una tarjeta por caso y sus asignaciones: la etiqueta n con la hora de creación base + p_horas[n] minutos.
CREATE FUNCTION t.tarjeta(p_card text, p_user text, p_horas integer[]) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.card (id, user_id, title, due_date, position, column_id)
  SELECT t.id(p_card), t.id(p_user), p_card, '2026-12-01', 1, k.id
    FROM public.kanban_column k WHERE k.user_id = t.id(p_user) AND k.role = 'todo';
  INSERT INTO public.card_label (id, user_id, created_at, card_id, label_id)
  SELECT t.id(p_card, n), t.id(p_user), '2026-11-01T00:00:00Z'::timestamptz + p_horas[n] * interval '1 minute',
         t.id(p_card), t.id('lab-' || p_user, n)
    FROM generate_series(1, cardinality(p_horas)) n;
END $$;

-- c5: 5 vivas con horas en desorden respecto al id: se quedan las de las etiquetas 2, 4 y 5.
SELECT t.tarjeta('c5', 'ana', ARRAY[50, 10, 40, 20, 30]);
-- empate: la 3.ª y la 4.ª comparten hora: se queda la de menor id (la 3).
SELECT t.tarjeta('empate', 'ana', ARRAY[1, 2, 3, 3]);
SELECT t.tarjeta('c3', 'ana', ARRAY[1, 2, 3]);
SELECT t.tarjeta('c1', 'ana', ARRAY[1]);
-- borrada: 4 filas, pero la más antigua ya está eliminada: quedan 3 vivas y no se toca.
SELECT t.tarjeta('borrada', 'ana', ARRAY[1, 2, 3, 4]);
UPDATE public.card_label SET deleted_at = '2026-11-02T00:00:00Z' WHERE id = t.id('borrada', 1);
SELECT t.tarjeta('deBeto', 'beto', ARRAY[1, 2, 3, 4]);

CREATE TABLE t.antes AS TABLE public.card_label;

\i :repo/migrations/0011_etiquetas_por_tarjeta.sql

CREATE FUNCTION t.vivas(p_card text) RETURNS uuid[] LANGUAGE sql STABLE AS
$$ SELECT coalesce(array_agg(id ORDER BY id), '{}') FROM public.card_label WHERE card_id = t.id(p_card) AND deleted_at IS NULL $$;

SELECT t.eq(t.vivas('c5'), ARRAY[t.id('c5', 2), t.id('c5', 4), t.id('c5', 5)],
            '0011: de 5 etiquetas quedan las 3 más antiguas por created_at');
SELECT t.eq(t.vivas('empate'), ARRAY[t.id('empate', 1), t.id('empate', 2), t.id('empate', 3)],
            '0011: con la misma hora decide el id');
SELECT t.eq(t.vivas('deBeto'), ARRAY[t.id('deBeto', 1), t.id('deBeto', 2), t.id('deBeto', 3)],
            '0011: el recorte llega a todas las cuentas');
SELECT t.eq((SELECT count(*) FROM (
               SELECT card_id FROM public.card_label WHERE deleted_at IS NULL GROUP BY card_id HAVING count(*) > 3) x),
            0::bigint, '0011: ninguna tarjeta queda con más de 3 etiquetas');
SELECT t.ok((SELECT count(*) = 4 AND bool_and(c.deleted_at IS NOT NULL
                    AND c.updated_seq > (SELECT max(updated_seq) FROM t.antes))
               FROM public.card_label c JOIN t.antes a USING (id)
              WHERE a.deleted_at IS NULL AND c IS DISTINCT FROM a),
            '0011: solo las 4 sobrantes cambian: eliminadas y con un updated_seq nuevo');
SELECT t.eq((SELECT count(*) FROM public.card_label c JOIN t.antes a USING (id)
              WHERE a.card_id IN (t.id('c3'), t.id('c1'), t.id('borrada')) AND c IS NOT DISTINCT FROM a),
            8::bigint, '0011: las tarjetas con 3 o menos no se tocan, ni las asignaciones ya eliminadas');
SELECT t.eq((SELECT count(*) FROM public.card_label), (SELECT count(*) FROM t.antes), '0011: no borra filas');

-- La función redefinida conserva sus permisos y su configuración.
SELECT t.ok((SELECT p.prosecdef AND 'search_path=public, pg_temp' = ANY (p.proconfig) AND 'TimeZone=UTC' = ANY (p.proconfig)
               FROM pg_proc p WHERE p.oid = 'public._sync_apply_change(uuid,jsonb,bigint,timestamptz)'::regprocedure),
            '0011: _sync_apply_change sigue con SECURITY DEFINER, search_path fijo y UTC');
SELECT t.ok(NOT has_function_privilege('authenticated', 'public._sync_apply_change(uuid,jsonb,bigint,timestamptz)', 'EXECUTE')
            AND NOT has_function_privilege('anon', 'public._sync_apply_change(uuid,jsonb,bigint,timestamptz)', 'EXECUTE'),
            '0011: _sync_apply_change sigue sin poder llamarse desde el cliente');

-- La descarga entrega las sobrantes como eliminadas a quien ya había descargado todo.
SELECT set_config('request.jwt.claim.sub', t.id('ana')::text, false);
SELECT t.eq((SELECT array_agg(f ->> 'entity_id' ORDER BY f ->> 'entity_id')
               FROM jsonb_array_elements(public.sync_pull((SELECT max(updated_seq) FROM t.antes), 500) -> 'rows') f
              WHERE f ->> 'entity_kind' = 'card_label' AND f ->> 'deleted_at' IS NOT NULL),
            (SELECT array_agg(id::text ORDER BY id::text)
               FROM unnest(ARRAY[t.id('c5', 1), t.id('c5', 3), t.id('empate', 4)]) id),
            '0011: sync_pull entrega las sobrantes como eliminadas');

-- R7 después de 0011: el máximo es 3.
CREATE FUNCTION t.asignar(p_cid integer, p_card text, p_label integer, p_at timestamptz) RETURNS jsonb LANGUAGE sql AS $$
  SELECT public.sync_push(t.id('equipo'), 0, jsonb_build_array(jsonb_build_object(
    'change_id', p_cid, 'entity_kind', 'card_label', 'entity_id', t.id(p_card, p_label), 'op', 'upsert',
    'modified_at', to_char(p_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'fields', jsonb_build_object(
      'card_id', jsonb_build_object('value', t.id(p_card), 'modified_at', to_char(p_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      'label_id', jsonb_build_object('value', t.id('lab-ana', p_label), 'modified_at', to_char(p_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    )))) -> 'results' -> 0
$$;

CREATE TABLE t.r AS SELECT t.asignar(1, 'c3', 4, now() - interval '1 minute') AS r;
SELECT t.eq((SELECT r ->> 'status' FROM t.r), 'deleted', 'R7: la 4.ª etiqueta, la más reciente, queda eliminada (no se rechaza)');
SELECT t.eq((SELECT (r ->> 'conflict')::boolean FROM t.r), true, 'R7: se marca conflict = true');
SELECT t.eq(t.vivas('c3'), ARRAY[t.id('c3', 1), t.id('c3', 2), t.id('c3', 3)], 'R7: quedan 3 vivas');
-- Una asignación hecha antes que las que hay (otro computador sin conexión) se conserva y sale la más reciente.
DELETE FROM t.r;
INSERT INTO t.r SELECT t.asignar(2, 'c3', 5, '2026-10-31T00:00:00Z');
SELECT t.eq((SELECT r ->> 'status' FROM t.r), 'applied', 'R7: la más antigua se conserva');
SELECT t.eq(t.vivas('c3'), ARRAY[t.id('c3', 1), t.id('c3', 2), t.id('c3', 5)], 'R7: se conservan las 3 más antiguas');
-- Repetir una asignación sobrante no la revive ni se rechaza.
DELETE FROM t.r;
INSERT INTO t.r SELECT t.asignar(3, 'c5', 1, '2026-11-01T00:50:00Z');
SELECT t.eq((SELECT r ->> 'status' FROM t.r), 'deleted', 'R7: reenviar una sobrante la deja eliminada');
SELECT t.eq(cardinality(t.vivas('c5')), 3, 'R7: la tarjeta recortada sigue con 3');
