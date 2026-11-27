# Rediseño · consideraciones que solo se resuelven en la implementación (ronda del 24-nov-2026)

Documento autosuficiente para el equipo que implementa en `apps/desktop`. Trae lo que el Figma no puede expresar:
comportamiento, datos, accesibilidad, migraciones, pruebas y reglas de código, y repite aquí los valores que hacen
falta (colores, jerarquía de botones, inventario de botones) para no depender de ningún otro documento de esta ronda.
Lo visual (posiciones, tamaños, composición) se toma de los marcos del Figma `GdUKUwVHz3Wm0Dqw16UX8k`, cuando Paula
los haya aprobado.

## Reglas para quien implemente

1. Se implementa **solo** lo que dice este documento y lo que muestran los marcos aprobados del Figma
   `GdUKUwVHz3Wm0Dqw16UX8k`. Si el Figma y este documento chocan, se pregunta a Paula.
2. Siguen vigentes `docs/AGENTS.md`, `CLAUDE.md` y las 12 «Reglas de implementación del rediseño» de
   `docs/rediseno.md` (tokens, Rubik, 1200 × 800 y 960 × 600, modos, componentes, accesibilidad, pruebas de geometría).
3. Cada cambio entra como un **RD nuevo** en `docs/rediseno.md` (con «Contradice» y «Pendiente para la edición
   final»), commits `rediseno: <verbo y objeto>`, rama `paso-NN-<tema>`, una prueba por RD.
4. Nada de lo nuevo puede terminar en el error genérico si es previsible (regla de errores visibles de Paula).
5. Las tareas de ejemplo que aparecen en los prototipos son **solo para mostrar el diseño**. No se siembran en la app
   ni en `seed.sql`.
6. Los textos nuevos que no estén literales aquí ni en el Figma los elige quien implemente con estas reglas: español
   neutro, frase corta, acción en infinitivo o sustantivo, sin repetir lo que dice el ícono, punto final solo si es
   oración. Quedan literales en su RD y centralizados por área.

## Decisiones de Paula (24-nov-2026)

| # | Tema | Decisión |
|---|---|---|
| DI-01 | Figma fuente de verdad | `GdUKUwVHz3Wm0Dqw16UX8k` |
| DI-02 | Temas | Cuatro: «Windgets claro», «Windgets oscuro», «Rosa pastel», «Enfoque rojo y negro». Claro y Oscuro de las pantallas de cuenta **son** Windgets claro y Windgets oscuro |
| DI-03 | Catálogo | La plantilla `claro` pasa a «Windgets claro» y `oscuro` a «Windgets oscuro»; `is_default` pasa a `claro`; la vieja «Windgets» (`default`) queda en el catálogo como una más. Los temas guardados no cambian |
| DI-04 | Paleta | La de las pantallas de cuenta (RD-04), tabla de IM-01 |
| DI-05 | Botones de solo ícono | Todos los del inventario de IM-03 (no solo «+ Nueva tarjeta»), con nombre emergente = la acción sin el «+» («Nueva tarjeta») |
| DI-06 | Windi | Ojos idénticos a los de las pantallas de cuenta; Windi entero en el panel vacío; ojos según el estado; sin avatar en la cabecera ni cara junto a los mensajes |
| DI-07 | Botón flotante de Windi | Cabeza amarilla asomando, sin fondo; movimiento solo al pasar el puntero |
| DI-08 | Estilo de chat de la landing | En el widget Windi del escritorio y en el panel de Windi de la app |
| DI-09 | Detalle, nueva y editar tarjeta; nueva y editar etiqueta; nueva y editar columna; Mover a | Ventanas emergentes |
| DI-10 | Mensajes emergentes | Arriba a la derecha |
| DI-11 | Cumplimiento por estado | Anillo con leyenda |
| DI-12 | Pasos de Personalización | Indicador de pasos como el del Registro |
| DI-13 | Eliminar en el Detalle de tarjeta | Ícono de papelera |
| DI-14 | Ícono del clima | Cambia de día y de noche |
| DI-15 | Preferencia compacta / expandida del Kanban | No se guarda; solo mientras se está en la pantalla |
| DI-16 | «Regresar» en las notas centradas de cuenta | Solo la flecha junto a la miga de pan; reemplaza RD-17 |

