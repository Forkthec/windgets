//! Pruebas del Núcleo de HE-13 (reportes) que necesitan la base: HE-13-HU02 a HU04. Las del rango (HE-13-HU01)
//! están en reportes.rs.

use super::pruebas::*;
use super::*;
use crate::tipos::{
    RangeInput, RangeInputVariant1, RangeInputVariant1Kind, RangeInputVariant2,
    RangeInputVariant2Kind, ReportFilter, ReportFilterParams, ReportGrouping,
};

/// Inserta una tarjeta con su tipo, fecha de creación, fecha límite y, si está completada, su fecha de completado
/// (en la columna Hecho).
pub(crate) fn tarjeta_del_reporte(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    tipo: &str,
    creada: &str,
    limite: &str,
    completada: Option<&str>,
) -> String {
    let id = uuid::Uuid::new_v4().to_string();
    let columna = if completada.is_some() {
        HECHO
    } else {
        POR_HACER
    };
    bloquear(async {
        sqlx::query(
            "INSERT INTO card (id, user_id, created_at, type, title, due_date, column_id, position, \
             completed_on) VALUES (?, ?, ?, ?, 'T', ?, ?, 1024, ?)",
        )
        .bind(&id)
        .bind(USUARIO)
        .bind(format!("{creada}T12:00:00.000Z"))
        .bind(tipo)
        .bind(limite)
        .bind(columna)
        .bind(completada)
        .execute(servicio.base().pool().await.unwrap())
        .await
        .unwrap();
    });
    id
}

pub(crate) fn predefinido(tipo: RangeInputVariant1Kind) -> RangeInput {
    RangeInput::Variant1(RangeInputVariant1 { kind: tipo })
}

pub(crate) fn personalizado(inicio: &str, fin: &str) -> RangeInput {
    RangeInput::Variant2(RangeInputVariant2 {
        kind: RangeInputVariant2Kind::Custom,
        start: DateIso(inicio.into()),
        end: DateIso(fin.into()),
    })
}

pub(crate) fn filtro(rango: RangeInput) -> ReportFilterParams {
    ReportFilterParams {
        filter: ReportFilter {
            range: rango,
            label_ids: Vec::new(),
        },
    }
}

fn completadas(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    rango: RangeInput,
) -> crate::tipos::CompletedReport {
    bloquear(servicio.completadas_del_reporte(USUARIO, &filtro(rango))).unwrap()
}

#[test]
fn ca_he_13_hu02_ca01() {
    // HE-13-HU02-CA01 · Tarea, Recordatorio y Evento completados el mismo día: 3 ese día, agrupado por día (ET04
    // a ET06).
    let servicio = con_semilla();
    for tipo in ["task", "reminder", "event"] {
        tarjeta_del_reporte(
            &servicio,
            tipo,
            "2026-10-20",
            "2026-11-20",
            Some("2026-11-10"),
        );
    }
    let r = completadas(&servicio, predefinido(RangeInputVariant1Kind::Last30));
    assert_eq!(r.grouping, ReportGrouping::Day);
    assert!(!r.is_empty);
    let dia = r
        .points
        .iter()
        .find(|p| p.period_start.0 == "2026-11-10")
        .unwrap();
    assert_eq!(dia.count, 3);
    assert_eq!(r.points.iter().map(|p| p.count).sum::<i64>(), 3);
}

#[test]
fn ca_he_13_hu02_ca02() {
    // HE-13-HU02-CA02 · 01/05/2026 a 30/09/2026 (153 días): por semana de lunes a domingo (ET07).
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-04-01",
        "2026-05-10",
        Some("2026-05-06"),
    );
    let r = completadas(&servicio, personalizado("2026-05-01", "2026-09-30"));
    assert_eq!(r.grouping, ReportGrouping::Week);
    // El 01/05/2026 es viernes: la primera semana se recorta al rango y termina el domingo 03/05.
    let primera = &r.points[0];
    assert_eq!(
        (
            primera.period_start.0.as_str(),
            primera.period_end.0.as_str()
        ),
        ("2026-05-01", "2026-05-03")
    );
    let segunda = &r.points[1];
    assert_eq!(
        (
            segunda.period_start.0.as_str(),
            segunda.period_end.0.as_str(),
            segunda.count
        ),
        ("2026-05-04", "2026-05-10", 1)
    );
    assert_eq!(r.points.last().unwrap().period_end.0, "2026-09-30");
}

