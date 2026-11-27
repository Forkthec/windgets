# Rediseño · cambios a los prototipos (ronda del 24-nov-2026)

Documento de trabajo para que una IA aplique **solo estos cambios** en el Figma «Windgets»
(<https://www.figma.com/design/GdUKUwVHz3Wm0Dqw16UX8k/Windgets>, archivo `GdUKUwVHz3Wm0Dqw16UX8k`). Este documento es
autosuficiente: trae todo lo necesario para editar los prototipos, sin depender de otros documentos. Lo que no se
puede dibujar (movimiento, teclado, datos reales) no forma parte de este encargo.

> Fuente de verdad: desde el 24-nov-2026 es `GdUKUwVHz3Wm0Dqw16UX8k` (decisión de Paula). Se trabaja solo en ese
> archivo.

## Estado del Figma (revisión del 24-nov-2026, hora de Colombia)

Una primera pasada aplicó casi solo los colores y los marcos del tema oscuro. Revisé todas las páginas (00 a 08) en
claro y oscuro, contra cada punto: la tabla da el estado de cada PR y la sección «Errores por página» lista todo lo
que está mal hoy, con su marco. Hecho = cumple sus criterios; Parcial = empezado pero no cumple todos; Falta = sin
cambios.

| Punto | Estado | Qué se ve hoy |
|---|---|---|
| PR-01 Tema oscuro | Parcial | Existen los marcos «· Tema Windgets oscuro» y la tabla de 4 temas en Fundamentos (`200:16`). **Falta:** «Mis temas» (`203:6362` y copias) sigue mostrando «Windgets», no lista «Windgets oscuro» y tiene huecos entre filas; no existe «Personalización · Elegir Windgets oscuro»; «Tema en edición · Windgets» sin «claro». **Error nuevo:** en los marcos oscuros la barra lateral quedó crema (ej. `233:13970`) |
| PR-02 Esquina doblada | Falta | Notas `84:x` y `88:x` siguen siendo rectángulo con radio y pliegue suelto |
| PR-03 Ojos de Windi | Falta, con error nuevo | El botón flotante quedó como un cuadrado crema vacío, sin ojos (ej. `204:622`); la hoja «Windi · Botón flotante · Estados» (`236:142`) está casi vacía (fondo negro, un punto y textos sueltos); «Windi completo» del panel vacío existe pero está **oculto** (`237:142`) y «¿Qué organizamos hoy?» aparece dos veces (texto suelto y globo) |
| PR-04 Flecha y miga | Hecho | Flecha y miga separadas en las notas de Acceso (`84:22`) |
| PR-05 Amarillo de la nota | Parcial, excedido | El crema se aplicó a todo: barra lateral, filas de tarjetas, celdas del calendario, columnas del Kanban, campos del Detalle. Debe quedar **solo** en las cuatro superficies de G-08 |
| PR-06 Botón de Windi | Falta | Ver PR-03 |
| PR-07 Barra lateral | Falta | Siguen ≈ 80 px entre «Etiquetas» y «PERSONALIZACIÓN» |
| PR-08 Botones centrados e íconos | Falta | Textos pegados a la izquierda con espacio al final («+ Nueva tarjeta», «Aplicar», «Ver más reportes», «Editar»); no hay lupa, papelera ni íconos nuevos en Fundamentos |
| PR-09 Nombre emergente | Falta | No existe el componente ni marcos «· Nombre emergente»; los botones siguen con texto |
| PR-10 Columna fantasma | Falta | El «+» sigue arriba, pequeño y relleno |
| PR-11 Cabecera en una línea | Falta | Sigue la fila aparte de controles («Vista expandida», «Mes / Semana», «Últimos 30 días») |
| PR-12 Calendario con información | Parcial | Mes tiene cuadrícula, pero las celdas están vacías; Semana sin revisar a fondo |
| PR-13 Botones vs información | Falta | Botones y datos se distinguen solo por el lila `#EDE3FF`; los valores del Detalle de tarjeta parecen campos; sin bordes ni sombra de la jerarquía G-02 |
| PR-14 Cumplimiento por estado | Falta | Sigue el gráfico de rayas sueltas alrededor de «20» |
| PR-15 Vista expandida | Falta | Mismos datos repetidos en todas las tarjetas |
| PR-16 Datos de ejemplo | Falta | Siguen las mismas 3 a 7 tarjetas con «27 nov · Media» |
| PR-17 Contenedores | Hecho en parte | Paneles con fondo en Planificador, Reportes, Kanban y Calendario; corregir el color según G-08 |
| PR-18 Ventanas emergentes | Falta | Detalle, Nueva / Editar tarjeta, etiqueta, columna y Mover a siguen como pantalla completa con miga de pan |
| PR-19 Editar y eliminar | Falta | Etiquetas y Detalle siguen con botones de texto; Mis temas sigue con «×» |
| PR-20 Estilo de la landing en Windi | Falta | El panel conserva «Rechazar» / «Confirmar» sueltos y sin globos |
| PR-21 Regresar solo ícono | Parcial | Hecho en Acceso; falta en Personalización y en «← Reportes» |
| PR-22 Indicador de pasos | Falta | Siguen los cuatro rectángulos «1 Tema…» |
| PR-23 Vista previa más grande | Falta | Misma vista previa de 552 × 310 |
| PR-24 Barra expandida en Personalización | Falta | No existen marcos «· Barra expandida» |
| PR-25 Mensajes emergentes | Falta | Sin marcos con el mensaje en su posición; el botón de Windi choca con la barra inferior de Personalización |
| PR-26 Ícono del clima | Falta | No hay íconos de clima en Fundamentos ni en el widget |

## Errores por página (revisión completa del 24-nov-2026)

Cada error lleva su marco y el punto o regla que lo corrige. «E-nn» identifica el error para tacharlo en la tabla de
cierre. Si el error se repite en las copias del marco (oscuro, Rosa pastel, Enfoque rojo y negro), se corrige en
todas.

### Errores que se repiten en todas las páginas de la app

| Id | Error | Dónde | Corrección |
|---|---|---|---|
| E-01 | La barra lateral queda crema en los marcos oscuros | Todos los marcos «· Tema Windgets oscuro» de 02, 04 y 05 (ej. `233:13970`, `233:18961`, `233:24723`) | Fondo `marco` del tema oscuro (G-01); el crema nunca va en la barra (G-08) |
| E-02 | El crema se aplicó a todo: barra lateral, filas, celdas, columnas, campos, paneles de Personalización | Todas las pantallas de 02, 04 y 05 | Dejarlo solo en las cuatro superficies de G-08 |
| E-03 | El botón flotante de Windi es un cuadrado vacío, sin ojos; en Personalización choca con la barra inferior | Abajo a la derecha de todas las pantallas (ej. `204:622`, `203:6607`, `233:18961`) | Componente de PR-06 con los ojos de PR-03; separarlo 16 px de la barra inferior (PR-25). En «Mensajes recientes» (`220:22383`) sí tiene ojos: usar ese como base |
| E-04 | Textos de los botones pegados a la izquierda con espacio sobrante al final | Todos los botones de todas las páginas, incluidas 07 y Acceso («Enviar código» en `84:32`) | G-03 |
| E-05 | Controles de la pantalla en una fila aparte, debajo del título | «Mes / Semana», «Vista compacta», «+ Nueva etiqueta», «Últimos 30 días / Etiquetas / ← Reportes» | G-06 |
| E-06 | Botones de texto donde van íconos con nombre emergente | «Editar», «Eliminar», «×», «Configurar», «← Regresar», «← Reportes», «+» | G-04, G-05, PR-19, PR-21 |
| E-07 | Valores que parecen botones (fondo lila sin borde) | Detalle de tarjeta, filas de «Agregar widget · Clima» (`203:7133`), «Forma de los widgets», «Distribución predefinida» | G-02: los valores van sin fondo de botón |

### 00 · Fundamentos (`80:14`)

| Id | Error | Corrección |
|---|---|---|
| E-08 | El título «Colores de interfaz · claro y oscuro» queda pegado a los códigos de la paleta de marca, sin aire | Separación de 24 px entre grupos |
| E-09 | La muestra «Fondo» claro `#F7F4FB` no se distingue del fondo de la hoja | Borde de 1 px `linea` en todas las muestras |
| E-10 | Solo hay 6 íconos (Alerta, Reloj, Calendario, Agregar, Confirmar, Cerrar); faltan lupa, papelera, lápiz, regresar, opciones y los del clima | Agregar los de G-04 y PR-26 |
| E-11 | No están el amarillo de la nota ni los cuatro temas en esta hoja (solo en `200:16`) | Enlazar o repetir la tabla de G-01 |

### 01 · Acceso

| Id | Error | Corrección |
|---|---|---|
| E-12 | La esquina doblada sigue siendo un triángulo suelto sobre un rectángulo con radio, en claro y oscuro (ej. `84:32`) | PR-02 |

### 02 · Planificador

| Id | Error | Marco | Corrección |
|---|---|---|---|
| E-13 | Celdas del mes vacías | `204:805` | PR-12 con los datos de la sección 3 |
| E-14 | La semana solo muestra «09:00» el martes y el jueves, sin título de tarjeta; el resto vacío | `204:1249` | PR-12: cada tarjeta con hora y título |
| E-15 | Agenda: cada bloque dice «Bloque horario» sin más dato; la lista corta en 15:00; «Validar el contraste», «Revisar calendario» y «Caminar 30 minutos» aparecen a la vez con hora y en «Tarjetas sin horario» | `204:916` | Mostrar etiqueta y prioridad en lugar de «Bloque horario»; una tarjeta en una sola lista; datos de la sección 3 |
| E-16 | Agenda: los días «L 23 … D 29» tienen el texto a la izquierda | `204:916` | Texto centrado (G-03) |
| E-17 | Kanban expandida: la misma tarjeta está en varias columnas («Compartir el prototipo» en las tres; «Preparar la entrega» en dos) y todas dicen «27 nov · Media · Tarea · Proyecto · 09:00» | `204:1139` | PR-15 y PR-16 |
| E-18 | Kanban expandida: el «…» de opciones solo aparece en la primera tarjeta | `204:1139` | En todas, o en ninguna y solo al pasar el puntero (decidir una y aplicarla igual en compacta) |
| E-19 | Más reportes: las cifras no cuadran (Completadas 12, pero «Hecho» = 4 en «Tarjetas por columna»; columnas suman 12 contra 20 tarjetas) | `204:1581` | Usar las cifras calculadas en la sección 3 |
| E-20 | Más reportes: «Tiempo medio de completado» es una barra con un solo valor; «Próximos 7 días» dice «Martes, Miércoles, Jueves» sin fecha | `204:1581` | Mostrarlo como número grande («3 días»); días con fecha («mar 24 nov») |
| E-21 | Nueva tarjeta: pantalla completa con miga de pan y 80 px vacíos sobre el formulario; «Etiquetas» como texto «Proyecto · Universidad» | `204:1915` y demás subpantallas | PR-18; etiquetas como fichas con su color |
| E-22 | Etiquetas: «+ Nueva etiqueta» sola debajo del título; «Editar» y «Eliminar» de texto | `204:1078` | G-06, PR-19 |

### 03 · Agente de IA

| Id | Error | Marco | Corrección |
|---|---|---|---|
| E-23 | «¿Qué organizamos hoy?» aparece dos veces (texto suelto y en negrita al centro) | `204:2427` y copias | Dejar solo «Windi completo» con su globo (PR-20) |
| E-24 | «Windi completo» existe pero está oculto | `237:142`, `237:155`, `237:168`, `237:181` | Hacerlo visible |
| E-25 | La hoja «Windi · Botón flotante · Estados» está casi vacía (fondo negro, un punto, textos sueltos) | `236:142` | Rehacerla con los estados de PR-06 |
| E-26 | El panel superpuesto deja a la izquierda un gris plano, sin la app detrás; cerrar es un «×» lila; «Enviar» es texto | `204:25611` | Mostrar la pantalla de la app atenuada detrás; cerrar y enviar como íconos con nombre emergente (G-05) |

### 04 · Personalización

| Id | Error | Marco | Corrección |
|---|---|---|---|
| E-27 | «Mis temas» no lista «Windgets oscuro», llama «Windgets» al claro y deja huecos entre filas; el lápiz de «Rosa pastel» casi no se ve | `203:6362`, `233:18961` y copias | PR-01; filas seguidas con 8 px; íconos con contraste `texto` |
| E-28 | 4 Widgets: el interruptor tiene la perilla negra sobre cian y a su lado un «×» para quitar | `203:6607` | Interruptor del componente común; papelera con nombre emergente (G-04) |
| E-29 | Vista previa: el widget Calendario muestra una sola semana y el Kanban deja los números lejos de sus títulos | `203:6362` y todos los pasos | Mes completo en 5 filas; número centrado bajo su columna, a 4 px |
| E-30 | Agregar widget · Clima: el widget tapa el sol, no tiene ícono y «← Regresar» es de texto | `203:7133` | Moverlo a una zona libre, ícono de PR-26, PR-21 |

### 05 · Configuración

| Id | Error | Marco | Corrección |
|---|---|---|---|
| E-31 | «Inicio automático» no tiene interruptor | `204:3109`, `233:24723` | Interruptor a la derecha de la fila |
| E-32 | Barra lateral crema en oscuro; botones lila con el texto a la izquierda | `233:24723` | E-01, G-03 |

### 06 · Escritorio de Windows

| Id | Error | Marco | Corrección |
|---|---|---|---|
| E-33 | La barra de tareas de Windows quedó crema en claro | `204:22938` y copias | Volver al gris de Windows; no es superficie de Windgets |
| E-34 | Widget Calendario con una sola fila de semana | `204:22938`, `233:25409` | Mes completo (igual que E-29) |
| E-35 | Widget Kanban: los números quedan muy abajo de sus títulos | `204:22938` y copias | Igual que E-29 |
| E-36 | «Widget · Windi» no muestra el widget de Windi | `204:23306` | Dibujarlo según PR-20 |
| E-37 | Widget Clima sin ícono y encima del sol | `204:23084` | PR-26; moverlo a una zona libre |

### 07 · Web e instalación

| Id | Error | Marco | Corrección |
|---|---|---|---|
| E-38 | La web no tiene el símbolo del logo, solo la palabra | `84:1050` | Logo completo como en Acceso |
| E-39 | «Carpeta de instalación» no muestra la ruta ni un botón para cambiarla | `84:1068` | Ruta en texto `texto` y botón «Cambiar» con ícono de carpeta |
| E-40 | «Inicio automático» sin interruptor; textos de las filas pegados arriba | `84:1068` | Interruptor; textos centrados en vertical (G-06) |

### 08 · Confirmaciones

Sin errores propios (`85:90`, `233:25889`); solo aplican E-04 y G-03 en sus botones.

### Mensajes emergentes (`220:22383`)

| Id | Error | Corrección |
|---|---|---|
| E-41 | Los tres íconos no son del mismo juego: «×» rojo pequeño, «!» de texto y «✓» grande | Íconos de Fundamentos a 16 px, mismo grosor |
| E-42 | Están en una hoja aislada, sin la pantalla detrás | PR-25: marcos con el mensaje en su posición real |

## Instrucciones para el chat que aplica lo pendiente

1. Antes de editar: corregir los errores E-01 a E-03 y E-23 a E-25 (barra lateral crema en oscuro, crema en exceso,
   botón de Windi vacío, texto duplicado, «Windi completo» oculto, hoja `236:142`), luego E-27 («Mis temas»). Los
   demás E-nn se corrigen dentro del lote de su página.
2. Trabajar **por lotes**, en este orden, y en cada lote primero Windgets claro, revisarlo con una captura, y luego
   propagar a Windgets oscuro, Rosa pastel y Enfoque rojo y negro cambiando solo variables:
   1. Fundamentos: tokens (ya están), íconos nuevos de G-04 y PR-26, componente «Nombre emergente», botón de Windi
      con sus estados, jerarquía de botones G-02 como componentes con variantes.
   2. Acceso: PR-02.
   3. Reglas generales G-02, G-03, G-05, G-06, G-08 (quitar el crema donde sobra) y G-09 en todas las pantallas,
      reemplazando instancias por los componentes del lote 1.
   4. Planificador: PR-10, PR-12, PR-14, PR-15, PR-16, PR-18.
   5. Agente de IA y widget del escritorio: PR-03, PR-06, PR-20.
   6. Personalización: PR-01 («Mis temas»), PR-21 a PR-24.
   7. Configuración, Escritorio, Web e instalación: E-31 a E-40.
   8. Todas las páginas: PR-25, E-41, E-42 y la lista final de la sección 4.
3. Al terminar cada lote: actualizar la tabla de estado de arriba (Hecho / Parcial / Falta), tachar los E-nn
   corregidos y mostrar a Paula una
   captura de Windgets claro y una de Windgets oscuro por pantalla tocada.
4. Un punto se marca Hecho solo si cumple **todas** sus casillas; si no, queda Parcial con lo que falta.
5. Para gastar menos: nunca pedir los metadatos de una página entera (la de Personalización pesa 2,4 millones de
   caracteres); pedirlos por marco con su id de esta tabla. Capturas con tamaño máximo de 1024 px. Un chat por lote.

## Decisiones de Paula (24-nov-2026)

| # | Pregunta | Decisión |
|---|---|---|
| D-01 | Figma fuente de verdad | `GdUKUwVHz3Wm0Dqw16UX8k` |
| D-02 | Nombres de los temas | «Windgets claro», «Windgets oscuro», «Rosa pastel», «Enfoque rojo y negro», en ese orden |
| D-03 | Paleta de Windgets claro y oscuro | La de las pantallas de Acceso (`66:4` claro, `66:83` oscuro); «00 · Fundamentos» se corrige para coincidir |
| D-04 | Nombre emergente del «+» | La acción sin el signo: «Nueva tarjeta» |
| D-05 | Qué más se ve de Windi | Windi entero cuando el panel está vacío y ojos según el estado. **No** hay avatar en la cabecera del panel ni cara junto a los mensajes |
| D-06 | Botón flotante | Cabeza amarilla asomando, sin fondo |
| D-07 | Movimiento del botón | Solo al pasar el puntero (aparecen las ondas de saludo); quieto el resto del tiempo |
| D-08 | Estilo de la landing | Widget Windi del escritorio **y** panel de Windi de la app |
| D-09 | Tarjeta, etiqueta, columna y Mover a | Todas como ventana emergente |
| D-10 | Mensajes emergentes | Arriba a la derecha |
| D-11 | Cumplimiento por estado | Anillo con leyenda |
| D-12 | Pasos de Personalización | Indicador de pasos como el del Registro |
| D-13 | Textos nuevos | Los elige quien aplique estos cambios, con los criterios de la sección «Textos nuevos» de abajo, y quedan literales en el marco |
| D-14 | Etiqueta «Salud» en los datos de ejemplo | Sí |
| D-15 | Eliminar en el Detalle de tarjeta | Ícono de papelera con nombre emergente |
| D-16 | Ícono del clima | Cambia de día y de noche (sol y luna) |

### Textos nuevos (D-13)

Donde este documento marca un texto como *propuesto*, quien aplique los cambios puede dejarlo o elegir uno mejor con
estas reglas: español neutro, frase corta, la acción en infinitivo o sustantivo («Nueva columna», no «Haz clic
para…»), igual en las cuatro variantes de tema, sin repetir lo que ya dice el ícono o el título, y punto final solo
si es una oración. Al terminar, entregar a Paula la lista de textos elegidos con el marco donde aparece cada uno.

## Cómo usar este documento

1. Cada cambio tiene un id `PR-nn` que corresponde al número de la lista de Paula. Los cambios generales (`G-nn`) se
   aplican a **todas** las pantallas, de las ocho páginas y de los cuatro temas, antes que los puntuales.
2. **No se cambia nada más.** No se mueven pantallas, no se renombran textos ni se agregan funciones que no estén
   aquí. Si un cambio necesita un texto nuevo, el texto va literal entre «…» y está marcado como *propuesto*.
3. Se trabaja primero el tema «Windgets claro» en cada página; los demás temas se derivan de él cambiando solo los
   colores (G-01). Rosa pastel y Enfoque rojo y negro conservan sus colores; reciben los cambios de forma, espacio e
   íconos.
4. Un cambio está terminado cuando cumple **todos** sus criterios de aceptación (casillas).
5. Medidas en px del marco de 1093 × 560 salvo que se diga otra cosa. «Ritmo» = múltiplos de 4 px.

### Páginas y nodos de referencia

| Página | Id | Marcos de referencia |
|---|---|---|
| 00 · Fundamentos | `0:1` | `80:14` Fundamentos, `200:16` Colores del tema aplicado, `204:32251` Barra lateral, `217:17700` Mensajes emergentes |
| 01 · Acceso | `79:2` | `66:4`/`66:83` Inicio de sesión, `66:162`/`66:246` Registro, `84:2`…`84:72` y `88:2`/`88:3` notas centradas |
| 02 · Planificador | `79:3` | `204:622` Planificador diario, `204:704` Kanban, `204:805` Calendario, `204:1249` Semana, `204:916` Agenda, `204:1005` Reportes, `204:1581` Más reportes, `204:1078` Etiquetas, `204:1139` Kanban expandida, `204:1849`…`204:2239` subpantallas de tarjeta, etiqueta, columna y Mover a |
| 03 · Agente de IA | `79:4` | `204:2427`…`204:2876` panel de Windi |
| 04 · Personalización | `79:5` | `203:6362` 1 Tema, `203:6440` 2 Fondo, `203:6520` 3 Colores, `203:6607` 4 Widgets, `204:25071`… overlays |
| 05 · Configuración | `79:6` | `204:3109`, `204:3159`, `217:20340`, `217:20400`, `217:20460`; oscuro `233:24723` |
| 06 · Escritorio de Windows | `83:2` | `204:22938`…`204:23401` (`204:23084` Clima, `204:23306` Windi); oscuro `233:25409`…`233:25787` |
| 07 · Web e instalación | `83:3` | `84:1050` Web, `84:1059`, `84:1068` Instalación, `84:1080`, `84:1092`, `84:1102`, `84:1112`, `84:1120` |
| 08 · Confirmaciones | `83:4` | `85:2`…`85:206`; oscuro `233:25809`…`233:25980` |

---

## 1. Cambios generales (todas las pantallas)

### G-01 · Cuatro temas: Windgets claro, Windgets oscuro, Rosa pastel, Enfoque rojo y negro (PR-01, PR-05)

**Qué.** El tema «Windgets» se renombra «Windgets claro» y se agrega «Windgets oscuro». Ambos toman la paleta de las
pantallas de Acceso (`66:4` y `66:83`), para que entrar en modo Claro u Oscuro y seguir dentro de la app se vea igual.

Tokens (mismos nombres de `200:16`, más tres nuevos marcados con ★):

| Variable | Windgets claro | Windgets oscuro | Uso |
|---|---|---|---|
| principal | `#00D9E2` | `#00D9E2` | marca |
| secundario | `#6604E6` | `#D3B2FF` | enlace, opción elegida, paso actual |
| marco (fondo de la app) | `#F5F0FF` | `#201B2B` | fondo de la ventana |
| sobre_marco | `#17131D` | `#F8F5FF` | texto sobre el fondo |
| superficie | `#FFFFFF` | `#2B2534` | paneles, columnas, tarjetas |
| superficie_alta ★ nota | `#FFFBEA` | `#302D38` | ventanas emergentes, panel de Windi, panel destacado (G-08) |
| superficie_baja | `#EDE3FF` | `#433258` | hover, selección suave, paso actual |
| linea | `#D9D0E6` | `#5D566B` | separadores y bordes de contenedor |
| tinta | `#17131D` | `#F8F5FF` | títulos y texto fuerte |
| texto | `#554F5E` | `#CEC7D6` | texto secundario |
| accion | `#00D9E2` | `#00D9E2` | botón principal |
| sobre_accion | `#17131D` | `#17131D` | texto del botón principal |
| borde | `#241C30` | `#AFA1C0` | borde de botones y campos |
| sombra ★ | `#241C30` | `#100D15` | sombra sólida desplazada 3 px → y 5 px ↓ |
| error ★ | `#B3261E` | `#FF8A80` | error |

**Dónde.**
- `00 · Fundamentos > 200:16`: la columna «Windgets» pasa a «Windgets claro» con los valores de arriba y se agrega
  la columna «Windgets oscuro». Se agregan las filas ★.
- Cada página que hoy tiene tres juegos de marcos (`· Tema Windgets`, `· Tema Rosa pastel`, `· Tema Enfoque rojo y
  negro`) recibe un cuarto juego `· Tema Windgets oscuro`, duplicado del claro y recoloreado solo con variables. Los
  marcos `· Tema Windgets` se renombran `· Tema Windgets claro`.
- `04 · Personalización > Mis temas` (`203:6362` y sus copias): la lista muestra cuatro temas en este orden:
  Windgets claro, Windgets oscuro, Rosa pastel, Enfoque rojo y negro. La muestra de color de Windgets oscuro es
  `#201B2B` con la diagonal cian `#00D9E2`.
- `07 · Web e instalación`: «Elige un tema» muestra los cuatro temas.
- `01 · Acceso` no cambia de colores: su Claro y su Oscuro **son** Windgets claro y Windgets oscuro.

**Criterios de aceptación.**
- [ ] Ningún marco conserva el nombre `· Tema Windgets` sin «claro» u «oscuro».
- [ ] Toda pantalla con tema tiene sus cuatro variantes, con el mismo nodo hermano en la misma posición relativa.
- [ ] Ningún color está suelto: todo relleno, borde y texto usa una variable de la tabla.
- [ ] Contraste: tinta y texto sobre marco, superficie y superficie_alta ≥ 4,5:1; borde de controles ≥ 3:1.
- [ ] Una pantalla del planificador en Windgets claro, puesta junto a Inicio de sesión Claro (`66:4`), comparte fondo,
  tinta, enlace y nota; lo mismo en oscuro con `66:83`.

### G-02 · Jerarquía de botones y de información (PR-13)

**Qué.** Hoy botones, chips de información y filas de lista comparten el mismo relleno gris `#ECECEC` y no se
distinguen. Se define una jerarquía única para los cuatro temas:

| Nivel | Aspecto | Cuándo |
|---|---|---|
| Principal | relleno `accion`, texto `sobre_accion` 500, borde 1,5 px `borde`, radio 9, sombra sólida `sombra` desplazada 3 px → y 5 px ↓ (como «Iniciar sesión», `66:36`) | una por pantalla o ventana: Guardar, Aplicar, Crear, Enviar, Confirmar, Verificar |
| Secundario | relleno `superficie`, texto `tinta` 500, borde 1,5 px `borde`, radio 9, sin sombra (como «Continuar con Google», `66:41`) | Cancelar cambios, Ver más reportes, Vista expandida, Organizar widgets |
| Ícono | sin relleno ni borde, ícono 20 px `tinta`; hover: relleno `superficie_baja`, radio 9 | acciones por fila y de cabecera (G-04) |
| Destructivo | como secundario con texto y borde `error` | Eliminar dentro de una ventana emergente |
| Selector segmentado | contenedor con borde 1,5 px `borde`, radio 9; opción elegida con relleno `secundario` y texto blanco (claro) o `#17131D` (oscuro), como «Apariencia» (`66:4`) | Mes / Semana, Compacta / Cómoda, Claro / Oscuro |
| Dato (no es botón) | solo texto: etiqueta 13 px `texto`, valor 15 px `tinta`; sin relleno ni borde | valores de Detalle de tarjeta, «Sincronizado», «Aplicado», contadores |
| Fila de lista | contenedor `superficie` con borde 1 px `linea`, radio 9; las acciones de la fila son botones Ícono a la derecha; seleccionada: borde 2 px `secundario` y relleno `superficie_baja` | Mis temas, Widgets del tema, Etiquetas, Catálogo de imágenes |
| Campo editable | relleno `superficie`, borde 1,5 px `#766B81` (claro) / `#948B9E` (oscuro), radio 9 (como los campos de `66:4`) | todo lo que se escribe o se elige |

**Dónde.** Todas las pantallas de las páginas 02, 03, 04, 05 y 08. Ejemplos que hoy fallan: «Vista expandida»
(`204:704`), «Últimos 30 días» y «Etiquetas» (`204:1005`), «Noviembre 2026» (`204:805`), filas de «Mis temas» y de
«Widgets del tema» (`203:6362`, `203:6607`), «Oscurecer 0 %» y «Desenfocar 0 %» (`203:6440`), valores del Detalle de
tarjeta (`204:1849`).

**Criterios de aceptación.**
- [ ] Ningún elemento usa el relleno gris `#ECECEC` como botón.
- [ ] Cada pantalla y cada ventana emergente tiene como máximo **un** botón Principal.
- [ ] Un valor que no se puede tocar nunca tiene borde ni relleno de botón.
- [ ] «Oscurecer» y «Desenfocar» se muestran como deslizadores (control real) con su valor a la derecha.
- [ ] Una fila que contiene acciones no parece un botón: es Fila de lista y sus acciones son botones Ícono.

### G-03 · Botones ajustados a su contenido y centrados (PR-08)

**Qué.** Hoy el texto queda pegado a la izquierda y sobra espacio al final del botón («Aplicar», «+ Nueva tarjeta»,
«Ver más reportes», «Editar»).

- Auto layout horizontal, alineación **centro-centro**, ancho «Hug contents».
- Alto 36 px (32 px en la densidad compacta y en filas), relleno lateral 16 px, separación ícono–texto 8 px.
- Botón Ícono: cuadrado 36 × 36 (32 × 32 en filas), ícono 20 px centrado.
- Excepción: los botones «a lo ancho» de las notas de Acceso conservan su ancho fijo con el texto centrado.

**Criterios de aceptación.**
- [ ] En todo botón, la distancia del borde izquierdo al contenido es igual a la del borde derecho (±1 px).
- [ ] En todo botón, el contenido está centrado verticalmente (±1 px).
- [ ] Ningún botón tiene ancho fijo salvo la excepción de Acceso.

### G-04 · Íconos y textos coherentes en los botones (PR-08, PR-09, PR-19, PR-21)

**Regla única** (todas las pantallas):

| Tipo de acción | Se muestra | Nombre al pasar el puntero |
|---|---|---|
| Acción principal o secundaria de la pantalla o ventana | ícono opcional + texto | — |
| Crear desde la cabecera o una columna («+ Nueva tarjeta», «+ Nueva etiqueta», «+ Agregar widget», «+» de columna) | solo ícono «+» | sí (G-05) |
| Acciones por elemento (editar, eliminar, configurar, mover, más opciones) | solo ícono | sí |
| Regresar | solo ícono «←» | «Regresar» o el nombre del destino |
| Cerrar | solo ícono «×» | «Cerrar» |

Íconos (mismo estilo de línea que `00 · Fundamentos > Iconos`, 20 px, color `tinta`). Se agregan a Fundamentos los que
faltan: Editar (lápiz), Eliminar (papelera), Buscar (lupa), Filtrar (embudo), Expandir / Compactar, Más opciones
(«⋯»), Configurar (engranaje), Mover (flechas), Regresar («←»), Sincronizado (nube con ✓), Organizar (cuadrícula),
Reportes (barras) y los de clima (PR-26).

- **Eliminar es papelera** en todas partes. «×» queda solo para cerrar o quitar un elemento de una selección (por
  ejemplo, quitar una etiqueta de una tarjeta). Hoy Personalización usa «×» para eliminar un tema o un widget: se
  cambia a papelera.
- **Editar es lápiz** en todas partes: Etiquetas (`204:1078`, hoy botones «Editar» / «Eliminar»), Kanban (menú de
  columna y tarjeta), Mis temas (ya lo usa).
- **Buscar:** todo campo que filtra o busca lleva la lupa a la izquierda dentro del campo: ciudad del widget Clima,
  Filtrar etiquetas (`204:1766`), Catálogo de imágenes, Mover a, y el campo «Etiquetas» de Nueva / Editar tarjeta.
- Selectores con fecha llevan el ícono de calendario a la izquierda: «Noviembre 2026», «Martes, 24 de noviembre»,
  «Últimos 30 días».
- «Sincronizado» lleva el ícono de nube con ✓ a la izquierda.

**Criterios de aceptación.**
- [ ] No hay en ninguna pantalla un botón con las palabras «Editar», «Eliminar» o «Regresar» como texto, salvo dentro
  de una ventana de confirmación (página 08).
- [ ] «← Reportes» de Más reportes (`204:1581`) y el regreso de Personalización son solo «←».
- [ ] Todos los íconos usados existen en `00 · Fundamentos > Iconos`.

### G-05 · Nombre al pasar el puntero (PR-09)

**Qué.** Todo botón de solo ícono muestra su nombre al pasar el puntero. Ejemplo: el botón «+» del Planificador
diario muestra «Nueva tarjeta».

- Componente nuevo en Fundamentos: «Nombre emergente». Relleno `tinta`, texto `marco` 13 px 500, radio 6, relleno
  6 × 10 px, flecha de 6 px hacia el botón, 8 px de separación. Aparece debajo del botón; si no cabe, arriba.
- Texto: el nombre de la acción tal como está hoy en el botón, sin el «+» (*propuesto*: «Nueva tarjeta», «Nueva
  etiqueta», «Nueva columna», «Agregar widget», «Editar», «Eliminar», «Configurar», «Más opciones», «Regresar»,
  «Cerrar»). Si Paula prefiere conservar el «+» en el texto, solo cambia esta lista.
- **Alcance: todos los botones, no solo «+ Nueva tarjeta»** (ese era un ejemplo). Todo botón que según G-04 queda
  como solo ícono lleva nombre emergente, en todas las páginas y temas. Inventario mínimo (quien aplique los cambios recorre
  además cada marco y agrega lo que falte):

| Pantalla (nodo) | Botón hoy | Queda | Nombre emergente |
|---|---|---|---|
| Planificador diario (`204:622`) | «+ Nueva tarjeta» | «+» | «Nueva tarjeta» |
| Kanban y Expandida (`204:704`, `204:1139`) | «+» de columna, «⋯» de columna y de tarjeta, «+» de agregar columna | íconos | «Nueva tarjeta», «Opciones de la columna», «Opciones de la tarjeta», «Nueva columna» |
| Kanban (`204:704`, `204:1139`) | «Vista expandida» / «Vista compacta» | ícono Expandir / Compactar | «Vista expandida» / «Vista compacta» |
| Calendario y Semana (`204:805`, `204:1249`) | flechas de mes o semana, si existen | íconos | «Mes anterior», «Mes siguiente» (o «Semana…») |
| Reportes (`204:1005`) | «Ver más reportes» | ícono Reportes | «Ver más reportes» |
| Más reportes (`204:1581`) | «← Reportes» | «←» | «Regresar a Reportes» |
| Etiquetas (`204:1078`) | «+ Nueva etiqueta», «Editar», «Eliminar» | «+», lápiz, papelera | «Nueva etiqueta», «Editar», «Eliminar» |
| Detalle de tarjeta (`204:1849`) | «Eliminar» | papelera | «Eliminar» |
| Notas de Acceso (`84:x`, `88:x`) | «Regresar» | «←» | «Regresar» |
| Personalización · Mis temas (`203:6362`) | lápiz, «×» | lápiz, papelera | «Renombrar», «Eliminar» |
| Personalización · 4 Widgets (`203:6607`) | «+ Agregar widget», «Configurar», «×» | «+», engranaje, papelera | «Agregar widget», «Configurar», «Eliminar» |
| Personalización · 4 Widgets (`203:6607`) | «Organizar widgets» | ícono Organizar | «Organizar widgets» |
| Personalización · subpantallas (PR-21) | «Regresar» | «←» | «Regresar» |
| Barra lateral contraída (Personalización) | íconos de cada sección y «>» | sin cambio | nombre de la sección («Planificador diario», «Tablero Kanban»…, «Expandir menú») |
| Barra lateral expandida | «<» | sin cambio | «Contraer menú» |
| Panel de Windi (`204:2427`) | «×», «Enviar» | «×», ícono Enviar | «Cerrar», «Enviar» |
| Ventanas emergentes (PR-18) | «×» | sin cambio | «Cerrar» |
| Botón flotante de Windi | — | cabeza de Windi | «Windi» |

  Se quedan con texto: acciones Principal y Secundario de pantalla o ventana (Aplicar, Guardar, Cancelar cambios,
  Guardar como tema, Editar del Detalle, Confirmar, Rechazar, Cerrar sesión), selectores segmentados (Mes / Semana,
  Compacta / Cómoda) y selectores con valor («Últimos 30 días», «Etiquetas», «Noviembre 2026»).
- Cada página agrega **un marco de estado «· Nombre emergente»** por pantalla que tiene botones de solo ícono (como
  ya existen «· Arrastre», «· Vacío»), con el puntero sobre el botón de crear.

**Criterios de aceptación.**
- [ ] Existe el componente en Fundamentos con sus cuatro temas.
- [ ] Todo botón del inventario (y cualquier otro de solo ícono encontrado al recorrer los marcos) tiene nombre
  emergente; no queda ningún botón de solo ícono sin nombre.
- [ ] Planificador diario, Kanban, Etiquetas, Reportes, Personalización > 4 Widgets, panel de Windi y barra lateral
  contraída tienen su marco «· Nombre emergente».
- [ ] El nombre emergente nunca tapa otro botón de la misma fila.

### G-06 · Cabecera de pantalla en una sola línea (PR-11)

**Qué.** Hoy cada pantalla gasta tres franjas antes del contenido: miga de pan, título y una fila de botones
(«Vista expandida», «+ Nueva etiqueta», «Mes / Semana»…). Todo cabe en dos:

- Fila 1 (alto 24): miga de pan a la izquierda, «Sincronizado» a la derecha, ambos centrados verticalmente.
- Fila 2 (alto 44): título de la pantalla a la izquierda y, en la misma línea, a la derecha, los controles de la
  pantalla (selectores, botón Secundario y botones Ícono de crear), centrados verticalmente con el título.
- El contenido empieza 16 px debajo de la fila 2.

Medidas objetivo: el contenido empieza en y = 104 (hoy y ≈ 125–135). En Personalización, el indicador de pasos
(PR-22) va en la fila 2.

**Criterios de aceptación.**
- [ ] En Kanban, Calendario, Agenda, Reportes, Más reportes, Etiquetas y Personalización no existe una fila que
  solo contenga controles.
- [ ] Título y controles comparten eje vertical (±1 px).
- [ ] Todos los textos de una fila están centrados verticalmente entre sí: en la Agenda, hora, título y «Bloque
  horario» quedan alineados por la izquierda y la hora centrada con el título; en Más reportes, etiqueta, barra y
  número comparten eje.

### G-07 · Contenedores en lugar de paneles sueltos (PR-17)

**Respuesta a la pregunta.** Sí hacen falta, pero no como líneas sueltas:

- **Calendario (Mes y Semana): sí, cuadrícula.** Líneas de 1 px `linea` entre días y semanas; sin ellas no se lee a qué
  día pertenece cada tarjeta (PR-12).
- **Paneles laterales** («Próximas a vencer», mini calendario, «Tarjetas sin horario», «Cumplimiento», cada gráfico de
  Reportes y Más reportes, «Mis temas», «Widgets del tema»): **contenedor**, no línea. Relleno `superficie`, borde 1 px
  `linea`, radio 12, relleno interno 16, sin sombra. Título del panel dentro del contenedor.
- **Kanban:** cada columna es contenedor `superficie` con radio 12; las tarjetas dentro van en `superficie_alta` (claro)
  o `superficie_baja` (oscuro) con borde 1 px `linea`.
- La pantalla misma va sobre `marco`, así se distinguen los paneles del fondo.

**Criterios de aceptación.**
- [ ] En ninguna pantalla hay dos bloques de información distintos sin contenedor ni separación visible.
- [ ] Calendario Mes y Semana tienen cuadrícula.

### G-08 · El amarillo de la nota dentro de la app (PR-05)

**Qué.** `superficie_alta` (crema `#FFFBEA` en claro, `#302D38` en oscuro) se usa en estos lugares, y solo en ellos:

1. Ventanas emergentes (PR-18) y confirmaciones de la página 08: con la esquina doblada de la nota (silueta `68:4`).
2. Panel de Windi (página 03 y overlays): fondo del panel.
3. Panel «Próximas a vencer» del Planificador diario: es el único panel destacado de esa pantalla.
4. Tarjetas del Kanban en el tema claro.

En Rosa pastel y Enfoque rojo y negro, `superficie_alta` conserva su valor actual (`#FBEFF3` y `#1E1D22`).

**Criterios de aceptación.**
- [ ] El crema aparece en las cuatro superficies listadas y en ninguna otra.
- [ ] Las ventanas emergentes con nota llevan la esquina doblada con borde que sigue el corte (PR-02).

### G-09 · Barra lateral contraída y expandida (PR-07, PR-24)

- Separación entre el último ítem de un grupo y la etiqueta del grupo siguiente: **24 px** (hoy ≈ 80 px entre
  «Etiquetas» y «PERSONALIZACIÓN»). Configuración y Cerrar sesión siguen anclados abajo.
- Se aplica a la barra expandida (`204:35588` y copias) y a la contraída (Personalización).

**Criterios de aceptación.**
- [ ] Entre «Etiquetas» y «PERSONALIZACIÓN» hay 24 px, igual que entre el logo y «PLANIFICADOR» (±2 px).

---

## 2. Cambios puntuales

### PR-01 · Tema oscuro y coherencia con el acceso

Cubierto por G-01. Además:
- [ ] `00 · Fundamentos` agrega una nota «Claro en Acceso = Windgets claro; Oscuro en Acceso = Windgets oscuro».
- [ ] `08 · Confirmaciones` tiene sus marcos en Windgets oscuro.

### PR-02 · Esquina doblada en las notas centradas de Acceso

**Pantallas.** Verificar correo (`84:2`, `84:12`), Recuperar contraseña (`84:22`, `84:32`), Diligenciar código
(`84:42`, `84:52`), Nueva contraseña (`84:62`, `84:72`), Recuperar contraseña · Sin conexión (`88:2`, `88:3`).

**Defecto.** La nota es un rectángulo con radio en las cuatro esquinas («Nota de acceso», `88:12`) y el pliegue es un
cuadro aparte de 22 px (`88:13`); la sombra («Sombra con silueta plegada», `204:29941`) mide solo 22 × 22. El borde
no sigue el corte de la esquina.

**Cambio.** Usar la misma construcción que Inicio de sesión (`66:27`): «Silueta de la nota» (`68:4`) como forma con
borde 1,5 px `borde`, «Pliegue triangular» (`68:6`) en la esquina, y «Sombra con silueta plegada» (`204:29933`) con la
misma silueta, escaladas al tamaño de la nota centrada (404 × 299 en el marco).

**Criterios de aceptación.**
- [ ] El borde baja en diagonal por el corte; no hay radio en la esquina superior derecha.
- [ ] La sombra tiene la misma silueta que la nota, desplazada 3 px → y 5 px ↓.
- [ ] El pliegue mide lo mismo en proporción que en `66:27` (26 px sobre una nota de 377).
- [ ] Igual en claro y oscuro.

### PR-03 · Los ojos de Windi dentro de la app

**Defecto.** En Acceso Windi tiene dos ojos ovalados oscuros y una sonrisa («Group» `66:20` y «Vector» `66:23`). El
botón flotante de la app («Nav · Windi», 40 × 40, por ejemplo `203:6437`) muestra dos barras cian verticales: no es el
mismo personaje.

**Cambio.** Copiar los ojos y la sonrisa de `66:20` y `66:23` tal cual (forma, proporción y color `#17131D`) en todo
lugar donde Windi aparezca dentro de la app. Lo que se muestra del personaje está en PR-06.

**Qué más se muestra sin invadir** (D-05, D-06):

| Lugar | Qué se ve | Tamaño |
|---|---|---|
| Botón flotante | cabeza amarilla asomando con ojos y sonrisa (PR-06) | 48 × 48 |
| Panel vacío (sin mensajes) | Windi entero como en Acceso, con el globo «¿Qué organizamos hoy?»; desaparece con el primer mensaje | 120 de alto |
| Botón flotante y Windi del panel vacío, estado «Escribiendo…» | ojos mirando a un lado (óvalos desplazados 2 px) | — |
| Botón flotante y Windi del panel vacío, estados «Sin conexión» y «Error» | ojos cerrados (dos arcos cortos), boca recta | — |

No se agrega avatar en la cabecera del panel ni cara junto a los mensajes.

**Criterios de aceptación.**
- [ ] Ninguna pantalla usa las dos barras cian.
- [ ] Los ojos son copia (instancia o vector idéntico) de `66:20`, no un dibujo nuevo.
- [ ] Windi nunca tapa contenido ni botones (ver PR-25).

### PR-04 · Flecha de regresar encima de la miga de pan

**Defecto.** En las notas centradas de Acceso (mismas pantallas de PR-02) la flecha «Regresar» (`88:24`, x = 12,7,
y = 9,9, 24 × 23) se monta sobre la miga de pan (`88:16`, x = 25,5, y = 20,5): se lee «cio de sesión».

**Cambio.** La flecha es un botón Ícono de 32 × 32 (G-03), alineado con el margen izquierdo del contenido (x = 25,5) y
centrado verticalmente con la miga; la miga empieza 8 px a la derecha del botón. Nombre emergente «Regresar».
Si alguna de esas notas conserva un «Regresar» de texto junto al botón principal, se quita (D-19): el regreso es solo
la flecha.

**Criterios de aceptación.**
- [ ] La miga se lee completa («Inicio de sesión / Recuperar contraseña», «Registro / Verificar correo»).
- [ ] Flecha y miga comparten eje vertical (±1 px) y no se tocan.
- [ ] Se revisan también todas las pantallas con «←» de las páginas 02, 04 y 05: ninguna se monta sobre texto.

### PR-05 · El amarillo de la nota en Windgets claro y su par en oscuro

Cubierto por G-01 (tokens) y G-08 (lugares).

### PR-06 · Botón flotante relacionado con Windi

**Cambio** (en todas las pantallas con «Nav · Windi»):
- 48 × 48, abajo a la derecha, 16 px del borde.
- La cabeza amarilla de Windi (parte superior de su cuerpo amarillo, recortada) asoma desde abajo, con los ojos y la
  sonrisa de PR-03 y el contorno 1,5 px `borde`. Sin fondo circular.
- Estado hover: aparecen las dos ondas violeta de saludo del Acceso (`66:24`) junto a la cabeza y el nombre emergente
  «Windi».
- Estado «con propuesta» (Windi espera respuesta): un punto violeta `#6604E6` de 8 px arriba a la derecha.
- Se agregan a Fundamentos los tres estados: normal, hover, con propuesta, en los cuatro temas.

**Criterios de aceptación.**
- [ ] Mide 48 × 48 y ocupa la misma esquina en todas las pantallas.
- [ ] Estados en Fundamentos: normal, hover (con ondas), con propuesta, escribiendo y sin conexión/error (PR-03).
- [ ] No hay animación dibujada en los prototipos, solo estados. El único movimiento previsto es al pasar el puntero
  (D-07): las ondas aparecen; el prototipo lo muestra con el estado hover.

### PR-07 · Sección de Personalización más arriba en la barra lateral

Cubierto por G-09.

### PR-08 · Botones centrados e íconos que faltan

Cubierto por G-03 y G-04.

### PR-09 · Nombre de los botones al pasar el puntero

Cubierto por G-04 y G-05.

### PR-10 · Botón para agregar columna en el Kanban

**Pantallas.** `204:704`, `204:1139`, `217:12764`, `217:12977`, `217:13190`, `220:22023` y sus copias por tema.

**Cambio.** El «+» suelto a la derecha (hoy 38 × 30, arriba) se reemplaza por una **columna fantasma**:
- Mismo alto que la columna más alta del tablero y su borde superior alineado con el de las columnas.
- Ancho 56 px, relleno transparente, borde 1,5 px **discontinuo** (trazo 6, espacio 4) gris claro: `#C9C2D3` en claro,
  `#5D566B` en oscuro (en Rosa pastel `#E7C3D2`, en Enfoque rojo y negro `#4A4950`), radio 12.
- Ícono «+» 20 px `texto` centrado en horizontal y en vertical dentro de la columna.
- Hover: borde `secundario`, ícono `secundario` y nombre emergente «Nueva columna».
- En «Tablero vacío» la columna fantasma ocupa el ancho de una columna normal y muestra «+» y debajo «Nueva columna».

**Criterios de aceptación.**
- [ ] El centro del «+» está a la mitad del alto de las columnas (±2 px).
- [ ] La columna fantasma está a la misma separación de la última columna que hay entre columnas.

### PR-11 · Espacio entre el título y el contenido

Cubierto por G-06.

### PR-12 · Calendario con información (Mes y Semana)

**Pantallas.** `204:805` (Mes), `204:1249` (Semana), `204:1442` (Mes y año) y copias por tema. Usan los datos de
ejemplo de la sección 3.

**Mes.**
- Cuadrícula de 7 × 5 o 6 con líneas `linea` (G-07). Celda: número del día arriba a la izquierda (13 px 500).
- Hasta **3 tarjetas** por celda, cada una en una línea de 20 px: barra de 3 px con el color de su primera etiqueta,
  hora si tiene bloque horario y título truncado con «…». Completadas: título en `texto` y tachado.
- Si hay más, una cuarta línea «+N más» en `secundario` (*propuesto*; al tocarla abre Panel del día, `204:1316`).
- Hoy (24): número dentro de un círculo `accion`. Días de otro mes: número en `texto` al 50 %.
- Día con tarjeta vencida: punto `error` de 6 px junto al número.

**Semana.**
- Columnas por día con encabezado «Lun 23 … Dom 29» y la hoy resaltada.
- Franja superior «Todo el día» para las tarjetas sin bloque horario.
- Eje de horas 07:00–20:00 a la izquierda, una fila por hora con línea `linea`.
- Cada tarjeta con bloque horario es un bloque de una hora: relleno con el color de su primera etiqueta al 20 %, barra
  izquierda de 3 px con el color pleno, título 13 px y hora 11 px.

**Criterios de aceptación.**
- [ ] Mes muestra todas las tarjetas de ejemplo de noviembre y al menos un día con «+N más» (24 de noviembre).
- [ ] Semana muestra todos los días del 23 al 29 con tarjetas y la franja «Todo el día».
- [ ] Mismos datos que Planificador diario, Agenda y Kanban (sección 3).

### PR-13 · Distinguir botones de información

Cubierto por G-02.

### PR-14 · «Cumplimiento por estado» no se entiende

**Pantalla.** `204:1005` y copias; estados `217:16271`… (Vacío, Cargando, Error, Sin conexión).

**Defecto.** El gráfico son cuatro grupos de rayas sueltos alrededor de «20»; no se reconoce como anillo ni se sabe
qué es 20.

**Cambio.**
- Anillo continuo de 120 px (grosor 16) con tres segmentos proporcionales: Completadas `#2E8B57`, Pendientes
  `#DCBA04`, Vencidas `error`. Orden horario desde las 12: Completadas, Pendientes, Vencidas.
- Centro: el total en 26 px 700 y debajo «tarjetas» 13 px `texto`.
- Leyenda a la derecha, una fila por estado: punto, nombre, número y porcentaje («Completadas · 12 · 60 %»).
- Subtítulo bajo el título del panel (*propuesto*): «Tarjetas con fecha límite en el periodo elegido.».
- Panel con contenedor (G-07).

**Criterios de aceptación.**
- [ ] Los segmentos suman 360° y cada uno es proporcional a su número.
- [ ] Los números coinciden con los datos de ejemplo (12, 6, 2 → total 20).
- [ ] Los colores tienen ≥ 3:1 contra `superficie`.

### PR-15 · Más información real en la vista expandida del Kanban

**Pantalla.** `204:1139` y copias.

**Cambio.** La vista compacta (`204:704`) muestra etiquetas, título, fecha límite y prioridad. La expandida agrega
**solo campos que existen en la tarjeta** (tipo, título, descripción, prioridad, fecha límite, etiquetas, bloque horario y fecha de completado): tipo, bloque horario, descripción y estado de la fecha:
- Línea 1: etiquetas como chips con nombre (no solo la barra de color), máximo 3 y «+N».
- Línea 2: título (15 px 500, hasta 2 líneas).
- Línea 3: descripción, 2 líneas como máximo, 13 px `texto`, truncada con «…». Si no tiene, no se muestra la línea.
- Línea 4 (datos con ícono): tipo (Tarea / Recordatorio / Evento), fecha límite con estado («Vence hoy», «Vencida»
  en `error`, o la fecha), prioridad (Alta / Media / Baja) y bloque horario si lo tiene.
- En la columna Hecho: «Completada el 24 nov» en lugar de la fecha límite.
- Todas las tarjetas tienen datos distintos (sección 3); hoy todas dicen «27 nov · Media · Tarea · Proyecto · 09:00».

**Criterios de aceptación.**
- [ ] No aparece ningún dato que no esté en el modelo de la tarjeta.
- [ ] Hay al menos una tarjeta vencida, una sin bloque horario, una sin descripción y una con dos etiquetas.

### PR-16 · Más tareas de ejemplo en todos los prototipos

Todas las pantallas del planificador, del escritorio (06) y de las vistas previas de Personalización usan el conjunto
de la **sección 3**, en todos los días de la semana del 23 al 29 de noviembre de 2026.

**Criterios de aceptación.**
- [ ] Ninguna pantalla «con datos» tiene más de la mitad de su área de contenido vacía.
- [ ] Los números de Reportes, Más reportes, Kanban, Planificador diario y Agenda salen del mismo conjunto y coinciden.
- [ ] Los estados «Vacío» siguen vacíos (no se les agregan datos).

### PR-17 · Líneas de separación y paneles sin fondo

Cubierto por G-07.

### PR-18 · Tarjeta, etiqueta, columna y Mover a como ventanas emergentes

**Respuesta.** Sí. Son formularios cortos o una consulta que no necesita perder de vista la pantalla de origen; como
pantallas completas dejan mucho espacio vacío (`204:1849` usa 1093 × 560 para ocho datos).

**Cambio.** Las ocho subpantallas pasan a ventana emergente sobre la pantalla de donde se abren:

| Subpantalla (nodo) | Se abre desde | Ancho |
|---|---|---|
| Detalle de tarjeta (`204:1849`) | Planificador diario, Kanban, Calendario, Agenda | 560 |
| Nueva tarjeta (`204:1915`) | «+» del Planificador diario, del Kanban y de la columna | 560 |
| Editar tarjeta (`204:1981`) | lápiz del Detalle o menú de la tarjeta | 560 |
| Nueva etiqueta (`204:2047`), Editar etiqueta (`204:2095`) | Etiquetas | 420 |
| Nueva columna (`204:2143`), Editar columna (`204:2191`) | Kanban | 420 |
| Mover a (`204:2239`) | menú de la tarjeta en el Kanban | 420 |

- Velo sobre la pantalla: `tinta` al 40 % (claro) o `#000000` al 55 % (oscuro).
- Ventana: nota `superficie_alta` con esquina doblada y sombra sólida (G-08, PR-02), radio 9 en las otras esquinas,
  relleno 24, alto según contenido (máximo 90 % del marco, con desplazamiento interno).
- Cabecera: título de la ventana a la izquierda y «×» a la derecha (Cerrar). Sin miga de pan.
- Pie: acciones a la derecha. Detalle de tarjeta: Eliminar (Ícono papelera, a la izquierda del pie) y «Editar»
  (Principal). Formularios: «Cancelar» (Secundario) y «Guardar» o «Crear» (Principal).
- Detalle de tarjeta en dos columnas de datos (G-02, «Dato»), como hoy.
- Se conserva un marco por ventana y por tema, con la pantalla de origen debajo del velo.

**Criterios de aceptación.**
- [ ] Las ocho ventanas existen en los cuatro temas con su pantalla de origen visible debajo.
- [ ] Ninguna ventana tiene miga de pan ni barra lateral propia.
- [ ] Un solo botón Principal por ventana.

### PR-19 · Íconos de editar y eliminar en todas las pantallas

Cubierto por G-04 (lápiz y papelera en Etiquetas, Kanban, Mis temas, Widgets del tema, Detalle de tarjeta).

### PR-20 · Widget de Windi con el estilo de la landing

**Referencia.** El widget «Agente de IA» de <https://windgets.vercel.app/> (no se toman Planificador ni
Personalización de esa página).

