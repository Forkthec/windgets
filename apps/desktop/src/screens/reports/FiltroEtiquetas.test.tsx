// HE-13-HU05 · Filtrar los reportes por etiqueta. El Núcleo tiene sus pruebas ca_he_13_hu05_* en
// servicio_del_planificador/pruebas_de_reportes.rs.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Label, StatusBreakdown } from '@/types';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Reports } from './Reports';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const etiqueta = (id: string, name: string): Label => ({
  id,
  name,
  color_id: 'blue',
  color_hex: '#2196F3',
  card_count: 1,
});
const TRABAJO = etiqueta('l-trabajo', 'Trabajo');
const CASA = etiqueta('l-casa', 'Casa');
const ESTUDIO = etiqueta('l-estudio', 'Estudio');

const VACIO: StatusBreakdown = {
  overdue: 0,
  pending: 0,
  completed: 0,
  total: 0,
  percent_overdue: 0,
  percent_pending: 0,
  percent_completed: 0,
  is_empty: true,
} as StatusBreakdown;

async function abrir(etiquetas: Label[], preparar?: (n: NucleoDelPlanificador) => void) {
  const nucleo = await abrirPantalla('reports', 'Reportes', Reports, [], (n) => {
    n.etiquetas.splice(0, n.etiquetas.length, ...etiquetas);
    preparar?.(n);
  });
  const filtro = await screen.findByRole('group', { name: 'Etiquetas' });
  return { nucleo, filtro };
}

/** Los `label_ids` del último pedido de cada sección. */
function ultimosFiltros(nucleo: NucleoDelPlanificador) {
  return (['report_get_completed', 'report_get_compliance', 'report_get_status_breakdown'] as const).map(
    (c) => (llamadasA(nucleo, c).at(-1) as { filter: { label_ids: string[] } } | undefined)?.filter.label_ids,
  );
}

const boton = (filtro: HTMLElement, nombre: string) =>
  within(filtro).getByRole('button', { name: nombre }) as HTMLButtonElement;

