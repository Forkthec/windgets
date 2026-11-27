# SPEC — Escritorio de Windows y capa (83:2)

**Fecha:** 26-nov-2026 (hora colombiana) · **Estado:** BORRADOR local, sin aprobar (solo Paula aprueba specs) · **Llegó hasta:** las 32 familias de 83:2 en EC-01 a EC-16, geometría, CA → prueba y secciones finales. Los números de línea de las pruebas existentes se citan por archivo y `it`; las lecturas de Figma de dentro del texto de cada widget quedan en «Lecturas de Figma pendientes».

## Alcance

La página 83:2 dibuja el escritorio con los widgets tal como los pinta la capa, más tres piezas del sistema (aviso del wallpaper, notificación de Windows, menú del área de notificación). Ninguna otra spec posee el aspecto de los widgets sobre el escritorio; esta lo posee.

| Tema | Dueño | Aquí |
|---|---|---|
| Marco de la ventana principal, Indicador, Área de avisos, Fondo y aviso del wallpaper | MB-01, MB-04, MB-06, MB-07 | Se cita; el aviso se mide en EC-14 |
| Elegir, agregar, configurar, organizar widgets, temas, transparencia, formatos | PW-10 a PW-15 | Se cita; aquí solo el resultado sobre el escritorio |
| Windi (ojos, panel) | WI-nn, MB-05, RD-71 | EC-12 solo la familia 204:23306 |
| Inicio automático y configuración | CF-nn (CF-03) | Se cita |
| Capa, widgets, estados, selección, velo, notificación, menú del área | Esta spec | EC-01 a EC-16 |

Ids de página: familias 204:22938 a 204:24581 (cuatro temas); estados 2233:8031 a 2234:14488 (16 estados × 4 temas).

## Fuentes

Orden de autoridad: Figma → `docs/rediseno.md` y RD → HU y contratos → `docs/rediseno_cambios_implementacion.md`. Mandan y se citan por id, sin contradecir: CONSISTENCIA, TEMAS_Y_TOKENS, ANIMACIONES, SPEC_Marco (MB-nn), DECISIONES_PAULA_26nov. Datos de medida: `.trabajo/figma/F6.md` y `.trabajo/figma/huellas/204-*.json` (sin conector de Figma). Contratos: IPC-DESK-01 a 16, EV-11 a EV-30, HE-04, HE-06, HE-17, HE-02-HU01.

## Etiquetas

MEDIDO (sale de F6 o de una huella) · DECISIÓN (ya tomada, con su id) · PROPUESTA (derivada, con destino) · NO MEDIDO (motivo) · NUEVA (no existe en el código) · tamaño S, M o L.

## Convenciones comunes

- **C-1 Marco de la capa.** La capa ocupa el monitor completo; cada widget guarda píxeles físicos y se dibuja dividido por el factor de escala (`aEscala`, `Capa.tsx`). El marco 1093×560 de Figma es solo la maqueta (`Fondo de Windgets` + `Imagen elegida` + `Oscurecer imagen` + 4 widgets).
- **C-2 Sin ratón.** La capa no recibe el ratón (D-186); el Núcleo reenvía solo **presionar** (EV-18) y **soltar** (EV-27, `contratos.md:347,356`) y la rueda (EV-29). No hay evento de movimiento: el «Puntero encima» de Calendario (EC-04) y Noticias (EC-08) no se puede construir con el contrato de hoy (`tokens.css:1280` `:hover` nunca se dispara en la capa). **S3 (DECISIÓN):** se construye con un EV nuevo de movimiento en el Núcleo, **EV-31 `pointer_moved`** (PROPUESTA, abajo).

**EV-31 `pointer_moved` (PROPUESTA; destino `docs/contratos.md` tabla de EV y `docs/DUDAS.md`).**

| Campo | Valor |
|---|---|
| Nombre | `pointer_moved` |
| Carga | `{ x: number, y: number, monitor_id: string, inside: boolean }` en coordenadas de la capa (igual que EV-18); `inside` = el cursor está dentro del rectángulo de un widget interactivo y sin ícono bajo el cursor (mismas reglas que EV-18, HE-06-HU01-ET03 a ET08) |
| Cuándo | Raw Input detecta movimiento del cursor mientras `inside` es verdadero, y **una sola vez** con `inside:false` al salir de todos los widgets (para quitar el estado «encima») |
| Frecuencia | Limitada en el Núcleo a 1 evento cada 50 ms (≤ 20 por segundo) y descartando posiciones iguales a la anterior; fuera de los widgets no se emite nada (coste cero con el cursor en el escritorio vacío) |
| Quién escucha | Solo la capa; `WidgetCalendario` (día bajo el cursor) y `WidgetNoticias` (titular bajo el cursor) calculan el acierto con su propia geometría, como con EV-18 |
| Sin ratón | No cambia D-186: la capa sigue sin recibir el ratón; el evento solo informa la posición |

Se declara con `ts-rs` junto a EV-18 y EV-29 (mismo canal de Raw Input). Tamaño **L**: pieza nueva de Rust (movimiento en Raw Input con limitación y salida), contrato y tipo generado, y estado «encima» en dos widgets con sus pruebas; se parte en tres commits (Núcleo, contrato, widgets). M no alcanza porque toca tres capas y el hilo de Raw Input, que es el punto de riesgo de rendimiento (HE-06-HU01).
- **C-3 Colores por variable.** Relleno de widget `superficie`, trazo `borde`, texto `tinta`/`texto`; relleno de selección = `seleccion` + `sobre_seleccion`. Hex de Figma → variable por CONSISTENCIA (C2, C12, C13, C15, C16).
- **C-4 Radios.** Widgets: variable `Radio de widgets` = 9, sin vincular (R3). Fuentes fraccionarias se redondean al entero del componente (A12).
- **C-5 Carga.** ANIMACIONES L92: esqueleto solo si pasa de 200 ms y mínimo 300 ms; 5 barras `linea` r6 (E7). F6 no dibuja estado de carga.
- **C-6 Errores y códigos.**