---

## IM-00 · Fuente de verdad del Figma (DI-01)

- RD nuevo: «Desde el 24-nov-2026 la fuente de verdad es `GdUKUwVHz3Wm0Dqw16UX8k`; reemplaza la referencia a
  `h5LPoqlRnG5OTP6zru0pjS` de la introducción y de la regla 1». Los ids de nodo citados en comentarios
  (`// Figma 84:22 …`) se actualizan solo cuando se toque ese componente.
- Prueba: ninguna (documental).

## IM-01 · Windgets claro y Windgets oscuro (DI-02 a DI-04)

**Datos.**
- Migración nueva `supabase/migrations/0009_temas_windgets.sql` (nunca editar 0007 ni 0008). Solo cambia datos, así
  que lleva la nota «sin equivalente en `docs/local/`», como 0008:
  - `catalog_template` `claro` → `name = 'Windgets claro'`, `is_default = true`; `oscuro` → `name = 'Windgets
    oscuro'`; `default` → `is_default = false`, sin cambiar nombre ni colores.
  - `catalog_palette` `claro` / `oscuro` → mismos nombres nuevos.
  - Ninguna fila de `theme` cambia.
- `seed.sql` con los mismos valores.
- Buscar en el mismo commit todo código que pida la plantilla por `id = 'default'` en vez de por `is_default`, y
  corregirlo.
- El disparador `trg_bump_catalog_version` sube la versión; comprobar que los clientes descargan el cambio.

**Colores.** Tokens fijos de las dos plantillas:

| Token | Windgets claro | Windgets oscuro | Uso |
|---|---|---|---|
| principal | `#00D9E2` | `#00D9E2` | marca |
| secundario | `#6604E6` | `#D3B2FF` | enlace, opción elegida, paso actual |
| marco | `#F5F0FF` | `#201B2B` | fondo de la ventana |
| sobre_marco | `#17131D` | `#F8F5FF` | texto sobre el fondo |
| superficie | `#FFFFFF` | `#2B2534` | paneles, columnas, tarjetas |
| superficie_alta (nota) | `#FFFBEA` | `#302D38` | ventanas emergentes, panel de Windi, «Próximas a vencer», tarjetas del Kanban en claro |
| superficie_baja | `#EDE3FF` | `#433258` | hover, selección suave |
| linea | `#D9D0E6` | `#5D566B` | separadores y bordes de contenedor |
| tinta | `#17131D` | `#F8F5FF` | títulos |
| texto | `#554F5E` | `#CEC7D6` | texto secundario |
| accion | `#00D9E2` | `#00D9E2` | botón principal |
| sobre_accion | `#17131D` | `#17131D` | texto del botón principal |
| borde | `#241C30` | `#AFA1C0` | borde de botones y campos |
| sombra | `#241C30` | `#100D15` | sombra sólida desplazada 3 px → y 5 px ↓ |
| error | `#B3261E` | `#FF8A80` | error |

Los tokens salen hoy de tres colores (`principal`, `secundario`, `texto`) por
`apps/desktop/src/ui/tema/derivar.ts`, que no produce estos valores fijos. Implementación preferida: ajustes por
plantilla en `tokens_por_defecto.ts` (o una hoja `[data-plantilla='claro']`) que fijan esta tabla para `claro` y
`oscuro`; el resto de temas sigue derivando. Sin columnas nuevas. Si la persona cambia un color de un tema que partió
de Windgets claro u oscuro, se vuelve a derivar todo (documentarlo en el RD).

