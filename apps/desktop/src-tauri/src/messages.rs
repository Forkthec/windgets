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

// HE-11-HU02 · Asignar una tarjeta a un bloque horario (IPC-CARD-10 card_assign_time_block).

/// Resultado de `card_assign_time_block` (HE-11-HU02-CA01, CA03; ET09, D-169).
pub const TARJETA_ASIGNADA_AL_BLOQUE: &str =
    "Tarjeta asignada al bloque <hora de inicio> – <hora de fin>.";
/// `time_block.past` (HE-11-HU02-CA04; ET10).
pub const BLOQUE_YA_PASO: &str = "No puedes asignar tarjetas a un bloque horario que ya pasó.";
/// `time_block.after_due_date` (HE-11-HU02-CA05; ET11).
pub const BLOQUE_DESPUES_DE_FECHA_LIMITE: &str =
    "No puedes programar la tarjeta después de su fecha límite.";

// HE-08-HU02 · Crear una etiqueta con nombre y color (IPC-LABEL-02 label_create).

/// Resultado de `label_create` (HE-08-HU02-CA01, CA08; ET09).
pub const ETIQUETA_CREADA: &str = "Etiqueta creada.";
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

/// Un texto de HE-02-HU12 con el nombre del tema.
pub fn con_nombre_del_tema(texto: &str, nombre: &str) -> String {
    texto.replace("<nombre del tema>", nombre)
}

/// Opción deshabilitada del catálogo de widgets: Noticias o Reproductor de música ya agregados (HE-04-HU04-CA02,
/// RT-04).
pub const WIDGET_YA_AGREGADO: &str = "Ya agregaste este widget.";

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

/// Todos los textos con el nombre de su constante: lo que se exporta a `messages.es.json`.
pub const TEXTOS: &[(&str, &str)] = &[
    ("SERVICIO_NO_DISPONIBLE", SERVICIO_NO_DISPONIBLE),
    ("CAMPO_OBLIGATORIO", CAMPO_OBLIGATORIO),
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
    ("INICIO_POSTERIOR_AL_FIN", INICIO_POSTERIOR_AL_FIN),
    ("RANGO_MUY_LARGO", RANGO_MUY_LARGO),
    ("ETIQUETA_CREADA", ETIQUETA_CREADA),
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
    (
        "CAMBIOS_SIN_GUARDAR_AL_CAMBIAR_DE_TEMA",
        CAMBIOS_SIN_GUARDAR_AL_CAMBIAR_DE_TEMA,
    ),
    ("TARJETA_ASIGNADA_AL_BLOQUE", TARJETA_ASIGNADA_AL_BLOQUE),
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
    ("BLOQUE_YA_PASO", BLOQUE_YA_PASO),
    (
        "BLOQUE_DESPUES_DE_FECHA_LIMITE",
        BLOQUE_DESPUES_DE_FECHA_LIMITE,
    ),
    ("WIDGET_YA_AGREGADO", WIDGET_YA_AGREGADO),
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
