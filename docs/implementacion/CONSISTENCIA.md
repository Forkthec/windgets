# CONSISTENCIA: incoherencias del Figma del rediseño y valor único para el código

> **Revisado 26-nov (UTC-5): hallazgos del revisor aplicados y decisiones de Paula incorporadas.** Lo que sigue abierto está en «Pendiente de Paula» al final. Las filas marcadas PROPUESTA no son decisiones: se confirman en la fase 5.

## Cómo leerlo

- **Autoridad, en este orden:** Figma, después `docs/rediseno.md`, después las HU. Si el Figma contradice una HU, gana el Figma; si `rediseno.md` contradice el Figma, se anota como RD-nn y se consulta con Paula.
- **Fuentes:** `.trabajo/figma/F0.md` a `F8.md` (F0, F1, F2a, F2b, F3, F4a, F4b, F5, F6, F7, F8) y las huellas `.trabajo/figma/huellas/*.json`. «F1» es Login/registro, «F2a/F2b» Planificador y modales, «F3» Windi, «F4a/F4b» Personalización, «F5» Barra y mensajes, «F6» Widgets, «F7» Instalador, «F8» Diálogos. Los números tras la fuente son el punto de su lista de incoherencias.
- **Última columna, tipo de valor:** **MEDIDO** (sale del Figma, con id de nodo y archivo), **PROPUESTA** (no está en el Figma; es lo que se propone, confirmar en la fase 5) o **NO MEDIDO** (con el motivo). Los contrastes citados los calculó el revisor sobre `superficie_alta` de cada tema.
- **Regla de unificación (decisión de Paula):** cuando una pieza tiene dos valores, se unifica al de la variable o del componente de F0 y se anota en `DECISIONES.md` con «Paula cambia a:».
- **Variables de F0 (`200:2`, modos Windgets claro / Rosa pastel / Enfoque rojo y negro / Windgets oscuro):** principal, secundario, marco, sobre_marco, superficie, superficie_alta, superficie_baja, linea, tinta, texto, accion, sobre_accion, borde, sombra, error, borde_campo, burbuja_propia, fondo, detalle, sobre_detalle, principal_legible, sobre_seleccion, perilla, informacion, seleccion, estado_vencida/pendiente/completada, relleno_vencida/pendiente/completada, velo. La colección `80:2` es heredada: no usar. FLOAT `Radio de widgets` = 9 y FLOAT `Tipografía del tema` = 14 (es un tamaño, no una familia; F0 §1.4).

---

## 1. Colores fijos sin variable

