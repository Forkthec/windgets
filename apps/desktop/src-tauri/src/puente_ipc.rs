//! Puente IPC (arquitectura.md, vistas 3a a 3c). Aquí van los comandos IPC de Tauri (`dominio_accion`,
//! convenciones.md, «Nombres») con los tipos de `crate::tipos`; cada HU agrega los suyos.
//! Responsabilidad: «Recibe los comandos de las tres vistas, valida la entrada y emite los eventos de cambio.»
//!
//! Cada comando responde `Result<T>` de tipos.ts (`{ ok: true, value }` o `{ ok: false, error }`) como valor,
//! sin rechazar la promesa de `invoke`, para que la vista ramifique por `error.code` (contratos.md, 1.3).

use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, State};

use crate::cliente_de_supabase::ClienteDeSupabase;
use crate::host_del_wallpaper::estado::EstadoDelHost;
use crate::motor_de_sincronizacion;
use crate::repositorios_y_archivos_locales::{BaseLocal, almacen_de_la_aplicacion};
use crate::servicio_de_personalizacion_y_configuracion::ServicioDePersonalizacion;
use crate::servicio_de_personalizacion_y_configuracion::escritorio::Carpetas;
use crate::servicio_de_sesion::{ConMensaje, Reloj, RelojDelSistema, ServicioDeSesion};
use crate::servicio_del_planificador::{CalendarioDelSistema, ServicioDelPlanificador};
use crate::tipos::{
    AgendaDay, AgendaDayParams, AppError, AuthRegisterStartParams, AuthRegisterStartResult,
    AuthRegisterVerifyParams, AuthRegisterVerifyResult, AuthSessionState, AuthSignInParams,
    AuthSignOutInfo, Card, CardAssignTimeBlockParams, CardCreateParams, CardDetail, CardIdParams,
    CardListBoardResult, CardMoveParams, CardUpdateParams, CatalogItem, CatalogKind,
    CatalogListParams, ChangeOp, CodeSent, Column, ColumnCreateParams, ColumnReorderParams,
    ColumnUpdateParams, Connectivity, EntityChange, ErrorCode, EventMapConnectivityChanged,
    EventMapSessionChanged, EventMapSessionChangedReason, EventMapSessionChangedState,
    ImageImportParams, ImageImportResult, IpcErr, IpcOk, IpcResult, Label, LabelCreateParams,
    NoParams, OriginKind, PlannerToday, SessionInfo, ThemeDraftOpenParams, ThemeDraftSelectParams,
    ThemeDraftUpdateParams, ThemeDraftView, ThemeSummary,
};
use crate::tipos::{
    AppliedThemeView, ApplyMode, AssetResolveParams, AssetResolveResult,
    EventMapAppliedThemeChanged, EventMapCatalogUpdated, EventMapWallpaperStatusChanged,
    EventMapWidgetsChanged, LayerInitialState, ThemeDraftApplyParams, ThemeDraftSaveResult,
    ThemeIdResult, WallpaperState, WallpaperStatus, WidgetCatalog, WidgetItem,
    WidgetSetActiveParams,
};

