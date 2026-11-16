//! Ventana principal y área de notificación (HE-17; D-070, GP-02). Separa tres conceptos: cerrar la ventana
//! (HE-17-HU01), abrirla de nuevo desde el ícono (HE-17-HU02) y salir de la aplicación (HE-17-HU03).

use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, Runtime, Window, WindowEvent};

/// Etiqueta de la ventana principal (C-01) en `tauri.conf.json`.
pub const VENTANA_PRINCIPAL: &str = "main";

/// Lo que hace la aplicación cuando Windows pide cerrar una ventana.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AlCerrar {
    /// «×» de la ventana principal: se oculta; la aplicación sigue en segundo plano con la sesión iniciada, el
    /// wallpaper, los widgets y el ícono en el área de notificación (HE-17-HU01-CA01, ET01, ET02).
    Ocultar,
    /// Cualquier otra ventana se cierra como siempre.
    Cerrar,
}

/// Cerrar la ventana no es salir de la aplicación ni cerrar la sesión (HE-17-HU01-ET01, ET05).
pub fn al_cerrar(etiqueta: &str) -> AlCerrar {
    if etiqueta == VENTANA_PRINCIPAL {
        AlCerrar::Ocultar
    } else {
        AlCerrar::Cerrar
    }
}

/// Atiende «×»: oculta la ventana principal en lugar de cerrarla. La capa del wallpaper es otra ventana y no
/// cambia, así que el wallpaper y los widgets siguen visibles y actualizándose (HE-17-HU01-CA02).
pub fn atender_ventana<R: Runtime>(ventana: &Window<R>, evento: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = evento
        && al_cerrar(ventana.label()) == AlCerrar::Ocultar
    {
        api.prevent_close();
        let _ = ventana.hide();
    }
}

/// IPC-DESK-06 `app_hide_main_window`: lo mismo que «×» (HE-17-HU01-CA01).
pub fn ocultar_ventana<R: Runtime>(app: &AppHandle<R>) {
    if let Some(ventana) = app.get_webview_window(VENTANA_PRINCIPAL) {
        let _ = ventana.hide();
    }
}

/// Crea el ícono de la aplicación en el área de notificación, junto al reloj. Está mientras la aplicación se
/// ejecuta, también con la ventana cerrada (HE-17-HU01-ET03).
/// DUDA: HE-17-HU01 el texto al pasar el mouse sobre el ícono no está definido. Valor usado: «Windgets».
pub fn crear_icono<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let mut icono = TrayIconBuilder::with_id("windgets").tooltip("Windgets");
    if let Some(imagen) = app.default_window_icon() {
        icono = icono.icon(imagen.clone());
    }
    icono.build(app)?;
    Ok(())
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn ca_he_17_hu01_ca01() {
        // HE-17-HU01-CA01 · «×» en la ventana principal la oculta: no sale de la aplicación ni cierra la sesión
        // (ET01, ET05); el ícono sigue en el área de notificación (ET03, prueba manual en Windows 11).
        assert_eq!(al_cerrar(VENTANA_PRINCIPAL), AlCerrar::Ocultar);
    }

    #[test]
    fn ca_he_17_hu01_ca02() {
        // HE-17-HU01-CA02 · Con la ventana cerrada, la capa del wallpaper no se oculta ni se cierra por eso: es otra
        // ventana y «×» solo actúa sobre la principal (ET02). Que el wallpaper y los widgets sigan visibles y
        // actualizándose se prueba a mano en Windows 11.
        assert_ne!(VENTANA_PRINCIPAL, crate::host_del_wallpaper::CAPA);
        assert_eq!(al_cerrar(crate::host_del_wallpaper::CAPA), AlCerrar::Cerrar);
    }
}
