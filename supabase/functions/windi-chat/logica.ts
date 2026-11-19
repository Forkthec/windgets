// EF-01 `windi-chat` (contratos.md): la lógica pura de la Edge Function, sin Deno, para probarla con Vitest
// (`apps/desktop/src/ipc/windiChat.test.ts`). `index.ts` la sirve. La función no hace cambios: solo propone (D-047).
// Llama a Gemini (INT-03) con la instrucción del sistema de Windi. No registra el contenido de las tarjetas ni de
// los mensajes (D-196).

/** Largo de un mensaje válido (HE-14-HU01-ET03). */
export const LARGO_MAXIMO = 2000;
/** La función corta a los 13 s; el Núcleo, a los 15 s (RNF-11; D-172). */
export const ESPERA_MS = 13_000;
/** Turnos del historial que se aceptan (EF-01). */
export const TURNOS = 20;
/** Modelo por defecto si `GEMINI_MODEL` no está definido: un Flash-Lite del nivel gratuito (D-193). */
export const MODELO_POR_DEFECTO = 'gemini-2.5-flash-lite';

export type Rol = 'user' | 'assistant';

export interface Turno {
  role: Rol;
  text: string;
}

export interface Contexto {
  alias: string;
  today: string;
  now_hour: number;
  columns: { id: string; name: string; role: string }[];
  labels: { id: string; name: string }[];
  cards: Record<string, unknown>[];
  totals: { total: number; overdue: number; pending: number; completed: number };
  active_proposal: unknown;
}

export interface PeticionWindi {
  client_request_id: string;
  message: string;
  history: Turno[];
  context: Contexto;
}

export type Intencion = 'answer' | 'clarify' | 'propose' | 'out_of_scope';

export interface Propuesta {
  action: 'create' | 'edit' | 'move' | 'delete';
  items: { card_id: string | null; changes: Record<string, unknown> | null }[];
}

export interface RespuestaWindi {
  reply: string;
  intent: Intencion;
  proposal: Propuesta | null;
}

export type CodigoDeError = 'unauthorized' | 'invalid_request' | 'quota_exceeded' | 'provider_error' | 'timeout';

/** Estado HTTP de cada código de error (EF-01). */
export const ESTADO_DEL_ERROR: Record<CodigoDeError, number> = {
  unauthorized: 401,
  invalid_request: 400,
  quota_exceeded: 429,
  provider_error: 502,
  timeout: 504,
};

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/**
 * La petición de EF-01, o `null` si no es válida (`invalid_request`, 400): el mensaje debe tener de 1 a 2000
 * caracteres y no solo espacios (HE-14-HU01-ET03), y el historial se limita a los últimos 20 turnos.
 */
export function leerPeticion(cuerpo: unknown): PeticionWindi | null {
  if (!esObjeto(cuerpo) || typeof cuerpo.message !== 'string' || !esObjeto(cuerpo.context)) return null;
  const largo = [...cuerpo.message].length;
  if (largo < 1 || largo > LARGO_MAXIMO || cuerpo.message.trim() === '') return null;
  const history = (Array.isArray(cuerpo.history) ? cuerpo.history : [])
    .filter(
      (t): t is Turno =>
        esObjeto(t) && (t.role === 'user' || t.role === 'assistant') && typeof t.text === 'string',
    )
    .slice(-TURNOS);
  return {
    client_request_id: typeof cuerpo.client_request_id === 'string' ? cuerpo.client_request_id : '',
    message: cuerpo.message,
    history,
    context: cuerpo.context as unknown as Contexto,
  };
}

/**
 * La instrucción del sistema de Windi (INT-03). Alcance de HE-14-HU01: solo las tarjetas del usuario y el
 * funcionamiento de la aplicación (ET23); si no entiende, hace una sola pregunta concreta (ET21); si no puede
 * hacer algo, lo dice y ofrece una alternativa (ET22).
 */
