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
//! - `WM_SETTINGCHANGE` con «intl»: la persona cambió el formato regional; la capa recibe el formato de hora
//!   nuevo (EV-28 `time_format_changed`, HE-04-HU03-CA04).
//! - `WM_TIMER`: con el gancho de mouse habilitado (D-215), cada 2 s se actualizan sus rectángulos y se instala o
//!   se quita (HE-06-HU06-ET07, `gancho`).
//!
//! Este módulo usa la API de Windows; cada bloque `unsafe` explica por qué es seguro.
#![allow(unsafe_code)]

use std::ffi::c_void;
use std::mem::size_of;
use std::sync::atomic::{AtomicIsize, AtomicUsize, Ordering};
use std::sync::{Mutex, OnceLock};

use tauri::{AppHandle, Emitter, Manager};
use windows::Win32::Foundation::{CloseHandle, HANDLE, HWND, LPARAM, LRESULT, POINT, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{MapWindowPoints, ScreenToClient};
use windows::Win32::System::Diagnostics::Debug::{ReadProcessMemory, WriteProcessMemory};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Memory::{
    MEM_COMMIT, MEM_RELEASE, MEM_RESERVE, PAGE_READWRITE, VirtualAllocEx, VirtualFreeEx,
};
use windows::Win32::System::Threading::{
    OpenProcess, PROCESS_VM_OPERATION, PROCESS_VM_READ, PROCESS_VM_WRITE,
};
use windows::Win32::UI::Controls::{LVHITTESTINFO, LVM_GETITEMCOUNT, LVM_GETITEMRECT, LVM_HITTEST};
use windows::Win32::UI::Input::{
    GetRawInputData, HRAWINPUT, RAWINPUT, RAWINPUTDEVICE, RAWINPUTHEADER, RID_INPUT,
    RIDEV_INPUTSINK, RIM_TYPEMOUSE, RegisterRawInputDevices,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, CreateWindowExW, DEVICE_NOTIFY_WINDOW_HANDLE, DefWindowProcW, DispatchMessageW,
    GetClassNameW, GetCursorPos, GetMessageW, GetParent, GetSystemMetrics,
    GetWindowThreadProcessId, HHOOK, MSG, MSLLHOOKSTRUCT, RegisterClassW, RegisterWindowMessageW,
    SM_SWAPBUTTON, SendMessageW, SetTimer, SetWindowsHookExW, TranslateMessage,
    UnhookWindowsHookEx, WH_MOUSE_LL, WM_DISPLAYCHANGE, WM_DPICHANGED, WM_INPUT, WM_POWERBROADCAST,
    WM_SETTINGCHANGE, WM_TIMER, WNDCLASSW, WS_EX_TOOLWINDOW, WS_POPUP, WindowFromPoint,
};
use windows::core::{PCWSTR, w};

use super::gancho;
use super::geometria::Rect;
use super::seleccion::{self, BajoElCursor};
use crate::puente_ipc::Nucleo;

/// La aplicación, para leer el estado del host y emitir eventos desde el hilo de Raw Input.
static APLICACION: OnceLock<AppHandle> = OnceLock::new();

/// Mensaje `TaskbarCreated`: Explorer lo envía a las ventanas de nivel superior al reiniciarse.
static EXPLORER_REINICIADO: OnceLock<u32> = OnceLock::new();

/// `GUID_CONSOLE_DISPLAY_STATE`: avisa con `WM_POWERBROADCAST` cuando la pantalla se apaga o se enciende.
const ESTADO_DE_LA_PANTALLA: windows::core::GUID =
    windows::core::GUID::from_u128(0x6fe69556_704a_47a0_8f24_c28d936fda47);

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

    // Eventos que pueden recrear el WorkerW de Explorer: el vigilante del anclaje revisa la capa (HE-02-HU01).
    // SAFETY: el nombre es un literal terminado en cero.
    let reiniciado = unsafe { RegisterWindowMessageW(w!("TaskbarCreated")) };
    if reiniciado != 0 {
        let _ = EXPLORER_REINICIADO.set(reiniciado);
    }
    // SAFETY: `ventana` es la ventana de este hilo y el GUID es una constante que vive todo el programa.
    let _ = unsafe {
        windows::Win32::System::Power::RegisterPowerSettingNotification(
            windows::Win32::Foundation::HANDLE(ventana.0),
            &ESTADO_DE_LA_PANTALLA,
            DEVICE_NOTIFY_WINDOW_HANDLE,
        )
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

    // HE-06-HU06-ET07 (D-215): con el gancho habilitado, sus rectángulos se actualizan fuera de él cada 2 s, y se
    // instala o se quita según haya widgets interactivos visibles. El gancho corre en este hilo, que tiene el ciclo
    // de mensajes que `WH_MOUSE_LL` necesita.
    if gancho::GANCHO_HABILITADO {
        // SAFETY: `ventana` es de este hilo; sin función de temporizador, llega WM_TIMER a `procedimiento`.
        unsafe { SetTimer(Some(ventana), TEMPORIZADOR_DEL_GANCHO, 2000, None) };
        revisar_gancho();
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
    if mensaje == WM_TIMER && wparam.0 == TEMPORIZADOR_DEL_GANCHO {
        revisar_gancho();
    }
    if (mensaje == WM_DISPLAYCHANGE || mensaje == WM_DPICHANGED)
        && let Some(app) = APLICACION.get()
    {
        super::anclaje::reubicar(app);
    }
    // HE-04-HU03-CA04, ET03: Windows avisa el cambio de la configuración regional con «intl»; el Reloj lo refleja
    // de inmediato, sin reiniciar la aplicación.
    if mensaje == WM_SETTINGCHANGE
        && lparam.0 != 0
        // SAFETY: con WM_SETTINGCHANGE, un lParam no nulo es una cadena terminada en cero válida durante el mensaje.
        && unsafe { PCWSTR(lparam.0 as *const u16).to_string() }.is_ok_and(|area| area == "intl")
        && let Some(app) = APLICACION.get()
    {
        let _ = app.emit(
            "time_format_changed",
            crate::integracion_con_el_sistema::formato_de_hora::leer(),
        );
    }
    if mensaje == WM_DISPLAYCHANGE
        || mensaje == WM_SETTINGCHANGE
        || mensaje == WM_POWERBROADCAST
        || EXPLORER_REINICIADO.get() == Some(&mensaje)
    {
        super::anclaje::revisar_pronto();
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
    // EV-27 (HE-06-HU08-ET08): soltar sin mover el puntero más de 4 píxeles es la selección que abre una pantalla.
    if let Some(soltada) = arrastre.tomar_soltada() {
        let _ = app.emit("pointer_released", soltada);
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

// ---------------------------------------------------------------- Gancho del mouse (HE-06-HU06-ET07; D-215)

const TEMPORIZADOR_DEL_GANCHO: usize = 1;

/// Tope de íconos que se leen del escritorio para la caché del gancho.
const MAXIMO_DE_ICONOS: isize = 512;

/// El gancho instalado, como número (`HHOOK` no se comparte entre hilos); 0 si no hay.
static GANCHO_INSTALADO: AtomicIsize = AtomicIsize::new(0);

/// Presiones que el gancho no dejó llegar a Windows, para el spike.
static PRESIONES_TRAGADAS: AtomicUsize = AtomicUsize::new(0);

/// La decisión del gancho y los rectángulos que consulta.
static GANCHO: Mutex<(gancho::Gancho, gancho::CacheDelGancho)> =
    Mutex::new((gancho::Gancho::nuevo(), gancho::CacheDelGancho::vacia()));

/// Actualiza los rectángulos de los widgets interactivos y de los íconos (fuera del gancho, para no consultar al
/// explorador dentro de él) e instala o quita el gancho (ET07).
fn revisar_gancho() {
    let Some(app) = APLICACION.get() else {
        return;
    };
    let nucleo = app.state::<Nucleo>();
    let widgets = gancho::rectangulos_interactivos(&nucleo.host.capa());
    let instalar = gancho::debe_estar_instalado(
        gancho::GANCHO_HABILITADO,
        &widgets,
        nucleo.host.anclaje_fallido(),
    );
    // Los íconos se leen de la lista del escritorio que está bajo el primer widget; si otra ventana lo tapa, no se
    // leen y el gancho no traga nada (RNF-35).
    let iconos = widgets.first().and_then(|r| {
        let centro = POINT {
            x: (r.izquierda + r.derecha) / 2,
            y: (r.arriba + r.abajo) / 2,
        };
        // SAFETY: WindowFromPoint no recibe punteros.
        let lista = unsafe { WindowFromPoint(centro) };
        if es_el_escritorio(lista) {
            rectangulos_de_iconos(lista)
        } else {
            None
        }
    });
    if let Ok(mut g) = GANCHO.lock() {
        g.1 = gancho::CacheDelGancho { widgets, iconos };
    }
    let instalado = GANCHO_INSTALADO.load(Ordering::SeqCst);
    if instalar && instalado == 0 {
        // SAFETY: GetModuleHandleW(None) devuelve el módulo de este proceso, sin punteros de entrada.
        let Ok(modulo) = (unsafe { GetModuleHandleW(None) }) else {
            return;
        };
        // SAFETY: `gancho_del_mouse` cumple la firma de HOOKPROC y vive todo el programa; 0 = todos los hilos.
        match unsafe {
            SetWindowsHookExW(WH_MOUSE_LL, Some(gancho_del_mouse), Some(modulo.into()), 0)
        } {
            Ok(h) => GANCHO_INSTALADO.store(h.0 as isize, Ordering::SeqCst),
            Err(error) => eprintln!("No se pudo instalar el gancho del mouse: {error}"),
        }
    } else if !instalar && instalado != 0 {
        // SAFETY: el gancho lo instaló este mismo hilo y no se vuelve a usar.
        let _ = unsafe { UnhookWindowsHookEx(HHOOK(instalado as *mut c_void)) };
        GANCHO_INSTALADO.store(0, Ordering::SeqCst);
        if let Ok(mut g) = GANCHO.lock() {
            g.0 = gancho::Gancho::nuevo();
        }
    }
}

/// `WH_MOUSE_LL`: decide con la caché, sin esperar ni consultar al explorador. El movimiento y los demás botones
/// pasan siempre (ET07).
unsafe extern "system" fn gancho_del_mouse(codigo: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if codigo >= 0 {
        // SAFETY: con `codigo` >= 0 (HC_ACTION), lparam apunta a un MSLLHOOKSTRUCT válido durante la llamada.
        let datos = unsafe { &*(lparam.0 as *const MSLLHOOKSTRUCT) };
        // SAFETY: GetSystemMetrics no recibe punteros.
        let intercambiados = unsafe { GetSystemMetrics(SM_SWAPBUTTON) } != 0;
        let boton = gancho::boton(wparam.0 as u32, intercambiados);
        if boton != gancho::Boton::Otro {
            // SAFETY: WindowFromPoint no recibe punteros.
            let bajo_el_cursor = if es_el_escritorio(unsafe { WindowFromPoint(datos.pt) }) {
                BajoElCursor::Escritorio
            } else {
                BajoElCursor::OtraVentana
            };
            // try_lock: el gancho nunca espera; si la caché se está actualizando, el mensaje pasa a Windows.
            if let Ok(mut g) = GANCHO.try_lock() {
                let (estado, cache) = &mut *g;
                if estado.decidir(cache, boton, (datos.pt.x, datos.pt.y), bajo_el_cursor) {
                    if boton == gancho::Boton::PresionarPrincipal {
                        PRESIONES_TRAGADAS.fetch_add(1, Ordering::Relaxed);
                    }
                    return LRESULT(1);
                }
            }
        }
    }
    // SAFETY: se pasan los mismos parámetros al siguiente gancho.
    unsafe { CallNextHookEx(None, codigo, wparam, lparam) }
}

/// Los rectángulos de los íconos del escritorio en la pantalla (`LVM_GETITEMRECT` en la memoria del explorador).
/// `None` si no hay acceso.
fn rectangulos_de_iconos(lista: HWND) -> Option<Vec<Rect>> {
    // SAFETY: LVM_GETITEMCOUNT no recibe punteros.
    let cantidad = unsafe { SendMessageW(lista, LVM_GETITEMCOUNT, None, None) }
        .0
        .clamp(0, MAXIMO_DE_ICONOS);
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
    let resultado = leer_rectangulos(proceso, lista, cantidad as usize);
    // SAFETY: `proceso` lo abrió OpenProcess y no se vuelve a usar.
    let _ = unsafe { CloseHandle(proceso) };
    resultado
}

fn leer_rectangulos(proceso: HANDLE, lista: HWND, cantidad: usize) -> Option<Vec<Rect>> {
    let tamano = size_of::<RECT>();
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
    let mut rectangulos = Vec::with_capacity(cantidad);
    let mut completo = true;
    for i in 0..cantidad {
        // `left` = LVIR_BOUNDS (0): el rectángulo completo del ícono con su texto.
        let pedido = RECT::default();
        // SAFETY: `remoto` tiene `tamano` bytes reservados; `pedido` es local y del mismo tamaño.
        let escrito = unsafe {
            WriteProcessMemory(
                proceso,
                remoto,
                &pedido as *const RECT as *const c_void,
                tamano,
                None,
            )
        };
        if escrito.is_err() {
            completo = false;
            break;
        }
        // SAFETY: lParam apunta al RECT en la memoria del explorador, como pide LVM_GETITEMRECT.
        unsafe {
            SendMessageW(
                lista,
                LVM_GETITEMRECT,
                Some(WPARAM(i)),
                Some(LPARAM(remoto as isize)),
            )
        };
        let mut leido = RECT::default();
        // SAFETY: se leen `tamano` bytes de la misma reserva a un RECT local.
        let lectura = unsafe {
            ReadProcessMemory(
                proceso,
                remoto,
                &mut leido as *mut RECT as *mut c_void,
                tamano,
                None,
            )
        };
        if lectura.is_err() {
            completo = false;
            break;
        }
        let mut esquinas = [
            POINT {
                x: leido.left,
                y: leido.top,
            },
            POINT {
                x: leido.right,
                y: leido.bottom,
            },
        ];
        // SAFETY: `esquinas` es un arreglo local válido durante la llamada.
        unsafe { MapWindowPoints(Some(lista), None, &mut esquinas) };
        rectangulos.push(Rect {
            izquierda: esquinas[0].x,
            arriba: esquinas[0].y,
            derecha: esquinas[1].x,
            abajo: esquinas[1].y,
        });
    }
    // SAFETY: `remoto` lo reservó VirtualAllocEx en este mismo proceso remoto; MEM_RELEASE pide tamaño 0.
    let _ = unsafe { VirtualFreeEx(proceso, remoto, 0, MEM_RELEASE) };
    completo.then_some(rectangulos)
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

#[cfg(test)]
mod spike_del_gancho {
    //! Spike de D-215 en Windows 11 (como el de WorkerW, P01): se corre a mano con la aplicación cerrada,
    //! `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml ca_he_06_hu06_ca06_spike -- --ignored --nocapture`.
    use std::time::{Duration, Instant};

    use windows::Win32::UI::WindowsAndMessaging::{PM_REMOVE, PeekMessageW};

    use super::*;

    #[test]
    #[ignore = "spike manual en Windows 11 (D-215)"]
    fn ca_he_06_hu06_ca06_spike() {
        // HE-06-HU06-CA06 · Arrastrar sin la selección del escritorio. Durante 20 s, un widget de prueba cubre
        // (200, 200) a (600, 500) del monitor principal: arrastra con el botón principal dentro de ese rectángulo,
        // sobre el escritorio sin íconos. Esperado: Windows no dibuja su rectángulo de selección dentro, sí fuera;
        // los íconos se siguen abriendo y el puntero se mueve sin retraso. Al terminar se imprime cuántas presiones
        // se tragaron; la prueba falla si ninguna.
        if let Ok(mut g) = GANCHO.lock() {
            g.1 = gancho::CacheDelGancho {
                widgets: vec![Rect {
                    izquierda: 200,
                    arriba: 200,
                    derecha: 600,
                    abajo: 500,
                }],
                iconos: Some(Vec::new()),
            };
        }
        // SAFETY: GetModuleHandleW(None) devuelve el módulo de este proceso.
        let modulo = unsafe { GetModuleHandleW(None) }.expect("módulo del proceso");
        // SAFETY: `gancho_del_mouse` cumple la firma de HOOKPROC y vive todo el programa.
        let instalado = unsafe {
            SetWindowsHookExW(WH_MOUSE_LL, Some(gancho_del_mouse), Some(modulo.into()), 0)
        }
        .expect("SetWindowsHookExW");
        let fin = Instant::now() + Duration::from_secs(20);
        let mut mensaje = MSG::default();
        while Instant::now() < fin {
            // SAFETY: `mensaje` es local; WH_MOUSE_LL necesita el ciclo de mensajes del hilo que lo instaló.
            while unsafe { PeekMessageW(&mut mensaje, None, 0, 0, PM_REMOVE) }.as_bool() {
                // SAFETY: `mensaje` viene de PeekMessageW.
                unsafe {
                    let _ = TranslateMessage(&mensaje);
                    DispatchMessageW(&mensaje);
                }
            }
            std::thread::sleep(Duration::from_millis(5));
        }
        // SAFETY: el gancho lo instaló este hilo y no se vuelve a usar.
        unsafe { UnhookWindowsHookEx(instalado) }.expect("UnhookWindowsHookEx");
        let tragadas = PRESIONES_TRAGADAS.load(Ordering::Relaxed);
        println!("Presiones tragadas por el gancho: {tragadas}");
        assert!(tragadas > 0, "no se presionó dentro del widget de prueba");
    }
}
