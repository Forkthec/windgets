# SPEC · Windi (Agente de IA): panel, mensajes, propuestas y respuestas

Fecha: 26-nov-2026 · Estado: **Pendiente de la aprobación de Paula** (generado con IA; solo local, no se sube a ningún sitio compartido).

Revisado 26-nov: hallazgos del revisor aplicados.

**Llegó hasta:** las 21 familias de `79:4` y su flujo §7 tienen sección (WI-01 a WI-11). Las lecturas de Figma que faltan están al final.

**Alcance.** Las 21 familias de `79:4` (Agente/Windi) con sus 4 temas (claro, oscuro, Rosa, Enfoque) y el flujo §7 de `rediseno_flujos_prototipos.md`. Se **citan sin repetir**: MB-05 (panel lateral, velo, foco atrapado, foco inicial, tabla de errores G1a-G1e), MB-10 (Botón), MB-11 (Campo), MB-21 (NombreEmergente) y MB-27 (OjosDeWindi) en `SPEC_Marco_y_componentes_base.md`; PL-15 y PW-15 (Windi superpuesto).

**Fuentes.** `.trabajo/figma/F3.md`, `.trabajo/figma/huellas/` (204-2427 … 2172-2223 y muestras de tema), `docs/implementacion/CONSISTENCIA.md` (R/E/A/G/D/T/C/N/P), `docs/implementacion/TEMAS_Y_TOKENS.md`, `docs/HE-14.md`, `docs/contratos.md` (IPC-WIN-02/03/04), `apps/desktop/src/types/messages.es.json`, `docs/rediseno.md` (RD-36, 57, 70, 83, 96, 100), `docs/implementacion/ANIMACIONES.md`.

**Etiquetas.** MEDIDO (de la huella o de F3) · DECISIÓN (id) · PROPUESTA (sin CA/ET/RD/Figma; hay que aprobarla) · NO MEDIDO (motivo). Tamaños de diferencia con el código: S (una línea o token), M (un componente o una regla CSS con varios cambios), L (rehacer estructura).

**Convenciones comunes.**
- Marco de 360×560. Panel «Panel lateral de Windi» en (4,4), 351×551, radio 12, borde `borde` 1,5, relleno `superficie_alta`, sombra `0,1,3,0` (MEDIDO). Todos los valores salen de tokens; los hex solo se citan como muestra por tema.
- Nodos por tema en orden claro | oscuro | Rosa | Enfoque. La geometría se mide en claro; en Rosa y Enfoque la fuente cambia la caja (T3-T6): F3 L100-102 y las huellas 2173-* muestran la misma geometría (salvo los desvíos de WI-03/WI-05); se reserva 6 px de holgura y manda la fuente elegida por la persona.
- El prototipo solo trae reacciones ON_CLICK con SWAP o CLOSE, sin transición ni duración (F-8, F-10). No hay hover, foco ni deshabilitado dibujados: salen de los componentes (E3, D-componentes) y se marcan DECISIÓN o PROPUESTA.
- Colores fijos de Windi (D2/C7): #00d9e2, #6604e6, #dc026c, #806dac, #ffca22, #27152b, #ffffff (ojos e ilustración; se citan en MB-27).
- Catálogo de 9 colores de etiqueta (D3/C10): #8a8d98, #e5484d, #f76b15, #dcba04, #30a46c, #00d9e2, #3e63dd, #6604e6, #dc026c (Gris, Rojo, Naranja, Amarillo, Verde, Cian, Azul, Morado, Rosa; nombres de `TEMAS_Y_TOKENS.md` L192 y `supabase/seed.sql:53-63`, que la app lee con IPC-CAT-01 `catalog_list`). Windi nombra los colores con ese catálogo, no con la lista de 4 de F3.
- Comillas « » para nombres de tarjeta, columna y etiqueta en los mensajes (G8). El saludo lleva alias y no lleva emoji (G9/D11).
- Tipografía: la fuente elegida por la persona manda (T3-T6) y los tamaños de texto escalan con P4 (preferencia de tamaño); las cajas medidas en Nunito son la base, no un valor fijo.
- Códigos: se usan los G1* de CONSISTENCIA y los códigos de `contratos.md`. En esta spec **no se crea ningún código nuevo**; la tabla única de códigos por causa está en WI-04.

**Ids por familia (claro / oscuro / Rosa / Enfoque).**

| Id | Familia | Ids de nodo |
|---|---|---|
| WI-01 | Windi (vacío) | 204:2427 / 233:16835 / 204:22790 / 204:22801 |
| WI-02 | Mensaje muy largo | 2172:2075 / 2173:3058 / 2173:3016 / 2173:3037 |
| WI-03 | Escribiendo | 204:2609 / 233:16861 / 204:22842 / 204:22853 |
| WI-04 | Sin conexión | 204:2698 / 233:16872 / 204:22864 / 204:22875 |
| WI-04 | No respondió | 204:2787 / 233:16883 / 204:22886 / 204:22897 |
| WI-05 | Propuesta | 204:2516 / 233:16846 / 204:22812 / 204:22827 |
| WI-06 | Propuesta · Crear | 2170:1994 / 2173:2195 / 2173:2125 / 2173:2160 |
| WI-06 | Propuesta · Cambiar | 2171:2002 / 2173:2296 / 2173:2230 / 2173:2263 |
| WI-06 | Propuesta · Mover | 2171:2082 / 2173:2490 / 2173:2428 / 2173:2459 |
| WI-07 | Cambiar · Tarjeta completada | 2171:2042 / 2173:2395 / 2173:2329 / 2173:2362 |
| WI-07 | Mover · Tarjeta completada | 2171:2120 / 2173:2585 / 2173:2521 / 2173:2553 |
| WI-07 | Eliminar varias | 2171:2159 / 2173:2685 / 2173:2617 / 2173:2651 |
| WI-08 | Crear etiqueta | 2171:2200 / 2173:2785 / 2173:2719 / 2173:2752 |
| WI-09 | Propuesta descartada | 204:2876 / 233:16894 / 204:22908 / 204:22923 |
| WI-09 | Propuesta · Descartada | 2171:2240 / 2173:2886 / 2173:2818 / 2173:2852 |
| WI-09 | Propuesta · Sin conexión | 2171:2281 / 2173:2984 / 2173:2920 / 2173:2952 |
| WI-10 | Respuestas · Propuesta | 2172:2106 / 2173:3131 / 2173:3079 / 2173:3105 |
| WI-10 | Respuestas · Saludo y datos que faltan | 2172:2145 / 2173:3209 / 2173:3157 / 2173:3183 |
| WI-10 | Respuestas · No encuentra y sin cambio | 2172:2184 / 2173:3285 / 2173:3235 / 2173:3260 |
| WI-10 | Respuestas · Hecho y fuera de alcance | 2172:2223 / 2173:3362 / 2173:3310 / 2173:3336 |
| WI-11 | Nombre emergente | 2048:669 / 2048:783 / 2048:707 / 2048:745 |

Cobertura: 21 de 21 familias. El Overlay Windi de 6 estados (`204:25611`…) es de PL-15; el panel y el botón flotante (`204:26015`…) son de MB-05.

**Flujo §7 (MEDIDO, reacciones del prototipo).** Windi → Escribir → `204:2609`; Windi → Propuesta → `204:2516`. Propuesta → «Confirmar» → `204:2427`; → «Rechazar» → `204:2876`. Escribiendo → respuesta → Propuesta. Sin conexión y No respondió → Escribiendo/Propuesta. Descartada → «Confirmar» → Windi. P3/P4: los botones sin destino hacen la acción de la HU; «Reintentar» reenvía el último mensaje.

---

## WI-01 · Panel de Windi vacío (cromo común)

