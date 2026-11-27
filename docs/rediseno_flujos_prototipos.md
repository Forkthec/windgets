# Flujos de los prototipos de Figma (guía para implementar)

Archivo Figma: `A3Z03L20swFyo8qdP9jETF` («Windgets (Copy)»). Última actualización: 25-nov-2026 (hora colombiana).
Decisión de Paula (lote 13, punto f): **todo lo que está en Figma se implementa; el Figma es la aplicación a construir.**
Lo que no se implementa está en la sección 13 (secciones «Descartado»).

Este documento ordena los marcos por flujo. Los ids de cada marco en los cuatro temas están en
[`rediseno_flujos_ids_prototipos.md`](rediseno_flujos_ids_prototipos.md). Los textos literales mandan en
[`rediseno_pendientes_prototipos.md`](rediseno_pendientes_prototipos.md) §14 y en `docs/interfaz.md` (M-nn y T-nnn);
las reglas visuales, en [`rediseno.md`](rediseno.md) (RD-nn). Si algo de aquí contradice esos documentos, ganan ellos.

## 1. Convenciones

- **Nombre de marco:** `Flujo · Paso · Estado · Tema` (ejemplo: `Personalización · 2 Fondo · Aviso · Monitor desconectado · Tema Rosa pastel`).
  Los marcos `Overlay · M-nn` y `Selector · …` son ventanas o selectores que se abren encima de otro marco.
- **Cuatro temas por marco** en las páginas de la aplicación: `Windgets claro`, `Windgets oscuro`, `Rosa pastel`, `Enfoque rojo y negro`.
  Acceso, instalador y algunas confirmaciones solo tienen claro y oscuro (`Claro`, `Oscuro`).
  Los cuatro son **el mismo diseño con otro modo de las variables** (colección `VariableCollectionId:200:2`: claro `200:0`, Rosa `200:1`, Enfoque `200:2`, oscuro `233:0`); se implementa un solo componente y se cambia el tema, no cuatro pantallas.
- **Un solo marco vigente por estado.** Cada estado de una pantalla es un marco aparte, con el mismo nombre de pantalla y el estado después del punto medio. Para implementar, cada marco es un caso de prueba visual del estado.
- **Reacciones.** Los enlaces de Figma son `NAVIGATE` entre marcos de la misma página y `OVERLAY` para ventanas M-nn. Figma no permite `NAVIGATE` entre páginas: los saltos entre páginas están en la sección 11 y se implementan por el contrato.
- **Los enlaces están en el tema claro** (y se repiten igual en los otros tres). Los destinos de las tablas son nombres de familia; el id claro está en la tabla y los demás en el archivo de ids.
- Las figuras de pantalla `Aviso`, `Mensaje emergente` y `Nombre emergente` son mensajes de resultado (píldora o ventana) y descripciones accesibles de botones con puntero encima; no son pantallas nuevas.

## 2. Páginas y qué contienen

| Página | Id | Familias vigentes | Marcos vigentes | En «Descartado» | Contenido |
|---|---|---|---|---|---|
| 00 · Fundamentos | `0:1` | 4 con tema + 23 sueltos | — | 10 propuestas | Biblioteca de componentes y tokens; no es pantalla |
| 01 · Acceso | `79:2` | 50 | 100 (claro, oscuro) | — | Inicio de sesión, registro, verificación, recuperar contraseña |
| 02 · Planificador | `79:3` | 125 | 500 | 6 nodos | Diario, Kanban, calendario, agenda, reportes, etiquetas, formularios |
| 03 · Agente de IA | `79:4` | 21 | 84 | — | Windi en pantalla completa |
| 04 · Personalización | `79:5` | 152 | 608 | 56 | Los cuatro pasos de personalización, widgets, temas, fondo |
| 05 · Configuración | `79:6` | 19 | 76 | 4 | Configuración, Windi superpuesto |
| 06 · Escritorio de Windows | `83:2` | 32 | 128 | — | Los widgets sobre el escritorio |
| 07 · Web e instalación | `83:3` | 5 | 10 (claro, oscuro) | — | Sitio de descarga e instalador |
| 08 · Confirmaciones | `83:4` | 22 | M-01, M-16 a M-21: claro y oscuro; M-02 a M-15: cuatro temas | — | Ventanas de confirmación M-01 a M-21 |

