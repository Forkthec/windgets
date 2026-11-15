//! Pruebas del Núcleo de HE-12-HU01 (consultar el planificador diario). Hoy es el 14/11/2026.

use super::pruebas::*;
use super::*;

fn de_hoy(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> PlannerToday {
    bloquear(servicio.planificador_de_hoy(USUARIO)).unwrap()
}

fn lista(dia: &PlannerToday) -> Vec<(String, Option<u8>)> {
    dia.items
        .iter()
        .map(|i| (i.card.title.clone(), i.hour.as_ref().map(|h| h.0)))
        .collect()
}

#[test]
fn ca_he_12_hu01_ca01() {
    // HE-12-HU01-CA01 · «Leer capítulo 3» a las 08, «Estudiar redes» a las 10 y «Pagar la luz» sin hora, en ese
    // orden (ET02, ET03, ET05, ET08); el resumen cuenta las tres.
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Pagar la luz", "2026-11-14", 1024.0);
    let redes = tarjeta_en(&servicio, POR_HACER, "Estudiar redes", "2026-11-20", 2048.0);
    con_bloque(&servicio, &redes, "2026-11-14", 10);
    let leer = tarjeta_en(
        &servicio,
        EN_PROGRESO,
        "Leer capítulo 3",
        "2026-11-20",
        1024.0,
    );
    con_bloque(&servicio, &leer, "2026-11-14", 8);
    tarjeta_en(&servicio, POR_HACER, "Otro día", "2026-11-20", 3072.0);
    let dia = de_hoy(&servicio);
    assert_eq!(dia.date, DateIso("2026-11-14".into()));
    assert_eq!(
        lista(&dia),
        [
            ("Leer capítulo 3".to_string(), Some(8)),
            ("Estudiar redes".to_string(), Some(10)),
            ("Pagar la luz".to_string(), None),
        ]
    );
    assert_eq!(
        (
            dia.summary.total,
            dia.summary.completed,
            dia.summary.remaining
        ),
        (3, 0, 3)
    );
}

#[test]
fn ca_he_12_hu01_ca02() {
    // HE-12-HU01-CA02 · Fecha límite hoy y bloque hoy: una sola vez, con la hora 10.
    let servicio = con_semilla();
    let redes = tarjeta_en(&servicio, POR_HACER, "Estudiar redes", "2026-11-14", 1024.0);
    con_bloque(&servicio, &redes, "2026-11-14", 10);
    assert_eq!(
        lista(&de_hoy(&servicio)),
        [("Estudiar redes".to_string(), Some(10))]
    );
}

#[test]
fn ca_he_12_hu01_ca03() {
    // HE-12-HU01-CA03 · Sin tarjetas para hoy: lista vacía (la vista muestra «No tienes tarjetas para hoy.»,
    // ET06) y el resumen en cero. Un bloque de otro día no cuenta.
    let servicio = con_semilla();
    let otra = tarjeta_en(&servicio, POR_HACER, "Mañana", "2026-11-20", 1024.0);
    con_bloque(&servicio, &otra, "2026-11-15", 9);
    let dia = de_hoy(&servicio);
    assert!(dia.items.is_empty());
    assert_eq!((dia.summary.total, dia.summary.percent), (0, 0.0));
}

#[test]
fn ca_he_12_hu01_ca04() {
    // HE-12-HU01-CA04 · En Hecho: completada (la vista la tacha y marca su casilla, ET07).
    let servicio = con_semilla();
    tarjeta_en(&servicio, HECHO, "Pagar la luz", "2026-11-14", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Otra", "2026-11-14", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Una más", "2026-11-14", 2048.0);
    let dia = de_hoy(&servicio);
    let pagar = dia
        .items
        .iter()
        .find(|i| i.card.title == "Pagar la luz")
        .unwrap();
    assert!(pagar.card.is_completed);
    assert_eq!(
        (
            dia.summary.completed,
            dia.summary.remaining,
            dia.summary.percent
        ),
        (1, 2, 33.0)
    );
}

#[test]
fn ca_he_12_hu01_ca05() {
    // HE-12-HU01-CA05 · Sin conexión: sale de la base local (ET09).
    let servicio = con_semilla();
    let redes = tarjeta_en(&servicio, POR_HACER, "Estudiar redes", "2026-11-20", 1024.0);
    con_bloque(&servicio, &redes, "2026-11-14", 10);
    assert_eq!(
        lista(&de_hoy(&servicio)),
        [("Estudiar redes".to_string(), Some(10))]
    );
}
