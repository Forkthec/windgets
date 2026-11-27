# F4b · Inventario página 79:5 «04 Personalización», segunda mitad

Cabecera
- Cobertura: líneas 301-375 de `docs/rediseno_flujos_ids_prototipos.md` (75 familias; las líneas 378-379 son «Descartado» y se ignoran). Solo lectura.
- Última familia cubierta: línea 375, «3 Colores y tipografía · Aviso · Paleta no disponible» (2182:34430). Cobertura completa de las 75 familias.
- Llamadas a Figma usadas: 8 `use_figma` de 18 (más la guía figma-use). Hora de cierre: 05:10 Colombia.
- Muestras de otros temas: 9 huellas (oscuro, Rosa y Enfoque sobre 1 Tema · Aviso · Máximo de temas, Subir imagen · Imagen propia y Selector de color · Contraste bajo).
- Huellas: `huellas/<id-con-guion>.json` de las 75 familias (formato diff contra la base de su pantalla, con `reacciones` y `colores_fijos`) y 9 muestras.
- Método: diff por ruta/nombre contra la pantalla base (6362 Tema, 6440 Fondo, 6520 Colores, 6607 Widgets, 6696 Agregar, 7133/7305/7391/7563 Agregar widget concreto, 7821 Configurar Reloj, 9985 Cambios sin guardar, 10198 Catálogo, 10273 Subir imagen, 10565 Selector de color, 10869 Guardar como tema). Las instancias no se abren; sus textos se leen con `findAll(TEXT)`. Los colores sin variable se anotan como hex.

