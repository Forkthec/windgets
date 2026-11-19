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

describe('EF-01 windi-chat · HE-14-HU04 (crear tarjetas)', () => {
  const conEtiquetas: Contexto = { ...CONTEXTO, labels: [{ id: 'l1', name: 'Trabajo' }] };

  it('HE-14-HU04-CA01 · declara propose_create_cards y convierte la llamada en una propuesta de creación', () => {
    const cuerpo = cuerpoParaGemini(
      leerPeticion(peticion('Crea una tarea para entregar el informe el viernes')) ?? (null as never),
    ) as {
      tools: { functionDeclarations: { name: string }[] }[];
      toolConfig: unknown;
    };
    expect(cuerpo.tools[0]?.functionDeclarations.map((f) => f.name)).toContain('propose_create_cards');
    expect(cuerpo.toolConfig).toEqual({ functionCallingConfig: { mode: 'AUTO' } });
    const gemini = {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Esto es lo que voy a crear. ¿Confirmas?' },
              {
                functionCall: {
                  name: 'propose_create_cards',
                  args: { cards: [{ title: 'Entregar el informe', due_date: '2026-11-20' }] },
                },
              },
            ],
          },
        },
      ],
    };
    expect(leerGemini(gemini)).toEqual({
      reply: 'Esto es lo que voy a crear. ¿Confirmas?',
      intent: 'propose',
      proposal: {
        action: 'create',
        items: [{ card_id: null, changes: { title: 'Entregar el informe', due_date: '2026-11-20' } }],
      },
    });
  });

  it('HE-14-HU04-CA01 · el tipo es Tarea por defecto y la fecha se muestra DD/MM/AAAA', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('El tipo es Tarea (task) si la persona no indica otro');
    expect(texto).toContain('DD/MM/AAAA');
  });

  it('HE-14-HU04-CA03 y CA04 · pregunta por la fecha o el título antes de proponer', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('si falta la fecha, preguntas por ella mencionando el título');
    expect(texto).toContain('preguntas qué título ponerle');
  });

  it('HE-14-HU04-CA05 · la fecha límite no puede ser anterior a hoy', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('La fecha límite no puede ser anterior a hoy');
  });

  it('HE-14-HU04-CA08 · varias tarjetas en una sola propuesta', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('las propones todas en una sola llamada');
    const gemini = {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: 'propose_create_cards',
                  args: {
                    cards: [
                      { title: 'Comprar pan', due_date: '2026-11-15' },
                      { title: 'Cita médica', due_date: '2026-11-17', type: 'event' },
                    ],
                  },
                },
              },
            ],
          },
        },
      ],
    };
    const r = leerGemini(gemini);
    expect(typeof r === 'object' && r.proposal?.items).toHaveLength(2);
  });

  it('HE-14-HU04-CA09 · solo etiquetas que existen, con las disponibles en la instrucción', () => {
    const texto = instruccionDelSistema(conEtiquetas);
    expect(texto).toContain('nunca creas etiquetas');
    expect(texto).toContain('mencionas las disponibles');
    expect(texto).toContain('Etiquetas disponibles: Trabajo (id l1).');
  });
});

describe('EF-01 windi-chat · HE-14-HU05 (editar tarjetas)', () => {
  const conTarjetas: Contexto = {
    ...CONTEXTO,
    cards: [
      { id: 't1', title: 'Pagar la luz', due_date: '2026-11-20', completed_on: null },
      { id: 't2', title: 'Pagar el agua', due_date: '2026-11-25', completed_on: '2026-11-10' },
    ],
  };

  it('HE-14-HU05-CA01 · declara propose_edit_card y convierte la llamada en una propuesta de edición', () => {
    const gemini = {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Esto es lo que voy a cambiar. ¿Confirmas?' },
              {
                functionCall: {
                  name: 'propose_edit_card',
                  args: { card_id: 't1', changes: { title: 'Pagar la luz ya' } },
                },
              },
            ],
          },
        },
      ],
    };
    expect(leerGemini(gemini)).toEqual({
      reply: 'Esto es lo que voy a cambiar. ¿Confirmas?',
      intent: 'propose',
      proposal: { action: 'edit', items: [{ card_id: 't1', changes: { title: 'Pagar la luz ya' } }] },
    });
  });

  it('HE-14-HU05-CA03 · si no encuentra la tarjeta, lo dice y pide más detalles', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'Si no encuentras una tarjeta con el nombre que menciona',
    );
  });

  it('HE-14-HU05-CA04 · varias coinciden: ve el título y la fecha límite de cada una y pregunta', () => {
    const texto = instruccionDelSistema(conTarjetas);
    expect(texto).toContain('preguntas a cuál se refiere');
    expect(texto).toContain('Pagar la luz (id t1, fecha límite 2026-11-20)');
    expect(texto).toContain('Pagar el agua (id t2, fecha límite 2026-11-25, completada)');
  });

  it('HE-14-HU05-CA05 · la fecha límite no puede ser anterior a hoy', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('La fecha límite no puede ser anterior a hoy');
  });

  it('HE-14-HU05-CA06 y CA07 · avisa si está completada y no propone un valor que ya tiene', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('avisas que está completada');
    expect(texto).toContain('Si el valor pedido es el que la tarjeta ya tiene, lo dices y no propones.');
  });
});

describe('EF-01 windi-chat · HE-14-HU06 (mover tarjetas)', () => {
  it('HE-14-HU06-CA01 · declara propose_move_card y convierte la llamada en una propuesta de movimiento', () => {
    const gemini = {
      candidates: [
        {
          content: {
            parts: [
              { functionCall: { name: 'propose_move_card', args: { card_id: 't1', column_id: 'c3' } } },
            ],
          },
        },
      ],
    };
    const r = leerGemini(gemini);
    expect(typeof r === 'object' && r.proposal).toEqual({
      action: 'move',
      items: [{ card_id: 't1', changes: { column_id: 'c3' } }],
    });
  });

  it('HE-14-HU06-CA02 · decir que está completada es moverla a Hecho', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('eso es moverla a la columna con función done');
  });

  it('HE-14-HU06-CA04 · columna inexistente: menciona las columnas en su orden', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('mencionas las columnas del tablero en su orden');
    expect(texto).toContain('Columnas del tablero en su orden:');
  });

  it('HE-14-HU06-CA05 · tarjeta inexistente: pide más detalles', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'Si no encuentras una tarjeta con el nombre que menciona',
    );
  });

  it('HE-14-HU06-CA06 · avisa que está completada antes de proponer', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('avisas que está completada antes de proponer');
  });

  it('HE-14-HU06-CA07 · ya está en esa columna: lo dice y no propone', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('dices en qué columna está y no propones');
  });

  it('HE-14-HU06-CA08 · varias coinciden: título, fecha límite y columna', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('el título, la fecha límite y la columna de cada una');
  });
});
