-- ============================================================================
-- Windgets · pruebas_temas_windgets.sql
-- Pruebas de la migración 0010_temas_windgets.sql (IM-01; docs/rediseno.md RD-94) sobre las migraciones reales del
-- repositorio. ejecutar_pruebas.sh la corre en una base con el sustituto de Supabase y 0001 a 0004, y le pasa
-- `-v repo=<carpeta supabase/>`. Reproduce la historia de la nube: la semilla de entonces, 0005 a 0009, cuentas
-- con temas guardados y después 0010. Cualquier fallo lanza una excepción 'FALLO: ...' y detiene el script.
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

-- La semilla anterior a 0005, con lo que usan estas pruebas: la tipografía y la plantilla por defecto de entonces,
-- los colores de las columnas iniciales y la versión del catálogo.
INSERT INTO public.catalog_font (id, family_name, display_name, file_path, license, sort_order)
VALUES ('inter', 'Inter', 'Inter', 'fonts/inter.woff2', 'OFL-1.1', 1);
INSERT INTO public.catalog_template
  (id, name, thumbnail_path, bundle_path, default_background_path,
   default_color_primary, default_color_secondary, default_color_text, default_font_id, is_default, sort_order)
VALUES
  ('default', 'Windgets', 'templates/default/thumbnail.png', 'templates/default/', 'templates/default/background.jpg',
   '#96B2B2', '#829890', '#14201C', 'inter', true, 1);
INSERT INTO public.catalog_color (id, name, hex, sort_order) VALUES
  ('gray', 'Gris', '#8A8D98', 1), ('green', 'Verde', '#30A46C', 5), ('blue', 'Azul', '#3E63DD', 7);
INSERT INTO public.catalog_meta (id, version) VALUES (1, 1);

\i :repo/migrations/0005_search_path.sql
\i :repo/migrations/0006_tema_mockups.sql
\i :repo/migrations/0007_rediseno_cuenta.sql
\i :repo/migrations/0008_catalogo_p29.sql
\i :repo/migrations/0009_widget_windi.sql

-- Dos cuentas con temas guardados: una con la plantilla «default» y otra que eligió «claro» y la paleta «oscuro».
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.com',  now(), '{"alias":"Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@example.com', now(), '{"alias":"Beto"}');
UPDATE public.theme
   SET template_id = 'claro', palette_id = 'oscuro',
       color_primary = '#201B2B', color_secondary = '#5D566B', color_text = '#F8F5FF'
 WHERE user_id = '00000000-0000-0000-0000-00000000000b';

CREATE TABLE t.temas      AS TABLE public.theme;
CREATE TABLE t.aplicados  AS TABLE public.applied_theme;
CREATE TABLE t.plantillas AS TABLE public.catalog_template;
CREATE TABLE t.paletas    AS TABLE public.catalog_palette;
CREATE TABLE t.version    AS SELECT version FROM public.catalog_meta WHERE id = 1;

\i :repo/migrations/0010_temas_windgets.sql

SELECT t.eq((SELECT array_agg(id || '|' || name || '|' || is_default::text ORDER BY sort_order) FROM catalog_template),
            ARRAY['default|Windgets|false', 'claro|Windgets claro|true', 'oscuro|Windgets oscuro|false'],
            '0010: nombres de las plantillas y «Windgets claro» como la única por defecto');
SELECT t.eq((SELECT array_agg(id || '|' || name ORDER BY id) FROM catalog_palette WHERE id IN ('claro', 'oscuro')),
            ARRAY['claro|Windgets claro', 'oscuro|Windgets oscuro'],
            '0010: las paletas llevan los mismos nombres');
SELECT t.eq((SELECT count(*) FROM (
              SELECT to_jsonb(c) - 'name' - 'is_default' FROM catalog_template c
              EXCEPT SELECT to_jsonb(p) - 'name' - 'is_default' FROM t.plantillas p) x), 0::bigint,
            '0010: de las plantillas solo cambian el nombre y la marca de por defecto');
SELECT t.eq((SELECT count(*) FROM (
              SELECT to_jsonb(c) - 'name' FROM catalog_palette c
              EXCEPT SELECT to_jsonb(p) - 'name' FROM t.paletas p) x), 0::bigint,
            '0010: de las paletas solo cambia el nombre');
SELECT t.eq((SELECT count(*) FROM ((TABLE public.theme EXCEPT TABLE t.temas)
                                   UNION ALL (TABLE t.temas EXCEPT TABLE public.theme)) x), 0::bigint,
            '0010: ninguna fila de theme cambia');
SELECT t.eq((SELECT count(*) FROM ((TABLE public.applied_theme EXCEPT TABLE t.aplicados)
                                   UNION ALL (TABLE t.aplicados EXCEPT TABLE public.applied_theme)) x), 0::bigint,
            '0010: ningún tema aplicado cambia');
SELECT t.ok((SELECT count(*) FROM t.temas) = 2, '0010: la comprobación anterior mira temas que existían');
DO $$
BEGIN
  UPDATE public.catalog_template SET is_default = true WHERE id = 'default';
  RAISE EXCEPTION 'FALLO: se permitió una segunda plantilla por defecto';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'ok   - 0010: solo puede haber una plantilla por defecto';
END $$;

-- D-198: los clientes con la versión anterior descargan el cambio.
SELECT t.ok((SELECT version FROM catalog_meta WHERE id = 1) > (SELECT version FROM t.version),
            '0010: trg_bump_catalog_version sube la versión del catálogo');
SELECT t.eq((SELECT public.catalog_pull((SELECT version FROM t.version)) ->> 'unchanged'), 'false',
            '0010: catalog_pull entrega el catálogo a quien tiene la versión anterior');
SELECT t.eq((SELECT array_agg(e ->> 'name' ORDER BY e ->> 'id')
               FROM jsonb_array_elements(public.catalog_pull((SELECT version FROM t.version)) -> 'templates') e
              WHERE (e ->> 'is_default')::boolean),
            ARRAY['Windgets claro'], '0010: la descarga trae «Windgets claro» como plantilla por defecto');

-- Una cuenta nueva empieza con la plantilla por defecto (on_account_confirmed).
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-00000000000c', 'cami@example.com', now(), '{"alias":"Cami"}');
SELECT t.eq((SELECT array_agg(template_id || '|' || color_primary || '|' || color_secondary || '|' || color_text)
               FROM public.theme WHERE user_id = '00000000-0000-0000-0000-00000000000c'),
            ARRAY['claro|#F5F0FF|#B6A560|#17131D'], '0010: una cuenta nueva toma «Windgets claro»');

-- seed.sql se puede ejecutar después sin cambiar los nombres ni la plantilla por defecto.
\i :repo/seed.sql
SELECT t.eq((SELECT array_agg(id || '|' || name || '|' || is_default::text ORDER BY sort_order) FROM catalog_template),
            ARRAY['default|Windgets|false', 'claro|Windgets claro|true', 'oscuro|Windgets oscuro|false'],
            '0010: seed.sql después de la migración no cambia las plantillas');
