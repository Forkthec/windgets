-- ============================================================================
-- Windgets · pruebas.sql
-- Pruebas del esquema de Supabase (PostgreSQL) sobre las migraciones reales:
--   1. Cuentas y semilla por cuenta     2. RLS (dos usuarios)     3. CHECK y límites
--   4. sync_push / sync_pull (D-048 por campo)     5. Catálogos, Storage y mantenimiento
-- Cualquier fallo lanza una excepción 'FALLO: ...' y detiene el script.
-- ============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\o /dev/null
SET client_min_messages = notice;

-- ---------------------------------------------------------------- ayudantes
DROP SCHEMA IF EXISTS t CASCADE;
CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO anon, authenticated;
CREATE TABLE t.clock AS SELECT date_trunc('second', now() - interval '2 hours') AS base;
CREATE TABLE t.ids (name text PRIMARY KEY, id uuid NOT NULL);
GRANT SELECT ON t.clock TO PUBLIC;

CREATE FUNCTION t.id(p_name text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v uuid;
BEGIN
  INSERT INTO t.ids VALUES (p_name, gen_random_uuid()) ON CONFLICT DO NOTHING;
  SELECT id INTO v FROM t.ids WHERE name = p_name;
  RETURN v;
END $$;

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

-- Ejecuta p_sql y exige que falle con ese SQLSTATE o con un mensaje que lo contenga.
CREATE FUNCTION t.throws(p_sql text, p_expect text, p_msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = p_expect OR SQLERRM ILIKE '%' || p_expect || '%' THEN
      RAISE NOTICE 'ok   - % [%]', p_msg, p_expect; RETURN;
    END IF;
    RAISE EXCEPTION 'FALLO: % (error distinto: % / %)', p_msg, SQLSTATE, SQLERRM;
  END;
  RAISE EXCEPTION 'FALLO: % (no falló)', p_msg;
END $$;

CREATE FUNCTION t.login(p_uid uuid) RETURNS void LANGUAGE sql AS
$$ SELECT set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), false) $$;

-- Instante de prueba: base + n segundos (la base es «ahora − 2 h»)
CREATE FUNCTION t.ts(n integer) RETURNS text LANGUAGE sql STABLE AS
$$ SELECT to_char(((SELECT base FROM t.clock) + n * interval '1 second') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') $$;

-- {campo: {value, modified_at}}
CREATE FUNCTION t.f(p_name text, p_val jsonb, p_at integer) RETURNS jsonb LANGUAGE sql STABLE AS
$$ SELECT jsonb_build_object(p_name, jsonb_build_object('value', p_val, 'modified_at', t.ts(p_at))) $$;

CREATE FUNCTION t.chg(p_cid integer, p_kind text, p_eid uuid, p_op text, p_at integer, p_fields jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE sql STABLE AS
$$ SELECT jsonb_build_object('change_id', p_cid, 'entity_kind', p_kind, 'entity_id', p_eid, 'op', p_op,
                             'modified_at', t.ts(p_at), 'fields', p_fields) $$;

-- Envía un lote y devuelve la respuesta completa
CREATE FUNCTION t.push(p_dev uuid, p_off bigint, p_changes jsonb[]) RETURNS jsonb LANGUAGE sql AS
$$ SELECT public.sync_push(p_dev, p_off, to_jsonb(p_changes)) $$;

-- Resultado del cambio p_cid dentro de una respuesta
CREATE FUNCTION t.res(p_resp jsonb, p_cid integer) RETURNS jsonb LANGUAGE sql IMMUTABLE AS
$$ SELECT e FROM jsonb_array_elements(p_resp->'results') e WHERE (e->>'change_id')::int = p_cid $$;

-- Un solo cambio, devolviendo su resultado
CREATE FUNCTION t.push1(p_dev uuid, p_off bigint, p_change jsonb) RETURNS jsonb LANGUAGE sql AS
$$ SELECT e FROM jsonb_array_elements(public.sync_push(p_dev, p_off, jsonb_build_array(p_change))->'results') e LIMIT 1 $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO PUBLIC;
GRANT SELECT, INSERT ON t.ids TO PUBLIC;

\echo ''
\echo '== 1. Cuentas y semilla por cuenta (11.2)'
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
  (t.id('A'), 'ana@example.com',  now(), '{"alias":"  Ana  "}'),
  (t.id('B'), 'beto@example.com', now(), '{"alias":"Beto"}'),
  (t.id('C'), 'cami@example.com', now(), '{"alias":"Cami"}');
-- Google: nombre largo recortado a 30 caracteres
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data) VALUES
  (t.id('G'), 'gina@example.com', now(),
   '{"full_name":"Gina Maria de los Angeles Fernandez Lopez"}', '{"provider":"google"}');
-- Google sin nombre: parte del correo anterior a la @
INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data) VALUES
  (t.id('G2'), 'sin.nombre@example.com', now(), '{"provider":"google"}');
-- Cuenta sin verificar: no existe para la aplicación hasta que el código es correcto
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES (t.id('U'), 'pendiente@example.com', '{"alias":"Pen"}');

DO $$
DECLARE u text;
BEGIN
  FOREACH u IN ARRAY ARRAY['A','B','C'] LOOP
    PERFORM t.eq((SELECT count(*) FROM profile WHERE user_id = t.id(u)), 1::bigint, 'semilla ' || u || ': 1 profile');
    PERFORM t.eq((SELECT count(*) FROM user_preference WHERE user_id = t.id(u) AND id = user_id AND board_card_view = 'compact'), 1::bigint, 'semilla ' || u || ': preferencias (vista compacta)');
    PERFORM t.eq((SELECT array_agg(name ORDER BY position) FROM kanban_column WHERE user_id = t.id(u)),
                 ARRAY['Por hacer','En progreso','Hecho'], 'semilla ' || u || ': 3 columnas por defecto en orden');
    PERFORM t.eq((SELECT array_agg(role ORDER BY position) FROM kanban_column WHERE user_id = t.id(u)),
                 ARRAY['todo','in_progress','done'], 'semilla ' || u || ': funciones de las columnas');
    PERFORM t.eq((SELECT count(*) FROM theme WHERE user_id = t.id(u) AND name = 'Mi tema'), 1::bigint, 'semilla ' || u || ': tema «Mi tema»');
    PERFORM t.eq((SELECT count(*) FROM applied_theme a JOIN theme th ON th.id = a.theme_id WHERE a.user_id = t.id(u) AND th.name = 'Mi tema' AND a.id = a.user_id), 1::bigint, 'semilla ' || u || ': tema aplicado');
    PERFORM t.eq((SELECT array_agg(type ORDER BY type) FROM widget WHERE user_id = t.id(u) AND is_default),
                 ARRAY['calendar','clock','daily_tasks','kanban'], 'semilla ' || u || ': 4 widgets por defecto');
    PERFORM t.eq((SELECT count(*) FROM theme_widget WHERE user_id = t.id(u) AND is_active), 4::bigint, 'semilla ' || u || ': 4 widgets del tema activos');
    PERFORM t.eq((SELECT count(*) FROM card WHERE user_id = t.id(u)) + (SELECT count(*) FROM label WHERE user_id = t.id(u))
                 + (SELECT count(*) FROM uploaded_image WHERE user_id = t.id(u)), 0::bigint, 'semilla ' || u || ': sin tarjetas, etiquetas ni imágenes');
  END LOOP;
  PERFORM t.eq((SELECT alias FROM profile WHERE user_id = t.id('A')), 'Ana', 'alias del registro con correo, sin espacios de los extremos');
  PERFORM t.eq((SELECT alias FROM profile WHERE user_id = t.id('G')), 'Gina Maria de los Angeles Fern', 'alias de Google recortado a 30 caracteres');
  PERFORM t.eq((SELECT auth_provider FROM profile WHERE user_id = t.id('G')), 'google', 'proveedor google');
  PERFORM t.eq((SELECT alias FROM profile WHERE user_id = t.id('G2')), 'sin.nombre', 'alias de Google sin nombre = parte del correo');
  PERFORM t.eq((SELECT count(*) FROM profile WHERE user_id = t.id('U')), 0::bigint, 'cuenta sin verificar: sin profile ni semilla');
  PERFORM t.eq((SELECT count(*) FROM kanban_column WHERE user_id = t.id('U')), 0::bigint, 'cuenta sin verificar: sin columnas');
END $$;

-- Al verificar el código, se crea la semilla (y solo una vez)
UPDATE auth.users SET email_confirmed_at = now() WHERE id = t.id('U');
UPDATE auth.users SET email_confirmed_at = now() + interval '1 second' WHERE id = t.id('U');
SELECT t.eq((SELECT count(*) FROM profile WHERE user_id = t.id('U')), 1::bigint, 'al verificar: se crea el profile');
SELECT t.eq((SELECT count(*) FROM kanban_column WHERE user_id = t.id('U')), 3::bigint, 'al verificar: 3 columnas y sin duplicados al reconfirmar');
SELECT t.throws($$INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), repeat('a', 60) || '@x.co')$$,
                'email_too_long', 'correo de más de 64 caracteres rechazado');

\echo ''
\echo '== 2. RLS: cada usuario solo ve lo suyo'
-- ---------------------------------------------------------------------------
-- Datos de A y de B creados con sync_push (la única vía de escritura)
SET ROLE authenticated;
SELECT t.login(t.id('A'));
SELECT t.push1(t.id('devA'), 0, t.chg(1, 'label', t.id('A_label'), 'upsert', 10,
   t.f('name', '"Trabajo"', 10) || t.f('color_id', '"red"', 10)));
SELECT t.push1(t.id('devA'), 0, t.chg(2, 'card', t.id('A_card'), 'upsert', 11,
   t.f('title', '"Tarjeta de Ana"', 11) || t.f('due_date', '"2026-12-01"', 11) || t.f('position', '1', 11)
   || t.f('column_id', to_jsonb((SELECT id FROM kanban_column WHERE role = 'todo')), 11)));
SELECT t.login(t.id('B'));
SELECT t.push1(t.id('devB'), 0, t.chg(1, 'label', t.id('B_label'), 'upsert', 10,
   t.f('name', '"Casa"', 10) || t.f('color_id', '"blue"', 10)));
SELECT t.push1(t.id('devB'), 0, t.chg(2, 'card', t.id('B_card'), 'upsert', 11,
   t.f('title', '"Tarjeta de Beto"', 11) || t.f('due_date', '"2026-12-02"', 11) || t.f('position', '1', 11)
   || t.f('column_id', to_jsonb((SELECT id FROM kanban_column WHERE role = 'todo')), 11)));
RESET ROLE;

