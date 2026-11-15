//! Puente IPC (arquitectura.md, vistas 3a a 3c). Aquí van los comandos IPC de Tauri (`dominio_accion`,
//! convenciones.md, «Nombres») con los tipos de `crate::tipos`; cada HU agrega los suyos.
//! Responsabilidad: «Recibe los comandos de las tres vistas, valida la entrada y emite los eventos de cambio.»
//!
//! Cada comando responde `Result<T>` de tipos.ts (`{ ok: true, value }` o `{ ok: false, error }`) como valor,
//! sin rechazar la promesa de `invoke`, para que la vista ramifique por `error.code` (contratos.md, 1.3).

use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, State};

use crate::cliente_de_supabase::ClienteDeSupabase;
use crate::repositorios_y_archivos_locales::{BaseLocal, almacen_de_la_aplicacion};
use crate::servicio_de_sesion::{ConMensaje, RelojDelSistema, ServicioDeSesion};
use crate::servicio_del_planificador::{CalendarioDelSistema, ServicioDelPlanificador};
use crate::tipos::{
    AppError, AuthRegisterStartParams, AuthRegisterStartResult, AuthRegisterVerifyParams,
    AuthRegisterVerifyResult, AuthSessionState, AuthSignInParams, Card, CardCreateParams,
    CardDetail, CardIdParams, CardListBoardResult, CardUpdateParams, ChangeOp, CodeSent, Column,
    Connectivity, EntityChange, ErrorCode, EventMapConnectivityChanged, EventMapSessionChanged,
    EventMapSessionChangedReason, EventMapSessionChangedState, IpcErr, IpcOk, IpcResult, Label,
    NoParams, OriginKind, SessionInfo,
};

/// El Núcleo que ven los comandos.
pub struct Nucleo {
    pub sesion: ServicioDeSesion<ClienteDeSupabase, RelojDelSistema>,
    pub planificador: ServicioDelPlanificador<CalendarioDelSistema>,
}

impl Nucleo {
    pub fn nuevo() -> Self {
        Self {
            sesion: ServicioDeSesion::nuevo(
                ClienteDeSupabase::desde_compilacion(),
                RelojDelSistema,
                almacen_de_la_aplicacion(),
            ),
            planificador: ServicioDelPlanificador::nuevo(
                BaseLocal::de_la_aplicacion(),
                CalendarioDelSistema,
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

/// IPC-AUTH-05 `auth_sign_in` (HE-01-HU04). Al abrir la sesión emite `session_changed` con `reason: 'sign_in'`;
/// la ventana principal abre la pantalla principal (RT-01-CA01).
#[tauri::command]
pub async fn auth_sign_in(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: AuthSignInParams,
) -> Result<IpcResult<SessionInfo>, ()> {
    let antes = nucleo.sesion.auth().en_linea();
    let r = nucleo.sesion.iniciar_sesion(params).await;
    avisar_conectividad(&app, antes);
    if let Ok(sesion) = &r {
        avisar_sesion_iniciada(&app, &sesion.alias, EventMapSessionChangedReason::SignIn);
    }
    Ok(match r {
        Ok(sesion) => correcto(sesion),
        Err(error) => IpcResult::Err(IpcErr {
            ok: false.into(),
            error,
        }),
    })
}

/// IPC-AUTH-12 `auth_get_session` (HE-01-HU04-CA02): lee `session.bin`, sin llamar a la nube.
#[tauri::command]
pub fn auth_get_session(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> IpcResult<AuthSessionState> {
    let _ = params;
    correcto(nucleo.sesion.estado_de_sesion())
}

/// El `user_id` de la sesión guardada: los comandos del planificador solo se usan con la sesión iniciada
/// (RT-01). Sin sesión no hay pantalla que los llame; si pasara, la respuesta es `internal.unexpected`.
fn usuario(nucleo: &Nucleo) -> Result<String, AppError> {
    nucleo
        .sesion
        .sesion_guardada()
        .map(|s| s.user_id.to_lowercase())
        .ok_or(AppError {
            code: ErrorCode::InternalUnexpected,
            message: String::new(),
            field: None,
            params: None,
        })
}

/// EV-07 `cards_changed` tras crear, editar, mover, completar o eliminar tarjetas en este computador.
fn avisar_tarjetas(app: &AppHandle, ids: Vec<crate::tipos::Uuid>, op: ChangeOp) {
    let _ = app.emit(
        "cards_changed",
        EntityChange {
            ids,
            op,
            origin: OriginKind::Local,
        },
    );
}

/// IPC-CARD-01 `card_create` (HE-07-HU01). Guarda en la base local, con o sin conexión (CA12), y emite
/// `cards_changed` para que el tablero y las demás vistas muestren la tarjeta (ET14).
#[tauri::command]
pub async fn card_create(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: CardCreateParams,
) -> Result<IpcResult<Card>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.crear_tarjeta(&user_id, params).await,
        Err(e) => Err(e),
    };
    if let Ok(creada) = &r {
        avisar_tarjetas(&app, vec![creada.valor.id.clone()], ChangeOp::Upsert);
    }
    Ok(con_mensaje(r))
}

/// IPC-LABEL-01 `label_list`: etiquetas en orden alfabético (D-165), para el campo Etiquetas del Formulario de
/// tarjeta (HE-07-HU01-ET12). Los textos de estado vacío los pone la vista (HE-08-HU01, HE-07-HU02).
#[tauri::command]
pub async fn label_list(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<Vec<Label>>, ()> {
    let _ = params;
    let r = match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.etiquetas(&user_id).await,
        Err(e) => Err(e),
    };
    Ok(match r {
        Ok(etiquetas) => correcto(etiquetas),
        Err(error) => IpcResult::Err(IpcErr {
            ok: false.into(),
            error,
        }),
    })
}

/// Respuesta de un comando de lectura sin mensaje de resultado.
fn leido<T>(r: Result<T, AppError>) -> IpcResult<T> {
    match r {
        Ok(valor) => correcto(valor),
        Err(error) => IpcResult::Err(IpcErr {
            ok: false.into(),
            error,
        }),
    }
}

/// IPC-CARD-05 `card_list_board` (HE-09-HU01): columnas y tarjetas del tablero Kanban.
#[tauri::command]
pub async fn card_list_board(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<CardListBoardResult>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.tablero(&user_id).await,
        Err(e) => Err(e),
    }))
}

/// IPC-COL-01 `column_list` (HE-09-HU01): columnas por `position`.
#[tauri::command]
pub async fn column_list(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<Vec<Column>>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.columnas(&user_id).await,
        Err(e) => Err(e),
    }))
}

/// IPC-CARD-04 `card_get` (HE-07-HU03): el Detalle de tarjeta.
#[tauri::command]
pub async fn card_get(
    nucleo: State<'_, Nucleo>,
    params: CardIdParams,
) -> Result<IpcResult<CardDetail>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.detalle(&user_id, &params.id.0).await,
        Err(e) => Err(e),
    }))
}

/// IPC-CARD-02 `card_update` (HE-07-HU04). Emite `cards_changed` para que el tablero y las demás vistas
/// muestren el cambio en tiempo real (ET10).
#[tauri::command]
pub async fn card_update(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: CardUpdateParams,
) -> Result<IpcResult<Card>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .actualizar_tarjeta(&user_id, params)
                .await
        }
        Err(e) => Err(e),
    };
    if let Ok(editada) = &r {
        avisar_tarjetas(&app, vec![editada.valor.id.clone()], ChangeOp::Upsert);
    }
    Ok(con_mensaje(r))
}
