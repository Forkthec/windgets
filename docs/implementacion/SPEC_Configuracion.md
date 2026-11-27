# SPEC · Configuración (página 79:6 «Configuración»)

Fecha: 26-nov-2026 (hora colombiana). Estado: BORRADOR local, sin subir a ningún sitio (regla de Paula: nada generado con IA se sube sin su sí).
Llegó hasta: completo (CF-01 a CF-06 y las secciones finales), corregido con los hallazgos del revisor. No se usó el conector de Figma. Las huellas 204-3159, 2251-* y 217-20340/20400/20460 las leyó el revisor y sus medidas ya están incorporadas.

## Alcance

Las 19 familias de la página 79:6 de `.trabajo/figma/F5.md` (se ignora «Descartado» 2075:3647) y el flujo §8 de `docs/rediseno_flujos_prototipos.md` (Configuración ↔ Cómoda; «Cerrar sesión» → M-11; Windi → overlay; M-12 y los avisos sin entrada). Código: `apps/desktop/src/screens/settings/` (`Settings.tsx`, `CerrarSesion.tsx`, `configuracion.css`, `Settings.test.tsx`), `ventana_principal/IndicadorSincronizacion.tsx` y `src-tauri` (`integracion_con_el_sistema/inicio_automatico.rs`, `puente_ipc.rs`, `messages.rs`). HU: `docs/HE-16.md` (HU01 indicador, HU02 inicio automático, HU03 cerrar sesión).

No se repite lo que ya tiene dueño; se cita por id:

| Familia de F5 | Dueño |
|---|---|
| Indicador «Sincronizado / Sincronizando… / Sin conexión / Error de sincronización» (4 estados × 4 temas) | MB-04 (medidas, textos, A-36); aquí solo qué ve Configuración (CF-05) |
| Avisos (6 × 4 temas) | MB-06 (componente, tiempos G5, roles, A-05/A-06/A-07); aquí quién dispara cada uno (CF-03, CF-04, CF-05) |
| Windi superpuesto (6 estados × 4 temas) | MB-05, SPEC_Windi (WI-nn), SPEC_Personalizacion_y_widgets PW-15; aquí solo el botón flotante y el ítem de la tabla de geometría (CF-06) |
| M-11 «Cerrar sesión» y M-12 «Cambios sin sincronizar» | SPEC_Cuenta_y_Acceso AC-09; aquí solo el botón que los abre (CF-04) |
| Temas, apariencia, formatos, widgets | SPEC_Personalizacion_y_widgets (no se tocan aquí) |

## Fuentes y orden de autoridad

Figma (F5, huellas, F0/F0b) → `docs/rediseno.md` y RD-nn → HU y `docs/contratos.md` → `docs/rediseno_cambios_implementacion.md`. Autoridad que se cita sin contradecir: `CONSISTENCIA.md`, `TEMAS_Y_TOKENS.md`, `ANIMACIONES.md`, `SPEC_Marco_y_componentes_base.md` (MB-nn), `.trabajo/DECISIONES_PAULA_26nov.md`. Regla de inventario: unificar al valor de la variable o del componente de F0; la diferencia con la huella va a «Incoherencias resueltas».

## Etiquetas

MEDIDO (huella o F5), DECISIÓN (ya tomada por Paula o por CONSISTENCIA), PROPUESTA (sin base; confirmar), NO MEDIDO (motivo). Tamaño de la diferencia con el código: S, M, L. NUEVA = función sin código hoy.

## Convenciones comunes

**C-1 · Colores por variable.** Nunca hex. Tarjeta: relleno `superficie`, borde `linea` 1 (E: F5). Título y nombre de fila `tinta`; descripciones `texto`; borde de controles `borde` 1,5. Selector, opción elegida: relleno `seleccion` y texto `sobre_seleccion`; no elegida, texto `tinta` (MB-14 L514, F0 2005:397 y huellas; en claro la huella trae `#ffffff` fijo, se unifica a la variable, incoherencia 1). Interruptor apagado: relleno `superficie`, trazo `borde_campo` y perilla 16×16 radio 5 `borde_campo` (MB-13 L499, huella 2251-4979). Interruptor encendido: relleno y trazo `principal_legible`, perilla `perilla`. Fuente: CONSISTENCIA C1/C3/C14/C17, TEMAS_Y_TOKENS.

**C-2 · Radios y alturas.** Tarjeta radio 8 (medido; F0 la trae como radio de tarjeta, R1 no la cambia); selector segmentado y botones radio 9 (R1); interruptor radio 8 (R1); controles 36 de alto (A1); aviso píldora radio 21 (R5); botón flotante de Windi 48×48 radio 14 (MB-05). Foco: 2 px `tinta`, radio del control + 3 (R7, D6).

**C-3 · Tipografía.** Fuente del tema (Nunito claro y oscuro, Quicksand Rosa, Space Grotesk Enfoque). Miga Regular 13; título Bold 26; nombre de fila Medium 17; descripción Regular 14; opciones del selector y botón Medium 14; «Sincronizado» Regular 12. En Rosa y Enfoque los anchos de texto cambian (título 167→176 y 178; selector 184→193): el contenedor no fija ancho al texto, crece. Tamaños de letra (P4): Pequeño 12, Mediano 14, Grande 18; las pruebas de altura se hacen en Grande.

**C-4 · Tipo de aviso y duración (G5).** Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrarlo; fundido 0,15 s (A-05/A-06/A-07, MB-06). Un solo patrón de error: píldora con ícono y cierre (G4). Posición y ancho máximo: D7 (conflicto con RD-63/RD-104 sin resolver en MB-06, pendiente 1; no se repite).

**C-5 · Una pantalla, un scroll.** Configuración cabe sin desplazamiento en 960×600 (A16/A17): el contenido se ajusta primero; el desplazamiento vertical es el último recurso (CF-01, parte 3).