**1. Nodos.** 204:2427 | 233:16835 | 204:22790 | 204:22801. Muestras de tema (MEDIDO, variables): oscuro fondo `#201b2b`, superficie_alta `#302d38`, borde `#afa1c0`, tinta `#f8f5ff`; Rosa superficie_alta `#fbeff3`, borde `#b04f7d`, tinta `#3a1528`; Enfoque superficie_alta `#1e1d22`, borde `#e0565b`, tinta `#ffffff`.

**2. Estructura** (los ids son PROPUESTA: el Figma no los trae):
- `windi-panel` (el panel; en el marco de MB-05)
  - `windi-titulo`, `windi-cerrar`
  - `windi-conversacion` (el `<ol aria-live="polite">` del código, `Windi.tsx:191`; sin `role` extra)
    - `windi-mensaje-persona`, `windi-mensaje-windi`, `windi-ilustracion` (solo en Sin conexión y No respondió)
  - `windi-campo`, `windi-contador`, `windi-enviar`

**3. Medidas** (MEDIDO, coordenadas del marco de 360×560)
- Panel: (4,4) 351×551, radio 12, borde `borde` 1,5, relleno `superficie_alta`.
- Título «Windi»: (20,20.5) 49×23, Nunito Bold 17, `tinta`.
- Cerrar: marco 36×36 r7 en (307,14); instancia Botón ícono r9; CLOSE.
- Campo: marco 275×36 en (20,474); instancia `Campo editable`, relleno `superficie`, borde `borde_campo` 1,5, r9, padding 0/12, gap 8; placeholder Regular 14.
- Enviar: 36×36 en (303,474), instancia de Botón ícono Normal **sin relleno ni borde** (F0.md:207), como Cerrar. Los glifos de Enviar y Cerrar: NO MEDIDO (lectura pendiente).
- Contador: (249,518) 46×16, Regular 12, `texto`; alineado a la derecha en x=295 (N20).
- Mensaje de Windi vacío: (98,290) 164×38; borde `borde` 1, r10, padding 9/12, Regular 13, texto `tinta` (huellas 2173-3157/3183/3209). Relleno del mensaje: NO MEDIDO (MB-05 dice `superficie`; lectura pendiente). Ilustración de Windi completa (83,154) 192,9×120.
- En la app el panel está en (737,4) dentro de 1093×560 (la huella lo muestra en (4,4) como marco aislado) y su alto es `100vh − 9` (MB-05, D15). Se estira la conversación (flexible) y el campo queda abajo. `windi-conversacion` empieza en y=68; la separación entre un mensaje de persona y la respuesta es 12 (huellas). La Persona va **alineada a la derecha** (el x=73 de la huella es un artefacto del ancho de la frase). Las pruebas Playwright miden con origen relativo al panel.

**4. Textos literales.** Título «Windi»; placeholder «Escribe un mensaje»; contador «0 / 2000»; saludo «¡Hola, {alias}! Soy Windi. ¿Qué organizamos hoy con tus tarjetas o con la aplicación?» (G9/D11; el Figma trae «Estef»). F3 dibuja «¿Qué organizamos hoy?» como mensaje vacío (MEDIDO); el saludo de HE-14-HU01-CA01 es el que manda en la app (se ve una sola vez). Geometría del saludo largo: la del catálogo, 266×74 (WI-10).

**5. Estados.** Vacío (esta pieza): Enviar deshabilitado (HU01-CA04), contador «0 / 2000». Campo con foco: el borde se queda en `borde_campo` 1,5 y se añade el anillo D6 (2 px `tinta`, separación 3, radio 12; F0.md:212, F0b.md:33, MB-11). Escribiendo, sin conexión, muy largo: ver WI-02 a WI-04.

**6. Teclado y foco.**
- Enter envía; Mayúsculas+Enter hace salto de línea (HU01-CA03, ET05; DUDA registrada en `docs/DUDAS.md`).
- Esc cierra el panel, foco atrapado e `inert` en el fondo: MB-05, no se repite.
- Foco inicial al abrir: lo fija MB-05 (no se repite aquí).
- Orden de Tab: Cerrar, conversación (solo si desborda), campo, Enviar. Ids, `role`, orden de Tab y foco tras confirmar son PROPUESTA (salvo D6 y MB-10 §6).

**7. Animaciones.** A-10 abrir panel, A-11 cerrar, A-24 mensaje nuevo (opacidad y `translateY`, `--dur-corto`), A-22 parpadeo de ojos y A-27 campo (borde y anillo): los tiempos están en `docs/implementacion/ANIMACIONES.md` y no se repiten. A-22: el Figma no dibuja ojos en la cabecera del panel; los de 28 px del código (`PanelDeWindi.tsx`, diferencia ya anotada en MB-05 parte 9) son los que parpadean y se desplazan con «Escribiendo…», junto con los del botón flotante. El autodesplazamiento al final es RD-36/RD-57 (`Windi.tsx:68`).

**8. Errores.** Los de esta pieza viven en WI-02 y WI-04. Cualquier otro fallo previsible de Windi tiene su código en la tabla de MB-05 parte 8 (G1a-G1e).

**9. Diferencia con el código.**
- Cada mensaje de Windi trae ilustración de 77×48 y el rótulo «Windi» (`Windi.tsx:197-200`): el Figma no los dibuja en el chat (RD-70 «sin la ilustración»). M.
- Contenedor y radios: `windi.css:4`, `:34` (radio 12), `:68`, `:123`. Verificar contra el panel de 351×551 y bordes de 1,5 y 1. S.
- El campo es un `textarea` con contador y Enviar en una segunda fila (`Windi.tsx:236-249`, `windi.css:115-158`); el foco usa `outline` con `--wgm-seleccion-texto` y separación 2 (`windi.css:126-129`), no el anillo D6 (2 px `tinta`, separación 3); el Figma pone campo y Enviar en la misma fila de 36 y el contador debajo, a la derecha. M.
- El título «Windi» y los ojos de 28 en la cabecera: `PanelDeWindi.tsx:57` (MB-05 parte 9, no se repite).
- `messages.es.json:140` `WINDI_CELEBRACION` lleva «🎉» (choca con D11). S.

**10. Pruebas.** Una por CA de HU01-CA01 y CA04 en `Windi.test.tsx`; geometría con Playwright con origen relativo al panel (alto `100vh − 9`, campo 36 abajo, contador alineado a x=295) en los 4 temas.

---

## WI-02 · Mensaje muy largo (familia 2172:2075)

**1. Nodos.** 2172:2075 | 2173:3058 | 2173:3016 | 2173:3037.

**2. Estructura.** `windi-campo` (con `aria-invalid`), `windi-contador` (en `error`), `windi-error-mensaje`, `windi-enviar` (deshabilitado).

**3. Medidas** (MEDIDO)
- Campo y Enviar suben a y=444. **El alto del campo se queda en 36**: la huella 2172-2075 no cambia `h` (solo `y`). El Figma recorta el texto con «…»; el código crece hasta `max-height: 120px` (`windi.css:131`). Diferencia anotada en la parte 9.
- Texto del campo: «…y recuérdame revisar las notas de cálculo antes del parcial», Regular 14.
- Contador «2014 / 2000» en (227,488), 68 de ancho, color `error`. N20 manda: va en (249,518), alineado a la derecha en x=295.
- Error de campo (F0.md:211, decisión 26-nov): borde 2 px `error`, r9, ícono de 16 (E19).
- Mensaje de error: la huella dibuja `Error · Mensaje` en (20,488) 200×32, Medium 12/16 `error` (F3). Gana el componente de F0 (Regular 13 `tinta`, unificar a F0); la diferencia de F3 va a Incoherencias.

