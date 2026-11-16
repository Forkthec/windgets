//! Pruebas del Núcleo de HE-02-HU01 (consultar el wallpaper como fondo real de Windows).

use std::path::PathBuf;

use super::escritorio::Carpetas;
use super::pruebas_del_tema_en_edicion::{MI_TEMA, T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{AssetKind, AssetResolveResultState, Monitor, WallpaperState};

const IMAGEN: &str = "00000000-0000-4000-8000-0000000000b1";
const AVISO: &str = "No pudimos mostrar tu wallpaper. Se aplicó el wallpaper por defecto.";

/// Dos carpetas vacías en el disco: los archivos de la persona y los recursos del instalador, con la imagen
/// de la plantilla por defecto.
fn carpetas(nombre: &str) -> Carpetas {
    let raiz = std::env::temp_dir().join(format!(
        "windgets-escritorio-{nombre}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&raiz);
    let recursos = raiz.join("recursos");
    std::fs::create_dir_all(recursos.join("assets/templates/default")).unwrap();
    std::fs::write(
        recursos.join("assets/templates/default/background.jpg"),
        b"jpg",
    )
    .unwrap();
    let archivos = raiz.join("archivos");
    std::fs::create_dir_all(&archivos).unwrap();
    Carpetas { archivos, recursos }
}

fn monitor() -> Vec<Monitor> {
    vec![Monitor {
        id: "1".into(),
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        scale_factor: 1.0,
    }]
}

fn estado(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    carpetas: &Carpetas,
    host: WallpaperState,
) -> crate::tipos::LayerInitialState {
    bloquear(servicio.estado_de_la_capa(base, USUARIO, carpetas, monitor(), host)).unwrap()
}

fn aplicar_catalogo(base: &BaseLocal) {
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query(
            "INSERT INTO catalog_image (id, name, storage_path, thumbnail_path, width, height, sort_order, fetched_at) \
             VALUES ('mar', 'Mar', 'images/mar.jpg', 'images/mar-t.jpg', 100, 100, 1, ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
        sqlx::query(
            "UPDATE applied_theme SET background_source = 'catalog', background_catalog_image_id = 'mar' \
             WHERE user_id = ?",
        )
        .bind(USUARIO)
        .execute(pool)
        .await
        .unwrap();
    });
}

fn aplicar_propia(base: &BaseLocal) -> String {
    let relativa = format!("{USUARIO}/{IMAGEN}.png");
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query(
            "INSERT INTO uploaded_image (id, user_id, created_at, storage_path, mime_type, extension, size_bytes, \
             width, height, sha256) VALUES (?, ?, ?, ?, 'image/png', 'png', 3, 10, 10, ?)",
        )
        .bind(IMAGEN)
        .bind(USUARIO)
        .bind(T)
        .bind(&relativa)
        .bind("a".repeat(64))
        .execute(pool)
        .await
        .unwrap();
        sqlx::query(
            "UPDATE applied_theme SET background_source = 'own', background_uploaded_image_id = ? WHERE user_id = ?",
        )
        .bind(IMAGEN)
        .bind(USUARIO)
        .execute(pool)
        .await
        .unwrap();
    });
    relativa
}

fn escribir(carpetas: &Carpetas, relativa: &str) -> PathBuf {
    let ruta = carpetas.archivos.join(relativa);
    std::fs::create_dir_all(ruta.parent().unwrap()).unwrap();
    std::fs::write(&ruta, b"png").unwrap();
    ruta
}

