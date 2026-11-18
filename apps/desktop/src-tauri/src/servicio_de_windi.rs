//! Servicio de Windi, el agente de IA (arquitectura.md, vista 3a, Núcleo · servicios de negocio y datos locales).
//! Responsabilidad: «Arma el contexto mínimo (incluye cambios sin sincronizar), llama a windi-chat, guarda la
//! propuesta activa en memoria y la aplica solo al confirmar.»
//!
//! HE-14-HU01: la conversación vive en memoria mientras la aplicación está abierta (ET14). El saludo se agrega una
//! sola vez (ET07). Sin conexión no se envía (ET12). Cada mensaje va a la Edge Function `windi-chat` (EF-01) con
//! el JWT de la sesión y espera como máximo 15 s (RNF-11; D-172); cualquier falla se muestra como «No pude
//! responder en este momento. Intenta de nuevo.» y conserva el mensaje para «Reintentar» (CA08).

use std::sync::Mutex;
use std::time::Duration;

use crate::messages;
use crate::servicio_de_sesion::instante;
use crate::servicio_del_planificador::{Calendario, ServicioDelPlanificador, error, inesperado};
use crate::tipos::{
    AppError, ErrorCode, Uuid, WindiChatContext, WindiChatRequest, WindiChatRequestHistoryItem,
    WindiChatRequestHistoryItemRole, WindiChatResponse, WindiConversation, WindiMessage,
    WindiMessageRole, WindiProposal, WindiSendMessageResult,
};

/// Largo máximo de un mensaje (HE-14-HU01-ET03, ET04).
pub const LARGO_MAXIMO: usize = 2000;
/// Espera máxima de la respuesta del agente de IA (HE-14-HU01-ET24; RNF-11; D-172).
pub const ESPERA_MAXIMA: Duration = Duration::from_secs(15);
/// Turnos del historial que viajan a `windi-chat` (EF-01: «últimos 20 turnos»).
pub const TURNOS_DEL_HISTORIAL: usize = 20;

/// Por qué no llegó la respuesta de `windi-chat`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FallaDeWindi {
    /// No hay red (HE-14-HU01-CA07).
    SinConexion,
    /// Tiempo agotado, cuota, error del proveedor o respuesta inválida (CA08).
    NoDisponible,
}

/// La Edge Function `windi-chat` (EF-01). La implementa el cliente de Supabase; las pruebas usan un doble que
/// simula a Gemini (plan, P19: «Gemini simulado en las pruebas automáticas»).
pub trait AgenteEnLaNube: Send + Sync {
    fn conversar(
        &self,
        token: &str,
        peticion: &WindiChatRequest,
    ) -> impl std::future::Future<Output = Result<WindiChatResponse, FallaDeWindi>> + Send;
}

#[derive(Default)]
struct Conversacion {
    mensajes: Vec<WindiMessage>,
    saludo_dado: bool,
    propuesta: Option<WindiProposal>,
}

/// La conversación de la sesión de la aplicación, en memoria (ET14).
#[derive(Default)]
pub struct ServicioDeWindi {
    estado: Mutex<Conversacion>,
}

fn nuevo_id() -> Uuid {
    Uuid(uuid::Uuid::new_v4().to_string())
}

fn mensaje(role: WindiMessageRole, text: &str, ahora_ms: i64) -> WindiMessage {
    WindiMessage {
        id: nuevo_id(),
        role,
        text: text.to_string(),
        sent_at: instante(ahora_ms),
        failed: false,
    }
}

impl ServicioDeWindi {
    pub fn nuevo() -> Self {
        Self::default()
    }

    /// IPC-WIN-01 `windi_get_conversation`: el historial y la propuesta activa. La primera vez desde que se abrió
    /// la aplicación agrega el saludo con el alias (ET07, ET08). `online` dice si se puede conversar (ET12).
    pub fn conversacion(&self, alias: &str, en_linea: bool, ahora_ms: i64) -> WindiConversation {
        let mut estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
        if !estado.saludo_dado {
            estado.saludo_dado = true;
            let saludo = messages::WINDI_SALUDO.replace("<alias>", alias.trim());
            estado
                .mensajes
                .push(mensaje(WindiMessageRole::Assistant, &saludo, ahora_ms));
        }
        WindiConversation {
            messages: estado.mensajes.clone(),
            proposal: estado.propuesta.clone(),
            online: en_linea,
        }
    }

    /// Al cerrar sesión la conversación empieza de nuevo (el historial es de la sesión de la aplicación).
    pub fn olvidar(&self) {
        *self.estado.lock().unwrap_or_else(|e| e.into_inner()) = Conversacion::default();
    }

