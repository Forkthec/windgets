# DECISIONES del rediseño de Windgets

Última actualización: 27-nov-2026 (hora colombiana, UTC-5). Documento generado con IA; queda solo en local hasta el sí de Paula.

## Para qué sirve

Reúne en un solo lugar todas las decisiones vigentes del rediseño. Paula, como PO, las aprueba o las cambia en la fase 5, antes de implementar.

## Cómo se usa la columna «Paula cambia a:»

- Está vacía a propósito. Paula la rellena solo en las filas que quiere cambiar.
- Las filas de la sección 1 exigen respuesta explícita de Paula (aceptar o cambiar). En el resto, una fila vacía queda aprobada tal como está.
- Si una fila trae texto en «Paula cambia a:», la pieza afectada (la de la columna «Dónde se aplica») se ajusta antes de implementarse.
- Una fila fuera de la sección 1 que repite una de la sección 1 dice «ver V-xx» y trae «—» en «Paula cambia a:»: se responde solo en la sección 1.
- Cada fila cita su fuente como `archivo:línea`. Si una fuente contradice a otra, la fila lo dice y señala cuál gana.

## Orden de autoridad

Cuando dos documentos se contradicen, gana el primero de esta lista (`docs/implementacion/PLAN.md:12`; `docs/implementacion/CONSISTENCIA.md:7`):

1. Figma (fuente de verdad: «Windgets (Copy)» `A3Z03L20swFyo8qdP9jETF`, RD-102; `docs/rediseno.md:202`).
2. `docs/rediseno.md` y sus RD.
3. Las HU y `docs/contratos.md`.
4. `docs/rediseno_cambios_implementacion.md`.

«HU» incluye sus CA y ET. Entre ellos gana el CA, luego la ET, el contrato, el modelo de datos y la interfaz (`docs/AGENTS.md:73`).

Regla S19 (`.trabajo/DECISIONES_PAULA_26nov.md:70`): si un código de CONSISTENCIA ya existe en el código con otro nombre, gana el del código y el de CONSISTENCIA queda como alias.

Etiquetas de evidencia: MEDIDO (medido en el Figma), PROPUESTA (propuesta por confirmar), NO MEDIDO.

Abreviaturas de fuente: DP = `.trabajo/DECISIONES_PAULA_26nov.md`; CONS = `docs/implementacion/CONSISTENCIA.md`; ERR = `docs/implementacion/ERRORES_Y_PRUEBAS.md`; RED = `docs/rediseno.md`; DUD = `docs/DUDAS.md`.

---

## 1. Para mirar primero (respuesta explícita de Paula; respondidas el 27-nov)

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| V-01 | R22-R24 y fallos en segundo plano sin aviso | ERR propone aceptarlos sin aviso; Paula decide. Chocan con la regla de errores visibles de CLAUDE.md. Incluye lecturas silenciosas, acciones del escritorio sin dónde mostrar el mensaje y acciones de la aplicación que no miran la respuesta | ERR:178-180; DUD:368-370 | ERRORES_Y_PRUEBAS §3.2 y `puente_ipc.rs:416, :461, :1434, :1489, :1560`; sin spec || 27-nov: hacerlos visibles. Cada fallo en segundo plano y cada lectura silenciosa tiene código estable y aviso donde se pueda mostrar (ventana o escritorio). ER-04 lo implementa |
| V-02 | Conflictos abiertos C-13/17/18/19/20 | C-13: enlazar `IMAGEN_DE_FONDO_NO_ENCONTRADA` a `image.not_found`. C-17: gana el texto del contrato para `COLOR_INVALIDO` y MB-26 usa `COLOR_OBLIGATORIO` solo para el campo vacío. C-18: `DESCARGA_NO_DISPONIBLE` es el código e `INSTALADOR_NO_PUBLICADO` alias de causa. C-19: gana el literal del Figma «Error de sincronización · N pendientes» sobre HU01-CA05 y se cambia el CA. C-20: corregir `WINDI_CELEBRACION` (emoji, D11) y siete claves con comillas inglesas (G8 manda « »). Todos abiertos | ERR:292, :296-299, :301 | `messages.es.json:73, :140-165`; MB-26; WE-01; HE-01-HU01-CA05 || 27-nov: aplicar los 5 tal como están (C-13, C-17, C-18, C-19 con cambio de HE-01-HU01-CA05 al literal del Figma, C-20) |
| V-03 | S10 Recordatorio como notificación de Windows | Toast con la API de Windows (`windows` 0.62.2, Windows.UI.Notifications) y AppUserModelID en el acceso directo del instalador; solo se prueba instalada. Talla L; el plugin `tauri-plugin-notification` no está en el repo y no admite botones en escritorio. Si el spike no logra botones: notificación sin botones que abre la ventana (Paula decide entonces). Con la ventana visible y enfocada: aviso Información 4 s en vez de notificación. Con la app cerrada con «Salir»: no hay recordatorio. No se recuperan los de horas pasadas | DP:58; SPEC_Planificador.md:160-166, :1125; SPEC_Escritorio_y_capa.md:279, :347 | PL-01 parte 9; EC-15 || 27-nov: si el spike no logra botones, solo aviso en la app (sin notificación de Windows); el recordatorio se ve solo con la app abierta |
| V-04 | D7 frente a RD-63/RD-104 (posición y ancho de avisos) | Implementado hoy: RD-63/RD-104 (cola abajo a la derecha, máx. 3, ancho 360, Error hasta cerrarlo; `tokens.css:346-361`, `MensajeResultado.tsx:9-19`). D7 (CONS:245-264) propone franja superior y=4, un aviso visible, ancho máx. min(480, 966 − miga − 16); el Error también se queda (CONS:262). Si Paula elige D7: rehacer `MensajeResultado` y `tokens.css` (talla L, SPEC_Marco:336) y ajustar SPEC_Planificador:58, 86, 102, 119, 162; SPEC_Windi:557; SPEC_Cuenta_y_Acceso:86-90; SPEC_Marco:322, 336, 851; ANIMACIONES:35, 224, 334. D1/P2 (colores de aviso) aún no están en `tokens.css:377-383`. Respuesta obligatoria | CONS:245-264, :309; RED:163, :204; SPEC_Marco_y_componentes_base.md:877; SPEC_Configuracion.md:480 | `MensajeResultado`, `tokens.css`, `Aviso.tsx` || 27-nov: D7, franja superior (y=4, un aviso visible, ancho máx. min(480, 966 − miga − 16)). El Error se queda hasta cerrarlo (G5), no a 6 s. Se rehacen `MensajeResultado` y `tokens.css` y se ajustan las specs citadas en esta fila |
| V-05 | P43 abiertas (1)-(3) y previsibles al genérico | (1) orden de columnas: `column.order_invalid` se ve como genérico; (2) `WidgetKanban.tsx` ignora el error de `card_move`; (3) `widget_set_active` sin tema dice «Este widget ya no existe.». Valor usado: lo construido. Más cinco previsibles sin corregir que terminan en el genérico (regla de errores visibles) | DUD:375-377, :386-390 | `column_reorder`, `capa/WidgetKanban.tsx`, `widget_set_active`; SPEC_Planificador, SPEC_Personalizacion_y_widgets || 27-nov: corregir los 8 (las 3 de P43 y los 5 previsibles), cada uno con su código y mensaje claro |
| V-06 | D15 tamaño de ventana y D17 placeholders | D15: PROPUESTA, abre maximizada al área de trabajo y se puede minimizar. D17: PROPUESTA, ejemplo de formato donde importa (correo «nombre@ejemplo.com», código), nunca en lugar de la etiqueta | CONS:310-311; DP:27, :29 | Ventana principal (RD-69); formularios de cuenta || 27-nov: aprobar D15 (abre maximizada al área de trabajo, se puede minimizar) y D17 (ejemplo de formato donde importa, nunca en lugar de la etiqueta) |
| V-07 | Contrastes, Q1-Q3 y textos sin Figma | Contrastes que fallan 3:1 o 4,5:1 (aceptar o ajustar la variable); Q1 tabla fija `relleno_*`; Q2 etiquetas al catálogo; Q3 empaquetar Nunito 600; textos y códigos propuestos G1a, G1f, G1q y G2; textos de vacío y carga E7, E9, E10; sombra del interruptor P16 sin medida | CONS:312-318 | Tokens de tema; `derivar.ts`; fuentes; catálogo de errores; Calendario, widgets, instalador || 27-nov: contrastes, ajustar la variable lo mínimo para cumplir 3:1 o 4,5:1 y anotar la diferencia con el Figma; Q1-Q3 y textos G1a, G1f, G1q, G2, E7, E9, E10 y P16, aprobados como están propuestos |

