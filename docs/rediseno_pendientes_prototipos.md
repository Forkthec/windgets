# Prototipos · correcciones pendientes (25-nov-2026, hora de Colombia)

Lista para el chat que termina las correcciones en Figma. El orden de trabajo está en `rediseno_plan_prototipos.md`.
Lo que no está aquí ni en `rediseno_cambios_prototipos.md` no se hace. Donde difieran, gana este archivo (es más
nuevo).

## Reglas

1. Haz solo lo que piden los documentos para cada lote. No inventes pantallas, textos ni funciones. Si algo no está
   definido, pregunta con opciones para elegir.
2. Trabaja primero en Windgets claro. Después pásalo a Windgets oscuro, Rosa pastel y Enfoque rojo y negro cambiando
   solo variables.
3. Nunca pidas los metadatos de una página entera. Pídelos marco por marco, con los ids de estos documentos. Capturas
   de máximo 1024 px.
4. No borres marcos. Si sobra uno, ocúltalo o muévelo a una sección «Descartado».
5. Los lotes van seguidos, sin esperar entre uno y otro. Al cerrar cada lote, una sola tanda de capturas de lo que
   cambió y una línea en el registro de avance del plan.
6. Al final, actualiza en `rediseno_cambios_prototipos.md` la tabla «Estado del Figma» (Hecho / Parcial / Falta) y
   tacha los E-nn corregidos. Un punto queda Hecho solo si cumple todas sus casillas. No subas ningún .md ni hagas
   commit.
7. Cierra con un resumen: qué quedó hecho, qué quedó parcial y por qué.

## Archivo de Figma

