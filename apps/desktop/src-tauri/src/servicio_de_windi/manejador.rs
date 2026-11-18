//! El manejador de propuestas sobre el planificador (HE-14-HU03): lee el estado actual de las tarjetas y aplica
//! cada acción con las mismas reglas de `card_*`. Cada acción llega con su HU: crear (HE-14-HU04), editar
//! (HE-14-HU05), mover (HE-14-HU06) y eliminar (HE-14-HU07).

use serde_json::{Value, json};

use super::ManejadorDePropuestas;
use crate::messages;
use crate::servicio_del_planificador::{Calendario, ServicioDelPlanificador, validar_creacion};
use crate::tipos::{
    AppError, Card, CardCreateParams, CardType, ProposalAction, ProposalState, Uuid,
    WindiChatProposal, WindiProposal, WindiProposalItem,
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
            // Las demás acciones llegan con HE-14-HU05 a HU07; sin ellas no hay propuesta.
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
