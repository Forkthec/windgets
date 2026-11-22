//! Mensajes de error y de resultado de la interfaz, en un solo lugar (convenciones.md, «Nombres»).
//! «Los textos literales viven en un solo archivo de Rust (`messages.rs`) que un paso de compilación exporta a
//! `messages.es.json`» (contratos.md; DP-01, exportar los textos de messages.rs a messages.es.json en la
//! compilación). Cada HU agrega aquí los textos literales de sus CA (criterios de aceptación) y su fila en
//! `TEXTOS`; `cargo test` escribe `src/types/messages.es.json`, igual que ts-rs escribe los tipos.

/// `service.unavailable`: el servicio de cuentas no responde (RT-04-CA13, D-205; contratos.md, 1.3).
pub const SERVICIO_NO_DISPONIBLE: &str =
    "No pudimos completar la operación. Intenta de nuevo más tarde.";

// HE-01-HU01 · Registrar una cuenta con alias y correo electrónico (IPC-AUTH-01 auth_register_start).

/// `*.required` de todo campo obligatorio (HE-01-HU01-CA02, CA05).
pub const CAMPO_OBLIGATORIO: &str = "Este campo es obligatorio.";

/// HE-15-HU04-CA08, ET11: aviso al recibir una personalización más reciente con cambios sin guardar.
pub const PERSONALIZACION_REMOTA_CON_CAMBIOS: &str = "Se aplicó una personalización más reciente desde otro computador. Tus cambios sin guardar se conservan.";
/// `alias.too_long` (HE-01-HU01-CA03).
pub const ALIAS_MUY_LARGO: &str = "El alias no puede superar los 30 caracteres.";
/// `email.invalid` (HE-01-HU01-CA06).
pub const CORREO_INVALIDO: &str = "Diligencia un correo electrónico válido.";
/// `email.too_long` (HE-01-HU01-CA07).
pub const CORREO_MUY_LARGO: &str = "El correo electrónico no puede superar los 64 caracteres.";
/// `email.already_registered` (HE-01-HU01-CA08), con los hipervínculos «Iniciar sesión» y «Recuperar contraseña».
pub const CORREO_YA_REGISTRADO: &str = "Este correo electrónico ya está registrado.";
/// Resultado de `auth_register_start` (HE-01-HU01-CA01).
pub const CODIGO_ENVIADO: &str =
    "Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta.";
/// `net.offline` en Registro (HE-01-HU01-CA12).
pub const SIN_CONEXION_REGISTRO: &str =
    "No hay conexión a internet. Conéctate para crear tu cuenta.";
/// `auth.rate_limited` (RNF-24: límite de intentos).
pub const DEMASIADOS_INTENTOS: &str =
    "Demasiados intentos. Espera unos minutos e intenta de nuevo.";

// HE-01-HU02 · Crear la contraseña de la cuenta durante el registro (IPC-AUTH-01).

/// `password.invalid` (HE-01-HU02-CA04 a CA06).
pub const CONTRASENA_INVALIDA: &str = "La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.";
/// `password_confirmation.mismatch` (HE-01-HU02-CA08).
pub const CONTRASENAS_NO_COINCIDEN: &str = "Las contraseñas no coinciden.";

// HE-01-HU03 · Verificar el correo electrónico con un código de verificación (IPC-AUTH-02 a IPC-AUTH-04).

/// Resultado de `auth_register_verify` (HE-01-HU03-CA01); `<alias>` va en `params.alias`.
pub const BIENVENIDA: &str = "¡Bienvenido, <alias>! Tu cuenta fue creada correctamente.";
/// `code.incorrect` (HE-01-HU03-CA03).
pub const CODIGO_INCORRECTO: &str = "El código no es correcto. Revísalo e intenta de nuevo.";
/// `code.expired` (HE-01-HU03-CA04).
pub const CODIGO_VENCIDO: &str = "El código venció. Solicita uno nuevo.";
/// Resultado de `auth_register_resend` (HE-01-HU03-CA06).
pub const CODIGO_REENVIADO: &str = "Te enviamos un nuevo código.";
/// `code.resend_too_soon` (HE-01-HU03-CA07); `<segundos restantes>` va en `params.seconds`.
pub const REENVIO_EN_SEGUNDOS: &str = "Puedes pedir un nuevo código en <segundos restantes> s.";

// HE-01-HU04 · Iniciar sesión con correo electrónico y contraseña (IPC-AUTH-05).

/// `auth.invalid_credentials` (HE-01-HU04-CA08): el mismo texto para correo no registrado y contraseña
/// incorrecta (ET06).
pub const CREDENCIALES_INCORRECTAS: &str = "Correo electrónico o contraseña incorrectos.";
/// `net.offline` en Inicio de sesión (HE-01-HU04-CA10).
pub const SIN_CONEXION_INICIO: &str = "No hay conexión a internet. Conéctate para iniciar sesión.";

// HE-01-HU06 a HU08 · Recuperar contraseña (IPC-AUTH-08 a IPC-AUTH-11).

/// Resultado de `auth_recovery_request`, el mismo exista o no la cuenta (HE-01-HU06-CA01, CA02, ET09).
pub const CODIGO_DE_RECUPERACION_ENVIADO: &str =
    "Si el correo está registrado, te enviamos un código de verificación.";
/// `net.offline` en Recuperar contraseña (HE-01-HU06-CA06, HE-01-HU07-CA09, HE-01-HU08-CA05, CA06).
pub const SIN_CONEXION_RECUPERAR: &str =
    "No hay conexión a internet. Conéctate para recuperar tu contraseña.";
/// Resultado de `auth_recovery_set_password` (HE-01-HU08-CA01).
pub const CONTRASENA_ACTUALIZADA: &str = "Tu contraseña fue actualizada. Ya puedes iniciar sesión.";
/// `password.same_as_current` (HE-01-HU08-CA07, ET10).
pub const CONTRASENA_IGUAL_A_LA_ACTUAL: &str = "Elige una contraseña distinta de la actual.";

// HE-01-HU05 · Iniciar sesión con la cuenta de Google (IPC-AUTH-06, IPC-AUTH-07, EV-02).

/// EV-02 `cancelled` (HE-01-HU05-CA05, ET13).
pub const GOOGLE_CANCELADO: &str = "Se canceló el inicio de sesión con Google.";
/// EV-02 `error` (HE-01-HU05-CA06).
pub const GOOGLE_ERROR: &str = "No fue posible iniciar sesión con Google. Intenta de nuevo.";
/// EV-02 `email_too_long` (HE-01-HU05-CA08); «Regístrate» es el hipervínculo que abre Registro.
pub const GOOGLE_CORREO_MUY_LARGO: &str = "No pudimos crear tu cuenta: tu correo de Google supera los 64 caracteres. Regístrate con otro correo electrónico.";

