//! El manejador de propuestas sobre el planificador (HE-14-HU03): lee el estado actual de las tarjetas y aplica
//! cada acción con las mismas reglas de `card_*`. Cada acción llega con su HU: crear (HE-14-HU04), editar
//! (HE-14-HU05), mover (HE-14-HU06) y eliminar (HE-14-HU07).

use serde_json::{Value, json};

use super::ManejadorDePropuestas;
use crate::servicio_del_planificador::{Calendario, ServicioDelPlanificador};
use crate::tipos::{AppError, Card, WindiChatProposal, WindiProposal};

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
        // Las acciones llegan con HE-14-HU04 a HU07; sin ellas no hay propuesta.
        let _ = propuesta;
        Ok(None)
    }

    async fn actual(&self, card_id: &str) -> Result<Option<Value>, AppError> {
        Ok(self
            .planificador
            .tarjeta(self.user_id, card_id)
            .await?
            .map(|t| estado_de_la_tarjeta(&t)))
    }

    async fn aplicar(&self, propuesta: &WindiProposal) -> Result<Option<String>, AppError> {
        let _ = (propuesta, self.alias);
        Err(crate::servicio_del_planificador::inesperado())
    }
}