**4. Textos.** «Tu mensaje no puede superar los 2000 caracteres.» (G1e, contrato `message.too_long`, HU01-CA05); contador «{n} / 2000».

**5. Estados.** Con error: contador en `error`, borde 2 px `error` y mensaje con ícono; Enviar **deshabilitado** mientras el contador marque error (E5). Al bajar de 2000 todo vuelve a normal. Vacío o solo espacios: Enviar deshabilitado (HU01-CA04).

**6. Teclado.** Enter con el mensaje muy largo no envía (HU01-CA05). El foco no sale del campo. Mensaje unido al campo con `aria-describedby` y `aria-invalid` (PROPUESTA, accesibilidad).

**7. Animaciones.** A-27 (campo con `[aria-invalid]`: `border-color`, `--dur-corto`; el mensaje con `opacity`, `--dur-medio`), según `ANIMACIONES.md`.

**8. Errores.** `message.too_long` (G1e `WINDI_MENSAJE_MUY_LARGO` queda como alias): «Tu mensaje no puede superar los 2000 caracteres.», en el campo, sin «Reintentar». Un solo código por fallo (D10). Por S19 gana el nombre del código: se conserva la clave actual `MENSAJE_MUY_LARGO` (`messages.es.json:86`) y G1e es su alias; no se renombra.

**9. Diferencia con el código.**
- El mensaje de motivo existe (`Windi.tsx:246`, `textos.MENSAJE_MUY_LARGO`) y `aria-invalid` (`Windi.tsx:238`). S.
- El contador no cambia a `error` ni se alinea a la derecha en x=295 (`Windi.tsx:244`). S.
- No hay `maxLength` en el `textarea` (correcto: se debe poder pegar más de 2000 y ver el error). Sin cambio.
- El campo crece hasta 120 px (`windi.css:131`); el Figma lo deja en 36 y recorta con «…». M (decidir: se mantiene el crecimiento por usabilidad hasta que Paula diga otra cosa; es una diferencia declarada).

**10. Pruebas.** HU01-CA05 con 2001 caracteres: contador en error, mensaje literal, Enviar deshabilitado; con 2000 queda habilitado; Enter no envía; alto del campo (36 en reposo) en Playwright.

---

## WI-03 · Escribiendo (familia 204:2609)

**1. Nodos.** 204:2609 | 233:16861 | 204:22842 | 204:22853.

**2. Estructura.** `windi-mensaje-persona`, `windi-escribiendo`, `windi-escribiendo-punto` (tres).

**3. Medidas** (MEDIDO)
- Persona: relleno `burbuja_propia`, borde `borde` 1, r10, padding 9/12, Regular 13; ancho 266 (frases cortas de 194, 214 o 216); alto 56 con 2 líneas, 38 con 1; alineada a la derecha (x=73 es artefacto).
- «Escribiendo…» de Windi: (20,136) 102×38, borde 1, r10, padding 9/12, texto **`tinta`** Regular 13 (huellas 2173-3157/3183/3209).
- Desvíos en Rosa (Quicksand): título 45×21, contador 49×15 en (246,518), Persona 266×52. En Enfoque (Space Grotesk): título 46×22, Persona 266×54. Manda T3-T6 (fuente elegida).

**4. Textos.** «Pasa «Enviar la presentación» a Por hacer.» (persona); «Escribiendo…».

**5. Estados.** Mientras Windi responde: «Escribiendo…» y **solo Enviar** deshabilitado; el campo sigue editable (E5, «sin bloquear el campo»; el código ya lo hace: `Windi.tsx:236` solo deshabilita sin conexión). Un segundo envío no sale (Enviar deshabilitado; Enter tampoco, HU01-ET06).

**6. Teclado.** Enter mientras responde no envía. Un solo anuncio: el `<ol aria-live="polite">` del código (`Windi.tsx:191`); sin `role="status"` extra.

**7. Animaciones.** E5: tres puntos animados, color `texto`, tamaño 13, 0,15 s de desfase por punto (PROPUESTA; el Figma dibuja «Escribiendo…» estático). Falta y se marca **PROPUESTA**: la duración del ciclo de los tres puntos (dentro del tope de lazos de ANIMACIONES §4) y el comportamiento con reduced motion (quietos, regla de ANIMACIONES §4). Mensaje nuevo: A-24.

**8. Errores.** Tiempo máximo de 15 s (RNF-11, D-172); al vencer, `windi.unavailable` (WI-04).

**9. Diferencia con el código.** `Windi.tsx:215` ya muestra «Escribiendo…» (`windi.css:56`), sin puntos animados y con color `texto`. S.

**10. Pruebas** (una por CA, en `Windi.test.tsx`):
- HU01-CA01: abrir el chat muestra el saludo una sola vez, Enviar deshabilitado y «0 / 2000».
- HU01-CA02: escribir y pulsar «Enviar» muestra el mensaje de inmediato, «Escribiendo…» hasta la respuesta, y vacía el campo.
- HU01-CA03: Enter envía y Mayúsculas+Enter hace salto de línea.
- HU01-CA04: vacío o solo espacios deja Enviar deshabilitado.
- E5: durante «Escribiendo…» el campo se puede editar y Enviar sigue deshabilitado.

---

## WI-04 · Sin conexión, No respondió y errores de Windi (204:2698, 204:2787)

**1. Nodos.** Sin conexión: 204:2698 | 233:16872 | 204:22864 | 204:22875. No respondió: 204:2787 | 233:16883 | 204:22886 | 204:22897.

**2. Estructura.** `windi-mensaje-sin-conexion`, `windi-mensaje-no-respondio`, `windi-reintentar`, `windi-ilustracion`.

**3. Medidas** (MEDIDO)
- Sin conexión: mensaje de Windi en (47,290) 266×74; ilustración completa `Estado=Sin conexión o error` (ojos cerrados) en (83,154) 192,9×120.
- No respondió: mensaje (47,290) 266×56; «Reintentar» en (136,356) 88×30, borde 1, Medium 13 (A3 lo unifica a Secundario de 36, r9, sin sombra). La huella 204-2787 trae también el Windi completo `Estado=Sin conexión o error` en (83,154).
- Sin conexión **con historial** (ET13): la huella no lo dibuja. El aviso va como mensaje de Windi al final de la conversación, sin tapar el historial (PROPUESTA).

**4. Textos.**
- Sin conexión: «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» (G1c, `net.offline`, HU01-CA07).
- No respondió: «No pude responder en este momento. Intenta de nuevo.» + «Reintentar» (G1b, `windi.unavailable`, HU01-CA08).

**5. Estados.** Sin conexión: historial visible, campo y Enviar **deshabilitados** con la variante Deshabilitado, **sin opacidad por capa** (E3/MB-05; gana sobre la opacidad de A-37), ET12/ET13; el historial se conserva mientras la app está abierta (ET14); al volver la conexión se rehabilitan. No respondió: el mensaje escrito se conserva y «Reintentar» lo reenvía (P4, HU01-CA08). G3: si coinciden largo y sin conexión, gana G1c.

**6. Teclado.** «Reintentar» es un botón (MB-10): Tab, Enter, Espacio; tras pulsarlo el foco pasa al campo (PROPUESTA).

**7. Animaciones.** A-37 (campo y Enviar al pasar a deshabilitados, `--dur-corto`, solo el cambio de estado, sin opacidad). Ojos cerrados: A-22/MB-27.

**8. Errores: un código y un mensaje por causa (D10).** Ninguna causa cae en el genérico (RD-83).

