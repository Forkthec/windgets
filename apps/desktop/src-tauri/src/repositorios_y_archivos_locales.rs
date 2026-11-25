//! Repositorios y archivos locales (arquitectura.md, vista 3a, Núcleo · servicios de negocio y datos locales).
//! Responsabilidad: «Acceso a las tablas locales, con cada escritura y su cambio pendiente en la misma
//! transacción, y a la caché de archivos con sha256.»
//!
//! Guarda la sesión (`%APPDATA%\Windgets\session.bin` cifrado con DPAPI del usuario actual; INT-11; D-192;
//! RNF-19: 0 tokens en texto plano) y abre la base local `%APPDATA%\Windgets\windgets.db` (SQLite en WAL,
//! arquitectura.md, vista 2a), creada con `sqlite_esquema.sql` la primera vez (convenciones.md, «Repositorio»).

use std::path::Path;
use std::str::FromStr;
use std::sync::Mutex;

use chrono::DateTime;
use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions};
use tokio::sync::OnceCell;

use crate::servicio_del_planificador::ETIQUETAS_MAX;

/// Esquema de la base local (copia de `docs/local/sqlite_esquema.sql`).
const ESQUEMA: &str = include_str!("../sqlite_esquema.sql");

/// Versión del esquema local (`PRAGMA user_version`, al final de `sqlite_esquema.sql`). Una base nueva nace con ella;
/// una que ya existía se lleva a ella con [`migrar`].
pub const VERSION_DEL_ESQUEMA: i64 = 10;

/// Una sentencia del esquema: el `CREATE TABLE` o los `CREATE … INDEX … ON` de una tabla, sacados de `ESQUEMA` para
/// no repetir su definición.
fn sentencias_de(tabla: &str) -> (Option<String>, Vec<String>) {
    let crear = format!("CREATE TABLE {tabla} (");
    let indice = format!(" ON {tabla} (");
    let mut tabla_sql = None;
    let mut indices = Vec::new();
    for sentencia in ESQUEMA.split(";\n") {
        // Sin las líneas de comentario que preceden a la sentencia.
        let limpia: String = sentencia
            .lines()
            .filter(|l| !l.trim_start().starts_with("--"))
            .collect::<Vec<_>>()
            .join("\n");
        let limpia = limpia.trim();
        if limpia.starts_with(&crear) {
            tabla_sql = Some(format!("{limpia};"));
        } else if limpia.starts_with("CREATE")
            && limpia.contains("INDEX")
            && limpia.contains(&indice)
        {
            indices.push(format!("{limpia};"));
        }
    }
    (tabla_sql, indices)
}

/// Migraciones locales de una base que ya existía (las de la nube van en `supabase/migrations/`; SQLite no cambia un
/// `CHECK` con `ALTER TABLE`, así que la tabla se reconstruye con su definición actual y se copian sus filas).
/// - 9 (0009, `rediseno_final_backend.md` §5.5): `widget.type` admite 'windi' y entra en `uq_widget_singleton`.
/// - 10 (0011, `docs/rediseno.md` RD-96): máximo 3 etiquetas por tarjeta.
async fn migrar(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let version: i64 = sqlx::query_scalar("PRAGMA user_version")
        .fetch_one(pool)
        .await?;
    if version >= VERSION_DEL_ESQUEMA {
        return Ok(());
    }
    if version < 9 {
        migrar_a_9(pool).await?;
    }
    migrar_a_10(pool).await
}

async fn migrar_a_9(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let (Some(tabla), indices) = sentencias_de("widget") else {
        return Ok(());
    };
    let nueva = tabla.replacen("CREATE TABLE widget (", "CREATE TABLE widget_nueva (", 1);
    // `foreign_keys` vale por conexión y debe apagarse fuera de la transacción.
    // `legacy_alter_table`: al renombrar no se revisan los disparadores de otras tablas que nombran `widget`
    // (`trg_carousel_parent`), que mientras tanto no existe.
    let mut guion =
        String::from("PRAGMA foreign_keys = OFF;\nPRAGMA legacy_alter_table = ON;\nBEGIN;\n");
    guion.push_str(&nueva);
    guion.push_str(
        "\nINSERT INTO widget_nueva SELECT * FROM widget;\nDROP TABLE widget;\n\
         ALTER TABLE widget_nueva RENAME TO widget;\n",
    );
    for indice in indices {
        guion.push_str(&indice);
        guion.push('\n');
    }
    guion.push_str(
        "CREATE TRIGGER trg_protect_default_widget BEFORE DELETE ON widget\n\
         WHEN OLD.is_default = 1 AND EXISTS (SELECT 1 FROM profile WHERE user_id = OLD.user_id)\n\
         BEGIN SELECT RAISE(ABORT, 'invalid_field'); END;\n",
    );
    guion.push_str(
        "PRAGMA user_version = 9;\nCOMMIT;\nPRAGMA legacy_alter_table = OFF;\nPRAGMA foreign_keys = ON;\n",
    );
    // `raw_sql` corre todo el guion en una sola conexión del pool.
    sqlx::raw_sql(&guion).execute(pool).await?;
    Ok(())
}