- Se trabaja en la copia `A3Z03L20swFyo8qdP9jETF`
  (<https://www.figma.com/design/A3Z03L20swFyo8qdP9jETF/Windgets--Copy->).
- El documento de cambios nombra `GdUKUwVHz3Wm0Dqw16UX8k`. Los ids de marcos de abajo son de la copia.
- Páginas: `0:1` Fundamentos, `79:2` Acceso, `79:3` Planificador, `79:4` Agente, `79:5` Personalización, `79:6`
  Configuración, `83:2` Escritorio, `83:3` Web e instalación, `83:4` Confirmaciones.
- Variables: `marco` `200:5`, `superficie` `200:7`, `superficie_alta` `200:8`, `accion` `200:13`.

---

## 1. Cómo se aplica un tema

Un tema tiene **tres colores** (Principal, Secundario, Texto). La persona puede crear muchos, así que todos los temas
reparten esos colores igual. Los 4 de los prototipos son solo ejemplos.

| Color | Dónde va |
|---|---|
| **Principal** | Barra lateral, botón principal, enlaces, opción elegida del selector (Mes / Semana), paso actual, casillas marcadas e interruptores |
| **Secundario** | Detalles que solo señalan o rellenan: barra de progreso, día de hoy, marca de la sección activa, barras y líneas de las gráficas |
| **Texto** | Textos y bordes |
| Fondo (se calcula) | Temas de fábrica: el suyo (Windgets claro, blanco). Temas creados: tinte muy suave del Secundario |
| No cambian con el tema | Colores de estado (vencida, pendiente, completada) y colores de etiquetas y columnas |

- Encima de Principal y Secundario, el texto es blanco u oscuro según cuál se lea mejor.
- Si un color no se ve sobre el fondo, se ajusta solo hasta que se lea (como hace la aplicación; ver
  `docs/interfaz.md` «Tema a tokens»).

### Windgets claro

- [ ] Principal violeta `#6604E6`; Secundario el cian de marca; Texto oscuro.
- [ ] Fondo y tarjetas blancos con borde fino, solo en las pantallas de la app (después de ingresar). Acceso y Web e
      instalación no cambian de fondo.
- [ ] Barra lateral violeta (contraída y expandida) con texto e íconos blancos.
- [ ] Botón principal **violeta con texto blanco** (reemplaza el cian).
- [ ] El crema sigue solo en: ventanas emergentes y confirmaciones, panel de Windi, «Próximas a vencer» y tarjetas
      del Kanban.

### Todos los temas

- [ ] Aplicar la tabla a Windgets oscuro, Rosa pastel y Enfoque rojo y negro.
- [ ] «Colores del tema» y «Selector de color» muestran los mismos tres colores del tema que se ve. Hoy no coinciden:
      Windgets claro muestra Principal casi blanco y Secundario violeta (`203:6520`), y el selector dice
      `#00D9E2` y `#4A4A52` (`203:10565`).
- [ ] Hoja en Fundamentos con la tabla de arriba: color → variable → dónde se usa.
- [ ] Variables nuevas si faltan (una para los detalles del Secundario).
- [ ] Ajustar el criterio de G-01 que pide que el planificador claro comparta el fondo con Inicio de sesión: ya no
      aplica.

## 2. Para que se pueda implementar

- [ ] **Colores:** variables con un modo por tema, sin colores puestos a mano.
- [ ] **Componentes:** botones, campos, interruptores y mensajes con sus variantes: normal, puntero encima, foco,
      deshabilitado y error.
- [ ] **Estados de pantalla:** un marco para vacío, cargando, error, sin conexión y ventanas emergentes.
- [ ] **Textos:** literales en el marco, incluidos los de error y los nombres emergentes.

## 3. Botones (Personalización)

- [ ] En 29 marcos hay dos botones principales (ej. `203:7133`, `2068:2103` y los estados de Clima). «Aplicar» queda
      como principal por ser la acción de la pantalla; «Agregar», «Guardar» y «Listo» de las subpantallas pasan a
      secundarios.

## 4. Widgets: estilo, forma y colores

Referencia de **contenido**: <https://windgets.vercel.app/>. Se copia cómo se presenta la información, no sus colores.

- [ ] Reloj: rótulo, hora grande y fecha.
- [ ] Tareas del día: cada tarea en su propia caja.
- [ ] Calendario: hoy marcado con un cuadro relleno de esquinas redondas.
- [ ] Kanban: columnas con fondo suave y tarjetas con borde.
- [ ] Títulos en negrita.
- [ ] No agregar funciones que muestre la página (ej. pestañas de Windi).
- [ ] **Bordes:** el color que ya usan los widgets de la vista previa, igual en el escritorio (hoy sin borde,
      `204:22938`).
- [ ] **Esquinas y sombra:** salen del tema («Forma de los widgets») y se ven igual en vista previa y escritorio.
- [ ] «Forma de los widgets» (`203:10717`): separar Esquinas (Rectas, Suaves, Redondas) de Sombra (interruptor),
      marcar lo elegido y que la vista previa cambie. Hoy son cuatro filas iguales.
- [ ] **Colores propios del widget:** paleta del tema (por defecto), otra paleta o colores libres. Hoy solo está la
      lista (`204:42141`): faltan el marco de «Otra paleta», el de «Colores libres» con su aviso de legibilidad y un
      widget con apariencia propia.

### Widgets que no son los predefinidos

Faltan sus prototipos reales. En Personalización la vista previa dice solo «Vista previa» (`203:9292` a `203:9862`);
en el escritorio son tres líneas de texto, todos del mismo tamaño y sin borde (`204:23114` a `204:23276`).

| Widget | Qué debe verse | Marco de escritorio |
|---|---|---|
| Noticias | Noticias | `204:23114` |
| Imagen estática | La imagen | `204:23144` |
| Carrusel de imágenes | La imagen y «N de 10» | `204:23180` |
| Animación | La animación y el estado pausada por uso de CPU | `204:23216` |
| Texto | El texto de la persona | `204:23246` |
| Reproductor de música | La pista y el servicio conectado | `204:23276` |
| Windi | Revisar contra el estilo nuevo | `204:23306` |

- [ ] Cada uno en la vista previa y en el escritorio, con colores, tipografía y forma del tema.
- [ ] De los predefinidos, revisar: Reloj 12 h y 24 h, Calendario desde lunes y desde domingo, Tareas del día con
      casillas, vencidas en rojo y «Mover a», Kanban hasta 5 tarjetas por columna, Clima sin conexión.
- [ ] Marco de «widget seleccionado» para los interactivos y un escritorio con el fondo oscurecido y desenfocado
      (`rediseno_final_prototipos.md` §9).

## 5. Clima

### Estado del tiempo

- [ ] Ícono grande, distinto en silueta para cada estado y de día o de noche.
- [ ] Dos tonos: figura en Principal y detalle (sol, gotas, rayo, copos) en Secundario. Si el widget tiene colores
      propios, usa esos. Si no se ve sobre el fondo, se ajusta.
- [ ] El texto del estado se mantiene (HE-04, ET13). El fondo no cambia con el clima.
- [ ] Usar los 11 íconos de Fundamentos y mostrar un ejemplo de cada uno.
- [ ] Igual en vista previa y escritorio (`204:23084`: hoy ícono pequeño de línea).

### Buscador de ciudad (HE-04-HU05)

Hoy solo hay una fila «Datos» con lupa que muestra «Popayán, Colombia» (`203:7133`, `203:8153`) y una ventana
«Selector · Datos Clima» (`204:42267`) con tres ciudades fijas y sin dónde escribir.

- [ ] Campo «Ciudad» con lupa, vacío al abrir, con sugerencias debajo.
- [ ] Miga de pan «Widgets > Agregar widget > Clima».
- [ ] «Agregar» deshabilitado con el campo vacío (en Configurar, «Guardar»).
- [ ] Marco nuevo: campo vacío.
- [ ] Marco nuevo: lista «Sugerencias de ciudad», máximo 5, cada una «ciudad, región, país», desde 2 caracteres.
- [ ] Mensajes literales, cada uno en su lugar:

| Caso | Texto | Dónde va | Marco hoy |
|---|---|---|---|
| No existe | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | campo | `217:18564` (caja abajo y el campo sigue en Popayán) |
| Repetida | «Ya tienes un widget Clima para esa ciudad.» | campo | `217:18759` |
| Sin conexión al buscar | «No hay conexión a internet. Conéctate para validar la ciudad.» (sin sugerencias) | campo | no existe |
| Más de 100 caracteres | «La ciudad no puede superar los 100 caracteres.» | campo | no existe |
| Servicio caído | «No pudimos cargar el clima. Intenta de nuevo más tarde.» | aviso | revisar |
| Widget sin conexión | «Sin conexión. El widget se actualizará al reconectarte.» | estado vacío | `217:18954` (dice solo «Sin conexión») |

## 6. Calendario

Hoy Mes y Semana solo muestran «Noviembre 2026» y «Mes / Semana»: no se sabe cómo avanzar ni que un día se abre.

- [ ] Encabezado en Mes (`204:805`): flecha «Mes anterior», «Hoy», flecha «Mes siguiente», selector de mes y año con
      ▾ y «Mes / Semana».
- [ ] Encabezado en Semana (`204:1249`): flecha «Semana anterior», «Hoy», flecha «Semana siguiente», rango de la
      semana (no el mes) y «Mes / Semana». El rango se escribe «23 – 29 nov 2026».
- [ ] Nombres emergentes de las flechas con esos textos.
- [ ] Cada día muestra que se puede abrir: con el puntero encima se resalta con un color un poco más oscuro. Sin
      nombre emergente.
- [ ] Clic en cualquier parte del día abre «Panel del día» («Nueva tarjeta», «Cerrar»; vacío: «No tienes tarjetas
      para este día.»). El detalle de la tarjeta se abre desde el panel. Comprobar que existan esos marcos.
- [ ] En Semana, «Mes» lleva al mes del lunes de esa semana.
- [ ] «Agenda diaria» sigue como opción propia del menú.

## 7. Reportes y Más reportes

Hoy no se leen de un vistazo: cifras en texto plano y tarjetas con las mismas barras cian. Siguen siendo dos
pantallas.

- [ ] Más reportes (`204:1581`): Vencidas, Pendientes, Completadas y A tiempo como **tarjetas grandes** con número,
      ícono y color de estado.
- [ ] **Gráficas variadas** según el dato (líneas, anillo, columnas, número grande); no seis iguales.
- [ ] Reportes (`204:1005`): las tres secciones de HE-13: «Tarjetas completadas» (gráfica de líneas por día, en vez
      de las barras «Semana 1» a «Semana 4»), «Tasa de cumplimiento» (ej. «66,7 %» y «2 de 3 tarjetas completadas a
      tiempo») y «Vencidas, pendientes y completadas» (anillo).
- [ ] **Interacción:** al elegir un estado del anillo, lista debajo con título y fecha límite; clic en una tarjeta
      abre su detalle (HE-13-HU04). Un estado sin tarjetas queda deshabilitado.
- [ ] **Interacción:** valor al pasar el puntero por un punto, segmento o barra, y lista debajo al hacer clic en las
      demás gráficas. *Función nueva respecto a la HU: anotarla como RD-nn.*
- [ ] Marcos: puntero encima, estado elegido con su lista y rango cambiado con las gráficas actualizadas.

## 8. Desplegables y títulos

**Un desplegable no cambia el título ni la miga de pan.** Solo cambian al ir a otra pantalla.

- [ ] Corregir `204:1442` (título «Mes y año») y `204:1683` (título «Rango de fechas»): quedan «Calendario» y
      «Reportes». Revisar igual `219:14757`, `219:57179`, `219:57192`, `219:57261` y el filtro «Etiquetas».
- [ ] Todo botón que despliega lleva ▾ («Noviembre 2026», «Últimos 30 días», «Etiquetas»).
- [ ] Se abre pegado debajo de su botón, alineado a su borde derecho, sin taparlo ni salirse de la ventana.
- [ ] Los selectores de fecha («Desde», «Hasta») se abren debajo de su campo.
- [ ] La opción actual se ve marcada (hoy ni «Nov» ni «Últimos 30 días» se distinguen).
- [ ] Se cierra al elegir, con Escape o con clic fuera (en el marco, como nota o conexión del prototipo).
- [ ] Rango: opciones «Últimos 7 días», «Últimos 30 días», «Últimos 12 meses» y «Personalizado»; solo
      «Personalizado» muestra fechas y «Aplicar».
- [ ] Mensajes literales del rango, debajo de su campo: «La fecha de inicio no puede ser posterior a la fecha de
      fin.», «Este campo es obligatorio.», «El rango máximo es de un año.» (en Fecha de fin) y «Diligencia una fecha
      válida.».

## 9. Íconos: posición y significado

Cada ícono dice lo que hace y siempre va en el mismo sitio. Revisados en Windgets claro; aplicar en los cuatro temas.
Los íconos nuevos se agregan primero a Fundamentos (`80:14`) y todo botón de solo ícono lleva nombre emergente.
Donde esta sección difiera de G-04 o G-05 («Ver más reportes», lupa en «Mover a»), gana esta.

### Posición

- [ ] **Regresar va a la izquierda del título, en la misma línea.** Hoy: debajo del título del panel (160 marcos,
      ej. Clima `203:7133` y Windi `203:7735`), al final de «Agregar widget» (8 marcos, ej. `203:6696`) y a la derecha
      de los filtros en Más reportes (`204:1581` y sus copias).
- [ ] También en Acceso (registro y recuperar contraseña, ej. `84:62`): hoy va arriba, al lado de la miga de pan.
- [ ] Panel del día (`204:1316`): separar «+» de «×», hoy pegados.

### Faltan (ya los piden las historias o el documento anterior)

- [ ] **Estados en Calendario Mes** (`204:805`): hoy los días vencidos (22 y 23) solo tienen un punto rojo. Vencida:
      alerta y «N vencida(s)»; pendiente: reloj; completada: ✓; cada día con relleno, borde e ícono (HE-10-HU05,
      `interfaz.md`).
- [ ] Mini calendario del Planificador diario (`204:622`): marcar los mismos estados.
- [ ] **Kanban** (`204:704`): vencida con alerta y barra roja a la izquierda (hoy solo texto rojo); la que vence hoy,
      con reloj.
- [ ] Los mismos íconos de estado en «Próximas a vencer» (`204:622`) y en Panel del día (`204:1316`).
- [ ] **Ojo de la contraseña** en Registro (`66:162`, los dos campos) y Nueva contraseña (`84:62`), con «Mostrar
      contraseña» / «Ocultar contraseña» (RD-81). Hoy solo está en Inicio de sesión (`66:4`).
- [ ] **Reproductor de música** (`204:23276`): «Anterior», «Reproducir» / «Pausar» y «Siguiente»; título, artista y
      carátula (sin carátula, ícono genérico de música). La acción que el servicio no permite se ve deshabilitada
      (HE-04-HU11, HE-06-HU09). Va junto con la sección 4.
- [ ] **Sección activa** marcada en la barra lateral, expandida y contraída, con el color de la sección 1. Hoy ningún
      marco la marca (RT, «Planificador diario» aparece marcada).
- [ ] «Error de sincronización · 2 pendientes» (`217:20460`) lleva ícono, como «Sincronizado». Comprobar «Sin
      conexión» (`217:20400`).

### Desplegables y filas

- [ ] ▾ en todo lo que despliega: mes, fecha, rango, «Etiquetas» y «Columna» (`204:1915`).
- [ ] «Tipo» y «Prioridad» (`204:1915`): **botones en fila**, con todas las opciones a la vista y la elegida marcada
      (RD-75); no son desplegables.
- [ ] «Mover a» (`204:2239`): «Columna» cambia la lupa por ▾.
- [ ] La opción actual lleva ✓ (`204:42141` y demás selectores).
- [ ] Agenda diaria (`204:916`): flechas «Día anterior» y «Día siguiente» y «Hoy», como en Calendario (sección 6).
- [ ] «Fecha límite» y «Bloque horario» llevan ícono de calendario, como las fechas del rango (`219:57179`).
- [ ] Las filas que abren otro panel llevan ›: «Colores del tema», «Tipografía» (`203:6520`), «Datos», «Apariencia»,
      «Transparencia», «Tamaño de texto» (`203:7133`), «Forma de los widgets» y «Distribución predefinida»
      (`203:6607`). Hoy parecen campos.
- [ ] Windi (`203:7735`): la fila «Datos» lleva borde; sin él parece deshabilitada.

### Íconos confusos o repetidos

- [ ] **«Agenda diaria» y «Planificador diario»** (barra lateral): redibujarlos, distintos entre sí y sin parecer un
      menú. Antes de aplicarlos, mostrar dos dibujos de cada uno para elegir.
- [ ] **Vista del Kanban** (`204:704`, `204:1139`): interruptor de dos íconos, filas cortas y filas largas, con la
      vista actual resaltada. Nombres emergentes «Vista compacta» y «Vista expandida».
- [ ] **El reloj solo significa «pendiente» o «próxima a vencer»:** la hora de la tarjeta expandida va en texto, sin
      reloj.
- [ ] «Completada el 24 nov» lleva ✓ en lugar del calendario.
- [ ] **«Ver más reportes»** (`204:1005`): pasa a texto «Ver más reportes ›», sin el ícono de «Reportes».
- [ ] **Configuración** (barra lateral): engranaje, igual que «Configurar» de un widget. Quitar los deslizadores.

### Íconos que se agregan

- [ ] «Ver detalle» del menú de tarjeta (`217:13403`). Mostrar dos o tres dibujos para elegir; el ojo no sirve (ya es
      «Mostrar contraseña»).
- [ ] «Continuar con Google» (`66:4` y Registro): logo oficial de Google.
- [ ] Un ícono por tipo de widget en la lista (`203:6607`) y en «Agregar widget» (`203:6696`). Mostrar los dibujos para aprobarlos.

### Widgets: lista y organizar

- [ ] La papelera deshabilitada de los widgets predefinidos explica el motivo al pasar el puntero: «Los widgets por defecto no se pueden
      eliminar. Puedes desactivarlos.».
- [ ] «Organizar widgets» (`203:9957`): el tirador de tamaño es un cuadro liso y solo está en Reloj; darle
      forma de tirador y mostrarlo en el widget elegido.

## 10. Windi no tapa contenido

Dejar una franja libre: el contenido termina antes de la esquina inferior derecha.

- [ ] Semana `204:1249`: tapa «Planear la semana» (domingo 19:00), que además sale cortada.
- [ ] Kanban `204:704` y vista expandida `204:1139`: tapa la columna «+».
- [ ] Reportes `204:1005`: tapa la esquina de la gráfica de anillo.
- [ ] Calendario Mes `204:805`: tapa la celda de la esquina.

## 11. Mensajes emergentes (reemplaza la posición de PR-25)

Píldora arriba: ocupa por un momento el lugar de «Sincronizado».

- [ ] Una línea, borde fino, ícono de color y «×» (ej. «✓ Tarjeta creada. ×»). Uno a la vez.
- [ ] Mover todos los mensajes ahí: hoy tapan «Próximas a vencer» y un recordatorio tapa parte de «+».
- [ ] Un marco de ejemplo por página (hoy solo hay en las páginas 02 a 05).
- [ ] Actualizar el componente y «Mensajes recientes» (`220:22383`).

## 12. Por pantalla

### Planificador
- [ ] Rosa pastel (`204:19460`): la barra de progreso no se ve; pista y relleno son `#F2B3CB`.
- [ ] Vista expandida del Kanban (`204:1139`): ícono en tipo y en prioridad (PR-15).
- [ ] Etiquetas (`204:1078`): más de media pantalla vacía. Agregar más etiquetas de ejemplo.

### Escritorio y notificaciones
- [x] Widgets de escritorio en claro (`204:22938`): blancos (`superficie`) con borde; comprobado 25-nov.
- [x] Crema revisado (G-08): «Windi · Widget» (`2048:534`) se queda crema (panel de Windi); «Recordatorio»
      (`204:23359` y sus 3 temas) y «Área de notificación» (`204:23393` y sus 3 temas) pasaron a `superficie` con borde
      (no están en la lista de G-08); «Mensaje emergente» ya es píldora con borde. «Nuevo · Windi widget» de
      Personalización es el panel de Windi: se queda.

### Web e instalación
- [ ] Instalación (`84:1068`): quitar «Cambiar»; la ruta queda solo como texto.
- [ ] Instalador: marcos en claro y oscuro según la configuración de Windows, sin Rosa ni Enfoque. Se dibuja así y
      queda **por confirmar en el código** que sea posible.
- [ ] Web: no se cambia su apariencia. «Elige un tema» muestra los cuatro temas.
- [ ] Página 07: colores sueltos (`#F7F4FB`, `#F2EAFC`, `#211A2D`, `#FFFFFF`, `#6604E6`) pasan a variables;
      `#F7F4FB` no coincide con el de Acceso (`#F5F0FF`).

### Confirmaciones
- [ ] M-01 (`85:2`), M-16 y M-17: colores sueltos a variables. Son del instalador: solo claro y oscuro.

## 13. Detalles menores

- [ ] En Rosa pastel y Enfoque, el botón de eliminar parece secundario.
- [ ] Texto de la barra lateral más delgado en `2068:2103`; revisar las otras barras expandidas.
- [ ] Nombres emergentes que se encima: el de la barra contraída tapa parte del título y el de «Regresar» tapa parte
      del campo de abajo.
- [ ] Textos escritos en el Figma que no estén en estos documentos (ej. «Pasa «Enviar la presentación» a Por hacer.»):
      listarlos con su marco y preguntar a Paula si se quedan.
- [ ] Comprobar que las etiquetas de la tarjeta tengan lista desplegable con buscador, casillas y fichas.
- [ ] Revisar Rosa pastel y Enfoque rojo y negro pantalla por pantalla (falta).

## 14. Lo que la aplicación ya hace y falta en los prototipos

Si la aplicación va a seguir el rediseño, todo lo que hace tiene que estar en los prototipos. Esta sección salió de
comparar la aplicación con la copia de Figma (25-nov-2026).

- Se dibuja con el estilo del prototipo. Lo nuevo de los prototipos que la aplicación aún no tiene **se queda**: no se
  quita ni se cambia por la versión de la aplicación.
- Cada estado o mensaje va en un marco o en una variante, con el texto literal. Lo que va entre `< >` se llena con un
  ejemplo.
- Va junto con las secciones 2 (estados), 4 (widgets), 5 (clima), 6 (calendario), 7 (reportes), 8 (desplegables), 9
  (íconos) y 11 (mensajes): lo que ya está allí no se repite aquí.

### 14.1 Etiquetas y columnas

- [ ] Elegir color (`204:2047`, `204:2095`, `204:2143`, `204:2191`): hoy solo hay un campo «Catálogo de colores». Van
      **círculos con nombre**: todos los colores a la vista, cada uno con su nombre, y el elegido marcado.
- [ ] Etiqueta elegida: **fondo suave y borde del color de la etiqueta**, con el texto en su color normal (formulario,
      detalle y Kanban expandido). Nunca un fondo violeta fijo.
- [ ] El campo del nombre se llama «Nombre» en etiqueta y en columna (hoy «Etiqueta» y «Columna»).
- [ ] Errores en el campo: «Este campo es obligatorio.», «El nombre de la etiqueta no puede superar los 30
      caracteres.», «Ya existe una etiqueta con ese nombre.», «El nombre de la columna no puede superar los 30
      caracteres.», «Ya existe una columna con ese nombre.» y «Este color ya no está disponible. Elige otro.».
- [ ] Avisos: «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.», «Alcanzaste el máximo de 10
      columnas. Elimina una para crear otra.», «Esta etiqueta ya no existe.» y «Esta columna ya no existe.».
- [ ] Etiquetas vacío (`217:17387`): la aplicación dice «Aún no tienes etiquetas. Crea una para clasificar tus
      tarjetas.» y el marco, «Aún no hay etiquetas.».
- [ ] Confirmación al eliminar una etiqueta usada en **una** tarjeta: «La etiqueta “<nombre>” está asignada a 1
      tarjeta. Se quitará de ella, pero la tarjeta no se eliminará. ¿Deseas continuar?».

### 14.2 Tarjeta: formulario y detalle (`204:1915`, `204:1981`)

- [ ] Lista de «Etiquetas» abierta: sin elegir dice «Elige etiquetas»; cada fila con punto de color, nombre y
      casilla; las elegidas como fichas; máximo 3 («Puedes asignar hasta 3 etiquetas.»); sin etiquetas: «Aún no tienes
      etiquetas.» con el botón «Nueva etiqueta».
- [ ] Selector de «Fecha límite» abierto, con los días pasados deshabilitados.
- [ ] «Bloque horario» son dos campos: «Fecha del bloque» y «Hora del bloque» («Sin bloque horario» y de 00:00 a
      23:00). Deshabilitados: horas que ya pasaron hoy y fechas después de la fecha límite.
- [ ] Textos de ejemplo dentro de los campos vacíos (ej. «DD/MM/AAAA»).
- [ ] Errores en cada campo, todos a la vez: «Este campo es obligatorio.», «El título no puede superar los 100
      caracteres.», «La descripción no puede superar los 1000 caracteres.», «Diligencia una fecha válida.», «La fecha
      límite no puede ser anterior a hoy.», «No puedes asignar tarjetas a un bloque horario que ya pasó.» y «No puedes
      programar la tarjeta después de su fecha límite.».
- [ ] Error al guardar: «No pudimos completar la operación. Intenta de nuevo más tarde.».
- [ ] Detalle sin datos: «Sin descripción», «Sin prioridad» y «Sin etiquetas».
- [ ] Avisos: «Esta tarjeta ya no existe.» y «Tarjeta actualizada. Se quitó de su bloque horario porque quedó después
      de la nueva fecha límite.».

### 14.3 Planificador

**Planificador diario** (`204:622`)

- [ ] Casilla en cada tarjeta para marcarla o desmarcarla como completada.
- [ ] Todas completadas: «¡Completaste todas tus tarjetas de hoy!».
- [ ] Sin tarjetas: «No tienes tarjetas para hoy.».

**Kanban** (`204:704`, menú `217:13403`)

- [ ] Botón «⋯» visible en cada tarjeta.
- [ ] Menú de tarjeta: agregar «Eliminar» (hoy solo «Ver detalle», «Mover a» y «Editar»). Se llama «Ver detalle» (la aplicación
      dice «Vista detallada»).
- [ ] Menú «⋯» de columna abierto, con «Editar» y «Eliminar» (hoy va directo a «Editar columna»). En las columnas
      predefinidas, «Eliminar» deshabilitado: «Las columnas por defecto no se pueden eliminar.».
- [ ] Columna vacía: «No hay tarjetas en esta columna.».
- [ ] Tarjeta con «Vence mañana» y tipo de tarjeta en la vista compacta (RD-73, RD-74).
- [ ] Sin tablero descargado: «Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.».

**Agenda diaria** (`204:916`)

- [ ] «Quitar del horario» en la tarjeta que ya tiene bloque.
- [ ] Sin tarjetas por programar: «No tienes tarjetas pendientes por programar.».
- [ ] Avisos al soltar: «No puedes asignar tarjetas a un bloque horario que ya pasó.» y «No puedes programar la tarjeta
      después de su fecha límite.».
- [ ] La fecha es un botón que abre el selector de día, con el nombre emergente «Elegir un día».

**Calendario** (`204:805`, `204:1442`)

- [ ] «Mes y año»: el año se cambia con ‹ › o se escribe (de 1970 a 2100).
- [ ] Aviso al crear en un día pasado: «No puedes crear tarjetas en días pasados.».

**Reportes** (`204:1005`, `204:1581`)

- [ ] Sin ninguna tarjeta: «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.».
- [ ] Rango recortado: «Mostrando datos desde el <fecha>, cuando creaste tu primera tarjeta.».
- [ ] Sin datos: «No hay datos para este rango de fechas y estos filtros.». Estado sin tarjetas: «No hay tarjetas en
      este estado.».
- [ ] Filtro de etiquetas abierto: «Todas las etiquetas», máximo 3 («Puedes elegir hasta 3 etiquetas.») y vacío («Aún
      no tienes etiquetas.»).

### 14.4 Panel de Windi (página `79:4`)

- [ ] Variantes de la tarjeta «PROPUESTA»: crear (con «Datos»), cambiar («Cambios», «<dato>: <actual> → <nuevo>»),
      mover («<columna actual> → <columna nueva>»), eliminar varias («<n> tarjetas»), crear etiqueta (muestra y «Color:
      <nombre>»), con advertencias y «Descartada».
- [ ] Botones de la propuesta deshabilitados (propuesta que ya no está activa o sin conexión).
- [ ] No respondió: «No pude responder en este momento. Intenta de nuevo.» con «Reintentar».
- [ ] Sin conexión: «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.».
- [ ] Respuestas: «Se perdió la conexión. No se hizo ningún cambio.», «No pude aplicar los cambios. No se hizo ningún
      cambio.», «No hice ningún cambio porque tus tarjetas cambiaron desde que te lo propuse: <cambios>.», «Entendido,
      no hice ningún cambio. ¿Quieres cambiar algo de la propuesta?» y «Listo, ya hice el cambio.».
- [ ] Mensaje muy largo: «Tu mensaje no puede superar los 2000 caracteres.».
- [ ] Un ejemplo de cada tipo de respuesta de texto, en la burbuja normal (comprobar cuáles ya están):
  - Saludo: «¡Hola, <alias>! Soy Windi. ¿Qué organizamos hoy con tus tarjetas o con la aplicación?».
  - Celebración: «¡Bien hecho, <alias>! 🎉 Ya está en Hecho.».
  - Pide un dato: «Falta el título de una de las tarjetas. ¿Cómo se llama?», «A la tarjeta “<título>” le falta la fecha
    límite. ¿Para cuándo es?», «¿Qué nombre le pongo a la etiqueta?» y «¿De qué color quieres la etiqueta “<nombre>”?
    Los colores son: <colores>.».
  - No encuentra: «No encuentro una tarjeta llamada “<nombre>”. ¿Me das más detalles?», «No encuentro la columna
    “<columna>”. Tus columnas son: <columnas>.», «No tienes la etiqueta “<etiqueta>”. Tus etiquetas son:
    <etiquetas>.» y «No tengo el color “<color>”. Los colores son: <colores>.».
  - Sin cambio por hacer: «La tarjeta “<título>” ya está en <columna>.» y «La tarjeta “<título>” ya tiene ese valor.».
  - Propuesta rehecha: «Esta es la propuesta con los datos actuales. ¿Confirmas?».
  - Hecho: «Listo, creé la etiqueta «<nombre>».», «Listo, creé <cantidad> etiquetas.», «Listo, actualicé <cantidad>
    tarjetas.» y «Listo, moví <cantidad> tarjetas.».
  - Fuera de alcance: «Solo puedo ayudarte con tus tarjetas y con Windgets. Por ejemplo, puedo crear una tarjeta o
    contarte qué tienes para hoy.».

### 14.5 Personalización

**Paso 1 Tema** (`203:6362`)

- [ ] Marcas «Cambios sin aplicar» y «Cambios sin guardar» en el tema aplicado.
- [ ] Tema aplicado: «Eliminar» deshabilitado («No puedes eliminar el tema aplicado. Aplica otro tema primero.») y
      «Aplicar» deshabilitado («Este tema ya está aplicado.»).
- [ ] Con un solo tema: «Guarda otra personalización con “Guardar como tema” para tener más temas.».
- [ ] Errores del nombre: «El nombre no puede superar los 40 caracteres.» y «Ya existe un tema con ese nombre. Elige
      otro.».
- [ ] Avisos: «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.», «Ya tienes el tema “<nombre>” con
      estas mismas propiedades.», «No hay cambios para guardar.», «Este tema ya no existe.» y «Se aplicó una
      personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.».

**Paso 2 Fondo** (`203:6440`, `203:10417`, `203:10273`)

- [ ] Ajuste de la imagen por monitor: «Ajuste del monitor <n> (principal)» con «Rellenar», «Ajustar», «Expandir»,
      «Mosaico», «Centrar» y «Extender» (este solo con varios monitores).
- [ ] Más de 6 monitores: «Puedes ajustar el fondo de hasta 6 monitores. Los demás usan el ajuste del monitor
      principal.». Monitor desconectado: «Ese monitor ya no está conectado. Elige otro monitor.».
- [ ] «JPG, JPEG o PNG · Máximo 20 MB», «Quitar imagen» e «Imagen propia».
- [ ] Errores de la imagen: «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.», «La imagen supera el tamaño
      máximo de 20 MB.», «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» y «No encontramos la
      imagen de fondo de este tema. Sube otra o elige una del catálogo.».
- [ ] Catálogo vacío: «El catálogo de imágenes no tiene imágenes por ahora.».
- [ ] Ya está el fondo por defecto: «Este tema ya muestra su imagen de fondo por defecto.».

**Paso 3 Colores y tipografía** (`203:6520`, `203:10565`, `203:10640`, `203:10942`)

- [ ] Campo para escribir el color, con «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).».
- [ ] Aviso de legibilidad: «El contraste de estos colores es bajo (<contraste>:1). Prueba con <color sugerido>.».
- [ ] Paleta «Personalizada» y aviso «Esta paleta ya no está disponible. Elige otra.».
- [ ] Tipografía (`203:10640`): hoy solo aparece «Rubik». La aplicación ofrece Inter, Merriweather, Poppins,
      JetBrains Mono, Nunito y Rubik, cada nombre escrito en su letra y la elegida marcada. Los tamaños («Pequeño»,
      «Mediano», «Grande») van como un grupo aparte, no como más fuentes.
