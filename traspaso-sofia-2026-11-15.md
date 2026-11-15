# Traspaso · estado de la construcción (15-nov-2026)

De Sofía al compañero que sigue. Sigue al traspaso anterior (`traspaso-vela-a-sofia-2026-11-14.md`), que
explica el spike P01 y cómo se trabaja; aquí solo va lo que cambió.

## 1. Qué hacer primero

1. Clona o actualiza el repositorio: `git switch main && git pull`.
2. Lee `docs/AGENTS.md` y `CLAUDE.md`. Las reglas no cambiaron: un commit por HU, una prueba por CA, nada
   «NO DEFINIDO» sin su línea en `docs/DUDAS.md`, ramas `paso-NN-*`, ningún push a `main` ni con fuerza, y
   ningún PR fusionado sin el OK de una persona (squash).
3. Con Claude Code, corre `/retomar` y después `/siguiente-paso`. `bash herramientas/estado.sh` muestra qué
   pasos están libres; lo que otra persona ya tomó no se repite.

## 2. Qué se hizo entre el 14 y el 15 de noviembre

| Paso | PR | Estado | Commit en `main` |
|---|---|---|---|
| P08 · Planificador base | #14 | fusionado | — |
| P16 · Etiquetas y columnas (6 HU) | #15 | fusionado | 6d52521 |
| P18 · Reportes (HE-13-HU01 a HU04) | #16 | fusionado | d2affec |
| P10 · Sincronización (HE-15-HU01 a HU03) | #19 | fusionado | 8818582 |
| P05b · Tema por defecto en la ventana | #18 | fusionado (paulamunoz06) | — |
| P12 · Cuentas, Google y recuperación | #17 | **en borrador, de juanvec06**; solo tiene el commit de reserva | — |

Todos los PR fusionados pasaron la CI en verde y la verificación completa (lint, build, fmt, clippy,
`cargo test`, Vitest, Playwright del escritorio y de la landing).

## 3. Qué falta y en qué orden

1. **P11, solo HE-16-HU03 (cerrar sesión).** El resto de P11 depende del spike P01.
2. **P19 · Windi, agente de IA.** Al terminarlo, se pueden escribir las pruebas de HE-15-HU02-CA05 (hoy son
   `it.todo` en `IndicadorSincronizacion.test.tsx`).
3. **P20 · Indicador de sincronización en Configuración (HE-16-HU01).** El indicador P-SIN-01 ya existe junto
   al menú principal (`ventana_principal/IndicadorSincronizacion.tsx`, hecho en P10). P20 lo revisa en la
   pantalla Configuración y cubre sus CA.
4. **P12:** lo tiene juanvec06. No lo toques sin hablar con él.
5. **Todo lo que usa el wallpaper o los widgets** (P06, P07, P09, P13 a P15, P17, P21, P22 y HE-15-HU04)
   sigue **bloqueado por el spike P01**, que solo puede hacer una persona en Windows 10 y 11 reales. Ver la
   sección 5 del traspaso anterior.

## 4. Pruebas manuales pendientes (las hace el equipo)

- **P10 contra Supabase real, con dos computadores.** El motor se probó con una nube simulada. Falta
  comprobar los conflictos por campo (D-048), el envío en 10 s (RNF-03), la recepción en 1 min (RNF-04), que
  no consulte con el computador suspendido, una consulta por minuto como máximo (RNF-05) y el keepalive en
  GitHub Actions. La primera descarga (`sync_pull`) debe traer las columnas por defecto: sin ella, crear una
  tarjeta en la aplicación real falla (duda de HE-07-HU01).
- **P10 en Windows:** detectar la pérdida de conexión también con el estado de red de Windows (EV-03).
- **P18 en Windows 10 y 11:** recorrer Reportes con el teclado y revisar los colores de la gráfica de anillo
  con los temas (RNF-30, RNF-32).
- **Dependabot** avisa de 8 vulnerabilidades en `main` (2 críticas). Nadie las ha revisado.

## 5. Dónde está lo nuevo

- **Reportes (P18):** `screens/reports/` (`SelectorRango`, `GraficaCompletadas`, `TasaCumplimiento`,
  `EstadosTarjetas`, `Seccion`) y `servicio_del_planificador/reportes.rs` con sus pruebas en
  `pruebas_de_reportes.rs`.
- **Sincronización (P10):** `motor_de_sincronizacion.rs`. Tiene `enviar` (cola → `sync_push`, a los 2 s,
  reintento cada minuto), `descargar` (`sync_pull` por páginas), `calibrar` (desfase con `server_time`) y
  `aplicar_filas` (aplica lo recibido sin encolarlo y sin pisar un campo pendiente más reciente). El bucle que
  lo llama y los eventos (`sync_status_changed`, `sync_completed`, `sync_conflicts_resolved`, `cards_changed`
  con `origin: 'remote'`) están en `puente_ipc.rs` (`sincronizar`, `avisar_ciclo`). La nube está detrás del
  trait `NubeDeSincronizacion`, y las pruebas usan `NubeDePrueba`.
- **Etiquetas y columnas (P16):** `screens/labels/FormularioEtiqueta.tsx`, `screens/kanban/FormularioColumna.tsx`
  y `ui/CatalogoColores/`.
- Las dudas nuevas están en `docs/DUDAS.md`, en las líneas que empiezan con HE-08, HE-09, HE-13 y HE-15.

## 6. Cómo se trabajó (además de lo del traspaso anterior)

- **Rust sin red hacia `static.rust-lang.org`:** la imagen `windgets-ci` no se pudo construir. Se usó una
  imagen local `windgets-rust` (rust:1.91.1 con rustfmt, clippy y las librerías de Tauri) con este comando,
  desde la raíz:

  ```bash
  MSYS_NO_PATHCONV=1 docker run --rm -v "$(cygpath -w "$PWD"):/src" -v windgets-rust-target:/target -v windgets-cargo-home:/usr/local/cargo/registry -e CARGO_TARGET_DIR=/target -w /src/apps/desktop/src-tauri windgets-rust bash -c 'cargo fmt && cargo clippy --all-targets -- -D warnings && cargo test'
  ```

  Si no la tienes, crea la tuya: corre `rust:1.91.1`, instala rustfmt, clippy y las librerías de Tauri, y
  haz `docker commit`. La CI de GitHub sí compila normal.
- **JS:** `pnpm lint` desde la raíz; `pnpm exec tsc --noEmit -p .`, `pnpm exec vitest run` y
  `pnpm exec playwright test` desde `apps/desktop`.
- **SQLite:** `INSERT … ON CONFLICT DO UPDATE` revisa los NOT NULL antes del conflicto. Para actualizar una
  fila parcial, usa `UPDATE` si ya existe (ver `aplicar_filas`).
- **`pending_change`** guarda una sola fila por entidad: un segundo cambio se combina con el primero.
- **En las pruebas de vista,** un `Boton` deshabilitado con `motivo` se dibuja envuelto con su motivo: vuelve
  a buscarlo después de deshabilitarlo.
- **Archivos locales que no van en git:** `.trabajo/ESTADO.md`, `.trabajo/bitacora.md` y los cuerpos de los PR
  en `.trabajo/pr/PNN.md`. ESTADO.md tiene la «Próxima acción».
