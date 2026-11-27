# ANIMACIONES: catálogo cerrado y escala única

Revisado 26-nov (UTC-5): hallazgos del revisor aplicados.

Cada valor lleva su origen: **MEDIDO** (sale del Figma, con nodo), **CÓDIGO** (sale del repo, con archivo:línea) o **PROPUESTA** (escala de este documento). Fuentes: `.trabajo/figma/F0` a `F8` y `.trabajo/figma/huellas/`, `docs/implementacion/CONSISTENCIA.md` (D5, D6, D7, D15, P6 a P9, P14), `docs/rediseno.md` (RD-63, RD-103, RD-104) y `apps/desktop/src/ui/tema/tokens.css`. Regla de calidad de Paula: nada brusco, todo fluido. «Animaciones de resalte en toda la aplicación» quedó fuera de alcance (ver §6, I-08): aquí no se inventa ninguna.

## §1. Lo que el Figma ya plantea

El Figma casi no define movimiento: las únicas transiciones con duración son `DISSOLVE` 0,15 s y `SMART_ANIMATE` 0,2 s, ambas `EASE_OUT`. Todo lo demás es «sin transición» (`transition` nulo) o no se leyó. F0 no llamó a `get_motion_context` (F0:10); F2a no leyó transición (F2a:129), F2b sí.

**Recuento (F0 a F8).** Líneas de los `.md` que nombran la transición: `DISSOLVE` 38 (F0 5, F1 8, F2b 19, F4a 4, F5 1, F6 1) y `SMART_ANIMATE` 3 (F4a 2, F4b 1); F2a, F3, F7 y F8 no traen ninguna. En `huellas/`: 19 archivos con `DISSOLVE` y 9 con `SMART_ANIMATE` (todos 0,2 s `EASE_OUT`: 203-9957, 204-622, 204-704, 204-916, 204-1139, 217-17802, 217-17874, 223-15783, 223-15912). De los 19 `DISSOLVE`, 12 codifican 0,15 s y 7 codifican `DISSOLVE,0.2` (2249-1648, 2249-2560, 2249-3024, 2249-3254, 2249-3502, 2249-3843, 2251-9100): es el redondeo de 0,15 a 0,2 de la exportación; **se usa 0,15 de los `.md`**.

| # | Nodo(s) | Disparador | Transición | Duración | Curva | Fuente |
|---|---|---|---|---|---|---|
| F-1 | Mensaje emergente: Visible → Oculto; Cerrar → Oculto. Éxito 217:17637 (Oculto) y 217:17631 (En pausa); Información 217:17651; Advertencia 217:17665; Error 217:17679 | `AFTER_TIMEOUT` 4 s (Éxito, Información) o 6 s (Advertencia, Error); `ON_CLICK` en Cerrar | `DISSOLVE`, `CHANGE_TO` | 0,15 s | `EASE_OUT` | F0:298-302; F5:26, 29, 33; F2a:80; F2b:107-109, 277-279, 744-746, 772-774, 1147-1149; F1:40 |
| F-2 | Mensaje emergente: Visible ↔ En pausa (217:17659, 217:17645, 217:17673) | `MOUSE_ENTER` / `MOUSE_LEAVE` | `DISSOLVE`, `CHANGE_TO` | 0,15 s | `EASE_OUT` | F0:300-301; F2b:108. **F5:33 dice que las instancias de destinos de avisos no traen `MOUSE_LEAVE` («queda En pausa sin regreso»)**: ver §6, I-14 |
| F-3 | Organizar widgets 203:9957/233:22339/204:16838/204:16866 → Arrastrando/Colisión; Redimensionando 217:17874…; Planificador 204-622 (→217:11426), Kanban 204-704 (→217:13829, 217:14042) y 204-1139, Agenda 204-916 (→217:15308) | `ON_DRAG` / `DRAG` | `SMART_ANIMATE` | 0,2 s | `EASE_OUT` | F4a:45-47; F4b:14; huellas 204-622, 204-704, 204-916, 204-1139; CONSISTENCIA P8 |
| F-4 | Colisión 217:17946…, Sin conexión 217:18018…, Widget eliminado 2221:84854…, Personalización más reciente 2221:84930… (avisos) | `AFTER_TIMEOUT` y Cerrar | `DISSOLVE` | 0,15 s | `EASE_OUT` | F4a:48-51 |
| F-5 | Barra lateral (3 temas): Ocultar menú / Ampliar menú, Contraído ↔ Ampliado | `ON_CLICK`, `CHANGE_TO` | instantánea | 0 | — | F0:304; CONSISTENCIA P9 |
| F-6 | Instalador: 84:1050 → 84:1068 → 84:1092 → 84:1112 | `ON_CLICK` y `AFTER_TIMEOUT` 2 s en 84:1092, `NAVIGATE` | **NO MEDIDO** (F7 no leyó el tiempo; CONSISTENCIA P6: «NO MEDIDO (F7: no se leyó)»). F7:46 lo describe como «todas NAVIGATE sin transición», lo que contradice a P6: ver §6, I-13 | — | — | F7:16-18, 46; CONSISTENCIA P6 |
| F-7 | Navegación entre pantallas del Planificador, Calendario, Mes y año, Agenda (`NAVIGATE`), overlays (`OVERLAY`) | `ON_CLICK` | F1:41 mide `NAVIGATE` sin transición (instantáneo); para F2a y F2b CONSISTENCIA P14 dice **NO MEDIDO**, aunque F2b:5 escribe «sin transición = transition nulo» y F2b:402-404 lo repite en overlays: ver §6, I-13 | 0 en F1; sin dato en F2a/F2b | — | F1:41; F2b:5, 89-106, 122-190, 402-404; F3:20, 39; CONSISTENCIA P14 |
| F-8 | Panel lateral de Windi (13 familias, F3): reacciones `SWAP` y `CLOSE` | `ON_CLICK` | sin transición (F3:39: «Sin transición» vale para todas las reacciones) | 0 | — | F3:20, 39 |
| F-9 | Ojo de contraseña (174:3, 174:4) | `ON_CLICK`, `CONDITIONAL` | no es transición | — | — | F1:133 |
| F-10 | Estados dibujados sin tiempo: Botón y Campo «Puntero encima», «Foco»; Windi botón flotante «Hover» (2004:334; es un **nombre emergente «Windi»**, F0:224); Interruptor «Interacción»; Cargando 217:10802 (5 barras `linea` de 16, anchos 324/300/276/252/228); Reportes · Cargando 217:16400; Arrastre 217:11426 (línea de inserción 518×3); 217:13829/217:14042 (línea 239×3); indicador Sincronizando / Sin conexión / Error (F5:23-25, «sin ícono ni indicador») | — | — | **sin dato** | **sin dato** | F0:204-224, 331; F2a:67, 71, 92; F2b:27; F5:20, 23-25 |

Lo que el Figma **no** tiene: duraciones de hover y foco, esqueleto con movimiento, animación de ojos de Windi (solo texto «Escribiendo…», F3:45), progreso animado del instalador («Progreso fijo, sin animación», F7:18), entrada del mensaje (solo la salida está medida) y animación del indicador de sincronización (solo texto).

## §2. Lo que ya hace el código

Hallazgo mayor: **ninguna regla `transition` en todo `apps/desktop/src`** (búsqueda en `.css`, `.tsx`, `.ts`; sin resultados). No existen tokens `--dur-*` ni `--ease-*`. Todo hover, foco y cambio de estado salta de golpe. Solo hay tres `@keyframes` y los tres tienen `prefers-reduced-motion`. `--dur-largo` no lo usa nada y se elimina de la escala. No hay `scroll-behavior` en ningún CSS.