- [ ] **Dos botones:** «Restablecer colores» y «Restablecer tipografía» (`203:10942` tiene uno solo).

**Paso 4 Widgets: lista** (`203:6607`)

- [ ] Interruptor apagado («Inactivo») y, bajo cada nombre, el dato que lo distingue (ciudad, «Widget por defecto»…).
- [ ] Papelera deshabilitada (widgets predefinidos) con su nombre emergente: «Los widgets por defecto no se pueden
      eliminar. Puedes desactivarlos.».
- [ ] Widget agregado: papelera **habilitada**. En la confirmación (página `83:4`) el ejemplo es «Reloj», que es
      predefinido y no se puede eliminar: usar un widget agregado.
- [ ] Animación pausada: «En pausa por alto consumo de recursos.».
- [ ] Avisos: «Ya agregaste este widget.», «Este widget ya no existe.» y «No pudimos completar la operación. Intenta de
      nuevo más tarde.».

**Agregar y configurar widget** (`203:6696` y siguientes)

- [ ] Catálogo en dos grupos: «Widgets externos» y «Widgets locales».
- [ ] Los campos «Datos» son listas fijas. Faltan los controles reales:
  - [ ] Carrusel: subir y elegir imágenes, la lista de imágenes elegidas e «Intervalo (segundos)». Errores:
        «Selecciona al menos 2 imágenes para el carrusel.», «Puedes agregar máximo 10 imágenes al carrusel.» y «El
        intervalo debe estar entre 3 y 60 segundos.».
  - [ ] Imagen estática: catálogo e imagen propia («Imagen propia: <nombre>», «JPG, JPEG o PNG. Máximo 20 MB.»).
  - [ ] Texto: campo libre, «El texto no puede superar los 200 caracteres.».
  - [ ] Animación: catálogo con vista previa.

