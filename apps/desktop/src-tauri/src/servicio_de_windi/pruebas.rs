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
    async fn preparar(&self, propuesta: &WindiChatProposal) -> Result<WindiProposal, AppError> {
        let tarjetas = self.tarjetas.lock().unwrap();
        Ok(WindiProposal {
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
        })
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
    // Una propuesta de windi-chat que el Núcleo no entiende (mover sin columna) es una respuesta inválida: el mismo
    // mensaje fallido, nunca el error genérico.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let mut invalida = propone_mover(&id, "x");
    if let Some(p) = invalida.proposal.as_mut() {
        p.items[0].changes = Some(serde_json::json!({}));
    }
    let nube = WindiSimulado::responde(vec![Ok(invalida)]);
    let e = enviar_con(&windi, &nube, &manejador_de(&planificador), "Muévela", true).unwrap_err();
    assert_eq!(e.code, ErrorCode::WindiUnavailable);
    assert!(
        textos(&windi).last().unwrap().2,
        "el mensaje queda como fallido"
    );
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
    // D-193, HE-14-HU01-ET17: el contexto lleva alias, hoy, columnas, etiquetas y totales; desde HE-14-HU09 también
    // las tarjetas (hasta 200), para responder preguntas por estado, fecha, columna, etiqueta o prioridad.
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
    assert_eq!(c.cards.len(), 2);
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
    let consulta = if en_linea {
        ConsultaALaNube::Lista
    } else {
        ConsultaALaNube::SinConexion
    };
    confirmar_con(windi, manejador, propuesta, consulta)
}

fn confirmar_con<M: ManejadorDePropuestas>(
    windi: &ServicioDeWindi,
    manejador: &M,
    propuesta: &WindiProposal,
    consulta: ConsultaALaNube,
) -> Result<WindiConfirmProposalResult, AppError> {
    bloquear(windi.confirmar(manejador, &propuesta.id, consulta, AHORA))
}

/// El estado de la propuesta activa o la última de la conversación.
fn estado_de_la_propuesta(windi: &ServicioDeWindi) -> Option<ProposalState> {
    windi
        .conversacion("Prueba", true, AHORA)
        .proposal
        .map(|p| p.state)
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

#[test]
fn ca_he_14_hu03_ca05() {
    // HE-14-HU03-CA05 · Escribir «sí» en lugar de seleccionar «Confirmar»: Windi pide usar «Confirmar» (lo dice la
    // instrucción de windi-chat; la prueba de Vitest la revisa), no aplica nada y la propuesta sigue activa (ET09).
    let windi = ServicioDeWindi::nuevo();
    let manejador = ManejadorSimulado::con(&[(
        "t1",
        "Pagar la luz",
        serde_json::json!({ "column_id": "c1" }),
    )]);
    let nube = WindiSimulado::responde(vec![
        Ok(propone_mover("t1", "c2")),
        Ok(respuesta(
            "Para aplicar el cambio, selecciona «Confirmar» en la propuesta.",
            WindiChatResponseIntent::Answer,
        )),
    ]);
    let propuesta = enviar_con(&windi, &nube, &manejador, "Mueve Pagar la luz", true)
        .unwrap()
        .proposal
        .unwrap();
    let r = enviar_con(&windi, &nube, &manejador, "sí", true).unwrap();
    assert!(r.proposal.is_none());
    assert!(r.reply.text.contains("«Confirmar»"));
    assert!(manejador.aplicadas.lock().unwrap().is_empty());
    assert_eq!(estado_de_la_propuesta(&windi), Some(ProposalState::Active));
    confirmar(&windi, &manejador, &propuesta, true).unwrap();
    assert_eq!(manejador.aplicadas.lock().unwrap().len(), 1);
}

#[test]
fn ca_he_14_hu03_ca06() {
    // HE-14-HU03-CA06 · No se puede preparar la propuesta: Windi responde el motivo con su texto (ET10), sin un
    // texto que anuncie un cambio, y la propuesta anterior sigue activa y se puede confirmar.
    let planificador = con_semilla();
    tarjeta_en(
        &planificador,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let pan = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{ "title": "Comprar pan", "due_date": "2026-11-20" }]),
    )
    .unwrap();
    let (code, texto) = rechazo(
        &planificador,
        &windi,
        propone_mover("Entregar informe", "Archivo"),
    );
    assert_eq!(code, ErrorCode::WindiColumnNotFound);
    assert_eq!(
        texto,
        "No encuentro la columna “Archivo”. Tus columnas son: Por hacer, En progreso, Hecho."
    );
    assert_eq!(estado_de_la_propuesta(&windi), Some(ProposalState::Active));
    confirmar(&windi, &manejador_de(&planificador), &pan, true).unwrap();
    assert!(
        por_hacer(&planificador)
            .iter()
            .any(|(titulo, _, _)| titulo == "Comprar pan")
    );
}