#[test]
fn ca_he_02_hu01_ca01() {
    // HE-02-HU01-CA01 · Primer inicio de sesión: sin tema aplicado se muestra la plantilla por defecto (ET02).
    let (base, servicio) = con_temas();
    bloquear(async {
        sqlx::query("DELETE FROM applied_theme")
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    let carpetas = carpetas("ca01");
    let vista = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(vista.content.template_id, "default");
    assert_eq!(
        vista.content.background.source,
        BackgroundSource::TemplateDefault
    );
    assert!(!vista.has_unapplied_changes);
    let capa = estado(&servicio, &base, &carpetas, WallpaperState::Ok);
    assert_eq!(capa.wallpaper_state, WallpaperState::Ok);
    assert_eq!(capa.applied.colors.primary.0, "#96B2B2");
    assert_eq!(capa.monitors.len(), 1);
}

#[test]
fn ca_he_02_hu01_ca02() {
    // HE-02-HU01-CA02 · Con tema aplicado se pinta la copia aplicada, sin red (ET01, ET03).
    let (base, servicio) = con_temas();
    let carpetas = carpetas("ca02");
    let propia = aplicar_propia(&base);
    escribir(&carpetas, &propia);
    let vista = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(vista.theme_id.0, MI_TEMA);
    assert_eq!(vista.name, "Mi tema");
    let capa = estado(&servicio, &base, &carpetas, WallpaperState::Ok);
    assert_eq!(capa.wallpaper_state, WallpaperState::Ok);
    assert_eq!(capa.applied.background.source, BackgroundSource::Own);
    // El archivo se resuelve a una ruta local lista para pintar.
    let recurso =
        bloquear(servicio.recurso(&base, USUARIO, &carpetas, &AssetKind::UploadedImage, IMAGEN))
            .unwrap();
    assert_eq!(recurso.state, AssetResolveResultState::Ready);
    assert!(recurso.url.ends_with(".png"));
}

#[test]
fn ca_he_02_hu01_ca03() {
    // HE-02-HU01-CA03 · Un fondo del catálogo ya descargado se muestra tal cual (ET04).
    let (base, servicio) = con_temas();
    let carpetas = carpetas("ca03");
    aplicar_catalogo(&base);
    escribir(&carpetas, "images/mar.jpg");
    bloquear(async {
        sqlx::query(
            "INSERT INTO local_file (id, kind, ref_id, remote_path, local_path, size_bytes, sha256, downloaded_at, \
             last_used_at) VALUES ('f1', 'catalog_image', 'mar', 'images/mar.jpg', 'images/mar.jpg', 3, ?, ?, ?)",
        )
        .bind("b".repeat(64))
        .bind(T)
        .bind(T)
        .execute(base.pool().await.unwrap())
        .await
        .unwrap();
    });
    let capa = estado(&servicio, &base, &carpetas, WallpaperState::Ok);
    assert_eq!(capa.wallpaper_state, WallpaperState::Ok);
    assert_eq!(
        capa.applied.background.catalog_image_id.as_deref(),
        Some("mar")
    );
}

#[test]
fn ca_he_02_hu01_ca04() {
    // HE-02-HU01-CA04 · Si el wallpaper aplicado no se puede mostrar, se usa el de la plantilla por defecto y
    // el estado lo avisa (ET05, ET06).
    let (base, servicio) = con_temas();
    let carpetas = carpetas("ca04");
    aplicar_catalogo(&base);
    let capa = estado(&servicio, &base, &carpetas, WallpaperState::Ok);
    assert_eq!(capa.wallpaper_state, WallpaperState::FallbackDefault);
    assert_eq!(
        capa.applied.background.source,
        BackgroundSource::TemplateDefault
    );
    assert_eq!(capa.applied.template_id, "default");
    // El tema guardado y la copia aplicada no se tocan: solo cambia lo que se pinta.
    let aplicado = bloquear(ServicioDePersonalizacion::aplicado(&base, USUARIO))
        .unwrap()
        .unwrap();
    assert_eq!(aplicado.1.background.source, BackgroundSource::Catalog);
    assert_eq!(messages::NO_SE_PUDO_MOSTRAR_EL_WALLPAPER, AVISO);
}

#[test]
fn ca_he_02_hu01_ca05() {
    // HE-02-HU01-CA05 · Sin sesión la capa está oculta y no se avisa de ningún fallo (ET07).
    let (base, servicio) = con_temas();
    let carpetas = carpetas("ca05");
    aplicar_catalogo(&base);
    let capa = estado(&servicio, &base, &carpetas, WallpaperState::Hidden);
    assert_eq!(capa.wallpaper_state, WallpaperState::Hidden);
}

#[test]
fn un_archivo_que_falta_no_esta_disponible() {
    let (base, servicio) = con_temas();
    let carpetas = carpetas("falta");
    let recurso = bloquear(servicio.recurso(
        &base,
        USUARIO,
        &carpetas,
        &AssetKind::CatalogImage,
        "no-existe",
    ))
    .unwrap();
    assert_eq!(recurso.state, AssetResolveResultState::Unavailable);
    assert_eq!(recurso.url, "");
}

#[test]
fn la_plantilla_por_defecto_viene_en_el_instalador() {
    let (base, servicio) = con_temas();
    let carpetas = carpetas("plantilla");
    let recurso = bloquear(servicio.recurso(
        &base,
        USUARIO,
        &carpetas,
        &AssetKind::CatalogTemplate,
        "default",
    ))
    .unwrap();
    assert_eq!(recurso.state, AssetResolveResultState::Ready);
    assert!(recurso.url.ends_with("background.jpg"));
}
