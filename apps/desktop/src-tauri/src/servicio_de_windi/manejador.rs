//! El manejador de propuestas sobre el planificador (HE-14-HU03): lee el estado actual de las tarjetas y aplica
//! cada acción con las mismas reglas de `card_*`. Cada acción llega con su HU: crear (HE-14-HU04), editar
//! (HE-14-HU05), mover (HE-14-HU06) y eliminar (HE-14-HU07).
//!
//! HE-14-HU03-ET10: si una propuesta no se puede preparar, el motivo es un error de negocio con su código estable y
//! el texto que Windi muestra en el chat. HE-14-HU03-ET12: una propuesta se aplica completa, en una sola
//! transacción, o no se aplica.

use serde_json::{Map, Value, json};

use super::ManejadorDePropuestas;
use crate::messages;
use crate::servicio_del_planificador::{
    Calendario, ServicioDelPlanificador, clave_alfabetica, de_sqlx, error, inesperado,
    validar_cantidad_de_etiquetas, validar_creacion, validar_descripcion, validar_fecha_limite,
    validar_titulo,
};
use crate::tipos::{
    AppError, Card, CardCreateParams, CardMoveParams, CardPatch, CardType, CardUpdateParams,
    Column, ColumnRole, ErrorCode, Label, Placement, PlacementVariant1, PlacementVariant1Kind,
    ProposalAction, ProposalState, Uuid, WindiChatProposal, WindiProposal, WindiProposalItem,
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
        "completed_on": tarjeta.completed_on,
    })
}

