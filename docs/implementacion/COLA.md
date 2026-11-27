# COLA de piezas (fase 7)

Última actualización: viernes 27-nov-2026 (hora colombiana, UTC-5). Entrega: martes 1-dic-2026, 4:00 p. m. (UTC-5).
Fuentes: `PLAN.md`, las 8 `SPEC_*.md`, `ERRORES_Y_PRUEBAS.md`, `DECISIONES.md`, `TRAZABILIDAD.md`, `TEMAS_Y_TOKENS.md`, `ANIMACIONES.md`, `CONSISTENCIA.md`.
Tallas: las de `PLAN.md:107-113` (S ≈ 10 %, M ≈ 25 %, L ≈ 45 % del límite de 5 h). Qué pieza es S, M o L es **PROPUESTA** de esta cola; la parte 9 de cada spec trae sus propias marcas y, donde no hay, la talla es estimación de esta cola.
Líneas citadas como `archivo:línea`. Regla de tallas (`PLAN.md:107-113`): una pieza con Rust y TypeScript es L o se parte; aquí se parte en una pieza Rust (sufijo `r`) y una pieza TS.
Documentos que **se crean en la fase 3** y hoy no existen: `RELEVO.md`, `PRUEBAS_Y_CIERRE.md` y `LEEME.md`.

## §1. Cómo tomar una pieza

Cada regla lleva su fuente. Lo que no tenga fuente no está aquí.

1. **Una pieza a la vez**, la primera `[ ]` cuyo «Depende de» esté en `[x]` y cuyo bloqueo V-xx esté resuelto. Lee antes su spec. Lo que no está en un CA, una ET, un contrato o un modelo de `docs/` no se construye. Fuente: `CLAUDE.md` regla 1; `PLAN.md` «Cada pieza».
2. **Rama y destino.** Rama `paso-NN-<tema>` (`CLAUDE.md` regla 6). El push va **solo a esa rama**, nunca a `main` ni a `develop`; el PR va **solo en borrador** (lo impone el hook `guardia_git.py`). Si `PLAN.md` manda otro destino para la entrega, gana `PLAN.md`; no se asume.
3. **Figma: solo lectura**, con el conector. Cupo **por cuenta**: ≈ 200 llamadas por día y 10 por minuto (`PLAN.md:33`, `:222`). `get_design_context` en claro y una muestra de otro tema; no se repite por tema.
4. **Pruebas.** Una prueba por CA, ejecutada y en verde (`CLAUDE.md` regla 3). Módulo tocado más geometría; las huellas del Figma son JSON en `apps/desktop/e2e/figma/<id>.json` (`PLAN.md:185-199`, sin capturas). Mientras se construye, solo las pruebas del módulo; `clean verify`, cobertura y Newman **una vez** al terminar la CM, sobre la punta (`C:\Users\paanm\.claude\CLAUDE.md`, «Un PR por CM y verificación eficiente»).
5. **Máximo 2 vueltas** de comparación con el Figma; lo que siga distinto va a `DECISIONES.md` o a una pieza nueva de esta cola (`PLAN.md`, «Cada pieza»).
6. **Errores visibles.** Todo error previsible tiene excepción de negocio, código estable y mensaje claro en su campo; nunca cae al genérico (`INTERNAL_ERROR`, 500, «Ocurrió un error»). Los errores de forma de un formulario se devuelven todos a la vez. Al cerrar, comprueba la ruta con una petición real, no solo leyendo (`C:\Users\paanm\.claude\CLAUDE.md`, «Errores claros y siempre visibles»; `ERRORES_Y_PRUEBAS.md` §3).
7. **Commit.** Un commit por HU/capacidad. Título `HE-nn-HUnn: <verbo y objeto>`, `RT-nn: <tema>`, `infra: <tema>` o `rediseno: <verbo y objeto>` (`CLAUDE.md` reglas 2 y 8). Sin `[IA-ASISTIDO]` en el título ni en el cuerpo; esa marca va solo en el título del PR cuando hubo IA. Cierra con el trailer `Co-Authored-By` (`C:\Users\paanm\.claude\CLAUDE.md`, «Commits sin `[IA-ASISTIDO]`»).
8. **Cierre de la pieza:** push, marca `[x]` en esta tabla y espera la CI en verde. Si `main` queda en rojo, la siguiente pieza es arreglarlo (`PLAN.md`, «Cada pieza»). El punto de retoma se deja como diga `RELEVO.md` (se crea en la fase 3; `PLAN.md:161`).
9. **Migraciones.** Una migración aplicada nunca se edita: se crea una nueva en `supabase/migrations/` con su equivalente en `docs/local/` (`CLAUDE.md` regla 5). Lo «NO DEFINIDO» va a `docs/DUDAS.md` con el valor neutro usado (`CLAUDE.md` regla 7). Secretos fuera del repo (`CLAUDE.md` regla 4).
10. **Nada generado con IA se sube** al Drive ni a un sitio compartido sin el sí de Paula; nunca se borra para siempre, solo papelera (`C:\Users\paanm\.claude\CLAUDE.md`).
11. **Archivos compartidos:** se siembran al principio con sus puntos de extensión (`C:\Users\paanm\.claude\CLAUDE.md`, «Archivos compartidos»). La tabla siguiente dice quién es dueño de cada uno.

Archivo compartido → pieza dueña y orden:

| Archivo | Dueña | Orden |
|---|---|---|
| `errores.rs`, `messages.es.json`, `messages.rs` (catálogo; 58 códigos PROPUESTA) | SEED-01 siembra un bloque vacío por área | Cada pieza de área rellena **solo su bloque** |
| `tokens.css`, `marco.css` | SEED-01 siembra una sección por área | TK-01, TK-03, TK-05 (colores y valores), TK-06 (movimiento); las demás piezas, solo su sección |
| Colección Postman, `docs/contratos.md`, `docs/DUDAS.md` | SEED-01 | cada pieza añade su entrada; no reordena |
| `supabase/migrations/0013_*.sql` y los dos `sqlite_esquema.sql` | MG-00 (única) | MG-00 antes de cualquier pieza que lea las columnas nuevas |
| `puente_ipc.rs` | cada pieza Rust, un comando por pieza | en el orden de la cola |

Columnas: `| [ ] | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |`.

## §2. Fase 6 (primero): herramientas de prueba

