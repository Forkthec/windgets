-- ============================================================================
-- Windgets · 0003_funciones.sql
-- Disparadores, sync_push / sync_pull, keepalive, semilla por cuenta y trabajos de purga.
-- Fuente: modelo de datos (secciones 7 y 8) y contratos RPC-01 a RPC-06.
--
-- Errores de negocio: se lanzan con SQLSTATE 'WG001' y el código como mensaje
-- (por ejemplo 'limit_columns'). sync_push los traduce a `rejected:<código>` por cambio.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Disparadores de las entidades
-- ----------------------------------------------------------------------------

-- D-049: cursor de descarga incremental. Secuencia global; no es una hora.
CREATE FUNCTION public.set_updated_seq() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  NEW.updated_seq := nextval('public.sync_seq');
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profile','user_preference','kanban_column','card','label','card_label',
      'uploaded_image','theme','applied_theme','widget','theme_widget','widget_carousel_item'] LOOP
    EXECUTE format('CREATE TRIGGER trg_z_updated_seq BEFORE INSERT OR UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.set_updated_seq()', t);
  END LOOP;
END $$;

-- Límite de filas vivas por usuario. Argumentos: máximo y código de error.
-- Columnas 10 (HE-09-HU03-ET07; D-167), etiquetas 20 (HE-08-HU02-ET06), temas 10 (HE-03-HU02-ET05; D-035).
-- Se evalúa al crear y al resucitar una fila eliminada. El bloqueo por usuario evita que dos
-- transacciones simultáneas superen el límite y mantiene en orden los updated_seq de cada usuario.
CREATE FUNCTION public.enforce_limit() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_n integer;
BEGIN
  IF NEW.deleted_at IS NULL AND (TG_OP = 'INSERT' OR OLD.deleted_at IS NOT NULL) THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('windgets:' || NEW.user_id::text, 0));
    EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1 AND deleted_at IS NULL AND id <> $2', TG_TABLE_NAME)
      INTO v_n USING NEW.user_id, NEW.id;
    IF v_n >= TG_ARGV[0]::integer THEN
      RAISE EXCEPTION '%', TG_ARGV[1] USING ERRCODE = 'WG001';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_limit_columns BEFORE INSERT OR UPDATE ON public.kanban_column
  FOR EACH ROW EXECUTE FUNCTION public.enforce_limit(10, 'limit_columns');
CREATE TRIGGER trg_limit_labels  BEFORE INSERT OR UPDATE ON public.label
  FOR EACH ROW EXECUTE FUNCTION public.enforce_limit(20, 'limit_labels');
CREATE TRIGGER trg_limit_themes  BEFORE INSERT OR UPDATE ON public.theme
  FOR EACH ROW EXECUTE FUNCTION public.enforce_limit(10, 'limit_themes');

-- Columnas por defecto: no se eliminan y conservan su función aunque se renombren
-- (HE-09-HU06-ET02; HE-09-HU04-ET06).
CREATE FUNCTION public.guard_kanban_column() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'invalid_field' USING ERRCODE = 'WG001';
  END IF;
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL AND OLD.role <> 'custom' THEN
    RAISE EXCEPTION 'invalid_field' USING ERRCODE = 'WG001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_kanban_column BEFORE UPDATE ON public.kanban_column
  FOR EACH ROW EXECUTE FUNCTION public.guard_kanban_column();

-- Widgets: el tipo no cambia; los widgets por defecto no se eliminan (HE-04-HU13-ET04);
-- el Carrusel de imágenes nace con 5 s si no se indica el intervalo (HE-04-HU08-ET04).
CREATE FUNCTION public.guard_widget() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'image_carousel' AND NEW.carousel_interval_seconds IS NULL THEN
      NEW.carousel_interval_seconds := 5;
    END IF;
  ELSE
    IF NEW.type IS DISTINCT FROM OLD.type THEN
      RAISE EXCEPTION 'invalid_field' USING ERRCODE = 'WG001';
    END IF;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL AND OLD.is_default THEN
      RAISE EXCEPTION 'invalid_field' USING ERRCODE = 'WG001';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_widget BEFORE INSERT OR UPDATE ON public.widget
  FOR EACH ROW EXECUTE FUNCTION public.guard_widget();

