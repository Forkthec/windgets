//! El manejador de propuestas sobre el planificador (HE-14-HU03): lee el estado actual de las tarjetas y aplica
//! cada acción con las mismas reglas de `card_*`. Cada acción llega con su HU: crear (HE-14-HU04), editar
//! (HE-14-HU05), mover (HE-14-HU06) y eliminar (HE-14-HU07).

use serde_json::{Value, json};

use super::ManejadorDePropuestas;
use crate::messages;
use crate::servicio_del_planificador::{
    Calendario, ServicioDelPlanificador, validar_cantidad_de_etiquetas, validar_creacion,
    validar_descripcion, validar_fecha_limite, validar_titulo,
};
use crate::tipos::{
    AppError, Card, CardCreateParams, CardPatch, CardType, CardUpdateParams, ProposalAction,
    ProposalState, Uuid, WindiChatProposal, WindiProposal, WindiProposalItem,
};

/// Los campos de una tarjeta que se comparan para saber si una propuesta quedó desactualizada (HE-14-HU03-ET05).
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

pub struct ManejadorDelPlanificador<'a, C: Calendario> {
    pub planificador: &'a ServicioDelPlanificador<C>,
    pub user_id: &'a str,
    pub alias: &'a str,
}

impl<C: Calendario> ManejadorDePropuestas for ManejadorDelPlanificador<'_, C> {
    async fn preparar(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<Option<WindiProposal>, AppError> {
        match propuesta.action {
            ProposalAction::Create => self.preparar_creacion(propuesta).await,
            ProposalAction::Edit => self.preparar_edicion(propuesta).await,
            // Las demás acciones llegan con HE-14-HU06 y HU07; sin ellas no hay propuesta.
            _ => Ok(None),
        }
    }

    async fn actual(&self, card_id: &str) -> Result<Option<Value>, AppError> {
        Ok(self
            .planificador
            .tarjeta(self.user_id, card_id)
            .await?
            .map(|t| estado_de_la_tarjeta(&t)))
    }

    async fn aplicar(&self, propuesta: &WindiProposal) -> Result<Option<String>, AppError> {
        match propuesta.action {
            ProposalAction::Create => self.aplicar_creacion(propuesta).await,
            ProposalAction::Edit => self.aplicar_edicion(propuesta).await,
            _ => {
                let _ = self.alias;
                Err(crate::servicio_del_planificador::inesperado())
            }
        }
    }
}

/// Los datos de una tarjeta nueva de la propuesta, con el tipo Tarea si no se indicó otro (HE-14-HU04-ET02).
fn datos_de_creacion(cambios: Option<&Value>) -> Option<CardCreateParams> {
    let mut params: CardCreateParams = serde_json::from_value(cambios?.clone()).ok()?;
    params.r#type.get_or_insert(CardType::Task);
    Some(params)
}

