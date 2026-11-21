//! Anclaje de la capa del wallpaper a WorkerW, detrás de los íconos del escritorio (HE-02-HU01-ET01, ET09;
//! D-131, D-179, D-187; contrato INT-07, pasos 1 y 4). `anclar`, `buscar_workerw` y `monitores` vienen del spike
//! P01 (`spike.rs`), aprobado en Windows 11 con 2 monitores (PR #21). Desde P07 guarda dónde quedó la capa
//! (origen y escala) para reenviar la selección del mouse y la reubica cuando cambian los monitores
//! (`reubicar`, HE-06-HU01; INT-07, paso 4).
//!
//! La capa es una sola vista WebView2 (`capa.html`) que cubre el escritorio virtual. Se crea oculta al abrir la
//! aplicación; se muestra con la sesión iniciada y se oculta sin ella (CA05). Si no se puede anclar, el host lo
//! guarda y la ventana principal avisa con `fallback_default` (CA04, EV-16).
//!
//! Este módulo usa la API de Windows; cada bloque `unsafe` explica por qué es seguro.
#![allow(unsafe_code)]

use std::ffi::c_void;
use std::mem::size_of;
use std::sync::OnceLock;
use std::sync::mpsc::{self, RecvTimeoutError, Sender};
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use windows::Win32::Foundation::{HWND, LPARAM, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{
    EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFO, MapWindowPoints,
};
use windows::Win32::UI::HiDpi::{GetDpiForMonitor, MDT_EFFECTIVE_DPI};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, FindWindowExW, FindWindowW, GWL_STYLE, GetParent, GetWindowLongPtrW, IsWindow,
    IsWindowVisible, SMTO_NORMAL, SW_HIDE, SW_SHOWNOACTIVATE, SWP_NOACTIVATE, SWP_NOZORDER,
    SendMessageTimeoutW, SetParent, SetWindowLongPtrW, SetWindowPos, ShowWindow, WS_CAPTION,
    WS_CHILD, WS_POPUP, WS_THICKFRAME,
};
use windows::core::{BOOL, PCWSTR, w};

use super::geometria::{self, Rect};
use crate::puente_ipc::Nucleo;
use crate::tipos::{EventMapMonitorsChanged, Monitor};

/// Mensaje no documentado que pide a Progman crear el WorkerW detrás de los íconos (D-131, INT-07).
const MENSAJE_CREAR_WORKERW: u32 = 0x052C;

pub use super::CAPA;

/// Escritorio virtual si Windows no informa ningún monitor (no debería pasar).
const ESCRITORIO_POR_DEFECTO: Rect = Rect {
    izquierda: 0,
    arriba: 0,
    derecha: 1920,
    abajo: 1080,
};

/// Crea la capa oculta, la ancla a WorkerW y guarda los monitores (EV-17). Un fallo no detiene la aplicación:
/// queda en el host como anclaje fallido (HE-02-HU01-ET05). Arranca además la lectura del mouse y de los cambios
/// de monitores (HE-06-HU01, `raw_input`).
pub fn iniciar(app: &AppHandle) {
    let virtual_ = leer_monitores(app);
    let nucleo = app.state::<Nucleo>();
    match crear_y_anclar(app, virtual_) {
        Ok(escala) => nucleo
            .host
            .ubicar_capa((virtual_.izquierda, virtual_.arriba), escala),
        Err(error) => {
            eprintln!("No se pudo anclar la capa del wallpaper: {error}");
            nucleo.host.marcar_anclaje(true);
        }
    }
    super::raw_input::iniciar(app);
    vigilar(app.clone());
}

/// Crea la ventana de la capa, oculta, y la ancla a WorkerW. Devuelve su escala.
fn crear_y_anclar(app: &AppHandle, virtual_: Rect) -> Result<f64, String> {
    WebviewWindowBuilder::new(app, CAPA, WebviewUrl::App("capa.html".into()))
        .title("Windgets · capa del wallpaper")
        .decorations(false)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .visible(false)
        .build()
        .map_err(|error| error.to_string())
        .and_then(|capa| {
            let hwnd = capa.hwnd().map_err(|error| error.to_string())?;
            anclar(hwnd, virtual_)?;
            Ok(escala_de(&capa))
        })
}

