---
name: verificar
description: Corre en Docker la verificación que reproduce la CI de windgets (lint, build, fmt, clippy, cargo test, tipos, Vitest, Playwright de la landing y SQL). Úsala por HU con PASOS reducidos y al cerrar un paso con todos los PASOS. No hace falta Rust ni Node 22 instalados: todo corre en el contenedor.
---

# Verificar

Desde la raíz del repo, en Git Bash:

1. Docker: si `docker info` falla, corre `docker desktop start` y repite hasta 60 s.
2. Imagen: si `docker image inspect windgets-ci` falla, construye con
   `docker build -f herramientas/verificacion/Dockerfile -t windgets-ci herramientas/verificacion`.
   Revisa el código de salida de `docker build`, no el de un `tail`.
3. Crea `.trabajo/` si no existe (`mkdir -p .trabajo`). Corre (en segundo plano si son todos los PASOS):

   ```
   MSYS_NO_PATHCONV=1 docker run --rm -e PASOS="$PASOS" \
     -v "$(cygpath -w "$PWD"):/src:ro" -v "$(cygpath -w "$PWD/herramientas/verificacion"):/scripts:ro" \
     -v windgets-cache:/cache -v windgets-cargo:/opt/cargo/registry \
     windgets-ci bash /scripts/verificar.sh > .trabajo/ultima.log 2>&1
   ```

   - PASOS completos: `lint build fmt clippy test tipos vitest e2e landing windows`, más `sql` si el paso toca `supabase/`
     (`windows` = clippy para `x86_64-pc-windows-msvc` sin enlazar, con y sin la feature `spike`: revisa
     que el código Win32 compile sin esperar a Actions)
     (si `verificar.sh` aún no tiene `sql`, agrégalo antes: Postgres en el contenedor y
     `bash docs/pruebas/ejecutar_pruebas.sh`).
   - Por HU: solo el módulo tocado (`test`, `vitest`, `clippy`).
4. `verificar.sh` siempre sale con 0. El resultado se lee en las líneas `=== fin (N)` del log: verde solo si
   todas tienen N = 0.
5. Si falla `fmt`: corre el mismo `docker run` con `/src` montado de lectura y escritura y
   `cargo fmt --manifest-path /src/apps/desktop/src-tauri/Cargo.toml`. Revisa el diff y vuelve a verificar.
6. Anota en ESTADO («Última verificación»): fecha, `git rev-parse HEAD`, `git rev-parse HEAD^{tree}`, los
   PASOS y el resultado de cada uno.
7. El código Win32 se compila aquí (paso `windows`), pero no se enlaza ni se ejecuta. El `.exe` y el
   instalador NSIS los compila GitHub Actions en Windows (`spike.yml` en ramas `paso-01-*`). Mira el resultado una vez con `gh run list --branch <rama> --limit 3` (sin sondear
   en bucle).

Si el árbol (`HEAD^{tree}`) es igual al de una verificación verde ya anotada, esa verificación vale y no
se repite.
