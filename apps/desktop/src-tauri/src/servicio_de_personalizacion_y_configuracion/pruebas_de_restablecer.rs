//! Pruebas del Núcleo de HE-02-HU08 (restablecer los colores y la tipografía del tema).

use super::pruebas_de_colores::{primario, texto};
use super::pruebas_del_tema_en_edicion::{T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

/// La cuenta de `con_temas` con la plantilla «Minimal» (otros colores y otra fuente) en el tema en edición.
fn con_minimal() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_temas();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query(
            "INSERT INTO catalog_font (id, family_name, display_name, file_path, license, fetched_at) \
             VALUES ('inter', 'Inter', 'Inter', 'fonts/inter.woff2', 'OFL-1.1', ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO catalog_template (id, name, thumbnail_path, bundle_path, default_background_path, \
             default_color_primary, default_color_secondary, default_color_text, default_font_id, is_default, fetched_at) \
             VALUES ('minimal', 'Minimal', 't', 'b/', 'b.jpg', '#f5f5f5', '#222222', '#111111', 'inter', 0, ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
    });
    bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &ThemeDraftPatch {
            template_id: Some("minimal".into()),
            background: None,
            colors: None,
            palette_id: None,
            font_id: Some("nunito".into()),
            font_size: Some(FontSize::Large),
        },
    ))
    .unwrap();
    (base, servicio)
}

#[test]
fn ca_he_02_hu08_ca01() {
    // HE-02-HU08-CA01 · Los colores modificados vuelven a los de la plantilla del tema en edición (ET01).
    let (base, servicio) = con_minimal();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#123456"))).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &texto("#ABCDEF"))).unwrap();
    let vista =
        bloquear(servicio.restablecer_borrador(&base, USUARIO, &ThemeDraftResetParamsPart::Colors))
            .unwrap();
    assert_eq!(
        vista.content.colors,
        ThemeColors {
            primary: Hex("#F5F5F5".into()),
            secondary: Hex("#222222".into()),
            text: Hex("#111111".into()),
        }
    );
    // La tipografía no cambia.
    assert_eq!(vista.content.font.size, FontSize::Large);
}

#[test]
fn ca_he_02_hu08_ca02() {
    // HE-02-HU08-CA02 · La tipografía vuelve a la fuente de la plantilla y al tamaño «Mediano» (ET02).
    let (base, servicio) = con_minimal();
    let vista = bloquear(servicio.restablecer_borrador(
        &base,
        USUARIO,
        &ThemeDraftResetParamsPart::Typography,
    ))
    .unwrap();
    assert_eq!(
        vista.content.font,
        ThemeContentFont {
            id: "inter".into(),
            size: FontSize::Medium,
        }
    );
    // Los colores no cambian.
    assert_eq!(vista.content.template_id, "minimal");
}