SET ROLE authenticated;
SELECT t.login(t.id('A'));
DO $$
DECLARE r jsonb; n int;
BEGIN
  PERFORM t.eq((SELECT count(*) FROM card), 1::bigint, 'A: select directo en card solo devuelve su tarjeta');
  PERFORM t.eq((SELECT title FROM card), 'Tarjeta de Ana', 'A: la tarjeta es la suya');
  PERFORM t.eq((SELECT count(*) FROM card WHERE id = t.id('B_card')), 0::bigint, 'A: la tarjeta de B no aparece ni por id');
  PERFORM t.eq((SELECT count(*) FROM label), 1::bigint, 'A: solo su etiqueta');
  PERFORM t.eq((SELECT count(*) FROM kanban_column), 3::bigint, 'A: solo sus 3 columnas');
  PERFORM t.eq((SELECT count(*) FROM profile), 1::bigint, 'A: solo su profile');
  PERFORM t.eq((SELECT count(*) FROM widget), 4::bigint, 'A: solo sus 4 widgets');
  PERFORM t.eq((SELECT count(*) FROM theme) + (SELECT count(*) FROM applied_theme) + (SELECT count(*) FROM theme_widget)
               + (SELECT count(*) FROM user_preference), 7::bigint, 'A: temas, tema aplicado, widgets del tema y preferencias, solo los suyos');
  -- sync_pull también respeta la RLS
  r := public.sync_pull(0, 500);
  PERFORM t.eq(jsonb_array_length(r->'rows'), 17, 'A: sync_pull(0) devuelve 17 filas propias (profile, preferencias, 3 columnas, tema, tema aplicado, 4 widgets, 4 widgets del tema, etiqueta, tarjeta)');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM jsonb_array_elements(r->'rows') e WHERE e->>'entity_id' IN (t.id('B_card')::text, t.id('B_label')::text, t.id('B')::text)),
               'A: sync_pull no contiene filas de B');
  -- Escritura directa: prohibida (solo sync_push escribe)
  PERFORM t.throws(format($q$INSERT INTO public.label (id, user_id, name, color_id) VALUES (gen_random_uuid(), %L, 'X', 'red')$q$, t.id('A')), '42501', 'A: INSERT directo en label denegado');
  PERFORM t.throws($q$UPDATE public.card SET title = 'hack'$q$, '42501', 'A: UPDATE directo en card denegado');
  PERFORM t.throws($q$DELETE FROM public.card$q$, '42501', 'A: DELETE directo en card denegado');
  PERFORM t.throws($q$UPDATE public.profile SET alias = 'otro'$q$, '42501', 'A: el alias no se cambia (sin UPDATE en profile)');
  PERFORM t.throws($q$SELECT * FROM public.external_cache$q$, '42501', 'A: external_cache sin acceso');
  -- Catálogos: lectura sí, escritura no
  PERFORM t.ok((SELECT count(*) FROM catalog_color) >= 9, 'A: lee el catálogo de colores');
  PERFORM t.throws($q$INSERT INTO public.catalog_color (id, name, hex) VALUES ('x','X','#000000')$q$, '42501', 'A: no escribe catálogos');
  -- sync_push con el id de una entidad de B
  r := t.push1(t.id('devA'), 0, t.chg(9, 'card', t.id('B_card'), 'upsert', 500, t.f('title', '"ROBADA"', 500)));
  PERFORM t.eq(r->>'status', 'rejected', 'A: modificar la tarjeta de B -> rejected');
  PERFORM t.eq(r->>'reason', 'not_owner', 'A: motivo not_owner');
  r := t.push1(t.id('devA'), 0, t.chg(10, 'card', t.id('B_card'), 'delete', 501));
  PERFORM t.eq(r->>'reason', 'not_owner', 'A: eliminar la tarjeta de B -> not_owner');
  -- user_id enviado por el cliente: campo no permitido
  r := t.push1(t.id('devA'), 0, t.chg(11, 'label', gen_random_uuid(), 'upsert', 502,
         t.f('name', '"Intruso"', 502) || t.f('color_id', '"red"', 502) || t.f('user_id', to_jsonb(t.id('B')::text), 502)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'A: no se acepta user_id del cliente');
END $$;
RESET ROLE;
-- Comprobación como superusuario: B no cambió
SELECT t.eq((SELECT title FROM card WHERE id = t.id('B_card')), 'Tarjeta de Beto', 'la tarjeta de B sigue intacta');
SELECT t.eq((SELECT deleted_at IS NULL FROM card WHERE id = t.id('B_card')), true, 'la tarjeta de B sigue viva');

SET ROLE authenticated;
SELECT t.login(t.id('B'));
DO $$
BEGIN
  PERFORM t.eq((SELECT count(*) FROM card), 1::bigint, 'B: solo su tarjeta');
  PERFORM t.eq((SELECT count(*) FROM card WHERE id = t.id('A_card')), 0::bigint, 'B: la tarjeta de A no aparece');
  PERFORM t.eq((SELECT count(*) FROM label WHERE id = t.id('A_label')), 0::bigint, 'B: la etiqueta de A no aparece');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM jsonb_array_elements(public.sync_pull(0, 500)->'rows') e
                           WHERE e->>'entity_id' IN (t.id('A_card')::text, t.id('A_label')::text, t.id('A')::text)),
               'B: sync_pull no contiene filas de A');
END $$;
RESET ROLE;

-- anon: sin acceso a ninguna tabla ni RPC de usuario
SET ROLE anon;
SELECT t.login(NULL);
DO $$
BEGIN
  PERFORM t.throws($q$SELECT count(*) FROM public.card$q$, '42501', 'anon: sin acceso a card');
  PERFORM t.throws($q$SELECT count(*) FROM public.catalog_color$q$, '42501', 'anon: sin acceso a catálogos');
  PERFORM t.throws($q$SELECT public.sync_pull(0, 10)$q$, '42501', 'anon: sin acceso a sync_pull');
  PERFORM t.throws($q$SELECT public.sync_push(gen_random_uuid(), 0, '[]')$q$, '42501', 'anon: sin acceso a sync_push');
  PERFORM t.ok((public.keepalive()->>'ok')::boolean, 'anon: keepalive() funciona (D-197)');
  PERFORM t.eq(public.email_is_registered('ana@example.com'), true, 'anon: email_is_registered(correo verificado) = true');
  PERFORM t.eq(public.email_is_registered('desconocido@example.com'), false, 'anon: email_is_registered(correo nuevo) = false');
END $$;
RESET ROLE;
SET ROLE authenticated;
SELECT t.login(NULL);
SELECT t.throws($q$SELECT public.sync_push(gen_random_uuid(), 0, '[]')$q$, 'unauthorized', 'sin sesión (auth.uid() nulo): sync_push -> unauthorized');
SELECT t.throws($q$SELECT public.sync_pull(0, 10)$q$, 'unauthorized', 'sin sesión: sync_pull -> unauthorized');
RESET ROLE;
SELECT t.eq(public.email_is_registered('pendiente@example.com'), true, 'email_is_registered: tras verificar, el correo cuenta como registrado');
SELECT t.throws($q$SELECT public.email_is_registered('x')$q$, 'invalid_email', 'email_is_registered: correo inválido');

\echo ''
\echo '== 2b. RLS en Storage (D-180, RNF-21)'
-- ---------------------------------------------------------------------------
SET ROLE authenticated;
SELECT t.login(t.id('A'));
DO $$
DECLARE
  a text := t.id('A')::text; b text := t.id('B')::text; f text := gen_random_uuid()::text;
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('user-images', a || '/' || f || '.png', t.id('A'));
  PERFORM t.ok(true, 'A: sube una imagen a su carpeta');
  PERFORM t.throws(format($q$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('user-images', %L, %L)$q$, b || '/' || f || '.png', t.id('A')),
                   '42501', 'A: no puede subir a la carpeta de B');
  PERFORM t.throws(format($q$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('user-images', %L, %L)$q$, a || '/foto.gif', t.id('A')),
                   '42501', 'A: nombre/extensión fuera de {id}.{jpg|jpeg|png} rechazado');
  PERFORM t.throws($q$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('catalog', 'images/x.png', NULL)$q$,
                   '42501', 'A: no escribe en el bucket catalog');
  PERFORM t.eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-images'), 1::bigint, 'A: ve solo su imagen');
END $$;
RESET ROLE;
-- Un objeto de B y uno del catálogo (los sube el equipo con la clave de servicio)
INSERT INTO storage.objects (bucket_id, name, owner) VALUES
  ('user-images', t.id('B') || '/' || gen_random_uuid() || '.jpg', t.id('B')),
  ('catalog', 'images/ejemplo.png', NULL);
SET ROLE authenticated;
SELECT t.login(t.id('A'));
DO $$
DECLARE n integer;
BEGIN
  PERFORM t.eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-images'), 1::bigint, 'A: no ve la imagen de B');
  PERFORM t.eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'catalog'), 1::bigint, 'A: lee el bucket catalog');
  DELETE FROM storage.objects WHERE bucket_id = 'user-images' AND name LIKE t.id('B') || '/%';
  PERFORM t.eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-images' AND name LIKE t.id('B') || '/%'), 0::bigint, 'A: DELETE sobre la imagen de B no afecta ninguna fila visible');
  UPDATE storage.objects SET name = name || 'x' WHERE bucket_id = 'user-images';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.eq(n, 0, 'A: sin política de UPDATE en storage.objects (0 filas afectadas)');
END $$;
SELECT t.login(t.id('B'));
SELECT t.eq((SELECT count(*) FROM storage.objects WHERE bucket_id = 'user-images'), 1::bigint, 'B: su imagen sigue ahí (A no pudo borrarla)');
RESET ROLE;
SELECT t.eq((SELECT file_size_limit FROM storage.buckets WHERE id = 'user-images'), 20971520::bigint, 'bucket user-images: límite de 20 MB');
SELECT t.eq((SELECT allowed_mime_types FROM storage.buckets WHERE id = 'user-images'), ARRAY['image/jpeg','image/png'], 'bucket user-images: solo JPG y PNG');
SELECT t.eq((SELECT public FROM storage.buckets WHERE id = 'catalog'), false, 'bucket catalog: privado');

\echo ''
\echo '== 2c. Estructura de seguridad'
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM t.eq((SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT (c.relrowsecurity AND c.relforcerowsecurity)),
               0::bigint, 'todas las tablas de public tienen RLS activado y forzado');
  PERFORM t.eq((SELECT count(*) FROM information_schema.role_table_grants
                 WHERE table_schema = 'public' AND grantee = 'anon'), 0::bigint, 'anon no tiene permisos sobre ninguna tabla');
  PERFORM t.eq((SELECT count(*) FROM information_schema.role_table_grants
                 WHERE table_schema = 'public' AND grantee = 'authenticated' AND privilege_type <> 'SELECT'),
               0::bigint, 'authenticated solo tiene SELECT (la escritura es solo por sync_push)');
  PERFORM t.eq((SELECT count(*) FROM pg_policies WHERE schemaname = 'public'), 19::bigint, '19 políticas en public');
  PERFORM t.eq((SELECT count(*) FROM pg_policies WHERE schemaname = 'storage'), 4::bigint, '4 políticas en storage');
  PERFORM t.eq((SELECT count(*) FROM pg_policies WHERE tablename = 'external_cache'), 0::bigint, 'external_cache sin políticas');
  PERFORM t.eq(has_function_privilege('authenticated', 'public._sync_apply_change(uuid,jsonb,bigint,timestamptz)', 'EXECUTE'), false,
               'authenticated no ejecuta las funciones internas');
  PERFORM t.eq(has_function_privilege('anon', 'public.purge_tombstones()', 'EXECUTE'), false, 'anon no ejecuta purge_tombstones');
END $$;

\echo ''
\echo '== 3. CHECK, UNIQUE y límites (usuario C, escritura directa como servicio)'
-- ---------------------------------------------------------------------------
CREATE FUNCTION t.ins(p_table text, p_row jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_cols text;
BEGIN
  SELECT string_agg(quote_ident(k), ', ') INTO v_cols FROM jsonb_object_keys(p_row) k;
  EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)', p_table, v_cols, v_cols, p_table) USING p_row;
END $$;
CREATE FUNCTION t.fails(p_table text, p_row jsonb, p_expect text, p_msg text) RETURNS void LANGUAGE sql AS
$$ SELECT t.throws(format('SELECT t.ins(%L, %L::jsonb)', p_table, p_row::text), p_expect, p_msg) $$;
CREATE FUNCTION t.r(p_user uuid, p_row jsonb) RETURNS jsonb LANGUAGE sql AS
$$ SELECT p_row || jsonb_build_object('id', gen_random_uuid(), 'user_id', p_user) $$;

DO $$
DECLARE
  c uuid := t.id('C'); todo uuid; done_c uuid; thm uuid; i integer;
  card_b jsonb; w_b jsonb;