**Organizar widgets** (`203:9957`)

- [ ] Instrucción «Arrastra los widgets para moverlos o desde su esquina para cambiar su tamaño».
- [ ] Avisos: «No se guardaron cambios.», «Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.» y
      el de personalización más reciente desde otro computador (Paso 1).

### 14.6 Widgets en el escritorio (`204:22938` en adelante)

- [ ] Tareas del día: prioridad de cada tarea y vacío «No tienes tarjetas para hoy.».
- [ ] Kanban: punto de color de cada columna, «+<n> más», vacío «Tu tablero no tiene tarjetas.» y arrastrar una tarjeta
      entre columnas (tarjeta arrastrada y columna de destino).
- [ ] Calendario: el título del mes y los días se pueden abrir (estado con el puntero encima).
- [ ] Noticias: 5 titulares con su fuente, cada uno se puede abrir; error «No pudimos cargar las noticias. Intenta de
      nuevo más tarde.».
- [ ] Reproductor: «No hay música en reproducción.», con los controles deshabilitados.
- [ ] Noticias sin conexión: «Sin conexión. El widget se actualizará al reconectarte.».
- [ ] Aviso del fondo: «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.».
- El widget de Windi se queda como está en el prototipo (con su chat).

### 14.7 Acceso (`66:4`, `66:162`, `84:2` a `84:62`, `88:2`)

