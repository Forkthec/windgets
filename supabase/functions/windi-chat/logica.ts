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
export const MODELO_POR_DEFECTO = 'gemini-3.5-flash-lite';

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
 * HE-14-HU08-ET02, ET03: las pantallas y opciones de la aplicación, con los nombres que se ven en ella. DUDA:
 * HE-14-HU08 no define el texto de la guía; se arma con el menú principal y las opciones de cada pantalla.
 */
export const GUIA = [
  'Menú principal > Planificador: Planificador diario (tus tarjetas de hoy y el resumen de avance), Tablero Kanban',
  '(«Nueva tarjeta», «Nueva columna», «Vista expandida» o «Vista compacta», en cada columna «Editar» y «Eliminar», en',
  'cada tarjeta «Mover a»; se arrastran tarjetas y columnas), Calendario (vista mensual y semanal, Panel del día),',
  'Agenda diaria (bloques horarios), Reportes (rango de fechas, filtro Etiquetas, Tarjetas completadas, Tasa de',
  'cumplimiento y estados), Agente de IA y Etiquetas («Nueva etiqueta», «Editar», «Eliminar»).',
  'Menú principal > Personalización: Personalización del wallpaper (plantilla, imagen de fondo con «Subir imagen» o',
  '«Catálogo de imágenes», colores, paleta, tipografía; «Guardar», «Guardar como tema», «Aplicar», «Cancelar»), Temas',
  '(«Aplicar», «Renombrar», «Eliminar») y Widgets (activar o desactivar, «Agregar widget», «Configurar», «Eliminar»,',
  '«Editar escritorio» para mover y cambiar el tamaño de los widgets).',
  'Menú principal > Configuración: indicador de sincronización, inicio automático con Windows y «Cerrar sesión».',
  'Para abrir el detalle de una tarjeta se selecciona su título; desde el detalle se edita, se elimina o se marca',
  'como completada.',
].join(' ');