| Archivo:línea | Qué anima | Valores | Estado |
|---|---|---|---|
| `ui/tema/tokens.css:374`, `:418-427`, `:429-433` | `.wg-resultado` entra: `opacity` 0→1 y `translateY(12px)`→0, con `animation` | 200 ms `ease-out` (RD-63) | Propiedades y duración correctas; es `@keyframes` y se pasa a `transition` (regla 8). No hay salida: el mensaje desaparece de golpe |
| `ui/tema/tokens.css:346-353` | Contenedor `.wg-resultados` | `position: fixed; right: 16px; bottom: 72px` | Es la posición vigente de RD-63 (esquina inferior derecha). D7 propone otra (§6, I-01) |
| `ui/tema/tokens.css:957`, `:957-968` | `.wg-cargando` gira `rotate(360deg)` | 1 s `linear` infinito | OK; con reduced-motion queda quieto (ver §8) |
| `ui/tema/tokens.css:1335-1340`, `:1347-1351` | `.wg-ojos-de-windi--parpadeando .wg-ojos-de-windi__ojo`: `scaleY(1)`↔`scaleY(.1)` al 90 % | 1,2 s `ease-in-out` infinito (RD-70) | OK; lazo (§3) |
| `ui/tema/tokens.css:234-262` | Interruptor: la perilla cambia `left` | sin transición | Salta; cuando se anime pasa a `transform: translateX` (no animar `left`) |
| `ui/tema/tokens.css:85`, `:130`, `:148-153`, `:197`, `:313-314`, `:412-413`, `:468`, `:574`, `:817-818`, `:1280`, `:1401-1404`, `:1578`, `:1630`; `ventana_principal/marco.css:196`, `:256`, `:524`, `:584`; `screens/kanban/kanban.css:85`, `:114` | `:hover` y `:focus-visible` de botón, campo, interruptor, ciudad, titular, botón ícono, miga, enlace, opciones de menú, cerrar, barra lateral, botón de Windi y columna/tarjeta del Kanban | sin transición, cambio instantáneo de `background`, `color`, `border`, `outline` | Contradice la regla 1. Ninguno usa `transition: all`; no falta reduced-motion porque no hay movimiento aún |
| `ui/tema/tokens.css:262-272` (`.wg-fondo-emergente`), `:273-287` (`.wg-emergente`) | Velo y ventana emergente | sin animación | Aparecen y desaparecen de golpe (A-01, A-02). Cada ventana dibuja su propio velo (`ui/VentanaEmergente/VentanaEmergente.tsx:151`; `Confirmacion` renderiza otra `VentanaEmergente`, `ui/Confirmacion/Confirmacion.tsx:34`) |
| `ui/tema/tokens.css:779-800` (`.wg-menu-acciones__lista`) | Menú ⋮ | sin animación | A-03, A-04 |
| `ui/Selector/Selector.tsx:53` | `<select>` nativo | — | **No animable** (lo pinta el sistema) |
| `ui/tema/tokens.css:728-736` | `.wg-tarjeta--arrastrada` (sombra, z-index) y `--destino` (`outline`) | sin transición | A-17 |
| `screens/kanban/Kanban.tsx:131-143`, `:232-238` | Posición de la tarjeta y columna mientras se arrastran | `transform: translate(x, y)` en línea (dnd-kit), sin transición | Sigue al puntero. Falta el asentamiento (A-18) |
| `edicion/Edicion.tsx:104-125`, `:237` | El arrastre real envía `layout_edit_move` / `layout_edit_resize` al Núcleo y el widget se pinta con `position: absolute` y `left/top/width/height` (`aEscala(...)`) | sin transición | Sigue al Núcleo; si se animara ese cambio se animarían `left/top`. El asentamiento (A-14, A-15) va con `transform` (FLIP) |
| `edicion/Edicion.tsx:100` | Teclado en la edición | solo Escape | No hay mover ni redimensionar por teclado: no hay animación de teclado que describir |
| `ui/tema/tokens.css:1001-1010` | Tirador `.wg-edicion__esquina` | sin transición | Sin animación necesaria |
| `ui/NombreEmergente/NombreEmergente.tsx:12`, `:133`, `:150` | Nombre emergente aparece tras `RETRASO_DEL_NOMBRE_MS = 400` con puntero, sin retraso con foco (`matches(':focus-visible')`) | retraso 400 ms; sin fundido | Retraso es CÓDIGO; falta el fundido (A-30) |
| `ventana_principal/PanelDeWindi.tsx:33-37`, `:66`; `ventana_principal/marco.css:533-552` | Panel de Windi: se monta al abrir la primera vez y **queda montado**; se oculta con el atributo `hidden` (`display: none`); 360 × 100vh, `position: fixed`, `right: 0`, `z-index: 900` | sin animación | A-10, A-11. `hidden` impide animar |
| `ventana_principal/marco.css:507`, `:524`, `:527-528` | Botón flotante de Windi `.wg-windi-flotante` (40×40; Figma 48×48), envuelto en `NombreEmergente texto="Windi"` (`PanelDeWindi.tsx:56`) | hover solo cambia `background` | A-23 |
| `ventana_principal/IndicadorSincronizacion.tsx:10-15` | Textos «Sincronizado», «Sincronizando…», «Sin conexión», «Error de sincronización. Reintentaremos automáticamente.» | sin animación | A-36 |
| `ventana_principal/bloquearZoom.ts:17`; `screens/windi/Windi.tsx:68`; `screens/agenda/Agenda.tsx:150` | Único manejador `wheel` (solo con Ctrl, bloquea el zoom); `scrollTop = scrollHeight` en la conversación; `scrollIntoView` en la agenda | instantáneos | A-38 (inercia natural) |
| `apps/landing/src/estilos.css:37`, `:224`, `:232`, `:558` | Landing: `transform` 220 ms y 80 ms con `--curva: cubic-bezier(0.2, 0.8, 0.2, 1)`; 420 ms | `.con-movimiento` gobierna reduced-motion | Fuera de alcance (landing, CD-01); su curva sirve de referencia para `--ease-estandar`. El 420 ms excedería el tope de §3 |

## §3. Escala única

El Figma usa 0,15 s (`DISSOLVE`: F-1, F-2, F-4; recuento en §1) y 0,2 s (`SMART_ANIMATE`: F-3, y el RD-63 del código). La escala se ancla en esos dos valores.

**Duraciones (tokens)**

| Token | Valor | Origen | Criterio: tamaño del cambio |
|---|---|---|---|
| `--dur-instante` | 100 ms | PROPUESTA | Respuesta al pulsar y al soltar; anillo de foco; salida del más corto; fundido con reduced-motion |
| `--dur-corto` | 150 ms | MEDIDO (0,15 s, F-1, F-2, F-4) | Hover, fundido de contenido, aviso que sale, menú abre, ventana que sale |
| `--dur-medio` | 200 ms | MEDIDO (0,2 s, F-3) y CÓDIGO (`tokens.css:374`) | Algo que entra o se mueve unos píxeles: aviso, ventana emergente, panel, asentamiento al soltar |

No hay `--dur-largo`: ningún caso lo necesita (el panel de Windi usa `--dur-medio`, A-10; el progreso del instalador también, A-35).

- **Tope: 400 ms = duración + retraso** de una transición o animación de una sola vez. Es el número que comprueba la prueba global. El caso más largo es el esqueleto: retraso 200 + 150 = 350.
- **Lazos infinitos** (giro, parpadeo, ojos de Windi) son la única excepción al tope; usan los tokens `--dur-giro: 1000ms` y `--dur-parpadeo: 1200ms`, su ciclo máximo es **1500 ms** y quedan en una lista cerrada (A-22, A-31).
- **Salidas:** misma curva que la entrada y **un escalón más corta**: medio 200 → corto 150, corto 150 → instante 100, instante 100 → 100. (Coincide con el Figma: el aviso sale en 0,15 s y entra en 0,2 s.)

**Curvas (tokens)**

| Token | Valor | Origen | Uso |
|---|---|---|---|
| `--ease-salida` | `cubic-bezier(0, 0, 0.58, 1)` | MEDIDO (`EASE_OUT` del Figma equivale a CSS `ease-out`) | Todo lo que aparece, desaparece y todo cambio de estado de un control; asentamientos medidos (A-14, A-15, A-18, A-19) |
| `--ease-estandar` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | CÓDIGO (`apps/landing/src/estilos.css:37`) | Algo que se mueve entre dos posiciones ya visibles sin curva en el Figma: perilla del interruptor, progreso |
| `--ease-lineal` | `linear` | CÓDIGO (`tokens.css:957`) | Solo el giro de carga |
| `--ease-parpadeo` | `cubic-bezier(0.42, 0, 0.58, 1)` (el `ease-in-out` de hoy, `tokens.css:1335`) | CÓDIGO | Solo el parpadeo de los ojos |

**Distancia de movimiento (token):** `--mov-corto: 8px` (menús, ventana, mensaje de la conversación), `--mov-aviso: 12px` (RD-63), `--mov-panel: 24px`. Con `prefers-reduced-motion: reduce` los tres pasan a `0px` (regla 10).

## §4. Reglas

