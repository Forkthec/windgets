//! INT-09 Almacenamiento de archivos (Supabase Storage, D-180) de las imágenes propias (HE-02-HU03, HE-04-HU07,
//! HE-04-HU08, HE-15-HU01).
//!
//! - **Subir.** `image_import` deja la imagen en `file_upload_queue` y su `pending_change` espera con
//!   `depends_on_upload_id` (IPC-CAT-03). En cada ciclo, antes de enviar la cola de cambios, se sube cada imagen
//!   pendiente a `user-images/{user_id}/{uploaded_image.id}.{ext}`. Al subir, la entrada sale de la cola y el cambio
//!   deja de esperar: la fila nunca llega a la nube antes que el archivo (P26, prueba manual del 22-nov).
//! - **Descargar.** Las imágenes propias que llegan con `sync_pull` (otro computador, o la misma cuenta tras cerrar
//!   sesión) se bajan de `authenticated/user-images/{path}`; se verifican tamaño y `sha256` y se guardan en
//!   `%APPDATA%\Windgets\files` con su `local_file` (INT-09, «Descargar»).
//!
//! Storage queda detrás del trait [`AlmacenDeImagenes`] para que las pruebas usen un doble.

use std::future::Future;
use std::path::Path;

use sha2::{Digest, Sha256};

use super::{Credenciales, REINTENTO_MS, instante};
use crate::cliente_de_supabase::FallaDeAuth;
use crate::repositorios_y_archivos_locales::BaseLocal;

/// El bucket de las imágenes propias (D-180, `0004_storage.sql`).
pub const BUCKET: &str = "user-images";

/// INT-09 con el JWT de la sesión.
pub trait AlmacenDeImagenes: Send + Sync {
    /// `POST /storage/v1/object/user-images/{ruta}` con el cuerpo binario. Un objeto que ya existe (409, una
    /// subida anterior cuya respuesta se perdió) cuenta como subido.
    fn subir(
        &self,
        token: &str,
        ruta: &str,
        tipo: &str,
        bytes: Vec<u8>,
    ) -> impl Future<Output = Result<(), FallaDeAuth>> + Send;
    /// `GET /storage/v1/object/authenticated/user-images/{ruta}`.
    fn descargar(
        &self,
        token: &str,
        ruta: &str,
    ) -> impl Future<Output = Result<Vec<u8>, FallaDeAuth>> + Send;
}

/// Qué hacer con una subida que falló.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrasLaFalla {
    /// Falla pasajera: la imagen sigue en la cola y se reintenta al minuto (HE-15-HU01-ET04).
    Reintentar(&'static str),
    /// Storage no la va a aceptar nunca, o el archivo ya no está: se marca `failed` y el cambio deja de esperar.
    Descartar(&'static str),
}

/// INT-09, «Errores»: sin red o sin respuesta se reintenta en silencio; 401 o 403 es un problema de sesión (el
/// Núcleo renueva el token antes del siguiente ciclo y, si no puede, cierra la sesión con `session.expired`); 413 y
/// 400 de tipo no permitido no deberían llegar porque el Núcleo ya validó la imagen (HE-02-HU03-ET04): si llegan,
/// van al registro y la imagen no se reintenta.
pub fn tras_la_falla(falla: &FallaDeAuth) -> TrasLaFalla {
    match falla {
        FallaDeAuth::SinConexion => TrasLaFalla::Reintentar("net.offline"),
        FallaDeAuth::SinRespuesta => TrasLaFalla::Reintentar("service.unavailable"),
        FallaDeAuth::Rechazo {
            estado: 401 | 403, ..
        } => TrasLaFalla::Reintentar("session.expired"),
        // Demasiadas peticiones: pasajero.
        FallaDeAuth::Rechazo { estado: 429, .. } => TrasLaFalla::Reintentar("service.unavailable"),
        FallaDeAuth::Rechazo { estado: 413, .. } => TrasLaFalla::Descartar("image.too_large"),
        FallaDeAuth::Rechazo { .. } => TrasLaFalla::Descartar("image.format_not_allowed"),
    }
}

/// Tras una subida fallida se espera un minuto antes de intentar otra (HE-15-HU01-ET04); el ciclo da una vuelta
/// por segundo. `ultima_falla` es la hora de la última falla pasajera, si hubo.
pub fn toca_subir(ultima_falla: Option<i64>, ahora_ms: i64) -> bool {
    ultima_falla.is_none_or(|falla| ahora_ms - falla >= REINTENTO_MS)
}

/// Lo que dejó una ronda de subidas.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Subidas {
    /// Imágenes que llegaron a Storage.
    pub subidas: i64,
    /// Hubo una falla pasajera: el ciclo espera un minuto antes de reintentar (`toca_subir`).
    pub reintentar: bool,
}

