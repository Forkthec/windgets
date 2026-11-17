// HE-06-HU02, HE-06-HU03 y HE-06-HU04 · Widget Tareas del día en la capa (C-02). Una prueba por CA en la vista;
// las reglas del Núcleo tienen sus pruebas en servicio_del_planificador/pruebas_de_completar.rs (casilla,
// «Mover a», sin conexión) y pruebas_del_planificador_diario.rs (cambio de día). Las selecciones llegan como
// las entrega la capa: `click()` en el elemento (HE-06-HU01, `entregarSeleccion`). Hoy es el 14/11/2026.
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Card, LayerInitialState, PlannerToday } from '@/types';
import {
  crearNucleo,
  EN_PROGRESO,
  HECHO,
  HOY,
  llamadasA,
  POR_HACER,
  tarjeta,
  type NucleoDelPlanificador,
} from '../screens/kanban/pruebas';
import { Capa } from './Capa';

const ESTADO: LayerInitialState = {
  applied: {
    template_id: 'default',
    background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
    colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
    palette_id: null,
    font: { id: 'nunito', size: 'medium' },
  },
  widgets: [
    { widget_id: 'tareas', type: 'daily_tasks', x: 380, y: 40, width: 360, height: 520, is_active: true },
  ],
  monitors: [],
  wallpaper_state: 'ok',
};

afterEach(() => {
  vi.restoreAllMocks();
});

/** Pinta la capa con el widget Tareas del día activo y las tarjetas indicadas. */
async function pintar(tarjetas: Card[] = []) {
  const n = crearNucleo(tarjetas);
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
  const widget = await screen.findByRole('region', { name: 'Tareas del día' });
  await act(async () => {});
  return { ...n, widget };
}

/** EV-07 `cards_changed` del Núcleo, y la relectura del widget. */
async function avisarTarjetas(
  nucleo: NucleoDelPlanificador,
  ids: string[],
  op: 'upsert' | 'delete' = 'upsert',
) {
  nucleo.emitir('cards_changed', { ids, op, origin: 'local' });
  await act(async () => {});
}

/** Selecciona un elemento del widget como lo entrega la capa. */
async function seleccionar(elemento: HTMLElement) {
  await act(async () => {
    elemento.click();
  });
}

/** Cada tarjeta del widget como «título · hora · prioridad». */
function lista(widget: HTMLElement) {
  return within(widget)
    .getAllByRole('listitem')
    .filter((li) => li.parentElement?.getAttribute('aria-label') === 'Tarjetas de hoy')
    .map((li) =>
      Array.from(li.children)
        .filter((h) => h.tagName === 'SPAN')
        .map((h) => h.textContent)
        .join(' · '),
    );
}

function casilla(widget: HTMLElement, titulo: string) {
  return within(widget).getByRole('checkbox', { name: titulo }) as HTMLInputElement;
}

function tachada(widget: HTMLElement, titulo: string) {
  return casilla(widget, titulo).closest('li')?.classList.contains('wg-tachada') ?? false;
}

describe('HE-06-HU02 · Tarjetas del día en el widget', () => {
  it('HE-06-HU02-CA01 · Tarjetas del día en el widget', async () => {
    const { widget } = await pintar([
      tarjeta({ title: 'Pagar la luz', due_date: HOY, priority: 'high' }),
      tarjeta({ title: 'Estudiar redes', scheduled_date: HOY, scheduled_hour: 10 }),
      tarjeta({ title: 'Leer capítulo 3', scheduled_date: HOY, scheduled_hour: 8, priority: 'low' }),
      tarjeta({ title: 'Otro día', due_date: '2026-11-20' }),
    ]);
    // ET01: las del planificador diario, con título, hora si la tiene y prioridad, en el mismo orden.
    expect(lista(widget)).toEqual([
      'Leer capítulo 3 · 08:00 · Baja',
      'Estudiar redes · 10:00',
      'Pagar la luz · Alta',
    ]);
  });

  it('HE-06-HU02-CA02 · Nueva tarjeta para hoy', async () => {
    const { nucleo, widget } = await pintar([tarjeta({ title: 'Pagar la luz', due_date: HOY })]);
    const nueva = tarjeta({ title: 'Comprar pan', due_date: HOY });
    nucleo.tarjetas.push(nueva);
    // ET02: se actualiza con EV-07, sin esperar a otra lectura.
    await avisarTarjetas(nucleo, [nueva.id]);
    expect(lista(widget)).toEqual(['Pagar la luz', 'Comprar pan']);
  });

  it('HE-06-HU02-CA03 · Tarjeta completada', async () => {
    const pagar = tarjeta({ title: 'Pagar la luz', due_date: HOY });
    const { nucleo, invocar, widget } = await pintar([pagar]);
    expect(tachada(widget, 'Pagar la luz')).toBe(false);
    // Movida a Hecho desde el tablero: llega EV-07 y el widget la muestra tachada (ET03).
    await act(async () => {
      await invocar('card_move', { card_id: pagar.id, column_id: HECHO.id, placement: { kind: 'end' } });
    });
    await avisarTarjetas(nucleo, [pagar.id]);
    expect(tachada(widget, 'Pagar la luz')).toBe(true);
    expect(casilla(widget, 'Pagar la luz').checked).toBe(true);
  });

  it('HE-06-HU02-CA04 · Tarjeta eliminada', async () => {
    const pagar = tarjeta({ title: 'Pagar la luz', due_date: HOY });
    const { nucleo, widget } = await pintar([pagar, tarjeta({ title: 'Comprar pan', due_date: HOY })]);
    nucleo.tarjetas.splice(nucleo.tarjetas.indexOf(pagar), 1);
    await avisarTarjetas(nucleo, [pagar.id], 'delete');
    expect(lista(widget)).toEqual(['Comprar pan']);
  });

  it('HE-06-HU02-CA05 · Sin tarjetas para hoy', async () => {
    const { widget } = await pintar([tarjeta({ title: 'Otro día', due_date: '2026-11-20' })]);
    expect(within(widget).getByText('No tienes tarjetas para hoy.')).toBeTruthy();
    expect(within(widget).queryByRole('list')).toBeNull();
  });

  it('HE-06-HU02-CA06 · Cambio de día', async () => {
    const { nucleo, widget } = await pintar([tarjeta({ title: 'Pagar la luz', due_date: HOY })]);
    // A las 00:00 el Núcleo emite EV-22 y el día que devuelve IPC-CARD-08 es el nuevo (ET04).
    const manana: PlannerToday = {
      date: '2026-11-15',
      items: [{ card: tarjeta({ title: 'Ir al banco', due_date: '2026-11-15' }), hour: null }],
      summary: { total: 1, completed: 0, remaining: 1, percent: 0 },
    };
    nucleo.responder('planner_get_today', () => ({ ok: true, value: manana }));
    nucleo.emitir('day_changed', { date: '2026-11-15' });
    await act(async () => {});
    expect(lista(widget)).toEqual(['Ir al banco']);
  });
});