/// El disparador pasa al máximo nuevo y, de las asignaciones que sobren en una tarjeta ([`etiquetas_sobrantes`]),
/// se quitan solo las altas que siguen en la cola. Las que la nube ya tiene no se tocan: su información aquí puede
/// estar vieja (otro computador pudo quitar una que aún se ve) y borrar una perdería una etiqueta que la nube
/// conserva. Las recorta la nube (0012) y bajan como eliminadas; mientras tanto la tarjeta puede tener más.
async fn migrar_a_10(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    let desfase: i64 = sqlx::query_scalar("SELECT clock_offset_ms FROM sync_state WHERE id = 1")
        .fetch_optional(&mut *tx)
        .await?
        .unwrap_or(0);
    let tarjetas: Vec<String> = sqlx::query_scalar(&format!(
        "SELECT card_id FROM card_label GROUP BY card_id HAVING count(*) > {ETIQUETAS_MAX}"
    ))
    .fetch_all(&mut *tx)
    .await?;
    for tarjeta in &tarjetas {
        let asignaciones = asignaciones_de(&mut tx, tarjeta).await?;
        for id in etiquetas_sobrantes(asignaciones, desfase) {
            // Un alta ya enviada y aún sin descargar tiene `updated_seq = 0`, pero no está en la cola.
            let alta_pendiente: bool = sqlx::query_scalar(
                "SELECT EXISTS (SELECT 1 FROM card_label c JOIN pending_change p \
                   ON p.entity_kind = 'card_label' AND p.entity_id = c.id AND p.op = 'upsert' \
                 WHERE c.id = ? AND c.updated_seq = 0)",
            )
            .bind(&id)
            .fetch_one(&mut *tx)
            .await?;
            if alta_pendiente {
                quitar_asignacion_sobrante(&mut tx, &id).await?;
            }
        }
    }
    let disparador = format!(
        "CREATE TRIGGER trg_limit_card_labels BEFORE INSERT ON card_label \
         WHEN (SELECT count(*) FROM card_label WHERE card_id = NEW.card_id) >= {ETIQUETAS_MAX} \
         BEGIN SELECT RAISE(ABORT, 'limit_card_labels'); END"
    );
    for sentencia in [
        "DROP TRIGGER IF EXISTS trg_limit_card_labels",
        disparador.as_str(),
        "PRAGMA user_version = 10",
    ] {
        sqlx::query(sentencia).execute(&mut *tx).await?;
    }
    tx.commit().await
}

/// Una asignación local de etiqueta (`card_label`), con lo que decide cuáles sobran.
#[derive(Debug, Clone)]
pub struct Asignacion {
    pub id: String,
    pub created_at: String,
    pub updated_seq: i64,
}

/// RD-96, la regla de R7 (0011) y de `0012_recorte_etiquetas.sql`: de las asignaciones de una tarjeta quedan las
/// [`ETIQUETAS_MAX`] primeras por (`created_at`, `id`) en el reloj de la nube; devuelve los `id` de las demás. Una
/// asignación que la nube aún no confirma (`updated_seq = 0`) tiene la hora del computador: se le suma el desfase,
/// como hará `sync_push`.
pub fn etiquetas_sobrantes(mut asignaciones: Vec<Asignacion>, desfase_ms: i64) -> Vec<String> {
    asignaciones.sort_by_cached_key(|a| {
        let hora = DateTime::parse_from_rfc3339(&a.created_at).map_or(0, |d| d.timestamp_millis());
        let desfase = if a.updated_seq == 0 { desfase_ms } else { 0 };
        (hora + desfase, a.id.clone())
    });
    asignaciones
        .into_iter()
        .skip(ETIQUETAS_MAX)
        .map(|a| a.id)
        .collect()
}

/// Las asignaciones locales de una tarjeta.
pub async fn asignaciones_de(
    tx: &mut sqlx::SqliteConnection,
    card_id: &str,
) -> Result<Vec<Asignacion>, sqlx::Error> {
    let filas: Vec<(String, String, i64)> =
        sqlx::query_as("SELECT id, created_at, updated_seq FROM card_label WHERE card_id = ?")
            .bind(card_id)
            .fetch_all(tx)
            .await?;
    Ok(filas
        .into_iter()
        .map(|(id, created_at, updated_seq)| Asignacion {
            id,
            created_at,
            updated_seq,
        })
        .collect())
}

