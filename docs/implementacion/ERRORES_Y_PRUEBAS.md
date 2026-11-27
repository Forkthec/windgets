# Errores y pruebas: catálogo único, rutas al genérico y matriz CA → prueba

**Fecha:** 27-nov-2026 (hora colombiana) · **Estado:** BORRADOR local, sin aprobar, sin commit (solo Paula aprueba specs) · **Llegó hasta:** las 7 partes completas, con los 21 hallazgos del revisor aplicados (27-nov).
**Fuentes leídas:** `CONSISTENCIA.md` §6 (G1a-G18), D7, D10; `docs/contratos.md` secciones a y b (L139-362); `src-tauri/src/tipos/errores.rs` (101 entradas `serde(rename)`); `src/types/messages.es.json` (164 claves); las 8 `SPEC_*.md` (partes 8 de errores y tablas CA → prueba); `rediseno_plan_codigo.md` §1.
**Convención (S9, derivada: ver «Pendiente de Paula»):** cada código conserva la de su fuente: `a.b` en `contratos.md` y en el enum de Rust; MAYÚSCULAS en `messages.es.json` y en CONSISTENCIA; los nuevos, en MAYÚSCULAS. «PROPUESTA» = no existe en código ni en `contratos.md`. Los literales de `a.b` se copian de `contratos.md` con sus comillas « » tal cual.

---

## 1. Regla única

Copiada de CONSISTENCIA y de la regla de errores visibles de Paula. No se repiten D1-D17, G5, R11, P1-P4, Q1-Q3 ni S1-S18.

| # | Regla | Id de origen |
|---|---|---|
| 1 | Una **lectura** que falla muestra un **estado de error** con código estable (con «Reintentar» donde el Figma lo dibuja). Aunque su IPC diga «Errores: —», el transporte puede fallar: no se queda en silencio. | D10, «Regla global» de §6 de CONSISTENCIA, regla de la spec de Escritorio |
| 2 | Una **escritura o acción** que falla muestra un **aviso** (Error o Advertencia) con los tiempos de G5: Éxito e Información 4 s, Advertencia 6 s, **Error hasta cerrarlo**. | G5, RD-104 (`MensajeResultado.tsx` L17-28 ya lo cumple) |
| 3 | Los errores de **forma** de un formulario se devuelven **todos a la vez**, uno por campo, con el literal del CA cuando el CA lo define. | D10, RD-83 (cliente), regla de errores visibles |
| 4 | **Nada falla en silencio ni cae al genérico.** `internal.unexpected` («Ocurrió un error inesperado. Intenta de nuevo.», `messages.es.json:60`) es solo para lo que nadie pudo prever. Todo fallo previsible tiene excepción de negocio, código estable y mensaje en el campo que corresponde. | D10, RD-83, RD-104 |
| 5 | Una `Err` de transporte (Tauri rechaza la llamada) se convierte en `AppError` en `src/ipc/cliente.ts:17`; la UI nunca pinta `r.error.message` crudo: usa `textoDelError`. | RD-83 (hecho: `cliente.test.ts:16`) |
| 6 | Al revisar código: buscar las rutas que llegan al manejador genérico y comprobarlas con una **petición real** (comando IPC o paso de UI), no solo leyendo. La sección 3 las lista. | regla de errores visibles |
| 7 | Lo que pertenece a otra tarea se documenta con su destino (sección 6 y «Pendientes con destino»). | regla de errores visibles |

Estado de los defectos de `rediseno_plan_codigo.md` §1: **hechos** B-01 (`textoDelError` en uso, sin `.error.message` crudo), B-02 (`cliente.test.ts:16`), B-03 `column.not_found` (RD-84), B-04 `color.invalid` (RD-85), B-05 tema inexistente (`tema_no_existe`, RD-86), B-06 `palette.not_found` (RD-87, `servicio_de_personalizacion_y_configuracion.rs:741-753`), B-07 `auth.user_banned` (RD-88, `servicio_de_sesion.rs:252-267`), B-08 `session.expired` (RD-89, `puente_ipc.rs:843`). Sus pruebas: `pruebas_de_errores_visibles.rs` en `servicio_del_planificador/` y en `servicio_de_personalizacion_y_configuracion/` (commits 74fd9bf, 38726c9, 4d50cf3). **Sin verificar:** V-01 a V-03 (módulo `src/reglas/limites.ts` con prueba contra `sqlite_esquema.sql`, `ETIQUETAS_MAX` 5 vs 3, `validarTodo` en cada formulario).

## 2. Catálogo único de errores

**Cómo leerlo.** «Existe» da `contratos.md:línea` (código `a.b`) y, tras `/`, la clave de texto en `messages.es.json:línea` cuando la hay; «PROPUESTA» = no existe. «Superficie» = campo, estado de error, aviso Error/Advertencia o ventana M-nn. «Prueba»: **E** = existe, **N** = nueva (a escribir en la pieza de la spec). Los literales de `a.b` son los de `contratos.md`; los textos entre «<>» son parámetros.

**Correcciones a las specs (PROPUESTA que ya existe).**

| Spec | Dice PROPUESTA | Ya existe en |
|---|---|---|
| Planificador PL-xx | `time_block.past`, `time_block.after_due_date`, `card.not_found` | `contratos.md:169-177`; `errores.rs`; `TARJETA_NO_EXISTE` `messages.es.json:119`; `BLOQUE_YA_PASO` `:6` |
| Planificador PL-02 | `column.order_invalid` | `contratos.md:202` y `errores.rs:100`. Solo el texto «No pudimos reordenar las columnas. Intenta de nuevo.» es PROPUESTA |
| Cuenta AC-08 | `CODIGO_VENCIDO` al guardar la contraseña nueva | clave `messages.es.json:28` y código `code.expired` (`contratos.md:148`); `recuperacion.rs:65` ya mapea 401/403 a `CodeExpired`; IPC-AUTH-11 no lo lista como error: ampliar el contrato |
| Windi WI-xx | `labels.limit_reached` como nuevo | `label.limit_reached` ya existe (`contratos.md:190`, `errores.rs:94`); `labels.limit_reached` (`contratos.md:312`) es una errata del contrato: no se crea código ni entrada de enum (Pendientes con destino 2) |
| Marco MB-26 | `COLOR_INVALIDO` con otro texto | clave `messages.es.json:29` con el texto del contrato (ver Conflictos C-17) |
| Personalización PW-03 (G2) | `TEMA_NOMBRE_VACIO`, `TEMA_NOMBRE_REPETIDO`, `TEMA_NOMBRE_MUY_LARGO` | `name.required`, `name.duplicate`, `name.too_long` (`contratos.md:231`, `:236`): los tres ya los usan los temas. Si el CA pide otro literal para el campo vacío, es texto del campo, no un código (Pendientes con destino 3) |
| Cuenta / Marco | `IMAGEN_ILEGIBLE`, `CUENTA_BLOQUEADA`, `SESION_VENCIDA`, `DEMASIADOS_INTENTOS` como nuevos | `messages.es.json:74`, `:55`, `:106`, `:56` |

### 2.1 Cuenta y acceso (contratos a.1, L139-160)