**C-6 · Códigos de error (todos con base).**

| Falla | Código estable | Origen del código | Mensaje literal | Dónde |
|---|---|---|---|---|
| El sistema no cambia el inicio automático | `INICIO_AUTOMATICO_FALLIDO` (backend `autostart.failed`) | CONSISTENCIA G1l; `contratos.md` IPC-DESK-11 (línea 290); `messages.rs:399-401` | «No pudimos cambiar el inicio automático. Intenta de nuevo.» | píldora Error; el interruptor conserva su estado |
| El Núcleo no cierra la sesión | `CIERRE_SESION_FALLIDO` (backend `auth.sign_out_failed`) | G1m, G6; IPC-AUTH-14 (línea 160); `messages.rs:503-505` | «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.» | píldora Error (detalle en AC-09) |
| Falla `auth_get_sign_out_info` | `CIERRE_SESION_FALLIDO` (el front la mapea a G1m; IPC-AUTH-13 no declara errores y hoy llega `InternalUnexpected` con mensaje vacío, `puente_ipc.rs:2706-2717`) | G1m; `messages.es.json` (`NO_PUDIMOS_CERRAR_LA_SESION`) | mismo literal | píldora Error; no se abre M-11 |
| Sin conexión | `SIN_CONEXION` | G1g; MB-04 parte 8 | «Sin conexión · N pendientes» (indicador) | indicador |
| La sincronización falla | `SINCRONIZACION_FALLIDA` | G1f; MB-04 L216 | «Error de sincronización · 2 pendientes» (literal del Figma, manda) | **aviso Error con «Reintentar»**, no el indicador (CF-05) |
| No se guarda la densidad | `OPERACION_FALLIDA` | G1h (CONSISTENCIA L158), sin código nuevo | «No pudimos completar la operación. Intenta de nuevo más tarde.» | píldora Error con «Reintentar»; el selector vuelve a la opción anterior |

`autostart_get` no declara errores (IPC-DESK-10 «Errores: —»; `puente_ipc.rs:2782-2790` siempre devuelve correcto): no hay código de lectura. Los códigos del backend (`autostart.failed`, `auth.sign_out_failed`) ya existen; los de la columna «estable» son los que el front mapea (CONSISTENCIA 6.1). Hoy el front mapea por mensaje, no por código (partes 9 de CF-03 y CF-04).

**C-7 · Identificadores de prueba.** Prefijo `configuracion-`. Todos los `data-testid` de las piezas son NUEVOS (la pantalla no tiene ninguno: `Settings.tsx` completo, 88 líneas).

**C-8 · Hora y datos de la persona.** No hay fechas en esta pantalla. Los literales entre «» se copian tal cual; no se inventan textos.

---

## CF-01 · Pantalla Configuración (marco, tarjeta y filas)

Familia: 2 estados × 4 temas (Configuración y Configuración · Cómoda). Código: `screens/settings/Settings.tsx`, `configuracion.css`. Componentes: MB-01 (marco), MB-02 (barra lateral), MB-03/MB-20 (migas), MB-10, MB-13, MB-14.

### 1 · Nodos

| Estado | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Configuración (Compacta) | 204:3109 | 233:24723 | 204:23428 | 204:23478 |
| Configuración · Cómoda | 204:3159 | 233:24743 | 204:23528 | 204:23578 |

### 2 · Estructura

`[configuracion-pantalla]` (raíz), `[configuracion-migas]`, `[configuracion-titulo]`, `[configuracion-tarjeta]` («Preferencias de la cuenta»), `[configuracion-fila-densidad]`, `[configuracion-fila-inicio]`, `[configuracion-fila-sesion]`. La barra lateral, la miga (MB-03/MB-20) y el indicador pertenecen al marco (MB-01, MB-02, MB-04): no se duplican dentro de la pantalla.

Tabla «capa del Figma → `data-testid`» (coordenadas del marco 1093×560 de la huella; a 1200×800 y 960×600 se prueba con ±2 px; se estira lo que dice la columna «Comportamiento», MB-01 L47-51):

| Capa del Figma | `data-testid` | x, y, w, h (huella) | Comportamiento al cambiar el marco |
|---|---|---|---|
| Título | `configuracion-titulo` | 200, 49, 167, 35 | fijo (x, y) |
| Tarjeta «Preferencias de la cuenta» | `configuracion-tarjeta` | 200, 104, 842, 326 | se estira en ancho: `min(842, zona − 48)`; alto fijo 326 |
| Selector Densidad | `configuracion-densidad` | 838, 126, 184, 36 | anclado al borde derecho de la tarjeta (margen 20) |
| Interruptor | `configuracion-inicio-interruptor` | 978, 237, 44, 24 | anclado al borde derecho de la tarjeta (margen 20) |
| Botón «Cerrar sesión» | `configuracion-cerrar-sesion` | 903, 315, 119, 36 | anclado al borde derecho de la tarjeta (margen 20) |
| Botón flotante de Windi | `windi-boton-flotante` | 1029, 496, 48, 48 | anclado a 16 px abajo y 16 px a la derecha del marco (1093 − 1077 = 16; 560 − 544 = 16); no usa coordenadas absolutas |

Las posiciones relativas a la tarjeta (margen 20) son PROPUESTA derivada de las coordenadas (1042 − 1022 = 20 al borde de la tarjeta): se verifican con la prueba (d).

### 3 · Medidas

