#!/usr/bin/env bash
# ============================================================================
# Windgets · ejecutar_pruebas.sh
# Levanta un clúster temporal de PostgreSQL, crea el sustituto mínimo de los esquemas de Supabase
# (00_stub_supabase.sql, que no forma parte de la entrega), aplica las migraciones reales
# (0001 a 0004 y seed.sql), les suma 0011_etiquetas_por_tarjeta.sql y 0012_recorte_etiquetas.sql de supabase/ (la
# carpeta del repositorio, junto a docs/) y ejecuta pruebas.sql y prueba_sqlite.py. Después prueba, de supabase/, las
# migraciones 0010_temas_windgets.sql (pruebas_temas_windgets.sql) y 0011 y 0012 (pruebas_etiquetas_por_tarjeta.sql y,
# con sesiones simultáneas, pruebas_carrera_recorte.sql).
# Termina con «TODAS LAS PRUEBAS OK» (código 0) o con el error (código 1).
#
# Variables opcionales:
#   PG_BIN             carpeta con initdb, pg_ctl y psql (por defecto, la última de /usr/lib/postgresql/*/bin)
#   WINDGETS_PGDATA    carpeta del clúster temporal (por defecto, una carpeta nueva en /tmp; se borra al terminar)
#   WINDGETS_PGPORT    puerto (por defecto 54330)
# Si se ejecuta como root se usa el usuario del sistema `pgtest` (se crea si hace falta), porque
# PostgreSQL no arranca como root.
# ============================================================================
set -uo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(dirname "$AQUI")"
BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PUERTO="${WINDGETS_PGPORT:-54330}"
[ -x "$BIN/initdb" ] || { echo "No se encontró PostgreSQL (defina PG_BIN)."; exit 1; }

if [ "$(id -u)" = "0" ]; then
  id pgtest >/dev/null 2>&1 || useradd -m -s /bin/bash pgtest
  EJEC=(runuser -u pgtest --)
else
  EJEC=()
fi

BORRAR_DATOS=0
if [ -z "${WINDGETS_PGDATA:-}" ]; then WINDGETS_PGDATA="$(mktemp -d /tmp/windgets_pg.XXXXXX)"; BORRAR_DATOS=1; fi
DATOS="$WINDGETS_PGDATA"
SOCK="$(mktemp -d /tmp/windgets_sock.XXXXXX)"
SALIDA="$(mktemp /tmp/windgets_salida.XXXXXX)"
if [ "$(id -u)" = "0" ]; then
  rm -rf "$DATOS"; mkdir -p "$DATOS"; chown pgtest "$DATOS" "$SOCK"
fi
chmod 700 "$DATOS"

parar() {
  "${EJEC[@]}" "$BIN/pg_ctl" -D "$DATOS" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$SOCK" "$SALIDA"
  [ "$BORRAR_DATOS" = "1" ] && rm -rf "$DATOS"
}
trap parar EXIT

fallar() { echo; echo "ERROR: $1"; [ -s "$SALIDA" ] && grep -E 'ERROR|FALLO|CONTEXT|DETAIL' "$SALIDA" | head -20; exit 1; }

echo "== Clúster temporal de PostgreSQL ($("$BIN/postgres" --version | awk '{print $3}'))"
"${EJEC[@]}" "$BIN/initdb" -D "$DATOS" -A trust -U postgres -E UTF8 --locale=C.utf8 >"$SALIDA" 2>&1 || fallar "initdb"
"${EJEC[@]}" "$BIN/pg_ctl" -D "$DATOS" -o "-p $PUERTO -k $SOCK -c listen_addresses=''" -l "$SOCK/pg.log" -w start >"$SALIDA" 2>&1 || fallar "no arrancó PostgreSQL"
PSQL=("$BIN/psql" -h "$SOCK" -p "$PUERTO" -U postgres -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=terse)
"${PSQL[@]}" -d postgres -c "CREATE DATABASE windgets_test TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C.utf8' LC_CTYPE 'C.utf8'" >"$SALIDA" 2>&1 || fallar "no se creó la base"

