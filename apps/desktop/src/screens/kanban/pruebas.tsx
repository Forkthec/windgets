// Ayudas de las pruebas de las pantallas del planificador: la ventana principal con sesión iniciada y un Núcleo
// de prueba con la semilla de la cuenta (las 3 columnas por defecto) y las tarjetas en memoria.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentType } from 'react';
import { vi } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type {
  AgendaDay,
  BoardColumn,
  Card,
  CardCreateParams,
  CardDetail,
  CardMoveParams,
  CardUpdateParams,
  Column,
  CommandMap,
  CommandName,
  EventMap,
  Invoke,
  Label,
  PlannerToday,
  Result,
  ScreenId,
} from '@/types';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';

export const POR_HACER: Column = {
  id: 'col-todo',
  name: 'Por hacer',
  color_id: 'gray',
  color_hex: '#9E9E9E',
  role: 'todo',
  position: 1024,
  card_count: 0,
  is_default: true,
};
export const EN_PROGRESO: Column = {
  ...POR_HACER,
  id: 'col-progreso',
  name: 'En progreso',
  color_id: 'blue',
  color_hex: '#2196F3',
  role: 'in_progress',
  position: 2048,
};
export const HECHO: Column = {
  ...POR_HACER,
  id: 'col-hecho',
  name: 'Hecho',
  color_id: 'green',
  color_hex: '#4CAF50',
  role: 'done',
  position: 3072,
};

export const ETIQUETAS: Label[] = [
  { id: 'e1', name: 'Estudio', color_id: 'blue', color_hex: '#2196F3', card_count: 0 },
  { id: 'e2', name: 'Casa', color_id: 'green', color_hex: '#4CAF50', card_count: 0 },
];

/** Hoy en las pruebas del planificador: sábado 14/11/2026, a las 14:25 (fijarHoy). */
export const HOY = '2026-11-14';
export const HORA = 14;

let siguiente = 0;

/** Una tarjeta de prueba en Por hacer, con lo indicado. */
export function tarjeta(datos: Partial<Card> & Pick<Card, 'title'>): Card {
  siguiente += 1;
  return {
    id: `t${siguiente}`,
    type: 'task',
    description: null,
    priority: null,
    due_date: '2026-11-20',
    column_id: POR_HACER.id,
    position: 1024 * siguiente,
    previous_column_id: null,
    completed_on: null,
    scheduled_date: null,
    scheduled_hour: null,
    label_ids: [],
    is_completed: false,
    is_overdue: false,
    created_at: '2026-11-14T12:00:00.000Z',
    ...datos,
  };
}

type Respuesta = (params: unknown) => Result<unknown>;

export interface NucleoDelPlanificador {
  tarjetas: Card[];
  etiquetas: Label[];
  columnas: Column[];
  llamadas: Array<{ comando: string; params: unknown }>;
  responder: <K extends CommandName>(
    comando: K,
    respuesta: (params: CommandMap[K]['params']) => Result<CommandMap[K]['result']>,
  ) => void;
  emitir: <E extends keyof EventMap>(evento: E, carga: EventMap[E]) => void;
  /**
   * Suelta una tarjeta como lo haría el drag-and-drop (jsdom no calcula posiciones): el Núcleo aplica
   * `card_move` y emite `cards_changed`, y la pantalla vuelve a leer el tablero.
   */
  responderYMover: (movimiento: CardMoveParams) => Promise<void>;
}

export function llamadasA(nucleo: NucleoDelPlanificador, comando: CommandName) {
  return nucleo.llamadas.filter((l) => l.comando === comando).map((l) => l.params);
}

