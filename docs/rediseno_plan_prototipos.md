# Prototipos · plan de trabajo por lotes (25-nov-2026, hora de Colombia)

Orden de trabajo para el chat que aplica en Figma **todos** los cambios pendientes. Es solo trabajo de prototipos: no se
toca código, no se hace commit y no se sube ningún documento.

## 1. Qué leer y cuál gana

| Documento (en `docs/`) | Para qué sirve | Cuánto leer |
|---|---|---|
| `rediseno_pendientes_prototipos.md` | **La lista de lo que hay que hacer.** Reglas, 15 secciones y decisiones ya tomadas | Completo, una vez. Incluida la tabla «Cambios que agrego yo»: si tiene filas, súmalas al lote que corresponda |
| `rediseno_plan_prototipos.md` (este) | Orden, datos técnicos y registro de avance | Completo |
| `rediseno_cambios_prototipos.md` | Documento anterior: medidas de G-02 a G-09 y PR-nn, ids de nodos, datos de ejemplo, errores E-nn | **Por secciones**, solo la que pida el lote |
| `rediseno_final_prototipos.md` | Solo la sección 9 (widgets de escritorio, bandeja, recordatorio, confirmaciones) | Solo esa sección, en los lotes 10 y 12 |

Gana, en este orden: la lista de pendientes, luego el documento anterior, luego el final.

### Lo que del documento anterior ya no vale

| Documento anterior | Ahora |
|---|---|
| Archivo `GdUKUwVHz3Wm0Dqw16UX8k` (D-01) | Se trabaja en la copia `A3Z03L20swFyo8qdP9jETF` |
| Colores de G-01 y «el planificador claro comparte fondo con Inicio de sesión» | Reparto de la sección 1 de pendientes: Principal violeta en barra y botón principal; fondo blanco en Windgets claro tras ingresar |
| Botón principal y opción elegida según G-02 | Mismos niveles y medidas, con los colores de la sección 1 |
| Mensajes arriba a la derecha, hasta 3 apilados (D-10, PR-25) | Una píldora arriba, en el lugar de «Sincronizado», uno a la vez (sección 11) |
| Botón «Cambiar» en la carpeta de instalación (E-39) | Sin «Cambiar»; la ruta como texto |
| «Ver más reportes» con ícono (G-04, G-05) | Texto «Ver más reportes ›», sin ícono |
| Botones «Vista expandida» / «Vista compacta» (G-05) | Interruptor de dos íconos con esos nombres emergentes |
| Lupa en «Mover a», «Filtrar etiquetas» y Catálogo (G-04) | Sin lupa (el campo «Ciudad» sí la lleva) |
| Día vencido con un punto rojo (PR-12) | Estados con relleno, borde e ícono (sección 9) |
| Ícono del clima de un color, 32 px (PR-26) | Grande y de dos tonos del tema (sección 5) |
| Pendientes `#DCBA04` (PR-14) | Ámbar `#A88B00` |
| Textos nuevos a criterio de quien aplica (D-13) | Lo que no esté escrito en los documentos **se pregunta** |
| «Estado del Figma» e «Instrucciones para el chat que aplica lo pendiente» (un chat por lote) | La tabla está desactualizada; las instrucciones se reemplazan por este plan |

## 2. Datos técnicos de Figma

Salen de las pasadas anteriores. Los **valores** de las variables cambiaron después: léelos antes de usarlos.

