# SPEC · Instalador y web (páginas 83:3 «Instalador y web» y 83:4 «Confirmaciones», parte del instalador)

Fecha: 26-nov-2026 (hora colombiana). Estado: BORRADOR local, sin subir a ningún sitio (regla de Paula: nada generado con IA se sube sin su sí).
Llegó hasta: completo (WE-01, IN-01 a IN-07 y las secciones finales), corregido con los 20 hallazgos del revisor. No se usó el conector de Figma; se leyeron `.trabajo/figma/F7.md`, `F8.md`, las huellas 84-1050, 84-1068, 84-1092, 84-1112, 2264-134733, 84-1059-oscuro-diff, 85-2, 85-66 y 83-4-diff-familias. Lo que ninguna huella midió va como «NO MEDIDO (motivo)».

## Alcance

Las 5 familias de la página 83:3 de `.trabajo/figma/F7.md` (Windgets para Windows, Opciones de instalación, Instalación en curso, Instalación completada, Sin espacio; 10 marcos 1280×790, claro y oscuro) y las 7 familias del instalador de 83:4 (M-01, M-16, M-17, M-18, M-19, M-20, M-21), más el flujo §3 y los puntos 10 y 11 de `docs/rediseno_flujos_prototipos.md`. Tema: solo claro y oscuro; en estas páginas no hay Rosa ni Enfoque.

| Familia | Dueño |
|---|---|
| Windgets para Windows (84:1050 | 84:1059) | Aquí: WE-01 (landing, `apps/landing`) |
| Opciones, En curso, Completada, Sin espacio | Aquí: IN-01, IN-02, IN-03 (instalador, `installer/installer.nsi`) |
| M-01 Cancelar instalación; M-16 Reinstalar; M-17 Reparar; M-18 No compatible; M-19 Dañado; M-20 Falla; M-21 Cancelada | Aquí: IN-04 a IN-07 (el papel y los botones vienen de MB-22, MB-23 y MB-10; se cita, no se repite) |
| M-11 «Cerrar sesión» y M-12 «Cambios sin sincronizar» (85:126, 85:138) | SPEC_Cuenta_y_Acceso AC-09 |
| Marco 1280×790 y adaptación (P15) | CONSISTENCIA P15 y SPEC_Marco (MB-01); aquí solo qué hace el instalador con ese tamaño (IN-00) |
| M-02 a M-10, M-13 a M-15 | Otras specs (Escritorio, Personalización, Planificador, Windi) |

Piezas de marco (barra, miga, indicador, avisos): no aparecen en el instalador ni en la landing. La cabecera del Figma (símbolo 34×31 en (50,34) y «windgets» Bold 26 en (91,34)) es el logotipo del marco de las láminas, no una barra de la aplicación.

## Fuentes y orden de autoridad

Figma (F7, F8, huellas, F0/F0b) → `docs/rediseno.md` y RD-nn → HU y contratos (`docs/CD-01.md`, `docs/CD-02.md`) → `docs/rediseno_cambios_implementacion.md`. Mandan y se citan sin contradecir: `CONSISTENCIA.md`, `TEMAS_Y_TOKENS.md`, `ANIMACIONES.md`, `SPEC_Marco_y_componentes_base.md` y `.trabajo/DECISIONES_PAULA_26nov.md`. Una función nueva del Figma se implementa; si no tiene HU, sus criterios van como PROPUESTA con destino.

## Etiquetas

MEDIDO (huella o F7/F8), DECISIÓN (de Paula o de CONSISTENCIA), PROPUESTA (sin base; confirmar), NO MEDIDO (motivo). Tamaño de la diferencia con el código: S, M, L. NUEVA = función sin código hoy.

## Convenciones comunes

