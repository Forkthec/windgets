#!/usr/bin/env bash
# Aplica Prettier y cargo fmt sobre una copia del árbol y devuelve a /src solo los archivos cambiados.
set -uo pipefail
rsync -a --delete --exclude node_modules --exclude target --exclude dist /src/ /work/
cd /work
pnpm install --frozen-lockfile --reporter=silent >/dev/null 2>&1
pnpm exec prettier --write . --log-level warn
cargo fmt --manifest-path apps/desktop/src-tauri/Cargo.toml
rsync -a --checksum --exclude node_modules --exclude target --exclude dist --exclude .git /work/ /src/