impl<C: Calendario> ManejadorDelPlanificador<'_, C> {
    /// HE-14-HU04: una propuesta de creación con una o varias tarjetas (ET07). Cada una cumple las reglas de
    /// HE-07-HU01 (ET09): título y fecha límite obligatorios (ET05), fecha límite no anterior a hoy (ET06) y solo
    /// etiquetas que existen (ET08). Si una no las cumple, no hay propuesta: Windi pregunta lo que falta.
    async fn preparar_creacion(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<Option<WindiProposal>, AppError> {
        let hoy = self.planificador.hoy();
        let etiquetas: Vec<String> = self
            .planificador
            .etiquetas(self.user_id)
            .await?
            .into_iter()
            .map(|e| e.id.0.to_lowercase())
            .collect();
        let mut items = Vec::new();
        for item in &propuesta.items {
            let Some(params) = datos_de_creacion(item.changes.as_ref()) else {
                return Ok(None);
            };
            let etiquetas_validas = params
                .label_ids
                .iter()
                .flatten()
                .all(|id| etiquetas.contains(&id.0.to_lowercase()));
            if !validar_creacion(&params, hoy).is_empty() || !etiquetas_validas {
                return Ok(None);
            }
            items.push(WindiProposalItem {
                card_id: None,
                current: None,
                title: params.title.trim().to_string(),
                changes: serde_json::to_value(&params).ok(),
            });
        }
        if items.is_empty() {
            return Ok(None);
        }
        Ok(Some(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Create,
            items,
            warnings: Vec::new(),
            state: ProposalState::Active,
        }))
    }

    /// HE-14-HU05: la propuesta de editar una tarjeta con el valor actual y el nuevo de cada dato que cambia (ET01).
    /// Sin propuesta si la tarjeta no existe (ET08), si ningún dato cambia (ET09) o si un dato no cumple las reglas
    /// de HE-07-HU04 (ET04, ET07). Una tarjeta completada lleva el aviso de ET05.
    async fn preparar_edicion(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<Option<WindiProposal>, AppError> {
        let [item] = propuesta.items.as_slice() else {
            return Ok(None);
        };
        let Some(card_id) = &item.card_id else {
            return Ok(None);
        };
        let Some(tarjeta) = self.planificador.tarjeta(self.user_id, &card_id.0).await? else {
            return Ok(None);
        };
        let Some(patch) = item
            .changes
            .clone()
            .and_then(|c| serde_json::from_value::<CardPatch>(c).ok())
        else {
            return Ok(None);
        };
        // Solo los datos que cambian.
        let actual = estado_de_la_tarjeta(&tarjeta);
        let pedido = serde_json::to_value(&patch).unwrap_or_default();
        let mut antes = serde_json::Map::new();
        let mut despues = serde_json::Map::new();
        for (campo, valor) in pedido.as_object().into_iter().flatten() {
            let valor = match valor {
                Value::String(texto) => Value::from(texto.trim()),
                otro => otro.clone(),
            };
            let previo = actual.get(campo).cloned().unwrap_or(Value::Null);
            if previo != valor {
                antes.insert(campo.clone(), previo);
                despues.insert(campo.clone(), valor);
            }
        }
        if despues.is_empty() {
            return Ok(None);
        }
        let Ok(patch) = serde_json::from_value::<CardPatch>(Value::Object(despues.clone())) else {
            return Ok(None);
        };
        let etiquetas: Vec<String> = self
            .planificador
            .etiquetas(self.user_id)
            .await?
            .into_iter()
            .map(|e| e.id.0.to_lowercase())
            .collect();
        let hoy = self.planificador.hoy();
        let invalido = patch.title.as_deref().and_then(validar_titulo).is_some()
            || patch
                .due_date
                .as_ref()
                .and_then(|f| validar_fecha_limite(&f.0, hoy))
                .is_some()
            || patch
                .description
                .as_ref()
                .and_then(|d| validar_descripcion(d.as_deref()))
                .is_some()
            || patch.label_ids.as_deref().is_some_and(|ids| {
                validar_cantidad_de_etiquetas(ids).is_some()
                    || !ids
                        .iter()
                        .all(|id| etiquetas.contains(&id.0.to_lowercase()))
            });
        if invalido {
            return Ok(None);
        }
        Ok(Some(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: ProposalAction::Edit,
            items: vec![WindiProposalItem {
                card_id: Some(tarjeta.id.clone()),
                current: Some(Value::Object(antes)),
                changes: Some(Value::Object(despues)),
                title: tarjeta.title.clone(),
            }],
            warnings: if tarjeta.is_completed {
                vec![messages::WINDI_EDITAR_COMPLETADA.to_string()]
            } else {
                Vec::new()
            },
            state: ProposalState::Active,
        }))
    }

    /// Actualiza la tarjeta con `card_update` (ET02, ET07) y confirma mencionando el título (CA01).
    async fn aplicar_edicion(&self, propuesta: &WindiProposal) -> Result<Option<String>, AppError> {
        let item = propuesta
            .items
            .first()
            .ok_or_else(crate::servicio_del_planificador::inesperado)?;
        let id = item
            .card_id
            .clone()
            .ok_or_else(crate::servicio_del_planificador::inesperado)?;
        let patch: CardPatch = item
            .changes
            .clone()
            .and_then(|c| serde_json::from_value(c).ok())
            .ok_or_else(crate::servicio_del_planificador::inesperado)?;
        let tarjeta = self
            .planificador
            .actualizar_tarjeta(self.user_id, CardUpdateParams { id, patch })
            .await?;
        Ok(Some(
            messages::WINDI_TARJETA_ACTUALIZADA.replace("<título>", &tarjeta.valor.title),
        ))
    }

    /// Crea las tarjetas en la columna Por hacer con `card_create` (ET04) y confirma con el título o la cantidad
    /// (CA01, CA08).
    async fn aplicar_creacion(
        &self,
        propuesta: &WindiProposal,
    ) -> Result<Option<String>, AppError> {
        let mut titulos = Vec::new();
        for item in &propuesta.items {
            let params = datos_de_creacion(item.changes.as_ref())
                .ok_or_else(crate::servicio_del_planificador::inesperado)?;
            let creada = self
                .planificador
                .crear_tarjeta(self.user_id, params)
                .await?;
            titulos.push(creada.valor.title);
        }
        Ok(Some(match titulos.as_slice() {
            [titulo] => messages::WINDI_TARJETA_CREADA.replace("<título>", titulo),
            varios => {
                messages::WINDI_TARJETAS_CREADAS.replace("<cantidad>", &varios.len().to_string())
            }
        }))
    }
}
