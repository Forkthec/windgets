# Reglas transversales RT-01 a RT-04

Reglas que aplican a varias HU; cada HU las cita como «(según RT-nn)». Archivo generado desde el backlog. Los CA y las ET son la autoridad.

---

## RT-01 · Menú principal y pantalla principal

- **Regla.** La aplicación debe mostrar el menú principal en todas las pantallas con sesión iniciada, organizado en las secciones Planificador, Personalización y Configuración, y abrir el Planificador diario como pantalla principal al iniciar sesión, al crear la cuenta y al abrir la aplicación con la sesión iniciada.
- **Aplica a.** Todas las pantallas con sesión iniciada, excepto la pantalla de edición (HE-05-HU02 a HE-05-HU05). La pantalla principal se abre al iniciar sesión (HE-01-HU04 y HE-01-HU05) y al crear la cuenta (HE-01-HU03).
- **Depende de:** Ninguna
- **Prioridad:** Alta · **Puntos:** 3 · **Orden en el Backlog:** 43

### Pantallas

| ID | Nombre | Ruta | Contenedor |
|---|---|---|---|
| P-CTA-01 | Inicio de sesión | Inicio de sesión | C-01 |
| P-CTA-02 | Registro | Registro > paso Formulario; Registro > paso Verificar correo | C-01 |
| P-WAL-01 | Personalización del wallpaper | Menú principal > Personalización > Personalización del wallpaper | C-01 |
| P-WID-01 | Widgets | Menú principal > Personalización > Widgets | C-01 |
| P-WAL-02 | Escritorio de Windows (wallpaper y widgets) | el escritorio de Windows | C-02 |
| P-PLA-01 | Planificador diario (pantalla principal) | Menú principal > Planificador > Planificador diario | C-01 |

### Criterios de aceptación (12)

**RT-01-CA01 · Pantalla principal al iniciar sesión con correo electrónico y contraseña**

- Dado que no he iniciado sesión y me encuentro en Inicio de sesión y tengo una cuenta con correo electrónico y contraseña
- Cuando inicio sesión con mi correo electrónico y mi contraseña seleccionando «Iniciar sesión»
- Entonces el sistema abre la pantalla Planificador diario, el menú principal está visible y la opción «Planificador diario» aparece marcada
- Nota. Parte compartida con HE-01-HU04, que lleva la redirección a la pantalla principal.
- ET que lo verifican: ET01, ET03, ET04, ET09

**RT-01-CA02 · Pantalla principal al iniciar sesión con Google**

- Dado que no he iniciado sesión y me encuentro en Inicio de sesión y tengo una cuenta de Google
- Cuando inicio sesión con Google seleccionando «Continuar con Google»
- Entonces el sistema abre la pantalla Planificador diario, el menú principal está visible y la opción «Planificador diario» aparece marcada
- Nota. Parte compartida con HE-01-HU05.
- ET que lo verifican: —

**RT-01-CA03 · Pantalla principal al crear la cuenta**

- Dado que no he iniciado sesión, me encuentro en Registro > paso Verificar correo y el campo Código de verificación contiene el código vigente y correcto
- Cuando verifico el correo electrónico con el código de verificación seleccionando «Verificar»
- Entonces el sistema abre la pantalla Planificador diario, el menú principal está visible y la opción «Planificador diario» aparece marcada
- Nota. Parte compartida con HE-01-HU03, que crea la cuenta.
- ET que lo verifican: —

**RT-01-CA04 · Pantalla principal con la sesión recordada y con conexión**

- Dado que he iniciado sesión antes en este computador y no la he cerrado, tengo conexión a internet y me encuentro en el escritorio de Windows con la aplicación sin abrir
- Cuando abro la aplicación
- Entonces el sistema abre la pantalla Planificador diario, el menú principal está visible y la opción «Planificador diario» aparece marcada
- ET que lo verifican: —

**RT-01-CA05 · Pantalla principal con la sesión recordada y sin conexión**

- Dado que he iniciado sesión antes en este computador y no la he cerrado, no tengo conexión a internet y me encuentro en el escritorio de Windows con la aplicación sin abrir
- Cuando abro la aplicación
- Entonces el sistema abre la pantalla Planificador diario, el menú principal está visible y la opción «Planificador diario» aparece marcada
- ET que lo verifican: —

**RT-01-CA06 · Consultar el menú principal**

- Dado que he iniciado sesión y me encuentro en Menú principal > Planificador > Planificador diario
- Cuando consulto el menú principal
- Entonces puedo ver tres secciones: Planificador, con las opciones «Planificador diario», «Tablero Kanban», «Calendario», «Agenda diaria», «Reportes», «Agente de IA» y «Etiquetas»; Personalización, con las opciones «Personalización del wallpaper», «Temas» y «Widgets»; y Configuración, con la opción «Configuración», y la opción «Planificador diario» aparece marcada porque es la pantalla en la que me encuentro
- ET que lo verifican: ET02

**RT-01-CA07 · Abrir una pantalla desde el menú principal**

- Dado que he iniciado sesión y me encuentro en Menú principal > Planificador > Planificador diario
- Cuando selecciono «Tablero Kanban» en el menú principal
- Entonces el sistema abre la pantalla Tablero Kanban, la opción «Tablero Kanban» aparece marcada en el menú principal y la opción «Planificador diario» deja de estar marcada
- ET que lo verifican: —

**RT-01-CA08 · Cambiar de pantalla con cambios sin guardar ni aplicar**

- Dado que he iniciado sesión, me encuentro en Menú principal > Personalización > Personalización del wallpaper y tengo cambios sin guardar ni aplicar
- Cuando selecciono «Tablero Kanban» en el menú principal
- Entonces el sistema abre el mensaje «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» con las opciones «Salir sin guardar» y «Seguir editando» (según HE-02-HU13-CA02) y no abre la pantalla Tablero Kanban hasta que confirmo la salida
- Nota. Parte compartida con HE-02-HU13, que define las opciones del mensaje y su resultado.
- ET que lo verifican: ET05

**RT-01-CA09 · Cambiar de pantalla con cambios aplicados sin guardar**

- Dado que he iniciado sesión, me encuentro en Menú principal > Personalización > Personalización del wallpaper y tengo cambios aplicados sin guardar
- Cuando selecciono «Tablero Kanban» en el menú principal
- Entonces el sistema abre el mensaje «Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?» con las opciones «Guardar», «Salir sin guardar» y «Seguir editando» (según HE-02-HU13-CA05) y no abre la pantalla Tablero Kanban hasta que confirmo la salida
- Nota. Parte compartida con HE-02-HU13, que define las opciones del mensaje y su resultado.
- ET que lo verifican: —

**RT-01-CA10 · Menú principal sin sesión iniciada**

- Dado que no he iniciado sesión y me encuentro en Inicio de sesión
- Cuando consulto la aplicación
- Entonces el sistema no muestra el menú principal y solo puedo abrir las pantallas Inicio de sesión, Registro y Recuperar contraseña
- ET que lo verifican: ET06

**RT-01-CA11 · Menú principal sin conexión**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Planificador diario y no tengo conexión a internet
- Cuando consulto el menú principal
- Entonces el sistema muestra todas las opciones del menú principal y deshabilita, dentro de la pantalla de cada función, las funciones que requieren conexión, como el agente de IA y los widgets externos (según RT-04 y HE-15-HU02-CA06)
- Nota. Parte compartida con HE-15-HU02, que define los avisos de cada función sin conexión.
- ET que lo verifican: ET07

**RT-01-CA12 · Pantalla de edición sin menú principal**

- Dado que he iniciado sesión y me encuentro en Menú principal > Personalización > Widgets
- Cuando abro la pantalla de edición seleccionando «Editar escritorio»
- Entonces el sistema abre la pantalla de edición sobre todo el escritorio y no muestra el menú principal
- Nota. Parte compartida con HE-05-HU01, que abre la pantalla de edición.
- ET que lo verifican: ET08

### Especificaciones técnicas (9), lista de verificación