- [ ] Errores en cada campo, todos a la vez: «Este campo es obligatorio.», «El alias no puede superar los 30
      caracteres.», «Diligencia un correo electrónico válido.», «El correo electrónico no puede superar los 64
      caracteres.», «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un
      número.» y «Las contraseñas no coinciden.».
- [ ] «Este correo electrónico ya está registrado.», con los enlaces «Iniciar sesión» y «Recuperar contraseña».
- [ ] Inicio de sesión: «Correo electrónico o contraseña incorrectos.», «Tu cuenta está bloqueada. Escríbenos para
      revisarla.», «Demasiados intentos. Espera unos minutos e intenta de nuevo.» y «Tu sesión venció. Inicia sesión de
      nuevo.».
- [ ] Código: «Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.», «El código no es
      correcto. Revísalo e intenta de nuevo.», «El código venció. Solicita uno nuevo.», «Te enviamos un nuevo código.»
      y «Puedes pedir un nuevo código en <segundos> s.».
- [ ] Contraseña nueva: «Elige una contraseña distinta de la actual.» y «Tu contraseña fue actualizada. Ya puedes
      iniciar sesión.».
- [ ] Google: «Se canceló el inicio de sesión con Google.», «No fue posible iniciar sesión con Google. Intenta de
      nuevo.», «No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo
      electrónico.» y «No pudimos abrir el navegador. Intenta de nuevo.».