/// Revisión de respaldo cuando no llega ningún evento de Windows.
const REVISION_DE_RESPALDO: Duration = Duration::from_secs(60);
/// Tras un evento, Explorer tarda en crear su WorkerW: se revisa a los 2 s y otra vez a los 10 s.
const REVISIONES_TRAS_UN_EVENTO: [Duration; 2] = [Duration::from_secs(2), Duration::from_secs(8)];

/// Despierta al vigilante (`revisar_pronto`).
static AVISO: OnceLock<Sender<()>> = OnceLock::new();

/// Pide revisar el anclaje ya. La llama la ventana oculta de `raw_input` con los eventos de Windows que recrean
/// el WorkerW: Explorer reiniciado (`TaskbarCreated`), pantalla encendida o reanudación (`WM_POWERBROADCAST`),
/// cambio de monitores (`WM_DISPLAYCHANGE`) o de la configuración del escritorio (`WM_SETTINGCHANGE`).
pub fn revisar_pronto() {
    if let Some(aviso) = AVISO.get() {
        let _ = aviso.send(());
    }
}

/// Explorer recrea el WorkerW al apagar o suspender la pantalla, al bloquear la sesión o al reiniciarse, y la capa
/// (su hija) desaparece o queda detrás de una ventana oculta: vuelve el fondo de Windows (pruebas manuales, P23).
/// INT-07 advierte que Windows 11 puede cambiar esa jerarquía, pero no dice cómo recuperarse. DUDA: HE-02-HU01
/// valor usado: con cada evento de Windows que puede recrear el WorkerW (`revisar_pronto`) y, de respaldo, cada
/// 60 s, se revisa que la capa siga hija del WorkerW vigente y visible; si no, se vuelve a anclar (paso 1) o, si
/// la ventana ya no existe, se crea de nuevo. Después se decide su visibilidad como al abrir la aplicación
/// (`avisar_wallpaper`).
fn vigilar(app: AppHandle) {
    let (aviso, avisos) = mpsc::channel();
    if AVISO.set(aviso).is_err() {
        return;
    }
    std::thread::spawn(move || {
        let comprobar = |app: &AppHandle| {
            if revisar(app) {
                tauri::async_runtime::block_on(crate::puente_ipc::avisar_wallpaper(app));
            }
        };
        loop {
            match avisos.recv_timeout(REVISION_DE_RESPALDO) {
                Ok(()) => {
                    for espera in REVISIONES_TRAS_UN_EVENTO {
                        std::thread::sleep(espera);
                        // Varios eventos seguidos cuentan como uno.
                        while avisos.try_recv().is_ok() {}
                        comprobar(&app);
                    }
                }
                Err(RecvTimeoutError::Timeout) => comprobar(&app),
                Err(RecvTimeoutError::Disconnected) => return,
            }
        }
    });
}

/// `true` si tuvo que volver a anclar o crear la capa.
fn revisar(app: &AppHandle) -> bool {
    let nucleo = app.state::<Nucleo>();
    let capa = app.get_webview_window(CAPA);
    let hwnd = capa
        .as_ref()
        .and_then(|c| c.hwnd().ok())
        .filter(|h| existe(*h));
    let virtual_;
    match hwnd {
        Some(hwnd) => {
            if anclada(hwnd) {
                return false;
            }
            virtual_ = leer_monitores(app);
            if let Err(error) = anclar(hwnd, virtual_) {
                eprintln!("No se pudo volver a anclar la capa del wallpaper: {error}");
                return false;
            }
        }
        None => {
            if let Some(capa) = capa {
                let _ = capa.destroy();
            }
            virtual_ = leer_monitores(app);
            if let Err(error) = crear_y_anclar(app, virtual_) {
                eprintln!("No se pudo crear de nuevo la capa del wallpaper: {error}");
                return false;
            }
        }
    }
    let escala = app
        .get_webview_window(CAPA)
        .map(|c| escala_de(&c))
        .unwrap_or(1.0);
    nucleo
        .host
        .ubicar_capa((virtual_.izquierda, virtual_.arriba), escala);
    nucleo.host.marcar_anclaje(false);
    true
}