#[test]
fn ca_he_14_hu03_ca07() {
    // HE-14-HU03-CA07 · No se puede aplicar la propuesta: si falla la segunda de 3 tarjetas no se crea ninguna
    // (ET12), Windi responde «No pude aplicar los cambios. No se hizo ningún cambio.» (`windi.apply_failed`) y la
    // propuesta sigue activa, con «Confirmar» y «Rechazar» habilitadas.
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([
            { "title": "Primera", "due_date": "2026-11-20" },
            { "title": "Segunda", "due_date": "2026-11-20" },
            { "title": "Tercera", "due_date": "2026-11-20" }
        ]),
    )
    .unwrap();
    let falla = |sql: &str| {
        let sql = sql.to_string();
        bloquear(async {
            sqlx::query(&sql)
                .execute(planificador.base().pool().await.unwrap())
                .await
                .unwrap();
        });
    };
    falla(
        "CREATE TRIGGER falla_la_segunda BEFORE INSERT ON card WHEN NEW.title = 'Segunda' \
         BEGIN SELECT RAISE(ABORT, 'falla'); END",
    );
    let e = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::WindiApplyFailed,
            "No pude aplicar los cambios. No se hizo ningún cambio."
        )
    );
    assert!(por_hacer(&planificador).is_empty());
    assert_eq!(estado_de_la_propuesta(&windi), Some(ProposalState::Active));
    // La misma propuesta se puede confirmar después.
    falla("DROP TRIGGER falla_la_segunda");
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(por_hacer(&planificador).len(), 3);
}

#[test]
fn ca_he_14_hu03_ca08() {
    // HE-14-HU03-CA08 · Otro dato de la tarjeta cambió (la prioridad, desde otro computador): no se aplica y Windi
    // actúa como en CA03 (ET05: «no cambiaron en ningún dato»).
    let planificador = con_semilla();
    let id = tarjeta_en(
        &planificador,
        POR_HACER,
        "Entregar informe",
        "2026-11-20",
        1024.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "title": "Entregar informe final" }),
    )
    .unwrap();
    bloquear(planificador.actualizar_tarjeta(
        USUARIO,
        crate::tipos::CardUpdateParams {
            id: Uuid(id.clone()),
            patch: serde_json::from_value(serde_json::json!({ "priority": "high" })).unwrap(),
        },
    ))
    .unwrap();
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.outcome, WindiConfirmProposalResultOutcome::Stale);
    assert!(
        r.reply
            .text
            .contains("«Entregar informe» tiene otro valor en la prioridad")
    );
    assert_eq!(
        bloquear(planificador.tarjeta(USUARIO, &id))
            .unwrap()
            .unwrap()
            .title,
        "Entregar informe"
    );
}

#[test]
fn ca_he_14_hu03_et13() {
    // HE-14-HU03-ET13 · Con conexión y una consulta a la nube fallida, como en ET12: `windi.apply_failed` y la
    // propuesta sigue activa. Antes de aplicar, las fechas se vuelven a validar con el día de hoy.
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{ "title": "Informe", "due_date": "2026-11-14" }]),
    )
    .unwrap();
    let e = confirmar_con(
        &windi,
        &manejador_de(&planificador),
        &propuesta,
        ConsultaALaNube::Fallida,
    )
    .unwrap_err();
    assert_eq!(
        (e.code, e.message.as_str()),
        (
            ErrorCode::WindiApplyFailed,
            "No pude aplicar los cambios. No se hizo ningún cambio."
        )
    );
    assert_eq!(estado_de_la_propuesta(&windi), Some(ProposalState::Active));
    // Pasó la medianoche: la fecha límite quedó antes de hoy y la propuesta no se aplica.
    planificador
        .calendario()
        .0
        .fetch_add(86_400_000, std::sync::atomic::Ordering::SeqCst);
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.outcome, WindiConfirmProposalResultOutcome::Stale);
    assert_eq!(r.reply.text, "La fecha límite no puede ser anterior a hoy.");
    assert!(r.new_proposal.is_none());
    assert!(por_hacer(&planificador).is_empty());
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

/// HE-14-HU03-ET10: el motivo de rechazo de `preparar`, con su código y su texto. Windi responde ese texto en el
/// chat, sin propuesta y sin «¿Confirmas?».
fn rechazo(
    planificador: &Planificador,
    windi: &ServicioDeWindi,
    respuesta: WindiChatResponse,
) -> (ErrorCode, String) {
    let motivo =
        bloquear(manejador_de(planificador).preparar(respuesta.proposal.as_ref().unwrap()))
            .unwrap_err();
    let nube = WindiSimulado::responde(vec![Ok(respuesta)]);
    let r = enviar_con(windi, &nube, &manejador_de(planificador), "Hazlo", true).unwrap();
    assert!(r.proposal.is_none());
    assert_eq!(r.reply.text, motivo.message);
    assert!(!r.reply.text.contains("¿Confirmas?"));
    (motivo.code, motivo.message)
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
    // HE-14-HU04-CA03 · Sin fecha límite no hay propuesta (ET05) y Windi la pide (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_crear(serde_json::json!([{ "title": "Entregar el informe" }]))
        ),
        (
            ErrorCode::DueDateRequired,
            "A la tarjeta “Entregar el informe” le falta la fecha límite. ¿Para cuándo es?".into()
        )
    );
}

