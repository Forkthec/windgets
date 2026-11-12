# Plan de construcción

Orden de los pasos. Dentro de cada paso, las HU van en el orden del Backlog (columna Orden). Las tres prioridades del Backlog (Alta, Media, Baja) definen los bloques: P02 a P11 son Alta, P12 a P20 son Media y P21 a P22 son Baja. Ninguna HU aparece antes de las HU de las que depende.

Antes del P02 va el spike (P01): si no funciona en Windows 10 22H2 y en Windows 11, se detiene la construcción (D-131, D-186, HE-02-HU01-ET11). Las reglas transversales se construyen primero (P02) aunque estén al final de la lista del Backlog, porque los CA de casi todas las HU las citan. Desde P05, todo comando de escritura guarda también en `pending_change`; P10 construye el envío y la recepción.

Cada paso termina cuando todos los CA y las ET de sus HU pasan y se cumple lo que dice «Se prueba al terminar». Un commit por HU.

## P00 · Fundaciones

Repositorio y herramientas (D-200), Supabase, tipos y biblioteca de interfaz. Pasos, en este orden: (1) crear el repositorio `windgets` con la estructura de `convenciones.md` y copiar esta carpeta a `docs/`; (2) fijar versiones: Node 22 LTS, pnpm 9, Rust estable con toolchain MSVC, Tauri 2, Vite 6, React 18, TypeScript 5.6, Vitest, Playwright y Supabase CLI (todas sin `^` en `package.json` y con `rust-toolchain.toml`); (3) crear `package.json` y `pnpm-workspace.yaml` (`apps/*`); (4) `pnpm create tauri-app` en `apps/desktop` con plantilla React + TypeScript y ajustar `tauri.conf.json` según `convenciones.md`; (5) crear `apps/landing` con Vite + TypeScript; (6) `supabase init`, copiar migraciones y `seed.sql`, y escribir `supabase/config.toml` con `verify_jwt = true` en las cuatro funciones; (7) copiar `docs/local/sqlite_esquema.sql` y `tipos.ts`, y configurar ts-rs para generar tipos iguales; (8) escribir los tres flujos de `.github/workflows/`: `ci.yml` (pnpm install, cargo test, Vitest, Playwright, pruebas SQL), `release.yml` (compila, genera el instalador NSIS y lo publica como `Windgets-Setup.exe`) y `keepalive.yml` (el de `convenciones.md`); (9) generar los activos (`convenciones.md`, «Activos del catálogo»); (10) crear la biblioteca de interfaz con estos componentes: Botón, Campo de texto, Casilla, Interruptor, Selector, Selector de colores, Selector de fecha, Ventana emergente, Mensaje de resultado, Aviso, Confirmación, Estado vacío, Miga de pan y Menú principal, todos leyendo los tokens de `interfaz.md` («Tema a tokens»). Las cuentas externas las entrega una persona (`convenciones.md`).

**Se prueba al terminar.** Compila `pnpm install`, `tauri dev` abre una ventana vacía; `supabase db reset` aplica `0001` a `0004` y `seed.sql`; `bash docs/pruebas/ejecutar_pruebas.sh` termina en «TODAS LAS PRUEBAS OK»; CI en verde; ts-rs genera tipos iguales a `tipos.ts`.

## P01 · Spike WorkerW y Raw Input (D-131, D-186)

Demostrar en Windows 10 22H2 y en Windows 11 una ventana WebView2 anclada a WorkerW detrás de los íconos del escritorio y el reenvío del mouse con Raw Input (`RIDEV_INPUTSINK`, `LVM_HITTEST`), con una sola ventana sobre varios monitores (D-187). No cierra ninguna HU; es la condición para seguir (HE-02-HU01-ET11). Lo ejecuta una persona del equipo con un computador (o máquina virtual) con Windows 10 22H2 y otro con Windows 11, siguiendo estos pasos: compilar el prototipo con `pnpm --filter desktop tauri build`, copiar el `.exe` a cada sistema, ejecutarlo, comprobar cada criterio de «Se prueba al terminar» y pegar en `DUDAS.md` el sistema operativo, su versión, la captura de pantalla y el resultado (aprobado o fallido). Un runner de CI de Linux no puede probar WorkerW. Quien ejecuta avisa al Gerente de Proyecto y al patrocinador.

