//! El manejador de propuestas sobre el planificador (HE-14-HU03): lee el estado actual de las tarjetas y aplica
//! cada acción con las mismas reglas de `card_*`. Cada acción llega con su HU: crear (HE-14-HU04), editar
//! (HE-14-HU05), mover (HE-14-HU06) y eliminar (HE-14-HU07); y crear etiquetas (HE-14-HU10, P29).
//!
//! HE-14-HU03-ET10: si una propuesta no se puede preparar, el motivo es un error de negocio con su código estable y
//! el texto que Windi muestra en el chat. HE-14-HU03-ET12: una propuesta se aplica completa, en una sola
//! transacción, o no se aplica.

use serde_json::{Map, Value, json};

use super::ManejadorDePropuestas;
use crate::messages;
use crate::servicio_del_planificador::{
    Calendario, ETIQUETAS_POR_USUARIO_MAX, NOMBRE_DE_ETIQUETA_MAX, ServicioDelPlanificador,
    clave_alfabetica, de_sqlx, error, inesperado, validar_cantidad_de_etiquetas, validar_creacion,
    validar_descripcion, validar_fecha_limite, validar_titulo,
};
use crate::tipos::{
    AppError, Card, CardCreateParams, CardMoveParams, CardPatch, CardType, CardUpdateParams,
    CatalogItem, Column, ColumnRole, ErrorCode, Label, LabelCreateParams, Placement,
    PlacementVariant1, PlacementVariant1Kind, ProposalAction, ProposalState, Uuid,
    WindiChatProposal, WindiProposal, WindiProposalItem,
};

/// Por qué no se puede preparar una propuesta (HE-14-HU03-ET10): el código estable y el texto que ve la persona.
pub type MotivoDeRechazo = AppError;

/// Los campos de una tarjeta que se comparan para saber si una propuesta quedó desactualizada (HE-14-HU03-ET05:
/// «no cambiaron en ningún dato»).
pub fn estado_de_la_tarjeta(tarjeta: &Card) -> Value {
    json!({
        "type": tarjeta.r#type,
        "title": tarjeta.title,
        "description": tarjeta.description,
        "priority": tarjeta.priority,
        "due_date": tarjeta.due_date,
        "column_id": tarjeta.column_id,
        "label_ids": tarjeta.label_ids,
        "scheduled_date": tarjeta.scheduled_date,
        "scheduled_hour": tarjeta.scheduled_hour,
        "time_block": match (&tarjeta.scheduled_date, &tarjeta.scheduled_hour) {
            (Some(dia), Some(hora)) => bloque_visible(&dia.0, hora.0),
            _ => Value::Null,
        },
        "completed_on": tarjeta.completed_on,
    })
}

/// El bloque horario como lo muestra la propuesta (WindiProposal, contratos.md): `{ date, start_hour, end_hour }`.
/// Cada bloque dura una hora (HE-11-HU01).
fn bloque_visible(dia: &str, hora: u8) -> Value {
    json!({ "date": dia, "start_hour": hora, "end_hour": (hora + 1) % 24 })
}

/// El bloque horario pedido por Windi: `null` lo quita y `{ date, start_hour }` lo asigna (HE-14-HU04-CA10;
/// HE-14-HU05-CA11, CA12). Un bloque que no se entiende es una propuesta inválida.
fn bloque_pedido(valor: &Value) -> Result<Option<(chrono::NaiveDate, u8)>, AppError> {
    if valor.is_null() {
        return Ok(None);
    }
    let dia = valor
        .get("date")
        .and_then(Value::as_str)
        .and_then(crate::servicio_del_planificador::fecha)
        .ok_or_else(inesperado)?;
    let hora = valor
        .get("start_hour")
        .and_then(Value::as_u64)
        .and_then(|h| u8::try_from(h).ok())
        .filter(|h| *h <= 23)
        .ok_or_else(inesperado)?;
    if valor
        .get("end_hour")
        .and_then(Value::as_u64)
        .is_some_and(|fin| fin != u64::from((hora + 1) % 24))
    {
        return Err(inesperado());
    }
    Ok(Some((dia, hora)))
}

fn motivo(code: ErrorCode, texto: &str) -> MotivoDeRechazo {
    error(code, texto, None)
}

/// Asigna o quita el bloque horario con las reglas de `card_assign_time_block` y `card_unassign_time_block`
/// (HE-11-HU02, HE-11-HU03), dentro de la transacción de la propuesta.
async fn aplicar_bloque<C: Calendario>(
    planificador: &ServicioDelPlanificador<C>,
    tx: &mut sqlx::SqliteConnection,
    user_id: &str,
    id: &str,
    bloque: &Value,
) -> Result<(), AppError> {
    match bloque_pedido(bloque)? {
        Some((dia, hora)) => {
            planificador
                .asignar_bloque_en(
                    tx,
                    user_id,
                    crate::tipos::CardAssignTimeBlockParams {
                        card_id: Uuid(id.to_string()),
                        date: crate::tipos::DateIso(dia.format("%Y-%m-%d").to_string()),
                        hour: crate::tipos::Hour(hora),
                    },
                )
                .await?;
        }
        None => {
            planificador
                .quitar_bloque_en(
                    tx,
                    user_id,
                    crate::tipos::CardUnassignTimeBlockParams {
                        card_id: Uuid(id.to_string()),
                    },
                )
                .await?;
        }
    }
    Ok(())
}

