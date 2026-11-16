//! Pruebas del Núcleo de HE-02-HU12 (aplicar al escritorio los cambios de la vista previa).

use super::escritorio::Carpetas;
use super::pruebas_de_plantillas::{cambio, con_otra_plantilla};
use super::pruebas_del_tema_en_edicion::{MI_TEMA, OTRO_TEMA, T, editar_un_color};
use super::*;
use crate::servicio_de_sesion::ConMensaje;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{ApplyMode, ThemeIdResult, WallpaperState};

const AHORA_MS: i64 = 1_793_600_000_000;

fn aplicar(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    modo: ApplyMode,
) -> Result<ConMensaje<ThemeIdResult>, AppError> {
    bloquear(servicio.aplicar_borrador(base, USUARIO, &modo, AHORA_MS))
}

fn copia_aplicada(base: &BaseLocal) -> (String, ThemeContent) {
    bloquear(ServicioDePersonalizacion::aplicado(base, USUARIO))
        .unwrap()
        .unwrap()
}

fn guardado(base: &BaseLocal, id: &str) -> ThemeContent {
    bloquear(ServicioDePersonalizacion::guardado(base, USUARIO, id))
        .unwrap()
        .unwrap()
        .1
}

fn pendiente_de_la_copia(base: &BaseLocal) -> i64 {
    bloquear(async {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM pending_change WHERE entity_kind = 'applied_theme' AND entity_id = ?",
        )
        .bind(USUARIO)
        .fetch_one(base.pool().await.unwrap())
        .await
        .unwrap()
    })
}

/// Abre «Verano» (que no es el aplicado) y le cambia algo con `editar`.
fn verano_con(editar: impl FnOnce(&mut ThemeContent)) -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    servicio.edicion_de_prueba(editar);
    (base, servicio)
}

/// El comportamiento general de «Aplicar» (ET07): con cambios sin guardar, `apply` pide M-15 y
/// `apply_without_saving` lleva los cambios al escritorio sin tocar el tema guardado.
fn aplicar_sin_guardar_lleva(
    base: &BaseLocal,
    servicio: &ServicioDePersonalizacion,
) -> ThemeContent {
    let error = aplicar(servicio, base, ApplyMode::Apply).unwrap_err();
    assert_eq!(error.code, ErrorCode::DraftUnsavedChangesOnApply);
    aplicar(servicio, base, ApplyMode::ApplyWithoutSaving).unwrap();
    let (id, copia) = copia_aplicada(base);
    assert_eq!(id, OTRO_TEMA);
    copia
}

#[test]
fn ca_he_02_hu12_ca01() {
    // HE-02-HU12-CA01 · Aplicar un tema sin cambios sin guardar: va al escritorio y queda como tema aplicado (ET01).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    let resultado = aplicar(&servicio, &base, ApplyMode::Apply).unwrap();
    assert_eq!(resultado.mensaje.message, "Tema “Verano” aplicado.");
    assert_eq!(resultado.valor.theme_id.0, OTRO_TEMA);
    let (id, copia) = copia_aplicada(&base);
    assert_eq!(id, OTRO_TEMA);
    assert_eq!(copia.colors.primary.0, "#DCBA04");
    // La copia viaja a la nube (D-189).
    assert_eq!(pendiente_de_la_copia(&base), 1);
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let verano = temas.iter().find(|t| t.id.0 == OTRO_TEMA).unwrap();
    assert!(verano.is_applied && !verano.has_unapplied_changes);
}

#[test]
fn ca_he_02_hu12_ca02() {
    // HE-02-HU12-CA02 · Con cambios sin guardar, «Aplicar» pide M-15 y no toca el escritorio ni el tema (ET02, ET03).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    editar_un_color(&servicio);
    let error = aplicar(&servicio, &base, ApplyMode::Apply).unwrap_err();
    assert_eq!(error.code, ErrorCode::DraftUnsavedChangesOnApply);
    assert_eq!(
        error.message,
        "Tienes cambios sin guardar en el tema “Verano”. ¿Qué deseas hacer?"
    );
    assert_eq!(copia_aplicada(&base).0, MI_TEMA);
    assert_eq!(guardado(&base, OTRO_TEMA).colors.primary.0, "#DCBA04");
    assert_eq!(pendiente_de_la_copia(&base), 0);
}

#[test]
fn ca_he_02_hu12_ca03() {
    // HE-02-HU12-CA03 · «Guardar y aplicar» conserva los cambios en el tema y lo aplica.
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    editar_un_color(&servicio);
    let resultado = aplicar(&servicio, &base, ApplyMode::SaveAndApply).unwrap();
    assert_eq!(
        resultado.mensaje.message,
        "Tema “Verano” guardado y aplicado."
    );
    assert_eq!(guardado(&base, OTRO_TEMA).colors.primary.0, "#112233");
    let (id, copia) = copia_aplicada(&base);
    assert_eq!(
        (id.as_str(), copia.colors.primary.0.as_str()),
        (OTRO_TEMA, "#112233")
    );
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(!vista.dirty && !vista.applied_unsaved);
}

