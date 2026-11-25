//! Servicio del planificador (arquitectura.md, vista 3a, Núcleo · servicios de negocio y datos locales).
//! Responsabilidad: «Reglas de tarjetas, etiquetas, columnas, bloques horarios, resumen del día y reportes.»
//!
//! Local primero (D-164, D-189): cada escritura se guarda en SQLite y encola su cambio pendiente en la misma
//! transacción; el envío a la nube llega con la sincronización (P10).

use std::collections::HashMap;

use chrono::NaiveDate;
use serde_json::{Map, Value, json};
use sqlx::Row;
use sqlx::sqlite::SqliteRow;

use crate::messages;
use crate::repositorios_y_archivos_locales::{BaseLocal, encolar_cambio};
use crate::servicio_de_sesion::{ConMensaje, Reloj, RelojDelSistema, instante};
use crate::tipos::{
    AgendaBlock, AgendaDay, AppError, BoardColumn, CalendarDay, CalendarDayCardsItem,
    CalendarMonth, CalendarMonthDay, CalendarMonthDayPreviewItem, CalendarWeek, CalendarWeekDay,
    CalendarWeekDayCardsItem, Card, CardAssignTimeBlockParams, CardCreateParams, CardDetail,
    CardDetailColumn, CardDetailLabelsItem, CardDetailTimeBlock, CardListBoardResult,
    CardMoveParams, CardSetCompletedParams, CardType, CardUnassignTimeBlockParams,
    CardUpdateParams, CatalogItem, Column, ColumnCreateParams, ColumnReorderParams, ColumnRole,
    ColumnUpdateParams, DateIso, ErrorCode, Hex, Hour, Instant, KanbanWidgetColumn,
    KanbanWidgetColumnTitlesItem, KanbanWidgetData, Label, LabelCreateParams, Placement,
    PlacementVariant1, PlacementVariant1Kind, PlannerItem, PlannerSummary, PlannerToday, Priority,
    ResultMessage, Uuid,
};

/// Clave para ordenar nombres de la A a la Z sin distinguir mayúsculas ni tildes (D-165): «Árbol» va con la A.
pub fn clave_alfabetica(nombre: &str) -> String {
    nombre
        .trim()
        .to_lowercase()
        .chars()
        .map(|c| match c {
            'á' | 'à' | 'ä' => 'a',
            'é' | 'è' | 'ë' => 'e',
            'í' | 'ì' | 'ï' => 'i',
            'ó' | 'ò' | 'ö' => 'o',
            'ú' | 'ù' | 'ü' => 'u',
            otra => otra,
        })
        .collect()
}

/// Título: de 1 a 100 caracteres (HE-07-HU01-ET06).
pub const TITULO_MAX: usize = 100;
/// Descripción: hasta 1000 caracteres (HE-07-HU01-ET10, D-026).
pub const DESCRIPCION_MAX: usize = 1000;
/// Etiquetas por tarjeta (HE-07-HU02-ET04).
pub const ETIQUETAS_MAX: usize = 5;
/// Nombre de etiqueta: de 1 a 30 caracteres (HE-08-HU02-ET03).
pub const NOMBRE_DE_ETIQUETA_MAX: usize = 30;
/// Etiquetas por usuario (HE-08-HU02-ET06).
pub const ETIQUETAS_POR_USUARIO_MAX: i64 = 20;
/// Nombre de columna: de 1 a 30 caracteres (HE-09-HU03-ET03).
pub const NOMBRE_DE_COLUMNA_MAX: usize = 30;
/// Columnas del tablero, contadas las tres por defecto (HE-09-HU03-ET07, D-167).
pub const COLUMNAS_MAX: usize = 10;
/// Distancia entre posiciones al poner una tarjeta al final de una columna. DUDA: HE-07-HU01 el paso no está
/// definido; se usa el del ejemplo de `contratos.md` (RPC-02, `position: 1024`).
pub const PASO_DE_POSICION: f64 = 1024.0;
/// Títulos que muestra cada columna del widget Kanban; el resto va en «+N más» (HE-06-HU05-ET02).
pub const TITULOS_DEL_WIDGET_KANBAN: usize = 5;
/// Títulos que muestra cada día de la vista mensual; el resto va en «+N más» (HE-10-HU01-ET05).
pub const TITULOS_POR_DIA_DEL_MES: usize = 3;

/// Fecha y hora del computador. La fecha es la local: «no puede ser anterior a la fecha actual» (ET08).
pub trait Calendario: Send + Sync {
    fn hoy(&self) -> NaiveDate;
    fn ahora_ms(&self) -> i64;
    /// Hora local del computador, de 0 a 23 (agenda diaria, HE-11-HU01-ET01).
    fn hora(&self) -> u8;
}

/// El calendario del sistema.
pub struct CalendarioDelSistema;

impl Calendario for CalendarioDelSistema {
    fn hoy(&self) -> NaiveDate {
        chrono::Local::now().date_naive()
    }

    fn ahora_ms(&self) -> i64 {
        RelojDelSistema.ahora_ms()
    }

    fn hora(&self) -> u8 {
        u8::try_from(chrono::Timelike::hour(&chrono::Local::now())).unwrap_or(0)
    }
}

/// EV-22 `day_changed` (HE-06-HU02-ET04; HE-10-HU05-ET09): recuerda el día local y avisa una vez cuando la hora
/// del computador pasa a las 00:00, para que el widget Tareas del día muestre las tarjetas del nuevo día.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VigiaDelDia {
    ultimo: NaiveDate,
}

impl VigiaDelDia {
    pub fn nuevo(hoy: NaiveDate) -> Self {
        Self { ultimo: hoy }
    }

    /// El día nuevo si cambió desde la última revisión; `None` si sigue siendo el mismo. También avisa si el reloj
    /// del computador retrocede a otro día.
    pub fn revisar(&mut self, hoy: NaiveDate) -> Option<DateIso> {
        if hoy == self.ultimo {
            return None;
        }
        self.ultimo = hoy;
        Some(DateIso(hoy.format("%Y-%m-%d").to_string()))
    }
}

pub(crate) fn error(code: ErrorCode, message: &str, field: Option<&str>) -> AppError {
    AppError {
        code,
        message: message.to_string(),
        field: field.map(str::to_string),
        params: None,
    }
}

pub(crate) fn inesperado() -> AppError {
    error(ErrorCode::InternalUnexpected, "", None)
}

/// El color de columna elegido ya no está en el catálogo (RD-85).
fn color_no_disponible() -> AppError {
    error(
        ErrorCode::ColorInvalid,
        messages::COLOR_NO_DISPONIBLE,
        Some("color_id"),
    )
}

/// La vista solo ofrece colores del catálogo (HE-08-HU02-ET05): uno que no está cuenta como sin color, y uno que
/// el catálogo desactivó con la ventana abierta se dice así (RD-85).
pub(crate) async fn comprobar_color_de_etiqueta(
    tx: &mut sqlx::SqliteConnection,
    color: &str,
) -> Result<(), AppError> {
    let activo: Option<bool> =
        sqlx::query_scalar("SELECT is_active FROM catalog_color WHERE id = ?")
            .bind(color)
            .fetch_optional(tx)
            .await
            .map_err(de_sqlx)?;
    match activo {
        Some(true) => Ok(()),
        Some(false) => Err(color_no_disponible()),
        None => Err(error(
            ErrorCode::ColorRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("color_id"),
        )),
    }
}

pub(crate) fn de_sqlx(_: sqlx::Error) -> AppError {
    inesperado()
}

pub(crate) fn resultado(code: &str, message: &str) -> ResultMessage {
    ResultMessage {
        code: code.to_string(),
        message: message.to_string(),
        params: None,
    }
}

/// Un campo vacío o formado solo por espacios (HE-07-HU01-ET07; RT-04-ET21).
fn vacio(valor: &str) -> bool {
    valor.trim().is_empty()
}

/// Nombre de columna (HE-09-HU03-ET03; HE-09-HU04-ET03, ET09): obligatorio, de 1 a 30 caracteres.
pub fn validar_nombre_de_columna(nombre: &str) -> Option<AppError> {
    if vacio(nombre) {
        return Some(error(
            ErrorCode::NameRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("name"),
        ));
    }
    if nombre.trim().chars().count() > NOMBRE_DE_COLUMNA_MAX {
        return Some(error(
            ErrorCode::NameTooLong,
            messages::NOMBRE_DE_COLUMNA_MUY_LARGO,
            Some("name"),
        ));
    }
    None
}

/// Título (HE-07-HU01-ET06, ET07): obligatorio, de 1 a 100 caracteres; solo espacios cuenta como vacío.
pub fn validar_titulo(titulo: &str) -> Option<AppError> {
    if vacio(titulo) {
        return Some(error(
            ErrorCode::TitleRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("title"),
        ));
    }
    (titulo.trim().chars().count() > TITULO_MAX).then(|| {
        error(
            ErrorCode::TitleTooLong,
            messages::TITULO_MUY_LARGO,
            Some("title"),
        )
    })
}

/// Fecha `AAAA-MM-DD` que existe en el calendario (DateIso, contratos.md). La vista convierte DD/MM/AAAA.
pub fn fecha(valor: &str) -> Option<NaiveDate> {
    let valor = valor.trim();
    (valor.len() == 10)
        .then(|| NaiveDate::parse_from_str(valor, "%Y-%m-%d").ok())
        .flatten()
}

/// Fecha límite (HE-07-HU01-ET08, ET09): obligatoria, una fecha que existe y no anterior a hoy.
pub fn validar_fecha_limite(valor: &str, hoy: NaiveDate) -> Option<AppError> {
    if vacio(valor) {
        return Some(error(
            ErrorCode::DueDateRequired,
            messages::CAMPO_OBLIGATORIO,
            Some("due_date"),
        ));
    }
    match fecha(valor) {
        None => Some(error(
            ErrorCode::DueDateInvalid,
            messages::FECHA_INVALIDA,
            Some("due_date"),
        )),
        Some(dia) if dia < hoy => Some(error(
            ErrorCode::DueDateInPast,
            messages::FECHA_LIMITE_ANTERIOR_A_HOY,
            Some("due_date"),
        )),
        Some(_) => None,
    }
}

/// Descripción (HE-07-HU01-ET10): opcional, hasta 1000 caracteres.
pub fn validar_descripcion(descripcion: Option<&str>) -> Option<AppError> {
    descripcion
        .is_some_and(|d| d.chars().count() > DESCRIPCION_MAX)
        .then(|| {
            error(
                ErrorCode::DescriptionTooLong,
                messages::DESCRIPCION_MUY_LARGA,
                Some("description"),
            )
        })
}

/// RD-92: la columna se eliminó en otro computador.
fn columna_no_existe() -> AppError {
    error(ErrorCode::ColumnNotFound, messages::COLUMNA_NO_EXISTE, None)
}

/// RD-92: la etiqueta se eliminó en otro computador.
fn etiqueta_no_existe() -> AppError {
    error(ErrorCode::LabelNotFound, messages::ETIQUETA_NO_EXISTE, None)
}

/// RD-92: una etiqueta elegida en el Formulario de tarjeta se eliminó en otro computador (campo Etiquetas).
fn etiqueta_de_la_tarjeta_no_existe() -> AppError {
    error(
        ErrorCode::LabelsNotFound,
        messages::ETIQUETA_NO_EXISTE,
        Some("label_ids"),
    )
}

/// Etiquetas (HE-07-HU02-ET04): máximo 5 por tarjeta. Que existan se comprueba contra la base.
pub fn validar_cantidad_de_etiquetas(etiquetas: &[Uuid]) -> Option<AppError> {
    (etiquetas.len() > ETIQUETAS_MAX).then(|| {
        error(
            ErrorCode::LabelsTooMany,
            messages::MAXIMO_ETIQUETAS,
            Some("label_ids"),
        )
    })
}

/// Reglas del Formulario de tarjeta en modo creación, en el orden de los campos (HE-07-HU01-ET05 a ET12).
/// El tipo no se valida aquí: llega como `CardType` y, si falta, es «Tarea» (ET05).
pub fn validar_creacion(params: &CardCreateParams, hoy: NaiveDate) -> Vec<AppError> {
    [
        validar_titulo(&params.title),
        validar_fecha_limite(&params.due_date.0, hoy),
        validar_descripcion(params.description.as_deref()),
        params
            .label_ids
            .as_deref()
            .and_then(validar_cantidad_de_etiquetas),
    ]
    .into_iter()
    .flatten()
    .collect()
}

fn tipo_en_texto(tipo: &CardType) -> &'static str {
    match tipo {
        CardType::Task => "task",
        CardType::Reminder => "reminder",
        CardType::Event => "event",
    }
}

fn tipo_de_texto(texto: &str) -> CardType {
    match texto {
        "reminder" => CardType::Reminder,
        "event" => CardType::Event,
        _ => CardType::Task,
    }
}

fn prioridad_en_texto(prioridad: &Priority) -> &'static str {
    match prioridad {
        Priority::High => "high",
        Priority::Medium => "medium",
        Priority::Low => "low",
    }
}

fn prioridad_de_texto(texto: &str) -> Option<Priority> {
    match texto {
        "high" => Some(Priority::High),
        "medium" => Some(Priority::Medium),
        "low" => Some(Priority::Low),
        _ => None,
    }
}

/// `card_label.id`: UUID v5 determinista de la pareja `card_id:label_id` (datos.md, «Identificadores»).
/// DUDA: HE-07-HU01 el espacio de nombres del UUID v5 no está definido; se usa `NAMESPACE_OID`.
pub fn id_de_card_label(card_id: &str, label_id: &str) -> String {
    uuid::Uuid::new_v5(
        &uuid::Uuid::NAMESPACE_OID,
        format!("{card_id}:{label_id}").as_bytes(),
    )
    .to_string()
}

