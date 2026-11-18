//! Pruebas del Núcleo del Calendario (HE-10): vista mensual (IPC-CARD-12) y vista semanal (IPC-CARD-13). Hoy es
//! el sábado 14/11/2026.

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

fn semana(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, lunes: &str) -> CalendarWeek {
    bloquear(servicio.semana_del_calendario(USUARIO, lunes)).unwrap()
}

/// Los títulos de cada día de la semana, con la hora de inicio de su bloque si la tiene.
fn dias(semana: &CalendarWeek) -> Vec<(String, Vec<String>)> {
    semana
        .days
        .iter()
        .map(|d| {
            let tarjetas = d
                .cards
                .iter()
                .map(|c| match &c.start_hour {
                    Some(h) => format!("{} {:02}:00", c.card.title, h.0),
                    None => c.card.title.clone(),
                })
                .collect();
            (d.date.0.clone(), tarjetas)
        })
        .collect()
}

#[test]
fn ca_he_10_hu02_ca01() {
    // HE-10-HU02-CA01 · Abrir la vista semanal: los 7 días desde el lunes (ET02), cada uno con todas sus
    // tarjetas, sin límite de 3 (ET03).
    let servicio = con_semilla();
    for i in 1..=5 {
        tarjeta_en(
            &servicio,
            POR_HACER,
            &format!("Tarjeta {i}"),
            "2026-11-11",
            f64::from(i) * 1024.0,
        );
    }
    tarjeta_en(&servicio, HECHO, "Pagar la luz", "2026-11-15", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Otra semana", "2026-11-16", 9000.0);
    let s = semana(&servicio, "2026-11-09");
    let fechas: Vec<_> = s.days.iter().map(|d| d.date.0.as_str()).collect();
    assert_eq!(
        fechas,
        [
            "2026-11-09",
            "2026-11-10",
            "2026-11-11",
            "2026-11-12",
            "2026-11-13",
            "2026-11-14",
            "2026-11-15"
        ]
    );
    let dias = dias(&s);
    assert_eq!(dias[2].1.len(), 5);
    assert_eq!(dias[6].1, ["Pagar la luz"]);
    assert_eq!(
        dias.iter().map(|d| d.1.len()).sum::<usize>(),
        6,
        "solo las tarjetas de esa semana"
    );
}

#[test]
fn ca_he_10_hu02_ca02() {
    // HE-10-HU02-CA02 · Tarjeta con bloque horario: «Entregar informe» en el bloque de 14:00 a 15:00 muestra la
    // hora de inicio de su bloque, 14:00 (ET05), y va antes de las que no tienen bloque.
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Pagar la luz", "2026-11-12", 1024.0);
    let id = tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-12",
        2048.0,
    );
    con_bloque(&servicio, &id, "2026-11-12", 14);
    let s = semana(&servicio, "2026-11-09");
    assert_eq!(dias(&s)[3].1, ["Entregar informe 14:00", "Pagar la luz"]);
    assert_eq!(s.days[3].cards[0].start_hour, Some(Hour(14)));
    assert_eq!(s.days[3].cards[1].start_hour, None);
}

#[test]
fn ca_he_10_hu02_ca03() {
    // HE-10-HU02-CA03 · Navegar a la semana siguiente: la del lunes 16 al domingo 22.
    let servicio = con_semilla();
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-22",
        1024.0,
    );
    let dias = dias(&semana(&servicio, "2026-11-16"));
    assert_eq!(dias[0].0, "2026-11-16");
    assert_eq!(
        dias[6],
        ("2026-11-22".into(), vec!["Entregar informe".into()])
    );
}

#[test]
fn ca_he_10_hu02_ca04() {
    // HE-10-HU02-CA04 · Navegar a la semana anterior: la del lunes 2 al domingo 8.
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Informe", "2026-11-02", 1024.0);
    let dias = dias(&semana(&servicio, "2026-11-02"));
    assert_eq!(dias[0], ("2026-11-02".into(), vec!["Informe".into()]));
    assert_eq!(dias[6].0, "2026-11-08");
}

