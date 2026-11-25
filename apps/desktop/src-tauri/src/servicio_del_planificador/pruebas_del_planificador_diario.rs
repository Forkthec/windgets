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

#[test]
fn ca_he_06_hu02_ca06() {
    // HE-06-HU02-CA06 · Al pasar a las 00:00 el Núcleo avisa una sola vez con EV-22 `day_changed` y el día nuevo;
    // el widget Tareas del día vuelve a leer `planner_get_today` (ET04).
    let dia = |d: u32| NaiveDate::from_ymd_opt(2026, 11, d).unwrap();
    let mut vigia = VigiaDelDia::nuevo(dia(14));
    assert_eq!(vigia.revisar(dia(14)), None);
    assert_eq!(vigia.revisar(dia(15)), Some(DateIso("2026-11-15".into())));
    assert_eq!(vigia.revisar(dia(15)), None);
}

// IPC-CARD-16 `card_list_upcoming` (D-06; docs/rediseno.md RD-98): «Próximas a vencer».

fn proximas(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, limit: i64) -> Vec<String> {
    bloquear(servicio.proximas_a_vencer(USUARIO, limit))
        .unwrap()
        .into_iter()
        .map(|t| t.title)
        .collect()
}

fn ejecutar(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, sql: &str) {
    bloquear(async {
        sqlx::query(sql)
            .execute(servicio.base().pool().await.unwrap())
            .await
            .unwrap();
    });
}

#[test]
fn rd_98_entrega_como_mucho_3_la_mas_cercana_primero() {
    let servicio = con_semilla();
    assert!(proximas(&servicio, 3).is_empty());
    for (titulo, fecha) in [
        ("Diciembre", "2026-12-01"),
        ("Pasado mañana", "2026-11-16"),
        ("Mañana", "2026-11-15"),
    ] {
        tarjeta_en(&servicio, POR_HACER, titulo, fecha, 1024.0);
    }
    let casa = etiqueta(&servicio, "Casa");
    let mut de_hoy = params("Hoy", "2026-11-14");
    de_hoy.label_ids = Some(vec![Uuid(casa.clone())]);
    crear(&servicio, de_hoy).unwrap();
    assert_eq!(proximas(&servicio, 3), ["Hoy", "Mañana", "Pasado mañana"]);
    assert_eq!(proximas(&servicio, 1), ["Hoy"]);
    let primera = bloquear(servicio.proximas_a_vencer(USUARIO, 1)).unwrap();
    assert_eq!(primera[0].label_ids, [Uuid(casa)]);
}

#[test]
fn rd_98_cuenta_desde_hoy_y_deja_fuera_las_vencidas() {
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Ayer", "2026-11-13", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Hoy", "2026-11-14", 2048.0);
    tarjeta_en(&servicio, POR_HACER, "Mañana", "2026-11-15", 3072.0);
    assert_eq!(proximas(&servicio, 3), ["Hoy", "Mañana"]);
    // Al cambiar el día del computador, la que era de hoy queda vencida y sale.
    servicio
        .calendario
        .0
        .fetch_add(86_400_000, std::sync::atomic::Ordering::SeqCst);
    assert_eq!(proximas(&servicio, 3), ["Mañana"]);
}

#[test]
fn rd_98_no_incluye_las_hechas_ni_las_eliminadas() {
    let servicio = con_semilla();
    tarjeta_en(&servicio, HECHO, "Hecha", "2026-11-15", 1024.0);
    let eliminada = tarjeta_en(&servicio, POR_HACER, "Eliminada", "2026-11-15", 1024.0);
    bloquear(servicio.eliminar_tarjeta(USUARIO, &eliminada)).unwrap();
    tarjeta_en(&servicio, EN_PROGRESO, "En progreso", "2026-11-20", 1024.0);
    assert_eq!(proximas(&servicio, 3), ["En progreso"]);
}

#[test]
fn rd_98_solo_lee_la_cuenta_activa() {
    let servicio = con_semilla();
    ejecutar(
        &servicio,
        &format!(
            "INSERT INTO card (id, user_id, created_at, title, due_date, column_id, position) VALUES \
             ('00000000-0000-4000-8000-0000000000e1', '{OTRO_USUARIO}', '2026-11-01T00:00:00.000Z', \
             'De otra cuenta', '2026-11-14', '00000000-0000-4000-8000-0000000000d1', 1024)"
        ),
    );
    tarjeta_en(&servicio, POR_HACER, "Propia", "2026-11-20", 1024.0);
    assert_eq!(proximas(&servicio, 3), ["Propia"]);
}

#[test]
fn rd_98_a_igual_fecha_desempata_por_prioridad_y_creacion() {
    let servicio = con_semilla();
    for (titulo, prioridad, creada) in [
        ("Sin prioridad", "NULL", "01"),
        ("Baja", "'low'", "01"),
        ("Alta nueva", "'high'", "03"),
        ("Media", "'medium'", "01"),
        ("Alta antigua", "'high'", "02"),
    ] {
        let id = tarjeta_en(&servicio, POR_HACER, titulo, "2026-11-15", 1024.0);
        ejecutar(
            &servicio,
            &format!(
                "UPDATE card SET priority = {prioridad}, created_at = '2026-11-{creada}T00:00:00.000Z' \
                 WHERE id = '{id}'"
            ),
        );
    }
    assert_eq!(
        proximas(&servicio, 3),
        ["Alta antigua", "Alta nueva", "Media"]
    );
    ejecutar(
        &servicio,
        "DELETE FROM card WHERE priority IN ('high', 'medium')",
    );
    assert_eq!(proximas(&servicio, 3), ["Baja", "Sin prioridad"]);
}

#[test]
fn rd_98_un_limite_fuera_de_1_a_3_es_limit_out_of_range() {
    let servicio = con_semilla();
    for limit in [i64::MIN, -1, 0, 4, i64::MAX] {
        let e = bloquear(servicio.proximas_a_vencer(USUARIO, limit)).unwrap_err();
        assert_eq!(
            (e.code, e.message.as_str(), e.field.as_deref()),
            (ErrorCode::LimitOutOfRange, "", Some("limit")),
            "limit = {limit}"
        );
    }
}
