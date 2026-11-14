//! Cliente de Supabase (arquitectura.md, vista 3b, Núcleo · servicios que usan la nube).
//! Responsabilidad: «Cliente HTTPS único hacia la nube: agrega apikey y JWT, aplica TLS 1.2 o 1.3, el límite de
//! espera y los reintentos.»
//!
//! Supabase Auth (INT-01) queda detrás del trait [`AuthDeSupabase`]: el Servicio de sesión solo ve
//! [`FallaDeAuth`] y las pruebas usan un doble. [`ClienteDeSupabase`] es el adaptador real con `reqwest`.

use std::future::Future;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

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

/// Falla de una llamada a Supabase Auth o a una RPC, ya clasificada (INT-01, «Mapa de fallas»).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FallaDeAuth {
    /// Sin red: no se pudo conectar con la nube (`net.offline`).
    SinConexion,
    /// Tiempo agotado o error 5xx (`service.unavailable`, D-205).
    SinRespuesta,
    /// Respuesta 4xx con su `error_code` de Supabase (vacío si no trae).
    Rechazo { estado: u16, codigo: String },
}

/// Lee una respuesta HTTP de Supabase: 2xx es correcta; 5xx, `SinRespuesta`; lo demás, `Rechazo` con el
/// `error_code` del cuerpo (`{ "error_code": "invalid_credentials", … }`; las RPC traen `code`).
pub fn interpretar_respuesta(estado: u16, cuerpo: &str) -> Result<(), FallaDeAuth> {
    if (200..300).contains(&estado) {
        return Ok(());
    }
    if falla_del_servicio_de_cuentas(RespuestaDeAuth::Estado(estado)).is_some() {
        return Err(FallaDeAuth::SinRespuesta);
    }
    let json: serde_json::Value = serde_json::from_str(cuerpo).unwrap_or_default();
    let codigo = ["error_code", "code"]
        .iter()
        .find_map(|clave| json.get(*clave).and_then(|v| v.as_str()))
        .unwrap_or_default()
        .to_string();
    Err(FallaDeAuth::Rechazo { estado, codigo })
}

/// Supabase Auth y las RPC de cuenta que usa el Servicio de sesión (INT-01; RPC-05).
pub trait AuthDeSupabase: Send + Sync {
    /// RPC-05 `email_is_registered(p_email)`: `true` si el correo tiene una cuenta verificada.
    fn correo_registrado(
        &self,
        correo: &str,
    ) -> impl Future<Output = Result<bool, FallaDeAuth>> + Send;
    /// `POST /signup` `{ email, password, data: { alias } }`: crea la cuenta sin verificar y envía el código.
    fn registrar(
        &self,
        correo: &str,
        contrasena: &str,
        alias: &str,
    ) -> impl Future<Output = Result<(), FallaDeAuth>> + Send;
}

/// Límite de espera de cada llamada a la nube. DUDA: P05 el valor no está definido (docs/DUDAS.md).
pub const LIMITE_DE_ESPERA: Duration = Duration::from_secs(10);

/// Adaptador real de INT-01 con `reqwest`, TLS 1.2 o superior (RNF-18). La URL del proyecto y la clave pública
/// (anon) se fijan al compilar (`WINDGETS_SUPABASE_URL`, `WINDGETS_SUPABASE_ANON_KEY`; D-192).
pub struct ClienteDeSupabase {
    http: Option<reqwest::Client>,
    url: String,
    anon: String,
    en_linea: AtomicBool,
}

impl ClienteDeSupabase {
    pub fn desde_compilacion() -> Self {
        Self::nuevo(
            option_env!("WINDGETS_SUPABASE_URL").unwrap_or_default(),
            option_env!("WINDGETS_SUPABASE_ANON_KEY").unwrap_or_default(),
        )
    }

    pub fn nuevo(url: &str, anon: &str) -> Self {
        let http = reqwest::Client::builder()
            .min_tls_version(reqwest::tls::Version::TLS_1_2)
            .https_only(true)
            .timeout(LIMITE_DE_ESPERA)
            .build()
            .ok();
        Self {
            http,
            url: url.trim_end_matches('/').to_string(),
            anon: anon.to_string(),
            en_linea: AtomicBool::new(true),
        }
    }

    /// Estado de la red según la última llamada a la nube (EV-03 `connectivity_changed`).
    pub fn en_linea(&self) -> bool {
        self.en_linea.load(Ordering::Relaxed)
    }