#[test]
fn ca_he_13_hu02_ca03() {
    // HE-13-HU02-CA03 · «Últimos 12 meses»: por mes (ET08).
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2025-01-01",
        "2026-03-31",
        Some("2026-03-15"),
    );
    let r = completadas(&servicio, predefinido(RangeInputVariant1Kind::Last12Months));
    assert_eq!(r.grouping, ReportGrouping::Month);
    let marzo = r
        .points
        .iter()
        .find(|p| p.period_start.0 == "2026-03-01")
        .unwrap();
    assert_eq!(
        (marzo.period_end.0.as_str(), marzo.count),
        ("2026-03-31", 1)
    );
}

#[test]
fn ca_he_13_hu02_ca04() {
    // HE-13-HU02-CA04 · Tarjetas creadas, ninguna completada en el rango: 0 en cada período (regla de 0, ET09).
    let servicio = con_semilla();
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-12-01", None);
    let r = completadas(&servicio, predefinido(RangeInputVariant1Kind::Last7));
    assert!(!r.is_empty);
    assert_eq!(r.points.len(), 7);
    assert!(r.points.iter().all(|p| p.count == 0));
}

#[test]
fn ca_he_13_hu02_ca05() {
    // HE-13-HU02-CA05 · Sin tarjetas: la vista muestra el mensaje de la cuenta sin tarjetas (ET12).
    let servicio = con_semilla();
    let meta = bloquear(servicio.meta_del_reporte(USUARIO)).unwrap();
    assert_eq!((meta.has_cards, meta.first_card_date), (false, None));
}

#[test]
fn ca_he_13_hu02_ca06() {
    // HE-13-HU02-CA06 · Primera tarjeta el 10/11/2026 dentro de «Últimos 30 días»: cuenta desde ese día (ET13).
    let servicio = con_semilla();
    tarjeta_del_reporte(&servicio, "task", "2026-11-10", "2026-11-20", None);
    let rango = bloquear(servicio.rango_del_reporte(
        USUARIO,
        &crate::tipos::ReportResolveRangeParams {
            range: predefinido(RangeInputVariant1Kind::Last30),
        },
    ))
    .unwrap();
    assert_eq!(rango.clipped_start, Some(DateIso("2026-11-10".into())));
    let r = completadas(&servicio, predefinido(RangeInputVariant1Kind::Last30));
    assert_eq!(r.points[0].period_start.0, "2026-11-10");
    assert_eq!(r.points.len(), 5);
    let meta = bloquear(servicio.meta_del_reporte(USUARIO)).unwrap();
    assert_eq!(meta.first_card_date, Some(DateIso("2026-11-10".into())));
}

#[test]
fn ca_he_13_hu02_ca07() {
    // HE-13-HU02-CA07 · Primera tarjeta el 10/10/2026 y rango de enero: sección vacía, sin 0 (regla de vacío,
    // ET10).
    let servicio = con_semilla();
    tarjeta_del_reporte(&servicio, "task", "2026-10-10", "2026-10-20", None);
    let r = completadas(&servicio, personalizado("2026-01-01", "2026-01-31"));
    assert!(r.is_empty);
    assert!(r.points.is_empty());
}

#[test]
fn ca_he_13_hu02_ca10() {
    // HE-13-HU02-CA10 · Sin conexión: se calcula con la base local, sin llamar a la nube (ET19). El servicio solo
    // lee SQLite; la misma consulta responde igual.
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-20",
        "2026-11-20",
        Some("2026-11-12"),
    );
    let r = completadas(&servicio, predefinido(RangeInputVariant1Kind::Last30));
    assert_eq!(r.points.iter().map(|p| p.count).sum::<i64>(), 1);
}

