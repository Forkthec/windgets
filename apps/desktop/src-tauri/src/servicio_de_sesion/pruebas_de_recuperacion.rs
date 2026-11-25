//! Pruebas de Recuperar contraseña (HE-01-HU06 a HU08; IPC-AUTH-08 a IPC-AUTH-11).

use super::pruebas::CLAVE;
use super::pruebas::{AuthDePrueba, REGISTRADO, RelojDePrueba, esperar, servicio};
use super::*;
use super::{ESPERA_DE_REENVIO_MS, VIGENCIA_DEL_CODIGO_MS};
use crate::tipos::{
    AuthRecoveryRequestParams, AuthRecoverySetPasswordParams, AuthRecoveryVerifyParams,
};

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

/// Servicio en el paso Nueva contraseña: el código 100001 se verificó.
fn en_nueva() -> (Servicio, RelojDePrueba) {
    let (servicio, reloj) = en_codigo();
    verificar(&servicio, "100001").unwrap();
    (servicio, reloj)
}

fn guardar(
    servicio: &Servicio,
    nueva: &str,
    confirmacion: &str,
) -> Result<ConMensaje<()>, AppError> {
    esperar(servicio.recuperar_guardar(AuthRecoverySetPasswordParams {
        password: nueva.to_string(),
        password_confirmation: confirmacion.to_string(),
    }))
}

/// No se guardó: este error en este campo, sin `PUT /user` y con la recuperación pendiente.
fn no_guarda(nueva: &str, confirmacion: &str, code: ErrorCode, message: &str, field: &str) {
    let (servicio, _) = en_nueva();
    let error = guardar(&servicio, nueva, confirmacion).unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str(), error.field.as_deref()),
        (code, message, Some(field))
    );
    assert!(
        !servicio
            .auth()
            .llamadas()
            .iter()
            .any(|l| l.starts_with("put user"))
    );
    assert!(servicio.recuperacion_pendiente().is_some());
}

const INVALIDA: &str = "La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula y un número.";

#[test]
fn ca_he_01_hu08_ca01() {
    // HE-01-HU08-CA01 · Contraseña válida y confirmada (ET03 a ET05): PUT /user con el token de recuperación,
    // el mensaje de resultado y la recuperación cerrada, sin iniciar la sesión de la aplicación.
    for nueva in ["Nueva123".to_string(), format!("Ab1{}", "x".repeat(61))] {
        let (servicio, _) = en_nueva();
        let r = guardar(&servicio, &nueva, &nueva).unwrap();
        assert_eq!(
            r.mensaje.message,
            "Tu contraseña fue actualizada. Ya puedes iniciar sesión."
        );
        assert!(
            servicio
                .auth()
                .llamadas()
                .contains(&"put user acceso-recuperacion".to_string())
        );
        assert_eq!(
            servicio.auth().contrasena_nueva.lock().unwrap().clone(),
            Some(nueva)
        );
        assert_eq!(servicio.recuperacion_pendiente(), None);
        assert_eq!(servicio.sesion_guardada(), None);
    }
}

#[test]
fn ca_he_01_hu08_ca02() {
    // HE-01-HU08-CA02 · Nueva contraseña vacía (ET02).
    for vacia in ["", "   "] {
        no_guarda(
            vacia,
            vacia,
            ErrorCode::PasswordRequired,
            "Este campo es obligatorio.",
            "password",
        );
    }
}

#[test]
fn ca_he_01_hu08_ca03() {
    // HE-01-HU08-CA03 · Longitud de 8 a 64 o composición incumplidas (ET03, ET04): 7 y 65 caracteres, sin
    // mayúscula, sin minúscula y sin número. La regla de Supabase (`weak_password`) da el mismo error.
    let de_65 = format!("Ab1{}", "x".repeat(62));
    for mala in [
        "Abc1234",
        de_65.as_str(),
        "nueva123",
        "NUEVA123",
        "NuevaClave",
    ] {
        no_guarda(mala, mala, ErrorCode::PasswordInvalid, INVALIDA, "password");
    }
    let (servicio, _) = en_nueva();
    servicio.auth().fallar(FallaDeAuth::Rechazo {
        estado: 422,
        codigo: "weak_password".into(),
    });
    let error = guardar(&servicio, "Nueva123", "Nueva123").unwrap_err();
    assert_eq!(
        (error.code, error.field.as_deref()),
        (ErrorCode::PasswordInvalid, Some("password"))
    );
}