/// El Núcleo que ven los comandos.
pub struct Nucleo {
    pub sesion: ServicioDeSesion<ClienteDeSupabase, RelojDelSistema>,
    pub planificador: ServicioDelPlanificador<CalendarioDelSistema>,
    pub personalizacion: ServicioDePersonalizacion,
    pub host: EstadoDelHost,
    /// Un ciclo de sincronización a la vez con el cierre de sesión (HE-16-HU03): el cierre espera a que termine
    /// el ciclo en curso antes de vaciar la base.
    pub ciclo: tokio::sync::Mutex<()>,
    /// El registro de Windows para el inicio automático (INT-08).
    pub arranque: Box<dyn crate::integracion_con_el_sistema::inicio_automatico::RegistroDeArranque>,
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
            personalizacion: ServicioDePersonalizacion::nuevo(),
            host: EstadoDelHost::default(),
            ciclo: tokio::sync::Mutex::new(()),
            arranque:
                crate::integracion_con_el_sistema::inicio_automatico::registro_de_la_aplicacion(),
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

/// Cada cuánto el motor revisa la cola de cambios pendientes. Con la espera de 2 s tras guardar, un cambio llega
/// a la nube en unos 3 s, dentro de los 10 s de HE-15-HU01-ET02.
const REVISION_DE_LA_COLA: Duration = Duration::from_secs(1);

/// HE-15-HU01: el motor de sincronización envía la cola en segundo plano, sin que el usuario elija una opción
/// (ET01), y emite EV-04 `sync_status_changed` en cada cambio del indicador o de los pendientes.
pub fn sincronizar(app: AppHandle) {
    std::thread::spawn(move || {
        let mut anterior = None;
        // `None` al abrir la aplicación: cuenta como reconexión para la primera consulta (datos.md, Modelo · 6).
        let mut en_linea_antes: Option<bool> = None;
        let mut ultima_consulta = 0_i64;
        loop {
            std::thread::sleep(REVISION_DE_LA_COLA);
            let nucleo = app.state::<Nucleo>();
            let _ciclo = nucleo.ciclo.blocking_lock();
            let Some(sesion) = nucleo.sesion.sesion_guardada() else {
                // Tras cerrar sesión (HE-16-HU03), la próxima sesión empieza como al abrir la aplicación: con la
                // base vacía, la primera consulta va de inmediato.
                en_linea_antes = None;
                anterior = None;
                continue;
            };
            let base = nucleo.planificador.base();
            let cliente = nucleo.sesion.auth();
            let ahora = chrono::Utc::now().timestamp_millis();
            let user_id = sesion.user_id.to_lowercase();
            let credenciales = motor_de_sincronizacion::Credenciales {
                user_id: &user_id,
                token: &sesion.access_token,
            };
            let antes = cliente.en_linea();
            // HE-15-HU03-ET06: al recuperar la conexión (o al abrir), se mide el reloj, se envía de inmediato y se
            // descarga el resultado final.
            let reconectado = antes && en_linea_antes != Some(true);
            let hubo_pendientes = matches!(
                tauri::async_runtime::block_on(motor_de_sincronizacion::estado(base)),
                Ok(e) if e.pending_count > 0
            );
            let resultado = tauri::async_runtime::block_on(async {
                if reconectado {
                    motor_de_sincronizacion::calibrar(base, cliente, &credenciales, ahora).await?;
                }
                let envio = motor_de_sincronizacion::enviar(
                    base,
                    cliente,
                    &credenciales,
                    antes,
                    reconectado,
                    ahora,
                )
                .await?;
                let consultar = cliente.en_linea()
                    && (reconectado
                        || envio.llamo
                        || ahora - ultima_consulta >= CONSULTA_PERIODICA_MS);
                // HE-02-HU01-CA01: los catálogos van antes que `sync_pull`, porque los temas y la copia aplicada
                // que llegan los referencian.
                let catalogos = if consultar {
                    motor_de_sincronizacion::catalogo::descargar_catalogo(
                        base,
                        cliente,
                        &credenciales,
                        ahora,
                    )
                    .await?
                } else {
                    Vec::new()
                };
                if !catalogos.is_empty() {
                    let _ = app.emit(
                        "catalog_updated",
                        EventMapCatalogUpdated { kinds: catalogos },
                    );
                }
                let descarga = if consultar {
                    motor_de_sincronizacion::descargar(base, cliente, &credenciales).await?
                } else {
                    motor_de_sincronizacion::Ciclo::default()
                };
                Ok::<_, sqlx::Error>((envio, descarga))
            });
            en_linea_antes = Some(cliente.en_linea());
            // HE-15-HU02-ET05: un envío que no encuentra la red avisa que se perdió la conexión (EV-03).
            avisar_conectividad(&app, antes);
            if let Ok((envio, descarga)) = resultado {
                if descarga.llamo {
                    ultima_consulta = ahora;
                }
                avisar_ciclo(&app, &envio, &descarga, reconectado && hubo_pendientes);
            }
            if let Ok(estado) =
                tauri::async_runtime::block_on(motor_de_sincronizacion::estado(base))
                && anterior.as_ref() != Some(&estado)
            {
                let _ = app.emit("sync_status_changed", estado.clone());
                anterior = Some(estado);
            }
        }
    });
}

/// Consulta los cambios de otros computadores cada 60 s (datos.md, Modelo · 6).
const CONSULTA_PERIODICA_MS: i64 = 60_000;

/// EV-05 `sync_completed`, EV-06 `sync_conflicts_resolved` y los cambios de entidades que recibió el computador
/// (EV-07 a EV-09, `origin: 'remote'`), para que las pantallas vuelvan a leer.
fn avisar_ciclo(
    app: &AppHandle,
    envio: &motor_de_sincronizacion::Ciclo,
    descarga: &motor_de_sincronizacion::Ciclo,
    tras_reconectar: bool,
) {
    use crate::tipos::{
        ChangeOp, EntityChange, EventMapSyncCompleted, EventMapSyncConflictsResolved, OriginKind,
        Uuid,
    };
    if envio.cantidad > 0 || descarga.cantidad > 0 {
        let _ = app.emit(
            "sync_completed",
            EventMapSyncCompleted {
                pushed: envio.cantidad,
                pulled: descarga.cantidad,
                // HE-15-HU03-ET09: el mensaje solo tras sincronizar los cambios hechos offline.
                after_reconnect: tras_reconectar && envio.cantidad > 0,
            },
        );
    }
    if envio.conflictos_de_tarjetas > 0 {
        let _ = app.emit(
            "sync_conflicts_resolved",
            EventMapSyncConflictsResolved {
                count: envio.conflictos_de_tarjetas,
            },
        );
    }
    for (tipo, evento) in [
        ("card", "cards_changed"),
        ("label", "labels_changed"),
        ("kanban_column", "columns_changed"),
    ] {
        for eliminadas in [false, true] {
            let ids: Vec<Uuid> = envio
                .cambiadas
                .iter()
                .chain(&descarga.cambiadas)
                .filter(|(t, _, e)| t == tipo && *e == eliminadas)
                .map(|(_, id, _)| Uuid(id.clone()))
                .collect();
            if !ids.is_empty() {
                let _ = app.emit(
                    evento,
                    EntityChange {
                        ids,
                        op: if eliminadas {
                            ChangeOp::Delete
                        } else {
                            ChangeOp::Upsert
                        },
                        origin: OriginKind::Remote,
                    },
                );
            }
        }
    }
}

/// IPC-SYNC-01 `sync_get_status` (HE-15-HU01-ET03): el estado del indicador y los cambios pendientes.
#[tauri::command]
pub async fn sync_get_status(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<crate::tipos::SyncStatus>, ()> {
    let _ = params;
    Ok(leido(
        motor_de_sincronizacion::estado(nucleo.planificador.base())
            .await
            .map_err(crate::servicio_del_planificador::de_sqlx),
    ))
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
        avisar_wallpaper(&app).await;
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
        avisar_wallpaper(&app).await;
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

/// EV-08 `labels_changed` tras crear, editar o eliminar etiquetas en este computador.
fn avisar_etiquetas(app: &AppHandle, ids: Vec<crate::tipos::Uuid>, op: ChangeOp) {
    let _ = app.emit(
        "labels_changed",
        EntityChange {
            ids,
            op,
            origin: OriginKind::Local,
        },
    );
}

/// IPC-LABEL-02 `label_create` (HE-08-HU02). Guarda en la base local, con o sin conexión (ET15), y emite
/// `labels_changed` para que la pantalla Etiquetas y el Formulario de tarjeta la muestren (ET08).
#[tauri::command]
pub async fn label_create(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: LabelCreateParams,
) -> Result<IpcResult<Label>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.crear_etiqueta(&user_id, params).await,
        Err(e) => Err(e),
    };
    if let Ok(creada) = &r {
        avisar_etiquetas(&app, vec![creada.valor.id.clone()], ChangeOp::Upsert);
    }
    Ok(con_mensaje(r))
}

/// IPC-CAT-01 `catalog_list`. Por ahora solo el catálogo de colores (HE-08-HU02-ET05). DUDA: HE-08-HU02 los
/// demás catálogos llegan con los pasos del wallpaper y los temas; mientras tanto responden una lista vacía.
#[tauri::command]
pub async fn catalog_list(
    nucleo: State<'_, Nucleo>,
    params: CatalogListParams,
) -> Result<IpcResult<Vec<CatalogItem>>, ()> {
    Ok(leido(match params.kind {
        CatalogKind::Color => nucleo.planificador.colores().await,
        CatalogKind::Template => {
            nucleo
                .personalizacion
                .plantillas(nucleo.planificador.base())
                .await
        }
        CatalogKind::Image => {
            nucleo
                .personalizacion
                .imagenes(nucleo.planificador.base())
                .await
        }
        _ => Ok(Vec::new()),
    }))
}

/// IPC-THEME-07 `theme_draft_save` (HE-02-HU11): guarda la vista previa en el tema en edición, sin tocar el
/// escritorio. Avisa con `themes_changed` (EV-12) para que la lista de temas marque «Cambios sin aplicar».
#[tauri::command]
pub async fn theme_draft_save(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    _params: NoParams,
) -> Result<IpcResult<ThemeDraftSaveResult>, ()> {
    let ahora = RelojDelSistema.ahora_ms();
    let r = match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .guardar_borrador(nucleo.planificador.base(), &user_id, ahora)
                .await
        }
        Err(e) => Err(e),
    };
    if let Ok(guardado) = &r {
        let _ = app.emit(
            "themes_changed",
            EntityChange {
                ids: vec![guardado.valor.theme_id.clone()],
                op: ChangeOp::Upsert,
                origin: OriginKind::Local,
            },
        );
    }
    Ok(con_mensaje(r))
}