/// Sube a Storage las imágenes de `file_upload_queue`, en el orden en que se eligieron. Sin conexión no llama a la
/// nube. Una falla pasajera detiene la ronda y deja la imagen en la cola con `attempts` y `last_error`; una falla
/// definitiva (o el archivo local que ya no existe) la marca `failed` y suelta los cambios que la esperaban, para no
/// bloquear la cola de cambios. DUDA: P26 INT-09 no dice qué hacer si el archivo local ya no existe.
pub async fn subir_pendientes<A: AlmacenDeImagenes>(
    base: &BaseLocal,
    almacen: &A,
    sesion: &Credenciales<'_>,
    carpeta: &Path,
    en_linea: bool,
) -> Result<Subidas, sqlx::Error> {
    let mut ronda = Subidas::default();
    if !en_linea {
        return Ok(ronda);
    }
    let pool = base.pool().await?;
    let cola: Vec<(i64, String, String)> = sqlx::query_as(
        "SELECT q.id, q.local_path, i.mime_type FROM file_upload_queue q \
         JOIN uploaded_image i ON i.id = q.uploaded_image_id \
         WHERE q.status IN ('queued', 'uploading') AND i.user_id = ? ORDER BY q.id",
    )
    .bind(sesion.user_id)
    .fetch_all(pool)
    .await?;
    for (id, ruta, tipo) in cola {
        let resultado = match std::fs::read(carpeta.join(&ruta)) {
            Ok(bytes) => almacen
                .subir(sesion.token, &ruta, &tipo, bytes)
                .await
                .map_err(|falla| tras_la_falla(&falla)),
            Err(_) => Err(TrasLaFalla::Descartar("file.missing")),
        };
        let mut tx = pool.begin().await?;
        match resultado {
            Ok(()) => {
                sqlx::query(
                    "UPDATE pending_change SET depends_on_upload_id = NULL WHERE depends_on_upload_id = ?",
                )
                .bind(id)
                .execute(&mut *tx)
                .await?;
                sqlx::query("DELETE FROM file_upload_queue WHERE id = ?")
                    .bind(id)
                    .execute(&mut *tx)
                    .await?;
                ronda.subidas += 1;
            }
            Err(TrasLaFalla::Reintentar(codigo)) => {
                sqlx::query(
                    "UPDATE file_upload_queue SET status = 'queued', attempts = attempts + 1, last_error = ? \
                     WHERE id = ?",
                )
                .bind(codigo)
                .bind(id)
                .execute(&mut *tx)
                .await?;
                tx.commit().await?;
                ronda.reintentar = true;
                return Ok(ronda);
            }
            Err(TrasLaFalla::Descartar(codigo)) => {
                eprintln!("La imagen propia {ruta} no se pudo subir a Storage: {codigo}.");
                sqlx::query(
                    "UPDATE file_upload_queue SET status = 'failed', attempts = attempts + 1, last_error = ? \
                     WHERE id = ?",
                )
                .bind(codigo)
                .bind(id)
                .execute(&mut *tx)
                .await?;
                sqlx::query(
                    "UPDATE pending_change SET depends_on_upload_id = NULL WHERE depends_on_upload_id = ?",
                )
                .bind(id)
                .execute(&mut *tx)
                .await?;
            }
        }
        tx.commit().await?;
    }
    Ok(ronda)
}

