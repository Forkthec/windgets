//! Pruebas del Núcleo de Windi (HE-14). La Edge Function `windi-chat` se simula (plan, P19: «Gemini simulado en
//! las pruebas automáticas»): el doble guarda cada petición y responde lo que la prueba indique.

use std::sync::Mutex;

use super::*;
use crate::servicio_del_planificador::pruebas::{
    CalendarioDePrueba, EN_PROGRESO, HECHO, POR_HACER, USUARIO, bloquear, con_semilla, tarjeta_en,
};
use crate::tipos::{DateIso, Hour, WindiChatContextTotals, WindiChatResponseIntent};

/// Doble de `windi-chat`: responde en orden lo que se le dio y guarda las peticiones.
#[derive(Default)]
pub(crate) struct WindiSimulado {
    pub(crate) respuestas: Mutex<Vec<Result<WindiChatResponse, FallaDeWindi>>>,
    pub(crate) peticiones: Mutex<Vec<WindiChatRequest>>,
}

impl WindiSimulado {
    pub(crate) fn responde(respuestas: Vec<Result<WindiChatResponse, FallaDeWindi>>) -> Self {
        Self {
            respuestas: Mutex::new(respuestas),
            peticiones: Mutex::default(),
        }
    }

    pub(crate) fn peticiones(&self) -> Vec<WindiChatRequest> {
        self.peticiones.lock().unwrap().clone()
    }
}

impl AgenteEnLaNube for WindiSimulado {
    async fn conversar(
        &self,
        _token: &str,
        peticion: &WindiChatRequest,
    ) -> Result<WindiChatResponse, FallaDeWindi> {
        self.peticiones.lock().unwrap().push(peticion.clone());
        let mut respuestas = self.respuestas.lock().unwrap();
        if respuestas.is_empty() {
            Err(FallaDeWindi::NoDisponible)
        } else {
            respuestas.remove(0)
        }
    }
}

pub(crate) fn respuesta(texto: &str, intent: WindiChatResponseIntent) -> WindiChatResponse {
    WindiChatResponse {
        reply: texto.into(),
        intent,
        proposal: None,
    }
}

pub(crate) fn contexto_vacio() -> WindiChatContext {
    WindiChatContext {
        alias: "Prueba".into(),
        today: DateIso("2026-11-14".into()),
        now_hour: Hour(14),
        columns: Vec::new(),
        labels: Vec::new(),
        cards: Vec::new(),
        totals: WindiChatContextTotals {
            total: 0,
            overdue: 0,
            pending: 0,
            completed: 0,
        },
        active_proposal: None,
    }
}

const AHORA: i64 = 1_794_657_600_000;

pub(crate) fn enviar(
    windi: &ServicioDeWindi,
    nube: &WindiSimulado,
    texto: &str,
    en_linea: bool,
) -> Result<WindiSendMessageResult, AppError> {
    enviar_con(windi, nube, &ManejadorSimulado::default(), texto, en_linea)
}

pub(crate) fn enviar_con<M: ManejadorDePropuestas>(
    windi: &ServicioDeWindi,
    nube: &WindiSimulado,
    manejador: &M,
    texto: &str,
    en_linea: bool,
) -> Result<WindiSendMessageResult, AppError> {
    bloquear(windi.enviar(
        nube,
        manejador,
        "jwt",
        texto,
        contexto_vacio(),
        en_linea,
        AHORA,
    ))
}

/// Manejador de propuestas simulado (HE-14-HU03): las tarjetas son un mapa id → (título, estado) y aplicar solo
/// registra la propuesta.
#[derive(Default)]
pub(crate) struct ManejadorSimulado {
    pub(crate) tarjetas: Mutex<std::collections::HashMap<String, (String, Value)>>,
    pub(crate) aplicadas: Mutex<Vec<WindiProposal>>,
}

impl ManejadorSimulado {
    pub(crate) fn con(tarjetas: &[(&str, &str, Value)]) -> Self {
        Self {
            tarjetas: Mutex::new(
                tarjetas
                    .iter()
                    .map(|(id, titulo, estado)| ((*id).into(), ((*titulo).into(), estado.clone())))
                    .collect(),
            ),
            aplicadas: Mutex::default(),
        }
    }
}

impl ManejadorDePropuestas for ManejadorSimulado {
    async fn preparar(
        &self,
        propuesta: &WindiChatProposal,
    ) -> Result<Option<WindiProposal>, AppError> {
        let tarjetas = self.tarjetas.lock().unwrap();
        Ok(Some(WindiProposal {
            id: Uuid(uuid::Uuid::new_v4().to_string()),
            action: propuesta.action.clone(),
            items: propuesta
                .items
                .iter()
                .map(|i| {
                    let tarjeta = i.card_id.as_ref().and_then(|id| tarjetas.get(&id.0));
                    crate::tipos::WindiProposalItem {
                        card_id: i.card_id.clone(),
                        current: tarjeta.map(|(_, estado)| estado.clone()),
                        changes: i.changes.clone(),
                        title: tarjeta.map(|(t, _)| t.clone()).unwrap_or_default(),
                    }
                })
                .collect(),
            warnings: Vec::new(),
            state: ProposalState::Active,
        }))
    }

    async fn actual(&self, card_id: &str) -> Result<Option<Value>, AppError> {
        Ok(self
            .tarjetas
            .lock()
            .unwrap()
            .get(card_id)
            .map(|(_, e)| e.clone()))
    }

    async fn aplicar(&self, propuesta: &WindiProposal) -> Result<Option<String>, AppError> {
        self.aplicadas.lock().unwrap().push(propuesta.clone());
        Ok(None)
    }
}

fn textos(windi: &ServicioDeWindi) -> Vec<(WindiMessageRole, String, bool)> {
    windi
        .conversacion("Prueba", true, AHORA)
        .messages
        .into_iter()
        .map(|m| (m.role, m.text, m.failed))
        .collect()
}

