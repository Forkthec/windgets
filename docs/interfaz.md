# Interfaz

## Cómo usar este archivo

Inventario de pantallas, ventanas emergentes, pasos y contenedores, con su menú, navegación y mensajes literales. Las rutas y los nombres se copian tal como aparecen en los CA. Cada archivo de épica repite, por HU, las pantallas, los estados y los mensajes que le tocan; los CA son la autoridad.

Prefijos: P-xxx-nn (pantalla, subpantalla, paso o ventana emergente), C-nn (contenedor), X-nn (superficie externa), M-nn (mensaje de confirmación que se abre como ventana emergente), T-nnn (transición). Estados: con datos, vacío, cargando, éxito, error, sin conexión y bloqueado (opción deshabilitada). Las pantallas con estados marcados «sin CA» en las tablas de las épicas son los vacíos «NO DEFINIDO».

## Los seis tipos de mensaje (RT-04)

| Tipo | Dónde y cómo se muestra | Reglas |
|---|---|---|
| Resultado | Texto breve en la esquina inferior derecha de la ventana de la aplicación, sin bloquear la pantalla ni el menú principal. | Se oculta a los 4 s; tiene la opción «×» que lo cierra antes. No toda acción lo muestra: el CA indica cuándo y su texto. |
| Campo | Debajo del campo vacío siendo obligatorio o con un valor inválido; el borde del campo se resalta. | El cursor va al primer campo con error; el mensaje desaparece al corregir el valor. |
| Opción deshabilitada | La opción se ve en gris y no responde a la selección; junto a ella, el texto del motivo (al pasar el mouse si no hay espacio). | Se deshabilita, en lugar de mostrar un error después de seleccionarla, cuando se alcanzó un máximo, cuando un formulario de un solo campo obligatorio está vacío o cuando la función requiere conexión. |
| Aviso | En la parte superior de la pantalla, sección, widget o paso afectado; dice qué ocurrió y qué puede hacer el usuario. | No bloquea el resto de la aplicación; desaparece cuando el problema se resuelve. Se usa por falta de conexión, error de un servicio externo o incompatibilidad del computador. |
| Confirmación | Ventana emergente (RT-02) con la opción principal con el verbo de la acción (por ejemplo «Eliminar») y siempre «Cancelar». Excepción: en el instalador la opción para salir es «Seguir instalando». | Solo para acciones que no se pueden deshacer o que reemplazan la personalización. |
| Estado vacío | Ocupa el lugar del contenido de la pantalla, sección, lista o widget sin elementos. | Su texto lo define la HU; sin errores ni ceros que no correspondan. |

Los elementos de una misma línea (íconos, textos, casillas, botones, campos, interruptores) se alinean verticalmente al centro. Los formularios con un solo campo obligatorio deshabilitan la opción principal mientras el campo está vacío o solo tiene espacios, y no muestran «Este campo es obligatorio.». Si el servicio de cuentas no responde: «No pudimos completar la operación. Intenta de nuevo más tarde.»; el botón en curso queda deshabilitado mientras se procesa (RT-04-CA13). El detalle completo y los CA están en `RT.md`.

## Colores y tipografía de la interfaz

De la guía de identidad solo aplica lo siguiente a la aplicación:

- **Los colores y la tipografía de la aplicación los define el tema** (tres colores: principal, secundario y del texto; tipografía y tamaño pequeño, mediano o grande). No hay modo claro ni oscuro. La interfaz lee el tema aplicado; no fijes colores de interfaz en el código.
- **Tema por defecto** (semilla): plantilla «Windgets», colores principal `#00D9E2`, secundario `#DC026C` y del texto `#FFFFFF`; tipografía Inter. La plantilla y la tipografía por defecto viajan en el instalador (D-198).
- **Colores de marca fijos** (el isotipo y el logo no cambian con el tema): cian `#00D9E2`, magenta `#DC026C`, amarillo `#DCBA04`, púrpura `#6604E6`; cruces `#D6258C`, `#F7B212`, `#7A14E3`; neutros `#121216` y `#FFFFFF`. La palabra «Windgets» del logo es solo `#121216` o `#FFFFFF` y nunca usa la tipografía ni los colores del tema.
- **Los colores de marca no tienen función en la aplicación** (acción, foco, selección, estado, prioridad, aviso, fondos); la función la dan los colores del tema (R-04). Los estados con color son mezclas sólidas calculadas, nunca opacidad (R-05).
- **Forma**: un solo ángulo diagonal de 18° (R-06); esquina de un tercio: radio = grosor / 3 con un tope absoluto fijado por la implementación (R-07); profundidad con capas sólidas y sombra desplazada a 18°, sin transparencias apiladas, desenfoque ni vidrio (R-08). Los widgets no se superponen (R-09). Toda medida nueva es fracción o múltiplo de una unidad base (R-14).
- **Presencia**: máximo un identificador de marca por pantalla; ninguno en el wallpaper ni en los widgets (R-10). Ningún patrón va detrás de texto o del identificador (R-11).
- **Legibilidad**: el significado no depende solo del color (prioridad, vencida, completada, opción deshabilitada e indicador de colisión también se distinguen por forma, ícono y palabra) (R-12). Contraste mínimo: texto 4,5 : 1, tinta principal 7 : 1, controles y gráficos con significado 3 : 1; el sistema de temas ajusta o advierte (R-13, RNF-26).
- **Colores de etiquetas y columnas**: se eligen del catálogo de colores (`catalog_color`), no son colores del tema.

## Tema a tokens

Cómo se derivan los colores de la interfaz de los tres colores del tema (principal `P`, secundario `S` y del texto `X`). Todo se calcula en el Núcleo y se entrega a las vistas como variables; no hay modo claro ni oscuro. «Mezclar A con B al n %» es una mezcla sólida en RGB: `A × (1 − n) + B × n`, redondeada a entero por canal. «Extremo» es `#121216` si `X` es claro (luminancia relativa de 0,18 o más) y `#FFFFFF` si es oscuro.

| Token | Fórmula | Uso |
|---|---|---|
| `superficie` | `P` mezclado con el extremo al 90 % | Fondo de la ventana principal y de los widgets |
| `superficie_alta` | `P` mezclado con el extremo al 80 % | Tarjetas, ventanas emergentes, celdas |
| `tinta` | `X` | Títulos, cifras y contenido principal (la tinta principal) |
| `texto` | `X` mezclado con `superficie` al 25 % | Descripciones, etiquetas de campo, texto secundario |
| `accion` | `S` | Botones principales, foco, selección, controles y líneas de gráficas |
| `sobre_accion` | `#121216` o `#FFFFFF`, el que dé más contraste con `S` | Texto de un botón de `accion` (siempre 4,5:1 o más) |
| `borde` | `X` mezclado con `superficie` al 65 % | Bordes de campos y tarjetas |
| `estado_vencida`, `estado_pendiente`, `estado_completada` | Tono fijo (rojo 4°, amarillo 45°, verde 140°), saturación 70 %; luminosidad inicial 50 %, que se mueve de a 1 % alejándose de `superficie` hasta alcanzar 3:1 con ella | Color de estado de vencidas, pendientes y completadas; no son colores de marca (R-04) |
| `relleno_estado` | Color de estado mezclado con `superficie` al 30 % (nunca opacidad, R-05) | Relleno de un día resaltado o de un indicador de estado; el borde usa el color de estado completo |

El significado no depende solo del color (R-12): vencida lleva el ícono de alerta y el texto «<cantidad> vencida(s)»; pendiente, el ícono de reloj; completada, el ícono de verificación.

**Legibilidad (R-13, RNF-26, HE-02-HU05-ET07).** Tres pares, todos sobre `superficie`, con el contraste de WCAG 2.1 (`(L1 + 0,05) / (L2 + 0,05)`, con `L1` la luminancia relativa mayor):

| Par (`LegibilityPair`) | Primer plano | Mínimo |
|---|---|---|
| `ink_surface` (tinta principal) | `tinta` | 7:1 |
| `text_surface` (texto) | `texto` | 4,5:1 |
| `control_surface` (controles y gráficos con significado) | `accion` | 3:1 |

`P` no entra en un par: solo da la base de `superficie`. El tema por defecto (`#00D9E2`, `#DC026C`, `#FFFFFF`) da `superficie = #10262A` y cumple los tres pares (15,8:1; 9,4:1; 3,2:1).

**Color sugerido.** Para el par que no cumple (si fallan varios, el de menor razón), se conservan el tono y la saturación (HSL) del color del primer plano y se busca la luminosidad más cercana a la elegida, en pasos de 1 %, con la que el par cumple su mínimo y los demás siguen cumpliéndose; si empata, la más lejana de `superficie`. Si ninguna cumple, se sugiere `#FFFFFF` o `#121216`, el que dé más contraste con `superficie`. El contraste del aviso es el menor de los pares que fallan, truncado (no redondeado) a un decimal y escrito con coma. El aviso se muestra debajo de la muestra de la vista previa y desaparece cuando todos los pares cumplen.

<!-- ANEXO GENERADO -->

## Inventario · 1. Contenedores

| ID | Contenedor | Qué es |
|---|---|---|
| C-01 | Ventana principal | Vista WebView2 permanente del Núcleo en Rust. Aloja el menú principal, el indicador de sincronización, todas las pantallas con sesión iniciada, las pantallas de cuenta (Inicio de sesión, Registro, Recuperar contraseña) y las ventanas emergentes. El mensaje de resultado se muestra en su esquina inferior derecha. Se cierra con «×» sin cerrar la sesión. |
| C-02 | Capa del wallpaper y los widgets | Vista WebView2 permanente anclada a WorkerW. Es una sola ventana que cubre el escritorio virtual de todos los monitores y dibuja la misma configuración en cada uno. No recibe entrada directa: el Núcleo reenvía el mouse solo a los widgets interactivos y los íconos del escritorio tienen prioridad. Muestra el wallpaper, los widgets activos y sus avisos. |
| C-03 | Ventana de edición de la distribución | Vista temporal a pantalla completa por encima del escritorio. Existe solo mientras la pantalla de edición está abierta, oculta la ventana principal y no muestra el menú principal. |
| C-04 | Landing page | Página web pública, fuera de la aplicación, con rol visitante. Describe Windgets, muestra los requisitos del sistema y ofrece la descarga del instalador. |
| C-05 | Instalador | Instalador .exe todo en uno, con rol visitante. Tiene tres pasos con nombre (Opciones, Instalación en curso e Instalación completada); muestra mensajes de confirmación y avisos propios. |
| C-06 | Área de notificación | Ícono de la aplicación junto al reloj de la barra de tareas de Windows, presente mientras la aplicación se ejecuta, incluso con la ventana principal cerrada. Su menú tiene las opciones «Abrir» y «Salir». |

Superficies externas que la aplicación abre:

| ID | Superficie | Uso |
|---|---|---|
| X-01 | Ventana de Google | Ventana externa que abre «Continuar con Google». |
| X-02 | Explorador de archivos de Windows | Se abre con «Subir imagen»; «Cancelar» lo cierra sin cambiar la vista previa. |
| X-03 | Navegador por defecto de Windows | Abre las noticias y recibe la descarga del instalador. |

## Inventario · 2. Menú principal

El menú principal está visible en todas las pantallas con sesión iniciada, salvo en la pantalla de edición. Marca la opción de la pantalla actual y solo esa. La pantalla principal es Planificador diario. Sin sesión no aparece. Sin conexión muestra todas las opciones. El indicador de sincronización (P-SIN-01) está siempre visible junto al menú principal.

| Orden | Sección | Opciones en orden (texto literal) | Ruta que generan |
|---|---|---|---|
| 1 | Planificador | «Planificador diario», «Tablero Kanban», «Calendario», «Agenda diaria», «Reportes», «Agente de IA», «Etiquetas» | Menú principal > Planificador > <opción> |
| 2 | Personalización | «Personalización del wallpaper», «Temas», «Widgets» | Menú principal > Personalización > <opción> |
| 3 | Configuración | «Configuración» | Menú principal > Configuración |

Con cambios sin guardar ni aplicar en Personalización del wallpaper, elegir otra opción abre primero el mensaje de cambios sin guardar (M-02) o de cambios aplicados sin guardar (M-03) y no cambia de pantalla hasta confirmar.

## Inventario · 3. Pantallas, pasos y ventanas emergentes

La columna «Ruta (Dado)» es el texto exacto con el que los CA nombran la pantalla. Las ventanas emergentes se nombran en el Dado con «tengo abierta la ventana emergente <Nombre>» a continuación de la ruta de la pantalla donde se abren.

