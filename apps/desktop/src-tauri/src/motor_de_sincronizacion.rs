//! Motor de sincronización (arquitectura.md, vista 3b, Núcleo · servicios que usan la nube).
//! Responsabilidad: «Envía la cola 2 s después de guardar, consulta cambios al abrir, al reconectar y cada 60 s,
//! y aplica lo recibido; la combinación la decide el servidor.»
//!
//! HE-15-HU01: cada cambio que el Núcleo guarda en SQLite queda en `pending_change` (encolado en la misma
//! transacción); el motor lo envía con RPC-02 `sync_push` sin que el usuario elija una opción (ET01). Si la nube
//! no responde, el cambio se conserva y se reintenta cada minuto (ET04). La nube queda detrás del trait
//! [`NubeDeSincronizacion`] para que las pruebas usen un doble.

use std::future::Future;

use chrono::DateTime;

use crate::cliente_de_supabase::FallaDeAuth;
use crate::repositorios_y_archivos_locales::BaseLocal;
pub mod archivos;
pub mod cancelacion;
pub mod catalogo;

use crate::tipos::{
    CatalogPullParams, CatalogPullResultVariant2, Instant, SyncChange, SyncChangeStatus,
    SyncPullParams, SyncPullResult, SyncPushParams, SyncPushResult, SyncRow, SyncState, SyncStatus,
    Uuid,
};

/// Los cambios se envían 2 s después de guardar (datos.md, Modelo · 6; D-030).
pub const ESPERA_TRAS_GUARDAR_MS: i64 = 2_000;
/// Sin respuesta de la nube, se reintenta cada minuto (HE-15-HU01-ET04).
pub const REINTENTO_MS: i64 = 60_000;
/// `sync_push` acepta hasta 200 cambios por llamada (RPC-02, `too_many_changes`).
pub const CAMBIOS_POR_ENVIO: i64 = 200;

/// INT-09, «Falla»: el cambio que usa una imagen propia espera a que el archivo suba (`depends_on_upload_id`). Como
/// la cola se envía en el orden en que se hicieron los cambios (HE-15-HU03-ET06) y los que vienen después pueden
/// usar esa imagen (un tema, un widget), se envían solo los anteriores al primer cambio que espera.
const ENVIABLE: &str = "id < coalesce((SELECT min(id) FROM pending_change WHERE depends_on_upload_id IS NOT NULL),      9223372036854775807)";

/// La cuenta y el JWT de la sesión iniciada.
pub struct Credenciales<'a> {
    pub user_id: &'a str,
    pub token: &'a str,
}

/// RPC-02 `sync_push` de Supabase con el JWT de la sesión.
pub trait NubeDeSincronizacion: Send + Sync {
    fn sync_push(
        &self,
        token: &str,
        params: &SyncPushParams,
    ) -> impl Future<Output = Result<SyncPushResult, FallaDeAuth>> + Send;
    /// RPC-03 `sync_pull`: las filas del usuario con `updated_seq` mayor que el cursor.
    fn sync_pull(
        &self,
        token: &str,
        params: &SyncPullParams,
    ) -> impl Future<Output = Result<SyncPullResult, FallaDeAuth>> + Send;
    /// RPC-01 `server_time`: la hora del servidor, para medir el desfase del reloj (HE-15-HU03-ET05).
    fn server_time(&self, token: &str)
    -> impl Future<Output = Result<Instant, FallaDeAuth>> + Send;
    /// RPC-04 `catalog_pull`: los catálogos activos si cambió la versión; `None` si no cambió (HE-02-HU01).
    fn catalog_pull(
        &self,
        token: &str,
        params: &CatalogPullParams,
    ) -> impl Future<Output = Result<Option<CatalogPullResultVariant2>, FallaDeAuth>> + Send;
}

/// Lo que dejó un ciclo de envío o de descarga.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Ciclo {
    /// Si llamó a la nube.
    pub llamo: bool,
    /// Cambios enviados o filas descargadas.
    pub cantidad: i64,
    /// Respuestas con `conflict` sobre una tarjeta (EV-06, HE-15-HU03).
    pub conflictos_de_tarjetas: i64,
    /// Filas locales que cambió lo recibido: `(entity_kind, entity_id, eliminada)`.
    pub cambiadas: Vec<(String, String, bool)>,
    /// La descarga no terminó porque `sync_pull` falló (HE-14-HU03-ET13).
    pub fallo: bool,
}

/// Un instante en el formato del contrato (`AAAA-MM-DDTHH:MM:SS.mmmZ`, UTC).
pub fn instante(ms: i64) -> String {
    DateTime::from_timestamp_millis(ms)
        .unwrap_or_default()
        .format("%Y-%m-%dT%H:%M:%S%.3fZ")
        .to_string()
}

fn milisegundos(valor: &str) -> Option<i64> {
    DateTime::parse_from_rfc3339(valor)
        .ok()
        .map(|d| d.timestamp_millis())
}

/// Crea la fila única de `sync_state` de la cuenta la primera vez, con un UUID nuevo para este computador.
/// DUDA: HE-15-HU01 no se define quién crea `sync_state`; el motor la crea al primer ciclo con la sesión iniciada.
async fn preparar(base: &BaseLocal, user_id: &str) -> Result<(), sqlx::Error> {
    let pool = base.pool().await?;
    sqlx::query("INSERT OR IGNORE INTO sync_state (id, user_id, device_id) VALUES (1, ?, ?)")
        .bind(user_id)
        .bind(uuid::Uuid::new_v4().to_string())
        .execute(pool)
        .await?;
    // Antes de P23 las filas con booleanos (widget, theme_widget) no se aplicaban y el cursor ya las pasó: una
    // sola vez por base se vuelve a descargar desde el principio. Aplicar una fila otra vez no cambia nada.
    let hecha: Option<String> =
        sqlx::query_scalar("SELECT value FROM device_setting WHERE key = ?")
            .bind(REDESCARGA)
            .fetch_optional(pool)
            .await?;
    if hecha.is_none() {
        let mut tx = pool.begin().await?;
        sqlx::query("UPDATE sync_state SET last_pulled_seq = 0 WHERE id = 1")
            .execute(&mut *tx)
            .await?;
        sqlx::query("INSERT INTO device_setting (key, value, updated_at) VALUES (?, 'true', ?)")
            .bind(REDESCARGA)
            .bind(instante(chrono::Utc::now().timestamp_millis()))
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
    }
    Ok(())
}

/// Marca de `device_setting`: la base ya volvió a descargar todo tras corregir los booleanos (P23).
const REDESCARGA: &str = "sync_full_pull_after_booleans";

/// IPC-SYNC-01 `sync_get_status`: el estado del indicador y la cantidad de cambios pendientes.
pub async fn estado(base: &BaseLocal) -> Result<SyncStatus, sqlx::Error> {
    let pool = base.pool().await?;
    let fila: Option<(String, Option<String>)> =
        sqlx::query_as("SELECT status, last_sync_at FROM sync_state WHERE id = 1")
            .fetch_optional(pool)
            .await?;
    let pendientes: i64 = sqlx::query_scalar("SELECT count(*) FROM pending_change")
        .fetch_one(pool)
        .await?;
    let (status, ultimo) = fila.unwrap_or_else(|| ("synced".into(), None));
    Ok(SyncStatus {
        status: match status.as_str() {
            "syncing" => SyncState::Syncing,
            "offline" => SyncState::Offline,
            "error" => SyncState::Error,
            _ => SyncState::Synced,
        },
        pending_count: pendientes,
        last_sync_at: ultimo.map(Instant),
    })
}

