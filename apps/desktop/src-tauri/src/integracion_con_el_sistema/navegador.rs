//! Abrir enlaces en el navegador predeterminado (IPC-DESK-09 `system_open_url`; HE-06-HU10). Solo `https://` y
//! `http://`: cualquier otro esquema es `url.not_allowed` (sin texto).

use crate::servicio_del_planificador::error;
use crate::tipos::{AppError, ErrorCode};

/// La dirección, si es `http` o `https` con un servidor.
pub fn validar(url: &str) -> Result<reqwest::Url, AppError> {
    let no_permitida = || error(ErrorCode::UrlNotAllowed, "", None);
    let leida = reqwest::Url::parse(url.trim()).map_err(|_| no_permitida())?;
    if !matches!(leida.scheme(), "https" | "http") || leida.host_str().is_none() {
        return Err(no_permitida());
    }
    Ok(leida)
}

/// HE-06-HU10-ET01: abre la noticia en el navegador predeterminado de Windows. La dirección va como un solo
/// argumento (sin pasar por la consola), así no se interpreta como una orden.
pub fn abrir(url: &str) -> Result<(), AppError> {
    let url = validar(url)?;
    #[cfg(windows)]
    let programa = "explorer";
    #[cfg(not(windows))]
    let programa = "xdg-open";
    std::process::Command::new(programa)
        .arg(url.as_str())
        .spawn()
        .map(|_| ())
        .map_err(|_| crate::servicio_del_planificador::inesperado())
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn ca_he_06_hu10_ca01() {
        // HE-06-HU10-CA01 · Las noticias se abren solo si son `http` o `https` (IPC-DESK-09).
        assert!(validar("https://example.com/noticia?id=1").is_ok());
        assert!(validar("http://example.com").is_ok());
        for mala in [
            "file:///C:/Windows/notepad.exe",
            "javascript:alert(1)",
            "cmd /c calc",
            "https://",
            "",
        ] {
            assert_eq!(
                validar(mala).unwrap_err().code,
                ErrorCode::UrlNotAllowed,
                "{mala}"
            );
        }
    }
}
