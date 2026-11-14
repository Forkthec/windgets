#!/usr/bin/env bash
# Estado de los pasos del plan, calculado solo con lo que está en GitHub (no depende de ningún archivo local).
# Uso: bash herramientas/estado.sh      (requiere git y gh con sesión iniciada)
#   fusionado = hay un PR fusionado cuyo título empieza por «PNN ·» o cuya rama es paso-NN-* (también PNNb, PNNc…)
#   en PR     = hay un PR abierto con ese título (otra persona ya tomó el paso: no lo repitas)
#   en rama   = existe origin/paso-NN-* sin PR (alguien lo empezó)
#   libre     = nadie lo ha tomado
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
git fetch -q origin 2>/dev/null || echo "AVISO: no se pudo actualizar origin; el resultado puede estar desactualizado."
prs=$(gh pr list --state all --limit 200 --json number,title,state,headRefName,isDraft \
  --jq '.[] | "\(.number)\t\(.state)\t\(.headRefName)\t\(.title)"') || { echo "ERROR: gh no pudo leer los PR (¿gh auth login?)"; exit 1; }
printf '%-5s %-45s %s\n' PASO TEMA ESTADO
git show origin/main:docs/plan_construccion.md | grep -E '^## P[0-9]{2} · ' | while IFS= read -r l; do
  id=$(echo "$l" | sed -E 's/^## (P[0-9]{2}) · .*/\1/'); tema=$(echo "$l" | sed -E 's/^## P[0-9]{2} · //; s/ \(.*//')
  n=${id#P}
  fus=$(echo "$prs" | awk -F'\t' -v p="^$id[a-z]? ·" -v b="^paso-$n[a-z]?-" '$2=="MERGED" && ($4 ~ p || $3 ~ b) {printf "#%s ", $1}')
  abi=$(echo "$prs" | awk -F'\t' -v p="^$id[a-z]? ·" -v b="^paso-$n[a-z]?-" '$2=="OPEN" && ($4 ~ p || $3 ~ b) {printf "#%s ", $1}')
  ram=""
  for b in $(git branch -r --list "origin/paso-$n*" --format='%(refname:short)'); do
    # una rama que ya tiene PR (abierto o fusionado) no cuenta como «sin PR»
    echo "$prs" | awk -F'\t' -v h="${b#origin/}" '$3==h {f=1} END {exit !f}' || ram="$ram$b "
  done
  if [ -n "$abi" ]; then e="en PR abierto: $abi"; [ -n "$fus" ] && e="$e (fusionado antes: $fus)"
  elif [ -n "$fus" ]; then e="fusionado: $fus"
  elif [ -n "$ram" ]; then e="en rama sin PR: $ram"
  else e="libre"; fi
  printf '%-5s %-45s %s\n' "$id" "${tema:0:45}" "$e"
done
