# Convenciones

## Repositorio (D-200)

Un solo repositorio `windgets`, gestor de paquetes pnpm (espacio de trabajo):

```
windgets/
  apps/
    desktop/                 aplicación Tauri 2
      src-tauri/             Núcleo en Rust (Cargo.toml, tauri.conf.json, build.rs, src/, tests/)
      src/                   vistas en React + TypeScript + Vite
      .env.example
    landing/                 landing page estática (Vite + TypeScript, sin servidor)
  supabase/                  migrations/, functions/ (Edge Functions), seed.sql, config.toml
  installer/                 plantilla NSIS propia del instalador
  docs/                      esta carpeta (la especificación de construcción)
  .github/workflows/         ci.yml, release.yml, keepalive.yml
  package.json, pnpm-workspace.yaml
```

Las migraciones de `docs/supabase/migrations/` se copian a `supabase/migrations/` y `docs/local/sqlite_esquema.sql` a `apps/desktop/src-tauri/` (el Núcleo lo ejecuta al crear la base local). `DUDAS.md` vive en `docs/`.

Módulos del Núcleo: uno por componente de la vista 3a de `arquitectura.md` (Servicio de sesión, Servicio del planificador, Servicio de personalización y configuración, Servicio de Windi, Servicio de clima y noticias, Motor de sincronización, Host del wallpaper, Integración con el sistema, Controlador multimedia, Repositorios y archivos locales). Vistas: una carpeta por pantalla (`src/screens/<pantalla>`), la biblioteca de interfaz compartida en `src/ui`, el cliente IPC tipado en `src/ipc` y los tipos generados en `src/types`.

## Nombres

- Comandos IPC: `dominio_accion` en snake_case (`card_create`). Eventos: `sustantivo_participio` en snake_case (`cards_changed`). RPC, tablas y columnas: snake_case. Edge Functions: kebab-case (`windi-chat`).
- Campos que cruzan el IPC y las RPC: snake_case. Valores enumerados: códigos en inglés (`task`, `todo`, `done`); la interfaz muestra el nombre en español.
- Formatos: `Uuid` en minúsculas (v4, los genera el Núcleo); `DateIso` `YYYY-MM-DD`; `Instant` ISO 8601 UTC con milisegundos y `Z`; `Hex` `#RRGGBB` (el Núcleo normaliza a mayúsculas). La interfaz muestra fechas como «DD/MM/AAAA», horas como «HH:MM», porcentajes con coma y espacio antes de «%».
- Rust: `snake_case` para funciones y módulos, `PascalCase` para tipos, `SCREAMING_SNAKE_CASE` para constantes. TypeScript: `camelCase` para variables y funciones, `PascalCase` para componentes y tipos; archivos de componentes `PascalCase.tsx`. Los campos de los tipos generados se conservan en snake_case.
- Textos de interfaz: en un solo lugar (`messages.rs` en el Núcleo para los mensajes de error y de resultado; las vistas los reciben o los leen de `messages.es.json` exportado en la compilación, DP-01). Ningún texto literal repetido en dos archivos.

## Estilo

- **Rust**: `cargo fmt` y `cargo clippy -- -D warnings` sin advertencias. Sin `unwrap()` ni `expect()` fuera de pruebas; los errores son `AppError` con `code` (los códigos de `contratos.md`). Las escrituras locales y su cambio pendiente van en una transacción de SQLite. Sin `unsafe` salvo en el módulo de integración con Win32, con un comentario por bloque.
- **TypeScript**: `strict` activado, sin `any`. ESLint y Prettier sin advertencias. Las vistas llaman solo al cliente IPC tipado; nunca usan `fetch` a la nube ni a servicios externos (D-188).
- **Accesibilidad e interfaz**: recorrido con teclado (RNF-28 a RNF-31); elementos de una línea alineados verticalmente al centro (RT-04).
- **Registros**: sin tokens, contraseñas ni contenido de tarjetas (D-196).

## Pruebas

| Herramienta | Qué prueba | Dónde |
|---|---|---|
| `cargo test` | Núcleo: reglas, validaciones, comandos, SQLite, sincronización (con un servidor simulado), formatos y mensajes. | `apps/desktop/src-tauri/tests/` y módulos `#[cfg(test)]` |
| Vitest | Componentes, validaciones de campo de las vistas, formateo, cliente IPC con el Núcleo simulado. | `apps/desktop/src/**/*.test.ts(x)` |
| Playwright | Recorridos de pantallas en el navegador con el IPC simulado; la landing page completa. | `apps/desktop/e2e/`, `apps/landing/e2e/` |
| SQL | Esquema, RLS, funciones y semilla de Supabase. | `docs/pruebas/ejecutar_pruebas.sh` |
| Manual con evidencia | Spike de WorkerW y Raw Input, instalador en máquina virtual con Windows 10 22H2 y Windows 11, RNF de rendimiento (cronómetro). | `docs/DUDAS.md` o el reporte del paso |

