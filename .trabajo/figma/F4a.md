# F4a · Inventario página 79:5 «04 Personalización», primera mitad

Cabecera
- Cobertura: líneas 222-300 de `docs/rediseno_flujos_ids_prototipos.md`, solo lectura.
- Última familia cubierta: línea 300 del documento de ids (F4a cubrió hasta 203:7477; F4a2 continúa desde 203:7563, ver «Continuación (F4a2)»).
- Llamadas a Figma usadas: 6 de 22 (más skill). Hora de cierre: 04:50 Colombia.
- Muestras de otros temas: 9 huellas en F4a2 (oscuro, Rosa, Enfoque).
- Huellas: `huellas/203-6362.json` … `203-7477.json` (F4a) y 203-7563 … 2221-84930 (F4a2), formato diff.

| Familia | Id claro | Estructura (una línea) | Estados / interacción |
|---|---|---|---|
| 1 Tema | 203:6362 | Migas, título, pasos, vista previa 664x373, panel «Mis temas» con 4 filas 276x32 | Pasos 2-4, Guardar como tema 203:10869, elegir tema (203:11013, 11084, 11155, 2061:619), renombrar OVERLAY 217:24146, eliminar OVERLAY 204:25110, M-02, Guardado→203:10056, M-05, Windi |
| 2 Fondo | 203:6440 | Panel «Imagen de fondo»: Catálogo («Atardecer»), Subir, Sin imagen, 2 deslizadores | 203:10198, 10273, 10346, 10417 |
| 3 Colores y tipografía | 203:6520 | 4 paletas 134x36, Colores del tema, Tipografía («Rubik · Mediano»), 2 Restablecer | 203:10490, 10565, 10640, 10942 |
| 4 Widgets | 203:6607 | 4 filas 276x40 con interruptor, Configurar, Eliminar deshabilitado; Forma, Distribución | cfg 203:7821, 7904, 7987, 8070; 10717; 10794; 9957; 6696 |
| Agregar widget | 203:6696 | Grupos «Widgets externos» y «Widgets locales», 8 filas | Clima 2211:79096 (variante no listada), 7219, 7477, 7391, 7305, 7649, 7563, 7735 |
| Clima | 203:7133 | Campo «Ciudad» + 3 selectores | OVERLAY 204:42141, 42165, 42201; añadir 203:9197 |
| Noticias | 203:7219 | «Datos» «Titulares del día  ›» + 3 selectores | añadir 203:9292 |
| Imagen estática | 203:7305 | Subir, Catálogo, 4 muestras, «JPG, JPEG o PNG. Máximo 20 MB.» | añadir 203:9387 |
| Carrusel | 203:7391 | «2 de 10», × por imagen, «Intervalo (segundos)» | añadir 203:9482 |
| Animación | 203:7477 | «Catálogo de animaciones»: Atardecer, Nubes | añadir 203:9577 |

Ids oscuro/Rosa/Enfoque: ver las líneas 222-300 del documento de ids; no verificados en esta pasada.

## Incoherencias
1. 203:6362: fila «Windgets oscuro» tiene fecha «24 nov» en un nodo llamado «Aplicado»; «Windgets claro» usa «Aplicado» en vez de fecha.
2. 203:6362: widgets de la vista previa con radio 10,826 y borde 1,2029 (decimales).
3. 203:6607: filas «Forma» y «Distribución» con trazo `linea/undefined`, sin relleno ni radio, frente a las demás filas.
4. 203:6440: deslizador «Desenfocar» con nodo llamado «0 %» y texto «0 px».
5. 203:6696: Clima apunta a 2211:79096, variante no listada en docs.
6. 203:6520: los pasos se desplazan 2 px respecto de la base (6362).
7. Colores fijos: #1b1721 en «Oscurecer imagen» en todas; muestras de tema con hex fijos (esperable).

## Continuación (F4a2)

Cobertura: líneas 234-300 del documento de ids. Llamadas a `use_figma`: 9 de 18. Cierre: 04:58 Colombia. Solo lectura.
Ids claro | oscuro | Rosa | Enfoque, tomados del documento de ids; los textos y medidas salen del marco claro y están en las huellas.
Bases de diff: 6696 (Agregar), 7821 (Configurar), 6607 (Agregado, Forma, Distribución), 6362 (Tema y Elegir tema), 6440 (Fondo), 6520 (Colores y tipografía), 9957 (Organizar).