| Elemento | Valor | Token | Fuente |
|---|---|---|---|
| Barra lateral | 176×560 | MB-02 | MEDIDO F5 |
| Miga «Configuración» | (200,19), Regular 13 | `texto` | MEDIDO F5 |
| Título «Configuración» | (200,49), 167×35, Bold 26 | `tinta` | MEDIDO F5 |
| Tarjeta «Preferencias de la cuenta» | (200,104), 842×326, radio 8, borde 1 | `superficie`, `linea` | MEDIDO F5 |
| Fila Densidad: nombre / descripción | Medium 17 / Regular 14 | `tinta` / `texto` | MEDIDO F5 |
| Selector Densidad | 184×36 en (838,126), radio 9, borde 1,5 | `borde` | MEDIDO F5 |
| Fila Inicio automático: interruptor | 44×24 en (978,237) | `principal_legible` | MEDIDO F5 |
| Fila Sesión: botón «Cerrar sesión» | 119×36 en (903,315), Medium 14 | MB-10 Secundario | MEDIDO F5 |
| Altura de la tarjeta en Cómoda | 326, igual que en Compacta: la densidad no cambia la tarjeta de Configuración (nota del Figma: «el espaciado de filas no cambia respecto de Compacta») | — | MEDIDO (huella 204-3159) |
| Ancho de la tarjeta con ventana menor | `min(842, ancho de la zona de contenido − 24 − 24)`; la tarjeta se estira según MB-01 L47-51; a 960 de ancho la zona mide 960 − 176 = 784, la tarjeta 736 | — | PROPUESTA (D15; el Figma solo trae 1280×790) |
| Alto a 960×600 | tarjeta 104 → 430 (326 de alto en ambas densidades); el botón flotante queda anclado 16 px sobre el borde inferior | — | MEDIDO (326) + DECISIÓN de anclaje; se vigila con prueba numérica (parte 10) |

Origen de coordenadas: esquina superior izquierda del marco de la huella, con la barra lateral dentro (CONSISTENCIA D7: marco 1093×560, barra 176).

### 4 · Textos literales

«Configuración» (miga y título), «Preferencias de la cuenta», «Densidad», «Cambia el espacio entre filas, no el tamaño de letra.», «Compacta», «Cómoda», «Inicio automático», «Abrir Windgets al iniciar Windows», «Sesión», «Cerrar sesión». El título en el estado Cómoda de la huella dice «Configuración · Cómoda»: es residuo de capa, no texto visible (CONSISTENCIA N11, incoherencia 2).

### 5 · Estados

Cargando: esqueleto (barras `linea` r6, D9) solo si la carga pasa de 200 ms y, una vez visible, se queda al menos 300 ms (ANIMACIONES L92); si es una lectura local (`autostart_get`, preferencia en la base local) no hay esqueleto. Normal Compacta, normal Cómoda (la misma geometría de la pantalla: 326). El interruptor y los selectores no tienen reacción en el prototipo: se implementan con la acción de la HU (P3, DECISIÓN).

### 6 · Teclado y foco

Orden de Tab (MB-01 L62): barra lateral → encabezado (miga e indicador) → tarjeta (selector Densidad → interruptor → «Cerrar sesión») → botón de Windi. Foco 2 px `tinta` radio + 3 (D6). El selector segmentado y el interruptor son los de MB-14 y MB-13 (flechas, Espacio). Foco inicial de la pantalla: el de MB-01 (no se inventa uno propio).

### 7 · Animaciones

El Figma no anima la pantalla. Entrada de la pantalla A-08 y del contenido A-09 (ANIMACIONES). Cambiar de Compacta a Cómoda: sin transición en el Figma; el cambio no mueve nada en esta pantalla (326 en ambas).

### 8 · Errores

Ver C-6 (todos los de la pantalla). Ninguno cae al genérico.

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| La pantalla es el diseño anterior (RD-41, Figma 81:180): `<main className="wg-configuracion">` sin tarjeta «Preferencias de la cuenta», con solo «Inicio automático» y «Sesión» | `Settings.tsx:55-87` | M |
| Medidas de RD-41 distintas de las nuevas (fila 69, nombre 23 px, interruptor 58×30 radio 15) | `configuracion.css` completo (63 líneas) | M |
| Sin descripciones bajo cada nombre | `Settings.tsx` | S |
| Fila «Densidad» y estado Cómoda: NUEVA, ni en código ni migración | grep `app_density` sin resultados en `apps/` ni `supabase/` | L |
| Sin `data-testid` | `Settings.tsx` | S |
| Aviso de error propio (`Aviso`) dentro de la pantalla en lugar de la píldora global | `Settings.tsx` | S |

### 10 · Pruebas

Una por requisito: (a) la pantalla muestra tarjeta y las tres filas con sus textos de la parte 4; (b) a 960×600, tamaño de letra Grande, en claro, oscuro, Rosa y Enfoque: `scrollHeight === clientHeight` y la tarjeta mide 326 ± 2 en Compacta y en Cómoda (Playwright); (c) a 960 de ancho la tarjeta mide 736 ± 2; (d) la tabla «capa → `data-testid`» a 1200×800 y a 960×600, ±2 px, y el botón de Windi a 16 px del borde inferior y derecho; (e) en Rosa y Enfoque el título cambia de fuente y no se corta; (f) el orden de Tab de la parte 6 (barra, encabezado, tarjeta, botón de Windi); (g) no hay esqueleto en lectura local y sí lo hay, 300 ms mínimo, si la carga pasa de 200 ms.

---

## CF-02 · Densidad (NUEVA)

Familia: dentro de CF-01 (selector 184×36). No existe en el código, en contratos ni en una HU (el backend la prevé: `docs/rediseno_final_backend.md` A-08, P3 «🆕 HU»).

### 1 · Nodos

Los de CF-01; el selector es el componente MB-14 (Segmentado) con `Elegida=Primera` (Compacta) o `Elegida=Segunda` (Cómoda).

### 2 · Estructura

`[configuracion-densidad]` (selector), `[configuracion-densidad-compacta]`, `[configuracion-densidad-comoda]`.

### 3 · Medidas