/// IPC-THEME-09 `theme_draft_apply` (HE-02-HU12): lleva la vista previa al escritorio y a la aplicación. Avisa
/// con EV-11 `applied_theme_changed` y EV-12 `themes_changed`, y con EV-16 para que la capa vuelva a pintar el
/// wallpaper sin reiniciar la aplicación (CA05, ET05; RNF-01).
#[tauri::command]
pub async fn theme_draft_apply(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: ThemeDraftApplyParams,
) -> Result<IpcResult<ThemeIdResult>, ()> {
    let ahora = RelojDelSistema.ahora_ms();
    let r = match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .aplicar_borrador(nucleo.planificador.base(), &user_id, &params.mode, ahora)
                .await
        }
        Err(e) => Err(e),
    };
    if let Ok(aplicado) = &r {
        let _ = app.emit(
            "applied_theme_changed",
            EventMapAppliedThemeChanged {
                theme_id: aplicado.valor.theme_id.clone(),
                origin: OriginKind::Local,
                has_unsaved_draft: matches!(params.mode, ApplyMode::ApplyWithoutSaving),
            },
        );
        let _ = app.emit(
            "themes_changed",
            EntityChange {
                ids: vec![aplicado.valor.theme_id.clone()],
                op: ChangeOp::Upsert,
                origin: OriginKind::Local,
            },
        );
        avisar_wallpaper(&app).await;
    }
    Ok(con_mensaje(r))
}

