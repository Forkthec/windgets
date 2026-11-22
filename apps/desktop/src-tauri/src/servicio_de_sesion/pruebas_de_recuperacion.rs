//! Pruebas de Recuperar contraseña (HE-01-HU06 a HU08; IPC-AUTH-08 a IPC-AUTH-11).

use super::pruebas::{AuthDePrueba, REGISTRADO, RelojDePrueba, esperar, servicio};
use super::*;
use super::{ESPERA_DE_REENVIO_MS, VIGENCIA_DEL_CODIGO_MS};
use crate::tipos::{AuthRecoveryRequestParams, AuthRecoveryVerifyParams};

type Servicio = ServicioDeSesion<AuthDePrueba, RelojDePrueba>;

const ENVIADO: &str = "Si el correo está registrado, te enviamos un código de verificación.";

fn solicitar(servicio: &Servicio, correo: &str) -> Result<ConMensaje<CodeSent>, AppError> {
    esperar(servicio.recuperar_solicitar(AuthRecoveryRequestParams {
        email: correo.to_string(),
    }))
}

/// El pedido falló con este error de campo y no se llamó a Supabase.
fn rechaza_el_correo(correo: &str, code: ErrorCode, message: &str) {
    let (servicio, _) = servicio();
    let error = solicitar(&servicio, correo).unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str(), error.field.as_deref()),
        (code, message, Some("email"))
    );
    assert!(servicio.auth().llamadas().is_empty());
    assert_eq!(servicio.recuperacion_pendiente(), None);
}

#[test]
fn ca_he_01_hu06_ca01() {
    // HE-01-HU06-CA01 · Correo registrado: Supabase envía el código (ET08) y el mensaje es el de ET09.
    let (servicio, _) = servicio();
    let r = solicitar(&servicio, &format!("  {REGISTRADO} ")).unwrap();
    assert_eq!(r.mensaje.message, ENVIADO);
    assert_eq!(r.valor.resend_available_at.0, "2026-11-14T13:31:00.000Z");
    assert_eq!(
        servicio.auth().llamadas(),
        vec![format!("recover {REGISTRADO}")]
    );
    assert_eq!(
        servicio.auth().recuperaciones.lock().unwrap().clone(),
        vec![REGISTRADO.to_string()]
    );
    assert_eq!(
        servicio.recuperacion_pendiente().unwrap().correo,
        REGISTRADO
    );
}

#[test]
fn ca_he_01_hu06_ca02() {
    // HE-01-HU06-CA02 · Correo sin cuenta: no se envía código y la respuesta es la misma (ET09).
    let (servicio, _) = servicio();
    let r = solicitar(&servicio, "nadie@example.com").unwrap();
    assert_eq!(r.mensaje.message, ENVIADO);
    assert!(servicio.auth().recuperaciones.lock().unwrap().is_empty());
    assert!(servicio.recuperacion_pendiente().is_some());
}

#[test]
fn ca_he_01_hu06_ca03() {
    // HE-01-HU06-CA03 · Correo vacío (ET05).
    for vacio in ["", "   "] {
        rechaza_el_correo(
            vacio,
            ErrorCode::EmailRequired,
            "Este campo es obligatorio.",
        );
    }
}

#[test]
fn ca_he_01_hu06_ca04() {
    // HE-01-HU06-CA04 · Formato distinto de usuario@dominio.ext (ET06).
    for malo in ["ana", "ana@", "ana@example", "ana @example.com"] {
        rechaza_el_correo(
            malo,
            ErrorCode::EmailInvalid,
            "Diligencia un correo electrónico válido.",
        );
    }
}

#[test]
fn ca_he_01_hu06_ca05() {
    // HE-01-HU06-CA05 · Más de 64 caracteres (ET07); 64 sí se aceptan.
    let de_64 = format!("{}@example.com", "a".repeat(52));
    assert_eq!(de_64.chars().count(), 64);
    let (servicio, _) = servicio();
    assert!(solicitar(&servicio, &de_64).is_ok());
    rechaza_el_correo(
        &format!("a{de_64}"),
        ErrorCode::EmailTooLong,
        "El correo electrónico no puede superar los 64 caracteres.",
    );
}