**Coherencia con las pantallas de cuenta.** RD-15 ya aplica a la cuenta nueva la paleta del modo elegido: queda igual
con los nombres nuevos. Su mensaje pasa a «No pudimos aplicar el tema <Windgets claro o Windgets oscuro>. Puedes
elegirlo en Personalización.» (RD que reemplaza el texto de RD-15).

**Errores.** Si el catálogo no carga, «Mis temas» muestra los temas guardados y el aviso existente de catálogo; nunca
el genérico.

**Pruebas.** Rust: nombres e `is_default` de 0009 y que ningún `theme` cambie. Vitest: los tokens fijos coinciden con
la tabla. Contraste: tinta y texto ≥ 4,5:1 sobre marco, superficie y superficie_alta, y borde ≥ 3:1, en los cuatro
temas.

**Contradice:** HE-02-HU07 (catálogo), `interfaz.md` «Tema a tokens», RD-14 (nombres).

## IM-02 · Jerarquía de botones, centrado y tamaños

Jerarquía (igual en los cuatro temas):

| Nivel | Aspecto | Cuándo |
|---|---|---|
| Principal | relleno `accion`, texto `sobre_accion` 500, borde 1,5 px `borde`, radio 9, sombra sólida `sombra` | una por pantalla o ventana |
| Secundario | relleno `superficie`, texto `tinta` 500, borde 1,5 px `borde`, radio 9 | Cancelar cambios, Guardar como tema… |
| Ícono | sin relleno ni borde, ícono 20 px; hover relleno `superficie_baja` | acciones por elemento y de crear (IM-03) |
| Destructivo | como Secundario con texto y borde `error` | confirmaciones de borrado |
| Selector segmentado | contenedor con borde, opción elegida en `secundario` | Mes / Semana, Compacta / Cómoda |
| Dato | solo texto, sin borde, sin hover, sin `cursor: pointer` | valores, «Sincronizado», contadores |
| Fila de lista | contenedor `superficie` con borde 1 px `linea`; acciones como botones Ícono | Mis temas, Widgets del tema, Etiquetas |

- Extender `Boton` (regla 6, no crear otro): `variante = 'principal' | 'secundario' | 'icono' | 'destructivo'` y
  `tam = 'normal' | 'fila'` (36 / 32 px). Selector segmentado: extender `Selector`. Un dato nunca es `Boton`.
- Centrado real: `display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 16px;`
  sin `width` fijo. Botón ícono: cuadrado (`inline-size` = `block-size`). Excepción: botones a lo ancho de las
  pantallas de cuenta.
- Prueba de geometría (Playwright) en cada pantalla tocada: en cada `button`, `|izquierda − derecha| ≤ 1` y
  `|arriba − abajo| ≤ 1` entre borde y contenido; máximo un botón `principal` visible por pantalla o ventana.
- «Oscurecer» y «Desenfocar» de Personalización pasan a deslizadores reales (`input type="range"` con su valor).

## IM-03 · Botones de solo ícono con nombre emergente (DI-05, DI-13, DI-16)

**Alcance: todos los botones de la tabla, no solo «+ Nueva tarjeta».** Además, todo botón sin texto visible que
aparezca al implementar sigue la misma regla.

