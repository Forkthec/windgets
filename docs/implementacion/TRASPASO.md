# TRASPASO: siguientes pasos para el próximo agente

Escrito el sábado 28-nov-2026, 05:50 (hora de Colombia, UTC-5), al cerrar la sesión de JDiegoG12 con Claude Code.
Entrega: martes 1-dic-2026, 4:00 p. m. Este archivo no reemplaza a [`RELEVO.md`](RELEVO.md): lo complementa con el
estado exacto de hoy y con lo aprendido en la sesión. Si algo de aquí choca con `git`, `COLA.md` o `RELEVO.md`, gana
eso: **git gana sobre cualquier apunte**.

## 1. Estado al cerrar

- `main` en el commit «P58: traspaso» (este archivo), justo después de `6afd937` (P57, AN-03). **No quedan PR
  abiertos, ni cambios sin commit, ni stash.** La CI de `main` está en verde.
- No queda ninguna rama de trabajo a medias: empieza la tuya desde `main` actualizado.
- La última fila de `RELEVO.md` §11 es la de AN-03.
- Piezas cerradas en esta sesión, una por PR (todos fusionados con squash):

| PR | Pieza | Qué dejó | RD |
|---|---|---|---|
| #72 | TK-01 | 11 variables de color nuevas | — |
| #73 | TK-03 | Radios, trazos, sombras y anillo de foco (bloque TK-03 de `tokens.css`) | — |
| #74 | TK-05 | Nombres y valores del Figma en los tokens | RD-107 |
| #75 | C3-05 | `OjosDeWindi` y `DibujoDeWindi` | RD-108 |
| #76 | C3-06 | Íconos de estado (Sincronizado, Sin conexión, Sincronizando, Alerta) | RD-109 |
| #77 | TK-06 | Tokens `--dur-*`, `--ease-*`, `--mov-*` y bloque único de «reducir movimiento» | — |
| #78 | AN-06 | Esqueleto de carga (`ui/Esqueleto`), fundido del indicador de sincronización | RD-110 |
| #79 | AN-07 | Hover del día del Calendario, mensajes y ojos de Windi | RD-111 |
| #80 | AN-01 | `ui/movimiento/useSalidaAnimada.ts`: entrada y salida de ventanas y menús | RD-112 |
| #81 | AN-03 | Hover, foco y pulsado de todos los controles; perilla del interruptor | RD-113 |

## 2. Arranque (haz esto primero)

1. Lee completos [`docs/AGENTS.md`](../AGENTS.md) (la entrada única del repo) y [`RELEVO.md`](RELEVO.md). Sigue el
   arranque de `RELEVO.md` §7 (10 pasos) y el ciclo de §8.
2. Hora en Colombia: `Get-Date` (PowerShell) o `TZ=America/Bogota date` (Git Bash). **Usa siempre esa hora** en las
   filas del relevo; en esta sesión una fila quedó con el día anterior por no mirarla.
3. Concilia git y CI:
   ```bash
   git fetch -q origin && git status --short --branch && git stash list
   git log --oneline --decorate -10
   gh pr list --state open --json number,title,headRefName,isDraft
   ```
   Si alguien más trabajó después de este traspaso, su fila en `RELEVO.md` §11 y su PR mandan.
4. Si la CI de `main` está en rojo, arreglarla es la siguiente pieza.

## 3. Cómo verificar en esta máquina (no hay Node 22 ni Rust locales)

El repo pide Node 22; la máquina tiene Node 24 y no tiene `node_modules` ni Rust. **Todo se verifica en Docker** con
la imagen `windgets-ci` (ya construida; si falta: `docker build -f herramientas/verificacion/Dockerfile -t windgets-ci
herramientas/verificacion`). Es la skill `/verificar` (`.claude/skills/verificar/SKILL.md`). Desde la raíz, en Git Bash:

```bash
mkdir -p .trabajo
MSYS_NO_PATHCONV=1 docker run --rm -e PASOS="lint build tipos vitest e2e" \
  -v "$(cygpath -w "$PWD"):/src:ro" -v "$(cygpath -w "$PWD/herramientas/verificacion"):/scripts:ro" \
  -v windgets-cache:/cache -v windgets-cargo:/opt/cargo/registry \
  windgets-ci bash /scripts/verificar.sh > .trabajo/ultima.log 2>&1
grep "^=== " .trabajo/ultima.log | paste - -        # verde solo si todas las «=== fin (N)» tienen N = 0
grep -n "Tests \| passed\| failed\| FAIL " .trabajo/ultima.log
```

- Corre siempre el paso `build` además de `tipos`: `tsc -b` revisa también las pruebas.
- Si tocas Rust o SQL, agrega `fmt clippy test` (y `sql` si tocas `supabase/`). El paso `windows` falla en el
  contenedor por falta de `lib.exe`: eso es del entorno, no del código. S10-SP necesita Rust en Windows de verdad.
