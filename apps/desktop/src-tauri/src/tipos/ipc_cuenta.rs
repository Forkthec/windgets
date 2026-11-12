//! Comandos IPC: cuenta y sesión (a.1) (docs/tipos.ts, sección 4).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