/// La columna por su id o por su nombre, sin distinguir mayúsculas ni tildes (HE-14-HU06-ET13). Si no existe,
/// `windi.column_not_found` con las columnas en su orden (HE-14-HU03-CA06).
fn buscar_columna<'c>(columnas: &'c [Column], referencia: &str) -> Result<&'c Column, AppError> {
    let id = referencia.trim().to_lowercase();
    let clave = clave_alfabetica(referencia);
    columnas
        .iter()
        .find(|c| c.id.0.to_lowercase() == id)
        .or_else(|| columnas.iter().find(|c| clave_alfabetica(&c.name) == clave))
        .ok_or_else(|| {
            let nombres: Vec<&str> = columnas.iter().map(|c| c.name.as_str()).collect();
            motivo(
                ErrorCode::WindiColumnNotFound,
                &messages::WINDI_COLUMNA_NO_ENCONTRADA
                    .replace("<columna>", referencia.trim())
                    .replace("<columnas en orden>", &nombres.join(", ")),
            )
        })
}

/// Las etiquetas pedidas, por su id o por su nombre, como ids. Si una no existe, `windi.label_not_found` con las
/// etiquetas del usuario (HE-14-HU05-CA10); Windi no crea etiquetas (HE-14-HU04-ET08).
fn resolver_etiquetas(etiquetas: &[Label], pedidas: &Value) -> Result<Value, AppError> {
    let Some(pedidas) = pedidas.as_array() else {
        return Ok(pedidas.clone());
    };
    let mut ids = Vec::new();
    for pedida in pedidas {
        let texto = pedida.as_str().ok_or_else(inesperado)?;
        let id = texto.trim().to_lowercase();
        let clave = clave_alfabetica(texto);
        let encontrada = etiquetas
            .iter()
            .find(|e| e.id.0.to_lowercase() == id)
            .or_else(|| {
                etiquetas
                    .iter()
                    .find(|e| clave_alfabetica(&e.name) == clave)
            })
            .ok_or_else(|| {
                let nombres: Vec<&str> = etiquetas.iter().map(|e| e.name.as_str()).collect();
                motivo(
                    ErrorCode::WindiLabelNotFound,
                    &messages::WINDI_ETIQUETA_NO_ENCONTRADA
                        .replace("<etiqueta>", texto.trim())
                        .replace("<etiquetas>", &nombres.join(", ")),
                )
            })?;
        let id = Value::from(encontrada.id.0.to_lowercase());
        if !ids.contains(&id) {
            ids.push(id);
        }
    }
    Ok(Value::Array(ids))
}

/// Los datos pedidos por Windi, listos para las reglas de `card_*`: la prioridad y la descripción vacías se quitan
/// (`null`, HE-14-HU05-ET12) y las etiquetas se buscan por id o por nombre.
fn normalizar(
    cambios: Option<&Value>,
    etiquetas: &[Label],
) -> Result<Map<String, Value>, AppError> {
    let mut mapa = cambios
        .and_then(Value::as_object)
        .cloned()
        .ok_or_else(inesperado)?;
    for campo in ["priority", "description"] {
        if mapa
            .get(campo)
            .and_then(Value::as_str)
            .is_some_and(|texto| texto.trim().is_empty())
        {
            mapa.insert(campo.to_string(), Value::Null);
        }
    }
    if let Some(pedidas) = mapa.get("label_ids").cloned() {
        mapa.insert(
            "label_ids".to_string(),
            resolver_etiquetas(etiquetas, &pedidas)?,
        );
    }
    Ok(mapa)
}

/// HE-14-HU04-ET12: con varias tarjetas, el texto nombra cada una que no es válida con su motivo; con una sola, es
/// el motivo.
fn unir_motivos(motivos: Vec<(Option<String>, AppError)>, tarjetas: usize) -> MotivoDeRechazo {
    let code = motivos
        .first()
        .map_or(ErrorCode::InternalUnexpected, |(_, e)| e.code.clone());
    let texto = if tarjetas == 1 {
        motivos
            .into_iter()
            .map(|(_, e)| e.message)
            .next()
            .unwrap_or_default()
    } else {
        motivos
            .into_iter()
            .map(|(titulo, e)| match titulo {
                Some(titulo) => format!("“{titulo}”: {}", e.message),
                None => e.message,
            })
            .collect::<Vec<_>>()
            .join(" ")
    };
    motivo(code, &texto)
}

