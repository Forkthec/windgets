import type {
  AppError,
  BoardColumn,
  Card,
  Column,
  CommandMap,
  CommandName,
  Result,
  ThemeDraftView,
  WidgetItem,
  WindiMessage,
} from '@/types';
import textos from '@/types/messages.es.json';
import { diaDelCalendario, mesDelCalendario, semanaDelCalendario } from './calendarioSimulado';
import { fechaIso } from '@/screens/tarjeta/fechas';

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
// HE-14-HU01: la conversación con Windi del Núcleo simulado. Sin Supabase no hay windi-chat: todo mensaje
// responde `windi.unavailable` (CA08).
const conversacionSimulada: WindiMessage[] = [];
let inicioAutomaticoSimulado = false;

function tableroSimulado(): BoardColumn[] {
  return COLUMNAS_SIMULADAS.map((column) => {
    const cards = tarjetasSimuladas
      .filter((t) => t.column_id === column.id)
      .sort((a, b) => a.position - b.position);
    return { column: { ...column, card_count: cards.length }, cards };
  });
}

// Tema inicial «Mi tema» del simulado (HE-02-HU10-ET05): la plantilla por defecto y sus colores.
const TEMA_SIMULADO: ThemeDraftView = {
  theme_id: 'mi-tema',
  name: 'Mi tema',
  content: {
    template_id: 'default',
    background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
    colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
    palette_id: null,
    font: { id: 'nunito', size: 'medium' },
  },
  dirty: false,
  applied_unsaved: false,
  legibility: { ok: true, items: [], suggestion: null },
};

// Los cuatro widgets por defecto de la semilla de la cuenta, activos (HE-04-HU01-ET04).
const WIDGETS_SIMULADOS: WidgetItem[] = (
  [
    ['reloj', 'clock', 'Reloj'],
    ['calendario', 'calendar', 'Calendario'],
    ['tareas', 'daily_tasks', 'Tareas del día'],
    ['kanban', 'kanban', 'Kanban'],
  ] as const
).map(([widget_id, type, display_name]) => ({
  widget_id,
  type,
  display_name,
  distinguishing_value: null,
  is_default: true,
  is_active: true,
  can_configure: false,
  can_delete: false,
  paused_by_load: false,
  config: {},
}));

type Respuestas = {
  [K in CommandName]?: (params: CommandMap[K]['params']) => Result<CommandMap[K]['result']>;
};