**Se prueba al terminar.** En ambos sistemas: la ventana queda detrás de los íconos; seleccionar un ícono sigue abriendo el ícono; seleccionar un rectángulo de widget interactivo lo recibe la capa; con tres vistas WebView2 abiertas, CPU promedio de 3 % o menos y memoria de 200 MB o menos en reposo (RNF-07). Si algo falla, se detiene la construcción y se informa al Gerente de Proyecto y al patrocinador (`AGENTS.md`).

## P02 · Reglas transversales

Menú principal, ventanas emergentes, formularios y tipos de mensaje. Se construyen antes que las HU porque casi todos los CA las citan (según RT-nn).

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 46 | RT-04 | Mensajes, opciones deshabilitadas y alineación | Alta | 2 | 14 | 26 | Ninguna |
| 45 | RT-03 | Miga de pan y Regresar | Alta | 2 | 7 | 8 | Ninguna |
| 43 | RT-01 | Menú principal y pantalla principal | Alta | 3 | 12 | 9 | Ninguna |
| 44 | RT-02 | Ventanas emergentes | Alta | 2 | 9 | 9 | RT-01 |

Puntos del paso: 9.

**Se prueba al terminar.** Los CA y las ET de RT-01 a RT-04 con pantallas de prueba (Vitest y Playwright); mensaje de resultado a los 4 s, de campo, aviso, confirmación y estado vacío; menú con la opción actual marcada.

## P03 · Landing page

CD-01 completa.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 1 | CD-01-HU01 | Consultar la descripción, las funciones y los requisitos del sistema en la landing page | Alta | 2 | 3 | 12 | Ninguna |
| 2 | CD-01-HU02 | Descargar el instalador desde la landing page | Alta | 3 | 2 | 5 | CD-01-HU01 |

Puntos del paso: 5.

**Se prueba al terminar.** Playwright: textos literales, detección del sistema operativo, botón de descarga y aviso «No pudimos iniciar la descarga. Intenta de nuevo.» con la API de GitHub simulada; despliegue estático probado con `vite preview`.

## P04 · Instalador

CD-02 con una aplicación mínima empaquetable (abre Inicio de sesión cuando exista).

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 3 | CD-02-HU01 | Instalar la aplicación con el instalador .exe todo en uno | Alta | 5 | 12 | 24 | Ninguna |
| 4 | CD-02-HU02 | Seleccionar la apertura de la aplicación con el arranque de Windows durante la instalación | Alta | 1 | 2 | 10 | CD-02-HU01 |
| 5 | CD-02-HU03 | Cancelar la instalación | Alta | 1 | 6 | 8 | CD-02-HU01 |

Puntos del paso: 7.

**Se prueba al terminar.** En máquina virtual con Windows 10 22H2 y con Windows 11: instalar, reinstalar, reparar, cancelar en cada paso, falla con reversión sin residuos (RNF-15), computador no compatible y poco espacio. CD-02-HU01-CA02 («Abrir Windgets» abre Inicio de sesión) se vuelve a ejecutar al cerrar P05.

## P05 · Cuentas (parte principal)

Registro, contraseña, verificación del correo e inicio de sesión con correo; token con DPAPI.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 6 | HE-01-HU01 | Registrar una cuenta con alias y correo electrónico | Alta | 5 | 12 | 14 | Ninguna |
| 7 | HE-01-HU02 | Crear la contraseña de la cuenta durante el registro | Alta | 2 | 8 | 5 | HE-01-HU01 |
| 8 | HE-01-HU03 | Verificar el correo electrónico con un código de verificación | Alta | 3 | 9 | 16 | HE-01-HU01; HE-01-HU02 |
| 9 | HE-01-HU04 | Iniciar sesión con correo electrónico y contraseña | Alta | 3 | 12 | 11 | HE-01-HU03 |