async fn poner_estado(base: &BaseLocal, estado: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE sync_state SET status = ? WHERE id = 1")
        .bind(estado)
        .execute(base.pool().await?)
        .await?;
    Ok(())
}

/// Un ciclo de envío (HE-15-HU01). Envía la cola si hay cambios guardados hace al menos 2 s y ningún intento
/// fallido en el último minuto (ET04). Sin conexión no llama a la nube: el indicador queda «Sin conexión» y los
/// cambios se acumulan como pendientes (HE-15-HU02-ET03, ET04). Con `forzar` (al recuperar la conexión,
/// HE-15-HU03-ET06) envía de inmediato. Lo que la nube decide en un conflicto se adopta en el computador.
pub async fn enviar<N: NubeDeSincronizacion>(
    base: &BaseLocal,
    nube: &N,
    sesion: &Credenciales<'_>,
    en_linea: bool,
    forzar: bool,
    ahora_ms: i64,
) -> Result<Ciclo, sqlx::Error> {
    preparar(base, sesion.user_id).await?;
    let pool = base.pool().await?;
    if !en_linea {
        poner_estado(base, "offline").await?;
        return Ok(Ciclo::default());
    }
    // Volvió la conexión: deja de mostrar «Sin conexión» aunque no haya nada que enviar.
    sqlx::query("UPDATE sync_state SET status = 'synced' WHERE id = 1 AND status = 'offline'")
        .execute(pool)
        .await?;
    let reintento = instante(ahora_ms - REINTENTO_MS);
    let en_espera: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM pending_change WHERE last_attempt_at IS NOT NULL AND last_attempt_at > ?",
    )
    .bind(&reintento)
    .fetch_one(pool)
    .await?;
    let listos: i64 = sqlx::query_scalar(&format!(
        "SELECT count(*) FROM pending_change WHERE modified_at <= ? AND {ENVIABLE}"
    ))
    .bind(instante(ahora_ms - ESPERA_TRAS_GUARDAR_MS))
    .fetch_one(pool)
    .await?;
    let hay: i64 = sqlx::query_scalar(&format!(
        "SELECT count(*) FROM pending_change WHERE {ENVIABLE}"
    ))
    .fetch_one(pool)
    .await?;
    if hay == 0 || (!forzar && (en_espera > 0 || listos == 0)) {
        return Ok(Ciclo::default());
    }

    // HE-15-HU03-ET06 (CA07): en el orden en que se hicieron (el `id` de la cola).
    let filas: Vec<(i64, String, String, String, String, String)> = sqlx::query_as(&format!(
        "SELECT id, entity_kind, entity_id, op, fields, modified_at FROM pending_change WHERE {ENVIABLE}          ORDER BY id LIMIT ?"
    ))
    .bind(CAMBIOS_POR_ENVIO)
    .fetch_all(pool)
    .await?;
    let (device_id, desfase): (String, i64) =
        sqlx::query_as("SELECT device_id, clock_offset_ms FROM sync_state WHERE id = 1")
            .fetch_one(pool)
            .await?;
    let cambios: Vec<SyncChange> = filas
        .iter()
        .filter_map(|(id, tipo, entidad, op, campos, modificado)| {
            serde_json::from_value(serde_json::json!({
                "change_id": id,
                "entity_kind": tipo,
                "entity_id": entidad,
                "op": op,
                "modified_at": modificado,
                "fields": serde_json::from_str::<serde_json::Value>(campos).ok()?,
            }))
            .ok()
        })
        .collect();
    let params = SyncPushParams {
        p_device_id: Uuid(device_id),
        p_clock_offset_ms: desfase,
        p_changes: cambios,
    };

    poner_estado(base, "syncing").await?;
    let mut ciclo = Ciclo {
        llamo: true,
        ..Ciclo::default()
    };
    match nube.sync_push(sesion.token, &params).await {
        Ok(respuesta) => {
            ciclo.cantidad = respuesta.results.len() as i64;
            let mut tx = pool.begin().await?;
            // Se quita de la cola lo enviado, salvo que se haya vuelto a modificar mientras tanto.
            // DUDA: HE-15-HU01 un cambio `rejected` no se acepta nunca; se quita de la cola para no bloquearla.
            for resultado in &respuesta.results {
                if let Some((_, _, _, _, _, modificado)) =
                    filas.iter().find(|f| f.0 == resultado.change_id)
                {
                    sqlx::query("DELETE FROM pending_change WHERE id = ? AND modified_at = ?")
                        .bind(resultado.change_id)
                        .bind(modificado)
                        .execute(&mut *tx)
                        .await?;
                }
            }
            // HE-15-HU03: la combinación la decide el servidor (D-189). Con un conflicto, o si el cambio no se
            // aplicó tal cual, se adopta la fila ganadora que trae la respuesta.
            let ganadoras: Vec<SyncRow> = respuesta
                .results
                .iter()
                .filter(|r| r.conflict || !matches!(r.status, SyncChangeStatus::Applied))
                .filter_map(|r| r.row.clone())
                .collect();
            ciclo.conflictos_de_tarjetas = respuesta
                .results
                .iter()
                .filter(|r| r.conflict)
                .filter(|r| filas.iter().any(|f| f.0 == r.change_id && f.1 == "card"))
                .count() as i64;
            ciclo.cambiadas = aplicar_filas(&mut tx, &ganadoras, sesion.user_id).await?;
            sqlx::query(
                "UPDATE sync_state SET status = 'synced', last_sync_at = ?, last_error_code = NULL \
                 WHERE id = 1",
            )
            .bind(&respuesta.server_now.0)
            .execute(&mut *tx)
            .await?;
            tx.commit().await?;
        }
        Err(falla) => {
            // ET04: el cambio se conserva en el computador y se reintenta en un minuto.
            let (estado, codigo) = match &falla {
                FallaDeAuth::SinConexion => ("offline", "net.offline".to_string()),
                FallaDeAuth::SinRespuesta => ("error", "service.unavailable".to_string()),
                FallaDeAuth::Rechazo { codigo, .. } => ("error", codigo.clone()),
            };
            let ids: Vec<i64> = filas.iter().map(|f| f.0).collect();
            let mut tx = pool.begin().await?;
            for id in ids {
                sqlx::query(
                    "UPDATE pending_change SET attempts = attempts + 1, last_attempt_at = ?, last_error = ? \
                     WHERE id = ?",
                )
                .bind(instante(ahora_ms))
                .bind(&codigo)
                .bind(id)
                .execute(&mut *tx)
                .await?;
            }
            sqlx::query("UPDATE sync_state SET status = ?, last_error_code = ? WHERE id = 1")
                .bind(estado)
                .bind(&codigo)
                .execute(&mut *tx)
                .await?;
            tx.commit().await?;
        }
    }
    Ok(ciclo)
}

