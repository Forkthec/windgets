-- ============================================================================
-- Windgets · 0007_rediseno_cuenta.sql
-- Rediseño visual de las pantallas de cuenta (docs/rediseno.md RD-06 y RD-14): agrega Rubik al catálogo de
-- tipografías y las paletas «Claro» y «Oscuro» al principio del catálogo de paletas. Con ellas empieza el tema de
-- una cuenta nueva, según el modo elegido antes de iniciar sesión (RD-15).
-- Los colores salen de las fórmulas de «Tema a tokens» (interfaz.md): la superficie de cada paleta es la nota de
-- su modo y los tres pares de R-13 se cumplen (en Claro el secundario se oscureció para que la acción llegue a 3:1).
-- El disparador trg_bump_catalog_version sube catalog_meta.version, así los clientes descargan el cambio.
-- Solo cambia datos, no el esquema: no tiene equivalente en docs/local/.
-- ============================================================================
INSERT INTO public.catalog_font (id, family_name, display_name, file_path, license, sort_order)
VALUES ('rubik', 'Rubik', 'Rubik', 'fonts/rubik.woff2', 'OFL-1.1', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.catalog_palette (id, name, color_primary, color_secondary, color_text, sort_order) VALUES
  ('claro',  'Claro',  '#F5F0FF', '#B6A560', '#17131D', -2),
  ('oscuro', 'Oscuro', '#201B2B', '#5D566B', '#F8F5FF', -1)
ON CONFLICT (id) DO NOTHING;