Ninguna pieza de esta fase depende de una de la fase 7 (`PLAN.md:123-137`). Las comprobaciones en verde que necesitan tokens o movimiento nuevos están en la fase 7 (TK-01v, TK-06v).

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [x] | F6-05 | Copiar las huellas del Figma a `apps/desktop/e2e/figma/` | S | `PLAN.md:185-199`; origen `.trabajo/figma/huellas/*.json` | `apps/desktop/e2e/figma/*.json` | Aprobación de la fase 5 | — | Un JSON por marco vigente; cada uno trae caja, relleno, borde, radio, sombra, fuente y texto |
| [x] | F6-01a | Arnés de la prueba de tokens (cerrada = falla por lo esperado) | M | `TEMAS_Y_TOKENS.md:420`, `:538` (guion §9); `PLAN.md:123-137` | `apps/desktop/src/ui/tema/` (prueba nueva) | — | — | Compara los 4 temas con la tabla, calcula contrastes y comprueba la regla de morado y cian; **falla solo por lo que falta** (Rosa, Enfoque, variables nuevas), y esa lista queda escrita |
| [x] | F6-02 | Arnés de geometría Playwright | L | `PLAN.md:185-199`; tabla `data-testid` de cada spec | `apps/desktop/e2e/` (arnés nuevo) | F6-05 | — | Mide `data-testid` contra la huella JSON con ±2 px, en 1200×800 y 960×600 |
| [x] | F6-03 | Guion de comparación con el Figma (solo aviso) | M | `PLAN.md:185-199` | guion nuevo; salida en `.trabajo/comparacion/` | F6-02, F6-05 | — | Compara contra las huellas JSON (sin capturas); deja evidencia en `.trabajo/comparacion/`; no rompe la CI |
| [x] | F6-04a | Arnés de la prueba de animaciones (cerrada = falla por lo esperado) | M | `ANIMACIONES.md` §7 | `apps/desktop/src/ui/tema/movimiento.test.ts`, `apps/desktop/e2e/ANIMACIONES.spec.ts` (nuevos) | — | — | Ninguna `transition: all`; ninguna pasa el tope de duración; reduced-motion las apaga; falla solo por lo que falta (tokens `--dur-*`) |

## §3. La cola (orden de `PLAN.md` fase 7)

### 3.0 Inicio de la fase 7: siembra y spike

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | SEED-01 | Pieza semilla: catálogo de errores, `tokens.css`, `marco.css`, Postman, `contratos.md`, `DUDAS.md` con sus puntos de extensión | M | `ERRORES_Y_PRUEBAS.md:256-266` (58 códigos PROPUESTA por grupo); `DECISIONES.md` PC-G1..PC-NUEVOS, S19; tabla de §1 | `errores.rs`, `messages.es.json`, `messages.rs`, `tokens.css`, `marco.css`, colección Postman | F6-01a | — | `cargo test`; prueba que compara largos de columna con los del dominio; no cambia comportamiento. «Huérfanas»: ninguna ruta R queda sin pieza dueña (ver §3.10); si al cerrar la cola alguna quedara, va a ER-04 |
| [ ] | S10-SP | Spike S10: notificación de Windows con botones, y plan B | L | `DECISIONES.md` S10, PR-S10; `SPEC_Planificador.md:160-166` | prueba de concepto; resultado en `DECISIONES.md` | — | — | Resultado escrito. Si el spike no logra botones, Paula decide entre notificación sin botones o aviso en la app |

### 3.1 Cierre de L3

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | C3-01 | Cerrar el aviso en curso (cambios locales) | S | `SPEC_Marco…:718` (MB-24) | `ui/MensajeResultado/MensajeResultado.tsx`, `MensajeResultado.test.tsx`, `ui/VentanaEmergente/VentanaEmergente.tsx` | — | — (cierra lo ya hecho; no cambia la forma de los avisos) | Pruebas del módulo; no quedan cambios sin commit en los archivos de la pieza |
| [ ] | C3-02 | Ranura `acciones` del encabezado | M | `SPEC_Marco…:139` (MB-03), `:633` (MB-22) | encabezado de pantalla, `VentanaEmergente` | C3-01 | — | Acciones tabuladas antes de la tarjeta (`:166`); geometría |
| [ ] | C3-03 | `Panel` | M | `SPEC_Marco…:227` (MB-05) | `ventana_principal/marco.css`, panel de Windi | C3-01, SEED-01 | — | Prueba del módulo; geometría |
| [ ] | C3-04 | Mensajes arriba a la derecha; ruta R32 (`tipoDelTexto`) | M | `SPEC_Marco…:292` (MB-06), `:718` (MB-24); `ERRORES_Y_PRUEBAS.md` R32; A-05, A-06b | `ui/MensajeResultado`, `ui/Aviso`, `tokens.css` | C3-01, SEED-01 | V-04 | Pila de hasta 3; 4 s y 6 s; sin `tipo` ya no se infiere del prefijo (R32); geometría |
| [ ] | C3-05 | Ojos de Windi | S | `SPEC_Marco…:761` (MB-27); `SPEC_Windi.md:214-221` | `ui/OjosDeWindi` | — | — | Prueba del módulo; geometría |
| [ ] | C3-06 | Íconos del clima | S | `SPEC_Marco…:776` (MB-28); `SPEC_Escritorio_y_capa.md:113` (EC-03) | `ui/Iconos` | — | — | Prueba del módulo |

