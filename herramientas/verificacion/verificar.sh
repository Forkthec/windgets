#!/usr/bin/env bash
# Corre en el contenedor los pasos de ci.yml sobre una copia del árbol (sin node_modules de Windows).
set -uo pipefail
rsync -a --delete --exclude node_modules --exclude target --exclude dist /src/ /work/
cd /work
export CARGO_TARGET_DIR=/cache/target CI=1
M=apps/desktop/src-tauri/Cargo.toml
paso() { echo; echo "=== $1"; shift; "$@"; local r=$?; echo "=== fin ($r)"; return 0; }
paso install pnpm install --frozen-lockfile --reporter=silent
for p in ${PASOS:-lint build fmt clippy test tipos vitest e2e landing windows}; do
  case $p in
    lint) paso lint pnpm lint ;;
    build) paso build pnpm --filter desktop build ;;
    fmt) paso fmt cargo fmt --manifest-path $M --check ;;
    fmtfix) paso fmtfix cargo fmt --manifest-path $M ;;
    clippy) paso clippy cargo clippy --locked --manifest-path $M --all-targets -- -D warnings ;;
    test) paso test cargo test --locked --manifest-path $M -q ;;
    tipos) paso tipos bash -c 'git status --porcelain -- apps/desktop/src/types; git diff --exit-code --stat -- apps/desktop/src/types && pnpm --filter desktop types:check' ;;
    vitest) paso vitest pnpm --filter desktop test ;;
    windows) paso windows bash -c "CARGO_TARGET_DIR=/cache/target-win cargo clippy --locked --manifest-path $M --target x86_64-pc-windows-msvc --all-targets -- -D warnings && CARGO_TARGET_DIR=/cache/target-win cargo clippy --locked --manifest-path $M --target x86_64-pc-windows-msvc --all-targets --features spike -- -D warnings" ;;
    e2e) paso e2e bash -c 'pnpm --filter desktop exec playwright install --with-deps chromium >/dev/null 2>&1; pnpm --filter desktop test:e2e' ;;
    landing) paso landing bash -c 'pnpm --filter landing exec playwright install --with-deps chromium >/dev/null 2>&1; pnpm --filter landing test:e2e' ;;
  esac
done
