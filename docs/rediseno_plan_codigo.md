# Rediseño · plan de código por lotes (24-nov-2026, hora de Colombia)

Plan para la IA que implementa en el código lo que falta del rediseño. Entrega: **jueves 26-nov-2026**. Este plan sale
de revisar el repositorio en `origin/main` `8527130` (P42) contra el Figma `GdUKUwVHz3Wm0Dqw16UX8k`, las decisiones de
Paula del 24-nov y las reglas de errores visibles. El código puede quedar listo **antes** que el Figma: el lote L9
ajusta lo necesario cuando el Figma esté terminado.

## 0. Punto de partida (léelo antes de tocar nada)

1. **La rama local está atrasada.** `paso-29-correcciones` está 13 PR detrás de `origin/main` (P30 a P42 ya
   fusionados). Todo el trabajo sale de `origin/main`:
   `git fetch && git switch -c paso-43-<tema> origin/main`. No uses `main` local ni `paso-29-correcciones`.
2. **Ya construido en `main`** (no se rehace): marco con colores del tema (RD-62), menú en dos bloques con íconos y
   contraído (RD-65), encabezado con miga y sincronización (RD-66), mensajes emergentes con tipos y cola (RD-63),
   ventana maximizada (RD-69), Windi como botón flotante con ojos y panel, y widget Windi (RD-70, RD-71, migración
   `0009_widget_windi.sql`), Kanban con barras de etiqueta y vistas compacta y expandida, ventanas emergentes con «×»
   (RD-72), estados de tarjeta vencida y próxima (RD-73), Formulario de tarjeta con segmentados (RD-75), Calendario
   con selector de mes y año, Agenda con tira semanal, Reportes sin scroll con anillo, ojo en la contraseña (RD-76 a
   RD-81).
3. **Documentos de entrada**, en este orden de precedencia:
   - `docs/rediseno.md` (RD-01 a RD-81; reglas de implementación 1 a 12). Todo cambio nuevo es un RD con su prueba.
   - `docs/rediseno_final_prototipos.md`, `docs/rediseno_final_backend.md`, `docs/hu_v13.md` y
     `docs/traspaso_rediseno_final.md` (pasos P43 a P51 pendientes).
   - `docs/rediseno_cambios_implementacion.md` (local, sin commit): decisiones DI-01 a DI-16 e IM-00 a IM-14 de la
     ronda del 24-nov. **Mandan sobre `rediseno_final_*` donde choquen** (son posteriores); cada choque se anota como
     RD «Reemplaza RD-nn».
   - `docs/rediseno_cambios_prototipos.md` (local): solo de consulta, para saber qué dibujará el Figma (PR-01 a PR-26,
     G-01 a G-09, E-01 a E-42) y los datos de ejemplo de su sección 3.
4. **Choques ya detectados** (cada uno es un RD nuevo en el lote indicado):

   | Choque | Qué se hace | Lote |
   |---|---|---|
   | RD-27 dice que manda `KP2qmNWNT55KMceQI8hFGu`; Paula decidió `GdUKUwVHz3Wm0Dqw16UX8k` (DI-01) | RD nuevo que reemplaza RD-27 | L0 |
   | Mensajes emergentes abajo a la derecha (RD-63) contra arriba a la derecha (DI-10) | Reemplaza la posición de RD-63 | L3 |
   | `rediseno_cambios_implementacion.md` IM-01 llama a la migración `0009_temas_windgets.sql`, pero `0009` ya existe | Usar `0010_temas_windgets.sql`; P44 (etiquetas) pasa a `0011` | L2 |
   | La vista compacta o expandida del Kanban se guarda en `profile.board_card_view` (HE-09-HU07); DI-15 dice que no se guarda | La pantalla deja de leer y escribir la preferencia y abre siempre en compacta; la columna se queda (no se borra nada) | L5 |
   | «Regresar» como enlace al final de la nota (RD-17, RD-25) contra solo la flecha junto a la miga (DI-16) | Reemplaza RD-17 y el punto de «Regresar» de RD-25 | L8 |
   | Máximo de etiquetas por tarjeta: el formulario usa 5 (`FormularioTarjeta.tsx:38`); D-14 dice 3 | Se resuelve en P44 | L2 |

5. **Estado de las pruebas en `8527130`** (24-nov, en Windows con Node 24, fuera de Docker): Vitest 92 archivos y
   877 pruebas en verde, `tsc -b` en verde, ESLint y Prettier en verde, ninguna prueba saltada. **No corrieron**
   Rust, e2e, SQL ni `windows` (Docker apagado y sin `cargo`): el primer paso del otro chat es correrlos en Docker
   para partir de una base en verde.
