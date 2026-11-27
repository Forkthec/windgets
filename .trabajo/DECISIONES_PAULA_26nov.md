# Decisiones de Paula, 26-nov-2026 ~09:00 (UTC-5), sobre CONSISTENCIA.md y el inventario

Literales de Paula entre «…» cuando no eligió una opción cerrada.

## Punto 5 del pedido
- **M-11 y M-12 (Cerrar sesión):** Destructivo en todo: ambos nodos (79:6 y 83:4) y los 4 temas.
- **RD-106 en Clima:** pide «Salir sin guardar» **solo si la ciudad elegida es distinta de la inicial** (corregir en una pieza S; anotar en DUDAS.md).
- **Hallazgos del inventario:** unificar al valor de la variable o del componente de F0 y anotarlo en DECISIONES.md con «Paula cambia a:». 204:1005 es el único reporte; navegación por la HU, no por las URL a «Windgets--Copy-»; botones sin destino se implementan con la acción de la HU. Paula: «ten en cuenta que se quiere el menos scroll posible» (la Vencida 217:11114 y todo lo que desborde se resuelve primero ajustando el contenido para que quepa; desplazamiento solo como último recurso).
- **Todas las funcionalidades nuevas de los prototipos se implementan.**
- **Tipografía:** fuente por tema (claro y oscuro Nunito, Rosa Quicksand, Enfoque Space Grotesk); Rubik pasa a la fuente del tema. Paula: «nunito es la fuente por defecto de windgets, si se cambia de tipografía se cambia en la aplicación» → la tipografía que elige la persona en Personalización manda sobre la del tema en toda la app.

## Decisiones D
- **D1 avisos:** variables de estado. Advertencia `estado_pendiente`, Éxito `estado_completada`, Error `error`, Información borde e ícono `informacion`; el texto va en `texto` (P2, 26-nov; antes `principal_legible`).
- **D2:** Windi con colores fijos.
- **D3:** catálogo de los 9 colores del Figma; ejemplos y puntos del Kanban pasan al color del catálogo más cercano; Windi nombra colores del catálogo.
- **D4:** aviso (sin bloquear) si el color elegido baja de 3:1.
- **D5:** radios medidos: panel lateral 12, papel de diálogos 10 con pliegue 22.
- **D6:** anillo de foco 2 px `tinta` en todo, radio del control + 3 (también campos).
- **D7 ancho de avisos:** Paula: «los avisos no deben tapar la información, analiza la mejor opción» → el documento analiza y propone dónde van y su ancho (sin tapar contenido), marcado como propuesta para la fase 5.
- **D8:** quitar los estilos de texto 42/26/17.
- **D9:** textos de vacío y cargando que el Figma no dibuja (Calendario, widgets, instalador) se redactan ahora en las specs con el patrón del Figma (5 barras `linea` r6); los que sí trae F2b se copian.
- **D10:** errores genéricos se redactan ahora en las specs: un mensaje por causa con código estable, «Reintentar» solo donde reintentar sirve.
- **D11:** saludo sin emoji, con el alias.
- **D12:** botón «Entendido» en M-18, M-19 y M-21.
- **D13:** «Salir sin guardar» (M-02), «Cambiar sin guardar» (M-04) y «Cancelar instalación» (M-01) en Destructivo.
- **D14:** botón «Cambiar» carpeta del instalador **oculto** (como el Figma).
- **D15 ventana:** Paula: «quiero que ocupe el máximo de la pantalla actual dependiendo del dispositivo, o dejar un tamaño fijo y solo bajar a la barra de tareas» → propuesta: abre maximizada al área de trabajo de la pantalla y se puede minimizar; el diseño 1280×790 se adapta. Confirmar en fase 5.
- **D16:** Evento = 2 en Reportes (204:1581).
- **D17 placeholders:** Paula: «quiero que la aplicación sea usable» → propuesta: ejemplo de formato donde el formato importa (correo «nombre@ejemplo.com», código de verificación), nunca en lugar de la etiqueta. Confirmar en fase 5.
- **G5 tiempos de aviso:** RD-104: Éxito e Información 4 s, Advertencia 6 s, Error hasta cerrarlo.
- **R11:** formas de widget Rectas 0, Base = variable 9, Redondas 22.
- **Error de campo:** trazo `error` 2 px, radio 9 (es lo que trae F0; se aplica por la regla de unificar).

