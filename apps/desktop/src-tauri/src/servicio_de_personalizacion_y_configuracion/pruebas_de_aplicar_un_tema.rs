//! Pruebas del Núcleo de HE-03-HU03 (aplicar un tema guardado).

use super::pruebas_de_colores::primario;
use super::pruebas_del_tema_en_edicion::{MI_TEMA, OTRO_TEMA, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

const AHORA_MS: i64 = 1_793_600_000_000;

fn aplicar(
    servicio: &ServicioDePersonalizacion,
    base: &BaseLocal,
    tema: &str,
    descartar: bool,
) -> Result<ConMensaje<crate::tipos::ThemeIdResult>, AppError> {
    bloquear(servicio.aplicar_tema(base, USUARIO, tema, descartar, AHORA_MS))
}

#[test]
fn ca_he_03_hu03_ca01() {
    // HE-03-HU03-CA01 · Aplicar otro tema lleva su versión guardada al escritorio y mueve «Aplicado» (ET02, ET04).
    let (base, servicio) = con_temas();
    let r = aplicar(&servicio, &base, OTRO_TEMA, false).unwrap();
    assert_eq!(r.mensaje.message, "Tema “Verano” aplicado.");
    let escritorio = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(escritorio.theme_id.0, OTRO_TEMA);
    assert_eq!(escritorio.content.colors.primary, Hex("#DCBA04".into()));
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let aplicados: Vec<_> = temas
        .iter()
        .filter(|t| t.is_applied)
        .map(|t| t.id.0.as_str())
        .collect();
    assert_eq!(aplicados, [OTRO_TEMA]);
    // Queda encolado para sincronizar.
    let pendientes: i64 = bloquear(async {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM pending_change WHERE entity_kind = 'applied_theme'",
        )
        .fetch_one(base.pool().await.unwrap())
        .await
        .unwrap()
    });
    assert_eq!(pendientes, 1);
}

#[test]
fn ca_he_03_hu03_ca03() {
    // HE-03-HU03-CA03 · El tema aplicado sin cambios sin aplicar responde su texto (ET05).
    let (base, servicio) = con_temas();
    let e = aplicar(&servicio, &base, MI_TEMA, false).err().unwrap();
    assert_eq!(e.code, ErrorCode::ThemeAlreadyApplied);
    assert_eq!(e.message, "Este tema ya está aplicado.");
}

#[test]
fn ca_he_03_hu03_ca04() {
    // HE-03-HU03-CA04 · Con cambios sin aplicar, lleva su última versión guardada y quita la marca (ET06).
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    bloquear(servicio.guardar_borrador(&base, USUARIO, AHORA_MS)).unwrap();
    let antes = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert!(
        antes
            .iter()
            .any(|t| t.id.0 == MI_TEMA && t.has_unapplied_changes)
    );
    let r = aplicar(&servicio, &base, MI_TEMA, false).unwrap();
    assert_eq!(r.mensaje.message, "Tema “Mi tema” aplicado.");
    let escritorio = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(escritorio.content.colors.primary, Hex("#112233".into()));
    let despues = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert!(despues.iter().all(|t| !t.has_unapplied_changes));
}

#[test]
fn ca_he_03_hu03_ca05() {
    // HE-03-HU03-CA05 · Con cambios sin guardar en la vista previa, el mensaje de M-15 con el nombre del tema en
    // edición; con `discard_draft` se aplica y los cambios se descartan (ET08).
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    let e = aplicar(&servicio, &base, OTRO_TEMA, false).err().unwrap();
    assert_eq!(e.code, ErrorCode::DraftUnsavedChanges);
    assert_eq!(
        e.message,
        "Tienes cambios sin guardar en el tema “Mi tema”. ¿Qué deseas hacer?"
    );
    assert_eq!(
        bloquear(servicio.tema_aplicado(&base, USUARIO))
            .unwrap()
            .theme_id
            .0,
        MI_TEMA
    );
    aplicar(&servicio, &base, OTRO_TEMA, true).unwrap();
    assert_eq!(
        bloquear(servicio.tema_aplicado(&base, USUARIO))
            .unwrap()
            .theme_id
            .0,
        OTRO_TEMA
    );
    assert!(!servicio.hay_cambios_sin_guardar());
    // El tema que se editaba no guardó los cambios descartados.
    let (_, mi_tema) = bloquear(ServicioDePersonalizacion::guardado(&base, USUARIO, MI_TEMA))
        .unwrap()
        .unwrap();
    assert_eq!(mi_tema.colors.primary, Hex("#96B2B2".into()));
}
