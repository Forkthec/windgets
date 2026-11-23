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
    /// HE-02-HU14 (P29): el ajuste de la imagen en cada monitor, en el orden de `monitors`.
    pub wallpaper_fit: Vec<WallpaperMonitorFit>,
}

/// HE-02-HU14 (P29): cómo se ajusta la imagen de fondo a un monitor, como en Windows: Rellenar (`fill`), Ajustar
/// (`fit`), Expandir (`stretch`), Mosaico (`tile`), Centrar (`center`) y Extender (`span`, una sola imagen sobre
/// todos los monitores).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum WallpaperFit {
    #[serde(rename = "fill")]
    Fill,
    #[serde(rename = "fit")]
    Fit,
    #[serde(rename = "stretch")]
    Stretch,
    #[serde(rename = "tile")]
    Tile,
    #[serde(rename = "center")]
    Center,
    #[serde(rename = "span")]
    Span,
}

/// HE-02-HU14: el ajuste de un monitor. `number` es su número en Windows (1, 2…).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WallpaperMonitorFit {
    pub monitor_id: String,
    pub number: i64,
    pub is_primary: bool,
    pub fit: WallpaperFit,
}

/// IPC-DESK-15 `wallpaper_fit_get` y IPC-DESK-16 `wallpaper_fit_set` (HE-02-HU14): los monitores que se pueden
/// ajustar (hasta 6) y cuántos más hay, que usan el ajuste del monitor principal.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WallpaperFitSettings {
    pub monitors: Vec<WallpaperMonitorFit>,
    pub other_monitors: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct WallpaperFitSetParams {
    pub monitor_id: String,
    pub fit: WallpaperFit,
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

// IPC-DESK-14 `system_time_format_get` y EV-28 `time_format_changed` (HE-04-HU03-ET02).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum TimeFormatHourCycle {
    #[serde(rename = "h12")]
    H12,
    #[serde(rename = "h23")]
    H23,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct TimeFormat {
    pub hour_cycle: TimeFormatHourCycle,
    pub two_digit_hour: bool,
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
