# RELEVO: cómo tomar, seguir y traspasar las tareas de la fase 7

Última actualización: viernes 27-nov-2026 (hora colombiana, UTC-5). Entrega: **martes 1-dic-2026, 4:00 p. m. (UTC-5)**.

Este es el primer archivo que lee quien llega sin contexto y el último que actualiza al irse. Cada **sesión** de Claude Code
(una cuenta o un chat nuevo de cualquiera de las 4 personas) toma tareas (piezas) de `COLA.md` y, al terminar o al
quedarse sin límite de uso (≈ 5 h), deja el **traspaso** escrito para la siguiente. **El objetivo es todo `COLA.md`**:
se implementa hasta donde se pueda antes de la entrega, en el orden de la cola. Si sigues este archivo de arriba abajo, puedes empezar
sin preguntarle nada a nadie.

> **Cómo pedírselo a Claude.** En un chat nuevo, en la carpeta del repo, escribe:
> «Lee `docs/implementacion/RELEVO.md` completo y síguelo: arranca, toma la siguiente pieza de `COLA.md` y al irte deja tu
> fila en §11».

---

## §1. Qué estamos haciendo

- **Objetivo:** que la app de escritorio Windgets (`apps/desktop`, Tauri: Rust + React/TypeScript) funcione y quede igual
  a los prototipos del Figma **A3Z03L20swFyo8qdP9jETF** («Windgets (Copy)») en los **cuatro temas** (claro, oscuro, Rosa y
  Enfoque). Todas las funciones nuevas que dibujan los prototipos se implementan.
- **Fases** (`PLAN.md`): 0-3 documentos (hechas), 4 auditoría, 5 subir los documentos (este PR), 6 herramientas de prueba
  (son las primeras piezas de la cola), **7 implementación por tareas**, 8 pruebas finales contra los prototipos,
  9 documentación final y entrega.
- **Orden de autoridad** cuando dos fuentes chocan: Figma A3Z03 → `docs/rediseno.md` y sus RD → HU, CA, ET y
  `docs/contratos.md` → `docs/rediseno_cambios_implementacion.md`. Lo que el Figma dibuja y ningún CA define se hace como
  está dibujado y se anota en `docs/DUDAS.md`.
- **Quién decide:** las decisiones de producto (V-xx de `DECISIONES.md` §1 y las filas nuevas) las responde Paula. Todo
  lo demás (implementar, revisar, verificar, ramas, PR y fusiones) lo decide el equipo.

## §2. Mapa de documentos (qué leer y para qué)

Todo está en `docs/implementacion/`, salvo donde se dice otra cosa.

| Archivo | Para qué sirve | Cuándo lo lees |
|---|---|---|
| `RELEVO.md` (este) | Arranque, ciclo de trabajo, salida y bitácora de traspasos | Siempre, primero |
| `COLA.md` | Las 155 piezas en orden, con talla, archivos, dependencias, bloqueos y pruebas. Se marca `[x]` al cerrar | Siempre, para elegir pieza |
| `SPEC_*.md` (8) | Qué construir en cada área: medidas, tokens, textos literales, ids de nodo del Figma, tabla «capa → `data-testid`» y parte 9 con las piezas | Solo la de tu pieza |
| `DECISIONES.md` | Todas las decisiones vigentes. **§1 (V-01..V-07)** espera respuesta explícita de Paula; en el resto, la columna «Paula cambia a:» vacía significa aprobada | Si tu pieza tiene bloqueo V-xx o dudas de un valor |
| `TRAZABILIDAD.md` | Cada marco del Figma × 4 temas → pieza y prueba. Estados: Pendiente / Verde / Manual | Al cerrar una pieza (marcas sus filas) y en la fase 8 |
| `ERRORES_Y_PRUEBAS.md` | Catálogo de errores (códigos, mensajes, conflictos C-xx) y qué prueba cubre cada uno | Si tu pieza toca errores o mensajes |
| `TEMAS_Y_TOKENS.md` | Los cuatro temas: cada variable con su valor y contrastes | Piezas TK-* y todo lo visual |
| `ANIMACIONES.md` | Transiciones, duraciones y `prefers-reduced-motion` | Piezas con movimiento |
| `CONSISTENCIA.md` | Reglas que cruzan áreas (alias de códigos §6, D1-D17) | Si una spec parece contradecir a otra |
| `PLAN.md` | El plan completo y sus reglas | Si una regla de aquí no te alcanza |
| `PROMPT_CONTINUAR.md`, `TRASPASO_NOCHE.md` | Historia de cómo se escribieron los documentos | Casi nunca |
| `.trabajo/figma/F*.md` y `.trabajo/figma/huellas/*.json` | Inventario medido del Figma (445 huellas JSON) que citan las specs | Cuando la spec cita `F*.md`, y en las piezas F6-* |
| `.trabajo/DECISIONES_PAULA_26nov.md` | Las decisiones de Paula del 26-nov; las specs lo citan como **DP** | Cuando una fila cita `DP:nn` |
| `docs/rediseno*.md` | Spec del rediseño (RD-01..RD-106) y sus documentos de apoyo | Cuando la spec cita un RD |