- [ ] Al entrar: «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.» y «No pudimos aplicar el tema <nombre>.
      Puedes elegirlo en Personalización.».
- [ ] Sin conexión: «No hay conexión a internet. Conéctate para iniciar sesión.» y «No hay conexión a internet.
      Conéctate para crear tu cuenta.».
- [ ] Recuperar sin conexión (`88:2`): cambiar su texto por «No hay conexión a internet. Conéctate para recuperar tu
      contraseña.».

### 14.8 Configuración y sincronización

- [ ] «No pudimos cambiar el inicio automático. Intenta de nuevo.» e «Inicio automático desactivado.».
- [ ] «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.» y «Sesión cerrada.».
- [ ] Detalle del indicador de sincronización: «Estás sin conexión. Tus cambios se guardarán y se sincronizarán al
      reconectarte.», «Tus cambios se sincronizaron.» y «Algunas tarjetas se actualizaron con cambios más recientes de
      otro computador.».

### 14.9 Mensajes de resultado

Todos usan la píldora de la sección 11. Hoy está «Tarjeta creada.»; faltan en «Mensajes recientes» (`220:22383`):

| Grupo | Textos |
|---|---|
| Tarjeta | «Tarjeta actualizada.» · «Tarjeta eliminada.» · «¡Bien hecho! Tarjeta completada.» · «Tarjeta asignada al bloque <hora de inicio> – <hora de fin>.» · «Tarjeta quitada del horario.» |
| Columna | «Columna creada.» · «Columna actualizada.» · «Columna eliminada.» |
| Etiqueta | «Etiqueta creada.» · «Etiqueta actualizada.» · «Etiqueta eliminada.» |
| Tema | «Tema “<nombre>” guardado.» · «Tema “<nombre>” guardado y aplicado.» · «Tema “<nombre>” aplicado.» · «Tema renombrado.» · «Tema eliminado.» |
| Cambios | «Cambios guardados.» · «Cambios guardados en el tema “<nombre>”.» · «Cambios guardados. Selecciona Aplicar para verlos en tu escritorio.» · «Cambios aplicados. Recuerda guardarlos para no perderlos.» |
| Widget | «Widget eliminado.» |