**C-1 · Colores por variable.** Nunca hex en el código de la landing. Selección = `seleccion` + `sobre_seleccion`. Marco `fondo`; contenido `superficie`; filas y pistas `superficie_baja`; texto `tinta`/`texto`; borde de controles `borde` 1,5; error `error`. Los hex del oscuro medidos (marco #201b2b, tinta #f8f5ff, superficie #2b2534, superficie_baja #433258, texto #cec7d6, interruptor `principal_legible` #00d9e2, borde #afa1c0, error #ff8a80) se citan solo para comprobar que coinciden con el tema oscuro.

**C-2 · Tamaño.** Láminas de 1280×790 (CONSISTENCIA P15). La landing real debe adaptarse (1024 px y 375 px ya existen y no se quitan, WE-01). El instalador tiene un marco fijo (IN-00).

**C-3 · Tipografía.** T12/T18: la fuente es la del tema; en el Figma estas páginas están en Rubik y pasan a la del tema (Nunito claro y oscuro). Los tamaños 40/31/24/22 y 26/17/14 se conservan como tamaños de página (T18). El instalador nativo no puede cargar fuentes del tema (IN-00, S17).

**C-4 · Avisos.** G5: Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrarlo. En la landing el aviso es una línea con `role="alert"` (ya existe, `main.ts:40-42`); no usa MB-06 porque la landing no carga el marco de la aplicación.

**C-5 · Botón y casilla.** Botón Principal `accion`; Secundario `superficie` + `borde`; Destructivo `superficie` con borde y texto `error` (D13); alto 36, radio 9, borde 1,5, sombra 3,5,0 (F8). Deshabilitado = variante Deshabilitado del componente (E3), no opacidad 0,4.

**C-6 · Códigos de error.**

| Falla | Código estable | Origen del código | Mensaje literal | Dónde |
|---|---|---|---|---|
| Falla la instalación (copia, registro, acceso directo) | `INSTALACION_FALLIDA` | CONSISTENCIA G1p; `installer.nsi` TXT_FALLA (L84); salida 4 (CD-02-INT-13) | «No pudimos completar la instalación. No se hicieron cambios en tu computador.» | M-20 (IN-07), con Reintentar y Cerrar |
| Equipo no compatible | `EQUIPO_NO_COMPATIBLE` (PROPUESTA, sin código hoy; destino `docs/DUDAS.md`) | salida 2 (CD-02-INT-13); TXT_NO_COMPATIBLE (L80) | «Este computador no es compatible. Necesitas Windows 11, de 64 bits (x64).» | M-18 (IN-06) |
| Sin espacio en disco | `SIN_ESPACIO_EN_DISCO` (PROPUESTA; destino `docs/DUDAS.md`) | salida 2; TXT_SIN_ESPACIO (L81); E19/T15 | «No hay suficiente espacio en disco. Libera al menos 500 MB e intenta de nuevo.» | línea de error en Opciones (IN-01) |
| Instalador dañado o incompleto | `INSTALADOR_DANADO` (PROPUESTA; destino `docs/DUDAS.md`) | salida 3; TXT_DANADO (L85); `sellar.mjs` | «El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page.» | M-19 (IN-06) |
| Instalación cancelada | no es un error: salida 1 (CD-02-INT-13) | TXT_CANCELADA (L87) | «La instalación se canceló.» | M-21 (IN-06) |
| Se cae la red al comprobar el instalador | `DESCARGA_SIN_CONEXION` (PROPUESTA; destino `docs/DUDAS.md`) | `descarga.ts:19-29` hoy devuelve `false` igual que si el instalador no existe | mismo literal de CD-01-HU02-CA02 (manda el CA) | aviso bajo el botón |
| El instalador no está publicado (respuesta no correcta) | `INSTALADOR_NO_PUBLICADO` (PROPUESTA; destino `docs/DUDAS.md`) | `descarga.ts:24` | mismo literal | aviso bajo el botón |
| Otro sistema operativo | `SISTEMA_NO_WINDOWS` (PROPUESTA; destino `docs/DUDAS.md`) | `sistema.ts` `detectarCompatibilidad` → `sin_windows` | «Windgets está disponible solo para Windows 11, de 64 bits.» | aviso (no bloquea el botón) |
| Otra arquitectura (no x64) | `ARQUITECTURA_NO_X64` (PROPUESTA; destino `docs/DUDAS.md`) | `sistema.ts` → `arquitectura_distinta` | «Es posible que tu equipo no cumpla los requisitos. El instalador lo comprobará antes de instalar.» | aviso (no bloquea el botón) |
| Navegador sin datos de plataforma | no es error: cae al `userAgent` (`sistema.ts:23-35`) y decide `compatible`, `sin_windows` o `arquitectura_distinta` | `sistema.ts` | — | sin aviso propio |
| La reversión no termina (archivo bloqueado) | `REVERSION_FALLIDA` (PROPUESTA; destino `docs/DUDAS.md` y `docs/CD-02.md`; salida 4 de INT-13) | `Revertir` (`installer.nsi:473-508`) no comprueba errores | «No pudimos deshacer todos los cambios. Elimina la carpeta %LOCALAPPDATA%\Programs\Windgets y vuelve a intentarlo.» | aviso/diálogo en IN-04 e IN-07 |
| No se puede medir el espacio libre | `ESPACIO_NO_MEDIBLE` (PROPUESTA; destino `docs/DUDAS.md`; salida 2) | `MedirEspacio` (`installer.nsi:266-269`) | «No pudimos comprobar el espacio en disco. Libera al menos 500 MB e intenta de nuevo.» | línea de error en Opciones (IN-01 parte 8) |
| Falla la descarga desde la landing | `DESCARGA_NO_DISPONIBLE` (PROPUESTA; destino `docs/DUDAS.md`) | CD-01-HU02-CA02 | «No pudimos iniciar la descarga. Intenta de nuevo.» | aviso bajo el botón (WE-01); el botón sigue habilitado |

`grep` en `docs/` y en `apps/landing/src` no encontró ninguno de los códigos de la columna PROPUESTA; solo `INSTALACION_FALLIDA` existe (CONSISTENCIA G1p). El código `ABRIR_APLICACION_FALLIDO` (IN-03) también es PROPUESTA. Hoy el instalador no usa códigos: devuelve códigos de salida (0 a 4) y la landing no usa códigos, solo literales. Los códigos propuestos son el nombre estable del caso para que Frontend y pruebas lo citen; no cambian lo que ve la persona.

**C-7 · Identificadores de prueba.** Landing: prefijo `descarga-` y `landing-`; ya existen clases (`.boton`, `.aviso`) pero no `data-testid` (se comprueba en WE-01 parte 9). Instalador: no hay DOM; los controles se identifican por texto y clase de ventana en `installer/pruebas/interfaz.py` (IN-00).

**C-8 · Hora y datos de la persona.** Solo hay un dato variable: el espacio disponible en MB (IN-01) y el avance en porcentaje (IN-02). Los literales entre «» se copian tal cual.

---

## IN-00 · Instalador: tecnología, marco fijo y límites (aplica a IN-01 a IN-07)

El instalador real es NSIS de Tauri con plantilla propia (`installer/installer.nsi`, 727 líneas; `tauri.conf.json` L36-54: `nsis`, `installMode currentUser`, `languages ["Spanish"]`, `template`, `headerImage`), MUI2 + nsDialogs, por usuario y sin administrador (`RequestExecutionLevel user`, `InstallDir $LOCALAPPDATA\Programs\Windgets`), WebView2 sin conexión, integridad con marca CRC (`sellar.mjs`), códigos de salida 0 instalada, 1 cancelada, 2 no compatible o sin espacio, 3 dañado, 4 falla con reversión (CD-02-INT-13, DP-19). Los diálogos de confirmación son `TaskDialogIndirect` nativo (macro `Elegir`, con MessageBox Sí/No de respaldo); M-18, M-19 y M-21 son MessageBox.

**Marco fijo.** NSIS no cambia de tamaño con la ventana: la ventana de MUI2 mide lo que dicen sus unidades de diálogo, no 1280×790. P15 (1280×790) es el tamaño de la lámina del Figma, no de la ventana real. Por eso la tabla de geometría de IN-01 a IN-03 se da para el marco del Figma (referencia de diseño) y la ventana real se acerca a esas proporciones sin igualar los píxeles. Alturas por estado en el Figma: Opciones 348 de contenido; En curso y Completada, contenido propio sin medir de alto exacto (NO MEDIDO: la huella da posiciones, no el alto del contenedor).

**Alcance visual dentro de NSIS (no verificado en ejecución).** La plantilla ya usa colores propios (`MUI_BGCOLOR "DCE3DA"` y `MUI_TEXTCOLOR "14201C"`, `installer.nsi:154-155`), imagen de cabecera propia (`cabecera.bmp`) y diálogos de Windows con `TaskDialogIndirect` (macro `Elegir`, `installer.nsi:173-213`). nsDialogs permite crear y colorear controles y cambiar la fuente de cada uno. No se verificó que NSIS dé de forma nativa radios de 16 o 9, sombras, la fuente del tema (Nunito, Rubik) sin instalarla, tema oscuro/Rosa/Enfoque ni animación; esas partes quedan como «no verificado» (S17 las deja fuera: sin radios ni sombras). El instalador debe seguir siendo NSIS de Tauri con plantilla propia (D-194, `docs/convenciones.md` «Empaquetar el instalador», INT-13 en `contratos.md:772-797`, ET21, `tauri.conf.json:38`): un instalador propio queda fuera.

**S17 (decidido el 27-nov).** El instalador se aproxima con nsDialogs: colores propios, fuente de cada control, interruptor y barra de avance dibujados y orden de los controles como en el Figma. Sin radios ni sombras (D-194: sigue siendo el NSIS de Tauri con plantilla propia, sin complementos). El resto de la spec describe el DISEÑO (Figma) y marca en cada pieza la diferencia con el código y el tamaño; lo que no se puede dibujar con nsDialogs queda como diferencia aceptada.

---

## WE-01 · Landing «Windgets para Windows» (83:3, 84:1050 y 84:1059)

Familia: 1 estado × 2 temas. Código: `apps/landing` (Vite + TypeScript, Playwright, publicada en Vercel, D-195). Fuente del código: `src/textos.ts`, `src/descarga.ts`, `src/sistema.ts`, `src/main.ts`, `src/estilos.css`, `index.html`.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Windgets para Windows | 84:1050 | 84:1059 | no existe | no existe |

### 2 · Estructura

El Figma es una maqueta mínima: título «Windgets para Windows» Bold 40 en (56,106); `Contenido` 1172×550 radio 16 `superficie`; dentro, «Planifica tus tareas y personaliza tu escritorio.» Medium 31, «Tareas del día» Bold 24, «Preparar la entrega» Regular 22 y el botón Principal «Descargar para Windows» 197×36 radio 9 con borde 1,5 y sombra 3,5,0. La landing real es una página completa (titular, panel de ejemplo con Reloj, Tareas del día, Kanban y Windi, selector de tres temas, cinco funciones, requisitos, avisos y cierre) ya rediseñada el 14-nov-2026 con textos aprobados por Paula (TITULAR «Tu escritorio también te organiza.», «Elige un tema», CIERRE «Capas que se adaptan a ti.» / «Hecho por ForkTech.», «Volver a la descarga»). El Figma no trae requisitos, cinco funciones ni avisos de compatibilidad, que CD-01 exige.

**S18 (decidido el 27-nov):** se mantiene la landing actual y se toma de 84:1050 lo medible, dentro de la landing existente; NO se quita nada de CD-01:

- Botón «Descargar para Windows»: `[descarga-boton]` (propuesta de `data-testid`, hoy es `.boton`).
- Aviso bajo el botón: `[descarga-aviso]` (hoy `.aviso`, `role="alert"`).
- Requisitos: `[landing-requisitos]`.

Tabla «capa del Figma → `data-testid`»:

| Capa Figma | `data-testid` | Estado |
|---|---|---|
| Título «Windgets para Windows» | `landing-titulo` | NUEVA etiqueta; el texto exacto de 84:1050 convive con el titular aprobado (S18) |
| `Contenido` 1172×550 | `landing-contenido` | NO se construye como caja única: la landing real es una columna con secciones (S18) |
| Botón Principal | `descarga-boton` | MEDIDO |
| Textos «Planifica tus tareas…», «Tareas del día», «Preparar la entrega» | `landing-ejemplo-*` | PROPUESTA: son el contenido del panel de ejemplo; hoy el panel real usa Reloj, Tareas del día, Kanban y Windi |

### 3 · Medidas

| Elemento | Medida | Token | Fuente |
|---|---|---|---|
| Título | Bold 40, en (56,106), 467×47 | `tinta` | MEDIDO (84-1050) |
| Contenedor | en (54,186), 1172×550, radio 16 | `superficie` | MEDIDO |
| Subtítulo | Medium 31, en (34,77) del contenedor, 688×37 | `tinta` | MEDIDO |
| «Tareas del día» | Bold 24, en (54,208) del contenedor, 163×28 | `seleccion` en claro; `secundario` en oscuro (84-1059-oscuro-diff) | MEDIDO (la regla de selección usa el token que cada tema define) |
| «Preparar la entrega» | Regular 22, en (54,263) del contenedor, 197×26 | `tinta` | MEDIDO |
| Botón | en (34,465) del contenedor, 197×36, radio 9, borde 1,5, sombra 3,5,0 | relleno `accion`, borde `borde`; sombra `sombra` (C15) | MEDIDO |
| Botón en la landing real | 56 de alto, radio 12, ancho 100% (auto desde 1024 px) | ver parte 9 | código (`estilos.css:196-213`) |
| Puntos de quiebre | 1024 px (rejilla de 12 columnas) y 375 px | — | código (`estilos.css:920`) |
| Anchos | solo existe 1280×790; no hay versión móvil ni tablet en el Figma | — | NO MEDIDO (F7 no enumera otro ancho) |

El botón real es más grande que el del Figma (56 contra 36) por accesibilidad táctil; no se reduce (DECISIÓN ya aprobada el 14-nov, ver Decisiones). Diferencia S.

### 4 · Textos literales

| Texto | Fuente |
|---|---|
| Descargar para Windows | F7 84:1050; botón de la landing |
| Windgets para Windows | F7 (título de la lámina) |
| Planifica tus tareas y personaliza tu escritorio. | F7 84:1050 |
| Requisitos: Windows 11, de 64 bits (x64), con al menos 500 MB libres y conexión a internet para iniciar sesión por primera vez. | CD-01-HU01-CA03; `textos.ts` (`REQUISITOS`, L18) |
| Windgets está disponible solo para Windows 11, de 64 bits. | CD-01-HU01; `textos.ts:21` (`AVISO_SIN_WINDOWS`) |
| Es posible que tu equipo no cumpla los requisitos. El instalador lo comprobará antes de instalar. | CD-01-HU01; `textos.ts:23` (`AVISO_ARQUITECTURA`) |
| No pudimos iniciar la descarga. Intenta de nuevo. | CD-01-HU02-CA02; `textos.ts:26` (`AVISO_DESCARGA`) |

### 5 · Estados

| Estado | Qué ve la persona |
|---|---|
| Normal | Botón habilitado «Descargar para Windows» |
| Hover/pulsado | Estados del componente Boton (MB-10); sin transición NO MEDIDA en el Figma, se usa 220 ms (`estilos.css`) |
| Descargando | Se abre el enlace de GitHub (INT-12: `https://github.com/${WINDGETS_GITHUB_REPO}/releases/latest/download/Windgets-Setup.exe`); el nombre `Windgets-Setup.exe` lo publica `release.yml:138-147` (nombre fijo, D-194), de modo que el enlace no está roto |
| Sin Windows | Aviso `AVISO_SIN_WINDOWS` visible; el botón sigue habilitado |
| Arquitectura distinta | Aviso `AVISO_ARQUITECTURA` visible; el botón sigue habilitado |
| Falla la descarga | `AVISO_DESCARGA`; el botón sigue habilitado; el aviso desaparece al reintentar (`CD-01-HU02.spec.ts:84`) |
| Comprobando el instalador | Existe en el código: el botón lleva la clase `boton--comprobando` mientras `instaladorDisponible` consulta (`main.ts:150-176`) y el ícono baja en bucle (`estilos.css:235`); el Figma no lo dibuja (NO MEDIDO) |

### 6 · Teclado y foco

Tab recorre botón de descarga, selector de temas y «Volver a la descarga». Enter y Espacio activan el botón. Foco: anillo 2 px `tinta` con radio+3 (D6). El aviso con `role="alert"` se anuncia sin mover el foco.

### 7 · Animaciones

Se conservan las de la landing (`estilos.css`: `cubic-bezier(0.2,0.8,0.2,1)`, 220/80/400 ms, clase `.con-movimiento`, `prefers-reduced-motion` las apaga). El Figma no define animaciones de la landing (A-nn NO MEDIDO). No se añade ninguna.

### 8 · Errores

Ver C-6. La lectura que falla es la consulta de disponibilidad (`instaladorDisponible`, `descarga.ts:19-29`): devuelve `false` tanto si la red cae (`catch`) como si el instalador no existe (`!respuesta.ok`), y siempre muestra el mismo aviso (no es silencioso, pero no distingue la causa). Se separan: red caída = `DESCARGA_SIN_CONEXION` (PROPUESTA) e instalador ausente = `DESCARGA_NO_DISPONIBLE` (CD-01-HU02-CA02; `INSTALADOR_NO_PUBLICADO` queda como alias PROPUESTA de la respuesta no correcta). Mensaje de red caída (PROPUESTA, destino `docs/DUDAS.md`): «No pudimos conectar para iniciar la descarga. Revisa tu conexión e intenta de nuevo.»; el de instalador ausente es el literal de CD-01-HU02-CA02. Las causas de compatibilidad ya tienen código en C-6 (`SISTEMA_NO_WINDOWS`, `ARQUITECTURA_NO_X64`). El repositorio mal configurado (`repositorioValido` falso) lleva al mismo aviso. Si el navegador no entrega las pistas de arquitectura, `detectarCompatibilidad` cae al `userAgent` (`sistema.ts:23-35`, el `catch` no es silencioso: tiene respaldo) y el botón sigue habilitado con cualquier resultado (`main.ts:183`); es el instalador quien valida (CD-01-HU01).

### 9 · Diferencia con el código

| Diferencia | Tamaño | Dónde |
|---|---|---|
| El Figma 84:1050 es una maqueta mucho más pequeña que la landing real | L | S18: se mantiene la landing; se toma lo medible |
| Tema oscuro: el Figma tiene lámina oscura (84:1059); la landing es «Solo modo claro» y su selector tiene tres temas (ninguno oscuro, `panel.ts:8-12`) | L | `estilos.css:3`; destino CD-01 (PROPUESTA: añadir el tema oscuro) |
| `.boton`: 56 de alto, radio 12, relleno y borde `tinta` contra 36, radio 9, relleno `accion`, borde `borde` | M | `estilos.css:196-213`; destino CD-01 |
| Foco: 3 px con separación 3 contra D6 (2 px `tinta`, radio+3) | S | `estilos.css:98-99`; destino CD-01 |
| Duraciones 400 ms (aviso) y 420 ms (pieza, panel) contra la tabla de ANIMACIONES | S | `estilos.css:273`, `:558`; destino `ANIMACIONES.md` |
| `@media (min-width: 1024px)` contra la lámina única 1280×790 | S | `estilos.css:920`; se conserva (P15), destino CD-01 |
| Aviso `role="alert"` sin botón de cierre ni tiempo; G5 pide Error hasta cerrarlo | M | `main.ts:42`; destino CD-01 |
| Sin `data-testid` (se usan clases) | S | `index.html`, `main.ts` |
| Rosa y Enfoque rojo y negro existen en la landing y no en el Figma de esta página | S | no se quitan (aprobado el 14-nov) |

### 10 · Pruebas

Existentes: `e2e/CD-01-HU01.spec.ts` (L11 CA01, L40 y L52 CA02, L60 y L75 CA03), `e2e/CD-01-HU02.spec.ts` (L39 CA01, L67 CA02 por caso, L84 el aviso desaparece), `e2e/carga.spec.ts`, `e2e/movimiento.spec.ts` (1366×768 en L44; 375×812 en L326-330). Nuevas (PROPUESTA): con la red bloqueada (Playwright, `page.route` que aborta la consulta del instalador) aparece el aviso con `DESCARGA_SIN_CONEXION` y el botón sigue habilitado; con respuesta 404 se mantiene el literal de CA02; el botón mide 56 de alto a 375 px y es automático desde 1024 px; `descarga-aviso` tiene `role="alert"`; sin `userAgentData` se decide por `userAgent` (`apps/landing/src` no tiene pruebas unitarias de `sistema.ts`; se cubre con Playwright simulando `userAgentData` ausente).

---

## IN-01 · Opciones de instalación y Sin espacio (84:1068 | 84:1080; 2264:134733 | 2264:134759)

Familia: 2 estados × 2 temas. Código: `installer.nsi` `PaginaOpciones` (L323-357) y `SalirDeOpciones` (L359-383).

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Opciones de instalación | 84:1068 | 84:1080 | no existe | no existe |
| Sin espacio | 2264:134733 | 2264:134759 | no existe | no existe |

### 2 · Estructura

Ventana (marco `fondo`); título «Opciones de instalación» Bold 40 alineado a x=285 (el mismo x que `Contenido`, no centrado en la lámina); tarjeta `Contenido` 710×348 radio 16 `superficie`; fila de carpeta; fila de inicio con Interruptor; botones «Instalar» y «Cancelar». En Sin espacio se añaden dos líneas (espacio y error) y «Instalar» queda deshabilitado.

| Capa Figma | Identificador | Estado |
|---|---|---|
| Título | `instalador-opciones-titulo` | identificador de prueba por texto, sin DOM (IN-00) |
| Fila «Carpeta de instalación» 654×57 `superficie_baja` r8 | `instalador-fila-carpeta` | NUEVA |
| Botón «Cambiar» | no se construye | D14 (oculto en el Figma); `InstallDir` fija |
| Fila «Abrir la aplicación al iniciar Windows» | `instalador-fila-arranque` | existe como casilla; pasa a interruptor (CD-02-HU02) |
| Interruptor 44×24 en (595,17) dentro de la fila | `instalador-interruptor-arranque` | sujeto al límite de NSIS (IN-00) |
| «Instalar» 83×36 Principal | `instalador-instalar` | existe (botón de MUI) |
| «Cancelar» 91×36 Secundario | `instalador-cancelar` | existe |
| Espacio (28,172) | `instalador-espacio` | existe, en dos etiquetas |
| Error de espacio (28,204) | `instalador-error-espacio` | existe como etiqueta |

### 3 · Medidas

| Elemento | Medida | Token | Fuente |
|---|---|---|---|
| Título | Bold 40, en (285,106), 473×47 (alineado con Contenido, no centrado en la lámina) | `tinta` | MEDIDO (84-1068) |
| Contenido | en (285,186), 710×348, radio 16 | `superficie` | MEDIDO |
| Fila de carpeta | en (28,25) del contenido, 654×57, radio 8 | `superficie_baja` | MEDIDO |
| Etiqueta de fila | en (15,8) de la fila, 177×20, Regular 17 | `tinta` | MEDIDO |
| Ruta | en (15,32) de la fila, 263×17, Regular 14 | `texto` | MEDIDO |
| Botón Cambiar | oculto en la lámina (D14) | — | MEDIDO |
| Fila de inicio | en (28,97) del contenido, 654×57, radio 8 | `superficie_baja` | MEDIDO |
| Etiqueta de inicio | en (15,19) de la fila, 284×20, Regular 17 | `tinta` | MEDIDO |
| Interruptor | en (595,17) de la fila, 44×24, radio 8, borde 1,5; Encendido | relleno y borde `principal_legible` (oscuro #00d9e2); coincide con MB-13 | MEDIDO |
| Instalar | en (28,273), 83×36, radio 9, borde 1,5, sombra 3,5,0 | relleno `accion`, borde `borde` | MEDIDO |
| Cancelar | en (125,273), 91×36, radio 9, borde 1,5 | relleno `superficie`, borde `borde` | MEDIDO |
| Espacio (Sin espacio, 2264-134733) | en (28,172), 441×20, Regular 17 | `tinta` | MEDIDO |
| Error (Sin espacio) | en (28,204), 624×20, Regular 17, con ícono de 16 (E19/T15) | `error` (oscuro #ff8a80) | MEDIDO el texto; ícono DECISIÓN |
| Instalar deshabilitado (Sin espacio) | misma geometría, opacidad 0,4 | variante Deshabilitado (E3) | MEDIDO |
| Alto del contenedor en Sin espacio | igual a Normal (348) | — | NO MEDIDO (F7 no lo enumera; el espacio ocupa y 172 a 224 dentro de 348) |

### 4 · Textos literales

| Texto | Fuente |
|---|---|
| Opciones de instalación | F7 (hoy el código dice «Opciones», parte 9) |
| Carpeta de instalación | F7 |
| %LOCALAPPDATA%\Programs\Windgets | F7; ruta real `InstallDir` |
| Abrir la aplicación al iniciar Windows | CD-02; `installer.nsi:90` |
| Espacio disponible: 320 MB · Espacio requerido: 500 MB | F7 2264:134733 (una sola línea; el 320 es un ejemplo, el dato real lo lee el instalador) |
| No hay suficiente espacio en disco. Libera al menos 500 MB e intenta de nuevo. | `installer.nsi:81` |
| Instalar / Cancelar | F7 |

### 5 · Estados

| Estado | Qué ve la persona |
|---|---|
| Normal | «Instalar» habilitado; interruptor según la elección (por defecto, CD-02-HU02-CA01) |
| Sin espacio | línea de espacio, línea de error en `error` con ícono 16, «Instalar» deshabilitado (variante Deshabilitado, E3) |
| Cancelar | abre M-01 (IN-04) |
| Instalar con instalación previa | abre M-16 o M-17 (IN-05) antes de seguir |

### 6 · Teclado y foco

Tab: interruptor, «Instalar», «Cancelar». Espacio alterna el interruptor. Esc equivale a Cancelar y abre M-01 (no cierra sin confirmar). Foco inicial: «Instalar»; con Sin espacio, «Cancelar». Esc abre M-01 y el foco inicial de M-01 es «Seguir instalando» (IN-04). El foco visible de nsDialogs es el nativo de Windows (límite de NSIS, IN-00).

### 7 · Animaciones

A-34: fundido `opacity` en `--dur-corto` al pasar de paso; NO MEDIDA la transición entre Opciones y En curso (I-13 sigue pendiente). NSIS no anima entre páginas (IN-00).

### 8 · Errores

`SIN_ESPACIO_EN_DISCO` (C-6). `MedirEspacio` (`installer.nsi:266-269`) usa `DriveSpace` sobre la raíz de `$INSTDIR`; si no puede medir, `$EspacioLibreMB` queda vacío y NSIS lo compara como 0, así que hoy cae en Sin espacio con el mensaje de espacio (y en modo silencioso sale con 2, L310-313): camino real con mensaje engañoso. Regla: si no se puede medir, se trata como Sin espacio (lado seguro), salida 2 de INT-13, con el mensaje propio de `ESPACIO_NO_MEDIBLE` (PROPUESTA, C-6). Prueba: unidad no medible, Opciones con «Instalar» deshabilitado y salida 2 en silencioso. «Instalar» no se oculta: se deshabilita y el mensaje explica por qué.

### 9 · Diferencia con el código

| Diferencia | Tamaño | Dónde |
|---|---|---|
| Sin fila de carpeta ni ruta | M | `installer.nsi:323-357` |
| Casilla en lugar de interruptor 44×24 | M | `installer.nsi:337` |
| Título «Opciones» contra «Opciones de instalación» | S | encabezado de la página en `installer.nsi` |
| Espacio en dos etiquetas y orden distinto (requerido antes que disponible) | S | `installer.nsi:332-334` |
| Error de espacio en etiqueta sin ícono; botón deshabilitado con `EnableWindow 0` | S | `installer.nsi:351` |
| Sin tema oscuro, fuente del tema, radios ni sombras | L | IN-00, S17: se aproximan colores, fuentes por control, interruptor y barra con nsDialogs; radios y sombras quedan como diferencia aceptada (D-194) |

### 10 · Pruebas

Existentes: `installer/pruebas/interfaz.py:788` (CD-02-HU01-CA04, espacio insuficiente), `:731` (CD-02-HU02-CA02), `installer/pruebas/instalador.ps1:123` y `:144` (HU02-CA01 y CA02). Nuevas (PROPUESTA): unidad no medible (ver parte 8); la línea de espacio muestra «Espacio disponible: N MB · Espacio requerido: 500 MB» en una línea; la fila de carpeta muestra la ruta real; con Sin espacio «Instalar» queda deshabilitado y el mensaje coincide literal.

---

## IN-02 · Instalación en curso (84:1092 | 84:1102)

Código: `Section Install` (L591-692), encabezado «Instalación en curso» (L415) y página de archivos de MUI.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Instalación en curso | 84:1092 | 84:1102 | no existe | no existe |

### 2 · Estructura

| Capa Figma | Identificador | Estado |
|---|---|---|
| «Instalando Windgets» | `instalador-curso-titulo` | NUEVA (hoy el encabezado dice «Instalación en curso») |
| Barra `Total` 618×12 `superficie_baja` r6 | `instalador-curso-total` | NUEVA |
| Barra `Progreso` 640×12 `secundario` r6 | `instalador-curso-progreso` | NUEVA; A14: nunca mayor que Total (618) |
| Texto de avance «Instalando… N %» | `instalador-curso-avance` | PROPUESTA (E10), `texto` 14 |
| «Cancelar» 91×36 | `instalador-cancelar` | existe |

### 3 · Medidas

Título «Instalación en curso» Bold 40 en (285,106), 404×47 `tinta`; Contenido en (285,186), 710×348. Fila en (28,25), 654×57, radio 8, `superficie_baja`, con «Instalando Windgets» Regular 17 `tinta` en (15,11), 161×20. Total en (46,180), 618×12, radio 6, `superficie_baja`. Progreso en (46,180), radio 6, `secundario` (oscuro #d3b2ff), de 640×12 en el Figma: rebasa Total (A14); regla: ancho `618 × avance`, con tope 100 %. «Cancelar» en (28,273), 91×36, radio 9, `superficie` + `borde`. El texto «Instalando… N %» (E10) no existe en la lámina: no tiene posición medida (NO MEDIDO).

### 4 · Textos literales

«Instalando Windgets» (F7); «Cancelar» (F7); «Instalando… N %» (PROPUESTA, E10; el Figma no trae número).

### 5 · Estados

Sin número todavía: barra en 0. Con número: barra proporcional y texto de avance. El Figma salta a Completada a los 2 s (AFTER_TIMEOUT → 84:1112); eso es del prototipo: el instalador real avanza al terminar la copia (ver No se construye). Cancelar abre M-01.

### 6 · Teclado y foco

Tab llega a «Cancelar»; Enter lo activa y abre M-01. Foco inicial en «Cancelar».

### 7 · Animaciones

A-35: la barra crece con `scaleX` en `--dur-medio` y `--ease-estandar`. NSIS no lo permite (IN-00); la barra de MUI avanza por pasos.

### 8 · Errores

Falla la copia: `INSTALACION_FALLIDA` → M-20 (IN-07) tras revertir (`Revertir`, L473-519). Cancelación: IN-04 y M-21 (IN-06).

### 9 · Diferencia con el código

| Diferencia | Tamaño | Dónde |
|---|---|---|
| Barra de MUI en lugar de Total/Progreso propias | M | página de archivos de `installer.nsi` |
| Sin «Instalando Windgets» ni «Instalando… N %» | S | `installer.nsi:415` |
| Sin animación A-35 | M | IN-00 |

### 10 · Pruebas

Existente: `interfaz.py:617` (CD-02-HU03-CA03, seguir con la instalación). Nuevas (PROPUESTA): el progreso nunca supera el total; el texto «Instalando… N %» coincide con la barra.

---

## IN-03 · Instalación completada (84:1112 | 84:1120)

Código: `PaginaCompletada` (L428-448), `AbrirWindgets` (L452).

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Instalación completada | 84:1112 | 84:1120 | no existe | no existe |

### 2 · Estructura

| Capa Figma | Identificador | Estado |
|---|---|---|
| «Instalación completada.» | `instalador-completada-titulo` | existe (L433) |
| «Ya puedes eliminar el archivo del instalador que descargaste.» | `instalador-completada-nota` | existe (L435) |
| «Abrir Windgets» 134×36 | `instalador-abrir` | existe (L437) |
| Envoltorio de clic 75×36 | no se construye | C14 |

### 3 · Medidas

Título «Instalación completada» Bold 40 en (285,106), 468×47 `tinta`; Contenido en (285,186), 710×348. Caja en (28,25), 654×57, radio 8, `superficie_baja`, con el texto de dos líneas en (15,11), 480×40, Regular 17 `tinta` (la caja de 57 apenas contiene las dos líneas). «Abrir Windgets» en (28,273): envoltorio 75×36, botón 134×36, radio 9, Principal `accion`, borde `borde`; la capa «Cerrar» está oculta. Resto como IN-01.

### 4 · Textos literales

«Instalación completada.» y «Ya puedes eliminar el archivo del instalador que descargaste.» (`installer.nsi:88-89`); «Abrir Windgets».

### 5 · Estados

Normal. Abrir pulsado: abre la aplicación como el usuario, sin elevación (`AbrirWindgets`). El botón de cierre del instalador pasa a «Cerrar» (L441-442) y Atrás y Cancelar se ocultan (L443-446).

### 6 · Teclado y foco

Foco inicial en «Abrir Windgets». Esc cierra el instalador (la instalación ya terminó; no hay M-01).

### 7 · Animaciones

A-34, fundido de entrada; la duración exacta no está en el Figma (NO MEDIDO): se toma `--dur-corto`.

### 8 · Errores

`AbrirWindgets` (`installer.nsi:452-457`) llama `nsis_tauri_utils::RunAsUser` y no lee el resultado: si no abre, el instalador se cierra igual (fallo silencioso real). Propuesta: leer el resultado y, si falla, mostrar el aviso «No pudimos abrir Windgets. Ábrelo desde el menú Inicio.» con código `ABRIR_APLICACION_FALLIDO` (PROPUESTA, Pendientes con destino 1 y 5), con prueba.

### 9 · Diferencia con el código

Textos y botón coinciden con el Figma (S, solo estilo). Falta el aviso de error de apertura (M, PROPUESTA).

### 10 · Pruebas

Existente: `instalador.ps1:111` (CD-02-HU01-CA01, instalación exitosa). Nuevas: «Abrir Windgets» lanza la aplicación; aviso cuando falla.

---

## IN-04 · M-01 Cancelar instalación (85:2 | 85:8)

Hereda MB-22 (papel 424×160 en (88,48), radio 10, pliegue 22, D5) y MB-23.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| M-01 | 85:2 | 85:8 | no existe | no existe |

### 2 a 4 · Estructura, medidas y textos

Marco 600×256 radio 8 `fondo`, velo `velo` (C16), papel 424×160 en (88,48), título Bold 20 en (108,66) «Cancelar instalación», cuerpo Regular 14 en (108,100) «¿Deseas cancelar la instalación?» (ancho 382; `installer.nsi:86`), X 32×32 radio 9 en (460,58), botones en y=158 alto 36: «Seguir instalando» (Secundario, 153) y «Cancelar instalación» (173; el Figma lo pinta Principal, D13 lo pasa a Destructivo con borde y texto `error`).

### 5 · Estados

«Seguir instalando» cierra el diálogo y deja activa la página en la que estaba (Opciones o En curso; `AlCancelar`, `installer.nsi:389-410`); la X y Esc equivalen a «Seguir instalando». «Cancelar instalación» desde Opciones cierra con código 1 sin nada que revertir (CD-02-HU03-CA05); en curso marca la cancelación y la sección revierte en su siguiente punto de cancelación y abre M-21 (IN-06).

### 6 a 7 · Teclado y animación

Foco inicial en «Seguir instalando»: `Elegir` deja por defecto el botón 102 (la segunda opción), que aquí es la no destructiva (D13, MB-23); lo cumple. Esc = «Seguir instalando». P6: sin transición propia (NO MEDIDO).

### 8 · Errores

Brecha real (M): `Revertir` (`installer.nsi:473-508`) no comprueba errores de `RMDir /r`, `Rename` ni de las claves, y `PuntoDeCancelacion` (L511-518) muestra M-21 aunque la reversión falle: no existe un camino a M-20 desde aquí. Propuesta: comprobar `IfErrors` en `Revertir`; si falla, en lugar de M-21 mostrar «No pudimos deshacer todos los cambios. Elimina la carpeta %LOCALAPPDATA%\Programs\Windgets y vuelve a intentarlo.» con `REVERSION_FALLIDA` (C-6) y salida 4. Destino: `docs/DUDAS.md` y `docs/CD-02.md`. Prueba: archivo bloqueado en la carpeta, cancelar en curso y confirmar; se espera ese mensaje y salida 4, no M-21.

### 9 · Diferencia con el código

`AlCancelar` (L389-410) usa `TaskDialogIndirect` nativo con el texto correcto; «Cancelar instalación» no es Destructivo y no hay X 32×32 (límite de IN-00; M).

### 10 · Pruebas

Existente: `interfaz.py:617` (CD-02-HU03-CA03). Nueva: «Cancelar instalación» y «Seguir instalando» con foco inicial en el segundo.

---

## IN-05 · M-16 Reinstalar y M-17 Reparar (85:190 | 85:196; 85:202 | 85:206)

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| M-16 | 85:190 | 85:196 | no existe | no existe |
| M-17 | 85:202 | 85:206 | no existe | no existe |

### 2 a 4 · Estructura, medidas y textos

Papel 424×160 (88,48). M-16: «Reinstalar Windgets» / «Windgets ya está instalada. ¿Deseas reinstalarla?»; «Reinstalar» (Principal 103) y «Cancelar» (Secundario 95). M-17: «Reparar instalación» / «Encontramos una instalación incompleta. Vamos a repararla.»; «Reparar» (88) y «Cancelar» (95).

### 5 · Estados

Reinstalar o Reparar siguen a En curso (84:1092). Cancelar cierra el instalador con código 1 sin tocar la instalación existente (`SalirDeOpciones`, `installer.nsi:359-383`; CD-02-HU01-CA07 y CA11). El Figma manda «Cancelar» a 84:1068; es diferencia con destino `docs/CD-02.md`, manda el CA.

### 6 a 7 · Teclado y animación

`Elegir` deja por defecto el botón 102, que aquí es «Cancelar» (no la acción de reemplazar); se declara así (MB-22: foco no en la acción destructiva). Esc = Cancelar. Sin A-nn.

### 8 · Errores

Si la reinstalación o reparación falla: `INSTALACION_FALLIDA` → M-20.

### 9 · Diferencia con el código

`SalirDeOpciones` (L359-383) abre M-16 (L370) con la macro `Elegir`; M-17 igual. Botones y textos coinciden; faltan X 32×32 y radios (M, IN-00).

### 10 · Pruebas

Existentes: `interfaz.py:670` (HU01-CA05 y CA07), `:685` (CA06), `:704` (CA09 y CA11), `:716` (CA10); `instalador.ps1:127` y `:136`.

---

## IN-06 · M-18 Equipo no compatible, M-19 Instalador dañado y M-21 Instalación cancelada

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| M-18 | 2264:134573 | 2264:134590 | no existe | no existe |
| M-19 | 2264:134607 | 2264:134624 | no existe | no existe |
| M-21 | 2264:134683 | 2264:134700 | no existe | no existe |

### 2 a 4 · Estructura, medidas y textos

Papel 424×160, solo X en el Figma; D12 añade «Entendido» (Principal) a los tres. M-18: «Equipo no compatible» / «Este computador no es compatible. Necesitas Windows 11, de 64 bits (x64).» M-19: «Instalador dañado» / «El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page.» M-21: «Instalación cancelada» / «La instalación se canceló.»

### 5 · Estados

Entendido o X cierran el instalador: M-18 con salida 2, M-19 con salida 3, M-21 con salida 1 (CD-02-INT-13). El destino del Figma (84:1068) es del prototipo; el instalador real cierra.

### 6 a 7 · Teclado y animación

Foco inicial en «Entendido»; Enter y Esc lo activan. Sin A-nn.

### 8 · Errores

M-18 es `EQUIPO_NO_COMPATIBLE` y M-19 es `INSTALADOR_DANADO` (PROPUESTA, C-6). M-21 no es un error.

### 9 · Diferencia con el código

`.onInit` (L281-317): M-19 con `MessageBox MB_ICONSTOP` (L291), M-18 igual (L298); M-21 en `PuntoDeCancelacion` con `MB_ICONINFORMATION`. Sin «Entendido» ni X 32×32: usan el «Aceptar» del sistema (M, D12). Los textos coinciden.

### 10 · Pruebas

Existentes: `interfaz.py:802` (HU01-CA03, no compatible), `:504` y `:518` (HU01-CA12, incompleto y dañado). Nueva: «Entendido» presente en M-18, M-19 y M-21 y salida con el código correcto.

---

## IN-07 · M-20 Falla de instalación (2264:134641 | 2264:134662)

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| M-20 | 2264:134641 | 2264:134662 | no existe | no existe |

### 2 a 4 · Estructura, medidas y textos

Papel 424×160. «Falla de instalación» / «No pudimos completar la instalación. No se hicieron cambios en tu computador.» «Reintentar» (Principal 107) y «Cerrar» (Secundario 78).

### 5 · Estados

Reintentar vuelve a ejecutar el instalador (`Exec "$EXEPATH"`, `installer.nsi:521-529`), que arranca de nuevo en Opciones (CD-02-HU01-ET23); Cerrar sale con código 4. El Figma manda «Reintentar» a 84:1092 (En curso): diferencia con destino `docs/CD-02.md`; manda el CA/ET23.

### 6 a 7 · Teclado y animación

Foco inicial en «Reintentar»; Esc = Cerrar. Sin A-nn.

### 8 · Errores

`INSTALACION_FALLIDA` (G1p). «No se hicieron cambios» es una promesa: la prueba comprueba que `Revertir` dejó el equipo como estaba.

### 9 · Diferencia con el código

`FallaDeInstalacion` (L521-529) usa el diálogo nativo con los dos botones y el texto; sin X ni estilos (M, IN-00).

### 10 · Pruebas

Existente: `instalador.ps1:151` (HU01-CA08, error durante la instalación). Nueva: Reintentar relanza y Cerrar sale con 4.

---

## Tabla de geometría

Origen: esquina superior izquierda del marco 1280×790 de la lámina; coordenadas MEDIDO de F7/F8. La ventana real de NSIS no iguala estos píxeles (IN-00).

| Elemento | x | y | ancho × alto | Pieza | Identificador | Fuente |
|---|---|---|---|---|---|---|
| Logotipo | 50 | 34 | 34 × 31 | láminas | — | MEDIDO |
| «windgets» Bold 26 | 91 | 34 | — | láminas | — | MEDIDO |
| Título Windgets para Windows | 56 | 106 | 467 × 47 | WE-01 | `landing-titulo` | MEDIDO |
| Contenido | 54 | 186 | 1172 × 550 | WE-01 | `landing-contenido` | MEDIDO |
| Subtítulo (en Contenido) | 34 | 77 | 688 × 37 | WE-01 | `landing-subtitulo` | MEDIDO |
| «Tareas del día» (en Contenido) | 54 | 208 | 163 × 28 | WE-01 | `landing-tareas` | MEDIDO |
| «Preparar la entrega» (en Contenido) | 54 | 263 | 197 × 26 | WE-01 | `landing-entrega` | MEDIDO |
| Botón Descargar (en Contenido) | 34 | 465 | 197 × 36 | WE-01 | `descarga-boton` | MEDIDO |
| Título Opciones | 285 | 106 | 473 × 47 | IN-01 | `instalador-opciones-titulo` | MEDIDO |
| Contenido (IN-01 a IN-03) | 285 | 186 | 710 × 348 | IN-01 a IN-03 | — | MEDIDO |
| Fila carpeta (en Contenido) | 28 | 25 | 654 × 57 | IN-01 | `instalador-fila-carpeta` | MEDIDO |
| Fila inicio automático (en Contenido) | 28 | 97 | 654 × 57 | IN-01 | `instalador-fila-arranque` | MEDIDO |
| Interruptor (en fila) | 595 | 17 | 44 × 24 | IN-01 | `instalador-interruptor-arranque` | MEDIDO |
| Instalar (en Contenido) | 28 | 273 | 83 × 36 | IN-01 | `instalador-instalar` | MEDIDO |
| Cancelar (en Contenido) | 125 (28 en IN-02) | 273 | 91 × 36 | IN-01, IN-02 | `instalador-cancelar` | MEDIDO |
| Espacio (en Contenido) | 28 | 172 | 441 × 20 | IN-01 | `instalador-espacio` | MEDIDO |
| Error de espacio (en Contenido) | 28 | 204 | 624 × 20 | IN-01 | `instalador-error-espacio` | MEDIDO |
| Título En curso | 285 | 106 | 404 × 47 | IN-02 | `instalador-curso-titulo` | MEDIDO |
| Fila En curso (en Contenido) | 28 | 25 | 654 × 57 | IN-02 | `instalador-curso-fila` | MEDIDO |
| Total (en Contenido) | 46 | 180 | 618 × 12 | IN-02 | `instalador-curso-total` | MEDIDO |
| Progreso (en Contenido) | 46 | 180 | 640 × 12 (se limita a 618, A14) | IN-02 | `instalador-curso-progreso` | MEDIDO |
| Título Completada | 285 | 106 | 468 × 47 | IN-03 | `instalador-completada-titulo` | MEDIDO |
| Caja Completada (en Contenido) | 28 | 25 | 654 × 57 | IN-03 | `instalador-completada-nota` | MEDIDO |
| Abrir Windgets (en Contenido) | 28 | 273 | 134 × 36 (envoltorio 75 × 36) | IN-03 | `instalador-abrir` | MEDIDO |
| Diálogo | 88 | 48 | 424 × 160 (512 en M-03/M-15) | M-nn | — | MEDIDO |
| X | 460 | 58 | 32 × 32 | M-nn | — | MEDIDO |
| Título de diálogo | 108 | 66 | — | M-nn | — | MEDIDO |
| Cuerpo | 108 | 100 | 382 × — | M-nn | — | MEDIDO |
| Botones de diálogo | — | 158 | — × 36 | M-nn | — | MEDIDO |

Las celdas con guion en x o y no las midió la huella (NO MEDIDO: la huella da el ancho y alto, no la posición dentro del marco).

## Incoherencias resueltas

| # | Incoherencia | Resolución |
|---|---|---|
| 1 | M-01 «Cancelar instalación» Principal en el Figma | Destructivo (D13) |
| 2 | M-18, M-19 y M-21 solo con X | Se añade «Entendido» (D12) |
| 3 | Botón «Cambiar» oculto en el Figma | No se construye (D14) |
| 4 | Progreso 640 > Total 618 | Progreso nunca mayor que Total (A14) |
| 5 | Sin espacio: «Instalar» con opacidad 0,4 | Variante Deshabilitado (E3) |
| 6 | Error de espacio solo con color | Ícono de 16 más texto `error` (E19/T15) |
| 7 | Interruptor en el Figma, casilla en CD-02-HU02 | Se implementa el interruptor; los CA no cambian (destino `docs/CD-02.md`) |
| 8 | Textos en Rubik | Fuente del tema (T12/T18) |
| 9 | Flujo §11 punto 6: «320 MB» | Es el ejemplo del Figma; el dato real lo lee el instalador (`$EspacioLibreMB`) |
| 10 | Destinos de reacciones que en el prototipo vuelven a otra lámina | El instalador real sale con su código (CD-02-INT-13) |
| 11 | Botones sin destino en el Figma | Se implementa la acción de la HU (P3) |
| 12 | Landing 84:1050 contra landing real | S18: se mantiene la landing y se toma lo medible |
| 13 | Progreso 640 > Total 618 | A14 (IN-02); N12 es otra: título repetido de Completada, se resuelve con un solo título |
| 14 | «Cancelar» de M-16/M-17 y «Reintentar» de M-20 llevan a otra lámina en el Figma | Manda el CA/ET23: cerrar y volver a Opciones; destino `docs/CD-02.md` |

## No se construye

- Botón «Cambiar» carpeta (D14): `InstallDir` queda fija en `$LOCALAPPDATA\Programs\Windgets`.
- Envoltorios de clic y textos ocultos del Figma (C14), p. ej. el envoltorio 75×36 de «Abrir Windgets».
- Salto automático a Completada a los 2 s (AFTER_TIMEOUT): es del prototipo.
- Láminas de presentación del Figma (portadas, notas, marcos con el logotipo): son material de diseño, no pantallas.
- Copiar enlaces a «Windgets--Copy-» (P1).
- Versión móvil o tablet del Figma: no existe.
- Estados Rosa y Enfoque en el instalador: no existen en el Figma.

## Decisiones ya tomadas que se citan

D5, D6, D9, D12, D13, D14, D15/P15, P1, P3, P6, G1p, G5, G13, G16, G17, E3, E10, E19/T15, A14, A16, A-34, A-35, C14, C15, C16, T12/T18; aprobaciones de Paula del 14-nov-2026 sobre los textos de la landing; D-194 (nombre fijo `Windgets-Setup.exe`), D-195 (landing en Vercel); `DECISIONES_PAULA_26nov.md`; S17 (instalador con nsDialogs, sin radios ni sombras, 27-nov); S18 (se mantiene la landing y se toma de 84:1050 lo medible, 27-nov).

## CA → prueba

| CA | Prueba | Dónde |
|---|---|---|
| CD-01-HU01-CA01 | Textos y botón de la landing | `CD-01-HU01.spec.ts:11` |
| CD-01-HU01-CA02 | Dispositivo sin Windows: aviso de solo Windows 11 de 64 bits | `CD-01-HU01.spec.ts:40`, `:52` |
| CD-01-HU01-CA03 | Windows no x64: aviso de requisitos posiblemente no cumplidos | `CD-01-HU01.spec.ts:60`, `:75` |
| CD-01-HU02-CA01 | Descarga | `CD-01-HU02.spec.ts:39` |
| CD-01-HU02-CA02 | Aviso de descarga fallida, botón habilitado | `CD-01-HU02.spec.ts:67`, `:84` |
| CD-02-HU01-CA01 | Instalación exitosa | `instalador.ps1:111` |
| CD-02-HU01-CA03 | No compatible | `interfaz.py:802` |
| CD-02-HU01-CA04 | Sin espacio | `interfaz.py:788` |
| CD-02-HU01-CA05, CA07 | Ya instalada y cancelar | `interfaz.py:670` |
| CD-02-HU01-CA06 | Reinstalar | `interfaz.py:685`; `instalador.ps1:127` |
| CD-02-HU01-CA08 | Error durante la instalación | `instalador.ps1:151` |
| CD-02-HU01-CA09, CA11 | Incompleta y cancelar | `interfaz.py:704` |
| CD-02-HU01-CA10 | Reparar | `interfaz.py:716`; `instalador.ps1:136` |
| CD-02-HU01-CA12 | Dañado o incompleto | `interfaz.py:504`, `:518`; `instalador.ps1:87`, `:100` |
| CD-02-HU02-CA01, CA02 | Inicio automático | `instalador.ps1:123`, `:144`; `interfaz.py:731` |
| CD-02-HU03-CA03 | Seguir instalando | `interfaz.py:617` |
| CD-02-HU03-CA01, CA02 | Cancelar en curso y confirmar | `interfaz.py:596-603` |
| CD-02-HU03-CA04, CA05, CA06 | Cancelar desde Opciones, volver y cerrar | `interfaz.py:536-543` |
| Interruptor, fila de carpeta, «Entendido», avance «Instalando… N %», aviso de abrir | PROPUESTA, sin prueba hoy | IN-01, IN-02, IN-03, IN-06 parte 10 |

## Pendiente de Paula

Ninguno; resueltos por S17 y S18 el 27-nov.

## Pendientes con destino

| # | Qué | Destino |
|---|---|---|
| 1 | Códigos `EQUIPO_NO_COMPATIBLE`, `SIN_ESPACIO_EN_DISCO`, `INSTALADOR_DANADO`, `DESCARGA_NO_DISPONIBLE`, `ABRIR_APLICACION_FALLIDO` (PROPUESTA) | `docs/DUDAS.md` |
| 2 | CD-02-HU02: «casilla» pasa a «interruptor» sin cambiar los CA | `docs/CD-02.md` |
| 3 | Texto «Instalando… N %» (E10) y fila de carpeta con ruta | `docs/CD-02.md` (CA derivados en HU01) |
| 4 | Qué hacer si no se lee el espacio libre | `docs/DUDAS.md` |
| 5 | Aviso si no se puede abrir la aplicación al final | `docs/CD-02.md` |
| 6 | Transición entre pasos del instalador (A-34, I-13) y hover/pulsado de la landing | `ANIMACIONES.md` |
| 7 | La cabecera de `installer/pruebas/instalador.ps1` L3 dice que HU03 y varios CA se prueban a mano, pero hoy `interfaz.py` los prueba | `installer/pruebas/instalador.ps1:3-5` (corregir el comentario; es código) |
| 8 | `Revertir` sin comprobación de errores y M-21 aunque falle; `AbrirWindgets` sin leer `RunAsUser` | `installer/installer.nsi:473-518` y `:452-457` |
| 9 | `instaladorDisponible` no distingue red caída de instalador ausente | `apps/landing/src/descarga.ts:19-29` |
| 10 | Landing sin tema oscuro, botón 56/`tinta`, foco 3 px, 400/420 ms, aviso sin cierre contra Figma/D6/ANIMACIONES/G5 | `apps/landing/src/estilos.css:3`, `:196-213`, `:98-99`, `:273`, `:558`; `main.ts:40-42` |

## Lecturas de Figma pendientes

Ninguna que bloquee: las huellas citadas se leyeron. Siguen NO MEDIDOS el alto del contenedor de En curso, Completada y Sin espacio, las transiciones entre pasos del instalador, el hover/pulsado de la landing y cualquier ancho distinto de 1280.