Comprobación hecha contra Figma el 25-nov-2026: en cada página, todo marco de nivel superior pertenece a una familia con tema o a una sección («Mensajes emergentes (PR-25)» o «Descartado»); ninguno queda sin clasificar. Los ids están en [`rediseno_flujos_ids_prototipos.md`](rediseno_flujos_ids_prototipos.md).

## 3. Flujo 1 · Instalación (página `83:3`, claro / oscuro)

Fuente: `docs/contratos.md` INT-13; ventanas M-01, M-16 a M-21.

| Paso | Marco (claro · oscuro) | Acción | Destino | Estado |
|---|---|---|---|---|
| 1 | Windgets para Windows `84:1050` · `84:1059` | «Descargar para Windows» | Opciones de instalación | Entrada |
| 2 | Opciones de instalación `84:1068` · `84:1080` | «Instalar» | Instalación en curso | Normal |
| 2a | Opciones · Sin espacio `2264:134733` · `2264:134759` | «Instalar» queda deshabilitado | Sin enlace | Hay menos de 500 MB libres |
| 3 | Instalación en curso `84:1092` · `84:1102` | Termina la copia | Instalación completada | En curso |
| 4 | Instalación completada `84:1112` · `84:1120` | «Abrir Windgets» | Inicio de sesión (flujo 2) | Final |

Ventanas de este flujo (página `83:4`): M-01 Cancelar instalación `85:2`; M-16 Reinstalar `85:190`; M-17 Reparar `85:202`; M-18 Equipo no compatible `2264:134573` · `2264:134590`; M-19 Instalador dañado `2264:134607` · `2264:134624`; M-20 Falla de instalación `2264:134641` · `2264:134662`; M-21 Instalación cancelada `2264:134683` · `2264:134700` .

## 4. Flujo 2 · Acceso (página `79:2`, claro / oscuro)

Pantallas base (todas con sus estados en el archivo de ids):

| Paso | Marco claro | Acción | Destino |
|---|---|---|---|
| Nota de Windi · Inicio de sesión (entrada) `66:4` | «¿Olvidaste tu contraseña?» | Recuperar contraseña `84:22` |
| | «Regístrate» | Registro `66:162` |
| | botón de tema «Oscuro» | Mismo marco en oscuro `66:83` |
| Registro `66:162` | «Crear cuenta» | Verificar correo `84:2` |
| | «Inicia sesión» | Inicio de sesión `66:4` |
| Verificar correo `84:2` | «Regresar» | Registro `66:162` |
| Recuperar contraseña `84:22` | Acción principal | Diligenciar código `84:42` |
| | «Regresar» | Inicio de sesión `66:4` |
| Diligenciar código `84:42` | Acción principal | Nueva contraseña `84:62` |
| | «Regresar» | Recuperar contraseña `84:22` |
| Nueva contraseña `84:62` | «Regresar» | Diligenciar código `84:42` |
| Recuperar contraseña · Sin conexión `88:2` | «Regresar» | Inicio de sesión `66:4` |

Estados por pantalla (cada uno es un marco de la página; los ids están en el archivo de ids):
- **Inicio de sesión:** campos obligatorios, correo no válido, correo muy largo, credenciales incorrectas, cuenta bloqueada, demasiados intentos, sesión vencida, Google cancelado, Google no disponible, correo de Google muy largo, navegador no abre, sin conexión, contraseña actualizada, sesión cerrada, mostrar / ocultar contraseña.
- **Registro:** campos obligatorios, datos no válidos, correo muy largo, correo ya registrado, sin conexión.
- **Verificar correo:** código enviado, campo obligatorio, código incorrecto, código vencido, demasiados intentos, código reenviado, reenviar en espera, sin conexión.
- **Recuperar contraseña:** campo obligatorio, correo no válido, correo muy largo, sin conexión.
- **Diligenciar código:** mismas variantes que Verificar correo, menos «Código enviado».
- **Nueva contraseña:** campos obligatorios, datos no válidos, igual a la actual, sin conexión.