| Comando | Causa | Código de contrato | Código G1 | Mensaje | Dónde y reintento |
|---|---|---|---|---|---|
| `windi_send_message` | sin conexión, también si se pierde a mitad de respuesta | `net.offline` | G1c `WINDI_SIN_CONEXION` | «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» | mensaje de Windi; sin Reintentar |
| `windi_send_message` | no responde en 15 s | `windi.unavailable` | `windi.unavailable` (clave `WINDI_NO_DISPONIBLE`; G1b `WINDI_SIN_RESPUESTA` es alias) | «No pude responder en este momento. Intenta de nuevo.» | mensaje de Windi; Reintentar reenvía el mensaje |
| `windi_send_message` | cualquier otro error | (otro) | G1a `WINDI_ERROR_INTERNO` | «Windi tuvo un problema. Tus tarjetas no cambiaron. Intenta de nuevo.» | mensaje de Windi; Reintentar |
| `windi_send_message` | más de 2000 | `message.too_long` | `message.too_long` (clave `MENSAJE_MUY_LARGO`; G1e `WINDI_MENSAJE_MUY_LARGO` es alias) | «Tu mensaje no puede superar los 2000 caracteres.» | en el campo (WI-02) |
| `windi_confirm_proposal` / `windi_reject_proposal` | sin conexión | `net.offline` | `net.offline` (clave `WINDI_SIN_CONEXION_AL_CONFIRMAR`; G1d `WINDI_CONEXION_PERDIDA` es alias) | «Se perdió la conexión. No se hizo ningún cambio.» | ver abajo |
| `windi_confirm_proposal` | no se pudo aplicar | `windi.apply_failed` | (contrato) | «No pude aplicar los cambios. No se hizo ningún cambio.» | mensaje de Windi; Confirmar y Rechazar siguen habilitados |
| `windi_confirm_proposal` / `windi_reject_proposal` | propuesta descartada | `proposal.discarded` | (contrato) | marca de la propuesta (WI-09) | la propuesta se marca; sin mensaje de error |
| `windi_reject_proposal` | cualquier otro error | (otro) | G1a `WINDI_ERROR_INTERNO` | «Windi tuvo un problema. Tus tarjetas no cambiaron. Intenta de nuevo.» | mensaje de Windi; la propuesta sigue pendiente |
| `windi_confirm_proposal` | cualquier otro error | (otro) | G1a `WINDI_ERROR_INTERNO` | el mismo | ídem |
| `windi_get_conversation` | sin conexión | `net.offline` | G1c | el de G1c | mensaje de Windi; sin Reintentar |
| `windi_get_conversation` | cualquier otro error | (otro) | G1a | el de G1a | mensaje de Windi; Reintentar vuelve a leer la conversación (PROPUESTA) |
| `label_list` | falla | (otro) | G1h `OPERACION_FALLIDA` | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso (G5, Error hasta cerrarlo); las propuestas no muestran ids de etiqueta, muestran «Etiquetas no disponibles» (PROPUESTA) |

**G1d (confirmar o rechazar sin conexión), definido (PROPUESTA salvo el texto y el código):**
- Se dibuja como mensaje de Windi debajo de la propuesta, 266 de ancho y 56 de alto (huella 2171:2281, mensaje extra en (20,309) 266×56), borde 1, r10.
- Confirmar y Rechazar quedan deshabilitados (contrato).
- «Reintentar» reenvía la misma acción (confirmar o rechazar) con el mismo `proposal_id`; está deshabilitado mientras no haya conexión.
- Al volver la conexión (`online=true` en la lectura de la conversación) se rehabilitan Confirmar, Rechazar y Reintentar y el mensaje se quita.

**`windi.apply_failed`: un solo destino.** Gana el Figma (2172:2106): mensaje de Windi en la conversación. El aviso RT-04 que pide HE-14-HU03-CA07 pasa a «Incoherencias resueltas». Confirmar y Rechazar siguen habilitados.

**9. Diferencia con el código.**
- `Windi.tsx:76` `if (!r.ok) return;` en `windi_get_conversation`: el error se pierde y el panel queda con `aria-busy` (`Windi.tsx:185`, `mensajes === null`) para siempre. M.
- `Windi.tsx:72-74` `label_list` falla en silencio y las propuestas muestran ids (`Propuesta.tsx:55`, `?? String(id)`). M.
- `Windi.tsx:119-122`: todo error que no es `net.offline` cae a `setFallido` y muestra `WINDI_NO_DISPONIBLE` (G1b); no se comprueba `windi.unavailable` y G1a se confunde con G1b. G1a no tiene clave en `messages.es.json`. M.
- `Windi.tsx:146` `confirmar` usa `r.error.message || textos.WINDI_NO_PUDE_APLICAR` como aviso, no como mensaje de Windi. S.
- `Windi.tsx:159` `rechazar` usa `textoDelError` genérico en cualquier otro error. S.
- `Windi.tsx:217-226` muestra el fallo como `wg-windi__falla` con `role="alert"`, fuera de la lista; el Figma lo pone como mensaje de Windi dentro de la conversación (x=47). M.
- «Reintentar» deshabilitado sin conexión (`Windi.tsx:221`): coherente con E5. Sin cambio. `messages.es.json:152` y `:158` ya tienen G1b y G1c.

**10. Pruebas.**
- HU01-CA07 (campo y Enviar deshabilitados, historial visible) y HU01-CA08 (15 s, mensaje y «Reintentar» conserva el mensaje).
- Una prueba por fila de la tabla que simule `r.ok=false` en cada comando: `windi_get_conversation` (el panel sale de `aria-busy` y muestra G1a o G1c), `label_list` (no se ven ids), `windi_send_message` (`net.offline`, `windi.unavailable`, otro), `windi_confirm_proposal` (`net.offline`, `windi.apply_failed`, `proposal.discarded`, otro) y `windi_reject_proposal` (`net.offline`, otro).

---

## WI-05 · Propuesta (componente único) (204:2516)

**1. Nodos.** 204:2516 | 233:16846 | 204:22812 | 204:22827. Instancia `Windi · Propuesta` (203 de ancho), solo en las 6 primeras familias. N8: un solo componente de propuesta; los marcos manuales de 278 de ancho de WI-06 a WI-09 se reconstruyen con él.

**2. Estructura.**
- `windi-propuesta` (`role="group"`, `aria-label="Propuesta"`)
  - `windi-propuesta-pregunta`
  - `windi-propuesta-tarjeta` → `windi-propuesta-rotulo` («PROPUESTA»), `windi-propuesta-titulo`, `windi-propuesta-datos`
  - `windi-propuesta-aviso` (opcional)
  - `windi-propuesta-descartada` (marca, solo en Descartada)
  - `windi-propuesta-confirmar`, `windi-propuesta-rechazar`
- El chip de etiqueta de WI-08 es `windi-etiqueta-chip` (no choca con el rótulo).

**3. Medidas** (MEDIDO, claro)
- Pendiente (variante corta): (20,136) 203×77, «¿Muevo la tarjeta a Por hacer?», «Confirmar», «Rechazar». Marco: borde `borde` 1, r10 (R2), V gap 8, padding 9/12.
- Variantes largas, marco de 278 de ancho en x=20; tarjeta `Tarjeta · PROPUESTA` 252 de ancho en x=33, relleno `superficie_alta`, borde 1, r8, gap 4, padding 8/10.
- «PROPUESTA» Medium 11/15 `texto`; título Bold 15/20; rótulo («Datos», «Cambios») Medium 12/16 `texto`; líneas Regular 12/16 `tinta`; pregunta Regular 13/18 `tinta`, 250 de ancho.
- Acciones en la huella: «Confirmar» 85×30 y «Rechazar» 80×30, gap 8. **Con A3** (36 de alto, r9; Principal `accion`/`sobre_accion` con sombra `3,5`; Secundario sin sombra, R8/R9) y **MB-10** (padding horizontal 16) los botones miden 36 de alto; su ancho con padding 16: NO MEDIDO (depende del texto y de la fuente). Las alturas del panel se declaran en las dos versiones (+6 con A3):