- **Prettier** (el lint falla si un archivo no está formateado). `.trabajo/` está en `.gitignore`; si no tienes
  `.trabajo/fmt.sh`, créalo con esto y córrelo con `bash .trabajo/fmt.sh <archivos>`:
  ```bash
  #!/usr/bin/env bash
  cd "$(dirname "$0")/.."
  MSYS_NO_PATHCONV=1 docker run --rm -v "$(cygpath -w "$PWD"):/src" windgets-ci bash -c \
    'cd /src && npx --yes prettier@$(node -p "require(\"./package.json\").devDependencies.prettier.replace(/[^0-9.]/g,\"\")") --write "$@" 2>&1 | grep -v "npm notice"' _ "$@"
  ```

## 4. Flujo de cada pieza (el que se usó en las 10 de arriba)

La usuaria autorizó: **«abre el PR de cada bloque de piezas y fusiónalo tú cuando todos sus checks estén en verde»**.

1. Rama `paso-NN-<tema>` desde `main` actualizado (el siguiente número es **59**).
2. Reserva: fila en `RELEVO.md` §11 con la hora y «<ID> en curso»; commit `infra: tomar <ID>` y push
   (`git push -u origin <rama>`). Hazlo **antes** de escribir código (en AN-01 se olvidó).
3. Lee la spec de la pieza (`COLA.md` da sección y líneas) e implementa solo lo que dice un CA, una ET, un contrato,
   un modelo o un RD (`CLAUDE.md` regla 1). Lo NO DEFINIDO va a `docs/DUDAS.md` con el valor neutro usado.
4. Pruebas: una por CA (o por fila del catálogo), ejecutadas y en verde. Verifica con Docker (§3).
5. Si el cambio se ve en pantalla y contradice una HU, anótalo como **RD-nn** en `docs/rediseno.md` (el último es
   **RD-113**) y, si cambia una HU, una línea en «Pendiente para la edición final».
6. Commit `rediseno: <verbo y objeto> (<ID>)` (o `HE-nn-HUnn:`, `RT-nn:`, `infra:`), sin `[IA-ASISTIDO]`, terminado en
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
7. Marca `[x]` en `COLA.md`, reemplaza tu fila «en curso» de §11 por la real; commit
   `infra: dejar el traspaso de <nombre> (<ID>)` y push.
8. PR en borrador con la plantilla `.github/pull_request_template.md`, título `PNN: <tema> (<ID>) [IA-ASISTIDO]`, cuerpo
   terminado en `🤖 Generated with [Claude Code](https://claude.com/claude-code)`:
   ```bash
   gh pr create --draft --base main --title "P59: … (<ID>) [IA-ASISTIDO]" --body-file <archivo>
   gh pr checks <n> --watch --interval 30
   gh pr ready <n> && gh pr merge <n> --squash
   git checkout main && git pull && git checkout -b paso-60-<tema>
   ```
   Si un check falla, lee el log (`gh run view <id> --log-failed`), corrige en la misma rama y vuelve a esperar.

## 5. Qué sigue: piezas libres hoy

Calculado sobre `COLA.md` al cerrar: «Depende de» todo en `[x]` y sin V-xx abierta. Las V-01 a V-07 están respondidas
(`RELEVO.md` §12, decisiones del 27-nov); **solo V-08 sigue abierta** (Rosa y Enfoque: no toques TK-02 ni inventes sus
colores). Vuelve a comprobarlo, que otro agente puede haber avanzado.

**Orden recomendado** (primero lo que desbloquea más):

| Pieza | Talla | Por qué ahora |
|---|---|---|
| L4-02 Botón | M | Desbloquea PL-01, PL-02 y CF-01 |
| L4-03 CampoTexto | M | Desbloquea AC-01 a AC-09 |
| L4-04 Interruptor | S | Desbloquea CF-03. Ojo: la perilla ya se mueve con `transform` y `--wg-recorrido-perilla` (AN-03) |
| L4-10 Ventana, barra lateral, indicador, fondo, saludo | M | Desbloquea CF-05 |
| AN-05 Arrastre y asentamiento | M | Desbloquea PW-14. V-05 está respondida |
| AN-04 Pantallas, panel de Windi, barra lateral | M | V-06 está respondida (D15, D17) |
| L4-05, L4-11, L4-12 | M | Componentes base |
| L4-13 | S | Solo lectura; anota en `DECISIONES.md` |
| MG-00 Migración 0013 | L | Desbloquea MG-02..MG-07, EC-04, CF-02. Necesita `sql` en `/verificar`; **nunca** edites 0001-0012 |

También libres: TK-04 (necesita los archivos de las fuentes Quicksand y Space Grotesk; no los inventes), PW-07r,
CF-03r, CF-04r, AC-10r, EV-31, EC-02, EC-03, EC-05, EC-10 a EC-14, WI-04, IN-00, WE-01a, HU-01, ER-04, F8-01.