| Pantalla | Botón hoy | Queda | Nombre emergente y `aria-label` |
|---|---|---|---|
| Planificador diario | «+ Nueva tarjeta» | «+» | «Nueva tarjeta» |
| Kanban y vista expandida | «+» de columna, «⋯» de columna, «⋯» de tarjeta, «+» de agregar columna | íconos | «Nueva tarjeta», «Opciones de la columna», «Opciones de la tarjeta», «Nueva columna» |
| Kanban | «Vista expandida» / «Vista compacta» | ícono Expandir / Compactar | «Vista expandida» / «Vista compacta» |
| Calendario (Mes y Semana) | flechas de periodo, si existen | íconos | «Mes anterior», «Mes siguiente», «Semana anterior», «Semana siguiente» |
| Reportes | «Ver más reportes» | ícono Reportes | «Ver más reportes» |
| Más reportes | «← Reportes» | «←» | «Regresar a Reportes» |
| Etiquetas | «+ Nueva etiqueta», «Editar», «Eliminar» | «+», lápiz, papelera | «Nueva etiqueta», «Editar», «Eliminar» |
| Detalle de tarjeta | «Eliminar» | papelera | «Eliminar» |
| Notas centradas de cuenta | «Regresar» (arriba y al final) | solo «←» arriba | «Regresar» |
| Personalización · Mis temas | lápiz, «×» | lápiz, papelera | «Renombrar», «Eliminar» |
| Personalización · Widgets | «+ Agregar widget», «Configurar», «×», «Organizar widgets» | «+», engranaje, papelera, ícono Organizar | «Agregar widget», «Configurar», «Eliminar», «Organizar widgets» |
| Personalización · subpantallas | «Regresar» | «←» | «Regresar» |
| Barra lateral contraída | íconos de sección, «>» | sin cambio | nombre de la sección, «Expandir menú» |
| Barra lateral expandida | «<» | sin cambio | «Contraer menú» |
| Panel de Windi | «×», «Enviar» | «×», ícono Enviar | «Cerrar», «Enviar» |
| Ventanas emergentes | «×» | sin cambio | «Cerrar» |
| Botón flotante de Windi | — | cabeza de Windi | «Windi» |

Se quedan con texto: acciones Principal y Secundario, selectores segmentados y selectores con valor.

**Comportamiento.**
- Componente `NombreEmergente` en `apps/desktop/src/ui/`, envuelve a `Boton variante='icono'`.
- Aparece al pasar el puntero (retraso 400 ms) **y con el foco del teclado** (sin retraso); se oculta al salir, con
  `Esc` o al hacer clic. No se usa `title` (no se ve con teclado ni sigue el tema).
- Estilo: relleno `tinta`, texto `marco` 13 px 500, radio 6, relleno 6 × 10 px, flecha de 6 px, 8 px del botón.
- `aria-label` del botón = texto del nombre emergente; `role="tooltip"` y `aria-describedby` solo si el texto agrega
  algo al `aria-label`.
- Posición: debajo; si no cabe, arriba; nunca se sale por los lados.
- Botón deshabilitado con motivo (`motivoAlPasar` de `Boton.tsx`): el nombre emergente muestra el motivo, para no
  tener dos mecanismos.
- Eliminar es papelera en todas partes; «×» solo cierra o quita algo de una selección.
- Campos que buscan o filtran llevan lupa a la izquierda (ciudad de Clima, filtrar etiquetas, catálogo de imágenes,
  Mover a, etiquetas de la tarjeta); es decorativa (`aria-hidden`).

**Pruebas.** Vitest del componente (foco, Esc, `aria-label`). Playwright: en cada pantalla, todo `button` sin texto
visible tiene `aria-label` no vacío.

**Contradice:** las ET que citan como texto de botón «+ Nueva tarjeta», «+ Nueva etiqueta», «+ Agregar widget»,
«Editar», «Eliminar», «Regresar» (HE-04, HE-05, HE-06, HE-07, RT-03) y RD-17. El texto pasa al `aria-label`.

## IM-04 · Ventanas emergentes en lugar de subpantallas (DI-09)

Aplica a: Detalle de tarjeta, Nueva tarjeta, Editar tarjeta (ancho 560); Nueva etiqueta, Editar etiqueta, Nueva
columna, Editar columna, Mover a (ancho 420).

- Reutilizar `VentanaEmergente`. Foco atrapado; foco inicial en el primer campo (o en «×» si no hay campos); `Esc` y
  «×» cierran; al cerrar, el foco vuelve al botón que la abrió; el fondo queda `inert`; `aria-modal="true"` y
  `aria-labelledby` al título. Sin miga de pan.
