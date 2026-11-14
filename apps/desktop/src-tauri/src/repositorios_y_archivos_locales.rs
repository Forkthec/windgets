//! Repositorios y archivos locales (arquitectura.md, vista 3a, Núcleo · servicios de negocio y datos locales).
//! Responsabilidad: «Acceso a las tablas locales, con cada escritura y su cambio pendiente en la misma
//! transacción, y a la caché de archivos con sha256.»
//!
//! Por ahora guarda la sesión: `%APPDATA%\Windgets\session.bin` cifrado con DPAPI del usuario actual
//! (INT-11; D-192; RNF-19: 0 tokens en texto plano).

use std::sync::Mutex;

use serde::{Deserialize, Serialize};

#[cfg(windows)]
mod dpapi;

/// Lo que se guarda en `session.bin` (INT-11: `{ access_token, refresh_token, expires_at, user_id }`).
/// DUDA: P05 el alias de `auth_get_session` sale de `profile` en la base local, que aún no existe: mientras
/// tanto se guarda también aquí, cifrado (docs/DUDAS.md).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SesionGuardada {
    pub access_token: String,
    pub refresh_token: String,
    /// Vencimiento del token de acceso, en ms desde 1970 (UTC).
    pub expires_at: i64,
    pub user_id: String,
    pub alias: String,
}

/// Dónde vive la sesión entre aperturas de la aplicación (HE-01-HU04-ET08).
pub trait AlmacenDeSesion: Send + Sync {
    /// Guarda la sesión. `false` si no se pudo escribir.
    fn guardar(&self, sesion: &SesionGuardada) -> bool;
    /// La sesión guardada, si hay una legible.
    fn leer(&self) -> Option<SesionGuardada>;
}

/// Sesión solo en memoria: las pruebas y los sistemas sin DPAPI (la aplicación es solo para Windows).
#[derive(Default)]
pub struct SesionEnMemoria(Mutex<Option<SesionGuardada>>);

impl AlmacenDeSesion for SesionEnMemoria {
    fn guardar(&self, sesion: &SesionGuardada) -> bool {
        self.0.lock().map(|mut s| *s = Some(sesion.clone())).is_ok()
    }

    fn leer(&self) -> Option<SesionGuardada> {
        self.0.lock().ok().and_then(|s| s.clone())
    }
}

/// `session.bin` cifrado con DPAPI (CryptProtectData con el alcance del usuario actual).
#[cfg(windows)]
pub struct SesionConDpapi {
    ruta: std::path::PathBuf,
}

#[cfg(windows)]
impl SesionConDpapi {
    /// `%APPDATA%\Windgets\session.bin` (INT-11).
    pub fn en_appdata() -> Option<Self> {
        let appdata = std::env::var_os("APPDATA")?;
        Some(Self {
            ruta: std::path::Path::new(&appdata)
                .join("Windgets")
                .join("session.bin"),
        })
    }
}

#[cfg(windows)]
impl AlmacenDeSesion for SesionConDpapi {
    fn guardar(&self, sesion: &SesionGuardada) -> bool {
        let Ok(claro) = serde_json::to_vec(sesion) else {
            return false;
        };
        let Some(cifrado) = dpapi::proteger(&claro) else {
            return false;
        };
        self.ruta
            .parent()
            .is_some_and(|carpeta| std::fs::create_dir_all(carpeta).is_ok())
            && std::fs::write(&self.ruta, cifrado).is_ok()
    }

    fn leer(&self) -> Option<SesionGuardada> {
        let cifrado = std::fs::read(&self.ruta).ok()?;
        let claro = dpapi::desproteger(&cifrado)?;
        serde_json::from_slice(&claro).ok()
    }
}

/// El almacén de la aplicación: DPAPI en Windows; en otro sistema, solo memoria.
pub fn almacen_de_la_aplicacion() -> Box<dyn AlmacenDeSesion> {
    #[cfg(windows)]
    if let Some(almacen) = SesionConDpapi::en_appdata() {
        return Box::new(almacen);
    }
    Box::new(SesionEnMemoria::default())
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn la_sesion_en_memoria_se_lee_como_se_guardo() {
        let almacen = SesionEnMemoria::default();
        assert_eq!(almacen.leer(), None);
        let sesion = SesionGuardada {
            access_token: "a".into(),
            refresh_token: "r".into(),
            expires_at: 1,
            user_id: "u".into(),
            alias: "Ana".into(),
        };
        assert!(almacen.guardar(&sesion));
        assert_eq!(almacen.leer(), Some(sesion));
    }
}
