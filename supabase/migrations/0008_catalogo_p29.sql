-- ============================================================================
-- Windgets · 0008_catalogo_p29.sql
-- P29 · Catálogo de plantillas, paletas e imágenes (decisión de Paula, 23-nov-2026):
--   - La plantilla por defecto «Windgets» toma los colores de la marca: principal #201B2B, secundario #DC026C,
--     texto #FFFFFF y la tipografía Rubik (antes #96B2B2, el tema de los prototipos WG-MK-01, 0006). Las demás
--     combinaciones de la marca con el cian #00D9E2 como secundario no cumplen el par tinta/superficie de 7:1
--     (R-13), por eso el cian queda en la imagen de fondo y en la paleta «Windgets».
--   - Plantillas genéricas «Claro» y «Oscuro» con los colores de sus paletas (0007).
--   - Seis paletas nuevas; todas cumplen los tres pares de R-13 (7:1, 4.5:1 y 3:1).
--   - Seis imágenes de degradado de 3840 × 2160 para el catálogo de imágenes.
-- Los temas que ya guardó cada persona no cambian. El disparador trg_bump_catalog_version sube
-- catalog_meta.version, así los clientes descargan el cambio.
-- ANTES de aplicarla en la nube, los archivos deben estar en el bucket `catalog` (templates/claro/,
-- templates/oscuro/, templates/default/ e images/): una fila sin su archivo deja la miniatura vacía.
-- Solo cambia datos, no el esquema: no tiene equivalente en docs/local/. En una base nueva corre antes que
-- seed.sql; la semilla crea las filas con los mismos valores.
-- ============================================================================
UPDATE public.catalog_template
   SET default_color_primary   = '#201B2B',
       default_color_secondary = '#DC026C',
       default_color_text      = '#FFFFFF',
       default_font_id         = 'rubik'
 WHERE id = 'default';

INSERT INTO public.catalog_template
  (id, name, thumbnail_path, bundle_path, default_background_path,
   default_color_primary, default_color_secondary, default_color_text, default_font_id, is_default, sort_order)
VALUES
  ('claro',  'Claro',  'templates/claro/thumbnail.png',  'templates/claro/',  'templates/claro/background.jpg',
   '#F5F0FF', '#B6A560', '#17131D', 'rubik', false, 2),
  ('oscuro', 'Oscuro', 'templates/oscuro/thumbnail.png', 'templates/oscuro/', 'templates/oscuro/background.jpg',
   '#201B2B', '#5D566B', '#F8F5FF', 'rubik', false, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.catalog_palette (id, name, color_primary, color_secondary, color_text, sort_order) VALUES
  ('aurora',     'Aurora',     '#0E2A3B', '#2BB3A3', '#F2FFFC', 4),
  ('bosque',     'Bosque',     '#1E3A2B', '#4F7F5C', '#F3FFF6', 5),
  ('atardecer',  'Atardecer',  '#3B1E2E', '#E0613A', '#FFF5EE', 6),
  ('lavanda',    'Lavanda',    '#EDE7FF', '#7C5CC4', '#1B1430', 7),
  ('arena',      'Arena',      '#F7EFE2', '#A07C4A', '#2A1F12', 8),
  ('medianoche', 'Medianoche', '#0B1226', '#3E63DD', '#EEF2FF', 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.catalog_image (id, name, storage_path, thumbnail_path, width, height, sort_order) VALUES
  ('degradado-amanecer',   'Amanecer',   'images/degradado-amanecer.jpg',   'images/degradado-amanecer-miniatura.png',   3840, 2160, 1),
  ('degradado-oceano',     'Océano',     'images/degradado-oceano.jpg',     'images/degradado-oceano-miniatura.png',     3840, 2160, 2),
  ('degradado-bosque',     'Bosque',     'images/degradado-bosque.jpg',     'images/degradado-bosque-miniatura.png',     3840, 2160, 3),
  ('degradado-lavanda',    'Lavanda',    'images/degradado-lavanda.jpg',    'images/degradado-lavanda-miniatura.png',    3840, 2160, 4),
  ('degradado-medianoche', 'Medianoche', 'images/degradado-medianoche.jpg', 'images/degradado-medianoche-miniatura.png', 3840, 2160, 5),
  ('degradado-atardecer',  'Atardecer',  'images/degradado-atardecer.jpg',  'images/degradado-atardecer-miniatura.png',  3840, 2160, 6)
ON CONFLICT (id) DO NOTHING;
