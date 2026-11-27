# Temas y tokens (fase 6)

Local, sin git. Lo lee una máquina: la prueba de la fase 6 compara los cuatro temas de `apps/desktop/src/ui/tema/` con la tabla de la sección 1, calcula los contrastes de la sección 6 y comprueba la regla de morado y cian de la sección 7. Hora de Colombia, 26-nov-2026. Revisado 26-nov (UTC-5): hallazgos del revisor y decisiones de Paula (P1 a P4) aplicados; las propuestas Q1 a Q3 quedan marcadas PROPUESTA, confirma Paula en fase 5.

Etiquetas de origen: **MEDIDO** (id de nodo o sección de `.trabajo/figma/F0.md`), **DECIDIDO** (D-n o R11 de `.trabajo/DECISIONES_PAULA_26nov.md`, o la regla 7 de `docs/implementacion/PLAN.md`), **PROPUESTA** (calculado o inferido aquí; Paula confirma), **NO MEDIDO** (con motivo).

Formato para la máquina: hex en minúsculas, `#rrggbb` o `#rrggbbaa` (alfa al final); sombras como `x,y,desenfoque,extension,#hex` (el código escribe `3px 5px 0 #241C30`: se compara como `3,5,0,0,#241c30`). La cabecera de la tabla de la sección 1 es `variable | claro | oscuro | rosa | enfoque | token del codigo | alias en F0 | nota | uso`. La columna «token del codigo» lleva solo el nombre del token que existe en `tokens.ts` o la palabra `FALTA`; todo texto libre va en «nota». El guion de la sección 9 lee esa tabla, calcula las tablas derivadas (5.2, 6, 7, 8.4, 8.5) y sale con código 1 si alguna fila del documento difiere de lo calculado.

## 1. Variables de color (colección 200:2 · «Rediseño final · Tema aplicado», 32 COLOR)

Fuente: MEDIDO, F0 §1.2 (modos Windgets claro 200:0, Rosa pastel 200:1, Enfoque rojo y negro 200:2, Windgets oscuro 233:0). Los valores son los de F0 reordenados claro | oscuro | rosa | enfoque, salvo `sobre_accion` (claro y oscuro) y `sobre_seleccion` (oscuro), que siguen a la decisión P3 (sección 7.3). Cuando F0 da un alias (→x), aquí va el hex resuelto y el alias queda en la columna «alias en F0». El token del código es el nombre en `apps/desktop/src/ui/tema/tokens.ts`; la variable CSS es `--wg-` más el nombre con guiones. «FALTA» = no existe en el código.

| variable | claro | oscuro | rosa | enfoque | token del codigo | alias en F0 | nota | uso |
|---|---|---|---|---|---|---|---|---|
| principal | #00d9e2 | #00d9e2 | #f2b3cb | #d1202f | principal | - | solo claro y oscuro | Color de marca; relleno de accion e informacion (cian en Windgets) |
| secundario | #6604e6 | #d3b2ff | #6b3550 | #c9c4be | secundario | - | solo claro y oscuro | Segundo color de marca; origen de detalle |
| marco | #f5f0ff | #201b2b | #f2b3cb | #d1202f | marco | rosa→principal, enfoque→principal | - | Fondo de la barra lateral y del marco de la ventana |
| sobre_marco | #17131d | #f8f5ff | #3a1528 | #ffffff | sobre_marco | - | - | Texto e iconos sobre marco |
| superficie | #ffffff | #2b2534 | #fbeff3 | #1e1d22 | superficie | - | - | Relleno de campos, botones secundarios, paneles |
| superficie_alta | #fffbea | #302d38 | #fbeff3 | #1e1d22 | superficie_alta | - | - | Relleno de avisos, papel de dialogos, tarjeta de Windi |
| superficie_baja | #ede3ff | #433258 | #f2b3cb | #2b2a30 | superficie_baja | - | - | Relleno de filas, columnas, hover y seleccion suave |
| linea | #d9d0e6 | #5d566b | #f2b3cb | #6e2a2e | linea | - | - | Separadores y trazos decorativos de 1 px |
| tinta | #17131d | #f8f5ff | #3a1528 | #ffffff | tinta | - | - | Texto principal, anillo de foco, hover de campo |
| texto | #554f5e | #cec7d6 | #6b3550 | #c9c4be | texto | - | - | Texto secundario |
| accion | #00d9e2 | #00d9e2 | #f2b3cb | #d1202f | accion | claro→principal, rosa→principal, enfoque→principal, oscuro→principal | - | Relleno del boton principal |
| sobre_accion | #0b2a2e | #0b2a2e | #3a1528 | #ffffff | sobre_accion | - | DECIDIDO P3: sobre relleno cian el texto es #0b2a2e (8,68); F0 trae #17131d | Texto sobre accion |
| borde | #241c30 | #afa1c0 | #b04f7d | #e0565b | borde | - | - | Borde de controles y sombra dura |
| sombra | #241c30 | #100d15 | #b04f7d | #e0565b | sombra | rosa→borde, enfoque→borde | solo claro y oscuro; el código guarda `3px 5px 0 #241C30` (claro) y `3px 5px 0 #100D15` (oscuro): se compara como `3,5,0,0,#hex` | Color de la sombra dura (desplazamiento 3,5) |
| error | #b3261e | #ff8a80 | #b3261e | #ff8a80 | error | - | solo claro y oscuro | Texto, borde y trazo de error |
| borde_campo | #766b81 | #948b9e | #b04f7d | #e0565b | FALTA | rosa→borde, enfoque→borde | - | Borde de campo, interruptor apagado, casilla sin marcar |
| burbuja_propia | #bff5f8 | #0e4a4d | #fadce7 | #4a1b22 | FALTA | - | - | Relleno del mensaje de la persona en Windi |
| fondo | #ffffff | #201b2b | #fbeff3 | #1e1d22 | FALTA | - | - | Fondo de pantalla y texto del nombre emergente |
| detalle | #6604e6 | #d3b2ff | #6b3550 | #c9c4be | FALTA | claro→secundario, rosa→secundario, enfoque→secundario, oscuro→secundario | - | Relleno del dia actual del Calendario |
| sobre_detalle | #17131d | #17131d | #ffffff | #141316 | FALTA | - | F0 trae #17131d sobre #6604e6 en claro (2,38, falla): PROPUESTA #ffffff (7,71), pendiente de Paula (8.3) | Texto sobre detalle |
| principal_legible | #6604e6 | #00d9e2 | #905f75 | #e16e78 | FALTA | oscuro→principal | - | Interruptor encendido, trazo de la fila seleccionada (en oscuro la fila usa `tinta`, P1) |
| sobre_seleccion | #ffffff | #0b2a2e | #3a1528 | #ffffff | FALTA | rosa→sobre_accion, enfoque→sobre_accion | DECIDIDO P3: en oscuro (relleno cian) #0b2a2e; F0 trae #2b2534 (alias de superficie) | Texto sobre seleccion |
| perilla | #ffffff | #ffffff | #ffffff | #ffffff | FALTA | - | F0 trae blanca en oscuro sobre cian (1,75, falla): PROPUESTA #0b2a2e (8,68), pendiente de Paula (8.3) | Perilla del interruptor |
| informacion | #00d9e2 | #00d9e2 | #f2b3cb | #d1202f | FALTA | - | - | Borde e icono del aviso de Informacion (D1, P2); el texto del aviso va en `texto` |
| seleccion | #6604e6 | #00d9e2 | #f2b3cb | #d1202f | FALTA | rosa→accion, enfoque→accion, oscuro→accion | - | Casilla marcada, opcion elegida, trazo de arrastre |
| estado_vencida | #d93226 | #d93226 | #d93226 | #d93226 | estado_vencida | - | - | Texto y punto de vencida |
| relleno_vencida | #f4c2be | #5f2930 | #f1b6b6 | #562323 | relleno_vencida | - | - | Relleno de vencida |
| estado_pendiente | #b28d1f | #d9ac26 | #a9861e | #d9ac26 | estado_pendiente | - | - | Texto y punto de pendiente; aviso de Advertencia (D1) |
| relleno_pendiente | #e8ddbc | #5f4e30 | #e2d0b3 | #564823 | relleno_pendiente | - | - | Relleno de pendiente |
| estado_completada | #1ea94c | #26d962 | #1ca048 | #26d962 | estado_completada | - | - | Texto y punto de completada; aviso de Exito (D1) |
| relleno_completada | #bbe5c9 | #2a5b42 | #b8d7c0 | #205535 | relleno_completada | - | - | Relleno de completada |
| velo | #17131d66 | #0000008c | #3a152866 | #0000008c | FALTA | - | - | Velo de dialogos y de imagen de fondo (con alfa) |

