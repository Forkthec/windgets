# Traspaso · estado de la construcción (14-nov-2026)

Para el agente o la persona que sigue en otra computadora. Lee primero `docs/AGENTS.md` y las skills de
`.claude/skills/` (`/retomar`, `/siguiente-paso`, `/verificar`, `/cerrar-paso`). Este archivo no reemplaza
`docs/`; si algo difiere, gana `docs/`. Bórralo cuando ya no haga falta.

## 1. Qué hacer primero

1. **Revisar y fusionar el PR #14 (P08 · Planificador base), rama `paso-08-planificador-base` → `main`.**
   Está completo (9 de 9 HU) y verificado. Sigue en borrador: márcalo como listo, pide la aprobación y
   fusiónalo con «Squash and merge».
2. Después, actualizar la rama de P16, que está apilada sobre P08 (ver la sección 4).
3. Seguir con P16 desde HE-08-HU02 (ver la sección 3).

## 2. Estado de las ramas y los PR

| PR | Rama | Base | Estado |
|---|---|---|---|
| #14 | `paso-08-planificador-base` | `main` | **Terminado: listo para revisar y fusionar** |
| #15 | `paso-16-etiquetas-y-columnas` | P08 | En curso: 1 de 6 HU (HE-08-HU01) |
| #16 | `paso-18-reportes` | P16 | Solo reservado (commit vacío) |
| #17 | `paso-12-cuentas-google` | `main` | Solo reservado (commit vacío) |

`bash herramientas/estado.sh` muestra lo mismo desde GitHub.

### P08 (#14)
- `infra: abrir la base local SQLite con sqlx`: no existía la base local. sqlx 0.8.6, `%APPDATA%\Windgets\windgets.db`
  en WAL, con `sqlite_esquema.sql` en el primer uso (`repositorios_y_archivos_locales.rs`).
- HE-07-HU01, HU03, HU04, HU05; HE-09-HU01, HU02; HE-11-HU01, HU02; HE-12-HU01.
- `RT-02: desplazar el contenido de una ventana emergente más alta que la ventana` y `RT-01: el menú principal
  ocupa solo el ancho de sus opciones` (el menú medía unos 800 px desde P02): correcciones encontradas
  por la e2e.
- Verificación sobre 01d10cc (y e2e repetidas sobre 7d56403): todos los PASOS de `/verificar` en 0 (559 pruebas de Rust, 170 de Vitest,
  14 e2e de escritorio con drag-and-drop real, 26 de la landing). La CI de GitHub, en verde.

## 3. Cómo seguir

Pasos que **no** necesitan el spike, en este orden:

1. **P16 · Etiquetas y columnas** (rama `paso-16-etiquetas-y-columnas`). Hecho: HE-08-HU01. Falta:
   - HE-08-HU02 crear etiqueta: `label_create` (IPC-LABEL-02) y `catalog_list` con `kind: 'color'`
     (IPC-CAT-01). Hay que hacer un selector del **catálogo** de colores (opciones con nombre): el
     `ui/SelectorColores` actual es un selector libre de hexadecimal para los temas. «Nueva etiqueta»
     deshabilitada con 20 etiquetas, con el texto de CA06 (`Boton` tiene la prop `motivo`).
   - HE-07-HU02 asignar etiquetas a una tarjeta: el campo Etiquetas del Formulario de tarjeta ya existe
     (casillas); faltan el estado vacío, el máximo de 5 con opción deshabilitada y «Nueva etiqueta» sobre
     el formulario. El Núcleo ya valida `labels.too_many` y `labels.not_found`.
   - HE-09-HU03 crear columnas, HU04 editarlas y HU05 reordenarlas con drag-and-drop. «Nueva columna»
     ya está en el tablero, todavía sin acción.
2. **P18 · Reportes** (`paso-18-reportes`, apilado sobre P16).
3. **P12 · Cuentas, Google y recuperación** (`paso-12-cuentas-google`, desde `main`).
4. **P10 · Sincronización.** Conviene pronto: sin la primera descarga (`sync_pull`) la base local no tiene
   las columnas por defecto ni el catálogo de colores, y el planificador no funciona en la aplicación real
   (sí en las pruebas, que parten de la semilla de la cuenta). HE-15-HU04 necesita HE-02-HU12 (spike).
5. **P11** solo HE-16-HU03 (cerrar sesión); **P19** Windi; **P20** indicador de sincronización.

## 4. Rebase de las ramas apiladas cuando se fusione P08

P16 trae P08 con merges (el último, 5a44ec7; punta de P08: 7d56403). Al fusionar #14 con squash, sigue la skill `/cerrar-paso`, sección
«Rebase de un apilado»:

```
git fetch origin
git rebase --onto origin/main 7d56403 paso-16-etiquetas-y-columnas
gh pr edit 15 --base main
git push --force-with-lease=paso-16-etiquetas-y-columnas:<sha remoto> origin paso-16-etiquetas-y-columnas
```