**Pantallas.** Widget Windi en `06 · Escritorio de Windows`, en las vistas previas de Personalización (Agregar widget ›
Windi `203:7735`, Configurar widget › Windi `203:8734`, Widgets · Windi agregado `203:9862`) y el panel de Windi
(`204:2427`… y overlays `204:25151`…, `204:25611`…), para que se vean iguales.

**Cambio.**
- Contenedor: relleno `superficie`, borde 1,5 px `borde`, radio 12, sombra sólida `sombra` 1 px → 3 px ↓, relleno 16.
- Título «Windi» 17 px 700, sin avatar (D-05).
- Mensajes de Windi: alineados a la izquierda, globo sin relleno, borde 1 px `borde`, radio 10, relleno 9 × 12,
  texto 13 px. Sin cara ni avatar al lado (la «W» de la landing no se copia).
- Mensajes de la persona: alineados a la derecha, globo con relleno cian claro (`#BFF5F8` en claro; `#0E4A4D` en
  oscuro), borde 1 px `borde`, radio 10.
- Propuesta: dentro del globo de Windi, debajo del texto, «Confirmar» (Principal pequeño: alto 28, radio 8, sombra
  sólida) y «Rechazar» (Secundario pequeño: transparente con borde).
- Campo de mensaje: campo editable (G-02) con el contador «0 / 2000» debajo a la derecha y «Enviar» como botón
  Principal o Ícono de enviar con nombre emergente «Enviar».
