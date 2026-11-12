/**
 * Tipos de los contratos de Windgets.
 *
 * Es lo que generaría ts-rs a partir de los tipos de Rust (D-188): parámetros y retornos de los
 * comandos IPC, errores, eventos del Núcleo a las vistas, RPC de PostgreSQL, Edge Functions e
 * integraciones. Los nombres de campo van en snake_case, igual que en Rust y en la base de datos.
 * Se verifica con: npx -y typescript@5.6.3 tsc --noEmit --strict tipos.ts
 */

// ---------------------------------------------------------------------------
// 1. Formatos básicos (contratos.md, 1.2)
// ---------------------------------------------------------------------------

/** UUID en minúsculas. */
export type Uuid = string;
/** `YYYY-MM-DD`, fecha local del computador. */
export type DateIso = string;
/** ISO 8601 en UTC con milisegundos y `Z`, por ejemplo `2026-11-09T15:04:05.120Z`. */
export type Instant = string;
/** `#RRGGBB` (el Núcleo normaliza a mayúsculas). */
export type Hex = string;
/** Hora del día, entero de 0 a 23. */
export type Hour = number;

export type CardType = 'task' | 'reminder' | 'event';
export type Priority = 'high' | 'medium' | 'low';
export type ColumnRole = 'todo' | 'in_progress' | 'done' | 'custom';
export type OriginKind = 'local' | 'remote';
export type ChangeOp = 'upsert' | 'delete';

// ---------------------------------------------------------------------------
// 2. Errores (contratos.md, 1.3)
// ---------------------------------------------------------------------------

/** Códigos estables; las vistas ramifican por `code`. */
export type ErrorCode =
  // comunes
  | 'net.offline' | 'service.unavailable' | 'internal.unexpected' | 'session.expired'
  // cuenta y sesión
  | 'alias.required' | 'alias.too_long'
  | 'email.required' | 'email.invalid' | 'email.too_long' | 'email.already_registered'
  | 'password.required' | 'password.invalid' | 'password.same_as_current'
  | 'password_confirmation.required' | 'password_confirmation.mismatch'
  | 'code.required' | 'code.incorrect' | 'code.expired' | 'code.resend_too_soon'
  | 'auth.rate_limited' | 'auth.invalid_credentials'
  // tarjetas, agenda y planificador
  | 'title.required' | 'title.too_long'
  | 'due_date.required' | 'due_date.invalid' | 'due_date.in_past'
  | 'description.too_long' | 'labels.too_many' | 'labels.not_found'
  | 'card.not_found' | 'column.not_found'
  | 'time_block.past' | 'time_block.after_due_date'
  // etiquetas y columnas
  | 'name.required' | 'name.too_long' | 'name.duplicate'
  | 'color.required' | 'color.invalid'
  | 'label.limit_reached' | 'label.not_found'
  | 'column.limit_reached' | 'column.order_invalid' | 'column.default_not_deletable'
  // reportes
  | 'range.start_required' | 'range.end_required' | 'range.invalid_date'
  | 'range.start_after_end' | 'range.too_long'
  // temas y personalización
  | 'draft.unsaved_changes' | 'draft.unsaved_changes_on_apply' | 'draft.no_changes'
  | 'theme.limit_reached' | 'theme.already_applied' | 'theme.applied_not_deletable'
  | 'background.already_default'
  | 'template.not_found' | 'font.not_found' | 'image.not_found'
  // imágenes y catálogos
  | 'image.format_not_allowed' | 'image.too_large' | 'image.unreadable' | 'asset.unavailable'
  // widgets
  | 'widget.not_found' | 'widget.already_added' | 'widget.default_not_deletable'
  | 'city.not_found' | 'city.duplicate' | 'city.too_long'
  | 'text.too_long'
  | 'carousel.too_few' | 'carousel.too_many'
  | 'interval.out_of_range' | 'interval.required'
  // escritorio y sistema
  | 'url.not_allowed' | 'autostart.failed'
  // música
  | 'media.no_session' | 'media.action_unsupported'
  // agente de IA
  | 'message.too_long' | 'windi.unavailable' | 'proposal.discarded';

/** Parámetros con los que el Núcleo sustituye los marcadores del mensaje (contratos.md, 1.4). */
export type ErrorParams = Record<string, string | number>;

export interface AppError {
  code: ErrorCode;
  /** Texto literal del backlog con los marcadores ya sustituidos; vacío si el backlog no lo define. */
  message: string;
  /** Campo del formulario al que pertenece el mensaje. */
  field?: string;
  params?: ErrorParams;
}

/** Mensaje de resultado (RT-04): la vista lo muestra 4 s en la esquina inferior derecha. */
export interface ResultMessage {
  code: string;
  message: string;
  params?: ErrorParams;
}

/** Lo que devuelve un comando: el valor y, si aplica, el mensaje de resultado. */
export interface Ok<T> {
  ok: true;
  value: T;
  result_message?: ResultMessage;
}
export interface Err {
  ok: false;
  error: AppError;
}
export type Result<T> = Ok<T> | Err;

/** Vistas autorizadas (P ventana principal, C capa del wallpaper, E edición de la distribución). */
export type ViewId = 'P' | 'C' | 'E';

// ---------------------------------------------------------------------------
// 3. Tipos compartidos (contratos.md, 1.6)
// ---------------------------------------------------------------------------

export interface Card {
  id: Uuid;
  type: CardType;
  title: string;
  description: string | null;
  priority: Priority | null;
  due_date: DateIso;
  column_id: Uuid;
  position: number;
  previous_column_id: Uuid | null;
  completed_on: DateIso | null;
  scheduled_date: DateIso | null;
  scheduled_hour: Hour | null;
  label_ids: Uuid[];
  is_completed: boolean;
  is_overdue: boolean;
  created_at: Instant;
}

