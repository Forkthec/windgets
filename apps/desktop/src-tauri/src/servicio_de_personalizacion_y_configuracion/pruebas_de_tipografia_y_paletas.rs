//! Pruebas del Núcleo de HE-02-HU06 (fuente y tamaño del texto) y HE-02-HU07 (paletas).

use super::pruebas_de_colores::primario;
use super::pruebas_del_tema_en_edicion::{T, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

/// La cuenta de `con_temas`, con Inter en el catálogo de tipografías y dos paletas.
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
        for (id, nombre, p, s, x, orden) in [
            ("oceano", "Océano", "#0b3954", "#087E8B", "#F5F5F5", 2),
            ("bosque", "Bosque", "#2D6A4F", "#40916C", "#081C15", 1),
        ] {
            sqlx::query(
                "INSERT INTO catalog_palette (id, name, color_primary, color_secondary, color_text, sort_order, fetched_at) \
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(id)
            .bind(nombre)
            .bind(p)
            .bind(s)
            .bind(x)
            .bind(orden)
            .bind(T)
            .execute(pool)
            .await
            .unwrap();
        }
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

#[test]
fn ca_he_02_hu07_ca01() {
    // HE-02-HU07-CA01 · El catálogo de paletas con sus tres colores; una paleta pone los tres colores y nada más
    // (ET01, ET02, ET04).
    let (base, servicio) = con_catalogos();
    let paletas = bloquear(servicio.paletas(&base)).unwrap();
    let nombres: Vec<_> = paletas.iter().map(|p| p.name.as_str()).collect();
    assert_eq!(nombres, ["Bosque", "Océano"]);
    assert_eq!(paletas[1].color_primary, Some(Hex("#0B3954".into())));
    let antes = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    let vista = bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &ThemeDraftPatch {
            palette_id: Some(Some("oceano".into())),
            ..parche()
        },
    ))
    .unwrap();
    assert_eq!(
        vista.content.colors,
        ThemeColors {
            primary: Hex("#0B3954".into()),
            secondary: Hex("#087E8B".into()),
            text: Hex("#F5F5F5".into()),
        }
    );
    assert_eq!(vista.content.palette_id.as_deref(), Some("oceano"));
    assert_eq!(vista.content.template_id, antes.content.template_id);
    assert_eq!(vista.content.background, antes.content.background);
    assert_eq!(vista.content.font, antes.content.font);
}

#[test]
fn ca_he_02_hu07_ca02() {
    // HE-02-HU07-CA02 · Cambiar un color después de elegir una paleta la deja en «Personalizada» (ET03).
    let (base, servicio) = con_catalogos();
    bloquear(servicio.actualizar_borrador(
        &base,
        USUARIO,
        &ThemeDraftPatch {
            palette_id: Some(Some("bosque".into())),
            ..parche()
        },
    ))
    .unwrap();
    let vista =
        bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#334455"))).unwrap();
    assert_eq!(vista.content.colors.primary, Hex("#334455".into()));
    assert_eq!(vista.content.colors.secondary, Hex("#40916C".into()));
    assert_eq!(vista.content.palette_id, None);
}