#[test]
fn ca_he_14_hu04_ca04() {
    // HE-14-HU04-CA04 · Sin título (o vacío) no hay propuesta (ET05) y Windi lo pide (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    for tarjeta in [
        serde_json::json!({ "due_date": "2026-11-20" }),
        serde_json::json!({ "title": "  ", "due_date": "2026-11-20" }),
    ] {
        assert_eq!(
            rechazo(
                &planificador,
                &windi,
                propone_crear(serde_json::json!([tarjeta]))
            ),
            (
                ErrorCode::TitleRequired,
                "Falta el título de una de las tarjetas. ¿Cómo se llama?".into()
            )
        );
    }
}

#[test]
fn ca_he_14_hu04_ca05() {
    // HE-14-HU04-CA05 · Fecha límite anterior a hoy: no hay propuesta (ET06) y Windi da el motivo de HE-07-HU01.
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_crear(serde_json::json!([{ "title": "Informe", "due_date": "2026-11-13" }]))
        ),
        (
            ErrorCode::DueDateInPast,
            "La fecha límite no puede ser anterior a hoy.".into()
        )
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
    // HE-14-HU04-CA09 · Una etiqueta que no existe: no hay propuesta, Windi lo dice con las etiquetas que hay
    // (HE-14-HU03-ET10) y no se crean etiquetas (ET08).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let etiquetas: Vec<String> = bloquear(planificador.etiquetas(USUARIO))
        .unwrap()
        .into_iter()
        .map(|e| e.name)
        .collect();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_crear(serde_json::json!([{
                "title": "Informe", "due_date": "2026-11-20", "label_ids": ["Viaje"]
            }]))
        ),
        (
            ErrorCode::WindiLabelNotFound,
            format!(
                "No tienes la etiqueta “Viaje”. Tus etiquetas son: {}.",
                etiquetas.join(", ")
            )
        )
    );
    assert_eq!(
        bloquear(planificador.etiquetas(USUARIO)).unwrap().len(),
        etiquetas.len()
    );
}

#[test]
fn ca_he_14_hu04_ca11() {
    // HE-14-HU04-CA11 · Una tarjeta no válida entre varias: no hay propuesta y el mensaje nombra la tarjeta no
    // válida con su motivo (ET12).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_crear(serde_json::json!([
                { "title": "Comprar pan", "due_date": "2026-11-15" },
                { "title": "Informe", "due_date": "2026-11-13" },
                { "title": "Cita médica", "due_date": "2026-11-17" }
            ]))
        ),
        (
            ErrorCode::DueDateInPast,
            "“Informe”: La fecha límite no puede ser anterior a hoy.".into()
        )
    );
    assert!(por_hacer(&planificador).is_empty());
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
    // HE-14-HU03-ET05: `current` guarda el estado completo de la tarjeta, para detectar un cambio en cualquier dato.
    let antes = bloquear(planificador.tarjeta(USUARIO, &id))
        .unwrap()
        .unwrap();
    assert_eq!(
        item.current,
        Some(super::manejador::estado_de_la_tarjeta(&antes))
    );
    let actual = item.current.as_ref().unwrap();
    assert_eq!(
        (&actual["title"], &actual["due_date"]),
        (&Value::from("Informe"), &Value::from("2026-11-20"))
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
    // HE-14-HU05-CA03 · Una tarjeta que no existe: ninguna propuesta (ET08) y Windi pide más detalles
    // (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_editar("Viaje a Cali", serde_json::json!({ "title": "Otro" }))
        ),
        (
            ErrorCode::WindiCardNotFound,
            "No encuentro una tarjeta llamada “Viaje a Cali”. ¿Me das más detalles?".into()
        )
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
    // Las relacionadas con el mensaje van primero (desde HE-14-HU09 el contexto lleva también las demás).
    let mut vistas: Vec<(String, String)> = c
        .cards
        .iter()
        .take(2)
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
    // HE-14-HU05-CA05 · Fecha límite anterior a hoy: no hay propuesta (ET04) y Windi da el motivo de HE-07-HU04.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_editar(&id, serde_json::json!({ "due_date": "2026-11-13" }))
        ),
        (
            ErrorCode::DueDateInPast,
            "La fecha límite no puede ser anterior a hoy.".into()
        )
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
    // HE-14-HU05-CA07 · Pedir un valor que ya tiene: ninguna propuesta (ET09) y Windi lo dice (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_editar(&id, serde_json::json!({ "due_date": "2026-11-20" }))
        ),
        (
            ErrorCode::WindiSameValue,
            "La tarjeta “Informe” ya tiene ese valor.".into()
        )
    );
}

