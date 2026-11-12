//! Integraciones externas (d): formas que lee el Núcleo (docs/tipos.ts, sección 18).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