// HE-07-HU01 · Crear una tarjeta de tipo Tarea, Recordatorio o Evento (IPC-CARD-01 card_create).

/// Resultado de `card_create` (HE-07-HU01-CA01, CA02, CA12; ET16).
pub const TARJETA_CREADA: &str = "Tarjeta creada.";
/// `title.too_long` (HE-07-HU01-CA06, ET18).
pub const TITULO_MUY_LARGO: &str = "El título no puede superar los 100 caracteres.";
/// `due_date.invalid` (HE-07-HU01-CA08, ET19).
pub const FECHA_INVALIDA: &str = "Diligencia una fecha válida.";
/// `due_date.in_past` (HE-07-HU01-CA09, ET20).
pub const FECHA_LIMITE_ANTERIOR_A_HOY: &str = "La fecha límite no puede ser anterior a hoy.";
/// `description.too_long` (HE-07-HU01-CA10, ET21).
pub const DESCRIPCION_MUY_LARGA: &str = "La descripción no puede superar los 1000 caracteres.";
/// `labels.too_many` (HE-07-HU02-CA02, ET06; IPC-CARD-01).
pub const MAXIMO_ETIQUETAS: &str = "Puedes asignar máximo 5 etiquetas por tarjeta.";

// HE-07-HU04 · Editar una tarjeta (IPC-CARD-02 card_update).

/// Resultado de `card_update` (HE-07-HU04-CA01, CA03; ET14).
pub const TARJETA_ACTUALIZADA: &str = "Tarjeta actualizada.";
/// Resultado de `card_update` cuando la tarjeta sale de su bloque horario (HE-07-HU04-CA10; ET15).
pub const TARJETA_ACTUALIZADA_SIN_BLOQUE: &str = "Tarjeta actualizada. Se quitó de su bloque horario porque quedó después de la nueva fecha límite.";

// HE-07-HU05 · Eliminar una tarjeta (IPC-CARD-03 card_delete).

/// Resultado de `card_delete` (HE-07-HU05-CA02; ET06).
pub const TARJETA_ELIMINADA: &str = "Tarjeta eliminada.";

// HE-12-HU02 · Alternar la casilla de completada desde el planificador diario (IPC-CARD-07 card_set_completed).

/// Resultado de `card_set_completed` al marcar la casilla (HE-12-HU02-CA01; ET07).
pub const TARJETA_COMPLETADA: &str = "¡Bien hecho! Tarjeta completada.";

// HE-12-HU03 · Consultar el resumen de avance del día (IPC-CARD-08 planner_get_today).

/// Con todas las tarjetas de hoy completadas (HE-12-HU03-CA04; ET05).
pub const COMPLETASTE_TODAS: &str = "¡Completaste todas tus tarjetas de hoy!";
/// «Nueva tarjeta» deshabilitada en el Panel de un día anterior a hoy (HE-10-HU04-CA04, ET07; IPC-CARD-14).
pub const NO_CREAR_EN_DIAS_PASADOS: &str = "No puedes crear tarjetas en días pasados.";

// HE-11-HU02 · Asignar una tarjeta a un bloque horario (IPC-CARD-10 card_assign_time_block).

/// Resultado de `card_assign_time_block` (HE-11-HU02-CA01, CA03; ET09, D-169).
pub const TARJETA_ASIGNADA_AL_BLOQUE: &str =
    "Tarjeta asignada al bloque <hora de inicio> – <hora de fin>.";
/// `time_block.past` (HE-11-HU02-CA04; ET10).
pub const BLOQUE_YA_PASO: &str = "No puedes asignar tarjetas a un bloque horario que ya pasó.";
/// `time_block.after_due_date` (HE-11-HU02-CA05; ET11).
pub const BLOQUE_DESPUES_DE_FECHA_LIMITE: &str =
    "No puedes programar la tarjeta después de su fecha límite.";

// HE-11-HU03 · Quitar una tarjeta de un bloque horario (IPC-CARD-11 card_unassign_time_block).

/// Resultado de `card_unassign_time_block` (HE-11-HU03-CA01; ET03).
pub const TARJETA_QUITADA_DEL_HORARIO: &str = "Tarjeta quitada del horario.";

// HE-08-HU02 · Crear una etiqueta con nombre y color (IPC-LABEL-02 label_create).

/// Resultado de `label_create` (HE-08-HU02-CA01, CA08; ET09).
pub const ETIQUETA_CREADA: &str = "Etiqueta creada.";
/// Resultado de `label_update` (HE-08-HU03-CA01, ET06).
pub const ETIQUETA_ACTUALIZADA: &str = "Etiqueta actualizada.";
/// M-10 (HE-08-HU04-CA01): eliminar una etiqueta sin tarjetas.
pub const CONFIRMAR_ELIMINAR_ETIQUETA: &str =
    "¿Deseas eliminar la etiqueta “<nombre de la etiqueta>”? Esta acción no se puede deshacer.";
/// M-14 (HE-08-HU04-CA03): eliminar una etiqueta asignada a varias tarjetas.
pub const CONFIRMAR_ELIMINAR_ETIQUETA_EN_TARJETAS: &str = "La etiqueta “<nombre de la etiqueta>” está asignada a <cantidad> tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?";
/// M-14 en singular (HE-08-HU04-CA04).
pub const CONFIRMAR_ELIMINAR_ETIQUETA_EN_UNA_TARJETA: &str = "La etiqueta “<nombre de la etiqueta>” está asignada a 1 tarjeta. Se quitará de ella, pero la tarjeta no se eliminará. ¿Deseas continuar?";
/// Resultado de `label_delete` (HE-08-HU04-CA02, CA05; ET08).
pub const ETIQUETA_ELIMINADA: &str = "Etiqueta eliminada.";
/// `name.too_long` (HE-08-HU02-CA03; ET11).
pub const NOMBRE_DE_ETIQUETA_MUY_LARGO: &str =
    "El nombre de la etiqueta no puede superar los 30 caracteres.";
/// `name.duplicate` (HE-08-HU02-CA04; ET12).
pub const ETIQUETA_DUPLICADA: &str = "Ya existe una etiqueta con ese nombre.";
/// `label.limit_reached` (HE-08-HU02-CA06; ET07).
pub const MAXIMO_DE_ETIQUETAS_CREADAS: &str =
    "Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.";

// HE-09-HU03 · Crear una columna (IPC-COL-02 column_create).

/// Resultado de `column_create` (HE-09-HU03-CA01, CA02).
pub const COLUMNA_CREADA: &str = "Columna creada.";
/// `name.too_long` (HE-09-HU03-CA04).
pub const NOMBRE_DE_COLUMNA_MUY_LARGO: &str =
    "El nombre de la columna no puede superar los 30 caracteres.";