- Velo: `tinta` al 40 % en claro, negro al 55 % en oscuro. Ventana con `superficie_alta` y la esquina doblada de la
  nota (IM-15).
- **Cambios sin guardar:** cerrar con «×», `Esc` o clic en el velo con datos escritos pide la confirmación de
  descarte existente; el clic en el velo no cierra si hay cambios.
- Errores de formulario dentro de la ventana, todos a la vez, uno por campo; un error de red es un `Aviso` dentro de
  la ventana, no un mensaje emergente detrás del velo.
- Si el router actual tiene rutas para estas vistas, se conservan para abrir la ventana sobre la pantalla de origen y
  mantener el «atrás»; no se inventan rutas nuevas.
- Desplazamiento interno si el alto pasa del 90 % de la ventana (960 × 600 y zoom 125 %).
- Pruebas Playwright: foco (entra, queda atrapado, vuelve), Esc, descarte con cambios, anchos 560 / 420.
- **Contradice:** RT-03 (subpantallas con miga de pan y «Regresar») y las ET de HE-06 / HE-07 de esas pantallas.

## IM-05 · Windi: ojos, botón flotante y estados (DI-06, DI-07)

- Exportar del Figma como SVG los ojos y la sonrisa de Inicio de sesión (nodos `66:20` y `66:23`) y la cabeza
  recortada del botón; en `screens/windi/activos/`, con color por variable, sin PNG (regla 10).
- Botón flotante: `Boton variante='icono'` de 48 × 48, abajo a la derecha a 16 px, `aria-label="Windi"`.
- **Movimiento solo al pasar el puntero o con foco:** aparecen las ondas violeta de saludo con transición de opacidad
  y desplazamiento ≤ 200 ms; quieto el resto del tiempo. Con `prefers-reduced-motion: reduce`, sin transición.
- Estados del personaje (cambia el SVG, sin animación): «Escribiendo…» → ojos de lado; «Sin conexión» y «Error» →
  ojos cerrados y boca recta. Aplica al botón y al Windi del panel vacío.
- «Con propuesta»: punto violeta de 8 px mientras haya una propuesta sin responder; `aria-label` «Windi, tiene una
  propuesta».
- Panel vacío: Windi entero con el globo «¿Qué organizamos hoy?» hasta el primer mensaje. Por debajo de 1000 px de
  ancho se oculta (misma regla que RD-07 y RD-21).
- No hay avatar en la cabecera del panel ni cara junto a los mensajes.
- Pruebas: Vitest del SVG por estado y del `aria-label`; Playwright: el botón no se superpone con ningún control a
  1200 × 800 y 960 × 600.

## IM-06 · Chat de Windi con el estilo de la landing (DI-08)

- Un solo juego de componentes (`MensajeDeWindi`, `MensajePropio`, `Propuesta`) para el panel de la app y para el
  widget del escritorio.
- Estilo: contenedor `superficie` con borde 1,5 px `borde`, radio 12 y sombra sólida 1 px → 3 px ↓; mensajes de Windi
  a la izquierda en globo sin relleno con borde 1 px y radio 10; mensajes propios a la derecha con relleno cian claro
  (`#BFF5F8` claro, `#0E4A4D` oscuro); propuesta con «Confirmar» (Principal pequeño, alto 28) y «Rechazar»
  (Secundario pequeño).
- El widget vive en el wallpaper (otro WebView): recibe los tokens del tema aplicado como los demás widgets.
- La propuesta se responde una sola vez: al confirmar o rechazar, ambos botones se deshabilitan y el globo muestra el
  resultado (estados existentes).
- Contador «0 / 2000»: el límite lo valida el contrato actual; al pasarlo, mensaje de campo, nunca genérico.

## IM-07 · Mensajes emergentes (DI-10)

- Un solo contenedor global (`aria-live="polite"`; el de error con `role="alert"`), arriba a la derecha bajo la miga
  de pan, a 16 px del borde, ancho 320, apilado hacia abajo con 8 px, máximo 3 visibles: el cuarto reemplaza al más
  antiguo.
