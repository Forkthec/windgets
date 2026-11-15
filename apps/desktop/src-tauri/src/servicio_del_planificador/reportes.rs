//! Reportes del Servicio del planificador (HE-13, P18): rango de fechas, gráfica de completadas, tasa de
//! cumplimiento y conteos, calculados en el Núcleo.

use chrono::{Datelike, Duration, Months, NaiveDate};

use super::*;
use crate::tipos::{
    CompletedPoint, CompletedReport, ComplianceReport, RangeInput, RangeInputVariant1Kind,
    ReportFilter, ReportFilterParams, ReportGrouping, ReportMeta, ReportResolveRangeParams,
    ResolvedRange, StatusBreakdown,
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
        // `clipped_start` necesita la primera tarjeta: lo pone `rango_del_reporte` (HE-13-HU02-ET13).
        clipped_start: None,
    })
}

/// La fecha de un `DateIso` ya validado.
fn dia_de(valor: &DateIso) -> NaiveDate {
    fecha(&valor.0).unwrap_or_default()
}

fn iso(dia: NaiveDate) -> DateIso {
    DateIso(dia.format("%Y-%m-%d").to_string())
}

/// Los períodos de la gráfica entre `inicio` y `fin` (HE-13-HU02-ET06 a ET08): cada día; cada semana de lunes a
/// domingo; o cada mes. El primero y el último se recortan al rango.
pub fn periodos(
    inicio: NaiveDate,
    fin: NaiveDate,
    agrupacion: &ReportGrouping,
) -> Vec<(NaiveDate, NaiveDate)> {
    let mut lista = Vec::new();
    let mut desde = inicio;
    while desde <= fin {
        let hasta = match agrupacion {
            ReportGrouping::Day => desde,
            ReportGrouping::Week => {
                desde + Duration::days(6 - i64::from(desde.weekday().num_days_from_monday()))
            }
            ReportGrouping::Month => {
                let primero = desde.with_day(1).unwrap_or(desde);
                primero
                    .checked_add_months(Months::new(1))
                    .map(|siguiente| siguiente - Duration::days(1))
                    .unwrap_or(desde)
            }
        }
        .min(fin);
        lista.push((desde, hasta));
        desde = hasta + Duration::days(1);
    }
    lista
}