## 15. Cierre de documentos

- [ ] Actualizar la tabla «Estado del Figma» (está desactualizada) y tachar los E-nn corregidos.
- [ ] Anotar la copia `A3Z03L20swFyo8qdP9jETF` junto a las líneas 8 y 9, sin cambiar D-01.
- [ ] Anotar las decisiones de este archivo, el nodo correcto de Windi (`66:71`, ojos de Inicio de sesión) y las
      variables y componentes nuevos: `borde_campo`, `burbuja_propia` (necesita token en el código), `error`,
      `sombra`, Interruptor, Paso, variables del deslizador, Carpeta `2071:2560`, Información `2074:541`, mensajes
      emergentes.

---

## Aviso para la implementación (no es trabajo de Figma)

El rango de la semana «23 – 29 nov 2026», «Ver detalle» en el menú de tarjeta y «Este tema ya muestra su imagen de
fondo por defecto.» cambian textos de la aplicación.

**Para después (decidido, no entra en esta ronda):** resaltar con un color un poco más oscuro, y con animación, todo lo
que se puede tocar en la aplicación. Es un cambio grande y se plantea aparte. En esta ronda solo se dibuja el resalte
de los días del calendario y los estados de los componentes (sección 2).

La sección 1 cambia el código: hoy `apps/desktop/src/ui/tema/derivar.ts` calcula el botón principal con el
Secundario, y las tablas fijas de Windgets claro y oscuro (RD-94) usan otro reparto. Anotarlo como RD-nn.