describe('HE-13-HU05 · Filtrar los reportes por etiqueta', () => {
  it('HE-13-HU05-CA01 · Filtrar por una etiqueta', async () => {
    const { nucleo, filtro } = await abrir([CASA, TRABAJO]);
    // ET01: «Todas las etiquetas» y cada etiqueta; al abrir, «Todas las etiquetas».
    expect(boton(filtro, 'Todas las etiquetas').getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(ultimosFiltros(nucleo)).toEqual([[], [], []]));
    fireEvent.click(boton(filtro, 'Trabajo'));
    // ET04: las tres secciones con el mismo filtro.
    await waitFor(() =>
      expect(ultimosFiltros(nucleo)).toEqual([['l-trabajo'], ['l-trabajo'], ['l-trabajo']]),
    );
  });

  it('HE-13-HU05-CA02 · Filtrar por varias etiquetas', async () => {
    const { nucleo, filtro } = await abrir([CASA, ESTUDIO, TRABAJO]);
    fireEvent.click(boton(filtro, 'Trabajo'));
    fireEvent.click(boton(filtro, 'Casa'));
    await waitFor(() => expect(ultimosFiltros(nucleo)[0]).toEqual(['l-trabajo', 'l-casa']));
  });

  it('RD-96 · El filtro admite hasta 3 etiquetas', async () => {
    const OCIO = etiqueta('l-ocio', 'Ocio');
    const { nucleo, filtro } = await abrir([CASA, ESTUDIO, OCIO, TRABAJO]);
    const motivo = () => within(filtro).queryByText('Puedes elegir hasta 3 etiquetas.');
    for (const n of ['Casa', 'Estudio']) fireEvent.click(boton(filtro, n));
    expect(boton(filtro, 'Trabajo').disabled).toBe(false);
    expect(motivo()).toBeNull();
    fireEvent.click(boton(filtro, 'Ocio'));
    // Con 3, la 4.ª no se puede elegir y se ve el motivo; las elegidas y «Todas las etiquetas» siguen activas.
    expect(boton(filtro, 'Trabajo').disabled).toBe(true);
    expect(motivo()).toBeTruthy();
    for (const n of ['Todas las etiquetas', 'Casa', 'Estudio', 'Ocio']) {
      expect(boton(filtro, n).disabled).toBe(false);
    }
    fireEvent.click(boton(filtro, 'Trabajo'));
    const tres = ['l-casa', 'l-estudio', 'l-ocio'];
    await waitFor(() => expect(ultimosFiltros(nucleo)).toEqual([tres, tres, tres]));
    // Al quitar una, la 4.ª vuelve a estar disponible y el motivo desaparece.
    fireEvent.click(boton(filtro, 'Casa'));
    expect(boton(filtro, 'Trabajo').disabled).toBe(false);
    expect(motivo()).toBeNull();
  });

  it('HE-13-HU05-CA03 · Quitar el filtro de etiquetas', async () => {
    const { nucleo, filtro } = await abrir([CASA, TRABAJO]);
    fireEvent.click(boton(filtro, 'Trabajo'));
    await waitFor(() => expect(ultimosFiltros(nucleo)[0]).toEqual(['l-trabajo']));
    fireEvent.click(boton(filtro, 'Todas las etiquetas'));
    await waitFor(() => expect(ultimosFiltros(nucleo)).toEqual([[], [], []]));
  });

  it('HE-13-HU05-CA04 · Etiqueta sin tarjetas en el rango de fechas', async () => {
    const { filtro } = await abrir([ESTUDIO], (n) =>
      n.responder('report_get_status_breakdown', () => ({ ok: true, value: VACIO })),
    );
    fireEvent.click(boton(filtro, 'Estudio'));
    expect(
      (await screen.findAllByText('No hay datos para este rango de fechas y estos filtros.')).length,
    ).toBeGreaterThan(0);
  });

  it('HE-13-HU05-CA05 · Sin etiquetas creadas', async () => {
    const { filtro } = await abrir([]);
    // ET06: deshabilitado con el texto (RT-04).
    expect((filtro as HTMLFieldSetElement).disabled).toBe(true);
    expect(within(filtro).getByText('Aún no tienes etiquetas.')).toBeTruthy();
  });

  it('HE-13-HU05-CA06 · Etiqueta eliminada que era la única seleccionada', async () => {
    const { nucleo, filtro } = await abrir([CASA, TRABAJO]);
    fireEvent.click(boton(filtro, 'Trabajo'));
    await waitFor(() => expect(ultimosFiltros(nucleo)[0]).toEqual(['l-trabajo']));
    // Se elimina «Trabajo» en Etiquetas: llega EV-08.
    nucleo.etiquetas.splice(0, nucleo.etiquetas.length, CASA);
    nucleo.emitir('labels_changed', { ids: ['l-trabajo'], op: 'delete', origin: 'local' });
    // ET07, ET08: vuelve a «Todas las etiquetas» y recalcula con todas las tarjetas.
    await waitFor(() => expect(ultimosFiltros(nucleo)).toEqual([[], [], []]));
    expect(boton(filtro, 'Todas las etiquetas').getAttribute('aria-pressed')).toBe('true');
    expect(within(filtro).queryByRole('button', { name: 'Trabajo' })).toBeNull();
  });

  it('HE-13-HU05-CA07 · Etiqueta eliminada con otras etiquetas seleccionadas', async () => {
    const { nucleo, filtro } = await abrir([CASA, TRABAJO]);
    fireEvent.click(boton(filtro, 'Trabajo'));
    fireEvent.click(boton(filtro, 'Casa'));
    await waitFor(() => expect(ultimosFiltros(nucleo)[0]).toEqual(['l-trabajo', 'l-casa']));
    nucleo.etiquetas.splice(0, nucleo.etiquetas.length, CASA);
    nucleo.emitir('labels_changed', { ids: ['l-trabajo'], op: 'delete', origin: 'local' });
    await waitFor(() => expect(ultimosFiltros(nucleo)[0]).toEqual(['l-casa']));
    expect(boton(filtro, 'Casa').getAttribute('aria-pressed')).toBe('true');
  });
});