BEGIN
  SELECT id INTO todo   FROM kanban_column WHERE user_id = c AND role = 'todo';
  SELECT id INTO done_c FROM kanban_column WHERE user_id = c AND role = 'done';
  SELECT id INTO thm    FROM theme WHERE user_id = c;
  card_b := jsonb_build_object('title','ok','due_date','2026-12-01','column_id',todo,'position',1);

  -- Tarjeta (HE-07-HU01-ET05..ET11)
  PERFORM t.ins('card', t.r(c, card_b || jsonb_build_object('title', repeat('ñ', 100), 'description', repeat('d', 1000))));
  PERFORM t.ok(true, 'tarjeta: título de 100 caracteres (con ñ, 200 bytes) y descripción de 1000: válidas (se cuenta en caracteres)');
  PERFORM t.fails('card', t.r(c, card_b || '{"title":""}'), '23514', 'tarjeta: título vacío rechazado');
  PERFORM t.fails('card', t.r(c, card_b || '{"title":"      "}'), '23514', 'tarjeta: título solo de espacios rechazado');
  PERFORM t.fails('card', t.r(c, card_b || jsonb_build_object('title', repeat('x', 101))), '23514', 'tarjeta: título de 101 caracteres rechazado');
  PERFORM t.fails('card', t.r(c, card_b || jsonb_build_object('description', repeat('d', 1001))), '23514', 'tarjeta: descripción de 1001 caracteres rechazada');
  PERFORM t.fails('card', t.r(c, card_b || '{"priority":"urgent"}'), '23514', 'tarjeta: prioridad fuera de Alta/Media/Baja rechazada');
  PERFORM t.fails('card', t.r(c, card_b || '{"type":"nota"}'), '23514', 'tarjeta: tipo fuera de Tarea/Recordatorio/Evento rechazado');
  PERFORM t.fails('card', t.r(c, card_b || '{"scheduled_date":"2026-12-01","scheduled_hour":24}'), '23514', 'tarjeta: bloque horario 24 rechazado');
  PERFORM t.fails('card', t.r(c, card_b || '{"scheduled_date":"2026-12-01"}'), '23514', 'tarjeta: fecha de bloque sin hora rechazada');
  PERFORM t.fails('card', t.r(c, card_b || '{"scheduled_date":"2026-12-02","scheduled_hour":9}'), '23514', 'tarjeta: bloque posterior a la fecha límite rechazado');
  PERFORM t.fails('card', t.r(c, card_b - 'due_date'), '23502', 'tarjeta: fecha límite obligatoria');
  PERFORM t.ins('card', t.r(c, card_b || '{"scheduled_date":"2026-12-01","scheduled_hour":23,"priority":"low","type":"event"}'));
  PERFORM t.ok(true, 'tarjeta: bloque 23:00 el mismo día de la fecha límite: válido');

  -- Columna (HE-09-HU03-ET03..ET07)
  PERFORM t.fails('kanban_column', t.r(c, '{"name":"","color_id":"gray","position":9}'), '23514', 'columna: nombre vacío rechazado');
  PERFORM t.fails('kanban_column', t.r(c, jsonb_build_object('name', repeat('c', 31), 'color_id','gray','position',9)), '23514', 'columna: nombre de 31 caracteres rechazado');
  PERFORM t.fails('kanban_column', t.r(c, '{"name":"  por HACER ","color_id":"gray","position":9}'), '23505', 'columna: nombre repetido sin distinguir mayúsculas ni espacios rechazado');
  PERFORM t.fails('kanban_column', t.r(c, '{"name":"Otra","color_id":"gray","position":9,"role":"todo"}'), '23505', 'columna: segunda función «todo» rechazada');
  PERFORM t.fails('kanban_column', t.r(c, '{"name":"Otra","color_id":"nope","position":9}'), '23503', 'columna: color fuera del catálogo rechazado');
  PERFORM t.fails('kanban_column', t.r(c, '{"name":"Otra","color_id":"gray","position":9,"role":"extra"}'), '23514', 'columna: función desconocida rechazada');
  FOR i IN 1..7 LOOP
    PERFORM t.ins('kanban_column', t.r(c, jsonb_build_object('name', 'Col ' || i, 'color_id', 'gray', 'position', 10 + i)));
  END LOOP;
  PERFORM t.eq((SELECT count(*) FROM kanban_column WHERE user_id = c AND deleted_at IS NULL), 10::bigint, 'columna: 10 columnas vivas (las 3 por defecto cuentan)');
  PERFORM t.fails('kanban_column', t.r(c, '{"name":"Col 11","color_id":"gray","position":99}'), 'limit_columns', 'columna: la 11.ª se rechaza (máximo 10)');
  UPDATE kanban_column SET deleted_at = now() WHERE user_id = c AND name = 'Col 7';
  PERFORM t.ins('kanban_column', t.r(c, '{"name":"Col 7","color_id":"gray","position":99}'));
  PERFORM t.ok(true, 'columna: al eliminar una, se puede crear otra (las eliminadas no cuentan) y reutilizar su nombre');
  PERFORM t.throws(format($q$UPDATE kanban_column SET deleted_at = now() WHERE id = %L$q$, done_c), 'invalid_field', 'columna: «Hecho» (función done) no se elimina');
  PERFORM t.throws(format($q$UPDATE kanban_column SET role = 'custom' WHERE id = %L$q$, done_c), 'invalid_field', 'columna: la función no cambia al renombrar o editar');

  -- Etiqueta (HE-08-HU02-ET03..ET06)
  PERFORM t.ins('label', t.r(c, '{"name":"Trabajo","color_id":"red"}'));
  PERFORM t.fails('label', t.r(c, '{"name":" TRABAJO","color_id":"red"}'), '23505', 'etiqueta: nombre repetido sin distinguir mayúsculas rechazado');
  PERFORM t.fails('label', t.r(c, '{"name":"","color_id":"red"}'), '23514', 'etiqueta: nombre vacío rechazado');
  PERFORM t.fails('label', t.r(c, jsonb_build_object('name', repeat('e', 31), 'color_id','red')), '23514', 'etiqueta: nombre de 31 caracteres rechazado');
  PERFORM t.fails('label', t.r(c, '{"name":"SinColor"}'), '23502', 'etiqueta: el color es obligatorio (sin valor por defecto, D-162)');
  PERFORM t.fails('label', t.r(c, '{"name":"Rara","color_id":"nope"}'), '23503', 'etiqueta: color fuera del catálogo rechazado');
  FOR i IN 2..20 LOOP
    PERFORM t.ins('label', t.r(c, jsonb_build_object('name', 'Etiqueta ' || i, 'color_id', 'blue')));
  END LOOP;
  PERFORM t.fails('label', t.r(c, '{"name":"Etiqueta 21","color_id":"blue"}'), 'limit_labels', 'etiqueta: la 21.ª se rechaza (máximo 20)');

  -- Tema (HE-03-HU02-ET02..ET05; HE-02-HU05)
  w_b := jsonb_build_object('name','T','template_id','default','color_primary','#00D9E2','color_secondary','#DC026C','color_text','#FFFFFF','font_id','inter');
  PERFORM t.fails('theme', t.r(c, w_b || jsonb_build_object('name', repeat('t', 41))), '23514', 'tema: nombre de 41 caracteres rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"name":"mi TEMA"}'), '23505', 'tema: nombre repetido sin distinguir mayúsculas rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"color_primary":"#12345G"}'), '23514', 'tema: color con carácter no hexadecimal rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"color_text":"FFFFFF"}'), '23514', 'tema: color sin # rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"color_secondary":"#FFF"}'), '23514', 'tema: color de 3 dígitos rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"font_size":"huge"}'), '23514', 'tema: tamaño de fuente fuera de pequeño/mediano/grande rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"background_source":"own"}'), '23514', 'tema: fondo propio sin imagen rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"background_source":"catalog"}'), '23514', 'tema: fondo de catálogo sin imagen rechazado');
  PERFORM t.fails('theme', t.r(c, w_b || '{"font_id":"nope"}'), '23503', 'tema: tipografía fuera del catálogo rechazada');
  PERFORM t.ins('theme', t.r(c, w_b || '{"name":"minúsculas","color_primary":"#00d9e2"}'));
  PERFORM t.eq((SELECT color_primary::text FROM theme WHERE user_id = c AND name = 'minúsculas'), '#00D9E2', 'tema: el color se guarda en mayúsculas');
  FOR i IN 3..10 LOOP
    PERFORM t.ins('theme', t.r(c, w_b || jsonb_build_object('name', 'Tema ' || i)));
  END LOOP;
  PERFORM t.eq((SELECT count(*) FROM theme WHERE user_id = c AND deleted_at IS NULL), 10::bigint, 'tema: 10 temas vivos');
  PERFORM t.fails('theme', t.r(c, w_b || '{"name":"Tema 11"}'), 'limit_themes', 'tema: el 11.º se rechaza (máximo 10)');
  PERFORM t.throws(format($q$UPDATE theme SET deleted_at = now() WHERE id = %L$q$, thm), 'applied_theme', 'tema: el tema aplicado no se elimina');

  -- Widget (HE-04)
  PERFORM t.fails('widget', t.r(c, '{"type":"text","text_content":""}'), '23514', 'widget Texto: vacío rechazado');
  PERFORM t.fails('widget', t.r(c, jsonb_build_object('type','text','text_content', repeat('x', 201))), '23514', 'widget Texto: 201 caracteres rechazado');
  PERFORM t.ins('widget', t.r(c, jsonb_build_object('type','text','text_content', repeat('x', 200))));
  PERFORM t.ok(true, 'widget Texto: 200 caracteres válido (varios Texto permitidos: D-038)');
  PERFORM t.ins('widget', t.r(c, '{"type":"text","text_content":"otro"}'));
  PERFORM t.fails('widget', t.r(c, '{"type":"clock","is_default":true,"text_content":"x"}'), '23514', 'widget: campos de otro tipo rechazados');
  PERFORM t.fails('widget', t.r(c, '{"type":"clock","is_default":true}'), '23505', 'widget Reloj: segundo reloj rechazado (D-038)');
END $$;

DO $$
DECLARE
  c uuid := t.id('C'); i integer; thm uuid; wid uuid; car uuid; img uuid := gen_random_uuid(); tw jsonb;