- El panel conserva sus estados (Escribiendo, Sin conexión, Error, Propuesta descartada) con este estilo.

**Criterios de aceptación.**
- [ ] Widget y panel usan los mismos componentes de mensaje y propuesta.
- [ ] Los mensajes de la persona y de Windi se distinguen por lado y color sin leer el texto.

### PR-21 · Regresar solo con ícono

Cubierto por G-04. En Personalización (subpantallas Agregar widget, Configurar widget, Catálogo de imágenes, Subir
imagen, Ajustar imagen, Paletas, Selector de color, Tipografía, Forma, Distribución, Guardar como tema) el regreso es
«←» con nombre emergente «Regresar».

### PR-22 · Indicador «1 Tema, 2 Fondo, 3 Colores y tipografía, 4 Widgets»

**Defecto.** Cuatro rectángulos grises de distinto ancho, el elegido en cian: parecen botones sueltos, no pasos.

**Cambio.** Mismo lenguaje que el indicador de pasos del Registro (`66:162`), en la fila del título (G-06):
- Cada paso: círculo de 24 px con el número (13 px 500) y el nombre (15 px) a 8 px.
- Paso actual: círculo relleno `secundario` con número blanco (`#17131D` en oscuro), nombre `tinta` 500, y debajo del
  nombre un subrayado de 2 px `secundario`.
