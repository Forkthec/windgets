//! Comandos IPC: escritorio, wallpaper y sistema (a.10) y música (a.11) (docs/tipos.ts, sección 12).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
