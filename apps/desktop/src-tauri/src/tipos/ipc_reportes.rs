//! Comandos IPC: reportes (a.5) (docs/tipos.ts, sección 7).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum RangeInputVariant1Kind {
    #[serde(rename = "last_7")]
    Last7,
    #[serde(rename = "last_30")]
    Last30,
    #[serde(rename = "last_12_months")]
    Last12Months,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RangeInputVariant1 {
    pub kind: RangeInputVariant1Kind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum RangeInputVariant2Kind {
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RangeInputVariant2 {
    pub kind: RangeInputVariant2Kind,
    pub start: DateIso,
    pub end: DateIso,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum RangeInput {
    Variant1(RangeInputVariant1),
    Variant2(RangeInputVariant2),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ReportFilter {
    pub range: RangeInput,
    pub label_ids: Vec<Uuid>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ReportGrouping {
    #[serde(rename = "day")]
    Day,
    #[serde(rename = "week")]
    Week,
    #[serde(rename = "month")]
    Month,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ReportResolveRangeParams {
    pub range: RangeInput,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ResolvedRange {
    pub start: DateIso,
    pub end: DateIso,
    pub days: i64,
    pub grouping: ReportGrouping,
    pub clipped_start: Option<DateIso>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ReportMeta {
    pub has_cards: bool,
    pub first_card_date: Option<DateIso>,
    pub has_labels: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ReportFilterParams {
    pub filter: ReportFilter,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CompletedPoint {
    pub period_start: DateIso,
    pub period_end: DateIso,
    pub count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CompletedReport {
    pub grouping: ReportGrouping,
    pub points: Vec<CompletedPoint>,
    pub is_empty: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ComplianceReport {
    pub percent: Option<f64>,
    pub on_time: i64,
    pub total: i64,
    pub is_empty: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct StatusBreakdown {
    pub overdue: i64,
    pub pending: i64,
    pub completed: i64,
    pub total: i64,
    pub percent_overdue: f64,
    pub percent_pending: f64,
    pub percent_completed: f64,
    pub is_empty: bool,
}
