//! Servicio de sesión (arquitectura.md, vista 3b, Núcleo · servicios que usan la nube).
//! Responsabilidad: «Registro, inicio con correo o Google (PKCE), recuperación y renovación del JWT;
//! guarda el token con DPAPI y lo borra al cerrar sesión.»
//!
//! Las reglas de los formularios de cuenta viven aquí (D-188): la vista las repite para mostrar los mensajes al
//! instante y el Núcleo las vuelve a comprobar. `Err` trae un solo `AppError` (tipos.ts), así que el Núcleo
//! devuelve el primer error en el orden de la pantalla; la vista muestra todos a la vez (RT-04).

use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::cliente_de_supabase::{AuthDeSupabase, FallaDeAuth};
use crate::messages;
use crate::tipos::{
    AppError, AuthRegisterStartParams, AuthRegisterStartResult, CodeSent, ErrorCode, Instant,
    ResultMessage,
};

/// Largo máximo del alias (HE-01-HU01-ET03, D-023).
pub const ALIAS_MAX: usize = 30;
/// Largo máximo del correo electrónico (HE-01-HU01-ET07, glosario: Cuenta).
pub const CORREO_MAX: usize = 64;
/// Vigencia del código de verificación: 10 minutos (HE-01-HU03-ET03, RNF-25).
pub const VIGENCIA_DEL_CODIGO_MS: i64 = 600_000;
/// Reenvío del código a los 60 segundos del último envío (HE-01-HU03-ET05, RNF-25).
pub const ESPERA_DE_REENVIO_MS: i64 = 60_000;

/// Hora del Núcleo en milisegundos desde 1970 (UTC). Las pruebas la controlan.
pub trait Reloj: Send + Sync {
    fn ahora_ms(&self) -> i64;
}

/// La hora del sistema.
pub struct RelojDelSistema;

impl Reloj for RelojDelSistema {
    fn ahora_ms(&self) -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
            .unwrap_or_default()
    }
}

/// `Instant` en ISO 8601 UTC con milisegundos y `Z` (contratos.md, 1.2).
pub fn instante(ms: i64) -> Instant {
    let (dias, resto) = (ms.div_euclid(86_400_000), ms.rem_euclid(86_400_000));
    // Días desde 1970-01-01 a fecha civil (algoritmo de H. Hinnant, calendario gregoriano proléptico).
    let z = dias + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let dia = doy - (153 * mp + 2) / 5 + 1;
    let mes = if mp < 10 { mp + 3 } else { mp - 9 };
    let anio = yoe + era * 400 + i64::from(mes <= 2);
    let (h, m, s, mil) = (
        resto / 3_600_000,
        resto / 60_000 % 60,
        resto / 1_000 % 60,
        resto % 1_000,
    );
    Instant(format!(
        "{anio:04}-{mes:02}-{dia:02}T{h:02}:{m:02}:{s:02}.{mil:03}Z"
    ))
}

fn error(code: ErrorCode, message: &str, field: Option<&str>) -> AppError {
    AppError {
        code,
        message: message.to_string(),
        field: field.map(str::to_string),
        params: None,
    }
}

/// Un campo vacío o formado solo por espacios (HE-01-HU01-ET02; RT-04-ET21).
fn vacio(valor: &str) -> bool {
    valor.trim().is_empty()
}

/// Alias (HE-01-HU01-ET02 a ET04): obligatorio, de 1 a 30 caracteres y no único (sin comprobación de repetidos).
pub fn validar_alias(alias: &str) -> Option<AppError> {
    if vacio(alias) {
        return Some(error(
            ErrorCode::AliasRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("alias"),
        ));
    }
    (alias.trim().chars().count() > ALIAS_MAX).then(|| {
        error(
            ErrorCode::AliasTooLong,
            messages::ALIAS_MUY_LARGO,
            Some("alias"),
        )
    })
}