#[test]
fn ca_he_14_hu01_ca01() {
    // HE-14-HU01-CA01 · Abrir el chat: un solo mensaje breve del agente que saluda por el alias, se presenta como
    // «Windi» y ofrece ayuda (ET07 a ET10); solo la primera vez desde que se abrió la aplicación.
    let windi = ServicioDeWindi::nuevo();
    let primera = windi.conversacion("Prueba", true, AHORA);
    assert!(primera.online);
    assert_eq!(primera.messages.len(), 1);
    let saludo = &primera.messages[0];
    assert_eq!(saludo.role, WindiMessageRole::Assistant);
    assert_eq!(
        saludo.text,
        "¡Hola, Prueba! Soy Windi. ¿Qué organizamos hoy con tus tarjetas o con la aplicación?"
    );
    assert!(saludo.text.contains("Prueba") && saludo.text.contains("Windi"));
    assert_eq!(windi.conversacion("Prueba", true, AHORA).messages.len(), 1);
}

#[test]
fn ca_he_14_hu01_ca02() {
    // HE-14-HU01-CA02 · Enviar un mensaje de 1 a 2000 caracteres (ET03): va a windi-chat con el JWT, el historial y
    // el contexto, y la respuesta del agente queda después del mensaje (ET06).
    let windi = ServicioDeWindi::nuevo();
    windi.conversacion("Prueba", true, AHORA);
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "¡Claro! ¿Qué tarjeta quieres revisar?",
        WindiChatResponseIntent::Answer,
    ))]);
    let r = enviar(&windi, &nube, "Hola Windi", true).unwrap();
    assert_eq!(r.reply.text, "¡Claro! ¿Qué tarjeta quieres revisar?");
    assert_eq!(r.reply.role, WindiMessageRole::Assistant);
    let peticion = &nube.peticiones()[0];
    assert_eq!(peticion.message, "Hola Windi");
    assert_eq!(peticion.history.len(), 1, "el saludo, sin el mensaje nuevo");
    assert_eq!(peticion.context.alias, "Prueba");
    assert_eq!(
        textos(&windi)
            .into_iter()
            .map(|(_, t, _)| t)
            .collect::<Vec<_>>()[1..],
        ["Hola Windi", "¡Claro! ¿Qué tarjeta quieres revisar?"]
    );
    // Un mensaje de exactamente 2000 caracteres también vale.
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "Listo.",
        WindiChatResponseIntent::Answer,
    ))]);
    assert!(enviar(&windi, &nube, &"a".repeat(2000), true).is_ok());
}

#[test]
fn ca_he_14_hu01_ca03() {
    // HE-14-HU01-CA03 · La tecla «Enter» envía igual que «Enviar» (ET05): es el mismo comando IPC-WIN-02; el
    // Núcleo responde igual a un mensaje de 1 carácter.
    let windi = ServicioDeWindi::nuevo();
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "¿En qué te ayudo?",
        WindiChatResponseIntent::Answer,
    ))]);
    assert_eq!(
        enviar(&windi, &nube, "?", true).unwrap().reply.text,
        "¿En qué te ayudo?"
    );
}

#[test]
fn ca_he_14_hu01_ca04() {
    // HE-14-HU01-CA04 · Mensaje vacío o con solo espacios: no se envía (la vista deshabilita «Enviar», ET02).
    let windi = ServicioDeWindi::nuevo();
    let nube = WindiSimulado::default();
    assert!(enviar(&windi, &nube, "   ", true).is_err());
    assert!(nube.peticiones().is_empty());
}

#[test]
fn ca_he_14_hu01_ca05() {
    // HE-14-HU01-CA05 · Más de 2000 caracteres: «Tu mensaje no puede superar los 2000 caracteres.» y no se envía
    // (ET04).
    let windi = ServicioDeWindi::nuevo();
    let nube = WindiSimulado::default();
    let e = enviar(&windi, &nube, &"a".repeat(2001), true).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::MessageTooLong,
            "Tu mensaje no puede superar los 2000 caracteres."
        )
    );
    assert!(nube.peticiones().is_empty());
}

#[test]
fn ca_he_14_hu01_ca06() {
    // HE-14-HU01-CA06 · Consulta fuera del alcance: el Núcleo muestra la respuesta del agente tal como llega (el
    // alcance lo fija la instrucción del sistema de windi-chat, ET22, ET23) y no hay propuesta.
    let windi = ServicioDeWindi::nuevo();
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "Solo puedo ayudarte con tus tarjetas y con la aplicación. ¿Revisamos lo que tienes para hoy?",
        WindiChatResponseIntent::OutOfScope,
    ))]);
    let r = enviar(&windi, &nube, "¿Quién ganó el partido?", true).unwrap();
    assert!(r.reply.text.starts_with("Solo puedo ayudarte"));
    assert!(r.proposal.is_none());
}

#[test]
fn ca_he_14_hu01_ca07() {
    // HE-14-HU01-CA07 · Sin conexión: se ve el historial, `online` es falso (ET12, ET13) y no se envía nada; el
    // historial se conserva mientras la aplicación está abierta (ET14).
    let windi = ServicioDeWindi::nuevo();
    windi.conversacion("Prueba", true, AHORA);
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "Hola.",
        WindiChatResponseIntent::Answer,
    ))]);
    enviar(&windi, &nube, "Hola", true).unwrap();
    let sin_red = windi.conversacion("Prueba", false, AHORA);
    assert!(!sin_red.online);
    assert_eq!(sin_red.messages.len(), 3);
    let e = enviar(&windi, &nube, "¿Sigues ahí?", false).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::NetOffline,
            "El agente de IA necesita conexión a internet. Podrás conversar con él cuando te reconectes."
        )
    );
    assert_eq!(nube.peticiones().len(), 1);
    // Al cerrar sesión la conversación empieza de nuevo.
    windi.olvidar();
    assert_eq!(windi.conversacion("Prueba", true, AHORA).messages.len(), 1);
}