/// Campos de un cambio pendiente con la misma hora (datos.md, «Grupos atómicos»).
pub(crate) fn campos(valores: &[(&str, Value)], ahora: &str) -> (Value, Value) {
    let mut fields = Map::new();
    let mut mods = Map::new();
    for (campo, valor) in valores {
        fields.insert(
            (*campo).to_string(),
            json!({ "value": valor, "modified_at": ahora }),
        );
        mods.insert((*campo).to_string(), Value::from(ahora));
    }
    (Value::Object(fields), Value::Object(mods))
}

/// Servicio del planificador sobre la base local.
pub struct ServicioDelPlanificador<C> {
    base: BaseLocal,
    calendario: C,
}

impl<C: Calendario> ServicioDelPlanificador<C> {
    pub fn nuevo(base: BaseLocal, calendario: C) -> Self {
        Self { base, calendario }
    }

    /// La fecha de hoy del computador.
    pub fn hoy(&self) -> chrono::NaiveDate {
        self.calendario.hoy()
    }

    /// El calendario del servicio, para que una prueba adelante el día (HE-14-HU03-ET13).
    #[cfg(test)]
    pub(crate) fn calendario(&self) -> &C {
        &self.calendario
    }

    pub fn base(&self) -> &BaseLocal {
        &self.base
    }