- Otros pasos: círculo con borde 1,5 px `linea`, número y nombre en `texto`. Hover: nombre `tinta`.
- Entre pasos, un conector de 24 px × 1,5 px `linea`.
- Todo el indicador es un grupo navegable (cada paso se puede elegir, como hoy).

**Criterios de aceptación.**
- [ ] El indicador está en la misma línea que «Personalización» y centrado verticalmente con él.
- [ ] Ningún paso parece botón con relleno gris.

### PR-23 · Más importancia a la vista previa

**Pantallas.** Todas las de `04 · Personalización` con «Vista previa».

**Cambio.**
- Con la fila del título de G-06, la vista previa sube a y ≈ 104.
- Panel de configuración de 300 px de ancho (hoy 349), filas de 36 px, separación 8.
- La vista previa ocupa el resto del ancho, en 16 : 9. Con la barra contraída: ≈ 664 × 374 (hoy 552 × 310). Con la
  barra expandida (PR-24): ≈ 552 × 310.
- «Vista previa» y «Tema en edición · Windgets claro» en una sola línea encima de la vista previa, a 8 px.
- La barra inferior («Sin cambios», «Cancelar cambios», «Guardar», «Aplicar») baja a 52 px de alto y sus botones
  siguen G-02/G-03 (Aplicar Principal; Guardar y Cancelar cambios Secundarios).