- [ ] **ET01** (Interfaz): El menú principal está visible en todas las pantallas con sesión iniciada, excepto en la pantalla de edición. — verificada por CA01
- [ ] **ET02** (Interfaz): El menú principal tiene tres secciones, en este orden: Planificador («Planificador diario», «Tablero Kanban», «Calendario», «Agenda diaria», «Reportes», «Agente de IA» y «Etiquetas»), Personalización («Personalización del wallpaper», «Temas» y «Widgets») y Configuración («Configuración»). — verificada por CA06
- [ ] **ET03** (Interfaz): El menú principal marca la opción de la pantalla en la que está el usuario y solo esa opción. — verificada por CA01
- [ ] **ET04** (Datos y reglas): La pantalla principal es el Planificador diario y se abre al iniciar sesión con correo electrónico y contraseña, al iniciar sesión con Google, al crear la cuenta y al abrir la aplicación con la sesión iniciada, con o sin conexión. — verificada por CA01
- [ ] **ET05** (Datos y reglas): Con cambios sin guardar en la pantalla Personalización del wallpaper, seleccionar otra opción del menú principal abre primero el mensaje de cambios sin guardar de HE-02-HU13 y no cambia de pantalla hasta que el usuario confirma la salida. — verificada por CA08
- [ ] **ET06** (Datos y reglas): Antes de iniciar sesión el menú principal no aparece y solo están disponibles las pantallas Inicio de sesión, Registro y Recuperar contraseña. — verificada por CA10
- [ ] **ET07** (Datos y reglas): Sin conexión el menú principal muestra todas las opciones y las funciones que requieren conexión (el agente de IA y los widgets externos) se deshabilitan dentro de su pantalla, según RT-04 y HE-15-HU02. — verificada por CA11
- [ ] **ET08** (Interfaz): La pantalla de edición ocupa todo el escritorio y no muestra el menú principal. — verificada por CA12
- [ ] **ET09** (Decisiones y trazabilidad): D-014 (Resuelta): el menú principal se organiza en las tres secciones del charter y la pantalla principal es el Planificador diario. Decisión del equipo del 29/09/2026. Requerimiento R2. — verificada por CA01

### Contratos

INT-01, IPC-AUTH-02, IPC-AUTH-05. Detalle en `contratos.md`.

---

## RT-02 · Ventanas emergentes

- **Regla.** La aplicación debe abrir como ventanas emergentes, sobre la pantalla actual, el detalle de tarjeta, el formulario de tarjeta, los formularios de etiqueta, columna y tema, y los mensajes de confirmación; al cerrarlas, el usuario sigue en la misma pantalla.
- **Aplica a.** HE-03-HU02 y HE-03-HU04; HE-07-HU01 a HE-07-HU05; HE-08-HU02 a HE-08-HU04; HE-09-HU03, HE-09-HU04 y HE-09-HU06; HE-10-HU03 y HE-10-HU04; HE-06-HU08; y todos los mensajes de confirmación (HE-02-HU12, HE-02-HU13, HE-03-HU03, HE-03-HU05, HE-03-HU06, HE-04-HU13, HE-07-HU05, HE-08-HU04, HE-09-HU06 y HE-16-HU03).
- **Depende de:** RT-01
- **Prioridad:** Alta · **Puntos:** 2 · **Orden en el Backlog:** 44

### Pantallas

| ID | Nombre | Ruta | Contenedor |
|---|---|---|---|
| P-TAR-01 | Detalle de tarjeta | tengo abierta la ventana emergente Detalle de tarjeta | C-01 |
| P-TAR-02 | Formulario de tarjeta | tengo abierta la ventana emergente Formulario de tarjeta; tengo abierta la ventana emergente Formulario de tarjeta en modo edición | C-01 |
| P-KAN-01 | Tablero Kanban | Menú principal > Planificador > Tablero Kanban | C-01 |

### Criterios de aceptación (9)

**RT-02-CA01 · Abrir el detalle de una tarjeta**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y el tablero tiene al menos una tarjeta
- Cuando selecciono el título de una tarjeta
- Entonces el sistema abre la ventana emergente Detalle de tarjeta sobre la pantalla Tablero Kanban, que permanece visible de fondo (según HE-07-HU03-CA01)
- Nota. Se verifica también en Calendario, Agenda diaria y Planificador diario (RT-02-ET03). Parte compartida con HE-07-HU03.
- ET que lo verifican: ET01, ET02, ET03, ET09

**RT-02-CA02 · Cerrar el detalle de una tarjeta**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Detalle de tarjeta
- Cuando selecciono «Cerrar»
- Entonces el sistema cierra la ventana emergente y permanezco en la pantalla Tablero Kanban, con el mismo contenido y la misma posición de desplazamiento que tenía antes de abrirla
- Nota. Parte compartida con HE-07-HU03.
- ET que lo verifican: ET04, ET06

**RT-02-CA03 · Cancelar un formulario en una ventana emergente**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Formulario de tarjeta
- Cuando selecciono «Cancelar»
- Entonces el sistema cierra la ventana emergente sin guardar cambios y permanezco en la pantalla Tablero Kanban, con el mismo contenido y la misma posición de desplazamiento que tenía antes de abrirla
- ET que lo verifican: —

**RT-02-CA04 · Cerrar una ventana emergente con la tecla Esc**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Formulario de tarjeta
- Cuando selecciono la tecla Esc
- Entonces el sistema actúa igual que con «Cancelar»: cierra la ventana emergente sin guardar cambios y permanezco en la pantalla Tablero Kanban
- ET que lo verifican: ET05

**RT-02-CA05 · Pasar del detalle al formulario de tarjeta**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Detalle de tarjeta
- Cuando selecciono «Editar»
- Entonces el sistema reemplaza la ventana emergente Detalle de tarjeta por la ventana emergente Formulario de tarjeta en modo edición (según HE-07-HU04)
- Nota. Parte compartida con HE-07-HU04.
- ET que lo verifican: ET07

**RT-02-CA06 · Regresar al detalle al cancelar la edición**

- Dado que he iniciado sesión y me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Formulario de tarjeta en modo edición, abierta desde Detalle de tarjeta
- Cuando selecciono «Cancelar»
- Entonces el sistema cierra el formulario sin guardar cambios y abre de nuevo la ventana emergente Detalle de tarjeta
- ET que lo verifican: —

**RT-02-CA07 · Regresar al detalle al guardar la edición**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban, tengo abierta la ventana emergente Formulario de tarjeta en modo edición, abierta desde Detalle de tarjeta, y el campo Título contiene un título válido
- Cuando guardo los cambios de la tarjeta seleccionando «Guardar»
- Entonces el sistema guarda los cambios, cierra el formulario y abre de nuevo la ventana emergente Detalle de tarjeta con la información actualizada
- Nota. Parte compartida con HE-07-HU04.
- ET que lo verifican: —

**RT-02-CA08 · Pantalla de fondo bloqueada**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Detalle de tarjeta
- Cuando selecciono un elemento de la pantalla de fondo
- Entonces el sistema no responde a la selección y la ventana emergente permanece abierta
- ET que lo verifican: ET08

**RT-02-CA09 · Menú principal bloqueado**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Detalle de tarjeta
- Cuando selecciono una opción del menú principal
- Entonces el sistema no abre la pantalla elegida y la ventana emergente permanece abierta
- ET que lo verifican: —

### Especificaciones técnicas (9), lista de verificación

- [ ] **ET01** (Interfaz): Son ventanas emergentes el Detalle de tarjeta, el Formulario de tarjeta, los formularios de etiqueta, columna y tema, y los mensajes de confirmación. — verificada por CA01
- [ ] **ET02** (Interfaz): Una ventana emergente se abre sobre la pantalla actual y esta permanece visible de fondo. — verificada por CA01
- [ ] **ET03** (Interacción): Seleccionar el título de una tarjeta en Tablero Kanban, Calendario, Agenda diaria o Planificador diario abre la ventana emergente Detalle de tarjeta. — verificada por CA01
- [ ] **ET04** (Interacción): «Cerrar» cierra el Detalle de tarjeta y «Cancelar» cierra los formularios y los mensajes de confirmación, sin guardar cambios ni ejecutar la acción. — verificada por CA02
- [ ] **ET05** (Interacción): La tecla Esc del teclado equivale a «Cerrar» en el Detalle de tarjeta y a «Cancelar» en los formularios y los mensajes de confirmación. — verificada por CA04
- [ ] **ET06** (Datos y reglas): Al cerrar una ventana emergente, el usuario sigue en la misma pantalla, con el mismo contenido y la misma posición de desplazamiento que tenía. — verificada por CA02
- [ ] **ET07** (Interacción): «Editar» en el Detalle de tarjeta reemplaza el detalle por el Formulario de tarjeta en modo edición; al guardar o cancelar se regresa al Detalle de tarjeta. — verificada por CA05
- [ ] **ET08** (Interacción): Mientras hay una ventana emergente abierta, la pantalla de fondo y el menú principal no responden a la selección. — verificada por CA08
- [ ] **ET09** (Decisiones y trazabilidad): D-015 (Resuelta): las ventanas emergentes se abren sobre la pantalla actual y al cerrarse el usuario sigue en la misma pantalla. Decisión del equipo del 29/09/2026. Requerimiento R2. — verificada por CA01