/// IPC-CAT-03 `image_import`: valida y copia la imagen propia a `%APPDATA%\Windgets\files` (HE-02-HU03).
#[tauri::command]
pub async fn image_import(
    nucleo: State<'_, Nucleo>,
    params: ImageImportParams,
) -> Result<IpcResult<ImageImportResult>, ()> {
    let carpeta = carpeta_de_archivos();
    let ahora = RelojDelSistema.ahora_ms();
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .importar_imagen(
                    nucleo.planificador.base(),
                    &user_id,
                    &params.path,
                    &params.purpose,
                    &carpeta,
                    ahora,
                )
                .await
        }
        Err(e) => Err(e),
    }))
}

/// Dónde están los archivos de la persona y los recursos que trae el instalador.
fn carpetas(app: &AppHandle) -> Carpetas {
    Carpetas {
        archivos: carpeta_de_archivos(),
        // DUDA: HE-02-HU01 sin carpeta de recursos (no debería pasar en la app instalada) se usa la actual.
        recursos: app
            .path()
            .resource_dir()
            .unwrap_or_else(|_| std::path::PathBuf::from(".")),
    }
}

/// Lo que dice el host: sin sesión la capa está oculta (HE-02-HU01-CA05); si no pudo anclarse, pide el
/// wallpaper por defecto (ET05).
fn estado_del_host(nucleo: &Nucleo) -> WallpaperState {
    if nucleo.sesion.sesion_guardada().is_none() {
        WallpaperState::Hidden
    } else if nucleo.host.anclaje_fallido() {
        WallpaperState::FallbackDefault
    } else {
        WallpaperState::Ok
    }
}

/// El estado de la capa para quien lo pida; sin sesión no hay cuenta que leer y se pinta la plantilla por
/// defecto, oculta.
async fn estado_de_la_capa(
    app: &AppHandle,
    nucleo: &Nucleo,
) -> Result<LayerInitialState, AppError> {
    let user_id = usuario(nucleo).unwrap_or_default();
    let capa = nucleo
        .personalizacion
        .estado_de_la_capa(
            nucleo.planificador.base(),
            &user_id,
            &carpetas(app),
            nucleo.host.monitores(),
            estado_del_host(nucleo),
        )
        .await;
    // El host reenvía la selección del mouse solo a los widgets que la capa pinta; oculta, a ninguno
    // (HE-06-HU01, D-186).
    if let Ok(estado) = &capa {
        nucleo
            .host
            .guardar_widgets(if estado.wallpaper_state == WallpaperState::Hidden {
                Vec::new()
            } else {
                estado.widgets.clone()
            });
    }
    capa
}