6. **Verificación.** Docker Desktop debe estar encendido (hoy no lo está). El `node_modules` del repositorio está
   desactualizado; Vitest, tsc y Rust se corren en Docker con la skill `/verificar`. Mientras se construye, por
   tarjeta solo las pruebas del módulo tocado; al cerrar cada paso, una vez y sobre la punta, la verificación
   completa con todos los pasos en `=== fin (0)`.
7. **Proceso.** Un PR por paso hacia `main` con título `PNN · … [IA-ASISTIDO]`; commits `rediseno: <verbo y objeto>`
   (o `HE-nn-HUnn:` si es una HU v13), **sin** `[IA-ASISTIDO]`, con el trailer `Co-Authored-By`. Un commit por
   capacidad, en orden de lectura, y cada uno compila. Nada se fusiona, se sube ni se publica sin el sí de Paula.
   Nada se borra para siempre.

## 0.1 Vista en vivo y comparación visual (pedido de Paula, 24-nov)

Paula quiere ver la app mientras cambia, no solo al final. Por eso:

1. **Al empezar cada chat**, antes del primer cambio de front:
   `pnpm install --frozen-lockfile --config.engine-strict=false` (el repositorio pide Node 22 y el equipo tiene
   Node 24; Vitest y tsc pasan igual) y abrir la vista con `preview_start` `{name: "vista-en-vivo"}` (Vite en
   Windows, puerto 1420, con el Núcleo simulado de `src/ipc/simulado.ts`). Queda abierta en el panel del navegador
   de la app y Vite recarga cada cambio al guardar: Paula lo ve en vivo. No usar `vista-cuenta` (Docker): copia el
   código una sola vez y no se actualiza.
2. **Qué se ve en vivo y qué no.** Se ve todo el front (pantallas, estilos, textos, estados con datos simulados). No
   se ve lo del Núcleo en Rust ni la base: eso lo cubren las pruebas y el instalador de cada PR. Si una pantalla
   necesita un dato que el simulado no tiene (por ejemplo `is_day` o las próximas a vencer), se agrega primero al
   simulado, en el mismo commit que el tipo.
3. **Comparación por pantalla, en cada lote de front (L3 a L8)**, no solo en L9:
   - Al terminar cada pantalla: captura en el panel en claro y en oscuro a 1200 × 800 (`resize_window`), y se
     compara con lo que pide su IM o RD y con la lista G-01 a G-09 de `rediseno_cambios_prototipos.md` (botones
     centrados, ícono con nombre emergente, título y controles en una línea, contenedores, crema solo donde va).
   - Revisar en la consola del panel que no haya errores (`read_console_messages`) y probar a mano lo tocado
     (clic, teclado, Esc, foco).
   - Mostrar a Paula las dos capturas en el chat y seguir; si algo no cuadra, se corrige antes de pasar a la
     siguiente pantalla.
   - Las capturas no reemplazan las pruebas: la geometría se fija con Playwright (regla 11 de `rediseno.md`).
4. **Cuando haya Figma (L9)**: la misma comparación, pero contra el marco del Figma por id.

## 1. Bugs y validaciones encontrados (todos se corrigen; ninguno queda «para después»)

### Errores que terminan en silencio o en el genérico