#[test]
fn ca_he_14_hu01_ca08() {
    // HE-14-HU01-CA08 · El servicio no responde en 15 s (o falla): «No pude responder en este momento. Intenta de
    // nuevo.», el mensaje queda en el chat como fallido y «Reintentar» vuelve a enviar el mismo mensaje sin
    // duplicarlo (ET15, ET16, ET24).
    assert_eq!(ESPERA_MAXIMA, Duration::from_secs(15));
    let windi = ServicioDeWindi::nuevo();
    windi.conversacion("Prueba", true, AHORA);
    let nube = WindiSimulado::responde(vec![
        Err(FallaDeWindi::NoDisponible),
        Ok(respuesta("Ya estoy aquí.", WindiChatResponseIntent::Answer)),
    ]);
    let e = enviar(&windi, &nube, "Ayúdame", true).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::WindiUnavailable,
            "No pude responder en este momento. Intenta de nuevo."
        )
    );
    assert_eq!(
        textos(&windi)[1],
        (WindiMessageRole::User, "Ayúdame".into(), true)
    );
    let r = enviar(&windi, &nube, "Ayúdame", true).unwrap();
    assert_eq!(r.reply.text, "Ya estoy aquí.");
    assert_eq!(
        textos(&windi)[1..],
        [
            (WindiMessageRole::User, "Ayúdame".into(), false),
            (WindiMessageRole::Assistant, "Ya estoy aquí.".into(), false),
        ]
    );
    assert_eq!(nube.peticiones()[1].message, "Ayúdame");
}

#[test]
fn ca_he_14_hu01_ca09() {
    // HE-14-HU01-CA09 · Solicitud ambigua: el agente pregunta (intent `clarify`, ET21) y no hay propuesta hasta tener
    // la respuesta.
    let windi = ServicioDeWindi::nuevo();
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "¿Qué tarjeta quieres cambiar?",
        WindiChatResponseIntent::Clarify,
    ))]);
    let r = enviar(&windi, &nube, "Cámbiala", true).unwrap();
    assert_eq!(r.reply.text, "¿Qué tarjeta quieres cambiar?");
    assert!(r.proposal.is_none());
    assert!(windi.conversacion("Prueba", true, AHORA).proposal.is_none());
}

#[test]
fn contexto_minimo() {
    // D-193, HE-14-HU01-ET17: el contexto lleva alias, hoy, columnas, etiquetas y totales; las tarjetas solo
    // cuando la pregunta las necesita.
    let servicio = con_semilla();
    tarjeta_en(&servicio, POR_HACER, "Pagar la luz", "2026-11-10", 1024.0);
    tarjeta_en(
        &servicio,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        2048.0,
    );
    let hoy = chrono::NaiveDate::from_ymd_opt(2026, 11, 14).unwrap();
    let c = bloquear(contexto::<CalendarioDePrueba>(
        &servicio, USUARIO, " Prueba ", hoy, 14, "Hola",
    ))
    .unwrap();
    assert_eq!(c.alias, "Prueba");
    assert_eq!(c.today.0, "2026-11-14");
    assert_eq!(c.columns.len(), 3);
    assert_eq!(
        (
            c.totals.total,
            c.totals.overdue,
            c.totals.pending,
            c.totals.completed
        ),
        (2, 1, 1, 0)
    );
    assert!(c.cards.is_empty());
}

/// Emojis de un texto (los caracteres fuera del plano básico, como 🎉).
fn emojis(texto: &str) -> usize {
    texto.chars().filter(|c| u32::from(*c) >= 0x1F000).count()
}

#[test]
fn ca_he_14_hu02_ca02() {
    // HE-14-HU02-CA02 · Celebrar un logro: al confirmar el movimiento a Hecho, una frase breve con el alias (ET03,
    // ET08) y como máximo un emoji, porque es una celebración (ET07). La usa la confirmación de HE-14-HU06.
    let texto = ServicioDeWindi::celebracion(" Prueba ");
    assert_eq!(texto, "¡Bien hecho, Prueba! 🎉 Ya está en Hecho.");
    assert!(texto.split_whitespace().count() <= 10);
    assert_eq!(emojis(&texto), 1);
    // El saludo también lleva el alias (ET03) y no lleva más de un emoji (ET07).
    let saludo = ServicioDeWindi::nuevo()
        .conversacion("Prueba", true, AHORA)
        .messages[0]
        .text
        .clone();
    assert!(saludo.contains("Prueba") && emojis(&saludo) <= 1);
}

/// Una respuesta de windi-chat con una propuesta de mover la tarjeta `id` a `columna`.
fn propone_mover(id: &str, columna: &str) -> WindiChatResponse {
    WindiChatResponse {
        reply: "Esto es lo que voy a mover. ¿Confirmas?".into(),
        intent: WindiChatResponseIntent::Propose,
        proposal: Some(WindiChatProposal {
            action: crate::tipos::ProposalAction::Move,
            items: vec![WindiChatProposalItemsItem {
                card_id: Some(Uuid(id.into())),
                changes: Some(serde_json::json!({ "column_id": columna })),
            }],
        }),
    }
}

fn confirmar<M: ManejadorDePropuestas>(
    windi: &ServicioDeWindi,
    manejador: &M,
    propuesta: &WindiProposal,
    en_linea: bool,
) -> Result<WindiConfirmProposalResult, AppError> {
    bloquear(windi.confirmar(manejador, &propuesta.id, en_linea, AHORA))
}

