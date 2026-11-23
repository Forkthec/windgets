// HE-04-HU06 · El widget Noticias en la capa (C-02). El Núcleo trae el dato de la caché (IPC-WID-07) y avisa con EV-20.
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Headline, LayerInitialState, WidgetData } from '@/types';
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
    { widget_id: 'w-noticias', type: 'news', x: 1400, y: 0, width: 480, height: 360, is_active: true },
  ],
  monitors: [],
  wallpaper_state: 'ok',
  wallpaper_fit: [],
};

const titulares = (prefijo: string): Headline[] =>
  [5, 4, 3, 2, 1].map((i) => ({
    title: `${prefijo} ${i}`,
    source: `Medio ${i}`,
    url: `https://example.com/${prefijo}/${i}`,
    published_at: `2026-11-14T1${i}:00:00.000Z`,
  }));

async function pintar(datos: WidgetData) {
  const n = crearNucleo();
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  n.nucleo.responder('widget_get_data', () => ({ ok: true, value: datos }));
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
  const widget = await screen.findByRole('region', { name: 'Noticias' });
  await act(async () => {});
  return { ...n, widget };
}

const filas = (w: HTMLElement) =>
  within(within(w).getByRole('list', { name: 'Titulares' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

describe('HE-04-HU06 · Widget Noticias', () => {
  it('HE-04-HU06-CA01 · muestra los 5 titulares más recientes con su fuente', async () => {
    const { widget } = await pintar({
      status: 'ok',
      payload: { headlines: titulares('Titular') },
      fetched_at: null,
    });
    // ET02
    expect(filas(widget)).toEqual([
      'Titular 5 Medio 5',
      'Titular 4 Medio 4',
      'Titular 3 Medio 3',
      'Titular 2 Medio 2',
      'Titular 1 Medio 1',
    ]);
  });

  it('HE-04-HU06-CA02 · Actualización periódica', async () => {
    const { widget, nucleo } = await pintar({
      status: 'ok',
      payload: { headlines: titulares('Viejo') },
      fetched_at: null,
    });
    nucleo.emitir('widget_data_changed', {
      widget_id: 'w-noticias',
      status: 'ok',
      payload: { headlines: titulares('Nuevo') },
    });
    expect(filas(widget)[0]).toBe('Nuevo 5 Medio 5');
  });

  it('HE-04-HU06-CA03 · Servicio de noticias no disponible', async () => {
    const { widget } = await pintar({ status: 'error', payload: null, fetched_at: null });
    expect(
      within(widget).getByText('No pudimos cargar las noticias. Intenta de nuevo más tarde.'),
    ).toBeTruthy();
  });

  it('HE-04-HU06-CA04 · Widget Noticias sin conexión', async () => {
    const { widget, nucleo } = await pintar({
      status: 'ok',
      payload: { headlines: titulares('Titular') },
      fetched_at: null,
    });
    nucleo.emitir('widget_data_changed', { widget_id: 'w-noticias', status: 'offline' });
    expect(within(widget).getByText('Sin conexión. El widget se actualizará al reconectarte.')).toBeTruthy();
    nucleo.emitir('widget_data_changed', {
      widget_id: 'w-noticias',
      status: 'ok',
      payload: { headlines: titulares('Nuevo') },
    });
    expect(within(widget).queryByRole('status')).toBeNull();
  });
});

describe('HE-06-HU10 · Abrir una noticia en el navegador', () => {
  it('HE-06-HU10-CA01 · Abrir una noticia', async () => {
    const { widget, nucleo } = await pintar({
      status: 'ok',
      payload: { headlines: titulares('Titular') },
      fetched_at: null,
    });
    // ET02: el widget es interactivo y cada titular se selecciona; ET01: el Núcleo lo abre en el navegador.
    expect(widget.getAttribute('data-interactivo')).toBe('true');
    within(widget)
      .getByRole('button', { name: /Titular 3/ })
      .click();
    expect(nucleo.llamadas.filter((l) => l.comando === 'system_open_url').map((l) => l.params)).toEqual([
      { url: 'https://example.com/Titular/3' },
    ]);
  });
});
