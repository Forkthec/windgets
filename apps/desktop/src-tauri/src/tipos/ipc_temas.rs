//! Comandos IPC: personalización y temas (a.6) (docs/tipos.ts, sección 8).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

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
