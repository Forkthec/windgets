//! Pruebas del Núcleo de Windi (HE-14). La Edge Function `windi-chat` se simula (plan, P19: «Gemini simulado en
//! las pruebas automáticas»): el doble guarda cada petición y responde lo que la prueba indique.

use std::sync::Mutex;

use super::*;
use crate::servicio_del_planificador::pruebas::{
    CalendarioDePrueba, POR_HACER, USUARIO, bloquear, con_semilla, tarjeta_en,
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
    bloquear(windi.enviar(nube, "jwt", texto, contexto_vacio(), en_linea, AHORA))
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
        &servicio, USUARIO, " Prueba ", hoy, 14,
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
