# Estado: aplicar cambios en los prototipos de Figma

Última actualización: 25-nov-2026 (hora Colombia, noche). Entrega: jueves 26-nov-2026. Archivo solo local: no se sube ni se hace commit.

## 1. Dónde vamos

- Copia de Figma: `A3Z03L20swFyo8qdP9jETF` (sesión usada: `c8ad9016-6807-4e11-8835-1a4a72d1f8d4`; si no sirve, crear otra con `create_session`).
- Git: rama `paso-44-componentes-base`, punta `77aef72`. Sin commits ni cambios en código hechos en esta tarea (los archivos modificados de `apps/desktop/src` venían de antes). Sin rastrear: `docs/rediseno_*.md` y `traspaso-p24/`.
- Decisiones de Paula del lote 9: presentación B de los widgets (títulos del mismo tamaño y posición; Reloj titulado con la ciudad y Calendario con el mes; letra 11; mismos márgenes; Tareas y Kanban separados; Kanban con una tarjeta por columna y «+N más»); Clima como el Reloj; Noticias en una línea; Imagen, Carrusel, Animación y Texto sin título; Reproductor con la pista como título; «Organizar widgets» con barra flotante movible y sin barra de tareas; la página Escritorio se queda para el comportamiento; al agrandar, según el widget.
- Lotes 0 a 12 hechos (el 12 se cerró el 25-nov, noche; ver plan §6). **Sigue:** 1) lote 13 parcial (preguntas a–f respondidas el 25-nov; ver plan §6: falta la revisión de Rosa/Enfoque y la §15 de pendientes); 2) lote 14 hecho el 25-nov (noche): flujos en `docs/rediseno_flujos_prototipos.md` y ids en `docs/rediseno_flujos_ids_prototipos.md`; el reordenado físico está hecho (solo Acceso 79:2 cambió de coordenadas; las demás páginas ya estaban en orden por flujo). Las §2, §2b y §2c de abajo quedan como historial. Orden y detalle: `docs/rediseno_plan_prototipos.md` §4 (lotes) y §6 (registro).
- Velos (25-nov, noche): corregidos y comprobados con captura; variable `velo` en la colección de temas. No usar `tinta` para oscurecer.
- Color de claro ya aplicado, elegido por Paula («3 con detalles crema»): Principal #00D9E2 con texto oscuro, barra lavanda #F5F0FF, selección, enlaces e interruptores violeta (variable `seleccion` 2126:1141), superficie_alta crema #FFFBEA.

## 2. Falta del lote 2

1. HECHO. Barra expandida: en `2068:2103` el menú usa Nunito Medium 13 y el componente `204:32252` usa Rubik Medium 13. Corregir y revisar las demás barras expandidas.
2. HECHO en 79:5 (falta captura y revisar otros temas). Barra contraída: el nombre emergente `2069:1115` («Expandir menú», 4,49, 109×36) tapa el título (76,49). Marcos `2068:3367` (claro) y `2068:6590` (oscuro); revisar los otros temas.
3. `rediseno_pendientes_prototipos.md` §13: botón de eliminar que parece secundario en Rosa y Enfoque; desplegable de etiquetas de la tarjeta (buscador, casillas, fichas); nombres emergentes que se montan; anotar con su marco los textos que no están en los documentos (preguntarlos en el lote 13).
4. HECHO (25-nov): componentes en píldora; instancias de 79:3, 79:5 y 79:6 movidas al lugar de «Sincronizado» (x=749,y=4, «Sincronizado» oculto); 79:2 y 79:4 sin «Sincronizado», mismo lugar. Verificado en captura de Personalización. Falta: marco de ejemplo por página sin mensaje, rehacer «Mensajes recientes» (lote 11), revisar 220:22406. §11, píldora de mensajes: todos en el lugar de «Sincronizado», una línea, borde fino, ícono de color, «×», uno a la vez, un marco de ejemplo por página; actualizar componentes `217:17624`, `217:17638`, `217:17652`, `217:17666` y «Mensajes recientes» `220:22383` (revisar si `220:22406` se monta, y≈4250).
5. Verificar G-02, G-03, G-05 y G-06 (`rediseno_cambios_prototipos.md` 276-421); contraste del nombre emergente en claro (el marco ahora es lavanda).
6. Una sola tanda de capturas (máx. 1024 px): paneles tras mover «Regresar» (incluido `84:30` en Acceso), ✓, marcos de error `2129:50160…50628`, marcos compuestos `2129:50723…51332`, notas de Acceso, íconos del menú, desplegables.
7. Cambiar la línea del lote 2 a «Hecho» en el plan §6.
8. Opcional: Escape en los selectores superpuestos de Personalización.