#[test]
fn ca_he_01_hu06_ca06() {
    // HE-01-HU06-CA06 · Sin conexión: `net.offline` con el aviso de Recuperar contraseña y sin recuperación
    // pendiente. Sin respuesta, `service.unavailable` (RT-04-CA13).
    let (servicio, _) = servicio();
    servicio.auth().fallar(FallaDeAuth::SinConexion);
    let error = solicitar(&servicio, REGISTRADO).unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str(), error.field),
        (
            ErrorCode::NetOffline,
            "No hay conexión a internet. Conéctate para recuperar tu contraseña.",
            None
        )
    );
    assert_eq!(servicio.recuperacion_pendiente(), None);
    servicio.auth().fallar(FallaDeAuth::SinRespuesta);
    assert_eq!(
        solicitar(&servicio, REGISTRADO).unwrap_err().code,
        ErrorCode::ServiceUnavailable
    );
    servicio.auth().fallar(FallaDeAuth::Rechazo {
        estado: 429,
        codigo: "over_email_send_rate_limit".into(),
    });
    assert_eq!(
        solicitar(&servicio, REGISTRADO).unwrap_err().code,
        ErrorCode::AuthRateLimited
    );
}

/// Servicio en el paso Diligenciar código: se pidió el código para la cuenta de prueba (código 100001).
fn en_codigo() -> (Servicio, RelojDePrueba) {
    let (servicio, reloj) = servicio();
    solicitar(&servicio, REGISTRADO).unwrap();
    (servicio, reloj)
}

fn verificar(servicio: &Servicio, codigo: &str) -> Result<(), AppError> {
    esperar(servicio.recuperar_verificar(AuthRecoveryVerifyParams {
        code: codigo.to_string(),
    }))
}

/// La verificación falló con este error y no quedó sesión de recuperación.
fn no_verifica(servicio: &Servicio, codigo: &str, code: ErrorCode, message: &str) {
    let error = verificar(servicio, codigo).unwrap_err();
    assert_eq!((error.code, error.message.as_str()), (code, message));
    assert!(
        servicio
            .recuperacion_pendiente()
            .is_none_or(|r| r.sesion.is_none())
    );
}

#[test]
fn ca_he_01_hu07_ca01() {
    // HE-01-HU07-CA01 · Código de 6 dígitos vigente y correcto (ET02, ET08): queda la sesión de recuperación
    // en memoria; no se inicia la sesión de la aplicación ni se escribe session.bin.
    let (servicio, _) = en_codigo();
    verificar(&servicio, "100001").unwrap();
    let pendiente = servicio.recuperacion_pendiente().unwrap();
    assert_eq!(
        pendiente.sesion.map(|s| s.access_token),
        Some("acceso-recuperacion".to_string())
    );
    assert_eq!(servicio.sesion_guardada(), None);
    assert!(
        servicio
            .auth()
            .llamadas()
            .contains(&format!("verify recovery {REGISTRADO} 100001"))
    );
}

