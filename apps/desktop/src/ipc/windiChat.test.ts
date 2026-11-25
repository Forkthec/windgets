// EF-01 `windi-chat` (supabase/functions/windi-chat/logica.ts). La Edge Function corre en Deno; su lógica es TS
// puro y se prueba aquí con Gemini simulado (plan, P19).
import { describe, expect, it, vi } from 'vitest';
import {
  cuerpoParaGemini,
  ESPERA_MS,
  ESTADO_DEL_ERROR,
  errorDeGemini,
  instruccionDelSistema,
  leerGemini,
  leerPeticion,
  FUNCIONES,
  RESPALDO,
  UN_CAMBIO_A_LA_VEZ,
  MUY_LARGO,
  GUIA,
  diaYFecha,
  BLOQUEO_DE_SEGURIDAD,
  resumenDeGemini,
  responderConGemini,
  ESPERA_DEL_REINTENTO_MS,
  esFallaPasajera,
  type Contexto,
  type Registro,
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
    // HE-14-HU07-ET07 (P24): sin el tope de 600 tokens de salida.
    expect(cuerpo.generationConfig).toEqual({ temperature: 0.4, maxOutputTokens: 2048 });
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
    // Sin texto ni propuesta (candidato vacío) es provider_error; el bloqueo de seguridad tiene su respuesta (P27).
    expect(leerGemini({ candidates: [{ content: { parts: [] } }] })).toBe('provider_error');
    expect(leerGemini({})).toBe('provider_error');
  });

  it('P27 (C5) · MALFORMED_FUNCTION_CALL y el candidato vacío son provider_error', () => {
    expect(leerGemini({ candidates: [{ finishReason: 'MALFORMED_FUNCTION_CALL' }] })).toBe('provider_error');
    expect(leerGemini({ candidates: [{ finishReason: 'STOP', content: { parts: [] } }] })).toBe(
      'provider_error',
    );
    expect(leerGemini({ candidates: [] })).toBe('provider_error');
  });

  it('P27 (C5) · el bloqueo de seguridad pide decirlo de otra forma, en el candidato o en promptFeedback', () => {
    const esperada = { reply: BLOQUEO_DE_SEGURIDAD, intent: 'clarify', proposal: null };
    expect(BLOQUEO_DE_SEGURIDAD).toBe('No puedo responder a ese mensaje. ¿Me lo dices de otra forma?');
    expect(leerGemini({ candidates: [{ finishReason: 'SAFETY' }] })).toEqual(esperada);
    expect(leerGemini({ promptFeedback: { blockReason: 'SAFETY' } })).toEqual(esperada);
    // Los otros motivos de bloqueo siguen en provider_error (docs/DUDAS.md, P27).
    expect(leerGemini({ promptFeedback: { blockReason: 'PROHIBITED_CONTENT' } })).toBe('provider_error');
  });

  it('P27 (C5) · el resumen para el log no lleva el texto ni los argumentos (D-196)', () => {
    const gemini = {
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [
              { text: 'Texto privado de la persona' },
              { functionCall: { name: 'propose_create_cards', args: { cards: [{ title: 'Secreto' }] } } },
            ],
          },
        },
      ],
    };
    const resumen = resumenDeGemini(gemini);
    expect(resumen).toEqual({
      finishReason: 'STOP',
      blockReason: null,
      partes: 2,
      llamadas: ['propose_create_cards'],
    });
    expect(JSON.stringify(resumen)).not.toMatch(/privado|Secreto/);
    expect(resumenDeGemini(null)).toEqual({ finishReason: null, blockReason: null, partes: 0, llamadas: [] });
  });

  describe('P27 (C5) · responderConGemini', () => {
    const vacia = { candidates: [{ finishReason: 'STOP', content: { parts: [] } }] };
    const buena = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Hola' }] } }] };
    const respuesta = (cuerpo: unknown, estado = 200) =>
      new Response(JSON.stringify(cuerpo), {
        status: estado,
        headers: { 'Content-Type': 'application/json' },
      });
    const simulado = (...respuestas: Response[]) => {
      const llamar = vi.fn<() => Promise<Response>>();
      for (const r of respuestas) llamar.mockResolvedValueOnce(r);
      return llamar;
    };

    it('reintenta una vez la respuesta vacía y gana la segunda', async () => {
      const llamar = simulado(respuesta(vacia), respuesta(buena));
      const registrar = vi.fn<Registro>();
      expect(await responderConGemini(llamar, registrar)).toEqual({
        reply: 'Hola',
        intent: 'answer',
        proposal: null,
      });
      expect(llamar).toHaveBeenCalledTimes(2);
      expect(registrar.mock.calls.map(([nivel, datos]) => [nivel, datos.intento])).toEqual([
        ['error', 1],
        ['info', 2],
      ]);
    });

    it('dos respuestas vacías son provider_error, sin un tercer intento', async () => {
      const llamar = simulado(
        respuesta(vacia),
        respuesta({ candidates: [{ finishReason: 'MALFORMED_FUNCTION_CALL' }] }),
      );
      expect(await responderConGemini(llamar, vi.fn())).toBe('provider_error');
      expect(llamar).toHaveBeenCalledTimes(2);
    });

    it('429 es quota_exceeded sin reintento', async () => {
      const llamar = simulado(respuesta({}, 429));
      const registrar = vi.fn<Registro>();
      expect(await responderConGemini(llamar, registrar)).toBe('quota_exceeded');
      expect(llamar).toHaveBeenCalledTimes(1);
      expect(registrar).toHaveBeenCalledWith('error', {
        evento: 'gemini_http',
        intento: 1,
        estado: 429,
        codigo: 'quota_exceeded',
      });
    });

    // P36 (prueba del 23-nov): Gemini respondía 503 («modelo saturado») y Windi fallaba de inmediato.
    it('503 se reintenta una vez con el modelo de respaldo, tras esperar', async () => {
      const llamar = simulado(respuesta({}, 503));
      const llamarRespaldo = simulado(respuesta(buena));
      const esperar = vi.fn(() => Promise.resolve());
      const registrar = vi.fn<Registro>();
      expect(await responderConGemini(llamar, registrar, { llamarRespaldo, esperar })).toEqual({
        reply: 'Hola',
        intent: 'answer',
        proposal: null,
      });
      expect(esperar).toHaveBeenCalledWith(ESPERA_DEL_REINTENTO_MS);
      expect(llamar).toHaveBeenCalledTimes(1);
      expect(llamarRespaldo).toHaveBeenCalledTimes(1);
      expect(registrar).toHaveBeenCalledWith('error', {
        evento: 'gemini_http',
        intento: 1,
        estado: 503,
        codigo: 'provider_error',
        reintento: 'respaldo',
      });
    });

    it('sin modelo de respaldo, 500 y 504 se reintentan con el mismo; dos fallas seguidas son provider_error', async () => {
      const esperar = () => Promise.resolve();
      const unaVez = simulado(respuesta({}, 504), respuesta(buena));
      expect(await responderConGemini(unaVez, vi.fn(), { esperar })).toMatchObject({ reply: 'Hola' });
      expect(unaVez).toHaveBeenCalledTimes(2);
      const dosVeces = simulado(respuesta({}, 500), respuesta({}, 503));
      expect(await responderConGemini(dosVeces, vi.fn(), { esperar })).toBe('provider_error');
      expect(dosVeces).toHaveBeenCalledTimes(2);
    });

    it('400 no se reintenta', async () => {
      const llamar = simulado(respuesta({}, 400));
      expect(await responderConGemini(llamar, vi.fn())).toBe('provider_error');
      expect(llamar).toHaveBeenCalledTimes(1);
      expect([500, 503, 504].every(esFallaPasajera)).toBe(true);
      expect([400, 404, 429].some(esFallaPasajera)).toBe(false);
    });

    it('el bloqueo de seguridad no se reintenta', async () => {
      const llamar = simulado(respuesta({ candidates: [{ finishReason: 'SAFETY' }] }));
      const leida = await responderConGemini(llamar, vi.fn());
      expect(leida).toEqual({ reply: BLOQUEO_DE_SEGURIDAD, intent: 'clarify', proposal: null });
      expect(llamar).toHaveBeenCalledTimes(1);
    });
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

describe('EF-01 windi-chat · P27 (instrucción del sistema)', () => {
  const texto = instruccionDelSistema(CONTEXTO);

  it('RD-96 · Windi sabe que una tarjeta tiene máximo 3 etiquetas', () => {
    expect(texto).toContain('Una tarjeta tiene máximo 3 etiquetas.');
  });

  it('P27 (C6) · HE-14-HU05-CA11 · «de HH:00 a (HH+1):00» va directo a la propuesta', () => {
    expect(texto).toContain(
      'Un bloque «de HH:00 a (HH+1):00», como «de 15:00 a 16:00», es un bloque válido de una hora',
    );
    expect(texto).toContain('directamente con start_hour HH, sin preguntar');
  });

  it('P27 (C8) · HE-14-HU04 · los datos que no se pidieron no se envían', () => {
    expect(texto).toContain('Al crear o al cambiar tarjetas solo envías los datos que la persona indicó');
    expect(texto).toContain(
      'descripción, etiquetas o bloque horario, no los envías y quedan vacíos o como estaban',
    );
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
    // P23: con `AUTO` Gemini a veces anunciaba la propuesta sin llamar a la función; con `ANY` siempre llama.
    expect(cuerpo.tools[0]?.functionDeclarations.map((f) => f.name)).toContain('responder');
    expect(cuerpo.toolConfig).toEqual({ functionCallingConfig: { mode: 'ANY' } });
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

  it('HE-14-HU04-CA01 · el texto llega en responder junto a la propuesta, o solo en responder', () => {
    const propuesta = {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: 'propose_create_cards',
                  args: { cards: [{ title: 'Estudiar cálculo', due_date: '2026-11-27' }] },
                },
              },
              { functionCall: { name: 'responder', args: { text: 'Te propongo crear esta tarea.' } } },
            ],
          },
        },
      ],
    };
    expect(leerGemini(propuesta)).toEqual({
      reply: 'Te propongo crear esta tarea.',
      intent: 'propose',
      proposal: {
        action: 'create',
        items: [{ card_id: null, changes: { title: 'Estudiar cálculo', due_date: '2026-11-27' } }],
      },
    });
    const respuesta = {
      candidates: [
        {
          content: {
            parts: [{ functionCall: { name: 'responder', args: { text: '¿Para qué día es la tarea?' } } }],
          },
        },
      ],
    };
    expect(leerGemini(respuesta)).toEqual({
      reply: '¿Para qué día es la tarea?',
      intent: 'answer',
      proposal: null,
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
    // HE-14-HU10 (P29): ya no dice «nunca creas etiquetas»; ofrece crearla antes, pidiendo su color.
    expect(texto).toContain('Al crear o editar tarjetas solo usas etiquetas que existen.');
    expect(texto).toContain('crear antes la etiqueta');
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

  // P24 (INT-03): `propose_edit_card` pasa a ser `propose_edit_cards { edits }` (HE-14-HU05-CA08, ET10).
  it('HE-14-HU05-CA01 · declara propose_edit_cards y convierte la llamada en una propuesta de edición', () => {
    const gemini = {
      candidates: [
        {
          content: {
            parts: [
              { text: 'Esto es lo que voy a cambiar. ¿Confirmas?' },
              {
                functionCall: {
                  name: 'propose_edit_cards',
                  args: { edits: [{ card_id: 't1', changes: { title: 'Pagar la luz ya' } }] },
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
    expect(texto).toContain('Pagar la luz (id t1, fecha límite 2026-11-20, pendiente');
    expect(texto).toContain('Pagar el agua (id t2, fecha límite 2026-11-25, completada el 2026-11-10');
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
  it('HE-14-HU06-CA01 · declara propose_move_cards y convierte la llamada en una propuesta de movimiento', () => {
    const gemini = {
      candidates: [
        {
          content: {
            parts: [
              { functionCall: { name: 'propose_move_cards', args: { card_ids: ['t1'], column_id: 'c3' } } },
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

describe('EF-01 windi-chat · HE-14-HU07 (eliminar tarjetas)', () => {
  it('HE-14-HU07-CA01 y CA02 · declara propose_delete_cards y convierte la llamada en una propuesta de eliminación', () => {
    const gemini = {
      candidates: [
        {
          content: {
            parts: [{ functionCall: { name: 'propose_delete_cards', args: { card_ids: ['t1', 't2'] } } }],
          },
        },
      ],
    };
    const r = leerGemini(gemini);
    expect(typeof r === 'object' && r.proposal).toEqual({
      action: 'delete',
      items: [
        { card_id: 't1', changes: null },
        { card_id: 't2', changes: null },
      ],
    });
    expect(instruccionDelSistema(CONTEXTO)).toContain('las incluyes todas en una sola llamada');
  });

  it('HE-14-HU07-CA04 · tarjeta inexistente: pide más detalles', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'Si no encuentras una tarjeta con el nombre que menciona',
    );
  });

  it('HE-14-HU07-CA05 · varias coinciden: pregunta a cuál antes de proponer la eliminación', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'preguntas a cuál se refiere antes de proponer la eliminación',
    );
  });
});

describe('EF-01 windi-chat · HE-14-HU08 (cómo funciona la aplicación)', () => {
  it('HE-14-HU08-CA01 · pasos numerados (máximo 6) con las pantallas y opciones de la guía', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('lista numerada de máximo 6 pasos');
    // ET02: la guía usa los nombres de la aplicación.
    for (const nombre of [
      'Tablero Kanban',
      '«Nueva tarjeta»',
      '«Guardar como tema»',
      '«Agregar widget»',
      '«Cerrar sesión»',
    ]) {
      expect(texto).toContain(nombre);
    }
  });

  it('HE-14-HU08-CA02 · una función que no existe: lo dice, no inventa pasos y sugiere una parecida', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('no inventas pantallas, opciones ni');
    expect(texto).toContain('dices que no está disponible en la aplicación, no das pasos');
    expect(texto).toContain('una función parecida de la guía');
  });
});

describe('EF-01 windi-chat · HE-14-HU09 (preguntas por las tarjetas)', () => {
  const conTarjetas: Contexto = {
    ...CONTEXTO,
    labels: [{ id: 'l1', name: 'Trabajo' }],
    cards: [
      {
        id: 't1',
        title: 'Informe',
        due_date: '2026-11-10',
        completed_on: null,
        column_id: 'c1',
        priority: 'high',
        label_ids: ['l1'],
      },
      {
        id: 't2',
        title: 'Pan',
        due_date: '2026-11-20',
        completed_on: null,
        column_id: 'c1',
        priority: null,
        label_ids: [],
      },
      {
        id: 't3',
        title: 'Cita',
        due_date: '2026-11-05',
        completed_on: '2026-11-04',
        column_id: 'c1',
        priority: 'low',
        label_ids: [],
      },
    ],
  };

  it('HE-14-HU09-CA01 · cada tarjeta con su estado, fecha, columna, prioridad y etiquetas', () => {
    const texto = instruccionDelSistema(conTarjetas);
    expect(texto).toContain(
      'Informe (id t1, fecha límite 2026-11-10, vencida, columna Por hacer, prioridad alta, etiquetas Trabajo)',
    );
    expect(texto).toContain('Pan (id t2, fecha límite 2026-11-20, pendiente, columna Por hacer)');
    expect(texto).toContain('con su título y su fecha límite en DD/MM/AAAA');
  });

  it('HE-14-HU09-CA02 · las completadas en un rango se cuentan como en Reportes', () => {
    const texto = instruccionDelSistema(conTarjetas);
    expect(texto).toContain('Cita (id t3, fecha límite 2026-11-05, completada el 2026-11-04');
    expect(texto).toContain('igual que');
    expect(texto).toContain('la sección Tarjetas completadas de Reportes');
  });

  it('HE-14-HU09-CA03 · sin resultados lo dice; sin vencidas, lo celebra', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('dices que no encuentras tarjetas que coincidan');
    expect(texto).toContain('celebrando que no tiene ninguna');
  });

  it('HE-14-HU09-CA04 · una consulta no llama ninguna función ni cambia tarjetas', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'nunca crea, edita, mueve ni elimina tarjetas: no llamas ninguna función',
    );
    const r = leerGemini({ candidates: [{ content: { parts: [{ text: 'Tienes 2 tarjetas vencidas.' }] } }] });
    expect(r).toEqual({ reply: 'Tienes 2 tarjetas vencidas.', intent: 'answer', proposal: null });
  });
});

describe('EF-01 windi-chat · HE-14-HU03 (propuestas)', () => {
  /** Una respuesta de Gemini con las llamadas dadas y sin texto. */
  const conLlamadas = (...llamadas: { name: string; args: Record<string, unknown> }[]) => ({
    candidates: [{ content: { parts: llamadas.map((functionCall) => ({ functionCall })) } }],
  });

  it('HE-14-HU03-ET11 · el texto de respaldo corresponde a la acción de la propuesta', () => {
    const casos: [string, Record<string, unknown>, string][] = [
      ['propose_create_cards', { cards: [{ title: 'Pan', due_date: '2026-11-20' }] }, 'crear'],
      ['propose_edit_cards', { edits: [{ card_id: 't1', changes: { title: 'Otro' } }] }, 'cambiar'],
      ['propose_move_cards', { card_ids: ['t1'], column_id: 'En progreso' }, 'mover'],
      ['propose_delete_cards', { card_ids: ['t1'] }, 'eliminar'],
    ];
    for (const [name, args, verbo] of casos) {
      const r = leerGemini(conLlamadas({ name, args }));
      expect(typeof r === 'object' && r.reply).toBe(`Esto es lo que voy a ${verbo}. ¿Confirmas?`);
    }
    // HE-14-HU10 (P29): crear etiquetas es la quinta acción.
    expect(RESPALDO.create_label).toBe('Esta es la etiqueta que voy a crear. ¿Confirmas?');
    expect(Object.values(RESPALDO)).toHaveLength(5);
  });

  it('HE-14-HU03-CA05 · ante «sí» pide seleccionar «Confirmar» y nunca dice que hizo el cambio (ET09)', () => {
    const instruccion = instruccionDelSistema(CONTEXTO);
    expect(instruccion).toContain(
      'Si la persona escribe «sí», «confirmo» o algo parecido para aceptar una propuesta',
    );
    expect(instruccion).toContain('le pides que seleccione «Confirmar» en la propuesta');
    expect(instruccion).toContain('Nunca dices que hiciste, creaste, cambiaste, moviste o eliminaste algo');
  });

  it('HE-14-HU03-ET10 · nunca anuncia un cambio sin la propuesta; dos tipos de cambio se piden en dos pasos', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'Nunca anuncias un cambio con texto sin llamar en la misma respuesta a la función de la propuesta.',
    );
    expect(
      leerGemini(
        conLlamadas(
          { name: 'responder', args: { text: 'Listo, ya lo moví y lo eliminé.' } },
          { name: 'propose_move_cards', args: { card_ids: ['t1'], column_id: 'c2' } },
          { name: 'propose_delete_cards', args: { card_ids: ['t2'] } },
        ),
      ),
    ).toEqual({ reply: UN_CAMBIO_A_LA_VEZ, intent: 'clarify', proposal: null });
    expect(UN_CAMBIO_A_LA_VEZ).toBe('Puedo preparar un tipo de cambio a la vez. ¿Cuál hacemos primero?');
  });

  it('HE-14-HU06-ET13 · la columna de destino puede ser su nombre', () => {
    const mover = FUNCIONES.find((f) => f.name === 'propose_move_cards');
    expect(JSON.stringify(mover)).toContain('El id o el nombre de una columna del tablero.');
  });

  it('HE-14-HU06-CA09 · mover varias tarjetas da una sola propuesta con todas (ET12)', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain('Para mover una o varias tarjetas a otra columna');
    const r = leerGemini(
      conLlamadas({
        name: 'propose_move_cards',
        args: { card_ids: ['t1', 't2', 't3'], column_id: 'En progreso' },
      }),
    );
    expect(typeof r === 'object' && r.proposal).toEqual({
      action: 'move',
      items: ['t1', 't2', 't3'].map((card_id) => ({ card_id, changes: { column_id: 'En progreso' } })),
    });
  });
});

/** Los datos que acepta `changes` en `propose_edit_cards`. */
function datosDeEdicion() {
  const editar = FUNCIONES.find((f) => f.name === 'propose_edit_cards') as unknown as {
    parameters: {
      properties: {
        edits: { items: { properties: { changes: { properties: Record<string, { nullable?: boolean }> } } } };
      };
    };
  };
  return editar.parameters.properties.edits.items.properties.changes.properties;
}

/** Una respuesta de Gemini con las llamadas dadas y sin texto. */
function llamadas(...lista: { name: string; args: Record<string, unknown> }[]) {
  return { candidates: [{ content: { parts: lista.map((functionCall) => ({ functionCall })) } }] };
}

describe('EF-01 windi-chat · HE-14-HU05 (P24: varias tarjetas, etiquetas y bloque horario)', () => {
  it('HE-14-HU05-ET12 · la prioridad, la descripción y el bloque horario se pueden quitar con null', () => {
    const datos = datosDeEdicion();
    expect(datos.priority?.nullable).toBe(true);
    expect(datos.description?.nullable).toBe(true);
    expect(datos.time_block?.nullable).toBe(true);
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'Para quitar la prioridad, la descripción o el bloque horario, envías null en ese dato.',
    );
  });

  it('HE-14-HU05-CA08 · editar varias tarjetas en una propuesta: las llamadas se juntan', () => {
    const r = leerGemini(
      llamadas(
        {
          name: 'propose_edit_cards',
          args: { edits: [{ card_id: 't1', changes: { due_date: '2026-11-20' } }] },
        },
        {
          name: 'propose_edit_cards',
          args: { edits: [{ card_id: 't2', changes: { due_date: '2026-11-20' } }] },
        },
      ),
    );
    expect(r).toEqual({
      reply: 'Esto es lo que voy a cambiar. ¿Confirmas?',
      intent: 'propose',
      proposal: {
        action: 'edit',
        items: [
          { card_id: 't1', changes: { due_date: '2026-11-20' } },
          { card_id: 't2', changes: { due_date: '2026-11-20' } },
        ],
      },
    });
    expect(instruccionDelSistema(CONTEXTO)).toContain('Si piden el mismo cambio para varias tarjetas');
  });

  it('HE-14-HU05-CA09 · agregar una etiqueta por su nombre con propose_label_cards', () => {
    const r = leerGemini(
      llamadas({ name: 'propose_label_cards', args: { edits: [{ card_id: 't1', add: ['Urgente'] }] } }),
    );
    expect(r).toEqual({
      reply: 'Esto es lo que voy a cambiar. ¿Confirmas?',
      intent: 'propose',
      proposal: {
        action: 'edit',
        items: [{ card_id: 't1', changes: { add_labels: ['Urgente'], remove_labels: [] } }],
      },
    });
    // Etiquetar y editar son la misma acción: van en una sola propuesta.
    const juntas = leerGemini(
      llamadas(
        { name: 'propose_label_cards', args: { edits: [{ card_id: 't1', remove: ['Casa'] }] } },
        { name: 'propose_edit_cards', args: { edits: [{ card_id: 't1', changes: { priority: 'high' } }] } },
      ),
    );
    expect(typeof juntas === 'object' && juntas.proposal?.items).toHaveLength(2);
  });

  it('HE-14-HU05-CA10 · editar no crea etiquetas: las etiquetas van por su nombre y el Núcleo las busca', () => {
    expect(JSON.stringify(FUNCIONES.find((f) => f.name === 'propose_label_cards'))).toContain(
      'Nombres de etiquetas que se agregan.',
    );
    // HE-14-HU10 (P29): crear una etiqueta es otra propuesta (propose_create_labels), no parte de la edición.
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'Al crear o editar tarjetas solo usas etiquetas que existen.',
    );
  });

  it('HE-14-HU05-CA11, CA12 y HE-14-HU04-CA10 · el bloque horario va con su fecha y su hora de inicio', () => {
    expect(datosDeEdicion().time_block).toBeTruthy();
    const crear = FUNCIONES.find((f) => f.name === 'propose_create_cards');
    expect(JSON.stringify(crear)).toContain('"time_block"');
    expect(instruccionDelSistema(CONTEXTO)).toContain('«10:00 – 11:00» es start_hour 10');
    const r = leerGemini(
      llamadas({
        name: 'propose_edit_cards',
        args: { edits: [{ card_id: 't1', changes: { time_block: { date: '2026-11-15', start_hour: 10 } } }] },
      }),
    );
    expect(typeof r === 'object' && r.proposal?.items[0]?.changes).toEqual({
      time_block: { date: '2026-11-15', start_hour: 10 },
    });
  });
});

describe('EF-01 windi-chat · HE-14-HU09 (P24: contexto completo)', () => {
  const sabado: Contexto = { ...CONTEXTO, today: '2026-11-21' };

  it('HE-14-HU04-CA12 · conoce el día de la semana de hoy y de los próximos 7 días (ET14)', () => {
    const texto = instruccionDelSistema(sabado);
    expect(texto).toContain('Hoy es sábado 21/11/2026 (2026-11-21)');
    expect(texto).toContain('en hora de Colombia (UTC-5)');
    expect(texto).toContain('viernes 27/11/2026');
    expect(texto).toContain('sábado 28/11/2026');
    expect(diaYFecha('2026-12-31', 1)).toBe('viernes 01/01/2027');
  });

  it('HE-14-HU04-ET13 · las tarjetas nuevas se crean en Por hacer', () => {
    expect(instruccionDelSistema(CONTEXTO)).toContain(
      'explicas que las tarjetas nuevas se crean en Por hacer y propones crearla en Por hacer',
    );
  });

  it('HE-14-HU08-CA03 · cómo asignar una tarjeta a un bloque horario, con los nombres de la aplicación', () => {
    expect(GUIA).toContain('Menú principal > Planificador > Agenda diaria');
    expect(GUIA).toContain('se arrastra (drag-and-drop)');
    expect(GUIA).toContain('desde el panel Tarjetas sin horario');
    expect(instruccionDelSistema(CONTEXTO)).toContain(`Guía de la aplicación: ${GUIA}`);
  });

  it('HE-14-HU08-ET04 · conoce todas las pantallas y opciones', () => {
    for (const nombre of [
      'Agenda diaria',
      'Widgets',
      '«Editar escritorio» abre la pantalla de edición',
      'Personalización del wallpaper',
      'Temas',
      'Reportes',
      'Menú principal > Configuración',
      '«¿Olvidaste tu contraseña?»',
    ]) {
      expect(GUIA).toContain(nombre);
    }
  });

  it('HE-14-HU09-CA05 · usa las cantidades del Núcleo sin contarlas (ET06)', () => {
    const texto = instruccionDelSistema({
      ...CONTEXTO,
      labels: [{ id: 'l1', name: 'Estudio' }],
      totals: { total: 250, overdue: 12, pending: 230, completed: 8 },
      counts: {
        by_column: [{ key: 'C1', count: 250 }],
        by_label: [{ key: 'l1', count: 3 }],
        by_priority: [
          { key: 'high', count: 5 },
          { key: 'none', count: 245 },
        ],
        completed_by_date: [{ key: '2026-11-13', count: 8 }],
      },
    });
    expect(texto).toContain('nunca las cuentas tú');
    expect(texto).toContain(
      'Cantidades calculadas con todas sus tarjetas: total 250, vencidas 12, pendientes 230, completadas 8; ' +
        'por columna: Por hacer 250; por etiqueta: Estudio 3; por prioridad: alta 5, sin prioridad 245; ' +
        'completadas por fecha de completado: 13/11/2026 8.',
    );
  });

  it('HE-14-HU09-CA06 · conoce el tipo, el bloque horario y la descripción de cada tarjeta (ET07)', () => {
    const texto = instruccionDelSistema({
      ...sabado,
      cards: [
        {
          id: 't9',
          type: 'event',
          title: 'Reunión de equipo',
          due_date: '2026-11-21',
          completed_on: null,
          column_id: 'c1',
          priority: null,
          label_ids: [],
          scheduled_date: '2026-11-21',
          scheduled_hour: 15,
          description: `Con el equipo de diseño ${'x'.repeat(200)}`,
        },
      ],
    });
    expect(texto).toContain(
      'Reunión de equipo (id t9, fecha límite 2026-11-21, pendiente, columna Por hacer, tipo evento, ' +
        'bloque horario 2026-11-21 15:00 – 16:00, descripción «Con el equipo de diseño',
    );
    expect(texto).toContain('…»)');
  });

  it('HE-14-HU03 · la propuesta pendiente de confirmar va en la instrucción', () => {
    const propuesta = { action: 'move', items: [{ card_id: 't1', changes: { column_id: 'c2' } }] };
    expect(instruccionDelSistema({ ...CONTEXTO, active_proposal: propuesta })).toContain(
      `Propuesta pendiente de confirmar: ${JSON.stringify(propuesta)}.`,
    );
    expect(instruccionDelSistema(CONTEXTO)).toContain('Propuesta pendiente de confirmar: ninguna.');
  });

  it('HE-14-HU07-ET07 · sin tokens de salida da un texto útil, no el error genérico', () => {
    expect(
      leerGemini({
        candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Tienes 3' }] } }],
      }),
    ).toEqual({ reply: MUY_LARGO, intent: 'clarify', proposal: null });
    expect(MUY_LARGO).toBe('Tu pedido es muy largo para responderlo de una vez. ¿Lo hacemos por partes?');
  });

  it('HE-14-HU01 · con responder y partes de texto a la vez, la respuesta es un solo texto', () => {
    const r = leerGemini({
      candidates: [
        {
          content: {
            parts: [
              { text: 'Tienes 2 tarjetas vencidas.' },
              { functionCall: { name: 'responder', args: { text: 'Tienes 2 tarjetas vencidas.' } } },
            ],
          },
        },
      ],
    });
    expect(r).toEqual({ reply: 'Tienes 2 tarjetas vencidas.', intent: 'answer', proposal: null });
  });
});

describe('EF-01 windi-chat · HE-14-HU01 (P24: intención de cada respuesta)', () => {
  const responder = (args: Record<string, unknown>) => ({
    candidates: [{ content: { parts: [{ functionCall: { name: 'responder', args } }] } }],
  });

  it('HE-14-HU01-ET25 · responder declara la intención y leerGemini la conserva', () => {
    const declarada = JSON.stringify(FUNCIONES.find((f) => f.name === 'responder'));
    expect(declarada).toContain('"enum":["answer","clarify","out_of_scope"]');
    for (const intent of ['answer', 'clarify', 'out_of_scope'] as const) {
      expect(leerGemini(responder({ text: 'Hola', intent }))).toEqual({
        reply: 'Hola',
        intent,
        proposal: null,
      });
    }
    // Sin una intención válida, es answer.
    expect(leerGemini(responder({ text: 'Hola', intent: 'otra' }))).toEqual({
      reply: 'Hola',
      intent: 'answer',
      proposal: null,
    });
  });

  it('HE-14-HU01-CA06 y CA09 · la instrucción pide out_of_scope fuera del alcance y clarify al aclarar', () => {
    const texto = instruccionDelSistema(CONTEXTO);
    expect(texto).toContain('llamas a responder con intent out_of_scope');
    expect(texto).toContain('clarify cuando preguntas por un dato que falta');
    expect(texto).toContain('Aclarar no descarta la propuesta pendiente.');
  });
});

describe('EF-01 windi-chat · HE-14-HU10 (crear etiquetas, P29)', () => {
  const conColores: Contexto = {
    ...CONTEXTO,
    labels: [{ id: 'l1', name: 'Trabajo' }],
    colors: [
      { id: 'rojo', name: 'Rojo' },
      { id: 'azul', name: 'Azul' },
    ],
  };

  it('HE-14-HU10-CA01 · propone crear la etiqueta con su nombre y su color', () => {
    const r = leerGemini(
      llamadas(
        { name: 'propose_create_labels', args: { labels: [{ name: 'Universidad', color: 'Azul' }] } },
        { name: 'responder', args: { text: 'Te propongo crear la etiqueta Universidad.' } },
      ),
    );
    expect(r).toEqual({
      reply: 'Te propongo crear la etiqueta Universidad.',
      intent: 'propose',
      proposal: {
        action: 'create_label',
        items: [{ card_id: null, changes: { name: 'Universidad', color: 'Azul' } }],
      },
    });
    // Sin texto, el de su acción (HE-14-HU03-ET11).
    const sola = leerGemini(
      llamadas({ name: 'propose_create_labels', args: { labels: [{ name: 'Casa', color: 'rojo' }] } }),
    );
    expect(typeof sola === 'object' && sola.reply).toBe(RESPALDO.create_label);
    const declarada = FUNCIONES.find((f) => f.name === 'propose_create_labels') as unknown as {
      parameters: { properties: { labels: { items: { required: string[] } } } };
    };
    expect(declarada.parameters.properties.labels.items.required).toEqual(['name', 'color']);
  });

  it('HE-14-HU10-CA02 · sin color, pregunta de qué color y menciona los colores; nunca lo elige', () => {
    const texto = instruccionDelSistema(conColores);
    expect(texto).toContain('nunca eliges el color por la persona');
    expect(texto).toContain('preguntas de qué color quiere la etiqueta y mencionas los colores disponibles');
    expect(texto).toContain('Colores para etiquetas: Rojo (id rojo), Azul (id azul).');
    // Un Núcleo anterior no envía colores.
    expect(instruccionDelSistema(CONTEXTO)).toContain('Colores para etiquetas: ninguno.');
  });

  it('HE-14-HU10-CA03 · sin nombre, pregunta qué nombre ponerle; no propone hasta tener los dos', () => {
    expect(instruccionDelSistema(conColores)).toContain(
      'si falta el nombre, preguntas qué nombre ponerle. No propones',
    );
  });

  it('HE-14-HU10-CA04, CA05, CA06 · nombre de 30 caracteres, sin repetir y máximo 20 etiquetas', () => {
    const texto = instruccionDelSistema(conColores);
    expect(texto).toContain('máximo 30 caracteres');
    expect(texto).toContain('si lo repite, dices que ya existe y no propones');
    expect(texto).toContain('máximo 20 etiquetas');
  });

  it('HE-14-HU10-CA07 · una etiqueta que no existe al crear una tarjeta: ofrece crearla antes', () => {
    const texto = instruccionDelSistema(conColores);
    expect(texto).toContain('crear la tarjeta sin etiqueta o crear antes la etiqueta');
    expect(texto).toContain('Cuando la persona confirma la etiqueta nueva, propones la tarjeta con ella.');
    // Crear la etiqueta y la tarjeta en la misma respuesta son dos tipos de cambio (HE-14-HU03).
    const juntas = leerGemini(
      llamadas(
        { name: 'propose_create_labels', args: { labels: [{ name: 'Viaje', color: 'rojo' }] } },
        { name: 'propose_create_cards', args: { cards: [{ title: 'Maleta', due_date: '2026-11-20' }] } },
      ),
    );
    expect(typeof juntas === 'object' && juntas.reply).toBe(UN_CAMBIO_A_LA_VEZ);
  });
});
