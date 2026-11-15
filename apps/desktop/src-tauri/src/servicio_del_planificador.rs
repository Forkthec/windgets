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
    AgendaBlock, AgendaDay, AppError, BoardColumn, CatalogItem, LabelCreateParams, Card, CardAssignTimeBlockParams,
    CardCreateParams, CardDetail, CardDetailColumn, CardDetailLabelsItem, CardDetailTimeBlock,
    CardListBoardResult, CardMoveParams, CardType, CardUpdateParams, Column, ColumnRole, DateIso,
    ErrorCode, Hex, Hour, Instant, Label, Placement, PlannerItem, PlannerSummary, PlannerToday,
    Priority, ResultMessage, Uuid,
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
/// Distancia entre posiciones al poner una tarjeta al final de una columna. DUDA: HE-07-HU01 el paso no está
/// definido; se usa el del ejemplo de `contratos.md` (RPC-02, `position: 1024`).
pub const PASO_DE_POSICION: f64 = 1024.0;

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

fn error(code: ErrorCode, message: &str, field: Option<&str>) -> AppError {
    AppError {
        code,
        message: message.to_string(),
        field: field.map(str::to_string),
        params: None,
    }
}

fn inesperado() -> AppError {
    error(ErrorCode::InternalUnexpected, "", None)
}

fn de_sqlx(_: sqlx::Error) -> AppError {
    inesperado()
}