Selector 184×36, radio 9, borde `borde` 1,5; opción elegida con relleno `seleccion` y texto `sobre_seleccion`; no elegida, texto `tinta` (MB-14 L514, F0 2005:397, huellas). Fuente: MEDIDO F5. Efecto: la tarjeta de Configuración no cambia (326 en las dos densidades, MEDIDO huella 204-3159). El efecto se mide y se prueba en el Planificador y el Kanban (CONSISTENCIA A19/E11; `SPEC_Planificador.md` L82 y L119): este documento lo cita y no lo recalcula. El tamaño de letra no cambia. Fuentes de la función: D-29 y `docs/rediseno_final_prototipos.md` L130, L247, L324 y L782 (literal «Cambia el espacio entre filas, no el tamaño de letra.»); `docs/rediseno_final_backend.md` L101, L123, L158 y L625-628 (§5.15); `docs/rediseno_flujos_prototipos.md` L229-232.

### 4 · Textos literales

«Densidad», «Cambia el espacio entre filas, no el tamaño de letra.», «Compacta», «Cómoda».

### 5 · Estados

Compacta (por defecto, `app_density = compact`), Cómoda (`comfortable`), guardando (control deshabilitado un instante, E3), error al guardar (vuelve a la opción anterior).

### 6 · Teclado y foco

Los de MB-14: flechas izquierda/derecha cambian la opción y la eligen; foco 2 px `tinta`.

### 7 · Animaciones

Ninguna en Configuración (ver CF-01 parte 7); la tarjeta no cambia con la densidad.

### 8 · Errores

`OPERACION_FALLIDA` (G1h, CONSISTENCIA L158), «No pudimos completar la operación. Intenta de nuevo más tarde.», píldora Error con «Reintentar». No hay código nuevo.

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Migración nueva `0013` (0009-0012 ya existen en `supabase/migrations/`) que agregue `app_density` (`compact` por defecto, `comfortable`) a `user_preference` y su equivalente en `docs/local/`; es la misma 0013 que amplía el tema por S13 (SPEC_Personalizacion_y_widgets, PW-12/PW-13): una sola migración con las dos cosas | sin hallazgos de `app_density` en `apps/` ni `supabase/` | L |
| Redefinir `_sync_fields('user_preference')` para incluir `app_density` | `supabase/migrations/0003_funciones.sql:266` | M |
| Esquema SQLite local | `docs/local/sqlite_esquema.sql` (~L111) y `apps/desktop/src-tauri/sqlite_esquema.sql` | S |
| Extender IPC-DESK-12/13 (`preference_get` / `preference_set`) con `app_density`; no es una orden nueva | `docs/contratos.md:291-292` | M |
| `preferencias.rs` no debe pisar `board_card_view` al guardar solo la densidad (y a la inversa) | `servicio_del_planificador/preferencias.rs:42-65` | M |
| Que Tablero, Agenda, Calendario, Reportes y Tareas lean la densidad | SPEC_Planificador (la consume; no se repite) | L, fuera de esta pieza |

### 10 · Pruebas

La función se implementa porque está en el Figma; no es pendiente de Paula. Criterios derivados (PROPUESTA, HU nueva con destino HE-16, redactados desde las fuentes de la parte 3):

- CA-D1 · La densidad por defecto es «Compacta» (`app_density = compact`) y el selector la muestra elegida.
- CA-D2 · Elegir «Cómoda» guarda `comfortable`, la conserva al reabrir y no cambia la tarjeta de Configuración (326) ni el tamaño de letra.
- CA-D3 · La densidad es de la cuenta: se sincroniza entre computadores (A-08).
- CA-D4 · Guardar la densidad no cambia `board_card_view` y a la inversa.
- CA-D5 · Si el guardado falla, el selector vuelve a la opción anterior y sale la píldora Error con el literal de G1h y «Reintentar».
- CA-D6 · «Cómoda» aplica filas más altas en el Planificador y el Kanban (A19, `SPEC_Planificador.md` L82 y L119; se prueba allí).

Una prueba por criterio; CA-D2 y CA-D5 con petición real.

---

## CF-03 · Inicio automático (HE-16-HU02) y sus avisos

Familia: fila dentro de CF-01 + 2 avisos × 4 temas. Código: `Settings.tsx`, `ui/Interruptor`, `src-tauri/.../inicio_automatico.rs`.

### 1 · Nodos

| Elemento | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Fila e interruptor Encendido (comp. `Interruptor:Estado=Encendido, Interacción=Normal`) | en 204:3109 | en 233:24723 | en 204:23428 | en 204:23478 |
| Aviso «Inicio automático desactivado» | 2251:4979 | 2251:6827 | 2251:5595 | 2251:6211 |
| Aviso «Error inicio automático» | 2251:5080 | 2251:6928 | 2251:5696 | 2251:6312 |

### 2 · Estructura

`[configuracion-inicio]` (fila), `[configuracion-inicio-interruptor]`; los avisos son de MB-06 (`role="status"` el de éxito, `role="alert"` el de error).

### 3 · Medidas

Interruptor 44×24 en (978,237), radio 8, relleno y trazo `principal_legible` 1,5 encendido (MEDIDO F5; MB-13 manda la geometría, R1). Aviso de Éxito 247×42, ícono `estado_completada` (D1), texto `texto`, píldora radio 21 con paddings 5/3/5/12 y separación 6 (MEDIDO F5, MB-06). Aviso de Error 430×42; todos los avisos de F5 miden 42 de alto con radio 21 (MEDIDO, huellas 2251-*; anchos 247, 430, 488, 560, 245 y 561 en el orden de la lista de F5). Los anchos de más de 480 son referencia: el tope es 480 con salto de línea (MB-06 L318, D7).

### 4 · Textos literales

