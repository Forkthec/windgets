//! Pruebas del Núcleo de HE-03-HU01 (temas guardados con el tema aplicado marcado).

use super::pruebas_de_colores::primario;
use super::pruebas_del_tema_en_edicion::{MI_TEMA, OTRO_TEMA, con_temas};
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::ApplyMode;

const AHORA_MS: i64 = 1_793_600_000_000;

#[test]
fn ca_he_03_hu01_ca01() {
    // HE-03-HU01-CA01 · Del más reciente al más antiguo, con el tema aplicado marcado (ET01, ET02).
    let (base, servicio) = con_temas();
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let lista: Vec<_> = temas
        .iter()
        .map(|t| (t.name.as_str(), t.last_modified_at.0.as_str(), t.is_applied))
        .collect();
    assert_eq!(
        lista,
        [
            ("Verano", "2026-11-03T00:00:00.000Z", false),
            ("Mi tema", "2026-11-02T00:00:00.000Z", true),
        ]
    );
    assert!(
        temas
            .iter()
            .all(|t| !t.has_unapplied_changes && !t.has_unsaved_changes)
    );
}

#[test]
fn ca_he_03_hu01_ca02() {
    // HE-03-HU01-CA02 · Con solo el tema aplicado, la lista trae ese tema marcado (ET03, ET04).
    let (base, servicio) = con_temas();
    bloquear(async {
        sqlx::query("DELETE FROM theme WHERE id = ?")
            .bind(OTRO_TEMA)
            .execute(base.pool().await.unwrap())
            .await
            .unwrap();
    });
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert_eq!(temas.len(), 1);
    assert_eq!(
        (temas[0].id.0.as_str(), temas[0].is_applied),
        (MI_TEMA, true)
    );
}

#[test]
fn ca_he_03_hu01_ca03() {
    // HE-03-HU01-CA03 · Cambios guardados en el tema aplicado que aún no se aplicaron: «Cambios sin aplicar» (ET05).
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    bloquear(servicio.guardar_borrador(&base, USUARIO, AHORA_MS)).unwrap();
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let mi_tema = temas.iter().find(|t| t.id.0 == MI_TEMA).unwrap();
    assert!(mi_tema.has_unapplied_changes && !mi_tema.has_unsaved_changes);
}

#[test]
fn ca_he_03_hu01_ca04() {
    // HE-03-HU01-CA04 · Cambios aplicados sin guardarlos en el tema: «Cambios sin guardar» (ET07). Un cambio de
    // la vista previa que no se aplicó no marca el tema.
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert!(temas.iter().all(|t| !t.has_unsaved_changes));
    bloquear(servicio.aplicar_borrador(&base, USUARIO, &ApplyMode::ApplyWithoutSaving, AHORA_MS))
        .unwrap();
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let mi_tema = temas.iter().find(|t| t.id.0 == MI_TEMA).unwrap();
    assert!(mi_tema.is_applied && mi_tema.has_unsaved_changes);
}
