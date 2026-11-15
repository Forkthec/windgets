//! Reportes del Servicio del planificador (HE-13, P18): rango de fechas, gráfica de completadas, tasa de
//! cumplimiento y conteos, calculados en el Núcleo.

use chrono::{Duration, Months, NaiveDate};

use super::*;
use crate::tipos::{
    RangeInput, RangeInputVariant1Kind, ReportGrouping, ReportResolveRangeParams, ResolvedRange,
};

/// Máximo del rango personalizado: 366 días contados ambos extremos (HE-13-HU01-ET08, D-170).
pub const DIAS_DEL_RANGO_MAX: i64 = 366;

/// Agrupación de la gráfica según los días del rango (IPC-REP-01; HE-13-HU02-ET06 a ET08): por día hasta 31,
/// por semana de 32 a 183 y por mes de 184 a 366.
pub fn agrupacion(dias: i64) -> ReportGrouping {
    match dias {
        ..=31 => ReportGrouping::Day,
        32..=183 => ReportGrouping::Week,
        _ => ReportGrouping::Month,
    }
}

/// Inicio de un rango predefinido que termina hoy (HE-13-HU01-ET01). DUDA: HE-13-HU01 no se define si los
/// rangos predefinidos incluyen el día de hoy; se toma que sí: «Últimos 7 días» va de hace 6 días a hoy y
/// «Últimos 12 meses», del día siguiente al de hace 12 meses a hoy.
fn inicio_predefinido(tipo: &RangeInputVariant1Kind, hoy: NaiveDate) -> NaiveDate {
    match tipo {
        RangeInputVariant1Kind::Last7 => hoy - Duration::days(6),
        RangeInputVariant1Kind::Last30 => hoy - Duration::days(29),
        RangeInputVariant1Kind::Last12Months => {
            hoy.checked_sub_months(Months::new(12)).unwrap_or(hoy) + Duration::days(1)
        }
    }
}

/// Una fecha del rango personalizado: obligatoria (ET06) y que exista en el calendario (ET05).
fn fecha_del_rango(valor: &str, vacia: ErrorCode, campo: &str) -> Result<NaiveDate, AppError> {
    if vacio(valor) {
        return Err(error(vacia, messages::CAMPO_OBLIGATORIO, Some(campo)));
    }
    fecha(valor).ok_or_else(|| {
        error(
            ErrorCode::RangeInvalidDate,
            messages::FECHA_INVALIDA,
            Some(campo),
        )
    })
}

/// IPC-REP-01: el rango de fechas resuelto, o el error de campo del rango personalizado (HE-13-HU01-ET05 a
/// ET08). El orden de los errores es el de los campos: primero la fecha de inicio, después la de fin.
pub fn resolver_rango(rango: &RangeInput, hoy: NaiveDate) -> Result<ResolvedRange, AppError> {
    let (inicio, fin) = match rango {
        RangeInput::Variant1(predefinido) => (inicio_predefinido(&predefinido.kind, hoy), hoy),
        RangeInput::Variant2(personalizado) => {
            let inicio = fecha_del_rango(
                &personalizado.start.0,
                ErrorCode::RangeStartRequired,
                "start",
            )?;
            let fin = fecha_del_rango(&personalizado.end.0, ErrorCode::RangeEndRequired, "end")?;
            if inicio > fin {
                return Err(error(
                    ErrorCode::RangeStartAfterEnd,
                    messages::INICIO_POSTERIOR_AL_FIN,
                    Some("end"),
                ));
            }
            (inicio, fin)
        }
    };
    let dias = (fin - inicio).num_days() + 1;
    if dias > DIAS_DEL_RANGO_MAX {
        return Err(error(
            ErrorCode::RangeTooLong,
            messages::RANGO_MUY_LARGO,
            Some("end"),
        ));
    }
    Ok(ResolvedRange {
        start: DateIso(inicio.format("%Y-%m-%d").to_string()),
        end: DateIso(fin.format("%Y-%m-%d").to_string()),
        days: dias,
        grouping: agrupacion(dias),
        // DUDA: HE-13-HU01 `clipped_start` (la fecha de la primera tarjeta cuando el rango empieza antes) es
        // de HE-13-HU02-ET13; se calcula con esa HU.
        clipped_start: None,
    })
}

impl<C: Calendario> ServicioDelPlanificador<C> {
    /// IPC-REP-01 `report_resolve_range` (HE-13-HU01): el rango con la fecha de hoy del computador.
    pub fn rango_del_reporte(
        &self,
        params: &ReportResolveRangeParams,
    ) -> Result<ResolvedRange, AppError> {
        resolver_rango(&params.range, self.calendario.hoy())
    }
}

#[cfg(test)]
mod pruebas {
    use super::*;
    use crate::tipos::{RangeInputVariant1, RangeInputVariant2, RangeInputVariant2Kind};

    fn dia(texto: &str) -> NaiveDate {
        fecha(texto).unwrap()
    }

    fn personalizado(inicio: &str, fin: &str) -> RangeInput {
        RangeInput::Variant2(RangeInputVariant2 {
            kind: RangeInputVariant2Kind::Custom,
            start: DateIso(inicio.into()),
            end: DateIso(fin.into()),
        })
    }

