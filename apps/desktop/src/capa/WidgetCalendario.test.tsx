// HE-06-HU07 · Widget Calendario en la capa (C-02). Hoy es el sábado 14/11/2026 (fecha del computador).
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LayerInitialState } from '@/types';
import { crearNucleo } from '../screens/kanban/pruebas';
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
    { widget_id: 'calendario', type: 'calendar', x: 40, y: 220, width: 320, height: 300, is_active: true },
  ],
  monitors: [],
  wallpaper_state: 'ok',
  wallpaper_fit: [],
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 14, 9, 0));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function pintar() {
  const n = crearNucleo();
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
  const widget = await screen.findByRole('region', { name: 'Calendario' });
  await act(async () => {});
  return { ...n, widget };
}

/** Las semanas del mes como texto: «·» en los días que no son del mes. */
function semanas(widget: HTMLElement) {
  return within(widget)
    .getAllByRole('row')
    .slice(1)
    .map((fila) =>
      within(fila)
        .getAllByRole('cell')
        .map((c) => c.textContent || '·')
        .join(' '),
    );
}

describe('HE-06-HU07 · Mes actual en el widget Calendario', () => {
  it('HE-06-HU07-CA01 · Mes actual en el widget Calendario', async () => {
    const { nucleo, widget } = await pintar();
    // ET01: el mes actual, de lunes a domingo…
    const mes = within(widget).getByRole('table', { name: 'Noviembre 2026' });
    expect(
      within(mes)
        .getAllByRole('columnheader')
        .map((d) => d.getAttribute('abbr')),
    ).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    expect(semanas(widget)).toEqual([
      '· · · · · · 1',
      '2 3 4 5 6 7 8',
      '9 10 11 12 13 14 15',
      '16 17 18 19 20 21 22',
      '23 24 25 26 27 28 29',
      '30 · · · · · ·',
    ]);
    // …con el día actual resaltado, solo ese.
    const hoy = within(widget).getByRole('cell', { current: 'date' });
    expect(hoy.textContent).toBe('14');
    expect(hoy.className).toBe('wg-calendario-widget__hoy');
    expect(widget.querySelectorAll('.wg-calendario-widget__hoy')).toHaveLength(1);
    // No es la vista Calendario del planificador: sin «Mes anterior», «Mes siguiente», «Hoy», «Mes» ni «Semana».
    for (const opcion of ['Mes anterior', 'Mes siguiente', 'Hoy', 'Mes', 'Semana']) {
      expect(within(widget).queryByRole('button', { name: opcion })).toBeNull();
    }

    // Al pasar al 1 de diciembre (EV-22), el widget muestra el mes nuevo con su día resaltado.
    vi.setSystemTime(new Date(2026, 11, 1, 0, 0));
    nucleo.emitir('day_changed', { date: '2026-12-01' });
    await act(async () => {});
    expect(within(widget).getByRole('table', { name: 'Diciembre 2026' })).toBeTruthy();
    expect(within(widget).getByRole('cell', { current: 'date' }).textContent).toBe('1');
  });
});