| Familia | Claro / oscuro / Rosa / Enfoque | Estructura (diff contra la base) | Estados / interacción |
|---|---|---|---|
| Organizar · Sin widgets activos | 2221:85006/2221:86356/2221:85453/2221:85904 | Base 9957 sin los 4 widgets de la vista previa; sin texto de vacío | Vacío; ON_CLICK step4 y Cambios sin guardar→203:6607 NAVIGATE |
| Organizar · Reloj a la derecha | 223:15783/233:24565/223:16299/223:16041 | Base 9957 con Reloj en x869 y Tareas del día en x30 | ON_DRAG Reloj→217:17802, Redimensionar→217:17874 SMART_ANIMATE 0,2 s EASE_OUT; step4→223:15683 |
| Organizar · Kanban centrado | 223:15912/233:24694/223:16428/223:16170 | Base 9957 con Kanban en (385,190) | Igual a Reloj a la derecha; step4→223:15812 |
| 4 Widgets · Error de carga | 217:18219/233:23937/217:18355/217:18287 | Panel sin filas: «No se pudieron cargar los widgets.» y botón 102x36 | Error (carga); botón→203:6607 NAVIGATE |
| 4 Widgets · Posición ajustada | 217:22821/233:24256/217:23205/217:23013 | Base 6607; Reloj movido a (201,226.5) | Mismas reacciones que 6607 |
| 4 Widgets · Tamaño ajustado | 217:22917/233:24356/217:23301/217:23109 | Base 6607; Reloj 210.5x112 | Igual a 6607 |
| 4 Widgets · Reloj a la derecha | 223:15683/233:24465/223:16199/223:15941 | Base 6607; Reloj en 568, Tareas del día en 90; selector dice «Reloj a la derecha  ›» (132 de ancho) | Igual a 6607 |
| 4 Widgets · Kanban centrado | 223:15812/233:24594/223:16328/223:16070 | Base 6607; Kanban en (274,278); selector «Kanban centrado  ›» | Igual a 6607 |
| 4 Widgets · Widget inactivo | 2240:103574/2240:107600/2240:104913/2240:106256 | Base 6607 con interruptor de Kanban apagado, sin su widget en la vista previa y estado «Cambios sin guardar» | Interruptor ON_CLICK CONDITIONAL+SET_VARIABLE |
| 4 Widgets · Eliminar no disponible | 2240:103864/2240:107890/2240:105207/2240:106551 | Base 6607 + tooltip «Nombre emergente» 428x36 en (629,184) | Hover sobre Eliminar deshabilitado: «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» |
| 4 Widgets · Animación en pausa | 2240:104066/2240:108092/2240:105409/2240:106753 | Panel «Widgets del tema» con filas 276x40; vista previa 158x96 con ícono de pausa 18x18 | Estado pausa (Animación) |
| 4 Widgets · Aviso widget repetido | 2240:104286/2240:108312/2240:105629/2240:106973 | Píldora 229x42 con borde cian fijo: «Ya agregaste este widget.» | Aviso informativo |
| 4 Widgets · Aviso widget no existe | 2240:104495/2240:108521/2240:105838/2240:107182 | Píldora 223x42 con borde ámbar fijo: «Este widget ya no existe.» | Aviso de advertencia |
| 4 Widgets · Aviso error de operación | 2240:104704/2240:108730/2240:106047/2240:107391 | Píldora 462x42 con borde error fijo: «No pudimos completar la operación. Intenta de nuevo más tarde.» | Aviso de error (sin código) |
| Widgets · No se guardaron cambios | 2221:85076/2221:86426/2221:85527/2221:85979 | Base 6607 con Eliminar habilitado y píldora «No se guardaron cambios.» (borde cian fijo) | Aviso informativo |
| Clima · Ciudad no encontrada | 217:18564/233:24040/217:18694/217:18629 | Campo 276x76 con «Popayám»; botón Agregar al 40 %; sin vista previa | Error en el campo Ciudad: «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» |
| Clima · Ciudad duplicada | 217:18759/233:24112/217:18889/217:18824 | Campo 276x58 + tarjeta 276x36 con barra #C68700 | Error en Ciudad: «Ya tienes un widget Clima para esa ciudad.» |
| Clima · Sin conexión | 217:18954/233:24184/217:19084/217:19019 | Base Clima con «Popayán, Cauca, Colombia»; botón Agregar al 40 %; sin texto de conexión | Sin conexión sin mensaje |
| Clima · Campo vacío | 2211:79096/2213:82878/2213:79911/2213:81393 | Campo Ciudad vacío; Agregar 74 de ancho al 45 % | Vacío; clic en Campo→2211:79211 NAVIGATE |
| Clima · Sugerencias de ciudad | 2211:79211/2213:82993/2213:80026/2213:81508 | Lista 276x182 con título «Sugerencias de ciudad» y 5 opciones 264x27 r9 | Opciones SET_VARIABLE |
| Clima · Sin conexión al buscar | 2211:79326/2213:83108/2213:80141/2213:81623 | Campo 276x76 con «Popa» | Error en Ciudad: «No hay conexión a internet. Conéctate para validar la ciudad.» |
| Clima · Ciudad demasiado larga | 2211:79441/2213:83223/2213:80256/2213:81738 | Campo 276x58 con dirección larga | Error en Ciudad: «La ciudad no puede superar los 100 caracteres.» |
| Clima · Servicio no disponible | 2211:79556/2213:83338/2213:80371/2213:81853 | Píldora de error 412x42 con borde #b32d42 fijo: «No pudimos cargar el clima. Intenta de nuevo más tarde.» | Error emergente |
| Carrusel · Error de mínimo | 2240:94040/2240:96509/2240:94863/2240:95686 | «1 de 10», una imagen; error en rojo bajo las miniaturas | «Selecciona al menos 2 imágenes para el carrusel.» |
| Carrusel · Error de máximo | 2240:94171/2240:96640/2240:94994/2240:95817 | «10 de 10», 10 miniaturas 22x28 | «Puedes agregar máximo 10 imágenes al carrusel.» |
| Carrusel · Error de intervalo | 2240:94332/2240:96801/2240:95155/2240:95978 | Intervalo «90»; error bajo el campo | «El intervalo debe estar entre 3 y 60 segundos.» |
| Texto · Texto demasiado largo | 2240:94470/2240:96939/2240:95293/2240:96116 | Campo 88 de alto, contador «214 / 200» en error | «El texto no puede superar los 200 caracteres.» |
| Imagen estática · Imagen propia | 2240:94596/2240:97065/2240:95419/2240:96242 | Muestra del catálogo sin ✓ y línea «Imagen propia: atardecer.png» | Imagen subida |
| Agregar widget · Widgets ya agregados | 2240:94722/2240:97191/2240:95545/2240:96368 | Catálogo con Noticias y Reproductor de música deshabilitados | Filas ya agregadas sin acción; «Ya agregaste este widget.» |
| Otra paleta › Reloj | 2222:86308/2222:88369/2222:86983/2222:87674 | Panel 300x348, 4 paletas 276x36 | Elegir paleta |
| Colores libres › Reloj | 2222:86415/2222:88476/2222:87090/2222:87781 | 3 filas de color 276x36 y campo hexadecimal «#1F6F5C» | Campo→2222:86522 NAVIGATE |
| Colores libres · Contraste bajo › Reloj | 2222:86522/2222:88583/2222:87197/2222:87888 | Igual a Colores libres con «#C9C9C9» y píldora 460x42 | «El contraste de estos colores es bajo (1,7:1). Prueba con #17131D.»; AFTER_TIMEOUT 6 s |
| Apariencia propia › Reloj | 2222:86629/2222:88690/2222:87304/2222:87995 | Base Configurar Reloj con «Otra paleta  ›» | Selectores OVERLAY |
| Forma de los widgets · Rectas | 2213:85246/2213:86647/2213:85704/2213:86174 | Panel 300x348 con atrás 36x36 y 3 opciones 276x36 r9; elegida con trazo seleccion; los 4 widgets de la vista previa con radio 0 | Opciones «Rectas», «Suaves», «Redondas»; migas de 4 niveles |
| Forma de los widgets · Redondas | 2213:85346/2213:86747/2213:85804/2213:86274 | Igual a Rectas con radio 22 en la vista previa | Elegida «Redondas» |
| Forma de los widgets · Con sombra | 2213:85446/2213:86847/2213:85904/2213:86374 | Igual a Rectas con la 3.ª opción elegida; radio 10,85 en vista previa | Sombra no medida |
| 4 Widgets · Nombre emergente | 2068:3018/2068:6241/2068:9528/2068:12847 | Base 6607 + tooltip 113x36 en (976,144) | Hover: «Agregar widget» |
| 4 Widgets · Nombre emergente · Papelera deshabilitada | 2257:160470/2257:160672/2257:160874/2257:161076 | Globo 260x54 r6 f:tinta con texto f:fondo | Hover en Eliminar deshabilitado: «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» |
| 1 Tema · Barra expandida | 2068:667/2068:3890/2068:7117/2068:10421 | Menú lateral expandido: contenido desplazado 120 px a la derecha, vista previa 552x310 | Barra expandida; sin textos nuevos |
| 2 Fondo · Barra expandida | 2068:966/2068:4189/2068:7420/2068:10725 | Igual a 1 Tema · Barra expandida | Barra expandida |
| 3 Colores y tipografía · Barra expandida | 2068:1233/2068:4456/2068:7691/2068:10997 | Igual a 1 Tema · Barra expandida | Barra expandida |
| 4 Widgets · Barra expandida | 2068:1522/2068:4745/2068:7984/2068:11291 | Igual a 1 Tema · Barra expandida | Barra expandida |
| Agregar widget · Barra expandida | 2068:1830/2068:5053/2068:8296/2068:11604 | Igual a 1 Tema · Barra expandida | Barra expandida |
| Configurar widget › Reloj · Barra expandida | 2068:2103/2068:5326/2068:8573/2068:11882 | Igual a 1 Tema · Barra expandida | Barra expandida |
| Cambios sin guardar · Barra expandida | 2068:2476/2068:5699/2068:8958/2068:12270 | Igual a 1 Tema · Barra expandida | Barra expandida |
| 1 Tema · Nombre emergente | 2068:3197/2068:6420/2068:9711/2068:13031 | Tooltip 86x36 en (962,298) | Hover: «Renombrar» |
| Barra contraída · Nombre emergente | 2068:3367/2068:6590/2068:9885/2068:13206 | Tooltip 70x54 en (2,49) sobre la barra | Hover: «Expandir menú» |
| Subpantalla · Nombre emergente | 2068:3662/2068:6885/2068:10188/2068:13511 | Configurar Clima con panel 300x348 y vista previa 158x88 | Tooltip «Regresar» sobre el botón atrás (inferido de los textos nuevos) |
| 1 Tema · Cambios sin aplicar | 2177:32079/2185:42871/2184:34296/2185:36505 | Fila del tema aplicado 48 de alto con marca 96x15 | Marca «Cambios sin aplicar» |
| 1 Tema · Cambios sin guardar | 2177:32246/2185:43090/2184:34550/2185:36759 | Igual a Cambios sin aplicar con marca 102x15 | Marca «Cambios sin guardar» |
| 1 Tema · Eliminar deshabilitado | 2177:32413/2185:43309/2184:34804/2185:37013 | Fila aplicada con Renombrar 32x28 y Eliminar 29x28 r4; tooltip 390x36 | «No puedes eliminar el tema aplicado. Aplica otro tema primero.» |
| 1 Tema · Aplicar deshabilitado | 2177:32591/2185:43539/2184:35069/2185:37278 | Botón Aplicar con opacidad 45 y tooltip 179x36 | «Este tema ya está aplicado.» |
| 1 Tema · Guardar deshabilitado | 2177:32768/2185:43762/2184:35327/2185:37536 | Botón Guardar con opacidad 45 y tooltip 195x36 | «No hay cambios para guardar.» |
| 1 Tema · Un solo tema | 2177:32943/2185:43985/2184:35585/2185:37794 | Lista con un solo tema y ayuda 268x32 | «Guarda otra personalización con “Guardar como tema” para tener más temas.» |
| 1 Tema · Aviso · Máximo de temas | 2178:32802/2185:44548/2184:36253/2185:38462 | Píldora 467x42 ámbar fijo | «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.» |
| 1 Tema · Aviso · Tema con las mismas propiedades | 2178:32988/2185:44777/2184:36517/2185:38726 | Píldora 450x42 cian fijo | «Ya tienes el tema “Rosa pastel” con estas mismas propiedades.» |
| 1 Tema · Aviso · Tema que ya no existe | 2178:33174/2185:45006/2184:36781/2185:38990 | Píldora 211x42 error fijo | «Este tema ya no existe.» |
| 1 Tema · Aviso · Personalización más reciente | 2178:33360/2185:45235/2184:37045/2185:39254 | Píldora 715x42 cian fijo | «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.» |
| Guardar como tema · Nombre muy largo | 2178:32554/2185:44204/2184:35839/2185:38048 | Campo con trazo error; mensaje 180x28 bajo el campo | Error en Nombre del tema: «El nombre no puede superar los 40 caracteres.»; ON_KEY_DOWN CONDITIONAL |
| Guardar como tema · Nombre repetido | 2178:32678/2185:44376/2184:36046/2185:38255 | Campo con trazo error y «Rosa pastel» | Error en Nombre del tema: «Ya existe un tema con ese nombre. Elige otro.» |
| 2 Fondo · Ajuste por monitor | 2180:33062/2185:45464/2184:37309/2185:39518 | Lista de ajustes bajo el selector de monitor; el resto sube 44 | Opciones «Rellenar» (elegida), «Ajustar», «Expandir», «Mosaico», «Centrar»; título «Ajuste del monitor 1 (principal)» |
| 2 Fondo · Ajuste por monitor · Varios monitores | 2180:33209/2185:45661/2184:37541/2185:39750 | Igual a Ajuste por monitor con «Extender» | Opción «Extender» solo con varios monitores |
| 2 Fondo · Aviso · Más de 6 monitores | 2180:33358/2185:45860/2184:37775/2185:39984 | Lista con «Extender» y nota informativa (cian fijo) | «Puedes ajustar el fondo de hasta 6 monitores. Los demás usan el ajuste del monitor principal.» |
| 2 Fondo · Aviso · Monitor desconectado | 2180:33569/2185:46070/2184:38020/2185:40229 | Lista con aviso de error (borde fijo) | «Ese monitor ya no está conectado. Elige otro monitor.» |
| 2 Fondo · Aviso · Imagen del tema no encontrada | 2180:33780/2185:46280/2184:38265/2185:40474 | Píldora 585x42 error fijo | «No encontramos la imagen de fondo de este tema. Sube otra o elige una del catálogo.» |
| 2 Fondo · Aviso · Fondo por defecto | 2180:36230/2185:47345/2184:39540/2185:41749 | Píldora 401x42 cian fijo | «Este tema ya muestra su imagen de fondo por defecto.» |
| Subir imagen · Imagen propia | 2180:34602/2185:46477/2184:38497/2185:40706 | Fila «Imagen propia» 150x36 y botón «Quitar imagen» 125x36 | Imagen subida; Quitar imagen |
| Subir imagen · Error · Formato no permitido | 2180:34732/2185:46655/2184:38710/2185:40919 | Texto de error 276x36 en (781,240) | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» |
| Subir imagen · Error · Imagen muy pesada | 2180:34852/2185:46827/2184:38917/2185:41126 | Texto de error 276x36 | «La imagen supera el tamaño máximo de 20 MB.» |
| Subir imagen · Error · Imagen dañada | 2180:34972/2185:46999/2184:39124/2185:41333 | Texto de error 276x36 | «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» |
| Catálogo de imágenes · Vacío | 2180:35092/2185:47171/2184:39331/2185:41540 | Texto 276x40 en lugar de las 3 miniaturas | «El catálogo de imágenes no tiene imágenes por ahora.» |
| Selector de color · Error · Color no válido | 2182:33981/2185:47542/2184:39772/2185:41981 | Campo hexadecimal con trazo error 2 px; mensaje 276x36 | Error en el campo: «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).» |
| Selector de color · Aviso · Contraste bajo | 2182:34106/2185:47715/2184:39980/2185:42189 | Píldora 459x42 ámbar fijo | «El contraste de estos colores es bajo (2,1:1). Prueba con #17131D.» |
| 3 Colores y tipografía · Paleta personalizada | 2182:34290/2185:47898/2184:40198/2185:42407 | Fila Paletas con «✓ Personalizada» 99x18 | Paleta personalizada marcada |
| 3 Colores y tipografía · Aviso · Paleta no disponible | 2182:34430/2185:48090/2184:40425/2185:42634 | Píldora 336x42 error fijo | «Esta paleta ya no está disponible. Elige otra.» |