-- El tema aplicado no se elimina (HE-03-HU05-ET03; D-037).
CREATE FUNCTION public.guard_theme_delete() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.applied_theme a WHERE a.theme_id = OLD.id) THEN
    RAISE EXCEPTION 'applied_theme' USING ERRCODE = 'WG001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_theme_delete BEFORE UPDATE ON public.theme
  FOR EACH ROW EXECUTE FUNCTION public.guard_theme_delete();

-- Las imágenes del carrusel solo cuelgan de un widget Carrusel de imágenes (HE-04-HU08-ET02).
CREATE FUNCTION public.guard_carousel_parent() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.widget w WHERE w.id = NEW.widget_id AND w.type = 'image_carousel') THEN
    RAISE EXCEPTION 'invalid_field' USING ERRCODE = 'WG001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_carousel_parent BEFORE INSERT OR UPDATE OF widget_id ON public.widget_carousel_item
  FOR EACH ROW EXECUTE FUNCTION public.guard_carousel_parent();

-- Los colores #RRGGBB se guardan en mayúsculas (HE-02-HU05-ET06).
CREATE FUNCTION public.normalize_hex_colors() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  NEW.color_primary   := upper(NEW.color_primary);
  NEW.color_secondary := upper(NEW.color_secondary);
  NEW.color_text      := upper(NEW.color_text);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_upper_colors BEFORE INSERT OR UPDATE ON public.theme
  FOR EACH ROW EXECUTE FUNCTION public.normalize_hex_colors();
CREATE TRIGGER trg_upper_colors BEFORE INSERT OR UPDATE ON public.applied_theme
  FOR EACH ROW EXECUTE FUNCTION public.normalize_hex_colors();

-- D-198: la versión de los catálogos sube con cada cambio de un catálogo.
CREATE FUNCTION public.bump_catalog_version() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.catalog_meta SET version = version + 1;
  RETURN NULL;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['catalog_template','catalog_font','catalog_palette','catalog_image',
                           'catalog_animation','catalog_color'] LOOP
    EXECUTE format('CREATE TRIGGER trg_bump_catalog_version AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_version()', t);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Disparadores sobre auth.users: alta y semilla por cuenta
-- ----------------------------------------------------------------------------

-- HE-01-HU01-ET07; HE-01-HU05-ET07: el correo tiene máximo 64 caracteres.
CREATE FUNCTION public.validate_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF char_length(coalesce(NEW.email, '')) > 64 THEN
    RAISE EXCEPTION 'email_too_long' USING ERRCODE = 'WG001';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_new_user BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_new_user();