| Código | Mensaje | Origen |
|---|---|---|
| `NOTICIAS_NO_CARGAN` (G1n) = clave `NOTICIAS_NO_DISPONIBLES` | «No pudimos cargar las noticias. Intenta de nuevo más tarde.» | CONSISTENCIA, `messages.rs:377`, HE-04-HU06-CA03 |
| `CLIMA_NO_CARGA` (G1k) = clave `CLIMA_NO_DISPONIBLE` | «No pudimos cargar el clima. Intenta de nuevo más tarde.» | HE-04-HU05-CA07 |
| `WALLPAPER_NO_SE_MUESTRA` (G1o) = clave `NO_SE_PUDO_MOSTRAR_EL_WALLPAPER` | «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.» | HE-02-HU01-CA04 |
| `url.not_allowed` | PROPUESTA `ENLACE_NO_PERMITIDO`: «Este enlace no se puede abrir desde Windgets.» (destino `docs/DUDAS.md` y `messages.es.json`) | IPC-DESK-09 |
| `browser.open_failed` = clave `NO_PUDIMOS_ABRIR_EL_NAVEGADOR` | «No pudimos abrir el navegador. Intenta de nuevo.» | IPC-DESK-09, `messages.rs:406` |
| `card.not_found` = `TARJETA_NO_EXISTE` | «Esta tarjeta ya no existe.» | IPC-CARD-06/07, `messages.rs:212` |
| `column.not_found` = `COLUMNA_NO_EXISTE` | «Esta columna ya no existe.» | IPC-CARD-06, `messages.rs:275` |
| `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» | CONSISTENCIA G1h; escrituras que fallan |
| PROPUESTA `WIDGET_NO_CARGA` | «No pudimos cargar este widget. Intenta de nuevo más tarde.» | lecturas que fallan sin código propio e `asset.unavailable` (IPC-CAT-04, «sin texto») |
| PROPUESTA `ESCRITORIO_NO_CARGA` | «No pudimos cargar tu escritorio. Intenta de nuevo más tarde.» | `layer_get_initial_state` con `ok:false` |
| PROPUESTA `ZONA_HORARIA_NO_DISPONIBLE` (S2) | «No pudimos leer la zona horaria de tu equipo.» (en el lugar de la ciudad del Reloj) | EC-03; la zona no se lee o no es un nombre válido |
| Sin conexión (no es error) | «Sin conexión. El widget se actualizará al reconectarte.» | E12, HE-15-HU02-CA06 |

**Regla única (regla de errores visibles de Paula).** Una lectura que falla no se queda en silencio aunque su IPC diga «Errores: —», porque el transporte puede fallar: el widget muestra su estado de error con un código estable (el de CONSISTENCIA si existe; si no, el PROPUESTA de arriba, destino `docs/DUDAS.md`). Una escritura que falla muestra un aviso con el código de su IPC (`card.not_found`, `column.not_found`) o, si no tiene, G1h. Las claves de la tabla son las que ya están en el código; mandan hasta que CONSISTENCIA unifique nombres (Pendientes con destino).

- **C-7 Fallos silenciosos hoy** (parte 9 de cada pieza; la regla es la de C-6): `Capa.tsx:146` (M); `TareasDelDia.tsx` lectura (l.72) y `card_set_completed` (S+M); `WidgetKanban.tsx:107` y `card_move().then(()=>leer())` (M); `WidgetClima.tsx:28`, `WidgetNoticias.tsx:23` y `widget_get_data` `!r.ok` (S); `WidgetReproductor.tsx:21` (S); `WidgetImagen.tsx:30`, `WidgetCarrusel.tsx:25`, `WidgetAnimacion.tsx:25`, `WidgetTexto.tsx:21` `!lista.ok → return` (S cada uno); `WidgetNoticias.tsx:53` descarta con `void` el resultado de `system_open_url` (M). IPC con errores declarados: IPC-CARD-06/07 (`card.not_found`, `column.not_found`), IPC-CAT-04 (`asset.unavailable`), IPC-DESK-09.
- **C-8 Pruebas de geometría.** La capa ocupa el monitor: se prueba por escala de Windows 100, 125 y 150 % (`aEscala`), no a 1200×800. Los tamaños 1200×800 y 960×600 (±2 px) valen solo para las piezas de la ventana principal. Ningún `.tsx` de `src/capa` tiene `data-testid`: todos los de esta spec son NUEVOS (parte 9 de cada pieza). Alturas de widget con tamaño Grande (P4) en los 4 temas.

---

## EC-01 · Capa y escritorio (204:22938 | 233:25409 | 204:23628 | 204:23654)

### 1 · Nodos
Marco 1093×560 · `Fondo de Windgets` · `Imagen elegida` · `Oscurecer imagen` (#1b1721 op 0 → variable `tinta` con alfa) · 4 widgets por defecto. Rosa y Enfoque: mismas cajas con Quicksand y Space Grotesk. Oscuro: sin otra diferencia en la capa.

### 2 · Estructura
`capa-raiz` (`main aria-label="Wallpaper"`, `Capa.tsx:200`) › `capa-fondo` › `capa-widget-{id}` (`section aria-label data-widget-id data-interactivo`).

### 3 · Medidas
| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Widgets por defecto | Reloj (30,29) 190×106; Tareas (753,28) 306×128; Calendario (34,312) 210×183; Kanban (715,316) 323×125 | — | MEDIDO F6 |
| Widget | trazo 1,45, radio efectivo 13 → 9 por R3 | `borde` | MEDIDO, DECISIÓN R3 |
| Sombra | sin sombra | C15 | MEDIDO |

### 4 · Textos
Ninguno propio (aria-label «Wallpaper»).

### 5 · Estados
Con sesión, sin sesión (HE-02-HU01-CA05), wallpaper no disponible (CA04: color primario, aviso EC-15), escala cambiada (HE-05-HU02-CA05), lectura vieja tardía (HE-05-HU04-CA05), sincronizado (HE-15-HU04-CA01/03/04).

### 6 · Teclado y foco
La capa no recibe foco ni teclado (D-186). Sin diferencia.

### 7 · Animaciones
Ninguna propia; las de cada widget en su pieza.

### 8 · Errores
`WALLPAPER_NO_SE_MUESTRA` (G1o, clave `NO_SE_PUDO_MOSTRAR_EL_WALLPAPER`) lo muestra la ventana principal (MB-07). Fallo de `layer_get_initial_state`: en la primera carga no hay último estado que conservar; se muestra un aviso con `ESCRITORIO_NO_CARGA` (PROPUESTA, patrón D10/G1h, destino `docs/DUDAS.md`) y se reintenta en el siguiente EV-11/12/13/16/17/30.

### 9 · Diferencia con el código
`Capa.tsx:146` (C-7), M. Ningún `data-testid` en la capa: NUEVOS, S.

### 10 · Pruebas
`Capa.test.tsx`: «HE-02-HU01-CA01…CA05», «HE-05-HU02-CA05» (dos), «HE-05-HU04-CA05», «HE-15-HU04-CA01/03/04». Faltan: `layer_get_initial_state` con `ok:false` → aviso `ESCRITORIO_NO_CARGA`; geometría por escala 100/125/150 %.

---

## EC-02 · Fondo oscurecido (204:23401 | 233:25787 | 204:24554 | 204:24581)

1 Nodos: velo 1093×560 #15101D op 0,32 (F6:8,33). 2 `capa-velo`. 3 Medidas: llena el marco; color fijo → variable `velo` (C12). No confundir con «Oscurecer imagen» de EC-01 (`tinta` con alfa, op 0). MEDIDO. 4 Sin textos. 5 Visible mientras hay una ventana emergente o aviso modal sobre el escritorio principal. 6 Sin foco. 7 Aparición del velo según ANIMACIONES. 8 Sin errores. 9 El velo existe en la ventana principal (MB-22, `tokens.css` L265); la capa no lo dibuja y ninguna fuente pide que lo dibuje, por eso no se declara como regla. `capa-velo` NUEVO, S. 10 Prueba de MB-22 (fondo bloqueado con el velo, commit 50a7616); la del `capa-velo`: falta.

## EC-03 · Reloj (204:22964 | 233:25430 | 204:23680 | 204:23710) y Reloj 12 horas (2233:9055 | 2234:19437 | 2234:10602 | 2234:13719)

1 Nodos: Ciudad Bold 13,3 «Popayán»; Hora Bold 41 «10:20»; Fecha Regular 13,3 «martes 24 de noviembre» (sin coma); padding 9,5; caja 190,5×106. 12 h: «10:20 a. m.».
2 `widget-reloj`, `reloj-ciudad`, `reloj-hora`, `reloj-fecha` (NUEVOS).
3 Medidas: textos `tinta`; fuentes 13 / 41 (A12). MEDIDO. Coordenadas internas: NO MEDIDO (huella 204-22964 trae 0).
4 Textos: ciudad, hora y fecha del sistema (es-CO). **Ciudad (S2, DECISIÓN):** sale de la zona horaria del sistema, `Intl.DateTimeFormat().resolvedOptions().timeZone` (p. ej. `America/Bogota`); se toma el último tramo y los guiones bajos pasan a espacio (`America/Mexico_City` → «Mexico City»). Es la ciudad de la zona, no la del usuario: «Popayán» del Figma es un ejemplo y en un equipo con zona `America/Bogota` se lee «Bogota» (sin tilde, tal como la da el sistema; limitación aceptada, sin tabla propia). No hay campo de ciudad en PW-12.
5 Estados: 24 h, 12 h (HE-04-HU03-CA02/03), formato cambiado en Windows (CA04). Sin vacío ni carga (E7). **Zona no legible (S2):** si `timeZone` es `undefined`, vacía o no tiene forma `Área/Ciudad` (p. ej. `UTC`), el Reloj sigue mostrando hora y fecha y en el lugar de la ciudad escribe «No pudimos leer la zona horaria de tu equipo.» con código `ZONA_HORARIA_NO_DISPONIBLE` (PROPUESTA, regla de errores visibles: no se deja vacío ni se inventa una ciudad). Se reintenta al recibir EV-28 (cambio regional).
6 Sin foco (no interactivo).
7 Ninguna.
8 Hora: si no se lee el formato, 24 h (HE-04-HU03-ET02). Ciudad: `ZONA_HORARIA_NO_DISPONIBLE` (parte 5), destino `docs/DUDAS.md` y `messages.es.json`.
9 `Reloj.tsx` solo pinta la hora. **Fecha: DECISIÓN** (lote 9, `docs/rediseno_estado_prototipos.md`, y D-15), formato «martes 24 de noviembre» sin coma; NUEVA, S. **Ciudad: DECISIÓN** (lote 9, «Reloj titulado con la ciudad»; origen S2): lectura de zona en el widget más el texto de error; sin IPC nuevo; NUEVA, M.
10 `Reloj.test.tsx`: «HE-04-HU03-CA01…CA04», «ET02». Faltan: fecha con el formato literal; ciudad «Bogota» con zona simulada `America/Bogota`; ciudad con «Mexico_City»; zona ilegible → texto y código `ZONA_HORARIA_NO_DISPONIBLE` con hora y fecha visibles.

## EC-04 · Calendario (204:22994 …) con Puntero encima (2233:8749 …) y Semana desde domingo (2233:8883 …)

1 Nodos: 210×183; «Noviembre 2026»; cabecera L M X J V S D; Hoy 25×20,5 r6 `detalle`/`sobre_detalle`. Puntero encima: día 24,5×20,5 `superficie_baja` trazo `seleccion` 1,5 r5. Domingo: 210×163, orden D L M X J V S.
2 `widget-calendario`, `calendario-dia-{aaaa-mm-dd}`, `calendario-hoy` (NUEVOS).
3 MEDIDO F6; interior NO MEDIDO.
4 «Noviembre 2026», abreviaturas; vacío «No tienes eventos este mes.» = PROPUESTA (D9, E7; no está en F6 ni en el código), destino `docs/DUDAS.md`.
5 Mes actual, hoy, semana desde domingo (D-15, PW-12 «Domingo»), sin eventos. **Puntero encima (S3, DECISIÓN):** el día bajo el cursor se dibuja `superficie_baja` con trazo `seleccion` 1,5 r5 (MEDIDO 2233:8749); lo dispara EV-31 (C-2); al llegar `inside:false` o salir del día, vuelve al estado normal. El día de hoy conserva `detalle`/`sobre_detalle`.
6 Interactivo (HE-06-HU07); selección vía EV-18. El estado «encima» no se anuncia (la capa no recibe foco ni teclado).
7 Sin animación propia; el cambio de «encima» usa la duración de hover de ANIMACIONES.
8 Lectura de `calendar_get_month` que falla: regla única C-6, `WIDGET_NO_CARGA` (PROPUESTA).
9 **Semana desde domingo: NUEVA, M.** `WidgetCalendario.tsx` usa `DIAS` fijo (`screens/calendar/mes.ts:20`, lunes primero) y no lee `calendar_week_start` (D-15); la altura 163 sale de ahí. Vacío: NUEVA, S. **Puntero encima: NUEVA, L** (EV-31 con su Núcleo, C-2; la parte del widget es M: estado `diaEncima` por geometría de cada `calendario-dia-*`).
10 `WidgetCalendario.test.tsx`: «HE-06-HU07-CA01». Faltan: domingo, vacío, puntero (con EV-31 simulado: día 24 `inside:true` → trazo `seleccion` 1,5; `inside:false` → sin trazo).

## EC-05 · Tareas del día (204:23024 …) con Sin tareas (2233:8114 …) y Tarea vencida (2233:8225 …)

1 306×128; rótulo «Tareas del día» (F6:21); fila 24 `superficie_baja` r7; casilla 13,5 r3,6 `seleccion`/`sobre_seleccion`; filas «Revisar los bocetos» 08:00 Alta, «Preparar la entrega» 09:00 Media, «Compartir el prototipo» 10:00 Baja. Sin tareas: 306×68. Vencida: fila 3 con texto y hora en `error`.
2 `widget-tareas`, `tareas-rotulo`, `tarea-fila-{id}`, `tarea-casilla-{id}` (NUEVOS).
3 MEDIDO F6. **Casilla (S4, DECISIÓN):** la del Figma, 13,5 de lado r3,6, con **zona táctil de 44×44** centrada (el área que recibe el clic de EV-18 es la de 44, no la dibujada). Sustituye al 24×24 de HU y código (`tokens.css:1204-1219`); la fila de 24 de alto no crece: la zona de 44 desborda a la fila de arriba y de abajo y el acierto se resuelve por cercanía a la casilla cuando dos zonas se solapan (gana la fila bajo el cursor).
4 «Tareas del día»; «No tienes tarjetas para hoy.»
5 Con tareas, vacío, vencida, completada.
6 Interactivo (HE-06); la casilla es la acción.
7 Completar según ANIMACIONES.
8 Escritura: `card_set_completed` falla → `TARJETA_NO_EXISTE` si `card.not_found`; si no, G1h `OPERACION_FALLIDA` (cuyo alcance hay que ampliar al escritorio, Pendientes con destino). Lectura `planner_get_today` que falla: `WIDGET_NO_CARGA` (PROPUESTA).
9 `TareasDelDia.tsx`: casilla de 13,5 con zona de 44 (S4; diferencia con `tokens.css:1204-1219`, S); falta el rótulo «Tareas del día» (diferencia, S); lectura inicial silenciosa (l.72) y `card_set_completed` ignorado (M). **Tarea vencida: NUEVA, M.** Regla PROPUESTA: tarjeta no completada con fecha y hora anteriores a ahora → hora y texto en `error`; fuente: SPEC_Planificador L116 (fecha vencida en `error`) y HE-07-HU03-CA03; destino HE-06.
10 `TareasDelDia.test.tsx`. Faltan: rótulo, vencida, fallo de completar, fallo de lectura; casilla dibujada 13,5 y zona de acierto 44×44 (clic a 20 px del centro completa; a 23 px no); solape entre filas contiguas.

## EC-06 · Kanban (204:23054 …) y estados Sin tarjetas, Arrastrando, Cinco tarjetas

1 323×125,5; columna 101,5×82; tarjeta 94×36 trazo `linea` 1,21 r6; cantidades 10/5/12; «+9 más», «+4 más», «+11 más»; puntos → color del catálogo (D3). Sin tarjetas 323×96; Arrastrando: origen op 0,35, columna destino trazo `seleccion` 2, tarjeta con sombra 0,4,8 al 30 %; Cinco tarjetas 323×287 con «+5 más», «+7 más».
2 `widget-kanban`, `kanban-columna-{id}`, `kanban-tarjeta-{id}`, `kanban-mas-{id}`.
3 MEDIDO F6.
4 «Tu tablero no tiene tarjetas.»; «+N más».
5 Normal, vacío, arrastrando, más de 5 (HE-06-HU05-CA03).
6 Sin teclado (la capa no recibe foco); el arrastre usa EV-18/27 (HE-06-HU06).
7 Arrastre según ANIMACIONES; ET08: a los 10 s sin soltar, la tarjeta vuelve.
8 `card_move` (IPC-CARD-06): `card.not_found` → «Esta tarjeta ya no existe.» (`TARJETA_NO_EXISTE`), `column.not_found` → «Esta columna ya no existe.» (`COLUMNA_NO_EXISTE`); otro fallo G1h. Lectura `kanban_widget_get` que falla: `WIDGET_NO_CARGA`.
9 `WidgetKanban.tsx` (197 líneas) cubre los casos; silenciosos: `if (r.ok)` en l.107 (S) y `card_move().then(()=>leer())` (M); verificar la sombra del arrastre en oscuro (NO MEDIDO: F6 no leyó la sombra oscura).
10 `WidgetKanban.test.tsx`: HU05-CA01…CA04; HU06-CA01…CA06, ET02, ET08.

## EC-07 · Clima (204:23084 …) y Sin conexión (2233:9144 …)

1 189,5×105,5; icono 41; «18 °C»; «Parcialmente nublado»; caja de temperatura 103×56 (Rosa 92×51, Enfoque 96×52, T14).
2 `widget-clima`, `clima-temperatura`, `clima-condicion`.
3 MEDIDO F6.
4 «Elige una ciudad para ver el clima.»; «Sin conexión. El widget se actualizará al reconectarte.»
5 Normal, vacío, sin conexión (E12), servicio caído (HE-04-HU05-CA07, `CLIMA_NO_CARGA`).
6 No interactivo.
7 Sin propia.
8 Dos rutas: (a) `status` `error`/`offline` de `widget_get_data` ya muestra aviso (`WidgetClima.tsx:38-43`, prueba `WidgetClima.test.tsx:80`) con `CLIMA_NO_CARGA` (G1k, clave `CLIMA_NO_DISPONIBLE`); (b) lo silencioso es solo `!r.ok` de `widget_get_data` (`WidgetClima.tsx:28`): por C-6 muestra `CLIMA_NO_CARGA`.
9 Vacío «Elige una ciudad para ver el clima.»: PROPUESTA (D9, E7; no está en F6 ni en el código), S. Fallo (b) silencioso, S.
10 `WidgetClima.test.tsx`: HE-04-HU05-CA01, CA06, CA07, CA08; RD-97; HE-15-HU02-CA05/06.

## EC-08 · Noticias (204:23114 …), Sin conexión, Error y Puntero encima

1 360×177,5; 5 titulares 24 de alto r7; «Actualidad de hoy», «Titular de ejemplo 2»…«5», «Fuente». Puntero encima: titular 2 con trazo `seleccion` 1,5. Error: «No pudimos cargar las noticias. Intenta de nuevo más tarde.»
2 `widget-noticias`, `noticias-titular-{n}`.
3 MEDIDO F6.
4 Los de la parte 1.
5 Normal, sin conexión, error (G1n); puntero encima (S3, DECISIÓN): titular bajo el cursor con trazo `seleccion` 1,5 (MEDIDO 204:23114 familia), disparado por EV-31 (C-2).
6 Interactivo (HE-06-HU10): abrir noticia con `system_open_url`.
7 Hover según ANIMACIONES, alimentado por EV-31 (no por `:hover`).
8 Dos rutas: (a) `status` `error`/`offline` ya muestra aviso (`WidgetNoticias.tsx:15-40`); (b) `!r.ok` de `widget_get_data` (`WidgetNoticias.tsx:23`) silencioso: por C-6 muestra `NOTICIAS_NO_CARGAN`. Abrir una noticia: `browser.open_failed` → `NO_PUDIMOS_ABRIR_EL_NAVEGADOR`; `url.not_allowed` → `ENLACE_NO_PERMITIDO` (PROPUESTA).
9 Abrir una noticia, M: `WidgetNoticias.tsx:53` descarta con `void` el resultado de `system_open_url`. **Puntero encima: NUEVA, L** (EV-31 con su Núcleo, C-2; `tokens.css:1280` `:hover` no se usa; la parte del widget es M: estado `titularEncima` por geometría).
10 `WidgetNoticias.test.tsx`: HE-04-HU06-CA01…CA04; HE-06-HU10-CA01. Faltan: puntero (EV-31 simulado: titular 2 `inside:true` → trazo `seleccion` 1,5; `inside:false` → sin trazo).

## EC-09 · Imagen estática (204:23144 …), Carrusel (204:23180 …) y Animación (204:23216 …, En pausa 2233:9681 …)

1 Nodos: 189,5×115; imagen de 205 de ancho en x=-8 desborda → imagen al 100 % con recorte (A11). Carrusel: píldora 65×21,5 r10,8 «2 de 10». Animación en pausa: imagen op 0,45, píldora 161×43 «Animación pausada», «Uso de CPU».
2 `widget-imagen`, `widget-carrusel`, `carrusel-contador`, `widget-animacion`, `animacion-pausa` (NUEVOS).
3 MEDIDO F6; `.wg-widget-imagen` ya usa `object-fit: cover`.
4 «2 de 10»; «Animación pausada»; «Uso de CPU».
5 Normal, pausada por CPU (EV-21), reanudada (HE-04-HU09-CA05).
6 No interactivos.
7 Carrusel y animación según ANIMACIONES; pausa por EV-21.
8 `asset_resolve` con `asset.unavailable` (IPC-CAT-04, sin texto) y lecturas `!lista.ok`: `WIDGET_NO_CARGA` (PROPUESTA, C-6).
9 **Píldora «2 de 10» del Carrusel: NUEVA, M.** **Estado pausado de la Animación: NUEVO, M**: hoy `WidgetAnimacion.tsx:70-74` solo pinta ⏸ con `aria-label="En pausa"`; faltan texto, «Uso de CPU» e imagen a 0,45. Silenciosos: `WidgetImagen.tsx:30`, `WidgetCarrusel.tsx:25`, `WidgetAnimacion.tsx:25` (S cada uno).
10 `WidgetAnimacion.test.tsx`: HE-04-HU09-CA01, CA04, CA05; `WidgetCarrusel.test.tsx`. Faltan: píldora, texto de pausa, opacidad 0,45, fallo de lectura.

## EC-10 · Texto (204:23246 | 233:25657 | 204:24244 | 204:24274)

1 Nodos: caja 189,5×115 (F6:28); «Texto personal» y «Un paso a la vez.» Regular 13,2 (A12 → 13); `superficie`, trazo `borde`. Rosa y Enfoque: solo cambia la fuente.
2 `widget-texto`, `texto-rotulo`, `texto-cuerpo` (NUEVOS).
3 MEDIDO: caja y tipografía; coordenadas internas NO MEDIDO (huella 0). `.wg-widget-texto` existe.
4 «Texto personal», «Un paso a la vez.»; vacío «Escribe tu nota aquí.» = PROPUESTA (D9, E7; no está en F6 ni en el código), destino `docs/DUDAS.md`.
5 Con texto, vacío.
6 No interactivo.
7 Ninguna.
8 Lectura `!lista.ok` (`WidgetTexto.tsx:21`) silenciosa: `WIDGET_NO_CARGA` (PROPUESTA, C-6).
9 Vacío NUEVO, S; fallo silencioso, S; `data-testid` NUEVOS.
10 `WidgetTexto.test.tsx`. Faltan: vacío, fallo de lectura.

## EC-11 · Reproductor (204:23276 | 233:25682 | 204:24304 | 204:24334) y Sin música (2233:9574 | 2234:19956 | 2234:11141 | 2234:14263)

1 Nodos: 228×91; Pista Bold 13,2 «Pista de estudio», «Spotify», «01:24 / 03:42»; 3 iconos 24. Sin música: «No hay música en reproducción.», iconos op 0,4, el central pasa a Reproducir.
2 `widget-reproductor`, `reproductor-pista`, `reproductor-anterior`, `reproductor-play`, `reproductor-siguiente`, `reproductor-sin-musica` (NUEVOS).
3 MEDIDO F6.
4 Los de la parte 1; el texto de `SIN_MUSICA` (`messages.rs:376`, `WidgetReproductor.tsx:48`) coincide con el Figma: no hay diferencia.
5 Reproduciendo, sin música (iconos op 0,4), carátula no disponible (CA05), sin conexión (CA06).
6 Interactivo (HE-06-HU09), por EV-18.
7 Sin propia.
8 Lectura `!r.ok` (`WidgetReproductor.tsx:21`) silenciosa: `WIDGET_NO_CARGA` (PROPUESTA, C-6).
9 Verificar la opacidad 0,4 de los iconos en «Sin música» (S); `data-testid` NUEVOS; fallo silencioso, S.
10 `WidgetReproductor.test.tsx`: HE-04-HU11-CA01…CA06; HE-06-HU09-CA01. Falta: opacidad 0,4.

## EC-12 · Windi (204:23306 | 233:25707 | 204:24364 | 204:24394)

1 Nodos: instancia «Windi · Widget» 300×291 en (240,16): `superficie_alta`, trazo `borde` 1,5 r12, sombra 1,3; «Windi» Bold 17; mensaje «Pasa «Enviar la presentación» a Por hacer.»; «¿Muevo la tarjeta a Por hacer?»; «Confirmar» `accion` 86×28, «Rechazar» 81×28; campo 221×36 r9; «0 / 2000». Es el panel viejo de chat dibujado sobre el escritorio.
2 `widget-windi` (el botón «Abrir Windi» con `OjosDeWindi tamano={64}`).
3 Panel 300×291: MEDIDO (F6, huella 204-23306), pero **no se construye** (RD-71, D-186, MB-05). Widget de ojos en la capa: caja NO MEDIDO en 83:2 (Figma dibuja el panel); manda el código (64) y MB-05.
4 Los del panel solo como referencia; en la capa no hay texto visible (aria-label «Abrir Windi»).
5 Ojos del tema; al seleccionarlo abre el panel en la ventana principal (`abrirPantalla(invocar,'windi')`).
6 La capa no recibe teclado.
7 Ojos según WI-nn.
8 Sin errores propios.
9 Ya decidido (RD-71, D-186, MB-05) y el código lo hace (`WidgetWindi.tsx`, 19 líneas). Sin diferencia salvo `data-testid`, S.
10 `WidgetWindi.test.tsx`: «muestra los ojos y al seleccionarlo pide abrir el panel de Windi».

## EC-13 · Widget seleccionado (2233:8031 | 2234:18413 | 2234:9546 | 2234:12655)

1 Nodos: anillo 316×138 trazo `seleccion` 2,5 r18 sobre un widget 306×128 (margen 5).
2 `widget-seleccionado`.
3 Radio por D6: radio del widget + 3 = 12 (el 18 del Figma va a Incoherencias). Trazo 2,5 y margen 5: MEDIDO F6. Solo widgets interactivos (`INTERACTIVOS`).
4 Ninguno.
5 **Aparece** al recibir un widget interactivo el clic reenviado (EV-18, HE-06-HU01-CA01); **se quita** al seleccionar otro, al hacer clic fuera de un widget o al terminar el arrastre. Cuándo se quita no tiene fuente: PROPUESTA, destino HE-06-HU01. No interactivo: sin anillo (CA02).
6 Sin foco.
7 Sin propia.
8 Sin errores.
9 **NUEVA, M.** El código entrega la selección al Núcleo (`entregarSeleccion`) pero no dibuja ningún anillo.
10 `Seleccion.test.tsx` L71 y L86 prueban la selección, no el anillo. Falta prueba propia (anillo visible, radio 12, ausente en no interactivos).

## EC-14 · Aviso de wallpaper (2233:9789 …)

1 Píldora 484×42 en (244,12), `superficie_alta`, trazo #b47700 → `estado_pendiente` (C2), r21, texto Rubik 13 → fuente del tema (T11); «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.»; «Cerrar»; autocierre a los 6 s (G5).
2 `aviso-wallpaper`, `aviso-wallpaper-cerrar`.
3 MEDIDO F6.
4 El de G1o.
5 Visible, cerrado.
6 «Cerrar» alcanzable por Tab en la ventana principal.
7 Disolver 0,15 s al cerrar.
8 `WALLPAPER_NO_SE_MUESTRA`.
9 Lo muestra la ventana principal (MB-07, EV-16); no es elemento de la capa. Coincide. S.
10 `Capa.test.tsx`: «HE-02-HU01-CA04».

## EC-15 · Notificación de Windows (204:23336 …)

1 382×180 en (678,286); `superficie`, trazo 1 r10, sin sombra; «Windgets», «Compartir el prototipo», «Recordatorio · 16:00»; botones 32 r7 «Abrir» 78 `superficie_baja` y «Marcar como completada» 250 `accion`; barra de tareas 1093×44 con «Windows» y «10:20» (solo contexto).
2 `notificacion-windows`, `-abrir`, `-completar`.
3 MEDIDO F6.
4 Los de la parte 1.
5 Visible; botones por defecto.
6 Gestionada por Windows.
7 Ninguna propia.
8 Sin errores declarados.
9 **NUEVA, L.** (Detalle de disparo, permisos, app cerrada, aviso `NOTIFICACIONES_BLOQUEADAS` y plugin: S10 en SPEC_Planificador, PL-01.) No hay HU ni código del recordatorio. Fuente: D-05 (`docs/rediseno_final_backend.md` §5.2: recordatorio = notificación a la hora en punto del bloque horario) y `card_set_completed` (IPC-CARD-07) para «Marcar como completada». PROPUESTA: CA «un recordatorio de tarjeta con hora muestra una notificación nativa con “Abrir” y “Marcar como completada”»; destino HE-07/HE-17 y `docs/DUDAS.md`. La barra de tareas del dibujo no se construye (C13).
10 Prueba propuesta cuando exista el CA.

## EC-16 · Área de notificación (204:23370 …)

1 Menú 184×94 en (844,383), trazo 1 r8; 2 opciones 159×32 `superficie_baja` r7: «Abrir», «Salir».
2 Menú nativo de Tauri (`crear_icono`, `area_de_notificacion.rs` L147-167); tooltip «Windgets».
3 MEDIDO F6; un menú nativo no admite estas medidas.
4 «Abrir», «Salir»; M-02 «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» («Salir sin guardar» / «Seguir editando»).
5 Cerrar «×» oculta (IPC-DESK-06); clic o «Abrir» restaura, maximiza y enfoca (RD-69); «Salir» pide EV-24 si hay cambios y llama `app.exit(0)`.
6 Menú nativo: teclado del sistema (Enter/flechas del menú de Windows).
7 Ninguna.
8 IPC-DESK-03 a 08: «Errores: —».
9 **S1 (DECISIÓN):** menú nativo de Windows; la diferencia visual con el Figma (menú propio 184×94, r8, opciones `superficie_baja` r7) queda **aceptada**: no se construye ventana propia ni se cambia el código. Sin pieza nueva; la fila `menu-area` de la tabla de geometría no se prueba (no aplica).
10 `area_de_notificacion.rs`: `ca_he_17_hu01_ca01` (L182), `ca_he_17_hu01_ca02` (L189).

---

## Tabla de geometría

La capa se prueba por escala de Windows (100, 125 y 150 %), ±2 px; las piezas de la ventana principal, a 1200×800 y 960×600.

| Elemento | testid (NUEVO) | Medida | Qué hace | Fuente |
|---|---|---|---|---|
| Capa | `capa-raiz` | monitor completo | declara su marco (C-1) | C-1 |
| Reloj | `widget-reloj` | 190,5×106 | fijo; escala por `aEscala` | F6 |
| Tareas | `widget-tareas` | 306×128 (68 vacío) | alto por estado | F6 |
| Calendario | `widget-calendario` | 210×183 (163 domingo) | alto por estado | F6 |
| Kanban | `widget-kanban` | 323×125,5 (96 vacío; 287 cinco) | alto por estado | F6 |
| Clima | `widget-clima` | 189,5×105,5 | mínimo 103×56 de temperatura (T14) | F6 |
| Noticias | `widget-noticias` | 360×177,5 | fijo | F6 |
| Imagen/Carrusel/Animación/Texto | `widget-imagen` etc. | 189,5×115 | imagen al 100 % con recorte | F6 |
| Reproductor | `widget-reproductor` | 228×91 | fijo | F6 |
| Windi (ojos) | `widget-windi` | 64 (código); panel 300×291 no se construye | — | F6, MB-05 |
| Anillo de selección | `widget-seleccionado` | widget + 10 (margen 5) | sigue al widget | F6, D6 |
| Aviso del wallpaper (ventana principal) | `aviso-wallpaper` | 484×42 en (244,12); 1200×800 y 960×600 | `SPEC_Marco_y_componentes_base.md:51-53` | F6 |
| Notificación de Windows | `notificacion-windows` | 382×180 (marco propio) | declara su marco | F6 |
| Menú del área | — (S1: menú nativo, no se construye) | 184×94 solo como referencia del Figma | diferencia aceptada | F6 |

Estiramiento y geometría de la ventana principal: `SPEC_Marco_y_componentes_base.md:51-53` y L805-822. Prueba numérica de alto con tamaño Grande en los 4 temas (P4).

## Tabla CA → prueba

| CA o requisito | Prueba |
|---|---|
| HE-02-HU01-CA01…CA05 | `Capa.test.tsx` L56, L65, L73, L83 |
| HE-05-HU02-CA05 | `Capa.test.tsx` L184, L197 |
| HE-05-HU04-CA05 | `Capa.test.tsx` L209 |
| HE-04-HU03-CA01…CA04, ET02 | `Reloj.test.tsx` L42, L58, L64, L70, L78 |
| Fecha del Reloj «martes 24 de noviembre» | falta |
| HE-06-HU01-CA01/02 | `Seleccion.test.tsx` L71, L86 |
| Anillo de selección | falta |
| HE-06-HU05-CA01…CA04 | `WidgetKanban.test.tsx` L135, L154, L170, L182 |
| HE-06-HU06-CA01…CA06, ET02, ET08 | `WidgetKanban.test.tsx` L193…L308 |
| HE-06-HU07-CA01 | `WidgetCalendario.test.tsx` L57 |
| Domingo del Calendario | falta |
| Tarea vencida; rótulo «Tareas del día» | falta |
| HE-04-HU05-CA01, CA06…CA08 | `WidgetClima.test.tsx` L46, L70, L80, L85 |
| HE-04-HU06-CA01…CA04, HE-06-HU10-CA01 | `WidgetNoticias.test.tsx` L49, L65, L79, L86, L104 |
| HE-04-HU09-CA01, CA04, CA05 | `WidgetAnimacion.test.tsx` L46, L53, L61 |
| Píldoras «2 de 10» y «Animación pausada» | falta |
| HE-04-HU11-CA01…CA06, HE-06-HU09-CA01 | `WidgetReproductor.test.tsx` L59…L105 |
| HE-17-HU01-CA01, CA02 | `area_de_notificacion.rs` `ca_he_17_hu01_ca01` L182, `ca_he_17_hu01_ca02` L189 |
| HE-17-HU02-CA01…CA03 | `servicio_de_personalizacion_y_configuracion/ultima_pantalla.rs` `ca_he_17_hu02_ca01` L88, `_ca02` L98, `_ca03` L106 |
| HE-17-HU03-CA01…CA04 | `servicio_de_personalizacion_y_configuracion/pruebas_de_salir.rs` `ca_he_17_hu03_ca01` L18, `_ca02` L27, `_ca03` L39, `_ca04` L47 |
| Velo `capa-velo` | falta |
| `data-testid` de la capa y geometría por escala 100/125/150 % | falta |
| Aviso `ESCRITORIO_NO_CARGA` | falta |
| EC-15 Notificación de Windows | falta (sin CA hasta que Paula apruebe la PROPUESTA; pruebas en SPEC_Planificador, PL-01 / S10) |
| EV-31 `pointer_moved` (S3): limitación a 1 cada 50 ms, `inside:false` único al salir | falta (prueba de Rust en el Núcleo; CA derivado PROPUESTA, destino HE-06-HU01 y `docs/contratos.md`) |
| Puntero encima de Calendario y Noticias (S3) | falta (`WidgetCalendario.test.tsx`, `WidgetNoticias.test.tsx`; CA derivado PROPUESTA, destino HE-06-HU07 y HU10) |
| Ciudad del Reloj y `ZONA_HORARIA_NO_DISPONIBLE` (S2) | falta (`Reloj.test.tsx`; CA derivado PROPUESTA, destino HE-04-HU03) |
| Casilla 13,5 con zona de 44 (S4) | falta (`TareasDelDia.test.tsx`; CA derivado PROPUESTA, destino HE-06) |

## Incoherencias resueltas

| Incoherencia | Resolución |
|---|---|
| Hex sin variable (puntos Kanban, barra de tareas, velo, aviso #b47700) | C2, C12, C13, C15, C16, D3 |
| Radios 13 / 12 / 10 / 8 | Widgets 9 (R3); Windi 12 (R2); notificación 10 y menú 8 son cajas distintas (R2, R9) |
| Radio del anillo de selección: Figma 18 | D6: radio del widget + 3 = 12 |
| Rubik en el aviso | Fuente del tema (T11) |
| Imagen de 205 de ancho | Al 100 % con recorte (A11) |
| Nombres de capa viejos | Se ignoran (N11) |
| Reacciones de URL en Figma | No se copian (P1) |
| Código de error ↔ clave (G1n/G1k/G1o) | Mandan las claves del código (C-6) hasta que CONSISTENCIA unifique |

## No se construye

El panel de chat de Windi de 300×291 en la capa (RD-71, D-186, MB-05); la barra de tareas del dibujo de la notificación (C13); estados de carga en widgets sin ellos en Figma.

## Decisiones ya tomadas

D2 a D17, G5 (avisos 4/4/6/hasta cerrar), R3, R8, A10 a A12, T11, T14, E7, E12, P1, RD-69, RD-70, RD-71, D-186, MB-05 (Windi = ojos que abren el panel en la ventana principal), lote 9 (Reloj con ciudad y fecha; Calendario con el mes), D-15 (formato de Reloj e inicio de semana).
- **S1** (EC-16): menú nativo de Windows; diferencia visual aceptada, sin pieza nueva.
- **S2** (EC-03): ciudad del Reloj desde la zona horaria del sistema; si no se lee, `ZONA_HORARIA_NO_DISPONIBLE`.
- **S3** (C-2): puntero encima de Calendario y Noticias con EV-31 `pointer_moved` nuevo en el Núcleo (PROPUESTA, L).
- **S4** (EC-05): casilla 13,5 del Figma con zona táctil de 44.

## Pendientes con destino

| Pendiente | Destino |
|---|---|
| NUEVAS: anillo de selección (M), estado pausado y píldora del Carrusel (M), semana desde domingo (M), tarea vencida (M), fecha y ciudad del Reloj, rótulo de Tareas, `data-testid` de la capa | HE-04, HE-06, PW-12 |
| Geometría por escala 100/125/150 % y pruebas marcadas «falta» | Tabla CA → prueba |
| Códigos PROPUESTA `WIDGET_NO_CARGA`, `ESCRITORIO_NO_CARGA`, `ENLACE_NO_PERMITIDO`, `ZONA_HORARIA_NO_DISPONIBLE` | `docs/DUDAS.md`, `messages.es.json` |
| Contrato PROPUESTA EV-31 `pointer_moved` (S3) | `docs/contratos.md` (tabla de EV) y `docs/DUDAS.md` |
| Unificar nombres código ↔ clave (G1n/G1k/G1o) y ampliar G1h al escritorio | CONSISTENCIA |
| Vacíos de Calendario, Clima y Texto (PROPUESTA, D9) | `docs/DUDAS.md` |
| Recordatorio de tarjeta con notificación nativa (EC-15) | HE-07 / HE-17 |
| Sombra del arrastre en oscuro | Lecturas de Figma pendientes y `docs/DUDAS.md` |

## Pendiente de Paula

Ninguno; resueltos por S1 a S4 el 27-nov.

## Lecturas de Figma pendientes

Coordenadas internas de texto de todos los widgets (huellas en 0); estados leídos solo en claro; sombra oscura de «Tarjeta arrastrada»; interior de Texto, Calendario y Windi.