Fila: «Inicio automático» / «Abrir Windgets al iniciar Windows». Avisos: «Inicio automático desactivado.» (CA01, `INICIO_AUTOMATICO_DESACTIVADO`, `messages.es.json:76-77`), «Inicio automático activado.» (CA02; el Figma no dibuja este aviso: se implementa con el mismo componente de Éxito, decisión «todas las funciones nuevas se implementan»), «No pudimos cambiar el inicio automático. Intenta de nuevo.» (CA05, `NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO`, `messages.es.json:95`).

### 5 · Estados

Encendido, apagado, enviando (`useEnvioUnico`: segundo clic ignorado), deshabilitado mientras se lee o se escribe (E3), error (conserva el estado real de Windows, CA05). El estado es el de Windows y es propio de cada computador: no se sincroniza (CA04; IPC-DESK-11, `contratos.md:290`). Al volver a la ventana (`focus`) se vuelve a leer (CA03; `Settings.tsx:31-36`).

### 6 · Teclado y foco

Interruptor de MB-13: Espacio alterna; foco 2 px `tinta`. Etiqueta asociada al control y descripción por `aria-describedby` (PROPUESTA: accesibilidad sin base en el Figma).

### 7 · Animaciones

Perilla del interruptor: las de MB-13 (no se repiten). Avisos: A-05, A-06, A-07 (MB-06).

### 8 · Errores

| Causa | Código | Mensaje | Dónde |
|---|---|---|---|
| `autostart_set` falla (`autostart.failed`) | `INICIO_AUTOMATICO_FALLIDO` | «No pudimos cambiar el inicio automático. Intenta de nuevo.» | píldora Error; sin cierre automático (G5) |
| `autostart_get` | no declara errores (IPC-DESK-10 «Errores: —»; `puente_ipc.rs:2782-2790` siempre devuelve correcto) | no hay mensaje: no se muestra un estado inventado. Si el transporte IPC falla, texto propio PROPUESTA (destino `docs/DUDAS.md`) | — |

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| `leerInicio` ignora `!r.ok` (`Settings.tsx:26-29`): como `autostart_get` no falla en el Núcleo, solo ocurre por fallo de transporte; hoy el interruptor queda oculto con `aria-busy`. Se muestra un fallo de transporte con su propio texto (PROPUESTA, `docs/DUDAS.md`), sin inventar estado | `Settings.tsx:26-29` | S |
| El error de `autostart_set` cae a `r.error.message \|\| NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO`: no se mapea por código | `Settings.tsx:49` | S |
| El error sale en `Aviso` dentro de la página y no en la píldora global de MB-06 | `Settings.tsx` (`setAviso`) | S |
| Falta la descripción «Abrir Windgets al iniciar Windows» | `Settings.tsx` | S |
| Interruptor 58×30 de RD-41, no 44×24 | `configuracion.css:40-50` | S |
| El aviso de éxito de CA01/CA02 ya se pide (`mostrar`) | `Settings.tsx:40-53` | cumple |
| Backend: `autostart_set` escribe `Run` y relee; responde `autostart.failed` si no queda igual | `inicio_automatico.rs:52-53` | cumple |

### 10 · Pruebas

HU02-CA01 y CA02 (desactivar y activar con aviso), CA03 (cambio hecho desde Windows se ve al enfocar), CA04 (sin llamadas de sincronización), CA05 (aviso Error con el literal; el interruptor conserva su estado). Nuevas: falla de transporte de `autostart_get` → texto propio visible y el interruptor no queda oculto; descripción visible; interruptor 44×24 radio 8, apagado con `superficie` y trazo `borde_campo`; el aviso de Error no se cierra solo (G5); el de Éxito se cierra a los 4 s. Ya existen `Settings.test.tsx:141-190` para CA01-CA05; se ajustan a la píldora.

---

## CF-04 · Sesión: botón «Cerrar sesión» (HE-16-HU03) y su aviso

Familia: fila «Sesión» + aviso Error × 4 temas. M-11 y M-12 son de AC-09. Código: `Settings.tsx`, `CerrarSesion.tsx`.

### 1 · Nodos

| Elemento | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Botón «Cerrar sesión» (→ M-11) | en 204:3109 | en 233:24723 | en 204:23428 | en 204:23478 |
| M-11 (F5) | 204:25989 | 233:24763 | 204:26089 | 204:26189 |
| M-12 (F5) | 204:26002 | 233:24776 | 204:26102 | 204:26202 |
| Aviso «Error al cerrar sesión» | 2251:5185 | 2251:7033 | 2251:5801 | 2251:6417 |

Erratum de AC-09 (M-11 y M-12 intercambiados respecto de F5; F5 L15-16 y MB-23 L635 mandan): corregido en `SPEC_Cuenta_y_Acceso.md` L791-793. La aclaración de CONSISTENCIA G17 L190 (que nombra 204:26002 como M-11) queda como pendiente con destino CONSISTENCIA.

### 2 · Estructura

`[configuracion-sesion]`, `[configuracion-cerrar-sesion]` (botón). Los del diálogo, en AC-09.

### 3 · Medidas

Botón Secundario (MB-10) 119×36 en (903,315), Medium 14, radio 9. M-11: marco 600×256, nota 424×160 en (88,48); título Bold 20 en (108,66); cuerpo Regular 14 en (108,100); cerrar 32×32 en (460,58); Cancelar 91×36 en (274,158); confirmar 119×36 en (373,158) (MEDIDO F5; los contiene MB-22/MB-23). M-12 cuerpo 382×38. Aviso de Error 488×42 (MEDIDO huella 2251-5185; tope 480 con salto de línea, MB-06 L318).

