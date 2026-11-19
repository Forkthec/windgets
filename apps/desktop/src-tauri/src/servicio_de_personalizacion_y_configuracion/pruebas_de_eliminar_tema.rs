//! Pruebas del Núcleo de HE-03-HU05 (eliminar un tema). CA03 (Cancelar) es de la vista (Themes.test.tsx).

use super::pruebas_del_tema_en_edicion::{MI_TEMA, con_temas};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

const AHORA_MS: i64 = 1_793_600_000_000;

#[test]
fn ca_he_03_hu05_ca01() {
    // HE-03-HU05-CA01 · Quita el tema y sus widgets, no cambia el escritorio (ET02) y encola la eliminación.
    let (base, servicio) = con_temas();
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    let otro = temas.iter().find(|t| !t.is_applied).unwrap().id.0.clone();
    let aplicado = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    let r = bloquear(servicio.eliminar_tema(&base, USUARIO, &otro, AHORA_MS)).unwrap();
    assert_eq!(r.mensaje.message, "Tema eliminado.");
    let quedan = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert_eq!(quedan.len(), temas.len() - 1);
    assert!(quedan.iter().all(|t| t.id.0 != otro));
    assert_eq!(
        bloquear(servicio.tema_aplicado(&base, USUARIO))
            .unwrap()
            .content,
        aplicado.content
    );
    let (widgets, pendiente): (i64, String) = bloquear(async {
        let pool = base.pool().await.unwrap();
        let w = sqlx::query_scalar("SELECT COUNT(*) FROM theme_widget WHERE theme_id = ?")
            .bind(&otro)
            .fetch_one(pool)
            .await
            .unwrap();
        let p = sqlx::query_scalar(
            "SELECT op FROM pending_change WHERE entity_kind = 'theme' AND entity_id = ?",
        )
        .bind(&otro)
        .fetch_one(pool)
        .await
        .unwrap();
        (w, p)
    });
    assert_eq!((widgets, pendiente.as_str()), (0, "delete"));
}

#[test]
fn ca_he_03_hu05_ca02() {
    // HE-03-HU05-CA02 · El tema aplicado no se elimina (ET03 a ET05; D-037).
    let (base, servicio) = con_temas();
    let aplicado = bloquear(servicio.temas(&base, USUARIO))
        .unwrap()
        .into_iter()
        .find(|t| t.is_applied)
        .unwrap();
    let e = bloquear(servicio.eliminar_tema(&base, USUARIO, &aplicado.id.0, AHORA_MS)).unwrap_err();
    assert_eq!(e.code, ErrorCode::ThemeAppliedNotDeletable);
    assert_eq!(
        e.message,
        "No puedes eliminar el tema aplicado. Aplica otro tema primero."
    );
    assert_eq!(bloquear(servicio.temas(&base, USUARIO)).unwrap().len(), 2);
    let _ = MI_TEMA;
}