/** Una tarjeta del contexto con su estado, fechas, columna, prioridad y etiquetas (HE-14-HU09-ET01). */
function lineaDeTarjeta(t: Record<string, unknown>, contexto: Contexto): string {
  const completada = typeof t.completed_on === 'string' && t.completed_on;
  const estado = completada
    ? `completada el ${String(t.completed_on)}`
    : String(t.due_date) < contexto.today
      ? 'vencida'
      : 'pendiente';
  const columna = contexto.columns.find((c) => c.id === t.column_id)?.name;
  const etiquetas = Array.isArray(t.label_ids)
    ? t.label_ids.map((id) => contexto.labels.find((e) => e.id === id)?.name).filter(Boolean)
    : [];
  const prioridad = typeof t.priority === 'string' ? { high: 'alta', medium: 'media', low: 'baja' }[t.priority] : null;
  const datos = [
    `id ${String(t.id)}`,
    `fecha límite ${String(t.due_date)}`,
    estado,
    columna ? `columna ${columna}` : null,
    prioridad ? `prioridad ${prioridad}` : null,
    etiquetas.length ? `etiquetas ${etiquetas.join(', ')}` : null,
  ].filter(Boolean);
  return `${String(t.title)} (${datos.join(', ')})`;
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
    // HE-14-HU03: CA05, ET09 y ET10.
    'Nunca dices que hiciste, creaste, cambiaste, moviste o eliminaste algo: los cambios solo se aplican cuando la',
    'persona selecciona «Confirmar» en la propuesta.',
    'Si la persona escribe «sí», «confirmo» o algo parecido para aceptar una propuesta, le pides que seleccione',
    '«Confirmar» en la propuesta; no llamas ninguna función de propuesta y no dices que hiciste el cambio.',
    'Nunca anuncias un cambio con texto sin llamar en la misma respuesta a la función de la propuesta.',
    'En cada respuesta propones un solo tipo de cambio: crear, cambiar, mover o eliminar.',
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
    // HE-14-HU05: editar tarjetas (ET10 a ET14).
    'Para cambiar datos de una o varias tarjetas llamas a propose_edit_cards con un elemento por tarjeta: su id y',
    'solo los datos que cambian. Si piden el mismo cambio para varias tarjetas, como las vencidas, las incluyes',
    'todas en una sola llamada.',
    'Para quitar la prioridad, la descripción o el bloque horario, envías null en ese dato.',
    'Para poner o quitar etiquetas llamas a propose_label_cards con el id de la tarjeta y los nombres de las',
    'etiquetas que se agregan o se quitan; las demás etiquetas de la tarjeta se conservan. Una tarjeta tiene máximo',
    '5 etiquetas.',
    // HE-14-HU04-CA10; HE-14-HU05-CA11, CA12.
    'El bloque horario dura una hora y se indica con su fecha y su hora de inicio, de 0 a 23: el bloque',
    '«10:00 – 11:00» es start_hour 10. Si piden un bloque de más de una hora, explicas que los bloques son de una',
    'hora y preguntas cuál. Al crear o al cambiar una tarjeta puedes asignar el bloque en time_block.',
    'Si no encuentras una tarjeta con el nombre que menciona, lo dices, pides más detalles y no propones.',
    'Si varias tarjetas coinciden, muestras el título y la fecha límite de cada una y preguntas a cuál se refiere',
    'antes de proponer.',
    'Si el valor pedido es el que la tarjeta ya tiene, lo dices y no propones.',
    'Si la tarjeta está completada (tiene completed_on), avisas que está completada; si además pide que vuelva a',
    'estar pendiente, eso es mover la tarjeta, no editarla.',
    // HE-14-HU06: mover tarjetas.
    'Para mover una tarjeta a otra columna llamas a propose_move_card con su id y el id o el nombre de la columna',
    'de destino.',
    'Si dice que una tarjeta ya está completada o terminada, eso es moverla a la columna con función done (Hecho).',
    'Si pide que una tarjeta completada vuelva a estar pendiente, eso es moverla a otra columna; avisas que está',
    'completada antes de proponer.',
    'Si la columna pedida no existe, dices que no la encuentras y mencionas las columnas del tablero en su orden,',
    'sin proponer.',
    'Si la tarjeta ya está en la columna pedida, dices en qué columna está y no propones.',
    'Si varias tarjetas coinciden, muestras el título, la fecha límite y la columna de cada una y preguntas a cuál',
    'se refiere antes de proponer.',
    // HE-14-HU07: eliminar tarjetas.
    'Para eliminar tarjetas llamas a propose_delete_cards con sus ids; si pide eliminar todas las que cumplen una',
    'condición, como estar en una columna, las incluyes todas en una sola llamada.',
    'Si varias tarjetas coinciden con el nombre que menciona, muestras el título y la fecha límite de cada una y',
    'preguntas a cuál se refiere antes de proponer la eliminación.',
    `Columnas del tablero en su orden: ${contexto.columns.map((c) => `${c.name} (id ${c.id}, función ${c.role})`).join(', ')}.`,
    // HE-14-HU08: preguntas sobre cómo funciona la aplicación.
    'Si preguntan cómo hacer algo en la aplicación, respondes con una lista numerada de máximo 6 pasos que nombra',
    'las pantallas y las opciones exactamente como aparecen en esta guía; no inventas pantallas, opciones ni',
    'funciones. Si la función no existe, dices que no está disponible en la aplicación, no das pasos y mencionas',
    'una función parecida de la guía si la hay.',
    `Guía de la aplicación: ${GUIA}`,
    // HE-14-HU09: preguntas por las tarjetas.
    'Si preguntan por sus tarjetas según su estado, fecha, columna, etiqueta o prioridad, cuentas y listas solo las',
    'tarjetas de abajo que cumplen el criterio, con su título y su fecha límite en DD/MM/AAAA; nunca inventas',
    'tarjetas. Una tarjeta está completada si tiene fecha de completado, vencida si no está completada y su fecha',
    'límite es anterior a hoy, y pendiente en los demás casos.',
    'Las tarjetas completadas en un rango de fechas se cuentan por su fecha de completado dentro del rango, igual que',
    'la sección Tarjetas completadas de Reportes.',
    'Si ninguna tarjeta cumple el criterio, dices que no encuentras tarjetas que coincidan; si preguntaban por',
    'vencidas, lo dices celebrando que no tiene ninguna.',
    'Responder una consulta nunca crea, edita, mueve ni elimina tarjetas: no llamas ninguna función.',
    `Tarjetas (las relacionadas con el mensaje primero): ${
      contexto.cards.length ? contexto.cards.map((t) => lineaDeTarjeta(t, contexto)).join('; ') : 'ninguna'
    }.`,
    `Etiquetas disponibles: ${
      contexto.labels.length ? contexto.labels.map((e) => `${e.name} (id ${e.id})`).join(', ') : 'ninguna'
    }.`,
    // P23: en las pruebas manuales, Gemini anunciaba la propuesta («vamos a programar ese recordatorio») y se
    // detenía sin llamar a la función; la persona tenía que insistir. Ahora responde siempre con funciones.
    'Respondes siempre llamando funciones. El texto que ve la persona va en responder. Si ya tienes los datos para',
    'crear, editar, mover o eliminar tarjetas, en la misma respuesta llamas a responder con una frase breve y a la',
    'función de la propuesta: la persona solo ve la propuesta y el botón para confirmarla si llamas a esa función.',
    'Nunca describes la propuesta solo con texto ni pides permiso para proponer.',
  ];
  return reglas.join(' ');
}

