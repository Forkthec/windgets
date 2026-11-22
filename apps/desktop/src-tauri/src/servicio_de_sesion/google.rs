//! Inicio de sesión con Google (HE-01-HU05; IPC-AUTH-06, IPC-AUTH-07, EV-02; INT-01 «Inicio con Google (PKCE)»,
//! INT-10; D-191, RNF-20, RNF-36).
//!
//! El Núcleo genera el verificador PKCE y un `state`, abre el navegador predeterminado en
//! `/auth/v1/authorize` y espera el regreso `windgets://auth/callback`. Solo se acepta esa ruta, mientras hay
//! una espera y con el mismo `state` (INT-10). El código se cambia por la sesión con `grant_type=pkce`.

use sha2::{Digest, Sha256};

use super::{ALIAS_MAX, Reloj, ServicioDeSesion};
use crate::cliente_de_supabase::{AuthDeSupabase, FallaDeAuth, SesionDeGoogle};
use crate::messages;
use crate::tipos::{
    AppError, AuthGoogleStartResult, ErrorCode, EventMapAuthGoogleResult,
    EventMapAuthGoogleResultStatus,
};

/// Regreso del navegador registrado por el instalador (INT-10).
pub const REGRESO: &str = "windgets://auth/callback";
/// Permisos que se piden a Google: solo `openid`, `email` y `profile` (RNF-20).
pub const PERMISOS: &str = "openid email profile";
/// Si Google no responde en 5 minutos, se cierra la espera (HE-01-HU05-ET13; DP-09).
pub const ESPERA_MAXIMA_MS: i64 = 300_000;
/// Diferencia máxima entre la creación de la cuenta y este inicio para tratarla como cuenta nueva.
/// DUDA: HE-01-HU05 EV-02 pide `is_new_account` y Supabase Auth no lo entrega (docs/DUDAS.md).
pub const CUENTA_NUEVA_MS: i64 = 60_000;

/// Un inicio con Google en espera del regreso `windgets://auth/callback` (memoria del Núcleo, IPC-AUTH-07).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EsperaDeGoogle {
    pub verificador: String,
    pub estado: String,
    pub vence_ms: i64,
}

/// Base64 URL sin relleno (RFC 4648, § 5), el formato de PKCE (RFC 7636).
pub fn base64_url(bytes: &[u8]) -> String {
    const ALFABETO: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut salida = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for trozo in bytes.chunks(3) {
        let b = [
            trozo[0],
            trozo.get(1).copied().unwrap_or(0),
            trozo.get(2).copied().unwrap_or(0),
        ];
        let n = (u32::from(b[0]) << 16) | (u32::from(b[1]) << 8) | u32::from(b[2]);
        let cifras = trozo.len() + 1;
        for i in 0..cifras {
            salida.push(char::from(ALFABETO[((n >> (18 - 6 * i)) & 63) as usize]));
        }
    }
    salida
}

/// `code_challenge = BASE64URL(SHA256(code_verifier))`, método `S256` (RFC 7636, § 4.2).
pub fn desafio(verificador: &str) -> String {
    base64_url(&Sha256::digest(verificador.as_bytes()))
}

/// Texto aleatorio de 64 caracteres URL seguros: tres UUID v4 (122 bits aleatorios cada uno, del generador del
/// sistema) en Base64 URL. Sirve de verificador PKCE (43 a 128 caracteres) y de `state`.
pub fn aleatorio() -> String {
    let bytes: Vec<u8> = (0..3)
        .flat_map(|_| *uuid::Uuid::new_v4().as_bytes())
        .collect();
    base64_url(&bytes)
}

/// El regreso con el `state` de esta espera: Supabase Auth agrega el código a esta dirección.
pub fn regreso_con_estado(estado: &str) -> String {
    format!("{REGRESO}?state={estado}")
}

/// Alias de una cuenta creada con Google (D-024): el nombre de la cuenta de Google recortado a 30 caracteres
/// (ET05, CA03); sin nombre, la parte del correo anterior a la @, también recortada (ET06, ET12, CA04). Es la
/// misma regla que `on_account_confirmed` aplica en el servidor.
pub fn alias_de_google(nombre: Option<&str>, correo: &str) -> String {
    let recortar = |texto: &str| -> String {
        texto
            .trim()
            .chars()
            .take(ALIAS_MAX)
            .collect::<String>()
            .trim()
            .to_string()
    };
    let alias = recortar(nombre.unwrap_or_default());
    if alias.is_empty() {
        recortar(correo.split('@').next().unwrap_or_default())
    } else {
        alias
    }
}

