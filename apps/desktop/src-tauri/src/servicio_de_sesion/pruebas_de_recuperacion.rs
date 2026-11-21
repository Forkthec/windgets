//! Pruebas de Recuperar contraseña (HE-01-HU06 a HU08; IPC-AUTH-08 a IPC-AUTH-11).

use super::pruebas::{AuthDePrueba, REGISTRADO, RelojDePrueba, esperar, servicio};
use super::*;
use crate::tipos::AuthRecoveryRequestParams;

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