#[test]
fn ca_he_14_hu05_et12() {
    // HE-14-HU05-ET12 · La prioridad y la descripción se pueden quitar: `null` o "" las deja sin valor.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    bloquear(
        planificador.actualizar_tarjeta(
            USUARIO,
            crate::tipos::CardUpdateParams {
                id: Uuid(id.clone()),
                patch: serde_json::from_value(
                    serde_json::json!({ "priority": "high", "description": "Para el lunes" }),
                )
                .unwrap(),
            },
        ),
    )
    .unwrap();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "priority": null, "description": "" }),
    )
    .unwrap();
    assert_eq!(
        propuesta.items[0].changes,
        Some(serde_json::json!({ "priority": null, "description": null }))
    );
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    let tarjeta = bloquear(planificador.tarjeta(USUARIO, &id))
        .unwrap()
        .unwrap();
    assert!(tarjeta.priority.is_none() && tarjeta.description.is_none());
}

// HE-14-HU05 (P24): varias tarjetas en una propuesta (ET10), etiquetas por nombre (ET11, ET14) y bloque horario
// (ET13).

fn propone_editar_varias(ediciones: Vec<(String, Value)>) -> WindiChatResponse {
    WindiChatResponse {
        reply: "Esto es lo que voy a cambiar. ¿Confirmas?".into(),
        intent: WindiChatResponseIntent::Propose,
        proposal: Some(WindiChatProposal {
            action: crate::tipos::ProposalAction::Edit,
            items: ediciones
                .into_iter()
                .map(|(id, cambios)| WindiChatProposalItemsItem {
                    card_id: Some(Uuid(id)),
                    changes: Some(cambios),
                })
                .collect(),
        }),
    }
}

fn etiqueta(planificador: &Planificador, nombre: &str, color: &str) -> String {
    bloquear(planificador.crear_etiqueta(
        USUARIO,
        crate::tipos::LabelCreateParams {
            name: nombre.into(),
            color_id: color.into(),
        },
    ))
    .unwrap()
    .valor
    .id
    .0
    .to_lowercase()
}

fn poner_etiquetas(planificador: &Planificador, id: &str, etiquetas: &[&str]) {
    bloquear(planificador.actualizar_tarjeta(
        USUARIO,
        crate::tipos::CardUpdateParams {
            id: Uuid(id.into()),
            patch: serde_json::from_value(serde_json::json!({ "label_ids": etiquetas })).unwrap(),
        },
    ))
    .unwrap();
}

fn etiquetas_de(planificador: &Planificador, id: &str) -> Vec<String> {
    let mut ids: Vec<String> = bloquear(planificador.tarjeta(USUARIO, id))
        .unwrap()
        .unwrap()
        .label_ids
        .into_iter()
        .map(|u| u.0.to_lowercase())
        .collect();
    ids.sort();
    ids
}

fn bloque_de(planificador: &Planificador, id: &str) -> Option<(String, u8)> {
    let t = bloquear(planificador.tarjeta(USUARIO, id))
        .unwrap()
        .unwrap();
    t.scheduled_date
        .map(|d| d.0)
        .zip(t.scheduled_hour.map(|h| h.0))
}

fn pedir_varias(
    planificador: &Planificador,
    windi: &ServicioDeWindi,
    ediciones: Vec<(String, Value)>,
) -> WindiProposal {
    let nube = WindiSimulado::responde(vec![Ok(propone_editar_varias(ediciones))]);
    enviar_con(
        windi,
        &nube,
        &manejador_de(planificador),
        "Cambia las tarjetas",
        true,
    )
    .unwrap()
    .proposal
    .unwrap()
}

#[test]
fn ca_he_14_hu05_ca08() {
    // HE-14-HU05-CA08 · Dos tarjetas en una propuesta (ET10): al confirmar se actualizan las dos y Windi dice cuántas.
    let planificador = con_semilla();
    let luz = tarjeta_en(
        &planificador,
        POR_HACER,
        "Pagar la luz",
        "2026-11-15",
        1024.0,
    );
    let agua = tarjeta_en(
        &planificador,
        POR_HACER,
        "Pagar el agua",
        "2026-11-16",
        2048.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let viernes = serde_json::json!({ "due_date": "2026-11-20" });
    let propuesta = pedir_varias(
        &planificador,
        &windi,
        vec![
            (luz.clone(), viernes.clone()),
            (agua.clone(), viernes.clone()),
        ],
    );
    assert_eq!(propuesta.items.len(), 2);
    assert!(
        propuesta
            .items
            .iter()
            .all(|i| i.changes.as_ref() == Some(&viernes))
    );
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.reply.text, "Listo, actualicé 2 tarjetas.");
    for id in [&luz, &agua] {
        let t = bloquear(planificador.tarjeta(USUARIO, id))
            .unwrap()
            .unwrap();
        assert_eq!(t.due_date.0, "2026-11-20");
    }
}

