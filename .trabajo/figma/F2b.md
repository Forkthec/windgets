# F2b · Página 79:3 · 02 Planificador, segunda mitad (solo lectura)

Cobertura: 62 de 62 familias de las líneas 129 a 194 de `docs/rediseno_flujos_ids_prototipos.md`, de «Calendario · Día con el puntero encima» (2155:32112) a «Detalle de tarjeta · Sin datos» (2148:26896). Última familia cubierta: 2148:26896. Las 62 en claro; las 62 con ids de oscuro, Rosa y Enfoque; los temas se leyeron por muestra (3 familias por tema) y, además, un censo de familias tipográficas en los 4 marcos de las 62. Cupo: 10 de 22 (1 `get_figma_skill`, 9 `use_figma`; 0 de `get_design_context`, `get_screenshot`, `get_metadata`). Lectura: 26-nov-2026 (hora Colombia). Marco de pantalla 1093x560.
Huellas: `.trabajo/figma/huellas/` con 71 archivos de esta tanda (62 en claro + 9 de muestras de tema). Todas en formato diff (`base`, `el`, `quitados`), más `reacciones` y `colores_fijos`. La base es la pantalla o el modal que mejor encaja con cada familia, no una sola: 204-805 Calendario, 204-1249 Semana, 204-1316 Panel del día, 204-1442 Mes y año, 204-916 Agenda, 204-1005 / 204-1683 / 204-1766 / 219-57179 Reportes, 204-1078 Etiquetas, 204-2047 / 204-2095 Etiqueta, 204-2143 / 204-2191 Columna, 204-1915 Nueva tarjeta, 204-1981 Editar tarjeta, 204-1849 Detalle. Las bases del encargo (204-622, 204-704, 204-25611) son otras pantallas y no encajan con estas familias. En `el`: `+` nodo añadido (ruta, tipo T/F/I/R, caja @x,y ancho x alto relativa al marco, texto, relleno f, trazo s/grosor, radio r, fuente, componente c, sombra sh, layout); `~` campo cambiado (`campo:antes→después`). Un hex en f o s es color fijo (incoherencia). No se entra en íconos, vectores ni menú lateral.
Transiciones: «sin transición» = `transition` nulo en Figma (salto instantáneo). En la primera tanda de lectura salía «∅»; se normalizó a lo mismo.

## Ids por familia (claro | oscuro | Rosa | Enfoque)

| # | Familia | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|---|
| 1 | Calendario · Día con el puntero encima | 2155:32112 | 2156:3648 | 2156:3300 | 2156:3474 |
| 2 | Calendario · Aviso · Día pasado | 2155:32612 | 2156:4796 | 2156:4446 | 2156:4621 |
| 3 | Calendario · Nombre emergente · Mes anterior | 2155:31312 | 2156:1570 | 2156:1212 | 2156:1391 |
| 4 | Calendario · Nombre emergente · Mes siguiente | 2155:31491 | 2156:2107 | 2156:1749 | 2156:1928 |
| 5 | Calendario · Semana · Nombre emergente · Semana anterior | 2155:31722 | 2156:2624 | 2156:2286 | 2156:2455 |
| 6 | Calendario · Semana · Nombre emergente · Semana siguiente | 2155:31891 | 2156:3131 | 2156:2793 | 2156:2962 |
| 7 | Panel del día · Vacío | 2155:32348 | 2156:4238 | 2156:3822 | 2156:4030 |
| 8 | Mes y año · Escribir año | 219:14757 | 233:16579 | 219:14788 | 219:14819 |
| 9 | Agenda diaria · Asignar bloque | 217:15308 | 233:16180 | 217:15426 | 217:15367 |
| 10 | Agenda diaria · Quitar bloque | 217:15485 | 233:16240 | 217:15603 | 217:15544 |
| 11 | Agenda diaria · Bloque pasado | 217:15662 | 233:16302 | 217:15780 | 217:15721 |
| 12 | Agenda diaria · Sin tarjetas por programar | 2152:30628 | 2153:30603 | 2153:30443 | 2153:30523 |
| 13 | Agenda diaria · Aviso al soltar · No puedes asignar tarjetas a un bloque h… | 2152:31011 | 2153:31383 | 2153:31223 | 2153:31303 |
| 14 | Agenda diaria · Aviso al soltar · No puedes programar la tarjeta después d… | 2152:31150 | 2153:31623 | 2153:31463 | 2153:31543 |
| 15 | Agenda diaria · Nombre emergente · Elegir un día | 2152:31289 | 2153:31871 | 2153:31703 | 2153:31787 |
| 16 | Reportes · Vacío | 217:16271 | 233:16363 | 217:16357 | 217:16314 |
| 17 | Reportes · Cargando | 217:16400 | 233:16409 | 217:16486 | 217:16443 |
| 18 | Reportes · Error | 217:16529 | 233:16455 | 217:16615 | 217:16572 |
| 19 | Reportes · Sin conexión | 217:16658 | 233:16501 | 217:16744 | 217:16701 |
| 20 | Reportes · Sin tarjetas | 2161:32852 | 2163:34272 | 2163:34092 | 2163:34182 |
| 21 | Reportes · Rango recortado | 2161:32950 | 2163:34536 | 2163:34362 | 2163:34449 |
| 22 | Reportes · Rango personalizado | 219:57179 | 233:16610 | 219:57330 | 219:57481 |
| 23 | Reportes · Elegir Desde | 219:57192 | 233:16623 | 219:57343 | 219:57494 |
| 24 | Reportes · Elegir Hasta | 219:57261 | 2129:51350 | 2129:51002 | 2129:51176 |
| 25 | Reportes · Elegir Desde · debajo de su campo | 2129:50723 | 2129:51245 | 2129:50897 | 2129:51071 |
| 26 | Reportes · Elegir Hasta · debajo de su campo | 2129:50810 | 2129:51332 | 2129:50984 | 2129:51158 |
| 27 | Reportes · Rango · Fecha de inicio posterior | 2129:50160 | 2129:50535 | 2129:50285 | 2129:50410 |
| 28 | Reportes · Rango · Campo obligatorio | 2129:50191 | 2129:50566 | 2129:50316 | 2129:50441 |
| 29 | Reportes · Rango · Rango mayor de un año | 2129:50222 | 2129:50597 | 2129:50347 | 2129:50472 |
| 30 | Reportes · Rango · Fecha no válida | 2129:50253 | 2129:50628 | 2129:50378 | 2129:50503 |
| 31 | Reportes · Puntero encima de la gráfica | 2160:1449 | 2163:33346 | 2163:33162 | 2163:33254 |
| 32 | Reportes · Estado elegido · Vencidas | 2160:1603 | 2163:33678 | 2163:33438 | 2163:33558 |
| 33 | Reportes · Rango cambiado · Estado sin tarjetas | 2160:1785 | 2163:33994 | 2163:33798 | 2163:33896 |
| 34 | Reportes · Filtro de etiquetas abierto | 2161:33045 | 2163:34875 | 2163:34623 | 2163:34749 |
| 35 | Reportes · Filtro de etiquetas · Máximo | 2161:33171 | 2163:35259 | 2163:35001 | 2163:35130 |
| 36 | Reportes · Filtro de etiquetas · Sin etiquetas | 2161:33300 | 2163:35600 | 2163:35388 | 2163:35494 |
| 37 | Etiquetas · Vacío | 217:17387 | 233:16547 | 217:17449 | 217:17418 |
| 38 | Etiquetas · Nombre emergente | 2039:16540 | 2039:16603 | 2039:16666 | 2039:16729 |
| 39 | Etiquetas · Aviso · Máximo de etiquetas | 2142:20564 | 2142:21834 | 2142:23104 | 2142:24374 |
| 40 | Etiquetas · Aviso · Etiqueta inexistente | 2142:20717 | 2142:21987 | 2142:23257 | 2142:24527 |
| 41 | Nueva etiqueta · Error · Obligatorio | 2143:22996 | 2144:24638 | 2143:25240 | 2144:24514 |
| 42 | Nueva etiqueta · Error · Nombre largo | 2143:23192 | 2144:24886 | 2143:25436 | 2144:24762 |
| 43 | Nueva etiqueta · Error · Nombre repetido | 2143:23388 | 2144:25134 | 2143:25632 | 2144:25010 |
| 44 | Editar etiqueta · Error · Color no disponible | 2143:24679 | 2144:26786 | 2143:26923 | 2144:26662 |
| 45 | Nueva columna · Error · Obligatorio | 2143:23584 | 2144:25492 | 2143:25828 | 2144:25258 |
| 46 | Nueva columna · Error · Nombre largo | 2143:23949 | 2144:25960 | 2143:26193 | 2144:25726 |
| 47 | Nueva columna · Error · Nombre repetido | 2143:24314 | 2144:26428 | 2143:26558 | 2144:26194 |
| 48 | Editar columna · Error · Color no disponible | 2143:24875 | 2144:27144 | 2143:27119 | 2144:26910 |
| 49 | Nueva tarjeta · Etiquetas abierta | 2140:19720 | 2140:21665 | 2140:20369 | 2140:21017 |
| 50 | Nueva tarjeta · Etiquetas · Máximo | 2140:19887 | 2140:21832 | 2140:20536 | 2140:21184 |
| 51 | Nueva tarjeta · Etiquetas · Sin etiquetas | 2140:20059 | 2140:22004 | 2140:20708 | 2140:21356 |
| 52 | Nueva tarjeta · Etiquetas · Sin elegir | 2140:20210 | 2140:22154 | 2140:20858 | 2140:21506 |
| 53 | Nueva tarjeta · Fecha límite abierta | 2148:26258 | 2149:27218 | 2149:26898 | 2149:27058 |
| 54 | Nueva tarjeta · Fecha del bloque abierta | 2148:26418 | 2149:27698 | 2149:27378 | 2149:27538 |
| 55 | Nueva tarjeta · Hora del bloque abierta | 2148:26578 | 2149:28180 | 2149:27858 | 2149:28019 |
| 56 | Nueva tarjeta · Campos vacíos | 2148:26739 | 2149:28641 | 2149:28341 | 2149:28491 |
| 57 | Nueva tarjeta · Error al guardar | 2148:27220 | 2149:30035 | 2149:29745 | 2149:29890 |
| 58 | Nueva tarjeta · Errores · Obligatorio, fecha no válida y descripción larga | 2148:27815 | 2149:30474 | 2149:30180 | 2149:30327 |
| 59 | Nueva tarjeta · Errores · Título largo, fecha pasada y bloque pasado | 2148:27969 | 2149:30915 | 2149:30621 | 2149:30768 |
| 60 | Nueva tarjeta · Errores · Bloque después de la fecha límite | 2148:28123 | 2149:31352 | 2149:31062 | 2149:31207 |
| 61 | Editar tarjeta · Etiquetas abierta | 2148:27045 | 2149:29570 | 2149:29220 | 2149:29395 |
| 62 | Detalle de tarjeta · Sin datos | 2148:26896 | 2149:29077 | 2149:28791 | 2149:28934 |

## Estructura común

- Pantalla de origen (claro) a 1093x560 con la ventana, el selector o el aviso encima. Los avisos usan el componente «Mensaje emergente» con Estado = Visible / En pausa / Oculto.
- Variables enlazadas en los marcos leídos: tinta, superficie, linea, borde_campo, borde, error, seleccion, sobre_seleccion, fondo, accion, superficie_alta (nombres como en F0). Un hex es color fijo.
- Letra: Nunito en la app; Rubik en el selector de fechas de Reportes (Elegir Desde / Hasta); Quicksand en Rosa; Space Grotesk en Enfoque (censo al final de «Muestras de tema»).

## Familias

Cada bloque: estructura (diff contra su base: añadidos / cambiados / quitados), elementos del diff, textos «…» de los nodos añadidos o cambiados (los de la base no se repiten), fuentes (censo: N Nunito, R Rubik, Q Quicksand, S Space Grotesk, m mixta; en claro|oscuro|Rosa|Enfoque), interacciones y colores fijos. Los textos de error llevan el campo en la ruta del elemento.

### 1. Calendario · Día con el puntero encima (2155:32112)
- Ids: claro 2155:32112 · oscuro 2156:3648 · Rosa 2156:3300 · Enfoque 2156:3474. Marco 1093x560.
- Estructura: base 204-805; +0 / ~0 / -0.
- Fuentes: N81|N81|N81|N81
- Interacciones: 
  - Ir · Mes y año: ON_CLICK → NODE/NAVIGATE 204:1442 «Mes y año · Tema Windgets claro» · sin transición
  - Ir · Calendario · Semana: ON_CLICK → NODE/NAVIGATE 204:1249 «Calendario · Semana · Tema Windgets claro» · sin transición
  - Día del mes: ON_CLICK → CONDITIONAL · sin transición
  - Ir · Panel del día: ON_CLICK → NODE/NAVIGATE 204:1316 «Panel del día · Tema Windgets claro» · sin transición
- Colores fijos: #2b7a8c×5 Etiqueta; #b8692a×7 Etiqueta; #2e8b57×3 Etiqueta; #b04f7d×7 Etiqueta

### 2. Calendario · Aviso · Día pasado (2155:32612)
- Ids: claro 2155:32612 · oscuro 2156:4796 · Rosa 2156:4446 · Enfoque 2156:4621. Marco 1093x560.
- Estructura: base 204-805; +1 / ~0 / -1. Quita: /Sincronizado.
- Elementos (diff):
  - +Mensaje emergente / Advertencia [I] @744,4 325x42 «No puedes crear tarjetas en días pasados.» f=superficie_alta s=#b47700/1 r=21 c=Mensaje emergente / Advertencia:Estado=Visible H6p5/3/5/12
- Textos: «No puedes crear tarjetas en días pasados.»
- Fuentes: N80R1|N80R1|N80R1|N80R1
- Interacciones: 
  - Ir · Mes y año: ON_CLICK → NODE/NAVIGATE 204:1442 «Mes y año · Tema Windgets claro» · sin transición
  - Ir · Calendario · Semana: ON_CLICK → NODE/NAVIGATE 204:1249 «Calendario · Semana · Tema Windgets claro» · sin transición
  - Día del mes: ON_CLICK → CONDITIONAL · sin transición
  - Ir · Panel del día: ON_CLICK → NODE/NAVIGATE 204:1316 «Panel del día · Tema Windgets claro» · sin transición
  - Mensaje emergente / Advertencia: AFTER_TIMEOUT 6s → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15000000596046448s EASE_OUT
  - Mensaje emergente / Advertencia: MOUSE_ENTER → NODE/CHANGE_TO 217:17659 «Estado=En pausa» · DISSOLVE 0.15000000596046448s EASE_OUT
  - Cerrar: ON_CLICK → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15000000596046448s EASE_OUT
- Colores fijos: #2b7a8c×5 Etiqueta; #b8692a×7 Etiqueta; #2e8b57×3 Etiqueta; #b04f7d×7 Etiqueta; #b47700×1 Mensaje emergente / Advertencia