export interface CardDetail extends Card {
  labels: Array<{ id: Uuid; name: string; color_hex: Hex }>;
  column: { id: Uuid; name: string; color_hex: Hex };
  /** `label` tiene el formato «10:00 – 11:00». */
  time_block: { date: DateIso; hour: Hour; label: string } | null;
}

export interface Label {
  id: Uuid;
  name: string;
  color_id: string;
  color_hex: Hex;
  card_count: number;
}

export interface Column {
  id: Uuid;
  name: string;
  color_id: string;
  color_hex: Hex;
  role: ColumnRole;
  position: number;
  card_count: number;
  is_default: boolean;
}

export type FontSize = 'small' | 'medium' | 'large';
export type BackgroundSource = 'template_default' | 'catalog' | 'own';

export interface ThemeBackground {
  source: BackgroundSource;
  catalog_image_id: string | null;
  uploaded_image_id: Uuid | null;
}

export interface ThemeColors {
  primary: Hex;
  secondary: Hex;
  text: Hex;
}

export interface ThemeContent {
  template_id: string;
  background: ThemeBackground;
  colors: ThemeColors;
  /** Nulo = «Personalizada». */
  palette_id: string | null;
  font: { id: string; size: FontSize };
}

export interface ThemeSummary {
  id: Uuid;
  name: string;
  last_modified_at: Instant;
  is_applied: boolean;
  has_unapplied_changes: boolean;
  has_unsaved_changes: boolean;
}

/** Pares de la legibilidad (interfaz.md, «Tema a tokens»): tinta principal 7:1, texto 4,5:1, controles 3:1. */
export type LegibilityPair = 'ink_surface' | 'text_surface' | 'control_surface';

export interface LegibilityItem {
  pair: LegibilityPair;
  ratio: number;
  min: number;
}

export interface Legibility {
  ok: boolean;
  items: LegibilityItem[];
  /** Color sugerido para el par que no cumple (el de menor razón) y su contraste, truncado a un decimal. */
  suggestion: { pair: LegibilityPair; color: Hex; ratio: number } | null;
}

export interface ThemeDraftView {
  theme_id: Uuid;
  name: string;
  content: ThemeContent;
  dirty: boolean;
  applied_unsaved: boolean;
  legibility: Legibility;
}

export type WidgetType =
  | 'clock' | 'calendar' | 'daily_tasks' | 'kanban'
  | 'weather' | 'news' | 'music_player' | 'animation' | 'image_carousel' | 'static_image' | 'text';

/** Widgets que se agregan desde el catálogo de widgets (los otros cuatro son los widgets por defecto). */
export type AddableWidgetType =
  | 'weather' | 'news' | 'music_player' | 'animation' | 'image_carousel' | 'static_image' | 'text';

export type ImageSource = 'catalog' | 'own';
export interface ImageRef {
  source: ImageSource;
  catalog_image_id?: string;
  uploaded_image_id?: Uuid;
}

export interface WeatherConfig { city: string }
export interface TextConfig { text: string }
export interface AnimationConfig { animation_id: string }
export interface StaticImageConfig extends ImageRef {}
export interface CarouselConfig { items: ImageRef[]; interval_seconds?: number }
export type EmptyConfig = Record<string, never>;
export type WidgetConfig =
  | WeatherConfig | TextConfig | AnimationConfig | StaticImageConfig | CarouselConfig | EmptyConfig;

export interface WidgetItem {
  widget_id: Uuid;
  type: WidgetType;
  display_name: string;
  distinguishing_value: string | null;
  is_default: boolean;
  is_active: boolean;
  can_configure: boolean;
  can_delete: boolean;
  paused_by_load: boolean;
  /** Precarga el Formulario de widget (D-202). */
  config: WidgetConfig;
}

export interface WidgetRect {
  widget_id: Uuid;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  is_active: boolean;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';
export interface SyncStatus {
  status: SyncState;
  pending_count: number;
  last_sync_at: Instant | null;
}

/** Píxeles físicos y escala de un monitor (D-187). */
export interface Monitor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale_factor: number;
}

export type ScreenId =
  | 'planner_daily' | 'kanban' | 'calendar' | 'agenda' | 'reports' | 'windi'
  | 'labels' | 'widgets' | 'personalization' | 'themes' | 'settings';

export interface ScreenParams {
  card_id?: Uuid;
  date?: DateIso;
  calendar_view?: 'month';
}

// ---------------------------------------------------------------------------
// 4. Comandos IPC: cuenta y sesión (a.1)
// ---------------------------------------------------------------------------

export interface AuthRegisterStartParams {
  alias: string;
  email: string;
  password: string;
  password_confirmation: string;
}
export interface CodeSent { resend_available_at: Instant }
export interface AuthRegisterStartResult extends CodeSent { expires_at: Instant }
export interface AuthRegisterVerifyParams { code: string }
export interface AuthRegisterVerifyResult { alias: string }
export interface AuthSignInParams { email: string; password: string }
export interface SessionInfo { user_id: Uuid; alias: string }
export interface AuthGoogleStartResult { expires_at: Instant }
export interface AuthRecoveryRequestParams { email: string }
export interface AuthRecoveryVerifyParams { code: string }
export interface AuthRecoverySetPasswordParams { password: string; password_confirmation: string }
export interface AuthSessionState {
  state: 'signed_out' | 'signed_in';
  user_id?: Uuid;
  alias?: string;
  token: 'valid' | 'refresh_pending';
}
export interface AuthSignOutInfo { pending_count: number }

