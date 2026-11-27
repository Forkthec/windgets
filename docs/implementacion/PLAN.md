# Plan completo del rediseño: de lo que falta subir a las pruebas finales contra los prototipos

Borrador local, sin commit. 26-nov-2026 (UTC-5). Espera la aprobación de Paula. Primer borrador (solo Fase A) guardado en
`.trabajo/PLAN_FASE_A_v1.md`.

**Objetivo:** que la app funcione y quede lo más parecida posible a los prototipos del Figma A3Z03 («Windgets (Copy)»),
en los cuatro temas. **No hay fecha límite para los documentos:** cada fase se cierra cuando cumple su criterio de salida,
no cuando se acaba el tiempo.

## Reglas que valen en todas las fases

1. **Orden de autoridad:** Figma A3Z03 → `rediseno.md` y los RD → HU y `contratos.md` → `rediseno_cambios_implementacion.md`.
   Lo que el Figma dibuja y ningún CA define se hace como está dibujado y se anota en `DUDAS.md`.
2. **El conector de Figma es obligatorio** para todos, tanto quien escribe los documentos como quien implementa (cambia el
   punto 7 del pedido inicial, que prohibía abrir el Figma al implementar). Ver «Acceso al Figma».
3. **Errores visibles:** ningún fallo previsible termina en el genérico.
4. **Todos trabajan sobre `main` con una sola cuenta de Claude**, una persona a la vez (excepción a la regla 6 de
   `CLAUDE.md`, se anota como `infra:`). `git pull --rebase` al empezar y antes de cada push.
5. Un commit por pieza (`rediseno: …`, `HE-nn-HUnn: …` o `infra: …`), sin `[IA-ASISTIDO]` y con `Co-Authored-By`.
6. Nada generado con IA se sube sin el sí de Paula; nada se borra para siempre.
7. **Morado y cian** (decisión del 26-nov): el morado queda donde el Figma lo pinta, pero un mismo control nunca mezcla
   morado y cian. Donde el Figma los junte, se usa la tinta `#0F2A33`. El cian va solo como relleno, con texto `#0B2A2E`.

## Acceso al Figma (para cada persona)

- **Cada persona** usa el conector de Figma con su propia cuenta de Figma. Tiene dos caminos: pedir acceso al archivo
  A3Z03, o duplicarlo a sus borradores.
- **Leer basta para implementar.** En la copia o con permiso de edición se puede probar, pero **el A3Z03 original no se
  edita al implementar**. Si un prototipo está mal, el arreglo va a `DECISIONES.md` y, si cambia el diseño, a Paula.
- **Comprobar la copia al empezar:** hacer `get_design_context` de un nodo conocido (por ejemplo `79:5`) y confirmar que
  es el mismo marco. Los ids de los documentos se escribieron sobre el A3Z03. Si en la copia no coinciden, se lee el
  original con permiso de vista.
- **Comprobar el cupo del conector** del plan y el asiento de la cuenta Figma antes del primer relevo. Los asientos de solo
  vista y el plan gratuito tienen un cupo de llamadas muy bajo. Si no alcanza, se pide un asiento con más cupo o se lee
  desde la cuenta de Paula.
- **Cupo medido el 26-nov** (página de límites de Figma y `whoami`): el límite va por el plan y el asiento de quien llama.
  Starter o asientos View/Collab: 20 llamadas **al mes** (no sirve para implementar). Education o Professional con asiento
  Full/Dev: 200 al día y 10 por minuto. La cuenta de Paula tiene asiento Full en su equipo Starter y en el equipo Student
  de Vela. Por eso: **la copia se hace dentro de un equipo Education o Professional donde la persona tenga asiento Full**,
  nunca en los borradores de un plan Starter; o se pide acceso al archivo con asiento Full.
- **Lectura barata:** se lee con guiones de `use_figma` de solo lectura que sacan muchos marcos por llamada (medidas,
  textos, variables, fuentes); `get_design_context` y `get_screenshot` solo para los marcos que lo necesiten.
- Uso permitido: `get_design_context`, `get_screenshot`, `get_variable_defs` y `get_motion_context` **sobre los ids de la
  pieza**. Nunca `get_metadata` de una página entera en el chat principal: se hace dentro de un subagente.

## Las fases

