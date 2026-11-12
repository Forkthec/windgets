//! Mapa de comandos: nombre -> parámetros, retorno y errores (docs/tipos.ts, sección 14).

use super::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts", type = "Record<string, never>")]
pub struct NoParams {}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterStart {
    pub params: AuthRegisterStartParams,
    pub result: AuthRegisterStartResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterVerify {
    pub params: AuthRegisterVerifyParams,
    pub result: AuthRegisterVerifyResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterResend {
    pub params: NoParams,
    pub result: CodeSent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRegisterCancel {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthSignIn {
    pub params: AuthSignInParams,
    pub result: SessionInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGoogleStart {
    pub params: NoParams,
    pub result: AuthGoogleStartResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGoogleCancel {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoveryRequest {
    pub params: AuthRecoveryRequestParams,
    pub result: CodeSent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoveryVerify {
    pub params: AuthRecoveryVerifyParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoveryResend {
    pub params: NoParams,
    pub result: CodeSent,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthRecoverySetPassword {
    pub params: AuthRecoverySetPasswordParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGetSession {
    pub params: NoParams,
    pub result: AuthSessionState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthGetSignOutInfo {
    pub params: NoParams,
    pub result: AuthSignOutInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAuthSignOut {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardCreate {
    pub params: CardCreateParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardUpdate {
    pub params: CardUpdateParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardDelete {
    pub params: CardIdParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardGet {
    pub params: CardIdParams,
    pub result: CardDetail,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardListBoard {
    pub params: NoParams,
    pub result: CardListBoardResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardMove {
    pub params: CardMoveParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardSetCompleted {
    pub params: CardSetCompletedParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapPlannerGetToday {
    pub params: NoParams,
    pub result: PlannerToday,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAgendaGetDay {
    pub params: AgendaDayParams,
    pub result: AgendaDay,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardAssignTimeBlock {
    pub params: CardAssignTimeBlockParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCardUnassignTimeBlock {
    pub params: CardUnassignTimeBlockParams,
    pub result: Card,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCalendarGetMonth {
    pub params: CalendarMonthParams,
    pub result: CalendarMonth,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCalendarGetWeek {
    pub params: CalendarWeekParams,
    pub result: CalendarWeek,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCalendarGetDay {
    pub params: CalendarDayParams,
    pub result: CalendarDay,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapKanbanWidgetGet {
    pub params: NoParams,
    pub result: KanbanWidgetData,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelList {
    pub params: NoParams,
    pub result: Vec<Label>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelCreate {
    pub params: LabelCreateParams,
    pub result: Label,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelUpdate {
    pub params: LabelUpdateParams,
    pub result: Label,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelGetDeleteInfo {
    pub params: CardIdParams,
    pub result: LabelDeleteInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLabelDelete {
    pub params: CardIdParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnList {
    pub params: NoParams,
    pub result: Vec<Column>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnCreate {
    pub params: ColumnCreateParams,
    pub result: Column,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnUpdate {
    pub params: ColumnUpdateParams,
    pub result: Column,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnReorder {
    pub params: ColumnReorderParams,
    pub result: Vec<Column>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnGetDeleteInfo {
    pub params: CardIdParams,
    pub result: ColumnDeleteInfo,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapColumnDelete {
    pub params: CardIdParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportResolveRange {
    pub params: ReportResolveRangeParams,
    pub result: ResolvedRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetMeta {
    pub params: NoParams,
    pub result: ReportMeta,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetCompleted {
    pub params: ReportFilterParams,
    pub result: CompletedReport,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetCompliance {
    pub params: ReportFilterParams,
    pub result: ComplianceReport,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapReportGetStatusBreakdown {
    pub params: ReportFilterParams,
    pub result: StatusBreakdown,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeList {
    pub params: NoParams,
    pub result: Vec<ThemeSummary>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeGetApplied {
    pub params: NoParams,
    pub result: AppliedThemeView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftOpen {
    pub params: ThemeDraftOpenParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftSelect {
    pub params: ThemeDraftSelectParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftUpdate {
    pub params: ThemeDraftUpdateParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftReset {
    pub params: ThemeDraftResetParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftSave {
    pub params: NoParams,
    pub result: ThemeDraftSaveResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftSaveAs {
    pub params: ThemeDraftSaveAsParams,
    pub result: ThemeIdResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftApply {
    pub params: ThemeDraftApplyParams,
    pub result: ThemeIdResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftGetStatus {
    pub params: NoParams,
    pub result: ThemeDraftStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDraftDiscard {
    pub params: NoParams,
    pub result: ThemeDraftView,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeApply {
    pub params: ThemeApplyParams,
    pub result: ThemeIdResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeRename {
    pub params: ThemeRenameParams,
    pub result: ThemeSummary,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapThemeDelete {
    pub params: ThemeDeleteParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCatalogList {
    pub params: CatalogListParams,
    pub result: Vec<CatalogItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapCatalogRefresh {
    pub params: NoParams,
    pub result: CatalogRefreshResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapImageImport {
    pub params: ImageImportParams,
    pub result: ImageImportResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAssetResolve {
    pub params: AssetResolveParams,
    pub result: AssetResolveResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetList {
    pub params: NoParams,
    pub result: Vec<WidgetItem>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetCatalogGet {
    pub params: NoParams,
    pub result: WidgetCatalog,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetSetActive {
    pub params: WidgetSetActiveParams,
    pub result: WidgetItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetAdd {
    pub params: WidgetAddParams,
    pub result: WidgetItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetConfigure {
    pub params: WidgetConfigureParams,
    pub result: WidgetItem,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetDelete {
    pub params: WidgetDeleteParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWidgetGetData {
    pub params: WidgetDataParams,
    pub result: WidgetData,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditOpen {
    pub params: NoParams,
    pub result: LayoutEditOpenResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditMove {
    pub params: LayoutEditMoveParams,
    pub result: LayoutEditRectResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditResize {
    pub params: LayoutEditResizeParams,
    pub result: LayoutEditRectResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditGetStatus {
    pub params: NoParams,
    pub result: LayoutEditStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditSave {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayoutEditCancel {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapLayerGetInitialState {
    pub params: NoParams,
    pub result: LayerInitialState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWallpaperGetStatus {
    pub params: NoParams,
    pub result: WallpaperStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppOpenScreen {
    pub params: AppOpenScreenParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppGetLastScreen {
    pub params: NoParams,
    pub result: LastScreen,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppSetLastScreen {
    pub params: AppSetLastScreenParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppHideMainWindow {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppRequestExit {
    pub params: NoParams,
    pub result: AppRequestExitResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAppExit {
    pub params: AppExitParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapSystemOpenUrl {
    pub params: SystemOpenUrlParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAutostartGet {
    pub params: NoParams,
    pub result: AutostartState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapAutostartSet {
    pub params: AutostartState,
    pub result: AutostartState,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapPreferenceGet {
    pub params: NoParams,
    pub result: Preference,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapPreferenceSet {
    pub params: Preference,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapConnectivityGet {
    pub params: NoParams,
    pub result: Connectivity,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaGetSession {
    pub params: NoParams,
    pub result: MediaSession,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaTogglePlayPause {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaSkipNext {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapMediaSkipPrevious {
    pub params: NoParams,
    pub result: (),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiGetConversation {
    pub params: NoParams,
    pub result: WindiConversation,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiSendMessage {
    pub params: WindiSendMessageParams,
    pub result: WindiSendMessageResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiConfirmProposal {
    pub params: WindiConfirmProposalParams,
    pub result: WindiConfirmProposalResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapWindiRejectProposal {
    pub params: WindiRejectProposalParams,
    pub result: WindiRejectProposalResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMapSyncGetStatus {
    pub params: NoParams,
    pub result: SyncStatus,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct CommandMap {
    pub auth_register_start: CommandMapAuthRegisterStart,
    pub auth_register_verify: CommandMapAuthRegisterVerify,
    pub auth_register_resend: CommandMapAuthRegisterResend,
    pub auth_register_cancel: CommandMapAuthRegisterCancel,
    pub auth_sign_in: CommandMapAuthSignIn,
    pub auth_google_start: CommandMapAuthGoogleStart,
    pub auth_google_cancel: CommandMapAuthGoogleCancel,
    pub auth_recovery_request: CommandMapAuthRecoveryRequest,
    pub auth_recovery_verify: CommandMapAuthRecoveryVerify,
    pub auth_recovery_resend: CommandMapAuthRecoveryResend,
    pub auth_recovery_set_password: CommandMapAuthRecoverySetPassword,
    pub auth_get_session: CommandMapAuthGetSession,
    pub auth_get_sign_out_info: CommandMapAuthGetSignOutInfo,
    pub auth_sign_out: CommandMapAuthSignOut,
    pub card_create: CommandMapCardCreate,
    pub card_update: CommandMapCardUpdate,
    pub card_delete: CommandMapCardDelete,
    pub card_get: CommandMapCardGet,
    pub card_list_board: CommandMapCardListBoard,
    pub card_move: CommandMapCardMove,
    pub card_set_completed: CommandMapCardSetCompleted,
    pub planner_get_today: CommandMapPlannerGetToday,
    pub agenda_get_day: CommandMapAgendaGetDay,
    pub card_assign_time_block: CommandMapCardAssignTimeBlock,
    pub card_unassign_time_block: CommandMapCardUnassignTimeBlock,
    pub calendar_get_month: CommandMapCalendarGetMonth,
    pub calendar_get_week: CommandMapCalendarGetWeek,
    pub calendar_get_day: CommandMapCalendarGetDay,
    pub kanban_widget_get: CommandMapKanbanWidgetGet,
    pub label_list: CommandMapLabelList,
    pub label_create: CommandMapLabelCreate,
    pub label_update: CommandMapLabelUpdate,
    pub label_get_delete_info: CommandMapLabelGetDeleteInfo,
    pub label_delete: CommandMapLabelDelete,
    pub column_list: CommandMapColumnList,
    pub column_create: CommandMapColumnCreate,
    pub column_update: CommandMapColumnUpdate,
    pub column_reorder: CommandMapColumnReorder,
    pub column_get_delete_info: CommandMapColumnGetDeleteInfo,
    pub column_delete: CommandMapColumnDelete,
    pub report_resolve_range: CommandMapReportResolveRange,
    pub report_get_meta: CommandMapReportGetMeta,
    pub report_get_completed: CommandMapReportGetCompleted,
    pub report_get_compliance: CommandMapReportGetCompliance,
    pub report_get_status_breakdown: CommandMapReportGetStatusBreakdown,
    pub theme_list: CommandMapThemeList,
    pub theme_get_applied: CommandMapThemeGetApplied,
    pub theme_draft_open: CommandMapThemeDraftOpen,
    pub theme_draft_select: CommandMapThemeDraftSelect,
    pub theme_draft_update: CommandMapThemeDraftUpdate,
    pub theme_draft_reset: CommandMapThemeDraftReset,
    pub theme_draft_save: CommandMapThemeDraftSave,
    pub theme_draft_save_as: CommandMapThemeDraftSaveAs,
    pub theme_draft_apply: CommandMapThemeDraftApply,
    pub theme_draft_get_status: CommandMapThemeDraftGetStatus,
    pub theme_draft_discard: CommandMapThemeDraftDiscard,
    pub theme_apply: CommandMapThemeApply,
    pub theme_rename: CommandMapThemeRename,
    pub theme_delete: CommandMapThemeDelete,
    pub catalog_list: CommandMapCatalogList,
    pub catalog_refresh: CommandMapCatalogRefresh,
    pub image_import: CommandMapImageImport,
    pub asset_resolve: CommandMapAssetResolve,
    pub widget_list: CommandMapWidgetList,
    pub widget_catalog_get: CommandMapWidgetCatalogGet,
    pub widget_set_active: CommandMapWidgetSetActive,
    pub widget_add: CommandMapWidgetAdd,
    pub widget_configure: CommandMapWidgetConfigure,
    pub widget_delete: CommandMapWidgetDelete,
    pub widget_get_data: CommandMapWidgetGetData,
    pub layout_edit_open: CommandMapLayoutEditOpen,
    pub layout_edit_move: CommandMapLayoutEditMove,
    pub layout_edit_resize: CommandMapLayoutEditResize,
    pub layout_edit_get_status: CommandMapLayoutEditGetStatus,
    pub layout_edit_save: CommandMapLayoutEditSave,
    pub layout_edit_cancel: CommandMapLayoutEditCancel,
    pub layer_get_initial_state: CommandMapLayerGetInitialState,
    pub wallpaper_get_status: CommandMapWallpaperGetStatus,
    pub app_open_screen: CommandMapAppOpenScreen,
    pub app_get_last_screen: CommandMapAppGetLastScreen,
    pub app_set_last_screen: CommandMapAppSetLastScreen,
    pub app_hide_main_window: CommandMapAppHideMainWindow,
    pub app_request_exit: CommandMapAppRequestExit,
    pub app_exit: CommandMapAppExit,
    pub system_open_url: CommandMapSystemOpenUrl,
    pub autostart_get: CommandMapAutostartGet,
    pub autostart_set: CommandMapAutostartSet,
    pub preference_get: CommandMapPreferenceGet,
    pub preference_set: CommandMapPreferenceSet,
    pub connectivity_get: CommandMapConnectivityGet,
    pub media_get_session: CommandMapMediaGetSession,
    pub media_toggle_play_pause: CommandMapMediaTogglePlayPause,
    pub media_skip_next: CommandMapMediaSkipNext,
    pub media_skip_previous: CommandMapMediaSkipPrevious,
    pub windi_get_conversation: CommandMapWindiGetConversation,
    pub windi_send_message: CommandMapWindiSendMessage,
    pub windi_confirm_proposal: CommandMapWindiConfirmProposal,
    pub windi_reject_proposal: CommandMapWindiRejectProposal,
    pub sync_get_status: CommandMapSyncGetStatus,
}

#[derive(TS)]
#[ts(export, export_to = "index.ts", type = "keyof CommandMap")]
pub struct CommandName;

#[derive(TS)]
#[ts(
    export,
    export_to = "index.ts",
    type = "<K extends CommandName>( command: K, params: CommandMap[K]['params'], ) => Promise<Result<CommandMap[K]['result']>>"
)]
pub struct Invoke;
