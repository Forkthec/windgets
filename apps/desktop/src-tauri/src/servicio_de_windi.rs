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
    AppError, ErrorCode, ProposalState, Uuid, WindiChatContext, WindiChatProposal,
    WindiChatProposalItemsItem, WindiChatRequest, WindiChatRequestHistoryItem,
    WindiChatRequestHistoryItemRole, WindiChatResponse, WindiConfirmProposalResult,
    WindiConfirmProposalResultOutcome, WindiConversation, WindiMessage, WindiMessageRole,
    WindiProposal, WindiRejectProposalResult, WindiSendMessageResult,
};
use serde_json::Value;

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

/// HE-14-HU03: lo que cada acción (crear, editar, mover, eliminar; HE-14-HU04 a HU07) sabe hacer con una
/// propuesta. El servicio guarda una sola propuesta activa (ET03) y solo la aplica al confirmar (ET01; D-047).
pub trait ManejadorDePropuestas: Send + Sync {
    /// La propuesta que ve el usuario a partir de la de `windi-chat`: el título y el estado actual de cada tarjeta
    /// y las advertencias. `None` si no se puede proponer (las reglas de `card_*` la rechazan).
    fn preparar(
        &self,
        propuesta: &WindiChatProposal,
    ) -> impl std::future::Future<Output = Result<Option<WindiProposal>, AppError>> + Send;
    /// El estado actual de una tarjeta, con los mismos campos que `WindiProposalItem.current`; `None` si ya no
    /// existe (ET05).
    fn actual(
        &self,
        card_id: &str,
    ) -> impl std::future::Future<Output = Result<Option<Value>, AppError>> + Send;
    /// Aplica la propuesta con las mismas reglas de `card_*`. Devuelve la respuesta de Windi, si la acción tiene
    /// una propia (la celebración de HE-14-HU06-CA02); si no, «Listo, ya hice el cambio.».
    fn aplicar(
        &self,
        propuesta: &WindiProposal,
    ) -> impl std::future::Future<Output = Result<Option<String>, AppError>> + Send;
}

/// El nombre de un campo de la tarjeta en la explicación de una propuesta desactualizada (HE-14-HU03-ET06).
fn nombre_del_campo(campo: &str) -> &str {
    match campo {
        "title" => "el título",
        "due_date" => "la fecha límite",
        "column_id" => "la columna",
        "priority" => "la prioridad",
        "type" => "el tipo",
        "description" => "la descripción",
        "label_ids" => "las etiquetas",
        "scheduled_date" | "scheduled_hour" => "el bloque horario",
        "completed_on" => "la fecha de completado",
        otro => otro,
    }
}