/// Quita de este computador una asignación sobrante y su alta pendiente. No encola una eliminación: la nube aplica
/// la misma regla.
pub async fn quitar_asignacion_sobrante(
    tx: &mut sqlx::SqliteConnection,
    id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM card_label WHERE id = ?")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    sqlx::query(
        "DELETE FROM pending_change \
         WHERE entity_kind = 'card_label' AND entity_id = ? AND op = 'upsert'",
    )
    .bind(id)
    .execute(tx)
    .await?;
    Ok(())
}

/// La base local del Núcleo. Se abre sin conectarse y aplica el esquema en el primer uso, para no bloquear el
/// arranque de la aplicación.
pub struct BaseLocal {
    pool: SqlitePool,
    preparada: OnceCell<()>,
}

impl BaseLocal {
    fn con_opciones(opciones: SqliteConnectOptions, conexiones: u32) -> Self {
        let pool = SqlitePoolOptions::new()
            .max_connections(conexiones)
            // Una base en memoria vive mientras viva una conexión: no se cierran por inactividad.
            .idle_timeout(None)
            .max_lifetime(None)
            .connect_lazy_with(
                opciones
                    .foreign_keys(true)
                    .journal_mode(SqliteJournalMode::Wal),
            );
        Self {
            pool,
            preparada: OnceCell::new(),
        }
    }

    /// `windgets.db` en la carpeta indicada; la crea si no existe.
    pub fn en_archivo(ruta: &Path) -> Self {
        Self::con_opciones(
            SqliteConnectOptions::new()
                .filename(ruta)
                .create_if_missing(true),
            4,
        )
    }

    /// Base en memoria con una sola conexión: las pruebas.
    pub fn en_memoria() -> Self {
        let opciones = SqliteConnectOptions::from_str("sqlite::memory:")
            .unwrap_or_else(|_| SqliteConnectOptions::new());
        Self::con_opciones(opciones, 1)
    }

    /// La base de la aplicación: `%APPDATA%\Windgets\windgets.db`; sin `APPDATA`, en memoria.
    pub fn de_la_aplicacion() -> Self {
        match std::env::var_os("APPDATA") {
            Some(appdata) => {
                let carpeta = Path::new(&appdata).join("Windgets");
                if std::fs::create_dir_all(&carpeta).is_err() {
                    return Self::en_memoria();
                }
                Self::en_archivo(&carpeta.join("windgets.db"))
            }
            None => Self::en_memoria(),
        }
    }

    /// El pool listo para usar, con el esquema aplicado si la base es nueva.
    pub async fn pool(&self) -> Result<&SqlitePool, sqlx::Error> {
        self.preparada
            .get_or_try_init(|| async {
                let tablas: i64 = sqlx::query_scalar(
                    "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'card'",
                )
                .fetch_one(&self.pool)
                .await?;
                if tablas == 0 {
                    sqlx::raw_sql(ESQUEMA).execute(&self.pool).await?;
                } else {
                    migrar(&self.pool).await?;
                }
                Ok::<(), sqlx::Error>(())
            })
            .await?;
        Ok(&self.pool)
    }

    /// Borra la base local de la cuenta al cerrar sesión (HE-16-HU03, D-190: «una sola base local; se borra al
    /// cerrar sesión»). Con la aplicación abierta el archivo no se puede quitar, así que se eliminan todas sus
    /// tablas, se vuelve a crear el esquema vacío y se compacta el archivo para que no queden datos en él. Queda
    /// igual que una base nueva: la próxima sesión la llena con la primera descarga.
    pub async fn borrar_todo(&self) -> Result<(), sqlx::Error> {
        let pool = self.pool().await?;
        let tablas: Vec<String> = sqlx::query_scalar(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
        )
        .fetch_all(pool)
        .await?;
        // Un solo guion en una sola conexión: `foreign_keys` vale por conexión y se apaga solo mientras se borra.
        let mut guion = String::from("PRAGMA foreign_keys = OFF;\n");
        for tabla in tablas {
            guion.push_str(&format!("DROP TABLE IF EXISTS \"{tabla}\";\n"));
        }
        guion.push_str(ESQUEMA);
        guion.push_str("\nPRAGMA foreign_keys = ON;\n");
        sqlx::raw_sql(&guion).execute(pool).await?;
        sqlx::raw_sql("VACUUM").execute(pool).await?;
        Ok(())
    }
}

/// Borra la carpeta de archivos del usuario (`%APPDATA%\Windgets\files`: imágenes propias y caché de catálogos,
/// `local_file`) al cerrar sesión (IPC-AUTH-14). Los recursos que trae el instalador no viven aquí.
pub fn borrar_archivos(carpeta: &Path) -> bool {
    match std::fs::remove_dir_all(carpeta) {
        Ok(()) => true,
        Err(e) => e.kind() == std::io::ErrorKind::NotFound,
    }
}

