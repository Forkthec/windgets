# Traspaso · Ejecución del rediseño final (24-nov-2026)

Para quien siga la ejecución de `docs/rediseno_final_backend.md` y `docs/rediseno_final_prototipos.md`. Reglas de
siempre: `CLAUDE.md`, `docs/AGENTS.md`, skills `/verificar` y `/cerrar-paso`. Commits `rediseno: …`, un PR por paso
con título `PNN · … [IA-ASISTIDO]`, nunca a `main`. La persona que dirige fusiona los PR.

## Dónde quedó

| Paso | PR | Estado |
|---|---|---|
| P38 · Bugs P0: sincronización, widgets por defecto, orden estable | #63 | Fusionado |
| P39 · Marco: colores del tema (RD-62), menú, mensajes, ventana (RD-63 a RD-69) | #64 | Fusionado |
| P40 · Windi en panel flotante y widget Windi (RD-70, RD-71, migración `0009`) | #65 | Fusionado |
| P41 · Kanban, Formulario de tarjeta, ventanas emergentes (RD-72 a RD-75) | #66 | **Abierto, verificado en verde, listo para fusionar** |

Rama de P41: `paso-41-kanban-tarjeta`. Verificación: lint, build, tipos, Vitest 871, Playwright 43, fmt, clippy.

## Cómo se está trabajando

- Cada cambio del rediseño es un RD nuevo en `docs/rediseno.md` (el último es **RD-75**), con su línea en
  «Pendiente para la edición final».
- Cada funcionalidad 🆕 lleva su HU v13 en `docs/hu_v13.md` (archivo nuevo; las HU no se editan una por una). La
  aprobación de la HU es la fusión del PR.
- Decisiones y valores neutros en `docs/DUDAS.md`, sección por paso (P38 a P41).
- Migraciones: la nube en `supabase/migrations/` (la última es `0009_widget_windi.sql`; la siguiente es `0010_…`).
  La base local ya tiene migraciones: `PRAGMA user_version` (hoy 9) y `migrar()` en
  `apps/desktop/src-tauri/src/repositorios_y_archivos_locales.rs`; cada cambio de esquema local sube la versión y
  agrega su paso ahí, además de `docs/local/sqlite_esquema.sql` y `apps/desktop/src-tauri/sqlite_esquema.sql`.
- Verificar en Docker: `PASOS="lint build fmt clippy test tipos vitest e2e landing" bash .trabajo/v.sh` y leer
  `.trabajo/ultima.log` (`=== fin (N)`). Tipos TS: `bash .trabajo/gen.sh` (regenera `src/types/index.ts`); un tipo
  nuevo también va en `docs/tipos.ts`.
- Cuidado: con `perl -0pi -e 's|…|…|'`, un `\|` en el patrón rompe el archivo. Para cambios de varias líneas, Edit.
- El `node_modules` local está desactualizado (falta `@tauri-apps/plugin-dialog`): Vitest y tsc se corren en Docker.

## Pasos que faltan (en este orden)

| Paso | Qué cubre | Tipo |
|---|---|---|
| P42 | Calendario (selector de mes y año 1970–2100, Mes \| Semana siempre visible, «Ir a hoy» ícono, panel del día lateral), Agenda (tira semanal D-26, cabecera fija, bloques de 40 px, sin subrayado), Reportes (sin scroll, fechas válidas, no recalcular hasta «Aplicar», anillo con colores de estado), ojo en la contraseña (§3.6-8), D-03 en Calendario/Agenda | RD y bugs (§3.6, §4.6, §4.8) |
| P43 | Planificador diario ampliado (D-06, §5.4, §6.1): saludo, próximas a vencer (`card_list_upcoming` si hace falta), mini calendario, filas de 52–56 px, toda la fila abre el detalle, D-03 | RD |
| P44 | Máximo 3 etiquetas (D-14, §5.1): `ETIQUETAS_MAX`, R7 de `_sync_apply_change`, migración `0010` con recorte, filtro de Reportes, Windi | HU v13 |
| P45 | Personalización por pasos con todo por el borrador y widgets por tema (D-21, A-10, §4.7, §5.12), «Organizar widgets» con «Cancelar»/«Listo», plantillas fuera (D-22, §5.13), una sola entrada «Personalización» en el menú. **El más grande** | HU v13 |
| P46 | Recordatorios reales (D-05, §5.2) | HU v13 |
| P47 | Más reportes (D-12, §5.3) | HU v13 |
| P48 | Orden de tarjetas del usuario (D-16, §5.9) | HU v13 |
| P49 | Reloj 12/24 h e inicio de semana (D-15, §5.8) | HU v13, después de P45 |
| P50 | Apariencia del widget y distribución predefinida (D-17, D-18, D-19) | HU v13, después de P45 |
| P51 | Oscurecer/desenfocar fondo, forma de widgets, tamaño de texto por widget, densidad (D-28 a D-30) | HU v13, después de P45 |

El rediseño visual de cada widget del escritorio queda fuera hasta que existan sus prototipos en el Figma (decisión
de quien dirige, 24-nov).

## Pendientes con personas

- Aplicar `supabase/migrations/0009_widget_windi.sql` en Supabase antes de publicar.
- Pruebas manuales en Windows: ventana maximizada y sin zoom; widget Windi con la app minimizada; migración de una
  base local anterior; registro con correo y Google (widgets por defecto); arrastre en el Kanban sin abrir el
  detalle.
- `TRASPASO.md` de la raíz (18-nov) está desactualizado y no está en git: se puede borrar.

## Actualización (24-nov, corte por límite de uso)

- P41 (#66) fusionado.
- **P42 en curso, sin verificar ni PR**: rama `paso-42-calendario-agenda-reportes` (commit «wip»). Hecho:
  Calendario (selector de mes y año, navegación arriba con `ui/NavegacionDeFecha`, Mes | Semana, panel del día
  lateral, colores por día), Agenda (`NavegacionDeLaAgenda` con mini calendario y tira semanal, cabecera fija,
  bloques de 40 px, estado D-03), Reportes: completadas en verde en el anillo. Pruebas de Calendario y Agenda
  actualizadas. **Falta**: en `screens/reports/SelectorRango.tsx`, validar en la vista fin ≥ inicio y ≤ 366 días
  (`textos.INICIO_POSTERIOR_AL_FIN`, `textos.RANGO_MUY_LARGO`) y poner `SelectorFecha flotante` junto a cada fecha
  (un intento con perl lo rompió; hacerlo con Edit); reportes de un vistazo en 3 columnas; ojo de la contraseña
  (§3.6-8); RD-76 a RD-80 en `docs/rediseno.md` y DUDAS P42 (letras de la tira: L M X J V S D); verificar y abrir PR.