fn cumplimiento(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    params: ReportFilterParams,
) -> crate::tipos::ComplianceReport {
    bloquear(servicio.cumplimiento_del_reporte(USUARIO, &params)).unwrap()
}

fn tasa(r: &crate::tipos::ComplianceReport) -> (String, i64, i64) {
    (format!("{:.1}", r.percent.unwrap()), r.on_time, r.total)
}

// Hoy es 14/11/2026: «Últimos 30 días» va del 16/10 al 14/11 y «Últimos 7 días» del 08/11 al 14/11.

#[test]
fn ca_he_13_hu03_ca01() {
    // HE-13-HU03-CA01 · 2 completadas a tiempo y 1 vencida: 66,7 %, 2 de 3 (ET03).
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-01",
        Some("2026-10-30"),
    );
    tarjeta_del_reporte(
        &servicio,
        "event",
        "2026-10-01",
        "2026-11-05",
        Some("2026-11-05"),
    );
    tarjeta_del_reporte(&servicio, "reminder", "2026-10-01", "2026-11-10", None);
    let r = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last30)),
    );
    assert_eq!(tasa(&r), ("66.7".into(), 2, 3));
}

#[test]
fn ca_he_13_hu03_ca02() {
    // HE-13-HU03-CA02 · Completada el día límite y otra un día después: 50,0 %, 1 de 2.
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-05",
        Some("2026-11-05"),
    );
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-05",
        Some("2026-11-06"),
    );
    let r = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last30)),
    );
    assert_eq!(tasa(&r), ("50.0".into(), 1, 2));
}

#[test]
fn ca_he_13_hu03_ca03() {
    // HE-13-HU03-CA03 · Con «Últimos 7 días» la vencida del 20/10 queda fuera: 100,0 %, 2 de 2.
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-10",
        Some("2026-11-09"),
    );
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-12",
        Some("2026-11-12"),
    );
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-10-20", None);
    let r30 = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last30)),
    );
    assert_eq!((r30.on_time, r30.total), (2, 3));
    let r7 = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last7)),
    );
    assert_eq!(tasa(&r7), ("100.0".into(), 2, 2));
}

#[test]
fn ca_he_13_hu03_ca04() {
    // HE-13-HU03-CA04 · Filtro «Trabajo»: solo su tarjeta, 100,0 %, 1 de 1 (ET05).
    let servicio = con_semilla();
    let trabajo = tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-05",
        Some("2026-11-04"),
    );
    let casa = tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-05", None);
    let mut ids = Vec::new();
    for (nombre, tarjeta) in [("Trabajo", &trabajo), ("Casa", &casa)] {
        let etiqueta = uuid::Uuid::new_v4().to_string();
        bloquear(async {
            let pool = servicio.base().pool().await.unwrap();
            sqlx::query(
                "INSERT INTO label (id, user_id, created_at, name, color_id) \
                 VALUES (?, ?, '2026-10-01T12:00:00.000Z', ?, 'blue')",
            )
            .bind(&etiqueta)
            .bind(USUARIO)
            .bind(nombre)
            .execute(pool)
            .await
            .unwrap();
            sqlx::query(
                "INSERT INTO card_label (id, user_id, created_at, card_id, label_id) \
                 VALUES (?, ?, '2026-10-01T12:00:00.000Z', ?, ?)",
            )
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(USUARIO)
            .bind(tarjeta)
            .bind(&etiqueta)
            .execute(pool)
            .await
            .unwrap();
        });
        ids.push(etiqueta);
    }
    let mut params = filtro(predefinido(RangeInputVariant1Kind::Last30));
    params.filter.label_ids = vec![crate::tipos::Uuid(ids[0].clone())];
    let r = cumplimiento(&servicio, params);
    assert_eq!(tasa(&r), ("100.0".into(), 1, 1));
}

#[test]
fn ca_he_13_hu03_ca05() {
    // HE-13-HU03-CA05 · Sin completadas ni vencidas en el rango: vacío, sin porcentaje.
    let servicio = con_semilla();
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-20", None);
    let r = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last30)),
    );
    assert!(r.is_empty);
    assert_eq!((r.percent, r.total), (None, 0));
}