| ID | Nombre | Tipo | Contenedor | Ruta (Dado) | Pasos o variantes | Estados | HU |
|---|---|---|---|---|---|---|---|
| P-CTA-01 | Inicio de sesión | pantalla | C-01 Ventana principal | Inicio de sesión | — | con datos, vacío, éxito, error, sin conexión, bloqueado; también cargando (RT-04-ET26), error de servicio (RT-04-ET24) | 5 |
| P-CTA-02 | Registro | pantalla | C-01 Ventana principal | Registro > paso Formulario; Registro > paso Verificar correo | Formulario; Verificar correo | con datos, vacío, éxito, error, sin conexión, bloqueado; también cargando (RT-04-ET26), error de servicio (RT-04-ET24) | 6 |
| P-CTA-03 | Recuperar contraseña | pantalla | C-01 Ventana principal | Inicio de sesión > Recuperar contraseña; Inicio de sesión > Recuperar contraseña > paso Correo electrónico; Inicio de sesión > Recuperar contraseña > paso Diligenciar código; Inicio de sesión > Recuperar contraseña > paso Nueva contraseña | Correo electrónico; Diligenciar código; Nueva contraseña | con datos, éxito, error, sin conexión, bloqueado; también cargando (RT-04-ET26), error de servicio (RT-04-ET24) | 4 |
| P-WAL-01 | Personalización del wallpaper | pantalla | C-01 Ventana principal | Menú principal > Personalización > Personalización del wallpaper | Secciones: Plantillas; Imagen de fondo; Colores; Tipografía; Paletas | con datos, vacío, éxito, error, bloqueado | 16 |
| P-TEM-01 | Temas | pantalla | C-01 Ventana principal | Menú principal > Personalización > Temas | — | con datos, éxito, bloqueado | 6 |
| P-TEM-02 | Guardar como tema | ventana emergente | C-01 Ventana principal | tengo abierta la ventana emergente Guardar como tema | — | con datos, vacío, éxito, error, bloqueado | 1 |
| P-TEM-03 | Renombrar tema | ventana emergente | C-01 Ventana principal | tengo abierta la ventana emergente Renombrar tema | — | con datos, vacío, éxito, error, bloqueado | 1 |
| P-WID-01 | Widgets | pantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets | — | con datos, éxito, bloqueado | 7 |
| P-WID-02 | Agregar widget | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget | — | con datos, vacío, error, bloqueado | 3 |
| P-WID-03 | Clima | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget > Clima | — | con datos, vacío, error, sin conexión, bloqueado | 3 |
| P-WID-04 | Noticias | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget > Noticias | — | con datos, error, sin conexión | 1 |
| P-WID-05 | Imagen estática | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget > Imagen estática | — | con datos, error, bloqueado | 1 |
| P-WID-06 | Carrusel de imágenes | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget > Carrusel de imágenes | — | con datos, vacío, error, bloqueado | 1 |
| P-WID-07 | Animación | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget > Animación | — | con datos | 1 |
| P-WID-08 | Texto | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget > Texto | — | con datos, vacío, error, bloqueado | 1 |
| P-WID-09 | Reproductor de música | subpantalla | C-01 Ventana principal | Menú principal > Personalización > Widgets > Agregar widget > Reproductor de música | — | con datos, vacío, bloqueado | 1 |
| P-WID-10 | Formulario de widget | ventana emergente | C-01 Ventana principal | tengo abierta la ventana emergente Formulario de widget | Widgets Clima y Texto | con datos, bloqueado | 1 |
| P-DIS-01 | Pantalla de edición | pantalla | C-03 Ventana de edición de la distribución | la pantalla de edición | — | con datos, éxito, sin conexión | 5 |
| P-WAL-02 | Escritorio de Windows (wallpaper y widgets) | pantalla | C-02 Capa del wallpaper y los widgets | el escritorio de Windows | — | con datos, vacío, error, sin conexión, bloqueado | 20 |
| P-TAR-01 | Detalle de tarjeta | ventana emergente | C-01 Ventana principal | tengo abierta la ventana emergente Detalle de tarjeta | — | con datos, éxito, error | 3 |
| P-TAR-02 | Formulario de tarjeta | ventana emergente | C-01 Ventana principal | tengo abierta la ventana emergente Formulario de tarjeta; tengo abierta la ventana emergente Formulario de tarjeta en modo edición | Modos: creación; edición | con datos, vacío, éxito, error, sin conexión, bloqueado | 6 |
| P-ETQ-01 | Etiquetas | pantalla | C-01 Ventana principal | Menú principal > Planificador > Etiquetas | — | con datos, vacío, éxito, bloqueado | 6 |
| P-ETQ-02 | Formulario de etiqueta | ventana emergente | C-01 Ventana principal | tengo abierta la ventana emergente Formulario de etiqueta | Títulos: Nueva etiqueta; Editar etiqueta | con datos, vacío, éxito, error, sin conexión | 2 |
| P-KAN-01 | Tablero Kanban | pantalla | C-01 Ventana principal | Menú principal > Planificador > Tablero Kanban | — | con datos, vacío, cargando, éxito, bloqueado | 10 |
| P-KAN-02 | Formulario de columna | ventana emergente | C-01 Ventana principal | tengo abierta la ventana emergente Formulario de columna | Títulos: Nueva columna; Editar columna | con datos, éxito, error | 2 |
| P-CAL-01 | Calendario | pantalla | C-01 Ventana principal | Menú principal > Planificador > Calendario | Vistas: Mes; Semana | con datos, vacío | 4 |
| P-CAL-02 | Panel del día | subpantalla | C-01 Ventana principal | Menú principal > Planificador > Calendario > Panel del día | — | con datos, bloqueado | 2 |
| P-AGE-01 | Agenda diaria | pantalla | C-01 Ventana principal | Menú principal > Planificador > Agenda diaria | — | con datos, vacío, sin conexión, bloqueado | 4 |
| P-PLA-01 | Planificador diario (pantalla principal) | pantalla | C-01 Ventana principal | Menú principal > Planificador > Planificador diario | — | con datos, vacío, cargando, éxito, sin conexión | 6 |
| P-REP-01 | Reportes | pantalla | C-01 Ventana principal | Menú principal > Planificador > Reportes | — | con datos, vacío, éxito, error, sin conexión, bloqueado | 5 |
| P-IA-01 | Agente de IA | pantalla | C-01 Ventana principal | Menú principal > Planificador > Agente de IA | — | con datos, vacío, éxito, error, sin conexión, bloqueado | 9 |
| P-CFG-01 | Configuración | pantalla | C-01 Ventana principal | Menú principal > Configuración | — | con datos, vacío, cargando, éxito, error, sin conexión | 4 |
| P-SIN-01 | Indicador de sincronización | componente | C-01 Ventana principal | Menú principal > cualquier pantalla | — | con datos, vacío, cargando, error, sin conexión, bloqueado | 5 |
| P-CFG-02 | Menú del ícono del área de notificación | pantalla | C-06 Área de notificación | en el área de notificación | — | con datos, sin conexión | 3 |
| P-LAN-01 | Landing page | pantalla | C-04 Landing page | la landing page | — | con datos, error, sin conexión | 2 |
| P-INS-01 | Instalador, paso Opciones | pantalla | C-05 Instalador | el paso Opciones del instalador; el instalador | Opciones | con datos, vacío, cargando, éxito, error, bloqueado | 3 |
| P-INS-02 | Instalador, paso Instalación en curso | pantalla | C-05 Instalador | el paso Instalación en curso del instalador | — | con datos, cargando | 1 |
| P-INS-03 | Instalador, paso Instalación completada | pantalla | C-05 Instalador | el paso Instalación completada del instalador | — | con datos, éxito | 1 |

Las ventanas emergentes se abren sobre estas pantallas: Detalle de tarjeta sobre Tablero Kanban, Calendario, Agenda diaria, Planificador diario y Reportes; Formulario de tarjeta sobre Tablero Kanban y Calendario (y, con el Panel del día abierto, sobre Calendario); Formulario de etiqueta sobre Etiquetas y sobre el Formulario de tarjeta; Formulario de columna sobre Tablero Kanban; Guardar como tema sobre Personalización del wallpaper; Renombrar tema sobre Temas; Formulario de widget sobre Widgets.

### 3.1 Mensajes de confirmación que se abren como ventana emergente

| ID | Mensaje y opciones | Contenedor | CA que lo abren |
|---|---|---|---|
| M-01 | «¿Deseas cancelar la instalación?» con las opciones «Cancelar instalación» y «Seguir instalando» | C-05 | CD-02-HU03-CA01, CD-02-HU03-CA04 |
| M-02 | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» con las opciones «Salir sin guardar» y «Seguir editando» | C-01 / C-03 / C-06 | HE-02-HU13-CA02, HE-05-HU05-CA01, HE-05-HU05-CA02, HE-17-HU03-CA02, RT-01-CA08 |
| M-03 | «Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?» con las opciones «Guardar», «Salir sin guardar» y «Seguir editando» | C-01 | HE-02-HU13-CA05, RT-01-CA09 |
| M-04 | «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?» con las opciones «Cambiar sin guardar» y «Seguir editando» | C-01 | HE-02-HU10-CA03 |
| M-05 | «Se reemplazará la personalización actual por la del tema “<nombre del tema>”. ¿Deseas aplicarlo?» con las opciones «Aplicar» y «Cancelar» | C-01 | HE-03-HU03-CA06 |
| M-06 | «¿Deseas eliminar el tema “<nombre del tema>”? Esta acción no se puede deshacer.» | C-01 | RT-04-CA08 |
| M-07 | «¿Deseas eliminar el widget “<nombre del widget>”? Se quitará de todos tus temas.» | C-01 | HE-04-HU13-CA06 |
| M-08 | «¿Deseas eliminar la tarjeta “<título de la tarjeta>”? Esta acción no se puede deshacer.» | C-01 | HE-07-HU05-CA01 |
| M-09 | «¿Deseas eliminar la columna “<nombre de la columna>”? Esta acción no se puede deshacer.» | C-01 | HE-09-HU06-CA01 |
| M-10 | «¿Deseas eliminar la etiqueta “<nombre de la etiqueta>”? Esta acción no se puede deshacer.» | C-01 | HE-08-HU04-CA01 |
| M-11 | «¿Deseas cerrar sesión?» con las opciones «Cerrar sesión» y «Cancelar» | C-01 | HE-16-HU03-CA05 |
| M-12 | «Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?» | C-01 | HE-16-HU03-CA03 |
| M-13 | «La columna “<nombre de la columna>” tiene <cantidad> tarjetas. Se moverán a “Por hacer”. ¿Deseas continuar?» | C-01 | HE-09-HU06-CA03 |
| M-14 | «La etiqueta “<nombre de la etiqueta>” está asignada a <cantidad> tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?» | C-01 | HE-08-HU04-CA03, HE-08-HU04-CA04 |
| M-15 | «Tienes cambios sin guardar en el tema “<nombre del tema>”. ¿Qué deseas hacer?» con las opciones «Guardar y aplicar», «Aplicar sin guardar» y «Cancelar» | C-01 | HE-02-HU12-CA02, HE-03-HU03-CA05 |
| M-16 | «Windgets ya está instalada. ¿Deseas reinstalarla?» | C-05 | CD-02-HU01-CA05 |
| M-17 | «Encontramos una instalación incompleta. Vamos a repararla.» | C-05 | CD-02-HU01-CA09 |

## Inventario · 4. Transiciones

Cada fila es un disparador literal y su resultado. La columna «CA y ET» cita los criterios o las especificaciones técnicas que verifican el resultado. «Pantalla de origen» es la pantalla desde la que se abrió la ventana. Una transición con origen y destino iguales es un cambio de paso o de vista dentro de la misma pantalla.