| Fase | Qué es | Quién | Sale cuando |
|---|---|---|---|
| **0 · Integrar lo hecho** | Subir a `main` lo que hoy está solo en local | primer relevo (R-01) | `main` = punta verificada y CI en verde |
| **1 · Plan** | Este documento | chat de documentos | Paula lo aprueba |
| **2 · Inventario del Figma** | Leer todo el Figma una vez y dejarlo en tablas | subagentes, una página cada uno | cada marco vigente tiene su fila |
| **3 · Documentos** | Sistema visual, tokens, animaciones, specs, errores, decisiones, trazabilidad, cola | chat de documentos | todos escritos y revisados |
| **4 · Auditoría** | Una IA sin contexto intenta implementar tres piezas | subagente | no queda nada por adivinar |
| **5 · Aprobar y subir los documentos** | Paula revisa `DECISIONES.md` y aprueba; commit `infra:` a `main` | Paula + chat | documentos en `main` |
| **6 · Herramientas de prueba** | Arnés de geometría, tokens y comparación con el Figma | primeras piezas de la cola | pruebas en verde sobre lo ya hecho |
| **7 · Implementación por relevos** | Las piezas de `COLA.md`, una a una | 4 personas | toda la cola en `[x]` |
| **8 · Pruebas finales contra los prototipos** | Comparación completa app ↔ Figma, verificación y prueba manual | último relevo + Paula | `TRAZABILIDAD.md` en verde o en la lista manual |
| **9 · Documentación final y entrega** | RD, edición final de las HU, `DUDAS.md`, manual y estado | último relevo | entrega del martes 1-dic, 4:00 p. m. |

### Fase 0 · Integrar lo hecho (R-01)

1. Rama `paso-44-componentes-base`, punta `77aef72`: va 33 commits por delante de `origin/main` (`8527130`) y no le falta
   ninguno. `main` no tiene protección en GitHub y la CI corre en cada push.
2. RD-106 (6 formularios, 28 líneas: «×» y Esc piden «Salir sin guardar» si hay algo escrito): se prueba y se sube como
   commit propio `rediseno: pedir el descarte con datos escritos (RD-106)`, con su fila en `rediseno.md`. Los RD nuevos
   empiezan en RD-107.
3. Verificación completa una vez sobre la punta (`/verificar` con todos los pasos, en Docker). Si algo falla, se arregla
   antes de subir.
4. Commit `infra: trabajar sobre main durante la entrega del rediseño`, con la excepción a la regla 6.
5. Con el sí de Paula: push de la rama a `main` (avance rápido) y CI en verde. Actualizar `.trabajo/ESTADO.md`, que hoy
   dice punta `8432bf9`.
6. Quedan **sin subir hasta la fase 5**: los 10 `docs/rediseno_*.md` y `docs/implementacion/`. `traspaso-p24/` (los
   archivos `CAMBIOS_V12`, `PLAN` y `PROMPT`) se revisa aquí y no se sube sin el sí de Paula.

Esta fase no depende de las fases 1 a 5: puede hacerse ya.

### Fase 2 · Inventario del Figma

- **Agentes:** F0 Fundamentos y variables (`0:1`, colección `200:2` en sus 4 modos); F1 Acceso `79:2`; F2a y F2b
  Planificador `79:3`, partido por mitades; F3 Agente `79:4`; F4a y F4b Personalización `79:5`; F5 Configuración `79:6`;
  F6 Escritorio `83:2`; F7 Web e instalación `83:3`; F8 Confirmaciones `83:4`.
- **Cómo lee cada agente:** toma los ids de `rediseno_flujos_ids_prototipos.md`, sin `get_metadata` de la página. Lee con
  `get_design_context` el marco **claro** de cada familia, más `get_motion_context` donde haya interacciones. Escribe solo
  tablas en `.trabajo/figma/Fn.md`, una carpeta que git ignora: estructura, textos literales, medidas, variables por
  nombre, estados, interacciones y tiempos.
- **Los otros temas:** salen de las variables. Por página y tema se leen 3 marcos de muestra para encontrar lo que se sale
  de la variable (letra, íconos, rellenos sueltos).
- **Lo que se ignora:** los marcos de «Descartado».
- **Criterio de salida:** cada familia vigente tiene su fila con todos sus valores, o la marca «no medible».

### Fase 3 · Documentos (en `docs/implementacion/`)

**Orden:** `CONSISTENCIA` → `TEMAS_Y_TOKENS` → `ANIMACIONES` → 8 `SPEC_<área>` (Marco y componentes base, Planificador,
Personalización y widgets, Windi, Cuenta y Acceso, Configuración, Escritorio y capa, Instalador y web) → `ERRORES_Y_PRUEBAS` →
`DECISIONES` → `TRAZABILIDAD` → `COLA` → `RELEVO` → `PRUEBAS_Y_CIERRE` → `LEEME`. El contenido de cada uno es el del pedido
inicial (§3).