1. **Todo control interactivo** (botón, botón ícono, campo, interruptor, enlace, miga, opción de menú, casilla, tarjeta, día del calendario, cerrar) transiciona `background-color`, `border-color`, `color`, `box-shadow` y `outline-color` en `--dur-corto` con `--ease-salida`. Nunca instantáneo. Se enumeran las propiedades; **`transition: all` está prohibido**.
2. **Pulsar y soltar:** la reacción al pulsar empieza en ≤ 100 ms (`--dur-instante`); soltar vuelve en `--dur-corto`. Pulsado de Principal: la sombra desplazada vuelve a 0 (CONSISTENCIA E1, PROPUESTA).
3. **Hover y foco son distintos:** el resalte es `:hover` (solo ratón) en `--dur-corto`; el anillo de 2 px `tinta`, radio del control + 3 (D6) es `:focus-visible` (solo teclado, igual que decide `NombreEmergente.tsx:150`) y aparece en `--dur-instante`. El anillo existe siempre como `outline: 2px solid transparent` (**nunca `outline: none`**) y se transiciona `outline-color`. Los anillos del código con otro color distinto de `tinta` (`tokens.css:468`, `:574`, `marco.css:527-528`) son asunto de D6, no de este catálogo.
4. **Entradas y salidas** animan solo `transform` y `opacity`. No se animan `width`, `height`, `top`, `left`, `margin` ni `padding`. Si un cambio de tamaño debe notarse, se hace con `transform: scale` o FLIP.
5. **Simetría:** lo que entra sale con la misma curva y un escalón más corto (§3).
6. **Arrastre:** mientras el puntero está pulsado, el elemento sigue al puntero (o al Núcleo, A-13) **sin transición ni retraso**. Al soltar se asienta con `--dur-medio` y `--ease-salida`.
7. **Sin parpadeo de carga:** el esqueleto solo aparece si la carga dura **más de 200 ms** (`--dur-medio`); una vez visible se queda **al menos 300 ms** (PROPUESTA anti-parpadeo); entra con fundido de `--dur-corto`. Si la carga termina antes de 200 ms nunca se pinta y el contenido entra directo con el fundido de A-09.
8. **Una sola regla de método:** entradas, salidas, hover, foco y pulsado se hacen con `transition` (interrumpible: al revertir a mitad se parte del valor actual). `@keyframes` queda **solo para lazos infinitos** (giro de carga, ojos de Windi, parpadeo). Se reescriben con `transition` el aviso que entra (`tokens.css:374`, `:418-427`) y todo lo nuevo. Un elemento en salida que recibe la orden de volver a entrar cancela la salida.
9. **Sin competencia:** una propiedad la anima una sola regla. El arrastre es dueño de `transform` mientras dura; el asentamiento y la sombra no usan el mismo `transform` a la vez (la sombra usa `box-shadow`). Un solo `transition` por elemento con todas sus propiedades enumeradas.
10. **`prefers-reduced-motion: reduce` (decisión única):** un solo bloque `@media (prefers-reduced-motion: reduce)` en `tokens.css` que (a) pone `--mov-corto`, `--mov-aviso` y `--mov-panel` a `0px`; (b) pone `--dur-corto` y `--dur-medio` a 100 ms, de modo que toda transición queda en **fundido de 100 ms**; (c) quita `transform` de la lista de `transition-property` de los FLIP, la perilla y el progreso (saltan) y (d) pone `animation: none` en todos los lazos (giro y parpadeo quedan quietos). Sin excepciones por componente.
11. **Rendimiento:** 60 fps en 1200×800 y 960×600. Se anima `transform` y `opacity`; `will-change` solo durante la animación. No se fuerza relayout durante la animación.
12. **Los tiempos de espera** (4 s, 6 s, retraso de 400 ms del nombre emergente) son lógica, no animación: se cuentan aparte; el fundido de salida empieza **al terminar** la espera.
13. **Salidas con desmontaje** (A-02, A-04, A-06): un hook común, `ui/movimiento/useSalidaAnimada.ts` (nuevo), devuelve `{ montado, estado }`. Entra con el estado base oculto y la clase `--abierta` en el fotograma siguiente; al cerrar quita `--abierta`, pone `--saliendo` y **retiene el montaje hasta `transitionend` o un seguro = duración calculada (`getComputedStyle`) + retraso + 50 ms**. En jsdom no hay `transitionend`: corre el seguro. Con reduced-motion desmonta tras el fundido de 100 ms. Los callbacks (`alSalir`, acción del menú) y la devolución del foco no esperan a la salida; el elemento saliente queda `inert`.

## §5. Catálogo

Selectores y rutas relativas a `apps/desktop/src/`. «Prueba» detalla el archivo en §7. Duración y curva con token. «Salida» = comportamiento al terminar o cerrar.

### Ventana emergente

| Id | Animación | Disparador | Elemento / componente | Propiedades | Duración · curva · retraso | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-01 | Abrir ventana emergente | Montaje de `VentanaEmergente` | `.wg-fondo-emergente` (velo) y `.wg-emergente`; `ui/VentanaEmergente/VentanaEmergente.tsx` | Velo: `opacity` 0→1. Ventana: `opacity` 0→1 y `translateY(var(--mov-corto))`→0 con `transition` (hook, regla 13). El papel con pliegue (D5) entra con la ventana | `--dur-medio` (200 ms) · `--ease-salida` · sin retraso | Ver A-02 | Fundido 100 ms | Sin dato en Figma (overlay `CENTER` sin transición, F3:20, F-7) → escala. Con RD-103 el foco se mueve al montar, sin esperar | P-A01: Vitest, clase `wg-emergente--abierta` tras montar; Playwright, `transition-duration` 200 ms |
| A-02 | Cerrar ventana emergente | «×», Esc, clic en velo, Cancelar, Guardar | Mismos | `opacity` 1→0 y `translateY(0→var(--mov-corto))` | `--dur-corto` (150 ms) · `--ease-salida` | Se desmonta con el hook (regla 13); el foco vuelve al disparador al empezar la salida; mientras sale, `inert`. Si se reabre a mitad, cancela la salida | Fundido 100 ms | Escala | P-A02: Vitest con tiempo simulado, `wg-emergente--saliendo` y desmontaje a +200 ms (150 + 50); Playwright, 150 ms |
| A-02b | Ventanas apiladas (confirmación de descarte sobre formulario, RD-106) | Abrir `Confirmacion` desde una ventana | Cada ventana dibuja su velo (`VentanaEmergente.tsx:151`, `Confirmacion.tsx:34`); clase propuesta `wg-fondo-emergente--apilado` | **PROPUESTA:** la ventana apilada encima pinta su velo con fondo transparente (el de abajo se queda en `opacity: 1`); la de arriba anima como A-01; la de abajo no se mueve | Igual que A-01 | Al cerrar solo sale la de arriba | Igual | PROPUESTA; hoy la capa del velo se comenta «una sola capa» (`tokens.css:262`) | P-A01 con dos ventanas: el velo del fondo mantiene `opacity: 1` y el de la superior es transparente |

### Menú

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-03 | Abrir menú ⋮ y selector de fecha flotante | Activar el botón | `.wg-menu-acciones__lista` (`ui/MenuDeAcciones/MenuDeAcciones.tsx`), `.wg-selector-fecha__flotante` (`ui/SelectorFecha/SelectorFecha.tsx:94`). **`ui/Selector` no entra: es un `<select>` nativo (`Selector.tsx:53`), no animable** | `opacity` 0→1 y `translateY(calc(var(--mov-corto) * -1))`→0, `transform-origin` en el borde del botón | `--dur-corto` · `--ease-salida` | Ver A-04 | Fundido 100 ms | Escala (sin dato en Figma) | P-A03: Playwright, `transition-property` = `opacity, transform` y 150 ms |
| A-04 | Cerrar menú | Elegir opción, Esc, clic fuera (`docs/rediseno_pendientes_prototipos.md:654`) | Mismos | Inversa de A-03 | `--dur-instante` · `--ease-salida` | Se desmonta con el hook; la opción elegida ejecuta su acción sin esperar | Igual | Escala | P-A04: Vitest, la acción se llama antes de que termine la salida |
| A-05b | Opción de menú, hover y foco | `:hover`, `:focus-visible` | `.wg-menu-acciones__opcion` (`tokens.css:817-818`), `.wg-menu__opcion` | `background-color`, `color` | `--dur-corto` · `--ease-salida` | — | Fundido 100 ms | Hover `superficie_baja` MEDIDO (F0:207); tiempo PROPUESTA | Tabla de selectores, §7 |

### Mensaje (aviso)