/// EV-16 `wallpaper_status_changed`: la ventana principal muestra el aviso con `fallback_default` y la capa vuelve
/// a leer su estado. Antes, el host muestra la capa con sesión y anclaje, y la oculta sin sesión (CA05). Lo llaman
/// el arranque, el inicio de sesión y la creación de la cuenta. DUDA: HE-02-HU01 el cierre de sesión (P12) debe
/// llamarlo también para ocultar la capa.
pub async fn avisar_wallpaper(app: &AppHandle) {
    let nucleo = app.state::<Nucleo>();
    crate::host_del_wallpaper::mostrar_capa(
        app,
        estado_del_host(&nucleo) != WallpaperState::Hidden && !nucleo.host.anclaje_fallido(),
    );
    if let Ok(capa) = estado_de_la_capa(app, &nucleo).await {
        let _ = app.emit(
            "wallpaper_status_changed",
            EventMapWallpaperStatusChanged {
                state: capa.wallpaper_state,
            },
        );
    }
}

/// IPC-THEME-02 `theme_get_applied` (HE-02-HU01-ET02): el tema aplicado, o la plantilla por defecto.
#[tauri::command]
pub async fn theme_get_applied(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<AppliedThemeView>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .tema_aplicado(nucleo.planificador.base(), &user_id)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-CAT-04 `asset_resolve` (HE-02-HU01-ET05): la ruta local de un archivo del catálogo o de la persona.
#[tauri::command]
pub async fn asset_resolve(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: AssetResolveParams,
) -> Result<IpcResult<AssetResolveResult>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .recurso(
                    nucleo.planificador.base(),
                    &user_id,
                    &carpetas(&app),
                    &params.kind,
                    &params.id,
                )
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-DESK-01 `layer_get_initial_state` (HE-02-HU01): el primer pintado de la capa.
#[tauri::command]
pub async fn layer_get_initial_state(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<LayerInitialState>, ()> {
    let _ = params;
    Ok(leido(estado_de_la_capa(&app, &nucleo).await))
}

/// IPC-DESK-02 `wallpaper_get_status` (HE-02-HU01-CA04): el estado que la ventana principal avisa.
#[tauri::command]
pub async fn wallpaper_get_status(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<WallpaperStatus>, ()> {
    let _ = params;
    Ok(leido(estado_de_la_capa(&app, &nucleo).await.map(|c| {
        WallpaperStatus {
            state: c.wallpaper_state,
        }
    })))
}

/// IPC-WID-01 `widget_list` (HE-04-HU01): los widgets del tema aplicado con su estado activo o inactivo.
#[tauri::command]
pub async fn widget_list(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<Vec<WidgetItem>>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .widgets(nucleo.planificador.base(), &user_id)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-WID-02 `widget_catalog_get` (HE-04-HU04): el catálogo de widgets que se pueden agregar.
#[tauri::command]
pub async fn widget_catalog_get(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<WidgetCatalog>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .catalogo_de_widgets(nucleo.planificador.base(), &user_id)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-WID-03 `widget_set_active` (HE-04-HU02): activa o desactiva un widget del tema aplicado. Avisa con
/// EV-12 `widgets_changed` para que la lista y la capa vuelvan a leer (ET01; RNF-01, 5 s o menos).
#[tauri::command]
pub async fn widget_set_active(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: WidgetSetActiveParams,
) -> Result<IpcResult<WidgetItem>, ()> {
    let ahora = RelojDelSistema.ahora_ms();
    let r = match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .activar_widget(
                    nucleo.planificador.base(),
                    &user_id,
                    &params.widget_id.0,
                    params.active,
                    ahora,
                )
                .await
        }
        Err(e) => Err(e),
    };
    if r.is_ok() {
        let _ = app.emit(
            "widgets_changed",
            EventMapWidgetsChanged {
                widget_ids: vec![params.widget_id.clone()],
                op: ChangeOp::Upsert,
                origin: OriginKind::Local,
            },
        );
    }
    Ok(leido(r))
}

/// `%APPDATA%\Windgets\files`; sin `APPDATA`, la carpeta temporal.
fn carpeta_de_archivos() -> std::path::PathBuf {
    std::env::var_os("APPDATA")
        .map_or_else(std::env::temp_dir, std::path::PathBuf::from)
        .join("Windgets")
        .join("files")
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

/// EV-09 `columns_changed` tras crear, editar, reordenar o eliminar columnas en este computador.
fn avisar_columnas(app: &AppHandle, ids: Vec<crate::tipos::Uuid>, op: ChangeOp) {
    let _ = app.emit(
        "columns_changed",
        EntityChange {
            ids,
            op,
            origin: OriginKind::Local,
        },
    );
}

/// IPC-COL-02 `column_create` (HE-09-HU03). Emite `columns_changed` para que el tablero y el widget Kanban
/// agreguen la columna al final (ET09).
#[tauri::command]
pub async fn column_create(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: ColumnCreateParams,
) -> Result<IpcResult<Column>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.crear_columna(&user_id, params).await,
        Err(e) => Err(e),
    };
    if let Ok(creada) = &r {
        avisar_columnas(&app, vec![creada.valor.id.clone()], ChangeOp::Upsert);
    }
    Ok(con_mensaje(r))
}

/// IPC-COL-03 `column_update` (HE-09-HU04). Emite `columns_changed` para que el tablero y el widget Kanban
/// muestren el nombre y el color nuevos (ET07).
#[tauri::command]
pub async fn column_update(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: ColumnUpdateParams,
) -> Result<IpcResult<Column>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .actualizar_columna(&user_id, params)
                .await
        }
        Err(e) => Err(e),
    };
    if let Ok(editada) = &r {
        avisar_columnas(&app, vec![editada.valor.id.clone()], ChangeOp::Upsert);
    }
    Ok(con_mensaje(r))
}

