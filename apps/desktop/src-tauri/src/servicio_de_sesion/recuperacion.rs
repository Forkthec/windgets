//! Recuperar la contraseña (HE-01-HU06 a HU08; IPC-AUTH-08 a IPC-AUTH-11; INT-01 «Recuperar», INT-02).
//!
//! Supabase Auth envía el código de 6 dígitos por la cuenta de Gmail del proyecto (SMTP propio, D-195) y no
//! revela si el correo tiene cuenta: el mensaje es el mismo en los dos casos (HE-01-HU06-ET09). La recuperación
//! pendiente y su sesión viven solo en la memoria del Núcleo (IPC-AUTH-09).

use super::{
    ConMensaje, ESPERA_DE_REENVIO_MS, Reloj, ServicioDeSesion, falla_comun, inesperado, instante,
    resultado, validar_correo,
};
use crate::cliente_de_supabase::{AuthDeSupabase, FallaDeAuth};
use crate::messages;
use crate::tipos::{AppError, AuthRecoveryRequestParams, CodeSent};

/// Recuperación en curso: el correo y la hora del último envío del código.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecuperacionPendiente {
    pub correo: String,
    pub enviado_ms: i64,
}

/// Fallas de Supabase comunes a los pasos de Recuperar contraseña (HE-01-HU06-CA06; RT-04-CA13).
pub(super) fn falla_de_recuperacion(falla: FallaDeAuth) -> AppError {
    falla_comun(&falla, messages::SIN_CONEXION_RECUPERAR).unwrap_or_else(inesperado)
}

impl<A: AuthDeSupabase, R: Reloj> ServicioDeSesion<A, R> {
    pub fn recuperacion_pendiente(&self) -> Option<RecuperacionPendiente> {
        self.recuperacion.lock().ok().and_then(|r| r.clone())
    }

    pub(super) fn fijar_recuperacion(&self, recuperacion: Option<RecuperacionPendiente>) {
        if let Ok(mut actual) = self.recuperacion.lock() {
            *actual = recuperacion;
        }
    }

    /// IPC-AUTH-08 `auth_recovery_request` (HE-01-HU06): valida el correo (ET05 a ET07) y pide el código a
    /// Supabase Auth (`POST /recover`), que solo lo envía si el correo tiene cuenta (ET08). La respuesta y el
    /// mensaje son los mismos exista o no la cuenta (ET09, CA01, CA02). Un pedido nuevo reemplaza al anterior.
    pub async fn recuperar_solicitar(
        &self,
        params: AuthRecoveryRequestParams,
    ) -> Result<ConMensaje<CodeSent>, AppError> {
        if let Some(error) = validar_correo(&params.email) {
            return Err(error);
        }
        let correo = params.email.trim().to_string();
        self.auth
            .recuperar(&correo)
            .await
            .map_err(falla_de_recuperacion)?;
        let enviado_ms = self.reloj.ahora_ms();
        self.fijar_recuperacion(Some(RecuperacionPendiente { correo, enviado_ms }));
        Ok(ConMensaje {
            valor: CodeSent {
                resend_available_at: instante(enviado_ms + ESPERA_DE_REENVIO_MS),
            },
            mensaje: resultado(
                "auth_recovery_request",
                messages::CODIGO_DE_RECUPERACION_ENVIADO,
            ),
        })
    }
}