`.trabajo/` está en `.gitignore`: en git solo entraron (a la fuerza) `figma/`, `DECISIONES_PAULA_26nov.md` y los tres
archivos que citan los documentos. Lo demás de `.trabajo/` (por ejemplo `ESTADO.md` y `bitacora.md`) es un apunte local
de cada máquina y **no** es fuente de verdad: la fuente es git, los PR y este archivo.

**Aún no existen** `LEEME.md` ni `PRUEBAS_Y_CIERRE.md` (los pide la fase 3; la pieza F9-02 los completa). Mientras no
existan, este archivo hace de entrada.

## §3. Preparar tu máquina (una vez por persona)

1. **Repo:** `git clone` del repo de Windgets y `git checkout` de la rama de trabajo (§5).
2. **Herramientas:** Git, `gh` con sesión iniciada (`gh auth status`), Docker Desktop (la skill `/verificar` corre la CI
   en un contenedor; no hace falta Rust ni Node 22 instalados) y, para correr la app de verdad, Rust y Node como dice el
   `README` del repo.
3. **Claude Code** abierto en la carpeta del repo. Las skills `/retomar`, `/verificar`, `/cerrar-paso` y
   `/siguiente-paso` vienen en `.claude/skills/` del repo. Los agentes `implementador`, `verificador` y `revisor` no vienen en el
   repo; si tu perfil no los tiene, trabaja sin agentes y respeta igual «una pieza a la vez».
4. **Conector de Figma** con tu propia cuenta (§4).
5. **Guardia:** algunos perfiles tienen un hook (`guardia_git.py`) que impide push a `main`/`develop`, push con fuerza y
   PR que no sean borrador. Si el tuyo lo tiene, no lo esquives ni lo debilites: abre el PR en borrador y fusiona desde
   GitHub. Ramas y PR, como el equipo prefiera (§5).
6. **Secretos:** solo `.env.example` está en el repo, con valores vacíos. Tu `.env` real nunca se sube.

## §4. Figma: acceso, cupo y reglas

- **Solo lectura.** Con `use_figma` nada se crea, mueve, renombra ni borra. Nunca `get_metadata` de páginas enteras.
  Si un prototipo parece mal, se anota en `DECISIONES.md`; el Figma no se toca.
- **Cupo por cuenta:** Education o Professional con asiento Full/Dev: **≈ 200 llamadas al día y 10 por minuto**. Starter o
  asientos View/Collab: 20 **al mes** (no sirve). Al empezar, `whoami` para ver plan y asiento. Si tu cuenta no alcanza,
  pide acceso con asiento Full o que lea alguien con cupo; anótalo en tu fila de §7.
- **Comprueba los ids:** los ids de los documentos se escribieron sobre el A3Z03. Haz `get_design_context` de `79:5` y
  confirma que es el mismo marco. Si trabajas en una copia y no coincide, lee el original con permiso de vista.
- **Ahorra llamadas:** primero la spec y las huellas JSON (`.trabajo/figma/huellas/<id>.json`, y desde F6-05 en
  `apps/desktop/e2e/figma/`); el conector solo para comprobar: `get_design_context` en claro y **una** muestra de otro
  tema, y **una** `get_screenshot` al final de la pieza. No se repite por tema.

## §5. Rama, push y PR