// ---------------------------------------------------------------------------
// 5. Comandos IPC: tarjetas, agenda, calendario y planificador diario (a.2)
// ---------------------------------------------------------------------------

export interface CardCreateParams {
  type?: CardType;
  title: string;
  due_date: DateIso;
  description?: string;
  priority?: Priority;
  label_ids?: Uuid[];
}
export interface CardPatch {
  type?: CardType;
  title?: string;
  due_date?: DateIso;
  description?: string | null;
  priority?: Priority | null;
  label_ids?: Uuid[];
}
export interface CardUpdateParams { id: Uuid; patch: CardPatch }
export interface CardIdParams { id: Uuid }

export interface BoardColumn { column: Column; cards: Card[] }
export interface CardListBoardResult { columns: BoardColumn[] }

export type Placement = { kind: 'end' } | { kind: 'before'; card_id: Uuid };
export interface CardMoveParams { card_id: Uuid; column_id: Uuid; placement: Placement }
export interface CardSetCompletedParams { card_id: Uuid; completed: boolean }

export interface PlannerItem { card: Card; hour: Hour | null }
export interface PlannerSummary { total: number; completed: number; remaining: number; percent: number }
export interface PlannerToday { date: DateIso; items: PlannerItem[]; summary: PlannerSummary }

export interface AgendaDayParams { date: DateIso }
export interface AgendaBlock { hour: Hour; cards: Card[]; is_past: boolean }
export interface AgendaDay {
  date: DateIso;
  is_today: boolean;
  current_hour: Hour | null;
  /** 24 bloques. */
  blocks: AgendaBlock[];
  unscheduled: Card[];
}

export interface CardAssignTimeBlockParams { card_id: Uuid; date: DateIso; hour: Hour }
export interface CardUnassignTimeBlockParams { card_id: Uuid }

export interface CalendarMonthParams { year: number; month: number }
export interface CalendarMonthDay {
  date: DateIso;
  /** Hasta 3. */
  preview: Array<{ id: Uuid; title: string }>;
  extra_count: number;
  /** Tarjetas del día con fecha límite anterior a hoy y fuera de la columna Hecho (HE-10-HU05-ET07), sin el límite de `preview`. */
  overdue_count: number;
  /** Tarjetas del día con fecha límite de hoy o posterior y fuera de la columna Hecho. */
  pending_count: number;
  has_overdue: boolean;
  has_pending: boolean;
}
export interface CalendarMonth { days: CalendarMonthDay[] }

/** `week_start` es el lunes de la semana. */
export interface CalendarWeekParams { week_start: DateIso }
export interface CalendarWeekDay {
  date: DateIso;
  cards: Array<{ card: Card; start_hour: Hour | null }>;
  overdue_count: number;
  pending_count: number;
  has_overdue: boolean;
  has_pending: boolean;
}
export interface CalendarWeek { days: CalendarWeekDay[] }

export interface CalendarDayParams { date: DateIso }
export interface CalendarDay {
  date: DateIso;
  cards: Array<{ id: Uuid; type: CardType; title: string; priority: Priority | null; column_name: string }>;
  can_create: boolean;
}

export interface KanbanWidgetColumn {
  column: Column;
  /** Hasta 5. */
  titles: Array<{ card_id: Uuid; title: string }>;
  extra_count: number;
}
export interface KanbanWidgetData { columns: KanbanWidgetColumn[] }

// ---------------------------------------------------------------------------
// 6. Comandos IPC: etiquetas y columnas (a.3, a.4)
// ---------------------------------------------------------------------------

export interface LabelCreateParams { name: string; color_id: string }
export interface LabelUpdateParams { id: Uuid; name: string; color_id: string }
export interface LabelDeleteInfo { name: string; card_count: number }

export interface ColumnCreateParams { name: string; color_id?: string }
export interface ColumnUpdateParams { id: Uuid; name?: string; color_id?: string }
export interface ColumnReorderParams { column_ids: Uuid[] }
export interface ColumnDeleteInfo { name: string; card_count: number; destination_name: string }

// ---------------------------------------------------------------------------
// 7. Comandos IPC: reportes (a.5)
// ---------------------------------------------------------------------------

export type RangeInput =
  | { kind: 'last_7' | 'last_30' | 'last_12_months' }
  | { kind: 'custom'; start: DateIso; end: DateIso };
export interface ReportFilter { range: RangeInput; label_ids: Uuid[] }
export type ReportGrouping = 'day' | 'week' | 'month';

export interface ReportResolveRangeParams { range: RangeInput }
export interface ResolvedRange {
  start: DateIso;
  end: DateIso;
  days: number;
  grouping: ReportGrouping;
  clipped_start: DateIso | null;
}
export interface ReportMeta { has_cards: boolean; first_card_date: DateIso | null; has_labels: boolean }
export interface ReportFilterParams { filter: ReportFilter }
export interface CompletedPoint { period_start: DateIso; period_end: DateIso; count: number }
export interface CompletedReport { grouping: ReportGrouping; points: CompletedPoint[]; is_empty: boolean }
export interface ComplianceReport { percent: number | null; on_time: number; total: number; is_empty: boolean }
export interface StatusBreakdown {
  overdue: number;
  pending: number;
  completed: number;
  total: number;
  percent_overdue: number;
  percent_pending: number;
  percent_completed: number;
  is_empty: boolean;
}

// ---------------------------------------------------------------------------
// 8. Comandos IPC: personalización y temas (a.6)
// ---------------------------------------------------------------------------

