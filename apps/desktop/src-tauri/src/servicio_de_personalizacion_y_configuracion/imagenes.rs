//! Imágenes propias (IPC-CAT-03 `image_import`, HE-02-HU03): validar el archivo, copiarlo a la carpeta de
//! archivos de la aplicación y registrarlo para que se sincronice.

use std::path::Path;

use serde_json::Value;
use sha2::{Digest, Sha256};

use super::*;
use crate::repositorios_y_archivos_locales::encolar_cambio;
use crate::servicio_de_sesion::instante;
use crate::servicio_del_planificador::campos;
use crate::tipos::{ImageImportResult, ImportPurpose};

/// Tamaño máximo de una imagen propia: 20 MB (HE-02-HU03-ET04, RNF-23).
pub(super) const MAXIMO_DE_BYTES: u64 = 20_971_520;

pub(super) const FIRMA_PNG: [u8; 8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
pub(super) const CIERRE_PNG: [u8; 12] =
    [0, 0, 0, 0, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];

/// Lo que se sabe de un archivo de imagen válido.
#[derive(Debug, PartialEq, Eq)]
struct Inspeccion {
    mime: &'static str,
    extension: &'static str,
    ancho: u32,
    alto: u32,
}

fn rechazo(codigo: ErrorCode, mensaje: &str) -> AppError {
    error(codigo, mensaje, None)
}

fn formato_no_permitido() -> AppError {
    rechazo(
        ErrorCode::ImageFormatNotAllowed,
        messages::FORMATO_DE_IMAGEN_NO_PERMITIDO,
    )
}

fn ilegible() -> AppError {
    rechazo(ErrorCode::ImageUnreadable, messages::IMAGEN_ILEGIBLE)
}

/// La extensión permitida del nombre del archivo, en minúsculas (HE-02-HU03-ET04).
fn extension_permitida(ruta: &Path) -> Option<&'static str> {
    let extension = ruta.extension()?.to_str()?.to_ascii_lowercase();
    match extension.as_str() {
        "jpg" => Some("jpg"),
        "jpeg" => Some("jpeg"),
        "png" => Some("png"),
        _ => None,
    }
}

fn u32_grande(bytes: &[u8]) -> u32 {
    u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
}

/// Ancho y alto de un PNG completo (IHDR al inicio, IEND al final).
fn medidas_de_png(bytes: &[u8]) -> Option<(u32, u32)> {
    if bytes.len() < 33 || &bytes[12..16] != b"IHDR" || !bytes.ends_with(&CIERRE_PNG) {
        return None;
    }
    Some((u32_grande(&bytes[16..20]), u32_grande(&bytes[20..24])))
}

/// Ancho y alto de un JPEG completo (marcador SOFn y cierre EOI).
fn medidas_de_jpeg(bytes: &[u8]) -> Option<(u32, u32)> {
    let sin_relleno = {
        let mut fin = bytes.len();
        while fin > 0 && bytes[fin - 1] == 0 {
            fin -= 1;
        }
        &bytes[..fin]
    };
    if !sin_relleno.ends_with(&[0xFF, 0xD9]) {
        return None;
    }
    let mut i = 2;
    while i + 4 <= bytes.len() {
        if bytes[i] != 0xFF {
            return None;
        }
        let marcador = bytes[i + 1];
        if marcador == 0xFF {
            i += 1;
            continue;
        }
        let largo = usize::from(u16::from_be_bytes([bytes[i + 2], bytes[i + 3]]));
        let es_sof = (0xC0..=0xCF).contains(&marcador) && ![0xC4, 0xC8, 0xCC].contains(&marcador);
        if es_sof {
            let datos = bytes.get(i + 5..i + 9)?;
            let alto = u32::from(u16::from_be_bytes([datos[0], datos[1]]));
            let ancho = u32::from(u16::from_be_bytes([datos[2], datos[3]]));
            return Some((ancho, alto));
        }
        if largo < 2 {
            return None;
        }
        i += 2 + largo;
    }
    None
}

/// Valida el contenido: la firma debe ser la de la extensión (RNF-22; un archivo renombrado no pasa) y el
/// archivo debe poder leerse entero (HE-02-HU03-CA05, CA07).
fn inspeccionar(bytes: &[u8], extension: &'static str) -> Result<Inspeccion, AppError> {
    let es_png = bytes.starts_with(&FIRMA_PNG);
    let es_jpeg = bytes.starts_with(&[0xFF, 0xD8, 0xFF]);
    let (mime, medidas) = match (extension, es_png, es_jpeg) {
        ("png", true, _) => ("image/png", medidas_de_png(bytes)),
        ("jpg" | "jpeg", _, true) => ("image/jpeg", medidas_de_jpeg(bytes)),
        // Vacío: un archivo con extensión válida que no se puede leer (CA07).
        _ if bytes.is_empty() => return Err(ilegible()),
        _ => return Err(formato_no_permitido()),
    };
    match medidas {
        Some((ancho, alto)) if ancho > 0 && alto > 0 => Ok(Inspeccion {
            mime,
            extension,
            ancho,
            alto,
        }),
        _ => Err(ilegible()),
    }
}