## 2b. Avance del lote 3 (25-nov, tarde)

- HECHO en 79:3: color en círculos con nombre (16 formularios de etiqueta y columna), fichas con fondo suave y borde, lista desplegable de etiquetas (16 marcos, x=29000), botón de eliminar distinguible en Rosa y Enfoque (variable `error`).
- HECHO en 79:3: 24 marcos de aviso con la píldora (x=32000+tema·1200, y=fila·625; nombre «<pantalla> · Aviso · <tema del aviso> · <tema>»): máximo de 20 etiquetas, «Esta etiqueta ya no existe.», máximo de 10 columnas, «Esta columna ya no existe.», «Esta tarjeta ya no existe.», «Tarjeta actualizada. Se quitó de su bloque horario…». Claro, Rosa, Enfoque y oscuro. Técnica: clonar el marco base, ocultar «Sincronizado», clonar la instancia `2075:927`, `swapComponent` al tipo, texto, ancho = 35 + texto + 38, alineada a x=1069, y=4. Verificado en captura (claro y Rosa).
- FALTA del lote 3: errores de campo (§14.1 y §14.2), «Este color ya no está disponible. Elige otro.», «Etiquetas · Vacío» (`217:17387`), confirmación de eliminar etiqueta usada en 1 tarjeta, selector de Fecha límite, «Fecha del bloque» y «Hora del bloque», textos de ejemplo «DD/MM/AAAA», error al guardar, detalle sin datos, más etiquetas de ejemplo en `204:1078`, desplegable en Editar tarjeta, PR-18.
- Lotes 4 a 12: sin empezar. Lote 2: sigue parcial (ver §2).

## 2c. Avance del lote 8 (25-nov, noche)

- HECHO en 79:5, en los 4 temas: §3 (116 «Agregar»/«Listo» pasados a Secundario donde el principal es «Aplicar»); paneles «3 Colores y tipografía» con «›», «✓ <paleta>» y dos botones de restablecer; «Hasta 20 MB» → «Máximo 20 MB» (4 marcos de Subir imagen); Tipografía (`203:10640`, `204:18246`, `204:18323`, `233:23010`) con las 6 fuentes en su letra, «✓ Rubik», separador y tamaños «Pequeño / ✓ Mediano / Grande»; Restablecer (`203:10942`, `204:18850`, `204:18921`, `233:23245`) con «Restablecer colores» y «Restablecer tipografía»; Selector de color (`203:10565`, `204:18096`, `204:18171`, `233:22952`) con «Principal» marcado y «Campo · Color hexadecimal» en y=188 del panel.
- HECHO solo en claro, en x=40000 (filas cada 626): Paso 1 en y=0…6886 (`2177:32079`, `2177:32246`, `2177:32413`, `2177:32591`, `2177:32768`, `2177:32943`, `2178:32554`, `2178:32678`, `2178:32802`, `2178:32988`, `2178:33174`, `2178:33360`); Paso 2 en y=7512…13772 (`2180:33062` ajuste por monitor, `2180:33209` varios monitores con «Extender», `2180:33358` más de 6 monitores, `2180:33569` monitor desconectado, `2180:33780` imagen del tema no encontrada, `2180:34602` imagen propia con «Quitar imagen», `2180:34732`/`34852`/`34972` errores de imagen, `2180:35092` catálogo vacío, `2180:36230` fondo por defecto); Paso 3 en y=14398…16276 (`2182:33981` color no válido, `2182:34106` contraste bajo, `2182:34290` paleta personalizada, `2182:34430` paleta no disponible). Siguiente fila libre: y=16902.
- Verificado en captura: Paso 1 (A1, A3, A5, A6, aviso de personalización reciente, nombre muy largo), `2180:33358`, `2180:34602`, Tipografía y Restablecer. Sin revisar: `2182:33981` y `2182:34290` (capturas bajadas a `d1.png` y `d3.png` del scratchpad, sin leer).
- CERRADO (25-nov, noche): capturas revisadas; 81 copias en Rosa (x=41148), Enfoque (42296) y oscuro (43444) con modo, menú, nombres de tema, colores del selector, ficha de paleta, fila «Aplicado», conexiones y «Tema en edición» alineado a la derecha.
- Para el lote 13 (textos que no están en los documentos): «Tema de colores para estudiar en las noches de parcial», «Rosa pastel» como nombre repetido, «2,1:1» y «#17131D» en el aviso de contraste, «#00D9E» como color no válido; «✓» en la ficha de paleta y en «✓ Personalizada»; marcas como segunda línea de la fila; «No hay cambios para guardar.» como nombre emergente (HE-02-HU09 ET04); «Sin cambios» en la barra de «Cambios sin guardar»; posición de los nombres emergentes; los 3 primeros errores de imagen como texto bajo el botón y el 4.º como píldora; «Más de 6 monitores» como píldora de información; «Fondo por defecto» como píldora (no estaba en ningún marco); tamaños de letra sin título de grupo.

