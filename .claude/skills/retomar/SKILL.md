---
name: retomar
description: Úsala al abrir una sesión nueva de windgets (otra cuenta de Claude o un chat nuevo) para seguir exactamente donde quedó la anterior sin repetir trabajo. Lee .trabajo/ESTADO.md, git y los PR abiertos, y los concilia.
---

# Retomar

0. `.trabajo/` es local y no está en git. Si `.trabajo/ESTADO.md` no existe, créalo con las secciones «Próxima
   acción», «Paso en curso», «Última verificación», «Plan» (copiada de `docs/plan_construccion.md`),
   «Bloqueos» y «Decisiones», y llénalo desde git y los PR (paso 2). Crea también `.trabajo/bitacora.md`.
1. Lee `.trabajo/ESTADO.md` completo y las últimas 20 líneas de `.trabajo/bitacora.md`.
   - Hora de Colombia en Git Bash: `date -u -d '-5 hours' "+%Y-%m-%d %H:%M"`. `TZ=America/Bogota` puede no servir
     en Windows (da UTC). Las horas de `gh` terminan en `Z` (UTC): réstales 5 horas.
   - Mira «Última actualización» (hora de Colombia, UTC-5). Si tiene más de 2 días, o dice «hoy» de una fecha
     pasada, avisa en una línea a quien te dirige antes de darlo por cierto.
2. Mira el repositorio:
   - `git fetch -q origin`
   - `git status --short --branch` y `git stash list`
   - `git log --oneline --decorate origin/main..HEAD`
   - `gh pr list --state open --json number,title,headRefName,baseRefName,isDraft`
   - `gh pr list --state merged --limit 5 --json number,headRefName,mergedAt`
   - `gh pr checks <n>` de cada PR abierto
3. Concilia (git gana sobre ESTADO):
   - Cambios sin commit: son la HU en curso. Lee el diff. Busca qué CA (criterios de aceptación) ya tienen
     prueba (`grep -rn "ca_he_nn_hunn\|HE-nn-HUnn-CA" apps/`). Sigue desde ahí y no reescribas lo hecho.
   - Commit de una HU que ESTADO no marca: márcala cerrada.
   - Commit sin push en una rama `paso-*`: haz push (nunca a `main` ni con fuerza).
   - PR fusionado que ESTADO marca abierto: márcalo fusionado. Si hay ramas apiladas encima, rebásalas como
     dice `cerrar-paso` («Rebase de un apilado»).
   - CI en rojo en un PR propio: eso va primero, antes de cualquier HU nueva.
4. Actualiza ESTADO («Última actualización», «Sesión») y agrega una línea a la bitácora:
   `AAAA-MM-DD HH:MM · retomar · <dónde quedó>`.
5. Dile a quien te dirige, en 5 líneas como máximo: paso y HU, qué sigue y qué bloquea.
6. Si no hay una decisión pendiente de quien te dirige, sigue con «Próxima acción», o con `/siguiente-paso` si el paso
   está cerrado. No vuelvas a preguntar lo que ya está en «Decisiones».