Partes 4 a 8: no se repiten. Textos, estados, errores, animaciones y el diálogo: AC-09 y MB-22/MB-23 (M-11/M-12 Destructivos en los 4 temas, G17). Códigos: C-6 (`CIERRE_SESION_FALLIDO`). Propio de esta pieza: el botón de la fila (foco 2 px `tinta`; al cerrar el diálogo el foco vuelve a este botón, MB-22) y el aviso de Error (literal «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.», CA07).

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| `pedirCierre` abre M-11 también si `auth_get_sign_out_info` falla: riesgo de pérdida de datos, porque `auth_sign_out` (IPC-AUTH-14) borra la base local y puede haber cambios sin sincronizar que M-12 debía advertir. No se abre M-11 sin datos | `CerrarSesion.tsx:29-32` | M |
| IPC-AUTH-13 no declara errores y hoy un fallo llega como `InternalUnexpected` con mensaje vacío (`de_sqlx`): el contrato necesita un código, o el front lo mapea a `CIERRE_SESION_FALLIDO` (G1m) | `puente_ipc.rs:2706-2717`, `contratos.md:159` | S |
| El error de `auth_sign_out` usa `r.error.message \|\| textos.NO_PUDIMOS_CERRAR_LA_SESION`: sin mapa por código | `CerrarSesion.tsx:41` | S |
| Sin `data-testid` | `Settings.tsx` | S |

### 10 · Pruebas

HU03-CA01 a CA07 (ya en `Settings.test.tsx:58-209`); nuevas: falla de `auth_get_sign_out_info` con petición real (y con `pending_count > 0` en la base) → píldora Error con el literal de G1m, M-11 no abre y la base local queda intacta; el botón de la fila mide 119×36; al cerrar el diálogo el foco vuelve al botón.

---

## CF-05 · Indicador de sincronización y avisos de red (HE-16-HU01)

Familia: 3 estados × 4 temas (Sincronizando, Sin conexión, Error de sincronización) + 3 avisos × 4 temas. Dueña funcional de los avisos: HE-15. El componente es MB-04 (medidas, textos, A-36); los avisos son de MB-06. En Configuración el indicador vive en el marco (D-203), no dentro de la pantalla.

### 1 · Nodos

| Elemento | Claro | Oscuro | Rosa | Enfoque |
|---|---|---|---|---|
| Sincronizando | 217:20340 | 233:24863 | 217:20380 | 217:20360 |
| Sin conexión | 217:20400 | 233:24883 | 217:20440 | 217:20420 |
| Error de sincronización | 217:20460 | 233:24903 | 217:20500 | 217:20480 |
| Aviso «Sin conexión» | 2251:5290 | 2251:7138 | 2251:5906 | 2251:6522 |
| Aviso «Cambios sincronizados» | 2251:5396 | 2251:7244 | 2251:6012 | 2251:6628 |
| Aviso «Cambios de otro computador» | 2251:5490 | 2251:7338 | 2251:6106 | 2251:6722 |

### 2 · Estructura

`[indicador-sincronizacion]` (MB-04). Avisos: `role="status"` (MB-06).

### 3 · Medidas

Indicador (MEDIDO, huellas 217-20340/20400/20460; coincide con MB-04 L190-195): Sincronizando, texto en x=906, 163×16, sin ícono en la huella (MB-04 propone ícono 16 con giro de 1 s, E8); Sin conexión, ícono 16×16 en (900,20) y texto en x=922 (el ícono mide 16, no 20); Error, ícono en (847,20) y texto en x=869. Avisos: todos 42 de alto, radio 21; Información 560×42 «Sin conexión», Éxito 245×42 «Cambios sincronizados», Información 561×42 «Cambios de otro computador» (anchos de más de 480 son referencia; tope 480 con salto de línea, MB-06 L318, D7). Solo el aviso 2251:4979 trae posición, (822,4) con borde derecho en 1069, y declara «Sincronizado» e ícono ocultos: el Figma oculta el indicador mientras se ve el aviso. Para los otros cinco la posición es la de D7 (PROPUESTA). Colores: Éxito `estado_completada`; Información borde e ícono `informacion`, texto `texto` (D1, P2).

### 4 · Textos literales

Indicador (HU01 y MB-04): «Sincronizado», «Sincronizando… · N pendientes», «Sin conexión · N pendientes» (con «1 cambio pendiente de sincronizar» o «<cantidad> cambios pendientes de sincronizar»), «Error de sincronización · N pendientes» (el literal del Figma gana sobre el de HU01-CA05, ver parte 8). Avisos: la dueña es HE-15 (L151, L198, L242, L281-284; EV-03, EV-05, EV-06); los literales están en MB-06 L324 («Estás sin conexión…», «Tus cambios se sincronizaron.», «Algunas tarjetas se actualizaron con cambios más recientes de otro computador.») y ya existen en `IndicadorSincronizacion.tsx:20-24`.

### 5 · Estados

Los de MB-04. Quién abre cada aviso (HE-15, sin entrada en el prototipo, E16): «Sin conexión» con `connectivity_changed` `online=false` (EV-03; `IndicadorSincronizacion.tsx:50-58`); «Tus cambios se sincronizaron.» con `sync_completed` y `after_reconnect` verdadero (EV-05; no basta «pasar de pendientes a sincronizado»); «Algunas tarjetas…» con EV-06 (conflictos). Mientras se ve un aviso el indicador se oculta (huella 2251-4979).

### 6 · Teclado y foco

Los avisos no roban el foco (MB-06); el indicador no es interactivo.

### 7 · Animaciones

A-36 (indicador), A-05/A-06/A-07 (avisos).

### 8 · Errores

`SIN_CONEXION` (G1g) en el indicador; `SINCRONIZACION_FALLIDA` (G1f) es un **aviso Error con «Reintentar»**, no va en el indicador, y gana el literal del Figma «Error de sincronización · 2 pendientes» (MB-04 L216). Cambia el literal de HU01-CA05 («Error de sincronización. Reintentaremos automáticamente.», HE-16 L45 y L101; pendiente con destino HE-16) y cambia `IndicadorSincronizacion.test.tsx:185`. El aviso «Cambios de otro computador» no es un error: no tiene código.