### 3. Calendario · Nombre emergente · Mes anterior (2155:31312)
- Ids: claro 2155:31312 · oscuro 2156:1570 · Rosa 2156:1212 · Enfoque 2156:1391. Marco 1093x560.
- Estructura: base 204-805; +3 / ~0 / -0.
- Elementos (diff):
  - +Nombre emergente [F] @592,86 94x36
  - +Nombre emergente/Globo [F] @592,92 94x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @602,98 74x18 «Mes anterior» f=fondo Nunito Medium 13
- Textos: «Mes anterior»
- Fuentes: N82|N82|N82|N82
- Interacciones: 
  - Ir · Mes y año: ON_CLICK → NODE/NAVIGATE 204:1442 «Mes y año · Tema Windgets claro» · sin transición
  - Ir · Calendario · Semana: ON_CLICK → NODE/NAVIGATE 204:1249 «Calendario · Semana · Tema Windgets claro» · sin transición
  - Día del mes: ON_CLICK → CONDITIONAL · sin transición
  - Ir · Panel del día: ON_CLICK → NODE/NAVIGATE 204:1316 «Panel del día · Tema Windgets claro» · sin transición
- Colores fijos: #2b7a8c×5 Etiqueta; #b8692a×7 Etiqueta; #2e8b57×3 Etiqueta; #b04f7d×7 Etiqueta

### 4. Calendario · Nombre emergente · Mes siguiente (2155:31491)
- Ids: claro 2155:31491 · oscuro 2156:2107 · Rosa 2156:1749 · Enfoque 2156:1928. Marco 1093x560.
- Estructura: base 204-805; +3 / ~0 / -0.
- Elementos (diff):
  - +Nombre emergente [F] @626,86 102x36
  - +Nombre emergente/Globo [F] @626,92 102x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @636,98 82x18 «Mes siguiente» f=fondo Nunito Medium 13
- Textos: «Mes siguiente»
- Fuentes: N82|N82|N82|N82
- Interacciones: 
  - Ir · Mes y año: ON_CLICK → NODE/NAVIGATE 204:1442 «Mes y año · Tema Windgets claro» · sin transición
  - Ir · Calendario · Semana: ON_CLICK → NODE/NAVIGATE 204:1249 «Calendario · Semana · Tema Windgets claro» · sin transición
  - Día del mes: ON_CLICK → CONDITIONAL · sin transición
  - Ir · Panel del día: ON_CLICK → NODE/NAVIGATE 204:1316 «Panel del día · Tema Windgets claro» · sin transición
- Colores fijos: #2b7a8c×5 Etiqueta; #b8692a×7 Etiqueta; #2e8b57×3 Etiqueta; #b04f7d×7 Etiqueta

### 5. Calendario · Semana · Nombre emergente · Semana anterior (2155:31722)
- Ids: claro 2155:31722 · oscuro 2156:2624 · Rosa 2156:2286 · Enfoque 2156:2455. Marco 1093x560.
- Estructura: base 204-1249; +3 / ~0 / -0.
- Elementos (diff):
  - +Nombre emergente [F] @592,86 117x36
  - +Nombre emergente/Globo [F] @592,92 117x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @602,98 97x18 «Semana anterior» f=fondo Nunito Medium 13
- Textos: «Semana anterior»
- Fuentes: N62|N62|N62|N62
- Interacciones: 
  - Ir · Mes y año: ON_CLICK → NODE/NAVIGATE 204:1442 «Mes y año · Tema Windgets claro» · sin transición
  - Ir · Calendario: ON_CLICK → NODE/NAVIGATE 204:805 «Calendario · Tema Windgets claro» · sin transición
  - Ir · Panel del día: ON_CLICK → NODE/NAVIGATE 204:1316 «Panel del día · Tema Windgets claro» · sin transición
- Colores fijos: #b04f7d@0.20×9 Tarjeta · Actualizar el backlog; #b04f7d×9 Barra de etiqueta; #2b7a8c@0.20×3 Tarjeta · Responder correo del profesor; #2b7a8c×3 Barra de etiqueta; #b8692a@0.20×4 Tarjeta · Revisar calendario; #b8692a×4 Barra de etiqueta

### 6. Calendario · Semana · Nombre emergente · Semana siguiente (2155:31891)
- Ids: claro 2155:31891 · oscuro 2156:3131 · Rosa 2156:2793 · Enfoque 2156:2962. Marco 1093x560.
- Estructura: base 204-1249; +3 / ~0 / -0.
- Elementos (diff):
  - +Nombre emergente [F] @603,86 125x36
  - +Nombre emergente/Globo [F] @603,92 125x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @613,98 105x18 «Semana siguiente» f=fondo Nunito Medium 13
- Textos: «Semana siguiente»
- Fuentes: N62|N62|N62|N62
- Interacciones: 
  - Ir · Mes y año: ON_CLICK → NODE/NAVIGATE 204:1442 «Mes y año · Tema Windgets claro» · sin transición
  - Ir · Calendario: ON_CLICK → NODE/NAVIGATE 204:805 «Calendario · Tema Windgets claro» · sin transición
  - Ir · Panel del día: ON_CLICK → NODE/NAVIGATE 204:1316 «Panel del día · Tema Windgets claro» · sin transición
- Colores fijos: #b04f7d@0.20×9 Tarjeta · Actualizar el backlog; #b04f7d×9 Barra de etiqueta; #2b7a8c@0.20×3 Tarjeta · Responder correo del profesor; #2b7a8c×3 Barra de etiqueta; #b8692a@0.20×4 Tarjeta · Revisar calendario; #b8692a×4 Barra de etiqueta

### 7. Panel del día · Vacío (2155:32348)
- Ids: claro 2155:32348 · oscuro 2156:4238 · Rosa 2156:3822 · Enfoque 2156:4030. Marco 1093x560.
- Estructura: base 204-1316; +1 / ~3 / -32. Quita: /Panel del día/Ir · Detalle de tarjeta; /Panel del día/Ir · Detalle de tarjeta/Revisar los bocetos; /Panel del día/Ir · Detalle de tarjeta/Proyecto  ·  27 nov; /Panel del día/Ir · Detalle de tarjeta/Estado · completada; /Panel del día/Ir · Detalle de tarjeta#2; /Panel del día/Ir · Detalle de tarjeta/Preparar la entrega.
- Elementos (diff):
  - +Panel del día/Vacío · Día sin tarjetas [T] @757,184 200x19 «No tienes tarjetas para este día.» f=tinta Nunito Medium 14
  - ~Día del mes w:129→125
  - ~Día del mes w:129→125
  - ~Panel del día/24 txt:24→19
- Textos: «No tienes tarjetas para este día.»
- Fuentes: N100|N100|N100|N100
- Interacciones: 
  - Ir · Mes y año: ON_CLICK → NODE/NAVIGATE 204:1442 «Mes y año · Tema Windgets claro» · sin transición
  - Ir · Calendario: ON_CLICK → NODE/NAVIGATE 204:805 «Calendario · Tema Windgets claro» · sin transición
  - Ir · Calendario · Semana: ON_CLICK → NODE/NAVIGATE 204:1249 «Calendario · Semana · Tema Windgets claro» · sin transición
  - Día del mes: ON_CLICK → CONDITIONAL · sin transición
  - Ir · Nueva tarjeta: ON_CLICK → NODE/NAVIGATE 204:1915 «Nueva tarjeta · Tema Windgets claro» · sin transición
  - Ir · Detalle de tarjeta: ON_CLICK → NODE/NAVIGATE 204:1849 «Detalle de tarjeta · Tema Windgets claro» · sin transición
- Colores fijos: #2b7a8c×5 Etiqueta; #b8692a×7 Etiqueta; #2e8b57×3 Etiqueta; #b04f7d×7 Etiqueta

### 8. Mes y año · Escribir año (219:14757)
- Ids: claro 219:14757 · oscuro 233:16579 · Rosa 219:14788 · Enfoque 219:14819. Marco 360x364.
- Estructura: base 204-1442; +30 / ~0 / -182. Quita: /Planificador  ›  Calendario  ›  Mes y año; /Mes y año; /Sincronizado; /Ir · Mes y año; /Ir · Mes y año/Campo editable; /Selector segmentado · Mes / Semana.
- Elementos (diff):
  - +Elegir año [T] @16,14 82x25 «Elegir año» f=tinta Nunito Medium 18
  - +Año escrito [F] @16,52 328x36 f=superficie s=borde_campo/1.5 r=9
  - +Año escrito/2026 [T] @180,61 0x19 f=tinta Nunito Regular 14
  - +Escribe un año entre 1970 y 2100. [T] @16,98 201x18 «Escribe un año entre 1970 y 2100.» f=texto Nunito Regular 13
  - +Ir · Tecla 1 [F] @16,132 105x32 f=superficie s=linea/1 r=9
  - +Ir · Tecla 1/1 [T] @65,139 8x18 «1» f=tinta Nunito Medium 13
  - +Ir · Tecla 2 [F] @127,132 105x32 f=superficie s=linea/1 r=9
  - +Ir · Tecla 2/2 [T] @176,139 8x18 «2» f=tinta Nunito Medium 13
  - +Ir · Tecla 3 [F] @238,132 105x32 f=superficie s=linea/1 r=9
  - +Ir · Tecla 3/3 [T] @287,139 8x18 «3» f=tinta Nunito Medium 13
  - +Ir · Tecla 4 [F] @16,176 105x32 f=superficie s=linea/1 r=9
  - +Ir · Tecla 4/4 [T] @65,183 8x18 «4» f=tinta Nunito Medium 13
  - +Ir · Tecla 5 [F] @127,176 105x32 f=superficie s=linea/1 r=9
  - +Ir · Tecla 5/5 [T] @176,183 8x18 «5» f=tinta Nunito Medium 13
  - +Ir · Tecla 6 [F] @238,176 105x32 f=superficie s=linea/1 r=9
  - +Ir · Tecla 6/6 [T] @287,183 8x18 «6» f=tinta Nunito Medium 13
  - … 14 más en la huella
- Textos: «Elegir año» · «Escribe un año entre 1970 y 2100.» · «1» · «2» · «3» · «4» · «5» · «6» · «7» · «8» · «9» · «Borrar» · «0» · «Listo» · …
- Fuentes: N16|N16|Q16|S16
- Interacciones: 
  - Mes y año · Escribir año · Tema Windgets claro: ON_KEY_DOWN → CLOSE · sin transición
  - Ir · Tecla 1: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 2: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 3: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 4: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 5: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 6: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 7: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 8: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 9: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla Borrar: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla 0: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Tecla Listo: ON_CLICK → CONDITIONAL · sin transición
  - Ir · Cancelar: ON_CLICK → CLOSE · sin transición

### 9. Agenda diaria · Asignar bloque (217:15308)
- Ids: claro 217:15308 · oscuro 233:16180 · Rosa 217:15426 · Enfoque 217:15367. Marco 1093x560.
- Estructura: base 204-916; +0 / ~1 / -0.
- Elementos (diff):
  - ~Bloques horarios/Ir · Detalle de tarjeta fill:superficie→superficie_baja; stroke:linea→detalle; sw:1→2
- Fuentes: N42|N42|Q41N1|S41N1
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 10. Agenda diaria · Quitar bloque (217:15485)
- Ids: claro 217:15485 · oscuro 233:16240 · Rosa 217:15603 · Enfoque 217:15544. Marco 1093x560.
- Estructura: base 204-916; +2 / ~0 / -0.
- Elementos (diff):
  - +Ir · Agenda diaria [F] @565,211 158x32 r=9
  - +Ir · Agenda diaria/Quitar del bloque [T] @601,218 104x18 «Quitar del horario» f=tinta Nunito Medium 13
- Textos: «Quitar del horario»
- Fuentes: N43|N43|Q42N1|S42N1
- Interacciones: 
  - Ir · Agenda diaria: ON_CLICK → NODE/NAVIGATE 204:916 «Agenda diaria» · sin transición

### 11. Agenda diaria · Bloque pasado (217:15662)
- Ids: claro 217:15662 · oscuro 233:16302 · Rosa 217:15780 · Enfoque 217:15721. Marco 1093x560.
- Estructura: base 204-916; +1 / ~0 / -0.
- Elementos (diff):
  - +Bloque pasado [T] @628,165.5 95x19 «Bloque pasado» f=tinta Nunito Medium 14
- Textos: «Bloque pasado»
- Fuentes: N43|N43|Q42N1|S42N1
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 12. Agenda diaria · Sin tarjetas por programar (2152:30628)
- Ids: claro 2152:30628 · oscuro 2153:30603 · Rosa 2153:30443 · Enfoque 2153:30523. Marco 1093x560.
- Estructura: base 204-916; +1 / ~0 / -3. Quita: /Tarjetas sin horario/Ir · Detalle de tarjeta; /Tarjetas sin horario/Ir · Detalle de tarjeta/Validar el contraste; /Tarjetas sin horario/Ir · Detalle de tarjeta/Proyecto  ·  27 nov.
- Elementos (diff):
  - +Tarjetas sin horario/No hay tarjetas para hoy. [T] @770,205 283x19 «No tienes tarjetas pendientes por programar.» f=tinta Nunito Medium 14
- Textos: «No tienes tarjetas pendientes por programar.»
- Fuentes: N43|N43|N43|N43
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 4)

### 13. Agenda diaria · Aviso al soltar · No puedes asignar tarjetas a un bloque h… (2152:31011)
- Ids: claro 2152:31011 · oscuro 2153:31383 · Rosa 2153:31223 · Enfoque 2153:31303. Marco 1093x560.
- Estructura: base 204-916; +1 / ~0 / -1. Quita: /Sincronizado.
- Elementos (diff):
  - +Mensaje emergente / Advertencia [I] @636,4 433x42 «No puedes asignar tarjetas a un bloque horario que ya pasó.» f=superficie_alta s=#b47700/1 r=21 c=Mensaje emergente / Advertencia:Estado=Visible H6p5/3/5/12
- Textos: «No puedes asignar tarjetas a un bloque horario que ya pasó.»
- Fuentes: N41R1|N41R1|N41R1|N41R1
- Interacciones: 
  - Mensaje emergente / Advertencia: AFTER_TIMEOUT 6s → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT
  - Mensaje emergente / Advertencia: MOUSE_ENTER → NODE/CHANGE_TO 217:17659 «Estado=En pausa» · DISSOLVE 0.15s EASE_OUT
  - Cerrar: ON_CLICK → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT

### 14. Agenda diaria · Aviso al soltar · No puedes programar la tarjeta después d… (2152:31150)
- Ids: claro 2152:31150 · oscuro 2153:31623 · Rosa 2153:31463 · Enfoque 2153:31543. Marco 1093x560.
- Estructura: base 204-916; +1 / ~0 / -1. Quita: /Sincronizado.
- Elementos (diff):
  - +Mensaje emergente / Advertencia [I] @641,4 428x42 «No puedes programar la tarjeta después de su fecha límite.» f=superficie_alta s=#b47700/1 r=21 c=Mensaje emergente / Advertencia:Estado=Visible H6p5/3/5/12
