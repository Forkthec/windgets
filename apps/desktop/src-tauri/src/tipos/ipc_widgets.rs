//! Comandos IPC: widgets (a.8) (docs/tipos.ts, sección 10).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