/// Encola un cambio en `pending_change` dentro de la transacción de la escritura (arquitectura.md,
/// OutboxRepository: «misma transacción»). Un cambio pendiente por entidad: uno nuevo se funde con el que ya
/// esperaba (H-D-11); un `delete` deja los campos en `{}` (HE-15-HU03-ET04).
pub async fn encolar_cambio(
    tx: &mut sqlx::SqliteConnection,
    entity_kind: &str,
    entity_id: &str,
    op: &str,
    fields: &serde_json::Value,
    ahora: &str,
) -> Result<(), sqlx::Error> {
    let fields = if op == "delete" {
        "{}".to_string()
    } else {
        fields.to_string()
    };
    sqlx::query(
        "INSERT INTO pending_change (entity_kind, entity_id, op, fields, modified_at, created_at) \
         VALUES (?, ?, ?, ?, ?, ?) \
         ON CONFLICT (entity_kind, entity_id) DO UPDATE SET \
           op = excluded.op, \
           fields = CASE WHEN excluded.op = 'delete' THEN '{}' \
                         ELSE json_patch(pending_change.fields, excluded.fields) END, \
           modified_at = excluded.modified_at",
    )
    .bind(entity_kind)
    .bind(entity_id)
    .bind(op)
    .bind(fields)
    .bind(ahora)
    .bind(ahora)
    .execute(tx)
    .await?;
    Ok(())
}

#[cfg(windows)]
mod dpapi;

/// Lo que se guarda en `session.bin` (INT-11: `{ access_token, refresh_token, expires_at, user_id }`).
/// DUDA: P05 el alias de `auth_get_session` sale de `profile` en la base local, que aún no existe: mientras
/// tanto se guarda también aquí, cifrado (docs/DUDAS.md).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SesionGuardada {
    pub access_token: String,
    pub refresh_token: String,
    /// Vencimiento del token de acceso, en ms desde 1970 (UTC).
    pub expires_at: i64,
    pub user_id: String,
    pub alias: String,
}

/// Dónde vive la sesión entre aperturas de la aplicación (HE-01-HU04-ET08).
pub trait AlmacenDeSesion: Send + Sync {
    /// Guarda la sesión. `false` si no se pudo escribir.
    fn guardar(&self, sesion: &SesionGuardada) -> bool;
    /// La sesión guardada, si hay una legible.
    fn leer(&self) -> Option<SesionGuardada>;
    /// Borra la sesión al cerrar sesión (RNF-19: 0 tokens tras cerrar sesión). `false` si quedó algo legible.
    fn borrar(&self) -> bool;
}

/// Sesión solo en memoria: las pruebas y los sistemas sin DPAPI (la aplicación es solo para Windows).
#[derive(Default)]
pub struct SesionEnMemoria(Mutex<Option<SesionGuardada>>);

impl AlmacenDeSesion for SesionEnMemoria {
    fn guardar(&self, sesion: &SesionGuardada) -> bool {
        self.0.lock().map(|mut s| *s = Some(sesion.clone())).is_ok()
    }

    fn leer(&self) -> Option<SesionGuardada> {
        self.0.lock().ok().and_then(|s| s.clone())
    }

    fn borrar(&self) -> bool {
        self.0.lock().map(|mut s| *s = None).is_ok()
    }
}

/// `session.bin` cifrado con DPAPI (CryptProtectData con el alcance del usuario actual).
#[cfg(windows)]
pub struct SesionConDpapi {
    ruta: std::path::PathBuf,
}

#[cfg(windows)]
impl SesionConDpapi {
    /// `%APPDATA%\Windgets\session.bin` (INT-11).
    pub fn en_appdata() -> Option<Self> {
        let appdata = std::env::var_os("APPDATA")?;
        Some(Self {
            ruta: std::path::Path::new(&appdata)
                .join("Windgets")
                .join("session.bin"),
        })
    }
}

#[cfg(windows)]
impl AlmacenDeSesion for SesionConDpapi {
    fn guardar(&self, sesion: &SesionGuardada) -> bool {
        let Ok(claro) = serde_json::to_vec(sesion) else {
            return false;
        };
        let Some(cifrado) = dpapi::proteger(&claro) else {
            return false;
        };
        self.ruta
            .parent()
            .is_some_and(|carpeta| std::fs::create_dir_all(carpeta).is_ok())
            && std::fs::write(&self.ruta, cifrado).is_ok()
    }

    fn leer(&self) -> Option<SesionGuardada> {
        let cifrado = std::fs::read(&self.ruta).ok()?;
        let claro = dpapi::desproteger(&cifrado)?;
        serde_json::from_slice(&claro).ok()
    }

    /// Quita `session.bin` (INT-11: «al cerrar sesión se borra el archivo»). Si Windows no deja quitarlo, lo
    /// deja vacío, para que no quede ningún token legible.
    fn borrar(&self) -> bool {
        match std::fs::remove_file(&self.ruta) {
            Ok(()) => true,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => true,
            Err(_) => std::fs::write(&self.ruta, []).is_ok(),
        }
    }
}