---

## 2. Familia D (decisiones del 26-nov, punto 5 y D1-D17)

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| D1 | Colores de avisos | Variables de estado: Advertencia `estado_pendiente`, Éxito `estado_completada`, Error `error`, Información borde e ícono `informacion`; el texto va en `texto` (P2). Aún no está en `tokens.css:377-383` | DP:13; CONS:272 | Aviso emergente; SPEC_Marco_y_componentes_base | |
| D2 | Colores de Windi | Windi con colores fijos | DP:14; CONS:277 | SPEC_Windi | |
| D3 | Catálogo de colores de etiqueta | Los 9 colores del Figma; ejemplos y puntos del Kanban pasan al color del catálogo más cercano; Windi nombra colores del catálogo | DP:15; CONS:278 | Etiquetas, Kanban, Windi; SPEC_Planificador | |
| D4 | Contraste del selector de color | Aviso sin bloquear si el color elegido baja de 3:1 | DP:16; CONS:279 | Selector de color | |
| D5 | Radios medidos | Panel lateral 12; papel de diálogos 10 con pliegue 22 | DP:17; CONS:280 | Panel lateral; diálogos | |
| D6 | Anillo de foco | 2 px `tinta` en todo, radio del control + 3, también en campos | DP:18; CONS:281 | Todos los controles | |
| D7 | Ancho y lugar de los avisos | Ver V-04 (contradice RD-63/RD-104; hoy rige lo implementado de RD-63/RD-104) | DP:19; CONS:245-264, :282 | Avisos; SPEC_Marco_y_componentes_base | — |
| D8 | Estilos de texto 42/26/17 | Se quitan | DP:20; CONS:283 | Tokens de tipografía | |
| D9 | Vacío y cargando | Los que el Figma no dibuja (Calendario, widgets, instalador) se redactan en las specs con 5 barras `linea` r6; los de F2b se copian | DP:21; CONS:284 | Calendario, widgets, instalador | |
| D10 | Errores genéricos | Un mensaje por causa con código estable; «Reintentar» solo donde sirve | DP:22; CONS:285 | Todas las specs (CONS §6.1) | |
| D11 | Saludo de Windi | Sin emoji, con el alias | DP:23; CONS:286 | SPEC_Windi | |
| D12 | M-18, M-19, M-21 | Botón «Entendido» | DP:24; CONS:287 | Mensajes M-18, M-19, M-21 | |
| D13 | Botones destructivos | «Salir sin guardar» (M-02), «Cambiar sin guardar» (M-04) y «Cancelar instalación» (M-01) en Destructivo | DP:25; CONS:288 | M-01, M-02, M-04 | |
| D14 | Carpeta del instalador | Botón «Cambiar» oculto, como el Figma | DP:26; CONS:289 | SPEC_Instalador_y_web | |
| D15 | Tamaño de ventana | Ver V-06 | DP:27; CONS:290, :310; RED:169 (RD-69) | Ventana principal | — |
| D16 | Evento en Reportes | Evento = 2 (nodo 204:1581) | DP:28; CONS:291 | Reportes | |
| D17 | Placeholders | Ver V-06 | DP:29; CONS:292, :311 | Formularios de cuenta | — |
| D-M11 | M-11 y M-12 Cerrar sesión | Destructivo en ambos nodos (79:6 y 83:4) y en los 4 temas | DP:6; CONS:296 | M-11, M-12 | |
| D-RD106 | RD-106 en Clima | RED:206 contradice a DP:7; gana DP:7 (Paula, 26-nov): «Salir sin guardar» solo si la ciudad elegida es distinta de la inicial. Pendiente con destino: corregir RED:206 y anotar en `docs/DUDAS.md` (no existe aún) | DP:7; RED:206; CONS:297 | Widget Clima (formulario en ventana emergente) | |
| D-INV | Hallazgos del inventario | Se unifican al valor de la variable o del componente de F0 y se anotan aquí; 204:1005 es el único reporte; navegación por la HU, no por las URL a «Windgets--Copy-» | DP:8; CONS:298-300 | Todas las piezas con hallazgos (sección 7) | |
| D-NUEVO | Funcionalidades nuevas de los prototipos | Todas se implementan | DP:9; CONS:302 | Todas las specs | |
| D-FUENTE | Tipografía por tema | Nunito en Claro y Oscuro, Quicksand en Rosa, Space Grotesk en Enfoque; Rubik pasa a la fuente del tema; la elegida en Personalización manda (Nunito por defecto) | DP:10; CONS:303 | Tokens de tipografía; SPEC_Personalizacion_y_widgets | |
| D-SCROLL | Menos scroll | Primero ajustar el contenido para que quepa (Vencida 217:11114 y lo que desborde); desplazamiento solo como último recurso | CONS:301 | Pantallas con desborde | |

---

## 3. Familias G, R, P y Q (temas y tokens)

Nota: G5, R11, P1-P4 y Q1-Q3 viven en DP y CONS, no en `TEMAS_Y_TOKENS.md`. P1-P4 de esta sección no son los P1-P18 de CONS §7 (esos van en la sección 7 como FC-P).

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| G5 | Tiempos de aviso | Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrarlo (RD-104). El Figma 217:17679 cierra el Error a 6 s (ANIMACIONES:127); gana DP:30 | DP:30; CONS:293; RED:204; ANIMACIONES:127 | `MensajeResultado` | |
| R11 | Forma de los widgets | Rectas 0, Base = variable 9, Redondas 22 | DP:31; CONS:294 | Widgets de escritorio | |
| R-CAMPO | Trazo del error de campo | `error` 2 px, radio 9 (lo que trae F0) | DP:32; CONS:295 | Campos de formulario | |
| P1 | Morado y cian en oscuro | Donde se juntan se usa `tinta` `#f8f5ff`; en claro, Rosa y Enfoque siguen `#0F2A33` | DP:36; CONS:273 | Fila seleccionada, casilla de Tareas, columna Kanban | |
| P2 | Aviso de Información | Texto en `texto`; `informacion` solo en borde e ícono | DP:37; CONS:274 | `MensajeResultado` | |
| P3 | Texto sobre relleno cian | `#0B2A2E` (8,68:1): `sobre_accion` en claro y oscuro; `sobre_seleccion` solo en oscuro | DP:38; CONS:275 | Tokens de tema | |
| P4 | Tamaño base | Mediano 14, Pequeño 12 (12,25), Grande 18 (17,5 redondeado arriba). El código usa hoy 14, 16 y 20 | DP:39; CONS:276 | Tokens de tipografía | |
| Q1 | Tabla `relleno_*` | PROPUESTA: tabla fija con los hex del Figma; la fórmula `mezclar(superficie, estado, 0,3)` reproduce 10 de 12. `derivar.ts:95-97` está invertido (70 % estado). Ver V-07 | DP:42; CONS:317 | `derivar.ts` | — |
| Q2 | Etiquetas existentes al catálogo | PROPUESTA: `#2b7a8c` y `#2a6f8f` a Cian; `#b04f7d` a Rosa (por tono, no medido). Ver V-07 | DP:43; CONS:315 | Migración y semilla de etiquetas (C9) | — |
| Q3 | Nunito 600 | PROPUESTA: empaquetar Nunito 600 (hay 6 reglas con `font-weight: 600`). Ver V-07 | DP:44; CONS:318 | Fuentes empaquetadas | — |
| Q-CONTRASTE | Contrastes que fallan | Éxito en claro 2,96:1; `informacion` en claro 1,68 y Rosa 1,55; `estado_vencida` oscuro como ícono 2,85; `principal_legible/superficie_baja` en Rosa 2,96; trazo `borde` en la casilla de Rosa y Enfoque (PROPUESTA); `sobre_detalle` claro `#17131d` con 2,38 (SPEC_Marco:878); `perilla` oscuro `#0b2a2e`. Enlaza con P43b-contraste (DUD:397: acción `#00D9E2` en «Windgets claro»). Ver V-07 | CONS:312; SPEC_Marco_y_componentes_base.md:878; DUD:397 | Tokens de tema (TEMAS_Y_TOKENS 6.3) | — |

