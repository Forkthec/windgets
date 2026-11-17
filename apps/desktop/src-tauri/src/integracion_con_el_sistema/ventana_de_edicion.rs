//! Ventana de edición de la distribución (C-03; arquitectura.md, «Temporal: solo mientras HE-05 está abierta»).
//! «Editar escritorio» oculta la ventana principal y crea esta vista a pantalla completa por encima del escritorio,
//! sin menú principal (HE-05-HU01-ET01); «Guardar» y «Cancelar» la destruyen y vuelven a la pantalla Widgets
//! (HE-05-HU04, HU05).

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

use super::area_de_notificacion::VENTANA_PRINCIPAL;
use crate::tipos::{
    EventMapLayoutEditStateChanged, EventMapNavigateRequested, ResultMessage, ScreenId,
};

/// Etiqueta de la ventana de edición (C-03).
pub const VENTANA_DE_EDICION: &str = "edicion";

/// Avisa a la ventana principal y a la de edición con EV-15 `layout_edit_state_changed`.
pub fn avisar_estado(app: &AppHandle, abierta: bool, con_cambios: bool) {
    let _ = app.emit(
        "layout_edit_state_changed",
        EventMapLayoutEditStateChanged {
            open: abierta,
            dirty: con_cambios,
        },
    );
}

/// Oculta la ventana principal y crea la de edición a pantalla completa, por encima de las demás ventanas.
pub fn abrir(app: &AppHandle) {
    if let Some(principal) = app.get_webview_window(VENTANA_PRINCIPAL) {
        let _ = principal.hide();
    }
    if app.get_webview_window(VENTANA_DE_EDICION).is_none() {
        let creada = WebviewWindowBuilder::new(
            app,
            VENTANA_DE_EDICION,
            WebviewUrl::App("edicion.html".into()),
        )
        .title("Windgets · edición de la distribución")
        .fullscreen(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .focused(true)
        .build();
        if let Err(error) = creada {
            eprintln!("No se pudo abrir la pantalla de edición: {error}");
        }
    }
    avisar_estado(app, true, false);
}

/// Evento interno con el mensaje de resultado de «Guardar» o «Cancelar» para la ventana principal.
/// DUDA: HE-05-HU04 el mensaje lo trae la respuesta de IPC-LAY-05 y 06, pero esa respuesta llega a la ventana de
/// edición, que el Núcleo ya cerró, y debe verse en la ventana principal (RT-04). Ningún evento del contrato lo
/// lleva. Valor usado: este evento, solo hacia la ventana principal (docs/DUDAS.md).
pub const RESULTADO_DE_LA_EDICION: &str = "layout_edit_result";

/// Destruye la ventana de edición (no queda oculta), muestra de nuevo la ventana principal al frente, le pide la
/// pantalla Widgets (EV-23 `navigate_requested`) y le pasa el mensaje de resultado, si lo hay.
pub fn cerrar(app: &AppHandle, mensaje: Option<ResultMessage>) {
    if let Some(edicion) = app.get_webview_window(VENTANA_DE_EDICION) {
        let _ = edicion.destroy();
    }
    if let Some(principal) = app.get_webview_window(VENTANA_PRINCIPAL) {
        let _ = principal.show();
        let _ = principal.unminimize();
        let _ = principal.set_focus();
    }
    avisar_estado(app, false, false);
    let _ = app.emit(
        "navigate_requested",
        EventMapNavigateRequested {
            screen: ScreenId::Widgets,
            params: None,
        },
    );
    if let Some(mensaje) = mensaje {
        let _ = app.emit_to(VENTANA_PRINCIPAL, RESULTADO_DE_LA_EDICION, mensaje);
    }
}