Puntos del paso: 13.

**Se prueba al terminar.** cargo test de validaciones y de `auth_*` con Supabase Auth simulado; Playwright de los tres pasos; RNF-17 a RNF-19, RNF-24 y RNF-25; registro real contra Supabase de pruebas con el SMTP de Gmail del proyecto.

## P06 · Wallpaper base

Wallpaper como fondo real, plantilla por defecto sin conexión, tema en edición, plantillas e imágenes del catálogo, y guardar en el tema en edición y aplicar al escritorio.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 10 | HE-02-HU01 | Consultar el wallpaper como fondo real de Windows | Alta | 13 | 6 | 12 | Ninguna |
| 11 | HE-02-HU10 | Seleccionar el tema en edición en la pantalla de personalización | Alta | 2 | 6 | 6 | Ninguna |
| 12 | HE-02-HU02 | Seleccionar una plantilla del catálogo de plantillas | Alta | 3 | 2 | 7 | HE-02-HU10 |
| 13 | HE-02-HU03 | Seleccionar la imagen de fondo de la plantilla, propia o del catálogo de imágenes | Alta | 3 | 8 | 10 | HE-02-HU02; HE-02-HU10 |
| 14 | HE-02-HU11 | Guardar en el tema en edición los cambios de la vista previa sin llevarlos al escritorio | Alta | 3 | 5 | 5 | HE-02-HU10 |
| 15 | HE-02-HU12 | Aplicar al escritorio los cambios de la vista previa | Alta | 5 | 11 | 7 | HE-02-HU01 |

Puntos del paso: 29.

**Se prueba al terminar.** El wallpaper se ve detrás de los íconos en el escritorio real tras aplicar (RNF-01: 5 s); primer inicio sin conexión con la plantilla del instalador; vista previa en 1 s (RNF-02); `catalog_pull` con versión.

## P07 · Widgets y capa

Lista de widgets, alternar activo o inactivo, catálogo de widgets y seleccionar un widget interactivo en el escritorio.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 16 | HE-04-HU01 | Consultar la lista de widgets con el estado activo o inactivo de cada widget | Alta | 3 | 3 | 5 | Ninguna |
| 17 | HE-04-HU02 | Alternar un widget entre activo e inactivo | Alta | 2 | 2 | 3 | HE-04-HU01 |
| 18 | HE-04-HU04 | Consultar el catálogo de widgets | Alta | 2 | 2 | 4 | HE-04-HU01 |
| 19 | HE-06-HU01 | Seleccionar un widget interactivo directamente en el escritorio | Alta | 8 | 7 | 8 | HE-04-HU01 |

Puntos del paso: 15.

**Se prueba al terminar.** Convivencia con los íconos y las ventanas de Windows (RNF-35) en ambos sistemas; los cuatro widgets por defecto; prueba manual de la selección de un widget interactivo.

## P08 · Planificador base

Tarjetas, tablero Kanban, agenda diaria y primer planificador diario.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 20 | HE-07-HU01 | Crear una tarjeta de tipo Tarea, Recordatorio o Evento | Alta | 5 | 12 | 27 | Ninguna |
| 21 | HE-07-HU03 | Consultar el detalle de una tarjeta | Alta | 2 | 4 | 8 | HE-07-HU01 |
| 22 | HE-07-HU04 | Editar una tarjeta | Alta | 3 | 11 | 21 | HE-07-HU03 |
| 23 | HE-07-HU05 | Eliminar una tarjeta | Alta | 2 | 3 | 6 | HE-07-HU03 |
| 24 | HE-09-HU01 | Consultar las tarjetas en el tablero Kanban organizadas por columnas | Alta | 3 | 5 | 7 | HE-07-HU01 |
| 25 | HE-09-HU02 | Mover una tarjeta entre columnas mediante drag-and-drop o con la opción «Mover a» | Alta | 5 | 9 | 13 | HE-09-HU01 |
| 26 | HE-11-HU01 | Consultar la agenda diaria | Alta | 2 | 6 | 8 | HE-07-HU01 |
| 27 | HE-11-HU02 | Asignar una tarjeta a un bloque horario de la agenda diaria | Alta | 3 | 5 | 11 | HE-11-HU01 |
| 28 | HE-12-HU01 | Consultar el planificador diario con las tarjetas de hoy | Alta | 3 | 5 | 9 | HE-11-HU02 |