---

## 4. Familia S (pendientes de las SPEC de área)

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| S1 | Menú del área (EC-16) | Nativo de Windows; la diferencia visual con el Figma queda aceptada | DP:48; SPEC_Escritorio_y_capa.md:373 | EC-16 | |
| S2 | Ciudad del Reloj (EC-03) | Zona horaria del sistema | DP:49; SPEC_Escritorio_y_capa.md:374 | EC-03 | |
| S3 | Puntero sobre Calendario y Noticias | Se construye con EV-31 `pointer_moved` nuevo en el Núcleo (PROPUESTA de contrato, talla L) | DP:50; SPEC_Escritorio_y_capa.md:375 | Widgets Calendario y Noticias; `docs/contratos.md` | |
| S4 | Casilla de Tareas (EC-05) | La del Figma (13,5) con zona táctil de 44 | DP:51; SPEC_Escritorio_y_capa.md:376 | EC-05 | |
| S5 | «Usada en 1 tarjeta» | Texto de PL-14 en singular | DP:53; SPEC_Planificador.md:1120 | PL-14 | |
| S6 | Arrastrar filas en el diario | Cambia la hora de la tarjeta | DP:54; SPEC_Planificador.md:1121 | Planificador diario | |
| S7 | Teclado | Se construye todo (Calendario, Agenda y Kanban) con la propuesta de cada parte (RNF-30) | DP:55; SPEC_Planificador.md:1122 | Calendario, Agenda, Kanban | |
| S8 | Títulos de Más reportes | Se leen del Figma (nodo 204:1581, solo lectura) | DP:56; SPEC_Planificador.md:1123 | Reportes | |
| S9 | Códigos | Cada código con la convención de su fuente; los nuevos en MAYÚSCULAS | DP:57; SPEC_Planificador.md:1124 | Catálogo de errores | |
| S10 | Recordatorio (PL-01) | Notificación de Windows a la hora de la tarjeta (detalle y límites en V-03) | DP:58; SPEC_Planificador.md:160-166, :1125 | PL-01 parte 9; EC-15 | — |
| S11 | Mini calendario | El clic en un día cambia el día del Planificador; `planner_get_today` con `date?` (PROPUESTA) | DP:59; SPEC_Planificador.md:158, :1126 | Planificador diario | |
| S12 | Próximas a vencer | Texto vacío propuesto y el clic abre el Detalle | DP:60; SPEC_Planificador.md:1127 | Planificador diario | |
| S13 | Persistencia de lo nuevo | Se amplía `theme_draft_update` (IPC-THEME-05) con `patch.widgets?`: un solo guardado por tema (PROPUESTA) | DP:62; SPEC_Personalizacion_y_widgets.md:1119, :1479 | Personalización; migración 0013 | |
| S14 | «Listo» en Organizar | Guarda el orden y sale; con cambios, «Cancelar» abre M-02 | DP:63; SPEC_Personalizacion_y_widgets.md:1479 | Organizar widgets | |
| S15 | Propuesta de Windi confirmada o rechazada | Sin estado visible y con las opciones deshabilitadas | DP:65; SPEC_Windi.md:557 | Panel de Windi | |
| S16 | Marca de propuesta | «Descartada» | DP:66; SPEC_Windi.md:557 | Panel de Windi | |
| S17 | Instalador | Se aproxima con nsDialogs (colores, fuentes, interruptor y barra dibujados, orden del Figma), sin radios ni sombras (D-194) | DP:68; SPEC_Instalador_y_web.md:598 | Instalador NSIS | |
| S18 | Landing | Se mantiene la actual y se toma de 84:1050 lo medible | DP:69; SPEC_Instalador_y_web.md:598 | Landing | |
| S19 | Nombres de códigos (27-nov) | Si el código ya existe con otro nombre, gana el del código y el de CONS queda como alias. DP:70 lista C-1, C-3, C-4, C-8, C-10, C-11; ERR:288 marca también C-9 «Resuelto (S19)»: la lista vigente incluye C-9 | DP:70; ERR:276, :288 | Catálogo de errores; `messages.es.json`; SPEC_Windi.md:124 | |

---

## 5. Familia RD (`docs/rediseno.md`)

