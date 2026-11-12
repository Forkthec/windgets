-- ============================================================================
-- Windgets · 0002_rls.sql
-- Seguridad por fila (RNF-21, D-192). El ejecutable solo trae la URL del proyecto
-- y la clave pública (anon): toda la protección de los datos es esta.
--   * Todas las tablas de public: ENABLE + FORCE ROW LEVEL SECURITY.
--   * anon no tiene permisos sobre ninguna tabla.
--   * Las entidades sincronizadas solo se ESCRIBEN con sync_push (SECURITY
--     DEFINER, D-189); authenticated solo las lee, y solo las suyas.
--   * Los catálogos son de solo lectura y solo para filas activas.
--   * external_cache no tiene políticas: solo las Edge Functions (service_role).
-- Nota: FORCE RLS exige que el dueño de las funciones SECURITY DEFINER tenga
-- BYPASSRLS. En Supabase el rol postgres lo tiene.
-- ============================================================================

-- Supabase concede por defecto todo a anon/authenticated sobre lo nuevo de public:
-- se revoca y se concede solo lo necesario.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t text;
  synced text[] := ARRAY['user_preference','kanban_column','card','label','card_label',
                         'uploaded_image','theme','applied_theme','widget','theme_widget',
                         'widget_carousel_item'];
  catalogs text[] := ARRAY['catalog_template','catalog_font','catalog_palette','catalog_image',
                           'catalog_animation','catalog_color'];
BEGIN
  -- Perfil: solo lectura de la propia fila (HE-01-HU05; el alias no se cambia)
  EXECUTE 'ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.profile FORCE ROW LEVEL SECURITY';
  EXECUTE 'GRANT SELECT ON public.profile TO authenticated';
  EXECUTE 'CREATE POLICY profile_select_own ON public.profile FOR SELECT TO authenticated
           USING (user_id = (SELECT auth.uid()))';

  -- Entidades sincronizadas: SELECT de lo propio, sin INSERT/UPDATE/DELETE (solo sync_push)
  FOREACH t IN ARRAY synced LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
                    USING (user_id = (SELECT auth.uid()))', t || '_select_own', t);
  END LOOP;

  -- Catálogos: SELECT de filas activas (RNF-21; D-198)
  FOREACH t IN ARRAY catalogs LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
                    USING (is_active = true)', t || '_select_active', t);
  END LOOP;

  -- Versión de los catálogos: legible por cualquier usuario autenticado
  EXECUTE 'ALTER TABLE public.catalog_meta ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.catalog_meta FORCE ROW LEVEL SECURITY';
  EXECUTE 'GRANT SELECT ON public.catalog_meta TO authenticated';
  EXECUTE 'CREATE POLICY catalog_meta_select ON public.catalog_meta FOR SELECT TO authenticated USING (true)';

  -- Caché de clima y noticias: RLS activo y SIN políticas ni permisos (D-192)
  EXECUTE 'ALTER TABLE public.external_cache ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.external_cache FORCE ROW LEVEL SECURITY';
END $$;

-- service_role (Edge Functions) conserva acceso total por BYPASSRLS y por permisos.
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