### 9 · Diferencia con el código

| Qué | Código | Tamaño |
|---|---|---|
| Indicador con textos y estados | `ventana_principal/IndicadorSincronizacion.tsx` y su prueba (EV-04) | cumple en lo básico; medidas en MB-04 parte 9 |
| Los tres avisos de red ya existen y se disparan (EV-03, EV-05 con `after_reconnect`, EV-06) | `IndicadorSincronizacion.tsx:20-24` y `:50-66` | cumple |
| El indicador no se oculta mientras se ve un aviso (huella 2251-4979) | `IndicadorSincronizacion.tsx` | S |
| «Error de sincronización» como texto del indicador con el literal de HE-16-HU01-CA05, no como aviso Error con «Reintentar» (G1f) | `IndicadorSincronizacion.tsx:10-15`, `IndicadorSincronizacion.test.tsx:185` | S |

### 10 · Pruebas

Ya existen: HE-15-HU02-CA01 (`IndicadorSincronizacion.test.tsx:62`), HE-15-HU03-CA01 (`:98`) y el caso sin cambios offline (`:110`); HE-16-HU01-CA01 a CA05 (`:162-185`). Nuevas: el indicador se oculta mientras hay aviso; el aviso Error de sincronización muestra «Reintentar» y no se cierra solo (G5); el aviso Información de «Sin conexión» se cierra a los 4 s.

---

## CF-06 · Windi superpuesto en Configuración

Familia: 6 estados × 4 temas (Windi overlay, Propuesta, Escribiendo, Sin conexión, Error, Propuesta descartada). Los define MB-05, SPEC_Windi y PW-15; esta pieza fija solo lo propio de Configuración.

### 1 · Nodos

(claro · oscuro · Rosa · Enfoque, F5 L17-22) Windi overlay 204:26015 · 233:24789 · 204:26115 · 204:26215; Propuesta 204:26026 · 233:24800 · 204:26126 · 204:26226; Escribiendo 204:26041 · 233:24815 · 204:26141 · 204:26241; Sin conexión 204:26052 · 233:24826 · 204:26152 · 204:26252; Error 204:26063 · 233:24837 · 204:26163 · 204:26263; Propuesta descartada 204:26074 · 233:24848 · 204:26174 · 204:26274.

### 2 · Estructura

`[windi-boton-flotante]` y el panel: MB-05.

### 3 · Medidas

Botón flotante 48×48 en (1029,496), radio 14 (MEDIDO F5; MB-05), anclado a 16 px abajo y a la derecha del marco (MB-01). «Error» 204:26063 = `WINDI_ERROR_INTERNO` (G1a; SPEC_Windi). «Sin conexión» = G1c/G3. El botón (y hasta 544) cabe en el marco de 560 y no tapa la tarjeta (y hasta 430; Cómoda, más).

### 4 a 8

Textos, estados, teclado, animaciones (A-10, A-11) y errores: SPEC_Windi y MB-05; no se repiten.

### 9 · Diferencia con el código

`ventana_principal/PanelDeWindi.tsx` existe; sus diferencias son de SPEC_Windi. Sin diferencia propia en Configuración.

### 10 · Pruebas

Las de SPEC_Windi; propia: el botón flotante no solapa la tarjeta a 960×600.

---

## Tabla de geometría

Origen: esquina superior izquierda del marco de la huella (1093×560, barra lateral de 176 dentro); coordenadas MEDIDO de F5.

| Elemento | x | y | ancho × alto | Estado | Fuente |
|---|---|---|---|---|---|
| Miga | 200 | 19 | — × 18 | todos | MEDIDO |
| Título | 200 | 49 | 167 × 35 (claro) | ambos | MEDIDO |
| «Sincronizado» (texto) | 1000 | 20 | 69 × 16 | Sincronizado | MEDIDO |
| Ícono del indicador | 978 | 20 | 16 × 16 | Sincronizado | MEDIDO |
| «Sincronizando… · 2 pendientes» | 906 | 20 | 163 × 16 | Sincronizando | MEDIDO |
| Tarjeta | 200 | 104 | 842 × 326 | Compacta | MEDIDO |
| Tarjeta | 200 | 104 | 842 × 326 | Cómoda (igual que Compacta) | MEDIDO (204-3159) |
| Ícono Sin conexión | 900 | 20 | 16 × 16 | Sin conexión (texto en x=922) | MEDIDO (217-20400) |
| Ícono Error de sincronización | 847 | 20 | 16 × 16 | Error (texto en x=869) | MEDIDO (217-20460) |
| Selector Densidad | 838 | 126 | 184 × 36 | ambos | MEDIDO |
| Interruptor | 978 | 237 | 44 × 24 | Encendido | MEDIDO |
| Botón «Cerrar sesión» | 903 | 315 | 119 × 36 | ambos | MEDIDO |
| Botón flotante Windi | 1029 | 496 | 48 × 48 | ambos | MEDIDO |
| Aviso «Inicio automático desactivado» | 822 | 4 | 247 × 42, borde derecho en 1069 | indicador oculto mientras se ve | MEDIDO (2251-4979) |
| Otros cinco avisos | D7 (PROPUESTA) | 4 | 430 / 488 / 560 / 245 / 561 × 42, radio 21; tope 480 con salto de línea | uno por aviso | MEDIDO el ancho (2251-*), posición no declarada |

Altura a 960×600: CF-01 parte 3; prueba en CF-01 parte 10.

## Incoherencias resueltas