BEGIN
  SELECT id INTO thm FROM theme WHERE user_id = c AND name = 'Mi tema';
  PERFORM t.ins('widget', t.r(c, '{"type":"news"}'));
  PERFORM t.fails('widget', t.r(c, '{"type":"news"}'), '23505', 'widget Noticias: una sola vez por usuario (D-038)');
  PERFORM t.ins('widget', t.r(c, '{"type":"music_player"}'));
  PERFORM t.fails('widget', t.r(c, '{"type":"music_player"}'), '23505', 'widget Reproductor de música: una sola vez (D-038)');
  PERFORM t.fails('widget', t.r(c, '{"type":"clock","is_default":false}'), '23514', 'widget: Reloj siempre es «por defecto»');
  PERFORM t.fails('widget', t.r(c, '{"type":"text","is_default":true,"text_content":"x"}'), '23514', 'widget: Texto nunca es «por defecto»');
  PERFORM t.fails('widget', t.r(c, '{"type":"hologram"}'), '23514', 'widget: tipo desconocido rechazado');
  -- Clima
  PERFORM t.ins('widget', t.r(c, '{"type":"weather","weather_city":"Popayán","weather_geo_id":"g-1","weather_latitude":2.44,"weather_longitude":-76.61}'));
  PERFORM t.fails('widget', t.r(c, '{"type":"weather","weather_city":"Popayán 2","weather_geo_id":"g-1","weather_latitude":2.44,"weather_longitude":-76.61}'), '23505', 'widget Clima: una ciudad solo una vez (HE-04-HU05-CA05)');
  PERFORM t.ins('widget', t.r(c, '{"type":"weather","weather_city":"Cali","weather_geo_id":"g-2","weather_latitude":3.45,"weather_longitude":-76.53}'));
  PERFORM t.fails('widget', t.r(c, '{"type":"weather","weather_city":"Bogotá","weather_geo_id":"g-3","weather_latitude":91,"weather_longitude":-74}'), '23514', 'widget Clima: latitud fuera de rango rechazada');
  PERFORM t.fails('widget', t.r(c, '{"type":"weather","weather_geo_id":"g-4","weather_latitude":1,"weather_longitude":1}'), '23514', 'widget Clima: la ciudad es obligatoria');
  PERFORM t.fails('widget', t.r(c, jsonb_build_object('type','weather','weather_city', repeat('c', 101),'weather_geo_id','g-5','weather_latitude',1,'weather_longitude',1)), '23514', 'widget Clima: ciudad de 101 caracteres rechazada');
  -- Carrusel
  PERFORM t.fails('widget', t.r(c, '{"type":"image_carousel","carousel_interval_seconds":2}'), '23514', 'carrusel: intervalo de 2 s rechazado (mínimo 3)');
  PERFORM t.fails('widget', t.r(c, '{"type":"image_carousel","carousel_interval_seconds":61}'), '23514', 'carrusel: intervalo de 61 s rechazado (máximo 60)');
  car := gen_random_uuid();
  PERFORM t.ins('widget', jsonb_build_object('id', car, 'user_id', c, 'type', 'image_carousel', 'carousel_interval_seconds', 3));
  PERFORM t.ins('widget', t.r(c, '{"type":"image_carousel","carousel_interval_seconds":60}'));
  PERFORM t.ins('widget', t.r(c, '{"type":"image_carousel"}'));
  PERFORM t.eq((SELECT carousel_interval_seconds FROM widget WHERE user_id = c AND type = 'image_carousel' AND carousel_interval_seconds NOT IN (3, 60)),
               5::smallint, 'carrusel: intervalo por defecto de 5 s');
  -- Imagen estática y animación
  PERFORM t.fails('widget', t.r(c, '{"type":"static_image","static_image_source":"own"}'), '23514', 'imagen estática: fuente propia sin imagen rechazada');
  PERFORM t.fails('widget', t.r(c, '{"type":"static_image"}'), '23514', 'imagen estática: sin fuente rechazada');
  PERFORM t.fails('widget', t.r(c, '{"type":"animation"}'), '23514', 'animación: sin animación elegida rechazada');
  -- Widgets por defecto no se eliminan
  PERFORM t.throws(format($q$UPDATE widget SET deleted_at = now() WHERE user_id = %L AND type = 'clock'$q$, c), 'invalid_field', 'widget por defecto: no se elimina (HE-04-HU13-ET04)');
  PERFORM t.throws(format($q$UPDATE widget SET type = 'text' WHERE user_id = %L AND type = 'news'$q$, c), 'invalid_field', 'widget: el tipo no cambia');

  -- Imagen propia (RNF-22, RNF-23)
  PERFORM t.ins('uploaded_image', jsonb_build_object('id', img, 'user_id', c, 'storage_path', c || '/' || img || '.png', 'mime_type', 'image/png',
              'extension', 'png', 'size_bytes', 20971520, 'width', 100, 'height', 100, 'sha256', repeat('a', 64)));
  PERFORM t.ok(true, 'imagen propia: 20 MB exactos (20 971 520 bytes) válidos');
  tw := jsonb_build_object('mime_type','image/jpeg','extension','jpg','size_bytes',1000,'width',10,'height',10,'sha256',repeat('b',64));
  PERFORM t.fails('uploaded_image', t.r(c, tw || jsonb_build_object('storage_path','x','size_bytes',20971521)), '23514', 'imagen propia: 20 MB + 1 byte rechazado');
  PERFORM t.fails('uploaded_image', t.r(c, tw || '{"storage_path":"x","size_bytes":0}'), '23514', 'imagen propia: 0 bytes rechazado');
  PERFORM t.fails('uploaded_image', t.r(c, tw || '{"storage_path":"x","mime_type":"image/gif","extension":"gif"}'), '23514', 'imagen propia: GIF rechazado');
  PERFORM t.fails('uploaded_image', t.r(c, tw || '{"storage_path":"x","mime_type":"image/png"}'), '23514', 'imagen propia: tipo MIME incoherente con la extensión rechazado');
  PERFORM t.fails('uploaded_image', t.r(c, tw || '{"storage_path":"x","sha256":"abc"}'), '23514', 'imagen propia: sha256 inválido rechazado');
  PERFORM t.fails('uploaded_image', t.r(c, tw || '{"storage_path":"otra/ruta.jpg"}'), '23514', 'imagen propia: ruta distinta de {user_id}/{id}.{ext} rechazada');

  -- Widget del tema (HE-05-HU02/HU03)
  SELECT id INTO wid FROM widget WHERE user_id = c AND type = 'news';
  tw := jsonb_build_object('theme_id', thm, 'widget_id', wid, 'x', 0, 'y', 0, 'width', 100, 'height', 100, 'ref_width', 1920, 'ref_height', 1080);
  PERFORM t.fails('theme_widget', t.r(c, tw || '{"width":99}'), '23514', 'widget del tema: ancho 99 rechazado (mínimo 100)');
  PERFORM t.fails('theme_widget', t.r(c, tw || '{"height":99}'), '23514', 'widget del tema: alto 99 rechazado (mínimo 100)');
  PERFORM t.fails('theme_widget', t.r(c, tw || '{"x":-1}'), '23514', 'widget del tema: x negativa rechazada');
  PERFORM t.fails('theme_widget', t.r(c, tw || '{"y":-1}'), '23514', 'widget del tema: y negativa rechazada');
  PERFORM t.ins('theme_widget', t.r(c, tw));
  PERFORM t.fails('theme_widget', t.r(c, tw), '23505', 'widget del tema: una sola fila por (tema, widget)');

  -- Imágenes del carrusel
  PERFORM t.fails('widget_carousel_item', t.r(c, jsonb_build_object('widget_id', wid, 'source', 'own', 'uploaded_image_id', img, 'position', 1)),
                  'invalid_field', 'imagen de carrusel: solo cuelga de un widget Carrusel de imágenes');
  PERFORM t.fails('widget_carousel_item', t.r(c, jsonb_build_object('widget_id', car, 'source', 'own', 'position', 1)), '23514', 'imagen de carrusel: fuente propia sin imagen rechazada');
  PERFORM t.fails('widget_carousel_item', t.r(c, jsonb_build_object('widget_id', car, 'source', 'own', 'uploaded_image_id', img, 'catalog_image_id', 'x', 'position', 1)),
                  '23514', 'imagen de carrusel: no puede traer a la vez imagen propia y de catálogo');
  PERFORM t.ins('widget_carousel_item', t.r(c, jsonb_build_object('widget_id', car, 'source', 'own', 'uploaded_image_id', img, 'position', 1)));
  PERFORM t.ok(true, 'imagen de carrusel: válida con imagen propia');

  -- Preferencias, perfil y catálogos
  PERFORM t.throws(format($q$UPDATE user_preference SET board_card_view = 'huge' WHERE id = %L$q$, c), '23514', 'preferencias: vista fuera de compact/expanded rechazada');
  PERFORM t.throws(format($q$UPDATE user_preference SET id = gen_random_uuid() WHERE id = %L$q$, c), '23514', 'preferencias: id = user_id');
  PERFORM t.throws(format($q$UPDATE user_preference SET deleted_at = now() WHERE id = %L$q$, c), '23514', 'preferencias: no se eliminan');
  PERFORM t.throws(format($q$UPDATE applied_theme SET deleted_at = now() WHERE id = %L$q$, c), '23514', 'tema aplicado: no se elimina');
  PERFORM t.throws(format($q$UPDATE applied_theme SET color_text = 'blanco' WHERE id = %L$q$, c), '23514', 'tema aplicado: color inválido rechazado');
  PERFORM t.throws(format($q$UPDATE profile SET alias = repeat('a', 31) WHERE user_id = %L$q$, c), '23514', 'perfil: alias de 31 caracteres rechazado');
  PERFORM t.throws(format($q$UPDATE profile SET alias = '   ' WHERE user_id = %L$q$, c), '23514', 'perfil: alias solo de espacios rechazado');
  PERFORM t.throws(format($q$UPDATE profile SET auth_provider = 'otro' WHERE user_id = %L$q$, c), '23514', 'perfil: proveedor fuera de email/google rechazado');
  PERFORM t.throws($q$INSERT INTO catalog_meta (id, version) VALUES (2, 1)$q$, '23514', 'catálogo: catalog_meta admite solo la fila 1');
  PERFORM t.throws($q$INSERT INTO catalog_template (id,name,thumbnail_path,bundle_path,default_background_path,default_color_primary,default_color_secondary,default_color_text,default_font_id,is_default)
                      VALUES ('otra','Otra','a','b','c','#000000','#000000','#000000','inter',true)$q$, '23505', 'catálogo: una sola plantilla por defecto');
  PERFORM t.throws($q$INSERT INTO catalog_animation (id,name,storage_path,thumbnail_path,format) VALUES ('a','A','p','t','gif')$q$, '23514', 'catálogo: formato de animación fuera de lottie/webm');
  PERFORM t.throws($q$INSERT INTO catalog_palette (id,name,color_primary,color_secondary,color_text) VALUES ('p','P','#12','#000000','#000000')$q$, '23514', 'catálogo: color de paleta inválido');
END $$;

\echo ''
\echo '== 4. sync_push / sync_pull: D-048 por campo con hora de servidor (usuario A)'
-- ---------------------------------------------------------------------------
-- Equivalencias de tiempo de las pruebas: t.ts(n) = «ahora − 2 h» + n segundos.
SET ROLE authenticated;
SELECT t.login(t.id('A'));

\echo '-- 4.1 Creación y conflicto del mismo campo (gana la hora más reciente)'
DO $$
DECLARE
  d1 uuid := t.id('dev1'); d2 uuid := t.id('dev2'); x uuid := t.id('X'); todo uuid; r jsonb; seq0 bigint; seq1 bigint;