export function instruccionDelSistema(contexto: Contexto): string {
  const reglas = [
    'Eres Windi, el agente de IA de Windgets, una aplicación de escritorio para organizar tarjetas (tareas,',
    'recordatorios y eventos) en un tablero Kanban, un calendario, una agenda diaria y un planificador diario.',
    `La persona con la que hablas se llama ${contexto.alias}. Hoy es ${contexto.today} y son las`,
    `${contexto.now_hour}:00 en su computador.`,
    'Alcance: solo hablas de las tarjetas de esta persona y del funcionamiento de Windgets. Ante cualquier otro',
    'tema, mantienes la calma, dices con amabilidad que solo puedes ayudar con sus tarjetas y con la aplicación,',
    'no respondes la consulta y propones algo en lo que sí puedes ayudar.',
    'Si no entiendes qué acción quiere ni sobre qué tarjeta, haces una sola pregunta concreta para aclararlo y',
    'no propones cambios hasta tener la respuesta.',
    'Si no puedes hacer algo, lo dices y ofreces una alternativa.',
    'Nunca haces cambios por tu cuenta: solo propones y la persona confirma.',
    // HE-14-HU02: personalidad (ET01), trato (ET02, ET03), lenguaje (ET04) y formato (ET05 a ET07).
    'Personalidad: eres un compañero de organización cercano, relajado y optimista, cálido sin exagerar.',
    'Tratas a la persona de tú y la llamas por su nombre al saludarla y al celebrar un logro.',
    'Hablas en español neutro, con frases cortas y sencillas y sin tecnicismos.',
    'Cada respuesta tiene máximo 3 oraciones antes de una lista. Los pasos van en una lista numerada de máximo',
    '6 pasos. Usas como máximo un emoji por mensaje y solo en saludos o celebraciones.',
    // ET08 a ET11.
    'Celebras las tarjetas completadas con una frase breve.',
    'Nunca regañas ni culpas por las tarjetas vencidas: propones una salida, como cambiar la fecha límite o',
    'mover las tarjetas a otra columna.',
    'Si te preguntan si eres una persona, aclaras que eres el agente de IA de Windgets y sigues ofreciendo ayuda.',
    'Ante mensajes ofensivos mantienes la calma, no devuelves el tono ni juzgas, y ofreces ayuda con sus',
    'tarjetas o con la aplicación.',
    // HE-14-HU04: crear tarjetas.
    'Para crear tarjetas llamas a propose_create_cards; nunca dices que ya las creaste.',
    'El tipo es Tarea (task) si la persona no indica otro; también hay Recordatorio (reminder) y Evento (event).',
    'Entiendes la fecha límite exacta o relativa, como un día de la semana, y la conviertes a AAAA-MM-DD; al',
    'mostrarla la escribes como DD/MM/AAAA.',
    'El título y la fecha límite son obligatorios: si falta la fecha, preguntas por ella mencionando el título que',
    'entiendes; si falta el título y no se puede deducir, preguntas qué título ponerle. No propones hasta tenerlos.',
    'La fecha límite no puede ser anterior a hoy: si lo es, lo explicas y pides otra fecha, sin proponer.',
    'Si piden varias tarjetas en un mensaje, las propones todas en una sola llamada.',
    'Solo usas etiquetas que existen y nunca creas etiquetas. Si piden una que no existe, dices que no existe,',
    'mencionas las disponibles y preguntas si prefiere una de ellas o crear la tarjeta sin etiqueta.',
    // HE-14-HU05: editar tarjetas.
    'Para cambiar datos de una tarjeta llamas a propose_edit_card con su id y solo los datos que cambian.',
    'Si no encuentras una tarjeta con el nombre que menciona, lo dices, pides más detalles y no propones.',
    'Si varias tarjetas coinciden, muestras el título y la fecha límite de cada una y preguntas a cuál se refiere',
    'antes de proponer.',
    'Si el valor pedido es el que la tarjeta ya tiene, lo dices y no propones.',
    'Si la tarjeta está completada (tiene completed_on), avisas que está completada; si además pide que vuelva a',
    'estar pendiente, eso es mover la tarjeta, no editarla.',
    // HE-14-HU06: mover tarjetas.
    'Para mover una tarjeta a otra columna llamas a propose_move_card con su id y el id de la columna de destino.',
    'Si dice que una tarjeta ya está completada o terminada, eso es moverla a la columna con función done (Hecho).',
    'Si pide que una tarjeta completada vuelva a estar pendiente, eso es moverla a otra columna; avisas que está',
    'completada antes de proponer.',
    'Si la columna pedida no existe, dices que no la encuentras y mencionas las columnas del tablero en su orden,',
    'sin proponer.',
    'Si la tarjeta ya está en la columna pedida, dices en qué columna está y no propones.',
    'Si varias tarjetas coinciden, muestras el título, la fecha límite y la columna de cada una y preguntas a cuál',
    'se refiere antes de proponer.',
    `Columnas del tablero en su orden: ${contexto.columns.map((c) => `${c.name} (id ${c.id}, función ${c.role})`).join(', ')}.`,
    `Tarjetas relacionadas con el mensaje: ${
      contexto.cards.length
        ? contexto.cards
            .map((t) => `${String(t.title)} (id ${String(t.id)}, fecha límite ${String(t.due_date)}${((n) => (n ? `, columna ${n}` : ''))(contexto.columns.find((c) => c.id === t.column_id)?.name)}${t.completed_on ? ', completada' : ''})`)
            .join('; ')
        : 'ninguna'
    }.`,
    `Etiquetas disponibles: ${
      contexto.labels.length ? contexto.labels.map((e) => `${e.name} (id ${e.id})`).join(', ') : 'ninguna'
    }.`,
  ];
  return reglas.join(' ');
}