- Textos: «No puedes programar la tarjeta después de su fecha límite.»
- Fuentes: N41R1|N41R1|N41R1|N41R1
- Interacciones: 
  - Mensaje emergente / Advertencia: AFTER_TIMEOUT 6s → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT
  - Mensaje emergente / Advertencia: MOUSE_ENTER → NODE/CHANGE_TO 217:17659 «Estado=En pausa» · DISSOLVE 0.15s EASE_OUT
  - Cerrar: ON_CLICK → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT

### 15. Agenda diaria · Nombre emergente · Elegir un día (2152:31289)
- Ids: claro 2152:31289 · oscuro 2153:31871 · Rosa 2153:31703 · Enfoque 2153:31787. Marco 1093x560.
- Estructura: base 204-916; +3 / ~0 / -0.
- Elementos (diff):
  - +Nombre emergente [F] @975,86 94x36
  - +Nombre emergente/Globo [F] @975,92 94x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @985,98 74x18 «Elegir un día» f=fondo Nunito Medium 13
- Textos: «Elegir un día»
- Fuentes: N43|N43|N43|N43
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 4)

### 16. Reportes · Vacío (217:16271)
- Ids: claro 217:16271 · oscuro 233:16363 · Rosa 217:16357 · Enfoque 217:16314. Marco 1093x560.
- Estructura: base 204-1005; +3 / ~0 / -21. Quita: /Tarjetas completadas/Gráfica de líneas · Completadas por día; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 2.
- Elementos (diff):
  - +Tarjetas completadas/Aún no hay datos en este rango. [T] @216,174 342x19 «No hay datos para este rango de fechas y estos filtros.» f=tinta Nunito Medium 14
  - +Cumplimiento/Aún no hay datos en este rango. [T] @758,161 295x38 «No hay datos para este rango de fechas y estos filtros.» f=tinta Nunito Medium 14
  - +Cumplimiento por estado/Aún no hay datos en este rango. [T] @214,353 342x19 «No hay datos para este rango de fechas y estos filtros.» f=tinta Nunito Medium 14
- Textos: «No hay datos para este rango de fechas y estos filtros.» · «No hay datos para este rango de fechas y estos filtros.» · «No hay datos para este rango de fechas y estos filtros.»
- Fuentes: N12|N12|Q12|S12
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 17. Reportes · Cargando (217:16400)
- Ids: claro 217:16400 · oscuro 233:16409 · Rosa 217:16486 · Enfoque 217:16443. Marco 1093x560.
- Estructura: base 204-1005; +3 / ~0 / -21. Quita: /Tarjetas completadas/Gráfica de líneas · Completadas por día; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 2.
- Elementos (diff):
  - +Tarjetas completadas/linea [R] @312,178 291.5x14 f=linea r=6
  - +Cumplimiento/linea [R] @757,162 168.5x14 f=linea r=6
  - +Cumplimiento por estado/linea [R] @215,354 469x14 f=linea r=6
- Fuentes: N9|N9|Q9|S9
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 18. Reportes · Error (217:16529)
- Ids: claro 217:16529 · oscuro 233:16455 · Rosa 217:16615 · Enfoque 217:16572. Marco 1093x560.
- Estructura: base 204-1005; +3 / ~0 / -21. Quita: /Tarjetas completadas/Gráfica de líneas · Completadas por día; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 2.
- Elementos (diff):
  - +Tarjetas completadas/No se pudo cargar el reporte. [T] @216,174 185x19 «No se pudo cargar el reporte.» f=tinta Nunito Medium 14
  - +Cumplimiento/No se pudo cargar el reporte. [T] @758,161 185x19 «No se pudo cargar el reporte.» f=tinta Nunito Medium 14
  - +Cumplimiento por estado/No se pudo cargar el reporte. [T] @214,353 185x19 «No se pudo cargar el reporte.» f=tinta Nunito Medium 14
- Textos: «No se pudo cargar el reporte.» · «No se pudo cargar el reporte.» · «No se pudo cargar el reporte.»
- Fuentes: N12|N12|Q12|S12
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 19. Reportes · Sin conexión (217:16658)
- Ids: claro 217:16658 · oscuro 233:16501 · Rosa 217:16744 · Enfoque 217:16701. Marco 1093x560.
- Estructura: base 204-1005; +3 / ~0 / -21. Quita: /Tarjetas completadas/Gráfica de líneas · Completadas por día; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 1; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 2.
- Elementos (diff):
  - +Tarjetas completadas/Sin conexión [T] @216,174 80x19 «Sin conexión» f=tinta Nunito Medium 14
  - +Cumplimiento/Sin conexión [T] @758,161 80x19 «Sin conexión» f=tinta Nunito Medium 14
  - +Cumplimiento por estado/Sin conexión [T] @214,353 80x19 «Sin conexión» f=tinta Nunito Medium 14
- Textos: «Sin conexión» · «Sin conexión» · «Sin conexión»
- Fuentes: N12|N12|Q12|S12
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 20. Reportes · Sin tarjetas (2161:32852)
- Ids: claro 2161:32852 · oscuro 2163:34272 · Rosa 2163:34092 · Enfoque 2163:34182. Marco 1093x560.
- Estructura: base 204-1005; +2 / ~0 / -27. Quita: /Tarjetas completadas; /Tarjetas completadas/Tarjetas completadas; /Tarjetas completadas/Gráfica de líneas · Completadas por día; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Eje · 0; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Guía · 1.
- Elementos (diff):
  - +Sin tarjetas [F] @200,104 869x120 f=superficie s=linea/1 r=12
  - +Sin tarjetas/Mensaje · Sin tarjetas [T] @216,155 456x19 «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.» f=tinta Nunito Medium 14
- Textos: «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.»
- Fuentes: N26|N26|N26|N26
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 21. Reportes · Rango recortado (2161:32950)
- Ids: claro 2161:32950 · oscuro 2163:34536 · Rosa 2163:34362 · Enfoque 2163:34449. Marco 1093x584.
- Estructura: base 204-1005; +1 / ~28 / -0.
- Elementos (diff):
  - +Nota · Rango recortado [T] @200,100 428x18 «Mostrando datos desde el 12 oct 2026, cuando creaste tu primera tarjeta.» f=texto Nunito Regular 13
  - ~Ir · Rango de fechas/Campo editable w:172→187; txt:Últimos 30 días→Últimos 12 meses
  - ~Tarjetas completadas y:104→128
  - ~Tarjetas completadas/Tarjetas completadas y:118→142
  - ~Tarjetas completadas/Gráfica de líneas · Completadas por día y:144→168
  - ~Gráfica de líneas · Completadas por día/Guía · 0 y:228→252
  - ~Gráfica de líneas · Completadas por día/Eje · 0 y:220→244
  - ~Gráfica de líneas · Completadas por día/Guía · 1 y:190→214
  - ~Gráfica de líneas · Completadas por día/Eje · 1 y:182→206
  - ~Gráfica de líneas · Completadas por día/Guía · 2 y:152→176
  - ~Gráfica de líneas · Completadas por día/Eje · 2 y:144→168
  - ~Gráfica de líneas · Completadas por día/Día · 26 oct y:240→264; txt:26 oct→12 oct
  - ~Gráfica de líneas · Completadas por día/Día · 2 nov y:240→264; w:30→34; txt:2 nov→26 oct
  - ~Gráfica de líneas · Completadas por día/Día · 9 nov y:240→264
  - ~Gráfica de líneas · Completadas por día/Día · 16 nov y:240→264
  - ~Gráfica de líneas · Completadas por día/Día · 24 nov y:240→264
  - … 13 más en la huella
- Textos: «Mostrando datos desde el 12 oct 2026, cuando creaste tu primera tarjeta.»
- Fuentes: N26|N26|N26|N26
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 22. Reportes · Rango personalizado (219:57179)
- Ids: claro 219:57179 · oscuro 233:16610 · Rosa 219:57330 · Enfoque 219:57481. Marco 397x216.
- Estructura: base 204-1005; +12 / ~0 / -36. Quita: /Planificador  ›  Reportes; /Reportes; /Sincronizado; /Ir · Rango de fechas; /Ir · Rango de fechas/Campo editable; /Ir · Filtrar etiquetas.
- Elementos (diff):
  - +Rango personalizado [T] @15,13 192x23 «Rango personalizado» f=tinta Rubik Medium 19
  - +Desde [T] @15,58 35x14 «Desde» f=texto Rubik Regular 12
  - +Hasta [T] @206,58 33x14 «Hasta» f=texto Rubik Regular 12
  - +Ir · Desde [F] @15,78 133x36 r=7
  - +Ir · Desde/Campo editable [I] @15,78 133x36 «01/11/2026» f=superficie s=borde_campo/1.5 r=9 c=Campo editable:Estado=Normal H8p0/12/0/12
  - +Ir · Hasta [F] @206,78 135x36 r=7
  - +Ir · Hasta/Campo editable [I] @206,78 135x36 «24/11/2026» f=superficie s=borde_campo/1.5 r=9 c=Campo editable:Estado=Normal H8p0/12/0/12
  - +  [T] @16,129 0x14 f=error Rubik Regular 12
  - +Ir · Cancelar [F] @166,165 95x36 r=7
  - +Ir · Cancelar/Botón [I] @166,165 95x36 «Cancelar» f=superficie s=borde/1.5 r=9 c=Botón:Nivel=Secundario, Tamaño=Normal, Estado=Normal H8p0/16/0/16
  - +Ir · Aplicar [F] @299,165 83x36 r=7
  - +Ir · Aplicar/Botón [I] @299,165 83x36 «Aplicar» f=accion s=borde/1.5 r=9 c=Botón:Nivel=Principal, Tamaño=Normal, Estado=Normal sh=3,5,0,0 H8p0/16/0/16
- Textos: «Rango personalizado» · «Desde» · «Hasta» · «01/11/2026» · «24/11/2026» · «Cancelar» · «Aplicar»
- Fuentes: R8|R8|R8|R8
- Interacciones: 
  - Reportes · Rango personalizado · Tema Windgets claro: ON_KEY_DOWN → CLOSE · sin transición
  - Ir · Desde: ON_CLICK → NODE/OVERLAY 219:57192 «Reportes · Elegir Desde» · sin transición
  - Ir · Hasta: ON_CLICK → NODE/OVERLAY 219:57261 «Reportes · Elegir Hasta» · sin transición
  - Ir · Cancelar: ON_CLICK → CLOSE · sin transición
  - Ir · Aplicar: ON_CLICK → CONDITIONAL · sin transición

### 23. Reportes · Elegir Desde (219:57192)
- Ids: claro 219:57192 · oscuro 233:16623 · Rosa 219:57343 · Enfoque 219:57494. Marco 352x301.
- Estructura: base 219-57179; +68 / ~0 / -12. Quita: /Rango personalizado; /Desde; /Hasta; /Ir · Desde; /Ir · Desde/Campo editable; /Ir · Hasta.
- Elementos (diff):
  - +Desde · Noviembre 2026 [T] @12,12 200x20 «Desde · Noviembre 2026» f=tinta Rubik Medium 17
  - +L [T] @20,48 7x14 «L» f=texto Rubik Regular 12
  - +M [T] @67,48 10x14 «M» f=texto Rubik Regular 12
  - +X [T] @114,48 8x14 «X» f=texto Rubik Regular 12
  - +J [T] @161,48 8x14 «J» f=texto Rubik Regular 12
  - +V [T] @208,48 8x14 «V» f=texto Rubik Regular 12
  - +S [T] @255,48 8x14 «S» f=texto Rubik Regular 12
  - +D [T] @302,48 9x14 «D» f=texto Rubik Regular 12
  - +Ir · Día 1 [F] @291,72 41x32 f=seleccion s=seleccion/1 r=9
  - +Ir · Día 1/1 [T] @308,81 7x15 «1» f=sobre_seleccion Rubik Medium 13
  - +Ir · Día 2 [F] @9,107 41x32 f=superficie s=linea/1 r=9
  - +Ir · Día 2/2 [T] @25,116 9x15 «2» f=tinta Rubik Medium 13
  - +Ir · Día 3 [F] @56,107 41x32 f=superficie s=linea/1 r=9
  - +Ir · Día 3/3 [T] @72,116 9x15 «3» f=tinta Rubik Medium 13
  - +Ir · Día 4 [F] @103,107 41x32 f=superficie s=linea/1 r=9
  - +Ir · Día 4/4 [T] @119,116 9x15 «4» f=tinta Rubik Medium 13
  - … 52 más en la huella
- Textos: «Desde · Noviembre 2026» · «L» · «M» · «X» · «J» · «V» · «S» · «D» · «1» · «2» · «3» · «4» · «5» · «6» · …
- Fuentes: R38|R38|R38|R38
- Interacciones: 
  - Reportes · Elegir Desde · Tema Windgets claro: ON_KEY_DOWN → CLOSE · sin transición
  - Ir · Día 1: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 1: ON_CLICK → CLOSE · sin transición
  - Ir · Día 2: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 2: ON_CLICK → CLOSE · sin transición
  - Ir · Día 3: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 3: ON_CLICK → CLOSE · sin transición
  - Ir · Día 4: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 4: ON_CLICK → CLOSE · sin transición
  - Ir · Día 5: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 5: ON_CLICK → CLOSE · sin transición
  - Ir · Día 6: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 6: ON_CLICK → CLOSE · sin transición
  - Ir · Día 7: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 7: ON_CLICK → CLOSE · sin transición
  - Ir · Día 8: ON_CLICK → SET_VARIABLE · sin transición

### 24. Reportes · Elegir Hasta (219:57261)
- Ids: claro 219:57261 · oscuro 2129:51350 · Rosa 2129:51002 · Enfoque 2129:51176. Marco 352x301.
- Estructura: base 219-57192; +1 / ~4 / -1. Quita: /Desde · Noviembre 2026.
- Elementos (diff):
  - +Hasta · Noviembre 2026 [T] @12,12 197x20 «Hasta · Noviembre 2026» f=tinta Rubik Medium 17
  - ~Ir · Día 1 fill:seleccion→superficie; stroke:seleccion→linea
  - ~Ir · Día 1/1 fill:sobre_seleccion→tinta
  - ~Ir · Día 24 fill:superficie→seleccion; stroke:linea→seleccion
  - ~Ir · Día 24/24 fill:tinta→sobre_seleccion
- Textos: «Hasta · Noviembre 2026»
- Fuentes: R38|R38|R38|R38
- Interacciones: 
  - Reportes · Elegir Hasta · Tema Windgets claro: ON_KEY_DOWN → CLOSE · sin transición

