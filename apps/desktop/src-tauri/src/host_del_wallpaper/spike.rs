//! Prototipo del spike P01 (WorkerW y Raw Input; D-131, D-186, D-187; contrato INT-07, pasos 1, 3 y 4).
//!
//! Abre tres vistas WebView2 (la principal, la capa y una tercera que hace las veces de la ventana de
//! edición, D-185), ancla la capa a WorkerW detrás de los íconos del escritorio, cubre el escritorio virtual
//! con una sola ventana y reenvía a la capa la selección del botón principal del mouse solo si el cursor
//! está sobre el escritorio, dentro de un widget de prueba y sin un ícono debajo (`LVM_HITTEST`).
//!
//! Este módulo usa la API de Windows; cada bloque `unsafe` explica por qué es seguro.
#![allow(unsafe_code)]

use std::ffi::c_void;
use std::mem::size_of;
use std::sync::{Mutex, OnceLock};

use serde_json::json;
use tauri::webview::PageLoadEvent;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use windows::Win32::Foundation::{CloseHandle, HANDLE, HWND, LPARAM, LRESULT, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{
    EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFO, MapWindowPoints,
    ScreenToClient,
};
use windows::Win32::System::Diagnostics::Debug::{ReadProcessMemory, WriteProcessMemory};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Memory::{
    MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_READWRITE, VirtualAllocEx, VirtualFreeEx,
};
use windows::Win32::System::Threading::{
    OpenProcess, PROCESS_VM_OPERATION, PROCESS_VM_READ, PROCESS_VM_WRITE,
};
use windows::Win32::UI::Controls::{LVHITTESTINFO, LVM_HITTEST};
use windows::Win32::UI::HiDpi::{GetDpiForMonitor, MDT_EFFECTIVE_DPI};
use windows::Win32::UI::Input::{
    GetRawInputData, HRAWINPUT, RAWINPUT, RAWINPUTDEVICE, RAWINPUTHEADER, RID_INPUT,
    RIDEV_INPUTSINK, RIM_TYPEMOUSE, RegisterRawInputDevices,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExW, DefWindowProcW, DispatchMessageW, EnumWindows, FindWindowExW, FindWindowW,
    GWL_STYLE, GetClassNameW, GetCursorPos, GetMessageW, GetParent, GetSystemMetrics,
    GetWindowLongPtrW, GetWindowThreadProcessId, HWND_MESSAGE, MSG, RegisterClassW, SM_SWAPBUTTON,
    SMTO_NORMAL, SWP_NOACTIVATE, SWP_NOZORDER, SWP_SHOWWINDOW, SendMessageTimeoutW, SendMessageW,
    SetParent, SetWindowLongPtrW, SetWindowPos, TranslateMessage, WINDOW_EX_STYLE, WINDOW_STYLE,
    WM_INPUT, WNDCLASSW, WS_CAPTION, WS_CHILD, WS_POPUP, WS_THICKFRAME, WindowFromPoint,
};
use windows::core::{BOOL, PCWSTR, w};

use super::geometria::{self, Monitor, Rect, WidgetDePrueba};

/// Mensaje no documentado que pide a Progman crear el WorkerW detrás de los íconos (D-131, INT-07).
const MENSAJE_CREAR_WORKERW: u32 = 0x052C;
/// Banderas de `RAWMOUSE.usButtonFlags` (RI_MOUSE_LEFT_BUTTON_DOWN y RI_MOUSE_RIGHT_BUTTON_DOWN).
const BOTON_IZQUIERDO_ABAJO: u16 = 0x0001;
const BOTON_DERECHO_ABAJO: u16 = 0x0004;

const CAPA: &str = "capa";
const TERCERA_VISTA: &str = "edicion";

/// Cómo quedó la jerarquía del escritorio. Windows 10 y Windows 11 se comportan distinto (HE-02-HU01-ET09).
#[derive(Clone, Copy, Debug, serde::Serialize)]
#[serde(rename_all = "snake_case")]
enum Forma {
    /// El WorkerW es la ventana de nivel superior siguiente a la que contiene SHELLDLL_DefView.
    WorkerwHermano,
    /// El WorkerW es hija de Progman (explorador de Windows 11 con cambios recientes).
    WorkerwHijoDeProgman,
}

/// Estado compartido con el hilo de Raw Input. Las ventanas se guardan como enteros porque `HWND` no es `Send`.
struct Estado {
    app: AppHandle,
    widgets: Vec<WidgetDePrueba>,
    origen: (i32, i32),
}

static ESTADO: OnceLock<Mutex<Option<Estado>>> = OnceLock::new();

fn estado() -> &'static Mutex<Option<Estado>> {
    ESTADO.get_or_init(|| Mutex::new(None))
}

