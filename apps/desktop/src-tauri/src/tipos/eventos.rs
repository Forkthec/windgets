//! Eventos del Núcleo a las vistas (b) (docs/tipos.ts, sección 15).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