/// IPC-COL-04 `column_reorder` (HE-09-HU05). Sin mensaje de resultado (DP-05). Emite `columns_changed` para que
/// el tablero y el widget Kanban muestren el orden nuevo (ET03).
#[tauri::command]
pub async fn column_reorder(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: ColumnReorderParams,
) -> Result<IpcResult<Vec<Column>>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .reordenar_columnas(&user_id, params)
                .await
        }
        Err(e) => Err(e),
    };
    if let Ok(columnas) = &r {
        avisar_columnas(
            &app,
            columnas.iter().map(|c| c.id.clone()).collect(),
            ChangeOp::Upsert,
        );
    }
    Ok(leido(r))
}

/// IPC-REP-01 `report_resolve_range` (HE-13-HU01): el rango de fechas resuelto con la fecha de hoy, o el error
/// de campo del rango personalizado.
#[tauri::command]
pub async fn report_resolve_range(
    nucleo: State<'_, Nucleo>,
    params: crate::tipos::ReportResolveRangeParams,
) -> Result<IpcResult<crate::tipos::ResolvedRange>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .rango_del_reporte(&user_id, &params)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-REP-02 `report_get_meta` (HE-13-HU02): si hay tarjetas, desde cuándo y si hay etiquetas.
#[tauri::command]
pub async fn report_get_meta(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<crate::tipos::ReportMeta>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.meta_del_reporte(&user_id).await,
        Err(e) => Err(e),
    }))
}

/// IPC-REP-05 `report_get_status_breakdown` (HE-13-HU04): vencidas, pendientes y completadas.
#[tauri::command]
pub async fn report_get_status_breakdown(
    nucleo: State<'_, Nucleo>,
    params: crate::tipos::ReportFilterParams,
) -> Result<IpcResult<crate::tipos::StatusBreakdown>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .estados_del_reporte(&user_id, &params)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-REP-04 `report_get_compliance` (HE-13-HU03): la tasa de cumplimiento.
#[tauri::command]
pub async fn report_get_compliance(
    nucleo: State<'_, Nucleo>,
    params: crate::tipos::ReportFilterParams,
) -> Result<IpcResult<crate::tipos::ComplianceReport>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .cumplimiento_del_reporte(&user_id, &params)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-REP-03 `report_get_completed` (HE-13-HU02): la gráfica de tarjetas completadas.
#[tauri::command]
pub async fn report_get_completed(
    nucleo: State<'_, Nucleo>,
    params: crate::tipos::ReportFilterParams,
) -> Result<IpcResult<crate::tipos::CompletedReport>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .completadas_del_reporte(&user_id, &params)
                .await
        }
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

/// IPC-CARD-03 `card_delete` (HE-07-HU05). Emite `cards_changed` con `op: 'delete'` para que la tarjeta
/// desaparezca de todas las vistas (ET04).
#[tauri::command]
pub async fn card_delete(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: CardIdParams,
) -> Result<IpcResult<()>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .planificador
                .eliminar_tarjeta(&user_id, &params.id.0)
                .await
        }
        Err(e) => Err(e),
    };
    if r.is_ok() {
        avisar_tarjetas(&app, vec![params.id], ChangeOp::Delete);
    }
    Ok(con_mensaje(r))
}

