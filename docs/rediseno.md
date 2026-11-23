# Rediseño visual · registro único de cambios

Desde el 22-nov-2026 el equipo está en una fase de rediseño visual guiada por el Figma «Windgets»
(<https://www.figma.com/design/M3aVx3tQdlofQd040l6p1B/Windgets>). Las HU, `interfaz.md` y `producto.md` quedan
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

## Pendiente para la edición final

Al cerrar el rediseño, reescribir con las decisiones de arriba:

- `producto.md`: quitar «Modo claro y oscuro» de lo que no se construye o acotarlo (RD-02).
- `interfaz.md`: «Colores y tipografía», «Colores de marca fijos» (R-04), «Forma» (R-07, R-08), «Presencia» (R-10) y
  «Tema a tokens» para las pantallas sin sesión (RD-02 a RD-07).
- `HE-03.md`: HU06-CA07 y ET01 (RD-02, RD-06).
- `HE-01.md`: HU01 (ET01, CA11, textos nuevos, contadores, ayuda, indicador de pasos), HU03 y HU05 (tema inicial),
  HU06 (Recuperar contraseña) (RD-08 a RD-13, RD-15).
- `HE-02.md`: HU07 y su catálogo de paletas; HU06, catálogo de tipografías (RD-06, RD-14).
- `plan_construccion.md`: agregar P25 a P28 (RD-01).
- `arquitectura.md`: D-198 (RD-06).
- `docs/AGENTS.md`: retirar la sección «Rediseño visual» cuando ya no aplique.