/// Formato usuario@dominio.ext (HE-01-HU01-ET06): una sola `@`, sin espacios, y un dominio con al menos un
/// punto entre partes no vacías.
pub fn formato_de_correo(correo: &str) -> bool {
    let Some((usuario, dominio)) = correo.split_once('@') else {
        return false;
    };
    let partes: Vec<&str> = dominio.split('.').collect();
    !usuario.is_empty()
        && !dominio.contains('@')
        && !correo.chars().any(char::is_whitespace)
        && partes.len() >= 2
        && partes.iter().all(|p| !p.is_empty())
}

/// Correo electrónico (HE-01-HU01-ET05 a ET07; HE-01-HU04-ET02, ET04, ET05): obligatorio, de máximo 64
/// caracteres y con formato usuario@dominio.ext. Se valida sin espacios al inicio ni al final (ET14).
pub fn validar_correo(correo: &str) -> Option<AppError> {
    let correo = correo.trim();
    if correo.is_empty() {
        return Some(error(
            ErrorCode::EmailRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("email"),
        ));
    }
    if correo.chars().count() > CORREO_MAX {
        return Some(error(
            ErrorCode::EmailTooLong,
            messages::CORREO_MUY_LARGO,
            Some("email"),
        ));
    }
    (!formato_de_correo(correo)).then(|| {
        error(
            ErrorCode::EmailInvalid,
            messages::CORREO_INVALIDO,
            Some("email"),
        )
    })
}

/// Largo de la contraseña: de 8 a 64 caracteres (HE-01-HU02-ET02).
pub const CONTRASENA_MIN: usize = 8;
pub const CONTRASENA_MAX: usize = 64;

/// Contraseña (HE-01-HU02-ET01 a ET03): obligatoria, de 8 a 64 caracteres y con al menos una mayúscula, una
/// minúscula y un número. Las clases son las de Supabase Auth (letras A-Z y a-z, dígitos 0-9), para que el
/// Núcleo y el servidor acepten lo mismo. No se recorta: los espacios forman parte de la contraseña.
pub fn validar_contrasena(contrasena: &str) -> Option<AppError> {
    if vacio(contrasena) {
        return Some(error(
            ErrorCode::PasswordRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("password"),
        ));
    }
    let largo = contrasena.chars().count();
    let valida = (CONTRASENA_MIN..=CONTRASENA_MAX).contains(&largo)
        && contrasena.chars().any(|c| c.is_ascii_uppercase())
        && contrasena.chars().any(|c| c.is_ascii_lowercase())
        && contrasena.chars().any(|c| c.is_ascii_digit());
    (!valida).then(|| {
        error(
            ErrorCode::PasswordInvalid,
            messages::CONTRASENA_INVALIDA,
            Some("password"),
        )
    })
}

/// Confirmar contraseña (HE-01-HU02-ET04, ET05): obligatoria e idéntica a la contraseña.
pub fn validar_confirmacion(contrasena: &str, confirmacion: &str) -> Option<AppError> {
    if vacio(confirmacion) {
        return Some(error(
            ErrorCode::PasswordConfirmationRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("password_confirmation"),
        ));
    }
    (confirmacion != contrasena).then(|| {
        error(
            ErrorCode::PasswordConfirmationMismatch,
            messages::CONTRASENAS_NO_COINCIDEN,
            Some("password_confirmation"),
        )
    })
}

/// Errores de forma del formulario de Registro, todos a la vez y en el orden de la pantalla.
pub fn validar_registro(params: &AuthRegisterStartParams) -> Vec<AppError> {
    [
        validar_alias(&params.alias),
        validar_correo(&params.email),
        validar_contrasena(&params.password),
        validar_confirmacion(&params.password, &params.password_confirmation),
    ]
    .into_iter()
    .flatten()
    .collect()
}

/// Registro que espera el código de verificación (IPC-AUTH-04: vive solo en la memoria del Núcleo).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegistroPendiente {
    pub alias: String,
    pub correo: String,
    pub enviado_ms: i64,
}