**Posición.** La vigente es RD-63: cola en la esquina inferior derecha, **máximo 3 visibles** (el más nuevo arriba), 4 s éxito e información, 6 s advertencia (el error no se cierra solo, RD-104), pausa al pasar el mouse, **sin cambiar de posición (RD-104: «No cambia posición (RD-63)»)**. CONSISTENCIA D7 propone otra: franja superior (y=4, alto 42, radio 21, **un solo aviso visible**, el error se queda y el nuevo va debajo en y=50). **D7 es PROPUESTA pendiente de confirmar** (CONSISTENCIA ~245: «PROPUESTA, confirmar en fase 5»). Cada fila de aviso describe la animación **vigente** y su **variante si se aprueba D7**; el token `--dir-aviso` vale 1 (desde abajo) y pasa a −1 (desde arriba) si se aprueba. El choque entre D7 y RD-63 está en §8.

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva · retraso | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-05 | Aviso entra | Mostrar un resultado (`useMensajeDeResultado`) | `.wg-resultado` dentro de `.wg-resultados`; `ui/MensajeResultado/MensajeResultado.tsx` | `opacity` 0→1 y `translateY(calc(var(--mov-aviso) * var(--dir-aviso)))`→0 con `transition`: **vigente RD-63, entra deslizándose 12 px desde abajo**; **variante D7, desde arriba (−12 px)** | `--dur-medio` (200 ms) · `--ease-salida` | Ver A-06 | Fundido 100 ms, sin movimiento (RD-63) | CÓDIGO (`tokens.css:374`, `:418-427`, 200 ms, 12 px, ya sin movimiento con reduced-motion `:429-433`); la dirección superior es PROPUESTA (D7) | P-A05: Playwright, `transition-property` = `opacity, transform` y 200 ms (no se comprueba `top: 4px`, que solo existiría con D7); Vitest: el mensaje nuevo no recibe foco (RD-104) |
| A-06 | Aviso sale | Pasan 4 s (Éxito, Información) o 6 s (Advertencia); clic en «×»; reemplazo (solo en D7). El Error no sale solo (RD-104; el Figma lo cierra a 6 s, 217:17679: §6, I-12) | Mismos | `opacity` 1→0 (solo fundido) | **0,15 s** (`--dur-corto`) · `--ease-salida` | Se desmonta con el hook (regla 13) a +200 ms (150 + 50); el aviso saliente sigue ocupando su lugar mientras se desvanece | Fundido 100 ms | MEDIDO (F-1, F-4: 217:17651, 217:17665; Error 217:17679 sólo en el Figma) | P-A06: Vitest con tiempo simulado: salida a 4 000 ms (Éxito, Información), 6 000 (Advertencia), nunca (Error); clase `wg-resultado--saliendo` y desmontaje a +200; Playwright, 150 ms |
| A-06b | Los demás avisos se reacomodan (pila de hasta 3, RD-63) | Sale un aviso o entra uno nuevo | Los `.wg-resultado` restantes | `transform: translateY` (FLIP: se mide la posición antes y después del desmontaje, nunca se anima `top` ni `bottom`) | `--dur-corto` · `--ease-salida` | — | Saltan a su sitio | PROPUESTA (el Figma no dibuja la pila) | P-A06b: Playwright, con 3 avisos y salida del primero, `transform` intermedio ≠ `none` y final `none` a +200 ms |
| A-07 | Aviso en pausa | Ratón entra, o foco dentro del mensaje; se reanuda al salir | `.wg-resultado` | Ninguna propiedad visible: se detiene el temporizador. **La pausa por ratón y su reanudación vienen de RD-63 y RD-104, no del Figma**: F0:300-301 dibuja Visible ↔ En pausa y F5:33 dice que las instancias no tienen `MOUSE_LEAVE` (§6, I-14); la pausa por foco es RD-104 | `--dur-corto` si se confirma un cambio visible (§8) | Al reanudar, la cuenta continúa con el tiempo restante | Igual | Figma F-2 (nodos 217:17659, 217:17645, 217:17673) para la variante; la cuenta y el regreso son RD-63/RD-104 | P-A07: ver §7 |
| A-05c | Botón «×» del aviso, hover y foco | `:hover`, `:focus-visible` | `.wg-resultado__cerrar` (`tokens.css:398`, `:412-413`) | `background-color`, `color` | `--dur-corto` | — | Fundido 100 ms | F-10 / CÓDIGO | Tabla de selectores, §7 |

**Variante D7 (solo si se aprueba):** el contenedor pasa a la franja superior, un solo aviso visible, entra con `translateY(−12px)`→0 y el aviso viejo sale con `position: absolute` en la misma franja (no compite por el mismo `transform`); un Error se queda y el nuevo va debajo (y=50). A-06b no aplica con un solo visible.

### Cambio de pantalla

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-08 | Entra la pantalla nueva | Cambio de pantalla en la ventana principal (menú, migas, «Regresar») | `.wg-ventana-principal__pantalla` (`tokens.css:534`); `ui/MigaDePan`, rutas en `screens/*` | Solo `opacity` 0→1 del contenido; sin movimiento; marco, menú y cabecera no se animan | `--dur-corto` · `--ease-salida`; sin salida de la pantalla anterior | La anterior se desmonta de inmediato | Fundido 100 ms | **Figma dice «sin transición» en F1:41 (medido) y P14 «NO MEDIDO» en F2a/F2b** (F-7); decisión por la regla de calidad de Paula, §6 I-02 | P-A08: Playwright, `opacity` creciente y a +150 ms vale 1; sin `transform` |
| A-09 | Entra el contenido tras cargar | Los datos llegan | Contenido de la pantalla | `opacity` 0→1 | `--dur-corto` | — | Fundido 100 ms | Escala | P-A32 (§7) |

### Panel lateral

«Panel lateral» agrupa dos cosas: la barra lateral de navegación (A-12) y el panel lateral de Windi (A-10, A-11).

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-10 | Abrir panel de Windi | Botón flotante o «Windi» del menú (HE-14, RD-70) | `.wg-panel-windi` en `ventana_principal/PanelDeWindi.tsx:66` (360 × 100vh, `marco.css:533`) | **PROPUESTA:** el panel **sigue montado** y el atributo `hidden` (`PanelDeWindi.tsx:66`, `marco.css:550-552`) se reemplaza por una clase de estado. Base: `opacity: 0`, `transform: translateX(var(--mov-panel))`, `visibility: hidden`. Abierto: `opacity: 1`, `transform: none`, `visibility: visible`. `visibility` transiciona con retraso igual a la duración de salida, así que el panel cerrado sale del orden de tabulación y del árbol de accesibilidad | `--dur-medio` (200 ms) · `--ease-salida` | Ver A-11 | Fundido 100 ms | Escala; Figma: sin transición (F-8). No se anima `width` | P-A10: Playwright, `transition-property` = `opacity, transform, visibility` y 200 ms a 1200×800 y a 960×600; el panel no cambia `width` |
| A-11 | Cerrar panel de Windi | Botón cerrar (`.wg-panel-windi__cerrar`), Esc | Mismo | Inversa de A-10; al terminar la salida se pone `inert` y `visibility: hidden` (con retraso = duración, `visibility 0s linear var(--dur-corto)`) | `--dur-corto` (150 ms) | No se desmonta; el foco vuelve al disparador al empezar la salida | Fundido 100 ms | Escala; el `CLOSE` del Figma es instantáneo (F3:39) | P-A11: Vitest, a +150 ms el panel tiene `inert`; Playwright, `visibility: hidden` a +200 ms y no recibe Tab |
| A-12 | Barra lateral amplía o contrae | «Ocultar menú» / «Ampliar menú» | La rejilla `.wg-ventana-principal` (`marco.css:55`, contraído `:63-64`) y `.wg-menu__opcion`; `ui/MenuPrincipal/` | **Figma: instantánea** (F0:304, F-5, P9): el ancho cambia sin transición (regla 4). **Pregunta a Paula en §8:** ¿fundido corto de las etiquetas por la regla «nada brusco»? Mientras no responda, se respeta el Figma | 0 | — | Igual | MEDIDO instantánea (F-5, P9) | P-A12: Playwright, la rejilla cambia en un solo fotograma |

### Arrastrar y soltar

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-13 | Arrastre sigue al puntero | Mover con el botón pulsado | `.wg-edicion__widget` (`edicion/Edicion.tsx:237`), `.wg-tarjeta--arrastrada` (`screens/kanban/Kanban.tsx:131-143`) | **Requisito: sin transición mientras se arrastra.** En edición el arrastre real envía `layout_edit_move` al Núcleo y el widget se pinta con `left/top` (`Edicion.tsx:104-125`): debe seguir al Núcleo sin retraso. Clase propuesta `wg-edicion__widget--arrastrando` con `transition: none` | 0 ms de retraso | Ver A-14 | Igual | CÓDIGO; el `SMART_ANIMATE` 0,2 s del Figma (F-3) es el paso entre estados del prototipo, no un retraso del arrastre real (§6 I-03) | P-A13: Playwright, con la clase de arrastre `transition-duration` calculado = 0 s y el widget en el fotograma siguiente a cada `layout_edit_move` |
| A-14 | Asentamiento al soltar (organizar widgets) | Soltar el widget | `.wg-edicion__widget` | `transform` desde la última posición pintada a la final del Núcleo (FLIP, solo si el rectángulo final difiere); `left/top` cambian sin transición | **0,2 s** (`--dur-medio`) · `--ease-salida` | Al terminar `transform: none` | Salta | **MEDIDO (interpretación: el `ON_DRAG` del Figma es el inicio del arrastre, F4a:45-47)**: 203:9957, 217:17802, 217:17874, 223:15783; `SMART_ANIMATE` 0,2 s `EASE_OUT` | P-A14: Playwright, tras soltar `transition-duration: 200ms`; a +250 ms la posición es la final |
| A-15 | Asentamiento al redimensionar | Soltar el tirador (22×22) con el puntero (no hay teclado, `Edicion.tsx:100`) | `.wg-edicion__esquina`, `.wg-edicion__widget` | `transform: scale` con FLIP; el tamaño real cambia al final | 0,2 s · `--ease-salida` | Igual | Salta | MEDIDO (F-3: 217:17874 `SMART_ANIMATE` 0,2 s; F4a:47) | P-A15: como P-A14 sobre `scale` |
| A-16 | Choque entre widgets | Soltar o arrastrar sobre otro | `.wg-edicion__widget--choque` (`tokens.css:997-1000`) | `border-color` a `--wg-estado-vencida`; `border-style` cambia al instante (no animable) | `--dur-corto` | Al resolverse vuelve | Fundido 100 ms | MEDIDO (F-4: 217:17946, DISSOLVE 0,15 s, aviso «Los widgets se superponen.»); borde PROPUESTA | P-A16: `transition-duration` 150 ms en `border-color` |

