-- ============================================================================
-- Windgets · 0009_widget_windi.sql
-- P40 · Widget de escritorio «Windi» (docs/rediseno_final_backend.md §5.5; decisiones de Paula D-07 y A-07, 24-nov-2026):
--   - `widget.type` admite 'windi'.
--   - Uno solo por cuenta: 'windi' entra en uq_widget_singleton, como Noticias y Reproductor de música.
-- No es un widget por defecto (widget_default_ck no cambia). Equivalente local: docs/local/sqlite_esquema.sql y
-- apps/desktop/src-tauri/sqlite_esquema.sql (CHECK y uq_widget_singleton); las bases locales que ya existen se
-- actualizan al abrir (migración local 9, `repositorios_y_archivos_locales.rs`).
-- ============================================================================
ALTER TABLE public.widget DROP CONSTRAINT widget_type_check;
ALTER TABLE public.widget ADD CONSTRAINT widget_type_check CHECK (type IN ('clock','calendar','daily_tasks','kanban',
  'weather','news','music_player','animation','image_carousel','static_image','text','windi'));

DROP INDEX public.uq_widget_singleton;
CREATE UNIQUE INDEX uq_widget_singleton ON public.widget (user_id, type)
  WHERE deleted_at IS NULL AND type IN ('news','music_player','clock','calendar','daily_tasks','kanban','windi');