#[test]
fn ca_he_10_hu02_ca06() {
    // HE-10-HU02-CA06 · Una semana que cruza dos meses: del lunes 28 de septiembre al domingo 4 de octubre, con
    // las tarjetas de ambos meses.
    let servicio = con_semilla();
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Fin de septiembre",
        "2026-09-30",
        1024.0,
    );
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Inicio de octubre",
        "2026-10-04",
        2048.0,
    );
    let dias = dias(&semana(&servicio, "2026-09-28"));
    assert_eq!(
        dias[2],
        ("2026-09-30".into(), vec!["Fin de septiembre".into()])
    );
    assert_eq!(
        dias[6],
        ("2026-10-04".into(), vec!["Inicio de octubre".into()])
    );
}

fn panel(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, fecha: &str) -> CalendarDay {
    bloquear(servicio.dia_del_calendario(USUARIO, fecha)).unwrap()
}

#[test]
fn ca_he_10_hu03_ca01() {
    // HE-10-HU03-CA01 · Las 2 tarjetas del día, cada una con su tipo, su título, su prioridad y su columna (ET03),
    // en el orden del tablero; las de otro día no.
    let servicio = con_semilla();
    let informe = tarjeta_en(
        &servicio,
        EN_PROGRESO,
        "Entregar informe",
        "2026-11-20",
        2048.0,
    );
    let luz = tarjeta_en(&servicio, POR_HACER, "Pagar la luz", "2026-11-20", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Otro día", "2026-11-21", 512.0);
    bloquear(async {
        sqlx::query("UPDATE card SET type = 'reminder', priority = 'high' WHERE id = ?")
            .bind(&luz)
            .execute(servicio.base().pool().await.unwrap())
            .await
            .unwrap();
    });
    let dia = panel(&servicio, "2026-11-20");
    assert_eq!(dia.date.0, "2026-11-20");
    assert_eq!(
        dia.cards,
        [
            CalendarDayCardsItem {
                id: Uuid(luz),
                r#type: CardType::Reminder,
                title: "Pagar la luz".into(),
                priority: Some(Priority::High),
                column_name: "Por hacer".into(),
            },
            CalendarDayCardsItem {
                id: Uuid(informe),
                r#type: CardType::Task,
                title: "Entregar informe".into(),
                priority: None,
                column_name: "En progreso".into(),
            },
        ]
    );
}

#[test]
fn ca_he_10_hu03_ca03() {
    // HE-10-HU03-CA03 · Día sin tarjetas: la lista vacía; el mensaje lo pone la vista.
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Otro día", "2026-11-21", 1024.0);
    assert!(panel(&servicio, "2026-11-20").cards.is_empty());
}

#[test]
fn ca_he_10_hu04_ca01() {
    // HE-10-HU04-CA01 · Crear una tarjeta desde un día: «Preparar informe» queda con la fecha límite de ese día en
    // la columna Por hacer (ET03) y se ve en ese día del calendario y en el tablero (ET05), con «Tarjeta creada.».
    let servicio = con_semilla();
    let creada = crear(&servicio, params("Preparar informe", "2026-11-20")).unwrap();
    assert_eq!(creada.mensaje.message, "Tarjeta creada.");
    assert_eq!(creada.valor.due_date.0, "2026-11-20");
    assert_eq!(creada.valor.column_id, Uuid(POR_HACER.into()));
    let noviembre = mes(&servicio, 2026, 11);
    assert_eq!(titulos(dia(&noviembre, "2026-11-20")), ["Preparar informe"]);
    let tablero = bloquear(servicio.tablero(USUARIO)).unwrap();
    assert_eq!(tablero.columns[0].cards[0].title, "Preparar informe");
    assert_eq!(
        panel(&servicio, "2026-11-20").cards[0].title,
        "Preparar informe"
    );
}

#[test]
fn ca_he_10_hu04_ca03() {
    // HE-10-HU04-CA03 · Validaciones del formulario: sin título, «Este campo es obligatorio.» en Título y no se crea
    // (las mismas reglas de HE-07-HU01, ET06).
    let servicio = con_semilla();
    let e = crear(&servicio, params("   ", "2026-11-20")).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str(), e.field.as_deref()),
        (
            ErrorCode::TitleRequired,
            "Este campo es obligatorio.",
            Some("title")
        )
    );
    assert!(panel(&servicio, "2026-11-20").cards.is_empty());
}