Cada fila cubre un RD o un grupo. Línea de cada RD-NN en `docs/rediseno.md`: 100 + NN. Los RD-27 a RD-61 están reemplazados en parte por RD-62 a RD-81; donde choca, gana el más reciente. Desde RD-82/RD-102 manda el Figma.

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| RD-01 | Pantallas de cuenta | Inicio de sesión, Registro (Formulario y Verificar correo) y Recuperar contraseña (3 pasos) siguen el Figma | RED:101 | SPEC_Cuenta_y_Acceso | |
| RD-02, RD-03 | Apariencia antes de sesión | Apariencia fija del Figma con selector «Apariencia» (Claro, Oscuro); el modo se guarda solo en el equipo (`wg.modo_cuenta`), sin sincronizar | RED:102-103 | Pantallas de cuenta | |
| RD-04, RD-05 | Paleta y forma de cuenta | Paleta fija claro y oscuro; radio 9 en campos y botones, 5 en la nota, 15 en el globo de Windi; borde 1,5 | RED:104-105 | Pantallas de cuenta | |
| RD-06 | Tipografía de cuenta | Rubik fija en cuenta y se agrega al catálogo; D-FUENTE (DP:10) la pasa a la fuente del tema | RED:106; DP:10 | Pantallas de cuenta | |
| RD-07, RD-21 | Composición y corte | Cabecera con símbolo y «windgets»; el corte es `width < 1000px` | RED:107, :121 | Pantallas de cuenta | |
| RD-08, RD-09, RD-10, RD-11 | Textos, pasos, contadores y ayuda | Títulos y globo de Windi, indicador de pasos, contador «n/máx» y ayuda de contraseña | RED:108-111 | Registro, Recuperar contraseña | |
| RD-12, RD-13 | Orden con Google | Campos, botón principal, divisor «o», «Continuar con Google» | RED:112-113 | Registro, Inicio de sesión | |
| RD-14, RD-15 | Paletas Claro y Oscuro | Paletas nuevas al principio del catálogo; el primer tema de una cuenta nueva toma la paleta del modo elegido. RD-15 pide Rubik; D-FUENTE (DP:10) lo reemplaza por Nunito (Claro/Oscuro) y la fuente elegida en Personalización | RED:114-115; DP:10 | Catálogo de paletas; cuenta nueva | |
| RD-16, RD-17, RD-20 | Nota centrada | Nota centrada (mínimo 420 px de alto); «Regresar» al final de la nota | RED:116-117, :120 | Verificar correo, Recuperar contraseña | |
| RD-18, RD-19 | Avisos y medidas de cuenta | Aviso sin borde con 12 % del color de error; composición medida en 66:4 y 66:162 | RED:118-119 | Pantallas de cuenta | |
| RD-22, RD-23 | Accesibilidad del selector | Grupo de radios con flechas; color de selección del sistema con `forced-colors` | RED:122-123 | Selector «Apariencia» | |
| RD-24 | Error sin texto | RED:124 dice que si el Núcleo responde un error sin texto (`internal.unexpected`, DP-02) el aviso dice «Ocurrió un error i…» (texto del genérico). RD-83 lo extiende a toda la app; incluye códigos previsibles sin texto: ver P43 abiertas (DUD:375-377) | RED:124, :183 | Pantallas de cuenta; toda la app | |
| RD-25, RD-26 | Enlaces y resultado | Enlaces subrayados en peso 500; el mensaje de solicitud de código va dentro de la nota | RED:125-126 | Recuperar contraseña | |
| RD-27 | Fuente de las ventanas con sesión | Figma «Windgets (Copy)» `KP2qmNWNT55KMceQI8hFGu` (copia del 23-nov); reemplazado por RD-82 y RD-102 | RED:127, :182, :202 | Ventanas con sesión | |
| RD-28, RD-29 | Colores y selector con sesión | Colores del Figma por modo y selector de apariencia con sesión; los reemplaza RD-62 | RED:128-129, :162 | Ventana principal | |
| RD-30, RD-31 | Menú principal | Columna de 248 px y botón «Ocultar menú»; RD-65 reemplaza RD-30 | RED:130-131, :165 | Menú lateral | |
| RD-32, RD-33 | Encabezado y controles | Sección arriba (la reemplaza la miga de pan de RD-66); controles sin borde llevan trazo | RED:132-133, :166 | Pantallas con sesión | |
| RD-34, RD-50 | Ventanas emergentes | Caja de hasta 800 px, radio 15; la posición de acciones la reemplaza RD-72 | RED:134, :150, :172 | `VentanaEmergente`, M-02 a M-15 | |
| RD-35, RD-58, RD-59, RD-60 | Widgets (lista y agregar) | Lista de widgets y catálogo en filas; formularios de Clima, Texto, Animación, Noticias, Música, Imagen y Carrusel | RED:135, :158-160 | Widgets; Agregar widget | |
| RD-36, RD-57 | Agente de IA | Conversación dentro de la tarjeta con globos; baja al final con cada mensaje | RED:136, :157 | Panel de Windi | |
| RD-37, RD-38, RD-39, RD-40 | Planificador diario | Composición del marco 81:21; resumen con «Completadas: X de Y»; tipo y etiquetas con « · »; fecha larga | RED:137-140 | Planificador diario | |
| RD-41 | Configuración | «Inicio automático» con interruptor a la derecha (marco 81:199) | RED:141 | Configuración | |
| RD-42, RD-43, RD-44, RD-45, RD-46 | Personalización del wallpaper | Pantalla sin menú lateral, encabezado, vista previa, inspector de 469 × 524 y barra de acciones | RED:142-146 | Personalización | |
| RD-47, RD-48, RD-49 | Kanban (primer diseño) | Tarjeta de 252 px, barra de color, fecha corta «27 nov»; RD-74 reemplaza las medidas de RD-47 | RED:147-149, :174 | Kanban | |
| RD-51 | Formulario de tarjeta | Campos en dos columnas en el orden de 84:550 | RED:151 | Formulario de tarjeta | |
| RD-52, RD-53 | Agenda y Calendario (primer diseño) | Marco 84:361 y bocetos 84:184, 84:120, 84:334; RD-76 reemplaza la disposición | RED:152-153, :176 | Agenda diaria, Calendario | |
| RD-54, RD-55, RD-56 | Etiquetas, Temas y Reportes | Filas con radio 6; filtros en una fila arriba | RED:154-156 | Etiquetas, Temas, Reportes | |
| RD-61 | Indicador de sincronización | Texto sin ícono en 15 px del color secundario (boceto 84:918) | RED:161 | Indicador de sincronización | |
| RD-62 | Ventana con sesión (final) | Reemplaza RD-28 y RD-29; colores salen del tema | RED:162 | Ventana principal | |
| RD-63 | Cola de avisos | Cola global abajo a la derecha, encima de todo, máximo 3 visibles. El tipo Error y los colores quedan reemplazados por RD-104 y D1/P2; el código aún usa los colores de RD-63. Choca con D7: ver V-04 | RED:163, :204 | `MensajeResultado` | — |
| RD-64 | Aviso del wallpaper | «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.» | RED:164 | `AvisoDelWallpaper` | |
| RD-65 | Menú lateral | Reemplaza RD-30: dos bloques con título | RED:165 | Menú lateral | |
| RD-66 | Miga de pan | Miga de pan en 13 px «bloque › opción» reemplaza la sección de RD-32 | RED:166 | `EncabezadoDePantalla` | |
| RD-67 | Mensaje del tema inicial | Texto «No pudimos aplicar la paleta…» (RD-95 lo cambia a tema) | RED:167, :195 | Cuenta nueva | |
| RD-68 | Escala del marco | Densidad Compacta, tipografía Mediano; márgenes de 24 px | RED:168 | Marco de la ventana | |
| RD-69 | Ventana principal | Abre maximizada, sin redimensionar por los bordes (`resizable: false`); ver D15 y V-06 | RED:169 | Ventana principal | |
| RD-70, RD-71 | Windi (panel y widget) | Panel de Windi en la ventana; widget de escritorio `windi` (migración 0009) | RED:170-171 | SPEC_Windi; SPEC_Personalizacion_y_widgets | |
| RD-72 | Acciones de las emergentes | Posición de las acciones reemplaza RD-34 y RD-50 | RED:172 | `VentanaEmergente` | |
| RD-73 | Colores de estado de tarjeta | Vencida (`is_overdue`) y demás estados con variables de estado | RED:173 | Tarjetas | |
| RD-74 | Kanban (final) | Reemplaza las medidas de RD-47 y siguientes | RED:174 | Kanban | |
| RD-75 | Formulario de tarjeta (final) | Tipo y Prioridad según prototipo §3.8 y §6.7 | RED:175 | Formulario de tarjeta | |
| RD-76, RD-77 | Fechas y selector de mes | Navegación de fechas del Calendario y la Agenda; selector «Mes y año» con cuadrícula de 12 meses | RED:176-177 | Calendario, Agenda | |
| RD-78, RD-79 | Calendario y Agenda (final) | Celdas compactas sin scroll de página; mini calendario y tira semanal | RED:178-179 | Calendario, Agenda | |
| RD-80 | Reportes (final) | Todo de un vistazo, sin scroll de página | RED:180 | Reportes | |
| RD-81 | Campos de contraseña | Ojo para mostrar u ocultar en todo campo de contraseña | RED:181 | Cuenta, Configuración | |
| RD-82 | Fuente de verdad (24-nov) | Figma «Windgets» `GdUKUwVHz3Wm0Dqw16UX8k`; reemplazada por RD-102 | RED:182 | Todo el rediseño | |
| RD-83 | Errores de toda la app | RED:183: RD-24 vale en toda la ventana principal: un error que llega sin texto (`internal.unexpected` y los códigos «sin…» texto) muestra el aviso. Incluye códigos previsibles sin texto: ver P43 abiertas (DUD:375-377) | RED:183 | Toda la app | |
| RD-84 | Crear tarjeta sin «Por hacer» | `column.not_found` visible | RED:184 | Kanban, Formulario de tarjeta | |
| RD-85 | Color desactivado | `color.invalid`: «Este color ya no está disponible…» | RED:185 | Columnas y etiquetas | |
| RD-86 | Tema eliminado en otro equipo | `theme.not_found`: «Este tema ya no existe.» | RED:186 | Temas, Personalización | |
| RD-87 | Paleta desactivada | Elegir una paleta desactivada responde con error visible | RED:187 | Personalización > Paletas | |
| RD-88 | Cuenta bloqueada | `auth.user_banned`: «Tu cuenta es…» | RED:188 | Inicio de sesión, Recuperar contraseña | |
| RD-89 | Sesión vencida | `session.expired` con texto en toda la app | RED:189 | Toda la app | |
| RD-90 | Límites de campos | Viven en `apps/desktop/src/reglas/limites.ts`; una prueba compara con las columnas | RED:190 | Formularios | |
| RD-91 | Errores de forma | Salen todos a la vez en el Formulario de tarjeta y Agregar carrusel | RED:191 | Formularios | |
| RD-92 | Elemento eliminado en otro equipo | Columna, etiqueta o widget eliminado lo dice | RED:192 | Kanban, Etiquetas, Widgets | |
| RD-93 | Tema duplicado | `theme.content_duplicate`: «Ya tienes el tema “…” con estas mismas…» | RED:193 | Personalización | |
| RD-94 | Temas Windgets claro y oscuro | Catálogo con plantillas y paletas Windgets claro/oscuro; migración `0010_temas_windgets.sql` (la línea cita también 0009, que es `widget_windi`; ambas existen) | RED:194 | Catálogo de temas | |
| RD-95 | Mensaje del tema inicial | «No pudimos aplicar el tema <Windgets claro u oscuro>…» | RED:195 | Cuenta nueva | |
| RD-96 | Máximo de etiquetas | Hasta 3 por tarjeta y en el filtro de Reportes (migraciones 0011 y 0012) | RED:196 | Formulario de tarjeta, Reportes, Windi | |
| RD-97 | `is_day` del clima | Dato de día o noche para el ícono del clima | RED:197 | `weather-current`, Núcleo | |
| RD-98 | `card_list_upcoming` | Contrato para «Próximas a vencer» (ninguna vista lo consume aún) | RED:198 | Planificador diario | |
| RD-99 | Componentes base | `Boton`, `Selector`, `Segmentado` (IM-02) | RED:199 | `ui/` | |
| RD-100 | Nombre emergente | `NombreEmergente` reemplaza los `title` (IM-03) | RED:200 | `ui/` | |
| RD-101 | Íconos de acciones | `ui/Iconos` suma «más», «cerrar», «regresar», lupa, papelera | RED:201 | `ui/Iconos` | |
| RD-102 | Fuente de verdad (25-nov) | Figma «Windgets (Copy)» `A3Z03L20swFyo8qdP9jETF`; vigente | RED:202 | Todo el rediseño | |
| RD-103 | Ventanas emergentes | Foco atrapado, Tab y Shift+Tab ciclan; fondo bloqueado (IM-04) | RED:203 | `VentanaEmergente` | |
| RD-104 | Mensajes emergentes | Los de tipo «error» no se cierran solos (IM-07); G5 | RED:204 | `MensajeResultado` | |
| RD-105 | Cabecera de pantallas | Ranura `acciones` en `EncabezadoDePantalla` (IM-08) | RED:205 | `EncabezadoDePantalla` | |
| RD-106 | Descarte con datos escritos | RED:206 contradice a DP:7; gana DP:7 (Paula, 26-nov): en Clima «Salir sin guardar» solo si la ciudad cambió. Pendiente con destino: corregir RED:206 y anotar en `docs/DUDAS.md` (no existe aún) | RED:206; DP:7 | `FormularioColumna`, `FormularioEtiqueta`, `FormularioTarjeta`, `RenombrarTema`, etc. | |