#[test]
fn ca_he_01_hu08_ca04() {
    // HE-01-HU08-CA04 · Confirmar contraseña distinta (ET05), también vacía.
    for distinta in ["Nueva124", ""] {
        no_guarda(
            "Nueva123",
            distinta,
            ErrorCode::PasswordConfirmationMismatch,
            "Las contraseñas no coinciden.",
            "password_confirmation",
        );
    }
}

#[test]
fn ca_he_01_hu08_ca05() {
    // HE-01-HU08-CA05 · Sin conexión desde el paso (ET06, ET07): la Ventana principal deshabilita «Guardar
    // contraseña»; si llega el pedido, net.offline y nada cambia.
    let (servicio, _) = en_nueva();
    servicio.auth().fallar(FallaDeAuth::SinConexion);
    let error = guardar(&servicio, "Nueva123", "Nueva123").unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str(), error.field),
        (
            ErrorCode::NetOffline,
            "No hay conexión a internet. Conéctate para recuperar tu contraseña.",
            None
        )
    );
    assert_eq!(
        servicio.auth().contrasena_nueva.lock().unwrap().clone(),
        None
    );
}

#[test]
fn ca_he_01_hu08_ca06() {
    // HE-01-HU08-CA06 · La conexión se pierde al guardar (ET08): no se actualiza, la recuperación sigue
    // pendiente y al volver la conexión se puede guardar. Sin respuesta, service.unavailable (RT-04-CA13).
    let (servicio, _) = en_nueva();
    servicio.auth().fallar(FallaDeAuth::SinConexion);
    assert_eq!(
        guardar(&servicio, "Nueva123", "Nueva123").unwrap_err().code,
        ErrorCode::NetOffline
    );
    assert!(
        servicio
            .recuperacion_pendiente()
            .and_then(|r| r.sesion)
            .is_some()
    );
    servicio.auth().fallar(FallaDeAuth::SinRespuesta);
    assert_eq!(
        guardar(&servicio, "Nueva123", "Nueva123").unwrap_err().code,
        ErrorCode::ServiceUnavailable
    );
    servicio.auth().sin_falla();
    assert!(guardar(&servicio, "Nueva123", "Nueva123").is_ok());
}

#[test]
fn ca_he_01_hu08_ca07() {
    // HE-01-HU08-CA07 · Igual a la contraseña actual (ET09, ET10): solo Supabase la conoce y responde 422
    // same_password; la contraseña no cambia y la recuperación sigue pendiente.
    let (servicio, _) = en_nueva();
    let error = guardar(&servicio, CLAVE, CLAVE).unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str(), error.field.as_deref()),
        (
            ErrorCode::PasswordSameAsCurrent,
            "Elige una contraseña distinta de la actual.",
            Some("password")
        )
    );
    assert_eq!(
        servicio.auth().contrasena_nueva.lock().unwrap().clone(),
        None
    );
    assert!(servicio.recuperacion_pendiente().is_some());
}

#[test]
fn sesion_de_recuperacion_vencida_o_ausente() {
    // DUDA HE-01-HU08: la sesión de recuperación venció (401/403) o no existe: code.expired, nunca el genérico.
    let (servicio, _) = en_nueva();
    servicio.auth().fallar(FallaDeAuth::Rechazo {
        estado: 401,
        codigo: "bad_jwt".into(),
    });
    let error = guardar(&servicio, "Nueva123", "Nueva123").unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str()),
        (
            ErrorCode::CodeExpired,
            "El código venció. Solicita uno nuevo."
        )
    );
    let (sin_verificar, _) = en_codigo();
    assert_eq!(
        guardar(&sin_verificar, "Nueva123", "Nueva123")
            .unwrap_err()
            .code,
        ErrorCode::CodeExpired
    );
}

#[test]
fn rd_88_una_cuenta_bloqueada_se_dice_al_recuperar_la_contrasena() {
    let bloqueada = || FallaDeAuth::Rechazo {
        estado: 403,
        codigo: "user_banned".into(),
    };
    let texto = "Tu cuenta está bloqueada. Escríbenos para revisarla.";
    // Al pedir el código.
    let (servicio, _) = servicio();
    servicio.auth().fallar(bloqueada());
    let error = solicitar(&servicio, REGISTRADO).unwrap_err();
    assert_eq!(
        (error.code, error.message.as_str(), error.field),
        (ErrorCode::AuthUserBanned, texto, None)
    );
    // Al verificarlo: no se dice que el código es incorrecto.
    let (servicio, _) = en_codigo();
    servicio.auth().fallar(bloqueada());
    no_verifica(&servicio, "100001", ErrorCode::AuthUserBanned, texto);
}