Puntos del paso: 28.

**Se prueba al terminar.** Crear, consultar, editar y eliminar tarjetas con persistencia local y trabajo sin conexión (D-164); mover tarjetas entre columnas; los CA con fecha límite en distintos días.

## P09 · Tareas del día y planificador diario

Widget Tareas del día, completar y mover tarjetas desde él, y completar y resumen de avance en el planificador diario.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 29 | HE-06-HU02 | Consultar las tarjetas del planificador diario en el widget Tareas del día | Alta | 5 | 6 | 4 | HE-04-HU01; HE-12-HU01 |
| 30 | HE-06-HU03 | Alternar la casilla de completada de una tarjeta desde el widget Tareas del día | Alta | 2 | 4 | 5 | HE-06-HU01; HE-06-HU02 |
| 31 | HE-06-HU04 | Mover una tarjeta de columna con la opción «Mover a» desde el widget Tareas del día | Alta | 2 | 5 | 6 | HE-06-HU01; HE-06-HU02 |
| 32 | HE-12-HU02 | Alternar la casilla de completada de una tarjeta desde el planificador diario | Alta | 2 | 3 | 7 | HE-09-HU02; HE-12-HU01 |
| 33 | HE-12-HU03 | Consultar el resumen de avance del día | Alta | 2 | 5 | 7 | HE-12-HU02 |

Puntos del paso: 13.

**Se prueba al terminar.** Cambios de tarjetas reflejados en el escritorio en 5 s (RNF-01, EV con `origin`); completar una tarea desde el widget.

## P10 · Sincronización

Cola de cambios, `sync_push`, `sync_pull`, indicador y recuperación de la conexión.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 34 | HE-15-HU01 | Guardar automáticamente la información de la aplicación en la nube | Alta | 5 | 3 | 11 | Ninguna |
| 35 | HE-15-HU02 | Trabajar con la aplicación offline | Alta | 8 | 6 | 11 | HE-15-HU01 |
| 36 | HE-15-HU03 | Sincronizar automáticamente los cambios hechos offline cuando vuelve la conexión a internet | Alta | 8 | 8 | 11 | HE-15-HU02 |
| 37 | HE-15-HU04 | Sincronizar la personalización entre computadores | Alta | 5 | 8 | 14 | HE-02-HU12; HE-15-HU01 |

Puntos del paso: 26.

**Se prueba al terminar.** Dos clientes simulados: conflictos por campo (D-048), envío en 10 s (RNF-03), recepción en 1 min (RNF-04), sin consultas con el computador suspendido, 1 consulta por minuto como máximo (RNF-05); keepalive manual en GitHub Actions.

## P11 · Configuración y ejecución

Inicio automático, cerrar sesión y área de notificación.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 38 | HE-16-HU02 | Alternar el inicio automático en la pantalla Configuración | Alta | 2 | 5 | 9 | CD-02-HU02 |
| 39 | HE-16-HU03 | Cerrar sesión desde la pantalla Configuración | Alta | 2 | 5 | 7 | Ninguna |
| 40 | HE-17-HU01 | Cerrar la ventana de la aplicación | Alta | 2 | 2 | 5 | HE-02-HU01 |
| 41 | HE-17-HU02 | Abrir la ventana de la aplicación desde el ícono del área de notificación | Alta | 2 | 3 | 6 | HE-17-HU01 |
| 42 | HE-17-HU03 | Salir de la aplicación desde el ícono del área de notificación | Alta | 2 | 4 | 7 | HE-17-HU01 |

Puntos del paso: 10.

