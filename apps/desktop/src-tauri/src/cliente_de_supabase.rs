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
    /// `POST /resend` `{ type: 'signup', email }`: envía un código nuevo e invalida el anterior.
    fn reenviar_registro(
        &self,
        correo: &str,
    ) -> impl Future<Output = Result<(), FallaDeAuth>> + Send;
    /// `POST /verify` `{ type: 'signup', email, token }`: verifica el correo, crea la cuenta y abre la sesión.
    fn verificar_registro(
        &self,
        correo: &str,
        codigo: &str,
    ) -> impl Future<Output = Result<SesionDeAuth, FallaDeAuth>> + Send;
    /// `POST /token?grant_type=password` `{ email, password }`: abre la sesión de una cuenta verificada. Un
    /// correo no registrado y una contraseña incorrecta responden igual: 400 `invalid_credentials`.
    fn iniciar_con_contrasena(
        &self,
        correo: &str,
        contrasena: &str,
    ) -> impl Future<Output = Result<SesionDeAuth, FallaDeAuth>> + Send;
    /// `POST /token?grant_type=refresh_token` `{ refresh_token }`: entrega la sesión nueva (INT-01, «Renovar
    /// token»). Un 400 `refresh_token_not_found` o `session_expired` significa que ya no se puede renovar.
    fn renovar(
        &self,
        refresh_token: &str,
    ) -> impl Future<Output = Result<SesionDeAuth, FallaDeAuth>> + Send;
    /// `POST /recover` `{ email }` (INT-01, «Recuperar: enviar código»): responde 200 exista o no la cuenta y
    /// solo envía el código si la tiene.
    fn recuperar(&self, correo: &str) -> impl Future<Output = Result<(), FallaDeAuth>> + Send;
    /// `GET /auth/v1/authorize?provider=google&redirect_to=…&code_challenge=…&code_challenge_method=s256&scopes=…`
    /// (INT-01, «Inicio con Google (PKCE)», paso 2): la dirección que se abre en el navegador predeterminado.
    fn url_de_google(&self, desafio: &str, regreso: &str, permisos: &str) -> String;
    /// `POST /token?grant_type=pkce` `{ auth_code, code_verifier }` (paso 4): la sesión de la cuenta de Google.
    fn intercambiar_google(
        &self,
        codigo: &str,
        verificador: &str,
    ) -> impl Future<Output = Result<SesionDeGoogle, FallaDeAuth>> + Send;
}

/// Sesión del inicio con Google con los datos de la cuenta que decide el alias y si la cuenta es nueva.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SesionDeGoogle {
    pub sesion: SesionDeAuth,
    pub correo: String,
    /// `user_metadata.full_name` (o `name`) de Google; `None` si la cuenta de Google no tiene nombre.
    pub nombre: Option<String>,
    /// `user.created_at` y `user.last_sign_in_at`, en milisegundos desde 1970.
    pub creada_ms: Option<i64>,
    pub ingreso_ms: Option<i64>,
}

impl SesionDeGoogle {
    /// La cuenta se creó en este inicio: Supabase la crea y la inicia en el mismo regreso, así que la creación
    /// y el último inicio quedan a menos de `margen_ms`.
    pub fn nueva(&self, margen_ms: i64) -> bool {
        matches!((self.creada_ms, self.ingreso_ms), (Some(c), Some(i)) if (i - c).abs() <= margen_ms)
    }
}

/// Lee la respuesta de `grant_type=pkce`: la sesión y los datos de la cuenta de Google.
pub fn leer_sesion_de_google(cuerpo: &str) -> Result<SesionDeGoogle, FallaDeAuth> {
    let sesion = leer_sesion(cuerpo)?;
    let json: serde_json::Value =
        serde_json::from_str(cuerpo).map_err(|_| FallaDeAuth::SinRespuesta)?;
    let texto = |ruta: &str| {
        json.pointer(ruta)
            .and_then(|v| v.as_str())
            .map(str::trim)
            .filter(|v| !v.is_empty())
            .map(str::to_string)
    };
    let fecha = |ruta: &str| {
        texto(ruta)
            .and_then(|v| chrono::DateTime::parse_from_rfc3339(&v).ok())
            .map(|f| f.timestamp_millis())
    };
    Ok(SesionDeGoogle {
        correo: texto("/user/email").unwrap_or_default(),
        nombre: texto("/user/user_metadata/full_name")
            .or_else(|| texto("/user/user_metadata/name")),
        creada_ms: fecha("/user/created_at"),
        ingreso_ms: fecha("/user/last_sign_in_at"),
        sesion,
    })
}