#[test]
fn ca_he_14_hu03_ca01() {
    // HE-14-HU03-CA01 · Confirmar una propuesta: sin «Confirmar» nada cambia (ET01); al confirmar se aplica y Windi
    // confirma el cambio. «Rechazar» no aplica nada (ET02).
    let windi = ServicioDeWindi::nuevo();
    let manejador = ManejadorSimulado::con(&[(
        "t1",
        "Pagar la luz",
        serde_json::json!({ "column_id": "c1" }),
    )]);
    let nube = WindiSimulado::responde(vec![
        Ok(propone_mover("t1", "c2")),
        Ok(propone_mover("t1", "c3")),
    ]);
    let propuesta = enviar_con(&windi, &nube, &manejador, "Mueve Pagar la luz", true)
        .unwrap()
        .proposal
        .unwrap();
    assert_eq!(propuesta.state, ProposalState::Active);
    assert_eq!(propuesta.items[0].title, "Pagar la luz");
    assert!(manejador.aplicadas.lock().unwrap().is_empty());
    let r = confirmar(&windi, &manejador, &propuesta, true).unwrap();
    assert_eq!(r.outcome, WindiConfirmProposalResultOutcome::Applied);
    assert_eq!(r.reply.text, "Listo, ya hice el cambio.");
    assert_eq!(manejador.aplicadas.lock().unwrap().len(), 1);
    assert_eq!(
        windi
            .conversacion("Prueba", true, AHORA)
            .proposal
            .unwrap()
            .state,
        ProposalState::Confirmed
    );
    // Una propuesta confirmada no se vuelve a aplicar.
    assert_eq!(
        confirmar(&windi, &manejador, &propuesta, true)
            .unwrap_err()
            .code,
        ErrorCode::ProposalDiscarded
    );
    // «Rechazar» no aplica cambios y Windi lo dice.
    let otra = enviar_con(&windi, &nube, &manejador, "Mejor a Hecho", true)
        .unwrap()
        .proposal
        .unwrap();
    let r = bloquear(async { windi.rechazar(&otra.id, AHORA) }).unwrap();
    assert_eq!(
        r.reply.text,
        "Entendido, no hice ningún cambio. ¿Quieres cambiar algo de la propuesta?"
    );
    assert_eq!(manejador.aplicadas.lock().unwrap().len(), 1);
}

#[test]
fn ca_he_14_hu03_ca02() {
    // HE-14-HU03-CA02 · Confirmar sin conexión: no aplica nada y responde «Se perdió la conexión. No se hizo ningún
    // cambio.» (ET07); la propuesta sigue sin confirmar.
    let windi = ServicioDeWindi::nuevo();
    let manejador = ManejadorSimulado::con(&[(
        "t1",
        "Pagar la luz",
        serde_json::json!({ "column_id": "c1" }),
    )]);
    let nube = WindiSimulado::responde(vec![Ok(propone_mover("t1", "c2"))]);
    let propuesta = enviar_con(&windi, &nube, &manejador, "Mueve Pagar la luz", true)
        .unwrap()
        .proposal
        .unwrap();
    let e = confirmar(&windi, &manejador, &propuesta, false).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::NetOffline,
            "Se perdió la conexión. No se hizo ningún cambio."
        )
    );
    assert!(manejador.aplicadas.lock().unwrap().is_empty());
    assert_eq!(
        windi
            .conversacion("Prueba", true, AHORA)
            .proposal
            .unwrap()
            .state,
        ProposalState::Active
    );
}

#[test]
fn ca_he_14_hu03_ca03() {
    // HE-14-HU03-CA03 · Propuesta desactualizada: la tarjeta cambió desde otra pantalla, un widget u otro
    // computador (ET05). No aplica, explica qué cambió y propone de nuevo con los datos actuales (ET06). Si la
    // tarjeta ya no existe, lo dice y no hay propuesta nueva.
    let windi = ServicioDeWindi::nuevo();
    let manejador = ManejadorSimulado::con(&[(
        "t1",
        "Pagar la luz",
        serde_json::json!({ "column_id": "c1", "title": "Pagar la luz" }),
    )]);
    let nube = WindiSimulado::responde(vec![
        Ok(propone_mover("t1", "c2")),
        Ok(propone_mover("t1", "c2")),
    ]);
    let propuesta = enviar_con(&windi, &nube, &manejador, "Mueve Pagar la luz", true)
        .unwrap()
        .proposal
        .unwrap();
    manejador.tarjetas.lock().unwrap().insert(
        "t1".into(),
        (
            "Pagar la luz".into(),
            serde_json::json!({ "column_id": "c3", "title": "Pagar la luz" }),
        ),
    );
    let r = confirmar(&windi, &manejador, &propuesta, true).unwrap();
    assert_eq!(r.outcome, WindiConfirmProposalResultOutcome::Stale);
    assert_eq!(
        r.reply.text,
        "No hice ningún cambio porque tus tarjetas cambiaron desde que te lo propuse: «Pagar la luz» tiene otro \
         valor en la columna. Esta es la propuesta con los datos actuales. ¿Confirmas?"
    );
    assert!(manejador.aplicadas.lock().unwrap().is_empty());
    let nueva = r.new_proposal.unwrap();
    assert_eq!(nueva.state, ProposalState::Active);
    assert_eq!(
        nueva.items[0].current,
        Some(serde_json::json!({ "column_id": "c3", "title": "Pagar la luz" }))
    );
    // La tarjeta se eliminó: no hay propuesta nueva.
    let otra = enviar_con(&windi, &nube, &manejador, "Mueve Pagar la luz", true)
        .unwrap()
        .proposal
        .unwrap();
    manejador.tarjetas.lock().unwrap().clear();
    let r = confirmar(&windi, &manejador, &otra, true).unwrap();
    assert_eq!(r.outcome, WindiConfirmProposalResultOutcome::Stale);
    assert!(r.reply.text.contains("«Pagar la luz» ya no existe"));
    assert!(r.new_proposal.is_none());
}

