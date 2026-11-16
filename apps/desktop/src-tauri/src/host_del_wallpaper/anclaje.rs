//! Anclaje de la capa del wallpaper a WorkerW, detrás de los íconos del escritorio (HE-02-HU01-ET01, ET09;
//! D-131, D-179, D-187; contrato INT-07, pasos 1 y 4). `anclar`, `buscar_workerw` y `monitores` vienen del spike
//! P01 (`spike.rs`), aprobado en Windows 11 con 2 monitores (PR #21).
//!
//! La capa es una sola vista WebView2 (`capa.html`) que cubre el escritorio virtual. Se crea oculta al abrir la
//! aplicación; se muestra con la sesión iniciada y se oculta sin ella (CA05). Si no se puede anclar, el host lo
//! guarda y la ventana principal avisa con `fallback_default` (CA04, EV-16).
//!
//! Este módulo usa la API de Windows; cada bloque `unsafe` explica por qué es seguro.
#![allow(unsafe_code)]

use std::ffi::c_void;
use std::mem::size_of;

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use windows::Win32::Foundation::{HWND, LPARAM, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{
    EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFO, MapWindowPoints,
};
use windows::Win32::UI::HiDpi::{GetDpiForMonitor, MDT_EFFECTIVE_DPI};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, FindWindowExW, FindWindowW, GWL_STYLE, GetWindowLongPtrW, SMTO_NORMAL, SW_HIDE,
    SW_SHOWNOACTIVATE, SWP_NOACTIVATE, SWP_NOZORDER, SendMessageTimeoutW, SetParent,
    SetWindowLongPtrW, SetWindowPos, ShowWindow, WS_CAPTION, WS_CHILD, WS_POPUP, WS_THICKFRAME,
};
use windows::core::{BOOL, PCWSTR, w};

use super::geometria::{self, Rect};
use crate::puente_ipc::Nucleo;
use crate::tipos::{EventMapMonitorsChanged, Monitor};

/// Mensaje no documentado que pide a Progman crear el WorkerW detrás de los íconos (D-131, INT-07).
const MENSAJE_CREAR_WORKERW: u32 = 0x052C;

/// Etiqueta de la ventana de la capa (`capabilities/capa.json`).
pub const CAPA: &str = "capa";

/// Escritorio virtual si Windows no informa ningún monitor (no debería pasar).
const ESCRITORIO_POR_DEFECTO: Rect = Rect {
    izquierda: 0,
    arriba: 0,
    derecha: 1920,
    abajo: 1080,
};

/// Crea la capa oculta, la ancla a WorkerW y guarda los monitores (EV-17). Un fallo no detiene la aplicación:
/// queda en el host como anclaje fallido (HE-02-HU01-ET05).
pub fn iniciar(app: &AppHandle) {
    let monitores = monitores();
    let virtual_ = geometria::escritorio_virtual(&monitores).unwrap_or(ESCRITORIO_POR_DEFECTO);
    let nucleo = app.state::<Nucleo>();
    nucleo
        .host
        .guardar_monitores(monitores_del_contrato(&monitores));
    let _ = app.emit(
        "monitors_changed",
        EventMapMonitorsChanged {
            monitors: nucleo.host.monitores(),
        },
    );

    let anclaje = WebviewWindowBuilder::new(app, CAPA, WebviewUrl::App("capa.html".into()))
        .title("Windgets · capa del wallpaper")
        .decorations(false)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .visible(false)
        .build()
        .map_err(|error| error.to_string())
        .and_then(|capa| capa.hwnd().map_err(|error| error.to_string()))
        .and_then(|hwnd| anclar(hwnd, virtual_));
    if let Err(error) = anclaje {
        eprintln!("No se pudo anclar la capa del wallpaper: {error}");
        nucleo.host.marcar_anclaje(true);
    }
}

/// Muestra la capa con la sesión iniciada y la oculta sin ella (HE-02-HU01-CA01, CA05). Sin activarla: el foco
/// sigue donde estaba.
pub fn mostrar(app: &AppHandle, visible: bool) {
    let Some(capa) = app.get_webview_window(CAPA) else {
        return;
    };
    let Ok(hwnd) = capa.hwnd() else {
        return;
    };
    let orden = if visible { SW_SHOWNOACTIVATE } else { SW_HIDE };
    // SAFETY: `hwnd` es la ventana de la capa, de este proceso; ShowWindow no recibe punteros.
    let _ = unsafe { ShowWindow(hwnd, orden) };
}