    /// IPC-CARD-01 `card_create` (HE-07-HU01): crea la tarjeta al final de la columna Por hacer (ET13), con sus
    /// etiquetas, y encola los cambios en la misma transacción (ET24). Funciona igual sin conexión (CA12).
    pub async fn crear_tarjeta(
        &self,
        user_id: &str,
        params: CardCreateParams,
    ) -> Result<ConMensaje<Card>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let id = self.crear_tarjeta_en(&mut tx, user_id, params).await?;
        tx.commit().await.map_err(de_sqlx)?;
        let tarjeta = self.tarjeta(user_id, &id).await?.ok_or_else(inesperado)?;
        Ok(ConMensaje {
            valor: tarjeta,
            mensaje: resultado("card_create", messages::TARJETA_CREADA),
        })
    }

    /// Las validaciones y escrituras de `card_create` sobre una conexión ya abierta, para que Windi aplique una
    /// propuesta completa o nada (HE-14-HU03-ET12). Devuelve el id de la tarjeta creada.
    pub(crate) async fn crear_tarjeta_en(
        &self,
        tx: &mut sqlx::SqliteConnection,
        user_id: &str,
        params: CardCreateParams,
    ) -> Result<String, AppError> {
        let hoy = self.calendario.hoy();
        if let Some(primero) = validar_creacion(&params, hoy).into_iter().next() {
            return Err(primero);
        }

        // La columna Por hacer llega con la primera descarga de la cuenta (sync_pull): sin ella no hay dónde crear
        // la tarjeta y se dice así (docs/rediseno.md RD-84).
        let columna: String =
            sqlx::query_scalar("SELECT id FROM kanban_column WHERE user_id = ? AND role = 'todo'")
                .bind(user_id)
                .fetch_optional(&mut *tx)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(|| {
                    error(
                        ErrorCode::ColumnNotFound,
                        messages::TABLERO_NO_DESCARGADO,
                        None,
                    )
                })?;

        let etiquetas: Vec<String> = params
            .label_ids
            .unwrap_or_default()
            .into_iter()
            .map(|u| u.0.to_lowercase())
            .fold(Vec::new(), |mut v, e| {
                if !v.contains(&e) {
                    v.push(e);
                }
                v
            });
        for etiqueta in &etiquetas {
            let existe: i64 =
                sqlx::query_scalar("SELECT count(*) FROM label WHERE id = ? AND user_id = ?")
                    .bind(etiqueta)
                    .bind(user_id)
                    .fetch_one(&mut *tx)
                    .await
                    .map_err(de_sqlx)?;
            if existe == 0 {
                // Sin texto: la vista solo ofrece etiquetas existentes (HE-07-HU02-ET03).
                return Err(etiqueta_de_la_tarjeta_no_existe());
            }
        }

        let ultima: Option<f64> = sqlx::query_scalar(
            "SELECT max(position) FROM card WHERE user_id = ? AND column_id = ?",
        )
        .bind(user_id)
        .bind(&columna)
        .fetch_one(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        let posicion = ultima.unwrap_or(0.0) + PASO_DE_POSICION;

        let id = uuid::Uuid::new_v4().to_string();
        let tipo = params.r#type.unwrap_or(CardType::Task);
        let titulo = params.title.trim().to_string();
        let fecha_limite = params.due_date.0.trim().to_string();
        // Una descripción vacía es una tarjeta sin descripción (ET10: el campo es opcional).
        let descripcion = params.description.filter(|d| !vacio(d));
        let prioridad = params.priority.as_ref().map(prioridad_en_texto);
        let ahora = instante(self.calendario.ahora_ms()).0;

        let (fields, mods) = campos(
            &[
                ("type", Value::from(tipo_en_texto(&tipo))),
                ("title", Value::from(titulo.as_str())),
                ("description", json!(descripcion)),
                ("priority", json!(prioridad)),
                ("due_date", Value::from(fecha_limite.as_str())),
                ("column_id", Value::from(columna.as_str())),
                ("position", json!(posicion)),
            ],
            &ahora,
        );
        sqlx::query(
            "INSERT INTO card (id, user_id, created_at, field_mods, type, title, description, priority, \
             due_date, column_id, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&id)
        .bind(user_id)
        .bind(&ahora)
        .bind(mods.to_string())
        .bind(tipo_en_texto(&tipo))
        .bind(&titulo)
        .bind(&descripcion)
        .bind(prioridad)
        .bind(&fecha_limite)
        .bind(&columna)
        .bind(posicion)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut *tx, "card", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;

        for etiqueta in &etiquetas {
            let union = id_de_card_label(&id, etiqueta);
            let (fields, mods) = campos(
                &[
                    ("card_id", Value::from(id.as_str())),
                    ("label_id", Value::from(etiqueta.as_str())),
                ],
                &ahora,
            );
            sqlx::query(
                "INSERT INTO card_label (id, user_id, created_at, field_mods, card_id, label_id) \
                 VALUES (?, ?, ?, ?, ?, ?)",
            )
            .bind(&union)
            .bind(user_id)
            .bind(&ahora)
            .bind(mods.to_string())
            .bind(&id)
            .bind(etiqueta)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            encolar_cambio(&mut *tx, "card_label", &union, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        Ok(id)
    }

    /// IPC-CARD-02 `card_update` (HE-07-HU04). Mismas reglas de campos que al crear (ET04); la fecha límite
    /// solo se compara con hoy si cambió (ET08). Si la nueva fecha límite queda antes del día del bloque
    /// horario, lo quita (ET12, ET13) y el mensaje lo dice (ET15). Si la tarjeta ya no existe, no guarda
    /// (ET20): `card.not_found`.
    pub async fn actualizar_tarjeta(
        &self,
        user_id: &str,
        params: CardUpdateParams,
    ) -> Result<ConMensaje<Card>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let (id, sale_del_bloque) = self.actualizar_tarjeta_en(&mut tx, user_id, params).await?;
        tx.commit().await.map_err(de_sqlx)?;
        let tarjeta = self
            .tarjeta(user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        let mensaje = if sale_del_bloque {
            messages::TARJETA_ACTUALIZADA_SIN_BLOQUE
        } else {
            messages::TARJETA_ACTUALIZADA
        };
        Ok(ConMensaje {
            valor: tarjeta,
            mensaje: resultado("card_update", mensaje),
        })
    }

    /// Las validaciones y escrituras de `card_update` sobre una conexión ya abierta (HE-14-HU03-ET12). Devuelve el
    /// id de la tarjeta y si salió de su bloque horario (ET12, ET13).
    pub(crate) async fn actualizar_tarjeta_en(
        &self,
        tx: &mut sqlx::SqliteConnection,
        user_id: &str,
        params: CardUpdateParams,
    ) -> Result<(String, bool), AppError> {
        let id = params.id.0.to_lowercase();
        let actual = self
            .tarjeta_en(&mut *tx, user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        let patch = params.patch;
        let hoy = self.calendario.hoy();

        let fecha_cambia = patch
            .due_date
            .as_ref()
            .is_some_and(|f| f.0.trim() != actual.due_date.0);
        let errores = [
            patch.title.as_deref().and_then(validar_titulo),
            patch
                .due_date
                .as_ref()
                .filter(|_| fecha_cambia)
                .and_then(|f| validar_fecha_limite(&f.0, hoy)),
            patch
                .description
                .as_ref()
                .and_then(|d| validar_descripcion(d.as_deref())),
            patch
                .label_ids
                .as_deref()
                .and_then(validar_cantidad_de_etiquetas),
        ];
        if let Some(primero) = errores.into_iter().flatten().next() {
            return Err(primero);
        }

        let ahora = instante(self.calendario.ahora_ms()).0;
        let mut valores: Vec<(&str, Value)> = Vec::new();
        if let Some(tipo) = &patch.r#type {
            valores.push(("type", Value::from(tipo_en_texto(tipo))));
        }
        if let Some(titulo) = &patch.title {
            valores.push(("title", Value::from(titulo.trim())));
        }
        let fecha_limite = patch
            .due_date
            .as_ref()
            .filter(|_| fecha_cambia)
            .map(|f| f.0.trim().to_string());
        if let Some(f) = &fecha_limite {
            valores.push(("due_date", Value::from(f.as_str())));
        }
        if let Some(descripcion) = &patch.description {
            let d = descripcion.as_ref().filter(|d| !vacio(d));
            valores.push(("description", json!(d)));
        }
        if let Some(prioridad) = &patch.priority {
            valores.push((
                "priority",
                json!(prioridad.as_ref().map(prioridad_en_texto)),
            ));
        }
        // ET12, ET13: el bloque horario no puede quedar después de la nueva fecha límite.
        let sale_del_bloque = match (&fecha_limite, &actual.scheduled_date) {
            (Some(nueva), Some(bloque)) => bloque.0.as_str() > nueva.as_str(),
            _ => false,
        };
        if sale_del_bloque {
            valores.push(("scheduled_date", Value::Null));
            valores.push(("scheduled_hour", Value::Null));
        }

        if !valores.is_empty() {
            let (fields, mods) = campos(&valores, &ahora);
            let asignaciones: Vec<String> =
                valores.iter().map(|(c, _)| format!("{c} = ?")).collect();
            let sql = format!(
                "UPDATE card SET {}, field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?",
                asignaciones.join(", ")
            );
            let mut consulta = sqlx::query(&sql);
            for (_, valor) in &valores {
                consulta = match valor {
                    Value::Null => consulta.bind(None::<String>),
                    Value::String(s) => consulta.bind(s.clone()),
                    otro => consulta.bind(otro.to_string()),
                };
            }
            consulta
                .bind(mods.to_string())
                .bind(&id)
                .bind(user_id)
                .execute(&mut *tx)
                .await
                .map_err(de_sqlx)?;
            encolar_cambio(&mut *tx, "card", &id, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }

        if let Some(nuevas) = patch.label_ids {
            let nuevas: Vec<String> = nuevas.into_iter().fold(Vec::new(), |mut v, u| {
                let e = u.0.to_lowercase();
                if !v.contains(&e) {
                    v.push(e);
                }
                v
            });
            for etiqueta in &nuevas {
                let existe: i64 =
                    sqlx::query_scalar("SELECT count(*) FROM label WHERE id = ? AND user_id = ?")
                        .bind(etiqueta)
                        .bind(user_id)
                        .fetch_one(&mut *tx)
                        .await
                        .map_err(de_sqlx)?;
                if existe == 0 {
                    return Err(etiqueta_de_la_tarjeta_no_existe());
                }
            }
            let actuales: Vec<String> = actual.label_ids.iter().map(|u| u.0.clone()).collect();
            for quitada in actuales.iter().filter(|e| !nuevas.contains(e)) {
                let union = id_de_card_label(&id, quitada);
                sqlx::query("DELETE FROM card_label WHERE card_id = ? AND label_id = ?")
                    .bind(&id)
                    .bind(quitada)
                    .execute(&mut *tx)
                    .await
                    .map_err(de_sqlx)?;
                encolar_cambio(
                    &mut *tx,
                    "card_label",
                    &union,
                    "delete",
                    &Value::Null,
                    &ahora,
                )
                .await
                .map_err(de_sqlx)?;
            }
            for agregada in nuevas.iter().filter(|e| !actuales.contains(e)) {
                let union = id_de_card_label(&id, agregada);
                let (fields, mods) = campos(
                    &[
                        ("card_id", Value::from(id.as_str())),
                        ("label_id", Value::from(agregada.as_str())),
                    ],
                    &ahora,
                );
                sqlx::query(
                    "INSERT INTO card_label (id, user_id, created_at, field_mods, card_id, label_id) \
                     VALUES (?, ?, ?, ?, ?, ?)",
                )
                .bind(&union)
                .bind(user_id)
                .bind(&ahora)
                .bind(mods.to_string())
                .bind(&id)
                .bind(agregada)
                .execute(&mut *tx)
                .await
                .map_err(de_sqlx)?;
                encolar_cambio(&mut *tx, "card_label", &union, "upsert", &fields, &ahora)
                    .await
                    .map_err(de_sqlx)?;
            }
        }
        Ok((id, sale_del_bloque))
    }

    /// IPC-CARD-03 `card_delete` (HE-07-HU05): elimina la tarjeta de forma definitiva (ET03) con sus etiquetas
    /// de tarjeta, y encola las eliminaciones en la misma transacción. Si ya no existe: `card.not_found`
    /// (DP-04).
    pub async fn eliminar_tarjeta(
        &self,
        user_id: &str,
        id: &str,
    ) -> Result<ConMensaje<()>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        self.eliminar_tarjeta_en(&mut tx, user_id, id).await?;
        tx.commit().await.map_err(de_sqlx)?;
        Ok(ConMensaje {
            valor: (),
            mensaje: resultado("card_delete", messages::TARJETA_ELIMINADA),
        })
    }

    /// Las escrituras de `card_delete` sobre una conexión ya abierta (HE-14-HU03-ET12).
    pub(crate) async fn eliminar_tarjeta_en(
        &self,
        tx: &mut sqlx::SqliteConnection,
        user_id: &str,
        id: &str,
    ) -> Result<(), AppError> {
        let id = id.to_lowercase();
        let uniones: Vec<String> = sqlx::query_scalar(
            "SELECT cl.id FROM card_label cl JOIN card c ON c.id = cl.card_id \
             WHERE cl.card_id = ? AND c.user_id = ?",
        )
        .bind(&id)
        .bind(user_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        let borradas = sqlx::query("DELETE FROM card WHERE id = ? AND user_id = ?")
            .bind(&id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?
            .rows_affected();
        if borradas == 0 {
            return Err(tarjeta_no_existe());
        }
        let ahora = instante(self.calendario.ahora_ms()).0;
        // Las etiquetas de la tarjeta se borran en cascada (sqlite_esquema.sql); sus cambios pendientes pasan a
        // eliminación para no enviar altas de una tarjeta que ya no existe.
        for union in &uniones {
            encolar_cambio(
                &mut *tx,
                "card_label",
                union,
                "delete",
                &Value::Null,
                &ahora,
            )
            .await
            .map_err(de_sqlx)?;
        }
        encolar_cambio(&mut *tx, "card", &id, "delete", &Value::Null, &ahora)
            .await
            .map_err(de_sqlx)?;
        Ok(())
    }

    /// IPC-CARD-06 `card_move` (HE-09-HU02): cambia la tarjeta de columna o de posición. `end` la pone al final
    /// de la columna («Mover a», ET12); `before` la pone antes de otra tarjeta (drag-and-drop, ET01, ET08).
    /// Al llegar a Hecho queda completada con la fecha de hoy y recuerda su columna anterior (ET04 a ET06); al
    /// salir de Hecho se borra la fecha de completado (ET07).
    pub async fn mover_tarjeta(
        &self,
        user_id: &str,
        params: CardMoveParams,
    ) -> Result<Card, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let id = self.mover_tarjeta_en(&mut tx, user_id, params).await?;
        tx.commit().await.map_err(de_sqlx)?;
        self.tarjeta(user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)
    }

    /// Las escrituras de `card_move` sobre una conexión ya abierta (HE-14-HU03-ET12). Devuelve el id.
    pub(crate) async fn mover_tarjeta_en(
        &self,
        tx: &mut sqlx::SqliteConnection,
        user_id: &str,
        params: CardMoveParams,
    ) -> Result<String, AppError> {
        let id = params.card_id.0.to_lowercase();
        let destino = params.column_id.0.to_lowercase();
        let origen: Option<(String, String)> = sqlx::query_as(
            "SELECT c.column_id, k.role FROM card c JOIN kanban_column k ON k.id = c.column_id \
             WHERE c.id = ? AND c.user_id = ?",
        )
        .bind(&id)
        .bind(user_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        let (columna_origen, rol_origen) = origen.ok_or_else(tarjeta_no_existe)?;
        let rol_destino: String =
            sqlx::query_scalar("SELECT role FROM kanban_column WHERE id = ? AND user_id = ?")
                .bind(&destino)
                .bind(user_id)
                .fetch_optional(&mut *tx)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(columna_no_existe)?;

        // Posiciones de las demás tarjetas de la columna de destino.
        let otras: Vec<(String, f64)> = sqlx::query_as(
            "SELECT id, position FROM card WHERE user_id = ? AND column_id = ? AND id <> ? \
             ORDER BY position, created_at",
        )
        .bind(user_id)
        .bind(&destino)
        .bind(&id)
        .fetch_all(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        let al_final = || otras.last().map_or(0.0, |(_, p)| *p) + PASO_DE_POSICION;
        let posicion = match &params.placement {
            Placement::Variant2(antes) => {
                let objetivo = antes.card_id.0.to_lowercase();
                match otras.iter().position(|(o, _)| *o == objetivo) {
                    Some(i) => {
                        let siguiente = otras[i].1;
                        let anterior = i
                            .checked_sub(1)
                            .map_or(siguiente - PASO_DE_POSICION, |j| otras[j].1);
                        (anterior + siguiente) / 2.0
                    }
                    // La tarjeta de referencia ya no está en esa columna: al final.
                    None => al_final(),
                }
            }
            Placement::Variant1(_) => al_final(),
        };

        let ahora = instante(self.calendario.ahora_ms()).0;
        let mut valores: Vec<(&str, Value)> = vec![("position", json!(posicion))];
        if destino != columna_origen {
            valores.push(("column_id", Value::from(destino.as_str())));
        }
        let llega_a_hecho = rol_destino == "done" && rol_origen != "done";
        let sale_de_hecho = rol_origen == "done" && rol_destino != "done";
        if llega_a_hecho {
            let hoy = self.calendario.hoy().format("%Y-%m-%d").to_string();
            valores.push(("completed_on", Value::from(hoy)));
            valores.push(("previous_column_id", Value::from(columna_origen.as_str())));
        }
        if sale_de_hecho {
            valores.push(("completed_on", Value::Null));
        }
        let (fields, mods) = campos(&valores, &ahora);
        let asignaciones: Vec<String> = valores.iter().map(|(c, _)| format!("{c} = ?")).collect();
        let sql = format!(
            "UPDATE card SET {}, field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?",
            asignaciones.join(", ")
        );
        let mut consulta = sqlx::query(&sql);
        for (_, valor) in &valores {
            consulta = match valor {
                Value::Null => consulta.bind(None::<String>),
                Value::String(s) => consulta.bind(s.clone()),
                otro => consulta.bind(otro.as_f64()),
            };
        }
        consulta
            .bind(mods.to_string())
            .bind(&id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
        encolar_cambio(&mut *tx, "card", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        Ok(id)
    }

    /// IPC-CARD-07 `card_set_completed` (HE-12-HU02; HE-06-HU03). Marcar la casilla mueve la tarjeta al final
    /// de la columna Hecho (ET02); desmarcarla la devuelve a la columna en la que estaba antes de Hecho (ET03) o,
    /// si esa columna ya no existe, a Por hacer (ET04; HE-06-HU03-ET02). Usa las mismas reglas de `card_move`:
    /// `completed_on`, `previous_column_id` y la cola de sincronización. Solo al marcar hay mensaje (ET07). Si la
    /// casilla ya estaba así, no cambia nada.
    pub async fn marcar_completada(
        &self,
        user_id: &str,
        params: CardSetCompletedParams,
    ) -> Result<(Card, Option<ResultMessage>), AppError> {
        let id = params.card_id.0.to_lowercase();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let (rol, anterior): (String, Option<String>) = sqlx::query_as(
            "SELECT k.role, c.previous_column_id FROM card c JOIN kanban_column k ON k.id = c.column_id \
             WHERE c.id = ? AND c.user_id = ?",
        )
        .bind(&id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?
        .ok_or_else(tarjeta_no_existe)?;
        if params.completed == (rol == "done") {
            let tarjeta = self
                .tarjeta(user_id, &id)
                .await?
                .ok_or_else(tarjeta_no_existe)?;
            return Ok((tarjeta, None));
        }
        let por_rol = |rol: &'static str| {
            sqlx::query_scalar::<_, String>(
                "SELECT id FROM kanban_column WHERE user_id = ? AND role = ?",
            )
            .bind(user_id)
            .bind(rol)
            .fetch_optional(pool)
        };
        let destino = if params.completed {
            por_rol("done").await.map_err(de_sqlx)?
        } else {
            let vigente = match anterior {
                Some(anterior) => sqlx::query_scalar::<_, String>(
                    "SELECT id FROM kanban_column WHERE id = ? AND user_id = ? AND role <> 'done'",
                )
                .bind(anterior.to_lowercase())
                .bind(user_id)
                .fetch_optional(pool)
                .await
                .map_err(de_sqlx)?,
                None => None,
            };
            match vigente {
                Some(columna) => Some(columna),
                None => por_rol("todo").await.map_err(de_sqlx)?,
            }
        }
        // La semilla de la cuenta siempre trae Por hacer y Hecho (datos.md, Modelo · 9).
        .ok_or_else(inesperado)?;
        let tarjeta = self
            .mover_tarjeta(
                user_id,
                CardMoveParams {
                    card_id: Uuid(id),
                    column_id: Uuid(destino),
                    placement: Placement::Variant1(PlacementVariant1 {
                        kind: PlacementVariant1Kind::End,
                    }),
                },
            )
            .await?;
        let mensaje = params
            .completed
            .then(|| resultado("card_set_completed", messages::TARJETA_COMPLETADA));
        Ok((tarjeta, mensaje))
    }

    /// IPC-LABEL-01 `label_list`: las etiquetas del usuario en orden alfabético por nombre, de la A a la Z
    /// (D-165). El Formulario de tarjeta solo ofrece estas (HE-07-HU02-ET03).
    pub async fn etiquetas(&self, user_id: &str) -> Result<Vec<Label>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT l.id, l.name, l.color_id, c.hex, \
             (SELECT count(*) FROM card_label cl WHERE cl.label_id = l.id) AS card_count \
             FROM label l JOIN catalog_color c ON c.id = l.color_id WHERE l.user_id = ?",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let mut etiquetas = filas
            .into_iter()
            .map(|f| {
                Ok(Label {
                    id: Uuid(f.try_get("id")?),
                    name: f.try_get("name")?,
                    color_id: f.try_get("color_id")?,
                    color_hex: Hex(f.try_get("hex")?),
                    card_count: f.try_get("card_count")?,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)?;
        etiquetas.sort_by_cached_key(|e| clave_alfabetica(&e.name));
        Ok(etiquetas)
    }

    /// IPC-LABEL-02 `label_create` (HE-08-HU02). Nombre obligatorio de 1 a 30 caracteres (ET03), único sin
    /// distinguir mayúsculas (ET04), color del catálogo sin valor por defecto (ET05, ET14) y máximo 20 etiquetas
    /// (ET06). Guarda en SQLite y encola el cambio en la misma transacción, con o sin conexión (ET15).
    pub async fn crear_etiqueta(
        &self,
        user_id: &str,
        params: LabelCreateParams,
    ) -> Result<ConMensaje<Label>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let id = self.crear_etiqueta_en(&mut tx, user_id, params).await?;
        tx.commit().await.map_err(de_sqlx)?;

        let etiqueta = self
            .etiquetas(user_id)
            .await?
            .into_iter()
            .find(|e| e.id.0 == id)
            .ok_or_else(inesperado)?;
        Ok(ConMensaje {
            valor: etiqueta,
            mensaje: resultado("label_create", messages::ETIQUETA_CREADA),
        })
    }

    /// Valida y crea una etiqueta dentro de la transacción de quien llama (HE-08-HU02; HE-14-HU10, P29: Windi crea
    /// las etiquetas de su propuesta en una sola transacción). Devuelve el id.
    pub(crate) async fn crear_etiqueta_en(
        &self,
        tx: &mut sqlx::SqliteConnection,
        user_id: &str,
        params: LabelCreateParams,
    ) -> Result<String, AppError> {
        let nombre = params.name.trim().to_string();
        let color = params.color_id.trim().to_string();
        if nombre.is_empty() {
            return Err(error(
                ErrorCode::NameRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("name"),
            ));
        }
        if nombre.chars().count() > NOMBRE_DE_ETIQUETA_MAX {
            return Err(error(
                ErrorCode::NameTooLong,
                messages::NOMBRE_DE_ETIQUETA_MUY_LARGO,
                Some("name"),
            ));
        }
        if color.is_empty() {
            return Err(error(
                ErrorCode::ColorRequired,
                messages::CAMPO_OBLIGATORIO,
                Some("color_id"),
            ));
        }
        let existentes: Vec<String> =
            sqlx::query_scalar("SELECT name FROM label WHERE user_id = ?")
                .bind(user_id)
                .fetch_all(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        if existentes.len() as i64 >= ETIQUETAS_POR_USUARIO_MAX {
            return Err(error(
                ErrorCode::LabelLimitReached,
                messages::MAXIMO_DE_ETIQUETAS_CREADAS,
                None,
            ));
        }
        // ET04: sin distinguir mayúsculas de minúsculas, también en letras con tilde (`lower()` de SQLite solo
        // convierte ASCII).
        let clave = nombre.to_lowercase();
        if existentes.iter().any(|e| e.trim().to_lowercase() == clave) {
            return Err(error(
                ErrorCode::NameDuplicate,
                messages::ETIQUETA_DUPLICADA,
                Some("name"),
            ));
        }
        comprobar_color_de_etiqueta(&mut *tx, &color).await?;

        let id = uuid::Uuid::new_v4().to_string();
        let ahora = instante(self.calendario.ahora_ms()).0;
        let (fields, mods) = campos(
            &[
                ("name", Value::from(nombre.as_str())),
                ("color_id", Value::from(color.as_str())),
            ],
            &ahora,
        );
        sqlx::query(
            "INSERT INTO label (id, user_id, created_at, field_mods, name, color_id) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&id)
        .bind(user_id)
        .bind(&ahora)
        .bind(mods.to_string())
        .bind(&nombre)
        .bind(&color)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut *tx, "label", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        Ok(id)
    }

    /// IPC-CAT-01 `catalog_list` con `kind: 'color'`: el catálogo de colores activo, ordenado por `sort_order`
    /// (datos.md, Modelo · 3.2). DUDA: HE-08-HU02 un color no tiene miniatura; `thumbnail_url` va vacía.
    pub async fn colores(&self) -> Result<Vec<CatalogItem>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT id, name, hex FROM catalog_color WHERE is_active = 1 ORDER BY sort_order, id",
        )
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .into_iter()
            .map(|f| {
                Ok(CatalogItem {
                    id: f.try_get("id")?,
                    name: f.try_get("name")?,
                    thumbnail_url: String::new(),
                    is_cached: true,
                    hex: Some(Hex(f.try_get("hex")?)),
                    color_primary: None,
                    color_secondary: None,
                    color_text: None,
                    format: None,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// Una tarjeta del usuario con sus etiquetas, o `None` si no existe.
    pub async fn tarjeta(&self, user_id: &str, id: &str) -> Result<Option<Card>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut con = pool.acquire().await.map_err(de_sqlx)?;
        self.tarjeta_en(&mut con, user_id, id).await
    }

    /// `tarjeta` sobre una conexión ya abierta (por ejemplo, dentro de una transacción).
    pub(crate) async fn tarjeta_en(
        &self,
        con: &mut sqlx::SqliteConnection,
        user_id: &str,
        id: &str,
    ) -> Result<Option<Card>, AppError> {
        let Some(fila) = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.id = ? AND c.user_id = ?"
        ))
        .bind(id)
        .bind(user_id)
        .fetch_optional(&mut *con)
        .await
        .map_err(de_sqlx)?
        else {
            return Ok(None);
        };
        let etiquetas: Vec<String> = sqlx::query_scalar(
            "SELECT label_id FROM card_label WHERE card_id = ? ORDER BY created_at, label_id",
        )
        .bind(id)
        .fetch_all(&mut *con)
        .await
        .map_err(de_sqlx)?;
        tarjeta_de_fila(&fila, etiquetas, self.calendario.hoy())
            .map(Some)
            .map_err(de_sqlx)
    }

    /// IPC-CARD-04 `card_get` (HE-07-HU03): la tarjeta con sus etiquetas y su color, su columna y su bloque
    /// horario, si lo tiene (ET03). Si ya no existe: `card.not_found` (DP-04).
    pub async fn detalle(&self, user_id: &str, id: &str) -> Result<CardDetail, AppError> {
        let tarjeta = self
            .tarjeta(user_id, id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut etiquetas: Vec<CardDetailLabelsItem> =
            sqlx::query_as::<_, (String, String, String)>(
                "SELECT l.id, l.name, c.hex FROM card_label cl JOIN label l ON l.id = cl.label_id \
             JOIN catalog_color c ON c.id = l.color_id WHERE cl.card_id = ?",
            )
            .bind(id)
            .fetch_all(pool)
            .await
            .map_err(de_sqlx)?
            .into_iter()
            .map(|(id, name, hex)| CardDetailLabelsItem {
                id: Uuid(id),
                name,
                color_hex: Hex(hex),
            })
            .collect();
        etiquetas.sort_by_cached_key(|e| clave_alfabetica(&e.name));
        let (columna_id, nombre, hex): (String, String, String) = sqlx::query_as(
            "SELECT k.id, k.name, c.hex FROM kanban_column k \
             JOIN catalog_color c ON c.id = k.color_id WHERE k.id = ?",
        )
        .bind(&tarjeta.column_id.0)
        .fetch_one(pool)
        .await
        .map_err(de_sqlx)?;
        let bloque = match (&tarjeta.scheduled_date, &tarjeta.scheduled_hour) {
            (Some(fecha), Some(hora)) => Some(CardDetailTimeBlock {
                date: fecha.clone(),
                hour: hora.clone(),
                label: texto_del_bloque(hora.0),
            }),
            _ => None,
        };
        Ok(CardDetail {
            base_card: tarjeta,
            labels: etiquetas,
            column: CardDetailColumn {
                id: Uuid(columna_id),
                name: nombre,
                color_hex: Hex(hex),
            },
            time_block: bloque,
        })
    }

    /// IPC-CARD-10 `card_assign_time_block` (HE-11-HU02): asigna la tarjeta a un bloque horario; una tarjeta
    /// ocupa un solo bloque (ET03) y un bloque admite varias (ET04). No asigna a un bloque cuya hora de fin ya
    /// pasó (ET06) ni a un día posterior a la fecha límite (ET08).
    pub async fn asignar_bloque(
        &self,
        user_id: &str,
        params: CardAssignTimeBlockParams,
    ) -> Result<ConMensaje<Card>, AppError> {
        let hora = params.hour.0;
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let id = self.asignar_bloque_en(&mut tx, user_id, params).await?;
        tx.commit().await.map_err(de_sqlx)?;
        let tarjeta = self
            .tarjeta(user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        let (inicio, fin) = texto_del_bloque(hora)
            .split_once(" – ")
            .map(|(a, b)| (a.to_string(), b.to_string()))
            .unwrap_or_default();
        let mensaje = resultado(
            "card_assign_time_block",
            &messages::TARJETA_ASIGNADA_AL_BLOQUE
                .replace("<hora de inicio>", &inicio)
                .replace("<hora de fin>", &fin),
        );
        Ok(ConMensaje {
            valor: tarjeta,
            mensaje,
        })
    }

    /// Las reglas y la escritura de `card_assign_time_block` sobre una conexión ya abierta, para que Windi asigne
    /// el bloque dentro de la transacción de su propuesta (HE-14-HU03-ET12; HE-14-HU04-CA10). Devuelve el id.
    pub(crate) async fn asignar_bloque_en(
        &self,
        tx: &mut sqlx::SqliteConnection,
        user_id: &str,
        params: CardAssignTimeBlockParams,
    ) -> Result<String, AppError> {
        let id = params.card_id.0.to_lowercase();
        let actual = self
            .tarjeta_en(&mut *tx, user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        let dia = fecha(&params.date.0).ok_or_else(inesperado)?;
        let hora = params.hour.0;
        if hora > 23 {
            return Err(inesperado());
        }
        if let Some(motivo) = self.validar_bloque(dia, hora, &actual.due_date.0) {
            return Err(motivo);
        }
        let dia = dia.format("%Y-%m-%d").to_string();
        let ahora = instante(self.calendario.ahora_ms()).0;
        let (fields, mods) = campos(
            &[
                ("scheduled_date", Value::from(dia.as_str())),
                ("scheduled_hour", Value::from(hora)),
            ],
            &ahora,
        );
        sqlx::query(
            "UPDATE card SET scheduled_date = ?, scheduled_hour = ?, \
             field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?",
        )
        .bind(&dia)
        .bind(i64::from(hora))
        .bind(mods.to_string())
        .bind(&id)
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut *tx, "card", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        Ok(id)
    }

    /// Las reglas de HE-11-HU02 para un bloque horario: no uno que ya pasó (ET06) ni un día posterior a la fecha
    /// límite (ET08). Windi las usa al preparar la propuesta (HE-14-HU04-ET11; HE-14-HU05-ET13).
    pub(crate) fn validar_bloque(
        &self,
        dia: NaiveDate,
        hora: u8,
        fecha_limite: &str,
    ) -> Option<AppError> {
        let hoy = self.calendario.hoy();
        // El bloque de las <hora> termina a las <hora + 1>: ya pasó si su hora de fin no es posterior a ahora.
        if dia < hoy || (dia == hoy && hora < self.calendario.hora()) {
            return Some(error(
                ErrorCode::TimeBlockPast,
                messages::BLOQUE_YA_PASO,
                None,
            ));
        }
        fecha(fecha_limite)
            .is_some_and(|limite| dia > limite)
            .then(|| {
                error(
                    ErrorCode::TimeBlockAfterDueDate,
                    messages::BLOQUE_DESPUES_DE_FECHA_LIMITE,
                    None,
                )
            })
    }

    /// IPC-CARD-11 `card_unassign_time_block` (HE-11-HU03): quita la tarjeta de su bloque horario sin eliminarla;
    /// vuelve al panel Tarjetas sin horario (ET02) y, si su fecha límite no es hoy, deja de estar en el planificador
    /// diario (ET04). El cambio se guarda y se encola para sincronizar. «Tarjeta quitada del horario.» (ET03).
    pub async fn quitar_bloque(
        &self,
        user_id: &str,
        params: CardUnassignTimeBlockParams,
    ) -> Result<ConMensaje<Card>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let id = self.quitar_bloque_en(&mut tx, user_id, params).await?;
        tx.commit().await.map_err(de_sqlx)?;
        let tarjeta = self
            .tarjeta(user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        Ok(ConMensaje {
            valor: tarjeta,
            mensaje: resultado(
                "card_unassign_time_block",
                messages::TARJETA_QUITADA_DEL_HORARIO,
            ),
        })
    }

    /// La escritura de `card_unassign_time_block` sobre una conexión ya abierta (HE-14-HU05-CA12). Devuelve el id.
    pub(crate) async fn quitar_bloque_en(
        &self,
        tx: &mut sqlx::SqliteConnection,
        user_id: &str,
        params: CardUnassignTimeBlockParams,
    ) -> Result<String, AppError> {
        let id = params.card_id.0.to_lowercase();
        self.tarjeta_en(&mut *tx, user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        let ahora = instante(self.calendario.ahora_ms()).0;
        let (fields, mods) = campos(
            &[
                ("scheduled_date", Value::Null),
                ("scheduled_hour", Value::Null),
            ],
            &ahora,
        );
        sqlx::query(
            "UPDATE card SET scheduled_date = NULL, scheduled_hour = NULL, \
             field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?",
        )
        .bind(mods.to_string())
        .bind(&id)
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut *tx, "card", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        Ok(id)
    }

    /// IPC-CARD-08 `planner_get_today` (HE-12-HU01): las tarjetas con fecha límite hoy y las asignadas a un
    /// bloque de hoy, sin duplicados (ET02, ET08); primero las de bloque por hora y después las sin hora (ET03).
    /// La hora es la de inicio del bloque de hoy (ET05). El resumen cuenta las completadas (HE-12-HU03).
    /// rediseno_final_backend.md §3.5: el desempate es la creación y el id, no `position`, que cambia al mover la
    /// tarjeta a Hecho: completar una tarjeta ya no la cambia de lugar.
    pub async fn planificador_de_hoy(&self, user_id: &str) -> Result<PlannerToday, AppError> {
        let hoy = self.calendario.hoy().format("%Y-%m-%d").to_string();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.user_id = ? AND (c.due_date = ? OR c.scheduled_date = ?) \
             ORDER BY c.scheduled_date = ? DESC, c.scheduled_hour, c.created_at, c.id"
        ))
        .bind(user_id)
        .bind(&hoy)
        .bind(&hoy)
        .bind(&hoy)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let etiquetas = self.etiquetas_por_tarjeta(user_id).await?;
        let dia = self.calendario.hoy();
        let mut items = Vec::with_capacity(filas.len());
        for fila in &filas {
            let id: String = fila.try_get("id").map_err(de_sqlx)?;
            let tarjeta =
                tarjeta_de_fila(fila, etiquetas.get(&id).cloned().unwrap_or_default(), dia)
                    .map_err(de_sqlx)?;
            let hora = (tarjeta.scheduled_date.as_ref().map(|d| d.0.as_str())
                == Some(hoy.as_str()))
            .then(|| tarjeta.scheduled_hour.clone())
            .flatten();
            items.push(PlannerItem {
                card: tarjeta,
                hour: hora,
            });
        }
        let total = i64::try_from(items.len()).unwrap_or(i64::MAX);
        let completadas =
            i64::try_from(items.iter().filter(|i| i.card.is_completed).count()).unwrap_or(0);
        // `percent` entero redondeado (contratos.md, IPC-CARD-08).
        #[allow(clippy::cast_precision_loss)]
        let porcentaje = if total == 0 {
            0.0
        } else {
            (completadas as f64 * 100.0 / total as f64).round()
        };
        Ok(PlannerToday {
            date: DateIso(hoy),
            items,
            summary: PlannerSummary {
                total,
                completed: completadas,
                remaining: total - completadas,
                percent: porcentaje,
            },
        })
    }

    /// IPC-CARD-09 `agenda_get_day` (HE-11-HU01): los 24 bloques horarios del día con sus tarjetas (ET01, ET03)
    /// y las tarjetas sin horario: las que no están en Hecho ni tienen bloque (ET04). Lee solo la base local,
    /// así que funciona igual sin conexión (ET08).
    pub async fn agenda(&self, user_id: &str, dia: &str) -> Result<AgendaDay, AppError> {
        let fecha_del_dia = fecha(dia).ok_or_else(inesperado)?;
        let hoy = self.calendario.hoy();
        let es_hoy = fecha_del_dia == hoy;
        let hora_actual = self.calendario.hora();
        let dia = fecha_del_dia.format("%Y-%m-%d").to_string();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.user_id = ? AND \
             (c.scheduled_date = ? OR (c.scheduled_date IS NULL AND k.role <> 'done')) \
             ORDER BY c.due_date, c.position, c.created_at"
        ))
        .bind(user_id)
        .bind(&dia)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let etiquetas = self.etiquetas_por_tarjeta(user_id).await?;
        let mut bloques: Vec<AgendaBlock> = (0..24u8)
            .map(|h| AgendaBlock {
                hour: Hour(h),
                cards: Vec::new(),
                // Un bloque que ya pasó (HE-11-HU02-CA04): los de un día anterior y, hoy, los anteriores a la
                // hora actual.
                is_past: fecha_del_dia < hoy || (es_hoy && h < hora_actual),
            })
            .collect();
        let mut sin_horario = Vec::new();
        for fila in &filas {
            let id: String = fila.try_get("id").map_err(de_sqlx)?;
            let tarjeta =
                tarjeta_de_fila(fila, etiquetas.get(&id).cloned().unwrap_or_default(), hoy)
                    .map_err(de_sqlx)?;
            match &tarjeta.scheduled_hour {
                Some(hora) => {
                    if let Some(bloque) = bloques.get_mut(usize::from(hora.0)) {
                        bloque.cards.push(tarjeta);
                    }
                }
                None => sin_horario.push(tarjeta),
            }
        }
        Ok(AgendaDay {
            date: DateIso(dia),
            is_today: es_hoy,
            current_hour: es_hoy.then_some(Hour(hora_actual)),
            blocks: bloques,
            unscheduled: sin_horario,
        })
    }

    /// IPC-CARD-12 `calendar_get_month` (HE-10-HU01): todos los días del mes, cada uno con los títulos de hasta
    /// `TITULOS_POR_DIA_DEL_MES` tarjetas cuya fecha límite es ese día y la cantidad restante para «+N más»
    /// (ET03, ET05), y los conteos de vencidas y pendientes del día (HE-10-HU05, `EstadoDelDia`).
    /// DUDA: HE-10-HU01 el orden de las tarjetas de un día no está definido. Valor usado: el del tablero
    /// (`position`, después la fecha de creación) (docs/DUDAS.md).
    pub async fn mes_del_calendario(
        &self,
        user_id: &str,
        anio: i64,
        mes: i64,
    ) -> Result<CalendarMonth, AppError> {
        let primero = i32::try_from(anio)
            .ok()
            .zip(u32::try_from(mes).ok())
            .and_then(|(a, m)| NaiveDate::from_ymd_opt(a, m, 1))
            .ok_or_else(inesperado)?;
        let siguiente = primero
            .checked_add_months(chrono::Months::new(1))
            .ok_or_else(inesperado)?;
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas: Vec<(String, String, String, String)> = sqlx::query_as(
            "SELECT c.id, c.title, c.due_date, k.role FROM card c JOIN kanban_column k ON k.id = c.column_id \
             WHERE c.user_id = ? AND c.due_date >= ? AND c.due_date < ? \
             ORDER BY c.due_date, c.position, c.created_at",
        )
        .bind(user_id)
        .bind(primero.format("%Y-%m-%d").to_string())
        .bind(siguiente.format("%Y-%m-%d").to_string())
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let hoy = self.calendario.hoy();
        let mut por_dia: HashMap<String, (Vec<CalendarMonthDayPreviewItem>, EstadoDelDia)> =
            HashMap::new();
        for (id, title, fecha_limite, rol) in filas {
            let dia = fecha(&fecha_limite);
            let (preview, estado) = por_dia.entry(fecha_limite).or_default();
            estado.contar(dia, rol == "done", hoy);
            preview.push(CalendarMonthDayPreviewItem {
                id: Uuid(id),
                title,
            });
        }
        Ok(CalendarMonth {
            days: primero
                .iter_days()
                .take_while(|d| *d < siguiente)
                .map(|d| {
                    let date = d.format("%Y-%m-%d").to_string();
                    let (mut preview, estado) = por_dia.remove(&date).unwrap_or_default();
                    let resto = preview.split_off(preview.len().min(TITULOS_POR_DIA_DEL_MES));
                    CalendarMonthDay {
                        date: DateIso(date),
                        preview,
                        extra_count: i64::try_from(resto.len()).unwrap_or(i64::MAX),
                        overdue_count: estado.vencidas,
                        pending_count: estado.pendientes,
                        has_overdue: estado.hay_vencidas(),
                        has_pending: estado.hay_pendientes(),
                    }
                })
                .collect(),
        })
    }

    /// IPC-CARD-13 `calendar_get_week` (HE-10-HU02): los 7 días desde `week_start` (el lunes, ET02), cada uno con
    /// todas las tarjetas cuya fecha límite es ese día (ET03) y la hora de inicio de su bloque horario si lo
    /// tiene (ET05), y los conteos de vencidas y pendientes del día (HE-10-HU05-ET08).
    /// DUDA: HE-10-HU02 no está definido en qué día va una tarjeta con bloque horario ni el orden del día. Valor
    /// usado: el día de su fecha límite, como en la vista mensual; primero las de bloque por hora y después las
    /// demás en el orden del tablero (docs/DUDAS.md).
    pub async fn semana_del_calendario(
        &self,
        user_id: &str,
        lunes: &str,
    ) -> Result<CalendarWeek, AppError> {
        let lunes = fecha(lunes).ok_or_else(inesperado)?;
        let fin = lunes + chrono::Days::new(7);
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.user_id = ? AND c.due_date >= ? AND c.due_date < ? \
             ORDER BY c.due_date, c.scheduled_hour IS NULL, c.scheduled_hour, c.position, c.created_at"
        ))
        .bind(user_id)
        .bind(lunes.format("%Y-%m-%d").to_string())
        .bind(fin.format("%Y-%m-%d").to_string())
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let etiquetas = self.etiquetas_por_tarjeta(user_id).await?;
        let hoy = self.calendario.hoy();
        let mut por_dia: HashMap<String, (Vec<CalendarWeekDayCardsItem>, EstadoDelDia)> =
            HashMap::new();
        for fila in &filas {
            let id: String = fila.try_get("id").map_err(de_sqlx)?;
            let tarjeta =
                tarjeta_de_fila(fila, etiquetas.get(&id).cloned().unwrap_or_default(), hoy)
                    .map_err(de_sqlx)?;
            let (tarjetas, estado) = por_dia.entry(tarjeta.due_date.0.clone()).or_default();
            estado.contar(fecha(&tarjeta.due_date.0), tarjeta.is_completed, hoy);
            tarjetas.push(CalendarWeekDayCardsItem {
                start_hour: tarjeta.scheduled_hour.clone(),
                card: tarjeta,
            });
        }
        Ok(CalendarWeek {
            days: lunes
                .iter_days()
                .take(7)
                .map(|d| {
                    let date = d.format("%Y-%m-%d").to_string();
                    let (cards, estado) = por_dia.remove(&date).unwrap_or_default();
                    CalendarWeekDay {
                        cards,
                        date: DateIso(date),
                        overdue_count: estado.vencidas,
                        pending_count: estado.pendientes,
                        has_overdue: estado.hay_vencidas(),
                        has_pending: estado.hay_pendientes(),
                    }
                })
                .collect(),
        })
    }

    /// IPC-CARD-14 `calendar_get_day` (HE-10-HU03): todas las tarjetas cuya fecha límite es el día, cada una con
    /// su tipo, su título, su prioridad y el nombre de su columna (ET03), en el orden del tablero. `can_create`
    /// es falso en los días anteriores a hoy (HE-10-HU04-CA04).
    pub async fn dia_del_calendario(
        &self,
        user_id: &str,
        dia: &str,
    ) -> Result<CalendarDay, AppError> {
        let fecha_del_dia = fecha(dia).ok_or_else(inesperado)?;
        let dia = fecha_del_dia.format("%Y-%m-%d").to_string();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.user_id = ? AND c.due_date = ? ORDER BY c.position, c.created_at"
        ))
        .bind(user_id)
        .bind(&dia)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let columnas: HashMap<String, String> = self
            .columnas(user_id)
            .await?
            .into_iter()
            .map(|c| (c.id.0, c.name))
            .collect();
        let hoy = self.calendario.hoy();
        let mut cards = Vec::with_capacity(filas.len());
        for fila in &filas {
            let tarjeta = tarjeta_de_fila(fila, Vec::new(), hoy).map_err(de_sqlx)?;
            cards.push(CalendarDayCardsItem {
                column_name: columnas
                    .get(&tarjeta.column_id.0)
                    .cloned()
                    .unwrap_or_default(),
                id: tarjeta.id,
                r#type: tarjeta.r#type,
                title: tarjeta.title,
                priority: tarjeta.priority,
            });
        }
        Ok(CalendarDay {
            date: DateIso(dia),
            cards,
            can_create: fecha_del_dia >= hoy,
        })
    }

    /// Las etiquetas de cada tarjeta del usuario, en el orden en que se asignaron.
    async fn etiquetas_por_tarjeta(
        &self,
        user_id: &str,
    ) -> Result<HashMap<String, Vec<String>>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let uniones: Vec<(String, String)> = sqlx::query_as(
            "SELECT card_id, label_id FROM card_label WHERE user_id = ? ORDER BY created_at, label_id",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let mut etiquetas: HashMap<String, Vec<String>> = HashMap::new();
        for (tarjeta, etiqueta) in uniones {
            etiquetas.entry(tarjeta).or_default().push(etiqueta);
        }
        Ok(etiquetas)
    }

    /// IPC-COL-01 `column_list`: las columnas del usuario por `position`, con su cantidad de tarjetas
    /// (HE-09-HU01-ET01). Las tres por defecto son las de función `todo`, `in_progress` y `done` (ET02).
    /// IPC-COL-02 `column_create` (HE-09-HU03). Nombre obligatorio de 1 a 30 caracteres (ET03), único sin
    /// distinguir mayúsculas (ET04), color del catálogo con gris por defecto (ET05, ET06), máximo 10 columnas
    /// contadas las tres por defecto (ET07, D-167). Se agrega al final del tablero (ET09).
    pub async fn crear_columna(
        &self,
        user_id: &str,
        params: ColumnCreateParams,
    ) -> Result<ConMensaje<Column>, AppError> {
        let nombre = params.name.trim().to_string();
        let color = params
            .color_id
            .map(|c| c.trim().to_string())
            .filter(|c| !c.is_empty())
            .unwrap_or_else(|| "gray".to_string());
        if let Some(e) = validar_nombre_de_columna(&nombre) {
            return Err(e);
        }
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;

        let existentes: Vec<(String, f64)> =
            sqlx::query_as("SELECT name, position FROM kanban_column WHERE user_id = ?")
                .bind(user_id)
                .fetch_all(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        if existentes.len() >= COLUMNAS_MAX {
            return Err(error(
                ErrorCode::ColumnLimitReached,
                messages::MAXIMO_DE_COLUMNAS,
                None,
            ));
        }
        let clave = nombre.to_lowercase();
        if existentes
            .iter()
            .any(|(n, _)| n.trim().to_lowercase() == clave)
        {
            return Err(error(
                ErrorCode::NameDuplicate,
                messages::COLUMNA_DUPLICADA,
                Some("name"),
            ));
        }
        let existe_el_color: i64 =
            sqlx::query_scalar("SELECT count(*) FROM catalog_color WHERE id = ? AND is_active = 1")
                .bind(&color)
                .fetch_one(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        if existe_el_color == 0 {
            // La vista solo ofrece colores del catálogo (ET05): llega aquí si el catálogo lo desactivó con la
            // ventana abierta (docs/rediseno.md RD-85).
            return Err(color_no_disponible());
        }
        let posicion =
            existentes.iter().map(|(_, p)| *p).fold(0.0_f64, f64::max) + PASO_DE_POSICION;

        let id = uuid::Uuid::new_v4().to_string();
        let ahora = instante(self.calendario.ahora_ms()).0;
        let (fields, mods) = campos(
            &[
                ("name", Value::from(nombre.as_str())),
                ("color_id", Value::from(color.as_str())),
                ("role", Value::from("custom")),
                ("position", json!(posicion)),
            ],
            &ahora,
        );
        sqlx::query(
            "INSERT INTO kanban_column (id, user_id, created_at, field_mods, name, color_id, role, position) \
             VALUES (?, ?, ?, ?, ?, ?, 'custom', ?)",
        )
        .bind(&id)
        .bind(user_id)
        .bind(&ahora)
        .bind(mods.to_string())
        .bind(&nombre)
        .bind(&color)
        .bind(posicion)
        .execute(&mut *tx)
        .await
        .map_err(de_sqlx)?;
        encolar_cambio(&mut tx, "kanban_column", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;

        let columna = self
            .columnas(user_id)
            .await?
            .into_iter()
            .find(|c| c.id.0 == id)
            .ok_or_else(inesperado)?;
        Ok(ConMensaje {
            valor: columna,
            mensaje: resultado("column_create", messages::COLUMNA_CREADA),
        })
    }

    /// IPC-COL-03 `column_update` (HE-09-HU04). Mismas reglas de nombre que al crear (ET03, ET04, ET09) y color
    /// del catálogo (ET05). No cambia la función de la columna (`role`): renombrar Hecho conserva sus tarjetas
    /// completadas (ET06). Si la columna ya no existe, `column.not_found`.
    pub async fn actualizar_columna(
        &self,
        user_id: &str,
        params: ColumnUpdateParams,
    ) -> Result<ConMensaje<Column>, AppError> {
        let id = params.id.0.to_lowercase();
        let nombre = params.name.map(|n| n.trim().to_string());
        let color = params
            .color_id
            .map(|c| c.trim().to_string())
            .filter(|c| !c.is_empty());
        if let Some(e) = nombre.as_deref().and_then(validar_nombre_de_columna) {
            return Err(e);
        }
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;

        let existe: i64 =
            sqlx::query_scalar("SELECT count(*) FROM kanban_column WHERE id = ? AND user_id = ?")
                .bind(&id)
                .bind(user_id)
                .fetch_one(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        if existe == 0 {
            return Err(columna_no_existe());
        }
        if let Some(nombre) = &nombre {
            let otras: Vec<String> =
                sqlx::query_scalar("SELECT name FROM kanban_column WHERE user_id = ? AND id <> ?")
                    .bind(user_id)
                    .bind(&id)
                    .fetch_all(&mut *tx)
                    .await
                    .map_err(de_sqlx)?;
            let clave = nombre.to_lowercase();
            if otras.iter().any(|n| n.trim().to_lowercase() == clave) {
                return Err(error(
                    ErrorCode::NameDuplicate,
                    messages::COLUMNA_DUPLICADA,
                    Some("name"),
                ));
            }
        }
        if let Some(color) = &color {
            let existe_el_color: i64 = sqlx::query_scalar(
                "SELECT count(*) FROM catalog_color WHERE id = ? AND is_active = 1",
            )
            .bind(color)
            .fetch_one(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            if existe_el_color == 0 {
                return Err(color_no_disponible());
            }
        }

        let ahora = instante(self.calendario.ahora_ms()).0;
        let mut valores: Vec<(&str, Value)> = Vec::new();
        if let Some(nombre) = &nombre {
            valores.push(("name", Value::from(nombre.as_str())));
        }
        if let Some(color) = &color {
            valores.push(("color_id", Value::from(color.as_str())));
        }
        if !valores.is_empty() {
            let (fields, mods) = campos(&valores, &ahora);
            sqlx::query(
                "UPDATE kanban_column SET name = coalesce(?, name), color_id = coalesce(?, color_id), \
                 field_mods = json_patch(field_mods, ?) WHERE id = ? AND user_id = ?",
            )
            .bind(&nombre)
            .bind(&color)
            .bind(mods.to_string())
            .bind(&id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            encolar_cambio(&mut tx, "kanban_column", &id, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        tx.commit().await.map_err(de_sqlx)?;

        let columna = self
            .columnas(user_id)
            .await?
            .into_iter()
            .find(|c| c.id.0 == id)
            .ok_or_else(inesperado)?;
        Ok(ConMensaje {
            valor: columna,
            mensaje: resultado("column_update", messages::COLUMNA_ACTUALIZADA),
        })
    }

    /// IPC-COL-04 `column_reorder` (HE-09-HU05): el orden completo de las columnas. Cada columna queda en la
    /// posición de su lugar en la lista y solo las que cambian se encolan (ET03, ET04). Una lista que no tiene
    /// exactamente las columnas del usuario responde `column.order_invalid`, sin texto, y no cambia nada.
    pub async fn reordenar_columnas(
        &self,
        user_id: &str,
        params: ColumnReorderParams,
    ) -> Result<Vec<Column>, AppError> {
        let pedidas: Vec<String> = params
            .column_ids
            .into_iter()
            .map(|u| u.0.to_lowercase())
            .collect();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let actuales: Vec<(String, f64)> =
            sqlx::query_as("SELECT id, position FROM kanban_column WHERE user_id = ?")
                .bind(user_id)
                .fetch_all(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        let mut ordenadas_pedidas = pedidas.clone();
        ordenadas_pedidas.sort();
        let mut ordenadas_actuales: Vec<String> =
            actuales.iter().map(|(id, _)| id.clone()).collect();
        ordenadas_actuales.sort();
        if ordenadas_pedidas != ordenadas_actuales {
            return Err(error(ErrorCode::ColumnOrderInvalid, "", None));
        }

        let ahora = instante(self.calendario.ahora_ms()).0;
        for (i, id) in pedidas.iter().enumerate() {
            let posicion = (i as f64 + 1.0) * PASO_DE_POSICION;
            let anterior = actuales
                .iter()
                .find(|(otra, _)| otra == id)
                .map(|(_, p)| *p);
            if anterior == Some(posicion) {
                continue;
            }
            let (fields, mods) = campos(&[("position", json!(posicion))], &ahora);
            sqlx::query(
                "UPDATE kanban_column SET position = ?, field_mods = json_patch(field_mods, ?) \
                 WHERE id = ? AND user_id = ?",
            )
            .bind(posicion)
            .bind(mods.to_string())
            .bind(id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(de_sqlx)?;
            encolar_cambio(&mut tx, "kanban_column", id, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        tx.commit().await.map_err(de_sqlx)?;
        self.columnas(user_id).await
    }

    pub async fn columnas(&self, user_id: &str) -> Result<Vec<Column>, AppError> {
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(
            "SELECT k.id, k.name, k.color_id, c.hex, k.role, k.position, \
             (SELECT count(*) FROM card t WHERE t.column_id = k.id) AS card_count \
             FROM kanban_column k JOIN catalog_color c ON c.id = k.color_id \
             WHERE k.user_id = ? ORDER BY k.position, k.created_at",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        filas
            .iter()
            .map(|f| {
                let rol = rol_de_texto(&f.try_get::<String, _>("role")?);
                let posicion: f64 = f.try_get("position")?;
                Ok(Column {
                    id: Uuid(f.try_get("id")?),
                    name: f.try_get("name")?,
                    color_id: f.try_get("color_id")?,
                    color_hex: Hex(f.try_get("hex")?),
                    is_default: rol != ColumnRole::Custom,
                    role: rol,
                    #[allow(clippy::cast_possible_truncation)]
                    position: posicion as i64,
                    card_count: f.try_get("card_count")?,
                })
            })
            .collect::<Result<Vec<_>, sqlx::Error>>()
            .map_err(de_sqlx)
    }

    /// IPC-CARD-05 `card_list_board`: columnas por `position` y, en cada una, sus tarjetas por `position`
    /// (HE-09-HU01). Los textos de columna vacía los pone la vista (CA01, CA03).
    pub async fn tablero(&self, user_id: &str) -> Result<CardListBoardResult, AppError> {
        let columnas = self.columnas(user_id).await?;
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.user_id = ? ORDER BY c.position, c.created_at"
        ))
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let uniones: Vec<(String, String)> = sqlx::query_as(
            "SELECT card_id, label_id FROM card_label WHERE user_id = ? ORDER BY created_at, label_id",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await
        .map_err(de_sqlx)?;
        let mut etiquetas: HashMap<String, Vec<String>> = HashMap::new();
        for (tarjeta, etiqueta) in uniones {
            etiquetas.entry(tarjeta).or_default().push(etiqueta);
        }
        let hoy = self.calendario.hoy();
        let mut por_columna: HashMap<String, Vec<Card>> = HashMap::new();
        for fila in &filas {
            let id: String = fila.try_get("id").map_err(de_sqlx)?;
            let tarjeta = tarjeta_de_fila(fila, etiquetas.remove(&id).unwrap_or_default(), hoy)
                .map_err(de_sqlx)?;
            por_columna
                .entry(tarjeta.column_id.0.clone())
                .or_default()
                .push(tarjeta);
        }
        Ok(CardListBoardResult {
            columns: columnas
                .into_iter()
                .map(|column| BoardColumn {
                    cards: por_columna.remove(&column.id.0).unwrap_or_default(),
                    column,
                })
                .collect(),
        })
    }

    /// IPC-CARD-15 `kanban_widget_get` (HE-06-HU05): las columnas del tablero en su orden, con hasta
    /// `TITULOS_DEL_WIDGET_KANBAN` títulos cada una y la cantidad restante para «+N más» (ET01, ET02; CA03).
    pub async fn widget_kanban(&self, user_id: &str) -> Result<KanbanWidgetData, AppError> {
        let tablero = self.tablero(user_id).await?;
        Ok(KanbanWidgetData {
            columns: tablero
                .columns
                .into_iter()
                .map(|BoardColumn { column, cards }| {
                    let total = cards.len();
                    let titles: Vec<_> = cards
                        .into_iter()
                        .take(TITULOS_DEL_WIDGET_KANBAN)
                        .map(|t| KanbanWidgetColumnTitlesItem {
                            card_id: t.id,
                            title: t.title,
                        })
                        .collect();
                    let extra_count = i64::try_from(total - titles.len()).unwrap_or(i64::MAX);
                    KanbanWidgetColumn {
                        column,
                        titles,
                        extra_count,
                    }
                })
                .collect(),
        })
    }
}

/// Las columnas de una tarjeta con la función de su columna (para «Vencida» y «completada»).
const SELECT_TARJETA: &str = "SELECT c.id, c.type, c.title, c.description, c.priority, c.due_date, \
     c.column_id, c.position, c.previous_column_id, c.completed_on, c.scheduled_date, \
     c.scheduled_hour, c.created_at, k.role AS column_role \
     FROM card c JOIN kanban_column k ON k.id = c.column_id";

/// Vencidas y pendientes de un día del calendario (HE-10-HU05). Una tarjeta fuera de la columna Hecho está vencida
/// si su fecha límite es anterior a hoy (ET01) y pendiente si es hoy o después (ET02); las de Hecho no cuentan
/// (ET05, ET10). Cuenta todas las del día, sin el límite de la vista previa (ET14). «Hoy» es la fecha del
/// computador (ET18).
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct EstadoDelDia {
    pub vencidas: i64,
    pub pendientes: i64,
}

impl EstadoDelDia {
    pub fn contar(&mut self, fecha_limite: Option<NaiveDate>, completada: bool, hoy: NaiveDate) {
        match fecha_limite {
            _ if completada => {}
            Some(dia) if dia < hoy => self.vencidas += 1,
            Some(_) => self.pendientes += 1,
            None => {}
        }
    }

    /// Resaltado en rojo (ET03).
    pub fn hay_vencidas(self) -> bool {
        self.vencidas > 0
    }

    /// Resaltado en amarillo: pendientes y ninguna vencida (ET04).
    pub fn hay_pendientes(self) -> bool {
        self.pendientes > 0 && self.vencidas == 0
    }
}

/// «10:00 – 11:00» (contratos.md, `CardDetail.time_block.label`). El bloque de las 23 termina a las 00:00.
pub fn texto_del_bloque(hora: u8) -> String {
    format!("{:02}:00 – {:02}:00", hora, (hora + 1) % 24)
}

/// `card.not_found` (DP-04: fuera de editar usa el mismo texto que HE-07-HU04-CA11).
fn tarjeta_no_existe() -> AppError {
    error(ErrorCode::CardNotFound, messages::TARJETA_NO_EXISTE, None)
}

fn rol_de_texto(texto: &str) -> ColumnRole {
    match texto {
        "todo" => ColumnRole::Todo,
        "in_progress" => ColumnRole::InProgress,
        "done" => ColumnRole::Done,
        _ => ColumnRole::Custom,
    }
}

/// Una fila de `SELECT_TARJETA` como `Card`. Una tarjeta en la columna Hecho es una tarjeta completada
/// (HE-09-HU01-ET07); está vencida si su fecha límite es anterior a hoy y no está en Hecho (ET06;
/// HE-07-HU03-ET06).
fn tarjeta_de_fila(
    fila: &SqliteRow,
    etiquetas: Vec<String>,
    hoy: NaiveDate,
) -> Result<Card, sqlx::Error> {
    let texto = |c: &str| fila.try_get::<Option<String>, _>(c);
    let completada = fila.try_get::<String, _>("column_role")? == "done";
    let fecha_limite: String = fila.try_get("due_date")?;
    let vencida = !completada && fecha(&fecha_limite).is_some_and(|d| d < hoy);
    let posicion: f64 = fila.try_get("position")?;
    let hora: Option<i64> = fila.try_get("scheduled_hour")?;
    Ok(Card {
        id: Uuid(fila.try_get("id")?),
        r#type: tipo_de_texto(&fila.try_get::<String, _>("type")?),
        title: fila.try_get("title")?,
        description: texto("description")?,
        priority: texto("priority")?.as_deref().and_then(prioridad_de_texto),
        due_date: DateIso(fecha_limite),
        column_id: Uuid(fila.try_get("column_id")?),
        // `position` es REAL en la base; Card.position de tipos.ts es entero.
        #[allow(clippy::cast_possible_truncation)]
        position: posicion as i64,
        previous_column_id: texto("previous_column_id")?.map(Uuid),
        is_completed: completada,
        completed_on: texto("completed_on")?.map(DateIso),
        scheduled_date: texto("scheduled_date")?.map(DateIso),
        scheduled_hour: hora.and_then(|h| u8::try_from(h).ok()).map(Hour),
        label_ids: etiquetas.into_iter().map(Uuid).collect(),
        is_overdue: vencida,
        created_at: Instant(fila.try_get("created_at")?),
    })
}

mod columnas;
mod etiquetas;
mod preferencias;
mod reportes;
pub use reportes::{agrupacion, resolver_rango};

#[cfg(test)]
mod pruebas_de_completar;
#[cfg(test)]
mod pruebas_de_edicion;
#[cfg(test)]
mod pruebas_de_errores_visibles;
#[cfg(test)]
mod pruebas_de_etiquetas;
#[cfg(test)]
mod pruebas_de_la_agenda;
#[cfg(test)]
mod pruebas_de_reportes;
#[cfg(test)]
mod pruebas_del_calendario;
#[cfg(test)]
mod pruebas_del_planificador_diario;
#[cfg(test)]
mod pruebas_del_tablero;
#[cfg(test)]
mod pruebas_del_widget_kanban;

#[cfg(test)]
pub(crate) mod pruebas {
    use super::*;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicI64, Ordering};

    pub(crate) const USUARIO: &str = "00000000-0000-4000-8000-000000000001";
    pub(crate) const OTRO_USUARIO: &str = "00000000-0000-4000-8000-000000000002";
    pub(crate) const POR_HACER: &str = "00000000-0000-4000-8000-0000000000c1";
    pub(crate) const EN_PROGRESO: &str = "00000000-0000-4000-8000-0000000000c2";
    pub(crate) const HECHO: &str = "00000000-0000-4000-8000-0000000000c3";
    /// 14/11/2026, 12:00 UTC.
    pub(crate) const AHORA_MS: i64 = 1_794_657_600_000;

    /// Calendario de prueba: hoy es 14/11/2026, salvo que la prueba adelante `ahora_ms` (la fecha es la UTC).
    #[derive(Clone)]
    pub(crate) struct CalendarioDePrueba(pub Arc<AtomicI64>);

    impl Default for CalendarioDePrueba {
        fn default() -> Self {
            Self(Arc::new(AtomicI64::new(AHORA_MS)))
        }
    }

    impl Calendario for CalendarioDePrueba {
        fn hoy(&self) -> NaiveDate {
            chrono::DateTime::from_timestamp_millis(self.ahora_ms())
                .map(|d| d.date_naive())
                .unwrap_or_default()
        }
        fn ahora_ms(&self) -> i64 {
            self.0.load(Ordering::SeqCst)
        }
        /// Son las 14:25 (HE-11-HU01-CA01).
        fn hora(&self) -> u8 {
            14
        }
    }

    pub(crate) fn bloquear<F: std::future::Future>(f: F) -> F::Output {
        tauri::async_runtime::block_on(f)
    }

    /// La semilla de la cuenta de prueba (datos.md, Modelo · 9): perfil, colores y las 3 columnas por defecto,
    /// como quedan tras la primera descarga. Un segundo usuario con su propia columna Por hacer (RNF-21).
    pub(crate) fn con_semilla() -> ServicioDelPlanificador<CalendarioDePrueba> {
        let servicio =
            ServicioDelPlanificador::nuevo(BaseLocal::en_memoria(), CalendarioDePrueba::default());
        bloquear(async {
            let pool = servicio.base().pool().await.unwrap();
            let t = "2026-11-01T00:00:00.000Z";
            for (id, hex) in [
                ("gray", "#9E9E9E"),
                ("blue", "#2196F3"),
                ("green", "#4CAF50"),
            ] {
                sqlx::query(
                    "INSERT INTO catalog_color (id, name, hex, fetched_at) VALUES (?, ?, ?, ?)",
                )
                .bind(id)
                .bind(id)
                .bind(hex)
                .bind(t)
                .execute(pool)
                .await
                .unwrap();
            }
            for (usuario, alias) in [(USUARIO, "Prueba"), (OTRO_USUARIO, "Otra")] {
                sqlx::query("INSERT INTO profile (user_id, alias, created_at) VALUES (?, ?, ?)")
                    .bind(usuario)
                    .bind(alias)
                    .bind(t)
                    .execute(pool)
                    .await
                    .unwrap();
            }
            for (id, usuario, nombre, color, rol, pos) in [
                (POR_HACER, USUARIO, "Por hacer", "gray", "todo", 1024.0),
                (
                    EN_PROGRESO,
                    USUARIO,
                    "En progreso",
                    "blue",
                    "in_progress",
                    2048.0,
                ),
                (HECHO, USUARIO, "Hecho", "green", "done", 3072.0),
                (
                    "00000000-0000-4000-8000-0000000000d1",
                    OTRO_USUARIO,
                    "Por hacer",
                    "gray",
                    "todo",
                    1024.0,
                ),
            ] {
                sqlx::query(
                    "INSERT INTO kanban_column (id, user_id, created_at, name, color_id, role, position) \
                     VALUES (?, ?, ?, ?, ?, ?, ?)",
                )
                .bind(id).bind(usuario).bind(t).bind(nombre).bind(color).bind(rol).bind(pos)
                .execute(pool).await.unwrap();
            }
        });
        servicio
    }

    /// Crea una etiqueta del usuario de prueba directamente en la base (las etiquetas son de HE-08).
    pub(crate) fn etiqueta(
        servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
        nombre: &str,
    ) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        bloquear(async {
            sqlx::query(
                "INSERT INTO label (id, user_id, created_at, name, color_id) VALUES (?, ?, ?, ?, 'blue')",
            )
            .bind(&id).bind(USUARIO).bind("2026-11-01T00:00:00.000Z").bind(nombre)
            .execute(servicio.base().pool().await.unwrap()).await.unwrap();
        });
        id
    }

    pub(crate) fn contar(servicio: &ServicioDelPlanificador<CalendarioDePrueba>, sql: &str) -> i64 {
        bloquear(async {
            sqlx::query_scalar(sql)
                .fetch_one(servicio.base().pool().await.unwrap())
                .await
                .unwrap()
        })
    }

    pub(crate) fn params(titulo: &str, fecha_limite: &str) -> CardCreateParams {
        CardCreateParams {
            r#type: None,
            title: titulo.into(),
            due_date: DateIso(fecha_limite.into()),
            description: None,
            priority: None,
            label_ids: None,
        }
    }

    pub(crate) fn crear(
        servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
        p: CardCreateParams,
    ) -> Result<ConMensaje<Card>, AppError> {
        bloquear(servicio.crear_tarjeta(USUARIO, p))
    }

    /// No crea la tarjeta y responde el error del campo con su texto literal.
    fn rechaza(p: CardCreateParams, code: ErrorCode, message: &str, field: &str) {
        let servicio = con_semilla();
        let e = crear(&servicio, p).unwrap_err();
        assert_eq!(
            (e.code, e.message.as_str(), e.field.as_deref()),
            (code, message, Some(field))
        );
        assert_eq!(contar(&servicio, "SELECT count(*) FROM card"), 0);
        assert_eq!(contar(&servicio, "SELECT count(*) FROM pending_change"), 0);
    }

    #[test]
    fn ca_he_07_hu01_ca01() {
        // HE-07-HU01-CA01 · Tipo «Tarea» (por defecto, ET05), título válido y fecha de hoy: crea la tarjeta al
        // final de Por hacer (ET13) y responde «Tarjeta creada.» (ET16).
        let servicio = con_semilla();
        let primera = crear(&servicio, params("Entregar informe", "2026-11-14")).unwrap();
        let segunda = crear(&servicio, params("Repasar", "2026-11-15")).unwrap();
        assert_eq!(primera.mensaje.message, "Tarjeta creada.");
        assert_eq!(primera.mensaje.code, "card_create");
        let t = &segunda.valor;
        assert_eq!(t.r#type, CardType::Task);
        assert_eq!(t.title, "Repasar");
        assert_eq!(t.due_date, DateIso("2026-11-15".into()));
        assert_eq!(t.column_id, Uuid(POR_HACER.into()));
        assert!(
            t.position > primera.valor.position,
            "va al final de la columna"
        );
        assert_eq!((t.description.clone(), t.priority.clone()), (None, None));
        assert!(t.label_ids.is_empty());
        assert!(!t.is_completed && !t.is_overdue);
        assert_eq!(t.created_at, Instant("2026-11-14T12:00:00.000Z".into()));
        // ET14: la tarjeta queda guardada para el tablero y las demás vistas.
        let guardada = bloquear(servicio.tarjeta(USUARIO, &t.id.0)).unwrap();
        assert_eq!(guardada.as_ref(), Some(t));
    }

    #[test]
    fn ca_he_07_hu01_ca02() {
        // HE-07-HU01-CA02 · Todos los campos y etiquetas: los guarda tal cual (ET10, ET11, ET12, ET23).
        let servicio = con_semilla();
        let (a, b) = (etiqueta(&servicio, "Estudio"), etiqueta(&servicio, "Casa"));
        let descripcion = "d".repeat(DESCRIPCION_MAX);
        let r = crear(
            &servicio,
            CardCreateParams {
                r#type: Some(CardType::Event),
                description: Some(descripcion.clone()),
                priority: Some(Priority::High),
                label_ids: Some(vec![Uuid(a.clone()), Uuid(b.clone())]),
                ..params("Feria", "2026-11-20")
            },
        )
        .unwrap();
        assert_eq!(r.mensaje.message, "Tarjeta creada.");
        let t = r.valor;
        assert_eq!(t.r#type, CardType::Event);
        assert_eq!(t.description, Some(descripcion));
        assert_eq!(t.priority, Some(Priority::High));
        assert_eq!(t.column_id, Uuid(POR_HACER.into()));
        let mut etiquetas: Vec<String> = t.label_ids.into_iter().map(|u| u.0).collect();
        etiquetas.sort();
        let mut esperadas = vec![a.clone(), b];
        esperadas.sort();
        assert_eq!(etiquetas, esperadas);
        assert_eq!(
            contar(&servicio, "SELECT count(*) FROM card_label"),
            2,
            "una fila por etiqueta"
        );
        let union = id_de_card_label(&t.id.0, &a);
        assert_eq!(
            union,
            id_de_card_label(&t.id.0, &a),
            "el id de la unión es determinista"
        );
    }

    #[test]
    fn ca_he_07_hu01_ca03() {
        // HE-07-HU01-CA03 · Tipo Recordatorio o Evento: la tarjeta guarda el tipo indicado (ET15, ET22).
        for tipo in [CardType::Reminder, CardType::Event] {
            let servicio = con_semilla();
            let t = crear(
                &servicio,
                CardCreateParams {
                    r#type: Some(tipo.clone()),
                    ..params("Cita", "2026-11-14")
                },
            )
            .unwrap()
            .valor;
            assert_eq!(t.r#type, tipo);
        }
    }

    #[test]
    fn ca_he_07_hu01_ca04() {
        // HE-07-HU01-CA04 · Sin título ni fecha límite: «Este campo es obligatorio.» en los dos campos (ET17).
        let errores = validar_creacion(&params("", ""), CalendarioDePrueba::default().hoy());
        let campos: Vec<_> = errores
            .iter()
            .map(|e| (e.code.clone(), e.message.as_str(), e.field.as_deref()))
            .collect();
        assert_eq!(
            campos,
            [
                (
                    ErrorCode::TitleRequired,
                    "Este campo es obligatorio.",
                    Some("title")
                ),
                (
                    ErrorCode::DueDateRequired,
                    "Este campo es obligatorio.",
                    Some("due_date")
                ),
            ]
        );
        rechaza(
            params("", ""),
            ErrorCode::TitleRequired,
            "Este campo es obligatorio.",
            "title",
        );
    }

    #[test]
    fn ca_he_07_hu01_ca05() {
        // HE-07-HU01-CA05 · Título vacío o solo con espacios (ET07).
        for titulo in ["", "    "] {
            rechaza(
                params(titulo, "2026-11-14"),
                ErrorCode::TitleRequired,
                "Este campo es obligatorio.",
                "title",
            );
        }
    }

    #[test]
    fn ca_he_07_hu01_ca06() {
        // HE-07-HU01-CA06 · Título de 101 caracteres (ET18); 100 y 1 sí se aceptan (ET06).
        rechaza(
            params(&"t".repeat(101), "2026-11-14"),
            ErrorCode::TitleTooLong,
            "El título no puede superar los 100 caracteres.",
            "title",
        );
        let servicio = con_semilla();
        assert!(crear(&servicio, params(&"t".repeat(100), "2026-11-14")).is_ok());
        assert!(crear(&servicio, params("t", "2026-11-14")).is_ok());
    }

    #[test]
    fn ca_he_07_hu01_ca07() {
        // HE-07-HU01-CA07 · Sin fecha límite (vacía o solo espacios).
        for f in ["", "   "] {
            rechaza(
                params("Informe", f),
                ErrorCode::DueDateRequired,
                "Este campo es obligatorio.",
                "due_date",
            );
        }
    }

    #[test]
    fn ca_he_07_hu01_ca08() {
        // HE-07-HU01-CA08 · Fecha que no existe o con otro formato (ET09, ET19).
        for f in ["2026-02-31", "14/11/2026", "2026-11-1", "mañana"] {
            rechaza(
                params("Informe", f),
                ErrorCode::DueDateInvalid,
                "Diligencia una fecha válida.",
                "due_date",
            );
        }
    }

    #[test]
    fn ca_he_07_hu01_ca09() {
        // HE-07-HU01-CA09 · Fecha de ayer (ET20); hoy y mañana sí se aceptan (ET08).
        rechaza(
            params("Informe", "2026-11-13"),
            ErrorCode::DueDateInPast,
            "La fecha límite no puede ser anterior a hoy.",
            "due_date",
        );
        let servicio = con_semilla();
        assert!(crear(&servicio, params("Hoy", "2026-11-14")).is_ok());
        assert!(crear(&servicio, params("Mañana", "2026-11-15")).is_ok());
    }

    #[test]
    fn ca_he_07_hu01_ca10() {
        // HE-07-HU01-CA10 · Descripción de 1001 caracteres (ET21).
        rechaza(
            CardCreateParams {
                description: Some("d".repeat(1001)),
                ..params("Informe", "2026-11-14")
            },
            ErrorCode::DescriptionTooLong,
            "La descripción no puede superar los 1000 caracteres.",
            "description",
        );
    }

    #[test]
    fn ca_he_07_hu01_ca12() {
        // HE-07-HU01-CA12 · Sin conexión: el Núcleo no llama a la nube; guarda la tarjeta en el computador y
        // encola el cambio para sincronizarlo al volver la conexión (ET24, D-164).
        let servicio = con_semilla();
        let (a, _) = (etiqueta(&servicio, "Estudio"), ());
        let t = crear(
            &servicio,
            CardCreateParams {
                label_ids: Some(vec![Uuid(a.clone())]),
                ..params("Sin red", "2026-11-14")
            },
        )
        .unwrap();
        assert_eq!(t.mensaje.message, "Tarjeta creada.");
        let (kind, entity_id, op, fields): (String, String, String, String) = bloquear(async {
            sqlx::query_as(
                "SELECT entity_kind, entity_id, op, fields FROM pending_change WHERE entity_kind = 'card'",
            )
            .fetch_one(servicio.base().pool().await.unwrap())
            .await
            .unwrap()
        });
        assert_eq!((kind.as_str(), op.as_str()), ("card", "upsert"));
        assert_eq!(entity_id, t.valor.id.0);
        let fields: Value = serde_json::from_str(&fields).unwrap();
        assert_eq!(fields["title"]["value"], "Sin red");
        assert_eq!(fields["due_date"]["value"], "2026-11-14");
        assert_eq!(fields["column_id"]["value"], POR_HACER);
        assert_eq!(fields["title"]["modified_at"], "2026-11-14T12:00:00.000Z");
        assert!(
            fields.get("user_id").is_none(),
            "el cliente no envía user_id (RNF-21)"
        );
        assert_eq!(
            contar(
                &servicio,
                "SELECT count(*) FROM pending_change WHERE entity_kind = 'card_label'"
            ),
            1
        );
    }

    #[test]
    fn etiquetas_de_mas_o_inexistentes_no_crean_la_tarjeta() {
        // IPC-CARD-01: `labels.too_many` (HE-07-HU02-CA02) y `labels.not_found` (HE-07-HU02-ET03; RD-92).
        let servicio = con_semilla();
        let seis: Vec<Uuid> = (0..6)
            .map(|i| Uuid(etiqueta(&servicio, &format!("E{i}"))))
            .collect();
        let e = crear(
            &servicio,
            CardCreateParams {
                label_ids: Some(seis),
                ..params("Informe", "2026-11-14")
            },
        )
        .unwrap_err();
        assert_eq!(
            (e.code, e.message.as_str()),
            (
                ErrorCode::LabelsTooMany,
                "Puedes asignar máximo 5 etiquetas por tarjeta."
            )
        );
        let e = crear(
            &servicio,
            CardCreateParams {
                label_ids: Some(vec![Uuid(uuid::Uuid::new_v4().to_string())]),
                ..params("Informe", "2026-11-14")
            },
        )
        .unwrap_err();
        assert_eq!(
            (e.code, e.message.as_str()),
            (ErrorCode::LabelsNotFound, "Esta etiqueta ya no existe.")
        );
        assert_eq!(contar(&servicio, "SELECT count(*) FROM card"), 0);
    }

    #[test]
    fn las_etiquetas_se_listan_de_la_a_a_la_z() {
        // IPC-LABEL-01 (D-165): orden alfabético sin distinguir mayúsculas ni tildes.
        let servicio = con_semilla();
        for nombre in ["casa", "Árbol", "Bici", "zeta"] {
            etiqueta(&servicio, nombre);
        }
        let nombres: Vec<String> = bloquear(servicio.etiquetas(USUARIO))
            .unwrap()
            .into_iter()
            .map(|e| e.name)
            .collect();
        assert_eq!(nombres, ["Árbol", "Bici", "casa", "zeta"]);
        assert!(
            bloquear(servicio.etiquetas(OTRO_USUARIO))
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn la_tarjeta_va_a_la_columna_por_hacer_del_propio_usuario() {
        // RNF-21: cada usuario ve solo lo suyo; la tarjeta de otro usuario no se lee.
        let servicio = con_semilla();
        let t = crear(&servicio, params("Mía", "2026-11-14")).unwrap().valor;
        assert_eq!(
            bloquear(servicio.tarjeta(OTRO_USUARIO, &t.id.0)).unwrap(),
            None
        );
    }

    /// Inserta una tarjeta directamente en una columna (para fechas pasadas, que `card_create` no acepta).
    pub(crate) fn tarjeta_en(
        servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
        columna: &str,
        titulo: &str,
        fecha_limite: &str,
        posicion: f64,
    ) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        bloquear(async {
            sqlx::query(
                "INSERT INTO card (id, user_id, created_at, title, due_date, column_id, position) \
                 VALUES (?, ?, '2026-11-01T00:00:00.000Z', ?, ?, ?, ?)",
            )
            .bind(&id)
            .bind(USUARIO)
            .bind(titulo)
            .bind(fecha_limite)
            .bind(columna)
            .bind(posicion)
            .execute(servicio.base().pool().await.unwrap())
            .await
            .unwrap();
        });
        id
    }

    fn tablero(servicio: &ServicioDelPlanificador<CalendarioDePrueba>) -> Vec<BoardColumn> {
        bloquear(servicio.tablero(USUARIO)).unwrap().columns
    }

    #[test]
    fn ca_he_09_hu01_ca01() {
        // HE-09-HU01-CA01 · Sin tarjetas: Por hacer, En progreso y Hecho en ese orden (ET02), cada una con su
        // nombre, su color y 0 tarjetas (ET01).
        let columnas = tablero(&con_semilla());
        let vistas: Vec<_> = columnas
            .iter()
            .map(|c| {
                (
                    c.column.name.as_str(),
                    c.column.color_hex.0.as_str(),
                    c.column.card_count,
                    c.column.is_default,
                    c.cards.len(),
                )
            })
            .collect();
        assert_eq!(
            vistas,
            [
                ("Por hacer", "#9E9E9E", 0, true, 0),
                ("En progreso", "#2196F3", 0, true, 0),
                ("Hecho", "#4CAF50", 0, true, 0),
            ]
        );
        let roles: Vec<_> = columnas.iter().map(|c| c.column.role.clone()).collect();
        assert_eq!(
            roles,
            [ColumnRole::Todo, ColumnRole::InProgress, ColumnRole::Done]
        );
    }

    #[test]
    fn ca_he_09_hu01_ca02() {
        // HE-09-HU01-CA02 · 2 tarjetas en Por hacer y 1 en En progreso: cada una en su columna, por posición,
        // con título, fecha límite y prioridad (ET05), y las cantidades 2, 1 y 0.
        let servicio = con_semilla();
        tarjeta_en(&servicio, POR_HACER, "Segunda", "2026-11-20", 2048.0);
        tarjeta_en(&servicio, POR_HACER, "Primera", "2026-11-18", 1024.0);
        tarjeta_en(&servicio, EN_PROGRESO, "Tercera", "2026-11-19", 1024.0);
        let columnas = tablero(&servicio);
        let cantidades: Vec<i64> = columnas.iter().map(|c| c.column.card_count).collect();
        assert_eq!(cantidades, [2, 1, 0]);
        let titulos: Vec<Vec<&str>> = columnas
            .iter()
            .map(|c| c.cards.iter().map(|t| t.title.as_str()).collect())
            .collect();
        assert_eq!(
            titulos,
            [vec!["Primera", "Segunda"], vec!["Tercera"], vec![]]
        );
        assert_eq!(columnas[0].cards[0].due_date, DateIso("2026-11-18".into()));
    }

    #[test]
    fn ca_he_09_hu01_ca03() {
        // HE-09-HU01-CA03 · Tarjetas solo en Por hacer: las demás columnas llegan vacías (la vista pone el
        // texto «No hay tarjetas en esta columna.»).
        let servicio = con_semilla();
        tarjeta_en(&servicio, POR_HACER, "Sola", "2026-11-20", 1024.0);
        let vacias: Vec<bool> = tablero(&servicio)
            .iter()
            .map(|c| c.cards.is_empty())
            .collect();
        assert_eq!(vacias, [false, true, true]);
    }

    #[test]
    fn ca_he_09_hu01_ca04() {
        // HE-09-HU01-CA04 · Fecha límite anterior a hoy fuera de Hecho: vencida (ET06).
        let servicio = con_semilla();
        tarjeta_en(&servicio, EN_PROGRESO, "Atrasada", "2026-11-13", 1024.0);
        tarjeta_en(&servicio, POR_HACER, "A tiempo", "2026-11-14", 1024.0);
        let columnas = tablero(&servicio);
        assert!(columnas[1].cards[0].is_overdue);
        assert!(
            !columnas[0].cards[0].is_overdue,
            "la de hoy no está vencida"
        );
    }

    #[test]
    fn ca_he_09_hu01_ca05() {
        // HE-09-HU01-CA05 · Fecha límite anterior a hoy en Hecho: completada y sin «Vencida» (ET07).
        let servicio = con_semilla();
        tarjeta_en(&servicio, HECHO, "Hecha", "2026-11-01", 1024.0);
        let tarjeta = &tablero(&servicio)[2].cards[0];
        assert!(tarjeta.is_completed);
        assert!(!tarjeta.is_overdue);
    }

    /// Asigna un bloque horario directamente en la base (los bloques son de HE-11-HU02).
    pub(crate) fn con_bloque(
        servicio: &ServicioDelPlanificador<CalendarioDePrueba>,
        id: &str,
        fecha: &str,
        hora: i64,
    ) {
        bloquear(async {
            sqlx::query("UPDATE card SET scheduled_date = ?, scheduled_hour = ? WHERE id = ?")
                .bind(fecha)
                .bind(hora)
                .bind(id)
                .execute(servicio.base().pool().await.unwrap())
                .await
                .unwrap();
        });
    }

    #[test]
    fn ca_he_07_hu03_ca01() {
        // HE-07-HU03-CA01 · El detalle trae tipo, título, fecha límite, descripción, prioridad, etiquetas con su
        // color, la columna y el bloque horario (ET03).
        let servicio = con_semilla();
        let (casa, estudio) = (etiqueta(&servicio, "Casa"), etiqueta(&servicio, "Estudio"));
        let t = crear(
            &servicio,
            CardCreateParams {
                r#type: Some(CardType::Event),
                description: Some("Stand 4".into()),
                priority: Some(Priority::Medium),
                label_ids: Some(vec![Uuid(estudio.clone()), Uuid(casa.clone())]),
                ..params("Feria", "2026-11-20")
            },
        )
        .unwrap()
        .valor;
        con_bloque(&servicio, &t.id.0, "2026-11-16", 10);
        let d = bloquear(servicio.detalle(USUARIO, &t.id.0)).unwrap();
        assert_eq!(
            (
                d.base_card.r#type,
                d.base_card.title.as_str(),
                d.base_card.due_date.0.as_str()
            ),
            (CardType::Event, "Feria", "2026-11-20")
        );
        assert_eq!(d.base_card.description.as_deref(), Some("Stand 4"));
        assert_eq!(d.base_card.priority, Some(Priority::Medium));
        let etiquetas: Vec<_> = d
            .labels
            .iter()
            .map(|e| (e.name.as_str(), e.color_hex.0.as_str()))
            .collect();
        assert_eq!(etiquetas, [("Casa", "#2196F3"), ("Estudio", "#2196F3")]);
        assert_eq!(
            (d.column.name.as_str(), d.column.color_hex.0.as_str()),
            ("Por hacer", "#9E9E9E")
        );
        let bloque = d.time_block.unwrap();
        assert_eq!(
            (bloque.date.0.as_str(), bloque.hour.0, bloque.label.as_str()),
            ("2026-11-16", 10, "10:00 – 11:00")
        );
    }

    #[test]
    fn ca_he_07_hu03_ca02() {
        // HE-07-HU03-CA02 · Sin descripción, prioridad ni etiquetas (ni bloque): llegan vacíos y la vista
        // muestra «Sin descripción», «Sin prioridad» y «Sin etiquetas» (ET05).
        let servicio = con_semilla();
        let t = crear(&servicio, params("Simple", "2026-11-20"))
            .unwrap()
            .valor;
        let d = bloquear(servicio.detalle(USUARIO, &t.id.0)).unwrap();
        assert_eq!(
            (d.base_card.description, d.base_card.priority),
            (None, None)
        );
        assert!(d.labels.is_empty());
        assert_eq!(d.time_block, None);
    }

    #[test]
    fn ca_he_07_hu03_ca03() {
        // HE-07-HU03-CA03 · Fecha límite anterior a hoy y fuera de Hecho: vencida (ET06).
        let servicio = con_semilla();
        let id = tarjeta_en(&servicio, POR_HACER, "Atrasada", "2026-11-10", 1024.0);
        assert!(
            bloquear(servicio.detalle(USUARIO, &id))
                .unwrap()
                .base_card
                .is_overdue
        );
        let hecha = tarjeta_en(&servicio, HECHO, "Hecha", "2026-11-10", 1024.0);
        assert!(
            !bloquear(servicio.detalle(USUARIO, &hecha))
                .unwrap()
                .base_card
                .is_overdue
        );
    }

    #[test]
    fn el_detalle_de_una_tarjeta_que_ya_no_existe_es_card_not_found() {
        // DP-04: «Esta tarjeta ya no existe.»; tampoco se lee la tarjeta de otro usuario (RNF-21).
        let servicio = con_semilla();
        let e = bloquear(servicio.detalle(USUARIO, "00000000-0000-4000-8000-00000000ffff"))
            .unwrap_err();
        assert_eq!(
            (e.code, e.message.as_str()),
            (ErrorCode::CardNotFound, "Esta tarjeta ya no existe.")
        );
        let mia = crear(&servicio, params("Mía", "2026-11-20")).unwrap().valor;
        assert!(bloquear(servicio.detalle(OTRO_USUARIO, &mia.id.0)).is_err());
        assert_eq!(texto_del_bloque(23), "23:00 – 00:00");
    }
}