/// El almacén de la aplicación: DPAPI en Windows; en otro sistema, solo memoria.
pub fn almacen_de_la_aplicacion() -> Box<dyn AlmacenDeSesion> {
    #[cfg(windows)]
    if let Some(almacen) = SesionConDpapi::en_appdata() {
        return Box::new(almacen);
    }
    Box::new(SesionEnMemoria::default())
}

#[cfg(test)]
pub(crate) mod pruebas {
    use super::*;

    /// Una base creada con el esquema anterior a la versión 9 (sin 'windi'), con un Reloj y su fila de tema.
    fn base_version_8() -> BaseLocal {
        let anterior = ESQUEMA
            .replace(",'windi')", ")")
            .replace("PRAGMA user_version = 10;", "PRAGMA user_version = 0;");
        assert_ne!(anterior, ESQUEMA);
        let base = BaseLocal::en_memoria();
        tauri::async_runtime::block_on(async {
            sqlx::raw_sql(&anterior).execute(&base.pool).await.unwrap();
            sqlx::raw_sql(
                "INSERT INTO profile (user_id, alias, created_at) VALUES \
                   ('00000000-0000-4000-8000-000000000001', 'Ana', '2026-11-01T00:00:00.000Z');\
                 INSERT INTO widget (id, user_id, created_at, type, is_default) VALUES \
                   ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000001', \
                    '2026-11-01T00:00:00.000Z', 'clock', 1);",
            )
            .execute(&base.pool)
            .await
            .unwrap();
        });
        base
    }

    #[test]
    fn la_migracion_local_9_admite_el_widget_windi_y_conserva_los_widgets() {
        // rediseno_final_backend.md §5.5: una base que ya existía se actualiza al abrir; el Reloj sigue, Windi entra
        // una sola vez y la protección de los widgets por defecto se mantiene.
        let base = base_version_8();
        tauri::async_runtime::block_on(async {
            let pool = base.pool().await.unwrap();
            let version: i64 = sqlx::query_scalar("PRAGMA user_version")
                .fetch_one(pool)
                .await
                .unwrap();
            assert_eq!(version, VERSION_DEL_ESQUEMA);
            let relojes: i64 =
                sqlx::query_scalar("SELECT count(*) FROM widget WHERE type = 'clock'")
                    .fetch_one(pool)
                    .await
                    .unwrap();
            assert_eq!(relojes, 1);
            let insertar = "INSERT INTO widget (id, user_id, created_at, type, is_default) VALUES \
                (?, '00000000-0000-4000-8000-000000000001', '2026-11-01T00:00:00.000Z', 'windi', 0)";
            sqlx::query(insertar)
                .bind("00000000-0000-4000-8000-0000000000c1")
                .execute(pool)
                .await
                .unwrap();
            assert!(
                sqlx::query(insertar)
                    .bind("00000000-0000-4000-8000-0000000000c2")
                    .execute(pool)
                    .await
                    .is_err()
            );
            assert!(
                sqlx::query("DELETE FROM widget WHERE type = 'clock'")
                    .execute(pool)
                    .await
                    .is_err()
            );
            let claves: i64 = sqlx::query_scalar("PRAGMA foreign_keys")
                .fetch_one(pool)
                .await
                .unwrap();
            assert_eq!(claves, 1);
        });
    }

    const CUENTA: &str = "00000000-0000-4000-8000-000000000001";

    /// El `id` de la asignación de la etiqueta `etiqueta` en la tarjeta `tarjeta`.
    pub(crate) fn asignada(tarjeta: u8, etiqueta: u8) -> String {
        format!("00000000-0000-4000-8000-00000003{tarjeta:02}{etiqueta:02}")
    }

    pub(crate) fn id_de_la_tarjeta(tarjeta: u8) -> String {
        format!("00000000-0000-4000-8000-0000000001{tarjeta:02}")
    }

    pub(crate) fn id_de_la_etiqueta(etiqueta: u8) -> String {
        format!("00000000-0000-4000-8000-0000000002{etiqueta:02}")
    }

    /// El esquema con el disparador anterior a la versión 10 (máximo 5 etiquetas).
    fn con_el_disparador_de_5(esquema: &str) -> String {
        let anterior = esquema.replace(
            &format!("WHERE card_id = NEW.card_id) >= {ETIQUETAS_MAX}"),
            "WHERE card_id = NEW.card_id) >= 5",
        );
        assert!(anterior.contains("NEW.card_id) >= 5"));
        anterior
    }