| Código | Existe | Mensaje literal | Superficie | Specs y piezas | Prueba |
|---|---|---|---|---|---|
| `alias.required` / `alias.too_long` | `contratos.md:147` / `CAMPO_OBLIGATORIO :15`, `ALIAS_MUY_LARGO :2` | «Este campo es obligatorio.» / «El alias no puede superar los 30 caracteres.» | campo Alias (Registro) | Cuenta AC-04; Marco MB-11 | E `HE-01-HU01-CA01-04` |
| `email.required/invalid/too_long/already_registered` | `:147` / `CORREO_* :51-53` | «Este campo es obligatorio.» · «Diligencia un correo electrónico válido.» · «El correo electrónico no puede superar los 64 caracteres.» · «Este correo electrónico ya está registrado.» | campo Correo; píldora con enlace en `already_registered` | Cuenta AC-02..AC-06 | E |
| `password.required/invalid`, `password_confirmation.required/mismatch` | `:147` / `CONTRASENA_* :46-49` | «La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.» · «Las contraseñas no coinciden.» | campos Contraseña y Confirmación (los cuatro a la vez) | Cuenta AC-04, AC-08 | E |
| `password.same_as_current` | `:157` | «Elige una contraseña distinta de la actual.» | campo Contraseña nueva | Cuenta AC-08 | E |
| `code.required/incorrect/expired` | `:148` / `CODIGO_INCORRECTO :26`, `CODIGO_VENCIDO :28` | «El código no es correcto. Revísalo e intenta de nuevo.» · «El código venció. Solicita uno nuevo.» | campo Código | Cuenta AC-05, AC-07, AC-08 | E |
| `code.resend_too_soon` + `params.seconds` | `:149` / `REENVIO_EN_SEGUNDOS :102` | «Puedes pedir un nuevo código en <segundos restantes> s.» | texto junto a «Reenviar» | Cuenta AC-05, AC-07 | E |
| `auth.invalid_credentials` | `:151` / `CREDENCIALES_INCORRECTAS :54` | «Correo electrónico o contraseña incorrectos.» | píldora bajo el formulario | Cuenta AC-02 | E |
| `auth.user_banned` | `:151`; `servicio_de_sesion.rs:252-267` / `CUENTA_BLOQUEADA :55` | «Tu cuenta está bloqueada. Escríbenos para revisarla.» | píldora (inicio de sesión, Google) | Cuenta AC-02, AC-03 | E (RD-88) |
| `auth.rate_limited` | `:147` / `DEMASIADOS_INTENTOS :56` | «Demasiados intentos. Espera unos minutos e intenta de nuevo.» | píldora | Cuenta AC-02, AC-05, AC-07 | E |
| `auth.sign_out_failed` | `:160` / `NO_PUDIMOS_CERRAR_LA_SESION :96` | «No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.» | píldora Error (G1m `CIERRE_SESION_FALLIDO` es alias, C-2); si falla `auth_get_sign_out_info` no se abre M-11 y la sesión sigue (R05, regla ya decidida) | Cuenta AC-09 (`SPEC_Cuenta_y_Acceso.md:826/835/841`); Configuración HU03-CA07 (`SPEC_Configuracion.md:46/294/301`) | E `Settings.test.tsx:192`; N para `auth_get_sign_out_info` |
| `session.expired` | `contratos.md` §1.3; `puente_ipc.rs:843` / `SESION_VENCIDA :106` | texto de la clave | pantalla de inicio de sesión + aviso | Cuenta AC-10 (RD-89) | E |
| `net.offline` | `contratos.md` §1.3 y `:147` / `SIN_CONEXION_INICIO/REGISTRO/RECUPERAR :108-110` | «No hay conexión a internet. Conéctate para crear tu cuenta.» (y variantes) | píldora del formulario | Cuenta AC-02..AC-08 | E |
| `service.unavailable` | `:147` / `SERVICIO_NO_DISPONIBLE :104` | «No pudimos completar la operación. Intenta de nuevo más tarde.» | píldora / aviso Error | Cuenta (ver C-1) | E |
| `GOOGLE_CANCELADO`, `GOOGLE_ERROR`, `GOOGLE_CORREO_MUY_LARGO` | solo claves `:70`, `:72`, `:71` | texto de cada clave | píldora | Cuenta AC-03 | E |
| `NO_PUDIMOS_ABRIR_EL_NAVEGADOR` | clave `:94`; `browser.open_failed` `contratos.md:288` sin texto | texto de la clave | aviso Error | Cuenta AC-03 | E |
| `TEMA_INICIAL_NO_APLICADO` | `cuenta/textosDelRediseno.ts:49`, `temaInicial.ts:88` | texto de la clave | aviso Advertencia al iniciar | Cuenta AC-10 | N |

### 2.2 Planificador: tarjetas, columnas, etiquetas, reportes (a.2 a a.5, L161-219)