---

## 6. DUDAS del rediseño (con el valor neutro usado)

Las opciones (a), (b), (c) son las literales de `docs/DUDAS.md`. «Valor usado» es el valor neutro con que sigue el código mientras Paula no decida. «Destino: Paula» viene tal cual de DUDAS.

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| P28 | Pantallas de cuenta | Rediseño de cuenta con apariencia fija (RD-01 a RD-26) | DUD:291-293 | SPEC_Cuenta_y_Acceso | |
| P29 | Catálogo y paletas | Catálogo con paletas nuevas | DUD:295-307 | Catálogo de temas | |
| P36 | Ventanas con sesión | Ventanas con sesión del Figma | DUD:309-312 | Ventana principal | |
| P37 | Agregar widget e indicador | Agregar widget y sincronización | DUD:314-317 | Widgets | |
| P38 | Planificador y Windi (24-nov) | Dudas del rediseño final | DUD:320-325 | Planificador, Windi | |
| P39 | Marco final | Ventana, avisos, menú, miga de pan | DUD:327-335 | Ventana principal | |
| P40 | Windi en ventana y widget | Windi del rediseño final; migración 0009 | DUD:337-343 | SPEC_Windi | |
| P41 | Emergentes, Kanban, formulario | Dudas de RD-72 a RD-75 | DUD:345-351 | Emergentes, Kanban | |
| P42 | Calendario, Agenda, Reportes | Dudas de RD-76 a RD-81 | DUD:353-359 | Calendario, Agenda, Reportes | |
| P43-367 | Orden de columnas (pendiente) | `column.order_invalid` sigue sin texto y se ve el genérico. Destino: respuesta de Paula a la abierta (1) | DUD:367 | `column_reorder` | |
| P43-368 | Lecturas silenciosas | `theme_list`, `card_list_board`, `label_list`, `planner_get_today`, agenda, calendario, reportes, catálogos, `preference_get`, estados de autenticación y sincronización y widgets de la capa no muestran error. Destino: L4 y L5. Ver V-01 | DUD:368 | Lecturas del Núcleo | — |
| P43-369 | Acciones del escritorio sin dónde mostrar el mensaje | `media_skip_previous`, `media_toggle_play_pause`, `media_skip_next`, `system_open_url`, `card_set_completed` de Tareas del día y `card_move` del widget Kanban. Destino: por definir. Ver V-01 | DUD:369 | `capa/` | — |
| P43-370 | Acciones de la aplicación | `app_exit`, `app_set_menu_collapsed` y `app_set_last_screen` no miran la respuesta. Destino: por definir. Ver V-01 | DUD:370 | `VentanaPrincipal.tsx` | — |
| P43-371 | Rechazar una propuesta de Windi (RD-83) | Antes cualquier error dejaba la propuesta «Descartada»; ahora solo con `proposal.discarded`; con `net.offline` sale el aviso de sin conexión y la propuesta queda deshabilitada hasta que vuelva la conexión | DUD:371 | SPEC_Windi | |
| P43-372 | Alcance de RD-86 | Se extendió a renombrar, eliminar, elegir y aplicar o guardar la vista previa; `theme_draft_open` sin `theme_id` y `theme_draft_discard` de un tema eliminado no lo dicen. Destino: por definir | DUD:372 | Temas | |
| P43-373 | Ubicación del mensaje de RD-87 | Va debajo de las paletas; al quitarse la paleta el foco queda en `body`. Destino: por definir | DUD:373 | Personalización > Paletas | |
| P43-374 | RD-88 y RD-89 sin comprobar | No se probaron contra Supabase real ni con petición Tauri real; con Google una cuenta bloqueada sigue por EV-02. Destino: por definir | DUD:374 | Cuenta | |
| P43-375 | Abierta (1), orden de columnas | `column_reorder` con una columna eliminada o creada en otro equipo se ve como genérico. Valor usado: lo construido. Destino: Paula. Ver V-05 | DUD:375 | Kanban | — |
| P43-376 | Abierta (2), mover en el widget Kanban | `WidgetKanban.tsx` ignora el error de `card_move`. Valor usado: lo construido. Destino: Paula. Ver V-05 | DUD:376 | Widget Kanban | — |
| P43-377 | Abierta (3), widget sin tema aplicado | `widget_set_active` sin tema dice «Este widget ya no existe.». Valor usado: lo construido. Destino: Paula. Ver V-05 | DUD:377 | Widgets | — |
| P43-386 | Previsible sin corregir (1), año del bloque horario | Un año de 0100 a 0999 pasa la pantalla y `fecha()` lo rechaza con el genérico sin texto (`servicio_del_planificador.rs:1310`). Ver V-05 | DUD:386 | Planificador | — |
| P43-387 | Previsible sin corregir (2), eliminar columna sin tablero | `column_get_delete_info` responde el genérico si falta Por hacer (`columnas.rs:15`). Valor usado: sin cambio. Ver V-05 | DUD:387 | Kanban | — |
| P43-388 | Previsible sin corregir (3), agregar widget sin tema | `widget_add` responde el genérico (`agregar.rs:83`); relacionado con la abierta (3). Ver V-05 | DUD:388 | Widgets | — |
| P43-389 | Previsible discutible (4), rechazo en el registro | `weak_password` en el registro cae en el genérico (`servicio_de_sesion.rs:396`). Valor usado: sin cambio. Destino: por definir. Ver V-05 | DUD:389 | Registro | — |
| P43-390 | Previsible discutible (5), guardar la imagen subida | Disco lleno o sin permisos responde el genérico (`imagenes.rs:165, :167`). Valor usado: sin cambio. Destino: por definir. Ver V-05 | DUD:390 | Personalización | — |
| P43b-394 | Fondo de la plantilla por defecto sin descargar | Opciones: (a) incluir en el instalador el fondo y la miniatura de `claro`; (b) usar los de `default` cuando los de la plantilla por defecto no estén en el computador; (c) dejarlo así. Valor usado: (c). Destino: por definir | DUD:394 | HE-02-HU01-CA04 | |
| P43b-395 | Colores sin catálogo y sin sesión | Opciones: (a) dejarlos; (b) pasar ambos a «Windgets oscuro»; (c) pasarlos a «Windgets claro». Valor usado: (a). Destino: por definir | DUD:395 | `TOKENS_POR_DEFECTO`, plantilla `default` | |
| P43b-396 | «Rosa pastel» y «Enfoque rojo y negro» | Opciones: (a) una pieza propia con las tablas de colores aprobadas desde el Figma; (b) sacarlos de DI-02 en esta entrega. Valor usado: no se construyen. Destino: por definir | DUD:396 | Catálogo de temas | |
| P43b-397 | Contraste de la acción en «Windgets claro» | `accion` `#00D9E2` 1,75:1 sobre `#FFFFFF`, 1,68 sobre `#FFFBEA`, 1,56 sobre `#F5F0FF`, 1,42 sobre `#EDE3FF`. Opciones: (a) en estos temas, foco y texto de acción con `borde` o `secundario`; (b) otro color de acción aprobado para «Windgets claro»; (c) dejarlo así. Valor usado: (c). Destino: por definir. Ver Q-CONTRASTE | DUD:397 | `tokens.css`, `marco.css` | |
| P43b-398 | `principal`, `secundario` y `error` | Definidos y ningún componente los usa. Valor usado: sin cambio. Destino: IM-02 y siguientes, por confirmar | DUD:398 | Tokens | |
| P43b-399 | Aviso del catálogo de plantillas, tipografías y paletas | Si `catalog_list` fallara, la pantalla no dice nada. Opciones: (a) definir el texto y mostrarlo en esos pasos; (b) reutilizar el del catálogo de imágenes con otra redacción aprobada; (c) dejarlo así. Valor usado: (c). Destino: por definir | DUD:399 | `Personalization.tsx` | |
| P43b-400 | Orden de la descarga del catálogo | `descargar_catalogo` guarda las plantillas en el orden en que llegan; riesgo con el índice único si cambia el orden de por defecto. Visto en el código; valor usado en DUD:400 | DUD:400 | Descarga del catálogo | |
| P43b-401 | Aplicar 0010 en la nube | Los archivos de `templates/claro/` deben estar en el bucket `catalog` antes. Destino: quien despliegue | DUD:401 | Supabase | |
| P43b-402 | D-14, orden de los cambios pendientes | Opciones: (a) dejarlo así; (b) enviar primero las eliminaciones de `card_label` (cambia HE-15-HU03-ET06); (c) no fusionar los cambios de `card_label`. Valor usado: (a). Destino: por definir | DUD:402 | Sincronización | |
| P43b-403 | D-14, descarga en varias páginas | Opciones: (a) dejarlo así; (b) volver a descargar todo cuando se salte una asignación; (c) recortar al terminar la última página. Valor usado: (a). Destino: por definir | DUD:403 | Sincronización | |
| P43b-404 | D-14, alta pendiente descartada al actualizar | Opciones: (a) descartarlas, como ahora; (b) conservarlas en la cola y dejar que R7 de la nube decida; (c) descargar antes de recortar. Valor usado: (a). Destino: por definir | DUD:404 | Base local 10 | |
| P43b-405 | D-14, aplicar en la nube | No se aplicaron 0011 ni 0012 ni se desplegó `windi-chat`; cada migración en su transacción. Destino: quien despliegue, antes de publicar la versión | DUD:405 | Supabase | |
| P43b-406 | D-14, candados de 0012 | Opciones: (a) dejarlo así; (b) recortar por lotes de cuentas. Valor usado: (a). Destino: quien despliegue, antes de aplicar 0012 | DUD:406 | Migración 0012 | |
| P43b-407 | Ícono del clima de día y de noche | IM-13 define el ícono por código, pero el repositorio no trae esos íconos; el plan los pone en L3. Opciones y destino en DUD:407 (primera opción: (a) construirlos en L3 con el grupo «Clima» de PR-26 cuando esté en el Figma) | DUD:407 | Widget Clima | |
| P43b-408 | Código conocido sin `is_day` | Opciones: (a) el ícono de día; (b) «Sin datos» en los códigos 0, 1 y 2, los únicos que cambian de noche, y el propio en los demás; (c) «Sin datos» en todos. Valor usado: ninguno, aún no hay ícono. Destino: L3 | DUD:408 | Widget Clima | |
| P43b-409 | Desplegar `weather-current` | No se desplegó ni se probó con Open-Meteo real; la caché puede entregar hasta 30 minutos datos sin `is_day`. Destino: quien despliegue | DUD:409 | Supabase | |
| P43b-410 | Texto de `limit.out_of_range` | Opciones: (a) sin texto, porque el límite lo fija la vista y no la persona; (b) «El límite debe estar entre 1 y 3.»; (c) otro texto que defina Paula. Valor usado: (a). Destino: Paula | DUD:410 | `card_list_upcoming` | |
| P43b-411 | Desempate de «Próximas a vencer» | Opciones: (a) prioridad de alta a baja, sin prioridad al final, y creación; (b) solo creación; (c) el orden manual de `position` cuando exista `card_reorder` (A-06). Valor usado: (a) | DUD:411 | Planificador diario | |
| P44-415 | Respaldo en temas sin `secundario` ni `error` | Opciones: (a) dejarlo así; (b) derivar `secundario` y `error` con 4,5:1 para todo tema en `derivarTokens`. Valor usado: (a). Destino: Paula | DUD:415 | `Boton`, `Segmentado` | |
| P44-416 | Color sobre `secundario` | Opciones: (a) `superficie`; (b) otro color aprobado para cada tema. Valor usado: (a). Destino: Paula | DUD:416 | `Segmentado` | |
| P44-417 | Confirmaciones de borrado | Opciones: (a) pasarla a `variante="destructivo"`; (b) conservar el relleno rojo y anotarlo como excepción de IM-02. Valor usado: (b), sin cambio | DUD:417 | `Confirmacion` | |
| P44-418 | Tira semanal de la Agenda | Opciones: (a) conservar `accion`; (b) pasarla a `secundario`. Valor usado: (a). Destino: L4 | DUD:418 | Agenda diaria | |
| P44-419 | Medidas propias de cada pantalla | Siguen por encima de la jerarquía (confirmación, botón de la Agenda, menú del Kanban, filas de Wallpaper, subpantallas de widgets); detalle de opciones y valor en DUD:419 | DUD:419 | Pantallas | |
| P44-420 | Esc con el nombre emergente a la vista | Opciones: (a) un solo Esc oculta el nombre y cierra; (b) el primer Esc solo cierra el nombre y el segundo cierra la ventana, el menú o el panel. Valor usado: (a). Destino: Paula | DUD:420 | `NombreEmergente` | |
| P44-421 | Nombre emergente distinto del nombre accesible | Opciones: (a) conservar los dos textos de hoy; (b) mostrar el nombre accesible; (c) cambiar el nombre accesible por el texto emergente. Valor usado: (a). Destino: Paula | DUD:421 | `NombreEmergente` | |
| P44-422 | Nombres del botón del menú | Opciones: (a) conservar los de hoy («Ocultar menú», «Ampliar menú»); (b) cambiarlos por los de IM-03 («Contraer menú», «Expandir menú»). Valor usado: (a). Destino: L4 | DUD:422 | Menú lateral | |
| P44-423 | Interruptores sin `aria-label` | Opciones: (a) dejarlos con su etiqueta; (b) agregarles un `aria-label` igual a ella. Valor usado: (a). Destino: L4 | DUD:423 | Widgets, Configuración | |
| P44-424 | Motivo de un botón deshabilitado con el teclado | Opciones: (a) dejarlo así; (b) usar `aria-disabled` para que reciba el foco y muestre el motivo. Valor usado: (a). Destino: L4 | DUD:424 | `Boton` | |
| P44-425 | Fuera de esta pieza | No se construyeron `Panel`, mensajes emergentes, lo de Windi ni los deslizadores «Oscurecer» y «Desenfocar» de IM-02 (destino: L6, Personalización); los íconos de acciones ya están (RD-101) | DUD:425 | L3, L6 | |
| P44-426 | Dibujo de los íconos de acciones | Opciones: (a) conservar los trazos simples de `ui/Iconos`; (b) reemplazarlos por los exportados del Figma cuando estén en «00 · Fundamentos». Valor usado: (a). Destino: Paula | DUD:426 | `ui/Iconos` | |
| P44-427 | Engranaje de «Configurar» | Opciones: (a) engranaje nuevo para «Configurar» y el menú como está; (b) usar en «Configurar» el dibujo del menú; (c) pasar el menú también al engranaje. Valor usado: (a). Destino: Paula | DUD:427 | `ui/Iconos`, menú | |
| P44-428 | Ícono de carpeta | Opciones: (a) dejarlo disponible hasta que L4 diga dónde va; (b) quitarlo. Valor usado: (a). Destino: L4 | DUD:428 | `ui/Iconos` | |
| P44-429 | «×» como texto o como ícono | Opciones: (a) conservar el carácter; (b) usar el ícono en las «×». Valor usado: (a), sin cambio | DUD:429 | Ventanas emergentes, Windi | |
| P44-430 | Íconos que ya existían en una pantalla | Expandir y compactar (Kanban) y las flechas de periodo siguen como dibujos propios; no se movieron a `ui/Iconos` | DUD:430 | Kanban, navegación de fecha | |
| P44-431 | «⋯» frente a «⋮» | Opciones: (a) tres puntos en horizontal; (b) en vertical, como hoy. Valor usado: (a), aún sin aplicar. Destino: L4 | DUD:431 | Menús de columna y tarjeta | |
| P44-432 | Íconos del clima | Siguen pendientes de P43b-407 y P43b-408. Destino: L3, cuando Paula decida | DUD:432 | Widget Clima | |
| P44-433 | IM-04, descarte en las ventanas emergentes | Opciones: (a) dejar así hasta definir qué es «con datos escritos»; (b) comparar con los valores iniciales en cada formulario; (c) solo en los formularios de crear y editar tarjeta. Valor usado: (a). El desplazamiento queda en 85 % (RD-72) frente al 90 % de IM-04. Posible conflicto con RD-106 (RED:206) | DUD:433 | `VentanaEmergente` | |
| P44-434 | IM-07, errores y ventana emergente | Opciones: (a) el cuarto reemplaza siempre al más antiguo, aunque sea un error; (b) los errores no se reemplazan y el cuarto espera; (c) Tab llega al mensaje desde la ventana. Valor usado: (a). Destino: Paula | DUD:434 | `MensajeResultado` | |
| P44-435 | IM-08, espacio entre el título y los controles | Se usan 16 px en horizontal y 4 px entre líneas. Opciones: (a) dejarlo; (b) tomar la medida del Figma en L9. Valor usado: (a) | DUD:435 | `EncabezadoDePantalla` | |
| P44-436 | IM-08, indicador de sincronización sobre los controles | Opciones: (a) dejarlo hasta el Figma; (b) reservar el alto del indicador en la fila 1 cuando haya `acciones`. Valor usado: (a). Destino: L9 (Figma) | DUD:436 | Indicador de sincronización | |