/// HE-14-HU10 (P29): una etiqueta que propone Windi, con las reglas de «Nueva etiqueta» (HE-08-HU02) y el color
/// del catálogo por su id o su nombre. `tomados` son los nombres ya usados, sin mayúsculas.
fn validar_etiqueta<'c>(
    nombre: &str,
    pedido: &str,
    tomados: &[String],
    colores: &'c [CatalogItem],
) -> Result<&'c CatalogItem, AppError> {
    let lista = || {
        colores
            .iter()
            .map(|c| c.name.as_str())
            .collect::<Vec<_>>()
            .join(", ")
    };
    // CA03: sin nombre, Windi lo pide.
    if nombre.is_empty() {
        return Err(motivo(
            ErrorCode::NameRequired,
            messages::WINDI_NOMBRE_DE_LA_ETIQUETA,
        ));
    }
    // CA04, CA05: las mismas reglas y los mismos textos que la pantalla Etiquetas.
    if nombre.chars().count() > NOMBRE_DE_ETIQUETA_MAX {
        return Err(motivo(
            ErrorCode::NameTooLong,
            messages::NOMBRE_DE_ETIQUETA_MUY_LARGO,
        ));
    }
    if tomados.contains(&nombre.to_lowercase()) {
        return Err(motivo(
            ErrorCode::NameDuplicate,
            messages::ETIQUETA_DUPLICADA,
        ));
    }
    // CA02: el color es obligatorio y no tiene valor por defecto (D-162); Windi lo pregunta con los colores.
    if pedido.is_empty() {
        return Err(motivo(
            ErrorCode::WindiLabelColorRequired,
            &messages::WINDI_COLOR_DE_LA_ETIQUETA
                .replace("<nombre>", nombre)
                .replace("<colores>", &lista()),
        ));
    }
    let clave = clave_alfabetica(pedido);
    colores
        .iter()
        .find(|c| c.id.eq_ignore_ascii_case(pedido))
        .or_else(|| colores.iter().find(|c| clave_alfabetica(&c.name) == clave))
        .ok_or_else(|| {
            // CA08: un color que no está en el catálogo.
            motivo(
                ErrorCode::WindiColorNotFound,
                &messages::WINDI_COLOR_NO_ENCONTRADO
                    .replace("<color>", pedido)
                    .replace("<colores>", &lista()),
            )
        })
}

/// Los datos de una tarjeta nueva ya preparada, con el tipo Tarea si no se indicó otro (HE-14-HU04-ET02).
fn datos_de_creacion(cambios: Option<&Value>) -> Result<CardCreateParams, AppError> {
    let mut params: CardCreateParams =
        serde_json::from_value(cambios.ok_or_else(inesperado)?.clone())
            .map_err(|_| inesperado())?;
    params.r#type.get_or_insert(CardType::Task);
    Ok(params)
}

pub struct ManejadorDelPlanificador<'a, C: Calendario> {
    pub planificador: &'a ServicioDelPlanificador<C>,
    pub user_id: &'a str,
    pub alias: &'a str,
}

impl<C: Calendario> ManejadorDePropuestas for ManejadorDelPlanificador<'_, C> {
    async fn preparar(&self, propuesta: &WindiChatProposal) -> Result<WindiProposal, AppError> {
        match propuesta.action {
            ProposalAction::Create => self.preparar_creacion(propuesta).await,
            ProposalAction::Edit => self.preparar_edicion(propuesta).await,
            ProposalAction::Move => self.preparar_movimiento(propuesta).await,
            ProposalAction::Delete => self.preparar_eliminacion(propuesta).await,
            ProposalAction::CreateLabel => self.preparar_etiquetas(propuesta).await,
        }
    }

    async fn actual(&self, card_id: &str) -> Result<Option<Value>, AppError> {
        Ok(self
            .planificador
            .tarjeta(self.user_id, card_id)
            .await?
            .map(|t| estado_de_la_tarjeta(&t)))
    }

    /// HE-14-HU03-ET12: todo en una transacción; si una tarjeta falla, no se guarda ninguna.
    async fn aplicar(&self, propuesta: &WindiProposal) -> Result<Option<String>, AppError> {
        let pool = self.planificador.base().pool().await.map_err(de_sqlx)?;
        let mut tx = pool.begin().await.map_err(de_sqlx)?;
        let texto = match propuesta.action {
            ProposalAction::Create => self.aplicar_creacion(&mut tx, propuesta).await?,
            ProposalAction::Edit => self.aplicar_edicion(&mut tx, propuesta).await?,
            ProposalAction::Move => self.aplicar_movimiento(&mut tx, propuesta).await?,
            ProposalAction::Delete => self.aplicar_eliminacion(&mut tx, propuesta).await?,
            ProposalAction::CreateLabel => self.aplicar_etiquetas(&mut tx, propuesta).await?,
        };
        tx.commit().await.map_err(de_sqlx)?;
        Ok(Some(texto))
    }
}

