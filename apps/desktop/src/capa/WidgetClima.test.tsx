// HE-04-HU05 · El widget Clima en la capa (C-02). El Núcleo trae el dato de la caché (IPC-WID-07) y avisa con EV-20.
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LayerInitialState, WidgetData } from '@/types';
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
    { widget_id: 'w-clima', type: 'weather', x: 1400, y: 0, width: 320, height: 160, is_active: true },
  ],
  monitors: [],
  wallpaper_state: 'ok',
};

const POPAYAN = {
  city: 'Popayán',
  temperature_c: 21.4,
  condition_code: '2',
  condition_text: 'Parcialmente nublado',
};

async function pintar(datos: WidgetData) {
  const n = crearNucleo();
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  n.nucleo.responder('widget_get_data', () => ({ ok: true, value: datos }));
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
  const widget = await screen.findByRole('region', { name: 'Clima' });
  await act(async () => {});
  return { ...n, widget };
}

/** El texto del widget, párrafo por párrafo. */
const textos = (w: HTMLElement) => Array.from(w.querySelectorAll('p')).map((p) => p.textContent);

describe('HE-04-HU05 · Widget Clima', () => {
  it('HE-04-HU05-CA01 · muestra la ciudad, la temperatura en °C y la condición', async () => {
    const { widget } = await pintar({
      status: 'ok',
      payload: POPAYAN,
      fetched_at: '2026-11-14T12:00:00.000Z',
    });
    // ET02, ET14: en ese orden, con la temperatura redondeada.
    expect(textos(widget)).toEqual(['Popayán', '21 °C', 'Parcialmente nublado']);
  });

  it('HE-04-HU05-CA06 · Actualización periódica', async () => {
    const { widget, nucleo } = await pintar({ status: 'ok', payload: POPAYAN, fetched_at: null });
    nucleo.emitir('widget_data_changed', {
      widget_id: 'w-clima',
      status: 'ok',
      payload: { ...POPAYAN, temperature_c: 18.6, condition_code: '61', condition_text: 'Lluvia' },
    });
    expect(textos(widget)).toEqual(['Popayán', '19 °C', 'Lluvia']);
  });

  it('HE-04-HU05-CA07 · Servicio de clima no disponible', async () => {
    const { widget } = await pintar({ status: 'error', payload: null, fetched_at: null });
    expect(within(widget).getByText('No pudimos cargar el clima. Intenta de nuevo más tarde.')).toBeTruthy();
  });

  it('HE-04-HU05-CA08 · Widget Clima sin conexión', async () => {
    const { widget, nucleo } = await pintar({ status: 'ok', payload: POPAYAN, fetched_at: null });
    nucleo.emitir('widget_data_changed', { widget_id: 'w-clima', status: 'offline' });
    expect(within(widget).getByText('Sin conexión. El widget se actualizará al reconectarte.')).toBeTruthy();
    // Al volver la conexión el Núcleo consulta y el aviso se va.
    nucleo.emitir('widget_data_changed', { widget_id: 'w-clima', status: 'ok', payload: POPAYAN });
    expect(within(widget).queryByRole('status')).toBeNull();
  });
});

describe('HE-15-HU02 · Widgets externos offline', () => {
  it('HE-15-HU02-CA05 · Funciones que requieren conexión (widget externo)', async () => {
    const { widget } = await pintar({ status: 'offline', payload: POPAYAN, fetched_at: null });
    // ET08: el widget externo muestra el aviso de falta de conexión de su widget.
    expect(within(widget).getByText('Sin conexión. El widget se actualizará al reconectarte.')).toBeTruthy();
  });

  it('HE-15-HU02-CA06 · Widgets externos offline', async () => {
    const { widget, nucleo } = await pintar({ status: 'ok', payload: POPAYAN, fetched_at: null });
    // ET09: al perder la conexión, el aviso; ET10: al volver, el Núcleo consulta (toca_actualizar) y el widget se
    // actualiza solo con EV-20.
    nucleo.emitir('widget_data_changed', { widget_id: 'w-clima', status: 'offline' });
    expect(within(widget).getByText('Sin conexión. El widget se actualizará al reconectarte.')).toBeTruthy();
    nucleo.emitir('widget_data_changed', {
      widget_id: 'w-clima',
      status: 'ok',
      payload: { ...POPAYAN, temperature_c: 25, condition_text: 'Despejado' },
    });
    expect(within(widget).queryByRole('status')).toBeNull();
    expect(within(widget).getByText('25 °C')).toBeTruthy();
  });
});