-- Semilla por cuenta (sección 11.2). Se ejecuta cuando la cuenta queda verificada:
-- el código por correo es correcto (HE-01-HU03-ET09) o el alta ya llega confirmada (Google, HE-01-HU05-ET04).
-- Se hace en el servidor para que un segundo computador descargue estas filas en lugar de
-- crear duplicados (HE-15-HU04-ET14).
CREATE FUNCTION public.on_account_confirmed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_provider text;
  v_alias    text;
  v_tpl      public.catalog_template%ROWTYPE;
  v_theme    uuid := gen_random_uuid();
  v_w        uuid;
  r          record;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profile WHERE user_id = NEW.id) THEN
    RETURN NEW;                                   -- idempotente
  END IF;

  -- Alias (D-024; HE-01-HU05-ET05, ET06, ET12): correo → alias del registro; Google → nombre de la
  -- cuenta de Google; si falta, la parte del correo anterior a la @. Máximo 30 caracteres.
  v_provider := CASE WHEN coalesce(NEW.raw_app_meta_data->>'provider', 'email') = 'google'
                     THEN 'google' ELSE 'email' END;
  IF v_provider = 'google' THEN
    v_alias := left(btrim(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), 30);
  ELSE
    v_alias := left(btrim(coalesce(NEW.raw_user_meta_data->>'alias', '')), 30);
  END IF;
  v_alias := btrim(v_alias);
  IF v_alias = '' THEN
    v_alias := btrim(left(btrim(split_part(coalesce(NEW.email, ''), '@', 1)), 30));
  END IF;

  SELECT * INTO v_tpl FROM public.catalog_template WHERE is_default;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'seed_missing: no hay plantilla por defecto en catalog_template';
  END IF;

  INSERT INTO public.profile (user_id, alias, auth_provider) VALUES (NEW.id, v_alias, v_provider);

  -- Preferencias: vista compacta (HE-09-HU07-ET02)
  INSERT INTO public.user_preference (id, user_id, board_card_view) VALUES (NEW.id, NEW.id, 'compact');

  -- Columnas por defecto (HE-09-HU01-ET02). Colores: Duda/propuesta (H-D-17).
  INSERT INTO public.kanban_column (id, user_id, name, color_id, role, position) VALUES
    (gen_random_uuid(), NEW.id, 'Por hacer',   'gray',  'todo',        1),
    (gen_random_uuid(), NEW.id, 'En progreso', 'blue',  'in_progress', 2),
    (gen_random_uuid(), NEW.id, 'Hecho',       'green', 'done',        3);

  -- Tema inicial «Mi tema» (HE-02-HU10-ET05; HE-03-HU01-ET04; D-032) y su copia aplicada
  INSERT INTO public.theme (id, user_id, name, template_id, background_source,
                            color_primary, color_secondary, color_text, font_id, font_size, palette_id)
  VALUES (v_theme, NEW.id, 'Mi tema', v_tpl.id, 'template_default',
          v_tpl.default_color_primary, v_tpl.default_color_secondary, v_tpl.default_color_text,
          v_tpl.default_font_id, 'medium', NULL);
  INSERT INTO public.applied_theme (id, user_id, theme_id, template_id, background_source,
                            color_primary, color_secondary, color_text, font_id, font_size)
  VALUES (NEW.id, NEW.id, v_theme, v_tpl.id, 'template_default',
          v_tpl.default_color_primary, v_tpl.default_color_secondary, v_tpl.default_color_text,
          v_tpl.default_font_id, 'medium');

  -- Cuatro widgets por defecto, activos, con posición y tamaño por defecto (HE-04-HU01-ET04, CA01).
  -- Valores en píxeles lógicos sobre 1920 x 1080 sin superposición: Duda/propuesta (H-D-18).
  FOR r IN SELECT * FROM (VALUES
      ('clock',       40,  40, 320, 160),
      ('calendar',    40, 220, 320, 340),
      ('daily_tasks', 380, 40, 360, 520),
      ('kanban',      760, 40, 640, 520)) AS d(type, x, y, w, h)
  LOOP
    v_w := gen_random_uuid();
    INSERT INTO public.widget (id, user_id, type, is_default) VALUES (v_w, NEW.id, r.type, true);
    INSERT INTO public.theme_widget (id, user_id, theme_id, widget_id, is_active, x, y, width, height, ref_width, ref_height)
    VALUES (gen_random_uuid(), NEW.id, v_theme, v_w, true, r.x, r.y, r.w, r.h, 1920, 1080);
  END LOOP;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_on_account_confirmed_insert AFTER INSERT ON auth.users
  FOR EACH ROW WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.on_account_confirmed();
CREATE TRIGGER trg_on_account_confirmed_update AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.on_account_confirmed();

-- ----------------------------------------------------------------------------
-- 3. Auxiliares de sincronización (datos_borrador 8)
-- ----------------------------------------------------------------------------

-- Entidades que escribe sync_push (profile es solo bajada).
CREATE FUNCTION public._sync_kinds() RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['user_preference','kanban_column','card','label','card_label','uploaded_image',
               'theme','applied_theme','widget','theme_widget','widget_carousel_item']
$$;