/// IPC-CARD-06 `card_move` (HE-09-HU02): drag-and-drop y «Mover a». Emite `cards_changed` (EV-07).
#[tauri::command]
pub async fn card_move(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: CardMoveParams,
) -> Result<IpcResult<Card>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.mover_tarjeta(&user_id, params).await,
        Err(e) => Err(e),
    };
    if let Ok(movida) = &r {
        avisar_tarjetas(&app, vec![movida.id.clone()], ChangeOp::Upsert);
    }
    Ok(leido(r))
}

/// IPC-CARD-09 `agenda_get_day` (HE-11-HU01): la agenda diaria de un día.
#[tauri::command]
pub async fn agenda_get_day(
    nucleo: State<'_, Nucleo>,
    params: AgendaDayParams,
) -> Result<IpcResult<AgendaDay>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.agenda(&user_id, &params.date.0).await,
        Err(e) => Err(e),
    }))
}

/// IPC-CARD-10 `card_assign_time_block` (HE-11-HU02). Emite `cards_changed` para que la agenda, el planificador
/// diario y el widget Tareas del día muestren la tarjeta en su bloque (ET02).
#[tauri::command]
pub async fn card_assign_time_block(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: CardAssignTimeBlockParams,
) -> Result<IpcResult<Card>, ()> {
    let r = match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.asignar_bloque(&user_id, params).await,
        Err(e) => Err(e),
    };
    if let Ok(asignada) = &r {
        avisar_tarjetas(&app, vec![asignada.valor.id.clone()], ChangeOp::Upsert);
    }
    Ok(con_mensaje(r))
}

/// IPC-CARD-08 `planner_get_today` (HE-12-HU01): el planificador diario de hoy.
#[tauri::command]
pub async fn planner_get_today(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<PlannerToday>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => nucleo.planificador.planificador_de_hoy(&user_id).await,
        Err(e) => Err(e),
    }))
}

