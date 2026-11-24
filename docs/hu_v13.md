# HU v13 · Funcionalidades nuevas del rediseño final

Borradores de las historias de usuario de las funcionalidades 🆕 que Paula aprobó el 24-nov-2026
(`docs/rediseno_final_backend.md` §0.1 y §5). Cada una se redacta aquí con sus CA y ET antes de construirla y se
copia a la hoja v13 y a su `HE-nn.md` en la edición final. **La aprobación de cada HU es la fusión del PR que la
agrega**: si Paula pide cambios, se cambian aquí y en el código antes de fusionar.

Formato: el de la v12 (Dado / Cuando / Entonces). Los textos entre «…» son literales; «⚠ texto a confirmar» marca
los que el documento del rediseño deja abiertos.

---

## HE-14-HU11 · Abrir el chat de Windi desde el botón flotante (D-07) · P40

**Como** persona que usa Windgets, **quiero** abrir el chat de Windi desde cualquier pantalla **para** pedirle
algo sin dejar lo que estoy haciendo.

| CA | Dado | Cuando | Entonces |
|---|---|---|---|
| CA01 | que tengo la sesión iniciada en cualquier pantalla de la ventana principal | selecciono el botón flotante con los ojos de Windi, abajo a la derecha | se abre el panel de Windi a la derecha, encima de la pantalla, sin cambiar la pantalla ni la miga de pan |
| CA02 | que tengo el panel de Windi abierto | selecciono «×» o presiono Esc | el panel se cierra y vuelve el botón flotante |
| CA03 | que conversé con Windi y tengo una propuesta sin responder | cierro el panel y lo vuelvo a abrir | veo la misma conversación y la propuesta sigue con «Confirmar» y «Rechazar» |
| CA04 | que Windi está respondiendo | miro el botón flotante o el encabezado del panel | los ojos parpadean mientras se ve «Escribiendo…» |
| CA05 | que el menú lateral está a la vista | lo reviso | no tiene la opción «Agente de IA» |

| ET | Especificación |
|---|---|
| ET01 | Botón flotante de 40 px, esquina inferior derecha (16 px de los bordes), en todas las pantallas con sesión. Dos óvalos (ojos) del color `accion` del tema sobre `superficie_alta`. Nombre accesible y tooltip «Windi». |
| ET02 | Panel lateral derecho de 360 px de ancho y todo el alto de la ventana, con encabezado (ojos de 28 px y «Windi» en 13 px) y «×» (tooltip «Cerrar»). Esc lo cierra salvo que haya una ventana emergente abierta. |
| ET03 | La conversación es la de HE-14-HU01 a HU10 (IPC-WIN-01 a 04), sin cambios de contrato. Mensajes de 14 px, sin la ilustración de Windi; propuesta compacta; campo de una línea que crece; contador «<n> / 2000» pequeño. |
| ET04 | Los mensajes emergentes (RD-63) quedan encima del panel. |
| ET05 | `app_open_screen { screen: 'windi' }` y la última pantalla guardada `'windi'` abren el panel sobre la pantalla actual. |
| ET06 | Con «reducir movimiento» de Windows los ojos no parpadean. |

Reemplaza en la edición final: P-IA-01 «Agente de IA» (`interfaz.md`), la opción del menú de RT-01 y la miga de
HE-14-HU01.

---

## HE-04-HU14 · Agregar el widget Windi al escritorio (D-07, A-07) · P40

**Como** persona que usa Windgets, **quiero** tener a Windi en el escritorio **para** abrir su chat sin buscar la
aplicación.

| CA | Dado | Cuando | Entonces |
|---|---|---|---|
| CA01 | que estoy en Agregar widget | reviso los widgets locales | veo «Windi» con la descripción «Abrir el chat con Windi desde el escritorio.» (⚠ texto a confirmar) |
| CA02 | que no tengo el widget Windi | lo agrego | aparece activo en el escritorio, en la primera posición libre, con los dos ojos del color de acción del tema |
| CA03 | que ya tengo el widget Windi | intento agregarlo otra vez | no se agrega otro y se muestra el mensaje de widget ya agregado (como Noticias, HE-04-HU04-ET04) |
| CA04 | que tengo el widget Windi en el escritorio | lo selecciono | se abre la ventana principal al frente con el panel de Windi abierto (HE-06-HU08) |
| CA05 | que tengo el widget Windi | lo elimino desde la lista de widgets | se quita del escritorio (no es un widget por defecto) |

| ET | Especificación |
|---|---|
| ET01 | Tipo `windi` en `widget.type` (migración `0009_widget_windi.sql` y esquema local versión 9). Uno solo por cuenta: entra en `uq_widget_singleton`. |
| ET02 | Tamaño inicial 120 × 120; mínimo 80 × 80 (HE-05-HU03-ET02). |
| ET03 | Es interactivo (HE-06-HU01-ET01): al soltar el botón sin arrastrar pide `app_open_screen { screen: 'windi' }`. |
| ET04 | Sin configuración (como Noticias). La apariencia propia llega con la HU v13 de «Apariencia del widget» (D-18). |