/// HE-15-HU03-ET05 (CA08): al recuperar la conexión se mide la diferencia entre el reloj del servidor y el del
/// computador; `sync_push` la aplica a las horas de modificación antes de comparar.
pub async fn calibrar<N: NubeDeSincronizacion>(
    base: &BaseLocal,
    nube: &N,
    sesion: &Credenciales<'_>,
    ahora_ms: i64,
) -> Result<(), sqlx::Error> {
    preparar(base, sesion.user_id).await?;
    if let Ok(hora) = nube.server_time(sesion.token).await
        && let Some(servidor) = milisegundos(&hora.0)
    {
        sqlx::query(
            "UPDATE sync_state SET clock_offset_ms = ?, clock_calibrated_at = ? WHERE id = 1",
        )
        .bind(servidor - ahora_ms)
        .bind(&hora.0)
        .execute(base.pool().await?)
        .await?;
    }
    Ok(())
}

/// Descarga con RPC-03 `sync_pull` lo que cambió desde el cursor (HE-15-HU03-ET06: «el computador descarga el
/// resultado final»), una transacción por página, y avanza el cursor.
pub async fn descargar<N: NubeDeSincronizacion>(
    base: &BaseLocal,
    nube: &N,
    sesion: &Credenciales<'_>,
) -> Result<Ciclo, sqlx::Error> {
    preparar(base, sesion.user_id).await?;
    let pool = base.pool().await?;
    let mut ciclo = Ciclo {
        llamo: true,
        ..Ciclo::default()
    };
    loop {
        let cursor: i64 = sqlx::query_scalar("SELECT last_pulled_seq FROM sync_state WHERE id = 1")
            .fetch_one(pool)
            .await?;
        let pagina = match nube
            .sync_pull(
                sesion.token,
                &SyncPullParams {
                    p_since_seq: cursor,
                    p_limit: None,
                },
            )
            .await
        {
            Ok(pagina) => pagina,
            Err(falla) => {
                // ET07: lo descargado hasta aquí queda; el resto llega en la siguiente consulta.
                let estado = if falla == FallaDeAuth::SinConexion {
                    "offline"
                } else {
                    "error"
                };
                poner_estado(base, estado).await?;
                ciclo.fallo = true;
                return Ok(ciclo);
            }
        };
        let mut tx = pool.begin().await?;
        let cambiadas = aplicar_filas(&mut tx, &pagina.rows, sesion.user_id).await?;
        sqlx::query("UPDATE sync_state SET last_pulled_seq = ?, last_sync_at = ? WHERE id = 1")
            .bind(pagina.next_seq.max(cursor))
            .bind(&pagina.server_now.0)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        ciclo.cantidad += pagina.rows.len() as i64;
        ciclo.cambiadas.extend(cambiadas);
        if !pagina.has_more || pagina.next_seq <= cursor {
            break;
        }
    }
    Ok(ciclo)
}

/// Orden padre → hijo de las entidades (datos.md, Modelo · 6, «Aplicación local»).
const ORDEN: [&str; 12] = [
    "profile",
    "user_preference",
    "kanban_column",
    "label",
    "uploaded_image",
    "theme",
    "applied_theme",
    "card",
    "card_label",
    "widget",
    "theme_widget",
    "widget_carousel_item",
];

fn valor_sql(valor: &serde_json::Value) -> Option<String> {
    match valor {
        serde_json::Value::Null => None,
        serde_json::Value::String(texto) => Some(texto.clone()),
        // SQLite guarda los booleanos como 0 y 1 (`CHECK (is_default IN (0,1))`); el texto «true» no cumple el
        // esquema y la fila no se aplicaba (widget, theme_widget).
        serde_json::Value::Bool(si) => Some(if *si { "1" } else { "0" }.to_string()),
        otro => Some(otro.to_string()),
    }
}

/// Aplica filas recibidas de la nube sin encolarlas (el reajuste por resolución no se encola). Las eliminaciones
/// van primero, de hijo a padre, y las altas de padre a hijo. Un campo con un cambio pendiente más reciente que el
/// recibido no se sobrescribe. Devuelve las filas tocadas.
async fn aplicar_filas(
    tx: &mut sqlx::SqliteConnection,
    filas: &[SyncRow],
    user_id: &str,
) -> Result<Vec<(String, String, bool)>, sqlx::Error> {
    let tipo_de = |fila: &SyncRow| {
        serde_json::to_value(&fila.entity_kind)
            .ok()
            .and_then(|v| v.as_str().map(str::to_string))
            .unwrap_or_default()
    };
    let posicion = |tipo: &str| ORDEN.iter().position(|t| *t == tipo);
    let mut ordenadas: Vec<(&SyncRow, String, usize)> = filas
        .iter()
        .filter_map(|f| {
            let tipo = tipo_de(f);
            posicion(&tipo).map(|i| (f, tipo, i))
        })
        .collect();
    // Eliminaciones primero (hijo → padre); después altas y cambios (padre → hijo).
    ordenadas.sort_by_key(|(f, _, i)| {
        if f.deleted_at.is_some() {
            (0, ORDEN.len() - i)
        } else {
            (1, *i)
        }
    });
    let mut tocadas = Vec::new();
    for (fila, tipo, _) in ordenadas {
        // El nombre de la tabla sale de la lista fija ORDEN, nunca del texto recibido.
        let Some(tabla) = ORDEN.iter().find(|t| **t == tipo) else {
            continue;
        };
        let clave = if *tabla == "profile" { "user_id" } else { "id" };
        let id = fila.entity_id.0.to_lowercase();
        if fila.deleted_at.is_some() {
            sqlx::query(&format!("DELETE FROM {tabla} WHERE {clave} = ?"))
                .bind(&id)
                .execute(&mut *tx)
                .await?;
            tocadas.push((tipo.clone(), id, true));
            continue;
        }
        let columnas: Vec<String> =
            sqlx::query_scalar(&format!("SELECT name FROM pragma_table_info('{tabla}')"))
                .fetch_all(&mut *tx)
                .await?;
        let pendiente: Option<(String, String)> = sqlx::query_as(
            "SELECT op, fields FROM pending_change WHERE entity_kind = ? AND entity_id = ?",
        )
        .bind(&tipo)
        .bind(&id)
        .fetch_optional(&mut *tx)
        .await?;
        // Una eliminación local pendiente la decide el servidor al enviarla.
        if pendiente.as_ref().is_some_and(|(op, _)| op == "delete") {
            continue;
        }
        let campos_pendientes: serde_json::Value = pendiente
            .and_then(|(_, f)| serde_json::from_str(&f).ok())
            .unwrap_or_default();
        let mas_reciente_local = |campo: &str| {
            let local = campos_pendientes
                .get(campo)
                .and_then(|c| c.get("modified_at"))
                .and_then(|m| m.as_str());
            match (local, fila.field_mods.get(campo)) {
                (Some(local), Some(remoto)) => local > remoto.0.as_str(),
                (Some(_), None) => true,
                _ => false,
            }
        };
        let mut nombres: Vec<String> = vec![clave.to_string()];
        let mut valores: Vec<Option<String>> = vec![Some(id.clone())];
        if let Some(objeto) = fila.fields.as_object() {
            for (campo, valor) in objeto {
                if campo == clave
                    || campo == "user_id"
                    || !columnas.contains(campo)
                    || mas_reciente_local(campo)
                {
                    continue;
                }
                nombres.push(campo.clone());
                valores.push(valor_sql(valor));
            }
        }
        if clave != "user_id" && columnas.iter().any(|c| c == "user_id") {
            nombres.push("user_id".into());
            valores.push(Some(user_id.to_string()));
        }
        if columnas.iter().any(|c| c == "field_mods") {
            nombres.push("field_mods".into());
            valores.push(serde_json::to_string(&fila.field_mods).ok());
        }
        if columnas.iter().any(|c| c == "updated_seq") {
            nombres.push("updated_seq".into());
            valores.push(Some(fila.updated_seq.to_string()));
        }
        let existe: Option<i64> =
            sqlx::query_scalar(&format!("SELECT 1 FROM {tabla} WHERE {clave} = ?"))
                .bind(&id)
                .fetch_optional(&mut *tx)
                .await?;
        // SQLite revisa los NOT NULL antes del conflicto: una fila existente se actualiza con UPDATE.
        let sql = if existe.is_some() {
            let cambios = nombres
                .iter()
                .skip(1)
                .map(|n| format!("{n} = ?"))
                .collect::<Vec<_>>()
                .join(", ");
            valores.rotate_left(1);
            format!("UPDATE {tabla} SET {cambios} WHERE {clave} = ?")
        } else {
            let lista = nombres.join(", ");
            let marcas = vec!["?"; nombres.len()].join(", ");
            format!("INSERT INTO {tabla} ({lista}) VALUES ({marcas})")
        };
        let mut consulta = sqlx::query(&sql);
        for valor in &valores {
            consulta = consulta.bind(valor.clone());
        }
        // DUDA: HE-15-HU03 una fila que no cumple el esquema local (por ejemplo, sin un campo obligatorio) no se
        // aplica; las demás de la página sí.
        if consulta.execute(&mut *tx).await.is_ok() {
            tocadas.push((tipo.clone(), id, false));
        }
    }
    Ok(tocadas)
}