Los marcos de estado copian los enlaces de su pantalla base (por eso «Regresar» y los enlaces de pie están en todos). Los avisos con píldora (`Aviso · píldora`) se cierran con «Cerrar».

## 5. Flujo 3 · Personalización (página `79:5`, cuatro temas)

Ids claro / oscuro / Rosa / Enfoque de cada familia: archivo de ids, sección «04 · Personalización».

### 5.1 Barra de pasos y entrada

La barra lateral tiene cuatro pasos y «Ocultar menú / Barra expandida». Cada paso tiene un marco base, y el estado «Barra expandida» con la acción «Ocultar menú» de vuelta al base.

| Paso | Marco claro | Acción | Destino |
|---|---|---|---|
| 1 Tema `203:6362` | «Elegir <tema>» (cuatro filas) | Elegir Windgets claro `203:11013`, oscuro `2061:619`, Rosa `203:11084`, Enfoque `203:11155` |
| | «Guardar como tema» | Guardar como tema `203:10869` |
| | «Renombrar tema» (ícono) | Renombrar tema `217:24146` (ventana) |
| | «Eliminar tema» | Overlay M-06 `204:25110` |
| | «Salir» (M-02) | Overlay M-02 `204:25071` |
| 2 Fondo `203:6440` | «Catálogo de imágenes» | `203:10198` |
| | «Subir imagen» | `203:10273` |
| | «Sin imagen» | `203:10346` |
| | «Ajustar imagen» | `203:10417` |
| 3 Colores y tipografía `203:6520` | «Paletas» | `203:10490` |
| | «Selector de color» | `203:10565` |
| | «Tipografía» | `203:10640` |
| | «Restablecer colores / tipografía» | `203:10942` |
| 4 Widgets `203:6607` | «Agregar widget» | Agregar widget `203:6696` |
| | «Configurar» de cada widget activo | Configurar widget › Reloj / Calendario / Tareas del día / Kanban (según el widget) |
| | «Organizar widgets» | Organizar widgets `203:9957` |
| | «Forma de los widgets» | `203:10717` |
| | «Distribución predefinida» | `203:10794` |

### 5.2 Guardar y aplicar

| Marco | Acción | Destino |
|---|---|---|
| Cambios sin guardar `203:9985` | «Guardar» | Guardado `203:10056` |
| Guardado `203:10056` | «Aplicar» | Overlay M-05 `204:25097` o M-15 `204:25136` (condicional) |
| Aplicado `203:10127` | Resultado | Pantalla del paso desde donde se aplicó |
| 1 Tema · Cambios sin guardar `2177:32246` | «Elegir <otro tema>» | **Overlay M-04 `204:25084`** (T-050 / T-149), hecho en esta tanda |

M-05 y M-15 y «Aplicado» **sí tienen entrada** (condicional: sale de las filas «aplicar»). El inventario anterior que los daba por huérfanos ignoraba las reacciones condicionales.

### 5.3 Agregar y configurar widgets

- **Agregar widget** `203:6696` → «add/<widget>» → `Agregar widget › <widget>` (Clima, Noticias, Imagen estática, Carrusel de imágenes, Animación, Texto, Reproductor de música, Windi; Reloj, Calendario, Tareas del día y Kanban no se agregan —ya vienen activos—: se configuran desde «Configurar widget › …»; sus marcos «Agregar widget › …» están en «Descartado»).
- Cada `Agregar widget › X` → «added/X» → `Widgets · X agregado` (vuelve al paso 4 con el aviso). Los selectores Apariencia, Transparencia, Tamaño de texto y Formato se abren en superposición (`Selector · …`).
- **Clima** tiene sus estados propios: campo vacío (`2211:79096`), sugerencias de ciudad (`2211:79211`), sin conexión al buscar, ciudad demasiado larga, ciudad no encontrada, ciudad duplicada, servicio no disponible, sin conexión. Los estados se alcanzan por el texto del campo «Ciudad» y la respuesta del servicio de clima.
- **Carrusel de imágenes:** error de mínimo, de máximo, de intervalo. **Texto:** texto demasiado largo. **Imagen estática:** imagen propia.
- **Reloj:** variantes `Otra paleta`, `Colores libres` (con `Contraste bajo`), `Apariencia propia`.