**Cada spec trae:**
- todos los valores ya resueltos, para que nadie tenga que medir a ojo;
- los **ids de nodo** de cada pantalla, para que quien implemente lo compruebe con el conector.

**Revisión:** cada documento pasa por un `revisor` que lo lee como una IA sin contexto.

**Tamaño de las piezas de `COLA.md`:**

| Tamaño | Qué abarca | Uso del límite de 5 h |
|---|---|---|
| S | 1 componente, hasta 3 archivos | ≈ 10 % |
| M | 2 a 6 archivos | ≈ 25 % |
| L | Rust y TypeScript, una migración o más de 6 archivos | ≈ 45 % |

Lo que pase de L se parte en dos.

### Fase 4 · Auditoría

Un subagente sin contexto «implementa de cabeza» una pieza S, una M y una L. Lista lo que tendría que adivinar o medir;
se corrige y se repite hasta que la lista quede vacía.

### Fase 5 · Aprobar y subir los documentos

Paula revisa `DECISIONES.md` (columna «Paula cambia a:») y las specs. Con su sí, un commit `infra:` sube a `main`
`docs/implementacion/` y los `docs/rediseno_*.md` que los documentos citan.

### Fase 6 · Herramientas de prueba (primeras piezas de la cola)

1. **Tokens:** una prueba compara los cuatro temas de `apps/desktop/src/ui/tema/` con la tabla de `TEMAS_Y_TOKENS.md`.
   También calcula los contrastes y comprueba la regla de morado y cian.
2. **Geometría:** el arnés de Playwright (`apps/desktop/e2e/`) mide cada elemento con `data-testid` contra las medidas de
   la spec, con ±2 px, en 1200×800 y 960×600.
3. **Comparación con el Figma:** un guion pone, lado a lado, la captura de la app (Playwright, mismo tamaño de marco y
   mismos datos de ejemplo) y la de `get_screenshot` del nodo. Calcula la diferencia de píxeles con un umbral y deja la
   evidencia en `.trabajo/comparacion/`. Sirve de aviso: la diferencia se juzga con la geometría y los tokens, no con la
   imagen sola.
4. **Animaciones:** ninguna transición usa `all`, ninguna pasa el tope de duración y `prefers-reduced-motion` las apaga.

### Fase 7 · Implementación por relevos

**Orden de la cola** (se reordena si aparecen dependencias reales):
1. Cierre de L3: ranura `acciones`, `Panel`, mensajes arriba a la derecha, ojos de Windi, íconos del clima.
2. Los cuatro temas y sus tokens.
3. L4, por áreas.
4. L5 Planificador.
5. L6 Personalización.
6. L7 Windi.
7. L8 Cuenta.
8. Escritorio, widgets e instalador.
9. Lo de HU v13 que el Figma dibuja.
10. Errores y lecturas silenciosas pendientes.

**Cada pieza:**
1. Lee su spec.
2. Abre **con el conector** los nodos de la pieza (`get_design_context` en claro y una muestra de otro tema) para comprobar
   lo que la spec dice.
3. Implementa y corre las pruebas del módulo tocado y la geometría de sus pantallas.
4. Hace **una** comparación con `get_screenshot` contra su captura de la app.
5. Si hay diferencias, se corrigen dentro de la pieza, con un máximo de dos vueltas. Lo que siga distinto va a
   `DECISIONES.md` o a una pieza nueva.
6. Commit, push y marca en `COLA.md`.

`RELEVO.md` dice cómo dejar el punto de retoma si alguien se queda sin límite a mitad de una pieza.

### Fase 8 · Pruebas finales contra los prototipos

1. **Verificación completa** sobre la punta de `main`: `/verificar` con todos los pasos, cobertura de lo tocado y Newman
   si aplica.
2. **Comparación completa:** recorre cada fila de `TRAZABILIDAD.md`, es decir, cada marco vigente en los 4 temas.
   - Geometría ±2 px y tokens en 1200×800 y 960×600, con escala de 100 a 150 %.
   - Captura de la app frente a la del Figma con el guion de la fase 6.
   - Textos literales y errores.
