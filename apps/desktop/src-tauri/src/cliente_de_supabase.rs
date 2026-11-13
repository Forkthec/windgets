//! Cliente de Supabase (arquitectura.md, vista 3b, Núcleo · servicios que usan la nube).
//! Responsabilidad: «Cliente HTTPS único hacia la nube: agrega apikey y JWT, aplica TLS 1.2 o 1.3, el límite de
//! espera y los reintentos.»

use crate::messages;
use crate::tipos::{AppError, ErrorCode};

/// Cómo terminó una llamada a Supabase Auth (INT-01), antes de leer su cuerpo.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RespuestaDeAuth {
    /// Se agotó el límite de espera sin respuesta.
    TiempoAgotado,
    /// Respondió con este código HTTP.
    Estado(u16),
}

/// El servicio de cuentas no responde: tiempo agotado o error 5xx → `service.unavailable` con el aviso
/// «No pudimos completar la operación. Intenta de nuevo más tarde.» (RT-04-CA13, ET24; D-205).
/// Cualquier otra respuesta la interpreta el comando `auth_*` de su HU, con sus propios códigos.
pub fn falla_del_servicio_de_cuentas(respuesta: RespuestaDeAuth) -> Option<AppError> {
    let no_responde = match respuesta {
        RespuestaDeAuth::TiempoAgotado => true,
        RespuestaDeAuth::Estado(codigo) => (500..600).contains(&codigo),
    };
    no_responde.then(|| AppError {
        code: ErrorCode::ServiceUnavailable,
        message: messages::SERVICIO_NO_DISPONIBLE.to_string(),
        field: None,
        params: None,
    })
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn ca_rt_04_ca13() {
        // RT-04-CA13 · Servicio de cuentas sin respuesta: tiempo agotado y error 5xx dan el mismo aviso, sin campo.
        for respuesta in [
            RespuestaDeAuth::TiempoAgotado,
            RespuestaDeAuth::Estado(500),
            RespuestaDeAuth::Estado(503),
        ] {
            let error = falla_del_servicio_de_cuentas(respuesta).unwrap();
            assert_eq!(error.code, ErrorCode::ServiceUnavailable);
            assert_eq!(
                error.message,
                "No pudimos completar la operación. Intenta de nuevo más tarde."
            );
            assert_eq!(error.field, None);
            let json = serde_json::to_value(&error).unwrap();
            assert_eq!(json["code"], "service.unavailable");
        }
        // Las demás respuestas no son «servicio sin respuesta»: las interpreta la HU.
        for codigo in [200, 400, 401, 422, 429] {
            assert_eq!(
                falla_del_servicio_de_cuentas(RespuestaDeAuth::Estado(codigo)),
                None
            );
        }
    }
}