/// Codifica un valor para la consulta de una dirección (RFC 3986: solo letras, cifras y `-._~` van sin cambio).
pub fn codificar(valor: &str) -> String {
    valor
        .bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~' => {
                char::from(b).to_string()
            }
            _ => format!("%{b:02X}"),
        })
        .collect()
}

/// La dirección de `/auth/v1/authorize` para Google con PKCE (INT-01, paso 2).
pub fn direccion_de_google(base: &str, desafio: &str, regreso: &str, permisos: &str) -> String {
    format!(
        "{base}/auth/v1/authorize?provider=google&redirect_to={}&code_challenge={}&code_challenge_method=s256&scopes={}",
        codificar(regreso),
        codificar(desafio),
        codificar(permisos)
    )
}

/// Sesión que entrega Supabase Auth (`access_token`, `refresh_token`, `expires_in`, `user`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SesionDeAuth {
    pub access_token: String,
    pub refresh_token: String,
    /// Segundos de vigencia del token de acceso.
    pub expires_in: i64,
    pub user_id: String,
    /// Alias guardado al registrarse (`user.user_metadata.alias`, de `data: { alias }` en `/signup`).
    pub alias: String,
}

/// Lee la sesión del cuerpo de `/verify` o `/token`. Un cuerpo sin tokens se trata como servicio sin respuesta.
pub fn leer_sesion(cuerpo: &str) -> Result<SesionDeAuth, FallaDeAuth> {
    let json: serde_json::Value =
        serde_json::from_str(cuerpo).map_err(|_| FallaDeAuth::SinRespuesta)?;
    let texto = |ruta: &str| {
        json.pointer(ruta)
            .and_then(|v| v.as_str())
            .map(str::to_string)
    };
    Ok(SesionDeAuth {
        access_token: texto("/access_token").ok_or(FallaDeAuth::SinRespuesta)?,
        refresh_token: texto("/refresh_token").ok_or(FallaDeAuth::SinRespuesta)?,
        expires_in: json
            .get("expires_in")
            .and_then(|v| v.as_i64())
            .unwrap_or_default(),
        user_id: texto("/user/id").ok_or(FallaDeAuth::SinRespuesta)?,
        alias: texto("/user/user_metadata/alias").unwrap_or_default(),
    })
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
        self.enviar_como(metodo, ruta, cuerpo, None).await
    }

    /// Como [`Self::enviar`], con el JWT de la sesión (`Authorization: Bearer`) si se indica.
    async fn enviar_como(
        &self,
        metodo: reqwest::Method,
        ruta: &str,
        cuerpo: Option<serde_json::Value>,
        token: Option<&str>,
    ) -> Result<String, FallaDeAuth> {
        // Sin proyecto configurado no hay a quién llamar: el servicio de cuentas no está disponible.
        let Some(http) = self.http.as_ref().filter(|_| !self.url.is_empty()) else {
            return Err(FallaDeAuth::SinRespuesta);
        };
        let mut peticion = http
            .request(metodo, format!("{}{ruta}", self.url))
            .header("apikey", &self.anon);
        if let Some(token) = token {
            peticion = peticion.bearer_auth(token);
        }
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

/// EF-01 `windi-chat` (HE-14-HU01): el mensaje, el historial y el contexto, con el JWT de la sesión. Espera como
/// máximo 15 s (RNF-11; D-172); sin red es `SinConexion` y cualquier otra falla (tiempo agotado, 4xx, 5xx o una
/// respuesta que no se entiende) es `NoDisponible` (HE-14-HU01-CA08).
impl crate::servicio_de_windi::AgenteEnLaNube for ClienteDeSupabase {
    async fn conversar(
        &self,
        token: &str,
        peticion: &crate::tipos::WindiChatRequest,
    ) -> Result<crate::tipos::WindiChatResponse, crate::servicio_de_windi::FallaDeWindi> {
        use crate::servicio_de_windi::{ESPERA_MAXIMA, FallaDeWindi};
        let Some(http) = self.http.as_ref().filter(|_| !self.url.is_empty()) else {
            return Err(FallaDeWindi::NoDisponible);
        };
        let respuesta = http
            .post(format!("{}/functions/v1/windi-chat", self.url))
            .header("apikey", &self.anon)
            .bearer_auth(token)
            .timeout(ESPERA_MAXIMA)
            .json(peticion)
            .send()
            .await;
        let respuesta = match respuesta {
            Ok(respuesta) => respuesta,
            Err(error) => {
                let sin_red = error.is_connect();
                self.en_linea.store(!sin_red, Ordering::Relaxed);
                return Err(if sin_red {
                    FallaDeWindi::SinConexion
                } else {
                    FallaDeWindi::NoDisponible
                });
            }
        };
        self.en_linea.store(true, Ordering::Relaxed);
        if !respuesta.status().is_success() {
            return Err(FallaDeWindi::NoDisponible);
        }
        respuesta
            .json::<crate::tipos::WindiChatResponse>()
            .await
            .map_err(|_| FallaDeWindi::NoDisponible)
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

    async fn reenviar_registro(&self, correo: &str) -> Result<(), FallaDeAuth> {
        let cuerpo = serde_json::json!({ "type": "signup", "email": correo });
        self.enviar(reqwest::Method::POST, "/auth/v1/resend", Some(cuerpo))
            .await
            .map(|_| ())
    }

    async fn verificar_registro(
        &self,
        correo: &str,
        codigo: &str,
    ) -> Result<SesionDeAuth, FallaDeAuth> {
        let cuerpo = serde_json::json!({ "type": "signup", "email": correo, "token": codigo });
        let texto = self
            .enviar(reqwest::Method::POST, "/auth/v1/verify", Some(cuerpo))
            .await?;
        leer_sesion(&texto)
    }

    async fn iniciar_con_contrasena(
        &self,
        correo: &str,
        contrasena: &str,
    ) -> Result<SesionDeAuth, FallaDeAuth> {
        let cuerpo = serde_json::json!({ "email": correo, "password": contrasena });
        let texto = self
            .enviar(
                reqwest::Method::POST,
                "/auth/v1/token?grant_type=password",
                Some(cuerpo),
            )
            .await?;
        leer_sesion(&texto)
    }

    async fn renovar(&self, refresh_token: &str) -> Result<SesionDeAuth, FallaDeAuth> {
        let cuerpo = serde_json::json!({ "refresh_token": refresh_token });
        let texto = self
            .enviar(
                reqwest::Method::POST,
                "/auth/v1/token?grant_type=refresh_token",
                Some(cuerpo),
            )
            .await?;
        leer_sesion(&texto)
    }

    async fn recuperar(&self, correo: &str) -> Result<(), FallaDeAuth> {
        let cuerpo = serde_json::json!({ "email": correo });
        self.enviar(reqwest::Method::POST, "/auth/v1/recover", Some(cuerpo))
            .await
            .map(|_| ())
    }

    fn url_de_google(&self, desafio: &str, regreso: &str, permisos: &str) -> String {
        direccion_de_google(&self.url, desafio, regreso, permisos)
    }

    async fn intercambiar_google(
        &self,
        codigo: &str,
        verificador: &str,
    ) -> Result<SesionDeGoogle, FallaDeAuth> {
        let cuerpo = serde_json::json!({ "auth_code": codigo, "code_verifier": verificador });
        let texto = self
            .enviar(
                reqwest::Method::POST,
                "/auth/v1/token?grant_type=pkce",
                Some(cuerpo),
            )
            .await?;
        leer_sesion_de_google(&texto)
    }
}

impl ClienteDeSupabase {
    /// Llama una Edge Function (`/functions/v1/<nombre>`) con el JWT de la sesión.
    async fn funcion<T: serde::de::DeserializeOwned>(
        &self,
        nombre: &str,
        token: &str,
        cuerpo: &impl serde::Serialize,
    ) -> Result<T, FallaDeAuth> {
        let cuerpo = serde_json::to_value(cuerpo).map_err(|_| FallaDeAuth::SinRespuesta)?;
        let texto = self
            .enviar_como(
                reqwest::Method::POST,
                &format!("/functions/v1/{nombre}"),
                Some(cuerpo),
                Some(token),
            )
            .await?;
        serde_json::from_str(&texto).map_err(|_| FallaDeAuth::SinRespuesta)
    }
}

/// EF-02 `weather-geocode` y EF-03 `weather-current` (HE-04-HU05; INT-04).
impl crate::servicio_de_clima_y_noticias::NubeDeClima for ClienteDeSupabase {
    async fn geocodificar(
        &self,
        token: &str,
        peticion: &crate::tipos::WeatherGeocodeRequest,
    ) -> Result<crate::tipos::WeatherGeocodeResponse, FallaDeAuth> {
        self.funcion("weather-geocode", token, peticion).await
    }

    async fn clima_actual(
        &self,
        token: &str,
        peticion: &crate::tipos::WeatherCurrentRequest,
    ) -> Result<crate::tipos::WeatherCurrentResponse, FallaDeAuth> {
        self.funcion("weather-current", token, peticion).await
    }

    async fn titulares(
        &self,
        token: &str,
        peticion: &crate::tipos::NewsHeadlinesRequest,
    ) -> Result<crate::tipos::NewsHeadlinesResponse, FallaDeAuth> {
        self.funcion("news-headlines", token, peticion).await
    }
}

impl crate::motor_de_sincronizacion::NubeDeSincronizacion for ClienteDeSupabase {
    async fn sync_push(
        &self,
        token: &str,
        params: &crate::tipos::SyncPushParams,
    ) -> Result<crate::tipos::SyncPushResult, FallaDeAuth> {
        let cuerpo = serde_json::to_value(params).map_err(|_| FallaDeAuth::SinRespuesta)?;
        let texto = self
            .enviar_como(
                reqwest::Method::POST,
                "/rest/v1/rpc/sync_push",
                Some(cuerpo),
                Some(token),
            )
            .await?;
        serde_json::from_str(&texto).map_err(|_| FallaDeAuth::SinRespuesta)
    }

    async fn sync_pull(
        &self,
        token: &str,
        params: &crate::tipos::SyncPullParams,
    ) -> Result<crate::tipos::SyncPullResult, FallaDeAuth> {
        let cuerpo = serde_json::to_value(params).map_err(|_| FallaDeAuth::SinRespuesta)?;
        let texto = self
            .enviar_como(
                reqwest::Method::POST,
                "/rest/v1/rpc/sync_pull",
                Some(cuerpo),
                Some(token),
            )
            .await?;
        serde_json::from_str(&texto).map_err(|_| FallaDeAuth::SinRespuesta)
    }

    async fn catalog_pull(
        &self,
        token: &str,
        params: &crate::tipos::CatalogPullParams,
    ) -> Result<Option<crate::tipos::CatalogPullResultVariant2>, FallaDeAuth> {
        let cuerpo = serde_json::to_value(params).map_err(|_| FallaDeAuth::SinRespuesta)?;
        let texto = self
            .enviar_como(
                reqwest::Method::POST,
                "/rest/v1/rpc/catalog_pull",
                Some(cuerpo),
                Some(token),
            )
            .await?;
        crate::motor_de_sincronizacion::catalogo::leer_respuesta(&texto)
    }

    async fn server_time(&self, token: &str) -> Result<crate::tipos::Instant, FallaDeAuth> {
        let texto = self
            .enviar_como(
                reqwest::Method::POST,
                "/rest/v1/rpc/server_time",
                Some(serde_json::json!({})),
                Some(token),
            )
            .await?;
        serde_json::from_str(&texto).map_err(|_| FallaDeAuth::SinRespuesta)
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
    fn leer_la_sesion_de_auth() {
        // INT-01, ejemplo de /verify: tokens, vigencia, usuario y el alias de los metadatos del registro.
        let cuerpo = r#"{ "access_token": "eyJ", "token_type": "bearer", "expires_in": 3600, "refresh_token": "r1",
            "user": { "id": "0b6e", "email": "estef@example.com", "user_metadata": { "alias": "Estef" } } }"#;
        let sesion = leer_sesion(cuerpo).unwrap();
        assert_eq!(
            (sesion.access_token.as_str(), sesion.refresh_token.as_str()),
            ("eyJ", "r1")
        );
        assert_eq!(
            (
                sesion.expires_in,
                sesion.user_id.as_str(),
                sesion.alias.as_str()
            ),
            (3600, "0b6e", "Estef")
        );
        assert_eq!(leer_sesion("{}"), Err(FallaDeAuth::SinRespuesta));
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