## Muestras de otros temas

Contra el claro de su familia (huellas con `"tema"` oscuro, rosa, enfoque):
- 1 Tema · Aviso · Máximo de temas (2185:44548, 2184:36253, 2185:38462): solo cambian el nombre del «Tema en edición», la fila seleccionada (fill superficie_baja, trazo principal_legible 2 px) y el orden de las filas. Funciona con variables.
- Subir imagen · Imagen propia (2185:46477, 2184:38497, 2185:40706): solo cambia el «Tema en edición». Sin desvíos.
- Selector de color · Contraste bajo (2185:47715, 2184:39980, 2185:42189): cambian los hex de los textos (Principal, Secundario, Texto) y la sugerencia «Prueba con #…»; el borde de la píldora sigue en #b47700 fijo en los cuatro temas.

Desvíos: (a) los bordes de las píldoras de aviso (#b47700, #00d9e2, #b32d42) no son variables y no cambian con el tema; (b) en Rosa y Enfoque los nombres de capa de las filas de tema están cruzados (nodo «Rosa pastel» con texto «Windgets claro»); (c) en oscuro la lista de temas pone primero «Windgets oscuro»: el orden de filas depende del tema.

## Incoherencias

1. Bordes de aviso fijos: las píldoras «Mensaje emergente / Información, Advertencia, Error» y los avisos de Widgets y Clima usan #00d9e2, #b47700 y #b32d42 sin variable; no siguen el tema (se vio en las muestras). El color de acento aparece solo como hex en `colores_fijos` de cada huella.
2. Alturas de aviso: píldoras de 42 de alto en todas; anchos entre 211 y 715 sin tope ni regla; la de 715 (Personalización más reciente) llega a 354 de x, pegada al centro del marco 1093.
3. Nombres emergentes con dos formas distintas: instancia «Nombre emergente» de alto 36 (la mayoría), de 54 (Expandir menú) y un marco propio con «Globo» 260x54 r6 f:tinta (Papelera deshabilitada, 2257:160470) que se llama igual pero no es la instancia. Además 2240:103864 repite el texto de 2257:160470.
4. Capas con nombres que no coinciden con el texto: «Bogotá, Colombia» con texto «Popayán, Colombia»; «Secundario · #6604E6» con texto #00D9E2; «Atardecer/Colinas/Horizonte» con textos Amanecer/Bosque/Taller; filas de opción de Forma de los widgets llamadas «Ir · Cambios sin guardar»; filas de Colores libres llamadas igual; «Windgets» con texto «Rosa pastel» en temas Rosa y Enfoque.
5. Contraste bajo: Selector de color dice «2,1:1» y Colores libres › Reloj dice «1,7:1» con otra sugerencia («#17131D» en ambos); el valor depende de los colores de cada pantalla, pero la sugerencia es la misma en el claro y distinta en otros temas.
6. Clima · Sin conexión (217:18954) no muestra ningún mensaje de falta de conexión, a diferencia de Clima · Sin conexión al buscar (2211:79326: «No hay conexión a internet. Conéctate para validar la ciudad.»): un error previsible sin texto.
7. Clima · Ciudad duplicada (217:18759) usa una barra ámbar #C68700 fija en un marco «Ciudad duplicada» que repite el aviso del campo; las demás familias de error de campo usan stroke `error`.
8. Campo con error pierde fill y stroke de variable: Clima · Ciudad no encontrada / Sin conexión al buscar / Ciudad demasiado larga dejan el campo sin relleno ni trazo propios (el borde vive dentro de la instancia); en Guardar como tema y Selector de color sí cambia el stroke a `error` (2 px en el color). Dos formas de mostrar el mismo error.
9. Mensajes de error con altos distintos: Subir imagen y Selector de color 276x36 (texto f:error), Carrusel y Texto 15 de alto, Guardar como tema 180x28; sin regla común de alto ni ancho (la caja 180 de ancho recorta «El nombre no puede superar los 40 caracteres.» en dos líneas).
10. Barra contraída · Nombre emergente (70x54) es de alto 54; el resto de tooltips de ícono mide 36.
11. Forma de los widgets: la opción «Con sombra» no se pudo medir (efectos no comparados) y la migas añade un cuarto nivel «4 Widgets › Forma de los widgets» no presente en Widgets.
12. Subpantalla · Nombre emergente (2068:3662) no es el marco base 6362 sino Configurar Clima; el tooltip leído es «Regresar» (inferido por los textos nuevos).
13. Radios de la vista previa: Rectas 0, base 10,85, Redondas 22; barra expandida baja a 9 (Reloj) y sw 1,2>1: el radio 10,85 es un valor fraccionario del marco 1093 escalado, no un token.

## Lo no medible

- Sombras y efectos: no se comparan (Con sombra, píldoras).
- Estados hover y foco: Figma solo tiene los marcos «Nombre emergente»; no hay marcos de foco por teclado de los controles.
- Texto exacto del tooltip de 2068:3662 inferido; texto de la nota de Más de 6 monitores y del aviso de Monitor desconectado leídos solo como primera línea.
- Textos de las instancias se leen aplanados; los espacios entre dos líneas no se conservan.