/// IPC-THEME-01 `theme_list` (HE-02-HU10): los temas guardados, el más reciente primero.
#[tauri::command]
pub async fn theme_list(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<Vec<ThemeSummary>>, ()> {
    let _ = params;
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .temas(nucleo.planificador.base(), &user_id)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-THEME-03 `theme_draft_open` (HE-02-HU10): abre la pantalla Personalización del wallpaper con el tema
/// aplicado (o el pedido) como tema en edición.
#[tauri::command]
pub async fn theme_draft_open(
    nucleo: State<'_, Nucleo>,
    params: ThemeDraftOpenParams,
) -> Result<IpcResult<ThemeDraftView>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .abrir_borrador(
                    nucleo.planificador.base(),
                    &user_id,
                    params.theme_id.as_ref().map(|id| id.0.as_str()),
                )
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-THEME-04 `theme_draft_select` (HE-02-HU10): cambia el tema en edición sin tocar el escritorio.
#[tauri::command]
pub async fn theme_draft_select(
    nucleo: State<'_, Nucleo>,
    params: ThemeDraftSelectParams,
) -> Result<IpcResult<ThemeDraftView>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .seleccionar_borrador(
                    nucleo.planificador.base(),
                    &user_id,
                    &params.theme_id.0,
                    params.discard_changes.unwrap_or(false),
                )
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-THEME-05 `theme_draft_update` (HE-02-HU02): cambia la vista previa sin tocar el escritorio.
#[tauri::command]
pub async fn theme_draft_update(
    nucleo: State<'_, Nucleo>,
    params: ThemeDraftUpdateParams,
) -> Result<IpcResult<ThemeDraftView>, ()> {
    Ok(leido(match usuario(&nucleo) {
        Ok(user_id) => {
            nucleo
                .personalizacion
                .actualizar_borrador(nucleo.planificador.base(), &user_id, &params.patch)
                .await
        }
        Err(e) => Err(e),
    }))
}

/// IPC-AUTH-13 `auth_get_sign_out_info` (HE-16-HU03-CA03): cuántos cambios esperan sincronizarse.
#[tauri::command]
pub async fn auth_get_sign_out_info(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<AuthSignOutInfo>, ()> {
    let _ = params;
    Ok(leido(
        nucleo
            .sesion
            .informacion_de_cierre(nucleo.planificador.base())
            .await
            .map_err(crate::servicio_del_planificador::de_sqlx),
    ))
}

/// IPC-AUTH-14 `auth_sign_out` (HE-16-HU03-CA01, CA04; D-190; RNF-19). Espera a que termine el ciclo de
/// sincronización en curso, para que no escriba en la base recién vaciada; borra el token, la base y los archivos;
/// oculta la capa, con lo que se ve de nuevo el fondo original de Windows (ET03), y emite `session_changed` con
/// `reason: 'sign_out'` (EV-01): la ventana principal abre Inicio de sesión (ET06).
#[tauri::command]
pub async fn auth_sign_out(
    app: AppHandle,
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<()>, ()> {
    let _ = params;
    let r = {
        let _ciclo = nucleo.ciclo.lock().await;
        nucleo
            .sesion
            .cerrar_sesion(nucleo.planificador.base(), &carpeta_de_archivos())
            .await
    };
    nucleo.personalizacion.olvidar_borrador();
    avisar_wallpaper(&app).await;
    let _ = app.emit(
        "session_changed",
        EventMapSessionChanged {
            state: EventMapSessionChangedState::SignedOut,
            alias: None,
            reason: EventMapSessionChangedReason::SignOut,
        },
    );
    Ok(con_mensaje(Ok(r)))
}

/// IPC-DESK-10 `autostart_get` (HE-16-HU02-CA03, ET06): el estado que tiene Windows.
#[tauri::command]
pub fn autostart_get(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> IpcResult<crate::tipos::AutostartState> {
    let _ = params;
    correcto(crate::integracion_con_el_sistema::inicio_automatico::estado(nucleo.arranque.as_ref()))
}

/// IPC-DESK-11 `autostart_set` (HE-16-HU02-CA01, CA02, CA04, CA05). Sin la ruta del ejecutable no se puede
/// escribir el valor de `Run`: responde `autostart.failed`.
#[tauri::command]
pub fn autostart_set(
    nucleo: State<'_, Nucleo>,
    params: crate::tipos::AutostartState,
) -> IpcResult<crate::tipos::AutostartState> {
    use crate::integracion_con_el_sistema::inicio_automatico::cambiar;
    let ejecutable = std::env::current_exe().unwrap_or_default();
    con_mensaje(cambiar(
        nucleo.arranque.as_ref(),
        params.enabled,
        &ejecutable,
    ))
}

/// IPC-DESK-06 `app_hide_main_window` (HE-17-HU01-CA01): cierra la ventana y deja la aplicación en segundo plano.
#[tauri::command]
pub fn app_hide_main_window(app: AppHandle, params: NoParams) -> IpcResult<()> {
    let _ = params;
    crate::integracion_con_el_sistema::area_de_notificacion::ocultar_ventana(&app);
    correcto(())
}

/// IPC-DESK-04 `app_get_last_screen` (HE-17-HU02-ET05; D-156): la última pantalla visitada en este computador.
#[tauri::command]
pub async fn app_get_last_screen(
    nucleo: State<'_, Nucleo>,
    params: NoParams,
) -> Result<IpcResult<crate::tipos::LastScreen>, ()> {
    let _ = params;
    use crate::servicio_de_personalizacion_y_configuracion::ultima_pantalla;
    Ok(leido(
        ultima_pantalla::leer(nucleo.planificador.base())
            .await
            .map(|screen| crate::tipos::LastScreen { screen })
            .map_err(crate::servicio_del_planificador::de_sqlx),
    ))
}

/// IPC-DESK-05 `app_set_last_screen` (HE-17-HU02-ET05): la vista la guarda cada vez que abre una pantalla.
#[tauri::command]
pub async fn app_set_last_screen(
    nucleo: State<'_, Nucleo>,
    params: crate::tipos::AppSetLastScreenParams,
) -> Result<IpcResult<()>, ()> {
    use crate::servicio_de_personalizacion_y_configuracion::ultima_pantalla;
    Ok(leido(
        ultima_pantalla::guardar(
            nucleo.planificador.base(),
            params.screen,
            chrono::Utc::now().timestamp_millis(),
        )
        .await
        .map_err(crate::servicio_del_planificador::de_sqlx),
    ))
}

/// IPC-DESK-07 `app_request_exit` (HE-17-HU03-CA02, CA04): si salir pide confirmar los cambios sin guardar.
#[tauri::command]
pub fn app_request_exit(
    app: AppHandle,
    params: NoParams,
) -> IpcResult<crate::tipos::AppRequestExitResult> {
    let _ = params;
    correcto(crate::tipos::AppRequestExitResult {
        requires_confirmation:
            crate::integracion_con_el_sistema::area_de_notificacion::requiere_confirmacion(&app),
    })
}

/// IPC-DESK-08 `app_exit` (HE-17-HU03-CA01, CA03): cierra el programa sin cerrar la sesión.
#[tauri::command]
pub fn app_exit(app: AppHandle, params: crate::tipos::AppExitParams) -> IpcResult<()> {
    crate::integracion_con_el_sistema::area_de_notificacion::salir(&app, params.discard_changes);
    correcto(())
}