| ID | Origen | Destino | Disparador | CA y ET | Nota |
|---|---|---|---|---|---|
| T-001 | P-LAN-01 Landing page | X-03 Navegador por defecto de Windows > P-INS-01 Instalador, paso Opciones | «Descargar para Windows» | CD-01-HU02-CA01 | El navegador descarga el .exe; el visitante lo abre. |
| T-002 | P-LAN-01 Landing page | P-LAN-01 Landing page | «Descargar para Windows» con el archivo no disponible (aviso «No pudimos iniciar la descarga. Intenta de nuevo.») | CD-01-HU02-CA02 | — |
| T-003 | P-INS-01 Instalador, paso Opciones | P-INS-02 Instalador, paso Instalación en curso | «Instalar» | CD-02-HU01-CA01, CD-02-HU01-ET22 | El paso Instalación en curso tiene nombre (CD-02-HU01-ET22). |
| T-004 | P-INS-02 Instalador, paso Instalación en curso | P-INS-03 Instalador, paso Instalación completada | Fin de la instalación («Instalación completada.») | CD-02-HU01-CA01, CD-02-HU01-ET22 | El paso Instalación completada tiene nombre (CD-02-HU01-ET22). |
| T-005 | P-INS-03 Instalador, paso Instalación completada | P-CTA-01 Inicio de sesión | «Abrir Windgets» | CD-02-HU01-CA02 | — |
| T-006 | P-INS-01 Instalador, paso Opciones | M-16 Confirmación de reinstalar | «Instalar» con la aplicación ya instalada | CD-02-HU01-CA01, CD-02-HU01-CA05 | — |
| T-007 | M-16 Confirmación de reinstalar | P-INS-02 Instalador, paso Instalación en curso | «Reinstalar» | CD-02-HU01-CA06 | — |
| T-008 | M-16 Confirmación de reinstalar | Instalador cerrado | «Cancelar» | CD-02-HU01-CA07 | — |
| T-009 | M-17 Aviso de instalación incompleta | P-INS-02 Instalador, paso Instalación en curso | «Reparar» | CD-02-HU01-CA10 | — |
| T-010 | M-17 Aviso de instalación incompleta | Instalador cerrado | «Cancelar» | CD-02-HU01-CA11 | — |
| T-011 | P-INS-02 Instalador, paso Instalación en curso | P-INS-01 Instalador, paso Opciones | «Reintentar» (mensaje «No pudimos completar la instalación…») | CD-02-HU01-CA08, CD-02-HU01-ET23 | Especificada con ET de Interfaz porque CD-02-HU01 tiene 12 CA (D-201). |
| T-012 | P-INS-02 Instalador, paso Instalación en curso | Instalador cerrado | «Cerrar» (mensaje «No pudimos completar la instalación…») | CD-02-HU01-CA08, CD-02-HU01-ET23 | Especificada con ET de Interfaz porque CD-02-HU01 tiene 12 CA (D-201). |
| T-013 | P-INS-01 Instalador, paso Opciones | M-01 Confirmación de cancelar la instalación | «Cancelar» antes de instalar (mensaje «¿Deseas cancelar la instalación?») | CD-02-HU03-CA04 | — |
| T-014 | P-INS-02 Instalador, paso Instalación en curso | M-01 Confirmación de cancelar la instalación | «Cancelar» con la instalación en curso | CD-02-HU03-CA01 | — |
| T-015 | M-01 Confirmación de cancelar la instalación | P-INS-01 Instalador, paso Opciones | «Seguir instalando» (desde el paso Opciones) | CD-02-HU03-CA06 | — |
| T-016 | M-01 Confirmación de cancelar la instalación | P-INS-02 Instalador, paso Instalación en curso | «Seguir instalando» (con la instalación en curso) | CD-02-HU03-CA03 | — |
| T-017 | M-01 Confirmación de cancelar la instalación | Instalador cerrado | «Cancelar instalación» (antes de instalar) | CD-02-HU03-CA05 | — |
| T-018 | M-01 Confirmación de cancelar la instalación | Instalador cerrado | «Cancelar instalación» (en curso; revierte y muestra «La instalación se canceló.») | CD-02-HU03-CA02 | — |
| T-019 | P-CTA-01 Inicio de sesión | P-PLA-01 Planificador diario (pantalla principal) | «Iniciar sesión» | HE-01-HU04-CA01, RT-01-CA01 | — |
| T-020 | P-CTA-01 Inicio de sesión | X-01 Ventana de Google > P-PLA-01 Planificador diario (pantalla principal) | «Continuar con Google» (cuenta existente) | HE-01-HU05-CA02, RT-01-CA02 | — |
| T-021 | P-CTA-01 Inicio de sesión | X-01 Ventana de Google > P-PLA-01 Planificador diario (pantalla principal) | «Continuar con Google» (cuenta nueva; mensaje «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.») | HE-01-HU05-CA01 | — |
| T-022 | P-CTA-01 Inicio de sesión | P-CTA-02 Registro | Hipervínculo «Regístrate» del texto «¿No tienes cuenta? Regístrate» (paso Formulario) | HE-01-HU04-CA12 | — |
| T-023 | P-CTA-01 Inicio de sesión | P-CTA-03 Recuperar contraseña | Hipervínculo «¿Olvidaste tu contraseña?» (paso Correo electrónico) | HE-01-HU04-CA11 | — |
| T-024 | P-CTA-01 Inicio de sesión | P-CTA-02 Registro | Hipervínculo «Regístrate» del mensaje de Google con correo de más de 64 caracteres | HE-01-HU05-CA08 | — |
| T-025 | P-CTA-02 Registro | P-CTA-02 Registro | «Crear cuenta» (paso Formulario → paso Verificar correo) | HE-01-HU01-CA01 | — |
| T-026 | P-CTA-02 Registro | P-CTA-01 Inicio de sesión | Hipervínculo «Iniciar sesión» (mensaje «Este correo electrónico ya está registrado.») | HE-01-HU01-CA09 | — |
| T-027 | P-CTA-02 Registro | P-CTA-01 Inicio de sesión | Hipervínculo «Iniciar sesión» del texto «¿Ya tienes cuenta? Iniciar sesión» | HE-01-HU01-CA11 | — |
| T-028 | P-CTA-02 Registro | P-CTA-03 Recuperar contraseña | Hipervínculo «Recuperar contraseña» (mensaje «Este correo electrónico ya está registrado.») | HE-01-HU01-CA10 | — |
| T-029 | P-CTA-02 Registro | P-PLA-01 Planificador diario (pantalla principal) | «Verificar» (paso Verificar correo) | HE-01-HU03-CA01, RT-01-CA03 | — |
| T-030 | P-CTA-02 Registro | P-CTA-02 Registro | «Regresar» (paso Verificar correo → paso Formulario) | HE-01-HU03-CA08 | RT-03-CA07: sin miga de pan. |
| T-031 | P-CTA-03 Recuperar contraseña | P-CTA-03 Recuperar contraseña | «Enviar código» (paso Correo electrónico → paso Diligenciar código) | HE-01-HU06-CA01 | — |
| T-032 | P-CTA-03 Recuperar contraseña | P-CTA-03 Recuperar contraseña | «Verificar» (paso Diligenciar código → paso Nueva contraseña) | HE-01-HU07-CA01 | — |
| T-033 | P-CTA-03 Recuperar contraseña | P-CTA-01 Inicio de sesión | «Guardar contraseña» (mensaje «Tu contraseña fue actualizada. Ya puedes iniciar sesión.») | HE-01-HU08-CA01 | — |
| T-034 | P-CTA-03 Recuperar contraseña | P-CTA-03 Recuperar contraseña | «Regresar» (paso anterior) | HE-01-HU07-CA08 | RT-03-CA06 |
| T-035 | P-CTA-03 Recuperar contraseña | P-CTA-01 Inicio de sesión | «Inicio de sesión» en la miga de pan «Inicio de sesión > Recuperar contraseña» | HE-01-HU06-CA07 | — |
| T-036 | Aplicación abierta con sesión | P-PLA-01 Planificador diario (pantalla principal) | Abrir la aplicación con la sesión recordada (con o sin conexión) | RT-01-CA04, RT-01-CA05, HE-01-HU04-CA02 | — |
| T-037 | Menú principal (cualquier pantalla con menú) | Pantalla elegida | Opción del menú principal, por ejemplo «Tablero Kanban» | RT-01-CA07 | 14 opciones; ver sección del menú. |
| T-038 | P-WAL-01 Personalización del wallpaper | M-02 Confirmación de cambios sin guardar al salir | Otra opción del menú principal con cambios sin guardar ni aplicar | RT-01-CA08, HE-02-HU13-CA02 | — |
| T-039 | P-WAL-01 Personalización del wallpaper | M-03 Confirmación de cambios aplicados sin guardar | Otra opción del menú principal con cambios aplicados sin guardar | RT-01-CA09, HE-02-HU13-CA05 | — |
| T-040 | M-03 Confirmación de cambios aplicados sin guardar | Pantalla elegida | «Guardar» | HE-02-HU13-CA08 | — |
| T-041 | M-03 Confirmación de cambios aplicados sin guardar | Pantalla elegida | «Salir sin guardar» | HE-02-HU13-CA06 | — |
| T-042 | M-03 Confirmación de cambios aplicados sin guardar | P-WAL-01 Personalización del wallpaper | «Seguir editando» | HE-02-HU13-CA09 | — |
| T-043 | P-WAL-01 Personalización del wallpaper | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «Aplicar» sin cambios sin guardar (mensaje «Tema “<nombre del tema>” aplicado.») | HE-02-HU12-CA01 | — |
| T-044 | M-15 Confirmación de aplicar con cambios sin guardar | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «Guardar y aplicar» | HE-02-HU12-CA03 | — |
| T-045 | M-15 Confirmación de aplicar con cambios sin guardar | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «Aplicar sin guardar» | HE-02-HU12-CA04 | — |
| T-046 | P-WAL-01 Personalización del wallpaper | P-WAL-01 Personalización del wallpaper | «Guardar» (cambios en el tema en edición) | HE-02-HU11-CA01 | — |
| T-047 | P-WAL-01 Personalización del wallpaper | P-WAL-01 Personalización del wallpaper | «Cancelar» sin cambios («No se guardaron cambios.») | HE-02-HU13-CA01 | — |
| T-048 | M-02 Confirmación de cambios sin guardar al salir | Pantalla elegida | «Salir sin guardar» | HE-02-HU13-CA03 | — |
| T-049 | M-02 Confirmación de cambios sin guardar al salir | P-WAL-01 Personalización del wallpaper | «Seguir editando» | HE-02-HU13-CA04 | — |
| T-050 | P-WAL-01 Personalización del wallpaper | M-04 Confirmación de cambiar de tema con cambios sin guardar | Lista «Tema en edición» con cambios sin guardar | HE-02-HU10-CA03 | — |
| T-051 | M-04 Confirmación de cambiar de tema con cambios sin guardar | P-WAL-01 Personalización del wallpaper | «Seguir editando» | HE-02-HU10-CA06 | — |
| T-052 | P-WAL-01 Personalización del wallpaper | P-TEM-02 Guardar como tema | «Guardar como tema» | HE-03-HU02-CA07 | — |
| T-053 | P-TEM-02 Guardar como tema | P-WAL-01 Personalización del wallpaper | «Guardar» (mensaje «Tema “<nombre del tema>” guardado.») | HE-03-HU02-CA01 | — |
| T-054 | P-TEM-02 Guardar como tema | P-WAL-01 Personalización del wallpaper | «Cancelar» | HE-03-HU02-CA06 | — |
| T-055 | P-TEM-01 Temas | M-05 Confirmación de aplicar un tema | «Aplicar» en un tema que no es el aplicado | HE-03-HU03-CA06 | — |
| T-056 | M-05 Confirmación de aplicar un tema | P-TEM-01 Temas | «Aplicar» (mensaje «Tema “<nombre del tema>” aplicado.») | HE-03-HU03-CA01 | — |
| T-057 | M-05 Confirmación de aplicar un tema | P-TEM-01 Temas | «Cancelar» | HE-03-HU03-CA02 | — |
| T-058 | P-TEM-01 Temas | P-TEM-03 Renombrar tema | «Renombrar» | HE-03-HU04-CA07 | — |
| T-059 | P-TEM-03 Renombrar tema | P-TEM-01 Temas | «Guardar» (mensaje «Tema renombrado.») | HE-03-HU04-CA01 | — |
| T-060 | P-TEM-03 Renombrar tema | P-TEM-01 Temas | «Cancelar» | HE-03-HU04-CA05 | — |
| T-061 | P-TEM-01 Temas | M-06 Confirmación de eliminar un tema | «Eliminar» | RT-04-CA08 | — |
| T-062 | M-06 Confirmación de eliminar un tema | P-TEM-01 Temas | «Eliminar» (mensaje «Tema eliminado.») | HE-03-HU05-CA01 | — |
| T-063 | M-06 Confirmación de eliminar un tema | P-TEM-01 Temas | «Cancelar» | HE-03-HU05-CA03 | — |
| T-064 | P-WID-01 Widgets | P-WID-02 Agregar widget | «Agregar widget» | HE-04-HU04-CA01 | Miga de pan «Widgets > Agregar widget». |
| T-065 | P-WID-02 Agregar widget | P-WID-03 Clima | Widget Clima del catálogo | RT-03-CA01 | Miga de pan «Widgets > Agregar widget > Clima». |
| T-066 | P-WID-02 Agregar widget | P-WID-04 Noticias a P-WID-09 Reproductor de música | Widget Noticias, Imagen estática, Carrusel de imágenes, Animación, Texto o Reproductor de música del catálogo | RT-03-ET02, HE-04-HU06-ET01 | Regla de HE-04-HU06 a HE-04-HU11 y RT-03-ET02; solo Clima tiene CA de apertura (RT-03-CA01). |
| T-067 | P-WID-03 Clima a P-WID-09 Reproductor de música | P-WID-01 Widgets | «Agregar» | HE-04-HU05-CA01, HE-04-HU06-CA01, HE-04-HU07-CA02, HE-04-HU08-CA01 (+4) | — |
| T-068 | P-WID-03 Clima a P-WID-09 Reproductor de música | P-WID-02 Agregar widget | «Regresar» | RT-03-CA04 | — |
| T-069 | P-WID-03 Clima a P-WID-09 Reproductor de música | P-WID-02 Agregar widget | «Agregar widget» en la miga de pan | RT-03-CA03 | — |
| T-070 | P-WID-03 Clima a P-WID-09 Reproductor de música | P-WID-01 Widgets | «Widgets» en la miga de pan | RT-03-CA02 | — |
| T-071 | P-WID-01 Widgets | P-WID-10 Formulario de widget | «Configurar» (solo Clima y Texto) | HE-04-HU12-ET05, HE-04-HU12-CA01, HE-04-HU12-CA02 | Formulario de widget (D-202); solo Clima y Texto. |
| T-072 | P-WID-10 Formulario de widget | P-WID-01 Widgets | «Guardar» | HE-04-HU12-CA01, HE-04-HU12-CA02 | — |
| T-073 | P-WID-01 Widgets | M-07 Confirmación de eliminar un widget | «Eliminar» (widget externo o local) | HE-04-HU13-CA06 | — |
| T-074 | M-07 Confirmación de eliminar un widget | P-WID-01 Widgets | «Eliminar» (mensaje «Widget eliminado.») | HE-04-HU13-CA01 | — |
| T-075 | M-07 Confirmación de eliminar un widget | P-WID-01 Widgets | «Cancelar» | HE-04-HU13-CA03 | — |
| T-076 | P-WID-01 Widgets | P-DIS-01 Pantalla de edición | «Editar escritorio» | HE-05-HU01-CA01, HE-05-HU01-CA02, RT-01-CA12 | Oculta la ventana principal. |
| T-077 | P-DIS-01 Pantalla de edición | P-WID-01 Widgets | «Guardar» (mensaje «Cambios guardados.») | HE-05-HU04-CA01 | — |
| T-078 | P-DIS-01 Pantalla de edición | P-WID-01 Widgets | «Guardar» sin cambios (sin mensaje) | HE-05-HU04-CA03 | — |
| T-079 | P-DIS-01 Pantalla de edición | P-WID-01 Widgets | «Cancelar» o tecla Esc sin cambios (sin mensaje) | HE-05-HU05-CA05 | Cierra la pantalla de edición y abre la pantalla Widgets. |
| T-080 | P-DIS-01 Pantalla de edición | M-02 Confirmación de cambios sin guardar al salir | «Cancelar» o tecla Esc con cambios sin guardar | HE-05-HU05-CA01, HE-05-HU05-CA02 | «Cancelar» y Esc dan el mismo resultado (D-204). |
| T-081 | M-02 Confirmación de cambios sin guardar al salir | P-WID-01 Widgets | «Salir sin guardar» (desde la pantalla de edición) | HE-05-HU05-CA03 | Texto del mensaje: «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» |
| T-082 | M-02 Confirmación de cambios sin guardar al salir | P-DIS-01 Pantalla de edición | «Seguir editando» (desde la pantalla de edición) | HE-05-HU05-CA04 | — |
| T-083 | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | P-PLA-01 Planificador diario (pantalla principal) | Título de una tarjeta del widget Tareas del día (abre además Detalle de tarjeta) | HE-06-HU08-CA01 | — |
| T-084 | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | P-PLA-01 Planificador diario (pantalla principal) | Elemento del widget Tareas del día distinto de la tarjeta | HE-06-HU08-CA02 | — |
| T-085 | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | P-KAN-01 Tablero Kanban | Título de una tarjeta o zona del widget Kanban (abre además Detalle de tarjeta) | HE-06-HU08-CA03, HE-06-HU08-CA04 | — |
| T-086 | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | P-CAL-02 Panel del día | Día del widget Calendario | HE-06-HU08-CA05 | — |
| T-087 | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | P-CAL-01 Calendario | Encabezado del widget Calendario | HE-06-HU08-CA06 | — |
| T-088 | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | C-01 Ventana principal al frente | Elemento de un widget con la aplicación minimizada o en el área de notificación | HE-06-HU08-CA07 | — |
| T-089 | P-WAL-02 Escritorio de Windows (wallpaper y widgets) | X-03 Navegador por defecto de Windows | Titular del widget Noticias | HE-06-HU10-CA01 | — |
| T-090 | P-KAN-01 Tablero Kanban / P-CAL-01 Calendario / P-AGE-01 Agenda diaria / P-PLA-01 Planificador diario (pantalla principal) / P-REP-01 Reportes | P-TAR-01 Detalle de tarjeta | Título de una tarjeta | HE-07-HU03-CA01, RT-02-CA01, HE-10-HU03-CA04, HE-13-HU04-CA03 | RT-02-ET03 incluye Agenda diaria y Planificador diario; sin CA propio. |
| T-091 | P-TAR-01 Detalle de tarjeta | Pantalla de origen | «Cerrar» | HE-07-HU03-CA04, RT-02-CA02 | — |
| T-092 | P-TAR-01 Detalle de tarjeta | P-TAR-02 Formulario de tarjeta | «Editar» | RT-02-CA05 | Reemplaza el detalle por el formulario en modo edición. |
| T-093 | P-TAR-01 Detalle de tarjeta | M-08 Confirmación de eliminar una tarjeta | «Eliminar» | HE-07-HU05-CA01 | — |
| T-094 | M-08 Confirmación de eliminar una tarjeta | Pantalla de origen | «Eliminar» (mensaje «Tarjeta eliminada.») | HE-07-HU05-CA02 | — |
| T-095 | M-08 Confirmación de eliminar una tarjeta | P-TAR-01 Detalle de tarjeta | «Cancelar» | HE-07-HU05-CA03 | — |
| T-096 | P-TAR-02 Formulario de tarjeta | P-TAR-01 Detalle de tarjeta | «Guardar» en modo edición (mensaje «Tarjeta actualizada.») | HE-07-HU04-CA01, RT-02-CA07 | — |
| T-097 | P-TAR-02 Formulario de tarjeta | P-TAR-01 Detalle de tarjeta | «Cancelar» en modo edición | RT-02-CA06 | — |
| T-098 | P-TAR-02 Formulario de tarjeta | Pantalla de origen | «Guardar» en modo creación (mensaje «Tarjeta creada.») | HE-07-HU01-CA01, HE-07-HU01-CA02 | — |
| T-099 | P-TAR-02 Formulario de tarjeta | Pantalla de origen | «Cancelar» en modo creación | HE-07-HU01-CA11 | — |
| T-100 | P-KAN-01 Tablero Kanban | P-TAR-02 Formulario de tarjeta | «Nueva tarjeta» | HE-07-HU01-ET25 | Especificada con ET de Interfaz porque HE-07-HU01 tiene 12 CA (D-201). |
| T-101 | P-TAR-02 Formulario de tarjeta | P-ETQ-02 Formulario de etiqueta | «Nueva etiqueta» (sobre el Formulario de tarjeta) | HE-07-HU02-CA04 | — |
| T-102 | P-ETQ-02 Formulario de etiqueta | P-TAR-02 Formulario de tarjeta | Guardar o cancelar el Formulario de etiqueta abierto desde la tarjeta | HE-07-HU02-CA04 | — |
| T-103 | P-KAN-01 Tablero Kanban | P-KAN-02 Formulario de columna | «Nueva columna» | HE-09-HU03-CA08 | — |
| T-104 | P-KAN-01 Tablero Kanban | P-KAN-02 Formulario de columna | «Editar» en una columna | HE-09-HU04-CA08 | — |
| T-105 | P-KAN-02 Formulario de columna | P-KAN-01 Tablero Kanban | «Guardar» (mensajes «Columna creada.» y «Columna actualizada.») | HE-09-HU03-CA01, HE-09-HU04-CA01 | — |
| T-106 | P-KAN-02 Formulario de columna | P-KAN-01 Tablero Kanban | «Cancelar» | HE-09-HU03-CA07, HE-09-HU04-CA07 | — |
| T-107 | P-KAN-01 Tablero Kanban | M-09 Confirmación de eliminar una columna | «Eliminar» en una columna sin tarjetas | HE-09-HU06-CA01 | — |
| T-108 | M-09 Confirmación de eliminar una columna | P-KAN-01 Tablero Kanban | «Eliminar» (mensaje «Columna eliminada.») | HE-09-HU06-CA02 | — |
| T-109 | M-09 Confirmación de eliminar una columna | P-KAN-01 Tablero Kanban | «Cancelar» | HE-09-HU06-CA06 | Sin CA propio para M-09: HE-09-HU06-CA06 verifica «Cancelar» en M-13. |
| T-110 | P-ETQ-01 Etiquetas | P-ETQ-02 Formulario de etiqueta | «Nueva etiqueta» | HE-08-HU02-CA09 | — |
| T-111 | P-ETQ-01 Etiquetas | P-ETQ-02 Formulario de etiqueta | «Editar» en una etiqueta | HE-08-HU03-CA07 | — |
| T-112 | P-ETQ-02 Formulario de etiqueta | P-ETQ-01 Etiquetas | «Guardar» (mensajes «Etiqueta creada.» y «Etiqueta actualizada.») | HE-08-HU02-CA01, HE-08-HU03-CA01 | — |
| T-113 | P-ETQ-02 Formulario de etiqueta | P-ETQ-01 Etiquetas | «Cancelar» | HE-08-HU02-CA07, HE-08-HU03-CA06 | — |
| T-114 | P-ETQ-01 Etiquetas | M-10 Confirmación de eliminar una etiqueta | «Eliminar» en una etiqueta sin tarjetas asignadas | HE-08-HU04-CA01 | — |
| T-115 | M-10 Confirmación de eliminar una etiqueta | P-ETQ-01 Etiquetas | «Eliminar» (mensaje «Etiqueta eliminada.») | HE-08-HU04-CA02 | — |
| T-116 | M-10 Confirmación de eliminar una etiqueta | P-ETQ-01 Etiquetas | «Cancelar» | HE-08-HU04-CA06 | — |
| T-117 | P-CAL-01 Calendario | P-CAL-02 Panel del día | Día en la vista mensual o semanal | HE-10-HU03-CA01, HE-10-HU03-CA02 | — |
| T-118 | P-CAL-02 Panel del día | P-TAR-02 Formulario de tarjeta | «Nueva tarjeta» | HE-10-HU04-CA02 | — |
| T-119 | P-TAR-02 Formulario de tarjeta | P-CAL-02 Panel del día | «Guardar» o «Cancelar» | HE-10-HU04-CA01, HE-10-HU04-CA05 | — |
| T-120 | P-CAL-02 Panel del día | P-CAL-01 Calendario | «Cerrar» | HE-10-HU03-ET02, RT-02-CA02 | La opción «Cerrar» del Panel del día se cubre con RT-02. |
| T-121 | P-CAL-01 Calendario | P-CAL-01 Calendario | «Mes», «Semana», «Hoy», «Mes anterior», «Mes siguiente», «Semana anterior», «Semana siguiente» | HE-10-HU01-CA01, HE-10-HU02-CA01 | Cambios de vista sin cambiar de pantalla. |
| T-122 | P-AGE-01 Agenda diaria | P-AGE-01 Agenda diaria | «Día anterior», «Día siguiente», «Hoy» | HE-11-HU01-CA01 | — |
| T-123 | P-CFG-01 Configuración | M-11 Confirmación de cerrar sesión | «Cerrar sesión» sin cambios pendientes | HE-16-HU03-CA05, HE-16-HU03-ET02 | — |
| T-124 | P-CFG-01 Configuración | M-12 Confirmación de cerrar sesión con cambios sin sincronizar | «Cerrar sesión» con cambios pendientes y sin conexión | HE-16-HU03-CA03 | — |
| T-125 | M-11 Confirmación de cerrar sesión | P-CTA-01 Inicio de sesión | «Cerrar sesión» (mensaje «Sesión cerrada.») | HE-16-HU03-CA01 | — |
| T-126 | M-12 Confirmación de cerrar sesión con cambios sin sincronizar | P-CTA-01 Inicio de sesión | «Cerrar sesión» (los cambios pendientes se pierden) | HE-16-HU03-CA04 | — |
| T-127 | M-11 Confirmación de cerrar sesión / M-12 Confirmación de cerrar sesión con cambios sin sincronizar | P-CFG-01 Configuración | «Cancelar» | HE-16-HU03-CA02 | — |
| T-128 | P-CFG-01 Configuración | P-CFG-01 Configuración | Interruptor «Inicio automático» | HE-16-HU02-CA01, HE-16-HU02-CA02 | — |
| T-129 | C-01 Ventana principal (ventana principal) | P-CFG-02 Menú del ícono del área de notificación | «×» | HE-17-HU01-CA01 | La sesión y la aplicación siguen activas. |
| T-130 | P-CFG-02 Menú del ícono del área de notificación | C-01 Ventana principal (última pantalla visitada) | Ícono de la aplicación | HE-17-HU02-CA01, HE-17-HU02-CA03 | — |
| T-131 | P-CFG-02 Menú del ícono del área de notificación | C-01 Ventana principal (última pantalla visitada) | «Abrir» en el menú del ícono | HE-17-HU02-CA02 | — |
| T-132 | P-CFG-02 Menú del ícono del área de notificación | Aplicación cerrada | «Salir» en el menú del ícono | HE-17-HU03-CA01 | Restaura el fondo original de Windows. |
| T-133 | P-CFG-02 Menú del ícono del área de notificación | M-02 Confirmación de cambios sin guardar al salir | «Salir» con cambios sin guardar ni aplicar | HE-17-HU03-CA02 | — |
| T-134 | M-02 Confirmación de cambios sin guardar al salir | Aplicación cerrada | «Salir sin guardar» (desde el área de notificación) | HE-17-HU03-CA03 | — |
| T-135 | M-02 Confirmación de cambios sin guardar al salir | C-01 Ventana principal (P-WAL-01 Personalización del wallpaper) | «Seguir editando» (desde el área de notificación) | HE-17-HU03-CA04 | — |
| T-136 | Windows (inicio de sesión) | P-CTA-01 Inicio de sesión o P-PLA-01 Planificador diario (pantalla principal) | Arranque de Windows con la casilla «Abrir la aplicación al iniciar Windows» marcada | CD-02-HU02-CA01 | — |
| T-137 | P-WAL-01 Personalización del wallpaper | X-02 Explorador de archivos de Windows | «Subir imagen» | HE-02-HU03-CA01 | «Cancelar» en el Explorador de archivos cierra la ventana sin cambiar la vista previa. |
| T-138 | P-WID-05 Imagen estática | X-02 Explorador de archivos de Windows | «Subir imagen» | HE-04-HU07-CA01 | — |
| T-139 | P-WID-06 Carrusel de imágenes | X-02 Explorador de archivos de Windows | «Subir imagen» | HE-04-HU08-CA05 | — |
| T-140 | P-KAN-01 Tablero Kanban | M-13 Confirmación de eliminar una columna con tarjetas | «Eliminar» en una columna con tarjetas | HE-09-HU06-CA03, HE-09-HU06-CA07 | — |
| T-141 | M-13 Confirmación de eliminar una columna con tarjetas | P-KAN-01 Tablero Kanban | «Eliminar» (mensaje «Columna eliminada.») | HE-09-HU06-CA04 | Mueve las tarjetas a «Por hacer». |
| T-142 | M-13 Confirmación de eliminar una columna con tarjetas | P-KAN-01 Tablero Kanban | «Cancelar» | HE-09-HU06-CA06 | — |
| T-143 | P-ETQ-01 Etiquetas | M-14 Confirmación de eliminar una etiqueta asignada | «Eliminar» en una etiqueta asignada a tarjetas | HE-08-HU04-CA03, HE-08-HU04-CA04 | — |
| T-144 | M-14 Confirmación de eliminar una etiqueta asignada | P-ETQ-01 Etiquetas | «Eliminar» (mensaje «Etiqueta eliminada.») | HE-08-HU04-CA05 | — |
| T-145 | M-14 Confirmación de eliminar una etiqueta asignada | P-ETQ-01 Etiquetas | «Cancelar» | HE-08-HU04-CA06 | — |
| T-146 | P-WAL-01 Personalización del wallpaper | M-15 Confirmación de aplicar con cambios sin guardar | «Aplicar» con cambios sin guardar | HE-02-HU12-CA02 | — |
| T-147 | M-15 Confirmación de aplicar con cambios sin guardar | P-WAL-01 Personalización del wallpaper | «Cancelar» | HE-02-HU12-CA02 | El CA solo enuncia la opción «Cancelar»; ningún CA verifica su resultado. |
| T-148 | M-05 Confirmación de aplicar un tema | M-15 Confirmación de aplicar con cambios sin guardar | «Aplicar» en el mensaje de confirmación con cambios sin guardar en el tema en edición | HE-03-HU03-CA05 | — |
| T-149 | M-04 Confirmación de cambiar de tema con cambios sin guardar | P-WAL-01 Personalización del wallpaper | «Cambiar sin guardar» | HE-02-HU10-CA04 | — |
| T-150 | P-INS-01 Instalador, paso Opciones | M-17 Aviso de instalación incompleta | «Instalar» con una instalación anterior incompleta | CD-02-HU01-CA01, CD-02-HU01-CA09 | — |