**Se prueba al terminar.** Cerrar sesión borra la base local y `session.bin` (RNF-19, D-190); el ícono sigue con la ventana cerrada; el instalador registra el inicio automático (CD-02-HU02).

## P12 · Cuentas (Google y recuperación)

Inicio con Google (PKCE) y recuperar la contraseña.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 47 | HE-01-HU05 | Iniciar sesión con la cuenta de Google | Media | 3 | 9 | 13 | HE-01-HU01; HE-01-HU04 |
| 48 | HE-01-HU06 | Solicitar un código de verificación en la pantalla Recuperar contraseña | Media | 2 | 7 | 13 | HE-01-HU04 |
| 49 | HE-01-HU07 | Verificar el código de verificación recibido en la pantalla Recuperar contraseña | Media | 3 | 9 | 14 | HE-01-HU06 |
| 50 | HE-01-HU08 | Crear una contraseña nueva para la cuenta | Media | 2 | 7 | 10 | HE-01-HU07 |

Puntos del paso: 10.

**Se prueba al terminar.** Flujo con Google en el navegador y regreso por `windgets://auth/callback` con instancia única (RNF-20, RNF-36); correos de recuperación con código.

## P13 · Wallpaper completo y temas

Quitar la imagen de fondo, colores, tipografía, paletas, restablecer, vista previa en tiempo real, cancelar cambios; temas guardados, guardar como tema, aplicar y consultar la aplicación con el tema aplicado.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 51 | HE-02-HU04 | Quitar la imagen de fondo de la plantilla | Media | 1 | 2 | 2 | HE-02-HU03 |
| 52 | HE-02-HU05 | Cambiar los colores del tema con el selector de colores o en formato hexadecimal | Media | 3 | 5 | 17 | HE-02-HU10 |
| 53 | HE-02-HU06 | Cambiar la fuente y el tamaño del texto del tema | Media | 2 | 2 | 5 | HE-02-HU10 |
| 54 | HE-02-HU07 | Seleccionar una paleta del catálogo de paletas | Media | 2 | 2 | 4 | HE-02-HU05; HE-02-HU10 |
| 55 | HE-02-HU08 | Restablecer los colores y la tipografía del tema a los valores por defecto de la plantilla | Media | 1 | 2 | 3 | HE-02-HU05; HE-02-HU06 |
| 56 | HE-02-HU09 | Consultar una vista previa en tiempo real de los cambios de personalización | Media | 3 | 2 | 4 | Ninguna |
| 57 | HE-02-HU13 | Cancelar los cambios sin guardar de la vista previa | Media | 2 | 9 | 8 | Ninguna |
| 58 | HE-03-HU01 | Consultar los temas guardados con el tema aplicado marcado | Media | 2 | 4 | 7 | Ninguna |
| 59 | HE-03-HU02 | Guardar como tema nuevo los cambios de la vista previa | Media | 3 | 7 | 12 | HE-02-HU09 |
| 60 | HE-03-HU03 | Aplicar un tema guardado | Media | 3 | 6 | 8 | HE-03-HU01 |
| 61 | HE-03-HU06 | Consultar la aplicación con los colores del tema y la tipografía del tema aplicado | Media | 5 | 8 | 9 | HE-02-HU12 |

Puntos del paso: 27.

**Se prueba al terminar.** Contraste de legibilidad (RNF-26); subida de imágenes con validación de firma, tipo y tamaño (RNF-22, RNF-23); aplicar un tema reemplaza la personalización.

## P14 · Distribución de widgets