---

## RT-03 · Miga de pan y Regresar

- **Regla.** Las pantallas de las rutas definidas, con pasos o subpantallas, deben mostrar la miga de pan y la opción «Regresar», para que el usuario sepa en qué parte de la ruta está y pueda volver a cualquier punto anterior de esa ruta.
- **Aplica a.** Ruta «Inicio de sesión > Recuperar contraseña» (HE-01-HU06 a HE-01-HU08) y ruta «Widgets > Agregar widget > <widget>» (HE-04-HU04 a HE-04-HU11).
- **Depende de:** Ninguna
- **Prioridad:** Alta · **Puntos:** 2 · **Orden en el Backlog:** 45

### Pantallas

| ID | Nombre | Ruta | Contenedor |
|---|---|---|---|
| P-CTA-02 | Registro | Registro > paso Formulario; Registro > paso Verificar correo | C-01 |
| P-CTA-03 | Recuperar contraseña | Inicio de sesión > Recuperar contraseña; Inicio de sesión > Recuperar contraseña > paso Correo electrónico; Inicio de sesión > Recuperar contraseña > paso Diligenciar código; Inicio de sesión > Recuperar contraseña > paso Nueva contraseña | C-01 |
| P-WID-02 | Agregar widget | Menú principal > Personalización > Widgets > Agregar widget | C-01 |
| P-WID-03 | Clima | Menú principal > Personalización > Widgets > Agregar widget > Clima | C-01 |

### Criterios de aceptación (7)

**RT-03-CA01 · Mostrar la miga de pan**

- Dado que he iniciado sesión y me encuentro en Menú principal > Personalización > Widgets > Agregar widget
- Cuando selecciono el widget Clima en el catálogo de widgets
- Entonces el sistema abre la subpantalla del widget Clima con la miga de pan «Widgets > Agregar widget > Clima» en la parte superior y las opciones «Agregar» y «Regresar»
- ET que lo verifican: ET01, ET02, ET03, ET07

**RT-03-CA02 · Volver a la pantalla Widgets con la miga de pan**

- Dado que he iniciado sesión y me encuentro en Menú principal > Personalización > Widgets > Agregar widget > Clima
- Cuando selecciono «Widgets» en la miga de pan
- Entonces el sistema abre la pantalla Widgets y no agrega el widget
- ET que lo verifican: ET04

**RT-03-CA03 · Volver a un punto intermedio de la ruta con la miga de pan**

- Dado que he iniciado sesión y me encuentro en Menú principal > Personalización > Widgets > Agregar widget > Clima
- Cuando selecciono «Agregar widget» en la miga de pan
- Entonces el sistema abre la subpantalla Agregar widget con el catálogo de widgets y no agrega el widget
- ET que lo verifican: —

**RT-03-CA04 · Regresar al paso anterior**

- Dado que he iniciado sesión y me encuentro en Menú principal > Personalización > Widgets > Agregar widget > Clima
- Cuando selecciono «Regresar»
- Entonces el sistema abre la subpantalla Agregar widget con el catálogo de widgets, sin agregar el widget
- ET que lo verifican: ET05

**RT-03-CA05 · Terminar la ruta**

- Dado que he iniciado sesión y me encuentro en Menú principal > Personalización > Widgets > Agregar widget > Clima y el campo Ciudad contiene una ciudad que el servicio de clima reconoce
- Cuando agrego el widget seleccionando «Agregar»
- Entonces el sistema agrega el widget y abre la pantalla Widgets con el widget en la lista (según HE-04-HU01-CA02)
- Nota. Parte compartida con HE-04-HU05, que define la configuración del widget Clima.
- ET que lo verifican: ET06

**RT-03-CA06 · Miga de pan en Recuperar contraseña**

- Dado que no he iniciado sesión y me encuentro en Inicio de sesión > Recuperar contraseña > paso Diligenciar código
- Cuando consulto la parte superior de la pantalla
- Entonces el sistema muestra la miga de pan «Inicio de sesión > Recuperar contraseña» y la opción «Regresar» (según HE-01-HU06-CA07 y HE-01-HU07-CA08)
- Nota. Se verifica en los tres pasos: Correo electrónico, Diligenciar código y Nueva contraseña (RT-03-ET02). Parte compartida con HE-01-HU06 y HE-01-HU07.
- ET que lo verifican: —

**RT-03-CA07 · Registro sin miga de pan**

- Dado que no he iniciado sesión y me encuentro en Registro > paso Verificar correo
- Cuando consulto la parte superior de la pantalla
- Entonces el sistema muestra la opción «Regresar» y no muestra miga de pan (RT-03-ET08)
- ET que lo verifican: ET08

### Especificaciones técnicas (8), lista de verificación

- [ ] **ET01** (Interfaz): La miga de pan se muestra en la parte superior de la pantalla, subpantalla o paso que tiene una ruta definida. — verificada por CA01
- [ ] **ET02** (Datos y reglas): Las rutas definidas son «Inicio de sesión > Recuperar contraseña», con los pasos Correo electrónico, Diligenciar código y Nueva contraseña, y «Widgets > Agregar widget > <widget>», con los widgets Clima, Noticias, Reproductor de música, Animación, Carrusel de imágenes, Imagen estática y Texto. — verificada por CA01
- [ ] **ET03** (Interfaz): La opción «Regresar» se muestra en cada pantalla, subpantalla o paso que muestra la miga de pan. — verificada por CA01
- [ ] **ET04** (Interacción): Cada nivel anterior de la miga de pan se puede seleccionar y lleva a ese nivel sin completar la acción de la ruta, es decir, sin agregar el widget y sin cambiar la contraseña. — verificada por CA02
- [ ] **ET05** (Interacción): «Regresar» vuelve a la pantalla, subpantalla o paso inmediatamente anterior de la ruta sin completar la acción. — verificada por CA04
- [ ] **ET06** (Datos y reglas): Al terminar la ruta de Agregar widget con «Agregar», se agrega el widget y se abre la pantalla Widgets con el widget en la lista. — verificada por CA05
- [ ] **ET07** (Decisiones y trazabilidad): Glosario: Miga de pan, Regresar, Paso y Subpantalla. Requerimiento R2. — verificada por CA01
- [ ] **ET08** (Datos y reglas): La pantalla Registro, con los pasos Formulario y Verificar correo, conserva la opción «Regresar» y no muestra miga de pan, porque su ruta no está entre las rutas definidas (D-173). — verificada por CA07

---

## RT-04 · Mensajes, opciones deshabilitadas y alineación

- **Regla.** La aplicación debe informar resultados, errores e incompatibilidades de forma clara y no invasiva, con un tipo de mensaje definido para cada caso; deshabilitar las opciones que no están disponibles en lugar de mostrar un error después de seleccionarlas; y alinear verticalmente al centro los elementos de la interfaz.
- **Aplica a.** Todas las pantallas, ventanas emergentes, subpantallas y widgets de la aplicación, y el instalador (CD-02). Los CA de las HU la citan como «(según RT-04)».
- **Depende de:** Ninguna
- **Prioridad:** Alta · **Puntos:** 2 · **Orden en el Backlog:** 46

### Pantallas

| ID | Nombre | Ruta | Contenedor |
|---|---|---|---|
| P-CTA-01 | Inicio de sesión | Inicio de sesión | C-01 |
| P-TEM-01 | Temas | Menú principal > Personalización > Temas | C-01 |
| P-WID-02 | Agregar widget | Menú principal > Personalización > Widgets > Agregar widget | C-01 |
| P-WID-03 | Clima | Menú principal > Personalización > Widgets > Agregar widget > Clima | C-01 |
| P-WAL-02 | Escritorio de Windows (wallpaper y widgets) | el escritorio de Windows | C-02 |
| P-TAR-02 | Formulario de tarjeta | tengo abierta la ventana emergente Formulario de tarjeta; tengo abierta la ventana emergente Formulario de tarjeta en modo edición | C-01 |
| P-ETQ-01 | Etiquetas | Menú principal > Planificador > Etiquetas | C-01 |
| P-KAN-01 | Tablero Kanban | Menú principal > Planificador > Tablero Kanban | C-01 |
| P-AGE-01 | Agenda diaria | Menú principal > Planificador > Agenda diaria | C-01 |
| P-PLA-01 | Planificador diario (pantalla principal) | Menú principal > Planificador > Planificador diario | C-01 |

### Criterios de aceptación (14)

