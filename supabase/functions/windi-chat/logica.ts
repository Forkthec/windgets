// EF-01 `windi-chat` (contratos.md): la lógica pura de la Edge Function, sin Deno, para probarla con Vitest
// (`apps/desktop/src/ipc/windiChat.test.ts`). `index.ts` la sirve. La función no hace cambios: solo propone (D-047).
// Llama a Gemini (INT-03) con la instrucción del sistema de Windi. No registra el contenido de las tarjetas ni de
// los mensajes (D-196): del log solo sale el resumen de cada respuesta de Gemini (P27, `resumenDeGemini`).

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
  /** HE-14-HU10 (P29): los colores del catálogo para crear etiquetas; un Núcleo anterior no los envía. */
  colors?: { id: string; name: string }[];
  cards: Record<string, unknown>[];
  totals: { total: number; overdue: number; pending: number; completed: number };
  /** HE-14-HU09-ET06: las cantidades que calcula el Núcleo con todas las tarjetas. */
  counts?: {
    by_column: Cantidad[];
    by_label: Cantidad[];
    by_priority: Cantidad[];
    completed_by_date: Cantidad[];
  };
  active_proposal: unknown;
}

export interface Cantidad {
  key: string;
  count: number;
}

export interface PeticionWindi {
  client_request_id: string;
  message: string;
  history: Turno[];
  context: Contexto;
}

export type Intencion = 'answer' | 'clarify' | 'propose' | 'out_of_scope';

export interface Propuesta {
  action: 'create' | 'edit' | 'move' | 'delete' | 'create_label';
  items: { card_id: string | null; changes: Record<string, unknown> | null }[];
}

export interface RespuestaWindi {
  reply: string;
  intent: Intencion;
  proposal: Propuesta | null;
}

