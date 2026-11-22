//! Recuperar la contraseña (HE-01-HU06 a HU08; IPC-AUTH-08 a IPC-AUTH-11; INT-01 «Recuperar», INT-02).
//!
//! Supabase Auth envía el código de 6 dígitos por la cuenta de Gmail del proyecto (SMTP propio, D-195) y no
//! revela si el correo tiene cuenta: el mensaje es el mismo en los dos casos (HE-01-HU06-ET09). La recuperación
//! pendiente y su sesión viven solo en la memoria del Núcleo (IPC-AUTH-09).

use super::{
    ConMensaje, ESPERA_DE_REENVIO_MS, Reloj, ServicioDeSesion, VIGENCIA_DEL_CODIGO_MS, con_params,
    error, falla_comun, inesperado, instante, resultado, validar_contrasena, validar_correo,
};
use crate::cliente_de_supabase::{AuthDeSupabase, FallaDeAuth, SesionDeAuth};
use crate::messages;
use crate::tipos::{
    AppError, AuthRecoveryRequestParams, AuthRecoverySetPasswordParams, AuthRecoveryVerifyParams,
    CodeSent, ErrorCode, ErrorParamsValue,
};

/// Recuperación en curso: el correo y la hora del último envío del código.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecuperacionPendiente {
    pub correo: String,
    pub enviado_ms: i64,
    /// Sesión de recuperación que entrega `/verify` con el código correcto (HE-01-HU07-CA01). Solo en memoria:
    /// no se guarda en `session.bin` ni inicia la sesión de la aplicación.
    pub sesion: Option<SesionDeAuth>,
}

/// Errores de forma del paso Nueva contraseña, todos a la vez y en el orden de la pantalla (HE-01-HU08-ET02 a
/// ET05). Confirmar contraseña no tiene obligatoriedad definida (NO DEFINIDO): vacía y distinta de la nueva es
/// `password_confirmation.mismatch`, el único error de ese campo en IPC-AUTH-11.
pub fn validar_nueva_contrasena(params: &AuthRecoverySetPasswordParams) -> Vec<AppError> {
    let distinta = (params.password_confirmation != params.password).then(|| {
        error(
            ErrorCode::PasswordConfirmationMismatch,
            messages::CONTRASENAS_NO_COINCIDEN,
            Some("password_confirmation"),
        )
    });
    [validar_contrasena(&params.password), distinta]
        .into_iter()
        .flatten()
        .collect()
}