    /// Una base de la versión 9 (máximo 5 etiquetas), con las tarjetas y asignaciones que se pidan:
    /// `(tarjeta, etiqueta, segundo de creación, updated_seq)`. Las que la nube no ha confirmado (`updated_seq = 0`)
    /// tienen su alta pendiente.
    pub(crate) fn base_version_9(desfase_ms: i64, asignaciones: &[(u8, u8, u8, i64)]) -> BaseLocal {
        let anterior = con_el_disparador_de_5(ESQUEMA)
            .replace("PRAGMA user_version = 10;", "PRAGMA user_version = 9;");
        base_con_asignaciones(&anterior, desfase_ms, asignaciones)
    }

    /// Una base creada con el esquema indicado, con las asignaciones de [`base_version_9`] y el cursor en 40.
    fn base_con_asignaciones(
        anterior: &str,
        desfase_ms: i64,
        asignaciones: &[(u8, u8, u8, i64)],
    ) -> BaseLocal {
        let base = BaseLocal::en_memoria();
        tauri::async_runtime::block_on(async {
            let pool = &base.pool;
            sqlx::raw_sql(anterior).execute(pool).await.unwrap();
            let columna = "00000000-0000-4000-8000-000000000400";
            sqlx::raw_sql(&format!(
                "INSERT INTO profile (user_id, alias, created_at) VALUES \
                   ('{CUENTA}', 'Ana', '2026-11-01T00:00:00.000Z');\
                 INSERT INTO catalog_color (id, name, hex, fetched_at) VALUES \
                   ('gray', 'Gris', '#888888', '2026-11-01T00:00:00.000Z'), \
                   ('blue', 'Azul', '#0000FF', '2026-11-01T00:00:00.000Z');\
                 INSERT INTO kanban_column (id, user_id, created_at, name, color_id, position, role) VALUES \
                   ('{columna}', '{CUENTA}', '2026-11-01T00:00:00.000Z', 'Por hacer', 'gray', 1, 'todo');\
                 INSERT INTO sync_state (id, user_id, device_id, last_pulled_seq, clock_offset_ms) VALUES \
                   (1, '{CUENTA}', '00000000-0000-4000-8000-000000000500', 40, {desfase_ms});"
            ))
            .execute(pool)
            .await
            .unwrap();
            for &(tarjeta, etiqueta, segundo, seq) in asignaciones {
                let hora = format!("2026-11-01T00:00:{segundo:02}.000Z");
                let id = asignada(tarjeta, etiqueta);
                let card = id_de_la_tarjeta(tarjeta);
                let label = id_de_la_etiqueta(etiqueta);
                sqlx::raw_sql(&format!(
                    "INSERT OR IGNORE INTO card (id, user_id, created_at, title, due_date, column_id, position) \
                       VALUES ('{card}', '{CUENTA}', '{hora}', 'T', '2026-12-01', '{columna}', {tarjeta});\
                     INSERT OR IGNORE INTO label (id, user_id, created_at, name, color_id) \
                       VALUES ('{label}', '{CUENTA}', '{hora}', 'E{etiqueta}', 'blue');\
                     INSERT INTO card_label (id, user_id, created_at, updated_seq, card_id, label_id) \
                       VALUES ('{id}', '{CUENTA}', '{hora}', {seq}, '{card}', '{label}');"
                ))
                .execute(pool)
                .await
                .unwrap();
                if seq == 0 {
                    let mut conexion = pool.acquire().await.unwrap();
                    let campos = serde_json::json!({});
                    encolar_cambio(&mut conexion, "card_label", &id, "upsert", &campos, &hora)
                        .await
                        .unwrap();
                }
            }
        });
        base
    }

    async fn textos(pool: &SqlitePool, sql: &str) -> Vec<String> {
        sqlx::query_scalar(sql).fetch_all(pool).await.unwrap()
    }

    const EN_COLA: &str = "SELECT entity_id || ' ' || op FROM pending_change ORDER BY entity_id";
    const ASIGNADAS: &str = "SELECT id FROM card_label ORDER BY id";

    fn altas_de(asignaciones: &[(u8, u8)]) -> Vec<String> {
        asignaciones
            .iter()
            .map(|&(t, e)| format!("{} upsert", asignada(t, e)))
            .collect()
    }

    fn ids_de(asignaciones: &[(u8, u8)]) -> Vec<String> {
        asignaciones.iter().map(|&(t, e)| asignada(t, e)).collect()
    }

    async fn version_y_cursor(pool: &SqlitePool) -> (i64, i64) {
        sqlx::query_as(
            "SELECT (SELECT user_version FROM pragma_user_version), last_pulled_seq FROM sync_state",
        )
        .fetch_one(pool)
        .await
        .unwrap()
    }

