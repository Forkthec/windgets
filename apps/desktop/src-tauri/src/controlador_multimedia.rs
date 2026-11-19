//! Controlador multimedia (arquitectura.md, vista 3c, Núcleo · integración con Windows).
//! Responsabilidad: «Lee la sesión actual (título, artista, carátula, estado) y envía reproducir, pausar,
//! anterior y siguiente.»
//!
//! HE-04-HU11 (D-175; INT-06): la sesión actual de los controles multimedia de Windows (SMTC,
//! `Windows.Media.Control`). Con varias sesiones, la que Windows marca como actual (ET06). Sin Windows no hay
//! sesión.

#[cfg(windows)]
mod smtc;

use crate::messages;
use crate::servicio_del_planificador::error;
use crate::tipos::{AppError, ErrorCode, MediaSession, PlaybackStatus};

/// HE-04-HU11-ET07: sin ninguna aplicación que publique una reproducción.
pub fn sin_sesion() -> MediaSession {
    MediaSession {
        has_session: false,
        title: None,
        artist: None,
        thumbnail_url: None,
        status: PlaybackStatus::Stopped,
        can_previous: false,
        can_next: false,
        can_play_pause: false,
    }
}

/// IPC-MED-01 `media_get_session`: la sesión actual de Windows (ET03, ET06).
pub fn sesion_actual() -> MediaSession {
    #[cfg(windows)]
    {
        smtc::leer().unwrap_or_else(|_| sin_sesion())
    }
    #[cfg(not(windows))]
    {
        sin_sesion()
    }
}

/// Las acciones de los controles del widget (IPC-MED-02 a 04).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Accion {
    ReproducirOPausar,
    Siguiente,
    Anterior,
}

/// Envía la acción a la sesión actual. Sin sesión: `media.no_session`; si la aplicación no la permite:
/// `media.action_unsupported` (sin texto, el control aparece deshabilitado).
pub fn ejecutar(accion: Accion) -> Result<(), AppError> {
    let sesion = sesion_actual();
    validar(&sesion, accion)?;
    #[cfg(windows)]
    {
        smtc::ejecutar(accion).map_err(|_| error(ErrorCode::MediaActionUnsupported, "", None))
    }
    #[cfg(not(windows))]
    {
        Ok(())
    }
}

/// La regla de los controles: sin sesión no hay acción, y cada control solo si la aplicación lo permite.
pub fn validar(sesion: &MediaSession, accion: Accion) -> Result<(), AppError> {
    if !sesion.has_session {
        return Err(error(ErrorCode::MediaNoSession, messages::SIN_MUSICA, None));
    }
    let permitida = match accion {
        Accion::ReproducirOPausar => sesion.can_play_pause,
        Accion::Siguiente => sesion.can_next,
        Accion::Anterior => sesion.can_previous,
    };
    if permitida {
        Ok(())
    } else {
        Err(error(ErrorCode::MediaActionUnsupported, "", None))
    }
}

#[cfg(test)]
mod pruebas {
    use super::*;

    fn sonando() -> MediaSession {
        MediaSession {
            has_session: true,
            title: Some("Canción".into()),
            artist: Some("Artista".into()),
            thumbnail_url: None,
            status: PlaybackStatus::Playing,
            can_previous: false,
            can_next: true,
            can_play_pause: true,
        }
    }

    #[test]
    fn ca_he_04_hu11_ca03() {
        // HE-04-HU11-CA03 · Sin música en reproducción: sin título ni controles (ET07) y las acciones responden
        // `media.no_session` con «No hay música en reproducción.».
        let s = sin_sesion();
        assert!(!s.has_session);
        assert!(!s.can_play_pause && !s.can_next && !s.can_previous);
        let e = validar(&s, Accion::ReproducirOPausar).unwrap_err();
        assert_eq!(e.code, ErrorCode::MediaNoSession);
        assert_eq!(e.message, "No hay música en reproducción.");
    }

    #[test]
    fn ca_he_04_hu11_ca01() {
        // HE-04-HU11-CA01 · Con música, cada control actúa si la aplicación lo permite (ET03).
        let s = sonando();
        assert!(validar(&s, Accion::ReproducirOPausar).is_ok());
        assert!(validar(&s, Accion::Siguiente).is_ok());
        assert_eq!(
            validar(&s, Accion::Anterior).unwrap_err().code,
            ErrorCode::MediaActionUnsupported
        );
    }
}