const respuestas: Respuestas = {
  theme_list: () => ({
    ok: true,
    value: [
      {
        id: TEMA_SIMULADO.theme_id,
        name: TEMA_SIMULADO.name,
        last_modified_at: '2026-11-01T00:00:00.000Z',
        is_applied: true,
        has_unapplied_changes: false,
        has_unsaved_changes: false,
      },
    ],
  }),
  theme_draft_open: () => ({ ok: true, value: TEMA_SIMULADO }),
  widget_list: () => ({ ok: true, value: WIDGETS_SIMULADOS.map((w) => ({ ...w })) }),
  // HE-04-HU04: el catálogo con todo habilitado (el simulado no agrega widgets).
  widget_catalog_get: () => ({
    ok: true,
    value: {
      external: [
        ['weather', 'Clima', 'Conocer el clima actual sin abrir otra aplicación.'],
        ['news', 'Noticias', 'Conocer los titulares recientes desde el escritorio.'],
      ].map(([type, name, description]) => ({
        type: type as 'weather' | 'news',
        name: name as string,
        description: description as string,
        enabled: true,
        disabled_reason: null,
      })),
      local: (
        [
          ['animation', 'Animación', 'Dar movimiento al escritorio.'],
          [
            'image_carousel',
            'Carrusel de imágenes',
            'Ver varias imágenes que cambian automáticamente sobre el wallpaper.',
          ],
          ['static_image', 'Imagen estática', 'Mostrar una imagen preferida sobre el wallpaper.'],
          ['music_player', 'Reproductor de música', 'Seguir la música que suena desde el escritorio.'],
          ['text', 'Texto', 'Tener a la vista una frase o nota breve.'],
        ] as const
      ).map(([type, name, description]) => ({
        type,
        name,
        description,
        enabled: true,
        disabled_reason: null,
      })),
    },
  }),
  widget_set_active: ({ widget_id, active }) => {
    const w = WIDGETS_SIMULADOS.find((x) => x.widget_id === widget_id);
    if (!w) return error({ code: 'widget.not_found', message: '' });
    w.is_active = active;
    return { ok: true, value: { ...w } };
  },
  theme_draft_select: () => ({ ok: true, value: TEMA_SIMULADO }),
  connectivity_get: () => ({ ok: true, value: { online: true } }),
  sync_get_status: () => ({ ok: true, value: { status: 'synced', pending_count: 0, last_sync_at: null } }),
  auth_get_session: () => ({ ok: true, value: { state: 'signed_out', token: 'valid' } }),
  // HE-16-HU03: el simulado no guarda cambios pendientes; cerrar sesión responde el mensaje de CA01.
  auth_get_sign_out_info: () => ({ ok: true, value: { pending_count: 0 } }),
  // HE-16-HU02: el simulado guarda el inicio automático en memoria (fuera de Tauri no hay registro de Windows).
  // HE-17-HU02: el simulado no guarda la última pantalla (fuera de Tauri no hay área de notificación).
  app_set_last_screen: () => ({ ok: true, value: null }),
  windi_get_conversation: () => {
    if (conversacionSimulada.length === 0) {
      const text = textos.WINDI_SALUDO.replace('<alias>', 'Prueba');
      conversacionSimulada.push({
        id: 'saludo',
        role: 'assistant',
        text,
        sent_at: new Date().toISOString(),
        failed: false,
      });
    }
    return { ok: true, value: { messages: [...conversacionSimulada], proposal: null, online: true } };
  },
  windi_send_message: ({ message }) => {
    conversacionSimulada.push({
      id: `m${conversacionSimulada.length}`,
      role: 'user',
      text: message,
      sent_at: new Date().toISOString(),
      failed: true,
    });
    return error({ code: 'windi.unavailable', message: textos.WINDI_NO_DISPONIBLE });
  },
  // HE-14-HU03: fuera de Tauri Windi no responde, así que no hay propuestas que confirmar o rechazar.
  windi_confirm_proposal: () => error({ code: 'proposal.discarded', message: '' }),
  windi_reject_proposal: () => error({ code: 'proposal.discarded', message: '' }),
  // HE-06-HU08: fuera de Tauri no hay ventana que mostrar ni EV-23 (IPC-DESK-03).
  app_open_screen: () => ({ ok: true, value: null }),
  // HE-17-HU03: fuera de Tauri no hay programa que cerrar.
  app_exit: () => ({ ok: true, value: null }),
  autostart_get: () => ({ ok: true, value: { enabled: inicioAutomaticoSimulado } }),
  autostart_set: ({ enabled }) => {
    inicioAutomaticoSimulado = enabled;
    return {
      ok: true,
      value: { enabled },
      result_message: {
        code: 'autostart_set',
        message: enabled ? textos.INICIO_AUTOMATICO_ACTIVADO : textos.INICIO_AUTOMATICO_DESACTIVADO,
      },
    };
  },
  auth_sign_out: () => ({
    ok: true,
    value: null,
    result_message: { code: 'auth_sign_out', message: textos.SESION_CERRADA },
  }),
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
  // HE-01-HU05: fuera de Tauri no hay navegador ni regreso windgets://; la espera no recibe resultado.
  auth_google_start: () => ({ ok: true, value: { expires_at: new Date(Date.now() + 300_000).toISOString() } }),
  auth_google_cancel: () => ({ ok: true, value: null }),
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
  // HE-06-HU05: el widget Kanban, con hasta 5 títulos por columna (IPC-CARD-15).
  kanban_widget_get: () => ({
    ok: true,
    value: {
      columns: tableroSimulado().map(({ column, cards }) => ({
        column,
        titles: cards.slice(0, 5).map((t) => ({ card_id: t.id, title: t.title })),
        extra_count: Math.max(cards.length - 5, 0),
      })),
    },
  }),
  // HE-10-HU01: los días del mes con sus tarjetas (IPC-CARD-12).
  calendar_get_month: ({ year, month }) => ({
    ok: true,
    value: mesDelCalendario(tarjetasSimuladas, year, month, fechaIso(new Date())),
  }),
  // HE-10-HU02: los 7 días de la semana con sus tarjetas (IPC-CARD-13).
  calendar_get_week: ({ week_start }) => ({
    ok: true,
    value: semanaDelCalendario(tarjetasSimuladas, week_start, fechaIso(new Date())),
  }),
  // HE-10-HU03: las tarjetas del Panel del día (IPC-CARD-14).
  calendar_get_day: ({ date }) => ({
    ok: true,
    value: diaDelCalendario(tarjetasSimuladas, COLUMNAS_SIMULADAS, date, fechaIso(new Date())),
  }),
  column_list: () => ({ ok: true, value: tableroSimulado().map((c) => c.column) }),
  // HE-09-HU05: el orden completo de las columnas.
  column_reorder: ({ column_ids }) => {
    const ids = [...column_ids].sort();
    const actuales = COLUMNAS_SIMULADAS.map((c) => c.id).sort();
    if (ids.join() !== actuales.join()) return error({ code: 'column.order_invalid', message: '' });
    column_ids.forEach((id, i) => {
      const c = COLUMNAS_SIMULADAS.find((x) => x.id === id);
      if (c) c.position = 1024 * (i + 1);
    });
    COLUMNAS_SIMULADAS.sort((a, b) => a.position - b.position);
    return { ok: true, value: tableroSimulado().map((c) => c.column) };
  },
  // HE-07-HU04: aplica los cambios a la tarjeta creada.
  card_update: ({ id, patch }) => {
    const t = tarjetasSimuladas.find((c) => c.id === id);
    if (!t) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    if (patch.type !== undefined) t.type = patch.type;
    if (patch.title !== undefined) t.title = patch.title;
    if (patch.due_date !== undefined) t.due_date = patch.due_date;
    if (patch.description !== undefined) t.description = patch.description;
    if (patch.priority !== undefined) t.priority = patch.priority;
    if (patch.label_ids !== undefined) t.label_ids = patch.label_ids;
    return {
      ok: true,
      value: t,
      result_message: { code: 'card_update', message: textos.TARJETA_ACTUALIZADA },
    };
  },
  // HE-12-HU01: las tarjetas de hoy (fecha límite o bloque de hoy), por hora y después las sin hora.
  planner_get_today: () => {
    const ahora = new Date();
    const dos = (n: number) => String(n).padStart(2, '0');
    const hoy = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
    const items = tarjetasSimuladas
      .filter((t) => t.due_date === hoy || t.scheduled_date === hoy)
      .map((card) => ({ card, hour: card.scheduled_date === hoy ? card.scheduled_hour : null }))
      .sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99));
    const completed = items.filter((i) => i.card.is_completed).length;
    const total = items.length;
    return {
      ok: true,
      value: {
        date: hoy,
        items,
        summary: {
          total,
          completed,
          remaining: total - completed,
          percent: total ? Math.round((completed * 100) / total) : 0,
        },
      },
    };
  },
  // HE-11-HU01: la agenda de un día con la fecha y la hora del navegador.
  agenda_get_day: ({ date }) => {
    const ahora = new Date();
    const dos = (n: number) => String(n).padStart(2, '0');
    const hoy = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
    const esHoy = date === hoy;
    const hora = ahora.getHours();
    return {
      ok: true,
      value: {
        date,
        is_today: esHoy,
        current_hour: esHoy ? hora : null,
        blocks: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          cards: tarjetasSimuladas.filter((t) => t.scheduled_date === date && t.scheduled_hour === hour),
          is_past: date < hoy || (esHoy && hour < hora),
        })),
        unscheduled: tarjetasSimuladas.filter((t) => t.scheduled_date === null && t.column_id !== 'hecho'),
      },
    };
  },
  // HE-11-HU02: asigna la tarjeta a un bloque, salvo un bloque que ya terminó o un día después de su fecha límite.
  card_assign_time_block: ({ card_id, date, hour }) => {
    const t = tarjetasSimuladas.find((c) => c.id === card_id);
    if (!t) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    const ahora = new Date();
    const dos = (n: number) => String(n).padStart(2, '0');
    const hoy = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
    if (date < hoy || (date === hoy && hour < ahora.getHours())) {
      return error({ code: 'time_block.past', message: textos.BLOQUE_YA_PASO });
    }
    if (date > t.due_date) {
      return error({ code: 'time_block.after_due_date', message: textos.BLOQUE_DESPUES_DE_FECHA_LIMITE });
    }
    t.scheduled_date = date;
    t.scheduled_hour = hour;
    const message = textos.TARJETA_ASIGNADA_AL_BLOQUE.replace('<hora de inicio>', `${dos(hour)}:00`).replace(
      '<hora de fin>',
      `${dos((hour + 1) % 24)}:00`,
    );
    return { ok: true, value: t, result_message: { code: 'card_assign_time_block', message } };
  },
  // HE-11-HU03: quita la tarjeta de su bloque sin eliminarla (IPC-CARD-11).
  card_unassign_time_block: ({ card_id }) => {
    const t = tarjetasSimuladas.find((c) => c.id === card_id);
    if (!t) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    t.scheduled_date = null;
    t.scheduled_hour = null;
    return {
      ok: true,
      value: t,
      result_message: { code: 'card_unassign_time_block', message: textos.TARJETA_QUITADA_DEL_HORARIO },
    };
  },
  // HE-09-HU02: mueve la tarjeta, con las reglas de la columna Hecho.
  card_move: ({ card_id, column_id, placement }) => {
    const t = tarjetasSimuladas.find((c) => c.id === card_id);
    const destino = COLUMNAS_SIMULADAS.find((c) => c.id === column_id);
    if (!t) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    if (!destino) return error({ code: 'column.not_found', message: '' });
    const otras = tarjetasSimuladas
      .filter((c) => c.column_id === column_id && c.id !== card_id)
      .sort((a, b) => a.position - b.position);
    const i = placement.kind === 'before' ? otras.findIndex((c) => c.id === placement.card_id) : -1;
    const siguiente = otras[i];
    t.position = siguiente
      ? ((otras[i - 1]?.position ?? siguiente.position - 1024) + siguiente.position) / 2
      : (otras.at(-1)?.position ?? 0) + 1024;
    const hoy = new Date().toISOString().slice(0, 10);
    const eraHecho = t.column_id === 'hecho';
    if (destino.role === 'done' && !eraHecho) {
      t.completed_on = hoy;
      t.previous_column_id = t.column_id;
    }
    if (eraHecho && destino.role !== 'done') t.completed_on = null;
    t.column_id = column_id;
    t.is_completed = destino.role === 'done';
    t.is_overdue = !t.is_completed && t.due_date < hoy;
    return { ok: true, value: t };
  },
  // HE-12-HU02, HE-06-HU03: marcar mueve al final de Hecho; desmarcar la devuelve a la columna anterior o, si
  // ya no existe, a Por hacer. Solo al marcar hay mensaje.
  card_set_completed: ({ card_id, completed }) => {
    const t = tarjetasSimuladas.find((c) => c.id === card_id);
    if (!t) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    if (t.is_completed === completed) return { ok: true, value: t };
    const anterior = COLUMNAS_SIMULADAS.find((c) => c.id === t.previous_column_id);
    const destino = completed ? 'hecho' : (anterior?.id ?? 'por-hacer');
    const movida = respuestas.card_move?.({ card_id, column_id: destino, placement: { kind: 'end' } });
    if (!movida?.ok) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    return completed
      ? {
          ok: true,
          value: t,
          result_message: { code: 'card_set_completed', message: textos.TARJETA_COMPLETADA },
        }
      : { ok: true, value: t };
  },
  // HE-07-HU05: elimina la tarjeta creada.
  card_delete: ({ id }) => {
    const i = tarjetasSimuladas.findIndex((c) => c.id === id);
    if (i < 0) return error({ code: 'card.not_found', message: textos.TARJETA_NO_EXISTE });
    tarjetasSimuladas.splice(i, 1);
    return {
      ok: true,
      value: null,
      result_message: { code: 'card_delete', message: textos.TARJETA_ELIMINADA },
    };
  },
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
