# Fase A · Plan de los documentos de implementación del rediseño

Borrador local, sin commit. 26-nov-2026 (UTC-5). Espera la aprobación de Paula antes de la Fase B.

## Punto de partida comprobado

- Rama `paso-44-componentes-base`, punta `77aef72`, 33 commits por delante de `origin/main` (`8527130`) y 0 por detrás:
  se puede subir a `main` en avance rápido, sin rebase. `main` no tiene protección en GitHub (push directo posible) y la
  CI corre en cada push.
- `.trabajo/ESTADO.md` es de hoy (25-nov 08:50) pero dice punta `8432bf9`: está atrasado 5 commits.
- Sin commit: RD-106 en 6 formularios (28 líneas, «×» y Esc piden «Salir sin guardar» si hay algo escrito) y los 10
  `docs/rediseno_*.md`. En R-01 RD-106 se verifica y se sube como commit propio (`rediseno: pedir el descarte con datos
  escritos (RD-106)`), con su fila en `rediseno.md`. Los RD nuevos del aviso se numeran desde RD-107.
- Figma A3Z03: unas 427 familias en 8 páginas más Fundamentos, cada una en 4 temas (≈ 1700 marcos).

## Documentos y orden de producción (Fase B)

| Orden | Documento | Quién lo escribe | De dónde sale |
|---|---|---|---|
| 1 | `CONSISTENCIA.md` | principal | Fundamentos `0:1` + muestras de cada página (tabla del agente F0) |
| 2 | `TEMAS_Y_TOKENS.md` | principal | `get_variable_defs` de la colección `200:2` (4 modos), `ui/tema/` |
| 3 | `ANIMACIONES.md` | principal | `get_motion_context` e interacciones que devuelven los agentes; escala propia donde falte |
| 4 | `SPEC_<área>.md` (8) | un agente por área, de uno en uno | sus tablas del Figma + HU, RD, IM y contratos del área |
| 5 | `ERRORES_Y_PRUEBAS.md` | principal | errores de cada `SPEC_*` + `rediseno_plan_codigo.md` §1 + manejador genérico en el código |
| 6 | `DECISIONES.md` | principal | `DUDAS.md` P43, P43b, P44 + contradicciones Figma–documentos |
| 7 | `TRAZABILIDAD.md` | principal (generada desde las tablas) | una fila por marco vigente |
| 8 | `COLA.md`, `RELEVO.md`, `LEEME.md`, `PRUEBAS_Y_CIERRE.md` | principal | todo lo anterior |

Fase C: un agente sin contexto «implementa de cabeza» tres piezas (S, M y L) y lista lo que tendría que adivinar; se corrige
y se repite hasta cero. Además, cada `SPEC_*` pasa por un `revisor` antes de darlo por terminado.

## Lectura del Figma (subagentes, nunca en el chat principal)

- F0 Fundamentos y variables; F1 Acceso `79:2`; F2 Planificador `79:3` (el más grande: dos agentes, por mitades de
  familias); F3 Agente `79:4`; F4 Personalización `79:5` (dos agentes); F5 Configuración `79:6`; F6 Escritorio `83:2`;
  F7 Web e instalación `83:3`; F8 Confirmaciones `83:4`. Uno a la vez o de a dos (solo leen; escriben cada uno su archivo).
- Cada agente usa los ids de `rediseno_flujos_ids_prototipos.md` (no `get_metadata` de la página), lee con
  `get_design_context` el marco **claro** de cada familia y devuelve solo tablas a `.trabajo/figma/Fn.md` (ignorada por git):
  estructura, textos literales, medidas, variables usadas (por nombre, no hex), estados e interacciones.
- Los otros 3 temas no se leen marco a marco: los colores salen de las variables (mismo nombre, otro modo). Por página se
  lee una muestra de 3 marcos por tema para cazar lo que no sigue la variable (letra, íconos, rellenos sueltos); cada
  desvío entra en la lista de incoherencias de `CONSISTENCIA.md`.
- Se ignoran los marcos de «Descartado». Lo que no se pueda medir se dice así en la spec.

## Cómo se mide el tamaño de cada pieza

Una pieza = un commit que compila y pasa sus pruebas. Se estima con lo que ya costó L0 + L1 (≈ 90 min de sesión):

| Tamaño | Regla | Uso del límite de 5 h |
|---|---|---|
| S | 1 componente o pantalla, ≤ 3 archivos, solo TypeScript | ≈ 10 % |
| M | 2 a 6 archivos o una pantalla con estados y errores | ≈ 25 % |
| L | Rust + TypeScript, migración o más de 6 archivos | ≈ 45 % (tope: lo que pase de L se parte) |

Cada pieza deja punto de retoma: si la persona se queda sin límite, anota en `COLA.md` el commit, lo que falta y lo probado.

## Riesgos

1. **Plazo.** Hoy es jueves 26-nov y los documentos vencen el viernes 27-nov. La lectura del Figma es lo más caro; si no
   alcanza, primero salen `COLA`, `RELEVO`, `TEMAS_Y_TOKENS`, `CONSISTENCIA` y las specs de Marco y Planificador, para que
   el relevo 1 (R-01 y cierre de L3) empiece mientras se terminan las demás.
2. **El Figma sigue cambiando** (lote 13 parcial, §15 de pendientes). Las specs son una foto: lo cambiado después no entra
   sin aviso.
3. **Push directo a `main` sin protección.** Un push roto frena a los 4. Regla del relevo: verificación del módulo antes
   de cada push y CI en verde antes de pasar la cola; si `main` queda en rojo, la pieza siguiente es arreglarlo.
4. **Los documentos son locales.** Si los 4 relevos no trabajan en este computador, no los verán (pregunta 2).
5. **Contradicción del claro.** El Figma pinta selección, enlaces e interruptores en violeta (`seleccion`); la opción A
   dice tinta y sin violeta junto al cian (pregunta 1).

## Respuestas de Paula (26-nov)

1. Violeta `seleccion` del claro: **gana el Figma**. El morado se queda donde el prototipo lo pinta (lo elegido, enlaces,
   interruptores). Regla nueva para `CONSISTENCIA.md`: morado y cian pueden convivir en la pantalla, pero **un mismo
   control nunca los mezcla** (ni borde morado con texto cian, ni al revés). Donde el Figma los mezcle (por ejemplo, un
   anillo de foco morado sobre un botón cian), se usa la tinta `#0F2A33` y se anota en `DECISIONES.md`. Se mantiene de la
   opción A: el cian solo como relleno, con texto `#0B2A2E`.
2. Documentos: se suben a `main` cuando Paula los apruebe, en un commit `infra:` que ella autoriza (resuelve el riesgo 4).
3. Foto del Figma: el Figma A3Z03 ya está completo; se lee tal como está (resuelve el riesgo 2).
4. Otros temas: por variables y muestras.
