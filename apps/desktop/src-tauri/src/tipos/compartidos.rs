//! Tipos compartidos (contratos.md, 1.6) (docs/tipos.ts, sección 3).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Card {
    pub id: Uuid,
    pub r#type: CardType,
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<Priority>,
    pub due_date: DateIso,
    pub column_id: Uuid,
    pub position: i64,
    pub previous_column_id: Option<Uuid>,
    pub completed_on: Option<DateIso>,
    pub scheduled_date: Option<DateIso>,
    pub scheduled_hour: Option<Hour>,
    pub label_ids: Vec<Uuid>,
    pub is_completed: bool,
    pub is_overdue: bool,
    pub created_at: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardDetailLabelsItem {
    pub id: Uuid,
    pub name: String,
    pub color_hex: Hex,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardDetailColumn {
    pub id: Uuid,
    pub name: String,
    pub color_hex: Hex,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardDetailTimeBlock {
    pub date: DateIso,
    pub hour: Hour,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CardDetail {
    #[serde(flatten)]
    pub base_card: Card,
    pub labels: Vec<CardDetailLabelsItem>,
    pub column: CardDetailColumn,
    pub time_block: Option<CardDetailTimeBlock>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Label {
    pub id: Uuid,
    pub name: String,
    pub color_id: String,
    pub color_hex: Hex,
    pub card_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Column {
    pub id: Uuid,
    pub name: String,
    pub color_id: String,
    pub color_hex: Hex,
    pub role: ColumnRole,
    pub position: i64,
    pub card_count: i64,
    pub is_default: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum FontSize {
    #[serde(rename = "small")]
    Small,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "large")]
    Large,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum BackgroundSource {
    #[serde(rename = "template_default")]
    TemplateDefault,
    #[serde(rename = "catalog")]
    Catalog,
    #[serde(rename = "own")]
    Own,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeBackground {
    pub source: BackgroundSource,
    pub catalog_image_id: Option<String>,
    pub uploaded_image_id: Option<Uuid>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeColors {
    pub primary: Hex,
    pub secondary: Hex,
    pub text: Hex,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeContentFont {
    pub id: String,
    pub size: FontSize,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeContent {
    pub template_id: String,
    pub background: ThemeBackground,
    pub colors: ThemeColors,
    pub palette_id: Option<String>,
    pub font: ThemeContentFont,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeSummary {
    pub id: Uuid,
    pub name: String,
    pub last_modified_at: Instant,
    pub is_applied: bool,
    pub has_unapplied_changes: bool,
    pub has_unsaved_changes: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum LegibilityPair {
    #[serde(rename = "ink_surface")]
    InkSurface,
    #[serde(rename = "text_surface")]
    TextSurface,
    #[serde(rename = "control_surface")]
    ControlSurface,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LegibilityItem {
    pub pair: LegibilityPair,
    pub ratio: f64,
    pub min: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LegibilitySuggestion {
    pub pair: LegibilityPair,
    pub color: Hex,
    pub ratio: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Legibility {
    pub ok: bool,
    pub items: Vec<LegibilityItem>,
    pub suggestion: Option<LegibilitySuggestion>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftView {
    pub theme_id: Uuid,
    pub name: String,
    pub content: ThemeContent,
    pub dirty: bool,
    pub applied_unsaved: bool,
    pub legibility: Legibility,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WidgetType {
    #[serde(rename = "clock")]
    Clock,
    #[serde(rename = "calendar")]
    Calendar,
    #[serde(rename = "daily_tasks")]
    DailyTasks,
    #[serde(rename = "kanban")]
    Kanban,
    #[serde(rename = "weather")]
    Weather,
    #[serde(rename = "news")]
    News,
    #[serde(rename = "music_player")]
    MusicPlayer,
    #[serde(rename = "animation")]
    Animation,
    #[serde(rename = "image_carousel")]
    ImageCarousel,
    #[serde(rename = "static_image")]
    StaticImage,
    #[serde(rename = "text")]
    Text,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AddableWidgetType {
    #[serde(rename = "weather")]
    Weather,
    #[serde(rename = "news")]
    News,
    #[serde(rename = "music_player")]
    MusicPlayer,
    #[serde(rename = "animation")]
    Animation,
    #[serde(rename = "image_carousel")]
    ImageCarousel,
    #[serde(rename = "static_image")]
    StaticImage,
    #[serde(rename = "text")]
    Text,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ImageSource {
    #[serde(rename = "catalog")]
    Catalog,
    #[serde(rename = "own")]
    Own,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ImageRef {
    pub source: ImageSource,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub catalog_image_id: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub uploaded_image_id: Option<Uuid>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WeatherConfig {
    pub city: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct TextConfig {
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AnimationConfig {
    pub animation_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct StaticImageConfig {
    #[serde(flatten)]
    pub base_image_ref: ImageRef,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CarouselConfig {
    pub items: Vec<ImageRef>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub interval_seconds: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts", type = "Record<string, never>")]
pub struct EmptyConfig {}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum WidgetConfig {
    WeatherConfig(WeatherConfig),
    TextConfig(TextConfig),
    AnimationConfig(AnimationConfig),
    StaticImageConfig(StaticImageConfig),
    CarouselConfig(CarouselConfig),
    EmptyConfig(EmptyConfig),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetItem {
    pub widget_id: Uuid,
    pub r#type: WidgetType,
    pub display_name: String,
    pub distinguishing_value: Option<String>,
    pub is_default: bool,
    pub is_active: bool,
    pub can_configure: bool,
    pub can_delete: bool,
    pub paused_by_load: bool,
    pub config: WidgetConfig,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetRect {
    pub widget_id: Uuid,
    pub r#type: WidgetType,
    pub x: i64,
    pub y: i64,
    pub width: i64,
    pub height: i64,
    pub is_active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum SyncState {
    #[serde(rename = "synced")]
    Synced,
    #[serde(rename = "syncing")]
    Syncing,
    #[serde(rename = "offline")]
    Offline,
    #[serde(rename = "error")]
    Error,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncStatus {
    pub status: SyncState,
    pub pending_count: i64,
    pub last_sync_at: Option<Instant>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Monitor {
    pub id: String,
    pub x: i64,
    pub y: i64,
    pub width: i64,
    pub height: i64,
    pub scale_factor: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ScreenId {
    #[serde(rename = "planner_daily")]
    PlannerDaily,
    #[serde(rename = "kanban")]
    Kanban,
    #[serde(rename = "calendar")]
    Calendar,
    #[serde(rename = "agenda")]
    Agenda,
    #[serde(rename = "reports")]
    Reports,
    #[serde(rename = "windi")]
    Windi,
    #[serde(rename = "labels")]
    Labels,
    #[serde(rename = "widgets")]
    Widgets,
    #[serde(rename = "personalization")]
    Personalization,
    #[serde(rename = "themes")]
    Themes,
    #[serde(rename = "settings")]
    Settings,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ScreenParamsCalendarView {
    #[serde(rename = "month")]
    Month,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ScreenParams {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub card_id: Option<Uuid>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub date: Option<DateIso>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub calendar_view: Option<ScreenParamsCalendarView>,
}