**Criterios de aceptación.**
- [ ] La vista previa ocupa al menos el 60 % del ancho del contenido con la barra contraída.
- [ ] Nada del panel de configuración queda cortado; si no cabe, el panel se desplaza por dentro.

### PR-24 · Personalización con la barra lateral expandida

**Cambio.** Agregar la variante con la barra lateral **expandida** (la de `204:35588` del planificador, con los ajustes
de G-09) para estas pantallas de Personalización, en los cuatro temas: 1 Tema, 2 Fondo, 3 Colores y tipografía,
4 Widgets, Agregar widget, Configurar widget › Reloj (como muestra de todos los Configurar), Organizar widgets y
Cambios sin guardar. Nombre del marco: «… · Barra expandida · Tema …».

**Criterios de aceptación.**
- [ ] Las ocho pantallas existen en las dos variantes y en los cuatro temas.
- [ ] Con la barra expandida nada se corta ni se superpone (vista previa según PR-23).

### PR-25 · Dónde aparecen los mensajes emergentes

**Cambio.** Zona única para los mensajes emergentes (`217:17624`…`217:17666`) en todas las pantallas:
- **Arriba a la derecha**, debajo de la fila 1 de la cabecera (y = 32), a 16 px del borde derecho, ancho 320.
- Se apilan hacia abajo con 8 px entre ellos, máximo 3 visibles (marco `220:22383` actualizado).
- Si el panel de Windi está abierto, la zona se corre a la izquierda del panel.
- Nunca se ubican en: la esquina del botón flotante de Windi, la barra inferior de Personalización, la barra de
  acciones de una ventana emergente.