### 3.2 Los cuatro temas y sus tokens (migración 0013 compartida)

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | TK-01 | 11 variables de color nuevas | M | `TEMAS_Y_TOKENS.md:411-470` (§8) | `tokens.css`, `tokens_por_defecto.ts` | SEED-01 | — | Pruebas del módulo |
| [ ] | TK-01v | Prueba de tokens en verde (cierra F6-01a) | S | `TEMAS_Y_TOKENS.md:420`, `:538` | prueba de F6-01a | TK-01, TK-02, TK-05 | V-07 (contrastes) | La prueba de F6-01a pasa: 4 temas = tabla, contrastes, regla de morado y cian |
| [ ] | TK-02 | Temas Rosa y Enfoque (32 colores por tema) | L | `TEMAS_Y_TOKENS.md` §8.1.1; `tokens_por_defecto.ts:42-82` | `apps/desktop/src/ui/tema/` | TK-01 | V-07 | Prueba de tokens (F6-01a) |
| [ ] | TK-03 | Radios, trazos, sombras y radio FLOAT de widgets | M | `TEMAS_Y_TOKENS.md` sección 4 | `tokens.css` | TK-01 | — | Prueba de tokens; geometría |
| [ ] | TK-04 | Fuentes Quicksand y Space Grotesk; pesos Nunito 500/600/700 | S | `TEMAS_Y_TOKENS.md` §8 | `tokens.css`, fuentes | SEED-01 | — | Prueba de tokens |
| [ ] | TK-05 | Nombres y valores distintos (Q1, P3, P4: base 14, radio 9, trazo 1,5, foco 2 px `tinta`, avisos D1) | M | `TEMAS_Y_TOKENS.md` §8.2 y §8.3 | `tokens.css`, usos de `relleno_*` y `sobre_accion` | TK-01 | V-07 (Q1-Q3), V-04 (avisos) | Prueba de tokens; módulos tocados |
| [ ] | TK-06 | Tokens de movimiento `--dur-*`, `--ease-*` y bloque reduced-motion | M | `ANIMACIONES.md` §3, §4 regla 10 | `tokens.css` | SEED-01 | V-04 | Prueba del módulo |
| [ ] | TK-06v | Prueba de animaciones en verde (cierra F6-04a) | S | `ANIMACIONES.md` §7 | prueba de F6-04a | TK-06, AN-03 | V-04 | La prueba de F6-04a pasa |
| [ ] | MG-00 | **Crear** la migración 0013 (nueva; nunca editar 0001-0012 aplicadas) | L | `SPEC_Personalizacion…:1117-1131` (columnas de `WidgetPatch`) y `:1232-1239` (S13 y `app_density`); `SPEC_Configuracion.md:178-187`; `DECISIONES.md` PR-0013, PR-DENS | `supabase/migrations/0013_*.sql`; `_sync_fields` de `theme`, `applied_theme` y `theme_widget` (redefinida en la 0013 desde `0003_funciones.sql:266-285`); `docs/local/sqlite_esquema.sql` y `apps/desktop/src-tauri/sqlite_esquema.sql` | SEED-01 | — | Prueba SQL de la CI: columnas, valores por defecto de la tabla de `:1117-1131`, `_sync_fields` incluye las columnas nuevas; ningún archivo 0001-0012 cambia. Anota en `docs/DUDAS.md` lo NO DEFINIDO |
| [ ] | MG-02 | `_sync_fields('user_preference')` con `app_density` | M | `SPEC_Configuracion.md` CF-02 (`0003_funciones.sql:266`) | SQL de la 0013 (no se edita la 0003) | MG-00 | — | Prueba SQL |
| [ ] | MG-03 | IPC-DESK-12/13 `app_density`: Rust | M | `SPEC_Configuracion.md` CF-02 (`contratos.md:291-292`) | `puente_ipc.rs`, `contratos.md` | MG-00 | — | `cargo test` |
| [ ] | MG-05 | `preferencias.rs`: densidad sin pisar `board_card_view` | M | CF-02 (`preferencias.rs:42-65`) | `preferencias.rs` | MG-00 | — | `cargo test` con ambos campos |
| [ ] | MG-06 | `theme_draft_update` acepta los campos nuevos (S13); ruta R19 | M | PW-13 (`SPEC_Personalizacion…:1149`, `:1232-1239`); `ERRORES_Y_PRUEBAS.md` R19 (`servicio_de_personalizacion_y_configuracion.rs:723`, `agregar.rs:545-548`) | orden Rust, `docs/contratos.md:228` | MG-00 | — | `cargo test`: un caso por código de la parte 8; `theme_get_draft` sin borrador devuelve su código y no el genérico |
| [ ] | MG-06t | `ThemeDraftView` y contrato en TypeScript | S | PW-13 (`:1232-1239`) | tipos generados, cliente IPC | MG-06 | — | Vitest |
| [ ] | MG-07r | `theme_apply` copia forma, sombra, Oscurecer y Desenfocar: Rust | M | PW-13 (`:1234-1239`) | Rust | MG-06 | — | `cargo test` |
| [ ] | MG-07 | `theme_apply`: TypeScript | S | PW-13 | cliente IPC | MG-07r | — | Vitest |

### 3.3 L4 por áreas (Marco y componentes base, más animaciones)

`SPEC_Marco_y_componentes_base.md`: MB-01 a MB-28. MB-03, MB-05, MB-24 (parte aviso), MB-27 y MB-28 van en 3.1.

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | L4-01 | Área de avisos y los cuatro avisos (conflicto D7) | M (L si gana D7) | MB-06 (`:292`); `CONSISTENCIA.md:245-264` | `ui/Aviso`, `tokens.css` | C3-04, TK-05 | V-04 | Módulo; geometría |
| [ ] | L4-02 | Botón | M | MB-10 (`:407`) | `ui/Boton/Boton.tsx` | TK-01 | — | Módulo; geometría |
| [ ] | L4-03 | CampoTexto | M | MB-11 (`:448`) | `ui/CampoTexto` | TK-01 | — | Módulo; geometría |
| [ ] | L4-04 | Interruptor | S | MB-13 (`:495`) | `ui/Interruptor` | TK-01 | — | Módulo; geometría |
| [ ] | L4-05 | SelectorFecha (3 defectos) | M | MB-16 (`:540`) | `ui/SelectorFecha` | TK-01 | — | Una prueba por defecto |
| [ ] | L4-06 | VentanaEmergente | M | MB-22 (`:633`) | `ui/VentanaEmergente` | C3-02 | V-04 | Pruebas que hoy asumen cierre síncrono (`ANIMACIONES.md` §7) |
| [ ] | L4-07 | Confirmacion y lista M-nn → botón | M | MB-23 (`:680`); RD-106 | `ui/Confirmacion` | L4-06 | — | Módulo |
| [ ] | L4-08 | CatalogoColores y SelectorColores | M | MB-26 (`:739`) | selector de colores | TK-02 | V-02 | Módulo |
| [ ] | L4-09 | Mapa de navegación | S | MB-09 (`:393`) | `ventana_principal/` | C3-03 | — | Módulo |
| [ ] | L4-10 | Ventana, barra lateral, indicador, fondo, saludo | M | MB-01 (`:25`), MB-02 (`:79`), MB-04 (`:182`), MB-07 (`:345`), MB-08 (`:367`) | `ventana_principal/` | TK-03 | — | Geometría 1200×800 y 960×600 |
| [ ] | L4-11 | Casilla, Segmentado, Selector, NavegacionDeFecha | M | MB-12 (`:480`), MB-14 (`:510`), MB-15 (`:525`), MB-17 (`:560`) | `ui/` | TK-01 | — | Módulo |
| [ ] | L4-12 | Menús, miga, nombre emergente, EstadoVacio | M | MB-18 (`:575`), MB-19 (`:590`), MB-20 (`:596`), MB-21 (`:611`), MB-25 (`:724`) | `ui/` | TK-01 | — | Módulo |
| [ ] | L4-13 | Revisar «No se construye» y la tabla de geometría | S | `SPEC_Marco…:791`, `:803` | solo lectura; anota en `DECISIONES.md` | F6-02 | — | Confirma que no se construye nada fuera de CA/ET/RD/Figma |
| [ ] | AN-01 | Hook `useSalidaAnimada`, ventanas y menús | M | `ANIMACIONES.md` A-01..A-04, regla 13 | `ui/movimiento/useSalidaAnimada.ts` (nuevo) | TK-06 | V-04 | F6-04a; pruebas ajustadas de VentanaEmergente, MenuDeAcciones, Confirmacion |
| [ ] | AN-02 | Avisos: entra, sale, pausa | M | A-05..A-07 | `ui/MensajeResultado` | AN-01, C3-04 | V-04 | F6-04a; MensajeResultado |
| [ ] | AN-03 | Hover, foco y pulsado de controles | M | A-05b, A-05c, A-23, A-25..A-29 | `tokens.css`, `marco.css`, `kanban.css` | TK-06 | — | F6-04a |
| [ ] | AN-04 | Pantallas, panel de Windi, barra lateral | M | A-08..A-12 | `ventana_principal/` | AN-01 | V-06 | F6-04a; geometría |
| [ ] | AN-05 | Arrastre y asentamiento (widgets y tarjetas) | M | A-13..A-19 | `edicion/`, `screens/kanban/` | TK-06 | V-05 (`card_move`) | F6-04a |
| [ ] | AN-06 | Carga, esqueleto y estado vacío | S | A-31..A-33, A-36 | `screens/reports/Seccion.tsx`, `ui/EstadoVacio` | TK-06 | — | F6-04a |
| [ ] | AN-07 | Calendario y Windi | S | A-20..A-22, A-24, A-37 | calendario, `Windi.tsx` | TK-06 | — | F6-04a |
| [ ] | AN-08 | Instalador A-34 y A-35 (I-13) | S | A-34, A-35; `ANIMACIONES.md` §8 | instalador | IN-01 | V-04 | F6-04a |