Reloj, eliminar un widget y la pantalla de edición (tercera vista temporal): abrir, mover, redimensionar, guardar y cancelar.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 62 | HE-04-HU03 | Consultar la hora del sistema en el widget Reloj | Media | 1 | 1 | 1 | Ninguna |
| 63 | HE-04-HU13 | Eliminar un widget externo o local | Media | 2 | 6 | 7 | HE-04-HU01 |
| 64 | HE-05-HU01 | Abrir la pantalla de edición desde la pantalla Widgets | Media | 1 | 2 | 6 | HE-04-HU01 |
| 65 | HE-05-HU02 | Mover un widget mediante drag-and-drop en la pantalla de edición | Media | 3 | 4 | 6 | HE-05-HU01 |
| 66 | HE-05-HU03 | Redimensionar un widget en la pantalla de edición | Media | 3 | 5 | 6 | HE-05-HU01 |
| 67 | HE-05-HU04 | Guardar la distribución de widgets | Media | 2 | 4 | 4 | HE-05-HU01 |
| 68 | HE-05-HU05 | Cancelar los cambios de la distribución de widgets | Media | 1 | 5 | 7 | HE-05-HU01 |

Puntos del paso: 13.

**Se prueba al terminar.** La ventana de edición existe solo mientras HE-05 está abierta y se destruye al salir; «Cancelar» con cambios muestra «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» (D-204).

## P15 · Widgets Kanban y Calendario

Consultar el tablero Kanban y mover tarjetas con drag-and-drop en el widget Kanban, y consultar el mes en el widget Calendario.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 69 | HE-06-HU05 | Consultar el tablero Kanban en el widget Kanban | Media | 3 | 4 | 3 | HE-04-HU01; HE-09-HU01 |
| 70 | HE-06-HU06 | Mover tarjetas entre columnas mediante drag-and-drop en el widget Kanban | Media | 5 | 5 | 6 | HE-06-HU01; HE-06-HU05 |
| 71 | HE-06-HU07 | Consultar el mes actual en el widget Calendario | Media | 2 | 1 | 1 | HE-04-HU01 |

Puntos del paso: 10.

**Se prueba al terminar.** Selección del mouse reenviada solo sobre widgets interactivos y sin ícono debajo, en ambos sistemas.

## P16 · Etiquetas y columnas

Consultar y crear etiquetas, asignarlas a tarjetas, y crear, editar y reordenar columnas.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 72 | HE-08-HU01 | Consultar las etiquetas creadas | Media | 1 | 3 | 6 | Ninguna |
| 73 | HE-08-HU02 | Crear una etiqueta con nombre y color | Media | 2 | 9 | 15 | HE-08-HU01 |
| 74 | HE-07-HU02 | Asignar etiquetas a una tarjeta | Media | 1 | 5 | 10 | HE-07-HU01; HE-08-HU02 |
| 75 | HE-09-HU03 | Crear columnas en el tablero Kanban | Media | 3 | 8 | 11 | HE-09-HU01 |
| 76 | HE-09-HU04 | Editar el nombre y el color de una columna | Media | 2 | 8 | 9 | HE-09-HU01 |
| 77 | HE-09-HU05 | Cambiar el orden de las columnas mediante drag-and-drop | Media | 2 | 2 | 5 | HE-09-HU01 |

Puntos del paso: 11.

**Se prueba al terminar.** Máximos de etiquetas y columnas con opción deshabilitada; colores del catálogo.

## P17 · Calendario

Vistas mensual y semanal, tarjetas de un día, crear desde un día, días vencidos o pendientes, abrir pantallas desde un widget interactivo y quitar de un bloque horario.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 78 | HE-10-HU01 | Consultar las tarjetas en el calendario en vista mensual | Media | 5 | 6 | 7 | HE-07-HU01 |
| 79 | HE-10-HU02 | Consultar las tarjetas en el calendario en vista semanal | Media | 3 | 7 | 9 | HE-10-HU01; HE-11-HU02 |
| 80 | HE-10-HU03 | Consultar las tarjetas de un día desde el calendario | Media | 2 | 4 | 8 | HE-07-HU03; HE-10-HU01; HE-10-HU02 |
| 81 | HE-06-HU08 | Abrir la pantalla relacionada de la aplicación desde un widget interactivo | Media | 3 | 7 | 7 | HE-06-HU01; HE-06-HU02; HE-06-HU05; HE-06-HU07; HE-07-HU03; HE-10-HU01; HE-10-HU03 |
| 82 | HE-10-HU04 | Crear una tarjeta directamente desde un día del calendario | Media | 2 | 5 | 9 | HE-07-HU01; HE-10-HU03 |
| 83 | HE-10-HU05 | Consultar los días con tarjetas vencidas o pendientes en el calendario | Media | 3 | 8 | 18 | HE-09-HU02; HE-10-HU01; HE-10-HU02 |
| 84 | HE-11-HU03 | Quitar una tarjeta de un bloque horario de la agenda diaria | Media | 1 | 2 | 5 | HE-11-HU02 |

