//! Pruebas del Núcleo de HE-02-HU10 (seleccionar el tema en edición).

use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

const MI_TEMA: &str = "00000000-0000-4000-8000-0000000000a1";
const OTRO_TEMA: &str = "00000000-0000-4000-8000-0000000000a2";
const T: &str = "2026-11-01T00:00:00.000Z";

/// La cuenta con dos temas: «Mi tema» (aplicado) y «Verano», más la plantilla por defecto.
fn con_temas() -> (BaseLocal, ServicioDePersonalizacion) {
    let base = BaseLocal::en_memoria();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query("INSERT INTO profile (user_id, alias, created_at) VALUES (?, 'Prueba', ?)")
            .bind(USUARIO)
            .bind(T)
            .execute(pool)
            .await
            .unwrap();
        sqlx::query(
            "INSERT INTO catalog_font (id, family_name, display_name, file_path, license, fetched_at) \
             VALUES ('nunito', 'Nunito', 'Nunito', 'fonts/nunito.woff2', 'OFL-1.1', ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO catalog_template (id, name, thumbnail_path, bundle_path, default_background_path, \
             default_color_primary, default_color_secondary, default_color_text, default_font_id, is_default, fetched_at) \
             VALUES ('default', 'Windgets', 't', 'b/', 'b.jpg', '#96B2B2', '#829890', '#14201C', 'nunito', 1, ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
        for (id, nombre, primario, modificado) in [
            (MI_TEMA, "Mi tema", "#96B2B2", "2026-11-02T00:00:00.000Z"),
            (OTRO_TEMA, "Verano", "#DCBA04", "2026-11-03T00:00:00.000Z"),
        ] {
            sqlx::query(
                "INSERT INTO theme (id, user_id, created_at, name, template_id, color_primary, color_secondary, \
                 color_text, font_id, last_modified_at) VALUES (?, ?, ?, ?, 'default', ?, '#829890', '#14201C', 'nunito', ?)",
            )
            .bind(id)
            .bind(USUARIO)
            .bind(T)
            .bind(nombre)
            .bind(primario)
            .bind(modificado)
            .execute(pool)
            .await
            .unwrap();
        }
        sqlx::query(
            "INSERT INTO applied_theme (id, user_id, created_at, theme_id, template_id, color_primary, \
             color_secondary, color_text, font_id, applied_at) \
             VALUES (?, ?, ?, ?, 'default', '#96B2B2', '#829890', '#14201C', 'nunito', ?)",
        )
        .bind(USUARIO)
        .bind(USUARIO)
        .bind(T)
        .bind(MI_TEMA)
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
    });
    (base, ServicioDePersonalizacion::nuevo())
}

fn editar_un_color(servicio: &ServicioDePersonalizacion) {
    servicio.edicion_de_prueba(|c| c.colors.primary = Hex("#112233".into()));
}

#[test]
fn ca_he_02_hu10_ca01() {
    // HE-02-HU10-CA01 · Al abrir la pantalla se edita el tema aplicado, con su nombre y sin cambios (ET01, ET02).
    let (base, servicio) = con_temas();
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.theme_id.0, MI_TEMA);
    assert_eq!(vista.name, "Mi tema");
    assert_eq!(vista.content.colors.primary.0, "#96B2B2");
    assert!(!vista.dirty && !vista.applied_unsaved);
    // La lista «Tema en edición» trae los dos temas, el más reciente primero.
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let nombres: Vec<_> = temas.iter().map(|t| t.name.as_str()).collect();
    assert_eq!(nombres, ["Verano", "Mi tema"]);
    assert!(temas[1].is_applied && !temas[0].is_applied);
}

#[test]
fn ca_he_02_hu10_ca02() {
    // HE-02-HU10-CA02 · Sin cambios, otro tema pasa a ser el tema en edición y el escritorio no cambia (ET03, ET04).
    let (base, servicio) = con_temas();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    let vista = bloquear(servicio.seleccionar_borrador(&base, USUARIO, OTRO_TEMA, false)).unwrap();
    assert_eq!(vista.name, "Verano");
    assert_eq!(vista.content.colors.primary.0, "#DCBA04");
    let aplicado = bloquear(ServicioDePersonalizacion::aplicado(&base, USUARIO))
        .unwrap()
        .unwrap();
    assert_eq!(aplicado.0, MI_TEMA, "el tema aplicado sigue igual");
}

#[test]
fn ca_he_02_hu10_ca03() {
    // HE-02-HU10-CA03 · Con cambios sin guardar, cambiar de tema pide confirmar (ET06) con el mensaje literal.
    let (base, servicio) = con_temas();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    editar_un_color(&servicio);
    let error =
        bloquear(servicio.seleccionar_borrador(&base, USUARIO, OTRO_TEMA, false)).unwrap_err();
    assert_eq!(error.code, ErrorCode::DraftUnsavedChanges);
    assert_eq!(
        error.message,
        "Tienes cambios sin guardar en el tema “Mi tema”. ¿Deseas cambiar de tema sin guardarlos?"
    );
}

#[test]
fn ca_he_02_hu10_ca04() {
    // HE-02-HU10-CA04 · «Cambiar sin guardar» descarta los cambios del tema anterior y muestra el nuevo.
    let (base, servicio) = con_temas();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    editar_un_color(&servicio);
    let vista = bloquear(servicio.seleccionar_borrador(&base, USUARIO, OTRO_TEMA, true)).unwrap();
    assert_eq!(vista.name, "Verano");
    assert!(!vista.dirty);
    // Al volver al primero, sus cambios ya no están.
    let vuelta = bloquear(servicio.seleccionar_borrador(&base, USUARIO, MI_TEMA, false)).unwrap();
    assert_eq!(vuelta.content.colors.primary.0, "#96B2B2");
}

#[test]
fn ca_he_02_hu10_ca05() {
    // HE-02-HU10-CA05 · Primer inicio de sesión: el tema en edición es «Mi tema», con la plantilla por defecto (ET05).
    let base = BaseLocal::en_memoria();
    let servicio = ServicioDePersonalizacion::nuevo();
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.name, "Mi tema");
    assert_eq!(vista.content.template_id, "default");
    assert_eq!(
        vista.content.background.source,
        BackgroundSource::TemplateDefault
    );
    assert_eq!(vista.content.font.size, FontSize::Medium);
    assert!(!vista.dirty);
}

#[test]
fn ca_he_02_hu10_ca06() {
    // HE-02-HU10-CA06 · «Seguir editando»: la vista no repite la llamada; el borrador conserva sus cambios.
    let (base, servicio) = con_temas();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    editar_un_color(&servicio);
    bloquear(servicio.seleccionar_borrador(&base, USUARIO, OTRO_TEMA, false)).unwrap_err();
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.name, "Mi tema");
    assert_eq!(vista.content.colors.primary.0, "#112233");
    assert!(vista.dirty);
}