/// La capa es hija de un WorkerW visible y, si Explorer ya tiene el suyo detrás de los íconos, es ese.
fn anclada(capa: HWND) -> bool {
    // SAFETY: `capa` es la ventana de la capa, de este proceso; GetParent no recibe punteros.
    let Some(padre) = (unsafe { GetParent(capa) }).ok().filter(|p| existe(*p)) else {
        return false;
    };
    // SAFETY: IsWindowVisible no recibe punteros; `padre` existe.
    if !unsafe { IsWindowVisible(padre) }.as_bool() {
        return false;
    }
    // SAFETY: FindWindowW solo lee las dos cadenas, que son literales terminados en cero.
    let vigente = unsafe { FindWindowW(w!("Progman"), PCWSTR::null()) }
        .ok()
        .and_then(buscar_workerw);
    vigente.is_none_or(|w| w == padre)
}

/// La ventana todavía existe.
fn existe(ventana: HWND) -> bool {
    // SAFETY: IsWindow no recibe punteros; con un identificador que ya no existe responde falso.
    unsafe { IsWindow(Some(ventana)) }.as_bool()
}

/// Lee los monitores, los guarda en el host y los avisa con EV-17 `monitors_changed`. Devuelve el escritorio
/// virtual que los contiene (D-187).
fn leer_monitores(app: &AppHandle) -> Rect {
    let monitores = monitores();
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
    geometria::escritorio_virtual(&monitores).unwrap_or(ESCRITORIO_POR_DEFECTO)
}

/// La escala de la capa (píxeles físicos por píxel CSS). DUDA: HE-06-HU01 la capa es una sola ventana sobre
/// monitores con escalas distintas (D-187) y el contrato no dice cuál usa. Valor usado: la que informa la
/// ventana (`scale_factor`), o 1 si no la informa.
fn escala_de(capa: &tauri::WebviewWindow) -> f64 {
    capa.scale_factor().ok().filter(|e| *e > 0.0).unwrap_or(1.0)
}

/// Al conectar o desconectar un monitor, o al cambiar su resolución o su escala (`WM_DISPLAYCHANGE`,
/// `WM_DPICHANGED`), vuelve a leer los monitores (EV-17) y lleva la capa al nuevo escritorio virtual (INT-07,
/// paso 4). Lo llama la ventana oculta de `raw_input`.
pub fn reubicar(app: &AppHandle) {
    let virtual_ = leer_monitores(app);
    let nucleo = app.state::<Nucleo>();
    if nucleo.host.anclaje_fallido() {
        return;
    }
    let Some(capa) = app.get_webview_window(CAPA) else {
        return;
    };
    let Ok(hwnd) = capa.hwnd() else {
        return;
    };
    // SAFETY: `hwnd` es la ventana de la capa, de este proceso; GetParent no recibe punteros.
    let Ok(workerw) = (unsafe { GetParent(hwnd) }) else {
        return;
    };
    match posicionar(hwnd, workerw, virtual_) {
        Ok(()) => nucleo
            .host
            .ubicar_capa((virtual_.izquierda, virtual_.arriba), escala_de(&capa)),
        Err(error) => eprintln!("No se pudo ajustar la capa a los monitores: {error}"),
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

    posicionar(capa, workerw, virtual_)
}

/// Mueve y dimensiona la capa, hija de WorkerW, al rectángulo del escritorio virtual (INT-07, paso 1).
fn posicionar(capa: HWND, workerw: HWND, virtual_: Rect) -> Result<(), String> {
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