#[test]
fn ca_he_10_hu04_ca04() {
    // HE-10-HU04-CA04 · Día pasado: el Panel de un día anterior a hoy no permite crear (ET07); hoy y los días
    // siguientes sí.
    let servicio = con_semilla();
    assert!(!panel(&servicio, "2026-11-13").can_create);
    assert!(!panel(&servicio, "2025-12-31").can_create);
    assert!(panel(&servicio, "2026-11-14").can_create);
    assert!(panel(&servicio, "2026-11-20").can_create);
}

/// Los conteos de un día de la vista mensual: (vencidas, pendientes, rojo, amarillo).
fn estado_en_mes(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    fecha: &str,
) -> (i64, i64, bool, bool) {
    let mes = mes(servicio, 2026, 11);
    let d = dia(&mes, fecha);
    (
        d.overdue_count,
        d.pending_count,
        d.has_overdue,
        d.has_pending,
    )
}

#[test]
fn ca_he_10_hu05_ca01() {
    // HE-10-HU05-CA01 · Día con una tarjeta vencida: fecha límite anterior a hoy y fuera de Hecho (ET01), en rojo
    // (ET03) con «1 vencida» (ET06; el texto lo pone la vista).
    let servicio = con_semilla();
    tarjeta_en(&servicio, EN_PROGRESO, "Pagar la luz", "2026-11-10", 1024.0);
    assert_eq!(estado_en_mes(&servicio, "2026-11-10"), (1, 0, true, false));
}

#[test]
fn ca_he_10_hu05_ca02() {
    // HE-10-HU05-CA02 · Varias vencidas: cuenta todas las del día, sin el límite de 3 de la vista previa (ET14).
    let servicio = con_semilla();
    for i in 1..=5 {
        tarjeta_en(
            &servicio,
            POR_HACER,
            &format!("Tarjeta {i}"),
            "2026-11-10",
            f64::from(i) * 1024.0,
        );
    }
    tarjeta_en(&servicio, HECHO, "Hecha", "2026-11-10", 1024.0);
    let mes = mes(&servicio, 2026, 11);
    let d = dia(&mes, "2026-11-10");
    assert_eq!(d.preview.len(), 3);
    assert_eq!((d.overdue_count, d.has_overdue), (5, true));
}

#[test]
fn ca_he_10_hu05_ca03() {
    // HE-10-HU05-CA03 · Día con tarjetas pendientes: hoy o después y fuera de Hecho (ET02), en amarillo (ET04).
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Hoy", "2026-11-14", 1024.0);
    tarjeta_en(&servicio, EN_PROGRESO, "Después", "2026-11-20", 1024.0);
    tarjeta_en(&servicio, POR_HACER, "Otra después", "2026-11-20", 2048.0);
    assert_eq!(estado_en_mes(&servicio, "2026-11-14"), (0, 1, false, true));
    assert_eq!(estado_en_mes(&servicio, "2026-11-20"), (0, 2, false, true));
    // Con una vencida y pendientes en el mismo día no puede pasar (una fecha es pasada o no), pero la regla da
    // prioridad al rojo: amarillo solo sin vencidas (ET04).
    let mut estado = EstadoDelDia::default();
    let hoy = NaiveDate::from_ymd_opt(2026, 11, 14).unwrap();
    estado.contar(NaiveDate::from_ymd_opt(2026, 11, 10), false, hoy);
    estado.contar(NaiveDate::from_ymd_opt(2026, 11, 20), false, hoy);
    assert!(estado.hay_vencidas() && !estado.hay_pendientes());
}

