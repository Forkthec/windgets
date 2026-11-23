// HE-04-HU08-CA01 · El Carrusel de imágenes en la capa cambia de imagen cada `interval_seconds` segundos.
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LayerInitialState, WidgetItem } from '@/types';
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
    { widget_id: 'w-c', type: 'image_carousel', x: 0, y: 0, width: 480, height: 270, is_active: true },
  ],
  monitors: [],
  wallpaper_state: 'ok',
  wallpaper_fit: [],
};

afterEach(() => vi.useRealTimers());

describe('HE-04-HU08 · Widget Carrusel de imágenes', () => {
  it('HE-04-HU08-CA01 · muestra las imágenes una tras otra cada 5 segundos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const n = crearNucleo();
    n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
    n.nucleo.responder('asset_resolve', (p) => ({ ok: true, value: { url: `${p.id}.jpg`, state: 'ready' } }));
    n.nucleo.responder('widget_list', () => ({
      ok: true,
      value: [
        {
          widget_id: 'w-c',
          type: 'image_carousel',
          config: {
            items: ['mar', 'monte', 'rio'].map((id) => ({ source: 'catalog', catalog_image_id: id })),
            interval_seconds: 5,
          },
        } as unknown as WidgetItem,
      ],
    }));
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const widget = await screen.findByRole('region', { name: 'Carrusel de imágenes' });
    await act(async () => {});
    const imagen = () => widget.querySelector('img')?.getAttribute('src') ?? '';
    expect(imagen()).toContain('mar.jpg');
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(imagen()).toContain('monte.jpg');
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(imagen()).toContain('rio.jpg');
  });
});