Puntos del paso: 19.

**Se prueba al terminar.** Vistas Mes y Semana; abrir el Detalle de tarjeta desde el widget y el área de notificación.

## P18 · Reportes

Rango de fechas, gráfica de completadas, tasa de cumplimiento y conteos, calculados en el Núcleo.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 85 | HE-13-HU01 | Seleccionar el rango de fechas de los reportes | Media | 2 | 8 | 16 | Ninguna |
| 86 | HE-13-HU02 | Consultar una gráfica de las tarjetas completadas en el rango de fechas | Media | 3 | 10 | 19 | HE-09-HU02; HE-13-HU01 |
| 87 | HE-13-HU03 | Consultar la tasa de cumplimiento | Media | 3 | 8 | 10 | HE-13-HU01 |
| 88 | HE-13-HU04 | Consultar cuántas tarjetas vencidas, pendientes y completadas hay en el rango de fechas | Media | 3 | 5 | 11 | HE-07-HU03; HE-13-HU01 |

Puntos del paso: 11.

**Se prueba al terminar.** Cada sección se muestra apenas termina su cálculo (HE-13-HU02-ET16); cifras con coma decimal.

## P19 · Windi, agente de IA

Edge Function `windi-chat`, chat, personalidad, historial en memoria, propuestas que el usuario confirma y pedir crear, editar, mover y eliminar tarjetas.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 89 | HE-14-HU01 | Conversar por chat de texto con el agente de IA | Media | 3 | 9 | 24 | Ninguna |
| 90 | HE-14-HU02 | Conversar con el agente de IA con una personalidad cercana, relajada y optimista | Media | 2 | 5 | 12 | HE-14-HU01 |
| 91 | HE-14-HU03 | Confirmar una propuesta del agente de IA | Media | 2 | 4 | 8 | HE-14-HU01 |
| 92 | HE-14-HU04 | Pedir al agente de IA que cree tarjetas | Media | 5 | 9 | 9 | HE-07-HU01; HE-14-HU03 |
| 93 | HE-14-HU05 | Pedir al agente de IA que edite tarjetas | Media | 3 | 7 | 9 | HE-07-HU04; HE-14-HU03 |
| 94 | HE-14-HU06 | Pedir al agente de IA que mueva tarjetas entre columnas | Media | 2 | 8 | 11 | HE-09-HU02; HE-14-HU03 |
| 95 | HE-14-HU07 | Pedir al agente de IA que elimine tarjetas | Media | 2 | 6 | 6 | HE-07-HU05; HE-14-HU03 |

Puntos del paso: 19.

**Se prueba al terminar.** Espera máxima de 15 s (RNF-11) y mensaje de servicio no disponible; envío solo de los datos necesarios (D-193); Gemini simulado en las pruebas automáticas.

## P20 · Indicador de sincronización en Configuración

Consultar el indicador de sincronización en la pantalla Configuración.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 96 | HE-16-HU01 | Consultar el indicador de sincronización en la pantalla Configuración | Media | 2 | 5 | 8 | HE-15-HU01 |

Puntos del paso: 2.

**Se prueba al terminar.** Textos «Sincronizado», «Sincronizando…» y «Sin conexión».

## P21 · Temas y widgets opcionales