| Variante | Alto del panel (acciones de 30, huella) | Alto con A3 (acciones de 36) | Alto de tarjeta | Posición | Acciones en y (huella) |
|---|---|---|---|---|---|
| Pendiente (corta) | 77 | 83 | n/a | (20,136) | n/a |
| Crear | 241 | 247 | 157 | (20,136), tarjeta (33,172) | 337 |
| Cambiar | 201 | 207 | 117 | (20,136) | 297 |
| Cambiar · Completada | 235 | 241 | 133 | (20,136) | 331 |
| Mover | 161 | 167 | 77 | (20,136) | 257 |
| Mover · Completada | 231 | 237 | 129 | (20,136) | 327 |
| Eliminar varias | 221 | 227 | 137 | (20,118) | 299 |
| Crear etiqueta | 159 | 165 | 75 | (20,118) | 237 |
| Descartada (sin botones, E6) | 225 con botones | 187 (225 − 30 − 8) | 117 | (20,118) | no hay |
| Sin conexión | 161 | 167 | 77 | (20,136) | 257 |

Desvíos en Rosa (propuesta 211×75 en y=132) y Enfoque (216×76 en y=134): la fuente cambia la caja, manda T3-T6.

**4. Textos.** «¿Muevo la tarjeta a Por hacer?», «PROPUESTA», «Confirmar», «Rechazar». Pregunta según acción: WI-06 a WI-08.

**5. Estados.**
- Activa: «Confirmar» y «Rechazar» habilitados (HU03-CA01).
- Sin conexión: ambos deshabilitados (contrato `net.offline` de `windi_confirm_proposal`, ET07); mensaje G1d (WI-04).
- Descartada: marca y **botones ocultos** (E6). Esto contradice HU03-CA04 («deshabilitadas»); gana E6 y va a «Incoherencias resueltas». Texto de la marca: «Descartada» (S16).
- Confirmada o rechazada (S15): sin estado visible, sin marca ni texto nuevo; «Confirmar» y «Rechazar» quedan **deshabilitados** (foco, hover y deshabilitado de MB-10) y Windi responde con el mensaje del catálogo. A diferencia de Descartada, aquí los botones no se ocultan.
- Foco, hover y deshabilitado: los de Botón (MB-10).

**6. Teclado.** Confirmar y Rechazar son botones: Tab, Enter y Espacio. Escribir «sí» y Enviar **no confirma**: Windi pide pulsar «Confirmar» (HU03-CA05). Tras confirmar o rechazar, el foco vuelve al campo (PROPUESTA).

**7. Animaciones.** A-24 (la propuesta entra con el mensaje). Sin animación propia de los botones.

**8. Errores.** Los de la tabla de WI-04 (`net.offline`, `windi.apply_failed`, `proposal.discarded`, otro → G1a, `stale`). `stale`: mensaje de Windi con la propuesta nueva (WI-10).

**9. Diferencia con el código.**
- `Propuesta.tsx:84-89` pone «PROPUESTA» (oculto a lectores de pantalla) y «Descartada»; `:154-158` deja Confirmar y Rechazar **deshabilitados** si no está activa. Se pide el cambio: ocultarlos solo en Descartada (E6); en confirmada o rechazada (S15) el comportamiento actual de deshabilitarlos ya sirve: verificar que `Propuesta.tsx:154-158` distinga ambos casos (descartada oculta, resuelta deshabilita). S.
- El Figma dibuja una sola tarjeta; el código recorre `items` (`Propuesta.tsx:90`). Sin cambio (varias tarjetas en Eliminar, WI-07).
- Botones: verificar alto 36 y r9 (A3). S. `windi.css:62-114` (marco y acciones): ajustar a r10, padding 9/12, gap 8. M.

**10. Pruebas.** HU03-CA01, CA04 (descartada sin botones, E6), CA05, CA07 (mensaje de Windi y botones habilitados); botones deshabilitados sin conexión.

S15 (CA derivado, PROPUESTA con destino HU03): tras «Confirmar» o «Rechazar» la tarjeta no muestra marca ni texto nuevo, sus dos botones están deshabilitados (`disabled`) y no se ocultan; la marca `windi-propuesta-descartada` no existe en ese estado (Vitest de `Propuesta.tsx`).

---

## WI-06 · Propuestas de Crear, Cambiar y Mover (2170:1994, 2171:2002, 2171:2082)

**1. Nodos.** Ver tabla de ids.

**2. Estructura.** La de WI-05; `windi-propuesta-datos` con una línea (`windi-propuesta-dato`) por dato.

**3. Medidas.** Alturas en la tabla de WI-05. Crear: mensaje de persona 266 de ancho; tarjeta de 7 líneas (Tipo, Fecha límite, Prioridad, Etiquetas). Cambiar y Mover: persona de 266 o la que corresponda; panel en (20,136).

**4. Textos literales.**
- Persona (Crear): «Crea una tarea para entregar el informe el viernes, con prioridad alta.»
- Crear: «¿Creo esta tarjeta?», «Entregar el informe», «Datos», «Tipo: Tarea», «Fecha límite: 27/11/2026», «Prioridad: Alta», «Etiquetas: Universidad».
- Persona (Cambiar): «Pasa «Revisar calendario» al viernes y quítale la etiqueta Urgente.»
- Cambiar: «¿Cambio estos datos de la tarjeta?», «Revisar calendario», «Cambios», «Fecha límite: 25/11/2026 → 27/11/2026», «Etiquetas: Trabajo, Urgente → Trabajo».
- Persona (Mover): «Pasa «Enviar la presentación» a En progreso.»
- Mover: «¿Muevo la tarjeta a En progreso?», «Enviar la presentación», «Columna: Por hacer → En progreso».

**5. Estados.** Los de WI-05.

**6. Teclado.** Los de WI-05.

**7. Animaciones.** A-24.

**8. Errores.** Los de Windi al preparar la propuesta (contrato `windi_send_message`): `windi.card_not_found`, `windi.column_not_found`, `windi.label_not_found`, `windi.same_value`, `windi.already_in_column`, `name.required`, `name.too_long`, `name.duplicate`, `labels.limit_reached`, `due_date.in_past`, `labels.too_many` («Puedes asignar hasta 3 etiquetas.», RD-96), `time_block.past`, `time_block.after_due_date`. Se muestran como mensaje de Windi (WI-10), con el mismo literal del Núcleo; ninguno cae en el genérico (RD-83).

**9. Diferencia con el código.**
- Formato de fechas en la propuesta: `valorVisible` en `Propuesta.tsx:48-58`. Verificar `dd/mm/aaaa`. S.
- `labels.too_many` en HE-14-HU03-CA06 dice «máximo 5» y RD-96 lo bajó a 3: el contrato manda. S.

**10. Pruebas.** HU04 (crear), HU05 (editar) y HU06 (mover): una por CA; que cada línea de la tarjeta aparezca con el texto literal; geometría de las alturas de la tabla.

---

## WI-07 · Tarjeta completada y Eliminar varias (2171:2042, 2171:2120, 2171:2159)

**1. Nodos.** Ver tabla de ids.

**2. Estructura.** WI-05 más `windi-propuesta-aviso` (color `error`).

**3. Medidas** (MEDIDO)
- Cambiar · Completada: panel 235, tarjeta 133 (título de 2 líneas, 36).
- Mover · Completada: panel 231, tarjeta 129; aviso de 3 líneas, 48 de alto, `error`, Medium 12/16.
- Eliminar varias: panel 221, tarjeta 137, en (20,118); persona 194×38.

