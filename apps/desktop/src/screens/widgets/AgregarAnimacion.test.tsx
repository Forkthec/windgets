// HE-04-HU09 · Agregar el widget Animación (subpantalla y pantalla Widgets). La regla de pausa tiene sus pruebas
// ca_he_04_hu09_ca04 y ca05 en integracion_con_el_sistema/carga.rs; el widget en la capa, en WidgetAnimacion.test.tsx.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CatalogItem, WidgetItem } from '@/types';
import { abrirPantalla, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Widgets } from './Widgets';

const OLAS = { id: 'olas', name: 'Olas', thumbnail_url: 'olas-t.jpg', format: 'webm' } as CatalogItem;

async function abrir(lista: WidgetItem[] = [], preparar?: (n: NucleoDelPlanificador) => void) {
  return abrirPantalla('widgets', 'Widgets', Widgets, [], (n) => {
    n.responder('widget_list', () => ({ ok: true, value: lista }));
    n.responder('widget_catalog_get', () => ({
      ok: true,
      value: {
        external: [],
        local: [
          {
            type: 'animation',
            name: 'Animación',
            description: 'Algo que se mueve.',
            enabled: true,
            disabled_reason: null,
          },
        ],
      },
    }));
    n.responder('catalog_list', () => ({ ok: true, value: [OLAS] }));
    n.responder('asset_resolve', () => ({ ok: true, value: { url: 'olas.webm', state: 'ready' } }));
    n.responder('widget_add', () => ({ ok: true, value: {} as never }));
    preparar?.(n);
  });
}

async function subpantalla() {
  fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
  const enCatalogo = await screen.findByRole('main', { name: 'Agregar widget' });
  fireEvent.click(await within(enCatalogo).findByRole('button', { name: /Animación/ }));
  return screen.findByRole('main', { name: 'Animación' });
}

const animacion = (pausada: boolean): WidgetItem => ({
  widget_id: 'w-a',
  type: 'animation',
  display_name: 'Animación',
  distinguishing_value: null,
  is_default: false,
  is_active: true,
  can_configure: false,
  can_delete: true,
  paused_by_load: pausada,
  config: { animation_id: 'olas' },
});

describe('HE-04-HU09 · Agregar el widget Animación', () => {
  it('HE-04-HU09-CA01 · Agregar la animación', async () => {
    const n = await abrir();
    const sub = await subpantalla();
    // ET01: miga de pan y el catálogo con miniatura y nombre.
    expect(within(sub).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Widgets>Agregar widget>Animación',
    );
    const agregar = within(sub).getByRole('button', { name: 'Agregar' }) as HTMLButtonElement;
    expect(agregar.disabled).toBe(true);
    const catalogo = await within(sub).findByRole('list', { name: 'Catálogo de animaciones' });
    fireEvent.click(within(catalogo).getByRole('button', { name: 'Olas' }));
    fireEvent.click(agregar);
    expect(await screen.findByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(llamadasA(n, 'widget_add')).toEqual([{ type: 'animation', config: { animation_id: 'olas' } }]);
  });

  it('HE-04-HU09-CA02 · Reproducir la animación antes de agregarla', async () => {
    await abrir();
    const sub = await subpantalla();
    const catalogo = await within(sub).findByRole('list', { name: 'Catálogo de animaciones' });
    fireEvent.click(within(catalogo).getByRole('button', { name: 'Olas' }));
    const vista = await within(sub).findByRole('region', { name: 'Vista previa de la animación' });
    await waitFor(() => expect(vista.querySelector('video')?.getAttribute('src')).toContain('olas.webm'));
    expect(vista.querySelector('video')?.autoplay).toBe(true);
  });

  it('HE-04-HU09-CA03 · Regresar sin agregar', async () => {
    const n = await abrir();
    const sub = await subpantalla();
    fireEvent.click(within(sub).getByRole('button', { name: 'Regresar' }));
    expect(await screen.findByRole('main', { name: 'Agregar widget' })).toBeTruthy();
    expect(llamadasA(n, 'widget_add')).toEqual([]);
  });

  it('HE-04-HU09-CA04 · la pantalla Widgets muestra el texto de pausa junto al widget', async () => {
    await abrir([animacion(true)]);
    expect(await screen.findByText('En pausa por alto consumo de recursos.')).toBeTruthy();
  });

  it('HE-04-HU09-CA05 · al reanudar se quita el texto de pausa', async () => {
    const n = await abrir([animacion(true)]);
    await screen.findByText('En pausa por alto consumo de recursos.');
    // El Núcleo ya marca la animación sin pausa en la lista (paused_by_load).
    n.responder('widget_list', () => ({ ok: true, value: [animacion(false)] }));
    n.emitir('animation_pause_changed', { widget_ids: ['w-a'], paused: false });
    await waitFor(() => expect(screen.queryByText('En pausa por alto consumo de recursos.')).toBeNull());
  });
});