#[test]
fn ca_he_13_hu03_ca06() {
    // HE-13-HU03-CA06 · 2 vencidas y 1 completada tarde: 0,0 %, 0 de 3 (regla de 0, ET08).
    let servicio = con_semilla();
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-01", None);
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-02", None);
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-03",
        Some("2026-11-04"),
    );
    let r = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last30)),
    );
    assert!(!r.is_empty);
    assert_eq!(tasa(&r), ("0.0".into(), 0, 3));
}

#[test]
fn ca_he_13_hu03_ca07() {
    // HE-13-HU03-CA07 · La pendiente que vence hoy aún no cuenta: 100,0 %, 2 de 2 (ET06, D-045).
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-01",
        Some("2026-11-01"),
    );
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-02",
        Some("2026-10-31"),
    );
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-14", None);
    let r = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last30)),
    );
    assert_eq!(tasa(&r), ("100.0".into(), 2, 2));
}

#[test]
fn ca_he_13_hu03_ca08() {
    // HE-13-HU03-CA08 · Una sola tarjeta a tiempo: 100,0 %, 1 de 1.
    let servicio = con_semilla();
    tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-05",
        Some("2026-11-05"),
    );
    let r = cumplimiento(
        &servicio,
        filtro(predefinido(RangeInputVariant1Kind::Last30)),
    );
    assert_eq!(tasa(&r), ("100.0".into(), 1, 1));
}

fn estados(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
) -> crate::tipos::StatusBreakdown {
    bloquear(servicio.estados_del_reporte(
        USUARIO,
        &filtro(predefinido(RangeInputVariant1Kind::Last30)),
    ))
    .unwrap()
}

#[test]
fn ca_he_13_hu04_ca01() {
    // HE-13-HU04-CA01 · 2 vencidas, 3 pendientes (una vence hoy) y 5 completadas: 20,0 %, 30,0 % y 50,0 %
    // (ET03 a ET05). Una fuera del rango no cuenta.
    let servicio = con_semilla();
    for limite in ["2026-11-01", "2026-11-13"] {
        tarjeta_del_reporte(&servicio, "task", "2026-10-01", limite, None);
    }
    for _ in 0..3 {
        tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-14", None);
    }
    for _ in 0..5 {
        tarjeta_del_reporte(
            &servicio,
            "task",
            "2026-10-01",
            "2026-11-05",
            Some("2026-11-07"),
        );
    }
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-10-01", None);
    let r = estados(&servicio);
    assert_eq!((r.overdue, r.pending, r.completed, r.total), (2, 3, 5, 10));
    assert_eq!(
        (r.percent_overdue, r.percent_pending, r.percent_completed),
        (20.0, 30.0, 50.0)
    );
    assert!(!r.is_empty);
}

#[test]
fn ca_he_13_hu04_ca04() {
    // HE-13-HU04-CA04 · Sin tarjetas con fecha límite en el rango: vacío.
    let servicio = con_semilla();
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-12-20", None);
    let r = estados(&servicio);
    assert!(r.is_empty);
    assert_eq!(r.total, 0);
}

#[test]
fn ca_he_13_hu04_ca05() {
    // HE-13-HU04-CA05 · 0 vencidas, 2 pendientes y 3 completadas: 0,0 %, 40,0 % y 60,0 % (ET10).
    let servicio = con_semilla();
    for _ in 0..2 {
        tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-14", None);
    }
    for _ in 0..3 {
        tarjeta_del_reporte(
            &servicio,
            "task",
            "2026-10-01",
            "2026-11-01",
            Some("2026-11-02"),
        );
    }
    let r = estados(&servicio);
    assert_eq!((r.overdue, r.pending, r.completed), (0, 2, 3));
    assert_eq!(
        (r.percent_overdue, r.percent_pending, r.percent_completed),
        (0.0, 40.0, 60.0)
    );
}

// HE-13-HU05 · Filtrar los reportes por etiqueta.