/// `name.duplicate` (HE-09-HU03-CA05; ET04).
pub const COLUMNA_DUPLICADA: &str = "Ya existe una columna con ese nombre.";
/// `column.limit_reached` (HE-09-HU03-CA06; ET08).
pub const MAXIMO_DE_COLUMNAS: &str =
    "Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.";

// HE-09-HU04 · Editar una columna (IPC-COL-03 column_update).

/// Resultado de `column_update` (HE-09-HU04-CA01, CA02).
pub const COLUMNA_ACTUALIZADA: &str = "Columna actualizada.";
/// M-09 (HE-09-HU06-CA01, ET03): eliminar una columna sin tarjetas.
pub const CONFIRMAR_ELIMINAR_COLUMNA: &str =
    "¿Deseas eliminar la columna “<nombre de la columna>”? Esta acción no se puede deshacer.";
/// M-13 (HE-09-HU06-CA03, CA07; ET04, ET06): con el nombre actual de Por hacer como destino.
pub const CONFIRMAR_ELIMINAR_COLUMNA_CON_TARJETAS: &str = "La columna “<nombre de la columna>” tiene <cantidad> tarjetas. Se moverán a “<nombre de la columna destino>”. ¿Deseas continuar?";
/// Resultado de `column_delete` (HE-09-HU06-CA02, CA04).
pub const COLUMNA_ELIMINADA: &str = "Columna eliminada.";
/// `column.default_not_deletable` (HE-09-HU06-CA05, ET02): texto de «Eliminar» deshabilitada.
pub const COLUMNA_POR_DEFECTO_NO_ELIMINABLE: &str =
    "Las columnas por defecto no se pueden eliminar.";

// HE-13-HU01 · Seleccionar el rango de fechas de los reportes (IPC-REP-01 report_resolve_range).

/// `range.start_after_end` (HE-13-HU01-CA03; ET11).
pub const INICIO_POSTERIOR_AL_FIN: &str =
    "La fecha de inicio no puede ser posterior a la fecha de fin.";
/// `range.too_long` (HE-13-HU01-CA06; ET13).
pub const RANGO_MUY_LARGO: &str = "El rango máximo es de un año.";

// HE-07-HU03 · Consultar el detalle de una tarjeta (IPC-CARD-04 card_get).

/// `card.not_found` (HE-07-HU04-CA11; DP-04: el mismo texto al consultar, eliminar o mover).
pub const TARJETA_NO_EXISTE: &str = "Esta tarjeta ya no existe.";

// HE-02-HU10 · Seleccionar el tema en edición (IPC-THEME-04 theme_draft_select).

/// `draft.unsaved_changes` (HE-02-HU10-CA03, M-04). `<nombre del tema en edición>` es el dato variable.
pub const CAMBIOS_SIN_GUARDAR_AL_CAMBIAR_DE_TEMA: &str = "Tienes cambios sin guardar en el tema “<nombre del tema en edición>”. ¿Deseas cambiar de tema sin guardarlos?";

/// El mensaje de M-04 con el nombre del tema en edición.
pub fn cambios_sin_guardar_al_cambiar_de_tema(nombre: &str) -> String {
    CAMBIOS_SIN_GUARDAR_AL_CAMBIAR_DE_TEMA.replace("<nombre del tema en edición>", nombre)
}

// HE-02-HU03 · Seleccionar la imagen de fondo de la plantilla (IPC-CAT-03 image_import).

/// `image.format_not_allowed` (HE-02-HU03-CA05).
pub const FORMATO_DE_IMAGEN_NO_PERMITIDO: &str =
    "Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.";
/// `image.too_large` (HE-02-HU03-CA06).
pub const IMAGEN_MUY_GRANDE: &str = "La imagen supera el tamaño máximo de 20 MB.";
/// `image.unreadable` (HE-02-HU03-CA07).
pub const IMAGEN_ILEGIBLE: &str =
    "No pudimos leer la imagen. Verifica que el archivo no esté dañado.";

// HE-02-HU11 · Guardar en el tema en edición los cambios de la vista previa (IPC-THEME-07 theme_draft_save).

/// Resultado de `theme_draft_save` con un tema que no es el aplicado (HE-02-HU11-CA01). `<nombre del tema>` es el
/// dato variable.
pub const CAMBIOS_GUARDADOS_EN_EL_TEMA: &str = "Cambios guardados en el tema “<nombre del tema>”.";
/// Resultado de `theme_draft_save` con el tema aplicado (HE-02-HU11-CA02).
pub const CAMBIOS_GUARDADOS_EN_EL_TEMA_APLICADO: &str =
    "Cambios guardados. Selecciona Aplicar para verlos en tu escritorio.";
/// `draft.no_changes` (HE-02-HU11-CA03): texto de la opción «Guardar» deshabilitada.
pub const SIN_CAMBIOS_PARA_GUARDAR: &str = "No hay cambios para guardar.";

/// Aviso cuando el wallpaper aplicado no se puede mostrar (HE-02-HU01-CA04, P-WAL-02).
pub const NO_SE_PUDO_MOSTRAR_EL_WALLPAPER: &str =
    "No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.";

/// El mensaje de CA01 con el nombre del tema.
pub fn cambios_guardados_en_el_tema(nombre: &str) -> String {
    CAMBIOS_GUARDADOS_EN_EL_TEMA.replace("<nombre del tema>", nombre)
}

// HE-02-HU12 · Aplicar al escritorio los cambios de la vista previa (IPC-THEME-09 theme_draft_apply).

/// Resultado de `theme_draft_apply` con `mode: 'apply'` (HE-02-HU12-CA01).
pub const TEMA_APLICADO: &str = "Tema “<nombre del tema>” aplicado.";
/// Resultado de `theme_draft_apply` con `mode: 'save_and_apply'` (HE-02-HU12-CA03).
pub const TEMA_GUARDADO_Y_APLICADO: &str = "Tema “<nombre del tema>” guardado y aplicado.";
/// Resultado de `theme_draft_apply` con `mode: 'apply_without_saving'` (HE-02-HU12-CA04).
pub const CAMBIOS_APLICADOS_SIN_GUARDAR: &str =
    "Cambios aplicados. Recuerda guardarlos para no perderlos.";
/// `draft.unsaved_changes_on_apply` (HE-02-HU12-CA02, M-15).
pub const CAMBIOS_SIN_GUARDAR_AL_APLICAR: &str =
    "Tienes cambios sin guardar en el tema “<nombre del tema>”. ¿Qué deseas hacer?";
/// `theme.already_applied` (HE-02-HU12-CA06): texto de la opción «Aplicar» deshabilitada.
pub const TEMA_YA_APLICADO: &str = "Este tema ya está aplicado.";
/// `color.invalid` (HE-02-HU05-CA03): mensaje de campo.
pub const COLOR_INVALIDO: &str =
    "Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).";