---

## 7. Contradicciones Figma-documento y cómo se resolvieron

Regla común: se unifica al valor de la variable o del componente de F0 (DP:8; CONS:298). El detalle por código está en la línea citada de CONS. Agrupado por familia de CONS; ningún código falta.

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| FC-C | Colores C1 a C20 | Cada color del código se alinea a la variable de F0 | CONS:21-40 | Tokens de tema | |
| FC-R | Radios R1 a R15 | Radios al valor medido en F0 (D5, R11) | CONS:48-62 | Componentes base | |
| FC-A | Tamaños A1 a A19 | Tamaños al valor medido (P4) | CONS:70-88 | Componentes base | |
| FC-T | Tipografía T1 a T18 | Estilos al Figma; quitar 42/26/17 (D8); fuente por tema | CONS:96-113 | Tokens de tipografía | |
| FC-E | Estados E1 a E19 | Vacío, cargando y error al patrón del Figma (D9); E7, E9, E10 propuestos: ver V-07 | CONS:121-139, :314 | Calendario, widgets, instalador | — |
| FC-G1 | Errores genéricos G1a a G1s | Un mensaje por causa; G1a, G1f, G1q propuestos (ver V-07); claves por S19 | CONS:151-169, :313 | Catálogo de errores | — |
| FC-G2 | G2 a G18 | Textos y códigos de G2 a G18; G2 no crea códigos (C-12) | CONS:175-191 | Catálogo de errores; Temas | |
| FC-P | Prototipo P1 a P18 (CONS) | Funciones nuevas se implementan (D-NUEVO); P16 sin medida de sombra del interruptor (ver V-07) | CONS:197-214, :316 | Todas las specs | |
| FC-N | Residuos N1 a N20 | Se resuelven al valor de F0 | CONS:222-241 | Todas las piezas | |
| FC-D7 | D7 frente a RD-63 y RD-104 | Ver V-04: hoy rige lo implementado de RD-63/RD-104 hasta que Paula decida | CONS:245-264; RED:163, :204 | `MensajeResultado` | — |
| FC-C13 | C-13 | Ver V-02 | ERR:292 | Personalización | — |
| FC-C17 | C-17 | Ver V-02 | ERR:296 | MB-26 | — |
| FC-C18 | C-18 | Ver V-02 | ERR:297 | WE-01 | — |
| FC-C19 | C-19 | Ver V-02 | ERR:298 | HE-01-HU01-CA05 | — |
| FC-C20 | C-20 | Ver V-02 | ERR:299 | `messages.es.json` | — |
| FC-C1 a C12, C14 a C16 | Conflictos resueltos | C-1, C-3, C-4, C-8, C-9, C-10, C-11 por S19 (ERR:288 incluye C-9); C-2, C-5, C-6, C-7, C-12, C-15, C-16 resueltos; C-14 es la errata de RG-ERRATA | ERR:280-295 | Catálogo de errores | |
| FC-HU | HU frente a Figma | Navegación por la HU, no por las URL a «Windgets--Copy-» | CONS:300 | Navegación | |
| FC-0009 | Numeración de migraciones | RD-94 cita 0009 y 0010; ambas existen (`0009_widget_windi.sql`, `0010_temas_windgets.sql`) | RED:194 | `supabase/migrations/` | |

