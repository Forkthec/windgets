//! Edge Functions (c.2) (docs/tipos.ts, sección 17).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
