//! Comandos IPC: edición de la distribución (a.9) (docs/tipos.ts, sección 11).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditOpenResult {
    pub monitor: Monitor,
    pub widgets: Vec<WidgetRect>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditMoveParams {
    pub widget_id: Uuid,
    pub x: i64,
    pub y: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditResizeParams {
    pub widget_id: Uuid,
    pub x: i64,
    pub y: i64,
    pub width: i64,
    pub height: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditRectResult {
    pub rect: WidgetRect,
    pub collided: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct LayoutEditStatus {
    pub dirty: bool,
}
