//! Entrada del mouse y cambios de monitores en el escritorio (HE-06-HU01; D-186; INT-07, pasos 3 y 4).
//! `leer_raw_input`, `es_el_escritorio`, `hay_icono` y `hit_test_remoto` vienen del spike P01 (`spike.rs`),
//! aprobado en Windows 11 con 2 monitores (PR #21); aquí deciden con los rectángulos reales de los widgets
//! activos (`seleccion::decidir`) y avisan a la capa con EV-18 `pointer_forwarded`.
//!
//! Una ventana oculta del Núcleo recibe:
//! - `WM_INPUT` (Raw Input con `RIDEV_INPUTSINK`, sin tener el foco): con el botón principal presionado se mira
//!   qué hay bajo el cursor. Los íconos y las ventanas de otras aplicaciones tienen prioridad (ET04, ET05).
//! - `WM_DISPLAYCHANGE` y `WM_DPICHANGED`: al conectar o desconectar un monitor, o al cambiar su resolución o su
//!   escala, se vuelven a leer los monitores (EV-17) y la capa cubre el nuevo escritorio virtual.
//!
//! Este módulo usa la API de Windows; cada bloque `unsafe` explica por qué es seguro.
#![allow(unsafe_code)]

use std::ffi::c_void;
use std::mem::size_of;
use std::sync::{Mutex, OnceLock};

use tauri::{AppHandle, Emitter, Manager};
use windows::Win32::Foundation::{CloseHandle, HANDLE, HWND, LPARAM, LRESULT, POINT, WPARAM};
use windows::Win32::Graphics::Gdi::ScreenToClient;
use windows::Win32::System::Diagnostics::Debug::{ReadProcessMemory, WriteProcessMemory};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Memory::{
    MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_READWRITE, VirtualAllocEx, VirtualFreeEx,
};
use windows::Win32::System::Threading::{
    OpenProcess, PROCESS_VM_OPERATION, PROCESS_VM_READ, PROCESS_VM_WRITE,
};
use windows::Win32::UI::Controls::{LVHITTESTINFO, LVM_HITTEST};
use windows::Win32::UI::Input::{
    GetRawInputData, HRAWINPUT, RAWINPUT, RAWINPUTDEVICE, RAWINPUTHEADER, RID_INPUT,
    RIDEV_INPUTSINK, RIM_TYPEMOUSE, RegisterRawInputDevices,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CreateWindowExW, DefWindowProcW, DispatchMessageW, GetClassNameW, GetCursorPos, GetMessageW,
    GetParent, GetSystemMetrics, GetWindowThreadProcessId, MSG, RegisterClassW, SM_SWAPBUTTON,
    SendMessageW, TranslateMessage, WM_DISPLAYCHANGE, WM_DPICHANGED, WM_INPUT, WNDCLASSW,
    WS_EX_TOOLWINDOW, WS_POPUP, WindowFromPoint,
};
use windows::core::{PCWSTR, w};

use super::seleccion::{self, BajoElCursor};
use crate::puente_ipc::Nucleo;

/// La aplicación, para leer el estado del host y emitir eventos desde el hilo de Raw Input.
static APLICACION: OnceLock<AppHandle> = OnceLock::new();

