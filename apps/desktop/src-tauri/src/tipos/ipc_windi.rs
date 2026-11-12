//! Comandos IPC: agente de IA Windi (a.12) y sincronización (a.13) (docs/tipos.ts, sección 13).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