/// Arranca el spike: tercera vista, capa anclada a WorkerW y lector de Raw Input.
pub fn iniciar(app: &AppHandle) -> tauri::Result<()> {
    // Al cerrar la ventana principal se sale de la aplicación: la capa no se puede cerrar con el mouse.
    if let Some(principal) = app.get_webview_window("main") {
        let manejador = app.clone();
        principal.on_window_event(move |evento| {
            if let WindowEvent::CloseRequested { .. } = evento {
                manejador.exit(0);
            }
        });
    }

    WebviewWindowBuilder::new(
        app,
        TERCERA_VISTA,
        WebviewUrl::App("spike/tercera-vista.html".into()),
    )
    .title("Windgets · spike, tercera vista")
    .inner_size(480.0, 320.0)
    .build()?;

    let monitores = monitores();
    let virtual_ = geometria::escritorio_virtual(&monitores).unwrap_or(Rect {
        izquierda: 0,
        arriba: 0,
        derecha: 1920,
        abajo: 1080,
    });
    let widgets = geometria::widgets_de_prueba(&monitores);

    let capa = WebviewWindowBuilder::new(app, CAPA, WebviewUrl::App("spike/capa.html".into()))
        .title("Windgets · capa del wallpaper (spike)")
        .decorations(false)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .visible(false)
        .on_page_load(|ventana, carga| reenviar_configuracion(&ventana, carga.event()))
        .build()?;

    let anclaje = capa
        .hwnd()
        .map_err(|error| error.to_string())
        .and_then(|hwnd| anclar(hwnd, virtual_));
    let configuracion = json!({
        "anclaje": match &anclaje {
            Ok(forma) => json!({ "ok": true, "forma": forma }),
            Err(error) => json!({ "ok": false, "error": error }),
        },
        "escritorioVirtual": virtual_,
        "monitores": monitores
            .iter()
            .map(|m| json!({ "rect": m.rect.relativo_a(virtual_.izquierda, virtual_.arriba), "escala": m.escala }))
            .collect::<Vec<_>>(),
        "widgets": widgets
            .iter()
            .map(|w| json!({ "id": w.id, "rect": w.rect.relativo_a(virtual_.izquierda, virtual_.arriba) }))
            .collect::<Vec<_>>(),
    });

    if anclaje.is_err() {
        // Sin WorkerW la capa se muestra como ventana normal para que la persona vea el error.
        capa.set_decorations(true)?;
        capa.set_size(tauri::LogicalSize::new(720.0, 480.0))?;
        capa.show()?;
    }

    // La página puede cargar antes o después de este punto: se configura ahora y otra vez al terminar de
    // cargar (`on_page_load`). `spikeConfigurar` se puede llamar varias veces.
    let script = format!("window.spikeConfigurar && window.spikeConfigurar({configuracion});");
    if let Ok(mut guardado) = CONFIGURACION.lock() {
        *guardado = Some(script.clone());
    }
    capa.eval(&script)?;

    if let Ok(mut guardado) = estado().lock() {
        *guardado = Some(Estado {
            app: app.clone(),
            widgets,
            origen: (virtual_.izquierda, virtual_.arriba),
        });
    }
    std::thread::spawn(leer_raw_input);
    Ok(())
}

/// Script de configuración de la capa, para volver a enviarlo cuando la página termine de cargar.
static CONFIGURACION: Mutex<Option<String>> = Mutex::new(None);

