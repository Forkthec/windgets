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
use crate::tipos::{
    Instant, SyncChange, SyncPushParams, SyncPushResult, SyncState, SyncStatus, Uuid,
};

/// Los cambios se envían 2 s después de guardar (datos.md, Modelo · 6; D-030).
pub const ESPERA_TRAS_GUARDAR_MS: i64 = 2_000;
/// Sin respuesta de la nube, se reintenta cada minuto (HE-15-HU01-ET04).
pub const REINTENTO_MS: i64 = 60_000;
/// `sync_push` acepta hasta 200 cambios por llamada (RPC-02, `too_many_changes`).
pub const CAMBIOS_POR_ENVIO: i64 = 200;

/// RPC-02 `sync_push` de Supabase con el JWT de la sesión.
pub trait NubeDeSincronizacion: Send + Sync {
    fn sync_push(
        &self,
        token: &str,
        params: &SyncPushParams,
    ) -> impl Future<Output = Result<SyncPushResult, FallaDeAuth>> + Send;
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
    Ok(())
}

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
/// fallido en el último minuto (ET04). Devuelve `true` si llamó a la nube.
pub async fn enviar<N: NubeDeSincronizacion>(
    base: &BaseLocal,
    nube: &N,
    user_id: &str,
    token: &str,
    ahora_ms: i64,
) -> Result<bool, sqlx::Error> {
    preparar(base, user_id).await?;
    let pool = base.pool().await?;
    let reintento = instante(ahora_ms - REINTENTO_MS);
    let en_espera: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM pending_change WHERE last_attempt_at IS NOT NULL AND last_attempt_at > ?",
    )
    .bind(&reintento)
    .fetch_one(pool)
    .await?;
    let listos: i64 =
        sqlx::query_scalar("SELECT count(*) FROM pending_change WHERE modified_at <= ?")
            .bind(instante(ahora_ms - ESPERA_TRAS_GUARDAR_MS))
            .fetch_one(pool)
            .await?;
    if en_espera > 0 || listos == 0 {
        return Ok(false);
    }

    let filas: Vec<(i64, String, String, String, String, String)> = sqlx::query_as(
        "SELECT id, entity_kind, entity_id, op, fields, modified_at FROM pending_change ORDER BY id LIMIT ?",
    )
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
    match nube.sync_push(token, &params).await {
        Ok(respuesta) => {
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
            let desfase = milisegundos(&respuesta.server_now.0)
                .map(|servidor| servidor - ahora_ms)
                .unwrap_or(desfase);
            sqlx::query(
                "UPDATE sync_state SET status = 'synced', last_sync_at = ?, last_error_code = NULL, \
                 clock_offset_ms = ?, clock_calibrated_at = ? WHERE id = 1",
            )
            .bind(&respuesta.server_now.0)
            .bind(desfase)
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
    Ok(true)
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

    /// Doble de la nube: responde `applied` a todo o falla como se le indique, y guarda lo recibido.
    #[derive(Default)]
    struct NubeDePrueba {
        falla: Option<FallaDeAuth>,
        recibidos: Mutex<Vec<SyncPushParams>>,
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
            Ok(SyncPushResult {
                server_now: Instant(instante(AHORA + 500)),
                results: params
                    .p_changes
                    .iter()
                    .map(|c| SyncChangeResult {
                        change_id: c.change_id,
                        status: SyncChangeStatus::Applied,
                        conflict: false,
                        reason: None,
                        row: None,
                    })
                    .collect(),
                max_seq: 1,
            })
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

    fn ciclo(base: &BaseLocal, nube: &NubeDePrueba, ahora: i64) -> bool {
        bloquear(enviar(base, nube, USUARIO, "jwt", ahora)).unwrap()
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
}
