# Skills del equipo

Claude Code las carga solo al abrir el repositorio. Se llaman con `/`:

| Skill | Cuándo |
|---|---|
| `/retomar` | Al abrir un chat o una cuenta nueva: concilia git y los PR (y, si existe, tu `.trabajo/ESTADO.md`). |
| `/siguiente-paso` | Construye el siguiente paso del plan (`docs/plan_construccion.md`), HU por HU. |
| `/verificar` | Corre en Docker la verificación que reproduce la CI. Usa `herramientas/verificacion/`. |
| `/cerrar-paso` | Verificación completa, PR en borrador y ayudas de revisión. |

- `.trabajo/` es local de cada persona y no se sube (ESTADO.md, bitácora, borradores de PR, `ultima.log`).
- Si la skill no aparece, pídele a Claude: «Lee `.claude/skills/retomar/SKILL.md` y síguelo».
- Las reglas del proyecto mandan sobre las skills: `CLAUDE.md` y `docs/AGENTS.md`.
- Antes de coordinar con otra persona qué paso construye cada una, revisa los PR abiertos para no repetir trabajo.

## Cómo se trabaja sin depender de nadie
- La fuente de verdad es GitHub: `bash herramientas/estado.sh` dice qué pasos están fusionados, en PR, en rama o libres.
- Quien toma un paso lo reserva de inmediato con rama, push y PR en borrador (`/siguiente-paso`, sección 1). Así nadie lo repite.
- Todo pendiente humano o duda va a `docs/DUDAS.md` o a «Hallazgos» del PR, no a un archivo local.
- Requisitos: git, `gh auth login`, Docker Desktop (para `/verificar`) y Claude Code.