export interface AppliedThemeView {
  theme_id: Uuid;
  name: string;
  content: ThemeContent;
  has_unapplied_changes: boolean;
  has_unsaved_changes: boolean;
}
export interface ThemeDraftOpenParams { theme_id?: Uuid }
export interface ThemeDraftSelectParams { theme_id: Uuid; discard_changes?: boolean }
export interface ThemeDraftPatch {
  template_id?: string;
  background?: { source: BackgroundSource; catalog_image_id?: string; uploaded_image_id?: Uuid };
  /** Cadena vacía = campo vacío: el Núcleo responde `color.required` (HE-02-HU05-CA04). */
  colors?: { primary?: Hex | ''; secondary?: Hex | ''; text?: Hex | '' };
  palette_id?: string | null;
  font_id?: string;
  font_size?: FontSize;
}
export interface ThemeDraftUpdateParams { patch: ThemeDraftPatch }
export interface ThemeDraftResetParams { part: 'colors' | 'typography' }
export interface ThemeDraftSaveResult { theme_id: Uuid; is_applied: boolean }
export interface ThemeDraftSaveAsParams { name: string }
export interface ThemeIdResult { theme_id: Uuid }
export type ApplyMode = 'apply' | 'save_and_apply' | 'apply_without_saving';
export interface ThemeDraftApplyParams { mode: ApplyMode }
export interface ThemeDraftStatus { dirty: boolean; applied_unsaved: boolean; theme_name: string }
export interface ThemeApplyParams { theme_id: Uuid; discard_draft?: boolean }
export interface ThemeRenameParams { theme_id: Uuid; name: string }
export interface ThemeDeleteParams { theme_id: Uuid }

// ---------------------------------------------------------------------------
// 9. Comandos IPC: catálogos e imágenes propias (a.7)
// ---------------------------------------------------------------------------

export type CatalogKind = 'template' | 'image' | 'font' | 'palette' | 'animation' | 'color';
export interface CatalogItem {
  id: string;
  name: string;
  /** URL local del protocolo de assets de Tauri. */
  thumbnail_url: string;
  is_cached: boolean;
  /** Color (`catalog_color`). */
  hex?: Hex;
  /** Colores de la paleta (`catalog_palette`). */
  color_primary?: Hex;
  color_secondary?: Hex;
  color_text?: Hex;
  /** Formato de la animación (`catalog_animation`). */
  format?: 'lottie' | 'webm';
}
export interface CatalogListParams { kind: CatalogKind }
export interface CatalogRefreshResult { changed: boolean }
export type ImportPurpose = 'background' | 'static_image' | 'carousel_item';
export interface ImageImportParams { path: string; purpose: ImportPurpose }
export interface ImageImportResult { uploaded_image_id: Uuid; preview_url: string }
export type AssetKind =
  | 'catalog_image' | 'catalog_template' | 'catalog_font' | 'catalog_animation' | 'uploaded_image';
export interface AssetResolveParams { kind: AssetKind; id: string }
export interface AssetResolveResult { url: string; state: 'ready' | 'downloading' | 'unavailable' }

// ---------------------------------------------------------------------------
// 10. Comandos IPC: widgets (a.8)
// ---------------------------------------------------------------------------

export interface WidgetCatalogEntry {
  type: AddableWidgetType;
  name: string;
  description: string;
  enabled: boolean;
  /** «Ya agregaste este widget.» para Noticias y Reproductor de música ya agregados. */
  disabled_reason: string | null;
}
export interface WidgetCatalog { external: WidgetCatalogEntry[]; local: WidgetCatalogEntry[] }
export interface WidgetSetActiveParams { widget_id: Uuid; active: boolean }
export interface WidgetAddParams { type: AddableWidgetType; config: WidgetConfig }
export interface WidgetConfigureParams { widget_id: Uuid; config: WeatherConfig | TextConfig }
export interface WidgetDeleteParams { widget_id: Uuid }
export interface WidgetDataParams { widget_id: Uuid }
export type WidgetDataStatus = 'ok' | 'error' | 'offline';
export interface WeatherData {
  city: string;
  temperature_c: number;
  condition_code: string;
  condition_text: string;
}
export interface Headline { title: string; source: string; url: string; published_at: Instant }
export interface NewsData { headlines: Headline[] }
export interface WidgetData {
  status: WidgetDataStatus;
  payload: WeatherData | NewsData | null;
  fetched_at: Instant | null;
}

// ---------------------------------------------------------------------------
// 11. Comandos IPC: edición de la distribución (a.9)
// ---------------------------------------------------------------------------

export interface LayoutEditOpenResult { monitor: Monitor; widgets: WidgetRect[] }
export interface LayoutEditMoveParams { widget_id: Uuid; x: number; y: number }
export interface LayoutEditResizeParams { widget_id: Uuid; x: number; y: number; width: number; height: number }
export interface LayoutEditRectResult { rect: WidgetRect; collided: boolean }
export interface LayoutEditStatus { dirty: boolean }

// ---------------------------------------------------------------------------
// 12. Comandos IPC: escritorio, wallpaper y sistema (a.10) y música (a.11)
// ---------------------------------------------------------------------------

export type WallpaperState = 'ok' | 'fallback_default' | 'hidden';
export interface LayerInitialState {
  applied: ThemeContent;
  widgets: WidgetRect[];
  monitors: Monitor[];
  wallpaper_state: WallpaperState;
}
export interface WallpaperStatus { state: WallpaperState }
export interface AppOpenScreenParams { screen: ScreenId; params?: ScreenParams }
export interface LastScreen { screen: ScreenId | null }
export interface AppSetLastScreenParams { screen: ScreenId }
export interface AppRequestExitResult { requires_confirmation: boolean }
export interface AppExitParams { discard_changes: boolean }
export interface SystemOpenUrlParams { url: string }
export interface AutostartState { enabled: boolean }
export interface Preference { board_card_view: 'compact' | 'expanded' }
export interface Connectivity { online: boolean }