---

## 8. Contratos y migraciones PROPUESTA

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| PR-EV31 | EV-31 `pointer_moved` | PROPUESTA: evento nuevo del Núcleo, un máximo de uno cada 50 ms, `inside:false` único al salir; el Núcleo no reenvía movimiento hoy (C-2) | SPEC_Escritorio_y_capa.md:30-32, :348, :385 | `docs/contratos.md`, `docs/DUDAS.md`; Calendario y Noticias | |
| PR-EV32 | EV-32 `card_reminder_due` | PROPUESTA: evento del recordatorio de tarjeta | SPEC_Planificador.md:1129 | `docs/contratos.md` | |
| PR-TODAY | `planner_get_today` con `date?` | PROPUESTA: amplía IPC-CARD-08 con `date?: DateIso` para el mini calendario (S11) | SPEC_Planificador.md:158, :1129 | `docs/contratos.md`; Planificador | |
| PR-S10 | Notificación de Windows | PROPUESTA (S10, V-03): toast con `windows` 0.62.2 y AppUserModelID en el acceso directo; plan B con spike para «Abrir» y «Marcar como completada». Código `NOTIFICACIONES_BLOQUEADAS` PROPUESTA | SPEC_Planificador.md:108, :150, :160-166 | PL-01 parte 9; EC-15. Ver V-03 | — |
| PR-0013 | Migración 0013 compartida | Una sola 0013: `app_density` (`compact` por defecto, `comfortable`) en `user_preference` y las columnas de S13 en `theme`, `applied_theme` y `theme_widget`; con equivalente en `docs/local/`. Se pasa a 0014 si una se implementa antes | SPEC_Configuracion.md:182, :477; SPEC_Personalizacion_y_widgets.md:1232-1237, :1490 | `supabase/migrations/`, `docs/local/sqlite_esquema.sql`, `_sync_fields` | |
| PR-DENS | Densidad `app_density` | Amplía IPC-DESK-12/13 con `app_density`; HU nueva en HE-16 | SPEC_Configuracion.md:477 | `docs/contratos.md:291-292` | |

