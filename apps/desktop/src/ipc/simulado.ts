import type { AppError, BoardColumn, Card, Column, CommandMap, CommandName, Result } from '@/types';
import textos from '@/types/messages.es.json';

// Núcleo simulado para `pnpm --filter desktop dev`: «solo las vistas en el navegador, con IPC simulado»
// (convenciones.md, «Ejecutar en desarrollo»). Cada HU (historia de usuario) define aquí la respuesta de su
// comando; los demás responden un error neutro con el mensaje vacío, porque ningún CA (criterio de
// aceptación) lo define (tipos.ts, AppError.message). No valida: las validaciones de campo están en la vista
// y en el Núcleo real.

/** Cuenta ya verificada del simulado (datos de prueba mínimos de HE-01-HU04). */
export const CUENTA_SIMULADA = { email: 'usuario.prueba@example.com', alias: 'Prueba' };

export const CONTRASENA_SIMULADA = 'Clave123';

const ESPERA_DE_REENVIO_MS = 60_000;
const VIGENCIA_DEL_CODIGO_MS = 600_000;

const error = (e: AppError): Result<never> => ({ ok: false, error: e });

// Planificador del simulado: la semilla de la cuenta (las 3 columnas por defecto, datos.md, Modelo · 9) y las
// tarjetas que se crean mientras la página está abierta.
const COLUMNAS_SIMULADAS: Column[] = [
  ['por-hacer', 'Por hacer', 'gray', '#9E9E9E', 'todo'],
  ['en-progreso', 'En progreso', 'blue', '#2196F3', 'in_progress'],
  ['hecho', 'Hecho', 'green', '#4CAF50', 'done'],
].map(([id, name, color_id, color_hex, role], i) => ({
  id: id as string,
  name: name as string,
  color_id: color_id as string,
  color_hex: color_hex as string,
  role: role as Column['role'],
  position: 1024 * (i + 1),
  card_count: 0,
  is_default: true,
}));
const tarjetasSimuladas: Card[] = [];

function tableroSimulado(): BoardColumn[] {
  return COLUMNAS_SIMULADAS.map((column) => {
    const cards = tarjetasSimuladas.filter((t) => t.column_id === column.id);
    return { column: { ...column, card_count: cards.length }, cards };
  });
}

type Respuestas = {
  [K in CommandName]?: (params: CommandMap[K]['params']) => Result<CommandMap[K]['result']>;
};

const respuestas: Respuestas = {
  connectivity_get: () => ({ ok: true, value: { online: true } }),
  auth_get_session: () => ({ ok: true, value: { state: 'signed_out', token: 'valid' } }),
  auth_register_start: ({ email }) => {
    if (email.trim().toLowerCase() === CUENTA_SIMULADA.email) {
      return error({ code: 'email.already_registered', message: textos.CORREO_YA_REGISTRADO });
    }
    const ahora = Date.now();
    return {
      ok: true,
      value: {
        resend_available_at: new Date(ahora + ESPERA_DE_REENVIO_MS).toISOString(),
        expires_at: new Date(ahora + VIGENCIA_DEL_CODIGO_MS).toISOString(),
      },
      result_message: { code: 'auth_register_start', message: textos.CODIGO_ENVIADO },
    };
  },
  // Cualquier código se acepta: el simulado no envía correos.
  auth_register_verify: () => ({
    ok: true,
    value: { alias: 'Prueba' },
    result_message: {
      code: 'auth_register_verify',
      message: textos.BIENVENIDA.replace('<alias>', 'Prueba'),
      params: { alias: 'Prueba' },
    },
  }),
  auth_register_resend: () => ({
    ok: true,
    value: { resend_available_at: new Date(Date.now() + ESPERA_DE_REENVIO_MS).toISOString() },
    result_message: { code: 'auth_register_resend', message: textos.CODIGO_REENVIADO },
  }),
  auth_register_cancel: () => ({ ok: true, value: null }),
  // HE-01-HU04: solo la cuenta de prueba entra, con la contraseña de los datos de prueba mínimos.
  auth_sign_in: ({ email, password }) =>
    email.trim().toLowerCase() === CUENTA_SIMULADA.email && password === CONTRASENA_SIMULADA
      ? { ok: true, value: { user_id: 'simulado', alias: CUENTA_SIMULADA.alias } }
      : error({ code: 'auth.invalid_credentials', message: textos.CREDENCIALES_INCORRECTAS }),
  // HE-07-HU01: el simulado no tiene etiquetas y crea la tarjeta tal cual llega, al final de Por hacer.
  label_list: () => ({ ok: true, value: [] }),
  card_create: (p) => {
    const tarjeta: Card = {
      id: crypto.randomUUID(),
      type: p.type ?? 'task',
      title: p.title.trim(),
      description: p.description ?? null,
      priority: p.priority ?? null,
      due_date: p.due_date,
      column_id: 'por-hacer',
      position: 1024 * (tarjetasSimuladas.length + 1),
      previous_column_id: null,
      completed_on: null,
      scheduled_date: null,
      scheduled_hour: null,
      label_ids: p.label_ids ?? [],
      is_completed: false,
      is_overdue: false,
      created_at: new Date().toISOString(),
    };
    tarjetasSimuladas.push(tarjeta);
    return {
      ok: true,
      value: tarjeta,
      result_message: { code: 'card_create', message: textos.TARJETA_CREADA },
    };
  },
  // HE-09-HU01: el tablero con las columnas por defecto y las tarjetas creadas.
  card_list_board: () => ({ ok: true, value: { columns: tableroSimulado() } }),
  column_list: () => ({ ok: true, value: tableroSimulado().map((c) => c.column) }),
  // HE-07-HU03: el detalle de una tarjeta creada (el simulado no tiene etiquetas ni bloques horarios).
  card_get: ({ id }) => {
    const t = tarjetasSimuladas.find((c) => c.id === id);
    const columna = COLUMNAS_SIMULADAS.find((c) => c.id === t?.column_id);
    if (!t || !columna) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    return {
      ok: true,
      value: {
        ...t,
        labels: [],
        column: { id: columna.id, name: columna.name, color_hex: columna.color_hex },
        time_block: null,
      },
    };
  },
};

export async function invocarSimulado<K extends CommandName>(
  comando: K,
  params: CommandMap[K]['params'],
): Promise<Result<CommandMap[K]['result']>> {
  const respuesta = respuestas[comando] as
    ((p: CommandMap[K]['params']) => Result<CommandMap[K]['result']>) | undefined;
  return respuesta ? respuesta(params) : error({ code: 'internal.unexpected', message: '' });
}