**RT-04-CA01 · Mensaje de resultado**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Formulario de tarjeta con un título válido y una fecha límite válida
- Cuando creo la tarjeta seleccionando «Guardar»
- Entonces puedo ver el mensaje «Tarjeta creada.» en la esquina inferior derecha de la ventana de la aplicación, puedo seguir seleccionando opciones de la pantalla y del menú principal mientras está visible y el sistema lo oculta a los 4 segundos
- Nota. Parte compartida con HE-07-HU01, que define el texto de cada mensaje de resultado.
- ET que lo verifican: ET01, ET02, ET04, ET22, ET23

**RT-04-CA02 · Cerrar el mensaje de resultado**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y el mensaje «Tarjeta creada.» está visible
- Cuando cierro el mensaje seleccionando «×»
- Entonces el sistema oculta el mensaje sin esperar los 4 segundos
- ET que lo verifican: ET03

**RT-04-CA03 · Mensaje de campo**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Formulario de tarjeta con el campo Título vacío y el campo Fecha límite con el valor «31/02/2026»
- Cuando creo la tarjeta seleccionando «Guardar»
- Entonces puedo ver el mensaje «Este campo es obligatorio.» debajo del campo Título y el mensaje «Diligencia una fecha válida.» debajo del campo Fecha límite, el sistema resalta el borde de ambos campos, lleva el cursor al campo Título, que es el primer campo con error, y no crea la tarjeta
- Nota. Parte compartida con HE-07-HU01, que define los campos del formulario y sus mensajes.
- ET que lo verifican: ET05, ET06, ET08

**RT-04-CA04 · Corregir el valor de un campo con mensaje**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Tablero Kanban y tengo abierta la ventana emergente Formulario de tarjeta con el mensaje «Este campo es obligatorio.» debajo del campo Título
- Cuando diligencio un título válido en el campo Título
- Entonces el sistema quita el mensaje del campo Título y el borde del campo deja de estar resaltado
- ET que lo verifican: ET07

**RT-04-CA05 · Opción deshabilitada con el motivo**

- Dado que he iniciado sesión, me encuentro en Menú principal > Personalización > Widgets > Agregar widget y ya tengo agregado el widget Noticias
- Cuando consulto el widget Noticias en el catálogo de widgets
- Entonces el sistema muestra el widget en gris, sin responder cuando lo selecciono, y puedo ver junto a él el texto «Ya agregaste este widget.», sin que se abran mensajes adicionales; si no hay espacio junto a la opción, puedo ver el texto al pasar el mouse sobre ella
- Nota. Si el texto del motivo no cabe junto a la opción, se verifica al pasar el mouse sobre ella (RT-04-ET11). Parte compartida con HE-04-HU04.
- ET que lo verifican: ET09, ET10, ET11, ET12

**RT-04-CA06 · Aviso por error de un servicio externo**

- Dado que he iniciado sesión, me encuentro en el escritorio de Windows, tengo agregado el widget Noticias y el servicio de noticias no responde
- Cuando consulto el widget Noticias
- Entonces puedo ver en la parte superior del widget el aviso «No pudimos cargar las noticias. Intenta de nuevo más tarde.», que dice qué ocurrió y qué puedo hacer, y el sistema no bloquea el resto de los widgets ni de la aplicación
- Nota. El aviso se verifica también con las otras dos causas de RT-04-ET14: falta de conexión e incompatibilidad del computador. Parte compartida con HE-04-HU06.
- ET que lo verifican: ET13, ET14, ET15

**RT-04-CA07 · Quitar el aviso cuando se resuelve el problema**

- Dado que he iniciado sesión, me encuentro en el escritorio de Windows, tengo agregado el widget Noticias, no tengo conexión a internet y el widget muestra el aviso «Sin conexión. El widget se actualizará al reconectarte.»
- Cuando recupero la conexión a internet
- Entonces el sistema actualiza el contenido del widget Noticias y quita el aviso
- Nota. Parte compartida con HE-15-HU02, que define el aviso y la actualización de los widgets externos sin conexión.
- ET que lo verifican: ET16

**RT-04-CA08 · Mensaje de confirmación**

- Dado que he iniciado sesión, me encuentro en Menú principal > Personalización > Temas y tengo un tema que no es el tema aplicado
- Cuando elimino el tema seleccionando «Eliminar»
- Entonces el sistema abre como ventana emergente (según RT-02) el mensaje «¿Deseas eliminar el tema “<nombre del tema>”? Esta acción no se puede deshacer.», con la opción principal «Eliminar» y la opción «Cancelar», y el tema sigue en la lista hasta que confirmo
- Nota. El instalador (CD-02-HU03) es la única excepción: su mensaje de confirmación ofrece «Seguir instalando» en lugar de «Cancelar».
- ET que lo verifican: ET17, ET18

**RT-04-CA09 · Acción que se puede deshacer sin confirmación**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Agenda diaria y tengo una tarjeta asignada a un bloque horario
- Cuando quito la tarjeta del bloque horario seleccionando «Quitar del horario»
- Entonces el sistema quita la tarjeta del bloque horario sin pedir confirmación, puedo ver la tarjeta en Tarjetas sin horario y puedo ver el mensaje «Tarjeta quitada del horario.»
- Nota. Parte compartida con HE-11-HU03.
- ET que lo verifican: —

**RT-04-CA10 · Estado vacío**

- Dado que he iniciado sesión, me encuentro en Menú principal > Planificador > Etiquetas y no tengo etiquetas creadas
- Cuando consulto la pantalla Etiquetas
- Entonces el sistema muestra, en lugar de la lista, el mensaje «Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.» y la opción «Nueva etiqueta», sin mostrar errores ni ceros que no correspondan
- Nota. Parte compartida con HE-08-HU01.
- ET que lo verifican: ET19

**RT-04-CA11 · Alineación vertical centrada**

- Dado que he iniciado sesión y me encuentro en Menú principal > Planificador > Planificador diario, donde cada tarjeta muestra una casilla de completada y un título en la misma línea
- Cuando consulto la pantalla Planificador diario
- Entonces la casilla de completada y el título de cada tarjeta quedan alineados verticalmente al centro entre sí
- Nota. Se verifica en cada pantalla, ventana emergente, subpantalla y widget (RT-04-ET20).
- ET que lo verifican: ET20

**RT-04-CA12 · Formulario de un solo campo obligatorio**

- Dado que he iniciado sesión, me encuentro en Menú principal > Personalización > Widgets > Agregar widget > Clima y el campo Ciudad está vacío o solo tiene espacios
- Cuando consulto la subpantalla del widget Clima
- Entonces el sistema muestra la opción «Agregar» deshabilitada y no muestra el mensaje «Este campo es obligatorio.»
- Nota. Se verifica también con el campo Nombre del formulario de tema (RT-04-ET21). Parte compartida con HE-04-HU05.
- ET que lo verifican: ET21

**RT-04-CA13 · Servicio de cuentas sin respuesta**

- Dado que no he iniciado sesión, me encuentro en Inicio de sesión, he diligenciado un correo electrónico y una contraseña válidos y el servicio de cuentas no responde
- Cuando inicio sesión seleccionando «Iniciar sesión»
- Entonces puedo ver el aviso «No pudimos completar la operación. Intenta de nuevo más tarde.» (según RT-04), el sistema no inicia la sesión, me mantiene en Inicio de sesión y conserva el correo electrónico y la contraseña que diligencié
- ET que lo verifican: ET24, ET25

**RT-04-CA14 · Botón deshabilitado mientras se procesa**

- Dado que no he iniciado sesión, me encuentro en Inicio de sesión y he diligenciado un correo electrónico y una contraseña válidos
- Cuando inicio sesión seleccionando «Iniciar sesión»
- Entonces puedo ver el botón «Iniciar sesión» deshabilitado (según RT-04) mientras el sistema procesa la solicitud y el sistema no envía una segunda solicitud
- ET que lo verifican: ET26

### Especificaciones técnicas (26), lista de verificación

