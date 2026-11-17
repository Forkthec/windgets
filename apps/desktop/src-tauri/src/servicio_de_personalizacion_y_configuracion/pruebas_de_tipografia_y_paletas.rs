//! Pruebas del Núcleo de HE-02-HU06 (fuente y tamaño del texto).

use super::pruebas_del_tema_en_edicion::{T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

/// La cuenta de `con_temas`, con Inter en el catálogo de tipografías.
fn con_catalogos() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_temas();
    bloquear(async {
        let pool = base.pool().await.unwrap();
        sqlx::query(
            "INSERT INTO catalog_font (id, family_name, display_name, file_path, license, sort_order, fetched_at) \
             VALUES ('inter', 'Inter', 'Inter', 'fonts/inter.woff2', 'OFL-1.1', 1, ?)",
        )
        .bind(T)
        .execute(pool)
        .await
        .unwrap();
    });
    (base, servicio)
}

fn parche() -> ThemeDraftPatch {
    ThemeDraftPatch {
        template_id: None,
        background: None,
        colors: None,
        palette_id: None,
        font_id: None,
        font_size: None,
    }
}

#[test]
fn ca_he_02_hu06_ca01() {
    // HE-02-HU06-CA01 · El catálogo de tipografías por orden; elegir una fuente la pone en la vista previa (ET01 a
    // ET03).
    let (base, servicio) = con_catalogos();
    let fuentes = bloquear(servicio.fuentes(&base)).unwrap();
    let nombres: Vec<_> = fuentes.iter().map(|f| f.name.as_str()).collect();
    assert_eq!(nombres, ["Nunito", "Inter"]);
    let vista = bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &ThemeDraftPatch {
            font_id: Some("inter".into()),
            ..parche()
        },
    ))
    .unwrap();
    assert_eq!(vista.content.font.id, "inter");
    assert_eq!(vista.content.font.size, FontSize::Medium);
    assert!(vista.dirty);
    // Una fuente que no está en el catálogo no cambia nada (`font.not_found`, sin texto).
    let e = bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &ThemeDraftPatch {
            font_id: Some("comic".into()),
            ..parche()
        },
    ))
    .unwrap_err();
    assert_eq!(e.code, ErrorCode::FontNotFound);
}

#[test]
fn ca_he_02_hu06_ca02() {
    // HE-02-HU06-CA02 · Del tamaño mediano (por defecto) a otro tamaño (ET04).
    let (base, servicio) = con_catalogos();
    let antes = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(antes.content.font.size, FontSize::Medium);
    for tamano in [FontSize::Large, FontSize::Small] {
        let vista = bloquear(servicio.actualizar_borrador(
            &base,
            USUARIO,
            &ThemeDraftPatch {
                font_size: Some(tamano.clone()),
                ..parche()
            },
        ))
        .unwrap();
        assert_eq!(vista.content.font.size, tamano);
        assert_eq!(vista.content.font.id, "nunito");
    }
}
