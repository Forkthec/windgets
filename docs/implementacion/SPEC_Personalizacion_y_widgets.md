# SPEC · Personalización y widgets (página 04 Personalización, `79:5`)

Escrita el 26-nov-2026 (UTC-5). Tercera spec de la serie; usa la plantilla de diez partes de `SPEC_Marco_y_componentes_base.md` y la forma de `SPEC_Planificador.md`. **Pendiente de la aprobación de Paula** (solo ella aprueba las specs). Archivo solo local: no se sube a ningún sitio sin el sí de Paula para este archivo.

**Revisado 26-nov: hallazgos del revisor aplicados** (25 comprobados contra su fuente; los rechazados o ajustados se explican en «Incoherencias resueltas», filas «Revisión»).

**Llegó hasta:** las 130 familias vigentes de `docs/rediseno_flujos_ids_prototipos.md` líneas 222-380 quedan cubiertas (PW-01 a PW-15). Las filas de «Descartado» `2213:84270` (Selector · Datos Clima, Datos Imagen estática, etc.) se ignoran. Lo que el inventario no mide va como «NO MEDIDO (motivo)».

**Alcance.** Página `79:5`: los cuatro pasos de la cabecera (1 Tema, 2 Fondo, 3 Colores y tipografía, 4 Widgets) y su barra expandida; Guardar como tema, Renombrar tema, Mis temas; Fondo (catálogo, subir, sin imagen, ajuste, ajuste por monitor); Colores (paletas, selector de color) y Tipografía; lista de widgets, Agregar widget con sus ocho subpantallas, Configurar widget (12) y los selectores superpuestos; Forma de los widgets, Distribución predefinida y Organizar widgets; Cambios sin guardar → Guardado → Aplicado; ventanas M-02, M-04, M-05, M-06, M-07, M-15; Windi superpuesto. Código en `apps/desktop/src/screens/{personalization,themes,widgets}` y `apps/desktop/src/edicion`.

**Fuentes y orden de autoridad.** Figma (`.trabajo/figma/F4a.md` con su continuación F4a2 —no existe un archivo `F4a2.md`, va dentro de `F4a.md`—, `F4b.md` y las huellas `.trabajo/figma/huellas/*.json`; componentes `F0.md`/`F0b.md`) → `docs/rediseno.md` (RD-nn) → HU (`docs/HE-02.md` a `HE-05.md`) y `docs/contratos.md` → `docs/rediseno_cambios_implementacion.md`. Mandan sin contradecir: `CONSISTENCIA.md` (R, A, T, E, G, D7), `TEMAS_Y_TOKENS.md` (T-nn, P-nn, Q-nn), `ANIMACIONES.md` (A-nn), `SPEC_Marco_y_componentes_base.md` (MB-nn) y `.trabajo/DECISIONES_PAULA_26nov.md` (D-nn). Donde CONSISTENCIA o DECISIONES ya unificaron, se unifica al valor de la variable o del componente de F0, y la diferencia con la huella va a «Incoherencias resueltas».

**Etiquetas.** MEDIDO · DECISIÓN (id) · PROPUESTA · NO MEDIDO (motivo). Tamaños: S ≤ 1 h, M ≤ media jornada, L > media jornada. Los ids de la parte 1 van en el orden **claro | oscuro | Rosa | Enfoque**. Ids de esta spec: PW-01 … PW-15.