**No se pueden hacer todavía:**
- C3-01 la cierra quien tiene sus cambios locales (no es de esta máquina). Detrás esperan C3-02, C3-03 y C3-04, y de
  ellas L4-01, L4-06, L4-07, L4-09, AN-02, WI-01 y EC-09.
- TK-06v: sus dependencias están hechas, pero la prueba global (`apps/desktop/src/ui/tema/movimiento.test.ts`) aún
  tiene en `PENDIENTES` la línea de AN-02 (`.wg-resultado` entra con `@keyframes`). Cierra cuando AN-02 la quite.
- TK-02, TK-01v, L4-08, PW-01 y todo lo que cuelga de PW-01: esperan V-08.
- S10-SP: necesita Rust en Windows.

## 6. Lo que aprendí y te ahorra tiempo

**Movimiento (lee `ANIMACIONES.md` §3, §4 y §7 antes de tocar CSS de un control):**
- Toda `transition` y `animation` sale de los tokens de TK-06 (`--dur-instante` 100, `--dur-corto` 150, `--dur-medio`
  200, `--dur-giro`, `--dur-parpadeo`, `--ease-salida`, `--ease-estandar`, `--ease-lineal`, `--ease-parpadeo`). Un valor
  escrito a mano hace fallar `movimiento.test.ts` (punto 3). Si de verdad falta un token, agrega la línea a su
  `PENDIENTES` con la pieza que la quitará.
- **Una sola `transition` por elemento** (regla 9). Los controles están en el bloque AN-03 de `tokens.css` (sección
  «Marco y componentes base»): si un control nuevo necesita transición, agrégalo a esa lista; no le pongas otra
  `transition` suelta. AN-05 debe sumar su propiedad a la de `.wg-kanban__tarjeta` en `kanban.css`; WI-04, la opacidad
  de «Enviar» a la de `.wg-boton`.
- **El bloque único de «reducir movimiento»** está arriba en `tokens.css` (TK-06). Cada regla que agregues ahí lleva
  `:root` delante; si no, pierde por orden contra la regla que anima, que va después (fallo encontrado en AN-03). La
  prueba en vivo «Regla 10 · los lazos…» de `e2e/ANIMACIONES.spec.ts` lo vigila.
- Entradas: o `@starting-style` (A-24, A-32, A-36, mensaje del campo) o la clase `--abierta` con
  `useSalidaAnimada`/`useEntradaAnimada` (A-01, A-03). Nada de `@keyframes` salvo lazos infinitos (regla 8).
- Salidas: `useSalidaAnimada(abierto, ref)` retiene el montaje (menú ⋮, calendario flotante). La ventana emergente sale
  con `salirConCopia`: una copia inerte con `data-saliendo`, sin `id` ni `role`, que se quita sola. **AN-02 puede usar
  el mismo hook para el aviso.** Código que busque `[role="dialog"]` no la ve (por eso se le quitan los roles).

**Pruebas:**
- En Playwright, **nunca leas un color o una opacidad en un solo instante** después de hover, foco, abrir o cambiar de
  tema: la CI lo pilla a mitad de la transición. Usa `await expect(l).toHaveCSS(...)` o la ayuda `estilo()` de
  `rediseno-botones`, `rediseno-marco` y `rediseno-widgets`, que ya espera las transiciones del elemento.
- En Vitest, las pruebas que esperan que algo desaparezca al cerrar usan `waitFor` (la copia o el menú siguen montados
  hasta el seguro de 50 ms). Lo que sale queda fuera del árbol accesible: `queryByRole` ya da `null` en el acto.
- Las nuevas filas de geometría van en `apps/desktop/e2e/geometria/pantallas.ts` y se miden con `compararPantalla`.
- `tokens_cuatro_temas.test.ts`, `movimiento.test.ts` y `e2e/ANIMACIONES.spec.ts` tienen listas `PENDIENTES`: cada
  pieza quita sus líneas al cerrar.

**Herramientas:**
- Escribe archivos con contenido largo (pruebas, cuerpos de PR) con la herramienta de escritura, no con heredocs de
  Bash: un heredoc con comillas o barras invertidas se rompió dos veces. En scripts de Python dentro de Bash, `\b` sin
  `r"..."` se vuelve un carácter de retroceso invisible.
- Figma: solo lectura, con la skill `figma-design-to-code` cargada antes de `get_design_context`. Archivo
  `A3Z03L20swFyo8qdP9jETF`. En esta sesión se gastaron unas 10 llamadas; las piezas de animación no las necesitaron
  (las medidas estaban en `ANIMACIONES.md`).

## 7. Dudas abiertas de esta sesión (en `docs/DUDAS.md`, para Paula)

AN-06 (retraso del esqueleto como montaje; giro de carga sin uso), AN-07 (hover de los días con estado; A-37 sin el
estado «Sin conexión»), AN-01 (salida de la ventana por copia; `transform-origin` del menú), AN-03 (hover de las
variantes con fondo propio; listas de transición que suman AN-05 y WI-04), más las de TK-05, C3-05 y C3-06.