### 3.4 L5 Planificador

`SPEC_Planificador.md`: PL-01 (`:29`) a PL-15 (`:1036`). Cada pieza incluye las rutas R de su área (§3.10).

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | PL-01 | Base del Planificador diario: saludo (MB-08), barra de etiqueta 4×36, escala P4 (`planificador.css:13-20`), línea de inserción, esqueleto | M | PL-01 (`:29`; diff `:148-173`; `PlannerDaily.tsx:207`, `:102`, `:222`) | `PlannerDaily.tsx`, `planificador.css` | L4-02, TK-05 | — | Prueba por CA; geometría |
| [ ] | PL-01ar | Arrastre: Rust, `card_assign_time_block` y ruta R17 (`due_date.invalid`, `time_block.*`) | S | PL-01 S6 (`:152-167`); `ERRORES_Y_PRUEBAS.md` R17 (`servicio_del_planificador.rs:1312-1317`); código `ARRASTRE_SIN_HORA` | `servicio_del_planificador.rs`, bloque Planificador del catálogo | SEED-01, PL-01 | — | `cargo test`: fecha inválida y hora > 23 devuelven su código, no el genérico |
| [ ] | PL-01a | Arrastre sobre la lista (S6): TypeScript | M | PL-01 S6 (IPC-CARD-10) | vista del Planificador | PL-01ar | — | Vitest; geometría |
| [ ] | PL-01br | `planner_get_today` con `date?` (S11): Rust y contrato | M | PL-01 S11 (`DECISIONES.md` PR-TODAY); `contratos.md` IPC-CARD-08 | Rust, `docs/contratos.md` | SEED-01, PL-01 | — | `cargo test`. Registrar en `docs/DUDAS.md` lo NO DEFINIDO con el valor neutro |
| [ ] | PL-01b | Mini calendario con `diaElegido` (S11): TypeScript | M | PL-01 S11 | vista | PL-01br | — | Vitest; geometría |
| [ ] | PL-01c | Próximas a vencer (S12; `PROXIMAS_NO_CARGAN`) | S | PL-01 S12 (IPC-CARD-16) | vista | PL-01 | — | Vitest |
| [ ] | PL-02 | Tablero Kanban, compacta y expandida | M | PL-02 (`:175`; `column.order_invalid` `:278`) | `screens/kanban/` | L4-02 | V-05 (`column_reorder`) | Prueba por CA; geometría |
| [ ] | PL-03 | Calendario (mes y semana) | M | PL-03 (`:294`) | `screens/calendar/` | PL-02 | — | Prueba por CA |
| [ ] | PL-04 | Panel del día: vacío, esqueleto y error | S | PL-04 (`:372`) | `PanelDelDia.tsx`, `calendario.css` | PL-03 | — | Vacío con su texto; lista con scroll; «Nueva tarjeta» con la fecha del día |
| [ ] | PL-05 | Mes y año y «Escribir año» (teclado numérico 360×364) | M | PL-05 (`:423`; `SelectorMesAnio.tsx:10-11`, `:43-44`); RD-77 | `SelectorMesAnio.tsx`, componente nuevo | PL-03 | — | Año 1969 y 2101: meses deshabilitados sin mensaje; 2026 cierra y cambia el mes; Esc devuelve el foco |
| [ ] | PL-06 | Agenda diaria: «Quitar del horario», «Bloque pasado», avisos y esqueleto | M | PL-06 (`:474`; diff `:540-542`); `time_block.past`, `time_block.after_due_date` | `Agenda.tsx`, `NavegacionDeLaAgenda.tsx`, `arrastre.ts`, `agenda.css` | PL-03, SEED-01 | — | Soltar en bloque pasado y tras la fecha límite: aviso con su texto |
| [ ] | PL-06t | Agenda: «Programar» por teclado (S7, NUEVA) | M | PL-06 (`:542`), `DUDAS.md:47`, RNF-30 | `Agenda.tsx` | PL-06 | — | Enter abre «Programar»; ↓ y Enter asignan; Esc cierra sin escribir |
| [ ] | PL-07 | Reportes con estados, rango y filtro de etiquetas | L | PL-07 (`:550`) | `Reports.tsx`, `SelectorRango.tsx`, `FiltroEtiquetas.tsx`, `EstadosTarjetas.tsx` | PL-03 | — | Prueba por CA; geometría |
| [ ] | PL-08 | Más reportes | L | PL-08 (`:676`) | `reports/` | PL-07 | — | Prueba por CA |
| [ ] | PL-09 | Etiquetas: esqueleto, avisos, globo y catálogo de 9 colores (D3, Q2) | M | PL-09 (`:726`); `label.limit_reached` | `Labels.tsx`, `etiquetas.css` | PL-08 | — | Aviso de máximo; aviso al editar una etiqueta borrada |
| [ ] | PL-10 | Formularios de etiqueta y de columna | S | PL-10 (`:768`) | formularios | PL-09 | — | Prueba por CA |
| [ ] | PL-11 | Formulario de tarjeta; rutas R09 y R13 | M | PL-11 (`:839`); `ERRORES_Y_PRUEBAS.md` R09 (`FormularioTarjeta.tsx:183-190`, `:200`), R13 (`FormularioTarjeta.tsx:285`; incluye `Widgets.tsx:58`) | `FormularioTarjeta.tsx` | PL-10, SEED-01 | — | Si `label_list` falla, aviso con código; sin texto de servicio, `service.unavailable`; petición real |
| [ ] | PL-12 | Detalle de tarjeta y su estado sin datos | S | PL-12 (`:938`) | `screens/tarjeta/` | PL-11 | — | Prueba por CA |
| [ ] | PL-13 | Mover a | M | PL-13 (`:975`; `card_move` `:1001`) | `MoverTarjeta` | PL-12 | V-05 (`card_move`) | Prueba por CA |
| [ ] | PL-14 | Confirmaciones M-08 a M-14 | S | PL-14 (`:1005`) | confirmaciones | PL-13 | — | Prueba por CA |
| [ ] | PL-15 | Windi superpuesto (6 estados) | S | PL-15 (`:1036`) | Planificador | PL-14, WI-01 | — | Prueba por CA |
| [ ] | PL-EV32r | Evento EV-32 `card_reminder_due`: Rust | M | `SPEC_Planificador.md:1129`; `DECISIONES.md` PR-EV32 | Rust | PL-01br, SEED-01 | — | `cargo test`. Registrar en `docs/DUDAS.md` lo NO DEFINIDO con el valor neutro |
| [ ] | PL-EV32 | Evento EV-32: TypeScript | S | ídem | tipos generados, vista | PL-EV32r | — | Vitest |

### 3.5 L6 Personalización y Configuración