- Agregar un marco por página mostrando un mensaje emergente en su posición final (por ejemplo «Tarjeta creada.» en
  el Planificador diario y «Tema guardado» en Personalización · Guardado `203:10056`).

**Criterios de aceptación.**
- [ ] En ningún marco un mensaje emergente tapa un botón, el título o el botón de Windi.
- [ ] Los cuatro tipos (Éxito, Información, Advertencia, Error) usan la misma zona.

### PR-26 · Ícono del clima según el clima

**Cambio.**
- Nuevo grupo de íconos en `00 · Fundamentos`: «Clima» con 10 íconos, mismo estilo de línea, 24 px: Despejado (sol),
  Despejado de noche (luna), Parcialmente nublado (sol con nube), Parcialmente nublado de noche (luna con nube),
  Nublado, Niebla, Llovizna, Lluvia, Tormenta, Nieve. Más un ícono neutro «Sin datos» (nube con «?»).
- El widget Clima (Agregar widget › Clima `203:7133`, Configurar `203:8153`, Clima agregado `203:9197`, escritorio
  `06`) muestra el ícono a la izquierda de la temperatura, 32 px, color `tinta`.
- Ejemplos en los prototipos: Popayán con Parcialmente nublado; estados «Sin conexión» y «Error» con el ícono «Sin
  datos».