/** Las funciones que Windi puede llamar para proponer cambios (INT-03). HE-14-HU04: crear tarjetas. */
export const FUNCIONES = [
  {
    name: 'propose_create_cards',
    description: 'Propone crear una o varias tarjetas. La persona confirma antes de crearlas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        cards: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              type: { type: 'STRING', enum: ['task', 'reminder', 'event'] },
              title: { type: 'STRING', description: 'De 1 a 100 caracteres.' },
              due_date: { type: 'STRING', description: 'Fecha límite AAAA-MM-DD, no anterior a hoy.' },
              description: { type: 'STRING' },
              priority: { type: 'STRING', enum: ['high', 'medium', 'low'] },
              label_ids: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Solo ids de etiquetas que existen.' },
            },
            required: ['title', 'due_date'],
          },
        },
      },
      required: ['cards'],
    },
  },
  {
    name: 'propose_edit_card',
    description: 'Propone cambiar datos de una tarjeta. La persona confirma antes de cambiarla.',
    parameters: {
      type: 'OBJECT',
      properties: {
        card_id: { type: 'STRING', description: 'El id de una tarjeta de las relacionadas con el mensaje.' },
        changes: {
          type: 'OBJECT',
          description: 'Solo los datos que cambian.',
          properties: {
            type: { type: 'STRING', enum: ['task', 'reminder', 'event'] },
            title: { type: 'STRING', description: 'De 1 a 100 caracteres.' },
            due_date: { type: 'STRING', description: 'Fecha límite AAAA-MM-DD, no anterior a hoy.' },
            description: { type: 'STRING' },
            priority: { type: 'STRING', enum: ['high', 'medium', 'low'] },
            label_ids: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Solo ids de etiquetas que existen.' },
          },
        },
      },
      required: ['card_id', 'changes'],
    },
  },
  {
    name: 'propose_move_card',
    description: 'Propone mover una tarjeta a otra columna. La persona confirma antes de moverla.',
    parameters: {
      type: 'OBJECT',
      properties: {
        card_id: { type: 'STRING', description: 'El id de una tarjeta de las relacionadas con el mensaje.' },
        column_id: { type: 'STRING', description: 'El id de una columna del tablero.' },
      },
      required: ['card_id', 'column_id'],
    },
  },
];

