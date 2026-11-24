// HE-13-HU04 · Consultar cuántas tarjetas vencidas, pendientes y completadas hay en el rango de fechas. Una prueba
// por CA en la vista; la clasificación del Núcleo tiene su prueba ca_he_13_hu04_* en servicio_del_planificador.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, Result, StatusBreakdown } from '@/types';
import {
  abrirPantalla,
  fijarHoy,
  HECHO,
  screen,
  tarjeta,
  type NucleoDelPlanificador,
} from '../kanban/pruebas';
import { Reports } from './Reports';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const TITULO = 'Vencidas, pendientes y completadas';

function estados(overdue: number, pending: number, completed: number): () => Result<StatusBreakdown> {
  const total = overdue + pending + completed;
  const p = (n: number) => (total ? Math.round((n * 1000) / total) / 10 : 0);
  return () => ({
    ok: true,
    value: {
      overdue,
      pending,
      completed,
      total,
      percent_overdue: p(overdue),
      percent_pending: p(pending),
      percent_completed: p(completed),
      is_empty: total === 0,
    },
  });
}

async function verSeccion(tarjetas: Card[] = [], preparar?: (n: NucleoDelPlanificador) => void) {
  const nucleo = await abrirPantalla('reports', 'Reportes', Reports, tarjetas, preparar);
  const s = await screen.findByRole('region', { name: TITULO });
  await waitFor(() => expect(within(s).queryByRole('status')).toBeNull());
  return { nucleo, s };
}

const VENCIDAS = [
  tarjeta({ title: 'Pagar la luz', due_date: '2026-11-01', is_overdue: true }),
  tarjeta({ title: 'Renovar el pase', due_date: '2026-11-03', is_overdue: true }),
  // Fuera del rango «Últimos 30 días»: no aparece en la lista.
  tarjeta({ title: 'Vieja', due_date: '2026-09-01', is_overdue: true }),
  tarjeta({ title: 'Hecha', due_date: '2026-11-02', column_id: HECHO.id, is_completed: true }),
];

describe('HE-13-HU04 · Vencidas, pendientes y completadas', () => {
  it('HE-13-HU04-CA01 · Consultar vencidas, pendientes y completadas', async () => {
    const { s } = await verSeccion();
    // ET03: cantidad y porcentaje de cada estado.
    expect(within(s).getByRole('button', { name: 'Vencidas: 2 (20,0 %)' })).toBeTruthy();
    expect(within(s).getByRole('button', { name: 'Pendientes: 3 (30,0 %)' })).toBeTruthy();
    expect(within(s).getByRole('button', { name: 'Completadas: 5 (50,0 %)' })).toBeTruthy();
    // ET01, ET02: anillo con un segmento por estado en sus colores y el total en el centro.
    const sectores = [...s.querySelectorAll('.recharts-pie-sector path')].map((p) => p.getAttribute('fill'));
    expect(sectores).toEqual([
      'var(--wg-estado-vencida)',
      'var(--wg-estado-pendiente)',
      'var(--wg-estado-completada)',
    ]);
    expect(within(s).getByText('10')).toBeTruthy();
  });

  it('HE-13-HU04-CA02 · Consultar las tarjetas de un estado', async () => {
    const { s } = await verSeccion(VENCIDAS, (n) =>
      n.responder('report_get_status_breakdown', estados(2, 0, 1)),
    );
    fireEvent.click(within(s).getByRole('button', { name: /^Vencidas/ }));
    // ET07, ET08: la lista debajo de la gráfica, con el título y la fecha límite.
    const lista = await within(s).findByRole('list', { name: 'Tarjetas vencidas' });
    await waitFor(() => expect(within(lista).getAllByRole('listitem')).toHaveLength(2));
    expect(within(lista).getByText('Pagar la luz')).toBeTruthy();
    expect(within(lista).getByText('01/11/2026')).toBeTruthy();
    expect(within(lista).getByText('03/11/2026')).toBeTruthy();
  });

  it('HE-13-HU04-CA03 · Abrir el detalle de una tarjeta de la lista', async () => {
    const { s } = await verSeccion(VENCIDAS, (n) =>
      n.responder('report_get_status_breakdown', estados(2, 0, 1)),
    );
    fireEvent.click(within(s).getByRole('button', { name: /^Vencidas/ }));
    fireEvent.click(await within(s).findByRole('button', { name: 'Pagar la luz' }));
    // ET09: Detalle de tarjeta sobre la pantalla Reportes (RT-02).
    const detalle = await screen.findByRole('dialog', { name: 'Detalle de tarjeta' });
    expect(within(detalle).getByText('Pagar la luz')).toBeTruthy();
    expect(screen.getByRole('main', { name: 'Reportes' })).toBeTruthy();
  });

  it('HE-13-HU04-CA04 · Sin tarjetas en el rango de fechas', async () => {
    const { s } = await verSeccion([], (n) => n.responder('report_get_status_breakdown', estados(0, 0, 0)));
    expect(within(s).getByText('No hay datos para este rango de fechas y estos filtros.')).toBeTruthy();
    expect(s.querySelector('.recharts-wrapper')).toBeNull();
  });

  it('HE-13-HU04-CA05 · Estado sin tarjetas', async () => {
    const { s } = await verSeccion([], (n) => n.responder('report_get_status_breakdown', estados(0, 2, 3)));
    // ET10: cantidad 0, sin segmento y su selección deshabilitada (RT-04).
    const vencidas = within(s).getByRole('button', { name: 'Vencidas: 0 (0,0 %)' }) as HTMLButtonElement;
    expect(vencidas.disabled).toBe(true);
    const sectores = [...s.querySelectorAll('.recharts-pie-sector path')].map((p) => p.getAttribute('fill'));
    expect(sectores).toEqual(['var(--wg-estado-pendiente)', 'var(--wg-estado-completada)']);
  });
});