## Inventario · 5. Mapa de navegación

El mapa de navegación son 26 diagramas de máquina de estados de UML 2.5, uno por hoja, generados desde las tablas de este documento (vista general y diagramas por área). Cada pantalla, ventana emergente y mensaje de confirmación es un estado con su ID y su nombre; las transiciones se escriben «evento» [condición] / acción, con el texto literal del botón. El grupo de pantallas con tarjetas, el catálogo de widgets y los pasos de Registro y de Recuperar contraseña son estados compuestos; el inicio y el fin son los pseudoestados de UML; lo que está en otro diagrama o fuera de la aplicación aparece con borde discontinuo y se indica el diagrama donde se detalla. Una transición con origen y destino iguales se escribe como transición interna dentro del estado. El menú principal aparece como referencia desde la que se llega a cada pantalla (T-037). El indicador de sincronización (P-SIN-01) es un componente del menú principal sin transiciones propias y solo figura en la vista general. Las fuentes `.dot` y los `.svg` no se incluyen en esta carpeta; las imágenes `.png` están en `img/`.

![Vista general: contenedores y menú principal](img/flujo_general.png)

![Cuenta: Inicio de sesión](img/flujo_cuenta_inicio_sesion.png)

![Cuenta: Continuar con Google](img/flujo_cuenta_google.png)