/// Los monitores con la forma del contrato (`Monitor`, tipos.ts): píxeles físicos de la pantalla.
fn monitores_del_contrato(monitores: &[geometria::Monitor]) -> Vec<Monitor> {
    monitores
        .iter()
        .enumerate()
        .map(|(indice, m)| Monitor {
            // DUDA: HE-02-HU01 el contrato no define el id del monitor. Valor usado: su orden en Windows.
            id: indice.to_string(),
            x: i64::from(m.rect.izquierda),
            y: i64::from(m.rect.arriba),
            width: i64::from(m.rect.ancho()),
            height: i64::from(m.rect.alto()),
            scale_factor: m.escala,
        })
        .collect()
}

// ---------------------------------------------------------------- Anclaje (INT-07, paso 1)

fn anclar(capa: HWND, virtual_: Rect) -> Result<(), String> {
    // SAFETY: FindWindowW solo lee las dos cadenas, que son literales terminados en cero.
    let progman = unsafe { FindWindowW(w!("Progman"), PCWSTR::null()) }
        .map_err(|_| "No se encontró la ventana Progman.".to_string())?;

    // SAFETY: el mensaje no lleva punteros (wParam y lParam son números) y el tiempo de espera es de 1 s.
    unsafe {
        SendMessageTimeoutW(
            progman,
            MENSAJE_CREAR_WORKERW,
            WPARAM(0xD),
            LPARAM(0x1),
            SMTO_NORMAL,
            1000,
            None,
        );
    }

    let workerw = buscar_workerw(progman)
        .ok_or_else(|| "No se encontró la ventana WorkerW detrás de los íconos.".to_string())?;

    // SAFETY: `capa` es la ventana de nivel superior de este proceso; solo se cambian bits de estilo.
    unsafe {
        let estilo = GetWindowLongPtrW(capa, GWL_STYLE);
        let quitar = (WS_POPUP | WS_CAPTION | WS_THICKFRAME).0 as isize;
        SetWindowLongPtrW(capa, GWL_STYLE, (estilo & !quitar) | WS_CHILD.0 as isize);
    }

    // SAFETY: ambas ventanas existen; SetParent no recibe punteros.
    unsafe { SetParent(capa, Some(workerw)) }
        .map_err(|error| format!("SetParent falló: {error}"))?;

    // El escritorio virtual en coordenadas del cliente de WorkerW.
    let mut esquina = [POINT {
        x: virtual_.izquierda,
        y: virtual_.arriba,
    }];
    // SAFETY: `esquina` es un arreglo local válido durante la llamada.
    unsafe { MapWindowPoints(None, Some(workerw), &mut esquina) };

    // SAFETY: `capa` existe; los números son el tamaño del escritorio virtual en píxeles físicos. Sin
    // SWP_SHOWWINDOW: la capa sigue oculta hasta que haya sesión.
    unsafe {
        SetWindowPos(
            capa,
            None,
            esquina[0].x,
            esquina[0].y,
            virtual_.ancho(),
            virtual_.alto(),
            SWP_NOZORDER | SWP_NOACTIVATE,
        )
    }
    .map_err(|error| format!("SetWindowPos falló: {error}"))?;

    Ok(())
}

/// El WorkerW detrás de los íconos. Windows 10 y Windows 11 lo ubican distinto (HE-02-HU01-ET09): hermano de la
/// ventana que contiene SHELLDLL_DefView, o hijo de Progman.
fn buscar_workerw(progman: HWND) -> Option<HWND> {
    let mut con_defview: isize = 0;
    // SAFETY: el callback recibe un puntero a `con_defview`, que vive hasta que EnumWindows termina.
    let _ = unsafe {
        EnumWindows(
            Some(buscar_defview),
            LPARAM(&mut con_defview as *mut isize as isize),
        )
    };

    if con_defview != 0 {
        let superior = HWND(con_defview as *mut c_void);
        // SAFETY: la clase es un literal terminado en cero; las ventanas son de nivel superior.
        let siguiente =
            unsafe { FindWindowExW(None, Some(superior), w!("WorkerW"), PCWSTR::null()) };
        if let Ok(workerw) = siguiente
            && workerw != progman
        {
            return Some(workerw);
        }
    }

    // SAFETY: la clase es un literal terminado en cero; se buscan hijas de Progman.
    unsafe { FindWindowExW(Some(progman), None, w!("WorkerW"), PCWSTR::null()) }.ok()
}

