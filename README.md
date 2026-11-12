# Windgets

Wallpaper personalizable y planificador de escritorio para Windows. Incluye la aplicación de escritorio, la landing page y el instalador. Lo construye el equipo ForkTech para la asignatura Gestión de Proyectos Informáticos de la Universidad del Cauca.

## Estado

En construcción. El plan de pasos está en [`docs/plan_construccion.md`](docs/plan_construccion.md).

## Cómo empezar

- Agentes de código y personas: lean primero [`docs/AGENTS.md`](docs/AGENTS.md).
- Reglas de ramas, commits y pull requests: [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Comandos para ejecutar, probar y empaquetar: [`docs/convenciones.md`](docs/convenciones.md).

## Estructura

```
apps/desktop/                aplicación Tauri 2
  src-tauri/src/             Núcleo en Rust: un módulo por componente (servicio_de_sesion.rs, …),
                             puente_ipc.rs (comandos IPC), messages.rs (textos) y tipos/ (contratos, ts-rs)
  src-tauri/tests/           pruebas de integración del Núcleo (cargo test)
  src/screens/<pantalla>/    una carpeta por pantalla
  src/ui/<Componente>/       biblioteca de interfaz: un componente y su prueba por carpeta; tokens en ui/tema/
  src/ipc/                   cliente IPC tipado y Núcleo simulado para pnpm --filter desktop dev
  src/types/                 tipos generados por ts-rs (no se editan)
  e2e/                       recorridos con Playwright
  assets/, scripts/          activos del catálogo y scripts de generación y verificación
apps/landing/        landing page estática (Vite + TypeScript); e2e/ con Playwright
supabase/            migraciones, Edge Functions, seed.sql y config.toml
installer/           plantilla NSIS del instalador
docs/                especificación de construcción (fuente de verdad)
.github/workflows/   ci.yml, release.yml y keepalive.yml
```

## Descarga

[Descargar Windgets para Windows](https://github.com/Forkthec/windgets/releases/latest/download/Windgets-Setup.exe)

## Equipo

- Juan Diego Gómez Garcés
- Juan David Vela Coronado
- Ana Sofía Arango Yanza
- Paula Andrea Muñoz Delgado

## Licencia

Todos los derechos reservados. El código es visible, pero no se puede copiar, modificar ni redistribuir sin permiso escrito del equipo.
