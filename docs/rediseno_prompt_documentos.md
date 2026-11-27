# Prompt para el chat Opus: documentos base de la implementación (25-nov-2026, hora de Colombia)

Borrador local de Paula, sin commit. Pégalo tal cual en un chat nuevo con Opus, abierto en la carpeta del repositorio
(`windgets`). Ese chat **solo escribe documentos**; no cambia código.

---

## Prompt

Eres el chat que prepara los documentos base para implementar el rediseño de Windgets. Después de ti, **4 personas con
IA (todas con la misma cuenta, todo «vibecodeado»)** implementarán en relevos, sin hablar contigo. Por eso cada documento
debe bastar por sí solo: una IA que lo lea sin contexto previo debe poder construir la pieza igual al prototipo, sin
inventar. Entrega: **martes 1-dic-2026, 4:00 p. m. (hora de Colombia, UTC-5)**. Hoy es miércoles 25-nov. Los documentos
deben estar listos antes del **viernes 27-nov**, para dejar el fin de semana y el lunes a la implementación y a la
documentación final.

### 0. Reglas que mandan (no las discutas)

1. Lee primero `CLAUDE.md`, `docs/AGENTS.md` y la memoria de Paula. Paula es PO y Backend. Solo ella aprueba specs. Nada
   generado con IA se sube a ningún sitio compartido sin su sí; todo queda en local y sin commit. Nada se borra para
   siempre.
2. **Objetivo principal de Paula: que la app sea funcional e igual a los prototipos.** Ante cualquier duda manda, en este
   orden: (1) el Figma `A3Z03L20swFyo8qdP9jETF` («Windgets (Copy)»); (2) `docs/rediseno.md` y los RD; (3) las HU y
   `docs/contratos.md`; (4) `docs/rediseno_cambios_implementacion.md`. Lo que el Figma muestra y ningún CA define se
   implementa como está dibujado y se anota en `docs/DUDAS.md`. Todo se implementa (decisión f).
3. Errores claros y siempre visibles: ningún fallo previsible termina en el genérico. Cada requisito se cruza con esa
   regla.
4. Un commit por pieza con el título `rediseno: <verbo y objeto>` (o `HE-nn-HUnn:`), sin `[IA-ASISTIDO]`, con el trailer
   `Co-Authored-By`. Ver `CLAUDE.md`.
5. **Decisión de Paula del 25-nov: todos trabajan sobre `main`, con una sola cuenta.** Esto cambia la regla 6 de
   `CLAUDE.md` («rama `paso-NN-…`, nunca `main`») solo para esta entrega. Como el trabajo es una cadena de relevos (una
   persona a la vez), no hay choques. Cada persona hace `git pull --rebase` al empezar y antes de cada push, y empuja
   una pieza ya verificada. Anótalo como `infra:` y como excepción en los documentos.
6. Hoy el código está en la rama local `paso-44-componentes-base` (punta `77aef72`, sin push) y apilada sobre
   `paso-43b-datos-y-backend` y L1. **Primer relevo de la cola: dejar eso en `main`** (verificar, subir y comprobar que
   `main` queda en verde). Hay 6 archivos de formularios con cambios sin commit (RD-106, descarte con datos escritos):
   la cola debe decir qué se hace con ellos.

7. **Objetivo de calidad y economía de la implementación (pedido de Paula, 25-nov).** Los prototipos ya los validaron
   personas: la implementación **no re-valida el diseño**. Por eso:
   - **Primero se planea todo, y solo después se escribe.** Trabaja en dos fases (ver §3 bis). No empieces los
     documentos de especificación hasta que Paula apruebe el plan de la Fase A.
   - Los documentos deben **traer ya todos los valores** (medidas, colores resueltos, textos, duraciones, estados) para
     que quien implemente **no abra el Figma, no pida capturas ni compare a ojo**. El Figma se consulta solo aquí, una
     vez, para escribir las specs. Si un dato falta, se decide aquí con la regla de consistencia, no en la implementación.
   - La fidelidad se garantiza con **pruebas automáticas baratas** (tokens, geometría, textos, errores), no con
     iteraciones de captura y corrección. Prohibido en la implementación: bucles de captura→comparar→retocar, agentes
     `revisor` de diseño, y volver a leer el Figma. Una sola tanda de capturas al cierre (regla de gasto de tokens).
   - Los prototipos pueden tener fallos o incoherencias. **La aplicación debe ser consistente en todo** (bordes, radios,
     espaciados, sombras, tipografía, estados, animaciones). Donde el Figma se contradiga a sí mismo, el chat resuelve con
     la regla de consistencia (§3, documento `CONSISTENCIA.md`) y lo anota en `DECISIONES.md`; la implementación no decide.
   - No prometas «garantía» vacía: la garantía es la **matriz de trazabilidad** (§3, `TRAZABILIDAD.md`): cada elemento
     del Figma → pieza de la cola → prueba que lo comprueba. Lo que no tenga prueba automática se marca y entra en la
     lista de prueba manual de Paula.

