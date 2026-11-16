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

use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions};
use tokio::sync::OnceCell;

/// Esquema de la base local (copia de `docs/local/sqlite_esquema.sql`).
const ESQUEMA: &str = include_str!("../sqlite_esquema.sql");

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
mod pruebas {
    use super::*;

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