**4. Textos literales.**
- Cambiar · Completada: persona «Cambia la prioridad de «Revisar los bocetos» a baja.»; «Esta tarjeta ya está completada. ¿Cambio su prioridad?», «Revisar los bocetos», «Prioridad: Alta → Baja», aviso «Esta tarjeta está completada. Editarla no cambia su columna.»
- Mover · Completada: persona «Devuelve «Revisar los bocetos» a Por hacer.»; «Esta tarjeta ya está completada. ¿La muevo a Por hacer?», «Columna: Hecho → Por hacer», aviso «Esta tarjeta está completada. Si la mueves, dejará de estar completada y se borrará su fecha de completado.»
- Eliminar: persona «Elimina las tarjetas vencidas.»; «¿Elimino estas tarjetas?», «3 tarjetas», «Pagar el gimnasio», «Responder correo del profesor», «Actualizar el backlog», «Esta acción no se puede deshacer.» (`error`, Medium 12/16).
- Aviso de eliminar una completada (HU07, contrato): «Esta tarjeta está completada. Si la eliminas, dejará de contar en tus reportes.»

**5. Estados.** Los de WI-05. El aviso se muestra solo si la tarjeta está completada; lo pone el Núcleo (los avisos literales vienen de `warnings` de `WindiProposal`, no se reescriben en la vista).

**6. Teclado.** Los de WI-05; el aviso se anuncia con la propuesta (se lee dentro del grupo, PROPUESTA).

**7. Animaciones.** A-24.

**8. Errores.** Los de WI-06. «Esta acción no se puede deshacer.» es un aviso, no un error (HU07).

**9. Diferencia con el código.** `Propuesta.tsx` pinta los avisos (`warnings`); verificar que se use `error` y Medium 12/16 y que el texto sea el del Núcleo. S. Mover completada usa el mismo aviso; si el código lo arma en la vista, es duplicado del Núcleo: M.

**10. Pruebas.** HU05 y HU06 con tarjeta completada; HU07 con aviso y con 3 tarjetas.

---

## WI-08 · Propuesta de crear etiqueta (2171:2200)

**1. Nodos.** Ver tabla de ids.

**2. Estructura.** `windi-etiqueta-chip`, `windi-propuesta-color`.

**3. Medidas** (MEDIDO). Panel 159, tarjeta 75, en (20,118); persona 214×38. Chip `Etiqueta · Lectura` 63×18, gap 6, punto 12×12, texto SemiBold 13/18. El punto del Figma es #3b82f6, que C8 pasa a **Azul `#3e63dd`** (catálogo C10).

**4. Textos.** Persona «Crea la etiqueta Lectura en azul.»; «¿Creo esta etiqueta?», chip «Lectura», «Color: Azul».

**5. Estados.** Los de WI-05. El color es el del catálogo (D3); no hay colores libres.

**6. Teclado.** Los de WI-05.

**7. Animaciones.** A-24.

**8. Errores.** `windi.label_color_required` («¿De qué color quieres la etiqueta “{etiqueta}”? Los colores son: {colores}.»), `windi.color_not_found` («No tengo el color “{color}”. Los colores son: {colores}.»), `name.required`, `name.duplicate`, `name.too_long`, `labels.limit_reached`. Las listas de colores usan los 9 nombres del catálogo, no los 4 de F3.

**9. Diferencia con el código.**
- Las listas de colores salen hoy de textos fijos: `messages.es.json:141-143` (`WINDI_COLOR_DE_LA_ETIQUETA`, `WINDI_COLOR_NO_ENCONTRADO`) y `src-tauri/src/messages.rs:459,462`. Deben salir de `catalog_color` (9 nombres, seed `supabase/seed.sql:53-63`). S.
- El código ya pinta una muestra de color (`wg-muestra-color`, `Propuesta.tsx:127`); falta el chip 63×18 con nombre en SemiBold 13. S.

**10. Pruebas.** HU10: crear una etiqueta con color; el nombre del color sale del catálogo.

---

## WI-09 · Propuesta descartada y variantes sin conexión (204:2876, 2171:2240, 2171:2281)

**1. Nodos.** Ver tabla de ids.

**2. Estructura.** `windi-propuesta-descartada` (marca), `windi-mensaje-windi` adicional en Sin conexión.

**3. Medidas** (MEDIDO)
- Propuesta descartada (204:2876): instancia 203×101 con «Propuesta descartada» Medium 12.
- Propuesta · Descartada: panel 225 con botones (187 sin ellos, WI-05), tarjeta 117, en (20,118), persona 216×38 «Mejor crea la tarea para el lunes.»; «Descartada» en (33,279) 62×16, Medium 12/16 `texto`.
- Propuesta · Sin conexión: panel 161, tarjeta 77, en (20,136); mensaje extra de Windi en (20,309) 266×56.

**4. Textos.** La marca: «Descartada» (S16; HU03-CA04, ET04, huella 2171:2240); la huella 204:2876 dice «Propuesta descartada» y no se usa. Contenido: «¿Creo esta tarjeta?», «Entregar el informe», «Datos», «Tipo: Tarea», «Fecha límite: 27/11/2026». Sin conexión: «Se perdió la conexión. No se hizo ningún cambio.» (G1d).

**5. Estados.** Descartada: sin botones (E6). Sin conexión: Confirmar y Rechazar deshabilitados y G1d con «Reintentar» (WI-04). «Rechazar» en el flujo lleva a la descartada (P3).

**6. Teclado.** Una propuesta descartada no tiene controles; la marca es parte del grupo.

**7. Animaciones.** A-24 para el mensaje nuevo. Sin animación al pasar a descartada (PROPUESTA).

**8. Errores.** G1d (definido en WI-04: dónde se dibuja, tamaño, qué reintenta, cuándo se rehabilita). `proposal.discarded` marca la propuesta.

**9. Diferencia con el código.** `Propuesta.tsx:89` pone «Descartada» con `wg-indicador`; `:154-158` deja los botones deshabilitados: se pide ocultarlos (E6). S. `messages.es.json:159-160` `WINDI_SIN_CONEXION_AL_CONFIRMAR`: verificar que sea G1d y que `Windi.tsx:157` lo use con Reintentar. S.

**10. Pruebas.** HU03-CA02 (sin conexión), CA04 (descartada sin botones, E6).

---

## WI-10 · Catálogo de respuestas (4 familias: 2172:2106, 2172:2145, 2172:2184, 2172:2223)

**1. Nodos.** Ver tabla de ids. Cada familia es una pila de mensajes de Windi de 266 de ancho en x=20 con paso de 8 entre uno y otro.

**2. Estructura.** `windi-mensaje-windi` repetido; ids por intent en la prueba: `windi-respuesta-{intent}` (PROPUESTA).

**3. Medidas** (MEDIDO; borde 1, r10, padding 9/12, Regular 13)

| Familia | y de cada mensaje | Alturas | Anchos |
|---|---|---|---|
| Propuesta | 64/128/192/292/356/420 | 56/56/92/56/56/38 | 266; el último 162 |
| Saludo y datos que faltan | 64/146/192/256/320/366 | 74/38/56/56/38/74 | 266/255/266/266/240/266 |
| No encuentra y sin cambio | 64/128/210/292/356 | 56/74/74/56/56 | 266 |
| Hecho y fuera de alcance | 64/110/156/202/248/348 | 38/38/38/38/92/56 | 211/156/173/150/266/266 |

