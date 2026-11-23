// HE-04-HU09 · El widget Animación en la capa: reproduce de forma continua y se pausa con EV-21.
import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
  widgets: [{ widget_id: 'w-a', type: 'animation', x: 0, y: 0, width: 320, height: 180, is_active: true }],
  monitors: [],
  wallpaper_state: 'ok',
  wallpaper_fit: [],
};

async function pintar() {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  const n = crearNucleo();
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: 'olas.webm', state: 'ready' } }));
  n.nucleo.responder('widget_list', () => ({
    ok: true,
    value: [
      {
        widget_id: 'w-a',
        type: 'animation',
        paused_by_load: false,
        config: { animation_id: 'olas' },
      } as unknown as WidgetItem,
    ],
  }));
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
  const widget = await screen.findByRole('region', { name: 'Animación' });
  await act(async () => {});
  return { ...n, widget, play, pause };
}

describe('HE-04-HU09 · Widget Animación', () => {
  it('HE-04-HU09-CA01 · reproduce la animación de forma continua', async () => {
    const { widget } = await pintar();
    const video = widget.querySelector('video');
    expect(video?.getAttribute('src')).toContain('olas.webm');
    expect(video?.loop).toBe(true);
  });

  it('HE-04-HU09-CA04 · Pausar la animación por alto consumo de recursos', async () => {
    const { widget, nucleo, pause } = await pintar();
    nucleo.emitir('animation_pause_changed', { widget_ids: ['w-a'], paused: true });
    // ET07: el cuadro actual queda fijo y el ícono de pausa aparece en una esquina.
    expect(pause).toHaveBeenCalled();
    expect(within(widget).getByRole('img', { name: 'En pausa' })).toBeTruthy();
  });

  it('HE-04-HU09-CA05 · Reanudar la animación', async () => {
    const { widget, nucleo, play } = await pintar();
    nucleo.emitir('animation_pause_changed', { widget_ids: ['w-a'], paused: true });
    play.mockClear();
    nucleo.emitir('animation_pause_changed', { widget_ids: ['w-a'], paused: false });
    // Sigue desde el mismo cuadro: se vuelve a reproducir el mismo video, sin recargarlo.
    expect(play).toHaveBeenCalled();
    expect(within(widget).queryByRole('img', { name: 'En pausa' })).toBeNull();
  });
});