Renombrar y eliminar temas; agregar Clima, Noticias, Imagen estática, Carrusel de imágenes, Animación, Texto y Reproductor de música; configurar un widget agregado.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 97 | HE-03-HU04 | Renombrar un tema | Baja | 1 | 7 | 6 | HE-03-HU01 |
| 98 | HE-03-HU05 | Eliminar un tema | Baja | 1 | 3 | 6 | HE-03-HU01 |
| 99 | HE-04-HU05 | Agregar el widget Clima para una ciudad | Baja | 3 | 9 | 17 | HE-04-HU04 |
| 100 | HE-04-HU06 | Agregar el widget Noticias | Baja | 2 | 4 | 8 | HE-04-HU04 |
| 101 | HE-04-HU07 | Agregar el widget Imagen estática con una imagen propia o del catálogo de imágenes | Baja | 2 | 6 | 6 | HE-04-HU04 |
| 102 | HE-04-HU08 | Agregar el widget Carrusel de imágenes con imágenes propias o del catálogo de imágenes | Baja | 3 | 8 | 8 | HE-04-HU04 |
| 103 | HE-04-HU09 | Agregar el widget Animación con una animación del catálogo de animaciones | Baja | 2 | 5 | 9 | HE-04-HU04 |
| 104 | HE-04-HU10 | Agregar el widget Texto | Baja | 1 | 4 | 6 | HE-04-HU04 |
| 105 | HE-04-HU11 | Agregar el widget Reproductor de música | Baja | 3 | 6 | 10 | HE-04-HU04 |
| 106 | HE-04-HU12 | Configurar un widget agregado | Baja | 2 | 5 | 6 | HE-04-HU01 |

Puntos del paso: 20.

**Se prueba al terminar.** Clima cada 30 min y Noticias cada 60 min (RNF-09, caché de las Edge Functions); carrusel de 10 imágenes como máximo (RNF-10); animación pausada con CPU o GPU sobre 80 % durante 10 s (RNF-06); SMTC con una aplicación de música real.

## P22 · Cierre

Controlar la música y abrir una noticia desde los widgets, editar y eliminar etiquetas, eliminar columnas, alternar la vista compacta o expandida de las tarjetas, filtrar reportes por etiqueta y preguntar a Windi por el funcionamiento y por las tarjetas.

| Orden | HU | Historia | Prioridad | Puntos | CA | ET | Depende de |
|---|---|---|---|---|---|---|---|
| 107 | HE-06-HU09 | Controlar la reproducción de música desde el widget Reproductor de música | Baja | 2 | 1 | 4 | HE-04-HU11; HE-06-HU01 |
| 108 | HE-06-HU10 | Abrir una noticia en el navegador desde el widget Noticias | Baja | 1 | 1 | 2 | HE-04-HU06; HE-06-HU01 |
| 109 | HE-08-HU03 | Editar el nombre y el color de una etiqueta | Baja | 2 | 7 | 11 | HE-08-HU02 |
| 110 | HE-08-HU04 | Eliminar una etiqueta | Baja | 2 | 6 | 10 | HE-08-HU02 |
| 111 | HE-09-HU06 | Eliminar las columnas creadas | Baja | 3 | 7 | 9 | HE-09-HU03 |
| 112 | HE-09-HU07 | Alternar entre la vista compacta y la vista expandida de las tarjetas | Baja | 2 | 3 | 5 | HE-09-HU01 |
| 113 | HE-13-HU05 | Filtrar los reportes por etiqueta | Baja | 2 | 7 | 9 | HE-08-HU02; HE-13-HU01 |
| 114 | HE-14-HU08 | Preguntar al agente de IA cómo funciona la aplicación | Baja | 2 | 2 | 3 | HE-14-HU01 |
| 115 | HE-14-HU09 | Preguntar al agente de IA por las tarjetas | Baja | 3 | 4 | 5 | HE-09-HU01; HE-14-HU01 |

Puntos del paso: 19.

**Se prueba al terminar.** Confirmaciones M-09, M-10, M-13 y M-14 con sus textos; todos los CA y ET del backlog en verde; recorrido completo en Windows 10 22H2 y Windows 11; todos los RNF medidos.

## Total

115 ítems del Backlog y 316 puntos en 23 pasos (P00 y P01 no tienen HU).