#[test]
fn ca_he_14_hu03_ca04() {
    // HE-14-HU03-CA04 · Una sola propuesta activa (ET03): la nueva deja la anterior como «Descartada» (ET04), que ya
    // no se puede confirmar; confirmar la nueva aplica solo la nueva.
    let windi = ServicioDeWindi::nuevo();
    let manejador = ManejadorSimulado::con(&[
        (
            "t1",
            "Pagar la luz",
            serde_json::json!({ "column_id": "c1" }),
        ),
        (
            "t2",
            "Entregar informe",
            serde_json::json!({ "column_id": "c1" }),
        ),
    ]);
    let nube = WindiSimulado::responde(vec![
        Ok(propone_mover("t1", "c2")),
        Ok(propone_mover("t2", "c3")),
    ]);
    let anterior = enviar_con(&windi, &nube, &manejador, "Mueve Pagar la luz", true)
        .unwrap()
        .proposal
        .unwrap();
    let nueva = enviar_con(&windi, &nube, &manejador, "Mejor mueve el informe", true)
        .unwrap()
        .proposal
        .unwrap();
    // La propuesta activa viaja en el contexto de windi-chat.
    assert!(nube.peticiones()[1].context.active_proposal.is_some());
    assert_eq!(
        confirmar(&windi, &manejador, &anterior, true)
            .unwrap_err()
            .code,
        ErrorCode::ProposalDiscarded
    );
    confirmar(&windi, &manejador, &nueva, true).unwrap();
    let aplicadas = manejador.aplicadas.lock().unwrap();
    assert_eq!(aplicadas.len(), 1);
    assert_eq!(aplicadas[0].items[0].title, "Entregar informe");
}

// HE-14-HU04 · Crear tarjetas con el agente de IA. Hoy en las pruebas del planificador es 14/11/2026. Lo que dice
// Windi (preguntar por la fecha o el título, avisar de una etiqueta que no existe) lo produce `windi-chat`; el
// Núcleo vuelve a aplicar las reglas y sin datos válidos no muestra la propuesta.

fn propone_crear(tarjetas: Value) -> WindiChatResponse {
    WindiChatResponse {
        reply: "Esto es lo que voy a crear. ¿Confirmas?".into(),
        intent: WindiChatResponseIntent::Propose,
        proposal: Some(WindiChatProposal {
            action: crate::tipos::ProposalAction::Create,
            items: tarjetas
                .as_array()
                .unwrap()
                .iter()
                .map(|t| WindiChatProposalItemsItem {
                    card_id: None,
                    changes: Some(t.clone()),
                })
                .collect(),
        }),
    }
}

type Planificador = crate::servicio_del_planificador::ServicioDelPlanificador<CalendarioDePrueba>;

fn manejador_de(
    planificador: &Planificador,
) -> super::manejador::ManejadorDelPlanificador<'_, CalendarioDePrueba> {
    super::manejador::ManejadorDelPlanificador {
        planificador,
        user_id: USUARIO,
        alias: "Prueba",
    }
}

/// Las tarjetas de Por hacer: (título, tipo, fecha límite).
fn por_hacer(planificador: &Planificador) -> Vec<(String, String, String)> {
    let tablero = bloquear(planificador.tablero(USUARIO)).unwrap();
    tablero
        .columns
        .iter()
        .filter(|c| c.column.id.0 == POR_HACER)
        .flat_map(|c| &c.cards)
        .map(|t| {
            (
                t.title.clone(),
                serde_json::to_value(&t.r#type)
                    .unwrap()
                    .as_str()
                    .unwrap()
                    .to_string(),
                t.due_date.0.clone(),
            )
        })
        .collect()
}

fn pedir_creacion(
    planificador: &Planificador,
    windi: &ServicioDeWindi,
    tarjetas: Value,
) -> Option<WindiProposal> {
    let nube = WindiSimulado::responde(vec![Ok(propone_crear(tarjetas))]);
    enviar_con(
        windi,
        &nube,
        &manejador_de(planificador),
        "Crea una tarea",
        true,
    )
    .unwrap()
    .proposal
}

#[test]
fn ca_he_14_hu04_ca01() {
    // HE-14-HU04-CA01 · La propuesta trae Tarea por defecto, el título y la fecha límite (ET01, ET02); al confirmar
    // se crea en Por hacer con las reglas de HE-07-HU01 (ET04, ET09) y Windi menciona el título.
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{ "title": "Entregar el informe", "due_date": "2026-11-20" }]),
    )
    .unwrap();
    assert_eq!(propuesta.items[0].title, "Entregar el informe");
    let cambios = propuesta.items[0].changes.as_ref().unwrap();
    assert_eq!(
        (cambios["type"].as_str(), cambios["due_date"].as_str()),
        (Some("task"), Some("2026-11-20"))
    );
    assert!(
        por_hacer(&planificador).is_empty(),
        "sin «Confirmar» no se crea nada"
    );
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(
        r.reply.text,
        "Listo, creé la tarjeta «Entregar el informe»."
    );
    assert_eq!(
        por_hacer(&planificador),
        vec![(
            "Entregar el informe".into(),
            "task".into(),
            "2026-11-20".into()
        )]
    );
}

#[test]
fn ca_he_14_hu04_ca02() {
    // HE-14-HU04-CA02 · «Rechazar» no crea la tarjeta y Windi pregunta si quiere cambiar algo de la propuesta.
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{ "title": "Entregar el informe", "due_date": "2026-11-20" }]),
    )
    .unwrap();
    let r = windi.rechazar(&propuesta.id, AHORA).unwrap();
    assert_eq!(
        r.reply.text,
        "Entendido, no hice ningún cambio. ¿Quieres cambiar algo de la propuesta?"
    );
    assert!(por_hacer(&planificador).is_empty());
}