fn con_etiqueta(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    tarjeta: &str,
    etiqueta: &str,
) {
    bloquear(async {
        sqlx::query("INSERT INTO card_label (id, user_id, created_at, card_id, label_id) VALUES (?, ?, ?, ?, ?)")
            .bind(uuid::Uuid::new_v4().to_string())
            .bind(USUARIO)
            .bind("2026-11-01T00:00:00.000Z")
            .bind(tarjeta)
            .bind(etiqueta)
            .execute(servicio.base().pool().await.unwrap())
            .await
            .unwrap();
    });
}

/// El desglose por estados con el filtro de etiquetas dado (Últimos 30 días).
fn estados_con(
    servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
    etiquetas: &[&str],
) -> crate::tipos::StatusBreakdown {
    let mut f = filtro(predefinido(RangeInputVariant1Kind::Last30));
    f.filter.label_ids = etiquetas.iter().map(|e| Uuid((*e).into())).collect();
    bloquear(servicio.estados_del_reporte(USUARIO, &f)).unwrap()
}

/// Una tarjeta pendiente con la etiqueta, otra completada con la etiqueta y una sin etiquetas, por etiqueta.
fn con_tres_etiquetas() -> (
    ServicioDelPlanificador<CalendarioDePrueba>,
    String,
    String,
    String,
) {
    let servicio = con_semilla();
    let trabajo = etiqueta(&servicio, "Trabajo");
    let casa = etiqueta(&servicio, "Casa");
    let estudio = etiqueta(&servicio, "Estudio");
    let t = tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-14", None);
    con_etiqueta(&servicio, &t, &trabajo);
    let c = tarjeta_del_reporte(
        &servicio,
        "task",
        "2026-10-01",
        "2026-11-05",
        Some("2026-11-07"),
    );
    con_etiqueta(&servicio, &c, &casa);
    tarjeta_del_reporte(&servicio, "task", "2026-10-01", "2026-11-14", None);
    (servicio, trabajo, casa, estudio)
}

#[test]
fn ca_he_13_hu05_ca01() {
    // HE-13-HU05-CA01 · Solo las tarjetas con «Trabajo» (ET03, ET04: el mismo filtro en cada sección).
    let (servicio, trabajo, _, _) = con_tres_etiquetas();
    let r = estados_con(&servicio, &[&trabajo]);
    assert_eq!((r.total, r.pending, r.completed), (1, 1, 0));
}

#[test]
fn ca_he_13_hu05_ca02() {
    // HE-13-HU05-CA02 · Con «Trabajo» y «Casa», las que tienen al menos una de las dos (ET02, ET03).
    let (servicio, trabajo, casa, _) = con_tres_etiquetas();
    let r = estados_con(&servicio, &[&trabajo, &casa]);
    assert_eq!((r.total, r.pending, r.completed), (2, 1, 1));
}

#[test]
fn ca_he_13_hu05_ca03() {
    // HE-13-HU05-CA03 · «Todas las etiquetas» (sin etiquetas elegidas): todas las tarjetas (ET05).
    let (servicio, _, _, _) = con_tres_etiquetas();
    assert_eq!(estados_con(&servicio, &[]).total, 3);
}

#[test]
fn ca_he_13_hu05_ca04() {
    // HE-13-HU05-CA04 · «Estudio» sin tarjetas en el rango: secciones vacías (la vista muestra el texto de
    // HE-13-HU02-CA07).
    let (servicio, _, _, estudio) = con_tres_etiquetas();
    let r = estados_con(&servicio, &[&estudio]);
    assert!(r.is_empty);
    assert_eq!(r.total, 0);
}

#[test]
fn ca_he_13_hu05_ca05() {
    // HE-13-HU05-CA05 · Sin etiquetas creadas, `has_labels` es falso (la vista deshabilita el filtro, ET06).
    let servicio = con_semilla();
    assert!(
        !bloquear(servicio.meta_del_reporte(USUARIO))
            .unwrap()
            .has_labels
    );
    etiqueta(&servicio, "Trabajo");
    assert!(
        bloquear(servicio.meta_del_reporte(USUARIO))
            .unwrap()
            .has_labels
    );
}