/// Lo que trae la dirección `windgets://auth/callback` (INT-01, paso 3).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Regreso {
    Codigo {
        estado: String,
        codigo: String,
    },
    Error {
        estado: String,
        error: String,
        descripcion: String,
    },
}

/// Lee `windgets://auth/callback?state=…&code=…` (o `?error=…&error_description=…`). Cualquier otra ruta o
/// esquema no es un regreso de Google y se ignora (INT-10). Supabase puede poner el error en el fragmento.
pub fn leer_regreso(direccion: &str) -> Option<Regreso> {
    let url = reqwest::Url::parse(direccion.trim()).ok()?;
    if url.scheme() != "windgets" || url.host_str() != Some("auth") || url.path() != "/callback" {
        return None;
    }
    let mut pares: Vec<(String, String)> = url.query_pairs().into_owned().collect();
    if let Some(fragmento) = url.fragment() {
        pares.extend(
            reqwest::Url::parse(&format!("windgets://auth/callback?{fragmento}"))
                .ok()?
                .query_pairs()
                .into_owned(),
        );
    }
    let valor = |clave: &str| {
        pares
            .iter()
            .find(|(k, _)| k == clave)
            .map(|(_, v)| v.clone())
    };
    let estado = valor("state").unwrap_or_default();
    if let Some(error) = valor("error") {
        return Some(Regreso::Error {
            estado,
            error,
            descripcion: valor("error_description").unwrap_or_default(),
        });
    }
    valor("code").map(|codigo| Regreso::Codigo { estado, codigo })
}

/// Resultado de EV-02 `auth_google_result` sin cuenta iniciada.
pub fn resultado(status: EventMapAuthGoogleResultStatus) -> EventMapAuthGoogleResult {
    let message = match status {
        EventMapAuthGoogleResultStatus::Cancelled => messages::GOOGLE_CANCELADO,
        EventMapAuthGoogleResultStatus::EmailTooLong => messages::GOOGLE_CORREO_MUY_LARGO,
        EventMapAuthGoogleResultStatus::Error | EventMapAuthGoogleResultStatus::Success => {
            messages::GOOGLE_ERROR
        }
    };
    EventMapAuthGoogleResult {
        status,
        is_new_account: None,
        alias: None,
        message: message.to_string(),
    }
}

/// Error que devuelve Supabase Auth en el regreso (INT-01, paso 5): rechazar o cerrar la página de Google es
/// `access_denied` → `cancelled` (CA05); el alta rechazada por `validate_new_user` (correo de más de 64
/// caracteres) → `email_too_long` (CA08, ET07); cualquier otro → `error` (CA06, ET09).
/// DUDA: HE-01-HU05 Supabase Auth no reenvía el texto `email_too_long` del disparador: responde
/// «Database error saving new user» para cualquier falla al guardar el usuario nuevo (docs/DUDAS.md).
pub fn estado_del_error(error: &str, descripcion: &str) -> EventMapAuthGoogleResultStatus {
    if error == "access_denied" {
        EventMapAuthGoogleResultStatus::Cancelled
    } else if descripcion.contains("email_too_long")
        || descripcion.contains("Database error saving new user")
    {
        EventMapAuthGoogleResultStatus::EmailTooLong
    } else {
        EventMapAuthGoogleResultStatus::Error
    }
}

impl<A: AuthDeSupabase, R: Reloj> ServicioDeSesion<A, R> {
    pub fn espera_de_google(&self) -> Option<EsperaDeGoogle> {
        self.google.lock().ok().and_then(|e| e.clone())
    }

    fn fijar_espera(&self, espera: Option<EsperaDeGoogle>) {
        if let Ok(mut actual) = self.google.lock() {
            *actual = espera;
        }
    }

    /// Termina la espera si es la indicada (o cualquiera, sin `estado`) y la devuelve.
    fn tomar_espera(&self, estado: Option<&str>) -> Option<EsperaDeGoogle> {
        let mut actual = self.google.lock().ok()?;
        if estado.is_some_and(|e| actual.as_ref().is_none_or(|a| a.estado != e)) {
            return None;
        }
        actual.take()
    }