fn reenviar_configuracion(ventana: &tauri::WebviewWindow, evento: PageLoadEvent) {
    if evento != PageLoadEvent::Finished {
        return;
    }
    let script = CONFIGURACION
        .lock()
        .ok()
        .and_then(|guardado| guardado.clone());
    if let Some(script) = script {
        let _ = ventana.eval(&script);
    }
}

// ---------------------------------------------------------------- Anclaje (INT-07, paso 1)

fn anclar(capa: HWND, virtual_: Rect) -> Result<Forma, String> {
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

    let (workerw, forma) = buscar_workerw(progman)
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

    // SAFETY: `capa` existe; los números son el tamaño del escritorio virtual en píxeles físicos.
    unsafe {
        SetWindowPos(
            capa,
            None,
            esquina[0].x,
            esquina[0].y,
            virtual_.ancho(),
            virtual_.alto(),
            SWP_NOZORDER | SWP_NOACTIVATE | SWP_SHOWWINDOW,
        )
    }
    .map_err(|error| format!("SetWindowPos falló: {error}"))?;

    Ok(forma)
}

fn buscar_workerw(progman: HWND) -> Option<(HWND, Forma)> {
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
            return Some((workerw, Forma::WorkerwHermano));
        }
    }

    // SAFETY: la clase es un literal terminado en cero; se buscan hijas de Progman.
    unsafe { FindWindowExW(Some(progman), None, w!("WorkerW"), PCWSTR::null()) }
        .ok()
        .map(|workerw| (workerw, Forma::WorkerwHijoDeProgman))
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