/// Arranca el hilo con la ventana oculta que recibe Raw Input y los cambios de monitores.
pub fn iniciar(app: &AppHandle) {
    if APLICACION.set(app.clone()).is_ok() {
        std::thread::spawn(leer_raw_input);
    }
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
        lpszClassName: w!("WindgetsRawInput"),
        ..Default::default()
    };
    // SAFETY: `clase` es válida y su nombre es un literal terminado en cero.
    if unsafe { RegisterClassW(&clase) } == 0 {
        return;
    }
    // Ventana de nivel superior, oculta y sin botón en la barra de tareas: a diferencia de una ventana solo de
    // mensajes (HWND_MESSAGE, la del spike), recibe WM_DISPLAYCHANGE, que Windows envía a las de nivel superior.
    // SAFETY: ventana de la clase recién registrada; sin padre, sin menú y sin datos de creación.
    let Ok(ventana) = (unsafe {
        CreateWindowExW(
            WS_EX_TOOLWINDOW,
            w!("WindgetsRawInput"),
            PCWSTR::null(),
            WS_POPUP,
            0,
            0,
            0,
            0,
            None,
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
        eprintln!(
            "No se pudo registrar Raw Input: los widgets interactivos no recibirán la selección."
        );
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
    if mensaje == WM_INPUT
        && let Some((banderas, intercambiados)) = botones(HRAWINPUT(lparam.0 as *mut c_void))
    {
        if seleccion::es_el_boton_principal(banderas, intercambiados) {
            al_seleccionar();
        } else {
            al_arrastrar(seleccion::se_solto_el_boton_principal(
                banderas,
                intercambiados,
            ));
        }
    }
    if (mensaje == WM_DISPLAYCHANGE || mensaje == WM_DPICHANGED)
        && let Some(app) = APLICACION.get()
    {
        super::anclaje::reubicar(app);
    }
    // SAFETY: se reenvían los mismos parámetros que llegaron al procedimiento.
    unsafe { DefWindowProcW(ventana, mensaje, wparam, lparam) }
}

/// Las banderas de los botones de una entrada del mouse y si los botones están intercambiados en Windows.
fn botones(entrada: HRAWINPUT) -> Option<(u16, bool)> {
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
        return None;
    }
    // SAFETY: el encabezado dice que es un mouse, así que la unión contiene un RAWMOUSE.
    let banderas = unsafe { datos.data.mouse.Anonymous.Anonymous.usButtonFlags };
    // SAFETY: GetSystemMetrics no recibe punteros.
    let intercambiados = unsafe { GetSystemMetrics(SM_SWAPBUTTON) } != 0;
    Some((banderas, intercambiados))
}

/// El arrastre que sigue a una selección reenviada (HE-06-HU06): empieza en `al_seleccionar` y termina al soltar
/// el botón principal.
static ARRASTRE: Mutex<seleccion::Arrastre> = Mutex::new(seleccion::Arrastre::nuevo());

/// Cada movimiento del mouse, o el botón que se suelta, mientras dura un arrastre: la capa lo recibe como
/// `pointer_drag_forwarded` en sus coordenadas.
fn al_arrastrar(soltado: bool) {
    let Some(app) = APLICACION.get() else {
        return;
    };
    let Ok(mut arrastre) = ARRASTRE.lock() else {
        return;
    };
    if !arrastre.en_curso() {
        return;
    }
    let mut punto = POINT::default();
    // SAFETY: `punto` es local.
    if unsafe { GetCursorPos(&mut punto) }.is_err() {
        return;
    }
    let nucleo = app.state::<Nucleo>();
    if let Some(evento) = arrastre.seguir(&nucleo.host.capa(), (punto.x, punto.y), soltado) {
        let _ = app.emit(seleccion::ARRASTRE_REENVIADO, evento);
    }
}

/// La selección con el botón principal: si cae en un widget interactivo del escritorio sin un ícono encima, la
/// capa la recibe como EV-18 (CA01); en otro caso queda para Windows (CA02 a CA07).
fn al_seleccionar() {
    let Some(app) = APLICACION.get() else {
        return;
    };
    let nucleo = app.state::<Nucleo>();
    if nucleo.host.anclaje_fallido() {
        return;
    }
    let mut punto = POINT::default();
    // SAFETY: `punto` es local.
    if unsafe { GetCursorPos(&mut punto) }.is_err() {
        return;
    }
    // SAFETY: WindowFromPoint no recibe punteros.
    let bajo_el_cursor = unsafe { WindowFromPoint(punto) };
    let que_hay = if es_el_escritorio(bajo_el_cursor) {
        BajoElCursor::Escritorio
    } else {
        BajoElCursor::OtraVentana
    };
    let evento = seleccion::decidir(
        &nucleo.host.capa(),
        &nucleo.host.monitores(),
        (punto.x, punto.y),
        que_hay,
        || hay_icono(bajo_el_cursor, punto),
    );
    if let Ok(mut arrastre) = ARRASTRE.lock() {
        match &evento {
            Some(seleccion_reenviada) => arrastre.empezar(seleccion_reenviada),
            None => arrastre.cancelar(),
        }
    }
    if let Some(evento) = evento {
        let _ = app.emit("pointer_forwarded", evento);
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
