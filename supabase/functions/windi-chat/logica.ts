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
  ];
  return reglas.join(' ');
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
  if (!reply) return 'provider_error';
  return { reply, intent: 'answer', proposal: null };
}