impl<C: Calendario> ManejadorDelPlanificador<'_, C> {
    /// HE-14-HU03-ET10: la tarjeta por su id o, si no, por su título exacto sin mayúsculas ni tildes cuando coincide
    /// una sola. Si no, `windi.card_not_found` con el nombre recibido (HE-14-HU07-CA07).
    async fn buscar_tarjeta(&self, referencia: Option<&Uuid>) -> Result<Card, AppError> {
        let referencia = referencia.ok_or_else(inesperado)?.0.trim();
        if let Some(tarjeta) = self
            .planificador
            .tarjeta(self.user_id, &referencia.to_lowercase())
            .await?
        {
            return Ok(tarjeta);
        }
        let clave = clave_alfabetica(referencia);
        let mut iguales = self
            .planificador
            .tablero(self.user_id)
            .await?
            .columns
            .into_iter()
            .flat_map(|c| c.cards)
            .filter(|t| clave_alfabetica(&t.title) == clave);
        match (iguales.next(), iguales.next()) {
            (Some(tarjeta), None) => Ok(tarjeta),
            _ => Err(motivo(
                ErrorCode::WindiCardNotFound,
                &messages::WINDI_TARJETA_NO_ENCONTRADA.replace("<nombre>", referencia),
            )),
        }
    }

    /// HE-14-HU04: una propuesta de creación con una o varias tarjetas (ET07). Cada una cumple las reglas de
    /// HE-07-HU01 (ET09): título y fecha límite obligatorios (ET05), fecha límite no anterior a hoy (ET06) y solo
    /// etiquetas que existen (ET08). Si una no las cumple, no hay propuesta y el motivo nombra cada tarjeta no
    /// válida (ET12; CA11).
    async fn preparar_creacion(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<WindiProposal, AppError> {
        let hoy = self.planificador.hoy();
        let etiquetas = self.planificador.etiquetas(self.user_id).await?;
        let mut items = Vec::new();
        let mut motivos = Vec::new();
        for item in &propuesta.items {
            let cambios = item.changes.as_ref();
            let texto_de = |campo: &str| {
                cambios
                    .and_then(|c| c.get(campo))
                    .and_then(Value::as_str)
                    .map(str::trim)
                    .filter(|t| !t.is_empty())
                    .map(str::to_string)
            };
            // DUDA: HE-14-HU04 no define el texto cuando falta el título o la fecha (docs/DUDAS.md).
            let Some(titulo) = texto_de("title") else {
                motivos.push((
                    None,
                    motivo(ErrorCode::TitleRequired, messages::WINDI_FALTA_TITULO),
                ));
                continue;
            };
            if texto_de("due_date").is_none() {
                motivos.push((
                    None,
                    motivo(
                        ErrorCode::DueDateRequired,
                        &messages::WINDI_FALTA_FECHA.replace("<título>", &titulo),
                    ),
                ));
                continue;
            }
            let mut mapa = match normalizar(cambios, &etiquetas) {
                Ok(mapa) => mapa,
                Err(e) if e.code == ErrorCode::InternalUnexpected => return Err(e),
                Err(e) => {
                    motivos.push((Some(titulo), e));
                    continue;
                }
            };
            let bloque = mapa.remove("time_block").unwrap_or(Value::Null);
            let params = datos_de_creacion(Some(&Value::Object(mapa)))?;
            if let Some(primero) = validar_creacion(&params, hoy).into_iter().next() {
                motivos.push((Some(titulo), primero));
                continue;
            }
            // HE-14-HU04-ET11: el bloque horario cumple las reglas de HE-11-HU02.
            let bloque = match bloque_pedido(&bloque)? {
                Some((dia, hora)) => {
                    if let Some(e) = self
                        .planificador
                        .validar_bloque(dia, hora, &params.due_date.0)
                    {
                        motivos.push((Some(titulo), e));
                        continue;
                    }
                    bloque_visible(&dia.format("%Y-%m-%d").to_string(), hora)
                }
                None => Value::Null,
            };
            let mut datos = serde_json::to_value(&params).map_err(|_| inesperado())?;
            if !bloque.is_null()
                && let Some(datos) = datos.as_object_mut()
            {
                datos.insert("time_block".to_string(), bloque);
            }
            items.push(WindiProposalItem {
                card_id: None,
                current: None,
                title: params.title.trim().to_string(),
                changes: Some(datos),
            });
        }
        if !motivos.is_empty() {
            return Err(unir_motivos(motivos, propuesta.items.len()));
        }
        if items.is_empty() {
            return Err(inesperado());
        }
        Ok(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Create,
            items,
            warnings: Vec::new(),
            state: ProposalState::Active,
        })
    }

    /// HE-14-HU05: la propuesta de editar una o varias tarjetas (ET10), cada una con el valor actual y el nuevo de
    /// cada dato que cambia (ET01). Sin propuesta si una tarjeta no existe (ET08), si ningún dato cambia (ET09) o si
    /// un dato no cumple las reglas de HE-07-HU04 (ET04, ET07) o de HE-11 (ET13); el motivo va al chat
    /// (HE-14-HU03-ET10). La prioridad, la descripción y el bloque horario se pueden quitar (ET12). Agregar o quitar
    /// etiquetas conserva las demás (ET11). `current` guarda el estado completo (HE-14-HU03-ET05). Una tarjeta
    /// completada lleva el aviso de ET05.
    async fn preparar_edicion(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<WindiProposal, AppError> {
        // Las llamadas sobre la misma tarjeta (por ejemplo, editar y etiquetar) se juntan.
        let mut pedidos: Vec<(Uuid, Map<String, Value>)> = Vec::new();
        for item in &propuesta.items {
            let referencia = item.card_id.clone().ok_or_else(inesperado)?;
            let cambios = item
                .changes
                .as_ref()
                .and_then(Value::as_object)
                .cloned()
                .ok_or_else(inesperado)?;
            match pedidos.iter_mut().find(|(r, _)| *r == referencia) {
                Some((_, previos)) => previos.extend(cambios),
                None => pedidos.push((referencia, cambios)),
            }
        }
        if pedidos.is_empty() {
            return Err(inesperado());
        }
        let etiquetas = self.planificador.etiquetas(self.user_id).await?;
        let mut items = Vec::new();
        let mut motivos = Vec::new();
        let mut alguna_completada = false;
        for (referencia, cambios) in pedidos {
            let tarjeta = match self.buscar_tarjeta(Some(&referencia)).await {
                Ok(tarjeta) => tarjeta,
                Err(e) if e.code == ErrorCode::InternalUnexpected => return Err(e),
                Err(e) => {
                    motivos.push((None, e));
                    continue;
                }
            };
            match self.editar_una(&tarjeta, cambios, &etiquetas) {
                Ok(despues) => {
                    alguna_completada |= tarjeta.is_completed;
                    items.push(WindiProposalItem {
                        card_id: Some(tarjeta.id.clone()),
                        current: Some(estado_de_la_tarjeta(&tarjeta)),
                        changes: Some(Value::Object(despues)),
                        title: tarjeta.title.clone(),
                    });
                }
                Err(e) if e.code == ErrorCode::InternalUnexpected => return Err(e),
                // El texto de «ya tiene ese valor» ya nombra la tarjeta.
                Err(e) if e.code == ErrorCode::WindiSameValue => motivos.push((None, e)),
                Err(e) => motivos.push((Some(tarjeta.title.clone()), e)),
            }
        }
        if !motivos.is_empty() {
            let total = items.len() + motivos.len();
            return Err(unir_motivos(motivos, total));
        }
        Ok(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Edit,
            items,
            warnings: if alguna_completada {
                vec![messages::WINDI_EDITAR_COMPLETADA.to_string()]
            } else {
                Vec::new()
            },
            state: ProposalState::Active,
        })
    }

    /// Los datos que cambian en una tarjeta, ya validados (HE-14-HU05-ET01, ET04, ET07, ET11 a ET14).
    fn editar_una(
        &self,
        tarjeta: &Card,
        mut cambios: Map<String, Value>,
        etiquetas: &[Label],
    ) -> Result<Map<String, Value>, AppError> {
        // ET11: agregar o quitar etiquetas por su nombre conserva las demás.
        let agregar = cambios.remove("add_labels");
        let quitar = cambios.remove("remove_labels");
        if agregar.is_some() || quitar.is_some() {
            let mut ids: Vec<Value> = tarjeta
                .label_ids
                .iter()
                .map(|u| Value::from(u.0.to_lowercase()))
                .collect();
            if let Some(quitar) = quitar {
                let quitar = resolver_etiquetas(etiquetas, &quitar)?;
                ids.retain(|id| !quitar.as_array().is_some_and(|q| q.contains(id)));
            }
            if let Some(agregar) = agregar {
                let agregar = resolver_etiquetas(etiquetas, &agregar)?;
                for id in agregar.as_array().into_iter().flatten() {
                    if !ids.contains(id) {
                        ids.push(id.clone());
                    }
                }
            }
            cambios.insert("label_ids".to_string(), Value::Array(ids));
        }
        let bloque = cambios.remove("time_block");
        let mapa = normalizar(Some(&Value::Object(cambios)), etiquetas)?;
        let patch: CardPatch =
            serde_json::from_value(Value::Object(mapa)).map_err(|_| inesperado())?;
        // Solo los datos que cambian.
        let actual = estado_de_la_tarjeta(tarjeta);
        let pedido = serde_json::to_value(&patch).map_err(|_| inesperado())?;
        let mut despues = Map::new();
        for (campo, valor) in pedido.as_object().into_iter().flatten() {
            let valor = match valor {
                Value::String(texto) => Value::from(texto.trim()),
                otro => otro.clone(),
            };
            if actual.get(campo).cloned().unwrap_or(Value::Null) != valor {
                despues.insert(campo.clone(), valor);
            }
        }
        if let Some(bloque) = bloque {
            let pedido = match bloque_pedido(&bloque)? {
                Some((dia, hora)) => bloque_visible(&dia.format("%Y-%m-%d").to_string(), hora),
                None => Value::Null,
            };
            if actual["time_block"] != pedido {
                despues.insert("time_block".to_string(), pedido);
            }
        }
        // P27 (C7): una fecha límite anterior al bloque lo quita al aplicar (HE-11 ET12, ET13; misma regla que
        // `servicio_del_planificador`); la propuesta lo muestra para que la persona lo vea antes de confirmar.
        let sale_del_bloque = !despues.contains_key("time_block")
            && match (
                despues.get("due_date").and_then(Value::as_str),
                tarjeta.scheduled_date.as_ref(),
            ) {
                (Some(nueva), Some(dia)) => dia.0.as_str() > nueva,
                _ => false,
            };
        if sale_del_bloque {
            despues.insert("time_block".to_string(), Value::Null);
        }
        if despues.is_empty() {
            return Err(motivo(
                ErrorCode::WindiSameValue,
                &messages::WINDI_MISMO_VALOR.replace("<título>", &tarjeta.title),
            ));
        }
        let mut sin_bloque = despues.clone();
        let bloque = sin_bloque.remove("time_block");
        let patch: CardPatch =
            serde_json::from_value(Value::Object(sin_bloque)).map_err(|_| inesperado())?;
        let hoy = self.planificador.hoy();
        let errores = [
            patch.title.as_deref().and_then(validar_titulo),
            patch
                .due_date
                .as_ref()
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
        // ET13: el bloque horario cumple las reglas de HE-11-HU02 con la fecha límite que quedará.
        if let Some((dia, hora)) = bloque.as_ref().map(bloque_pedido).transpose()?.flatten() {
            let limite = patch
                .due_date
                .as_ref()
                .map_or(tarjeta.due_date.0.as_str(), |f| f.0.as_str());
            if let Some(e) = self.planificador.validar_bloque(dia, hora, limite) {
                return Err(e);
            }
        }
        Ok(despues)
    }

    /// HE-14-HU06: mover una o varias tarjetas (ET12) a otra columna, que se reconoce por su id o por su nombre (ET13). Sin propuesta
    /// si una tarjeta o la columna no existen (ET08, ET10) o si ya está en esa columna (ET11); el motivo va al chat.
    /// `current` guarda el estado completo (HE-14-HU03-ET05) y los nombres de las columnas van en `changes` para
    /// mostrarlos (ET01).
    async fn preparar_movimiento(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<WindiProposal, AppError> {
        if propuesta.items.is_empty() {
            return Err(inesperado());
        }
        let columnas = self.planificador.columnas(self.user_id).await?;
        let mut items: Vec<WindiProposalItem> = Vec::new();
        let mut motivos = Vec::new();
        let mut sale_de_hecho = false;
        for item in &propuesta.items {
            let destino = item
                .changes
                .as_ref()
                .and_then(|c| c.get("column_id"))
                .and_then(Value::as_str)
                .ok_or_else(inesperado)?;
            // Una columna que no existe vale para toda la propuesta: el texto ya lista las que hay (ET10).
            let llegada = buscar_columna(&columnas, destino)?;
            let tarjeta = match self.buscar_tarjeta(item.card_id.as_ref()).await {
                Ok(tarjeta) => tarjeta,
                Err(e) if e.code == ErrorCode::InternalUnexpected => return Err(e),
                Err(e) => {
                    motivos.push((None, e));
                    continue;
                }
            };
            if items
                .iter()
                .any(|i| i.card_id.as_ref() == Some(&tarjeta.id))
            {
                continue;
            }
            let origen = columnas
                .iter()
                .find(|c| c.id.0.to_lowercase() == tarjeta.column_id.0.to_lowercase())
                .ok_or_else(inesperado)?;
            if origen.id == llegada.id {
                // El texto ya nombra la tarjeta.
                motivos.push((
                    None,
                    motivo(
                        ErrorCode::WindiAlreadyInColumn,
                        &messages::WINDI_YA_ESTA_EN_LA_COLUMNA
                            .replace("<título>", &tarjeta.title)
                            .replace("<columna>", &llegada.name),
                    ),
                ));
                continue;
            }
            // ET02, ET12: el aviso si alguna sale de Hecho.
            sale_de_hecho |= origen.role == ColumnRole::Done && llegada.role != ColumnRole::Done;
            items.push(WindiProposalItem {
                card_id: Some(tarjeta.id.clone()),
                current: Some(estado_de_la_tarjeta(&tarjeta)),
                changes: Some(json!({
                    "column_id": llegada.id,
                    "from_column": origen.name,
                    "to_column": llegada.name,
                })),
                title: tarjeta.title.clone(),
            });
        }
        if !motivos.is_empty() {
            let total = items.len() + motivos.len();
            return Err(unir_motivos(motivos, total));
        }
        Ok(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Move,
            items,
            warnings: if sale_de_hecho {
                vec![messages::WINDI_MOVER_COMPLETADA.to_string()]
            } else {
                Vec::new()
            },
            state: ProposalState::Active,
        })
    }

    /// HE-14-HU07: eliminar una o varias tarjetas (ET02). Si alguna no existe, no hay propuesta y Windi dice cuál
    /// (ET06; CA07). Siempre lleva el aviso de que no se puede deshacer (ET01) y, si alguna está completada, el
    /// texto de ET04. `current` guarda el estado completo (HE-14-HU03-ET05).
    async fn preparar_eliminacion(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<WindiProposal, AppError> {
        let mut items: Vec<WindiProposalItem> = Vec::new();
        let mut alguna_completada = false;
        for item in &propuesta.items {
            let tarjeta = self.buscar_tarjeta(item.card_id.as_ref()).await?;
            if items
                .iter()
                .any(|i| i.card_id.as_ref() == Some(&tarjeta.id))
            {
                continue;
            }
            alguna_completada |= tarjeta.is_completed;
            items.push(WindiProposalItem {
                card_id: Some(tarjeta.id.clone()),
                current: Some(estado_de_la_tarjeta(&tarjeta)),
                changes: None,
                title: tarjeta.title.clone(),
            });
        }
        if items.is_empty() {
            return Err(inesperado());
        }
        let mut warnings = vec![messages::WINDI_ELIMINAR_SIN_DESHACER.to_string()];
        if alguna_completada {
            warnings.push(messages::WINDI_ELIMINAR_COMPLETADA.to_string());
        }
        Ok(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Delete,
            items,
            warnings,
            state: ProposalState::Active,
        })
    }

    /// HE-14-HU10 (P29): valida cada etiqueta (CA02 a CA06, CA08) y muestra su nombre y su color. Con varias, el
    /// texto nombra cada una que no es válida (como HE-14-HU04-ET12).
    async fn preparar_etiquetas(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<WindiProposal, AppError> {
        let existentes = self.planificador.etiquetas(self.user_id).await?;
        let colores = self.planificador.colores().await?;
        let mut tomados: Vec<String> = existentes
            .iter()
            .map(|e| e.name.trim().to_lowercase())
            .collect();
        let mut items = Vec::new();
        let mut motivos = Vec::new();
        for item in &propuesta.items {
            let cambios = item.changes.as_ref().and_then(Value::as_object);
            let texto = |campo: &str| {
                cambios
                    .and_then(|c| c.get(campo))
                    .and_then(Value::as_str)
                    .map_or(String::new(), |t| t.trim().to_string())
            };
            let nombre = texto("name");
            // Al confirmar se vuelve a validar la propuesta ya preparada, que guarda `color_id` (HE-14-HU03-ET13).
            let pedido = Some(texto("color"))
                .filter(|c| !c.is_empty())
                .unwrap_or_else(|| texto("color_id"));
            match validar_etiqueta(&nombre, &pedido, &tomados, &colores) {
                Ok(color) => {
                    tomados.push(nombre.to_lowercase());
                    items.push(WindiProposalItem {
                        card_id: None,
                        current: None,
                        changes: Some(json!({
                            "name": nombre,
                            "color_id": color.id,
                            "color_name": color.name,
                            "hex": color.hex,
                        })),
                        title: nombre,
                    });
                }
                Err(e) => motivos.push(((!nombre.is_empty()).then_some(nombre), e)),
            }
        }
        if !motivos.is_empty() {
            return Err(unir_motivos(motivos, propuesta.items.len()));
        }
        if items.is_empty() {
            return Err(inesperado());
        }
        // CA06: el máximo de 20 etiquetas cuenta las que ya existen.
        if i64::try_from(existentes.len() + items.len()).unwrap_or(i64::MAX)
            > ETIQUETAS_POR_USUARIO_MAX
        {
            return Err(motivo(
                ErrorCode::LabelLimitReached,
                messages::MAXIMO_DE_ETIQUETAS_CREADAS,
            ));
        }
        Ok(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::CreateLabel,
            items,
            warnings: Vec::new(),
            state: ProposalState::Active,
        })
    }

    /// HE-14-HU10-CA01: crea las etiquetas con las reglas de `label_create`, en la transacción de la propuesta, y
    /// confirma con el nombre o la cantidad.
    async fn aplicar_etiquetas(
        &self,
        tx: &mut sqlx::SqliteConnection,
        propuesta: &WindiProposal,
    ) -> Result<String, AppError> {
        let mut nombres = Vec::new();
        for item in &propuesta.items {
            let cambios = item.changes.as_ref().ok_or_else(inesperado)?;
            let texto = |campo: &str| {
                cambios
                    .get(campo)
                    .and_then(Value::as_str)
                    .map(str::to_string)
                    .ok_or_else(inesperado)
            };
            let params = LabelCreateParams {
                name: texto("name")?,
                color_id: texto("color_id")?,
            };
            nombres.push(params.name.trim().to_string());
            self.planificador
                .crear_etiqueta_en(&mut *tx, self.user_id, params)
                .await?;
        }
        Ok(match nombres.as_slice() {
            [nombre] => messages::WINDI_ETIQUETA_CREADA.replace("<nombre>", nombre),
            varias => {
                messages::WINDI_ETIQUETAS_CREADAS.replace("<cantidad>", &varias.len().to_string())
            }
        })
    }

    /// Crea las tarjetas en la columna Por hacer con `card_create` (ET04) y confirma con el título o la cantidad
    /// (CA01, CA08).
    async fn aplicar_creacion(
        &self,
        tx: &mut sqlx::SqliteConnection,
        propuesta: &WindiProposal,
    ) -> Result<String, AppError> {
        let mut titulos = Vec::new();
        for item in &propuesta.items {
            let params = datos_de_creacion(item.changes.as_ref())?;
            let titulo = params.title.trim().to_string();
            let id = self
                .planificador
                .crear_tarjeta_en(&mut *tx, self.user_id, params)
                .await?;
            // HE-14-HU04-CA10: el bloque horario con las reglas de HE-11-HU02-CA01.
            if let Some(bloque) = item
                .changes
                .as_ref()
                .and_then(|c| c.get("time_block"))
                .filter(|b| !b.is_null())
            {
                aplicar_bloque(self.planificador, &mut *tx, self.user_id, &id, bloque).await?;
            }
            titulos.push(titulo);
        }
        Ok(match titulos.as_slice() {
            [titulo] => messages::WINDI_TARJETA_CREADA.replace("<título>", titulo),
            varios => {
                messages::WINDI_TARJETAS_CREADAS.replace("<cantidad>", &varios.len().to_string())
            }
        })
    }

    /// Actualiza cada tarjeta con `card_update` (ET02, ET07) y su bloque horario con las reglas de HE-11 (CA11,
    /// CA12), y confirma mencionando el título o la cantidad (CA01, CA08).
    async fn aplicar_edicion(
        &self,
        tx: &mut sqlx::SqliteConnection,
        propuesta: &WindiProposal,
    ) -> Result<String, AppError> {
        let mut titulos = Vec::new();
        for item in &propuesta.items {
            let id = item.card_id.clone().ok_or_else(inesperado)?;
            let mut cambios = item
                .changes
                .as_ref()
                .and_then(Value::as_object)
                .cloned()
                .ok_or_else(inesperado)?;
            let bloque = cambios.remove("time_block");
            let patch: CardPatch =
                serde_json::from_value(Value::Object(cambios)).map_err(|_| inesperado())?;
            let (id, _) = self
                .planificador
                .actualizar_tarjeta_en(&mut *tx, self.user_id, CardUpdateParams { id, patch })
                .await?;
            if let Some(bloque) = &bloque {
                aplicar_bloque(self.planificador, &mut *tx, self.user_id, &id, bloque).await?;
            }
            let titulo = self
                .planificador
                .tarjeta_en(&mut *tx, self.user_id, &id)
                .await?
                .ok_or_else(inesperado)?
                .title;
            titulos.push(titulo);
        }
        Ok(match titulos.as_slice() {
            [titulo] => messages::WINDI_TARJETA_ACTUALIZADA.replace("<título>", titulo),
            varios => messages::WINDI_TARJETAS_ACTUALIZADAS
                .replace("<cantidad>", &varios.len().to_string()),
        })
    }

    /// Mueve la tarjeta al final de la columna con `card_move` (ET09), que la completa al llegar a Hecho (ET02) y la
    /// deja pendiente al salir (ET03). Al llegar a Hecho Windi celebra (CA02); si no, confirma el movimiento (CA01).
    async fn aplicar_movimiento(
        &self,
        tx: &mut sqlx::SqliteConnection,
        propuesta: &WindiProposal,
    ) -> Result<String, AppError> {
        if propuesta.items.is_empty() {
            return Err(inesperado());
        }
        // HE-14-HU06-ET12: se mueven todas, en el orden de la propuesta, al final de su columna de destino.
        let mut completadas = 0;
        let mut ultima: Option<(String, String)> = None;
        for item in &propuesta.items {
            let card_id = item.card_id.clone().ok_or_else(inesperado)?;
            let cambios = item.changes.as_ref().ok_or_else(inesperado)?;
            let destino = cambios["column_id"].as_str().ok_or_else(inesperado)?;
            let estaba_completada = self
                .planificador
                .tarjeta_en(&mut *tx, self.user_id, &card_id.0)
                .await?
                .is_some_and(|t| t.is_completed);
            let id = self
                .planificador
                .mover_tarjeta_en(
                    &mut *tx,
                    self.user_id,
                    CardMoveParams {
                        card_id,
                        column_id: Uuid(destino.to_string()),
                        placement: Placement::Variant1(PlacementVariant1 {
                            kind: PlacementVariant1Kind::End,
                        }),
                    },
                )
                .await?;
            let movida = self
                .planificador
                .tarjeta_en(&mut *tx, self.user_id, &id)
                .await?
                .ok_or_else(inesperado)?;
            if movida.is_completed && !estaba_completada {
                completadas += 1;
            }
            let columna = cambios["to_column"]
                .as_str()
                .unwrap_or_default()
                .to_string();
            ultima = Some((movida.title, columna));
        }
        // HE-14-HU02-CA02: completar alguna con el movimiento se celebra.
        if completadas > 0 {
            return Ok(super::ServicioDeWindi::celebracion(self.alias));
        }
        let (titulo, columna) = ultima.unwrap_or_default();
        if propuesta.items.len() > 1 {
            return Ok(messages::WINDI_TARJETAS_MOVIDAS
                .replace("<cantidad>", &propuesta.items.len().to_string()));
        }
        Ok(messages::WINDI_TARJETA_MOVIDA
            .replace("<título>", &titulo)
            .replace("<columna>", &columna))
    }

    /// Elimina las tarjetas con `card_delete` (ET05) y confirma con el título o la cantidad (CA01).
    async fn aplicar_eliminacion(
        &self,
        tx: &mut sqlx::SqliteConnection,
        propuesta: &WindiProposal,
    ) -> Result<String, AppError> {
        for item in &propuesta.items {
            let id = item.card_id.as_ref().ok_or_else(inesperado)?;
            self.planificador
                .eliminar_tarjeta_en(&mut *tx, self.user_id, &id.0)
                .await?;
        }
        Ok(match propuesta.items.as_slice() {
            [item] => messages::WINDI_TARJETA_ELIMINADA.replace("<título>", &item.title),
            varios => {
                messages::WINDI_TARJETAS_ELIMINADAS.replace("<cantidad>", &varios.len().to_string())
            }
        })
    }
}