BEGIN
  SELECT id INTO todo FROM kanban_column WHERE role = 'todo';
  r := t.push1(d1, 0, t.chg(1, 'card', x, 'upsert', 10,
        t.f('title','"Uno"',10) || t.f('due_date','"2026-12-01"',10) || t.f('position','1',10) || t.f('column_id', to_jsonb(todo), 10)));
  PERFORM t.eq(r->>'status', 'applied', 'creación de tarjeta: applied');
  PERFORM t.eq(r->'row'->'fields'->>'title', 'Uno', 'creación: la fila devuelta trae el título');
  PERFORM t.eq(r->'row'->'field_mods'->>'title', t.ts(10), 'creación: hora por campo = hora corregida enviada');
  PERFORM t.eq(r->'row'->'fields'->>'created_at', t.ts(10), 'creación: created_at = hora mínima de los campos');
  PERFORM t.ok((r->'row'->>'updated_seq')::bigint > 0, 'creación: updated_seq asignado por el servidor');

  -- D2 escribe «Dos» a las +30 s; luego llega D1 con «Tres» a las +20 s (más antiguo)
  r := t.push1(d2, 0, t.chg(1, 'card', x, 'upsert', 30, t.f('title','"Dos"',30)));
  PERFORM t.eq(r->>'status', 'applied', 'conflicto: D2 (más reciente) se aplica');
  r := t.push1(d1, 0, t.chg(2, 'card', x, 'upsert', 20, t.f('title','"Tres"',20)));
  PERFORM t.eq(r->>'status', 'superseded', 'conflicto: D1 con hora anterior queda superado');
  PERFORM t.eq((r->>'conflict')::boolean, true, 'conflicto: se marca conflict = true (el Núcleo avisa)');
  PERFORM t.eq(r->'row'->'fields'->>'title', 'Dos', 'conflicto: la fila devuelta trae el valor ganador, que D1 adopta');
  PERFORM t.eq((SELECT title FROM card WHERE id = x), 'Dos', 'conflicto: en la base gana «Dos»');
  r := t.push1(d1, 0, t.chg(3, 'card', x, 'upsert', 40, t.f('title','"Cuatro"',40)));
  PERFORM t.eq(r->>'status', 'applied', 'conflicto: una modificación posterior sí gana');
  PERFORM t.eq((r->>'conflict')::boolean, false, 'sin conflicto cuando gana el valor propio');

  -- Campos distintos de la misma tarjeta se combinan sin conflicto (R5)
  r := t.push1(d1, 0, t.chg(4, 'card', x, 'upsert', 50, t.f('priority','"high"',50)));
  PERFORM t.eq(r->>'status', 'applied', 'campos distintos: D1 cambia prioridad');
  r := t.push1(d2, 0, t.chg(2, 'card', x, 'upsert', 45, t.f('description','"nota"',45)));
  PERFORM t.eq(r->>'status', 'applied', 'campos distintos: D2 cambia descripción con hora anterior y se aplica igual');
  PERFORM t.eq((r->>'conflict')::boolean, false, 'campos distintos: sin conflicto ni mensaje');
  PERFORM t.eq((SELECT title || '/' || priority || '/' || description FROM card WHERE id = x), 'Cuatro/high/nota', 'campos distintos: la tarjeta conserva los tres cambios');

  -- Idempotencia (R11): reenviar el mismo cambio no cambia nada
  SELECT updated_seq INTO seq0 FROM card WHERE id = x;
  r := t.push1(d1, 0, t.chg(4, 'card', x, 'upsert', 50, t.f('priority','"high"',50)));
  SELECT updated_seq INTO seq1 FROM card WHERE id = x;
  PERFORM t.eq(seq1, seq0, 'idempotencia: reenviar el mismo cambio no modifica la fila (mismo updated_seq)');
  PERFORM t.eq(r->>'status', 'applied', 'idempotencia: la respuesta sigue siendo applied');

  -- Empate exacto de hora con valores distintos: resultado determinista sea cual sea el orden
  r := t.push1(d1, 0, t.chg(5, 'card', x, 'upsert', 60, t.f('title','"aaa"',60)));
  r := t.push1(d2, 0, t.chg(3, 'card', x, 'upsert', 60, t.f('title','"bbb"',60)));
  PERFORM t.eq((SELECT title FROM card WHERE id = x), 'bbb', 'empate de hora (orden aaa, bbb): gana «bbb»');
  r := t.push1(d1, 0, t.chg(6, 'card', t.id('Y'), 'upsert', 60,
        t.f('title','"bbb"',60) || t.f('due_date','"2026-12-01"',60) || t.f('position','2',60) || t.f('column_id', to_jsonb(todo), 60)));
  r := t.push1(d2, 0, t.chg(7, 'card', t.id('Y'), 'upsert', 60, t.f('title','"aaa"',60)));
  PERFORM t.eq((SELECT title FROM card WHERE id = t.id('Y')), 'bbb', 'empate de hora (orden bbb, aaa): gana «bbb» también');
  PERFORM t.eq(r->>'status', 'superseded', 'empate de hora: el perdedor queda superado');
END $$;

\echo '-- 4.2 Eliminar frente a modificar: gana la acción más reciente (R6)'
DO $$
DECLARE
  d1 uuid := t.id('dev1'); d2 uuid := t.id('dev2'); todo uuid; r jsonb; p uuid := t.id('P'); q uuid := t.id('Q');
  rr uuid := t.id('R'); s uuid := t.id('S'); fb text; l1 uuid := t.id('L1');
BEGIN
  SELECT id INTO todo FROM kanban_column WHERE role = 'todo';
  FOREACH fb IN ARRAY ARRAY['P','Q','R','S'] LOOP
    r := t.push1(d1, 0, t.chg(100, 'card', t.id(fb), 'upsert', 100,
          t.f('title', to_jsonb(fb), 100) || t.f('due_date','"2026-12-01"',100) || t.f('position','3',100) || t.f('column_id', to_jsonb(todo), 100)));
  END LOOP;

  -- P: A eliminó (+120) y B modificó después (+130) -> la tarjeta se conserva con la modificación
  r := t.push1(d1, 0, t.chg(101, 'card', p, 'delete', 120));
  PERFORM t.eq(r->>'status', 'applied', 'eliminar: se aplica cuando es más reciente que toda modificación');
  PERFORM t.ok((SELECT deleted_at IS NOT NULL FROM card WHERE id = p), 'eliminar: la fila queda con deleted_at (tombstone)');
  PERFORM t.eq(r->'row'->>'deleted_at', t.ts(120), 'eliminar: deleted_at = hora corregida de la eliminación');
  r := t.push1(d2, 0, t.chg(102, 'card', p, 'upsert', 130, t.f('title','"P2"',130)));
  PERFORM t.eq(r->>'status', 'applied', 'eliminar vs modificar posterior: la modificación gana');
  PERFORM t.ok((SELECT deleted_at IS NULL AND title = 'P2' FROM card WHERE id = p), 'eliminar vs modificar posterior: la tarjeta se conserva y trae la modificación');

  -- Q: B modificó (+150) y A eliminó antes (+140) -> gana la modificación
  r := t.push1(d2, 0, t.chg(103, 'card', q, 'upsert', 150, t.f('title','"Q2"',150)));
  r := t.push1(d1, 0, t.chg(104, 'card', q, 'delete', 140));
  PERFORM t.eq(r->>'status', 'superseded', 'modificar +150 vs eliminar +140: la eliminación queda superada');
  PERFORM t.eq((r->>'conflict')::boolean, true, 'la eliminación perdida se marca como conflicto');
  PERFORM t.ok((SELECT deleted_at IS NULL AND title = 'Q2' FROM card WHERE id = q), 'la tarjeta sigue viva con «Q2»');

  -- R: A eliminó después (+160) de la modificación de B (+150, llega tarde) -> gana la eliminación
  r := t.push1(d1, 0, t.chg(105, 'card', rr, 'delete', 160));
  r := t.push1(d2, 0, t.chg(106, 'card', rr, 'upsert', 150, t.f('title','"R2"',150)));
  PERFORM t.eq(r->>'status', 'deleted', 'modificar +150 vs eliminar +160: gana la eliminación');
  PERFORM t.eq((r->>'conflict')::boolean, true, 'la modificación perdida se marca como conflicto');
  PERFORM t.ok((SELECT deleted_at IS NOT NULL AND title = 'R' FROM card WHERE id = rr), 'la tarjeta sigue eliminada y sin el cambio');

  -- S: misma hora de modificación y eliminación -> gana la modificación (la eliminación debe ser estrictamente posterior)
  r := t.push1(d1, 0, t.chg(107, 'card', s, 'delete', 100));
  PERFORM t.eq(r->>'status', 'superseded', 'eliminar con la misma hora que la última modificación: no se elimina');

  -- Cascadas lógicas (8.5)
  r := t.push1(d1, 0, t.chg(110, 'label', l1, 'upsert', 170, t.f('name','"Etq1"',170) || t.f('color_id','"green"',170)));
  r := t.push1(d1, 0, t.chg(111, 'card_label', t.id('CL1'), 'upsert', 171, t.f('card_id', to_jsonb(p::text), 171) || t.f('label_id', to_jsonb(l1::text), 171)));
  PERFORM t.eq(r->>'status', 'applied', 'card_label: se crea');
  r := t.push1(d1, 0, t.chg(112, 'card_label', t.id('CL2'), 'upsert', 172, t.f('card_id', to_jsonb(q::text), 172) || t.f('label_id', to_jsonb(l1::text), 172)));
  r := t.push1(d1, 0, t.chg(113, 'card', p, 'delete', 180));
  PERFORM t.ok((SELECT deleted_at IS NOT NULL FROM card_label WHERE id = t.id('CL1')), 'cascada: al eliminar la tarjeta se eliminan sus card_label');
  PERFORM t.eq((SELECT deleted_at FROM card_label WHERE id = t.id('CL1')), (SELECT deleted_at FROM card WHERE id = p), 'cascada: misma hora de modificación que la eliminación');
  r := t.push1(d1, 0, t.chg(114, 'label', l1, 'delete', 190));
  PERFORM t.ok((SELECT deleted_at IS NOT NULL FROM card_label WHERE id = t.id('CL2')), 'cascada: al eliminar la etiqueta se eliminan sus card_label');
  PERFORM t.ok((SELECT deleted_at IS NULL FROM card WHERE id = q), 'cascada: las tarjetas de la etiqueta NO se eliminan (HE-08-HU04-ET06)');
  r := t.push1(d1, 0, t.chg(115, 'card_label', t.id('CL3'), 'upsert', 200, t.f('card_id', to_jsonb(p::text), 200) || t.f('label_id', to_jsonb(t.id('A_label')::text), 200)));
  PERFORM t.eq(r->>'reason', 'parent_deleted', 'card_label con tarjeta eliminada: rejected parent_deleted');
  r := t.push1(d1, 0, t.chg(116, 'card', t.id('desconocida'), 'delete', 210));
  PERFORM t.eq(r->>'reason', 'unknown_entity', 'eliminar una entidad inexistente (purgada): rejected unknown_entity');
END $$;

\echo '-- 4.3 Reloj: hora corregida con el desfase del servidor (8.3)'
DO $$
DECLARE
  d1 uuid := t.id('dev1'); d2 uuid := t.id('dev2'); todo uuid; k uuid := t.id('K'); r jsonb; ts timestamptz; ch jsonb[]; i int;
BEGIN
  SELECT id INTO todo FROM kanban_column WHERE role = 'todo';
  r := t.push1(d1, 0, t.chg(200, 'card', k, 'upsert', 10,
        t.f('title','"K"',10) || t.f('due_date','"2026-12-01"',10) || t.f('position','1',10) || t.f('column_id', to_jsonb(todo), 10)));
  -- D2 (reloj correcto) cambia la posición en el instante base+4000
  r := t.push1(d2, 0, t.chg(201, 'card', k, 'upsert', 4000, t.f('position','5',4000)));
  PERFORM t.eq(r->>'status', 'applied', 'reloj: D2 con reloj correcto escribe position = 5');
  -- D1 tiene el reloj 1 h atrasado: su cambio real fue a base+5400, pero su reloj marca base+1800.
  -- Sin corrección perdería; con desfase +3 600 000 ms gana.
  r := t.push1(d1, 0, t.chg(202, 'card', k, 'upsert', 1800, t.f('position','8',1800)));
  PERFORM t.eq(r->>'status', 'superseded', 'reloj atrasado SIN corrección: pierde (control)');
  r := t.push1(d1, 3600000, t.chg(203, 'card', k, 'upsert', 1800, t.f('position','9',1800)));
  PERFORM t.eq(r->>'status', 'applied', 'reloj atrasado CON desfase +1 h: gana porque su hora corregida es posterior');
  PERFORM t.eq((SELECT position FROM card WHERE id = k), 9::double precision, 'reloj: position = 9');
  PERFORM t.eq(r->'row'->'field_mods'->>'position', t.ts(5400), 'reloj: la hora guardada es la corregida (base + 5400 s)');
  -- Reloj adelantado: la hora se recorta a la del servidor y no gana siempre
  r := t.push1(d1, 0, t.chg(204, 'card', k, 'upsert', 10000, t.f('title','"Futuro"',10000)));
  ts := (r->'row'->'field_mods'->>'title')::timestamptz;
  PERFORM t.ok(ts <= clock_timestamp() AND ts > (SELECT base FROM t.clock) + interval '2 hours' - interval '1 minute',
               'reloj adelantado: la hora de modificación se recorta a la hora del servidor');
  -- Límites del envío
  PERFORM t.throws($q$SELECT public.sync_push(gen_random_uuid(), 86400001, '[]')$q$, 'clock_out_of_range', 'desfase de más de 24 h: clock_out_of_range');
  PERFORM t.ok((public.sync_push(gen_random_uuid(), 86400000, '[]')->>'max_seq') IS NOT NULL, 'desfase de exactamente 24 h: aceptado');
  ch := ARRAY[]::jsonb[];
  FOR i IN 1..201 LOOP ch := ch || t.chg(i, 'card', t.id('K'), 'upsert', 5, t.f('position','1',5)); END LOOP;
  PERFORM t.throws(format($q$SELECT public.sync_push(gen_random_uuid(), 0, %L::jsonb)$q$, to_jsonb(ch)::text), 'too_many_changes', 'más de 200 cambios: too_many_changes');
  PERFORM t.ok(public.server_time() <= clock_timestamp() AND public.server_time() > now() - interval '1 minute', 'server_time() devuelve la hora del servidor');
