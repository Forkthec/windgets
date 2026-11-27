# F0b · Mediciones complementarias de fundamentos (solo lectura)

Fecha 2026-11-26. Llamadas al conector: **5** (1 `get_figma_skill` + 4 `use_figma`), tope 12. Variables = nombres de `200:2`; hex = valor fijo sin variable. Posiciones relativas al nodo medido.

## 1. Barra lateral `204:32251`

Huellas: `huellas/204-32252.json` (Ampliado) y `huellas/204-32300.json` (Contraído).

| Dato | 204:32252 Ampliado 176×560 | 204:32300 Contraído 56×560 |
|---|---|---|
| Relleno | $marco, sin borde, sin sombra, radio 0, **sin autolayout** (todo posicionado a mano) | igual |
| Logo | marco 24×24 en (11,15); 4 vectores con **trazo hex fijo** #00d9e2 #dc026c #dcba04 #6200d9 (el violeta es #6200d9, no #6604e6) | (3,15) |
| Rótulo «windgets» | Rubik Medium 19, $sobre_marco, (42,16) 85×23 | — |
| Botón «Ocultar menú» / «Ampliar menú» | marco 36×36 en (140,9), sin relleno ni borde; ícono 18×18, trazo 1.35 $sobre_marco | 30×36 en (26,9) (cortado: 26+30=56) |
| Rótulos de bloque | «PLANIFICADOR» (14,63) y «PERSONALIZACIÓN» (14,335), Rubik Medium 10, $sobre_marco, alto 12 | sin rótulos |
| Ítem | marco 164×34, radio 6, x=6, sin relleno ni borde; ícono 18×18 en (+8,+8), trazo 1.35; texto Rubik Medium 13 en x=39, y+9, alto 15 (Cerrar sesión: Regular 13) | ítem 40×34, x=8, solo ícono en (+10,+8) |
| Padding/gap | no hay autolayout. Equivale a: padding lateral 6, alto de ítem 34, paso vertical 39 (**gap 5**), ícono→texto 7 px (ícono acaba en x=32, texto en 39) | lateral 8 |
| Bloques (y) | Planificador: Planificador diario 82, Kanban 121, Calendario 160, Agenda 199, Reportes 238, Etiquetas 277. Personalización: Personalización 356 (ampliado) / 335 (contraído, sin rótulo). Pie: Configuración 464, Cerrar sesión 506 (borde inferior 540, margen 20) | Personalización en 335 (en ampliado el rótulo está en 335 y el ítem en 356) |
| Ítem activo | **no existe en el componente** (ningún ítem tiene relleno). Lo pone cada pantalla por override: en `217:10646` «Nav · Planificador diario» lleva relleno **$detalle**, radio **8** (los demás 6), texto e ícono **$sobre_detalle** | — (no medido en contraído) |
| Hover | **no existe**: la barra solo tiene propiedades Tema y Menú; sin variante, sin capa y sin reacción de prototipo. No medible |
| Contraer/expandir | ON_CLICK → CHANGE_TO Contraído↔Ampliado, instantáneo (de F0 §5) |

Íconos: 18×18 con trazo 1.35 (no 1.6 como los de 20×20).

## 2. Foco y hover de controles (`2003:266`)

Anillo = hijo `Anillo de foco` (RECTANGLE sin relleno), alineación de trazo INSIDE, fuera del control y dibujado encima.

| Componente (variante) | Tamaño del control | Anillo: x,y / tamaño | Offset | Grosor | Radio (control → anillo) | Color |
|---|---|---|---|---|---|---|
| Botón (Principal/Secundario/Destructivo · Normal · Foco) | 74×36, r 9 | -4,-4 / 82×44 | **4 px** por lado | **2** | 9 → **12** | **$tinta** |
| Botón ícono | (según F0) 36×36 r 9 | anillo 2 $tinta r12 (F0) | no remedido | 2 | 9 → 12 | $tinta |
| Campo editable · Foco | 260×36, r 9 | -4,-4 / 268×44 | **4** | **1** | 9 → **12** | **$principal_legible** (el borde del campo se queda en $borde_campo 1.5) |
| Interruptor · Foco (Encendido y Apagado) | 44×24, r 8 | -4,-4 / 52×32 | **4** | **1** | 8 → **11** | **$principal_legible** |
| Mensaje emergente · Foco | (F0) 2 $tinta r6 | — | no remedido | 2 | 21 → 6 | $tinta |

Hover:

| Componente | Cómo se hace el hover | Valor |
|---|---|---|
| Botón **Principal** · Puntero encima | **No cambia el relleno** ($accion sigue igual, borde y sombra iguales). Añade hijo `Capa de puntero`: RECTANGLE 74×36 en (0,0), r 9, relleno **$tinta con opacidad 0,14** | tinta @14 % encima |
| Botón Secundario/Destructivo · Puntero encima | relleno $superficie_baja (F0) | — |
| Botón · Deshabilitado | opacidad **0,45** del componente (Principal: relleno $superficie, texto $borde, borde $borde) | nuevo dato |
| Campo · Puntero encima | borde 1.5 $tinta (F0) | — |
| Interruptor Apagado normal | relleno $superficie, borde 1.5 $borde_campo, perilla 16×16 r5 $borde_campo en (4,4); Encendido: $principal_legible, perilla $perilla en (24,4) | hover no remedido (cupo) |

## 3. Windi `2004:334` (48×48, vectores fijos)

Base común (Normal): marco «Windi» 48×48 con «Amarillo» 47.5×47.5 en (1,14) relleno **#ffca22 fijo**, trazo $borde 1.5 (única variable); «Ojos» (14,23.5) 18.5×4.5, dos vectores #27152b; «Boca» (20,29) 4.5×1.5, trazo #27152b 1.

| Estado | Qué cambia respecto de Normal |
|---|---|
| Normal | — |
| Hover | Añade «Onda 1» (6,9) 7×7 y «Onda 2» (1,4) 12×12, trazo #6604e6 1.5; y una instancia «Nombre emergente» (Posición=Arriba) en (-4,-38) 56×36: globo r6 $tinta, texto «Windi» Nunito Medium 13 $fondo. La cara no cambia |
| Con propuesta | Añade «Punto de propuesta»: elipse 8×8 en (37,5), relleno **#6604e6 fijo** |
| Escribiendo | Solo «Ojos» se desplaza 2 px a la derecha (x 16 en vez de 14, y igual); cara y color iguales |
| Sin conexión o error | Añade «Ojo cerrado 1» (14,26) 3×1 y «Ojo cerrado 2» (29.5,25) 3×1, trazo #27152b 1.2, y «Boca recta» (20,30) 4.5×0, trazo #27152b 1.2; **los ojos y la boca de Normal siguen en el marco** (se sobreponen, no se ocultan en esta medición) |