3. **Corrección:** cada diferencia se vuelve una pieza nueva de la cola; se corrige y se compara otra vez solo esa fila.
4. **Una tanda de capturas al cierre**, en claro y oscuro, con consola y teclado revisados.
5. **Lista de prueba manual en Windows para Paula**, para lo que no se puede automatizar: capa del escritorio, instalador,
   escala real, bandeja y notificaciones. También se puede probar en las VMs.
6. **Criterio de salida:** cada fila de `TRAZABILIDAD.md` está en verde o en la lista manual aprobada por Paula.

### Fase 9 · Documentación final y entrega

- RD-107 en adelante anotados en `rediseno.md`.
- Edición final de las HU y de los modelos que los RD contradicen («Pendiente para la edición final»).
- `DUDAS.md` al día, `contratos.md` y `tipos.ts` al día, manual de usuario y `ESTADO.md`.
- Versión e instalador, si la entrega los pide.
- Todo con el sí de Paula antes de subirlo.

## Pruebas contra el Figma sin capturas (decisión del 26-nov)

Paula pidió no hacer capturas. La fidelidad se prueba con **huellas** sacadas del Figma, no con imágenes:

1. En la fase 2, cada marco vigente se exporta (guion de `use_figma` de solo lectura) a un archivo JSON
   `apps/desktop/e2e/figma/<id>.json`: tamaño del marco y, por cada elemento con nombre, su caja (x, y, ancho, alto),
   relleno y borde (variable y hex), radio, sombra, fuente (familia, tamaño, peso, alto de línea) y texto literal.
2. Cada spec trae la tabla «capa del Figma → `data-testid`». Quien implementa pone ese `data-testid` en el elemento.
3. Una prueba de Playwright abre la pantalla con los datos de ejemplo del marco, mide cada `data-testid`
   (`getBoundingClientRect` y estilo calculado) y lo compara con la huella: ±2 px en cajas, color exacto por token, misma
   fuente y mismo texto. Para Rosa, Enfoque y oscuro se cambia el tema y se comparan los colores con la variable de ese modo.
4. Lo que la huella no puede comprobar (íconos dibujados, degradados, imagen de fondo, capa del escritorio) va a la lista
   manual de Paula.

Así no hace falta ninguna captura ni más llamadas al conector en las pruebas finales: las huellas se sacan una sola vez.

## Plan de esta noche (26-nov, 00:20 a 06:00, sin preguntas)

Decisiones de Paula para la noche: push a `main` solo si todo está verde; `use_figma` permitido solo para leer; dudas
nuevas → igual al prototipo y anotadas en `DECISIONES.md` con «Paula cambia a:» vacía. A las 5:53 se corta, se guarda el
estado y se escribe `docs/implementacion/TRASPASO_NOCHE.md`.

| # | Tarea | Hecha |
|---|---|---|
| 1 | Verificación completa de la punta | |
| 2 | Si falta, prueba de RD-106; commits de RD-106 y del `infra:` de trabajar sobre `main`; push si todo verde; CI | |
| 3 | Piloto F0 (variables, estilos, componentes) | |
| 4 | Inventario por página con huellas JSON en `.trabajo/figma/` (se pasan al repo al aprobar): F1, F3, F5, F7, F8, F6, F2a, F2b, F4a, F4b | |
| 5 | `CONSISTENCIA.md`, `TEMAS_Y_TOKENS.md` y `ANIMACIONES.md` | |
| 6 | `SPEC_Marco` y las demás specs, en el orden de la fase 3, hasta donde alcance | |

Hasta dónde se puede llegar: la fase 0 y el inventario completo son realistas si el cupo de Figma (200 llamadas al día)
alcanza; los documentos de la tarea 5 probablemente; las specs dependen del límite de uso de Claude, que suele acabarse
antes que la noche.

## Riesgos

1. **Cupo del conector de Figma** de cada cuenta: se comprueba antes del primer relevo.
2. **Ids distintos en una copia del Figma:** se comprueban al empezar (ver «Acceso al Figma»).
3. **Push directo a `main` sin protección:** un push roto frena a todos. Por eso se corren las pruebas del módulo antes de
   cada push y se espera la CI en verde antes de pasar la cola. Si `main` queda en rojo, la siguiente pieza es arreglarlo.
4. **Diferencia de píxeles engañosa** por el suavizado de letra entre Figma y WebView2: decide la geometría; la imagen es
   solo un aviso.
5. **Bucle de retoques:** máximo dos vueltas por pieza. Lo demás va a la cola o a `DECISIONES.md`.