#[test]
fn ca_he_14_hu04_ca03() {
    // HE-14-HU04-CA03 · Sin fecha límite no hay propuesta (ET05).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_creacion(
            &planificador,
            &windi,
            serde_json::json!([{ "title": "Entregar el informe" }])
        )
        .is_none()
    );
}

#[test]
fn ca_he_14_hu04_ca04() {
    // HE-14-HU04-CA04 · Sin título (o vacío) no hay propuesta (ET05).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_creacion(
            &planificador,
            &windi,
            serde_json::json!([{ "due_date": "2026-11-20" }])
        )
        .is_none()
    );
    assert!(
        pedir_creacion(
            &planificador,
            &windi,
            serde_json::json!([{ "title": "  ", "due_date": "2026-11-20" }])
        )
        .is_none()
    );
}

#[test]
fn ca_he_14_hu04_ca05() {
    // HE-14-HU04-CA05 · Fecha límite anterior a hoy: no hay propuesta (ET06).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_creacion(
            &planificador,
            &windi,
            serde_json::json!([{ "title": "Informe", "due_date": "2026-11-13" }])
        )
        .is_none()
    );
}

#[test]
fn ca_he_14_hu04_ca06() {
    // HE-14-HU04-CA06 · Ajustar la propuesta: la nueva trae el dato cambiado y la anterior queda «Descartada».
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let primera = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{ "title": "Informe", "due_date": "2026-11-20" }]),
    )
    .unwrap();
    let segunda = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{ "title": "Informe", "due_date": "2026-11-21" }]),
    )
    .unwrap();
    assert_eq!(
        segunda.items[0].changes.as_ref().unwrap()["due_date"],
        "2026-11-21"
    );
    assert_eq!(
        confirmar(&windi, &manejador_de(&planificador), &primera, true)
            .unwrap_err()
            .code,
        ErrorCode::ProposalDiscarded
    );
    assert!(por_hacer(&planificador).is_empty());
}

#[test]
fn ca_he_14_hu04_ca07() {
    // HE-14-HU04-CA07 · Sin conexión al confirmar: no se crea la tarjeta (`net.offline`).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{ "title": "Informe", "due_date": "2026-11-20" }]),
    )
    .unwrap();
    let error = confirmar(&windi, &manejador_de(&planificador), &propuesta, false).unwrap_err();
    assert_eq!(error.code, ErrorCode::NetOffline);
    assert_eq!(
        error.message,
        "Se perdió la conexión. No se hizo ningún cambio."
    );
    assert!(por_hacer(&planificador).is_empty());
}

#[test]
fn ca_he_14_hu04_ca08() {
    // HE-14-HU04-CA08 · Varias tarjetas en una sola propuesta (ET07): se crean todas y Windi dice cuántas.
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([
            { "title": "Comprar pan", "due_date": "2026-11-15" },
            { "title": "Llamar a mamá", "due_date": "2026-11-16", "type": "reminder" },
            { "title": "Cita médica", "due_date": "2026-11-17", "type": "event" }
        ]),
    )
    .unwrap();
    assert_eq!(propuesta.items.len(), 3);
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.reply.text, "Listo, creé 3 tarjetas.");
    assert_eq!(por_hacer(&planificador).len(), 3);
}

#[test]
fn ca_he_14_hu04_ca09() {
    // HE-14-HU04-CA09 · Una etiqueta que no existe: no hay propuesta y no se crean etiquetas (ET08).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let antes = bloquear(planificador.etiquetas(USUARIO)).unwrap().len();
    assert!(
        pedir_creacion(
            &planificador,
            &windi,
            serde_json::json!([{
                "title": "Informe", "due_date": "2026-11-20",
                "label_ids": ["00000000-0000-4000-8000-0000000000ff"]
            }]),
        )
        .is_none()
    );
    assert_eq!(
        bloquear(planificador.etiquetas(USUARIO)).unwrap().len(),
        antes
    );
}

// HE-14-HU05 · Editar tarjetas con el agente de IA. Lo que Windi dice cuando no encuentra la tarjeta, cuando varias
// coinciden o cuando la fecha es anterior a hoy lo produce `windi-chat`; el Núcleo vuelve a aplicar las reglas y,
// sin una edición válida, no muestra la propuesta.

fn propone_editar(card_id: &str, cambios: Value) -> WindiChatResponse {
    WindiChatResponse {
        reply: "Esto es lo que voy a cambiar. ¿Confirmas?".into(),
        intent: WindiChatResponseIntent::Propose,
        proposal: Some(WindiChatProposal {
            action: crate::tipos::ProposalAction::Edit,
            items: vec![WindiChatProposalItemsItem {
                card_id: Some(Uuid(card_id.into())),
                changes: Some(cambios),
            }],
        }),
    }
}

fn pedir_edicion(
    planificador: &Planificador,
    windi: &ServicioDeWindi,
    card_id: &str,
    cambios: Value,
) -> Option<WindiProposal> {
    let nube = WindiSimulado::responde(vec![Ok(propone_editar(card_id, cambios))]);
    enviar_con(
        windi,
        &nube,
        &manejador_de(planificador),
        "Cambia la tarjeta",
        true,
    )
    .unwrap()
    .proposal
}