impl<C: Calendario> ServicioDelPlanificador<C> {
    /// Fecha de creación de la primera tarjeta del usuario (HE-13-HU02-ET13). DUDA: HE-13-HU02 `created_at` es
    /// un instante UTC; se toma su fecha (AAAA-MM-DD) sin pasarla a la hora local.
    async fn primera_tarjeta(&self, user_id: &str) -> Result<Option<NaiveDate>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let primera: Option<String> =
            sqlx::query_scalar("SELECT min(substr(created_at, 1, 10)) FROM card WHERE user_id = ?")
                .bind(user_id)
                .fetch_one(pool)
                .await
                .map_err(de_sqlx)?;
        Ok(primera.as_deref().and_then(fecha))
    }

    /// IPC-REP-01 `report_resolve_range` (HE-13-HU01): el rango con la fecha de hoy del computador y, si empieza
    /// antes de la primera tarjeta, la fecha desde la que se cuenta (`clipped_start`, HE-13-HU02-ET13).
    pub async fn rango_del_reporte(
        &self,
        user_id: &str,
        params: &ReportResolveRangeParams,
    ) -> Result<ResolvedRange, AppError> {
        let mut rango = resolver_rango(&params.range, self.calendario.hoy())?;
        if let Some(primera) = self.primera_tarjeta(user_id).await?
            && primera > dia_de(&rango.start)
            && primera <= dia_de(&rango.end)
        {
            rango.clipped_start = Some(iso(primera));
        }
        Ok(rango)
    }

    /// IPC-REP-02 `report_get_meta`: si hay tarjetas y etiquetas, y la fecha de la primera tarjeta.
    pub async fn meta_del_reporte(&self, user_id: &str) -> Result<ReportMeta, AppError> {
        let primera = self.primera_tarjeta(user_id).await?;
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let etiquetas: i64 = sqlx::query_scalar("SELECT count(*) FROM label WHERE user_id = ?")
            .bind(user_id)
            .fetch_one(pool)
            .await
            .map_err(de_sqlx)?;
        Ok(ReportMeta {
            has_cards: primera.is_some(),
            first_card_date: primera.map(iso),
            has_labels: etiquetas > 0,
        })
    }

    /// Las tarjetas del usuario que pasan el filtro de etiquetas: su fecha de creación, de completado y límite.
    /// Sin etiquetas elegidas, todas («Todas las etiquetas», HE-13-HU02-ET02). DUDA: HE-13-HU02 con varias
    /// etiquetas elegidas (HE-13-HU05) se toma la tarjeta que tenga cualquiera de ellas.
    pub(super) async fn tarjetas_del_filtro(
        &self,
        user_id: &str,
        filtro: &ReportFilter,
    ) -> Result<Vec<TarjetaDelReporte>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas: Vec<(String, String, Option<String>, String)> = sqlx::query_as(
            "SELECT id, substr(created_at, 1, 10), completed_on, due_date FROM card WHERE user_id = ?",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let elegidas: Vec<String> = filtro
            .label_ids
            .iter()
            .map(|u| u.0.to_lowercase())
            .collect();
        let uniones: Vec<(String, String)> = if elegidas.is_empty() {
            Vec::new()
        } else {
            sqlx::query_as("SELECT card_id, label_id FROM card_label WHERE user_id = ?")
                .bind(user_id)
                .fetch_all(pool)
                .await
                .map_err(de_sqlx)?
        };
        Ok(filas
            .into_iter()
            .filter(|(id, _, _, _)| {
                elegidas.is_empty()
                    || uniones
                        .iter()
                        .any(|(tarjeta, etiqueta)| tarjeta == id && elegidas.contains(etiqueta))
            })
            .filter_map(|(_, creada, completada, limite)| {
                Some(TarjetaDelReporte {
                    creada: fecha(&creada)?,
                    completada: completada.as_deref().and_then(fecha),
                    limite: fecha(&limite)?,
                })
            })
            .collect())
    }

    /// IPC-REP-03 `report_get_completed` (HE-13-HU02): tarjetas completadas por período, contadas por su fecha de
    /// completado (ET04), de los tres tipos (ET05), desde la primera tarjeta (ET13). Regla de 0 (ET09): con
    /// tarjetas creadas hasta el fin del rango, cada período tiene su cantidad, aunque sea 0. Regla de vacío
    /// (ET10): sin tarjetas que evaluar, `is_empty` y ningún punto.
    pub async fn completadas_del_reporte(
        &self,
        user_id: &str,
        params: &ReportFilterParams,
    ) -> Result<CompletedReport, AppError> {
        let rango = self
            .rango_del_reporte(
                user_id,
                &ReportResolveRangeParams {
                    range: params.filter.range.clone(),
                },
            )
            .await?;
        let inicio = rango
            .clipped_start
            .as_ref()
            .map(dia_de)
            .unwrap_or_else(|| dia_de(&rango.start));
        let fin = dia_de(&rango.end);
        let tarjetas = self.tarjetas_del_filtro(user_id, &params.filter).await?;
        if !tarjetas.iter().any(|t| t.creada <= fin) {
            return Ok(CompletedReport {
                grouping: rango.grouping,
                points: Vec::new(),
                is_empty: true,
            });
        }
        let points = periodos(inicio, fin, &rango.grouping)
            .into_iter()
            .map(|(desde, hasta)| CompletedPoint {
                period_start: iso(desde),
                period_end: iso(hasta),
                count: tarjetas
                    .iter()
                    .filter(|t| t.completada.is_some_and(|d| d >= desde && d <= hasta))
                    .count() as i64,
            })
            .collect();
        Ok(CompletedReport {
            grouping: rango.grouping,
            points,
            is_empty: false,
        })
    }

    /// IPC-REP-04 `report_get_compliance` (HE-13-HU03): tarjetas con fecha límite en el rango que llegaron a Hecho
    /// en o antes de su fecha límite ÷ las que ya están completadas o vencidas, × 100 (ET03). Las pendientes no
    /// cuentan hasta que se completan o vencen (ET06, D-045). Vencida: pendiente con fecha límite anterior a hoy.
    /// Sin tarjetas que evaluar, `is_empty` y sin porcentaje (regla de vacío, D-060).
    pub async fn cumplimiento_del_reporte(
        &self,
        user_id: &str,
        params: &ReportFilterParams,
    ) -> Result<ComplianceReport, AppError> {
        let hoy = self.calendario.hoy();
        let rango = resolver_rango(&params.filter.range, hoy)?;
        let (inicio, fin) = (dia_de(&rango.start), dia_de(&rango.end));
        let tarjetas = self.tarjetas_del_filtro(user_id, &params.filter).await?;
        let evaluadas: Vec<&TarjetaDelReporte> = tarjetas
            .iter()
            .filter(|t| t.limite >= inicio && t.limite <= fin)
            .filter(|t| t.completada.is_some() || t.limite < hoy)
            .collect();
        let total = evaluadas.len() as i64;
        let on_time = evaluadas
            .iter()
            .filter(|t| t.completada.is_some_and(|d| d <= t.limite))
            .count() as i64;
        Ok(ComplianceReport {
            percent: (total > 0).then(|| on_time as f64 * 100.0 / total as f64),
            on_time,
            total,
            is_empty: total == 0,
        })
    }

    /// IPC-REP-05 `report_get_status_breakdown` (HE-13-HU04): las tarjetas con fecha límite en el rango, por su
    /// estado actual (ET04, ET05): vencida (no completada, fecha límite ya pasada), pendiente (no completada,
    /// fecha límite hoy o futura) y completada (en Hecho). Porcentajes con un decimal (ET03).
    pub async fn estados_del_reporte(
        &self,
        user_id: &str,
        params: &ReportFilterParams,
    ) -> Result<StatusBreakdown, AppError> {
        let hoy = self.calendario.hoy();
        let rango = resolver_rango(&params.filter.range, hoy)?;
        let (inicio, fin) = (dia_de(&rango.start), dia_de(&rango.end));
        let tarjetas = self.tarjetas_del_filtro(user_id, &params.filter).await?;
        let (mut overdue, mut pending, mut completed) = (0i64, 0i64, 0i64);
        for t in tarjetas
            .iter()
            .filter(|t| t.limite >= inicio && t.limite <= fin)
        {
            match (t.completada, t.limite < hoy) {
                (Some(_), _) => completed += 1,
                (None, true) => overdue += 1,
                (None, false) => pending += 1,
            }
        }
        let total = overdue + pending + completed;
        let por_ciento = |n: i64| {
            if total == 0 {
                0.0
            } else {
                (n as f64 * 1000.0 / total as f64).round() / 10.0
            }
        };
        Ok(StatusBreakdown {
            overdue,
            pending,
            completed,
            total,
            percent_overdue: por_ciento(overdue),
            percent_pending: por_ciento(pending),
            percent_completed: por_ciento(completed),
            is_empty: total == 0,
        })
    }
}

/// Lo que los reportes necesitan de cada tarjeta.
pub(super) struct TarjetaDelReporte {
    pub creada: NaiveDate,
    pub completada: Option<NaiveDate>,
    pub limite: NaiveDate,
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