### Kanban

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-17 | Tarjeta o columna se levanta y destino se marca | Empezar a arrastrar; pasar sobre una columna o tarjeta destino | `.wg-tarjeta--arrastrada` (`box-shadow`), `.wg-tarjeta--destino`, `.wg-columna--destino` (`tokens.css:728-736`) | `box-shadow` de 0 a la sombra; `outline-color` de transparente al color de destino. El `outline: 2px solid transparent` existe siempre (regla 3, nunca `outline: none`) | `--dur-corto` (sombra) y `--dur-instante` (outline) · `--ease-salida` | Vuelve a transparente | Fundido 100 ms | CÓDIGO (`tokens.css:728-736`); tiempos PROPUESTA | P-A17: Playwright, `transition-property` incluye `box-shadow` y `outline-color` y no `transform` |
| A-18 | Tarjeta o columna se asienta al soltar | Soltar en su destino | `.wg-kanban__tarjeta`, columna; `screens/kanban/Kanban.tsx` | `transform` de la posición suelta a la celda final (dnd-kit o FLIP); la tarjeta vecina de la columna destino se abre con `transform` | **0,2 s** (`--dur-medio`) · `--ease-salida` | Al terminar `transform: none` | Salta | **MEDIDO** (`SMART_ANIMATE` 0,2 s `EASE_OUT`: huellas 204-704, 204-1139 → 217:13829, 217:14042; Kanban «Columna Por hacer» y «Detalle de tarjeta») | P-A18: Playwright, `transition-duration` 200 ms y `transform` final `none` |
| A-19 | Línea de inserción | Pasar entre tarjetas o columnas al arrastrar | Línea 518×3 (217:11426, Planificador 204-622; Agenda 217:15308, huella 204-916) y 239×3 (217:13829); clase propuesta `.wg-kanban__insercion` | `opacity` 0→1 y desplazamiento por `transform: translateY` entre posiciones (no `top`) | **0,2 s** · `--ease-salida` | Desaparece al soltar | Salta | **MEDIDO** (`SMART_ANIMATE` 0,2 s `EASE_OUT`: huellas 204-622, 204-704, 204-916; F2a:71, :92; F2b:19, :232), con la misma curva y tiempo que A-14 | P-A19: `e2e/ANIMACIONES.spec.ts` (nuevo): `.wg-kanban__insercion` tiene `transition-property` `opacity, transform` (sin `top`), 0,2 s, y su `top` calculado no cambia en ≥ 2 fotogramas intermedios mientras su `transform` sí |

### Calendario

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-20 | Día resalta al pasar el puntero | `:hover` en la celda (`docs/rediseno_pendientes_prototipos.md:651`: «un poco más oscuro al pasar el puntero») | `.wg-calendario__celda` (`tokens.css:1093`, solo `cursor: pointer`), `.wg-calendario-pantalla .wg-calendario td.wg-calendario__celda` (`screens/calendar/calendario.css:71`), `.wg-calendario-widget td` (`tokens.css:634`) | `background-color`. **No existe hoy ningún `:hover` de celda: se crea** | `--dur-corto` · `--ease-salida` | Vuelve al salir | Fundido 100 ms | Decisión de Paula (pendientes:651); tiempo PROPUESTA | Tabla de selectores, §7 |
| A-21 | Cambio de mes o de semana | Flechas de `NavegacionDeFecha`, «Hoy», `SelectorFecha` | `.wg-calendario`, `.wg-calendario-semana`, `.wg-calendario-widget` | **Figma: sin transición** (F-7). Se respeta el Figma: sin animación. Pregunta en §8 | 0 | — | Igual | F-7 | P-A21: Playwright, ningún `transition` en la rejilla |
| A-22b | Hoy (día actual) | — | `.wg-calendario__dia--hoy` (`tokens.css:1085`) | Sin animación (estado estático) | — | — | — | CÓDIGO | — |

### Windi y sus ojos

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-22 | Parpadeo de los ojos | Windi responde (`parpadeando` en `OjosDeWindi`) | `.wg-ojos-de-windi--parpadeando .wg-ojos-de-windi__ojo`; `ui/OjosDeWindi/OjosDeWindi.tsx:14` | `@keyframes` (lazo): `transform: scaleY(1)`→`scaleY(.1)` al 90 % → 1 | `--dur-parpadeo` (1200 ms) · `--ease-parpadeo` · infinito | **Termina el ciclo abierto:** al quitar `parpadeando` se mantiene una clase de cierre hasta `animationiteration` y recién entonces se quita; con reduced-motion se quita de inmediato | `animation: none`, ojos abiertos | CÓDIGO (`tokens.css:1335-1351`, RD-70); Figma solo dibuja «Escribiendo…» (F3:45) | P-A22: Vitest (`ui/OjosDeWindi/OjosDeWindi.test.tsx`, nuevo): al pasar `parpadeando` a falso la clase de ciclo sigue hasta `fireEvent.animationIteration` y luego se quita; Playwright: `animation-duration: 1.2s`, con `reducedMotion: 'reduce'` `animation-name: none` |
| A-23 | Botón flotante de Windi, hover y foco | `:hover`, `:focus-visible` | `.wg-windi-flotante` (`marco.css:507`, hover `:524` solo `background`, foco `:527-528`) | `background-color` | `--dur-corto` | — | Fundido 100 ms | **El Figma dibuja el hover como nombre emergente «Windi» (F0:224)**; el código ya lo envuelve en `NombreEmergente` (`PanelDeWindi.tsx:56`) y su fundido es A-30. El cambio de `background` del código es PROPUESTA. El botón mide 40 px en código y 48 en Figma (asunto de CONSISTENCIA, no de este catálogo) | Tabla de selectores, §7 |
| A-24 | Mensaje nuevo en la conversación | Llega o se envía un mensaje | `.wg-windi__mensaje` (`tokens.css:1047`, `screens/windi/windi.css:23`) | `opacity` 0→1 y `translateY(var(--mov-corto))`→0. El desplazamiento al final del hilo (`Windi.tsx:68`) sigue siendo el actual, sin condiciones ni animación | `--dur-corto` | — | Fundido 100 ms | Escala; Figma: sin transición (F3) | P-A24: Playwright, 150 ms en `opacity` y `transform` |
| A-37 | Windi «Sin conexión» | Se pierde la conexión con el Núcleo | Campo de texto (opacidad 0,5) y botón de envío (0,4) en el panel | `opacity` del campo y del envío, con `transition` | `--dur-corto` · `--ease-salida` | Vuelve a 1 al reconectar | Fundido 100 ms | Estado MEDIDO (F5:20); tiempo PROPUESTA | P-A37: Playwright, `transition-property` incluye `opacity` y 150 ms |

### Hover y foco

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-25 | Hover, pulsado y soltado de controles | `:hover` (ratón), `:active` | `.wg-boton` (`tokens.css:85`), `.wg-boton.wg-boton--icono:hover` (`:130`), `.wg-ciudad__opcion:hover` (`:197`), `.wg-widget-noticias__titular:hover` (`:1280`), `.wg-icono-boton:hover` (`:1401-1404`), `.wg-boton-titulo:hover` (`:1578`), `.wg-columna-fantasma:hover` y `.wg-kanban__tarjeta:hover` (`kanban.css:85`, `:114`). **`.wg-chip` (`:1406`) no tiene hover: no entra** | `background-color`, `border-color`, `color`, `box-shadow` | Hover y soltar `--dur-corto`; pulsar `--dur-instante` · `--ease-salida` | Vuelve con `--dur-corto` | Fundido 100 ms | Estados MEDIDO (F0:204-224: «Puntero encima»), sin tiempo en Figma; hover `superficie_baja` E1 | Tabla de selectores, §7 |
| A-26 | Anillo de foco aparece | `:focus-visible` (teclado) | Todo control (D6: 2 px `tinta`, radio + 3); `tokens.css:148-153`, `marco.css:292-298`, `:417` | `outline-color` (el `outline: 2px solid transparent` existe siempre, regla 3) | `--dur-instante` · `--ease-salida` | Desaparece con `--dur-instante` | Igual (no es movimiento) | MEDIDO el anillo (D6, E1); tiempo PROPUESTA | P-A26: Playwright, tras Tab `outline-color` = `tinta` y `transition-duration` = 100 ms; antes de Tab `outline-style` ≠ `none` |
| A-27 | Campo: hover, foco, error | `:hover` (borde `tinta`, F0:331), foco, `[aria-invalid]` | `.wg-campo__entrada` (`tokens.css:201`), `[aria-invalid]` (`:210-213`), `.wg-campo__mensaje` (`:214`) | `border-color`, `outline-color`; el ancho del borde al pasar a error cambia de golpe (`border-width` no se anima, regla 4); el mensaje entra con `opacity`. **El `:hover` del campo no existe hoy: se crea** | `--dur-corto`; mensaje `--dur-medio` | — | Fundido 100 ms | MEDIDO el estado (F0:331); tiempos PROPUESTA | Tabla de selectores, §7 |
| A-28 | Interruptor | Clic o Espacio | `.wg-interruptor` y `::after` (`tokens.css:234-262`) | Perilla: `transform: translateX` (hoy cambia `left`); fondo y borde: color | `--dur-corto` · `--ease-estandar` en la perilla | — | La perilla salta, color a 100 ms | MEDIDO el estado (F0:213); tiempo PROPUESTA | P-A28: Playwright, `transition-property` incluye `transform` y no `left` |
| A-29 | Enlaces, miga y botón «×» de ventana | `:hover`, `:focus-visible` (miga y enlace solo tienen foco hoy) | `.wg-enlace` (`tokens.css:574`), `.wg-miga__nivel` (`:468`), `.wg-emergente__cerrar` (`:313-314`), `.wg-campo__ojo` (`:1630`) | `color`, `background-color`, `outline-color` | `--dur-corto` (hover), `--dur-instante` (foco) | — | Fundido 100 ms | Escala | Tabla de selectores, §7 |
| A-30 | Nombre emergente (tooltip) | Puntero (tras 400 ms) o foco (sin retraso) | `.wg-nombre-emergente` (`tokens.css:742`); `ui/NombreEmergente/NombreEmergente.tsx` | `opacity` 0→1 | `--dur-instante`; **retraso 400 ms con puntero y 0 con foco** | Se oculta al salir, Esc o seleccionar | Fundido 100 ms | CÓDIGO el retraso (`NombreEmergente.tsx:12`); fundido PROPUESTA | P-A30: Vitest con tiempo simulado, 400 ms con puntero y 0 con foco (ya probado en `NombreEmergente.test.tsx`); Playwright, 100 ms |