| Id | Dónde | Qué pasa hoy | Corrección | Prueba |
|---|---|---|---|---|
| B-01 | 40 lugares que muestran `r.error.message` sin respaldo: `Personalization.tsx` (7), `Themes.tsx` (6), `AgregarCarrusel.tsx` (3), `Kanban.tsx`, `Agenda.tsx`, `AgregarImagenEstatica.tsx`, `Edicion.tsx` (2 cada uno), y `Labels`, `AjusteDelFondo`, `GuardarComoTema`, `PlannerDaily`, `ConfirmarEliminacion`, `DetalleTarjeta`, `FormularioTarjeta`, `useVentanasDeTarjeta`, `RenombrarTema`, `AgregarClima`, `AgregarSinDatos`, `AgregarTexto`, `CampoCiudad`, `FormularioDeWidget`, `Widgets` (1 cada uno) | Si el Núcleo responde `internal.unexpected` con `message: ''`, el aviso queda vacío: el error no se ve (regla 7 de `rediseno.md`) | Una función `textoDelError(error)` en `src/ipc/` que devuelve `message` o el texto genérico de RD-24 («Ocurrió un error inesperado. Intenta de nuevo.»), usada en los 40 lugares; RD nuevo que extiende RD-24 a toda la app | Prueba de la función y una prueba por pantalla con `internal.unexpected` sin texto que espere el texto genérico |
| B-02 | `src/ipc/cliente.ts:8` | Si `invoke` de Tauri rechaza la promesa (por ejemplo, un parámetro que no se deserializa), nadie la atrapa: rechazo sin manejar y la pantalla se queda esperando | `invocar` atrapa el rechazo y devuelve `{ ok: false, error: { code: 'internal.unexpected', message: <genérico> } }` | Prueba de `cliente.ts` con `invoke` que rechaza |
| B-03 | `servicio_del_planificador.rs:372` | Crear tarjeta sin la columna «Por hacer» (primera apertura sin conexión, antes de la primera descarga) responde `internal.unexpected`. Es previsible | `column.not_found` con texto propio («Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.» u otro que apruebe Paula; DUDAS) | Prueba Rust del caso y prueba de la vista que muestra el texto |
| B-04 | `servicio_del_planificador.rs:1748` | Crear columna con un color que el catálogo desactivó (catálogo actualizado con la ventana abierta) responde el genérico | `color.invalid` con texto en el campo Color | Prueba Rust y de `FormularioColumna` |
| B-05 | `servicio_de_personalizacion_y_configuracion/aplicar.rs:123` | Aplicar un tema que se eliminó desde otro computador (llega por sincronización) responde el genérico | Código nuevo `theme.not_found`, texto «Este tema ya no existe.», y la lista se recarga | Prueba Rust y de `Themes` |
| B-06 | `servicio_de_personalizacion_y_configuracion.rs:725` | Elegir una paleta que el catálogo desactivó responde el genérico | Código nuevo `palette.not_found`, texto en la sección de colores, y el catálogo se recarga | Prueba Rust y de la vista |
| B-07 | `servicio_de_sesion.rs` (caso `user_banned`, 422) | Una cuenta bloqueada por Supabase responde el genérico sin texto | Código nuevo `auth.user_banned` con texto («Tu cuenta está bloqueada. Escríbenos para revisarla.» o el que apruebe Paula). Un rechazo 400 con regla desconocida sigue en el genérico: no es previsible | Ajustar la prueba existente (`servicio_de_sesion.rs:1829`) al código nuevo |
| B-08 | `puente_ipc.rs:848` | Un comando con sesión llamado sin sesión responde el genérico | `session.expired` con su texto (ya existe) | Prueba Rust |

Cada código nuevo va en `tipos/errores.rs`, `messages.rs`, `messages.es.json`, `docs/contratos.md`, `docs/tipos.ts`
y se regeneran los tipos de TS. Al terminar L1, buscar de nuevo con
`grep -rn "InternalUnexpected\|inesperado()" apps/desktop/src-tauri/src` y justificar en `docs/DUDAS.md` cada uso que
quede (solo lo imprevisible).

### Validaciones de formularios: largos contra la base

Revisado: título 100, descripción 1000, etiqueta 30, columna 30, tema 40, ciudad 100, texto 200, alias 30 y correo 64
coinciden entre la vista, el Núcleo y las restricciones de `supabase/migrations` y `sqlite_esquema.sql`. Falta que
una prueba lo vigile sola:

| Id | Qué | Prueba |
|---|---|---|
| V-01 | Los límites viven como constantes sueltas en cada pantalla (`TITULO_MAX`, `NOMBRE_MAX`, …) | Llevarlos a un solo módulo `src/reglas/limites.ts` y agregar una prueba que lea `apps/desktop/src-tauri/sqlite_esquema.sql` y compare cada `length(...) BETWEEN 1 AND n` con su constante |
| V-02 | `ETIQUETAS_MAX = 5` en el formulario contra D-14 (3) | En P44 (L2): constante única, R7 de `_sync_apply_change`, recorte en la migración, filtro de Reportes y Windi |
| V-03 | Los errores de forma de cada formulario se devuelven todos a la vez | Revisar que cada formulario use `useMensajesDeCampo.validarTodo` y tenga una prueba con todos los campos mal a la vez: Tarjeta, Etiqueta, Columna, Guardar como tema, Renombrar tema, Agregar Clima, Texto, Carrusel, Imagen estática, Rango de Reportes, Registro, Recuperar |

### Lo que el plan pide y el backend no da