### 5.4 Organizar widgets

Marco base `203:9957`. Estados: Arrastrando `217:17802`, Redimensionando `217:17874`, Colisión `217:17946`, Sin conexión `217:18018`, Widget eliminado, Personalización más reciente, Sin widgets activos, Reloj a la derecha `223:15783`, Kanban centrado `223:15912`.
Enlaces: el widget «Reloj» → Arrastrando; «Redimensionar» → Redimensionando; «Cambios sin guardar» → paso 4 Widgets (o su variante: `4 Widgets · Reloj a la derecha`, `4 Widgets · Tamaño ajustado`). El aviso con píldora se cierra con «Cerrar».
En el paso 4 hay además: Error de carga, Posición ajustada, Tamaño ajustado, Widget inactivo, Eliminar no disponible, Animación en pausa, Aviso widget repetido, Aviso widget no existe, Aviso error de operación, Nombre emergente · Papelera deshabilitada. «Eliminar Animación» abre Overlay M-07 `204:25123`.

### 5.5 Fondo, colores y forma

- **Fondo:** Ajuste por monitor (y «Varios monitores»), avisos «Más de 6 monitores», «Fondo por defecto», «Monitor desconectado», «Imagen del tema no encontrada»; Subir imagen · Imagen propia y errores «Formato no permitido», «Imagen muy pesada», «Imagen dañada»; Catálogo · Vacío. «Quitar imagen» y «Cambios sin guardar» vuelven a `2 Fondo`.
- **Colores:** Paletas, Selector de color (errores «Color no válido», aviso «Contraste bajo»), Paleta personalizada, aviso «Paleta no disponible». «Campo · Color hexadecimal» y «Cambios sin guardar» llevan a `Cambios sin guardar`.
- **Forma de los widgets:** Rectas, Redondas, Con sombra; cada opción enlaza a las otras dos y a la base (`Forma de los widgets`).
- **Tema:** Cambios sin aplicar, Cambios sin guardar, Eliminar deshabilitado, Aplicar deshabilitado, Guardar deshabilitado, Un solo tema, avisos «Máximo de temas», «Tema con las mismas propiedades», «Tema que ya no existe», «Personalización más reciente»; Guardar como tema · Nombre muy largo y Nombre repetido.

### 5.6 Windi dentro de personalización

`Overlay · Windi` `204:25151` → Escribiendo `204:25177` y Propuesta `204:25162`; Propuesta → Confirmar (vuelve a `Overlay · Windi`) o Rechazar (Propuesta descartada `204:25210`). Estados: Sin conexión, Error.

### 5.7 Nombres emergentes y mensajes

Los marcos `… · Nombre emergente`, `… · Mensaje emergente` y `Guardado · Mensaje emergente` muestran la descripción de un botón con el puntero encima o el mensaje de resultado; no tienen enlace propio.

## 6. Flujo 4 · Planificador (página `79:3`, cuatro temas)

Sin enlaces de página a página: todos los destinos son marcos de esta página.

### 6.1 Pantallas base y navegación