- [ ] **ET01** (Interfaz): El mensaje de resultado es un texto breve que se muestra en la esquina inferior derecha de la ventana de la aplicación, sin bloquear la pantalla ni el menú principal. — verificada por CA01
- [ ] **ET02** (Datos y reglas): El mensaje de resultado se oculta a los 4 segundos de aparecer (según RNF-27). — verificada por CA01
- [ ] **ET03** (Interfaz): El mensaje de resultado tiene la opción «×», que lo cierra antes de los 4 segundos (según RNF-27). — verificada por CA02
- [ ] **ET04** (Datos y reglas): No toda acción muestra un mensaje de resultado; el CA de cada HU indica cuándo se muestra y su texto exacto. — verificada por CA01
- [ ] **ET05** (Interfaz): El mensaje de campo se muestra debajo del campo que está vacío siendo obligatorio o que tiene un valor inválido, y el borde del campo se resalta. — verificada por CA03
- [ ] **ET06** (Interacción): Cuando un formulario tiene mensajes de campo, el cursor va al primer campo con error. — verificada por CA03
- [ ] **ET07** (Datos y reglas): El mensaje de campo desaparece cuando el usuario corrige el valor. — verificada por CA04
- [ ] **ET08** (Datos y reglas): El formato y los límites de cada campo los define la HU de su formulario; por ejemplo, la Fecha límite del Formulario de tarjeta tiene el formato DD/MM/AAAA y debe existir en el calendario, así que «31/02/2026» es un valor inválido (HE-07-HU01). — verificada por CA03
- [ ] **ET09** (Interfaz): Una opción deshabilitada se ve en gris y no responde a la selección. — verificada por CA05
- [ ] **ET10** (Interfaz): Una opción deshabilitada muestra junto a ella el texto que explica el motivo. — verificada por CA05
- [ ] **ET11** (Interacción): Cuando no hay espacio junto a la opción deshabilitada, el texto del motivo aparece al pasar el mouse sobre ella. — verificada por CA05
- [ ] **ET12** (Datos y reglas): La aplicación deshabilita una opción, en lugar de mostrar un error después de seleccionarla, cuando se alcanzó un máximo, cuando un formulario de un solo campo obligatorio está vacío o cuando la función requiere conexión, y no abre mensajes adicionales. — verificada por CA05
- [ ] **ET13** (Interfaz): El aviso se muestra en la parte superior de la pantalla, sección, widget o paso afectado y dice qué ocurrió y qué puede hacer el usuario. — verificada por CA06
- [ ] **ET14** (Datos y reglas): Se muestra un aviso por falta de conexión, por un error de un servicio externo o por una incompatibilidad del computador, antes de que el usuario intente la función o en el momento del fallo. — verificada por CA06
- [ ] **ET15** (Datos y reglas): El aviso no bloquea el resto de la aplicación. — verificada por CA06
- [ ] **ET16** (Datos y reglas): El aviso desaparece cuando el problema se resuelve. — verificada por CA07
- [ ] **ET17** (Interfaz): El mensaje de confirmación es una ventana emergente (según RT-02) cuya opción principal lleva el verbo de la acción, como «Eliminar», y que siempre tiene la opción «Cancelar»; la excepción es el mensaje de confirmación del instalador, cuya opción para salir es «Seguir instalando» porque «Cancelar» sería ambiguo con «Cancelar instalación» (D-149). — verificada por CA08
- [ ] **ET18** (Datos y reglas): Piden confirmación las acciones que no se pueden deshacer o que reemplazan la personalización, como eliminar o aplicar un tema; las acciones que se pueden deshacer no piden confirmación. — verificada por CA08
- [ ] **ET19** (Interfaz): El estado vacío ocupa el lugar del contenido de la pantalla, sección, lista o widget que no tiene elementos; su texto lo define la HU y no muestra errores ni ceros que no correspondan. — verificada por CA10
- [ ] **ET20** (Interfaz): Los elementos que están en una misma línea, como íconos, textos, casillas, botones, campos e interruptores, se alinean verticalmente al centro entre sí; la alineación horizontal sigue el diseño de cada pantalla. — verificada por CA11
- [ ] **ET21** (Datos y reglas): Un formulario con un único campo obligatorio deshabilita su opción principal mientras el campo está vacío o solo tiene espacios, y no muestra «Este campo es obligatorio.». — verificada por CA12
- [ ] **ET22** (Datos y reglas): Hay seis tipos de mensaje, cada uno para un caso: resultado, campo, opción deshabilitada, aviso, confirmación y estado vacío; el texto exacto de cada mensaje está en su HU. — verificada por CA01
- [ ] **ET23** (Decisiones y trazabilidad): D-036 (Resuelta): los comportamientos y mensajes repetidos se definen una sola vez. D-056 (Resuelta): mensaje de resultado en la esquina inferior derecha, se oculta a los 4 segundos o con «×». D-059 (Resuelta): los términos están en el glosario. Requerimiento R2. — verificada por CA01
- [ ] **ET24** (Datos y reglas): Si el servicio de cuentas no responde en «Crear cuenta», «Iniciar sesión», «Enviar código», «Verificar» o «Guardar contraseña», la aplicación muestra el aviso «No pudimos completar la operación. Intenta de nuevo más tarde.», no avanza de paso y conserva lo diligenciado. — verificada por CA13
- [ ] **ET25** (Decisiones y trazabilidad): D-205: una sola regla para los flujos de cuenta (Registro, Inicio de sesión y Recuperar contraseña), porque HE-01-HU01 y HE-01-HU04 ya tienen 12 CA. — verificada por CA13
- [ ] **ET26** (Interacción): Mientras se procesa «Crear cuenta», «Iniciar sesión», «Enviar código», «Verificar» o «Guardar contraseña», el botón correspondiente queda deshabilitado. — verificada por CA14

### Contratos

IPC-WID-04. Detalle en `contratos.md`.

### Requisitos no funcionales aplicables

| RNF | Requisito | Medida |
|---|---|---|
| RNF-27 | Informar con los tipos de mensaje definidos | Mensaje de resultado visible 4 segundos |

### Mensajes literales por pantalla

