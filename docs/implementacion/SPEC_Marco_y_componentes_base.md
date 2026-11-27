# SPEC · Marco de la ventana principal y componentes base

Revisado 26-nov (UTC-5): hallazgos del revisor y lecturas F0b aplicados. Primera de 8 specs; la plantilla (diez partes por pieza) se repite en las demás. Pendiente de la aprobación de Paula (solo ella aprueba las specs).

**Alcance.** Marco de la ventana principal (`apps/desktop/src/ventana_principal/*`) y componentes base (`apps/desktop/src/ui/*`). Los diálogos concretos (M-nn) van en F8 y en las specs de cada área; aquí solo el componente y la tabla M-nn → variante de botón.

**Fuentes y orden de autoridad.** Figma (`.trabajo/figma/F0.md`, `F0b.md`, `F5.md`, huellas `204-3109`, `204-622`, `204-26015`, `204-32252`, `204-32300`, `217-10646`, `217-20340`, `85-66`, `204-25989`, `2048-669`, `2251-4979`) → `docs/rediseno.md` (RD-nn) → HU y `docs/contratos.md` → `docs/rediseno_cambios_implementacion.md`. Rigen, sin contradecirlos: `CONSISTENCIA.md` (R*, C*, E*, G*, D1-D17), `TEMAS_Y_TOKENS.md` (tokens, P1-P4), `ANIMACIONES.md` (A-nn), `.trabajo/DECISIONES_PAULA_26nov.md`. No se usó el conector de Figma. Todo lo que no está en esas fuentes dice «NO MEDIDO (motivo)». Los componentes cuyo código no se leyó línea a línea dicen «NO VERIFICADO».

**Etiquetas.** MEDIDO (Figma, huella o tabla F*) · DECISIÓN (id) · PROPUESTA · NO MEDIDO (motivo). Tamaños de diferencia: S ≤ 1 h, M ≤ media jornada, L > media jornada. Los tokens que el código aún no tiene (solo existen `--wg-radio`, `--wg-borde-ancho` y `--wg-sombra`) llevan «(se crea en la pieza de temas)».

**Convenciones comunes (valen para todas las piezas).**
- Radio de control 9 (`radio_control`, se crea en la pieza de temas). Anillo de foco: **2 px `tinta`, separación 3 px, radio del control + 3** (`trazo_foco` y `radio_anillo_foco`, se crean en la pieza de temas), siempre `outline: 2px solid transparent` como respaldo y nunca `outline: none` (D6 manda; ver incoherencia 13). Hover y pulsado: A-25. Foco: A-26.
- Trazos: control 1,5 (`trazo_control`, se crea en la pieza de temas); panel de Windi 1,5; aviso 1; seleccionado 2; campo con error `error` 2.
- Sombras duras: Principal 3,5,0,0 `sombra_boton`; papel de diálogo 3,5,0,0 `borde`; Windi widget y panel 1,3,0,0 (todas se crean en la pieza de temas). Secundario y Destructivo sin sombra.
- Deshabilitado de botón: relleno `superficie`, texto `borde`, borde `borde` (el Destructivo conserva el borde `error`), **sin opacidad** (E2/E3 mandan; el Figma además mide 0,45, incoherencia 3). Deshabilitado de campo: relleno `superficie`, borde `linea`, texto `borde` (F0 `2118:831`).
- Texto sobre cian: `sobre_accion` #0B2A2E (P3).
- Tamaño base P4: Pequeño 12 / Mediano 14 / Grande 18. La fuente que la persona elige en Personalización gana sobre la del tema (Nunito claro y oscuro, Quicksand Rosa, Space Grotesk Enfoque; Rubik se elimina, T3/T4).
- Movimiento: escala de ANIMACIONES §3 (100/150/200 ms, tope 400, `--ease-salida`); con movimiento reducido, fundido de 100 ms.
- Temas: cuatro (claro `200:0`, Rosa `200:1`, Enfoque `200:2`, oscuro `233:0`). Toda prueba de color corre en los cuatro; los hex salen de `TEMAS_Y_TOKENS.md`, nunca se repiten aquí.
- Un `data-testid` por elemento medible; la tabla «Tabla de geometría» (al final) los lista con su x, y, w, h.
- Errores: cada fallo previsible tiene excepción de negocio, código estable y mensaje literal. Si el texto está en `CONSISTENCIA.md` (G1a-G1r, G2, tabla 6.1) se cita; si no, va marcado PROPUESTA (D10). Ninguno termina en el genérico.

---

## MB-01 · Ventana y disposición del marco

**1. Nodos.** Configuración `204:3109 | 233:24723 | 204:23428 | 204:23478` (marco 1093×560, relleno `fondo`; Rosa y Enfoque lo enlazan a `superficie`, F5 desvíos). Planificador diario `204:622 | 233:13970 | 204:19460 | 204:19542`. Componente F0: ninguno (es composición).

**2. Estructura.**
```
ventana-principal [marco-ventana]
├─ barra-lateral (MB-02)            [marco-barra]
└─ principal                        [marco-principal]
   ├─ encabezado (MB-03)            [marco-encabezado]
   ├─ tarjeta de la pantalla        [marco-tarjeta]
   ├─ botón de Windi (MB-05)        [windi-flotante]
   └─ panel de Windi (MB-05)        [windi-panel]
```

**3. Medidas.**

| Elemento | x,y,w,h | Padding / gap | Radio | Borde | Sombra | Fuente | Relleno |
|---|---|---|---|---|---|---|---|
| Marco (Figma) | 0,0,1093,560 MEDIDO | NO MEDIDO | 0 | no | no | tema | `fondo` MEDIDO |
| Ventana de diseño | 1280×790 (P15 de CONSISTENCIA y `F7.md:8`: los marcos de F7 miden 1280×790; las huellas de F0 a F5 parten de 1093×560, por eso la geometría de la tabla final usa 1093×560) | | | | | | |
| Barra | 0,0,176,560 (56 contraída) MEDIDO | | 0 | no | no | MB-02 | `marco` |
| Contenido | x=200 (176+24); borde derecho del indicador en 1069 = 1093−24 (MEDIDO) | 24 / 24 | | | | | `fondo` |
| Tarjeta Configuración | 200,104,842,326 MEDIDO | NO MEDIDO | 8 | 1 `linea` | no | 14 | `superficie` |
| Tarjeta en otras pantallas | NO MEDIDO aquí (cada pantalla tiene su huella en su spec) | | 8 | | | | |

Qué se estira y qué queda fijo, a 1200×800 y 960×600 (DECISIÓN D15 + PROPUESTA; regla de Paula, el menor desplazamiento posible). El mínimo de ventana es 960×600 (`DUDAS.md:228`, RT-01) y es mayor que el marco de 560 de alto, así que todo cabe:
- Fijos: la barra (176 o 56), los márgenes de 24, la miga (y=19), el título (y=49), el indicador (y=20) y el inicio de la tarjeta (y=104).
- Se estiran: el ancho y el alto de la tarjeta (el scroll va dentro de ella).
- El botón de Windi se ancla abajo a la derecha a 16 px.
- El panel de Windi se ancla arriba a 4 px y a la derecha a 5 px, con ancho fijo 351 y alto = ventana − 9 (PROPUESTA; en 560 da 551, MEDIDO).
- Regla por medida: ver la «Tabla de geometría».

**4. Textos.** No aplica (contenedor).

**5. Estados.** Barra expandida o contraída (MB-02); Windi abierto (MB-05). Sin carga, vacío ni error propios.

**6. Teclado.** Orden: barra (contraer, opciones, Cerrar sesión) → encabezado (acciones) → tarjeta → botón de Windi. Al cerrar el panel de Windi el foco vuelve al botón que lo abrió.

**7. Animaciones.** A-08 (cambio de pantalla, solo opacidad), A-09 (contenido tras la carga).

**8. Errores previsibles.** Ninguno propio; los del marco están en MB-02, MB-04, MB-06 y MB-07.

**9. Diferencia con el código.**
- `src-tauri/tauri.conf.json:17-22`: 1200×800, `maximized true`, `resizable false`; ya cumple RD-69 y D15. S.
- `marco.css:45` `--wgm-menu: 212px` → 176 (el Figma gana sobre RD-65). S.
- `marco.css:72` padding superior 16; la miga está en y=19. S.
- `marco.css:138-142` tarjeta con radio 12, sin borde, padding 24 y margen inferior 24 → radio 8 y borde 1 `linea`; padding y margen inferior NO MEDIDO. S.
- `marco.css:49,60` el fondo del marco es `--wg-marco`; el Figma pone `fondo` en el contenido y `marco` solo en la barra. M.

**10. Pruebas.** Geometría ±2 px de `marco-barra`, `marco-principal` y `marco-tarjeta` a 1200×800 y 960×600 (nueva, fase 6; Playwright, valores en la «Tabla de geometría»). `marco.test.tsx` cubre el menú contraído y el título (existente). Manual: maximizada, minimizar, zoom bloqueado (`bloquearZoom.ts`).

---

## MB-02 · Barra lateral (204:32251) y contraer/expandir