    /// IPC-WIN-02 `windi_send_message`. Valida el largo (ET03, ET04), agrega el mensaje del usuario (o reusa el
    /// último si falló y es el mismo: «Reintentar», ET16), llama a `windi-chat` con el historial y el contexto, y
    /// agrega la respuesta. Sin conexión o con falla, el mensaje del usuario queda marcado como fallido.
    pub async fn enviar<N: AgenteEnLaNube>(
        &self,
        nube: &N,
        token: &str,
        texto: &str,
        contexto: WindiChatContext,
        en_linea: bool,
        ahora_ms: i64,
    ) -> Result<WindiSendMessageResult, AppError> {
        if texto.chars().count() > LARGO_MAXIMO {
            return Err(error(
                ErrorCode::MessageTooLong,
                messages::MENSAJE_MUY_LARGO,
                Some("message"),
            ));
        }
        // ET02: la vista deshabilita «Enviar» y la tecla «Enter» con el campo vacío; el contrato no tiene código
        // para un mensaje vacío porque no puede llegar desde la vista.
        // DUDA: HE-14-HU01 IPC-WIN-02 no define el error de un mensaje vacío (docs/DUDAS.md).
        if texto.trim().is_empty() {
            return Err(inesperado());
        }
        let (peticion, id_del_mensaje) = {
            let mut estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
            let reintento = estado
                .mensajes
                .last()
                .is_some_and(|m| m.role == WindiMessageRole::User && m.failed && m.text == texto);
            if reintento {
                if let Some(ultimo) = estado.mensajes.last_mut() {
                    ultimo.failed = false;
                }
            } else {
                estado
                    .mensajes
                    .push(mensaje(WindiMessageRole::User, texto, ahora_ms));
            }
            let id = estado
                .mensajes
                .last()
                .map(|m| m.id.clone())
                .unwrap_or_else(nuevo_id);
            let anteriores = estado.mensajes.len().saturating_sub(1);
            let validos: Vec<_> = estado.mensajes[..anteriores]
                .iter()
                .filter(|m| !m.failed)
                .collect();
            let history = validos[validos.len().saturating_sub(TURNOS_DEL_HISTORIAL)..]
                .iter()
                .map(|m| WindiChatRequestHistoryItem {
                    role: match m.role {
                        WindiMessageRole::User => WindiChatRequestHistoryItemRole::User,
                        WindiMessageRole::Assistant => WindiChatRequestHistoryItemRole::Assistant,
                    },
                    text: m.text.clone(),
                })
                .collect();
            (
                WindiChatRequest {
                    client_request_id: nuevo_id(),
                    message: texto.to_string(),
                    history,
                    context: contexto,
                },
                id,
            )
        };
        let respuesta = if en_linea {
            nube.conversar(token, &peticion).await
        } else {
            Err(FallaDeWindi::SinConexion)
        };
        let mut estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
        match respuesta {
            Ok(respuesta) => {
                let reply = mensaje(WindiMessageRole::Assistant, &respuesta.reply, ahora_ms);
                estado.mensajes.push(reply.clone());
                Ok(WindiSendMessageResult {
                    reply,
                    proposal: estado.propuesta.clone(),
                })
            }
            Err(falla) => {
                if let Some(enviado) = estado.mensajes.iter_mut().find(|m| m.id == id_del_mensaje) {
                    enviado.failed = true;
                }
                Err(match falla {
                    FallaDeWindi::SinConexion => {
                        error(ErrorCode::NetOffline, messages::WINDI_SIN_CONEXION, None)
                    }
                    FallaDeWindi::NoDisponible => error(
                        ErrorCode::WindiUnavailable,
                        messages::WINDI_NO_DISPONIBLE,
                        None,
                    ),
                })
            }
        }
    }
}

/// El contexto de `windi-chat` (EF-01): alias, fecha y hora del computador, columnas, etiquetas y totales. Las
/// tarjetas van solo cuando la pregunta las necesita (D-193; HE-14-HU01-ET17): las eligen las HU que piden
/// cambiarlas o consultarlas.
pub async fn contexto<C: Calendario>(
    planificador: &ServicioDelPlanificador<C>,
    user_id: &str,
    alias: &str,
    hoy: chrono::NaiveDate,
    hora: u8,
) -> Result<WindiChatContext, AppError> {
    let columnas = planificador.columnas(user_id).await?;
    let etiquetas = planificador.etiquetas(user_id).await?;
    let tablero = planificador.tablero(user_id).await?;
    let tarjetas: Vec<_> = tablero.columns.iter().flat_map(|c| &c.cards).collect();
    let contar = |f: &dyn Fn(&&crate::tipos::Card) -> bool| {
        i64::try_from(tarjetas.iter().filter(|t| f(t)).count()).unwrap_or(i64::MAX)
    };
    Ok(WindiChatContext {
        alias: alias.trim().to_string(),
        today: crate::tipos::DateIso(hoy.format("%Y-%m-%d").to_string()),
        now_hour: crate::tipos::Hour(hora),
        totals: crate::tipos::WindiChatContextTotals {
            total: contar(&|_| true),
            overdue: contar(&|t| t.is_overdue),
            pending: contar(&|t| !t.is_completed && !t.is_overdue),
            completed: contar(&|t| t.is_completed),
        },
        columns: columnas
            .into_iter()
            .map(|c| crate::tipos::WindiChatContextColumnsItem {
                id: c.id,
                name: c.name,
                role: c.role,
            })
            .collect(),
        labels: etiquetas
            .into_iter()
            .map(|e| crate::tipos::WindiChatContextLabelsItem {
                id: e.id,
                name: e.name,
            })
            .collect(),
        cards: Vec::new(),
        active_proposal: None,
    })
}

#[cfg(test)]
mod pruebas;