aplicar() {
  echo "-- $1"
  "${PSQL[@]}" -d windgets_test -f "$RAIZ/$1" >"$SALIDA" 2>&1 || fallar "falló $1"
}
echo "== Sustituto mínimo de Supabase (no forma parte de la entrega) y migraciones reales"
aplicar pruebas/00_stub_supabase.sql
aplicar supabase/migrations/0001_esquema.sql
aplicar supabase/migrations/0002_rls.sql
aplicar supabase/migrations/0003_funciones.sql
aplicar supabase/migrations/0004_storage.sql
aplicar supabase/seed.sql
aplicar supabase/seed.sql        # el seed se puede repetir sin duplicar ni fallar
REPO="$(dirname "$RAIZ")/supabase"
[ -d "$REPO/migrations" ] || fallar "no se encontró $REPO/migrations"
# pruebas.sql comprueba R7 con el máximo vigente de etiquetas por tarjeta (RD-96).
for f in 0011_etiquetas_por_tarjeta.sql 0012_recorte_etiquetas.sql; do
  echo "-- $f (del repositorio)"
  "${PSQL[@]}" -d windgets_test -f "$REPO/migrations/$f" >"$SALIDA" 2>&1 || fallar "falló $f"
done
N=$("${PSQL[@]}" -d windgets_test -Atc "SELECT (SELECT count(*) FROM catalog_color) || ' colores, ' || (SELECT count(*) FROM catalog_font) || ' tipografías, ' || (SELECT count(*) FROM catalog_template) || ' plantilla, ' || (SELECT count(*) FROM catalog_palette) || ' paletas'")
echo "   catálogo sembrado una sola vez: $N"
echo "   resumen del esquema: $("${PSQL[@]}" -d windgets_test -Atc "SELECT (SELECT count(*) FROM pg_tables WHERE schemaname='public') || ' tablas, ' || (SELECT count(*) FROM pg_policies WHERE schemaname='public') || ' políticas en public + ' || (SELECT count(*) FROM pg_policies WHERE schemaname='storage') || ' en storage, ' || (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public') || ' funciones, ' || (SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace='public'::regnamespace OR relname='users')) || ' disparadores'")"

echo
echo "== Pruebas de PostgreSQL (pruebas.sql)"
if ! "${PSQL[@]}" -d windgets_test -f "$AQUI/pruebas.sql" >"$SALIDA" 2>&1; then
  sed -E 's/^psql:[^ ]+ (NOTICE|INFO):  //; s/^(NOTICE|INFO):  //' "$SALIDA" | grep -vE '^ok ' | tail -25
  fallar "pruebas.sql"
fi
sed -E 's/^psql:[^ ]+ (NOTICE|INFO):  //; s/^(NOTICE|INFO):  //' "$SALIDA" | grep -v 'does not exist, skipping'
OK_PG=$(grep -cE 'NOTICE:  ok ' "$SALIDA")

echo
echo "== Migraciones del repositorio: temas de Windgets (pruebas_temas_windgets.sql)"
base_con_sustituto() {
  "${PSQL[@]}" -d postgres -c "CREATE DATABASE $1 TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C.utf8' LC_CTYPE 'C.utf8'" >"$SALIDA" 2>&1 || fallar "no se creó $1"
  "${PSQL[@]}" -d "$1" -f "$AQUI/00_stub_supabase.sql" >"$SALIDA" 2>&1 || fallar "$1: sustituto de Supabase"
}
# Como en la nube: 0001 a 0004 y, dentro de la prueba, la semilla de entonces y 0005 en adelante.
base_con_sustituto windgets_temas
for f in "$REPO"/migrations/000[1-4]_*.sql; do
  "${PSQL[@]}" -d windgets_temas -f "$f" >"$SALIDA" 2>&1 || fallar "falló $f"
done
if ! "${PSQL[@]}" -d windgets_temas -v repo="$REPO" -f "$AQUI/pruebas_temas_windgets.sql" >"$SALIDA" 2>&1; then
  fallar "pruebas_temas_windgets.sql"
fi
grep -E 'NOTICE:  ok ' "$SALIDA" | sed -E 's/^.*NOTICE:  //'
OK_TEMAS=$(grep -cE 'NOTICE:  ok ' "$SALIDA")
# Como en una base nueva (supabase db reset): todas las migraciones en orden y después seed.sql, dos veces.
base_con_sustituto windgets_nueva
for f in "$REPO"/migrations/*.sql "$REPO/seed.sql" "$REPO/seed.sql"; do
  "${PSQL[@]}" -d windgets_nueva -f "$f" >"$SALIDA" 2>&1 || fallar "base nueva: falló $f"
done
NUEVA=$("${PSQL[@]}" -d windgets_nueva -Atc "SELECT (SELECT string_agg(id || '=' || name || ':' || is_default::text, ', ' ORDER BY sort_order) FROM catalog_template) || ' / ' || (SELECT string_agg(name, ', ' ORDER BY id) FROM catalog_palette WHERE id IN ('claro', 'oscuro'))")
ESPERADA="default=Windgets:false, claro=Windgets claro:true, oscuro=Windgets oscuro:false / Windgets claro, Windgets oscuro"
[ "$NUEVA" = "$ESPERADA" ] || { : >"$SALIDA"; fallar "base nueva: $NUEVA (esperado: $ESPERADA)"; }
echo "ok   - base nueva: migraciones y seed.sql dejan los nombres nuevos y una sola plantilla por defecto"
OK_TEMAS=$((OK_TEMAS + 1))

echo
echo "== Migraciones del repositorio: 3 etiquetas por tarjeta (pruebas_etiquetas_por_tarjeta.sql)"
# Como en la nube antes de 0011: 0001 a 0010 y seed.sql; la prueba crea los datos y aplica 0011 y 0012.
base_antes_de_0011() {
  base_con_sustituto "$1"
  for f in "$REPO"/migrations/000[1-9]_*.sql "$REPO"/migrations/0010_*.sql "$REPO/seed.sql"; do
    "${PSQL[@]}" -d "$1" -f "$f" >"$SALIDA" 2>&1 || fallar "$1: falló $f"
  done
}
base_antes_de_0011 windgets_etiquetas
if ! "${PSQL[@]}" -d windgets_etiquetas -v repo="$REPO" -f "$AQUI/pruebas_etiquetas_por_tarjeta.sql" >"$SALIDA" 2>&1; then
  fallar "pruebas_etiquetas_por_tarjeta.sql"
fi
grep -E 'NOTICE:  ok ' "$SALIDA" | sed -E 's/^.*NOTICE:  //'
OK_ETIQUETAS=$(grep -cE 'NOTICE:  ok ' "$SALIDA")

echo
echo "== 0011 y 0012 con sync_push en curso (pruebas_carrera_recorte.sql)"
base_antes_de_0011 windgets_carrera
"${PSQL[@]}" -d windgets_carrera -f "$AQUI/pruebas_carrera_recorte.sql" >"$SALIDA" 2>&1 || fallar "pruebas_carrera_recorte.sql"
OK_CARRERA=0
S1="$(mktemp /tmp/windgets_s1.XXXXXX)"; S2="$(mktemp /tmp/windgets_s2.XXXXXX)"
comprobar() { # obtenido esperado mensaje
  [ "$1" = "$2" ] || { cat "$S1" "$S2" >"$SALIDA"; fallar "$3 (obtenido $1, esperado $2)"; }
  echo "ok   - $3"
  OK_CARRERA=$((OK_CARRERA + 1))
}
hasta_que_este() { # application_name que la sesión se pone al llegar a ese punto
  for _ in $(seq 300); do
    [ "$("${PSQL[@]}" -d windgets_carrera -Atc "SELECT count(*) FROM pg_stat_activity WHERE application_name = '$1'")" = "1" ] && return 0
    sleep 0.05
  done
  cat "$S1" "$S2" >"$SALIDA"; fallar "la sesión no llegó a $1"
}
# Sesión 2: ya llamó a sync_push antes de 0011 (como una conexión reutilizada) y envía otra vez durante el recorte.
"${PSQL[@]}" -d windgets_carrera -At >"$S2" 2>&1 <<'SQL' &
SELECT t.asignar('otra', 1);
SET application_name = 's2_lista';
SELECT t.esperar($$relation = 'public.card_label'::regclass AND mode = 'ShareRowExclusiveLock' AND granted$$);
SELECT 'durante el recorte: ' || t.asignar('tibia', 4);
SQL
P2=$!
hasta_que_este s2_lista
# Sesión 1: un sync_push anterior a 0011, aún sin confirmar, deja una 4.ª etiqueta. Con el recorte esperando, la misma
# transacción vuelve a escribir en card_label: con los candados en otro orden habría interbloqueo.
"${PSQL[@]}" -d windgets_carrera -At >"$S1" 2>&1 <<'SQL' &
BEGIN;
SELECT 'antes de 0011: ' || t.asignar('espera', 4);
SET application_name = 's1_lista';
SELECT t.esperar($$locktype = 'advisory' AND NOT granted$$);
SELECT 'con el recorte esperando: ' || t.asignar('espera', 5);
COMMIT;
SQL
P1=$!
hasta_que_este s1_lista
# Cada migración en su transacción, como con supabase db push; el recorte tarda 2 s en confirmar.
"${PSQL[@]}" -d windgets_carrera -1 -f "$REPO/migrations/0011_etiquetas_por_tarjeta.sql" >"$SALIDA" 2>&1 || fallar "carrera: falló 0011"
"${PSQL[@]}" -d windgets_carrera -v recorte="$REPO/migrations/0012_recorte_etiquetas.sql" >"$SALIDA" 2>&1 <<'SQL' || { cat "$S1" "$S2" >>"$SALIDA"; fallar "carrera: falló 0012"; }
BEGIN;
\i :recorte
SELECT pg_sleep(2);
COMMIT;
SQL
wait "$P1"; R1=$?
wait "$P2"; R2=$?
comprobar "$R1 $R2" "0 0" "carrera: las dos sesiones y las migraciones terminan sin interbloqueo"
comprobar "$(grep -c '^antes de 0011: applied$' "$S1")" "1" "carrera: el envío en curso creó la 4.ª etiqueta con la R7 anterior"
comprobar "$(grep -c '^durante el recorte: deleted$' "$S2")" "1" "carrera: el envío que llega durante el recorte ya usa la R7 de 3"
vivas() { "${PSQL[@]}" -d windgets_carrera -Atc "SELECT count(*) FROM card_label WHERE card_id = t.id('$1') AND deleted_at IS NULL"; }
comprobar "$(vivas espera) $(vivas tibia) $(vivas otra)" "3 3 1" "carrera: ninguna tarjeta queda con más de 3 etiquetas"
rm -f "$S1" "$S2"

echo
echo "== Pruebas del esquema SQLite local (prueba_sqlite.py)"
if ! python3 -I "$AQUI/prueba_sqlite.py" "$RAIZ/local/sqlite_esquema.sql" >"$SALIDA" 2>&1; then
  tail -15 "$SALIDA"; fallar "prueba_sqlite.py"
fi
cat "$SALIDA"
OK_SQ=$(grep -c '^ok ' "$SALIDA")

echo
echo "Comprobaciones correctas: $OK_PG en PostgreSQL + $OK_SQ en SQLite + $OK_TEMAS de los temas de Windgets + $OK_ETIQUETAS de las etiquetas por tarjeta + $OK_CARRERA con envíos en curso = $((OK_PG + OK_SQ + OK_TEMAS + OK_ETIQUETAS + OK_CARRERA))"
echo "TODAS LAS PRUEBAS OK"