![Cuenta: Registro](img/flujo_cuenta_registro.png)

![Cuenta: Recuperar contraseña](img/flujo_cuenta_recuperar_contrasena.png)

![Landing page: descargar el instalador](img/flujo_landing_descarga.png)

![Instalador: instalar la aplicación](img/flujo_instalador_instalacion.png)

![Instalador: reinstalar y reparar](img/flujo_instalador_reinstalar_reparar.png)

![Instalador: cancelar la instalación](img/flujo_instalador_cancelar.png)

![Planificador: pantallas con tarjetas](img/flujo_planificador_tarjetas.png)

![Planificador: Detalle de tarjeta y eliminar una tarjeta](img/flujo_planificador_detalle_tarjeta.png)

![Planificador: Formulario de tarjeta](img/flujo_planificador_formulario_tarjeta.png)

![Planificador: Tablero Kanban y sus columnas](img/flujo_planificador_kanban.png)

![Planificador: Etiquetas](img/flujo_planificador_etiquetas.png)

![Planificador: Calendario y Panel del día](img/flujo_planificador_calendario.png)

![Agente de IA y Configuración](img/flujo_ia_configuracion.png)

![Personalización del wallpaper: salir con cambios sin guardar](img/flujo_personalizacion_wallpaper_salir.png)

![Personalización del wallpaper: aplicar los cambios](img/flujo_personalizacion_wallpaper_aplicar.png)

![Personalización del wallpaper: cambiar de tema, guardar como tema y subir imagen](img/flujo_personalizacion_wallpaper_tema_imagen.png)

![Personalización: Temas](img/flujo_personalizacion_temas.png)

![Personalización: Widgets](img/flujo_personalizacion_widgets.png)

![Personalización: Pantalla de edición de la distribución](img/flujo_personalizacion_distribucion.png)

![Personalización: Agregar widget y catálogo de widgets](img/flujo_personalizacion_widgets_catalogo.png)

![Escritorio de Windows: de los widgets a la aplicación](img/flujo_escritorio.png)

![Área de notificación: abrir y salir](img/flujo_notificacion.png)

![Área de notificación: salir con cambios sin guardar](img/flujo_notificacion_salir_con_cambios.png)

## Inventario · 6. Mensajes literales por pantalla

El tipo sigue los seis de RT-04 (resultado, campo, opción deshabilitada, aviso, confirmación, estado vacío). Cada mensaje se cita una vez por pantalla con los CA donde aparece.