    /// El disparador ya no admite otra etiqueta en una tarjeta que tiene 3.
    async fn no_admite_una_cuarta(pool: &SqlitePool, tarjeta: u8, etiqueta: u8) {
        let cuarta = sqlx::query(
            "INSERT INTO card_label (id, user_id, created_at, card_id, label_id) \
             VALUES (?, ?, '2026-11-01T00:00:04.000Z', ?, ?)",
        )
        .bind(asignada(tarjeta, etiqueta))
        .bind(CUENTA)
        .bind(id_de_la_tarjeta(tarjeta))
        .bind(id_de_la_etiqueta(etiqueta))
        .execute(pool)
        .await
        .unwrap_err();
        assert!(cuarta.to_string().contains("limit_card_labels"));
    }

    #[test]
    fn la_migracion_local_10_quita_las_altas_pendientes_que_sobran() {
        // RD-96: la tarjeta 1 tiene 5 sin enviar y desordenadas: salen las 2 más recientes; en la 2 hay un empate de
        // hora entre dos sin enviar (decide el id); la 3 tiene 3 y no se toca. Las altas de las sobrantes salen de la
        // cola, sin encolar eliminaciones, y el cursor de la descarga no cambia.
        let base = base_version_9(
            0,
            &[
                (1, 1, 50, 0),
                (1, 2, 10, 0),
                (1, 3, 40, 0),
                (1, 4, 20, 0),
                (1, 5, 30, 0),
                (2, 1, 1, 7),
                (2, 2, 2, 8),
                (2, 4, 3, 0),
                (2, 3, 3, 0),
                (3, 1, 1, 0),
                (3, 2, 2, 0),
                (3, 3, 3, 0),
            ],
        );
        tauri::async_runtime::block_on(async {
            let pool = base.pool().await.unwrap();
            let quedan = [
                (1, 2),
                (1, 4),
                (1, 5),
                (2, 1),
                (2, 2),
                (2, 3),
                (3, 1),
                (3, 2),
                (3, 3),
            ];
            assert_eq!(textos(pool, ASIGNADAS).await, ids_de(&quedan));
            let en_cola = [(1, 2), (1, 4), (1, 5), (2, 3), (3, 1), (3, 2), (3, 3)];
            assert_eq!(textos(pool, EN_COLA).await, altas_de(&en_cola));
            assert_eq!(version_y_cursor(pool).await, (10, 40));
            no_admite_una_cuarta(pool, 3, 4).await;
        });
    }

    #[test]
    fn la_migracion_local_10_conserva_las_asignaciones_que_la_nube_ya_tiene() {
        // RD-96: ni las descargadas (`updated_seq > 0`) ni la ya enviada y aún sin descargar (`updated_seq = 0`, fuera
        // de la cola) se borran aquí, aunque la tarjeta quede con más de 3: las recorta la nube. El cursor no cambia.
        let base = base_version_9(
            0,
            &[
                (1, 1, 1, 3),
                (1, 2, 2, 4),
                (1, 3, 3, 5),
                (1, 4, 4, 6),
                (2, 1, 1, 7),
                (2, 2, 2, 8),
                (2, 3, 3, 9),
                (2, 4, 4, 0),
            ],
        );
        tauri::async_runtime::block_on(async {
            sqlx::query("DELETE FROM pending_change")
                .execute(&base.pool)
                .await
                .unwrap();
            let pool = base.pool().await.unwrap();
            let todas = [
                (1, 1),
                (1, 2),
                (1, 3),
                (1, 4),
                (2, 1),
                (2, 2),
                (2, 3),
                (2, 4),
            ];
            assert_eq!(textos(pool, ASIGNADAS).await, ids_de(&todas));
            assert_eq!(version_y_cursor(pool).await, (10, 40));
        });
    }

    #[test]
    fn la_migracion_local_10_compara_las_horas_en_el_reloj_de_la_nube() {
        // El computador va 30 s adelantado (desfase -30 s): su alta del segundo 40 es anterior a las confirmadas de los
        // segundos 20 y 25, como la verá `sync_push`, y la del 57 es la que sobra. Sin el desfase saldrían las dos.
        let base = base_version_9(
            -30_000,
            &[(1, 1, 20, 5), (1, 2, 25, 6), (1, 3, 40, 0), (1, 4, 57, 0)],
        );
        tauri::async_runtime::block_on(async {
            let pool = base.pool().await.unwrap();
            assert_eq!(
                textos(pool, ASIGNADAS).await,
                ids_de(&[(1, 1), (1, 2), (1, 3)])
            );
            assert_eq!(textos(pool, EN_COLA).await, altas_de(&[(1, 3)]));
        });
    }