### Carga, vacío y sincronización

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva · retraso | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-31 | Indicador de giro | Cargando una sección | `.wg-cargando` (`screens/reports/Seccion.tsx:23`) | `@keyframes` (lazo): `transform: rotate(360deg)` | `--dur-giro` (1 s) · `--ease-lineal` · infinito | Sin salida propia: lo reemplaza el contenido con A-09 | `animation: none`; el `aria-label="Cargando"` sigue | CÓDIGO (`tokens.css:957-968`) | P-A31: Playwright, `animation-duration: 1s`, `animation-timing-function: linear`; con `reducedMotion` `animation-name: none` |
| A-32 | Esqueleto de carga | La carga supera 200 ms | **Salen del Figma (F2a:67):** 5 barras `linea` de 16 de alto, anchos 324/300/276/252/228, paso vertical 54; radio 6 (F2b:319-320, Reportes · Cargando 217:16400). Clase propuesta `.wg-esqueleto__barra`; `ui/Esqueleto/` (nuevo). Hoy `Seccion.tsx:23` usa un giro y se reemplaza | `opacity` 0→1 con `transition`; sin brillo ni pulso (no hay dato en Figma) | `--dur-corto` · `--ease-salida` · **retraso 200 ms** (duración + retraso = 350, bajo el tope); permanencia mínima 300 ms | Contenido real entra con A-09 | Fundido 100 ms | Forma MEDIDO (F2a:67, 217:10802; F2b:27, 217:16400); **retraso 200 ms y permanencia 300 ms son PROPUESTA anti-parpadeo** | P-A32: Vitest (`ui/Esqueleto/Esqueleto.test.tsx`, nuevo) con tiempo simulado: a 199 ms no existe, a 201 ms sí, y si el dato llega a 350 ms el esqueleto sigue hasta 500 ms |
| A-33 | Estado vacío | Lista sin elementos | `.wg-vacio`; `ui/EstadoVacio/EstadoVacio.tsx` | **Figma 217:10646 «Vacío» sin movimiento (F2a:31): sin animación.** Pregunta en §8 | 0 | — | Igual | F2a:31 | P-A33: Playwright, sin `transition` en `.wg-vacio` |
| A-36 | Indicador de sincronización (Sincronizado, Sincronizando…, Sin conexión, Error de sincronización) | Cambia el estado de sincronización | `ventana_principal/IndicadorSincronizacion.tsx:10-15`; `.wg-indicador-sincronizacion` (`tokens.css:527`) | **El Figma no anima nada** (F5:23-25: «sin ícono ni indicador», solo texto). Escala: fundido de `opacity` del texto al cambiar; sin giro ni pulso | `--dur-corto` · `--ease-salida` | — | Fundido 100 ms | Figma sin animación → escala (PROPUESTA) | P-A36: Playwright, `transition-property` incluye `opacity` y 150 ms |

### Desplazamiento

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-38 | Inercia natural del desplazamiento | Rueda o gesto de desplazamiento | Listas y pantallas | **No aplica:** el desplazamiento es el nativo del sistema, sin `scroll-behavior` ni JS (único `wheel` es `ventana_principal/bloquearZoom.ts:17`, solo con Ctrl) | — | — | — | CÓDIGO | P-A38: Vitest estático, ningún CSS declara `scroll-behavior` y ningún `.ts(x)` fuera de `bloquearZoom.ts` registra `wheel` |

### Instalador

El instalador (CD-02) no vive en `apps/desktop/src`; su código es otra pieza. Las filas valen para esa pieza.

| Id | Animación | Disparador | Elemento | Propiedades | Duración · curva | Salida | Reduced-motion | Origen | Prueba |
|---|---|---|---|---|---|---|---|---|---|
| A-34 | Paso a paso del instalador (Windgets para Windows → Opciones → En curso → Completada) | Descargar, Instalar, `AFTER_TIMEOUT` 2 s en 84:1092, Abrir Windgets | Pantallas 84:1050, 84:1068, 84:1092, 84:1112 (oscuro 84:1080, 84:1102, 84:1120) | **NO MEDIDO** (P6: F7 no leyó la transición). Se aplica la escala: fundido `opacity` de contenido en `--dur-corto`, sin movimiento (contradicción F7:46 en §6, I-13) | `--dur-corto` | — | Fundido 100 ms | CONSISTENCIA P6 (NO MEDIDO); fundido PROPUESTA | P-A34: Vitest, el cambio de paso solo aplica `opacity`; el `AFTER_TIMEOUT` de 2 s es lógica (regla 12) |
| A-35 | Barra de progreso | Avance real de la instalación | `Progreso` sobre `Total` 618×12, radio 6 (F7:18) | `transform: scaleX` con `transform-origin: left` (no `width`) | `--dur-medio` · `--ease-estandar` | Al 100 % se detiene y llega A-34 | `scaleX` sin transición | Figma: «Progreso fijo, sin animación» (F7:18) → escala; la barra `Progreso` de 640 que rebasa `Total` de 618 es un defecto del Figma | P-A35: Vitest, `transform: scaleX(p)`; ninguna regla CSS anima `width` |

## §6. Incoherencias y decisiones

| Id | Incoherencia | Decisión |
|---|---|---|
| I-01 | Avisos: RD-63 (vigente) pone la cola abajo a la derecha, máximo 3 visibles, entra 12 px desde abajo; RD-104 dice «No cambia posición (RD-63)». CONSISTENCIA D7 propone franja superior con un solo aviso visible | **D7 es PROPUESTA pendiente de confirmar** (CONSISTENCIA ~245, Pendiente de Paula 1). Este catálogo describe la animación vigente y su variante D7 (A-05, A-06); `bottom: 72px` (`tokens.css:346-353`) no se llama defecto. La decisión de posición y de máximo (3 frente a 1) está en §8 |
| I-02 | Cambio de pantalla: Figma «sin transición» (F1:41) o NO MEDIDO (P14) y la regla de Paula «nada brusco, todo fluido» | **Decisión:** fundido de `opacity` de 150 ms en la pantalla nueva, sin movimiento; sin salida (confirmar en §8) |
| I-03 | Organizar widgets: el Figma anima con `SMART_ANIMATE` 0,2 s y la regla de Paula dice que el arrastre sigue al puntero sin retraso | **Decisión:** el arrastre real no tiene transición (A-13); los 0,2 s `EASE_OUT` se usan en el asentamiento al soltar (A-14, A-15, A-18, A-19). El `ON_DRAG` del Figma es el inicio del arrastre (F4a:45-47) |
| I-04 | Dos duraciones: 0,15 s (`DISSOLVE`) y 0,2 s (`SMART_ANIMATE`, RD-63) | **Decisión:** 150 ms para fundidos y estados; 200 ms para lo que entra con movimiento (entra a 200, sale a 150, §3) |
| I-05 | Panel de Windi: el Figma dibuja 351×551 radio 12 sobre marco 360×560 (F3:20); el código lo hace 360 × 100vh (`marco.css:533`) | **Decisión:** el panel entra a `--dur-medio` (200 ms); no se anima `width`. La diferencia de tamaño es asunto de CONSISTENCIA. Cambiar `hidden` por clase de estado con `visibility`/`inert` es PROPUESTA (§8) |
| I-06 | Barra lateral: Figma instantánea (F0:304, P9) | **Decisión:** se respeta el Figma, sin transición (A-12); la pregunta del fundido de etiquetas va a §8 |
| I-07 | Con `prefers-reduced-motion`, el código solo quita animación (`tokens.css:429-433`, `:964-968`, `:1347-1351`) | **Decisión:** se unifica a la regla 10: transiciones en fundido de 100 ms y `--mov-*` a 0; los lazos quedan quietos |
| I-08 | «Animaciones de resalte en toda la aplicación» (`docs/rediseno_pendientes_prototipos.md:653`: «Para después, como cambio aparte») | **Fuera de alcance.** No se inventa ningún resalte nuevo. **Destino:** tarea aparte de la cola de rediseño, con su propio RD-nn, a abrir cuando Paula lo pida. Sí entra la transición de los estados que el Figma ya dibuja (hover, foco, pulsado) |
| I-09 | La app abre maximizada y se puede minimizar (D15, propuesta) | Lo hace el sistema operativo; sin fila en el catálogo |
| I-10 | El widget «Animación» del catálogo (`WidgetAnimacion.tsx`, `Widgets.tsx:87`) | No es animación de la interfaz: es contenido. No entra |
| I-11 | `transition: all` | Ninguna instancia hoy en `apps/desktop/src`. Prohibida por la prueba global |
| I-12 | El Error: el Figma lo cierra a 6 s (217:17679, F0:298-299); RD-104 manda «hasta cerrarlo» | **Gana RD-104:** el Error no sale solo; el tiempo de 6 s del Figma solo vale para Advertencia |
| I-13 | Etiqueta de las transiciones del instalador y de F2a/F2b: CONSISTENCIA P6 y P14 dicen NO MEDIDO, pero F7:46 («todas NAVIGATE sin transición») y F2b:5 («sin transición = transition nulo») dicen «sin transición» | Se etiquetan **NO MEDIDO** (A-34, F-6, F-7). La contradicción queda abierta en §8 para confirmar si «sin transición» es lectura real o ausencia de lectura |
| I-14 | F5:33 dice «No hay MOUSE_LEAVE: tras pasar el cursor el aviso queda En pausa sin regreso» en las instancias de destinos; F0:300-301 sí dibuja la vuelta a Visible | La pausa al entrar el ratón y su reanudación al salir son lógica de RD-63/RD-104, **no del Figma** (A-07). El Figma solo aporta la variante «En pausa» y su fundido de 0,15 s |

