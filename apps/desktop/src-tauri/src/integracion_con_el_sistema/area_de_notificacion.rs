//! Ventana principal y área de notificación (HE-17; D-070, GP-02). Separa tres conceptos: cerrar la ventana
//! (HE-17-HU01), abrirla de nuevo desde el ícono (HE-17-HU02) y salir de la aplicación (HE-17-HU03).

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime, Window, WindowEvent};

use crate::servicio_de_personalizacion_y_configuracion::ultima_pantalla;
use crate::tipos::{EventMapExitRequested, EventMapNavigateRequested};

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

/// Opción «Abrir» del menú del ícono (HE-17-HU02-CA02, ET06).
const ABRIR: &str = "abrir";
/// Opción «Salir» del menú del ícono (HE-17-HU03-ET03).
const SALIR: &str = "salir";

/// Abre de nuevo la ventana principal, al frente, sin reiniciar la aplicación ni cerrar la sesión; la capa del
/// wallpaper no se toca (HE-17-HU02-CA01, CA02, ET02). Después pide a la vista la última pantalla visitada,
/// leída de la base local, también sin conexión (EV-23 `navigate_requested`; ET03, ET05; D-156).
pub fn abrir_ventana(app: &AppHandle) {
    if let Some(ventana) = app.get_webview_window(VENTANA_PRINCIPAL) {
        let _ = ventana.show();
        let _ = ventana.unminimize();
        let _ = ventana.set_focus();
    }
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let nucleo = app.state::<crate::puente_ipc::Nucleo>();
        let base = nucleo.planificador.base();
        if let Ok(Some(screen)) = ultima_pantalla::leer(base).await {
            let _ = app.emit(
                "navigate_requested",
                EventMapNavigateRequested {
                    screen,
                    params: None,
                },
            );
        }
    });
}

/// IPC-DESK-07 `app_request_exit` (HE-17-HU03-CA02): pide confirmación si la vista previa tiene cambios sin guardar.
pub fn requiere_confirmacion(app: &AppHandle) -> bool {
    app.state::<crate::puente_ipc::Nucleo>()
        .personalizacion
        .hay_cambios_sin_guardar()
}

/// «Salir» en el menú del ícono. Sin cambios sin guardar, sale (CA01). Con ellos, muestra la ventana y avisa a la
/// vista con EV-24 `exit_requested`, que abre «Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?»; la
/// aplicación sigue abierta hasta que la persona elija (CA02, ET07).
pub fn pedir_salida(app: &AppHandle) {
    if !requiere_confirmacion(app) {
        salir(app, false);
        return;
    }
    if let Some(ventana) = app.get_webview_window(VENTANA_PRINCIPAL) {
        let _ = ventana.show();
        let _ = ventana.unminimize();
        let _ = ventana.set_focus();
    }
    let _ = app.emit(
        "exit_requested",
        EventMapExitRequested {
            requires_confirmation: true,
        },
    );
}

/// IPC-DESK-08 `app_exit`: cierra el programa sin cerrar la sesión (`session.bin` queda) y muestra el fondo
/// original de Windows al ocultar la capa (CA01, CA03; ET01, ET02, ET05). Con `discard_changes` descarta antes
/// los cambios de la vista previa (CA03). Al abrirla de nuevo se ve el tema aplicado (ET04).
pub fn salir(app: &AppHandle, descartar: bool) {
    if descartar {
        app.state::<crate::puente_ipc::Nucleo>()
            .personalizacion
            .olvidar_borrador();
    }
    crate::host_del_wallpaper::mostrar_capa(app, false);
    app.exit(0);
}

/// Crea el ícono de la aplicación en el área de notificación, junto al reloj. Está mientras la aplicación se
/// ejecuta, también con la ventana cerrada (HE-17-HU01-ET03). Seleccionar el ícono, o «Abrir» en su menú, abre de
/// nuevo la ventana (HE-17-HU02-ET01, ET06).
/// DUDA: HE-17-HU01 el texto al pasar el mouse sobre el ícono no está definido. Valor usado: «Windgets».
pub fn crear_icono(app: &AppHandle) -> tauri::Result<()> {
    let abrir = MenuItem::with_id(app, ABRIR, "Abrir", true, None::<&str>)?;
    let salir = MenuItem::with_id(app, SALIR, "Salir", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&abrir, &salir])?;
    let mut icono = TrayIconBuilder::with_id("windgets")
        .tooltip("Windgets")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, evento| match evento.id().as_ref() {
            ABRIR => abrir_ventana(app),
            SALIR => pedir_salida(app),
            _ => {}
        })
        .on_tray_icon_event(|icono, evento| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = evento
            {
                abrir_ventana(icono.app_handle());
            }
        });
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