| Pantalla (id claro) | Acción | Destino |
|---|---|---|
| Planificador diario `204:622` | Tarjeta | Detalle de tarjeta `204:1849`; arrastrar → Arrastre `217:11426` |
| | «Nueva tarjeta» | Nueva tarjeta `204:1915` |
| | Windi | Overlay Windi `204:25611` |
| Tablero Kanban `204:704` | «Nueva columna» | `204:2143` |
| | «Editar columna» (⋮) | Menú de columna `217:13616` |
| | «Menú de tarjeta» (⋮) | Menú de tarjeta `217:13403` |
| | «Nueva tarjeta» | `204:1915` |
| | Tarjeta | Detalle de tarjeta |
| | Arrastrar tarjeta / columna | `217:13829` / `217:14042` |
| | Vista expandida | `Tablero Kanban · Expandida` `204:1139` |
| Menú de tarjeta `217:13403` | «Editar tarjeta» | Editar tarjeta `204:1981` |
| | «Eliminar tarjeta» | **Overlay M-08 `204:25533`** (T-155), corregido en esta tanda (antes iba a «Editar tarjeta») |
| | «Mover a» | Mover a `204:2239` |
| Menú de columna `217:13616` | «Editar columna» | Editar columna `204:2191` |
| | «Eliminar columna» | Overlay M-09 `204:25546` (T-107, columna sin tarjetas) |
| Menú de columna · Columna predefinida `2152:30825` | «Eliminar columna (deshabilitado)» | **Sin reacción** (antes iba a «Editar tarjeta»; una columna predefinida no se elimina) |
| Calendario `204:805` | Día del mes / Panel del día | Panel del día `204:1316` |
| | «Mes y año» | Mes y año `204:1442` |
| | «Semana» | Calendario · Semana `204:1249` |
| Mes y año `204:1442` | «Escribir año» | Mes y año · Escribir año `219:14757` |
| | Cerrar | Calendario |
| Agenda diaria `204:916` | Tarjeta | Asignar bloque `217:15308` / Quitar bloque `217:15485` / Detalle de tarjeta |
| | «Mes y año» | Mes y año |
| Reportes `204:1005` | «Rango de fechas» | `204:1683` → personalizado `219:57179` → «Elegir Desde / Hasta» |
| | «Filtrar etiqueta» | Filtrar etiquetas `204:1766` |
| | «Más reportes» | Más reportes `204:1581` |
| Etiquetas `204:1078` | «Nueva etiqueta» / «Editar etiqueta» | `204:2047` / `204:2095` |
| | Eliminar (M-10) | Overlay M-10 `204:25559` |
| Detalle de tarjeta `204:1849` | «Editar tarjeta» | `204:1981` |
| | «Eliminar» (M-08) | Overlay M-08 `204:25533` |
| | «Cerrar» | Planificador diario |

Formularios: Nueva tarjeta, Editar tarjeta, Nueva etiqueta, Editar etiqueta, Nueva columna, Editar columna y Mover a regresan con «Cerrar» a su pantalla (Planificador diario, Etiquetas o Tablero Kanban).
Ventanas de eliminar: M-08 «Eliminar tarjeta» → `Planificador diario`; M-09 y M-13 «Eliminar columna» → `Tablero Kanban`; M-10 y M-14 «Eliminar etiqueta» → `Etiquetas`; «Cancelar» cierra la ventana.

### 6.2 Estados por pantalla (todos con ids en el archivo de ids)

- **Planificador diario:** Vacío, Cargando, Sin conexión, Vencida, Recordatorio, Arrastre, Densidad cómoda, Todas completadas, avisos «Tarjeta inexistente», «Tarjeta actualizada», «Bienvenida», «Tema no aplicado».
- **Tablero Kanban:** Tablero vacío, Columna vacía, Muchas columnas, Densidad cómoda, Sin tablero descargado, avisos «Máximo de columnas», «Columna inexistente»; «Nombre emergente» (Vista expandida / compacta, Nueva columna).
- **Calendario:** Semana, día con el puntero encima, aviso «Día pasado», nombres emergentes de mes y semana anteriores y siguientes; Panel del día · Vacío.
- **Agenda diaria:** Sin tarjetas por programar, Asignar bloque, Quitar bloque, Bloque pasado, avisos al soltar («No puedes asignar tarjetas a un bloque hecho / después de la fecha límite»), nombre emergente «Elegir un día».
- **Reportes:** Vacío, Cargando, Error, Sin conexión, Sin tarjetas, Rango recortado, Filtro de etiquetas (abierto, Máximo, Sin etiquetas), Rango (fecha de inicio posterior, campo obligatorio, rango mayor de un año, fecha no válida), Elegir Desde / Hasta, puntero encima de la gráfica, estado elegido «Vencidas», rango cambiado con estado sin tarjetas.
- **Etiquetas:** Vacío, avisos «Máximo de etiquetas», «Etiqueta inexistente»; formularios con errores: obligatorio, nombre largo, nombre repetido, color no disponible.
- **Nueva / Editar tarjeta:** etiquetas abierta (máximo, sin etiquetas, sin elegir), fecha límite, fecha y hora del bloque abiertas, campos vacíos, error al guardar, tres marcos de «Errores» que reúnen todos los errores de forma a la vez (regla de errores visibles), Detalle de tarjeta · Sin datos.
- **Nueva / Editar columna:** obligatorio, nombre largo, nombre repetido, color no disponible.
- **Overlay M-14 · Usada en 1 tarjeta:** variante de M-14.

