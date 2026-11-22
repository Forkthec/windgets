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

/// HE-06-HU10-ET01 y HE-01-HU05: abre el enlace en el navegador predeterminado de Windows. Si Windows no puede
/// abrirlo, `browser.open_failed` con su texto (P26, DUDAS).
pub fn abrir(url: &str) -> Result<(), AppError> {
    abrir_con(url, lanzar)
}

/// `abrir` con la llamada al sistema aparte, para probarla sin abrir un navegador.
fn abrir_con(url: &str, lanzar: impl FnOnce(&str) -> bool) -> Result<(), AppError> {
    let url = validar(url)?;
    if lanzar(url.as_str()) {
        Ok(())
    } else {
        Err(error(
            ErrorCode::BrowserOpenFailed,
            crate::messages::NO_PUDIMOS_ABRIR_EL_NAVEGADOR,
            None,
        ))
    }
}

/// ShellExecuteW con «open» (`docs/arquitectura.md`): Windows abre la dirección con el navegador predeterminado.
/// Antes se usaba `explorer.exe`, que no abre direcciones largas (la de Google mide unos 312 caracteres) y abría la
/// carpeta Documentos (prueba manual del 22-nov, P26). La dirección va como un solo argumento, sin consola.
#[cfg(windows)]
#[allow(unsafe_code)]
fn lanzar(url: &str) -> bool {
    use windows::Win32::UI::Shell::ShellExecuteW;
    use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;
    use windows::core::{HSTRING, PCWSTR, w};
    let direccion = HSTRING::from(url);
    // SAFETY: las cadenas son un literal y un HSTRING terminados en cero que viven durante la llamada; los demás
    // parámetros son nulos.
    let instancia = unsafe {
        ShellExecuteW(
            None,
            w!("open"),
            &direccion,
            PCWSTR::null(),
            PCWSTR::null(),
            SW_SHOWNORMAL,
        )
    };
    // Un valor de 32 o menos es un código de error de ShellExecute.
    instancia.0 as isize > 32
}

#[cfg(not(windows))]
fn lanzar(url: &str) -> bool {
    std::process::Command::new("xdg-open")
        .arg(url)
        .spawn()
        .is_ok()
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

    #[test]
    fn ca_he_01_hu05_ca01_abre_la_direccion_larga_de_google() {
        // HE-01-HU05-CA01 · La dirección de `authorize` mide más de 260 caracteres y lleva `%` y `&`: se valida y
        // llega entera, como un solo argumento, a la llamada al sistema (ya no a `explorer`, P26).
        let google = format!(
            "https://abcdefghijklmnopqrst.supabase.co/auth/v1/authorize?provider=google&redirect_to=windgets%3A%2F%2Fauth%2Fcallback&code_challenge={}&code_challenge_method=s256&scopes=openid%20email%20profile",
            "x".repeat(150)
        );
        assert!(google.len() > 260);
        let mut abierta = String::new();
        assert!(
            abrir_con(&google, |url| {
                abierta = url.to_string();
                true
            })
            .is_ok()
        );
        assert_eq!(abierta, google);
    }

    #[test]
    fn ca_he_06_hu10_ca01_sin_navegador_es_un_error_con_texto() {
        // Regla de errores visibles: si Windows no abre el navegador, `browser.open_failed` con su texto, no
        // `internal.unexpected`.
        let falla = abrir_con("https://example.com", |_| false).unwrap_err();
        assert_eq!(falla.code, ErrorCode::BrowserOpenFailed);
        assert_eq!(
            falla.message,
            crate::messages::NO_PUDIMOS_ABRIR_EL_NAVEGADOR
        );
        // Una dirección no permitida no llega a la llamada al sistema.
        let mut llamada = false;
        let _ = abrir_con("file:///C:/Windows/notepad.exe", |_| {
            llamada = true;
            true
        });
        assert!(!llamada);
    }
}
