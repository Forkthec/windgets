# Rediseño visual · registro único de cambios

Desde el 22-nov-2026 el equipo está en una fase de rediseño visual guiada por el Figma «Windgets»
(<https://www.figma.com/design/M3aVx3tQdlofQd040l6p1B/Windgets>). Desde el 23-nov-2026 la versión vigente es «Windgets
(Copy)» (<https://www.figma.com/design/h5LPoqlRnG5OTP6zru0pjS/Windgets--Copy->), con la página «00 · Fundamentos» y
las pantallas sin sesión en «01 · Acceso». Las HU, `interfaz.md` y `producto.md` quedan
desactualizadas en lo que toca el rediseño, y no se editan una por una: **todo cambio del rediseño se anota aquí**.
Cuando el rediseño termine se hace una sola edición de las HU y los modelos con la lista de «Pendiente para la
edición final».

## Precedencia

Mientras dure el rediseño, una decisión de este documento gana sobre la HU, la ET, `interfaz.md` y `producto.md` que
contradiga, solo en lo que la decisión dice. Todo lo demás de `docs/` sigue igual. Este documento cuenta como spec
para la regla «No inventes funciones» (`AGENTS.md`).

## Cómo agregar un cambio

Cualquier persona del equipo, desde cualquier cuenta, agrega una fila a la tabla de decisiones con el siguiente
número libre (RD-nn) y, si contradice algo de `docs/`, una línea en «Pendiente para la edición final». No se borra ni
se reescribe una decisión ya fusionada: se agrega una nueva que la reemplaza («Reemplaza RD-nn»).

| Campo | Contenido |
|---|---|
| RD | Número siguiente |
| Fecha | `aaaa-mm-dd`, hora colombiana (UTC-5) |
| Paso / PR | `PNN` y número del PR |
| Alcance | Pantallas o componentes que toca |
| Decisión | Qué se hace, con valores concretos (textos literales entre «…», colores, medidas) |
| Contradice | HU, CA, ET o regla de `docs/` que deja de valer en ese punto, o «—» |
| Prueba | Prueba que lo verifica |

Los commits del rediseño usan el prefijo `rediseno: <verbo y objeto>`.

## Reglas de implementación del rediseño

Aprobadas por Paula el 2026-11-22. Valen para toda pantalla que se construya o cambie con el rediseño.

1. **Fuente de verdad.** Manda el Figma «Windgets (Copy)» (`h5LPoqlRnG5OTP6zru0pjS`): «00 · Fundamentos» (`0:1`)
   para colores, tipografía e íconos, y la página del área para las pantallas (hoy «01 · Acceso», `79:2`). Cada
   componente cita su marco con el id de nodo en un comentario (`// Figma 84:22 «Recuperar contraseña · Claro»`) y
   cada RD lo cita en «Alcance». Si el Figma choca con una HU, gana el RD que lo decide; si no hay RD, se pregunta a
   Paula y se crea uno. Si el Figma cambia o tiene una imprecisión que no se copia (por ejemplo, un margen desigual),
   se anota un RD con la fecha.
2. **Tokens.** Cada color de «00 · Fundamentos» vive en una variable de nombre estable: `--wg-*` para lo global en
   `apps/desktop/src/ui/tema/tokens.css` y `--wg<área>-*` para un área, en su propia hoja (`--wgc-*` en
   `screens/cuenta/cuenta.css`; una hoja nueva por área, por ejemplo `screens/planificador/planificador.css`, para
   que dos pasos no choquen al fusionar). Fuera de los bloques `[data-modo]` no hay hex sueltos. Los px son medidas
   del Figma: las que se repiten van en una variable y las demás llevan el nodo en un comentario.
3. **Tipografía.** Solo fuentes woff2 empaquetadas en `apps/desktop/assets/fonts`, con su `@font-face` en
   `tokens.css` y `font-display: swap`. Rubik en pesos 400, 500 y 700. Escala de «00 · Fundamentos»: título 42,
   sección 26 y texto 17 px; otro tamaño solo si el marco lo usa, con su nodo. Nunca fuentes del sistema (salvo el
   respaldo «Segoe UI» de `--wg-fuente`) ni de internet.
4. **Medidas y responsive.** Se compara con el Figma al tamaño de cada marco (1240×820, 1240×930, 1280×790…) y
   además a 1200×800, el tamaño con que abre la ventana (mínimo 960×600, `tauri.conf.json`). Puntos de corte:
   `width < 1000px` oculta a Windi y su globo, y la nota queda centrada con el mismo ancho; entre 1000 y 1240 px
   Windi se escala con su columna y nunca queda cortado por el borde de la ventana; si no cabe en alto, hay scroll
   vertical. Nunca hay scroll horizontal. Unidades: px del Figma, sin rem. Los bordes de 1,5 px de RD-05 se
   mantienen y no se agregan grosores fraccionarios nuevos. El diseño aguanta la escala de Windows de 100 a 150 % y
   el zoom del WebView de 90 a 125 % (125 % sobre la ventana mínima equivale a 768×480).
5. **Modos.** Todo componente nuevo define sus colores en `[data-modo='claro']` y `[data-modo='oscuro']`. Antes de
   iniciar sesión manda el modo (RD-02, RD-03); con la sesión, el tema (RD-14, RD-15).
6. **Componentes.** Se reutilizan `MarcoDeCuenta`, `PasoCentrado`, `AccionesDelPaso`, `CampoTexto` (contador,
   ayuda, obligatorio), `Boton`, `Aviso`, `Hipervinculo` e `IndicadorDePasos`. Si el Figma repite una pieza con otra
   variante, se extiende el componente con una prop; solo se crea uno nuevo si la pieza aparece en dos o más marcos y
   ninguno la cubre. Sin estilos en línea.
7. **Estados sin Figma.** Error, vacío, cargando, sin conexión, deshabilitado y foco se arman con los componentes y
   tokens existentes (Aviso, mensaje de campo, `--wgc-deshabilitado-*`, contorno de foco) y se anotan como RD con su
   texto literal. Ningún camino previsible termina en el error genérico, y un error que llegue sin mensaje muestra
   el texto genérico: nunca se queda en silencio.
8. **Accesibilidad mínima.** Texto con contraste de 4,5:1 o más (3:1 si es grande); controles y bordes de campo de
   3:1 o más (R-13). Enlaces subrayados (R-12), foco visible, nombre accesible igual a la etiqueta del CA, ayuda y
   error en `aria-describedby`, y grupos de opciones con el patrón de ARIA (una parada de tabulación y flechas).
   Contraste alto de Windows: no se fuerzan colores (`forced-colors: active`) y todo estado que dependa del fondo
   lleva además un borde o un contorno. El tamaño de texto de Windows no llega al WebView2: se cubre con el zoom hasta
   125 %.
9. **Textos.** Literales del Figma o de un RD, centralizados por área (como `textosDelRediseno.ts`). Sin texto
   inventado.
10. **Recursos.** Todo se construye con código: CSS y SVG exportados del Figma (Exportar > SVG, con los colores de la
    paleta), en `screens/<área>/activos/`. La app no usa PNG ni URLs temporales del MCP. Un PNG de un marco solo se
    exporta para comparar cuando no hay otra forma y no es fuente de verdad.
11. **Verificación antes de cada PR del rediseño.** Una prueba por RD. Pruebas de captura de Playwright
    (`toHaveScreenshot`) que solo corren en el contenedor `windgets-ci`, para que el render sea igual en cualquier
    computador: cada pantalla al tamaño de su marco y a 1200×800, en claro y oscuro, con `maxDiffPixelRatio` 0,01 y
    las capturas de referencia en el repositorio. `herramientas/verificacion/verificar.sh` con todos los pasos en
    `=== fin (0)`. Lista de chequeo: tamaños de los marcos, 1200×800, 1000 y 999 px, 960×600, zoom de 125 %, foco,
    contraste y estados sin Figma.
12. **Proceso.** Un RD por cambio («Reemplaza RD-nn» si cambia uno ya fusionado), commits `rediseno: <verbo y
    objeto>` y «Pendiente para la edición final» al día. Aprueba Paula.

## Decisiones

| RD | Fecha | Paso / PR | Alcance | Decisión | Contradice | Prueba |
|---|---|---|---|---|---|---|
| RD-01 | 2026-11-22 | P28 | Pantallas de cuenta: Inicio de sesión, Registro (Formulario y Verificar correo) y Recuperar contraseña (Correo, Código y Nueva contraseña) | El rediseño de P28 cubre solo estas pantallas. El resto de la ventana principal, el wallpaper y la ventana de edición no cambian. P28 no está en `plan_construccion.md`. | `plan_construccion.md` (termina en P24) | — |
| RD-02 | 2026-11-22 | P28 | Pantallas de cuenta | Antes de iniciar sesión la apariencia es fija, la del Figma, con un selector «Apariencia» de dos opciones, «Claro» y «Oscuro», arriba a la derecha. Con la sesión iniciada la apariencia sale del tema aplicado, como antes. | HE-03-HU06-CA07 y ET01, `interfaz.md` («No hay modo claro ni oscuro»), `producto.md` (alcance: «Modo claro y oscuro»), solo antes de iniciar sesión | `SelectorDeModo.test.tsx`, `e2e/rediseno-cuenta.spec.ts` |
| RD-03 | 2026-11-22 | P28 | Pantallas de cuenta | El modo elegido se guarda solo en el computador (almacenamiento local de la ventana, clave `wg.modo_cuenta`), sin sincronizar, y sobrevive a cerrar sesión. La primera vez se usa el modo de aplicaciones de Windows (claro u oscuro). | — | `SelectorDeModo.test.tsx`, `e2e/rediseno-cuenta.spec.ts` |
| RD-04 | 2026-11-22 | P28 | Pantallas de cuenta | Paleta fija. Claro: fondo `#F5F0FF`, nota `#FFFBEA`, campo `#FFFFFF` con borde `#766B81`, borde y sombra `#241C30`, tinta `#17131D`, texto `#554F5E`, acción `#00D9E2` con texto `#17131D`, enlace y opción seleccionada `#6604E6`, paso actual `#EDE3FF` con texto `#6604E6`. Oscuro: fondo `#201B2B`, nota `#302D38`, campo `#201C26` con borde `#948B9E`, borde `#AFA1C0`, sombra `#100D15`, tinta `#F8F5FF`, texto `#CEC7D6`, acción `#00D9E2` con texto `#17131D`, enlace y opción seleccionada `#D3B2FF`, paso actual `#433258` con texto `#D3B2FF`. El Figma no define el error: claro `#B3261E`, oscuro `#FF8A80` (4,5:1 o más sobre la nota). | R-04 (los colores de marca cian y púrpura tienen función: acción, enlace, selección), `interfaz.md` («Tema a tokens»: sin sesión se usaban los tokens del tema por defecto) | `e2e/rediseno-cuenta.spec.ts` |
| RD-05 | 2026-11-22 | P28 | Pantallas de cuenta | Forma del Figma: radio de 9 px en campos y botones, 5 px en la nota, 15 px en el globo de Windi; borde de 1,5 px; sombra sólida desplazada 3 px a la derecha y 5 px hacia abajo; esquina doblada en la nota. | R-07 (radio de un tercio), R-08 (sombra a 18°), R-14 en esas medidas | Revisión visual |
| RD-06 | 2026-11-22 | P28 | Pantallas de cuenta y catálogo de tipografías | Tipografía Rubik (regular, media y negrita) fija en las pantallas de cuenta. Rubik se agrega al catálogo de tipografías (`catalog_font` `rubik`, migración `0007_rediseno_cuenta.sql`). | HE-03-HU06-ET01 («sin tipografía propia de la aplicación»), D-198 (Nunito sin sesión) | `pruebas_de_paletas_del_rediseno` (Rust) |
| RD-07 | 2026-11-22 | P28 | Pantallas de cuenta | Composición: cabecera con el símbolo de Windgets y la palabra «windgets» (`#121216` en claro, `#FFFFFF` en oscuro), a la izquierda Windi con un globo de diálogo y a la derecha el formulario como nota. Por debajo de 1000 px de ancho de ventana Windi y su globo se ocultan. | R-10 (Windi se suma al identificador de marca en la pantalla) | `e2e/rediseno-cuenta.spec.ts` |
| RD-08 | 2026-11-22 | P28 | Pantallas de cuenta | Títulos, subtítulos y globo de Windi. Inicio de sesión: «Bienvenido a Windgets», «Qué bueno verte de nuevo.», globo «Soy Windi.» / «¿Qué organizamos hoy?». Registro > Formulario: «Crea tu cuenta», «Solo te toma un minuto.», globo «¡Soy Windi!» / «¿Creamos tu cuenta?». Registro > Verificar correo: «Verifica tu correo», globo «¡Revisa tu correo!» / «Te espero aquí.». Recuperar contraseña > Correo y Código: «Recupera tu contraseña», globo «Tranquilo,» / «te ayudo a recuperarla.». Nueva contraseña: «Recupera tu contraseña», globo «Elige una» / «que recuerdes.». | `AGENTS.md` regla 1 (textos sin CA) | `SignIn.test.tsx`, `Register.test.tsx`, `Recovery.test.tsx` |
| RD-09 | 2026-11-22 | P28 | Registro y Recuperar contraseña | Indicador de pasos: Registro «1 Formulario» — «2 Verificar correo»; Recuperar contraseña «1 Correo» — «2 Código» — «3 Nueva contraseña». El paso actual va resaltado y marcado como actual. | HE-01 (sin indicador de pasos) | `SelectorDeModo.test.tsx`, `Register.test.tsx`, `Recovery.test.tsx` |
| RD-10 | 2026-11-22 | P28 | Registro y Recuperar contraseña | Contador de caracteres «n/máx» a la derecha de la etiqueta: Alias 30, Correo electrónico 64, Contraseña 64 (Registro); Correo electrónico 64 y Nueva contraseña 64 (Recuperar). El contador no limita lo que se escribe: el límite lo sigue avisando el mensaje de campo. | HE-01 (sin contador) | `CampoTexto.test.tsx`, `Register.test.tsx` |
| RD-11 | 2026-11-22 | P28 | Registro y Recuperar contraseña | Ayuda fija debajo de Contraseña y de Nueva contraseña: «8 a 64 caracteres con al menos una mayúscula, una minúscula y un número.». Los campos obligatorios llevan « *» en la etiqueta. | HE-01 (la regla de la contraseña solo aparecía como mensaje de error) | `CampoTexto.test.tsx` |
| RD-12 | 2026-11-22 | P28 | Registro > Formulario | Orden: campos, «Crear cuenta» a lo ancho, divisor «o», «Continuar con Google» (se mantiene, HE-01-HU05) y el texto «¿Ya tienes cuenta? Inicia sesión» centrado. El hipervínculo dice «Inicia sesión». | HE-01-HU01-CA11 y ET01 («¿Ya tienes cuenta? Iniciar sesión») | `Register.test.tsx`, `e2e/rediseno-cuenta.spec.ts` |
| RD-13 | 2026-11-22 | P28 | Inicio de sesión | Divisor «o» entre «Iniciar sesión» y «Continuar con Google», como en el Figma. | — | `SignIn.test.tsx` |
| RD-14 | 2026-11-22 | P28 | Catálogo de paletas | Paletas nuevas «Claro» (`claro`) y «Oscuro» (`oscuro`), al principio del catálogo, para todas las cuentas. Oscuro: principal `#201B2B`, secundario `#5D566B`, texto `#F8F5FF`. Claro: principal `#F5F0FF`, secundario `#B6A560`, texto `#17131D`. En Claro el secundario se oscureció frente al Figma para que la acción tenga 3:1 sobre la superficie (R-13, queda en 3,12:1); por eso la nota con sesión es un crema más oscuro (`#E2DBBF`) que la de las pantallas de cuenta. | HE-02-HU07 (catálogo de paletas) | `pruebas_de_paletas_del_rediseno` (Rust) |
| RD-15 | 2026-11-22 | P28 | Cuenta nueva | Al crear una cuenta (correo o Google), su primer tema toma la paleta del modo elegido en las pantallas de cuenta y la tipografía Rubik, y se aplica. Si no se puede, la cuenta sigue con su tema y se muestra el mensaje de resultado «No pudimos aplicar el tema <Claro u Oscuro>. Puedes elegirlo en Personalización.». Las cuentas existentes no cambian. | HE-01-HU03 y HE-01-HU05 (la cuenta empezaba con el tema por defecto) | `temaInicial.test.tsx` |
| RD-16 | 2026-11-23 | P28 | Verificar correo, Recuperar contraseña (Correo electrónico, Diligenciar código, Nueva contraseña) | Figma «01 · Acceso»: nota centrada de 570 px debajo del logo centrado, sin Windi ni indicador de pasos. El selector «Apariencia» se queda a la derecha (el Figma no lo muestra en estas pantallas). Dentro de la nota: miga de pan con «/» (Verificar correo: «Registro / Verificar correo», donde «Registro» hace lo mismo que «Regresar»; Recuperar: «Inicio de sesión / Recuperar contraseña»), título y subtítulo: «Verifica tu correo» / «Escribe el código que enviamos a tu correo.» (ya no se muestra el correo); «Recupera tu contraseña» / «Te enviaremos un código a tu correo electrónico.»; «Verifica el código» / «Ingresa el código que recibiste por correo.»; «Nueva contraseña» / «Elige una contraseña para volver a entrar.». Correo electrónico con el texto de ejemplo «nombre@ejemplo.com». Nueva contraseña con la ayuda «8 a 64 caracteres, una mayúscula, una minúscula y un número.». Estos campos no llevan contador ni marca de obligatorio. Reemplaza en estas pantallas RD-08 (globo de Windi), RD-09 (indicador de pasos) y RD-10 (contadores). | RT-03-ET08 (Registro sin miga de pan), HE-01-HU03-ET01 (el correo en Verificar correo) | `Register.test.tsx`, `Recovery.test.tsx` |
| RD-17 | 2026-11-23 | P28 | Las mismas pantallas de RD-16 | «Regresar» pasa de la parte superior al final de la nota, como texto de enlace a la izquierda del botón principal (260 px, sin borde ni sombra). «Reenviar código» queda debajo. | RT-03-ET01 («Regresar» en la parte superior) | `Register.test.tsx`, `Recovery.test.tsx` |
| RD-18 | 2026-11-23 | P28 | Pantallas de cuenta | Avisos: recuadro sin borde con un 12 % del color de error sobre la nota (en oscuro #473941, el del Figma). Sin conexión, el paso Correo electrónico usa «Sin conexión. Conéctate para enviar el código.» y, debajo de las acciones de los pasos de RD-16, «<botón> requiere conexión a internet.» («Enviar código», «Verificar», «Guardar contraseña»). Los demás pasos conservan su aviso. | HE-01-HU06-ET11 (texto del aviso sin conexión) | `Register.test.tsx`, `Recovery.test.tsx` |
| RD-19 | 2026-11-22 | P28 | Inicio de sesión y Registro | Composición medida sobre los marcos 66:4 y 66:162 (±2 px; Windi de Registro, ±7 px): a 1240 px la nota va en (602, 135) y mide 552 × 624 en Inicio de sesión; el globo y Windi se ubican en % de su columna para achicarse con ella. Campos y botones secundarios de 44 px. En Registro, el divisor y «Continuar con Google» (RD-12) hacen la nota más alta que el marco: a 1240 × 930 la pantalla se desplaza. | `interfaz.md` (R-07, R-08, alturas de campo y botón) | `e2e/rediseno-cuenta.spec.ts` |
| RD-20 | 2026-11-22 | P28 | Las pantallas de RD-16 | La nota centrada mide al menos 420 px de alto, como los marcos 84:x, con el ritmo vertical del Figma. El logo va centrado con la nota y con la misma altura del Figma; los márgenes a los lados de la nota son iguales (el Figma los tiene desiguales y no se copia). | — | `e2e/rediseno-cuenta.spec.ts` |
| RD-21 | 2026-11-22 | P28 | Pantallas de cuenta | El corte de RD-07 es `width < 1000px`: a 1000 px Windi todavía se ve. Por debajo, la nota queda a la misma altura y solo el margen lateral baja a 16 px; la nota centrada conserva sus 570 px mientras quepa. | — | `e2e/rediseno-cuenta.spec.ts` |

## Pendiente para la edición final

Al cerrar el rediseño, reescribir con las decisiones de arriba:

- `producto.md`: quitar «Modo claro y oscuro» de lo que no se construye o acotarlo (RD-02).
- `interfaz.md`: «Colores y tipografía», «Colores de marca fijos» (R-04), «Forma» (R-07, R-08), «Presencia» (R-10) y
  «Tema a tokens» para las pantallas sin sesión (RD-02 a RD-07, RD-19).
- `HE-03.md`: HU06-CA07 y ET01 (RD-02, RD-06).
- `HE-01.md`: HU01 (ET01, CA11, textos nuevos, contadores, ayuda, indicador de pasos), HU03 y HU05 (tema inicial),
  HU06 a HU08 (Recuperar contraseña) (RD-08 a RD-13, RD-15 a RD-21).
- `HE-01.md` HU03-ET01 y `RT.md` RT-03-ET01 y ET08: miga de pan en Verificar correo, «Regresar» al
  final y el correo que ya no se muestra (RD-16, RD-17).
- `HE-02.md`: HU07 y su catálogo de paletas; HU06, catálogo de tipografías (RD-06, RD-14).
- `plan_construccion.md`: agregar P25 a P28 (RD-01).
- `arquitectura.md`: D-198 (RD-06).
- `docs/AGENTS.md`: retirar la sección «Rediseño visual» cuando ya no aplique.
