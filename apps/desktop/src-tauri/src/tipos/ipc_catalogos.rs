//! Comandos IPC: catálogos e imágenes propias (a.7) (docs/tipos.ts, sección 9).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum CatalogKind {
    #[serde(rename = "template")]
    Template,
    #[serde(rename = "image")]
    Image,
    #[serde(rename = "font")]
    Font,
    #[serde(rename = "palette")]
    Palette,
    #[serde(rename = "animation")]
    Animation,
    #[serde(rename = "color")]
    Color,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum CatalogItemFormat {
    #[serde(rename = "lottie")]
    Lottie,
    #[serde(rename = "webm")]
    Webm,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogItem {
    pub id: String,
    pub name: String,
    pub thumbnail_url: String,
    pub is_cached: bool,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hex: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_primary: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_secondary: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub color_text: Option<Hex>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub format: Option<CatalogItemFormat>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogListParams {
    pub kind: CatalogKind,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CatalogRefreshResult {
    pub changed: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ImportPurpose {
    #[serde(rename = "background")]
    Background,
    #[serde(rename = "static_image")]
    StaticImage,
    #[serde(rename = "carousel_item")]
    CarouselItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ImageImportParams {
    pub path: String,
    pub purpose: ImportPurpose,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ImageImportResult {
    pub uploaded_image_id: Uuid,
    pub preview_url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AssetKind {
    #[serde(rename = "catalog_image")]
    CatalogImage,
    #[serde(rename = "catalog_template")]
    CatalogTemplate,
    #[serde(rename = "catalog_font")]
    CatalogFont,
    #[serde(rename = "catalog_animation")]
    CatalogAnimation,
    #[serde(rename = "uploaded_image")]
    UploadedImage,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AssetResolveParams {
    pub kind: AssetKind,
    pub id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum AssetResolveResultState {
    #[serde(rename = "ready")]
    Ready,
    #[serde(rename = "downloading")]
    Downloading,
    #[serde(rename = "unavailable")]
    Unavailable,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AssetResolveResult {
    pub url: String,
    pub state: AssetResolveResultState,
}