export type CodigoDeError =
  'unauthorized' | 'invalid_request' | 'quota_exceeded' | 'provider_error' | 'timeout';

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
  'Menú principal > Configuración: indicador de sincronización, interruptor «Inicio automático» y «Cerrar sesión».',
  'Para abrir el detalle de una tarjeta se selecciona su título; desde el detalle se edita, se elimina o se marca',
  'como completada.',
  // HE-14-HU08-CA03, ET04 (P24): Agenda diaria, pantalla de edición y cuenta, desde docs/interfaz.md y HE-11.
  'Menú principal > Planificador > Agenda diaria: los 24 bloques horarios del día, de 00:00 a 23:00, con «Día',
  'anterior», «Día siguiente» y «Hoy». Para asignar una tarjeta a un bloque horario se arrastra (drag-and-drop)',
  'desde el panel Tarjetas sin horario, o desde otro bloque, hasta el bloque de destino; «Quitar del horario» la',
  'devuelve al panel Tarjetas sin horario.',
  'Menú principal > Personalización > Widgets > «Editar escritorio» abre la pantalla de edición, donde se mueven y',
  'se cambia el tamaño de los widgets; «Guardar» guarda los cambios y «Cancelar» o la tecla Esc sale.',
  'Cuenta: en Inicio de sesión, el hipervínculo «¿Olvidaste tu contraseña?» abre Recuperar contraseña (pasos',
  'Correo electrónico, Diligenciar código y Nueva contraseña) y «Regístrate» abre Registro.',
].join(' ');

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** HE-14-HU04-ET14: «sábado 21/11/2026» a partir de AAAA-MM-DD (el día del calendario, sin zona horaria). */
export function diaYFecha(iso: string, mas = 0): string {
  const [a, m, d] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, (d ?? 1) + mas));
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${DIAS[fecha.getUTCDay()]} ${dos(fecha.getUTCDate())}/${dos(fecha.getUTCMonth() + 1)}/${fecha.getUTCFullYear()}`;
}

/** DD/MM/AAAA a partir de AAAA-MM-DD. */
const dmy = (iso: string) => iso.split('-').reverse().join('/');

/** HE-14-HU09-ET06: las cantidades del Núcleo con los nombres de columnas, etiquetas y prioridades. */
function cantidades(contexto: Contexto): string {
  const { totals, counts } = contexto;
  const partes = [
    `total ${totals.total}, vencidas ${totals.overdue}, pendientes ${totals.pending}, completadas ${totals.completed}`,
  ];
  if (counts) {
    const nombre = (lista: { id: string; name: string }[], id: string) =>
      lista.find((x) => x.id.toLowerCase() === id.toLowerCase())?.name ?? id;
    const prioridades: Record<string, string> = {
      high: 'alta',
      medium: 'media',
      low: 'baja',
      none: 'sin prioridad',
    };
    const unir = (lista: Cantidad[], texto: (k: string) => string) =>
      lista.length ? lista.map((c) => `${texto(c.key)} ${c.count}`).join(', ') : 'ninguna';
    partes.push(
      `por columna: ${unir(counts.by_column, (k) => nombre(contexto.columns, k))}`,
      `por etiqueta: ${unir(counts.by_label, (k) => nombre(contexto.labels, k))}`,
      `por prioridad: ${unir(counts.by_priority, (k) => prioridades[k] ?? k)}`,
      `completadas por fecha de completado: ${unir(counts.completed_by_date, dmy)}`,
    );
  }
  return partes.join('; ');
}

const TIPOS: Record<string, string> = { task: 'tarea', reminder: 'recordatorio', event: 'evento' };

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
  const prioridad =
    typeof t.priority === 'string' ? { high: 'alta', medium: 'media', low: 'baja' }[t.priority] : null;
  // HE-14-HU09-ET07: el tipo, el bloque horario y la descripción (recortada) de cada tarjeta.
  const hora = (h: number) => `${String(h).padStart(2, '0')}:00`;
  const bloque =
    typeof t.scheduled_date === 'string' && typeof t.scheduled_hour === 'number'
      ? `bloque horario ${t.scheduled_date} ${hora(t.scheduled_hour)} – ${hora((t.scheduled_hour + 1) % 24)}`
      : null;
  const descripcion =
    typeof t.description === 'string' && t.description.trim()
      ? `descripción «${[...t.description.trim()].slice(0, 120).join('')}${[...t.description.trim()].length > 120 ? '…' : ''}»`
      : null;
  const datos = [
    `id ${String(t.id)}`,
    `fecha límite ${String(t.due_date)}`,
    estado,
    columna ? `columna ${columna}` : null,
    prioridad ? `prioridad ${prioridad}` : null,
    etiquetas.length ? `etiquetas ${etiquetas.join(', ')}` : null,
    typeof t.type === 'string' && TIPOS[t.type] ? `tipo ${TIPOS[t.type]}` : null,
    bloque,
    descripcion,
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
    // HE-14-HU04-CA12, ET14: el día de la semana de hoy y de los próximos 7 días, en hora de Colombia (UTC-5).
    `La persona con la que hablas se llama ${contexto.alias}. Hoy es ${diaYFecha(contexto.today)}`,
    `(${contexto.today}) y son las ${contexto.now_hour}:00 en su computador, en hora de Colombia (UTC-5).`,
    `Los próximos 7 días: ${Array.from({ length: 7 }, (_, i) => diaYFecha(contexto.today, i + 1)).join(', ')}.`,
    'Alcance: solo hablas de las tarjetas de esta persona y del funcionamiento de Windgets. Ante cualquier otro',
    'tema no respondes la consulta y llamas a responder con intent out_of_scope: la aplicación muestra un mensaje',
    'fijo que ofrece algo en lo que sí puedes ayudar (HE-14-HU01-ET26).',
    // HE-14-HU01-ET25: cada respuesta tiene su intención.
    'En responder indicas la intención: answer cuando respondes, clarify cuando preguntas por un dato que falta y',
    'out_of_scope cuando el tema no es de sus tarjetas ni de Windgets. Aclarar no descarta la propuesta pendiente.',
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
    // P27 (C8): no se inventan datos que la persona no pidió.
    'Al crear o al cambiar tarjetas solo envías los datos que la persona indicó: si no pidió prioridad,',
    'descripción, etiquetas o bloque horario, no los envías y quedan vacíos o como estaban.',
    // HE-14-HU04-ET13.
    'Las tarjetas nuevas siempre se crean en la columna Por hacer: si piden crearla en otra columna, explicas que',
    'las tarjetas nuevas se crean en Por hacer y propones crearla en Por hacer.',
    // HE-14-HU10 (P29): crear etiquetas.
    'Al crear o editar tarjetas solo usas etiquetas que existen. Si piden una que no existe, dices que no existe,',
    'mencionas las disponibles y preguntas si prefiere una de ellas, crear la tarjeta sin etiqueta o crear antes',
    'la etiqueta. Cuando la persona confirma la etiqueta nueva, propones la tarjeta con ella.',
    'Para crear etiquetas llamas a propose_create_labels con el nombre y el color de cada una; nunca dices que ya',
    'las creaste. El nombre y el color son obligatorios y nunca eliges el color por la persona: si falta el color,',
    'preguntas de qué color quiere la etiqueta y mencionas los colores disponibles; si falta el nombre, preguntas',
    'qué nombre ponerle. No propones hasta tenerlos.',
    'El nombre de una etiqueta tiene máximo 30 caracteres y no repite el de otra etiqueta, sin distinguir',
    'mayúsculas: si lo repite, dices que ya existe y no propones. Se pueden tener máximo 20 etiquetas: si ya hay 20,',
    'lo dices y no propones.',
    `Colores para etiquetas: ${
      contexto.colors?.length ? contexto.colors.map((c) => `${c.name} (id ${c.id})`).join(', ') : 'ninguno'
    }.`,
    // HE-14-HU05: editar tarjetas (ET10 a ET14).
    'Para cambiar datos de una o varias tarjetas llamas a propose_edit_cards con un elemento por tarjeta: su id y',
    'solo los datos que cambian. Si piden el mismo cambio para varias tarjetas, como las vencidas, las incluyes',
    'todas en una sola llamada.',
    'Para quitar la prioridad, la descripción o el bloque horario, envías null en ese dato.',
    'Para poner o quitar etiquetas llamas a propose_label_cards con el id de la tarjeta y los nombres de las',
    'etiquetas que se agregan o se quitan; las demás etiquetas de la tarjeta se conservan. Una tarjeta tiene máximo',
    '3 etiquetas.',
    // HE-14-HU04-CA10; HE-14-HU05-CA11, CA12.
    'El bloque horario dura una hora y se indica con su fecha y su hora de inicio, de 0 a 23: el bloque',
    '«10:00 – 11:00» es start_hour 10. Si piden un bloque de más de una hora, explicas que los bloques son de una',
    'hora y preguntas cuál. Al crear o al cambiar una tarjeta puedes asignar el bloque en time_block.',
    // P27 (C6): «de 15:00 a 16:00» ya es un bloque de una hora.
    'Un bloque «de HH:00 a (HH+1):00», como «de 15:00 a 16:00», es un bloque válido de una hora: lo propones',
    'directamente con start_hour HH, sin preguntar.',
    'En la aplicación el bloque horario se asigna en Agenda diaria; tú solo lo propones en time_block y nunca',
    'prometes asignarlo sin la propuesta.',
    'Si no encuentras una tarjeta con el nombre que menciona, lo dices, pides más detalles y no propones.',
    'Si varias tarjetas coinciden, muestras el título y la fecha límite de cada una y preguntas a cuál se refiere',
    'antes de proponer.',
    'Si el valor pedido es el que la tarjeta ya tiene, lo dices y no propones.',
    'Si la tarjeta está completada (tiene completed_on), avisas que está completada; si además pide que vuelva a',
    'estar pendiente, eso es mover la tarjeta, no editarla.',
    // HE-14-HU06: mover tarjetas.
    'Para mover una o varias tarjetas a otra columna llamas a propose_move_cards con sus ids y el id o el nombre',
    'de la columna de destino. Si piden mover varias, como todas las de una columna, las incluyes todas en una',
    'sola llamada.',
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
    // HE-14-HU09-CA05, ET06.
    'Para decir cuántas tarjetas hay usas las cantidades calculadas y nunca las cuentas tú: la lista de tarjetas',
    'puede no traerlas todas.',
    `Cantidades calculadas con todas sus tarjetas: ${cantidades(contexto)}.`,
    // HE-14-HU03: la propuesta que espera «Confirmar».
    `Propuesta pendiente de confirmar: ${
      contexto.active_proposal ? JSON.stringify(contexto.active_proposal) : 'ninguna'
    }. Si piden ajustarla, propones de nuevo la propuesta completa con el ajuste.`,
    `Tarjetas (las relacionadas con el mensaje primero): ${
      contexto.cards.length ? contexto.cards.map((t) => lineaDeTarjeta(t, contexto)).join('; ') : 'ninguna'
    }.`,
    `Etiquetas disponibles: ${
      contexto.labels.length ? contexto.labels.map((e) => `${e.name} (id ${e.id})`).join(', ') : 'ninguna'
    }.`,
    // P23: en las pruebas manuales, Gemini anunciaba la propuesta («vamos a programar ese recordatorio») y se
    // detenía sin llamar a la función; la persona tenía que insistir. Ahora responde siempre con funciones.
    'Respondes siempre llamando funciones. El texto que ve la persona va en responder. Si ya tienes los datos para',
    'crear, editar, mover o eliminar tarjetas, o para crear etiquetas, en la misma respuesta llamas a responder con',
    'una frase breve y a la',
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
      properties: {
        text: { type: 'STRING', description: 'El texto que ve la persona.' },
        // HE-14-HU01-ET25.
        intent: {
          type: 'STRING',
          enum: ['answer', 'clarify', 'out_of_scope'],
          description:
            'answer al responder, clarify al pedir un dato que falta, out_of_scope fuera del alcance.',
        },
      },
      required: ['text', 'intent'],
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
              label_ids: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'Solo ids de etiquetas que existen.',
              },
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
              card_id: {
                type: 'STRING',
                description: 'El id de una tarjeta de las relacionadas con el mensaje.',
              },
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
              card_id: {
                type: 'STRING',
                description: 'El id de una tarjeta de las relacionadas con el mensaje.',
              },
              add: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'Nombres de etiquetas que se agregan.',
              },
              remove: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'Nombres de etiquetas que se quitan.',
              },
            },
            required: ['card_id'],
          },
        },
      },
      required: ['edits'],
    },
  },
  {
    // HE-14-HU10 (P29).
    name: 'propose_create_labels',
    description:
      'Propone crear una o varias etiquetas con su nombre y su color. Solo con los dos datos. La persona confirma antes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        labels: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING', description: 'El nombre de la etiqueta, de 1 a 30 caracteres.' },
              color: {
                type: 'STRING',
                description: 'El id o el nombre de un color de la lista; nunca uno inventado.',
              },
            },
            required: ['name', 'color'],
          },
        },
      },
      required: ['labels'],
    },
  },
  {
    name: 'propose_move_cards',
    description: 'Propone mover una o varias tarjetas a otra columna. La persona confirma antes de moverlas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        card_ids: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Los ids de las tarjetas de las relacionadas con el mensaje.',
        },
        column_id: { type: 'STRING', description: 'El id o el nombre de una columna del tablero.' },
      },
      required: ['card_ids', 'column_id'],
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
  propose_create_labels: 'create_label',
  propose_create_cards: 'create',
  propose_edit_cards: 'edit',
  propose_label_cards: 'edit',
  propose_move_cards: 'move',
  propose_delete_cards: 'delete',
};

/** HE-14-HU03-ET11: el texto que acompaña una propuesta corresponde a su acción. */
export const RESPALDO: Record<Propuesta['action'], string> = {
  create: 'Esto es lo que voy a crear. ¿Confirmas?',
  edit: 'Esto es lo que voy a cambiar. ¿Confirmas?',
  move: 'Esto es lo que voy a mover. ¿Confirmas?',
  delete: 'Esto es lo que voy a eliminar. ¿Confirmas?',
  // DUDA: HE-14-HU10 (P29) el texto sigue el de las demás acciones (docs/DUDAS.md).
  create_label: 'Esta es la etiqueta que voy a crear. ¿Confirmas?',
};

/**
 * Si Gemini llama a funciones de propuesta distintas en una respuesta, Windi pide hacerlo en dos pasos. DUDA:
 * HE-14-HU03 no define el texto (docs/DUDAS.md).
 */
export const UN_CAMBIO_A_LA_VEZ = 'Puedo preparar un tipo de cambio a la vez. ¿Cuál hacemos primero?';

/**
 * Si Gemini se queda sin tokens de salida, Windi pide hacerlo por partes en vez de dar el error genérico. DUDA:
 * HE-14-HU07-ET07 no define el texto (docs/DUDAS.md).
 */
export const MUY_LARGO = 'Tu pedido es muy largo para responderlo de una vez. ¿Lo hacemos por partes?';

/**
 * P27 (C5): si Gemini bloquea la respuesta por seguridad (`finishReason` o `promptFeedback.blockReason` `SAFETY`),
 * Windi lo dice y pide otra forma en vez de dar el error genérico. DUDA: INT-03 lleva el bloqueo de seguridad a
 * `provider_error`; Paula decidió una respuesta propia, y ningún CA define el texto (docs/DUDAS.md, P27).
 */
export const BLOQUEO_DE_SEGURIDAD = 'No puedo responder a ese mensaje. ¿Me lo dices de otra forma?';

/** Lo que se registra de una respuesta de Gemini (P27, C5): nunca el texto ni los argumentos (D-196). */
export interface ResumenDeGemini {
  finishReason: string | null;
  blockReason: string | null;
  partes: number;
  llamadas: string[];
}

/** El resumen de una respuesta de Gemini para el log: el motivo de cierre, la cantidad de partes y las funciones. */
export function resumenDeGemini(respuesta: unknown): ResumenDeGemini {
  const candidato =
    esObjeto(respuesta) && Array.isArray(respuesta.candidates) ? respuesta.candidates[0] : null;
  const contenido = esObjeto(candidato) && esObjeto(candidato.content) ? candidato.content : null;
  const lista: unknown[] = contenido && Array.isArray(contenido.parts) ? contenido.parts : [];
  const retro = esObjeto(respuesta) && esObjeto(respuesta.promptFeedback) ? respuesta.promptFeedback : null;
  return {
    finishReason:
      esObjeto(candidato) && typeof candidato.finishReason === 'string' ? candidato.finishReason : null,
    blockReason: retro && typeof retro.blockReason === 'string' ? retro.blockReason : null,
    partes: lista.length,
    llamadas: lista
      .map((p) => (esObjeto(p) && esObjeto(p.functionCall) ? p.functionCall.name : null))
      .filter((n): n is string => typeof n === 'string'),
  };
}

/** Escribe una línea en el log de la función. */
export type Registro = (nivel: 'info' | 'error', datos: Record<string, unknown>) => void;

/** Lo que el reintento de `responderConGemini` puede usar en lugar de lo de siempre (para las pruebas y el respaldo). */
export interface OpcionesDeGemini {
  /** Llama al modelo de respaldo (`GEMINI_MODEL_RESPALDO`); sin él, el reintento usa el mismo modelo. */
  llamarRespaldo?: () => Promise<Response>;
  /** Espera antes de reintentar tras un error pasajero; por defecto, `ESPERA_DEL_REINTENTO_MS`. */
  esperar?: (ms: number) => Promise<void>;
}

/** Cuánto se espera antes de reintentar un 500, 503 o 504 de Gemini (cabe en los 13 s de `ESPERA_MS`). */
export const ESPERA_DEL_REINTENTO_MS = 1_500;

/** Los estados de Gemini que son pasajeros (modelo saturado o caído un momento) y vale la pena reintentar. */
export function esFallaPasajera(estado: number): boolean {
  return estado === 500 || estado === 503 || estado === 504;
}

const esperarMs = (ms: number) => new Promise<void>((listo) => setTimeout(listo, ms));

/**
 * P27 (C5): llama a Gemini y lee su respuesta. Si Gemini responde 200 pero sin nada que mostrar (candidato vacío o
 * `MALFORMED_FUNCTION_CALL`), reintenta una sola vez. P36: si responde 500, 503 o 504 (el modelo está saturado; en la
 * prueba del 23-nov todas las fallas fueron 503), espera `ESPERA_DEL_REINTENTO_MS` y reintenta una sola vez con el
 * modelo de respaldo, si lo hay. `llamar` usa la misma señal de corte, así que el reintento cabe en los 13 s
 * (RNF-11). Cada respuesta deja una línea en el log con su resumen (`resumenDeGemini`). Los errores de red y el
 * corte los lanza `llamar`; los atiende quien la usa.
 */
export async function responderConGemini(
  llamar: () => Promise<Response>,
  registrar: Registro,
  opciones: OpcionesDeGemini = {},
): Promise<RespuestaWindi | CodigoDeError> {
  let siguiente = llamar;
  for (let intento = 1; ; intento++) {
    const respuesta = await siguiente();
    if (!respuesta.ok) {
      const codigo = errorDeGemini(respuesta.status);
      const reintentar = intento < 2 && esFallaPasajera(respuesta.status);
      registrar('error', {
        evento: 'gemini_http',
        intento,
        estado: respuesta.status,
        codigo,
        ...(reintentar ? { reintento: opciones.llamarRespaldo ? 'respaldo' : 'mismo_modelo' } : {}),
      });
      if (!reintentar) return codigo;
      await (opciones.esperar ?? esperarMs)(ESPERA_DEL_REINTENTO_MS);
      siguiente = opciones.llamarRespaldo ?? llamar;
      continue;
    }
    const cuerpo: unknown = await respuesta.json().catch(() => null);
    const leida = leerGemini(cuerpo);
    const fallo = leida === 'provider_error';
    registrar(fallo ? 'error' : 'info', { evento: 'gemini', intento, ...resumenDeGemini(cuerpo) });
    if (!fallo || intento >= 2) return leida;
  }
}

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
  // HE-14-HU10: el color va por su id o su nombre; el Núcleo lo busca en el catálogo y valida el nombre.
  if (nombre === 'propose_create_labels') {
    const etiquetas = Array.isArray(args.labels) ? args.labels.filter(esObjeto) : [];
    return etiquetas.map((e) => ({
      card_id: null,
      changes: {
        name: typeof e.name === 'string' ? e.name : '',
        color: typeof e.color === 'string' ? e.color : null,
      },
    }));
  }
  if (nombre === 'propose_delete_cards') {
    const ids = Array.isArray(args.card_ids) ? args.card_ids.filter((id) => typeof id === 'string') : [];
    return ids.map((id) => ({ card_id: id, changes: null }));
  }
  // HE-14-HU06-ET12: una propuesta de movimiento puede incluir varias tarjetas.
  if (nombre === 'propose_move_cards') {
    const ids = Array.isArray(args.card_ids) ? args.card_ids.filter((id) => typeof id === 'string') : [];
    const columna = args.column_id;
    return typeof columna === 'string'
      ? ids.map((id) => ({ card_id: id, changes: { column_id: columna } }))
      : [];
  }
  const tarjetas = Array.isArray(args.cards) ? args.cards.filter(esObjeto) : [];
  return tarjetas.map((t) => ({ card_id: null, changes: t }));
}

/** El cuerpo de `generateContent` (INT-03): instrucción, historial y mensaje, y la configuración de generación. */
export function cuerpoParaGemini(peticion: PeticionWindi): Record<string, unknown> {
  const contents = [
    ...peticion.history.map((t) => ({
      role: t.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: t.text }],
    })),
    { role: 'user', parts: [{ text: peticion.message }] },
  ];
  return {
    systemInstruction: { parts: [{ text: instruccionDelSistema(peticion.context) }] },
    contents,
    tools: [{ functionDeclarations: FUNCIONES }],
    toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    // HE-14-HU07-ET07: una propuesta con muchas tarjetas no cabe en 600 tokens de salida.
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  };
}

/** El código de error de una respuesta de Gemini que no es 2xx (INT-03, «Fallas»). */
export function errorDeGemini(estado: number): CodigoDeError {
  return estado === 429 ? 'quota_exceeded' : 'provider_error';
}

/**
 * La respuesta de EF-01 a partir de la de Gemini. Sin texto ni propuesta (candidato vacío o
 * `MALFORMED_FUNCTION_CALL`) es `provider_error` (INT-03); el bloqueo de seguridad tiene su respuesta (P27).
 * La intención llega en `responder` (HE-14-HU01-ET25); `propose` llega con las propuestas (HE-14-HU03).
 */
export function leerGemini(respuesta: unknown): RespuestaWindi | CodigoDeError {
  const resumen = resumenDeGemini(respuesta);
  // P27 (C5): el bloqueo de seguridad es previsible; Windi pide decirlo de otra forma y la propuesta activa sigue.
  if (resumen.finishReason === 'SAFETY' || resumen.blockReason === 'SAFETY') {
    return { reply: BLOQUEO_DE_SEGURIDAD, intent: 'clarify', proposal: null };
  }
  const partes = esObjeto(respuesta) && Array.isArray(respuesta.candidates) ? respuesta.candidates[0] : null;
  // La respuesta se cortó por el tope de tokens: lo que llegó está incompleto (HE-14-HU07-ET07).
  if (esObjeto(partes) && partes.finishReason === 'MAX_TOKENS') {
    return { reply: MUY_LARGO, intent: 'clarify', proposal: null };
  }
  const contenido = esObjeto(partes) && esObjeto(partes.content) ? partes.content : null;
  const lista = contenido && Array.isArray(contenido.parts) ? contenido.parts : [];
  const llamadas = lista
    .map((p: unknown) => (esObjeto(p) && esObjeto(p.functionCall) ? p.functionCall : null))
    .filter((f) => f !== null);
  // El texto llega en los argumentos de `responder` o en partes de texto; si llegan los dos, vale `responder`,
  // para no repetir la respuesta.
  const deResponder = llamadas
    .map((f) =>
      f.name === 'responder' && esObjeto(f.args) && typeof f.args.text === 'string' ? f.args.text : '',
    )
    .join('')
    .trim();
  const reply =
    deResponder ||
    lista
      .map((p: unknown) => (esObjeto(p) && typeof p.text === 'string' ? p.text : ''))
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
  // HE-14-HU01-ET25: la intención la indica Gemini en `responder`; sin una válida, es `answer`.
  const indicada = llamadas
    .map((f) => (f.name === 'responder' && esObjeto(f.args) ? f.args.intent : null))
    .find((i): i is Intencion => i === 'answer' || i === 'clarify' || i === 'out_of_scope');
  return { reply, intent: indicada ?? 'answer', proposal: null };
}