#[test]
fn ca_he_14_hu05_ca01() {
    // HE-14-HU05-CA01 · La propuesta trae el valor actual y el nuevo de cada dato que cambia (ET01); al confirmar
    // se actualiza con las reglas de HE-07-HU04 (ET02, ET07) y Windi menciona el título.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "title": "Informe final", "due_date": "2026-11-22" }),
    )
    .unwrap();
    let item = &propuesta.items[0];
    assert_eq!(item.title, "Informe");
    assert_eq!(
        item.current,
        Some(serde_json::json!({ "title": "Informe", "due_date": "2026-11-20" }))
    );
    assert_eq!(
        item.changes,
        Some(serde_json::json!({ "title": "Informe final", "due_date": "2026-11-22" }))
    );
    assert!(propuesta.warnings.is_empty());
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.reply.text, "Listo, actualicé la tarjeta «Informe final».");
    let tarjeta = bloquear(planificador.tarjeta(USUARIO, &id))
        .unwrap()
        .unwrap();
    assert_eq!(
        (tarjeta.title.as_str(), tarjeta.due_date.0.as_str()),
        ("Informe final", "2026-11-22")
    );
}

#[test]
fn ca_he_14_hu05_ca02() {
    // HE-14-HU05-CA02 · «Rechazar» no modifica la tarjeta y Windi dice que no hay cambios.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "title": "Otro" }),
    )
    .unwrap();
    let r = windi.rechazar(&propuesta.id, AHORA).unwrap();
    assert!(
        r.reply
            .text
            .starts_with("Entendido, no hice ningún cambio.")
    );
    assert_eq!(
        bloquear(planificador.tarjeta(USUARIO, &id))
            .unwrap()
            .unwrap()
            .title,
        "Informe"
    );
}

#[test]
fn ca_he_14_hu05_ca03() {
    // HE-14-HU05-CA03 · Una tarjeta que no existe: ninguna propuesta (ET08).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_edicion(
            &planificador,
            &windi,
            "00000000-0000-4000-8000-0000000000ee",
            serde_json::json!({ "title": "Otro" })
        )
        .is_none()
    );
}

#[test]
fn ca_he_14_hu05_ca04() {
    // HE-14-HU05-CA04 · Varias tarjetas coinciden: Windi recibe en el contexto las que comparten palabras con el
    // mensaje, con su título y fecha límite (ET03), para preguntar a cuál se refiere.
    let planificador = con_semilla();
    tarjeta_en(
        &planificador,
        POR_HACER,
        "Pagar la luz",
        "2026-11-20",
        1024.0,
    );
    tarjeta_en(
        &planificador,
        POR_HACER,
        "Pagar el agua",
        "2026-11-25",
        2048.0,
    );
    tarjeta_en(
        &planificador,
        POR_HACER,
        "Llamar a mamá",
        "2026-11-21",
        3072.0,
    );
    let hoy = chrono::NaiveDate::from_ymd_opt(2026, 11, 14).unwrap();
    let c = bloquear(contexto::<CalendarioDePrueba>(
        &planificador,
        USUARIO,
        "Prueba",
        hoy,
        14,
        "Cambia la fecha de la tarjeta de pagar",
    ))
    .unwrap();
    let mut vistas: Vec<(String, String)> = c
        .cards
        .iter()
        .map(|t| (t.title.clone(), t.due_date.0.clone()))
        .collect();
    vistas.sort();
    assert_eq!(
        vistas,
        vec![
            ("Pagar el agua".to_string(), "2026-11-25".to_string()),
            ("Pagar la luz".to_string(), "2026-11-20".to_string()),
        ]
    );
}

#[test]
fn ca_he_14_hu05_ca05() {
    // HE-14-HU05-CA05 · Fecha límite anterior a hoy: no hay propuesta (ET04).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_edicion(
            &planificador,
            &windi,
            &id,
            serde_json::json!({ "due_date": "2026-11-13" })
        )
        .is_none()
    );
}

#[test]
fn ca_he_14_hu05_ca06() {
    // HE-14-HU05-CA06 · Una tarjeta completada se puede editar con el aviso de ET05; editarla no cambia su columna.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    bloquear(planificador.marcar_completada(
        USUARIO,
        crate::tipos::CardSetCompletedParams {
            card_id: Uuid(id.clone()),
            completed: true,
        },
    ))
    .unwrap();
    let antes = bloquear(planificador.tarjeta(USUARIO, &id))
        .unwrap()
        .unwrap()
        .column_id;
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "title": "Informe final" }),
    )
    .unwrap();
    assert_eq!(
        propuesta.warnings,
        vec!["Esta tarjeta está completada. Editarla no cambia su columna.".to_string()]
    );
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    let tarjeta = bloquear(planificador.tarjeta(USUARIO, &id))
        .unwrap()
        .unwrap();
    assert_eq!(
        (tarjeta.title.as_str(), tarjeta.column_id),
        ("Informe final", antes)
    );
}

#[test]
fn ca_he_14_hu05_ca07() {
    // HE-14-HU05-CA07 · Pedir un valor que ya tiene: ninguna propuesta (ET09).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_edicion(
            &planificador,
            &windi,
            &id,
            serde_json::json!({ "due_date": "2026-11-20" })
        )
        .is_none()
    );
}

// HE-14-HU06 · Mover tarjetas con el agente de IA. Lo que dice Windi (columna inexistente, varias coinciden) lo
// produce `windi-chat`; el Núcleo vuelve a aplicar las reglas y sin un movimiento válido no muestra la propuesta.

fn pedir_movimiento(
    planificador: &Planificador,
    windi: &ServicioDeWindi,
    card_id: &str,
    columna: &str,
) -> Option<WindiProposal> {
    let respuesta = WindiChatResponse {
        reply: "Esto es lo que voy a mover. ¿Confirmas?".into(),
        intent: WindiChatResponseIntent::Propose,
        proposal: Some(WindiChatProposal {
            action: crate::tipos::ProposalAction::Move,
            items: vec![WindiChatProposalItemsItem {
                card_id: Some(Uuid(card_id.into())),
                changes: Some(serde_json::json!({ "column_id": columna })),
            }],
        }),
    };
    let nube = WindiSimulado::responde(vec![Ok(respuesta)]);
    enviar_con(
        windi,
        &nube,
        &manejador_de(planificador),
        "Mueve la tarjeta",
        true,
    )
    .unwrap()
    .proposal
}