export type PlaybackStatus = 'playing' | 'paused' | 'stopped';
export interface MediaSession {
  has_session: boolean;
  title: string | null;
  artist: string | null;
  thumbnail_url: string | null;
  status: PlaybackStatus;
  can_previous: boolean;
  can_next: boolean;
  can_play_pause: boolean;
}

// ---------------------------------------------------------------------------
// 13. Comandos IPC: agente de IA Windi (a.12) y sincronización (a.13)
// ---------------------------------------------------------------------------

export interface WindiMessage {
  id: Uuid;
  role: 'user' | 'assistant';
  text: string;
  sent_at: Instant;
  /** El mensaje del usuario que no recibió respuesta; la vista agrega «Reintentar». */
  failed: boolean;
}
export type ProposalAction = 'create' | 'edit' | 'move' | 'delete';
export type ProposalState = 'active' | 'confirmed' | 'rejected' | 'discarded';
export interface WindiProposalItem {
  card_id: Uuid | null;
  current: Partial<Card> | null;
  changes: Partial<Card> | null;
  title: string;
}
export interface WindiProposal {
  id: Uuid;
  action: ProposalAction;
  items: WindiProposalItem[];
  /** Avisos literales que agrega el Núcleo por regla. */
  warnings: string[];
  state: ProposalState;
}
export interface WindiConversation {
  messages: WindiMessage[];
  proposal: WindiProposal | null;
  online: boolean;
}
export interface WindiSendMessageParams { message: string }
export interface WindiSendMessageResult { reply: WindiMessage; proposal: WindiProposal | null }
export interface WindiConfirmProposalParams { proposal_id: Uuid }
export interface WindiConfirmProposalResult {
  outcome: 'applied' | 'stale';
  reply: WindiMessage;
  new_proposal: WindiProposal | null;
}
export interface WindiRejectProposalParams { proposal_id: Uuid }
export interface WindiRejectProposalResult { reply: WindiMessage }

// ---------------------------------------------------------------------------
// 14. Mapa de comandos: nombre -> parámetros, retorno y errores
// ---------------------------------------------------------------------------

type NoParams = Record<string, never>;
type Void = null;

