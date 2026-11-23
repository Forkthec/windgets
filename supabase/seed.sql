-- ============================================================================
-- Windgets · seed.sql
-- Semilla del catálogo (sección 11.1) y valores por defecto. Se ejecuta después de las migraciones
-- (`supabase db reset` lo ejecuta solo). La semilla de cada cuenta NO está aquí: la crea el
-- disparador on_account_confirmed al verificar la cuenta (0003).
--
-- El backlog no fija los nombres ni la cantidad de elementos de los catálogos (H-D-10): lo que sigue es
-- una propuesta mínima y usable. Los archivos a que apuntan las rutas se cargan al bucket `catalog`.
-- ============================================================================

-- Tipografías (HE-02-HU06-ET03). Nunito es la de la plantilla por defecto (WG-MK-01); licencias abiertas.
INSERT INTO public.catalog_font (id, family_name, display_name, file_path, license, sort_order) VALUES
  ('inter',          'Inter',          'Inter',          'fonts/inter.woff2',          'OFL-1.1', 1),
  ('merriweather',   'Merriweather',   'Merriweather',   'fonts/merriweather.woff2',   'OFL-1.1', 2),
  ('poppins',        'Poppins',        'Poppins',        'fonts/poppins.woff2',        'OFL-1.1', 3),
  ('jetbrains-mono', 'JetBrains Mono', 'JetBrains Mono', 'fonts/jetbrains-mono.woff2', 'OFL-1.1', 4),
  ('nunito',         'Nunito',         'Nunito',         'fonts/nunito.woff2',         'OFL-1.1', 5)
ON CONFLICT (id) DO NOTHING;

-- Plantilla por defecto (glosario: Plantilla por defecto; HE-02-HU01-ET02, CA01). Viaja además dentro del
-- instalador para el primer inicio y para trabajar sin conexión (D-198).
INSERT INTO public.catalog_template
  (id, name, thumbnail_path, bundle_path, default_background_path,
   default_color_primary, default_color_secondary, default_color_text, default_font_id, is_default, sort_order)
VALUES
  ('default', 'Windgets', 'templates/default/thumbnail.png', 'templates/default/', 'templates/default/background.jpg',
   '#201B2B', '#DC026C', '#FFFFFF', 'rubik', true, 1),
  -- P29 (0008): plantillas genéricas con los colores de sus paletas.
  ('claro',  'Claro',  'templates/claro/thumbnail.png',  'templates/claro/',  'templates/claro/background.jpg',
   '#F5F0FF', '#B6A560', '#17131D', 'rubik', false, 2),
  ('oscuro', 'Oscuro', 'templates/oscuro/thumbnail.png', 'templates/oscuro/', 'templates/oscuro/background.jpg',
   '#201B2B', '#5D566B', '#F8F5FF', 'rubik', false, 3)
ON CONFLICT (id) DO NOTHING;

-- Paletas (HE-02-HU07-ET02): tres colores cada una
INSERT INTO public.catalog_palette (id, name, color_primary, color_secondary, color_text, sort_order) VALUES
  ('windgets', 'Windgets',  '#00D9E2', '#DC026C', '#FFFFFF', 1),
  ('amanecer', 'Amanecer',  '#DCBA04', '#DC026C', '#121216', 2),
  ('oceano',   'Océano',    '#0B6E99', '#00D9E2', '#FFFFFF', 3),
  -- P29 (0008): cumplen los tres pares de R-13.
  ('aurora',     'Aurora',     '#0E2A3B', '#2BB3A3', '#F2FFFC', 4),
  ('bosque',     'Bosque',     '#1E3A2B', '#4F7F5C', '#F3FFF6', 5),
  ('atardecer',  'Atardecer',  '#3B1E2E', '#E0613A', '#FFF5EE', 6),
  ('lavanda',    'Lavanda',    '#EDE7FF', '#7C5CC4', '#1B1430', 7),
  ('arena',      'Arena',      '#F7EFE2', '#A07C4A', '#2A1F12', 8),
  ('medianoche', 'Medianoche', '#0B1226', '#3E63DD', '#EEF2FF', 9)
ON CONFLICT (id) DO NOTHING;

-- Colores de etiquetas y columnas (HE-08-HU02-ET05; HE-09-HU03-ET06). `gray` existe y es el
-- preseleccionado en el Formulario de columna. Los colores por defecto de las columnas iniciales
-- (gray, blue, green) son Duda/propuesta (H-D-17).
INSERT INTO public.catalog_color (id, name, hex, sort_order) VALUES
  ('gray',   'Gris',     '#8A8D98', 1),
  ('red',    'Rojo',     '#E5484D', 2),
  ('orange', 'Naranja',  '#F76B15', 3),
  ('yellow', 'Amarillo', '#DCBA04', 4),
  ('green',  'Verde',    '#30A46C', 5),
  ('cyan',   'Cian',     '#00D9E2', 6),
  ('blue',   'Azul',     '#3E63DD', 7),
  ('purple', 'Morado',   '#6604E6', 8),
  ('pink',   'Rosa',     '#DC026C', 9)
ON CONFLICT (id) DO NOTHING;

-- Catálogo de imágenes (P29, 0008): seis degradados de 3840 × 2160. El de animaciones sigue sin elementos hasta
-- que el equipo cargue los archivos y sus filas (el backlog no los define, H-D-10).
INSERT INTO public.catalog_image (id, name, storage_path, thumbnail_path, width, height, sort_order) VALUES
  ('degradado-amanecer',   'Amanecer',   'images/degradado-amanecer.jpg',   'images/degradado-amanecer-miniatura.png',   3840, 2160, 1),
  ('degradado-oceano',     'Océano',     'images/degradado-oceano.jpg',     'images/degradado-oceano-miniatura.png',     3840, 2160, 2),
  ('degradado-bosque',     'Bosque',     'images/degradado-bosque.jpg',     'images/degradado-bosque-miniatura.png',     3840, 2160, 3),
  ('degradado-lavanda',    'Lavanda',    'images/degradado-lavanda.jpg',    'images/degradado-lavanda-miniatura.png',    3840, 2160, 4),
  ('degradado-medianoche', 'Medianoche', 'images/degradado-medianoche.jpg', 'images/degradado-medianoche-miniatura.png', 3840, 2160, 5),
  ('degradado-atardecer',  'Atardecer',  'images/degradado-atardecer.jpg',  'images/degradado-atardecer-miniatura.png',  3840, 2160, 6)
ON CONFLICT (id) DO NOTHING;

-- Versión de los catálogos (D-198). Se inserta al final: los disparadores de arriba solo actualizan
-- una fila que ya exista.
INSERT INTO public.catalog_meta (id, version) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;