/** Núcleo de prueba con las columnas por defecto y las tarjetas indicadas. */
export function crearNucleo(tarjetas: Card[] = []): {
  nucleo: NucleoDelPlanificador;
  invocar: Invoke;
  escuchar: Escuchar;
} {
  const nucleo: NucleoDelPlanificador = {
    tarjetas: [...tarjetas],
    etiquetas: [...ETIQUETAS],
    columnas: [POR_HACER, EN_PROGRESO, HECHO],
    llamadas: [],
    responder: (comando, respuesta) => respuestas.set(comando, respuesta as Respuesta),
    emitir: (evento, carga) => act(() => (oyentes.get(evento) ?? []).forEach((o) => o(carga))),
    responderYMover: async (movimiento) => {
      await invocar('card_move', movimiento);
      (oyentes.get('cards_changed') ?? []).forEach((o) =>
        o({ ids: [movimiento.card_id], op: 'upsert', origin: 'local' }),
      );
    },
  };
  const tablero = (): BoardColumn[] =>
    nucleo.columnas.map((column) => {
      const cards = nucleo.tarjetas
        .filter((t) => t.column_id === column.id)
        .sort((a, b) => a.position - b.position);
      return { column: { ...column, card_count: cards.length }, cards };
    });
  const respuestas = new Map<string, Respuesta>([
    [
      'auth_get_session',
      () => ({ ok: true, value: { state: 'signed_in', alias: 'Prueba', token: 'valid' } }),
    ],
    ['label_list', () => ({ ok: true, value: [...nucleo.etiquetas] })],
    ['card_list_board', () => ({ ok: true, value: { columns: tablero() } })],
    ['column_list', () => ({ ok: true, value: tablero().map((c) => c.column) })],
    [
      'card_update',
      (params) => {
        const { id, patch } = params as CardUpdateParams;
        const t = nucleo.tarjetas.find((c) => c.id === id);
        if (!t) {
          return { ok: false, error: { code: 'card.not_found', message: 'Esta tarjeta ya no existe.' } };
        }
        if (patch.type !== undefined) t.type = patch.type;
        if (patch.title !== undefined) t.title = patch.title;
        if (patch.due_date !== undefined) t.due_date = patch.due_date;
        if (patch.description !== undefined) t.description = patch.description;
        if (patch.priority !== undefined) t.priority = patch.priority;
        if (patch.label_ids !== undefined) t.label_ids = patch.label_ids;
        return {
          ok: true,
          value: t,
          result_message: { code: 'card_update', message: 'Tarjeta actualizada.' },
        };
      },
    ],
    [
      'planner_get_today',
      () => {
        const deHoy = nucleo.tarjetas
          .filter((t) => t.due_date === HOY || t.scheduled_date === HOY)
          .map((card) => ({ card, hour: card.scheduled_date === HOY ? card.scheduled_hour : null }))
          .sort((a, b) => (a.hour ?? 99) - (b.hour ?? 99));
        const completed = deHoy.filter((i) => i.card.is_completed).length;
        const total = deHoy.length;
        const hoy: PlannerToday = {
          date: HOY,
          items: deHoy,
          summary: {
            total,
            completed,
            remaining: total - completed,
            percent: total ? Math.round((completed * 100) / total) : 0,
          },
        };
        return { ok: true, value: hoy };
      },
    ],
    [
      'agenda_get_day',
      (params) => {
        const { date } = params as { date: string };
        const esHoy = date === HOY;
        const hecho = (t: Card) => nucleo.columnas.find((c) => c.id === t.column_id)?.role === 'done';
        const agenda: AgendaDay = {
          date,
          is_today: esHoy,
          current_hour: esHoy ? HORA : null,
          blocks: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            cards: nucleo.tarjetas.filter((t) => t.scheduled_date === date && t.scheduled_hour === hour),
            is_past: date < HOY || (esHoy && hour < HORA),
          })),
          unscheduled: nucleo.tarjetas.filter((t) => t.scheduled_date === null && !hecho(t)),
        };
        return { ok: true, value: agenda };
      },
    ],
    [
      'card_move',
      (params) => {
        const { card_id, column_id, placement } = params as CardMoveParams;
        const t = nucleo.tarjetas.find((c) => c.id === card_id);
        const destino = nucleo.columnas.find((c) => c.id === column_id);
        if (!t)
          return { ok: false, error: { code: 'card.not_found', message: 'Esta tarjeta ya no existe.' } };
        if (!destino) return { ok: false, error: { code: 'column.not_found', message: '' } };
        const otras = nucleo.tarjetas
          .filter((c) => c.column_id === column_id && c.id !== card_id)
          .sort((a, b) => a.position - b.position);
        const i = placement.kind === 'before' ? otras.findIndex((c) => c.id === placement.card_id) : -1;
        const siguiente = otras[i];
        t.position = siguiente
          ? (otras[i - 1]?.position ?? siguiente.position - 1024) / 2 + siguiente.position / 2
          : (otras.at(-1)?.position ?? 0) + 1024;
        const eraHecho = nucleo.columnas.find((c) => c.id === t.column_id)?.role === 'done';
        if (destino.role === 'done' && !eraHecho) {
          Object.assign(t, { completed_on: '2026-11-14', previous_column_id: t.column_id });
        }
        if (eraHecho && destino.role !== 'done') t.completed_on = null;
        t.column_id = column_id;
        t.is_completed = destino.role === 'done';
        t.is_overdue = !t.is_completed && t.due_date < '2026-11-14';
        return { ok: true, value: t };
      },
    ],
    [
      'card_delete',
      (params) => {
        const i = nucleo.tarjetas.findIndex((c) => c.id === (params as { id: string }).id);
        if (i < 0) {
          return { ok: false, error: { code: 'card.not_found', message: 'Esta tarjeta ya no existe.' } };
        }
        nucleo.tarjetas.splice(i, 1);
        return {
          ok: true,
          value: null,
          result_message: { code: 'card_delete', message: 'Tarjeta eliminada.' },
        };
      },
    ],
    [
      'card_get',
      (params) => {
        const t = nucleo.tarjetas.find((c) => c.id === (params as { id: string }).id);
        if (!t) {
          return { ok: false, error: { code: 'card.not_found', message: 'Esta tarjeta ya no existe.' } };
        }
        const columna = nucleo.columnas.find((c) => c.id === t.column_id) ?? POR_HACER;
        const hora = t.scheduled_hour ?? 0;
        const detalle: CardDetail = {
          ...t,
          labels: nucleo.etiquetas
            .filter((e) => t.label_ids.includes(e.id))
            .map(({ id, name, color_hex }) => ({
              id,
              name,
              color_hex,
            })),
          column: { id: columna.id, name: columna.name, color_hex: columna.color_hex },
          time_block: t.scheduled_date
            ? {
                date: t.scheduled_date,
                hour: hora,
                label: `${String(hora).padStart(2, '0')}:00 – ${String((hora + 1) % 24).padStart(2, '0')}:00`,
              }
            : null,
        };
        return { ok: true, value: detalle };
      },
    ],
    [
      'card_create',
      (params) => {
        const p = params as CardCreateParams;
        const nueva = tarjeta({
          type: p.type ?? 'task',
          title: p.title,
          due_date: p.due_date,
          description: p.description ?? null,
          priority: p.priority ?? null,
          label_ids: p.label_ids ?? [],
        });
        nucleo.tarjetas.push(nueva);
        return {
          ok: true,
          value: nueva,
          result_message: { code: 'card_create', message: 'Tarjeta creada.' },
        };
      },
    ],
  ]);
  const oyentes = new Map<string, Array<(c: unknown) => void>>();
  const invocar = ((comando: string, params: unknown) => {
    nucleo.llamadas.push({ comando, params });
    const r = respuestas.get(comando);
    return Promise.resolve(
      r ? r(params) : { ok: false, error: { code: 'internal.unexpected', message: '' } },
    );
  }) as unknown as Invoke;
  const escuchar = ((evento: string, alRecibir: (c: unknown) => void) => {
    const lista = oyentes.get(evento) ?? [];
    lista.push(alRecibir);
    oyentes.set(evento, lista);
    return () => lista.splice(lista.indexOf(alRecibir), 1);
  }) as unknown as Escuchar;
  return { nucleo, invocar, escuchar };
}

/** Hoy es el sábado 14/11/2026 en el computador (solo se simula `Date`). */
export function fijarHoy() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 14, 14, 25, 0));
}

/**
 * Abre la ventana principal con sesión iniciada en Menú principal > Planificador > <pantalla> y espera a que
 * la pantalla lea sus datos.
 */
export async function abrirPantalla(
  pantalla: ScreenId,
  nombre: string,
  componente: ComponentType,
  tarjetas: Card[] = [],
): Promise<NucleoDelPlanificador> {
  const { nucleo, invocar, escuchar } = crearNucleo(tarjetas);
  render(<VentanaPrincipal invocar={invocar} escuchar={escuchar} pantallas={{ [pantalla]: componente }} />);
  const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
  fireEvent.click(within(menu).getByRole('button', { name: nombre }));
  await screen.findByRole('main', { name: nombre });
  await act(async () => {});
  return nucleo;
}

export { screen };