#[test]
fn ca_he_14_hu05_ca09() {
    // HE-14-HU05-CA09 · Agregar una etiqueta por su nombre conserva las demás (ET11).
    let planificador = con_semilla();
    let trabajo = etiqueta(&planificador, "Trabajo", "blue");
    let urgente = etiqueta(&planificador, "Urgente", "green");
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    poner_etiquetas(&planificador, &id, &[&trabajo]);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_varias(
        &planificador,
        &windi,
        vec![(
            id.clone(),
            serde_json::json!({ "add_labels": ["urgente"], "remove_labels": [] }),
        )],
    );
    assert_eq!(
        propuesta.items[0].changes,
        Some(serde_json::json!({ "label_ids": [trabajo, urgente] }))
    );
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    let mut esperadas = vec![trabajo, urgente];
    esperadas.sort();
    assert_eq!(etiquetas_de(&planificador, &id), esperadas);
}

#[test]
fn ca_he_14_hu05_ca10() {
    // HE-14-HU05-CA10 · Una etiqueta que no existe: no hay propuesta y Windi dice las que hay (HE-14-HU03-ET10).
    let planificador = con_semilla();
    etiqueta(&planificador, "Trabajo", "blue");
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let nombres: Vec<String> = bloquear(planificador.etiquetas(USUARIO))
        .unwrap()
        .into_iter()
        .map(|e| e.name)
        .collect();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_editar(&id, serde_json::json!({ "add_labels": ["Viaje"] }))
        ),
        (
            ErrorCode::WindiLabelNotFound,
            format!(
                "No tienes la etiqueta “Viaje”. Tus etiquetas son: {}.",
                nombres.join(", ")
            )
        )
    );
    assert!(etiquetas_de(&planificador, &id).is_empty());
}

#[test]
fn ca_he_14_hu05_ca11() {
    // HE-14-HU05-CA11 · Asignar el bloque de mañana de 10:00 a 11:00 (ET13): al confirmar la tarjeta queda en él.
    let planificador = con_semilla();
    let id = tarjeta_en(
        &planificador,
        POR_HACER,
        "Estudiar redes",
        "2026-11-20",
        1024.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "time_block": { "date": "2026-11-15", "start_hour": 10 } }),
    )
    .unwrap();
    assert_eq!(
        propuesta.items[0].changes,
        Some(serde_json::json!({
            "time_block": { "date": "2026-11-15", "start_hour": 10, "end_hour": 11 }
        }))
    );
    assert_eq!(
        propuesta.items[0].current.as_ref().unwrap()["time_block"],
        Value::Null
    );
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(
        bloque_de(&planificador, &id),
        Some(("2026-11-15".into(), 10))
    );
}

#[test]
fn ca_he_14_hu05_ca12() {
    // HE-14-HU05-CA12 · Quitar el bloque horario (ET12, ET13): al confirmar la tarjeta queda sin bloque.
    let planificador = con_semilla();
    let id = tarjeta_en(
        &planificador,
        POR_HACER,
        "Estudiar redes",
        "2026-11-20",
        1024.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let asignar = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "time_block": { "date": "2026-11-15", "start_hour": 10 } }),
    )
    .unwrap();
    confirmar(&windi, &manejador_de(&planificador), &asignar, true).unwrap();
    let quitar = pedir_edicion(
        &planificador,
        &windi,
        &id,
        serde_json::json!({ "time_block": null }),
    )
    .unwrap();
    assert_eq!(
        quitar.items[0].current.as_ref().unwrap()["time_block"],
        serde_json::json!({ "date": "2026-11-15", "start_hour": 10, "end_hour": 11 })
    );
    assert_eq!(
        quitar.items[0].changes,
        Some(serde_json::json!({ "time_block": null }))
    );
    confirmar(&windi, &manejador_de(&planificador), &quitar, true).unwrap();
    assert_eq!(bloque_de(&planificador, &id), None);
}