`SPEC_Personalizacion_y_widgets.md`: PW-01 (`:31`) a PW-15 (`:1345`). `SPEC_Configuracion.md`: CF-01 (`:59`) a CF-06 (`:363`). Configuración va en L6 por cercanía con temas y densidad (`PLAN.md` no la nombra aparte).

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | PW-01 | Marco de pasos y barra expandida | L | PW-01 (`:31`; `Personalization.tsx:56`, `:394`, `wallpaper.css:66`) | `Personalization.tsx`, `wallpaper.css`, `Widgets.tsx` | TK-02 | — | Prueba por CA; geometría |
| [ ] | PW-02 | Paso 1 Tema: «Mis temas», marca de cambios, M-04; ruta R10 | S | PW-02 (`:131`); `ERRORES_Y_PRUEBAS.md` R10 (`temaAplicado.ts:61`) | `Themes.tsx`, `Personalization.tsx`, `temaAplicado.ts` | PW-01 | — | Prueba por CA; con `theme_get_applied` rechazado sale `TEMA_INICIAL_NO_APLICADO` |
| [ ] | PW-03 | Guardar como tema y Renombrar tema | S | PW-03 (`:238`; G2) | `GuardarComoTema.tsx`, `RenombrarTema.tsx` | PW-02 | — | «Escribe un nombre para el tema.» |
| [ ] | PW-04 | Avisos del paso 1 y del tema | S | PW-04 (`:331`) | `messages.es.json` (bloque Personalización) | PW-02 | V-04 | Prueba por CA |
| [ ] | PW-05 | Barra de guardado | M | PW-05 (`:399`; `Personalization.tsx:604-650`) | `Personalization.tsx` | PW-02 | — | Prueba por CA; geometría |
| [ ] | PW-06 | Ventanas de confirmación M-02, M-04, M-05, M-06, M-07, M-15 | S | PW-06 (`:477`) | `Personalization.tsx` | PW-05, L4-07 | — | Prueba por CA |
| [ ] | PW-06c | Clima y RD-106: «Salir sin guardar» solo si la ciudad elegida es distinta de la inicial | S | `SPEC_Personalizacion…:550-552`; `DECISIONES.md:72`, `:201` (D-RD106); commit `af1a38a` | formulario de Clima; `docs/rediseno.md:206`; `docs/DUDAS.md` | PW-06 | — | Misma ciudad inicial: no pide descarte; otra ciudad: sí. Se corrige `rediseno.md:206` y se anota en `docs/DUDAS.md` |
| [ ] | PW-07 | Paso 2 Fondo: «Oscurecer» y «Desenfocar» (NUEVA) | M | PW-07 (`:556`) | `AjusteDelFondo.tsx`, `wallpaper.css` | PW-01, MG-06t | — | Prueba por CA; geometría |
| [ ] | PW-07r | Imágenes del fondo: disco lleno y permisos; ruta R20 | S | `ERRORES_Y_PRUEBAS.md` R20 (`imagenes.rs:165`, `:167`, `:195`); `IMAGEN_NO_GUARDADA` | `imagenes.rs` | SEED-01 | — | `cargo test`: sin permisos o disco lleno da `IMAGEN_NO_GUARDADA` |
| [ ] | PW-08 | Ajuste por monitor | S | PW-08 (`:657`) | `AjusteDelFondo.tsx` | PW-07 | — | Prueba por CA |
| [ ] | PW-09 | Paso 3 Colores y tipografía | M | PW-09 (`:725`) | `Colores.tsx`, `Paletas.tsx`, `Tipografia.tsx` | PW-01, TK-02 | V-07 | Prueba por CA; contrastes |
| [ ] | PW-10 | Paso 4 Widgets: lista, botones del título, error de carga; `widget_set_active` sin tema (DUDAS.md:377, P43 (3)) | L | PW-10 (`:811`) | `widgets/Widgets.tsx` | PW-01 | V-05 | Prueba por CA; geometría |
| [ ] | PW-11 | Agregar widget y sus ocho subpantallas; ruta R11 | L | PW-11 (`:907`); `ERRORES_Y_PRUEBAS.md` R11 (`Personalization.tsx:303`, `AgregarCarrusel.tsx:68`, `AgregarImagenEstatica.tsx:38`) | `AgregarWidget.tsx` y subpantallas | PW-10, SEED-01 | — | Prueba por CA; el selector de archivos que falla da `IMAGEN_ILEGIBLE` u `OPERACION_FALLIDA` |
| [ ] | PW-12r | Configurar widget: `WidgetPatch` en Rust (NUEVA) | L | PW-12 (`:1015`; tabla `:1117-1131`) | orden Rust de widgets | MG-06 | — | `cargo test`: un caso por valor fuera de lista |
| [ ] | PW-12 | Configurar widget: pantalla y selectores (NUEVA) | L | PW-12 (`:1015`) | `widgets/` | PW-12r, PW-11 | — | Prueba por CA; geometría |
| [ ] | PW-13 | Forma de los widgets y Distribución predefinida: interfaz | M | PW-13 (`:1149-1253`; radios 0/9/22, sombra) | `Personalization.tsx`, vista previa | MG-07, PW-01 | — | Radios 0/9/22 en la vista previa; sombra activa/inactiva; cada distribución mueve los widgets; «Cambios sin guardar» |
| [ ] | PW-14 | Organizar widgets (S14) | M | PW-14 (`:1257`) | `edicion/` | AN-05 | — | Prueba por CA; geometría |
| [ ] | PW-15 | Windi superpuesto | S | PW-15 (`:1345`) | `screens/` | PW-14, WI-01 | — | Prueba por CA |
| [ ] | CF-01 | Pantalla Configuración | M | `SPEC_Configuracion.md:59` (diff `:125-134`) | `screens/settings/` | L4-02 | — | Prueba por CA |
| [ ] | CF-02 | Control de densidad: interfaz | M | `:142`; CA-D1..D6 (`:444-462`) | `Settings.tsx` | MG-03, MG-05 | — | Una prueba por CA-D1..D6 |
| [ ] | PL-DENS | El Planificador lee la densidad | L | CF-02 (`:178-187`); `DECISIONES.md` PR-DENS | Planificador | CF-02, PL-03 | — | Vitest; geometría |
| [ ] | CF-03 | Interruptor y textos de Settings; ruta R06 | S | `:204` (`Settings.tsx:26-29`, `:49`); `ERRORES_Y_PRUEBAS.md` R06 (`Settings.tsx:27`) | `Settings.tsx` | L4-04, SEED-01 | — | Con `autostart_get` rechazado sale `INICIO_AUTOMATICO_FALLIDO` |
| [ ] | CF-03r | Inicio automático: ruta R25 (`current_exe`) | S | `ERRORES_Y_PRUEBAS.md` R25 (`puente_ipc.rs:2798`) | `puente_ipc.rs` | SEED-01 | — | `cargo test`: sin ruta del ejecutable no se activa y devuelve su código |
| [ ] | CF-04r | Cerrar sesión: Rust (`auth_get_sign_out_info`); ruta R05 | S | `:265`; `puente_ipc.rs:2706-2717`; R05 | `puente_ipc.rs` | SEED-01 | — | `cargo test`: el fallo no llega como `InternalUnexpected` con mensaje vacío |
| [ ] | CF-04 | Cerrar sesión: pantalla; ruta R05 | S | `:265` (`CerrarSesion.tsx:29-32`) | `CerrarSesion.tsx` | CF-04r | — | Si `auth_get_sign_out_info` falla, aviso con su código |
| [ ] | CF-05 | Indicador de sincronización | S | `:305` (`IndicadorSincronizacion.tsx`; test `:185`) | `IndicadorSincronizacion.tsx` | L4-10 | V-02 | Prueba por CA |
| [ ] | CF-06 | CF-06 | S | `:363` (sin diferencia propia) | `screens/settings/` | CF-01 | — | Prueba por CA |