export interface CommandMap {
  // a.1 cuenta y sesión
  auth_register_start: { params: AuthRegisterStartParams; result: AuthRegisterStartResult };
  auth_register_verify: { params: AuthRegisterVerifyParams; result: AuthRegisterVerifyResult };
  auth_register_resend: { params: NoParams; result: CodeSent };
  auth_register_cancel: { params: NoParams; result: Void };
  auth_sign_in: { params: AuthSignInParams; result: SessionInfo };
  auth_google_start: { params: NoParams; result: AuthGoogleStartResult };
  auth_google_cancel: { params: NoParams; result: Void };
  auth_recovery_request: { params: AuthRecoveryRequestParams; result: CodeSent };
  auth_recovery_verify: { params: AuthRecoveryVerifyParams; result: Void };
  auth_recovery_resend: { params: NoParams; result: CodeSent };
  auth_recovery_set_password: { params: AuthRecoverySetPasswordParams; result: Void };
  auth_get_session: { params: NoParams; result: AuthSessionState };
  auth_get_sign_out_info: { params: NoParams; result: AuthSignOutInfo };
  auth_sign_out: { params: NoParams; result: Void };
  // a.2 tarjetas, agenda, calendario y planificador diario
  card_create: { params: CardCreateParams; result: Card };
  card_update: { params: CardUpdateParams; result: Card };
  card_delete: { params: CardIdParams; result: Void };
  card_get: { params: CardIdParams; result: CardDetail };
  card_list_board: { params: NoParams; result: CardListBoardResult };
  card_move: { params: CardMoveParams; result: Card };
  card_set_completed: { params: CardSetCompletedParams; result: Card };
  planner_get_today: { params: NoParams; result: PlannerToday };
  agenda_get_day: { params: AgendaDayParams; result: AgendaDay };
  card_assign_time_block: { params: CardAssignTimeBlockParams; result: Card };
  card_unassign_time_block: { params: CardUnassignTimeBlockParams; result: Card };
  calendar_get_month: { params: CalendarMonthParams; result: CalendarMonth };
  calendar_get_week: { params: CalendarWeekParams; result: CalendarWeek };
  calendar_get_day: { params: CalendarDayParams; result: CalendarDay };
  kanban_widget_get: { params: NoParams; result: KanbanWidgetData };
  // a.3 etiquetas
  label_list: { params: NoParams; result: Label[] };
  label_create: { params: LabelCreateParams; result: Label };
  label_update: { params: LabelUpdateParams; result: Label };
  label_get_delete_info: { params: CardIdParams; result: LabelDeleteInfo };
  label_delete: { params: CardIdParams; result: Void };
  // a.4 columnas
  column_list: { params: NoParams; result: Column[] };
  column_create: { params: ColumnCreateParams; result: Column };
  column_update: { params: ColumnUpdateParams; result: Column };
  column_reorder: { params: ColumnReorderParams; result: Column[] };
  column_get_delete_info: { params: CardIdParams; result: ColumnDeleteInfo };
  column_delete: { params: CardIdParams; result: Void };
  // a.5 reportes
  report_resolve_range: { params: ReportResolveRangeParams; result: ResolvedRange };
  report_get_meta: { params: NoParams; result: ReportMeta };
  report_get_completed: { params: ReportFilterParams; result: CompletedReport };
  report_get_compliance: { params: ReportFilterParams; result: ComplianceReport };
  report_get_status_breakdown: { params: ReportFilterParams; result: StatusBreakdown };
  // a.6 personalización y temas
  theme_list: { params: NoParams; result: ThemeSummary[] };
  theme_get_applied: { params: NoParams; result: AppliedThemeView };
  theme_draft_open: { params: ThemeDraftOpenParams; result: ThemeDraftView };
  theme_draft_select: { params: ThemeDraftSelectParams; result: ThemeDraftView };
  theme_draft_update: { params: ThemeDraftUpdateParams; result: ThemeDraftView };
  theme_draft_reset: { params: ThemeDraftResetParams; result: ThemeDraftView };
  theme_draft_save: { params: NoParams; result: ThemeDraftSaveResult };
  theme_draft_save_as: { params: ThemeDraftSaveAsParams; result: ThemeIdResult };
  theme_draft_apply: { params: ThemeDraftApplyParams; result: ThemeIdResult };
  theme_draft_get_status: { params: NoParams; result: ThemeDraftStatus };
  theme_draft_discard: { params: NoParams; result: ThemeDraftView };
  theme_apply: { params: ThemeApplyParams; result: ThemeIdResult };
  theme_rename: { params: ThemeRenameParams; result: ThemeSummary };
  theme_delete: { params: ThemeDeleteParams; result: Void };
  // a.7 catálogos e imágenes propias
  catalog_list: { params: CatalogListParams; result: CatalogItem[] };
  catalog_refresh: { params: NoParams; result: CatalogRefreshResult };
  image_import: { params: ImageImportParams; result: ImageImportResult };
  asset_resolve: { params: AssetResolveParams; result: AssetResolveResult };
  // a.8 widgets
  widget_list: { params: NoParams; result: WidgetItem[] };
  widget_catalog_get: { params: NoParams; result: WidgetCatalog };
  widget_set_active: { params: WidgetSetActiveParams; result: WidgetItem };
  widget_add: { params: WidgetAddParams; result: WidgetItem };
  widget_configure: { params: WidgetConfigureParams; result: WidgetItem };
  widget_delete: { params: WidgetDeleteParams; result: Void };
  widget_get_data: { params: WidgetDataParams; result: WidgetData };
  // a.9 edición de la distribución
  layout_edit_open: { params: NoParams; result: LayoutEditOpenResult };
  layout_edit_move: { params: LayoutEditMoveParams; result: LayoutEditRectResult };
  layout_edit_resize: { params: LayoutEditResizeParams; result: LayoutEditRectResult };
  layout_edit_get_status: { params: NoParams; result: LayoutEditStatus };
  layout_edit_save: { params: NoParams; result: Void };
  layout_edit_cancel: { params: NoParams; result: Void };
  // a.10 escritorio, wallpaper y sistema
  layer_get_initial_state: { params: NoParams; result: LayerInitialState };
  wallpaper_get_status: { params: NoParams; result: WallpaperStatus };
  app_open_screen: { params: AppOpenScreenParams; result: Void };
  app_get_last_screen: { params: NoParams; result: LastScreen };
  app_set_last_screen: { params: AppSetLastScreenParams; result: Void };
  app_hide_main_window: { params: NoParams; result: Void };
  app_request_exit: { params: NoParams; result: AppRequestExitResult };
  app_exit: { params: AppExitParams; result: Void };
  system_open_url: { params: SystemOpenUrlParams; result: Void };
  autostart_get: { params: NoParams; result: AutostartState };
  autostart_set: { params: AutostartState; result: AutostartState };
  preference_get: { params: NoParams; result: Preference };
  preference_set: { params: Preference; result: Void };
  connectivity_get: { params: NoParams; result: Connectivity };
  // a.11 música
  media_get_session: { params: NoParams; result: MediaSession };
  media_toggle_play_pause: { params: NoParams; result: Void };
  media_skip_next: { params: NoParams; result: Void };
  media_skip_previous: { params: NoParams; result: Void };
  // a.12 agente de IA
  windi_get_conversation: { params: NoParams; result: WindiConversation };
  windi_send_message: { params: WindiSendMessageParams; result: WindiSendMessageResult };
  windi_confirm_proposal: { params: WindiConfirmProposalParams; result: WindiConfirmProposalResult };
  windi_reject_proposal: { params: WindiRejectProposalParams; result: WindiRejectProposalResult };
  // a.13 sincronización
  sync_get_status: { params: NoParams; result: SyncStatus };
}

export type CommandName = keyof CommandMap;

/** Firma genérica de `invoke` tal como la expone el envoltorio tipado de las vistas. */
export type Invoke = <K extends CommandName>(
  command: K,
  params: CommandMap[K]['params'],
) => Promise<Result<CommandMap[K]['result']>>;

// ---------------------------------------------------------------------------
// 15. Eventos del Núcleo a las vistas (b)
// ---------------------------------------------------------------------------

export interface EntityChange { ids: Uuid[]; op: ChangeOp; origin: OriginKind }