#[test]
fn ca_he_14_hu05_et13() {
    // HE-14-HU05-ET13 · El bloque cumple las reglas de HE-11-HU02: no uno que ya pasó ni uno después de la fecha
    // límite que quedará. Sin propuesta, con el motivo de HE-11.
    let planificador = con_semilla();
    let id = tarjeta_en(
        &planificador,
        POR_HACER,
        "Estudiar redes",
        "2026-11-20",
        1024.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let casos = [
        (
            serde_json::json!({ "time_block": { "date": "2026-11-13", "start_hour": 10 } }),
            ErrorCode::TimeBlockPast,
            "No puedes asignar tarjetas a un bloque horario que ya pasó.",
        ),
        (
            serde_json::json!({ "time_block": { "date": "2026-11-21", "start_hour": 10 } }),
            ErrorCode::TimeBlockAfterDueDate,
            "No puedes programar la tarjeta después de su fecha límite.",
        ),
        (
            // La fecha límite que quedará es la nueva.
            serde_json::json!({
                "due_date": "2026-11-16",
                "time_block": { "date": "2026-11-18", "start_hour": 10 }
            }),
            ErrorCode::TimeBlockAfterDueDate,
            "No puedes programar la tarjeta después de su fecha límite.",
        ),
    ];
    for (cambios, codigo, texto) in casos {
        assert_eq!(
            rechazo(&planificador, &windi, propone_editar(&id, cambios)),
            (codigo, texto.to_string())
        );
    }
    assert_eq!(bloque_de(&planificador, &id), None);
}

#[test]
fn ca_he_14_hu05_et14() {
    // HE-14-HU05-ET14 · Una tarjeta tiene máximo 5 etiquetas: con más no hay propuesta y Windi da el motivo.
    let planificador = con_semilla();
    let nombres = ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis"];
    for n in nombres {
        etiqueta(&planificador, n, "blue");
    }
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_editar(&id, serde_json::json!({ "add_labels": nombres }))
        ),
        (
            ErrorCode::LabelsTooMany,
            "Puedes asignar máximo 5 etiquetas por tarjeta.".into()
        )
    );
}

#[test]
fn ca_he_14_hu04_ca10() {
    // HE-14-HU04-CA10 · Crear con bloque horario: la propuesta lo trae y al confirmar la tarjeta queda en él. Las
    // reglas de HE-11-HU02 se aplican al preparar (ET11).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_creacion(
        &planificador,
        &windi,
        serde_json::json!([{
            "title": "Estudiar redes",
            "due_date": "2026-11-20",
            "time_block": { "date": "2026-11-15", "start_hour": 10 }
        }]),
    )
    .unwrap();
    assert_eq!(
        propuesta.items[0].changes.as_ref().unwrap()["time_block"],
        serde_json::json!({ "date": "2026-11-15", "start_hour": 10, "end_hour": 11 })
    );
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    let tablero = bloquear(planificador.tablero(USUARIO)).unwrap();
    let creada = tablero
        .columns
        .iter()
        .flat_map(|c| &c.cards)
        .find(|t| t.title == "Estudiar redes")
        .unwrap()
        .id
        .0
        .clone();
    assert_eq!(
        bloque_de(&planificador, &creada),
        Some(("2026-11-15".into(), 10))
    );
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_crear(serde_json::json!([{
                "title": "Otra", "due_date": "2026-11-16",
                "time_block": { "date": "2026-11-17", "start_hour": 10 }
            }]))
        ),
        (
            ErrorCode::TimeBlockAfterDueDate,
            "No puedes programar la tarjeta después de su fecha límite.".into()
        )
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
    let nube = WindiSimulado::responde(vec![Ok(propone_mover(card_id, columna))]);
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
    // HE-14-HU06-CA04 · Columna inexistente: ninguna propuesta (ET08) y Windi lista las columnas en su orden
    // (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(&planificador, &windi, propone_mover(&id, "Archivo")),
        (
            ErrorCode::WindiColumnNotFound,
            "No encuentro la columna “Archivo”. Tus columnas son: Por hacer, En progreso, Hecho."
                .into()
        )
    );
}

#[test]
fn ca_he_14_hu06_ca05() {
    // HE-14-HU06-CA05 · Tarjeta inexistente: ninguna propuesta (ET10) y Windi pide más detalles
    // (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(
            &planificador,
            &windi,
            propone_mover("00000000-0000-4000-8000-0000000000ee", HECHO)
        ),
        (
            ErrorCode::WindiCardNotFound,
            "No encuentro una tarjeta llamada “00000000-0000-4000-8000-0000000000ee”. ¿Me das más \
             detalles?"
                .into()
        )
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
    // HE-14-HU06-CA07 · Ya está en esa columna: ninguna propuesta (ET11) y Windi lo dice (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    assert_eq!(
        rechazo(&planificador, &windi, propone_mover(&id, POR_HACER)),
        (
            ErrorCode::WindiAlreadyInColumn,
            "La tarjeta “Informe” ya está en Por hacer.".into()
        )
    );
}