## 3. Preguntas pendientes para Paula (sin hacer; juntas y con opciones)

- a) Detalles crema: ¿basta donde ya están (ventanas, panel de Windi, «Próximas a vencer», tarjetas Kanban) o también en otras tarjetas y paneles?
- b) En claro el Secundario es #00D9E2, igual al Principal: ¿se deja cian o pasa a violeta #6604E6? (afecta `203:10626` y la tabla `234:147`).
- c) Días solo con tarjetas completadas: se dibujó el ✓ sin relleno porque HE-10-HU05-CA04 pide «sin resaltado», y pendientes §9 dice «cada día con relleno, borde e ícono». ¿Cuál vale?
- d) ¿Se aprueban los 4 íconos nuevos de tipo y prioridad?
- e) El instalador del Figma difiere de `docs/contratos.md` 778-791 (no se cambió porque no está en pendientes): el contrato pide la casilla «Abrir la aplicación al iniciar Windows» (Figma «Inicio automático»); al final «Instalación completada.», «Abrir Windgets» y «Ya puedes eliminar el archivo del instalador que descargaste.» (Figma «Windgets se instaló correctamente.» y «Cerrar»); «Reinstalar» (Figma «Reinstalar Windgets»); instalación incompleta «Reparar»/«Cancelar» (Figma «Aceptar»); faltan los marcos de equipo no compatible, sin espacio, archivo dañado, falla y «La instalación se canceló.».
- f) Textos del Figma que no están en los documentos (lista en §4): ¿se quedan?

Lo ya decidido está en `rediseno_pendientes_prototipos.md` («Ya decidido») y no se vuelve a preguntar. Además: íconos Agenda «cuaderno», Planificador «portapapeles», Ver detalle «ficha», 12 íconos de widget; etiquetas de ejemplo «Trabajo, Hogar, Finanzas, Lectura»; la barra oscura se queda como estaba.

## 4. Para el resumen final (lote 13)

- Textos cambiados: «23 – 29 nov 2026», «Ver detalle», «Este tema ya muestra su imagen de fondo por defecto.», hex de los selectores, títulos de los desplegables, «La fecha de inicio no puede ser posterior a la fecha de fin.»; texto de relleno «Mensaje de error».
- Requieren RD-nn en la implementación: paleta claro y variable `seleccion` (§1 toca `apps/desktop/src/ui/tema/derivar.ts` y las tablas de RD-94), sección activa con Secundario (la app usa `accion`), `.wg-chip` en `tokens.css`, chat del widget de Windi (RD-71).
- Observaciones: hover nuevo en botón principal, campo e interruptor; animación del resaltado pospuesta; botones deshabilitados parecidos a secundarios en claro; temas oscuro, Rosa y Enfoque sin recapturar tras el cambio de color; revisar legibilidad del ✓ (`principal_legible`) en Rosa y Enfoque; la posición del selector de fecha se muestra con marcos de ejemplo porque `overlayPositionType` es de solo lectura.

### 4.1 Textos y supuestos sin definir (acumulado para el lote 13)