#[test]
fn ca_he_02_hu12_ca04() {
    // HE-02-HU12-CA04 · «Aplicar sin guardar» lleva la vista previa al escritorio, no modifica el tema guardado y
    // lo marca con «Cambios sin guardar» (ET04).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    editar_un_color(&servicio);
    let resultado = aplicar(&servicio, &base, ApplyMode::ApplyWithoutSaving).unwrap();
    assert_eq!(
        resultado.mensaje.message,
        "Cambios aplicados. Recuerda guardarlos para no perderlos."
    );
    assert_eq!(copia_aplicada(&base).1.colors.primary.0, "#112233");
    assert_eq!(guardado(&base, OTRO_TEMA).colors.primary.0, "#DCBA04");
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(vista.dirty && vista.applied_unsaved);
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let verano = temas.iter().find(|t| t.id.0 == OTRO_TEMA).unwrap();
    assert!(verano.is_applied && verano.has_unsaved_changes);
}

#[test]
fn ca_he_02_hu12_ca05() {
    // HE-02-HU12-CA05 · Al aplicar, lo que lee la capa ya es lo aplicado, sin reiniciar (ET05; el aviso a la capa
    // es EV-16 y se mide en el escritorio con cronómetro, RNF-01).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    editar_un_color(&servicio);
    aplicar(&servicio, &base, ApplyMode::SaveAndApply).unwrap();
    let carpetas = Carpetas {
        archivos: std::env::temp_dir().join("windgets-hu12-ca05"),
        recursos: std::env::temp_dir().join("windgets-hu12-ca05"),
    };
    let dir = carpetas.recursos.join("assets/templates/default");
    std::fs::create_dir_all(&dir).unwrap();
    std::fs::write(dir.join("background.jpg"), b"jpg").unwrap();
    let capa = bloquear(servicio.estado_de_la_capa(
        &base,
        USUARIO,
        &carpetas,
        Vec::new(),
        WallpaperState::Ok,
    ))
    .unwrap();
    assert_eq!(capa.wallpaper_state, WallpaperState::Ok);
    assert_eq!(capa.applied.colors.primary.0, "#112233");
    let aplicado = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(aplicado.theme_id.0, OTRO_TEMA);
}

#[test]
fn ca_he_02_hu12_ca06() {
    // HE-02-HU12-CA06 · El tema aplicado sin cambios no se vuelve a aplicar: «Este tema ya está aplicado.» (ET06).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    let error = aplicar(&servicio, &base, ApplyMode::Apply).unwrap_err();
    assert_eq!(error.code, ErrorCode::ThemeAlreadyApplied);
    assert_eq!(error.message, "Este tema ya está aplicado.");
    assert_eq!(pendiente_de_la_copia(&base), 0);
}

#[test]
fn ca_he_02_hu12_ca07() {
    // HE-02-HU12-CA07 · Aplicar la plantilla: el wallpaper muestra la plantilla seleccionada (ET07).
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &cambio("minimal"))).unwrap();
    let copia = aplicar_sin_guardar_lleva(&base, &servicio);
    assert_eq!(copia.template_id, "minimal");
}

#[test]
fn ca_he_02_hu12_ca08() {
    // HE-02-HU12-CA08 · Aplicar la imagen de fondo: el wallpaper muestra la plantilla con esa imagen.
    let (base, servicio) = verano_con(|c| {
        c.background = ThemeBackground {
            source: BackgroundSource::Catalog,
            catalog_image_id: Some("mar".into()),
            uploaded_image_id: None,
        }
    });
    bloquear(async {
        sqlx::query(
            "INSERT INTO catalog_image (id, name, storage_path, thumbnail_path, width, height, sort_order, fetched_at) \
             VALUES ('mar', 'Mar', 'images/mar.jpg', 'images/mar-t.jpg', 100, 100, 1, ?)",
        )
        .bind(T)
        .execute(base.pool().await.unwrap())
        .await
        .unwrap();
    });
    let copia = aplicar_sin_guardar_lleva(&base, &servicio);
    assert_eq!(copia.background.source, BackgroundSource::Catalog);
    assert_eq!(copia.background.catalog_image_id.as_deref(), Some("mar"));
}

#[test]
fn ca_he_02_hu12_ca09() {
    // HE-02-HU12-CA09 · Aplicar los colores del tema: la copia aplicada trae los tres colores nuevos.
    let (base, servicio) = verano_con(|c| {
        c.colors = ThemeColors {
            primary: Hex("#ABCDEF".into()),
            secondary: Hex("#123456".into()),
            text: Hex("#000000".into()),
        }
    });
    let copia = aplicar_sin_guardar_lleva(&base, &servicio);
    assert_eq!(
        [
            copia.colors.primary.0,
            copia.colors.secondary.0,
            copia.colors.text.0
        ],
        ["#ABCDEF", "#123456", "#000000"]
    );
}