/// La propuesta tal como viaja a `windi-chat` (`context.active_proposal`).
fn para_el_chat(propuesta: &WindiProposal) -> WindiChatProposal {
    WindiChatProposal {
        action: propuesta.action.clone(),
        items: propuesta
            .items
            .iter()
            .map(|i| WindiChatProposalItemsItem {
                card_id: i.card_id.clone(),
                changes: i.changes.clone(),
            })
            .collect(),
    }
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

    /// HE-14-HU02-CA02: la frase breve con el alias con la que Windi celebra una tarjeta completada (ET03, ET08).
    pub fn celebracion(alias: &str) -> String {
        messages::WINDI_CELEBRACION.replace("<alias>", alias.trim())
    }

    /// Al cerrar sesión la conversación empieza de nuevo (el historial es de la sesión de la aplicación).
    pub fn olvidar(&self) {
        *self.estado.lock().unwrap_or_else(|e| e.into_inner()) = Conversacion::default();
    }

    /// IPC-WIN-02 `windi_send_message`. Valida el largo (ET03, ET04), agrega el mensaje del usuario (o reusa el
    /// último si falló y es el mismo: «Reintentar», ET16), llama a `windi-chat` con el historial y el contexto, y
    /// agrega la respuesta. Sin conexión o con falla, el mensaje del usuario queda marcado como fallido.
    #[allow(clippy::too_many_arguments)]
    pub async fn enviar<N: AgenteEnLaNube, M: ManejadorDePropuestas>(
        &self,
        nube: &N,
        manejador: &M,
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
                    context: WindiChatContext {
                        // HE-14-HU03: la propuesta activa viaja para que el agente sepa qué está pendiente.
                        active_proposal: estado
                            .propuesta
                            .as_ref()
                            .filter(|p| p.state == ProposalState::Active)
                            .map(para_el_chat),
                        ..contexto
                    },
                },
                id,
            )
        };
        let respuesta = if en_linea {
            nube.conversar(token, &peticion).await
        } else {
            Err(FallaDeWindi::SinConexion)
        };
        // HE-14-HU03: la propuesta de windi-chat se prepara con los datos actuales; si las reglas de `card_*` no la
        // permiten, no hay propuesta.
        let preparada = match &respuesta {
            Ok(WindiChatResponse {
                proposal: Some(propuesta),
                ..
            }) => manejador.preparar(propuesta).await.ok().flatten(),
            _ => None,
        };
        let mut estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
        match respuesta {
            Ok(respuesta) => {
                let reply = mensaje(WindiMessageRole::Assistant, &respuesta.reply, ahora_ms);
                estado.mensajes.push(reply.clone());
                // ET03, ET04: una sola propuesta activa; la anterior sin confirmar ni rechazar queda «Descartada».
                if let Some(nueva) = &preparada {
                    if let Some(anterior) = estado.propuesta.as_mut()
                        && anterior.state == ProposalState::Active
                    {
                        anterior.state = ProposalState::Discarded;
                    }
                    estado.propuesta = Some(nueva.clone());
                }
                Ok(WindiSendMessageResult {
                    reply,
                    proposal: preparada,
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

    /// La propuesta activa con ese id; si no es la activa (por ejemplo, quedó «Descartada»), `proposal.discarded`.
    fn activa(&self, id: &Uuid) -> Result<WindiProposal, AppError> {
        let estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
        estado
            .propuesta
            .clone()
            .filter(|p| &p.id == id && p.state == ProposalState::Active)
            .ok_or_else(|| error(ErrorCode::ProposalDiscarded, "", None))
    }

    /// Agrega la respuesta de Windi a la conversación.
    fn responder(&self, texto: &str, ahora_ms: i64) -> WindiMessage {
        let respuesta = mensaje(WindiMessageRole::Assistant, texto, ahora_ms);
        let mut estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
        estado.mensajes.push(respuesta.clone());
        respuesta
    }

    fn cambiar_estado(&self, id: &Uuid, nuevo: ProposalState) {
        let mut estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(p) = estado.propuesta.as_mut().filter(|p| &p.id == id) {
            p.state = nuevo;
        }
    }

    /// IPC-WIN-03 `windi_confirm_proposal` (HE-14-HU03). `en_linea` es el resultado de la consulta inmediata a la
    /// nube que hace el Puente IPC antes de llamar (ET05): sin conexión no aplica nada (ET07). Si alguna tarjeta
    /// cambió o se eliminó, no aplica, explica qué cambió y propone de nuevo con los datos actuales si aún se puede
    /// (ET05, ET06). Si no, aplica con las reglas de `card_*` y Windi confirma el cambio (CA01).
    pub async fn confirmar<M: ManejadorDePropuestas>(
        &self,
        manejador: &M,
        id: &Uuid,
        en_linea: bool,
        ahora_ms: i64,
    ) -> Result<WindiConfirmProposalResult, AppError> {
        let propuesta = self.activa(id)?;
        if !en_linea {
            return Err(error(
                ErrorCode::NetOffline,
                messages::WINDI_SIN_CONEXION_AL_CONFIRMAR,
                None,
            ));
        }
        let mut diferencias = Vec::new();
        let mut vigentes = Vec::new();
        for item in &propuesta.items {
            let Some(card_id) = &item.card_id else {
                vigentes.push(item);
                continue;
            };
            match manejador.actual(&card_id.0).await? {
                None => diferencias
                    .push(messages::WINDI_TARJETA_YA_NO_EXISTE.replace("<título>", &item.title)),
                Some(actual) => {
                    let campos: Vec<&str> = item
                        .current
                        .as_ref()
                        .and_then(Value::as_object)
                        .map(|antes| {
                            antes
                                .iter()
                                .filter(|(campo, valor)| actual.get(campo.as_str()) != Some(*valor))
                                .map(|(campo, _)| nombre_del_campo(campo))
                                .collect()
                        })
                        .unwrap_or_default();
                    if !campos.is_empty() {
                        let mut campos = campos;
                        campos.dedup();
                        diferencias.push(
                            messages::WINDI_TARJETA_CAMBIO
                                .replace("<título>", &item.title)
                                .replace("<campos>", &campos.join(", ")),
                        );
                    }
                    vigentes.push(item);
                }
            }
        }
        if diferencias.is_empty() {
            let texto = manejador
                .aplicar(&propuesta)
                .await?
                .unwrap_or_else(|| messages::WINDI_CAMBIO_HECHO.to_string());
            self.cambiar_estado(id, ProposalState::Confirmed);
            return Ok(WindiConfirmProposalResult {
                outcome: WindiConfirmProposalResultOutcome::Applied,
                reply: self.responder(&texto, ahora_ms),
                new_proposal: None,
            });
        }
        // ET06: la propuesta nueva con los datos actuales, solo con las tarjetas que todavía existen.
        let nueva = if vigentes.is_empty() {
            None
        } else {
            let chat = WindiChatProposal {
                action: propuesta.action.clone(),
                items: vigentes
                    .iter()
                    .map(|i| WindiChatProposalItemsItem {
                        card_id: i.card_id.clone(),
                        changes: i.changes.clone(),
                    })
                    .collect(),
            };
            manejador.preparar(&chat).await?
        };
        let mut texto =
            messages::WINDI_PROPUESTA_DESACTUALIZADA.replace("<cambios>", &diferencias.join("; "));
        if nueva.is_some() {
            texto.push(' ');
            texto.push_str(messages::WINDI_PROPUESTA_NUEVA);
        }
        {
            let mut estado = self.estado.lock().unwrap_or_else(|e| e.into_inner());
            if let Some(p) = estado.propuesta.as_mut() {
                p.state = ProposalState::Discarded;
            }
            if let Some(nueva) = &nueva {
                estado.propuesta = Some(nueva.clone());
            }
        }
        Ok(WindiConfirmProposalResult {
            outcome: WindiConfirmProposalResultOutcome::Stale,
            reply: self.responder(&texto, ahora_ms),
            new_proposal: nueva,
        })
    }

    /// IPC-WIN-04 `windi_reject_proposal` (HE-14-HU03): no aplica cambios y Windi lo confirma.
    pub fn rechazar(
        &self,
        id: &Uuid,
        ahora_ms: i64,
    ) -> Result<WindiRejectProposalResult, AppError> {
        self.activa(id)?;
        self.cambiar_estado(id, ProposalState::Rejected);
        Ok(WindiRejectProposalResult {
            reply: self.responder(messages::WINDI_PROPUESTA_RECHAZADA, ahora_ms),
        })
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
    mensaje: &str,
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
        // DUDA: HE-14-HU05 EF-01 dice «solo las necesarias para la pregunta» sin definir cuáles. Valor usado: las
        // tarjetas cuyo título comparte una palabra de 3 letras o más con el mensaje, hasta 50 (docs/DUDAS.md).
        cards: {
            let buscadas = palabras(mensaje);
            tarjetas
                .iter()
                .filter(|t| palabras(&t.title).iter().any(|p| buscadas.contains(p)))
                .take(TARJETAS_EN_EL_CONTEXTO)
                .map(|t| crate::tipos::WindiChatContextCard {
                    id: t.id.clone(),
                    r#type: t.r#type.clone(),
                    title: t.title.clone(),
                    due_date: t.due_date.clone(),
                    priority: t.priority.clone(),
                    column_id: t.column_id.clone(),
                    label_ids: t.label_ids.clone(),
                    completed_on: t.completed_on.clone(),
                    scheduled_date: t.scheduled_date.clone(),
                    scheduled_hour: t.scheduled_hour.clone(),
                    description: t.description.clone(),
                })
                .collect()
        },
        active_proposal: None,
    })
}

/// Cuántas tarjetas van como máximo en el contexto de `windi-chat`.
const TARJETAS_EN_EL_CONTEXTO: usize = 50;

/// Las palabras de 3 letras o más de un texto, en minúsculas y sin tildes, para buscar tarjetas por su título.
fn palabras(texto: &str) -> Vec<String> {
    texto
        .to_lowercase()
        .chars()
        .map(|c| match c {
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' | 'ö' => 'o',
            'ú' | 'ü' => 'u',
            otro => otro,
        })
        .collect::<String>()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|p| p.chars().count() >= 3)
        .map(str::to_string)
        .collect()
}

pub mod manejador;

#[cfg(test)]
mod pruebas;
