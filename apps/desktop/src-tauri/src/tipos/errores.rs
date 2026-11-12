//! Errores (contratos.md, 1.3) (docs/tipos.ts, sección 2).

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ErrorCode {
    #[serde(rename = "net.offline")]
    NetOffline,
    #[serde(rename = "service.unavailable")]
    ServiceUnavailable,
    #[serde(rename = "internal.unexpected")]
    InternalUnexpected,
    #[serde(rename = "session.expired")]
    SessionExpired,
    #[serde(rename = "alias.required")]
    AliasRequired,
    #[serde(rename = "alias.too_long")]
    AliasTooLong,
    #[serde(rename = "email.required")]
    EmailRequired,
    #[serde(rename = "email.invalid")]
    EmailInvalid,
    #[serde(rename = "email.too_long")]
    EmailTooLong,
    #[serde(rename = "email.already_registered")]
    EmailAlreadyRegistered,
    #[serde(rename = "password.required")]
    PasswordRequired,
    #[serde(rename = "password.invalid")]
    PasswordInvalid,
    #[serde(rename = "password.same_as_current")]
    PasswordSameAsCurrent,
    #[serde(rename = "password_confirmation.required")]
    PasswordConfirmationRequired,
    #[serde(rename = "password_confirmation.mismatch")]
    PasswordConfirmationMismatch,
    #[serde(rename = "code.required")]
    CodeRequired,
    #[serde(rename = "code.incorrect")]
    CodeIncorrect,
    #[serde(rename = "code.expired")]
    CodeExpired,
    #[serde(rename = "code.resend_too_soon")]
    CodeResendTooSoon,
    #[serde(rename = "auth.rate_limited")]
    AuthRateLimited,
    #[serde(rename = "auth.invalid_credentials")]
    AuthInvalidCredentials,
    #[serde(rename = "title.required")]
    TitleRequired,
    #[serde(rename = "title.too_long")]
    TitleTooLong,
    #[serde(rename = "due_date.required")]
    DueDateRequired,
    #[serde(rename = "due_date.invalid")]
    DueDateInvalid,
    #[serde(rename = "due_date.in_past")]
    DueDateInPast,
    #[serde(rename = "description.too_long")]
    DescriptionTooLong,
    #[serde(rename = "labels.too_many")]
    LabelsTooMany,
    #[serde(rename = "labels.not_found")]
    LabelsNotFound,
    #[serde(rename = "card.not_found")]
    CardNotFound,
    #[serde(rename = "column.not_found")]
    ColumnNotFound,
    #[serde(rename = "time_block.past")]
    TimeBlockPast,
    #[serde(rename = "time_block.after_due_date")]
    TimeBlockAfterDueDate,
    #[serde(rename = "name.required")]
    NameRequired,
    #[serde(rename = "name.too_long")]
    NameTooLong,
    #[serde(rename = "name.duplicate")]
    NameDuplicate,
    #[serde(rename = "color.required")]
    ColorRequired,
    #[serde(rename = "color.invalid")]
    ColorInvalid,
    #[serde(rename = "label.limit_reached")]
    LabelLimitReached,
    #[serde(rename = "label.not_found")]
    LabelNotFound,
    #[serde(rename = "column.limit_reached")]
    ColumnLimitReached,
    #[serde(rename = "column.order_invalid")]
    ColumnOrderInvalid,
    #[serde(rename = "column.default_not_deletable")]
    ColumnDefaultNotDeletable,
    #[serde(rename = "range.start_required")]
    RangeStartRequired,
    #[serde(rename = "range.end_required")]
    RangeEndRequired,
    #[serde(rename = "range.invalid_date")]
    RangeInvalidDate,
    #[serde(rename = "range.start_after_end")]
    RangeStartAfterEnd,
    #[serde(rename = "range.too_long")]
    RangeTooLong,
    #[serde(rename = "draft.unsaved_changes")]
    DraftUnsavedChanges,
    #[serde(rename = "draft.unsaved_changes_on_apply")]
    DraftUnsavedChangesOnApply,
    #[serde(rename = "draft.no_changes")]
    DraftNoChanges,
    #[serde(rename = "theme.limit_reached")]
    ThemeLimitReached,
    #[serde(rename = "theme.already_applied")]
    ThemeAlreadyApplied,
    #[serde(rename = "theme.applied_not_deletable")]
    ThemeAppliedNotDeletable,
    #[serde(rename = "background.already_default")]
    BackgroundAlreadyDefault,
    #[serde(rename = "template.not_found")]
    TemplateNotFound,
    #[serde(rename = "font.not_found")]
    FontNotFound,
    #[serde(rename = "image.not_found")]
    ImageNotFound,
    #[serde(rename = "image.format_not_allowed")]
    ImageFormatNotAllowed,
    #[serde(rename = "image.too_large")]
    ImageTooLarge,
    #[serde(rename = "image.unreadable")]
    ImageUnreadable,
    #[serde(rename = "asset.unavailable")]
    AssetUnavailable,
    #[serde(rename = "widget.not_found")]
    WidgetNotFound,
    #[serde(rename = "widget.already_added")]
    WidgetAlreadyAdded,
    #[serde(rename = "widget.default_not_deletable")]
    WidgetDefaultNotDeletable,
    #[serde(rename = "city.not_found")]
    CityNotFound,
    #[serde(rename = "city.duplicate")]
    CityDuplicate,
    #[serde(rename = "city.too_long")]
    CityTooLong,
    #[serde(rename = "text.too_long")]
    TextTooLong,
    #[serde(rename = "carousel.too_few")]
    CarouselTooFew,
    #[serde(rename = "carousel.too_many")]
    CarouselTooMany,
    #[serde(rename = "interval.out_of_range")]
    IntervalOutOfRange,
    #[serde(rename = "interval.required")]
    IntervalRequired,
    #[serde(rename = "url.not_allowed")]
    UrlNotAllowed,
    #[serde(rename = "autostart.failed")]
    AutostartFailed,
    #[serde(rename = "media.no_session")]
    MediaNoSession,
    #[serde(rename = "media.action_unsupported")]
    MediaActionUnsupported,
    #[serde(rename = "message.too_long")]
    MessageTooLong,
    #[serde(rename = "windi.unavailable")]
    WindiUnavailable,
    #[serde(rename = "proposal.discarded")]
    ProposalDiscarded,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(untagged)]
pub enum ErrorParamsValue {
    Text(String),
    Number(i64),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[serde(transparent)]
pub struct ErrorParams(pub HashMap<String, ErrorParamsValue>);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub field: Option<String>,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<ErrorParams>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub struct ResultMessage {
    pub code: String,
    pub message: String,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub params: Option<ErrorParams>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[ts(rename = "Ok")]
pub struct IpcOk<T> {
    #[ts(type = "true")]
    pub ok: serde_json::Value,
    pub value: T,
    #[ts(optional)]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result_message: Option<ResultMessage>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[ts(rename = "Err")]
pub struct IpcErr {
    #[ts(type = "false")]
    pub ok: serde_json::Value,
    pub error: AppError,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
#[ts(rename = "Result")]
#[serde(untagged)]
pub enum IpcResult<T> {
    Ok(IpcOk<T>),
    Err(IpcErr),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "index.ts")]
pub enum ViewId {
    #[serde(rename = "P")]
    P,
    #[serde(rename = "C")]
    C,
    #[serde(rename = "E")]
    E,
}