**Convenciones comunes (valen para todas las piezas).**
- Marco de pantalla del Figma 1093×560; la ventana real es 1280×790 (mínimo 960×600), barra lateral de 176 px (56 contraída, MB-02). Las medidas son del marco del Figma. Con la barra expandida se desplazan **solo el contenido y la vista previa** 120 px (x 76→196) y la vista previa baja de 664×373 a 552×310 (2068:667); el panel lateral no se mueve.
- Disposición común de las pantallas de paso: migas en (76,20) (MB-03); vista previa a la izquierda; **panel lateral de 300×348 en (769,100), fijo**, relleno `superficie`, trazo `linea` 1, radio 10 (D5 lo fija en 12 para el panel lateral: manda 12, ver Incoherencias n.º 2); título del panel Medium 17 `tinta` en (781,110); controles del panel de 276 de ancho desde x=781. Barra inferior de guardado en las pantallas de paso (PW-05).
- Cada pantalla cabe sin scroll de página (Paula: «el menos scroll posible»). El panel hace scroll interno solo si el contenido supera sus 348 (lista de temas: 284×256 con scroll propio, `203:6362`).
- Radio de control 9, foco 2 px `tinta` con radio del control + 3 (D6). Interruptor 44×24 con radio 8; casilla radio 4 (R1). Selectores y listas: radio 9, borde `borde_campo` 1,5 (R6). Error de campo: trazo `error` 2 px, radio 9 (R10). Filas «Forma» y «Distribución»: radio 9 y trazo `linea` (R12). Perilla de «Sombra» = `perilla` (R13). Formas de widget: Rectas 0, Base 9 (variable `Radio de widgets`), Redondas 22 (R11); los 10,85 y 10,826 de la vista previa son escala del marco, no tokens.
- Alturas (A2 de CONSISTENCIA, que manda sobre la huella): fila de lista 44, botón de fila 32 y todo lo demás 36, incluido el selector superpuesto (la huella tiene 31; ver Incoherencias n.º 18). Las filas de lista de 32 de las huellas (Mis temas, Texto, Imagen estática, Carrusel, Animación) pasan a **44** (fila de lista de F0, 300×44); el botón dentro de una fila es de 32 (tamaño «Fila»); las de 36 (Forma, Distribución, Música, Windi, Reloj, Configurar) se quedan en 36; las opciones de selector de 31 (paso 35) pasan a 36; la fuente y el tamaño de 30 pasan a 36. En la parte 3 de cada pieza se anota la medida de la huella (MEDIDO) y se aplica la A2 en la tabla de geometría y en la implementación (diferencia en Incoherencias n.º 18).
- Fuente: Nunito (claro y oscuro), Quicksand (Rosa), Space Grotesk (Enfoque); la que elige la persona manda sobre la del tema (T3/T4). Tamaño base P4: Pequeño 12, Mediano 14, Grande 18. Lista de fuentes: Inter, Merriweather, Poppins, JetBrains Mono, Nunito (T13).
- Se citan, no se repiten: encabezado y miga MB-03, botón MB-10, campo MB-11, casilla MB-12, interruptor MB-13, segmentado MB-14, selector MB-15, nombre emergente MB-21, ventana emergente MB-22, confirmación y lista M-nn MB-23, avisos MB-24, vacío MB-25, colores MB-26, Windi MB-05 y MB-27, íconos MB-28, indicador de sincronización MB-04.
- **Avisos (D1, P2, G5, D7, RD-104).** Color: Advertencia `estado_pendiente`, Éxito `estado_completada`, Error `error`, Información borde e ícono `informacion`; el texto va en `texto`. Los hex del Figma (#b47700, #c68700, #c32d43, #b32d42, #00d9e2) son de los temas del prototipo y se reemplazan por la variable. Tiempo: Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrarlo; DISSOLVE 0,15 s EASE_OUT. Posición y ancho (D7, que manda sobre la huella): flotante en y=4 con el **borde derecho en x=966** (12 px a la izquierda de «Sincronizado»), ancho máximo min(480, 966 − fin de la miga − 16), dos líneas como máximo (alto 42, radio 21), uno visible a la vez; los errores no se reemplazan (el nuevo va en y=50). En el Figma las píldoras de la barra superior miden 42 de alto y terminan todas en x=1069 (x + ancho = 1069): esa x de las huellas es MEDIDO pero se reemplaza por la D7; en cada tabla se da la x resultante (966 − ancho) entre paréntesis (Incoherencias n.º 19). Los de 585 (Imagen del tema no encontrada), 715 y 717 (Personalización más reciente) pasan a dos líneas dentro de 480 (A18).
- **Esqueleto de carga (D9):** 5 barras `linea`, radio 6, paso 54; A-32; «Cargando…» para lectores de pantalla (`aria-busy`).
- **Errores (D10 y regla global).** Todo error previsto lleva código estable y texto en el campo que corresponde; el genérico solo para lo imprevisto. Se usan primero los códigos de `contratos.md` (`a.b`), luego los de CONSISTENCIA §6 (G1h `OPERACION_FALLIDA`, G1j `WIDGETS_NO_CARGAN`, G1k `CLIMA_NO_CARGA`, G1n `NOTICIAS_NO_CARGAN`, G1q `ORGANIZAR_WIDGETS_FALLIDO`, G2 `TEMA_NOMBRE_*`). Solo cuando no existe ninguno se crea uno en MAYÚSCULAS_CON_GUION_BAJO marcado PROPUESTA. Las claves de `apps/desktop/src/types/messages.es.json` (p. ej. `IMAGEN_ILEGIBLE`, `CIUDAD_SIN_CONEXION`) son la clave del texto, no el código: no se duplican como segundo código.
- **Colores (D3, Q2):** catálogo de 9 colores (MB-26). **Morado y cian (P1):** en oscuro, donde se juntan (fila seleccionada, casilla, trazo) va `tinta` #f8f5ff; en claro, Rosa y Enfoque #0F2A33.
- **Funciones nuevas del Figma:** todas se implementan (Paula, 26-nov); se marcan «NUEVA» en la parte 9. Los códigos nuevos van marcados PROPUESTA.

---

## PW-01 · Marco de pasos y barra expandida

**Familias (12):** los cuatro pasos, la barra expandida de cada pantalla y los nombres emergentes de la barra. «Pasos» = los cuatro botones numerados **en fila horizontal en la cabecera**, a la derecha del título (instancias de Paso, Estado = Actual u Otro), unidos por tres conectores.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| 1 Tema | `203:6362` | `233:18961` | `204:9648` | `204:9726` |
| 2 Fondo | `203:6440` | `233:19054` | `204:9804` | `204:9884` |
| 3 Colores y tipografía | `203:6520` | `233:19117` | `204:9964` | `204:10051` |
| 4 Widgets | `203:6607` | `233:19187` | `204:10138` | `204:10227` |
| 1 Tema · Barra expandida | `2068:667` | `2068:3890` | `2068:7117` | `2068:10421` |
| 2 Fondo · Barra expandida | `2068:966` | `2068:4189` | `2068:7420` | `2068:10725` |
| 3 Colores y tipografía · Barra expandida | `2068:1233` | `2068:4456` | `2068:7691` | `2068:10997` |
| 4 Widgets · Barra expandida | `2068:1522` | `2068:4745` | `2068:7984` | `2068:11291` |
| Agregar widget · Barra expandida | `2068:1830` | `2068:5053` | `2068:8296` | `2068:11604` |
| Configurar widget › Reloj · Barra expandida | `2068:2103` | `2068:5326` | `2068:8573` | `2068:11882` |
| Cambios sin guardar · Barra expandida | `2068:2476` | `2068:5699` | `2068:8958` | `2068:12270` |
| Barra contraída · Nombre emergente | `2068:3367` | `2068:6590` | `2068:9885` | `2068:13206` |
| Subpantalla · Nombre emergente | `2068:3662` | `2068:6885` | `2068:10188` | `2068:13511` |

### 2 · Estructura (`data-testid`)

```
personalizacion                      main (aria-label «Personalización»), un solo contenedor para los 4 pasos y las subpantallas
├ personalizacion-migas              MB-03: «Personalización  ›  1 Tema» (hasta 4 niveles)
├ personalizacion-titulo             «Personalización» Nunito Bold 26 en (76,49)
├ personalizacion-pasos              nav horizontal aria-label «Pasos de personalización», en la cabecera (y 50, alto 32)
│  ├ personalizacion-paso-{1..4}      botón: «1 Tema», «2 Fondo», «3 Colores y tipografía», «4 Widgets»; aria-current=step en el actual
│  └ personalizacion-paso-conector-{1..3}  línea 24×1,5 `linea` entre pasos (decorativa, aria-hidden)
├ personalizacion-vista-previa-titulo «Vista previa» Medium 16 en (76,100)
├ personalizacion-tema-en-edicion    «Tema en edición» en (539,102) (547 con barra expandida)
├ personalizacion-vista-previa       664×373 (552×310 con barra expandida); aria-label «Vista previa del escritorio»
├ personalizacion-windi              Nav · Windi 48×48, radio 14, en (1021,454) (MB-05)
├ personalizacion-panel              300×348 en (769,100): contenido del paso o de la subpantalla
├ personalizacion-regresar           botón 36×36 «← Regresar» en (777,106) en toda subpantalla
└ personalizacion-barra-guardado     PW-05
```

### 3 · Medidas (marco 1093×560)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Migas | texto en (76,20) | `texto` (MB-03) | MEDIDO |
| Vista previa | 664×373 (barra contraída); 552×310 (expandida) | marco con trazo `linea`; widgets con el radio de la forma elegida (PW-13) | MEDIDO (203:6362; 2068:667) |
| Panel lateral | 300×348 en (769,100), radio 12 | relleno `superficie`, trazo `linea` 1 | MEDIDO (203:6440) con radio de D5 |
| Barra expandida | solo el contenido y la vista previa se desplazan 120 px (x 76→196); la vista previa pasa a 552×310 (radio 10); el panel (769,100) **no** se mueve; «Tema en edición» x 539→547; Reloj 158×88→131,5×73, Tareas 254×106→211×88 dentro de la vista previa | MB-02 (barra 176 / 56) | MEDIDO (2068:667, F4b l.54) |
| Pasos: botones | horizontales en la cabecera: x 552 / 661 / 775 / 978, y 50, alto 32, radio 7 (ancho por el texto: 552→629, 661→743, 775→946 dejan los conectores de la fila siguiente) | instancia Paso: Actual `principal_legible`, Otro trazo `linea` | MEDIDO (nota de 203:6362). Los del 3 Colores y tipografía están 2 px a la izquierda de la base (Incoherencia 3) |
| Pasos: conectores | 24×1,5 en x 629 / 743 / 946, y 65,5 | `linea` | MEDIDO (203:6362) |
| Título de la pantalla | «Personalización» Nunito Bold 26 en (76,49) | `tinta` | MEDIDO |
| Etiqueta «Vista previa» | (76,100) Nunito Medium 16 | `tinta` | MEDIDO |
| «Tema en edición» | (539,102); (547,102) con barra expandida | `texto` | MEDIDO (203:6362; 2068:667) |
| Nav · Windi | 48×48 en (1021,454), radio 14 | MB-05 | MEDIDO (203:6362) |
| Nombre emergente «Expandir menú» | 70×54 en (2,49) | MB-21; alto 54 solo por tener dos líneas (A6) | MEDIDO |
| Nombre emergente «Regresar» | texto inferido de los textos nuevos de 2068:3662 | MB-21 de 36 | MEDIDO el marco; texto inferido, el del código es «Regresar» |

Ventana real: vista previa `1fr` con panel de 300 fijo. A la ventana mínima de 960×600 el ancho que queda es 960 − barra (56 o 176) − 20 de margen − 300 de panel − 24 de margen − 21 de hueco: **≈539×303 con la barra contraída y ≈419×236 con la expandida** (se mantiene la proporción 664:373); el panel conserva su ancho (PROPUESTA calculada desde MB-02; el 552×310 del Figma es el marco de 1093 con barra expandida, no la ventana mínima).

### 4 · Textos literales

- Migas por pantalla: «Personalización  ›  1 Tema», «…  ›  2 Fondo», «…  ›  3 Colores y tipografía», «…  ›  4 Widgets», «…  ›  4 Widgets  ›  Agregar widget», «…  ›  4 Widgets  ›  Configurar widget › Reloj», «…  ›  1 Tema  ›  Cambios sin guardar» (los separadores van con dos espacios a cada lado).
- Nombres de los pasos: «1 Tema», «2 Fondo», «3 Colores y tipografía», «4 Widgets».
- Nombres emergentes: «Expandir menú», «Regresar», «Renombrar», «Agregar widget».

### 5 · Estados

| Estado | Qué se ve |
|---|---|
| Normal | paso actual con `aria-current`, panel del paso |
| Barra expandida | contenido y vista previa +120 px a la derecha (panel fijo), vista previa 552×310, sin textos nuevos |
| Subpantalla | el panel cambia de título; aparece «← Regresar»; el paso 4 sigue como actual |
| Hover y foco | A-25, A-26 |

### 6 · Teclado y foco

Tab recorre migas (solo lectura), pasos, panel y barra inferior. Flechas izquierda y derecha entre pasos (fila horizontal). «Regresar» vuelve al paso de origen y devuelve el foco al control que abrió la subpantalla. Esc en una subpantalla = «Regresar».

### 7 · Animaciones

A-09 (entra el contenido), A-25/A-26 (hover y foco), A-30 (nombre emergente).

### 8 · Errores

No tiene errores propios. Los de cada paso van en su pieza.

### 9 · Diferencia con el código

- `personalization/Personalization.tsx` (718 l.): hoy es un único inspector con acordeón de cinco secciones (`SECCIONES` en `:56`) dentro de `<main className="wg-wallpaper" aria-label="Personalización del wallpaper">` (`:394`). No hay pasos laterales, ni migas de varios niveles, ni panel de 300×348. **L** (cambio de arquitectura: de acordeón a 4 pasos).
- La pantalla Widgets es otra ruta (`widgets/Widgets.tsx`, 205 l.), no el paso 4. **M**: pasa a ser el paso 4 del mismo contenedor.
- Pasos horizontales en la cabecera con conectores, «Vista previa», «Tema en edición» y Nav · Windi: no existen. **M** (incluido en el cambio de arquitectura).
- Barra expandida: no existe el desplazamiento de 120 px del contenido y la vista previa. **S**.
- `personalization/wallpaper.css:66` usa `minmax(0,1fr) 469px`; pasa a 300 de panel. **S**.

### 10 · Pruebas

Una por CA: los cuatro pasos cambian el panel; el paso 4 sigue marcado en una subpantalla; «Regresar» vuelve al paso; barra expandida con vista previa de 552×310 (Playwright); migas con cuatro niveles; sin scroll de página a 960×600.

---

## PW-02 · Paso 1 Tema y sus estados

**Familias (13):** base, Elegir tema ×4, Cambios sin aplicar, Cambios sin guardar, Eliminar deshabilitado, Aplicar deshabilitado, Guardar deshabilitado, Un solo tema y Nombre emergente «Renombrar».

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base 1 Tema | `203:6362` | `233:18961` | `204:9648` | `204:9726` |
| Elegir Windgets claro | `203:11013` | `2065:7715` | `204:18992` | `204:19070` |
| Elegir Windgets oscuro | `2061:619` | `233:23299` | `2067:7995` | `2067:15818` |
| Elegir Rosa pastel | `203:11084` | `233:23392` | `204:19148` | `204:19226` |
| Elegir Enfoque rojo y negro | `203:11155` | `233:23485` | `204:19304` | `204:19382` |
| Cambios sin aplicar | `2177:32079` | `2185:42871` | `2184:34296` | `2185:36505` |
| Cambios sin guardar (marca) | `2177:32246` | `2185:43090` | `2184:34550` | `2185:36759` |
| Eliminar deshabilitado | `2177:32413` | `2185:43309` | `2184:34804` | `2185:37013` |
| Aplicar deshabilitado | `2177:32591` | `2185:43539` | `2184:35069` | `2185:37278` |
| Guardar deshabilitado | `2177:32768` | `2185:43762` | `2184:35327` | `2185:37536` |
| Un solo tema | `2177:32943` | `2185:43985` | `2184:35585` | `2185:37794` |
| Nombre emergente «Renombrar» | `2068:3197` | `2068:6420` | `2068:9711` | `2068:13031` |

### 2 · Estructura (`data-testid`)

```
tema-panel                          panel «Mis temas» 284×256 (lista desplazable en (777,184))
├ tema-guardar-como                 botón «Guardar como tema» 160×36 en (781,140)
├ tema-lista                        ul aria-label «Mis temas»
│  └ tema-fila-{id}                 276×32 en la huella (44 por A2): muestra, nombre, «Aplicado» o fecha, Renombrar, Eliminar
│     ├ tema-renombrar-{id}         32×28 en (989,266), radio 4
│     └ tema-eliminar-{id}          29×28, radio 4
├ tema-ayuda-un-solo                268×32 en (785,228), solo con un tema
└ tema-marca-cambios                96×15 («Cambios sin aplicar») o 102×15 («Cambios sin guardar») en la fila del tema aplicado
```

### 3 · Medidas (marco 1093×560)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Título «Mis temas» | Medium 17 en (781,110) | `tinta` | MEDIDO |
| «Guardar como tema» | 160×36 en (781,140), radio 7 | Botón Secundario (MB-10) | MEDIDO |
| Lista de temas | 284×256 en (777,184) | — | MEDIDO |
| Fila de tema | huella 276×32, paso 40 desde y=184 (184, 224, 264, 304), radio 9; **A2 la lleva a 44** (fila de lista de F0, paso 48; la lista de 256 hace scroll con más de 5 temas); la elegida: relleno `superficie_baja`, trazo `principal_legible` 2; las demás `superficie` y trazo `linea` 1 | P1 para oscuro | MEDIDO (A2) |
| Nombre del tema | Medium 13 `tinta` en x=825 | — | MEDIDO |
| «Aplicado» / fecha | texto 12 `texto` en x=997 | — | MEDIDO |
| Muestra del tema | hex fijos del tema (esperable) | colores del tema | MEDIDO |
| Fila del tema aplicado con marca | 48 de alto | — | MEDIDO |
| Renombrar y Eliminar | 32×28 y 29×28, radio 4, ícono 20×20 | MB-28 | MEDIDO |
| Ayuda «Un solo tema» | 268×32 en (785,228), `texto` | — | MEDIDO |
| Tooltip «Eliminar deshabilitado» | 390×36 en (679,236) | MB-21 | MEDIDO |
| Tooltip «Aplicar deshabilitado» | 179×36 en (890,470) | MB-21 | MEDIDO |
| Tooltip «Guardar deshabilitado» | 195×36 en (805,470) | MB-21 | MEDIDO |
| Tooltip «Renombrar» | 86×36 en (962,298) | MB-21 | MEDIDO |
| Botones deshabilitados (Aplicar, Guardar) | variante «Deshabilitado» del componente: texto `borde`, relleno `superficie_baja`, sin sombra, sin opacidad por capa | MB-10, E3 | MEDIDO (la opacidad 45 de 2177:32591 y 2177:32768 es artesanal y se reemplaza, E3) |
| Fila de tema seleccionado (otros temas) | `superficie_baja` y trazo `principal_legible` 2 en los cuatro temas | P1 | MEDIDO (F4b muestras) |

### 4 · Textos literales

- «Mis temas», «Guardar como tema», filas «Windgets claro», «Windgets oscuro», «Rosa pastel», «Enfoque rojo y negro»; «Aplicado» en el tema aplicado y fecha «24 nov» (formato «d mmm») en los demás.
- Marcas: «Cambios sin aplicar» y «Cambios sin guardar».
- Ayuda con un solo tema: «Guarda otra personalización con “Guardar como tema” para tener más temas.»
- Tooltips: «No puedes eliminar el tema aplicado. Aplica otro tema primero.»; «Este tema ya está aplicado.»; «No hay cambios para guardar.»; «Renombrar».
- Tema en edición: «Tema en edición  ·  Windgets claro» (el nombre cambia con el tema en edición).

### 5 · Estados

| Estado | Qué se ve |
|---|---|
| Normal | lista con el tema en edición resaltado y el aplicado con «Aplicado» |
| Elegir tema | la fila elegida resalta; con cambios sin guardar abre M-04; la vista previa muestra el tema elegido |
| Cambios sin aplicar | marca de 96×15 en la fila del aplicado |
| Cambios sin guardar | marca de 102×15; «Guardar» habilitado |
| Eliminar deshabilitado | solo en el tema aplicado: el botón en variante Deshabilitado (E3) y el tooltip |
| Aplicar deshabilitado | botón de la barra en variante Deshabilitado (E3) si el tema en edición ya es el aplicado y no hay cambios |
| Guardar deshabilitado | botón en variante Deshabilitado (E3) sin cambios |
| Un solo tema | la lista con una fila y la ayuda |
| Hover y foco | A-25, A-26 |

### 6 · Teclado y foco

Tab: «Guardar como tema», luego por fila el nombre (Enter elige), Renombrar y Eliminar. Los botones deshabilitados reciben foco y leen su tooltip (`aria-disabled`, no `disabled`). El nombre emergente aparece con foco y con hover (MB-21).

### 7 · Animaciones

A-09, A-25/A-26, A-30 (tooltips), A-18 (cambio de fila elegida: DISSOLVE 0,15 s).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Eliminar el tema aplicado | `theme.applied_not_deletable` | «No puedes eliminar el tema aplicado. Aplica otro tema primero.» | tooltip del botón deshabilitado y, si llega, aviso Error |
| Aplicar un tema ya aplicado | `theme.already_applied` | «Este tema ya está aplicado.» | tooltip |
| Guardar sin cambios | `draft.no_changes` | «No hay cambios para guardar.» | tooltip |
| Tema borrado en otro computador | `theme.not_found` (RD-86) | «Este tema ya no existe.» | aviso Error (PW-04) |
| Falla la lectura de temas | `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso Error, hasta cerrar |

### 9 · Diferencia con el código

- `themes/Themes.tsx` (196 l.): lista de temas en pantalla aparte, con renombrar y eliminar; el selector «Tema en edición» está en `Personalization.tsx:406`. Falta fusionarlas en «Mis temas» dentro del paso 1, la marca «Cambios sin aplicar/guardar», los tres tooltips de botones deshabilitados, la ayuda de un solo tema y la muestra de colores. **L**.
- `themes/RenombrarTema.tsx` (88 l.) existe; ver PW-03. **S** para integrarlo.
- Elegir un tema con cambios abre la confirmación «Cambiar de tema» (`Personalization.tsx:706-714`, `<Confirmacion titulo="Cambiar de tema">`); pasa a M-04 Destructivo (D13). **S**.

### 10 · Pruebas

Una por CA: lista con aplicado y fechas; marca «Cambios sin guardar»; tooltip de Eliminar en el aplicado; Aplicar y Guardar deshabilitados con su texto; un solo tema con la ayuda; elegir tema con cambios abre M-04; foco y teclado de los botones deshabilitados.

---

## PW-03 · Guardar como tema y Renombrar tema

**Familias (4):** Guardar como tema, Nombre muy largo, Nombre repetido, Renombrar tema (overlay).

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Guardar como tema | `203:10869` | `233:23188` | `204:18704` | `204:18777` |
| Nombre muy largo | `2178:32554` | `2185:44204` | `2184:35839` | `2185:38048` |
| Nombre repetido | `2178:32678` | `2185:44376` | `2184:36046` | `2185:38255` |
| Renombrar tema | `217:24146` | `233:24456` | `217:24164` | `217:24155` |

### 2 · Estructura (`data-testid`)

```
guardar-como-tema                    panel: título «Guardar como tema» + «← Regresar»
├ guardar-como-campo                 MB-11 «Nombre del tema» 276×36 en (12,48) del panel
├ guardar-como-ayuda                 «Escribe de 1 a 40 caracteres.» en (12,138); se convierte en el error
└ guardar-como-guardar               botón «Guardar» 87×36 en (201,92)
renombrar-tema                       ventana emergente (MB-22) 386×173
├ renombrar-campo                    350×32 en (16,73), radio 9
├ renombrar-error                    mensaje bajo el campo
├ renombrar-cancelar                 «Cancelar» 91×36 en (158,121)
└ renombrar-guardar                  «Guardar» 87×36 en (281,121), relleno `accion`
```

### 3 · Medidas (marco 1093×560)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Campo «Nombre del tema» | 276×36, radio 9, trazo `borde_campo` | MB-11 | MEDIDO |
| Ayuda | 12/14, `texto`, en (12,138) | — | MEDIDO |
| Campo con error | trazo `error` 2 px (de `borde_campo` 1,5) | R10 | MEDIDO (2178:32554) |
| Mensaje de error | 180×28 en el Figma; ancho del campo (276) y alto automático (A7) | texto `error` | DECISIÓN (A7): el 180×28 recorta el texto largo en dos líneas |
| Botón «Guardar» | 87×36 | Primario (MB-10) | MEDIDO |
| Renombrar: ventana | 386×173 sin error; con error 173 + alto del mensaje (una línea ≈ 16; dos líneas ≈ 32) | MB-22 | MEDIDO sin error; con error PROPUESTA (A7) |
| Renombrar: título | Medium 17 en (16,14) | `tinta` | MEDIDO |
| Renombrar: etiqueta «Nombre del tema» | 12 en (16,53) | `texto` | MEDIDO |
| Renombrar: campo | 350×32 en (16,73) | `borde_campo` | MEDIDO |

### 4 · Textos literales

- «Guardar como tema», «Nombre del tema», «Escribe de 1 a 40 caracteres.», «Guardar», «← Regresar».
- Renombrar: «Renombrar tema», «Nombre del tema», «Cancelar», «Guardar».
- Errores: «Escribe un nombre para el tema.» (G2, PROPUESTA), «Ya existe un tema con ese nombre. Elige otro.», «El nombre no puede superar los 40 caracteres.».
- Mensajes de éxito: «Tema “<nombre del tema>” guardado.»; «Tema renombrado.».
- Valores de ejemplo de la huella: «Tema de colores para estudiar en las noches de parcial» (muy largo) y «Rosa pastel» (repetido), «Rosa de estudio» (Renombrar).

### 5 · Estados

| Estado | Qué se ve |
|---|---|
| Normal | campo vacío, ayuda en `texto` |
| Con texto válido | «Guardar» habilitado |
| Vacío al guardar | trazo `error`, mensaje «Escribe un nombre para el tema.» |
| Nombre muy largo | trazo `error`, mensaje en `error`; se valida con cada tecla (ON_KEY_DOWN CONDITIONAL en el Figma) |
| Nombre repetido | trazo `error`, mensaje en `error` |
| Guardado | vuelve al paso 1 con el tema nuevo en la lista y aviso Éxito |
| Renombrar | los mismos tres errores dentro de la ventana |

### 6 · Teclado y foco

Entra con el foco en el campo. Enter guarda; Esc cancela. El foco vuelve a «Guardar como tema» (o al botón Renombrar de la fila). Foco atrapado en la ventana Renombrar y fondo inerte (RD-103, MB-22).

### 7 · Animaciones

A-09, A-25/A-26, A-05/A-06/A-07 para el aviso de éxito; ventana según MB-22 (A-10, A-11).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Nombre vacío | `TEMA_NOMBRE_VACIO` (G2, PROPUESTA; el contrato dice `name.required` «Este campo es obligatorio.») | «Escribe un nombre para el tema.» | bajo el campo |
| Nombre repetido | `name.duplicate` (G2 lo llama `TEMA_NOMBRE_REPETIDO`; es el mismo mensaje y el mismo error) | «Ya existe un tema con ese nombre. Elige otro.» | bajo el campo |
| Más de 40 caracteres | `name.too_long` (G2 `TEMA_NOMBRE_MUY_LARGO`) | «El nombre no puede superar los 40 caracteres.» | bajo el campo |
| Máximo de 10 temas | `theme.limit_reached` | «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.» | aviso Advertencia (PW-04) |
| Mismas propiedades | `theme.content_duplicate` (RD-93) | «Ya tienes el tema “<nombre del tema>” con estas mismas propiedades.» | aviso Advertencia (PW-04) |
| Tema borrado | `theme.not_found` | «Este tema ya no existe.» | aviso Error |

Los errores de forma se muestran todos a la vez, uno por campo; aquí hay un solo campo.

### 9 · Diferencia con el código

- `personalization/GuardarComoTema.tsx` y `themes/RenombrarTema.tsx` (88 l.): ya validan nombre; faltan la ayuda «Escribe de 1 a 40 caracteres.», el trazo `error` de 2 px y el mensaje bajo el campo con la validación por tecla; hoy `Personalization.tsx:700-705` lo abre como ventana. **S** cada uno.
- Contrato: el CA del contrato usa «Este campo es obligatorio.» para el vacío; el Figma/G2 pide «Escribe un nombre para el tema.»: manda G2 (Incoherencia 9).

### 10 · Pruebas

Una por CA: vacío, 41 caracteres y repetido muestran su texto bajo el campo con trazo `error`; ayuda en reposo; el guardado crea el tema y avisa; Renombrar con los tres errores; foco atrapado; con 10 temas, el aviso de máximo.

---

## PW-04 · Avisos del paso 1 y del tema

**Familias (4):** Máximo de temas, Tema con las mismas propiedades, Tema que ya no existe, Personalización más reciente.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Aviso · Máximo de temas | `2178:32802` | `2185:44548` | `2184:36253` | `2185:38462` |
| Aviso · Tema con las mismas propiedades | `2178:32988` | `2185:44777` | `2184:36517` | `2185:38726` |
| Aviso · Tema que ya no existe | `2178:33174` | `2185:45006` | `2184:36781` | `2185:38990` |
| Aviso · Personalización más reciente | `2178:33360` | `2185:45235` | `2184:37045` | `2185:39254` |

### 2 · Estructura (`data-testid`)

```
aviso-tema-{tipo}                    MB-24, role=status (Información, Advertencia) o role=alert (Error); botón «Cerrar» 26×30
```

### 3 · Medidas (marco 1093×560)

| Aviso | Medida en el Figma | Tipo y color | Regla aplicada | Fuente |
|---|---|---|---|---|
| Máximo de temas | 467×42 en (602,4) (D7: x=499) | Advertencia `estado_pendiente` | 6 s; ancho 467 ≤ 480 | MEDIDO |
| Mismas propiedades | 450×42 en (619,4) (D7: x=516) | Advertencia (RD-93, decisión de Paula del 25-nov: sale como advertencia; el Figma lo dibuja Información con borde cian #00d9e2; manda RD-93) | 6 s; borde `estado_pendiente` | MEDIDO; DECISIÓN (RD-93) |
| Tema que ya no existe | 211×42 en (858,4) (D7: x=755) | Error `error` | hasta cerrar | MEDIDO |
| Personalización más reciente | 715×42 en (354,4); con D7 máximo 480 en dos líneas (x=486) | Información `informacion` | 4 s; ancho máximo 480 y dos líneas (A18) | MEDIDO; ancho DECISIÓN (D7, A18) |

Radio 21, relleno `superficie_alta`, trazo del tipo. Los bordes fijos del Figma (#b47700, #00d9e2, #b32d42) se reemplazan por la variable (D1).

### 4 · Textos literales

- «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.»
- «Ya tienes el tema “Rosa pastel” con estas mismas propiedades.» (el nombre cambia: «Ya tienes el tema “<nombre del tema>” con estas mismas propiedades.»)
- «Este tema ya no existe.»
- «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.»

### 5 · Estados

Cada aviso es un estado de una sola pantalla: aparece al disparar la causa, dura según el tipo y se cierra con «Cerrar» o Esc. Uno visible a la vez; los errores no se reemplazan (D7).

### 6 · Teclado y foco

El aviso no roba el foco (role=status); el Error lleva `role=alert` y «Cerrar» es alcanzable con Tab; Esc lo cierra.

### 7 · Animaciones

A-05 (entra), A-06 (sale) y A-07; DISSOLVE 0,15 s EASE_OUT.

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Límite de temas | `theme.limit_reached` | el de arriba |
| Mismo contenido | `theme.content_duplicate` | el de arriba |
| Tema borrado | `theme.not_found` | el de arriba |
| Cambio remoto con cambios locales | (evento, sin código; RD-96 / HE-02) | el de arriba |

### 9 · Diferencia con el código

`messages.es.json` ya trae `MAXIMO_DE_TEMAS`, `TEMA_CON_LAS_MISMAS_PROPIEDADES`, `TEMA_NO_EXISTE` y `PERSONALIZACION_REMOTA_CON_CAMBIOS` con el mismo texto. Falta el posicionamiento y el tope de 480 con dos líneas de D7 y el tipo Advertencia del segundo. **S** (componente `ui/MensajeResultado` y `ui/Aviso`).

### 10 · Pruebas

Los cuatro textos literales; tipo y duración de cada uno; el de 715 se parte en dos líneas dentro de 480; el Error no desaparece solo.

---

## PW-05 · Cambios sin guardar, Guardado y Aplicado (barra de guardado)

**Familias (3):** Cambios sin guardar, Guardado, Aplicado.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Cambios sin guardar | `203:9985` | `233:22368` | `204:16894` | `204:16972` |
| Guardado | `203:10056` | `233:22461` | `204:17050` | `204:17128` |
| Aplicado | `203:10127` | `233:22554` | `204:17206` | `204:17284` |

### 2 · Estructura (`data-testid`)

```
barra-guardado                       footer: línea de 1001×1 en (72,508)
├ barra-estado                       texto de estado 14/18 en (76,525), aria-live=polite
├ barra-cancelar                     «Cancelar cambios» 147×36 en (738,516)
├ barra-guardar                      «Guardar» 87×36 en (893,516)
└ barra-aplicar                      «Aplicar» 81×36 en (988,516)
```

### 3 · Medidas (marco 1093×560)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Línea superior | 1001×1 en (72,508) | `linea` | MEDIDO |
| Estado | 14/18 en (76,525) | `texto` | MEDIDO |
| «Cancelar cambios» | 147×36 en (738,516) | Secundario | MEDIDO |
| «Guardar» | 87×36 en (893,516) | Secundario o Primario según estado | MEDIDO; PROPUESTA el relleno |
| «Aplicar» | 81×36 en (988,516) | Primario `accion` | MEDIDO |
| Deshabilitado | variante «Deshabilitado» del componente (texto `borde`, relleno `superficie_baja`, sin sombra, sin opacidad; E3) | MB-10 | MEDIDO |

### 4 · Textos literales

- Estados: «Cambios sin guardar», «Tema guardado», «Este tema ya está aplicado.»
- Migas: «Personalización  ›  1 Tema  ›  Cambios sin guardar».
- Botones: «Cancelar cambios», «Guardar», «Aplicar».
- Mensajes de resultado: «Cambios guardados en el tema “<nombre del tema>”.», «Cambios guardados. Selecciona Aplicar para verlos en tu escritorio.», «Tema “<nombre del tema>” aplicado.», «Tema “<nombre del tema>” guardado y aplicado.», «No se guardaron cambios.»

### 5 · Estados

| Estado | Qué se ve |
|---|---|
| Cambios sin guardar | «Cancelar cambios», «Guardar» y «Aplicar» habilitados |
| Guardado | «Tema guardado»; «Guardar» deshabilitado; «Aplicar» habilitado si el tema no es el aplicado |
| Aplicado | «Este tema ya está aplicado.»; «Guardar» y «Aplicar» deshabilitados |
| Sin cambios al abrir | igual que Guardado/Aplicado según el tema |

Navegación: «Cancelar cambios» con cambios abre M-02; «Guardar» pasa a Guardado; «Aplicar» abre M-05 (sin cambios) o M-15 (con cambios); elegir otro tema con cambios abre M-04.

### 6 · Teclado y foco

Tab en orden: «Cancelar cambios», «Guardar», «Aplicar». El estado se anuncia con `aria-live=polite`. Tras confirmar, el foco vuelve al botón que abrió la ventana.

### 7 · Animaciones

A-09; A-25/A-26; el cambio de estado del texto DISSOLVE 0,15 s.

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Guardar sin cambios | `draft.no_changes` | «No hay cambios para guardar.» | tooltip del botón |
| Mismas propiedades | `theme.content_duplicate` | ver PW-04 | aviso |
| Tema borrado | `theme.not_found` | «Este tema ya no existe.» | aviso Error |
| Falla al guardar o aplicar | `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso Error |

### 9 · Diferencia con el código

`Personalization.tsx:604-650`: la barra inferior ya tiene Cancelar, Guardar, Guardar como tema y Aplicar. Faltan el texto de estado de la barra, el rótulo «Cancelar cambios», la fila de 1001×1 y el desplazamiento por barra expandida; «Guardar como tema» sale de la barra (pasa al panel, PW-02). **M**.

### 10 · Pruebas

Una por CA: estados de la barra por tema y cambios; «Cancelar cambios» abre M-02; «Aplicar» abre M-05 o M-15; los textos de resultado literales; botones deshabilitados con tooltip.

---

## PW-06 · Ventanas de confirmación M-02, M-04, M-05, M-06, M-07, M-15

**Familias (6)**; el overlay de Windi va en PW-15.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Overlay · M-02 | `204:25071` | `233:23578` | `204:25225` | `204:25379` |
| Overlay · M-04 | `204:25084` | `233:23591` | `204:25238` | `204:25392` |
| Overlay · M-05 | `204:25097` | `233:23604` | `204:25251` | `204:25405` |
| Overlay · M-06 | `204:25110` | `233:23617` | `204:25264` | `204:25418` |
| Overlay · M-07 | `204:25123` | `233:23630` | `204:25277` | `204:25431` |
| Overlay · M-15 | `204:25136` | `233:23643` | `204:25290` | `204:25444` |

### 2 · Estructura (`data-testid`)

```
confirmacion-{m02|m04|m05|m06|m07|m15}     MB-23 sobre MB-22 (role=alertdialog, aria-modal)
├ confirmacion-titulo
├ confirmacion-texto
├ confirmacion-cancelar                    secundario
└ confirmacion-principal                   Primario, o Destructivo en M-02, M-04, M-06 y M-07 (D13)
   (M-15 añade confirmacion-secundaria)
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Papel | 424×160; M-03 y M-15 (tres botones) 512×160 en (44,48) | `superficie`, radio 10 (D5), trazo `linea` | MEDIDO (A16) |
| Velo | cubre la ventana; el clic cierra (RD-103) | `velo` | MEDIDO |
| Botón destructivo | relleno `error` | MB-10 | DECISIÓN (D13) |
| Altura con error | no hay variante de error: las confirmaciones no llevan campo, la altura es siempre 160 | — | MEDIDO |

### 4 · Textos literales

Del Figma (huellas 204:25071 a 204:25136, MEDIDO); el texto de cuerpo lleva el nombre del tema o del widget en lugar de «Rosa pastel» (P11):

| Ventana | Título | Cuerpo | Botones (secundario → principal) |
|---|---|---|---|
| M-02 | «Salir sin guardar» | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» | «Seguir editando» → «Salir sin guardar» |
| M-03 | «Salir» (PROPUESTA: sin overlay en el Figma) | «Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?» (HE-02) | «Seguir editando», «Salir sin guardar» → «Guardar» |
| M-04 | «Cambiar de tema» | «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?» | «Seguir editando» → «Cambiar sin guardar» |
| M-05 | «Aplicar tema» | «Se reemplazará la personalización actual por la del tema “<nombre del tema>”. ¿Deseas aplicarlo?» | «Cancelar» → «Aplicar» |
| M-06 | «Eliminar tema» | «¿Deseas eliminar el tema “<nombre del tema>”? Esta acción no se puede deshacer.» | «Cancelar» → «Eliminar tema» |
| M-07 | «Eliminar widget» | «Se quitará del tema en edición. Podrás agregarlo de nuevo desde el catálogo.» (el HE-02 dice «Se quitará de todos tus temas.»; manda el Figma) | «Cancelar» → «Eliminar widget» |
| M-15 | «Aplicar cambios» | «Tienes cambios sin guardar en el tema “<nombre del tema>”. ¿Qué deseas hacer?» | «Cancelar», «Aplicar sin guardar» → «Guardar y aplicar» |

**Asignación M-05 ↔ M-15 (cerrada, ya no es pendiente):** M-05 se abre al aplicar un tema que no es el aplicado y **sin** cambios sin guardar (HE-03 T-055/T-056); M-15 se abre al aplicar con cambios sin guardar en el tema en edición (HE-02 T-146, HE-03 T-148). Ambas sobre el nodo del Figma de su nombre.

### 5 · Estados

Abierta; botón con foco; cerrada (Esc, «Cancelar» o clic en el velo cancela, nunca confirma).

### 6 · Teclado y foco

Foco atrapado; empieza en «Cancelar» en las destructivas y en el principal en las demás (MB-23); Esc cancela; al cerrar, el foco vuelve al control de origen. Fondo inerte.

### 7 · Animaciones

A-10 y A-11 (entrada y salida de la ventana), A-25/A-26.

### 8 · Errores

Las ventanas no tienen errores propios. Si la acción confirmada falla: `OPERACION_FALLIDA` (G1h) como aviso Error; tema borrado `theme.not_found`; widget borrado `widget.not_found`.

### 9 · Diferencia con el código

`Personalization.tsx:655-714` ya tiene M-15, M-02, M-03 y M-04 (`titulo="Cambiar de tema"` en `:708`); sus títulos y botones se igualan a la tabla de la parte 4 (el Figma usa «Salir sin guardar», «Aplicar cambios», «Aplicar tema», «Seguir editando»). Falta pasar M-02 y M-04 a Destructivo (D13); M-06 y M-07 existen en `themes/Themes.tsx` y `widgets/Widgets.tsx:46`. **S**.

### 10 · Pruebas

Texto literal de cada ventana; botón destructivo en M-02/M-04/M-06/M-07; foco inicial; Esc y clic en el velo cancelan; ancho 512 de M-03 y M-15; M-05 sin cambios y M-15 con cambios; RD-106: «Seguir editando» tras Esc con datos escritos; Clima: elegir la misma ciudad inicial NO pide descarte y elegir otra sí.

**Clima y RD-106 (DECISIÓN de Paula, 26-nov, `.trabajo/DECISIONES_PAULA_26nov.md`):** en el formulario de Clima, «Salir sin guardar» (M-02) se pide **solo si la ciudad elegida es distinta de la inicial**. Esto manda sobre el texto de RD-106 («elegir una ciudad cuenta como cambio aunque el texto no cambie»). Hoy el código pide descarte aunque sea la misma ciudad (commit `af1a38a`): pieza S. Se anota en `docs/DUDAS.md` y RD-106 se ajusta en la fase 5.

---

## PW-07 · Paso 2 Fondo

**Familias (12):** base, Catálogo de imágenes, Subir imagen, Sin imagen, Ajustar imagen, Catálogo vacío, Imagen propia, tres errores de subida y dos avisos.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| 2 Fondo | `203:6440` | `233:19054` | `204:9804` | `204:9884` |
| Catálogo de imágenes | `203:10198` | `233:22647` | `204:17362` | `204:17437` |
| Subir imagen | `203:10273` | `233:22708` | `204:17512` | `204:17585` |
| Sin imagen | `203:10346` | `233:22764` | `204:17658` | `204:17729` |
| Ajustar imagen | `203:10417` | `233:22818` | `204:17800` | `204:17873` |
| Catálogo · Vacío | `2180:35092` | `2185:47171` | `2184:39331` | `2185:41540` |
| Subir imagen · Imagen propia | `2180:34602` | `2185:46477` | `2184:38497` | `2185:40706` |
| Error · Formato no permitido | `2180:34732` | `2185:46655` | `2184:38710` | `2185:40919` |
| Error · Imagen muy pesada | `2180:34852` | `2185:46827` | `2184:38917` | `2185:41126` |
| Error · Imagen dañada | `2180:34972` | `2185:46999` | `2184:39124` | `2185:41333` |
| Aviso · Imagen del tema no encontrada | `2180:33780` | `2185:46280` | `2184:38265` | `2185:40474` |
| Aviso · Fondo por defecto | `2180:36230` | `2185:47345` | `2184:39540` | `2185:41749` |

### 2 · Estructura (`data-testid`)

```
fondo-panel                         título «Imagen de fondo»
├ fondo-catalogo                    selector 276×36 en (781,144), valor «Atardecer»
│  ├ fondo-catalogo-miniatura-{id}  miniatura 50×28 desde (790,150), con el nombre (subpantalla «Catálogo de imágenes»)
│  └ fondo-catalogo-vacio           MB-25: 276×40 en (781,156)
├ fondo-subir                       «Subir imagen» 119×36 en (781,188)
│  └ fondo-seleccionar                «Seleccionar imagen» 158×36 en (781,148) (subpantalla «Subir imagen»)
├ fondo-sin-imagen                  «Sin imagen» 106×36 en (781,232)
│  └ fondo-usar-del-tema             fila «Usar el fondo del tema» 276×36 en (781,148) (subpantalla «Sin imagen»)
├ fondo-imagen-propia               «Imagen propia» 150×36 en (781,236) + «Quitar imagen» 158×36 en (932,236)
├ fondo-error-subida                276×36 en (781,240), alto automático (A7)
├ fondo-ajustar                     «Ajustar imagen»: seis ajustes (ya existen en el código)
├ fondo-oscurecer                   deslizador 276×36 en y=284
├ fondo-desenfocar                  deslizador 276×36 en y=328
└ fondo-ajuste-monitor              ver PW-08
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Catálogo | 276×36 en (781,144), radio 9, trazo `borde_campo` 1,5; «Catálogo de imágenes» Medium 13 y valor «Atardecer» 12 en x=994 | R6 | MEDIDO |
| «Subir imagen» | 119×36 en (781,188) | Secundario (MB-10) | MEDIDO |
| «Sin imagen» | 106×36 en (781,232) | Secundario | MEDIDO |
| Deslizadores | 276×36 en (781,284) y (781,328); riel 136×4 `linea` radio 2; perilla 16 | `perilla` | MEDIDO |
| Pasos de «Oscurecer» | 0, 15, 30, 45, 60 % (tope 60) | — | DECISIÓN (Paula 26-nov) |
| Pasos de «Desenfocar» | 0, 2, 4 px | — | DECISIÓN (Paula 26-nov) |
| Error de subida | 276×36 en (781,240); el alto crece con el texto | `error` | MEDIDO el punto; alto DECISIÓN (A7) |
| Aviso «Imagen del tema no encontrada» | 585×42 en (484,4) → en dos líneas dentro de 480, x=486 (D7) | **Error** `error` (la huella lo dibuja con #b32d42 «Mensaje emergente / Error»; D1): hasta cerrar | MEDIDO; ancho D7 |
| Aviso «Fondo por defecto» | 401×42 en (668,4) → x=565 (D7) | Información `informacion`, 4 s | MEDIDO (2180:36230 «Mensaje emergente / Información») |
| Catálogo de imágenes (subpantalla) | título «Catálogo de imágenes» 17 en (817,113); «← Regresar» 36×36 r7 en (777,106); cuadrícula de miniaturas 50×28 desde (790,150) con su nombre | miniaturas con colores propios de cada imagen | MEDIDO (203:10198) |
| «Seleccionar imagen» | 158×36 en (781,148), Botón Secundario | MB-10 | MEDIDO (203:10273) |
| «Usar el fondo del tema» | fila 276×36 en (781,148), radio 9 | R6 | MEDIDO (203:10346) |
| Ajustar imagen (subpantalla) | «Oscurecer · 30 %» en (781,157), valor en (1017,157); deslizador 136×16 con chips de 23-30×28 radio 6 para 0/15/30/45/60 % y 0/2/4 px | `perilla`; chip elegido `principal_legible` | MEDIDO (203:10417) |
| Catálogo vacío | texto 276×40 en (781,156), color `texto`; sin miniaturas | MB-25 | MEDIDO (2180:35092) |
| «Oscurecer imagen» | negro del tema `tinta` con alfa igual al porcentaje elegido (0 a 60 %); **no** `velo` | C12 | MEDIDO el rango; regla DECISIÓN (C12) |

### 4 · Textos literales

- «Imagen de fondo», «Atardecer», «Subir imagen», «Sin imagen», «Imagen propia», «Quitar imagen», «Oscurecer», «Desenfocar»; valores «30 %» y «2 px».
- Subpantallas: «Catálogo de imágenes», «Subir imagen», «Sin imagen», «Ajustar imagen»; «Seleccionar imagen»; «Usar el fondo del tema»; «Oscurecer · 30 %».
- Catálogo vacío: «El catálogo de imágenes no tiene imágenes por ahora.» (`CATALOGO_DE_IMAGENES_VACIO`; 2180:35092).
- Errores de subida (literal del Figma y de `messages.es.json`): «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» (`FORMATO_DE_IMAGEN_NO_PERMITIDO`), «La imagen supera el tamaño máximo de 20 MB.» (`IMAGEN_MUY_GRANDE`), «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» (`IMAGEN_ILEGIBLE`).
- Avisos: «No encontramos la imagen de fondo de este tema. Sube otra o elige una del catálogo.» (un solo literal: `messages.es.json:73`, `IMAGEN_DE_FONDO_NO_ENCONTRADA`; tipo Error). «Esta plantilla ya muestra su imagen de fondo por defecto.» (contrato `background.already_default`; el Figma dice «Este tema ya muestra…» y manda el contrato, Incoherencias n.º 20).

### 5 · Estados

Catálogo con imagen elegida; subiendo (indicador); imagen propia; Sin imagen; Ajustar; Vacío; tres errores de subida (fila con trazo `error`); dos avisos. El esqueleto D9 aparece mientras carga el catálogo.

### 6 · Teclado y foco

Selector con flechas; deslizadores con flechas, Inicio y Fin; «Quitar imagen» devuelve el foco a «Subir imagen».

### 7 · Animaciones

A-09, A-25/A-26, A-32 (esqueleto), A-05/A-06 en avisos.

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Formato no permitido | `image.format_not_allowed` | `FORMATO_DE_IMAGEN_NO_PERMITIDO` («Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.») | bajo la fila Subir |
| Muy pesada | `image.too_large` | `IMAGEN_MUY_GRANDE` («La imagen supera el tamaño máximo de 20 MB.») | ídem |
| Dañada | `image.unreadable` (G1s `IMAGEN_ILEGIBLE` es su clave de texto) | `IMAGEN_ILEGIBLE` | ídem |
| Fondo ya por defecto | `background.already_default` | «Esta plantilla ya muestra su imagen de fondo por defecto.» | aviso Información |
| Imagen del tema no hallada | `IMAGEN_DE_FONDO_NO_ENCONTRADA` (evento del Núcleo; no hay código `a.b` en contratos, PROPUESTA mantener la clave como código) | «No encontramos la imagen de fondo de este tema. Sube otra o elige una del catálogo.» | aviso **Error**, hasta cerrar |
| Falla la carga del catálogo | `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso Error |

### 9 · Diferencia con el código

La sección «Fondo» de `Personalization.tsx` (`SECCIONES` :56), `wallpaper.css` y `AjusteDelFondo.tsx` (84 l., seis ajustes con `wallpaper_fit_get/set`) ya cubren catálogo, subida y ajuste. Faltan «Oscurecer» y «Desenfocar» (**NUEVA**; se guardan con la ampliación de IPC-THEME-05 de S13: `background_dim` y `background_blur_px`, ver PW-13), las subpantallas con miniaturas 50×28, el estado Vacío y los dos avisos. **M**.

### 10 · Pruebas

Tres errores con su texto; «Quitar imagen»; catálogo vacío; dos avisos; pasos 0/15/30/45/60 y 0/2/4; Playwright del panel 300×348.

---

## PW-08 · Ajuste por monitor

**Familias (4):** Ajuste por monitor, Varios monitores, aviso Más de 6 monitores, aviso Monitor desconectado.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Ajuste por monitor | `2180:33062` | `2185:45464` | `2184:37309` | `2185:39518` |
| Varios monitores | `2180:33209` | `2185:45661` | `2184:37541` | `2185:39750` |
| Aviso · Más de 6 monitores | `2180:33358` | `2185:45860` | `2184:37775` | `2185:39984` |
| Aviso · Monitor desconectado | `2180:33569` | `2185:46070` | `2184:38020` | `2185:40229` |

### 2 · Estructura

```
fondo-monitores                       lista «Ajuste del monitor N (principal)» (máximo 6 visibles)
├ fondo-monitor-titulo                «Ajuste del monitor 1 (principal)»
├ fondo-monitor-opcion-{fill|fit|stretch|tile|center|span}   opciones Rellenar, Ajustar, Expandir, Mosaico, Centrar (+ Extender con varios monitores); la elegida con «✓»
├ fondo-monitores-nota                nota en línea, aria-live=polite: «Puedes ajustar el fondo de hasta 6 monitores…»
└ fondo-monitor-desconectado          error en línea, role=alert: «Ese monitor ya no está conectado. Elige otro monitor.»
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Lista de ajuste | se abre dentro del panel de Fondo: «Sin imagen» pasa de (781,232) a (908,188) y «Ajustar imagen» y los dos deslizadores suben 44 (y 240, 284) | R6 | MEDIDO (2180:33062) |
| Opciones | «✓ Rellenar», «Ajustar», «Expandir», «Mosaico», «Centrar»; con varios monitores se añade «Extender» (`span`) | selector superpuesto, fila de 36 (A2; PW-12) | MEDIDO (2180:33062, 2180:33209) |
| Nota de más de 6 monitores | texto de la lista, en línea, **no** es un aviso flotante; borde #00d9e2 fijo del Figma → `informacion` | D1 | MEDIDO (2180:33358) |
| Monitor desconectado | error en línea bajo la lista; borde #b32d42 fijo del Figma → `error` (trazo 2, r9) | R10 | MEDIDO (2180:33569) |

### 4 · Textos literales

- Título de la lista: «Ajuste del monitor 1 (principal)» (con varios monitores, «Ajuste del monitor N»).
- Opciones: «Rellenar», «Ajustar», «Expandir», «Mosaico», «Centrar», «Extender» (solo con varios monitores); la elegida con «✓ ».
- Nota (más de 6 monitores): «Puedes ajustar el fondo de hasta 6 monitores. Los demás usan el ajuste del monitor principal.» (`MONITOR_NO_AJUSTABLE`).
- Monitor desconectado (error en línea): «Ese monitor ya no está conectado. Elige otro monitor.» (`MONITOR_NO_CONECTADO`).

### 5 · Estados

Un monitor (cinco opciones); varios monitores (seis, con «Extender»); más de 6 (se muestran 6 y la nota en línea); monitor desconectado (error en línea).

### 6 · Teclado y foco

La lista se abre con Enter o Espacio; flechas entre opciones, Enter elige, Esc cierra y devuelve el foco al control. El error de monitor desconectado se anuncia con `role=alert`.

### 7 · Animaciones

A-09, A-25/A-26. La nota y el error no animan aparte: aparecen en línea con el panel.

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Monitor desconectado | `monitor.not_found` (IPC-DESK-16, HE-02-HU14-CA07) | «Ese monitor ya no está conectado. Elige otro monitor.» | error en línea bajo la lista |
| Más de 6 monitores | `monitor.not_configurable` (IPC-DESK-16, CA06) | «Puedes ajustar el fondo de hasta 6 monitores. Los demás usan el ajuste del monitor principal.» | nota en línea |

### 9 · Diferencia con el código

`personalization/AjusteDelFondo.tsx` (84 l.) ya tiene los seis ajustes (con «Extender»), los nombres «Ajuste del monitor N (principal)» (`:62-63`), llama a `wallpaper_fit_get/set` (IPC-DESK-15 y 16), escucha `monitors_changed` y muestra el motivo del error junto al monitor. Falta la composición dentro del panel de 300 (opciones con «✓»), la nota en línea de más de 6 monitores y los textos de `MONITOR_NO_CONECTADO` y `MONITOR_NO_AJUSTABLE` en su sitio. **S**.

### 10 · Pruebas

Un monitor (cinco opciones) y varios (con «Extender»); más de 6 con la nota; monitor desconectado con su error en línea; `wallpaper_fit_set` con el monitor y el ajuste elegidos.

---

## PW-09 · Paso 3 Colores y tipografía

**Familias (9):** base, Paletas, Selector de color, Tipografía, Restablecer, Paleta personalizada, error Color no válido, aviso Contraste bajo, aviso Paleta no disponible.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| 3 Colores y tipografía | `203:6520` | `233:19117` | `204:9964` | `204:10051` |
| Paletas | `203:10490` | `233:22894` | `204:17946` | `204:18021` |
| Selector de color | `203:10565` | `233:22952` | `204:18096` | `204:18171` |
| Tipografía | `203:10640` | `233:23010` | `204:18246` | `204:18323` |
| Restablecer | `203:10942` | `233:23245` | `204:18850` | `204:18921` |
| Paleta personalizada | `2182:34290` | `2185:47898` | `2184:40198` | `2185:42407` |
| Error · Color no válido | `2182:33981` | `2185:47542` | `2184:39772` | `2185:41981` |
| Aviso · Contraste bajo | `2182:34106` | `2185:47715` | `2184:39980` | `2185:42189` |
| Aviso · Paleta no disponible | `2182:34430` | `2185:48090` | `2184:40425` | `2185:42634` |

### 2 · Estructura

```
colores-panel
├ colores-paletas                 cuadrícula 2×2 de botones 134×36
├ colores-del-tema                fila «Colores del tema | 3 colores | ›» 276×36 en (781,234)
├ colores-muestras                muestras 16×16 radio 4 en y=280
├ colores-tipografia              fila «Tipografía | <fuente elegida> · Mediano» 276×36 en y=312
├ colores-restablecer             «Restablecer colores» 159×36 en (781,356)
├ colores-restablecer-tipografia  «Restablecer tipografía» 175×36 en (781,400)
├ colores-selector                subpantalla con campo hexadecimal
└ colores-error                   mensaje bajo el campo hexadecimal
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Paletas | 134×36 en (781,144), (923,144), (781,188), (923,188); la elegida con «✓» | `principal_legible` (P1) | MEDIDO |
| «Colores del tema» | 276×36 en (781,234) | R6 | MEDIDO |
| Muestras | 16×16 radio 4 en y=280 | colores del tema | MEDIDO |
| Fila de tipografía | 276×36 en y=312 | R6 | MEDIDO |
| Lista de fuentes | Inter, Merriweather, Poppins, JetBrains Mono, Nunito; filas 276×30 en la huella (A2 → 36); cada nombre escrito en su fuente; Rubik no está (T13) | A2, T13 | MEDIDO (F4a 16); regla de Paula |
| Tamaños | 88×30 en la huella (A2 → 36); «Pequeño» en (781,368), «✓ Mediano», «Grande»; tamaño base **Pequeño 12, Mediano 14, Grande 18** px | A2, P4 | MEDIDO el diseño; valores DECIDIDO (P4) |
| Restablecer | 159×36 en (781,356); 175×36 en (781,400) | Secundario | MEDIDO |
| Error de color | 276×36 en (781,330), trazo `error` 2 px, mensaje de alto automático | R10, A7 | MEDIDO el punto; alto DECISIÓN (A7) |
| Aviso contraste | 459×42 en (610,4) → D7: x=507 | Advertencia `estado_pendiente`, 6 s | MEDIDO |
| Aviso paleta no disponible | 336×42 en (733,4) → D7: x=630 | Error `error`, hasta cerrar | MEDIDO |
| Cuadro de color en el selector | NO MEDIDO (la huella de 203:10565 solo lista las filas «Principal · #00D9E2», «Secundario · #6604E6», «Texto · #17131D» y el campo hexadecimal; Lectura 1) | — | NO MEDIDO |

### 4 · Textos literales

- «Windgets claro», «Windgets oscuro», «Rosa pastel», «Enfoque rojo y negro»; «Colores del tema», «3 colores», «Tipografía», «<fuente elegida> · Mediano» (la huella dice «Rubik · Mediano»; Rubik sale de la lista: la fila muestra la fuente que la persona eligió o, si no eligió, la del tema, p. ej. «Nunito · Mediano»; T13), «Restablecer colores», «Restablecer tipografía», «Pequeño», «Mediano», «Grande».
- Contraste (D4, no bloquea): `CONTRASTE_BAJO` «El contraste de estos colores es bajo (<contraste>:1). Prueba con <color sugerido>.», con «2,1:1» como ejemplo (formato «n,n:1»). El color sugerido es la `tinta` del tema activo (C20), no el #17131D fijo del Figma: p. ej. «Prueba con #17131D.» en claro, «Prueba con #F8F5FF.» en oscuro.
- Paleta no disponible: «Esta paleta ya no está disponible. Elige otra.»
- Color no válido: «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).»

### 5 · Estados

Base; Paletas (elegida con ✓); Selector con color válido, no válido y con contraste bajo; Paleta personalizada (tres colores editados); Tipografía (fuente y tamaño); Restablecer (sin confirmación, F4a 22); aviso de paleta no disponible.

### 6 · Teclado y foco

Flechas entre paletas; Enter aplica; el campo hexadecimal valida con cada tecla; «Restablecer» deja el foco en el botón.

### 7 · Animaciones

A-09, A-25/A-26, A-05/A-06.

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Color vacío | `color.required` | texto del contrato | bajo el campo |
| Color inválido | `color.invalid` | «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).» | bajo el campo |
| Paleta no disponible | `palette.not_found` | «Esta paleta ya no está disponible. Elige otra.» | aviso Error |
| Contraste bajo | advertencia, no error (D4) | arriba | aviso Advertencia |

### 9 · Diferencia con el código

`Colores.tsx`, `Paletas.tsx`, `Tipografia.tsx` y `avisoDeContraste` (`Personalization.tsx:42`) existen. Falta la composición de 4 paletas + fila de tres colores + muestras, el aviso flotante de contraste y de paleta no disponible, y el selector de tamaño de texto. Los tamaños del código son 14/16/20 px (`PIXELES_DEL_TAMANO` en `ui/tema/temaAplicado.ts:19-20`, `tamano_fuente` 16px en `cuenta.css:72`) y pasan a 12/14/18 (P4); Rubik está declarada en `ui/tema/tokens.css:34-53` y sale de la lista (T13). **M**.

### 10 · Pruebas

Textos de error y de aviso; contraste < 3:1 avisa sin bloquear; Restablecer sin confirmación; paleta elegida con ✓; fuente y tamaño llegan a la vista previa.

---

## PW-10 · Paso 4 Widgets: lista y estados

**Familias (20):** base; ocho «Widgets · X agregado»; Error de carga; Posición ajustada; Tamaño ajustado; Widget inactivo; Eliminar no disponible; Animación en pausa; No se guardaron cambios; tres avisos (repetido, no existe, error de operación); nombres emergentes.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| 4 Widgets | `203:6607` | `233:19187` | `204:10138` | `204:10227` |
| Clima agregado | `203:9197` | `233:21435` | `204:15318` | `204:15413` |
| Noticias agregado | `203:9292` | `233:21548` | `204:15508` | `204:15603` |
| Imagen estática agregado | `203:9387` | `233:21661` | `204:15698` | `204:15793` |
| Carrusel agregado | `203:9482` | `233:21774` | `204:15888` | `204:15983` |
| Animación agregado | `203:9577` | `233:21887` | `204:16078` | `204:16173` |
| Texto agregado | `203:9672` | `233:22000` | `204:16268` | `204:16363` |
| Música agregado | `203:9767` | `233:22113` | `204:16458` | `204:16553` |
| Windi agregado | `203:9862` | `233:22226` | `204:16648` | `204:16743` |
| Error de carga | `217:18219` | `233:23937` | `217:18355` | `217:18287` |
| Posición ajustada | `217:22821` | `233:24256` | `217:23205` | `217:23013` |
| Tamaño ajustado | `217:22917` | `233:24356` | `217:23301` | `217:23109` |
| Widget inactivo | `2240:103574` | `2240:107600` | `2240:104913` | `2240:106256` |
| Eliminar no disponible | `2240:103864` | `2240:107890` | `2240:105207` | `2240:106551` |
| Animación en pausa | `2240:104066` | `2240:108092` | `2240:105409` | `2240:106753` |
| Aviso widget repetido | `2240:104286` | `2240:108312` | `2240:105629` | `2240:106973` |
| Aviso widget no existe | `2240:104495` | `2240:108521` | `2240:105838` | `2240:107182` |
| Aviso error de operación | `2240:104704` | `2240:108730` | `2240:106047` | `2240:107391` |
| No se guardaron cambios | `2221:85076` | `2221:86426` | `2221:85527` | `2221:85979` |
| Nombre emergente (Agregar widget) | `2068:3018` | `2068:6241` | `2068:9528` | `2068:12847` |
| Nombre emergente · Papelera deshabilitada | `2257:160470` | `2257:160672` | `2257:160874` | `2257:161076` |

### 2 · Estructura (`data-testid`)

```
widgets-panel                       título «Widgets del tema»
├ widgets-organizar                 botón 36×36 en (981,104)
├ widgets-agregar                   botón 36×36 en (1021,104)
├ widgets-lista                     filas 276×40 en y=144/186/228/270
│  └ widget-fila-{id}               nombre, interruptor 44×24, Configurar ›, Eliminar
├ widgets-forma                     fila «Forma de los widgets | Suaves ›» 276×36 en (781,316)
├ widgets-distribucion              fila «Distribución predefinida | Original ›» 276×36 en (781,354)
├ widgets-error-carga               estado de error G1j con «Reintentar» (D10: Reintentar donde sirve)
├ widgets-inactivo-{id}             interruptor apagado de la fila
└ widgets-animacion-pausa           ícono de pausa 18×18 sobre la vista previa
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Botones del título | 36×36 en (981,104) y (1021,104) | MB-10 ícono | MEDIDO |
| Filas | huella 276×40 a paso 42 desde y=144; se construyen a 44 (A2, fila de lista); el botón de fila (Configurar, Eliminar) 32 | R6, A2 | MEDIDO |
| Interruptor | 44×24 radio 8 | MB-13 | MEDIDO |
| Forma / Distribución | 276×36 en (781,316) y (781,354), radio 9, trazo `linea` | R12 | MEDIDO |
| Tooltip «Agregar widget» | 113×36 en (976,144) | MB-21 | MEDIDO |
| Tooltip Eliminar deshabilitado | 428×36 en (629,184); variante Globo 260×54 radio 6 `tinta` (marco 260×60 en (809,190)) | MB-21, R5 | MEDIDO |
| Avisos | «No se guardaron cambios.» 230×42 en (839,4); repetido 229×42 en (840,4); no existe 223×42 en (846,4); error de operación 462×42 en (607,4); contraste de Colores libres 460×42 en (609,4) | D7 | MEDIDO |
| Widget inactivo | MEDIDO (2240:103574): es la pantalla base con el interruptor de la fila apagado (relleno `superficie`, trazo `borde_campo`), la barra en «Cambios sin guardar» y el widget quitado de la vista previa. Sin opacidad; el disparador es el interruptor | MB-13 | MEDIDO |
| Animación en pausa | MEDIDO (2240:104066): vista previa del widget 158×96 en (272,142) radio 10; ícono de pausa 18×18 en (406,214) relleno `superficie`, trazo `borde_campo`, radio 9, con dos barras 3×8 `tinta`; panel 300×348 en (769,100). Se muestra mientras `w.paused_by_load` sea verdadero (`Widgets.tsx:131-137`, texto `ANIMACION_EN_PAUSA`) | A-09 | MEDIDO |

### 4 · Textos literales

«Widgets del tema», «Forma de los widgets», «Suaves», «Distribución predefinida», «Original», «Agregar widget», «Organizar widgets»; filas: «Reloj», «Calendario», «Tareas del día», «Kanban», «Clima», «Noticias», «Imagen estática», «Carrusel de imágenes», «Animación», «Texto», «Reproductor de música», «Windi»; avisos: «No se guardaron cambios.»; «Ya agregaste este widget.» (`widget.already_added`); «Este widget ya no existe.» (`widget.not_found`); el de operación fallida es G1h; tooltip y aviso: «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» (`widget.default_not_deletable`); «En pausa por alto consumo de recursos.» (`ANIMACION_EN_PAUSA`).

### 5 · Estados

Normal; widget agregado (fila nueva); error de carga (G1j `WIDGETS_NO_CARGAN` con «Reintentar»); posición/tamaño ajustado; inactivo (interruptor apagado); Eliminar no disponible (widgets por defecto); avisos; esqueleto D9.

### 6 · Teclado y foco

Interruptor con Espacio; Eliminar abre M-07; el tooltip de Eliminar deshabilitado se lee con foco.

### 7 · Animaciones

A-09, A-25/A-26, A-30, A-32.

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Widget repetido | `widget.already_added` | «Ya agregaste este widget.» |
| Widget borrado | `widget.not_found` | «Este widget ya no existe.» |
| Eliminar por defecto | `widget.default_not_deletable` | «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» |
| Sin cambios | `draft.no_changes` (IPC-THEME-11 / IPC-LAY-06) | «No se guardaron cambios.» |
| Falla la carga | `WIDGETS_NO_CARGAN` (G1j) | de CONSISTENCIA |
| Falla la operación | `OPERACION_FALLIDA` (G1h) | «No pudimos completar la operación. Intenta de nuevo más tarde.» |

### 9 · Diferencia con el código

`widgets/Widgets.tsx` (205 l.) ya lista widgets, abre `AgregarWidget` (:111) y tiene `NombreEmergente` (:155) y `porEliminar` (:46). Faltan los botones del título en el panel, las filas de Forma y Distribución, el estado de error de carga, los tooltips de Eliminar deshabilitado y la pausa de animación. **L** por mover la pantalla al paso 4.

### 10 · Pruebas

Lista con interruptores; error de carga con G1j; tooltips; avisos literales; M-07 al eliminar.

---

## PW-11 · Agregar widget y sus ocho subpantallas

**Familias (20):** Agregar widget; Clima, Noticias, Imagen estática, Carrusel, Animación, Texto, Música, Windi; Clima ×6 estados; Carrusel ×3 errores; Texto demasiado largo; Imagen propia; Widgets ya agregados.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Agregar widget | `203:6696` | `233:19287` | `204:10316` | `204:10409` |
| › Clima | `203:7133` | `233:19639` | `204:11190` | `204:11276` |
| › Noticias | `203:7219` | `233:19708` | `204:11362` | `204:11448` |
| › Imagen estática | `203:7305` | `233:19777` | `204:11534` | `204:11620` |
| › Carrusel de imágenes | `203:7391` | `233:19846` | `204:11706` | `204:11792` |
| › Animación | `203:7477` | `233:19915` | `204:11878` | `204:11964` |
| › Texto | `203:7563` | `233:19984` | `204:12050` | `204:12136` |
| › Reproductor de música | `203:7649` | `233:20053` | `204:12222` | `204:12308` |
| › Windi | `203:7735` | `233:20122` | `204:12394` | `204:12480` |
| Clima · Ciudad no encontrada | `217:18564` | `233:24040` | `217:18694` | `217:18629` |
| Clima · Ciudad duplicada | `217:18759` | `233:24112` | `217:18889` | `217:18824` |
| Clima · Sin conexión | `217:18954` | `233:24184` | `217:19084` | `217:19019` |
| Clima · Campo vacío | `2211:79096` | `2213:82878` | `2213:79911` | `2213:81393` |
| Clima · Sugerencias de ciudad | `2211:79211` | `2213:82993` | `2213:80026` | `2213:81508` |
| Clima · Sin conexión al buscar | `2211:79326` | `2213:83108` | `2213:80141` | `2213:81623` |
| Clima · Ciudad demasiado larga | `2211:79441` | `2213:83223` | `2213:80256` | `2213:81738` |
| Clima · Servicio no disponible | `2211:79556` | `2213:83338` | `2213:80371` | `2213:81853` |
| Carrusel · Error de mínimo | `2240:94040` | `2240:96509` | `2240:94863` | `2240:95686` |
| Carrusel · Error de máximo | `2240:94171` | `2240:96640` | `2240:94994` | `2240:95817` |
| Carrusel · Error de intervalo | `2240:94332` | `2240:96801` | `2240:95155` | `2240:95978` |
| Texto · Texto demasiado largo | `2240:94470` | `2240:96939` | `2240:95293` | `2240:96116` |
| Imagen estática · Imagen propia | `2240:94596` | `2240:97065` | `2240:95419` | `2240:96242` |
| Widgets ya agregados | `2240:94722` | `2240:97191` | `2240:95545` | `2240:96368` |

### 2 · Estructura (`data-testid`)

```
agregar-widget                      título «Agregar widget»; grupos «Widgets externos» y «Widgets locales»
├ agregar-widget-opcion-{tipo}      8 opciones: Clima, Noticias, Imagen estática, Carrusel de imágenes, Animación, Texto, Reproductor de música, Windi
agregar-{tipo}                      subpantalla con sus campos y «Agregar»
├ agregar-clima-ciudad              campo de ciudad (CampoCiudad) + sugerencias
├ agregar-error-{causa}             texto de error bajo el campo
├ agregar-carrusel-intervalo        número de segundos
└ agregar-texto-contador            «214 / 200»
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Opciones de Agregar | filas 276×36 | A2 | MEDIDO (huella 6696) |
| Filas de Texto, Imagen estática, Carrusel, Animación | 36 (A2: resto) | A2 | MEDIDO |
| Clima con error | las filas bajan 34; Ciudad duplicada 276×58 con la tarjeta que se descarta | E13 | MEDIDO |
| Error de mínimo del Carrusel | 242×15 en (781,236); las filas bajan 16 y Controles pasa de 126 a 142 de alto | `error` | MEDIDO |
| Error de intervalo del Carrusel | 227×15 en (781,273); filas bajan 18, Controles 126 a 144 | `error` | MEDIDO |
| Error del Texto | 223×15 en (781,269); filas bajan 40, Controles 100 a 140, campo de 64 a 88 de alto; contador «214 / 200» en `error` | `error` | MEDIDO |
| Imagen propia | 150×36 en (781,236); «Quitar imagen» 158×36 en (932,236) | MB-10 | MEDIDO |
| Clima · Campo vacío (2211:79096) | sin mensaje; «Agregar» pasa a su variante deshabilitada (E3; la huella lo da como 74 de ancho y 45 % de opacidad, que se lee como variante, no como `opacity`) y se quita la vista previa | E3 | MEDIDO |
| Clima · Sugerencias (2211:79211) | panel 276×182 en (781,208) `superficie`, trazo `linea`, radio 9; título «Sugerencias de ciudad»; cinco opciones 264×27 a paso 28 (la elegida con `principal_legible`): Popayán, Cauca, Colombia; Popondetta, Oro, Papúa Nueva Guinea; Portland, Oregón, Estados Unidos; Porto, Oporto, Portugal; Posadas, Misiones, Argentina | R6 | MEDIDO |
| Clima · Sin conexión al buscar (2211:79326) | las filas bajan 34; el campo pasa de 36 a 76 de alto con «Popa» y el error debajo | E13 | MEDIDO |
| Clima · Ciudad demasiado larga (2211:79441) | las filas bajan 34; el campo pasa de 36 a 58 de alto con el error debajo (el texto del error no está en el Figma: se usa `CIUDAD_MUY_LARGA`) | E13 | MEDIDO |
| Widgets ya agregados (2240:94722) | Noticias y Reproductor de música pasan a filas «deshabilitada» 276×42 con la descripción «Ya agregaste este widget.» | E3 | MEDIDO |
| Aviso Clima servicio no disponible | 412×42 en (657,4), borde `#b32d42` radio 21, tipo Error (D1: color por variable) | D7 | MEDIDO |

### 4 · Textos literales

- «Agregar widget», «Widgets externos», «Widgets locales», «Clima», «Noticias», «Imagen estática», «Carrusel de imágenes», «Animación», «Texto», «Reproductor de música», «Windi», «Agregar».
- Errores del Clima (texto de `messages.es.json`): `CIUDAD_SIN_CONEXION` «No hay conexión a internet. Conéctate para validar la ciudad.»; `CIUDAD_NO_ENCONTRADA` «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.»; `CIUDAD_DUPLICADA` «Ya tienes un widget Clima para esa ciudad.»; `CIUDAD_MUY_LARGA` «La ciudad no puede superar los 100 caracteres.»; «sin conexión al buscar» copia el de sin conexión (E12). El campo vacío no muestra mensaje.
- Carrusel: `CARRUSEL_POCAS_IMAGENES` «Selecciona al menos 2 imágenes para el carrusel.»; `CARRUSEL_DEMASIADAS_IMAGENES` «Puedes agregar máximo 10 imágenes al carrusel.»; `INTERVALO_FUERA_DE_RANGO` «El intervalo debe estar entre 3 y 60 segundos.».
- Texto: `TEXTO_MUY_LARGO` «El texto no puede superar los 200 caracteres.» con contador «214 / 200» en `error`.

### 5 · Estados

Cada subpantalla: normal, con error por campo (todos a la vez, uno por campo), éxito (vuelve al paso 4 con la fila nueva y aviso). Clima: campo vacío, sugerencias, sin conexión al buscar, ciudad no encontrada, duplicada (trazo `error`, sin barra ámbar: E13), demasiado larga, servicio no disponible. «Widgets ya agregados»: la opción se muestra ya agregada.

### 6 · Teclado y foco

Flechas en la lista de opciones; Enter abre; el campo de ciudad navega las sugerencias con flechas; Esc cierra las sugerencias; «Regresar» devuelve el foco a la opción.

### 7 · Animaciones

A-09, A-25/A-26, A-05/A-06 para avisos.

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Sin conexión | `net.offline` (clave `CIUDAD_SIN_CONEXION`) | «No hay conexión a internet. Conéctate para validar la ciudad.» |
| Ciudad no encontrada | `city.not_found` (clave `CIUDAD_NO_ENCONTRADA`) | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» |
| Ciudad duplicada | `city.duplicate` (clave `CIUDAD_DUPLICADA`) | «Ya tienes un widget Clima para esa ciudad.» |
| Ciudad muy larga | `city.too_long` (clave `CIUDAD_MUY_LARGA`) | «La ciudad no puede superar los 100 caracteres.» |
| Servicio de clima caído | `CLIMA_NO_CARGA` (G1k; la clave del código actual `CLIMA_NO_DISPONIBLE` se renombra) | «No pudimos cargar el clima. Intenta de nuevo más tarde.» |
| Noticias no cargan | `NOTICIAS_NO_CARGAN` (G1n; clave actual `NOTICIAS_NO_DISPONIBLES`) | «No pudimos cargar las noticias. Intenta de nuevo más tarde.» |
| Mínimo de imágenes | `carousel.too_few` (clave `CARRUSEL_POCAS_IMAGENES`) | «Selecciona al menos 2 imágenes para el carrusel.» |
| Máximo de imágenes | `carousel.too_many` (clave `CARRUSEL_DEMASIADAS_IMAGENES`) | «Puedes agregar máximo 10 imágenes al carrusel.» |
| Intervalo | `interval.out_of_range` (clave `INTERVALO_FUERA_DE_RANGO`); `interval.required` sin texto en el Figma (PROPUESTA: mismo mensaje) | «El intervalo debe estar entre 3 y 60 segundos.» |
| Texto muy largo | `text.too_long` (clave `TEXTO_MUY_LARGO`) | «El texto no puede superar los 200 caracteres.» |
| Imagen | `image.format_not_allowed` (`FORMATO_DE_IMAGEN_NO_PERMITIDO`), `image.too_large` (`IMAGEN_MUY_GRANDE`), `image.unreadable` (`IMAGEN_ILEGIBLE`) | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.»; «La imagen supera el tamaño máximo de 20 MB.»; «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» |
| Widget ya agregado | `widget.already_added` | «Ya agregaste este widget.» |

### 9 · Diferencia con el código

`widgets/AgregarWidget.tsx` (119 l.) y `AgregarClima/Carrusel/Texto/ImagenEstatica/Animacion/SinDatos`, `CampoCiudad.tsx` y `FormularioDeWidget.tsx` existen. Faltan el estado «sin conexión al buscar», sugerencias, el contador «n / 200», Noticias y Windi como subpantallas (`SinDatos`), y la subpantalla de Música. **M** por subpantalla en conjunto; **L** el total.

### 10 · Pruebas

Un caso por error con su texto literal; Ciudad duplicada sin barra ámbar; contador del Texto; los tres errores del Carrusel a la vez; agregar widget crea la fila.

---

## PW-12 · Configurar widget (12) y selectores

**Familias (12 + 6 + 4):** Configurar Reloj, Calendario, Tareas del día, Kanban, Clima, Noticias, Imagen estática, Carrusel, Animación, Texto, Música, Windi; seis selectores; cuatro variantes de apariencia.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Configurar › Reloj | `203:7821` | `233:20191` | `204:12566` | `204:12649` |
| Configurar › Calendario | `203:7904` | `233:20257` | `204:12732` | `204:12815` |
| Configurar › Tareas del día | `203:7987` | `233:20323` | `204:12898` | `204:12981` |
| Configurar › Kanban | `203:8070` | `233:20389` | `204:13064` | `204:13147` |
| Configurar › Clima | `203:8153` | `233:20455` | `204:13230` | `204:13313` |
| Configurar › Noticias | `203:8236` | `233:20521` | `204:13396` | `204:13479` |
| Configurar › Imagen estática | `203:8319` | `233:20587` | `204:13562` | `204:13645` |
| Configurar › Carrusel | `203:8402` | `233:20653` | `204:13728` | `204:13811` |
| Configurar › Animación | `203:8485` | `233:20719` | `204:13894` | `204:13977` |
| Configurar › Texto | `203:8568` | `233:20785` | `204:14060` | `204:14143` |
| Configurar › Música | `203:8651` | `233:20851` | `204:14226` | `204:14309` |
| Configurar › Windi | `203:8734` | `233:20917` | `204:14392` | `204:14475` |
| Selector · Apariencia | `204:42141` | `233:23732` | `204:42149` | `204:42157` |
| Selector · Transparencia | `204:42165` | `233:23740` | `204:42177` | `204:42189` |
| Selector · Tamaño de texto | `204:42201` | `233:23752` | `204:42211` | `204:42221` |
| Selector · Formato Reloj | `204:42231` | `233:23762` | `204:42237` | `204:42243` |
| Selector · Formato Calendario | `204:42249` | `233:23768` | `204:42255` | `204:42261` |
| Selector · Datos Reproductor de música | `204:42351` | `233:23802` | `204:42357` | `204:42363` |
| Otra paleta › Reloj | `2222:86308` | `2222:88369` | `2222:86983` | `2222:87674` |
| Colores libres › Reloj | `2222:86415` | `2222:88476` | `2222:87090` | `2222:87781` |
| Colores libres · Contraste bajo › Reloj | `2222:86522` | `2222:88583` | `2222:87197` | `2222:87888` |
| Apariencia propia › Reloj | `2222:86629` | `2222:88690` | `2222:87304` | `2222:87995` |

### 2 · Estructura

```
configurar-{tipo}                   panel con título «Configurar <widget>» y «← Regresar»
├ configurar-formato                fila «Formato | 24 h ›» (Reloj) o «Formato | Lunes ›» (Calendario)
├ configurar-apariencia             fila «Apariencia | Paleta del tema ›»
├ configurar-transparencia          fila «Transparencia | 0 % ›» (por defecto 0 %, según las huellas)
├ configurar-tamano-texto           fila «Tamaño de texto | Igual que el tema ›»
├ configurar-datos                  fila «Datos | Spotify ›» (Música)
└ configurar-listo                  «Listo» 66×36 en (991,400)
selector-{nombre}                   panel 326, título en (12,10), opciones 306×36 (A2: selector 31→36) radio 9 a paso 35
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Filas de Configurar | huella: Formato/Datos 276×36 en el Reloj, Apariencia en y=192, Transparencia 236, Tamaño de texto 280 (paso 44); en los widgets con controles las filas bajan y miden 32 en la huella (se construyen a 36, A2) | A2 | MEDIDO |
| Reloj / Calendario | primera fila «Formato» con «24 h ›» o «Lunes ›»; migas «Personalización › 4 Widgets › Configurar widget › Reloj»; panel 300×348 en (769,100), título 17 Medium, «← Regresar» | MB-02 | MEDIDO |
| Tareas del día / Kanban | primera fila «Datos | Tema en edición ›» 276×36 sin relleno ni trazo | — | MEDIDO |
| Clima | vista previa 158×88 «Popayán · 18 °C · Parcialmente nublado»; «Ciudad» 12/18; campo 276×36 en (781,168) con ícono Buscar 20 y «Popayán, Cauca, Colombia»; fila «Datos | Popayán, Colombia»; las filas de ajustes bajan 24 (216/260/304) | — | MEDIDO |
| Noticias | vista previa 300×148 en (90,335) (queda bajo el escritorio, no en (282,142)); 5 titulares 284×20 | — | MEDIDO |
| Imagen estática | vista previa 158×96; Controles 276×104 en (781,144): «Subir imagen» 112×32, «Catálogo de imágenes» 156×32, 4 muestras 63×40 radio 6 (la elegida con trazo `seleccion` y ✓ 14×14), ayuda «JPG, JPEG o PNG. Máximo 20 MB.»; «Datos | Catálogo de imágenes» | MB-10 | MEDIDO |
| Carrusel | vista previa 158×96 con píldora «2 de 10» 54×18; Controles 276×126 con las dos miniaturas 56×32 y su × 14×14; «Datos | 2 imágenes · 10 s» | — | MEDIDO |
| Animación | vista previa 158×96; Controles 276×84: «Catálogo de animaciones» 12, Atardecer y Nubes 84×46 (la elegida con trazo `seleccion` y ✓); «Datos | Atardecer» | — | MEDIDO |
| Texto | vista previa 158×96 «Un paso a la vez.»; Controles 276×100: campo 276×64 y «17 / 200»; «Datos | Un paso a la vez.» | — | MEDIDO |
| Música | vista previa 190×76 «Pista de estudio · Spotify · 01:24 / 03:42»; «Datos | Spotify ›» | — | MEDIDO |
| Windi | vista previa 126,5×122; «Datos | Ojos del tema ›» | — | MEDIDO |
| «Listo» | 66×36 en (991,400) | Primario | MEDIDO |
| Selector | panel de 326 de ancho; título 15 en (12,10); opciones 306×31 en la huella, se construyen a 36 (A2) radio 9 a paso 35; la elegida con «✓» | R6, A2 | MEDIDO |
| Opciones de Apariencia | Paleta del tema (✓), Otra paleta, Colores libres | — | MEDIDO |
| Opciones de Transparencia | 0 % (por defecto), 25 %, 50 %, 75 %, 100 % | — | MEDIDO |
| Opciones de Tamaño de texto | Igual que el tema, Pequeño, Mediano, Grande | P4 | MEDIDO |
| Formato Reloj | 24 h, 12 h | — | MEDIDO |
| Formato Calendario | Lunes, Domingo | — | MEDIDO |
| Datos Música | Spotify, YouTube Music | — | MEDIDO |
| Aviso Colores libres con contraste bajo | 460×42 en (609,4), «1,7:1» | Advertencia | MEDIDO |

### 4 · Textos literales

«Configurar widget», «Formato», «24 h», «12 h», «Lunes», «Domingo», «Apariencia», «Paleta del tema», «Otra paleta», «Colores libres», «Transparencia», «Tamaño de texto», «Igual que el tema», «Datos», «Spotify», «YouTube Music», «Listo».

### 5 · Estados

Cada widget con sus filas; selector abierto sobre la fila; Apariencia propia con Otra paleta o Colores libres; Colores libres con contraste bajo (aviso, no bloquea: D4). El selector se cierra al elegir y devuelve el foco a la fila.

### 6 · Teclado y foco

Flechas y Enter en el selector; Esc lo cierra sin cambiar; el foco vuelve a la fila.

### 7 · Animaciones

A-09, A-25/A-26; el selector entra con A-10.

### 8 · Errores

Sin errores de campo. Contraste: advertencia (D4). Widget borrado: `widget.not_found`. Falla: `OPERACION_FALLIDA` (G1h).

Valores que el selector no puede producir pero un cliente sí (S13, PROPUESTA, convención `a.b` de los contratos; destino `docs/contratos.md` y DUDAS.md):

| Código | Cuándo | Mensaje | Dónde |
|---|---|---|---|
| `widget_opacity.invalid` | `opacity_pct` fuera de 0, 25, 50, 75, 100 | «Elige una transparencia de la lista.» | Selector de Transparencia |
| `widget_font_size.invalid` | `font_size` distinto de `null`, `small`, `medium`, `large` | «Elige un tamaño de texto de la lista.» | Selector de Tamaño de texto |
| `widget_format.invalid` | `hour_cycle` distinto de `h23`/`h12`, o `week_start` distinto de `monday`/`sunday`, o formato enviado a un widget que no es Reloj ni Calendario | «Elige un formato de la lista.» | Selector de Formato |
| `widget_appearance.invalid` | `appearance_mode` fuera de `theme`, `palette`, `free`; `palette` sin `palette_id`; `free` sin los tres colores | «Elige una apariencia válida.» | Selector de Apariencia |

Colores y paleta del widget reutilizan `color.invalid`, `color.required` y `palette.not_found` de IPC-THEME-05.

### 9 · Diferencia con el código

No existe en el código «Configurar widget», ni los selectores de Apariencia, Transparencia, Tamaño de texto o Formato (se verificó con grep). **NUEVA**, **L**.

**Persistencia (S13, PROPUESTA):** se amplía IPC-THEME-05 `theme_draft_update` con `patch.widgets?: { [widget_id]: WidgetPatch }`, un solo guardado por tema. Los valores viven en `theme_widget` (son por tema y por widget) y las columnas nuevas entran en la migración 0013 de PW-13.

| Campo de `WidgetPatch` | Columna de `theme_widget` | Valores | Por defecto |
|---|---|---|---|
| `appearance_mode` | `appearance_mode` | `theme`, `palette`, `free` | `theme` («Paleta del tema») |
| `palette_id` | `appearance_palette_id` | id del catálogo o `null` | `null` |
| `colors` | `appearance_color_primary`, `appearance_color_secondary`, `appearance_color_text` | hex `#rrggbb` o `null`; los tres juntos en `free` | `null` |
| `opacity_pct` | `opacity_pct` | 0, 25, 50, 75, 100 | 0 |
| `font_size` | `font_size_override` | `null` («Igual que el tema»), `small`, `medium`, `large` | `null` |
| `hour_cycle` | `clock_hour_cycle` | `h23` (24 h), `h12` (12 h); solo Reloj | `h23` |
| `week_start` | `calendar_week_start` | `monday`, `sunday`; solo Calendario | `monday` |

Contrato y migración: **L** en conjunto (ver PW-13).

### 10 · Pruebas

Cada selector muestra sus opciones literales y marca la elegida; contraste bajo avisa y no bloquea; «Listo» vuelve al paso 4; foco al cerrar.

S13 (PROPUESTA, CA derivados con destino HE-02):

| Caso | Prueba |
|---|---|
| Cada selector guarda su campo en el borrador con un solo `theme_draft_update` | Vitest del servicio del borrador |
| Valor fuera de la lista devuelve su código y su mensaje | Cargo test de la orden, un caso por código de la tabla de la parte 8 |
| `free` sin los tres colores devuelve `widget_appearance.invalid` | Cargo test |
| `hour_cycle` en un widget que no es Reloj devuelve `widget_format.invalid` | Cargo test |
| Aplicar el tema conserva los valores por widget | Cargo test de `theme_apply` sobre `theme_widget` |

---

## PW-13 · Forma de los widgets y Distribución predefinida

**Familias (9):** Forma, Rectas, Redondas, Con sombra, Distribución predefinida, Reloj a la derecha ×2 (Widgets y Organizar), Kanban centrado ×2.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Forma de los widgets | `203:10717` | `233:23070` | `204:18400` | `204:18477` |
| Forma · Rectas | `2213:85246` | `2213:86647` | `2213:85704` | `2213:86174` |
| Forma · Redondas | `2213:85346` | `2213:86747` | `2213:85804` | `2213:86274` |
| Forma · Con sombra | `2213:85446` | `2213:86847` | `2213:85904` | `2213:86374` |
| Distribución predefinida | `203:10794` | `233:23130` | `204:18554` | `204:18629` |
| 4 Widgets · Reloj a la derecha | `223:15683` | `233:24465` | `223:16199` | `223:15941` |
| 4 Widgets · Kanban centrado | `223:15812` | `233:24594` | `223:16328` | `223:16070` |
| Organizar · Reloj a la derecha | `223:15783` | `233:24565` | `223:16299` | `223:16041` |
| Organizar · Kanban centrado | `223:15912` | `233:24694` | `223:16428` | `223:16170` |

### 2 · Estructura

```
forma-panel                         título «Forma de los widgets» y «← Regresar»
├ forma-esquinas-{rectas|suaves|redondas}   tres filas
└ forma-sombra                      etiqueta «Sombra» con interruptor 44×24
distribucion-panel                  título «Distribución predefinida»
└ distribucion-{original|reloj-derecha|kanban-centrado}   tres filas
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Opciones de esquinas | paso 42 desde y=172 (en 2213:85246); la elegida «✓ Actual» | R12 radio 9, trazo `linea` | MEDIDO |
| Radio de los widgets | Rectas 0, Suaves 9 (variable `Radio de widgets`), Redondas 22 | R11 | DECISIÓN (R11) |
| Sombra | sombra dura 1,3; interruptor 44×24; perilla `perilla` | R8/P16, R13 | PROPUESTA el 1,3 |
| Distribución | tres filas de 36 | R12 | MEDIDO |

### 4 · Textos literales

«Forma de los widgets», «Esquinas», «Rectas», «Suaves», «Redondas», «Actual», «Sombra», «Distribución predefinida», «Original», «Reloj a la derecha», «Kanban centrado».

### 5 · Estados

Forma: Rectas, Suaves (por defecto), Redondas, con sombra; la vista previa cambia en vivo. Distribución: Original, Reloj a la derecha, Kanban centrado (se reflejan en la lista y en Organizar). Cada cambio deja «Cambios sin guardar».

### 6 · Teclado y foco

Flechas entre filas; Enter elige; foco vuelve a la fila de origen en el paso 4.

### 7 · Animaciones

A-09, A-25/A-26; los widgets de la vista previa cambian de radio sin animar.

### 8 · Errores

Sin errores de campo. Falla al guardar: `OPERACION_FALLIDA` (G1h).

Valores que la interfaz no produce pero un cliente sí (S13, PROPUESTA, convención `a.b`; destino `docs/contratos.md` y DUDAS.md):

| Código | Cuándo | Mensaje | Dónde |
|---|---|---|---|
| `widget_shape.invalid` | `widget_shape` distinto de `rectas`, `suaves`, `redondas` | «Elige una forma de la lista.» | Lista de Esquinas |
| `layout_preset.invalid` | `layout_preset` distinto de `original`, `reloj-derecha`, `kanban-centrado` | «Elige una distribución de la lista.» | Lista de Distribución |
| `background_dim.invalid` | `background_dim` fuera de 0, 15, 30, 45, 60 | «Elige un nivel de oscurecimiento de la lista.» | Control Oscurecer |
| `background_blur.invalid` | `background_blur_px` fuera de 0, 2, 4 | «Elige un nivel de desenfoque de la lista.» | Control Desenfocar |

### 9 · Diferencia con el código

No existe en el código (grep: solo en `ui/Iconos`). **NUEVA**, **L**.

**Persistencia (S13, PROPUESTA):** se amplía IPC-THEME-05 `theme_draft_update`; un solo guardado por tema, sin comandos nuevos.

| Campo de `patch` | Columna | Valores | Por defecto |
|---|---|---|---|
| `widget_shape` | `theme.widget_shape` | `rectas`, `suaves`, `redondas` (radio 0, 9, 22) | `suaves` |
| `widget_shadow` | `theme.widget_shadow` | boolean | `false` |
| `background_dim` | `theme.background_dim` | 0, 15, 30, 45, 60 (%) | 0 |
| `background_blur_px` | `theme.background_blur_px` | 0, 2, 4 | 0 |
| `layout_preset` | sin columna: escribe `x`, `y`, `width`, `height` en `theme_widget` | `original`, `reloj-derecha`, `kanban-centrado` | `original` |
| `widgets` | ver PW-12 | ver PW-12 | ver PW-12 |

Los límites de `background_dim` y `background_blur_px` son listas cerradas, no rangos: el control es de pasos fijos (decisión Oscurecer/Desenfocar). `layout_preset` aplica posiciones; las medidas de referencia son `ref_width` y `ref_height` del tema.

**Migración 0013 (una sola, coordinada con SPEC_Configuracion L182 y L477):** SPEC_Configuracion pide en la 0013 `app_density` en `user_preference`. Esta spec pide en la misma 0013: en `theme` y `applied_theme`, `widget_shape` (text, `suaves`), `widget_shadow` (boolean, `false`), `background_dim` (smallint, 0) y `background_blur_px` (smallint, 0); en `theme_widget`, las columnas de PW-12. Con `CHECK` por cada lista cerrada. No hay dos migraciones 0013: si SPEC_Configuracion se implementa antes, se anota la 0013 y este contenido pasa a 0014; destino: anotarlo en SPEC_Configuracion (fuera de esta entrega) y en DUDAS.md.

| Qué | Dónde | Tamaño |
|---|---|---|
| Migración 0013 con las columnas anteriores y su equivalente | `supabase/migrations/` y `docs/local/sqlite_esquema.sql` (y `apps/desktop/src-tauri/sqlite_esquema.sql`) | L |
| `_sync_fields` de `theme`, `applied_theme` y `theme_widget` con las columnas nuevas | `supabase/migrations/0003_funciones.sql:266-285`, redefinida en la 0013 | M |
| `theme_draft_update` acepta los campos nuevos y `ThemeDraftView` los devuelve | `docs/contratos.md:228` y la orden Rust | L |
| `theme_apply` copia las columnas de `theme` a `applied_theme` | `docs/contratos.md` (IPC-THEME de aplicar) | M |

### 10 · Pruebas

Radios 0/9/22 en la vista previa; sombra activa/inactiva; cada distribución mueve los widgets; marca «Cambios sin guardar».

S13 (PROPUESTA, CA derivados con destino HE-02):

| Caso | Prueba |
|---|---|
| Forma, sombra, Oscurecer y Desenfocar se guardan con un solo `theme_draft_update` | Cargo test de la orden |
| Valor fuera de lista devuelve su código y mensaje | Cargo test, un caso por código de la tabla de la parte 8 |
| Los valores por defecto coinciden con la tabla | SQL: insertar un tema y leer las columnas |
| `theme_apply` copia forma, sombra, Oscurecer y Desenfocar a `applied_theme` | Cargo test |
| `_sync_fields` incluye las columnas nuevas | SQL de `0003`/`0013` |

---

## PW-14 · Organizar widgets

**Familias (12):** base, Arrastrando, Redimensionando, Colisión, Sin conexión, Widget eliminado, Personalización más reciente, Sin widgets activos, más las dos distribuciones de PW-13.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Organizar widgets | `203:9957` | `233:22339` | `204:16838` | `204:16866` |
| Arrastrando | `217:17802` | `233:23814` | `217:17850` | `217:17826` |
| Redimensionando | `217:17874` | `233:23843` | `217:17922` | `217:17898` |
| Colisión | `217:17946` | `233:23873` | `217:17994` | `217:17970` |
| Sin conexión | `217:18018` | `233:23905` | `217:18066` | `217:18042` |
| Widget eliminado | `2221:84854` | `2221:86204` | `2221:85301` | `2221:85752` |
| Personalización más reciente | `2221:84930` | `2221:86280` | `2221:85377` | `2221:85828` |
| Sin widgets activos | `2221:85006` | `2221:86356` | `2221:85453` | `2221:85904` |

### 2 · Estructura

```
organizar                           pantalla completa de edición del escritorio
├ organizar-titulo                  «Organizar widgets» 189×30 en (20,15)
├ organizar-instruccion             texto de ayuda
├ organizar-widget-{id}             arrastrable y con esquina de tamaño
├ organizar-aviso                   píldora de aviso (colisión, sin conexión, widget eliminado, más reciente)
├ organizar-barra                   barra flotante 478×60 en (250,484), radio 16: «Cancelar» 91×36 y «Listo» 66×36
└ organizar-vacio                   «Sin widgets activos» (PROPUESTA D9)
```

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Título | 189×30 en (20,15) | `tinta` | MEDIDO |
| Barra flotante | 478×60 en (250,484), radio 16; «Cancelar» 91×36; «Listo» 66×36 | `superficie`, `linea` | MEDIDO |
| Colisión | una sola píldora 242×42 radio 21, borde `error`, ícono 16×16, «Cerrar» 26×30 (la tarjeta 282×37 en (324,8) del Figma se descarta: E17); el Reloj en colisión con borde `error` en (640,90) | E17, D1 | MEDIDO |
| Sin conexión | píldora 423×42 en (335,12), tipo Advertencia (borde ámbar, la huella 217:18018) | D1 | MEDIDO |
| Widget eliminado | píldora 484×42 en (305,12), tipo Error, «Cerrar» 26×30 en (452,6) | D1 | MEDIDO |
| Personalización más reciente | píldora 717×42 en (188,12), tipo Información (borde `principal`); en D7 se parte en dos líneas dentro de 480 | D1, D7 | MEDIDO; ancho D7 |
| Arrastrar | Reloj 190,5×106 en (200,130) con borde `borde` y radio 13 | — | MEDIDO |
| Redimensionar | el Reloj crece a 266,5×148,5 radio 18,5; borde `seleccion` 274,5×156,5; tirador 22×22 radio 6 en (257,5;139,5) | — | MEDIDO |
| Sin widgets activos | escritorio vacío sin texto ni acción en el Figma (2221:85006); se redacta con el patrón D9: título «Sin widgets activos» y línea «Activa o agrega un widget desde Widgets para organizarlo aquí.» centrados, sin acción | D9, MB-25 | PROPUESTA |
| Posición de la píldora | y=4 y borde derecho x=966 por D7 en vez de y=8-12 del Figma; ancho máximo min(480, 966 − fin de miga − 16); un aviso a la vez; los errores no se reemplazan | D7 | DECISIÓN |
| Arrastre y redimensión | el widget sigue al puntero y se asienta con 0,2 s `EASE_OUT` (F-3, `SMART_ANIMATE`) | A-17 | MEDIDO |

### 4 · Textos literales

- «Organizar widgets»; instrucción: «Arrastra los widgets para moverlos o desde su esquina para cambiar su tamaño»; botones «Cancelar» y «Listo».
- Colisión: «Los widgets se superponen.» (con «Cerrar»).
- Sin conexión: «Sin conexión · Puedes organizar los widgets de este tema.»
- Widget eliminado: «Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.» (`layout.widget_missing`).
- Personalización más reciente: el mismo texto de PW-04.

### 5 · Estados

Base; arrastrando; redimensionando; colisión (solo la píldora, E17); sin conexión; widget eliminado; personalización más reciente; sin widgets activos. Aplica al arrastrar la distribución elegida en PW-13.

### 6 · Teclado y foco

Esc = «Cancelar» (M-02 si hay cambios; sin cambios sale directo); Enter en «Listo».

S14: «Listo» guarda el orden de los widgets en el tema y sale de Organizar; no queda borrador. Durante el guardado «Listo» se deshabilita y marca `aria-busy`; si falla, la pantalla no sale y muestra `ORGANIZAR_WIDGETS_FALLIDO` (parte 8). Con colisión, «Listo» sigue el mismo camino de error. Con cambios, «Cancelar» abre M-02 («Salir sin guardar» en Destructivo, D13); el foco vuelve a «Cancelar» al cerrar M-02 sin salir.

### 7 · Animaciones

A-05/A-06 en píldoras (`DISSOLVE` 0,15 s `EASE_OUT`: Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrar); arrastre y redimensión con 0,2 s `EASE_OUT` (F-3).

### 8 · Errores

| Causa | Código | Mensaje |
|---|---|---|
| Colisión | `ORGANIZAR_WIDGETS_FALLIDO` (G1q) si se intenta guardar; la colisión misma es un evento visual (E17), sin código en el contrato | «Los widgets se superponen.» |
| Widget eliminado | `layout.widget_missing` | «Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.» |
| Falla al guardar el orden | `ORGANIZAR_WIDGETS_FALLIDO` (G1q) | «No se pudo completar la operación.»; con colisión: «No se pudo reorganizar. Revisa que los widgets no se tapen.» (PROPUESTA, G1q) |
| Sin conexión | `net.offline` (Advertencia, no bloquea) | «Sin conexión · Puedes organizar los widgets de este tema.» |

### 9 · Diferencia con el código

`apps/desktop/src/edicion/Edicion.tsx` (265 l.) ya implementa la edición del escritorio (HE-05) con barra superior «Guardar»/«Cancelar», `INSTRUCCION_DE_EDICION`, M-02 y aviso remoto. `avisoRemoto` está en `Edicion.tsx:217-221` (texto `PERSONALIZACION_REMOTA_CON_CAMBIOS`). Falta la barra flotante «Cancelar»/«Listo», la píldora de colisión, los avisos de sin conexión y widget eliminado. **Qué pasa con los botones actuales:** en Organizar la barra superior «Guardar»/«Cancelar» (`Edicion.tsx:222-228`) se sustituye por la flotante: «Cancelar» conserva el comportamiento del «Cancelar» actual (M-02 si hay cambios) y «Listo» ocupa el lugar de «Guardar» y guarda el orden (S14; el handler de «Guardar» actual se reutiliza, **S**). «Restablecer» de la pantalla de Personalización no pide confirmación (N9 quedó desactualizada: manda el Figma). **M**.

### 10 · Pruebas

Instrucción literal; colisión muestra la píldora y el borde `error`; barra flotante 478×60; Esc con cambios abre M-02; widget eliminado con su texto.

S14 (CA derivados, PROPUESTA con destino HE-05): «Listo» guarda el orden y sale (Vitest con el servicio simulado); «Listo» con fallo no sale y muestra `ORGANIZAR_WIDGETS_FALLIDO`; «Cancelar» sin cambios sale sin M-02; «Cancelar» con cambios abre M-02 y «Salir sin guardar» descarta el orden; tras «Listo» no queda «Cambios sin guardar» por el orden.

---

## PW-15 · Windi superpuesto

**Familias (6):** Windi, Propuesta, Escribiendo, Sin conexión, Error, Propuesta descartada. Se cita PL-15 de `SPEC_Planificador.md` y MB-05/MB-27: el panel es el mismo.

### 1 · Nodos

| Familia | claro | oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Overlay · Windi | `204:25151` | `233:23658` | `204:25305` | `204:25459` |
| Propuesta | `204:25162` | `233:23669` | `204:25316` | `204:25470` |
| Escribiendo | `204:25177` | `233:23684` | `204:25331` | `204:25485` |
| Sin conexión | `204:25188` | `233:23695` | `204:25342` | `204:25496` |
| Error | `204:25199` | `233:23706` | `204:25353` | `204:25507` |
| Propuesta descartada | `204:25210` | `233:23717` | `204:25364` | `204:25518` |

### 2 a 10 · Se hereda

Estructura, textos, estados, teclado, animaciones y errores: los de PL-15 (Planificador) y MB-05; aquí solo cambia el contexto (el panel se abre sobre la personalización). Medida del panel: 351×551 en (737,4) (MEDIDO).

| Parte | Valor |
|---|---|
| Alturas por estado | 551 en todos (MEDIDO); sin variante con error de otra altura |
| Diferencia con el código | `ui/OjosDeWindi` y el panel existen; falta el contexto de personalización. **S** |
| Pruebas | las de PL-15 con el panel abierto desde el paso 4 |

---

## Tabla de geometría (coordenadas de las huellas, marco 1093×560)

| Elemento | x, y | Ancho × alto | Pieza |
|---|---|---|---|
| Panel lateral | 769, 100 | 300×348 | PW-01 |
| Título del panel | 781, 110 | — | PW-01 |
| Migas | 76, 20 | — | PW-01 |
| Expandir menú (tooltip) | 2, 49 | 70×54 | PW-01 |
| «Guardar como tema» | 781, 140 | 160×36 | PW-02 |
| Lista de temas | 777, 184 | 284×256 | PW-02 |
| Fila de tema (paso 40) | 781, 184 / 224 / 264 / 304 | 276×32 | PW-02 |
| Ayuda «Un solo tema» | 785, 228 | 268×32 | PW-02 |
| Tooltip Renombrar | 962, 298 | 86×36 | PW-02 |
| Tooltip Eliminar deshabilitado | 679, 236 | 390×36 | PW-02 |
| Tooltip Aplicar deshabilitado | 890, 470 | 179×36 | PW-02 |
| Tooltip Guardar deshabilitado | 805, 470 | 195×36 | PW-02 |
| Guardar como tema: campo | 12, 48 (del panel) | 276×36 | PW-03 |
| Guardar como tema: error de nombre | bajo el campo | 180×28 en el Figma; 276 y alto automático (A7) | PW-03 |
| Renombrar: ventana | centrada | 386×173 sin error; con error 173 + 16 por línea (PROPUESTA) | PW-03 |
| Renombrar: campo, Cancelar, Guardar | 16,73 · 158,121 · 281,121 | 350×32 · 91×36 · 87×36 | PW-03 |
| Aviso Máximo de temas | 602, 4 | 467×42 | PW-04 |
| Aviso Mismas propiedades | 619, 4 | 450×42 | PW-04 |
| Aviso Tema no existe | 858, 4 | 211×42 | PW-04 |
| Aviso Más reciente | 354, 4 | 715×42 (dos líneas dentro de 480) | PW-04 |
| Barra de guardado: línea | 72, 508 | 1001×1 | PW-05 |
| Barra: «Cancelar cambios» / «Guardar» / «Aplicar» | 738,516 · 893,516 · 988,516 | 147×36 · 87×36 · 81×36 | PW-05 |
| Ventanas M-nn | centradas | 424×160; M-03 y M-15 512×160 | PW-06 |
| Fondo: catálogo | 781, 144 | 276×36 | PW-07 |
| Fondo: «Subir imagen», «Sin imagen» | 781,188 · 781,232 | 119×36 · 106×36 | PW-07 |
| Fondo: «Imagen propia», «Quitar imagen» | 781,236 · 932,236 | 150×36 · 158×36 | PW-07 |
| Fondo: deslizadores | 781,284 · 781,328 | 276×36 | PW-07 |
| Fondo: error de subida | 781, 240 | 276×36 (alto automático) | PW-07 |
| Aviso Imagen no encontrada / Fondo por defecto | 484,4 · 668,4 | 585×42 · 401×42 | PW-07 |
| Colores: paletas | 781,144 · 923,144 · 781,188 · 923,188 | 134×36 | PW-09 |
| Colores: «Colores del tema» | 781, 234 | 276×36 | PW-09 |
| Colores: muestras / tipografía | y=280 / y=312 | 16×16 / 276×36 | PW-09 |
| Restablecer colores / tipografía | 781,356 · 781,400 | 159×36 · 175×36 | PW-09 |
| Selector de color: error | 781, 330 | 276×36 | PW-09 |
| Aviso contraste / Paleta no disponible | 610,4 · 733,4 | 459×42 · 336×42 | PW-09 |
| Widgets: Organizar / Agregar | 981,104 · 1021,104 | 36×36 | PW-10 |
| Widgets: filas (paso 42) | 781, 144 / 186 / 228 / 270 | 276×40 | PW-10 |
| Widgets: Forma / Distribución | 781,316 · 781,354 | 276×36 | PW-10 |
| Tooltip Agregar widget | 976, 144 | 113×36 | PW-10 |
| Tooltip Eliminar no disponible (y variante Globo) | 629,184 (Globo 809,190) | 428×36 (Globo 260×54 en marco 260×60) | PW-10 |
| Avisos de Widgets: No se guardaron / repetido / no existe / error / contraste libres | 839,4 · 840,4 · 846,4 · 607,4 · 609,4 | 230×42 · 229×42 · 223×42 · 462×42 · 460×42 | PW-10 |
| Clima: error por causa | las filas bajan 34; Ciudad duplicada 276×58 | — | PW-11 |
| Aviso Clima servicio no disponible | 657, 4 | 412×42 | PW-11 |
| Carrusel: error mínimo / intervalo | 781,236 · 781,273 | 242×15 · 227×15 | PW-11 |
| Texto: error | 781, 269 | 223×15 | PW-11 |
| Configurar: «Listo» | 991, 400 | 66×36 | PW-12 |
| Selector superpuesto | título 12,10 | panel 326; opciones 306×31 paso 35 | PW-12 |
| Forma: opciones de esquinas (paso 42) | desde y=172 | filas de 276 | PW-13 |
| Organizar: título | 20, 15 | 189×30 | PW-14 |
| Organizar: barra flotante | 250, 484 | 478×60 (Cancelar 91×36, Listo 66×36) | PW-14 |
| Organizar: píldoras | colisión 324,8 (tarjeta 282×37); sin conexión 335,12; widget eliminado 305,12; más reciente 188,12 | 242×42 · 423×42 · 484×42 · 717×42 | PW-14 |
| Windi superpuesto | 737, 4 | 351×551 | PW-15 |

**Alturas de modal por estado:** M-nn 160 (sin variante de error); Renombrar 173 sin error y 173 + alto del mensaje con error (PROPUESTA, A7); selector de widget 31 por opción; Windi 551 en todos los estados; Agregar Clima con error: las filas bajan 34.

**Nota de posición de avisos:** las huellas ponen los avisos de Organizar en y=8-12; D7 los fija en y=4 (Incoherencia 11).

---

## Incoherencias resueltas

| N.º | Qué difería | Valor que manda | Por qué |
|---|---|---|---|
| 1 | Hex de los avisos del Figma (#b47700, #c68700, #c32d43, #b32d42, #00d9e2) | variables `estado_pendiente`, `estado_completada`, `error`, `informacion` | D1, P2 |
| 2 | Radio del panel lateral 10 en la huella | 12 | D5 (panel lateral 12; papel de diálogo 10) |
| 3 | Pasos del paso 3 Colores 2 px a la izquierda de los otros | la posición común de los otros tres | CONSISTENCIA (unificar) |
| 4 | Mensaje de error del campo del nombre: 180×28 | ancho del campo y alto automático | A7 |
| 5 | Altura de filas 32/36/31/30 mezcladas | A2 | CONSISTENCIA A2 |
| 6 | Radios de widgets 10,85 y 10,826 | no son tokens: Rectas 0, Base 9, Redondas 22 | R11 |
| 7 | Fuente de la vista previa distinta a la elegida | la elegida manda | T3/T4 |
| 8 | Colores de la lista (morado y cian juntos en oscuro) | `tinta` | P1 |
| 9 | Contrato `name.required` «Este campo es obligatorio.» frente al Figma «Escribe un nombre para el tema.» | G2, PROPUESTA `TEMA_NOMBRE_VACIO`; se conserva `name.duplicate` y `name.too_long` de contratos | un solo código por mensaje |
| 10 | Aviso «Mismas propiedades» dibujado con borde cian | Advertencia con `estado_pendiente` | RD-93 |
| 11 | Avisos y píldoras a y=8-12 y ancho 585 a 717 | y=4, máximo 480 y dos líneas | D7, A18 |
| 12 | Sombra de widgets sin token en el Figma | sombra dura 1,3 (PROPUESTA) | R8, P16 |
| 13 | Solape «Datos» y «Controles» en la huella | y148-184 | A13 |
| 14 | M-03 y M-15 con 424 de ancho | 512×160 | A16 |
| 15 | Píldora de Personalización más reciente de 717 de ancho | dos líneas dentro de 480 | D7, A18 |
| 16 | Opciones de selector de 31 de alto frente a filas de 36 | 36 (A2: selector 31→36); filas de lista 44, botón de fila 32, resto 36 | A2 |
| 17 | G1s `IMAGEN_ILEGIBLE` frente a `image.unreadable` | código `image.unreadable`, clave de texto `IMAGEN_ILEGIBLE` | un solo código por mensaje |
| 18 | Transparencia por defecto «100 %» | 0 % según las huellas | huellas de Configurar |
| 19 | «Deshabilitado» como opacidad 45 | variante del componente | E3 |
| 20 | «Aplicar» de HE-02/HE-03 sin cambios y con cambios | M-05 sin cambios sin guardar; M-15 con cambios sin guardar | HE-02, HE-03 |
| 21 | «Restablecer» sin confirmación (N9 propone confirmar) | sin confirmación: manda el Figma | N9 desactualizada |
| 22 | Tarjeta y píldora de colisión duplicadas | una sola píldora | E17 |
| 23 | Rubik en la lista de fuentes | sale de la lista | T13 |

Las 25 incoherencias de F4a y las 13 de F4b se heredan con el valor unificado de CONSISTENCIA; esta tabla lista solo las que tocan esta pantalla.

---

## No se construye

- **Familias «Descartado» de `79:5` (`2213:84270`):** Selector · Datos Clima, Datos Imagen estática y las demás de ese grupo.
- **Aviso de «Personalización más reciente» con más reglas:** solo el texto y el tipo de PW-04.
- **Reloj, Calendario, Tareas del día y Kanban no se agregan:** ya vienen activos, se configuran en Configurar widget.
- **Colores de la barra expandida distintos al resto:** no hay.
- **Variante de error del overlay Renombrar:** el Figma no la dibuja; se aplica la regla A7 y el patrón de PW-03 sin pantalla nueva.

---

## Decisiones ya tomadas que se citan

D1 y P2 (colores de aviso); D3 (9 colores); D4 (contraste sin bloquear); D5, D6, D7 (radios, foco, aviso); D9 y D10 (esqueleto y errores por causa); D13 (M-02 y M-04 Destructivo); G18/RD-106 (Clima, descarte solo si cambió); F4a 22 (Restablecer sin confirmación); Oscurecer 0-60 % en pasos de 15 y Desenfocar 0/2/4 px; S13 (persistencia de lo nuevo: `theme_draft_update` ampliado, un solo guardado por tema, 27-nov); S14 («Listo» en Organizar guarda el orden y sale; con cambios «Cancelar» abre M-02, 27-nov); E12, E13, E17, E19; G15 «2 de 10»; G11 «Popayán, Colombia»; P1; T13; A2, A6, A7, A11, A13, A16, A18; R1, R5, R6, R8/P16, R10, R11, R12, R13; RD-35, 58-60, 71, 86, 87, 92-95, 97, 103, 104, 106; HE-02 a HE-05; MB-02 a MB-28.

---

## Pendiente de Paula

Ninguno; resueltos por S13 y S14 el 27-nov.

## Pendientes con destino (PROPUESTA de S13 y S14)

- Ampliación de IPC-THEME-05, códigos `widget_shape.invalid`, `layout_preset.invalid`, `background_dim.invalid`, `background_blur.invalid`, `widget_opacity.invalid`, `widget_font_size.invalid`, `widget_format.invalid`, `widget_appearance.invalid`: `docs/contratos.md` y `docs/DUDAS.md`.
- Migración 0013 compartida con la densidad de SPEC_Configuracion (o 0014 si esa se implementa antes) y su equivalente en `docs/local/`: anotar en SPEC_Configuracion y DUDAS.md.
- CA derivados de S13 (HE-02) y S14 (HE-05): Paula los aprueba o rechaza.

---

## Lecturas de Figma pendientes

1. Cuadro de color del selector de Colores (203:10565): la huella solo lista las filas y el campo hexadecimal.