| Familia | Claro / oscuro / Rosa / Enfoque | Estructura, textos y medidas | Interacciones |
|---|---|---|---|
| Agregar › Texto, Música, Windi | 203:7563/233:19984/204:12050/204:12136; 203:7649/233:20053/204:12222/204:12308; 203:7735/233:20122/204:12394/204:12480 | Filas Apariencia/Transparencia/Tamaño de 32 de alto en Texto y de 36 en Música, Windi y Reloj | Selectores 204:42141/42165/42201; «Ampliar menú»→204:32252 CHANGE_TO |
| Configurar › Reloj … Windi | 203:7821, 7904, 7987, 8070, 8153, 8236, 8319, 8402, 8485, 8568, 8651, 8734 (oscuro 233:20191…, Rosa 204:12566…, Enfoque 204:12649…) | Panel «Configurar widget» con filas Datos 276x36 y selectores | Formato Reloj 204:42231, Formato Calendario 204:42249, Datos Música 204:42351 |
| Widgets agregados | 203:9197 Clima, 9292 Noticias, 9387 Imagen, 9482 Carrusel, 9577 Animación, 9672 Texto, 9767 Música, 9862 Windi (oscuro 233:21435…, Rosa 204:15318…, Enfoque 204:15413…) | Fila del widget con interruptor 44x24, «Configurar», «Eliminar» deshabilitado | Navegación al configurar |
| Organizar widgets | 203:9957/233:22339/204:16838/204:16866 | Barra flotante 478x60 (250,484), «Cancelar» 91x36, «Listo» 66x36, asa de 6 puntos | Reloj ON_DRAG→217:17946 SMART_ANIMATE 0,2 s EASE_OUT |
| Arrastrando | 217:17802/233:23814/217:17850/217:17826 | Reloj 190.5x106 movido | ON_DRAG→217:17946 |
| Redimensionando | 217:17874/233:23843/217:17922/217:17898 | Reloj 266.5x148.5, tirador 22x22 | ON_DRAG→217:17802 SMART_ANIMATE 0,2 s EASE_OUT |
| Colisión | 217:17946/233:23873/217:17994/217:17970 | Aviso «Los widgets se superponen.» en píldora 242x42 y tarjeta 282x37, borde error | AFTER_TIMEOUT y Cerrar→217:17679 DISSOLVE 0,15 s EASE_OUT |
| Sin conexión | 217:18018/233:23905/217:18066/217:18042 | «Sin conexión · Puedes organizar los widgets de este tema.» | DISSOLVE 0,15 s EASE_OUT |
| Widget eliminado | 2221:84854/2221:86204/2221:85301/2221:85752 | «Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.» | DISSOLVE 0,15 s |
| Personalización más reciente | 2221:84930/2221:86280/2221:85377/2221:85828 | «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.» | DISSOLVE 0,15 s |
| Cambios sin guardar / Guardado / Aplicado | 203:9985, 10056, 10127 (oscuro 233:22368, 22461, 22554) | Barra inferior: «Cancelar cambios» 147x36, «Guardar» 87x36, «Aplicar» 81x36; estado «Cambios sin guardar» / «Tema guardado» / «Este tema ya está aplicado.»; lista «Mis temas» 284x256 con filas 276x32 | Elegir tema→M-04 (204:25084) en 9985 y SET_VARIABLE en 10056/10127; renombrar→217:24146; eliminar→204:25110 |
| Fondo (4 pantallas) | 203:10198 Catálogo, 10273 Subir, 10346 Sin imagen, 10417 Ajustar | Catálogo con muestras 276x32; «Seleccionar imagen» 158x36; «Usar el fondo del tema»; «Oscurecer · 30 %», pasos 0/15/30/45/60 % y 0/2/4 px | SET_VARIABLE; ← Regresar→203:6440 |
| Colores y tipografía (3) | 203:10490 Paletas, 10565 Selector de color, 10640 Tipografía | 4 paletas 276x32; filas «Principal · #00D9E2», «Secundario · #66…», «Texto · #17131D»; fuentes Inter, Merriweather, Poppins, JetBrains Mono, Nunito; tamaños 88x30 | Fuente y color→203:9985 NAVIGATE |
| Forma, Distribución | 203:10717, 10794 | «Rectas», «Suaves» (✓), «Redondas», «Sombra»; «Original», «Reloj a la derecha», «Kanban centrado» (filas 276x36) | SET_VARIABLE + NODE 2213:85246/85346/85446 y 223:15683/15812 |
| Guardar como tema, Restablecer | 203:10869, 10942 | Campo «Nombre del tema» 276x36, ayuda «Escribe de 1 a 40 caracteres.», «Guardar» 87x36; «Restablecer colores» 159x36 y «Restablecer tipografía» 175x36 | Guardar→CONDITIONAL; restablecer→203:9985 |
| Elegir tema (4) | 203:11013, 2061:619, 11084, 11155 | Barra inferior y lista «Mis temas»; vista previa del tema | Cancelar cambios→M-02 204:25071 OVERLAY |
| Renombrar tema | 217:24146/233:24456/217:24164/217:24155 | Overlay 386x173: «Renombrar tema», «Nombre del tema», campo 350x32, «Cancelar» 91x36, «Guardar» 87x36 | Cancelar y Guardar→CLOSE |
| Overlays M-02, M-04, M-05, M-06, M-07, M-15 | 204:25071, 25084, 25097, 25110, 25123, 25136 (oscuro 233:23578…) | Nota 424x160 (M-15: 512x160), título 20, cuerpo 14, botones 36 de alto; M-06/M-07 con botón en borde error | CLOSE, SET_VARIABLE, CONDITIONAL |
| Overlay Windi y 5 estados | 204:25151, 25162, 25177, 25188, 25199, 25210 | Panel 351x551 (737,4), input 275x36, «Enviar» 36x36, «0 / 2000»; textos «¿Qué organizamos hoy?», «¿Muevo la tarjeta a Por hacer?», «Escribiendo…», «Sin conexión», «Ocurrió un error inesperado.», «Propuesta descartada» | Enviar→204:25162; Confirmar→204:25151; Rechazar→204:25210 |
| Selectores (6) | 204:42141, 42165, 42201, 42231, 42249, 42351 | Panel 326 de ancho; opciones 306x31 r9 a paso 35; la elegida con trazo principal_legible | sin reacciones |