### 25. Reportes · Elegir Desde · debajo de su campo (2129:50723)
- Ids: claro 2129:50723 · oscuro 2129:51245 · Rosa 2129:50897 · Enfoque 2129:51071. Marco 397x419.
- Estructura: base 219-57179; +82 / ~0 / -12. Quita: /Rango personalizado; /Desde; /Hasta; /Ir · Desde; /Ir · Desde/Campo editable; /Ir · Hasta.
- Elementos (diff):
  - +Reportes · Rango personalizado · Tema Windgets claro [F] @0,0 397x216 f=superficie s=linea/1 r=10
  - +Reportes · Rango personalizado · Tema Windgets claro/Rango personalizado [T] @15,13 192x23 «Rango personalizado» f=tinta Rubik Medium 19
  - +Reportes · Rango personalizado · Tema Windgets claro/Desde [T] @15,58 35x14 «Desde» f=texto Rubik Regular 12
  - +Reportes · Rango personalizado · Tema Windgets claro/Hasta [T] @206,58 33x14 «Hasta» f=texto Rubik Regular 12
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Desde [F] @15,78 133x36 r=7
  - +Ir · Desde/Campo editable [I] @15,78 133x36 «01/11/2026» f=superficie s=borde_campo/1.5 r=9 c=Campo editable:Estado=Normal H8p0/12/0/12
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Hasta [F] @206,78 135x36 r=7
  - +Ir · Hasta/Campo editable [I] @206,78 135x36 «24/11/2026» f=superficie s=borde_campo/1.5 r=9 c=Campo editable:Estado=Normal H8p0/12/0/12
  - +Reportes · Rango personalizado · Tema Windgets claro/  [T] @16,129 0x14 f=error Rubik Regular 12
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Cancelar [F] @166,165 95x36 r=7
  - +Ir · Cancelar/Botón [I] @166,165 95x36 «Cancelar» f=superficie s=borde/1.5 r=9 c=Botón:Nivel=Secundario, Tamaño=Normal, Estado=Normal H8p0/16/0/16
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Aplicar [F] @299,165 83x36 r=7
  - +Ir · Aplicar/Botón [I] @299,165 83x36 «Aplicar» f=accion s=borde/1.5 r=9 c=Botón:Nivel=Principal, Tamaño=Normal, Estado=Normal sh=3,5,0,0 H8p0/16/0/16
  - +Reportes · Elegir Desde · Tema Windgets claro [F] @15,118 352x301 f=superficie s=linea/1 r=10
  - +Reportes · Elegir Desde · Tema Windgets claro/Desde · Noviembre 2026 [T] @27,130 200x20 «Desde · Noviembre 2026» f=tinta Rubik Medium 17
  - +Reportes · Elegir Desde · Tema Windgets claro/L [T] @35,166 7x14 «L» f=texto Rubik Regular 12
  - … 66 más en la huella
- Textos: «Rango personalizado» · «Desde» · «Hasta» · «01/11/2026» · «24/11/2026» · «Cancelar» · «Aplicar» · «Desde · Noviembre 2026» · «L» · «M» · «X» · «J» · «V» · «S» · …
- Fuentes: R46|R8|R8|R8
- Interacciones: 
  - Ir · Día 1: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 1: ON_CLICK → CLOSE · sin transición
  - Ir · Día 2: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 2: ON_CLICK → CLOSE · sin transición
  - Ir · Día 3: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 3: ON_CLICK → CLOSE · sin transición
  - Ir · Día 4: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 4: ON_CLICK → CLOSE · sin transición
  - Ir · Día 5: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 5: ON_CLICK → CLOSE · sin transición
  - Ir · Día 6: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 6: ON_CLICK → CLOSE · sin transición

### 26. Reportes · Elegir Hasta · debajo de su campo (2129:50810)
- Ids: claro 2129:50810 · oscuro 2129:51332 · Rosa 2129:50984 · Enfoque 2129:51158. Marco 558x419.
- Estructura: base 219-57179; +82 / ~0 / -12. Quita: /Rango personalizado; /Desde; /Hasta; /Ir · Desde; /Ir · Desde/Campo editable; /Ir · Hasta.
- Elementos (diff):
  - +Reportes · Rango personalizado · Tema Windgets claro [F] @0,0 397x216 f=superficie s=linea/1 r=10
  - +Reportes · Rango personalizado · Tema Windgets claro/Rango personalizado [T] @15,13 192x23 «Rango personalizado» f=tinta Rubik Medium 19
  - +Reportes · Rango personalizado · Tema Windgets claro/Desde [T] @15,58 35x14 «Desde» f=texto Rubik Regular 12
  - +Reportes · Rango personalizado · Tema Windgets claro/Hasta [T] @206,58 33x14 «Hasta» f=texto Rubik Regular 12
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Desde [F] @15,78 133x36 r=7
  - +Ir · Desde/Campo editable [I] @15,78 133x36 «01/11/2026» f=superficie s=borde_campo/1.5 r=9 c=Campo editable:Estado=Normal H8p0/12/0/12
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Hasta [F] @206,78 135x36 r=7
  - +Ir · Hasta/Campo editable [I] @206,78 135x36 «24/11/2026» f=superficie s=borde_campo/1.5 r=9 c=Campo editable:Estado=Normal H8p0/12/0/12
  - +Reportes · Rango personalizado · Tema Windgets claro/  [T] @16,129 0x14 f=error Rubik Regular 12
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Cancelar [F] @166,165 95x36 r=7
  - +Ir · Cancelar/Botón [I] @166,165 95x36 «Cancelar» f=superficie s=borde/1.5 r=9 c=Botón:Nivel=Secundario, Tamaño=Normal, Estado=Normal H8p0/16/0/16
  - +Reportes · Rango personalizado · Tema Windgets claro/Ir · Aplicar [F] @299,165 83x36 r=7
  - +Ir · Aplicar/Botón [I] @299,165 83x36 «Aplicar» f=accion s=borde/1.5 r=9 c=Botón:Nivel=Principal, Tamaño=Normal, Estado=Normal sh=3,5,0,0 H8p0/16/0/16
  - +Reportes · Elegir Hasta · Tema Windgets claro [F] @206,118 352x301 f=superficie s=linea/1 r=10
  - +Reportes · Elegir Hasta · Tema Windgets claro/Hasta · Noviembre 2026 [T] @218,130 197x20 «Hasta · Noviembre 2026» f=tinta Rubik Medium 17
  - +Reportes · Elegir Hasta · Tema Windgets claro/L [T] @226,166 7x14 «L» f=texto Rubik Regular 12
  - … 66 más en la huella
- Textos: «Rango personalizado» · «Desde» · «Hasta» · «01/11/2026» · «24/11/2026» · «Cancelar» · «Aplicar» · «Hasta · Noviembre 2026» · «L» · «M» · «X» · «J» · «V» · «S» · …
- Fuentes: R46|R46|R46|R46
- Interacciones: 
  - Ir · Día 1: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 1: ON_CLICK → CLOSE · sin transición
  - Ir · Día 2: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 2: ON_CLICK → CLOSE · sin transición
  - Ir · Día 3: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 3: ON_CLICK → CLOSE · sin transición
  - Ir · Día 4: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 4: ON_CLICK → CLOSE · sin transición
  - Ir · Día 5: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 5: ON_CLICK → CLOSE · sin transición
  - Ir · Día 6: ON_CLICK → SET_VARIABLE · sin transición
  - Ir · Día 6: ON_CLICK → CLOSE · sin transición

### 27. Reportes · Rango · Fecha de inicio posterior (2129:50160)
- Ids: claro 2129:50160 · oscuro 2129:50535 · Rosa 2129:50285 · Enfoque 2129:50410. Marco 397x216.
- Estructura: base 219-57179; +0 / ~3 / -0.
- Elementos (diff):
  - ~Ir · Desde/Campo editable w:133→136; txt:01/11/2026→24/11/2026; stroke:borde_campo→error; sw:1.5→2
  - ~Ir · Hasta/Campo editable w:135→133; txt:24/11/2026→01/11/2026
  - ~  x:16→15; y:129→120; w:0→319; txt:→La fecha de inicio no puede ser posterior a la fecha de fin.
- Fuentes: R8|R8|R8|R8
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 4)

### 28. Reportes · Rango · Campo obligatorio (2129:50191)
- Ids: claro 2129:50191 · oscuro 2129:50566 · Rosa 2129:50316 · Enfoque 2129:50441. Marco 397x216.
- Estructura: base 219-57179; +0 / ~2 / -0.
- Elementos (diff):
  - ~Ir · Hasta/Campo editable txt:24/11/2026→; stroke:borde_campo→error; sw:1.5→2
  - ~  x:16→206; y:129→120; w:0→147; txt:→Este campo es obligatorio.
- Fuentes: R8|R8|R8|R8
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 4)

### 29. Reportes · Rango · Rango mayor de un año (2129:50222)
- Ids: claro 2129:50222 · oscuro 2129:50597 · Rosa 2129:50347 · Enfoque 2129:50472. Marco 397x216.
- Estructura: base 219-57179; +0 / ~3 / -0.
- Elementos (diff):
  - ~Ir · Desde/Campo editable txt:01/11/2026→01/11/2025
  - ~Ir · Hasta/Campo editable stroke:borde_campo→error; sw:1.5→2
  - ~  x:16→206; y:129→120; w:0→170; txt:→El rango máximo es de un año.
- Fuentes: R8|R8|R8|R8
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 4)

### 30. Reportes · Rango · Fecha no válida (2129:50253)
- Ids: claro 2129:50253 · oscuro 2129:50628 · Rosa 2129:50378 · Enfoque 2129:50503. Marco 397x216.
- Estructura: base 219-57179; +0 / ~2 / -0.
- Elementos (diff):
  - ~Ir · Desde/Campo editable w:133→134; txt:01/11/2026→31/11/2026; stroke:borde_campo→error; sw:1.5→2
  - ~  x:16→15; y:129→120; w:0→152; txt:→Diligencia una fecha válida.
- Fuentes: R8|R8|R8|R8
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 4)

### 31. Reportes · Puntero encima de la gráfica (2160:1449)
- Ids: claro 2160:1449 · oscuro 2163:33346 · Rosa 2163:33162 · Enfoque 2163:33254. Marco 1093x560.
- Estructura: base 204-1005; +3 / ~0 / -0.
- Elementos (diff):
  - +Nombre emergente · 4 nov · 2 tarjetas completadas [F] @286,108 197x36
  - +Nombre emergente · 4 nov · 2 tarjetas completadas/Globo [F] @286,108 197x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @296,114 177x18 «4 nov · 2 tarjetas completadas» f=fondo Nunito Medium 13
- Textos: «4 nov · 2 tarjetas completadas»
- Fuentes: N26|N26|N26|N26
- Interacciones: ninguna propia (las de la base no se repiten)

### 32. Reportes · Estado elegido · Vencidas (2160:1603)
- Ids: claro 2160:1603 · oscuro 2163:33678 · Rosa 2163:33438 · Enfoque 2163:33558. Marco 1093x720.
- Estructura: base 204-1005; +9 / ~0 / -0.
- Elementos (diff):
  - +Cumplimiento por estado/Estado elegido [R] @360,434 149x26 f=seleccion r=6
  - +Lista · Vencidas [F] @200,500 869x140 f=superficie s=linea/1 r=12
  - +Lista · Vencidas/Vencidas [T] @216,514 61x20 «Vencidas» f=tinta Nunito Medium 15
  - +Lista · Vencidas/Ir · Detalle de tarjeta · Pagar el gimnasio [F] @216,544 837x34 f=superficie s=linea/1 r=9
  - +Ir · Detalle de tarjeta · Pagar el gimnasio/Revisar los bocetos [T] @228,546 105x16 «Pagar el gimnasio» f=tinta Nunito Medium 13
  - +Ir · Detalle de tarjeta · Pagar el gimnasio/Proyecto  ·  27 nov [T] @228,562 64x14 «22 nov 2026» f=texto Nunito Regular 11
  - +Lista · Vencidas/Ir · Detalle de tarjeta · Responder correo del profesor [F] @216,588 837x34 f=superficie s=linea/1 r=9
  - +Ir · Detalle de tarjeta · Responder correo del profesor/Revisar los bocetos [T] @228,590 178x16 «Responder correo del profesor» f=tinta Nunito Medium 13
  - +Ir · Detalle de tarjeta · Responder correo del profesor/Proyecto  ·  27 nov [T] @228,606 64x14 «23 nov 2026» f=texto Nunito Regular 11
- Textos: «Vencidas» · «Pagar el gimnasio» · «22 nov 2026» · «Responder correo del profesor» · «23 nov 2026»
- Fuentes: N38|N38|N38|N38
- Interacciones: ninguna propia (las de la base no se repiten)

### 33. Reportes · Rango cambiado · Estado sin tarjetas (2160:1785)
- Ids: claro 2160:1785 · oscuro 2163:33994 · Rosa 2163:33798 · Enfoque 2163:33896. Marco 1093x560.
- Estructura: base 204-1005; +13 / ~3 / -8. Quita: /Tarjetas completadas/Gráfica de líneas · Completadas por día/Día · 26 oct; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Día · 2 nov; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Día · 9 nov; /Tarjetas completadas/Gráfica de líneas · Completadas por día/Día · 16 nov; /Cumplimiento por estado/Anillo por estado · Dona/20; /Cumplimiento por estado/Completadas · 12 · 60 %.
- Elementos (diff):
  - +Gráfica de líneas · Completadas por día/Día · 18 nov [T] @234,240 38x16 «18 nov» f=texto Nunito Regular 12
  - +Gráfica de líneas · Completadas por día/Día · 19 nov [T] @297.5,240 38x16 «19 nov» f=texto Nunito Regular 12
  - +Gráfica de líneas · Completadas por día/Día · 20 nov [T] @376.5,240 38x16 «20 nov» f=texto Nunito Regular 12
  - +Gráfica de líneas · Completadas por día/Día · 21 nov [T] @455,240 38x16 «21 nov» f=texto Nunito Regular 12
  - +Gráfica de líneas · Completadas por día/Día · 22 nov [T] @533.5,240 38x16 «22 nov» f=texto Nunito Regular 12
  - +Gráfica de líneas · Completadas por día/Día · 23 nov [T] @612.5,240 38x16 «23 nov» f=texto Nunito Regular 12
  - +Anillo por estado · Dona/5 [T] @260,392 16x35 «5» f=tinta Nunito Bold 26
  - +Cumplimiento por estado/Completadas · 2 · 40 % [T] @386,386 136x18 «Completadas · 2 · 40 %» f=tinta Nunito Regular 13
  - +Cumplimiento por estado/Pendientes · 3 · 60 % [T] @386,412 123x18 «Pendientes · 3 · 60 %» f=tinta Nunito Regular 13
  - +Cumplimiento por estado/Vencidas · 0 · 0 % [T] @386,438 103x18 «Vencidas · 0 · 0 %» f=tinta Nunito Regular 13
  - +Nombre emergente · No hay tarjetas en este estado. [F] @415.5,460 201x36
  - +Nombre emergente · No hay tarjetas en este estado./Globo [F] @415.5,466 201x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @425.5,472 181x18 «No hay tarjetas en este estado.» f=fondo Nunito Medium 13
  - ~Ir · Rango de fechas/Campo editable w:172→164; txt:Últimos 30 días→Últimos 7 días
  - ~Cumplimiento/83 % txt:83,3 %→50,0 %
  - ~Cumplimiento/10 de 12 a tiempo w:250→233; txt:10 de 12 tarjetas completadas a tiempo→1 de 2 tarjetas completadas a tiempo