#[test]
fn ca_he_10_hu05_ca04() {
    // HE-10-HU05-CA04 · Día solo con tarjetas completadas: sin resaltado (ET05), también en días pasados.
    let servicio = con_semilla();
    tarjeta_en(&servicio, HECHO, "Hecha", "2026-11-20", 1024.0);
    tarjeta_en(&servicio, HECHO, "Hecha antes", "2026-11-10", 1024.0);
    assert_eq!(estado_en_mes(&servicio, "2026-11-20"), (0, 0, false, false));
    assert_eq!(estado_en_mes(&servicio, "2026-11-10"), (0, 0, false, false));
}

#[test]
fn ca_he_10_hu05_ca05() {
    // HE-10-HU05-CA05 · Día sin tarjetas: sin resaltado.
    assert_eq!(
        estado_en_mes(&con_semilla(), "2026-11-10"),
        (0, 0, false, false)
    );
}

#[test]
fn ca_he_10_hu05_ca06() {
    // HE-10-HU05-CA06 · La única vencida pasa a Hecho: deja de contar y el día queda sin resaltado (ET10).
    let servicio = con_semilla();
    let id = tarjeta_en(&servicio, POR_HACER, "Pagar la luz", "2026-11-10", 1024.0);
    assert!(estado_en_mes(&servicio, "2026-11-10").2);
    bloquear(servicio.mover_tarjeta(
        USUARIO,
        CardMoveParams {
            card_id: Uuid(id),
            column_id: Uuid(HECHO.into()),
            placement: Placement::Variant1(PlacementVariant1 {
                kind: PlacementVariant1Kind::End,
            }),
        },
    ))
    .unwrap();
    assert_eq!(estado_en_mes(&servicio, "2026-11-10"), (0, 0, false, false));
}

#[test]
fn ca_he_10_hu05_ca07() {
    // HE-10-HU05-CA07 · Cambio de día: la tarjeta con fecha límite del día que termina, fuera de Hecho, es pendiente
    // hasta las 23:59 y vencida desde las 00:00 (ET09); «hoy» es la fecha del computador (ET18). Con hoy en 14/11,
    // la de ayer (13/11) ya es vencida.
    let ayer = NaiveDate::from_ymd_opt(2026, 11, 13);
    let mut antes = EstadoDelDia::default();
    antes.contar(ayer, false, NaiveDate::from_ymd_opt(2026, 11, 13).unwrap());
    assert!(antes.hay_pendientes() && !antes.hay_vencidas());
    let mut despues = EstadoDelDia::default();
    despues.contar(ayer, false, NaiveDate::from_ymd_opt(2026, 11, 14).unwrap());
    assert!(despues.hay_vencidas());
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Ayer", "2026-11-13", 1024.0);
    assert_eq!(estado_en_mes(&servicio, "2026-11-13"), (1, 0, true, false));
}

#[test]
fn ca_he_10_hu05_ca08() {
    // HE-10-HU05-CA08 · Resaltado en la vista semanal: los mismos conteos (ET08).
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Pagar la luz", "2026-11-10", 1024.0);
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-15",
        1024.0,
    );
    let s = semana(&servicio, "2026-11-09");
    let martes = &s.days[1];
    assert_eq!(
        (martes.overdue_count, martes.has_overdue, martes.has_pending),
        (1, true, false)
    );
    let domingo = &s.days[6];
    assert_eq!(
        (
            domingo.pending_count,
            domingo.has_overdue,
            domingo.has_pending
        ),
        (1, false, true)
    );
}