- Se corre a la izquierda del panel de Windi cuando está abierto (medir el panel, no un número fijo).
- Nunca sobre: el botón de Windi, la barra inferior de Personalización, las acciones de una ventana emergente.
- Pausa del cierre al pasar el puntero y mientras tiene foco. Duración: la de `MensajeResultado`; los de error no se
  cierran solos.
- Con una ventana emergente abierta, el mensaje va por encima del velo pero no roba el foco.
- Prueba de geometría: en cada pantalla, el mensaje no intersecta botones, título, barra inferior ni botón de Windi.

## IM-08 · Cabecera en una línea y contenedores

- Componente común de cabecera: fila 1 con `MigaDePan` a la izquierda y el estado de sincronización a la derecha;
  fila 2 con el título y una ranura de controles a la derecha, centrados verticalmente. El contenido empieza 16 px
  debajo.
- A 960 × 600 o con zoom 125 %, si los controles no caben junto al título, bajan a una segunda línea alineada a la
  derecha. Nunca scroll horizontal.
- Componente `Panel` para los bloques de información (relleno `superficie`, borde 1 px `linea`, radio 12, relleno 16),
  con su título como `h2`.
- Barra lateral: 24 px entre el último ítem de un grupo y la etiqueta del siguiente, en una variable
  (`--wg-separacion-grupo`). Prueba: «Etiquetas» → «PERSONALIZACIÓN» = 24 ± 2 px.

## IM-09 · Calendario con información

- Mes: cuadrícula con líneas `linea`; máximo 3 tarjetas por celda y una línea «+N más» que abre el Panel del día
  existente. Orden en el día: con bloque horario por hora; luego sin bloque por prioridad (Alta → Baja); luego título.
  Hoy resaltado; día con tarjeta vencida con un punto `error`.
- Semana: bloques por `scheduled_date` + `scheduled_hour`; sin bloque en la franja «Todo el día». Horas visibles
  07:00–20:00; si hay tarjetas fuera, el eje se amplía (no se esconden).
- Cada tarjeta es un botón con `aria-label` «<título>, <hora o Todo el día>, <estado>» y abre el Detalle (IM-04).
- La cuadrícula es una tabla o `role="grid"` navegable con flechas.
- El mes se consulta en una sola llamada al contrato existente, no una por día.

## IM-10 · Kanban: columna fantasma y vista expandida (DI-15)

- Columna fantasma para agregar columna: mismo alto que la columna más alta (`align-items: stretch`), borde
  discontinuo gris claro, «+» centrado en los dos ejes, `aria-label="Nueva columna"`. Si se alcanza el máximo de
  columnas del contrato, se deshabilita con el motivo del contrato en el nombre emergente (nunca error genérico).
- Vista expandida: solo campos de `card` (HE-06): etiquetas con nombre (máximo 3 y «+N»), título (2 líneas),
  descripción (2 líneas, `-webkit-line-clamp`; sin descripción no se muestra la línea), tipo, fecha límite con estado,
  prioridad y bloque horario; en Hecho, `completed_on`. «Vencida» si `due_date < hoy` y no completada; «Vence hoy» si
  `due_date = hoy`; fecha en hora de Colombia como el resto de la app.
- La preferencia compacta / expandida no se guarda: al volver a la pantalla abre en compacta. Si hoy ya existe una
  preferencia guardada, se conserva.

## IM-11 · Cumplimiento por estado (DI-11)

- Anillo SVG con segmentos por `stroke-dasharray` (Completadas `#2E8B57`, Pendientes `#DCBA04`, Vencidas `error`),
  total en el centro. Con total 0, el estado Vacío existente.
- El SVG es decorativo (`aria-hidden`); la leyenda es una lista con nombre, número y porcentaje. Los porcentajes
  redondeados suman 100 (el mayor absorbe la diferencia).