| Id | Qué | Corrección |
|---|---|---|
| D-01 | El ícono del clima de día y de noche (DI-14) necesita `is_day`; `weather-current` hoy devuelve `condition_code` y `condition_text`, sin `is_day` | Agregar `is_day` a la consulta de Open-Meteo, a `WeatherCurrentResponse` y `WeatherData` (contratos y tipos), y a la caché. Prueba de la función y del widget |

## 2. Lotes

El orden pone primero lo que no depende del Figma. Cada lote es un paso con su rama y su PR, salvo que se diga otra
cosa. Al terminar cada lote: RD con prueba por cada cambio, línea en «Pendiente para la edición final», DUDAS al día
y pruebas del módulo en verde.

### L0 · Preparación (dentro del primer PR)

- RD nuevo: la fuente de verdad pasa a `GdUKUwVHz3Wm0Dqw16UX8k` (reemplaza RD-27).
- Sembrar al principio de la rama los archivos compartidos con sus puntos de extensión: `messages.es.json` y
  `messages.rs` (códigos nuevos de B-03 a B-07), `docs/contratos.md`, `docs/tipos.ts`, `textosDelMarco.ts`.

### L1 · Errores visibles y validaciones (P43a)

B-01 a B-08, V-01 y V-03. No depende del Figma. Es el lote que más protege la entrega: va primero.

### L2 · Datos y backend (P43b)

1. `0010_temas_windgets.sql` (IM-01): la plantilla `claro` pasa a «Windgets claro» y `oscuro` a «Windgets oscuro»,
   `is_default` pasa a `claro`, la vieja `default` queda como una más; los temas guardados no cambian. Su equivalente
   en `docs/local/` y el paso local en `migrar()` si toca el esquema local. Overrides en `tokens_por_defecto.ts`.
   Texto nuevo del mensaje de RD-15/RD-67 según IM-01.
2. P44 · Máximo 3 etiquetas (D-14) con `0011_…`: V-02 completo.
3. D-01 · `is_day` en el clima.
4. P43 · lo que el Planificador diario ampliado necesite del Núcleo (`card_list_upcoming`, D-06).

Pruebas: SQL en Docker (las 349 del guion y las nuevas), Rust y tipos regenerados.

### L3 · Componentes base del front (P44 o el siguiente número libre)

Se construyen una vez y se usan en todas las pantallas en L4. Cada uno con su prueba unitaria.

| Pieza | Qué | Fuente |
|---|---|---|
| `Boton` | Variantes `principal`, `secundario`, `icono`, `destructivo`; contenido centrado con `inline-flex`; el ancho se ajusta al contenido | IM-02 |
| `NombreEmergente` | Nombre al pasar el puntero y al recibir foco, tras 400 ms, se cierra con Esc; el botón lleva `aria-label`. Reemplaza los `title` nativos (24 usos hoy, por ejemplo en el menú contraído) | IM-03 |
| Íconos | Lupa, papelera, lápiz, regresar, opciones, carpeta y los del clima por código WMO, de día y de noche, en `ui/Iconos` | IM-03, IM-13 |
| Encabezado | `EncabezadoDePantalla` recibe una ranura `acciones` para que título y controles queden en **una** línea (hoy no la tiene y los controles bajan a otra fila) | IM-08 |
| `Panel` | Contenedor con borde o separador para agrupar información; `--wg-separacion-grupo` de 24 px en la barra lateral | IM-08 |
| Mensajes emergentes | Contenedor global arriba a la derecha (reemplaza la posición de RD-63; tipos, cola y duración siguen) | IM-07 |
| Ojos de Windi | Iguales a los de las pantallas de cuenta (nodos `66:20`, `66:23`); botón flotante con la cabeza amarilla asomando, sin fondo; movimiento solo al pasar el puntero y nunca con `prefers-reduced-motion` | IM-05 |

### L4 · Aplicación en lote en todas las pantallas (mismo PR que L3 o el siguiente)

Cambio mecánico, pantalla por pantalla, con el inventario de IM-03:

1. Botones de texto que pasan a ícono con nombre emergente: «Editar», «Eliminar», «Regresar» (`AgregarSinDatos.tsx:96`,
   `FormularioDeWidget`, `AgregarTexto`, `AgregarClima` y demás subpantallas de widgets), «Configurar», «+ Nueva
   tarjeta», «+ Nueva columna», «+ Nueva etiqueta», «+ Agregar widget», el «×» de quitar. Las acciones de los menús
   «⋮» (Etiquetas, Temas) pasan a ícono de lápiz y papelera visibles en la fila (DI-13, PR-19).