### 1. Qué leer (en este orden y por rangos, sin releer)

- Estado del código: `.trabajo/ESTADO.md`, `.trabajo/estrategia_lotes.md`, `docs/rediseno_plan_codigo.md` (lotes L0 a
  L10), `docs/rediseno_plan_ejecucion.md`, `docs/DUDAS.md` (secciones P43, P43b y P44), `git log --oneline -30`.
- Prototipos (A3Z03): `docs/rediseno_flujos_prototipos.md` (flujos por pantalla y §12.1 de las correcciones del 25-nov),
  `docs/rediseno_flujos_ids_prototipos.md` (ids de nodo), `docs/rediseno_plan_prototipos.md`,
  `docs/rediseno_estado_prototipos.md` (§4.1, §4.3 y §4.4: textos sin definir y RD que faltan),
  `docs/rediseno_pendientes_prototipos.md`, `docs/rediseno_cambios_prototipos.md`.
- Especificación: `docs/rediseno.md`, `docs/rediseno_cambios_implementacion.md` (DI-01 a DI-16, IM-00 a IM-14),
  `docs/rediseno_final_prototipos.md`, `docs/rediseno_final_backend.md`, `docs/hu_v13.md`,
  `docs/traspaso_rediseno_final.md`, `docs/contratos.md`, `docs/interfaz.md`, `docs/convenciones.md`.
- Figma: usa `get_design_context` solo sobre nodos concretos, por id. **Nunca** `get_metadata` de una página entera en el
  chat principal (pesa unos 100 000 caracteres): hazlo dentro de un subagente y guarda solo el resultado útil como
  texto. Páginas: `0:1` Fundamentos, `79:2` Acceso, `79:3` Planificador, `79:4` Agente, `79:5` Personalización, `79:6`
  Configuración, `83:2` Escritorio, `83:3` Web e instalación, `83:4` Confirmaciones. Los marcos de «Descartado» no se
  implementan.

### 2. Decisiones de Paula ya tomadas (no las preguntes otra vez)

| Tema | Decisión |
|---|---|
| Alcance | **Toda la implementación de los prototipos y los errores relacionados, más la documentación.** Incluye L3 a L9 y lo de HU v13 que el Figma ya dibuja o que el rediseño necesita. Lo que no alcance a entrar queda en `DUDAS.md` con su destino, nunca en silencio. |
| Temas | Los cuatro a la vez: «Windgets claro», «Windgets oscuro», «Rosa pastel» y «Enfoque rojo y negro». Rosa y Enfoque se construyen con las tablas de variables del Figma A3Z03 (colección `VariableCollectionId:200:2`, modos claro 200:0, Rosa 200:1, Enfoque 200:2, oscuro 233:0), con prueba de contraste y un RD nuevo. |
| Fondo de «Windgets claro» sin archivos descargados | Se construye como los demás temas: incluir su fondo y miniatura (el chat dice qué archivos hacen falta y de dónde salen). |
| Íconos del clima (D-01, IM-13) | Se dibujan en código, de día y de noche. Un código conocido sin `is_day` muestra el ícono de día. Código desconocido, nulo o sin datos: «Sin datos». |
| Widgets | Todos se pueden eliminar (también Reloj, Calendario, Tareas del día y Kanban). «Widget por defecto» es solo una etiqueta informativa. |
| Calendario | Sin íconos junto al número: el día se pinta de verde (hechas), amarillo (por vencer) o rojo (vencidas). |
| Dudas menores de L1, L2 y L3 (≈ 25) | Se adopta la recomendación en todas, con el criterio «igual al prototipo». Genera una tabla corta «duda → valor adoptado → por qué» para que Paula cambie las que quiera. |
| Contraste de `accion` `#00D9E2` en claro (1,75:1) | **Decidido (25-nov): opción A «Cian con tinta».** El cian `#00D9E2` queda solo como relleno (botón principal, sección activa de la barra lateral) con texto `#0B2A2E` (8,7:1). Foco, bordes de campo y enlaces (subrayados) van en tinta `#0F2A33` (15:1). Sin violeta junto al cian. Contrastes calculados contra `#FFFFFF`: el chat debe recalcularlos contra el fondo real de «Windgets claro» y anotar el RD. No hace falta el entregable 7 (propuestas): ya se eligió. |
| Reparto | Cadena de relevos de 4 personas. **Cada persona hace tantas piezas como le alcance su límite de uso**: puede avanzar mucho o poco según la tarea. Por eso las piezas son pequeñas, se cierran una a una y dejan un punto de retoma. |

