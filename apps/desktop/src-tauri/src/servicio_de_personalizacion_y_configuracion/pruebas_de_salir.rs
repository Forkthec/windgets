//! Pruebas del Núcleo de HE-17-HU03 (salir de la aplicación desde el ícono del área de notificación): cuándo
//! «Salir» pide confirmar los cambios de la vista previa. Cerrar el programa y mostrar el fondo original de
//! Windows (`area_de_notificacion::salir`) se prueba a mano en Windows 11.

use super::pruebas_de_plantillas::{cambio, con_otra_plantilla};
use super::*;
use crate::servicio_del_planificador::pruebas::{USUARIO, bloquear};

/// La vista previa de Personalización del wallpaper con un cambio sin guardar ni aplicar.
fn con_cambios() -> (BaseLocal, ServicioDePersonalizacion) {
    let (base, servicio) = con_otra_plantilla();
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    bloquear(servicio.actualizar_borrador(&base, USUARIO, &cambio("minimal"))).unwrap();
    (base, servicio)
}

#[test]
fn ca_he_17_hu03_ca01() {
    // HE-17-HU03-CA01 · Sin cambios sin guardar, «Salir» cierra la aplicación sin preguntar (ET01).
    let (base, servicio) = con_otra_plantilla();
    assert!(!servicio.hay_cambios_sin_guardar());
    bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert!(!servicio.hay_cambios_sin_guardar());
}

#[test]
fn ca_he_17_hu03_ca02() {
    // HE-17-HU03-CA02 · Con cambios sin guardar ni aplicar en la vista previa, «Salir» pide confirmación y la
    // aplicación sigue abierta (ET07). La vista muestra el texto de la confirmación.
    let (_, servicio) = con_cambios();
    assert!(servicio.hay_cambios_sin_guardar());
    assert_eq!(
        crate::messages::SALIR_SIN_GUARDAR,
        "Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?"
    );
}

#[test]
fn ca_he_17_hu03_ca03() {
    // HE-17-HU03-CA03 · «Salir sin guardar» descarta los cambios de la vista previa antes de cerrar.
    let (_, servicio) = con_cambios();
    servicio.olvidar_borrador();
    assert!(!servicio.hay_cambios_sin_guardar());
}

#[test]
fn ca_he_17_hu03_ca04() {
    // HE-17-HU03-CA04 · «Seguir editando» no llama al Núcleo: la vista previa conserva sus cambios.
    let (base, servicio) = con_cambios();
    assert!(servicio.hay_cambios_sin_guardar());
    let vista = bloquear(servicio.abrir_borrador(&base, USUARIO, None)).unwrap();
    assert_eq!(vista.content.template_id, "minimal");
    assert!(vista.dirty);
}