### 3.6 L7 Windi

`SPEC_Windi.md`: WI-01 (`:57`) a WI-11 (`:460`).

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | WI-01 | Panel vacío: sin ilustración ni rótulo en el chat, radios, foco D6 | M | WI-01 (`:57`; diff `:92-98`) | `Windi.tsx`, `windi.css` | C3-03 | — | Prueba por CA; geometría 351×551 |
| [ ] | WI-02 | Mensaje muy largo: contador en error y alto del campo | M | WI-02 (`:103`) | `Windi.tsx`, `windi.css` | WI-01 | — | HU01-CA05 con 2001 caracteres; Enter no envía |
| [ ] | WI-03 | Escribiendo (puntos animados) | S | WI-03 (`:136`) | `Windi.tsx`, `windi.css` | WI-01 | — | Prueba por CA |
| [ ] | WI-04 | Errores de Windi (G1a, G1b, G1d); rutas R01, R02, R03, R04 | M | WI-04 (`:168`; diff `:214-221`); `ERRORES_Y_PRUEBAS.md` R01-R04 | `Windi.tsx`, `Propuesta.tsx` | C3-05, SEED-01 | — | Petición real de cada ruta: `label_list` y `windi_get_conversation` rechazados no quedan en silencio |
| [ ] | WI-05 | Propuesta: botones ocultos en Descartada y medidas | M | WI-05 (`:229`) | `Propuesta.tsx`, `windi.css` | WI-04 | — | HU03-CA01, CA04, CA05, CA07 |
| [ ] | WI-06 | Propuestas de Crear, Cambiar y Mover | S | WI-06 (`:289`) | `Propuesta.tsx` | WI-05 | — | HU04, HU05 y HU06: una por CA |
| [ ] | WI-07 | Tarjeta completada y Eliminar varias | M | WI-07 (`:321`) | `Propuesta.tsx` | WI-05 | — | Prueba por CA |
| [ ] | WI-08r | Colores desde `catalog_color`: Rust | S | WI-08 (`:352`; `messages.rs:459`, `:462`) | `messages.rs` | WI-05, SEED-01 | — | `cargo test` |
| [ ] | WI-08 | Propuesta de crear etiqueta: chip 63×18 y colores (TS y `messages.es.json`) | S | WI-08 (`:352`; `messages.es.json:141-143`, `Propuesta.tsx:127`) | `Propuesta.tsx`, `messages.es.json` | WI-08r | V-02 | HU10: el nombre del color sale del catálogo |
| [ ] | WI-09 | Propuesta descartada y variantes sin conexión | S | WI-09 (`:378`) | `Propuesta.tsx`, `Windi.tsx:157` | WI-05 | — | Prueba por CA |
| [ ] | WI-10r | Celebración y comillas «»: Rust; ruta R21 | M | WI-10 (`:405`; `messages.rs:428`; `pruebas.rs:437`, `:2576`, `:2588`); `ERRORES_Y_PRUEBAS.md` R21 (`manejador.rs:77`, `:297`, `:458`, `:495`; `servicio_de_windi.rs:211`) | `messages.rs`, `servicio_de_windi/` | WI-04, SEED-01 | — | `cargo test`: sin emoji, comillas «»; los fallos devuelven `WINDI_ERROR_INTERNO` (G1a) |
| [ ] | WI-10 | Catálogo de respuestas: `messages.es.json` | S | WI-10 (`:428`, `:459`, `:462`); S19 (`MENSAJE_MUY_LARGO` gana, G1e queda como alias) | `messages.es.json` | WI-10r | V-02 | Vitest |
| [ ] | WI-11 | Nombre emergente de Windi | S | WI-11 (`:460`, `:478`) | `Windi.tsx` | WI-10 | — | Cerrar y Enviar reciben el nombre emergente |

### 3.7 L8 Cuenta

`SPEC_Cuenta_y_Acceso.md`: AC-01 (`:105`) a AC-10 (`:845`).

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | AC-01 | AC-01; ruta R12 | M | `:105`; `ERRORES_Y_PRUEBAS.md` R12 (`SignIn.tsx:50`, `Register.tsx:72`, `VerificarCorreo.tsx:61`, `Recovery.tsx:47`, `DiligenciarCodigo.tsx:69`, `NuevaContra…`) | `screens/sign_in/` y vecinas | L4-03, SEED-01 | V-06 | Prueba por CA; cada archivo de R12 muestra su error |
| [ ] | AC-02 | AC-02 | M | `:200` | `screens/` de cuenta | AC-01 | V-06 | Prueba por CA |
| [ ] | AC-03 | AC-03 | M | `:300` | idem | AC-02 | V-06 | Prueba por CA |
| [ ] | AC-04 | AC-04 | M | `:383` | idem | AC-03 | V-06 | Prueba por CA |
| [ ] | AC-05 | AC-05 a AC-08 (`data-testid` y píldora) | M | `:481`, `:573`, `:647`, `:707` | idem | AC-04 | — | Prueba por CA |
| [ ] | AC-09 | AC-09 | S | `:783` | idem | AC-05 | — | Prueba por CA |
| [ ] | AC-10r | Sesión no guardada; ruta R14 | S | `ERRORES_Y_PRUEBAS.md` R14 (`servicio_de_sesion.rs:370`); `SESION_NO_GUARDADA` | `servicio_de_sesion.rs` | SEED-01 | — | `cargo test`: si no se persiste el token, devuelve `SESION_NO_GUARDADA` |
| [ ] | AC-10 | Manejador único de `session.expired` | M | `:845`; `VentanaPrincipal.tsx:174-180` | invocador IPC, `VentanaPrincipal.tsx` | AC-10r | — | Prueba por CA; petición real |

### 3.8 Escritorio, widgets e instalador