- **Archivo:** `A3Z03L20swFyo8qdP9jETF`
  (<https://www.figma.com/design/A3Z03L20swFyo8qdP9jETF/Windgets--Copy->). Los ids de nodos y variables son los mismos
  del original.
- **Antes de escribir:** carga la guía `skill://figma/figma-use/SKILL.md` y pasa `skillNames: "resource:figma-use"` en
  cada `use_figma`.
- **Páginas:** `0:1` Fundamentos · `79:2` Acceso · `79:3` Planificador · `79:4` Agente de IA · `79:5` Personalización ·
  `79:6` Configuración · `83:2` Escritorio · `83:3` Web e instalación · `83:4` Confirmaciones.
- **Colección de temas:** `VariableCollectionId:200:2` «Rediseño final · Tema aplicado».
  Modos: `200:0` Windgets claro · `233:0` Windgets oscuro · `200:1` Rosa pastel · `200:2` Enfoque rojo y negro.
  La hoja de Fundamentos usa además la colección `80:2`; «Tema en edición» de Personalización, `211:6537`.
- **Variables** (`VariableID:…`): `principal` 200:3 · `secundario` 200:4 · `marco` 200:5 · `sobre_marco` 200:6 ·
  `superficie` 200:7 · `superficie_alta` 200:8 · `superficie_baja` 200:9 · `linea` 200:10 · `tinta` 200:11 · `texto`
  200:12 · `accion` 200:13 · `sobre_accion` 200:14 · `borde` 200:15 · `sombra` 233:107 · `error` 233:108. Hay otras
  creadas después (`borde_campo`, `burbuja_propia`, las del deslizador): lista la colección en el lote 0.
- **No te guíes por el nombre de la variable** para repartir colores: mira dónde se usa hoy y asigna según la tabla de
  la sección 1 de pendientes.
- **Tipografías:** Fundamentos usa Rubik; las pantallas, Nunito (Regular, Medium, Bold) y Rubik Medium en la barra
  lateral. Carga la fuente antes de escribir un texto; un texto puede traer otra (ej. Quicksand) y uno vacío no admite
  consultar sus fuentes.
- **Pantallas:** 1093 × 560.
- **Barra lateral:** conjunto `204:32251`; variantes `204:32252` y `204:32300` (Windgets ampliada y contraída),
  `204:32336` y `204:32384` (Rosa), `204:32420` y `204:32468` (Enfoque).
- **Modos fijados a mano:** variantes e instancias de la barra y la «Vista previa del escritorio» han tenido un modo
  fijo (un marco oscuro como `233:18961` necesita `233:0`). Si un color no cambia, revisa `explicitVariableModes`.
- **Botón de Windi:** el marco «Nav · Windi» (48 × 48; x=1029, y=496, y en Personalización y=425) lleva las conexiones
  del prototipo: no lo borres. Dibujo correcto de Windi: `66:71`.
- **Nodos de referencia:** tabla «Páginas y nodos de referencia» del documento anterior; los demás ids están en cada
  punto de pendientes.

### Para no perder trabajo ni cuota

- Cuota aproximada: 200 llamadas al día y 10 por minuto. Agrupa varios cambios parecidos en cada `use_figma`.
- Devuelve respuestas cortas: si un `use_figma` devuelve más de 48 000 bytes, **sus cambios no se guardan**.
- Nunca metadatos de una página entera. Busca los marcos por id o, dentro de un script, por nombre.
- `findAll` solo existe en nodos con hijos; comprueba antes.
- Si se agota la cuota, anota el punto exacto en el registro de avance y avisa a Paula.

## 3. Cómo se trabaja cada lote

1. Abre solo las secciones de pendientes que cita el lote (y del documento anterior, las que se indiquen).
2. Mira cómo está hoy cada marco. Lo que ya cumple no se rehace; «Ya revisado» y «Ya decidido» no se vuelven a
   preguntar.
3. Aplica en Windgets claro. Luego en los marcos hermanos de oscuro, Rosa pastel y Enfoque, cambiando solo variables.
   Un marco nuevo se clona para cada tema y se le fija su modo; revisa que las conexiones del prototipo queden bien.
4. Todo texto va literal en el marco. Los que llevan `< >` se llenan con los datos de ejemplo (sección 3 del documento
   anterior: hoy es martes 24-nov-2026).
5. Cierra con **una** tanda de capturas (máximo 1024 px) de lo que cambió: Windgets claro y oscuro; Rosa y Enfoque solo
   donde el color pida revisión. Una línea en el registro de avance. Sigue con el lote siguiente sin esperar.
6. Lo no definido se pregunta con opciones para elegir, agrupado. Mientras llega la respuesta, sigue con lo que no
   depende de ella.
7. No borres marcos: ocúltalos o muévelos a una sección «Descartado».

## 4. Lotes

Entrega prevista: jueves 26-nov-2026. Van en orden de importancia.

### Lote 0 · Punto de partida (sin cambios)

- [ ] Leer la colección de variables con sus valores en los cuatro modos.
- [ ] Captura de `204:622`, `204:704`, `203:6607`, `204:22938` y `66:4`.
- [ ] Anotar en el registro lo que ya esté hecho de los lotes siguientes.
- [ ] Del documento anterior (E-nn, G-nn y PR-nn), lo que siga sin cumplirse y no esté en «Lo que del documento
      anterior ya no vale» ni en «Ya revisado» se suma al lote de su pantalla y se anota en el registro.

### Lote 1 · Colores, componentes e íconos (Fundamentos `80:14`)

Pendientes: secciones 1, 2 y 9; íconos de la 5.

- [ ] Reparto de colores en las variables, en los cuatro temas, y variable para los detalles del Secundario.
- [ ] Barra lateral, botón principal, selector, paso, casillas, interruptor, progreso, «hoy» y sección activa según la
      tabla. Fondo blanco solo en Windgets claro tras ingresar; crema solo en sus cuatro lugares.
- [ ] Hoja «color → variable → dónde se usa».
- [ ] Componentes con normal, puntero encima, foco, deshabilitado y error.
- [ ] Los 11 íconos de clima en dos tonos y el logo oficial de Google.
- [ ] Dibujar, sin aplicar todavía: dos opciones de «Agenda diaria» y dos de «Planificador diario»; dos o tres de «Ver
      detalle»; un ícono por tipo de widget.
- [ ] **Preguntas (una sola tanda, con captura):** qué dibujo de cada ícono, si aprueba los de widgets y cómo se llaman
      las etiquetas de ejemplo que se agregan.

### Lote 2 · Reglas generales en todas las pantallas

Pendientes: secciones 8, 9 (Posición; sección activa; ▾ y ✓; barra lateral), 11 y 13. Documento anterior: G-02, G-03,
G-05, G-06.

- [ ] Desplegables: título y miga sin cambiar, posición, opción marcada, cierre, rango y sus errores.
- [ ] «Regresar» a la izquierda del título (también Acceso); «+» y «×» separados en el Panel del día.
- [ ] Sección activa marcada, engranaje en «Configuración» y los íconos de barra elegidos.
- [ ] Píldora de mensajes: componente, «Mensajes recientes», mover todos y un ejemplo por página.
- [ ] Botón de eliminar en Rosa y Enfoque, grosor del texto de la barra y nombres emergentes que se enciman.

### Lote 3 · Etiquetas, columnas y tarjeta

Pendientes: 14.1, 14.2, sección 9 («Tipo» y «Prioridad», «Columna», «Mover a», ícono de calendario), sección 12
(Etiquetas) y la lista de etiquetas de la sección 13. Documento anterior: PR-18.

- [ ] Círculos de color con nombre; etiqueta elegida con fondo suave y borde de su color.
- [ ] Campos, listas abiertas, errores, avisos, vacíos y confirmación.
- [ ] Más etiquetas de ejemplo en `204:1078`.

### Lote 4 · Planificador diario, Kanban y Agenda

Pendientes: 14.3 (esas tres), sección 9 (estados, flechas de la Agenda, vista del Kanban, reloj, ✓ de completada, «Ver
detalle») y sección 12 (Planificador). Documento anterior: PR-10, PR-15.

- [ ] Casillas, botón «⋯», menús de tarjeta y de columna, estados de vencimiento y vacíos.
- [ ] Barra de progreso visible en Rosa pastel (`204:19460`).

### Lote 5 · Calendario

Pendientes: sección 6, 14.3 (Calendario) y estados de la sección 9. Documento anterior: PR-12.

- [ ] Encabezados de Mes y Semana, día resaltado, Panel del día y sus marcos, selector «Mes y año».

### Lote 6 · Reportes y espacio de Windi

Pendientes: sección 7, 14.3 (Reportes), «Ver más reportes» de la sección 9 y sección 10. Documento anterior: PR-14.

- [ ] Reportes y Más reportes con sus interacciones y estados. Formato de la sección 7 con las cifras del conjunto de
      ejemplo, para que coincidan en todas las pantallas.
- [ ] Franja libre abajo a la derecha en `204:805`, `204:1249`, `204:704`, `204:1139` y `204:1005`, ya con los lotes 4 a
      6 aplicados.

### Lote 7 · Panel de Windi (`79:4`)

Pendientes: 14.4. Documento anterior: PR-20.

- [ ] Variantes de la propuesta, errores, sin conexión y un ejemplo de cada tipo de respuesta.

### Lote 8 · Personalización: tema, fondo, colores y tipografía

Pendientes: sección 1 («Colores del tema» y «Selector de color»), sección 3, 14.5 (pasos 1 a 3) y filas con › de la
sección 9. Documento anterior: PR-22, PR-23.

- [ ] Un solo botón principal por marco.
- [ ] Marcas, errores, avisos, ajuste por monitor, tipografías y los dos botones de restablecer.

### Lote 9 · Widgets en Personalización y clima

Pendientes: secciones 4 (vista previa) y 5, 14.5 (paso 4, agregar, configurar y organizar) y, de la sección 9, filas con
›, íconos por tipo, fila «Datos» de Windi, papelera deshabilitada y tirador.

- [ ] Todos los widgets con prototipo real, con el estilo, la forma y los colores de la sección 4.
- [ ] Buscador de ciudad con sus marcos y mensajes.
- [ ] Controles reales de Carrusel, Imagen, Texto y Animación.

### Lote 10 · Escritorio

Pendientes: sección 4 (escritorio), 14.6, sección 12 (Escritorio), reproductor de la sección 9 y clima en `204:23084`.
Documento final: sección 9.

- [ ] Cada widget con sus estados, widget seleccionado, fondo oscurecido y desenfocado, bandeja y recordatorio.
- [ ] El widget de Windi se queda con su chat.

### Lote 11 · Acceso, Configuración y mensajes de resultado

Pendientes: 14.7, 14.8, 14.9 y, de la sección 9, ojo de la contraseña, logo de Google e ícono de «Error de
sincronización».

- [ ] Todos los errores y avisos, cada uno en su lugar.
- [ ] Todos los textos de resultado en «Mensajes recientes» (`220:22383`).

### Lote 12 · Web, instalación y confirmaciones

Pendientes: sección 12 (Web e instalación; Confirmaciones) y, de 14.5, el ejemplo de eliminar un widget agregado en
lugar de «Reloj». Documento final: sección 9 (confirmaciones).

### Lote 13 · Revisión y cierre

- [ ] Rosa pastel y Enfoque rojo y negro, pantalla por pantalla (sección 13). Nada de color puesto a mano.
- [ ] Un marco por cada estado de pantalla: vacío, cargando, error, sin conexión y ventanas emergentes (sección 2).
- [ ] Pasar la «Lista final de revisión» del documento anterior. Lo que falte y no esté reemplazado (tabla de arriba), se
      hace.
- [ ] Marcar cada casilla de pendientes que quedó cumplida; las que no, con el motivo.
- [ ] Listar los textos del Figma que no estén en los documentos, con su marco, y preguntar si se quedan.
- [ ] Sección 15: «Estado del Figma», E-nn tachados, copia anotada, decisiones, variables y componentes nuevos.
- [ ] Resumen a Paula: hecho, parcial y por qué, y lo que queda para la implementación («Aviso para la
      implementación»).

### Lote 14 · Orden de los flujos para implementarlos con IA

Pedido por Paula (25-nov). Se hace al final, después del lote 13. Objetivo: que una IA pueda implementar cada flujo
leyendo el Figma y un documento, sin adivinar qué marco vale.

- [ ] Inventario (solo lectura) de todas las páginas: id, nombre, página, posición, visible u oculto, conexiones de
      entrada y salida, flujo, estado y tema.
- [ ] Análisis, con la evidencia de cada marco: duplicados, desactualizados (no reflejan un cambio ya decidido), que no
      deben estar (propuestas, plantillas, pruebas, contrarios a los documentos), sueltos (sin conexión), conexiones
      rotas o hacia marcos descartados y estados que faltan.
- [ ] Antes de mover u ocultar algo: preguntar a Paula, con opciones y capturas agrupadas. Nunca borrar: ocultar o
      mover a «Descartado».
- [ ] Ordenar cada página por flujo: orden de lectura de izquierda a derecha, estados debajo de su paso, claro primero y
      los otros temas en bloques aparte, nombres uniformes «Flujo · Paso · Estado · Tema», un solo marco válido por
      estado. Sin romper las conexiones del prototipo.
- [ ] Documento local `docs/rediseno_flujos_prototipos.md`: por flujo, su HU/CA/RD, punto de entrada, tabla
      «paso → marco (id) → acción que lo dispara → destino → estado», ids equivalentes por tema, textos (referencia a
      pendientes §14), lo no definido y la lista de marcos que no se implementan.
- [ ] Revisión final: cada conexión del documento coincide con la del Figma y no queda ningún marco sin clasificar.

No se inventan pantallas, textos ni funciones: lo que falte se anota.

## 5. Qué no entra

- Código, commits, Jira y subir documentos.
- Animaciones de resalte en toda la aplicación (para después).
- Flujo conectado de interacción del calendario.
- Modo de prueba con otros colores.
- Funciones que muestre la página de descarga (ej. pestañas de Windi).

## 6. Registro de avance

Una línea por lote cerrado o interrumpido. Un chat que retome empieza en el primer lote sin «Hecho».

| Lote | Estado (Hecho / Parcial / Falta) | Marcos tocados o nuevos | Qué falta y por qué |
|---|---|---|---|
| 0 | Hecho | Sin cambios (lectura y capturas) | Ya están: E-01 a E-29, E-31 a E-38 y E-40 (íconos de acción, ventana «Nueva tarjeta» con fichas, cifras de «Más reportes», Windi con globo, calendario completo y clima en escritorio, logo en la web). E-30 (`203:7133`) se revisa en el lote 9. E-39: reemplazado; quitar «Cambiar» de `84:1068` en el lote 12. E-41 y E-42: reemplazados por la píldora (lote 2). Los G-nn y PR-nn se cotejan al abrir cada pantalla. Clima en Fundamentos sigue de un solo tono (lote 1) |
| 1 | Hecho | Fundamentos: tablas `2004:142` y `2117:31609`, variables, componentes con sus estados, 11 íconos de clima, logo de Google y 15 íconos nuevos (`80:14`). Propuestas (sin aplicar) en `2121:765` y `2123:1207` | Cambio pedido por Paula (25-nov): en claro el Principal pasa a cian #00D9E2 con texto oscuro, barra lavanda #F5F0FF, y la selección, los enlaces y los interruptores quedan violeta (variable nueva `seleccion`); requiere un RD-nn en la implementación. La marca de sección activa se enciende en el lote 2 y la de «hoy» del minicalendario en el lote 4 |
| 2 | Hecho (25-nov) | Barra lateral (íconos y marca de sección activa), 12 desplegables (título, «▾», posición, ✓, cierre con clic fuera y Escape), selectores de Personalización, fechas de Reportes (selección, mensajes de error, ejemplos), «Regresar» a la izquierda del título, «+»/«×» del Panel del día; píldora de mensajes en su lugar y marco de ejemplo en 01–05 y 08 (`2150:65511`…); nombre emergente de «Nueva etiqueta» debajo del botón; G-02, G-03, G-05 y G-06 revisados con script y capturas (sin relleno #ECECEC, sin botones de texto «Editar/Eliminar/Regresar» salvo Detalle) | Sin marco de mensaje en 06 Escritorio y 07 Web: no tienen «Sincronizado» (pregunta del lote 13). «Mensajes recientes» pasa al lote 11. Nombres emergentes que tapan contenido de otra fila se dejan (la regla solo prohíbe tapar botones de la misma fila) |
| 3 | Hecho (25-nov) | 79:3: círculos con nombre, fichas, lista de etiquetas (x=29000), avisos (x=42000–45600), errores de campo de etiqueta y columna (x=37000–40600), «Etiquetas · Vacío» `217:17387`, confirmación «1 tarjeta» (x=47000–50600), «Fecha del bloque»/«Hora del bloque» en 28 ventanas, §14.2 en 10 marcos por tema (x=51000–54600), 8 etiquetas en `204:1078` y copias. PR-18 ya estaba (ventanas) | Supuestos a confirmar: hora actual del ejemplo después de 08:00; Título y Descripción vacíos sin texto de ejemplo (no definido) |
| 4 | Hecho (25-nov) | 79:3: casilla de completada en las 140 listas del Planificador (componentes `2152:28882` y `2152:28883` en `2003:266`); textos de vacío según §14.3 en todos los temas; «Eliminar» y el ícono de «Ver detalle» en el menú de tarjeta Kanban; «Quitar del horario»; «Vence mañana» en 29 tableros; marcos nuevos en x=56000 (claro) a 59600 (oscuro): todas completadas, sin tablero descargado, sin tarjetas por programar, menú de columna con «Eliminar» deshabilitado, dos avisos al soltar en Agenda y «Elegir un día». El botón «⋯» ya estaba en cada tarjeta | Tipo de tarjeta en la vista compacta (RD-73, RD-74) no se dibujó: no está definido cómo se ve (pregunta del lote 13). Mensaje de «todas completadas» puesto sobre la lista (posición no definida) |
| 5 | Hecho (25-nov) | Navegación ‹ Hoy › en los 16 marcos de calendario, Panel del día y Mes y año (todos los temas); «23 – 29 nov 2026» en Semana; flechas de año en «Mes y año»; marcos nuevos en x=56000 (y=4375…8125): nombres emergentes Mes anterior/siguiente y Semana anterior/siguiente, día con el puntero encima, Panel del día · Vacío («No tienes tarjetas para este día.»), aviso de día pasado; copias en Rosa, Enfoque y oscuro (`2156:1212…4796`). Plantillas `2155:31170` y `2155:31177` ocultas. | El panel ya tenía «+» y «×». El título del panel «Día seleccionado» y el ancho del botón «Hoy» no están en los documentos: van al lote 13. |
| 6 | Hecho (25-nov) | Reportes: puntero encima, estado elegido, rango cambiado, sin tarjetas, rango recortado y filtro de etiquetas (abierto, máximo, sin etiquetas) en x=56000 con sus 3 temas; Más reportes rediseñado (4 cifras con ícono, anillo, columnas, barras) en claro y sus copias; esquina de Windi libre (§10): Mes con filas de 44 (32 marcos), Semana con horas de 24 px y tarjetas de 23 px (12 marcos), Kanban con columnas de 380 px recortadas (92 marcos). Íconos nuevos de estado en Fundamentos (2163:37198…37214). | Capturas en claro, oscuro, Rosa y Enfoque de Reportes; Mes, Semana y Kanban revisados en claro y Rosa. Textos y colores sin definir anotados para el lote 13. |
| 7 | Hecho (25-nov) | Panel de Windi (79:4): 9 marcos de propuesta (Crear, Cambiar, Cambiar · Tarjeta completada, Mover, Mover · Tarjeta completada, Eliminar varias, Crear etiqueta, Descartada, Sin conexión) en x=10600; «Mensaje muy largo» y 4 catálogos de respuestas (propuesta, saludo y datos que faltan, no encuentra y sin cambio, hecho y fuera de alcance). Sin conexión y «No respondió» con «Reintentar» en los 4 temas. Clones en Rosa (11748), Enfoque (12896) y oscuro (14044). | Capturas: claro (propuestas, largo, catálogo, error) y oscuro (Cambiar · Tarjeta completada). |
| 8 | Hecho (25-nov) | Personalización (79:5): §3, paneles de «3 Colores y tipografía», «Máximo 20 MB», Tipografía, Restablecer y Selector de color en los 4 temas; 27 marcos nuevos de los pasos 1 a 3 en x=40000 con copias en Rosa (41148), Enfoque (42296) y oscuro (43444) y sus conexiones | Capturas: muestras de claro, Rosa, Enfoque y oscuro (no los 108 marcos). Textos que no están en los documentos anotados para el lote 13. El color sugerido por contraste en cada tema es un supuesto |
| 9 | Hecho (25-nov) | Presentación unificada de los widgets (componentes en `0:1`); en 79:5: lista «4 Widgets» rediseñada (64 paneles), «Agregar widget» y «Configurar widget» con controles reales de Imagen, Carrusel, Animación y Texto, buscador de ciudad, «›» en las filas que abren otro panel, fila «Datos» de Windi con borde, «Organizar widgets» con barra flotante y tirador en el widget elegido, 24 marcos de estado de «Agregar widget» y 24 de la lista (4 temas). 16 selectores «Datos» sin uso movidos a «Descartado»; tableros de propuestas de `0:1` ocultos | Estados de error de los controles solo sobre «Agregar widget». Capturas por muestras. Textos que no están en los documentos van al lote 13 |
| 10 | Hecho (25-nov) | 83:2: widgets del escritorio con la misma apariencia que «Organizar widgets»; 16 marcos de estado por tema (widget seleccionado, vacíos, errores, sin conexión, puntero encima, arrastre, aviso de wallpaper) en los 4 temas (`2233:8031`…, `2234:9546`…); el widget de Windi conserva su chat | La barra de tareas se ocultó en los marcos del Escritorio salvo en notificación y área de notificación. Al agrandar, Tareas, Calendario, Kanban y Noticias muestran más información; Reloj, Clima, Imagen y Animación crecen en proporción (decidido por Paula) |
| 11 | Hecho (25-nov) | §14.7 en 79:2 y 79:3, §14.8 en 79:6, §14.9 y «Mensajes recientes» (`220:22383`); marcos «Sesión cerrada» (`2251:9100`, `2251:9227`); íconos de sincronización y sin conexión. De §9, lo que faltaba: íconos de estado en Mes, Kanban, mini calendario, «Próximas a vencer» y Panel del día; «Resaltado» del día; navegación del día en 32 marcos de Agenda; Tipo y Prioridad con botones en 68 ventanas; ▾ en «Etiquetas», «Columna» y «Mover a»; ✓ en la opción actual de los selectores; interruptor de vista del Kanban en 64 marcos con sus 8 marcos de nombre emergente (x=62000); nombre emergente de la papelera deshabilitada (79:5, y=50000). Revisados §10 y §12 Etiquetas y barra de progreso Rosa | Capturas por muestras. «Si el correo está registrado, te enviamos un código de verificación.» no está en §14.7 y no se dibujó. Supuestos y textos sin definir van al lote 13 |
| 12 | Hecho (25-nov, cierre §12 Escritorio: widgets en claro ya blancos con borde; Recordatorio y Área de notificación sin crema en 4 temas) | 83:3: 68 rellenos sueltos a variables y modo explícito en los 8 marcos (`84:1050`…`84:1120`); botones «Cambiar» ocultos (`2071:2631`, `2071:2640`, «Nuevo · botón Cambiar»). 83:4: M-01, M-16 y M-17 con 34 rellenos a variables; M-07 (`85:78`, `85:84`, `198:229`, `233:25876`) con el ejemplo «Clima»; velo añadido a 62 confirmaciones (los 4 marcos de resultado `2150:65511`…`65973` quedan sin velo a propósito). Variable nueva `velo` (claro y Rosa: `tinta` 40 %; Enfoque y oscuro: negro 55 %) enlazada a 254 velos de 79:3, 79:5, 79:6 y 83:4 | Falta §12 «Escritorio y notificaciones»: comprobar widgets en claro (`204:22938`) y el crema (G-08). Marcar las casillas cumplidas. «Elige un tema» no existe en el Figma: va al «Aviso para la implementación» |
| 13 | Parcial (25-nov, noche) | Respuestas de Paula aplicadas: (b) Secundario del claro pasa a violeta #6604E6 (variable `200:4` modo `200:0`; texto `203:10626` actualizado; la tabla `234:147` ya decía #6604E6); (e) instalador según INT-13: «Abrir la aplicación al iniciar Windows», «Instalación completada.» + «Ya puedes eliminar el archivo del instalador que descargaste.» + «Abrir Windgets» (`84:1112`, `84:1120`), M-16 «Reinstalar», M-17 «Reparar» + «Cancelar»; marcos nuevos en 83:4 (x=0/1300, y=5100…5700): M-18 equipo no compatible, M-19 instalador dañado, M-20 falla (Reintentar/Cerrar), M-21 instalación cancelada; 83:3 «Opciones de instalación · Sin espacio» (`2264:134733`, `2264:134759`, y=3440). Decididas sin cambio: (a) crema solo donde está (G-08), (c) día completado con ✓ sin relleno, (d) 4 íconos aprobados, (f) todo el Figma se implementa («el Figma pasa a ser la aplicación a construir»): los textos sin definir se documentan como requisito | Sin hacer: revisión pantalla por pantalla de Rosa y Enfoque, pasada de «Lista final de revisión» y sección 15 de pendientes (Estado del Figma, E-nn tachados). Supuestos del instalador: títulos de M-18 a M-21, «320 MB» disponible y la ausencia de botones en M-18, M-19 y M-21 (solo la «×») no están en INT-13. Secundario violeta sin recapturar en los demás marcos |
| 14 | Hecho (25-nov, noche), con reordenado físico de Acceso | Creados `docs/rediseno_flujos_prototipos.md` (flujos, tablas paso–marco–acción–destino, limitaciones, descartados) y `docs/rediseno_flujos_ids_prototipos.md` (ids por familia y tema de las 9 páginas, extraídos de Figma). Ningún marco queda sin clasificar. Cambios en Figma: Descartado reconectado a vigentes; 10 propuestas de `0:1` y 6 nodos de `79:3` a «Descartado»; 20 marcos renombrados; M-04 conectado (8 marcos de «Cambios sin guardar»); M-08 desde «Eliminar tarjeta»; 84 reacciones obsoletas quitadas en `79:5`; botón de columna predefinida deshabilitado sin reacción | No se movieron coordenadas (el orden de lectura vive en el documento). Pendientes de enlace por límites de Figma o del contrato: saltos entre páginas, M-11/M-12/M-13 sin entrada por botón, «Sin espacio» sin entrada, «Instalación completada» sin salida (ver §11 del documento de flujos). Las conexiones se comprobaron página por página, no una por una contra el documento |
