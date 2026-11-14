//! Servicio de sesión (arquitectura.md, vista 3b, Núcleo · servicios que usan la nube).
//! Responsabilidad: «Registro, inicio con correo o Google (PKCE), recuperación y renovación del JWT;
//! guarda el token con DPAPI y lo borra al cerrar sesión.»
//!
//! Las reglas de los formularios de cuenta viven aquí (D-188): la vista las repite para mostrar los mensajes al
//! instante y el Núcleo las vuelve a comprobar. `Err` trae un solo `AppError` (tipos.ts), así que el Núcleo
//! devuelve el primer error en el orden de la pantalla; la vista muestra todos a la vez (RT-04).

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::cliente_de_supabase::{AuthDeSupabase, FallaDeAuth, SesionDeAuth};
use crate::messages;
use crate::repositorios_y_archivos_locales::{AlmacenDeSesion, SesionGuardada};
use crate::tipos::{
    AppError, AuthRegisterStartParams, AuthRegisterStartResult, AuthRegisterVerifyParams,
    AuthRegisterVerifyResult, CodeSent, ErrorCode, ErrorParams, ErrorParamsValue, Instant,
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

fn con_params(mut e: AppError, clave: &str, valor: ErrorParamsValue) -> AppError {
    e.params = Some(ErrorParams(HashMap::from([(clave.to_string(), valor)])));
    e
}

/// Servicio de sesión con su cliente de Supabase Auth, su reloj y el almacén de `session.bin`.
pub struct ServicioDeSesion<A, R> {
    auth: A,
    reloj: R,
    almacen: Box<dyn AlmacenDeSesion>,
    pendiente: Mutex<Option<RegistroPendiente>>,
}

impl<A: AuthDeSupabase, R: Reloj> ServicioDeSesion<A, R> {
    pub fn nuevo(auth: A, reloj: R, almacen: Box<dyn AlmacenDeSesion>) -> Self {
        Self {
            auth,
            reloj,
            almacen,
            pendiente: Mutex::new(None),
        }
    }

    pub fn auth(&self) -> &A {
        &self.auth
    }

    /// La sesión guardada (`session.bin`).
    pub fn sesion_guardada(&self) -> Option<SesionGuardada> {
        self.almacen.leer()
    }

    /// Guarda la sesión que entregó Supabase Auth. DUDA: P05 si no se puede escribir `session.bin`, la sesión
    /// sigue abierta en esta ejecución y se pedirá iniciar sesión la próxima vez (docs/DUDAS.md).
    fn guardar_sesion(&self, sesion: &SesionDeAuth, alias: &str) {
        let _ = self.almacen.guardar(&SesionGuardada {
            access_token: sesion.access_token.clone(),
            refresh_token: sesion.refresh_token.clone(),
            expires_at: self.reloj.ahora_ms() + sesion.expires_in * 1_000,
            user_id: sesion.user_id.clone(),
            alias: alias.to_string(),
        });
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

    /// Registro pendiente para verificar o reenviar. Sin él (la aplicación se reinició en el paso Verificar
    /// correo) no hay código vigente: `code.expired`. DUDA: P05 ningún CA lo define (docs/DUDAS.md).
    fn pendiente_o_vencido(&self) -> Result<RegistroPendiente, AppError> {
        self.registro_pendiente().ok_or_else(|| {
            error(
                ErrorCode::CodeExpired,
                messages::CODIGO_VENCIDO,
                Some("code"),
            )
        })
    }

    /// IPC-AUTH-02 `auth_register_verify`: verifica el código, crea la cuenta, guarda la sesión y devuelve el
    /// alias con el mensaje de bienvenida (HE-01-HU03-CA01, ET08, ET09). La cuenta y sus datos semilla los crea
    /// el servidor al confirmar el correo (`on_account_confirmed`).
    pub async fn registrar_verificar(
        &self,
        params: AuthRegisterVerifyParams,
    ) -> Result<ConMensaje<AuthRegisterVerifyResult>, AppError> {
        let codigo = params.code.trim();
        if codigo.is_empty() {
            return Err(error(
                ErrorCode::CodeRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("code"),
            ));
        }
        let pendiente = self.pendiente_o_vencido()?;
        let vencido = self.reloj.ahora_ms() > pendiente.enviado_ms + VIGENCIA_DEL_CODIGO_MS;
        let sesion = self
            .auth
            .verificar_registro(&pendiente.correo, codigo)
            .await
            .map_err(|f| {
                falla_comun(&f, messages::SIN_CONEXION_REGISTRO).unwrap_or_else(|| {
                    // Auth no distingue entre código incorrecto y vencido (otp_expired): decide la hora del envío.
                    if vencido {
                        error(
                            ErrorCode::CodeExpired,
                            messages::CODIGO_VENCIDO,
                            Some("code"),
                        )
                    } else {
                        error(
                            ErrorCode::CodeIncorrect,
                            messages::CODIGO_INCORRECTO,
                            Some("code"),
                        )
                    }
                })
            })?;
        self.guardar_sesion(&sesion, &pendiente.alias);
        self.fijar_pendiente(None);
        let mut mensaje = resultado(
            "auth_register_verify",
            &messages::BIENVENIDA.replace("<alias>", &pendiente.alias),
        );
        mensaje.params = Some(ErrorParams(HashMap::from([(
            "alias".to_string(),
            ErrorParamsValue::Text(pendiente.alias.clone()),
        )])));
        Ok(ConMensaje {
            valor: AuthRegisterVerifyResult {
                alias: pendiente.alias,
            },
            mensaje,
        })
    }

    /// IPC-AUTH-03 `auth_register_resend`: antes de 60 s desde el último envío responde `code.resend_too_soon`
    /// con los segundos restantes (CA07); después pide un código nuevo, que invalida el anterior (CA06, ET06).
    pub async fn registrar_reenviar(&self) -> Result<ConMensaje<CodeSent>, AppError> {
        let pendiente = self.pendiente_o_vencido()?;
        let ahora = self.reloj.ahora_ms();
        let faltan_ms = pendiente.enviado_ms + ESPERA_DE_REENVIO_MS - ahora;
        if faltan_ms > 0 {
            let segundos = (faltan_ms + 999) / 1_000;
            let texto = messages::REENVIO_EN_SEGUNDOS
                .replace("<segundos restantes>", &segundos.to_string());
            return Err(con_params(
                error(ErrorCode::CodeResendTooSoon, &texto, None),
                "seconds",
                ErrorParamsValue::Number(segundos),
            ));
        }
        self.auth
            .reenviar_registro(&pendiente.correo)
            .await
            .map_err(|f| {
                falla_comun(&f, messages::SIN_CONEXION_REGISTRO).unwrap_or_else(inesperado)
            })?;
        let enviado_ms = self.reloj.ahora_ms();
        self.fijar_pendiente(Some(RegistroPendiente {
            enviado_ms,
            ..pendiente
        }));
        Ok(ConMensaje {
            valor: CodeSent {
                resend_available_at: instante(enviado_ms + ESPERA_DE_REENVIO_MS),
            },
            mensaje: resultado("auth_register_resend", messages::CODIGO_REENVIADO),
        })
    }

    /// IPC-AUTH-04 `auth_register_cancel`: al «Regresar» al paso Formulario descarta el registro pendiente; el
    /// código enviado ya no se puede verificar desde la aplicación (HE-01-HU03-ET10).
    pub fn registrar_cancelar(&self) {
        self.fijar_pendiente(None);
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
        /// Códigos enviados, del primero al último.
        pub codigos: Mutex<Vec<String>>,
    }

    impl AuthDePrueba {
        pub(crate) fn con_verificado(correo: &str) -> Self {
            Self {
                verificados: vec![correo.to_string()],
                codigos: Mutex::new(vec![CODIGO.to_string()]),
                ..Self::default()
            }
        }

        pub(crate) fn sin_falla(&self) {
            *self.falla.lock().unwrap() = None;
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

        async fn reenviar_registro(&self, correo: &str) -> Result<(), FallaDeAuth> {
            self.anotar(format!("resend {correo}"))?;
            self.codigos
                .lock()
                .unwrap()
                .push(CODIGO_REENVIADO.to_string());
            Ok(())
        }

        async fn verificar_registro(
            &self,
            correo: &str,
            codigo: &str,
        ) -> Result<SesionDeAuth, FallaDeAuth> {
            self.anotar(format!("verify {correo} {codigo}"))?;
            // Solo el último código enviado es válido (ET06, ET08); Auth responde otp_expired para todo lo demás.
            let ultimo = self.codigos.lock().unwrap().last().cloned();
            if ultimo.as_deref() != Some(codigo) {
                return Err(FallaDeAuth::Rechazo {
                    estado: 403,
                    codigo: "otp_expired".into(),
                });
            }
            Ok(SesionDeAuth {
                access_token: "acceso".into(),
                refresh_token: "renovacion".into(),
                expires_in: 3_600,
                user_id: "0b6e7f3a-1111-4222-8333-444455556666".into(),
                alias: String::new(),
            })
        }
    }

    pub(crate) const CODIGO: &str = "482913";
    pub(crate) const CODIGO_REENVIADO: &str = "730518";

    pub(crate) const REGISTRADO: &str = "usuario.prueba@example.com";

    pub(crate) fn servicio() -> (ServicioDeSesion<AuthDePrueba, RelojDePrueba>, RelojDePrueba) {
        let reloj = RelojDePrueba::default();
        reloj.adelantar(1_794_663_000_000); // 2026-11-14T13:30:00.000Z
        (
            ServicioDeSesion::nuevo(
                AuthDePrueba::con_verificado(REGISTRADO),
                reloj.clone(),
                Box::new(crate::repositorios_y_archivos_locales::SesionEnMemoria::default()),
            ),
            reloj,
        )
    }

    /// Servicio en el paso Verificar correo: «Ana» con ana@example.com pidió el código.
    pub(crate) fn en_verificar() -> (ServicioDeSesion<AuthDePrueba, RelojDePrueba>, RelojDePrueba) {
        let (servicio, reloj) = servicio();
        esperar(servicio.registrar_inicio(formulario("Ana", "ana@example.com"))).unwrap();
        (servicio, reloj)
    }

    fn verificar(
        servicio: &ServicioDeSesion<AuthDePrueba, RelojDePrueba>,
        codigo: &str,
    ) -> Result<ConMensaje<AuthRegisterVerifyResult>, AppError> {
        esperar(servicio.registrar_verificar(AuthRegisterVerifyParams {
            code: codigo.to_string(),
        }))
    }

    /// La verificación falló con este código y mensaje, y no se creó la cuenta ni se guardó la sesión.
    fn no_crea_la_cuenta(
        r: Result<ConMensaje<AuthRegisterVerifyResult>, AppError>,
        code: ErrorCode,
        message: &str,
    ) {
        let error = r.unwrap_err();
        assert_eq!((error.code, error.message.as_str()), (code, message));
    }

    #[test]
    fn ca_he_01_hu03_ca01() {
        // HE-01-HU03-CA01 · Código de 6 dígitos vigente y correcto: crea la cuenta, guarda la sesión y da la
        // bienvenida con el alias (ET02, ET08, ET09).
        let (servicio, _) = en_verificar();
        assert_eq!(servicio.sesion_guardada(), None);
        let r = verificar(&servicio, CODIGO).unwrap();
        assert_eq!(r.valor.alias, "Ana");
        assert_eq!(
            r.mensaje.message,
            "¡Bienvenido, Ana! Tu cuenta fue creada correctamente."
        );
        let json = serde_json::to_value(&r.mensaje).unwrap();
        assert_eq!(json["params"]["alias"], "Ana");
        let sesion = servicio.sesion_guardada().unwrap();
        assert_eq!(
            (sesion.alias.as_str(), sesion.access_token.as_str()),
            ("Ana", "acceso")
        );
        assert_eq!(servicio.registro_pendiente(), None);
    }

    #[test]
    fn ca_he_01_hu03_ca02() {
        // HE-01-HU03-CA02 · Código vacío (ET07): mensaje debajo del campo y sin llamar a Supabase.
        let (servicio, _) = en_verificar();
        for codigo in ["", "   "] {
            let error = verificar(&servicio, codigo).unwrap_err();
            assert_eq!(
                (error.code, error.message.as_str(), error.field.as_deref()),
                (
                    ErrorCode::CodeRequired,
                    "Este campo es obligatorio.",
                    Some("code")
                )
            );
        }
        assert!(
            !servicio
                .auth()
                .llamadas()
                .iter()
                .any(|l| l.starts_with("verify"))
        );
        assert_eq!(servicio.sesion_guardada(), None);
    }

    #[test]
    fn ca_he_01_hu03_ca03() {
        // HE-01-HU03-CA03 · Código incorrecto, dentro de la vigencia.
        let (servicio, _) = en_verificar();
        no_crea_la_cuenta(
            verificar(&servicio, "000000"),
            ErrorCode::CodeIncorrect,
            "El código no es correcto. Revísalo e intenta de nuevo.",
        );
        assert_eq!(servicio.sesion_guardada(), None);
    }

    #[test]
    fn ca_he_01_hu03_ca04() {
        // HE-01-HU03-CA04 · Más de 10 minutos desde el envío (ET03, RNF-25): el código venció.
        let (servicio, reloj) = en_verificar();
        reloj.adelantar(VIGENCIA_DEL_CODIGO_MS + 1);
        servicio.auth().fallar(FallaDeAuth::Rechazo {
            estado: 403,
            codigo: "otp_expired".into(),
        });
        no_crea_la_cuenta(
            verificar(&servicio, CODIGO),
            ErrorCode::CodeExpired,
            "El código venció. Solicita uno nuevo.",
        );
        assert_eq!(servicio.sesion_guardada(), None);
    }

    #[test]
    fn ca_he_01_hu03_ca05() {
        // HE-01-HU03-CA05 · Límite de intentos superado (ET04, RNF-24): Supabase responde 429.
        let (servicio, _) = en_verificar();
        servicio.auth().fallar(FallaDeAuth::Rechazo {
            estado: 429,
            codigo: "over_request_rate_limit".into(),
        });
        no_crea_la_cuenta(
            verificar(&servicio, CODIGO),
            ErrorCode::AuthRateLimited,
            "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
        );
        assert_eq!(servicio.sesion_guardada(), None);
    }

    #[test]
    fn ca_he_01_hu03_ca06() {
        // HE-01-HU03-CA06 · Reenviar a los 60 s (ET05): código nuevo, el anterior queda invalidado (ET06).
        let (servicio, reloj) = en_verificar();
        reloj.adelantar(ESPERA_DE_REENVIO_MS);
        let r = esperar(servicio.registrar_reenviar()).unwrap();
        assert_eq!(r.mensaje.message, "Te enviamos un nuevo código.");
        assert_eq!(r.valor.resend_available_at.0, "2026-11-14T13:32:00.000Z");
        assert!(
            servicio
                .auth()
                .llamadas()
                .contains(&"resend ana@example.com".to_string())
        );
        no_crea_la_cuenta(
            verificar(&servicio, CODIGO),
            ErrorCode::CodeIncorrect,
            "El código no es correcto. Revísalo e intenta de nuevo.",
        );
        assert!(verificar(&servicio, CODIGO_REENVIADO).is_ok());
    }

    #[test]
    fn ca_he_01_hu03_ca07() {
        // HE-01-HU03-CA07 · Antes de 60 s: code.resend_too_soon con los segundos restantes, sin pedir código.
        let (servicio, reloj) = en_verificar();
        reloj.adelantar(17_500);
        let error = esperar(servicio.registrar_reenviar()).unwrap_err();
        assert_eq!(error.code, ErrorCode::CodeResendTooSoon);
        assert_eq!(error.message, "Puedes pedir un nuevo código en 43 s.");
        assert_eq!(
            serde_json::to_value(&error).unwrap()["params"]["seconds"],
            43
        );
        assert!(
            !servicio
                .auth()
                .llamadas()
                .iter()
                .any(|l| l.starts_with("resend"))
        );
    }

    #[test]
    fn ca_he_01_hu03_ca08() {
        // HE-01-HU03-CA08 · Regresar al formulario: se descarta el registro pendiente y el código ya no se
        // puede verificar (ET10); la vista conserva alias y correo.
        let (servicio, _) = en_verificar();
        servicio.registrar_cancelar();
        assert_eq!(servicio.registro_pendiente(), None);
        no_crea_la_cuenta(
            verificar(&servicio, CODIGO),
            ErrorCode::CodeExpired,
            "El código venció. Solicita uno nuevo.",
        );
        assert!(
            !servicio
                .auth()
                .llamadas()
                .iter()
                .any(|l| l.starts_with("verify"))
        );
    }

    #[test]
    fn ca_he_01_hu03_ca09() {
        // HE-01-HU03-CA09 · Sin conexión: net.offline con el texto de Registro; no avanza ni descarta el registro.
        let (servicio, reloj) = en_verificar();
        servicio.auth().fallar(FallaDeAuth::SinConexion);
        no_crea_la_cuenta(
            verificar(&servicio, CODIGO),
            ErrorCode::NetOffline,
            "No hay conexión a internet. Conéctate para crear tu cuenta.",
        );
        reloj.adelantar(ESPERA_DE_REENVIO_MS);
        let error = esperar(servicio.registrar_reenviar()).unwrap_err();
        assert_eq!(error.code, ErrorCode::NetOffline);
        assert!(servicio.registro_pendiente().is_some());
        servicio.auth().sin_falla();
        assert!(verificar(&servicio, CODIGO).is_ok());
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
