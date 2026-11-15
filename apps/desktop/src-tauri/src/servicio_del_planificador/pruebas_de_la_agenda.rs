//! Pruebas del Núcleo de HE-11-HU01 (consultar la agenda diaria). El calendario de prueba dice que hoy es el
//! 14/11/2026 y son las 14:25.

use super::pruebas::*;
use super::*;

fn agenda(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, dia: &str) -> AgendaDay {
    bloquear(servicio.agenda(USUARIO, dia)).unwrap()
}

fn titulos_del_bloque(dia: &AgendaDay, hora: usize) -> Vec<String> {
    dia.blocks[hora]
        .cards
        .iter()
        .map(|t| t.title.clone())
        .collect()
}

fn sin_horario(dia: &AgendaDay) -> Vec<String> {
    dia.unscheduled.iter().map(|t| t.title.clone()).collect()
}

#[test]
fn ca_he_11_hu01_ca01() {
    // HE-11-HU01-CA01 · Hoy a las 14:25: 24 bloques de 00:00 a 23:00 con la hora actual (ET01), «Estudiar
    // redes» en el bloque de las 16 (ET03) y en Tarjetas sin horario solo «Pagar la luz» (ET04).
    let servicio = con_semilla();
    let redes = tarjeta_en(&servicio, POR_HACER, "Estudiar redes", "2026-11-20", 1024.0);
    con_bloque(&servicio, &redes, "2026-11-14", 16);
    tarjeta_en(&servicio, POR_HACER, "Pagar la luz", "2026-11-20", 2048.0);
    tarjeta_en(&servicio, HECHO, "Leer capítulo 3", "2026-11-20", 1024.0);
    let dia = agenda(&servicio, "2026-11-14");
    assert_eq!(dia.date, DateIso("2026-11-14".into()));
    assert!(dia.is_today);
    assert_eq!(dia.current_hour, Some(Hour(14)));
    let horas: Vec<u8> = dia.blocks.iter().map(|b| b.hour.0).collect();
    assert_eq!(horas, (0..24).collect::<Vec<u8>>());
    assert_eq!(titulos_del_bloque(&dia, 16), ["Estudiar redes"]);
    assert_eq!(sin_horario(&dia), ["Pagar la luz"]);
    assert!(dia.blocks[13].is_past && !dia.blocks[14].is_past);
}

#[test]
fn ca_he_11_hu01_ca02() {
    // HE-11-HU01-CA02 · Día siguiente: sus bloques, con «Estudiar redes» a las 09 (ET06); ninguno ya pasó.
    let servicio = con_semilla();
    let redes = tarjeta_en(&servicio, POR_HACER, "Estudiar redes", "2026-11-20", 1024.0);
    con_bloque(&servicio, &redes, "2026-11-15", 9);
    let dia = agenda(&servicio, "2026-11-15");
    assert!(!dia.is_today);
    assert_eq!(dia.current_hour, None);
    assert_eq!(titulos_del_bloque(&dia, 9), ["Estudiar redes"]);
    assert!(dia.blocks.iter().all(|b| !b.is_past));
    assert!(agenda(&servicio, "2026-11-14").blocks[9].cards.is_empty());
}

#[test]
fn ca_he_11_hu01_ca03() {
    // HE-11-HU01-CA03 · Día anterior: «Leer capítulo 3» a las 08; todos sus bloques ya pasaron.
    let servicio = con_semilla();
    let leer = tarjeta_en(
        &servicio,
        POR_HACER,
        "Leer capítulo 3",
        "2026-11-20",
        1024.0,
    );
    con_bloque(&servicio, &leer, "2026-11-13", 8);
    let dia = agenda(&servicio, "2026-11-13");
    assert_eq!(titulos_del_bloque(&dia, 8), ["Leer capítulo 3"]);
    assert!(dia.blocks.iter().all(|b| b.is_past));
}

#[test]
fn ca_he_11_hu01_ca04() {
    // HE-11-HU01-CA04 · Todo en Hecho o con bloque: Tarjetas sin horario vacío (la vista muestra «No tienes
    // tarjetas pendientes por programar.», ET05).
    let servicio = con_semilla();
    tarjeta_en(&servicio, HECHO, "Hecha", "2026-11-20", 1024.0);
    let con = tarjeta_en(&servicio, EN_PROGRESO, "Con bloque", "2026-11-20", 1024.0);
    con_bloque(&servicio, &con, "2026-11-18", 10);
    assert!(agenda(&servicio, "2026-11-14").unscheduled.is_empty());
}

#[test]
fn ca_he_11_hu01_ca06() {
    // HE-11-HU01-CA06 · Sin conexión: la agenda sale solo de la base local (ET08); no hay llamada a la nube.
    let servicio = con_semilla();
    let redes = tarjeta_en(&servicio, POR_HACER, "Estudiar redes", "2026-11-20", 1024.0);
    con_bloque(&servicio, &redes, "2026-11-14", 16);
    assert_eq!(
        titulos_del_bloque(&agenda(&servicio, "2026-11-14"), 16),
        ["Estudiar redes"]
    );
}
