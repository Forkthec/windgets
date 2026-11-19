//! Pruebas del Núcleo de HE-04-HU07 (agregar el widget Imagen estática). La vista tiene las suyas en
//! Widgets.test.tsx y en ImagenEstatica.test.tsx.

use super::pruebas_de_imagenes::{archivo, carpeta, jpeg, png};
use super::pruebas_de_widgets::{con_widgets_por_defecto, lista};
use super::pruebas_del_tema_en_edicion::T;
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{ImageRef, ImageSource, ImportPurpose, WidgetConfig};

const AHORA_MS: i64 = 1_794_657_600_000;

fn con_catalogo() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_widgets_por_defecto();
    bloquear(async {
        sqlx::query(
            "INSERT INTO catalog_image (id, name, storage_path, thumbnail_path, width, height, sort_order, fetched_at) \
             VALUES ('mar', 'Mar', 'i/mar.jpg', 'i/mar-t.jpg', 1920, 1080, 1, ?)",
        )
        .bind(T)
        .execute(base.pool().await.unwrap())
        .await
        .unwrap();
    });
    (base, servicio)
}

fn importar(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    nombre: &str,
    contenido: &[u8],
) -> Result<crate::tipos::ImageImportResult, AppError> {
    let dir = carpeta();
    let ruta = archivo(&dir, nombre, contenido);
    bloquear(servicio.importar_imagen(
        base,
        USUARIO,
        &ruta,
        &ImportPurpose::StaticImage,
        &dir.join("files"),
        AHORA_MS,
    ))
}

fn rectangulo(base: &BaseLocal, widget_id: &str) -> (i64, i64, i64, i64) {
    bloquear(async {
        sqlx::query_as("SELECT x, y, width, height FROM theme_widget WHERE widget_id = ?")
            .bind(widget_id)
            .fetch_one(base.pool().await.unwrap())
            .await
            .unwrap()
    })
}

#[test]
fn ca_he_04_hu07_ca01() {
    // HE-04-HU07-CA01 · Con una imagen propia JPG: agrega y activa el widget de 320 × 180 en la primera posición
    // libre (ET02, ET06).
    let (base, servicio) = con_catalogo();
    let subida = importar(&servicio, &base, "foto.jpg", &jpeg()).unwrap();
    let imagen = ImageRef {
        source: ImageSource::Own,
        catalog_image_id: None,
        uploaded_image_id: Some(subida.uploaded_image_id.clone()),
    };
    let w = bloquear(servicio.agregar_imagen_estatica(&base, USUARIO, &imagen, AHORA_MS)).unwrap();
    assert!(w.is_active);
    assert_eq!(w.display_name, "Imagen estática");
    assert_eq!(
        w.config,
        WidgetConfig::StaticImageConfig(crate::tipos::StaticImageConfig {
            base_image_ref: imagen
        })
    );
    assert_eq!(rectangulo(&base, &w.widget_id.0), (1400, 0, 320, 180));
    assert!(
        lista(&base, &servicio)
            .iter()
            .any(|x| x.widget_id == w.widget_id)
    );
}

#[test]
fn ca_he_04_hu07_ca02() {
    // HE-04-HU07-CA02 · Con una imagen del catálogo de imágenes (ET03); una que no está en el catálogo no se agrega.
    let (base, servicio) = con_catalogo();
    let imagen = ImageRef {
        source: ImageSource::Catalog,
        catalog_image_id: Some("mar".into()),
        uploaded_image_id: None,
    };
    let w = bloquear(servicio.agregar_imagen_estatica(&base, USUARIO, &imagen, AHORA_MS)).unwrap();
    assert_eq!(
        w.config,
        WidgetConfig::StaticImageConfig(crate::tipos::StaticImageConfig {
            base_image_ref: imagen
        })
    );
    let otra = ImageRef {
        source: ImageSource::Catalog,
        catalog_image_id: Some("no-existe".into()),
        uploaded_image_id: None,
    };
    assert_eq!(
        bloquear(servicio.agregar_imagen_estatica(&base, USUARIO, &otra, AHORA_MS))
            .unwrap_err()
            .code,
        ErrorCode::ImageNotFound
    );
}

#[test]
fn ca_he_04_hu07_ca03() {
    // HE-04-HU07-CA03 · «mapa.gif»: formato no permitido, no se acepta.
    let (base, servicio) = con_catalogo();
    let e = importar(&servicio, &base, "mapa.gif", b"GIF89a").unwrap_err();
    assert_eq!(e.code, ErrorCode::ImageFormatNotAllowed);
    assert_eq!(
        e.message,
        "Formato no permitido. Selecciona imágenes JPG, JPEG o PNG."
    );
}

#[test]
fn ca_he_04_hu07_ca04() {
    // HE-04-HU07-CA04 · «foto.png» de 25 MB: supera el máximo de 20 MB, no se acepta.
    let (base, servicio) = con_catalogo();
    let mut grande = png(3, 2);
    grande.resize(25 * 1024 * 1024, 0);
    let e = importar(&servicio, &base, "foto.png", &grande).unwrap_err();
    assert_eq!(e.code, ErrorCode::ImageTooLarge);
    assert_eq!(e.message, "La imagen supera el tamaño máximo de 20 MB.");
}