### 3. Qué debes producir

Escribe en `docs/implementacion/` (carpeta nueva, sin commit). Cada archivo es corto, con tablas, y se puede leer por
separado.

1. **`LEEME.md`**: el mapa. Qué es cada documento, en qué orden se lee y las reglas del §0 resumidas en una pantalla.
2. **`COLA.md`: la cola de relevos** (el documento más importante). Una lista ordenada de piezas, cada una con:
   - `id` (`R-01`, `R-02`, …), título corto, tamaño (S/M/L, y una estimación de usos del límite);
   - depende de (ids) y bloquea a (ids); marca las que **no pueden ir antes** de otras;
   - qué construye, en una frase, y **qué nodos del Figma** la definen (ids de `rediseno_flujos_ids_prototipos.md`);
   - RD, IM, DI, HU y CA que cubre, y **los archivos que toca** (para ver choques);
   - pruebas que deben pasar y el criterio de «terminado» comprobable;
   - estado (`[ ]`/`[x]`), quién la tomó y la punta de git al cerrarla.
   Orden sugerido: R-01 integrar lo hecho en `main`; cierre de L3 (ranura `acciones`, `Panel`, mensajes arriba a la
   derecha, ojos de Windi, íconos del clima); temas y tokens (los cuatro); L4 por áreas; L5 Planificador; L6
   Personalización; L7 Windi; L8 Cuenta; Escritorio, widgets e instalador; L9 ajuste al Figma; errores y lecturas
   silenciosas pendientes; documentación final. Reordénalo si encuentras dependencias reales.
3. **`RELEVO.md`: la regla del relevo y la plantilla de traspaso.** Cómo toma una persona la siguiente pieza libre, qué
   comprueba al empezar (`git pull --rebase`, `git log`, `COLA.md`, prueba rápida), cómo cierra (pruebas del módulo,
   commit, push, marcar la pieza), y cómo deja el punto de retoma si se queda sin límite a la mitad (qué commit hay, qué
   falta, qué probó). Debe caber en media página. Incluye la regla «una sola persona escribe a la vez» y qué hacer si
   `main` cambió.
4. **`SPEC_<área>.md`, uno por área** (Marco y componentes base, Planificador, Personalización y widgets, Windi, Cuenta y
   Acceso, Configuración, Escritorio y capa, Instalador y web). Por pantalla o flujo: id de marco en Figma (claro y los
   otros temas), estructura, textos literales, medidas (tamaño de letra, padding, alto de botón, radio), estados (vacío,
   cargando, error, sin conexión, deshabilitado, foco, hover), teclado y foco, datos de ejemplo, y los errores previsibles
   con su código y mensaje. Cada dato medible sale del Figma por `get_design_context`, no de memoria. Cuando algo no se
   puede medir, dilo.
5. **`TEMAS_Y_TOKENS.md`**: tabla de las variables de color de los cuatro temas (con la hex resuelta), tipografías por
   tema (Nunito claro/oscuro, Quicksand Rosa, Space Grotesk Enfoque, Rubik en Acceso, web, instalador y píldoras),
   variables nuevas (`seleccion`, `velo`, `borde_campo`, `burbuja_propia`, `error`, `sombra`, `estado_*`, `relleno_*`),
   equivalencias con los tokens del código (`apps/desktop/src/ui/tema/`), contrastes calculados y qué tokens faltan.