unsafe extern "system" fn buscar_defview(ventana: HWND, dato: LPARAM) -> BOOL {
    // SAFETY: la clase es un literal terminado en cero; se buscan hijas de `ventana`.
    let defview =
        unsafe { FindWindowExW(Some(ventana), None, w!("SHELLDLL_DefView"), PCWSTR::null()) };
    if defview.is_ok() {
        // SAFETY: `dato` es el puntero a `con_defview` que pasó `buscar_workerw`, vivo durante EnumWindows.
        unsafe { *(dato.0 as *mut isize) = ventana.0 as isize };
        return BOOL(0); // se detiene la enumeración
    }
    BOOL(1)
}

// ---------------------------------------------------------------- Monitores (INT-07, paso 4)

fn monitores() -> Vec<geometria::Monitor> {
    let mut lista: Vec<geometria::Monitor> = Vec::new();
    // SAFETY: el callback recibe un puntero a `lista`, que vive hasta que EnumDisplayMonitors termina.
    let _ = unsafe {
        EnumDisplayMonitors(
            None,
            None,
            Some(agregar_monitor),
            LPARAM(&mut lista as *mut Vec<geometria::Monitor> as isize),
        )
    };
    lista
}

unsafe extern "system" fn agregar_monitor(
    monitor: HMONITOR,
    _hdc: HDC,
    _rect: *mut RECT,
    dato: LPARAM,
) -> BOOL {
    let mut info = MONITORINFO {
        cbSize: size_of::<MONITORINFO>() as u32,
        ..Default::default()
    };
    // SAFETY: `info` es local y su `cbSize` es el tamaño correcto.
    if !unsafe { GetMonitorInfoW(monitor, &mut info) }.as_bool() {
        return BOOL(1);
    }
    let (mut dpi_x, mut dpi_y) = (96u32, 96u32);
    // SAFETY: los dos punteros son variables locales.
    let _ = unsafe { GetDpiForMonitor(monitor, MDT_EFFECTIVE_DPI, &mut dpi_x, &mut dpi_y) };
    let rect = info.rcMonitor;
    // SAFETY: `dato` es el puntero a la lista que pasó `monitores`, vivo durante EnumDisplayMonitors.
    let lista = unsafe { &mut *(dato.0 as *mut Vec<geometria::Monitor>) };
    lista.push(geometria::Monitor {
        rect: Rect {
            izquierda: rect.left,
            arriba: rect.top,
            derecha: rect.right,
            abajo: rect.bottom,
        },
        escala: f64::from(dpi_x) / 96.0,
    });
    BOOL(1)
}

#[cfg(test)]
mod pruebas {
    use super::*;

    /// HE-02-HU01-CA06 · Verificación técnica del wallpaper sin Lively (ET08 a ET10; D-131). Necesita el escritorio
    /// de Windows 11 abierto con permisos estándar, así que no corre en la CI. Se corre a mano y su resultado se
    /// registra en `docs/DUDAS.md`:
    /// `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml ca_he_02_hu01_ca06 -- --ignored`
    #[test]
    #[ignore = "verificación manual en el escritorio de Windows 11 (HE-02-HU01-CA06)"]
    fn ca_he_02_hu01_ca06() {
        // SAFETY: FindWindowW solo lee las dos cadenas, que son literales terminados en cero.
        let progman = unsafe { FindWindowW(w!("Progman"), PCWSTR::null()) };
        assert!(progman.is_ok(), "No se encontró la ventana Progman.");
        let Ok(progman) = progman else {
            return;
        };
        // SAFETY: el mensaje no lleva punteros y el tiempo de espera es de 1 s.
        unsafe {
            SendMessageTimeoutW(
                progman,
                MENSAJE_CREAR_WORKERW,
                WPARAM(0xD),
                LPARAM(0x1),
                SMTO_NORMAL,
                1000,
                None,
            );
        }
        assert!(
            buscar_workerw(progman).is_some(),
            "No se encontró la ventana WorkerW detrás de los íconos."
        );
        let monitores = monitores();
        assert!(!monitores.is_empty(), "Windows no informó ningún monitor.");
        assert!(geometria::escritorio_virtual(&monitores).is_some());
    }
}