Los vectores no cambian de forma salvo esas capas; los colores son hex fijos (no siguen el tema). La variante grande `2004:377` Sin conexión: mismos añadidos a 193×120 (ojos cerrados, boca recta, «Ondas» trazo #806dac).

## 4. Avisos (mensajes emergentes) 217:17624 / 17631 / 17645 / 17673

Los cuatro nodos son: 17624 = set Éxito (Visible 217:17625); **17631 = variante «En pausa» de Éxito**; 17645 = «En pausa» de Información; 17673 = «En pausa» de Error. (Advertencia 217:17652 no estaba en el encargo.)

| Medida | Valor (igual en Éxito, Información y Error) |
|---|---|
| Contenedor «Cerrar» | marco **26×30** en (290,6), radio **4**, sin relleno ni borde; borde derecho a 4 px del aviso (290+26=316 de 320) |
| «×» texto | «×» Rubik Regular 17, $tinta, caja 10×20 en (296,9) (centrada en el marco de 26) |
| Ícono «Ícono · Cerrar» | instancia `Icono / Cerrar` 16×16 en (295,13), trazo 1.5 $tinta, glifo 10×10 — **dibujado a la vez que el «×»** (dos «×» superpuestos; incoherencia) |
| Botón de cierre completo | alto 30 > alto del aviso útil; centrado verticalmente (6+30+6 = 42) |
| Ícono de tipo | instancia 16×16 en (13,13) con **trazo fijo** (#168451, #00d9e2, #b32d42) y además un texto glifo «✓» / «i» / «×» Rubik Medium 15 en (12,11) encima |
| Franja izquierda | RECTANGLE 4×42 en (0,0), relleno hex fijo (#168451, $informacion, #b32d42) |
| Mensaje | texto en (35,13.5) 249×15, Rubik Regular 13 $tinta |
| **«En pausa» vs «Visible»** | **Idénticas**: mismo tamaño, relleno, trazo, posiciones y colores. El estado «En pausa» no cambia nada visible en Éxito, Información ni Error (solo sirve para detener el temporizador del prototipo) |

## 5. Estado vacío `217:10646` (Planificador diario · Vacío · Tema Windgets claro)

Huella previa: `huellas/217-10646.json` (resumida). Marco 1093×560, relleno $fondo, radio 8, sin autolayout. Medidas nuevas (la barra no se repite, ver §1):

| Elemento | Medidas |
|---|---|
| Barra | instancia «Menú lateral compartido» 176×560 (Tema=Windgets, Ampliado) en (0,0) |
| Migas | «Planificador  ›  Planificador diario» Nunito Regular 13 $texto en (200,19) |
| Título | «Planificador diario» Nunito Bold 26 $tinta en (200,49) 220×35 |
| Estado de sincronización | «Sincronizado» Nunito Regular 12 $texto en (1000,20) 69×16 + instancia `Icono / Sincronizado` 16×16 en (978,20) |
| Botón nueva tarjeta | «Ir · Nueva tarjeta» 36×36 r7 en (1033,48), sobre él instancia Botón ícono 36×36 r9 y un texto «+ Nueva tarjeta» Nunito Medium 13 $sobre_accion (capa auxiliar, posible resto) |
| Saludo | «Hola, Paula» Nunito Bold 19 $tinta en (201,104); fecha «Martes, 24 de noviembre» Nunito Regular 13 $texto en (201,131) |
| Contador | «Completadas: 0 de 0» (capa llamada «Completadas: 2 de 8») Nunito Regular 13 $tinta en (201,162); barra de 365×7 en (350,167): pista r4 $linea y relleno r4 $detalle de 91 px de ancho (**la barra sigue al 25 %** aunque dice 0 de 0) |
| Mensaje vacío | «No tienes tarjetas para hoy.» Nunito Medium 14 $tinta en (201,185) 173×19. **Sin ilustración, sin ícono, sin botón de acción**; texto alineado a la izquierda bajo el contador |
| Columna derecha | «Próximas a vencer» 317×154 en (751,104), $superficie_alta r8; «Calendario» 317×195 en (751,272), $superficie, borde 1 $linea, r8, con resaltados por día |
| Windi | «Nav · Windi» 48×48 r14 en (1029,496), instancia Windi Botón flotante Normal encima |
| Restos | El marco conserva capas «Tarjetas del día» (ocho filas, 529×44, r5, borde 1 $linea, etiquetas de color hex fijos #b04f7d #2b7a8c #2e8b57 #b8692a) y la copia de contenido de «Próximas a vencer» (textos distintos a los del nombre de capa). La guía de lectura (huella previa) indica que las filas se quitan; **su visibilidad (`visible`) no se midió** (el guion con `skipInvisibleInstanceChildren` no filtra capas de marcos normales), por lo que no puedo afirmar si están ocultas |

## 6. Íconos de estado de sincronización

| Componente | Id | Caja | Trazo | Detalle |
|---|---|---|---|---|
| Icono / Sincronizado | 2003:187 | **20×20** (en pantallas se usa instancia 16×16) | $tinta 1.6 | un vector 15.5×11 en (2,4.5) |
| Icono / Sin conexión 20 | 2251:4951 | **20×20** | $tinta 1.6 | «Nube» 15×10.5 en (2.5,4.5) + «Barra» 13×13 en (3.5,3.5) |
| Icono / Alerta | 80:57 | **32×32** (no 20) | $tinta **3** | triángulo 28×26 en (2,3); es el ícono antiguo (trazo grueso), distinto del resto |

Los tres sin relleno, todo el color sale de $tinta (sigue el tema). En el aviso «Sincronizado» de la barra el ícono 16×16 se escala desde 20×20.

## Incoherencias nuevas

1. Hover del botón Principal = capa $tinta al 14 %, no un relleno propio; los otros niveles cambian relleno a $superficie_baja.
2. Anillo: 2 $tinta (botón) vs 1 $principal_legible (campo e interruptor), todos con 4 px de offset y radio control+3.
3. Avisos: «×» como texto y como ícono superpuestos; ícono de tipo y glifo texto superpuestos; «En pausa» idéntico a «Visible».
4. Barra lateral sin autolayout, sin hover, ítem activo solo por override con radio 8 (resto 6); logo con violeta #6200d9 distinto de #6604e6.
5. Estado vacío: barra de progreso al 25 % con «0 de 0»; sin ilustración ni acción; restos de filas en el marco.
6. `Icono / Alerta` 32×32 trazo 3, no encaja con la familia de 20×20 trazo 1.6.
7. Windi: «Sin conexión o error» superpone ojos y boca nuevos sobre los normales; colores fijos.

## No medido / no existe

- Hover del interruptor y del botón ícono (no remedidos por cupo; hover del botón ícono ya en F0 como $superficie_baja).
- Hover y ítem activo en la barra Contraída y en Rosa/Enfoque: no medidos.
- `Botón · Foco` como componente propio: no existe; es el hijo «Anillo de foco» dentro de cada variante Foco.
- Windi «Con propuesta/Escribiendo/Sin conexión»: medidos todos los cinco.