Contrastes sobre `superficie_alta` (claro / Rosa / Enfoque / oscuro): `principal_legible` 7,43 / 4,59 / 5,35 / 7,72; `informacion` 1,68 / 1,55 / 3,16 / 7,72; `estado_pendiente` 3,01 / 3,06 / 7,88 / 6,34; `estado_completada` 2,96 / 3,04 / 8,92 / 7,18; `error` 6,30 / 5,83 / 7,34 / 5,90; `estado_vencida` 4,56 / 4,23 / 3,54 / 2,85.

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| C1 | Avisos emergentes (F0 §4.6: Éxito 217:17624, Información 217:17638, Advertencia 217:17652, Error 217:17666) | Borde fijo por aviso | Éxito #168451, Información #00d9e2, Advertencia #b47700, Error #b32d42 | Éxito `estado_completada`; Advertencia `estado_pendiente`; Error `error`; Información: borde e ícono `informacion`; el título va en `texto` (P2). Información lleva además un borde interno de 1,5 en el mismo color que el borde (217:17638). Éxito claro da 2,96:1 (0,04 bajo 3:1): falla, aceptada en C1 (pendiente de Paula) | MEDIDO los fijos (F0 §4.6, §6.7); valor único = decisión D1 de Paula; el contraste es cálculo del revisor |
| C2 | Aviso ámbar: Etiquetas · Máximo, Calendario · Aviso día pasado, Sin conexión del Planificador, Clima · Ciudad duplicada 217:18759, Organizar widgets | Dos ámbar distintos | #b47700 y #c68700 | `estado_pendiente` (D1). Rosa y claro dan 3,06 y 3,01 como texto: el título del aviso va en `texto`; el ámbar es solo borde e ícono | MEDIDO (F2a 14, F2b 1, F4a 18, F4b 7, F5 6, F6 3); contraste calculado |
| C3 | Error: avisos, píldoras, campos | Tres rojos | #b3261e (campo y variable), #b32d42 (píldora), #c32d43 | `error` en todo trazo, borde, ícono y texto de error | MEDIDO (F0 §6.7, F1 3, F2b 1, F4a 18, F4b 1) |
| C4 | Login y registro (páginas 84:x) | Sin variable enlazada | tintas #17131d / #211a2d, textos #554f5e / #62596a, borde de campo #766b81 / #2b2135 | `tinta` #17131d, `texto` #554f5e, `borde_campo` #766b81 | MEDIDO (F1 1, 2) |
| C5 | Botón principal artesanal en login y registro | Sombra y borde fijos | sombra #241c30, borde #18131c (invisible en oscuro) | Usar el componente: `sombra` y `borde` | MEDIDO (F1 5). El desvío de borde invisible en oscuro: NO MEDIDO en huella, tomado de F1 desvíos |
| C6 | Franja de error de servidor en F1 | Relleno fijo | #fae6dd | `relleno_vencida` con texto `error` | MEDIDO (F1 10) |
| C7 | Windi (mascota: cabeza, cuerpo, ojos) | Hex fijos | #00d9e2, #6604e6, #dc026c, #806dac, #ffca22, #27152b, #ffffff | Se quedan fijos en todos los temas (D2) | MEDIDO (F0 §6.11, F4a 13, F5 6); decisión D2 |
| C8 | Windi · Propuesta · Crear etiqueta (2171:2200, **en F3**, no en el Planificador) | Punto sin variable | #3b82f6 | Color del catálogo de 9 más cercano (azul `#3e63dd`), D3 | MEDIDO (F3 6, 111); decisión D3 |
| C9 | Etiquetas y Calendario | Color de etiqueta con dos valores | ficha #2a6f8f@0,16 y #b8692e; catálogo #2b7a8c y #b8692a; #2e8b57 y #b04f7d en 7 familias | Todo color de etiqueta es uno de los 9 del catálogo (C10). Los existentes #b04f7d, #2b7a8c, #b8692a, #2e8b57 pasan al más cercano: #b04f7d a `#dc026c`, #2b7a8c a `#00d9e2`, #b8692a a `#f76b15`, #2e8b57 a `#30a46c` | MEDIDO los vistos (F2b 2, F2a L40); el mapeo al más cercano es PROPUESTA calculada a ojo por tono, confirmar en fase 5 |
| C10 | Catálogo de colores del Planificador (F2a 8) | 9 entradas frente a «8 chips» | #8a8d98, #e5484d, #f76b15, #dcba04, #30a46c, #00d9e2, #3e63dd, #6604e6, #dc026c | **Catálogo de 9** tal cual (D3). Windi, al nombrar un color, usa solo estos 9 (F3 lista «Azul, Verde, Morado y Naranja»: se amplía a los 9) | MEDIDO (F2a 8, F3 61-62); decisión D3 |
| C11 | Personalización, vista previa de muestras de tema | Hex fijos por tema | Rosa: #e6dcc8, #8c7a5c, #b9d8df, #c98b5a, #6e947e, #b8a078, #8c6f52, #b59c7a. Enfoque: #dce6d5, #a9bea7, #4c7a57, #35593f, #2e4a36, #141316, #e0565b | Se quedan fijos: son muestras del tema | MEDIDO (F4a 7 y 13) |
| C12 | Papel de los overlays y «Oscurecer imagen» | #ffffff frente a `superficie_alta`; velo con alfa | papel #fffbea (huella 85-66, F8 comunes); #ffffff en F4a (huella 204-25071) es residuo; `velo` #17131d66 / #3a152866 / #0000008c; F6 usa #15101D@0,32 | Papel de overlays: `superficie_alta`. Velo detrás de diálogos: `velo`. «Oscurecer imagen» (0 a 60 %, F4a) NO usa `velo` (trae alfa propio): negro del tema `tinta` con alfa = el porcentaje elegido | MEDIDO papel y velo; la regla de «Oscurecer imagen» es PROPUESTA |
| C13 | Barra de tareas y Kanban en widgets | Fondo, texto y puntos fijos | #f3f3f3 y #1a1a1a (solo cambian en oscuro); puntos #8a8d98, #3e63dd, #30a46c; punteros #ffffff y #000000 | Barra de tareas: `superficie` y `texto`. Puntos del Kanban: color del catálogo más cercano (D3); los tres vistos ya son del catálogo | MEDIDO (F6 3); decisión D3 |
| C14 | Textos ocultos duplicados del botón y envoltorios de clic | Color fijo | #ffffff; vector #251f34 en M-01 | Se eliminan; no se implementan | MEDIDO (F5 6, F7, F8 3 y 8) |
| C15 | Sombras duras | Sombra fija | #241c30 (claro), #100d15 (oscuro) | `sombra` | MEDIDO (F6 3, F7 5, F8 7) |
| C16 | Velo de overlays | Hex por tema | `velo` existe (#17131d66, #3a152866, #0000008c); Rosa usaba #3a1528 | `velo` | MEDIDO (F8 7) |
| C17 | Selector: texto elegido | #ffffff fijo en claro | varía en otros temas | `sobre_seleccion` | MEDIDO (F5 desvíos) |
| C18 | Estado de tarjeta vencida | `estado_vencida` igual en los 4 modos | #d93226 | Se queda; se anota que no cambia con el tema. Contraste en oscuro 2,85:1: se usa solo como relleno/ícono, el texto va en `texto` | MEDIDO (F0 §6.12); contraste calculado |
| C19 | «Tareas del día» (F7) | `seleccion` en claro y `secundario` en oscuro | dos variables | `seleccion` | MEDIDO (F7 5) |
| C20 | Selector de color y Colores libres | Sugerencia «#17131D» para todos los temas | 2,1:1 y 1,7:1 | Sugerir `tinta` del tema activo. Si el color elegido baja de 3:1 sobre la superficie, se muestra un aviso y NO se bloquea (D4) | MEDIDO (F4b 5); decisión D4 |

## 2. Radios, bordes y trazos

Los valores fraccionarios (5,4, 5,7, 6,1, 7,23, 10,826, 12,99, 13,05, 1,2, 1,44, 1,45, 1,21) son producto del escalado del marco, no tokens: se redondean al valor del componente. Ejemplo: 10,85 = 9 × 1,2029.

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| R1 | Controles (botón, botón ícono, campo, selector, fila) | Radio base | 9; Interruptor 8, Casilla 4 | 9 para todo control; Interruptor 8 y casilla 4 por ser forma propia | MEDIDO (F0 §6.1) |
| R2 | Windi mensaje/propuesta, botones internos, Windi widget | Radio | 10, 12, 8 | Mensaje y propuesta 10 con botones 9; Windi widget 12 | MEDIDO (F0 §6.1, F6 1) |
| R3 | Widgets (tarjeta) | Variable no enlazada | `Radio de widgets` 9; efectivo 13,05 / 12,99 / 12 | Enlazar `Radio de widgets` (9) | MEDIDO (F0 §6.14, F6 1) |
| R4 | Marcos `Ir ·` (envoltorios de clic) | Radio 7 sobre instancia de 9 | 6,4, 7, 9 | No se implementan; el botón lleva radio 9 | MEDIDO (F5 8, F8 3, F7 4) |
| R5 | Aviso emergente | Radios | píldora 21; panel 12; tarjeta 8; nombre emergente 6; Oculto 5 | Píldora 21, tarjeta 8, nombre emergente 6, **panel lateral 12** (D5) | MEDIDO (F0 §6.1, F5 8); decisión D5 |
| R6 | Selectores y listas (Reportes, Selector de fecha, Lista de horas, Lista de etiquetas) | Radio y borde del mismo control | radio 8 / 9 / 10; borde `linea` / `borde_campo` / `borde`; trazo 1,5 y 1 | Radio 9, borde `borde_campo`, trazo **1,5** (el del campo en F0) | MEDIDO (F2b 4, F0 §4.1) |
| R7 | Anillo de foco | Tres versiones | botones 2 `tinta` r12; campo 1 `principal_legible` r12; interruptor 1 r11; mensaje r6 sobre r21 | **2 px `tinta`, radio del control + 3, también en campos** (D6) | MEDIDO (F0 §6.2, §4.1); decisión D6 |
| R8 | Sombras | Desplazamientos duros | Botón Principal 3,5; Secundario y Destructivo sin sombra; Windi botones 2,3; Windi widget 1,3; Confirmar de Windi como Principal 3,5 | Sombra 3,5 solo en Principal (incluye Confirmar de Windi); Secundario y Destructivo sin sombra; Windi widget 1,3. El interruptor «Sombra» de Personalización (F4a 203:10717; F4b 2213:85446 «Con sombra») NO tiene medida: ver P16 | MEDIDO botones (F0 §4.1, §6.9); interruptor «Sombra» NO MEDIDO, sin valor en el Figma |
| R9 | Trazos | Grosores | 1,5 (Windi panel, papel de diálogos, controles), 1 (notificación, área, aviso), escalados 1,2, 1,21, 1,44, 1,45 | Controles 1,5; **panel lateral de Windi 1,5; papel de diálogos 1,5** (F3, F5, F6, huella 85-66); tarjeta Kanban 1,21 se redondea a 1 (R15); error de campo: R10 | MEDIDO (F1 7, F3, F5, F6 2, huella 85-66) |
| R10 | Campo Error | Estructura distinta (260×58, radio raíz 0) | F0 Error: `error` 2 px radio 9; Clima sin trazo propio; Guardar como tema y Selector de color `error` 2 px | **Trazo `error` 2 px, radio 9**, un solo mecanismo en todos los campos | MEDIDO (F0 §6.10, F4b 8); decisión de Paula |
| R11 | Vista previa de widgets en Personalización | Forma | Rectas 0; Base 10,85 (= 9×1,2029); Redondas 22 (2213:85346); barra expandida 9 | **Rectas 0, Base = variable `Radio de widgets` (9), Redondas 22** | MEDIDO Redondas 22 (F4b 2213:85346) y 0; Base por variable; decisión de Paula |
| R12 | Filas «Forma» y «Distribución» (203:6607) | Trazo `linea/undefined`, sin relleno ni radio | frente a las demás filas | Mismo estilo que las demás filas: radio 9, trazo `linea` | MEDIDO (F4a 3) |
| R13 | Perilla de «Sombra» (203:10717) | Borde `borde_campo` frente a `perilla` | | `perilla` | MEDIDO (F4a 25) |
| R14 | Papel con esquina doblada (overlays F8) | Esquinas y pliegue | huella 85-66: esquinas 10, pliegue 22; panel lateral 12 | **Papel 10, pliegue 22**, corte de esquina por CSS (D5). Faltan por medir en 13 huellas 204-*: `Contenido` r16 (F7) y Nav·Windi r14 | MEDIDO papel (85-66, F8 8); `Contenido` 16 y Nav·Windi 14 MEDIDO solo en F7/F5, no se verificaron las 13 huellas |
| R15 | Casilla de lista (F0 2152:28882) | Trazo | 18×18, radio 4, trazo 1,5 `borde_campo` | 1,5 `borde_campo`. (El 1,21 es el trazo de la **tarjeta Kanban**, F6 §2 y 5.2, no de la casilla: se redondea a 1) | MEDIDO (F0 2152:28882, F6 2) |

## 3. Alturas, paddings y gap

Las fuentes casi no miden padding ni gap; se registra lo medido. Regla general (decisión de Paula): lo que desborde se resuelve primero ajustando el contenido para que quepa, con el menor desplazamiento posible; el desplazamiento solo es el último recurso.

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| A1 | Campo y botón en login, registro, 84:x | Medidas por escalado | Campo 313×30,5; 276×27; 353×34; 260×36 (F0). Botón 36. Botón Google 30,5 y 28 | Alto de control 36; campo 260×36 como el componente | MEDIDO (F1 4, F0) |
| A2 | Filas de lista de Personalización | Alto | 32 (Mis temas, Texto, Imagen, Carrusel, Animación), 36 (Forma, Distribución, Música, Windi, Reloj), 31 (selectores), 30 (fuente y tamaño). F0: Fila de lista 300×44; tamaño «Fila» del componente: Botón 74×32 (2005:373), Botón ícono 32×32 (2005:386); Fila 74×36 Normal | Se usa el tamaño del componente de F0: **fila de lista 44; botón en fila 32 (tamaño «Fila»); resto 36**. Opciones de selector 31 con paso 35 pasan a 36 | MEDIDO (F4a 21 y 8, F0 2005:373 y 2005:386); regla de unificación |
| A3 | Confirmar, Rechazar y Reintentar de Windi | Alto 30 r8 frente a campo 36 r9; Confirmar con sombra, Rechazar sin | 30, 36 | 36 r9. Confirmar es Principal (sombra 3,5); Rechazar es Secundario (sin sombra, R8) | MEDIDO (F3 8, F0 §4.1) |
| A4 | Botón ícono y «Ver más reportes» | Marco r7 frente a instancia r9; 101 en botón de 36 | | Botón ícono r9. Tamaños del componente: 32×32 («Fila») o 36×36. «Ver más reportes» (101×36) es un botón de texto normal, no se recorta | MEDIDO (F3 8, F2a 3, F0 2005:386); lo del texto, regla de componente |
| A5 | Avisos emergentes | Ancho: Advertencia 365, los otros 320; píldoras de 211 a 715 | ver D7 más abajo | **PROPUESTA D7, confirmar en fase 5** (análisis en la sección «D7») | PROPUESTA |
| A6 | Nombre emergente (tooltip) | Alto | 36 (mayoría), 54 (Expandir menú; Barra contraída 70×54), marco propio 260×54 (Papelera) | 36; 54 solo con dos líneas | MEDIDO (F4b 3 y 10) |
| A7 | Mensajes de error de campo | Alto y ancho | 276×36, 15, 180×28 (recorta a dos líneas); F4b 217:18759 276×36 es la tarjeta de error de campo duplicada de Clima | Texto de error sin caja fija: ancho del campo, alto automático. El de Clima 217:18759 pasa a trazo `error` (E13) | MEDIDO (F4b 9, 217:18759); regla PROPUESTA |
| A8 | Píldora de aviso | Posición y | 12 (login, registro), 4 (84:x); aviso del Planificador en y=4 | y=4, ver D7 | MEDIDO (F1 11, huellas 204-*); ubicación PROPUESTA |
| A9 | Alias, correo y contraseña | Contador | Alias sin contador aunque su regla es 30; correo y contraseña «0/64» | Contador en todo campo con límite | MEDIDO (F1 15) |
| A10 | Íconos | Tamaño | 20 (controles), 18 (barra lateral), 16 (mensajes), 34/36 (clima y Windi) | Se conservan: 20 / 18 / 16 / 36 | MEDIDO (F0 §6.15) |
| A11 | Imagen en widgets estáticos, Carrusel, Animación | Desborda | 171 en 158; 205 en 189,5 | Imagen al 100 % del widget con recorte | MEDIDO (F0 §6.14, F6 5) |
| A12 | Tamaños de letra | Fraccionarios por escalado | 13,26 / 13,3 / 13,2 / 10,8 / 40,8; Kanban 13 y 105 % | Se redondean al entero del componente. Los estilos de texto 42/26/17 se quitan (D8). Tamaños en uso que se conservan: F7 página 40/31/24/22 (cabecera 26, 17, 14), F8 diálogos 20 | MEDIDO (F6 7, F0 §6.5-6, F7, F8); decisión D8 |
| A13 | Vista previa y pasos de Personalización | Desplazamiento 2 px; solapes «Datos» y «Controles» | 6362 frente a 6520; y148-184 frente a y144-244 | Seguir la base 6362; solapes: NO MEDIDO cuál prevalece, se toma el de y148-184 por ser el más compacto | MEDIDO los valores (F4a 6 y 8); elección PROPUESTA |
| A14 | Barra de progreso del instalador | Progreso 640 > Total 618, pista en 654 | | Progreso nunca mayor que el total | MEDIDO (F7 2) |
| A15 | «Abrir Windgets» | Envoltorio 75×36 con botón 134×36 | | Toda el área del botón es pulsable | MEDIDO (F7 4) |
| A16 | Diálogos M-03, M-13, M-14, M-15 | Cuerpo y alto | M-03 y M-15 512×160; otras 424×160; M-14 «1 tarjeta» (2144:29098) alto 175; cuerpo de 57 de alto en diálogo de 160 | 424×160 estándar; M-03 y M-15 512×160; M-14 de 1 tarjeta alto 175 (el contenido manda). Si el cuerpo no cabe: crecer el alto, no desplazar | MEDIDO (F8 6, F2a 2144:29098) |
| A17 | Reportes › Vencida (217:11114) | Desborda el marco | filas y=554 a 579 sobre 560 | **Primero ajustar para que quepa:** compactar filas (alto de fila al mínimo de 32 del componente «Fila»), ocultar secundarios («Ver más reportes» pasa al pie) y mostrar menos filas con «Ver más». Desplazamiento solo si, con eso, aún no cabe | MEDIDO el desborde (F2a 9, 217:11114); solución PROPUESTA |
| A18 | Aviso de Personalización más reciente | Pegado al centro | píldora 715 hasta x=354 | Dentro del ancho máximo de D7 | MEDIDO (F4b 2178:33360) |
| A19 | Vista cómoda del Planificador | Espaciado | F2a cómoda 217:11582 filas de 60, paso 64 (frente a 46); Kanban 220:22023 filas 78 (frente a 70) | Cómoda: fila 60 con paso 64 (lista) y 78 (Kanban); Compacta: 46 y 70. Compacta e interruptor sin reacción en F5: se implementan | MEDIDO (F2a 217:11582, 220:22023) |

## 4. Tipografía por tema

**Regla (decisión de Paula):** la fuente de la interfaz la fija el tema: Windgets claro y oscuro Nunito, Rosa Quicksand, Enfoque Space Grotesk; **Rubik pasa a la fuente del tema**. Nunito es la fuente por defecto de Windgets. **La tipografía que la persona elige en Personalización manda sobre la del tema en toda la aplicación** (si no ha elegido, Nunito). El tamaño base lo da la variable `Tipografía del tema` = 14 (es un FLOAT, no la familia). Tamaño base (P4): Pequeño 12, Mediano 14, Grande 18.

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| T1 | Todo el diseño | Fuente | Controles, Windi y widgets Nunito; barra y mensajes Rubik; Quicksand y Space Grotesk no están en Fundamentos | La regla de arriba. Quitar los 3 estilos de texto 42/26/17 (D8) | MEDIDO (F0 §6.4-5); decisión de Paula |
| T2 | Login, registro, 84:x | Rubik en toda la página; solo claro y oscuro | Rubik | Fuente del tema | MEDIDO (F1 6) |
| T3 | Barra lateral y avisos Error/Información | Rubik frente a Nunito en Éxito | Rubik 13 en claro y oscuro; Quicksand/Space Grotesk Medium en Rosa/Enfoque | Fuente del tema, Medium 15 título y Regular 13 cuerpo (F0 §4.6) | MEDIDO (F5 7, F0 §4.6) |
| T4 | Barra lateral en Rosa y Enfoque | Se queda en Rubik | Rubik | Fuente del tema | MEDIDO (F5 desvíos) |
| T5 | Propuesta de Windi | Cambia de caja con Quicksand y Space Grotesk | título 45×21 (claro 49×23), propuesta 211×75 en y132 (claro 203×77 en y136); Enfoque 216×76 en y134 | Fuente del tema; reservar ancho y alto de la propuesta con holgura de 6 px | MEDIDO (F3 100-102); holgura PROPUESTA |
| T6 | Propuesta · Crear y Saludo (Windi) | Siguen Nunito en Rosa y Enfoque | Nunito | Fuente del tema | MEDIDO (F3 100) |
| T7 | Marcos 53–62 de Nueva tarjeta, Calendario, Reportes | No siguen la fuente del tema | Nunito o Rubik | Fuente del tema | MEDIDO (F2b 9) |
| T8 | Selector de fechas de Reportes | Rubik Medium 17/13, Regular 12 | | Fuente del tema 14 y 12 | MEDIDO (F2b 3) |
| T9 | Nueva tarjeta | Columnas como texto de varias líneas con fuente mixta; «Fecha del bloque» de Nunito 14 a 12 | | Nunito 14 en ambos | MEDIDO (F2b 3 y 7) |
| T10 | Reportes (204:1005, 204:1683) | Rubik y colores fijos | #ca4353, #ce9b18, #188450 | Fuente del tema; `estado_vencida`, `estado_pendiente`, `estado_completada`. 204:1005 es el único reporte (decisión) | MEDIDO (F2a 1) |
| T11 | Aviso de wallpaper (F6 2233:9789) | Rubik Regular 13 | | Fuente del tema 13 | MEDIDO (F6 4) |
| T12 | Diálogos M-01 y M-16 a M-21 | M-01 Rubik Medium 20; el resto Nunito Bold 20; M-16 a M-21 siguen Rubik; no existen en Rosa ni Enfoque | | Título Bold 20 en la **fuente del tema** (la regla de arriba) en los 21 diálogos | MEDIDO (F8 4); regla de Paula |
| T13 | Personalización › Tipografía (203:10640) | Nodos «Rubik» con textos Inter, Merriweather, Poppins, JetBrains Mono, Nunito; 203:6520 dice «Rubik · Mediano» | | Lista de fuentes que elige la persona: Inter, Merriweather, Poppins, JetBrains Mono, Nunito (Nunito por defecto). La elegida se aplica a toda la app | MEDIDO (F4a 16); regla de Paula |
| T14 | Clima: caja de temperatura | Ancho 103 / 92 / 96 según fuente | | Ancho automático, reserva mínima 103 | MEDIDO (F6 10) |
| T15 | Error de espacio del instalador | `error` Regular 17 sin ícono ni cuadro | | Sin cambio de peso; ver E19 (ícono 16 y texto `error`, para no depender solo del color) | MEDIDO el valor (F7 3); ícono PROPUESTA |
| T16 | Ayuda de la contraseña | Dos capas con salto fijo; tamaños 8,4 y 9,9 | | Una capa, tamaño del texto de ayuda (12) | MEDIDO (F1 16) |
| T17 | Etiquetas en Rosa y Enfoque | Solo se midió la fuente | | Igual que T1 | NO MEDIDO (F2b: solo fuente) |
| T18 | Página del instalador (F7) | Toda en Rubik | Bold 40, Medium 31, Bold 24, Regular 22; cabecera 26, 17, 14; `Contenido` r16; único tamaño 1280×790 | Fuente del tema; tamaños 40/31/24/22 y 26/17/14 se conservan como tamaños de la página, no como estilos globales | MEDIDO (F7) |

## 5. Estados que faltan

Foco, hover y deshabilitado SÍ existen como Estado [Normal | Puntero encima | Foco | Deshabilitado] en Botón, Botón ícono, Interruptor y Fila (F0 §4.1), con hover `superficie_baja`. «Pulsado» no existe en el Figma. Regla: foco = anillo de R7; cargando = 5 barras `linea` r6 (patrón del Figma, F2a 217:10802: anchos 324/300/276/252/228, 16 de alto, y=200+54k) o indicador junto al texto; nunca bloquear la pantalla.

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| E1 | Todos los controles | Foco, hover y deshabilitado en el componente; otras páginas no los dibujan | Estado de F0 §4.1 | Foco 2 px `tinta` radio+3 (D6); hover `superficie_baja`; pulsado: la sombra desplazada de Principal vuelve a 0 (PROPUESTA, no está en el Figma) | MEDIDO foco y hover (F0 §4.1, §6.2); pulsado PROPUESTA |
| E2 | Campo editable | Hover cambia borde a `tinta`; foco 1 `principal_legible` r12 | | **Hover borde `tinta`; foco = anillo 2 px `tinta` r12 (9+3)** (D6; sustituye el anillo `principal_legible`) | MEDIDO (F0 §6.10); decisión D6 |
| E3 | Botón deshabilitado | Texto `borde`, Destructivo pierde `error`, mismo relleno que Secundario (no se distingue); F1 usa marcos artesanales (#dfdbdd, Rubik Bold 12); opacidad 0,4/0,5 en Windi e Instalar (F7 0,4 en 2264:134733, F5 0,5/0,4); opacidad 45 % en F4b 2177:32591, 2177:32768, 217:18564, 2211:79096 (Aplicar, Guardar, Agregar) | | Variante «Deshabilitado» del componente (texto `borde`, relleno `superficie_baja`, sin sombra), sin opacidad por capa ni marcos propios; Destructivo deshabilitado conserva el borde `error` para distinguirse de Secundario | MEDIDO (F0 §6.9, F1 5, F4b, F5 10, F7 8); la distinción del Destructivo es PROPUESTA |
| E4 | Botones deshabilitados en F1 (2249:2461, 2249:3144) | Siguen pulsables en el prototipo | abren Planificador y 84:2 | Sin acción al pulsar | MEDIDO (F1 8) |
| E5 | Windi (F3) | Sin foco, hover, deshabilitado ni cargando; «Escribiendo…» solo texto; campo y envío en Normal en Sin conexión, No respondió y Mensaje muy largo | | Sin conexión: campo y envío con Estado Deshabilitado. «Escribiendo…»: texto con tres puntos animados (`texto`, 13, 0,15 s por punto), sin bloquear el campo. Mensaje muy largo: el envío queda deshabilitado mientras el contador marque error | MEDIDO el vacío (F3 3); tres puntos y deshabilitar envío PROPUESTA |
| E6 | Windi · Propuesta descartada (204:2876, 2171:2240) | Conserva Confirmar y Rechazar visibles | | Ocultar ambos | MEDIDO (F3 3, F5 2) |
| E7 | Cargando y vacío de widgets Clima, Reloj, Calendario, Reproductor, Texto | No existen (Reproductor tiene «Sin música»; error solo en Noticias) | | Se redactan ahora (D9). Cargando: 5 barras `linea` r6 dentro del widget. Vacío: Clima «Elige una ciudad para ver el clima.»; Calendario «No tienes eventos este mes.»; Reproductor «Sin música» (existe); Texto «Escribe tu nota aquí.»; Reloj no tiene vacío | MEDIDO ausencia (F6 9); textos PROPUESTA |
| E8 | Sincronizando (F5) | Sin indicador de carga | | Ícono de sincronización 16 con rotación 1 s lineal junto a «Sincronizando…» en la posición de «Sincronizado» (x=978 ícono, x=1000 texto); con «reducir movimiento»: ícono fijo | MEDIDO posición (huellas 204-622 y otras); forma PROPUESTA |
| E9 | Vacío y carga del Planificador | F2b SÍ los trae | Panel del día · Vacío 2155:32348 «No tienes tarjetas para este día.»; Agenda · Sin tarjetas por programar 2152:30628 «No tienes tarjetas pendientes por programar.»; Reportes Vacío 217:16271 «No hay datos para este rango de fechas y estos filtros.», Cargando 217:16400 (5 barras `linea` r6), Error 217:16529 «No se pudo cargar el reporte.» (ver G1), Sin conexión 217:16658 «Sin conexión», Sin tarjetas 2161:32852 «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.»; Etiquetas · Vacío 217:17387 «Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.»; Catálogo de imágenes vacío 2180:35092 | Copiar tal cual los textos del Figma. **Faltan solo** Calendario (vacío y carga), Agenda (carga) y Panel del día (carga): carga = 5 barras `linea` r6; vacío de Calendario «No tienes tarjetas este mes.» | MEDIDO los de F2b; los de Calendario, y cargas de Agenda y Panel PROPUESTA (D9) |
| E10 | Instalador | Progreso sin porcentaje ni texto; la espera es un temporizador de 2 s | | Texto de avance bajo la barra «Instalando… N %» (`texto` 14); la barra respeta A14 | MEDIDO ausencia (F7 2); texto PROPUESTA (D9) |
| E11 | Cómoda y Compacta (F5) | Cómoda no cambia el espaciado | | Valores de A19 | MEDIDO (F2a 217:11582, 220:22023) |
| E12 | Clima · Sin conexión (217:18954) | Sin mensaje | 2211:79326 «No hay conexión a internet. Conéctate para validar la ciudad.» | Copiar el mensaje de 2211:79326 | MEDIDO (F4b 6) |
| E13 | Clima · Ciudad duplicada (217:18759) | Barra ámbar #C68700 repetida; demás errores de campo usan `error` | | Trazo `error` 2 px en el campo (R10); sin barra ámbar | MEDIDO (F4b 7) |
| E14 | Nombre de tema (Guardar como tema, Renombrar) | Ya existen F4b 2178:32678 «Ya existe un tema con ese nombre. Elige otro.» y 2178:32554 «El nombre no puede superar los 40 caracteres.» | | Falta solo el de vacío (ver G2) | MEDIDO (F4b); falta PROPUESTA |
| E15 | Interruptor «mostrar contraseña» | Un solo par de variables (174:3, 174:4) para todos los ojos | | Estado por campo | MEDIDO (F1 12) |
| E16 | Estados sin entrada (Sincronizando, Sin conexión, Error de sincronización, M-12, seis avisos, M-19, M-20) | Nada los abre en el prototipo | | Entrada por evento: Sincronizando al iniciar cualquier envío al servidor; Sin conexión cuando falla la red; Error de sincronización cuando el servidor responde error; M-12 al pulsar «Cerrar sesión»; M-19 al fallar un cambio de ajustes; M-20 al fallar la instalación; los seis avisos al ocurrir su causa (G1) | MEDIDO que nada los abre (F5 5, F7 9); evento por estado PROPUESTA |
| E17 | Colisión en Organizar widgets | Aviso duplicado (píldora 242×42 en 217:17946 y tarjeta 282×37 con la misma frase) | | Una sola: la píldora | MEDIDO (F4a 18) |
| E18 | Calendario con el puntero encima | Sin diferencia visible | | Hover `superficie_baja` | NO MEDIDO (F2b: sin estado hover en Calendario); valor del componente Fila |
| E19 | Error de campo en general | Solo color | | Ícono de 16 y texto en `error` junto al campo | PROPUESTA (accesibilidad: no depender del color) |

## 6. Errores y textos

Regla global: todo error previsible tiene excepción de negocio, **código estable** (MAYUSCULAS_CON_GUION_BAJO) y mensaje claro en su campo. El genérico «Ocurrió un error inesperado.» (`INTERNAL_ERROR`) queda **solo para lo imprevisible**. «Reintentar» solo donde reintentar sirve (fallo de red o servicio); no en errores de dato (mensaje muy largo, nombre repetido), donde se corrige en el campo.

### 6.1 Errores genéricos del Figma, uno por causa (D10)

Todos los códigos y textos son PROPUESTA salvo que el texto esté entre comillas con id (ese texto es MEDIDO). Los textos del Figma se conservan tal cual cuando ya dicen la causa; donde dicen «error» a secas se reemplazan.

| # | Dónde (id, archivo) | Texto actual | Causa | Código propuesto | Texto propuesto | Reintentar |
|---|---|---|---|---|---|---|
| G1a | Windi Error 204:25659 / F5 204:26063 | «Ocurrió un error inesperado.» | Fallo imprevisto del servidor de Windi | `WINDI_ERROR_INTERNO` | «Windi tuvo un problema. Tus tarjetas no cambiaron. Intenta de nuevo.» | Sí |
| G1b | Windi No respondió F3 204:2787 | «No pude responder en este momento. Intenta de nuevo.» | El agente de IA tarda o falla | `WINDI_SIN_RESPUESTA` | Se conserva el del Figma | Sí (hoy sin reacción, ver P4) |
| G1c | Windi Sin conexión (F5 «Sin conexión»; F3 204:2698) | «Sin conexión» corto / «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» | Sin red | `WINDI_SIN_CONEXION` | El largo de F3 204:2698 | No (el campo vuelve cuando haya red) |
| G1d | Windi Propuesta sin conexión F3 2171:2281 | «Se perdió la conexión. No se hizo ningún cambio.» | Red cae durante propuesta | `WINDI_CONEXION_PERDIDA` | Se conserva | Sí |
| G1e | Windi mensaje muy largo F3 2172:2075 | «Tu mensaje no puede superar los 2000 caracteres.» | Dato inválido | `WINDI_MENSAJE_MUY_LARGO` | Se conserva, en el campo, contador `error` | No: se corrige en el campo |
| G1f | Error de sincronización 217:20460 | «Error de sincronización · 2 pendientes» | El servidor rechaza o falla la sincronización (no usa causas de Windi) | `SINCRONIZACION_FALLIDA` | «No se pudo sincronizar. Tienes N cambios pendientes.» | Sí (botón en la píldora) |
| G1g | Sin conexión del Planificador (217:20400, 217:10958) | «Sin conexión · N pendientes» | Sin red | `SIN_CONEXION` | Se conserva | No (se sincroniza solo al volver) |
| G1h | F2b 2148:27220 y F4b 2240:104704 | «No pudimos completar la operación. Intenta de nuevo más tarde.» (sin código) | Operación del Planificador o de Personalización falla | `OPERACION_FALLIDA` | «No pudimos completar la operación. Intenta de nuevo más tarde.» (se conserva, ahora con código) | Sí |
| G1i | F2b Reportes Error 217:16529 (3 sitios) | «No se pudo cargar el reporte.» | La consulta del reporte falla | `REPORTE_NO_CARGA` | Se conserva | Sí |
| G1j | F4b 217:18219 | «No se pudieron cargar los widgets.» + botón 102×36 | Falla la carga de la lista de widgets | `WIDGETS_NO_CARGAN` | Se conserva | Sí (el botón ya existe) |
| G1k | F4b 2211:79556 | «No pudimos cargar el clima. Intenta de nuevo más tarde.» | Falla el servicio de clima | `CLIMA_NO_CARGA` | Se conserva | Sí |
| G1l | F5 2251:5080 | «No pudimos cambiar el inicio automático. Intenta de nuevo.» | Falla el ajuste del sistema | `INICIO_AUTOMATICO_FALLIDO` | Se conserva | Sí |
| G1m | F5 2251:5185 (G6) | «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.» | Falla el cierre de sesión | `CIERRE_SESION_FALLIDO` | Se conserva | No (el texto ya da la salida) |
| G1n | F6 2233:9358 | «No pudimos cargar las noticias. Intenta de nuevo más tarde.» | Falla el servicio de noticias | `NOTICIAS_NO_CARGAN` | Se conserva | Sí |
| G1o | F6 2233:9789 | «No pudimos mostrar tu wallpaper…» | La imagen no se muestra | `WALLPAPER_NO_SE_MUESTRA` | Se conserva | No |
| G1p | F8 M-20 | «No pudimos completar la instalación. No se hicieron cambios en tu computador.» | Falla del instalador | `INSTALACION_FALLIDA` | Se conserva | Sí (Reintentar / Cerrar ya existen) |
| G1q | F4a avisos de Organizar widgets | «No se pudo completar la operación.» | Colisión o fallo al organizar | `ORGANIZAR_WIDGETS_FALLIDO` | «No se pudo reorganizar. Revisa que los widgets no se tapen.» | No |
| G1r | F1 franjas 2249:2164, 2249:2362, 2249:2263 | «No fue posible iniciar sesión con Google. Intenta de nuevo.»; «No pudimos abrir el navegador. Intenta de nuevo.»; correo de Google de más de 64 caracteres | Fallo de Google, del navegador, dato inválido | `GOOGLE_NO_DISPONIBLE`, `NAVEGADOR_NO_ABRE`, `CORREO_GOOGLE_MUY_LARGO` | Se conservan | Sí en los dos primeros; no en el tercero |
| G1s | F4b 2180:34972 «No pudimos leer la imagen…» | Ya es específico | Imagen ilegible | `IMAGEN_ILEGIBLE` | Se conserva | No |

### 6.2 Otros errores y textos

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| G2 | Guardar como tema y Renombrar tema | Faltan solo las causas de vacío | F4b 2178:32678 y 2178:32554 existen; «Escribe de 1 a 40 caracteres.» (ayuda) | `TEMA_NOMBRE_VACIO` «Escribe un nombre para el tema.», `TEMA_NOMBRE_REPETIDO` (copiar 2178:32678), `TEMA_NOMBRE_MUY_LARGO` (copiar 2178:32554) | MEDIDO dos textos (F4b); vacío PROPUESTA |
| G3 | Windi Sin conexión | Texto corto frente a largo | «Sin conexión» / F3 204:2698 | El largo de F3 (ver G1c) | MEDIDO (F4a 19, F5 10, F3 46) |
| G4 | Errores de servidor de F1 | Tres patrones: píldora, franja #fae6dd sin ícono ni cierre, píldora con enlaces dentro | «Credenciales incorrectas»; «Cuenta bloqueada», «Demasiados intentos», «Sesión vencida», «Google cancelado/no disponible», «Navegador no abre»; «Correo ya registrado» | Un solo patrón: píldora de error con ícono y cierre; los enlaces de «Correo ya registrado» como acciones separadas. Cada uno con código estable (`CREDENCIALES_INCORRECTAS`, `CUENTA_BLOQUEADA`, `DEMASIADOS_INTENTOS`, `SESION_VENCIDA`, `CORREO_YA_REGISTRADO`) | MEDIDO (F1 10); códigos PROPUESTA |
| G5 | Avisos: ocultar solos | Tiempos | F0 §5: Éxito/Información 4 s, Advertencia/Error 6 s; RD-104 (docs/rediseno.md L204) | **Éxito e Información 4 s; Advertencia 6 s; Error se queda hasta que la persona lo cierre.** Transición DISSOLVE 0,15 s EASE_OUT | MEDIDO (F0 §5, RD-104); decisión de Paula |
| G6 | Cerrar sesión | Aviso sin pantalla que lo dispare | 2251:5185 | Se muestra cuando falla el cierre (G1m) | MEDIDO (F5 11) |
| G7 | Migas de login | «Inicio de sesión / Recuperar contraseña» repetido en 84:42 y 84:62 | | Miga por paso: 84:2 «Recuperar contraseña › Verificar correo»; 84:42 «Recuperar contraseña › Verificar código»; 84:62 «Recuperar contraseña › Nueva contraseña» | MEDIDO el defecto (F1 19); textos PROPUESTA |
| G8 | Comillas | «…» (Windi, Cambiar, Mover) frente a “…” (Saludo, No encuentra; F8 M-04 a M-10 y M-13 a M-15) | | « » en todo el español | MEDIDO (F2a 13, F3 5, F8) |
| G9 | Saludo de Windi | Nombre fijo «Estef» y emoji (F3 2172:2145: «¡Hola, Estef! Soy Windi…», «¡Bien hecho, Estef! 🎉…») | | **Sin emoji, con el alias de la persona** (D11): «¡Hola, {alias}! Soy Windi.» | MEDIDO (F3 61); decisión D11 |
| G10 | Entregar ensayo | Fechas distintas en el modal y en el Planificador | «27/11/2026» con texto 24/11/2026 | Un dato único (24/11/2026) | MEDIDO (F2a 11 y 4) |
| G11 | Datos de prototipo de Clima | Tres valores | «Popayán, Colombia» (204:42140), «Bogotá, Colombia» (217:24330), «Popayán, Cauca, Colombia» (F4b 217:18954) | «Popayán, Colombia» | MEDIDO (F0 §6.16, F4b 4 y 217:18954) |
| G12 | F7 | Faltan mensajes de otros fallos (M-19, M-20) | | Ver G1p; M-19 usa `INICIO_AUTOMATICO_FALLIDO` si es de ajustes | MEDIDO (F7 9) |
| G13 | Diálogos M-18, M-19, M-21 | Solo X | | Botón «Entendido» (D12) | MEDIDO (F8 5); decisión D12 |
| G14 | Erratas | F1 y F7 sin erratas; sin hallazgo en el resto | | Nada que corregir | MEDIDO (F1 19, F7 9) |
| G15 | Contador de widgets «2 imágenes · 10 s» (203:8402) | Frente a la píldora «2 de 10» | | «2 de 10» | MEDIDO (F4a 14) |
| G16 | M-02, M-04, M-01 | «Salir sin guardar» (M-02), «Cambiar sin guardar» (M-04) como Principal; «Cancelar instalación» (M-01) como Principal (F8 incoherencia 4) | | **Destructivo** en los tres (D13) | MEDIDO (F8 5, incoherencia 4); decisión D13 |
| G17 | M-11 y M-12 (Cerrar sesión) | Son **dos nodos**: 79:6 (F5 204:26002, 233:24776, 204:26102, 204:26202; Principal en 3 temas, huellas 204-26102, 204-26202, 233-24776) y 83:4 (F8 85:138, 233:25941, 198:414, 85:144; Destructivo en los 4) | | **Destructivo en ambos nodos y en los 4 temas** | MEDIDO (F5, F8, 83-4-diff-familias.json); decisión de Paula |
| G18 | RD-106 en Clima | Pide «Salir sin guardar» al cerrar | | Solo si la ciudad elegida es distinta de la inicial (pieza S; anotar en `docs/DUDAS.md`) | Decisión de Paula |

## 7. Prototipo: reacciones con URL externa, botones sin destino y transiciones

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| P1 | Barra lateral (F2a), M-11, widgets, 21 familias de F8, 4 reacciones de F7 | Reacciones URL a la copia «Windgets--Copy-» | URL externa | No copiar: la navegación sigue la HU, no la URL | MEDIDO (F2a 10, F5 1, F6 8, F7 1, F8 1); decisión de Paula |
| P2 | Login | «Guardar contraseña» (84:62) sin reacción; «Verificar» de 84:2 se salta 84:42 y 84:62; «Reenviar código» sin reacción | | Flujo 84:2, 84:42, 84:62 en orden; reenviar con acción real | MEDIDO (F1 9) |
| P3 | Windi (2170-2172, 13 variantes) | Confirmar y Rechazar sin reacción; enviar pierde su reacción (también 2048:669) | | Todo botón sin destino se implementa con la acción de la HU | MEDIDO (F3 1, F5 2); decisión de Paula |
| P4 | Windi | `Reintentar` (204:2787) sin reacción; Rechazar en 204:2876 sin reacción, con ella en 204:2516 | | Reintentar reenvía el último mensaje; Rechazar descarta | MEDIDO (F3 2) |
| P5 | Modales del Planificador | Sin cierre por clic fuera en algunos (los selectores flotantes sí) | | Cierre por velo en todo modal. Con datos escritos pide descartar (RD-106). La lista completa de modales se toma de F2a/F2b: Nueva tarjeta, Editar tarjeta, Mover a, Etiquetas, Calendario, Reportes (Elegir Desde/Hasta) | MEDIDO el defecto (F2a 7); lista de modales PROPUESTA |
| P6 | Cancelar y Abrir Windgets (F7) | Navegación sin transición | | Sin transición | NO MEDIDO (F7: no se leyó) |
| P7 | Avisos y cierre | Entrar, cerrar, puntero encima | DISSOLVE 0,15 s EASE_OUT; Calendario sin transición | DISSOLVE 0,15 s EASE_OUT en todo; respetar «reducir movimiento» | MEDIDO (F0 §5, F2b 8) |
| P8 | Organizar widgets | Arrastrar y redimensionar | SMART_ANIMATE 0,2 s EASE_OUT | 0,2 s EASE_OUT | MEDIDO (F4a) |
| P9 | «Ampliar menú» | 204:32252 CHANGE_TO frente a 2068:2476 NAVIGATE en 203:9985 | | CHANGE_TO | MEDIDO (F4a 12) |
| P10 | Clima (203:6696) | Apunta a 2211:79096, no listada | | Documentar el destino en la HU de Clima | MEDIDO (F4a 5) |
| P11 | Overlays M-04, M-05, M-06, M-15 | Aviso de nombre fijo «Rosa pastel» | | Nombre del tema activo | MEDIDO (F4a 23) |
| P12 | Cambios sin guardar (203:9985 y siguientes) | Elegir tema abre M-04 en 9985 y SET_VARIABLE en 10056 y 10127 | | M-04 solo si hay cambios sin guardar | MEDIDO (F4a) |
| P13 | Carpeta en el instalador | Botón «Cambiar» oculto | | **Se mantiene oculto** (D14) | MEDIDO (F7 7); decisión D14 |
| P14 | Interacciones de F2a/F2b | No se leyeron transición, duración ni curva; SET_VARIABLE y CONDITIONAL solo por tipo | | Usar P6 a P8 | NO MEDIDO (F2a, F2b) |
| P15 | Ventana de la aplicación | Solo 1280×790 en Figma | | **PROPUESTA D15, confirmar en fase 5:** se abre maximizada al área de trabajo de la pantalla, se puede minimizar a la barra de tareas, y el diseño de 1280×790 se adapta (el contenido crece, no se recorta) | PROPUESTA (decisión literal de Paula en «D15») |
| P16 | Interruptor «Sombra» de Personalización (F4a 203:10717; F4b 2213:85446 «Con sombra») | Sin medida de la sombra | radio 10,85 = 9×1,2029; Redondas 22 es medido | Sombra dura de 1,3 con `sombra`, la de Windi widget (R8), aplicada al widget | NO MEDIDO (el Figma no dibuja el resultado); valor PROPUESTA |
| P17 | Funcionalidades nuevas de los prototipos | | | Todas se implementan (decisión de Paula) | Decisión |
| P18 | Hallazgos del inventario en general | | | Unificar al valor de F0 y anotarlo en `DECISIONES.md` con «Paula cambia a:» | Decisión |

## 8. Residuos de capas y nombres que no coinciden con su texto

Regla: ninguno de estos nombres entra al código; el texto visible manda. Los residuos se ignoran.

| # | Dónde (página e id) | Qué varía | Valores vistos | Valor único | Tipo y fuente |
|---|---|---|---|---|---|
| N1 | F1: franjas, saludos de Windi, campo de código, textos deshabilitados (2249:3614, 2249:3955, 2250:1561) | Nombre distinto del texto | «Sin conexión. Conéctate para enviar el código.» en todas; «¡Hola! Soy Windi.»; «Text» vacío; «Enviar código» con texto «Verificar» o «Guardar contraseña»; capas «Group» | Texto visible manda | MEDIDO (F1 13) |
| N2 | Planificador (F2a) | Capas con otro texto | «27/11/2026» con 24/11/2026; «En revisión» con «En progreso»; «27 nov · Media» con «24 nov · Baja»; «No hay tarjetas para hoy.» con «No tienes tarjetas para hoy.» | Texto visible manda | MEDIDO (F2a 4 y 12) |
| N3 | Modales (F2a) | Residuos | «Tipo · botones», «Prioridad · botones» sobre el campo; «Color» y «Catálogo de colores» en Mover a; miga de 204:1442 omite el último nivel; 204:1316 muestra «Día seleccionado» y «24» | Ignorar | MEDIDO (F2a 5) |
| N4 | Reportes (204:1581) | 462 filas con texto plano duplicado; barras residuales bajo el anillo; Evento con 1 o 2 según capa | | Un solo dato por cifra; **Evento = 2** (D16) | MEDIDO (F2a 2); decisión D16 |
| N5 | Reportes (204:1005 y 204:1683) | Fondos distintos, anillo y leyendas duplicados | | **204:1005 es el único reporte** | MEDIDO (F2a 1); decisión de Paula |
| N6 | Etiquetas y estados (F2b) | «Revisar los bocetos», «Proyecto · 27 nov» con «Pagar el gimnasio» / «22 nov 2026»; «Salud/Personal» y «Media» en «Sin prioridad»; «Tarea» en Recordatorio / Evento; «Proyecto · Universidad» con «Elige etiquetas» | | Texto visible manda | MEDIDO (F2b 5) |
| N7 | Reportes · Elegir Desde / Hasta | Texto oculto «  » como marcador de error (0 px) y lista vieja; «Rango recortado» y «Sin tarjetas» con datos incoherentes (83,3 % frente a 50,0 %) | | Eliminar el marcador; datos coherentes | MEDIDO (F2b 6) |
| N8 | Windi (F3) | `Nuevo · instancia` y `Nuevo · Propuesta` repetidos; `Windi · Mensaje` y `Nuevo · Mensaje Windi` son el mismo componente; `Ir · Reintentar` no navega; dos formas de dibujar la propuesta (203 componente y 278 manual) | | Un solo componente de propuesta | MEDIDO (F3 4 y 7) |
| N9 | Personalización (F4a) | «Aplicado» con «24 nov»; «0 %» con «0 px»; «Principal · #6604E6» con texto #00D9E2; «Restablecer colores y tipografía» con «Restablecer tipografía»; ✓ dos veces; restos «Bogotá   18 °C», «Nuevo · ícono del clima», «Nuevo · temperatura», «Nuevo · ciudad». F4a 22 (203:10942): «Restablecer» sin confirmación | | Texto visible manda; un solo ✓. «Restablecer» pide confirmación (acción que pierde datos): PROPUESTA | MEDIDO (F4a 1, 4, 9, 15, 17, 22, 24); F4a 10 y 11 (203:8236, 203:7987) NO se revisaron aquí |
| N10 | Personalización (F4b) | «Bogotá, Colombia» con «Popayán, Colombia»; «Atardecer/Colinas/Horizonte» con Amanecer/Bosque/Taller; filas «Ir · Cambios sin guardar»; «Windgets» con «Rosa pastel» en Rosa y Enfoque; breadcrumb «4 Widgets › Forma de los widgets» | | Texto visible manda | MEDIDO (F4b 4 y 11) |
| N11 | Barra y mensajes (F5, F6) | «Configuración» ×2, «Nuevo · …»; `Descartado · panel anterior` oculto en cada overlay de Windi; capa «Sin conexión. Los cambios quedan pendientes.» con otro texto | | Ignorar | MEDIDO (F5 9, F6 4, F3) |
| N12 | Instalador (F7) | «Inicio automático» ×3 con texto distinto; «Cancelar» y «Cerrar» duplicados; «Instalación completada.» repetido con el título | | Un solo título | MEDIDO (F7 3, 4 y 7) |
| N13 | F8 | Cada botón con envoltorio de clic y texto oculto duplicado | | No implementar | MEDIDO (F8 3) |
| N14 | Tooltips del ojo (F1) | «Mostrar contraseña» y «Ocultar contraseña» fuera del formulario (771;314 y 772;314) | | Dentro del campo | MEDIDO (F1 18) |
| N15 | Campos de F1 (D17) | Placeholders desiguales | código sin placeholder; correo «nombre@ejemplo.com» solo en 84:22 | **PROPUESTA D17, confirmar en fase 5:** ejemplo de formato donde el formato importa (correo «nombre@ejemplo.com», código de verificación «123456»), nunca en lugar de la etiqueta; la etiqueta siempre visible | MEDIDO (F1 14); regla PROPUESTA |
| N16 | Selector de apariencia | Solo en login y registro | no en 84:x ni 88:2 | Solo donde está | MEDIDO (F1 17) |
| N17 | Colecciones | **Seis** colecciones con modo «Mode 1»; `80:2` duplica la paleta antigua; `informacion` repite `principal` sin alias; sin Windgets oscuro en la barra | | Solo `200:2`; `informacion` alias de `principal`; barra con modo oscuro | MEDIDO (F0 §6.12, 13 y 17, conteo del revisor) |
| N18 | Documento de ids | Dice 51 familias, lista 50 | | Contar 50 | MEDIDO (F1 20) |
| N19 | F1: desvíos y anchos | Fondo oscuro #1c1922 frente a #201b2b; fondo claro #f5f0ff sin mapear a `marco`; anchos 554 y 575 | | `marco` del tema; anchos dentro del máximo de D7 | NO MEDIDO aquí (copiado de F1 desvíos, sin verificar contra huella) |
| N20 | Windi (F3 §9) | Contador en otra posición en Mensaje muy largo | (227,488) ancho 68 frente a (249,518) | (249,518) como en las demás | MEDIDO (F3 114) |

---

## D7. Dónde van los avisos y cuánto miden (PROPUESTA, confirmar en fase 5)

**Decisión de Paula:** «los avisos no deben tapar la información, analiza la mejor opción». Lo siguiente es análisis más propuesta; no hay medida del Figma para la posición ni el ancho máximo.

**Medidas que sirven (MEDIDO, huellas 204-622, 204-1139, 204-805, 204-1005, 204-1078, 204-916; marco 1093×560, barra lateral 176):**
- Cabecera, fila 1: miga en (200,19), alto 18, ancho medido 139 a 357 (máximo 357 en 204-1139, «Planificador › Tablero Kanban › Tablero Kanban · Expandida»). «Sincronizado»: ícono 16 en (978,20), texto 69×16 en (1000,20), borde derecho 1069.
- Fila 2: título en (200,49) alto 35; controles en y=48 a 84, el primero empieza en x=592 (Calendario), 625 (Reportes), 695 (Agenda), 994 (Kanban), 1033 (Nueva tarjeta/Etiqueta).
- Aviso actual de 42 de alto en y=4 ocupa y 4 a 46: solo la fila 1.
- Anchos de aviso medidos: F5 560, 561, 488, 430; F2a 660, 544, 523×37, 320×37; F4b 715 (2178:33360, llega a x=354), 585, 467, 462, 460, 459, 450, 412, 401, 336; F4a 242×42; 282×37; F4b 217:18759 276×36.

**Propuesta:**
- **Posición:** aviso flotante (no empuja el contenido) en la franja superior, y=4. Borde derecho 12 px a la izquierda de «Sincronizado» (x=966 en un marco de 1093). Borde izquierdo 16 px después del fin real de la miga (357 medido máximo, es decir x=573 como inicio más a la derecha en el peor caso).
- **Ancho máximo** = min(480, 966 − fin de la miga − 16). En el peor caso medido a 1093 de ancho son 393; crece con la ventana; el tope 480 sale de leer ~70 caracteres por línea.
- **Salto de línea:** por palabras; nunca truncar, nunca recortar con puntos suspensivos. Con ~5,9 px por carácter, todo mensaje medido cabe en 2 líneas (el de 715 queda al borde de 3).
- **Alto:** 42 para 1 o 2 líneas (2×16+8=40 con alto de línea 16; alto de línea NO MEDIDO, automático). **No se permiten avisos de 3 líneas** (56 de alto tocarían la fila 2): se acorta el texto.
- **Radio:** 21 en 1 y 2 líneas (el texto empieza a 34 px del borde, y el recorte de esquina en 2 líneas es ≈7 px). 
- **Avisos de 36-37 de alto junto a la barra lateral**, hoy en flujo y empujando contenido: F2a 217:10958 (523×37, +45 px de empuje) → se sustituye por el indicador de estado «Sin conexión · N pendientes» en el lugar de «Sincronizado» (como F5 217:20400) y un aviso temporal «Se muestran los datos guardados.»; F2a 217:11270 (320×37 en (757,86)) → píldora de Información en la franja; F4a 217:17946 (píldora 242 + tarjeta 282×37) → solo la píldora; F4b 217:18759 (276×36) es error de campo, no aviso: trazo `error` 2 px (E13).
- **Apilado:** máximo un aviso visible; uno nuevo reemplaza al anterior, salvo que el anterior sea un Error (esos se quedan hasta cerrarlos, G5): entonces el nuevo se pone debajo, y=50.

**Qué falta:** NO MEDIDO el alto de línea; NO MEDIDO el comportamiento en ventana menor de 1093 (depende de P15).

---

## Decisiones de Paula (26-nov)

| D | Caso | Decisión |
|---|---|---|
| D1 | Colores de avisos | Variables de estado: Advertencia `estado_pendiente`, Éxito `estado_completada`, Error `error`, Información borde e ícono `informacion`. El título del aviso va en `texto` (P2) |
| P1 | Morado y cian en oscuro | Donde se juntan (trazo de la fila seleccionada, casilla marcada de Tareas, trazo de la columna Kanban) se usa `tinta` `#f8f5ff`. Excepción a la regla 7 solo en oscuro; en claro, Rosa y Enfoque sigue `#0F2A33` |
| P2 | Aviso de Información | Texto en `texto`; `informacion` solo en borde e ícono, como los demás avisos. Reemplaza «texto `principal_legible`» de D1 |
| P3 | Texto sobre relleno cian | `#0B2A2E` (8,68:1). Cambia `sobre_accion` (claro y oscuro) y `sobre_seleccion` (oscuro) |
| P4 | Tamaño base | Mediano 14. Pequeño 12 (12,25) y Grande 18 (17,5, empate redondeado hacia arriba). El código usa hoy 14, 16 y 20 |
| D2 | Colores de Windi | Fijos |
| D3 | Catálogo de colores de etiqueta | Los 9 del Figma; ejemplos y puntos del Kanban pasan al color del catálogo más cercano; Windi nombra colores del catálogo |
| D4 | Contraste de Selector de color | Aviso (sin bloquear) si el color baja de 3:1 |
| D5 | Radios | Panel lateral 12; papel de diálogos 10 con pliegue 22 |
| D6 | Anillo de foco | 2 px `tinta`, radio del control + 3, también en campos |
| D7 | Ancho y lugar de los avisos | Paula: «los avisos no deben tapar la información, analiza la mejor opción». Análisis y PROPUESTA en la sección D7 (confirmar en fase 5) |
| D8 | Estilos de texto 42/26/17 | Se quitan |
| D9 | Vacío y cargando | Los que el Figma no dibuja (Calendario, widgets, instalador) se redactan ya en las specs con el patrón de 5 barras `linea` r6; los que sí trae F2b se copian |
| D10 | Errores genéricos | Redactados ya en las specs: un mensaje por causa con código estable; «Reintentar» solo donde sirve (sección 6.1) |
| D11 | Saludo de Windi | Sin emoji, con el alias |
| D12 | M-18, M-19, M-21 | Botón «Entendido» |
| D13 | M-02, M-04, M-01 | «Salir sin guardar», «Cambiar sin guardar» y «Cancelar instalación» en Destructivo |
| D14 | Carpeta del instalador | Botón «Cambiar» oculto (como el Figma) |
| D15 | Tamaño de ventana | Paula: «quiero que ocupe el máximo de la pantalla actual dependiendo del dispositivo, o dejar un tamaño fijo y solo bajar a la barra de tareas». PROPUESTA: abre maximizada al área de trabajo y se puede minimizar; el diseño 1280×790 se adapta. Confirmar en fase 5 |
| D16 | Evento en Reportes | 2 |
| D17 | Placeholders | Paula: «quiero que la aplicación sea usable». PROPUESTA: ejemplo de formato donde el formato importa (correo «nombre@ejemplo.com», código de verificación), nunca en lugar de la etiqueta. Confirmar en fase 5 |
| G5 | Tiempos de aviso | RD-104: Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrarlo |
| R11 | Forma de widgets | Rectas 0, Base = variable 9, Redondas 22 |
| Error de campo | Trazo | `error` 2 px, radio 9 (lo que trae F0; por la regla de unificar) |
| M-11 / M-12 / M-01 | Cerrar sesión y cancelar instalación | Destructivo en 79:6 y 83:4, en los 4 temas; M-01 «Cancelar instalación» Destructivo |
| RD-106 en Clima | Descarte | «Salir sin guardar» solo si la ciudad elegida es distinta de la inicial (pieza S; anotar en `docs/DUDAS.md`) |
| Inventario | Unificar | Al valor de la variable o del componente de F0; anotarlo en `DECISIONES.md` con «Paula cambia a:» |
| Reportes | Versión | 204:1005 es el único reporte |
| Navegación | Destino | Por la HU, no por las URL a «Windgets--Copy-»; botones sin destino se implementan con la acción de la HU |
| Menos scroll | Desborde | Primero ajustar el contenido para que quepa (Vencida 217:11114 y todo lo que desborde); desplazamiento solo como último recurso |
| Funcionalidades nuevas | Prototipos | Todas se implementan |
| Tipografía | Fuente | Por tema (claro y oscuro Nunito, Rosa Quicksand, Enfoque Space Grotesk); Rubik pasa a la del tema; la tipografía elegida en Personalización manda en toda la app (Nunito por defecto) |

## Pendiente de Paula

| # | Qué | Por qué sigue abierto |
|---|---|---|
| 1 | Confirmar en fase 5 la posición y el ancho de avisos (D7) | Propuesta sin medida en el Figma |
| 2 | Confirmar en fase 5 el tamaño de ventana (D15) | Propuesta sobre su literal |
| 3 | Confirmar en fase 5 los placeholders (D17) | Propuesta sobre su literal |
| 4 | Contraste de Éxito en claro (2,96:1, 0,04 bajo 3:1), `informacion` como borde e ícono en claro (1,68) y Rosa (1,55), `estado_vencida` oscuro como ícono (2,85), `principal_legible/superficie_baja` en Rosa (2,96), y las PROPUESTAS `sobre_detalle` claro `#ffffff`, `perilla` oscuro `#0b2a2e` y trazo `borde` en la casilla de Rosa y Enfoque (TEMAS_Y_TOKENS 6.3) | Fallan 3:1 o 4,5:1; hay que aceptar o ajustar la variable |
| 5 | Textos y códigos propuestos de la sección 6.1 (G1a, G1f, G1q) y del vacío del nombre de tema (G2) | No existen en el Figma |
| 6 | Textos de vacío y carga del Calendario, widgets e instalador (E7, E9, E10) | No existen en el Figma; propuestos |
| 7 | Q2: mapeo de etiquetas existentes al catálogo (C9): `#2b7a8c` y `#2a6f8f` a Cian, `#b04f7d` a Rosa | Elegido por tono (excepción a la distancia Lab), no medido |
| 8 | Valor de la sombra del interruptor «Sombra» (P16) | Sin medida en F4a ni F4b |
| 9 | Q1: `relleno_*` como tabla fija con los hex del Figma (la fórmula `mezclar(superficie, estado, 0,3)` reproduce 10 de 12) | PROPUESTA; el código de `derivar.ts:95-97` da 70 % estado, invertido |
| 10 | Q3: empaquetar Nunito 600 | PROPUESTA; hay 6 reglas con `font-weight: 600` |