**4. Textos literales (con su código)**
- Propuesta:
  - «Se perdió la conexión. No se hizo ningún cambio.» (G1d / `net.offline`).
  - «No pude aplicar los cambios. No se hizo ningún cambio.» (`windi.apply_failed`).
  - «No hice ningún cambio porque tus tarjetas cambiaron desde que te lo propuse: la fecha límite de «Revisar calendario» ahora es 28/11/2026.» (`stale`, HU03-CA03/CA08).
  - «Esta es la propuesta con los datos actuales. ¿Confirmas?»; «Entendido, no hice ningún cambio. ¿Quieres cambiar algo de la propuesta?»; «Listo, ya hice el cambio.»
- Saludo y datos que faltan:
  - «¡Hola, {alias}! Soy Windi. ¿Qué organizamos hoy con tus tarjetas o con la aplicación?» (G9/D11: alias, el Figma dice «Estef»; catálogo 266×74).
  - «¡Bien hecho, {alias}! Ya está en Hecho.» (sin 🎉, D11).
  - «Falta el título de una de las tarjetas. ¿Cómo se llama?»; «A la tarjeta “Entregar el informe” le falta la fecha límite. ¿Para cuándo es?» (el Figma usa “ ”; G8 manda « »); «¿Qué nombre le pongo a la etiqueta?»; «¿De qué color quieres la etiqueta «Lectura»? Los colores son: {los 9 del catálogo}.»
- No encuentra y sin cambio: «No encuentro una tarjeta llamada «Informe final». ¿Me das más detalles?» (`windi.card_not_found`); «No encuentro la columna «Pendientes». Tus columnas son: Por hacer, En progreso y Hecho.» (`windi.column_not_found`); «No tienes la etiqueta «Trabajo». Tus etiquetas son: Proyecto, Universidad, Personal y Salud.» (`windi.label_not_found`); «No tengo el color «turquesa». Los colores son: {catálogo}.» (`windi.color_not_found`); «La tarjeta «Revisar los bocetos» ya está en Hecho.» (`windi.already_in_column`).
- Hecho y fuera de alcance: «Listo, creé la etiqueta «Lectura».»; «Listo, creé 3 etiquetas.»; «Listo, actualicé 4 tarjetas.»; «Listo, moví 2 tarjetas.»; «Solo puedo ayudarte con tus tarjetas y con Windgets. Por ejemplo, puedo crear una tarjeta o contarte qué tienes para hoy.» (`out_of_scope`, HU01-CA06); «La tarjeta «Revisar calendario» ya tiene ese valor.» (`windi.same_value`).

**5. Estados.** `clarify` y `out_of_scope` no descartan la propuesta activa (contrato). Una pregunta ambigua se responde con una sola pregunta y sin propuesta (HU01-CA09). Escribir «sí» no confirma (HU03-CA05, ver WI-05).

**6. Teclado.** Mensajes de solo lectura; la lista de conversación recibe foco solo si desborda (PROPUESTA).

**7. Animaciones.** A-24 por cada mensaje nuevo; autodesplazamiento al final (RD-36/RD-57).

**8. Errores.** Los códigos de la sección 4; todos con mensaje propio, ninguno en el genérico (RD-83). Los listados («Tus columnas son…») los arma el Núcleo.

**9. Diferencia con el código.**
- `messages.es.json:139-165` tiene las claves `WINDI_*` de casi todas las respuestas. `:140` `WINDI_CELEBRACION` lleva «🎉» (D11). S. `:157` `WINDI_SALUDO` ya usa `<alias>`. Sin cambio.
- Comillas: F3, `messages.es.json` y `src-tauri/src/messages.rs` usan “ ” en varios textos; G8 pide « ». Se unifica a « » en `messages.es.json` y en `messages.rs`. Los literales de IPC-WIN-02 (`contratos.md`) y de HU03-CA06 también usan “ ” y van a «Incoherencias resueltas». M.
- Emoji «🎉»: además de `messages.es.json:140`, está en `src-tauri/src/messages.rs:428` y en `servicio_de_windi/pruebas.rs:437`, `:2576`, `:2588`. S.
- Listas de colores `messages.rs:459`, `:462` → `catalog_color` (9 nombres). S.
- Clave `MENSAJE_MUY_LARGO` frente al código `WINDI_MENSAJE_MUY_LARGO` de G1e: S19 (27-nov): gana la clave existente `MENSAJE_MUY_LARGO`; G1e queda como alias. S.
- `Windi.tsx:119-160` solo trata `net.offline` y `windi.unavailable`; el resto de intents llegan como texto del Núcleo. Sin cambio.

**10. Pruebas** (una por CA):
- HU01-CA06: fuera de alcance responde el literal y no descarta la propuesta activa.
- HU01-CA09: pregunta ambigua, una sola pregunta y sin propuesta.
- HU03-CA03 y CA08: tarjeta cambiada, mensaje `stale` con el dato distinto y propuesta nueva.
- HU03-CA05: escribir «sí» no confirma y Windi pide «Confirmar».
- HU03-CA06: «No encuentro la columna «Archivo». Tus columnas son: …» y la propuesta anterior sigue activa.
- HU03-CA07: `windi.apply_failed` muestra el mensaje y deja Confirmar y Rechazar habilitados.
- HU08-HU10: cada literal con su código; comillas « »; los colores salen de `catalog_color`.

---

## WI-11 · Nombre emergente (2048:669)

**1. Nodos.** 2048:669 | 2048:783 | 2048:707 | 2048:745. Detalle general en MB-21 (NombreEmergente) y RD-100; aquí solo la parte de Windi.

**2. Estructura.** `nombre-emergente-cerrar` (`Posición=Debajo`), `nombre-emergente-enviar` (`Posición=Arriba`).

**3. Medidas** (MEDIDO). «Cerrar» en (297,58) 57×36; «Enviar» en (293,430) 57×36; Medium 13. Solo conserva la reacción de Cerrar.

**4. Textos.** «Cerrar», «Enviar».

**5. Estados.** Aparece tras 400 ms con el puntero y sin retraso con el foco del teclado (RD-100); debajo para Cerrar, arriba para Enviar.

**6. Teclado.** Visible con el foco; Esc cierra el panel, no solo el nombre emergente (MB-05).

**7. Animaciones.** A-30 (`opacity` 0→1, `--dur-instante`; retraso 400 ms con puntero y 0 con foco).

**8. Errores.** Ninguno.

**9. Diferencia con el código.** El nombre emergente es del componente base (MB-21, `ui/NombreEmergente`); no hay código propio de Windi. Sin cambio salvo comprobar que Cerrar y Enviar lo reciben. S.

**10. Pruebas.** Foco por teclado en Cerrar y en Enviar: aparece el nombre; con puntero, tras 400 ms.

---

## Tabla de geometría

Coordenadas de la huella (marco aislado de 360×560, panel en (4,4)), tema claro. En la app el panel está en (737,4) dentro de 1093×560 con alto `100vh − 9` (MB-05, D15): las pruebas miden con origen relativo al panel.