6. **`DECISIONES.md`**: la tabla de las dudas de `DUDAS.md` (P43, P43b, P44) con el valor adoptado, el motivo («igual al
   prototipo» o la recomendación), el destino (pieza de la cola) y una columna «Paula cambia a:» vacía. Incluye también
   las contradicciones Figma–documentos (instalador frente a `contratos.md` 778–791, «Mover a» frente a reordenar
   arrastrando, `Esc` y nombre emergente, nombres «Ocultar/Ampliar menú» frente a «Contraer/Expandir»). Para cada una,
   gana el Figma y se escribe el RD que corresponde.
7. **(Ya resuelto: opción A, ver §2. Omitir.)** Propuestas visuales del contraste de `accion` en claro (para que Paula elija antes de congelar tokens): 3 opciones
   en una sola captura o artefacto, mostrando botón principal, foco, borde de campo, enlace y barra lateral en «Windgets
   claro». Reglas: el cian `#00D9E2` puede quedar como relleno; foco, bordes y texto deben llegar a 3:1 (texto de 14 px a
   4,5:1); **sin la unión violeta + cian que a Paula no le gusta** (por ejemplo, variantes de un solo tono, o cian con
   texto oscuro y foco oscuro, o un cian más profundo). Calcula cada contraste y dilo en la captura. No toques el Figma
   sin que Paula lo pida: haz las propuestas en una hoja temporal fuera del contenido (x=20000, o 90000 en páginas anchas)
   y quítala, o en un artefacto local.
8. **`PRUEBAS_Y_CIERRE.md`**: qué verificación corre cada pieza (solo el módulo tocado) y cuál el cierre (`clean verify`,
   `/verificar` en Docker, Playwright de geometría ±2 px, claro y oscuro, 1200×800 y 960×600, escala 100–150 %); qué
   evidencia se guarda; la lista de prueba manual en Windows para Paula; y la **documentación que debe quedar hecha al
   cerrar** (RD nuevos en `rediseno.md`, `DUDAS.md` al día, contratos y tipos, estado y manual).
9. **Aviso para la implementación**: los RD nuevos que exige el Figma (paleta clara y `seleccion`; Secundario en sección
   activa; presentación unificada de widgets; Reloj con ciudad y Calendario con mes; Kanban «+N más»; «Organizar widgets»
   con barra flotante; interruptor de vista del Kanban; botones de Tipo y Prioridad; Windi con el estilo de la landing;
   velo; etc.). Numéralos desde RD-106 (RD-106 ya existe sin commit en los formularios) y dilo.

10. **`CONSISTENCIA.md`: el sistema visual único** (la regla que resuelve los fallos de los prototipos). Escala de
    espaciado, radios por tipo de control, grosores de borde y cuándo se usa cada uno (reposo, hover, foco, error,
    seleccionado), sombras, alturas de control, tamaños de letra y pesos, tamaño de íconos, z-index y capas
    (menú, emergente, mensaje, velo), y los estados de todo control. Una tabla «componente → tokens» y la lista de
    **incoherencias halladas en el Figma** con la decisión tomada. Cada valor se mapea a un token de
    `apps/desktop/src/ui/tema/`; si no existe, se crea en la pieza de temas.
11. **`ANIMACIONES.md`**: catálogo cerrado de animaciones de los prototipos (abrir y cerrar ventana emergente, menú,
    mensaje, cambio de pantalla, panel lateral, arrastrar y soltar, Kanban, calendario, Windi y sus ojos, hover y foco,
    carga y vacío, instalador). Para cada una: disparador, propiedades, duración, curva, retraso, y qué pasa con
    `prefers-reduced-motion`. Los valores salen de las interacciones del Figma (Smart Animate, tiempos) y, si el Figma no
    los define, de **una escala única** de duraciones y curvas que fijas tú (tokens `--dur-*`/`--ease-*`). Incluye la
    prueba de cada una (se comprueba la clase o el estilo calculado, no a ojo).
    **Primero inventaría las animaciones que los prototipos ya plantean** (interacciones, Smart Animate, tiempos,
    transiciones entre marcos) y respétalas. Regla de calidad de Paula: **nada brusco; todo fluido** y coherente con la
    app y con el ratón. Por eso el documento fija además:
    - transiciones en **todo** control interactivo (hover, foco, pulsado, soltado) con curvas suaves de salida
      (`ease-out`/curva propia), nunca cambios instantáneos de color, borde o sombra;
    - entradas y salidas **simétricas** (lo que aparece desaparece con la misma curva, algo más corta) y sin saltos de
      diseño (animar solo `transform` y `opacity`; evitar animar `width`/`height`/`top`/`left`);
    - respuesta al ratón: retroalimentación inmediata (≤100 ms al pulsar), arrastre que sigue al puntero sin retraso,
      suelta con asentamiento suave, desplazamiento con inercia natural y sin parpadeos de carga (esqueleto o fundido);
    - una escala única de duraciones (por ejemplo 100/160/240/360 ms) y de curvas, usada en toda la app, con el
      criterio de qué duración corresponde a qué tamaño de cambio; animaciones interrumpibles (pueden cancelarse a mitad
      sin saltar) y sin que dos animaciones compitan por la misma propiedad;
    - rendimiento: 60 fps en 1200×800 y 960×600, sin forzar relayout; pruebas con el estilo calculado y una
      comprobación de que ninguna transición use `transition: all` ni supere el tope de duración.