### Códigos PROPUESTA (58), un grupo por fila

Valor neutro general (ERR:257): el texto exacto de la spec; si el código es alias de uno existente, el texto de la clave existente (ERR:255).

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| PC-G1 | G1 (18) | `WINDI_ERROR_INTERNO`, `WINDI_SIN_RESPUESTA`, `WINDI_CONEXION_PERDIDA`, `WINDI_MENSAJE_MUY_LARGO`, `SINCRONIZACION_FALLIDA`, `OPERACION_FALLIDA`, `REPORTE_NO_CARGA`, `WIDGETS_NO_CARGAN`, `CLIMA_NO_CARGA`, `INICIO_AUTOMATICO_FALLIDO`, `CIERRE_SESION_FALLIDO`, `NOTICIAS_NO_CARGAN`, `WALLPAPER_NO_SE_MUESTRA`, `INSTALACION_FALLIDA`, `ORGANIZAR_WIDGETS_FALLIDO`, `GOOGLE_NO_DISPONIBLE`, `NAVEGADOR_NO_ABRE`, `CORREO_GOOGLE_MUY_LARGO`. Valor neutro: el texto de G1a a G1s en CONS (los alias por S19 usan el de la clave existente) | ERR:257, :259 | `messages.es.json`; CONS §6.1 | |
| PC-PANT | Pantallas (6) | `ESCRITORIO_NO_CARGA`, `PLANIFICADOR_NO_CARGA`, `TABLERO_NO_CARGA`, `CALENDARIO_NO_CARGA`, `PREFERENCIA_MENU_NO_GUARDADA`, `PERFIL_NO_DISPONIBLE`. Valor neutro: el texto de EC-01, PL-01, PL-03, PL-05, MB-xx | ERR:257, :260 | Spec de cada área | |
| PC-PLAN | Planificador (8) | `ARRASTRE_SIN_HORA`, `PROXIMAS_NO_CARGAN`, `NOTIFICACIONES_BLOQUEADAS`, `PANEL_DIA_NO_CARGA`, `COLUMNA_NO_ELIMINADA`, `TARJETA_NO_ELIMINADA`, `ETIQUETA_NO_ELIMINADA`, `ETIQUETAS_NO_CARGAN`. Valor neutro: el texto de PL-01 a PL-15 | ERR:257, :261 | `contratos.md` (S6 a S12) | |
| PC-ESC | Escritorio (3) | `WIDGET_NO_CARGA`, `ENLACE_NO_PERMITIDO`, `ZONA_HORARIA_NO_DISPONIBLE`. Valor neutro: el texto de EC-01, EC-02, S2 | ERR:257, :262 | `messages.es.json` | |
| PC-MARCO | Marco (4) | `COLOR_OBLIGATORIO`, `FECHA_FUERA_DE_RANGO`, `<CAMPO>_OBLIGATORIO`, `<CAMPO>_INVALIDO`. Valor neutro: «Elige un color.» y «El valor no tiene un formato válido.» | ERR:257, :263 | `messages.es.json` | |
| PC-INST | Instalador (9) | `DESCARGA_SIN_CONEXION`, `DESCARGA_NO_DISPONIBLE`, `INSTALADOR_NO_PUBLICADO`, `SIN_ESPACIO_EN_DISCO`, `ESPACIO_NO_MEDIBLE`, `ABRIR_APLICACION_FALLIDO`, `REVERSION_FALLIDA`, `EQUIPO_NO_COMPATIBLE`, `INSTALADOR_DANADO`. Valor neutro: el texto de CD-02 e IN-01 a IN-07; `ESPACIO_NO_MEDIBLE`: continuar sin comprobar el espacio | ERR:257, :264 | `docs/CD-02.md` | |
| PC-PERS | Personalización (8) | `widget_opacity.invalid`, `widget_font_size.invalid`, `widget_format.invalid`, `widget_appearance.invalid`, `widget_shape.invalid`, `layout_preset.invalid`, `background_dim.invalid`, `background_blur.invalid`. Valor neutro: el texto de PW-12 y PW-13 | ERR:257, :265 | `contratos.md` (IPC-THEME-05) | |
| PC-NUEVOS | Nuevos de esta revisión (2) | `IMAGEN_NO_GUARDADA` (R20) «No pudimos guardar la imagen. Intenta de nuevo.» y `SESION_NO_GUARDADA` (R14) «No pudimos guardar tu sesión. Vuelve a iniciar sesión.» | ERR:257, :266 | Rutas R14 y R20 | |

---

## 9. Rutas genéricas aceptadas

Las rutas que llegan al error genérico y se aceptan. R15 y R26 aparecen como «Retirada» en la fuente (falso positivo), no como aceptadas. R32 es «Corregir».

| ID | Tema | Decisión vigente (una línea) | Fuente (archivo:línea) | Dónde se aplica (specs/piezas) | Paula cambia a: |
|---|---|---|---|---|---|
| RG-R15 | Renovación de sesión | Retirada: falso positivo; el cierre de sesión ya devuelve `AuthSignOutFailed` | ERR:171 | `servicio_de_sesion.rs:344` | |
| RG-R16 | Rechazo de Supabase no reconocido | Aceptada: `inesperado()` ante una respuesta nueva que nadie pudo prever | ERR:172 | `servicio_de_sesion.rs:556`, `recuperacion.rs:66` | |
| RG-R18 | Error de base sin regla propia | Aceptada: fallo de infraestructura (disco, bloqueo, corrupción) | ERR:174 | `servicio_del_planificador.rs:165` | |
| RG-R22 | Avisos en segundo plano sin sesión | Aceptada sin superficie; ver V-01 | ERR:178 | `puente_ipc.rs:416, :461` | — |
| RG-R23 | Refresco de clima y noticias | Aceptada sin superficie: la persona sigue viendo el último dato; ver V-01 | ERR:179 | `puente_ipc.rs:1434, :1489` | — |
| RG-R24 | Vigilancia de carga | Aceptada sin superficie: lista vacía; ver V-01 | ERR:180 | `puente_ipc.rs:1560` | — |
| RG-R26 | Inicio automático y navegador | Retirada: falso positivo | ERR:182 | `inicio_automatico.rs:64-66`, `navegador.rs:118, :127` | |
| RG-R31 | Rechazo de transporte | Aceptada: todo rechazo de `invoke` es `internal.unexpected`; la prueba existe (`ipc/cliente.test.ts:16`) | ERR:192 | `apps/desktop/src/ipc/cliente.ts:8-22` | |
| RG-R32 | Tipo inferido en `MensajeResultado` | No aceptada: se corrige; toda llamada de error pasa `tipo: 'error'` | ERR:193 | `MensajeResultado.tsx:44-55, :133` | |
| RG-ERRATA | Errata `labels.limit_reached` | `contratos.md:312` (Windi) dice `labels.limit_reached`; el código real es `label.limit_reached` (`contratos.md:190`, `errores.rs:94`). Sin código nuevo | ERR:268, :293, :308 | `docs/contratos.md:312` | |
| RG-R13 | Ruta R13 desactualizada | Pendiente con destino ERRORES_Y_PRUEBAS: ERR:164 (R13) está desactualizada frente a C-1 (cae a `SERVICIO_NO_DISPONIBLE`, que queda como clave) | ERR:164, :280 | `ERRORES_Y_PRUEBAS.md` | |

---

## Cierre

Conteo de filas por sección:

| Sección | Familia | Filas |
|---|---|---|
| 1 | Para mirar primero | 7 |
| 2 | D | 23 |
| 3 | G, R, P, Q | 11 |
| 4 | S | 19 |
| 5 | RD (filas que cubren RD-01 a RD-106) | 70 |
| 6 | DUDAS | 65 |
| 7 | Contradicciones Figma-documento | 18 |
| 8 | Contratos y migraciones PROPUESTA (6 contratos y migraciones, 8 grupos de códigos) | 14 |
| 9 | Rutas genéricas | 11 |

Pendiente de Paula: lo que esté en la sección 1 (V-01 a V-07). Las filas de la sección 1 exigen respuesta explícita; en el resto, vacía significa aprobada.