**Criterios de aceptación.**
- [ ] Los 11 íconos existen en los cuatro temas.
- [ ] El widget Clima nunca muestra la temperatura sin ícono.

---

## 3. Datos de ejemplo (PR-15, PR-16)

Hoy en los prototipos es **martes 24 de noviembre de 2026**. El periodo de Reportes es «Últimos 30 días» (25-oct a
24-nov).

**Etiquetas:** Proyecto (`#B04F7D`), Universidad (`#2B7A8C`), Personal (`#B8692A`), Salud (`#2E8B57`, nueva).

**Columnas del Kanban:** Por hacer, En progreso, Hecho.

| # | Título | Tipo | Etiquetas | Prioridad | Fecha límite | Bloque horario | Columna | Completada | Descripción |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Revisar los bocetos | Tarea | Proyecto | Alta | 24 nov | 24 nov 08:00 | Hecho | 24 nov | Revisar con el equipo los bocetos de la entrega. |
| 2 | Preparar la entrega | Tarea | Proyecto | Alta | 24 nov | 24 nov 09:00 | Hecho | 24 nov | — |
| 3 | Leer capítulo 4 | Tarea | Universidad | Media | 20 nov | — | Hecho | 21 nov (tarde) | Capítulo de requisitos no funcionales. |
| 4 | Pagar el arriendo | Recordatorio | Personal | Alta | 20 nov | — | Hecho | 20 nov | — |
| 5 | Cita médica | Evento | Salud | Media | 18 nov | 18 nov 10:00 | Hecho | 18 nov | Llevar los exámenes. |
| 6 | Entregar taller 3 | Tarea | Universidad | Alta | 17 nov | — | Hecho | 16 nov | — |
| 7 | Comprar mercado | Tarea | Personal | Baja | 21 nov | — | Hecho | 22 nov (tarde) | — |
| 8 | Reunión de equipo | Evento | Proyecto | Media | 23 nov | 23 nov 15:00 | Hecho | 23 nov | Repartir las tareas del sprint. |
| 9 | Actualizar el backlog | Tarea | Proyecto | Media | 23 nov | — | Hecho | 23 nov | — |
| 10 | Correr 5 km | Tarea | Salud | Baja | 22 nov | 22 nov 07:00 | Hecho | 22 nov | — |
| 11 | Estudiar para el parcial | Tarea | Universidad | Alta | 12 nov | — | Hecho | 12 nov | Temas 1 a 5. |
| 12 | Llamar a mamá | Recordatorio | Personal | Baja | 15 nov | — | Hecho | 15 nov | — |
| 13 | Compartir el prototipo | Tarea | Proyecto, Universidad | Media | 24 nov | 24 nov 10:00 | En progreso | — | Enviar el enlace del Figma al profesor. |
| 14 | Entregar ensayo | Tarea | Universidad | Alta | 24 nov | 24 nov 12:00 | En progreso | — | — |
| 15 | Validar el contraste | Tarea | Proyecto | Media | 24 nov | 24 nov 14:00 | Por hacer | — | Revisar 4,5:1 en los cuatro temas. |
| 16 | Revisar calendario | Tarea | Personal | Baja | 24 nov | — | Por hacer | — | — |
| 17 | Caminar 30 minutos | Tarea | Salud | Baja | 24 nov | 24 nov 17:00 | Por hacer | — | — |
| 18 | Enviar la presentación | Tarea | Proyecto | Alta | 24 nov | 24 nov 16:00 | En progreso | — | — |
| 19 | Pagar el gimnasio | Recordatorio | Personal | Media | 22 nov (vencida) | — | Por hacer | — | — |
| 20 | Responder correo del profesor | Tarea | Universidad | Alta | 23 nov (vencida) | — | Por hacer | — | — |
| 21 | Exposición de GPI | Evento | Universidad | Alta | 25 nov | 25 nov 10:00 | Por hacer | — | Sala 204. |
| 22 | Clase de yoga | Evento | Salud | Baja | 25 nov | 25 nov 18:00 | Por hacer | — | — |
| 23 | Revisar pull requests | Tarea | Proyecto | Media | 26 nov | 26 nov 09:00 | En progreso | — | — |
| 24 | Cumpleaños de Ana | Recordatorio | Personal | Baja | 27 nov | — | Por hacer | — | Comprar el regalo. |
| 25 | Entrega final del proyecto | Tarea | Proyecto | Alta | 27 nov | 27 nov 11:00 | En progreso | — | — |
| 26 | Lavar la ropa | Tarea | Personal | Baja | 28 nov | 28 nov 10:00 | Por hacer | — | — |
| 27 | Planear la semana | Tarea | Personal | Media | 29 nov | 29 nov 19:00 | Por hacer | — | — |

