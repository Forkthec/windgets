// docs/rediseno.md RD-87: elegir una paleta que el catálogo desactivó lo dice en la sección «Paletas» y el catálogo
// se vuelve a leer. La regla del Núcleo: rd_87_* en servicio_de_personalizacion_y_configuracion.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirPantalla, fijarHoy, llamadasA, screen } from '@/screens/kanban/pruebas';
import { Personalization } from '@/screens/personalization/Personalization';
import type { ThemeDraftView } from '@/types';

const TEXTO = 'Esta paleta ya no está disponible. Elige otra.';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const BORRADOR: ThemeDraftView = {
  theme_id: 't1',
  name: 'Mi tema',
  content: {
    template_id: 'default',
    background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
    colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
    palette_id: null,
    font: { id: 'nunito', size: 'medium' },
  },
  dirty: false,
  applied_unsaved: false,
  legibility: { ok: true, items: [], suggestion: null },
};

const paleta = (id: string, name: string) => ({
  id,
  name,
  thumbnail_url: '',
  is_cached: true,
  color_primary: '#0B3954',
  color_secondary: '#087E8B',
  color_text: '#F5F5F5',
});

describe('RD-87 · Una paleta que el catálogo desactivó', () => {
  it('RD-87 · lo dice en «Paletas», recarga el catálogo y el mensaje se quita al elegir otra', async () => {
    let desactivada = false;
    const nucleo = await abrirPantalla(
      'personalization',
      'Personalización del wallpaper',
      Personalization,
      [],
      (n) => {
        n.responder('theme_draft_open', () => ({ ok: true, value: BORRADOR }));
        n.responder('catalog_list', ({ kind }) => ({
          ok: true,
          value:
            kind === 'palette'
              ? [paleta('bosque', 'Bosque'), ...(desactivada ? [] : [paleta('oceano', 'Océano')])]
              : [],
        }));
        n.responder('theme_draft_update', ({ patch }) => {
          if (patch.palette_id !== 'oceano') return { ok: true, value: BORRADOR };
          desactivada = true;
          return { ok: false, error: { code: 'palette.not_found', message: TEXTO } };
        });
      },
    );
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Paletas' }));
    });
    const seccion = screen.getByRole('region', { name: 'Paletas' });
    await act(async () => {
      fireEvent.click(await within(seccion).findByRole('button', { name: 'Océano' }));
    });
    expect(within(seccion).getByRole('alert').textContent).toBe(TEXTO);
    await vi.waitFor(() => expect(within(seccion).queryByRole('button', { name: 'Océano' })).toBeNull());
    expect(
      llamadasA(nucleo, 'catalog_list').filter((p) => JSON.stringify(p).includes('palette')),
    ).toHaveLength(2);
    await act(async () => {
      fireEvent.click(within(seccion).getByRole('button', { name: 'Bosque' }));
    });
    expect(within(seccion).queryByText(TEXTO)).toBeNull();
  });
});