-- Campos que el cliente puede enviar por entidad (no incluye id, user_id, created_at,
-- field_mods, deleted_at ni updated_seq, que son del servidor).
CREATE FUNCTION public._sync_fields(p_kind text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_kind
    WHEN 'user_preference' THEN ARRAY['board_card_view']
    WHEN 'kanban_column'   THEN ARRAY['name','color_id','role','position']
    WHEN 'card'            THEN ARRAY['type','title','description','priority','due_date','column_id','position',
                                      'previous_column_id','completed_on','scheduled_date','scheduled_hour']
    WHEN 'label'           THEN ARRAY['name','color_id']
    WHEN 'card_label'      THEN ARRAY['card_id','label_id']
    WHEN 'uploaded_image'  THEN ARRAY['storage_path','mime_type','extension','size_bytes','width','height','sha256']
    WHEN 'theme'           THEN ARRAY['name','template_id','background_source','background_catalog_image_id',
                                      'background_uploaded_image_id','color_primary','color_secondary','color_text',
                                      'palette_id','font_id','font_size','last_modified_at']
    WHEN 'applied_theme'   THEN ARRAY['theme_id','template_id','background_source','background_catalog_image_id',
                                      'background_uploaded_image_id','color_primary','color_secondary','color_text',
                                      'font_id','font_size','applied_at']
    WHEN 'widget'          THEN ARRAY['type','is_default','weather_city','weather_geo_id','weather_latitude',
                                      'weather_longitude','text_content','static_image_source',
                                      'static_catalog_image_id','static_uploaded_image_id','animation_id',
                                      'carousel_interval_seconds']
    WHEN 'theme_widget'    THEN ARRAY['theme_id','widget_id','is_active','x','y','width','height','ref_width','ref_height']
    WHEN 'widget_carousel_item' THEN ARRAY['widget_id','source','catalog_image_id','uploaded_image_id','position']
  END
$$;

-- Campos obligatorios al crear (R3 `incomplete_create`): los NOT NULL sin valor por defecto.
-- column_id de la tarjeta no figura: si falta, se asigna la columna `todo` (R8).
CREATE FUNCTION public._sync_required(p_kind text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_kind
    WHEN 'user_preference' THEN ARRAY[]::text[]
    WHEN 'kanban_column'   THEN ARRAY['name','color_id','position']
    WHEN 'card'            THEN ARRAY['title','due_date','position']
    WHEN 'label'           THEN ARRAY['name','color_id']
    WHEN 'card_label'      THEN ARRAY['card_id','label_id']
    WHEN 'uploaded_image'  THEN ARRAY['storage_path','mime_type','extension','size_bytes','width','height','sha256']
    WHEN 'theme'           THEN ARRAY['name','template_id','color_primary','color_secondary','color_text','font_id']
    WHEN 'applied_theme'   THEN ARRAY['theme_id','template_id','color_primary','color_secondary','color_text','font_id']
    WHEN 'widget'          THEN ARRAY['type']
    WHEN 'theme_widget'    THEN ARRAY['theme_id','widget_id','x','y','width','height','ref_width','ref_height']
    WHEN 'widget_carousel_item' THEN ARRAY['widget_id','source','position']
  END
$$;

-- Referencias a filas del mismo usuario («campo:tabla»). Las de card se normalizan aparte (R8).
CREATE FUNCTION public._sync_refs(p_kind text) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_kind
    WHEN 'card_label'      THEN ARRAY['card_id:card','label_id:label']
    WHEN 'theme'           THEN ARRAY['background_uploaded_image_id:uploaded_image']
    WHEN 'applied_theme'   THEN ARRAY['theme_id:theme','background_uploaded_image_id:uploaded_image']
    WHEN 'widget'          THEN ARRAY['static_uploaded_image_id:uploaded_image']
    WHEN 'theme_widget'    THEN ARRAY['theme_id:theme','widget_id:widget']
    WHEN 'widget_carousel_item' THEN ARRAY['widget_id:widget','uploaded_image_id:uploaded_image']
    ELSE ARRAY[]::text[]
  END
$$;

-- Forma de una fila en las respuestas de sync_push y sync_pull (contrato RPC-02 / RPC-03).
-- Los instantes salen en RFC 3339 UTC con milisegundos y «Z», igual que la base local (1.1).
CREATE FUNCTION public._sync_shape(p_kind text, p_row jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_fields jsonb := p_row - 'id' - 'user_id' - 'field_mods' - 'deleted_at' - 'updated_seq';
  v_del    jsonb := p_row->'deleted_at';
  k        text;
BEGIN
  FOREACH k IN ARRAY ARRAY['created_at','last_modified_at','applied_at'] LOOP
    IF v_fields ? k THEN
      v_fields := jsonb_set(v_fields, ARRAY[k], to_jsonb(public._sync_iso((v_fields->>k)::timestamptz)));
    END IF;
  END LOOP;
  IF jsonb_typeof(v_del) = 'string' THEN
    v_del := to_jsonb(public._sync_iso((p_row->>'deleted_at')::timestamptz));
  END IF;
  RETURN jsonb_build_object(
    'entity_kind', p_kind,
    'entity_id',   coalesce(p_row->'id', p_row->'user_id'),
    'fields',      v_fields,
    'field_mods',  coalesce(p_row->'field_mods', '{}'::jsonb),
    'deleted_at',  v_del,
    'updated_seq', p_row->'updated_seq');
END $$;

CREATE FUNCTION public._sync_result(p_cid jsonb, p_status text, p_conflict boolean, p_reason text, p_row jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object('change_id', p_cid, 'status', p_status, 'conflict', p_conflict)
      || CASE WHEN p_reason IS NOT NULL THEN jsonb_build_object('reason', p_reason) ELSE '{}'::jsonb END
      || CASE WHEN p_row IS NOT NULL THEN jsonb_build_object('row', p_row) ELSE '{}'::jsonb END
$$;

-- Instante en formato RFC 3339 UTC con milisegundos (convención 1.1).
CREATE FUNCTION public._sync_iso(p_ts timestamptz) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT to_char(p_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
$$;

-- R2 / 8.3: hora del servidor = LEAST(hora_cliente + desfase, ahora). El tope impide que un reloj
-- adelantado gane siempre. Se trunca a milisegundos para que la hora guardada se pueda reenviar igual.
CREATE FUNCTION public._sync_corrected(p_text text, p_offset_ms bigint, p_now timestamptz) RETURNS timestamptz
LANGUAGE sql STABLE AS $$
  SELECT date_trunc('milliseconds', LEAST(p_text::timestamptz + p_offset_ms * interval '1 millisecond', p_now))
$$;

-- Comprueba que una fila referenciada exista, sea del mismo usuario y esté viva (R1; 8.5).
CREATE FUNCTION public._sync_ref_check(p_uid uuid, p_table text, p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_owner uuid; v_deleted timestamptz; v_found boolean;
BEGIN
  EXECUTE format('SELECT true, user_id, deleted_at FROM public.%I WHERE id = $1', p_table)
    INTO v_found, v_owner, v_deleted USING p_id;
  IF v_found IS NOT TRUE THEN
    RAISE EXCEPTION 'parent_deleted' USING ERRCODE = 'WG001';
  ELSIF v_owner <> p_uid THEN
    RAISE EXCEPTION 'not_owner' USING ERRCODE = 'WG001';
  ELSIF v_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'parent_deleted' USING ERRCODE = 'WG001';
  END IF;
END $$;

-- Fila viva que ya ocupa el nombre / rol / widget en conflicto (8.4: «con la fila existente»).
CREATE FUNCTION public._sync_find_existing(p_uid uuid, p_kind text, p_reason text, p_new jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_row jsonb;
BEGIN
  IF p_reason = 'duplicate_name' AND p_kind IN ('kanban_column','label','theme') THEN
    EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE t.user_id = $1 AND t.deleted_at IS NULL
                    AND lower(btrim(t.name)) = lower(btrim($2)) AND t.id <> $3 LIMIT 1', p_kind)
      INTO v_row USING p_uid, p_new->>'name', (p_new->>'id')::uuid;
  ELSIF p_reason = 'duplicate_role' AND p_kind = 'kanban_column' THEN
    SELECT to_jsonb(t) INTO v_row FROM public.kanban_column t
     WHERE t.user_id = p_uid AND t.deleted_at IS NULL AND t.role = p_new->>'role' AND t.id <> (p_new->>'id')::uuid LIMIT 1;
  ELSIF p_reason = 'duplicate_widget' AND p_kind = 'widget' THEN
    SELECT to_jsonb(t) INTO v_row FROM public.widget t
     WHERE t.user_id = p_uid AND t.deleted_at IS NULL AND t.id <> (p_new->>'id')::uuid
       AND ((t.type = p_new->>'type' AND p_new->>'type' <> 'weather')
         OR (t.type = 'weather' AND t.weather_geo_id = p_new->>'weather_geo_id')) LIMIT 1;
  END IF;
  RETURN CASE WHEN v_row IS NULL THEN NULL ELSE public._sync_shape(p_kind, v_row) END;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Aplicación de UN cambio (R1 a R11). Interna: la llama sync_push.
--    Cada cambio corre en su propio subbloque (SAVEPOINT): si falla, se revierte solo ese cambio.
-- ----------------------------------------------------------------------------
CREATE FUNCTION public._sync_apply_change(p_uid uuid, p_ch jsonb, p_offset_ms bigint, p_now timestamptz)
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
         WHERE c.id = r.id AND r.rn > 5 RETURNING c.id)
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

-- ----------------------------------------------------------------------------
-- 5. RPC (contratos RPC-01 a RPC-06)
-- ----------------------------------------------------------------------------

-- RPC-01: hora del servidor para medir el desfase del reloj (HE-15-HU03-ET05)
CREATE FUNCTION public.server_time() RETURNS timestamptz
LANGUAGE sql VOLATILE SET search_path = public, pg_temp AS $$ SELECT clock_timestamp() $$;

-- RPC-02: envío de cambios pendientes. D-048 por campo, D-189 combinación solo en el servidor.
CREATE FUNCTION public.sync_push(p_device_id uuid, p_clock_offset_ms bigint, p_changes jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_now     timestamptz := clock_timestamp();
  v_res     jsonb;
  v_results jsonb := '[]'::jsonb;
  v_max_seq bigint := 0;
  v_ch      jsonb;
  v_seq     bigint;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'WG401';
  END IF;
  IF p_changes IS NULL OR jsonb_typeof(p_changes) <> 'array' THEN
    RAISE EXCEPTION 'invalid_field' USING ERRCODE = 'WG001';
  END IF;
  IF jsonb_array_length(p_changes) > 200 THEN                    -- R12
    RAISE EXCEPTION 'too_many_changes' USING ERRCODE = 'WG001';
  END IF;
  IF abs(coalesce(p_clock_offset_ms, 0)) > 86400000 THEN         -- 8.3: más de 24 h
    RAISE EXCEPTION 'clock_out_of_range' USING ERRCODE = 'WG001';
  END IF;

  -- Un solo escritor por usuario a la vez: los updated_seq de un usuario se confirman en orden
  -- y sync_pull no se salta filas (cursor seguro).
  PERFORM pg_advisory_xact_lock(hashtextextended('windgets:' || v_uid::text, 0));

  -- Se procesan en el orden de change_id (HE-15-HU03-ET06)
  FOR v_ch IN
    SELECT e.value FROM jsonb_array_elements(p_changes) WITH ORDINALITY AS e(value, ord)
     ORDER BY CASE WHEN jsonb_typeof(e.value->'change_id') = 'number' THEN (e.value->>'change_id')::numeric END, e.ord
  LOOP
    v_res := public._sync_apply_change(v_uid, v_ch, coalesce(p_clock_offset_ms, 0), v_now);
    v_results := v_results || jsonb_build_array(v_res);
    v_seq := (v_res #>> '{row,updated_seq}')::bigint;
    IF v_seq IS NOT NULL AND v_seq > v_max_seq THEN v_max_seq := v_seq; END IF;
  END LOOP;

  RETURN jsonb_build_object('server_now', public._sync_iso(v_now), 'results', v_results, 'max_seq', v_max_seq);
END $$;

-- RPC-03: descarga incremental (D-049). SECURITY INVOKER: la RLS limita a las filas del usuario.
CREATE FUNCTION public.sync_pull(p_since_seq bigint, p_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp SET timezone = 'UTC' AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_k     text;
  v_part  jsonb;
  v_all   jsonb := '[]'::jsonb;
  v_rows  jsonb;
  v_since bigint := coalesce(p_since_seq, 0);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = 'WG401';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 1000 THEN
    RAISE EXCEPTION 'invalid_limit' USING ERRCODE = 'WG001';
  END IF;

  FOREACH v_k IN ARRAY (ARRAY['profile'] || public._sync_kinds()) LOOP
    EXECUTE format(
      'SELECT coalesce(jsonb_agg(public._sync_shape(%L, to_jsonb(t)) ORDER BY t.updated_seq), ''[]''::jsonb)
         FROM (SELECT * FROM public.%I WHERE user_id = $1 AND updated_seq > $2 ORDER BY updated_seq LIMIT $3) t',
      v_k, v_k) INTO v_part USING v_uid, v_since, p_limit + 1;
    v_all := v_all || v_part;
  END LOOP;

  SELECT coalesce(jsonb_agg(s.e ORDER BY (s.e->>'updated_seq')::bigint), '[]'::jsonb) INTO v_rows
    FROM (SELECT e FROM jsonb_array_elements(v_all) AS e ORDER BY (e->>'updated_seq')::bigint LIMIT p_limit) s;

  RETURN jsonb_build_object(
    'server_now', public._sync_iso(clock_timestamp()),
    'rows',       v_rows,
    'next_seq',   coalesce((SELECT max((e->>'updated_seq')::bigint) FROM jsonb_array_elements(v_rows) e), v_since),
    'has_more',   jsonb_array_length(v_all) > p_limit);
END $$;

-- RPC-04: descarga de catálogos solo si cambió la versión (D-198)
CREATE FUNCTION public.catalog_pull(p_known_version integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE v_ver integer;
BEGIN
  SELECT version INTO v_ver FROM public.catalog_meta WHERE id = 1;
  IF v_ver IS NOT DISTINCT FROM p_known_version THEN
    RETURN jsonb_build_object('version', v_ver, 'unchanged', true);
  END IF;
  RETURN jsonb_build_object(
    'version', v_ver, 'unchanged', false,
    'templates',  (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.sort_order, t.id), '[]') FROM public.catalog_template t),
    'fonts',      (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.sort_order, t.id), '[]') FROM public.catalog_font t),
    'palettes',   (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.sort_order, t.id), '[]') FROM public.catalog_palette t),
    'images',     (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.sort_order, t.id), '[]') FROM public.catalog_image t),
    'animations', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.sort_order, t.id), '[]') FROM public.catalog_animation t),
    'colors',     (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.sort_order, t.id), '[]') FROM public.catalog_color t));
