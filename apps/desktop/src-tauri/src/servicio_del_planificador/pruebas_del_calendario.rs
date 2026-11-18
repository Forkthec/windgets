//! Pruebas del Núcleo del Calendario (HE-10): vista mensual (IPC-CARD-12). Hoy es el 14/11/2026.

use super::pruebas::*;
use super::*;

fn mes(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, anio: i64, m: i64) -> CalendarMonth {
    bloquear(servicio.mes_del_calendario(USUARIO, anio, m)).unwrap()
}

fn dia<'a>(mes: &'a CalendarMonth, fecha: &str) -> &'a CalendarMonthDay {
    mes.days.iter().find(|d| d.date.0 == fecha).unwrap()
}

fn titulos(dia: &CalendarMonthDay) -> Vec<&str> {
    dia.preview.iter().map(|t| t.title.as_str()).collect()
}

#[test]
fn ca_he_10_hu01_ca01() {
    // HE-10-HU01-CA01 · Abrir la vista mensual: todos los días del mes y cada tarjeta en el día de su fecha
    // límite, con su título (ET03).
    let servicio = con_semilla();
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    tarjeta_en(&servicio, HECHO, "Pagar la luz", "2026-11-14", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Otro mes", "2026-12-01", 2048.0);
    let noviembre = mes(&servicio, 2026, 11);
    assert_eq!(noviembre.days.len(), 30);
    assert_eq!(noviembre.days[0].date.0, "2026-11-01");
    assert_eq!(noviembre.days[29].date.0, "2026-11-30");
    assert_eq!(titulos(dia(&noviembre, "2026-11-20")), ["Entregar informe"]);
    assert_eq!(titulos(dia(&noviembre, "2026-11-14")), ["Pagar la luz"]);
    let con_tarjetas = noviembre
        .days
        .iter()
        .filter(|d| !d.preview.is_empty())
        .count();
    assert_eq!(con_tarjetas, 2);
}

#[test]
fn ca_he_10_hu01_ca02() {
    // HE-10-HU01-CA02 · Más de 3 tarjetas en un día: los títulos de 3 y la cantidad restante (ET05).
    let servicio = con_semilla();
    for i in 1..=5 {
        tarjeta_en(
            &servicio,
            POR_HACER,
            &format!("Tarjeta {i}"),
            "2026-11-20",
            f64::from(i) * 1024.0,
        );
    }
    let noviembre = mes(&servicio, 2026, 11);
    let veinte = dia(&noviembre, "2026-11-20");
    assert_eq!(titulos(veinte), ["Tarjeta 1", "Tarjeta 2", "Tarjeta 3"]);
    assert_eq!(veinte.extra_count, 2);
}

#[test]
fn ca_he_10_hu01_ca03() {
    // HE-10-HU01-CA03 · Navegar al mes siguiente: las tarjetas de diciembre, también al cambiar de año.
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Navidad", "2026-12-24", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Año nuevo", "2027-01-01", 2048.0);
    let diciembre = mes(&servicio, 2026, 12);
    assert_eq!(diciembre.days.len(), 31);
    assert_eq!(titulos(dia(&diciembre, "2026-12-24")), ["Navidad"]);
    assert_eq!(
        titulos(dia(&mes(&servicio, 2027, 1), "2027-01-01")),
        ["Año nuevo"]
    );
}

#[test]
fn ca_he_10_hu01_ca04() {
    // HE-10-HU01-CA04 · Navegar al mes anterior: las tarjetas de octubre, con fechas ya pasadas.
    let servicio = con_semilla();
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Informe de octubre",
        "2026-10-31",
        1024.0,
    );
    let octubre = mes(&servicio, 2026, 10);
    assert_eq!(octubre.days.len(), 31);
    assert_eq!(titulos(dia(&octubre, "2026-10-31")), ["Informe de octubre"]);
    // Febrero de un año no bisiesto tiene 28 días.
    assert_eq!(mes(&servicio, 2027, 2).days.len(), 28);
}

#[test]
fn ca_he_10_hu01_ca06() {
    // HE-10-HU01-CA06 · Mes sin tarjetas: todos los días, sin tarjetas.
    let noviembre = mes(&con_semilla(), 2026, 11);
    assert_eq!(noviembre.days.len(), 30);
    assert!(
        noviembre
            .days
            .iter()
            .all(|d| d.preview.is_empty() && d.extra_count == 0)
    );
}