- Textos: «18 nov» · «19 nov» · «20 nov» · «21 nov» · «22 nov» · «23 nov» · «5» · «Completadas · 2 · 40 %» · «Pendientes · 3 · 60 %» · «Vencidas · 0 · 0 %» · «No hay tarjetas en este estado.»
- Fuentes: N28|N28|N28|N28
- Interacciones: ninguna propia (las de la base no se repiten)

### 34. Reportes · Filtro de etiquetas abierto (2161:33045)
- Ids: claro 2161:33045 · oscuro 2163:34875 · Rosa 2163:34623 · Enfoque 2163:34749. Marco 1093x560.
- Estructura: base 204-1005; +17 / ~0 / -0.
- Elementos (diff):
  - +Lista de etiquetas · Filtro [F] @689,88 248x148 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas · Filtro/Fila · Todas las etiquetas [F] @689,92 248x28
  - +Fila · Todas las etiquetas/Todas las etiquetas [T] @701,97 113x16 «Todas las etiquetas» f=tinta Nunito Regular 13
  - +Fila · Todas las etiquetas/Casilla [R] @905,98 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Todas las etiquetas/✓ [T] @908,98 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas · Filtro/Fila · Proyecto [F] @689,120 248x28
  - +Fila · Proyecto/Proyecto [T] @719,125 52x16 «Proyecto» f=tinta Nunito Regular 13
  - +Fila · Proyecto/Casilla [R] @905,126 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas · Filtro/Fila · Universidad [F] @689,148 248x28
  - +Fila · Universidad/Universidad [T] @719,153 70x16 «Universidad» f=tinta Nunito Regular 13
  - +Fila · Universidad/Casilla [R] @905,154 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas · Filtro/Fila · Personal [F] @689,176 248x28
  - +Fila · Personal/Personal [T] @719,181 52x16 «Personal» f=tinta Nunito Regular 13
  - +Fila · Personal/Casilla [R] @905,182 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas · Filtro/Fila · Salud [F] @689,204 248x28
  - +Fila · Salud/Salud [T] @719,209 34x16 «Salud» f=tinta Nunito Regular 13
  - … 1 más en la huella
- Textos: «Todas las etiquetas» · «✓» · «Proyecto» · «Universidad» · «Personal» · «Salud»
- Fuentes: N37|N37|N37|N37
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 35. Reportes · Filtro de etiquetas · Máximo (2161:33171)
- Ids: claro 2161:33171 · oscuro 2163:35259 · Rosa 2163:35001 · Enfoque 2163:35130. Marco 1093x560.
- Estructura: base 204-1005; +20 / ~0 / -0.
- Elementos (diff):
  - +Lista de etiquetas · Filtro [F] @689,88 248x178 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas · Filtro/Fila · Todas las etiquetas [F] @689,92 248x28
  - +Fila · Todas las etiquetas/Todas las etiquetas [T] @701,97 113x16 «Todas las etiquetas» f=tinta Nunito Regular 13
  - +Fila · Todas las etiquetas/Casilla [R] @905,98 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas · Filtro/Fila · Proyecto [F] @689,120 248x28
  - +Fila · Proyecto/Proyecto [T] @719,125 52x16 «Proyecto» f=tinta Nunito Regular 13
  - +Fila · Proyecto/Casilla [R] @905,126 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Proyecto/✓ [T] @908,126 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas · Filtro/Fila · Universidad [F] @689,148 248x28
  - +Fila · Universidad/Universidad [T] @719,153 70x16 «Universidad» f=tinta Nunito Regular 13
  - +Fila · Universidad/Casilla [R] @905,154 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Universidad/✓ [T] @908,154 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas · Filtro/Fila · Personal [F] @689,176 248x28
  - +Fila · Personal/Personal [T] @719,181 52x16 «Personal» f=tinta Nunito Regular 13
  - +Fila · Personal/Casilla [R] @905,182 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Personal/✓ [T] @908,182 10x16 «✓» f=superficie Nunito Regular 12
  - … 4 más en la huella
- Textos: «Todas las etiquetas» · «Proyecto» · «✓» · «Universidad» · «✓» · «Personal» · «✓» · «Salud» · «Puedes elegir hasta 3 etiquetas.»
- Fuentes: N40|N40|N40|N40
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 36. Reportes · Filtro de etiquetas · Sin etiquetas (2161:33300)
- Ids: claro 2161:33300 · oscuro 2163:35600 · Rosa 2163:35388 · Enfoque 2163:35494. Marco 1093x560.
- Estructura: base 204-1005; +2 / ~0 / -0.
- Elementos (diff):
  - +Lista de etiquetas · Filtro [F] @689,88 248x40 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas · Filtro/Aún no tienes etiquetas. [T] @701,100 131x16 «Aún no tienes etiquetas.» f=tinta Nunito Regular 12
- Textos: «Aún no tienes etiquetas.»
- Fuentes: N32|N32|N32|N32
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 37. Etiquetas · Vacío (217:17387)
- Ids: claro 217:17387 · oscuro 233:16547 · Rosa 217:17449 · Enfoque 217:17418. Marco 1093x560.
- Estructura: base 204-1078; +1 / ~0 / -56. Quita: /Proyecto; /Proyecto/#B04F7D; /Proyecto/Proyecto; /Proyecto/Ir · Editar etiqueta; /Proyecto/Ir · Editar etiqueta/Botón ícono; /Proyecto/Ir · M-10.
- Elementos (diff):
  - +Aún no hay etiquetas. [T] @210,120 382x19 «Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.» f=tinta Nunito Medium 14
- Textos: «Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.»
- Fuentes: N16|N16|Q16|S16
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

### 38. Etiquetas · Nombre emergente (2039:16540)
- Ids: claro 2039:16540 · oscuro 2039:16603 · Rosa 2039:16666 · Enfoque 2039:16729. Marco 1093x560.
- Estructura: base 204-1078; +3 / ~28 / -28. Quita: /Lectura; /Lectura/#6604E6; /Lectura/Lectura; /Lectura/Ir · Editar etiqueta; /Lectura/Ir · Editar etiqueta/Botón ícono; /Lectura/Ir · M-10.
- Elementos (diff):
  - +Nombre emergente [F] @959,86 110x36
  - +Nombre emergente/Globo [F] @959,92 110x30 f=tinta r=6 H0p6/10/6/10
  - +Globo/Texto [T] @969,98 90x18 «Nueva etiqueta» f=fondo Nunito Medium 13
  - ~Proyecto h:44→52
  - ~Proyecto/#B04F7D y:118→122
  - ~Proyecto/Proyecto y:115→119
  - ~Proyecto/Ir · Editar etiqueta y:110→113
  - ~Ir · Editar etiqueta/Botón ícono y:110→113
  - ~Proyecto/Ir · M-10 y:110→113
  - ~Ir · M-10/Botón ícono y:110→113
  - ~Universidad y:152→164; h:44→52
  - ~Universidad/#2B7A8C y:166→182
  - ~Universidad/Universidad y:163→179
  - ~Universidad/Ir · Editar etiqueta y:158→173
  - ~Ir · Editar etiqueta/Botón ícono y:158→173
  - ~Universidad/Ir · M-10 y:158→173
  - … 15 más en la huella
- Textos: «Nueva etiqueta»
- Fuentes: N8|N8|Q7N1|S7N1
- Interacciones: ninguna propia (las de la base no se repiten)

### 39. Etiquetas · Aviso · Máximo de etiquetas (2142:20564)
- Ids: claro 2142:20564 · oscuro 2142:21834 · Rosa 2142:23104 · Enfoque 2142:24374. Marco 1093x560.
- Estructura: base 204-1078; +1 / ~28 / -29. Quita: /Sincronizado; /Lectura; /Lectura/#6604E6; /Lectura/Lectura; /Lectura/Ir · Editar etiqueta; /Lectura/Ir · Editar etiqueta/Botón ícono.
- Elementos (diff):
  - +Mensaje emergente [I] @595,4 474x42 «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.» f=superficie_alta s=#b47700/1 r=21 c=Mensaje emergente / Advertencia:Estado=Visible H6p5/3/5/12
  - ~Proyecto h:44→52
  - ~Proyecto/#B04F7D y:118→122
  - ~Proyecto/Proyecto y:115→119
  - ~Proyecto/Ir · Editar etiqueta y:110→113
  - ~Ir · Editar etiqueta/Botón ícono y:110→113
  - ~Proyecto/Ir · M-10 y:110→113
  - ~Ir · M-10/Botón ícono y:110→113
  - ~Universidad y:152→164; h:44→52
  - ~Universidad/#2B7A8C y:166→182
  - ~Universidad/Universidad y:163→179
  - ~Universidad/Ir · Editar etiqueta y:158→173
  - ~Ir · Editar etiqueta/Botón ícono y:158→173
  - ~Universidad/Ir · M-10 y:158→173
  - ~Ir · M-10/Botón ícono y:158→173
  - ~Personal y:200→224; h:44→52
  - … 13 más en la huella
- Textos: «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.»
- Fuentes: N6R1|N6R1|Q6R1|S6R1
- Interacciones: 
  - Mensaje emergente: AFTER_TIMEOUT 6s → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT
  - Mensaje emergente: MOUSE_ENTER → NODE/CHANGE_TO 217:17659 «Estado=En pausa» · DISSOLVE 0.15s EASE_OUT
  - Cerrar: ON_CLICK → NODE/CHANGE_TO 217:17665 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT

### 40. Etiquetas · Aviso · Etiqueta inexistente (2142:20717)
- Ids: claro 2142:20717 · oscuro 2142:21987 · Rosa 2142:23257 · Enfoque 2142:24527. Marco 1093x560.
- Estructura: base 204-1078; +1 / ~28 / -29. Quita: /Sincronizado; /Lectura; /Lectura/#6604E6; /Lectura/Lectura; /Lectura/Ir · Editar etiqueta; /Lectura/Ir · Editar etiqueta/Botón ícono.
- Elementos (diff):
  - +Mensaje emergente [I] @837,4 232x42 «Esta etiqueta ya no existe.» f=superficie_alta s=#00d9e2/1 r=21 c=Mensaje emergente / Información:Estado=Visible H6p5/3/5/12
  - ~Proyecto h:44→52
  - ~Proyecto/#B04F7D y:118→122
  - ~Proyecto/Proyecto y:115→119
  - ~Proyecto/Ir · Editar etiqueta y:110→113
  - ~Ir · Editar etiqueta/Botón ícono y:110→113
  - ~Proyecto/Ir · M-10 y:110→113
  - ~Ir · M-10/Botón ícono y:110→113
  - ~Universidad y:152→164; h:44→52
  - ~Universidad/#2B7A8C y:166→182
  - ~Universidad/Universidad y:163→179
  - ~Universidad/Ir · Editar etiqueta y:158→173
  - ~Ir · Editar etiqueta/Botón ícono y:158→173
  - ~Universidad/Ir · M-10 y:158→173
  - ~Ir · M-10/Botón ícono y:158→173
  - ~Personal y:200→224; h:44→52
  - … 13 más en la huella
- Textos: «Esta etiqueta ya no existe.»
- Fuentes: N6R1|N6R1|Q6R1|S6R1
- Interacciones: 
  - Mensaje emergente: AFTER_TIMEOUT 4s → NODE/CHANGE_TO 217:17651 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT
  - Mensaje emergente: MOUSE_ENTER → NODE/CHANGE_TO 217:17645 «Estado=En pausa» · DISSOLVE 0.15s EASE_OUT
  - Cerrar: ON_CLICK → NODE/CHANGE_TO 217:17651 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT

### 41. Nueva etiqueta · Error · Obligatorio (2143:22996)
- Ids: claro 2143:22996 · oscuro 2144:24638 · Rosa 2143:25240 · Enfoque 2144:24514. Marco 1093x560.
- Estructura: base 204-2047; +1 / ~30 / -1. Quita: /Ventana · Nueva etiqueta/Etiqueta/Universidad.
- Elementos (diff):
  - +Ventana · Nueva etiqueta/Error [T] @361,226 141x16 «Este campo es obligatorio.» f=error Nunito Regular 12
  - ~Ventana · Nueva etiqueta y:123→104; h:314→352
  - ~Ventana · Nueva etiqueta/Nueva etiqueta y:145→126
  - ~Ventana · Nueva etiqueta/Etiqueta y:187→168
  - ~Ventana · Nueva etiqueta/Etiqueta y:207→188; stroke:borde_campo→error
  - ~Ventana · Nueva etiqueta/Color y:253→250
  - ~Ventana · Nueva etiqueta/Ir · Etiquetas y:377→396
  - ~Ir · Etiquetas/Botón y:377→396
  - ~Ventana · Nueva etiqueta/Ir · Etiquetas y:377→396
  - ~Ir · Etiquetas/Botón y:377→396
  - ~Ventana · Nueva etiqueta/Ir · Cerrar y:141→122
  - ~Ir · Cerrar/Botón ícono y:141→122
  - ~Ventana · Nueva etiqueta/Catálogo de colores y:273→270
  - ~Catálogo de colores/Color · Gris y:273→270
  - ~Color · Gris/Nombre del color y:278→275
  - ~Catálogo de colores/Color · Rojo y:273→270
  - … 15 más en la huella
- Textos: «Este campo es obligatorio.»
- Fuentes: N22|N22|Q22|N22
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 42. Nueva etiqueta · Error · Nombre largo (2143:23192)
- Ids: claro 2143:23192 · oscuro 2144:24886 · Rosa 2143:25436 · Enfoque 2144:24762. Marco 1093x560.
- Estructura: base 204-2047; +1 / ~31 / -0.
- Elementos (diff):
  - +Ventana · Nueva etiqueta/Error [T] @361,226 326x16 «El nombre de la etiqueta no puede superar los 30 caracteres.» f=error Nunito Regular 12
  - ~Ventana · Nueva etiqueta y:123→104; h:314→352
  - ~Ventana · Nueva etiqueta/Nueva etiqueta y:145→126
  - ~Ventana · Nueva etiqueta/Etiqueta y:187→168
  - ~Ventana · Nueva etiqueta/Etiqueta y:207→188; stroke:borde_campo→error
  - ~Etiqueta/Universidad y:215→196; w:75→218; txt:Universidad→Reuniones de seguimiento semana
  - ~Ventana · Nueva etiqueta/Color y:253→250
  - ~Ventana · Nueva etiqueta/Ir · Etiquetas y:377→396
  - ~Ir · Etiquetas/Botón y:377→396
  - ~Ventana · Nueva etiqueta/Ir · Etiquetas y:377→396
  - ~Ir · Etiquetas/Botón y:377→396
  - ~Ventana · Nueva etiqueta/Ir · Cerrar y:141→122
  - ~Ir · Cerrar/Botón ícono y:141→122
  - ~Ventana · Nueva etiqueta/Catálogo de colores y:273→270
  - ~Catálogo de colores/Color · Gris y:273→270
  - ~Color · Gris/Nombre del color y:278→275
  - … 16 más en la huella