#[test]
fn ca_he_02_hu12_ca10() {
    // HE-02-HU12-CA10 · Aplicar la tipografía: la copia aplicada trae la fuente y el tamaño nuevos.
    let (base, servicio) = verano_con(|c| c.font.size = FontSize::Large);
    let copia = aplicar_sin_guardar_lleva(&base, &servicio);
    assert_eq!(copia.font.size, FontSize::Large);
    assert_eq!(copia.font.id, "nunito");
}

#[test]
fn ca_he_02_hu12_ca11() {
    // HE-02-HU12-CA11 · Aplicar la paleta: el wallpaper muestra los colores que define la paleta. La copia
    // aplicada no guarda la paleta (`applied_theme`), solo sus colores.
    let (base, servicio) = verano_con(|c| {
        c.palette_id = Some("bosque".into());
        c.colors.primary = Hex("#2E7D32".into());
    });
    let copia = aplicar_sin_guardar_lleva(&base, &servicio);
    assert_eq!(copia.colors.primary.0, "#2E7D32");
    assert_eq!(copia.palette_id, None);
    // Sin la paleta en la copia, el mismo contenido cuenta como ya aplicado.
    let borrador = servicio.con_borrador(|b| b.clone()).unwrap();
    assert!(es_la_misma_copia(&copia, &borrador.contenido));
}

#[test]
fn el_tema_inicial_virtual_se_crea_al_aplicar_sin_guardar_sus_cambios() {
    // DUDA HE-02-HU12: sin temas locales, el tema inicial se crea con lo guardado y la copia lleva la vista previa.
    let base = BaseLocal::en_memoria();
    let servicio = ServicioDePersonalizacion::nuevo();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        for sql in [
            "INSERT INTO profile (user_id, alias, created_at) VALUES (?1, 'Prueba', ?2)",
            "INSERT INTO catalog_font (id, family_name, display_name, file_path, license, fetched_at) \
             VALUES ('nunito', 'Nunito', 'Nunito', 'fonts/nunito.woff2', 'OFL-1.1', ?2)",
        ] {
            sqlx::query(sql)
                .bind(USUARIO)
                .bind(T)
                .execute(pool)
                .await
                .unwrap();
        }
        sqlx::query(
            "INSERT INTO catalog_template (id, name, thumbnail_path, bundle_path, default_background_path, \
             default_color_primary, default_color_secondary, default_color_text, default_font_id, is_default, fetched_at) \
             VALUES ('default', 'Windgets', 't', 'b/', 'b.jpg', '#96B2B2', '#829890', '#14201C', 'nunito', 1, ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
    });
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    editar_un_color(&servicio);
    let resultado = aplicar(&servicio, &base, ApplyMode::ApplyWithoutSaving).unwrap();
    let id = resultado.valor.theme_id.0;
    assert_ne!(id, TEMA_INICIAL_VIRTUAL);
    assert_eq!(guardado(&base, &id).colors.primary.0, "#96B2B2");
    assert_eq!(copia_aplicada(&base).1.colors.primary.0, "#112233");
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(vista.dirty && vista.applied_unsaved);
}

#[test]
fn guardar_despues_de_aplicar_sin_guardar_quita_la_marca() {
    // ET04: la marca «Cambios sin guardar» dura hasta que los cambios aplicados se guardan en el tema.
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, Some(OTRO_TEMA))).unwrap();
    editar_un_color(&servicio);
    aplicar(&servicio, &base, ApplyMode::ApplyWithoutSaving).unwrap();
    bloquear(servicio.guardar_borrador(&base, USUARIO, AHORA_MS)).unwrap();
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(!vista.dirty && !vista.applied_unsaved);
    // Lo aplicado y lo guardado coinciden: el tema ya está aplicado (CA06).
    let error = aplicar(&servicio, &base, ApplyMode::Apply).unwrap_err();
    assert_eq!(error.code, ErrorCode::ThemeAlreadyApplied);
}

#[test]
fn sin_la_primera_descarga_aplicar_y_guardar_avisan_sin_el_error_generico() {
    // Regla de errores visibles: sin el perfil ni la plantilla locales (antes de sync_pull y catalog_pull), la
    // clave foránea fallaría; el Núcleo responde `service.unavailable` con su mensaje.
    let base = BaseLocal::en_memoria();
    let servicio = ServicioDePersonalizacion::nuevo();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    editar_un_color(&servicio);
    for modo in [ApplyMode::SaveAndApply, ApplyMode::ApplyWithoutSaving] {
        let error = aplicar(&servicio, &base, modo).unwrap_err();
        assert_eq!(error.code, ErrorCode::ServiceUnavailable);
        assert_eq!(
            error.message,
            "No pudimos completar la operación. Intenta de nuevo más tarde."
        );
    }
    let error = bloquear(servicio.guardar_borrador(&base, USUARIO, AHORA_MS)).unwrap_err();
    assert_eq!(error.code, ErrorCode::ServiceUnavailable);
}