- Colores con ≥ 3:1 contra `superficie` en los cuatro temas.

## IM-12 · Personalización: pasos, vista previa y barra expandida (DI-12)

- Reutilizar `IndicadorDePasos` (regla 6) con una prop para hacerlo navegable: `role="tablist"`, cada paso
  `role="tab"` con `aria-selected`, flechas para moverse.
- Vista previa en 16 : 9 con `aspect-ratio`, ocupando el resto del ancho; panel de configuración de 300 px con
  desplazamiento interno.
- Debe funcionar con la barra lateral contraída y expandida sin forzar ninguna. Geometría en ambas a 1200 × 800 y
  960 × 600.

## IM-13 · Ícono del clima (DI-14)

Open-Meteo (`contratos.md`, `weather-current`) entrega `weather_code` (WMO) e `is_day`. Si el contrato actual no los
devuelve, se agregan a la respuesta de la Edge Function (cambio de contrato: anotarlo en `contratos.md` y en el RD).

| Códigos WMO | Ícono de día | Ícono de noche |
|---|---|---|
| 0, 1 | Despejado | Despejado de noche |
| 2 | Parcialmente nublado | Parcialmente nublado de noche |
| 3 | Nublado | Nublado |
| 45, 48 | Niebla | Niebla |
| 51–57 | Llovizna | Llovizna |
| 61–67, 80–82 | Lluvia | Lluvia |
| 71–77, 85, 86 | Nieve | Nieve |
| 95, 96, 99 | Tormenta | Tormenta |
| otro, nulo o sin datos | Sin datos | Sin datos |

- Código desconocido → «Sin datos», nunca error. Los estados de error y sin conexión de HE-04-HU05 (CA07, CA08)
  conservan sus textos y muestran «Sin datos».
- Texto alternativo del ícono con el nombre de la condición.
- Prueba unitaria de la tabla completa (cada rango, `is_day` 0 y 1, un código fuera de rango).

## IM-14 · Notas de las pantallas de cuenta: esquina doblada y flecha (DI-16)

Pantallas: Verificar correo, Recuperar contraseña (correo, código, nueva contraseña) y Recuperar contraseña sin
conexión.

- La nota con corte se dibuja con `clip-path` o con el SVG de la silueta de Inicio de sesión (nodo `68:4`), y la
  sombra con la misma silueta en un segundo elemento desplazado 3/5 px (`box-shadow` sigue el rectángulo, no el corte).
  Mismo componente `MarcoDeCuenta` para la nota lateral y la centrada, con prop de tamaño. También lo usan las
  ventanas emergentes (IM-04).
- Con `forced-colors: active` el borde se mantiene (RD-23).
- La flecha es `Boton variante='icono'` en la misma fila flex que `MigaDePan`, 8 px antes de la miga; no se
  superponen. Se quita el enlace «Regresar» del final de la nota: el botón principal queda solo, a la derecha, y
  «Reenviar código» sigue debajo. RD que dice «Reemplaza RD-17»; actualizar `Register.test.tsx` y
  `Recovery.test.tsx`.
- Prueba de geometría: flecha y miga no se intersectan y comparten línea media ±1 px.

---

Lo que aparezca al implementar y no esté aquí se registra en `docs/DUDAS.md` con el valor neutro usado y se le
pregunta a Paula.

## Lista de verificación al cerrar

- [ ] Un RD por cada IM implementado, con «Contradice» y «Pendiente para la edición final» al día.
- [ ] `herramientas/verificacion/verificar.sh` con todos los pasos en `=== fin (0)`.
- [ ] Geometría a los tamaños de los marcos, 1200 × 800, 1000 y 999 px, 960 × 600 y zoom 125 %, en Windgets claro y
  Windgets oscuro como mínimo.
- [ ] Contraste de los cuatro temas.
- [ ] Ninguna ruta previsible de lo nuevo llega al error genérico (comprobado con una petición real, no solo leyendo).
