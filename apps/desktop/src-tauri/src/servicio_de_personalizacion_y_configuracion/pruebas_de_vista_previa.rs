//! Pruebas del Núcleo de HE-02-HU09 (vista previa en tiempo real de los cambios de personalización).

use super::pruebas_de_colores::primario;
use super::pruebas_del_tema_en_edicion::con_temas;
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

#[test]
fn ca_he_02_hu09_ca01() {
    // HE-02-HU09-CA01 · Cada cambio devuelve la vista previa con el cambio y no toca el escritorio (ET01, ET02).
    let (base, servicio) = con_temas();
    let antes = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    let inicio = std::time::Instant::now();
    let vista =
        bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    // RNF-02: la vista previa se actualiza en 1 s o menos.
    assert!(inicio.elapsed() < std::time::Duration::from_secs(1));
    assert_eq!(vista.content.colors.primary, Hex("#112233".into()));
    assert_eq!(
        bloquear(servicio.tema_aplicado(&base, USUARIO))
            .unwrap()
            .content,
        antes.content
    );
}

#[test]
fn ca_he_02_hu09_ca02() {
    // HE-02-HU09-CA02 · Con cambios guardados o sin guardar, el escritorio sigue con la última versión aplicada
    // (ET04).
    let (base, servicio) = con_temas();
    let antes = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    assert_eq!(
        bloquear(servicio.tema_aplicado(&base, USUARIO))
            .unwrap()
            .content,
        antes.content
    );
    bloquear(servicio.guardar_borrador(&base, USUARIO, 1_793_600_000_000)).unwrap();
    let despues = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(despues.content, antes.content);
    assert!(despues.has_unapplied_changes);
}