/// Respuesta correcta de un comando con su mensaje de resultado (contratos.md, 1.3: `Ok.result_message`).
#[derive(Debug, Clone, PartialEq)]
pub struct ConMensaje<T> {
    pub valor: T,
    pub mensaje: ResultMessage,
}

fn resultado(code: &str, message: &str) -> ResultMessage {
    ResultMessage {
        code: code.to_string(),
        message: message.to_string(),
        params: None,
    }
}

/// Fallas de Supabase comunes a los flujos de cuenta: sin red, sin respuesta y exceso de solicitudes.
fn falla_comun(falla: &FallaDeAuth, sin_conexion: &str) -> Option<AppError> {
    match falla {
        FallaDeAuth::SinConexion => Some(error(ErrorCode::NetOffline, sin_conexion, None)),
        FallaDeAuth::SinRespuesta => Some(error(
            ErrorCode::ServiceUnavailable,
            messages::SERVICIO_NO_DISPONIBLE,
            None,
        )),
        FallaDeAuth::Rechazo { estado: 429, .. } => Some(error(
            ErrorCode::AuthRateLimited,
            messages::DEMASIADOS_INTENTOS,
            None,
        )),
        FallaDeAuth::Rechazo { .. } => None,
    }
}

/// Un rechazo que ningún CA prevé (por ejemplo, una regla de Supabase distinta de la configurada): error
/// genérico sin texto (contratos.md, 1.3; DP-02).
fn inesperado() -> AppError {
    error(ErrorCode::InternalUnexpected, "", None)
}

/// Servicio de sesión con su cliente de Supabase Auth y su reloj.
pub struct ServicioDeSesion<A, R> {
    auth: A,
    reloj: R,
    pendiente: Mutex<Option<RegistroPendiente>>,
}

impl<A: AuthDeSupabase, R: Reloj> ServicioDeSesion<A, R> {
    pub fn nuevo(auth: A, reloj: R) -> Self {
        Self {
            auth,
            reloj,
            pendiente: Mutex::new(None),
        }
    }

    pub fn auth(&self) -> &A {
        &self.auth
    }

    pub fn registro_pendiente(&self) -> Option<RegistroPendiente> {
        self.pendiente.lock().ok().and_then(|p| p.clone())
    }

    fn fijar_pendiente(&self, registro: Option<RegistroPendiente>) {
        if let Ok(mut pendiente) = self.pendiente.lock() {
            *pendiente = registro;
        }
    }

    /// IPC-AUTH-01 `auth_register_start`: valida, comprueba que el correo no esté registrado (RPC-05) y pide
    /// el código. No crea la cuenta todavía (HE-01-HU01-CA01, HE-01-HU03-ET09).
    pub async fn registrar_inicio(
        &self,
        params: AuthRegisterStartParams,
    ) -> Result<ConMensaje<AuthRegisterStartResult>, AppError> {
        if let Some(primero) = validar_registro(&params).into_iter().next() {
            return Err(primero);
        }
        let alias = params.alias.trim().to_string();
        let correo = params.email.trim().to_string();
        let falla = |f: FallaDeAuth| {
            falla_comun(&f, messages::SIN_CONEXION_REGISTRO).unwrap_or_else(inesperado)
        };
        if self.auth.correo_registrado(&correo).await.map_err(falla)? {
            return Err(error(
                ErrorCode::EmailAlreadyRegistered,
                messages::CORREO_YA_REGISTRADO,
                None,
            ));
        }
        self.auth
            .registrar(&correo, &params.password, &alias)
            .await
            .map_err(falla)?;
        let enviado_ms = self.reloj.ahora_ms();
        self.fijar_pendiente(Some(RegistroPendiente {
            alias,
            correo,
            enviado_ms,
        }));
        Ok(ConMensaje {
            valor: AuthRegisterStartResult {
                base_code_sent: CodeSent {
                    resend_available_at: instante(enviado_ms + ESPERA_DE_REENVIO_MS),
                },
                expires_at: instante(enviado_ms + VIGENCIA_DEL_CODIGO_MS),
            },
            mensaje: resultado("auth_register_start", messages::CODIGO_ENVIADO),
        })
    }
}