fn motivo(code: ErrorCode, texto: &str) -> MotivoDeRechazo {
    error(code, texto, None)
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
            let mapa = match normalizar(cambios, &etiquetas) {
                Ok(mapa) => mapa,
                Err(e) if e.code == ErrorCode::InternalUnexpected => return Err(e),
                Err(e) => {
                    motivos.push((Some(titulo), e));
                    continue;
                }
            };
            let params = datos_de_creacion(Some(&Value::Object(mapa)))?;
            if let Some(primero) = validar_creacion(&params, hoy).into_iter().next() {
                motivos.push((Some(titulo), primero));
                continue;
            }
            items.push(WindiProposalItem {
                card_id: None,
                current: None,
                title: params.title.trim().to_string(),
                changes: Some(serde_json::to_value(&params).map_err(|_| inesperado())?),
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

    /// HE-14-HU05: la propuesta de editar una tarjeta con el valor actual y el nuevo de cada dato que cambia (ET01).
    /// Sin propuesta si la tarjeta no existe (ET08), si ningún dato cambia (ET09) o si un dato no cumple las reglas
    /// de HE-07-HU04 (ET04, ET07); el motivo va al chat (HE-14-HU03-ET10). La prioridad y la descripción se pueden
    /// quitar (ET12). `current` guarda el estado completo (HE-14-HU03-ET05). Una tarjeta completada lleva el aviso
    /// de ET05.
    async fn preparar_edicion(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<WindiProposal, AppError> {
        let [item] = propuesta.items.as_slice() else {
            return Err(inesperado());
        };
        let tarjeta = self.buscar_tarjeta(item.card_id.as_ref()).await?;
        let etiquetas = self.planificador.etiquetas(self.user_id).await?;
        let mapa = normalizar(item.changes.as_ref(), &etiquetas)?;
        let patch: CardPatch =
            serde_json::from_value(Value::Object(mapa)).map_err(|_| inesperado())?;
        // Solo los datos que cambian.
        let actual = estado_de_la_tarjeta(&tarjeta);
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
        if despues.is_empty() {
            return Err(motivo(
                ErrorCode::WindiSameValue,
                &messages::WINDI_MISMO_VALOR.replace("<título>", &tarjeta.title),
            ));
        }
        let patch: CardPatch =
            serde_json::from_value(Value::Object(despues.clone())).map_err(|_| inesperado())?;
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
        Ok(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Edit,
            items: vec![WindiProposalItem {
                card_id: Some(tarjeta.id.clone()),
                current: Some(actual),
                changes: Some(Value::Object(despues)),
                title: tarjeta.title.clone(),
            }],
            warnings: if tarjeta.is_completed {
                vec![messages::WINDI_EDITAR_COMPLETADA.to_string()]
            } else {
                Vec::new()
            },
            state: ProposalState::Active,
        })
    }

    /// HE-14-HU06: mover una tarjeta a otra columna, que se reconoce por su id o por su nombre (ET13). Sin propuesta
    /// si la tarjeta o la columna no existen (ET08, ET10) o si ya está en esa columna (ET11); el motivo va al chat.
    /// `current` guarda el estado completo (HE-14-HU03-ET05) y los nombres de las columnas van en `changes` para
    /// mostrarlos (ET01).
    async fn preparar_movimiento(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<WindiProposal, AppError> {
        let [item] = propuesta.items.as_slice() else {
            return Err(inesperado());
        };
        let tarjeta = self.buscar_tarjeta(item.card_id.as_ref()).await?;
        let destino = item
            .changes
            .as_ref()
            .and_then(|c| c.get("column_id"))
            .and_then(Value::as_str)
            .ok_or_else(inesperado)?;
        let columnas = self.planificador.columnas(self.user_id).await?;
        let llegada = buscar_columna(&columnas, destino)?;
        let origen = columnas
            .iter()
            .find(|c| c.id.0.to_lowercase() == tarjeta.column_id.0.to_lowercase())
            .ok_or_else(inesperado)?;
        if origen.id == llegada.id {
            return Err(motivo(
                ErrorCode::WindiAlreadyInColumn,
                &messages::WINDI_YA_ESTA_EN_LA_COLUMNA
                    .replace("<título>", &tarjeta.title)
                    .replace("<columna>", &llegada.name),
            ));
        }
        let sale_de_hecho = origen.role == ColumnRole::Done && llegada.role != ColumnRole::Done;
        Ok(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Move,
            items: vec![WindiProposalItem {
                card_id: Some(tarjeta.id.clone()),
                current: Some(estado_de_la_tarjeta(&tarjeta)),
                changes: Some(json!({
                    "column_id": llegada.id,
                    "from_column": origen.name,
                    "to_column": llegada.name,
                })),
                title: tarjeta.title.clone(),
            }],
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
            self.planificador
                .crear_tarjeta_en(&mut *tx, self.user_id, params)
                .await?;
            titulos.push(titulo);
        }
        Ok(match titulos.as_slice() {
            [titulo] => messages::WINDI_TARJETA_CREADA.replace("<título>", titulo),
            varios => {
                messages::WINDI_TARJETAS_CREADAS.replace("<cantidad>", &varios.len().to_string())
            }
        })
    }

    /// Actualiza la tarjeta con `card_update` (ET02, ET07) y confirma mencionando el título (CA01).
    async fn aplicar_edicion(
        &self,
        tx: &mut sqlx::SqliteConnection,
        propuesta: &WindiProposal,
    ) -> Result<String, AppError> {
        let mut titulo = String::new();
        for item in &propuesta.items {
            let id = item.card_id.clone().ok_or_else(inesperado)?;
            let patch: CardPatch = item
                .changes
                .clone()
                .and_then(|c| serde_json::from_value(c).ok())
                .ok_or_else(inesperado)?;
            let (id, _) = self
                .planificador
                .actualizar_tarjeta_en(&mut *tx, self.user_id, CardUpdateParams { id, patch })
                .await?;
            titulo = self
                .planificador
                .tarjeta_en(&mut *tx, self.user_id, &id)
                .await?
                .ok_or_else(inesperado)?
                .title;
        }
        Ok(messages::WINDI_TARJETA_ACTUALIZADA.replace("<título>", &titulo))
    }

    /// Mueve la tarjeta al final de la columna con `card_move` (ET09), que la completa al llegar a Hecho (ET02) y la
    /// deja pendiente al salir (ET03). Al llegar a Hecho Windi celebra (CA02); si no, confirma el movimiento (CA01).
    async fn aplicar_movimiento(
        &self,
        tx: &mut sqlx::SqliteConnection,
        propuesta: &WindiProposal,
    ) -> Result<String, AppError> {
        let item = propuesta.items.first().ok_or_else(inesperado)?;
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
            return Ok(super::ServicioDeWindi::celebracion(self.alias));
        }
        Ok(messages::WINDI_TARJETA_MOVIDA
            .replace("<título>", &movida.title)
            .replace(
                "<columna>",
                cambios["to_column"].as_str().unwrap_or_default(),
            ))
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
