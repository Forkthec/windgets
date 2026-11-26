-- ============================================================================
-- Windgets · pruebas_carrera_recorte.sql
-- Datos y ayudas para probar 0011 y 0012 (docs/rediseno.md RD-96) mientras hay sync_push en curso. ejecutar_pruebas.sh
-- la corre en una base con 0001 a 0010 y seed.sql, y después abre las sesiones simultáneas.
-- Una cuenta con tres tarjetas: 'espera' y 'tibia' tienen 3 etiquetas; 'otra' no tiene ninguna.
-- ============================================================================
\set ON_ERROR_STOP on

CREATE SCHEMA t;

CREATE FUNCTION t.id(p_grupo text, p_n integer DEFAULT 0) RETURNS uuid LANGUAGE sql IMMUTABLE AS
$$ SELECT (substr(md5(p_grupo), 1, 8) || '-0000-0000-0000-' || lpad(p_n::text, 12, '0'))::uuid $$;

INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
  (t.id('ana'), 'ana@example.com', now(), '{"alias":"Ana"}');
INSERT INTO public.label (id, user_id, name, color_id)
SELECT t.id('lab', n), t.id('ana'), 'Etq ' || n, 'blue' FROM generate_series(1, 6) n;
INSERT INTO public.card (id, user_id, title, due_date, position, column_id)
SELECT t.id(c), t.id('ana'), c, '2026-12-01', 1, k.id
  FROM public.kanban_column k, unnest(ARRAY['espera', 'tibia', 'otra']) c
 WHERE k.user_id = t.id('ana') AND k.role = 'todo';
INSERT INTO public.card_label (id, user_id, created_at, card_id, label_id)
SELECT t.id(c, n), t.id('ana'), '2026-11-01T00:00:00Z'::timestamptz + n * interval '1 minute', t.id(c), t.id('lab', n)
  FROM unnest(ARRAY['espera', 'tibia']) c, generate_series(1, 3) n;

-- sync_push que asigna la etiqueta n a la tarjeta; devuelve el estado del resultado.
CREATE FUNCTION t.asignar(p_card text, n integer) RETURNS text LANGUAGE plpgsql AS $$
DECLARE m text := '2026-11-03T00:00:00.000Z';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', t.id('ana')::text, false);
  RETURN public.sync_push(t.id('equipo'), 0, jsonb_build_array(jsonb_build_object(
    'change_id', n, 'entity_kind', 'card_label', 'entity_id', t.id(p_card, n), 'op', 'upsert', 'modified_at', m,
    'fields', jsonb_build_object(
      'card_id', jsonb_build_object('value', t.id(p_card), 'modified_at', m),
      'label_id', jsonb_build_object('value', t.id('lab', n), 'modified_at', m))))) -> 'results' -> 0 ->> 'status';
END $$;

-- Espera (hasta 15 s) a que exista un candado que cumpla la condición sobre pg_locks.
CREATE FUNCTION t.esperar(p_condicion text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_hay boolean;
BEGIN
  FOR i IN 1..300 LOOP
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM pg_locks WHERE ' || p_condicion || ')' INTO v_hay;
    IF v_hay THEN RETURN; END IF;
    PERFORM pg_sleep(0.05);
  END LOOP;
  RAISE EXCEPTION 'FALLO: no apareció el candado %', p_condicion;
END $$;