Regla: una prueba por CA. Nómbrala con el ID (`ca_he_07_hu01_ca05` en Rust, `HE-07-HU01-CA05` en el título del `it(...)` de Vitest o `test(...)` de Playwright). Cada ET de la lista de verificación se cubre con una prueba o con una comprobación manual anotada. Datos de prueba: sección «Datos de prueba mínimos» de cada HU.

## Secretos (D-192)

Nunca se versionan. Se versionan solo los `.env.example` con valores vacíos.

`apps/desktop/.env.example` (se compila en el ejecutable; ambos valores son públicos por diseño):

```
WINDGETS_SUPABASE_URL=
WINDGETS_SUPABASE_ANON_KEY=
```

`supabase/.env.example` (secretos de las Edge Functions; se cargan con `supabase secrets set --env-file supabase/.env`):

```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite   # modelo Flash-Lite del nivel gratuito
NEWS_API_KEY=
# SUPABASE_SERVICE_ROLE_KEY: la entrega Supabase a las Edge Functions; nunca en el ejecutable ni en el repositorio
```

El SMTP propio de Supabase Auth se configura en el panel del proyecto con la cuenta de Gmail del proyecto (`smtp.gmail.com`, puerto 465, contraseña de aplicación; INT-02). No es un secreto de las Edge Functions ni del repositorio, y no se compra dominio (D-195).

Secretos de GitHub Actions (Settings > Secrets): `SUPABASE_URL`, `SUPABASE_ANON_KEY` (flujo `keepalive` y compilación), `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` (solo si el flujo despliega migraciones). Un secreto filtrado se rota de inmediato.

## Marca e íconos

`marca/` tiene el isotipo, el logo y la placa en PNG. El ícono de la aplicación y del instalador se genera con `pnpm --filter desktop tauri icon ../../docs/marca/isotipo/isotipo_color_transparente.png`; para tamaños pequeños (16 a 32 px) usa los archivos `isotipo_*_version-pequena.png` de `marca/isotipo/tamanos/`. Sobre fondos que la marca no controla, el isotipo va en su placa (`marca/placa/`).

## Ejecutar en desarrollo

Requisitos: Windows 10 22H2 o Windows 11 de 64 bits, Node.js LTS, pnpm, Rust estable (toolchain MSVC), WebView2, Supabase CLI y Docker (para Supabase local).

```
pnpm install
supabase start && supabase db reset          # Supabase local: migraciones y semilla
cp apps/desktop/.env.example apps/desktop/.env   # completa con la URL y la clave pública
pnpm --filter desktop tauri dev              # aplicación completa
pnpm --filter desktop dev                    # solo las vistas en el navegador, con IPC simulado
pnpm --filter landing dev                    # landing page
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm --filter desktop test                   # Vitest
pnpm --filter desktop test:e2e               # Playwright
bash docs/pruebas/ejecutar_pruebas.sh        # pruebas SQL
```

La capa del wallpaper y la ventana de edición solo se ven con `tauri dev` en Windows (WorkerW).

## Empaquetar el instalador (D-194)

```
pnpm --filter desktop tauri build --bundles nsis
```

Configuración en `apps/desktop/src-tauri/tauri.conf.json`: `bundle.windows.nsis.installMode = "currentUser"` (por usuario, sin administrador), `bundle.windows.nsis.template` apuntando a la plantilla de `installer/` (paso Opciones, comprobación previa, reparar, reinstalar y cancelar; contrato en `contratos.md`, INT-13), `bundle.windows.webviewInstallMode = { type: "offlineInstaller" }` (WebView2 incluido, sin descargas durante la instalación) y la plantilla por defecto y su tipografía como recursos (`bundle.resources`, D-198). El flujo `release` renombra la salida a **`Windgets-Setup.exe`** (nombre fijo). Sin firma de código.

## Activos del catálogo, bibliotecas y zona horaria