| `data-testid` | x | y | w | h | Regla |
|---|---|---|---|---|---|
| `windi-panel` | 4 | 4 | 351 | 551 (app: `100vh − 9`) | r12, borde 1,5 |
| `windi-titulo` | 20 | 20,5 | 49 | 23 | Bold 17 |
| `windi-cerrar` | 307 | 14 | 36 | 36 | Botón ícono Normal, sin relleno ni borde |
| `windi-conversacion` | 20 | 68 (inicio) | 275 | flexible | separación persona-respuesta 12 |
| `windi-campo` (vacío, escribiendo, sin conexión) | 20 | 474 | 275 | 36 | `borde_campo` 1,5, r9, anillo D6 |
| `windi-campo` (mensaje muy largo) | 20 | 444 | 275 | 36 | `h` no cambia en la huella; el código crece hasta 120 |
| `windi-enviar` | 303 | 474 (444 muy largo) | 36 | 36 | Botón ícono Normal; glifo NO MEDIDO |
| `windi-contador` | 249 | 518 | 46 | 16 | alineado a la derecha en x=295 (N20) |
| `windi-error-mensaje` | 20 | 488 | 200 | 32 | F0: Regular 13 `tinta` + ícono 16 (F3: Medium 12 `error`, incoherencia) |
| `windi-mensaje-persona` (1 línea) | alineada a la derecha (x=73 en la huella) | según familia | 194-266 | 38 | `burbuja_propia`, r10 |
| `windi-mensaje-persona` (2 líneas) | idem | según familia | 266 | 56 | idem |
| `windi-mensaje-windi` vacío | 98 | 290 | 164 | 38 | r10, texto `tinta`; relleno NO MEDIDO |
| `windi-mensaje-windi` saludo largo | 20 | catálogo | 266 | 74 | r10 |
| `windi-escribiendo` | 20 | 136 | 102 | 38 | r10, texto `tinta` |
| `windi-mensaje-sin-conexion` | 47 | 290 | 266 | 74 | r10 |
| `windi-mensaje-no-respondio` | 47 | 290 | 266 | 56 | r10 |
| `windi-reintentar` | 136 | 356 | 88 | 30 (A3: 36) | Secundario |
| `windi-propuesta` (corta) | 20 | 136 | 203 | 77 (A3: 83) | r10, V gap 8 |
| `windi-propuesta` (crear / cambiar / mover / eliminar / etiqueta) | 20 | 136 o 118 | 278 | 241 / 201 / 161 / 221 / 159 (A3: +6) | WI-05 |
| `windi-propuesta` (descartada, sin botones) | 20 | 118 | 278 | 187 | 225 con botones menos 30 y gap 8 |
| `windi-propuesta-tarjeta` | 33 | 172 (crear) | 252 | 157 / 117 / 77 / 137 / 75 / 117 | r8, `superficie_alta` |
| `windi-propuesta-confirmar` | 33 | 337 / 297 / 257 / 299 / 237 / 303 | 85 | 30 (A3: 36) | Principal; ancho con padding 16 NO MEDIDO |
| `windi-propuesta-rechazar` | 126 | misma y | 80 | 30 (A3: 36) | Secundario |
| `windi-propuesta-descartada` | 33 | 279 | 62 | 16 | Medium 12/16 |
| `windi-ilustracion` (Sin conexión, No respondió) | 83 | 154 | 192,9 | 120 | ojos cerrados |

Alturas del panel y del campo por estado: panel `100vh − 9` en todos; campo 36 en vacío, escribiendo, sin conexión (deshabilitado), con error y mensaje largo (y=444 con error); la conversación absorbe la diferencia.

---

## Incoherencias resueltas

| # | Incoherencia | Decisión que aplica |
|---|---|---|
| 1 | «Confirmar» y «Rechazar» 30 de alto, r8; el sistema pide 36 y r9 | A3, R2: 36 de alto, r9; Principal con sombra `3,5`, Secundario sin sombra (R8/R9); alturas en las dos versiones (WI-05) |
| 2 | Mensaje y propuesta r10, botones r9 | R2: se mantiene |
| 3 | Marcos manuales de propuesta de 278 de ancho frente a la instancia de 203 | N8: un solo componente |
| 4 | Sin conexión: el Figma no marca campo y Enviar deshabilitados | E3/E5: variante Deshabilitado; HU01-CA07 |
| 5 | «Escribiendo…» estático | E5: tres puntos animados (PROPUESTA), sin bloquear el campo |
| 6 | Descartada con botones visibles (Figma) frente a «deshabilitadas» (HU03-CA04) | E6: se ocultan los dos |
| 7 | Botones sin destino en el prototipo | P3/P4: hacen la acción de la HU; «Reintentar» reenvía el último mensaje |
| 8 | Comillas “ ” en F3, `messages.es.json`, `messages.rs`, IPC-WIN-02 y HU03-CA06 | G8: « » |
| 9 | Saludo «Estef» con 🎉 (también en `messages.rs` y `pruebas.rs`) | G9/D11: alias y sin emoji |
| 10 | Contador en (227,488) en Mensaje muy largo | N20: (249,518) alineado a x=295 |
| 11 | Punto de etiqueta #3b82f6 | C8: Azul `#3e63dd` |
| 12 | F3 lista 4 colores de etiqueta | C10: los 9 del catálogo, leídos de `catalog_color` |
| 13 | «Ocurrió un error inesperado.» (F5 `204:26063`) | G1a `WINDI_ERROR_INTERNO` |
| 14 | `labels.too_many` «máximo 5» en HU03-CA06 | RD-96 y contrato: 3 etiquetas |
| 15 | Fuentes del tema cambian las cajas en Rosa y Enfoque | T3-T6: fuente elegida, holgura de 6 px |
| 16 | Panel de 360 de HE-14 frente a 351×551 | RD-70 y MB-05 |
| 17 | Mensaje de error de campo de F3 (Medium 12 `error`) frente al componente de F0 (Regular 13 `tinta`) | Gana F0 (unificar a F0), con borde 2 px `error` e ícono 16 (E19) |
| 18 | A-37 baja la opacidad del campo y de Enviar sin conexión | E3/MB-05: Deshabilitado sin opacidad; A-37 solo anima el cambio de estado |
| 19 | HU03-CA07 pide un aviso RT-04 para «No pude aplicar los cambios.»; el Figma (2172:2106) lo pone como mensaje de Windi | Un solo destino: mensaje de Windi; Confirmar y Rechazar habilitados |
| 20 | «Escribiendo…» bloquea todo (código antiguo) frente a E5 | Solo Enviar queda deshabilitado; el campo no |
| 21 | Pérdida de conexión a mitad de respuesta: G1d frente a G1c | En `windi_send_message` es G1c; G1d solo al confirmar o rechazar |

## No se construye

- Hover, foco y deshabilitado como nodos dibujados: no están en el Figma; se heredan de los componentes (E3, MB-10, MB-11).
- Cualquier botón sin destino del prototipo más allá de P3/P4.
- Shift+Enter distinto de salto de línea (sin CA; valor de la DUDA).
- Colores de etiqueta fuera del catálogo de 9 (D3).
- Widget Windi (RD-71) y Windi superpuesto (PL-15/PW-15): otras specs.
- Memoria de conversación entre sesiones: solo mientras la app está abierta (ET14).

## Decisiones ya tomadas que se citan

D1 a D17 (en especial D2/C7 colores fijos de Windi, D3/C10 catálogo de colores, D6 anillo de foco, D7 avisos flotantes, D10 un código por causa, D11 sin emoji y con alias, D15 alto del panel); G1a-G1e, G3, G5, G8, G9, G10; E3, E5, E6, E19; P1 a P4; Q1 a Q3; R2, R8, R9, R11; A3; N8, N20; C8; T3-T6; RD-36, RD-57, RD-70, RD-83, RD-96, RD-100, RD-104, RD-106; S15 (propuesta confirmada o rechazada: sin estado visible y con las opciones deshabilitadas, 27-nov); S16 (marca «Descartada», 27-nov).

## Pendiente de Paula

Ninguno; resueltos por S15 y S16 el 27-nov.

## Lecturas de Figma pendientes

- Glifos de Enviar y Cerrar (Botón ícono Normal).
- Relleno del mensaje de Windi (`Windi · Mensaje`; MB-05 dice `superficie`).
- Rosa y Enfoque de las familias 2171, 2172 y Descartada: no comprobados con huella (los de 2173-* de Crear y Saludo y los de Propuesta sí).
- Sin conexión con historial (ET13): dónde cae el aviso en el Figma.