fn sha256_en_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

impl ServicioDePersonalizacion {
    /// IPC-CAT-03 `image_import`: valida (extensión, firma, 20 MB y lectura), copia a `carpeta` y registra la
    /// imagen y su subida pendiente. Nada se copia, se registra ni cambia si falla (HE-02-HU03-ET10).
    pub async fn importar_imagen(
        &self,
        base: &BaseLocal,
        user_id: &str,
        ruta: &str,
        _proposito: &ImportPurpose,
        carpeta: &Path,
        ahora_ms: i64,
    ) -> Result<ImageImportResult, AppError> {
        let origen = Path::new(ruta);
        let extension = extension_permitida(origen).ok_or_else(formato_no_permitido)?;
        let tamano = std::fs::metadata(origen).map_err(|_| ilegible())?.len();
        if tamano > MAXIMO_DE_BYTES {
            return Err(rechazo(
                ErrorCode::ImageTooLarge,
                messages::IMAGEN_MUY_GRANDE,
            ));
        }
        let bytes = std::fs::read(origen).map_err(|_| ilegible())?;
        let inspeccion = inspeccionar(&bytes, extension)?;

        let id = uuid::Uuid::new_v4().to_string();
        let relativa = format!("{user_id}/{id}.{}", inspeccion.extension);
        let destino = carpeta.join(&relativa);
        if let Some(padre) = destino.parent() {
            std::fs::create_dir_all(padre).map_err(|_| inesperado())?;
        }
        std::fs::write(&destino, &bytes).map_err(|_| inesperado())?;
        if let Err(falla) = self
            .registrar_imagen(base, user_id, &id, &relativa, &inspeccion, &bytes, ahora_ms)
            .await
        {
            let _ = std::fs::remove_file(&destino);
            return Err(falla);
        }
        Ok(ImageImportResult {
            uploaded_image_id: Uuid(id),
            preview_url: destino.to_string_lossy().into_owned(),
        })
    }

    #[allow(clippy::too_many_arguments)]
    async fn registrar_imagen(
        &self,
        base: &BaseLocal,
        user_id: &str,
        id: &str,
        relativa: &str,
        inspeccion: &Inspeccion,
        bytes: &[u8],
        ahora_ms: i64,
    ) -> Result<(), AppError> {
        let pool = base.pool().await.map_err(de_sqlx)?;
        let ahora = instante(ahora_ms).0;
        let hash = sha256_en_hex(bytes);
        let tamano = i64::try_from(bytes.len()).map_err(|_| inesperado())?;
        let (fields, mods) = campos(
            &[
                ("storage_path", Value::from(relativa)),
                ("mime_type", Value::from(inspeccion.mime)),
                ("extension", Value::from(inspeccion.extension)),
                ("size_bytes", Value::from(tamano)),
                ("width", Value::from(inspeccion.ancho)),
                ("height", Value::from(inspeccion.alto)),
                ("sha256", Value::from(hash.as_str())),
            ],
            &ahora,
        );
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        sqlx::query(
            "INSERT INTO uploaded_image (id, user_id, created_at, field_mods, storage_path, mime_type, extension, \
             size_bytes, width, height, sha256) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(user_id)
        .bind(&ahora)
        .bind(mods.to_string())
        .bind(relativa)
        .bind(inspeccion.mime)
        .bind(inspeccion.extension)
        .bind(tamano)
        .bind(i64::from(inspeccion.ancho))
        .bind(i64::from(inspeccion.alto))
        .bind(&hash)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        let subida = sqlx::query(
            "INSERT INTO file_upload_queue (uploaded_image_id, local_path, created_at) VALUES (?, ?, ?)",
        )
        .bind(id)
        .bind(relativa)
        .bind(&ahora)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?
        .last_insert_rowid();
        sqlx::query(
            "INSERT INTO local_file (id, kind, ref_id, remote_path, local_path, size_bytes, sha256, downloaded_at, \
             last_used_at) VALUES (?, 'uploaded_image', ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(id)
        .bind(relativa)
        .bind(relativa)
        .bind(tamano)
        .bind(&hash)
        .bind(&ahora)
        .bind(&ahora)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "uploaded_image", id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        // El cambio espera a que el archivo suba (HE-02-HU03, IPC-CAT-03).
        sqlx::query(
            "UPDATE pending_change SET depends_on_upload_id = ? WHERE entity_kind = 'uploaded_image' AND entity_id = ?",
        )
        .bind(subida)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)
    }
}
