//! Comandos IPC: tarjetas, agenda, calendario y planificador diario (a.2) (docs/tipos.ts, sección 5).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardCreateParams {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub r#type: Option<CardType>,
    pub title: String,
    pub due_date: DateIso,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub priority: Option<Priority>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardPatch {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub r#type: Option<CardType>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub due_date: Option<DateIso>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<Option<String>>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub priority: Option<Option<Priority>>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardUpdateParams {
    pub id: Uuid,
    pub patch: CardPatch,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardIdParams {
    pub id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct BoardColumn {
    pub column: Column,
    pub cards: Vec<Card>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardListBoardResult {
    pub columns: Vec<BoardColumn>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum PlacementVariant1Kind {
    #[serde(rename = "end")]
    End,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct PlacementVariant1 {
    pub kind: PlacementVariant1Kind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum PlacementVariant2Kind {
    #[serde(rename = "before")]
    Before,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct PlacementVariant2 {
    pub kind: PlacementVariant2Kind,
    pub card_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum Placement {
    Variant1(PlacementVariant1),
    Variant2(PlacementVariant2),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardMoveParams {
    pub card_id: Uuid,
    pub column_id: Uuid,
    pub placement: Placement,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardSetCompletedParams {
    pub card_id: Uuid,
    pub completed: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct PlannerItem {
    pub card: Card,
    pub hour: Option<Hour>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct PlannerSummary {
    pub total: i64,
    pub completed: i64,
    pub remaining: i64,
    pub percent: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct PlannerToday {
    pub date: DateIso,
    pub items: Vec<PlannerItem>,
    pub summary: PlannerSummary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AgendaDayParams {
    pub date: DateIso,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AgendaBlock {
    pub hour: Hour,
    pub cards: Vec<Card>,
    pub is_past: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AgendaDay {
    pub date: DateIso,
    pub is_today: bool,
    pub current_hour: Option<Hour>,
    pub blocks: Vec<AgendaBlock>,
    pub unscheduled: Vec<Card>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardAssignTimeBlockParams {
    pub card_id: Uuid,
    pub date: DateIso,
    pub hour: Hour,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardUnassignTimeBlockParams {
    pub card_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarMonthParams {
    pub year: i64,
    pub month: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarMonthDayPreviewItem {
    pub id: Uuid,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarMonthDay {
    pub date: DateIso,
    pub preview: Vec<CalendarMonthDayPreviewItem>,
    pub extra_count: i64,
    pub overdue_count: i64,
    pub pending_count: i64,
    pub has_overdue: bool,
    pub has_pending: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarMonth {
    pub days: Vec<CalendarMonthDay>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarWeekParams {
    pub week_start: DateIso,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarWeekDayCardsItem {
    pub card: Card,
    pub start_hour: Option<Hour>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarWeekDay {
    pub date: DateIso,
    pub cards: Vec<CalendarWeekDayCardsItem>,
    pub overdue_count: i64,
    pub pending_count: i64,
    pub has_overdue: bool,
    pub has_pending: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarWeek {
    pub days: Vec<CalendarWeekDay>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarDayParams {
    pub date: DateIso,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarDayCardsItem {
    pub id: Uuid,
    pub r#type: CardType,
    pub title: String,
    pub priority: Option<Priority>,
    pub column_name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CalendarDay {
    pub date: DateIso,
    pub cards: Vec<CalendarDayCardsItem>,
    pub can_create: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct KanbanWidgetColumnTitlesItem {
    pub card_id: Uuid,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct KanbanWidgetColumn {
    pub column: Column,
    pub titles: Vec<KanbanWidgetColumnTitlesItem>,
    pub extra_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct KanbanWidgetData {
    pub columns: Vec<KanbanWidgetColumn>,
}