- Lote 8: ver §2c. Lotes 2 y 3: sin marco de mensaje en 06 Escritorio y 07 Web (no tienen «Sincronizado»); hora actual del ejemplo después de 08:00; Título y Descripción vacíos sin texto de ejemplo.
- Lotes 4 a 6: tipo de tarjeta en Kanban compacto (RD-73, RD-74) sin dibujar; posición de «todas completadas»; título «Día seleccionado» y ancho de «Hoy»; textos y colores del lote 6.
- Lote 9: fecha y ciudad del Reloj, «Actualidad de hoy», «Titular de ejemplo 2…5», «Fuente», «2 de 10», «Animación pausada» y «Uso de CPU» frente a «En pausa por alto consumo de recursos.», íconos del reproductor, Calendario movido en la vista previa de Noticias, ciudades de ejemplo (Popayán, Popondetta, Portland, Porto, Posadas), textos tecleados («Po», «Popa», «Popayám», texto largo), campo «Ciudad» en vez de «Datos», «Sugerencias de ciudad», botón de Configurar Clima sigue «Listo» (el documento dice «Guardar»), miga sin cambiar, ejemplos de clima con nombre de ícono y «— °C», «Pasa «Enviar la presentación» a Por hacer.», valores de colores propios, avisos de Organizar widgets, posición de la prioridad en Tareas, colores de columna por defecto (H-D-17), cantidad en el encabezado de columna, estados visuales sin definir (selección, puntero encima, arrastre, deshabilitados, vencida), títulos del widget de cinco tarjetas, «10:20 a. m.», tipo advertencia del aviso de wallpaper, contradicción «Mover a» (P29) y reordenar arrastrando (D-16) sin dibujar; descripciones del catálogo, «Atardecer», «Nubes», «Catálogo de animaciones», intervalos 10 y 90, «17 / 200», «214 / 200», «atardecer.png», marcas de selección y de quitar imagen, miniaturas de color, errores solo sobre «Agregar widget», «Externo»/«Local», píldoras elegidas, ícono de pausa, «›» en «Formato».
- Lote 11: «Tu cuenta está bloqueada…», «Tu sesión venció…» y «No pudimos abrir el navegador» como aviso arriba; «Si el correo está registrado, te enviamos un código de verificación.» (HE-01-HU06) no está en §14.7 y no se dibujó; «45» segundos; dos espacios entre texto y enlaces en correo registrado; «Regístrate» subrayado; Registro compactado para Google; ojo y nombre emergente debajo; logo bajado; íconos «Sin conexión» y Alerta dibujados por Claude; «Sincronizando…» sin ícono; 8 marcos «Sin conexión» muestran «Sincronizado» (contradicción previa) y en Planificador la lista se corta; píldoras de §14.8 y «detalle del indicador»; «Sesión cerrada.»; fuente del tema en píldoras Rosa y Enfoque (revisar las del lote 3); ejemplos «Mi tema», «08:00 – 09:00», «Paula», «Rosa pastel»; «Mensajes recientes» conserva tres ejemplos antiguos apilados (incluye el genérico «No se pudo completar la operación.»); variables estado_* y relleno_* nuevas (ajustan luminosidad por tema aunque la tabla dice que el color de estado no cambia); resaltado en la vista semanal (HE-10-HU05-CA08) sin dibujar (comprobar si existe); «Vence mañana» sin reloj; etiquetas nuevas en Fundamentos; botón elegido de Tipo y Prioridad sin ✓; texto a 12 px en campos estrechos; «Campos vacíos» cambió a «Sin prioridad»; forma del interruptor de vista del Kanban (copiada del segmentado Mes/Semana); ancho y dos líneas del nombre emergente de la papelera.
- Lote 12: ejemplo «Clima» en M-07; velo añadido a M-02…M-15; en M-01 «Cancelar instalación» quedó como botón principal (la regla de rojo habla de «Eliminar»); en la barra de instalación el progreso quedó con Secundario y el interruptor con `seleccion`.

- Lote 14: lo no definido o limitado por Figma está en `docs/rediseno_flujos_prototipos.md` §11 (saltos entre páginas, M-11/M-12/M-13 sin entrada por botón, «Sin espacio», «Instalación completada», origen de M-08/M-09/M-10).

### 4.2 Textos cambiados que faltan arriba

