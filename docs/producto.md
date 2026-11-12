# Producto

## Qué es Windgets

Windgets es una aplicación de escritorio para Windows que combina un wallpaper personalizable con un planificador. El wallpaper se muestra como fondo real del escritorio, detrás de los íconos, con widgets encima. El planificador organiza tarjetas en un tablero Kanban, un calendario, una agenda diaria y un planificador diario, con reportes y un agente de IA llamado Windi. La información se guarda en el computador, funciona sin conexión y se sincroniza con la nube.

Se distribuye con dos componentes: una **landing page** (CD-01) que describe el producto y ofrece la descarga, y un **instalador .exe todo en uno** (CD-02).

## Roles

| Rol | Dónde actúa |
|---|---|
| Visitante | Landing page, instalador y pantallas de cuenta (Inicio de sesión, Registro, Recuperar contraseña). |
| Usuario | Todas las pantallas con sesión iniciada. |

No existe rol de administrador. El equipo (ForkTech) y el patrocinador no son roles del producto.

## Funciones (las cinco principales de la landing page)

- **Wallpaper personalizable**: pon tu wallpaper como fondo real del escritorio de Windows.
- **Widgets**: coloca widgets de planificación y de información en tu escritorio.
- **Planificador**: organiza tus tarjetas en un tablero Kanban, un calendario, una agenda diaria y un planificador diario, y consulta reportes.
- **Windi**: pide ayuda a Windi, el agente de IA de la aplicación.
- **Sincronización**: encuentra tu información en cualquier computador y trabaja también sin conexión.

Los textos literales de la landing page están en `CD-01.md` (CD-01-HU01-CA01).

## Plataforma

- Windows 10 versión 22H2 (compilación 19045) y Windows 11 (compilación 22000 o posterior), 64 bits (x64) (D-050).
- 500 MB libres. Internet para el primer inicio de sesión.
- Varios monitores: una sola configuración, la misma en todos los monitores (D-135, D-187).
- Instalación por usuario, sin permisos de administrador (D-194).

## Alcance: lo que no se construye

No inventes nada de esta lista; no tiene HU:

- Otros sistemas operativos o arquitecturas (macOS, Linux, Windows en ARM, 32 bits).
- Modo claro y oscuro (el tema define los colores).
- Una configuración distinta por monitor.
- Firma de código del instalador y actualización automática. Las versiones nuevas se descargan de la landing page (D-194).
- Desinstalar y actualizar una instalación existente desde el instalador (no hay HU; D-194).
- Servicios de monitoreo o telemetría (D-196).
- Supabase Realtime (D-189).
- Presupuesto monetario: $0. Un servicio de pago requiere aprobación del patrocinador.

## Cifras del backlog

17 historias épicas (HE-01 a HE-17), 2 componentes de distribución (CD-01, CD-02), 111 HU, 4 reglas transversales (RT-01 a RT-04), 36 RNF y 316 puntos de historia. Cada HU tiene sus CA y sus ET en el archivo de su épica.

## Historias épicas y componentes

<!-- ANEXO GENERADO -->

| Épica o componente | HU | Puntos |
|---|---|---|
| CD-01 Landing page | 2 | 5 |
| CD-02 Instalador | 3 | 7 |
| HE-01 Gestionar el acceso a la cuenta | 8 | 23 |
| HE-02 Gestionar el wallpaper | 13 | 43 |
| HE-03 Gestionar los temas | 6 | 15 |
| HE-04 Gestionar los widgets | 13 | 28 |
| HE-05 Gestionar la distribución de widgets | 5 | 10 |
| HE-06 Gestionar los widgets interactivos | 10 | 33 |
| HE-07 Gestionar las tarjetas | 5 | 13 |
| HE-08 Gestionar las etiquetas | 4 | 7 |
| HE-09 Gestionar el tablero Kanban | 7 | 20 |
| HE-10 Gestionar el calendario | 5 | 15 |
| HE-11 Gestionar la agenda diaria | 3 | 6 |
| HE-12 Gestionar el planificador diario | 3 | 7 |
| HE-13 Gestionar los reportes | 5 | 13 |
| HE-14 Gestionar el agente de IA | 9 | 24 |
| HE-15 Gestionar la sincronización de la información | 4 | 26 |
| HE-16 Gestionar la configuración | 3 | 6 |
| HE-17 Gestionar la ejecución de la aplicación | 3 | 6 |
| Reglas transversales RT-01 a RT-04 | 4 | 9 |