12. **`ERRORES_Y_PRUEBAS.md`**: matriz de todos los errores previsibles de la aplicación y de los prototipos
    (formularios, red, sin conexión, sesión, datos inválidos, límites de largo y de fecha, widgets, Windi, instalador,
    sincronización, permisos). Columnas: situación → código estable → mensaje literal → dónde se ve (campo, mensaje arriba
    a la derecha, ventana) → pantalla del Figma → pieza de la cola → **prueba** (unitaria, de componente o petición real).
    Aplica la regla de errores visibles de `CLAUDE.md`: ningún previsible termina en el genérico; revisa cada ruta al
    manejador genérico.
13. **`TRAZABILIDAD.md`**: la tabla de garantía. Una fila por pantalla/estado del Figma (id de nodo) → pieza de la cola →
    spec → prueba automática (token, geometría ±2 px, texto, error, animación) o «manual». Al final, el conteo de filas
    sin prueba automática. La implementación termina cuando todas las filas están en verde o en la lista manual.

### 3 bis. Fases (obligatorio)

- **Fase A, plan (solo esto primero).** Entrega a Paula un plan de un máximo de 2 páginas: lista de documentos, orden de
  producción, qué subagentes leen el Figma (uno por página, devolviendo solo tablas), cómo se miden los tamaños de las
  piezas de la cola, los riesgos y las preguntas que sí necesitas hacerle (juntas, con opciones). **Espera su aprobación.**
- **Fase B, producción.** Escribe los documentos en este orden: `CONSISTENCIA`, `TEMAS_Y_TOKENS`, `ANIMACIONES`, `SPEC_*`,
  `ERRORES_Y_PRUEBAS`, `DECISIONES`, `TRAZABILIDAD`, y al final `COLA`, `RELEVO` y `LEEME` (la cola se ordena cuando ya
  sabes lo que cuesta cada pieza).
- **Fase C, auditoría.** Un subagente lee todo como una IA sin contexto e intenta implementar mentalmente tres piezas
  de distinto tamaño; lista lo que tendría que adivinar o abrir en el Figma. Se corrige hasta que no quede nada.

### 4. Cómo trabajar (gasto de tokens)

- Un solo chat que delega: tú planeas, preguntas y revisas; los subagentes leen el Figma y los documentos largos y te
  devuelven tablas. Dos agentes nunca escriben el mismo archivo.
- Las decisiones nuevas se preguntan **juntas, con opciones seleccionables** (`AskUserQuestion`), una sola vez al
  empezar, y solo si no están en el §2. Todo lo demás se resuelve con el criterio «igual al prototipo».
- Antes de dar un documento por terminado, un subagente `revisor` lo lee «como una IA que no sabe nada» y lista lo que
  tendría que adivinar. Corrige eso.
- Hora y fechas siempre en hora colombiana. Antes de fiarte de un `ESTADO.md`, mira su fecha.
- Al terminar, entrega a Paula en el chat: la lista de archivos, la tabla de decisiones para que revise y las 3
  propuestas del contraste. No subas nada.

---

## Notas de Paula para quien lee esto

- La cadena corre sobre **una sola cuenta**: una persona a la vez. El límite de uso de cada persona decide cuántas piezas
  hace; por eso `COLA.md` y `RELEVO.md` son lo primero que debe quedar bien.
- Plazo: documentos listos el viernes 27-nov; implementación del 28-nov al lunes 30-nov; martes 1-dic, cierre y entrega
  a las 4:00 p. m.