/** El bloque horario de una tarjeta: su fecha y su hora de inicio; dura una hora (HE-11-HU01). `null` lo quita. */
const BLOQUE = {
  type: 'OBJECT',
  nullable: true,
  description: 'El bloque horario de una hora; null para quitarlo.',
  properties: {
    date: { type: 'STRING', description: 'Fecha AAAA-MM-DD.' },
    start_hour: { type: 'INTEGER', description: 'Hora de inicio, de 0 a 23.' },
  },
  required: ['date', 'start_hour'],
};

/**
 * Las funciones que Windi puede llamar (INT-03): `responder` lleva el texto de la respuesta y las demás proponen
 * cambios. DUDA (P23): INT-03 no define `responder`; con `mode: 'AUTO'` Gemini a veces anunciaba la propuesta en
 * texto y no llamaba a la función. Con `mode: 'ANY'` siempre responde con funciones (docs/DUDAS.md).
 */
export const FUNCIONES = [
  {
    name: 'responder',
    description:
      'Envía a la persona el texto de tu respuesta. Lo llamas siempre, solo o junto a una función de propuesta.',
    parameters: {
      type: 'OBJECT',
      properties: { text: { type: 'STRING', description: 'El texto que ve la persona.' } },
      required: ['text'],
    },
  },
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
              time_block: BLOQUE,
            },
            required: ['title', 'due_date'],
          },
        },
      },
      required: ['cards'],
    },
  },
  {
    name: 'propose_edit_cards',
    description: 'Propone cambiar datos de una o varias tarjetas. La persona confirma antes de cambiarlas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        edits: {
          type: 'ARRAY',
          items: {
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
                  // HE-14-HU05-ET12: `null` quita la descripción, la prioridad o el bloque horario.
                  description: { type: 'STRING', nullable: true, description: 'null para quitarla.' },
                  priority: {
                    type: 'STRING',
                    enum: ['high', 'medium', 'low'],
                    nullable: true,
                    description: 'null para quitarla.',
                  },
                  time_block: BLOQUE,
                },
              },
            },
            required: ['card_id', 'changes'],
          },
        },
      },
      required: ['edits'],
    },
  },
  {
    name: 'propose_label_cards',
    description:
      'Propone agregar o quitar etiquetas de una o varias tarjetas, por su nombre. La persona confirma antes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        edits: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              card_id: { type: 'STRING', description: 'El id de una tarjeta de las relacionadas con el mensaje.' },
              add: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Nombres de etiquetas que se agregan.' },
              remove: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Nombres de etiquetas que se quitan.' },
            },
            required: ['card_id'],
          },
        },
      },
      required: ['edits'],
    },
  },
  {
    name: 'propose_move_card',
    description: 'Propone mover una tarjeta a otra columna. La persona confirma antes de moverla.',
    parameters: {
      type: 'OBJECT',
      properties: {
        card_id: { type: 'STRING', description: 'El id de una tarjeta de las relacionadas con el mensaje.' },
        column_id: { type: 'STRING', description: 'El id o el nombre de una columna del tablero.' },
      },
      required: ['card_id', 'column_id'],
    },
  },
  {
    name: 'propose_delete_cards',
    description: 'Propone eliminar una o varias tarjetas. La persona confirma antes de eliminarlas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        card_ids: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Los ids de tarjetas de las relacionadas con el mensaje.',
        },
      },
      required: ['card_ids'],
    },
  },
];