Muestras de otros temas (9 huellas): Texto 233:19984/204:12050/204:12136, Cambios sin guardar 233:22368/204:16894/204:16972, Paletas 233:22894/204:17946/204:18021.
- Oscuro: sin desvíos; solo cambia «Tema en edición  ·  Windgets oscuro» (ancho 211) y, en Cambios sin guardar, se intercambian «Aplicado» y «24 nov».
- Rosa: fuente Quicksand en todos los textos (el claro usa Nunito), 4 nodos más, anchos de texto distintos, colores fijos de la vista previa (#e6dcc8, #8c7a5c, #b9d8df, #c98b5a, #6e947e, #b8a078, #8c6f52, #b59c7a).
- Enfoque: fuente Space Grotesk, 5 nodos más, colores fijos de la vista previa (#dce6d5, #a9bea7, #4c7a57, #35593f, #2e4a36, #141316, #e0565b).
- Rosa y Enfoque: los íconos y las reacciones no se releyeron.

Lo no medible: sombras y efectos (no se leyeron), íconos dentro de instancias de 40 de ancho o menos, y las reacciones de las variantes oscuro/Rosa/Enfoque (se asumen iguales al claro).

### Incoherencias nuevas (F4a2)
8. 203:7563: «Datos» (y148-184) y «Controles» (y144-244) se solapan; las filas miden 32 en Texto, Imagen, Carrusel y Animación y 36 en Música, Windi y Reloj.
9. 203:8153 y 203:9197: restos «Bogotá   18 °C», «Nuevo · ícono del clima», «Nuevo · temperatura» y «Nuevo · ciudad».
10. 203:8236 y 203:9292 (Noticias): vista previa en (90,335) y no en (272,142).
11. 203:7987 y 203:8070: las filas Datos no tienen relleno ni trazo.
12. «Ampliar menú» va a 204:32252 CHANGE_TO en casi todas las familias y a 2068:2476 NAVIGATE en 203:9985.
13. Vectores de la imagen de fondo con hex fijo (#e5fbfc, #dcba04, #9feff3, #00d9e2, #6604e6, #3d0a8a); también #1b1721, #ffffff (papel de overlays y cabeza de Windi) y #806dac, #ffca22, #27152b, #dc026c en Windi.
14. 203:8402: «2 imágenes · 10 s» frente a la píldora «2 de 10».
15. 203:10565: el nodo se llama «Principal · #6604E6» y su texto dice «#00D9E2».
16. 203:10640: nodos de fuente llamados «Rubik» con textos Inter, Merriweather, Poppins, JetBrains Mono y Nunito; el tema claro usa Nunito, pero 203:6520 dice «Rubik · Mediano».
17. 203:9985, 10056, 10127: el nodo «Aplicado» de «Windgets oscuro» contiene «24 nov».
18. Avisos de Organizar widgets con colores de error y aviso fijos (#b32d42, #c32d43, #b47700, #c68700, #00d9e2), duplicados (píldora y tarjeta con la misma frase) y nombres de nodo que no coinciden con el texto («No se pudo completar la operación.»).
19. Overlay Windi: el marco «Descartado · panel anterior» sigue dentro de los 6 estados; el estado Error muestra «Ocurrió un error inesperado.» (genérico, sin código ni causa) y Sin conexión solo dice «Sin conexión».
20. 203:10869 y 217:24146: la ayuda «Escribe de 1 a 40 caracteres.» no tiene variante de error (vacío, largo ni nombre repetido).
21. Controles de alto distinto para el mismo tipo: filas de lista 32 (Mis temas), 36 (Forma, Distribución), 31 (selectores), 30 (fuente y tamaño).
22. 203:10942: el nodo «Restablecer colores y tipografía» contiene el texto «Restablecer tipografía»; no hay confirmación.
23. M-04, M-05, M-06 y M-15 tienen fijo el nombre del tema «Rosa pastel».
24. Selectores: el ✓ aparece dos veces (texto «✓ …» y vector «✓ Actual»).
25. 203:10717: la perilla de «Sombra» usa borde_campo y las demás perilla.