    fn predefinido(tipo: RangeInputVariant1Kind) -> RangeInput {
        RangeInput::Variant1(RangeInputVariant1 { kind: tipo })
    }

    const HOY: &str = "2026-11-14";

    fn codigo(rango: RangeInput) -> (ErrorCode, String, Option<String>) {
        let e = resolver_rango(&rango, dia(HOY)).unwrap_err();
        (e.code, e.message, e.field)
    }

    #[test]
    fn ca_he_13_hu01_ca01() {
        // HE-13-HU01-CA01 · Rangos predefinidos que terminan hoy (ET01, ET02).
        let siete = resolver_rango(&predefinido(RangeInputVariant1Kind::Last7), dia(HOY)).unwrap();
        assert_eq!(
            (siete.start.0.as_str(), siete.end.0.as_str(), siete.days),
            ("2026-11-08", HOY, 7)
        );
        let treinta =
            resolver_rango(&predefinido(RangeInputVariant1Kind::Last30), dia(HOY)).unwrap();
        assert_eq!((treinta.start.0.as_str(), treinta.days), ("2026-10-16", 30));
        let doce =
            resolver_rango(&predefinido(RangeInputVariant1Kind::Last12Months), dia(HOY)).unwrap();
        assert_eq!((doce.start.0.as_str(), doce.days), ("2025-11-15", 365));
        assert_eq!(doce.grouping, ReportGrouping::Month);
    }

    #[test]
    fn ca_he_13_hu01_ca02() {
        // HE-13-HU01-CA02 · Del 01/10/2026 al 15/10/2026: 15 días, agrupado por día.
        let r = resolver_rango(&personalizado("2026-10-01", "2026-10-15"), dia(HOY)).unwrap();
        assert_eq!(
            (r.start.0.as_str(), r.end.0.as_str(), r.days, r.grouping),
            ("2026-10-01", "2026-10-15", 15, ReportGrouping::Day)
        );
    }

    #[test]
    fn ca_he_13_hu01_ca03() {
        // HE-13-HU01-CA03 · Inicio posterior al fin: mensaje en Fecha de fin (ET07, ET11).
        assert_eq!(
            codigo(personalizado("2026-10-15", "2026-10-10")),
            (
                ErrorCode::RangeStartAfterEnd,
                "La fecha de inicio no puede ser posterior a la fecha de fin.".into(),
                Some("end".into())
            )
        );
    }

    #[test]
    fn ca_he_13_hu01_ca04() {
        // HE-13-HU01-CA04 · Fecha de inicio vacía (ET06, ET12).
        assert_eq!(
            codigo(personalizado("", "2026-10-15")),
            (
                ErrorCode::RangeStartRequired,
                "Este campo es obligatorio.".into(),
                Some("start".into())
            )
        );
    }

    #[test]
    fn ca_he_13_hu01_ca05() {
        // HE-13-HU01-CA05 · Fecha de fin vacía (ET06, ET12).
        assert_eq!(
            codigo(personalizado("2026-10-01", " ")),
            (
                ErrorCode::RangeEndRequired,
                "Este campo es obligatorio.".into(),
                Some("end".into())
            )
        );
    }

    #[test]
    fn ca_he_13_hu01_ca06() {
        // HE-13-HU01-CA06 · Más de 366 días; del 01/10/2025 al 01/10/2026 (366 días) sí es válido (ET08).
        assert_eq!(
            codigo(personalizado("2025-01-01", "2026-10-15")),
            (
                ErrorCode::RangeTooLong,
                "El rango máximo es de un año.".into(),
                Some("end".into())
            )
        );
        let limite = resolver_rango(&personalizado("2025-10-01", "2026-10-01"), dia(HOY)).unwrap();
        assert_eq!(limite.days, 366);
    }

    #[test]
    fn ca_he_13_hu01_ca07() {
        // HE-13-HU01-CA07 · 31/02/2026 no existe en el calendario (ET05, ET14).
        assert_eq!(
            codigo(personalizado("2026-02-31", "2026-10-15")),
            (
                ErrorCode::RangeInvalidDate,
                "Diligencia una fecha válida.".into(),
                Some("start".into())
            )
        );
    }

    #[test]
    fn ca_he_13_hu01_ca08() {
        // HE-13-HU01-CA08 · Un formato que no es una fecha (la vista convierte DD/MM/AAAA; el Núcleo recibe ISO).
        assert_eq!(
            codigo(personalizado("01-10-2026", "2026-10-15")).0,
            ErrorCode::RangeInvalidDate
        );
    }

    #[test]
    fn agrupa_por_dia_semana_y_mes() {
        // IPC-REP-01: día hasta 31, semana de 32 a 183, mes de 184 a 366.
        assert_eq!(
            [1, 31, 32, 183, 184, 366].map(agrupacion),
            [
                ReportGrouping::Day,
                ReportGrouping::Day,
                ReportGrouping::Week,
                ReportGrouping::Week,
                ReportGrouping::Month,
                ReportGrouping::Month
            ]
        );
    }
}