| Pantalla | Mensaje o texto literal | Tipo | CA |
|---|---|---|---|
| P-CTA-01 Inicio de sesión | «Correo electrónico o contraseña incorrectos.» | resultado | HE-01-HU04-CA08 |
| P-CTA-01 Inicio de sesión | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | aviso | HE-01-HU04-CA09 |
| P-CTA-01 Inicio de sesión | «Diligencia un correo electrónico válido.» | campo | HE-01-HU04-CA06 |
| P-CTA-01 Inicio de sesión | «El correo electrónico no puede superar los 64 caracteres.» | campo | HE-01-HU04-CA07 |
| P-CTA-01 Inicio de sesión | «Este campo es obligatorio.» | campo | HE-01-HU04-CA03, HE-01-HU04-CA04, HE-01-HU04-CA05 |
| P-CTA-01 Inicio de sesión | «No fue posible iniciar sesión con Google. Intenta de nuevo.» | aviso | HE-01-HU05-CA06 |
| P-CTA-01 Inicio de sesión | «No hay conexión a internet. Conéctate para iniciar sesión.» | aviso | HE-01-HU04-CA10 |
| P-CTA-01 Inicio de sesión | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso | RT-04-CA13 |
| P-CTA-01 Inicio de sesión | «No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.» | aviso | HE-01-HU05-CA08 |
| P-CTA-01 Inicio de sesión | «Se canceló el inicio de sesión con Google.» | aviso | HE-01-HU05-CA05 |
| P-CTA-01 Inicio de sesión | «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.» | resultado | HE-01-HU05-CA01, HE-01-HU05-CA03, HE-01-HU05-CA04 |
| P-CTA-02 Registro | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | aviso | HE-01-HU03-CA05 |
| P-CTA-02 Registro | «Diligencia un correo electrónico válido.» | campo | HE-01-HU01-CA06 |
| P-CTA-02 Registro | «El alias no puede superar los 30 caracteres.» | campo | HE-01-HU01-CA03 |
| P-CTA-02 Registro | «El correo electrónico no puede superar los 64 caracteres.» | campo | HE-01-HU01-CA07 |
| P-CTA-02 Registro | «El código no es correcto. Revísalo e intenta de nuevo.» | campo | HE-01-HU03-CA03 |
| P-CTA-02 Registro | «El código venció. Solicita uno nuevo.» | campo | HE-01-HU03-CA04 |
| P-CTA-02 Registro | «Este campo es obligatorio.» | campo | HE-01-HU01-CA02, HE-01-HU01-CA05, HE-01-HU02-CA02 (+3) |
| P-CTA-02 Registro | «Este correo electrónico ya está registrado.» | resultado | HE-01-HU01-CA08 |
| P-CTA-02 Registro | «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» | campo | HE-01-HU02-CA04, HE-01-HU02-CA05, HE-01-HU02-CA06 |
| P-CTA-02 Registro | «Las contraseñas no coinciden.» | campo | HE-01-HU02-CA08 |
| P-CTA-02 Registro | «No hay conexión a internet. Conéctate para crear tu cuenta.» | opción deshabilitada | HE-01-HU01-CA12, HE-01-HU03-CA09 |
| P-CTA-02 Registro | «Puedes pedir un nuevo código en <segundos restantes> s.» | opción deshabilitada | HE-01-HU03-CA07 |
| P-CTA-02 Registro | «Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.» | resultado | HE-01-HU01-CA01 |
| P-CTA-02 Registro | «Te enviamos un nuevo código.» | resultado | HE-01-HU03-CA06 |
| P-CTA-02 Registro | «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.» | resultado | HE-01-HU03-CA01 |
| P-CTA-03 Recuperar contraseña | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | aviso | HE-01-HU07-CA05 |
| P-CTA-03 Recuperar contraseña | «Diligencia un correo electrónico válido.» | campo | HE-01-HU06-CA04 |
| P-CTA-03 Recuperar contraseña | «El correo electrónico no puede superar los 64 caracteres.» | campo | HE-01-HU06-CA05 |
| P-CTA-03 Recuperar contraseña | «El código no es correcto. Revísalo e intenta de nuevo.» | campo | HE-01-HU07-CA03 |
| P-CTA-03 Recuperar contraseña | «El código venció. Solicita uno nuevo.» | campo | HE-01-HU07-CA04 |
| P-CTA-03 Recuperar contraseña | «Elige una contraseña distinta de la actual.» | campo | HE-01-HU08-CA07 |
| P-CTA-03 Recuperar contraseña | «Este campo es obligatorio.» | campo | HE-01-HU06-CA03, HE-01-HU07-CA02, HE-01-HU08-CA02 |
| P-CTA-03 Recuperar contraseña | «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» | campo | HE-01-HU08-CA03 |
| P-CTA-03 Recuperar contraseña | «Las contraseñas no coinciden.» | campo | HE-01-HU08-CA04 |
| P-CTA-03 Recuperar contraseña | «No hay conexión a internet. Conéctate para recuperar tu contraseña.» | opción deshabilitada | HE-01-HU06-CA06, HE-01-HU07-CA09, HE-01-HU08-CA05 (+1) |
| P-CTA-03 Recuperar contraseña | «Puedes pedir un nuevo código en <segundos restantes> s.» | opción deshabilitada | HE-01-HU07-CA07 |
| P-CTA-03 Recuperar contraseña | «Si el correo está registrado, te enviamos un código de verificación.» | aviso | HE-01-HU06-CA01, HE-01-HU06-CA02 |
| P-CTA-03 Recuperar contraseña | «Te enviamos un nuevo código.» | resultado | HE-01-HU07-CA06 |
| P-CTA-03 Recuperar contraseña | «Tu contraseña fue actualizada. Ya puedes iniciar sesión.» | resultado | HE-01-HU08-CA01 |
| P-WAL-01 Personalización del wallpaper | «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.» | opción deshabilitada | HE-03-HU02-CA05 |
| P-WAL-01 Personalización del wallpaper | «Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?» | confirmación | HE-02-HU13-CA05, RT-01-CA09 |
| P-WAL-01 Personalización del wallpaper | «Cambios aplicados. Recuerda guardarlos para no perderlos.» | resultado | HE-02-HU12-CA04 |
| P-WAL-01 Personalización del wallpaper | «Cambios guardados en el tema “<nombre del tema>”.» | resultado | HE-02-HU11-CA01 |
| P-WAL-01 Personalización del wallpaper | «Cambios guardados. Selecciona Aplicar para verlos en tu escritorio.» | resultado | HE-02-HU11-CA02 |
| P-WAL-01 Personalización del wallpaper | «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).» | campo | HE-02-HU05-CA03 |
| P-WAL-01 Personalización del wallpaper | «El contraste de estos colores es bajo (<contraste>:1). Prueba con <color sugerido>.» | resultado | HE-02-HU05-CA05 |
| P-WAL-01 Personalización del wallpaper | «Esta plantilla ya muestra su imagen de fondo por defecto.» | opción deshabilitada | HE-02-HU04-CA02 |
| P-WAL-01 Personalización del wallpaper | «Este campo es obligatorio.» | campo | HE-02-HU05-CA04 |
| P-WAL-01 Personalización del wallpaper | «Este tema ya está aplicado.» | opción deshabilitada | HE-02-HU12-CA06 |
| P-WAL-01 Personalización del wallpaper | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» | campo | HE-02-HU03-CA05 |
| P-WAL-01 Personalización del wallpaper | «La imagen supera el tamaño máximo de 20 MB.» | campo | HE-02-HU03-CA06 |
| P-WAL-01 Personalización del wallpaper | «No hay cambios para guardar.» | opción deshabilitada | HE-02-HU11-CA03 |
| P-WAL-01 Personalización del wallpaper | «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» | aviso | HE-02-HU03-CA07 |
| P-WAL-01 Personalización del wallpaper | «No se guardaron cambios.» | resultado | HE-02-HU13-CA01 |
| P-WAL-01 Personalización del wallpaper | «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.» | resultado | HE-15-HU04-CA08 |
| P-WAL-01 Personalización del wallpaper | «Tema “<nombre del tema>” aplicado.» | resultado | HE-02-HU12-CA01 |
| P-WAL-01 Personalización del wallpaper | «Tema “<nombre del tema>” guardado y aplicado.» | resultado | HE-02-HU12-CA03 |
| P-WAL-01 Personalización del wallpaper | «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?» | aviso | HE-02-HU10-CA03 |
| P-WAL-01 Personalización del wallpaper | «Tienes cambios sin guardar en el tema “<nombre del tema>”. ¿Qué deseas hacer?» | confirmación | HE-02-HU12-CA02 |
| P-WAL-01 Personalización del wallpaper | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» | confirmación | HE-02-HU13-CA02, RT-01-CA08 |
| P-TEM-01 Temas | «Este tema ya está aplicado.» | opción deshabilitada | HE-03-HU03-CA03 |
| P-TEM-01 Temas | «Guarda otra personalización con “Guardar como tema” para tener más temas.» | campo | HE-03-HU01-CA02 |
| P-TEM-01 Temas | «No puedes eliminar el tema aplicado. Aplica otro tema primero.» | opción deshabilitada | HE-03-HU05-CA02 |
| P-TEM-01 Temas | «Se reemplazará la personalización actual por la del tema “<nombre del tema>”. ¿Deseas aplicarlo?» | resultado | HE-03-HU03-CA06 |
| P-TEM-01 Temas | «Tema eliminado.» | resultado | HE-03-HU05-CA01 |
| P-TEM-01 Temas | «Tema “<nombre del tema>” aplicado.» | resultado | HE-03-HU03-CA01, HE-03-HU03-CA04 |
| P-TEM-01 Temas | «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Qué deseas hacer?» | aviso | HE-03-HU03-CA05 |
| P-TEM-01 Temas | «¿Deseas eliminar el tema “<nombre del tema>”? Esta acción no se puede deshacer.» | confirmación | RT-04-CA08 |
| P-TEM-02 Guardar como tema | «El nombre no puede superar los 40 caracteres.» | campo | HE-03-HU02-CA03 |
| P-TEM-02 Guardar como tema | «Tema “<nombre del tema>” guardado.» | resultado | HE-03-HU02-CA01 |
| P-TEM-02 Guardar como tema | «Ya existe un tema con ese nombre. Elige otro.» | resultado | HE-03-HU02-CA04 |
| P-TEM-03 Renombrar tema | «El nombre no puede superar los 40 caracteres.» | campo | HE-03-HU04-CA03 |
| P-TEM-03 Renombrar tema | «Tema renombrado.» | resultado | HE-03-HU04-CA01, HE-03-HU04-CA06 |
| P-TEM-03 Renombrar tema | «Ya existe un tema con ese nombre. Elige otro.» | resultado | HE-03-HU04-CA04 |
| P-WID-01 Widgets | «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» | opción deshabilitada | HE-04-HU13-CA02 |
| P-WID-01 Widgets | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | campo | HE-04-HU12-CA04 |
| P-WID-01 Widgets | «Widget eliminado.» | resultado | HE-04-HU13-CA01, HE-04-HU13-CA04, HE-04-HU13-CA05 |
| P-WID-01 Widgets | «Ya tienes un widget Clima para esa ciudad.» | campo | HE-04-HU12-CA05 |
| P-WID-01 Widgets | «¿Deseas eliminar el widget “<nombre del widget>”? Se quitará de todos tus temas.» | confirmación | HE-04-HU13-CA06 |
| P-WID-02 Agregar widget | «Ya agregaste este widget.» | opción deshabilitada | HE-04-HU04-CA02, RT-04-CA05 |
| P-WID-03 Clima | «Este campo es obligatorio.» | campo | RT-04-CA12 |
| P-WID-03 Clima | «La ciudad no puede superar los 100 caracteres.» | campo | HE-04-HU05-CA09 |
| P-WID-03 Clima | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | campo | HE-04-HU05-CA04 |
| P-WID-03 Clima | «No pudimos cargar el clima. Intenta de nuevo más tarde.» | aviso | HE-04-HU05-CA07 |
| P-WID-03 Clima | «Sin conexión. El widget se actualizará al reconectarte.» | estado vacío | HE-04-HU05-CA08 |
| P-WID-03 Clima | «Ya tienes un widget Clima para esa ciudad.» | campo | HE-04-HU05-CA05 |
| P-WID-04 Noticias | «No pudimos cargar las noticias. Intenta de nuevo más tarde.» | aviso | HE-04-HU06-CA03 |
| P-WID-04 Noticias | «Sin conexión. El widget se actualizará al reconectarte.» | estado vacío | HE-04-HU06-CA04 |
| P-WID-05 Imagen estática | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» | campo | HE-04-HU07-CA03 |
| P-WID-05 Imagen estática | «La imagen supera el tamaño máximo de 20 MB.» | campo | HE-04-HU07-CA04 |
| P-WID-06 Carrusel de imágenes | «El intervalo debe estar entre 3 y 60 segundos.» | campo | HE-04-HU08-CA07 |
| P-WID-06 Carrusel de imágenes | «Este campo es obligatorio.» | campo | HE-04-HU08-CA08 |
| P-WID-06 Carrusel de imágenes | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» | campo | HE-04-HU08-CA05 |
| P-WID-06 Carrusel de imágenes | «La imagen supera el tamaño máximo de 20 MB.» | campo | HE-04-HU08-CA06 |
| P-WID-06 Carrusel de imágenes | «Puedes agregar máximo 10 imágenes al carrusel.» | opción deshabilitada | HE-04-HU08-CA04 |
| P-WID-06 Carrusel de imágenes | «Selecciona al menos 2 imágenes para el carrusel.» | opción deshabilitada | HE-04-HU08-CA03 |
| P-WID-07 Animación | «En pausa por alto consumo de recursos.» | resultado | HE-04-HU09-CA04 |
| P-WID-08 Texto | «El texto no puede superar los 200 caracteres.» | campo | HE-04-HU10-CA03 |
| P-WID-09 Reproductor de música | «No hay música en reproducción.» | opción deshabilitada | HE-04-HU11-CA03 |
| P-WID-10 Formulario de widget | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | campo | HE-04-HU12-CA04 |
| P-WID-10 Formulario de widget | «Ya tienes un widget Clima para esa ciudad.» | campo | HE-04-HU12-CA05 |
| P-DIS-01 Pantalla de edición | «Cambios guardados.» | resultado | HE-05-HU04-CA01, HE-05-HU04-CA02, HE-05-HU04-CA04 |
| P-DIS-01 Pantalla de edición | «No se guardaron cambios.» | resultado | HE-05-HU05-CA03 |
| P-DIS-01 Pantalla de edición | «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.» | resultado | HE-15-HU04-CA08 |
| P-DIS-01 Pantalla de edición | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» | confirmación | HE-05-HU05-CA01, HE-05-HU05-CA02 |
| P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «No pudimos cargar las noticias. Intenta de nuevo más tarde.» | aviso | RT-04-CA06 |
| P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.» | aviso | HE-02-HU01-CA04 |
| P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «No tienes tarjetas para hoy.» | estado vacío | HE-06-HU02-CA05 |
| P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «Sin conexión. El widget se actualizará al reconectarte.» | estado vacío | HE-15-HU02-CA06 |
| P-WAL-02 Escritorio de Windows (wallpaper y widgets) | «Tu tablero no tiene tarjetas.» | estado vacío | HE-06-HU05-CA04 |
| P-TAR-01 Detalle de tarjeta | «Tarjeta eliminada.» | resultado | HE-07-HU05-CA02 |
| P-TAR-01 Detalle de tarjeta | «¿Deseas eliminar la tarjeta “<título de la tarjeta>”? Esta acción no se puede deshacer.» | confirmación | HE-07-HU05-CA01 |
| P-TAR-02 Formulario de tarjeta | «Aún no tienes etiquetas.» | estado vacío | HE-07-HU02-CA03 |
| P-TAR-02 Formulario de tarjeta | «Diligencia una fecha válida.» | campo | HE-07-HU01-CA08, RT-04-CA03 |
| P-TAR-02 Formulario de tarjeta | «El título no puede superar los 100 caracteres.» | campo | HE-07-HU01-CA06, HE-07-HU04-CA05 |
| P-TAR-02 Formulario de tarjeta | «Esta tarjeta ya no existe.» | resultado | HE-07-HU04-CA11 |
| P-TAR-02 Formulario de tarjeta | «Este campo es obligatorio.» | campo | HE-07-HU01-CA04, HE-07-HU01-CA05, HE-07-HU01-CA07 (+4) |
| P-TAR-02 Formulario de tarjeta | «La descripción no puede superar los 1000 caracteres.» | campo | HE-07-HU01-CA10, HE-07-HU04-CA08 |
| P-TAR-02 Formulario de tarjeta | «La fecha límite no puede ser anterior a hoy.» | campo | HE-07-HU01-CA09, HE-07-HU04-CA07 |
| P-TAR-02 Formulario de tarjeta | «Puedes asignar máximo 5 etiquetas por tarjeta.» | opción deshabilitada | HE-07-HU02-CA02 |
| P-TAR-02 Formulario de tarjeta | «Tarjeta actualizada.» | resultado | HE-07-HU04-CA01, HE-07-HU04-CA03 |
| P-TAR-02 Formulario de tarjeta | «Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.» | resultado | HE-07-HU04-CA10 |
| P-TAR-02 Formulario de tarjeta | «Tarjeta creada.» | resultado | HE-07-HU01-CA01, HE-07-HU01-CA02, HE-07-HU01-CA12 (+2) |
| P-ETQ-01 Etiquetas | «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.» | opción deshabilitada | HE-08-HU02-CA06 |
| P-ETQ-01 Etiquetas | «Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.» | estado vacío | HE-08-HU01-CA02, RT-04-CA10 |
| P-ETQ-01 Etiquetas | «Etiqueta eliminada.» | resultado | HE-08-HU04-CA02, HE-08-HU04-CA05 |
| P-ETQ-01 Etiquetas | «La etiqueta “<nombre de la etiqueta>” está asignada a 1 tarjeta. Se quitará de ella, pero la tarjeta no se eliminará. ¿Deseas continuar?» | resultado | HE-08-HU04-CA04 |
| P-ETQ-01 Etiquetas | «La etiqueta “<nombre de la etiqueta>” está asignada a <cantidad> tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?» | resultado | HE-08-HU04-CA03 |
| P-ETQ-01 Etiquetas | «¿Deseas eliminar la etiqueta “<nombre de la etiqueta>”? Esta acción no se puede deshacer.» | confirmación | HE-08-HU04-CA01 |
| P-ETQ-02 Formulario de etiqueta | «El nombre de la etiqueta no puede superar los 30 caracteres.» | campo | HE-08-HU02-CA03, HE-08-HU03-CA03 |
| P-ETQ-02 Formulario de etiqueta | «Este campo es obligatorio.» | campo | HE-08-HU02-CA02, HE-08-HU02-CA05, HE-08-HU03-CA02 (+1) |
| P-ETQ-02 Formulario de etiqueta | «Etiqueta actualizada.» | resultado | HE-08-HU03-CA01 |
| P-ETQ-02 Formulario de etiqueta | «Etiqueta creada.» | campo | HE-08-HU02-CA01, HE-08-HU02-CA08 |
| P-ETQ-02 Formulario de etiqueta | «Ya existe una etiqueta con ese nombre.» | resultado | HE-08-HU02-CA04, HE-08-HU03-CA04 |
| P-KAN-01 Tablero Kanban | «Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.» | opción deshabilitada | HE-09-HU03-CA06 |
| P-KAN-01 Tablero Kanban | «Columna eliminada.» | resultado | HE-09-HU06-CA02, HE-09-HU06-CA04 |
| P-KAN-01 Tablero Kanban | «La columna “Revisión” tiene 3 tarjetas. Se moverán a “Por hacer”. ¿Deseas continuar?» | resultado | HE-09-HU06-CA03 |
| P-KAN-01 Tablero Kanban | «Las columnas por defecto no se pueden eliminar.» | opción deshabilitada | HE-09-HU06-CA05 |
| P-KAN-01 Tablero Kanban | «No hay tarjetas en esta columna.» | estado vacío | HE-09-HU01-CA01, HE-09-HU01-CA03 |
| P-KAN-01 Tablero Kanban | «¿Deseas eliminar la columna “Revisión”? Esta acción no se puede deshacer.» | confirmación | HE-09-HU06-CA01 |
| P-KAN-02 Formulario de columna | «Columna actualizada.» | resultado | HE-09-HU04-CA01, HE-09-HU04-CA02 |
| P-KAN-02 Formulario de columna | «Columna creada.» | resultado | HE-09-HU03-CA01, HE-09-HU03-CA02 |
| P-KAN-02 Formulario de columna | «El nombre de la columna no puede superar los 30 caracteres.» | campo | HE-09-HU03-CA04, HE-09-HU04-CA05 |
| P-KAN-02 Formulario de columna | «Este campo es obligatorio.» | campo | HE-09-HU03-CA03, HE-09-HU04-CA04 |
| P-KAN-02 Formulario de columna | «Ya existe una columna con ese nombre.» | resultado | HE-09-HU03-CA05, HE-09-HU04-CA06 |
| P-CAL-01 Calendario | «No tienes tarjetas para este día.» | estado vacío | HE-10-HU03-CA03 |
| P-CAL-02 Panel del día | «No puedes crear tarjetas en días pasados.» | opción deshabilitada | HE-10-HU04-CA04 |
| P-AGE-01 Agenda diaria | «No puedes asignar tarjetas a un bloque horario que ya pasó.» | resultado | HE-11-HU02-CA04 |
| P-AGE-01 Agenda diaria | «No puedes programar la tarjeta después de su fecha límite.» | resultado | HE-11-HU02-CA05 |
| P-AGE-01 Agenda diaria | «No tienes tarjetas pendientes por programar.» | estado vacío | HE-11-HU01-CA04 |
| P-AGE-01 Agenda diaria | «Tarjeta asignada al bloque 10:00 – 11:00.» | resultado | HE-11-HU02-CA01 |
| P-AGE-01 Agenda diaria | «Tarjeta asignada al bloque 12:00 – 13:00.» | resultado | HE-11-HU02-CA03 |
| P-AGE-01 Agenda diaria | «Tarjeta quitada del horario.» | resultado | HE-11-HU03-CA01, RT-04-CA09 |
| P-PLA-01 Planificador diario (pantalla principal) | «No tienes tarjetas para hoy.» | estado vacío | HE-12-HU01-CA03, HE-12-HU03-CA05 |
| P-PLA-01 Planificador diario (pantalla principal) | «¡Bien hecho! Tarjeta completada.» | resultado | HE-12-HU02-CA01 |
| P-PLA-01 Planificador diario (pantalla principal) | «¡Completaste todas tus tarjetas de hoy!» | resultado | HE-12-HU03-CA04 |
| P-REP-01 Reportes | «Aún no tienes etiquetas.» | opción deshabilitada | HE-13-HU05-CA05 |
| P-REP-01 Reportes | «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.» | estado vacío | HE-13-HU02-CA05 |
| P-REP-01 Reportes | «Diligencia una fecha válida.» | campo | HE-13-HU01-CA07, HE-13-HU01-CA08 |
| P-REP-01 Reportes | «El rango máximo es de un año.» | resultado | HE-13-HU01-CA06 |
| P-REP-01 Reportes | «Este campo es obligatorio.» | campo | HE-13-HU01-CA04, HE-13-HU01-CA05 |
| P-REP-01 Reportes | «La fecha de inicio no puede ser posterior a la fecha de fin.» | campo | HE-13-HU01-CA03 |
| P-REP-01 Reportes | «Mostrando datos desde el 10/10/2026, cuando creaste tu primera tarjeta.» | campo | HE-13-HU02-CA06 |
| P-REP-01 Reportes | «No hay datos para este rango de fechas y estos filtros.» | estado vacío | HE-13-HU02-CA07, HE-13-HU03-CA05, HE-13-HU04-CA04 (+1) |
| P-IA-01 Agente de IA | «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» | opción deshabilitada | HE-14-HU01-CA07 |
| P-IA-01 Agente de IA | «Esta acción no se puede deshacer.» | resultado | HE-14-HU07-CA01, HE-14-HU07-CA02, HE-14-HU07-CA06 |
| P-IA-01 Agente de IA | «Esta tarjeta está completada. Editarla no cambia su columna.» | resultado | HE-14-HU05-CA06 |
| P-IA-01 Agente de IA | «Esta tarjeta está completada. Si la eliminas, dejará de contar en tus reportes.» | resultado | HE-14-HU07-CA06 |
| P-IA-01 Agente de IA | «Esta tarjeta está completada. Si la mueves, dejará de estar completada y se borrará su fecha de completado.» | resultado | HE-14-HU06-CA06 |
| P-IA-01 Agente de IA | «No pude responder en este momento. Intenta de nuevo.» | aviso | HE-14-HU01-CA08 |
| P-IA-01 Agente de IA | «Se perdió la conexión. No se hizo ningún cambio.» | resultado | HE-14-HU03-CA02, HE-14-HU04-CA07 |
| P-IA-01 Agente de IA | «Tu mensaje no puede superar los 2000 caracteres.» | opción deshabilitada | HE-14-HU01-CA05 |
| P-CFG-01 Configuración | «Error de sincronización. Reintentaremos automáticamente.» | aviso | HE-16-HU01-CA05 |
| P-CFG-01 Configuración | «Inicio automático activado.» | resultado | HE-16-HU02-CA02 |
| P-CFG-01 Configuración | «Inicio automático desactivado.» | resultado | HE-16-HU02-CA01 |
| P-CFG-01 Configuración | «No pudimos cambiar el inicio automático. Intenta de nuevo.» | aviso | HE-16-HU02-CA05 |
| P-CFG-01 Configuración | «Sesión cerrada.» | resultado | HE-16-HU03-CA01, HE-16-HU03-CA04 |
| P-CFG-01 Configuración | «Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?» | aviso | HE-16-HU03-CA03 |
| P-CFG-01 Configuración | «¿Deseas cerrar sesión?» | confirmación | HE-16-HU03-CA05 |
| P-SIN-01 Indicador de sincronización | «Algunas tarjetas se actualizaron con cambios más recientes de otro computador.» | resultado | HE-15-HU03-CA02, HE-15-HU03-CA05, HE-15-HU03-CA06 |
| P-SIN-01 Indicador de sincronización | «Error de sincronización. Reintentaremos automáticamente.» | aviso | HE-15-HU01-CA03, HE-16-HU01-CA05 |
| P-SIN-01 Indicador de sincronización | «Estás sin conexión. Tus cambios se guardarán y se sincronizarán al reconectarte.» | resultado | HE-15-HU02-CA01 |
| P-SIN-01 Indicador de sincronización | «Tus cambios se sincronizaron.» | resultado | HE-15-HU03-CA01 |
| P-CFG-02 Menú del ícono del área de notificación | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» | confirmación | HE-17-HU03-CA02 |
| P-LAN-01 Landing page | «Es posible que tu equipo no cumpla los requisitos. El instalador lo comprobará antes de instalar.» | resultado | CD-01-HU01-CA03 |
| P-LAN-01 Landing page | «No pudimos iniciar la descarga. Intenta de nuevo.» | aviso | CD-01-HU02-CA02 |
| P-INS-01 Instalador, paso Opciones | «El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page.» | resultado | CD-02-HU01-CA12 |
| P-INS-01 Instalador, paso Opciones | «Encontramos una instalación incompleta. Vamos a repararla.» | aviso | CD-02-HU01-CA09 |
| P-INS-01 Instalador, paso Opciones | «Este computador no es compatible. Necesitas Windows 10 versión 22H2 o Windows 11, de 64 bits (x64).» | resultado | CD-02-HU01-CA03 |
| P-INS-01 Instalador, paso Opciones | «Instalación completada.» | resultado | CD-02-HU01-CA01, CD-02-HU01-CA06, CD-02-HU01-CA10 |
| P-INS-01 Instalador, paso Opciones | «No hay suficiente espacio en disco. Libera al menos 500 MB e intenta de nuevo.» | opción deshabilitada | CD-02-HU01-CA04 |
| P-INS-01 Instalador, paso Opciones | «No pudimos completar la instalación. No se hicieron cambios en tu computador.» | aviso | CD-02-HU01-CA08 |
| P-INS-01 Instalador, paso Opciones | «Windgets ya está instalada. ¿Deseas reinstalarla?» | confirmación | CD-02-HU01-CA05 |
| P-INS-01 Instalador, paso Opciones | «Ya puedes eliminar el archivo del instalador que descargaste.» | resultado | CD-02-HU01-CA01 |
| P-INS-01 Instalador, paso Opciones | «¿Deseas cancelar la instalación?» | confirmación | CD-02-HU03-CA04 |
| P-INS-02 Instalador, paso Instalación en curso | «La instalación se canceló.» | resultado | CD-02-HU03-CA02 |
| P-INS-02 Instalador, paso Instalación en curso | «¿Deseas cancelar la instalación?» | confirmación | CD-02-HU03-CA01 |