#[cfg(test)]
mod pruebas {
    use super::*;
    use crate::repositorios_y_archivos_locales::encolar_cambio;
    use crate::tipos::{SyncChangeResult, SyncChangeStatus};
    use std::sync::Mutex;

    const USUARIO: &str = "00000000-0000-4000-8000-000000000001";
    const TARJETA: &str = "00000000-0000-4000-8000-0000000000aa";
    /// 14/11/2026 14:25:00 UTC.
    const AHORA: i64 = 1_794_666_300_000;

    fn bloquear<F: Future>(f: F) -> F::Output {
        tauri::async_runtime::block_on(f)
    }

    /// Doble de la nube: responde `applied` a todo (o lo indicado en `respuestas`), falla como se le indique y
    /// guarda lo recibido.
    #[derive(Default)]
    struct NubeDePrueba {
        falla: Option<FallaDeAuth>,
        recibidos: Mutex<Vec<SyncPushParams>>,
        respuestas: Mutex<Vec<SyncChangeResult>>,
        paginas: Mutex<Vec<SyncPullResult>>,
        hora: Option<i64>,
        catalogo: Mutex<Option<CatalogPullResultVariant2>>,
        versiones_pedidas: Mutex<Vec<i64>>,
    }

    impl NubeDeSincronizacion for NubeDePrueba {
        async fn sync_push(
            &self,
            _token: &str,
            params: &SyncPushParams,
        ) -> Result<SyncPushResult, FallaDeAuth> {
            self.recibidos.lock().unwrap().push(params.clone());
            if let Some(falla) = &self.falla {
                return Err(falla.clone());
            }
            let propias = std::mem::take(&mut *self.respuestas.lock().unwrap());
            Ok(SyncPushResult {
                server_now: Instant(instante(AHORA + 500)),
                results: params
                    .p_changes
                    .iter()
                    .map(|c| {
                        propias
                            .iter()
                            .find(|r| r.change_id == c.change_id)
                            .cloned()
                            .unwrap_or(SyncChangeResult {
                                change_id: c.change_id,
                                status: SyncChangeStatus::Applied,
                                conflict: false,
                                reason: None,
                                row: None,
                            })
                    })
                    .collect(),
                max_seq: 1,
            })
        }

        async fn sync_pull(
            &self,
            _token: &str,
            params: &SyncPullParams,
        ) -> Result<SyncPullResult, FallaDeAuth> {
            if let Some(falla) = &self.falla {
                return Err(falla.clone());
            }
            let mut paginas = self.paginas.lock().unwrap();
            Ok(if paginas.is_empty() {
                SyncPullResult {
                    server_now: Instant(instante(AHORA)),
                    rows: Vec::new(),
                    next_seq: params.p_since_seq,
                    has_more: false,
                }
            } else {
                paginas.remove(0)
            })
        }

        async fn server_time(&self, _token: &str) -> Result<Instant, FallaDeAuth> {
            self.hora
                .map(|h| Instant(instante(h)))
                .ok_or(FallaDeAuth::SinRespuesta)
        }

        async fn catalog_pull(
            &self,
            _token: &str,
            params: &CatalogPullParams,
        ) -> Result<Option<CatalogPullResultVariant2>, FallaDeAuth> {
            self.versiones_pedidas
                .lock()
                .unwrap()
                .push(params.p_known_version);
            if let Some(falla) = &self.falla {
                return Err(falla.clone());
            }
            Ok(self
                .catalogo
                .lock()
                .unwrap()
                .clone()
                .filter(|c| c.version != params.p_known_version))
        }
    }

    fn base_con_cambio(guardado_ms: i64) -> BaseLocal {
        let base = BaseLocal::en_memoria();
        bloquear(async {
            let mut c = base.pool().await.unwrap().acquire().await.unwrap();
            encolar_cambio(
                &mut c,
                "card",
                TARJETA,
                "upsert",
                &serde_json::json!({ "title": { "value": "Informe", "modified_at": instante(guardado_ms) } }),
                &instante(guardado_ms),
            )
            .await
            .unwrap();
        });
        base
    }

