//! RPC de PostgreSQL (c.1) (docs/tipos.ts, sección 16).

use super::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

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