/// Aviso de legibilidad (HE-02-HU05-CA05): lo arma la vista con el contraste y el color sugerido de
/// `legibility`.
pub const CONTRASTE_BAJO: &str =
    "El contraste de estos colores es bajo (<contraste>:1). Prueba con <color sugerido>.";
/// IPC-THEME-11 `theme_draft_discard` (HE-02-HU13-CA01): mensaje de resultado.
pub const NO_SE_GUARDARON_CAMBIOS: &str = "No se guardaron cambios.";
/// M-03 (HE-02-HU13-CA05): confirmación al salir con cambios aplicados que no se guardaron en el tema.
pub const CAMBIOS_APLICADOS_SIN_GUARDAR_AL_SALIR: &str =
    "Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?";
/// IPC-THEME-08 `theme_draft_save_as` (HE-03-HU02-CA01): mensaje de resultado.
pub const TEMA_GUARDADO: &str = "Tema “<nombre del tema>” guardado.";
/// `name.too_long` (HE-03-HU02-CA03): mensaje de campo.
pub const NOMBRE_DE_TEMA_MUY_LARGO: &str = "El nombre no puede superar los 40 caracteres.";
/// `name.duplicate` (HE-03-HU02-CA04): mensaje en el campo Nombre.
pub const TEMA_DUPLICADO: &str = "Ya existe un tema con ese nombre. Elige otro.";
/// IPC-THEME-13 `theme_rename` (HE-03-HU04-CA01, CA06): mensaje de resultado.
pub const TEMA_RENOMBRADO: &str = "Tema renombrado.";
/// M-06 (HE-03-HU05-ET01): confirmación de eliminar un tema.
pub const CONFIRMAR_ELIMINAR_TEMA: &str =
    "¿Deseas eliminar el tema “<nombre del tema>”? Esta acción no se puede deshacer.";
/// IPC-THEME-14 `theme_delete` (HE-03-HU05-CA01): mensaje de resultado.
pub const TEMA_ELIMINADO: &str = "Tema eliminado.";
/// `theme.applied_not_deletable` (HE-03-HU05-CA02, ET04): texto de la opción «Eliminar» deshabilitada.
pub const TEMA_APLICADO_NO_SE_ELIMINA: &str =
    "No puedes eliminar el tema aplicado. Aplica otro tema primero.";
/// `theme.limit_reached` (HE-03-HU02-CA05): texto de la opción «Guardar como tema» deshabilitada.
pub const MAXIMO_DE_TEMAS: &str =
    "Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.";
/// M-05 (HE-03-HU03-CA06): confirmación de aplicar un tema guardado.
pub const CONFIRMAR_APLICAR_TEMA: &str = "Se reemplazará la personalización actual por la del tema “<nombre del tema>”. ¿Deseas aplicarlo?";
/// `background.already_default` (HE-02-HU04-CA02): texto de la opción «Quitar imagen» deshabilitada.
pub const FONDO_YA_POR_DEFECTO: &str = "Esta plantilla ya muestra su imagen de fondo por defecto.";

/// Un texto de HE-02-HU12 con el nombre del tema.
pub fn con_nombre_del_tema(texto: &str, nombre: &str) -> String {
    texto.replace("<nombre del tema>", nombre)
}

/// IPC-WID-06 `widget_delete` (HE-04-HU13-CA01): mensaje de resultado.
pub const WIDGET_ELIMINADO: &str = "Widget eliminado.";
/// `widget.default_not_deletable` (HE-04-HU13-CA02): texto de la opción «Eliminar» deshabilitada.
pub const WIDGET_POR_DEFECTO_NO_ELIMINABLE: &str =
    "Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.";
/// M-07 (HE-04-HU13-CA06): confirmación de eliminar un widget.
pub const CONFIRMAR_ELIMINAR_WIDGET: &str =
    "¿Deseas eliminar el widget “<nombre del widget>”? Se quitará de todos tus temas.";
/// Barra superior de la pantalla de edición (HE-05-HU01-ET04).
pub const INSTRUCCION_DE_EDICION: &str =
    "Arrastra los widgets para moverlos o desde su esquina para cambiar su tamaño";
/// IPC-LAY-05 `layout_edit_save` (HE-05-HU04-CA01, CA02, CA04): mensaje de resultado.
pub const CAMBIOS_GUARDADOS: &str = "Cambios guardados.";
/// IPC-LAY-06 `layout_edit_cancel` (HE-05-HU05-CA03): mensaje de resultado.
pub const DISTRIBUCION_NO_GUARDADA: &str = "No se guardaron cambios.";
/// Opción deshabilitada del catálogo de widgets: Noticias o Reproductor de música ya agregados (HE-04-HU04-CA02,
/// RT-04).
pub const WIDGET_YA_AGREGADO: &str = "Ya agregaste este widget.";

// HE-04-HU05 · Agregar el widget Clima (IPC-WID-04, IPC-WID-07; INT-04).
/// `city.not_found` (CA04).
pub const CIUDAD_NO_ENCONTRADA: &str =
    "No encontramos esa ciudad. Revisa el nombre e intenta de nuevo.";
/// `city.duplicate` (CA05).
pub const CIUDAD_DUPLICADA: &str = "Ya tienes un widget Clima para esa ciudad.";
/// `city.too_long` (CA09, ET11).
pub const CIUDAD_MUY_LARGA: &str = "La ciudad no puede superar los 100 caracteres.";
/// `net.offline` al validar la ciudad (IPC-WID-05; DP-07).
pub const CIUDAD_SIN_CONEXION: &str =
    "No hay conexión a internet. Conéctate para validar la ciudad.";
/// Aviso del widget cuando el servicio de clima no responde (CA07, ET07).
pub const CLIMA_NO_DISPONIBLE: &str = "No pudimos cargar el clima. Intenta de nuevo más tarde.";
/// Aviso del widget cuando el servicio de noticias no responde (HE-04-HU06-CA03, ET05).
// HE-04-HU08 · Agregar el widget Carrusel de imágenes (IPC-WID-04).
/// `carousel.too_few` (CA03, ET07): texto de «Agregar» deshabilitada.
pub const CARRUSEL_POCAS_IMAGENES: &str = "Selecciona al menos 2 imágenes para el carrusel.";
/// `carousel.too_many` (CA04, ET06): texto de «Subir imagen» y «Catálogo de imágenes» deshabilitadas.
pub const CARRUSEL_DEMASIADAS_IMAGENES: &str = "Puedes agregar máximo 10 imágenes al carrusel.";
/// `interval.out_of_range` (CA07).
pub const INTERVALO_FUERA_DE_RANGO: &str = "El intervalo debe estar entre 3 y 60 segundos.";
/// HE-04-HU09-CA04, ET07: junto a la Animación en pausa, en la pantalla Widgets.
pub const ANIMACION_EN_PAUSA: &str = "En pausa por alto consumo de recursos.";
/// `text.too_long` (HE-04-HU10-CA03, ET05).
pub const TEXTO_MUY_LARGO: &str = "El texto no puede superar los 200 caracteres.";
/// HE-04-HU11-CA03, ET07: el widget Reproductor de música sin sesión; también `media.no_session` (IPC-MED-02).
pub const SIN_MUSICA: &str = "No hay música en reproducción.";
pub const NOTICIAS_NO_DISPONIBLES: &str =
    "No pudimos cargar las noticias. Intenta de nuevo más tarde.";
