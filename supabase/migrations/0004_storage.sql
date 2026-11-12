-- ============================================================================
-- Windgets · 0004_storage.sql
-- Buckets de Supabase Storage y sus políticas (sección 9; RNF-21, RNF-22, RNF-23; D-180, D-198).
-- Las políticas se crean sobre storage.objects, que ya tiene RLS activo en Supabase.
-- ============================================================================

-- user-images: privado; una carpeta por usuario; 20 MB y solo JPG/PNG (RNF-22, RNF-23; HE-02-HU03-ET04)
-- catalog: privado; lectura para usuarios con sesión; sin escritura desde la aplicación (D-180, D-198)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('user-images', 'user-images', false, 20971520, ARRAY['image/jpeg','image/png']),
  ('catalog',     'catalog',     false, NULL,     NULL)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS user_images_select ON storage.objects;
DROP POLICY IF EXISTS user_images_insert ON storage.objects;
DROP POLICY IF EXISTS user_images_delete ON storage.objects;
DROP POLICY IF EXISTS catalog_select     ON storage.objects;

-- Cada usuario solo ve su carpeta: {user_id}/...
CREATE POLICY user_images_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Solo se sube a {user_id}/{id}.{jpg|jpeg|png} (misma forma que uploaded_image.storage_path).
-- Sin UPDATE: una imagen no se sobrescribe, se elimina y se sube otra.
CREATE POLICY user_images_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-images'
          AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
          AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png)$');

CREATE POLICY user_images_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Catálogo: lectura para cualquier usuario con sesión; nadie escribe desde la aplicación
CREATE POLICY catalog_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'catalog');
