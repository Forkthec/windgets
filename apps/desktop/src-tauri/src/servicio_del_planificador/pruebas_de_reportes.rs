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