fn monitores() -> Vec<Monitor> {
    let mut lista: Vec<Monitor> = Vec::new();
    // SAFETY: el callback recibe un puntero a `lista`, que vive hasta que EnumDisplayMonitors termina.
    let _ = unsafe {
        EnumDisplayMonitors(
            None,
            None,
            Some(agregar_monitor),
            LPARAM(&mut lista as *mut Vec<Monitor> as isize),
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
    let lista = unsafe { &mut *(dato.0 as *mut Vec<Monitor>) };
    lista.push(Monitor {
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

// ---------------------------------------------------------------- Raw Input (INT-07, paso 3; D-186)

fn leer_raw_input() {
    // SAFETY: GetModuleHandleW(None) devuelve el módulo de este proceso, sin punteros de entrada.
    let Ok(modulo) = (unsafe { GetModuleHandleW(None) }) else {
        return;
    };
    let clase = WNDCLASSW {
        lpfnWndProc: Some(procedimiento),
        hInstance: modulo.into(),
        lpszClassName: w!("WindgetsSpikeRawInput"),
        ..Default::default()
    };
    // SAFETY: `clase` es válida y su nombre es un literal terminado en cero.
    if unsafe { RegisterClassW(&clase) } == 0 {
        return;
    }
    // SAFETY: ventana oculta solo de mensajes (HWND_MESSAGE) de la clase recién registrada.
    let Ok(ventana) = (unsafe {
        CreateWindowExW(
            WINDOW_EX_STYLE(0),
            w!("WindgetsSpikeRawInput"),
            PCWSTR::null(),
            WINDOW_STYLE(0),
            0,
            0,
            0,
            0,
            Some(HWND_MESSAGE),
            None,
            Some(modulo.into()),
            None,
        )
    }) else {
        return;
    };

    // Página de uso genérica 0x01, uso 0x02 (mouse), RIDEV_INPUTSINK: recibe la entrada sin tener el foco.
    let dispositivo = RAWINPUTDEVICE {
        usUsagePage: 0x01,
        usUsage: 0x02,
        dwFlags: RIDEV_INPUTSINK,
        hwndTarget: ventana,
    };
    // SAFETY: el arreglo tiene un elemento y se pasa su tamaño exacto.
    if unsafe { RegisterRawInputDevices(&[dispositivo], size_of::<RAWINPUTDEVICE>() as u32) }
        .is_err()
    {
        avisar_capa(&json!({ "destino": "error", "detalle": "RegisterRawInputDevices falló" }));
        return;
    }

    let mut mensaje = MSG::default();
    // SAFETY: `mensaje` es local; el ciclo de mensajes es el de este hilo.
    while unsafe { GetMessageW(&mut mensaje, None, 0, 0) }.as_bool() {
        // SAFETY: `mensaje` viene de GetMessageW.
        unsafe {
            let _ = TranslateMessage(&mensaje);
            DispatchMessageW(&mensaje);
        }
    }
}

unsafe extern "system" fn procedimiento(
    ventana: HWND,
    mensaje: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    if mensaje == WM_INPUT && boton_principal_abajo(HRAWINPUT(lparam.0 as *mut c_void)) {
        al_seleccionar();
    }
    // SAFETY: se reenvían los mismos parámetros que llegaron al procedimiento.
    unsafe { DefWindowProcW(ventana, mensaje, wparam, lparam) }
}

fn boton_principal_abajo(entrada: HRAWINPUT) -> bool {
    let mut datos = RAWINPUT::default();
    let mut tamano = size_of::<RAWINPUT>() as u32;
    // SAFETY: `datos` es un RAWINPUT local y `tamano` dice su tamaño; para el mouse alcanza.
    let leidos = unsafe {
        GetRawInputData(
            entrada,
            RID_INPUT,
            Some(&mut datos as *mut RAWINPUT as *mut c_void),
            &mut tamano,
            size_of::<RAWINPUTHEADER>() as u32,
        )
    };
    if leidos == u32::MAX || datos.header.dwType != RIM_TYPEMOUSE.0 {
        return false;
    }
    // SAFETY: el encabezado dice que es un mouse, así que la unión contiene un RAWMOUSE.
    let banderas = unsafe { datos.data.mouse.Anonymous.Anonymous.usButtonFlags };
    // Botón principal: el derecho si la persona intercambió los botones en Windows.
    // SAFETY: GetSystemMetrics no recibe punteros.
    let intercambiados = unsafe { GetSystemMetrics(SM_SWAPBUTTON) } != 0;
    let bandera = if intercambiados {
        BOTON_DERECHO_ABAJO
    } else {
        BOTON_IZQUIERDO_ABAJO
    };
    banderas & bandera != 0
}

fn al_seleccionar() {
    let mut punto = POINT::default();
    // SAFETY: `punto` es local.
    if unsafe { GetCursorPos(&mut punto) }.is_err() {
        return;
    }
    // SAFETY: WindowFromPoint no recibe punteros.
    let bajo_el_cursor = unsafe { WindowFromPoint(punto) };

    let (widgets, origen) = match estado().lock() {
        Ok(guardado) => match guardado.as_ref() {
            Some(e) => (e.widgets.clone(), e.origen),
            None => return,
        },
        Err(_) => return,
    };
    let relativo = json!({ "x": punto.x - origen.0, "y": punto.y - origen.1 });

    if !es_el_escritorio(bajo_el_cursor) {
        avisar_capa(&json!({ "destino": "otra_ventana", "punto": relativo }));
        return;
    }
    let Some(widget) = geometria::widget_en(&widgets, punto.x, punto.y) else {
        avisar_capa(&json!({ "destino": "escritorio_sin_widget", "punto": relativo }));
        return;
    };
    match hay_icono(bajo_el_cursor, punto) {
        Some(false) => {
            avisar_capa(&json!({ "destino": "reenviado", "widget": widget.id, "punto": relativo }))
        }
        Some(true) => {
            avisar_capa(&json!({ "destino": "icono", "widget": widget.id, "punto": relativo }))
        }
        // Sin acceso a la memoria del explorador, el evento queda para el escritorio (RNF-35).
        None => avisar_capa(&json!({ "destino": "sin_acceso_al_explorador", "punto": relativo })),
    }
}

fn clase_de(ventana: HWND) -> String {
    let mut nombre = [0u16; 64];
    // SAFETY: el búfer es local y GetClassNameW respeta su tamaño.
    let largo = unsafe { GetClassNameW(ventana, &mut nombre) };
    String::from_utf16_lossy(&nombre[..largo.max(0) as usize])
}

/// El escritorio es la clase SysListView32 dentro de SHELLDLL_DefView (D-186).
fn es_el_escritorio(ventana: HWND) -> bool {
    if clase_de(ventana) != "SysListView32" {
        return false;
    }
    // SAFETY: GetParent no recibe punteros.
    match unsafe { GetParent(ventana) } {
        Ok(padre) => clase_de(padre) == "SHELLDLL_DefView",
        Err(_) => false,
    }
}

/// `LVM_HITTEST` con la estructura en la memoria del proceso del explorador. `None` si no hay acceso.
fn hay_icono(lista: HWND, punto: POINT) -> Option<bool> {
    let mut pid = 0u32;
    // SAFETY: `pid` es local.
    unsafe { GetWindowThreadProcessId(lista, Some(&mut pid)) };
    // SAFETY: OpenProcess no recibe punteros; el explorador corre con el mismo usuario (permisos estándar).
    let proceso = unsafe {
        OpenProcess(
            PROCESS_VM_OPERATION | PROCESS_VM_READ | PROCESS_VM_WRITE,
            false,
            pid,
        )
    }
    .ok()?;
    let resultado = hit_test_remoto(proceso, lista, punto);
    // SAFETY: `proceso` lo abrió OpenProcess y no se vuelve a usar.
    let _ = unsafe { CloseHandle(proceso) };
    resultado
}

fn hit_test_remoto(proceso: HANDLE, lista: HWND, punto: POINT) -> Option<bool> {
    let tamano = size_of::<LVHITTESTINFO>();
    // SAFETY: se reserva memoria en el explorador; se libera abajo en todos los caminos.
    let remoto = unsafe {
        VirtualAllocEx(
            proceso,
            None,
            tamano,
            MEM_COMMIT | MEM_RESERVE,
            PAGE_READWRITE,
        )
    };
    if remoto.is_null() {
        return None;
    }

    let mut cliente = punto;
    // SAFETY: `cliente` es local.
    let _ = unsafe { ScreenToClient(lista, &mut cliente) };
    let info = LVHITTESTINFO {
        pt: cliente,
        ..Default::default()
    };

    // SAFETY: `remoto` tiene `tamano` bytes reservados; `info` es local y del mismo tamaño.
    let escrito = unsafe {
        WriteProcessMemory(
            proceso,
            remoto,
            &info as *const LVHITTESTINFO as *const c_void,
            tamano,
            None,
        )
    };
    let resultado = if escrito.is_ok() {
        // SAFETY: lParam apunta a la estructura en la memoria del explorador, como pide LVM_HITTEST.
        unsafe {
            SendMessageW(
                lista,
                LVM_HITTEST,
                Some(WPARAM(0)),
                Some(LPARAM(remoto as isize)),
            )
        };
        let mut leido = LVHITTESTINFO::default();
        // SAFETY: se leen `tamano` bytes de la misma reserva a una estructura local del mismo tamaño.
        let lectura = unsafe {
            ReadProcessMemory(
                proceso,
                remoto,
                &mut leido as *mut LVHITTESTINFO as *mut c_void,
                tamano,
                None,
            )
        };
        lectura.ok().map(|_| leido.iItem >= 0)
    } else {
        None
    };

    // SAFETY: `remoto` lo reservó VirtualAllocEx en este mismo proceso remoto; MEM_RELEASE pide tamaño 0.
    let _ = unsafe { VirtualFreeEx(proceso, remoto, 0, MEM_RELEASE) };
    resultado
}

/// Avisa a la capa (en la aplicación real será el evento `pointer_forwarded`, EV-18).
fn avisar_capa(datos: &serde_json::Value) {
    let app = match estado().lock() {
        Ok(guardado) => match guardado.as_ref() {
            Some(e) => e.app.clone(),
            None => return,
        },
        Err(_) => return,
    };
    if let Some(capa) = app.get_webview_window(CAPA) {
        let _ = capa.eval(format!(
            "window.spikeSeleccion && window.spikeSeleccion({datos});"
        ));
    }
}