    /// Comprueba si la nube vuelve a responder (`GET /auth/v1/health`). Devuelve el estado nuevo.
    pub async fn comprobar_conexion(&self) -> bool {
        let _ = self
            .enviar(reqwest::Method::GET, "/auth/v1/health", None)
            .await;
        self.en_linea()
    }

    async fn enviar(
        &self,
        metodo: reqwest::Method,
        ruta: &str,
        cuerpo: Option<serde_json::Value>,
    ) -> Result<String, FallaDeAuth> {
        // Sin proyecto configurado no hay a quién llamar: el servicio de cuentas no está disponible.
        let Some(http) = self.http.as_ref().filter(|_| !self.url.is_empty()) else {
            return Err(FallaDeAuth::SinRespuesta);
        };
        let mut peticion = http
            .request(metodo, format!("{}{ruta}", self.url))
            .header("apikey", &self.anon);
        if let Some(cuerpo) = cuerpo {
            peticion = peticion.json(&cuerpo);
        }
        let respuesta = match peticion.send().await {
            Ok(respuesta) => respuesta,
            Err(error) => {
                let falla = if error.is_connect() {
                    FallaDeAuth::SinConexion
                } else {
                    FallaDeAuth::SinRespuesta
                };
                self.en_linea
                    .store(falla != FallaDeAuth::SinConexion, Ordering::Relaxed);
                return Err(falla);
            }
        };
        self.en_linea.store(true, Ordering::Relaxed);
        let estado = respuesta.status().as_u16();
        let texto = respuesta
            .text()
            .await
            .map_err(|_| FallaDeAuth::SinRespuesta)?;
        interpretar_respuesta(estado, &texto).map(|()| texto)
    }
}

impl AuthDeSupabase for ClienteDeSupabase {
    async fn correo_registrado(&self, correo: &str) -> Result<bool, FallaDeAuth> {
        let cuerpo = serde_json::json!({ "p_email": correo });
        let texto = self
            .enviar(
                reqwest::Method::POST,
                "/rest/v1/rpc/email_is_registered",
                Some(cuerpo),
            )
            .await?;
        serde_json::from_str(&texto).map_err(|_| FallaDeAuth::SinRespuesta)
    }

    async fn registrar(
        &self,
        correo: &str,
        contrasena: &str,
        alias: &str,
    ) -> Result<(), FallaDeAuth> {
        let cuerpo = serde_json::json!({ "email": correo, "password": contrasena, "data": { "alias": alias } });
        self.enviar(reqwest::Method::POST, "/auth/v1/signup", Some(cuerpo))
            .await
            .map(|_| ())
    }
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

    #[test]
    fn interpretar_respuesta_de_auth() {
        // INT-01, «Mapa de fallas»: 2xx correcta, 5xx sin respuesta y 4xx con el error_code de Supabase.
        assert_eq!(interpretar_respuesta(200, "{}"), Ok(()));
        assert_eq!(
            interpretar_respuesta(502, ""),
            Err(FallaDeAuth::SinRespuesta)
        );
        assert_eq!(
            interpretar_respuesta(
                400,
                r#"{ "code": 400, "error_code": "invalid_credentials", "msg": "Invalid login credentials" }"#
            ),
            Err(FallaDeAuth::Rechazo {
                estado: 400,
                codigo: "invalid_credentials".into()
            })
        );
        assert_eq!(
            interpretar_respuesta(400, r#"{ "code": "WG001", "message": "invalid_email" }"#),
            Err(FallaDeAuth::Rechazo {
                estado: 400,
                codigo: "WG001".into()
            })
        );
        assert_eq!(
            interpretar_respuesta(429, "sin json"),
            Err(FallaDeAuth::Rechazo {
                estado: 429,
                codigo: String::new()
            })
        );
    }

    #[test]
    fn sin_proyecto_configurado_el_servicio_no_esta_disponible() {
        // Sin WINDGETS_SUPABASE_URL no se llama a nadie y no se marca la red como caída.
        let cliente = ClienteDeSupabase::nuevo("", "");
        let futuro = cliente.correo_registrado("ana@example.com");
        assert_eq!(
            crate::servicio_de_sesion::pruebas::esperar(futuro),
            Err(FallaDeAuth::SinRespuesta)
        );
        assert!(cliente.en_linea());
    }
}