END $$;

\echo '-- 4.4 Invariantes que repite el servidor (8.4) y normalizaciones (R8)'
DO $$
DECLARE
  d1 uuid := t.id('dev1'); todo uuid; done_c uuid; r jsonb; ch jsonb[] := '{}'; i int; res jsonb; x uuid; n int;
  colors text[];
BEGIN
  SELECT id INTO todo FROM kanban_column WHERE role = 'todo';
  SELECT id INTO done_c FROM kanban_column WHERE role = 'done';

  -- Columnas: máximo 10 (las 3 por defecto cuentan)
  FOR i IN 1..8 LOOP
    ch := ch || t.chg(300 + i, 'kanban_column', t.id('col' || i), 'upsert', 300 + i,
                      t.f('name', to_jsonb('Extra ' || i), 300 + i) || t.f('color_id', '"gray"', 300 + i) || t.f('position', to_jsonb(10 + i), 300 + i));
  END LOOP;
  r := t.push(d1, 0, ch);
  SELECT count(*) INTO n FROM jsonb_array_elements(r->'results') e WHERE e->>'status' = 'applied';
  PERFORM t.eq(n, 7, 'columnas: se aplican 7 de 8 (3 por defecto + 7 = 10)');
  res := t.res(r, 308);
  PERFORM t.eq(res->>'status', 'rejected', 'columnas: la 11.ª queda rejected');
  PERFORM t.eq(res->>'reason', 'limit_columns', 'columnas: motivo limit_columns');
  PERFORM t.eq((SELECT count(*) FROM kanban_column WHERE deleted_at IS NULL), 10::bigint, 'columnas: 10 vivas en la base');
  -- el rechazo de un cambio no revierte los anteriores del mismo lote (SAVEPOINT por cambio)
  PERFORM t.eq((SELECT count(*) FROM kanban_column WHERE name LIKE 'Extra %'), 7::bigint, 'columnas: los 7 anteriores del lote se conservan');
  r := t.push1(d1, 0, t.chg(320, 'kanban_column', t.id('colN'), 'upsert', 320,
        t.f('name','"POR HACER"',320) || t.f('color_id','"gray"',320) || t.f('position','99',320)));
  PERFORM t.eq(r->>'reason', 'limit_columns', 'columnas: con 10 vivas, incluso un nombre repetido choca primero con el límite');
  r := t.push1(d1, 0, t.chg(321, 'kanban_column', t.id('col8'), 'delete', 321));
  r := t.push1(d1, 0, t.chg(322, 'kanban_column', t.id('col7'), 'delete', 322));
  PERFORM t.eq(r->>'status', 'applied', 'columnas: eliminar una columna personalizada se aplica');
  r := t.push1(d1, 0, t.chg(323, 'kanban_column', t.id('colN'), 'upsert', 323,
        t.f('name','"  por hacer "',323) || t.f('color_id','"gray"',323) || t.f('position','99',323)));
  PERFORM t.eq(r->>'reason', 'duplicate_name', 'columnas: nombre repetido -> duplicate_name');
  PERFORM t.eq(r->'row'->>'entity_id', todo::text, 'columnas: duplicate_name devuelve la fila existente');
  r := t.push1(d1, 0, t.chg(324, 'kanban_column', t.id('colR'), 'upsert', 324,
        t.f('name','"Otra Por Hacer"',324) || t.f('color_id','"gray"',324) || t.f('position','99',324) || t.f('role','"todo"',324)));
  PERFORM t.eq(r->>'reason', 'duplicate_role', 'columnas: segunda función «todo» -> duplicate_role');
  r := t.push1(d1, 0, t.chg(325, 'kanban_column', todo, 'delete', 325));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'columnas: no se elimina una columna por defecto');

  -- Etiquetas: máximo 20 y nombre único
  ch := '{}';
  FOR i IN 1..20 LOOP
    ch := ch || t.chg(400 + i, 'label', t.id('lab' || i), 'upsert', 400 + i,
                      t.f('name', to_jsonb('Etq ' || i), 400 + i) || t.f('color_id', '"blue"', 400 + i));
  END LOOP;
  r := t.push(d1, 0, ch);
  SELECT count(*) INTO n FROM jsonb_array_elements(r->'results') e WHERE e->>'status' = 'applied';
  PERFORM t.eq(n, 19, 'etiquetas: con «Trabajo» ya creada se aplican 19 de 20');
  PERFORM t.eq(t.res(r, 420)->>'reason', 'limit_labels', 'etiquetas: la 21.ª -> limit_labels');
  r := t.push1(d1, 0, t.chg(430, 'label', t.id('labD'), 'upsert', 430, t.f('name','"  trabajo"',430) || t.f('color_id','"red"',430)));
  PERFORM t.eq(r->>'reason', 'limit_labels', 'etiquetas: con 20 vivas el límite manda');
  r := t.push1(d1, 0, t.chg(431, 'label', t.id('lab1'), 'upsert', 431, t.f('name','"TRABAJO"',431)));
  PERFORM t.eq(r->>'reason', 'duplicate_name', 'etiquetas: renombrar a un nombre existente -> duplicate_name');
  PERFORM t.eq(r->'row'->>'entity_id', t.id('A_label')::text, 'etiquetas: devuelve la etiqueta existente');
  PERFORM t.eq((SELECT name FROM label WHERE id = t.id('lab1')), 'Etq 1', 'etiquetas: el renombrado rechazado no se aplicó');

  -- Etiquetas de una tarjeta: máximo 5 vivas; se conservan las más antiguas (HE-07-HU02-ET04)
  x := t.id('M');
  r := t.push1(d1, 0, t.chg(440, 'card', x, 'upsert', 440,
        t.f('title','"M"',440) || t.f('due_date','"2026-12-01"',440) || t.f('position','1',440) || t.f('column_id', to_jsonb(todo), 440)));
  ch := '{}';
  FOR i IN 1..6 LOOP
    ch := ch || t.chg(450 + i, 'card_label', t.id('CLm' || i), 'upsert', 450 + i,
                      t.f('card_id', to_jsonb(x::text), 450 + i) || t.f('label_id', to_jsonb(t.id('lab' || i)::text), 450 + i));
  END LOOP;
  r := t.push(d1, 0, ch);
  PERFORM t.eq((SELECT count(*) FROM card_label WHERE card_id = x AND deleted_at IS NULL), 5::bigint, 'card_label: 5 vivas como máximo por tarjeta');
  PERFORM t.eq(t.res(r, 456)->>'status', 'deleted', 'card_label: la 6.ª (la más reciente) queda eliminada');
  PERFORM t.eq((t.res(r, 456)->>'conflict')::boolean, true, 'card_label: se marca conflict = true');
  PERFORM t.eq((SELECT count(*) FROM card_label WHERE card_id = x AND deleted_at IS NOT NULL AND id = t.id('CLm6')), 1::bigint, 'card_label: se conservan las 5 más antiguas');
  -- La misma unión con otro id no duplica (1.3): se trata como modificación de la existente
  r := t.push1(d1, 0, t.chg(460, 'card_label', gen_random_uuid(), 'upsert', 460,
        t.f('card_id', to_jsonb(x::text), 460) || t.f('label_id', to_jsonb(t.id('lab1')::text), 460)));
  PERFORM t.eq((SELECT count(*) FROM card_label WHERE card_id = x AND label_id = t.id('lab1')), 1::bigint, 'card_label: la misma unión no se duplica');
  PERFORM t.eq(r->'row'->>'entity_id', t.id('CLm1')::text, 'card_label: se devuelve la fila existente');

  -- Normalización de la tarjeta (R8)
  x := t.id('N');
  r := t.push1(d1, 0, t.chg(470, 'card', x, 'upsert', 470,
        t.f('title','"N"',470) || t.f('due_date','"2026-12-10"',470) || t.f('position','1',470) || t.f('column_id', to_jsonb(todo), 470)
        || t.f('scheduled_date','"2026-12-10"',470) || t.f('scheduled_hour','9',470)));
  PERFORM t.eq(r->>'status', 'applied', 'tarjeta con bloque horario: se crea');
  r := t.push1(d1, 0, t.chg(471, 'card', x, 'upsert', 510, t.f('column_id', to_jsonb(done_c), 510) || t.f('previous_column_id', to_jsonb(todo), 510)));
  PERFORM t.eq(r->'row'->'fields'->>'completed_on', ((SELECT base FROM t.clock) + interval '510 seconds')::date::text, 'R8b: al pasar a «done» se fija completed_on');
  PERFORM t.eq(r->'row'->'field_mods'->>'completed_on', t.ts(510), 'R8b: completed_on lleva la hora del cambio que lo causó');
  r := t.push1(d1, 0, t.chg(472, 'card', x, 'upsert', 520, t.f('column_id', to_jsonb(todo), 520)));
  PERFORM t.ok((r->'row'->'fields'->>'completed_on') IS NULL, 'R8b: al salir de «done» se borra completed_on');
  r := t.push1(d1, 0, t.chg(473, 'card', x, 'upsert', 550, t.f('due_date','"2026-12-05"',550)));
  PERFORM t.eq(r->>'status', 'applied', 'R8c: due_date anterior al bloque: el cambio se guarda');
  PERFORM t.ok((r->'row'->'fields'->>'scheduled_date') IS NULL AND (r->'row'->'fields'->>'scheduled_hour') IS NULL, 'R8c: se quita el bloque horario (HE-07-HU04-ET13)');
  -- Tarjeta que llega con una columna eliminada -> columna «todo»
  r := t.push1(d1, 0, t.chg(480, 'kanban_column', t.id('tmpcol'), 'upsert', 530,
        t.f('name','"Temporal"',530) || t.f('color_id','"gray"',530) || t.f('position','50',530)));
  PERFORM t.eq(r->>'status', 'applied', 'columna temporal creada');
  r := t.push1(d1, 0, t.chg(481, 'kanban_column', t.id('tmpcol'), 'delete', 531));
  r := t.push1(d1, 0, t.chg(482, 'card', t.id('Z'), 'upsert', 532,
        t.f('title','"Z"',532) || t.f('due_date','"2026-12-01"',532) || t.f('position','1',532) || t.f('column_id', to_jsonb(t.id('tmpcol')), 532)));
  PERFORM t.eq(r->'row'->'fields'->>'column_id', todo::text, 'R8a: columna eliminada en otro computador -> la tarjeta va a «todo»');
  -- Tarjeta creada sin column_id -> «todo»
  r := t.push1(d1, 0, t.chg(483, 'card', t.id('Z2'), 'upsert', 533,
        t.f('title','"Z2"',533) || t.f('due_date','"2026-12-01"',533) || t.f('position','1',533)));
  PERFORM t.eq(r->'row'->'fields'->>'column_id', todo::text, 'R8a: sin column_id se asigna «todo»');
  -- Creada directamente en «done»
  r := t.push1(d1, 0, t.chg(484, 'card', t.id('Z3'), 'upsert', 534,
        t.f('title','"Z3"',534) || t.f('due_date','"2026-12-01"',534) || t.f('position','1',534) || t.f('column_id', to_jsonb(done_c), 534)));
  PERFORM t.ok((r->'row'->'fields'->>'completed_on') IS NOT NULL, 'R8b: tarjeta creada en «done» queda con completed_on');
END $$;

\echo '-- 4.5 Temas, widgets, imágenes y rechazos por forma'
DO $$
DECLARE
  d1 uuid := t.id('dev1'); r jsonb; ch jsonb[] := '{}'; i int; n int; thm uuid; wid uuid; tfields jsonb; cimg text := 'img-prueba'; ui uuid := t.id('UI1');
