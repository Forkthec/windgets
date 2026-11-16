//! Pruebas del Núcleo de HE-02-HU03 (seleccionar la imagen de fondo de la plantilla).

use std::path::PathBuf;

use super::imagenes::{CIERRE_PNG, FIRMA_PNG, MAXIMO_DE_BYTES};
use super::pruebas_del_tema_en_edicion::{T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{ImportPurpose, ThemeDraftPatchBackground};

const AHORA_MS: i64 = 1_793_600_000_000;

/// Un PNG mínimo y completo de 3 × 2.
fn png(ancho: u32, alto: u32) -> Vec<u8> {
    let mut bytes = FIRMA_PNG.to_vec();
    bytes.extend_from_slice(&[0, 0, 0, 13]);
    bytes.extend_from_slice(b"IHDR");
    bytes.extend_from_slice(&ancho.to_be_bytes());
    bytes.extend_from_slice(&alto.to_be_bytes());
    bytes.extend_from_slice(&[8, 2, 0, 0, 0, 0, 0, 0, 0]);
    bytes.extend_from_slice(&CIERRE_PNG);
    bytes
}

/// Un JPEG mínimo y completo de 3 × 2.
fn jpeg() -> Vec<u8> {
    vec![
        0xFF, 0xD8, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x02, 0x00, 0x03, 0x01, 0x01, 0x11, 0x00,
        0xFF, 0xD9,
    ]
}

/// Una carpeta nueva y vacía para el archivo de origen y para la carpeta de archivos de la aplicación.
fn carpeta() -> PathBuf {
    let ruta = std::env::temp_dir().join(format!("windgets-pruebas-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&ruta).unwrap();
    ruta
}

fn archivo(carpeta: &std::path::Path, nombre: &str, contenido: &[u8]) -> String {
    let ruta = carpeta.join(nombre);
    std::fs::write(&ruta, contenido).unwrap();
    ruta.to_string_lossy().into_owned()
}

fn importar(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    ruta: &str,
    destino: &std::path::Path,
) -> Result<crate::tipos::ImageImportResult, AppError> {
    bloquear(servicio.importar_imagen(
        base,
        USUARIO,
        ruta,
        &ImportPurpose::Background,
        destino,
        AHORA_MS,
    ))
}

fn fondo_propio(id: &Uuid) -> ThemeDraftPatch {
    ThemeDraftPatch {
        template_id: None,
        background: Some(ThemeDraftPatchBackground {
            source: BackgroundSource::Own,
            catalog_image_id: None,
            uploaded_image_id: Some(id.clone()),
        }),
        colors: None,
        palette_id: None,
        font_id: None,
        font_size: None,
    }
}

fn fondo_del_catalogo(id: &str) -> ThemeDraftPatch {
    ThemeDraftPatch {
        background: Some(ThemeDraftPatchBackground {
            source: BackgroundSource::Catalog,
            catalog_image_id: Some(id.to_string()),
            uploaded_image_id: None,
        }),
        ..fondo_propio(&Uuid(String::new()))
    }
}

fn con_imagenes() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_temas();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        for (id, nombre, orden) in [("monte", "Monte", 2), ("mar", "Mar", 1)] {
            sqlx::query(
                "INSERT INTO catalog_image (id, name, storage_path, thumbnail_path, width, height, sort_order, fetched_at) \
                 VALUES (?, ?, 'i/x.jpg', 'i/x-t.jpg', 1920, 1080, ?, ?)",
            )
            .bind(id)
            .bind(nombre)
            .bind(orden)
            .bind(T)
            .execute(pool)
            .await
            .unwrap();
        }
    });
    (base, servicio)
}