export interface EventMap {
  session_changed: {
    state: 'signed_out' | 'signed_in';
    alias?: string;
    reason: 'sign_in' | 'sign_out' | 'token_expired' | 'registered';
  };
  auth_google_result: {
    status: 'success' | 'cancelled' | 'error' | 'email_too_long';
    is_new_account?: boolean;
    alias?: string;
    message: string;
  };
  connectivity_changed: { online: boolean };
  sync_status_changed: SyncStatus;
  sync_completed: { pushed: number; pulled: number; after_reconnect: boolean };
  sync_conflicts_resolved: { count: number };
  cards_changed: EntityChange;
  labels_changed: EntityChange;
  columns_changed: EntityChange;
  themes_changed: EntityChange;
  applied_theme_changed: { theme_id: Uuid; origin: OriginKind; has_unsaved_draft: boolean };
  widgets_changed: { widget_ids: Uuid[]; op: ChangeOp; origin: OriginKind };
  layout_changed: { theme_id: Uuid; origin: OriginKind };
  draft_changed: { dirty: boolean; applied_unsaved: boolean };
  layout_edit_state_changed: { open: boolean; dirty: boolean };
  wallpaper_status_changed: { state: WallpaperState };
  monitors_changed: { monitors: Monitor[] };
  /** Coordenadas en el sistema de la capa. */
  pointer_forwarded: { x: number; y: number; monitor_id: string; button: 'primary' };
  media_session_changed: MediaSession;
  widget_data_changed: { widget_id: Uuid; status: WidgetDataStatus; payload?: WeatherData | NewsData };
  animation_pause_changed: { widget_ids: Uuid[]; paused: boolean };
  day_changed: { date: DateIso };
  navigate_requested: { screen: ScreenId; params?: ScreenParams };
  exit_requested: { requires_confirmation: boolean };
  catalog_updated: { kinds: CatalogKind[] };
  preference_changed: { board_card_view: 'compact' | 'expanded'; origin: OriginKind };
}

export type EventName = keyof EventMap;

// ---------------------------------------------------------------------------
// 16. RPC de PostgreSQL (c.1)
// ---------------------------------------------------------------------------

/** Entidades que escribe `sync_push`; `profile` solo baja con `sync_pull`. */
export type SyncEntityKind =
  | 'user_preference' | 'kanban_column' | 'card' | 'label' | 'card_label' | 'uploaded_image'
  | 'theme' | 'applied_theme' | 'widget' | 'theme_widget' | 'widget_carousel_item';
export type SyncPullEntityKind = SyncEntityKind | 'profile';

export interface FieldChange { value: unknown; modified_at: Instant }

export interface SyncChange {
  change_id: number;
  entity_kind: SyncEntityKind;
  entity_id: Uuid;
  op: ChangeOp;
  modified_at: Instant;
  /** Vacío en `delete`. */
  fields: Record<string, FieldChange>;
}

/** RPC-02 */
export interface SyncPushParams {
  p_device_id: Uuid;
  p_clock_offset_ms: number;
  /** Hasta 200 cambios. */
  p_changes: SyncChange[];
}

export interface SyncRow {
  entity_kind: SyncPullEntityKind;
  entity_id: Uuid;
  fields: Record<string, unknown>;
  field_mods: Record<string, Instant>;
  deleted_at: Instant | null;
  updated_seq: number;
}

export type SyncChangeStatus = 'applied' | 'merged' | 'superseded' | 'deleted' | 'rejected';
export type SyncRejectReason =
  | 'not_owner' | 'incomplete_create' | 'unknown_entity' | 'parent_deleted'
  | 'duplicate_name' | 'duplicate_widget' | 'duplicate_role'
  | 'limit_columns' | 'limit_labels' | 'limit_themes' | 'applied_theme' | 'invalid_field';

export interface SyncChangeResult {
  change_id: number;
  status: SyncChangeStatus;
  conflict: boolean;
  reason?: SyncRejectReason;
  row?: SyncRow;
}

export interface SyncPushResult {
  server_now: Instant;
  results: SyncChangeResult[];
  max_seq: number;
}

/** RPC-03 */
export interface SyncPullParams { p_since_seq: number; p_limit?: number }
export interface SyncPullResult {
  server_now: Instant;
  rows: SyncRow[];
  next_seq: number;
  has_more: boolean;
}

/** RPC-04 */
export interface CatalogPullParams { p_known_version: number }
export interface CatalogTemplateRow {
  id: string; name: string; thumbnail_path: string; bundle_path: string; default_background_path: string;
  default_color_primary: Hex; default_color_secondary: Hex; default_color_text: Hex; default_font_id: string;
  is_default: boolean; sort_order: number; is_active: boolean; bundle_version: number;
}
export interface CatalogFontRow {
  id: string; family_name: string; display_name: string; file_path: string; license: string;
  sort_order: number; is_active: boolean;
}
export interface CatalogPaletteRow {
  id: string; name: string; color_primary: Hex; color_secondary: Hex; color_text: Hex;
  sort_order: number; is_active: boolean;
}
export interface CatalogImageRow {
  id: string; name: string; storage_path: string; thumbnail_path: string; width: number; height: number;
  sort_order: number; is_active: boolean;
}
export interface CatalogAnimationRow {
  id: string; name: string; storage_path: string; thumbnail_path: string; format: 'lottie' | 'webm';
  sort_order: number; is_active: boolean;
}
export interface CatalogColorRow { id: string; name: string; hex: Hex; sort_order: number; is_active: boolean }
export type CatalogPullResult =
  | { version: number; unchanged: true }
  | {
      version: number;
      unchanged: false;
      templates: CatalogTemplateRow[];
      fonts: CatalogFontRow[];
      palettes: CatalogPaletteRow[];
      images: CatalogImageRow[];
      animations: CatalogAnimationRow[];
      colors: CatalogColorRow[];
    };

/** RPC-05 (salida: boolean) y RPC-06 */
export interface EmailIsRegisteredParams { p_email: string }
export interface KeepaliveResult { ok: true; at: Instant }

/** Mensajes de error de las RPC (`message` de la respuesta HTTP 400). */
export type RpcErrorMessage =
  | 'unauthorized' | 'clock_out_of_range' | 'too_many_changes' | 'invalid_field' | 'invalid_limit' | 'invalid_email';
export interface RpcError { code: 'WG001' | 'WG401'; message: RpcErrorMessage; details: string | null; hint: string | null }