2. Controles de cada pantalla a la línea del título con la ranura de L3: «Mes / Semana», vista compacta o
   expandida, filtros de Reportes, «Nueva etiqueta».
3. `Panel` donde hoy hay información suelta; el color de la nota solo en las cuatro superficies de G-08.
4. Las pruebas que buscan un botón por texto (`getByRole('button', { name: 'Regresar' })`, etc.) siguen pasando
   porque el `aria-label` conserva el nombre; si una prueba cambia, se cambia en el mismo commit y nunca se borra.

### L5 · Planificador (P43 en `traspaso_rediseno_final.md`)

- Planificador diario ampliado (D-06, §6.1): saludo, próximas a vencer, mini calendario, filas de 52–56 px, toda la
  fila abre el detalle.
- Calendario con información (IM-09): hasta 3 tarjetas por celda y «+N más»; la semana muestra hora y título.
- Kanban (IM-10): columna fantasma para agregar columna (centrada en vertical, transparente, borde punteado gris
  claro); vista expandida con datos reales de `card`; preferencia no guardada (choque 4 de la sección 0).
- Reportes: revisar el anillo de RD-80 contra IM-11 (anillo con leyenda); «Ver más reportes» es P47 (L10).
- Etiquetas: lápiz y papelera en la fila (L4).

### L6 · Personalización (P45, el más grande)

Una sola entrada «Personalización» en el menú (hoy siguen «Wallpaper», «Temas» y «Widgets»,
`MenuPrincipal.tsx:21`), pantalla por pasos con borrador y widgets por tema (D-21), «Organizar widgets», y de IM-12:
indicador de pasos como pestañas (`tablist`), vista previa más grande, la pantalla con la barra lateral expandida.
«Mis temas» con los cuatro temas de DI-02. Widgets del escritorio: interruptor del componente común, papelera, ícono
del clima.

### L7 · Windi (IM-05, IM-06)

Chat con el estilo de la landing en el panel y en el widget del escritorio: globos, Windi entero en el panel vacío,
ojos según el estado, sin avatar en la cabecera. Cerrar y enviar como íconos con nombre emergente.

### L8 · Pantallas de cuenta (IM-14, DI-16)

Esquina doblada con `clip-path` o SVG más la sombra en un elemento aparte (`cuenta.css:217`); «Regresar» solo como
flecha junto a la miga. Ajustar `e2e/rediseno-cuenta.spec.ts`.

### L9 · Ajuste al Figma terminado (cuando Paula tenga acceso)

1. Pedir al Figma solo los marcos tocados, por id (`rediseno_cambios_prototipos.md`, «Páginas y nodos de
   referencia»), nunca una página entera.
2. Comparar pantalla por pantalla en claro y oscuro a 1200 × 800 y al tamaño del marco. Toda diferencia es un RD con
   prueba de geometría de Playwright (±2 px), sin capturas.
3. Lo que el código ya hace y el Figma no muestra (estados de error, vacío, sin conexión) se queda y se anota.

### L10 · HU v13 (P46 a P51)

Recordatorios reales, Más reportes, orden de tarjetas, reloj 12/24 h e inicio de semana, apariencia del widget,
fondo oscurecido, densidad. **Antes de empezar este lote, preguntar a Paula con opciones cuáles entran antes del
jueves**; lo que no entre queda en `docs/DUDAS.md` con su destino, no en silencio.

## 3. Cierre de cada PR (sin pruebas pendientes)

- [ ] Una prueba por RD y por CA tocado, ejecutada y en verde. Ninguna prueba se borra ni se salta (`it.skip`,
      `test.todo`); hoy no hay ninguna saltada y así sigue.
- [ ] Cada ruta que llegue al manejador genérico se probó con una petición real (simulado y Rust), no solo leyendo.
- [ ] Verificación completa en Docker sobre la punta: lint, build, fmt, clippy, Rust, tipos, Vitest, e2e, landing,
      SQL y `windows`, todos en `=== fin (0)`.
- [ ] Revisión a 1200 × 800, 1000 y 999 px, 960 × 600, zoom 125 %, foco visible, contraste y
      `forced-colors` (regla 11 de `rediseno.md`).
- [ ] En el chat, para Paula: orden de lectura por commit, qué es mecánico y qué pide criterio, y la tabla
      «requisito o caso borde → prueba». La descripción del PR lleva solo la plantilla del repo.
- [ ] Lista de prueba manual en Windows para Paula (instalador del PR): ventana maximizada, mensajes arriba a la
      derecha, nombre emergente con teclado, Personalización por pasos, widget del clima de día y de noche.