| # | Qué trae la huella | Qué se hace | Motivo |
|---|---|---|---|
| 1 | Texto de la opción elegida del selector `#ffffff` fijo en claro | `sobre_seleccion` | C1/C17, P3 |
| 2 | Capa y título «Configuración · Cómoda» | Se ignora el sufijo; el título visible es «Configuración» | N11 (residuo de capa) |
| 3 | «Cómoda» no cambia el espaciado de filas en el prototipo | La tarjeta de Configuración no cambia (326); el efecto se implementa en el Planificador y el Kanban (D-29, E11, A19) | Funciones nuevas se implementan |
| 4 | Interruptor y «Compacta» sin reacción | Acción de la HU / preferencia | P3 |
| 5 | M-12 en Principal fuera del claro (79:6) | Destructivo en 4 temas | G17 |
| 6 | Reacción URL externa del botón «Cerrar sesión» y de Windi | No se copia; la navegación sigue la HU | P1 |
| 7 | Borde de la píldora fijo | Por variable | C1, D1 |
| 8 | Fondo raíz en Rosa y Enfoque enlazado a `superficie` | `fondo` del tema | C1 |
| 9 | Fuente y anchos distintos en Rosa y Enfoque | Fuente del tema; el contenedor crece | decisión de tipografía |
| 10 | Sincronizando sin ícono de carga | Ícono 16 con giro 1 s | E8, MB-04 |
| 11 | AC-09 con M-11 y M-12 intercambiados | Manda F5 (CF-04 parte 1) | erratum |

## No se construye

- Reacciones URL a «Windgets--Copy-» (P1).
- «Descartado» 2075:3647 y los residuos `Nuevo · …`, `Descartado · panel anterior` (N11).
- Casilla «Abrir la aplicación al iniciar Windows»: es del instalador (D-081), no de Configuración.
- Selector de apariencia, formatos y widgets: son de Personalización.

## Decisiones ya tomadas que se citan

D1, D6, D7, D15; P1, P2, P3; G4, G5, G6, G17; R1, R5, R7, R8; E3, E8, E11, E16; A1, A16/A17, A19; D-29 y A-08; decisiones de Paula del 26-nov: funciones nuevas se implementan, menos scroll, tipografía por tema, Destructivo en M-11/M-12.

## CA → prueba

| CA | Prueba | Dónde |
|---|---|---|
| HE-16-HU01-CA01 a CA05 | Indicador en los cuatro estados con sus literales | `IndicadorSincronizacion.test.tsx` |
| HE-16-HU02-CA01 | Desactivar con aviso «Inicio automático desactivado.» | `Settings.test.tsx:142` |
| HE-16-HU02-CA02 | Activar con aviso | `Settings.test.tsx:153` |
| HE-16-HU02-CA03 | Cambio desde Windows al enfocar | `Settings.test.tsx:161` |
| HE-16-HU02-CA04 | No se sincroniza | `Settings.test.tsx:172` |
| HE-16-HU02-CA05 | Aviso Error con `INICIO_AUTOMATICO_FALLIDO` | `Settings.test.tsx:182` |
| HE-16-HU03-CA01 a CA05 | M-11 / M-12, cancelar, confirmar | `Settings.test.tsx:59-95` |
| HE-16-HU03-CA06 | Cerrar mientras se sincroniza (máx. 5 s) | `motor_de_sincronizacion/cancelacion.rs:106` |
| CA-D1 a CA-D6 (densidad, CF-02) | Por defecto Compacta; Cómoda se guarda y no cambia la tarjeta (326); sincronizada; no pisa `board_card_view`; falla → G1h y vuelve a la opción anterior; efecto en el Planificador | pruebas nuevas (CF-02) |
| G5 | El aviso de Error no se cierra solo | `MensajeResultado.test.tsx` y prueba de pantalla |
| G5 | El aviso de Éxito se cierra a los 4 s | ídem |
| MB-22 | El foco vuelve al botón «Cerrar sesión» al cerrar el diálogo | prueba nueva (CF-04) |

Errores de forma de formulario: no aplican, la pantalla no tiene formulario (solo un selector, un interruptor y un botón).
| HE-16-HU03-CA07 | Aviso Error con `CIERRE_SESION_FALLIDO` | `Settings.test.tsx:192` |

## Pendiente de Paula

| # | Qué | Por qué sigue abierto |
|---|---|---|
Ninguno. La densidad se implementa porque está en el Figma (sus criterios derivados están en CF-02 como PROPUESTA con destino HE-16); no queda nada que solo Paula pueda decidir.

## Pendientes con destino

| # | Qué | Destino |
|---|---|---|
| 1 | M-11/M-12 intercambiados en AC-09 | Hecho: corregido en `SPEC_Cuenta_y_Acceso.md` L791-793 |
| 2 | Aclaración de G17 (nombra 204:26002 como M-11; F5 dice M-12) | `CONSISTENCIA.md` L190 |
| 3 | Literal de HE-16-HU01-CA05 por el del Figma «Error de sincronización · 2 pendientes» como aviso Error con «Reintentar» (G1f); cambia `IndicadorSincronizacion.test.tsx:185` | `docs/HE-16.md` L45 y L101 |
| 4 | Ampliar IPC-DESK-12/13 con `app_density`; migración 0013, `_sync_fields` y esquemas SQLite | `docs/contratos.md` L291-292; HU nueva de densidad en HE-16 |
| 5 | Código de error o mapeo a G1m para IPC-AUTH-13 | `docs/contratos.md` L159 |
| 6 | Texto propio del fallo de transporte de `autostart_get` | `docs/DUDAS.md` |
| 7 | Conflicto D7 / RD-63 sobre la posición de los avisos | ya en MB-06 (pendiente 1); no se repite |

## Lecturas de Figma pendientes

Ninguna: las huellas 204-3159, 2251-* y 217-20340/20400/20460 las leyó el revisor y están incorporadas. Sigue NO MEDIDA la posición de cinco de los seis avisos (solo 2251-4979 la declara).

