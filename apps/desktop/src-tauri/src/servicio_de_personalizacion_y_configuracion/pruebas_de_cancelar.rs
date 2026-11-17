//! Pruebas del Núcleo de HE-02-HU13 (cancelar los cambios sin guardar de la vista previa).

use super::pruebas_de_colores::primario;
use super::pruebas_del_tema_en_edicion::con_temas;
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};
use crate::tipos::ApplyMode;

const AHORA_MS: i64 = 1_793_600_000_000;

#[test]
fn ca_he_02_hu13_ca01() {
    // HE-02-HU13-CA01 · «Cancelar» vuelve a lo último guardado, sin guardar nada, con su mensaje (ET01, ET02).
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    let r = bloquear(servicio.descartar_borrador(&base, USUARIO)).unwrap();
    assert_eq!(r.mensaje.message, "No se guardaron cambios.");
    assert_eq!(r.valor.content.colors.primary, Hex("#96B2B2".into()));
    assert!(!r.valor.dirty);
    // El tema guardado no cambió.
    let temas = bloquear(servicio.temas(&base, USUARIO)).unwrap();
    assert!(
        temas
            .iter()
            .all(|t| !t.has_unsaved_changes && !t.has_unapplied_changes)
    );
}

#[test]
fn ca_he_02_hu13_ca02() {
    // HE-02-HU13-CA02 · Con cambios sin guardar ni aplicar, el estado pide el mensaje de salir sin guardar.
    let (base, servicio) = con_temas();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(!servicio.estado_del_borrador().dirty);
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    let estado = servicio.estado_del_borrador();
    assert!(estado.dirty);
    assert!(!estado.applied_unsaved);
    assert_eq!(estado.theme_name, "Mi tema");
}

#[test]
fn ca_he_02_hu13_ca03() {
    // HE-02-HU13-CA03 · «Salir sin guardar» descarta los cambios y el escritorio sigue con el tema aplicado.
    let (base, servicio) = con_temas();
    let aplicado = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    bloquear(servicio.descartar_borrador(&base, USUARIO)).unwrap();
    assert!(!servicio.estado_del_borrador().dirty);
    assert_eq!(
        bloquear(servicio.tema_aplicado(&base, USUARIO))
            .unwrap()
            .content,
        aplicado.content
    );
}

#[test]
fn ca_he_02_hu13_ca05_y_ca06() {
    // HE-02-HU13-CA05 · Con cambios aplicados sin guardar, el estado pide el mensaje de M-03.
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    bloquear(servicio.aplicar_borrador(&base, USUARIO, &ApplyMode::ApplyWithoutSaving, AHORA_MS))
        .unwrap();
    let estado = servicio.estado_del_borrador();
    assert!(estado.applied_unsaved);
    // HE-02-HU13-CA06 · «Salir sin guardar»: el escritorio conserva lo aplicado y el tema guardado no cambia (ET05).
    bloquear(servicio.descartar_borrador(&base, USUARIO)).unwrap();
    let escritorio = bloquear(servicio.tema_aplicado(&base, USUARIO)).unwrap();
    assert_eq!(escritorio.content.colors.primary, Hex("#112233".into()));
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.content.colors.primary, Hex("#96B2B2".into()));
}

#[test]
fn ca_he_02_hu13_ca08() {
    // HE-02-HU13-CA08 · «Guardar» en M-03 guarda en el tema en edición los cambios aplicados (ET08).
    let (base, servicio) = con_temas();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &primario("#112233"))).unwrap();
    bloquear(servicio.aplicar_borrador(&base, USUARIO, &ApplyMode::ApplyWithoutSaving, AHORA_MS))
        .unwrap();
    bloquear(servicio.guardar_borrador(&base, USUARIO, AHORA_MS)).unwrap();
    let estado = servicio.estado_del_borrador();
    assert!(!estado.dirty && !estado.applied_unsaved);
}
