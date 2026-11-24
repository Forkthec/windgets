# Rediseño final de Windgets · Instrucciones para la IA que modifica los prototipos

> **Para quién es este documento:** para la IA (o la persona) que va a modificar el Figma «Windgets (Copy)»
> (`QJviaE6yNPefYqtdeepYZZ`, <https://www.figma.com/design/QJviaE6yNPefYqtdeepYZZ/Windgets--Copy->) y producir el
> **rediseño final**. El documento que lo acompaña es `rediseno_final_backend.md`, que describe lo que el Núcleo
> (Rust + SQLite + Supabase) tiene que cambiar cuando estos prototipos se implementen. Los dos documentos usan los
> mismos números de decisión (D-nn), de punto abierto (A-nn) y de sugerencia (Pnn).
>
> **Fecha de la revisión:** 24-nov-2026. **Revisó:** Claude, a pedido de Paula (PO).
>
> **Fuentes cruzadas:**
> 1. Las HU vigentes: `21112026_v12_historias_usuario.xlsx` (111 HU, HE-01 a HE-17, CD-01, CD-02, RT-01 a RT-04).
> 2. El glosario del proyecto: `07102026_v4_glosario.md` (carpeta `00.2-glosario` en Drive).
> 3. El repositorio `Forkthec/windgets` (último commit `d9f4955`, P37), en especial `docs/rediseno.md` (RD-01 a RD-61),
>    `docs/interfaz.md` (inventario de pantallas, mensajes y transiciones) y el código de `apps/desktop/src`.
> 4. El Figma «Windgets (Copy)», páginas 00 a 08, revisado marco por marco.
> 5. Una prueba manual de la aplicación instalada (`windgets.exe`): pantalla 1366 × 768 con escala de Windows y barra
>    de tareas, sesión real, modo claro y oscuro.
> 6. La lista de sugerencias de Paula del 24-nov-2026 (P01 a P73, todas en la sección 12 con dónde quedó cada una) y
>    sus 32 decisiones de la segunda ronda (sección 0.1).

---

## Cómo ejecutar este documento

**Objetivo:** dejar en el Figma un rediseño final completo y coherente de Windgets: todas las pantallas con sesión
dibujadas con los colores del tema, sin scroll de página a 1366 × 768, con los nombres, la navegación y la jerarquía
visual de este documento, y con las funcionalidades nuevas aprobadas por Paula (🆕).

**Orden de prioridad cuando dos textos chocan:** sección 0.1 (decisiones D-nn) > sección 0 (reglas) > sección 2
(nombres) > resto del documento > HU v12 > Figma actual. Si encuentras un choque que este documento no resuelve, no lo
resuelvas tú: anótalo en el marco «Puntos abiertos» del Figma con la marca «⚠ DECIDIR» y sigue.

**Pasos (en este orden):**

1. Lee las secciones 0, 0.1, 0.3 y 2 completas antes de tocar el Figma.
2. Crea los componentes y variables del sistema de diseño (sección 3): tokens del tema con los 3 temas de ejemplo,
   escala de tamaños, colores de estado, mensajes emergentes, ventana emergente, desplegable, selector de fecha,
   botones de los cuatro niveles de jerarquía (0.2, punto 5).
3. Rehaz el marco de la ventana con sesión (sección 4): menú lateral, encabezado con miga de pan, indicador de
   sincronización y Windi.
4. Rehaz las pantallas sin sesión (sección 5).
5. Rehaz el Planificador (sección 6), pantalla por pantalla, con todos sus estados.
6. Rehaz Personalización como una sola pantalla por pasos (sección 7) y la pantalla Organizar widgets.
7. Rehaz Configuración, escritorio y confirmaciones (secciones 8 y 9).
8. Elimina del Figma lo que la sección 10 marca «Se elimina» y mueve a «Propuestas nuevas (pendientes de HU)» lo que
   queda sin HU y sin decisión.
9. Dibuja el «Mapa de navegación» (7.2) y comprueba que cada flecha llega a un marco existente.
10. Haz la revisión completa de la sección 0.2 y deja el marco «Checklist de revisión».
11. Actualiza el inventario (sección 11) con el estado final de cada pantalla.

**Definición de terminado** (todo debe cumplirse):
- [ ] Cada fila del inventario (sección 11) tiene su marco en el Figma, con todos los estados que nombra.
- [ ] Cada marco con sesión existe en los 3 temas de ejemplo (regla 4) y usa solo variables del tema, salvo las
      excepciones de 3.3.
- [ ] Ninguna pantalla principal hace scroll de página a 1366 × 768 con 125 % de escala (área útil ≈ 1093 × 560 px).
- [ ] Todos los nombres de pantallas, pasos, botones y mensajes coinciden con la sección 2.
- [ ] Toda pantalla con sesión muestra su miga de pan, y la miga coincide con el menú y los pasos (2.2).
- [ ] No queda en el Figma nada de lo que la sección 10 marca «Se elimina».
- [ ] El marco «Checklist de revisión» tiene marcados los 8 puntos de 0.2, con el resultado de la verificación a
      1366 × 768 y a 1920 × 1080.
- [ ] El marco «Puntos abiertos» lista los A-nn de 0.3 que sigan sin respuesta y cualquier choque nuevo encontrado.

---

## 0. Reglas para la IA que modifica los prototipos

1. **No elimines ninguna sugerencia de este documento.** Si una sugerencia choca con otra o con una HU y la
   sección 0.1 no lo resuelve, déjala escrita y marca el conflicto con «⚠ DECIDIR» en el marco «Puntos abiertos».
2. **No inventes funcionalidades.** Todo lo que se dibuje debe estar respaldado por una HU v12, un CA/ET, un RD de
   `docs/rediseno.md` o una decisión de la sección 0.1. Las funcionalidades nuevas **aprobadas** en la sección 0.1
   (marca 🆕) se dibujan en las pantallas normales con un pequeño indicador «🆕 HU v13» en el nombre del marco.
   Cualquier otra idea nueva que no esté en 0.1 va en una página aparte «Propuestas nuevas (pendientes de HU)», nunca
   mezclada con las pantallas aprobadas.
3. **Lo que el Figma tiene sin HU** se trata según la sección 10: lo que Paula decidió quitar **se elimina**; lo
   aprobado se integra a su pantalla; lo que quede sin HU y sin decisión se mueve a «Propuestas nuevas (pendientes de
   HU)» con una nota.
4. **Los colores dependen del tema** aplicado (D-01, secciones 2 y 3.3). Cada marco con sesión se dibuja con
   variables (tokens) del tema, nunca con hex sueltos. Cada marco con sesión se entrega en **3 temas de ejemplo**,
   los mismos en todo el Figma: **«Windgets»** (paleta Windgets), **«Rosa pastel»** (una paleta clara) y **«Enfoque
   rojo y negro»** (una paleta oscura).
5. **Claro y Oscuro solo existen antes de iniciar sesión** (Inicio de sesión, Registro, Verificar correo, Recuperar
   contraseña). Con sesión no hay selector Claro/Oscuro: la aplicación toma el tema aplicado (D-01).
6. **Toda pantalla tiene sus estados** (con datos, vacío, cargando, error, sin conexión, deshabilitado) cuando la HU
   los nombra. Usa los textos literales de las HU/RD; si no existen, escribe «texto pendiente» en vez de inventarlo.
7. **Nombre de cada marco nuevo o cambiado:** «Pantalla · Estado · Tema de ejemplo», por ejemplo «Tablero Kanban ·
   Vista expandida · Tema Windgets». Al terminar, actualiza la tabla de la sección 11.
8. **Tamaño de referencia:** la ventana abre siempre maximizada y no se redimensiona (D-04). Se diseña para
   1366 × 768 a 125 % de escala de Windows (área útil real ≈ 1093 × 560 px dentro de la ventana) y se verifica también
   a 1920 × 1080. Ninguna pantalla principal necesita scroll de página (sección 3.1).

---

## 0.1 Decisiones cerradas por Paula (24-nov-2026, segunda ronda) — mandan sobre el resto del documento

Las marcadas 🆕 son funcionalidades nuevas **aprobadas por Paula**: se prototipan en las pantallas normales (regla 2)
y el equipo redacta su HU en la v13 con los borradores de `rediseno_final_backend.md` §5. Esta misma tabla, con su
impacto técnico, está en `rediseno_final_backend.md` §0.1.

| D | Tema | Decisión | Dónde se aplica |
|---|---|---|---|
| D-01 | Colores de la app | Con sesión, **toda la app usa los colores del tema aplicado** (tokens derivados). Se revierten RD-28 y RD-29. Sin selector Claro/Oscuro con sesión. | 2, 3.3, 4.2 |
| D-02 | Cantidad de colores del tema | **Se mantienen 3** (principal, secundario, texto); los demás tonos se derivan. No hay 4.º color. | 3.3 |
| D-03 | Próxima a vencer (amarillo) | Pendiente con fecha límite **hoy o mañana**. Vencida siempre rojo. | 3.4 (ver A-02) |
| D-04 | Tamaño de la ventana | **No se puede cambiar el tamaño arrastrando los bordes.** Solo minimizar y maximizar. La ventana **abre siempre maximizada**. Se bloquea también el zoom de la página (Ctrl + rueda, Ctrl +/−). | 0 regla 8, 3.1 |
| D-05 | 🆕 Recordatorios reales | Notificación de Windows **a la hora en punto del bloque horario** de la tarjeta tipo Recordatorio; **solo a la hora** (sin anticipación). Sin bloque horario, no hay notificación. | 6.7 |
| D-06 | Pantalla principal | **Se amplía el Planificador diario** (sigue siendo la pantalla principal): saludo, avance, próximas a vencer, mini calendario, acceso a Windi. **No hay pantalla «Inicio» separada.** | 6.1 |
| D-07 | 🆕 Windi | **Botón flotante** (ojos con colores del tema) en la app que abre un **panel lateral de chat**, **y** un **widget de escritorio** con los ojos. La opción «Agente de IA» **sale del menú**: dentro de la app, Windi vive solo en el panel. | 4.3, 9 |
| D-08 | Agregar tarjeta en el Kanban | **«+» solo en el encabezado de «Por hacer»** (las tarjetas nacen en «Por hacer», como la HU). Nada de «+» al final de cada columna. | 3.6, 6.2 |
| D-09 | Nueva columna | **«+» gris tras la última columna** (columna fantasma estrecha). | 3.6, 6.2 |
| D-10 | Muchas columnas | Las columnas **se estrechan** hasta un ancho mínimo; recién ahí el tablero hace scroll horizontal (solo el tablero). | 3.1, 6.2 |
| D-11 | Etiquetas en la tarjeta compacta | **Barras de color**, una por etiqueta (hasta 3), como el Figma. | 6.2 |
| D-12 | 🆕 Más reportes | Se incluyen **todas** las secciones: completadas por etiqueta, por tipo, vencidas por prioridad, tarjetas por columna, carga de los próximos 7 días y tiempo medio de completado. | 6.5 |
| D-13 | Rangos de Reportes | **Solo los de la HU**: Últimos 7 días, Últimos 30 días (por defecto), Últimos 12 meses, Personalizado. Se descarta «Esta semana / Este mes / Mes anterior» del Figma. | 6.5, 10 |
| D-14 | 🆕 Límite de etiquetas | **Máximo 3** por tarjeta **y** en el filtro de Reportes. Las tarjetas que ya tengan más de 3 **se recortan a 3** (se quitan las asignadas más recientemente). | 3.8, 6.5 |
| D-15 | 🆕 Ajustes de widgets | Se aprueban: **Reloj 12/24 h** e **inicio de semana del Calendario** (lunes/domingo). | 7.3 |
| D-16 | 🆕 Orden de tarjetas | **El orden lo define el usuario.** Por defecto: primero la más próxima a vencer. Si el usuario reordena (arrastrando), ese orden **se mantiene**. Vale para el Kanban, el Planificador diario, el widget Tareas del día y todo lo relacionado. | 6.1, 6.2, 9 (ver A-06) |
| D-17 | 🆕 Distribución predefinida | Las «posiciones rápidas» del Figma se llaman **«Distribución predefinida»** (término del glosario: *distribución de widgets*). **No** son plantillas. Se eligen en el paso 4 Widgets, junto a «Organizar widgets». | 7.1, 7.4 |
| D-18 | 🆕 Apariencia del widget | Cada widget puede usar **la paleta del tema (por defecto), otra paleta, colores libres** y **transparencia** del fondo. Se guarda **en el tema** (como la distribución). | 7.3 |
| D-19 | 🆕 Vista previa antes de agregar | Al elegir un widget del catálogo se ve sobre la vista previa del escritorio antes de «Agregar». | 7.3 |
| D-20 | Bloque horario en el formulario | **Sí**: campo opcional fecha + hora en el Formulario de tarjeta (sin horas pasadas, no después de la fecha límite). Necesario para D-05. | 6.7 |
| D-21 | Modelo de Personalización | **Una sola pantalla por pasos libres** con vista previa siempre visible: **1 Tema · 2 Fondo · 3 Colores y tipografía · 4 Widgets**. **Todo** (también agregar, activar, configurar, apariencia y distribución de widgets) pasa por el **tema en edición** y llega al escritorio con **«Aplicar»**; «Guardar» lo guarda en el tema. | 7 |
| D-22 | Plantillas | **Se quitan de la interfaz.** Hoy solo hay 3 (Windgets, Claro, Oscuro) que repiten lo que hacen las paletas y la imagen de fondo; «Cuaderno», «Mosaico», «Paisaje» solo existen en el Figma (inventadas). Queda una plantilla interna fija. El paso 2 Fondo muestra solo la **imagen de fondo** (Catálogo de imágenes, Subir imagen, Sin imagen) con tarjetas coherentes con miniatura. | 2, 7.1, 10 |
| D-23 | Botones de ventanas emergentes | **Abajo a la derecha**, principal a la derecha (reemplaza RD-34/RD-50 en ese punto). | 3.7 |
| D-24 | Nombre de la pantalla de edición | **«Organizar widgets»** para el botón y la pantalla (reemplaza «Editar escritorio» y «Pantalla de edición» en la interfaz). Pantalla completa, sin información extra. Pertenece al paso **4 Widgets**. | 2, 7.4 |
| D-25 | Menú contraído | La app **recuerda en este computador** si el menú quedó contraído (no se sincroniza). | 4.1 |
| D-26 | Agenda diaria | Se agrega una **tira semanal** (L 23 · M 24 · … · D 29) además de flechas, «Ir a hoy» y mini calendario. | 6.4 |
| D-27 | Cuentas sin widgets por defecto | Se **reparan solas** al iniciar sesión (se crean Reloj, Calendario, Tareas del día y Kanban si faltan). | 5, 7.3 |
| D-28 | 🆕 Personalización fácil del escritorio | Se aprueban: **oscurecer / desenfocar la imagen de fondo**, **forma de los widgets** (esquinas rectas/suaves/redondas y sombra sí/no, para todos los widgets del tema) y **tamaño de texto por widget**. | 7.1, 7.3 |
| D-29 | 🆕 Densidad de la app | Interruptor **Compacta / Cómoda** para filas de listas y tableros (Compacta por defecto, la escala de la sección 3.1). | 3.1, 8 |
| D-30 | Tamaño de letra: tema vs widget | El **tamaño de la tipografía del tema** (pequeño/mediano/grande) es el tamaño **por defecto** de la **aplicación** y de **todos los widgets**. Cada widget tiene «Tamaño de texto: Igual que el tema (por defecto) / Pequeño / Mediano / Grande»; si elige uno, **solo ese widget** deja de seguir al tema. La densidad (D-29) cambia espacios, no el tamaño de letra. | 3.1, 7.3 |
| D-31 | «Crear un tema desde este» y «Recuperar mi tema guardado» | **Se eliminan del Figma: son funcionalidades inventadas.** Lo que sí existe: «Guardar como tema» (HE-03-HU02) y «Cancelar cambios» (HE-02-HU13). | 7.5, 10 |
| D-32 | Frase incompleta P33 | Paula no la recuerda: **se descarta**. | 12 |

---

## 0.2 Revisión obligatoria antes de entregar (pedido de Paula, 24-nov-2026)

La IA que modifica los prototipos debe hacer **una pasada completa de revisión** sobre **todos** los marcos y dejar
constancia en un marco «Checklist de revisión» con cada punto marcado:

1. **Flujo:** cada pantalla tiene una forma clara de llegar y de salir; el «Mapa de navegación» (7.2) coincide con
   los marcos. Ninguna acción lleva a una pantalla que no existe.
2. **Coherencia de nombres:** ninguna sección, pantalla, botón o mensaje nombra algo que no existe o que existe con
   otro nombre (ejemplos del error actual: «Puedes elegirlo en Personalización» cuando esa sección no estaba en el
   menú; «Editar escritorio» vs «Organizar widgets»; «Nuevo tema» vs «Guardar como tema»; «Tema» vs «Paleta»). Usa
   solo los nombres de la sección 2. Haz una tabla «nombre → marcos donde aparece» y verifica que cada nombre se
   escribe igual en todos los marcos.
3. **Coherencia de acciones:** la misma acción tiene siempre el mismo verbo, el mismo ícono y la misma posición
   (Guardar, Cancelar, Eliminar, Aplicar, Regresar ←, cerrar ×). La acción principal siempre a la derecha (D-23) y
   solo una por pantalla o ventana.
4. **Miga de pan siempre:** toda pantalla con sesión muestra su ruta según la regla de 2.2 (por ejemplo
   «Personalización › 4 Widgets › Agregar widget › Clima») y cada nivel lleva a ese punto. Coincide exactamente con el
   nombre del menú y de los pasos.
5. **Jerarquía visual (crítico: «hoy todo tiene el mismo peso»):** se deben distinguir a simple vista, de más a menos
   peso:
   - **Acción principal:** botón relleno con `accion` y texto `sobre_accion`, 32–36 px. Una por vista.
   - **Acción secundaria:** botón con borde o fondo `superficie_baja`, mismo alto, texto `tinta`.
   - **Acción terciaria / de fila:** ícono gris sin borde (✎ 🗑 ⚙ ⋮ ×) que se refuerza al pasar el mouse.
   - **Enlace:** texto `accion` subrayado, sin caja.
   - **Elemento de lista o tarjeta:** superficie `superficie_alta`, sin borde fuerte; el **nombre** es lo más fuerte de
     la fila; los metadatos en 12 px gris.
   - **Títulos:** pantalla 26 px > sección 16 px peso 500 > elemento 14 px peso 500 > texto 14 px > secundario 12 px.
   - **Estado** (vencida, próxima a vencer, completada) siempre con su color y su ícono (3.4), nunca con forma de
     botón.
   Ningún botón debe parecer una fila de lista ni al revés (hoy «Aplicar», las filas de temas y el chip «Aplicado»
   pesan lo mismo).
6. **Consistencia visual:** mismos radios, bordes, sombras, separaciones (múltiplos de 4 px) y alturas en todos los
   marcos; un solo componente para cada cosa (un desplegable, un selector de fecha, un toast, una ventana emergente).
7. **Scroll y proporciones (crítico):** con la escala de la sección 3.1, la tipografía y los espacios guardan
   proporción con la ventana (siempre maximizada, D-04) para que **ninguna pantalla principal haga scroll de página**
   a 1366 × 768 con 125 % de escala (área útil ≈ 1093 × 560 px). Solo hacen scroll interno las zonas que crecen
   (listas, columnas, horas), con su encabezado fijo. Verifica cada marco a 1366 × 768 y a 1920 × 1080 y anota el
   resultado en el checklist.
8. **Colores del tema:** cada marco con sesión revisado con los 3 temas de ejemplo (regla 4), sin colores fuera de los
   tokens salvo las excepciones de 3.3.

---

## 0.3 Puntos A-01 a A-11 (resueltos por Paula el 24-nov-2026)

Paula respondió todos los puntos: la columna «Decisión» manda igual que D-01 a D-32. Los mismos A-01 a A-11 están en
`rediseno_final_backend.md` §0.2 (A-08 a A-11 son sobre todo técnicos). Ya no hay puntos abiertos.

| A | Tema | Decisión de Paula | Dónde |
|---|---|---|---|
| A-01 | Botones de la pantalla Organizar widgets. Con D-21 la pantalla ya no guarda en el tema: devuelve la distribución a la vista previa. Si su botón se sigue llamando «Guardar» (HE-05-HU04), se confunde con «Guardar» de Personalización. | «Cancelar» y **«Listo»** (principal). | 7.4 |
| A-02 | Color por día en el Calendario. HE-10-HU05 pinta en amarillo todo día con tarjetas pendientes sin vencidas; D-03 limita el amarillo de una **tarjeta** a «vence hoy o mañana». | El Calendario conserva la regla por día de HE-10-HU05; D-03 rige la marca de cada tarjeta en todas las vistas. | 3.4, 6.3 |
| A-03 | Texto del botón de HE-02-HU13. La HU dice «Cancelar»; D-31 lo nombra «Cancelar cambios». | Botón **«Cancelar cambios»** en Personalización (distinto de «Cancelar» de las ventanas emergentes); la v13 actualiza el texto de la HU. | 2, 7.1 |
| A-04 | Primer nivel de la miga para Configuración. RD-32 usa «Preferencias», pero el menú dice «Configuración». | Miga **«Configuración»** (igual que el menú). | 2.2, 4.2 |
| A-05 | Orden por defecto del Planificador diario. HE-12-HU01-ET03 ordena por hora del bloque horario; D-16 dice «la más próxima a vencer» (en el Planificador todas vencen hoy o antes). | Por defecto: por hora del bloque (ET03), después las sin hora por fecha límite; si el usuario arrastra, se mantiene su orden (D-16). | 6.1 |
| A-06 | D-16: ¿un solo orden manual para el Kanban, el Planificador y Tareas del día, o un orden por vista? | **Un solo orden para todo:** reordenar una tarjeta en cualquier vista (Kanban, Planificador diario, widget Tareas del día, widget Kanban) cambia su orden en todas. En el Kanban, cada columna muestra sus tarjetas en ese mismo orden. | 6.1, 6.2 |
| A-07 | Widget de Windi en el escritorio: ¿uno solo por cuenta? | Uno solo (como Noticias y Reproductor de música). | 4.3 |
| A-08 | Densidad Compacta/Cómoda (D-29): ¿de la cuenta o de cada computador? | De la cuenta: se sincroniza. | 3.1 |
| A-09 | Años del selector de mes y año | 1970 a 2100. | 6.3 |
| A-10 | Widgets de la cuenta frente al flujo por borrador (D-21) | **Todo del tema:** cada tema tiene sus propios widgets (agregar, eliminar, activar, configurar, apariencia, tamaño y posición). Eliminar un widget lo quita solo del tema en edición. El texto de M-07 cambia (ver backend §5.12). | 7.1, 7.3 |
| A-11 | Recordatorios con la app cerrada con «Salir» o sin sesión | No suenan y no se muestran los perdidos al volver; se dice así en la HU. | 6.7 |

---

## 1. Resumen ejecutivo: qué está mal hoy

| # | Problema general | Dónde se ve | Sección |
|---|---|---|---|
| 1 | Todo es demasiado grande (títulos de 43 px, texto de 17–22 px, filas de 106 px, botones de 44 px). A 1366 × 768 **todas** las pantallas hacen scroll, incluso Inicio de sesión. | Todas | 3.1 |
| 2 | Se mezcla «tema» con «colores» y con «claro/oscuro». Con sesión existe un selector Claro/Oscuro que no debería existir y que, al fallar, manda a una sección «Personalización» que no existe en el menú. | Encabezado, mensajes, Personalización | 2, 4.2 |
| 3 | Los colores de la app no salen del tema: RD-28 fijó colores por modo y el tema solo se ve en el wallpaper. Paula pide lo contrario: el tema manda en toda la app (D-01). | Todas con sesión | 2, 3.3 |
| 4 | Vencido y próximo a vencer no tienen color: «Vencida» es una etiqueta gris, los días vencidos del calendario no son rojos y los pendientes no son amarillos. | Kanban, Calendario, Agenda, Planificador, Reportes | 3.4 |
| 5 | Mensajes emergentes inconsistentes: unos se van a los 4 s, otros («No pudimos mostrar tu wallpaper…») nunca se van; no hay animación ni tipos de color. | Toda la app | 3.5 |
| 6 | Navegación de fechas incómoda: «Día anterior / Hoy / Día siguiente», «Mes anterior / Mes siguiente» como texto; «Hoy» abajo; en Semana desaparece «Semana»; no se puede saltar a un mes o un año. | Agenda, Calendario | 6.3, 6.4 |
| 7 | Botones con texto donde bastaría un ícono («Cerrar», «Regresar», «Nueva columna», «Nueva tarjeta», «Configurar/Eliminar»). Ventanas sin «×» y sin fondo oscurecido. | Todas | 3.6, 3.7 |
| 8 | Pantallas que desperdician espacio o clics: una pantalla entera para escribir la ciudad del Clima; filas de widgets de 1 línea con «Configurar» y «Eliminar» muy separados; temas muy separados. | Personalización | 7 |
| 9 | Faltan prototipos: Planificador diario ampliado como pantalla principal, Personalización unificada, vista expandida del Kanban, editar columna/etiqueta, estados vacíos, cargando, sin conexión, muchas subpantallas de widgets, widgets en el escritorio, panel de Windi. | Varias | 11 |
| 10 | El Figma tiene cosas sin HU: unas quedaron aprobadas como 🆕 (Distribución predefinida, apariencia del widget, Reloj 12/24 h, inicio de semana, vista previa antes de agregar) y otras se eliminan (plantillas inventadas, rangos de fecha distintos a la HU, «Crear un tema desde este»…). | Personalización, Reportes, Etiquetas | 10 |

---

## 2. Nombres únicos: glosario aplicado, navegación y acciones (léelo antes de tocar cualquier pantalla)

Paula detectó confusión de conceptos en todas las pantallas. **Cada concepto tiene un solo nombre** (RNF-29: 0
sinónimos). Si un texto del Figma usa otro nombre para alguno de estos conceptos, cámbialo por el de esta sección.

### 2.1 Conceptos

| Nombre único | Qué es (glosario v4 + decisiones) | Cómo aparece en la interfaz | No usar |
|---|---|---|---|
| **Tema** | Wallpaper + widgets (activos, configuración, apariencia y distribución) guardados juntos con un nombre (1–40 caracteres, único, hasta 10). **También define los colores y la tipografía de la aplicación** (D-01). | Lista «Mis temas» del paso 1 Tema. | «Tema del escritorio», «Tema Claro/Oscuro» (Claro y Oscuro son paletas). |
| **Tema aplicado** | El que se ve en el escritorio **y en la aplicación**. Siempre hay uno. | Chip «Aplicado» junto a su nombre. | «Tema actual», «Tema activo». |
| **Tema en edición** | El que se modifica en la vista previa; por defecto, el aplicado. | Selector «Tema en edición» arriba del panel de Personalización. | «Tema seleccionado». |
| **Vista previa** | Dibujo del escritorio con los cambios del tema en edición antes de aplicarlos. | Zona izquierda de Personalización. | «Previsualizar» como nombre de pantalla (sí como verbo de un botón). |
| **Colores del tema** | Los **tres** colores del tema: **principal**, **secundario** y **del texto** (D-02). | Sección «Colores del tema» del paso 3. | «Colores de la app», «Acento». |
| **Paleta** | Grupo predefinido de 3 colores que cambia los colores del tema **en un paso**. Si luego se cambia un color, la paleta queda «Personalizada». «Claro» y «Oscuro» (RD-14) **son paletas**. | Sección «Paletas» del paso 3. | «Tema» para referirse a una paleta. |
| **Tipografía** | Fuente + tamaño (Pequeño, Mediano, Grande) del tema; se usa en wallpaper, widgets y **aplicación** (D-30). | Sección «Tipografía» del paso 3. | «Letra», «Fuente del sistema». |
| **Imagen de fondo** | Imagen del catálogo de imágenes o propia (JPG/JPEG/PNG ≤ 20 MB) que ocupa el fondo del wallpaper. | Paso 2 Fondo, título «Imagen de fondo». | «Fondo de pantalla» (salvo en el aviso de RT-04 ya aprobado), «Plantilla». |
| **Catálogo de imágenes** | Las imágenes de fondo que ofrece Windgets. | Tarjeta «Catálogo de imágenes» del paso 2 y su galería. | «Galería», «Plantillas». |
| **Plantilla** | Diseño interno fijo del wallpaper. **No se muestra en la interfaz** (D-22). | — | Cualquier texto con «Plantilla» en las pantallas. |
| **Wallpaper** | Plantilla interna rellenada con imagen de fondo, colores y tipografía. **Los widgets no forman parte del wallpaper.** | Solo en mensajes del escritorio («No pudimos mostrar tu wallpaper…»). | Como nombre de una sección del menú. |
| **Widget** | Elemento interactivo o informativo del escritorio (Reloj, Calendario, Tareas del día, Kanban, Clima, Noticias, Imagen estática, Carrusel de imágenes, Animación, Texto, Reproductor de música y 🆕 Windi). | Paso 4 Widgets. | «Módulo», «Componente». |
| **Apariencia del widget** | 🆕 Colores y transparencia de un widget: paleta del tema (por defecto), otra paleta, colores libres, transparencia (D-18). Se guarda en el tema. | Sección «Apariencia» dentro de «Configurar widget». | «Apariencia individual», «Usar el mismo tema en todos». |
| **Forma de los widgets** | 🆕 Esquinas (Rectas, Suaves, Redondas) y sombra (sí/no) de todos los widgets del tema (D-28). | Sección «Forma de los widgets» del paso 4. | — |
| **Distribución de widgets** | Posición y tamaño de cada widget; forma parte del tema. | Se ajusta en **Organizar widgets**. | «Posiciones», «Layout». |
| **Distribución predefinida** | 🆕 Distribución de widgets lista para usar («Original», «Reloj a la derecha», «Kanban centrado»…); **no** es plantilla (D-17). | Selector «Distribución predefinida» del paso 4. | «Posiciones rápidas», «Plantilla de widgets». |
| **Organizar widgets** | Pantalla completa donde se mueven y redimensionan los widgets (C-03, HE-05). Nombre único del botón y de la pantalla (D-24). | Botón «Organizar widgets» del paso 4 y la pantalla. | «Editar escritorio», «Pantalla de edición», «Distribución» como pantalla. |
| **Apariencia (Claro / Oscuro)** | Solo existe **antes de iniciar sesión** (RD-02). | Selector sol/luna en las pantallas de cuenta. | En cualquier pantalla con sesión. |
| **Color de etiqueta / color de columna** | Sale del **catálogo de colores**, no del tema. | Muestra de color junto a la etiqueta o columna. | «Color del tema» para estos. |
| **Colores de estado** | Vencida (rojo), próxima a vencer (amarillo, D-03), completada (verde). No son colores del tema (R-04); se calculan para contrastar con el tema (`interfaz.md`, «Tema a tokens»). | Íconos y marcas de estado (3.4). | Gris, oliva o cian para estados. |
| **Densidad** | 🆕 Compacta / Cómoda (D-29): espacios y altos de fila, no tamaño de letra. | Configuración. | «Tamaño de la app». |
| **Mensaje de resultado / aviso / confirmación / mensaje de campo / opción deshabilitada / estado vacío** | Los seis tipos de mensaje de RT-04. «Mensajes emergentes» en el pedido de Paula = mensaje de resultado + aviso. | Sección 3.5. | «Notificación» para un mensaje dentro de la app (se reserva para la notificación de Windows, 6.7). |

**Regla de redacción:** «tema» solo para el conjunto con nombre; «paleta» para el conjunto predefinido de 3 colores;
«colores del tema» para principal/secundario/texto; «Claro»/«Oscuro» solo en las pantallas sin sesión o como nombre de
paleta.

### 2.2 Navegación: menú, pasos y miga de pan

| Bloque del menú | Opciones (en este orden) | Miga de pan |
|---|---|---|
| **Planificador** | Planificador diario (pantalla principal) · Tablero Kanban · Calendario · Agenda diaria · Reportes · Etiquetas | «Planificador › Tablero Kanban», «Planificador › Reportes › Más reportes» |
| **Personalización** | Personalización (una sola entrada, D-21) | «Personalización › 1 Tema», «Personalización › 4 Widgets › Agregar widget › Clima» |
| (al pie) | Configuración · Cerrar sesión (ícono) | «Configuración» (A-04) |
| (flotante) | Windi: botón con ojos en todas las pantallas con sesión (D-07) | El panel de Windi no cambia la miga de la pantalla que está debajo. |

- Las ventanas emergentes (Detalle de tarjeta, Formulario de tarjeta, confirmaciones…) **no** agregan nivel a la miga:
  muestran su título en la propia ventana.
- La pantalla **Organizar widgets** es pantalla completa sin menú (C-03): su barra mínima dice «Organizar widgets»
  como título, sin miga (7.4).
- El bloque se llama **«Planificador»** (como hoy en el menú y en RT-01) y no «Planificación».

### 2.3 Acciones con nombre fijo

| Acción | Texto exacto | Dónde | Origen |
|---|---|---|---|
| Llevar el tema en edición al escritorio | **Aplicar** (principal) | Barra de acciones de Personalización | HE-02-HU12 |
| Guardar el tema en edición sin aplicarlo | **Guardar** | Barra de acciones de Personalización | HE-02-HU11 |
| Crear un tema nuevo con los cambios | **Guardar como tema** | Paso 1 Tema | HE-03-HU02 |
| Descartar los cambios de la vista previa | **Cancelar cambios** (A-03) | Barra de acciones de Personalización | HE-02-HU13 |
| Volver a los valores por defecto | **Restablecer** | Paso 3 | HE-02-HU08 |
| Abrir la pantalla de distribución | **Organizar widgets** | Paso 4 | D-24 |
| Agregar un widget | **+ Agregar widget** (abre el catálogo) y **Agregar** (confirma) | Paso 4 | HE-04 |
| Configurar un widget | **Configurar** (⚙) | Fila del widget | HE-04-HU12 |
| Cerrar una ventana | **×** (tooltip «Cerrar») | Toda ventana emergente | 3.7 |
| Volver un nivel | **←** (tooltip «Regresar») | Subpantallas | 3.6 |
| Cancelar una ventana emergente | **Cancelar** (secundaria, a la izquierda de la principal) | Ventanas emergentes | D-23 |

No usar: «Nuevo tema», «+ Nuevo tema», «Crear un tema desde este», «Recuperar mi tema guardado», «Volver al editor»,
«Aplicar al escritorio» (el botón es «Aplicar»), «Editar escritorio».

---

## 3. Sistema de diseño global (aplica a todas las pantallas)

### 3.1 Tamaño, densidad y scroll (pedido repetido de Paula: «todo es muy grande», «todo hace scroll»)

Diagnóstico medido en la app: a 1366 × 768 con escala de Windows el Inicio de sesión ya hace scroll y esconde el logo
y el selector Claro/Oscuro; el menú lateral tiene scroll vertical **y horizontal** y «Configuración» queda cortada;
el Planificador diario muestra solo 3 tarjetas; el formulario de tarjeta hace scroll interno; el calendario semanal
corta los títulos de las tarjetas; la Agenda esconde su propia fecha y sus botones al bajar a la hora actual.

**Escala nueva (reemplaza la de RD-32, RD-37, RD-52 y la regla 3 de `rediseno.md`).** Es la densidad **Compacta**
con tipografía del tema en **Mediano**:

| Elemento | Hoy | Nuevo |
|---|---|---|
| Título de pantalla | 43 px negrita | **26 px** negrita |
| Miga de pan (arriba del título) | 16 px | **13 px** |
| Título de sección o bloque | 22–27 px | **16 px** peso 500 |
| Nombre de elemento (fila, tarjeta) | 17–22 px | **14 px** peso 500 |
| Texto normal | 17 px | **14 px** |
| Texto secundario (tipo · etiquetas · fecha) | 14–16 px | **12 px** |
| Fila del Planificador diario | 106 px | **52–56 px** (dos líneas: título + metadatos) |
| Botón / campo | 44 px | **32–36 px** |
| Opción del menú lateral | 40 px | **32 px** |
| Ancho del menú lateral | 248 px | **200–220 px**; contraído **56 px** |
| Márgenes de la zona de contenido | 300 px a la izquierda, 70 a la derecha | **24 px** desde el menú y **24 px** a la derecha |

Reglas:
- **Sin scroll de página** en ninguna pantalla principal a 1366 × 768. Si el contenido crece (muchas tarjetas,
  muchas horas), el scroll va **dentro** de la zona que crece (la lista, la columna, la cuadrícula de horas), y los
  encabezados y botones de esa zona quedan fijos.
- Nunca scroll horizontal, salvo **dentro** del Tablero Kanban cuando las columnas ya llegaron a su ancho mínimo
  (D-10). El menú lateral nunca tiene scroll.
- **Tamaño de letra (D-30):** el tamaño de la tipografía del tema escala la app y todos los widgets a partir de esta
  tabla: Mediano = la tabla; Pequeño −1 px; Grande +2 px. Un widget con tamaño de texto propio no sigue al tema.
- **Densidad (D-29):** «Cómoda» aumenta altos de fila y separaciones (+8 px en filas, +4 px en separaciones) sin
  cambiar el tamaño de letra. Prototipar el Planificador diario y el Tablero Kanban en las dos densidades.
- La ventana abre maximizada y no se redimensiona (D-04); el diseño se verifica con la escala de Windows de 100 a
  150 % («ajustar la aplicación a la escala», pedido de Paula). Como el zoom de la página queda bloqueado, el tamaño
  «Grande» de la tipografía del tema es el que cubre a quien necesita letra más grande.
- Aprovechar todo el ancho de la pantalla: dos o tres columnas de información donde hoy hay una (ver cada pantalla).

### 3.2 Tipografía
Con sesión, la fuente de la aplicación es la **tipografía del tema aplicado** (glosario: «Tipografía … en la
aplicación»). Antes de iniciar sesión, Rubik fija (RD-06).

### 3.3 Colores de la aplicación = colores del tema (D-01, D-02)

- Con sesión, **todos** los colores de la interfaz salen de los **tres colores del tema aplicado** mediante los
  tokens de `docs/interfaz.md` («Tema a tokens»: `marco`, `superficie`, `superficie_alta`, `superficie_baja`,
  `linea`, `tinta`, `texto`, `accion`, `sobre_accion`, `borde`). Esto **revierte RD-28 y RD-29** (en el repo se
  registra como RD-62, ver `rediseno_final_backend.md` §4.1).
- Los colores de **marca** (cian `#00D9E2`, magenta, amarillo, púrpura) **no** se usan como acción, selección ni
  estado con sesión (R-04). Hoy el botón principal es cian en todos los temas: debe ser `accion` del tema.
- Excepciones fijas, iguales en todos los temas: colores de estado (3.4), colores de mensajes (3.5), colores de
  etiquetas y columnas (catálogo de colores) y el logo.
- Prototipar cada pantalla con los 3 temas de ejemplo (regla 4) para comprobar contraste (R-13: texto 4,5:1, tinta
  7:1, controles 3:1).
- **Cantidad de colores (D-02):** se mantienen 3 colores. Los tonos que faltan (hover, seleccionado, deshabilitado,
  fondo de columna, fondo de fila) se derivan con las mezclas de `interfaz.md`. Documenta en el Figma la tabla de
  tokens con los 3 temas de ejemplo.
- Paletas: revisar que el catálogo de paletas tenga variedad suficiente (claras, oscuras, pastel, alto contraste)
  para que «los temas puedan ser de diversos colores» sin tener que elegir hex a mano.

### 3.4 Colores de estado: vencida siempre rojo, próxima a vencer siempre amarillo (en todas las vistas)

| Estado | Color | Forma (R-12: nunca solo color) | Dónde |
|---|---|---|---|
| **Vencida** (no completada y fecha límite pasada) | **Rojo** (`estado_vencida`) | Barra o borde izquierdo rojo de 3 px en la tarjeta + ícono de alerta ⚠ rojo + texto «Vencida» | Planificador diario, Kanban (compacta y expandida), Calendario, Agenda (tarjetas sin horario y bloques), Panel del día, Detalle de tarjeta, widget Tareas del día, widget Kanban, Reportes |
| **Próxima a vencer** (no completada, fecha límite **hoy o mañana**, D-03) | **Amarillo** (`estado_pendiente`) | Ícono de reloj amarillo | Igual que arriba |
| Pendiente con fecha límite después de mañana | Sin color de estado | Solo la fecha en texto secundario | Igual que arriba |
| **Día en el Calendario** | Rojo si tiene vencidas; amarillo si tiene pendientes y ninguna vencida (HE-10-HU05, A-02) | Relleno claro + borde del color + ícono | Calendario mes y semana, mini calendario del Planificador diario |
| **Alerta grave** | Rojo | Ícono ⚠ | Todo lo «gravísimo» (pedido de Paula) |
| **Alerta / advertencia** | **Amarillo** (nunca gris) | Ícono ⚠ amarillo | Avisos, contraste insuficiente, sin conexión (pedido de Paula: «todo lo que tenga que ver con alerta o vencido … amarillo en vez de gris») |
| **Completada** | Verde (`estado_completada`) | ✓ | Reportes, casillas, Kanban «Hecho» |

En Reportes, la gráfica de anillo usa exactamente estos colores (hoy usa rojo, oliva y **cian de marca**).

### 3.5 Mensajes emergentes (toasts) y avisos: comportamiento y colores

Pedido de Paula: «todos los mensajes emergentes deben estar vivos o aparecer con una animación fluida una cantidad
limitada de segundos y desaparecer; no interfieren con la aplicación, aparecen encima de todas las vistas, no
modifican el comportamiento de la aplicación». Y «definir claramente los colores de los mensajes emergentes, en qué
caso usar cada uno».

**Comportamiento común:**
- Aparecen **encima de todo** (también de las ventanas emergentes y del panel de Windi), en la esquina inferior
  derecha, apilados (máximo 3; el más nuevo arriba). Si el botón flotante de Windi ocupa esa esquina, se apilan
  encima de él.
- Entran con animación suave (deslizar 12 px + aparecer, 200 ms) y salen igual (150 ms). Con «reducir movimiento»
  de Windows, solo aparecen y desaparecen.
- Duración: **4 s** los de éxito e información; **6 s** los de advertencia y error. Al pasar el mouse se pausan.
  Ícono «×» pequeño (no un botón grande con borde como hoy) para cerrarlos antes.
- **No bloquean** clics ni teclado; no mueven el contenido; no cambian el comportamiento de la pantalla.
- Tamaño compacto: una línea de 13 px, ancho máximo 360 px, alto 40 px.
- Se anuncian a lectores de pantalla (`role="status"`; `role="alert"` para error).

**Tipos y colores (fijos, iguales en todos los temas, con fondo sólido y borde izquierdo de 4 px):**

| Tipo | Color | Ícono | Cuándo se usa | Ejemplos de textos existentes |
|---|---|---|---|---|
| **Éxito** | Verde | ✓ | Una acción del usuario terminó bien | «Tarjeta creada.», «Tarjeta eliminada.», «¡Bien hecho! Tarjeta completada.» |
| **Información** | Color `accion` del tema | ⓘ | Algo cambió sin que sea error | «Si el correo está registrado, te enviamos un código…», «Sincronizado» (si se muestra) |
| **Advertencia** | Amarillo | ⚠ | Algo no salió como se esperaba pero hay alternativa o se resuelve solo | «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.», «Sin conexión…» |
| **Error** | Rojo | ⛔ | La acción falló y el usuario debe hacer algo | «No pudimos completar la operación. Intenta de nuevo más tarde.», «Ocurrió un error inesperado…» |

**Avisos persistentes (RT-04 «Aviso»)**: siguen existiendo para estados que duran (sin conexión, servicio externo
caído), pero como **barra delgada** (32 px) arriba de la zona afectada, con el color de advertencia, y con «×» para
ocultarla. Corrige el bug: «No pudimos mostrar tu wallpaper…» aparece y **nunca se va** → pasa a ser un toast de
advertencia de 6 s que se muestra una vez por cambio de estado.

**Prototipar:** un marco «Mensajes emergentes» con los 4 tipos en los 3 temas de ejemplo, apilados, con y sin «×», y
un marco «Aviso» con la barra delgada.

### 3.6 Íconos en lugar de texto (pedido de Paula: «analizar en cada botón si es necesario el texto»)

| Hoy (texto) | Nuevo | Dónde |
|---|---|---|
| «Regresar» | Flecha ← (24 px) a la izquierda del título, con tooltip «Regresar» | Verificar correo, Recuperar contraseña (Correo, Código, Nueva contraseña), Agregar widget y sus subpantallas, Más reportes |
| «Cerrar» | «×» en la esquina superior derecha | Detalle de tarjeta, Panel del día, Seleccionar rango, Mes y año, panel de Windi, toda ventana emergente |
| «Nueva columna» | «+» gris sutil, tras la última columna, del tamaño de una columna estrecha (40 px), con tooltip «Nueva columna» (D-09) | Tablero Kanban |
| «Nueva tarjeta» en el Kanban | «+» **solo en el encabezado de «Por hacer»** con tooltip «Nueva tarjeta»; la tarjeta nace en «Por hacer» (D-08). No hay «+» al final de las columnas | Tablero Kanban |
| «Nueva tarjeta» (botón grande) | Botón «+ Nueva tarjeta» compacto (ícono + texto corto) | Planificador diario, Calendario, Agenda diaria, Panel del día |
| «Vista compacta / Vista expandida» (texto que dice lo contrario del estado) | Interruptor de dos íconos (filas cortas / filas largas) con el actual resaltado | Tablero Kanban |
| «Editar» / «Eliminar» de una fila | Íconos ✎ y 🗑 visibles al pasar el mouse **en la misma fila** (o dentro de «⋮») | Etiquetas, Mis temas, Widgets, columnas |
| «Configurar» / «Eliminar» del widget | Íconos ⚙ y 🗑 a la derecha del interruptor, juntos | Paso 4 Widgets |
| «Hoy» | Ícono de calendario con el número del día actual («24») y tooltip «Ir a hoy» | Agenda diaria, Calendario, mini calendario del Planificador diario |
| «Día anterior / Día siguiente», «Mes anterior / Mes siguiente», «Semana anterior / Semana siguiente» | Flechas ‹ › a los lados de la fecha | Agenda diaria, Calendario |
| «Enviar» (Windi) | Ícono de avión de papel | Panel de Windi |
| «Cerrar sesión» | Ícono de salida ⎋ al pie del menú lateral (4.1) | Marco |

Regla: el ícono siempre lleva **nombre accesible y tooltip** con el texto que reemplaza (RT-04 y accesibilidad); las
acciones destructivas o que no se pueden deshacer conservan texto en la confirmación.

### 3.7 Ventanas emergentes

- Al abrir cualquier ventana emergente (detalle, formulario, confirmación, selector) **se oscurece el fondo** (capa
  `marco` al 60 % sólido mezclado, nunca transparencias apiladas: R-05/R-08) y **la ventana queda resaltada** al
  centro. Hoy no hay fondo oscurecido y la ventana queda pegada arriba.
- Siempre «×» arriba a la derecha (no el botón «Cerrar»). Esc cierra.
- Las acciones van **abajo a la derecha, la principal a la derecha** (D-23; reemplaza RD-34/RD-50 en ese punto). La
  acción destructiva («Eliminar») es el botón principal en rojo.
- Alto máximo = 85 % de la ventana; si el contenido no cabe, solo el cuerpo hace scroll y los botones quedan fijos.

### 3.8 Controles de selección: listas desplegables o algo más fácil de seleccionar

- **Etiquetas de una tarjeta:** lista desplegable con buscador y casillas, que muestra las elegidas como «chips» de
  color dentro del campo; **máximo 3 etiquetas** (D-14). Al llegar a 3, las demás quedan deshabilitadas con el motivo
  «Puedes asignar hasta 3 etiquetas.» (tipo «opción deshabilitada» de RT-04). Hoy es un campo de texto vacío +
  casillas nativas debajo.
- **Filtro de etiquetas de Reportes:** la misma lista desplegable con chips, **máximo 3** (D-14), con el motivo
  «Puedes elegir hasta 3 etiquetas.». El Figma «Selecciona hasta 3 etiquetas» muestra «combinaciones de muestra» como
  lista fija: **no copiar eso** (se elimina, sección 10).
- **Tipo y Prioridad:** controles segmentados (3 botones) en lugar de `<select>` nativo. La prioridad es opcional
  (HE-07-HU01-ET11): el control muestra «Sin prioridad» seleccionado por defecto (hoy aparece vacía sin indicación).
- **Fecha límite:** el calendario **no** debe estar siempre abierto ocupando media ventana: campo con ícono que abre
  un calendario flotante; los días pasados **deshabilitados** (hoy se pueden elegir y luego da error «La fecha límite
  no puede ser anterior a hoy»); flechas y día actual con colores del tema (hoy salen azules del navegador).
- **Bloque horario (D-20):** campo opcional con fecha (calendario flotante, no posterior a la fecha límite) + hora en
  punto (00:00–23:00, horas pasadas deshabilitadas) y opción «Sin bloque horario».
- **Rango de fechas de Reportes:** selector con las opciones de la HU (D-13, sección 6.5) + selector de fecha que
  **solo permite fechas válidas** (hoy acepta texto libre: «hola» → «Diligencia una fecha válida»).
- **Ciudad del Clima:** autocompletado **en tiempo real** mientras se escribe (debounce 300 ms), en «Agregar widget ›
  Clima» y en «Configurar widget». (En «Agregar widget › Clima» de la app ya funciona.)
- **Mes y año del calendario:** selector desplegable de mes + año (sección 6.3).
- Todos los `<select>` nativos se reemplazan por el componente desplegable del sistema de diseño (hoy el menú
  desplegable nativo sale en negro sobre tema claro).

### 3.9 Campos y formularios
- Contraseña: **ícono de ojo** para mostrar/ocultar en Inicio de sesión (ya está en el Figma, falta en la app), y
  también en Registro y Nueva contraseña.
- Formularios en dos columnas cuando hay espacio (RD-51) y botones fijos abajo a la derecha (D-23).
- Sin subrayados decorativos: en la Agenda diaria se quita la línea debajo del texto de las tareas (pedido de Paula);
  en el Kanban los títulos tampoco van subrayados (toda la tarjeta es clicable, sección 6.2).

---

## 4. Marco de la ventana con sesión

### 4.1 Menú lateral

| Cambio | Detalle |
|---|---|
| Dos bloques visualmente distintos | **Planificador** (Planificador diario —pantalla principal ampliada, D-06—, Tablero Kanban, Calendario, Agenda diaria, Reportes, Etiquetas) y **Personalización** (una sola entrada «Personalización», D-21, sección 7). Cada bloque con un título pequeño en mayúsculas y separación de 16 px, o en su propia tarjeta. **Configuración** al pie. «Agente de IA» **ya no está en el menú** (D-07): Windi es el botón flotante (4.3). |
| Orden | El de la tabla de 2.2: Etiquetas al final del bloque Planificador (es configuración del planificador). |
| Cerrar sesión | Ícono de salida al pie, debajo de Configuración, con tooltip «Cerrar sesión». Abre M-11/M-12 como hoy. Se mantiene también dentro de Configuración (HE-16-HU03). |
| Ocultar / ampliar menú | El ícono va **al lado del logo** (no debajo, como hoy), un poco más grande (24 px, área de 36 px). Con el menú contraído quedan solo los íconos (56 px) y el mismo botón para ampliarlo, arriba. La app recuerda en este computador si quedó contraído (D-25). |
| Sin scroll | El menú completo cabe a 1366 × 768 (hoy tiene scroll vertical y horizontal y corta «Configuración»). |
| Opción actual | Fondo y texto con `accion` del tema (no colores fijos). |

Prototipar: menú ampliado y contraído, en los 3 temas.

### 4.2 Encabezado de cada pantalla
- **Quitar el selector Claro/Oscuro** con sesión (D-01). Esto también elimina el mensaje «No pudimos aplicar el tema
  Oscuro. Puedes elegirlo en Personalización.», que además apunta a una sección que no existía con ese nombre.
- Miga de pan en 13 px (regla de 2.2) y debajo el título en 26 px. Cada nivel de la miga es un enlace a ese nivel,
  salvo el último.
- Indicador de sincronización compacto a la derecha («Sincronizado», «Sincronizando…», «Sin conexión», «Error de
  sincronización» + cantidad de cambios pendientes), con ícono pequeño. Prototipar los 4 estados.
- En Personalización, la miga dice el paso actual («Personalización › 3 Colores y tipografía») y la barra de pasos lo
  resalta (7.1): así el usuario sabe en qué sección está.

### 4.3 Windi: botón flotante, panel de chat y widget de escritorio (D-07)

Paula: «el agente de IA es muy grande el ícono y el texto, ocupa mucho espacio»; «hacer un widget del agente de IA,
sin la imagen de Windi, solo los ojos o algo no invasivo, con los colores del tema».

- **Botón flotante:** en todas las pantallas con sesión (salvo Organizar widgets), esquina inferior derecha, 40 px:
  dos «ojos» (dos óvalos) del color `accion` del tema sobre `superficie_alta`. Parpadean mientras Windi está
  «Escribiendo…». Tooltip «Windi».
- **Panel de chat:** se abre como panel lateral derecho (360 px, todo el alto) sobre la pantalla actual, sin cambiar
  de pantalla ni de miga; «×» arriba a la derecha y Esc lo cierran. Contenido: encabezado con los ojos (28 px) y
  «Windi» (13 px); conversación en todo el alto con mensajes de 14 px (hoy 22 px); propuesta compacta con
  «Confirmar» (principal) y «Rechazar»; campo de mensaje de una línea que crece (hoy una caja de 134 px fija);
  contador «0 / 2000» pequeño; ícono enviar (avión de papel).
- **Estados a prototipar del panel:** vacío (saludo), escribiendo, propuesta (Confirmar / Rechazar), propuesta
  descartada, error con «Reintentar», sin conexión (Windi necesita internet: aviso + campo deshabilitado con motivo).
- **Widget de escritorio «Windi»** 🆕: widget local con los mismos ojos y los colores del tema (o su apariencia,
  D-18). Al seleccionarlo abre la ventana principal con el panel de Windi abierto (como hace HE-06-HU08 con los
  widgets interactivos). Uno solo por cuenta (A-07). Aparece en el catálogo de widgets del paso 4.
- La pantalla «Agente de IA» del Figma se reemplaza por el panel; sus marcos se reutilizan como base del panel.

---

## 5. Pantallas sin sesión (01 · Acceso)

| Pantalla | Cambio |
|---|---|
| Verificar correo, Recuperar contraseña (Correo, Código, Nueva contraseña) | **La sombra no sigue la nota en la esquina superior derecha** (verificado en la app: la sombra es un rectángulo que asoma por encima de la esquina doblada). La sombra debe recortarse con la misma forma de la nota, incluida la esquina doblada. Revisar también en Inicio de sesión y Registro. |
| Las mismas | «Regresar» → flecha ← junto al título (3.6). |
| Inicio de sesión | Ícono de ojo en Contraseña. Debe caber sin scroll a 1366 × 768 con escala (hoy el logo y el selector Claro/Oscuro quedan ocultos arriba y hay barra de scroll). Reducir el tamaño de Windi y del globo. |
| Todas | Claro/Oscuro **sí** se mantiene aquí (es el único lugar). |
| Registro | Al crear la cuenta, el tema inicial «Windgets» toma la paleta del modo elegido (Claro u Oscuro) y la cuenta nace con los widgets por defecto (Reloj, Calendario, Tareas del día, Kanban) activos. El usuario llega al Planificador diario (6.1). Las cuentas antiguas sin esos widgets se reparan solas al iniciar sesión (D-27). |

---

## 6. Planificador

### 6.1 Planificador diario (pantalla principal ampliada, D-06)

Paula preguntó «¿qué ve el usuario al entrar? ¿información del día?». Respuesta (D-06): el **Planificador diario**
sigue siendo la pantalla principal y se amplía; **no** hay pantalla «Inicio» separada. Solo usa datos que ya existen.

- **Composición en dos columnas a 1366 × 768, sin scroll de página:**
  - **Columna principal (≈ 2/3):** saludo con el alias («Hola, Paula») y fecha larga; resumen de avance del día
    («Completadas: X de Y» + barra); «+ Nueva tarjeta» (ícono + texto) a la derecha; la lista de tarjetas de hoy con
    scroll interno.
  - **Columna derecha (≈ 1/3):** «Próximas a vencer» (las 3 siguientes tarjetas pendientes por fecha límite, con su
    color de estado); mini calendario del mes con los días en rojo/amarillo (3.4) y el ícono «Ir a hoy»; acceso a
    Windi (abre el panel, 4.3).
- **Densidad:** filas de 52–56 px → caben **8–10** tarjetas a 1366 × 768 (hoy 3).
- **Fila:** casilla · hora (o «Sin hora») · título (14 px peso 500) + debajo tipo · etiquetas con su punto de color ·
  prioridad como chip pequeño. **Toda la fila abre el Detalle de tarjeta** (igual que el Kanban); la casilla solo
  marca. Se quita el botón «i».
- **Estados de color:** vencidas con barra izquierda roja + ⚠ «Vencida» en rojo (el Figma usa una etiqueta amarilla
  «Vencida»: cambiar a rojo); próximas a vencer con reloj amarillo (D-03).
- **Recordatorios:** la franja del Figma «Recordatorio · Hoy, 16:30 · Compartir el prototipo» se mantiene como aviso
  dentro de la app cuando llega la hora del bloque horario de un Recordatorio (6.7, D-05).
- **Orden (D-16, A-05, A-06):** por defecto por hora del bloque y luego por fecha límite; el usuario puede
  **arrastrar** para reordenar y ese orden se mantiene y es **el mismo** en el Kanban y en el widget Tareas del día.
  Prototipar el estado de arrastre.
- **Orden estable:** marcar una tarjeta **no** reordena la lista de golpe (bug: al marcar rápido, la fila se movió y
  el siguiente clic marcó otra tarjeta). Las completadas se quedan en su lugar tachadas hasta recargar la pantalla.
- Variante «menú contraído» ya existe en el Figma: conservar.
- Estados: con datos, vacío («No tienes tarjetas para hoy.» con ilustración pequeña y «+ Nueva tarjeta»), cargando,
  sin conexión, con vencidas, con recordatorio.

### 6.2 Tablero Kanban
- **Falta el control de vista expandida** en el Figma (la app lo tiene como texto). Interruptor de íconos (3.6).
- **Falta la vista expandida de las tarjetas.** Qué muestra cada una (HE-09-HU07 y glosario: «la compacta muestra
  título, fecha límite y prioridad; la expandida muestra toda la información»):
  - **Compacta:** barras de color de las etiquetas, una por etiqueta (hasta 3, D-11) · título (2 líneas máx.) · fecha
    corta («27 nov») con color de estado · prioridad (chip).
  - **Expandida:** lo anterior + tipo · nombres de **todas** las etiquetas como chips de su color (máx. 3) ·
    descripción (3 líneas máx. con «…») · bloque horario si tiene («Hoy · 09:00») · ícono de completada en «Hecho».
  - Prototipar las dos con 3–5 tarjetas por columna y una vencida.
- **Colores de todas las etiquetas:** hoy solo se pinta la barra de la **primera** etiqueta. Bug relacionado en la
  app: una tarjeta **sin etiquetas** («hacer aseo a la casa») muestra una barra roja: sin etiquetas, sin barra.
- **Al seleccionar cualquier parte de la tarjeta se abre el Detalle de tarjeta** (hoy solo el título, subrayado, lo
  abre). El «⋮» sigue abriendo su menú (Editar, Mover a, Eliminar) sin abrir el detalle; el arrastre sigue
  funcionando.
- **Agregar:** «+» para agregar tarjeta **solo en el encabezado de «Por hacer»** (D-08); «+ Nueva columna» como
  columna fantasma gris tras la última columna (D-09).
- **Muchas columnas (D-10):** las columnas usan todo el alto disponible con scroll interno por columna; cuando hay
  muchas, se estrechan hasta un ancho mínimo y recién ahí el tablero (no la página) hace scroll horizontal.
- **Orden de las tarjetas (D-16, A-06):** por defecto la más próxima a vencer primero; si el usuario arrastra dentro de
  la columna, se mantiene su orden, que es **el mismo orden** que usan el Planificador diario y los widgets.
- **Marcos que faltan:** Editar columna (mismo formulario con nombre + color del catálogo), menú «⋮» de columna
  (Editar, Eliminar), menú «⋮» de tarjeta con «Mover a» (lista de columnas con la actual marcada, HE-09-HU02),
  arrastrando una tarjeta (estado de arrastre y zona de soltar), arrastrando una columna (HE-09-HU05), tablero vacío,
  columna vacía.
- **«Nueva columna» del Figma está roto:** el campo se sale de la tarjeta y no tiene botones. Rehacer como ventana
  emergente pequeña «Nueva columna» con «Nombre de la columna», «Color» (desplegable del catálogo de colores) y
  «Cancelar» / «Guardar» abajo a la derecha (D-23).

### 6.3 Calendario (mes y semana) y Panel del día
- **Navegación (pedido de Paula), toda arriba:** a la izquierda, el título «Noviembre 2026» **es un botón** que abre
  el selector «Mes y año» (el Figma ya tiene «Elegir mes · 2026/2027»: cuadrícula de 12 meses + año con flechas ‹ ›;
  Paula pide también **poder escribir el año**). Junto al título: flechas ‹ › e ícono «Ir a hoy» (3.6). A la derecha:
  control segmentado **Mes | Semana** (siempre los dos; hoy en Semana desaparece «Semana» y solo quedan «Hoy» y
  «Mes»). Nada de botones abajo («no es usable que sea en la parte inferior»).
- **Semana:** la fuente es tan grande que el texto no cabe en el día. Encabezado «Lun 23», tarjetas como chips de una
  línea con hora («09:00 Revisar bocetos») y «+N más» si no caben; cada día con scroll interno si hace falta.
- **Mes:** celdas compactas; hasta 3 chips por día + «+N más»; color por día según 3.4 (rojo claro + borde rojo + ⚠
  si tiene vencidas; amarillo claro + reloj si tiene pendientes y ninguna vencida; hoy: gris y sin color); el día de
  hoy con borde `accion`.
- **Panel del día:** en el Figma es una **pantalla completa** con «Cerrar» y en la app aparece **debajo** del
  calendario (obliga a hacer scroll). Nuevo: **panel lateral derecho** (360 px) que se abre al lado del calendario sin
  taparlo, con «×» arriba, la fecha, «+ Nueva tarjeta» (ícono + texto) y la lista con tipo, título, prioridad,
  columna y color de estado. En Semana, el mismo panel.
- Menos clics para llegar a un día lejano: selector de mes y año + clic en el día.

### 6.4 Agenda diaria
- **Navegación de días (pedido de Paula: «las personas deben hacer muchos clics para encontrar el día»):** la fecha
  larga es un botón que abre un **mini calendario flotante** para saltar a cualquier día; flechas ‹ › a los lados;
  ícono «Ir a hoy»; y debajo una **tira semanal** con los 7 días de la semana actual («L 23 · M 24 · … · D 29») para
  cambiar de día con un clic (D-26), con el día elegido resaltado con `accion`.
- La fecha, la tira y la navegación quedan **fijas arriba**; solo la cuadrícula de horas hace scroll (hoy, al ir a la
  hora actual, la fecha y los botones desaparecen).
- Bloques de 40 px (hoy 65 px) para ver ~10 horas sin scroll.
- **Quitar la línea debajo del texto de las tareas** (subrayado) — pedido literal de Paula.
- «Tarjetas sin horario» con color de estado (vencida roja, próxima a vencer amarilla) y arrastre visible.
- Prototipar: arrastrando una tarjeta a un bloque, bloque pasado deshabilitado (no se asigna a una hora que ya pasó),
  quitar tarjeta del bloque.

### 6.5 Reportes
Pedido de Paula: «mejorar la sección de reportes, no hay mucha información, faltan otros datos útiles, organizarlo
mejor: toda la información se debe obtener de un solo vistazo; plantear qué hay en ver más reportes».

- **Un solo vistazo a 1366 × 768 sin scroll:** fila de filtros compacta arriba (rango + etiquetas + botón «Ver más
  reportes»); debajo, en una cuadrícula de 3 columnas: (1) gráfica de tarjetas completadas (2 columnas de ancho),
  (2) tasa de cumplimiento grande con «10 de 12 a tiempo», (3) anillo vencidas / pendientes / completadas con los
  colores de estado (3.4) y la leyenda al lado (no debajo).
- **Rango de fechas (D-13):** solo las opciones de HE-13-HU01: «Últimos 7 días», «Últimos 30 días» (por defecto),
  «Últimos 12 meses», «Personalizado». En Personalizado, selector de fechas que solo permite fechas válidas (máximo
  366 días) y la gráfica no cambia hasta pulsar «Aplicar».
- **Filtro de etiquetas:** desplegable múltiple con chips, máximo 3 (3.8, D-14).
- **«Ver más reportes» 🆕 (D-12):** abre la pantalla **«Planificador › Reportes › Más reportes»** (no una ventana
  pequeña), con ← para volver y la misma barra de filtros. Incluye el detalle «Cumplimiento por estado» del Figma
  (Vencidas · Pendientes · Completadas · A tiempo) y estas 6 secciones, todas calculables con datos que ya existen:
  1. Completadas por **etiqueta** (barras horizontales con el color de cada etiqueta).
  2. Completadas por **tipo** (Tarea, Recordatorio, Evento).
  3. Vencidas por **prioridad** (Alta, Media, Baja, Sin prioridad).
  4. Tarjetas por **columna** del Kanban hoy (estado actual del flujo).
  5. **Carga de los próximos 7 días** (pendientes por día, con las próximas a vencer en amarillo).
  6. **Tiempo medio de completado** (días entre la creación y el completado).
  Las 6 secciones caben en una cuadrícula de 3 × 2 sin scroll de página a 1366 × 768.
- Estados: cargando por sección, vacío («Aún no hay datos en este rango», ⚠ texto pendiente si la HU no lo trae),
  error y sin conexión (HE-13).

### 6.6 Etiquetas
- Paula: «¿por qué hay un botón de editar o eliminar? ¿editar qué? ¿no se edita y elimina una etiqueta en
  específico?». En el Figma, «Editar» y «Eliminar» están abajo, sueltos, sin etiqueta seleccionada: **se eliminan**.
  Cada fila lleva su punto de color, el nombre y a la derecha los íconos ✎ y 🗑, como ya hace la app (RD-54). (No se
  muestra la cantidad de tarjetas por etiqueta: `label_list` no la entrega y no hay HU.)
- «+ Nueva etiqueta» arriba a la derecha (ícono + texto) en vez de abajo.
- Nueva etiqueta / Editar etiqueta como ventana emergente pequeña: Nombre + **Color en desplegable con muestras**
  (hoy «Violeta» como texto). Falta el marco **Editar etiqueta**.
- Usar el ancho: lista en 2 columnas si hay muchas etiquetas.
- Estados: con datos, vacío, límite alcanzado, sin conexión.

### 6.7 Detalle y Formulario de tarjeta
- **Detalle de tarjeta:** el Figma muestra solo título, tipo, fecha y prioridad; faltan **descripción, etiquetas
  (chips de color), columna y bloque horario** (la app sí los muestra). «×» arriba; abajo a la derecha «Eliminar»
  (secundaria, texto rojo) y «Editar» (principal). Fondo oscurecido.
- **Formulario de tarjeta** (título «Nueva tarjeta» o «Editar tarjeta»): dos columnas (Título · Tipo; Fecha límite ·
  Prioridad; Etiquetas (máx. 3) · Descripción; **Bloque horario** opcional, D-20, con los controles de 3.8). Debe
  caber sin scroll interno. Falta el marco **modo edición** («Editar tarjeta»). Botones «Cancelar» / «Guardar» abajo
  a la derecha.
- **🆕 Recordatorios reales (D-05)** (pedido de Paula: «las tarjetas que sean recordatorios deben aparecer como un
  recordatorio de verdad ese día a esa hora»): una tarjeta tipo **Recordatorio con bloque horario** genera, a la hora
  en punto del bloque, (a) una **notificación de Windows** con el título de la tarjeta, «Recordatorio · 16:00» y los
  botones «Abrir» (abre el Detalle de tarjeta) y «Marcar como completada»; y (b) la franja dentro de la app del
  Planificador diario (6.1). En el formulario, si el tipo es Recordatorio y no hay bloque horario, mostrar debajo del
  campo la ayuda «Asigna un bloque horario para recibir el recordatorio.» (⚠ texto pendiente de la HU v13).
  Prototipar la notificación de Windows y la ayuda del formulario.

---

## 7. Personalización (una sola pantalla para wallpaper, temas y widgets)

Pedido de Paula: «necesitamos una sola vista para el wallpaper, los temas y los widgets»; «hace falta la pantalla de
inicio de personalización, ¿o accede en temas?»; «¿cómo sé en qué sección de personalización estoy?»; «el ícono de
organizar widgets no aparecería solo cuando está en la sección de organizar widgets?»; «organizar widgets es la
pantalla completa, tal como se implementa actualmente… no añadir más información»; «en los temas las opciones están
muy separadas»; «se desperdicia mucho espacio»; «¿por qué hay una sola pantalla para poner la ciudad del widget del
clima?»; «configurar y eliminar para cada widget en la misma fila ocupa mucho espacio».

**Hoy en la app:** «Personalización del wallpaper» (pantalla completa **sin menú lateral**, bug que Paula reporta),
«Temas» y «Widgets» son tres opciones separadas del menú. **En el Figma 04** hay propuestas que se contradicen: (01)
«Personalización» con pestañas Temas · Fondo · Tipografía · Colores · Distribución · Widgets; (02) «Tu escritorio»
con «Apariencia»; y (06) la vieja «Personalización del wallpaper» con inspector. **Se reemplazan todas por la
estructura de 7.1** (D-21).

### 7.1 Estructura final: una sola pantalla por pasos (D-21)

Paula: «lo de personalización ¿no es mejor como si fueran pasos? primero elegir el tema a editar, después se elige
el fondo, etc.»; «necesito que haya un flujo visual, no encuentro qué va primero y desde dónde se accede a algún
componente»; «yo quiero que desde una sola pantalla se haga toda la configuración de personalización, configuración
de los widgets y definir el tema».

- **Una entrada «Personalización»** en el bloque Personalización del menú lateral, **con el menú visible**. Al
  entrar, abre el paso 1 Tema: esa es la «pantalla de inicio de Personalización».
- **Barra de pasos** arriba (pasos libres: se puede saltar a cualquiera; el actual resaltado con `accion`; los que
  tienen cambios sin guardar con un punto): **1 Tema · 2 Fondo · 3 Colores y tipografía · 4 Widgets**. La miga dice el
  paso actual (2.2).
- **Vista previa del escritorio** siempre visible a la izquierda (grande, con los widgets activos a escala
  proporcional); el **panel del paso** a la derecha (360 px).
- **Barra de acciones fija abajo a la derecha**, igual en todos los pasos: estado a la izquierda («Sin cambios» /
  «Cambios sin guardar» / «Este tema ya está aplicado.») · «Cancelar cambios» · «Guardar» · **«Aplicar»** (principal,
  a la derecha). Confirmaciones M-02, M-03, M-04, M-05 y M-15 como hoy, ahora también para cambios de widgets.
- **Todo pasa por el tema en edición** (D-21): un cambio en cualquier paso, incluidos los widgets, primero se ve en la
  vista previa; «Guardar» lo guarda en el tema; «Aplicar» lo lleva al escritorio. **Nada cambia el escritorio sin
  «Aplicar».** El indicador de sincronización del encabezado refleja cada guardado.

| Paso | Qué se hace (todo con HU salvo 🆕) | Diseño |
|---|---|---|
| **1 Tema** | Elegir el **tema en edición** de la lista «Mis temas» (máx. 10, HE-03); ver cuál está «Aplicado»; **Guardar como tema** (HE-03-HU02); renombrar ✎ y eliminar 🗑 (HE-03-HU04/HU05). | Filas de 36 px, juntas (Paula: «las opciones están muy separadas»): miniatura 48 × 27, nombre (14 px peso 500), fecha de modificación (12 px, secundario) y chip «Aplicado»; el tema en edición resaltado. El nombre es lo más fuerte; ✎ y 🗑 son íconos grises que se ven al pasar el mouse. «Guardar como tema» como acción secundaria arriba de la lista. Con el límite de 10 temas la lista cabe sin scroll; si un día se sube el límite (pregunta de Paula «¿qué pasa si se agregan 200 temas?»), la lista hace scroll interno y se agrega un buscador. |
| **2 Fondo** | **Imagen de fondo**: tres tarjetas del mismo tamaño y estilo, con miniatura: «Catálogo de imágenes» (abre la galería debajo), «Subir imagen» (JPG/JPEG/PNG ≤ 20 MB) y «Sin imagen» (vuelve al fondo por defecto, HE-02-HU04). Debajo, la galería del catálogo de imágenes en cuadrícula. 🆕 «Oscurecer» y «Desenfocar» la imagen (D-28, dos deslizadores). **Sin plantillas** (D-22). | Hoy los botones de imagen de fondo «no tienen ninguna coherencia visual»: se reemplazan por las tres tarjetas iguales; la elegida con borde `accion`. |
| **3 Colores y tipografía** | **Paletas** (cuadrícula, 3 por fila, la elegida marcada, «Personalizada» si se cambió un color) → **Colores del tema** (Principal, Secundario, Texto: muestra + #RRGGBB + selector flotante; aviso de legibilidad amarillo con color sugerido) → **Tipografía** (fuente en desplegable con muestra + tamaño Pequeño/Mediano/Grande, que es el tamaño por defecto de la app y de todos los widgets, D-30) → «Restablecer». | Primero la paleta (un clic resuelve todo), después el ajuste fino. El selector de colores es flotante, no un bloque enorme dentro del panel. |
| **4 Widgets** | Lista de widgets del tema (7.3); **+ Agregar widget** (catálogo + vista previa + configuración en el mismo panel, D-19); **Configurar** cada widget (datos, formato, apariencia y tamaño de texto, 7.3); 🆕 **Forma de los widgets** para todos (D-28); 🆕 **Distribución predefinida** (D-17); botón **«Organizar widgets»** (D-24), que solo aparece en este paso. | Al seleccionar un widget en la lista (o en la vista previa) se resalta en la vista previa y su panel «Configurar widget» se abre en el panel derecho, con ← para volver a la lista. |

### 7.2 Mapa de navegación y flujo visual (pedido de Paula)

Prototipar en el Figma un marco «Mapa de navegación» (FigJam o diagrama) con:
- Inicio de sesión → Planificador diario (pantalla principal, D-06). Registro → Verificar correo → Planificador diario.
- Menú lateral con las opciones de 2.2 · Configuración · Cerrar sesión (M-11/M-12). Windi: botón flotante en todas
  las pantallas con sesión, que abre el panel de Windi (4.3).
- Desde dónde se abre cada ventana emergente: Detalle de tarjeta y Formulario de tarjeta desde Planificador diario,
  Tablero Kanban, Calendario (y Panel del día), Agenda diaria y Más reportes; Formulario de etiqueta desde Etiquetas y
  desde el campo Etiquetas del Formulario de tarjeta; Nueva columna / Editar columna desde el Kanban; Guardar como
  tema y Renombrar desde el paso 1; Organizar widgets desde el paso 4.
- Desde dónde se llega a cada pantalla desde los widgets del escritorio (HE-06-HU08), incluido el widget Windi.
- Las confirmaciones M-01 a M-17 y desde qué acción salta cada una.

### 7.2.1 Jerarquía visual consistente (pedido de Paula: «revisar en todos los prototipos consistencia de jerarquía visual»)
- Aplica en todas las pantallas los niveles de 0.2 (punto 5). Una sola acción principal (`accion`) por pantalla o
  ventana.
- En las listas, el **nombre** del elemento es lo más fuerte; fechas, contadores y acciones van en gris y más
  pequeños. Hoy, en Temas, el tema, la fecha, «Aplicado», «Aplicar» y el motivo pesan lo mismo.

### 7.3 Widgets (paso 4: lista, agregar y configurar)
- **Lista:** una fila de 40 px por widget: ícono del tipo · nombre · dato que lo distingue (ciudad, «Widget por
  defecto») · interruptor Activo · ⚙ Configurar · 🗑 Eliminar (deshabilitado en los widgets por defecto, con el
  motivo en tooltip). Íconos juntos a la derecha (hoy «Configurar» y «Eliminar» quedan muy lejos y ocupan mucho).
- Bug a reflejar: en la app la lista de widgets aparece **vacía** (sin los widgets por defecto ni estado vacío).
  Prototipar la lista con los 4 por defecto (D-27) y el estado de error.
- **Agregar widget:** catálogo en tarjetas con miniatura (base: Figma 04 › 04 «Explorar el catálogo y previsualizar»
  y 04 › 05 «Configurar y agregar»). **Todo en el panel derecho del paso 4:** al elegir un widget, el widget aparece
  en la vista previa del escritorio (D-19) y su configuración (ciudad, texto, imágenes, animación, servicio de música)
  aparece en el panel, con «Agregar» (principal). No hay una pantalla entera para escribir la ciudad (pedido de
  Paula). ← para volver al catálogo. Miga: «Personalización › 4 Widgets › Agregar widget › Clima».
- **Configurar widget** (⚙): panel con las secciones que apliquen a cada tipo:
  - **Datos** (HE-04-HU12): ciudad del Clima (autocompletado en tiempo real, 3.8) y texto del widget Texto.
  - 🆕 **Formato** (D-15): Reloj 12 h / 24 h; Calendario: la semana empieza el lunes / el domingo.
  - 🆕 **Apariencia** (D-18): Paleta del tema (por defecto) / Otra paleta (desplegable de paletas) / Colores libres
    (principal, secundario, texto con el mismo selector del paso 3) + deslizador de transparencia del fondo, con el
    aviso de legibilidad si el contraste no alcanza.
  - 🆕 **Tamaño de texto** (D-30): Igual que el tema (por defecto) / Pequeño / Mediano / Grande.
  Todos los widgets tienen Apariencia y Tamaño de texto; por eso ⚙ está en todas las filas.
- **Orden de Tareas del día:** no es un ajuste; lo define el usuario arrastrando (D-16).
- **Marcos que faltan:** Agregar Noticias, Imagen estática (subir / catálogo de imágenes), Carrusel de imágenes (2 a
  10 imágenes, «N de 10», intervalo de 3 a 60 s), Animación (catálogo), Texto (200 caracteres), Reproductor de música
  (conectar Spotify / YouTube Music, cambiar de servicio, desconectar = eliminar), Windi 🆕; Configurar widget de cada
  tipo; errores (ciudad no encontrada, ciudad duplicada, sin conexión con «Agregar» deshabilitado).

### 7.4 Organizar widgets (D-24)
- **Pantalla completa, igual que la implementación actual** (C-03: ocupa todo el escritorio, oculta la ventana
  principal y el menú), para ver la dimensión real de los widgets. **No añadir más información** (pedido de Paula):
  solo una barra mínima arriba con el título «Organizar widgets», «Cancelar» y «Listo» (A-01), el indicador de
  colisión en rojo y, si hay que avisar algo, un toast.
- Trabaja sobre el **tema en edición** (D-21): «Listo» vuelve a Personalización › 4 Widgets con la distribución en la
  vista previa (todavía sin guardar ni aplicar); «Cancelar» vuelve sin cambios.
- **Quitar de esta pantalla** el panel «Distribución · Elige una posición…» y el bloque de Windi del Figma 04 › 01. La
  **Distribución predefinida** 🆕 (D-17) se elige en el paso 4 y se aplica a la vista previa; luego se ajusta a mano
  en «Organizar widgets».
- Prototipar: arrastrando, redimensionando (mínimo 100 × 100), colisión (borde rojo), sin conexión.

### 7.5 Qué se hace con cada marco del Figma 04
| Marco | Qué se hace |
|---|---|
| 04 › 01 «Personalización» con pestañas | Se rehace como la pantalla por pasos de 7.1. «Crear un tema desde este» y «Recuperar mi tema guardado» **se eliminan** (D-31). El panel de distribución y Windi salen de Organizar widgets (7.4). |
| 04 › 02 «Tu escritorio» | La pantalla **se descarta**; su «Apariencia de los widgets · Usar el mismo tema en todos» pasa a ser la sección **Apariencia** de «Configurar widget» (D-18, 7.3). |
| 04 › 03 «Ajustar un widget del escritorio» | «Personalizar reloj · Formato de hora 24/12» y «Personalizar calendario · Inicio de la semana» pasan a la sección **Formato** de «Configurar widget» (D-15). «Personalizar tareas del día · Orden» **se elimina** (D-16: el orden se define arrastrando). «Personalizar clima · Ciudad» pasa a la sección **Datos**. «Cerrar» → «×». |
| 04 › 04 «Explorar el catálogo y previsualizar» y 04 › 05 «Configurar y agregar» | Base de «Agregar widget» (7.3). |
| 04 › 06 «Editar el fondo y la distribución» | Las plantillas (Cuaderno, Mosaico, Paisaje) **se eliminan** (D-22); se reutilizan la imagen propia y el catálogo de imágenes para el paso 2 Fondo, con menú lateral. |

---

## 8. Configuración (05)
- Coincide con la app (RD-41). Reducir tamaños; agregar los estados del indicador de sincronización con la cantidad
  de cambios pendientes y el error. El marco «Indicador de sincronización» suelto se reemplaza por el componente del
  encabezado (4.2).
- 🆕 **Densidad** (D-29): interruptor «Compacta / Cómoda» con una línea de ayuda «Cambia el espacio entre filas, no el
  tamaño de letra.».
- «Cerrar sesión» se mantiene aquí y también al pie del menú lateral (4.1).

## 9. Escritorio de Windows, área de notificación, web e instalador (06, 07) y confirmaciones (08)
- **06 Escritorio** son bocetos (cuadrícula de nombres). Faltan prototipos reales de **cada widget en el escritorio**
  con colores y tipografía del tema, la forma de los widgets (D-28) y un ejemplo con apariencia propia (D-18): Reloj
  (12 h y 24 h), Calendario (semana desde lunes y desde domingo), Tareas del día (con casillas, vencidas en rojo,
  «Mover a», reordenar arrastrando, D-16), Kanban (hasta 5 tarjetas por columna, arrastre), Clima (con aviso sin
  conexión), Noticias, Imagen estática, Carrusel de imágenes, Animación (pausada por CPU), Texto, Reproductor de
  música y 🆕 Windi (4.3); y el estado «widget seleccionado» de los interactivos. Incluir un escritorio con la imagen
  de fondo oscurecida y desenfocada (D-28).
- **Área de notificación:** menú «Abrir» / «Salir» con estilo de Windows (no hace falta más).
- **Notificación de Windows** del recordatorio (6.7).
- **07 Web e instalación:** no se revisó a fondo en esta pasada; mantener.
- **08 Confirmaciones M-01 a M-17:** existen. Corregir que en los marcos claros los nombres de marco se superponen al
  contenido; aplicar «×», fondo oscurecido, tokens del tema y botones abajo a la derecha (D-23); botón destructivo en
  rojo («Eliminar»). Revisar que sus textos usen los nombres de la sección 2 (por ejemplo, ningún «Editar
  escritorio»).

---

## 10. Contenido del Figma sin HU: qué se hace con cada cosa (según 0.1)

| Dónde | Qué | Decisión | Qué hacer en el Figma |
|---|---|---|---|
| 04 › 01 Organizar widgets | «Distribución: Original / Reloj a la derecha / Kanban centrado» | 🆕 Aprobada como **Distribución predefinida** (D-17) | Mover al paso 4 Widgets (7.1); quitar de Organizar widgets. |
| 04 › 01 Organizar widgets | Bloque de Windi | Se elimina de esa pantalla (D-24; Paula: «no añadir más información») | Borrar. |
| 04 › 02 Tu escritorio | «Usar el mismo tema en todos» / apariencia de widgets | 🆕 Aprobada como **Apariencia del widget** (D-18) | Sección Apariencia de «Configurar widget» (7.3); la pantalla se descarta. |
| 04 › 03 | Formato de hora del Reloj, inicio de semana del Calendario | 🆕 Aprobados (D-15) | Sección Formato de «Configurar widget» (7.3). |
| 04 › 03 | Orden de Tareas del día como ajuste | Se elimina (D-16) | Borrar; el orden se define arrastrando. |
| 04 › 04/05 | Vista previa del widget sobre el escritorio antes de agregar | 🆕 Aprobada (D-19) | Integrar en «Agregar widget» (7.3). |
| 04 › 06 | Plantillas Cuaderno, Mosaico, Paisaje | Se eliminan (D-22) | Borrar. |
| 04 | «Volver al editor», «Mis temas», «+ Nuevo tema» | «Mis temas» se mantiene como título de la lista del paso 1; «+ Nuevo tema» → «Guardar como tema» (HE-03-HU02); «Volver al editor» no existe | Renombrar / borrar. |
| 04 | «Crear un tema desde este», «Recuperar mi tema guardado» | Se eliminan (D-31); la acción real es «Cancelar cambios» (HE-02-HU13) | Borrar. |
| 02 Reportes · Seleccionar rango | «Esta semana / Este mes / Mes anterior» | Se elimina (D-13) | Reemplazar por las opciones de HE-13-HU01 (6.5). |
| 02 Reportes · Seleccionar etiquetas | «Combinaciones de muestra» | Se elimina; el filtro es selección múltiple con máximo 3 (D-14) | Rehacer (3.8). |
| 02 Etiquetas | «Editar» y «Eliminar» globales abajo | Se eliminan; las acciones son por etiqueta (RT-02-ET10) | Borrar (6.6). |

Si al revisar el Figma encuentras otra cosa sin HU que no está en esta tabla, muévela a «Propuestas nuevas
(pendientes de HU)» y anótala en «Puntos abiertos» (regla 3).

---

## 11. Inventario de pantallas: qué existe, qué falta y qué hacer

Leyenda: ✅ existe y sirve · ✏ existe pero hay que cambiarla · ❌ falta · 🆕 nueva aprobada (HU en la v13).

| Área | Pantalla / estado | App | Figma | Acción | Sección |
|---|---|---|---|---|---|
| Acceso | Inicio de sesión, Registro, Verificar correo, Recuperar contraseña (Correo, Código, Nueva contraseña), Sin conexión | ✅ | ✅ | ✏ sombra de la nota, ←, ojo, tamaño | 5 |
| Marco | Menú lateral (ampliado y contraído), encabezado con miga | ✅ | ✅ | ✏ dos bloques, sin «Agente de IA», cerrar sesión, sin Claro/Oscuro, tamaños | 4.1, 4.2 |
| Marco | Mensajes emergentes (4 tipos), aviso, opción deshabilitada | ✅ (inconsistentes) | ❌ | ❌ crear marcos | 3.5 |
| Marco | Indicador de sincronización (4 estados + pendientes) | ✅ | ✏ (solo 3) | ✏ | 4.2 |
| Marco | Windi: botón flotante y panel de chat (todos sus estados) | ✏ (pantalla «Agente de IA») | ✏ (solo propuesta) | 🆕 rehacer como panel | 4.3 |
| Planificador | Planificador diario ampliado (pantalla principal): con datos, vacío, cargando, sin conexión, vencida, recordatorio, arrastre, densidad Cómoda | ✅ (sin ampliar) | ✏ | ✏ composición en dos columnas, densidad, colores | 6.1 |
| Kanban | Tablero, vista compacta | ✅ | ✏ | ✏ | 6.2 |
| Kanban | Vista expandida | ✅ | ❌ | ❌ | 6.2 |
| Kanban | Menú ⋮ de tarjeta, Mover a | ✅ | ❌ | ❌ | 6.2 |
| Kanban | Nueva columna | ✅ | ✏ roto | ✏ | 6.2 |
| Kanban | Editar columna, menú ⋮ de columna, arrastre de tarjeta/columna, tablero vacío, columna vacía, muchas columnas | ✅ | ❌ | ❌ | 6.2 |
| Tarjeta | Detalle de tarjeta | ✅ | ✏ incompleto | ✏ | 6.7 |
| Tarjeta | Formulario de tarjeta: Nueva tarjeta / Editar tarjeta, con bloque horario | ✅ (sin bloque horario) | ✏ (sin edición) | ✏ + ❌ edición | 6.7 |
| Tarjeta | Notificación de Windows del recordatorio | ❌ | ✏ (solo franja) | 🆕 | 6.7 |
| Calendario | Mes, Semana | ✅ | ✏ | ✏ navegación y color | 6.3 |
| Calendario | Mes y año | ❌ | ✅ | ✏ escribir el año | 6.3 |
| Calendario | Panel del día | ✅ (debajo) | ✏ (pantalla) | ✏ panel lateral | 6.3 |
| Agenda | Agenda diaria con tira semanal, asignar/quitar bloque, bloque pasado | ✅ | ✏ | ✏ + ❌ estados de arrastre | 6.4 |
| Reportes | Reportes, rango, etiquetas | ✅ | ✏ | ✏ | 6.5 |
| Reportes | Más reportes (cumplimiento por estado + 6 secciones) | ❌ | ✏ (solo detalle) | 🆕 | 6.5 |
| Etiquetas | Lista, Nueva etiqueta | ✅ | ✏ | ✏ | 6.6 |
| Etiquetas | Editar etiqueta, vacío | ✅ | ❌ | ❌ | 6.6 |
| Personalización | Pantalla por pasos con vista previa y barra de acciones | ❌ (3 pantallas) | ✏ (3 propuestas) | ✏ rehacer según 7.1 | 7.1 |
| Personalización | Paso 1 Tema: Mis temas, Guardar como tema, Renombrar, Eliminar, Aplicar (M-05/M-15) | ✅ | ✏ | ✏ | 7.1 |
| Personalización | Paso 2 Fondo: Catálogo de imágenes, Subir imagen, Sin imagen, oscurecer/desenfocar | ✅ (con plantillas) | ✏ (04 › 06) | ✏ sin plantillas + 🆕 deslizadores | 7.1 |
| Personalización | Paso 3 Colores y tipografía: paletas, colores del tema (selector, hex, legibilidad), tipografía, Restablecer | ✅ | ✏ (solo resumen) | ✏ + ❌ estados | 7.1 |
| Personalización | Cambios sin guardar M-02/M-03/M-04 | ✅ | ✅ (08) | ✏ estilo | 7.1 |
| Personalización | Paso 4 Widgets: lista con interruptor, Configurar, Eliminar, forma de los widgets, distribución predefinida | ✅ (sin 🆕) | ✏ | ✏ densidad + 🆕 | 7.1, 7.3 |
| Personalización | Agregar widget (catálogo + vista previa + configuración en el panel) | ✏ (pantallas sueltas) | ✏ | ✏ | 7.3 |
| Personalización | Agregar Noticias, Imagen estática, Carrusel de imágenes, Animación, Texto, Reproductor de música, Windi | ✅ (salvo Windi) | ❌ / parcial | ❌ | 7.3 |
| Personalización | Configurar widget (Datos, Formato, Apariencia, Tamaño de texto) | ✏ (solo Datos) | ✏ (04 › 03) | ✏ + 🆕 | 7.3 |
| Personalización | Organizar widgets | ✅ | ✏ (con extras) | ✏ quitar extras, «Listo» | 7.4 |
| Escritorio | Cada widget en el escritorio, con forma, apariencia y fondo oscurecido | ✅ (sin 🆕) | ❌ (bocetos) | ❌ | 9 |
| Configuración | Configuración con densidad | ✅ (sin densidad) | ✅ | ✏ tamaños + 🆕 densidad | 8 |
| Confirmaciones | M-01 a M-17 | ✅ | ✅ | ✏ estilo | 9 |
| Revisión | Mapa de navegación, Checklist de revisión, Puntos abiertos | — | ❌ | ❌ crear | 0.2, 0.3, 7.2 |

---

## 12. Lista completa de las sugerencias de Paula (24-nov-2026) y dónde quedó cada una

Ninguna se eliminó. Las repetidas en el mensaje original se listan una vez y se marcan «(repetida)». Cuando una
decisión de 0.1 cambió lo que pedía la sugerencia, se indica en la columna «Sección».

| # | Sugerencia (resumen fiel) | Sección |
|---|---|---|
| P01 | En «Verificar tu correo», «Recupera tu contraseña», «Verifica el código», «Nueva contraseña», la sombra no sigue la nota en la esquina superior derecha | 5 |
| P02 | En lugar de botones como «Regresar», usar el ícono de flecha | 3.6, 5 |
| P03 | Mensajes emergentes vivos, con animación fluida, por segundos limitados; no interfieren; encima de todas las vistas; no cambian el comportamiento | 3.5 |
| P04 | Al ingresar ya no hay tema claro u oscuro (sin ícono); se mantiene el tema con el que se ingresó y pasa a ser el tema de la app, que puede ser de diversos colores | D-01, 2.1, 4.2, 5 |
| P05 | Los colores del tema se aplican en toda la app; los colores de la app se limitan a los del tema; revisar si ampliar los colores seleccionables | D-01, D-02, 3.3 |
| P06 | Las opciones de selección deben ser listas desplegables o algo más fácil | 3.8 |
| P07 | Letra y app muy grandes; disminuir el tamaño general y organizar mejor la información en cada tarjeta o pantalla | 3.1 |
| P08 | Barra lateral en dos secciones (planificación y personalización), bloques visualmente diferentes | 4.1, 2.2 (el bloque se llama «Planificador») |
| P09 | Ícono de cerrar sesión en la barra lateral | 4.1 |
| P10 | Analizar en cada botón si sobra el texto: «+» gris para añadir columna, «+» al final de cada columna para añadir tarjeta | 3.6, 6.2; D-09 (columna fantasma); D-08 cambia la segunda parte: «+» solo en «Por hacer» |
| P11 | En todas las vistas, vencidas con elemento visual rojo; vencido siempre rojo y próximo a vencer / símbolo de tiempo amarillo | D-03, 3.4 |
| P12 | Definir los colores de los mensajes emergentes y cuándo usar cada uno | 3.5 |
| P13 | Letra y espacios muy grandes: en el planificador diario solo se leen 3 tarjetas; evitar tanto scroll (repetida de P07) | 3.1, 6.1 |
| P14 | Kanban: falta el ícono/botón de vista expandida y la vista de tarjetas expandidas; definir qué información muestra | 6.2 |
| P15 | Calendario de la semana: la fuente es tan grande que no alcanza en el día | 6.3 |
| P16 | El botón «Hoy» no es entendible; otra forma de indicar «ir al día actual»; el cambio de mes y semana no es claro y no es usable abajo | 3.6, 6.3 |
| P17 | En el panel del día se repite el botón «Cerrar» en lugar del ícono «×» | 3.7, 6.3 |
| P18 | Agenda diaria y calendario mes/semana: mejorar día anterior/hoy/día siguiente; demasiados clics para encontrar un día | 6.3, 6.4, D-26 |
| P19 | Mejorar Reportes: más datos útiles, mejor organización, todo de un vistazo; plantear qué hay en «Ver más reportes» | 6.5, D-12 |
| P20 | Etiquetas: ¿por qué hay «Editar» o «Eliminar» sueltos? ¿Editar qué? | 6.6, 10 |
| P21 | Revisión exhaustiva del frontend y funcionalidades frente al Figma; hay funcionalidades sin prototipo; la mayoría de vistas debe tener prototipo; los colores dependen del tema | 11, 0 (regla 4), 3.3 |
| P22 | El agente de IA: ícono y texto muy grandes, ocupa mucho espacio | 4.3 |
| P23 | Falta la pantalla de inicio de la app: ¿qué ve el usuario? ¿información del día? | D-06, 6.1 |
| P24 | Falta la pantalla de inicio de Personalización, ¿o accede en Temas? | 7.1 (abre en el paso 1 Tema) |
| P25 | El ícono de organizar widgets, ¿no aparecería solo en la sección de organizar widgets? | D-24, 7.1 (solo en el paso 4) |
| P26 | ¿Cómo sé en qué sección de Personalización estoy? | 4.2, 7.1 (barra de pasos y miga) |
| P27 | Organizar widgets es pantalla completa, como hoy; no añadir más información | 7.4 |
| P28 | En temas las opciones están muy separadas | 7.1 (paso 1 Tema) |
| P29 | Se desperdicia espacio en todas las pantallas; ¿por qué una pantalla sola para la ciudad del clima?; usabilidad: menos clics; usar toda la pantalla; «configurar» y «eliminar» por widget ocupan mucho; pantallas sin sentido; sin inventar funcionalidades; tener en cuenta la v12; las HU pueden estar desactualizadas pero no se inventa | 0 (reglas 2 y 3), 3.1, 7.3, 10 |
| P30 | Revisar el glosario y tener clara la diferencia entre tema y colores; hay confusión de conceptos en todas las pantallas | 2 |
| P31 | Ajustar la aplicación a la escala | 3.1 |
| P32 | Problema de sincronización: cambiar rápido un estado hace que vuelva al anterior | Backend §3.1; 6.1 (orden estable) |
| P33 | «Además cuando haces un cambio en la pantalla de…» (frase incompleta en el mensaje original) | Descartada: Paula no la recuerda (D-32) |
| P34 | El selector del clima: la lista de nombres que coinciden debe ser en tiempo real mientras se escribe | 3.8, 7.3 |
| P35 | Los colores del tema son para la app y los widgets; la app tiene temas (claro/oscuro solo en inicio de sesión, pero se puede personalizar el tema al ingresar) | D-01, 2.1, 3.3 |
| P36 | Hacer un widget del agente de IA, sin la imagen de Windi, solo los ojos o algo no invasivo, con los colores del tema | D-07, 4.3, 9 |
| P37 | Kanban: seleccionar cualquier parte de la tarjeta abre la descripción (detalle) | 6.2 |
| P38 | Eliminar la palabra «Cerrar»; usar el ícono, usualmente en la esquina superior | 3.6, 3.7 |
| P39 | Al abrir una descripción, formulario o cualquier ventana, oscurecer el fondo y resaltar la ventana | 3.7 |
| P40 | Las tarjetas recordatorio deben generar un recordatorio real ese día a esa hora | D-05, D-20, 6.7 |
| P41 | Todo hace scroll; ninguna pantalla se ajusta | 3.1, 0.2 (punto 7) |
| P42 | Colores de etiqueta: solo se aplica el de la primera; deben verse los de todas | D-11, 6.2 |
| P43 | Una sola vista para wallpaper, temas y widgets | D-21, 7 |
| P44 | Al crear una cuenta: widgets por defecto (reloj, calendario, tareas del día, kanban) y tema Windgets (claro u oscuro) | 5, D-27 |
| P45 | «No pudimos mostrar tu fondo de pantalla» aparece y nunca se va (repetida) | 3.5 |
| P46 | Al elegir claro/oscuro sale «no se pudo… vaya a Personalización», pero no hay sección con ese nombre (repetida) | 2, 4.2 |
| P47 | Lista desplegable al seleccionar etiquetas en vez de lo actual (repetida) | 3.8 |
| P48 | Límite de 3 etiquetas (repetida) | D-14, 3.8 |
| P49 | En Mes se puede elegir mes, pero en Semana solo aparecen «Hoy» y «Mes» (repetida) | 6.3 |
| P50 | En el calendario, selector para elegir mes (desplegable) en vez de anterior/siguiente, y poder poner el año (repetida) | 6.3 |
| P51 | Todo lo de alerta o vencido en amarillo en vez de gris; lo gravísimo en rojo | 3.4 |
| P52 | Quitar la línea debajo del texto de las tareas en la agenda diaria | 6.4 |
| P53 | En Reportes, el campo de fecha solo debe aceptar fechas válidas | 3.8, 6.5 |
| P54 | Ojo para ver la contraseña en el login | 3.9, 5 |
| P55 | Todo un poco más pequeño para no hacer tanto scroll | 3.1 |
| P56 | Opción de «Ver más reportes» | D-12, 6.5 |
| P57 | El ícono de ocultar menú al lado del logo y un poco más grande, el botón que amplía | 4.1, D-25 |
| P58 | Evitar / bloquear que la página se pueda minimizar | D-04 (no se cambia el tamaño arrastrando; solo minimizar y maximizar; abre maximizada; zoom bloqueado), 0 (regla 8), 3.1 |
| P59 | En la sección Wallpaper se abre una sección nueva sin menú lateral | 7.1 (Personalización con el menú visible) |
| P60 | Este debe ser el rediseño final | Todo el documento; «Cómo ejecutar este documento» |
| P61 | En los temas las opciones están muy separadas: ¿qué pasa si se agregan 200 temas? | 7.1 (paso 1 Tema) |
| P62 | Revisar en todos los prototipos la consistencia de jerarquía visual (en temas todo pesa lo mismo) | 0.2 (punto 5), 7.2.1 |
| P63 | ¿Qué es «Crear un tema desde este»? ¿Cómo se va a recuperar el tema guardado? ¿Por qué inventar funcionalidades? | D-31, 7.5, 10 |
| P64 | Personalización como pasos: primero elegir el tema a editar, después el fondo, etc. | D-21, 7.1 |
| P65 | Organizar widgets tiene que ver con editar los widgets, no con la personalización | D-24, 7.1 (paso 4), 7.4 |
| P66 | Necesito un flujo visual: no encuentro qué va primero ni desde dónde se accede a cada componente | 7.1 (barra de pasos), 7.2 |
| P67 | Revisión del flujo, de la coherencia de nombres y de acciones; no pueden aparecer nombres de secciones o pantallas que no existen o con otro nombre; seguir siempre la miga de pan | 0.2 (puntos 1–4), 2 |
| P68 | Consistencia visual y sobre todo jerarquía visual: hoy no se diferencian botones, acciones, listas | 0.2 (puntos 5 y 6) |
| P69 | Scroll, tipografía y tamaño de la app con proporciones que eviten el scroll | 0.2 (punto 7), 3.1 |
| P70 | En la sección de imagen de fondo los botones no tienen coherencia visual, no se entiende nada | D-22, 7.1 (paso 2) |
| P71 | ¿La plantilla no sería el catálogo de imágenes de fondo? ¿De dónde salen Cuaderno o Mosaico? ¿Es útil? | D-22, 2.1, 10 |
| P72 | Verificar que el tamaño del tema no choque con el de los widgets; ¿en qué influye el tamaño de letra del tema? | D-30, 3.1, 7.3 |
| P73 | ¿Qué otra personalización fácil puede añadirse? | D-28 (7.1 paso 2, 7.3), D-29 (3.1, 8) |

---

## 13. Bugs vistos en la prueba manual que afectan al diseño (los de lógica están en el documento de backend)

1. Inicio de sesión necesita scroll a 1366 × 768; el logo y el selector quedan ocultos arriba (5).
2. La sombra de la nota no sigue la esquina doblada (Recuperar contraseña y pasos) (5).
3. Menú lateral con scroll vertical y horizontal; «Configuración» cortada (4.1).
4. Formulario de tarjeta: calendario siempre abierto; scroll interno; flechas y día actual azules (del navegador, no
   del tema); prioridad vacía sin indicación; se pueden elegir días pasados y luego da error; etiquetas como campo de
   texto + casillas nativas; ventana sin «×» y sin fondo oscurecido; menú desplegable nativo negro sobre tema claro
   (3.7, 3.8, 6.7).
5. Planificador diario: al marcar rápido, la lista se reordena y el clic siguiente cae en otra tarjeta; doble clic
   selecciona texto («Sin hora» queda resaltado) (6.1).
6. Kanban: solo el título (subrayado) abre el detalle; la barra de color solo de la primera etiqueta; barra roja en
   una tarjeta sin etiquetas; «Vencida» gris; etiquetas como lista con viñetas «◦ oli» en la vista expandida; el
   botón dice la vista contraria a la actual (6.2).
7. Calendario: vencidas sin rojo y pendientes sin amarillo; en Semana desaparece «Semana»; textos cortados; el ícono
   de reloj se monta sobre la fecha; Panel del día aparece debajo y con «Cerrar» (6.3).
8. Agenda diaria: al abrir salta a la hora actual y esconde la fecha y los botones; títulos subrayados (6.4).
9. Reportes: hace scroll; filtro de etiquetas con botones nativos diminutos; fecha personalizada acepta texto libre;
   anillo con cian de marca y oliva; al pasar a «Personalizado» la gráfica cambia antes de aplicar (6.5).
10. Personalización del wallpaper sin menú lateral; selector de colores enorme dentro del inspector (7.1).
11. Widgets: la lista aparece vacía (sin los widgets por defecto y sin estado vacío) (7.3).
12. Selector Claro/Oscuro con sesión: el modo cambió solo de Oscuro a Claro mientras se usaba la app; tras cambiar
    varias veces seguidas, el indicador quedó en «Sincronizando…» más de 10 s (4.2; desaparece con D-01).
13. Mensajes de resultado con un botón «×» grande con borde; el aviso del wallpaper no se va (3.5).