fn resultado(code: &str, message: &str) -> ResultMessage {
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
fn campos(valores: &[(&str, Value)], ahora: &str) -> (Value, Value) {
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
        let hoy = self.calendario.hoy();
        if let Some(primero) = validar_creacion(&params, hoy).into_iter().next() {
            return Err(primero);
        }
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;

        // DUDA: HE-07-HU01 la columna Por hacer llega con la primera descarga de la cuenta (sync_pull, P10);
        // sin ella no hay dónde crear la tarjeta y la respuesta es `internal.unexpected` (docs/DUDAS.md).
        let columna: String =
            sqlx::query_scalar("SELECT id FROM kanban_column WHERE user_id = ? AND role = 'todo'")
                .bind(user_id)
                .fetch_optional(&mut *tx)
                .await
                .map_err(de_sqlx)?
                .ok_or_else(inesperado)?;

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
                return Err(error(ErrorCode::LabelsNotFound, "", Some("label_ids")));
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
        encolar_cambio(&mut tx, "card", &id, "upsert", &fields, &ahora)
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
            encolar_cambio(&mut tx, "card_label", &union, "upsert", &fields, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        tx.commit().await.map_err(de_sqlx)?;

        let tarjeta = self.tarjeta(user_id, &id).await?.ok_or_else(inesperado)?;
        Ok(ConMensaje {
            valor: tarjeta,
            mensaje: resultado("card_create", messages::TARJETA_CREADA),
        })
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
        let id = params.id.0.to_lowercase();
        let actual = self
            .tarjeta(user_id, &id)
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

        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
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
            encolar_cambio(&mut tx, "card", &id, "upsert", &fields, &ahora)
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
                    return Err(error(ErrorCode::LabelsNotFound, "", Some("label_ids")));
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
                    &mut tx,
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
                encolar_cambio(&mut tx, "card_label", &union, "upsert", &fields, &ahora)
                    .await
                    .map_err(de_sqlx)?;
            }
        }
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

    /// IPC-CARD-03 `card_delete` (HE-07-HU05): elimina la tarjeta de forma definitiva (ET03) con sus etiquetas
    /// de tarjeta, y encola las eliminaciones en la misma transacción. Si ya no existe: `card.not_found`
    /// (DP-04).
    pub async fn eliminar_tarjeta(
        &self,
        user_id: &str,
        id: &str,
    ) -> Result<ConMensaje<()>, AppError> {
        let id = id.to_lowercase();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
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
            encolar_cambio(&mut tx, "card_label", union, "delete", &Value::Null, &ahora)
                .await
                .map_err(de_sqlx)?;
        }
        encolar_cambio(&mut tx, "card", &id, "delete", &Value::Null, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        Ok(ConMensaje {
            valor: (),
            mensaje: resultado("card_delete", messages::TARJETA_ELIMINADA),
        })
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
        let id = params.card_id.0.to_lowercase();
        let destino = params.column_id.0.to_lowercase();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
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
                // Sin texto: la vista solo ofrece columnas que existen.
                .ok_or_else(|| error(ErrorCode::ColumnNotFound, "", None))?;

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
        encolar_cambio(&mut tx, "card", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
        tx.commit().await.map_err(de_sqlx)?;
        self.tarjeta(user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)
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
        let nombre = params.name.trim().to_string();
        let color = params.color_id.trim().to_string();
        if nombre.is_empty() {
            return Err(error(ErrorCode::NameRequired, messages::CAMPO_OBLIGATORIO, Some("name")));
        }
        if nombre.chars().count() > NOMBRE_DE_ETIQUETA_MAX {
            return Err(error(
                ErrorCode::NameTooLong,
                messages::NOMBRE_DE_ETIQUETA_MUY_LARGO,
                Some("name"),
            ));
        }
        if color.is_empty() {
            return Err(error(ErrorCode::ColorRequired, messages::CAMPO_OBLIGATORIO, Some("color_id")));
        }
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;

        let existentes: Vec<String> = sqlx::query_scalar("SELECT name FROM label WHERE user_id = ?")
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
            return Err(error(ErrorCode::NameDuplicate, messages::ETIQUETA_DUPLICADA, Some("name")));
        }
        let existe_el_color: i64 =
            sqlx::query_scalar("SELECT count(*) FROM catalog_color WHERE id = ? AND is_active = 1")
                .bind(&color)
                .fetch_one(&mut *tx)
                .await
                .map_err(de_sqlx)?;
        if existe_el_color == 0 {
            // La vista solo ofrece colores del catálogo (ET05): uno que no está cuenta como sin color.
            return Err(error(ErrorCode::ColorRequired, messages::CAMPO_OBLIGATORIO, Some("color_id")));
        }

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
        encolar_cambio(&mut tx, "label", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
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
        let Some(fila) = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.id = ? AND c.user_id = ?"
        ))
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(de_sqlx)?
        else {
            return Ok(None);
        };
        let etiquetas: Vec<String> = sqlx::query_scalar(
            "SELECT label_id FROM card_label WHERE card_id = ? ORDER BY created_at, label_id",
        )
        .bind(id)
        .fetch_all(pool)
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
        let id = params.card_id.0.to_lowercase();
        let actual = self
            .tarjeta(user_id, &id)
            .await?
            .ok_or_else(tarjeta_no_existe)?;
        let dia = fecha(&params.date.0).ok_or_else(inesperado)?;
        let hora = params.hour.0;
        if hora > 23 {
            return Err(inesperado());
        }
        let hoy = self.calendario.hoy();
        // El bloque de las <hora> termina a las <hora + 1>: ya pasó si su hora de fin no es posterior a ahora.
        if dia < hoy || (dia == hoy && hora < self.calendario.hora()) {
            return Err(error(
                ErrorCode::TimeBlockPast,
                messages::BLOQUE_YA_PASO,
                None,
            ));
        }
        if fecha(&actual.due_date.0).is_some_and(|limite| dia > limite) {
            return Err(error(
                ErrorCode::TimeBlockAfterDueDate,
                messages::BLOQUE_DESPUES_DE_FECHA_LIMITE,
                None,
            ));
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
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
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
        encolar_cambio(&mut tx, "card", &id, "upsert", &fields, &ahora)
            .await
            .map_err(de_sqlx)?;
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

    /// IPC-CARD-08 `planner_get_today` (HE-12-HU01): las tarjetas con fecha límite hoy y las asignadas a un
    /// bloque de hoy, sin duplicados (ET02, ET08); primero las de bloque por hora y después las sin hora (ET03).
    /// La hora es la de inicio del bloque de hoy (ET05). El resumen cuenta las completadas (HE-12-HU03).
    pub async fn planificador_de_hoy(&self, user_id: &str) -> Result<PlannerToday, AppError> {
        let hoy = self.calendario.hoy().format("%Y-%m-%d").to_string();
        let pool = self.base.pool().await.map_err(de_sqlx)?;
        let filas = sqlx::query(&format!(
            "{SELECT_TARJETA} WHERE c.user_id = ? AND (c.due_date = ? OR c.scheduled_date = ?) \
             ORDER BY c.scheduled_date = ? DESC, c.scheduled_hour, c.position, c.created_at"
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
}

/// Las columnas de una tarjeta con la función de su columna (para «Vencida» y «completada»).
const SELECT_TARJETA: &str = "SELECT c.id, c.type, c.title, c.description, c.priority, c.due_date, \
     c.column_id, c.position, c.previous_column_id, c.completed_on, c.scheduled_date, \
     c.scheduled_hour, c.created_at, k.role AS column_role \
     FROM card c JOIN kanban_column k ON k.id = c.column_id";

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

#[cfg(test)]
mod pruebas_de_edicion;
#[cfg(test)]
mod pruebas_de_etiquetas;
#[cfg(test)]
mod pruebas_de_la_agenda;
#[cfg(test)]
mod pruebas_del_planificador_diario;
#[cfg(test)]
mod pruebas_del_tablero;

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

    /// Calendario de prueba: hoy es 14/11/2026.
    #[derive(Clone)]
    pub(crate) struct CalendarioDePrueba(pub Arc<AtomicI64>);

    impl Default for CalendarioDePrueba {
        fn default() -> Self {
            Self(Arc::new(AtomicI64::new(AHORA_MS)))
        }
    }

    impl Calendario for CalendarioDePrueba {
        fn hoy(&self) -> NaiveDate {
            NaiveDate::from_ymd_opt(2026, 11, 14).unwrap_or_default()
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
        // IPC-CARD-01: `labels.too_many` (HE-07-HU02-CA02) y `labels.not_found` sin texto (HE-07-HU02-ET03).
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
            (ErrorCode::LabelsNotFound, "")
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