/// Fallas de `PUT /user` (INT-01, «Recuperar: nueva contraseña»): 422 `same_password` es la contraseña actual
/// (HE-01-HU08-CA07); 422 `weak_password`, la regla de contraseñas de Supabase (CA03); 401 o 403, la sesión de
/// recuperación venció (DUDA: HE-01-HU08 no define ese caso; se usa `code.expired`).
fn falla_al_guardar(falla: FallaDeAuth) -> AppError {
    if let Some(comun) = falla_comun(&falla, messages::SIN_CONEXION_RECUPERAR) {
        return comun;
    }
    match falla {
        FallaDeAuth::Rechazo { codigo, .. } if codigo == "same_password" => error(
            ErrorCode::PasswordSameAsCurrent,
            messages::CONTRASENA_IGUAL_A_LA_ACTUAL,
            Some("password"),
        ),
        FallaDeAuth::Rechazo { codigo, .. } if codigo == "weak_password" => error(
            ErrorCode::PasswordInvalid,
            messages::CONTRASENA_INVALIDA,
            Some("password"),
        ),
        FallaDeAuth::Rechazo {
            estado: 401 | 403, ..
        } => error(ErrorCode::CodeExpired, messages::CODIGO_VENCIDO, None),
        _ => inesperado(),
    }
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
        self.fijar_recuperacion(Some(RecuperacionPendiente {
            correo,
            enviado_ms,
            sesion: None,
        }));
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

    /// Recuperación pendiente para verificar o reenviar. Sin ella (la aplicación se reinició en el paso
    /// Diligenciar código) no hay código vigente: `code.expired`, como en el registro.
    fn recuperacion_o_vencida(&self) -> Result<RecuperacionPendiente, AppError> {
        self.recuperacion_pendiente().ok_or_else(|| {
            error(
                ErrorCode::CodeExpired,
                messages::CODIGO_VENCIDO,
                Some("code"),
            )
        })
    }

    /// IPC-AUTH-09 `auth_recovery_verify` (HE-01-HU07): código obligatorio (ET07); `POST /verify` con
    /// `type: 'recovery'` lo acepta solo si es el último enviado y está vigente (ET02, ET03, ET08). Auth no
    /// distingue entre código incorrecto y vencido: decide la hora del envío (CA03, CA04). Con el código
    /// correcto guarda la sesión de recuperación en memoria (CA01).
    pub async fn recuperar_verificar(
        &self,
        params: AuthRecoveryVerifyParams,
    ) -> Result<(), AppError> {
        let codigo = params.code.trim();
        if codigo.is_empty() {
            return Err(error(
                ErrorCode::CodeRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("code"),
            ));
        }
        let pendiente = self.recuperacion_o_vencida()?;
        let vencido = self.reloj.ahora_ms() > pendiente.enviado_ms + VIGENCIA_DEL_CODIGO_MS;
        let sesion = self
            .auth
            .verificar_recuperacion(&pendiente.correo, codigo)
            .await
            .map_err(|f| {
                falla_comun(&f, messages::SIN_CONEXION_RECUPERAR).unwrap_or_else(|| {
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
        self.fijar_recuperacion(Some(RecuperacionPendiente {
            sesion: Some(sesion),
            ..pendiente
        }));
        Ok(())
    }

    /// IPC-AUTH-10 `auth_recovery_resend` (HE-01-HU07): antes de 60 s desde el último envío responde
    /// `code.resend_too_soon` con los segundos restantes (CA07, ET11); después pide otro código con
    /// `POST /recover`, que invalida el anterior (CA06, ET05, ET06, ET10).
    pub async fn recuperar_reenviar(&self) -> Result<ConMensaje<CodeSent>, AppError> {
        let pendiente = self.recuperacion_o_vencida()?;
        let faltan_ms = pendiente.enviado_ms + ESPERA_DE_REENVIO_MS - self.reloj.ahora_ms();
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
            .recuperar(&pendiente.correo)
            .await
            .map_err(falla_de_recuperacion)?;
        let enviado_ms = self.reloj.ahora_ms();
        self.fijar_recuperacion(Some(RecuperacionPendiente {
            correo: pendiente.correo,
            enviado_ms,
            sesion: None,
        }));
        Ok(ConMensaje {
            valor: CodeSent {
                resend_available_at: instante(enviado_ms + ESPERA_DE_REENVIO_MS),
            },
            mensaje: resultado("auth_recovery_resend", messages::CODIGO_REENVIADO),
        })
    }

    /// IPC-AUTH-11 `auth_recovery_set_password` (HE-01-HU08): valida la contraseña nueva como la del registro
    /// (ET02 a ET05) y la guarda con `PUT /user` y la sesión de recuperación (CA01). La contraseña igual a la
    /// actual es `password.same_as_current` (CA07, ET09). Sin conexión no se actualiza y la recuperación sigue
    /// pendiente (CA06, ET08). Con éxito cierra la sesión de recuperación; no inicia la sesión de la aplicación.
    pub async fn recuperar_guardar(
        &self,
        params: AuthRecoverySetPasswordParams,
    ) -> Result<ConMensaje<()>, AppError> {
        if let Some(primero) = validar_nueva_contrasena(&params).into_iter().next() {
            return Err(primero);
        }
        let token = self
            .recuperacion_pendiente()
            .and_then(|r| r.sesion)
            .map(|s| s.access_token)
            .ok_or_else(|| error(ErrorCode::CodeExpired, messages::CODIGO_VENCIDO, None))?;
        self.auth
            .cambiar_contrasena(&token, &params.password)
            .await
            .map_err(falla_al_guardar)?;
        self.fijar_recuperacion(None);
        Ok(ConMensaje {
            valor: (),
            mensaje: resultado(
                "auth_recovery_set_password",
                messages::CONTRASENA_ACTUALIZADA,
            ),
        })
    }
}
