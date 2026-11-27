# SPEC · Cuenta y acceso (página 79:2 «01 Acceso»)

Fecha: 26-nov-2026 (hora colombiana). Estado: BORRADOR local, sin subir a ningún sitio (regla de Paula: nada generado con IA se sube sin su sí).
Llegó hasta: completo (AC-01 a AC-10 y las secciones finales). No se usó el conector de Figma.

## Alcance

- Las **50 familias** de 79:2 (`docs/rediseno_flujos_ids_prototipos.md` líneas 8-62; el documento dice 51 y lista 50, incoherencia 20 de F1) y su flujo (`docs/rediseno_flujos_prototipos.md` §4, líneas 54-80).
- Pantallas: inicio de sesión, registro, verificar correo, recuperar contraseña, diligenciar código, nueva contraseña y sus estados.
- Fuera de las 50 pero dentro de la cuenta: cierre de sesión M-11/M-12 (nodos 85:126 y 85:138 de F8, HE-16-HU03) y sesión vencida dentro de la app (RD-89).
- Perfil o «cuenta» como pantalla: **no existe** en el Figma ni en una HU de `docs/HE-*.md`. Va a «No se construye».
- Mapa de piezas: AC-01 marco · AC-02 inicio de sesión · AC-03 avisos del inicio de sesión · AC-04 registro · AC-05 verificar correo · AC-06 recuperar contraseña (y 88:2) · AC-07 diligenciar código · AC-08 nueva contraseña · AC-09 cerrar sesión · AC-10 sesión vencida.

## Fuentes y orden de autoridad

1. Mandan sin contradecirse: `CONSISTENCIA.md`, `TEMAS_Y_TOKENS.md`, `ANIMACIONES.md`, `SPEC_Marco_y_componentes_base.md` (MB-nn: se citan, no se repiten) y `.trabajo/DECISIONES_PAULA_26nov.md`.
2. Medidas: `.trabajo/figma/F1.md` y `.trabajo/figma/huellas/*.json` (66-4, 66-162, 84-2, 84-62, 88-2). Componentes: F0 y F0b.
3. Reglas de negocio: `docs/HE-01-*.md`, `docs/contratos.md` (IPC-AUTH-01 a 14, EV-02, DP-03), `messages.es.json`, RD-04 a RD-25, RD-67, RD-83, RD-88, RD-89, RD-95.
4. Código: `apps/desktop/src/screens/{sign_in,register,recovery,cuenta,settings}`.

## Etiquetas

MEDIDO (huella o F1), DECISIÓN (ya tomada por Paula o por CONSISTENCIA), PROPUESTA (sin base; confirmar), NO MEDIDO (motivo). Tamaño de la diferencia con el código: S, M, L. NUEVA = función sin código hoy.

## Convenciones comunes (valen para AC-01 a AC-10)

**C-1 Origen de coordenadas.** Todas las coordenadas de las huellas son del marco 1093×560, origen arriba a la izquierda. Las pantallas 66-x llevan la marca en (160-205, 24-28) y el selector de apariencia arriba a la derecha; las 84-x y 88-x llevan la marca en (457-496, 40) y una nota de 404 de ancho centrada (x 344,5).

**C-2 Colores fijos a variables (T1, C3, C4, C5, C6).** Todo hex de la página pasa a variable del tema; no queda color fijo.