    #[test]
    fn una_base_de_la_version_8_pasa_por_la_9_hasta_la_10_con_sus_asignaciones() {
        // Sin 'windi' y con el disparador de 5: la tarjeta 1 llega con 4 confirmadas, que se conservan; en la 2 sobra el
        // alta pendiente; la 3 tiene 3. Al final valen el widget de la 9 y el disparador de la 10.
        let version_8 = con_el_disparador_de_5(ESQUEMA)
            .replace(",'windi')", ")")
            .replace("PRAGMA user_version = 10;", "PRAGMA user_version = 0;");
        assert!(!version_8.contains("'windi'"));
        let base = base_con_asignaciones(
            &version_8,
            0,
            &[
                (1, 1, 1, 3),
                (1, 2, 2, 4),
                (1, 3, 3, 5),
                (1, 4, 4, 6),
                (2, 1, 1, 7),
                (2, 2, 2, 8),
                (2, 3, 3, 9),
                (2, 4, 4, 0),
                (3, 1, 1, 10),
                (3, 2, 2, 11),
                (3, 3, 3, 12),
            ],
        );
        tauri::async_runtime::block_on(async {
            let pool = base.pool().await.unwrap();
            let quedan = [
                (1, 1),
                (1, 2),
                (1, 3),
                (1, 4),
                (2, 1),
                (2, 2),
                (2, 3),
                (3, 1),
                (3, 2),
                (3, 3),
            ];
            assert_eq!(textos(pool, ASIGNADAS).await, ids_de(&quedan));
            assert!(textos(pool, EN_COLA).await.is_empty());
            assert_eq!(version_y_cursor(pool).await, (10, 40));
            sqlx::query(
                "INSERT INTO widget (id, user_id, created_at, type, is_default) \
                 VALUES ('00000000-0000-4000-8000-0000000000c1', ?, '2026-11-01T00:00:00.000Z', 'windi', 0)",
            )
            .bind(CUENTA)
            .execute(pool)
            .await
            .unwrap();
            no_admite_una_cuarta(pool, 3, 4).await;
        });
    }

    #[test]
    fn la_migracion_local_10_sin_sobrantes_no_cambia_la_descarga() {
        let base = base_version_9(0, &[(1, 1, 1, 3), (1, 2, 2, 4), (1, 3, 3, 5)]);
        tauri::async_runtime::block_on(async {
            let pool = base.pool().await.unwrap();
            let cursor: i64 = sqlx::query_scalar("SELECT last_pulled_seq FROM sync_state")
                .fetch_one(pool)
                .await
                .unwrap();
            assert_eq!(cursor, 40);
            assert_eq!(textos(pool, "SELECT id FROM card_label").await.len(), 3);
        });
    }

    #[test]
    fn una_base_nueva_nace_en_la_version_actual() {
        let base = BaseLocal::en_memoria();
        let version: i64 = tauri::async_runtime::block_on(async {
            sqlx::query_scalar("PRAGMA user_version")
                .fetch_one(base.pool().await.unwrap())
                .await
                .unwrap()
        });
        assert_eq!(version, VERSION_DEL_ESQUEMA);
    }

    #[test]
    fn la_sesion_en_memoria_se_lee_como_se_guardo() {
        let almacen = SesionEnMemoria::default();
        assert_eq!(almacen.leer(), None);
        let sesion = SesionGuardada {
            access_token: "a".into(),
            refresh_token: "r".into(),
            expires_at: 1,
            user_id: "u".into(),
            alias: "Ana".into(),
        };
        assert!(almacen.guardar(&sesion));
        assert_eq!(almacen.leer(), Some(sesion));
    }

    #[test]
    fn la_base_local_nueva_tiene_el_esquema_y_las_claves_foraneas() {
        tauri::async_runtime::block_on(async {
            let base = BaseLocal::en_memoria();
            let pool = base.pool().await.unwrap();
            let tablas: Vec<String> = sqlx::query_scalar(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('card', 'pending_change', 'kanban_column') ORDER BY name",
            )
            .fetch_all(pool)
            .await
            .unwrap();
            assert_eq!(tablas, ["card", "kanban_column", "pending_change"]);
            let claves: i64 = sqlx::query_scalar("PRAGMA foreign_keys")
                .fetch_one(pool)
                .await
                .unwrap();
            assert_eq!(claves, 1);
            // Abrirla de nuevo no vuelve a aplicar el esquema (fallaría con «table already exists»).
            assert!(base.pool().await.is_ok());
        });
    }

    #[test]
    fn la_base_en_archivo_se_crea_en_wal_y_se_reabre() {
        let carpeta = std::env::temp_dir().join(format!("windgets-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&carpeta).unwrap();
        let ruta = carpeta.join("windgets.db");
        tauri::async_runtime::block_on(async {
            let base = BaseLocal::en_archivo(&ruta);
            let modo: String = sqlx::query_scalar("PRAGMA journal_mode")
                .fetch_one(base.pool().await.unwrap())
                .await
                .unwrap();
            assert_eq!(modo, "wal");
            base.pool().await.unwrap().close().await;
            let otra = BaseLocal::en_archivo(&ruta);
            otra.pool().await.unwrap();
            otra.pool().await.unwrap().close().await;
        });
        let _ = std::fs::remove_dir_all(&carpeta);
    }
}