    const SESION: Credenciales<'static> = Credenciales {
        user_id: USUARIO,
        token: "jwt",
    };

    fn ciclo(base: &BaseLocal, nube: &NubeDePrueba, ahora: i64) -> bool {
        bloquear(enviar(base, nube, &SESION, true, false, ahora))
            .unwrap()
            .llamo
    }

    fn sin_conexion(base: &BaseLocal, nube: &NubeDePrueba, ahora: i64) -> bool {
        bloquear(enviar(base, nube, &SESION, false, false, ahora))
            .unwrap()
            .llamo
    }

    /// Al recuperar la conexión: envía de inmediato (forzado).
    fn al_reconectar(base: &BaseLocal, nube: &NubeDePrueba, ahora: i64) -> Ciclo {
        bloquear(enviar(base, nube, &SESION, true, true, ahora)).unwrap()
    }

    fn encolar(base: &BaseLocal, tipo: &str, id: &str, ahora: i64) {
        bloquear(async {
            let mut c = base.pool().await.unwrap().acquire().await.unwrap();
            encolar_cambio(
                &mut c,
                tipo,
                id,
                "upsert",
                &serde_json::json!({ "title": { "value": "T", "modified_at": instante(ahora) } }),
                &instante(ahora),
            )
            .await
            .unwrap();
        });
    }

    #[test]
    fn ca_he_15_hu01_ca01() {
        // HE-15-HU01-CA01 · Al guardar una tarjeta, el cambio llega a la nube sin elegir una opción (ET01) a los
        // 2 s, dentro de los 10 s (ET02), y el indicador queda «Sincronizado» (ET03).
        let base = base_con_cambio(AHORA - 1_000);
        let nube = NubeDePrueba::default();
        assert!(!ciclo(&base, &nube, AHORA), "antes de 2 s no se envía");
        assert!(ciclo(&base, &nube, AHORA + 1_000));
        let enviados = nube.recibidos.lock().unwrap();
        let cambio = &enviados[0].p_changes[0];
        assert_eq!(cambio.entity_id.0, TARJETA);
        assert_eq!(cambio.fields["title"].value, "Informe");
        let estado = bloquear(estado(&base)).unwrap();
        assert_eq!(estado.status, SyncState::Synced);
        assert_eq!(estado.pending_count, 0);
        assert_eq!(estado.last_sync_at, Some(Instant(instante(AHORA + 500))));
    }

    #[test]
    fn ca_he_15_hu01_ca02() {
        // HE-15-HU01-CA02 · La personalización viaja por la misma cola: una preferencia se envía igual.
        let base = BaseLocal::en_memoria();
        bloquear(async {
            let mut c = base.pool().await.unwrap().acquire().await.unwrap();
            encolar_cambio(
                &mut c,
                "user_preference",
                USUARIO,
                "upsert",
                &serde_json::json!({ "applied_theme_id": { "value": null, "modified_at": instante(AHORA - 5_000) } }),
                &instante(AHORA - 5_000),
            )
            .await
            .unwrap();
        });
        let nube = NubeDePrueba::default();
        assert!(ciclo(&base, &nube, AHORA));
        assert_eq!(bloquear(estado(&base)).unwrap().status, SyncState::Synced);
        assert_eq!(bloquear(estado(&base)).unwrap().pending_count, 0);
    }

    #[test]
    fn ca_he_15_hu01_ca03() {
        // HE-15-HU01-CA03 · La nube no responde: el cambio se conserva (ET04), el indicador muestra el error (ET05)
        // y se reintenta cada minuto, no antes.
        let base = base_con_cambio(AHORA - 5_000);
        let nube = NubeDePrueba {
            falla: Some(FallaDeAuth::SinRespuesta),
            ..Default::default()
        };
        assert!(ciclo(&base, &nube, AHORA));
        let e = bloquear(estado(&base)).unwrap();
        assert_eq!(e.status, SyncState::Error);
        assert_eq!(e.pending_count, 1);
        assert!(
            !ciclo(&base, &nube, AHORA + 59_000),
            "antes del minuto no reintenta"
        );
        assert!(ciclo(&base, &nube, AHORA + 60_000));
        assert_eq!(nube.recibidos.lock().unwrap().len(), 2);
        // Cuando la nube vuelve a responder, se envía y queda sincronizado.
        let sana = NubeDePrueba::default();
        assert!(ciclo(&base, &sana, AHORA + 120_000));
        assert_eq!(bloquear(estado(&base)).unwrap().status, SyncState::Synced);
        assert_eq!(bloquear(estado(&base)).unwrap().pending_count, 0);
    }

    #[test]
    fn ca_he_15_hu02_ca01() {
        // HE-15-HU02-CA01 · Al perder la conexión, el indicador muestra «Sin conexión» (ET04) sin llamar a la nube.
        let base = base_con_cambio(AHORA - 5_000);
        let nube = NubeDePrueba::default();
        assert!(!sin_conexion(&base, &nube, AHORA));
        assert!(nube.recibidos.lock().unwrap().is_empty());
        assert_eq!(bloquear(estado(&base)).unwrap().status, SyncState::Offline);
    }

    #[test]
    fn ca_he_15_hu02_ca02() {
        // HE-15-HU02-CA02 · Offline, los cambios se aplican en el computador y quedan pendientes (ET03, ET06):
        // tres tarjetas y una preferencia son 4 cambios pendientes.
        let base = BaseLocal::en_memoria();
        let nube = NubeDePrueba::default();
        sin_conexion(&base, &nube, AHORA);
        for (i, id) in [
            "00000000-0000-4000-8000-0000000000a1",
            "00000000-0000-4000-8000-0000000000a2",
            "00000000-0000-4000-8000-0000000000a3",
        ]
        .iter()
        .enumerate()
        {
            encolar(&base, "card", id, AHORA + i as i64);
        }
        encolar(&base, "user_preference", USUARIO, AHORA + 5);
        sin_conexion(&base, &nube, AHORA + 10_000);
        let e = bloquear(estado(&base)).unwrap();
        assert_eq!((e.status, e.pending_count), (SyncState::Offline, 4));
        // Al volver la conexión, deja de estar «Sin conexión» y se envían.
        assert!(ciclo(&base, &nube, AHORA + 20_000));
        let e = bloquear(estado(&base)).unwrap();
        assert_eq!((e.status, e.pending_count), (SyncState::Synced, 0));
    }

    #[test]
    fn ca_he_15_hu02_ca03() {
        // HE-15-HU02-CA03 · Offline, crear una tarjeta deja 1 cambio pendiente.
        let base = BaseLocal::en_memoria();
        let nube = NubeDePrueba::default();
        encolar(&base, "card", TARJETA, AHORA);
        sin_conexion(&base, &nube, AHORA + 5_000);
        let e = bloquear(estado(&base)).unwrap();
        assert_eq!((e.status, e.pending_count), (SyncState::Offline, 1));
    }

    // HE-15-HU03: una cuenta con la semilla (perfil y columnas) para aplicar tarjetas.
    use crate::servicio_del_planificador::pruebas::{POR_HACER, con_semilla};

    const MARCA: &str = "2026-11-14T10:00:00.000Z";

    fn con_tarjeta() -> crate::servicio_del_planificador::ServicioDelPlanificador<
        crate::servicio_del_planificador::pruebas::CalendarioDePrueba,
    > {
        let servicio = con_semilla();
        bloquear(async {
            sqlx::query(
                "INSERT INTO card (id, user_id, created_at, type, title, due_date, column_id, position)                  VALUES (?, ?, ?, 'task', 'Informe', '2026-11-20', ?, 1024)",
            )
            .bind(TARJETA)
            .bind(USUARIO)
            .bind(MARCA)
            .bind(POR_HACER)
            .execute(servicio.base().pool().await.unwrap())
            .await
            .unwrap();
        });
        servicio
    }

    #[test]
    fn redescarga_una_sola_vez_tras_corregir_los_booleanos() {
        // Una base que ya sincronizó antes de P23 pasó las filas con booleanos sin aplicarlas: el cursor vuelve a
        // 0 una sola vez para traerlas.
        let base = BaseLocal::en_memoria();
        let cursor = || -> i64 {
            bloquear(async {
                sqlx::query_scalar("SELECT last_pulled_seq FROM sync_state WHERE id = 1")
                    .fetch_one(base.pool().await.unwrap())
                    .await
                    .unwrap()
            })
        };
        bloquear(async {
            let pool = base.pool().await.unwrap();
            sqlx::query("INSERT INTO sync_state (id, user_id, device_id, last_pulled_seq) VALUES (1, ?, '00000000-0000-4000-8000-0000000000d1', 30)")
                .bind(USUARIO)
                .execute(pool)
                .await
                .unwrap();
            preparar(&base, USUARIO).await.unwrap();
        });
        assert_eq!(cursor(), 0);
        bloquear(async {
            sqlx::query("UPDATE sync_state SET last_pulled_seq = 58 WHERE id = 1")
                .execute(base.pool().await.unwrap())
                .await
                .unwrap();
            preparar(&base, USUARIO).await.unwrap();
        });
        assert_eq!(cursor(), 58);
    }

    #[test]
    fn descarga_aplica_los_booleanos_como_0_y_1() {
        // HE-15-HU03-ET06: el computador descarga el resultado final. Los widgets por defecto llegan con
        // `is_default: true` y su posición con `is_active: true`; antes se descartaban en silencio.
        let base = BaseLocal::en_memoria();
        let fila = |tipo: &str, id: &str, campos: serde_json::Value, seq: i64| -> SyncRow {
            serde_json::from_value(serde_json::json!({
                "entity_kind": tipo,
                "entity_id": id,
                "fields": campos,
                "field_mods": {},
                "deleted_at": serde_json::Value::Null,
                "updated_seq": seq,
            }))
            .unwrap()
        };
        let creado = "2026-11-14T12:00:00.000Z";
        let widget = "00000000-0000-4000-8000-0000000000c1";
        let filas = vec![
            fila(
                "profile",
                USUARIO,
                serde_json::json!({ "alias": "Ana", "auth_provider": "email", "created_at": creado }),
                1,
            ),
            fila(
                "widget",
                widget,
                serde_json::json!({ "type": "kanban", "is_default": true, "created_at": creado }),
                2,
            ),
        ];
        let guardado: Option<i64> = bloquear(async {
            let pool = base.pool().await.unwrap();
            let mut tx = pool.begin().await.unwrap();
            let tocadas = aplicar_filas(&mut tx, &filas, USUARIO).await.unwrap();
            tx.commit().await.unwrap();
            assert_eq!(tocadas.len(), 2);
            sqlx::query_scalar("SELECT is_default FROM widget WHERE id = ?")
                .bind(widget)
                .fetch_optional(pool)
                .await
                .unwrap()
        });
        assert_eq!(guardado, Some(1));
        assert_eq!(valor_sql(&serde_json::json!(false)).as_deref(), Some("0"));
    }

    fn fila_de_tarjeta(campos: serde_json::Value, borrada: bool) -> SyncRow {
        serde_json::from_value(serde_json::json!({
            "entity_kind": "card",
            "entity_id": TARJETA,
            "fields": campos,
            "field_mods": { "title": "2026-11-14T12:00:00.000Z" },
            "deleted_at": if borrada { serde_json::json!("2026-11-14T12:00:00.000Z") } else { serde_json::Value::Null },
            "updated_seq": 9,
        }))
        .unwrap()
    }

    fn resultado(
        estado: SyncChangeStatus,
        conflicto: bool,
        fila: Option<SyncRow>,
    ) -> SyncChangeResult {
        SyncChangeResult {
            change_id: 1,
            status: estado,
            conflict: conflicto,
            reason: None,
            row: fila,
        }
    }

    fn titulo(base: &BaseLocal) -> Option<String> {
        bloquear(async {
            sqlx::query_scalar("SELECT title FROM card WHERE id = ?")
                .bind(TARJETA)
                .fetch_optional(base.pool().await.unwrap())
                .await
                .unwrap()
        })
    }

    #[test]
    fn ca_he_15_hu03_ca01() {
        // HE-15-HU03-CA01 · Al reconectarse se envía de inmediato (ET06), sin esperar el minuto del reintento, se
        // descarga el resultado final y el indicador termina «Sincronizado» (ET08).
        let base = BaseLocal::en_memoria();
        let nube = NubeDePrueba::default();
        encolar(&base, "card", TARJETA, AHORA);
        encolar(&base, "card", "00000000-0000-4000-8000-0000000000ab", AHORA);
        sin_conexion(&base, &nube, AHORA + 1_000);
        let envio = al_reconectar(&base, &nube, AHORA + 1_500);
        assert!(envio.llamo);
        assert_eq!(envio.cantidad, 2);
        let descarga = bloquear(descargar(&base, &nube, &SESION)).unwrap();
        assert!(descarga.llamo);
        let e = bloquear(estado(&base)).unwrap();
        assert_eq!((e.status, e.pending_count), (SyncState::Synced, 0));
    }

    #[test]
    fn ca_he_15_hu03_ca02() {
        // HE-15-HU03-CA02 · Mismo campo en dos computadores: la nube conserva la versión más reciente
        // (`superseded`, `conflict`) y este computador la adopta (ET01, ET04); cuenta como conflicto de tarjeta.
        let servicio = con_tarjeta();
        let base = servicio.base();
        encolar(base, "card", TARJETA, AHORA - 5_000);
        let nube = NubeDePrueba::default();
        nube.respuestas.lock().unwrap().push(resultado(
            SyncChangeStatus::Superseded,
            true,
            Some(fila_de_tarjeta(
                serde_json::json!({ "title": "Informe final" }),
                false,
            )),
        ));
        let envio = al_reconectar(base, &nube, AHORA);
        assert_eq!(envio.conflictos_de_tarjetas, 1);
        assert_eq!(titulo(base).as_deref(), Some("Informe final"));
        assert_eq!(bloquear(estado(base)).unwrap().pending_count, 0);
    }

    #[test]
    fn ca_he_15_hu03_ca03() {
        // HE-15-HU03-CA03 · Se pierde la conexión durante el envío: los cambios siguen pendientes (ET07) y se
        // envían en la siguiente reconexión, sin perder información.
        let base = base_con_cambio(AHORA - 5_000);
        let caida = NubeDePrueba {
            falla: Some(FallaDeAuth::SinConexion),
            ..Default::default()
        };
        assert!(al_reconectar(&base, &caida, AHORA).llamo);
        let e = bloquear(estado(&base)).unwrap();
        assert_eq!((e.status, e.pending_count), (SyncState::Offline, 1));
        let sana = NubeDePrueba::default();
        assert_eq!(al_reconectar(&base, &sana, AHORA + 1_000).cantidad, 1);
        assert_eq!(
            sana.recibidos.lock().unwrap()[0].p_changes[0].fields["title"].value,
            "Informe"
        );
        assert_eq!(bloquear(estado(&base)).unwrap().pending_count, 0);
    }

    #[test]
    fn ca_he_15_hu03_ca04() {
        // HE-15-HU03-CA04 · Campos distintos: la nube combina (`merged` sin `conflict`, ET02) y este computador
        // adopta la fila con ambos cambios, sin contarlo como conflicto.
        let servicio = con_tarjeta();
        let base = servicio.base();
        encolar(base, "card", TARJETA, AHORA - 5_000);
        let nube = NubeDePrueba::default();
        nube.respuestas.lock().unwrap().push(resultado(
            SyncChangeStatus::Merged,
            false,
            Some(fila_de_tarjeta(
                serde_json::json!({ "title": "T", "description": "Con anexos" }),
                false,
            )),
        ));
        let envio = al_reconectar(base, &nube, AHORA);
        assert_eq!(envio.conflictos_de_tarjetas, 0);
        let descripcion: Option<String> = bloquear(async {
            sqlx::query_scalar("SELECT description FROM card WHERE id = ?")
                .bind(TARJETA)
                .fetch_one(base.pool().await.unwrap())
                .await
                .unwrap()
        });
        assert_eq!(descripcion.as_deref(), Some("Con anexos"));
        assert_eq!(titulo(base).as_deref(), Some("T"));
    }

    #[test]
    fn ca_he_15_hu03_ca05() {
        // HE-15-HU03-CA05 · La eliminación es más reciente: la nube responde `deleted` con `conflict` y la tarjeta
        // se elimina en este computador (ET03).
        let servicio = con_tarjeta();
        let base = servicio.base();
        encolar(base, "card", TARJETA, AHORA - 5_000);
        let nube = NubeDePrueba::default();
        nube.respuestas.lock().unwrap().push(resultado(
            SyncChangeStatus::Deleted,
            true,
            Some(fila_de_tarjeta(serde_json::json!({}), true)),
        ));
        let envio = al_reconectar(base, &nube, AHORA);
        assert_eq!(envio.conflictos_de_tarjetas, 1);
        assert_eq!(titulo(base), None);
        assert_eq!(
            envio.cambiadas,
            vec![("card".to_string(), TARJETA.to_string(), true)]
        );
    }

    #[test]
    fn ca_he_15_hu03_ca06() {
        // HE-15-HU03-CA06 · La modificación es más reciente que la eliminación hecha aquí: la nube conserva la
        // tarjeta (`superseded`, `conflict`) y este computador la vuelve a tener con esa modificación.
        let servicio = con_tarjeta();
        let base = servicio.base();
        bloquear(async {
            let pool = base.pool().await.unwrap();
            sqlx::query("DELETE FROM card WHERE id = ?")
                .bind(TARJETA)
                .execute(pool)
                .await
                .unwrap();
            let mut c = pool.acquire().await.unwrap();
            encolar_cambio(
                &mut c,
                "card",
                TARJETA,
                "delete",
                &serde_json::json!({}),
                &instante(AHORA - 5_000),
            )
            .await
            .unwrap();
        });
        let nube = NubeDePrueba::default();
        nube.respuestas.lock().unwrap().push(resultado(
            SyncChangeStatus::Superseded,
            true,
            Some(fila_de_tarjeta(
                serde_json::json!({
                    "title": "Informe revisado", "type": "task", "due_date": "2026-11-20",
                    "column_id": POR_HACER, "position": 1024, "created_at": MARCA
                }),
                false,
            )),
        ));
        let envio = al_reconectar(base, &nube, AHORA);
        assert_eq!(envio.conflictos_de_tarjetas, 1);
        assert_eq!(titulo(base).as_deref(), Some("Informe revisado"));
    }

    #[test]
    fn ca_he_15_hu03_ca07() {
        // HE-15-HU03-CA07 · Se envían en el orden en que se hicieron; la misma tarjeta editada dos veces viaja con
        // su último valor, de modo que la nube queda con el resultado del último.
        let base = BaseLocal::en_memoria();
        let otra = "00000000-0000-4000-8000-0000000000ab";
        encolar(&base, "card", TARJETA, AHORA);
        encolar(&base, "card", otra, AHORA + 1);
        bloquear(async {
            let mut c = base.pool().await.unwrap().acquire().await.unwrap();
            encolar_cambio(
                &mut c,
                "card",
                TARJETA,
                "upsert",
                &serde_json::json!({ "title": { "value": "Último", "modified_at": instante(AHORA + 2) } }),
                &instante(AHORA + 2),
            )
            .await
            .unwrap();
        });
        let nube = NubeDePrueba::default();
        al_reconectar(&base, &nube, AHORA + 3);
        let enviados = nube.recibidos.lock().unwrap();
        let cambios = &enviados[0].p_changes;
        let ids: Vec<i64> = cambios.iter().map(|c| c.change_id).collect();
        assert!(ids.windows(2).all(|par| par[0] < par[1]));
        assert_eq!(cambios[0].entity_id.0, TARJETA);
        assert_eq!(cambios[0].fields["title"].value, "Último");
        assert_eq!(cambios[1].entity_id.0, otra);
    }

    #[test]
    fn ca_he_15_hu03_ca08() {
        // HE-15-HU03-CA08 · Reloj del computador 3 h atrasado: al reconectarse se mide la diferencia con el
        // servidor (ET05) y `sync_push` la recibe para corregir las horas antes de comparar.
        let base = base_con_cambio(AHORA - 5_000);
        let tres_horas = 3 * 3_600_000;
        let nube = NubeDePrueba {
            hora: Some(AHORA + tres_horas),
            ..Default::default()
        };
        bloquear(calibrar(&base, &nube, &SESION, AHORA)).unwrap();
        al_reconectar(&base, &nube, AHORA);
        assert_eq!(
            nube.recibidos.lock().unwrap()[0].p_clock_offset_ms,
            tres_horas
        );
    }

    #[test]
    fn descargar_aplica_sin_pisar_un_cambio_pendiente_mas_reciente() {
        // datos.md, Modelo · 6: un campo con cambio pendiente más reciente que el descargado no se sobrescribe;
        // los demás campos sí se aplican, y el cursor avanza.
        let servicio = con_tarjeta();
        let base = servicio.base();
        bloquear(async {
            let mut c = base.pool().await.unwrap().acquire().await.unwrap();
            encolar_cambio(
                &mut c,
                "card",
                TARJETA,
                "upsert",
                &serde_json::json!({ "title": { "value": "Mío", "modified_at": "2026-11-14T13:00:00.000Z" } }),
                "2026-11-14T13:00:00.000Z",
            )
            .await
            .unwrap();
        });
        let nube = NubeDePrueba::default();
        nube.paginas.lock().unwrap().push(SyncPullResult {
            server_now: Instant(instante(AHORA)),
            rows: vec![fila_de_tarjeta(
                serde_json::json!({ "title": "De otro", "description": "Nueva" }),
                false,
            )],
            next_seq: 9,
            has_more: false,
        });
        let r = bloquear(descargar(base, &nube, &SESION)).unwrap();
        assert_eq!(r.cantidad, 1);
        assert_eq!(titulo(base).as_deref(), Some("Informe"));
        let (descripcion, cursor): (Option<String>, i64) = bloquear(async {
            let pool = base.pool().await.unwrap();
            (
                sqlx::query_scalar("SELECT description FROM card WHERE id = ?")
                    .bind(TARJETA)
                    .fetch_one(pool)
                    .await
                    .unwrap(),
                sqlx::query_scalar("SELECT last_pulled_seq FROM sync_state WHERE id = 1")
                    .fetch_one(pool)
                    .await
                    .unwrap(),
            )
        });
        assert_eq!((descripcion.as_deref(), cursor), (Some("Nueva"), 9));
    }

    #[test]
    fn ca_he_15_hu04_ca02() {
        // HE-15-HU04-CA02 (ET14) · Al iniciar sesión en otro computador, `sync_pull` trae y aplica, en orden padre →
        // hijo, las tarjetas, las etiquetas, las columnas, los temas, el tema aplicado y los widgets con su
        // distribución (ET02): la misma descarga que prueban HE-15-HU01 y HU03 para cada fila.
        for tipo in [
            "card",
            "label",
            "kanban_column",
            "theme",
            "applied_theme",
            "widget",
            "theme_widget",
        ] {
            assert!(ORDEN.contains(&tipo), "{tipo}");
        }
        let posicion = |t: &str| ORDEN.iter().position(|o| *o == t).unwrap();
        assert!(posicion("theme") < posicion("applied_theme"));
        assert!(posicion("widget") < posicion("theme_widget"));
    }

    // ---------------------------------------------------------------- RPC-04 catalog_pull (HE-02-HU01-CA01)

    fn catalogo(version: i64, con_minimal: bool) -> CatalogPullResultVariant2 {
        use crate::tipos::{CatalogFontRow, CatalogTemplateRow, Hex};
        let plantilla =
            |id: &str, nombre: &str, por_defecto: bool, orden: i64| CatalogTemplateRow {
                id: id.into(),
                name: nombre.into(),
                thumbnail_path: format!("templates/{id}/thumbnail.png"),
                bundle_path: format!("templates/{id}/"),
                default_background_path: format!("templates/{id}/background.jpg"),
                default_color_primary: Hex("#96B2B2".into()),
                default_color_secondary: Hex("#829890".into()),
                default_color_text: Hex("#14201C".into()),
                default_font_id: "nunito".into(),
                is_default: por_defecto,
                sort_order: orden,
                is_active: true,
                bundle_version: 1,
            };
        let mut templates = vec![plantilla("default", "Windgets", true, 1)];
        if con_minimal {
            templates.push(plantilla("minimal", "Minimal", false, 2));
        }
        CatalogPullResultVariant2 {
            version,
            unchanged: serde_json::Value::Bool(false),
            templates,
            fonts: vec![CatalogFontRow {
                id: "nunito".into(),
                family_name: "Nunito".into(),
                display_name: "Nunito".into(),
                file_path: "fonts/nunito.woff2".into(),
                license: "OFL-1.1".into(),
                sort_order: 1,
                is_active: true,
            }],
            palettes: Vec::new(),
            images: Vec::new(),
            animations: Vec::new(),
            colors: Vec::new(),
        }
    }

    fn bajar_catalogo(base: &BaseLocal, nube: &NubeDePrueba) -> Vec<crate::tipos::CatalogKind> {
        bloquear(catalogo::descargar_catalogo(
            base,
            nube,
            &Credenciales {
                user_id: USUARIO,
                token: "t",
            },
            AHORA,
        ))
        .unwrap()
    }

    fn plantillas_activas(base: &BaseLocal) -> Vec<(String, i64)> {
        bloquear(async {
            sqlx::query_as(
                "SELECT id, is_default FROM catalog_template WHERE is_active = 1 ORDER BY sort_order",
            )
            .fetch_all(base.pool().await.unwrap())
            .await
            .unwrap()
        })
    }

    fn version_local(base: &BaseLocal) -> i64 {
        bloquear(async {
            sqlx::query_scalar("SELECT catalog_version FROM sync_state WHERE id = 1")
                .fetch_one(base.pool().await.unwrap())
                .await
                .unwrap()
        })
    }

    #[test]
    fn catalog_pull_guarda_los_catalogos_y_su_version() {
        // HE-02-HU01-CA01, ET02: la plantilla por defecto llega a la caché local con su fuente.
        let base = BaseLocal::en_memoria();
        let nube = NubeDePrueba::default();
        *nube.catalogo.lock().unwrap() = Some(catalogo(3, true));
        let clases = bajar_catalogo(&base, &nube);
        assert_eq!(clases.len(), 6);
        assert_eq!(
            plantillas_activas(&base),
            [("default".to_string(), 1), ("minimal".to_string(), 0)]
        );
        assert_eq!(version_local(&base), 3);
        assert_eq!(*nube.versiones_pedidas.lock().unwrap(), [0]);
    }

    #[test]
    fn catalog_pull_con_la_misma_version_no_cambia_nada() {
        let base = BaseLocal::en_memoria();
        let nube = NubeDePrueba::default();
        *nube.catalogo.lock().unwrap() = Some(catalogo(3, true));
        bajar_catalogo(&base, &nube);
        assert!(bajar_catalogo(&base, &nube).is_empty());
        assert_eq!(*nube.versiones_pedidas.lock().unwrap(), [0, 3]);
    }

    #[test]
    fn catalog_pull_sin_conexion_conserva_la_cache() {
        let base = BaseLocal::en_memoria();
        let nube = NubeDePrueba::default();
        *nube.catalogo.lock().unwrap() = Some(catalogo(3, false));
        bajar_catalogo(&base, &nube);
        let sin_red = NubeDePrueba {
            falla: Some(FallaDeAuth::SinConexion),
            ..NubeDePrueba::default()
        };
        assert!(bajar_catalogo(&base, &sin_red).is_empty());
        assert_eq!(plantillas_activas(&base).len(), 1);
        assert_eq!(version_local(&base), 3);
    }

    #[test]
    fn catalog_pull_deja_inactiva_la_fila_que_ya_no_llega() {
        // Los temas pueden referenciar la plantilla retirada: no se borra.
        let base = BaseLocal::en_memoria();
        let nube = NubeDePrueba::default();
        *nube.catalogo.lock().unwrap() = Some(catalogo(3, true));
        bajar_catalogo(&base, &nube);
        *nube.catalogo.lock().unwrap() = Some(catalogo(4, false));
        bajar_catalogo(&base, &nube);
        assert_eq!(plantillas_activas(&base), [("default".to_string(), 1)]);
        let total: i64 = bloquear(async {
            sqlx::query_scalar("SELECT COUNT(*) FROM catalog_template")
                .fetch_one(base.pool().await.unwrap())
                .await
                .unwrap()
        });
        assert_eq!(total, 2);
    }

    #[test]
    fn catalog_pull_lee_las_dos_formas_de_respuesta() {
        assert_eq!(
            catalogo::leer_respuesta(r#"{"version":3,"unchanged":true}"#),
            Ok(None)
        );
        let completa = serde_json::to_string(&catalogo(4, false)).unwrap();
        let leida = catalogo::leer_respuesta(&completa).unwrap().unwrap();
        assert_eq!((leida.version, leida.templates.len()), (4, 1));
        assert_eq!(
            catalogo::leer_respuesta("no es json"),
            Err(FallaDeAuth::SinRespuesta)
        );
    }
}