### 6.3 Windi superpuesto

`Overlay · Windi` `204:25611` → Escribiendo `204:25637` y Propuesta `204:25622`. Propuesta → Confirmar / Rechazar (Propuesta descartada `204:25670`). Estados: Sin conexión `204:25648`, Error `204:25659`.

## 7. Flujo 5 · Windi pantalla completa (página `79:4`, cuatro temas)

| Marco claro | Acción | Destino |
|---|---|---|
| Windi `204:2427` | Escribir | Windi · Escribiendo `204:2609` |
| | Propuesta | Windi · Propuesta `204:2516` |
| Propuesta `204:2516` | «Confirmar» | Windi `204:2427` |
| | «Rechazar» | Windi · Propuesta descartada `204:2876` |
| Escribiendo `204:2609` | Respuesta | Propuesta |
| Sin conexión `204:2698`, No respondió `204:2787` | Escribir / Propuesta | Escribiendo / Propuesta |
| Propuesta descartada `204:2876` | «Confirmar» | Windi |

Variantes de propuesta (un marco por tipo de cambio): Crear `2170:1994`, Cambiar `2171:2002` (y Tarjeta completada), Mover `2171:2082` (y Tarjeta completada), Eliminar varias `2171:2159`, Crear etiqueta `2171:2200`, Descartada `2171:2240`, Sin conexión `2171:2281`. Otras: Mensaje muy largo `2172:2075`, Respuestas (Propuesta, Saludo y datos que faltan, No encuentra y sin cambio, Hecho y fuera de alcance), Nombre emergente, Mensaje emergente.

## 8. Flujo 6 · Configuración (página `79:6`, cuatro temas)

| Marco claro | Acción | Destino |
|---|---|---|
| Configuración `204:3109` | «Configuración» (densidad) | Configuración · Cómoda `204:3159` |
| | «Cerrar sesión» (M-11) | Overlay M-11 `204:25989` |
| | Windi | Overlay Windi `204:26015` |
| Cómoda `204:3159` | «Configuración» | Configuración `204:3109` |

Estados: Sincronizando `217:20340`, Sin conexión `217:20400`, Error de sincronización `217:20460`, Mensaje emergente y avisos «Inicio automático desactivado», «Error de inicio automático», «Error al cerrar sesión», «Sin conexión», «Cambios sincronizados», «Cambios de otro computador».
M-12 `204:26002` y M-11 son ventanas de cerrar sesión; M-12 **no tiene entrada** (se abre cuando hay cambios sin sincronizar; ver `docs/interfaz.md`). Windi superpuesto: igual que en 6.3.

## 9. Flujo 7 · Escritorio de Windows (página `83:2`, cuatro temas)

Sin enlaces: son representaciones del escritorio con los widgets, para implementar la apariencia. Marco base `204:22938`; un marco por tipo de widget (`Widget · Reloj … Windi`), Notificación de Windows, Área de notificación, Fondo oscurecido, Widget seleccionado y estados («Tareas del día · Sin tareas / Tarea vencida», «Kanban · Sin tarjetas / Arrastrando una tarjeta / Cinco tarjetas por columna», «Calendario · Puntero encima / Semana desde domingo», «Reloj · 12 horas», «Clima · Sin conexión», «Noticias · Sin conexión / Error / Puntero encima», «Reproductor de música · Sin música», «Animación · En pausa», «Aviso de wallpaper»). La barra de tareas queda oculta salvo en la notificación.

## 10. Flujo 8 · Confirmaciones (página `83:4`)

Cada M-nn es un marco con sus cuatro temas (claro y oscuro en M-01, M-16 a M-21). Origen y destino por contrato (`docs/interfaz.md`):