| Código | Existe | Texto vigente (fuente) | Superficie | Specs y piezas | Prueba |
|---|---|---|---|---|---|
| `title.required/too_long`, `description.too_long`, `due_date.required/invalid/in_past`, `labels.too_many` | `:168` / `CAMPO_OBLIGATORIO :15` | «El título no puede superar los 100 caracteres.» · «La descripción no puede superar los 1000 caracteres.» · «La fecha límite no puede ser anterior a hoy.» · «Diligencia una fecha válida.» · «Puedes asignar hasta 3 etiquetas.» | un error por campo (todos a la vez) | Planificador (formulario), Marco MB-11 | E (V-03 por verificar) |
| `column.not_found` | `:168` / `COLUMNA_NO_EXISTE :35` | «Esta columna ya no existe.» (`messages.es.json:35`; se eliminó en otro computador, RD-92). Si falta la columna `todo` porque la cuenta aún no se descargó (RD-84) el texto es «Aún no tenemos tu tablero. Conéctate para descargarlo e intenta de nuevo.» (clave `TABLERO_NO_DESCARGADO :112`): mismo código, dos causas, una clave por causa | aviso Error | Planificador | E `rd_84_…` |
| `card.not_found` | `:169` / `TARJETA_NO_EXISTE :119` | «Esta tarjeta ya no existe.» (`SPEC_Planificador.md:139`, `:146`) | aviso Información + refresco (`SPEC_Planificador.md:139-146`, `:536`; no es aviso Error) | Planificador; Escritorio | E |
| `time_block.past`, `time_block.after_due_date` | `:177` / `BLOQUE_YA_PASO :6` | «No puedes asignar tarjetas a un bloque horario que ya pasó.» · «No puedes programar la tarjeta después de su fecha límite.» | aviso Advertencia (Agenda) | Planificador (Agenda) | E |
| `limit.out_of_range` | `:183` sin texto | — | no llega a la UI (selector cerrado) | Planificador | N (definir texto o descartar) |
| `column.limit_reached`, `column.default_not_deletable`, `column.order_invalid` | existen los tres: `:200`, `:204`, `:202` y `errores.rs:100` | «Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.» · «Las columnas por defecto no se pueden eliminar.» · «No pudimos reordenar las columnas. Intenta de nuevo.» (solo este texto es PROPUESTA, `SPEC_Planificador.md:278`) | campo / aviso | Planificador PL-02 | E / N (texto de `order_invalid`) |
| `label.limit_reached`, `label.not_found`, `name.required/too_long/duplicate`, `color.required/invalid` | `:190-191` / `COLOR_INVALIDO :29`; `label.limit_reached` también en `errores.rs:94` | «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.» · «Esta etiqueta ya no existe.» · «El nombre de la etiqueta no puede superar los 30 caracteres.» · «Ya existe una etiqueta con ese nombre.» · `color.invalid`: «Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).» (`messages.es.json:29` y `SPEC_Personalizacion_y_widgets.md:797`; el texto de Marco MB-26, «Escribe un color con formato #RRGGBB.», `SPEC_Marco_y_componentes_base.md:752`, es PROPUESTA y pierde, C-17) | campo Nombre / Color | Planificador (Etiquetas) | E `rd_85_…` (color) |
| `range.invalid_date/start_after_end/too_long` | existen: `contratos.md:212`, `errores.rs:108-112` / `RANGO_MUY_LARGO :101`, `FECHA_INVALIDA :66`; `range.required` **no existe** en contrato, enum ni spec (`SPEC_Planificador.md:653-656`): se quita del catálogo | «La fecha de inicio no puede ser posterior a la fecha de fin.» · «El rango máximo es de un año.» · «Diligencia una fecha válida.» | campos Desde / Hasta, todos a la vez | Planificador (Reportes) | E |
| `REPORTE_NO_CARGA` (G1i) | PROPUESTA | «No se pudo cargar el reporte.» | estado de error con «Reintentar» | Planificador | N |
| `PLANIFICADOR_NO_CARGA`, `TABLERO_NO_CARGA`, `CALENDARIO_NO_CARGA`, `PANEL_DIA_NO_CARGA`, `PROXIMAS_NO_CARGAN`, `ETIQUETAS_NO_CARGAN` | PROPUESTA (PL-01, PL-03, PL-05, PL-07) | un texto por pantalla (en las specs) | estado de error de lectura con «Reintentar» | Planificador | N |
| `COLUMNA_NO_ELIMINADA`, `TARJETA_NO_ELIMINADA`, `ETIQUETA_NO_ELIMINADA`, `ARRASTRE_SIN_HORA`, `NOTIFICACIONES_BLOQUEADAS` | PROPUESTA | un texto cada uno (en las specs) | aviso Error / Advertencia | Planificador | N |

### 2.3 Personalización y widgets (a.6 a a.9, L220-272)

| Código | Existe | Mensaje literal | Superficie | Specs y piezas | Prueba |
|---|---|---|---|---|---|
| `theme.not_found`, `theme.already_applied`, `theme.applied_not_deletable`, `theme.limit_reached`, `theme.content_duplicate` | `:227-237` / `TEMA_* :121-130` | «Este tema ya no existe.» · «Este tema ya está aplicado.» · «No puedes eliminar el tema aplicado. Aplica otro tema primero.» · «Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.» · «Ya tienes el tema “<nombre del tema>” con estas mismas propiedades.» | aviso / M-nn de tema | PW-02..PW-06 | E (RD-86) |
| `draft.no_changes`, `draft.unsaved_changes`, `draft.unsaved_changes_on_apply` | `:227-232` | «No hay cambios para guardar.» · «Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?» | M-15 / M-02 | PW-06, PW-10 | E |
| `palette.not_found`, `font/image/template.not_found`, `background.already_default` | `:228` / `PALETA_NO_DISPONIBLE :99` | «Esta paleta ya no está disponible. Elige otra.» · «Esta plantilla ya muestra su imagen de fondo por defecto.» | aviso Error | PW-08, PW-09 | E (RD-87) |
| `image.format_not_allowed/too_large/unreadable`, `IMAGEN_DE_FONDO_NO_ENCONTRADA` | `:245` / `IMAGEN_ILEGIBLE :74`; la última solo clave `:73` | «Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.» · «La imagen supera el tamaño máximo de 20 MB.» · «No pudimos leer la imagen. Verifica que el archivo no esté dañado.» | aviso Error | PW-09, PW-12 | E / N |
| `widget.not_found`, `widget.already_added`, `widget.default_not_deletable` | `:254-257` / `WIDGET_* :133-138` | «Este widget ya no existe.» · «Ya agregaste este widget.» · «Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.» | aviso | PW-11..PW-13 | E |
| `carousel.too_few/too_many`, `interval.required/out_of_range`, `text.too_long`, `city.not_found/too_long/duplicate` | `:255` / `CIUDAD_* :19-22` | «Selecciona al menos 2 imágenes para el carrusel.» · «Puedes agregar máximo 10 imágenes al carrusel.» · «El intervalo debe estar entre 3 y 60 segundos.» · «El texto no puede superar los 200 caracteres.» · «No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.» · «Ya tienes un widget Clima para esa ciudad.» | campo del formulario del widget | PW-11..PW-13 | E |
| `layout.widget_missing` | `:270` | «Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.» | aviso Error (Edición) | PW-14; Escritorio | E |
| (G2 retirado) `name.required`, `name.duplicate`, `name.too_long` | `contratos.md:231`, `:236` | el contrato dice «Este campo es obligatorio.»; el CA de PW-03 pide «Escribe un nombre para el tema.» (`SPEC_Personalizacion_y_widgets.md:283`, `:311-313`): código `name.required`, literal del campo a decidir en el contrato | campo Nombre | PW-03 | N (literal del campo vacío) |
| `widget_opacity.invalid`, `widget_font_size.invalid`, `widget_format.invalid`, `widget_appearance.invalid`, `widget_shape.invalid`, `layout_preset.invalid`, `background_dim.invalid`, `background_blur.invalid` | PROPUESTA (ampliación de IPC-THEME-05) | un texto por código (en PW-12 y PW-13) | línea del control, no el genérico | PW-12, PW-13 | N |
| `WIDGETS_NO_CARGAN` (G1j), `ORGANIZAR_WIDGETS_FALLIDO` (G1q), `WALLPAPER_NO_SE_MUESTRA` (G1o) | PROPUESTA; hoy `NO_SE_PUDO_MOSTRAR_EL_WALLPAPER :98` | texto de G1j / G1q / G1o | estado de error / aviso | PW, Marco | N (ver C-8) |

### 2.4 Escritorio, capa y sistema (a.10 y a.11, L273-308)

| Código | Existe | Mensaje literal | Superficie | Specs y piezas | Prueba |
|---|---|---|---|---|---|
| `autostart.failed` | `:290` / `NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO :95` | «No pudimos cambiar el inicio automático. Intenta de nuevo.» | aviso Error (el interruptor vuelve) | Configuración HU02-CA05 (`INICIO_AUTOMATICO_FALLIDO`, G1l) | E `Settings.test.tsx:182` |
| `browser.open_failed`, `url.not_allowed` | `:288` sin texto / `NO_PUDIMOS_ABRIR_EL_NAVEGADOR :94` | texto de la clave | aviso Error | Escritorio, Cuenta | E (clave) / N (`ENLACE_NO_PERMITIDO`) |
| `monitor.not_found`, `monitor.not_configurable` | `:296` / `MONITOR_* :87-88` | «Ese monitor ya no está conectado. Elige otro monitor.» · «Puedes ajustar el fondo de hasta 6 monitores. Los demás usan el ajuste del monitor principal.» | aviso | PW-09 | E |
| `media.no_session`, `media.action_unsupported` | `:303-304` | «No hay música en reproducción.» · (sin texto) | estado del reproductor | Escritorio | E / N |
| `ESCRITORIO_NO_CARGA`, `WIDGET_NO_CARGA` | PROPUESTA (EC-01, EC-02) | texto en la spec | aviso Error / estado dentro del widget | Escritorio | N |
| `ZONA_HORARIA_NO_DISPONIBLE` | PROPUESTA (S2) | texto en la spec | estado en el Reloj | Escritorio | N |
| `CLIMA_NO_CARGA` (G1k), `NOTICIAS_NO_CARGAN` (G1n) | PROPUESTA; claves hoy `CLIMA_NO_DISPONIBLE :23`, `NOTICIAS_NO_DISPONIBLES :92` | texto de G1k / G1n | estado de error en el widget | Escritorio, PW | N (ver C-9) |
| `SINCRONIZACION_FALLIDA` (G1f), `SIN_CONEXION` (G1g) | PROPUESTA / clave usada solo en `WidgetClima.tsx` y `WidgetNoticias.tsx` | «Error de sincronización · N pendientes» (Figma) | indicador de sincronización | Marco, Configuración HU01-CA05 | N |
| `PREFERENCIA_MENU_NO_GUARDADA`, `PERFIL_NO_DISPONIBLE` | PROPUESTA (MB-xx) | texto en la spec | aviso Error / estado del menú | Marco | N |
| `COLOR_OBLIGATORIO`, `FECHA_FUERA_DE_RANGO`, `<CAMPO>_OBLIGATORIO`, `<CAMPO>_INVALIDO`, `<CAMPO>_MUY_LARGO` | PROPUESTA (MB-11, patrón) | «El valor no tiene un formato válido.» si el CA no define texto | campo | Marco MB-11 | N |

### 2.5 Windi (a.12, L309-316)

Dos nombres por caso y no se mezclan: el **código de contrato** (`a.b`, lo que devuelve el Núcleo, `contratos.md:312-313`) y la **clave de texto** (la de G1, que nombra el literal en pantalla; `SPEC_Windi.md:190-201`). Versión resuelta (la de `SPEC_Windi.md:124`: «se usa el nombre de G1e; la clave actual `MENSAJE_MUY_LARGO` se renombra»):

| Caso | Código de contrato | Clave de texto (G1) y clave actual | Texto vigente | Dónde | Prueba |
|---|---|---|---|---|---|
| Más de 2000 caracteres | `message.too_long` (`contratos.md:312`) | `WINDI_MENSAJE_MUY_LARGO` (G1e); hoy `MENSAJE_MUY_LARGO :86`, no se renombra: G1e es alias (S19; `Windi.tsx:246`) | «Tu mensaje no puede superar los 2000 caracteres.» | campo; Enviar deshabilitado | E (WI-02) |
| Sin conexión al enviar, o se pierde a mitad de respuesta | `net.offline` | `WINDI_SIN_CONEXION` (G1c); `:158` | «El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.» | mensaje de Windi; sin «Reintentar» | E |
| No responde en 15 s, cuota o error del servicio | `windi.unavailable` | `WINDI_SIN_RESPUESTA` (G1b); hoy `WINDI_NO_DISPONIBLE :152`, mismo texto: gana la clave existente, G1b es alias (S19) | «No pude responder en este momento. Intenta de nuevo.» | mensaje de Windi; «Reintentar» reenvía | E |
| Cualquier otro error al enviar, confirmar o rechazar | (otro) | `WINDI_ERROR_INTERNO` (G1a); PROPUESTA | «Windi tuvo un problema. Tus tarjetas no cambiaron. Intenta de nuevo.» | mensaje de Windi; la propuesta sigue pendiente | N |
| Sin conexión al confirmar o rechazar | `net.offline` | `WINDI_CONEXION_PERDIDA` (G1d); hoy `WINDI_SIN_CONEXION_AL_CONFIRMAR :159`: mismo caso: gana la clave existente, G1d es alias (S19; `Windi.tsx:188`) | «Se perdió la conexión. No se hizo ningún cambio.» | mensaje de Windi | E |
| No se pudo aplicar | `windi.apply_failed` | sin clave G1; `WINDI_NO_PUDE_APLICAR :153` | «No pude aplicar los cambios. No se hizo ningún cambio.» | mensaje de Windi; Confirmar y Rechazar siguen habilitados | E |
| Propuesta descartada | `proposal.discarded` | sin clave | (sin texto) | la propuesta se marca; sin mensaje de error | E |
| Búsqueda sin resultado | `windi.card_not_found`, `windi.column_not_found`, `windi.label_not_found`, `windi.color_not_found`, `windi.label_color_required`, `windi.already_in_column`, `windi.same_value` (`:312`) | — | «No encuentro una tarjeta llamada “<nombre>”. ¿Me das más detalles?» y los demás de `contratos.md:312` | respuesta de Windi | E |
| Límite de etiquetas al proponer | `label.limit_reached` (existe, `contratos.md:190`, `errores.rs:94`); `contratos.md:312` escribe `labels.limit_reached`: errata (Pendientes con destino 2) | — | «Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.» | respuesta de Windi | N |

Lo que cambia respecto a la primera versión: C-5, C-6 y C-7 dejan de ser conflictos de código (son nombre de contrato frente a clave de texto) y se resuelven por S19: gana el nombre del código y G1b, G1d y G1e son alias; `SPEC_Windi.md:124` ya está corregida.

### 2.6 Instalador y web (fuera de `contratos.md`)

| Código | Existe | Mensaje literal | Superficie | Specs y piezas | Prueba |
|---|---|---|---|---|---|
| `EQUIPO_NO_COMPATIBLE`, `SIN_ESPACIO_EN_DISCO`, `INSTALADOR_DANADO` | PROPUESTA (el caso existe: `interfaz.py:802`, `:788`, `:504`) | los de CD-02 | pantalla del instalador | IN-01, IN-06 | E (caso) / N (código) |
| `ESPACIO_NO_MEDIBLE`, `ABRIR_APLICACION_FALLIDO`, `REVERSION_FALLIDA` (salida 4) | PROPUESTA | texto en la spec | pantalla / salida del instalador | IN-01, IN-03, IN-04 | N |
| `INSTALACION_FALLIDA` (G1p) | PROPUESTA; caso existe (`instalador.ps1:151`) | texto de G1p | pantalla del instalador | IN-07 | E (caso) |
| `DESCARGA_SIN_CONEXION`, `DESCARGA_NO_DISPONIBLE`, `INSTALADOR_NO_PUBLICADO` (alias) | PROPUESTA (WE-01); caso existe (`CD-01-HU02.spec.ts:67`, `:84`) | aviso de descarga fallida | aviso en la landing; botón habilitado | WE-01 | E (caso) / N (separar causas) |

### 2.7 Resumen de conteo

- **Enum `errores.rs`:** `grep -c 'serde(rename' apps/desktop/src-tauri/src/tipos/errores.rs` = **101** entradas: 98 son códigos de error (96 de `contratos.md` más `internal.unexpected` y `session.expired`) y 3 son renombres de otro tipo (`C`, `E`, `P`).
- **`contratos.md` L139-362:** `sed -n '139,362p' docs/contratos.md | grep -o '`[a-z_]*\.[a-z_]*`' | sort -u | wc -l` = **101** coincidencias; 4 no son códigos (`catalog_meta.version`, `interfaz.md`, `rediseno.md`, `params.seconds`), así que hay **97 códigos `a.b`**; 96 están en el enum y falta uno: `labels.limit_reached`, que es una errata del contrato (la regla ya existe como `label.limit_reached`), no un código por añadir.
- **Claves de texto:** `grep -o '"[A-Z_0-9]*":' apps/desktop/src/types/messages.es.json | wc -l` = **164**.
- **PROPUESTA: 58 códigos**, suma de la sección 6: G1 18 + pantallas 6 + Planificador 8 + Escritorio 3 + Marco 4 (2 son patrones) + Instalador 9 + Personalización `*.invalid` 8 + nuevos de esta revisión 2 (`IMAGEN_NO_GUARDADA`, `SESION_NO_GUARDADA`). Ya no cuentan los 3 de G2 (se usan `name.*`) ni `labels.limit_reached`. Cuántos son alias de algo existente depende de C-1 a C-11 y de la decisión de Paula sobre S9 (no se da una cifra hasta que se decida).

---

## 3. Rutas al genérico o en silencio en el código

Líneas verificadas el 27-nov sobre la rama `paso-44-componentes-base`. «Petición real» = lo que hay que ejecutar para confirmar el hallazgo (comando IPC con `invoke`, o paso de UI). Los tests de pantalla mockean el IPC: `ipc/simulado.ts` no tiene gancho de fallo y `mockRejectedValue` solo se usa hoy en `ipc/cliente.test.ts`, así que la petición ejecutable de las rutas de interfaz es un `mockRejectedValue` / `ok:false` en el test del componente. **Corregir** = incumple la regla única; **Aceptada** = no previsible o sin superficie para la persona (se argumenta); **Retirada** = falso positivo comprobado.

### 3.1 Interfaz (lecturas y escrituras que no se ven)

| # | Archivo:línea | Qué pasa hoy | Código que corresponde | Petición real | Clase |
|---|---|---|---|---|---|
| R01 | `apps/desktop/src/screens/windi/Windi.tsx:71-77` (`leer`) | `label_list` falla y no se dice nada | `WINDI_ERROR_INTERNO` o aviso `OPERACION_FALLIDA` | simular que `label_list` devuelve `ok:false` y abrir el panel de Windi | Corregir |
| R02 | `Windi.tsx:76` | `windi_get_conversation` con `!r.ok` hace `return`; el panel queda con `aria-busy` | estado de error de lectura (G1a) con «Reintentar» | `windi_get_conversation` falla al abrir el panel | Corregir |
| R03 | `Windi.tsx:119-122` | todo error distinto de `net.offline` va a `setFallido`: G1a (otro error), G1b (`windi.unavailable`) y G1d (sin conexión al confirmar o rechazar) se muestran igual | G1a `WINDI_ERROR_INTERNO`, G1b `WINDI_SIN_RESPUESTA`; G1d solo al confirmar o rechazar (tabla 2.5) | enviar un mensaje con `windi.unavailable` y con `internal.unexpected` | Corregir |
| R04 | `Windi.tsx:146` (confirmar: `r.error.message || WINDI_NO_PUDE_APLICAR`) y `:159` (rechazar: `textoDelError`) | dos caminos distintos para el mismo fallo; el criterio es la tabla de `SPEC_Windi.md:190-201`: `windi.apply_failed` → «No pude aplicar los cambios…»; `proposal.discarded` → marca sin texto; `net.offline` → G1d; otro → G1a | los dos botones pasan por una sola función código → clave de la tabla 2.5 | confirmar y rechazar con la propuesta ya descartada, con `windi.apply_failed` y con `internal.unexpected` | Corregir |
| R05 | `apps/desktop/src/screens/settings/CerrarSesion.tsx:29-32` (`pedirCierre`) y `puente_ipc.rs:2706-2717` (`auth_get_sign_out_info` llega como `InternalUnexpected` con mensaje vacío) | si `auth_get_sign_out_info` falla, abre M-11 sin avisar (`r.ok && … ? 'M-12' : 'M-11'`) y puede ocultar cambios pendientes. **Regla ya decidida** (`SPEC_Cuenta_y_Acceso.md:826/835/841`, `SPEC_Configuracion.md:46/294/301`): píldora Error con el literal de G1m (`CIERRE_SESION_FALLIDO` → clave `NO_PUDIMOS_CERRAR_LA_SESION`), no se abre M-11 sin datos y la sesión sigue | `auth.sign_out_failed` con la clave existente (C-2) | pulsar «Cerrar sesión» con `auth_get_sign_out_info` rechazado y, en la base, `pending_count > 0` | Corregir |
| R06 | `apps/desktop/src/screens/settings/Settings.tsx:27` | `autostart_get` solo trata `r.ok`; el contrato dice que no falla, pero el transporte sí | aviso Error `INICIO_AUTOMATICO_FALLIDO` | abrir Configuración con `autostart_get` rechazado | Corregir (texto PROPUESTA) |
| R07 | `apps/desktop/src/capa/Capa.tsx:146` | `layer_get_initial_state` con `if (!r.ok) return;`: capa vacía | `ESCRITORIO_NO_CARGA` (EC-01) | abrir la capa con ese comando rechazado | Corregir |
| R08 | `capa/WidgetAnimacion.tsx:25`, `WidgetCarrusel.tsx:25`, `WidgetImagen.tsx:30` | `widget_list` con `if (!lista.ok) return;` | `WIDGET_NO_CARGA` dentro del widget | cada widget con `widget_list` rechazado | Corregir |
| R09 | `apps/desktop/src/screens/tarjeta/FormularioTarjeta.tsx:183-190` (`leerEtiquetas` y el `useEffect` sin rama de error) y `:200` (`if (!r.ok) return;`, RD-92) | `label_list` falla y el formulario sale sin etiquetas, sin aviso | `ETIQUETAS_NO_CARGAN` | abrir «Nueva tarjeta» con `label_list` rechazado | Corregir |
| R10 | `apps/desktop/src/ui/tema/temaAplicado.ts:61` | `theme_get_applied` con `if (!r.ok) return;`: queda el tema por defecto sin decirlo | `TEMA_INICIAL_NO_APLICADO` (ya existe como texto) | arrancar con `theme_get_applied` rechazado | Corregir |
| R11 | `screens/personalization/Personalization.tsx:303`, `widgets/AgregarCarrusel.tsx:68`, `widgets/AgregarImagenEstatica.tsx:38` | el `catch` del selector de archivos vuelve sin mensaje | `IMAGEN_ILEGIBLE` o `OPERACION_FALLIDA` | elegir un archivo que el selector rechaza | Corregir |
| R12 | `screens/sign_in/SignIn.tsx:50`, `screens/register/Register.tsx:72`, `screens/register/VerificarCorreo.tsx:61`, `screens/recovery/Recovery.tsx:47`, `screens/recovery/DiligenciarCodigo.tsx:69`, `screens/recovery/NuevaContrasena.tsx:62`, `screens/cuenta/google.tsx:65` | cuando el error no trae mensaje se muestra `ERROR_INESPERADO` (`error.message || ERROR_INESPERADO`) | el código del Núcleo ya trae su texto; revisar que ningún código previsible llegue vacío | en cada componente, test con `mockRejectedValue` / `ok:false` con `internal.unexpected` y con `service.unavailable` (`simulado.ts` no tiene gancho de fallo) | Corregir (revisar) |
| R13 | `screens/tarjeta/FormularioTarjeta.tsx:285`, `screens/widgets/Widgets.tsx:58` | caen a `SERVICIO_NO_DISPONIBLE` cuando no hay texto | texto por código; gana `service.unavailable` / `SERVICIO_NO_DISPONIBLE` (C-1, S19) | guardar tarjeta / cambiar widget con error sin mensaje | Corregir |

### 3.2 Núcleo (Rust)

| # | Archivo:línea | Qué pasa hoy | Código que corresponde | Petición real | Clase |
|---|---|---|---|---|---|
| R14 | `src-tauri/src/servicio_de_sesion.rs:370` | `let _ = self.almacen.guardar(&guardada)`: si no se persiste el token, la sesión parece guardada | `SESION_NO_GUARDADA` (PROPUESTA) o `service.unavailable` | `auth_sign_in` con el almacén en solo lectura | Corregir |
| R15 | `servicio_de_sesion.rs:344` | **Retirada.** Es el `borrar()` de `sesion_vigente` cuando la renovación falla y devuelve `SesionVencida`. El cierre de sesión (`:612-614`) ya devuelve `AuthSignOutFailed` con `NO_PUDIMOS_CERRAR_LA_SESION` y `CerrarSesion.tsx:40-43` lo muestra | — | — | Retirada |
| R16 | `servicio_de_sesion.rs:556` y `servicio_de_sesion/recuperacion.rs:66` | `_ => inesperado()` ante un rechazo de Supabase no reconocido. Los rechazos previsibles ya tienen rama (credenciales, bloqueo, límite, código vencido o incorrecto, sin conexión); lo que cae aquí es una respuesta nueva del proveedor que nadie pudo prever | — | — | Aceptada (no previsible) |
| R17 | `servicio_del_planificador.rs:1312-1317` | fecha inválida u hora > 23 da `inesperado()`: un cliente distinto de la UI recibe el genérico aunque el caso es previsible | `due_date.invalid` (fecha) y `time_block.*` (hora) | `card_create` con fecha `2026-13-40` y con hora 24 desde un cliente que no sea la UI | Corregir |
| R18 | `servicio_del_planificador.rs:165` (`de_sqlx`) | error de base de datos sin regla propia (disco, bloqueo, corrupción) pasa a `inesperado()`. Las violaciones previsibles (límites, duplicados, claves) tienen su rama antes; el resto es un fallo de infraestructura que nadie pudo prever | — | — | Aceptada (no previsible) |
| R19 | `servicio_de_personalizacion_y_configuracion.rs:723` y `agregar.rs:545-548` (`_ => return Err(inesperado())`) | `.ok_or_else(inesperado)` sobre `borrador.vista()`: `theme_get_draft` sin borrador da el genérico aunque es previsible | `draft.*` con código estable (p. ej. `draft.no_changes`) y texto | `theme_get_draft` sin borrador abierto; `agregar` con un tipo de widget no admitido | Corregir |
| R20 | `src-tauri/src/servicio_de_personalizacion_y_configuracion/imagenes.rs:165`, `:167`, `:195` | disco lleno, sin permisos o tamaño no convertible dan `inesperado()` | `IMAGEN_NO_GUARDADA` (PROPUESTA) | quitar el permiso de escritura de la carpeta de datos y subir una imagen | Corregir |
| R21 | `servicio_de_windi/manejador.rs` (`:77`, `:297`, `:458`, `:495`) y `servicio_de_windi.rs:211` | muchos `inesperado()`; `:290`, `:448`, `:486` los convierten en `no_pude_aplicar()` | `WINDI_ERROR_INTERNO` (G1a) | `windi_send_message` con la herramienta de Gemini devolviendo JSON roto | Corregir |
| R22 | `puente_ipc.rs:416` y `:461` (`avisar_personalizacion`, `avisar_imagenes_descargadas`) | `usuario(...).unwrap_or_default()`: id vacío sin sesión. Son funciones de aviso en segundo plano, no comandos IPC; la persona no ve nada (el aviso no se emite) | `session.expired` ya lo devuelven los comandos | invocar un comando sin sesión | Aceptada (sin superficie) |
| R23 | `puente_ipc.rs:1434`, `:1489` (`actualizar_widgets_de_clima`, `actualizar_widgets_de_noticias`) | `.ok().flatten()` sobre `ultima_consulta` en la tarea de refresco: si falla se trata como «sin consulta previa» y se vuelve a pedir. No es el comando `weather_get`; la persona sigue viendo el último dato | — (el error de lectura del widget es `CLIMA_NO_CARGA` / `NOTICIAS_NO_CARGAN`, ya listados) | arrancar con la base de consultas ilegible | Aceptada (sin superficie) |
| R24 | `puente_ipc.rs:1560` (`vigilar_carga`) | `.unwrap_or_default()` sobre `widgets(...)`: lista vacía, la vigilancia de la animación no actúa; es una tarea de fondo, no `widget_list` (cuyo fallo cubre R08) | — | `vigilar_carga` con la base cerrada | Aceptada (sin superficie) |
| R25 | `puente_ipc.rs:2798` | `current_exe().unwrap_or_default()`: si el sistema no da la ruta, la clave Run recibe un comando vacío y el interruptor puede quedar activado sin que la aplicación arranque al iniciar sesión | `autostart.failed` | `autostart_set` cuando no se lee la ruta | Corregir |
| R26 | `integracion_con_el_sistema/inicio_automatico.rs:64`, `:66`; `navegador.rs:118`, `:127` | **Retirada.** En `inicio_automatico.rs` el `let _ =` se compara después con `estado(registro)` y, si no coincide, devuelve `AutostartFailed` con texto (`:69-76`); en `navegador.rs:118` y `:127` los `let _ =` están dentro de pruebas (`#[test]`) | — | — | Retirada |

### 3.3 Instalador y landing

| # | Archivo:línea | Qué pasa hoy | Código que corresponde | Petición real | Clase |
|---|---|---|---|---|---|
| R27 | `installer/installer.nsi:473-518` (`Revertir`) | sin `IfErrors`; `PuntoDeCancelacion` muestra M-21 aunque la reversión falle | `REVERSION_FALLIDA` (salida 4) | `pruebas/instalador.ps1` con un archivo bloqueado a mitad de instalación | Corregir |
| R28 | `installer.nsi:452-457` (`AbrirWindgets`) | `nsis_tauri_utils::RunAsUser` sin leer el resultado: el instalador se cierra aunque no abra | `ABRIR_APLICACION_FALLIDO` | instalar con `/S` y quitar el ejecutable antes de «Abrir Windgets» | Corregir |
| R29 | `installer.nsi:266-268` (`MedirEspacio`) | `DriveSpace` vacío se compara como 0 | `ESPACIO_NO_MEDIBLE` (con opción de continuar) | instalar en una unidad de red | Corregir |
| R30 | `apps/landing/src/descarga.ts:19-29` (`instaladorDisponible`) | `false` tanto con la red caída (`catch` en :27) como con `!respuesta.ok` | `DESCARGA_SIN_CONEXION` / `DESCARGA_NO_DISPONIBLE` | Playwright con la ruta del instalador en 404 y con la red caída | Corregir |
| R31 | `apps/desktop/src/ipc/cliente.ts:8-22` | todo rechazo de transporte (pánico, permiso, comando ausente) se vuelve `internal.unexpected`. Es el genérico correcto para lo que nadie pudo prever; lo que importa es que la pantalla lo muestre (R01-R13). La prueba existe: `ipc/cliente.test.ts:16` | — | `invoke` rechazado con una cadena | Aceptada (la prueba existe) |
| R32 | `apps/desktop/src/ui/MensajeResultado/MensajeResultado.tsx:44-55` (`tipoDelTexto`) y `:133` (`tipo ?? tipoDelTexto(texto)`) | si quien llama no pasa `tipo`, el tipo se infiere del prefijo del texto y por defecto es `'exito'`: un error sin prefijo se pinta como Éxito y se cierra a los 4 s, y se rompe G5 (Error hasta cerrarlo) | cada llamada de error pasa `tipo: 'error'` (o `'advertencia'`); el prefijo queda solo como respaldo | buscar las llamadas a `mostrar(` en `apps/desktop/src` y provocar un error cuyo texto no lleve el prefijo; prueba en `MensajeResultado.test.tsx` | Corregir |

**Códigos nuevos que salen de esta sección** (PROPUESTA, suman al catálogo): `SESION_NO_GUARDADA` (R14) e `IMAGEN_NO_GUARDADA` (R20); ya están contados en 2.7 (58).

**Totales:** 32 rutas; 24 por corregir (R01-R14, R17, R19, R20, R21, R25, R27-R30, R32), 6 aceptadas con argumento (R16, R18, R22, R23, R24, R31) y 2 retiradas por falso positivo (R15, R26). Rutas benignas que no se listan: `ipc/archivos.ts:7` (`urlDeArchivo` devuelve la ruta), `cuenta/apariencia.tsx:17/:26/:49` (respaldo en `localStorage`), `ipc/simulado.ts:120/:160/:694` (solo el simulador), `let _ = ventana.show()` y `let _ = params` de `puente_ipc.rs`, `imagenes.rs:172` (`remove_file` de limpieza).

---

## 4. Pruebas por tipo

Regla común: **una prueba por CA**, ejecutada y en verde antes de cerrar. Lo que es texto o lógica se prueba con Vitest o `cargo test`; la geometría, con Playwright. Mientras se construye, solo las del módulo tocado; al cerrar el CM, `clean verify`/suite completa una vez sobre la punta.

| Tipo | Dónde vive | Convención de nombre | Qué cubre | Cómo se corre |
|---|---|---|---|---|
| **Vitest** | junto al componente, `apps/desktop/src/**/*.test.ts(x)` (95 archivos con CA) | `it('HE-06-HU08-CA01 · …')`; reglas transversales `RT-01-CA12 ·`; rediseño `RD-83 ·`, `RD-97 ·` (ej. `capa/AbrirPantalla.test.tsx:109`, `ipc/cliente.test.ts:16`) | texto literal de cada error por campo, estados (cargando, vacío, error, sin conexión), foco, `role`, tiempos de aviso con `useFakeTimers` | `pnpm --filter desktop test` (`vitest run`) |
| **`cargo test`** | `apps/desktop/src-tauri/src/**` | `fn ca_he_NN_huNN_caNN_…` (556 hoy, ej. `cliente_de_supabase.rs:827`, `controlador_multimedia.rs:100`); rediseño `fn rd_84_…`, `rd_85_…` en `pruebas_de_errores_visibles.rs` | códigos de negocio, ramas de error del Núcleo, migraciones, que cada fallo previsible no sea `internal.unexpected` | `cargo test --locked --manifest-path apps/desktop/src-tauri/Cargo.toml` (CI: `ci.yml:57`; exporta los tipos con ts-rs) |
| **Playwright, escritorio** | `apps/desktop/e2e/*.spec.ts` y `e2e/pantallas/` | archivo por HU (`HE-09-HU02.spec.ts`, `RT-01.spec.ts`) o por tema (`rediseno-marco.spec.ts`, `rediseno-botones`, `rediseno-widgets`, `rediseno-cuenta`, `rediseno-nombres`, `cuentas`) | geometría con `boundingBox` + `toBeCloseTo`, estilo calculado, foco por teclado, consola sin errores | `pnpm --filter desktop test:e2e` (`playwright test --pass-with-no-tests`) |
| **Playwright, landing** | `apps/landing/e2e/` | `CD-01-HU01.spec.ts`, `CD-01-HU02.spec.ts`, `carga`, `movimiento`, ayudante `navegador.ts` | textos y botón de descarga, avisos de dispositivo, descarga fallida con botón habilitado | CI `ci.yml` (`pnpm --filter landing exec playwright install …`) |
| **Instalador** | `installer/pruebas/instalador.ps1` (modo silencioso `/S`: archivos, registro, códigos de salida) y `installer/pruebas/interfaz.py` (pantallas) | casos nombrados `CD-02-HU0n-CAnn` | CD-02-HU01 a HU03; lo que no se automatiza va a mano en una VM | `.github/workflows/instalador.yml` |
| **SQL** | `docs/pruebas/` (`pruebas.sql`, `pruebas_etiquetas_por_tarjeta.sql`, `prueba_sqlite.py`, `ejecutar_pruebas.sh`) | un archivo por tema | restricciones y migraciones; V-01 (largos de columna del dominio) se vigila con una prueba que lea `sqlite_esquema.sql` | skill `verificar` |
| **Geometría ±2 px** | Playwright de escritorio | `boundingBox` contra la «Tabla de geometría» de cada spec | **Ventana principal:** 1200×800 y 960×600 (mínimo de RT-01, D15). Marco: `marco-barra` 176/56, `marco-principal`, `marco-tarjeta`; spec Marco parte 10 y L805. Hoy solo `rediseno-marco.spec.ts` | `test:e2e` |
| **Escala de capa 100/125/150 %** | Playwright con `deviceScaleFactor` y `aEscala` (`Capa.tsx`) | `capa-escala-<N>` | **La capa ocupa el monitor completo**: no se prueba a 1200×800 sino por escala (C-8 de Escritorio). Hoy **falta** (tabla CA → prueba de Escritorio) | `test:e2e` |
| **Tokens por tema** | `src/ui/tema/tokens.test.ts`, `derivar.test.ts`, `tokens_por_defecto.test.ts`, `botones.test.ts`, `temasDeWindgets.test.tsx` | por archivo | los cuatro temas contra la tabla de `TEMAS_Y_TOKENS.md` §1, contrastes de §6 (fórmula de luminancia relativa, umbral de la spec), regla de morado y cian | Vitest |
| **Animaciones A-01 a A-38** | `ANIMACIONES.md` §7 (L239-330) | prueba global estática `src/ui/tema/movimiento.test.ts` (nueva): sin `transition: all`, tope 400 ms, valores desde tokens `--dur-*` y `--ease-*`, sin animar propiedades de layout, bloque `prefers-reduced-motion`, sin `scroll-behavior`; prueba en vivo `e2e/ANIMACIONES.spec.ts` (nueva) con `emulateMedia({ reducedMotion })` y viewports 1200×800 y 960×600 | A-nn por fila de la tabla (`Windi.test.tsx`, `Edicion.test.tsx`, `Calendario.test.tsx`, `Esqueleto.test.tsx`, …) | Vitest + Playwright |
| **CI** | `.github/workflows/{ci,instalador,keepalive,release}.yml` | — | `ci.yml` corre `cargo test`, Vitest, Playwright de la landing y SQL | — |

**Pruebas de errores (las que exige la sección 1).** Por cada código del catálogo con `E` o `N`: (a) **Rust**, el comando devuelve el código y no `internal.unexpected` (`pruebas_de_errores_visibles.rs`); (b) **Vitest**, la pantalla pinta el literal en la superficie de la columna 4, con `role` correcto y, en formularios, un error por campo a la vez; (c) para cada ruta por corregir de la sección 3, una prueba que simule el rechazo (`mockRejectedValue` o `ok:false` en el test del componente; `ipc/simulado.ts` no tiene gancho de fallo y habría que añadirlo) y compruebe que el estado de error o el aviso aparecen. Los avisos de Error no se cierran solo; los de Éxito y Advertencia, a 4 s y 6 s (`MensajeResultado.test.tsx`).

---

## 5. Matriz CA → prueba consolidada

Fuente: las tablas «CA → prueba» y las partes 10 de cada spec. «Existe» = ya tiene prueba con archivo:línea; «Nueva» = prueba a escribir; «PROPUESTA» = CA derivado aún sin aprobar.

| Spec | Existe (archivo:línea) | Nueva | PROPUESTA / sin prueba hoy |
|---|---|---|---|
| **Configuración** (L444) | HE-16-HU02-CA01..05 `Settings.test.tsx:142, :153, :161, :172, :182`; HU03-CA01..05 `:59-95`; HU03-CA06 `motor_de_sincronizacion/cancelacion.rs:106`; HU03-CA07 `Settings.test.tsx:192`; G5 `MensajeResultado.test.tsx`; HU01-CA01..05 `IndicadorSincronizacion.test.tsx` | MB-22 (foco vuelve a «Cerrar sesión», CF-04) | CA-D1 a CA-D6 (densidad, CF-02): 6 CA derivados, destino HE-16 |
| **Cuenta y acceso** (L948-969) | RD-89 (`session.expired` y EV-01); la tabla asigna una prueba a cada CA, pero solo RD-89 cita archivo | HE-01-HU01..HU08 (CA01..CA12 por HU) y HE-16-HU03-CA01..07 por pieza AC-02..AC-09; hay que fijar archivo:línea de las que ya existen | ninguno declarado sin prueba (`SPEC_Cuenta_y_Acceso.md:948-969`); 11 de 12 filas sin archivo:línea |
| **Escritorio y capa** (L320) | HE-02-HU01-CA01..05 `Capa.test.tsx:56, :65, :73, :83`; HE-05-HU02-CA05 `:184, :197`; HE-05-HU04-CA05 `:209`; HE-04-HU03 `Reloj.test.tsx:42-78`; HE-06-HU01 `Seleccion.test.tsx:71, :86`; HE-06-HU05/06 `WidgetKanban.test.tsx:135-308`; HE-06-HU07 `WidgetCalendario.test.tsx:57`; HE-04-HU05 `WidgetClima.test.tsx:46-85`; HE-04-HU06 `WidgetNoticias.test.tsx:49-104`; HE-04-HU09 `WidgetAnimacion.test.tsx:46, :53, :61`; HE-04-HU11 `WidgetReproductor.test.tsx:59-105`; HE-17-HU01 `area_de_notificacion.rs:182, :189`; HE-17-HU02 `ultima_pantalla.rs:88, :98, :106`; HE-17-HU03 `pruebas_de_salir.rs:18, :27, :39, :47` | las 13 de «falta» (ver 5.1) | EC-15, EV-31, puntero sobre Calendario y Noticias (S3), ciudad del Reloj (S2), casilla 13,5 (S4): PROPUESTA |
| **Instalador y web** (L600) | CD-01-HU01 `CD-01-HU01.spec.ts:11, :40, :52, :60, :75`; CD-01-HU02 `CD-01-HU02.spec.ts:39, :67, :84`; CD-02-HU01 `instalador.ps1:87-151` e `interfaz.py:504-802`; CD-02-HU02 `instalador.ps1:123, :144`, `interfaz.py:731`; CD-02-HU03 `interfaz.py:536-617` | separar red caída de instalador ausente (R30); códigos de la sección 2.6 | interruptor, fila de carpeta, «Entendido», avance «Instalando… N %», aviso de abrir: PROPUESTA (IN-01, IN-02, IN-03, IN-06) |
| **Marco y componentes** (parte 10 de MB-01..MB-xx) | `marco.test.tsx`, `AreaDeNotificacion.test.tsx`, `MensajeResultado.test.tsx`, `Boton.test.tsx`, `PanelDeWindi` (en parte) | geometría ±2 px de `marco-barra`, `marco-principal`, `marco-tarjeta`; geometría de botón 36/32 y radio 9, de campo 260×36, de casilla 18×18; A-01 a A-04 | no tiene tabla única CA → prueba (ver Pendientes con destino) |
| **Personalización** (12 partes 10, PW-02 a PW-14) | `temasDeWindgets.test.tsx`, `Personalization.test.tsx`, `Edicion.test.tsx` | por pieza: pantalla «Mis temas» fusionada, ayuda «Escribe de 1 a 40 caracteres.», composición de colores, filas de Forma y Distribución | CA derivados de S13 (HE-02) y S14 (HE-05): Paula los aprueba o rechaza |
| **Planificador** (12 partes 10, PL-01 a PL-15) | `Kanban`, `Calendario`, `Reports`, `Labels` (existentes); `pruebas_de_errores_visibles.rs` | esqueleto, error con «Reintentar», sin conexión, globos, aviso de día pasado, etiquetas del catálogo de 9 | EV-32 `card_reminder_due`, `planner_get_today` con `date?`: PROPUESTA (S6 a S12) |
| **Windi** (11 partes 10, WI-01 a WI-11) | `Windi.test.tsx` (CA de HU01 a HU03) | HU01-CA05 con 2001 caracteres; HU04 a HU06 una por CA; HU10 (color de etiqueta); foco por teclado | tres puntos animados (E5): PROPUESTA |

### 5.1 CA sin prueba hoy

Contados solo donde la spec lo declara en su tabla «CA → prueba».

| Spec | Sin prueba | Cantidad |
|---|---|---|
| Configuración (L444) | CA-D1 a CA-D6 (densidad); MB-22 | 7 |
| Escritorio (L320) | fecha del Reloj «martes 24 de noviembre»; anillo de selección; domingo del Calendario; tarea vencida y rótulo «Tareas del día»; píldoras «2 de 10» y «Animación pausada»; velo `capa-velo`; `data-testid` de la capa y geometría por escala 100/125/150 %; aviso `ESCRITORIO_NO_CARGA`; EC-15; EV-31; puntero sobre Calendario y Noticias; ciudad del Reloj; casilla 13,5 | 13 |
| Instalador (L600) | interruptor; fila de carpeta; «Entendido»; avance «Instalando… N %»; aviso de abrir | 5 |
| Cuenta (L948-969) | ninguno: la tabla marca prueba para cada CA; faltan los archivo:línea de 11 de las 12 filas | 0 declarado |
| Marco, Personalización, Planificador, Windi | **No contados.** Tienen partes 10 por pieza, no una tabla única. En esas partes, «falta» aparece 3 veces en Marco, 10 en Personalización, 7 en Planificador y 2 en Windi (grep de `falta` sobre cada spec), pero describen diferencias de código por pieza, no CA contables | parcial |
| **Total contado** | Configuración 7 + Escritorio 13 + Instalador 5. **Parcial:** faltan las cuatro specs sin tabla única; para contarlas hay que reunir cada parte 10 en una tabla (Pendientes con destino 6) | **25 (parcial)** |

---

## 6. Destino en `docs/DUDAS.md`

Cada PROPUESTA se registra con el **valor neutro** que se usa mientras Paula no apruebe el texto: el texto exacto que trae su spec; si el código es alias de uno que ya existe, el texto de la clave existente. `DUDAS.md` ya recoge `NO_PUDIMOS_ABRIR_EL_NAVEGADOR` (L277), `IMAGEN_DE_FONDO_NO_ENCONTRADA` (L280) y `MUY_LARGO` (L261); no se repiten.

| Grupo | Códigos PROPUESTA a registrar | Valor neutro | Destino adicional |
|---|---|---|---|
| G1 (18) | `WINDI_ERROR_INTERNO`, `WINDI_SIN_RESPUESTA`, `WINDI_CONEXION_PERDIDA`, `WINDI_MENSAJE_MUY_LARGO`, `SINCRONIZACION_FALLIDA`, `OPERACION_FALLIDA`, `REPORTE_NO_CARGA`, `WIDGETS_NO_CARGAN`, `CLIMA_NO_CARGA`, `INICIO_AUTOMATICO_FALLIDO`, `CIERRE_SESION_FALLIDO`, `NOTICIAS_NO_CARGAN`, `WALLPAPER_NO_SE_MUESTRA`, `INSTALACION_FALLIDA`, `ORGANIZAR_WIDGETS_FALLIDO`, `GOOGLE_NO_DISPONIBLE`, `NAVEGADOR_NO_ABRE`, `CORREO_GOOGLE_MUY_LARGO` | el texto de G1a a G1s en CONSISTENCIA L141-160; los que son alias (C-1 a C-11) usan el texto de la clave existente | `messages.es.json`, `messages.rs` |
| Pantallas (6) | `ESCRITORIO_NO_CARGA`, `PLANIFICADOR_NO_CARGA`, `TABLERO_NO_CARGA`, `CALENDARIO_NO_CARGA`, `PREFERENCIA_MENU_NO_GUARDADA`, `PERFIL_NO_DISPONIBLE` | el texto de EC-01, PL-01, PL-03, PL-05, MB-xx | spec de cada área |
| Planificador (8) | `ARRASTRE_SIN_HORA`, `PROXIMAS_NO_CARGAN`, `NOTIFICACIONES_BLOQUEADAS`, `PANEL_DIA_NO_CARGA`, `COLUMNA_NO_ELIMINADA`, `TARJETA_NO_ELIMINADA`, `ETIQUETA_NO_ELIMINADA`, `ETIQUETAS_NO_CARGAN` | el texto de PL-01 a PL-15 | `contratos.md` (S6 a S12) |
| Escritorio (3) | `WIDGET_NO_CARGA`, `ENLACE_NO_PERMITIDO`, `ZONA_HORARIA_NO_DISPONIBLE` | el texto de EC-01, EC-02, S2 | `messages.es.json` (ya anotado en la spec) |
| Marco (4) | `COLOR_OBLIGATORIO`, `FECHA_FUERA_DE_RANGO`, `<CAMPO>_OBLIGATORIO`, `<CAMPO>_INVALIDO` | «Elige un color.» · «El valor no tiene un formato válido.» | `messages.es.json` |
| Instalador (9) | `DESCARGA_SIN_CONEXION`, `DESCARGA_NO_DISPONIBLE`, `INSTALADOR_NO_PUBLICADO`, `SIN_ESPACIO_EN_DISCO`, `ESPACIO_NO_MEDIBLE`, `ABRIR_APLICACION_FALLIDO`, `REVERSION_FALLIDA`, `EQUIPO_NO_COMPATIBLE`, `INSTALADOR_DANADO` | el texto de CD-02 e IN-01 a IN-07; `ESPACIO_NO_MEDIBLE`: continuar sin comprobar el espacio | `docs/CD-02.md` |
| Personalización (8) | `widget_opacity.invalid`, `widget_font_size.invalid`, `widget_format.invalid`, `widget_appearance.invalid`, `widget_shape.invalid`, `layout_preset.invalid`, `background_dim.invalid`, `background_blur.invalid` | el texto de PW-12 y PW-13 | `contratos.md` (ampliación de IPC-THEME-05) |
| Nuevos de esta revisión (2) | `IMAGEN_NO_GUARDADA` (R20), `SESION_NO_GUARDADA` (R14) | «No pudimos guardar la imagen. Intenta de nuevo.» · «No pudimos guardar tu sesión. Vuelve a iniciar sesión.» | rutas R14 y R20 |

`labels.limit_reached` no va a DUDAS ni a `errores.rs`: es una errata de `contratos.md:312` (la regla ya existe como `label.limit_reached`, `errores.rs:94`). G2 tampoco: los temas usan `name.required`, `name.duplicate` y `name.too_long`; si el CA pide otro literal para el campo vacío, se anota el texto en `DUDAS.md` con el valor neutro «Este campo es obligatorio.» (el del contrato).

---

## 7. Conflictos, pendientes y decisiones

### Conflictos

Regla de resolución **S19** (Paula, 27-nov, `.trabajo/DECISIONES_PAULA_26nov.md`): si un código de CONSISTENCIA ya existe en código con otro nombre, gana el del código y el de CONSISTENCIA queda como alias, sin duplicar clave. Resuelve C-1, C-3, C-4, C-8, C-10 y C-11.

| # | Conflicto | Propuesta de resolución | Estado |
|---|---|---|---|
| C-1 | `OPERACION_FALLIDA` (G1h) y `service.unavailable` / `SERVICIO_NO_DISPONIBLE` (`messages.es.json:104`) tienen el mismo literal | `SERVICIO_NO_DISPONIBLE` queda como clave; `OPERACION_FALLIDA` como alias de las operaciones que no son de cuenta | gana `service.unavailable` / `SERVICIO_NO_DISPONIBLE`; `OPERACION_FALLIDA` (G1h) es alias | Resuelto (S19) |
| C-2 | `CIERRE_SESION_FALLIDO` (G1m) / `auth.sign_out_failed` / clave `NO_PUDIMOS_CERRAR_LA_SESION` (`:96`) | la spec ya lo decide (`SPEC_Cuenta_y_Acceso.md:826/835/841`, `SPEC_Configuracion.md:46/294/301`): el front mapea G1m a la clave existente | Resuelto |
| C-3 | `INICIO_AUTOMATICO_FALLIDO` (G1l) / `autostart.failed` / clave `NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO` (`:95`) | ídem; la prueba `Settings.test.tsx:182` conserva su nombre | gana `autostart.failed` con la clave `NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO`; `INICIO_AUTOMATICO_FALLIDO` (G1l) es alias | Resuelto (S19) |
| C-4 | `NAVEGADOR_NO_ABRE` (G1r) / `NO_PUDIMOS_ABRIR_EL_NAVEGADOR` (`:94`) / `browser.open_failed` (`contratos.md:288`, sin texto) | gana la clave existente; añadir el texto a `browser.open_failed` | gana `browser.open_failed` con la clave `NO_PUDIMOS_ABRIR_EL_NAVEGADOR`; `NAVEGADOR_NO_ABRE` (G1r) es alias; añadir el texto a `browser.open_failed` | Resuelto (S19) |
| C-5 | `WINDI_SIN_RESPUESTA` (G1b) / `WINDI_NO_DISPONIBLE` (`:152`) / `windi.unavailable` | `windi.unavailable` es el código de contrato; `WINDI_SIN_RESPUESTA` es la clave de texto y gana la clave existente `:152`; G1b es alias (`SPEC_Windi.md:124`, `:190-201`; tabla 2.5) | Resuelto |
| C-6 | `WINDI_MENSAJE_MUY_LARGO` (G1e) / `message.too_long` / `MENSAJE_MUY_LARGO` (`:86`) | código de contrato `message.too_long`; gana la clave actual `MENSAJE_MUY_LARGO`; `WINDI_MENSAJE_MUY_LARGO` es alias (`SPEC_Windi.md:124`, `:190-201`) | Resuelto |
| C-7 | `WINDI_CONEXION_PERDIDA` (G1d) / `WINDI_SIN_CONEXION_AL_CONFIRMAR` (`:159`) | es el mismo caso (sin conexión al confirmar o rechazar; el de enviar es G1c): gana la clave `:159`; G1d es alias (`SPEC_Windi.md:190-201`) | Resuelto |
| C-8 | `WALLPAPER_NO_SE_MUESTRA` (G1o) / `NO_SE_PUDO_MOSTRAR_EL_WALLPAPER` (`:98`) | gana la clave existente (`AvisoDelWallpaper.tsx:15-20` cumple RD-64) | gana la clave `NO_SE_PUDO_MOSTRAR_EL_WALLPAPER`; `WALLPAPER_NO_SE_MUESTRA` (G1o) es alias | Resuelto (S19) |
| C-9 | `CLIMA_NO_CARGA` (G1k) y `NOTICIAS_NO_CARGAN` (G1n) frente a `CLIMA_NO_DISPONIBLE` (`:23`) y `NOTICIAS_NO_DISPONIBLES` (`:92`) | gana la clave existente (`CLIMA_NO_DISPONIBLE`, `NOTICIAS_NO_DISPONIBLES`); G1k y G1n quedan como alias en CONSISTENCIA §6 (S19) | Resuelto (S19) |
| C-10 | `GOOGLE_NO_DISPONIBLE` (G1r) / `GOOGLE_ERROR` (`:72`) | gana `GOOGLE_ERROR` | gana `GOOGLE_ERROR`; `GOOGLE_NO_DISPONIBLE` (G1r) es alias | Resuelto (S19) |
| C-11 | `CORREO_GOOGLE_MUY_LARGO` (G1s) / `GOOGLE_CORREO_MUY_LARGO` (`:71`) | gana la clave existente | gana `GOOGLE_CORREO_MUY_LARGO`; `CORREO_GOOGLE_MUY_LARGO` (G1s) es alias | Resuelto (S19) |
| C-12 | `TEMA_NOMBRE_REPETIDO` y `TEMA_NOMBRE_MUY_LARGO` (G2) frente a `name.duplicate` / `name.too_long` | los temas ya usan `name.required`, `name.too_long` y `name.duplicate` (`contratos.md:231`, `:236`): G2 no crea códigos; el literal del campo vacío es texto del campo (Pendientes con destino 3) | Resuelto |
| C-13 | `IMAGEN_DE_FONDO_NO_ENCONTRADA` (`:73`) sin código `a.b`; `image.not_found` (`:228`) sin texto | enlazar la clave a `image.not_found` | Abierto |
| C-14 | `labels.limit_reached` (`contratos.md:312`, Windi) frente a `label.limit_reached` (`contratos.md:190`, `errores.rs:94`) y `labels.too_many` (3 por tarjeta, `:168`) | `label.limit_reached` ya existe: `labels.limit_reached` es una errata; sin código nuevo ni entrada de enum (Pendientes con destino 2) | Resuelto |
| C-15 | `CODIGO_VENCIDO` (AC-08) = `code.expired` | es el mismo; ampliar IPC-AUTH-11 | Resuelto |
| C-16 | `a.b` frente a `CAMPO_OBLIGATORIO` en Cuenta | S9 | Resuelto |
| C-17 | `COLOR_INVALIDO` con el texto del contrato frente al texto de MB-26 | gana el contrato (existe en `:29` y se usa); MB-26 usa `COLOR_OBLIGATORIO` solo para el campo vacío | Abierto |
| C-18 | `DESCARGA_NO_DISPONIBLE` / `INSTALADOR_NO_PUBLICADO` (WE-01) | el primero es el código; el segundo queda como alias de causa | Abierto |
| C-19 | HU01-CA05 dice «Error de sincronización. Reintentaremos automáticamente.» y el Figma «Error de sincronización · N pendientes» (CF-05) | gana el literal del Figma; se cambia el CA | Abierto |
| C-20 | `WINDI_CELEBRACION` (`:140`) lleva emoji (D11); `:141, :142, :143, :146, :150, :163, :165` usan comillas inglesas (G8 manda « ») | corregir las claves | Abierto |

Total: **20 conflictos** (5 abiertos: C-13, C-17, C-18, C-19, C-20; 15 resueltos).

### Pendientes con destino

| # | Qué | Destino |
|---|---|---|
| 1 | Verificar V-01 a V-03 de `rediseno_plan_codigo.md` (módulo de límites, `ETIQUETAS_MAX` 5 vs 3, `validarTodo` en cada formulario) | Planificador y Personalización, antes de cerrar la CM |
| 2 | Corregir la errata `labels.limit_reached` → `label.limit_reached` en `docs/contratos.md:312` (no se añade nada a `errores.rs`) | `docs/contratos.md` (Windi) |
| 3 | Fijar el literal del campo Nombre vacío de un tema: el contrato dice `name.required` «Este campo es obligatorio.» y PW-03 pide «Escribe un nombre para el tema.» | `docs/contratos.md:231`, `:236` y `SPEC_Personalizacion_y_widgets.md:283`, `:311-313` |
| 3c | Pasar `tipo` explícito en cada llamada de error a `mostrar` y no depender de `tipoDelTexto` | `MensajeResultado.tsx:44-55`, `:133` (R32) |
| 3d | El texto de `COLOR_INVALIDO` de Marco (`SPEC_Marco_y_componentes_base.md:752`) contradice el vigente (`messages.es.json:29`, `SPEC_Personalizacion_y_widgets.md:797`) | spec de Marco (C-17) |
| 3e | `auth_get_sign_out_info` llega como `InternalUnexpected` con mensaje vacío | `puente_ipc.rs:2706-2717` (R05) |
| 3 | Ampliar IPC-AUTH-11 con `code.expired` | `docs/contratos.md` |
| 4 | Corregir la cabecera de `installer/pruebas/instalador.ps1:3-5` (dice que HU03 se prueba a mano; hoy la cubre `interfaz.py`) | Instalador, pieza de código |
| 5 | Fijar archivo:línea de los CA de Cuenta que ya tienen prueba | Cuenta (tabla L948) |
| 6 | Tabla única CA → prueba para Marco, Personalización, Planificador y Windi | cada spec |
| 11 | Corregir `SPEC_Windi.md:124` y las filas `:194`, `:196`, `:197`, `:446` por S19: ganan `windi.unavailable`, `message.too_long` y `net.offline` con las claves `WINDI_NO_DISPONIBLE`, `MENSAJE_MUY_LARGO` y `WINDI_SIN_CONEXION_AL_CONFIRMAR`; no se renombran claves (hecho en esta pasada; la tabla 2.5 ya dice que G1e es alias, y `Windi.tsx` no cambia de clave) | `SPEC_Windi.md` |
| 12 | Anotar en CONSISTENCIA los alias de S19: G1b, G1d, G1e (Windi), G1h, G1l, G1o, G1r (navegador y Google) y G1s | `CONSISTENCIA.md` §6 |
| 7 | Probar las rutas por corregir de la sección 3 con `mockRejectedValue` en el test del componente (o añadir un gancho de fallo a `ipc/simulado.ts`) | una pieza «errores visibles» por área |
| 8 | Ampliar el alcance de G1h (`OPERACION_FALLIDA`) al escritorio | CONSISTENCIA L190 |
| 9 | Escala 100/125/150 % de la capa y geometría de Marco | `e2e/` (fase 6) |

### Pendiente de Paula

Los 5 conflictos abiertos (C-13, C-17, C-18, C-19, C-20) llevan solución propuesta y esperan el sí de Paula en `DECISIONES.md` §1 (V-02).