El push con fuerza lo hace una persona, no el agente (regla del equipo). Después, lo mismo con P18 sobre P16.

## 5. ⚠️ El spike P01: lo que bloquea el resto

**Sin la evidencia aprobada del spike P01 en `docs/DUDAS.md` no se puede construir nada que use el
wallpaper ni la capa de widgets.** Lo exigen `docs/plan_construccion.md` (P01), `docs/AGENTS.md` («Cómo
reportar dudas») y la skill `/siguiente-paso` (D-131, D-186, HE-02-HU01-ET11). Ninguna IA puede hacerlo:
requiere computadores reales.

**Pasos bloqueados:**

| Paso | Por qué |
|---|---|
| P06 Wallpaper base | Lo pide el plan de forma directa |
| P07 Widgets y capa | Lo pide el plan de forma directa |
| P09 Tareas del día | Depende de P07 (HE-04-HU01, HE-06-HU01) |
| P11 (salvo HE-16-HU03) | HE-17 depende de HE-02-HU01 (P06) |
| P13 Wallpaper completo y temas | Depende de P06 |
| P14 Distribución de widgets | Depende de P07 |
| P15 Widgets Kanban y Calendario | Depende de P07 |
| P17 Calendario (HE-06-HU08) | Depende de P07 |
| P21 y P22 | Widgets y temas |
| HE-15-HU04 (P10) | Depende de HE-02-HU12 |

**Cómo se hace el spike** (lo hace una persona del equipo):
1. Compilar el prototipo. El flujo `.github/workflows/spike.yml` corre en Windows al hacer push a una rama
   `paso-01-*` (o a mano con «Run workflow») y deja el artefacto `windgets-spike` (`windgets.exe`).
   También se puede compilar en Windows con `pnpm --filter desktop tauri build --no-bundle --features spike`.
2. Ejecutarlo en **un computador (o máquina virtual) con Windows 10 22H2 y otro con Windows 11**.
3. Comprobar en cada uno los criterios de «Se prueba al terminar» de P01:
   - la ventana queda detrás de los íconos del escritorio;
   - seleccionar un ícono sigue abriendo el ícono;
   - seleccionar el rectángulo de widget interactivo lo recibe la capa;
   - con tres vistas WebView2 abiertas: CPU promedio de 3 % o menos y memoria de 200 MB o menos en reposo
     (RNF-07); con varios monitores, una sola ventana (D-187).
4. Pegar en `docs/DUDAS.md`, por cada sistema: el sistema operativo y su versión, la captura de pantalla,
   qué forma de `WorkerW` encontró (la capa la muestra) y el resultado (**aprobado** o **fallido**).
5. Avisar al Gerente de Proyecto y al patrocinador. **Si falla, se detiene la construcción** de lo que usa
   el wallpaper y se informa (`docs/AGENTS.md`).
6. Además: con el Control inteligente de aplicaciones de Windows 11 encendido, el `.exe` sin firma no corre
   (ver la duda de D-194 en `DUDAS.md`). Para el spike, apagarlo o usar una máquina sin él.

## 6. Cómo se trabajó (para no repetir errores)

- Verificación: `/verificar` en Docker (Node 22 y Rust 1.91.1); no hace falta tenerlos instalados. Para
  compilar el Núcleo y escribir los archivos generados, monta `/src` con escritura y corre `cargo` **desde
  `apps/desktop/src-tauri`**: así ts-rs toma `.cargo/config.toml` y `cargo test` regenera
  `src/types/messages.es.json`. Desde la raíz, ts-rs crea una carpeta `bindings/` que sobra.
- Prettier **siempre desde la raíz** (`npx prettier --write apps/desktop/src`): el `.prettierignore` está
  ahí y protege `src/types/index.ts`, que es generado.
- El paso `windows` del contenedor ya no compila: `libsqlite3-sys` necesita un compilador C para MSVC que
  la imagen no tiene. La CI no lo usa. En Windows, `cargo clippy --all-targets -- -D warnings` pasa.
- La prueba `la_base_en_archivo_se_crea_en_wal_y_se_reabre` falló dos veces en corridas muy lentas y no se
  pudo repetir. Si vuelve a fallar, el `unwrap()` muestra la causa.
- Patrones de la vista del planificador:
  - `screens/tarjeta/useVentanasDeTarjeta.tsx`: detalle, formulario y eliminar de una tarjeta desde
    cualquier pantalla.
  - `screens/kanban/pruebas.tsx`: Núcleo de prueba del planificador con la semilla de la cuenta.
  - Hoy en las pruebas: 14/11/2026, 14:25.
- Patrones del Núcleo:
  - `servicio_del_planificador.rs`, con las pruebas por HU en `servicio_del_planificador/pruebas_*.rs`.
  - Toda escritura llama a `encolar_cambio` en la misma transacción.
  - Los textos van en `messages.rs` y en `TEXTOS`.
- Las dudas nuevas de P08 están en `docs/DUDAS.md` (las que empiezan con HE-07, HE-11).