| Ventana (id claro) | Se abre desde | «Confirmar» lleva a | «Cancelar» |
|---|---|---|---|
| M-01 `85:2` | Instalador en curso | Instalación cancelada (M-21) | Cierra |
| M-02 `85:14` / `204:25071` | «Salir» con cambios sin guardar | Pantalla de origen (T-…) | Cierra |
| M-03 `85:26` | Cerrar con cambios | Guardar y salir | Cierra |
| M-04 `85:42` / `204:25084` | «Elegir <otro tema>» con cambios sin guardar | Tema elegido | Cierra |
| M-05 `85:54` / `204:25097` | «Aplicar» | Aplicado `203:10127` | Cierra |
| M-06 `85:66` | «Eliminar tema» | Paso 1 Tema | Cierra |
| M-07 `85:78` | «Eliminar» de un widget | Paso 4 Widgets | Cierra |
| M-08 `85:90` | Detalle de tarjeta o menú de tarjeta | Pantalla de origen | Cierra |
| M-09 `85:102` | Menú de columna (sin tarjetas) | Tablero Kanban | Cierra |
| M-10 `85:114` (+ resultado `2150:65511`) | Etiquetas | Etiquetas | Cierra |
| M-11 `85:126` | Configuración | Inicio de sesión | Cierra |
| M-12 `85:138` | Cerrar sesión con cambios sin sincronizar | Inicio de sesión | Cierra |
| M-13 `85:150` | Menú de columna (con tarjetas) | Tablero Kanban; mueve las tarjetas a «Por hacer» | Cierra |
| M-14 `85:162` | Etiquetas (etiqueta en uso) | Etiquetas | Cierra |
| M-15 `85:174` / `204:25136` | «Aplicar» con cambios | Aplicado | Cierra |
| M-16 `85:190`, M-17 `85:202` | Instalador existente | Reinstala / repara | Cierra |
| M-18 a M-21 | Instalador | Mensaje final | Cierra |

## 11. Lo no definido, limitaciones de Figma y supuestos

Todo esto se registra en `docs/DUDAS.md` con el valor neutro cuando se implemente; aquí queda el destino de cada uno.

1. **Saltos entre páginas sin enlace.** Figma rechaza `NAVIGATE` entre páginas, por eso no tienen enlace: «Iniciar sesión» y «Verificar correo» (hacia la aplicación), «Abrir Windgets» (hacia Inicio de sesión `66:4` / `66:83`), «Nueva contraseña» (hacia «Inicio de sesión · Contraseña actualizada» `2249:2560`). Se implementan por el contrato.
2. **«Instalación completada» sin salida**; **«Opciones · Sin espacio» sin entrada** (se alcanza solo con menos de 500 MB libres, INT-13) y su botón «Instalar» queda deshabilitado, sin enlace.
3. **M-11 / M-12 sin entrada** en Configuración y en Acceso para M-12: se abren por regla de datos, no por un botón.
4. **M-13 y M-14** se abren **en lugar de** M-09 / M-10 según los datos (columna con tarjetas, etiqueta en uso). Figma enlaza la versión sin datos; el cambio condicional se implementa por el contrato (T-140, `docs/interfaz.md`).
5. **«Eliminar» de M-08, M-09, M-10 vuelve a un solo destino** en Figma (`Planificador diario`, `Tablero Kanban`, `Etiquetas`); el contrato dice «pantalla de origen» (T-094, T-156). Se implementa como **volver al origen**.
6. **Supuestos del instalador:** M-18 a M-21 usan «320 MB» como tamaño y no tienen botones en M-18, M-19 y M-21.
7. **Barra de tareas oculta** en todos los marcos del escritorio salvo la notificación.
8. **Valores de tamaño y texto** no fijados en los CA: se usan los de la pestaña «Textos» de `rediseno_pendientes_prototipos.md` §14.
9. **Decisión f:** el Figma completo es la aplicación a construir. Lo que el Figma muestra y ningún CA define se implementa como está dibujado y se anota en `DUDAS.md`.

## 12. Cambios hechos en Figma en la tanda del lote 14