END $$;

-- RPC-05: ¿el correo ya tiene una cuenta verificada? (HE-01-HU01-CA08; Duda/propuesta H-C-09)
CREATE FUNCTION public.email_is_registered(p_email text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
DECLARE v text := btrim(p_email);
BEGIN
  IF v IS NULL OR v = '' OR char_length(v) > 64 OR position('@' IN v) = 0 THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = 'WG001';
  END IF;
  RETURN EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(v) AND u.email_confirmed_at IS NOT NULL);
END $$;

-- RPC-06: evita la pausa del plan gratuito por inactividad (D-133, D-197; HE-15-HU01-ET09)
CREATE FUNCTION public.keepalive() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM 1 FROM public.catalog_meta LIMIT 1;
  RETURN jsonb_build_object('ok', true, 'at', public._sync_iso(clock_timestamp()));
END $$;

-- ----------------------------------------------------------------------------
-- 6. Trabajos de purga (7.2). Sin API: solo los programa pg_cron.
-- ----------------------------------------------------------------------------

-- Borra definitivamente las filas eliminadas hace más de 90 días (8.6; Duda/propuesta).
-- Orden: primero los hijos; un padre no se purga mientras alguna fila lo referencie.
CREATE FUNCTION public.purge_tombstones() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_lim timestamptz := now() - interval '90 days'; v_n integer := 0; v_c integer;
BEGIN
  DELETE FROM public.card_label WHERE deleted_at < v_lim;                GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.theme_widget WHERE deleted_at < v_lim;              GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.widget_carousel_item WHERE deleted_at < v_lim;      GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.card c WHERE c.deleted_at < v_lim
     AND NOT EXISTS (SELECT 1 FROM public.card_label x WHERE x.card_id = c.id);              GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.label l WHERE l.deleted_at < v_lim
     AND NOT EXISTS (SELECT 1 FROM public.card_label x WHERE x.label_id = l.id);             GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.widget w WHERE w.deleted_at < v_lim
     AND NOT EXISTS (SELECT 1 FROM public.theme_widget x WHERE x.widget_id = w.id)
     AND NOT EXISTS (SELECT 1 FROM public.widget_carousel_item x WHERE x.widget_id = w.id);  GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.theme t WHERE t.deleted_at < v_lim
     AND NOT EXISTS (SELECT 1 FROM public.theme_widget x WHERE x.theme_id = t.id)
     AND NOT EXISTS (SELECT 1 FROM public.applied_theme x WHERE x.theme_id = t.id);          GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.kanban_column k WHERE k.deleted_at < v_lim
     AND NOT EXISTS (SELECT 1 FROM public.card x WHERE x.column_id = k.id OR x.previous_column_id = k.id); GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  DELETE FROM public.uploaded_image u WHERE u.deleted_at < v_lim
     AND NOT EXISTS (SELECT 1 FROM public.theme x WHERE x.background_uploaded_image_id = u.id)
     AND NOT EXISTS (SELECT 1 FROM public.applied_theme x WHERE x.background_uploaded_image_id = u.id)
     AND NOT EXISTS (SELECT 1 FROM public.widget x WHERE x.static_uploaded_image_id = u.id)
     AND NOT EXISTS (SELECT 1 FROM public.widget_carousel_item x WHERE x.uploaded_image_id = u.id); GET DIAGNOSTICS v_c = ROW_COUNT; v_n := v_n + v_c;
  RETURN v_n;
