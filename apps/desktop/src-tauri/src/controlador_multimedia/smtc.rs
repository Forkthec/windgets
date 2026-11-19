//! Lectura y control de la sesión multimedia actual de Windows (SMTC; `Windows.Media.Control`, INT-06). Solo
//! Windows; la API de WinRT es segura y no necesita `unsafe`.
//!
//! DUDA: HE-04-HU11 la carátula llega como un flujo de WinRT; pasarla a la capa necesita guardarla como archivo o
//! como `data:` URL. Valor usado: sin carátula (`thumbnail_url: None`); el widget muestra el ícono genérico de
//! música (CA05). Se prueba a mano en Windows 11 con Spotify y YouTube Music (ET09).

use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSessionManager as Gestor,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus as Estado,
};

use super::{Accion, sin_sesion};
use crate::tipos::{MediaSession, PlaybackStatus};

fn texto(t: windows::core::HSTRING) -> Option<String> {
    let t = t.to_string_lossy();
    (!t.trim().is_empty()).then_some(t)
}

pub fn leer() -> windows::core::Result<MediaSession> {
    let gestor = Gestor::RequestAsync()?.get()?;
    // Sin sesión actual, Windows devuelve un error o una sesión vacía.
    let Ok(sesion) = gestor.GetCurrentSession() else {
        return Ok(sin_sesion());
    };
    let propiedades = sesion.TryGetMediaPropertiesAsync()?.get()?;
    let info = sesion.GetPlaybackInfo()?;
    let controles = info.Controls()?;
    let status = match info.PlaybackStatus()? {
        Estado::Playing => PlaybackStatus::Playing,
        Estado::Paused => PlaybackStatus::Paused,
        _ => PlaybackStatus::Stopped,
    };
    Ok(MediaSession {
        has_session: true,
        title: texto(propiedades.Title()?),
        artist: texto(propiedades.Artist()?),
        thumbnail_url: None,
        status,
        can_previous: controles.IsPreviousEnabled()?,
        can_next: controles.IsNextEnabled()?,
        can_play_pause: controles.IsPlayPauseToggleEnabled()?,
    })
}

pub fn ejecutar(accion: Accion) -> windows::core::Result<()> {
    let gestor = Gestor::RequestAsync()?.get()?;
    let sesion = gestor.GetCurrentSession()?;
    let hecho = match accion {
        Accion::ReproducirOPausar => sesion.TryTogglePlayPauseAsync()?.get()?,
        Accion::Siguiente => sesion.TrySkipNextAsync()?.get()?,
        Accion::Anterior => sesion.TrySkipPreviousAsync()?.get()?,
    };
    if hecho {
        Ok(())
    } else {
        Err(windows::core::Error::empty())
    }
}