Notas de la tabla:
- `velo` lleva alfa: claro `#17131d66` (0,4), oscuro y enfoque `#0000008c` (0,55), rosa `#3a152866` (0,4). Coincide con F8 (marco de confirmación).
- `sombra` es el color de una sombra dura sin desenfoque; el desplazamiento está en la sección 4.3.
- `informacion` repite los valores de `principal` en los cuatro modos sin ser alias (F0 §6.12). Se deja como variable propia.
- `estado_vencida` vale lo mismo en los cuatro modos (F0 §6.12).
- La colección heredada `80:2` (Cian #00d9e2, Fucsia #dc026c, Amarillo #dcba04, Violeta #6604e6, Fondo, Superficie, Texto, Enlace) no entra: F0 §6.12 la marca como paleta antigua que duplica a `200:2`.
- En Rosa y Enfoque un mismo valor sirve a varias variables (`marco`, `linea` y `principal` en Rosa; `marco` y `principal` en Enfoque). El token del código mantiene las variables separadas aunque el valor coincida.
- Cada columna de la tabla 1 es la lista completa de colores que el código debe tener en ese tema: 32 por tema (sección 8.1.1 para Rosa y Enfoque).
- Barra lateral: F0 §6.13 no tiene variante «Windgets oscuro». El modo oscuro de `200:2` sí existe y es el que manda.

## 2. Variables FLOAT

| variable | colección | valor | origen | token del código |
|---|---|---|---|---|
| Radio de widgets | 211:6092 y 217:24330 («Tema/Radio de widgets») | 9 | MEDIDO F0 §1.4; no está enlazada a ningún nodo (F0 §6.14) | FALTA (propuesta: `radio_widgets`, `--wg-radio-widgets`) |
| Tipografía del tema | 211:6092 y 217:24330 («Tema/Tipografía del tema») | 14 | MEDIDO F0 §1.4; DECIDIDO P4: «Mediano» = 14 | `tamano_fuente` existe y vale 16px (`tokens_por_defecto.ts:28`); pasa a 14px. Pequeño = 12 y Grande = 18 (sección 8.3) |
| Oscurecimiento, Desenfoque de imagen, Posición oscurecer, Posición desenfocar | 211:6092 | 0 | MEDIDO F0 §1.4 | FALTA; son del fondo del tema |
| Cantidad de etiquetas, Desde día, Hasta día | 219:16116 | 0, 1, 24 | MEDIDO F0 §1.4 | No es token: estado del filtro de Reportes |
| Caracteres | 224:9089 | 0 | MEDIDO F0 §1.4 | No es token: contador del prototipo |

Estas colecciones tienen un solo modo («Mode 1»): no hay valor por tema. El radio de widgets cambia con la «Forma» del widget: Rectas 0, Base = variable 9, Redondas 22 (DECIDIDO R11).

## 3. Tipografía por tema

Regla de Paula (DECIDIDO, `DECISIONES_PAULA_26nov.md`, «Tipografía»): Nunito es la fuente por defecto de Windgets. Claro y oscuro usan Nunito, Rosa pastel usa Quicksand, Enfoque rojo y negro usa Space Grotesk. Rubik pasa a la fuente del tema y sale de la lista que elige la persona (CONSISTENCIA T13). La tipografía que la persona elige en Personalización manda sobre la del tema en toda la app.

Orden de resolución (PROPUESTA que aplica la regla): fuente elegida por la persona, si existe; si no, la del tema. La fuente que elige la persona manda sobre la del tema en toda la app. Rubik no es fuente fija de ninguna pantalla ni opción de la lista.

| tema | familia por defecto | pesos (CSS) | origen |
|---|---|---|---|
| Windgets claro | Nunito | 400 Regular, 500 Medium, 600 SemiBold, 700 Bold | MEDIDO F0 §4 y censo de huellas; DECIDIDO; el 600 es PROPUESTA Q3, confirma Paula en fase 5 |
| Windgets oscuro | Nunito | 400, 500, 600, 700 | DECIDIDO (igual que claro). NO MEDIDO en huellas: las huellas «oscuro» son pantallas de cuenta, que están en Rubik |
| Rosa pastel | Quicksand | 400, 500, 700 | MEDIDO F6, F2b, F3, F5; DECIDIDO |
| Enfoque rojo y negro | Space Grotesk | 400, 500, 700 | MEDIDO F6, F2b, F3, F5; DECIDIDO |

Tamaños en uso con Nunito (px), por rol. Rosa y Enfoque conservan peso y tamaño (MEDIDO F6, secciones de Rosa y de Enfoque); solo cambia el ancho del texto.

| rol | peso | tamaño | origen |
|---|---|---|---|
| Texto base (Tipografía del tema) | 400 | 14 | MEDIDO F0 §1.4 (FLOAT 14) |
| Botón y selector segmentado | 500 | 14 | MEDIDO 2005:373, 2005:397 |
| Campo editable y fila de lista | 400 | 14 | MEDIDO 2118:831, 2005:421 |
| Mensaje de error de campo, Dato (etiqueta) | 400 | 13 | MEDIDO 2118:831, 2005:398 |
| Nombre emergente | 500 | 13 | MEDIDO 2003:267 |
| Dato (valor) y paso (nombre) | 400 y 500 | 15 | MEDIDO 2005:398, 2052:558 |
| Windi: mensaje y propuesta | 400 y 500 | 13 y 12 | MEDIDO 2045:511, 2045:527 |
| Windi widget: título | 700 | 17 | MEDIDO 2048:506 |
| Título de pantalla | 700 | 26 | MEDIDO huella 203:6362 |
| Subtítulo de sección («Vista previa») | 500 | 16 | MEDIDO huella 203:6362 |
| Encabezado de panel («Mis temas») | 500 | 17 | MEDIDO huella 203:6362 |
| Migas | 400 | 13 | MEDIDO huella 203:6362 |
| Sincronizado | 400 | 12 | MEDIDO huella 203:6362 |
| Diálogos (M-01 y M-16 a M-21) | 700 | 20 | MEDIDO F8 4 (hoy Rubik Medium 20 o Nunito Bold 20; pasa al tema) |
| Avisos: título y cuerpo | 500 y 400 | 15 y 13 | MEDIDO 217:17624 (hoy Rubik; pasa al tema) |
| Barra lateral | 500 y 400 | 19, 13 y 10 (rótulos) | MEDIDO 204:32252 (hoy Rubik; pasa al tema) |
| Widgets | 700, 400, 500 | 11; 9 (casilla); 34 (reloj y temperatura) | MEDIDO 2192:34691 a 2206:77762 |

Censo de huellas (todas las pantallas de claro): Nunito Bold {13, 15, 17, 19, 20, 26, 40, 41}, Medium {11 a 18}, Regular {11 a 15}, SemiBold {13}. El SemiBold 13 aparece una sola vez en las huellas y F0 §4 no lo usa, pero `tokens.css` declara `font-weight: 600` en 6 reglas (líneas 632, 934, 948, 1066, 1247 y 1285): PROPUESTA Q3, confirma Paula en fase 5: se empaqueta el 600 de Nunito (sin él el navegador lo sintetiza con el 700). Quicksand en Rosa: Bold {17, 26}, Regular {12, 13}, Medium {14, 15, 20}. Space Grotesk en Enfoque: Bold {17, 26}, Regular {12, 13}, Medium {14, 15}. Los 40 y 41 vienen de pantallas de cuenta; los estilos de texto 42/26/17 los quita D8 (F0 §2).

Alto de línea: `auto` en todo salvo el Kanban (13 px y 105 %, MEDIDO F0 §6.6). Espaciado entre letras: 0 % en todo (MEDIDO F0 §4, leyenda).

Fuentes que debe empaquetar la app (PROPUESTA que aplica la regla):

| familia | para qué | pesos | en el código hoy |
|---|---|---|---|
| Nunito | tema claro y oscuro; por defecto; lista de la persona | 400, 500, 600 (Q3), 700 | `nunito.woff2` con solo el peso 400 declarado (`tokens.css:10-15`) |
| Quicksand | tema Rosa pastel | 400, 500, 700 (el 600 cae en el 700 empaquetado) | FALTA |
| Space Grotesk | tema Enfoque rojo y negro | 400, 500, 700 (el 600 cae en el 700 empaquetado) | FALTA |
| Inter, Merriweather, Poppins, JetBrains Mono | lista de la persona en Personalización | 400 | declaradas con 400 (`tokens.css:16-58`) |
| Rubik | ninguno: sale de la lista de la persona (CONSISTENCIA T13) y deja de ser fuente fija | se quitan | declarada con 400, 500 y 700 (`tokens.css:36-53`); se quitan al implementar |

Rubik ya no es «NO DEFINIDO»: sale de la lista de la persona (T13) y Nunito es la fuente por defecto. Un tema guardado con Rubik se lee como el tema por defecto (valor neutro que se registra en `docs/DUDAS.md`, regla 7 de CLAUDE.md). `nunito.woff2` (16316 bytes) es una fuente estática de un solo peso: no tiene tabla `fvar`, así que cada peso necesita su archivo `nunito-500.woff2`, `nunito-600.woff2` y `nunito-700.woff2` y su `@font-face` (hoy solo hay el 400, `tokens.css:10-15`). Quicksand y Space Grotesk no están en `apps/desktop/assets/fonts/` y se añaden.

Los tamaños de la tabla de arriba son los de «Mediano» (base 14). PROPUESTA con valor neutro, confirma Paula en fase 5: los tamaños por rol escalan con el base (Pequeño × 12/14, Grande × 18/14, redondeado a entero); si Paula no lo confirma, solo cambia el base.

## 4. Radios, trazos, sombras y anillo de foco

Los valores fraccionarios del Figma (5,4, 6,1, 10,826, 12,99, 13,05, 1,2, 1,44) vienen del escalado del marco y no son tokens (CONSISTENCIA, sección 2). Los nombres de token son PROPUESTA: el código solo tiene hoy `--wg-radio`, `--wg-borde-ancho` y `--wg-sombra`.

### 4.1 Radios

| token (propuesta) | valor px | origen |
|---|---|---|
| radio_control | 9 | MEDIDO 2005:373, 2005:386, 2005:397, 2005:421, 2118:831 (F0 §6.1); CONSISTENCIA R1 |
| radio_interruptor | 8 (perilla 5) | MEDIDO 2052:545 |
| radio_casilla | 4 | MEDIDO 2152:28882 |
| radio_casilla_widget | 3 | MEDIDO 2192:34695 |
| radio_paso | 12 (círculo) | MEDIDO 2052:558 |
| radio_nombre_emergente | 6 (globo) | MEDIDO 2003:267 |
| radio_aviso | 21 (píldora), 4 (interno) | MEDIDO 217:17624 |
| radio_windi_mensaje | 10 | MEDIDO 2045:511, 2045:527 |
| radio_windi_boton | 9 | PROPUESTA (CONSISTENCIA R2); F0 mide 8 en 2045:527 |
| radio_windi_widget | 12 | MEDIDO 2048:506 |
| radio_panel | 12 | DECIDIDO D5 |
| radio_papel_dialogo | 10 | DECIDIDO D5 |
| pliegue_papel_dialogo | 22 | DECIDIDO D5 (MEDIDO F8 8: esquina doblada de 22) |
| radio_tarjeta | 8 | PROPUESTA (CONSISTENCIA R5); F0 no lo mide en un componente |
| radio_fila_widget | 6 | MEDIDO 2192:34695, 2192:34749, 2206:77690 |
| radio_tarjeta_kanban, radio_dia_actual | 5 | MEDIDO 2192:34749, 2192:34709 |
| radio_widgets | 0 Rectas, 9 Base, 22 Redondas | DECIDIDO R11; la base es la variable `Radio de widgets` (MEDIDO F0 §1.4) |
| radio_campo_error | 9 | DECIDIDO («Error de campo»: radio 9) |
| radio_anillo_foco | radio del control + 3 (control 9 da 12; interruptor 8 da 11) | DECIDIDO D6 |

### 4.2 Trazos

| token (propuesta) | valor px | origen |
|---|---|---|
| trazo_control | 1,5 (botón, selector, campo, casilla, botones de Windi) | MEDIDO 2005:373, 2005:397, 2118:831, 2152:28882, 2045:527 |
| trazo_panel | 1 (aviso, fila normal, mensaje de Windi, tarjeta del Kanban) | MEDIDO 217:17624, 2005:421, 2045:511, 2192:34749 |
| trazo_selector_lista | 1,5, color `borde_campo` (Reportes y listas de Nueva tarjeta) | DECIDIDO en CONSISTENCIA R6 (el trazo del campo en F0 §4.1) |
| trazo_seleccion | 2 (fila seleccionada; trazo de arrastre del Kanban) | MEDIDO 2005:421, F6 2233:8465 |
| trazo_error_campo | 2, color `error` | DECIDIDO («Error de campo»; es lo que trae F0 2118:831) |
| trazo_foco | 2, color `tinta` | DECIDIDO D6 |
| trazo_papel_dialogo | 1,5, color `borde` | MEDIDO F8 8 |

### 4.3 Sombras (duras: sin desenfoque ni extensión, salvo la de arrastre)

| token (propuesta) | x, y, desenfoque, extensión | color | origen |
|---|---|---|---|
| sombra_boton | 3, 5, 0, 0 | `sombra` | MEDIDO 2005:373 (solo nivel Principal, incluido Confirmar de Windi); Secundario y Destructivo sin sombra (R8) |
| sombra_windi_widget | 1, 3, 0, 0 | `sombra` | MEDIDO 2048:506 |
| sombra_papel_dialogo | 3, 5, 0, 0 | `borde` (igual a `sombra` en claro y oscuro; en Rosa y Enfoque `sombra` es alias de `borde`) | MEDIDO F8 8 |
| sombra_arrastre | 0, 4, 8, 0 | #0000004d (negro al 0,3) | MEDIDO F6 2233:8465 |

Uso (CONSISTENCIA R8): sombra 3,5 solo en el botón Principal (incluido Confirmar de Windi); Secundario y Destructivo sin sombra; 1,3 en el widget de Windi; ninguna sombra en los demás widgets. La sombra 2,3 de los botones de Windi que mide F0 §6.3 desaparece con R8 y A3 (los botones de Windi miden 36 y se comportan como Principal o Secundario).

### 4.4 Anillo de foco

| propiedad | valor | origen |
|---|---|---|
| grosor | 2 px | DECIDIDO D6 |
| color | `tinta` | DECIDIDO D6 |
| radio | radio del control + 3 (también campos e interruptor) | DECIDIDO D6 |
| separación entre control y anillo | 3 px | PROPUESTA: sale de «radio + 3» si el anillo rodea al control. NO MEDIDO: F0 §4.1 dice que el anillo es un hijo del componente y no da su tamaño |
| mensaje emergente | hoy anillo r6 de 2 px `tinta` sobre la píldora de 21 | MEDIDO 217:17624; D6 lo lleva a radio + 3 |

Los tres anillos que mide F0 (botón 2 `tinta` r12; campo 1 `principal_legible` r12; interruptor 1 `principal_legible` r11) se reemplazan por este (D6).

## 5. Colores de etiqueta

### 5.1 Catálogo de 9 colores (DECIDIDO D3; valores MEDIDOS en F2a, «Colores fijos»)

| nombre | hex |
|---|---|
| Gris | #8a8d98 |
| Rojo | #e5484d |
| Naranja | #f76b15 |
| Amarillo | #dcba04 |
| Verde | #30a46c |
| Cian | #00d9e2 |
| Azul | #3e63dd |
| Morado | #6604e6 |
| Rosa | #dc026c |

Cian es el `principal` de Windgets y Morado es el `secundario` y `seleccion` de Windgets claro. Rosa #dc026c choca con el tema Rosa (F2a 8); D3 mantiene los 9. Un color de etiqueta es dato de la persona: el punto o la barra con ese color no cuenta como «control» para la regla de morado y cian (PROPUESTA, sección 7).

### 5.2 Mapa al catalogo (distancia CIE76 en Lab, D65)

Métrica principal: distancia CIE76 en Lab (D65), porque D3 manda «el más cercano». La distancia en RGB y el tono se dan solo para comparar. Lab y RGB discrepan en cinco casos (los cinco NO de la columna «coinciden»: #2b7a8c, #b8692a, #b04f7d, #2a6f8f y #b8692e). La columna «asignado» es el mapa propuesto: el más cercano en Lab, salvo #2b7a8c y #2a6f8f, que por Lab caen en Gris (a 24,4 y 25,8) y pierden el matiz verdeazulado, y se asignan a Cian por tono (PROPUESTA Q2, confirma Paula en fase 5; es la misma de CONSISTENCIA C9). #b04f7d queda en Rosa (Lab y tono coinciden), aunque choca con el tema Rosa.

| color de ejemplo | donde | mas cercano (Lab) | deltaE | mas cercano (RGB) | distancia RGB | coinciden | solo por tono (sin Gris) | asignado (Q2) |
|---|---|---|---|---|---|---|---|---|
| #2b7a8c | etiqueta Universidad (F2a, F2b) | Gris #8a8d98 | 24.4 | Verde #30a46c | 53 | NO | Cian #00d9e2 | Cian #00d9e2 (por tono, Q2) |
| #b8692a | etiqueta Personal (F2a, F2b) | Naranja #f76b15 | 31.8 | Rojo #e5484d | 66 | NO | Naranja #f76b15 | Naranja #f76b15 |
| #2e8b57 | etiqueta Salud (F2a, F2b) | Verde #30a46c | 10.2 | Verde #30a46c | 33 | si | Verde #30a46c | Verde #30a46c |
| #b04f7d | etiqueta Proyecto (F2a, F2b) | Rosa #dc026c | 32.8 | Rojo #e5484d | 72 | NO | Rosa #dc026c | Rosa #dc026c |
| #3b82f6 | punto de Etiqueta Lectura, Windi (F3 6) | Azul #3e63dd | 14.6 | Azul #3e63dd | 40 | si | Azul #3e63dd | Azul #3e63dd |
| #2a6f8f | ficha Universidad, variante (C9) | Gris #8a8d98 | 25.8 | Verde #30a46c | 64 | NO | Cian #00d9e2 | Cian #00d9e2 (por tono, Q2) |
| #b8692e | ficha Personal, variante (C9) | Naranja #f76b15 | 32.8 | Rojo #e5484d | 64 | NO | Naranja #f76b15 | Naranja #f76b15 |
| #8a8d98 | punto Kanban Por hacer (F6 3) | Gris #8a8d98 | 0.0 | Gris #8a8d98 | 0 | si | Azul #3e63dd | Gris #8a8d98 |
| #3e63dd | punto Kanban En progreso (F6 3) | Azul #3e63dd | 0.0 | Azul #3e63dd | 0 | si | Azul #3e63dd | Azul #3e63dd |
| #30a46c | punto Kanban Hecho (F6 3) | Verde #30a46c | 0.0 | Verde #30a46c | 0 | si | Verde #30a46c | Verde #30a46c |
Lab y RGB no coinciden en 5 de 10 colores de ejemplo.

Las variantes de ficha (#2a6f8f y #b8692e, C9) siguen a su par: Cian y Naranja. `#3b82f6` (punto de «Lectura» de Windi) va a Azul. Los puntos del Kanban (#8a8d98, #3e63dd, #30a46c) ya son del catálogo: Gris, Azul y Verde. Las tarjetas con trazo de 20 % de alfa (`#b04f7d@0.20`, `#2b7a8c@0.20`, `#b8692a@0.20`, F2b) pasan al color del catálogo con el mismo alfa (PROPUESTA).

## 6. Contrastes calculados (WCAG 2.x)

Fórmula: luminancia relativa `L = 0,2126 R + 0,7152 G + 0,0722 B`, con cada canal `c/255` linealizado (si `c <= 0,04045`: `c/12,92`; si no: `((c+0,055)/1,055)^2,4`). Contraste `(Lmax + 0,05) / (Lmin + 0,05)`. Umbrales: 4,5:1 texto; 3:1 bordes, íconos y puntos. Los valores salen de la tabla de la sección 1 (con los cambios P1 a P3). La salida de abajo es la del guion de la sección 9, que además comprueba que cada fila esté aquí. Los pares con alfa no entran. Los pares `seleccion/superficie_baja`, `principal_legible/superficie_baja` y `texto/fondo` se añadieron en la revisión del 26-nov.

`linea` es decorativa (separador de 1 px): no llega a 3:1 en ningún tema. Solo sería un fallo real en la fila de lista normal, donde F0 la usa como borde del control (MEDIDO 2005:421). Se marca igual.

#### 6.1 Pares de uso real

| par | tipo | umbral | claro | oscuro | rosa | enfoque |
|---|---|---|---|---|---|---|
| texto/superficie | texto | 4.5 | 7.88 | 9.01 | 8.33 | 9.67 |
| texto/superficie_alta | texto | 4.5 | 7.59 | 8.19 | 8.33 | 9.67 |
| texto/superficie_baja | texto | 4.5 | 6.39 | 6.95 | 5.37 | 8.21 |
| texto/fondo | texto | 4.5 | 7.88 | 10.19 | 8.33 | 9.67 |
| tinta/superficie | texto | 4.5 | 18.30 | 13.76 | 14.22 | 16.75 |
| tinta/superficie_alta | texto | 4.5 | 17.64 | 12.51 | 14.22 | 16.75 |
| tinta/superficie_baja | texto | 4.5 | 14.85 | 10.62 | 9.17 | 14.22 |
| tinta/fondo | texto | 4.5 | 18.30 | 15.56 | 14.22 | 16.75 |
| tinta/marco | texto | 4.5 | 16.38 | 15.56 | 9.17 | 5.30 |
| sobre_marco/marco | texto | 4.5 | 16.38 | 15.56 | 9.17 | 5.30 |
| sobre_accion/accion | texto | 4.5 | 8.68 | 8.68 | 9.17 | 5.30 |
| sobre_seleccion/seleccion | texto | 4.5 | 7.71 | 8.68 | 9.17 | 5.30 |
| sobre_detalle/detalle | texto | 4.5 | 2.38 FALLA | 10.09 | 9.33 | 10.69 |
| tinta/burbuja_propia | texto | 4.5 | 15.37 | 9.26 | 12.49 | 14.28 |
| principal_legible/superficie | texto | 4.5 | 7.71 | 8.49 | 4.59 | 5.35 |
| principal_legible/superficie_alta | texto | 4.5 | 7.43 | 7.72 | 4.59 | 5.35 |
| principal_legible/superficie_baja | texto | 4.5 | 6.25 | 6.55 | 2.96 FALLA | 4.54 |
| error/superficie | texto | 4.5 | 6.54 | 6.49 | 5.83 | 7.34 |
| error/superficie_alta | texto | 4.5 | 6.30 | 5.90 | 5.83 | 7.34 |
| estado_vencida/superficie_alta | texto | 4.5 | 4.56 | 2.85 FALLA | 4.23 FALLA | 3.54 FALLA |
| estado_pendiente/superficie_alta | texto | 4.5 | 3.01 FALLA | 6.34 | 3.06 FALLA | 7.88 |
| estado_completada/superficie_alta | texto | 4.5 | 2.96 FALLA | 7.18 | 3.04 FALLA | 8.92 |
| tinta/relleno_vencida | texto | 4.5 | 11.60 | 10.56 | 9.19 | 12.65 |
| tinta/relleno_pendiente | texto | 4.5 | 13.51 | 7.44 | 10.55 | 8.95 |
| tinta/relleno_completada | texto | 4.5 | 13.22 | 7.29 | 10.26 | 8.71 |
| estado_vencida/superficie_alta (punto o icono) | icono | 3.0 | 4.56 | 2.85 FALLA | 4.23 | 3.54 |
| estado_pendiente/superficie_alta (punto o icono) | icono | 3.0 | 3.01 | 6.34 | 3.06 | 7.88 |
| estado_completada/superficie_alta (punto o icono) | icono | 3.0 | 2.96 FALLA, aceptada en C1 (pendiente) | 7.18 | 3.04 | 8.92 |
| borde/superficie | borde | 3.0 | 16.36 | 6.13 | 4.40 | 4.51 |
| borde/fondo | borde | 3.0 | 16.36 | 6.93 | 4.40 | 4.51 |
| borde_campo/superficie | borde | 3.0 | 5.01 | 4.55 | 4.40 | 4.51 |
| linea/superficie | borde | 3.0 | 1.49 FALLA | 2.12 FALLA | 1.55 FALLA | 1.62 FALLA |
| tinta/superficie (anillo de foco) | borde | 3.0 | 18.30 | 13.76 | 14.22 | 16.75 |
| tinta/fondo (anillo de foco) | borde | 3.0 | 18.30 | 15.56 | 14.22 | 16.75 |
| tinta/marco (anillo de foco) | borde | 3.0 | 16.38 | 15.56 | 9.17 | 5.30 |
| tinta/superficie_baja (trazo y casilla, P1) | borde | 3.0 | 14.85 | 10.62 | 9.17 | 14.22 |
| informacion/superficie_alta (borde e icono del aviso) | borde | 3.0 | 1.68 FALLA | 7.72 | 1.55 FALLA | 3.16 |
| principal_legible/superficie (interruptor, fila seleccionada) | borde | 3.0 | 7.71 | 8.49 | 4.59 | 5.35 |
| principal_legible/superficie_baja (trazo de fila) | borde | 3.0 | 6.25 | 6.55 | 2.96 FALLA | 4.54 |
| seleccion/superficie | borde | 3.0 | 7.71 | 8.49 | 1.55 FALLA | 3.16 |
| seleccion/superficie_baja (casilla sobre fila) | borde | 3.0 | 6.25 | 6.55 | 1.00 FALLA | 2.68 FALLA |
| perilla/principal_legible | borde | 3.0 | 7.71 | 1.75 FALLA | 5.15 | 3.13 |

#### 6.2 Avisos (D1, P2): el texto va en `texto`; el color de estado solo en borde e ícono

El título del aviso va en `texto` y el cuerpo en `tinta` (C2, C18, P2). `estado_pendiente`, `estado_completada`, `error` e `informacion` van solo en borde e ícono, con umbral 3:1.

| par | umbral | claro | oscuro | rosa | enfoque |
|---|---|---|---|---|---|
| Aviso (los 4): titulo texto/superficie_alta | 4.5 | 7.59 | 8.19 | 8.33 | 9.67 |
| Aviso (los 4): cuerpo tinta/superficie_alta | 4.5 | 17.64 | 12.51 | 14.22 | 16.75 |
| Aviso Exito: borde e icono estado_completada/superficie_alta | 3.0 | 2.96 FALLA, aceptada en C1 (pendiente) | 7.18 | 3.04 | 8.92 |
| Aviso Advertencia: borde e icono estado_pendiente/superficie_alta | 3.0 | 3.01 | 6.34 | 3.06 | 7.88 |
| Aviso Error: borde e icono error/superficie_alta | 3.0 | 6.30 | 5.90 | 5.83 | 7.34 |
| Aviso Informacion: borde e icono informacion/superficie_alta | 3.0 | 1.68 FALLA | 7.72 | 1.55 FALLA | 3.16 |

#### 6.3 Resumen de fallos

| par | tema | contraste | umbral | situacion |
|---|---|---|---|---|
| sobre_detalle/detalle | claro | 2.38 | 4.5 | falla; PROPUESTA sobre_detalle #ffffff (7.71), pendiente de Paula |
| principal_legible/superficie_baja | rosa | 2.96 | 4.5 | falla; sin decision, pendiente de Paula |
| estado_vencida/superficie_alta | oscuro | 2.85 | 4.5 | falla como texto; no se usa como texto (C2, C18) |
| estado_vencida/superficie_alta | rosa | 4.23 | 4.5 | falla como texto; no se usa como texto (C2, C18) |
| estado_vencida/superficie_alta | enfoque | 3.54 | 4.5 | falla como texto; no se usa como texto (C2, C18) |
| estado_pendiente/superficie_alta | claro | 3.01 | 4.5 | falla como texto; no se usa como texto (C2, C18) |
| estado_pendiente/superficie_alta | rosa | 3.06 | 4.5 | falla como texto; no se usa como texto (C2, C18) |
| estado_completada/superficie_alta | claro | 2.96 | 4.5 | falla como texto; no se usa como texto (C2, C18) |
| estado_completada/superficie_alta | rosa | 3.04 | 4.5 | falla como texto; no se usa como texto (C2, C18) |
| estado_vencida/superficie_alta (punto o icono) | oscuro | 2.85 | 3.0 | falla; sin decision (C18 lo limita a relleno e icono) |
| estado_completada/superficie_alta (punto o icono) | claro | 2.96 | 3.0 | falla, aceptada en C1 (pendiente) |
| linea/superficie | claro | 1.49 | 3.0 | falla; linea es decorativa (separador de 1 px) |
| linea/superficie | oscuro | 2.12 | 3.0 | falla; linea es decorativa (separador de 1 px) |
| linea/superficie | rosa | 1.55 | 3.0 | falla; linea es decorativa (separador de 1 px) |
| linea/superficie | enfoque | 1.62 | 3.0 | falla; linea es decorativa (separador de 1 px) |
| informacion/superficie_alta (borde e icono del aviso) | claro | 1.68 | 3.0 | falla; sin decision, pendiente de Paula |
| informacion/superficie_alta (borde e icono del aviso) | rosa | 1.55 | 3.0 | falla; sin decision, pendiente de Paula |
| principal_legible/superficie_baja (trazo de fila) | rosa | 2.96 | 3.0 | falla; sin decision, pendiente de Paula |
| seleccion/superficie | rosa | 1.55 | 3.0 | falla; PROPUESTA: la casilla lleva ademas trazo borde de 1,5, pendiente de Paula |
| seleccion/superficie_baja (casilla sobre fila) | rosa | 1.00 | 3.0 | falla; PROPUESTA: la casilla lleva ademas trazo borde de 1,5, pendiente de Paula |
| seleccion/superficie_baja (casilla sobre fila) | enfoque | 2.68 | 3.0 | falla; PROPUESTA: la casilla lleva ademas trazo borde de 1,5, pendiente de Paula |
| perilla/principal_legible | oscuro | 1.75 | 3.0 | falla; PROPUESTA perilla #0b2a2e en oscuro (8.68), pendiente de Paula |
Total de fallos en 6.1: 22 de 168 comprobaciones.

Lectura de los fallos. Ninguno cambia un valor de F0 sin decisión de Paula; lo que sigue marcado PROPUESTA espera su sí en la fase 5:
- `sobre_detalle/detalle` claro (2,38): `#17131d` sobre `#6604e6`. PROPUESTA: `sobre_detalle` claro `#ffffff` (7,71, el mismo contraste que `sobre_seleccion`).
- `estado_*` como texto sobre `superficie_alta`: no llega a 4,5 en 7 de 12 casos (vencida 3: oscuro, rosa y enfoque; pendiente 2: claro y rosa; completada 2: claro y rosa). No importa: el texto del aviso usa `texto` y `estado_*` solo va en relleno, punto, borde e ícono (C2, C18). Como punto o ícono (3:1) fallan `estado_vencida` oscuro (2,85, sin decisión; C18 lo limita a relleno e ícono) y `estado_completada` claro (2,96: falla, aceptada en C1, pendiente).
- `informacion` como borde e ícono (3:1): claro 1,68 y rosa 1,55 (F0 repite `principal`). Es nuevo con P2: antes el color de `informacion` también sostenía el texto. Sin decisión, pendiente de Paula.
- `seleccion/superficie` rosa (1,55) y `seleccion/superficie_baja` rosa (1,00, la casilla es del mismo color que la fila) y enfoque (2,68): PROPUESTA: la casilla marcada lleva además un trazo `borde` de 1,5 (el trazo del control, R6).
- `principal_legible/superficie_baja` rosa (2,96): el trazo de la fila seleccionada y el texto que use ese par en Rosa no llegan ni a 3:1. Sin decisión, pendiente de Paula.
- `perilla/principal_legible` oscuro (1,75): perilla blanca sobre el cian encendido. PROPUESTA: `perilla` oscuro `#0b2a2e` (8,68), coherente con P3.

## 7. Regla de morado y cian

Regla (DECIDIDO, PLAN regla 7, 26-nov): el morado queda donde el Figma lo pinta, pero un mismo control nunca mezcla morado y cian. Donde el Figma los junte, se usa la tinta `#0F2A33`. El cian va solo como relleno, con texto `#0B2A2E` (DECIDIDO P3: es el valor que verifica la prueba, no `#17131d`).

Excepción de P1 (DECIDIDO 26-nov): en el tema oscuro, donde se juntan morado y cian (fila seleccionada, casilla de Tareas, columna de arrastre del Kanban) se usa `tinta` `#f8f5ff` en vez de `#0F2A33`. En claro, Rosa y Enfoque la regla sigue con `#0F2A33`; ahí no hay casos que arreglar.

Clasificación (lista cerrada, sustituye al umbral de saturación 0,25): cuentan como cian `#00d9e2` en claro y oscuro y `#0e4a4d` en oscuro; cuentan como morado `#6604e6` en claro y `#d3b2ff` y `#433258` en oscuro; Rosa y Enfoque no tienen ninguno. La tabla 7.4 lista todos los colores de la tabla 1 con tono en rango y muestra por qué: con el umbral antiguo `#bff5f8` (`burbuja_propia` claro, s = 0,23) quedaba a 0,02 del corte y `#d3b2ff` (s = 0,30) a 0,05, de modo que un cambio mínimo cambiaba el resultado. El guion sale con 1 si aparece un color en rango que no esté clasificado en su lista o si cambia la clase de uno de la tabla 7.4.

Los «controles» son los de F0 §4 con las variables que usan; la lista está en el guion (`CONTROLES`). Las variables de los avisos son las de D1 con P2.

#### 7.1 Variables que cuentan como cian o morado, por tema

| tema | cian | morado |
|---|---|---|
| claro | principal #00d9e2, accion #00d9e2, informacion #00d9e2 | secundario #6604e6, detalle #6604e6, principal_legible #6604e6, seleccion #6604e6 |
| oscuro | principal #00d9e2, accion #00d9e2, burbuja_propia #0e4a4d, principal_legible #00d9e2, informacion #00d9e2, seleccion #00d9e2 | secundario #d3b2ff, superficie_baja #433258, detalle #d3b2ff |
| rosa | ninguna | ninguna |
| enfoque | ninguna | ninguna |

#### 7.2 Controles que mezclan cian y morado

Cada arreglo es un solo valor, decidido (P1, P2). Con los arreglos aplicados el guion cuenta 0 violaciones.

| control | tema | elementos cian | elementos morado | resultado | arreglo decidido (valor unico) |
|---|---|---|---|---|---|
| Fila de lista seleccionada (4.1) | oscuro | trazo=principal_legible | relleno=superficie_baja | VIOLA | trazo: principal_legible -> tinta (P1) |
| Aviso Informacion (D1) | claro | borde=informacion | texto=principal_legible | VIOLA | texto: principal_legible -> texto (P2) |
| Widget Tareas: casilla marcada sobre fila (4.3) | oscuro | casilla=seleccion | relleno=superficie_baja | VIOLA | casilla: seleccion -> tinta (P1) |
| Widget Kanban: columna elegida al arrastrar (F6) | oscuro | trazo=seleccion | relleno=superficie_baja | VIOLA | trazo: seleccion -> tinta (P1) |
Total de violaciones: 4. Tras los arreglos: 0.

Lectura de las violaciones:
- Aviso Información (los cuatro avisos y los cuatro temas): el texto va en `texto` (P2) y `informacion` queda solo en borde e ícono. Solo en claro mezclaba (borde cian, texto morado); el arreglo vale para todos para que el aviso se comporte igual.
- Oscuro: el trazo de la fila seleccionada, la casilla marcada de Tareas (su relleno) y el trazo de la columna de arrastre del Kanban pasan a `tinta` `#f8f5ff` (P1), con el trazo de 2 px de `trazo_seleccion`. La marca ✓ de la casilla no cambia. `tinta` contra `superficie_baja` oscuro da 10,62 (6.1).
- Rosa y Enfoque no tienen variables cian ni morado: no pueden violar la regla. F0 §4.6 pinta el borde del aviso de Información con `#00d9e2` fijo en los cuatro temas; D1 lo reemplaza por `informacion` y así no queda cian en Rosa ni en Enfoque.
- Windi (D2, colores fijos `#00d9e2`, `#6604e6`, `#dc026c`) mezcla cian y morado por diseño. Es una ilustración, no un control: se deja como excepción (PROPUESTA; Paula confirma).
- Los controles de Windgets claro no mezclan: el cian es `accion` y el morado `seleccion`, y no coinciden en ningún control de la lista.

#### 7.3 Texto sobre relleno cian (regla P3: `#0b2a2e`)

| control | tema | relleno | texto | contraste con el relleno | contraste de #0b2a2e | resultado |
|---|---|---|---|---|---|---|
| Boton Principal (4.1) | claro | accion #00d9e2 | sobre_accion #0b2a2e | 8.68 | 8.68 | cumple |
| Boton Principal (4.1) | oscuro | accion #00d9e2 | sobre_accion #0b2a2e | 8.68 | 8.68 | cumple |
| Selector segmentado, opcion elegida (4.1) | oscuro | seleccion #00d9e2 | sobre_seleccion #0b2a2e | 8.68 | 8.68 | cumple |
| Burbuja propia de Windi (4.2) | oscuro | burbuja_propia #0e4a4d | tinta #f8f5ff | 9.26 | 1.52 | excepcion: no es #00d9e2 |
Contrastes de la regla: #0b2a2e/#00d9e2 = 8.68; #0f2a33/#00d9e2 = 8.59; #0f2a33/#6604e6 = 1.95; #0f2a33/#d3b2ff = 8.28; #0b2a2e/#f8f5ff = 14.08.

Notas de 7.3: con P3 el relleno `#00d9e2` lleva `#0b2a2e` (8,68, pasa 4,5) en el botón Principal (claro y oscuro) y en la opción elegida del selector segmentado (oscuro). Eso cambia `sobre_accion` (claro y oscuro) y `sobre_seleccion` (oscuro) en la tabla 1. `burbuja_propia` oscuro (`#0e4a4d`) es un cian apagado con texto claro y contrasta 9,26; con `#0b2a2e` quedaría en 1,52, por eso conserva `tinta`: la regla de texto `#0b2a2e` vale solo para el relleno `#00d9e2` (PROPUESTA; Paula confirma).

#### 7.4 Evidencia de las listas cerradas

Colores de la tabla 1 con tono en rango (165 a 200 o 250 a 290, saturación ≥ 0,05) y cómo se clasifican. Todo color de esta tabla que no sea `neutro` está en 7.1.

| tema | hex | variables | tono | saturacion | valor | cuenta como |
|---|---|---|---|---|---|---|
| claro | #00d9e2 | principal, accion, informacion | 182 | 1.00 | 0.89 | CIAN |
| claro | #6604e6 | secundario, detalle, principal_legible, seleccion | 266 | 0.98 | 0.90 | MORADO |
| claro | #f5f0ff | marco | 260 | 0.06 | 1.00 | neutro |
| claro | #17131d | sobre_marco, tinta, sobre_detalle, velo | 264 | 0.34 | 0.11 | neutro |
| claro | #ede3ff | superficie_baja | 261 | 0.11 | 1.00 | neutro |
| claro | #d9d0e6 | linea | 265 | 0.10 | 0.90 | neutro |
| claro | #554f5e | texto | 264 | 0.16 | 0.37 | neutro |
| claro | #0b2a2e | sobre_accion | 187 | 0.76 | 0.18 | neutro |
| claro | #241c30 | borde, sombra | 264 | 0.42 | 0.19 | neutro |
| claro | #766b81 | borde_campo | 270 | 0.17 | 0.51 | neutro |
| claro | #bff5f8 | burbuja_propia | 183 | 0.23 | 0.97 | neutro |
| oscuro | #00d9e2 | principal, accion, principal_legible, informacion, seleccion | 182 | 1.00 | 0.89 | CIAN |
| oscuro | #d3b2ff | secundario, detalle | 266 | 0.30 | 1.00 | MORADO |
| oscuro | #201b2b | marco, fondo | 259 | 0.37 | 0.17 | neutro |
| oscuro | #2b2534 | superficie | 264 | 0.29 | 0.20 | neutro |
| oscuro | #302d38 | superficie_alta | 256 | 0.20 | 0.22 | neutro |
| oscuro | #433258 | superficie_baja | 267 | 0.43 | 0.35 | MORADO |
| oscuro | #5d566b | linea | 260 | 0.20 | 0.42 | neutro |
| oscuro | #cec7d6 | texto | 268 | 0.07 | 0.84 | neutro |
| oscuro | #0b2a2e | sobre_accion, sobre_seleccion | 187 | 0.76 | 0.18 | neutro |
| oscuro | #afa1c0 | borde | 267 | 0.16 | 0.75 | neutro |
| oscuro | #100d15 | sombra | 262 | 0.38 | 0.08 | neutro |
| oscuro | #948b9e | borde_campo | 268 | 0.12 | 0.62 | neutro |
| oscuro | #0e4a4d | burbuja_propia | 183 | 0.82 | 0.30 | CIAN |
| oscuro | #17131d | sobre_detalle | 264 | 0.34 | 0.11 | neutro |
| enfoque | #1e1d22 | superficie, superficie_alta, fondo | 252 | 0.15 | 0.13 | neutro |
| enfoque | #2b2a30 | superficie_baja | 250 | 0.12 | 0.19 | neutro |
| enfoque | #141316 | sobre_detalle | 260 | 0.14 | 0.09 | neutro |

## 8. Qué falta en el código

Lo que había en el árbol de trabajo el 26-nov-2026. Todas las rutas son relativas a `apps/desktop/`.

### 8.1 Tokens ausentes

| token | detalle |
|---|---|
| Once variables de color | `seleccion`, `velo`, `borde_campo`, `burbuja_propia`, `fondo`, `detalle`, `sobre_detalle`, `principal_legible`, `sobre_seleccion`, `perilla`, `informacion`. No están en `NOMBRES_TOKEN` (`src/ui/tema/tokens.ts:3-23`) ni en `NOMBRES_TOKEN_DE_WINDGETS` (`tokens.ts:29`). De las 32 variables, `TEMAS_DE_WINDGETS` define 21 en claro y oscuro: 15 de la tabla fija más 6 `estado_*` y `relleno_*` derivados. |
| Temas Rosa pastel y Enfoque rojo y negro | `TEMAS_DE_WINDGETS` solo tiene `claro` y `oscuro` (`src/ui/tema/tokens_por_defecto.ts:42-82`). `temasDeWindgets.test.tsx:122-123` lo reconoce. Cualquier otro tema se deriva de tres colores (`derivar.ts:103-120`), no de la tabla. La prueba de la fase 6, que compara cuatro temas, falla hasta que existan; la lista de colores a crear está en 8.1.1. |
| `principal`, `secundario`, `sombra`, `error` en Rosa y Enfoque | Solo se definen en claro y oscuro (`tokens.ts:26-29`). En los otros dos temas la hoja de estilos usa respaldo (`tokens.css:108-112`, `tokens.css:1444-1445`). Forman parte de los 32 colores de 8.1.1. |
| Variable FLOAT `Radio de widgets` (9) | No hay token. El radio del código es `--wg-radio` (`src/ui/tema/tokens.css:64`). |
| Radios, trazos y sombras de la sección 4 | Solo existen `--wg-radio`, `--wg-borde-ancho`, `--wg-sombra` (`tokens.css:62-66`). |
| Fuentes Quicksand y Space Grotesk | No están en `tokens.css:10-58` ni en `assets/fonts/`. |
| Pesos 500, 600 y 700 de Nunito | Solo se declara 400 (`tokens.css:10-15`); `nunito.woff2` es estática, cada peso necesita su archivo (sección 3). El 600 es PROPUESTA Q3. |

#### 8.1.1 Colores que el código debe definir para Rosa y Enfoque

Hoy el código no define ninguno (`tokens_por_defecto.ts:42-82` solo tiene claro y oscuro). Para cada tema hay que crear las 32 variables de la tabla 1, con estos valores (la tabla 1 manda si difieren):

| tema | los 32 colores |
|---|---|
| rosa | `principal` #f2b3cb, `secundario` #6b3550, `marco` #f2b3cb, `sobre_marco` #3a1528, `superficie` #fbeff3, `superficie_alta` #fbeff3, `superficie_baja` #f2b3cb, `linea` #f2b3cb, `tinta` #3a1528, `texto` #6b3550, `accion` #f2b3cb, `sobre_accion` #3a1528, `borde` #b04f7d, `sombra` #b04f7d, `error` #b3261e, `borde_campo` #b04f7d, `burbuja_propia` #fadce7, `fondo` #fbeff3, `detalle` #6b3550, `sobre_detalle` #ffffff, `principal_legible` #905f75, `sobre_seleccion` #3a1528, `perilla` #ffffff, `informacion` #f2b3cb, `seleccion` #f2b3cb, `estado_vencida` #d93226, `relleno_vencida` #f1b6b6, `estado_pendiente` #a9861e, `relleno_pendiente` #e2d0b3, `estado_completada` #1ca048, `relleno_completada` #b8d7c0, `velo` #3a152866 |
| enfoque | `principal` #d1202f, `secundario` #c9c4be, `marco` #d1202f, `sobre_marco` #ffffff, `superficie` #1e1d22, `superficie_alta` #1e1d22, `superficie_baja` #2b2a30, `linea` #6e2a2e, `tinta` #ffffff, `texto` #c9c4be, `accion` #d1202f, `sobre_accion` #ffffff, `borde` #e0565b, `sombra` #e0565b, `error` #ff8a80, `borde_campo` #e0565b, `burbuja_propia` #4a1b22, `fondo` #1e1d22, `detalle` #c9c4be, `sobre_detalle` #141316, `principal_legible` #e16e78, `sobre_seleccion` #ffffff, `perilla` #ffffff, `informacion` #d1202f, `seleccion` #d1202f, `estado_vencida` #d93226, `relleno_vencida` #562323, `estado_pendiente` #d9ac26, `relleno_pendiente` #564823, `estado_completada` #26d962, `relleno_completada` #205535, `velo` #0000008c |

### 8.2 Nombres distintos

| en el código | en F0 o decisiones | detalle |
|---|---|---|
| `--wg-secundario` y `--wg-sobre-secundario` (`tokens.css:1443-1446`; `tokens.ts:47-49`) | `seleccion` y `sobre_seleccion` | Es la opción elegida del selector segmentado (`.wg-segmentado__opcion[aria-pressed='true']`, con respaldo `--wg-accion` y `--wg-sobre-accion`). `--wg-sobre-secundario` lo fija el código a `superficie` (RD-99). F0 da `seleccion` `#6604e6`, `#00d9e2`, `#f2b3cb`, `#d1202f` y `sobre_seleccion` `#ffffff`, `#0b2a2e` (P3), `#3a1528`, `#ffffff`. |
| `--wg-accion` y `--wg-sobre-accion` en el día actual del Calendario (`tokens.css:638-641` y `1085-1088`) | `detalle` y `sobre_detalle` | El código pinta el día actual con la acción (cian). F0 lo pinta con `detalle` (alias de `secundario`: morado en claro) y `sobre_detalle`. `detalle` y `sobre_detalle` serán variables nuevas (8.1); el día actual deja de usar `accion`. |
| `--wg-mensaje-exito`, `--wg-mensaje-advertencia`, `--wg-mensaje-error`, `--wg-sobre-mensaje` (`tokens.css:340-343`) | D1: `estado_completada`, `estado_pendiente`, `error`, `informacion` (borde e ícono); título en `texto` (P2) | D1 manda variables de estado en los avisos. |
| `tamano_fuente` (`tokens.ts:22`) | `Tipografía del tema` | Mismo concepto, otro nombre y otra unidad (ver 8.3). |
| `fuente` (`tokens.ts:21`) | sin variable en `200:2` | La fuente no es variable de color en F0; va por tema (sección 3). |

### 8.3 Valores distintos

| qué | código | F0 o decisión | dónde |
|---|---|---|---|
| Relleno de estado (`relleno_*`) | `mezclar(estado, superficie, 0,3)`: 70 % estado | PROPUESTA Q1, confirma Paula en fase 5: los doce `relleno_*` van como tabla fija con los hex exactos de la tabla 1 por tema, sin fórmula ni tolerancia. La explicación es `mezclar(superficie, estado, 0,3)` (30 % estado), que reproduce 10 de 12 y en los otros dos difiere en 1 unidad de un canal (claro completada `#bce5c9` contra `#bbe5c9`; rosa pendiente `#e2cfb3` contra `#e2d0b3`); la tabla fija las resuelve | `src/ui/tema/derivar.ts:95-97`; tablas 8.4 y 8.4b |
| Estados (`estado_*`) en claro y oscuro | derivados con la fórmula de `derivar.ts:67-76` | igual a la tabla 1 (6 de 6) | tabla 8.4 |
| Tema por defecto (sin sesión) | `principal` de marca `#201B2B`, acción `#E74E98`, fuente Rubik | no coincide con ningún modo de `200:2`; NO DEFINIDO qué tema usa la pantalla sin sesión | `tokens_por_defecto.ts:9-29` |
| Tamaño base (DECIDIDO P4) | `PIXELES_DEL_TAMANO`: pequeño 14, mediano 16, grande 20; `tamano_fuente` `'16px'` | Mediano = 14 (el FLOAT del Figma). Pequeño y Grande escalan en la misma proporción que hoy tiene el código respecto a 16 (0,875 y 1,25), redondeados a entero: Pequeño = 12 (12,25) y Grande = 18 (17,5: empate redondeado hacia arriba). Resultado 12, 14 y 18 | `src/ui/tema/temaAplicado.ts:20`; `tokens_por_defecto.ts:28` (`'16px'` pasa a `'14px'`) |
| `sobre_accion` y `sobre_seleccion` | `sobre_accion` `#17131d` en claro y oscuro; `sobre_seleccion` = `superficie` (`#2b2534` en oscuro) | DECIDIDO P3: `#0b2a2e` sobre relleno cian (claro y oscuro para `sobre_accion`; oscuro para `sobre_seleccion`) | `tokens_por_defecto.ts`; `tokens.ts:47-49` |
| Fuente por defecto | `'Rubik', 'Segoe UI', sans-serif` | Nunito (DECIDIDO) | `tokens_por_defecto.ts:27` |
| Radio | `--wg-radio` = `min(40/3, 12)` = 12 px | 9 (controles) | `tokens.css:64` |
| Trazo | `--wg-borde-ancho` = 1 px | 1,5 (controles) | `tokens.css:65` |
| Sombra | `--wg-sombra` = 1,24 px 3,8 px 0 `borde`; claro y oscuro: `3px 5px 0` con el color de `sombra` | 3, 5, 0, 0 (el valor de `tokens.ts` sí coincide) | `tokens.css:66`; `tokens_por_defecto.ts:59,79` |
| Foco de campo e interruptor | 1 px `accion`, separación 2 px | 2 px `tinta` (D6) | `tokens.css:152-156` |
| Foco de botón | 2 px `tinta`, separación 2 px | 2 px `tinta` (D6); separación PROPUESTA 3 | `tokens.css:149-150` |
| Avisos | `#1e7d3c`, `#b07d00`, `#c62828`, texto `#ffffff` | D1 con P2: variables `estado_completada`, `estado_pendiente`, `error` e `informacion` en borde e ícono; título en `texto` | `tokens.css:340-343` |

Con los cambios de P3, la tabla fija de claro y oscuro coincide con la tabla 1 salvo `sobre_accion` (ver 8.5); los NO de 8.5 son lo que la fase 6 cambia en el código. Con `--exigir-codigo` el guion sale con 1 mientras queden.

#### 8.4 Estados derivados por el código frente a la tabla 1 (claro y oscuro)

| variable | tema | tabla 1 | codigo (derivar.ts) | igual | con mezclar(superficie, estado, 0.3) |
|---|---|---|---|---|---|
| estado_vencida | claro | #d93226 | #d93226 | si | #d93226 (si) |
| relleno_vencida | claro | #f4c2be | #e47067 | NO | #f4c2be (si) |
| estado_pendiente | claro | #b28d1f | #b28d1f | si | #b28d1f (si) |
| relleno_pendiente | claro | #e8ddbc | #c9af62 | NO | #e8ddbc (si) |
| estado_completada | claro | #1ea94c | #1ea94c | si | #1ea94c (si) |
| relleno_completada | claro | #bbe5c9 | #62c382 | NO | #bce5c9 (NO) |
| estado_vencida | oscuro | #d93226 | #d93226 | si | #d93226 (si) |
| relleno_vencida | oscuro | #5f2930 | #a52e2a | NO | #5f2930 (si) |
| estado_pendiente | oscuro | #d9ac26 | #d9ac26 | si | #d9ac26 (si) |
| relleno_pendiente | oscuro | #5f4e30 | #a5842a | NO | #5f4e30 (si) |
| estado_completada | oscuro | #26d962 | #26d962 | si | #26d962 (si) |
| relleno_completada | oscuro | #2a5b42 | #28a354 | NO | #2a5b42 (si) |

#### 8.4b Relleno de estado con la fórmula corregida, en los cuatro temas

Explicación de Q1; la tabla 1 es la que manda.

| variable | tema | tabla 1 | mezclar(superficie, estado, 0.3) | igual |
|---|---|---|---|---|
| relleno_vencida | claro | #f4c2be | #f4c2be | si |
| relleno_pendiente | claro | #e8ddbc | #e8ddbc | si |
| relleno_completada | claro | #bbe5c9 | #bce5c9 | NO |
| relleno_vencida | oscuro | #5f2930 | #5f2930 | si |
| relleno_pendiente | oscuro | #5f4e30 | #5f4e30 | si |
| relleno_completada | oscuro | #2a5b42 | #2a5b42 | si |
| relleno_vencida | rosa | #f1b6b6 | #f1b6b6 | si |
| relleno_pendiente | rosa | #e2d0b3 | #e2cfb3 | NO |
| relleno_completada | rosa | #b8d7c0 | #b8d7c0 | si |
| relleno_vencida | enfoque | #562323 | #562323 | si |
| relleno_pendiente | enfoque | #564823 | #564823 | si |
| relleno_completada | enfoque | #205535 | #205535 | si |
La formula corregida reproduce 10 de 12 rellenos; los demas difieren en 1 unidad de un canal.

#### 8.5 Tabla fija del código frente a la tabla 1 (claro y oscuro)

| variable | tema | tabla 1 | codigo | igual |
|---|---|---|---|---|
| principal | claro | #00d9e2 | #00d9e2 | si |
| secundario | claro | #6604e6 | #6604e6 | si |
| marco | claro | #f5f0ff | #f5f0ff | si |
| sobre_marco | claro | #17131d | #17131d | si |
| superficie | claro | #ffffff | #ffffff | si |
| superficie_alta | claro | #fffbea | #fffbea | si |
| superficie_baja | claro | #ede3ff | #ede3ff | si |
| linea | claro | #d9d0e6 | #d9d0e6 | si |
| tinta | claro | #17131d | #17131d | si |
| texto | claro | #554f5e | #554f5e | si |
| accion | claro | #00d9e2 | #00d9e2 | si |
| sobre_accion | claro | #0b2a2e | #17131d | NO |
| borde | claro | #241c30 | #241c30 | si |
| sombra (x,y,desenfoque,extension,color) | claro | 3,5,0,0,#241c30 | 3,5,0,0,#241c30 | si |
| error | claro | #b3261e | #b3261e | si |
| principal | oscuro | #00d9e2 | #00d9e2 | si |
| secundario | oscuro | #d3b2ff | #d3b2ff | si |
| marco | oscuro | #201b2b | #201b2b | si |
| sobre_marco | oscuro | #f8f5ff | #f8f5ff | si |
| superficie | oscuro | #2b2534 | #2b2534 | si |
| superficie_alta | oscuro | #302d38 | #302d38 | si |
| superficie_baja | oscuro | #433258 | #433258 | si |
| linea | oscuro | #5d566b | #5d566b | si |
| tinta | oscuro | #f8f5ff | #f8f5ff | si |
| texto | oscuro | #cec7d6 | #cec7d6 | si |
| accion | oscuro | #00d9e2 | #00d9e2 | si |
| sobre_accion | oscuro | #0b2a2e | #17131d | NO |
| borde | oscuro | #afa1c0 | #afa1c0 | si |
| sombra (x,y,desenfoque,extension,color) | oscuro | 3,5,0,0,#100d15 | 3,5,0,0,#100d15 | si |
| error | oscuro | #ff8a80 | #ff8a80 | si |
102 diferencia(s).

## 9. Guion de contrastes

Copia el bloque en `contrastes.py` y ejecútalo desde la raíz del repositorio (necesita Python 3.9 o más, sin dependencias):

`python contrastes.py docs/implementacion/TEMAS_Y_TOKENS.md apps/desktop/src/ui/tema/tokens_por_defecto.ts`

```python
#!/usr/bin/env python3
"""Contrastes WCAG 2.x, regla de morado y cian, mapa de etiquetas y comparacion con el codigo.

Uso:
  python contrastes.py docs/implementacion/TEMAS_Y_TOKENS.md [apps/desktop/src/ui/tema/tokens_por_defecto.ts] [--exigir-codigo]

Calcula las tablas derivadas del documento (5.2, 6.1 a 6.3, 7.1 a 7.4, 8.4 y, con el .ts, 8.5), las imprime y
comprueba que cada fila calculada existe igual en el documento. Salida: 0 si no hay diferencias; 1 si las hay (fila
calculada que no esta en el documento, nombre de token que no coincide con tokens.ts, violacion de la regla de morado y
cian despues de los arreglos, o texto sobre cian distinto del decidido). Con --exigir-codigo, ademas sale 1 si los
valores de claro y oscuro de tokens_por_defecto.ts difieren de la tabla de la seccion 1 (comprobacion de la fase 6).
Normalizacion para comparar: hex en minusculas (#rrggbb o #rrggbbaa), espacios colapsados, y sombras como
x,y,desenfoque,extension,#hex (el codigo escribe 3px 5px 0 #241C30: se lee como 3,5,0,0,#241c30)."""
import colorsys
import math
import re
import sys
from pathlib import Path

TEMAS = ["claro", "oscuro", "rosa", "enfoque"]
HEX = r"#[0-9a-f]{6}([0-9a-f]{2})?"


def leer_tabla(ruta):
    """Lee la tabla bajo '## 1.'. Devuelve ({variable: {tema: hex}}, {variable: token del codigo})."""
    texto = Path(ruta).read_text(encoding="utf8")
    bloque = texto.split("\n## 1.", 1)[1].split("\n## 2.", 1)[0]
    datos, tokens = {}, {}
    for fila in bloque.splitlines():
        celdas = [c.strip().strip("`") for c in fila.strip().strip("|").split("|")]
        if len(celdas) >= 6 and re.fullmatch(HEX, celdas[1]):
            datos[celdas[0]] = dict(zip(TEMAS, celdas[1:5]))
            tokens[celdas[0]] = celdas[5]
    return datos, tokens


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def lineal(v):
    v /= 255
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def lum(h):
    r, g, b = (lineal(v) for v in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    x, y = lum(a), lum(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


def lab(h):
    r, g, b = (lineal(v) for v in rgb(h))
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def delta_e(a, b):
    return math.dist(lab(a), lab(b))


def hsv(h):
    r, g, b = (v / 255 for v in rgb(h))
    t, s, v = colorsys.rgb_to_hsv(r, g, b)
    return t * 360, s, v


# Listas cerradas de lo que cuenta como cian y como morado en cada tema (sustituyen al umbral de saturacion 0,25).
# La evidencia esta en la tabla 7.4: todos los colores de la tabla 1 con tono en rango y sus valores de s y v.
CIAN = {"claro": {"#00d9e2"}, "oscuro": {"#00d9e2", "#0e4a4d"}, "rosa": set(), "enfoque": set()}
MORADO = {"claro": {"#6604e6"}, "oscuro": {"#d3b2ff", "#433258"}, "rosa": set(), "enfoque": set()}
CIAN_BRILLANTE = "#00d9e2"  # el unico cian con el que rige el texto #0b2a2e (P3)
TEXTO_SOBRE_CIAN = "#0b2a2e"


def clase(h, tema):
    h = h[:7]
    return "CIAN" if h in CIAN[tema] else "MORADO" if h in MORADO[tema] else "-"


def en_rango(h):
    """Tono cian (165-200) o morado (250-290) con algo de color (s >= 0,05): candidato a clasificar."""
    t, s, _ = hsv(h)
    return s >= 0.05 and (165 <= t <= 200 or 250 <= t <= 290)


# Pares de uso real: (id, primer plano, fondo, umbral, tipo)
PARES = [
    ("texto/superficie", "texto", "superficie", 4.5, "texto"),
    ("texto/superficie_alta", "texto", "superficie_alta", 4.5, "texto"),
    ("texto/superficie_baja", "texto", "superficie_baja", 4.5, "texto"),
    ("texto/fondo", "texto", "fondo", 4.5, "texto"),
    ("tinta/superficie", "tinta", "superficie", 4.5, "texto"),
    ("tinta/superficie_alta", "tinta", "superficie_alta", 4.5, "texto"),
    ("tinta/superficie_baja", "tinta", "superficie_baja", 4.5, "texto"),
    ("tinta/fondo", "tinta", "fondo", 4.5, "texto"),
    ("tinta/marco", "tinta", "marco", 4.5, "texto"),
    ("sobre_marco/marco", "sobre_marco", "marco", 4.5, "texto"),
    ("sobre_accion/accion", "sobre_accion", "accion", 4.5, "texto"),
    ("sobre_seleccion/seleccion", "sobre_seleccion", "seleccion", 4.5, "texto"),
    ("sobre_detalle/detalle", "sobre_detalle", "detalle", 4.5, "texto"),
    ("tinta/burbuja_propia", "tinta", "burbuja_propia", 4.5, "texto"),
    ("principal_legible/superficie", "principal_legible", "superficie", 4.5, "texto"),
    ("principal_legible/superficie_alta", "principal_legible", "superficie_alta", 4.5, "texto"),
    ("principal_legible/superficie_baja", "principal_legible", "superficie_baja", 4.5, "texto"),
    ("error/superficie", "error", "superficie", 4.5, "texto"),
    ("error/superficie_alta", "error", "superficie_alta", 4.5, "texto"),
    ("estado_vencida/superficie_alta", "estado_vencida", "superficie_alta", 4.5, "texto"),
    ("estado_pendiente/superficie_alta", "estado_pendiente", "superficie_alta", 4.5, "texto"),
    ("estado_completada/superficie_alta", "estado_completada", "superficie_alta", 4.5, "texto"),
    ("tinta/relleno_vencida", "tinta", "relleno_vencida", 4.5, "texto"),
    ("tinta/relleno_pendiente", "tinta", "relleno_pendiente", 4.5, "texto"),
    ("tinta/relleno_completada", "tinta", "relleno_completada", 4.5, "texto"),
    ("estado_vencida/superficie_alta (punto o icono)", "estado_vencida", "superficie_alta", 3.0, "icono"),
    ("estado_pendiente/superficie_alta (punto o icono)", "estado_pendiente", "superficie_alta", 3.0, "icono"),
    ("estado_completada/superficie_alta (punto o icono)", "estado_completada", "superficie_alta", 3.0, "icono"),
    ("borde/superficie", "borde", "superficie", 3.0, "borde"),
    ("borde/fondo", "borde", "fondo", 3.0, "borde"),
    ("borde_campo/superficie", "borde_campo", "superficie", 3.0, "borde"),
    ("linea/superficie", "linea", "superficie", 3.0, "borde"),
    ("tinta/superficie (anillo de foco)", "tinta", "superficie", 3.0, "borde"),
    ("tinta/fondo (anillo de foco)", "tinta", "fondo", 3.0, "borde"),
    ("tinta/marco (anillo de foco)", "tinta", "marco", 3.0, "borde"),
    ("tinta/superficie_baja (trazo y casilla, P1)", "tinta", "superficie_baja", 3.0, "borde"),
    ("informacion/superficie_alta (borde e icono del aviso)", "informacion", "superficie_alta", 3.0, "borde"),
    ("principal_legible/superficie (interruptor, fila seleccionada)", "principal_legible", "superficie", 3.0, "borde"),
    ("principal_legible/superficie_baja (trazo de fila)", "principal_legible", "superficie_baja", 3.0, "borde"),
    ("seleccion/superficie", "seleccion", "superficie", 3.0, "borde"),
    ("seleccion/superficie_baja (casilla sobre fila)", "seleccion", "superficie_baja", 3.0, "borde"),
    ("perilla/principal_legible", "perilla", "principal_legible", 3.0, "borde"),
]

# Situacion de cada fallo conocido: por (par, tema) o por par. Lo que no aparece aqui es "falla".
SITUACION = {
    ("estado_completada/superficie_alta (punto o icono)", "claro"): "falla, aceptada en C1 (pendiente)",
    ("sobre_detalle/detalle", "claro"): "falla; PROPUESTA sobre_detalle #ffffff (7.71), pendiente de Paula",
    ("estado_vencida/superficie_alta (punto o icono)", "oscuro"): "falla; sin decision (C18 lo limita a relleno e icono)",
    ("informacion/superficie_alta (borde e icono del aviso)", "claro"): "falla; sin decision, pendiente de Paula",
    ("informacion/superficie_alta (borde e icono del aviso)", "rosa"): "falla; sin decision, pendiente de Paula",
    ("seleccion/superficie_baja (casilla sobre fila)", "rosa"): "falla; PROPUESTA: la casilla lleva ademas trazo borde de 1,5, pendiente de Paula",
    ("seleccion/superficie_baja (casilla sobre fila)", "enfoque"): "falla; PROPUESTA: la casilla lleva ademas trazo borde de 1,5, pendiente de Paula",
    ("seleccion/superficie", "rosa"): "falla; PROPUESTA: la casilla lleva ademas trazo borde de 1,5, pendiente de Paula",
    ("perilla/principal_legible", "oscuro"): "falla; PROPUESTA perilla #0b2a2e en oscuro (8.68), pendiente de Paula",
    "linea/superficie": "falla; linea es decorativa (separador de 1 px)",
    "estado_vencida/superficie_alta": "falla como texto; no se usa como texto (C2, C18)",
    "estado_pendiente/superficie_alta": "falla como texto; no se usa como texto (C2, C18)",
    "estado_completada/superficie_alta": "falla como texto; no se usa como texto (C2, C18)",
}

# Avisos (D1, P2): el texto va en `texto`; el color de estado va solo en borde e icono (umbral 3:1).
AVISOS = [
    ("Aviso (los 4): titulo texto/superficie_alta", "texto", "superficie_alta", 4.5),
    ("Aviso (los 4): cuerpo tinta/superficie_alta", "tinta", "superficie_alta", 4.5),
    ("Aviso Exito: borde e icono estado_completada/superficie_alta", "estado_completada", "superficie_alta", 3.0),
    ("Aviso Advertencia: borde e icono estado_pendiente/superficie_alta", "estado_pendiente", "superficie_alta", 3.0),
    ("Aviso Error: borde e icono error/superficie_alta", "error", "superficie_alta", 3.0),
    ("Aviso Informacion: borde e icono informacion/superficie_alta", "informacion", "superficie_alta", 3.0),
]

# Controles de F0 seccion 4 con las variables que dicen el Figma y D1 (antes de los arreglos).
CONTROLES = [
    ("Boton Principal (4.1)", {"relleno": "accion", "texto": "sobre_accion", "borde": "borde", "sombra": "sombra"}),
    ("Boton Secundario (4.1)", {"relleno": "superficie", "texto": "tinta", "borde": "borde"}),
    ("Boton Secundario, puntero encima (4.1)", {"relleno": "superficie_baja", "texto": "tinta", "borde": "borde"}),
    ("Boton Destructivo (4.1)", {"relleno": "superficie", "texto": "error", "borde": "error"}),
    ("Selector segmentado, opcion elegida (4.1)", {"relleno": "seleccion", "texto": "sobre_seleccion", "borde": "borde"}),
    ("Fila de lista seleccionada (4.1)", {"relleno": "superficie_baja", "texto": "tinta", "trazo": "principal_legible"}),
    ("Campo editable, foco (4.1)", {"relleno": "superficie", "texto": "texto", "borde": "borde_campo", "anillo": "tinta"}),
    ("Interruptor encendido (4.1)", {"relleno": "principal_legible", "borde": "principal_legible", "perilla": "perilla"}),
    ("Casilla de tarjeta marcada (4.1)", {"relleno": "seleccion", "borde": "seleccion"}),
    ("Aviso Informacion (D1)", {"relleno": "superficie_alta", "texto": "principal_legible", "borde": "informacion"}),
    ("Aviso Exito (D1)", {"relleno": "superficie_alta", "texto": "estado_completada", "borde": "estado_completada"}),
    ("Aviso Advertencia (D1)", {"relleno": "superficie_alta", "texto": "estado_pendiente", "borde": "estado_pendiente"}),
    ("Aviso Error (D1)", {"relleno": "superficie_alta", "texto": "error", "borde": "error"}),
    ("Widget Calendario, dia actual (4.3)", {"relleno": "detalle", "texto": "sobre_detalle", "fondo": "superficie"}),
    ("Widget Tareas: casilla marcada sobre fila (4.3)", {"relleno": "superficie_baja", "casilla": "seleccion", "texto": "tinta"}),
    ("Widget Kanban: columna elegida al arrastrar (F6)", {"relleno": "superficie_baja", "trazo": "seleccion", "texto": "tinta"}),
    ("Burbuja propia de Windi (4.2)", {"relleno": "burbuja_propia", "texto": "tinta", "borde": "borde"}),
    ("Barra lateral (4.5)", {"relleno": "marco", "texto": "sobre_marco"}),
]

# Arreglos decididos: (control, tema o None = todos, rol, variable nueva, decision).
ARREGLOS = [
    ("Fila de lista seleccionada (4.1)", "oscuro", "trazo", "tinta", "P1"),
    ("Widget Tareas: casilla marcada sobre fila (4.3)", "oscuro", "casilla", "tinta", "P1"),
    ("Widget Kanban: columna elegida al arrastrar (F6)", "oscuro", "trazo", "tinta", "P1"),
    ("Aviso Informacion (D1)", None, "texto", "texto", "P2"),
    ("Aviso Exito (D1)", None, "texto", "texto", "P2"),
    ("Aviso Advertencia (D1)", None, "texto", "texto", "P2"),
    ("Aviso Error (D1)", None, "texto", "texto", "P2"),
]

CATALOGO = [
    ("Gris", "#8a8d98"), ("Rojo", "#e5484d"), ("Naranja", "#f76b15"), ("Amarillo", "#dcba04"),
    ("Verde", "#30a46c"), ("Cian", "#00d9e2"), ("Azul", "#3e63dd"), ("Morado", "#6604e6"), ("Rosa", "#dc026c"),
]
EJEMPLOS = [
    ("#2b7a8c", "etiqueta Universidad (F2a, F2b)"), ("#b8692a", "etiqueta Personal (F2a, F2b)"),
    ("#2e8b57", "etiqueta Salud (F2a, F2b)"), ("#b04f7d", "etiqueta Proyecto (F2a, F2b)"),
    ("#3b82f6", "punto de Etiqueta Lectura, Windi (F3 6)"), ("#2a6f8f", "ficha Universidad, variante (C9)"),
    ("#b8692e", "ficha Personal, variante (C9)"),
    ("#8a8d98", "punto Kanban Por hacer (F6 3)"), ("#3e63dd", "punto Kanban En progreso (F6 3)"),
    ("#30a46c", "punto Kanban Hecho (F6 3)"),
]
# Mapa decidido (Q2, PROPUESTA): el mas cercano en Lab, salvo estas dos excepciones que van por tono.
POR_TONO = {"#2b7a8c": "Cian", "#2a6f8f": "Cian"}


def fmt(v):
    return f"{v:.2f}"


def por_tono(h):
    """Catalogo sin Gris, por distancia circular de tono HSV (solo informativo)."""
    t0 = hsv(h)[0]

    def dist(c):
        d = abs(hsv(c[1])[0] - t0)
        return min(d, 360 - d)

    c = min((c for c in CATALOGO if c[0] != "Gris"), key=dist)
    return f"{c[0]} {c[1]}"


def hsl_hex(h, s, l):
    s, l = s / 100, l / 100
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs(((h / 60) % 2) - 1))
    m = l - c / 2
    r, g, b = ((c, x, 0) if h < 60 else (x, c, 0) if h < 120 else (0, c, x) if h < 180
               else (0, x, c) if h < 240 else (x, 0, c) if h < 300 else (c, 0, x))
    return "#" + "".join(f"{round((v + m) * 255):02x}" for v in (r, g, b))


def derivar_estado(tono, superficie):
    """Port de derivar.ts: estado(tono, superficie)."""
    paso = -1 if lum(superficie) >= 0.18 else 1
    l = 50
    while 0 <= l <= 100:
        c = hsl_hex(tono, 70, l)
        if contraste(c, superficie) >= 3:
            return c
        l += paso
    return "#121216" if contraste("#121216", superficie) >= contraste("#ffffff", superficie) else "#ffffff"


def mezclar(a, b, n):
    """n de b y 1-n de a."""
    return "#" + "".join(f"{round(x * (1 - n) + y * n):02x}" for x, y in zip(rgb(a), rgb(b)))


def normalizar_sombra(texto):
    """'3px 5px 0 #241C30' -> '3,5,0,0,#241c30' (x,y,desenfoque,extension,#hex)."""
    hexa = re.search(r"#[0-9a-fA-F]{6}", texto).group(0)
    resto = texto.replace(hexa, " ")
    nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", resto)]
    nums = (nums + [0, 0, 0, 0])[:4]
    return ",".join(f"{n:g}" for n in nums) + "," + hexa.lower()


def normalizar_linea(l):
    return re.sub(r"\s+", " ", l.strip()).lower()


def aplicar_arreglos(controles):
    salida = []
    for nombre, roles in controles:
        por_tema = {}
        for t in TEMAS:
            r = dict(roles)
            for c, tema, rol, var, _ in ARREGLOS:
                if c == nombre and tema in (None, t):
                    r[rol] = var
            por_tema[t] = r
        salida.append((nombre, por_tema))
    return salida


def mezclas(d, roles, t):
    c = [f"{r}={v}" for r, v in roles.items() if clase(d[v][t], t) == "CIAN"]
    m = [f"{r}={v}" for r, v in roles.items() if clase(d[v][t], t) == "MORADO"]
    return c, m


def bloque_codigo(ts_src, tema):
    """Devuelve el texto del bloque tokens: { ... } de un tema en tokens_por_defecto.ts."""
    return ts_src.split(f"  {tema}: {{", 1)[1].split("tokens: {", 1)[1].split("},", 1)[0]


def generar(d, ts_src=None):
    """Devuelve (lineas, errores). Las lineas que empiezan por ### abren una seccion; el resto son filas o totales."""
    L, errores = [], []
    p = L.append

    # 5.2 Mapa de etiquetas
    p("### 5.2 Mapa al catalogo")
    p("| color de ejemplo | donde | mas cercano (Lab) | deltaE | mas cercano (RGB) | distancia RGB | coinciden | solo por tono (sin Gris) | asignado (Q2) |")
    p("|---|---|---|---|---|---|---|---|---|")
    no_coinciden = 0
    for h, donde in EJEMPLOS:
        lb = min(CATALOGO, key=lambda c: delta_e(h, c[1]))
        rg = min(CATALOGO, key=lambda c: math.dist(rgb(h), rgb(c[1])))
        no_coinciden += lb != rg
        if h in POR_TONO:
            nombre = POR_TONO[h]
            asignado = f"{nombre} {dict(CATALOGO)[nombre]} (por tono, Q2)"
        else:
            asignado = f"{lb[0]} {lb[1]}"
        p(f"| {h} | {donde} | {lb[0]} {lb[1]} | {delta_e(h, lb[1]):.1f} | {rg[0]} {rg[1]} | {math.dist(rgb(h), rgb(rg[1])):.0f} | {'si' if lb == rg else 'NO'} | {por_tono(h)} | {asignado} |")
    p(f"Lab y RGB no coinciden en {no_coinciden} de {len(EJEMPLOS)} colores de ejemplo.")

    # 6.1 Pares de uso real
    p("### 6.1 Pares de uso real")
    p("| par | tipo | umbral | claro | oscuro | rosa | enfoque |")
    p("|---|---|---|---|---|---|---|")
    fallos = []
    for nombre, fg, bg, um, tipo in PARES:
        celdas = []
        for t in TEMAS:
            r = contraste(d[fg][t][:7], d[bg][t][:7])
            ok = r >= um
            sit = SITUACION.get((nombre, t), SITUACION.get(nombre, "falla; sin decision, pendiente de Paula"))
            celdas.append(fmt(r) + ("" if ok else " FALLA" + (", aceptada en C1 (pendiente)" if sit.startswith("falla, aceptada") else "")))
            if not ok:
                fallos.append((nombre, t, r, um, sit))
        p(f"| {nombre} | {tipo} | {um} | " + " | ".join(celdas) + " |")

    # 6.2 Avisos
    p("### 6.2 Avisos (D1, P2): texto en `texto`; el color de estado solo en borde e icono")
    p("| par | umbral | claro | oscuro | rosa | enfoque |")
    p("|---|---|---|---|---|---|")
    for nombre, fg, bg, um in AVISOS:
        celdas = []
        for t in TEMAS:
            r = contraste(d[fg][t][:7], d[bg][t][:7])
            marca = ""
            if r < um:
                marca = " FALLA" + (", aceptada en C1 (pendiente)" if (fg == "estado_completada" and t == "claro") else "")
            celdas.append(fmt(r) + marca)
        p(f"| {nombre} | {um} | " + " | ".join(celdas) + " |")

    # 6.3 Resumen de fallos
    p("### 6.3 Resumen de fallos")
    p("| par | tema | contraste | umbral | situacion |")
    p("|---|---|---|---|---|")
    for nombre, t, r, um, sit in fallos:
        p(f"| {nombre} | {t} | {fmt(r)} | {um} | {sit} |")
    p(f"Total de fallos en 6.1: {len(fallos)} de {len(PARES) * 4} comprobaciones.")

    # 7.1 Listas cerradas
    p("### 7.1 Variables que cuentan como cian o morado (listas cerradas por tema)")
    p("| tema | cian | morado |")
    p("|---|---|---|")
    for t in TEMAS:
        c = [f"{v} {d[v][t][:7]}" for v in d if clase(d[v][t], t) == "CIAN"]
        m = [f"{v} {d[v][t][:7]}" for v in d if clase(d[v][t], t) == "MORADO"]
        p(f"| {t} | {', '.join(c) or 'ninguna'} | {', '.join(m) or 'ninguna'} |")

    # 7.2 Mezclas segun el Figma y D1, con su arreglo
    p("### 7.2 Controles que mezclan cian y morado segun el Figma y D1")
    p("| control | tema | elementos cian | elementos morado | resultado | arreglo decidido (valor unico) |")
    p("|---|---|---|---|---|---|")
    n_antes = 0
    for nombre, roles in CONTROLES:
        for t in TEMAS:
            c, m = mezclas(d, roles, t)
            if c and m:
                n_antes += 1
                arr = "; ".join(f"{rol}: {roles[rol]} -> {var} ({dec})" for cn, tema, rol, var, dec in ARREGLOS
                                if cn == nombre and tema in (None, t) and roles[rol] != var)
                p(f"| {nombre} | {t} | {', '.join(c)} | {', '.join(m)} | VIOLA | {arr or 'SIN ARREGLO'} |")
                if not arr:
                    errores.append(f"violacion sin arreglo: {nombre} ({t})")
    n_despues = 0
    for nombre, por_tema in aplicar_arreglos(CONTROLES):
        for t in TEMAS:
            c, m = mezclas(d, por_tema[t], t)
            if c and m:
                n_despues += 1
                errores.append(f"violacion tras los arreglos: {nombre} ({t})")
    p(f"Total de violaciones: {n_antes}. Tras los arreglos: {n_despues}.")

    # 7.3 Texto sobre relleno cian, con los arreglos aplicados
    p("### 7.3 Texto sobre relleno cian (regla P3: #0b2a2e sobre #00d9e2)")
    p("| control | tema | relleno | texto | contraste con el relleno | contraste de #0b2a2e | resultado |")
    p("|---|---|---|---|---|---|---|")
    for nombre, por_tema in aplicar_arreglos(CONTROLES):
        for t in TEMAS:
            roles = por_tema[t]
            if "relleno" not in roles or "texto" not in roles:
                continue
            rel = d[roles["relleno"]][t][:7]
            if clase(rel, t) != "CIAN":
                continue
            tx = d[roles["texto"]][t][:7]
            if rel == CIAN_BRILLANTE:
                res = "cumple" if tx == TEXTO_SOBRE_CIAN else "NO CUMPLE"
                if tx != TEXTO_SOBRE_CIAN:
                    errores.append(f"texto sobre cian distinto de {TEXTO_SOBRE_CIAN}: {nombre} ({t}) {tx}")
            else:
                res = "excepcion: no es #00d9e2"
            p(f"| {nombre} | {t} | {roles['relleno']} {rel} | {roles['texto']} {tx} | {fmt(contraste(tx, rel))} | {fmt(contraste(TEXTO_SOBRE_CIAN, rel))} | {res} |")
    p("Contrastes de la regla: #0b2a2e/#00d9e2 = %s; #0f2a33/#00d9e2 = %s; #0f2a33/#6604e6 = %s; #0f2a33/#d3b2ff = %s; #0b2a2e/#f8f5ff = %s."
      % (fmt(contraste('#0b2a2e', '#00d9e2')), fmt(contraste('#0f2a33', '#00d9e2')),
         fmt(contraste('#0f2a33', '#6604e6')), fmt(contraste('#0f2a33', '#d3b2ff')), fmt(contraste('#0b2a2e', '#f8f5ff'))))

    # 7.4 Evidencia de las listas cerradas
    p("### 7.4 Colores con tono en rango (165-200 o 250-290, saturacion >= 0,05) y como se clasifican")
    p("| tema | hex | variables | tono | saturacion | valor | cuenta como |")
    p("|---|---|---|---|---|---|---|")
    for t in TEMAS:
        vistos = {}
        for v in d:
            h = d[v][t][:7]
            if en_rango(h):
                vistos.setdefault(h, []).append(v)
        for h, vs in vistos.items():
            tono, s, val = hsv(h)
            cl = clase(h, t)
            p(f"| {t} | {h} | {', '.join(vs)} | {tono:.0f} | {s:.2f} | {val:.2f} | {'neutro' if cl == '-' else cl} |")

    # 8.4 Estados y rellenos
    p("### 8.4 Estados derivados por el codigo frente a la tabla 1 (claro y oscuro)")
    p("| variable | tema | tabla 1 | codigo (derivar.ts) | igual | con mezclar(superficie, estado, 0.3) |")
    p("|---|---|---|---|---|---|")
    for t in ("claro", "oscuro"):
        sup = d["superficie"][t]
        for nombre, tono in (("vencida", 4), ("pendiente", 45), ("completada", 140)):
            e = derivar_estado(tono, sup)
            for pref, val in (("estado_", e), ("relleno_", mezclar(e, sup, 0.3))):
                v = pref + nombre
                alt = mezclar(sup, e, 0.3) if pref == "relleno_" else val
                p(f"| {v} | {t} | {d[v][t]} | {val} | {'si' if val == d[v][t] else 'NO'} | {alt} ({'si' if alt == d[v][t] else 'NO'}) |")
    p("### 8.4b Relleno de estado con la formula corregida, en los cuatro temas (explicacion de Q1; la tabla 1 es la que manda)")
    p("| variable | tema | tabla 1 | mezclar(superficie, estado, 0.3) | igual |")
    p("|---|---|---|---|---|")
    iguales = total = 0
    for t in TEMAS:
        for nombre in ("vencida", "pendiente", "completada"):
            v = "relleno_" + nombre
            f = mezclar(d["superficie"][t], d["estado_" + nombre][t], 0.3)
            total += 1
            iguales += f == d[v][t]
            p(f"| {v} | {t} | {d[v][t]} | {f} | {'si' if f == d[v][t] else 'NO'} |")
    p(f"La formula corregida reproduce {iguales} de {total} rellenos; los demas difieren en 1 unidad de un canal.")

    # 8.5 Tabla fija del codigo
    if ts_src:
        p("### 8.5 Tabla fija del codigo frente a la tabla 1 (claro y oscuro)")
        p("| variable | tema | tabla 1 | codigo | igual |")
        p("|---|---|---|---|---|")
        for t in ("claro", "oscuro"):
            for k, v in re.findall(r"(\w+): '([^']+)'", bloque_codigo(ts_src, t)):
                if k in ("fuente", "tamano_fuente"):
                    continue
                if k == "sombra":
                    esperado = f"3,5,0,0,{d['sombra'][t]}"
                    real = normalizar_sombra(v)
                    p(f"| sombra (x,y,desenfoque,extension,color) | {t} | {esperado} | {real} | {'si' if esperado == real else 'NO'} |")
                    continue
                v = v.lower()
                p(f"| {k} | {t} | {d[k][t]} | {v} | {'si' if d[k][t] == v else 'NO'} |")
    return L, errores


def main(ruta, ts=None, exigir_codigo=False):
    d, tokens = leer_tabla(ruta)
    print(f"<!-- variables leidas: {len(d)} -->")
    ts_src = Path(ts).read_text(encoding="utf8") if ts else None
    L, errores = generar(d, ts_src)
    for l in L:
        print(l)
    doc = {normalizar_linea(l) for l in Path(ruta).read_text(encoding="utf8").splitlines()}
    for l in L:
        if l.startswith("###") or not l.strip():
            continue
        if normalizar_linea(l) not in doc:
            errores.append(f"fila calculada que no esta en el documento: {l}")
    if len(d) != 32:
        errores.append(f"la tabla 1 debe tener 32 variables y tiene {len(d)}")
    if ts:
        src = Path(ts).with_name("tokens.ts").read_text(encoding="utf8")
        existentes = set(re.findall(r"'(\w+)'", src.split("NOMBRES_TOKEN = [", 1)[1].split("] as const", 1)[0]))
        existentes |= set(re.findall(r"'(\w+)'", src.split("NOMBRES_TOKEN_DE_WINDGETS = [", 1)[1].split("] as const", 1)[0]))
        for v, tok in tokens.items():
            if tok == "FALTA" and v in existentes:
                errores.append(f"{v}: la tabla dice FALTA y tokens.ts ya lo define")
            if tok != "FALTA" and (tok != v or v not in existentes):
                errores.append(f"{v}: la tabla dice {tok} y tokens.ts no lo define con ese nombre")
        if exigir_codigo:
            for l in L:
                if l.startswith("| ") and l.rstrip().endswith("| NO |") and l.count("|") == 6 and "tabla 1" not in l:
                    errores.append(f"el codigo difiere de la tabla 1: {l}")
    print()
    if errores:
        for e in errores:
            print("DIFERENCIA:", e)
        print(f"{len(errores)} diferencia(s).")
        return 1
    print("Sin diferencias.")
    return 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sys.exit(main(args[0], args[1] if len(args) > 1 else None, "--exigir-codigo" in sys.argv))
```