#[test]
fn ca_he_14_hu06_et13() {
    // HE-14-HU06-ET13 · La columna se reconoce por su nombre, sin distinguir mayúsculas, minúsculas ni tildes.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_movimiento(&planificador, &windi, &id, "EN PRÓGRESO").unwrap();
    assert_eq!(
        propuesta.items[0].changes.as_ref().unwrap()["to_column"],
        "En progreso"
    );
    confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(columna_de(&planificador, &id), (EN_PROGRESO.into(), false));
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

// HE-14-HU07 · Eliminar tarjetas con el agente de IA.

fn propone_eliminar(ids: &[&str]) -> WindiChatResponse {
    WindiChatResponse {
        reply: "Esto es lo que voy a eliminar. ¿Confirmas?".into(),
        intent: WindiChatResponseIntent::Propose,
        proposal: Some(WindiChatProposal {
            action: crate::tipos::ProposalAction::Delete,
            items: ids
                .iter()
                .map(|id| WindiChatProposalItemsItem {
                    card_id: Some(Uuid((*id).into())),
                    changes: None,
                })
                .collect(),
        }),
    }
}

fn pedir_eliminacion(
    planificador: &Planificador,
    windi: &ServicioDeWindi,
    ids: &[&str],
) -> Option<WindiProposal> {
    let nube = WindiSimulado::responde(vec![Ok(propone_eliminar(ids))]);
    enviar_con(
        windi,
        &nube,
        &manejador_de(planificador),
        "Elimina la tarjeta",
        true,
    )
    .unwrap()
    .proposal
}

fn existe(planificador: &Planificador, id: &str) -> bool {
    bloquear(planificador.tarjeta(USUARIO, id))
        .unwrap()
        .is_some()
}

#[test]
fn ca_he_14_hu07_ca01() {
    // HE-14-HU07-CA01 · La propuesta trae la tarjeta y el aviso (ET01); al confirmar se elimina con las reglas de
    // HE-07-HU05 (ET05) y Windi menciona el título.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_eliminacion(&planificador, &windi, &[&id]).unwrap();
    assert_eq!(propuesta.items[0].title, "Informe");
    assert_eq!(
        propuesta.warnings,
        vec!["Esta acción no se puede deshacer.".to_string()]
    );
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.reply.text, "Listo, eliminé la tarjeta «Informe».");
    assert!(!existe(&planificador, &id));
}