- Textos: «El nombre de la etiqueta no puede superar los 30 caracteres.»
- Fuentes: N23|N23|Q23|N23
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 43. Nueva etiqueta · Error · Nombre repetido (2143:23388)
- Ids: claro 2143:23388 · oscuro 2144:25134 · Rosa 2143:25632 · Enfoque 2144:25010. Marco 1093x560.
- Estructura: base 204-2047; +1 / ~31 / -0.
- Elementos (diff):
  - +Ventana · Nueva etiqueta/Error [T] @361,226 209x16 «Ya existe una etiqueta con ese nombre.» f=error Nunito Regular 12
  - ~Ventana · Nueva etiqueta y:123→104; h:314→352
  - ~Ventana · Nueva etiqueta/Nueva etiqueta y:145→126
  - ~Ventana · Nueva etiqueta/Etiqueta y:187→168
  - ~Ventana · Nueva etiqueta/Etiqueta y:207→188; stroke:borde_campo→error
  - ~Etiqueta/Universidad y:215→196
  - ~Ventana · Nueva etiqueta/Color y:253→250
  - ~Ventana · Nueva etiqueta/Ir · Etiquetas y:377→396
  - ~Ir · Etiquetas/Botón y:377→396
  - ~Ventana · Nueva etiqueta/Ir · Etiquetas y:377→396
  - ~Ir · Etiquetas/Botón y:377→396
  - ~Ventana · Nueva etiqueta/Ir · Cerrar y:141→122
  - ~Ir · Cerrar/Botón ícono y:141→122
  - ~Ventana · Nueva etiqueta/Catálogo de colores y:273→270
  - ~Catálogo de colores/Color · Gris y:273→270
  - ~Color · Gris/Nombre del color y:278→275
  - … 16 más en la huella
- Textos: «Ya existe una etiqueta con ese nombre.»
- Fuentes: N23|N23|Q23|N23
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 44. Editar etiqueta · Error · Color no disponible (2143:24679)
- Ids: claro 2143:24679 · oscuro 2144:26786 · Rosa 2143:26923 · Enfoque 2144:26662. Marco 1093x560.
- Estructura: base 204-2095; +1 / ~31 / -0.
- Elementos (diff):
  - +Ventana · Editar etiqueta/Error [T] @361,350 230x16 «Este color ya no está disponible. Elige otro.» f=error Nunito Regular 12
  - ~Ventana · Editar etiqueta y:123→112; h:314→336
  - ~Ventana · Editar etiqueta/Editar etiqueta y:145→134
  - ~Ventana · Editar etiqueta/Etiqueta y:187→176
  - ~Ventana · Editar etiqueta/Etiqueta y:207→196
  - ~Etiqueta/Universidad y:215→204
  - ~Ventana · Editar etiqueta/Color y:253→242
  - ~Ventana · Editar etiqueta/Ir · Etiquetas y:377→388
  - ~Ir · Etiquetas/Botón y:377→388
  - ~Ventana · Editar etiqueta/Ir · Etiquetas y:377→388
  - ~Ir · Etiquetas/Botón y:377→388
  - ~Ventana · Editar etiqueta/Ir · Cerrar y:141→130
  - ~Ir · Cerrar/Botón ícono y:141→130
  - ~Ventana · Editar etiqueta/Catálogo de colores y:273→262
  - ~Catálogo de colores/Color · Gris y:273→262
  - ~Color · Gris/Nombre del color y:278→267
  - … 16 más en la huella
- Textos: «Este color ya no está disponible. Elige otro.»
- Fuentes: N23|N23|Q23|N23
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 45. Nueva columna · Error · Obligatorio (2143:23584)
- Ids: claro 2143:23584 · oscuro 2144:25492 · Rosa 2143:25828 · Enfoque 2144:25258. Marco 1093x560.
- Estructura: base 204-2143; +1 / ~30 / -1. Quita: /Ventana · Nueva columna/Columna/En revisión.
- Elementos (diff):
  - +Ventana · Nueva columna/Error [T] @361,226 141x16 «Este campo es obligatorio.» f=error Nunito Regular 12
  - ~Ventana · Nueva columna y:123→104; h:314→352
  - ~Ventana · Nueva columna/Nueva columna y:145→126
  - ~Ventana · Nueva columna/Columna y:187→168
  - ~Ventana · Nueva columna/Columna y:207→188; stroke:borde_campo→error
  - ~Ventana · Nueva columna/Color y:253→250
  - ~Ventana · Nueva columna/Ir · Tablero Kanban y:377→396
  - ~Ir · Tablero Kanban/Botón y:377→396
  - ~Ventana · Nueva columna/Ir · Tablero Kanban y:377→396
  - ~Ir · Tablero Kanban/Botón y:377→396
  - ~Ventana · Nueva columna/Ir · Cerrar y:141→122
  - ~Ir · Cerrar/Botón ícono y:141→122
  - ~Ventana · Nueva columna/Catálogo de colores y:273→270
  - ~Catálogo de colores/Color · Gris y:273→270
  - ~Color · Gris/Nombre del color y:278→275
  - ~Catálogo de colores/Color · Rojo y:273→270
  - … 15 más en la huella
- Textos: «Este campo es obligatorio.»
- Fuentes: N54|N54|Q54|N54
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 46. Nueva columna · Error · Nombre largo (2143:23949)
- Ids: claro 2143:23949 · oscuro 2144:25960 · Rosa 2143:26193 · Enfoque 2144:25726. Marco 1093x560.
- Estructura: base 204-2143; +1 / ~31 / -0.
- Elementos (diff):
  - +Ventana · Nueva columna/Error [T] @361,226 328x16 «El nombre de la columna no puede superar los 30 caracteres.» f=error Nunito Regular 12
  - ~Ventana · Nueva columna y:123→104; h:314→352
  - ~Ventana · Nueva columna/Nueva columna y:145→126
  - ~Ventana · Nueva columna/Columna y:187→168
  - ~Ventana · Nueva columna/Columna y:207→188; stroke:borde_campo→error
  - ~Columna/En revisión y:215→196; w:69→201; txt:En revisión→Entregas pendientes de revisión
  - ~Ventana · Nueva columna/Color y:253→250
  - ~Ventana · Nueva columna/Ir · Tablero Kanban y:377→396
  - ~Ir · Tablero Kanban/Botón y:377→396
  - ~Ventana · Nueva columna/Ir · Tablero Kanban y:377→396
  - ~Ir · Tablero Kanban/Botón y:377→396
  - ~Ventana · Nueva columna/Ir · Cerrar y:141→122
  - ~Ir · Cerrar/Botón ícono y:141→122
  - ~Ventana · Nueva columna/Catálogo de colores y:273→270
  - ~Catálogo de colores/Color · Gris y:273→270
  - ~Color · Gris/Nombre del color y:278→275
  - … 16 más en la huella
- Textos: «El nombre de la columna no puede superar los 30 caracteres.»
- Fuentes: N55|N55|Q55|N55
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 47. Nueva columna · Error · Nombre repetido (2143:24314)
- Ids: claro 2143:24314 · oscuro 2144:26428 · Rosa 2143:26558 · Enfoque 2144:26194. Marco 1093x560.
- Estructura: base 204-2143; +1 / ~31 / -0.
- Elementos (diff):
  - +Ventana · Nueva columna/Error [T] @361,226 211x16 «Ya existe una columna con ese nombre.» f=error Nunito Regular 12
  - ~Ventana · Nueva columna y:123→104; h:314→352
  - ~Ventana · Nueva columna/Nueva columna y:145→126
  - ~Ventana · Nueva columna/Columna y:187→168
  - ~Ventana · Nueva columna/Columna y:207→188; stroke:borde_campo→error
  - ~Columna/En revisión y:215→196
  - ~Ventana · Nueva columna/Color y:253→250
  - ~Ventana · Nueva columna/Ir · Tablero Kanban y:377→396
  - ~Ir · Tablero Kanban/Botón y:377→396
  - ~Ventana · Nueva columna/Ir · Tablero Kanban y:377→396
  - ~Ir · Tablero Kanban/Botón y:377→396
  - ~Ventana · Nueva columna/Ir · Cerrar y:141→122
  - ~Ir · Cerrar/Botón ícono y:141→122
  - ~Ventana · Nueva columna/Catálogo de colores y:273→270
  - ~Catálogo de colores/Color · Gris y:273→270
  - ~Color · Gris/Nombre del color y:278→275
  - … 16 más en la huella
- Textos: «Ya existe una columna con ese nombre.»
- Fuentes: N55|N55|Q55|N55
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 48. Editar columna · Error · Color no disponible (2143:24875)
- Ids: claro 2143:24875 · oscuro 2144:27144 · Rosa 2143:27119 · Enfoque 2144:26910. Marco 1093x560.
- Estructura: base 204-2191; +1 / ~31 / -0.
- Elementos (diff):
  - +Ventana · Editar columna/Error [T] @361,350 230x16 «Este color ya no está disponible. Elige otro.» f=error Nunito Regular 12
  - ~Ventana · Editar columna y:123→112; h:314→336
  - ~Ventana · Editar columna/Editar columna y:145→134
  - ~Ventana · Editar columna/Columna y:187→176
  - ~Ventana · Editar columna/Columna y:207→196
  - ~Columna/En revisión y:215→204
  - ~Ventana · Editar columna/Color y:253→242
  - ~Ventana · Editar columna/Ir · Tablero Kanban y:377→388
  - ~Ir · Tablero Kanban/Botón y:377→388
  - ~Ventana · Editar columna/Ir · Tablero Kanban y:377→388
  - ~Ir · Tablero Kanban/Botón y:377→388
  - ~Ventana · Editar columna/Ir · Cerrar y:141→130
  - ~Ir · Cerrar/Botón ícono y:141→130
  - ~Ventana · Editar columna/Catálogo de colores y:273→262
  - ~Catálogo de colores/Color · Gris y:273→262
  - ~Color · Gris/Nombre del color y:278→267
  - … 16 más en la huella
- Textos: «Este color ya no está disponible. Elige otro.»
- Fuentes: N55|N55|Q55|N55
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 49. Nueva tarjeta · Etiquetas abierta (2140:19720)
- Ids: claro 2140:19720 · oscuro 2140:21665 · Rosa 2140:20369 · Enfoque 2140:21017. Marco 1093x560.
- Estructura: base 204-1915; +17 / ~1 / -0.
- Elementos (diff):
  - +Etiquetas/Ficha · Universidad [F] @383,295 94x22 f=#2a6f8f@0.16 s=#2a6f8f/1 r=11 H6p0/8/0/8
  - +Ficha · Universidad/Universidad [T] @406,298 64x16 «Universidad» f=tinta Nunito Regular 12
  - +Ventana · Nueva tarjeta/Lista de etiquetas [F] @291,327 248x120 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas/Fila · Proyecto [F] @291,331 248x28
  - +Fila · Proyecto/Proyecto [T] @321,336 52x16 «Proyecto» f=tinta Nunito Regular 13
  - +Fila · Proyecto/Casilla [R] @507,337 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Proyecto/✓ [T] @510,337 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas/Fila · Universidad [F] @291,359 248x28
  - +Fila · Universidad/Universidad [T] @321,364 70x16 «Universidad» f=tinta Nunito Regular 13
  - +Fila · Universidad/Casilla [R] @507,365 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Universidad/✓ [T] @510,365 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas/Fila · Personal [F] @291,387 248x28
  - +Fila · Personal/Personal [T] @321,392 52x16 «Personal» f=tinta Nunito Regular 13
  - +Fila · Personal/Casilla [R] @507,393 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas/Fila · Salud [F] @291,415 248x28
  - +Fila · Salud/Salud [T] @321,420 34x16 «Salud» f=tinta Nunito Regular 13
  - … 2 más en la huella
- Textos: «Universidad» · «Proyecto» · «✓» · «Universidad» · «✓» · «Personal» · «Salud»
- Fuentes: N72|N72|Q72|S72
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 50. Nueva tarjeta · Etiquetas · Máximo (2140:19887)
- Ids: claro 2140:19887 · oscuro 2140:21832 · Rosa 2140:20536 · Enfoque 2140:21184. Marco 1093x560.
- Estructura: base 204-1915; +21 / ~3 / -0.
- Elementos (diff):
  - +Etiquetas/Ficha · Universidad [F] @383,295 94x22 f=#2a6f8f@0.16 s=#2a6f8f/1 r=11 H6p0/8/0/8
  - +Ficha · Universidad/Universidad [T] @406,298 64x16 «Universidad» f=tinta Nunito Regular 12
  - +Etiquetas/Ficha · Personal [F] @301,323 78x22 f=#b8692e@0.16 s=#b8692e/1 r=11 H6p0/8/0/8
  - +Ficha · Personal/Personal [T] @324,326 48x16 «Personal» f=tinta Nunito Regular 12
  - +Ventana · Nueva tarjeta/Lista de etiquetas [F] @291,355 248x146 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas/Fila · Proyecto [F] @291,359 248x28
  - +Fila · Proyecto/Proyecto [T] @321,364 52x16 «Proyecto» f=tinta Nunito Regular 13
  - +Fila · Proyecto/Casilla [R] @507,365 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Proyecto/✓ [T] @510,365 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas/Fila · Universidad [F] @291,387 248x28
  - +Fila · Universidad/Universidad [T] @321,392 70x16 «Universidad» f=tinta Nunito Regular 13
  - +Fila · Universidad/Casilla [R] @507,393 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Universidad/✓ [T] @510,393 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas/Fila · Personal [F] @291,415 248x28
  - +Fila · Personal/Personal [T] @321,420 52x16 «Personal» f=tinta Nunito Regular 13
  - +Fila · Personal/Casilla [R] @507,421 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - … 8 más en la huella
- Textos: «Universidad» · «Personal» · «Proyecto» · «✓» · «Universidad» · «✓» · «Personal» · «✓» · «Salud» · «Puedes asignar hasta 3 etiquetas.»
- Fuentes: N75|N75|Q75|S75
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 51. Nueva tarjeta · Etiquetas · Sin etiquetas (2140:20059)
- Ids: claro 2140:20059 · oscuro 2140:22004 · Rosa 2140:20708 · Enfoque 2140:21356. Marco 1093x560.
- Estructura: base 204-1915; +4 / ~0 / -2. Quita: /Ventana · Nueva tarjeta/Etiquetas/Ficha · Proyecto; /Ventana · Nueva tarjeta/Etiquetas/Ficha · Proyecto/Proyecto.
- Elementos (diff):
  - +Etiquetas/Proyecto   ·   Universidad [T] @299,297 94x19 «Elige etiquetas» f=tinta Nunito Regular 14
  - +Ventana · Nueva tarjeta/Lista de etiquetas [F] @291,327 248x88 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas/Aún no tienes etiquetas. [T] @303,339 141x16 «Aún no tienes etiquetas.» f=tinta Nunito Regular 13
  - +Lista de etiquetas/Botón [I] @303,367 131x36 «Nueva etiqueta» f=accion s=borde/1.5 r=9 c=Botón:Nivel=Principal, Tamaño=Normal, Estado=Normal sh=3,5,0,0 H8p0/16/0/16
