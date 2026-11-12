//! Tipos de los contratos (contratos.md). Fuente única: ts-rs los exporta a src/types/index.ts.
//! La prueba de equivalencia con docs/tipos.ts está en scripts/verificar_tipos.mjs.
#![allow(clippy::large_enum_variant, clippy::enum_variant_names)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(transparent)]
pub struct Uuid(pub String);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(transparent)]
pub struct DateIso(pub String);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(transparent)]
pub struct Instant(pub String);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(transparent)]
pub struct Hex(pub String);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(transparent)]
pub struct Hour(pub u8);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum CardType {
    #[serde(rename = "task")]
    Task,
    #[serde(rename = "reminder")]
    Reminder,
    #[serde(rename = "event")]
    Event,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum Priority {
    #[serde(rename = "high")]
    High,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "low")]
    Low,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ColumnRole {
    #[serde(rename = "todo")]
    Todo,
    #[serde(rename = "in_progress")]
    InProgress,
    #[serde(rename = "done")]
    Done,
    #[serde(rename = "custom")]
    Custom,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum OriginKind {
    #[serde(rename = "local")]
    Local,
    #[serde(rename = "remote")]
    Remote,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ChangeOp {
    #[serde(rename = "upsert")]
    Upsert,
    #[serde(rename = "delete")]
    Delete,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ErrorCode {
    #[serde(rename = "net.offline")]
    NetOffline,
    #[serde(rename = "service.unavailable")]
    ServiceUnavailable,
    #[serde(rename = "internal.unexpected")]
    InternalUnexpected,
    #[serde(rename = "session.expired")]
    SessionExpired,
    #[serde(rename = "alias.required")]
    AliasRequired,
    #[serde(rename = "alias.too_long")]
    AliasTooLong,
    #[serde(rename = "email.required")]
    EmailRequired,
    #[serde(rename = "email.invalid")]
    EmailInvalid,
    #[serde(rename = "email.too_long")]
    EmailTooLong,
    #[serde(rename = "email.already_registered")]
    EmailAlreadyRegistered,
    #[serde(rename = "password.required")]
    PasswordRequired,
    #[serde(rename = "password.invalid")]
    PasswordInvalid,
    #[serde(rename = "password.same_as_current")]
    PasswordSameAsCurrent,
    #[serde(rename = "password_confirmation.required")]
    PasswordConfirmationRequired,
    #[serde(rename = "password_confirmation.mismatch")]
    PasswordConfirmationMismatch,
    #[serde(rename = "code.required")]
    CodeRequired,
    #[serde(rename = "code.incorrect")]
    CodeIncorrect,
    #[serde(rename = "code.expired")]
    CodeExpired,
    #[serde(rename = "code.resend_too_soon")]
    CodeResendTooSoon,
    #[serde(rename = "auth.rate_limited")]
    AuthRateLimited,
    #[serde(rename = "auth.invalid_credentials")]
    AuthInvalidCredentials,
    #[serde(rename = "title.required")]
    TitleRequired,
    #[serde(rename = "title.too_long")]
    TitleTooLong,
    #[serde(rename = "due_date.required")]
    DueDateRequired,
    #[serde(rename = "due_date.invalid")]
    DueDateInvalid,
    #[serde(rename = "due_date.in_past")]
    DueDateInPast,
    #[serde(rename = "description.too_long")]
    DescriptionTooLong,
    #[serde(rename = "labels.too_many")]
    LabelsTooMany,
    #[serde(rename = "labels.not_found")]
    LabelsNotFound,
    #[serde(rename = "card.not_found")]
    CardNotFound,
    #[serde(rename = "column.not_found")]
    ColumnNotFound,
    #[serde(rename = "time_block.past")]
    TimeBlockPast,
    #[serde(rename = "time_block.after_due_date")]
    TimeBlockAfterDueDate,
    #[serde(rename = "name.required")]
    NameRequired,
    #[serde(rename = "name.too_long")]
    NameTooLong,
    #[serde(rename = "name.duplicate")]
    NameDuplicate,
    #[serde(rename = "color.required")]
    ColorRequired,
    #[serde(rename = "color.invalid")]
    ColorInvalid,
    #[serde(rename = "label.limit_reached")]
    LabelLimitReached,
    #[serde(rename = "label.not_found")]
    LabelNotFound,
    #[serde(rename = "column.limit_reached")]
    ColumnLimitReached,
    #[serde(rename = "column.order_invalid")]
    ColumnOrderInvalid,
    #[serde(rename = "column.default_not_deletable")]
    ColumnDefaultNotDeletable,
    #[serde(rename = "range.start_required")]
    RangeStartRequired,
    #[serde(rename = "range.end_required")]
    RangeEndRequired,
    #[serde(rename = "range.invalid_date")]
    RangeInvalidDate,
    #[serde(rename = "range.start_after_end")]
    RangeStartAfterEnd,
    #[serde(rename = "range.too_long")]
    RangeTooLong,
    #[serde(rename = "draft.unsaved_changes")]
    DraftUnsavedChanges,
    #[serde(rename = "draft.unsaved_changes_on_apply")]
    DraftUnsavedChangesOnApply,
    #[serde(rename = "draft.no_changes")]
    DraftNoChanges,
    #[serde(rename = "theme.limit_reached")]
    ThemeLimitReached,
    #[serde(rename = "theme.already_applied")]
    ThemeAlreadyApplied,
    #[serde(rename = "theme.applied_not_deletable")]
    ThemeAppliedNotDeletable,
    #[serde(rename = "background.already_default")]
    BackgroundAlreadyDefault,
    #[serde(rename = "template.not_found")]
    TemplateNotFound,
    #[serde(rename = "font.not_found")]
    FontNotFound,
    #[serde(rename = "image.not_found")]
    ImageNotFound,
    #[serde(rename = "image.format_not_allowed")]
    ImageFormatNotAllowed,
    #[serde(rename = "image.too_large")]
    ImageTooLarge,
    #[serde(rename = "image.unreadable")]
    ImageUnreadable,
    #[serde(rename = "asset.unavailable")]
    AssetUnavailable,
    #[serde(rename = "widget.not_found")]
    WidgetNotFound,
    #[serde(rename = "widget.already_added")]
    WidgetAlreadyAdded,
    #[serde(rename = "widget.default_not_deletable")]
    WidgetDefaultNotDeletable,
    #[serde(rename = "city.not_found")]
    CityNotFound,
    #[serde(rename = "city.duplicate")]
    CityDuplicate,
    #[serde(rename = "city.too_long")]
    CityTooLong,
    #[serde(rename = "text.too_long")]
    TextTooLong,
    #[serde(rename = "carousel.too_few")]
    CarouselTooFew,
    #[serde(rename = "carousel.too_many")]
    CarouselTooMany,
    #[serde(rename = "interval.out_of_range")]
    IntervalOutOfRange,
    #[serde(rename = "interval.required")]
    IntervalRequired,
    #[serde(rename = "url.not_allowed")]
    UrlNotAllowed,
    #[serde(rename = "autostart.failed")]
    AutostartFailed,
    #[serde(rename = "media.no_session")]
    MediaNoSession,
    #[serde(rename = "media.action_unsupported")]
    MediaActionUnsupported,
    #[serde(rename = "message.too_long")]
    MessageTooLong,
    #[serde(rename = "windi.unavailable")]
    WindiUnavailable,
    #[serde(rename = "proposal.discarded")]
    ProposalDiscarded,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum ErrorParamsValue {
    Text(String),
    Number(i64),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(transparent)]
pub struct ErrorParams(pub HashMap<String, ErrorParamsValue>);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub field: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<ErrorParams>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ResultMessage {
    pub code: String,
    pub message: String,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<ErrorParams>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[ts(rename = "Ok")]
pub struct IpcOk<T> {
    #[ts(type = "true")]
    pub ok: serde_json::Value,
    pub value: T,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result_message: Option<ResultMessage>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[ts(rename = "Err")]
pub struct IpcErr {
    #[ts(type = "false")]
    pub ok: serde_json::Value,
    pub error: AppError,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[ts(rename = "Result")]
#[serde(untagged)]
pub enum IpcResult<T> {
    Ok(IpcOk<T>),
    Err(IpcErr),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ViewId {
    #[serde(rename = "P")]
    P,
    #[serde(rename = "C")]
    C,
    #[serde(rename = "E")]
    E,
}

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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthRegisterStartParams {
    pub alias: String,
    pub email: String,
    pub password: String,
    pub password_confirmation: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CodeSent {
    pub resend_available_at: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthRegisterStartResult {
    #[serde(flatten)]
    pub base_code_sent: CodeSent,
    pub expires_at: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthRegisterVerifyParams {
    pub code: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthRegisterVerifyResult {
    pub alias: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthSignInParams {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SessionInfo {
    pub user_id: Uuid,
    pub alias: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthGoogleStartResult {
    pub expires_at: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthRecoveryRequestParams {
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthRecoveryVerifyParams {
    pub code: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthRecoverySetPasswordParams {
    pub password: String,
    pub password_confirmation: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AuthSessionStateState {
    #[serde(rename = "signed_out")]
    SignedOut,
    #[serde(rename = "signed_in")]
    SignedIn,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AuthSessionStateToken {
    #[serde(rename = "valid")]
    Valid,
    #[serde(rename = "refresh_pending")]
    RefreshPending,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthSessionState {
    pub state: AuthSessionStateState,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user_id: Option<Uuid>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub alias: Option<String>,
    pub token: AuthSessionStateToken,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthSignOutInfo {
    pub pending_count: i64,
}

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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LabelCreateParams {
    pub name: String,
    pub color_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LabelUpdateParams {
    pub id: Uuid,
    pub name: String,
    pub color_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LabelDeleteInfo {
    pub name: String,
    pub card_count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ColumnCreateParams {
    pub name: String,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ColumnUpdateParams {
    pub id: Uuid,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ColumnReorderParams {
    pub column_ids: Vec<Uuid>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ColumnDeleteInfo {
    pub name: String,
    pub card_count: i64,
    pub destination_name: String,
}

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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AppliedThemeView {
    pub theme_id: Uuid,
    pub name: String,
    pub content: ThemeContent,
    pub has_unapplied_changes: bool,
    pub has_unsaved_changes: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftOpenParams {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub theme_id: Option<Uuid>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftSelectParams {
    pub theme_id: Uuid,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub discard_changes: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftPatchBackground {
    pub source: BackgroundSource,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub catalog_image_id: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub uploaded_image_id: Option<Uuid>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ThemeDraftPatchColorsPrimaryLit {
    #[serde(rename = "")]
    Empty,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum ThemeDraftPatchColorsPrimary {
    Lit(ThemeDraftPatchColorsPrimaryLit),
    Hex(Hex),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ThemeDraftPatchColorsSecondaryLit {
    #[serde(rename = "")]
    Empty,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum ThemeDraftPatchColorsSecondary {
    Lit(ThemeDraftPatchColorsSecondaryLit),
    Hex(Hex),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ThemeDraftPatchColorsTextLit {
    #[serde(rename = "")]
    Empty,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum ThemeDraftPatchColorsText {
    Lit(ThemeDraftPatchColorsTextLit),
    Hex(Hex),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftPatchColors {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub primary: Option<ThemeDraftPatchColorsPrimary>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub secondary: Option<ThemeDraftPatchColorsSecondary>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<ThemeDraftPatchColorsText>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftPatch {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub background: Option<ThemeDraftPatchBackground>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub colors: Option<ThemeDraftPatchColors>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub palette_id: Option<Option<String>>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub font_id: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub font_size: Option<FontSize>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftUpdateParams {
    pub patch: ThemeDraftPatch,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ThemeDraftResetParamsPart {
    #[serde(rename = "colors")]
    Colors,
    #[serde(rename = "typography")]
    Typography,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftResetParams {
    pub part: ThemeDraftResetParamsPart,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftSaveResult {
    pub theme_id: Uuid,
    pub is_applied: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftSaveAsParams {
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeIdResult {
    pub theme_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ApplyMode {
    #[serde(rename = "apply")]
    Apply,
    #[serde(rename = "save_and_apply")]
    SaveAndApply,
    #[serde(rename = "apply_without_saving")]
    ApplyWithoutSaving,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftApplyParams {
    pub mode: ApplyMode,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDraftStatus {
    pub dirty: bool,
    pub applied_unsaved: bool,
    pub theme_name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeApplyParams {
    pub theme_id: Uuid,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub discard_draft: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeRenameParams {
    pub theme_id: Uuid,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ThemeDeleteParams {
    pub theme_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum CatalogKind {
    #[serde(rename = "template")]
    Template,
    #[serde(rename = "image")]
    Image,
    #[serde(rename = "font")]
    Font,
    #[serde(rename = "palette")]
    Palette,
    #[serde(rename = "animation")]
    Animation,
    #[serde(rename = "color")]
    Color,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum CatalogItemFormat {
    #[serde(rename = "lottie")]
    Lottie,
    #[serde(rename = "webm")]
    Webm,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogItem {
    pub id: String,
    pub name: String,
    pub thumbnail_url: String,
    pub is_cached: bool,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hex: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_primary: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_secondary: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_text: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub format: Option<CatalogItemFormat>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogListParams {
    pub kind: CatalogKind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogRefreshResult {
    pub changed: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ImportPurpose {
    #[serde(rename = "background")]
    Background,
    #[serde(rename = "static_image")]
    StaticImage,
    #[serde(rename = "carousel_item")]
    CarouselItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ImageImportParams {
    pub path: String,
    pub purpose: ImportPurpose,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ImageImportResult {
    pub uploaded_image_id: Uuid,
    pub preview_url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AssetKind {
    #[serde(rename = "catalog_image")]
    CatalogImage,
    #[serde(rename = "catalog_template")]
    CatalogTemplate,
    #[serde(rename = "catalog_font")]
    CatalogFont,
    #[serde(rename = "catalog_animation")]
    CatalogAnimation,
    #[serde(rename = "uploaded_image")]
    UploadedImage,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AssetResolveParams {
    pub kind: AssetKind,
    pub id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AssetResolveResultState {
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "downloading")]
    Downloading,
    #[serde(rename = "unavailable")]
    Unavailable,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AssetResolveResult {
    pub url: String,
    pub state: AssetResolveResultState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetCatalogEntry {
    pub r#type: AddableWidgetType,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub disabled_reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetCatalog {
    pub external: Vec<WidgetCatalogEntry>,
    pub local: Vec<WidgetCatalogEntry>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetSetActiveParams {
    pub widget_id: Uuid,
    pub active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetAddParams {
    pub r#type: AddableWidgetType,
    pub config: WidgetConfig,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum WidgetConfigureParamsConfig {
    WeatherConfig(WeatherConfig),
    TextConfig(TextConfig),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetConfigureParams {
    pub widget_id: Uuid,
    pub config: WidgetConfigureParamsConfig,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetDeleteParams {
    pub widget_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetDataParams {
    pub widget_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WidgetDataStatus {
    #[serde(rename = "ok")]
    Ok,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "offline")]
    Offline,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WeatherData {
    pub city: String,
    pub temperature_c: f64,
    pub condition_code: String,
    pub condition_text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Headline {
    pub title: String,
    pub source: String,
    pub url: String,
    pub published_at: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct NewsData {
    pub headlines: Vec<Headline>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum WidgetDataPayload {
    WeatherData(WeatherData),
    NewsData(NewsData),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WidgetData {
    pub status: WidgetDataStatus,
    pub payload: Option<WidgetDataPayload>,
    pub fetched_at: Option<Instant>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditOpenResult {
    pub monitor: Monitor,
    pub widgets: Vec<WidgetRect>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditMoveParams {
    pub widget_id: Uuid,
    pub x: i64,
    pub y: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditResizeParams {
    pub widget_id: Uuid,
    pub x: i64,
    pub y: i64,
    pub width: i64,
    pub height: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditRectResult {
    pub rect: WidgetRect,
    pub collided: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditStatus {
    pub dirty: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WallpaperState {
    #[serde(rename = "ok")]
    Ok,
    #[serde(rename = "fallback_default")]
    FallbackDefault,
    #[serde(rename = "hidden")]
    Hidden,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayerInitialState {
    pub applied: ThemeContent,
    pub widgets: Vec<WidgetRect>,
    pub monitors: Vec<Monitor>,
    pub wallpaper_state: WallpaperState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WallpaperStatus {
    pub state: WallpaperState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AppOpenScreenParams {
    pub screen: ScreenId,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<ScreenParams>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LastScreen {
    pub screen: Option<ScreenId>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AppSetLastScreenParams {
    pub screen: ScreenId,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AppRequestExitResult {
    pub requires_confirmation: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AppExitParams {
    pub discard_changes: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SystemOpenUrlParams {
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AutostartState {
    pub enabled: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum PreferenceBoardCardView {
    #[serde(rename = "compact")]
    Compact,
    #[serde(rename = "expanded")]
    Expanded,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Preference {
    pub board_card_view: PreferenceBoardCardView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct Connectivity {
    pub online: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum PlaybackStatus {
    #[serde(rename = "playing")]
    Playing,
    #[serde(rename = "paused")]
    Paused,
    #[serde(rename = "stopped")]
    Stopped,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct MediaSession {
    pub has_session: bool,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub thumbnail_url: Option<String>,
    pub status: PlaybackStatus,
    pub can_previous: bool,
    pub can_next: bool,
    pub can_play_pause: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WindiMessageRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "assistant")]
    Assistant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiMessage {
    pub id: Uuid,
    pub role: WindiMessageRole,
    pub text: String,
    pub sent_at: Instant,
    pub failed: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ProposalAction {
    #[serde(rename = "create")]
    Create,
    #[serde(rename = "edit")]
    Edit,
    #[serde(rename = "move")]
    Move,
    #[serde(rename = "delete")]
    Delete,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ProposalState {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "confirmed")]
    Confirmed,
    #[serde(rename = "rejected")]
    Rejected,
    #[serde(rename = "discarded")]
    Discarded,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiProposalItem {
    pub card_id: Option<Uuid>,
    #[ts(type = "Partial<Card> | null")]
    pub current: Option<serde_json::Value>,
    #[ts(type = "Partial<Card> | null")]
    pub changes: Option<serde_json::Value>,
    pub title: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiProposal {
    pub id: Uuid,
    pub action: ProposalAction,
    pub items: Vec<WindiProposalItem>,
    pub warnings: Vec<String>,
    pub state: ProposalState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiConversation {
    pub messages: Vec<WindiMessage>,
    pub proposal: Option<WindiProposal>,
    pub online: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiSendMessageParams {
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiSendMessageResult {
    pub reply: WindiMessage,
    pub proposal: Option<WindiProposal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiConfirmProposalParams {
    pub proposal_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WindiConfirmProposalResultOutcome {
    #[serde(rename = "applied")]
    Applied,
    #[serde(rename = "stale")]
    Stale,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiConfirmProposalResult {
    pub outcome: WindiConfirmProposalResultOutcome,
    pub reply: WindiMessage,
    pub new_proposal: Option<WindiProposal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiRejectProposalParams {
    pub proposal_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiRejectProposalResult {
    pub reply: WindiMessage,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts", type = "Record<string, never>")]
pub struct NoParams {}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterStart {
    pub params: AuthRegisterStartParams,
    pub result: AuthRegisterStartResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterVerify {
    pub params: AuthRegisterVerifyParams,
    pub result: AuthRegisterVerifyResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterResend {
    pub params: NoParams,
    pub result: CodeSent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterCancel {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthSignIn {
    pub params: AuthSignInParams,
    pub result: SessionInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGoogleStart {
    pub params: NoParams,
    pub result: AuthGoogleStartResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGoogleCancel {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoveryRequest {
    pub params: AuthRecoveryRequestParams,
    pub result: CodeSent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoveryVerify {
    pub params: AuthRecoveryVerifyParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoveryResend {
    pub params: NoParams,
    pub result: CodeSent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoverySetPassword {
    pub params: AuthRecoverySetPasswordParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGetSession {
    pub params: NoParams,
    pub result: AuthSessionState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGetSignOutInfo {
    pub params: NoParams,
    pub result: AuthSignOutInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthSignOut {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardCreate {
    pub params: CardCreateParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardUpdate {
    pub params: CardUpdateParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardDelete {
    pub params: CardIdParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardGet {
    pub params: CardIdParams,
    pub result: CardDetail,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardListBoard {
    pub params: NoParams,
    pub result: CardListBoardResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardMove {
    pub params: CardMoveParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardSetCompleted {
    pub params: CardSetCompletedParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapPlannerGetToday {
    pub params: NoParams,
    pub result: PlannerToday,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAgendaGetDay {
    pub params: AgendaDayParams,
    pub result: AgendaDay,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardAssignTimeBlock {
    pub params: CardAssignTimeBlockParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardUnassignTimeBlock {
    pub params: CardUnassignTimeBlockParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCalendarGetMonth {
    pub params: CalendarMonthParams,
    pub result: CalendarMonth,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCalendarGetWeek {
    pub params: CalendarWeekParams,
    pub result: CalendarWeek,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCalendarGetDay {
    pub params: CalendarDayParams,
    pub result: CalendarDay,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapKanbanWidgetGet {
    pub params: NoParams,
    pub result: KanbanWidgetData,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelList {
    pub params: NoParams,
    pub result: Vec<Label>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelCreate {
    pub params: LabelCreateParams,
    pub result: Label,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelUpdate {
    pub params: LabelUpdateParams,
    pub result: Label,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelGetDeleteInfo {
    pub params: CardIdParams,
    pub result: LabelDeleteInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelDelete {
    pub params: CardIdParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnList {
    pub params: NoParams,
    pub result: Vec<Column>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnCreate {
    pub params: ColumnCreateParams,
    pub result: Column,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnUpdate {
    pub params: ColumnUpdateParams,
    pub result: Column,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnReorder {
    pub params: ColumnReorderParams,
    pub result: Vec<Column>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnGetDeleteInfo {
    pub params: CardIdParams,
    pub result: ColumnDeleteInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnDelete {
    pub params: CardIdParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportResolveRange {
    pub params: ReportResolveRangeParams,
    pub result: ResolvedRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetMeta {
    pub params: NoParams,
    pub result: ReportMeta,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetCompleted {
    pub params: ReportFilterParams,
    pub result: CompletedReport,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetCompliance {
    pub params: ReportFilterParams,
    pub result: ComplianceReport,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetStatusBreakdown {
    pub params: ReportFilterParams,
    pub result: StatusBreakdown,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeList {
    pub params: NoParams,
    pub result: Vec<ThemeSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeGetApplied {
    pub params: NoParams,
    pub result: AppliedThemeView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftOpen {
    pub params: ThemeDraftOpenParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftSelect {
    pub params: ThemeDraftSelectParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftUpdate {
    pub params: ThemeDraftUpdateParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftReset {
    pub params: ThemeDraftResetParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftSave {
    pub params: NoParams,
    pub result: ThemeDraftSaveResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftSaveAs {
    pub params: ThemeDraftSaveAsParams,
    pub result: ThemeIdResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftApply {
    pub params: ThemeDraftApplyParams,
    pub result: ThemeIdResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftGetStatus {
    pub params: NoParams,
    pub result: ThemeDraftStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftDiscard {
    pub params: NoParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeApply {
    pub params: ThemeApplyParams,
    pub result: ThemeIdResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeRename {
    pub params: ThemeRenameParams,
    pub result: ThemeSummary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDelete {
    pub params: ThemeDeleteParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCatalogList {
    pub params: CatalogListParams,
    pub result: Vec<CatalogItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCatalogRefresh {
    pub params: NoParams,
    pub result: CatalogRefreshResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapImageImport {
    pub params: ImageImportParams,
    pub result: ImageImportResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAssetResolve {
    pub params: AssetResolveParams,
    pub result: AssetResolveResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetList {
    pub params: NoParams,
    pub result: Vec<WidgetItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetCatalogGet {
    pub params: NoParams,
    pub result: WidgetCatalog,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetSetActive {
    pub params: WidgetSetActiveParams,
    pub result: WidgetItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetAdd {
    pub params: WidgetAddParams,
    pub result: WidgetItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetConfigure {
    pub params: WidgetConfigureParams,
    pub result: WidgetItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetDelete {
    pub params: WidgetDeleteParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetGetData {
    pub params: WidgetDataParams,
    pub result: WidgetData,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditOpen {
    pub params: NoParams,
    pub result: LayoutEditOpenResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditMove {
    pub params: LayoutEditMoveParams,
    pub result: LayoutEditRectResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditResize {
    pub params: LayoutEditResizeParams,
    pub result: LayoutEditRectResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditGetStatus {
    pub params: NoParams,
    pub result: LayoutEditStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditSave {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditCancel {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayerGetInitialState {
    pub params: NoParams,
    pub result: LayerInitialState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWallpaperGetStatus {
    pub params: NoParams,
    pub result: WallpaperStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppOpenScreen {
    pub params: AppOpenScreenParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppGetLastScreen {
    pub params: NoParams,
    pub result: LastScreen,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppSetLastScreen {
    pub params: AppSetLastScreenParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppHideMainWindow {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppRequestExit {
    pub params: NoParams,
    pub result: AppRequestExitResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppExit {
    pub params: AppExitParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapSystemOpenUrl {
    pub params: SystemOpenUrlParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAutostartGet {
    pub params: NoParams,
    pub result: AutostartState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAutostartSet {
    pub params: AutostartState,
    pub result: AutostartState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapPreferenceGet {
    pub params: NoParams,
    pub result: Preference,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapPreferenceSet {
    pub params: Preference,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapConnectivityGet {
    pub params: NoParams,
    pub result: Connectivity,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaGetSession {
    pub params: NoParams,
    pub result: MediaSession,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaTogglePlayPause {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaSkipNext {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaSkipPrevious {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiGetConversation {
    pub params: NoParams,
    pub result: WindiConversation,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiSendMessage {
    pub params: WindiSendMessageParams,
    pub result: WindiSendMessageResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiConfirmProposal {
    pub params: WindiConfirmProposalParams,
    pub result: WindiConfirmProposalResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiRejectProposal {
    pub params: WindiRejectProposalParams,
    pub result: WindiRejectProposalResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapSyncGetStatus {
    pub params: NoParams,
    pub result: SyncStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMap {
    pub auth_register_start: CommandMapAuthRegisterStart,
    pub auth_register_verify: CommandMapAuthRegisterVerify,
    pub auth_register_resend: CommandMapAuthRegisterResend,
    pub auth_register_cancel: CommandMapAuthRegisterCancel,
    pub auth_sign_in: CommandMapAuthSignIn,
    pub auth_google_start: CommandMapAuthGoogleStart,
    pub auth_google_cancel: CommandMapAuthGoogleCancel,
    pub auth_recovery_request: CommandMapAuthRecoveryRequest,
    pub auth_recovery_verify: CommandMapAuthRecoveryVerify,
    pub auth_recovery_resend: CommandMapAuthRecoveryResend,
    pub auth_recovery_set_password: CommandMapAuthRecoverySetPassword,
    pub auth_get_session: CommandMapAuthGetSession,
    pub auth_get_sign_out_info: CommandMapAuthGetSignOutInfo,
    pub auth_sign_out: CommandMapAuthSignOut,
    pub card_create: CommandMapCardCreate,
    pub card_update: CommandMapCardUpdate,
    pub card_delete: CommandMapCardDelete,
    pub card_get: CommandMapCardGet,
    pub card_list_board: CommandMapCardListBoard,
    pub card_move: CommandMapCardMove,
    pub card_set_completed: CommandMapCardSetCompleted,
    pub planner_get_today: CommandMapPlannerGetToday,
    pub agenda_get_day: CommandMapAgendaGetDay,
    pub card_assign_time_block: CommandMapCardAssignTimeBlock,
    pub card_unassign_time_block: CommandMapCardUnassignTimeBlock,
    pub calendar_get_month: CommandMapCalendarGetMonth,
    pub calendar_get_week: CommandMapCalendarGetWeek,
    pub calendar_get_day: CommandMapCalendarGetDay,
    pub kanban_widget_get: CommandMapKanbanWidgetGet,
    pub label_list: CommandMapLabelList,
    pub label_create: CommandMapLabelCreate,
    pub label_update: CommandMapLabelUpdate,
    pub label_get_delete_info: CommandMapLabelGetDeleteInfo,
    pub label_delete: CommandMapLabelDelete,
    pub column_list: CommandMapColumnList,
    pub column_create: CommandMapColumnCreate,
    pub column_update: CommandMapColumnUpdate,
    pub column_reorder: CommandMapColumnReorder,
    pub column_get_delete_info: CommandMapColumnGetDeleteInfo,
    pub column_delete: CommandMapColumnDelete,
    pub report_resolve_range: CommandMapReportResolveRange,
    pub report_get_meta: CommandMapReportGetMeta,
    pub report_get_completed: CommandMapReportGetCompleted,
    pub report_get_compliance: CommandMapReportGetCompliance,
    pub report_get_status_breakdown: CommandMapReportGetStatusBreakdown,
    pub theme_list: CommandMapThemeList,
    pub theme_get_applied: CommandMapThemeGetApplied,
    pub theme_draft_open: CommandMapThemeDraftOpen,
    pub theme_draft_select: CommandMapThemeDraftSelect,
    pub theme_draft_update: CommandMapThemeDraftUpdate,
    pub theme_draft_reset: CommandMapThemeDraftReset,
    pub theme_draft_save: CommandMapThemeDraftSave,
    pub theme_draft_save_as: CommandMapThemeDraftSaveAs,
    pub theme_draft_apply: CommandMapThemeDraftApply,
    pub theme_draft_get_status: CommandMapThemeDraftGetStatus,
    pub theme_draft_discard: CommandMapThemeDraftDiscard,
    pub theme_apply: CommandMapThemeApply,
    pub theme_rename: CommandMapThemeRename,
    pub theme_delete: CommandMapThemeDelete,
    pub catalog_list: CommandMapCatalogList,
    pub catalog_refresh: CommandMapCatalogRefresh,
    pub image_import: CommandMapImageImport,
    pub asset_resolve: CommandMapAssetResolve,
    pub widget_list: CommandMapWidgetList,
    pub widget_catalog_get: CommandMapWidgetCatalogGet,
    pub widget_set_active: CommandMapWidgetSetActive,
    pub widget_add: CommandMapWidgetAdd,
    pub widget_configure: CommandMapWidgetConfigure,
    pub widget_delete: CommandMapWidgetDelete,
    pub widget_get_data: CommandMapWidgetGetData,
    pub layout_edit_open: CommandMapLayoutEditOpen,
    pub layout_edit_move: CommandMapLayoutEditMove,
    pub layout_edit_resize: CommandMapLayoutEditResize,
    pub layout_edit_get_status: CommandMapLayoutEditGetStatus,
    pub layout_edit_save: CommandMapLayoutEditSave,
    pub layout_edit_cancel: CommandMapLayoutEditCancel,
    pub layer_get_initial_state: CommandMapLayerGetInitialState,
    pub wallpaper_get_status: CommandMapWallpaperGetStatus,
    pub app_open_screen: CommandMapAppOpenScreen,
    pub app_get_last_screen: CommandMapAppGetLastScreen,
    pub app_set_last_screen: CommandMapAppSetLastScreen,
    pub app_hide_main_window: CommandMapAppHideMainWindow,
    pub app_request_exit: CommandMapAppRequestExit,
    pub app_exit: CommandMapAppExit,
    pub system_open_url: CommandMapSystemOpenUrl,
    pub autostart_get: CommandMapAutostartGet,
    pub autostart_set: CommandMapAutostartSet,
    pub preference_get: CommandMapPreferenceGet,
    pub preference_set: CommandMapPreferenceSet,
    pub connectivity_get: CommandMapConnectivityGet,
    pub media_get_session: CommandMapMediaGetSession,
    pub media_toggle_play_pause: CommandMapMediaTogglePlayPause,
    pub media_skip_next: CommandMapMediaSkipNext,
    pub media_skip_previous: CommandMapMediaSkipPrevious,
    pub windi_get_conversation: CommandMapWindiGetConversation,
    pub windi_send_message: CommandMapWindiSendMessage,
    pub windi_confirm_proposal: CommandMapWindiConfirmProposal,
    pub windi_reject_proposal: CommandMapWindiRejectProposal,
    pub sync_get_status: CommandMapSyncGetStatus,
}

#[derive(TS)]
#[ts(export, export_to = "index.ts", type = "keyof CommandMap")]
pub struct CommandName;

#[derive(TS)]
#[ts(
    export,
    export_to = "index.ts",
    type = "<K extends CommandName>( command: K, params: CommandMap[K]['params'], ) => Promise<Result<CommandMap[K]['result']>>"
)]
pub struct Invoke;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EntityChange {
    pub ids: Vec<Uuid>,
    pub op: ChangeOp,
    pub origin: OriginKind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum EventMapSessionChangedState {
    #[serde(rename = "signed_out")]
    SignedOut,
    #[serde(rename = "signed_in")]
    SignedIn,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum EventMapSessionChangedReason {
    #[serde(rename = "sign_in")]
    SignIn,
    #[serde(rename = "sign_out")]
    SignOut,
    #[serde(rename = "token_expired")]
    TokenExpired,
    #[serde(rename = "registered")]
    Registered,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapSessionChanged {
    pub state: EventMapSessionChangedState,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub alias: Option<String>,
    pub reason: EventMapSessionChangedReason,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum EventMapAuthGoogleResultStatus {
    #[serde(rename = "success")]
    Success,
    #[serde(rename = "cancelled")]
    Cancelled,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "email_too_long")]
    EmailTooLong,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapAuthGoogleResult {
    pub status: EventMapAuthGoogleResultStatus,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub is_new_account: Option<bool>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub alias: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapConnectivityChanged {
    pub online: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapSyncCompleted {
    pub pushed: i64,
    pub pulled: i64,
    pub after_reconnect: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapSyncConflictsResolved {
    pub count: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapAppliedThemeChanged {
    pub theme_id: Uuid,
    pub origin: OriginKind,
    pub has_unsaved_draft: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapWidgetsChanged {
    pub widget_ids: Vec<Uuid>,
    pub op: ChangeOp,
    pub origin: OriginKind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapLayoutChanged {
    pub theme_id: Uuid,
    pub origin: OriginKind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapDraftChanged {
    pub dirty: bool,
    pub applied_unsaved: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapLayoutEditStateChanged {
    pub open: bool,
    pub dirty: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapWallpaperStatusChanged {
    pub state: WallpaperState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapMonitorsChanged {
    pub monitors: Vec<Monitor>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum EventMapPointerForwardedButton {
    #[serde(rename = "primary")]
    Primary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapPointerForwarded {
    pub x: i64,
    pub y: i64,
    pub monitor_id: String,
    pub button: EventMapPointerForwardedButton,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum EventMapWidgetDataChangedPayload {
    WeatherData(WeatherData),
    NewsData(NewsData),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapWidgetDataChanged {
    pub widget_id: Uuid,
    pub status: WidgetDataStatus,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub payload: Option<EventMapWidgetDataChangedPayload>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapAnimationPauseChanged {
    pub widget_ids: Vec<Uuid>,
    pub paused: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapDayChanged {
    pub date: DateIso,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapNavigateRequested {
    pub screen: ScreenId,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<ScreenParams>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapExitRequested {
    pub requires_confirmation: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapCatalogUpdated {
    pub kinds: Vec<CatalogKind>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum EventMapPreferenceChangedBoardCardView {
    #[serde(rename = "compact")]
    Compact,
    #[serde(rename = "expanded")]
    Expanded,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMapPreferenceChanged {
    pub board_card_view: EventMapPreferenceChangedBoardCardView,
    pub origin: OriginKind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EventMap {
    pub session_changed: EventMapSessionChanged,
    pub auth_google_result: EventMapAuthGoogleResult,
    pub connectivity_changed: EventMapConnectivityChanged,
    pub sync_status_changed: SyncStatus,
    pub sync_completed: EventMapSyncCompleted,
    pub sync_conflicts_resolved: EventMapSyncConflictsResolved,
    pub cards_changed: EntityChange,
    pub labels_changed: EntityChange,
    pub columns_changed: EntityChange,
    pub themes_changed: EntityChange,
    pub applied_theme_changed: EventMapAppliedThemeChanged,
    pub widgets_changed: EventMapWidgetsChanged,
    pub layout_changed: EventMapLayoutChanged,
    pub draft_changed: EventMapDraftChanged,
    pub layout_edit_state_changed: EventMapLayoutEditStateChanged,
    pub wallpaper_status_changed: EventMapWallpaperStatusChanged,
    pub monitors_changed: EventMapMonitorsChanged,
    pub pointer_forwarded: EventMapPointerForwarded,
    pub media_session_changed: MediaSession,
    pub widget_data_changed: EventMapWidgetDataChanged,
    pub animation_pause_changed: EventMapAnimationPauseChanged,
    pub day_changed: EventMapDayChanged,
    pub navigate_requested: EventMapNavigateRequested,
    pub exit_requested: EventMapExitRequested,
    pub catalog_updated: EventMapCatalogUpdated,
    pub preference_changed: EventMapPreferenceChanged,
}

#[derive(TS)]
#[ts(export, export_to = "index.ts", type = "keyof EventMap")]
pub struct EventName;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum SyncEntityKind {
    #[serde(rename = "user_preference")]
    UserPreference,
    #[serde(rename = "kanban_column")]
    KanbanColumn,
    #[serde(rename = "card")]
    Card,
    #[serde(rename = "label")]
    Label,
    #[serde(rename = "card_label")]
    CardLabel,
    #[serde(rename = "uploaded_image")]
    UploadedImage,
    #[serde(rename = "theme")]
    Theme,
    #[serde(rename = "applied_theme")]
    AppliedTheme,
    #[serde(rename = "widget")]
    Widget,
    #[serde(rename = "theme_widget")]
    ThemeWidget,
    #[serde(rename = "widget_carousel_item")]
    WidgetCarouselItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum SyncPullEntityKindLit {
    #[serde(rename = "profile")]
    Profile,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum SyncPullEntityKind {
    Lit(SyncPullEntityKindLit),
    SyncEntityKind(SyncEntityKind),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct FieldChange {
    #[ts(type = "unknown")]
    pub value: serde_json::Value,
    pub modified_at: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncChange {
    pub change_id: i64,
    pub entity_kind: SyncEntityKind,
    pub entity_id: Uuid,
    pub op: ChangeOp,
    pub modified_at: Instant,
    pub fields: HashMap<String, FieldChange>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncPushParams {
    pub p_device_id: Uuid,
    pub p_clock_offset_ms: i64,
    pub p_changes: Vec<SyncChange>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncRow {
    pub entity_kind: SyncPullEntityKind,
    pub entity_id: Uuid,
    #[ts(type = "Record<string, unknown>")]
    pub fields: serde_json::Value,
    pub field_mods: HashMap<String, Instant>,
    pub deleted_at: Option<Instant>,
    pub updated_seq: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum SyncChangeStatus {
    #[serde(rename = "applied")]
    Applied,
    #[serde(rename = "merged")]
    Merged,
    #[serde(rename = "superseded")]
    Superseded,
    #[serde(rename = "deleted")]
    Deleted,
    #[serde(rename = "rejected")]
    Rejected,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum SyncRejectReason {
    #[serde(rename = "not_owner")]
    NotOwner,
    #[serde(rename = "incomplete_create")]
    IncompleteCreate,
    #[serde(rename = "unknown_entity")]
    UnknownEntity,
    #[serde(rename = "parent_deleted")]
    ParentDeleted,
    #[serde(rename = "duplicate_name")]
    DuplicateName,
    #[serde(rename = "duplicate_widget")]
    DuplicateWidget,
    #[serde(rename = "duplicate_role")]
    DuplicateRole,
    #[serde(rename = "limit_columns")]
    LimitColumns,
    #[serde(rename = "limit_labels")]
    LimitLabels,
    #[serde(rename = "limit_themes")]
    LimitThemes,
    #[serde(rename = "applied_theme")]
    AppliedTheme,
    #[serde(rename = "invalid_field")]
    InvalidField,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncChangeResult {
    pub change_id: i64,
    pub status: SyncChangeStatus,
    pub conflict: bool,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reason: Option<SyncRejectReason>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub row: Option<SyncRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncPushResult {
    pub server_now: Instant,
    pub results: Vec<SyncChangeResult>,
    pub max_seq: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncPullParams {
    pub p_since_seq: i64,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub p_limit: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct SyncPullResult {
    pub server_now: Instant,
    pub rows: Vec<SyncRow>,
    pub next_seq: i64,
    pub has_more: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogPullParams {
    pub p_known_version: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogTemplateRow {
    pub id: String,
    pub name: String,
    pub thumbnail_path: String,
    pub bundle_path: String,
    pub default_background_path: String,
    pub default_color_primary: Hex,
    pub default_color_secondary: Hex,
    pub default_color_text: Hex,
    pub default_font_id: String,
    pub is_default: bool,
    pub sort_order: i64,
    pub is_active: bool,
    pub bundle_version: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogFontRow {
    pub id: String,
    pub family_name: String,
    pub display_name: String,
    pub file_path: String,
    pub license: String,
    pub sort_order: i64,
    pub is_active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogPaletteRow {
    pub id: String,
    pub name: String,
    pub color_primary: Hex,
    pub color_secondary: Hex,
    pub color_text: Hex,
    pub sort_order: i64,
    pub is_active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogImageRow {
    pub id: String,
    pub name: String,
    pub storage_path: String,
    pub thumbnail_path: String,
    pub width: i64,
    pub height: i64,
    pub sort_order: i64,
    pub is_active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum CatalogAnimationRowFormat {
    #[serde(rename = "lottie")]
    Lottie,
    #[serde(rename = "webm")]
    Webm,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogAnimationRow {
    pub id: String,
    pub name: String,
    pub storage_path: String,
    pub thumbnail_path: String,
    pub format: CatalogAnimationRowFormat,
    pub sort_order: i64,
    pub is_active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogColorRow {
    pub id: String,
    pub name: String,
    pub hex: Hex,
    pub sort_order: i64,
    pub is_active: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogPullResultVariant1 {
    pub version: i64,
    #[ts(type = "true")]
    pub unchanged: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogPullResultVariant2 {
    pub version: i64,
    #[ts(type = "false")]
    pub unchanged: serde_json::Value,
    pub templates: Vec<CatalogTemplateRow>,
    pub fonts: Vec<CatalogFontRow>,
    pub palettes: Vec<CatalogPaletteRow>,
    pub images: Vec<CatalogImageRow>,
    pub animations: Vec<CatalogAnimationRow>,
    pub colors: Vec<CatalogColorRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum CatalogPullResult {
    Variant1(CatalogPullResultVariant1),
    Variant2(CatalogPullResultVariant2),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EmailIsRegisteredParams {
    pub p_email: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct KeepaliveResult {
    #[ts(type = "true")]
    pub ok: serde_json::Value,
    pub at: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum RpcErrorMessage {
    #[serde(rename = "unauthorized")]
    Unauthorized,
    #[serde(rename = "clock_out_of_range")]
    ClockOutOfRange,
    #[serde(rename = "too_many_changes")]
    TooManyChanges,
    #[serde(rename = "invalid_field")]
    InvalidField,
    #[serde(rename = "invalid_limit")]
    InvalidLimit,
    #[serde(rename = "invalid_email")]
    InvalidEmail,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum RpcErrorCode {
    #[serde(rename = "WG001")]
    WG001,
    #[serde(rename = "WG401")]
    WG401,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcError {
    pub code: RpcErrorCode,
    pub message: RpcErrorMessage,
    pub details: Option<String>,
    pub hint: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcMapServerTime {
    pub params: NoParams,
    pub result: Instant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcMapSyncPush {
    pub params: SyncPushParams,
    pub result: SyncPushResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcMapSyncPull {
    pub params: SyncPullParams,
    pub result: SyncPullResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcMapCatalogPull {
    pub params: CatalogPullParams,
    pub result: CatalogPullResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcMapEmailIsRegistered {
    pub params: EmailIsRegisteredParams,
    pub result: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcMapKeepalive {
    pub params: NoParams,
    pub result: KeepaliveResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct RpcMap {
    pub server_time: RpcMapServerTime,
    pub sync_push: RpcMapSyncPush,
    pub sync_pull: RpcMapSyncPull,
    pub catalog_pull: RpcMapCatalogPull,
    pub email_is_registered: RpcMapEmailIsRegistered,
    pub keepalive: RpcMapKeepalive,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum EdgeErrorErrorCode {
    #[serde(rename = "unauthorized")]
    Unauthorized,
    #[serde(rename = "invalid_request")]
    InvalidRequest,
    #[serde(rename = "quota_exceeded")]
    QuotaExceeded,
    #[serde(rename = "provider_error")]
    ProviderError,
    #[serde(rename = "timeout")]
    Timeout,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EdgeErrorError {
    pub code: EdgeErrorErrorCode,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EdgeError {
    pub error: EdgeErrorError,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatContextCard {
    pub id: Uuid,
    pub r#type: CardType,
    pub title: String,
    pub due_date: DateIso,
    pub priority: Option<Priority>,
    pub column_id: Uuid,
    pub label_ids: Vec<Uuid>,
    pub completed_on: Option<DateIso>,
    pub scheduled_date: Option<DateIso>,
    pub scheduled_hour: Option<Hour>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatContextColumnsItem {
    pub id: Uuid,
    pub name: String,
    pub role: ColumnRole,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatContextLabelsItem {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatContextTotals {
    pub total: i64,
    pub overdue: i64,
    pub pending: i64,
    pub completed: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatContext {
    pub alias: String,
    pub today: DateIso,
    pub now_hour: Hour,
    pub columns: Vec<WindiChatContextColumnsItem>,
    pub labels: Vec<WindiChatContextLabelsItem>,
    pub cards: Vec<WindiChatContextCard>,
    pub totals: WindiChatContextTotals,
    pub active_proposal: Option<WindiChatProposal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WindiChatRequestHistoryItemRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "assistant")]
    Assistant,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatRequestHistoryItem {
    pub role: WindiChatRequestHistoryItemRole,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatRequest {
    pub client_request_id: Uuid,
    pub message: String,
    pub history: Vec<WindiChatRequestHistoryItem>,
    pub context: WindiChatContext,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatProposalItemsItem {
    pub card_id: Option<Uuid>,
    #[ts(type = "Partial<Card> | null")]
    pub changes: Option<serde_json::Value>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatProposal {
    pub action: ProposalAction,
    pub items: Vec<WindiChatProposalItemsItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WindiChatResponseIntent {
    #[serde(rename = "answer")]
    Answer,
    #[serde(rename = "clarify")]
    Clarify,
    #[serde(rename = "propose")]
    Propose,
    #[serde(rename = "out_of_scope")]
    OutOfScope,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WindiChatResponse {
    pub reply: String,
    pub intent: WindiChatResponseIntent,
    pub proposal: Option<WindiChatProposal>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WeatherGeocodeRequest {
    pub query: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeocodeResult {
    pub geo_id: String,
    pub name: String,
    pub admin1: Option<String>,
    pub country: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WeatherGeocodeResponse {
    pub results: Vec<GeocodeResult>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WeatherCurrentRequest {
    pub geo_id: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WeatherCurrentResponseCache {
    #[serde(rename = "hit")]
    Hit,
    #[serde(rename = "miss")]
    Miss,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WeatherCurrentResponse {
    pub geo_id: String,
    pub temperature_c: f64,
    pub condition_code: String,
    pub condition_text: String,
    pub observed_at: Instant,
    pub cache: WeatherCurrentResponseCache,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct NewsHeadlinesRequest {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub edition: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum NewsHeadlinesResponseCache {
    #[serde(rename = "hit")]
    Hit,
    #[serde(rename = "miss")]
    Miss,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct NewsHeadlinesResponse {
    pub headlines: Vec<Headline>,
    pub fetched_at: Instant,
    pub cache: NewsHeadlinesResponseCache,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EdgeMapWindiChat {
    pub request: WindiChatRequest,
    pub response: WindiChatResponse,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EdgeMapWeatherGeocode {
    pub request: WeatherGeocodeRequest,
    pub response: WeatherGeocodeResponse,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EdgeMapWeatherCurrent {
    pub request: WeatherCurrentRequest,
    pub response: WeatherCurrentResponse,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EdgeMapNewsHeadlines {
    pub request: NewsHeadlinesRequest,
    pub response: NewsHeadlinesResponse,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct EdgeMap {
    #[serde(rename = "windi-chat")]
    pub windi_chat: EdgeMapWindiChat,
    #[serde(rename = "weather-geocode")]
    pub weather_geocode: EdgeMapWeatherGeocode,
    #[serde(rename = "weather-current")]
    pub weather_current: EdgeMapWeatherCurrent,
    #[serde(rename = "news-headlines")]
    pub news_headlines: EdgeMapNewsHeadlines,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthSignupRequestData {
    pub alias: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthSignupRequest {
    pub email: String,
    pub password: String,
    pub data: AuthSignupRequestData,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AuthVerifyRequestType {
    #[serde(rename = "signup")]
    Signup,
    #[serde(rename = "recovery")]
    Recovery,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthVerifyRequest {
    pub r#type: AuthVerifyRequestType,
    pub email: String,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthPasswordGrantRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthPkceGrantRequest {
    pub auth_code: String,
    pub code_verifier: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AuthSessionResponseTokenType {
    #[serde(rename = "bearer")]
    Bearer,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthSessionResponseUser {
    pub id: Uuid,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthSessionResponse {
    pub access_token: String,
    pub token_type: AuthSessionResponseTokenType,
    pub expires_in: i64,
    pub refresh_token: String,
    pub user: AuthSessionResponseUser,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AuthErrorResponse {
    pub code: i64,
    pub error_code: String,
    pub msg: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct StoredSession {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: Instant,
    pub user_id: Uuid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiPartFunctionCall {
    pub name: String,
    #[ts(type = "Record<string, unknown>")]
    pub args: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiPart {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(rename = "functionCall")]
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub function_call: Option<GeminiPartFunctionCall>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequestSystemInstruction {
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum GeminiRequestContentsItemRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "model")]
    Model,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequestContentsItem {
    pub role: GeminiRequestContentsItemRole,
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequestToolsItemFunctionDeclarationsItem {
    pub name: String,
    pub description: String,
    #[ts(type = "Record<string, unknown>")]
    pub parameters: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequestToolsItem {
    #[serde(rename = "functionDeclarations")]
    pub function_declarations: Vec<GeminiRequestToolsItemFunctionDeclarationsItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum GeminiRequestToolConfigFunctionCallingConfigMode {
    #[serde(rename = "AUTO")]
    AUTO,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequestToolConfigFunctionCallingConfig {
    pub mode: GeminiRequestToolConfigFunctionCallingConfigMode,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequestToolConfig {
    #[serde(rename = "functionCallingConfig")]
    pub function_calling_config: GeminiRequestToolConfigFunctionCallingConfig,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequestGenerationConfig {
    pub temperature: f64,
    #[serde(rename = "maxOutputTokens")]
    pub max_output_tokens: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiRequest {
    #[serde(rename = "systemInstruction")]
    pub system_instruction: GeminiRequestSystemInstruction,
    pub contents: Vec<GeminiRequestContentsItem>,
    pub tools: Vec<GeminiRequestToolsItem>,
    #[serde(rename = "toolConfig")]
    pub tool_config: GeminiRequestToolConfig,
    #[serde(rename = "generationConfig")]
    pub generation_config: GeminiRequestGenerationConfig,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiResponseCandidatesItemContent {
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiResponseCandidatesItem {
    pub content: GeminiResponseCandidatesItemContent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GeminiResponse {
    pub candidates: Vec<GeminiResponseCandidatesItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct OpenMeteoGeocodingResponseResultsItem {
    pub id: i64,
    pub name: String,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub admin1: Option<String>,
    pub country: String,
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct OpenMeteoGeocodingResponse {
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub results: Option<Vec<OpenMeteoGeocodingResponseResultsItem>>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct OpenMeteoForecastResponseCurrent {
    pub time: String,
    pub temperature_2m: f64,
    pub weather_code: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct OpenMeteoForecastResponse {
    pub current: OpenMeteoForecastResponseCurrent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GNewsResponseArticlesItemSource {
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GNewsResponseArticlesItem {
    pub title: String,
    pub url: String,
    #[serde(rename = "publishedAt")]
    pub published_at: String,
    pub source: GNewsResponseArticlesItemSource,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GNewsResponse {
    #[serde(rename = "totalArticles")]
    pub total_articles: i64,
    pub articles: Vec<GNewsResponseArticlesItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct StorageUploadResponse {
    #[serde(rename = "Key")]
    pub key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GithubLatestReleaseAssetsItem {
    pub name: String,
    pub size: i64,
    pub browser_download_url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct GithubLatestRelease {
    pub tag_name: String,
    pub assets: Vec<GithubLatestReleaseAssetsItem>,
}