/** La acción de la propuesta según la función que llamó Gemini. */
const ACCION: Record<string, Propuesta['action']> = {
  propose_create_cards: 'create',
  propose_edit_cards: 'edit',
  propose_label_cards: 'edit',
  propose_move_card: 'move',
  propose_delete_cards: 'delete',
};

/** HE-14-HU03-ET11: el texto que acompaña una propuesta corresponde a su acción. */
export const RESPALDO: Record<Propuesta['action'], string> = {
  create: 'Esto es lo que voy a crear. ¿Confirmas?',
  edit: 'Esto es lo que voy a cambiar. ¿Confirmas?',
  move: 'Esto es lo que voy a mover. ¿Confirmas?',
  delete: 'Esto es lo que voy a eliminar. ¿Confirmas?',
};

/**
 * Si Gemini llama a funciones de propuesta distintas en una respuesta, Windi pide hacerlo en dos pasos. DUDA:
 * HE-14-HU03 no define el texto (docs/DUDAS.md).
 */
export const UN_CAMBIO_A_LA_VEZ = 'Puedo preparar un tipo de cambio a la vez. ¿Cuál hacemos primero?';

/** Los elementos de la propuesta a partir de los argumentos de la función (INT-03 → EF-01). */
function elementos(nombre: string, args: Record<string, unknown>): Propuesta['items'] {
  const ediciones = Array.isArray(args.edits) ? args.edits.filter(esObjeto) : [];
  if (nombre === 'propose_edit_cards') {
    return ediciones
      .filter((e) => typeof e.card_id === 'string')
      .map((e) => ({ card_id: String(e.card_id), changes: esObjeto(e.changes) ? e.changes : null }));
  }
  // HE-14-HU05-CA09, ET11: las etiquetas van por su nombre; el Núcleo conserva las demás.
  if (nombre === 'propose_label_cards') {
    const nombres = (v: unknown) => (Array.isArray(v) ? v.filter((n) => typeof n === 'string') : []);
    return ediciones
      .filter((e) => typeof e.card_id === 'string')
      .map((e) => ({
        card_id: String(e.card_id),
        changes: { add_labels: nombres(e.add), remove_labels: nombres(e.remove) },
      }));
  }
  if (nombre === 'propose_delete_cards') {
    const ids = Array.isArray(args.card_ids) ? args.card_ids.filter((id) => typeof id === 'string') : [];
    return ids.map((id) => ({ card_id: id, changes: null }));
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
    toolConfig: { functionCallingConfig: { mode: 'ANY' } },
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
  const llamadas = lista
    .map((p: unknown) => (esObjeto(p) && esObjeto(p.functionCall) ? p.functionCall : null))
    .filter((f) => f !== null);
  // El texto llega en partes de texto o en los argumentos de `responder`.
  const reply = [
    ...lista.map((p: unknown) => (esObjeto(p) && typeof p.text === 'string' ? p.text : '')),
    ...llamadas.map((f) =>
      f.name === 'responder' && esObjeto(f.args) && typeof f.args.text === 'string' ? f.args.text : '',
    ),
  ]
    .join('')
    .trim();
  const propuestas = llamadas.filter((f) => typeof f.name === 'string' && f.name in ACCION);
  const acciones = new Set(propuestas.map((f) => ACCION[String(f.name)]));
  if (acciones.size > 1) {
    return { reply: UN_CAMBIO_A_LA_VEZ, intent: 'clarify', proposal: null };
  }
  const [accion] = [...acciones];
  if (accion) {
    // HE-14-HU05-ET10: las llamadas de la misma acción se juntan en una sola propuesta.
    const items = propuestas.flatMap((f) => elementos(String(f.name), esObjeto(f.args) ? f.args : {}));
    return {
      // DUDA: HE-14-HU04 Gemini puede llamar a la función sin texto. Valor usado: el texto de su acción (ET11).
      reply: reply || RESPALDO[accion],
      intent: 'propose',
      proposal: { action: accion, items },
    };
  }
  if (!reply) return 'provider_error';
  return { reply, intent: 'answer', proposal: null };
}
