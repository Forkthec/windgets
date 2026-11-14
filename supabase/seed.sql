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
   '#96B2B2', '#829890', '#14201C', 'nunito', true, 1)
ON CONFLICT (id) DO NOTHING;

-- Paletas (HE-02-HU07-ET02): tres colores cada una
INSERT INTO public.catalog_palette (id, name, color_primary, color_secondary, color_text, sort_order) VALUES
  ('windgets', 'Windgets',  '#00D9E2', '#DC026C', '#FFFFFF', 1),
  ('amanecer', 'Amanecer',  '#DCBA04', '#DC026C', '#121216', 2),
  ('oceano',   'Océano',    '#0B6E99', '#00D9E2', '#FFFFFF', 3)
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

-- Catálogos de imágenes y de animaciones: sin elementos hasta que el equipo cargue los archivos
-- y sus filas (el backlog no los define, H-D-10).

-- Versión de los catálogos (D-198). Se inserta al final: los disparadores de arriba solo actualizan
-- una fila que ya exista.
INSERT INTO public.catalog_meta (id, version) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;