| Pantalla | Mensaje o texto literal | Tipo RT-04 | CA |
|---|---|---|---|
| P-CTA-01 | «Correo electrónico o contraseña incorrectos.» | resultado | HE-01-HU04-CA08 |
| P-CTA-01 | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | aviso | HE-01-HU04-CA09 |
| P-CTA-01 | «Diligencia un correo electrónico válido.» | campo | HE-01-HU04-CA06 |
| P-CTA-01 | «El correo electrónico no puede superar los 64 caracteres.» | campo | HE-01-HU04-CA07 |
| P-CTA-01 | «Este campo es obligatorio.» | campo | HE-01-HU04-CA03, HE-01-HU04-CA04, HE-01-HU04-CA05 |
| P-CTA-01 | «No fue posible iniciar sesión con Google. Intenta de nuevo.» | aviso | HE-01-HU05-CA06 |
| P-CTA-01 | «No hay conexión a internet. Conéctate para iniciar sesión.» | aviso | HE-01-HU04-CA10 |
| P-CTA-01 | «No pudimos completar la operación. Intenta de nuevo más tarde.» | aviso | RT-04-CA13 |
| P-CTA-01 | «No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.» | aviso | HE-01-HU05-CA08 |
| P-CTA-01 | «Se canceló el inicio de sesión con Google.» | aviso | HE-01-HU05-CA05 |
| P-CTA-01 | «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.» | resultado | HE-01-HU05-CA01, HE-01-HU05-CA03, HE-01-HU05-CA04 |
| P-CTA-02 | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | aviso | HE-01-HU03-CA05 |
| P-CTA-02 | «Diligencia un correo electrónico válido.» | campo | HE-01-HU01-CA06 |
| P-CTA-02 | «El alias no puede superar los 30 caracteres.» | campo | HE-01-HU01-CA03 |
| P-CTA-02 | «El correo electrónico no puede superar los 64 caracteres.» | campo | HE-01-HU01-CA07 |
| P-CTA-02 | «El código no es correcto. Revísalo e intenta de nuevo.» | campo | HE-01-HU03-CA03 |
| P-CTA-02 | «El código venció. Solicita uno nuevo.» | campo | HE-01-HU03-CA04 |
| P-CTA-02 | «Este campo es obligatorio.» | campo | HE-01-HU01-CA02, HE-01-HU01-CA05, HE-01-HU02-CA02 (+3) |
| P-CTA-02 | «Este correo electrónico ya está registrado.» | resultado | HE-01-HU01-CA08 |
| P-CTA-02 | «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» | campo | HE-01-HU02-CA04, HE-01-HU02-CA05, HE-01-HU02-CA06 |
| P-CTA-02 | «Las contraseñas no coinciden.» | campo | HE-01-HU02-CA08 |
| P-CTA-02 | «No hay conexión a internet. Conéctate para crear tu cuenta.» | opción deshabilitada | HE-01-HU01-CA12, HE-01-HU03-CA09 |
| P-CTA-02 | «Puedes pedir un nuevo código en <segundos restantes> s.» | opción deshabilitada | HE-01-HU03-CA07 |
| P-CTA-02 | «Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.» | resultado | HE-01-HU01-CA01 |
| P-CTA-02 | «Te enviamos un nuevo código.» | resultado | HE-01-HU03-CA06 |
| P-CTA-02 | «¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.» | resultado | HE-01-HU03-CA01 |
| P-CTA-03 | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | aviso | HE-01-HU07-CA05 |
| P-CTA-03 | «Diligencia un correo electrónico válido.» | campo | HE-01-HU06-CA04 |
| P-CTA-03 | «El correo electrónico no puede superar los 64 caracteres.» | campo | HE-01-HU06-CA05 |
| P-CTA-03 | «El código no es correcto. Revísalo e intenta de nuevo.» | campo | HE-01-HU07-CA03 |
| P-CTA-03 | «El código venció. Solicita uno nuevo.» | campo | HE-01-HU07-CA04 |
| P-CTA-03 | «Elige una contraseña distinta de la actual.» | campo | HE-01-HU08-CA07 |
| P-CTA-03 | «Este campo es obligatorio.» | campo | HE-01-HU06-CA03, HE-01-HU07-CA02, HE-01-HU08-CA02 |
| P-CTA-03 | «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» | campo | HE-01-HU08-CA03 |
| P-CTA-03 | «Las contraseñas no coinciden.» | campo | HE-01-HU08-CA04 |
| P-CTA-03 | «No hay conexión a internet. Conéctate para recuperar tu contraseña.» | opción deshabilitada | HE-01-HU06-CA06, HE-01-HU07-CA09, HE-01-HU08-CA05 (+1) |
| P-CTA-03 | «Puedes pedir un nuevo código en <segundos restantes> s.» | opción deshabilitada | HE-01-HU07-CA07 |
| P-CTA-03 | «Si el correo está registrado, te enviamos un código de verificación.» | aviso | HE-01-HU06-CA01, HE-01-HU06-CA02 |
| P-CTA-03 | «Te enviamos un nuevo código.» | resultado | HE-01-HU07-CA06 |
| P-CTA-03 | «Tu contraseña fue actualizada. Ya puedes iniciar sesión.» | resultado | HE-01-HU08-CA01 |
| P-WAL-01 | «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.» | opción deshabilitada | HE-03-HU02-CA05 |
| P-WAL-01 | «Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?» | confirmación | HE-02-HU13-CA05, RT-01-CA09 |
| P-WAL-01 | «Cambios aplicados. Recuerda guardarlos para no perderlos.» | resultado | HE-02-HU12-CA04 |
| P-WAL-01 | «Cambios guardados en el tema “<nombre del tema>”.» | resultado | HE-02-HU11-CA01 |
| P-WAL-01 | «Cambios guardados. Selecciona Aplicar para verlos en tu escritorio.» | resultado | HE-02-HU11-CA02 |
| P-WAL-01 | «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).» | campo | HE-02-HU05-CA03 |
| P-WAL-01 | «El contraste de estos colores es bajo (<contraste>:1). Prueba con <color sugerido>.» | resultado | HE-02-HU05-CA05 |
| P-WAL-01 | «Esta plantilla ya muestra su imagen de fondo por defecto.» | opción deshabilitada | HE-02-HU04-CA02 |
| P-WAL-01 | «Este campo es obligatorio.» | campo | HE-02-HU05-CA04 |
| P-WAL-01 | «Este tema ya está aplicado.» | opción deshabilitada | HE-02-HU12-CA06 |
| P-WAL-01 | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» | campo | HE-02-HU03-CA05 |
| P-WAL-01 | «La imagen supera el tamaño máximo de 20 MB.» | campo | HE-02-HU03-CA06 |
| P-WAL-01 | «No hay cambios para guardar.» | opción deshabilitada | HE-02-HU11-CA03 |
| P-WAL-01 | «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» | aviso | HE-02-HU03-CA07 |
| P-WAL-01 | «No se guardaron cambios.» | resultado | HE-02-HU13-CA01 |
| P-WAL-01 | «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.» | resultado | HE-15-HU04-CA08 |
| P-WAL-01 | «Tema “<nombre del tema>” aplicado.» | resultado | HE-02-HU12-CA01 |
| P-WAL-01 | «Tema “<nombre del tema>” guardado y aplicado.» | resultado | HE-02-HU12-CA03 |
| P-WAL-01 | «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?» | aviso | HE-02-HU10-CA03 |
| P-WAL-01 | «Tienes cambios sin guardar en el tema “<nombre del tema>”. ¿Qué deseas hacer?» | confirmación | HE-02-HU12-CA02 |
| P-WAL-01 | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» | confirmación | HE-02-HU13-CA02, RT-01-CA08 |
| P-TEM-01 | «Este tema ya está aplicado.» | opción deshabilitada | HE-03-HU03-CA03 |
| P-TEM-01 | «Guarda otra personalización con “Guardar como tema” para tener más temas.» | campo | HE-03-HU01-CA02 |
| P-TEM-01 | «No puedes eliminar el tema aplicado. Aplica otro tema primero.» | opción deshabilitada | HE-03-HU05-CA02 |
| P-TEM-01 | «Se reemplazará la personalización actual por la del tema “<nombre del tema>”. ¿Deseas aplicarlo?» | resultado | HE-03-HU03-CA06 |
| P-TEM-01 | «Tema eliminado.» | resultado | HE-03-HU05-CA01 |
| P-TEM-01 | «Tema “<nombre del tema>” aplicado.» | resultado | HE-03-HU03-CA01, HE-03-HU03-CA04 |
| P-TEM-01 | «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Qué deseas hacer?» | aviso | HE-03-HU03-CA05 |
| P-TEM-01 | «¿Deseas eliminar el tema “<nombre del tema>”? Esta acción no se puede deshacer.» | confirmación | RT-04-CA08 |
| P-TEM-02 | «El nombre no puede superar los 40 caracteres.» | campo | HE-03-HU02-CA03 |
| P-TEM-02 | «Tema “<nombre del tema>” guardado.» | resultado | HE-03-HU02-CA01 |
| P-TEM-02 | «Ya existe un tema con ese nombre. Elige otro.» | resultado | HE-03-HU02-CA04 |
| P-TEM-03 | «El nombre no puede superar los 40 caracteres.» | campo | HE-03-HU04-CA03 |
| P-TEM-03 | «Tema renombrado.» | resultado | HE-03-HU04-CA01, HE-03-HU04-CA06 |
| P-TEM-03 | «Ya existe un tema con ese nombre. Elige otro.» | resultado | HE-03-HU04-CA04 |
| P-WID-01 | «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» | opción deshabilitada | HE-04-HU13-CA02 |
| P-WID-01 | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | campo | HE-04-HU12-CA04 |
| P-WID-01 | «Widget eliminado.» | resultado | HE-04-HU13-CA01, HE-04-HU13-CA04, HE-04-HU13-CA05 |
| P-WID-01 | «Ya tienes un widget Clima para esa ciudad.» | campo | HE-04-HU12-CA05 |
| P-WID-01 | «¿Deseas eliminar el widget “<nombre del widget>”? Se quitará de todos tus temas.» | confirmación | HE-04-HU13-CA06 |
| P-WID-02 | «Ya agregaste este widget.» | opción deshabilitada | HE-04-HU04-CA02, RT-04-CA05 |
| P-WID-03 | «Este campo es obligatorio.» | campo | RT-04-CA12 |
| P-WID-03 | «La ciudad no puede superar los 100 caracteres.» | campo | HE-04-HU05-CA09 |
| P-WID-03 | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | campo | HE-04-HU05-CA04 |
| P-WID-03 | «No pudimos cargar el clima. Intenta de nuevo más tarde.» | aviso | HE-04-HU05-CA07 |
| P-WID-03 | «Sin conexión. El widget se actualizará al reconectarte.» | estado vacío | HE-04-HU05-CA08 |
| P-WID-03 | «Ya tienes un widget Clima para esa ciudad.» | campo | HE-04-HU05-CA05 |
| P-WID-04 | «No pudimos cargar las noticias. Intenta de nuevo más tarde.» | aviso | HE-04-HU06-CA03 |
| P-WID-04 | «Sin conexión. El widget se actualizará al reconectarte.» | estado vacío | HE-04-HU06-CA04 |
| P-WID-05 | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» | campo | HE-04-HU07-CA03 |
| P-WID-05 | «La imagen supera el tamaño máximo de 20 MB.» | campo | HE-04-HU07-CA04 |
| P-WID-06 | «El intervalo debe estar entre 3 y 60 segundos.» | campo | HE-04-HU08-CA07 |
| P-WID-06 | «Este campo es obligatorio.» | campo | HE-04-HU08-CA08 |
| P-WID-06 | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» | campo | HE-04-HU08-CA05 |
| P-WID-06 | «La imagen supera el tamaño máximo de 20 MB.» | campo | HE-04-HU08-CA06 |
| P-WID-06 | «Puedes agregar máximo 10 imágenes al carrusel.» | opción deshabilitada | HE-04-HU08-CA04 |
| P-WID-06 | «Selecciona al menos 2 imágenes para el carrusel.» | opción deshabilitada | HE-04-HU08-CA03 |
| P-WID-07 | «En pausa por alto consumo de recursos.» | resultado | HE-04-HU09-CA04 |
| P-WID-08 | «El texto no puede superar los 200 caracteres.» | campo | HE-04-HU10-CA03 |
| P-WID-09 | «No hay música en reproducción.» | opción deshabilitada | HE-04-HU11-CA03 |
| P-WID-10 | «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» | campo | HE-04-HU12-CA04 |
| P-WID-10 | «Ya tienes un widget Clima para esa ciudad.» | campo | HE-04-HU12-CA05 |
| P-DIS-01 | «Cambios guardados.» | resultado | HE-05-HU04-CA01, HE-05-HU04-CA02, HE-05-HU04-CA04 |
| P-DIS-01 | «No se guardaron cambios.» | resultado | HE-05-HU05-CA03 |
| P-DIS-01 | «Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.» | resultado | HE-15-HU04-CA08 |
| P-DIS-01 | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» | confirmación | HE-05-HU05-CA01, HE-05-HU05-CA02 |
| P-WAL-02 | «No pudimos cargar las noticias. Intenta de nuevo más tarde.» | aviso | RT-04-CA06 |
| P-WAL-02 | «No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.» | aviso | HE-02-HU01-CA04 |
| P-WAL-02 | «No tienes tarjetas para hoy.» | estado vacío | HE-06-HU02-CA05 |
| P-WAL-02 | «Sin conexión. El widget se actualizará al reconectarte.» | estado vacío | HE-15-HU02-CA06 |
| P-WAL-02 | «Tu tablero no tiene tarjetas.» | estado vacío | HE-06-HU05-CA04 |
| P-TAR-01 | «Tarjeta eliminada.» | resultado | HE-07-HU05-CA02 |
| P-TAR-01 | «¿Deseas eliminar la tarjeta “<título de la tarjeta>”? Esta acción no se puede deshacer.» | confirmación | HE-07-HU05-CA01 |
| P-TAR-02 | «Aún no tienes etiquetas.» | estado vacío | HE-07-HU02-CA03 |
| P-TAR-02 | «Diligencia una fecha válida.» | campo | HE-07-HU01-CA08, RT-04-CA03 |
| P-TAR-02 | «El título no puede superar los 100 caracteres.» | campo | HE-07-HU01-CA06, HE-07-HU04-CA05 |
| P-TAR-02 | «Esta tarjeta ya no existe.» | resultado | HE-07-HU04-CA11 |
| P-TAR-02 | «Este campo es obligatorio.» | campo | HE-07-HU01-CA04, HE-07-HU01-CA05, HE-07-HU01-CA07 (+4) |
| P-TAR-02 | «La descripción no puede superar los 1000 caracteres.» | campo | HE-07-HU01-CA10, HE-07-HU04-CA08 |
| P-TAR-02 | «La fecha límite no puede ser anterior a hoy.» | campo | HE-07-HU01-CA09, HE-07-HU04-CA07 |
| P-TAR-02 | «Puedes asignar máximo 5 etiquetas por tarjeta.» | opción deshabilitada | HE-07-HU02-CA02 |
| P-TAR-02 | «Tarjeta actualizada.» | resultado | HE-07-HU04-CA01, HE-07-HU04-CA03 |
| P-TAR-02 | «Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.» | resultado | HE-07-HU04-CA10 |
| P-TAR-02 | «Tarjeta creada.» | resultado | HE-07-HU01-CA01, HE-07-HU01-CA02, HE-07-HU01-CA12 (+2) |
| P-ETQ-01 | «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.» | opción deshabilitada | HE-08-HU02-CA06 |
| P-ETQ-01 | «Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.» | estado vacío | HE-08-HU01-CA02, RT-04-CA10 |
| P-ETQ-01 | «Etiqueta eliminada.» | resultado | HE-08-HU04-CA02, HE-08-HU04-CA05 |
| P-ETQ-01 | «La etiqueta “<nombre de la etiqueta>” está asignada a 1 tarjeta. Se quitará de ella, pero la tarjeta no se eliminará. ¿Deseas continuar?» | resultado | HE-08-HU04-CA04 |
| P-ETQ-01 | «La etiqueta “<nombre de la etiqueta>” está asignada a <cantidad> tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?» | resultado | HE-08-HU04-CA03 |
| P-ETQ-01 | «¿Deseas eliminar la etiqueta “<nombre de la etiqueta>”? Esta acción no se puede deshacer.» | confirmación | HE-08-HU04-CA01 |
| P-ETQ-02 | «El nombre de la etiqueta no puede superar los 30 caracteres.» | campo | HE-08-HU02-CA03, HE-08-HU03-CA03 |
| P-ETQ-02 | «Este campo es obligatorio.» | campo | HE-08-HU02-CA02, HE-08-HU02-CA05, HE-08-HU03-CA02 (+1) |
| P-ETQ-02 | «Etiqueta actualizada.» | resultado | HE-08-HU03-CA01 |
| P-ETQ-02 | «Etiqueta creada.» | campo | HE-08-HU02-CA01, HE-08-HU02-CA08 |
| P-ETQ-02 | «Ya existe una etiqueta con ese nombre.» | resultado | HE-08-HU02-CA04, HE-08-HU03-CA04 |
| P-KAN-01 | «Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.» | opción deshabilitada | HE-09-HU03-CA06 |
| P-KAN-01 | «Columna eliminada.» | resultado | HE-09-HU06-CA02, HE-09-HU06-CA04 |
| P-KAN-01 | «La columna “Revisión” tiene 3 tarjetas. Se moverán a “Por hacer”. ¿Deseas continuar?» | resultado | HE-09-HU06-CA03 |
| P-KAN-01 | «Las columnas por defecto no se pueden eliminar.» | opción deshabilitada | HE-09-HU06-CA05 |
| P-KAN-01 | «No hay tarjetas en esta columna.» | estado vacío | HE-09-HU01-CA01, HE-09-HU01-CA03 |
| P-KAN-01 | «¿Deseas eliminar la columna “Revisión”? Esta acción no se puede deshacer.» | confirmación | HE-09-HU06-CA01 |
| P-KAN-02 | «Columna actualizada.» | resultado | HE-09-HU04-CA01, HE-09-HU04-CA02 |
| P-KAN-02 | «Columna creada.» | resultado | HE-09-HU03-CA01, HE-09-HU03-CA02 |
| P-KAN-02 | «El nombre de la columna no puede superar los 30 caracteres.» | campo | HE-09-HU03-CA04, HE-09-HU04-CA05 |
| P-KAN-02 | «Este campo es obligatorio.» | campo | HE-09-HU03-CA03, HE-09-HU04-CA04 |
| P-KAN-02 | «Ya existe una columna con ese nombre.» | resultado | HE-09-HU03-CA05, HE-09-HU04-CA06 |
| P-CAL-01 | «No tienes tarjetas para este día.» | estado vacío | HE-10-HU03-CA03 |
| P-CAL-02 | «No puedes crear tarjetas en días pasados.» | opción deshabilitada | HE-10-HU04-CA04 |
| P-AGE-01 | «No puedes asignar tarjetas a un bloque horario que ya pasó.» | resultado | HE-11-HU02-CA04 |
| P-AGE-01 | «No puedes programar la tarjeta después de su fecha límite.» | resultado | HE-11-HU02-CA05 |
| P-AGE-01 | «No tienes tarjetas pendientes por programar.» | estado vacío | HE-11-HU01-CA04 |
| P-AGE-01 | «Tarjeta asignada al bloque 10:00 – 11:00.» | resultado | HE-11-HU02-CA01 |
| P-AGE-01 | «Tarjeta asignada al bloque 12:00 – 13:00.» | resultado | HE-11-HU02-CA03 |
| P-AGE-01 | «Tarjeta quitada del horario.» | resultado | HE-11-HU03-CA01, RT-04-CA09 |
| P-PLA-01 | «No tienes tarjetas para hoy.» | estado vacío | HE-12-HU01-CA03, HE-12-HU03-CA05 |
| P-PLA-01 | «¡Bien hecho! Tarjeta completada.» | resultado | HE-12-HU02-CA01 |
| P-PLA-01 | «¡Completaste todas tus tarjetas de hoy!» | resultado | HE-12-HU03-CA04 |
| P-REP-01 | «Aún no tienes etiquetas.» | opción deshabilitada | HE-13-HU05-CA05 |
| P-REP-01 | «Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.» | estado vacío | HE-13-HU02-CA05 |
| P-REP-01 | «Diligencia una fecha válida.» | campo | HE-13-HU01-CA07, HE-13-HU01-CA08 |
| P-REP-01 | «El rango máximo es de un año.» | resultado | HE-13-HU01-CA06 |
| P-REP-01 | «Este campo es obligatorio.» | campo | HE-13-HU01-CA04, HE-13-HU01-CA05 |
| P-REP-01 | «La fecha de inicio no puede ser posterior a la fecha de fin.» | campo | HE-13-HU01-CA03 |
| P-REP-01 | «Mostrando datos desde el 10/10/2026, cuando creaste tu primera tarjeta.» | campo | HE-13-HU02-CA06 |
| P-REP-01 | «No hay datos para este rango de fechas y estos filtros.» | estado vacío | HE-13-HU02-CA07, HE-13-HU03-CA05, HE-13-HU04-CA04 (+1) |
| P-IA-01 | «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» | opción deshabilitada | HE-14-HU01-CA07 |
| P-IA-01 | «Esta acción no se puede deshacer.» | resultado | HE-14-HU07-CA01, HE-14-HU07-CA02, HE-14-HU07-CA06 |
| P-IA-01 | «Esta tarjeta está completada. Editarla no cambia su columna.» | resultado | HE-14-HU05-CA06 |
| P-IA-01 | «Esta tarjeta está completada. Si la eliminas, dejará de contar en tus reportes.» | resultado | HE-14-HU07-CA06 |
| P-IA-01 | «Esta tarjeta está completada. Si la mueves, dejará de estar completada y se borrará su fecha de completado.» | resultado | HE-14-HU06-CA06 |
| P-IA-01 | «No pude responder en este momento. Intenta de nuevo.» | aviso | HE-14-HU01-CA08 |
| P-IA-01 | «Se perdió la conexión. No se hizo ningún cambio.» | resultado | HE-14-HU03-CA02, HE-14-HU04-CA07 |
| P-IA-01 | «Tu mensaje no puede superar los 2000 caracteres.» | opción deshabilitada | HE-14-HU01-CA05 |
| P-CFG-01 | «Error de sincronización. Reintentaremos automáticamente.» | aviso | HE-16-HU01-CA05 |
| P-CFG-01 | «Inicio automático activado.» | resultado | HE-16-HU02-CA02 |
| P-CFG-01 | «Inicio automático desactivado.» | resultado | HE-16-HU02-CA01 |
| P-CFG-01 | «No pudimos cambiar el inicio automático. Intenta de nuevo.» | aviso | HE-16-HU02-CA05 |
| P-CFG-01 | «Sesión cerrada.» | resultado | HE-16-HU03-CA01, HE-16-HU03-CA04 |
| P-CFG-01 | «Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?» | aviso | HE-16-HU03-CA03 |
| P-CFG-01 | «¿Deseas cerrar sesión?» | confirmación | HE-16-HU03-CA05 |
| P-SIN-01 | «Algunas tarjetas se actualizaron con cambios más recientes de otro computador.» | resultado | HE-15-HU03-CA02, HE-15-HU03-CA05, HE-15-HU03-CA06 |
| P-SIN-01 | «Error de sincronización. Reintentaremos automáticamente.» | aviso | HE-15-HU01-CA03, HE-16-HU01-CA05 |
| P-SIN-01 | «Estás sin conexión. Tus cambios se guardarán y se sincronizarán al reconectarte.» | resultado | HE-15-HU02-CA01 |
| P-SIN-01 | «Tus cambios se sincronizaron.» | resultado | HE-15-HU03-CA01 |
| P-CFG-02 | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» | confirmación | HE-17-HU03-CA02 |
| P-LAN-01 | «Es posible que tu equipo no cumpla los requisitos. El instalador lo comprobará antes de instalar.» | resultado | CD-01-HU01-CA03 |
| P-LAN-01 | «No pudimos iniciar la descarga. Intenta de nuevo.» | aviso | CD-01-HU02-CA02 |
| P-INS-01 | «El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page.» | resultado | CD-02-HU01-CA12 |
| P-INS-01 | «Encontramos una instalación incompleta. Vamos a repararla.» | aviso | CD-02-HU01-CA09 |
| P-INS-01 | «Este computador no es compatible. Necesitas Windows 10 versión 22H2 o Windows 11, de 64 bits (x64).» | resultado | CD-02-HU01-CA03 |
| P-INS-01 | «Instalación completada.» | resultado | CD-02-HU01-CA01, CD-02-HU01-CA06, CD-02-HU01-CA10 |
| P-INS-01 | «No hay suficiente espacio en disco. Libera al menos 500 MB e intenta de nuevo.» | opción deshabilitada | CD-02-HU01-CA04 |
| P-INS-01 | «No pudimos completar la instalación. No se hicieron cambios en tu computador.» | aviso | CD-02-HU01-CA08 |
| P-INS-01 | «Windgets ya está instalada. ¿Deseas reinstalarla?» | confirmación | CD-02-HU01-CA05 |
| P-INS-01 | «Ya puedes eliminar el archivo del instalador que descargaste.» | resultado | CD-02-HU01-CA01 |
| P-INS-01 | «¿Deseas cancelar la instalación?» | confirmación | CD-02-HU03-CA04 |
| P-INS-02 | «La instalación se canceló.» | resultado | CD-02-HU03-CA02 |
| P-INS-02 | «¿Deseas cancelar la instalación?» | confirmación | CD-02-HU03-CA01 |