La etiqueta con su color cambia el código: hoy la ficha de una etiqueta elegida lleva un fondo violeta fijo
(`.wg-chip` en `apps/desktop/src/ui/tema/tokens.css`). Anotarlo como RD-nn.

El widget de Windi con chat es nuevo: hoy la aplicación solo muestra sus ojos (RD-71). Anotarlo como RD-nn.

---

## Ya decidido (no volver a preguntar)

| Tema | Decisión |
|---|---|
| Reparto de colores | Principal: barra y botón principal (también enlaces, elegido, paso, casillas). Secundario: progreso, hoy, sección activa, gráficas. Reemplaza «el cian actúa» |
| Fondo de temas creados | Tinte suave del Secundario; los de fábrica conservan el suyo |
| Fondo blanco | Solo Windgets claro, tras ingresar |
| Barra lateral clara | Violeta intenso `#6604E6`, texto e íconos blancos |
| Dos principales | Solo la acción de la pantalla queda principal |
| Estilo de widgets | De la página de descarga se toma el contenido, no los colores |
| Bordes de widgets | El color actual de los prototipos; esquinas y sombra del tema |
| Clima | Ícono de dos tonos del tema, sin fondo según el estado |
| Buscador del clima | Campo con sugerencias |
| Calendario | Flechas, «Hoy», selector y «Mes / Semana»; Agenda diaria aparte |
| Reportes | Cifras grandes, gráficas variadas e interacción; siguen dos pantallas |
| Regresar | A la izquierda del título, en la misma línea |
| Desplegables | No cambian título ni miga de pan |
| Windi | Franja libre abajo a la derecha |
| Mensajes | Píldora arriba, en el lugar de «Sincronizado» (antes: bajo el título) |
| Widgets de escritorio en claro | Blancos con borde |
| Carpeta de instalación | Sin «Cambiar» |
| Etiquetas | Más ejemplos |
| Lupa en Filtrar etiquetas y Catálogo | No agregar |
| Fondo de las demás pantallas | `marco` en oscuro; `superficie` en Rosa pastel y Enfoque (revisar el nombre de la variable al aplicar la sección 1: `marco` pasa a ser el color de la barra) |
| «Organizar widgets» | Ícono de cuatro flechas |
| Selector en oscuro | El texto elegido usa `superficie` |
| «Pendientes» en Reportes | Ámbar `#A88B00` |
| Globo de la persona en Windi | Rosa `#FADCE7`, Enfoque `#4A1B22` |
| Datos semanales de Reportes | 2, 4, 3, 3 (12 en total); la gráfica pasa a líneas por día |
| Interruptor | Pista del color Principal y perilla clara |
| «Mover a» | Solo el campo «Columna», con ▾ y sin lupa |
| Íconos parecidos | Redibujar Agenda diaria y Planificador diario; Kanban con filas cortas / largas |
| Flechitas | ▾ en lo que despliega, › en filas que abren panel, ✓ en la opción actual |
| Reloj | Solo pendiente o próxima a vencer; la hora sin ícono; completada con ✓ |
| «Ver más reportes» | Texto con ›, sin ícono de barras |
| Configuración | Engranaje en la barra lateral y en los widgets |
| Íconos nuevos | «Ver detalle», logo de Google y uno por tipo de widget |
| Regresar en Acceso | Junto al título, como en el resto |
| Etiqueta elegida | Fondo suave y borde de su color, texto en color normal (formulario, detalle y Kanban) |
| Colores de etiqueta y columna | Círculos con nombre, todos a la vista y el elegido marcado |
| «Tipo» y «Prioridad» | Botones en fila, sin desplegable |
| Widget de Windi | Se queda el chat pequeño del prototipo |
| Restablecer | Dos botones: «Restablecer colores» y «Restablecer tipografía» |
| Funciones de la aplicación | Todas tienen que estar en los prototipos (sección 14); lo nuevo de los prototipos no se quita |
| Rango de la semana | «23 – 29 nov 2026» |
| Campo de etiqueta y columna | «Nombre» |
| Día del calendario | Se resalta con un color un poco más oscuro al pasar el puntero; sin «Abrir día» |
| Interacción del calendario | Se ve en la aplicación; no se pide flujo conectado en el prototipo |
| Animaciones de resalte en toda la aplicación | Para después, como cambio aparte |
| Desplegables | Se cierran al elegir, con Escape o con clic fuera |
| Modo de prueba con otros colores | No se hace |
| Panel del día | «+» separado de «×» |
| Tirador de tamaño | Con forma de tirador, en el widget elegido |
| Ícono de «Ver detalle» | Sin elegir: mostrar opciones al aplicarlo |
| Menú de tarjeta | «Ver detalle» (no «Vista detallada») |
| Papelera de widgets predefinidos | «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» |
| Respuestas de Windi | Un ejemplo de cada tipo |
| Fondo por defecto | «Este tema ya muestra su imagen de fondo por defecto.» |
| Recuperar sin conexión | «No hay conexión a internet. Conéctate para recuperar tu contraseña.» |
| Instalador | Claro y oscuro; por confirmar en el código |
| «Elige un tema» en la web | Los cuatro temas |
| Revisión | Lotes seguidos; se pregunta solo lo no definido; capturas al cierre de cada lote |

## Ya revisado (no es pendiente)

Cuatro temas en todas las pantallas (salvo confirmaciones del instalador), sin nombres antiguos de tema, notas con
esquina doblada y flecha en Acceso, ojos y panel de Windi, columna «+», datos del calendario y la agenda, ventanas
emergentes sobre su pantalla, barra lateral expandida, indicador de pasos, vista previa más grande, íconos del clima
en Fundamentos, regresar solo con ícono, «Mis temas», deslizadores, íconos de Fundamentos, interruptor de la
instalación, texto «Editar» como botón principal en el Detalle y las seis filas de noviembre en el calendario.

Íconos que están bien: editar, eliminar y «+» de Etiquetas; filas de temas; «×» y papelera del Detalle; «×» y enviar de
Windi; mensajes emergentes; «×» de las confirmaciones; sol y luna de Inicio de sesión. El menú de la bandeja y la
notificación de Windows van solo con texto.

---

## Cambios que agrego yo

<!-- Escribe aquí lo que quieras sumar: pantalla, qué se ve hoy y cómo lo quieres. -->

| Pantalla o marco | Qué quiero |
|---|---|
| | |
| | |
| | |
| | |
| | |
