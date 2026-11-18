// EF-01 `windi-chat` (supabase/functions/windi-chat/logica.ts). La Edge Function corre en Deno; su lógica es TS
// puro y se prueba aquí con Gemini simulado (plan, P19).
import { describe, expect, it } from 'vitest';
import {
  cuerpoParaGemini,
  ESPERA_MS,
  ESTADO_DEL_ERROR,
  errorDeGemini,
  instruccionDelSistema,
  leerGemini,
  leerPeticion,
  type Contexto,
} from '../../../../supabase/functions/windi-chat/logica';

const CONTEXTO: Contexto = {
  alias: 'Prueba',
  today: '2026-11-14',
  now_hour: 14,
  columns: [{ id: 'c1', name: 'Por hacer', role: 'todo' }],
  labels: [],
  cards: [],
  totals: { total: 0, overdue: 0, pending: 0, completed: 0 },
  active_proposal: null,
};

function peticion(message: string, history: unknown[] = []) {
  return { client_request_id: 'r1', message, history, context: CONTEXTO };
}

describe('EF-01 windi-chat · HE-14-HU01', () => {
  it('HE-14-HU01-CA02 · acepta mensajes de 1 a 2000 caracteres con los últimos 20 turnos', () => {
    expect(leerPeticion(peticion('a'))?.message).toBe('a');
    expect(leerPeticion(peticion('a'.repeat(2000)))).not.toBeNull();
    const largo = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      text: `t${i}`,
    }));
    const leida = leerPeticion(peticion('Hola', largo));
    expect(leida?.history).toHaveLength(20);
    expect(leida?.history[0]?.text).toBe('t5');
    // El historial va como turnos de Gemini y el mensaje al final.
    const cuerpo = cuerpoParaGemini(leerPeticion(peticion('Hola', largo.slice(-2))) ?? (null as never));
    expect(cuerpo.contents).toEqual([
      { role: 'model', parts: [{ text: 't23' }] },
      { role: 'user', parts: [{ text: 't24' }] },
      { role: 'user', parts: [{ text: 'Hola' }] },
    ]);
    expect(cuerpo.generationConfig).toEqual({ temperature: 0.4, maxOutputTokens: 600 });
  });

  it('HE-14-HU01-CA04 y CA05 · rechaza el mensaje vacío y el de más de 2000 caracteres (invalid_request, 400)', () => {
    expect(leerPeticion(peticion(''))).toBeNull();
    expect(leerPeticion(peticion('   '))).toBeNull();
    expect(leerPeticion(peticion('a'.repeat(2001)))).toBeNull();
    expect(leerPeticion({ message: 'Hola' })).toBeNull();
    expect(ESTADO_DEL_ERROR.invalid_request).toBe(400);
  });

  it('HE-14-HU01-CA06 y CA09 · la instrucción del sistema fija el alcance y la pregunta para aclarar', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('Eres Windi');
    expect(texto).toContain('Prueba');
    // ET23: solo tarjetas y aplicación; redirige con amabilidad.
    expect(texto).toContain('solo hablas de las tarjetas de esta persona y del funcionamiento de Windgets');
    // ET21: una sola pregunta concreta, sin propuesta hasta tener la respuesta.
    expect(texto).toContain('haces una sola pregunta concreta');
    // ET22: si no puede, lo dice y ofrece una alternativa.
    expect(texto).toContain('ofreces una alternativa');
  });

  it('HE-14-HU01-CA08 · corta a los 13 s y convierte las fallas de Gemini en sus códigos', () => {
    expect(ESPERA_MS).toBe(13_000);
    expect(errorDeGemini(429)).toBe('quota_exceeded');
    expect(errorDeGemini(500)).toBe('provider_error');
    expect(ESTADO_DEL_ERROR).toEqual({
      unauthorized: 401,
      invalid_request: 400,
      quota_exceeded: 429,
      provider_error: 502,
      timeout: 504,
    });
    // Sin texto (por ejemplo, un bloqueo de seguridad) es provider_error.
    expect(leerGemini({ candidates: [{ content: { parts: [] } }] })).toBe('provider_error');
    expect(leerGemini({})).toBe('provider_error');
  });

  it('HE-14-HU01-CA02 · la respuesta de Gemini es la respuesta del agente', () => {
    const gemini = {
      candidates: [{ content: { parts: [{ text: '¡Hola! ' }, { text: '¿Qué organizamos?' }] } }],
    };
    expect(leerGemini(gemini)).toEqual({
      reply: '¡Hola! ¿Qué organizamos?',
      intent: 'answer',
      proposal: null,
    });
  });
});

describe('EF-01 windi-chat · HE-14-HU02 (instrucción del sistema de INT-03)', () => {
  const texto = instruccionDelSistema(CONTEXTO);

  it('HE-14-HU02-CA01 · Tono y formato de las respuestas', () => {
    // ET01, ET02, ET04 a ET07, ET12.
    expect(texto).toContain('cercano, relajado y optimista, cálido sin exagerar');
    expect(texto).toContain('Tratas a la persona de tú');
    expect(texto).toContain('español neutro, con frases cortas y sencillas y sin tecnicismos');
    expect(texto).toContain('máximo 3 oraciones antes de una lista');
    expect(texto).toContain('lista numerada de máximo 6 pasos');
    expect(texto).toContain('como máximo un emoji por mensaje y solo en saludos o celebraciones');
    expect(leerPeticion(peticion('a'.repeat(2001)))).toBeNull();
  });

  it('HE-14-HU02-CA03 · Hablar de tarjetas vencidas sin culpar', () => {
    // ET09.
    expect(texto).toContain('Nunca regañas ni culpas por las tarjetas vencidas');
    expect(texto).toContain('cambiar la fecha límite');
  });

  it('HE-14-HU02-CA04 · Preguntar si es una persona', () => {
    // ET10.
    expect(texto).toContain('aclaras que eres el agente de IA de Windgets y sigues ofreciendo ayuda');
  });

  it('HE-14-HU02-CA05 · Mensaje ofensivo', () => {
    // ET11.
    expect(texto).toContain('mantienes la calma, no devuelves el tono ni juzgas');
  });
});