fn contar(base: &BaseLocal, tabla: &str) -> i64 {
    bloquear(async {
        sqlx::query_scalar(&format!("SELECT COUNT(*) FROM {tabla}"))
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

#[test]
fn ca_he_02_hu03_ca01() {
    // HE-02-HU03-CA01 · Una imagen propia JPG, JPEG o PNG de hasta 20 MB pasa a ser el fondo de la vista previa (ET03 a ET05).
    let (base, servicio) = con_temas();
    let dir = carpeta();
    for (nombre, contenido, mime, ext) in [
        ("foto.png", png(3, 2), "image/png", "png"),
        ("foto.JPG", jpeg(), "image/jpeg", "jpg"),
        ("foto.jpeg", jpeg(), "image/jpeg", "jpeg"),
    ] {
        let ruta = archivo(&dir, nombre, &contenido);
        let resultado = importar(&servicio, &base, &ruta, &dir.join("files")).unwrap();
        // Se copió a la carpeta de archivos de la aplicación y quedó registrada con sus medidas.
        assert!(std::path::Path::new(&resultado.preview_url).is_file());
        let (tipo, extension, ancho, alto): (String, String, i64, i64) = bloquear(async {
            sqlx::query_as(
                "SELECT mime_type, extension, width, height FROM uploaded_image WHERE id = ?",
            )
            .bind(&resultado.uploaded_image_id.0)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
        });
        assert_eq!((tipo.as_str(), extension.as_str()), (mime, ext));
        assert_eq!((ancho, alto), (3, 2));
        // La vista previa la muestra como fondo.
        let vista = bloquear(servicio.actualizar_borrador(
            &base,
            USUARIO,
            &fondo_propio(&resultado.uploaded_image_id),
        ))
        .unwrap();
        assert_eq!(vista.content.background.source, BackgroundSource::Own);
        assert_eq!(
            vista.content.background.uploaded_image_id,
            Some(resultado.uploaded_image_id)
        );
        assert!(vista.dirty);
    }
    // Cada imagen dejó su subida pendiente y su cambio por sincronizar.
    assert_eq!(contar(&base, "file_upload_queue"), 3);
    assert_eq!(
        contar(&base, "pending_change WHERE entity_kind = 'uploaded_image'"),
        3
    );
}

#[test]
fn ca_he_02_hu03_ca02() {
    // HE-02-HU03-CA02 · El catálogo de imágenes trae la miniatura de cada imagen, por orden (ET07, ET08).
    let (base, servicio) = con_imagenes();
    let imagenes = bloquear(servicio.imagenes(&base)).unwrap();
    let nombres: Vec<_> = imagenes.iter().map(|i| i.name.as_str()).collect();
    assert_eq!(nombres, ["Mar", "Monte"]);
    assert!(imagenes.iter().all(|i| !i.thumbnail_url.is_empty()));
}

#[test]
fn ca_he_02_hu03_ca03() {
    // HE-02-HU03-CA03 · Elegir una imagen del catálogo la muestra como fondo en la vista previa (ET03).
    let (base, servicio) = con_imagenes();
    let vista =
        bloquear(servicio.actualizar_borrador(&base, USUARIO, &fondo_del_catalogo("mar"))).unwrap();
    assert_eq!(vista.content.background.source, BackgroundSource::Catalog);
    assert_eq!(
        vista.content.background.catalog_image_id.as_deref(),
        Some("mar")
    );
    // Una imagen que no existe en el catálogo no cambia nada (`image.not_found`, sin texto).
    let error =
        bloquear(servicio.actualizar_borrador(&base, USUARIO, &fondo_del_catalogo("no-existe")))
            .unwrap_err();
    assert_eq!(error.code, ErrorCode::ImageNotFound);
}

#[test]
fn ca_he_02_hu03_ca04() {
    // HE-02-HU03-CA04 · Elegir otra imagen reemplaza la anterior en la vista previa (ET09).
    let (base, servicio) = con_imagenes();
    let dir = carpeta();
    let propia = importar(
        &servicio,
        &base,
        &archivo(&dir, "a.png", &png(3, 2)),
        &dir.join("files"),
    )
    .unwrap();
    bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &fondo_propio(&propia.uploaded_image_id),
    ))
    .unwrap();
    let vista =
        bloquear(servicio.actualizar_borrador(&base, USUARIO, &fondo_del_catalogo("monte")))
            .unwrap();
    assert_eq!(vista.content.background.source, BackgroundSource::Catalog);
    assert_eq!(vista.content.background.uploaded_image_id, None);
    let vuelta = bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &fondo_propio(&propia.uploaded_image_id),
    ))
    .unwrap();
    assert_eq!(vuelta.content.background.source, BackgroundSource::Own);
    assert_eq!(vuelta.content.background.catalog_image_id, None);
}

