# SPEC · Planificador (página 02 Planificador, `79:3`)

Escrita el 26-nov-2026 (UTC-5). Segunda de 8 specs; usa la plantilla de diez partes de `SPEC_Marco_y_componentes_base.md`. **Revisado 26-nov: hallazgos del revisor aplicados** (`.trabajo/REVISION_SPEC_PLANIFICADOR_26nov.md`, 25 puntos). **Pendiente de la aprobación de Paula** (solo ella aprueba las specs). Archivo solo local: no se sube a ningún sitio sin el sí de Paula para este archivo.

**Llegó hasta:** las 125 familias vigentes de `docs/rediseno_flujos_ids_prototipos.md` líneas 63-194 quedan cubiertas (PL-01 a PL-15). Las 6 de «Descartado» `2273:153952` se ignoran. Lo que el inventario no mide va como «NO MEDIDO (motivo)».

**Alcance.** Página `79:3` del Figma: Planificador diario, Tablero Kanban (compacta y expandida), Calendario (mes y semana), Panel del día, Mes y año, Agenda diaria, Reportes (`204:1005`, único reporte), Más reportes, Etiquetas, formularios de etiqueta, columna y tarjeta, Detalle de tarjeta, Mover a, ventanas de confirmación M-08 a M-14 y Windi superpuesto. Código en `apps/desktop/src/screens/{planner_daily,kanban,calendar,agenda,reports,labels,tarjeta,windi}`.

**Fuentes y orden de autoridad.** Figma (`.trabajo/figma/F2a.md`, `F2b.md`, huellas `204-622` … `204-2239`; componentes `F0.md`/`F0b.md`) → `docs/rediseno.md` (RD-nn) → HU (`docs/HE-*.md`) y `docs/contratos.md` → `docs/rediseno_cambios_implementacion.md`. Mandan sin contradecir: `CONSISTENCIA.md` (G-nn), `TEMAS_Y_TOKENS.md` (T-nn, P-nn, Q-nn), `ANIMACIONES.md` (A-nn), `SPEC_Marco_y_componentes_base.md` (MB-nn) y `.trabajo/DECISIONES_PAULA_26nov.md` (D-nn).

**Etiquetas.** MEDIDO · DECISIÓN (id) · PROPUESTA · NO MEDIDO (motivo). Tamaños: S ≤ 1 h, M ≤ media jornada, L > media jornada. Los ids de la parte 1 van en el orden **claro | oscuro | Rosa | Enfoque**. Ids de esta spec: PL-01 … PL-15.