/** La acción de la propuesta según la función que llamó Gemini. */
const ACCION: Record<string, Propuesta['action']> = {
  propose_create_cards: 'create',
  propose_edit_card: 'edit',
  propose_move_card: 'move',
};

/** Los elementos de la propuesta a partir de los argumentos de la función (INT-03 → EF-01). */
function elementos(nombre: string, args: Record<string, unknown>): Propuesta['items'] {
  if (nombre === 'propose_edit_card') {
    const cambios = esObjeto(args.changes) ? args.changes : null;
    return typeof args.card_id === 'string' ? [{ card_id: args.card_id, changes: cambios }] : [];
  }
  if (nombre === 'propose_move_card') {
    return typeof args.card_id === 'string' && typeof args.column_id === 'string'
      ? [{ card_id: args.card_id, changes: { column_id: args.column_id } }]
      : [];
  }
  const tarjetas = Array.isArray(args.cards) ? args.cards.filter(esObjeto) : [];
  return tarjetas.map((t) => ({ card_id: null, changes: t }));
}

/** El cuerpo de `generateContent` (INT-03): instrucción, historial y mensaje, y la configuración de generación. */
export function cuerpoParaGemini(peticion: PeticionWindi): Record<string, unknown> {
  const contents = [
    ...peticion.history.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.text }] })),
    { role: 'user', parts: [{ text: peticion.message }] },
  ];
  return {
    systemInstruction: { parts: [{ text: instruccionDelSistema(peticion.context) }] },
    contents,
    tools: [{ functionDeclarations: FUNCIONES }],
    toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
    generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
  };
}

/** El código de error de una respuesta de Gemini que no es 2xx (INT-03, «Fallas»). */
export function errorDeGemini(estado: number): CodigoDeError {
  return estado === 429 ? 'quota_exceeded' : 'provider_error';
}

/**
 * La respuesta de EF-01 a partir de la de Gemini. Sin texto (por ejemplo, un bloqueo de seguridad) es
 * `provider_error` (INT-03).
 * DUDA: HE-14-HU01 EF-01 devuelve `intent`, pero Gemini solo da texto. Valor usado: `answer` para el texto
 * (`propose` llega con las propuestas, HE-14-HU03) (docs/DUDAS.md).
 */
export function leerGemini(respuesta: unknown): RespuestaWindi | CodigoDeError {
  const partes = esObjeto(respuesta) && Array.isArray(respuesta.candidates) ? respuesta.candidates[0] : null;
  const contenido = esObjeto(partes) && esObjeto(partes.content) ? partes.content : null;
  const lista = contenido && Array.isArray(contenido.parts) ? contenido.parts : [];
  const reply = lista
    .map((p: unknown) => (esObjeto(p) && typeof p.text === 'string' ? p.text : ''))
    .join('')
    .trim();
  const llamada = lista
    .map((p: unknown) => (esObjeto(p) && esObjeto(p.functionCall) ? p.functionCall : null))
    .find((f) => f !== null);
  const accion = llamada && typeof llamada.name === 'string' ? ACCION[llamada.name] : undefined;
  if (llamada && accion) {
    const args = esObjeto(llamada.args) ? llamada.args : {};
    return {
      // DUDA: HE-14-HU04 Gemini puede llamar a la función sin texto. Valor usado: el texto del ejemplo de INT-03.
      reply: reply || 'Esto es lo que voy a crear. ¿Confirmas?',
      intent: 'propose',
      proposal: { action: accion, items: elementos(String(llamada.name), args) },
    };
  }
  if (!reply) return 'provider_error';
  return { reply, intent: 'answer', proposal: null };
}
