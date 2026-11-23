---
name: cerrar-paso
description: Cierra un paso de windgets. Verificación completa sobre la punta, revisión de reglas, PR en borrador con la plantilla del repo, ayudas de revisión en el chat y ESTADO.md actualizado. Úsala cuando todas las HU del paso tienen su commit.
---

# Cerrar paso

1. Árbol limpio, y cada HU del paso con su commit (`git log --oneline <base>..HEAD`).
2. `/verificar` con todos los PASOS (y `sql` si el paso tocó `supabase/`). Si algo sale en rojo, se arregla
   antes de seguir.
3. Revisión de reglas:
   - `git diff --name-status <base>...HEAD -- docs/` muestra solo `docs/DUDAS.md`, `docs/rediseno.md` o archivos
     agregados (y, en el paso que la abrió, la sección «Rediseño visual» de `docs/AGENTS.md`).
   - En un paso del rediseño, cada cambio visible tiene su RD-nn en `docs/rediseno.md`.
   - Ningún secreto: busca con grep `key|secret|password|token` en el diff.
   - Ninguna ruta previsible que termine en `internal.unexpected`. Pruébalo con una prueba, no solo
     leyendo el código.
   - Cada CA del paso tiene su prueba: lista los IDs de CA del archivo de la épica y búscalos en
     `apps/` y `src-tauri/`. Lo que falte, se escribe ahora.
4. Escribe `.trabajo/pr/PNN.md` con la plantilla `.github/pull_request_template.md`:
   - Paso, HU cerradas y pruebas. Marca solo lo que de verdad corrió.
   - Si hace falta, una sección corta «Hallazgos que aplican a este paso»: pendientes manuales con
     responsable, DUDAS nuevas y lo que solo se prueba en Windows.
   - Al final, la línea de atribución de Claude Code.
5. Push y PR:

   ```
   gh pr create --draft --base <main o la rama de abajo> --head paso-NN-<tema> \
     --title "PNN · <tema del plan> [IA-ASISTIDO]" --body-file .trabajo/pr/PNN.md
   ```

   Después, enlaza el PR con las herramientas de PR de la app y ofrece Auto-fix. Nunca lo fusiones.
6. Dale a quien te dirige, en el chat (no en el PR):
   - el orden de lectura por commit;
   - qué es mecánico y qué pide criterio;
   - la tabla «CA → prueba»;
   - las pruebas manuales que faltan y quién las hace.
7. ESTADO: paso `en PR #n`, base, SHA y árbol verificados, y «Próxima acción». Una línea en la bitácora.

## Rebase de un apilado (cuando se fusiona el PR de abajo)
1. Guarda en ESTADO el SHA viejo de la base, el SHA de la punta y `git rev-parse <rama>^{tree}`.
2. `git fetch origin && git rebase --onto origin/main <base-vieja> <rama>`
3. Si el árbol nuevo es igual al viejo, hereda la verificación. Si no, corre `/verificar` completo.
4. `gh pr edit <n> --base main`.
5. El push de una rama rebasada necesita `--force-with-lease`, y el agente no lo hace (regla del equipo: nada
   de push con fuerza). Deja en ESTADO y en el chat el comando exacto para que lo corra una persona:
   `git push --force-with-lease=<rama>:<sha-viejo-remoto> origin <rama>`