#[test]
fn ca_he_02_hu03_ca05() {
    // HE-02-HU03-CA05 · Un formato distinto, o un archivo renombrado, se rechaza y nada se sube (ET10, RNF-22).
    let (base, servicio) = con_temas();
    let dir = carpeta();
    let casos = [
        ("texto.txt", b"hola".to_vec()),
        ("foto.gif", b"GIF89a".to_vec()),
        // Renombrados: la firma no es la de la extensión.
        ("texto.png", b"esto no es una imagen".to_vec()),
        ("png-como-jpg.jpg", png(3, 2)),
        ("jpg-como-png.png", jpeg()),
    ];
    for (nombre, contenido) in casos {
        let ruta = archivo(&dir, nombre, &contenido);
        let error = importar(&servicio, &base, &ruta, &dir.join("files")).unwrap_err();
        assert_eq!(error.code, ErrorCode::ImageFormatNotAllowed, "{nombre}");
        assert_eq!(
            error.message,
            "Formato no permitido. Selecciona imágenes JPG, JPEG o PNG."
        );
    }
    assert_eq!(contar(&base, "uploaded_image"), 0);
    assert_eq!(contar(&base, "file_upload_queue"), 0);
    assert!(!dir.join("files").exists(), "no se copió nada");
}

#[test]
fn ca_he_02_hu03_ca06() {
    // HE-02-HU03-CA06 · Más de 20 MB se rechaza; 20 MB justos se aceptan (ET04, RNF-23).
    let (base, servicio) = con_temas();
    let dir = carpeta();
    let mut grande = png(3, 2);
    grande.resize(usize::try_from(MAXIMO_DE_BYTES).unwrap() + 1, 0);
    let ruta = archivo(&dir, "grande.png", &grande);
    let error = importar(&servicio, &base, &ruta, &dir.join("files")).unwrap_err();
    assert_eq!(error.code, ErrorCode::ImageTooLarge);
    assert_eq!(error.message, "La imagen supera el tamaño máximo de 20 MB.");
    assert_eq!(contar(&base, "uploaded_image"), 0);
    // En el límite: el cierre del PNG va al final, así que se arma un JPEG con relleno de ceros.
    let mut justo = jpeg();
    justo.resize(usize::try_from(MAXIMO_DE_BYTES).unwrap(), 0);
    let ruta = archivo(&dir, "justo.jpg", &justo);
    assert!(importar(&servicio, &base, &ruta, &dir.join("files")).is_ok());
}

#[test]
fn ca_he_02_hu03_ca07() {
    // HE-02-HU03-CA07 · Un archivo con extensión válida que no se puede leer se rechaza (ET10).
    let (base, servicio) = con_temas();
    let dir = carpeta();
    let mut png_cortado = png(3, 2);
    png_cortado.truncate(30);
    let mut jpeg_cortado = jpeg();
    jpeg_cortado.truncate(10);
    let casos = [
        ("vacio.png", Vec::new()),
        ("cortado.png", png_cortado),
        ("cortado.jpg", jpeg_cortado),
        ("sin-medidas.png", png(0, 0)),
    ];
    for (nombre, contenido) in casos {
        let ruta = archivo(&dir, nombre, &contenido);
        let error = importar(&servicio, &base, &ruta, &dir.join("files")).unwrap_err();
        assert_eq!(error.code, ErrorCode::ImageUnreadable, "{nombre}");
        assert_eq!(
            error.message,
            "No pudimos leer la imagen. Verifica que el archivo no esté dañado."
        );
    }
    // Un archivo que ya no existe tampoco se puede leer.
    let error = importar(
        &servicio,
        &base,
        &dir.join("borrado.png").to_string_lossy(),
        &dir.join("files"),
    )
    .unwrap_err();
    assert_eq!(error.code, ErrorCode::ImageUnreadable);
    assert_eq!(contar(&base, "uploaded_image"), 0);
}

#[test]
fn imagen_propia_de_otra_cuenta_no_es_un_fondo_valido() {
    // HE-02-HU03-ET03 · La imagen propia debe ser de quien edita.
    let (base, servicio) = con_temas();
    let error = bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &fondo_propio(&Uuid("00000000-0000-4000-8000-0000000000ff".into())),
    ))
    .unwrap_err();
    assert_eq!(error.code, ErrorCode::ImageNotFound);
}