/// Aviso de un widget externo sin conexión (CA08, ET08; HE-15-HU02-CA06).
pub const WIDGET_EXTERNO_SIN_CONEXION: &str =
    "Sin conexión. El widget se actualizará al reconectarte.";

// HE-16-HU03 · Cerrar sesión desde la pantalla Configuración (IPC-AUTH-13, IPC-AUTH-14).

/// Resultado de `auth_sign_out` (HE-16-HU03-CA01, CA04).
pub const SESION_CERRADA: &str = "Sesión cerrada.";
/// M-11 Confirmación de cerrar sesión (HE-16-HU03-CA05, ET02).
pub const DESEAS_CERRAR_SESION: &str = "¿Deseas cerrar sesión?";
/// M-12 Confirmación de cerrar sesión con cambios sin sincronizar (HE-16-HU03-CA03, ET05).
pub const CAMBIOS_SIN_SINCRONIZAR_AL_CERRAR_SESION: &str =
    "Tienes cambios sin sincronizar. Si cierras sesión ahora, se perderán. ¿Deseas cerrar sesión?";

// HE-16-HU02 · Alternar el inicio automático en la pantalla Configuración (IPC-DESK-10, IPC-DESK-11; INT-08).

/// Resultado de `autostart_set` al activar (HE-16-HU02-CA02).
pub const INICIO_AUTOMATICO_ACTIVADO: &str = "Inicio automático activado.";
/// Resultado de `autostart_set` al desactivar (HE-16-HU02-CA01).
pub const INICIO_AUTOMATICO_DESACTIVADO: &str = "Inicio automático desactivado.";
/// `autostart.failed` (HE-16-HU02-CA05, ET09).
pub const NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO: &str =
    "No pudimos cambiar el inicio automático. Intenta de nuevo.";

// HE-17-HU03 · Salir de la aplicación desde el ícono del área de notificación (IPC-DESK-07, IPC-DESK-08).

/// Confirmación al salir con cambios sin guardar en la vista previa (HE-17-HU03-CA02, ET06).
pub const SALIR_SIN_GUARDAR: &str = "Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?";

// HE-14-HU01 · Conversar por chat de texto con el agente de IA (IPC-WIN-01, IPC-WIN-02).

/// `message.too_long` (HE-14-HU01-CA05; ET04).
pub const MENSAJE_MUY_LARGO: &str = "Tu mensaje no puede superar los 2000 caracteres.";
/// `net.offline` y aviso de la pantalla Agente de IA sin conexión (HE-14-HU01-CA07; ET13).
pub const WINDI_SIN_CONEXION: &str =
    "El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes.";
/// `windi.unavailable`: tiempo agotado, cuota o error del servicio (HE-14-HU01-CA08; ET16).
pub const WINDI_NO_DISPONIBLE: &str = "No pude responder en este momento. Intenta de nuevo.";
/// Saludo del agente de IA (HE-14-HU01-ET07 a ET10). DUDA: HE-14-HU01 el texto no es literal (ET09 da un
/// ejemplo). Valor usado: alias, nombre «Windi» y oferta de ayuda, con la personalidad de HE-14-HU02.
pub const WINDI_SALUDO: &str =
    "¡Hola, <alias>! Soy Windi. ¿Qué organizamos hoy con tus tarjetas o con la aplicación?";
/// Celebración al completar una tarjeta desde una propuesta (HE-14-HU02-CA02, ET03, ET08; HE-14-HU06-CA02).
/// DUDA: HE-14-HU02 el texto no es literal. Valor usado: una frase breve con el alias y un solo emoji (ET07).
pub const WINDI_CELEBRACION: &str = "¡Bien hecho, <alias>! 🎉 Ya está en Hecho.";

// HE-14-HU03 · Confirmar una propuesta del agente de IA (IPC-WIN-03, IPC-WIN-04).

/// `net.offline` al confirmar (HE-14-HU03-CA02, ET07; HE-14-HU04-CA07).
pub const WINDI_SIN_CONEXION_AL_CONFIRMAR: &str =
    "Se perdió la conexión. No se hizo ningún cambio.";
/// Respuestas de Windi al confirmar o rechazar. DUDA: HE-14-HU03 los textos no son literales. Valor usado: frases
/// breves con la personalidad de HE-14-HU02.
pub const WINDI_CAMBIO_HECHO: &str = "Listo, ya hice el cambio.";
pub const WINDI_PROPUESTA_RECHAZADA: &str =
    "Entendido, no hice ningún cambio. ¿Quieres cambiar algo de la propuesta?";
/// HE-14-HU03-CA03, ET06: qué cambió desde la propuesta.
pub const WINDI_PROPUESTA_DESACTUALIZADA: &str =
    "No hice ningún cambio porque tus tarjetas cambiaron desde que te lo propuse: <cambios>.";
pub const WINDI_PROPUESTA_NUEVA: &str = "Esta es la propuesta con los datos actuales. ¿Confirmas?";
// HE-14-HU04 · Crear tarjetas con el agente de IA. DUDA: HE-14-HU04 los textos no son literales («confirma la
// creación mencionando el título», «confirma la cantidad de tarjetas creadas»).
pub const WINDI_TARJETA_CREADA: &str = "Listo, creé la tarjeta «<título>».";
pub const WINDI_TARJETAS_CREADAS: &str = "Listo, creé <cantidad> tarjetas.";
// HE-14-HU05 · Editar tarjetas con el agente de IA.
/// Aviso en la propuesta de editar una tarjeta completada (HE-14-HU05-CA06, ET05).
pub const WINDI_EDITAR_COMPLETADA: &str =
    "Esta tarjeta está completada. Editarla no cambia su columna.";
