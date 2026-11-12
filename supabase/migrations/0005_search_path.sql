-- ============================================================================
-- Windgets · 0005_search_path.sql
-- Fija el search_path de las funciones auxiliares de sincronización, igual que las demás funciones
-- de 0003_funciones.sql (search_path = public, pg_temp). Corrige el aviso de seguridad de Supabase
-- «Function Search Path Mutable» (lint 0011). No cambia el comportamiento ni el esquema de datos,
-- por eso no tiene equivalente en docs/local/ (SQLite no tiene search_path).
-- ============================================================================
ALTER FUNCTION public._sync_corrected(text, bigint, timestamptz) SET search_path = public, pg_temp;
ALTER FUNCTION public._sync_fields(text)                        SET search_path = public, pg_temp;
ALTER FUNCTION public._sync_iso(timestamptz)                    SET search_path = public, pg_temp;
ALTER FUNCTION public._sync_kinds()                             SET search_path = public, pg_temp;
ALTER FUNCTION public._sync_refs(text)                          SET search_path = public, pg_temp;
ALTER FUNCTION public._sync_required(text)                      SET search_path = public, pg_temp;
ALTER FUNCTION public._sync_result(jsonb, text, boolean, text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public._sync_shape(text, jsonb)                  SET search_path = public, pg_temp;