/// La ruta de una imagen propia tiene la forma `{user_id}/{uuid}.{jpg|jpeg|png}` de `uploaded_image.storage_path`
/// y de la política `user_images_insert`: nunca sale de la carpeta de la cuenta (RNF-22).
pub fn ruta_de_imagen_valida(user_id: &str, ruta: &str) -> bool {
    let Some((carpeta, archivo)) = ruta.split_once('/') else {
        return false;
    };
    let Some((id, extension)) = archivo.rsplit_once('.') else {
        return false;
    };
    carpeta == user_id
        && uuid::Uuid::parse_str(id).is_ok_and(|u| u.to_string() == id)
        && matches!(extension, "jpg" | "jpeg" | "png")
}

pub(crate) fn sha256_en_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

/// Baja de Storage las imágenes propias de la cuenta que no están en el computador (las que llegaron con
/// `sync_pull`) y devuelve sus ids. Una imagen que todavía no está en Storage (404: el otro computador aún no la
/// subió) o que no coincide en tamaño o `sha256` se intenta en la siguiente consulta; sin conexión se detiene.
pub async fn descargar_imagenes<A: AlmacenDeImagenes>(
    base: &BaseLocal,
    almacen: &A,
    sesion: &Credenciales<'_>,
    carpeta: &Path,
    ahora_ms: i64,
) -> Result<Vec<String>, sqlx::Error> {
    let pool = base.pool().await?;
    let faltan: Vec<(String, String, i64, String)> = sqlx::query_as(
        "SELECT i.id, i.storage_path, i.size_bytes, i.sha256 FROM uploaded_image i \
         WHERE i.user_id = ? \
           AND NOT EXISTS (SELECT 1 FROM local_file f WHERE f.kind = 'uploaded_image' AND f.ref_id = i.id) \
           AND NOT EXISTS (SELECT 1 FROM file_upload_queue q WHERE q.uploaded_image_id = i.id) \
         ORDER BY i.created_at",
    )
    .bind(sesion.user_id)
    .fetch_all(pool)
    .await?;
    let mut bajadas = Vec::new();
    for (id, ruta, tamano, hash) in faltan {
        if !ruta_de_imagen_valida(sesion.user_id, &ruta) {
            continue;
        }
        let bytes = match almacen.descargar(sesion.token, &ruta).await {
            Ok(bytes) => bytes,
            Err(FallaDeAuth::SinConexion) => break,
            Err(_) => continue,
        };
        if i64::try_from(bytes.len()).ok() != Some(tamano) || sha256_en_hex(&bytes) != hash {
            eprintln!("La imagen propia {ruta} descargada no coincide con su tamaño o su sha256.");
            continue;
        }
        let destino = carpeta.join(&ruta);
        let guardada = destino
            .parent()
            .is_none_or(|padre| std::fs::create_dir_all(padre).is_ok())
            && std::fs::write(&destino, &bytes).is_ok();
        if !guardada {
            continue;
        }
        let ahora = instante(ahora_ms);
        sqlx::query(
            "INSERT OR REPLACE INTO local_file (id, kind, ref_id, remote_path, local_path, size_bytes, sha256, \
             downloaded_at, last_used_at) VALUES (?, 'uploaded_image', ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&id)
        .bind(&id)
        .bind(&ruta)
        .bind(&ruta)
        .bind(tamano)
        .bind(&hash)
        .bind(&ahora)
        .bind(&ahora)
        .execute(pool)
        .await?;
        bajadas.push(id);
    }
    Ok(bajadas)
}