**Números que salen de este conjunto** (deben coincidir en todos los prototipos):

| Pantalla | Valor |
|---|---|
| Planificador diario (24 nov) | 8 tarjetas (1, 2, 13–18), «Completadas: 2 de 8»; Próximas a vencer: 21, 23, 25 |
| Agenda diaria (24 nov) | 08:00 #1, 09:00 #2, 10:00 #13, 12:00 #14, 14:00 #15, 16:00 #18, 17:00 #17; sin horario: #16 |
| Kanban | Por hacer 10 (15, 16, 17, 19, 20, 21, 22, 24, 26, 27), En progreso 5 (13, 14, 18, 23, 25), Hecho 12 |
| Reportes · Cumplimiento | 10 de 12 a tiempo, 83 % |
| Reportes · Cumplimiento por estado | Completadas 12, Pendientes 6, Vencidas 2, total 20 |
| Más reportes · Completadas por etiqueta | Proyecto 4, Universidad 3, Personal 3, Salud 2 |
| Más reportes · Completadas por tipo | Tarea 8, Recordatorio 2, Evento 2 |
| Más reportes · Vencidas por prioridad | Alta 1, Media 1, Baja 0 |
| Más reportes · Tarjetas por columna | Por hacer 10, En progreso 5, Hecho 12 |
| Más reportes · Próximos 7 días | Miércoles 2, Jueves 1, Viernes 2, Sábado 1, Domingo 1 |
| Widget Tareas del día | primeras 3 de hoy por hora: 08:00 #1 (completada), 09:00 #2 (completada), 10:00 #13 |
| Widget Kanban | Por hacer 10, En progreso 5, Hecho 12 |

---

## 4. Lista final de revisión

- [ ] G-01 a G-09 aplicados en todas las páginas y los cuatro temas.
- [ ] PR-02, PR-03, PR-04, PR-06, PR-10, PR-12, PR-14, PR-15, PR-18, PR-20, PR-22 a PR-26 con sus marcos nuevos.
- [ ] `00 · Fundamentos` actualizado: tokens, íconos nuevos, nombre emergente, botón de Windi, íconos de clima.
- [ ] Inventarios de `00 · Fundamentos` (`219:31411`…`219:32558`) actualizados con los marcos nuevos.
- [ ] Ningún texto nuevo sin marcar como *propuesto* en este documento.
- [ ] Captura de cada pantalla cambiada en Windgets claro y Windgets oscuro, para que Paula apruebe.