**Convenciones comunes (valen para todas las piezas).**
- Marco de pantalla del Figma 1093×560; la ventana real es 1280×790 (mínimo 960×600), barra lateral de 176 px (56 contraída, MB-02). Las medidas son del marco del Figma; la columna «Regla» de la tabla final dice cómo se reparten en la ventana real.
- Cada pantalla cabe sin scroll de página; solo hace scroll por dentro la lista o el tablero (RD-68, RD-80; Paula: «el menos scroll posible»).
- Radio de control 9, foco 2 px `tinta` (D6), trazos y sombras de MB-01. Fuente del tema (T3/T4); la que elige la persona en Personalización manda sobre la del tema. Tamaño base P4: 12/14/18.
- Se citan, no se repiten: encabezado y miga MB-03, saludo MB-08, botón MB-10, campo MB-11, casilla MB-12, segmentado MB-14, selector MB-15, selector de fecha MB-16, navegación de fecha MB-17, menú ⋮ MB-18, nombre emergente MB-21, ventana emergente MB-22, confirmación y lista M-nn MB-23, avisos MB-24 (posición pendiente, Pendiente 1 de la spec base), vacío MB-25, colores MB-26, Windi MB-05 y MB-27, iconos MB-28, indicador de sincronización MB-04.
- **Tiempo de los avisos (G5, RD-104):** Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrarlo; DISSOLVE 0,15 s EASE_OUT. Los 4 s y 6 s fijos que traen algunos avisos del Figma se leen con esta regla.
- **Color de los avisos (D1, P2):** Advertencia `estado_pendiente`, Éxito `estado_completada`, Error `error`, Información borde e ícono `informacion`; el texto va en `texto`. Los hex del Figma (#b47700, #c68700, #168451, #b32d42, #00d9e2) son de los temas del prototipo: se reemplazan por la variable de estado.
- **Colores de etiqueta y columna (D3, Q2):** solo los 9 del catálogo (MB-26); las etiquetas con #2b7a8c y #2a6f8f pasan a Cian y #b04f7d a Rosa.
- **Morado y cian (P1):** en oscuro, donde se juntan (fila seleccionada, casilla marcada, trazo de la columna Kanban) va `tinta` #f8f5ff; en claro, Rosa y Enfoque #0F2A33.
- **Esqueleto de carga (D9):** 5 barras `linea`, radio 6, anchos 324/300/276/252/228 (medidas del Planificador; en cada pantalla proporcional), paso 54; A-32. «Cargando…» para lectores de pantalla (`aria-busy`).
- **Errores (D10 y regla global):** todo error previsto lleva código estable y texto en el campo que corresponde; el genérico solo para lo imprevisto. Los códigos de `contratos.md` (`a.b`) se citan tal cual; para los fallos genéricos de carga y operación se usan los de CONSISTENCIA (`OPERACION_FALLIDA` G1h, `REPORTE_NO_CARGA` G1i); los códigos nuevos van en MAYÚSCULAS_CON_GUION_BAJO y marcados PROPUESTA (**S9, DECISIÓN:** cada código conserva la convención de su fuente, `a.b` los de `contratos.md` y MAYÚSCULAS_CON_GUION_BAJO los de CONSISTENCIA; los nuevos van en MAYÚSCULAS; no se renombra ninguno).
- **Navegación:** manda la HU y `rediseno_flujos_prototipos.md` §6.1, no las URL «Windgets--Copy-». Un botón sin destino en el Figma hace la acción de la HU.
- **Funciones nuevas del Figma:** todas se implementan (Paula, 26-nov); se marcan «NUEVA» en la parte 9.

---

## PL-01 · Planificador diario y sus estados (`204:622`)

**Familias (14):** base y 13 variantes: Vacío, Cargando, Sin conexión, Vencida, Recordatorio, Arrastre, Densidad cómoda, Todas completadas, Nombre emergente y 4 avisos (Tarjeta inexistente, Tarjeta actualizada, Bienvenida, Tema no aplicado).

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base | `204:622` | `233:13970` | `204:19460` | `204:19542` |
| Vacío | `217:10646` | `233:15258` | `217:10750` | `217:10698` |
| Cargando | `217:10802` | `233:15312` | `217:10906` | `217:10854` |
| Sin conexión | `217:10958` | `233:15370` | `217:11062` | `217:11010` |
| Vencida | `217:11114` | `233:15426` | `217:11218` | `217:11166` |
| Recordatorio | `217:11270` | `233:15479` | `217:11374` | `217:11322` |
| Arrastre | `217:11426` | `233:15535` | `217:11530` | `217:11478` |
| Densidad cómoda | `217:11582` | `233:15589` | `217:11686` | `217:11634` |
| Todas completadas | `2152:30309` | `2153:29846` | `2153:29666` | `2153:29756` |
| Nombre emergente | `2039:14528` | `2039:14605` | `2039:14682` | `2039:14759` |
| Aviso · Tarjeta inexistente | `2142:21514` | `2142:22784` | `2142:24054` | `2142:25324` |
| Aviso · Tarjeta actualizada | `2142:21674` | `2142:22944` | `2142:24214` | `2142:25484` |
| Aviso · Bienvenida | `2251:146090` | `2251:147017` | `2251:146399` | `2251:146708` |
| Aviso · Tema no aplicado | `2251:146250` | `2251:147177` | `2251:146559` | `2251:146868` |

### 2 · Estructura (`data-testid`)

```
planificador                       main (aria-label «Planificador diario», aria-busy)
├ planificador-encabezado          MB-03: miga, título y acción «Nueva tarjeta» (RD-105)
├ planificador-saludo              MB-08 «Hola, {alias}» + fecha larga
├ planificador-aviso-estado        aviso flotante (MB-24, D7): «Se muestran los datos guardados.», Recordatorio; el estado sin conexión va en el indicador MB-04, sin banda
├ planificador-resumen             «Completadas: c de t», barra
│  └ planificador-barra            role=progressbar
├ planificador-lista               ul «Tarjetas de hoy», scroll interno
│  └ planificador-fila-{id}        casilla, hora, título, detalle, prioridad, barra de etiqueta, «i»
├ planificador-linea-insercion     solo al arrastrar
├ planificador-proximas            panel «Próximas a vencer» (hasta 3, RD-98)
├ planificador-mini-calendario     mini calendario del mes
└ planificador-esqueleto           5 barras en «Cargando»
```

### 3 · Medidas (marco 1093×560)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Miga | (200,19) | `texto` (MB-03) | MEDIDO |
| Título | (200,49), Bold 26 | `texto` | MEDIDO |
| «Hola, Paula» | (201,104), Bold 19 | `texto` | MEDIDO; sin emoji (D11) |
| Fecha larga | (201,131) | `texto` | MEDIDO |
| «+ Nueva tarjeta» | 36×36 en (1033,48) | `accion` (MB-10) | MEDIDO |
| Barra de progreso | pista 365×7 radio 4 en (350,167); relleno 91×7 (huella 204-622) | pista `linea`, relleno `detalle` | MEDIDO |
| Fila de tarjeta | 529×44, paso 46, radio 9; barra de etiqueta 4×36 | `superficie_alta`; barra = color de la etiqueta | MEDIDO |
| Panel «Próximas a vencer» | 317×154 en (751,104), radio 8; título Medium 16 en (763,116); 3 filas de texto Regular 13 `tinta` en x=766, y=153/183/213 (paso 30); ícono «Estado pendiente» 14×14 en x=1042 | `superficie_alta` (el único con este relleno de la columna) | MEDIDO |
| Mini calendario | 317×195 en (751,272), radio 8, trazo 1; título «Noviembre 2026» Medium 16 en (765,285); columnas L M X J V S D de 36 de ancho desde x=763, Regular 13; resaltados 32×17 radio 5 | relleno `superficie`, trazo `linea`; resaltados `relleno_completada` / `relleno_vencida` / `relleno_pendiente` con trazo `estado_*` 1 | MEDIDO (huella 204-622) |
| Densidad cómoda | fila de 60, paso 64 | — | MEDIDO |
| Arrastre | fila 530×53 en (216,223); línea de inserción 518×3 en (203,231) | `detalle` | MEDIDO (A-19) |
| Esqueleto | 5 barras de 16 de alto en x=208, anchos 324/300/276/252/228, y=200+54k | `linea` radio 6 | MEDIDO (D9) |
| Sin conexión | sin banda de 523×37: la decisión D7 de CONSISTENCIA la sustituye por el indicador «Sin conexión · N pendientes» en lugar de «Sincronizado» (MB-04, G1g) y un aviso temporal «Se muestran los datos guardados.» (tipo Información, PROPUESTA); el contenido no baja | D7 | DECISIÓN (la banda del Figma queda en Incoherencias, n.º 16) |
| Aviso Recordatorio | píldora Información flotante en y=4, 4 s (G5, D7); no la banda 320×37 en (757,86) del Figma | Información | DECISIÓN (D7) |
| Aviso Tarjeta inexistente | 221×42 en (848,4) | Información | MEDIDO |
| Aviso Tarjeta actualizada | 660×42 en (409,4) | Información (#00d9e2 → `informacion`) | MEDIDO (F2a l.76) |
| Aviso Bienvenida | 426×42 en (643,4) | Éxito (#168451 → `estado_completada`) | MEDIDO |
| Aviso Tema no aplicado | 544×42 en (525,4) | Advertencia (#b47700 → `estado_pendiente`) | MEDIDO |
| Vencida | filas en y=554, 558 y 579: desborda | — | MEDIDO el desborde; se ajusta (Incoherencias, n.º 1) |
| Globo «Nueva tarjeta» | 99×36 en (986,92), relleno `tinta`, Nunito 13 | MB-21 | MEDIDO |

Ventana real: lista `1fr` con mínimo 529 y columna derecha de 317 (panel y mini calendario); a 960×600 la columna derecha pasa bajo la lista en dos columnas (PROPUESTA, regla del menor scroll). La lista toma el alto que queda y hace scroll dentro.

### 4 · Textos literales

- «Hola, {alias}» (D11), fecha larga (RD-40).
- «Completadas: c de t»; «Te quedan n» solo para lectores de pantalla; «¡Completaste todas tus tarjetas de hoy!» (HE-12-HU03).
- Vacío: «Completadas: 0 de 0» y «No tienes tarjetas para hoy.» (la capa del Figma dice «No hay…»; manda el texto visible).
- Cargando: «Cargando…».
- Sin conexión (D7): indicador «Sin conexión · N pendientes» (G1g, MB-04) y aviso temporal «Se muestran los datos guardados.»; sin cambios pendientes (N = 0) el indicador dice «Sin conexión» (PROPUESTA).
- Vencida: «Vencida · 23 nov · Universidad»; tarjeta «Responder correo del profesor».
- Recordatorio: «Recordatorio · 16:30 · Compartir el prototipo».
- Avisos: «Esta tarjeta ya no existe.»; Bienvenida y Tema no aplicado, los de MB-08 y RD-95; «Tarjeta actualizada»: «Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.» (MEDIDO, F2a l.76).
- Hora «HH:MM» o «Sin hora»; prioridad Alta, Media, Baja. Globo «Nueva tarjeta».
- «Próximas a vencer» vacío (S12, PROPUESTA, NO MEDIDO; destino `docs/DUDAS.md`): «No tienes tarjetas próximas a vencer.»; con el texto en Regular 13 `texto` en el lugar de las filas. El panel conserva su título y medidas.
- Notificación de Windows (S10; mismo contenido que EC-15 en SPEC_Escritorio): título «Windgets», cuerpo «{título de la tarjeta}», línea «Recordatorio · {HH:MM}», botones «Abrir» y «Marcar como completada».

### 5 · Estados

| Estado | Qué se ve |
|---|---|
| Normal | saludo, resumen, lista, panel y mini calendario |
| Cargando | esqueleto de 5 barras; sin resumen |
| Vacío | resumen en 0 de 0 y `EstadoVacio` (MB-25); «Nueva tarjeta» sigue (HE-12-HU03-ET06) |
| Sin conexión | indicador MB-04 «Sin conexión · N pendientes» y aviso temporal con los datos guardados (D7); sin banda; nada se bloquea |
| Vencida | la tarjeta con fecha vencida: fecha en `error`, fondo `relleno_vencida`, punto `estado_vencida`; la lista se ajusta para caber (Paula) |
| Recordatorio | con la ventana principal visible y enfocada: aviso Información flotante en y=4 con hora y título; 4 s (G5) o se cierra (D7). En cualquier otro caso (ventana minimizada, oculta en el área de notificación, otra aplicación al frente): notificación de Windows (S10, PL-01 parte 9) |
| Arrastre | fila levantada (A-17), línea de inserción (A-19); al soltar, la tarjeta cambia de hora (S6); si falla, la fila vuelve a su sitio (A-18) con el aviso de error |
| Día elegido (S11) | el clic en un día del mini calendario cambia el día que muestra el Planificador: fecha larga, resumen y lista pasan a ese día; el día elegido lleva trazo `seleccion` 1,5 (PROPUESTA) y «hoy» conserva su resalte; el clic en «hoy» vuelve al día actual |
| Cómoda | filas de 60, según el interruptor de densidad de Configuración (D-29); aquí solo se consume |
| Todas completadas | barra al 100 %, mensaje de logro |
| Hover y foco | A-25, A-26 |

### 6 · Teclado y foco

Tab: «Nueva tarjeta», luego por fila la casilla y la «i». Espacio alterna la casilla; Enter en «i» abre el Detalle. Esc cierra el aviso con foco. El foco vuelve al control que abrió cada ventana (MB-22). El arrastre de fila (S6) no tiene teclado (la lista la ordena el Núcleo por hora, ET02/ET03); el camino de teclado para cambiar la hora de una tarjeta es el «Programar» de la Agenda (S7, PL-04). Mini calendario (S11): cada día es un botón en la secuencia de Tab (los de otro mes no existen); Enter o Espacio lo elige; el día elegido lleva `aria-pressed="true"` y `aria-label` con la fecha larga. «Próximas a vencer» (S12): cada fila es un botón; Enter abre el Detalle (PL-12) y al cerrarlo el foco vuelve a esa fila.

### 7 · Animaciones

A-09 (entra el contenido), A-17/A-18/A-19 (arrastre), A-25/A-26 (hover, foco), A-30 (globo), A-32 (esqueleto), A-33 (vacío), A-05/A-06/A-07 (avisos), A-36 (sincronización).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Sin red | `SIN_CONEXION` (G1g) | «Se muestran los datos guardados.» | aviso temporal + indicador MB-04, sin «Reintentar» |
| Tarjeta eliminada en otro computador | `card.not_found` | «Esta tarjeta ya no existe.» | aviso Información |
| Falla la lectura del día | `PLANIFICADOR_NO_CARGA` PROPUESTA | «No pudimos cargar tu día. Intenta de nuevo más tarde.» | con «Reintentar» |
| Falla al marcar completada | `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso Error, hasta cerrar |
| Tema no aplicado | RD-95 | «No pudimos aplicar el tema …» | aviso Advertencia |
| Arrastrar a un bloque que ya pasó (S6) | `time_block.past` | «No puedes asignar tarjetas a un bloque horario que ya pasó.» | aviso Advertencia (6 s); la fila vuelve |
| Arrastrar después de la fecha límite (S6) | `time_block.after_due_date` | «No puedes programar la tarjeta después de su fecha límite.» | aviso Advertencia (6 s); la fila vuelve |
| Arrastrar junto a filas sin hora (S6) | `ARRASTRE_SIN_HORA` PROPUESTA | «Suelta la tarjeta junto a otra que tenga hora para cambiar su hora.» | aviso Información; la fila vuelve; no se llama al Núcleo |
| Arrastrar una tarjeta eliminada (S6) | `card.not_found` | «Esta tarjeta ya no existe.» | aviso Información |
| Falla el guardado al arrastrar (S6) | `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso Error, hasta cerrar |
| Falla la lectura del día elegido (S11) | `PLANIFICADOR_NO_CARGA` PROPUESTA | «No pudimos cargar tu día. Intenta de nuevo más tarde.» | con «Reintentar»; se conserva el día anterior elegido |
| Falla la lectura de «Próximas a vencer» (S12) | `PROXIMAS_NO_CARGAN` PROPUESTA | «No pudimos cargar las próximas tarjetas. Intenta de nuevo más tarde.» | dentro del panel, con «Reintentar» |
| Windows tiene bloqueadas las notificaciones o falla el envío (S10) | `NOTIFICACIONES_BLOQUEADAS` PROPUESTA | «Windows tiene bloqueadas las notificaciones de Windgets. Actívalas en la configuración de Windows para recibir recordatorios.» | aviso Advertencia (6 s) en la ventana; ver parte 9 |

### 9 · Diferencia con el código

- `PlannerDaily.tsx` (253 l.): hoy solo hay cabecera (`:207` y siguientes), `Resumen` (`:102`), lista y `EstadoVacio` (`:222`). Faltan: saludo (MB-08), barra de etiqueta 4×36, panel «Próximas a vencer» (NUEVA; IPC-CARD-16 de RD-98 existe y «ninguna vista la consume»), mini calendario (NUEVA), esqueleto (hoy solo `aria-busy`), estado sin conexión (indicador y aviso, D7), Vencida, Recordatorio (NUEVA) y los 4 avisos. **L**. El panel «Próximas a vencer» se alimenta de `card_list_upcoming` (`ipc/simulado.ts:543`, IPC-CARD-16, RD-98); el anillo no está aquí (va en Reportes, PL-07).
- `planificador.css:13-20`: 27 px y 18 px pasan a la escala del tema (P4). **S**.
- Arrastre sobre la lista: no existe. **M**. **S6 (DECISIÓN):** al soltar cambia la hora de la tarjeta con IPC-CARD-10 `card_assign_time_block` (contrato existente, sin contrato nuevo; PROPUESTA de la regla): `date` = día mostrado (S11); `hour` = la de la fila que queda justo debajo del punto de inserción; si cae al final de la lista, la de la fila de arriba; si esa fila no tiene hora, la de la otra vecina; si ninguna vecina tiene hora, no se llama al Núcleo y sale `ARRASTRE_SIN_HORA`. Soltar donde ya estaba no escribe. Tras el éxito se vuelve a leer la lista (el Núcleo la reordena por hora, ET02/ET03) y sale el aviso Éxito «Tarjeta asignada al bloque <inicio> – <fin>.» (IPC-CARD-10). Con la escritura incluida la pieza sigue en **M** (arrastre con `PointerSensor`, regla de hora, reversión y 5 errores). CA derivado PROPUESTA «arrastrar una fila junto a otra cambia la hora de la tarjeta a la de esa fila»; destino HE-12 y `docs/DUDAS.md`.
- Línea de inserción y esqueleto: **S** cada uno.
- **Mini calendario (S11, DECISIÓN), NUEVA, M:** estado `diaElegido` (por defecto hoy) que controla fecha larga, resumen y lista. Lee el día con `planner_get_today` ampliado con `date?: DateIso` (PROPUESTA de contrato, destino `docs/contratos.md` IPC-CARD-08 y `docs/DUDAS.md`; sin `date` se comporta igual que hoy). El mes mostrado es el actual (sin flechas: no hay medida ni decisión; el día de otro mes no se puede elegir). Mientras no exista `date`, la lista de un día distinto de hoy se arma con `calendar_get_day` (IPC-CARD-14), sin resumen. «Nueva tarjeta» sigue creando con la fecha del día elegido si no es pasado; en un día pasado `can_create=false` aplica su mensaje de IPC-CARD-14. Un día de otro mes no existe.
- **«Próximas a vencer» (S12, DECISIÓN), NUEVA, S:** tope de 3 (RD-98, `card_list_upcoming`, IPC-CARD-16); cada fila es un botón que abre el Detalle de la tarjeta (PL-12) sin cambiar de pantalla ni de día; vacío con el texto de la parte 4 (PROPUESTA, destino `docs/DUDAS.md`); fallo de lectura `PROXIMAS_NO_CARGAN`. Si la tarjeta ya no existe al abrirla: `card.not_found` «Esta tarjeta ya no existe.»
- **Recordatorio con notificación de Windows (S10, DECISIÓN), NUEVA, L:**
  - **Qué la dispara:** un reloj del Núcleo (Rust) que cada minuto compara la hora local con las tarjetas no completadas que tienen fecha y hora (`scheduled_date`, `scheduled_hour`, IPC-CARD-10); a la hora en punto del bloque (D-05, `docs/rediseno_final_backend.md` §5.2) emite una vez por tarjeta y bloque el evento PROPUESTA **EV-32 `card_reminder_due`** `{ card_id, title, hour }` (destino `docs/contratos.md` y `docs/DUDAS.md`) y muestra la notificación. Se cancela si la tarjeta se completa, se borra o se reprograma antes. No recupera los recordatorios de horas que ya pasaron cuando la app no estaba abierta (sin migración: el «ya avisado» vive en memoria).
  - **Ventana visible y enfocada:** no hay notificación de Windows; se muestra el aviso Información de D7 (4 s). En los demás casos, la notificación.
  - **App minimizada u oculta en el área de notificación** (el «×» solo oculta, IPC-DESK-06): notifica igual. **App cerrada con «Salir»:** no hay recordatorio, porque no existe un servicio en segundo plano ni se construye uno (PROPUESTA; límite aceptado, se documenta en la ayuda de la tarjeta si Paula lo pide).
  - **Botones:** «Abrir» restaura y enfoca la ventana (RD-69) y abre el Detalle de la tarjeta; «Marcar como completada» llama `card_set_completed` (IPC-CARD-07) sin abrir la ventana. Si la tarjeta ya no existe, `card.not_found`, y el fallo de escritura es `OPERACION_FALLIDA`, ambos como aviso en la ventana la próxima vez que se muestre.
  - **Permisos denegados o notificaciones desactivadas en Windows** (o falla el envío): el Núcleo no lo calla; deja una marca y, al mostrarse la ventana, sale el aviso Advertencia `NOTIFICACIONES_BLOQUEADAS` (PROPUESTA, 6 s) una vez por sesión. Con la ventana visible el recordatorio llega igual por el aviso Información, así que no se pierde.
  - **Plugin:** `grep notification` en `apps/desktop/src-tauri/Cargo.toml` y `apps/desktop/package.json` no encuentra nada: el repo solo tiene `tauri-plugin-dialog` y `tauri-plugin-single-instance`. `tauri-plugin-notification` no se ha añadido y, además, en escritorio no admite botones de acción (solo móvil); para «Abrir» y «Marcar como completada» hay que lanzar el toast con la API de Windows (`windows` =0.62.2 ya está, con features nuevas de `Windows.UI.Notifications`) y atender su activación. Requiere identidad de aplicación (AppUserModelID) instalada: el acceso directo que crea el instalador (SPEC_Instalador_y_web) debe llevarlo y solo se puede probar con la app instalada. Si el spike no logra los botones, la alternativa es notificación sin botones que al pulsarla abre la ventana (decisión de Paula entonces). Tamaño **L**: reloj en Rust, EV-32, toast con activación, aviso de bloqueo, marca de sesión y pruebas.
  - CA derivados PROPUESTA (destino HE-07/HE-17 y `docs/DUDAS.md`): «una tarjeta con hora genera un recordatorio a la hora en punto»; «con la ventana visible se muestra el aviso y no la notificación»; «si Windows bloquea las notificaciones se avisa en la ventana».

### 10 · Pruebas

Una por CA: vacío con «Nueva tarjeta» visible; cargando con 5 barras; sin conexión sin bloquear; aviso al abrir una tarjeta borrada; 100 % con mensaje; fila con etiqueta del catálogo; mini calendario y próximas; Playwright a 960×600 sin scroll de página; esqueleto de 5 barras; «Sin conexión» con el indicador y el aviso de D7. Nuevas por decisión: S6 arrastrar la fila 3 sobre la 1 llama `card_assign_time_block` con la hora de la 1 y reordena; soltar junto a filas sin hora no escribe y muestra `ARRASTRE_SIN_HORA`; `time_block.past` y `time_block.after_due_date` devuelven la fila con su texto; S11 clic en el día 24 cambia fecha larga, resumen y lista, y el clic en «hoy» vuelve; S12 el vacío con su texto, clic en una fila abre el Detalle y `PROXIMAS_NO_CARGAN` con «Reintentar»; S10 (Rust) el reloj emite EV-32 una sola vez por bloque, se cancela al completar, no dispara bloques pasados y con la ventana enfocada no lanza la notificación; envío bloqueado → `NOTIFICACIONES_BLOQUEADAS` (la notificación real solo se prueba a mano con la app instalada).

---

## PL-02 · Tablero Kanban, compacta y expandida, con estados (`204:704`, `204:1139`)

**Familias (18):** Tablero Kanban, Expandida, Tablero vacío, Columna vacía, Muchas columnas, Menú de tarjeta, Menú de columna, Columna predefinida, Arrastre de tarjeta, Arrastre de columna, Densidad cómoda, Sin tablero descargado, Nombre emergente (general, Nueva columna, Vista expandida, Vista compacta), avisos Máximo de columnas y Columna inexistente.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Compacta | `204:704` | `233:14023` | `204:19624` | `204:19725` |
| Expandida | `204:1139` | `233:14340` | `204:20494` | `204:20604` |
| Tablero vacío | `217:12764` | `233:15642` | `217:12906` | `217:12835` |
| Columna vacía | `217:12977` | `233:15719` | `217:13119` | `217:13048` |
| Muchas columnas | `217:13190` | `233:15794` | `217:13332` | `217:13261` |
| Menú de tarjeta | `217:13403` | `233:15872` | `217:13545` | `217:13474` |
| Menú de columna | `217:13616` | `233:15951` | `217:13758` | `217:13687` |
| Columna predefinida | `2152:30825` | `2153:31043` | `2153:30683` | `2153:30863` |
| Arrastre de tarjeta | `217:13829` | `233:16030` | `217:13971` | `217:13900` |
| Arrastre de columna | `217:14042` | `233:16105` | `217:14184` | `217:14113` |
| Densidad cómoda | `220:22023` | `233:16761` | `220:22096` | `220:22169` |
| Sin tablero descargado | `2152:30457` | `2153:30274` | `2153:29936` | `2153:30105` |
| Nombre emergente | `2039:14836` | `2039:15014` | `2039:15192` | `2039:15370` |
| Nombre emergente · Nueva columna | `2039:15548` | `2039:15796` | `2039:16044` | `2039:16292` |
| Nombre emergente · Vista expandida | `2257:50523` | `2257:51119` | `2257:51715` | `2257:52311` |
| Nombre emergente · Vista compacta | `2257:50712` | `2257:51308` | `2257:51904` | `2257:52500` |
| Aviso · Máximo de columnas | `2142:20870` | `2142:22140` | `2142:23410` | `2142:24680` |
| Aviso · Columna inexistente | `2142:21192` | `2142:22462` | `2142:23732` | `2142:25002` |

### 2 · Estructura

```
kanban                         main «Tablero Kanban», aria-busy
├ kanban-encabezado            MB-03; acciones: selector de vista (compacta/expandida, MB-14) y «Nueva tarjeta»
├ kanban-aviso                 avisos de máximo y columna inexistente (MB-24)
├ kanban-tablero               contenedor con scroll horizontal
│  ├ kanban-columna-{id}       encabezado (nombre, color, contador, ⋮) + lista
│  │  ├ kanban-columna-menu    MB-18: «Editar columna», «Eliminar columna»
│  │  └ kanban-tarjeta-{id}    título, fecha y estado, prioridad, etiquetas (expandida), ⋮
│  │     └ kanban-tarjeta-menu MB-18: «Ver detalle», «Mover a», «Editar», «Eliminar»
│  └ kanban-nueva-columna      columna fantasma 56×380 «Nueva columna»
├ kanban-linea-insercion       al arrastrar
└ kanban-esqueleto             5 barras
```

### 3 · Medidas (marco 1093×560)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Columna (3 por pantalla) | 259×380 en x=200/471/742, y=104, radio 12 | `superficie`, trazo de columna = color del catálogo (P1 en oscuro) | MEDIDO |
| Tarjeta compacta | 241×70, paso 78, radio 6 | `superficie_alta` | MEDIDO |
| Tarjeta expandida | 241×85 a 143 | `superficie_alta` | MEDIDO |
| Nueva columna | 56×380 en (1013,104) | borde `borde` | MEDIDO |
| Selector de vista | 75×36 en (994,48) | MB-14 | MEDIDO |
| Muchas columnas | columnas de 201 de ancho | — | MEDIDO |
| Cómoda | tarjetas de 78 en lugar de 70 | — | MEDIDO |
| Menú de tarjeta | 181×164 en (266,190) | MB-18 | MEDIDO |
| Menú de columna | 181×88 | MB-18 | MEDIDO |
| Línea de inserción | 3 de alto | `detalle` | MEDIDO (A-19) |
| Globos | 30 de alto, relleno `tinta`, radio 6, texto `fondo` Medium 13, padding 6/10 | MB-21 | MEDIDO |
| Aviso Máximo de columnas | 474×42 en (595,4) | Advertencia | MEDIDO (F2a l.96) |
| Aviso Columna inexistente | 234×42 en (835,4) | Información | MEDIDO (F2a l.97) |
| Aviso Error al guardar tarjeta | 462×42 en (607,4) | Error | MEDIDO |

En ventana real: 4 columnas de 259 caben a 1200 de ancho; con más, el tablero hace scroll horizontal y a partir de 6 columnas pasan a 201 (Muchas columnas).

### 4 · Textos literales

- «Tablero vacío», «Columna vacía» (estados vacíos, MB-25).
- Menú de tarjeta: «Ver detalle», «Mover a», «Editar», «Eliminar».
- Menú de columna: «Editar columna», «Eliminar columna». Predefinida: «Eliminar columna» deshabilitada y el texto «Las columnas por defecto no se pueden eliminar.» como nombre emergente.
- Sin tablero descargado: «Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.» (RD-84).
- Avisos: «Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.» y «Esta columna ya no existe.» (RD-92).
- Globos: «Nueva columna», «Vista expandida», «Vista compacta».

### 5 · Estados

| Estado | Qué se ve |
|---|---|
| Normal | 3+ columnas con sus tarjetas |
| Tablero vacío | solo las columnas por defecto, vacías, y el texto de MB-25 |
| Columna vacía | texto «Columna vacía» dentro de la columna |
| Muchas columnas | ancho 201 y scroll horizontal |
| Cargando | 5 barras `linea` (D9) |
| Sin tablero | texto de RD-84, sin «Nueva tarjeta» activa |
| Arrastre | tarjeta levantada, destino resaltado, línea (A-17 a A-19) |
| Cómoda / compacta | tarjetas de 78 / 70; expandida suma tipo, etiquetas y descripción |
| Predefinida | «Eliminar columna» deshabilitada sin opacidad (MB-01) |

### 6 · Teclado y foco

Tab recorre encabezados, tarjetas y «Nueva columna». Enter abre el Detalle; Alt+↑/↓ no se define. Hoy el arrastre solo usa `PointerSensor` (`Kanban.tsx:389`): el `KeyboardSensor` de dnd-kit NO existe. PROPUESTA (RNF-30): añadirlo (Espacio levanta, flechas mueven, Espacio suelta, Esc cancela); «Mover a» es el camino de teclado para mover tarjeta (HE-11-HU02 de `DUDAS.md`). **S7 (DECISIÓN): se construye.** Anuncios de dnd-kit en español: «Tarjeta levantada», «Tarjeta movida a la columna {nombre}, posición {n}», «Tarjeta soltada», «Movimiento cancelado»; el movimiento por teclado llama los mismos `card_move` y `column_move` que el ratón y sus mismos errores. Trabajo listado en la parte 9. ⋮ abre el menú (MB-18: flechas, Enter, Esc).

### 7 · Animaciones

A-17, A-18, A-19, A-25, A-26, A-30, A-32, A-33, A-03/A-04 (menús).

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Máximo de columnas | `column.limit_reached` | «Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.» |
| Columna borrada en otro computador | `column.not_found` | «Esta columna ya no existe.» (RD-92) |
| Sin «Por hacer» descargada | `column.not_found` | «Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.» (RD-84) |
| Eliminar predefinida | `column.default_not_deletable` | «Las columnas por defecto no se pueden eliminar.» |
| Reordenar con orden inválido | `column.order_invalid` | texto PROPUESTA «No pudimos reordenar las columnas. Intenta de nuevo.» |
| Tablero no carga | `TABLERO_NO_CARGA` PROPUESTA | «No pudimos cargar tu tablero. Intenta de nuevo más tarde.» con «Reintentar» |

### 9 · Diferencia con el código

- `Kanban.tsx` (571 l.): vista compacta y expandida (`:61`, `:305`), arrastre de tarjeta (`:128`) y de columna (`:231`), «Mover a» como submenú (`:196-205`), `arrastre.ts`. Faltan: selector de vista como segmentado en la cabecera (hoy ícono, `IconoDeVista`), esqueleto, «Muchas columnas» a 201, «Sin tablero descargado» con su texto, globos, avisos de máximo y columna inexistente en aviso emergente. **M**.
- `kanban.css` (203 l.): anchos y radios al Figma (columna 259, radio 12, tarjeta radio 6), trazo con P1. **M**.
- «Mover a» como submenú frente a la ventana del Figma: ver PL-13 e Incoherencias. **M**.
- `KeyboardSensor` en el arrastre de tarjeta y de columna (`Kanban.tsx:389` solo tiene `PointerSensor`): decidido (S7, RNF-30); CA derivado PROPUESTA «una tarjeta se puede mover entre columnas solo con el teclado», destino HE-11 y `docs/DUDAS.md`. **M**.

### 10 · Pruebas

Existentes (`Kanban`, `MoverTarjeta`, `ReordenarColumnas`, `VistaDelTablero`) se conservan. Nuevas: S7 con teclado (Espacio, flecha derecha, Espacio) la tarjeta cambia de columna y se llama `card_move`; Esc cancela y no escribe; el anuncio en español; texto de RD-84 en «Sin tablero»; máximo de columnas con su código; predefinida deshabilitada con su nombre emergente; 201 de ancho con más de 5 columnas; la tarjeta arrastrada marca el destino; Playwright a 960×600.

---

## PL-03 · Calendario (mes y semana) y sus estados (`204:805`, `204:1249`)

**Familias (8):** Calendario, Calendario · Semana, Día con el puntero encima, Aviso Día pasado, Nombre emergente Mes anterior y Mes siguiente, Semana · Nombre emergente Semana anterior y Semana siguiente.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Calendario (mes) | `204:805` | `233:14097` | `204:19826` | `204:19937` |
| Semana | `204:1249` | `233:14423` | `204:20714` | `204:20781` |
| Día con el puntero encima | `2155:32112` | `2156:3648` | `2156:3300` | `2156:3474` |
| Aviso · Día pasado | `2155:32612` | `2156:4796` | `2156:4446` | `2156:4621` |
| Nombre emergente · Mes anterior | `2155:31312` | `2156:1570` | `2156:1212` | `2156:1391` |
| Nombre emergente · Mes siguiente | `2155:31491` | `2156:2107` | `2156:1749` | `2156:1928` |
| Semana · Nombre emergente · Semana anterior | `2155:31722` | `2156:2624` | `2156:2286` | `2156:2455` |
| Semana · Nombre emergente · Semana siguiente | `2155:31891` | `2156:3131` | `2156:2793` | `2156:2962` |

### 2 · Estructura

```
calendario                     main «Calendario»
├ calendario-encabezado        MB-03 con acciones: navegación (MB-17) y selector Mes/Semana (MB-14)
├ calendario-mes               rejilla 7×(5 o 6)
│  └ calendario-dia-{aaaa-mm-dd}  número, hasta 3 puntos de tarjeta, «Hoy» 20×20
├ calendario-semana            cuadrícula con líneas de hora, 7 columnas
│  └ calendario-semana-dia-{fecha}
├ calendario-aviso             MB-24
├ calendario-esqueleto         5 barras (D9)
└ panel-del-dia                PL-04
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Selector Mes/Semana | 146×36 en (923,48) | MB-14 | MEDIDO |
| Navegación | 136×36 en (592,48) | MB-17 | MEDIDO |
| Celda del mes | 125×44 a 105 de alto (crece con tarjetas) | `superficie`, borde `linea` | MEDIDO |
| «Hoy» | 20×20 | `detalle`, texto `sobre_detalle` | MEDIDO |
| Semana | cuadrícula 809×356 en (260,126); líneas de hora cada 24 desde y=170; 7 columnas de ≈116 | `linea` | MEDIDO |
| Día con el puntero encima | fondo `superficie_baja` (E18, valor del componente «Fila»); la huella no muestra diferencia | `superficie_baja` | NO MEDIDO (el Figma no la dibuja); A-20 define la transición |
| Aviso Día pasado | 325×42 en (744,4), borde #b47700 | Advertencia `estado_pendiente` | MEDIDO |
| Globos de navegación | «Mes anterior» 94×30 en (592,92), «Mes siguiente» en (626,92), «Semana anterior» 117 de ancho, «Semana siguiente» 125 | MB-21 | MEDIDO |

### 4 · Textos literales

«Mes» · «Semana» · «Hoy»; aviso «No puedes crear tarjetas en días pasados.»; globos «Mes anterior», «Mes siguiente», «Semana anterior», «Semana siguiente». Vacío y cargando del Calendario: el Figma no los dibuja. Cargando (D9): «Cargando…» con 5 barras `linea` radio 6. Vacío (E9, PROPUESTA D9): «No tienes tarjetas este mes.» cuando el mes no tiene ninguna (cada día sin puntos). Error: ver parte 8.

### 5 · Estados

Normal; hover de día (A-20: resalta el día); día pasado (clic crea → aviso Advertencia en vez de abrir el formulario); hoy (`detalle`); día con tarjetas (puntos del color de la etiqueta, D3); cargando; semana. Focus: A-26.

### 6 · Teclado y foco

Hoy (código): los días son `<button>` sin `grid` ni `onKeyDown`; solo Tab recorre los días y Enter abre el Panel del día; Esc lo cierra. Flechas entre días y Re Pág/Av Pág para cambiar de mes no existen ni los define un CA o el Figma; **S7 (DECISIÓN): se construyen** con esta propuesta (RNF-30, patrón de rejilla): la cuadrícula es `role="grid"` con un solo día en el orden de Tab (roving tabindex); ← y → mueven ±1 día; ↑ y ↓ ±7 días; Inicio y Fin van al primer y último día de la semana; Re Pág y Av Pág cambian al mes anterior y siguiente conservando el día (o el último del mes si no existe); si una flecha sale del mes visible, cambia de mes. Enter abre el Panel del día y Esc lo cierra devolviendo el foco al día. Al cambiar de mes se anuncia «Noviembre 2026» a lectores de pantalla.

### 7 · Animaciones

A-20 (hover del día), A-21 (cambio de mes o semana), A-22b (hoy, estático), A-30 (globos), A-05/A-06 (aviso).

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Crear en día pasado | sin código: el Calendario ya no deja crear (`can_create=false`, IPC-CARD-14, HE-10-HU04-CA04); el clic muestra el aviso. Si el envío llegara con fecha pasada, aplica `due_date.in_past` de `contratos.md` | «No puedes crear tarjetas en días pasados.» |
| No cargan las tarjetas del mes | `CALENDARIO_NO_CARGA` PROPUESTA | «No pudimos cargar el calendario. Intenta de nuevo más tarde.» |
| Sin red | `SIN_CONEXION` | aviso temporal e indicador de MB-04 (D7) |

### 9 · Diferencia con el código

`Calendario.tsx` (349 l.), `calendario.css` (176 l.) ya traen mes y semana con scroll por día (`calendario.css:131`); faltan globos de navegación, aviso de día pasado, esqueleto y el error. **M**. Teclado de rejilla (S7, `grid`, roving tabindex, flechas, Inicio/Fin, Re Pág/Av Pág): NUEVA, **M**; CA derivado PROPUESTA «el calendario se recorre solo con el teclado», destino HE-10 y `docs/DUDAS.md`.

### 10 · Pruebas

Teclado (S7): → pasa del 30 al 1 del mes siguiente; ↓ suma 7; Re Pág cambia de mes conservando el día; Av Pág del 31 de octubre a noviembre cae en 30; Tab entra y sale con un solo día enfocable; Enter abre el Panel y Esc devuelve el foco; aviso de día pasado; globos con su texto; hoy marcado; semana con 7 columnas y 24 líneas; cargando con esqueleto; error con «Reintentar».

---

## PL-04 · Panel del día y su vacío (`204:1316`)

**Familias (2):** Panel del día y Vacío.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Panel del día | `204:1316` | `233:14461` | `204:20848` | `204:20974` |
| Vacío | `2155:32348` | `2156:4238` | `2156:3822` | `2156:4030` |

### 2 · Estructura

`panel-del-dia` > `panel-del-dia-encabezado` (fecha larga y «Cerrar» MB-22), `panel-del-dia-lista` (`panel-del-dia-fila-{id}`), `panel-del-dia-nueva` («Nueva tarjeta»).

### 3 · Medidas

Panel 325×388 en (741,104), `superficie_alta`; fila 293×34, paso 38; texto vacío «No tienes tarjetas para este día.» en (757,184), 200×19. Todo MEDIDO.

### 4 · Textos

«No tienes tarjetas para este día.»; fila: hora o «Sin hora» + título; botón «Nueva tarjeta».

### 5 · Estados

Con tarjetas, vacío (MB-25), cargando (D9), día pasado (sin «Nueva tarjeta», mismo aviso de PL-03).

### 6 · Teclado y foco

Se abre con Enter en el día; el foco entra al encabezado del panel; Esc lo cierra y devuelve el foco al día (MB-22).

### 7 · Animaciones

A-01/A-02 si es ventana; A-33 (vacío). Mientras sea panel lateral, A-09.

### 8 · Errores

`SIN_CONEXION`; `PANEL_DIA_NO_CARGA` PROPUESTA «No pudimos cargar las tarjetas de este día. Intenta de nuevo más tarde.».

Vacío y cargando (E9, D9): 5 barras `linea` radio 6 mientras carga; en el Panel del día vacío, «No tienes tarjetas para este día.» (medido arriba).

### 9 · Diferencia

`PanelDelDia.tsx` (92 l.): tiene lista con scroll (`calendario.css:148-156`); falta el texto exacto del vacío, el esqueleto y el error. **S**.

### 10 · Pruebas

Vacío con su texto; lista con scroll interno; «Nueva tarjeta» con la fecha del día.

---

## PL-05 · Mes y año y Escribir año (`204:1442`, `219:14757`)

**Familias (2).**

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Mes y año | `204:1442` | `233:14583` | `204:21100` | `204:21239` |
| Escribir año | `219:14757` | `233:16579` | `219:14788` | `219:14819` |

### 2 · Estructura

`mes-anio` (selector flotante, MB-16) > `mes-anio-meses` (12 botones), `mes-anio-anio` (flechas y valor), `mes-anio-escribir` (campo `elegir-anio`, teclado numérico), `mes-anio-error`.

### 3 · Medidas

Selector 392×260 en (523,92); 12 meses 83×32; año 110×36 con flechas 36×36 (el campo «Año» en (638,99) abre «Escribir año», `SET_VARIABLE` + `219:14757`). Mes elegido: `seleccion` con `sobre_seleccion`. Radio 9 y `borde_campo` 1,5 en los controles (R6; la huella 204-1442 dibuja `linea` 1 radio 8: Incoherencias, n.º 15).

**Escribir año (`219:14757`), MEDIDO:** marco 360×364. «Elegir año» Medium 18 en (16,14). Campo «Año» 328×36 en (16,52), `borde_campo` 1,5 radio 9, valor «2026». Ayuda «Escribe un año entre 1970 y 2100.» Regular 13 `texto` en (16,98) (permanente, no es un error). Teclas 105×32, trazo `linea` 1, radio 9, en x=16/127/238 e y=132/176/220/264 (1-9, luego «Borrar» en (16,264), «0» en (127,264)). «Listo» Principal 66×36 en (277,262); «Cancelar» Secundario 91×36 en (252,314).

### 4 · Textos

«Elegir año», «Borrar», «Listo», «Cancelar»; ayuda permanente «Escribe un año entre 1970 y 2100.» (no es un mensaje de error: RD-77).

### 5 · Estados

Normal, mes elegido, escribiendo año, hover y foco. Año fuera de 1970-2100 (RD-77): los meses quedan deshabilitados, sin error ni trazo `error`; la ayuda permanente ya dice el rango.

### 6 · Teclado y foco

Flechas en la rejilla de meses; Enter elige; Esc cierra y devuelve el foco al botón «Mes y año»; en el campo, Enter equivale a «Listo». El teclado numérico en pantalla es NUEVA (el campo ya admite el teclado físico).

### 7 · Animaciones

A-03/A-04 (selector flotante).

### 8 · Errores

Ninguno previsible en esta pieza: el rango 1970-2100 no produce error, deshabilita los meses (RD-77, huella 219-14757); no hay código `date.year_out_of_range`.

### 9 · Diferencia

`SelectorMesAnio.tsx` (122 l.): ya existe el selector de mes y año y la constante `ANIO_MINIMO=1970` / `ANIO_MAXIMO=2100` (`:10-11`) con su validación (`:43-44`). Falta «Escribir año» como marco 360×364 con teclado numérico en pantalla (NUEVA) y que el campo «Año» lo abra. **M**.

### 10 · Pruebas

Año 1969 y 2101 → meses deshabilitados, sin mensaje de error; 2026 → cierra y cambia el mes; teclas numéricas; «Cancelar» cierra; Esc devuelve el foco.

---

## PL-06 · Agenda diaria y sus estados (`204:916`)

**Familias (8):** Agenda diaria, Asignar bloque, Quitar bloque, Bloque pasado, Sin tarjetas por programar, dos avisos al soltar, Nombre emergente «Elegir un día».

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Agenda diaria | `204:916` | `233:14203` | `204:20048` | `204:20137` |
| Asignar bloque | `217:15308` | `233:16180` | `217:15426` | `217:15367` |
| Quitar bloque | `217:15485` | `233:16240` | `217:15603` | `217:15544` |
| Bloque pasado | `217:15662` | `233:16302` | `217:15780` | `217:15721` |
| Sin tarjetas por programar | `2152:30628` | `2153:30603` | `2153:30443` | `2153:30523` |
| Aviso · Bloque que ya pasó | `2152:31011` | `2153:31383` | `2153:31223` | `2153:31303` |
| Aviso · Después de la fecha límite | `2152:31150` | `2153:31623` | `2153:31463` | `2153:31543` |
| Nombre emergente · Elegir un día | `2152:31289` | `2153:31871` | `2153:31703` | `2153:31787` |

### 2 · Estructura

```
agenda                         main «Agenda diaria»
├ agenda-encabezado            MB-03; «Mes y año» y «Elegir un día»
├ agenda-dias                  7 botones de día 74×32 en y=104
├ agenda-bloques               7 bloques 535×48, paso 52 desde y=151
│  └ agenda-bloque-{hora}      hora, tarjeta asignada, «Quitar del horario»
├ agenda-sin-horario           «Tarjetas sin horario» 315×114 en (754,151)
│  └ agenda-tarjeta-{id}
└ agenda-aviso                 avisos al soltar (MB-24)
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Día | 74×32 en y=104 | seleccionado `seleccion` | MEDIDO |
| Bloque | 535×48, paso 52 desde y=151 | `superficie`, `linea` | MEDIDO |
| Asignar bloque (destino al arrastrar) | borde de 2 con relleno `superficie_baja` | `detalle` | MEDIDO |
| Quitar del horario | botón 158×32 | MB-10 secundario | MEDIDO |
| Bloque pasado | atenuado sin opacidad (texto `texto` secundario sobre `superficie_baja`) | — | MEDIDO el estado; token PROPUESTA |
| Tarjetas sin horario | 315×114 en (754,151) | `superficie_alta` | MEDIDO |
| Globo «Elegir un día» | 94×30 en (975,92) | MB-21 | MEDIDO |

### 4 · Textos

«Bloque pasado»; «Quitar del horario»; «Tarjetas sin horario»; «No tienes tarjetas pendientes por programar.»; avisos «No puedes asignar tarjetas a un bloque horario que ya pasó.» y «No puedes programar la tarjeta después de su fecha límite.»; globo «Elegir un día».

### 5 · Estados

Normal; asignar (arrastre sobre un bloque libre); quitar; bloque pasado (no recibe tarjetas); sin tarjetas por programar (MB-25); cargando (D9); avisos Advertencia.

### 6 · Teclado y foco

Hoy el único camino es arrastrar (HE-11-HU02-ET01; `DUDAS.md` línea 47: no hay alternativa de teclado). Se agrega con la HU de accesibilidad (RNF-30): tarjeta con Enter abre «Programar» con la lista de bloques libres. NO MEDIDO: el Figma no la dibuja; **S7 (DECISIÓN): se construye** como PROPUESTA: «Programar» es una lista de bloques libres con flechas ↑/↓, Enter asigna con `card_assign_time_block` (IPC-CARD-10) y Esc cierra; los bloques pasados no aparecen; los errores son los de IPC-CARD-10 (`time_block.past`, `time_block.after_due_date`, `card.not_found`) con los avisos de arrastre. En una tarjeta ya asignada, Enter ofrece también «Quitar del horario» (IPC-CARD-11).

### 7 · Animaciones

A-17 a A-19 (arrastre), A-21 (cambio de día), A-30 (globo), A-33.

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Bloque que ya pasó | `time_block.past` (`contratos.md`) | «No puedes asignar tarjetas a un bloque horario que ya pasó.» |
| Después de la fecha límite | `time_block.after_due_date` (`contratos.md`) | «No puedes programar la tarjeta después de su fecha límite.» |
| Sin red | `SIN_CONEXION` | aviso temporal e indicador MB-04 (D7) |

### 9 · Diferencia

`Agenda.tsx` (251 l.), `NavegacionDeLaAgenda.tsx` (127), `arrastre.ts`, `agenda.css` (153): hay arrastre y asignar. Faltan: «Quitar del horario» como botón de 158×32 (verificar), «Bloque pasado», los dos avisos con su texto, el globo, el esqueleto. **M**. «Programar» por teclado (S7): NUEVA, **M**; CA derivado PROPUESTA «una tarjeta se asigna a un bloque solo con el teclado», destino HE-11 y `docs/DUDAS.md`.

### 10 · Pruebas

Teclado (S7): Enter en una tarjeta abre «Programar» con solo los bloques libres no pasados; ↓ y Enter asignan con `card_assign_time_block`; Esc cierra sin escribir; «Quitar del horario» por teclado; soltar en bloque pasado → aviso con su texto; soltar después de la fecha límite → aviso; quitar del horario devuelve la tarjeta a «sin horario»; vacío con su texto.

---

## PL-07 · Reportes (`204:1005`) con estados, rango y filtro de etiquetas

**Familias (24):** Reportes, Vacío, Cargando, Error, Sin conexión, Sin tarjetas, Rango recortado, Rango de fechas (`204:1683`), Rango personalizado, Elegir Desde, Elegir Hasta, Elegir Desde debajo de su campo, Elegir Hasta debajo de su campo, 4 errores del rango, Puntero encima de la gráfica, Estado elegido Vencidas, Rango cambiado sin tarjetas, Filtrar etiquetas (`204:1766`), Filtro abierto, Máximo, Sin etiquetas. **`204:1005` es el único reporte** (Paula).

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Reportes | `204:1005` | `233:14263` | `204:20226` | `204:20299` |
| Vacío | `217:16271` | `233:16363` | `217:16357` | `217:16314` |
| Cargando | `217:16400` | `233:16409` | `217:16486` | `217:16443` |
| Error | `217:16529` | `233:16455` | `217:16615` | `217:16572` |
| Sin conexión | `217:16658` | `233:16501` | `217:16744` | `217:16701` |
| Sin tarjetas | `2161:32852` | `2163:34272` | `2163:34092` | `2163:34182` |
| Rango recortado | `2161:32950` | `2163:34536` | `2163:34362` | `2163:34449` |
| Rango de fechas (selector) | `204:1683` | `233:14789` | `204:21582` | `204:21665` |
| Rango personalizado | `219:57179` | `233:16610` | `219:57330` | `219:57481` |
| Elegir Desde | `219:57192` | `233:16623` | `219:57343` | `219:57494` |
| Elegir Hasta | `219:57261` | `2129:51350` | `2129:51002` | `2129:51176` |
| Desde · debajo de su campo | `2129:50723` | `2129:51245` | `2129:50897` | `2129:51071` |
| Hasta · debajo de su campo | `2129:50810` | `2129:51332` | `2129:50984` | `2129:51158` |
| Error · Fecha de inicio posterior | `2129:50160` | `2129:50535` | `2129:50285` | `2129:50410` |
| Error · Campo obligatorio | `2129:50191` | `2129:50566` | `2129:50316` | `2129:50441` |
| Error · Rango mayor de un año | `2129:50222` | `2129:50597` | `2129:50347` | `2129:50472` |
| Error · Fecha no válida | `2129:50253` | `2129:50628` | `2129:50378` | `2129:50503` |
| Puntero encima de la gráfica | `2160:1449` | `2163:33346` | `2163:33162` | `2163:33254` |
| Estado elegido · Vencidas | `2160:1603` | `2163:33678` | `2163:33438` | `2163:33558` |
| Rango cambiado · Estado sin tarjetas | `2160:1785` | `2163:33994` | `2163:33798` | `2163:33896` |
| Filtrar etiquetas (selector) | `204:1766` | `233:14845` | `204:21748` | `204:21831` |
| Filtro abierto | `2161:33045` | `2163:34875` | `2163:34623` | `2163:34749` |
| Filtro · Máximo | `2161:33171` | `2163:35259` | `2163:35001` | `2163:35130` |
| Filtro · Sin etiquetas | `2161:33300` | `2163:35600` | `2163:35388` | `2163:35494` |

### 2 · Estructura

```
reportes                        main «Reportes», aria-busy
├ reportes-encabezado           MB-03; acciones: «Rango de fechas» (MB-15), «Filtrar etiqueta», «Más reportes»
├ reportes-aviso-recorte        «Mostrando datos desde …»
├ reportes-completadas          tarjeta «Tarjetas completadas» con gráfica (reportes-grafica, reportes-globo)
├ reportes-cumplimiento         tarjeta «Tasa de cumplimiento»: número `83,3 %` y su frase; sin anillo
├ reportes-estados              tarjeta «Vencidas, pendientes y completadas»: anillo (reportes-anillo), «20 / tarjetas» y leyenda de 3 estados, lista (reportes-lista-estado)
├ reportes-esqueleto            barras
├ reportes-rango                panel de rango (MB-22 ligero)
│  ├ reportes-rango-desde / -hasta   campo + calendario (MB-16) debajo
│  ├ reportes-rango-cancelar / -aplicar
│  └ reportes-rango-error-{campo}
└ reportes-filtro               lista con casillas (MB-12), máximo 3
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Tarjeta «Tarjetas completadas» | 530×180 en (200,104) | `superficie_alta`, radio 12 | MEDIDO |
| Tarjeta «Tasa de cumplimiento» | 327×180 en (742,104); título Nunito Medium 15 `tinta` en (758,118); «83,3 %» Bold 46 en (758,159); «10 de 12 tarjetas completadas a tiempo» Regular 14 en (758,236). Sin anillo | `superficie_alta` | MEDIDO (huella 204-1005) |
| Tarjeta «Vencidas, pendientes y completadas» | 869×192 en (200,296); título Medium 15 `tinta`; subtítulo Regular 13 `texto`; dona 120×120 en (216,360); «20» Bold 26 en (260,392) y «tarjetas» Regular 13 en (254,424); puntos de leyenda 10×10 en x=368, y=390/416/442; leyenda en x=386, y=386/412/438 | `superficie_alta`, radio 12; Completadas #2e8b57 fijo, Pendientes #a88b00 fijo, Vencidas `error` | MEDIDO (huella 204-1005) |
| Selector de rango | 298×221 en (587,92), 4 opciones | MB-15 | MEDIDO |
| Panel de rango personalizado | 397×216, radio 10 | papel de MB-22 | MEDIDO |
| Campos Desde y Hasta | 133×36 (valores «01/11/2026» y «24/11/2026») | MB-11; error: trazo `error` 2, radio 9 | MEDIDO |
| Botones | Cancelar 95×36, Aplicar 83×36 | MB-10 | MEDIDO |
| Calendario debajo del campo | 352×301 | MB-16 | MEDIDO |
| Error de rango | texto en y=120 | `error` | MEDIDO |
| Selector de etiquetas (variante vigente, `204:1766`, con Aplicar) | 298×271 en (727,92); 4 opciones 273×36 en x=739, y=135/175/215/255, con ✓ en x=976; «Hasta 3 etiquetas» Regular 12 `texto` en (739,320); «Aplicar» 81×36 en (930,312) | P1 en oscuro | MEDIDO |
| Esqueleto | barras `linea` de 14 de alto, radio 6 | — | MEDIDO (D9) |
| Sin tarjetas | tarjeta 869×120, radio 12 | — | MEDIDO |
| Rango recortado | aviso en (200,100), contenido +24; opción «Últimos 12 meses» | — | MEDIDO |
| Estado elegido Vencidas | lista 869×140 en (200,500): **desborda** y se ajusta | — | MEDIDO el desborde |
| Globo de la gráfica | «4 nov · 2 tarjetas completadas» | MB-21 | MEDIDO |
| Fuente de «Rango personalizado» | Rubik en el Figma; manda la del tema (T3) | — | DECISIÓN |

**Selectores flotantes (R6, T8).** Selector de rango, selector de etiquetas, selector de fecha flotante (MB-16), lista de horas y lista de etiquetas llevan el radio 9 y el trazo `borde_campo` 1,5 de R6 y la fuente del tema a 14 y 12 de T8, que mandan sobre la huella (`linea` 1 radio 8 en 204-1442 y 204-1766; `borde` 1 radio 8 en la lista de horas 2148:26578). Anotado en Incoherencias, n.º 15.

Ventana real: gráfica y cumplimiento en una fila (530 y 327) y estados debajo; a 960×600 el alto de cada tarjeta se reduce para que todo quepa sin scroll de página (RD-80). La lista de «Vencidas» ocupa el alto que queda (tope = alto disponible) y hace scroll interno de la lista, no de la página.

### 4 · Textos

- Tarjetas: «Tarjetas completadas»; «Tasa de cumplimiento» con `83,3 %` (coma decimal, espacio antes de %) y «10 de 12 tarjetas completadas a tiempo»; «Vencidas, pendientes y completadas» con el subtítulo «Tarjetas con fecha límite en el periodo elegido.», «tarjetas» bajo el total del anillo y la leyenda «Completadas · n · p %», «Pendientes · n · p %», «Vencidas · n · p %».
- Estados: «No hay datos para este rango de fechas y estos filtros.» (Vacío); «Cargando…»; «No se pudo cargar el reporte.» (Error, con «Reintentar»); «Sin conexión».
- Sin tarjetas: «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.»
- Recorte: «Mostrando datos desde el 12 oct 2026, cuando creaste tu primera tarjeta.»
- Opciones: «Últimos 7 días», «Últimos 30 días», «Últimos 12 meses», «Personalizado»; panel «Rango personalizado», «Desde», «Hasta», «Cancelar», «Aplicar».
- Errores: «La fecha de inicio no puede ser posterior a la fecha de fin.», «Este campo es obligatorio.», «El rango máximo es de un año.», «Diligencia una fecha válida.»
- Filtro (variante vigente, con Aplicar, RD-80): «Hasta 3 etiquetas», «Aplicar»; con 3 elegidas, «Puedes elegir hasta 3 etiquetas.»; sin etiquetas, «Aún no tienes etiquetas.» (los dos últimos de la variante `2161:33045`; ver Incoherencias, n.º 17, y Lecturas de Figma pendientes).
- Estado sin tarjetas: globo «No hay tarjetas en este estado.»
- Listas de estado: «Pagar el gimnasio» 22 nov 2026 y «Responder correo del profesor» 23 nov 2026 (datos del prototipo).

### 5 · Estados

Normal; cargando; vacío; error; sin conexión (datos guardados si los hay); sin tarjetas; rango recortado; puntero en la gráfica (globo); estado elegido (la lista del estado aparece bajo la tarjeta); estado sin tarjetas (globo); selector de rango abierto; personalizado con Desde/Hasta; cuatro errores; filtro abierto, con 3 elegidas (las demás deshabilitadas) y sin etiquetas. La gráfica no cambia hasta «Aplicar» (RD-80).

### 6 · Teclado y foco

Tab: rango, filtro, «Más reportes», gráfica (las barras son enfocables, `aria-label` con fecha y número), estados. Los campos de fecha abren su calendario con Enter o Alt+↓; Esc cierra. El foco entra al panel de rango y vuelve al botón.

### 7 · Animaciones

A-03/A-04 (selector), A-09, A-21 (cambio de rango), A-25/A-26, A-27 (error del campo), A-32, A-33.

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Inicio posterior al fin | `range.start_after_end` | «La fecha de inicio no puede ser posterior a la fecha de fin.» | campo Hasta |
| Campo vacío | `range.start_required`, `range.end_required` | «Este campo es obligatorio.» | cada campo |
| Más de 366 días | `range.too_long` | «El rango máximo es de un año.» | campo Hasta |
| Fecha mal escrita | `range.invalid_date` | «Diligencia una fecha válida.» | campo |
| Más de 3 etiquetas | `labels.too_many` (RD-96) | «Puedes elegir hasta 3 etiquetas.» | lista |
| Etiqueta ya no existe | `labels.not_found` | «Esta etiqueta ya no existe.» | filtro |
| Falla la lectura | `REPORTE_NO_CARGA` (G1i) | «No se pudo cargar el reporte.» | tarjetas, con «Reintentar» |
| Sin red | `SIN_CONEXION` | «Sin conexión» | indicador MB-04 y tarjetas con datos guardados (D7) |

Los errores de forma salen todos a la vez, uno por campo (regla global).

### 9 · Diferencia con el código

- `Reports.tsx` (166 l.), `SelectorRango.tsx` (151), `FiltroEtiquetas.tsx` (51), `EstadosTarjetas.tsx` (131), `GraficaCompletadas.tsx` (35), `TasaCumplimiento.tsx` (33), `reportes.css` (57): tarjetas, selector (`OPCIONES` `:20-24`), filtro y estados existen. La gráfica es `LineChart` de 640×240 (`GraficaCompletadas.tsx:20`) y el pastel de 240×240 vive en `EstadosTarjetas.tsx:78`: se ajustan a 530×180 y a la dona de 120×120 de la tarjeta «Vencidas, pendientes y completadas» (se reutiliza ese `PieChart`); `TasaCumplimiento.tsx` pasa a número `83,3 %` sin anillo. **M**.
- Faltan: aviso de rango recortado, «Sin tarjetas», esqueleto, error con «Reintentar», sin conexión, globo de la gráfica, estado «sin tarjetas» con globo, calendarios debajo de cada campo y lista de «Vencidas» sin desborde. **L**.
- Máximo de 3 etiquetas y casillas con ✓: **S**.

### 10 · Pruebas

Existentes (`SelectorRango`, `FiltroEtiquetas`, `EstadosTarjetas`, `TasaCumplimiento`) se conservan. Nuevas: los 4 códigos de rango con su texto; aviso de recorte con la fecha; sin tarjetas; esqueleto; error con «Reintentar»; máximo de 3; lista de Vencidas sin scroll de página a 960×600 (Playwright).

---

## PL-08 · Más reportes (`204:1581`)

**Familias (1).** `204:1581` | `233:14717` | `204:21378` | `204:21480`.

D16 (Paula): Evento = 2. **`204:1005` es el único reporte**; «Más reportes» es la ampliación de ese mismo reporte (cifras y desglose por tipo, etiqueta, columna y prioridad), no otro informe. Se abre desde «Más reportes» (flujos §6.1) y regresa con «← Reportes».

### 2 · Estructura

`reportes-mas` > `reportes-mas-cifras` (4 cifras) > `reportes-mas-tarjeta-{tema}` (6 tarjetas) > filas con barras.

### 3 · Medidas

4 cifras de 208×64; 6 tarjetas de 281×152; botón «← Reportes» en el título (MB-03). Desde Reportes se llega con «Ver más reportes ›», 116×36 en (953,48) (termina en x=1069, no desborda), botón de texto normal (A4) con texto Medium 14 en `seleccion` (huella 204-1005; el marco no tiene relleno). El Figma trae además filas duplicadas de texto plano y barras residuales bajo el anillo (F2a, incoherencia 2): esas no se copian. Radios y tokens: `superficie_alta` radio 12 (MEDIDO por familia); cada barra de desglose en el color del catálogo (D3). **Lectura 27-nov (S8, `.trabajo/figma/F5.md`, sección «Lectura 27-nov · 204:1581», MEDIDO, solo lectura):**

| Parte | Medida (marco 1093×560) |
|---|---|
| Ruta, título y controles | ruta «Planificador › Reportes › Más reportes» en (200,19); título «Más reportes» 159×35 en (244,49); volver 36×36 en (200,48); rango de fechas 172×36 en (713,48); filtro de etiquetas 132×36 en (893,48); «Sincronizado» en (1000,20) |
| 4 cifras | 208×64 en y=96, x=200 / 420 / 640 / 860 (la última 209); ícono 20 en (16,13), número en (44,6) de alto 33, etiqueta en (44,37) de alto 16 |
| 6 tarjetas | 281×152; título en (16,14) de alto 20; fila 1 en y=172 con x=200 / 494 / 788; fila 2 en y=336 (NO MEDIDO el x de cada una; PROPUESTA las mismas tres columnas 200 / 494 / 788) |
| «Completadas por etiqueta» | anillo de 96 con «12» y «tarjetas»; leyenda con punto de 10 |
| «Completadas por tipo» | barras verticales de 36 de ancho |
| «Vencidas por prioridad» | barras horizontales de 8 de alto desde x=112, máximo 110 |
| «Próximos 7 días» | barras de 35,8 de ancho por día |
| «Tiempo medio de completado» | cifra «3» de 89×44 en (16,64) |
| Botón de Windi | 48 en (1029,496) |

### 4 · Textos

**Literales del Figma (S8, MEDIDO 204:1581):**

- 4 cifras, en este orden: «Vencidas», «Pendientes», «Completadas», «A tiempo» (ejemplo del Figma: «Vencidas 2 · Pendientes 6 · Completadas 12 · A tiempo 10 de 12»).
- 6 tarjetas, en este orden: «Completadas por etiqueta», «Completadas por tipo», «Vencidas por prioridad», «Tarjetas por columna», «Próximos 7 días», «Tiempo medio de completado».
- Contenido de ejemplo del Figma (datos de prototipo, no valores fijos): etiqueta «Proyecto · 4», «Universidad · 3», «Personal · 3», «Salud · 2» con «12» y «tarjetas» en el anillo; tipo Tarea 8, Recordatorio 3, Evento 1; prioridad Alta 2, Media 1, Baja 1; columnas Por hacer 5, En progreso 3, Hecho 4; cifra «3» del tiempo medio.
- Evento = 2 (D16) manda sobre el 1 que dibuja la capa de «Completadas por tipo»; es dato de ejemplo.
- La unidad del «3» de «Tiempo medio de completado» (días u horas) no está en el Figma: NO MEDIDO; PROPUESTA «3 días» (la tarjeta vence por día), destino `docs/DUDAS.md`.

### 5 a 8

Estados: normal, cargando, vacío, error, sin conexión (los mismos textos de PL-07). Teclado: Tab por tarjetas, «← Reportes» al inicio del título. Animaciones: A-08, A-09, A-32. Errores: `REPORTE_NO_CARGA` (G1i), `SIN_CONEXION` (PL-07).

### 9 · Diferencia

No existe en el código: `reports/` solo tiene las tres tarjetas de la base. NUEVA, **L**. Con S8 ya no queda texto por definir: los títulos y cifras se copian literales de la parte 4.

### 10 · Pruebas

Los 4 rótulos de cifras y los 6 títulos de tarjeta literales y en su orden (S8); cifras 208×64 y tarjetas 281×152 (±2 px); Evento muestra 2; «← Reportes» vuelve con los filtros que tenía; caben 6 tarjetas a 960×600 sin scroll de página (las tarjetas se reordenan en 2 filas de 3 con alto proporcional).

---

## PL-09 · Etiquetas y sus estados (`204:1078`)

**Familias (5):** Etiquetas, Vacío, Nombre emergente, Aviso Máximo de etiquetas, Aviso Etiqueta inexistente.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Etiquetas | `204:1078` | `233:14309` | `204:20372` | `204:20433` |
| Vacío | `217:17387` | `233:16547` | `217:17449` | `217:17418` |
| Nombre emergente | `2039:16540` | `2039:16603` | `2039:16666` | `2039:16729` |
| Aviso · Máximo de etiquetas | `2142:20564` | `2142:21834` | `2142:23104` | `2142:24374` |
| Aviso · Etiqueta inexistente | `2142:20717` | `2142:21987` | `2142:23257` | `2142:24527` |

### 2 · Estructura

`etiquetas` > `etiquetas-encabezado` (MB-03 con «Nueva etiqueta») > `etiquetas-lista` > `etiquetas-fila-{id}` (muestra, nombre, `etiquetas-editar-{id}`, `etiquetas-eliminar-{id}`); `etiquetas-vacio`; `etiquetas-aviso`.

### 3 · Medidas

Fila 869×44, paso 48, radio 9, `superficie_alta`; muestra de color 15×15 (color del catálogo); botones de editar y eliminar 32×32 en x=981 y 1021; globo «Nueva etiqueta» (MB-21). Aviso Máximo de etiquetas 474×42 en (595,4), Advertencia (F2b; el Figma trae 6 s, que coincide con G5). Aviso Etiqueta inexistente 232×42 en (837,4), Información, 4 s. Todo MEDIDO.

Con el globo o un aviso visible la lista se desplaza: filas de 44 a 52 (la segunda fila pasa de y=152 a 164; sus botones, de y=110 a 113 y de 158 a 173; F2b).

### 4 · Textos

«Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.»; «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.»; «Esta etiqueta ya no existe.»; globo «Nueva etiqueta».

### 5 a 8

Estados: normal, vacío, cargando (esqueleto D9), máximo (botón «Nueva etiqueta» sigue activo y muestra el aviso, D7), hover y foco. Teclado: Tab por fila: editar, eliminar. Animaciones: A-25, A-26, A-30, A-32, A-33, A-05/A-06. Errores: `label.limit_reached` «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.»; `label.not_found` «Esta etiqueta ya no existe.» (RD-92); `ETIQUETAS_NO_CARGAN` PROPUESTA «No pudimos cargar tus etiquetas. Intenta de nuevo más tarde.»; `ETIQUETA_NO_ELIMINADA` PROPUESTA «No pudimos eliminar la etiqueta. Intenta de nuevo más tarde.» (aviso Error, hasta cerrar).

### 9 · Diferencia

`Labels.tsx` (151 l.), `etiquetas.css` (20 l.): lista y acciones existen; falta esqueleto, avisos con texto, globo y el ajuste al catálogo de 9 (D3, migración de datos Q2). **M**.

### 10 · Pruebas

Existentes (`Labels`, `EditarEtiqueta`, `FormularioEtiqueta`). Nuevas: aviso de máximo; aviso al editar una etiqueta borrada; muestra del catálogo.

---

## PL-10 · Formularios de etiqueta y de columna con sus errores

**Familias (12):** Nueva etiqueta (`204:2047`), Editar etiqueta (`204:2095`), Nueva columna (`204:2143`), Editar columna (`204:2191`) y 8 errores: Nueva etiqueta (Obligatorio, Nombre largo, Nombre repetido), Editar etiqueta (Color no disponible), Nueva columna (Obligatorio, Nombre largo, Nombre repetido), Editar columna (Color no disponible).

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Nueva etiqueta | `204:2047` | `233:15016` | `204:22310` | `204:22358` |
| Editar etiqueta | `204:2095` | `233:15034` | `204:22406` | `204:22454` |
| Nueva columna | `204:2143` | `233:15052` | `204:22502` | `204:22550` |
| Editar columna | `204:2191` | `233:15070` | `204:22598` | `204:22646` |
| Nueva etiqueta · Obligatorio | `2143:22996` | `2144:24638` | `2143:25240` | `2144:24514` |
| Nueva etiqueta · Nombre largo | `2143:23192` | `2144:24886` | `2143:25436` | `2144:24762` |
| Nueva etiqueta · Nombre repetido | `2143:23388` | `2144:25134` | `2143:25632` | `2144:25010` |
| Editar etiqueta · Color no disponible | `2143:24679` | `2144:26786` | `2143:26923` | `2144:26662` |
| Nueva columna · Obligatorio | `2143:23584` | `2144:25492` | `2143:25828` | `2144:25258` |
| Nueva columna · Nombre largo | `2143:23949` | `2144:25960` | `2143:26193` | `2144:25726` |
| Nueva columna · Nombre repetido | `2143:24314` | `2144:26428` | `2143:26558` | `2144:26194` |
| Editar columna · Color no disponible | `2143:24875` | `2144:27144` | `2143:27119` | `2144:26910` |

### 2 · Estructura

`formulario-{etiqueta|columna}` (ventana MB-22) > `-nombre` (campo MB-11), `-color` (`CatalogoColores`, MB-26), `-error-{campo}`, `-guardar`, `-cancelar`, `-cerrar`. Al cerrar con datos escritos pide el descarte (RD-106, MB-23 M-02).

### 3 · Medidas

Modal 420×314 en (337,123); campo 372×34; catálogo de 9 colores (MB-26). Trazo del campo con error: `error` 2 (D-error de campo). MEDIDO.

Con error el modal crece y sube (centrado en vertical), tanto en etiqueta como en columna:
- Error bajo el nombre (obligatorio, nombre largo, nombre repetido): alto 314 → 352, y 123 → 104; mensaje en (361,226).
- «Color no disponible» (error bajo el catálogo): alto 314 → 336, y 123 → 112; mensaje en (361,350).

### 4 · Textos

Título «Nueva etiqueta», «Editar etiqueta», «Nueva columna», «Editar columna»; botones «Guardar» y «Cancelar»; errores: «Este campo es obligatorio.», «El nombre de la etiqueta no puede superar los 30 caracteres.», «El nombre de la columna no puede superar los 30 caracteres.», «Ya existe una etiqueta con ese nombre.», «Ya existe una columna con ese nombre.», «Este color ya no está disponible. Elige otro.»

### 5 · Estados

Vacío con «Guardar» habilitado y errores al pulsar; error visible; guardando; color no disponible (el catálogo se vuelve a pedir y conserva lo escrito, RD-85). Foco en el primer campo con error.

### 6 · Teclado y foco

Foco atrapado (RD-103); Enter guarda; Esc cierra con la pregunta de descarte; al cerrar vuelve al botón que abrió.

### 7 · Animaciones

A-01/A-02/A-02b (ventanas y descarte), A-27 (campo), A-25/A-26.

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Nombre vacío o color vacío | `name.required` / `color.required` | «Este campo es obligatorio.» |
| Nombre largo | `name.too_long` | etiqueta: «El nombre de la etiqueta no puede superar los 30 caracteres.»; columna: «El nombre de la columna no puede superar los 30 caracteres.» |
| Nombre repetido | `name.duplicate` (`contratos.md`, para etiqueta y para columna) | «Ya existe una etiqueta con ese nombre.» / «Ya existe una columna con ese nombre.» |
| Color desactivado | `color.invalid` (RD-85) | «Este color ya no está disponible. Elige otro.» |
| Etiqueta o columna borrada | `label.not_found`, `column.not_found` (RD-92) | «Esta etiqueta ya no existe.» / «Esta columna ya no existe.»; se cierra la ventana |

Todos los códigos de esta tabla existen en `contratos.md` (`name.required`, `name.too_long`, `name.duplicate`, `color.required`, `color.invalid`, `label.not_found`, `column.not_found`). Falla al eliminar una columna: `COLUMNA_NO_ELIMINADA` PROPUESTA «No pudimos eliminar la columna. Intenta de nuevo más tarde.» (aviso Error, hasta cerrar).

### 9 · Diferencia

`FormularioEtiqueta.tsx` (128 l.), `FormularioColumna.tsx` (126 l.): campos, catálogo y validación por campo existen (`FormularioEtiqueta.tsx:19-22`). Falta el crecimiento del modal a 352 (y=104) o 336 (y=112) con el error en y=226 o y=350 y ajustar el catálogo a los 9 (D3). **S**.

### 10 · Pruebas

Existentes (`CrearColumna`, `EditarColumna`, `FormularioEtiqueta`, `EditarEtiqueta`); se agrega cada texto literal de la parte 4 y color no disponible con el formulario abierto.

---

## PL-11 · Formulario de tarjeta: Nueva y Editar, selectores y errores

**Familias (15):** Nueva tarjeta (`204:1915`), Editar tarjeta (`204:1981`), Nueva · Etiquetas abierta, Máximo, Sin etiquetas, Sin elegir; Fecha límite abierta, Fecha del bloque abierta, Hora del bloque abierta; Campos vacíos; Error al guardar; 3 marcos de Errores; Editar · Etiquetas abierta. (El Detalle sin datos va en PL-12.)

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Nueva tarjeta | `204:1915` | `233:14944` | `204:22046` | `204:22112` |
| Editar tarjeta | `204:1981` | `233:14980` | `204:22178` | `204:22244` |
| Nueva · Etiquetas abierta | `2140:19720` | `2140:21665` | `2140:20369` | `2140:21017` |
| Nueva · Etiquetas · Máximo | `2140:19887` | `2140:21832` | `2140:20536` | `2140:21184` |
| Nueva · Etiquetas · Sin etiquetas | `2140:20059` | `2140:22004` | `2140:20708` | `2140:21356` |
| Nueva · Etiquetas · Sin elegir | `2140:20210` | `2140:22154` | `2140:20858` | `2140:21506` |
| Fecha límite abierta | `2148:26258` | `2149:27218` | `2149:26898` | `2149:27058` |
| Fecha del bloque abierta | `2148:26418` | `2149:27698` | `2149:27378` | `2149:27538` |
| Hora del bloque abierta | `2148:26578` | `2149:28180` | `2149:27858` | `2149:28019` |
| Campos vacíos | `2148:26739` | `2149:28641` | `2149:28341` | `2149:28491` |
| Error al guardar | `2148:27220` | `2149:30035` | `2149:29745` | `2149:29890` |
| Errores · Obligatorio, fecha no válida y descripción larga | `2148:27815` | `2149:30474` | `2149:30180` | `2149:30327` |
| Errores · Título largo, fecha pasada y bloque pasado | `2148:27969` | `2149:30915` | `2149:30621` | `2149:30768` |
| Errores · Bloque después de la fecha límite | `2148:28123` | `2149:31352` | `2149:31062` | `2149:31207` |
| Editar · Etiquetas abierta | `2148:27045` | `2149:29570` | `2149:29220` | `2149:29395` |

### 2 · Estructura

```
formulario-tarjeta             ventana MB-22 «Nueva tarjeta» / «Editar tarjeta»
├ tarjeta-titulo               campo MB-11
├ tarjeta-tipo                 segmentado Tarea | Evento (MB-14)
├ tarjeta-fecha                campo de fecha + selector flotante (MB-16)
├ tarjeta-prioridad            selector (MB-15) «Sin prioridad»
├ tarjeta-etiquetas            selector con fichas y lista de casillas (máx. 3)
├ tarjeta-bloque-fecha / -hora selector de fecha y lista de horas
├ tarjeta-descripcion          área de texto
├ tarjeta-error-{campo}        un elemento por campo
├ tarjeta-guardar / -cancelar / -cerrar
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Modal | 560×414 en (267,73); título Medium 20 | papel MB-22 | MEDIDO |
| Con errores | el modal crece y sube: título, fecha y descripción con error, y título largo, fecha pasada y bloque pasado: y 73 → 32, alto 414 → 496; bloque después de la fecha límite: y 73 → 54, alto 414 → 452 | — | MEDIDO |
| Ficha de etiqueta | 22 de alto, radio 11, relleno de la etiqueta al 0,16 | color del catálogo | MEDIDO |
| Lista de etiquetas | 248×120, casillas 16×16 radio 4 con ✓ | MB-12 | MEDIDO |
| «Nueva etiqueta» (sin etiquetas) | botón 131×36 | MB-10 | MEDIDO |
| Selector de fecha flotante | 317×195, radio 8, sombra 0,4,12,0 | MB-16 | MEDIDO |
| Lista de horas (`2148:26578`) | 172×250 en (419,119), sombra 0,4,12,0; opciones 170×30, paso 30 desde y=124: «Sin bloque horario», 06:00…; 09:00 elegida en `seleccion` Bold 13 | `superficie`; borde de la huella `borde` 1 radio 8, que R6/T8 cambian a `borde_campo` 1,5 radio 9 (Incoherencias, n.º 15) | MEDIDO; cuántas horas hay y su scroll: NO MEDIDO (F2b corta tras 12:00; lectura pendiente) |
| Campo con error | trazo `error` 2, radio 9 | — | MEDIDO |

**Regla de alto (PROPUESTA, vale para todos los modales MB-22).** Alto máximo del modal = alto de la ventana − 64 (margen de 32 arriba y abajo, como en el Figma). A 960×600 son 536 ≥ 496, así que el formulario con errores cabe si el 600 es el área de contenido; la barra de título nativa NO está medida. Si no cabe, desplaza solo el cuerpo del modal: la cabecera y los botones quedan fijos. Prueba Playwright a 960×600 con los tres marcos de errores.

### 4 · Textos

- Placeholders (Campos vacíos): «DD/MM/AAAA», «Sin prioridad», «Elige etiquetas»; el rótulo del campo no se reemplaza por el placeholder (D17).
- Etiquetas: «Puedes asignar hasta 3 etiquetas.», «Aún no tienes etiquetas.», botón «Nueva etiqueta».
- Errores de forma: «Este campo es obligatorio.», «El título no puede superar los 100 caracteres.», «La fecha límite no puede ser anterior a hoy.», «Diligencia una fecha válida.», «La descripción no puede superar los 1000 caracteres.», «No puedes asignar tarjetas a un bloque horario que ya pasó.», «No puedes programar la tarjeta después de su fecha límite.»
- Error al guardar: «No pudimos completar la operación. Intenta de nuevo más tarde.» (aviso Error, hasta cerrar).
- Sin la columna «Por hacer»: «Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.» (RD-84).

### 5 · Estados

Vacío; con errores todos a la vez (RD-91); etiquetas abiertas (normal, máximo con las demás casillas deshabilitadas sin opacidad, sin etiquetas, sin elegir); selectores flotantes abiertos; guardando; error al guardar con lo escrito conservado; edición (Editar prellena).

### 6 · Teclado y foco

Foco atrapado (RD-103); Tab sigue el orden visual; el selector flotante: flechas, Enter elige, Esc cierra solo el flotante; la lista de etiquetas: Espacio alterna; al cerrar vuelve al botón de origen. Descarte con datos escritos: RD-106.

### 7 · Animaciones

A-01/A-02/A-02b, A-03/A-04 (selectores), A-27, A-25/A-26.

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Título vacío / largo | `title.required` / `title.too_long` | «Este campo es obligatorio.» / «El título no puede superar los 100 caracteres.» |
| Descripción larga | `description.too_long` | «La descripción no puede superar los 1000 caracteres.» |
| Fecha límite pasada | `due_date.in_past` (`contratos.md`) | «La fecha límite no puede ser anterior a hoy.» |
| Fecha mal escrita | `due_date.invalid` (`contratos.md`) | «Diligencia una fecha válida.» |
| Bloque que ya pasó | `time_block.past` (`contratos.md`) | «No puedes asignar tarjetas a un bloque horario que ya pasó.» |
| Bloque después de la fecha límite | `time_block.after_due_date` (`contratos.md`) | «No puedes programar la tarjeta después de su fecha límite.» |
| Más de 3 etiquetas | `labels.too_many` (RD-96) | «Puedes asignar hasta 3 etiquetas.» |
| Etiqueta borrada | `labels.not_found` (RD-92) | «Esta etiqueta ya no existe.»; se quita de las elegidas |
| Sin «Por hacer» | `column.not_found` (RD-84) | texto de RD-84 |
| Falla al guardar | `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» (aviso Error 462×42 en (607,4), hasta cerrar) |

### 9 · Diferencia

`FormularioTarjeta.tsx` (500 l.), `useVentanasDeTarjeta.tsx` (146), `fechas.ts`, `nombres.ts`: campos, selectores y validaciones existen. Faltan o difieren: fichas de etiqueta (22×11), lista con máximo de 3 (RD-96, ya implementado), botón «Nueva etiqueta» desde el selector sin etiquetas (NUEVA, **M**), lista de horas de 172×250 con «Sin bloque horario», crecimiento del modal 414 a 496 (y 73 → 32) o a 452 (y 73 → 54), regla de alto con scroll solo del cuerpo y cabecera y botones fijos. **M** en total; **L** si se cuenta el botón «Nueva etiqueta» que abre PL-10 encima.

### 10 · Pruebas

Existentes (`FormularioTarjeta`, `EditarTarjeta`, `EtiquetasDeTarjeta`). Nuevas: los tres marcos de Errores muestran sus mensajes juntos; ficha con 0,16; «Nueva etiqueta» desde el selector; hora y fecha del bloque; 960×600 con scroll interno y pie fijo.

---

## PL-12 · Detalle de tarjeta y su estado sin datos (`204:1849`)

**Familias (2):** Detalle de tarjeta, Detalle de tarjeta · Sin datos.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Detalle de tarjeta | `204:1849` | `233:14908` | `204:21914` | `204:21980` |
| Sin datos | `2148:26896` | `2149:29077` | `2149:28791` | `2149:28934` |

### 2 · Estructura

`detalle-tarjeta` (MB-22) > `detalle-titulo`, `detalle-tipo`, `detalle-estado` (`EstadoDeTarjeta`), `detalle-fecha`, `detalle-prioridad`, `detalle-etiquetas`, `detalle-descripcion`, `detalle-editar`, `detalle-eliminar` (44×44), `detalle-cerrar`.

### 3 · Medidas

Modal 560×368 en (267,96); botón «Eliminar» de ícono 44×44. MEDIDO. Estado de la tarjeta con `relleno_*` (Q1) y fecha vencida en `error`.

### 4 · Textos

«Editar», «Cerrar»; sin datos: «Sin prioridad», «Sin etiquetas», «Sin descripción».

### 5 a 8

Estados: completo; sin datos; tarjeta ya no existe (aviso y cierra). Teclado: foco entra a «Cerrar» o al título; Esc cierra. Animaciones: A-01/A-02. Errores: `card.not_found` «Esta tarjeta ya no existe.»; sin red no aplica (lee la base local).

### 9 · Diferencia

`DetalleTarjeta.tsx` (130 l.), `EstadoDeTarjeta.tsx` (45): existen; los tres textos de «Sin datos» («Sin descripción», «Sin prioridad», «Sin etiquetas») ya existen (`DetalleTarjeta.tsx:89-95`); falta solo el botón de eliminar de 44×44. **S**.

### 10 · Pruebas

Los tres textos sin datos; «Editar» abre el formulario con lo cargado; «Eliminar» abre M-08.

---

## PL-13 · Mover a (`204:2239`)

**Familias (1).** `204:2239` | `233:15088` | `204:22694` | `204:22742`.

### 2 · Estructura

`mover-a` (MB-22) > `mover-a-columna` (campo desplegable, MB-15), `mover-a-guardar`, `mover-a-cancelar`, `mover-a-cerrar`.

### 3 · Medidas

Ventana 420×198 en (337,181), MEDIDO (huella 204-2239): título «Mover a» Medium 20; etiqueta «Columna»; campo desplegable 372×34 con `borde_campo` 1,5 radio 9 y ▾; «Guardar» 87×36 en (646,319); «Cancelar» 91×36 en (547,319). Los residuos «Color» y «Catálogo de colores» que trae la capa no se copian. El tratamiento de la columna actual («(actual)» deshabilitada): NO MEDIDO, no se construye (lectura 204:2239 pendiente).

### 4 · Textos

Título «Mover a»; etiqueta «Columna»; opciones del desplegable: los nombres de las columnas; botones «Guardar» y «Cancelar».

### 5 a 8

Estados: desplegable cerrado con la columna elegida, desplegable abierto, guardando; sin columnas no ocurre (siempre hay predefinidas). Teclado: Tab entre campo, «Cancelar» y «Guardar»; en el desplegable, flechas y Enter; Esc cierra. Animaciones: A-01/A-02. Errores: `column.not_found` «Esta columna ya no existe.» (RD-92: se cierra la ventana y se vuelve a leer el tablero).

### 9 · Diferencia

`MoverA.tsx` (45 l.) solo expone `opcionesDeMoverA` para el submenú del ⋮ (`Kanban.tsx:204`). Hay que hacer la ventana del Figma (decidido por Paula: gana la ventana del Figma; el RD-107 se anota en la fase 5). **M**. Ver Incoherencias n.º 2.

### 10 · Pruebas

«Guardar» envía `card_move` con `placement: end` a la columna elegida; «Cancelar» no cambia nada; columna borrada → aviso y cierra.

---

## PL-14 · Confirmaciones M-08, M-09, M-10, M-11, M-13, M-14 y M-14 «Usada en 1 tarjeta»

**Familias (7).** Componente y botones: MB-23 (Destructivo en los 4 temas, D13/G16/G17). Aquí solo los nodos, textos y destinos.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| M-08 Eliminar tarjeta | `204:25533` | `233:15106` | `204:25685` | `204:25837` |
| M-09 Eliminar columna | `204:25546` | `233:15119` | `204:25698` | `204:25850` |
| M-10 Eliminar etiqueta | `204:25559` | `233:15132` | `204:25711` | `204:25863` |
| M-13 Columna con tarjetas | `204:25572` | `233:15145` | `204:25724` | `204:25876` |
| M-14 Etiqueta asignada | `204:25585` | `233:15158` | `204:25737` | `204:25889` |
| M-11 Cerrar sesión | `204:25598` | `233:15171` | `204:25750` | `204:25902` |
| M-14 · Usada en 1 tarjeta | `2144:29098` | `2144:29146` | `2144:29114` | `2144:29130` |

### 4 · Textos (comillas « » en todo el español, G8)

- M-08: «Eliminar tarjeta» / «¿Deseas eliminar la tarjeta «Entregar ensayo»? Esta acción no se puede deshacer.» / «Cancelar», «Eliminar tarjeta».
- M-09: «Eliminar columna» / «¿Deseas eliminar la columna «En revisión»? …» (columna sin tarjetas).
- M-10: «Eliminar etiqueta» / «¿Deseas eliminar la etiqueta «Universidad»? …».
- M-13: «La columna «En revisión» tiene 3 tarjetas. Se moverán a «Por hacer». ¿Deseas continuar?».
- M-14: «La etiqueta «Universidad» está asignada a 3 tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?»; «Usada en 1 tarjeta» (S5, DECISIÓN): el texto de PL-14 en singular, «La etiqueta «Universidad» está asignada a 1 tarjeta. Se quitará de ella, pero la tarjeta no se eliminará. ¿Deseas continuar?»; «a 1 tarjeta», «de ella» y «la tarjeta no se eliminará» van en singular, el resto igual.
- M-11: «Cerrar sesión» / «¿Deseas cerrar sesión?» (MB-23).

### 5 a 10

Destinos: M-08 vuelve al Planificador o al Kanban según de dónde se abrió; M-09 y M-13 al Tablero Kanban; M-10 y M-14 a Etiquetas; «Cancelar» cierra. Errores: falla al confirmar, aviso Error, hasta cerrar, con el código de la acción (`TARJETA_NO_ELIMINADA`, `COLUMNA_NO_ELIMINADA`, `ETIQUETA_NO_ELIMINADA`, PROPUESTA; «No pudimos eliminar la tarjeta. Intenta de nuevo más tarde.» y análogos). Predefinida: `column.default_not_deletable`. Diferencia: `ConfirmarEliminacion.tsx` (49 l.) ya existe; ajustar textos y comillas a G8, el conteo de tarjetas (M-13, M-14) y M-14 singular (S5, texto en la parte 4). **S**. Pruebas: cada texto y destino; M-13 mueve a «Por hacer»; M-14 con 1 tarjeta muestra el texto singular literal y con 3 el plural.

---

## PL-15 · Windi superpuesto (6 estados)

**Familias (6):** Overlay Windi, Propuesta, Escribiendo, Sin conexión, Error, Propuesta descartada. Componente: MB-05 (panel lateral) y MB-27 (ojos); aquí solo estados y errores.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Overlay Windi | `204:25611` | `233:15184` | `204:25763` | `204:25915` |
| Propuesta | `204:25622` | `233:15195` | `204:25774` | `204:25926` |
| Escribiendo | `204:25637` | `233:15210` | `204:25789` | `204:25941` |
| Sin conexión | `204:25648` | `233:15221` | `204:25800` | `204:25952` |
| Error | `204:25659` | `233:15232` | `204:25811` | `204:25963` |
| Propuesta descartada | `204:25670` | `233:15243` | `204:25822` | `204:25974` |

### 4 · Textos

«¿Qué organizamos hoy?», «Escribe un mensaje», contador «0 / 2000»; sin conexión: «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» (G1c); error: **no** «Ocurrió un error inesperado.» sino «Windi tuvo un problema. Tus tarjetas no cambiaron. Intenta de nuevo.» (G1a); propuesta: «Confirmar» y «Rechazar»; descartada: mensaje de Windi tras «Rechazar» (texto NO MEDIDO aquí, está en F3 `204:2876`).

### 5 a 8

Estados: reposo, escribiendo, propuesta (confirmar o rechazar), propuesta descartada, sin conexión (campo al 0,5 de opacidad, A-37), error. Errores con código (D10): `WINDI_ERROR_INTERNO`, `WINDI_SIN_RESPUESTA`, `WINDI_SIN_CONEXION`, `WINDI_CONEXION_PERDIDA`, `WINDI_MENSAJE_MUY_LARGO`; y los de contrato `windi.unavailable`, `windi.apply_failed`, `windi.card_not_found`, `windi.column_not_found`, `windi.label_not_found`, `windi.color_not_found`, `windi.already_in_column`, `windi.same_value`. Teclado y animaciones: A-10, A-11, A-22, A-24, A-37 (MB-05). Diferencia: `Windi.tsx` (254 l.), `Propuesta.tsx` (163): existen; cambiar el texto genérico del Figma por el de G1a y mostrar el código. **S**. Pruebas: cada estado con su texto; Rechazar no cambia datos.

---

## Tabla de geometría

| `data-testid` | x | y | w | h | Regla a 1200×800 y 960×600 |
|---|---|---|---|---|---|
| `planificador-lista` | 201 | 186 | 529 | 368 en el marco; resto en la ventana | `1fr` mínimo 529; a 960 baja el panel derecho y la lista toma el ancho |
| `planificador-proximas` | 751 | 104 | 317 | 154 | columna derecha fija de 317; a 960 pasa bajo la lista |
| `planificador-mini-calendario` | 751 | 272 | 317 | 195 | idem |
| `kanban-columna-{id}` | 200 | 104 | 259 | 380 | 259 a 1200; 201 con más de 5 columnas; alto = lo que queda |
| `kanban-nueva-columna` | 1013 | 104 | 56 | 380 | siempre al final del tablero |
| `calendario-semana` | 260 | 126 | 809 | 356 | `1fr`; 7 columnas iguales |
| `panel-del-dia` | 741 | 104 | 325 | 388 | ancho fijo 325; a 960 se superpone como ventana lateral |
| `mes-anio` | 523 | 92 | 392 | 260 | ancho fijo, anclado a su botón |
| `agenda-bloques` | 200 | 151 | 535 | 7×52 | `1fr`; a 960 «sin horario» baja |
| `agenda-sin-horario` | 754 | 151 | 315 | 114 | columna derecha 315 |
| `reportes-completadas` | 200 | 104 | 530 | 180 | 530 a 1200; a 960 alto reducido |
| `reportes-cumplimiento` | 742 | 104 | 327 | 180 | idem |
| `reportes-estados` | 200 | 296 | 869 | 192 | ancho completo; lista de estado con tope de alto |
| `reportes-rango` | 587 | 92 | 298 | 221 | anclado al botón |
| `reportes-filtro` | 727 | 92 | 298 | 271 | anclado al botón |
| `etiquetas-fila-{id}` | 200 | 104 | 869 | 44 | paso 48; ancho completo |
| `detalle-tarjeta` | 267 | 96 | 560 | 368 | centrado; máx. alto útil |
| `formulario-tarjeta` | 267 | 73 (32 con 496; 54 con 452) | 560 | 414, 452 o 496 | centrado; alto máximo = ventana − 64 (536 a 960×600); si no cabe, solo el cuerpo hace scroll, cabecera y botones fijos (PROPUESTA); prueba Playwright a 960×600 |
| `formulario-etiqueta` / `-columna` | 337 | 123 (104 con 352; 112 con 336) | 420 | 314, 336 o 352 | centrado; misma regla de alto |
| `mover-a` | 337 | 181 | 420 | 198 | centrado |

## Incoherencias resueltas

| # | Incoherencia | Decisión que aplica |
|---|---|---|
| 1 | Vencida `217:11114` y Reportes · Vencidas `2160:1603` desbordan el marco (filas en y=554 a 579; lista 869×140 en y=500) | A17 y Paula («el menos scroll posible»): filas al mínimo de 32, se ocultan los datos secundarios, menos filas con «Ver más»; el scroll interno de la lista solo como último recurso si aun así no cabe, nunca de la página |
| 2 | «Mover a» como submenú del ⋮ (código, D-16) frente a la ventana `204:2239` del Figma (campo desplegable «Columna» con «Guardar» y «Cancelar», no una lista de opciones) y a reordenar arrastrando | Gana el Figma (orden de autoridad, decidido por Paula): ventana «Mover a» tal como se midió; el arrastre se conserva como segundo camino. El RD-107 se anota en la fase 5 |
| 3 | Dos ámbar (#c68700 y #b47700) y bordes de avisos fijos | Variable de estado `estado_pendiente` (D1) |
| 4 | «Rango personalizado» en Rubik | Fuente del tema (T3) |
| 5 | Catálogo de 9 colores y etiquetas con #2b7a8c, #2a6f8f y #b04f7d | D3 y Q2 |
| 6 | Avisos que se ocultan a 4 s o 6 s fijos | G5 y RD-104: 4 s Éxito/Información, 6 s Advertencia, Error hasta cerrarlo |
| 7 | «Ocurrió un error inesperado.» en Windi | G1a: texto y código por causa |
| 8 | Evento con 1 o 2 según la capa en Más reportes | D16: 2 |
| 9 | «No hay tarjetas para hoy.» (capa) frente a «No tienes tarjetas para hoy.» (texto visible) | El visible, que coincide con el código |
| 10 | Barras residuales bajo el anillo y texto duplicado en Más reportes | No se copian. («Ver más reportes ›» 116×36 en (953,48) no es una incoherencia: botón de texto normal, A4) |
| 11 | Navegación a URL «Windgets--Copy-» | Manda la HU |
| 12 | Comillas “…” frente a «…» | « » (G8) |
| 13 | «Entregar ensayo» con 27/11/2026 y 24/11/2026 | 24/11/2026 (G10) |
| 14 | Rosa y Enfoque no cambian de letra en muchas familias | T3/T4 mandan; no se copia la capa |
| 15 | Selectores flotantes (rango, etiquetas, fecha, lista de horas, lista de etiquetas): la huella dibuja `linea` 1 radio 8 (204-1442, 204-1766) y `borde` 1 radio 8 (lista de horas 2148:26578) | R6 y T8 (variables de F0): radio 9, `borde_campo` 1,5 y fuente del tema a 14 y 12 |
| 16 | Sin conexión como banda 523×37 que baja el contenido y Recordatorio como banda 320×37 (757,86) con 6 s | D7: indicador «Sin conexión · N pendientes» y aviso flotante; Recordatorio = píldora Información en y=4, 4 s (G5) |
| 17 | Filtro de etiquetas de Reportes en dos variantes: popover `204:1766` (298×271, con Aplicar) y lista `2161:33045` (248×148 en (689,88), «Todas las etiquetas», sin Aplicar; Máximo 248×178; Sin etiquetas 248×40) | Vigente la que cumple RD-80 («hasta Aplicar»): `204:1766`. La variante `2161:33045` queda aquí; su lectura, en «Lecturas de Figma pendientes» |

## No se construye

- Cualquier reporte distinto de `204:1005` y su ampliación `204:1581`.
- Los 6 nodos de «Descartado» `2273:153952` (Reportes · Nombre emergente y Navegación del calendario).
- Interruptor de densidad (es de Configuración, D-29); aquí solo se consumen sus dos valores.
- Datos del prototipo (nombres, fechas) como valores fijos.
- SET_VARIABLE y CONDITIONAL del Figma, que solo se midieron como tipo.

## Decisiones ya tomadas que se citan (no se vuelven a preguntar)

D1, D3, D5, D6, D7, D8, D9, D10, D11, D13, D16, D17, G1a-G1g, G5, G8, G10, G16, G17, P1, P2, P4, Q1, Q2, T3, T4, RD-80, RD-84, RD-85, RD-90 a RD-92, RD-96, RD-98, RD-103 a RD-106, y las del `.trabajo/DECISIONES_PAULA_26nov.md` (204:1005 único reporte; navegación por la HU; botones sin destino hacen la acción de la HU; todas las funciones nuevas se implementan; el menos scroll posible).

- **S5** (PL-14): «Usada en 1 tarjeta» con el texto de PL-14 en singular.
- **S6** (PL-01): arrastrar filas en el diario cambia la hora de la tarjeta (IPC-CARD-10).
- **S7** (PL-02, PL-03, PL-06): teclado en Calendario, Agenda y Kanban, con la propuesta de cada parte (RNF-30).
- **S8** (PL-08): títulos de «Más reportes» leídos del Figma 204:1581.
- **S9** (global): cada código con la convención de su fuente; los nuevos en MAYÚSCULAS.
- **S10** (PL-01): recordatorio como notificación de Windows a la hora de la tarjeta.
- **S11** (PL-01): el clic en un día del mini calendario cambia el día del Planificador.
- **S12** (PL-01): «Próximas a vencer» con texto vacío propuesto y clic que abre el Detalle.

Pendientes con destino de S6 a S12 (PROPUESTA): contrato `planner_get_today` con `date?` (IPC-CARD-08) y EV-32 `card_reminder_due` en `docs/contratos.md`; códigos `ARRASTRE_SIN_HORA`, `PROXIMAS_NO_CARGAN`, `NOTIFICACIONES_BLOQUEADAS` y los textos vacíos en `docs/DUDAS.md` y `messages.es.json`; CA derivados de S6, S7 y S10 en HE-07, HE-10, HE-11, HE-12 y HE-17; unidad del tiempo medio en `docs/DUDAS.md`.

## Pendiente de Paula

Ninguno; resueltos por S5 a S12 el 27-nov.

Salieron de la lista anterior tras la revisión del 26-nov: posición de los avisos (D7), «Tarjeta actualizada» (MEDIDO), «Mover a» como ventana (decidido, RD-107 en la fase 5) y la barra de etiqueta (D3 y Q2).

## Lecturas de Figma pendientes

Lo que sigue sin resolver y exige abrir el nodo en el Figma:

- `204:622`: medidas internas de la fila vacía de «Próximas a vencer» y del día elegido del mini calendario (el comportamiento ya lo fijan S11 y S12).
- `2161:33045` frente a `204:1766`: variante vigente del filtro de etiquetas de Reportes (hoy `204:1766`, con Aplicar, por RD-80).
- `204:1581`: unidad de la cifra «Tiempo medio de completado» y x de las tarjetas de la fila 2 (los títulos ya se leyeron, S8).
- `2148:26578`: cuántas horas tiene la lista de horas y cómo hace scroll (F2b corta tras 12:00).
- `204:2239`: tratamiento de la columna actual («(actual)», NO MEDIDO, no se construye).
- `204:1915`: tipos (Tarea | Evento) del formulario de tarjeta.
- `204:1316`: día seleccionado y estado vacío del Panel del día.
