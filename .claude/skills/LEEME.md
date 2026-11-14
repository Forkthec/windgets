# Skills del equipo

Claude Code las carga solo al abrir el repositorio. Se llaman con `/`:

| Skill | Cuándo |
|---|---|
| `/retomar` | Al abrir un chat o una cuenta nueva: concilia `.trabajo/ESTADO.md`, git y los PR abiertos. |
| `/siguiente-paso` | Construye el siguiente paso del plan (`docs/plan_construccion.md`), HU por HU. |
| `/verificar` | Corre en Docker la verificación que reproduce la CI. Usa `herramientas/verificacion/`. |
| `/cerrar-paso` | Verificación completa, PR en borrador y ayudas de revisión. |

- `.trabajo/` es local de cada persona y no se sube (ESTADO.md, bitácora, borradores de PR, `ultima.log`).
- Si la skill no aparece, pídele a Claude: «Lee `.claude/skills/retomar/SKILL.md` y síguelo».
- Las reglas del proyecto mandan sobre las skills: `CLAUDE.md` y `docs/AGENTS.md`.
- Antes de coordinar con otra persona qué paso construye cada una, revisa los PR abiertos para no repetir trabajo.