`SPEC_Escritorio_y_capa.md`: EC-01 (`:71`) a EC-16 (`:282`). EC-16 es nativo (S1) y no tiene pieza. `SPEC_Instalador_y_web.md`: IN-00 (`:67`), WE-01 (`:79`), IN-01 (`:180`), IN-02 (`:277`), IN-03 (`:335`), IN-04 a IN-07 (`:388-495`).

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | EV-31 | Evento `pointer_moved` | L | `SPEC_Escritorio…:30-36`; `Capa.tsx:146`; `DECISIONES.md` PR-EV31 | Rust y TS (junto a EV-18 y EV-29) | SEED-01 | — | `cargo test`; Vitest. Registrar en `docs/DUDAS.md` lo NO DEFINIDO con el valor neutro |
| [ ] | EC-01 | Capa y escritorio: `Capa.tsx:146` y `data-testid`; ruta R07 | M | EC-01 (`:71`; diff `:101-103`; C-7 `:66`); `ERRORES_Y_PRUEBAS.md` R07 | `Capa.tsx`, `Capa.test.tsx` | EV-31, SEED-01 | — | `layer_get_initial_state` con `ok:false` da `ESCRITORIO_NO_CARGA`; geometría 100/125/150 % |
| [ ] | EC-02 | Fondo oscurecido (variable `velo`) | S | EC-02 (`:109`; C12) | capa | TK-01 | — | Prueba por CA |
| [ ] | EC-03 | Reloj y Reloj 12 horas: fecha y ciudad | M | EC-03 (`:113`) | widget de reloj | C3-06 | — | Prueba por CA |
| [ ] | EC-04 | Calendario, Puntero encima y Semana desde domingo | M | EC-04 (`:126`) | widget de calendario | EV-31, MG-00 | — | Prueba por CA; geometría |
| [ ] | EC-05 | Tareas del día, Sin tareas y Tarea vencida | M | EC-05 (`:139`) | widget de tareas | SEED-01 | V-01 | Prueba por CA |
| [ ] | EC-06 | Kanban del escritorio y sus estados | S | EC-06 (`:152`, `:161-162`; `WidgetKanban.tsx:107`) | `WidgetKanban.tsx` | EC-05 | V-01, V-05 (`card_move`) | Prueba por CA |
| [ ] | EC-07 | Clima y Sin conexión: vacío y fallo silencioso | S | EC-07 (`:165`, `:175`) | widget de clima | EC-03 | V-01 | Prueba por CA |
| [ ] | EC-08r | `system_open_url`: Rust | M | EC-08 (`:178`) | Rust | EV-31, SEED-01 | — | `cargo test` |
| [ ] | EC-08 | Noticias, Sin conexión, Error y Puntero encima: TypeScript | M | EC-08 (`:178`) | widget de noticias | EC-08r | — | Prueba por CA; geometría |
| [ ] | EC-09 | Imagen estática, Carrusel y Animación (En pausa, «2 de 10»); ruta R08 | M | EC-09 (`:191`); A-07; `ERRORES_Y_PRUEBAS.md` R08 (`WidgetAnimacion.tsx:25`, `WidgetCarrusel.tsx:25`, `WidgetImagen.tsx:30`) | widgets de imagen | AN-02, SEED-01 | — | Con `widget_list` rechazado sale `WIDGET_NO_CARGA` dentro del widget |
| [ ] | EC-10 | Texto: vacío y fallo de lectura | S | EC-10 (`:204`) | widget de texto | TK-01 | V-01 | Prueba por CA |
| [ ] | EC-11 | Reproductor: opacidad 0,4, `WIDGET_NO_CARGA`, `data-testid` | S | EC-11 (`:217`; `WidgetReproductor.tsx:21`) | `WidgetReproductor.tsx` | SEED-01 | V-01 | `WidgetReproductor.test.tsx` |
| [ ] | EC-12 | Widget de Windi: `data-testid` | S | EC-12 (`:230`; MB-05) | `WidgetWindi.tsx` | — | — | Prueba por CA |
| [ ] | EC-13 | Widget seleccionado (anillo) | M | EC-13 (`:243`) | widgets | TK-01 | — | Prueba por CA; geometría |
| [ ] | EC-14 | Aviso de wallpaper (lo muestra la ventana principal) | S | EC-14 (`:256`; MB-07, EV-16) | `Capa.test.tsx` | — | — | HE-02-HU01-CA04 |
| [ ] | EC-15r | Notificación de Windows: Rust (tras el spike) | L | EC-15 (`:269`); PL-01 S10 (`:160-166`) | Rust (plugin ausente) | S10-SP, PL-EV32r | V-03 | `cargo test` |
| [ ] | EC-15 | Notificación de Windows: TypeScript y aviso en la app | M | EC-15 (`:269`) | vista | EC-15r | V-03 | Vitest |
| [ ] | IN-00 | IN-00 | S | `SPEC_Instalador…:67` | instalador | — | — | Prueba por CA |
| [ ] | WE-01a | Landing: páginas principales | L | `:79` (diff `:160-172`) | `apps/landing` | — | V-02 | Playwright de la landing |
| [ ] | WE-01b | Landing: resto de WE-01; ruta R30 | M | `:79`; `ERRORES_Y_PRUEBAS.md` R30 (`descarga.ts:19-29`) | `apps/landing` | WE-01a | V-02 | Red caída da `DESCARGA_SIN_CONEXION`; `!respuesta.ok`, `DESCARGA_NO_DISPONIBLE` |
| [ ] | IN-01 | Instalador NSIS | L | `:180` | NSIS | IN-00 | — | Build; prueba por CA |
| [ ] | IN-02 | IN-02; rutas R27, R28, R29 | M | `:277`; `ERRORES_Y_PRUEBAS.md` R27 (`installer.nsi:473-518`), R28 (`:452-457`), R29 (`:266-268`) | `installer.nsi` | IN-01 | — | `pruebas/instalador.ps1`: archivo bloqueado → `REVERSION_FALLIDA`; ejecutable ausente → `ABRIR_APLICACION_FALLIDO`; unidad de red → `ESPACIO_NO_MEDIBLE` |
| [ ] | IN-03 | IN-03 | S | `:335` | NSIS | IN-02 | — | Prueba por CA |
| [ ] | IN-04 | IN-04 a IN-07 | M | `:388-495` | NSIS | IN-03 | — | Prueba por CA |

### 3.9 Lo de HU v13 que el Figma dibuja

`TRAZABILIDAD.md:514-551` (§3, 25 piezas sin marco) y `:552-591` (§4, 119 requisitos «falta/nueva»). Muchos ya están arriba; estas piezas cubren solo lo que ninguna pieza anterior tiene. Quien las toma cruza primero la lista con la cola.

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | HU-01 | Piezas sin marco, primera mitad | M | `TRAZABILIDAD.md:514-551` | los de cada fila de la tabla | 3.1 a 3.8 | — | Prueba por CA |
| [ ] | HU-02 | Piezas sin marco, segunda mitad | M | `TRAZABILIDAD.md:514-551` | los de cada fila de la tabla | HU-01 | — | Prueba por CA |
| [ ] | HU-03 | Windi `236:142` y Componentes `2003:266` sin pieza | S | `TRAZABILIDAD.md:593-605` (§5) | los de `SPEC_Windi.md` y `SPEC_Marco…` | HU-02 | — | Prueba por CA |

### 3.10 Errores y lecturas silenciosas