- Textos: «Elige etiquetas» · «Aún no tienes etiquetas.» · «Nueva etiqueta»
- Fuentes: N67|N67|Q66N1|S66N1
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 52. Nueva tarjeta · Etiquetas · Sin elegir (2140:20210)
- Ids: claro 2140:20210 · oscuro 2140:22154 · Rosa 2140:20858 · Enfoque 2140:21506. Marco 1093x560.
- Estructura: base 204-1915; +14 / ~0 / -2. Quita: /Ventana · Nueva tarjeta/Etiquetas/Ficha · Proyecto; /Ventana · Nueva tarjeta/Etiquetas/Ficha · Proyecto/Proyecto.
- Elementos (diff):
  - +Etiquetas/Proyecto   ·   Universidad [T] @299,297 94x19 «Elige etiquetas» f=tinta Nunito Regular 14
  - +Ventana · Nueva tarjeta/Lista de etiquetas [F] @291,327 248x120 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas/Fila · Proyecto [F] @291,331 248x28
  - +Fila · Proyecto/Proyecto [T] @321,336 52x16 «Proyecto» f=tinta Nunito Regular 13
  - +Fila · Proyecto/Casilla [R] @507,337 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas/Fila · Universidad [F] @291,359 248x28
  - +Fila · Universidad/Universidad [T] @321,364 70x16 «Universidad» f=tinta Nunito Regular 13
  - +Fila · Universidad/Casilla [R] @507,365 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas/Fila · Personal [F] @291,387 248x28
  - +Fila · Personal/Personal [T] @321,392 52x16 «Personal» f=tinta Nunito Regular 13
  - +Fila · Personal/Casilla [R] @507,393 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas/Fila · Salud [F] @291,415 248x28
  - +Fila · Salud/Salud [T] @321,420 34x16 «Salud» f=tinta Nunito Regular 13
  - +Fila · Salud/Casilla [R] @507,421 16x16 s=borde_campo/1.5 r=4
- Textos: «Elige etiquetas» · «Proyecto» · «Universidad» · «Personal» · «Salud»
- Fuentes: N69|N69|Q69|S69
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 53. Nueva tarjeta · Fecha límite abierta (2148:26258)
- Ids: claro 2148:26258 · oscuro 2149:27218 · Rosa 2149:26898 · Enfoque 2149:27058. Marco 1093x560.
- Estructura: base 204-1915; +9 / ~1 / -0.
- Elementos (diff):
  - +Ventana · Nueva tarjeta/Selector de fecha [F] @291,261 317x195 f=superficie s=linea/1 r=8 sh=0,4,12,0
  - +Selector de fecha/Noviembre 2026 [T] @305,274 122x22 «Noviembre 2026» f=tinta Nunito Medium 16
  - +Selector de fecha/Mes · columna L [T] @303,311 36x133 «L ⏎  ⏎ 2 ⏎ 9 ⏎ 16 ⏎ 23 ⏎ 30» f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna M [T] @339,311 36x133 «M ⏎  ⏎ 3 ⏎ 10 ⏎ 17 ⏎ 24 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna X [T] @375,311 36x133 «X ⏎  ⏎ 4 ⏎ 11 ⏎ 18 ⏎ 25 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna J [T] @411,311 36x133 «J ⏎  ⏎ 5 ⏎ 12 ⏎ 19 ⏎ 26 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna V [T] @447,311 36x133 «V ⏎  ⏎ 6 ⏎ 13 ⏎ 20 ⏎ 27 ⏎  » mix 13
  - +Selector de fecha/Mes · columna S [T] @483,311 36x133 «S ⏎  ⏎ 7 ⏎ 14 ⏎ 21 ⏎ 28 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna D [T] @519,311 36x133 «D ⏎ 1 ⏎ 8 ⏎ 15 ⏎ 22 ⏎ 29 ⏎  » f=tinta Nunito Regular 13
  - ~Ventana · Nueva tarjeta/Fecha límite stroke:borde_campo→seleccion
- Textos: «Noviembre 2026» · «L ⏎  ⏎ 2 ⏎ 9 ⏎ 16 ⏎ 23 ⏎ 30» · «M ⏎  ⏎ 3 ⏎ 10 ⏎ 17 ⏎ 24 ⏎  » · «X ⏎  ⏎ 4 ⏎ 11 ⏎ 18 ⏎ 25 ⏎  » · «J ⏎  ⏎ 5 ⏎ 12 ⏎ 19 ⏎ 26 ⏎  » · «V ⏎  ⏎ 6 ⏎ 13 ⏎ 20 ⏎ 27 ⏎  » · «S ⏎  ⏎ 7 ⏎ 14 ⏎ 21 ⏎ 28 ⏎  » · «D ⏎ 1 ⏎ 8 ⏎ 15 ⏎ 22 ⏎ 29 ⏎  »
- Fuentes: N71m1|N71m1|N71m1|N71m1
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 54. Nueva tarjeta · Fecha del bloque abierta (2148:26418)
- Ids: claro 2148:26418 · oscuro 2149:27698 · Rosa 2149:27378 · Enfoque 2149:27538. Marco 1093x560.
- Estructura: base 204-1915; +9 / ~1 / -0.
- Elementos (diff):
  - +Ventana · Nueva tarjeta/Selector de fecha [F] @291,174 317x195 f=superficie s=linea/1 r=8 sh=0,4,12,0
  - +Selector de fecha/Noviembre 2026 [T] @305,187 122x22 «Noviembre 2026» f=tinta Nunito Medium 16
  - +Selector de fecha/Mes · columna L [T] @303,224 36x133 «L ⏎  ⏎ 2 ⏎ 9 ⏎ 16 ⏎ 23 ⏎ 30» f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna M [T] @339,224 36x133 «M ⏎  ⏎ 3 ⏎ 10 ⏎ 17 ⏎ 24 ⏎  » mix 13
  - +Selector de fecha/Mes · columna X [T] @375,224 36x133 «X ⏎  ⏎ 4 ⏎ 11 ⏎ 18 ⏎ 25 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna J [T] @411,224 36x133 «J ⏎  ⏎ 5 ⏎ 12 ⏎ 19 ⏎ 26 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna V [T] @447,224 36x133 «V ⏎  ⏎ 6 ⏎ 13 ⏎ 20 ⏎ 27 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna S [T] @483,224 36x133 «S ⏎  ⏎ 7 ⏎ 14 ⏎ 21 ⏎ 28 ⏎  » f=tinta Nunito Regular 13
  - +Selector de fecha/Mes · columna D [T] @519,224 36x133 «D ⏎ 1 ⏎ 8 ⏎ 15 ⏎ 22 ⏎ 29 ⏎  » f=tinta Nunito Regular 13
  - ~Ventana · Nueva tarjeta/Fecha del bloque stroke:borde_campo→seleccion
- Textos: «Noviembre 2026» · «L ⏎  ⏎ 2 ⏎ 9 ⏎ 16 ⏎ 23 ⏎ 30» · «M ⏎  ⏎ 3 ⏎ 10 ⏎ 17 ⏎ 24 ⏎  » · «X ⏎  ⏎ 4 ⏎ 11 ⏎ 18 ⏎ 25 ⏎  » · «J ⏎  ⏎ 5 ⏎ 12 ⏎ 19 ⏎ 26 ⏎  » · «V ⏎  ⏎ 6 ⏎ 13 ⏎ 20 ⏎ 27 ⏎  » · «S ⏎  ⏎ 7 ⏎ 14 ⏎ 21 ⏎ 28 ⏎  » · «D ⏎ 1 ⏎ 8 ⏎ 15 ⏎ 22 ⏎ 29 ⏎  »
- Fuentes: N71m1|N71m1|N71m1|N71m1
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 55. Nueva tarjeta · Hora del bloque abierta (2148:26578)
- Ids: claro 2148:26578 · oscuro 2149:28180 · Rosa 2149:27858 · Enfoque 2149:28019. Marco 1093x560.
- Estructura: base 204-1915; +17 / ~1 / -0.
- Elementos (diff):
  - +Ventana · Nueva tarjeta/Lista de horas [F] @419,119 172x250 f=superficie s=borde/1 r=8 sh=0,4,12,0 V0p4/0/4/0
  - +Lista de horas/Opción · Sin bloque horario [F] @420,124 170x30 H0p6/12/6/12
  - +Opción · Sin bloque horario/Sin bloque horario [T] @432,130 107x18 «Sin bloque horario» f=tinta Nunito Regular 13
  - +Lista de horas/Opción · 06:00 [F] @420,154 170x30 H0p6/12/6/12
  - +Opción · 06:00/06:00 [T] @432,160 35x18 «06:00» f=tinta Nunito Regular 13
  - +Lista de horas/Opción · 07:00 [F] @420,184 170x30 H0p6/12/6/12
  - +Opción · 07:00/07:00 [T] @432,190 35x18 «07:00» f=tinta Nunito Regular 13
  - +Lista de horas/Opción · 08:00 [F] @420,214 170x30 H0p6/12/6/12
  - +Opción · 08:00/08:00 [T] @432,220 35x18 «08:00» f=tinta Nunito Regular 13
  - +Lista de horas/Opción · 09:00 [F] @420,244 170x30 H0p6/12/6/12
  - +Opción · 09:00/09:00 [T] @432,250 35x18 «09:00» f=seleccion Nunito Bold 13
  - +Lista de horas/Opción · 10:00 [F] @420,274 170x30 H0p6/12/6/12
  - +Opción · 10:00/10:00 [T] @432,280 35x18 «10:00» f=tinta Nunito Regular 13
  - +Lista de horas/Opción · 11:00 [F] @420,304 170x30 H0p6/12/6/12
  - +Opción · 11:00/11:00 [T] @432,310 35x18 «11:00» f=tinta Nunito Regular 13
  - +Lista de horas/Opción · 12:00 [F] @420,334 170x30 H0p6/12/6/12
  - … 2 más en la huella
- Textos: «Sin bloque horario» · «06:00» · «07:00» · «08:00» · «09:00» · «10:00» · «11:00» · «12:00»
- Fuentes: N72|N72|N72|N72
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 56. Nueva tarjeta · Campos vacíos (2148:26739)
- Ids: claro 2148:26739 · oscuro 2149:28641 · Rosa 2149:28341 · Enfoque 2149:28491. Marco 1093x560.
- Estructura: base 204-1915; +5 / ~5 / -6. Quita: /Ventana · Nueva tarjeta/Prioridad · botones/Opción · Sin prioridad; /Ventana · Nueva tarjeta/Prioridad · botones/Opción · Sin prioridad/Media; /Ventana · Nueva tarjeta/Prioridad · botones/Opción elegida · Media; /Ventana · Nueva tarjeta/Prioridad · botones/Opción elegida · Media/Media; /Ventana · Nueva tarjeta/Etiquetas/Ficha · Proyecto; /Ventana · Nueva tarjeta/Etiquetas/Ficha · Proyecto/Proyecto.
- Elementos (diff):
  - +Prioridad · botones/Opción elegida · Sin prioridad [F] @555,223 95x34 f=seleccion s=seleccion/1.5 r=9
  - +Opción elegida · Sin prioridad/Media [T] @563,231 80x19 «Sin prioridad» f=sobre_seleccion Nunito Regular 14
  - +Prioridad · botones/Opción · Media [F] @702,223 52x34 f=superficie s=borde_campo/1.5 r=9
  - +Opción · Media/Media [T] @709,231 39x19 «Media» f=tinta Nunito Regular 14
  - +Etiquetas/Proyecto   ·   Universidad [T] @299,297 94x19 «Elige etiquetas» f=tinta Nunito Regular 14
  - ~Título/Revisar los bocetos w:122→0; txt:Revisar los bocetos→
  - ~Fecha límite/27/11/2026 w:76→94; txt:27/11/2026→DD/MM/AAAA
  - ~Descripción/Preparar la entrega del equipo txt:Preparar la entrega del equipo→
  - ~Fecha del bloque/24/11/2026     09:00 x:322→316; y:381→382; w:76→80; h:19→16; txt:24/11/2026→DD/MM/AAAA; font:Nunito Regular 14→Nunito Regular 12
  - ~Hora del bloque/24/11/2026     09:00 x:429→425; y:381→382; w:37→99; h:19→16; txt:09:00→Sin bloque horario; font:Nunito Regular 14→Nunito Regular 12
- Textos: «Sin prioridad» · «Media» · «Elige etiquetas»
- Fuentes: N66|N66|N66|N66
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 57. Nueva tarjeta · Error al guardar (2148:27220)
- Ids: claro 2148:27220 · oscuro 2149:30035 · Rosa 2149:29745 · Enfoque 2149:29890. Marco 1093x560.
- Estructura: base 204-1915; +1 / ~0 / -0.
- Elementos (diff):
  - +Mensaje emergente [I] @607,4 462x42 «No pudimos completar la operación. Intenta de nuevo más tarde.» f=superficie_alta s=#b32d42/1 r=21 c=Mensaje emergente / Error:Estado=Visible H6p5/3/5/12
- Textos: «No pudimos completar la operación. Intenta de nuevo más tarde.»
- Fuentes: N64R1|N64R1|N64R1|N64R1
- Interacciones: 
  - Mensaje emergente: AFTER_TIMEOUT 6s → NODE/CHANGE_TO 217:17679 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT
  - Mensaje emergente: MOUSE_ENTER → NODE/CHANGE_TO 217:17673 «Estado=En pausa» · DISSOLVE 0.15s EASE_OUT
  - Cerrar: ON_CLICK → NODE/CHANGE_TO 217:17679 «Estado=Oculto» · DISSOLVE 0.15s EASE_OUT

### 58. Nueva tarjeta · Errores · Obligatorio, fecha no válida y descripción larga (2148:27815)
- Ids: claro 2148:27815 · oscuro 2149:30474 · Rosa 2149:30180 · Enfoque 2149:30327. Marco 1093x560.
- Estructura: base 204-1915; +3 / ~50 / -0.
- Elementos (diff):
  - +Ventana · Nueva tarjeta/Error · Título [T] @291,154 248x16 «Este campo es obligatorio.» f=error Nunito Regular 12
  - +Ventana · Nueva tarjeta/Error · Fecha límite [T] @291,242 248x16 «Diligencia una fecha válida.» f=error Nunito Regular 12
  - +Ventana · Nueva tarjeta/Error · Descripción [T] @555,348 248x32 «La descripción no puede superar los 1000 caracteres.» f=error Nunito Regular 12
  - ~Ventana · Nueva tarjeta y:73→32; h:414→496
  - ~Ventana · Nueva tarjeta/Nueva tarjeta y:95→54
  - ~Ventana · Nueva tarjeta/Título y:137→96
  - ~Ventana · Nueva tarjeta/Título y:157→116; stroke:borde_campo→error
  - ~Título/Revisar los bocetos y:165→124; w:122→228; txt:Revisar los bocetos→
  - ~Ventana · Nueva tarjeta/Tipo y:137→96
  - ~Ventana · Nueva tarjeta/Tipo · botones y:157→116
  - ~Tipo · botones/Opción elegida · Tarea y:157→116
  - ~Opción elegida · Tarea/Tarea y:165→124
  - ~Tipo · botones/Opción · Recordatorio y:157→116
  - ~Opción · Recordatorio/Tarea y:165→124
  - ~Tipo · botones/Opción · Evento y:157→116
  - ~Opción · Evento/Tarea y:165→124
  - … 37 más en la huella