fn columna_de(planificador: &Planificador, id: &str) -> (String, bool) {
    let t = bloquear(planificador.tarjeta(USUARIO, id))
        .unwrap()
        .unwrap();
    (t.column_id.0.to_lowercase(), t.is_completed)
}

/// Una tarjeta en Hecho, completada con `card_move`.
fn completada(planificador: &Planificador) -> String {
    let id = tarjeta_en(planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    bloquear(planificador.mover_tarjeta(
        USUARIO,
        crate::tipos::CardMoveParams {
            card_id: Uuid(id.clone()),
            column_id: Uuid(HECHO.into()),
            placement: crate::tipos::Placement::Variant1(crate::tipos::PlacementVariant1 {
                kind: crate::tipos::PlacementVariant1Kind::End,
            }),
        },
    ))
    .unwrap();
    id
}

#[test]
fn ca_he_14_hu06_ca01() {
    // HE-14-HU06-CA01 · La propuesta trae la columna actual y la de destino (ET01); al confirmar se mueve con las
    // reglas de HE-09-HU02 (ET09) y Windi menciona el título y la columna.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_movimiento(&planificador, &windi, &id, EN_PROGRESO).unwrap();
    let cambios = propuesta.items[0].changes.as_ref().unwrap();
    assert_eq!(cambios["from_column"], "Por hacer");
    assert_eq!(cambios["to_column"], "En progreso");
    assert!(propuesta.warnings.is_empty());
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(
        r.reply.text,
        "Listo, moví la tarjeta «Informe» a En progreso."
    );
    assert_eq!(columna_de(&planificador, &id), (EN_PROGRESO.into(), false));
}

#[test]
fn ca_he_14_hu06_ca02() {
    // HE-14-HU06-CA02 · A Hecho: queda completada con fecha (ET02) y Windi celebra (HE-14-HU02-CA02).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_movimiento(&planificador, &windi, &id, HECHO).unwrap();
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.reply.text, ServicioDeWindi::celebracion("Prueba"));
    let t = bloquear(planificador.tarjeta(USUARIO, &id))
        .unwrap()
        .unwrap();
    assert!(t.is_completed);
    assert_eq!(t.completed_on.map(|f| f.0), Some("2026-11-14".into()));
}

#[test]
fn ca_he_14_hu06_ca03() {
    // HE-14-HU06-CA03 · «Rechazar» no mueve la tarjeta.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_movimiento(&planificador, &windi, &id, EN_PROGRESO).unwrap();
    let r = windi.rechazar(&propuesta.id, AHORA).unwrap();
    assert!(
        r.reply
            .text
            .starts_with("Entendido, no hice ningún cambio.")
    );
    assert_eq!(columna_de(&planificador, &id), (POR_HACER.into(), false));
}

#[test]
fn ca_he_14_hu06_ca04() {
    // HE-14-HU06-CA04 · Columna inexistente: ninguna propuesta (ET08).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_movimiento(
            &planificador,
            &windi,
            &id,
            "00000000-0000-4000-8000-0000000000ff"
        )
        .is_none()
    );
}

#[test]
fn ca_he_14_hu06_ca05() {
    // HE-14-HU06-CA05 · Tarjeta inexistente: ninguna propuesta (ET10).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert!(
        pedir_movimiento(
            &planificador,
            &windi,
            "00000000-0000-4000-8000-0000000000ee",
            HECHO
        )
        .is_none()
    );
}

#[test]
fn ca_he_14_hu06_ca06() {
    // HE-14-HU06-CA06 · Sacar de Hecho: aviso literal (ET05) y al confirmar deja de estar completada (ET03).
    let planificador = con_semilla();
    let id = completada(&planificador);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_movimiento(&planificador, &windi, &id, POR_HACER).unwrap();
    assert_eq!(
        propuesta.warnings,
        vec!["Esta tarjeta está completada. Si la mueves, dejará de estar completada y se borrará su fecha de completado.".to_string()]
    );
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    let t = bloquear(planificador.tarjeta(USUARIO, &id))
        .unwrap()
        .unwrap();
    assert!(!t.is_completed);
    assert!(t.completed_on.is_none());
}

#[test]
fn ca_he_14_hu06_ca07() {
    // HE-14-HU06-CA07 · Ya está en esa columna: ninguna propuesta (ET11).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert!(pedir_movimiento(&planificador, &windi, &id, POR_HACER).is_none());
}

#[test]
fn ca_he_14_hu06_ca08() {
    // HE-14-HU06-CA08 · Varias coinciden: Windi recibe el título, la fecha límite y la columna de cada una (ET07).
    let planificador = con_semilla();
    tarjeta_en(
        &planificador,
        POR_HACER,
        "Pagar la luz",
        "2026-11-20",
        1024.0,
    );
    tarjeta_en(
        &planificador,
        EN_PROGRESO,
        "Pagar el agua",
        "2026-11-25",
        1024.0,
    );
    let c = bloquear(contexto(
        &planificador,
        USUARIO,
        "Prueba",
        planificador.hoy(),
        12,
        "Mueve la de pagar",
    ))
    .unwrap();
    let mut vistas: Vec<_> = c
        .cards
        .iter()
        .map(|t| {
            (
                t.title.clone(),
                t.due_date.0.clone(),
                t.column_id.0.to_lowercase(),
            )
        })
        .collect();
    vistas.sort();
    assert_eq!(
        vistas,
        vec![
            (
                "Pagar el agua".into(),
                "2026-11-25".into(),
                EN_PROGRESO.into()
            ),
            ("Pagar la luz".into(), "2026-11-20".into(), POR_HACER.into()),
        ]
    );
}