- **Ramas y PR:** cada quien los organiza como quiera. Hoy los documentos están en la rama `paso-45-documentos-rediseno`
  (PR [#69](https://github.com/Forkthec/windgets/pull/69)).
- **Fusión:** cuando se vaya a hacer un traspaso (para que la siguiente sesión parta de lo último) o cuando el equipo lo
  decida.
- **Antes de empezar y antes de cada push:** `git pull --rebase`, para no pisar el trabajo de la sesión anterior.

## §6. Reglas que no se negocian

1. **No inventes funciones.** Lo que no está en un CA, una ET, un contrato, un modelo de `docs/` o el Figma no se construye.
2. **Commit por pieza** (un commit por capacidad si la pieza es grande), y **cada commit compila**. Títulos:
   `rediseno: <verbo y objeto>`, `HE-nn-HUnn: <verbo y objeto>`, `RT-nn: <tema>` o `infra: <tema>`. **Sin
   `[IA-ASISTIDO]`** en el título ni en el cuerpo; el commit termina con el trailer
   `Co-Authored-By: <modelo> <noreply@anthropic.com>`. La marca `[IA-ASISTIDO]` va solo en el título del PR.
3. **Pruebas:** una prueba por CA, ejecutada y en verde. Mientras construyes, solo las del módulo tocado y la geometría de
   sus pantallas. La verificación completa (`/verificar` con todos los pasos) una vez, sobre la punta, al cerrar un bloque.
   No se borra ninguna prueba ni se baja ninguna regla.
4. **Errores visibles:** todo fallo previsible tiene su código estable y un mensaje claro en el campo que corresponde;
   nunca termina en el genérico (`INTERNAL_ERROR`, 500, «Ocurrió un error»). Los errores de un formulario se devuelven
   todos a la vez. Compruébalo con una petición real, no solo leyendo.
5. **Migraciones:** una aplicada no se edita; se crea una nueva en `supabase/migrations/` y su equivalente en
   `docs/local/`. La única migración nueva prevista es la `0013` de la pieza **MG-00**.
6. **Lo «NO DEFINIDO»** va a `docs/DUDAS.md` con el valor neutro usado. Nunca inventes el valor de una V-xx abierta.
7. **Nada generado con IA se sube** al Drive ni a otro sitio compartido sin el sí de Paula para ese archivo (el código y
   los documentos de este repo en la rama de trabajo ya están autorizados). Nada se borra para siempre: solo papelera.
8. **Archivos compartidos:** catálogo de errores, `tokens.css`/`marco.css`, Postman, `contratos.md`, `DUDAS.md` y
   migraciones tienen una pieza dueña (tabla de `COLA.md` §1). Cada pieza escribe solo en su bloque sembrado por SEED-01.
9. **Hora:** siempre Colombia (UTC-5). En PowerShell `Get-Date`; Git Bash muestra UTC. Las horas de `gh` terminan en `Z`:
   réstales 5 h.

## §7. Arranque de cada sesión (10 pasos)

1. **Hora** con `Get-Date` (PowerShell).
2. **Lee la última fila de §11** (la bitácora): ahí está la pieza a medias y la siguiente.
3. **Git y CI:**
   `git fetch -q origin`, `git status --short --branch`, `git stash list`,
   `git log --oneline --decorate -10`,
   `gh pr list --state open --json number,title,headRefName,baseRefName,isDraft`,
   `gh pr checks <n>` de cada PR abierto. **Git gana** sobre cualquier apunte.
4. **Concilia:**
   - Cambios sin commit en tu máquina: son tu pieza a medias; lee el diff y sigue desde ahí.
   - Un commit que `COLA.md` no marca: márcalo `[x]` si tiene prueba y CI en verde.
   - Un commit sin push: `git pull --rebase` y push normal.
5. **CI en rojo** en tu rama de trabajo o en `main`: arreglarlo es la siguiente pieza, antes que cualquier otra.
6. **Figma:** `whoami` (plan y asiento) y `get_design_context` de `79:5` para confirmar los ids (§4).
7. **Mira las V-xx.** En `DECISIONES.md` §1, una V-xx está **resuelta** solo si la columna «Paula cambia a:» tiene
   texto o hay un commit/mensaje de Paula que la responde. Si está vacía, sigue abierta y sus piezas no se tocan.
8. **Elige pieza:** la primera `[ ]` de `COLA.md` cuyo «Depende de» esté todo en `[x]` y cuyo «Bloqueada por» esté vacío o
   resuelto. Las primeras, en el orden de `COLA.md`, son las de la fase 6: F6-05, F6-01a…F6-04a, SEED-01, S10-SP, TK-*, MG-00.
9. **Reserva la pieza:** agrega en §11 una fila con hora, tu nombre y cuenta, y la pieza «en curso»; commit
   `infra: tomar <ID>` y push. Así nadie toma la misma.
10. **Lee la spec de la pieza** (sección y parte 9) antes de escribir código.

## §8. Ciclo de una pieza (`PLAN.md` fase 7, «Cada pieza»)

1. **Lee su spec**: medidas, tokens, textos literales, ids de nodo y la tabla «capa → `data-testid`».
2. **Comprueba con el conector** los nodos de la pieza: `get_design_context` en claro y una muestra de otro tema.
3. **Implementa.** Pon cada `data-testid` que pide la spec. Colores solo por token (`tokens.css`), nunca hex sueltos.
   Morado y cian nunca en el mismo control; donde el Figma los junte, tinta `#0F2A33`; el cian solo como relleno, con
   texto `#0B2A2E`.
4. **Pruebas del módulo** (Vitest/`cargo test`) y la **geometría** de sus pantallas (Playwright contra la huella JSON:
   ±2 px en cajas, color exacto por token, misma fuente, mismo texto; 1200×800 y 960×600).
5. **Una comparación** con `get_screenshot` del nodo frente a la app. Si hay diferencias, corrígelas dentro de la pieza:
   **máximo dos vueltas**. Lo que siga distinto va a `DECISIONES.md` (fila nueva, «Paula cambia a:» vacía) o a una pieza
   nueva al final de `COLA.md`.
6. **Commit** (§6 regla 2), `git pull --rebase`, push, y marca `[x]` en `COLA.md` y «Verde» en sus filas de
   `TRAZABILIDAD.md` cuando la CI quede en verde. Lo que no se puede automatizar se marca «Manual».

**Tallas** (`PLAN.md`): S ≈ 10 % del límite de 5 h, M ≈ 25 %, L ≈ 45 %. Si una L no te cabe en lo que te queda, no la
empieces: toma una S o una M.

## §9. Al irte (o cuando te quede poco cupo)

Hazlo **antes** de que se acabe el límite: con menos de ~15 % de cupo, deja de construir y cierra.

1. **Deja un commit que compile.** Si la pieza está a medias y no hay un punto que compile, no la subas a medias:
   guárdala con `git stash push -m "<ID> a medias"` en tu máquina, o súbela en una rama aparte
   `paso-NN-<ID>-a-medias` (nunca a una rama que otros usan) y nómbrala en tu fila.
2. **Llena tu fila** en la bitácora de abajo (reemplaza «en curso» por lo real):
   fecha y hora (UTC-5), quién y cuenta, rama y punta (`git rev-parse --short HEAD`) con o sin push, piezas cerradas `[x]`,
   pieza a medias (qué falta, archivos, pruebas en rojo con su mensaje), estado de la CI, cupo de Figma gastado,
   decisiones nuevas para Paula (ID de la fila en `DECISIONES.md`) y siguiente pieza.
3. **Commit** `infra: dejar el traspaso de <nombre>` y push.

## §10. Qué hacer si…

- **`main` o la rama de trabajo están en rojo:** la siguiente pieza es arreglarlo. No sigas la cola con la CI rota.
- **Tu pieza depende de una decisión abierta:** no la construyas ni inventes el valor. Salta a la siguiente pieza libre
  y anota la pregunta en tu fila. Las V-01..V-07 se respondieron el 27-nov (§12); si aparece una nueva, va así.
- **`git pull --rebase` da conflicto en un archivo compartido:** conserva los dos bloques (cada pieza tiene el suyo);
  si no es obvio, para y pregunta en el grupo. Nunca resuelvas con push con fuerza.
- **El spike S10 (notificación de Windows con botones) falla:** ya está decidido (V-03): solo aviso en la app. Escribe el
  resultado del spike en `DECISIONES.md` y sigue con EC-15r/EC-15 con esa decisión.
- **Se acaba tu cupo de Figma:** para de abrir nodos y trabaja con las huellas JSON y las specs, que traen los valores
  medidos. Anótalo en tu fila.
- **Un comando se bloquea por el guardia** (en los perfiles que lo tienen): no lo esquives ni lo debilites. Deja el
  comando exacto en tu fila para que lo corra una persona.
- **La spec y el Figma no coinciden:** gana el Figma (§1, orden de autoridad); anótalo en `DUDAS.md` y, si cambia una
  regla, en `DECISIONES.md`.
- **No sabes si algo está en el alcance:** si no está en un CA, ET, contrato, modelo o el Figma, no se hace.

## §11. Bitácora de traspasos

La **última fila manda**. Una fila por sesión: se abre al tomar la pieza (§7 paso 9) y se completa al irse (§9).

| Fecha y hora (UTC-5) | Quién y cuenta | Rama y punta | Cerradas `[x]` | A medias (falta, archivos, pruebas en rojo) | CI | Cupo Figma | Decisiones para Paula | Siguiente |
|---|---|---|---|---|---|---|---|---|
| 2026-11-27 (ejemplo de formato) | Ana, cuenta B | `paso-45-documentos-rediseno` @ `abc1234`, con push | F6-05, F6-01a | TK-01: falta la sección de Rosa en `tokens.css`; `tokens_cuatro_temas` en rojo | verde | 38 de 200 | fila nueva D-31 en `DECISIONES.md` | TK-01 |
| 2026-11-27 | Documentos (fases 0-3) | `paso-45-documentos-rediseno` @ `0fd1427`, con push; PR #69 en borrador | Fases 0-3 (documentos) | Faltan `LEEME.md` y `PRUEBAS_Y_CIERRE.md` (F9-02); V-01..V-07 respondidas el 27-nov | — | — | — | F6-05 (primera de `COLA.md`) |
| 2026-11-27 14:52 a 16:19 | JDiegoG12 (Claude Code, cuenta de Figma con asiento Full en equipo Education) | `paso-46-herramientas-prueba` @ `7665f30`, con push; sin PR | F6-05, F6-01a, F6-04a, F6-02, F6-03 (fase 6 completa) | Ninguna. Ojo: `8c8e639` no compila con `tsc -b`; lo corrige `995e490`. Al verificar en local corre también `build` (`tsc -b` revisa las pruebas de `src/`). Para quien sigue: las pruebas de tokens (`src/ui/tema/tokens_cuatro_temas.test.ts`) y de movimiento (`src/ui/tema/movimiento.test.ts`, `e2e/ANIMACIONES.spec.ts`) tienen una lista `PENDIENTES`: cada pieza TK-* o AN-* borra sus líneas al cerrar. Cada pantalla nueva registra sus filas `data-testid` en `e2e/geometria/pantallas.ts` y las mide con `compararPantalla` (`e2e/geometria/arnes.ts`). `pnpm --filter desktop comparar` deja la evidencia en `.trabajo/comparacion/` | verde (`7665f30`) | 1 de 200 (`whoami`); `79:5` sin comprobar: es una página entera y §4 prohíbe leerla con `get_metadata` | fila nueva FC-HUELLAS en `DECISIONES.md` §7 (solo 57 huellas son completas; F6-02 mide con la spec cuando la huella no trae caja) | SEED-01 (M); luego S10-SP o C3-01 |
| 2026-11-27 16:40 a 17:02 | JDiegoG12 (Claude Code) | `paso-47-siembra` @ `5dff077`, con push; sin PR (la fase 6 se fusionó en `main` con el PR #70, `fd3ebb6`) | SEED-01 | Ninguna. Bloques por área sembrados en `errores.rs`, `messages.rs`, `tokens.css`, `marco.css`, `contratos.md` y `DUDAS.md`: cada pieza escribe solo en el suyo. Sin Postman: no hay API HTTP (anotado en `DUDAS.md`, P47). **C3-01** cierra unos «cambios locales» que no están en git ni en ninguna rama: lo cierra quien los tenga en su máquina. **S10-SP** necesita Rust y Windows para correr el spike: esta máquina no tiene Rust | verde (`5dff077`) | 0 | — | TK-01 (M, libre); C3-05 y C3-06 (S, libres); S10-SP en una máquina con Rust |
| 2026-11-27 17:20 a 17:45 | JDiegoG12 (Claude Code) | `paso-48-temas-y-tokens` @ la punta, con push; sin PR (SEED-01 se fusionó en `main` con el PR #71, `e6a44ce`) | TK-01 | Ninguna. **TK-02 bloqueada por V-08** (nueva, `DECISIONES.md` §1): Rosa y Enfoque no tienen plantilla en el catálogo ni sus tres colores definidos, y el código reconoce un tema de Windgets por esos tres colores. De TK-02 dependen TK-01v, L4-08 y PW-01 | verde (`cf9f2e1`) | 0 | **V-08** para Paula | TK-03 (M) o TK-05 (M), libres; TK-04 (S) necesita las fuentes Quicksand y Space Grotesk |
| 2026-11-27 18:01 a 18:15 | JDiegoG12 (Claude Code) | `paso-49-radios-trazos-sombras` @ `b9de2ae`, con push; PR del bloque abierto (TK-01 se fusionó en `main` con el PR #72, `712dfd4`) | TK-03 | Ninguna. Los tokens de §2 y §4 de `TEMAS_Y_TOKENS.md` están en el bloque TK-03 de `tokens.css` (nombres `--wg-radio-*`, `--wg-trazo-*`, `--wg-sombra-*`, `--wg-separacion-foco`, `--wg-radio-anillo-foco*`); `aplicarTokens` escribe `--wg-sombra-color`. Ningún control los usa aún: cada pieza los aplica a sus controles (sin geometría propia en TK-03, no hay pantalla nueva). La forma del widget (Rectas/Base/Redondas) la aplica PW-11 sobre `--wg-radio-widgets`. TK-05 cambia `--wg-radio`, `--wg-borde-ancho` y `--wg-sombra` (§8.3). TK-02 sigue bloqueada por V-08 | verde en `/verificar` (lint, build, tipos, Vitest 1147); CI del PR | 0 | — (V-08 sigue abierta) | TK-05 (M, libre); TK-04 (S) necesita las fuentes |
| 2026-11-27 18:20 a 18:45 | JDiegoG12 (Claude Code) | `paso-50-tokens-valores` @ `972a9b4`, con push; PR del bloque abierto (TK-03 se fusionó en `main` con el PR #73, `93b9363`) | TK-05 | Ninguna. Anotado como **RD-107** en `docs/rediseno.md` (contradice HE-02-HU06-ET05: tamaños ahora 12, 14 y 18 px; y el color de la opción elegida de RD-99, que pasa a `seleccion`). Los trazos que eran `--wg-borde-ancho` × 2 quedan fijos en 2 px (`--wg-trazo-seleccion`) para no engrosarse con el trazo de 1,5. `--wg-mensaje-error` sigue solo para el botón destructivo principal (RD-72, P44-417). Dos dudas nuevas en `DUDAS.md` (P47): relleno de estado de los temas derivados y fuente del tema por defecto (Rubik, sin cambio). En `tokens_cuatro_temas.test.ts` solo quedan las líneas de TK-02 | verde en `/verificar` (lint, build, tipos, Vitest 1159, Playwright 85); CI del PR | 0 | Las dos dudas de TK-05 (`DUDAS.md` P47); V-08 sigue abierta | C3-05 o C3-06 (S, libres); TK-06 (M, V-04 ya respondida); TK-04 necesita las fuentes |
| 2026-11-27 18:50 a 19:20 | JDiegoG12 (Claude Code) | `paso-51-ojos-y-clima` @ `59f2c52`, con push; PR del bloque abierto (TK-05 se fusionó en `main` con el PR #74, `0db10ff`) | C3-05 | Ninguna. Anotado como **RD-108**. `OjosDeWindi` dibuja los ojos en las coordenadas del Windi de 48 (prop `estado`: `reposo`, `escribiendo`, `cerrados`); nuevo `DibujoDeWindi` (cuerpo `#FFCA22` con trazo `borde`, boca, ojos) en `ui/OjosDeWindi/`. Sin el cuerpo, los ojos `#27152B` no se verían en los temas oscuros, así que el botón flotante, la cabecera del panel y el widget usan ya el dibujo, con sus tamaños de antes (28 y 64). **Para C3-03 y WI-*:** el botón de 48, las ondas, el punto de propuesta, quitar el dibujo de la cabecera (MB-05 «sin ojos en la cabecera») y pasar `estado="cerrados"` sin conexión o con error. Sin huella JSON del nodo: la geometría de los ojos se mide en Vitest contra F0b §3 y los trazos del Figma | verde en `/verificar` (lint, build, tipos, Vitest 1169, Playwright 85); CI del PR | 4 llamadas (`create_session`, `get_metadata` y dos `get_design_context` de `2004:334`) | — | C3-06 (S, libre); TK-06 (M) |
| 2026-11-27 19:30 a 19:50 | JDiegoG12 (Claude Code) | `paso-52-iconos` @ `e8cc5ec`, con push; PR del bloque abierto (C3-05 se fusionó en `main` con el PR #75, `121592e`) | C3-06 | Ninguna. Se construyó MB-28 (el título «Íconos del clima» de `COLA.md` no coincide con su spec; los del clima siguen en P43b-407; anotado en `DUDAS.md`). Anotado como **RD-109**. Íconos nuevos en `ui/Iconos`: `IconoSincronizado`, `IconoSinConexion`, `IconoSincronizando` (giro, dibujo neutro en `DUDAS.md`); `IconoAlerta` redibujado del Figma. Ninguna pantalla usa aún los tres nuevos: los pone el indicador (MB-04). `movimiento.test.ts`: una línea nueva en `PENDIENTES` para AN-06 (`.wg-icono--girando` con 1s linear hasta que existan `--dur-giro` y `--ease-lineal`) | verde en `/verificar` (lint, build, tipos, Vitest 1185, Playwright 85); CI del PR | 3 llamadas (`get_design_context` de `2003:187`, `2251:4951`, `80:57`) | Las dos de C3-06 en `DUDAS.md` | TK-06 (M); TK-04 necesita las fuentes |
| 2026-11-28 02:42 a 03:00 | JDiegoG12 (Claude Code) | `paso-53-movimiento` @ `c8c1d98`, con push; PR del bloque abierto (C3-06 se fusionó en `main` con el PR #76, `faef3a4`) | TK-06 | Ninguna. Tokens de `ANIMACIONES.md` §3 en un bloque `:root` TK-06 de `tokens.css` (`--dur-*`, `--ease-*`, `--mov-*`); ningún control los usa aún: los aplican AN-01 a AN-07. Regla 10: un solo bloque `prefers-reduced-motion` en `tokens.css` (los `--mov-*` a 0, `--dur-corto` y `--dur-medio` a 100 ms, `animation: none` en los lazos); los cuatro bloques sueltos que había (aviso, carga, «Sincronizando…», ojos) se juntaron en él, sin cambio a la vista. Quitar `transform` de los FLIP, la perilla y el progreso (regla 10 c) queda para la pieza AN de cada uno, en ese mismo bloque. En `movimiento.test.ts` salen las 14 líneas de TK-06; quedan las de AN-02, AN-06 y AN-07. `ANIMACIONES.spec.ts` no tenía líneas de TK-06. La fila de reserva decía 27-nov: ya era 28-nov en Colombia | verde en `/verificar` (lint, build, tipos, Vitest 1190, Playwright 85); CI del PR | 0 | — | AN-01, AN-03, AN-06 o AN-07 (ya sin bloqueo de TK-06); TK-04 necesita las fuentes |

## §12. Decisiones del 27-nov que cambian la implementación

Detalle en `DECISIONES.md` §1 (columna «Paula cambia a:»), `COLA.md` «Cierre» y `TRAZABILIDAD.md` «Decidido el 27-nov».

| Tema | Decisión | Qué cambia |
|---|---|---|
| V-04 avisos | **D7**: franja superior (y=4), un aviso visible, ancho máx. min(480, 966 − miga − 16). El Error se queda hasta cerrarlo | Se rehacen `MensajeResultado` y `tokens.css` (C3-01 y piezas de V-04) y se ajustan las specs que cita la fila V-04 |
| V-02 errores | Se aplican C-13, C-17, C-18, C-19 y C-20 | C-19: el literal del Figma «Error de sincronización · N pendientes» reemplaza el de HE-01-HU01-CA05 |
| V-03 recordatorio | Si el spike no logra botones: solo aviso en la app | Sin notificación de Windows en ese caso |
| V-01 segundo plano | Todo visible: código estable y aviso | ER-04 |
| V-05 P43 | Se corrigen los 8 previsibles | PW-10, PL-02, PL-13 |
| V-06 | D15 ventana maximizada; D17 ejemplos de formato | AC-01..AC-04, ventana principal |
| V-07 | Contrastes: ajustar la variable lo mínimo; Q1-Q3 y textos propuestos, aprobados | TK-*, catálogo |
| Alcance | Objetivo todo; tallas aprobadas; CF en L6; PL-DENS aparte; R11→PW-11, R12→AC-01, R27-R29→instalador | — |
| Marcos | `236:142` → MB-27; `2003:266` referencia; MB-02: comprobar el tema de cada versión en el Figma | — |
| Pruebas | Manual: escritorio, instalador, escala, bandeja, notificaciones. HE-06-HU04-CA04 se retira (CA06). Los 13 de Escritorio llevan prueba | — |
| Specs | Aprobadas para empezar; se revisan después y pueden cambiar | — |