## Inventario · 7. Correspondencia pantalla, HU y CA

Cada pantalla se asocia con las HU y los CA cuyo Dado la nombra como ruta o contexto (y, para las ventanas emergentes, con los que declaran la ventana abierta). El indicador de sincronización se asocia además con los CA que lo mencionan. Un CA puede aparecer en más de una pantalla (por ejemplo, el de una ventana emergente aparece también en la pantalla donde se abre).

| Pantalla | HU | CA |
|---|---|---|
| P-CTA-01 Inicio de sesión | HE-01-HU04, HE-01-HU05, HE-15-HU04, RT-01, RT-04 | HE-01-HU04 (CA01, CA03 a CA12); HE-01-HU05 (CA01 a CA08); HE-15-HU04 (CA02); RT-01 (CA01, CA02, CA10); RT-04 (CA13, CA14) |
| P-CTA-02 Registro | HE-01-HU01, HE-01-HU02, HE-01-HU03, HE-01-HU05, RT-01, RT-03 | HE-01-HU01 (CA01 a CA12); HE-01-HU02 (CA01 a CA08); HE-01-HU03 (CA01 a CA09); HE-01-HU05 (CA07, CA09); RT-01 (CA03); RT-03 (CA07) |
| P-CTA-03 Recuperar contraseña | HE-01-HU06, HE-01-HU07, HE-01-HU08, RT-03 | HE-01-HU06 (CA01 a CA07); HE-01-HU07 (CA01 a CA09); HE-01-HU08 (CA01 a CA07); RT-03 (CA06) |
| P-WAL-01 Personalización del wallpaper | HE-02-HU02, HE-02-HU03, HE-02-HU04, HE-02-HU05, HE-02-HU06, HE-02-HU07, HE-02-HU08, HE-02-HU09, HE-02-HU10, HE-02-HU11, HE-02-HU12, HE-02-HU13, HE-03-HU02, HE-03-HU06, HE-15-HU04, RT-01 | HE-02-HU02 (CA01, CA02); HE-02-HU03 (CA01 a CA08); HE-02-HU04 (CA01, CA02); HE-02-HU05 (CA01 a CA05); HE-02-HU06 (CA01, CA02); HE-02-HU07 (CA01, CA02); HE-02-HU08 (CA01, CA02); HE-02-HU09 (CA01, CA02); HE-02-HU10 (CA01 a CA06); HE-02-HU11 (CA01 a CA05); HE-02-HU12 (CA01 a CA11); HE-02-HU13 (CA01 a CA09); HE-03-HU02 (CA01 a CA07); HE-03-HU06 (CA02, CA04); HE-15-HU04 (CA08); RT-01 (CA08, CA09) |
| P-TEM-01 Temas | HE-03-HU01, HE-03-HU03, HE-03-HU04, HE-03-HU05, HE-03-HU06, RT-04 | HE-03-HU01 (CA01 a CA04); HE-03-HU03 (CA01 a CA06); HE-03-HU04 (CA01 a CA07); HE-03-HU05 (CA01 a CA03); HE-03-HU06 (CA05); RT-04 (CA08) |
| P-TEM-02 Guardar como tema | HE-03-HU02 | HE-03-HU02 (CA01 a CA04, CA06) |
| P-TEM-03 Renombrar tema | HE-03-HU04 | HE-03-HU04 (CA01 a CA06) |
| P-WID-01 Widgets | HE-04-HU01, HE-04-HU02, HE-04-HU04, HE-04-HU12, HE-04-HU13, HE-05-HU01, RT-01 | HE-04-HU01 (CA01 a CA03); HE-04-HU02 (CA01, CA02); HE-04-HU04 (CA01); HE-04-HU12 (CA01 a CA05); HE-04-HU13 (CA01 a CA06); HE-05-HU01 (CA01, CA02); RT-01 (CA12) |
| P-WID-02 Agregar widget | HE-04-HU04, RT-03, RT-04 | HE-04-HU04 (CA02); RT-03 (CA01); RT-04 (CA05) |
| P-WID-03 Clima | HE-04-HU05, RT-03, RT-04 | HE-04-HU05 (CA01 a CA09); RT-03 (CA02 a CA05); RT-04 (CA12) |
| P-WID-04 Noticias | HE-04-HU06 | HE-04-HU06 (CA01 a CA04) |
| P-WID-05 Imagen estática | HE-04-HU07 | HE-04-HU07 (CA01 a CA06) |
| P-WID-06 Carrusel de imágenes | HE-04-HU08 | HE-04-HU08 (CA01 a CA08) |
| P-WID-07 Animación | HE-04-HU09 | HE-04-HU09 (CA01 a CA05) |
| P-WID-08 Texto | HE-04-HU10 | HE-04-HU10 (CA01 a CA04) |
| P-WID-09 Reproductor de música | HE-04-HU11 | HE-04-HU11 (CA01 a CA06) |
| P-WID-10 Formulario de widget | HE-04-HU12 | HE-04-HU12 (CA01 a CA05) |
| P-DIS-01 Pantalla de edición | HE-05-HU02, HE-05-HU03, HE-05-HU04, HE-05-HU05, HE-15-HU04 | HE-05-HU02 (CA01 a CA03); HE-05-HU03 (CA01 a CA04); HE-05-HU04 (CA01 a CA04); HE-05-HU05 (CA01 a CA05); HE-15-HU04 (CA08) |
| P-WAL-02 Escritorio de Windows (wallpaper y widgets) | HE-01-HU04, HE-02-HU01, HE-04-HU03, HE-05-HU02, HE-05-HU03, HE-06-HU01, HE-06-HU02, HE-06-HU03, HE-06-HU04, HE-06-HU05, HE-06-HU06, HE-06-HU07, HE-06-HU08, HE-06-HU09, HE-06-HU10, HE-15-HU02, HE-15-HU04, HE-17-HU01, HE-17-HU02, HE-17-HU03, RT-01, RT-04 | HE-01-HU04 (CA02); HE-02-HU01 (CA01 a CA06); HE-04-HU03 (CA01); HE-05-HU02 (CA04); HE-05-HU03 (CA05); HE-06-HU01 (CA01 a CA07); HE-06-HU02 (CA01 a CA06); HE-06-HU03 (CA01 a CA04); HE-06-HU04 (CA01 a CA05); HE-06-HU05 (CA01 a CA04); HE-06-HU06 (CA01 a CA05); HE-06-HU07 (CA01); HE-06-HU08 (CA01 a CA07); HE-06-HU09 (CA01); HE-06-HU10 (CA01); HE-15-HU02 (CA04, CA06); HE-15-HU04 (CA01, CA03 a CA07); HE-17-HU01 (CA01, CA02); HE-17-HU02 (CA01 a CA03); HE-17-HU03 (CA01 a CA04); RT-01 (CA04, CA05); RT-04 (CA06, CA07) |
| P-TAR-01 Detalle de tarjeta | HE-07-HU03, HE-07-HU05, RT-02 | HE-07-HU03 (CA04); HE-07-HU05 (CA01 a CA03); RT-02 (CA02, CA05, CA08, CA09) |
| P-TAR-02 Formulario de tarjeta | HE-07-HU01, HE-07-HU02, HE-07-HU04, HE-10-HU04, RT-02, RT-04 | HE-07-HU01 (CA01 a CA12); HE-07-HU02 (CA01 a CA05); HE-07-HU04 (CA01 a CA11); HE-10-HU04 (CA01, CA03, CA05); RT-02 (CA03, CA04, CA06, CA07); RT-04 (CA01, CA03, CA04) |
| P-ETQ-01 Etiquetas | HE-08-HU01, HE-08-HU02, HE-08-HU03, HE-08-HU04, HE-13-HU05, RT-04 | HE-08-HU01 (CA01 a CA03); HE-08-HU02 (CA01 a CA09); HE-08-HU03 (CA01 a CA07); HE-08-HU04 (CA01 a CA06); HE-13-HU05 (CA06, CA07); RT-04 (CA10) |
| P-ETQ-02 Formulario de etiqueta | HE-08-HU02, HE-08-HU03 | HE-08-HU02 (CA01 a CA05, CA07, CA08); HE-08-HU03 (CA01 a CA06) |
| P-KAN-01 Tablero Kanban | HE-07-HU01, HE-07-HU02, HE-07-HU03, HE-07-HU04, HE-07-HU05, HE-09-HU01, HE-09-HU02, HE-09-HU03, HE-09-HU04, HE-09-HU05, HE-09-HU06, HE-09-HU07, RT-02, RT-04 | HE-07-HU01 (CA01 a CA12); HE-07-HU02 (CA01 a CA05); HE-07-HU03 (CA01 a CA04); HE-07-HU04 (CA01 a CA11); HE-07-HU05 (CA01 a CA03); HE-09-HU01 (CA01 a CA05); HE-09-HU02 (CA01 a CA09); HE-09-HU03 (CA01 a CA08); HE-09-HU04 (CA01 a CA08); HE-09-HU05 (CA01, CA02); HE-09-HU06 (CA01 a CA07); HE-09-HU07 (CA01 a CA03); RT-02 (CA01 a CA09); RT-04 (CA01 a CA04) |
| P-KAN-02 Formulario de columna | HE-09-HU03, HE-09-HU04 | HE-09-HU03 (CA01 a CA05, CA07); HE-09-HU04 (CA01 a CA07) |
| P-CAL-01 Calendario | HE-10-HU01, HE-10-HU02, HE-10-HU03, HE-10-HU04, HE-10-HU05 | HE-10-HU01 (CA01 a CA06); HE-10-HU02 (CA01 a CA07); HE-10-HU03 (CA01 a CA03); HE-10-HU04 (CA01, CA03, CA05); HE-10-HU05 (CA01 a CA08) |
| P-CAL-02 Panel del día | HE-10-HU03, HE-10-HU04 | HE-10-HU03 (CA04); HE-10-HU04 (CA02, CA04) |
| P-AGE-01 Agenda diaria | HE-11-HU01, HE-11-HU02, HE-11-HU03, RT-04 | HE-11-HU01 (CA01 a CA06); HE-11-HU02 (CA01 a CA05); HE-11-HU03 (CA01, CA02); RT-04 (CA09) |
| P-PLA-01 Planificador diario (pantalla principal) | HE-03-HU06, HE-12-HU01, HE-12-HU02, HE-12-HU03, RT-01, RT-04 | HE-03-HU06 (CA08); HE-12-HU01 (CA01 a CA05); HE-12-HU02 (CA01 a CA03); HE-12-HU03 (CA01 a CA05); RT-01 (CA06, CA07, CA11); RT-04 (CA11) |
| P-REP-01 Reportes | HE-13-HU01, HE-13-HU02, HE-13-HU03, HE-13-HU04, HE-13-HU05 | HE-13-HU01 (CA01 a CA08); HE-13-HU02 (CA01 a CA10); HE-13-HU03 (CA01 a CA08); HE-13-HU04 (CA01 a CA05); HE-13-HU05 (CA01 a CA07) |
| P-IA-01 Agente de IA | HE-14-HU01, HE-14-HU02, HE-14-HU03, HE-14-HU04, HE-14-HU05, HE-14-HU06, HE-14-HU07, HE-14-HU08, HE-14-HU09 | HE-14-HU01 (CA01 a CA09); HE-14-HU02 (CA01 a CA05); HE-14-HU03 (CA01 a CA04); HE-14-HU04 (CA01 a CA09); HE-14-HU05 (CA01 a CA07); HE-14-HU06 (CA01 a CA08); HE-14-HU07 (CA01 a CA06); HE-14-HU08 (CA01, CA02); HE-14-HU09 (CA01 a CA04) |
| P-CFG-01 Configuración | HE-03-HU06, HE-16-HU01, HE-16-HU02, HE-16-HU03 | HE-03-HU06 (CA07); HE-16-HU01 (CA01 a CA05); HE-16-HU02 (CA01 a CA05); HE-16-HU03 (CA01 a CA05) |
| P-SIN-01 Indicador de sincronización | HE-03-HU06, HE-15-HU01, HE-15-HU02, HE-15-HU03, HE-16-HU01 | HE-03-HU06 (CA01, CA03, CA06); HE-15-HU01 (CA01 a CA03); HE-15-HU02 (CA01 a CA03, CA05); HE-15-HU03 (CA01 a CA08); HE-16-HU01 (CA01 a CA05) |
| P-CFG-02 Menú del ícono del área de notificación | HE-06-HU08, HE-17-HU02, HE-17-HU03 | HE-06-HU08 (CA07); HE-17-HU02 (CA01 a CA03); HE-17-HU03 (CA01 a CA04) |
| P-LAN-01 Landing page | CD-01-HU01, CD-01-HU02 | CD-01-HU01 (CA01 a CA03); CD-01-HU02 (CA01, CA02) |
| P-INS-01 Instalador, paso Opciones | CD-02-HU01, CD-02-HU02, CD-02-HU03 | CD-02-HU01 (CA01, CA03 a CA12); CD-02-HU02 (CA01, CA02); CD-02-HU03 (CA04 a CA06) |
| P-INS-02 Instalador, paso Instalación en curso | CD-02-HU03 | CD-02-HU03 (CA01 a CA03) |
| P-INS-03 Instalador, paso Instalación completada | CD-02-HU01 | CD-02-HU01 (CA02) |

Resumen: 38 pantallas, 17 mensajes de confirmación, 150 transiciones, 658 CA asociados a al menos una pantalla de 658.