/// DUDA: HE-14-HU05 el texto no es literal («confirma el cambio mencionando el título»).
pub const WINDI_TARJETA_ACTUALIZADA: &str = "Listo, actualicé la tarjeta «<título>».";
// HE-14-HU06 · Mover tarjetas con el agente de IA.
/// Aviso en la propuesta de mover una tarjeta completada (HE-14-HU06-CA06, ET05).
pub const WINDI_MOVER_COMPLETADA: &str = "Esta tarjeta está completada. Si la mueves, dejará de estar completada y se borrará su fecha de completado.";
/// DUDA: HE-14-HU06 el texto no es literal («confirma el movimiento mencionando el título y la columna de destino»).
pub const WINDI_TARJETA_MOVIDA: &str = "Listo, moví la tarjeta «<título>» a <columna>.";
// HE-14-HU07 · Eliminar tarjetas con el agente de IA.
/// Aviso en toda propuesta de eliminación (HE-14-HU07-CA01, ET01).
pub const WINDI_ELIMINAR_SIN_DESHACER: &str = "Esta acción no se puede deshacer.";
/// Texto si alguna tarjeta está completada (HE-14-HU07-CA06, ET04).
pub const WINDI_ELIMINAR_COMPLETADA: &str =
    "Esta tarjeta está completada. Si la eliminas, dejará de contar en tus reportes.";
/// DUDA: HE-14-HU07 los textos no son literales («confirma la eliminación mencionando el título»).
pub const WINDI_TARJETA_ELIMINADA: &str = "Listo, eliminé la tarjeta «<título>».";
pub const WINDI_TARJETAS_ELIMINADAS: &str = "Listo, eliminé <cantidad> tarjetas.";
pub const WINDI_TARJETA_YA_NO_EXISTE: &str = "«<título>» ya no existe";
pub const WINDI_TARJETA_CAMBIO: &str = "«<título>» tiene otro valor en <campos>";

// P24 · Códigos sembrados con su mensaje (docs/DUDAS.md, sección P24). Cada HU los usa en su commit.

/// `theme.content_duplicate`: tema igual a otro (HE-03-HU02-CA08, ET13, ET14; HE-02-HU11-CA06, ET06).
pub const TEMA_CON_LAS_MISMAS_PROPIEDADES: &str =
    "Ya tienes el tema “<nombre del tema>” con estas mismas propiedades.";
/// `layout.widget_missing`: la pantalla de edición mueve o redimensiona un widget que ya no existe; la pantalla de
/// edición no se cierra (HE-05-HU04-ET06).
pub const WIDGET_YA_NO_EXISTE_EN_LA_EDICION: &str =
    "Uno de los widgets ya no existe. Vuelve a abrir la pantalla de edición.";
/// `auth.sign_out_failed`: no se pudo borrar el token al cerrar la sesión (HE-16-HU03-CA07, ET09).
pub const NO_PUDIMOS_CERRAR_LA_SESION: &str =
    "No pudimos cerrar la sesión. Cierra la aplicación y vuelve a intentarlo.";
/// `windi.card_not_found` (HE-14-HU03-ET10; HE-14-HU07-CA07).
pub const WINDI_TARJETA_NO_ENCONTRADA: &str =
    "No encuentro una tarjeta llamada “<nombre>”. ¿Me das más detalles?";
/// `windi.column_not_found` (HE-14-HU03-CA06, ET10).
pub const WINDI_COLUMNA_NO_ENCONTRADA: &str =
    "No encuentro la columna “<columna>”. Tus columnas son: <columnas en orden>.";
/// `windi.label_not_found` (HE-14-HU05-CA10; HE-14-HU03-ET10).
pub const WINDI_ETIQUETA_NO_ENCONTRADA: &str =
    "No tienes la etiqueta “<etiqueta>”. Tus etiquetas son: <etiquetas>.";
/// `windi.same_value` (HE-14-HU03-ET10).
pub const WINDI_MISMO_VALOR: &str = "La tarjeta “<título>” ya tiene ese valor.";
/// `windi.already_in_column` (HE-14-HU03-ET10).
pub const WINDI_YA_ESTA_EN_LA_COLUMNA: &str = "La tarjeta “<título>” ya está en <columna>.";
/// `windi.apply_failed`: la propuesta no se pudo aplicar completa (HE-14-HU03-CA07, ET12, ET13).
pub const WINDI_NO_PUDE_APLICAR: &str = "No pude aplicar los cambios. No se hizo ningún cambio.";