BEGIN
  SELECT theme_id INTO thm FROM applied_theme;
  tfields := '{}';
  -- Temas: máximo 10
  FOR i IN 2..11 LOOP
    ch := ch || t.chg(500 + i, 'theme', t.id('th' || i), 'upsert', 500 + i,
        t.f('name', to_jsonb('Tema ' || i), 500 + i) || t.f('template_id','"default"',500 + i) || t.f('color_primary','"#00d9e2"',500 + i)
        || t.f('color_secondary','"#DC026C"',500 + i) || t.f('color_text','"#FFFFFF"',500 + i) || t.f('font_id','"inter"',500 + i));
  END LOOP;
  r := t.push(d1, 0, ch);
  SELECT count(*) INTO n FROM jsonb_array_elements(r->'results') e WHERE e->>'status' = 'applied';
  PERFORM t.eq(n, 9, 'temas: se aplican 9 (con «Mi tema» suman 10)');
  PERFORM t.eq(t.res(r, 511)->>'reason', 'limit_themes', 'temas: el 11.º -> limit_themes');
  PERFORM t.eq(t.res(r, 502)->'row'->'fields'->>'color_primary', '#00D9E2', 'temas: color guardado en mayúsculas');
  r := t.push1(d1, 0, t.chg(520, 'theme', t.id('thX'), 'upsert', 520, t.f('name','"mi TEMA"',520)));
  PERFORM t.eq(r->>'reason', 'incomplete_create', 'temas: creación sin los campos obligatorios -> incomplete_create');
  r := t.push1(d1, 0, t.chg(521, 'theme', t.id('th2'), 'upsert', 521, t.f('name','"MI tema"',521)));
  PERFORM t.eq(r->>'reason', 'duplicate_name', 'temas: renombrar a un nombre existente -> duplicate_name');
  PERFORM t.eq(r->'row'->>'entity_id', thm::text, 'temas: devuelve el tema existente');
  r := t.push1(d1, 0, t.chg(522, 'theme', thm, 'delete', 522));
  PERFORM t.eq(r->>'reason', 'applied_theme', 'temas: el tema aplicado no se elimina -> applied_theme');
  r := t.push1(d1, 0, t.chg(523, 'applied_theme', t.id('A'), 'upsert', 523, t.f('color_primary','"#DC026C"',523) || t.f('applied_at', to_jsonb(t.ts(523)), 523)));
  PERFORM t.eq(r->>'status', 'applied', 'tema aplicado: se actualiza la copia aplicada');
  r := t.push1(d1, 0, t.chg(524, 'applied_theme', t.id('A'), 'upsert', 524, t.f('color_primary','"rojo"',524)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'tema aplicado: color inválido -> invalid_field');
  PERFORM t.eq((SELECT color_primary::text FROM applied_theme), '#DC026C', 'tema aplicado: el valor inválido no se guardó');
  r := t.push1(d1, 0, t.chg(525, 'applied_theme', t.id('A'), 'delete', 525));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'tema aplicado: no se elimina');
  r := t.push1(d1, 0, t.chg(526, 'user_preference', t.id('A'), 'upsert', 526, t.f('board_card_view','"expanded"',526)));
  PERFORM t.eq(r->>'status', 'applied', 'preferencias: vista expandida (sincronizada)');
  r := t.push1(d1, 0, t.chg(527, 'user_preference', gen_random_uuid(), 'upsert', 527, t.f('board_card_view','"expanded"',527)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'preferencias: el id debe ser el user_id');
  r := t.push1(d1, 0, t.chg(528, 'theme', t.id('th3'), 'upsert', 528, t.f('background_source','"own"',528)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'temas: fondo propio sin imagen -> invalid_field');
  PERFORM t.eq((SELECT background_source FROM theme WHERE id = t.id('th3')), 'template_default', 'temas: el cambio inválido no se aplicó');

  -- Widgets
  r := t.push1(d1, 0, t.chg(530, 'widget', t.id('wW'), 'upsert', 530,
        t.f('type','"weather"',530) || t.f('weather_city','"Popayán"',530) || t.f('weather_geo_id','"g-1"',530)
        || t.f('weather_latitude','2.44',530) || t.f('weather_longitude','-76.61',530)));
  PERFORM t.eq(r->>'status', 'applied', 'widget Clima: se crea');
  r := t.push1(d1, 0, t.chg(531, 'widget', t.id('wW2'), 'upsert', 531,
        t.f('type','"weather"',531) || t.f('weather_city','"Popayán"',531) || t.f('weather_geo_id','"g-1"',531)
        || t.f('weather_latitude','2.44',531) || t.f('weather_longitude','-76.61',531)));
  PERFORM t.eq(r->>'reason', 'duplicate_widget', 'widget Clima: misma ciudad -> duplicate_widget');
  PERFORM t.eq(r->'row'->>'entity_id', t.id('wW')::text, 'widget Clima: devuelve el widget existente');
  r := t.push1(d1, 0, t.chg(532, 'widget', t.id('wN'), 'upsert', 532, t.f('type','"news"',532)));
  r := t.push1(d1, 0, t.chg(533, 'widget', t.id('wN2'), 'upsert', 533, t.f('type','"news"',533)));
  PERFORM t.eq(r->>'reason', 'duplicate_widget', 'widget Noticias: segunda -> duplicate_widget');
  r := t.push1(d1, 0, t.chg(534, 'widget', t.id('wT'), 'upsert', 534, t.f('type','"text"',534) || t.f('text_content', to_jsonb(repeat('x', 201)), 534)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'widget Texto: 201 caracteres -> invalid_field');
  r := t.push1(d1, 0, t.chg(535, 'widget', (SELECT id FROM widget WHERE type = 'clock'), 'delete', 535));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'widget por defecto: no se elimina');
  -- widget del tema + cascada al eliminar el widget (8.5)
  r := t.push1(d1, 0, t.chg(536, 'theme_widget', t.id('TW1'), 'upsert', 536,
        t.f('theme_id', to_jsonb(thm::text), 536) || t.f('widget_id', to_jsonb(t.id('wW')::text), 536) || t.f('x','10',536) || t.f('y','10',536)
        || t.f('width','200',536) || t.f('height','200',536) || t.f('ref_width','1920',536) || t.f('ref_height','1080',536)));
  PERFORM t.eq(r->>'status', 'applied', 'widget del tema: se crea');
  r := t.push1(d1, 0, t.chg(537, 'theme_widget', t.id('TW1'), 'upsert', 537, t.f('width','99',537)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'widget del tema: ancho 99 -> invalid_field');
  r := t.push1(d1, 0, t.chg(538, 'widget', t.id('wW'), 'delete', 538));
  PERFORM t.eq(r->>'status', 'applied', 'widget Clima: se elimina');
  PERFORM t.ok((SELECT deleted_at IS NOT NULL FROM theme_widget WHERE id = t.id('TW1')), 'cascada: al eliminar el widget se eliminan sus widgets del tema en todos los temas');
  r := t.push1(d1, 0, t.chg(539, 'theme_widget', t.id('TW2'), 'upsert', 539,
        t.f('theme_id', to_jsonb(thm::text), 539) || t.f('widget_id', to_jsonb(t.id('wW')::text), 539) || t.f('x','10',539) || t.f('y','10',539)
        || t.f('width','200',539) || t.f('height','200',539) || t.f('ref_width','1920',539) || t.f('ref_height','1080',539)));
  PERFORM t.eq(r->>'reason', 'parent_deleted', 'widget del tema con widget eliminado -> parent_deleted');

  -- Imágenes propias
  r := t.push1(d1, 0, t.chg(540, 'uploaded_image', ui, 'upsert', 540,
        t.f('storage_path', to_jsonb(t.id('A') || '/' || ui || '.png'), 540) || t.f('mime_type','"image/png"',540) || t.f('extension','"png"',540)
        || t.f('size_bytes','2048',540) || t.f('width','800',540) || t.f('height','600',540) || t.f('sha256', to_jsonb(repeat('c', 64)), 540)));
  PERFORM t.eq(r->>'status', 'applied', 'imagen propia: se registra');
  r := t.push1(d1, 0, t.chg(541, 'uploaded_image', t.id('UI2'), 'upsert', 541,
        t.f('storage_path', to_jsonb(t.id('A') || '/' || t.id('UI2') || '.png'), 541) || t.f('mime_type','"image/png"',541) || t.f('extension','"png"',541)
        || t.f('size_bytes','20971521',541) || t.f('width','800',541) || t.f('height','600',541) || t.f('sha256', to_jsonb(repeat('c', 64)), 541)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'imagen propia de más de 20 MB -> invalid_field (RNF-23)');
  r := t.push1(d1, 0, t.chg(542, 'widget', t.id('wS'), 'upsert', 542,
        t.f('type','"static_image"',542) || t.f('static_image_source','"own"',542) || t.f('static_uploaded_image_id', to_jsonb(ui::text), 542)));
  PERFORM t.eq(r->>'status', 'applied', 'widget Imagen estática con imagen propia: se crea');
  r := t.push1(d1, 0, t.chg(543, 'widget', t.id('wS2'), 'upsert', 543,
        t.f('type','"static_image"',543) || t.f('static_image_source','"own"',543) || t.f('static_uploaded_image_id', to_jsonb(gen_random_uuid()::text), 543)));
  PERFORM t.eq(r->>'reason', 'parent_deleted', 'widget Imagen estática con imagen inexistente -> parent_deleted');

  -- Carrusel: máximo 10 imágenes (el catálogo de prueba lo crea el equipo con la clave de servicio)
  r := t.push1(d1, 0, t.chg(550, 'widget', t.id('wC'), 'upsert', 550, t.f('type','"image_carousel"',550) || t.f('carousel_interval_seconds','4',550)));
  PERFORM t.eq(r->>'status', 'applied', 'carrusel: se crea con intervalo de 4 s');
  r := t.push1(d1, 0, t.chg(551, 'widget_carousel_item', t.id('ci0'), 'upsert', 551,
        t.f('widget_id', to_jsonb(t.id('wS')::text), 551) || t.f('source','"own"',551) || t.f('uploaded_image_id', to_jsonb(ui::text), 551) || t.f('position','1',551)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'carrusel: imagen de carrusel en un widget que no es Carrusel -> invalid_field');
  ch := '{}';
  FOR i IN 1..11 LOOP
    ch := ch || t.chg(560 + i, 'widget_carousel_item', t.id('ci' || i), 'upsert', 560 + i,
        t.f('widget_id', to_jsonb(t.id('wC')::text), 560 + i) || t.f('source','"own"',560 + i)
        || t.f('uploaded_image_id', to_jsonb(ui::text), 560 + i) || t.f('position', to_jsonb(i), 560 + i));
  END LOOP;
  r := t.push(d1, 0, ch);
  PERFORM t.eq((SELECT count(*) FROM widget_carousel_item WHERE widget_id = t.id('wC') AND deleted_at IS NULL), 10::bigint, 'carrusel: 10 imágenes vivas como máximo');
  PERFORM t.eq(t.res(r, 571)->>'status', 'deleted', 'carrusel: la 11.ª queda eliminada');
  r := t.push1(d1, 0, t.chg(580, 'widget', t.id('wC'), 'delete', 580));
  PERFORM t.eq((SELECT count(*) FROM widget_carousel_item WHERE widget_id = t.id('wC') AND deleted_at IS NULL), 0::bigint, 'cascada: al eliminar el carrusel se eliminan sus imágenes');

  -- Rechazos por forma
  r := t.push1(d1, 0, t.chg(590, 'card', gen_random_uuid(), 'upsert', 590, t.f('title','"Sin fecha"',590) || t.f('position','1',590)));
  PERFORM t.eq(r->>'reason', 'incomplete_create', 'creación sin campos obligatorios -> incomplete_create');
  r := t.push1(d1, 0, t.chg(591, 'card', gen_random_uuid(), 'upsert', 591,
        t.f('title', to_jsonb(repeat('x', 101)), 591) || t.f('due_date','"2026-12-01"',591) || t.f('position','1',591)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'título de 101 caracteres -> invalid_field');
  r := t.push1(d1, 0, t.chg(592, 'card', t.id('X'), 'upsert', 592, t.f('inventado','1',592)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'campo inexistente -> invalid_field');
  r := t.push1(d1, 0, t.chg(593, 'profile', t.id('A'), 'upsert', 593, t.f('alias','"Otro"',593)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'profile no se escribe (solo bajada) -> invalid_field');
  r := t.push1(d1, 0, t.chg(594, 'card', t.id('X'), 'upsert', 594, t.f('due_date','"2026-13-45"',594)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'fecha inválida -> invalid_field');
  r := t.push1(d1, 0, t.chg(595, 'card', t.id('X'), 'upsert', 595, t.f('priority','"urgente"',595)));
  PERFORM t.eq(r->>'reason', 'invalid_field', 'prioridad fuera de valores -> invalid_field');
  PERFORM t.eq((SELECT priority FROM card WHERE id = t.id('X')), 'high', 'los cambios rechazados no dejan rastro');
END $$;

\echo '-- 4.6 sync_pull: cursor, páginas, tombstones y aislamiento'
DO $$
DECLARE
  d1 uuid := t.id('dev1'); cur bigint := 0; r jsonb; e jsonb; pages int := 0; total int := 0; tomb int := 0; last_seq bigint := 0;
  expected bigint; s bigint; push jsonb;
BEGIN
  SELECT (SELECT count(*) FROM profile) + (SELECT count(*) FROM user_preference) + (SELECT count(*) FROM kanban_column)
       + (SELECT count(*) FROM card) + (SELECT count(*) FROM label) + (SELECT count(*) FROM card_label)
       + (SELECT count(*) FROM uploaded_image) + (SELECT count(*) FROM theme) + (SELECT count(*) FROM applied_theme)
       + (SELECT count(*) FROM widget) + (SELECT count(*) FROM theme_widget) + (SELECT count(*) FROM widget_carousel_item)
    INTO expected;
  LOOP
    r := public.sync_pull(cur, 7);
    pages := pages + 1;
    IF jsonb_array_length(r->'rows') > 7 THEN RAISE EXCEPTION 'FALLO: una página trae más de 7 filas'; END IF;
    FOR e IN SELECT x FROM jsonb_array_elements(r->'rows') x LOOP
      s := (e->>'updated_seq')::bigint;
      IF s <= last_seq THEN RAISE EXCEPTION 'FALLO: filas no ordenadas por updated_seq (% después de %)', s, last_seq; END IF;
      last_seq := s; total := total + 1;
      IF e->>'deleted_at' IS NOT NULL THEN tomb := tomb + 1; END IF;
    END LOOP;
    cur := (r->>'next_seq')::bigint;
    EXIT WHEN NOT (r->>'has_more')::boolean;
  END LOOP;
  PERFORM t.ok(pages > 1, 'pull: la descarga se pagina (' || pages || ' páginas de 7)');
  PERFORM t.eq(total::bigint, expected, 'pull: se descargan todas las filas propias, una sola vez (' || total || ')');
  PERFORM t.ok(tomb > 0, 'pull: las filas eliminadas viajan como tombstones (' || tomb || ')');
  PERFORM t.ok(last_seq = cur, 'pull: next_seq = última updated_seq entregada');
  r := public.sync_pull(cur, 500);
  PERFORM t.eq(jsonb_array_length(r->'rows'), 0, 'pull: con el cursor al día no hay filas nuevas');
  PERFORM t.eq((r->>'has_more')::boolean, false, 'pull: has_more = false al terminar');
  PERFORM t.eq((r->>'next_seq')::bigint, cur, 'pull: sin filas, next_seq no retrocede');
  -- Un cambio nuevo aparece en la siguiente consulta, y solo ese
  push := t.push1(d1, 0, t.chg(900, 'card', t.id('X'), 'upsert', 900, t.f('description','"cambio nuevo"',900)));
  r := public.sync_pull(cur, 500);
  PERFORM t.eq(jsonb_array_length(r->'rows'), 1, 'pull: tras un cambio, la consulta incremental trae solo esa fila');
  PERFORM t.eq(r->'rows'->0->>'entity_id', t.id('X')::text, 'pull: la fila es la tarjeta modificada');
  PERFORM t.eq(r->'rows'->0->'fields'->>'description', 'cambio nuevo', 'pull: trae el valor nuevo');
  PERFORM t.ok(r->'rows'->0->'field_mods' ? 'description', 'pull: trae field_mods para que el Núcleo compare por campo');
  PERFORM t.throws($q$SELECT public.sync_pull(0, 0)$q$, 'invalid_limit', 'pull: límite 0 -> invalid_limit');
  PERFORM t.throws($q$SELECT public.sync_pull(0, 1001)$q$, 'invalid_limit', 'pull: límite 1001 -> invalid_limit');
  PERFORM t.ok((public.sync_pull(NULL, 5)->>'next_seq') IS NOT NULL, 'pull: since nulo equivale a 0');
END $$;
RESET ROLE;

\echo ''
\echo '== 5. Catálogos, mantenimiento y borrado de cuenta'
-- ---------------------------------------------------------------------------
DO $$
DECLARE v integer; r jsonb;
BEGIN
  SELECT version INTO v FROM catalog_meta;
  INSERT INTO catalog_image (id, name, storage_path, thumbnail_path, width, height) VALUES ('img-prueba', 'Imagen de prueba', 'images/p.jpg', 'images/thumbs/p.jpg', 1920, 1080);
  INSERT INTO catalog_color (id, name, hex, is_active) VALUES ('oculto', 'Oculto', '#112233', false);
  PERFORM t.eq((SELECT version FROM catalog_meta), v + 2, 'catalog_meta.version sube con cada cambio de un catálogo (D-198)');
  v := v + 2;
  PERFORM set_config('request.jwt.claim.sub', t.id('A')::text, false);
  SET LOCAL ROLE authenticated;
  r := public.catalog_pull(v);
  PERFORM t.eq((r->>'unchanged')::boolean, true, 'catalog_pull: misma versión -> unchanged');
  r := public.catalog_pull(v - 1);
  PERFORM t.eq((r->>'unchanged')::boolean, false, 'catalog_pull: versión distinta -> trae los catálogos');
  PERFORM t.eq(jsonb_array_length(r->'colors'), 9, 'catalog_pull: 9 colores activos (el inactivo no se entrega)');
  PERFORM t.eq(jsonb_array_length(r->'templates'), 1, 'catalog_pull: 1 plantilla');
  PERFORM t.eq(jsonb_array_length(r->'fonts'), 5, 'catalog_pull: 5 tipografías (con Nunito, WG-MK-01)');
  PERFORM t.eq(jsonb_array_length(r->'palettes'), 3, 'catalog_pull: 3 paletas');
  PERFORM t.eq(jsonb_array_length(r->'images'), 1, 'catalog_pull: 1 imagen');
  PERFORM t.eq((SELECT count(*) FROM catalog_color WHERE id = 'oculto'), 0::bigint, 'RLS: el color inactivo no se ve');
  PERFORM t.ok((r->'templates'->0->>'is_default')::boolean, 'catalog_pull: la plantilla es la de por defecto');
  RESET ROLE;
END $$;

-- Purga de tombstones (7.2): primero los hijos; no se purga un padre que alguna fila aún referencia
DO $$
DECLARE n integer; col1 uuid := t.id('col1');
BEGIN
  UPDATE card SET deleted_at = now() - interval '100 days' WHERE id = t.id('R');                      -- tarjeta eliminada hace 100 días
  UPDATE label SET deleted_at = now() - interval '100 days' WHERE id = t.id('L1');                    -- etiqueta con sus card_label
  UPDATE card_label SET deleted_at = now() - interval '100 days' WHERE id IN (t.id('CL1'), t.id('CL2'));
  UPDATE card SET column_id = col1 WHERE id = t.id('Y');                                              -- Y sigue usando col1
  UPDATE kanban_column SET deleted_at = now() - interval '100 days' WHERE id = col1;
  UPDATE card SET deleted_at = now() - interval '10 days' WHERE id = t.id('P');                       -- reciente: no se purga
  n := public.purge_tombstones();
  PERFORM t.ok(n >= 3, 'purge_tombstones: borra lo eliminado hace más de 90 días (' || n || ' filas)');
  PERFORM t.eq((SELECT count(*) FROM card WHERE id = t.id('R')), 0::bigint, 'purge: la tarjeta antigua se borró definitivamente');
  PERFORM t.eq((SELECT count(*) FROM label WHERE id = t.id('L1')) + (SELECT count(*) FROM card_label WHERE id = t.id('CL2')), 0::bigint, 'purge: etiqueta y su unión antigua se borraron (hijos primero)');
  PERFORM t.eq((SELECT count(*) FROM kanban_column WHERE id = col1), 1::bigint, 'purge: una columna que aún referencia una tarjeta no se purga');
  PERFORM t.eq((SELECT count(*) FROM card WHERE id = t.id('P')), 1::bigint, 'purge: lo eliminado hace 10 días se conserva');
  PERFORM t.eq((SELECT count(*) FROM card WHERE id = t.id('X')), 1::bigint, 'purge: lo vivo no se toca');
END $$;

-- Purga de altas sin verificar (7.2)
INSERT INTO auth.users (id, email, created_at) VALUES
  (t.id('old_unconf'), 'viejo@example.com', now() - interval '2 hours'),
  (t.id('new_unconf'), 'nuevo@example.com', now() - interval '5 minutes');
DO $$
DECLARE n integer;
BEGIN
  n := public.purge_unconfirmed_users();
  PERFORM t.eq(n, 1, 'purge_unconfirmed_users: borra el alta sin verificar de hace más de 1 hora');
  PERFORM t.eq((SELECT count(*) FROM auth.users WHERE id = t.id('old_unconf')), 0::bigint, 'purge: el alta antigua desapareció (puede volver a registrarse)');
  PERFORM t.eq((SELECT count(*) FROM auth.users WHERE id = t.id('new_unconf')), 1::bigint, 'purge: el alta reciente se conserva');
  PERFORM t.eq((SELECT count(*) FROM auth.users WHERE id = t.id('A')), 1::bigint, 'purge: las cuentas verificadas no se tocan');
  PERFORM t.eq(public.email_is_registered('nuevo@example.com'), false, 'email_is_registered: un correo sin verificar cuenta como no registrado');
END $$;

-- Borrar la cuenta borra todos sus datos (ON DELETE CASCADE desde auth.users)
DO $$
DECLARE c uuid := t.id('C'); n bigint;
BEGIN
  PERFORM t.ok((SELECT count(*) FROM card WHERE user_id = c) + (SELECT count(*) FROM widget WHERE user_id = c) > 0, 'cuenta C: tiene datos antes de borrarla');
  DELETE FROM auth.users WHERE id = c;
  SELECT (SELECT count(*) FROM profile WHERE user_id = c) + (SELECT count(*) FROM user_preference WHERE user_id = c)
       + (SELECT count(*) FROM kanban_column WHERE user_id = c) + (SELECT count(*) FROM card WHERE user_id = c)
       + (SELECT count(*) FROM label WHERE user_id = c) + (SELECT count(*) FROM card_label WHERE user_id = c)
       + (SELECT count(*) FROM uploaded_image WHERE user_id = c) + (SELECT count(*) FROM theme WHERE user_id = c)
       + (SELECT count(*) FROM applied_theme WHERE user_id = c) + (SELECT count(*) FROM widget WHERE user_id = c)
       + (SELECT count(*) FROM theme_widget WHERE user_id = c) + (SELECT count(*) FROM widget_carousel_item WHERE user_id = c) INTO n;
  PERFORM t.eq(n, 0::bigint, 'borrar la cuenta: no queda ninguna fila suya en ninguna tabla');
END $$;

\o
\echo ''
\echo 'pruebas.sql: sin fallos'