- **Zona horaria.** «Hoy», `due_date`, `completed_on` y `day_changed` usan la zona horaria del computador; las marcas de tiempo se guardan en UTC (`Instant`).
- **Bibliotecas permitidas.** Gráficas: `recharts`; selector de fecha: `react-day-picker`; selector de colores: `react-colorful`; arrastrar y soltar de tarjetas: `@dnd-kit/core`; mover y redimensionar widgets: código propio sobre eventos del puntero. Versiones fijas en `package.json` (sin `^`).
- **Activos que la carpeta no incluye** (se generan en P00 con `pnpm --filter desktop run assets`, script `apps/desktop/scripts/generar_activos.mjs`, y quedan versionados en `assets/`): `templates/default/background.jpg` (1920 × 1080, degradado diagonal de 18° del color principal al color secundario de la plantilla, generado con `sharp` desde un SVG) y `thumbnail.png` (320 × 180, el mismo fondo reducido); las cuatro fuentes `.woff2` de `seed.sql` (paquetes `@fontsource/inter`, `@fontsource/merriweather`, `@fontsource/poppins` y `@fontsource/jetbrains-mono`, peso 400, subconjunto latín); 6 imágenes de catálogo (`catalog/images/01.jpg` a `06.jpg`, 1920 × 1080, degradados generados con el mismo script) y 3 animaciones de catálogo (`catalog/animations/01.webm` a `03.webm`, 320 × 180, 5 s en bucle, generadas con `ffmpeg` desde degradados animados), cada una con su fila en `seed.sql`; el `.ico` con `tauri icon` (sección «Marca e íconos»). Son los activos definitivos del catálogo; si el equipo los reemplaza más adelante, conserva los nombres y las filas.
- **Plantilla NSIS.** `installer/installer.nsi` parte de la plantilla `installer.nsi` de `tauri-bundler` de la misma versión de Tauri 2 que fije `Cargo.lock` (se copia de su repositorio al etiquetar esa versión) y se le agregan el paso Opciones, la comprobación previa, reparar, reinstalar y cancelar de INT-13. `tauri.conf.json` apunta a ese archivo.
- **Modelo de Gemini.** `GEMINI_MODEL=gemini-2.5-flash-lite` (configurable, D-193).
- **Configuración de la landing.** `apps/landing/.env.example` contiene `WINDGETS_GITHUB_REPO=<organizacion>/windgets` (valor público, se lee en la compilación; en Vite se declara `envPrefix: ['VITE_', 'WINDGETS_']`). Mientras Estef no entregue la organización, el valor queda con el marcador `<organizacion>` y el botón muestra el aviso de CD-01-HU02-CA02.

## Cuentas y secretos que debe entregar una persona

| Qué | Quién la entrega | Cuándo |
|---|---|---|
| Proyecto de Supabase (URL, clave anon, `SUPABASE_PROJECT_REF`) | Gerente de Proyecto | Antes de P05 |
| Cuenta de Gmail del proyecto con verificación en dos pasos y contraseña de aplicación, para el SMTP de Supabase Auth | Gerente de Proyecto | Antes de la prueba real de registro de P05 |
| Organización de GitHub (`WINDGETS_GITHUB_REPO`) | Gerente de Proyecto | Antes de P03 |
| Clave de Gemini (`GEMINI_API_KEY`) y de GNews (`NEWS_API_KEY`) | Gerente de Proyecto | Antes de P17 y de HE-04-HU06 |

El agente de código no inventa estos valores: usa dobles de prueba y registra en `DUDAS.md` lo que falta.

## Desplegar la landing page (D-195)

```
pnpm --filter landing build      # genera apps/landing/dist (sitio estático)
```

El `dist` se publica en Vercel (carpeta de salida `apps/landing/dist`, sin funciones de servidor). El mismo `dist` se podría copiar al servidor del patrocinador, solo como última opción. Sin secretos; solo `WINDGETS_GITHUB_REPO` (valor público, `apps/landing/.env.example`). El botón «Descargar para Windows» enlaza `https://github.com/${WINDGETS_GITHUB_REPO}/releases/latest/download/Windgets-Setup.exe` (INT-12).

## Migraciones de Supabase

- Un archivo SQL numerado por cambio en `supabase/migrations/` (`0005_<tema>.sql`, …); nunca se edita uno aplicado. Todo cambio de esquema tiene su equivalente en `local/` y sus pruebas en `docs/pruebas/`.
- Local: `supabase db reset`. Remoto: `supabase link --project-ref <ref>` y `supabase db push`. Orden: `0001` a `0004` y `seed.sql`.
- Edge Functions: `supabase functions deploy <nombre>` (con `verify_jwt = true` en `supabase/config.toml`); secretos con `supabase secrets set`.
- Los catálogos (imágenes, plantillas, tipografías, animaciones) se cargan al bucket `catalog` con las rutas de `seed.sql`.

## CI con GitHub Actions

| Flujo | Cuándo | Qué hace |
|---|---|---|
| `ci.yml` | Cada push y pull request | `pnpm install`, lint (ESLint, `cargo fmt --check`, `cargo clippy -D warnings`), `cargo test`, Vitest, Playwright de la landing, pruebas SQL. |
| `release.yml` | Al crear una etiqueta `v*` | Compila el Núcleo y las vistas, genera el instalador NSIS, lo renombra a `Windgets-Setup.exe` y lo publica como activo de la release. |
| `keepalive.yml` | Una vez al día (D-197) | Llama a la RPC `keepalive` y falla si la respuesta no es `{ ok: true }`. |

`keepalive.yml`:

```yaml
name: keepalive
on:
  schedule:
    - cron: '17 6 * * *'
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Llamar a keepalive
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          curl -fsS -X POST "$SUPABASE_URL/rest/v1/rpc/keepalive" \
            -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{}' \
            | jq -e '.ok == true'
```

## Commits y ramas

Rama `main` protegida; una rama por paso del plan (`paso-NN-<tema>`); un commit por HU (`HE-nn-HUnn: <verbo y objeto>`); `infra:` y `RT-nn:` para lo demás. Un pull request por paso, con la lista de HU cerradas y sus pruebas en verde.
