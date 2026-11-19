// HE-04-HU10 · El widget Texto en la capa usa la tipografía y el color del texto del tema (D-041).
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  widgets: [{ widget_id: 'w-t', type: 'text', x: 0, y: 0, width: 320, height: 160, is_active: true }],
  monitors: [],
  wallpaper_state: 'ok',
};

describe('HE-04-HU10 · Widget Texto', () => {
  async function pintar() {
    const n = crearNucleo();
    n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
    n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
    n.nucleo.responder('widget_list', () => ({
      ok: true,
      value: [
        {
          widget_id: 'w-t',
          type: 'text',
          config: { text: 'Estudiar redes a las 6' },
        } as unknown as WidgetItem,
      ],
    }));
    render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
    const widget = await screen.findByRole('region', { name: 'Texto' });
    await act(async () => {});
    return widget;
  }

  it('HE-04-HU10-CA01 · muestra el texto sin fuente, tamaño ni color propios', async () => {
    const widget = await pintar();
    const p = widget.querySelector('.wg-widget-texto') as HTMLElement;
    expect(p.textContent).toBe('Estudiar redes a las 6');
    // ET04: hereda la tipografía y el color del tema que la capa aplica a todos los widgets.
    expect(p.style.fontFamily).toBe('');
    expect(p.style.fontSize).toBe('');
    expect(p.style.color).toBe('');
  });

  it('HE-04-HU10-CA04 · Tipografía del widget Texto', async () => {
    // Al cambiar la tipografía del tema, el widget no tiene una propia que la tape: hereda la nueva.
    const widget = await pintar();
    const p = widget.querySelector('.wg-widget-texto') as HTMLElement;
    expect(p.getAttribute('style') ?? '').not.toMatch(/font-(family|size)/);
  });
});