## §7. Pruebas

### Prueba global (una sola, estática)

Archivo propuesto: `apps/desktop/src/ui/tema/movimiento.test.ts` (Vitest, nuevo). Lee **todos** los CSS con `import.meta.glob('**/*.css', { query: '?raw', eager: true })` (incluye `ui/tema/tokens.css`, `ventana_principal/marco.css`, `screens/kanban/kanban.css`, `screens/calendar/calendario.css`, `screens/windi/windi.css`); no necesita navegador.

1. **Ninguna `transition: all`.** `/transition(-property)?\s*:\s*[^;]*\ball\b/` en todos los CSS. Compara contra `[]`.
2. **Ninguna duración mayor al tope.** Extrae todo `Nms` y `Ns` de `transition`, `transition-duration`, `transition-delay`, `animation`, `animation-duration` y de los tokens `--dur-*`; suma duración + retraso; tope 400. Excepción: los tokens de lazo `--dur-giro` (1000) y `--dur-parpadeo` (1200), máximo 1500.
3. **Los valores salen de los tokens.** Toda `transition`/`animation` usa `var(--dur-*)` y `var(--ease-*)`. Fuera de la definición de los tokens están prohibidos `ms` y `s` literales, `cubic-bezier(`, `steps(` y las palabras clave de curva `ease`, `ease-in`, `ease-out`, `ease-in-out` y `linear`.
4. **Los tokens existen y valen lo de §3:** `--dur-instante` 100ms, `--dur-corto` 150ms, `--dur-medio` 200ms, `--dur-giro` 1000ms, `--dur-parpadeo` 1200ms, `--ease-salida`, `--ease-estandar`, `--ease-lineal`, `--ease-parpadeo`. **No existen** `--dur-largo` ni `--ease-entrada`.
5. **Ninguna propiedad de layout se anima.** En `transition-property` y en las declaraciones de cada `@keyframes` no aparece ninguno de estos nombres **exactos** (lista cerrada, comparados por igualdad de token, nunca por subcadena): `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height`, `top`, `right`, `bottom`, `left`, `inset`, `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left`, `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`, `border-width`, `grid-template-columns`. (`border-left-color` y `border-color` no son falsos positivos.)
6. **Reduced-motion.** Existe el bloque `@media (prefers-reduced-motion: reduce)` que fija `--mov-corto`, `--mov-aviso` y `--mov-panel` a `0px`, `--dur-corto` y `--dur-medio` a `100ms`, y pone `animation: none` en cada clase que use un `@keyframes` de lazo (`wg-girar`, `wg-parpadeo`).
7. **Sin `scroll-behavior`** en ningún CSS y `wheel` solo en `ventana_principal/bloquearZoom.ts` (A-38).

### Prueba en vivo

`apps/desktop/e2e/ANIMACIONES.spec.ts` (Playwright, nuevo), con `page.emulateMedia({ reducedMotion: 'reduce' })` y con `'no-preference'`. Compara `getComputedStyle(el).transitionDuration`, `transitionProperty` y `animationName`:

- **`no-preference`:** cada fila A-nn abre su elemento y comprueba duración y propiedad contra la tabla. Las duraciones están en el conjunto {0 s, 0,1 s, 0,15 s, 0,2 s} (más los lazos y el retraso de A-32) y ninguna `transitionProperty` es `all`.
- **`reduce`:** `transform` de entrada de A-01, A-03, A-05, A-10, A-24 vale `none`; `animationName` de A-22 y A-31 es `none`; las `transitionDuration` de fundido valen 0,1 s.
- **Viewports:** 1200×800 y 960×600; durante A-01, A-05 y A-14 ningún fotograma pasa de 20 ms y `getBoundingClientRect().width/height` del contenedor no cambia.

### Salidas con desmontaje: pruebas actuales que asumen cierre síncrono

El hook (regla 13) hace que lo cerrado siga montado hasta `transitionend` o seguro. Estas pruebas hoy esperan el desmontaje en el acto y se adaptan:

- `ui/VentanaEmergente/VentanaEmergente.test.tsx` (sin temporizadores falsos): nulos de `SALIR_SIN_GUARDAR` en `:158`, `:172`, `:191`; nulos del menú en `:220`, `:230`; `inert` en `:105-114`, `:215`.
- `ui/MenuDeAcciones/MenuDeAcciones.test.tsx`: `queryByRole('menu')` nulo en `:37`, `:43`, `:52`, `:159`.
- `ui/MensajeResultado/MensajeResultado.test.tsx` (`useFakeTimers` en 4 de 9): nulos en `:55`, `:60`, `:66`, `:97`, `:131`, `:165`, `:186`; hay que sumar 150 + 50 ms de salida a los avances de 4 100, 3 900 + 200, etc.
- `ui/Confirmacion/Confirmacion.test.tsx`: sin esperas de desmontaje (tres pruebas); se revisan solo si cierran con `queryBy`.

**Adaptación:** un ayudante de prueba `avanzarSalida()` que hace `act(() => vi.advanceTimersByTime(duración + 50))` (con tiempo simulado) o `waitFor`/`findBy` (sin él). Los callbacks (`alSalir`, acción del menú, devolución del foco) siguen comprobándose **síncronos**, sin avanzar tiempo. `inert` se comprueba al empezar la salida.

### Tabla de selectores (los que cubría la prueba global «P-A25»)

La prueba viva recorre esta tabla: selector → archivo:línea → propiedad transicionada → token. «Crear» = el estado no existe hoy y se agrega con su `transition`.

