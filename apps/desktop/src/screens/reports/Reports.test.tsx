// HE-13-HU02 · Consultar una gráfica de las tarjetas completadas en el rango de fechas. Una prueba por CA en la
// vista; los cálculos del Núcleo tienen su prueba ca_he_13_hu02_* en servicio_del_planificador.
import { act, fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompletedReport, Result } from '@/types';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Reports } from './Reports';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

async function abrir(preparar?: (nucleo: NucleoDelPlanificador) => void) {
  return abrirPantalla('reports', 'Reportes', Reports, [], preparar);
}

function seccion(titulo: string) {
  return screen.getByRole('region', { name: titulo });
}

function grafica() {
  return seccion('Tarjetas completadas').querySelector('.recharts-wrapper');
}

function completadas(reporte: CompletedReport): () => Result<CompletedReport> {
  return () => ({ ok: true, value: reporte });
}

describe('HE-13-HU02 · Gráfica de tarjetas completadas', () => {
  it('HE-13-HU02-CA01 · Pantalla Reportes con los valores por defecto', async () => {
    const nucleo = await abrir();
    // ET01, ET02: arriba la barra de filtros con «Últimos 30 días»; debajo la sección Tarjetas completadas.
    const selector = screen.getByRole('combobox', { name: 'Rango de fechas' }) as HTMLSelectElement;
    expect(selector.selectedOptions[0]?.textContent).toBe('Últimos 30 días');
    // ET03: gráfica de líneas.
    await waitFor(() => expect(grafica()).toBeTruthy());
    expect(llamadasA(nucleo, 'report_get_completed')).toEqual([
      { filter: { range: { kind: 'custom', start: '2026-10-16', end: '2026-11-14' }, label_ids: [] } },
    ]);
  });

  it('HE-13-HU02-CA02 · Agrupación automática por semana', async () => {
    // ET07: la vista dibuja los períodos que calcula el Núcleo (ca_he_13_hu02_ca02).
    await abrir((n) =>
      n.responder(
        'report_get_completed',
        completadas({
          grouping: 'week',
          points: [
            { period_start: '2026-05-01', period_end: '2026-05-03', count: 0 },
            { period_start: '2026-05-04', period_end: '2026-05-10', count: 1 },
          ],
          is_empty: false,
        }),
      ),
    );
    await waitFor(() => expect(grafica()).toBeTruthy());
  });

  it('HE-13-HU02-CA03 · Agrupación automática por mes', async () => {
    await abrir((n) =>
      n.responder(
        'report_get_completed',
        completadas({
          grouping: 'month',
          points: [{ period_start: '2026-03-01', period_end: '2026-03-31', count: 1 }],
          is_empty: false,
        }),
      ),
    );
    await waitFor(() => expect(grafica()).toBeTruthy());
  });

  it('HE-13-HU02-CA04 · Rango sin tarjetas completadas', async () => {
    // ET09: con tarjetas que evaluar, la gráfica con 0 y sin el mensaje de sección sin datos.
    await abrir((n) =>
      n.responder(
        'report_get_completed',
        completadas({
          grouping: 'day',
          points: [{ period_start: '2026-11-14', period_end: '2026-11-14', count: 0 }],
          is_empty: false,
        }),
      ),
    );
    await waitFor(() => expect(grafica()).toBeTruthy());
    expect(screen.queryByText('No hay datos para este rango de fechas y estos filtros.')).toBeNull();
  });

  it('HE-13-HU02-CA05 · Cuenta sin tarjetas', async () => {
    await abrir((n) =>
      n.responder('report_get_meta', () => ({
        ok: true,
        value: { has_cards: false, first_card_date: null, has_labels: false },
      })),
    );
    // ET12: barra de filtros deshabilitada y el mensaje en lugar de las secciones.
    expect(
      await screen.findByText('Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.'),
    ).toBeTruthy();
    const selector = screen.getByRole('combobox', { name: 'Rango de fechas' }) as HTMLSelectElement;
    expect(selector.disabled).toBe(true);
    expect(screen.queryByRole('region', { name: 'Tarjetas completadas' })).toBeNull();
  });

  it('HE-13-HU02-CA06 · Contar desde la primera tarjeta', async () => {
    await abrir((n) =>
      n.responder('report_resolve_range', () => ({
        ok: true,
        value: {
          start: '2026-10-16',
          end: '2026-11-14',
          days: 30,
          grouping: 'day',
          clipped_start: '2026-11-10',
        },
      })),
    );
    // ET14
    expect(
      await screen.findByText('Mostrando datos desde el 10/11/2026, cuando creaste tu primera tarjeta.'),
    ).toBeTruthy();
  });

  it('HE-13-HU02-CA07 · Sección sin datos en el rango', async () => {
    await abrir((n) =>
      n.responder('report_get_completed', completadas({ grouping: 'day', points: [], is_empty: true })),
    );
    // ET10, ET11: el título y el texto en lugar de la gráfica, sin 0.
    const s = await screen.findByRole('region', { name: 'Tarjetas completadas' });
    expect(
      await within(s).findByText('No hay datos para este rango de fechas y estos filtros.'),
    ).toBeTruthy();
    expect(within(s).getByRole('heading', { name: 'Tarjetas completadas' })).toBeTruthy();
    expect(grafica()).toBeNull();
  });

  it('HE-13-HU02-CA08 · Mostrar el reporte por secciones al abrir la pantalla', async () => {
    let soltar: () => void = () => {};
    await abrir((n) =>
      n.responder(
        'report_get_completed',
        () =>
          new Promise<Result<CompletedReport>>((resolver) => {
            soltar = () => resolver({ ok: true, value: { grouping: 'day', points: [], is_empty: false } });
          }) as unknown as Result<CompletedReport>,
      ),
    );
    // ET15: el título y la sección ocupada de inmediato; el esqueleto de carga, si el cálculo pasa de 200 ms
    // (ANIMACIONES.md A-32, docs/rediseno.md RD-110).
    const s = await screen.findByRole('region', { name: 'Tarjetas completadas' });
    expect(within(s).getByRole('heading', { name: 'Tarjetas completadas' })).toBeTruthy();
    expect(s.getAttribute('aria-busy')).toBe('true');
    expect(await within(s).findByRole('status', { name: 'Cargando' })).toBeTruthy();
    // ET16: se muestra apenas termina su cálculo.
    await act(async () => soltar());
    await waitFor(() => expect(within(s).queryByRole('status')).toBeNull());
  });

  it('HE-13-HU02-CA09 · Mostrar el reporte por secciones al cambiar un filtro', async () => {
    const nucleo = await abrir();
    await waitFor(() => expect(grafica()).toBeTruthy());
    nucleo.responder('report_resolve_range', () => ({
      ok: true,
      value: { start: '2026-11-08', end: '2026-11-14', days: 7, grouping: 'day', clipped_start: null },
    }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Rango de fechas' }), {
      target: { value: 'last_7' },
    });
    // ET15, ET16: cada cambio pide de nuevo el cálculo de la sección.
    await waitFor(() => expect(llamadasA(nucleo, 'report_get_completed')).toHaveLength(2));
    expect(llamadasA(nucleo, 'report_get_completed')[1]).toEqual({
      filter: { range: { kind: 'custom', start: '2026-11-08', end: '2026-11-14' }, label_ids: [] },
    });
  });

  it('HE-13-HU02-CA10 · Consultar los reportes sin conexión', async () => {
    // ET19: la vista no llama a la nube; el Núcleo calcula con la base local (ca_he_13_hu02_ca10).
    await abrir();
    await waitFor(() => expect(grafica()).toBeTruthy());
  });
});

describe('Rediseño · Reportes (P35)', () => {
  it('RD-56 · Los filtros en una fila y la tasa y los estados lado a lado', async () => {
    await abrir();
    const reportes = screen.getByRole('main', { name: 'Reportes' });
    const filtros = reportes.querySelector('.wg-reportes__filtros') as HTMLElement;
    expect(within(filtros).getByRole('group', { name: 'Rango de fechas' })).toBeTruthy();
    const tarjetas = reportes.querySelector('.wg-reportes__tarjetas');
    expect(tarjetas?.querySelectorAll(':scope > .wg-seccion').length ?? 0).toBeLessThanOrEqual(2);
  });
});