| Cambio | Detalle |
|---|---|
| 84 reacciones obsoletas quitadas en `79:5` | Apuntaban a destinos que ya no existen; se quitaron las reacciones, ningún marco se tocó |
| M-04 conectado | 8 marcos «Cambios sin guardar» abren M-04 desde «Ir · Elegir <otro tema>» |
| 20 marcos renombrados | Solo los que no cumplían «Flujo · Paso · Estado · Tema» |
| Fundamentos | 10 propuestas movidas a «Descartado» `2272:124512` |
| Planificador | 6 nodos ocultos movidos a «Descartado» `2273:153952`; `Overlay · M-09` (`204:25546`) restaurado tras un cambio por error |
| Instalador | «Sin espacio» → «Instalar» sin reacciones; «Cancelar» restaurado copiando de «Opciones» |
| Menú de tarjeta | «Eliminar tarjeta» → Overlay M-08 |
| Menú de columna predefinida | «Eliminar columna (deshabilitado)» → sin reacciones |

### 12.1 Correcciones visuales del 25-nov-2026 (capturas de Paula)

| Cambio | Detalle |
|---|---|
| Calendario por color | Sin íconos junto al número: el día se pinta verde (hechas), amarillo (por vencer) o rojo (vencidas) con las variables `relleno_/estado_<estado>`. Aplica al mini calendario, al mensual y a «Hoy», en los 4 temas. Decisión de Paula: «Solo color del día» |
| Detalle de tarjeta | «Tipo» y «Prioridad» muestran solo la opción elegida; el ícono de papelera pasa a 26 px dentro del botón de 44 px (8 marcos) |
| Nueva etiqueta / columna · Error | Ventana +16 px y contenido desplazado: el mensaje de error ya no pisa «Color» (24 marcos) |
| Rango personalizado · errores | Campos Desde/Hasta con el campo normal (ícono de calendario + fecha) y borde rojo en el campo con error; ya no muestran «Buscar» con lupa ni se salen de su caja (16 marcos) |
| Tablero Kanban vacío | «No hay tarjetas en esta columna» ajustado al ancho de la columna con 14 px de margen y centrado (16 marcos) |
| Kanban del Escritorio | Punto de color a 6 px, nombre a 15 px y cantidad a 6 px del borde de cada columna (3 temas); instancia «Contenido» desprendida para poder mover los hijos |
| Personalización › Widgets | Las papeleras de Reloj, Calendario, Tareas del día y Kanban pasan a estar activas (opacidad 1, sin «· deshabilitado»): todos los widgets se pueden eliminar. «Widget por defecto» queda solo como etiqueta informativa (144 nodos, 36 marcos) |

Pendiente de implementación: confirmar en `DUDAS.md` que «Widget por defecto» no restringe eliminar.

## 13. Marcos que no se implementan (sección «Descartado»)

| Página | Sección | Marcos |
|---|---|---|
| `0:1` | `2272:124512` | 10 propuestas de Fundamentos |
| `79:3` | `2273:153952` | 6 nodos: 4 «Reportes · Nombre emergente» y 2 «Navegación del calendario» |
| `79:5` | «Descartado» `2213:84270` | 56 marcos (14 familias × 4 temas): selectores «Datos» de Clima, Imagen estática, Carrusel, Animación y Texto; `Organizar widgets · Barra expandida`; `Agregar widget › Reloj / Calendario / Tareas del día / Kanban` y sus «Widgets · … agregado» |
| `79:6` | «Descartado» `2075:3647` | 4 marcos «Configuración · Mensaje emergente» (`2075:3035`, `2075:3140`, `2075:3245`, `2075:3350`) |

Nada se borró para siempre: todo se puede recuperar desde la sección.

## 14. Pendiente

- **Orden físico:** en Acceso (79:2) los marcos se reordenaron por flujo: una fila por pantalla (claro x=0, oscuro x=1200), cada pantalla base seguida de sus estados, flujos en el orden de la §4, 300 px entre flujos; la sección «Mensajes emergentes (PR-25)» pasó a x=2600, y=0. Las demás páginas ya estaban en columnas por tema y filas por flujo y no se tocaron. Las 436 reacciones de Acceso (420 nodos) se contaron antes y después: iguales.
- **Lote 13:** revisión de Rosa y Enfoque, «Lista final de revisión», pendientes §15, recaptura del violeta Secundario.