#[test]
fn ca_he_01_hu07_ca02() {
    // HE-01-HU07-CA02 · Código vacío (ET07): mensaje debajo del campo y sin llamar a Supabase.
    let (servicio, _) = en_codigo();
    for vacio in ["", "  "] {
        let error = verificar(&servicio, vacio).unwrap_err();
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
}

#[test]
fn ca_he_01_hu07_ca03() {
    // HE-01-HU07-CA03 · Código incorrecto dentro de la vigencia.
    let (servicio, _) = en_codigo();
    no_verifica(
        &servicio,
        "000000",
        ErrorCode::CodeIncorrect,
        "El código no es correcto. Revísalo e intenta de nuevo.",
    );
}

#[test]
fn ca_he_01_hu07_ca04() {
    // HE-01-HU07-CA04 · Más de 10 minutos desde el envío (ET03, RNF-25).
    let (servicio, reloj) = en_codigo();
    reloj.adelantar(VIGENCIA_DEL_CODIGO_MS + 1);
    servicio.auth().fallar(FallaDeAuth::Rechazo {
        estado: 403,
        codigo: "otp_expired".into(),
    });
    no_verifica(
        &servicio,
        "100001",
        ErrorCode::CodeExpired,
        "El código venció. Solicita uno nuevo.",
    );
    // Sin recuperación pendiente (la aplicación se reinició) tampoco hay código vigente.
    let (reiniciado, _) = super::pruebas::servicio();
    no_verifica(
        &reiniciado,
        "100001",
        ErrorCode::CodeExpired,
        "El código venció. Solicita uno nuevo.",
    );
}

#[test]
fn ca_he_01_hu07_ca05() {
    // HE-01-HU07-CA05 · Límite de intentos de Supabase Auth superado (ET04, RNF-24): 429.
    let (servicio, _) = en_codigo();
    servicio.auth().fallar(FallaDeAuth::Rechazo {
        estado: 429,
        codigo: "over_request_rate_limit".into(),
    });
    no_verifica(
        &servicio,
        "100001",
        ErrorCode::AuthRateLimited,
        "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
    );
}

#[test]
fn ca_he_01_hu07_ca06() {
    // HE-01-HU07-CA06 · Reenviar a los 60 s (ET05): código nuevo por POST /recover (ET10), que invalida el
    // anterior (ET06).
    let (servicio, reloj) = en_codigo();
    reloj.adelantar(ESPERA_DE_REENVIO_MS);
    let r = esperar(servicio.recuperar_reenviar()).unwrap();
    assert_eq!(r.mensaje.message, "Te enviamos un nuevo código.");
    assert_eq!(r.valor.resend_available_at.0, "2026-11-14T13:32:00.000Z");
    assert_eq!(
        servicio
            .auth()
            .llamadas()
            .iter()
            .filter(|l| l.starts_with("recover"))
            .count(),
        2
    );
    no_verifica(
        &servicio,
        "100001",
        ErrorCode::CodeIncorrect,
        "El código no es correcto. Revísalo e intenta de nuevo.",
    );
    assert!(verificar(&servicio, "100002").is_ok());
}

#[test]
fn ca_he_01_hu07_ca07() {
    // HE-01-HU07-CA07 · Antes de 60 s: code.resend_too_soon con los segundos restantes, sin pedir código (ET11).
    let (servicio, reloj) = en_codigo();
    reloj.adelantar(15_200);
    let error = esperar(servicio.recuperar_reenviar()).unwrap_err();
    assert_eq!(error.code, ErrorCode::CodeResendTooSoon);
    assert_eq!(error.message, "Puedes pedir un nuevo código en 45 s.");
    assert_eq!(
        serde_json::to_value(&error).unwrap()["params"]["seconds"],
        45
    );
    assert_eq!(servicio.auth().recuperaciones.lock().unwrap().len(), 1);
}

#[test]
fn ca_he_01_hu07_ca08() {
    // HE-01-HU07-CA08 · Regresar y pedir de nuevo el código (ET09): el pedido nuevo reemplaza al anterior y el
    // código anterior ya no sirve.
    let (servicio, _) = en_codigo();
    solicitar(&servicio, REGISTRADO).unwrap();
    no_verifica(
        &servicio,
        "100001",
        ErrorCode::CodeIncorrect,
        "El código no es correcto. Revísalo e intenta de nuevo.",
    );
    assert!(verificar(&servicio, "100002").is_ok());
}

#[test]
fn ca_he_01_hu07_ca09() {
    // HE-01-HU07-CA09 · Sin conexión al verificar o reenviar: net.offline con el aviso de Recuperar contraseña
    // y la recuperación sigue pendiente (ET14).
    let (servicio, reloj) = en_codigo();
    servicio.auth().fallar(FallaDeAuth::SinConexion);
    let error = verificar(&servicio, "100001").unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str()),
        (
            ErrorCode::NetOffline,
            "No hay conexión a internet. Conéctate para recuperar tu contraseña."
        )
    );
    reloj.adelantar(ESPERA_DE_REENVIO_MS);
    assert_eq!(
        esperar(servicio.recuperar_reenviar()).unwrap_err().code,
        ErrorCode::NetOffline
    );
    assert!(servicio.recuperacion_pendiente().is_some());
    servicio.auth().sin_falla();
    assert!(verificar(&servicio, "100001").is_ok());
}
