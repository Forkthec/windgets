//! Pruebas del Núcleo de HE-08 (etiquetas) y HE-07-HU02 (asignar etiquetas a una tarjeta).

use super::pruebas::*;
use super::*;

fn nombres(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Vec<String> {
    bloquear(servicio.etiquetas(USUARIO))
        .unwrap()
        .into_iter()
        .map(|e| e.name)
        .collect()
}

#[test]
fn ca_he_08_hu01_ca01() {
    // HE-08-HU01-CA01 · Cada etiqueta con su nombre y su color (ET02).
    let servicio = con_semilla();
    etiqueta(&servicio, "Estudio");
    let lista = bloquear(servicio.etiquetas(USUARIO)).unwrap();
    assert_eq!(lista.len(), 1);
    assert_eq!(
        (
            lista[0].name.as_str(),
            lista[0].color_id.as_str(),
            lista[0].color_hex.0.as_str()
        ),
        ("Estudio", "blue", "#2196F3")
    );
}

#[test]
fn ca_he_08_hu01_ca02() {
    // HE-08-HU01-CA02 · Sin etiquetas: lista vacía (la vista muestra el estado vacío, ET04).
    assert!(nombres(&con_semilla()).is_empty());
}

#[test]
fn ca_he_08_hu01_ca03() {
    // HE-08-HU01-CA03 · De la A a la Z (ET05, D-165).
    let servicio = con_semilla();
    for nombre in ["Trabajo", "casa", "Estudio"] {
        etiqueta(&servicio, nombre);
    }
    assert_eq!(nombres(&servicio), ["casa", "Estudio", "Trabajo"]);
}