    /// IPC-AUTH-06 `auth_google_start`: sin conexión responde `net.offline` y no abre la ventana de Google
    /// (CA07, ET10; DP-03). Con conexión prepara una espera nueva, que reemplaza a la anterior, y devuelve la
    /// dirección que se abre en el navegador predeterminado (RNF-36) con el vencimiento de la espera (ET13).
    pub fn iniciar_google(
        &self,
        en_linea: bool,
    ) -> Result<(String, AuthGoogleStartResult), AppError> {
        if !en_linea {
            return Err(AppError {
                code: ErrorCode::NetOffline,
                message: messages::SIN_CONEXION_INICIO.to_string(),
                field: None,
                params: None,
            });
        }
        let espera = EsperaDeGoogle {
            verificador: aleatorio(),
            estado: aleatorio(),
            vence_ms: self.reloj.ahora_ms() + ESPERA_MAXIMA_MS,
        };
        let direccion = self.auth.url_de_google(
            &desafio(&espera.verificador),
            &regreso_con_estado(&espera.estado),
            PERMISOS,
        );
        let vence = super::instante(espera.vence_ms);
        self.fijar_espera(Some(espera));
        Ok((direccion, AuthGoogleStartResult { expires_at: vence }))
    }

    /// IPC-AUTH-07 `auth_google_cancel`: cierra la espera; el resultado es `cancelled` (CA05).
    pub fn cancelar_google(&self) -> EventMapAuthGoogleResult {
        self.fijar_espera(None);
        resultado(EventMapAuthGoogleResultStatus::Cancelled)
    }

    /// ET13: si la espera con este `state` sigue abierta y ya pasaron 5 minutos, se cierra con `cancelled`.
    pub fn vencer_google(&self, estado: &str) -> Option<EventMapAuthGoogleResult> {
        let vencida = self
            .espera_de_google()
            .is_some_and(|e| e.estado == estado && self.reloj.ahora_ms() >= e.vence_ms);
        vencida.then(|| {
            self.fijar_espera(None);
            resultado(EventMapAuthGoogleResultStatus::Cancelled)
        })
    }

    /// Atiende la dirección `windgets://auth/callback` que entrega Windows (INT-10). `None` si no es un regreso
    /// de Google, si no hay una espera o si el `state` no es el de la espera: la dirección se ignora.
    pub async fn atender_regreso(&self, direccion: &str) -> Option<EventMapAuthGoogleResult> {
        let regreso = leer_regreso(direccion)?;
        let estado = match &regreso {
            Regreso::Codigo { estado, .. } | Regreso::Error { estado, .. } => estado,
        };
        let espera = self.tomar_espera(Some(estado))?;
        if self.reloj.ahora_ms() >= espera.vence_ms {
            return Some(resultado(EventMapAuthGoogleResultStatus::Cancelled));
        }
        let codigo = match regreso {
            Regreso::Error {
                error, descripcion, ..
            } => return Some(resultado(estado_del_error(&error, &descripcion))),
            Regreso::Codigo { codigo, .. } => codigo,
        };
        Some(
            match self
                .auth
                .intercambiar_google(&codigo, &espera.verificador)
                .await
            {
                Ok(google) => self.abrir_sesion_de_google(&google),
                Err(FallaDeAuth::Rechazo { codigo, .. }) if codigo == "email_too_long" => {
                    resultado(EventMapAuthGoogleResultStatus::EmailTooLong)
                }
                // ET09: sin red, sin respuesta o `invalid_grant`: no se inicia la sesión (CA06).
                Err(_) => resultado(EventMapAuthGoogleResultStatus::Error),
            },
        )
    }

    /// Guarda la sesión (ET02, ET03) y arma el resultado: el alias es el de la cuenta (el del registro, si el
    /// correo ya tenía cuenta) o el que sale de Google (ET05, ET06, ET12). Una cuenta nueva no pide código
    /// (ET04) y lleva el mensaje de bienvenida (CA01, CA03, CA04); una existente, ninguno (CA02).
    fn abrir_sesion_de_google(&self, google: &SesionDeGoogle) -> EventMapAuthGoogleResult {
        let alias = if google.sesion.alias.trim().is_empty() {
            alias_de_google(google.nombre.as_deref(), &google.correo)
        } else {
            google.sesion.alias.trim().to_string()
        };
        self.guardar_sesion(&google.sesion, &alias);
        let nueva = google.nueva(CUENTA_NUEVA_MS);
        EventMapAuthGoogleResult {
            status: EventMapAuthGoogleResultStatus::Success,
            is_new_account: Some(nueva),
            message: if nueva {
                messages::BIENVENIDA.replace("<alias>", &alias)
            } else {
                String::new()
            },
            alias: Some(alias),
        }
    }
}