| Id | Selector | Archivo:línea | Propiedad | Token |
|---|---|---|---|---|
| A-05b | `.wg-menu-acciones__opcion:hover`, `:focus-visible` | `ui/tema/tokens.css:817-818` | `background-color`, `color` | `--dur-corto` |
| A-05b | `.wg-menu__ocultar:hover` | `ventana_principal/marco.css:196` | `background-color`, `color` | `--dur-corto` |
| A-05b | `body[data-sesion] .wg-boton.wg-menu__opcion:hover` | `ventana_principal/marco.css:256` | `background-color`, `color` | `--dur-corto` |
| A-05c | `.wg-emergente__cerrar:hover`, `:focus-visible` | `ui/tema/tokens.css:313-314` | `background-color`, `color` | `--dur-corto` |
| A-05c | `.wg-resultado__cerrar:hover`, `:focus-visible` | `ui/tema/tokens.css:412-413` | `background-color`, `color` | `--dur-corto` |
| A-05c | `.wg-panel-windi__cerrar:hover` | `ventana_principal/marco.css:584` | `background-color`, `color` | `--dur-corto` |
| A-20 | `.wg-calendario__celda:hover` (crear) | `ui/tema/tokens.css:1093`; `screens/calendar/calendario.css:71`; `ui/tema/tokens.css:634` | `background-color` | `--dur-corto` |
| A-23 | `.wg-windi-flotante:hover`, `:focus-visible` | `ventana_principal/marco.css:524`, `:527` | `background-color`, `outline-color` | `--dur-corto`, `--dur-instante` |
| A-25 | `.wg-boton:hover`, `:active` (crear según E1) | `ui/tema/tokens.css:85` | `background-color`, `border-color`, `color`, `box-shadow` | `--dur-corto`, `--dur-instante` |
| A-25 | `.wg-boton.wg-boton--icono:hover` | `ui/tema/tokens.css:130` | `background-color`, `color` | `--dur-corto` |
| A-25 | `.wg-ciudad__opcion:hover` | `ui/tema/tokens.css:197` | `background-color`, `color` | `--dur-corto` |
| A-25 | `.wg-widget-noticias__titular:hover` | `ui/tema/tokens.css:1280` | `border-color`, `background-color` | `--dur-corto` |
| A-25 | `.wg-icono-boton:hover` | `ui/tema/tokens.css:1401-1404` | `background-color`, `color` | `--dur-corto` |
| A-25 | `.wg-boton-titulo:hover` | `ui/tema/tokens.css:1578` | `background-color`, `color` | `--dur-corto` |
| A-25 | `.wg-columna-fantasma:hover:not(:disabled)` | `screens/kanban/kanban.css:85` | `background-color`, `color` | `--dur-corto` |
| A-25 | `.wg-kanban__tarjeta:hover` | `screens/kanban/kanban.css:114` | `outline-color` | `--dur-corto` |
| A-26 | `.wg-boton:focus-visible` | `ui/tema/tokens.css:148-151` | `outline-color` | `--dur-instante` |
| A-26 | `.wg-campo__entrada:focus-visible`, `.wg-interruptor:focus-visible` | `ui/tema/tokens.css:152-153` | `outline-color` | `--dur-instante` |
| A-27 | `.wg-campo__entrada`, `:hover` (crear, F0:331) | `ui/tema/tokens.css:201` | `border-color` | `--dur-corto` |
| A-27 | `.wg-campo__entrada[aria-invalid]` | `ui/tema/tokens.css:210-213` | `border-color` (`border-width` no se anima) | `--dur-corto` |
| A-27 | `.wg-campo__mensaje` | `ui/tema/tokens.css:214` | `opacity` | `--dur-medio` |
| A-29 | `.wg-emergente__cerrar` | `ui/tema/tokens.css:313` | `color`, `background-color` | `--dur-corto` |
| A-29 | `.wg-miga__nivel:focus-visible` | `ui/tema/tokens.css:468` | `outline-color` | `--dur-instante` |
| A-29 | `.wg-enlace:focus-visible` | `ui/tema/tokens.css:574` | `outline-color` | `--dur-instante` |
| A-29 | `.wg-campo__ojo:hover` | `ui/tema/tokens.css:1630` | `color`, `background-color` | `--dur-corto` |

Cada fila comprueba además que el selector declara `outline: 2px solid transparent` en su estado base cuando es de foco (nunca `outline: none`, regla 3).

### Prueba de cada A-nn

| Id | Archivo de prueba propuesto | Qué lee | Qué compara |
|---|---|---|---|
| A-01, A-02, A-02b | `ui/VentanaEmergente/VentanaEmergente.test.tsx` (Vitest) y `e2e/ANIMACIONES.spec.ts` | Clases `wg-emergente--abierta` y `--saliendo`; estilo calculado | A-01: 200 ms; A-02: 150 ms y desmontaje a +200 ms con tiempo simulado; apilada: velo de abajo `opacity: 1`, velo de arriba transparente |
| A-03, A-04, A-05b | `ui/MenuDeAcciones/MenuDeAcciones.test.tsx` y e2e | Clase de estado del menú; estilo calculado | Abrir 150 ms, cerrar 100 ms, acción sin esperar la salida |
| A-05, A-06, A-06b, A-07, A-05c | `ui/MensajeResultado/MensajeResultado.test.tsx` y e2e | Temporizadores simulados, clase `wg-resultado--saliendo`, estilo calculado | 4 000 / 6 000 ms / nunca (Error); salida 150 ms; entrada: propiedad `opacity, transform` y 200 ms (sin `top: 4px`); reacomodo con `transform` |
| A-07 (P-A07) | `ui/MensajeResultado/MensajeResultado.test.tsx` | Tiempo simulado | Aviso de 4 s: a 3 000 ms entra el ratón, la cuenta queda **pausada** y a 10 000 ms sigue visible; al salir el ratón **reanuda con el tiempo restante** (1 000 ms): a +999 ms sigue, a +1 000 ms empieza la salida y a +1 150 + 50 ms se desmonta. Igual con foco dentro (RD-104) |
| A-08, A-09 | `e2e/ANIMACIONES.spec.ts` | `opacity` en fotogramas sucesivos | Crece de 0 a 1 en ≈ 150 ms y no hay `transform` |
| A-10, A-11 | `screens/windi/Windi.test.tsx` y e2e | Clase de estado, `inert`, `visibility` | Entrada 200 ms, salida 150 ms, `inert` a +150 ms, `width` no cambia |
| A-12 | `e2e/RT-01.spec.ts` (ampliar) | Ancho de la columna del menú | Cambia en un solo fotograma |
| A-13 | `e2e/HE-09-HU02.spec.ts` (ampliar) y `e2e/HE-05-organizar.spec.ts` (nuevo) | `transition-duration` con la clase de arrastre | = 0 s; posición = último `layout_edit_move` |
| A-14, A-15, A-16 | `edicion/Edicion.test.tsx` y e2e | `transition-duration` tras soltar; posición final a +250 ms | 200 ms; posición final correcta; choque 150 ms |
| A-17, A-18, A-19 | `e2e/HE-09-HU02.spec.ts` (ampliar) y `e2e/ANIMACIONES.spec.ts` | `transition-property` y `transform` final; P-A19 como en §5 | A-17 incluye `box-shadow` y `outline-color`, no `transform`; A-18 200 ms y `transform: none` a +250 ms; A-19 sin `top` |
| A-20, A-21 | `screens/calendar/Calendario.test.tsx` y e2e | `background-color` en hover; ausencia de `transition` en la rejilla | Hover 150 ms; cambio de mes sin transición |
| A-22 | `ui/OjosDeWindi/OjosDeWindi.test.tsx` (nuevo) y e2e | Clase y `animation-name` | Termina el ciclo abierto (`animationiteration`); 1,2 s; con `reduce` `none` |
| A-23, A-25 a A-27, A-29 | `e2e/ANIMACIONES.spec.ts` | Tabla de selectores de arriba | Hover 150 ms; pulsar 100 ms; foco 100 ms con anillo 2 px `tinta` |
| A-28 | e2e | `transition-property` de la perilla | Incluye `transform`, no `left` |
| A-24, A-37 | `screens/windi/Windi.test.tsx` y e2e | Estilo calculado | 150 ms, `opacity` (y `transform` en A-24) |
| A-30 | `ui/NombreEmergente/NombreEmergente.test.tsx` | Tiempo simulado | 400 ms con puntero y 0 con foco (existe) |
| A-31, A-32, A-33, A-36 | `screens/reports/Seccion.test.tsx` (nuevo; hoy solo hay `Reports.test.tsx`), `ui/Esqueleto/Esqueleto.test.tsx` (nuevo), `ui/EstadoVacio/EstadoVacio.test.tsx` y e2e | Tiempo simulado; `animation-name` | Esqueleto 199/201/500 ms; giro 1 s lineal; vacío sin transición; indicador 150 ms |
| A-34, A-35 | Pruebas de la pieza del instalador (CD-02) | Clases y estilo de `Progreso` | Solo `opacity` al cambiar de paso; `scaleX`, nunca `width` |
| A-38 | `ui/tema/movimiento.test.ts` | Prueba 7 de la global | Sin `scroll-behavior`; `wheel` solo en `bloquearZoom.ts` |

## §8. Pendiente de Paula

Solo lo que la escala no puede decidir:

1. **Posición y cantidad de los avisos: D7 contra RD-63.** RD-63 (vigente) es esquina inferior derecha, hasta 3 visibles, y RD-104 dice que no cambia de posición; D7 (propuesta, CONSISTENCIA ~245) es franja superior con un solo aviso. A-05 y A-06 llevan las dos variantes (`--dir-aviso`); hay que elegir una y, de paso, cerrar el máximo de 3 frente a 1.
2. **Qué cambia a la vista en «En pausa»** (A-07, I-14): el Figma anima Visible ↔ En pausa pero no consta qué propiedad cambia, y F5:33 dice que no hay regreso. Mientras tanto la pausa solo detiene el temporizador (RD-63/RD-104), sin cambio visible.
3. **Reduced-motion en el giro de carga** (A-31): queda quieto, solo con `aria-label`. ¿Se agrega un texto visible «Cargando…»?
4. **¿Fundido corto por la regla «nada brusco»?** El Figma mide o dibuja instantáneos la barra lateral (A-12, F0:304), el cambio de mes o semana (A-21, F-7) y el estado vacío (A-33, F2a:31) y aquí se respetan sin animación. Si Paula prefiere fundir, es un cambio de una fila cada uno. Y para el cambio de pantalla (A-08, I-02): confirmar el fundido de 150 ms (F1:41 mide instantáneo).
5. **Panel de Windi (A-10, A-11):** PROPUESTA de mantenerlo montado y cambiar `hidden` por clase de estado con `visibility` retrasada e `inert`. Confirmar antes de tocar `PanelDeWindi.tsx`.
6. **Instalador y F2a/F2b (I-13):** P6 y P14 dicen NO MEDIDO y F7:46 y F2b:5 dicen «sin transición». ¿Cuál vale? Hasta entonces A-34 usa el fundido de la escala.
