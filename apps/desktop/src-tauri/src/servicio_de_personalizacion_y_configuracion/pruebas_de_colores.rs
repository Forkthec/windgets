//! Pruebas del Núcleo de HE-02-HU05 (cambiar los colores del tema) y de la legibilidad (R-13, RNF-26).

use super::legibilidad::{contraste_de_prueba, superficie_de_prueba};
use super::pruebas_del_tema_en_edicion::con_temas;
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::{LegibilityPair, ThemeDraftPatchColorsPrimaryLit, ThemeDraftPatchColorsTextLit};

/// Un parche solo de colores.
pub(super) fn colores(
    primario: Option<ThemeDraftPatchColorsPrimary>,
    secundario: Option<ThemeDraftPatchColorsSecondary>,
    texto: Option<ThemeDraftPatchColorsText>,
) -> ThemeDraftPatch {
    ThemeDraftPatch {
        template_id: None,
        background: None,
        colors: Some(ThemeDraftPatchColors {
            primary: primario,
            secondary: secundario,
            text: texto,
        }),
        palette_id: None,
        font_id: None,
        font_size: None,
    }
}

pub(super) fn primario(hex: &str) -> ThemeDraftPatch {
    colores(
        Some(ThemeDraftPatchColorsPrimary::Hex(Hex(hex.into()))),
        None,
        None,
    )
}

fn secundario(hex: &str) -> ThemeDraftPatch {
    colores(
        None,
        Some(ThemeDraftPatchColorsSecondary::Hex(Hex(hex.into()))),
        None,
    )
}

pub(super) fn texto(hex: &str) -> ThemeDraftPatch {
    colores(
        None,
        None,
        Some(ThemeDraftPatchColorsText::Hex(Hex(hex.into()))),
    )
}

fn cambiar(
    patch: &ThemeDraftPatch,
) -> (
    BaseLocal,
    ServicioDePersonalizacion,
    Result<ThemeDraftView, AppError>,
) {
    let (base, servicio) = con_temas();
    let r = bloquear(servicio.actualizar_borrador(&base, USUARIO, patch));
    (base, servicio, r)
}

#[test]
fn ca_he_02_hu05_ca01() {
    // HE-02-HU05-CA01 · El selector de colores cambia el color principal de la vista previa (ET02, ET03, ET13).
    let (_, _, r) = cambiar(&primario("#112233"));
    let vista = r.unwrap();
    assert_eq!(vista.content.colors.primary, Hex("#112233".into()));
    // Los otros dos colores siguen; la paleta pasa a «Personalizada».
    assert_eq!(vista.content.colors.secondary, Hex("#829890".into()));
    assert_eq!(vista.content.colors.text, Hex("#14201C".into()));
    assert_eq!(vista.content.palette_id, None);
    assert!(vista.dirty);
    // ET10: los colores del tema no tocan etiquetas ni columnas: el parche solo cambia el borrador del tema.
}

#[test]
fn ca_he_02_hu05_ca02() {
    // HE-02-HU05-CA02 · Un valor #RRGGBB se acepta y se muestra en mayúsculas (ET04, ET13).
    let (_, _, r) = cambiar(&secundario(" #a1b2c3 "));
    assert_eq!(r.unwrap().content.colors.secondary, Hex("#A1B2C3".into()));
}

#[test]
fn ca_he_02_hu05_ca03() {
    // HE-02-HU05-CA03 · Un valor que no es #RRGGBB no cambia la vista previa y responde su mensaje de campo (ET05).
    for malo in ["#12345G", "123456", "#123", "#1234567", "azul"] {
        let (base, servicio, r) = cambiar(&primario(malo));
        let e = r.unwrap_err();
        assert_eq!(e.code, ErrorCode::ColorInvalid, "{malo}");
        assert_eq!(
            e.message,
            "Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C)."
        );
        assert_eq!(e.field.as_deref(), Some("primary"));
        let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
        assert_eq!(vista.content.colors.primary, Hex("#96B2B2".into()));
        assert!(!vista.dirty);
    }
}

#[test]
fn ca_he_02_hu05_ca04() {
    // HE-02-HU05-CA04 · Un color vacío responde «Este campo es obligatorio.» en su campo (ET06).
    let (base, servicio, r) = cambiar(&colores(
        None,
        None,
        Some(ThemeDraftPatchColorsText::Lit(
            ThemeDraftPatchColorsTextLit::Empty,
        )),
    ));
    let e = r.unwrap_err();
    assert_eq!(e.code, ErrorCode::ColorRequired);
    assert_eq!(e.message, "Este campo es obligatorio.");
    assert_eq!(e.field.as_deref(), Some("text"));
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.content.colors.text, Hex("#14201C".into()));
    // También el principal.
    let (_, _, r) = cambiar(&colores(
        Some(ThemeDraftPatchColorsPrimary::Lit(
            ThemeDraftPatchColorsPrimaryLit::Empty,
        )),
        None,
        None,
    ));
    assert_eq!(r.unwrap_err().field.as_deref(), Some("primary"));
}

#[test]
fn ca_he_02_hu05_ca05() {
    // HE-02-HU05-CA05 · Poco contraste: aviso con los pares, un color sugerido que cumple y sin bloquear (ET07,
    // ET08, ET14, ET15).
    let (base, servicio, r) = cambiar(&texto("#777777"));
    let vista = r.unwrap();
    assert!(!vista.legibility.ok);
    let tinta = vista
        .legibility
        .items
        .iter()
        .find(|i| i.pair == LegibilityPair::InkSurface)
        .unwrap();
    assert_eq!(tinta.min, 7.0);
    assert!(tinta.ratio < 7.0);
    let sugerido = vista.legibility.suggestion.clone().unwrap();
    // El sugerido es gris (mismo tono y saturación) y con él se cumplen los tres pares.
    let c = &sugerido.color.0;
    assert_eq!(&c[1..3], &c[3..5]);
    assert_eq!(&c[3..5], &c[5..7]);
    let con_sugerido = bloquear(servicio.actualizar_borrador(&base, USUARIO, &texto(c))).unwrap();
    assert!(con_sugerido.legibility.ok, "{c}");
    assert!(con_sugerido.legibility.suggestion.is_none());
    // ET08: guardar no se impide por la legibilidad.
    let (base, servicio, _) = cambiar(&texto("#777777"));
    assert!(bloquear(servicio.guardar_borrador(&base, USUARIO, 1_793_600_000_000)).is_ok());
}

#[test]
fn el_tema_por_defecto_cumple_los_tres_pares() {
    // interfaz.md, «Legibilidad»: el tema por defecto da superficie #CDD6D3 y cumple los tres pares.
    assert_eq!(superficie_de_prueba("#829890", "#14201C"), "#CDD6D3");
    let (base, servicio) = con_temas();
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(vista.legibility.ok);
    // 11,30; 7,84 y 3,35 (interfaz.md los da redondeados: 11,3; 7,8; 3,4).
    for (item, esperado) in vista.legibility.items.iter().zip([11.296, 7.836, 3.349]) {
        assert!((item.ratio - esperado).abs() < 0.01, "{item:?}");
    }
    assert!((contraste_de_prueba("#FFFFFF", "#000000") - 21.0).abs() < 1e-9);
}