| Hex del Figma (claro / oscuro) | Variable | Nota |
|---|---|---|
| `#f5f0ff` / `#201b2b` y `#1c1922` | `marco` | El claro ya es `marco`. El oscuro de 84:12 (`#1c1922`) se unifica a `marco` (#201b2b). |
| `#17131d`, `#211a2d` / `#f8f5ff` | `tinta` | Las dos tintas del Figma (incoherencia 2) pasan a una. |
| `#554f5e`, `#62596a` / `#cec7d6`, `#d0c8d7` | `texto` | Subtítulo, migas, ayuda, «Puedes pedir un nuevo código…». |
| `#766b81`, `#2b2135` / `#948b9e`, `#9e91ac` | `borde_campo` | Borde de campo (0,9, 0,8 y 0,7 pasan a 1,5, MB-11). |
| `#ffffff` / `#201c26`, `#211e27` (campo) | `superficie` | Relleno de campo y botón secundario. |
| `#ffffff` / `#292531` + borde `#afa1c0` (globo) | `superficie_alta` + `borde` | Globo y tarjeta de Windi (MB-05). |
| `#6604e6` / `#d3b2ff` (enlaces) | `secundario` | Mismos valores en TEMAS_Y_TOKENS §1. |
| `#00d9e2` (botón) | `accion` | Igual en ambos temas. |
| `#18131c` (borde del botón) | `borde` | Resuelve el borde casi invisible del oscuro (F1 desvío 4): `borde` oscuro es #afa1c0. |
| `#241c30` (sombra, divisor, borde de Google) / `#100d15` | `sombra`, `linea`, `borde` | Sombra dura 3;5 (C5); divisores en `linea`. |
| `#b3261e`, `#b32d42` / `#ff8a80` | `error` | C3: un solo rojo. |
| `#fae6dd` / `#473941` (franja) | `relleno_vencida`, texto `error` | C6. |
| `#dfdbdd` / `#524b59` (deshabilitado) | Deshabilitado de MB-10: `superficie`, texto `borde`, borde `borde` | Sin opacidad. |
| `#168451` (borde de la píldora de éxito) | `estado_completada` | D1; relleno `superficie_alta`. |

**C-3 Fuente (T1).** Rubik fija (RD-06) pasa a la fuente del tema (Nunito en claro y oscuro). La tipografía elegida por la persona manda sobre la del tema. Pesos del Figma: Bold (títulos, botones), Medium (etiquetas, enlaces), Regular (resto).

**C-4 Escalas (A1, A12, R10, D6).** El Figma está escalado ~1,0244; los fraccionarios se redondean al componente: control de 36 de alto, radio 9, borde de campo 1,5 `borde_campo`, error de campo 2 px `error` radio 9, foco 2 px `tinta` con radio del control + 3 (D6). Letra al entero (A12): título 26 (login) y 23 (registro y 84:x), subtítulo 12, etiqueta 11, migas 10, texto de error 10.

**C-5 Temas.** El Figma solo tiene claro y oscuro. **No existen marcos Rosa ni Enfoque** de esta página (NO MEDIDO: no hay huella). Con variables, la página se ve en los cuatro temas sin marco propio; la columna Rosa|Enfoque de «Nodos» lleva `-`. El contraste de las variables ya lo cubre TEMAS_Y_TOKENS §8.

**C-6 Errores (regla de Paula y D10).**
- Los errores de forma se devuelven **todos a la vez**, uno por campo, con el literal del CA, bajo el campo, en `error`, con borde de campo `error` 2 px (R10, E13) e ícono de 16 (E19).
- Un **solo código estable** por fallo: la clave de `messages.es.json` (cliente), con el código de cable de `contratos.md` al lado. Ningún fallo previsible termina en `internal.unexpected` ni en `ERROR_INESPERADO`.
- El tipo de error de servidor se decide por **causa** (D10), no por pantalla.
- **Los literales no se redactan aquí:** cada uno se copia de `apps/desktop/src/types/messages.es.json` (fuente única, con G1* de CONSISTENCIA para los nombres). Si un literal de esta tabla difiere de esa clave, manda la clave.
- **C-6 no redacta textos:** cada literal se copia de `messages.es.json`, de `contratos.md` o del catálogo G1* de CONSISTENCIA. Los nombres G1 que difieren de la clave (G1m `CIERRE_SESION_FALLIDO`; G1r `GOOGLE_NO_DISPONIBLE`, `NAVEGADOR_NO_ABRE`, `CORREO_GOOGLE_MUY_LARGO`) son alias del catálogo; el código estable es la clave de `messages.es.json`.

| Código de cable (contratos) | Clave cliente = código estable | Literal | Dónde |
|---|---|---|---|
| `alias.required`, `email.required`, `password.required`, `password_confirmation.required`, `code.required` | `CAMPO_OBLIGATORIO` | «Este campo es obligatorio.» | bajo el campo |
| `alias.too_long` | `ALIAS_MUY_LARGO` | «El alias no puede superar los 30 caracteres.» | bajo Alias |
| `email.invalid` | `CORREO_INVALIDO` | «Diligencia un correo electrónico válido.» | bajo Correo |
| `email.too_long` | `CORREO_MUY_LARGO` | «El correo electrónico no puede superar los 64 caracteres.» | bajo Correo |
| `password.invalid` | `CONTRASENA_INVALIDA` | «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» | bajo Contraseña |
| `password_confirmation.mismatch` | `CONTRASENAS_NO_COINCIDEN` | «Las contraseñas no coinciden.» | bajo Confirmar |
| `password.same_as_current` | `CONTRASENA_IGUAL_A_LA_ACTUAL` | «Elige una contraseña distinta de la actual.» | bajo Nueva contraseña |
| `code.incorrect` | `CODIGO_INCORRECTO` | «El código no es correcto. Revísalo e intenta de nuevo.» | bajo Código |
| `code.expired` | `CODIGO_VENCIDO` | «El código venció. Solicita uno nuevo.» | bajo Código |
| `auth.invalid_credentials` | `CREDENCIALES_INCORRECTAS` | «Correo electrónico o contraseña incorrectos.» | píldora Error |
| `auth.user_banned` (RD-88) | `CUENTA_BLOQUEADA` | el de `messages.es.json` (clave `CUENTA_BLOQUEADA`; RD-88) | píldora Error |
| `auth.rate_limited` | `DEMASIADOS_INTENTOS` | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | píldora Error |
| `session.expired` (RD-89) | `SESION_VENCIDA` | «Tu sesión venció. Inicia sesión de nuevo.» | píldora Error |
| `net.offline` | `SIN_CONEXION_INICIO` / `SIN_CONEXION_REGISTRO` / `SIN_CONEXION_RECUPERAR` (en Recuperar, el texto visible lo fija RD-18: `SIN_CONEXION_ENVIAR_CODIGO`, ver AC-06) | «No hay conexión a internet. Conéctate para iniciar sesión.» / «…para crear tu cuenta.» / «…para recuperar tu contraseña.» | franja + botones deshabilitados |
| `email.already_registered` | `CORREO_YA_REGISTRADO` | «Este correo electrónico ya está registrado.» + enlaces «Iniciar sesión» y «Recuperar contraseña» | píldora Error |
| `code.resend_too_soon` | `REENVIO_EN_SEGUNDOS` | «Puedes pedir un nuevo código en <segundos restantes> s.» | bajo «Reenviar código» |
| EV-02 `auth_google_result` | `GOOGLE_CANCELADO` / `GOOGLE_ERROR` / `GOOGLE_CORREO_MUY_LARGO` / `NO_PUDIMOS_ABRIR_EL_NAVEGADOR` | los literales de `messages.es.json` (AC-03 parte 4 los copia) | píldora Error |
| `service.unavailable` | `SERVICIO_NO_DISPONIBLE` | el de `messages.es.json` (clave `SERVICIO_NO_DISPONIBLE`) | píldora Error |
| `auth.sign_out_failed` | `NO_PUDIMOS_CERRAR_LA_SESION` (G1m: `CIERRE_SESION_FALLIDO`) | «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.» | píldora Error |
| `internal.unexpected` | `ERROR_INESPERADO` | genérico, solo para lo imprevisible | píldora Error |

La tabla es única para las pantallas; cada pieza dice cuáles filas aplica.

**C-7 Tipo de aviso por causa (G4, G5, C6, D7, A8).** G4 manda: **un solo patrón para todo error de servidor: píldora de error con ícono y «×»** (MB-06 y MB-24), cada causa con su código. La franja del Figma (`#fae6dd`) se conserva solo para el estado «sin conexión» (no es un error de servidor: dura mientras no haya red y va con los botones deshabilitados), con `relleno_vencida` y texto `error` (C6).
- **Píldora de error** (hasta que la persona la cierre, G5; el Figma las cierra a 6 s): `auth.invalid_credentials`, `auth.user_banned`, `auth.rate_limited`, `session.expired`, los cuatro fallos de Google/navegador y `email.already_registered` (con dos acciones separadas: «Iniciar sesión» y «Recuperar contraseña», G4).
- **Píldora de éxito** (4 s, G5): `CONTRASENA_ACTUALIZADA`, `SESION_CERRADA`, `CODIGO_ENVIADO`, `CODIGO_REENVIADO`.
- **Franja de sin conexión**: `SIN_CONEXION_*`, con ícono de 16 y `role="status"`; sin «×»; se quita sola al volver la red.
- Pausa con cursor y foco (A-07). **Posición, apilado y reemplazo: los fija MB-06** (que trae el conflicto D7 frente a RD-63/RD-104). Esta spec no fija una posición propia; las coordenadas del Figma (y=12 en login y registro, y=4 en 84:x) quedan como MEDIDO de referencia. Duraciones: G5 (Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrar).
- **Por qué cambian las franjas del Figma a píldora:** el Figma mezcla tres patrones (incoherencia 10); sin ícono ni cierre la franja de error no se puede descartar. Las alturas de nota del Figma con franja (464, 477, 490) dejan de aplicar a esas causas (la píldora no empuja la nota): quedan como MEDIDO de referencia.

**C-8 Animaciones comunes.** A-05, A-06 y A-07 (avisos), A-08 (cambio de pantalla: solo fundido; el Figma navega sin transición), A-26 (foco), A-27 (campo), A-29 (enlaces y ojo), A-30 (tooltip del ojo: retraso 400 ms con puntero, 0 con foco). Reduced-motion lo resuelve ANIMACIONES §4.

**C-9 Pruebas y `data-testid`.** Vitest por parte; Playwright para geometría; una prueba por CA. Las pantallas de cuenta **no tienen hoy ningún `data-testid`** (grep vacío): toda «Estructura» de abajo es NUEVA (diferencia M en cada pieza).

**C-10 Placeholders (D17).** Solo como ejemplo de formato, nunca en lugar de la etiqueta: correo «nombre@ejemplo.com» en todo campo de correo (login, registro, recuperar); código «123456» (PROPUESTA con valor neutro, se anota en `docs/DUDAS.md`; el Figma deja el campo del código sin texto, incoherencia 14). Alias y contraseñas, sin placeholder.

**C-11 Alturas de la nota con control de 36 (A1).** El Figma mide la nota con controles de 27 a 34. Con 36 la nota crece: login +20,5 (2 campos +5,5 c/u, botón +4, Google +5,5); registro +51,5 (4 campos +9 c/u, botón +7,5, Google +8); 84-x +2 por campo. La altura de la nota es **automática** (contenido + paddings) y el texto de error no tiene caja fija (A7). Las alturas del Figma por estado se registran como MEDIDO para comparar; la implementación no las fija.

**C-12 Menos desplazamiento (regla decidida: «el menos scroll posible», RD-20, RD-21).** El cuerpo de cuenta no añade scroll propio. Primero se hace caber el contenido: nota de alto automático (C-11), espacios compactados entre campos cuando hay errores y ayuda de contraseña en una sola frase. El desplazamiento de la ventana (RD-07) es el último recurso. La nota mide al menos 420 px de alto (RD-20) y por debajo de 1000 px de ancho el margen lateral baja a 16 px (RD-21).

---

## AC-01 · Marco de cuenta: marca, selector de apariencia, Windi y nota (partes comunes)

Familias: ninguna propia; son las partes repetidas de las 50 (base 66:4/66:83, 66:162/66:246, 84:2/84:12 y hermanas). Código: `cuenta/MarcoDeCuenta.tsx`, `cuenta/PasoCentrado.tsx`, `cuenta/IndicadorDePasos.tsx`, `cuenta/SelectorDeModo.tsx`, `cuenta/cuenta.css` (591 líneas).

### 1 · Nodos

| Parte | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Marco con marca, Windi, nota (login) | 66:4 | 66:83 | - | - |
| Ídem (registro) | 66:162 | 66:246 | - | - |
| Nota centrada sin Windi (84-x, 88-x) | 84:2, 84:22, 84:42, 84:62, 88:2 | 84:12, 84:32, 84:52, 84:72, 88:3 | - | - |
| Selector de apariencia | «Apariencia · Modo claro» (en 66:4, 66:162) | «Apariencia · Modo oscuro» (66:83, 66:246) | - | - |

### 2 · Estructura (`data-testid`, todos NUEVOS)

```
[cuenta-raiz]                      (.wg-cuenta-raiz, fondo marco)
  [cuenta-cabecera]
    [cuenta-marca]                 símbolo + «windgets»
    [cuenta-selector-apariencia]   solo en login y registro (ver 8)
  [cuenta-windi]                   solo login y registro
    [cuenta-globo] [cuenta-ilustracion] [cuenta-globo-punta]
  [cuenta-nota]                    nota con esquina doblada
    [cuenta-pliegue]
    [cuenta-migas] [cuenta-regresar]   solo 84-x y 88-2
    [cuenta-titulo] [cuenta-subtitulo]
    [cuenta-franja]                franja de aviso (C-7)
    ...campos y acciones de cada pieza
```

### 3 · Medidas (marco 1093×560; origen C-1)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Marca login | símbolo 28,5×26 en (160;28,5); texto «windgets» 102×26 en (195;27,5), Bold 22 → 24 | `tinta` | MEDIDO (66-4); tamaño PROPUESTA (A12, F1 4: 21,9 / 19,3 / 22 se unifican a 22) |
| Marca registro | símbolo 25,5×23 en (205,5;25,5); texto 90×23 en (236,5;24) | `tinta` | MEDIDO (66-162) |
| Marca 84-x | símbolo 30×27 en (457;40,5); texto 102×26 en (496;39,5) | `tinta` | MEDIDO (84-2) |
| Selector login | 150×27,5 en (739;23), radio 7,5 → 9, borde 0,7 → 1; opción 72,5×22 radio 5,5 en (742;26) y (814;26) | fondo `superficie`, borde `borde_campo`; seleccionada `secundario` con texto `sobre_seleccion` | MEDIDO; tokens PROPUESTA |
| Selector registro | 132,5×24 en (716,5;20,5); opción 64×19,5 | ídem | MEDIDO |
| Globo login | 239×49 en (196;183,5), radio 10,2 → 12, borde 1; sombra dura en (198;187); texto Medium 15 «Soy Windi.» en dos líneas, 172×36 en (211;191) | `superficie_alta`, `borde`, texto `tinta` | MEDIDO; radio PROPUESTA (MB-05) |
| Punta del globo login | 28×16,5 en (385,5;231,5) | `superficie_alta` | MEDIDO |
| Windi login | 356×221,5 en (139;246) | MB-05 | MEDIDO |
| Globo registro | 160×44,5 en (240;171,5); texto 130×30 en (251;177,5) | ídem | MEDIDO (66-162) |
| Windi registro | 332×339 en (240;150); punta 24,5×14,5 en (356;215) | MB-05 | MEDIDO |
| Nota login | 377×427 en (512,5;92), radio 3,4, esquina doblada 26×26 en (863,5;92) | fondo `superficie`, borde `borde`, sombra `sombra` | MEDIDO (66-4); tokens PROPUESTA (RD-16) |
| Nota registro | 332,5×432 en (516,5;64); pliegue 23×23 | ídem | MEDIDO (66-162) |
| Nota 84-x | 404 de ancho en (344,5;93,5): 299 (84:2, 84:22, 84:42), 378,5 (84:62), 352,5 (88:2) | ídem | MEDIDO |
| Regresar | 32×32 en (364,5;139,5), `Botón ícono` Fila | MB-10 | MEDIDO |
| Migas | Regular 10, texto en (370,5;114), separador « / » | `texto` | MEDIDO; MB-20 |
| Título 84-x | Bold 23 en (404,5;142), 28 de alto; subtítulo 12 en (370;180) | `tinta`, `texto` | MEDIDO |
| Corte de composición | 1000 px (RD-07); 570 px de nota centrada (RD-16) | - | DECISIÓN de RD (no medido en el Figma) |

Fondo oscuro único: ver C-2. Posición del globo y de Windi en oscuro: el Figma los mueve (claro 196;183,5, oscuro 199,5;172, F1 desvío 3). **Se usa la posición del claro en todos los temas** (un componente no cambia de sitio con el tema; MB-05).

### 4 · Textos literales

«windgets» · «Soy Windi.» / «¿Qué organizamos hoy?» (login) · «¡Soy Windi!» / «¿Creamos tu cuenta?» (registro) · «Claro» · «Oscuro» · «Regresar» (nombre accesible del botón ícono; el Figma no lo muestra) · tooltip del selector: NO MEDIDO (no existe en el Figma).
D11 (saludo con alias, sin emoji) **no aplica a este globo**: aún no hay sesión ni alias; se conserva el literal del Figma. D11 aplica al saludo de la ventana principal (MB-08).

### 5 · Estados

Selector: reposo, hover (A-29), foco, seleccionado. Marco: reposo. Sin «cargando» (no existe en el Figma; no se inventa). Ancho menor de 1000 px: RD-07 oculta a Windi y su globo; RD-21 fija el corte en `width < 1000px` y solo baja el margen lateral a 16 px (NO MEDIDO en el Figma).

### 6 · Teclado y foco

Tab en orden de lectura: selector, migas, Regresar, campos, acciones. Foco: D6 (2 px `tinta`, radio del control + 3). Selector como grupo de dos opciones exclusivas, flechas izquierda/derecha cambian y aplican (PROPUESTA; `role="radiogroup"`). `forced-colors`: RD-23 (ya en `cuenta.css:575`).

### 7 · Animaciones

A-08 (cambio de pantalla, solo fundido), A-29 (hover del selector y de migas), A-26 (foco).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| No se pudo aplicar el tema de una cuenta nueva (RD-15, RD-95) | `TEMA_INICIAL_NO_APLICADO` (ya existe: `cuenta/textosDelRediseno.ts` y `temaInicial.ts:88`; se conserva) | «No pudimos aplicar el tema <nombre del tema>. Puedes elegirlo en Personalización.» | píldora Advertencia (`temaInicial.ts:88`) |
| Sin conexión | ver C-6 | por pantalla | franja |

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Paleta fija de cuenta y fuente Rubik (RD-04, RD-06) frente a variables y fuente del tema | `cuenta.css:8-76` (`.wg-cuenta-raiz[data-modo]` redefine los tokens, `font-family: var(--wg-fuente)` en :76 ya sigue el tema) | M: quitar los bloques `[data-modo]` de :8-69 y usar los tokens del tema; marco (`marco`), nota (`superficie`), paso actual (`superficie_baja`) y campos (`borde_campo`) salen todos de variable, ningún hex propio |
| Dos fondos oscuros y fondo claro sin variable | `cuenta.css:8-69` | S |
| Borde del botón principal en oscuro `#18131c` | `cuenta.css` (bloque `[data-modo='oscuro']`) | S: usar `borde` |
| Selector también en pasos centrados (el Figma no lo trae, incoherencia 17) | `cuenta.css:451` (`.wg-cuenta--centrada .wg-selector-modo`) | S: RD-16 deja el selector «Apariencia» a la derecha también en los pasos centrados; se conserva |
| Sin `data-testid` | todo `screens/cuenta/` | M |
| Nota con esquina doblada y silueta | `MarcoDeCuenta.tsx` | S (ya existe) |

### 10 · Pruebas

Playwright: geometría de la tabla 3 en claro y oscuro (marca, selector, globo, nota, pliegue). Vitest: el selector cambia el tema y `data-modo`; sin ningún hex fijo en `cuenta.css` (prueba estática); Windi en la misma posición en ambos temas; un solo fondo oscuro.

---

## AC-02 · Inicio de sesión (HE-01-HU04, HE-01-HU05)

Familias (7): base 66:4/66:83 y 6 estados (campos obligatorios, correo no válido, correo muy largo, sin conexión, mostrar contraseña, ocultar contraseña; los 10 avisos de servidor van en AC-03). Código: `sign_in/SignIn.tsx` (120 líneas), `cuenta/google.tsx`, `cuenta/validaciones.ts`.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base | 66:4 | 66:83 | - | - |
| Campos obligatorios | 2249:1353 | 2250:1618 | - | - |
| Correo no válido | 2249:1452 | 2250:1717 | - | - |
| Correo muy largo | 2249:1550 | 2250:1815 | - | - |
| Sin conexión | 2249:2461 | 2250:2726 | - | - |
| Mostrar contraseña (tooltip) | 2250:4627 | 2250:4829 | - | - |
| Ocultar contraseña (tooltip, contraseña visible) | 2250:4728 | 2250:4930 | - | - |

### 2 · Estructura

```
[cuenta-nota]
  [login-titulo]  [login-subtitulo]
  [login-correo-etiqueta] [login-correo] [login-correo-error]
  [login-contrasena-etiqueta] [login-contrasena] [login-contrasena-ojo] [login-contrasena-error]
  [login-olvide]                         enlace «¿Olvidaste tu contraseña?»
  [login-franja]                         aviso (AC-03 y sin conexión)
  [login-entrar]                         Botón Principal
  [login-divisor]                        «o»
  [login-google]                         Botón Secundario con logo
  [login-registro]                       «¿No tienes cuenta?» + enlace «Regístrate»
```

### 3 · Medidas (marco 1093×560; origen C-1; huella 66-4)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Título «Bienvenido a Windgets» | (544;121) 291×31, Bold 26 | `tinta` | MEDIDO |
| Subtítulo | (544,5;158,5) 145×14, Regular 12 | `texto` | MEDIDO |
| Etiqueta Correo | (544,5;201,5) 106×13, Medium 11 | `tinta` | MEDIDO |
| Campo Correo | (544,5;218,5) 313×30,5 → 313×36 | `superficie`, `borde_campo` 1,5, radio 9 | MEDIDO (A1) |
| Etiqueta Contraseña | (544,5;268,5) | `tinta` | MEDIDO |
| Campo Contraseña | (544,5;285,5) 313×30,5 → 313×36; ojo 30×27,5 en (819;288) con ícono 16,5 en (825;293) | ídem; ojo `texto` | MEDIDO |
| «¿Olvidaste tu contraseña?» | (726;328) 129×12, Medium 11, alineado a la derecha | `secundario` | MEDIDO |
| Botón «Iniciar sesión» | (544,5;364,5) 313×32 → 313×36, radio 9, sombra 3;5 | `accion`, `borde`, `sombra` | MEDIDO (A1, C5) |
| Divisor «o» | líneas 143,5 en (544,5;419,5) y (713;419,5); «o» 6×12 en (697,5;412,5) | `linea`, `texto` | MEDIDO |
| Botón Google | (544,5;436,5) 313×30,5 → 313×36; logo 14×14 en (631,5;445) | Secundario | MEDIDO |
| «¿No tienes cuenta?» + «Regístrate» | (615;487) y (716,5;487), Regular 11 / Medium 11 | `texto` / `secundario` | MEDIDO |
| Separación etiqueta → campo 3; campo → etiqueta siguiente 20 | | | MEDIDO (F1 28) |
| Alto de nota | Figma: 427 base, 432 campos obligatorios; automático (C-11) | | MEDIDO |

Campos obligatorios, correo no válido y muy largo: mismo diseño; solo cambia el borde del campo (`error` 2 px, radio 9, MEDIDO 1,3 en el Figma → R10) y el texto de error bajo el campo (Regular 10, `error`, alto automático; MEDIDO 9,8).
Sin conexión: franja 313×42 en (544,5;173,5) por encima del título del primer campo; botones «Iniciar sesión» y «Continuar con Google» deshabilitados 313×32 y 313×30,5 (MB-10 Deshabilitado); la sombra del botón se quita.
Tooltips del ojo: 126×36 en (771;314) («Mostrar contraseña») y 124×36 en (772;314) («Ocultar contraseña»), MB-21 «Debajo».

### 4 · Textos literales

«Bienvenido a Windgets» · «Qué bueno verte de nuevo.» · «Correo electrónico *» · «Contraseña *» · «¿Olvidaste tu contraseña?» · «Iniciar sesión» · «o» · «Continuar con Google» · «¿No tienes cuenta?» · «Regístrate» · placeholder del correo «nombre@ejemplo.com» (D17, C-10). Tooltips: «Mostrar contraseña» / «Ocultar contraseña». Errores de campo: C-6 (`CAMPO_OBLIGATORIO`, `CORREO_INVALIDO`, `CORREO_MUY_LARGO`). Franja de sin conexión: «No hay conexión a internet. Conéctate para iniciar sesión.»

### 5 · Estados

Reposo; hover, foco (D6), error de campo; contraseña oculta/visible (el Figma alterna con las variables 174:3/174:4 compartidas por todos los ojos; **cada ojo es independiente** en código, incoherencia 12); botón deshabilitado sin conexión; **cargando**: NO MEDIDO (no existe en el Figma). El código deshabilita el botón mientras `enCurso` (`useEnvioUnico`); se conserva y se anota como DECISIÓN de código, sin diseño nuevo. Contador: el Figma no trae contador en login; el correo lleva `maximo` 64 en el código (A9 pide contador en todo campo con límite → PROPUESTA: contador «0/64» en el correo, como registro).

### 6 · Teclado y foco

Orden: selector, correo, contraseña, ojo, «¿Olvidaste…?», «Iniciar sesión», Google, «Regístrate». Enter envía el formulario. Con errores de forma, el foco va al primer campo inválido y se devuelven todos a la vez (C-6). El ojo es botón con `aria-label` «Mostrar contraseña»/«Ocultar contraseña» y `aria-pressed`. La franja de error usa `role="alert"`.

### 7 · Animaciones

A-27 (campo), A-29 (ojo, enlaces), A-30 (tooltip del ojo), A-05/A-06 (píldoras de AC-03), A-08. El easing del ojo es una acción CONDITIONAL, no una transición: NO MEDIDO.

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Correo vacío / contraseña vacía | `CAMPO_OBLIGATORIO` | «Este campo es obligatorio.» | bajo cada campo, a la vez |
| Correo sin formato válido | `CORREO_INVALIDO` | «Diligencia un correo electrónico válido.» | bajo Correo |
| Correo de más de 64 | `CORREO_MUY_LARGO` | «El correo electrónico no puede superar los 64 caracteres.» | bajo Correo |
| Sin red | `SIN_CONEXION_INICIO` | «No hay conexión a internet. Conéctate para iniciar sesión.» | franja |
| Causas de servidor y de Google | ver AC-03 | | |

La contraseña de login solo se valida como obligatoria (no se le exige el formato: la regla de formato es de crear contraseña, HE-01-HU02). DECISIÓN heredada del código, `SignIn.tsx:28`.

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Todos los errores de servidor salen como franja `wg-aviso`; el Figma usa píldora para credenciales incorrectas | `SignIn.tsx:46-53` (`fallo`) y `:77` | M |
| `auth.user_banned` y `session.expired` no tienen manejo propio: caen en `setAviso(error.message || ERROR_INESPERADO)`; `session.expired` solo existe como tipo en `types/index.ts:441` | `SignIn.tsx:50` | M (regla de errores visibles) |
| Sin conexión: franja de texto + `disabled`; falta el ícono y `relleno_vencida` | `SignIn.tsx:76` | S |
| `service.unavailable` sin mensaje propio: cae a `error.message \|\| ERROR_INESPERADO`; se mapea por `error.code` a `SERVICIO_NO_DISPONIBLE` | `SignIn.tsx:44-54` | S |
| Sin `data-testid` | `SignIn.tsx` | M |
| Sin contador en el correo; sin placeholder del correo | `SignIn.tsx` | S |
| Ojo con tooltip ya existe (`CampoTexto.tsx:84-88`) | | cumple |
| Foco de campo y botón (D6) | `cuenta.css:368-371` y MB-10/11 | S |

### 10 · Pruebas

Una por CA de HE-01-HU04 y HU05: obligatorios a la vez con el mismo literal; correo no válido; correo largo; sin conexión (franja y botones deshabilitados); ojo alterna `type` y nombre; Enter envía; foco al primer inválido; geometría Playwright (campo 313×36, botón 313×36). Cada causa de AC-03 con una petición real, no solo leyendo (regla de Paula).

---

## AC-03 · Avisos del inicio de sesión (causas de servidor, de Google y de cierre de sesión)

Familias (10): credenciales incorrectas, cuenta bloqueada, demasiados intentos, sesión vencida, Google cancelado, Google no disponible, correo de Google muy largo, navegador no abre, contraseña actualizada, sesión cerrada (10 en total; las 8 primeras son estados del login, 2249:1648 a 2249:2362; las dos últimas llegan de otra pantalla). Código: `sign_in/SignIn.tsx`, `cuenta/google.tsx`.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Credenciales incorrectas | 2249:1648 | 2250:1913 | - | - |
| Cuenta bloqueada | 2249:1768 | 2250:2033 | - | - |
| Demasiados intentos | 2249:1867 | 2250:2132 | - | - |
| Sesión vencida | 2249:1966 | 2250:2231 | - | - |
| Google cancelado | 2249:2065 | 2250:2330 | - | - |
| Google no disponible | 2249:2164 | 2250:2429 | - | - |
| Correo de Google muy largo | 2249:2263 | 2250:2528 | - | - |
| Navegador no abre | 2249:2362 | 2250:2627 | - | - |
| Contraseña actualizada | 2249:2560 | 2250:2825 | - | - |
| Sesión cerrada | 2251:9100 | 2251:9227 | - | - |

### 2 · Estructura

`[login-pildora]` (Mensaje emergente, MB-24) con `[login-pildora-icono]`, `[login-pildora-texto]` y `[login-pildora-cerrar]`, para las diez causas. Una sola estructura; el tipo (Error o Éxito) cambia el borde y el ícono.

### 3 · Medidas

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Píldora credenciales | 343×42 en (361;12), radio 21, `H g6 p5/3/5/12` | borde `error`, relleno `superficie_alta` | MEDIDO; ancho automático |
| Píldora contraseña actualizada | 408×42 en (296;12) | borde `estado_completada` | MEDIDO |
| Píldora sesión cerrada | 170×42 en (462;12) | ídem | MEDIDO |
| Posición | y=12 en el Figma (MEDIDO, referencia); posición final y apilado: MB-06 | | MB-06 |
| Franja del Figma 1 línea (bloqueada, sesión vencida, Google cancelado, navegador): medida de referencia, pasa a píldora | 313×29 en (544,5;180), radio 5,7 → 9, texto Regular 11 a 9 px del borde izquierdo y 8 del superior | (referencia) | MEDIDO |
| Franja del Figma 2 líneas (demasiados intentos, Google no disponible): referencia | 313×42 en (544,5;173,5) | (referencia) | MEDIDO |
| Franja del Figma 3 líneas (correo de Google muy largo): referencia | 313×55 en (544,5;167) | ídem | MEDIDO |
| Alto de nota | 464 (1 línea), 477 (2), 490 (3) frente a 427; la píldora no empuja la nota | automático (C-11) | MEDIDO |

### 4 · Textos literales

| Causa | Literal |
|---|---|
| `CREDENCIALES_INCORRECTAS` | «Correo electrónico o contraseña incorrectos.» |
| `CUENTA_BLOQUEADA` | «Tu cuenta está bloqueada. Escríbenos para revisarla.» |
| `DEMASIADOS_INTENTOS` | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» |
| `SESION_VENCIDA` | «Tu sesión venció. Inicia sesión de nuevo.» |
| `GOOGLE_CANCELADO` | «Se canceló el inicio de sesión con Google.» |
| `GOOGLE_ERROR` | «No fue posible iniciar sesión con Google. Intenta de nuevo.» |
| `GOOGLE_CORREO_MUY_LARGO` | «No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.» |
| `NO_PUDIMOS_ABRIR_EL_NAVEGADOR` | «No pudimos abrir el navegador. Intenta de nuevo.» |
| `CONTRASENA_ACTUALIZADA` | «Tu contraseña fue actualizada. Ya puedes iniciar sesión.» |
| `SESION_CERRADA` | «Sesión cerrada.» |

### 5 · Estados

Píldora: visible, en pausa (cursor o foco), oculta. Éxito se oculta a los 4 s; Error se queda hasta cerrar con «×» (G5). Reemplazo y apilado: MB-06.

### 6 · Teclado y foco

Píldora de error con `role="alert"`, la de éxito con `role="status"`; «×» enfocable y cierra con Enter o Espacio; Escape cierra el aviso con foco dentro (PROPUESTA). El foco no se mueve al aviso. «Correo ya registrado» (AC-04) lleva enlaces dentro: Tab los alcanza.

### 7 · Animaciones

A-05 entra, A-06 sale (fundido 0,15 s, el Figma dice DISSOLVE 0,15 s EASE_OUT), A-07 pausa. La variante «En pausa» al pasar el cursor está en el Figma.

### 8 · Errores

Esta pieza *es* la de errores. Mapeo causa → código → tipo: C-6 y C-7. Regla: un código por fallo, con el literal de la tabla 4. EV-02 `auth_google_result`: `success` entra; `email_too_long` → `GOOGLE_CORREO_MUY_LARGO`; cancelado → `GOOGLE_CANCELADO`; otro → `GOOGLE_ERROR`; falla al abrir el navegador → `NO_PUDIMOS_ABRIR_EL_NAVEGADOR`. Sin conexión en Google: DP-03 (botón deshabilitado, no hay franja propia).

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Todo error de servidor es franja `wg-aviso`; G4 pide píldora Error con ícono y «×» que no se cierra sola | `SignIn.tsx:46-53, 77` | M |
| `CUENTA_BLOQUEADA` (RD-88) y `SESION_VENCIDA` (RD-89) sin rama propia | `SignIn.tsx:50` | M |
| Google ya separa cancelado, correo largo y otros | `cuenta/google.tsx` | cumple |
| `Aviso` es caja fija sin ícono ni «×»; queda solo para sin conexión (con ícono) | `ui/Aviso` | S (MB-24) |
| «Contraseña actualizada» y «Sesión cerrada»: llegan al abrir el login (`abrirCuenta('sign_in')`) pero hay que comprobar que se muestren como píldora al llegar | `recovery/NuevaContrasena.tsx`, `settings/CerrarSesion.tsx` | S, NO VERIFICADO el momento exacto |

### 10 · Pruebas

Una por causa con petición real (Núcleo simulado con cada código de cable): píldora Error para las ocho causas de servidor (permanece más de 6 s y se cierra con «×»), píldoras de éxito a los 4 s, pausa con el cursor, reemplazo y apilado, `role="alert"`. Ningún caso llega a `ERROR_INESPERADO`.

---

## AC-04 · Registro (HE-01-HU01, HE-01-HU02)

Familias (6): base 66:162/66:246 y 5 estados. Código: `register/Register.tsx` (186 líneas), `cuenta/IndicadorDePasos.tsx`, `cuenta/validaciones.ts`.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base | 66:162 | 66:246 | - | - |
| Campos obligatorios | 2249:2691 | 2250:2956 | - | - |
| Datos no válidos | 2249:2803 | 2250:3068 | - | - |
| Correo muy largo | 2249:2915 | 2250:3180 | - | - |
| Correo ya registrado | 2249:3024 | 2250:3289 | - | - |
| Sin conexión | 2249:3144 | 2250:3409 | - | - |

### 2 · Estructura

```
[cuenta-nota]
  [registro-pasos]                    chip «1 Formulario — 2 Verificar correo»
  [registro-titulo] [registro-subtitulo]
  [registro-alias] [registro-alias-error] [registro-alias-contador]
  [registro-correo] [registro-correo-error] [registro-correo-contador]
  [registro-contrasena] [registro-contrasena-ojo] [registro-contrasena-ayuda] [registro-contrasena-error] [registro-contrasena-contador]
  [registro-confirmacion] [registro-confirmacion-ojo] [registro-confirmacion-error]
  [registro-crear]  [registro-divisor]  [registro-google]
  [registro-ingresar]                 «¿Ya tienes cuenta?» + «Inicia sesión»
  [login-pildora] / [registro-franja] (sin conexión)
```

### 3 · Medidas (huella 66-162; origen C-1)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Chip de paso | 85,5×18 en (544,5;78), radio 4,2; «1   Formulario» (551,5;81,5) y «—    2   Verificar correo» (636;82) | relleno `superficie_baja`, texto `tinta`/`texto` | MEDIDO; token PROPUESTA (el Figma usa `#f1e6ff`, RD-09) |
| Título «Crea tu cuenta» | (544;98) 169×27, Bold 23 | `tinta` | MEDIDO |
| Subtítulo | (544,5;126) 114×12, Regular 11 | `texto` | MEDIDO |
| Alias | etiqueta (544,5;150); campo (544,5;165) 276×27 → 276×36 | `borde_campo` 1,5, radio 9 | MEDIDO (A1) |
| Correo | etiqueta (544,5;200); campo (544,5;215); contador «0/64» (797,5;200) 20×10, Regular 9 | `texto` | MEDIDO |
| Contraseña | etiqueta (544,5;250); campo (544,5;265); contador (797,5;250); ojo 30×27,5 en (788,5;265) | ídem | MEDIDO |
| Ayuda de contraseña | (544,5;296) y (544,5;307), Regular 9, en una sola frase | `texto` | MEDIDO; el salto de línea fijo sale (incoherencia 16) |
| Confirmar contraseña | etiqueta (544,5;323); campo (544,5;338); ojo en (788,5;338) | ídem | MEDIDO |
| Botón «Crear cuenta» | (544,5;380) 276×28,5 → 276×36, sombra 3;5 | `accion`, `borde`, `sombra` | MEDIDO (A1) |
| Divisor «o» y Google | (544,5;420) líneas 126; Google (544,5;432) 276×28 → 276×36 | `linea`; Secundario | MEDIDO |
| Pie | «¿Ya tienes cuenta?» (607,5;472) y «Inicia sesión» (696;472) | `texto` / `secundario` | MEDIDO |
| Alto de nota | Figma: 432 base, 455 obligatorios, 465 no válidos, 439 correo largo, 482 sin conexión; con A1 automático (C-11) | | MEDIDO |
| Píldora «Correo ya registrado» | 554×42 en (150;12) | Error | MEDIDO (referencia); posición: MB-06 |

Alias: contador «0/30» ya existe y se conserva (`Register.tsx`, `maximo={ALIAS_MAX}`; el Figma no lo trae, incoherencia 15; A9). Confirmar contraseña: contador «0/64» PROPUESTA (misma regla A9).

### 4 · Textos literales

«¡Soy Windi!» / «¿Creamos tu cuenta?» · «1   Formulario» · «2   Verificar correo» · «Crea tu cuenta» · «Solo te toma un minuto.» · «Alias *» · «Correo electrónico *» · «Contraseña *» · «Confirmar contraseña *» · «8 a 64 caracteres con al menos una mayúscula, una minúscula y un número.» · «Crear cuenta» · «o» · «Continuar con Google» · «¿Ya tienes cuenta?» · «Inicia sesión». Placeholder del correo «nombre@ejemplo.com». Errores y sin conexión: C-6; el de «Correo ya registrado»: «Este correo electrónico ya está registrado.» con acciones «Iniciar sesión» y «Recuperar contraseña».

### 5 · Estados

Reposo, foco, error de campo (hasta 4 a la vez), ojo independiente por campo, contadores, deshabilitado sin conexión (el Figma deja el botón «Crear cuenta · deshabilitado» pulsable y va a 84:2: **no se implementa**, el botón queda deshabilitado de verdad, incoherencia 8), cargando (NO MEDIDO; deshabilitado mientras `enCurso`). Alias repetido: **no hay error** (HE-01-HU01-CA04: se envía el código igual).

### 6 · Teclado y foco

Orden de lectura; Enter envía; con errores el foco va al primer campo inválido y se devuelven todos a la vez. Contadores `aria-live="off"`; el error de campo se enlaza con `aria-describedby`. En la píldora «Correo ya registrado» las dos acciones son botones enfocables; «Iniciar sesión» lleva a 66:4 (HU01-CA09).

### 7 · Animaciones

A-27 (campo), A-29 (ojos y enlaces), A-05/A-06/A-07 (píldora), A-08 (paso Formulario → Verificar correo: fundido).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Campos vacíos | `CAMPO_OBLIGATORIO` ×4 | «Este campo es obligatorio.» | bajo cada campo |
| Alias de más de 30 | `ALIAS_MUY_LARGO` | «El alias no puede superar los 30 caracteres.» | bajo Alias |
| Correo con formato inválido / de más de 64 | `CORREO_INVALIDO` / `CORREO_MUY_LARGO` | C-6 | bajo Correo |
| Contraseña sin cumplir la regla | `CONTRASENA_INVALIDA` | C-6 | bajo Contraseña |
| Confirmación distinta | `CONTRASENAS_NO_COINCIDEN` | «Las contraseñas no coinciden.» | bajo Confirmar |
| Correo con cuenta | `CORREO_YA_REGISTRADO` | C-6 | píldora Error con dos acciones |
| Sin red | `SIN_CONEXION_REGISTRO` | «No hay conexión a internet. Conéctate para crear tu cuenta.» | franja |
| Demasiados intentos y falla del servicio (`auth.rate_limited`, `service.unavailable`; IPC-AUTH-01) | `DEMASIADOS_INTENTOS` / `SERVICIO_NO_DISPONIBLE` | los de `messages.es.json` | píldora Error |
| Falla del servicio | `SERVICIO_NO_DISPONIBLE` | el de `messages.es.json` | píldora Error |

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| «Correo ya registrado» en caja `wg-aviso` con enlaces; G4 pide píldora Error con ícono, «×» y acciones separadas | `Register.tsx:120` (`role="alert"`) | M |
| `registrado` se limpia al cambiar el correo | `Register.tsx:64` | S (conservar) |
| Resto de fallos: `setAviso(error.message \|\| ERROR_INESPERADO)` | `Register.tsx:72` | S: `service.unavailable` debe tener su código |
| Contadores de correo y contraseña ya existen (`maximo`); falta el de alias y el de confirmación | `Register.tsx` | S |
| Ayuda `AYUDA_CONTRASENA` ya existe | `Register.tsx`, `textosDelRediseno.ts` | cumple |
| Medidas 276×27 y botones de 28 frente a 36 | `cuenta.css` (campos y botones de registro, sin verificar el rango) | S |
| Sin `data-testid` | | M |

### 10 · Pruebas

Una por CA de HU01 y HU02: los cuatro obligatorios a la vez (un elemento por campo, con el literal del CA); alto mínimo de ventana 960×600: la nota de registro con todos los errores (≈580,5 con controles de 36) cabe con ≈19,5 de margen vertical, y si no cabe aplica C-12; no válidos a la vez con sus cuatro literales; correo largo; alias repetido sin mensaje; correo ya registrado (píldora, dos acciones, no se cierra sola); sin conexión (botón deshabilitado, no navega); contadores; Playwright 276×36 y que la nota con 4 errores quepa o desplace sin cortar.

---

## AC-05 · Verificar correo (HE-01-HU03)

Familias (9): base 84:2/84:12 y 8 estados. Código: `register/VerificarCorreo.tsx` (142 líneas), `cuenta/PasoCentrado.tsx`, `cuenta/Hipervinculo.tsx`.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base | 84:2 | 84:12 | - | - |
| Código enviado (píldora) | 2249:3254 | 2250:3519 | - | - |
| Campo obligatorio | 2249:3321 | 2250:3586 | - | - |
| Código incorrecto | 2249:3366 | 2250:3631 | - | - |
| Código vencido | 2249:3411 | 2250:3676 | - | - |
| Demasiados intentos | 2249:3456 | 2250:3721 | - | - |
| Código reenviado (píldora) | 2249:3502 | 2250:3767 | - | - |
| Reenviar en espera | 2249:3569 | 2250:3834 | - | - |
| Sin conexión | 2249:3614 | 2250:3879 | - | - |

### 2 · Estructura

```
[cuenta-nota]
  [cuenta-regresar] [cuenta-migas]         «Registro / Verificar correo»
  [verificar-titulo] [verificar-subtitulo]
  [verificar-codigo-etiqueta] [verificar-codigo] [verificar-codigo-error]
  [verificar-reenviar] [verificar-espera]  enlace y cuenta atrás
  [verificar-confirmar]                    Botón Principal «Verificar»
  [login-pildora] / [cuenta-franja]
```

### 3 · Medidas (huella 84-2)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Nota | 404×299 en (344,5;93,5); con A1 y franja automática | `superficie` (nota de cuenta, C-1) | MEDIDO |
| Regresar | 32×32 en (364,5;139,5) | `Botón ícono` Fila | MEDIDO |
| Migas | (370,5;114) 128×12 | `texto` | MEDIDO |
| Título «Verifica tu correo» | (404,5;142) 203×28, Bold 23 | `tinta` | MEDIDO |
| Subtítulo | (370;180) 243×14, Regular 12 | `texto` | MEDIDO |
| Etiqueta «Código de verificación» | (370;226) 121×13, Medium 11 | `tinta` | MEDIDO |
| Campo | (370;246) 353×34 → 353×36, radio 9 | `borde_campo` | MEDIDO (A1) |
| Botón «Verificar» | (636;313) 87×36 | Principal | MEDIDO |
| «Reenviar código» | (370;360) 88×13, Medium 11 | `secundario` | MEDIDO |
| Cuenta atrás | bajo «Reenviar código», Regular 10, nota +5 (304) | `texto` | MEDIDO |
| Franja de sin conexión (demasiados intentos pasa a píldora, C-7); en 84:2 la franja es 353×29 en (370;204,5) con nota de 336 | 353×29 en (370;204,5), nota 336; 84:42 (AC-07): 353×42 en (370;199,5), nota 349 | `relleno_vencida` | MEDIDO |
| Píldoras | «Código enviado» 575×42 en (259;4); «Código reenviado» 255×42 en (419;4) | Éxito | MEDIDO |

### 4 · Textos literales

«Registro / Verificar correo» · «Verifica tu correo» · «Escribe el código que enviamos a tu correo.» · «Código de verificación» · «Verificar» · «Reenviar código» · «Puedes pedir un nuevo código en <segundos restantes> s.» (el Figma muestra «45 s»). Píldoras: «Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.» y «Te enviamos un nuevo código.». Sin conexión: «No hay conexión a internet. Conéctate para crear tu cuenta.» Placeholder del código: C-10.

### 5 · Estados

Reposo, foco, error de campo, reenvío en espera (el enlace aparece sin acción y con `aria-disabled`), deshabilitado sin conexión (botón «Verificar»), cargando NO MEDIDO. **«Reenviar código» tiene acción** (el prototipo no la trae, incoherencia 9): pide un código nuevo (IPC-AUTH-03, HU03) y muestra la píldora «Te enviamos un nuevo código.». «Verificar» no salta al Planificador (el prototipo sí): verifica, crea la sesión y entra a la app.

### 6 · Teclado y foco

Al entrar al paso el foco va al campo del código. Enter verifica. «Regresar» y la miga «Registro» vuelven al formulario conservando lo escrito (HU03-CA08). Con la cuenta atrás, el texto es `aria-live="polite"` cada 10 s, no cada segundo (PROPUESTA).

### 7 · Animaciones

A-08, A-27, A-29, A-05/A-06/A-07 (píldoras).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| Código vacío | `CAMPO_OBLIGATORIO` | «Este campo es obligatorio.» | bajo el campo |
| Código equivocado | `CODIGO_INCORRECTO` | C-6 | bajo el campo |
| Código vencido | `CODIGO_VENCIDO` | C-6 | bajo el campo |
| Demasiados intentos | `DEMASIADOS_INTENTOS` | C-6 | píldora Error |
| Reenvío antes de tiempo | `REENVIO_EN_SEGUNDOS` | C-6 | bajo «Reenviar código» |
| Sin red | `SIN_CONEXION_REGISTRO` | C-6 | franja |
| Falla del servicio | `SERVICIO_NO_DISPONIBLE` | | píldora Error |

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Cuenta atrás de `REENVIO_EN_SEGUNDOS` y `code.resend_too_soon` ya existen | `VerificarCorreo.tsx` | cumple |
| «Reenviar código» como `Hipervinculo` deshabilitado hasta 0 | `VerificarCorreo.tsx` | cumple |
| Demasiados intentos en franja; G4 pide píldora Error | `VerificarCorreo.tsx` | S |
| Tras verificar llama `sesionIniciada({paleta: modo})` y muestra `result_message` (`BIENVENIDA` «¡Bienvenido, <alias>! …», píldora Éxito) | `VerificarCorreo.tsx:71,83` | cumple |
| Medidas 353×34 | `cuenta.css` (campo del paso centrado, sin verificar el rango) | S |
| Sin `data-testid` | | M |

### 10 · Pruebas

Una por CA de HU03: obligatorio, incorrecto, vencido, demasiados intentos, reenviado, espera con la cuenta atrás (reloj simulado), sin conexión, «Regresar» y miga conservan datos, verificar entra a la app; geometría Playwright (nota 404, campo 353×36).

---

## AC-06 · Recuperar contraseña: correo (HE-01-HU06) y sin conexión (88:2)

Familias (5): 84:22/84:32, campo obligatorio, correo no válido, correo muy largo, sin conexión (88:2/88:3). Código: `recovery/Recovery.tsx` (142 líneas), `recovery/PasoDeRecuperacion.tsx`.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base | 84:22 | 84:32 | - | - |
| Campo obligatorio | 2249:4003 | 2250:4268 | - | - |
| Correo no válido | 2249:4048 | 2250:4313 | - | - |
| Correo muy largo | 2249:4093 | 2250:4358 | - | - |
| Sin conexión | 88:2 | 88:3 | - | - |

### 2 · Estructura

`[cuenta-regresar]`, `[cuenta-migas]` («Inicio de sesión / Recuperar contraseña»), `[recuperar-titulo]`, `[recuperar-subtitulo]`, `[cuenta-franja]` (sin conexión), `[recuperar-correo-etiqueta]`, `[recuperar-correo]`, `[recuperar-correo-error]`, `[recuperar-enviar]`, `[recuperar-nota-conexion]`.

### 3 · Medidas (huellas 84-22 y 88-2)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Nota | 404×299 base; 404×352,5 sin conexión | | MEDIDO |
| Título «Recupera tu contraseña» | (404,5;142) 281×28, Bold 23 | `tinta` | MEDIDO |
| Subtítulo | (370;180) 272×14 | `texto` | MEDIDO |
| Franja sin conexión | 353×36 en (370;211), radio 5,7 → 9; texto (379;222,5) 334,5 de ancho | `relleno_vencida`, `error` | MEDIDO |
| Etiqueta del correo | (370;265) sin conexión; (370;226) base | `tinta` | MEDIDO |
| Campo | 353×34 → 353×36 en (370;285) sin conexión; placeholder «nombre@ejemplo.com» 125×14 en (380;294) | `borde_campo`; placeholder `texto` | MEDIDO |
| Botón «Enviar código» | base 120×36; sin conexión 114×36 en (609;359), texto 82×14 | Principal / Deshabilitado | MEDIDO |
| Nota al pie sin conexión | (370;409,5) 198×12, Regular 10 | `texto` | MEDIDO |

### 4 · Textos literales

«Inicio de sesión / Recuperar contraseña» · «Recupera tu contraseña» · «Te enviaremos un código a tu correo electrónico.» · «Correo electrónico» · «nombre@ejemplo.com» (placeholder, D17) · «Enviar código» · sin conexión: «No hay conexión a internet. Conéctate para recuperar tu contraseña.» y «Enviar código requiere conexión a internet.». Éxito al enviar: «Si el correo está registrado, te enviamos un código de verificación.» (`CODIGO_DE_RECUPERACION_ENVIADO`, ya existe; el Figma no tiene familia, se muestra como píldora Éxito al pasar al paso del código, PROPUESTA).

### 5 · Estados

Reposo, foco, error de campo, deshabilitado sin conexión (botón y campo según DP-03; el campo queda editable, PROPUESTA), cargando NO MEDIDO. El botón deshabilitado del prototipo no reacciona (correcto); el texto «Enviar código requiere conexión a internet.» explica por qué.

### 6 · Teclado y foco

Foco inicial en el correo. Enter envía. «Regresar» y la miga «Inicio de sesión» vuelven a 66:4 con el correo escrito (HU06-CA07, ET04).

### 7 · Animaciones

A-08, A-27, A-29.

### 8 · Errores

| Causa | Código | Dónde |
|---|---|---|
| Correo vacío | `CAMPO_OBLIGATORIO` | bajo el campo |
| Formato inválido | `CORREO_INVALIDO` | bajo el campo |
| Más de 64 | `CORREO_MUY_LARGO` | bajo el campo |
| Sin red | `SIN_CONEXION_RECUPERAR` | franja |
| Servicio caído | `SERVICIO_NO_DISPONIBLE` | píldora Error |

El correo no registrado **no** produce error (el contrato responde igual para no revelar cuentas): mensaje `CODIGO_DE_RECUPERACION_ENVIADO`.

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Aviso de sin conexión usa `SIN_CONEXION_ENVIAR_CODIGO` = «Sin conexión. Conéctate para enviar el código.» (RD-18); el Figma (texto visible), `contratos.md` y `messages.es.json` dicen «No hay conexión a internet. Conéctate para recuperar tu contraseña.» | `cuenta/textosDelRediseno.ts:39`, `Recovery.tsx:16,105` | S: DECISIÓN RD-18 («Sin conexión. Conéctate para enviar el código.»); el contrato y `messages.es.json` se alinean con RD-18 |
| Nota «Enviar código requiere conexión a internet.» ya existe y se conserva (`REQUIERE_CONEXION('Enviar código')`, RD-18) | `Recovery.tsx:132` | cumple |
| Placeholder del correo ya existe | `Recovery.tsx:121` | cumple |
| Sin `data-testid` | | M |

### 10 · Pruebas

Obligatorio, no válido, largo (el error de forma sale en el campo con el literal del CA), sin conexión (franja, botón y nota), éxito con el mensaje genérico, «Regresar» conserva el correo; Playwright 353×36 y botón 120×36 / 114×36.

---

## AC-07 · Diligenciar código de recuperación (HE-01-HU07)

Familias (8): base 84:42/84:52 y 7 estados. Código: `recovery/DiligenciarCodigo.tsx` (144 líneas). Misma estructura, medidas y errores que AC-05 con estos cambios.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base | 84:42 | 84:52 | - | - |
| Campo obligatorio | 2249:3662 | 2250:3927 | - | - |
| Código incorrecto | 2249:3707 | 2250:3972 | - | - |
| Código vencido | 2249:3752 | 2250:4017 | - | - |
| Demasiados intentos | 2249:3797 | 2250:4062 | - | - |
| Código reenviado | 2249:3843 | 2250:4108 | - | - |
| Reenviar en espera | 2249:3910 | 2250:4175 | - | - |
| Sin conexión | 2249:3955 | 2250:4220 | - | - |

### 2 · Estructura

Igual que AC-05 con el prefijo `[codigo-…]` (`[codigo-codigo]`, `[codigo-reenviar]`, `[codigo-espera]`, `[codigo-verificar]`).

### 3 · Medidas

Las de AC-05 (huella 84-2 = 84-42 en geometría): nota 404×299; sin conexión 349 de alto con franja 353×42 en (370;199,5) (en 84:2 son 336 y 353×29); píldora «Código reenviado» 255×42 en (419;4); botón «Verificar» 87×36. MEDIDO (F1 32 y filas 78-84).

### 4 · Textos literales

«Inicio de sesión / Recuperar contraseña» → por G7 la miga cambia por paso: **«Recuperar contraseña / Verificar código»** (PROPUESTA de G7; el Figma repite la del paso 1, incoherencia 19) · «Verifica el código» · «Ingresa el código que recibiste por correo.» · «Código de verificación» · «Verificar» · «Reenviar código» · «Puedes pedir un nuevo código en <segundos restantes> s.» · píldora «Te enviamos un nuevo código.» · sin conexión «No hay conexión a internet. Conéctate para recuperar tu contraseña.»

### 5 · Estados

Los de AC-05. «Reenviar código» tiene acción (`auth_recovery_resend`; el prototipo no la trae). «Verificar» lleva a 84:62 solo con código correcto.

### 6 · Teclado y foco

Como AC-05. «Regresar» vuelve al paso del correo (84:22).

### 7 · Animaciones

A-08, A-27, A-29, A-05/A-06/A-07.

### 8 · Errores

Los de AC-05 con `SIN_CONEXION_RECUPERAR`; `code.resend_too_soon` actualiza los segundos.

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Estructura y acciones ya existen (`auth_recovery_verify`, `auth_recovery_resend`) | `DiligenciarCodigo.tsx` | cumple |
| Miga repetida «Inicio de sesión / Recuperar contraseña» en el paso (G7) | `PasoDeRecuperacion.tsx:32`, `Recovery.test.tsx:62` | S |
| Demasiados intentos en franja → píldora (G4) | `DiligenciarCodigo.tsx` | S |
| Sin `data-testid` | | M |

### 10 · Pruebas

Las de AC-05 contra `auth_recovery_verify`; miga por paso; cuenta atrás; el error de forma sale en el campo con el literal del CA.

---

## AC-08 · Nueva contraseña (HE-01-HU08)

Familias (5): base 84:62/84:72 y 4 estados. Código: `recovery/NuevaContrasena.tsx` (122 líneas).

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Base | 84:62 | 84:72 | - | - |
| Campos obligatorios | 2249:4138 | 2250:4403 | - | - |
| Datos no válidos | 2249:4193 | 2250:4458 | - | - |
| Igual a la actual | 2249:4248 | 2250:4513 | - | - |
| Sin conexión | 2250:1561 | 2250:4567 | - | - |

### 2 · Estructura

`[cuenta-regresar]`, `[cuenta-migas]`, `[nueva-titulo]`, `[nueva-subtitulo]`, `[nueva-contrasena]` + `[nueva-contrasena-ojo]` + `[nueva-contrasena-error]`, `[nueva-ayuda]`, `[nueva-confirmacion]` + `[nueva-confirmacion-ojo]` + `[nueva-confirmacion-error]`, `[nueva-guardar]`, `[cuenta-franja]`.

### 3 · Medidas (huella 84-62)

| Parte | Medida | Token | Fuente |
|---|---|---|---|
| Nota | 404×378,5 (387,5 obligatorios; 399,5 no válidos; 387,5 igual; 428,5 sin conexión) | | MEDIDO |
| Título | (404,5;142) 212×28 | `tinta` | MEDIDO |
| Subtítulo | (370;180) 232×14 | `texto` | MEDIDO |
| Campo Nueva contraseña | etiqueta (370;226), campo (370;246) 353×34 → 36, ojo 30×27,5 en (689;249,5) | `borde_campo` | MEDIDO |
| Ayuda | (370;287) 291×12, Regular 10, una capa | `texto` | MEDIDO |
| Campo Confirmar | etiqueta (370;313,5), campo (370;333), ojo (689;336,5) | | MEDIDO |
| Botón «Guardar contraseña» | (563;399) 160×36 | Principal | MEDIDO |
| Franja sin conexión | 353×42 en (370;199,5) | `relleno_vencida` | MEDIDO |

### 4 · Textos literales

«Recuperar contraseña / Nueva contraseña» (G7, PROPUESTA; el Figma repite «Inicio de sesión / Recuperar contraseña») · «Nueva contraseña» · «Elige una contraseña para volver a entrar.» · «Nueva contraseña» · «8 a 64 caracteres, una mayúscula, una minúscula y un número.» · «Confirmar contraseña» · «Guardar contraseña». Los puntos «••••••••» del Figma son valor, no placeholder.

### 5 · Estados

Reposo, foco, error de campo, ojo independiente, deshabilitado sin conexión, cargando NO MEDIDO. **«Guardar contraseña» tiene acción** (el prototipo es callejón sin salida, incoherencia 9): guarda con `auth_recovery_set_password`, vuelve a Inicio de sesión (66:4) y muestra la píldora «Tu contraseña fue actualizada. Ya puedes iniciar sesión.» (el Figma lo muestra en 2249:2560).

### 6 · Teclado y foco

Foco inicial en la nueva contraseña. Enter guarda. Con errores, foco al primero y todos a la vez. «Regresar» vuelve al código (84:42).

### 7 · Animaciones

A-08, A-27, A-29, A-30 (ojos), A-05/A-06 (píldora de éxito).

### 8 · Errores

| Causa | Código | Dónde |
|---|---|---|
| Vacíos | `CAMPO_OBLIGATORIO` ×2 | bajo cada campo, a la vez |
| Regla de contraseña | `CONTRASENA_INVALIDA` | bajo Nueva contraseña |
| Confirmación distinta | `CONTRASENAS_NO_COINCIDEN` | bajo Confirmar |
| Igual a la actual | `CONTRASENA_IGUAL_A_LA_ACTUAL` | bajo Nueva contraseña |
| Sin red | `SIN_CONEXION_RECUPERAR` | franja |
| Sin red al guardar (HU08-CA06) | `SIN_CONEXION_RECUPERAR` | aviso en la parte superior del paso; no actualiza y conserva lo diligenciado |
| Falla del servicio | `SERVICIO_NO_DISPONIBLE` | píldora Error |
| Código de recuperación vencido al guardar | **PROPUESTA**: `CODIGO_VENCIDO`, pero IPC-AUTH-11 no lista `code.expired`; se anota en `docs/DUDAS.md` con el valor neutro píldora Error y «Regresar» al paso del código | |

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Guardar y volver a Inicio de sesión ya existe | `NuevaContrasena.tsx` | cumple |
| Éxito: `mostrarResultado(r.result_message.message)` y luego `abrirCuenta('sign_in')` (`CONTRASENA_ACTUALIZADA`) | `NuevaContrasena.tsx:71-75` | cumple |
| `service.unavailable` cae a `r.error.message` o al genérico; se mapea por `error.code` | `NuevaContrasena.tsx:71-75` | S |
| Miga repetida (G7) | `PasoDeRecuperacion.tsx` | S |
| Sin `data-testid` | | M |

### 10 · Pruebas

Obligatorios y no válidos a la vez (uno por campo, con el literal del CA), igual a la actual (HU08-CA07), sin conexión al entrar (CA05) y al guardar (CA06, conserva lo diligenciado), guardar con éxito y píldora en 66:4, ojos independientes, geometría 353×36 y 160×36.

---

## AC-09 · Cerrar sesión: M-11 y M-12 (HE-16-HU03)

Familia: 2 mensajes × 4 temas (fuera de las 50 de F1; viven en F5 y F8). Código: `screens/settings/CerrarSesion.tsx` (69 líneas), `ui/Confirmacion/Confirmacion.tsx`, `screens/settings/Settings.tsx`. El contenedor es MB-22/MB-23 (VentanaEmergente y Confirmación) y el botón es Destructivo (MB-10); aquí solo se fija qué contiene y cómo se pinta.

### 1 · Nodos

| Mensaje | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| M-11 «Cerrar sesión» (F5 79:6) | 204:25989 | 233:24763 | 204:26089 | 204:26189 |
| M-12 «Cambios sin sincronizar» (F5 79:6) | 204:26002 | 233:24776 | 204:26102 | 204:26202 |
| M-12 (F8 83:4) | 85:138 | 233:25941 | 198:414 | 85:144 |

Los tres nodos de prototipo (M-11 85:126 y M-12 85:138) abren el Inicio de sesión (flujos, líneas 257-258): por la HU, solo cierran la sesión si el Núcleo responde bien.

### 2 · Estructura

`[cerrar-sesion-abrir]` (botón de Ajustes), `[cerrar-sesion-dialogo]`, `[cerrar-sesion-titulo]`, `[cerrar-sesion-texto]`, `[cerrar-sesion-cancelar]`, `[cerrar-sesion-confirmar]`.

### 3 · Medidas

Las de MB-22/MB-23 (no se repiten). Propio de esta pieza: el botón principal es **Destructivo en los cuatro temas** (G17), sin sombra (MB-10), 36 de alto, radio 9; «Cancelar» es Secundario. Fuente: G17 y CONSISTENCIA; los nodos de F5/F8 traían el principal como Principal (incoherencia 18).

### 4 · Textos literales

Título «Cerrar sesión» (el título no está definido en la HU; DUDA ya registrada en `CerrarSesion.tsx:51`; **se conserva**). Cuerpo M-11 `DESEAS_CERRAR_SESION` «¿Deseas cerrar sesión?»; cuerpo M-12 `CAMBIOS_SIN_SINCRONIZAR_AL_CERRAR_SESION` «Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?». Botones: M-11 «Cerrar sesión» / «Cancelar»; M-12 «Confirmar» / «Cancelar». Éxito: «Sesión cerrada.» (`SESION_CERRADA`, píldora Éxito 4 s, G5).

### 5 · Estados

Abierto, enviando (`useEnvioUnico`: segundo clic ignorado), éxito (vuelve a Inicio de sesión con la píldora), error (píldora Error). Cuál mensaje sale lo decide `auth_get_sign_out_info` (hay cambios sin sincronizar o no); si esa orden falla, error visible (parte 8).

### 6 · Teclado y foco

Diálogo modal: teclado y foco son los de MB-22 (VentanaEmergente) y MB-23 (Confirmación): foco inicial según MB-23 (no cambia por ser destructiva), Tab y Shift+Tab ciclan dentro, Esc cierra, al cerrar el foco vuelve al botón de Ajustes.

### 7 · Animaciones

A-05/A-06 (píldora) y las del diálogo (MB-22).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| El Núcleo no cierra (`auth.sign_out_failed`) | `NO_PUDIMOS_CERRAR_LA_SESION` (G1m: `CIERRE_SESION_FALLIDO`) | «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.» | píldora Error; el diálogo se cierra y la sesión sigue |
| Falla `auth_get_sign_out_info` (no se sabe si hay cambios) | el mismo código y literal (G1m) | ídem | píldora Error; no se abre M-11 en silencio y la sesión sigue |

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Flujo completo (`auth_get_sign_out_info`, M-11/M-12, `auth_sign_out`, `sesionCerrada()`) ya existe | `CerrarSesion.tsx:40-69` | cumple |
| `Confirmacion` ya acepta `destructiva` y existe `wg-boton--peligro`; `CerrarSesion` **no** lo pasa | `CerrarSesion.tsx:55-66`, `Confirmacion.tsx:17,43` | S |
| Que el Destructivo exista en los 4 temas y sin sombra | `Boton.test.tsx:52` | S, a verificar en `tokens.css` |
| `pedirCierre` abre M-11 cuando falla `auth_get_sign_out_info`: el fallo pasa en silencio | `CerrarSesion.tsx:28-33` | S |
| Sección «Sesión» de Ajustes (RD-41) | `Settings.tsx:72-81` | cumple |
| Sin `data-testid` | | S |

### 10 · Pruebas

Una por CA de HU03: M-11 sin cambios; M-12 con cambios; «Cancelar» deja la sesión; confirmar cierra y muestra «Sesión cerrada.»; falla de `auth_sign_out` → píldora Error y sesión intacta; falla de `auth_get_sign_out_info` → píldora Error con el literal de G1m, sin abrir M-11; el botón es `wg-boton--peligro` en los 4 temas; doble clic envía una vez.

---

## AC-10 · Sesión vencida dentro de la app (RD-89)

**NUEVA.** Familia: sin nodo propio de Figma (fuera de las 50). Reutiliza el aviso 2249:1966/2250:2231 de AC-03 («Sesión vencida» del Inicio de sesión).

### 1 · Nodos

Solo el aviso de AC-03 (claro 2249:1966, oscuro 2250:2231). Pantalla de destino: Inicio de sesión (66:4/66:30).

### 2 · Estructura

Sin elemento nuevo: es un estado del Inicio de sesión (`[login-pildora]` con `SESION_VENCIDA`).

### 3 · Medidas

Las de AC-03 (píldora Error; posición: MB-06). NO MEDIDO como flujo dentro de la app (no hay marco).

### 4 · Textos literales

`SESION_VENCIDA`: «Tu sesión venció. Inicia sesión de nuevo.»

### 5 · Estados

Dos entradas llevan al mismo resultado: (1) el evento EV-01 `session_changed` con `reason: token_expired` y (2) cualquier orden que responda `session.expired`. En ambos casos la app cierra la sesión local, vuelve al Inicio de sesión y muestra la píldora Error `SESION_VENCIDA`, que no se cierra sola (G5).

### 6 · Teclado y foco

Al volver, el foco va al campo de correo; la píldora se anuncia con `role="alert"`.

### 7 · Animaciones

A-05/A-06/A-07.

### 8 · Errores

`session.expired` y EV-01 `token_expired` → `SESION_VENCIDA` (C-6). No caen al genérico.

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| `session.expired` existe solo como tipo (`types/index.ts:441`) y el texto en `types/messages.es.json:106`; ninguna pantalla lo atiende | `types/index.ts:441` | M: un manejador único en el invocador de órdenes que dispare `abrirCuenta('sign_in')` con el aviso |
| EV-01 `session_changed` ya se escucha, pero `cerrada()` vuelve al login sin aviso (el Núcleo emite `token_expired`, `puente_ipc.rs:846`) | `ventana_principal/VentanaPrincipal.tsx:174-180` | S: mostrar `SESION_VENCIDA` cuando `reason` sea `token_expired` |

Funcionalidad **sin código previo**: sí. Se implementa porque RD-89 ya la dejó en el Núcleo y el contrato.

### 10 · Pruebas

Un invocador simulado que responde `session.expired` y un EV-01 `token_expired` llevan a Inicio de sesión con la píldora; ningún otro `reason` ni otro error la dispara; no pierde datos de cuenta.

---

## Tabla de geometría

Origen: el marco de huellas es 1093×560 con la nota centrada (C-1). Todas las medidas Figma en px del marco; el código usa C-4 (escala ~1,0244 al componente). «Con A1» es el alto con controles de 36 y nota automática (C-11).

| Pantalla | Nota (ancho × alto Figma) | Posición de la nota | Campo | Botón principal | Alto con A1 |
|---|---|---|---|---|---|
| Login 66:4 | 377 × 427 (base) | (512,5;92) | 313×30,5 → 313×36 | 313×32 → 313×36 | +11 |
| Login obligatorios / sin conexión | 432 (en y=89,5) / 477 (en y=67); no válidos y largo: NO MEDIDO (la huella no trae silueta) | (512,5;…) | igual | igual | +11 cada uno |
| Registro 66:162 | 332,5 × 432 (base) | (516,5;64) | 276×27 → 276×36 | 276×28,5 → 276×36 | +51,5 |
| Registro obligatorios / no válidos / correo largo / sin conexión | 455 / 465 / 439 / 482 | (516,5;64) | igual | igual | +51,5 |
| Verificar 84:2 (y Diligenciar 84:42) | 404 × 299 | (344,5;93,5) | 353×34 → 36 | 87×36 | +2 |
| Verificar con demasiados intentos / espera / sin conexión | 336 / 304 / 336 (349 en 84:42) | (344,5;93,5) | igual | igual | +2 |
| Recuperar 84:22 | 404 × 299 | (344,5;93,5) | 353×34 → 36 | 120×36 | +2 |
| Recuperar sin conexión 88:2 | 404 × 352,5 | (344,5;93,5) | 353×34 → 36 | 114×36 | +2 |
| Nueva contraseña 84:62 | 404 × 378,5 | (344,5;93,5) | 353×34 → 36 (×2) | 160×36 | +4 |
| Nueva contraseña obligatorios / no válidos / igual / sin conexión | 387,5 / 399,5 / 387,5 / 428,5 | (344,5;93,5) | igual | igual | +4 |

Selector de apariencia 132,5×24 en (716,5;20,5) en login y registro; globo de Windi 160×44,5; Windi 332×339. Las filas de login quedan en AC-02. Marcos solo en claro y oscuro: Rosa y Enfoque se derivan por tokens (C-5), NO MEDIDO.

---

## Incoherencias resueltas

| N.º | Incoherencia | Resolución |
|---|---|---|
| 1 | Paleta fija `cuenta.css` (RD-04) y Rubik fija (RD-06) frente a los temas | Variables y fuente del tema (C-2, C-3). Gana TEMAS_Y_TOKENS. |
| 2 | Fondo oscuro y borde del botón casi invisible | `superficie`/`marco` y `borde` (C-2). |
| 3 | Franjas de error sin ícono ni cierre (tres patrones en el Figma, incoherencia 10) | Un solo patrón: píldora Error (G4). La franja queda solo para «sin conexión» con `relleno_vencida` (C6). |
| 4 | «Crear cuenta · deshabilitado» del prototipo salta a 84:2 | No se implementa; el botón queda deshabilitado de verdad (incoherencia 8). |
| 5 | «Reenviar código» y «Guardar contraseña» sin reacción en el prototipo | Llevan la acción de la HU (incoherencia 9). |
| 6 | «Verificar» (84:2) salta al Planificador y se salta 84:42/84:62 | La navegación es la de la HU: verificar crea la sesión y entra a la app; en recuperación, 84:42 → 84:62. |
| 7 | Salto de línea fijo en la ayuda de contraseña (66:162) | Una sola frase que se ajusta (incoherencia 16). |
| 8 | Sin contador en alias y confirmación | Contador en todo campo con límite (A9): alias «0/30» ya existe, confirmación «0/64» PROPUESTA. |
| 9 | Selector de apariencia ausente en 84-x/88-2 pero `cuenta.css:451` lo pone | RD-16: el selector «Apariencia» se queda a la derecha en los pasos centrados. |
| 10 | Fila de G7 cita 84:2 con «Recuperar contraseña›» | Errata de la fila: 84:2 es del registro («Registro / Verificar correo», Figma y código). Las migas de recuperación son las de AC-06 a AC-08. |
| 11 | `SIN_CONEXION_ENVIAR_CODIGO` (nombre de capa del Figma) | El texto visible del Figma, `contratos.md` y `messages.es.json` es `SIN_CONEXION_RECUPERAR`; RD-18 (posterior) fija «Sin conexión. Conéctate para enviar el código.» y el aviso de botón «Enviar código requiere conexión a internet.»; se sigue RD-18 y se alinea el contrato. |
| 12 | Nota de altura fija frente a controles de 36 | Altura automática (C-11, A1). |

## No se construye

- Salto «Crear cuenta · deshabilitado» → 84:2 del prototipo.
- Salto «Verificar» → Planificador directo del prototipo (84:2).
- Frases fijas con saltos de línea de las capas de Figma.
- Emoji en el saludo (D11): se usa el alias sin emoji.
- Marcos Rosa y Enfoque de cuenta: no existen; se derivan por tokens.
- El valor «••••••••» de los campos de contraseña del Figma (es contenido de la maqueta, no placeholder).
- Cualquier mensaje o pantalla que no esté en una HU, un CA o `messages.es.json`.

## Decisiones ya tomadas que se citan

D6 (foco `tinta` 2 px, radio+3), D7/A8 (la posición la resuelve MB-06 frente a RD-63/RD-104), D10 (errores por causa), D11 (saludo con alias, sin emoji), D17 (placeholders), G4 (píldora única de error), G5 (Éxito/Info 4 s, Advertencia 6 s, Error hasta cerrar), G7 (migas por paso), G17 (Destructivo en los 4 temas), C6 (franja `relleno_vencida` solo sin conexión), R11, P1-P4, Q1-Q3, A1 (controles 36), A9 (contadores), RD-04, RD-06, RD-88, RD-89. MB-03, 05, 06, 08, 10, 11, 20, 21, 22, 23, 24, 27 se citan, no se repiten.

## CA → prueba

Una prueba por cada CA. Vitest para texto y lógica; Playwright para geometría.

| CA | Pieza | Prueba |
|---|---|---|
| HE-01-HU01-CA01 a CA04 | AC-04 | envío válido pasa a verificar; alias vacío, de más de 30 y repetido |
| HE-01-HU01-CA05 a CA08 | AC-04 | correo vacío, inválido, de más de 64 y ya registrado (píldora) |
| HE-01-HU01-CA09 a CA12 | AC-04 | enlaces de la píldora y del texto de ayuda; registro sin conexión |
| HE-01-HU02-CA01 a CA08 | AC-04 | contraseña válida, vacía, corta, larga, sin clase, confirmación vacía y distinta; formulario vacío con todos los errores a la vez |
| HE-01-HU03-CA01 a CA09 | AC-05 | verificar, vacío, incorrecto, vencido, intentos, reenviar, espera de 60 s, regresar, sin conexión |
| HE-01-HU04-CA01 a CA12 | AC-02, AC-03 | login válido y recordado, campos vacíos a la vez, formato, largo, credenciales, intentos, sin conexión, enlaces |
| HE-01-HU05-CA01 a CA09 | AC-02, AC-03 | Google nuevo y existente, nombre largo o ausente, cancelado, error, sin conexión, correo largo, desde Registro |
| HE-01-HU06-CA01 a CA07 | AC-06 | correo registrado y sin cuenta, vacío, inválido, largo, sin conexión, miga |
| HE-01-HU07-CA01 a CA09 | AC-07 | código válido, vacío, incorrecto, vencido, intentos, reenviar, espera, regresar, sin conexión |
| HE-01-HU08-CA01 a CA07 | AC-08 | contraseña nueva válida, vacía, reglas, confirmación, sin conexión al entrar y al guardar, igual a la actual |
| HE-16-HU03-CA01 a CA07 | AC-09 | cierre confirmado y cancelado, con cambios, ventana de confirmación, durante sincronización, fallo del cierre |
| RD-89 | AC-10 | `session.expired` y EV-01 `token_expired` |

## Pendiente de Paula

Ninguno. El desplazamiento (C-12), el selector (RD-16), el texto de sin conexión en Recuperar (RD-18), la posición del aviso (MB-06) y el placeholder del código (C-10, valor neutro en `docs/DUDAS.md`) quedaron resueltos con decisiones vigentes. Lo que sigue como PROPUESTA (contador de confirmación, `CODIGO_VENCIDO` al guardar) va a `docs/DUDAS.md` con su valor neutro.

## Lecturas de Figma pendientes

- Marcos Rosa y Enfoque de las 50 familias (no existen): NO MEDIDO.
- Estado «cargando» de los botones de cuenta: NO MEDIDO (no está dibujado).
- Píldora «Éxito» del código de recuperación enviado (`CODIGO_DE_RECUPERACION_ENVIADO`): sin marco.
- Aviso de sesión vencida dentro de la app: sin marco (usa 2249:1966).
- Foco D6 sobre los campos de cuenta y estados `:hover`/`:active` de botones y enlaces: NO MEDIDO.
- `apariencia.tsx`: NO VERIFICADO. `SelectorDeModo.tsx` (radiogroup, tabIndex móvil, flechas RD-22) y `temaInicial.ts:88` se leyeron.
