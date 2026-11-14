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