**1. Nodos.** Conjunto de componentes `204:32251`. Expandida `204:32252 · 204:32336 · 204:32420` (176×560); contraída `204:32300 · 204:32384 · 204:32468` (56×560). No hay variante oscura propia: en oscuro se usa `marco` del modo 233:0 (#201b2b) (F0 §4.5, N17).

**2. Estructura.**
```
barra [marco-barra]
├─ cabeza: logo [barra-logo] + «windgets» [barra-marca] + botón contraer [barra-contraer]
├─ bloque «PLANIFICADOR» [barra-bloque-planificador] → 6 opciones [barra-opcion-<pantalla>]
├─ bloque «PERSONALIZACIÓN» [barra-bloque-personalizacion] → Personalización, Configuración
└─ pie: «Cerrar sesión» [barra-cerrar-sesion]
```

**3. Medidas (MEDIDO, F0b y huellas `204-32252` y `204-32300`).** La barra no tiene autolayout: todo va con posición absoluta.

| Elemento | x,y,w,h (expandida) | Contraída | Radio | Fuente | Relleno |
|---|---|---|---|---|---|
| Barra | 0,0,176,560 | 0,0,56,560 | 0 | | `marco` |
| Logo | 11,15,24,24 | 3,15 | | 4 vectores con trazo fijo #00d9e2 #dc026c #dcba04 #6200d9 (marca, no token; incoherencia 11) | |
| «windgets» | 42,16,85,23 | oculto | | Rubik Medium 19 en el Figma; T3: fuente del tema, tamaño 19 | `sobre_marco` |
| Botón ocultar / ampliar | 140,9,36,36 (ícono 18×18, trazo 1,35) | «Ampliar» 26,9,30,36 | | | `sobre_marco` |
| Títulos de bloque | (14,63) y (14,335), alto 12 | (14 → sin título) NO MEDIDO | | Medium 10, mayúsculas | `sobre_marco` |
| Ítem | x=6, 164×34, ícono en (+8,+8), texto en x=39 (y+9, alto 15) | x=8, 40×34, ícono en +10 | 6 | Medium 13 | `sobre_marco` |
| Cerrar sesión | x=6,y=506,164×34 (borde inferior 540, margen 20) | 8,506,40×34 | 6 | Regular 13 | `sobre_marco` |
| Íconos | 18×18, trazo 1,35 (la spec anterior decía 1,44; no es token) | igual | | | `sobre_marco` |

Posición vertical (MEDIDO): ítems del bloque Planificador en y = 82, 121, 160, 199, 238, 277 (paso 39 = 34 + gap 5); Personalización y=356 (335 contraída); Configuración y=464; Cerrar sesión y=506.

Ítem activo (MEDIDO en 204-32252): lo pone la pantalla; relleno `detalle`, radio 8, texto e ícono `sobre_detalle`. El Figma no trae hover. Hover (PROPUESTA): `superficie_baja`, el actual del código. NO MEDIDO: hover y activo en la barra contraída, en Rosa y en Enfoque (F0b no los midió). Contraste: `sobre_detalle` claro #17131d da 2,38 y falla; TEMAS_Y_TOKENS propone #ffffff (Pendiente 2).

Estira / fijo: ancho fijo (176 o 56), alto = ventana, sin scroll (RD-65). A 960×600 el último ítem termina en 540 y cabe (el mínimo es 600).

**4. Textos.** «windgets»; «PLANIFICADOR»; «PERSONALIZACIÓN»; «Planificador diario»; «Tablero Kanban»; «Calendario»; «Agenda diaria»; «Reportes»; «Etiquetas»; «Personalización»; «Configuración»; «Cerrar sesión»; etiquetas accesibles «Ocultar menú» y «Ampliar menú» (`textosDelMarco.ts:44-46`).

**5. Estados.** Reposo; hover (PROPUESTA `superficie_baja`); foco (anillo común); activa (`aria-current=page`, `detalle`); contraída (solo íconos con nombre emergente, MB-21). Deshabilitada, error, vacío, carga: no aplica.

**6. Teclado.** Orden: contraer → opciones → Cerrar sesión. Enter y Espacio activan. El estado contraído persiste (`device_setting.menu_collapsed`, IPC-DESK-17/18, RD-65). Al contraer, el foco queda en el botón. «Cerrar sesión» abre M-11 (M-12 si hay cambios sin sincronizar); al cerrar, el foco vuelve a «Cerrar sesión».

**7. Animaciones.** A-12: contraer y expandir instantáneo, como el CHANGE_TO del Figma.

**8. Errores previsibles.**

| Situación | Código | Mensaje | Dónde |
|---|---|---|---|
| Falla al cerrar sesión | `CIERRE_SESION_FALLIDO` (G1m) | «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.» | aviso Error, sin Reintentar |
| Falla al guardar el estado contraído | `PREFERENCIA_MENU_NO_GUARDADA` (PROPUESTA, D10) | «No pudimos guardar la preferencia del menú. Intenta de nuevo.» (PROPUESTA) | aviso Advertencia de 6 s; la barra cambia igual |

**9. Diferencia con el código.**
- `marco.css:45` 212 → 176. S.
- `marco.css:155` fondo `--wg-superficie` → `marco`; textos e íconos `sobre_marco` en vez de `--wg-tinta` (`:174`, `:250`, `:276`). M.
- `marco.css:248` radio 8 → 6; `:242` alto 32 → 34 y `:251` fuente 14 → Medium 13 de la fuente del tema. M.
- `marco.css:175-176` marca 20 Bold → Medium 19; `:217` títulos 11 → 10 Medium. S.
- `marco.css:263-267` opción activa con `accion` → `detalle` con `sobre_detalle` (F0b). S.
- Logo con trazos fijos en vez de variables: se conserva (marca).
- `VentanaPrincipal.tsx:354-388` ya estructura barra + principal. Sin cambio.

**10. Pruebas.** `marco.test.tsx` (contraer y ampliar, `aria-expanded`); geometría de `marco-barra` 176/56 y de los ítems (nueva); contraste en los cuatro temas (suite de temas); `PREFERENCIA_MENU_NO_GUARDADA` muestra el aviso (nueva). Manual: persistencia tras reiniciar.

---

## MB-03 · Encabezado de pantalla y miga de pan

**1. Nodos.** En todas las pantallas; medido en Configuración (`204:3109…`), Planificador (`204:622…`) y Planificador vacío (`217:10646`). Sin componente propio en F0 (texto suelto).

**2. Estructura.**
```
encabezado [marco-encabezado]
├─ miga [encabezado-miga]  «Planificador  ›  Planificador diario»
├─ fila: título [encabezado-titulo] + acciones [encabezado-acciones]
└─ derecha: indicador (MB-04)
```

**3. Medidas.**

| Elemento | x,y,w,h | Fuente | Color |
|---|---|---|---|
| Miga | 200,19 (en Planificador 191×18) MEDIDO | Nunito Regular 13 (fuente del tema) | `texto` |
| Título | 200,49 MEDIDO | Bold 26 | `tinta` |
| Indicador | MB-04 | | |
| Acciones | NO MEDIDO (IM-08, provisional 16/4) | | |

Separador de la miga del Figma: dos espacios a cada lado de «›» (huella 204-622); el código usa `>` (MB-20). Todo fijo. Título largo: truncar con puntos suspensivos (PROPUESTA, NO MEDIDO: el Figma no trae un título largo).

**4. Textos.** Miga «Planificador › <opción>» y «Configuración» sola (A-04). Título = texto de la opción, salvo «Windi» y «Personalización del wallpaper» (RD-32). Literales en `textosDelMarco.ts:5-46`.

**5. Estados.** Reposo. No es interactivo; las acciones heredan los de su componente.

**6. Teclado.** El encabezado no se enfoca; un `h1` por pantalla. Las acciones se tabulan antes que la tarjeta. El foco no se mueve al `h1` al cambiar de pantalla (ver «No se construye»).

**7. Animaciones.** A-08 (el encabezado cambia con la pantalla). A-29: no aplica.

**8. Errores previsibles.** Ninguno propio.

**9. Diferencia con el código.**
- `marco.css:72,79` el encabezado empieza en y=16; el Figma pone la miga en y=19 y el título en y=49. S.
- `marco.css:83-94` miga 13/16 y título 26/32 Bold ya coinciden; los line-height son NO MEDIDO. S.
- `marco.css:104` gap 16/4 provisional (IM-08, `docs/DUDAS.md`); sigue provisional. S.
- `EncabezadoDePantalla.tsx:23` la miga es un `<p>`; el componente `MigaDePan` (MB-20) ya trae `<nav aria-label="Miga de pan">`. Cambiar el `<p>` por `MigaDePan` cambia el DOM y los textos de `marco.test.tsx`; no se hace salvo que una HU lo pida. S.

**10. Pruebas.** `marco.test.tsx` (textos de miga y título por pantalla, existente). Geometría de `encabezado-miga` (200,19) y `encabezado-titulo` (200,49) ±2 (nueva).

---

## MB-04 · Indicador de sincronización

**1. Nodos.** Sincronizado: dentro de `204:3109…`. Sincronizando `217:20340 | 233:24863 | 217:20380 | 217:20360`; Sin conexión `217:20400 | 233:24883 | 217:20440 | 217:20420`; Error de sincronización `217:20460 | 233:24903 | 217:20500 | 217:20480`. Íconos F0b: Sincronizado `2003:187`, Sin conexión `2251:4951`, Alerta `80:57`.

**2. Estructura.** `indicador [indicador-sincronizacion]` → ícono [indicador-icono] + texto [indicador-texto] (con «· N pendientes» en el mismo texto).

**3. Medidas (MEDIDO, huellas 217-20340, 217-20400, 217-20460 y 217-10646).**

| Estado | Texto | x,y,w,h del texto | Ícono (16×16) |
|---|---|---|---|
| Sincronizado | «Sincronizado», Regular 12, `texto` | 1000,20,69,16 | (978,20) |
| Sincronizando | «Sincronizando… · 2 pendientes» | 906,20,163,16 | el Figma no lo trae; se pone en (884,20) con giro de 1 s (E8 con el patrón de 22 px: 16 de ícono + 6 de separación; incoherencia 5) |
| Sin conexión | «Sin conexión · 2 pendientes» | 922,20 | (900,20) |
| Error | «Error de sincronización · 2 pendientes» | 869,20 | (847,20) |

Borde derecho fijo a 24 px del borde (1069); crece hacia la izquierda, texto a la derecha, ícono 6 px a la izquierda del texto. Íconos: Sincronizado y Sin conexión miden 20×20 con trazo `tinta` 1,6 y en pantallas se escalan a 16; Alerta mide 32×32 con trazo 3: se unifica a 20×20 con trazo 1,6 y se escala a 16 (incoherencia 4).

**4. Textos.** «Sincronizado», «Sincronizando… · N pendientes», «Sin conexión · N pendientes», «Error de sincronización · N pendientes». G1f: «No se pudo sincronizar. Tienes N cambios pendientes.» con Reintentar, en el aviso, no en el indicador.

**5. Estados.** Sincronizado, Sincronizando (carga, giro; con movimiento reducido, fijo), Sin conexión, Error. Hover, foco y pulsado: no aplica. Entradas por evento (E16): `sync_status_changed`.

**6. Teclado.** No enfocable. `role="status"`.

**7. Animaciones.** A-36 (giro 1 s; reducido, fijo).

**8. Errores previsibles.**

| Situación | Código | Mensaje | Dónde |
|---|---|---|---|
| Sin red | `SIN_CONEXION` (G1g) | «Estás sin conexión. Tus cambios se guardarán y se sincronizarán al reconectarte.» | aviso Información + indicador |
| Falla de sincronización | `SINCRONIZACION_FALLIDA` (G1f) | «No se pudo sincronizar. Tienes N cambios pendientes.» | aviso Error con Reintentar. **Destino:** área Sincronización (HE-15-HU01 a HU03 y HE-16-HU01, `DUDAS.md:64`, indicador P-SIN-01). Pieza: emitir el aviso G1f al llegar `sync_status_changed` con estado error. Esta spec solo define el aviso y el indicador. |
| Conflicto con otro computador | no es error | «Algunas tarjetas se actualizaron con cambios más recientes de otro computador.» | aviso Información |

**9. Diferencia con el código.**
- `IndicadorSincronizacion.tsx:10-15` el estado `error` dice «Error de sincronización. Reintentaremos automáticamente.»; el Figma dice «Error de sincronización · N pendientes» (Pendiente 4). S.
- `:79-88` los pendientes salen solo en offline y en un segundo `<span>` («N cambios pendientes de sincronizar», HE-15-HU02-ET11); el Figma los pone con «·» en Sincronizando, Sin conexión y Error. Gana el Figma. M.
- `:84-88` no hay ícono ni giro. M.
- `marco.css:119-131` fuente 12 ya coincide (RD-61 queda reemplazado); `top 0` → y=20. S.
- `marco.css:421-425` la cabecera completa del wallpaper usa 15 px (RD-42); unificar a 12 no está medido (Figma 1360×850). S.
- No se emite el aviso `SINCRONIZACION_FALLIDA` (destino arriba). M.

**10. Pruebas.** Vitest por estado (texto, ícono, `role=status`) y reducido sin giro; geometría `indicador-texto` x=1000 en Sincronizado y x=906 en Sincronizando, `indicador-icono` x=884 en Sincronizando (nueva); eventos E16 (nueva). Manual: desconectar la red.

---

## MB-05 · Windi: botón flotante y panel lateral

**1. Nodos.** Botón `2004:334` (48×48, 5 estados; en hover muestra un nombre emergente). Nombre emergente `2048:669 | 2048:783 | 2048:707 | 2048:745`. Panel (overlay) `204:26015 | 233:24789 | 204:26115 | 204:26215`; variantes Propuesta `204:26026…`, Escribiendo `204:26041…`, Sin conexión `204:26052…`, Error `204:26063…`, Descartada `204:26074…`. Pantalla Windi `204:2427 | 233:16835 | 204:22790 | 204:22801` y sus subfamilias: spec de Windi. F0: Windi · Mensaje `2045:511` (r10), Windi · Widget `2048:506` (300×291, r12).

**2. Estructura.**
```
windi-flotante [windi-flotante] → Windi 48×48 (cuerpo, ojos, boca, ondas, punto)
panel [windi-panel]
├─ velo [windi-velo]
├─ cabecera: «Windi» + cerrar [windi-cerrar]   (sin ojos en la cabecera)
└─ cuerpo: conversación, campo «Escribe un mensaje», contador, enviar
```

**3. Medidas (MEDIDO, F0b y huellas `2048-669` y `204-26015`).** Las del panel van relativas al panel (el panel está en (737,4) del marco; en la huella `2048-669` está en (4,4)).

| Elemento | x,y,w,h | Radio | Borde | Sombra | Fuente | Relleno |
|---|---|---|---|---|---|---|
| Botón flotante | 1029,496,48,48 (16 a la derecha y abajo en 1093×560); marco de clic | 14 | no | no | | Windi con colores fijos (D2/C7): cuerpo Amarillo #ffca22 en (1,14) con trazo `borde` 1,5 |
| Panel | 737,4,351,551 | 12 | 1,5 `borde` | 1,3,0,0 `sombra` | | `superficie_alta` (C12/C16) |
| Velo | cubre el marco 1093×560 | 0 | no | no | | `velo` |
| Título «Windi» | (16,16.5) 49×23 | | | | Nunito Bold 17, fuente del tema | `tinta` |
| Cerrar | (303,10) 36×36 | 9 | | | | Botón ícono |
| Windi completo (vacío) | (79,150) 192,9×120 | | | | | colores fijos |
| Mensaje de Windi | (94,286) 164×38, padding 9/12 | 10 | 1 `borde` | no | | `superficie` |
| Mensaje de la persona | (F0, F3) | 10 | | | | `burbuja_propia` |
| Campo | (16,470) 275×36, padding 0/12 | 9 | 1,5 `borde_campo` | | Regular 14 | `superficie` |
| Enviar | (299,470) 36×36 | 9 | | | | Botón ícono |
| Contador «0 / 2000» | (245,514) 46×16 | | | | Regular 12 | `texto` |

Windi 48×48 (colores fijos, D2/C7; no son tokens; C14 trata de textos ocultos duplicados y no de Windi): cuerpo #ffca22; ojos y boca #27152b; ondas y punto de propuesta #6604e6; ondas grandes #806dac. Medidas internas: ojos en (14,23.5) 18,5×4,5; boca en (20,29); punto de propuesta 8×8 en (37,5). Estados (MEDIDO en F0b): hover añade Onda 1 y Onda 2 (trazo #6604e6) y el nombre emergente «Windi»; propuesta pendiente añade el punto; escribiendo desplaza los ojos 2 px a la derecha; sin conexión y error cierran los ojos (línea), boca recta y ondas.

Estira / fijo: panel de ancho 351 fijo; botón anclado a la esquina inferior derecha; la tarjeta no se mueve (el panel va encima).

**4. Textos.** «Windi» (título y nombre emergente); «Cerrar» (nombre de la X); «Escribe un mensaje»; «0 / 2000»; «¿Qué organizamos hoy?»; «Escribiendo…»; «Sin conexión» (cuerpo largo en F3 `204:2698`; el de F5 es corto, incoherencia 10 de F5); «Propuesta descartada»; «¿Muevo la tarjeta a Por hacer?»; «Confirmar»; «Rechazar». «Ocurrió un error inesperado.» es genérico y se reemplaza por G1a.

**5. Estados.** Botón: reposo, hover (ondas y nombre emergente), foco, pulsado, abierto (se oculta, `PanelDeWindi.tsx:55`). Panel: vacío («¿Qué organizamos hoy?»), escribiendo, propuesta pendiente, descartada, sin conexión (campo y enviar deshabilitados; E2/E3, sin opacidad), error. El panel es **modal**: la huella `204-26015` trae el «Velo» (`velo`, 1093×560) bajo el panel, y el fondo queda `inert`.

**6. Teclado.** Enter o Espacio abren el panel. Foco inicial en el campo (PROPUESTA). Foco atrapado dentro del panel; Esc cierra salvo que haya un diálogo (`PanelDeWindi.tsx:40-47`); «×» cierra; clic en el velo no cierra (PROPUESTA, para no perder el mensaje escrito); al cerrar, el foco vuelve al botón.

**7. Animaciones.** A-10 y A-11 (panel), A-22 (ojos), A-23 (botón), A-24 (mensaje), A-37 (sin conexión), A-30 (nombre emergente).

**8. Errores previsibles.** Todos con código estable (CONSISTENCIA 6.1, G1a-G1e) y fuera del genérico:

| Situación | Código | Mensaje literal | Dónde |
|---|---|---|---|
| Error interno de Windi | `WINDI_ERROR_INTERNO` (G1a) | «Windi tuvo un problema. Tus tarjetas no cambiaron. Intenta de nuevo.» | burbuja de error, con Reintentar |
| Sin respuesta | `WINDI_SIN_RESPUESTA` (G1b) | «No pude responder en este momento. Intenta de nuevo.» | burbuja, con Reintentar |
| Sin conexión | `WINDI_SIN_CONEXION` (G1c) | «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» (F3 `204:2698`) | panel, sin Reintentar |
| Conexión perdida | `WINDI_CONEXION_PERDIDA` (G1d) | «Se perdió la conexión. No se hizo ningún cambio.» | burbuja, con Reintentar |
| Mensaje de más de 2000 | `WINDI_MENSAJE_MUY_LARGO` (G1e) | «Tu mensaje no puede superar los 2000 caracteres.» | bajo el campo; contador en `error` con ícono 16 (E19) |
| Organizar widgets | `ORGANIZAR_WIDGETS_FALLIDO` (G1q) | el de CONSISTENCIA G1q | aviso Error |

**9. Diferencia con el código.**
- `marco.css:507-523` botón de 40 px → 48×48 con el dibujo de Windi (colores fijos). M.
- `marco.css:533-549` panel de 360 de ancho y 100vh, solo borde izquierdo → 351×(alto−9), margen 4 y 5, radio 12, borde 1,5 `borde`, sombra 1,3. M.
- `PanelDeWindi.tsx:62` usa `hidden`: la salida no se anima (A-11). M.
- `marco.css:565-569` título 13 Bold → Bold 17 de la fuente del tema. S.
- `marco.css:571-583` el cerrar es un «×» de texto de 32×32; pasar a `Boton` ícono 36×36 con `IconoCerrar` (RD-101). S.
- Falta el velo y el `inert` del fondo (el panel es modal). M.
- `PanelDeWindi.tsx:57` ojos de 28 en la cabecera: el Figma no los trae (se quitan; los ojos viven solo en el botón y en el Windi grande, MB-27). S.

**10. Pruebas.** `PanelDeWindi` (abrir, Esc, X, foco de retorno: existente en parte); geometría del botón (1029,496) y del panel (737,4,351×551) en 1093×560 (nueva); velo e `inert` presentes; cada código G1a-G1e con su mensaje literal; A-10 y A-11 con movimiento reducido (P-Axx). Manual: escribiendo y hover.

---

## MB-06 · Área de avisos (AreaDeNotificacion) y los cuatro avisos

**1. Nodos.** Familias `217:17700 | 233:13948 | 217:17734 | 217:17768` (mensajes emergentes) y `217:17727 | 233:13955 | 217:17761 | 217:17795` (aviso). Avisos del componente: Éxito `217:17624`, Información `217:17638`, Advertencia `217:17652`, Error `217:17666`. Variantes: Éxito En pausa `217:17631`, Oculto `217:17637`; Información `217:17645`, `217:17651`; Error `217:17673`, `217:17679`. Instancias de F5: `2251:4979`, `2251:5080`, `2251:5185`, `2251:5290`, `2251:5396`, `2251:5490` (y sus tres temas hermanos).

**2. Estructura.**
```
area-avisos [area-avisos] (aria-live)
└─ aviso [aviso-<tipo>]
   ├─ ícono 16 [aviso-icono]
   ├─ título (Medium 15) + cuerpo (Regular 13) [aviso-texto]
   └─ cerrar «×» (Regular 17) [aviso-cerrar]
```

**3. Medidas (MEDIDO, F0 §4.6, F0b y F5).**

| Elemento | x,y,w,h | Padding / gap | Radio | Borde | Fuente | Relleno |
|---|---|---|---|---|---|---|
| Aviso | 320×42 (Advertencia 365×42; Éxito 245-247, Error 430-488, Información 560-561 según el texto) | 5/3/5/12, gap 6 | 21 (interior 4, tarjeta 8) | 1 con la variable de estado | título Medium 15, cuerpo Regular 13; fuente del tema (T3/T4) | `superficie_alta` |
| Franja izquierda | 4×42 | | | | | variable de estado (hoy color fijo; C1/D1) |
| Ícono de tipo | (13,13) 16×16 | | | | | variable de estado |
| Mensaje | (35,13.5) 249×15 | | | | Regular 13 | `tinta` |
| Cerrar «×» | 26×30 en (290,6), borde derecho a 4 px del aviso de 320; glifo de texto Regular 17 `tinta`, caja 10×20 en (296,9) | | 4 | foco 2 `tinta` | | |
| Oculto | 320×40 | | 5 | | | |
| Información | borde interior extra 1,5 | | | | | |
| «En pausa» | idéntico a Visible: solo detiene el temporizador (incoherencia 8) | | | | | |

Colores (C1/C2, D1/P2): borde e ícono con `estado_completada` (Éxito), `estado_pendiente` (Advertencia), `error` (Error), `informacion` (Información); título siempre `texto`. Ancho: al texto hasta un máximo; D7 (PROPUESTA) `min(480, 966 − fin de la miga − 16)`, 42 de alto, sin avisos de tres líneas.

Duplicados del Figma que se unifican (incoherencia 7): el aviso dibuja a la vez un ícono Cerrar 16×16 en (295,13) y el «×» de texto; se deja **un solo «×» de texto** (A-05c). Dibuja a la vez el ícono de tipo y un glifo de texto «✓ / i / ×» superpuesto; se deja **solo el ícono** con la variable de estado.

Posición. **CONFLICTO, decide Paula (Pendiente 1):** D7 propone el aviso en la franja superior (y=4, borde derecho en x=966, para no tapar el indicador), sin empujar contenido, uno visible a la vez (un Error se queda y el siguiente baja a y=50). La huella F5 `2251:4979` dibuja un aviso de 247×42 en (822,4) con borde derecho en 1069: queda **encima del indicador** (906-1069 en Sincronizando) y contradice D7 (x=966). RD-63 y RD-104 mantienen la cola abajo a la derecha, con máximo 3, y siguen vigentes hasta que se decida (fase 5). ANIMACIONES §8 lo recoge.

**4. Textos (F5 y G1).** «Inicio automático desactivado.»; «No pudimos cambiar el inicio automático. Intenta de nuevo.»; «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.»; «Estás sin conexión. Tus cambios se guardarán y se sincronizarán al reconectarte.»; «Tus cambios se sincronizaron.»; «Algunas tarjetas se actualizaron con cambios más recientes de otro computador.»; el del wallpaper, en MB-07.

**5. Estados.** Visible; En pausa (hover o foco); Oculto (fundido); Error hasta cerrar. Carga y offline: no aplica.

**6. Teclado.** Un aviso nuevo no roba el foco (G5). Se pausa con hover y con foco. «×» tabulable; Esc cierra el aviso enfocado. Al cerrar, el foco no se mueve. `role="status"` (Éxito, Información, Advertencia) y `role="alert"` (Error) (`MensajeResultado.tsx:86`).

**7. Animaciones.** A-05 (entrada del aviso), A-05c (hover y foco de la «×»), A-06 (salida), A-06b (reacomodo de la pila), A-07 (pausa). A-05b es el hover de la opción de menú y no se usa aquí. Fundido DISSOLVE 0,15 s EASE_OUT. Duraciones (G5, RD-104): Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrar (el Figma da 6 s al Error; gana RD-104). El Figma no tiene salida del estado En pausa: PROPUESTA, al salir el cursor se reanuda el tiempo restante (hoy lo hace `MensajeResultado.tsx:73-77`).

**8. Errores previsibles.** Es el lugar donde se muestran los errores de MB-02, MB-04, MB-07 y `INICIO_AUTOMATICO_FALLIDO` (G1l). Un fallo al mostrar un aviso no es previsible y no tiene aviso propio.

**9. Diferencia con el código.**
- `MensajeResultado.tsx:17-28` duraciones 4/4/6 coinciden; Error con `null` (hasta cerrar). Sin cambio.
- `MensajeResultado.tsx:19,135` `MAXIMO_VISIBLES = 3` y cola abajo a la derecha: conflicto D7. L si gana D7.
- Radio 21, alto 42, ícono 16, `superficie_alta`, borde con la variable de estado (D1): `tokens.css:435-440` solo define la caja `.wg-aviso` fija (`--wg-borde-ancho`, `--wg-radio`); la píldora no se leyó en el CSS → NO VERIFICADO. M.
- Título en `texto` y fuente del tema: NO VERIFICADO. S.
- `MensajeResultado.tsx` y `VentanaEmergente.tsx` están modificados sin commit en la rama; esta spec no los toca.

**10. Pruebas.** `AreaDeNotificacion.test.tsx` y `MensajeResultado.test.tsx` (duraciones, pausa, roles, cola; existentes). Nuevas: color por tipo en los cuatro temas, geometría 42 y radio 21, un solo «×» y un solo ícono de tipo, movimiento reducido (P-A05).

---

## MB-07 · Fondo (imagen de fondo) y aviso del wallpaper

**1. Nodos.** `Imagen de fondo` `213:9342` (Windgets), `213:9355` (Enfoque), `213:9367` (Rosa); 552×310.

**2. Estructura.** Imagen sin variables; el aviso del wallpaper es un `MensajeResultado` de advertencia, sin nodo propio.

**3. Medidas.** Imagen 552×310 MEDIDO (es una muestra, no un recurso de la app); ajuste al fondo NO MEDIDO (F0b no lo midió). Aviso: MB-06 (Advertencia 365×42).

**4. Textos.** `textos.NO_SE_PUDO_MOSTRAR_EL_WALLPAPER` (`messages.es.json`; el texto exacto no se leyó aquí, la fuente es G1o). Fuente del tema 13 (T11).

**5. Estados.** Aviso Advertencia de 6 s (RD-64), una vez cada vez que el estado pasa a `fallback_default`.

**6. Teclado.** Como MB-06. **7. Animaciones.** A-05 (entrada), A-05c (×), A-06 (salida), como MB-06.

**8. Errores previsibles.** `WALLPAPER_NO_SE_MUESTRA` (G1o) → mensaje de `textos` → aviso Advertencia, sin Reintentar.

**9. Diferencia con el código.** `AvisoDelWallpaper.tsx:15-20` cumple RD-64; falta comprobar que el texto coincida con G1o. Sin cambio previsto. S.

**10. Pruebas.** «Una vez por transición» (nueva si no existe).

---

## MB-08 · Saludo (D11)

**1. Nodos.** Planificador diario `204:622…` (huella 204-622) y vacío `217:10646`. El saludo junto a la nota en cuenta (`66:162`, `66:246`) es de F1, no de esta spec.

**2. Estructura.** `saludo [planificador-saludo]` con título [saludo-titulo] y fecha [saludo-fecha]; va dentro de la pantalla, no del encabezado.

**3. Medidas (MEDIDO, huellas 204-622 y 217-10646).** «Hola, Paula» en (201,104) 102×26, Bold 19, `tinta`. Fecha en (201,131) 146×18, Regular 13, `texto`. Contador de tarjetas en (201,162).

**4. Textos.** «Hola, <alias>» sin emoji, con alias (G9). Fecha larga en español, en hora colombiana; el formato exacto lo da la spec del Planificador.

**5. Estados.** Con alias; sin alias («Hola», PROPUESTA, Pendiente 5); carga con esqueleto (A-32).

**6. Teclado.** No enfocable. **7. Animaciones.** A-09.

**8. Errores previsibles.**

| Situación | Código | Mensaje | Dónde |
|---|---|---|---|
| Perfil no disponible | `PERFIL_NO_DISPONIBLE` (PROPUESTA, D10) | «No pudimos cargar tu perfil. Mostramos el saludo sin tu nombre.» (PROPUESTA) | aviso Información, una vez por sesión; el saludo queda en «Hola» |

**9. Diferencia con el código.** El saludo vive en el Planificador; NO VERIFICADO aquí. S.

**10. Pruebas.** Geometría (201,104) ±2 (en la spec del Planificador); sin alias muestra «Hola» y el aviso una sola vez.

---

## MB-09 · Mapa de navegación (217:22603)

**1. Nodos.** `217:22603`, 1093×797 (F0 §3).

**2-3. Estructura y medidas.** Es un marco de documentación del Figma, no una pantalla ni un componente. NO MEDIDO (no hay huella ni tabla de sus hijos; solo el tamaño).

**4. Textos.** NO MEDIDO. **5-7.** No aplica. **8.** No aplica.

**9. Diferencia con el código.** Ninguna; la navegación sigue las HU y no las URL de «Windgets--Copy-» (P1). S.

**10. Pruebas.** No aplica. Manual: cada opción de la barra abre la pantalla de su HU.

---

## MB-10 · Boton (`ui/Boton/Boton.tsx`)

**1. Nodos.** F0 `2005:373` (Botón; Normal 74×36, Fila 74×32), `2005:386` (ícono 36 o 32). Ejemplo: «Cerrar sesión» 119×36 en `204:3109`.

**2. Estructura.** `button.wg-boton` → [ícono 20] + texto. `data-testid`: `boton-<accion>`.

**3. Medidas (MEDIDO, F0 §4.1 y F0b §2).**

| Variante | Tamaño | Padding / gap | Radio | Borde | Sombra | Fuente | Relleno / texto |
|---|---|---|---|---|---|---|---|
| Secundario (Normal) | h 36, mín 74 | 0/16/0/16, gap 8 | 9 | 1,5 `borde` | no | Nunito Medium 14 | `superficie` / `tinta` |
| Fila | h 32 | ídem | 9 | ídem | no | ídem | ídem |
| Principal | h 36 | ídem | 9 | 1,5 `borde` | 3,5,0,0 `sombra_boton` | ídem | `accion` / `sobre_accion` (#0B2A2E, P3) |
| Destructivo | h 36 | ídem | 9 | 1,5 `error` | no | ídem | `superficie` / texto `error` |
| Ícono | 36×36 o 32×32 | 0 | 9 | no | no | ícono 20 | hover `superficie_baja` |
| Deshabilitado | | | | 1,5 `borde` | no | | `superficie` / texto `borde`; Principal sin sombra |

Hover (MEDIDO, F0b): Secundario, Destructivo e ícono pasan a `superficie_baja`. **El Principal no cambia de relleno**: se le superpone una «Capa de puntero» `tinta` con opacidad 0,14 del tamaño del botón y radio 9 (token `capa_puntero`, se crea en la pieza de temas; incoherencia 2). Pulsado: la sombra del Principal vuelve a 0 (E1, PROPUESTA). Alto fijo; ancho por contenido.

Foco (D6 manda; F0b §2 lo mide distinto, incoherencia 13): anillo de 2 px `tinta`, separación 3 px, radio 9 + 3 = 12 (`trazo_foco` y `radio_anillo_foco`, se crean en la pieza de temas). En el Figma el anillo de un botón de 74×36 es un cuadro de 82×44 en (−4,−4) con trazo interior de 2 px.

**4. Textos.** Los pone el uso.

**5. Estados.** Reposo, hover, foco, pulsado, deshabilitado, cargando (no se construye, ver «No se construye»). Error, seleccionado, vacío: no aplica.

**6. Teclado.** Tab; Enter y Espacio. Tras la acción el foco se conserva; si el botón desaparece, pasa al contenedor.

**7. Animaciones.** A-25, A-26. **8. Errores previsibles.** Ninguno propio.

**9. Diferencia con el código.**
- `tokens.css:85-98` ya trae 36/32, radio 9, borde 1,5, gap 8, padding 16, Medium: coincide.
- `tokens.css:137-143` deshabilitado coincide con F0 (`superficie`), pero `marco.css:284-291` lo pisa con `transparent` y `--wgm-deshabilitado*`: quitar el pisado (E3 y F0). S.
- `tokens.css:110-113` Destructivo cae a `--wg-estado-vencida` si falta `--wg-error`; con las 32 variables por tema el respaldo sobra. S.
- `tokens.css:148-151` foco con separación 2; D6 pide 3 y radio + 3. `marco.css:292-301` lo repite con `--wgm-seleccion-texto`: unificar. S.
- Hover del Principal: capa `tinta` al 14 %, no cambio de relleno. Pulsado (A-25) y sombra a 0 (E1) no existen. S.
- `tokens.css:330` `--peligro` pinta el Principal en rojo; D13 y G17 piden el Destructivo de F0 (Secundario con borde y texto `error`). M.

**10. Pruebas.** `Boton.test.tsx` (variantes, existente). Nuevas: geometría 36/32 y radio 9; borde y texto del Destructivo en los cuatro temas; deshabilitado sin opacidad; hover del Principal con la capa (relleno intacto); anillo 2 px con separación 3.

---

## MB-11 · CampoTexto (`ui/CampoTexto`)

**1. Nodos.** F0 `2118:831` (Campo editable): 260×36; con error 260×58. Panel de Windi `2048:669` (campo de 275×36).

**2. Estructura.** etiqueta [campo-etiqueta] → entrada [campo-entrada] → mensaje [campo-mensaje] (más contador y ayuda); ojo de contraseña (`wg-campo__con-ojo`).

**3. Medidas (MEDIDO, F0, F0b y `2048-669`).** 260×36 (con error 58); radio 9; relleno `superficie`; borde 1,5 `borde_campo`; padding 0/12/0/12, gap 8; hover borde 1,5 `tinta`; deshabilitado borde `linea`, texto `borde`; error 2 `error`; Nunito 14, mensaje 13. Ícono de error 16 y texto `error` junto al campo (E19). Foco: D6 (2 px `tinta`, separación 3, radio 12); el Figma dibuja 1 px `principal_legible` (incoherencia 13). Solo lectura: NO MEDIDO.

**4. Textos.** Los de cada pantalla; los mensajes de error, literales del CA. Contador «N / máx» cuando aplique.

**5. Estados.** Reposo, hover, foco (anillo común), deshabilitado, error (`aria-invalid`, mensaje bajo el campo), vacío con marcador en `texto`, lleno. Solo lectura: NO MEDIDO.

**6. Teclado.** Tab; Enter envía el formulario. Con errores, el foco va al primer campo inválido y se devuelven todos a la vez.

**7. Animaciones.** A-27.

**8. Errores previsibles.** Familia por campo, con código estable `<CAMPO>_OBLIGATORIO`, `<CAMPO>_MUY_LARGO`, `<CAMPO>_INVALIDO` (patrón de G1r y G2: `CORREO_GOOGLE_MUY_LARGO`, `TEMA_NOMBRE_VACIO`). El mensaje es el literal del CA de cada formulario; si el CA no lo define, PROPUESTA (D10):

| Caso | Código | Mensaje |
|---|---|---|
| Obligatorio | `<CAMPO>_OBLIGATORIO` | «Este campo es obligatorio.» (PROPUESTA) |
| Largo máximo | `<CAMPO>_MUY_LARGO` | el de G2: «Escribe de 1 a 40 caracteres.» (el número sale de la columna) |
| Formato | `<CAMPO>_INVALIDO` | el del CA; si falta, «El valor no tiene un formato válido.» (PROPUESTA) |

Se devuelven todos a la vez, uno por campo, bajo el campo con el ícono de 16 (E19). Ninguno va al genérico.

**9. Diferencia con el código.** `tokens.css:152-157` el foco del campo usa `--wg-accion` y separación `unidad/2`: pasar a 2 px `tinta`, separación 3, radio 12 (D6). `tokens.css:201-216` (borde, hover, error) NO VERIFICADO. M.

**10. Pruebas.** Vitest por estado; geometría 260×36 y 58; un error de forma por campo con su código y literal; hover con borde `tinta`.

---

## MB-12 · Casilla (`ui/Casilla`)

**1. Nodos.** F0 `2152:28882` (sin marcar) y `2152:28883` (marcada).
**2. Estructura.** `input` + etiqueta [casilla].
**3. Medidas (MEDIDO).** 18×18, radio 4, borde 1,5 `borde_campo`; marcada con relleno `seleccion` y borde `seleccion` (F0 `2152:28883`). Marca interior (vector) y texto contiguo NO MEDIDO.
**4. Textos.** Los del uso.
**5. Estados.** Reposo, hover (NO MEDIDO: F0b no lo midió), foco (D6), marcada, deshabilitada (E2).
**6. Teclado.** Espacio alterna.
**7. Animaciones.** A-28.
**8. Errores previsibles.** Ninguno propio.
**9. Diferencia con el código.** `Casilla.tsx` usa `<input type="checkbox">` nativo: para 18×18, radio 4, borde 1,5 y el anillo D6 necesita `appearance: none` y la marca propia. S.
**10. Pruebas.** Vitest de alternar; geometría 18×18 y borde `seleccion` al marcar (nueva).

---

## MB-13 · Interruptor (`ui/Interruptor`)

**1. Nodos.** F0 `2052:545`; en Configuración, (978,237) 44×24 (huella 204-3109).
**2. Estructura.** `button[role=switch]` + perilla [interruptor].
**3. Medidas (MEDIDO, F0 y F0b).** 44×24, radio 8. Apagado: relleno `superficie`, borde 1,5 `borde_campo`, perilla 16×16 radio 5 `borde_campo` en (4,4). Encendido: relleno `principal_legible`, perilla `perilla` en (24,4). Foco: D6 (2 px `tinta`, separación 3, radio 8 + 3 = 11); el Figma dibuja 1 px `principal_legible` con radio 8→11 (incoherencia 13). Hover apagado: `superficie_baja` (F0; F0b no lo remidió); hover encendido y pulsado NO MEDIDO.
**4. Textos.** «Inicio automático» y «Abrir Windgets al iniciar Windows» (del uso).
**5. Estados.** Encendido, apagado, hover apagado, foco (D6), deshabilitado. Pulsado: NO MEDIDO.
**6. Teclado.** Espacio y Enter.
**7. Animaciones.** A-28.
**8. Errores previsibles.** `INICIO_AUTOMATICO_FALLIDO` (G1l): el interruptor vuelve a su estado y sale el aviso «No pudimos cambiar el inicio automático. Intenta de nuevo.»
**9. Diferencia con el código.** `marco.css:302-324` define 48×25, radio 12, perilla 19; `tokens.css:234-262` define 66×36: ninguno es 44×24. Dejar una sola regla con 44×24, radio 8 y perilla 16×16 radio 5; el encendido usa `--wgm-interruptor` y debe ser `principal_legible`. M.
**10. Pruebas.** Geometría 44×24 y perilla 16; `aria-checked`; reversión ante el fallo con su aviso (nueva).

---

## MB-14 · Segmentado (`ui/Segmentado`)

**1. Nodos.** F0 `2005:397` (146×36); en Configuración 184×36 (Rosa 193).
**2. Estructura.** grupo [segmentado] + opciones [segmentado-opcion-<valor>].
**3. Medidas (MEDIDO).** Radio 9, borde 1,5 `borde`; seleccionado, texto `sobre_seleccion` (en claro el Figma usa #ffffff fijo: se reemplaza por el token) y relleno `seleccion`. Ancho por contenido.
**4. Textos.** «Compacta» y «Cómoda» (del uso).
**5. Estados.** Reposo, hover (NO MEDIDO: F0b no lo midió), foco (D6), seleccionada (`aria-pressed`), deshabilitada, error (`aria-invalid`).
**6. Teclado.** Tab entra; flechas cambian; Espacio elige.
**7. Animaciones.** A-25.
**8. Errores previsibles.** Valor no válido: no ocurre (opciones cerradas).
**9. Diferencia con el código.** `tokens.css:1417-1462` implementa el componente; NO VERIFICADO el detalle. S.
**10. Pruebas.** `Segmentado.test.tsx` (existente); geometría de alto 36.

---

## MB-15 · Selector (`ui/Selector`)

**1. Nodos.** F0 no trae un campo desplegable propio. NO MEDIDO (no hay variante medida).
**2. Estructura.** `Selector.tsx:53` es un `<select>` nativo.
**3. Medidas.** NO MEDIDO. Por consistencia: 260×36, radio 9, borde 1,5 `borde_campo` (PROPUESTA).
**4. Textos.** Los del uso.
**5. Estados.** Como CampoTexto.
**6. Teclado.** Nativo.
**7. Animaciones.** No aplica con el `<select>` nativo.
**8. Errores previsibles.** Como CampoTexto (`<CAMPO>_OBLIGATORIO` si no hay valor).
**9. Diferencia con el código.** Se conserva el `<select>` nativo; la lista propia no se construye (ver «No se construye»). S (solo forma del campo).
**10. Pruebas.** Vitest de cambio de valor.

---

## MB-16 · SelectorFecha (`ui/SelectorFecha`)

**1. Nodos.** F0 no mide un calendario desplegable; el Calendario de pantalla es `204:805 | 233:14097 | 204:19826 | 204:19937`.
**2. Estructura.** campo [selector-fecha] + flotante [selector-fecha-flotante] (`tokens.css:1464-1499`, react-day-picker).
**3. Medidas.** NO MEDIDO (sin huella del selector).
**4. Textos.** Meses y días en español; zona UTC-5.
**5. Estados.** Reposo, abierto, foco, deshabilitado, error de campo.
**6. Teclado.** Enter abre; flechas navegan; Esc cierra y devuelve el foco al botón; al elegir una fecha también.
**7. Animaciones.** A-20 y A-21.
**8. Errores previsibles.** Fecha obligatoria y fecha inválida: `<CAMPO>_OBLIGATORIO` y `<CAMPO>_INVALIDO` (MB-11). Fuera de rango: ver defecto 3.

**9. Diferencia con el código.** `SelectorFecha.tsx` (97 líneas). Tres defectos, cada uno con su prueba:
1. **Borrar la fecha con el clic doble.** Con `mode="single"` (línea 56) y `onSelect → alCambiar(fecha)` (líneas 61-62), volver a pulsar el día elegido entrega `undefined` y borra la fecha. Arreglo: `required` (o ignorar `undefined`). S. Prueba: pulsar dos veces el mismo día deja la fecha.
2. **Foco.** Esc (línea 41) y elegir una fecha no devuelven el foco al botón del campo. S. Prueba: tras Esc y tras elegir, `document.activeElement` es el botón.
3. **Rango limitado.** No hay `startMonth` ni `endMonth`. El límite solo se construye si una HU o ET lo define (por ejemplo, `DUDAS.md:356`, P42: año de 1970 a 2100 en el Calendario); si no, no se construye. Si lo define, el código es `FECHA_FUERA_DE_RANGO` con el mensaje «Elige una fecha entre <mínima> y <máxima>.» (PROPUESTA) y su destino es la spec de esa pantalla. S. Prueba condicional: solo si existe el límite, una fecha fuera muestra el mensaje bajo el campo.

**10. Pruebas.** Las tres de arriba, más la selección básica (existente).

---

## MB-17 · NavegacionDeFecha (`ui/NavegacionDeFecha`)

**1. Nodos.** Nombres emergentes `2155:31312` (Mes anterior), `2155:31491` (Mes siguiente), `2155:31722` (Semana anterior), `2155:31891` (Semana siguiente) y sus tres temas.
**2. Estructura.** [nav-fecha-anterior], [nav-fecha-titulo], [nav-fecha-siguiente].
**3. Medidas.** Botones de ícono 36×36 o 32×32 (F0 `2005:386`); posición NO MEDIDO (spec del Calendario).
**4. Textos.** «Mes anterior», «Mes siguiente», «Semana anterior», «Semana siguiente».
**5. Estados.** Como Boton ícono; deshabilitado en el límite.
**6. Teclado.** Tab y Enter; el foco no se mueve al cambiar de periodo.
**7. Animaciones.** A-20 y A-21.
**8. Errores previsibles.** Límite de rango: botón deshabilitado, sin mensaje (no es un error, es un límite del control).
**9. Diferencia con el código.** `NavegacionDeFecha.tsx` ya usa `NombreEmergente` (línea 2). Comprobar que los textos coincidan con los de arriba. S.
**10. Pruebas.** Vitest y nombres emergentes.

---

## MB-18 · MenuDeAcciones (`ui/MenuDeAcciones`)

**1. Nodos.** F0 no mide el menú «⋮».
**2. Estructura.** botón [menu-acciones-boton] + lista fija [menu-acciones-lista] + opciones [menu-acciones-<id>].
**3. Medidas.** NO MEDIDO. El código usa `min-width: unidad*40` y `padding: unidad` (`tokens.css:782`, `.wg-menu-acciones__lista`).
**4. Textos.** Los del uso; la opción actual va marcada y deshabilitada (RT-04).
**5. Estados.** Cerrado, abierto; opción en hover (A-05b), foco, deshabilitada.
**6. Teclado.** Enter abre; flechas navegan; Esc cierra y el foco vuelve al botón; Tab cierra.
**7. Animaciones.** A-03 (abrir) y A-04 (cerrar); hover de la opción A-05b.
**8. Errores previsibles.** La acción que falla muestra su error propio en un aviso; el menú no tiene código.
**9. Diferencia con el código.** `MenuDeAcciones.tsx` (216 líneas) cubre RT-02; faltan A-03 y A-04 y las medidas del Figma (NO MEDIDO). M.
**10. Pruebas.** Teclado y foco (existente); animación (nueva).

---

## MB-19 · MenuPrincipal (`ui/MenuPrincipal`)

Es la lista de opciones de la barra (MB-02): `OPCIONES_MENU` en `MenuPrincipal.tsx` (100 líneas) e `IconosDelMenu.tsx` (46). Medidas, estados, teclado y diferencias: MB-02. Íconos 18×18, trazo 1,35 (F0b). Prueba: `marco.test.tsx`.

---

## MB-20 · MigaDePan (`ui/MigaDePan`)

**1. Nodos.** El Figma solo muestra la miga de texto del encabezado (MB-03); no hay componente de enlaces (RT-03: miga y «Regresar» en subpantallas).
**2. Estructura.** `nav[aria-label="Miga de pan"]` → `ol.wg-miga` → `li` → `button.wg-miga__nivel` [miga-nivel].
**3. Medidas.** NO MEDIDO como enlaces. Hoy: 13, `texto`; nivel en `tinta` subrayado. Separador: el código usa `>` (`MigaDePan.tsx:15`); el Figma, «  ›  » (MB-03).
**4. Textos.** Los niveles de la ruta.
**5. Estados.** Reposo, hover (A-29), foco, actual (sin enlace).
**6. Teclado.** Tab entre niveles; Enter navega.
**7. Animaciones.** A-29.
**8. Errores previsibles.** No aplica.
**9. Diferencia con el código.** `MigaDePan.tsx` ya tiene `<nav aria-label="Miga de pan">` (línea 17) y `aria-current='page'` en el `li` del nivel actual (línea 22). Falta: foco con `--wg-accion` y separación `unidad/2` → D6 (`tokens.css:445-466`), y el separador `›` si una pantalla adopta este componente. S.
**10. Pruebas.** Navegación y `aria-current` (nueva).

---

## MB-21 · NombreEmergente (`ui/NombreEmergente`)

**1. Nodos.** F0 `2003:267` (99×36: globo 99×30, flecha 12×6). Instancias: `2039:14528 | 2039:14605 | 2039:14682 | 2039:14759` (Planificador), `2048:669…` (Windi), y las de Kanban, Calendario, Agenda, Etiquetas y Reportes (ids_prototipos).

**2. Estructura.** `div.wg-nombre-emergente[data-lado]` [nombre-emergente].

**3. Medidas (MEDIDO).** Globo alto 30, radio 6, padding 6/10, relleno `tinta`, texto `fondo` Medium 13; flecha 12×6; con dos líneas, alto 54 (A6: 36 o 54). RD-100 dice texto `marco` y flecha de 6: gana el Figma. Separación de 8 px del botón (RD-100; NO MEDIDO en el Figma). Debajo del botón, o arriba si no cabe.

**4. Textos.** El nombre del control («Windi», «Cerrar», «Mes anterior»…).

**5. Estados.** Oculto, visible.

**6. Teclado.** Aparece al instante con el foco y a los 400 ms con el puntero; se cierra con Esc y al perder el foco; no recibe foco.

**7. Animaciones.** A-30. **8. Errores previsibles.** No aplica.

**9. Diferencia con el código.** `tokens.css:742-771`: texto `--wg-marco` → `fondo`; la flecha de 6 px de borde ya da 12×6, coincide; `NombreEmergente.tsx:12,150` retardo y posición coinciden con RD-100. S.

**10. Pruebas.** Retardo 400/0 (existente); geometría ±2 (nueva).

---

## MB-22 · VentanaEmergente (`ui/VentanaEmergente`)

**1. Nodos.** M-11 `204:25989 · 233:24763 · 204:26089 · 204:26189` (F5; en ids_prototipos `204:25598 · 233:15171 · 204:25750 · 204:25902`); M-12 `204:26002 · 233:24776 · 204:26102 · 204:26202`; M-06 `85:66`; M-02 `204:25071…`; M-04 `204:25084…`; M-08 a M-14 en ids_prototipos (líneas 87-99); el resto, en F8. El papel se mide en `85-66` y `204-25989`; no tiene nodo propio de componente.

**2. Estructura.**
```
fondo [emergente-fondo] (velo)
└─ ventana role=dialog [emergente]
   ├─ cabecera: título (h2) + «×» [emergente-cerrar]
   ├─ cuerpo [emergente-cuerpo]
   └─ acciones [emergente-acciones]
```

**3. Medidas (MEDIDO, huellas `85-66` y `204-25989`).** Papel 424×160 en (88,48) dentro del marco de 600×256; relleno `superficie_alta` (C12/C16); trazo `borde` 1,5; sombra 3,5,0,0 `borde` (`sombra_papel_dialogo`, `trazo_papel_dialogo`; se crean en la pieza de temas); esquinas de radio 10 con pliegue de 22 arriba a la derecha (`radio_papel_dialogo`, `pliegue_papel_dialogo`; D5); velo `velo` al 40 %.

| Elemento | x,y (marco 600×256) | w,h | Fuente |
|---|---|---|---|
| Título | (108,66) | 129×27 (M-06) | Nunito Bold 20, `tinta` |
| Cuerpo | (108,100) | 382×38 | Regular 14, `tinta` |
| «×» | (460,58) | 32×32 | Botón ícono |
| Cancelar (Secundario) | M-11 (274,158); M-06 (270,158) | 91×36 | Medium 14 |
| Botón de la acción | M-11 «Cerrar sesión» (373,158); M-06 «Eliminar tema» (369,158) | 119×36 y 123×36 | Medium 14 |

Padding: 20 a los lados, 18 arriba y 14 abajo; los botones quedan a 14 del fondo, con gap 8. M-03 y M-15: 512×160 (x=44) con tres botones. M-14 con «1 tarjeta»: alto 175 (A16). Ancho fijo; alto máximo 85 %, solo el cuerpo se desplaza (RD-72).

**4. Textos.** Los de cada M-nn; comillas «…» (G8); título en la fuente del tema (T12).

**5. Estados.** Abierto, fondo `inert`, con cambios (`hayCambios` → Confirmación «Salir sin guardar» / «Seguir editando», título «Salir», RD-103), apilada (A-02b). Sin vacío ni carga propios.

**6. Teclado.** Foco inicial en el primer campo o en «×»; Tab y Shift+Tab ciclan dentro; Esc cierra (o pide salir si hay cambios); clic en el velo cierra; al cerrar el foco vuelve a quien abrió (RD-103; `VentanaEmergente.tsx:115-148`).

**7. Animaciones.** A-01, A-02, A-02b.

**8. Errores previsibles.** Los del formulario (todos a la vez, uno por campo; MB-11). `CIERRE_SESION_FALLIDO` en M-11 (G1m). Los demás diálogos usan el código de su acción y, mientras no tenga uno propio, `OPERACION_FALLIDA` (G1h): «No pudimos completar la operación. Intenta de nuevo más tarde.» Ninguno va al genérico.

**9. Diferencia con el código.**
- `marco.css:344-350` radio 12, borde 1 `linea`, sin sombra → papel con radio 10 y pliegue 22, borde 1,5 `borde`, sombra 3,5,0,0 `borde`. M.
- `tokens.css:273-286` borde `--wg-borde-ancho` `--wg-borde` y relleno `superficie_alta`: relleno coincide con C16. S.
- `marco.css:452,459` padding 20/24/24 y título 18 Bold → padding 20 a los lados, 18 arriba y 14 abajo; título 20 Bold. S.
- `marco.css:352` ancho `min(480px, …)` → 424 (512 para M-03 y M-15). S.
- Faltan A-01 y A-02. M.
- `VentanaEmergente.tsx` aparece modificado sin commit (otra tarea).

**10. Pruebas.** Existentes: foco atrapado, `inert`, Esc, retorno de foco. Nuevas: geometría 424×160 y botones a 14 del fondo, borde y sombra del papel en los cuatro temas, animación reducida.

---

## MB-23 · Confirmacion (`ui/Confirmacion`) y lista M-nn → botón

**1. Nodos.** M-11 y M-12 (MB-22); M-06 `85:66`; M-02 `204:25071 | 233:23578 | 204:25225 | 204:25379`; M-04 `204:25084 | 233:23591 | 204:25238 | 204:25392`; M-08 a M-14 en ids_prototipos; M-01 y M-16 a M-21 en F8.

**2. Estructura.** `VentanaEmergente` con `acciones`: Cancelar (Secundario), una segunda opcional y la principal. `Confirmacion.tsx:44` pasa `destructiva` a `wg-boton--peligro`.

**3. Medidas.** Hereda MB-22 y MB-10. Pregunta 14 (F5). M-06: botón Destructivo con borde y texto `error` (MEDIDO en `85-66`).

**4. Textos.** M-11 título «Cerrar sesión», cuerpo «¿Deseas cerrar sesión?», botones «Cancelar» y «Cerrar sesión». M-12 cuerpo «Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?». M-06 título «Eliminar tema», cuerpo «¿Deseas eliminar el tema “Rosa pastel”? Esta acción no se puede deshacer.», botones «Cancelar» y «Eliminar tema». El resto, en F8.

**5. Estados.** Abierta, procesando (el botón principal se deshabilita mientras dura; sin giro, ver «No se construye»), cerrada.

**6. Teclado.** Como MB-22; el foco inicial no cambia por ser destructiva (ver «No se construye»).

**7. Animaciones.** A-01 y A-02.

**8. Errores previsibles.** Falla al confirmar: aviso Error con el código de la acción. M-11: `CIERRE_SESION_FALLIDO` (G1m). El resto: el código propio de la acción, y `OPERACION_FALLIDA` (G1h) mientras no lo tenga.

**Lista M-nn → variante del botón principal (CONSISTENCIA D12, D13, G13, G16, G17; `85-66`).**

| M-nn | Principal | Fuente |
|---|---|---|
| M-01 «Cancelar instalación» | Destructivo | D13 |
| M-02 «Salir sin guardar» | Destructivo | D13 |
| M-04 «Cambiar sin guardar» | Destructivo | D13 |
| M-06 «Eliminar tema» | Destructivo (borde y texto `error`) | `85-66`, D13, G16 |
| M-07 a M-10 («Eliminar»), M-13, M-14 | Destructivo | D13, G16-G17 (misma familia que M-06) |
| M-11 «Cerrar sesión» | Destructivo | G17 |
| M-12 «Cerrar sesión» | Destructivo en los 4 temas | G17 |
| M-18, M-19, M-21 | «Entendido» (único botón) | D12, G13 |
| M-03, M-05, M-15, M-16, M-17, M-20 | NO MEDIDO aquí (F8) | |

**9. Diferencia con el código.** `Confirmacion.tsx:44` usa el Principal con la clase `peligro`; D13 y G17 piden la variante Destructivo. `destructiva` debe elegir la variante del botón. «Entendido» sin «Cancelar» (D12) necesita una prop nueva. M.

**10. Pruebas.** Por M-nn: variante del principal (tabla anterior, nueva), foco y Esc.

---

## MB-24 · MensajeResultado y Aviso (`ui/MensajeResultado`, `ui/Aviso`)

Es el código de MB-06: hook `useMensajeDeResultado(texto, tipo)` con tipos `exito | info | advertencia | error`. `Aviso.tsx` (13 líneas) es la caja fija de advertencia (`tokens.css:435-440`). Medidas, textos, estados, animaciones y errores: MB-06. Diferencias de código: MB-06. Además, `Aviso.tsx` no corresponde a ningún nodo del Figma (la píldora es la de `MensajeResultado`): decidir si se elimina (Pendiente 6). Pruebas: `MensajeResultado.test.tsx`.

---

## MB-25 · EstadoVacio (`ui/EstadoVacio`)

**1. Nodos.** `Planificador diario · Vacío` `217:10646 | 233:15258 | 217:10750 | 217:10698`.
**2. Estructura.** [estado-vacio] con texto; el Figma no trae ilustración, ícono ni botón de acción.
**3. Medidas (MEDIDO, huella 217-10646).** Texto «No tienes tarjetas para hoy.» en (201,185), Nunito Medium 14, `tinta`. En el mismo marco: migas (200,19), título (200,49), indicador (978,20) con texto en (1000,20), saludo (201,104), fecha (201,131), contador (201,162), columna derecha en (751,104) y (751,272). Código: `min-height: unidad*40`, centrado (`tokens.css:442-447`).
**4. Textos.** «No tienes tarjetas para hoy.» (Planificador); los de cada pantalla vienen del Figma, no genéricos. La huella trae además el texto «No hay tarjetas para hoy.» como oculto duplicado: no se usa.
**5. Estados.** Vacío, solo texto. La acción es opcional y la pone la pantalla.
**6. Teclado.** No enfocable.
**7. Animaciones.** A-33 (sin animación).
**8. Errores previsibles.** No aplica.
**9. Diferencia con el código.** `EstadoVacio.tsx` (18 líneas) muestra solo texto, como el Figma. El marco del Figma conserva una barra de progreso al 25 % con «Completadas: 0 de 0» y restos de filas de tarjetas (incoherencia 9): no se copian; con cero tarjetas el progreso va en 0 %. S.
**10. Pruebas.** Texto exacto, sin acción por defecto y progreso en 0 % (Vitest).

---

## MB-26 · CatalogoColores y SelectorColores

**1. Nodos.** `Colores del tema aplicado · Tres temas de ejemplo` `200:16`; colección de variables `200:2` (32 variables; modos `200:0` claro, `200:1` Rosa, `200:2` Enfoque, `233:0` oscuro).
**2. Estructura.** Catálogo [catalogo-colores] con muestras [muestra-<variable>]; selector [selector-colores].
**3. Medidas.** NO MEDIDO (F0b no midió las muestras).
**4. Textos.** Nombres de las variables (`principal`, `secundario`, `marco`…).
**5. Estados.** Reposo, foco, seleccionado (borde 2).
**6. Teclado.** Flechas entre muestras; Enter elige.
**7. Animaciones.** A-25.
**8. Errores previsibles.**

| Situación | Código | Mensaje |
|---|---|---|
| Color escrito que no es hex | `COLOR_INVALIDO` (PROPUESTA, D10) | «Escribe un color con formato #RRGGBB.» (PROPUESTA) |
| Color obligatorio vacío | `COLOR_OBLIGATORIO` (PROPUESTA) | «Elige un color.» (PROPUESTA) |

Bajo el campo, con el ícono de 16 (E19); nunca al genérico.
**9. Diferencia con el código.** `CatalogoColores.tsx` (65) y `SelectorColores.tsx` (17) NO VERIFICADOS; `tema/derivar.ts:95-97` (Q1 invertida, ver TEMAS_Y_TOKENS) y `tema/tokens_por_defecto.ts:28` (`tamano_fuente` 16px → 14). M.
**10. Pruebas.** Suite de temas (existente) y contraste en los cuatro temas; `COLOR_INVALIDO` con su mensaje.

---

## MB-27 · OjosDeWindi (`ui/OjosDeWindi`)

**1. Nodos.** Windi del botón `2004:334` y Windi completo del panel (`2048:669`); vectores con colores fijos.
**2. Estructura.** `svg` [windi-ojos] con `tamano` y `parpadeando`; son los ojos del dibujo de Windi, no un elemento de la cabecera.
**3. Medidas (MEDIDO, F0b).** Ojos 18,5×4,5 en (14,23.5) del Windi de 48×48. Color fijo `#27152b` (D2/C7: Windi lleva colores fijos y no usa `accion`; RD-70 queda reemplazado en el color). Escribiendo: 2 px a la derecha. Sin conexión y error: ojos cerrados.
**4. Textos.** Decorativo (`aria-hidden`).
**5. Estados.** Reposo, parpadeando (Windi responde), desplazados (escribiendo), cerrados (sin conexión y error).
**6. Teclado.** No enfocable.
**7. Animaciones.** A-22.
**8. Errores previsibles.** No aplica.
**9. Diferencia con el código.** `OjosDeWindi.tsx` (24 líneas): color `accion` → `#27152b` fijo, tamaño 28 → medidas del dibujo de 48; parpadeo contra A-22 NO VERIFICADO. S.
**10. Pruebas.** La prop `parpadeando`; reducido sin parpadeo; color fijo en los cuatro temas.

---

## MB-28 · Iconos (`ui/Iconos`)

**1. Nodos.** `Icono / Sincronizado` `2003:187`, `Icono / Sin conexión` `2251:4951`, `Icono / Alerta` `80:57` (F0b).
**2. Estructura.** Un `svg` por ícono [icono-<nombre>].
**3. Medidas (MEDIDO, F0b).** Sincronizado y Sin conexión 20×20, trazo `tinta` 1,6; se escalan a 16 en indicador y aviso. Alerta 32×32 con trazo 3 en el Figma: se unifica a 20×20 con trazo 1,6 (incoherencia 4). Barra 18×18 con trazo 1,35; botón 20; estado grande 36 (A10).
**4. Textos.** Sin texto; `aria-hidden` salvo que el ícono sea el único contenido (entonces `aria-label`).
**5. Estados.** Color heredado; A-31 para el giro.
**6. Teclado.** No aplica.
**7. Animaciones.** A-31.
**8. Errores previsibles.** No aplica.
**9. Diferencia con el código.** `Iconos.tsx` (139 líneas): faltan `Icono / Sin conexión` y el ícono giratorio de sincronización; Alerta a 20×20 con trazo 1,6. S.
**10. Pruebas.** Tamaños (Vitest).

---

## No se construye (sin CA/ET/RD/Figma)

Quedaron fuera por regla 1 del proyecto (lo que no está en un CA, ET, RD, contrato o Figma no se construye). Si Paula quiere alguno, lo pide y se escribe su CA.

- Foco al `h1` tras cambiar de pantalla (MB-03).
- Estado «cargando» del botón, con ícono giratorio y `aria-busy` (MB-10, MB-23).
- Selector propio con rol `listbox` en lugar del `<select>` nativo (MB-15).
- Foco inicial en «Cancelar» en las confirmaciones destructivas (MB-23).
- Límite de rango en el selector de fecha, salvo que una HU o ET lo defina (MB-16).

---

## Tabla de geometría

Para la prueba de geometría ±2 px de la fase 6 (Playwright). Valores en el marco de 1093×560 (MEDIDO). La regla dice dónde queda cada medida a 1200×800 y a 960×600 (mínimo de RT-01): **fijo** = misma x, y, w, h; **se estira** = cambia w o h; **ancla derecha / abajo** = x o y se calculan desde el borde. Todo se prueba en los cuatro temas (claro, Rosa, Enfoque, oscuro).

| `data-testid` | x | y | w | h | Regla a 1200×800 y 960×600 |
|---|---|---|---|---|---|
| `marco-barra` | 0 | 0 | 176 (56) | 560 | ancho fijo; alto = ventana |
| `barra-logo` | 11 (3) | 15 | 24 | 24 | fijo |
| `barra-marca` | 42 | 16 | 85 | 23 | fijo |
| `barra-contraer` | 140 (26) | 9 | 36 (30) | 36 | fijo |
| `barra-opcion-<pantalla>` | 6 (8) | 82, 121, 160, 199, 238, 277 | 164 (40) | 34 | fijo |
| `barra-opcion-personalizacion` | 6 (8) | 356 (335) | 164 (40) | 34 | fijo |
| `barra-opcion-configuracion` | 6 (8) | 464 | 164 (40) | 34 | fijo |
| `barra-cerrar-sesion` | 6 (8) | 506 | 164 (40) | 34 | fijo (no se ancla abajo: a 960×600 termina en 540 y cabe) |
| `marco-principal` | 176 | 0 | ventana − 176 | ventana | se estira |
| `encabezado-miga` | 200 | 19 | 191 (Planificador) | 18 | fijo |
| `encabezado-titulo` | 200 | 49 | por contenido | 32 | fijo |
| `indicador-icono` | 978 (Sincronizando 884) | 20 | 16 | 16 | ancla derecha: borde derecho a 24 del borde de la ventana |
| `indicador-texto` | 1000 (Sincronizando 906) | 20 | 69 (163) | 16 | ancla derecha, igual |
| `marco-tarjeta` (Configuración) | 200 | 104 | 842 | 326 | x, y fijos; w y h se estiran con la ventana |
| `planificador-saludo` | 201 | 104 | 102 | 26 | fijo |
| `saludo-fecha` | 201 | 131 | 146 | 18 | fijo |
| `estado-vacio` (texto) | 201 | 185 | por contenido | 19 | fijo |
| `windi-flotante` | 1029 | 496 | 48 | 48 | ancla derecha y abajo, a 16 px |
| `windi-panel` | 737 | 4 | 351 | 551 | ancla arriba a 4 y a la derecha a 5; alto = ventana − 9 |
| `windi-velo` | 0 | 0 | 1093 | 560 | se estira: cubre la ventana |
| `windi-cerrar` (relativo al panel) | 303 | 10 | 36 | 36 | fijo en el panel |
| `windi-campo` (relativo al panel) | 16 | 470 | 275 | 36 | ancla abajo; y = alto del panel − 81 |
| `windi-enviar` (relativo al panel) | 299 | 470 | 36 | 36 | ancla abajo, igual |
| `windi-contador` (relativo al panel) | 245 | 514 | 46 | 16 | ancla abajo |
| `aviso-<tipo>` | 822 (borde derecho 1069) | 4 | 247 (según texto) | 42 | **PROPUESTA** a la espera de la decisión de Paula (Pendiente 1); ancla derecha a 24 |
| `emergente` (papel) | centrado | centrado | 424 (512 en M-03 y M-15) | 160 (175 en M-14) | ancho fijo; centrado en la ventana |
| `emergente-cerrar` (relativo al papel) | 372 | 10 | 32 | 32 | fijo en el papel |
| `emergente-acciones` (relativo al papel) | borde derecho a 20 | 110 | por contenido | 36 | fijo en el papel; gap 8 |

Los valores entre paréntesis son los de la barra contraída. Las pruebas de color citan los tokens, no los hex, y los tokens nuevos (`radio_control`, `trazo_control`, `trazo_foco`, `radio_anillo_foco`, `sombra_boton`, `sombra_papel_dialogo`, `trazo_papel_dialogo`, `radio_papel_dialogo`, `pliegue_papel_dialogo`, `capa_puntero`, `radio_panel`, `radio_aviso`) se marcan «(se crea en la pieza de temas)» hasta que esa pieza exista.

---

## Incoherencias resueltas

| # | Incoherencia | Decisión que aplica |
|---|---|---|
| 1 | Barra 212 (RD-65) frente a 176 (Figma) | Figma gana: 176 y 56 |
| 2 | Hover del Principal: el Figma superpone una capa `tinta` al 14 % y no cambia el relleno; E1 y la regla general pedían `superficie_baja` | Figma (F0b) para el Principal; `superficie_baja` para Secundario, Destructivo e ícono |
| 3 | Botón deshabilitado: E3 dice relleno `superficie_baja`; F0 §6.9 y F0b dicen `superficie`; el Figma además mide opacidad 0,45 y E2/E3 mandan «sin opacidad». E3 no está entre las «Decisiones de Paula» | **Gana F0: `superficie`**, texto `borde`, Destructivo con borde `error`, sin opacidad. Campo deshabilitado: borde `linea`, texto `borde`, relleno `superficie` |
| 4 | Ícono Alerta 32×32 con trazo 3 frente a Sincronizado y Sin conexión 20×20 con trazo 1,6 | Unificar a 20×20 con trazo 1,6 (escalado a 16 en pantallas) |
| 5 | E8 pone el ícono de Sincronizando en x=978, donde choca con el texto (906–1069) de la huella 217-20340 | Patrón de 22 px: ícono 16 en x=884 y texto en 906 |
| 6 | Aviso en (822,4) con borde derecho en 1069 (F5 `2251:4979`) frente a D7 (borde derecho en 966) | Sin resolver, Pendiente 1; RD-63 y RD-104 vigentes hasta la fase 5 |
| 7 | El aviso dibuja a la vez un ícono Cerrar y un «×» de texto, y un ícono de tipo con un glifo «✓ / i / ×» superpuesto | Un solo «×» de texto y solo el ícono de tipo con la variable de estado |
| 8 | Aviso «En pausa» idéntico a «Visible» en el Figma | Solo detiene el temporizador (A-07) |
| 9 | Estado vacío con barra de progreso al 25 % y «0 de 0», y restos de filas de tarjetas | No se copian; progreso en 0 % |
| 10 | Windi sin conexión con opacidad 0,5 y 0,4 (F5) | E2, E3: sin opacidad |
| 11 | Logo con #6200d9 frente a #6604e6 de Windi | Son marcas distintas: logo con trazos fijos, Windi con colores fijos (D2/C7); no son tokens |
| 12 | Borde fijo de los avisos (#168451, #b32d42, #00d9e2) y franja izquierda fija | C1, C2, D1, P2: variable de estado |
| 13 | Anillo de foco: el Figma dibuja 2 px `tinta` en botón (cuadro de 82×44, trazo interior, separación libre de 2) y 1 px `principal_legible` en campo e interruptor | **D6 manda en todo**: 2 px `tinta`, separación 3, radio del control + 3. La diferencia con el Figma queda anotada aquí |
| 14 | Error 6 s (Figma) frente a hasta cerrar (RD-104) | G5: hasta cerrar |
| 15 | M-11 y M-12 Destructivo solo en claro | G16, G17: Destructivo en los 4 temas |
| 16 | Texto del globo `marco` (RD-100) frente a `fondo` (Figma); flecha 6 frente a 12×6 | Figma |
| 17 | Botón de Windi 40 y panel 360×100vh (RD-70) frente a 48 y 351×551 en (737,4); indicador 15 (RD-61) frente a 12; ojos `accion` (RD-70) frente a Windi con colores fijos (D2/C7) | Figma y D2/C7 |
| 18 | Navegación por URL de «Windgets--Copy-» | P1: navega la HU |
| 19 | Fuentes mezcladas (Rubik y Nunito) | T3, T4: fuente del tema |
| 20 | «Ocurrió un error inesperado.» en Windi | Regla de errores visibles y G1a |
| 21 | Íconos de la barra con trazo 1,44 (spec anterior) frente a 1,35 (F0b) | 1,35 medido; no es token |

## Decisiones ya tomadas que se citan (no se vuelven a preguntar)

- Panel de Windi modal: la huella `204-26015` dibuja el «Velo» bajo el panel (era el Pendiente 6).
- Variante de «Eliminar» en M-06 a M-10, M-13 y M-14: Destructivo (`85-66`, D13, G16-G17; era el Pendiente 11).
- Ventana de 1280×790: P15 y `F7.md:8` (era el Pendiente 13).
- 960×600 es el mínimo de la ventana (`DUDAS.md:228`, RT-01) y la barra cabe (era el Pendiente 14).

## Pendiente de Paula

1. **Posición de los avisos:** franja superior y=4, uno a la vez, con borde derecho en 966 (D7, PROPUESTA); la huella `2251:4979` los pone en (822,4) con borde derecho en 1069, encima del indicador; o cola abajo a la derecha con máximo 3 (RD-63 y RD-104, vigentes hoy). Conflicto recogido en ANIMACIONES §8.
2. **Barra lateral:** el Figma no trae hover; no mide hover ni activo en la barra contraída, en Rosa y en Enfoque. Se propone `superficie_baja` en hover. Además, `sobre_detalle` claro #17131d da contraste 2,38 y falla (se propone #ffffff) y el logo lleva colores fijos.
3. **Textos y códigos PROPUESTA nuevos (D10):** `PREFERENCIA_MENU_NO_GUARDADA`, `PERFIL_NO_DISPONIBLE`, `<CAMPO>_OBLIGATORIO` y `<CAMPO>_INVALIDO` (cuando el CA no define el texto), `COLOR_INVALIDO`, `COLOR_OBLIGATORIO`, `FECHA_FUERA_DE_RANGO`. El destino de `SINCRONIZACION_FALLIDA` es el área Sincronización (HE-15, HE-16).
4. **Texto del indicador en error:** el código dice «Reintentaremos automáticamente.»; el Figma dice «Error de sincronización · N pendientes». Se propone el del Figma.
5. **Saludo sin alias:** se propone «Hola».
6. **`Aviso.tsx`** (caja fija sin nodo en el Figma): ¿se elimina?