#[test]
fn ca_he_14_hu07_ca02() {
    // HE-14-HU07-CA02 · Varias tarjetas en una sola propuesta (ET02).
    let planificador = con_semilla();
    let a = tarjeta_en(
        &planificador,
        POR_HACER,
        "Comprar pan",
        "2026-11-20",
        1024.0,
    );
    let b = tarjeta_en(
        &planificador,
        POR_HACER,
        "Cita médica",
        "2026-11-21",
        2048.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_eliminacion(&planificador, &windi, &[&a, &b]).unwrap();
    assert_eq!(propuesta.items.len(), 2);
    assert_eq!(propuesta.warnings[0], "Esta acción no se puede deshacer.");
    let r = confirmar(&windi, &manejador_de(&planificador), &propuesta, true).unwrap();
    assert_eq!(r.reply.text, "Listo, eliminé 2 tarjetas.");
    assert!(!existe(&planificador, &a) && !existe(&planificador, &b));
}

#[test]
fn ca_he_14_hu07_ca03() {
    // HE-14-HU07-CA03 · «Rechazar» no elimina ninguna tarjeta.
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_eliminacion(&planificador, &windi, &[&id]).unwrap();
    let r = windi.rechazar(&propuesta.id, AHORA).unwrap();
    assert!(
        r.reply
            .text
            .starts_with("Entendido, no hice ningún cambio.")
    );
    assert!(existe(&planificador, &id));
}

#[test]
fn ca_he_14_hu07_ca04() {
    // HE-14-HU07-CA04 · Tarjeta inexistente: ninguna propuesta (ET06) y Windi pide más detalles
    // (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let (code, texto) = rechazo(&planificador, &windi, propone_eliminar(&["Pagar el gas"]));
    assert_eq!(
        (code, texto.as_str()),
        (
            ErrorCode::WindiCardNotFound,
            "No encuentro una tarjeta llamada “Pagar el gas”. ¿Me das más detalles?"
        )
    );
}

#[test]
fn ca_he_14_hu07_ca07() {
    // HE-14-HU07-CA07 · Eliminar 3 tarjetas por su nombre y una no existe: Windi dice cuál y no muestra la
    // propuesta; las tarjetas se buscan por su título sin mayúsculas ni tildes (HE-14-HU03-ET10).
    let planificador = con_semilla();
    let a = tarjeta_en(
        &planificador,
        POR_HACER,
        "Comprar pan",
        "2026-11-20",
        1024.0,
    );
    let b = tarjeta_en(
        &planificador,
        POR_HACER,
        "Cita médica",
        "2026-11-21",
        2048.0,
    );
    let windi = ServicioDeWindi::nuevo();
    let (code, texto) = rechazo(
        &planificador,
        &windi,
        propone_eliminar(&["comprar pan", "Viaje", "CITA MEDICA"]),
    );
    assert_eq!(
        (code, texto.as_str()),
        (
            ErrorCode::WindiCardNotFound,
            "No encuentro una tarjeta llamada “Viaje”. ¿Me das más detalles?"
        )
    );
    assert!(existe(&planificador, &a) && existe(&planificador, &b));
    // Por su nombre, sin la que no existe, sí hay propuesta.
    let propuesta =
        pedir_eliminacion(&planificador, &windi, &["comprar pan", "CITA MEDICA"]).unwrap();
    assert_eq!(propuesta.items.len(), 2);
}

#[test]
fn ca_he_14_hu07_ca05() {
    // HE-14-HU07-CA05 · Varias coinciden: Windi recibe el título y la fecha límite de cada una (ET03).
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
    let c = bloquear(contexto(
        &planificador,
        USUARIO,
        "Prueba",
        planificador.hoy(),
        12,
        "Elimina la de pagar",
    ))
    .unwrap();
    let mut vistas: Vec<_> = c
        .cards
        .iter()
        .map(|t| (t.title.clone(), t.due_date.0.clone()))
        .collect();
    vistas.sort();
    assert_eq!(
        vistas,
        vec![
            ("Pagar el agua".into(), "2026-11-25".into()),
            ("Pagar la luz".into(), "2026-11-20".into())
        ]
    );
}

#[test]
fn ca_he_14_hu07_ca06() {
    // HE-14-HU07-CA06 · Tarjeta completada: el aviso y el texto de ET04.
    let planificador = con_semilla();
    let id = completada(&planificador);
    let windi = ServicioDeWindi::nuevo();
    let propuesta = pedir_eliminacion(&planificador, &windi, &[&id]).unwrap();
    assert_eq!(
        propuesta.warnings,
        vec![
            "Esta acción no se puede deshacer.".to_string(),
            "Esta tarjeta está completada. Si la eliminas, dejará de contar en tus reportes."
                .to_string()
        ]
    );
}

// HE-14-HU09 · Preguntar al agente de IA por las tarjetas. Las cuentas las hace Gemini con el contexto; el Núcleo
// le manda las tarjetas con sus datos y nunca cambia nada al responder una consulta.

#[test]
fn ca_he_14_hu09_ca01() {
    // HE-14-HU09-CA01 · El contexto lleva todas las tarjetas, las relacionadas con el mensaje primero, con su
    // estado, fecha, columna, etiquetas y prioridad (ET01, ET02).
    let planificador = con_semilla();
    tarjeta_en(
        &planificador,
        POR_HACER,
        "Pagar la luz",
        "2026-11-10",
        1024.0,
    );
    tarjeta_en(&planificador, EN_PROGRESO, "Informe", "2026-11-20", 1024.0);
    let c = bloquear(contexto(
        &planificador,
        USUARIO,
        "Prueba",
        planificador.hoy(),
        12,
        "¿Qué informe tengo?",
    ))
    .unwrap();
    let titulos: Vec<_> = c.cards.iter().map(|t| t.title.as_str()).collect();
    assert_eq!(titulos, ["Informe", "Pagar la luz"]);
}

#[test]
fn ca_he_14_hu09_ca02() {
    // HE-14-HU09-CA02 · La fecha de completado va en el contexto, para contar como la sección Tarjetas completadas
    // de Reportes (ET03).
    let planificador = con_semilla();
    let id = tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    bloquear(planificador.marcar_completada(
        USUARIO,
        crate::tipos::CardSetCompletedParams {
            card_id: Uuid(id),
            completed: true,
        },
    ))
    .unwrap();
    let c = bloquear(contexto(
        &planificador,
        USUARIO,
        "Prueba",
        planificador.hoy(),
        12,
        "¿Cuántas completé?",
    ))
    .unwrap();
    assert_eq!(
        c.cards[0].completed_on.as_ref().map(|f| f.0.as_str()),
        Some("2026-11-14")
    );
}

#[test]
fn ca_he_14_hu09_ca03() {
    // HE-14-HU09-CA03 · Sin tarjetas que coincidan, Windi responde texto (lo escribe Gemini) y no hay propuesta.
    let planificador = con_semilla();
    let windi = ServicioDeWindi::nuevo();
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "¡No tienes tarjetas vencidas! 🎉",
        WindiChatResponseIntent::Answer,
    ))]);
    let r = enviar_con(
        &windi,
        &nube,
        &manejador_de(&planificador),
        "¿Tengo vencidas?",
        true,
    )
    .unwrap();
    assert!(r.proposal.is_none());
    assert_eq!(r.reply.text, "¡No tienes tarjetas vencidas! 🎉");
}

#[test]
fn ca_he_14_hu09_ca04() {
    // HE-14-HU09-CA04 · Una consulta no crea, edita, mueve ni elimina tarjetas (ET04).
    let planificador = con_semilla();
    tarjeta_en(&planificador, POR_HACER, "Informe", "2026-11-20", 1024.0);
    let antes = bloquear(planificador.tablero(USUARIO)).unwrap();
    let windi = ServicioDeWindi::nuevo();
    let nube = WindiSimulado::responde(vec![Ok(respuesta(
        "Tienes 1 tarjeta pendiente.",
        WindiChatResponseIntent::Answer,
    ))]);
    enviar_con(
        &windi,
        &nube,
        &manejador_de(&planificador),
        "¿Cuántas pendientes tengo?",
        true,
    )
    .unwrap();
    assert_eq!(bloquear(planificador.tablero(USUARIO)).unwrap(), antes);
}