- Textos: «Este campo es obligatorio.» · «Diligencia una fecha válida.» · «La descripción no puede superar los 1000 caracteres.»
- Fuentes: N67|N67|N67|N67
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 59. Nueva tarjeta · Errores · Título largo, fecha pasada y bloque pasado (2148:27969)
- Ids: claro 2148:27969 · oscuro 2149:30915 · Rosa 2149:30621 · Enfoque 2149:30768. Marco 1093x560.
- Estructura: base 204-1915; +3 / ~50 / -0.
- Elementos (diff):
  - +Ventana · Nueva tarjeta/Error · Título [T] @291,154 248x16 «El título no puede superar los 100 caracteres.» f=error Nunito Regular 12
  - +Ventana · Nueva tarjeta/Error · Fecha límite [T] @291,242 248x16 «La fecha límite no puede ser anterior a hoy.» f=error Nunito Regular 12
  - +Ventana · Nueva tarjeta/Error · Fecha del bloque [T] @291,414 248x32 «No puedes asignar tarjetas a un bloque horario que ya pasó.» f=error Nunito Regular 12
  - ~Ventana · Nueva tarjeta y:73→32; h:414→496
  - ~Ventana · Nueva tarjeta/Nueva tarjeta y:95→54
  - ~Ventana · Nueva tarjeta/Título y:137→96
  - ~Ventana · Nueva tarjeta/Título y:157→116; stroke:borde_campo→error
  - ~Título/Revisar los bocetos y:165→124; w:122→228; h:19→19.5; txt:Revisar los bocetos→Revisar los bocetos de la entrega final del proyecto de grado con todo el equipo y con la profesora antes del viernes
  - ~Ventana · Nueva tarjeta/Tipo y:137→96
  - ~Ventana · Nueva tarjeta/Tipo · botones y:157→116
  - ~Tipo · botones/Opción elegida · Tarea y:157→116
  - ~Opción elegida · Tarea/Tarea y:165→124
  - ~Tipo · botones/Opción · Recordatorio y:157→116
  - ~Opción · Recordatorio/Tarea y:165→124
  - ~Tipo · botones/Opción · Evento y:157→116
  - ~Opción · Evento/Tarea y:165→124
  - … 37 más en la huella
- Textos: «El título no puede superar los 100 caracteres.» · «La fecha límite no puede ser anterior a hoy.» · «No puedes asignar tarjetas a un bloque horario que ya pasó.»
- Fuentes: N67|N67|N67|N67
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 60. Nueva tarjeta · Errores · Bloque después de la fecha límite (2148:28123)
- Ids: claro 2148:28123 · oscuro 2149:31352 · Rosa 2149:31062 · Enfoque 2149:31207. Marco 1093x560.
- Estructura: base 204-1915; +1 / ~50 / -0.
- Elementos (diff):
  - +Ventana · Nueva tarjeta/Error · Fecha del bloque [T] @291,392 248x32 «No puedes programar la tarjeta después de su fecha límite.» f=error Nunito Regular 12
  - ~Ventana · Nueva tarjeta y:73→54; h:414→452
  - ~Ventana · Nueva tarjeta/Nueva tarjeta y:95→76
  - ~Ventana · Nueva tarjeta/Título y:137→118
  - ~Ventana · Nueva tarjeta/Título y:157→138
  - ~Título/Revisar los bocetos y:165→146
  - ~Ventana · Nueva tarjeta/Tipo y:137→118
  - ~Ventana · Nueva tarjeta/Tipo · botones y:157→138
  - ~Tipo · botones/Opción elegida · Tarea y:157→138
  - ~Opción elegida · Tarea/Tarea y:165→146
  - ~Tipo · botones/Opción · Recordatorio y:157→138
  - ~Opción · Recordatorio/Tarea y:165→146
  - ~Tipo · botones/Opción · Evento y:157→138
  - ~Opción · Evento/Tarea y:165→146
  - ~Ventana · Nueva tarjeta/Fecha límite y:203→184
  - ~Ventana · Nueva tarjeta/Fecha límite y:223→204
  - … 35 más en la huella
- Textos: «No puedes programar la tarjeta después de su fecha límite.»
- Fuentes: N65|N65|N65|N65
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 61. Editar tarjeta · Etiquetas abierta (2148:27045)
- Ids: claro 2148:27045 · oscuro 2149:29570 · Rosa 2149:29220 · Enfoque 2149:29395. Marco 1093x560.
- Estructura: base 204-1981; +17 / ~1 / -0.
- Elementos (diff):
  - +Etiquetas/Ficha · Universidad [F] @383,295 94x22 f=#2a6f8f@0.16 s=#2a6f8f/1 r=11 H6p0/8/0/8
  - +Ficha · Universidad/Universidad [T] @406,298 64x16 «Universidad» f=tinta Nunito Regular 12
  - +Ventana · Editar tarjeta/Lista de etiquetas [F] @291,327 248x120 f=superficie s=borde_campo/1.5 r=9
  - +Lista de etiquetas/Fila · Proyecto [F] @291,331 248x28
  - +Fila · Proyecto/Proyecto [T] @321,336 52x16 «Proyecto» f=tinta Nunito Regular 13
  - +Fila · Proyecto/Casilla [R] @507,337 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Proyecto/✓ [T] @510,337 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas/Fila · Universidad [F] @291,359 248x28
  - +Fila · Universidad/Universidad [T] @321,364 70x16 «Universidad» f=tinta Nunito Regular 13
  - +Fila · Universidad/Casilla [R] @507,365 16x16 f=borde_campo s=borde_campo/1.5 r=4
  - +Fila · Universidad/✓ [T] @510,365 10x16 «✓» f=superficie Nunito Regular 12
  - +Lista de etiquetas/Fila · Personal [F] @291,387 248x28
  - +Fila · Personal/Personal [T] @321,392 52x16 «Personal» f=tinta Nunito Regular 13
  - +Fila · Personal/Casilla [R] @507,393 16x16 s=borde_campo/1.5 r=4
  - +Lista de etiquetas/Fila · Salud [F] @291,415 248x28
  - +Fila · Salud/Salud [T] @321,420 34x16 «Salud» f=tinta Nunito Regular 13
  - … 2 más en la huella
- Textos: «Universidad» · «Proyecto» · «✓» · «Universidad» · «✓» · «Personal» · «Salud»
- Fuentes: N73|N73|N73|N73
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 2)

### 62. Detalle de tarjeta · Sin datos (2148:26896)
- Ids: claro 2148:26896 · oscuro 2149:29077 · Rosa 2149:28791 · Enfoque 2149:28934. Marco 1093x560.
- Estructura: base 204-1849; +3 / ~1 / -4. Quita: /Ventana · Detalle de tarjeta/Prioridad · botones/Opción elegida · Alta; /Ventana · Detalle de tarjeta/Prioridad · botones/Opción elegida · Alta/Media; /Ventana · Detalle de tarjeta/Etiquetas/Ficha · Proyecto; /Ventana · Detalle de tarjeta/Etiquetas/Ficha · Proyecto/Proyecto.
- Elementos (diff):
  - +Prioridad · botones/Opción elegida · Sin prioridad [F] @555,234 95x22 f=seleccion s=seleccion/1 r=9
  - +Opción elegida · Sin prioridad/Media [T] @560,235 86x20 «Sin prioridad» f=sobre_seleccion Nunito Regular 15
  - +Etiquetas/Proyecto   ·   Universidad [T] @291,296 88x20 «Sin etiquetas» f=tinta Nunito Regular 15
  - ~Descripción/Preparar la entrega del equipo h:40→20; txt:Revisar con el equipo los bocetos de la entrega.→Sin descripción
- Textos: «Sin prioridad» · «Sin etiquetas»
- Fuentes: N64|N64|N64|N64
- Interacciones: ninguna propia (las de la base no se repiten; la base tiene 3)

## Muestras de tema (huellas con "tema")

| Tema | Marco | Familia | Diff contra claro (+/~/-) | Desvíos |
|---|---|---|---|---|
| Windgets oscuro | 2156:3648 | Calendario · Día con el puntero encima (2155:32112) | 0/0/0 | ninguno |
| Windgets oscuro | 233:16455 | Reportes · Error (217:16529) | 0/0/0 | ninguno |
| Windgets oscuro | 2144:24638 | Nueva etiqueta · Error · Obligatorio (2143:22996) | 0/0/0 | ninguno |
| Rosa pastel | 217:16615 | Reportes · Error (217:16529) | 0/15/0 | ~Planificador  ›  Reportes y:19→20; w:139→145; h:18→16; font:Nunito Regular 13→Quicksand Regular 13 ; ~Reportes y:49→50; w:110→116; h:35→33; font:Nunito Bold 26→Quicksand Bold 26 ; ~Sincronizado x:1000→997; y:20→21; w:69→72; h:16→15; font:Nunito Regular 12→Quicksand Regular 12 |
| Rosa pastel | 2143:25240 | Nueva etiqueta · Error · Obligatorio (2143:22996) | 0/25/0 | ~Pantalla de origen fill:fondo→superficie ; ~Pantalla de origen/Planificador  ›  Etiquetas y:19→20; w:141→146; h:18→16; font:Nunito Regular 13→Quicksand Regular 13 ; ~Pantalla de origen/Etiquetas y:49→50; w:114→119; h:35→33; font:Nunito Bold 26→Quicksand Bold 26 |
| Rosa pastel | 2156:3300 | Calendario · Día con el puntero encima (2155:32112) | 0/0/0 | ninguno |
| Enfoque rojo y negro | 217:16572 | Reportes · Error (217:16529) | 0/15/0 | ~Planificador  ›  Reportes y:19→20; w:139→152; h:18→17; font:Nunito Regular 13→Space Grotesk Regular 13 ; ~Reportes y:49→50; w:110→115; h:35→33; font:Nunito Bold 26→Space Grotesk Bold 26 ; ~Sincronizado x:1000→994; y:20→21; w:69→75; h:16→15; font:Nunito Regular 12→Space Grotesk Regular 12 |
| Enfoque rojo y negro | 2144:24514 | Nueva etiqueta · Error · Obligatorio (2143:22996) | 0/0/0 | ninguno |
| Enfoque rojo y negro | 2156:3474 | Calendario · Día con el puntero encima (2155:32112) | 0/0/0 | ninguno |

Desvíos de fuente (censo en los 4 marcos de las 62 familias; texto visible, sin menú lateral):
- Rosa no cambia a Quicksand en las familias 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62 (siguen Nunito o Rubik). Cuando sí cambia (8-11, 16-19, 37-52), queda 1 texto en Nunito en 9-11, 38 y 51 (uno por marco).
- Enfoque no cambia a Space Grotesk en 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 41, 42, 43, 44, 45, 46, 47, 48, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62. Incluye las 8 de Etiqueta y Columna (41-48), que sí cambian en Rosa pero no en Enfoque.
- Calendario (1-7), Agenda parcial (12-15), Reportes con selectores, gráfica y filtro (20-36) y Nueva tarjeta con selectores y errores (53-62) no cambian de letra en ningún tema: el marco de tema no sigue la fuente.
- Reportes · Error (18): Rosa y Enfoque con 15 diferencias de fuente frente a claro; Etiqueta · Obligatorio (41): Rosa 25 diferencias; en Enfoque 0 (sigue Nunito).
- Oscuro coincide con claro en todo lo medido (0 diferencias en las 9 muestras, salvo lo de arriba): solo cambian las variables.
- Selectores de Reportes (22-30): Rubik en los 4 temas. En 25 («Elegir Desde · debajo de su campo»), claro tiene 46 textos Rubik y los otros tres temas 8 (la cuenta difiere entre temas).

## Incoherencias

1. Colores fijos (sin variable) en el borde del Mensaje emergente: #b47700 (Advertencia: Etiquetas · Máximo, Calendario · Aviso día pasado), #00d9e2 (Información: Etiqueta inexistente) y #b32d42 (Error: Nueva tarjeta · Error al guardar).
2. Colores de etiqueta con dos valores: la ficha usa #2a6f8f@0,16 y #b8692e; el catálogo de Etiquetas, #2b7a8c y #b8692a. Además, #2e8b57 y #b04f7d fijos en las 7 familias de Calendario (y en las de Etiqueta/Columna), sin variable.
3. Letra: el selector de fechas de Reportes (Elegir Desde / Hasta) usa Rubik Medium 17/13 y Rubik Regular 12 en una pantalla de cuerpo Nunito; el de Nueva tarjeta usa Nunito (columnas como texto de varias líneas, con fuente mixta en V y M, y 1 texto de fuente mixta en 53-54).
4. Forma distinta para el mismo control (selectores y listas): radio 8 / 9 / 10 y borde linea / borde_campo / borde; trazo de campo 1,5 frente a 1 en panel (Reportes selector, Nueva tarjeta · Selector de fecha, Lista de horas, Lista de etiquetas).
5. Nombres de capa que no coinciden con el contenido: «Revisar los bocetos» y «Proyecto · 27 nov» con texto «Pagar el gimnasio» / «22 nov 2026» (Estado elegido · Vencidas); «Salud/Personal» y «Media» dentro de «Opción elegida · Sin prioridad»; «Tarea» en Recordatorio / Evento; «Proyecto · Universidad» con «Elige etiquetas» / «Sin etiquetas».
6. Reportes · Elegir Desde / Hasta guardan un texto oculto «  » (marcador de error, 0 px) y lista vieja; «Rango recortado» y «Sin tarjetas» usan la base de 204-1005 con datos que no coinciden (83,3 % frente a 50,0 %).
7. Nueva tarjeta · Campos vacíos: «Fecha del bloque» pasa de Nunito 14 a 12. El ejemplo de error «31/02/2026» es una fecha inválida a propósito (correcto para el caso).
8. Los avisos se ocultan solos con AFTER_TIMEOUT de 4 s (inexistente) o 6 s (máximo, Nueva tarjeta · error): no hay una duración común. Cerrar, entrar con el puntero y ocultar usan DISSOLVE 0,15 s EASE_OUT; la navegación del Calendario va sin transición.
9. Los marcos 53-62 (Nueva tarjeta) y los de Calendario/Reportes no siguen la fuente del tema (ver desvíos): en Rosa y Enfoque quedan con Nunito o Rubik.

## No medido

- Estado con el puntero encima del Calendario: sin diferencia visible en el marco (0/0/0 en los 4 temas); pudo existir solo como variante de componente.
- Efecto real de SET_VARIABLE y de CONDITIONAL (valores y condiciones): solo se lee el tipo de acción.
- Íconos, vectores y menú lateral (el recorrido los omite): la iconografía por tema no se verificó.
- Relleno y trazo de las familias de Rosa y Enfoque que no están entre las 9 muestras: solo se midió la fuente (censo).