#[cfg(test)]
pub(crate) mod pruebas {
    use super::*;
    use std::future::Future;
    use std::pin::pin;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicI64, Ordering};
    use std::task::{Context, Poll, Waker};

    /// Espera un futuro que ya está listo (los dobles responden sin red).
    pub(crate) fn esperar<F: Future>(futuro: F) -> F::Output {
        let mut futuro = pin!(futuro);
        let mut contexto = Context::from_waker(Waker::noop());
        loop {
            if let Poll::Ready(valor) = futuro.as_mut().poll(&mut contexto) {
                return valor;
            }
        }
    }

    /// Reloj de prueba que se adelanta a mano.
    #[derive(Clone, Default)]
    pub(crate) struct RelojDePrueba(pub Arc<AtomicI64>);

    impl RelojDePrueba {
        pub(crate) fn adelantar(&self, ms: i64) {
            self.0.fetch_add(ms, Ordering::Relaxed);
        }
    }

    impl Reloj for RelojDePrueba {
        fn ahora_ms(&self) -> i64 {
            self.0.load(Ordering::Relaxed)
        }
    }

    /// Doble de Supabase Auth: cuentas verificadas, una falla forzada y registro de llamadas.
    #[derive(Default)]
    pub(crate) struct AuthDePrueba {
        pub verificados: Vec<String>,
        pub falla: Mutex<Option<FallaDeAuth>>,
        pub llamadas: Mutex<Vec<String>>,
    }

    impl AuthDePrueba {
        pub(crate) fn con_verificado(correo: &str) -> Self {
            Self {
                verificados: vec![correo.to_string()],
                ..Self::default()
            }
        }

        pub(crate) fn fallar(&self, falla: FallaDeAuth) {
            *self.falla.lock().unwrap() = Some(falla);
        }

        pub(crate) fn llamadas(&self) -> Vec<String> {
            self.llamadas.lock().unwrap().clone()
        }

        fn anotar(&self, llamada: String) -> Result<(), FallaDeAuth> {
            self.llamadas.lock().unwrap().push(llamada);
            self.falla.lock().unwrap().clone().map_or(Ok(()), Err)
        }
    }

    impl AuthDeSupabase for AuthDePrueba {
        async fn correo_registrado(&self, correo: &str) -> Result<bool, FallaDeAuth> {
            self.anotar(format!("email_is_registered {correo}"))?;
            Ok(self
                .verificados
                .iter()
                .any(|v| v.eq_ignore_ascii_case(correo)))
        }

        async fn registrar(
            &self,
            correo: &str,
            _contrasena: &str,
            alias: &str,
        ) -> Result<(), FallaDeAuth> {
            self.anotar(format!("signup {correo} {alias}"))
        }
    }

    pub(crate) const REGISTRADO: &str = "usuario.prueba@example.com";

    pub(crate) fn servicio() -> (ServicioDeSesion<AuthDePrueba, RelojDePrueba>, RelojDePrueba) {
        let reloj = RelojDePrueba::default();
        reloj.adelantar(1_794_663_000_000); // 2026-11-14T13:30:00.000Z
        (
            ServicioDeSesion::nuevo(AuthDePrueba::con_verificado(REGISTRADO), reloj.clone()),
            reloj,
        )
    }

    pub(crate) fn formulario(alias: &str, email: &str) -> AuthRegisterStartParams {
        AuthRegisterStartParams {
            alias: alias.to_string(),
            email: email.to_string(),
            password: "Clave123".to_string(),
            password_confirmation: "Clave123".to_string(),
        }
    }

    /// El registro falla con este código y mensaje, en este campo, y no pide el código a Supabase.
    fn rechaza_sin_enviar(
        params: AuthRegisterStartParams,
        code: ErrorCode,
        message: &str,
        field: Option<&str>,
    ) {
        let (servicio, _) = servicio();
        let error = esperar(servicio.registrar_inicio(params)).unwrap_err();
        assert_eq!(
            (error.code, error.message.as_str(), error.field.as_deref()),
            (code, message, field)
        );
        assert!(
            !servicio
                .auth()
                .llamadas()
                .iter()
                .any(|l| l.starts_with("signup"))
        );
        assert_eq!(servicio.registro_pendiente(), None);
    }

    #[test]
    fn instante_en_iso_8601() {
        assert_eq!(instante(0).0, "1970-01-01T00:00:00.000Z");
        assert_eq!(instante(1_794_663_000_000).0, "2026-11-14T13:30:00.000Z");
        assert_eq!(instante(951_782_400_120).0, "2000-02-29T00:00:00.120Z");
    }

    #[test]
    fn ca_he_01_hu01_ca01() {
        // HE-01-HU01-CA01 · Enviar el código con datos válidos: pide el código, no crea la cuenta y devuelve el
        // mensaje literal. ET14: alias y correo sin espacios al inicio ni al final.
        let (servicio, _) = servicio();
        let r =
            esperar(servicio.registrar_inicio(formulario("  Ana  ", " ana@example.com "))).unwrap();
        assert_eq!(
            r.mensaje.message,
            "Te enviamos un código de verificación a tu correo. Diligéncialo para crear tu cuenta."
        );
        assert_eq!(
            r.valor.base_code_sent.resend_available_at.0,
            "2026-11-14T13:31:00.000Z"
        );
        assert_eq!(r.valor.expires_at.0, "2026-11-14T13:40:00.000Z");
        assert_eq!(
            servicio.auth().llamadas(),
            [
                "email_is_registered ana@example.com",
                "signup ana@example.com Ana"
            ]
        );
        let pendiente = servicio.registro_pendiente().unwrap();
        assert_eq!(
            (pendiente.alias.as_str(), pendiente.correo.as_str()),
            ("Ana", "ana@example.com")
        );
    }

    #[test]
    fn ca_he_01_hu01_ca02() {
        // HE-01-HU01-CA02 · Alias vacío o formado solo por espacios (ET02).
        for alias in ["", "    "] {
            rechaza_sin_enviar(
                formulario(alias, "ana@example.com"),
                ErrorCode::AliasRequired,
                "Este campo es obligatorio.",
                Some("alias"),
            );
        }
    }

    #[test]
    fn ca_he_01_hu01_ca03() {
        // HE-01-HU01-CA03 · Alias de más de 30 caracteres; 30 y 1 caracteres son válidos (ET03).
        rechaza_sin_enviar(
            formulario(&"á".repeat(31), "ana@example.com"),
            ErrorCode::AliasTooLong,
            "El alias no puede superar los 30 caracteres.",
            Some("alias"),
        );
        assert_eq!(validar_alias(&"á".repeat(30)), None);
        assert_eq!(validar_alias("A"), None);
    }

    #[test]
    fn ca_he_01_hu01_ca04() {
        // HE-01-HU01-CA04 · Un alias que ya tiene otra cuenta se acepta: el alias no es único (ET04, D-003).
        let (servicio, _) = servicio();
        assert!(
            esperar(servicio.registrar_inicio(formulario("Prueba", "ana@example.com"))).is_ok()
        );
    }

    #[test]
    fn ca_he_01_hu01_ca05() {
        // HE-01-HU01-CA05 · Correo electrónico vacío o formado solo por espacios (ET05).
        for correo in ["", "   "] {
            rechaza_sin_enviar(
                formulario("Ana", correo),
                ErrorCode::EmailRequired,
                "Este campo es obligatorio.",
                Some("email"),
            );
        }
    }

    #[test]
    fn ca_he_01_hu01_ca06() {
        // HE-01-HU01-CA06 · Correo que no cumple usuario@dominio.ext (ET06).
        for correo in [
            "ana",
            "ana@",
            "@example.com",
            "ana@example",
            "ana@example.",
            "ana @example.com",
            "a@b@c.co",
        ] {
            rechaza_sin_enviar(
                formulario("Ana", correo),
                ErrorCode::EmailInvalid,
                "Diligencia un correo electrónico válido.",
                Some("email"),
            );
        }
    }

    #[test]
    fn ca_he_01_hu01_ca07() {
        // HE-01-HU01-CA07 · Correo de más de 64 caracteres; 64 es válido (ET07).
        let correo = |largo: usize| format!("{}@example.com", "a".repeat(largo - 12));
        rechaza_sin_enviar(
            formulario("Ana", &correo(65)),
            ErrorCode::EmailTooLong,
            "El correo electrónico no puede superar los 64 caracteres.",
            Some("email"),
        );
        assert_eq!(validar_correo(&correo(64)), None);
    }

    #[test]
    fn ca_he_01_hu01_ca08() {
        // HE-01-HU01-CA08 · Correo que ya tiene una cuenta verificada (RPC-05): se rechaza sin pedir el código.
        let (servicio, _) = servicio();
        let error =
            esperar(servicio.registrar_inicio(formulario("Ana", "Usuario.Prueba@example.com")))
                .unwrap_err();
        assert_eq!(error.code, ErrorCode::EmailAlreadyRegistered);
        assert_eq!(error.message, "Este correo electrónico ya está registrado.");
        assert_eq!(
            servicio.auth().llamadas(),
            ["email_is_registered Usuario.Prueba@example.com"]
        );
    }

    #[test]
    fn ca_he_01_hu01_ca12() {
        // HE-01-HU01-CA12 · Sin conexión: net.offline con el texto de Registro y sin registro pendiente.
        let (servicio, _) = servicio();
        servicio.auth().fallar(FallaDeAuth::SinConexion);
        let error =
            esperar(servicio.registrar_inicio(formulario("Ana", "ana@example.com"))).unwrap_err();
        assert_eq!(error.code, ErrorCode::NetOffline);
        assert_eq!(
            error.message,
            "No hay conexión a internet. Conéctate para crear tu cuenta."
        );
        assert_eq!(servicio.registro_pendiente(), None);
    }

    #[test]
    fn registro_con_servicio_sin_respuesta_o_limitado() {
        // RT-04-CA13 y RNF-24 en auth_register_start: sin respuesta → service.unavailable; 429 → auth.rate_limited.
        let casos = [
            (FallaDeAuth::SinRespuesta, ErrorCode::ServiceUnavailable),
            (
                FallaDeAuth::Rechazo {
                    estado: 429,
                    codigo: "over_email_send_rate_limit".into(),
                },
                ErrorCode::AuthRateLimited,
            ),
            (
                FallaDeAuth::Rechazo {
                    estado: 400,
                    codigo: "otra_regla".into(),
                },
                ErrorCode::InternalUnexpected,
            ),
        ];
        for (falla, code) in casos {
            let (servicio, _) = servicio();
            servicio.auth().fallar(falla);
            let error = esperar(servicio.registrar_inicio(formulario("Ana", "ana@example.com")))
                .unwrap_err();
            assert_eq!(error.code, code);
        }
    }

    #[test]
    fn validar_registro_devuelve_todos_los_errores_en_orden() {
        // RT-04: los errores de forma se devuelven todos a la vez, uno por campo, en el orden de la pantalla.
        let campos: Vec<_> = validar_registro(&formulario("", ""))
            .into_iter()
            .map(|e| e.field)
            .collect();
        assert_eq!(
            campos,
            [Some("alias".to_string()), Some("email".to_string())]
        );
    }

    fn con_contrasena(password: &str, confirmacion: &str) -> AuthRegisterStartParams {
        AuthRegisterStartParams {
            password: password.to_string(),
            password_confirmation: confirmacion.to_string(),
            ..formulario("Ana", "ana@example.com")
        }
    }

    const INVALIDA: &str = "La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.";

    #[test]
    fn ca_he_01_hu02_ca01() {
        // HE-01-HU02-CA01 · Contraseña válida de 8 y de 64 caracteres con la confirmación idéntica (ET02, ET03,
        // ET05): sin mensaje de campo y con el código pedido.
        for clave in ["Clave123".to_string(), format!("Aa1{}", "x".repeat(61))] {
            let (servicio, _) = servicio();
            assert!(esperar(servicio.registrar_inicio(con_contrasena(&clave, &clave))).is_ok());
            assert!(
                servicio
                    .auth()
                    .llamadas()
                    .iter()
                    .any(|l| l.starts_with("signup"))
            );
        }
    }

    #[test]
    fn ca_he_01_hu02_ca02() {
        // HE-01-HU02-CA02 · Formulario vacío: «Este campo es obligatorio.» en los cuatro campos (ET01, ET04).
        let vacio = AuthRegisterStartParams {
            password: String::new(),
            password_confirmation: String::new(),
            ..formulario("", "")
        };
        let errores = validar_registro(&vacio);
        let campos: Vec<_> = errores
            .iter()
            .map(|e| e.field.clone().unwrap_or_default())
            .collect();
        assert_eq!(
            campos,
            ["alias", "email", "password", "password_confirmation"]
        );
        assert!(
            errores
                .iter()
                .all(|e| e.message == "Este campo es obligatorio.")
        );
        let (servicio, _) = servicio();
        assert!(esperar(servicio.registrar_inicio(vacio)).is_err());
        assert!(servicio.auth().llamadas().is_empty());
    }

    #[test]
    fn ca_he_01_hu02_ca03() {
        // HE-01-HU02-CA03 · Contraseña vacía.
        rechaza_sin_enviar(
            con_contrasena("", "Clave123"),
            ErrorCode::PasswordRequired,
            "Este campo es obligatorio.",
            Some("password"),
        );
    }

    #[test]
    fn ca_he_01_hu02_ca04() {
        // HE-01-HU02-CA04 · Contraseña de menos de 8 caracteres.
        rechaza_sin_enviar(
            con_contrasena("Clave12", "Clave12"),
            ErrorCode::PasswordInvalid,
            INVALIDA,
            Some("password"),
        );
    }

    #[test]
    fn ca_he_01_hu02_ca05() {
        // HE-01-HU02-CA05 · Contraseña de más de 64 caracteres (65).
        let clave = format!("Aa1{}", "x".repeat(62));
        rechaza_sin_enviar(
            con_contrasena(&clave, &clave),
            ErrorCode::PasswordInvalid,
            INVALIDA,
            Some("password"),
        );
    }

    #[test]
    fn ca_he_01_hu02_ca06() {
        // HE-01-HU02-CA06 · Sin mayúscula, sin minúscula o sin número.
        for clave in ["clave123", "CLAVE123", "ClaveClave"] {
            rechaza_sin_enviar(
                con_contrasena(clave, clave),
                ErrorCode::PasswordInvalid,
                INVALIDA,
                Some("password"),
            );
        }
    }

    #[test]
    fn ca_he_01_hu02_ca07() {
        // HE-01-HU02-CA07 · Confirmar contraseña vacía.
        rechaza_sin_enviar(
            con_contrasena("Clave123", ""),
            ErrorCode::PasswordConfirmationRequired,
            "Este campo es obligatorio.",
            Some("password_confirmation"),
        );
    }

    #[test]
    fn ca_he_01_hu02_ca08() {
        // HE-01-HU02-CA08 · Contraseñas distintas.
        rechaza_sin_enviar(
            con_contrasena("Clave123", "Clave124"),
            ErrorCode::PasswordConfirmationMismatch,
            "Las contraseñas no coinciden.",
            Some("password_confirmation"),
        );
    }
}