describe('HE-06-HU03 · Casilla de completada en el widget', () => {
  it('HE-06-HU03-CA01 · Completar una tarjeta desde el widget', async () => {
    const pagar = tarjeta({ title: 'Pagar la luz', due_date: HOY, column_id: EN_PROGRESO.id });
    const { nucleo, widget } = await pintar([pagar]);
    // La selección llega reenviada por el Núcleo (EV-18) y la capa la entrega a la casilla (HE-06-HU01).
    document.elementFromPoint = () => casilla(widget, 'Pagar la luz');
    nucleo.emitir('pointer_forwarded', { x: 400, y: 60, monitor_id: '0', button: 'primary' });
    await act(async () => {});
    expect(llamadasA(nucleo, 'card_set_completed')).toEqual([{ card_id: pagar.id, completed: true }]);
    // ET01: en Hecho. ET04: tachada y con la casilla seleccionada. En el widget no hay mensaje.
    expect(pagar.column_id).toBe(HECHO.id);
    expect(tachada(widget, 'Pagar la luz')).toBe(true);
    expect(casilla(widget, 'Pagar la luz').checked).toBe(true);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('HE-06-HU03-CA02 · Devolver una tarjeta completada a su columna', async () => {
    const pagar = tarjeta({
      title: 'Pagar la luz',
      due_date: HOY,
      column_id: HECHO.id,
      previous_column_id: EN_PROGRESO.id,
      completed_on: HOY,
      is_completed: true,
    });
    const { nucleo, widget } = await pintar([pagar]);
    await seleccionar(casilla(widget, 'Pagar la luz'));
    expect(llamadasA(nucleo, 'card_set_completed')).toEqual([{ card_id: pagar.id, completed: false }]);
    expect(pagar.column_id).toBe(EN_PROGRESO.id);
    expect(tachada(widget, 'Pagar la luz')).toBe(false);
  });

  it('HE-06-HU03-CA03 · Devolver una tarjeta cuando su columna anterior ya no existe', async () => {
    const pagar = tarjeta({
      title: 'Pagar la luz',
      due_date: HOY,
      column_id: HECHO.id,
      previous_column_id: 'col-revision',
      completed_on: HOY,
      is_completed: true,
    });
    const { widget } = await pintar([pagar]);
    await seleccionar(casilla(widget, 'Pagar la luz'));
    expect(pagar.column_id).toBe(POR_HACER.id);
    expect(tachada(widget, 'Pagar la luz')).toBe(false);
  });

  it('HE-06-HU03-CA04 · Alternar la casilla sin conexión', async () => {
    // ET05: el Núcleo guarda en SQLite y encola el cambio sin red; el widget no depende de la conexión.
    const pagar = tarjeta({ title: 'Pagar la luz', due_date: HOY });
    const { nucleo, widget } = await pintar([pagar]);
    await seleccionar(casilla(widget, 'Pagar la luz'));
    expect(llamadasA(nucleo, 'card_set_completed')).toEqual([{ card_id: pagar.id, completed: true }]);
    expect(tachada(widget, 'Pagar la luz')).toBe(true);
  });
});