Títulos de los desplegables, «✓ » en la opción actual y widget de M-07; en `88:2` se actualizó el texto.

### 4.3 Para el «Aviso para la implementación» (RD-nn)

Paleta clara y variable `seleccion` (`apps/desktop/src/ui/tema/derivar.ts`, RD-94); sección activa con Secundario (la app usa `accion`); `.wg-chip` en `apps/desktop/src/ui/tema/tokens.css`; chat de Windi (RD-71); gráficas de Reportes (pendientes §7); presentación unificada de widgets; Reloj con fecha y ciudad (la app solo muestra la hora, D-214); Calendario con el mes como título; Kanban «+N más» y cantidad; Organizar widgets con barra flotante (cambia §7.4 y HE-05); forma con Esquinas y Sombra separadas; buscador de ciudad; agrandar según el widget (HE-05-HU03-CA01/ET05, DUDAS P26); interruptor de dos íconos para la vista del Kanban; botones de Tipo y Prioridad en el formulario de tarjeta (si la app no los tiene); «Elige un tema» de la landing con cuatro temas (no existe en el Figma, está en `apps/landing/src`; DUDAS P03b); instalador claro y oscuro «por confirmar en el código»; token nuevo para el velo.

### 4.4 Observaciones y cierre

- Además de las de arriba: hover nuevo en botón principal, campo e interruptor; temas sin recapturar tras el cambio de color; capturas por muestras; en «Nueva etiqueta · Error · Obligatorio» (`2144:24514`, `2144:24638`) el mensaje de error queda pegado a «Color» (revisar los demás temas).
- Informar a Paula: la barra de tareas se ocultó en los marcos del Escritorio salvo en notificación y área de notificación.
- Variables y componentes nuevos para §15 de pendientes: `seleccion`, `velo`, `borde_campo`, `burbuja_propia` (necesita token), `error`, `sombra`, estado_*/relleno_*, variables del deslizador, Interruptor `2052:545`, Paso, Carpeta `2071:2560`, Información `2074:541`, mensajes emergentes; nodo de Windi `66:71`. En §15 también: tabla «Estado del Figma», tachar E-nn y anotar la copia `A3Z03L20swFyo8qdP9jETF` junto a las líneas 8 y 9 sin cambiar D-01.

## 5. Notas técnicas de Figma

- `use_figma` con `skillNames` `resource:figma-use,resource:figma-generate-library`; un `setCurrentPageAsync` por llamada; no paralelizar escrituras; dividir scripts grandes (corte a ~35 s); respuesta de más de 48.000 bytes = no guarda.
- Páginas: `0:1` Fundamentos, `79:2` Acceso, `79:3` Planificador, `79:4` Agente, `79:5` Personalización, `79:6` Configuración, `83:2` Escritorio, `83:3` Web e instalación, `83:4` Confirmaciones. Componentes `2003:266`; menú `204:32251`.
- Colección `VariableCollectionId:200:2`: claro 200:0, Rosa 200:1, Enfoque 200:2, oscuro 233:0. Un color enlazado necesita el valor resuelto como base (si no, sale negro).
- Hay una variable BOOLEAN llamada «texto»: al buscar variables, filtrar por tipo COLOR y por colección.
- Cargar fuentes por nodo con `getStyledTextSegments(['fontName'])`. Nunito (claro y oscuro), Quicksand (Rosa), Space Grotesk (Enfoque); Acceso, web, instalador y píldoras, Rubik.
- `figma.loadAllPagesAsync` no funciona; `findAll` sobre toda la página 79:5 falla (filtrar hijos por nombre); usar `figma.skipInvisibleInstanceChildren=true`. Corte propio de los scripts a ~22 s e idempotentes.
- Capturas: crear una hoja temporal fuera del contenido (x=20000, o 90000 en las páginas anchas), clonar los marcos, `sheet.screenshot({scale:0.46})` y quitar la hoja.
- Marcos: pantalla 1093×560, confirmación 600×256, web 1280×790. Datos de ejemplo: hoy martes 24-nov-2026.
- Zonas ocupadas: 79:3 avisos x=32000+tema·1200; nombres emergentes del Kanban x=62000–64293, y=fila·625. 79:5 hasta y=50560 (siguiente fila libre ≈ 50625).
