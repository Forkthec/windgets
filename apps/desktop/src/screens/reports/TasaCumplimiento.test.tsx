// HE-13-HU03 · Consultar la tasa de cumplimiento. Una prueba por CA en la vista; la fórmula del Núcleo tiene su
// prueba ca_he_13_hu03_* en servicio_del_planificador.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComplianceReport, Result } from '@/types';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Reports } from './Reports';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

function tasa(percent: number | null, on_time: number, total: number): () => Result<ComplianceReport> {
  return () => ({ ok: true, value: { percent, on_time, total, is_empty: total === 0 } });
}

async function verTasa(preparar?: (n: NucleoDelPlanificador) => void) {
  const nucleo = await abrirPantalla('reports', 'Reportes', Reports, [], preparar);
  const s = await screen.findByRole('region', { name: 'Tasa de cumplimiento' });
  await waitFor(() => expect(within(s).queryByRole('status')).toBeNull());
  return { nucleo, s };
}

describe('HE-13-HU03 · Tasa de cumplimiento', () => {
  it('HE-13-HU03-CA01 · Consultar la tasa de cumplimiento', async () => {
    const { nucleo, s } = await verTasa();
    // ET01, ET02, ET04: indicador, no gráfica.
    expect(within(s).getByText('66,7 %')).toBeTruthy();
    expect(within(s).getByText('2 de 3 tarjetas completadas a tiempo')).toBeTruthy();
    expect(s.querySelector('.recharts-wrapper')).toBeNull();
    // ET05, ET10: con los filtros de la barra, «Últimos 30 días» por defecto.
    expect(llamadasA(nucleo, 'report_get_compliance')).toEqual([
      { filter: { range: { kind: 'custom', start: '2026-10-16', end: '2026-11-14' }, label_ids: [] } },
    ]);
  });

  it('HE-13-HU03-CA02 · Tarjeta completada después de su fecha límite', async () => {
    const { s } = await verTasa((n) => n.responder('report_get_compliance', tasa(50, 1, 2)));
    expect(within(s).getByText('50,0 %')).toBeTruthy();
    expect(within(s).getByText('1 de 2 tarjetas completadas a tiempo')).toBeTruthy();
  });

  it('HE-13-HU03-CA03 · Cambiar el rango de fechas', async () => {
    const { nucleo } = await verTasa();
    nucleo.responder('report_resolve_range', () => ({
      ok: true,
      value: { start: '2026-11-08', end: '2026-11-14', days: 7, grouping: 'day', clipped_start: null },
    }));
    nucleo.responder('report_get_compliance', tasa(100, 2, 2));
    fireEvent.change(screen.getByRole('combobox', { name: 'Rango de fechas' }), {
      target: { value: 'last_7' },
    });
    expect(await screen.findByText('100,0 %')).toBeTruthy();
    expect(screen.getByText('2 de 2 tarjetas completadas a tiempo')).toBeTruthy();
    expect(llamadasA(nucleo, 'report_get_compliance')[1]).toEqual({
      filter: { range: { kind: 'custom', start: '2026-11-08', end: '2026-11-14' }, label_ids: [] },
    });
  });

  it('HE-13-HU03-CA04 · Cambiar las etiquetas del filtro', async () => {
    // ET09: con total 1, en singular (D-163). El filtro Etiquetas es de HE-13-HU05 (ver DUDAS).
    const { s } = await verTasa((n) => n.responder('report_get_compliance', tasa(100, 1, 1)));
    expect(within(s).getByText('100,0 %')).toBeTruthy();
    expect(within(s).getByText('1 de 1 tarjeta completada a tiempo')).toBeTruthy();
  });

  it('HE-13-HU03-CA05 · Sin tarjetas en el rango de fechas', async () => {
    const { s } = await verTasa((n) => n.responder('report_get_compliance', tasa(null, 0, 0)));
    expect(within(s).getByText('No hay datos para este rango de fechas y estos filtros.')).toBeTruthy();
    expect(within(s).queryByText(/%/)).toBeNull();
  });

  it('HE-13-HU03-CA06 · Ninguna tarjeta completada a tiempo', async () => {
    // ET08: regla de 0, el valor y no el mensaje de vacío.
    const { s } = await verTasa((n) => n.responder('report_get_compliance', tasa(0, 0, 3)));
    expect(within(s).getByText('0,0 %')).toBeTruthy();
    expect(within(s).getByText('0 de 3 tarjetas completadas a tiempo')).toBeTruthy();
  });

  it('HE-13-HU03-CA07 · Tarjetas pendientes en el rango', async () => {
    // ET06: el Núcleo no cuenta la pendiente (ca_he_13_hu03_ca07); la vista muestra su total.
    const { s } = await verTasa((n) => n.responder('report_get_compliance', tasa(100, 2, 2)));
    expect(within(s).getByText('100,0 %')).toBeTruthy();
    expect(within(s).getByText('2 de 2 tarjetas completadas a tiempo')).toBeTruthy();
  });

  it('HE-13-HU03-CA08 · Una sola tarjeta con fecha límite en el rango', async () => {
    const { s } = await verTasa((n) => n.responder('report_get_compliance', tasa(100, 1, 1)));
    expect(within(s).getByText('100,0 %')).toBeTruthy();
    expect(within(s).getByText('1 de 1 tarjeta completada a tiempo')).toBeTruthy();
  });
});