/// Todos los textos con el nombre de su constante: lo que se exporta a `messages.es.json`.
pub const TEXTOS: &[(&str, &str)] = &[
    ("SERVICIO_NO_DISPONIBLE", SERVICIO_NO_DISPONIBLE),
    ("CAMPO_OBLIGATORIO", CAMPO_OBLIGATORIO),
    (
        "PERSONALIZACION_REMOTA_CON_CAMBIOS",
        PERSONALIZACION_REMOTA_CON_CAMBIOS,
    ),
    ("ALIAS_MUY_LARGO", ALIAS_MUY_LARGO),
    ("CORREO_INVALIDO", CORREO_INVALIDO),
    ("CORREO_MUY_LARGO", CORREO_MUY_LARGO),
    ("CORREO_YA_REGISTRADO", CORREO_YA_REGISTRADO),
    ("CODIGO_ENVIADO", CODIGO_ENVIADO),
    ("SIN_CONEXION_REGISTRO", SIN_CONEXION_REGISTRO),
    ("DEMASIADOS_INTENTOS", DEMASIADOS_INTENTOS),
    ("CONTRASENA_INVALIDA", CONTRASENA_INVALIDA),
    ("CONTRASENAS_NO_COINCIDEN", CONTRASENAS_NO_COINCIDEN),
    ("BIENVENIDA", BIENVENIDA),
    ("CODIGO_INCORRECTO", CODIGO_INCORRECTO),
    ("CODIGO_VENCIDO", CODIGO_VENCIDO),
    ("CODIGO_REENVIADO", CODIGO_REENVIADO),
    ("REENVIO_EN_SEGUNDOS", REENVIO_EN_SEGUNDOS),
    ("CREDENCIALES_INCORRECTAS", CREDENCIALES_INCORRECTAS),
    ("SIN_CONEXION_INICIO", SIN_CONEXION_INICIO),
    ("GOOGLE_CANCELADO", GOOGLE_CANCELADO),
    (
        "CODIGO_DE_RECUPERACION_ENVIADO",
        CODIGO_DE_RECUPERACION_ENVIADO,
    ),
    ("SIN_CONEXION_RECUPERAR", SIN_CONEXION_RECUPERAR),
    ("CONTRASENA_ACTUALIZADA", CONTRASENA_ACTUALIZADA),
    ("CONTRASENA_IGUAL_A_LA_ACTUAL", CONTRASENA_IGUAL_A_LA_ACTUAL),
    ("GOOGLE_ERROR", GOOGLE_ERROR),
    ("GOOGLE_CORREO_MUY_LARGO", GOOGLE_CORREO_MUY_LARGO),
    ("TARJETA_CREADA", TARJETA_CREADA),
    ("TITULO_MUY_LARGO", TITULO_MUY_LARGO),
    ("FECHA_INVALIDA", FECHA_INVALIDA),
    ("FECHA_LIMITE_ANTERIOR_A_HOY", FECHA_LIMITE_ANTERIOR_A_HOY),
    ("DESCRIPCION_MUY_LARGA", DESCRIPCION_MUY_LARGA),
    ("MAXIMO_ETIQUETAS", MAXIMO_ETIQUETAS),
    ("TARJETA_NO_EXISTE", TARJETA_NO_EXISTE),
    ("COLUMNA_CREADA", COLUMNA_CREADA),
    ("NOMBRE_DE_COLUMNA_MUY_LARGO", NOMBRE_DE_COLUMNA_MUY_LARGO),
    ("COLUMNA_DUPLICADA", COLUMNA_DUPLICADA),
    ("MAXIMO_DE_COLUMNAS", MAXIMO_DE_COLUMNAS),
    ("COLUMNA_ACTUALIZADA", COLUMNA_ACTUALIZADA),
    ("CONFIRMAR_ELIMINAR_COLUMNA", CONFIRMAR_ELIMINAR_COLUMNA),
    (
        "CONFIRMAR_ELIMINAR_COLUMNA_CON_TARJETAS",
        CONFIRMAR_ELIMINAR_COLUMNA_CON_TARJETAS,
    ),
    ("COLUMNA_ELIMINADA", COLUMNA_ELIMINADA),
    (
        "COLUMNA_POR_DEFECTO_NO_ELIMINABLE",
        COLUMNA_POR_DEFECTO_NO_ELIMINABLE,
    ),
    ("INICIO_POSTERIOR_AL_FIN", INICIO_POSTERIOR_AL_FIN),
    ("RANGO_MUY_LARGO", RANGO_MUY_LARGO),
    ("ETIQUETA_CREADA", ETIQUETA_CREADA),
    ("ETIQUETA_ACTUALIZADA", ETIQUETA_ACTUALIZADA),
    ("CONFIRMAR_ELIMINAR_ETIQUETA", CONFIRMAR_ELIMINAR_ETIQUETA),
    (
        "CONFIRMAR_ELIMINAR_ETIQUETA_EN_TARJETAS",
        CONFIRMAR_ELIMINAR_ETIQUETA_EN_TARJETAS,
    ),
    (
        "CONFIRMAR_ELIMINAR_ETIQUETA_EN_UNA_TARJETA",
        CONFIRMAR_ELIMINAR_ETIQUETA_EN_UNA_TARJETA,
    ),
    ("ETIQUETA_ELIMINADA", ETIQUETA_ELIMINADA),
    ("NOMBRE_DE_ETIQUETA_MUY_LARGO", NOMBRE_DE_ETIQUETA_MUY_LARGO),
    ("ETIQUETA_DUPLICADA", ETIQUETA_DUPLICADA),
    ("MAXIMO_DE_ETIQUETAS_CREADAS", MAXIMO_DE_ETIQUETAS_CREADAS),
    ("TARJETA_ACTUALIZADA", TARJETA_ACTUALIZADA),
    (
        "TARJETA_ACTUALIZADA_SIN_BLOQUE",
        TARJETA_ACTUALIZADA_SIN_BLOQUE,
    ),
    ("TARJETA_ELIMINADA", TARJETA_ELIMINADA),
    ("TARJETA_COMPLETADA", TARJETA_COMPLETADA),
    ("COMPLETASTE_TODAS", COMPLETASTE_TODAS),
    ("NO_CREAR_EN_DIAS_PASADOS", NO_CREAR_EN_DIAS_PASADOS),
    (
        "CAMBIOS_SIN_GUARDAR_AL_CAMBIAR_DE_TEMA",
        CAMBIOS_SIN_GUARDAR_AL_CAMBIAR_DE_TEMA,
    ),
    ("TARJETA_ASIGNADA_AL_BLOQUE", TARJETA_ASIGNADA_AL_BLOQUE),
    ("TARJETA_QUITADA_DEL_HORARIO", TARJETA_QUITADA_DEL_HORARIO),
    (
        "FORMATO_DE_IMAGEN_NO_PERMITIDO",
        FORMATO_DE_IMAGEN_NO_PERMITIDO,
    ),
    ("IMAGEN_MUY_GRANDE", IMAGEN_MUY_GRANDE),
    ("IMAGEN_ILEGIBLE", IMAGEN_ILEGIBLE),
    ("CAMBIOS_GUARDADOS_EN_EL_TEMA", CAMBIOS_GUARDADOS_EN_EL_TEMA),
    (
        "CAMBIOS_GUARDADOS_EN_EL_TEMA_APLICADO",
        CAMBIOS_GUARDADOS_EN_EL_TEMA_APLICADO,
    ),
    ("SIN_CAMBIOS_PARA_GUARDAR", SIN_CAMBIOS_PARA_GUARDAR),
    (
        "NO_SE_PUDO_MOSTRAR_EL_WALLPAPER",
        NO_SE_PUDO_MOSTRAR_EL_WALLPAPER,
    ),
    ("TEMA_APLICADO", TEMA_APLICADO),
    ("TEMA_GUARDADO_Y_APLICADO", TEMA_GUARDADO_Y_APLICADO),
    (
        "CAMBIOS_APLICADOS_SIN_GUARDAR",
        CAMBIOS_APLICADOS_SIN_GUARDAR,
    ),
    (
        "CAMBIOS_SIN_GUARDAR_AL_APLICAR",
        CAMBIOS_SIN_GUARDAR_AL_APLICAR,
    ),
    ("TEMA_YA_APLICADO", TEMA_YA_APLICADO),
    ("WIDGET_ELIMINADO", WIDGET_ELIMINADO),
    ("INSTRUCCION_DE_EDICION", INSTRUCCION_DE_EDICION),
    ("CAMBIOS_GUARDADOS", CAMBIOS_GUARDADOS),
    ("DISTRIBUCION_NO_GUARDADA", DISTRIBUCION_NO_GUARDADA),
    (
        "WIDGET_POR_DEFECTO_NO_ELIMINABLE",
        WIDGET_POR_DEFECTO_NO_ELIMINABLE,
    ),
    ("CONFIRMAR_ELIMINAR_WIDGET", CONFIRMAR_ELIMINAR_WIDGET),
    ("FONDO_YA_POR_DEFECTO", FONDO_YA_POR_DEFECTO),
    ("NO_SE_GUARDARON_CAMBIOS", NO_SE_GUARDARON_CAMBIOS),
    ("TEMA_GUARDADO", TEMA_GUARDADO),
    ("CONFIRMAR_APLICAR_TEMA", CONFIRMAR_APLICAR_TEMA),
    ("NOMBRE_DE_TEMA_MUY_LARGO", NOMBRE_DE_TEMA_MUY_LARGO),
    ("TEMA_DUPLICADO", TEMA_DUPLICADO),
    ("TEMA_RENOMBRADO", TEMA_RENOMBRADO),
    ("CONFIRMAR_ELIMINAR_TEMA", CONFIRMAR_ELIMINAR_TEMA),
    ("TEMA_ELIMINADO", TEMA_ELIMINADO),
    ("TEMA_APLICADO_NO_SE_ELIMINA", TEMA_APLICADO_NO_SE_ELIMINA),
    ("MAXIMO_DE_TEMAS", MAXIMO_DE_TEMAS),
    (
        "CAMBIOS_APLICADOS_SIN_GUARDAR_AL_SALIR",
        CAMBIOS_APLICADOS_SIN_GUARDAR_AL_SALIR,
    ),
    ("COLOR_INVALIDO", COLOR_INVALIDO),
    ("CONTRASTE_BAJO", CONTRASTE_BAJO),
    ("BLOQUE_YA_PASO", BLOQUE_YA_PASO),
    (
        "BLOQUE_DESPUES_DE_FECHA_LIMITE",
        BLOQUE_DESPUES_DE_FECHA_LIMITE,
    ),
    ("WIDGET_YA_AGREGADO", WIDGET_YA_AGREGADO),
    ("CIUDAD_NO_ENCONTRADA", CIUDAD_NO_ENCONTRADA),
    ("CIUDAD_DUPLICADA", CIUDAD_DUPLICADA),
    ("CIUDAD_MUY_LARGA", CIUDAD_MUY_LARGA),
    ("CIUDAD_SIN_CONEXION", CIUDAD_SIN_CONEXION),
    ("CLIMA_NO_DISPONIBLE", CLIMA_NO_DISPONIBLE),
    ("NOTICIAS_NO_DISPONIBLES", NOTICIAS_NO_DISPONIBLES),
    ("SIN_MUSICA", SIN_MUSICA),
    ("TEXTO_MUY_LARGO", TEXTO_MUY_LARGO),
    ("ANIMACION_EN_PAUSA", ANIMACION_EN_PAUSA),
    ("CARRUSEL_POCAS_IMAGENES", CARRUSEL_POCAS_IMAGENES),
    ("CARRUSEL_DEMASIADAS_IMAGENES", CARRUSEL_DEMASIADAS_IMAGENES),
    ("INTERVALO_FUERA_DE_RANGO", INTERVALO_FUERA_DE_RANGO),
    ("WIDGET_EXTERNO_SIN_CONEXION", WIDGET_EXTERNO_SIN_CONEXION),
    ("SESION_CERRADA", SESION_CERRADA),
    ("DESEAS_CERRAR_SESION", DESEAS_CERRAR_SESION),
    (
        "CAMBIOS_SIN_SINCRONIZAR_AL_CERRAR_SESION",
        CAMBIOS_SIN_SINCRONIZAR_AL_CERRAR_SESION,
    ),
    ("INICIO_AUTOMATICO_ACTIVADO", INICIO_AUTOMATICO_ACTIVADO),
    (
        "INICIO_AUTOMATICO_DESACTIVADO",
        INICIO_AUTOMATICO_DESACTIVADO,
    ),
    (
        "NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO",
        NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO,
    ),
    ("SALIR_SIN_GUARDAR", SALIR_SIN_GUARDAR),
    ("MENSAJE_MUY_LARGO", MENSAJE_MUY_LARGO),
    ("WINDI_SIN_CONEXION", WINDI_SIN_CONEXION),
    ("WINDI_NO_DISPONIBLE", WINDI_NO_DISPONIBLE),
    ("WINDI_SALUDO", WINDI_SALUDO),
    ("WINDI_CELEBRACION", WINDI_CELEBRACION),
    (
        "WINDI_SIN_CONEXION_AL_CONFIRMAR",
        WINDI_SIN_CONEXION_AL_CONFIRMAR,
    ),
    ("WINDI_CAMBIO_HECHO", WINDI_CAMBIO_HECHO),
    ("WINDI_PROPUESTA_RECHAZADA", WINDI_PROPUESTA_RECHAZADA),
    (
        "WINDI_PROPUESTA_DESACTUALIZADA",
        WINDI_PROPUESTA_DESACTUALIZADA,
    ),
    ("WINDI_PROPUESTA_NUEVA", WINDI_PROPUESTA_NUEVA),
    ("WINDI_TARJETA_YA_NO_EXISTE", WINDI_TARJETA_YA_NO_EXISTE),
    ("WINDI_TARJETA_CAMBIO", WINDI_TARJETA_CAMBIO),
    (
        "TEMA_CON_LAS_MISMAS_PROPIEDADES",
        TEMA_CON_LAS_MISMAS_PROPIEDADES,
    ),
    (
        "WIDGET_YA_NO_EXISTE_EN_LA_EDICION",
        WIDGET_YA_NO_EXISTE_EN_LA_EDICION,
    ),
    ("NO_PUDIMOS_CERRAR_LA_SESION", NO_PUDIMOS_CERRAR_LA_SESION),
    ("WINDI_TARJETA_NO_ENCONTRADA", WINDI_TARJETA_NO_ENCONTRADA),
    ("WINDI_COLUMNA_NO_ENCONTRADA", WINDI_COLUMNA_NO_ENCONTRADA),
    ("WINDI_ETIQUETA_NO_ENCONTRADA", WINDI_ETIQUETA_NO_ENCONTRADA),
    ("WINDI_MISMO_VALOR", WINDI_MISMO_VALOR),
    ("WINDI_YA_ESTA_EN_LA_COLUMNA", WINDI_YA_ESTA_EN_LA_COLUMNA),
    ("WINDI_NO_PUDE_APLICAR", WINDI_NO_PUDE_APLICAR),
];

#[cfg(test)]
mod pruebas {
    use super::TEXTOS;

    /// Exporta los textos a `src/types/messages.es.json` (DP-01). El paso `tipos` de la CI comprueba que el
    /// archivo del repositorio sea el mismo que sale de aquí.
    #[test]
    fn exportar_messages_es_json() {
        let mapa: serde_json::Map<String, serde_json::Value> = TEXTOS
            .iter()
            .map(|(clave, texto)| (clave.to_string(), serde_json::Value::from(*texto)))
            .collect();
        assert_eq!(mapa.len(), TEXTOS.len(), "hay claves repetidas en TEXTOS");
        let json = serde_json::to_string_pretty(&mapa).unwrap() + "\n";
        let ruta = concat!(env!("CARGO_MANIFEST_DIR"), "/../src/types/messages.es.json");
        std::fs::write(ruta, json).unwrap();
    }
}