END $$;

-- Borra las altas con correo sin verificar creadas hace más de 1 hora, para que quien no
-- terminó el registro pueda volver a intentarlo (HE-01-HU03-ET09; Duda/propuesta).
CREATE FUNCTION public.purge_unconfirmed_users() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_n integer;
BEGIN
  DELETE FROM auth.users WHERE email_confirmed_at IS NULL AND created_at < now() - interval '1 hour';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $$;

-- Programación con pg_cron si la extensión está disponible (en Supabase se habilita desde el panel).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    PERFORM cron.schedule('windgets_purge_tombstones', '17 3 * * *', 'SELECT public.purge_tombstones()');
    PERFORM cron.schedule('windgets_purge_unconfirmed_users', '7 * * * *', 'SELECT public.purge_unconfirmed_users()');
  ELSE
    RAISE NOTICE 'pg_cron no está disponible: programe purge_tombstones() (diaria) y purge_unconfirmed_users() (cada hora) por otro medio.';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Permisos de ejecución
-- ----------------------------------------------------------------------------
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Usuario con sesión: los RPC del contrato y los auxiliares puros que usa sync_pull (SECURITY INVOKER)
GRANT EXECUTE ON FUNCTION public.server_time()                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_push(uuid, bigint, jsonb)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_pull(bigint, integer)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.catalog_pull(integer)                      TO authenticated;
GRANT EXECUTE ON FUNCTION public._sync_kinds()                              TO authenticated;
GRANT EXECUTE ON FUNCTION public._sync_shape(text, jsonb)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public._sync_iso(timestamptz)                     TO authenticated;
-- anon (antes de tener cuenta) y usuario con sesión
GRANT EXECUTE ON FUNCTION public.email_is_registered(text)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.keepalive()                                TO anon, authenticated;
-- service_role (Edge Functions, GitHub Actions con clave de servicio)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
