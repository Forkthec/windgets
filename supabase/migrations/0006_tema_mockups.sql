-- ============================================================================
-- Windgets · 0006_tema_mockups.sql
-- Tema por defecto de los prototipos visuales WG-MK-01 (docs/interfaz.md, «Colores y tipografía»):
-- principal #96B2B2, secundario #829890, texto #14201C y tipografía Nunito. Agrega Nunito al catálogo de
-- tipografías (HE-02-HU06-ET03) y cambia los valores por defecto de la plantilla «Windgets»
-- (HE-02-HU01-ET02, HE-02-HU08). Los temas que ya guardó cada persona no cambian.
-- El disparador trg_bump_catalog_version sube catalog_meta.version, así los clientes descargan el cambio.
-- Solo cambia datos, no el esquema: no tiene equivalente en docs/local/. En una base nueva corre antes que
-- seed.sql; la fila de la plantilla aún no existe y la crea la semilla con los mismos valores.
-- ============================================================================
INSERT INTO public.catalog_font (id, family_name, display_name, file_path, license, sort_order)
VALUES ('nunito', 'Nunito', 'Nunito', 'fonts/nunito.woff2', 'OFL-1.1', 5)
ON CONFLICT (id) DO NOTHING;

UPDATE public.catalog_template
   SET default_color_primary   = '#96B2B2',
       default_color_secondary = '#829890',
       default_color_text      = '#14201C',
       default_font_id         = 'nunito'
 WHERE id = 'default';
