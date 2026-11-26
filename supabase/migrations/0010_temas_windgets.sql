-- ============================================================================
-- Windgets · 0010_temas_windgets.sql
-- IM-01 «Windgets claro y Windgets oscuro» (docs/rediseno.md RD-94):
--   - La plantilla y la paleta «claro» pasan a llamarse «Windgets claro» y la plantilla es la plantilla por defecto.
--   - La plantilla y la paleta «oscuro» pasan a llamarse «Windgets oscuro».
--   - La plantilla «default» deja de ser la por defecto; conserva su nombre y sus colores.
-- Los temas que ya guardó cada persona no cambian. El disparador trg_bump_catalog_version sube
-- catalog_meta.version, así los clientes descargan el cambio.
-- El orden importa: uq_catalog_template_default admite una sola plantilla por defecto, así que primero se quita
-- la marca a «default» y después se pone a «claro».
-- ANTES de aplicarla en la nube, los archivos de templates/claro/ deben estar en el bucket `catalog`: es la
-- plantilla que toman las cuentas nuevas.
-- Solo cambia datos, no el esquema: no tiene equivalente en docs/local/. En una base nueva corre antes que
-- seed.sql; la semilla deja las filas con los mismos valores.
-- ============================================================================
UPDATE public.catalog_template SET is_default = false WHERE id = 'default';

UPDATE public.catalog_template SET name = 'Windgets claro', is_default = true WHERE id = 'claro';

UPDATE public.catalog_template SET name = 'Windgets oscuro' WHERE id = 'oscuro';

UPDATE public.catalog_palette SET name = 'Windgets claro' WHERE id = 'claro';

UPDATE public.catalog_palette SET name = 'Windgets oscuro' WHERE id = 'oscuro';