export interface RpcMap {
  server_time: { params: Record<string, never>; result: Instant };
  sync_push: { params: SyncPushParams; result: SyncPushResult };
  sync_pull: { params: SyncPullParams; result: SyncPullResult };
  catalog_pull: { params: CatalogPullParams; result: CatalogPullResult };
  email_is_registered: { params: EmailIsRegisteredParams; result: boolean };
  keepalive: { params: Record<string, never>; result: KeepaliveResult };
}

// ---------------------------------------------------------------------------
// 17. Edge Functions (c.2)
// ---------------------------------------------------------------------------

export interface EdgeError {
  error: { code: 'unauthorized' | 'invalid_request' | 'quota_exceeded' | 'provider_error' | 'timeout'; message: string };
}

/** EF-01 `windi-chat` */
export interface WindiChatContextCard {
  id: Uuid;
  type: CardType;
  title: string;
  due_date: DateIso;
  priority: Priority | null;
  column_id: Uuid;
  label_ids: Uuid[];
  completed_on: DateIso | null;
  scheduled_date: DateIso | null;
  scheduled_hour: Hour | null;
  description: string | null;
}
export interface WindiChatContext {
  alias: string;
  today: DateIso;
  now_hour: Hour;
  columns: Array<{ id: Uuid; name: string; role: ColumnRole }>;
  labels: Array<{ id: Uuid; name: string }>;
  /** Solo las tarjetas necesarias para la pregunta, incluidos los cambios aún no sincronizados (D-193). */
  cards: WindiChatContextCard[];
  totals: { total: number; overdue: number; pending: number; completed: number };
  active_proposal: WindiChatProposal | null;
}
export interface WindiChatRequest {
  client_request_id: Uuid;
  /** De 1 a 2000 caracteres. */
  message: string;
  /** Últimos 20 turnos. */
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  context: WindiChatContext;
}
export interface WindiChatProposal {
  action: ProposalAction;
  items: Array<{ card_id: Uuid | null; changes: Partial<Card> | null }>;
}
export interface WindiChatResponse {
  reply: string;
  intent: 'answer' | 'clarify' | 'propose' | 'out_of_scope';
  proposal: WindiChatProposal | null;
}

/** EF-02 `weather-geocode` */
export interface WeatherGeocodeRequest { query: string }
export interface GeocodeResult {
  geo_id: string; name: string; admin1: string | null; country: string; latitude: number; longitude: number;
}
export interface WeatherGeocodeResponse { results: GeocodeResult[] }

/** EF-03 `weather-current` */
export interface WeatherCurrentRequest { geo_id: string; latitude: number; longitude: number }
export interface WeatherCurrentResponse {
  geo_id: string;
  temperature_c: number;
  condition_code: string;
  condition_text: string;
  observed_at: Instant;
  cache: 'hit' | 'miss';
}

/** EF-04 `news-headlines` */
export interface NewsHeadlinesRequest { edition?: string }
export interface NewsHeadlinesResponse { headlines: Headline[]; fetched_at: Instant; cache: 'hit' | 'miss' }

export interface EdgeMap {
  'windi-chat': { request: WindiChatRequest; response: WindiChatResponse };
  'weather-geocode': { request: WeatherGeocodeRequest; response: WeatherGeocodeResponse };
  'weather-current': { request: WeatherCurrentRequest; response: WeatherCurrentResponse };
  'news-headlines': { request: NewsHeadlinesRequest; response: NewsHeadlinesResponse };
}

// ---------------------------------------------------------------------------
// 18. Integraciones externas (d): formas que lee el Núcleo
// ---------------------------------------------------------------------------

/** INT-01 Supabase Auth */
export interface AuthSignupRequest { email: string; password: string; data: { alias: string } }
export interface AuthVerifyRequest { type: 'signup' | 'recovery'; email: string; token: string }
export interface AuthPasswordGrantRequest { email: string; password: string }
export interface AuthPkceGrantRequest { auth_code: string; code_verifier: string }
export interface AuthSessionResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  refresh_token: string;
  user: { id: Uuid; email: string };
}
export interface AuthErrorResponse { code: number; error_code: string; msg: string }

/** Contenido de `%APPDATA%\Windgets\session.bin` (cifrado con DPAPI; INT-11). */
export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: Instant;
  user_id: Uuid;
}

/** INT-03 Gemini (solo lo que usa `windi-chat`) */
export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
}
export interface GeminiRequest {
  systemInstruction: { parts: GeminiPart[] };
  contents: Array<{ role: 'user' | 'model'; parts: GeminiPart[] }>;
  tools: Array<{ functionDeclarations: Array<{ name: string; description: string; parameters: Record<string, unknown> }> }>;
  toolConfig: { functionCallingConfig: { mode: 'AUTO' } };
  generationConfig: { temperature: number; maxOutputTokens: number };
}
export interface GeminiResponse {
  candidates: Array<{ content: { parts: GeminiPart[] } }>;
}

/** INT-04 Clima (Open-Meteo) */
export interface OpenMeteoGeocodingResponse {
  results?: Array<{ id: number; name: string; admin1?: string; country: string; latitude: number; longitude: number }>;
}
export interface OpenMeteoForecastResponse {
  current: { time: string; temperature_2m: number; weather_code: number };
}

/** INT-05 Noticias (GNews) */
export interface GNewsResponse {
  totalArticles: number;
  articles: Array<{ title: string; url: string; publishedAt: string; source: { name: string } }>;
}

/** INT-09 Supabase Storage */
export interface StorageUploadResponse { Key: string }

/** INT-12 GitHub Releases */
export interface GithubLatestRelease {
  tag_name: string;
  assets: Array<{ name: string; size: number; browser_download_url: string }>;
}
