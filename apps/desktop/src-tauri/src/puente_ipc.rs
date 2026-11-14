//! Puente IPC (arquitectura.md, vistas 3a a 3c). Aquí van los comandos IPC de Tauri (`dominio_accion`,
//! convenciones.md, «Nombres») con los tipos de `crate::tipos`; cada HU agrega los suyos.
//! Responsabilidad: «Recibe los comandos de las tres vistas, valida la entrada y emite los eventos de cambio.»
//!
//! Cada comando responde `Result<T>` de tipos.ts (`{ ok: true, value }` o `{ ok: false, error }`) como valor,
//! sin rechazar la promesa de `invoke`, para que la vista ramifique por `error.code` (contratos.md, 1.3).

use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, State};

use crate::cliente_de_supabase::ClienteDeSupabase;
use crate::repositorios_y_archivos_locales::almacen_de_la_aplicacion;
use crate::servicio_de_sesion::{ConMensaje, RelojDelSistema, ServicioDeSesion};
use crate::tipos::{
    AppError, AuthRegisterStartParams, AuthRegisterStartResult, AuthRegisterVerifyParams,
    AuthRegisterVerifyResult, CodeSent, Connectivity, EventMapConnectivityChanged,
    EventMapSessionChanged, EventMapSessionChangedReason, EventMapSessionChangedState, IpcErr,
    IpcOk, IpcResult, NoParams,
};

/// El Núcleo que ven los comandos.
pub struct Nucleo {
    pub sesion: ServicioDeSesion<ClienteDeSupabase, RelojDelSistema>,
}

impl Nucleo {
    pub fn nuevo() -> Self {
        Self {
            sesion: ServicioDeSesion::nuevo(
                ClienteDeSupabase::desde_compilacion(),
                RelojDelSistema,
                almacen_de_la_aplicacion(),
            ),
        }
    }
}

/// EV-01 `session_changed` con la sesión iniciada: la ventana principal abre la pantalla principal (RT-01).
fn avisar_sesion_iniciada(app: &AppHandle, alias: &str, reason: EventMapSessionChangedReason) {
    let _ = app.emit(
        "session_changed",
        EventMapSessionChanged {
            state: EventMapSessionChangedState::SignedIn,
            alias: Some(alias.to_string()),
            reason,
        },
    );
}

/// Cada cuánto se comprueba si volvió la conexión mientras no la hay. DUDA: P05 el valor no está definido.
const COMPROBACION_DE_CONEXION: Duration = Duration::from_secs(5);

fn correcto<T>(valor: T) -> IpcResult<T> {
    IpcResult::Ok(IpcOk {
        ok: true.into(),
        value: valor,
        result_message: None,
    })
}

fn con_mensaje<T>(r: Result<ConMensaje<T>, AppError>) -> IpcResult<T> {
    match r {
        Ok(ConMensaje { valor, mensaje }) => IpcResult::Ok(IpcOk {
            ok: true.into(),
            value: valor,
            result_message: Some(mensaje),
        }),
        Err(error) => IpcResult::Err(IpcErr {
            ok: false.into(),
            error,
        }),
    }
}

/// Avisa a las vistas si la última llamada a la nube cambió el estado de la red (EV-03 `connectivity_changed`).
fn avisar_conectividad(app: &AppHandle, antes: bool) {
    let ahora = app.state::<Nucleo>().sesion.auth().en_linea();
    if ahora != antes {
        let _ = app.emit(
            "connectivity_changed",
            EventMapConnectivityChanged { online: ahora },
        );
    }
}

/// Mientras no hay conexión, comprueba cada pocos segundos si volvió, para habilitar de nuevo las opciones
/// que la exigen (HE-01-HU01-CA12: «hasta que vuelva la conexión»).
pub fn vigilar_conexion(app: AppHandle) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(COMPROBACION_DE_CONEXION);
            let nucleo = app.state::<Nucleo>();
            let cliente = nucleo.sesion.auth();
            if !cliente.en_linea() && tauri::async_runtime::block_on(cliente.comprobar_conexion()) {
                let _ = app.emit(
                    "connectivity_changed",
                    EventMapConnectivityChanged { online: true },
                );
            }
        }
    });
}

/// IPC-DESK-14 `connectivity_get`: estado de la red según la última llamada a la nube.
#[tauri::command]
pub fn connectivity_get(nucleo: State<'_, Nucleo>, params: NoParams) -> IpcResult<Connectivity> {
    let _ = params;
    correcto(Connectivity {
        online: nucleo.sesion.auth().en_linea(),
    })
}

/// IPC-AUTH-01 `auth_register_start` (HE-01-HU01, HE-01-HU02).
#[tauri::command]
pub async fn auth_register_start(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: AuthRegisterStartParams,
) -> Result<IpcResult<AuthRegisterStartResult>, ()> {
    let antes = nucleo.sesion.auth().en_linea();
    let r = nucleo.sesion.registrar_inicio(params).await;
    avisar_conectividad(&app, antes);
    Ok(con_mensaje(r))
}

/// IPC-AUTH-02 `auth_register_verify` (HE-01-HU03). Al crear la cuenta emite `session_changed` con
/// `reason: 'registered'`. La primera descarga de los datos de la cuenta llega con la sincronización (P10).
#[tauri::command]
pub async fn auth_register_verify(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: AuthRegisterVerifyParams,
) -> Result<IpcResult<AuthRegisterVerifyResult>, ()> {
    let antes = nucleo.sesion.auth().en_linea();
    let r = nucleo.sesion.registrar_verificar(params).await;
    avisar_conectividad(&app, antes);
    if let Ok(creada) = &r {
        avisar_sesion_iniciada(
            &app,
            &creada.valor.alias,
            EventMapSessionChangedReason::Registered,
        );
    }
    Ok(con_mensaje(r))
}

/// IPC-AUTH-03 `auth_register_resend` (HE-01-HU03).
#[tauri::command]
pub async fn auth_register_resend(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<CodeSent>, ()> {
    let _ = params;
    let antes = nucleo.sesion.auth().en_linea();
    let r = nucleo.sesion.registrar_reenviar().await;
    avisar_conectividad(&app, antes);
    Ok(con_mensaje(r))
}

/// IPC-AUTH-04 `auth_register_cancel` (HE-01-HU03-CA08).
#[tauri::command]
pub fn auth_register_cancel(nucleo: State<'_, Nucleo>, params: NoParams) -> IpcResult<()> {
    let _ = params;
    nucleo.sesion.registrar_cancelar();
    correcto(())
}