Rutas de `ERRORES_Y_PRUEBAS.md:144-196`. **Cada ruta R está en una sola pieza** (arriba): R01-R04 WI-04; R05 CF-04r y CF-04; R06 CF-03; R07 EC-01; R08 EC-09; R09 y R13 PL-11; R10 PW-02; R11 PW-11; R12 AC-01; R14 AC-10r; R17 PL-01ar; R19 MG-06; R20 PW-07r; R21 WI-10r; R25 CF-03r; R27-R29 IN-02; R30 WE-01b; R32 C3-04. Aceptadas, sin pieza: R16, R18, R31. Retiradas: R15, R26. R22, R23 y R24 siguen la decisión V-01. Los 58 códigos PROPUESTA los siembra SEED-01 y los rellena la pieza de su área.

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | ER-04 | Rutas R22, R23, R24 (segundo plano) y lecturas silenciosas | S | `ERRORES_Y_PRUEBAS.md` R22-R24 (`puente_ipc.rs:416`, `:461`, `:1434`, `:1489`, `:1560`); `DECISIONES.md` V-01 | `puente_ipc.rs` | SEED-01 | V-01 | Decisión de V-01 escrita; prueba |
| [ ] | ER-05 | Pendientes con destino de los documentos | S | `contratos.md:312` (errata); RD-106 en `docs/DUDAS.md` y `rediseno.md:206` (lo cubre PW-06c); título 51→50 de `rediseno_flujos_ids_prototipos.md:8`; aliases en `CONSISTENCIA.md` §6 (S19); `PROMPT_CONTINUAR.md:43` (`TRAZABILIDAD.md` §5) | esos documentos | PW-06c | — | Revisión de texto; sin código |

### 3.11 Fases 8 y 9 (no son de la cola; se cuentan en la capacidad)

`PLAN.md:47-59`. Son estimaciones de esta cola (PROPUESTA).

| | ID | Título | Talla | Spec y piezas (IDs) | Archivos principales | Depende de | Bloqueada por | Pruebas que deben pasar |
|---|---|---|---|---|---|---|---|---|
| [ ] | F8-01 | Comparación completa app ↔ Figma con las huellas | L | `PLAN.md:47-59` (fase 8); F6-03 | `.trabajo/comparacion/` | toda la fase 7 | — | `TRAZABILIDAD.md` en verde o en la lista manual de Paula |
| [ ] | F8-02 | Verificación completa y prueba manual | M | `PLAN.md` fase 8 | CI, Newman | F8-01 | — | `clean verify`, cobertura, Newman; lista manual de Paula |
| [ ] | F9-01 | RD, edición final de las HU y `DUDAS.md` | L | `PLAN.md` fase 9 | `docs/rediseno.md`, `docs/HE-*.md`, `docs/DUDAS.md` | F8-02 | — | Revisión de texto |
| [ ] | F9-02 | Manual y estado | M | `PLAN.md` fase 9 | `LEEME.md` y `PRUEBAS_Y_CIERRE.md` (se crean en la fase 3), `ESTADO.md` | F9-01 | — | Entrega martes 1-dic, 4:00 p. m. |

## §4. Capacidad

**Objetivo: todo.** Se implementa en el orden de la cola hasta donde se pueda antes de la entrega; no hay recorte acordado
(decisión del 27-nov). La carga es la suma de tallas con los % de `PLAN.md:107-113` (S 0,10; M 0,25; L 0,45 de un límite
de 5 h) y sirve solo para orientarse.

| Fase | Piezas | S | M | L | Carga (límites de 5 h) |
|---|---|---|---|---|---|
| Fase 6 | 5 | 1 | 3 | 1 | 1,30 |
| Fase 7 (con 3.0) | 146 | 57 | 74 | 15 | 30,95 |
| Fases 8 y 9 | 4 | 0 | 2 | 2 | 1,40 |
| **Total** | **155** | **58** | **79** | **18** | **33,65** |

## §5. Bloqueos (V-xx de `DECISIONES.md` §1, `:36-46`)

**Todas respondidas el 27-nov** (columna «Paula cambia a:» de `DECISIONES.md` §1). Las piezas de la tabla ya no están bloqueadas: se construyen con la respuesta.

Se compara cada V con el comando que la pieza llama de verdad.

| V | Qué falta | Piezas bloqueadas |
|---|---|---|
| V-01 | R22-R24 y silenciosos | ER-04, EC-05, EC-06, EC-07, EC-10, EC-11 |
| V-02 | Conflictos C-13, C-17, C-18, C-19, C-20 | L4-08, CF-05, WI-08, WI-10, WE-01a, WE-01b |
| V-03 | S10: decisión de la notificación (el spike S10-SP no se bloquea: informa la decisión) | EC-15r, EC-15 |
| V-04 | D7 contra RD-63/RD-104 (avisos) | C3-04, L4-01, L4-06, TK-05, TK-06, TK-01v (por TK-05), TK-06v, PW-04, AN-01, AN-02, AN-08 |
| V-05 | P43 abiertas: (1) `column.order_invalid` de `column_reorder` (`SPEC_Planificador.md:278`); (2) `WidgetKanban.tsx` ignora el error de `card_move`; (3) `widget_set_active` sin tema | PL-02 (1), PL-13 y EC-06 y AN-05 (2), PW-10 (3) |
| V-06 | D15 (ventana) y D17 (placeholders) | AC-01 a AC-04, AN-04 |
| V-07 | Contrastes, Q1-Q3, textos sin Figma | TK-01v, TK-02, TK-05, PW-09 |

Si aparece una V nueva, la pieza bloqueada se salta; no se inventa la respuesta. El valor neutro provisional va a `docs/DUDAS.md`.

## Cierre

Piezas: 155 (S 58, M 79, L 18); carga 33,65 límites de 5 h. Fase 6: 5; fase 7: 146; fases 8 y 9: 4.
Piezas nuevas de esta ronda: F6-05, F6-01a (parte de F6-01), SEED-01, PL-01, PW-13, PW-06c, MG-00 (antes MG-01 y la migración repartida); partidas Rust/TS: PL-01ar, PL-01br, PL-EV32r, EC-08r, MG-07r, WI-08r, WI-10r, CF-04r.

Decidido el 27-nov:
1. Objetivo: todo; sin recorte (§4).
2. Tallas S/M/L y estimación de las fases 8 y 9: aprobadas como están, incluidas las de PL-11, PL-14, PL-15, PW-12 a PW-15, WI-10, WI-11 y EC-03 a EC-13.
3. V-01 a V-07: respondidas (§5 y `DECISIONES.md` §1).
4. Configuración (CF) va en L6 con Personalización; PL-DENS es pieza propia; R11 en PW-11, R12 en AC-01 y R27-R29 en la pieza del instalador (§3.10).
5. Windi estados `236:142` va en MB-27; Componentes `2003:266` es referencia (cada MB compara su control con ella, sin fila propia).
6. Barra lateral MB-02: quien la implementa comprueba en el Figma el tema de cada una de las 3 versiones y lo anota en la spec.

Pendiente: los tres archivos con cambios locales de `paso-44-componentes-base` (`MensajeResultado.tsx`, su prueba y `VentanaEmergente.tsx`) no se subieron; los cubre C3-01, que con V-04 (D7) rehace `MensajeResultado`.