## Sobre TEMAS_Y_TOKENS (26-nov)
Decisiones:
- **P1:** en oscuro, donde se juntan morado y cian (trazo de la fila seleccionada, casilla marcada de Tareas, trazo de la columna Kanban) se usa `tinta` #f8f5ff. Excepción a la regla 7 solo en oscuro; en claro, Rosa y Enfoque sigue #0F2A33.
- **P2:** el aviso de Información lleva el texto en `texto`; `informacion` va solo en borde e ícono.
- **P3:** el texto sobre relleno cian es #0B2A2E.
- **P4:** Mediano = 14; Pequeño = 12 (12,25); Grande = 18 (17,5, empate redondeado hacia arriba). El código usa hoy 14, 16 y 20.

Propuestas pendientes (confirma Paula en fase 5):
- **Q1:** `relleno_*` como tabla fija con los hex del Figma; la fórmula `mezclar(superficie, estado, 0,3)` solo explica (reproduce 10 de 12). `derivar.ts:95-97` está invertido (70 % estado).
- **Q2:** etiquetas #2b7a8c y #2a6f8f a Cian; #b04f7d a Rosa.
- **Q3:** empaquetar Nunito 600.

## Pendientes de las SPEC de área (Paula, 26/27-nov, con opciones)
Escritorio y capa:
- **S1 menú del área (EC-16):** nativo de Windows; la diferencia visual con el Figma queda aceptada.
- **S2 ciudad del Reloj (EC-03):** zona horaria del sistema.
- **S3 puntero encima de Calendario y Noticias (C-2):** se construye con un EV nuevo de movimiento en el Núcleo (PROPUESTA de contrato).
- **S4 casilla de Tareas (EC-05):** la del Figma (13,5) con zona táctil de 44.
Planificador:
- **S5 «Usada en 1 tarjeta»:** el texto de PL-14 en singular.
- **S6 arrastrar filas en el diario:** cambia la hora de la tarjeta.
- **S7 teclado:** se construye todo (Calendario, Agenda y Kanban) con la propuesta de cada parte (RNF-30).
- **S8 títulos de Más reportes:** se leen del Figma (nodo 204:1581, solo lectura).
- **S9 códigos:** cada código con la convención de su fuente; los nuevos van en MAYÚSCULAS.
- **S10 recordatorio (PL-01):** notificación de Windows a la hora de la tarjeta.
- **S11 mini calendario:** el clic en un día cambia el día del Planificador.
- **S12 Próximas a vencer:** texto vacío propuesto y el clic abre el Detalle.
Personalización:
- **S13 persistencia de lo nuevo:** se amplía `theme_draft_update` (un solo guardado por tema).
- **S14 «Listo» en Organizar:** guarda el orden y sale; con cambios, «Cancelar» abre M-02.
Windi:
- **S15 propuesta confirmada o rechazada:** sin estado visible y con las opciones deshabilitadas.
- **S16 marca:** «Descartada».
Instalador y web:
- **S17 instalador:** se aproxima con nsDialogs (colores, fuentes, interruptor y barra dibujados, orden del Figma), sin radios ni sombras (D-194).
- **S18 landing:** se mantiene la actual y se toma de 84:1050 lo medible.
- **S19 nombres de códigos (27-nov):** si un código de CONSISTENCIA ya existe en el código con otro nombre, gana el del código y el de CONSISTENCIA queda como alias. Resuelve C-1, C-3, C-4, C-8, C-10 y C-11 de ERRORES_Y_PRUEBAS; SPEC_Windi.md:124 se ajusta al nombre del código.