### Mensajes de confirmación que se abren como ventana emergente

| ID | Texto literal | Contenedor | CA que lo abren |
|---|---|---|---|
| M-01 | «¿Deseas cancelar la instalación?» con las opciones «Cancelar instalación» y «Seguir instalando» | C-05 | CD-02-HU03-CA01, CD-02-HU03-CA04 |
| M-02 | «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?» con las opciones «Salir sin guardar» y «Seguir editando» | C-01 | HE-02-HU13-CA02, HE-05-HU05-CA01, HE-05-HU05-CA02, HE-17-HU03-CA02, RT-01-CA08 |
| M-03 | «Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?» con las opciones «Guardar», «Salir sin guardar» y «Seguir editando» | C-01 | HE-02-HU13-CA05, RT-01-CA09 |
| M-04 | «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?» con las opciones «Cambiar sin guardar» y «Seguir editando» | C-01 | HE-02-HU10-CA03 |
| M-05 | «Se reemplazará la personalización actual por la del tema “<nombre del tema>”. ¿Deseas aplicarlo?» con las opciones «Aplicar» y «Cancelar» | C-01 | HE-03-HU03-CA06 |
| M-06 | «¿Deseas eliminar el tema “<nombre del tema>”? Esta acción no se puede deshacer.» | C-01 | RT-04-CA08 |
| M-07 | «¿Deseas eliminar el widget “<nombre del widget>”? Se quitará de todos tus temas.» | C-01 | HE-04-HU13-CA06 |
| M-08 | «¿Deseas eliminar la tarjeta “<título de la tarjeta>”? Esta acción no se puede deshacer.» | C-01 | HE-07-HU05-CA01 |
| M-09 | «¿Deseas eliminar la columna “<nombre de la columna>”? Esta acción no se puede deshacer.» | C-01 | HE-09-HU06-CA01 |
| M-10 | «¿Deseas eliminar la etiqueta “<nombre de la etiqueta>”? Esta acción no se puede deshacer.» | C-01 | HE-08-HU04-CA01 |
| M-11 | «¿Deseas cerrar sesión?» con las opciones «Cerrar sesión» y «Cancelar» | C-01 | HE-16-HU03-CA05 |
| M-12 | «Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?» | C-01 | HE-16-HU03-CA03 |
| M-13 | «La columna “<nombre de la columna>” tiene <cantidad> tarjetas. Se moverán a “Por hacer”. ¿Deseas continuar?» | C-01 | HE-09-HU06-CA03 |
| M-14 | «La etiqueta “<nombre de la etiqueta>” está asignada a <cantidad> tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?» | C-01 | HE-08-HU04-CA03, HE-08-HU04-CA04 |
| M-15 | «Tienes cambios sin guardar en el tema “<nombre del tema>”. ¿Qué deseas hacer?» con las opciones «Guardar y aplicar», «Aplicar sin guardar» y «Cancelar» | C-01 | HE-02-HU12-CA02, HE-03-HU03-CA05 |
| M-16 | «Windgets ya está instalada. ¿Deseas reinstalarla?» | C-05 | CD-02-HU01-CA05 |
| M-17 | «Encontramos una instalación incompleta. Vamos a repararla.» | C-05 | CD-02-HU01-CA09 |
