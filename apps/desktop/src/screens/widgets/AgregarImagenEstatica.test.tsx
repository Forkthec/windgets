// HE-04-HU07 · Agregar el widget Imagen estática (subpantalla). El Núcleo tiene sus pruebas ca_he_04_hu07_* en
// pruebas_de_agregar_imagen.rs.
import { open } from '@tauri-apps/plugin-dialog';
import { fireEvent, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CatalogItem, ErrorCode } from '@/types';
import { abrirPantalla, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Widgets } from './Widgets';

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }));

const MAR: CatalogItem = { id: 'mar', name: 'Mar', thumbnail_url: 'mar-t.jpg' } as CatalogItem;
async function abrir(preparar?: (n: NucleoDelPlanificador) => void) {
  const n = await abrirPantalla('widgets', 'Widgets', Widgets, [], (n) => {
    n.responder('widget_list', () => ({ ok: true, value: [] }));
    n.responder('widget_catalog_get', () => ({
      ok: true,
      value: {
        external: [],
        local: [
          {
            type: 'static_image',
            name: 'Imagen estática',
            description: 'Una imagen.',
            enabled: true,
            disabled_reason: null,
          },
        ],
      },
    }));
    n.responder('catalog_list', () => ({ ok: true, value: [MAR] }));
    preparar?.(n);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
  const enCatalogo = await screen.findByRole('main', { name: 'Agregar widget' });
  fireEvent.click(await within(enCatalogo).findByRole('button', { name: /Imagen estática/ }));
  const sub = await screen.findByRole('main', { name: 'Imagen estática' });
  const agregar = within(sub).getByRole('button', { name: 'Agregar' }) as HTMLButtonElement;
  return { n, sub, agregar };
}

/** Al agregar, vuelve a la pantalla Widgets. */
const enWidgets = () => screen.findByRole('main', { name: 'Widgets' });

const rechazo = (code: ErrorCode, message: string) => () => ({
  ok: false as const,
  error: { code, message },
});

describe('HE-04-HU07 · Agregar el widget Imagen estática', () => {
  it('HE-04-HU07-CA01 · Agregar una imagen estática con una imagen propia', async () => {
    vi.mocked(open).mockResolvedValue('C:\\fotos\\foto.jpg');
    const { n, sub, agregar } = await abrir((n) => {
      n.responder('image_import', () => ({ ok: true, value: { uploaded_image_id: 'u1', preview_url: 'x' } }));
      n.responder('widget_add', () => ({ ok: true, value: {} as never }));
    });
    // ET01: miga de pan, las dos opciones y el texto de formatos.
    expect(within(sub).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Widgets>Agregar widget>Imagen estática',
    );
    expect(within(sub).getByText('JPG, JPEG o PNG. Máximo 20 MB.')).toBeTruthy();
    fireEvent.click(within(sub).getByRole('button', { name: 'Subir imagen' }));
    await waitFor(() => expect(agregar.disabled).toBe(false));
    expect(llamadasA(n, 'image_import')).toEqual([{ path: 'C:\\fotos\\foto.jpg', purpose: 'static_image' }]);
    fireEvent.click(agregar);
    await enWidgets();
    expect(llamadasA(n, 'widget_add')).toEqual([
      { type: 'static_image', config: { source: 'own', uploaded_image_id: 'u1' } },
    ]);
  });

  it('HE-04-HU07-CA02 · Agregar una imagen estática con una imagen del catálogo de imágenes', async () => {
    const { n, sub, agregar } = await abrir((n) =>
      n.responder('widget_add', () => ({ ok: true, value: {} as never })),
    );
    fireEvent.click(within(sub).getByRole('button', { name: 'Catálogo de imágenes' }));
    const lista = await within(sub).findByRole('list', { name: 'Catálogo de imágenes' });
    fireEvent.click(within(lista).getByRole('button', { name: /Mar/ }));
    fireEvent.click(agregar);
    await enWidgets();
    expect(llamadasA(n, 'widget_add')).toEqual([
      { type: 'static_image', config: { source: 'catalog', catalog_image_id: 'mar' } },
    ]);
  });

  it('HE-04-HU07-CA03 · Formato no permitido', async () => {
    vi.mocked(open).mockResolvedValue('C:\\mapa.gif');
    const texto = 'Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.';
    const { sub, agregar } = await abrir((n) =>
      n.responder('image_import', rechazo('image.format_not_allowed', texto)),
    );
    fireEvent.click(within(sub).getByRole('button', { name: 'Subir imagen' }));
    expect(await within(sub).findByText(texto)).toBeTruthy();
    expect(agregar.disabled).toBe(true);
  });

  it('HE-04-HU07-CA04 · Imagen de más de 20 MB', async () => {
    vi.mocked(open).mockResolvedValue('C:\\foto.png');
    const texto = 'La imagen supera el tamaño máximo de 20 MB.';
    const { sub, agregar } = await abrir((n) =>
      n.responder('image_import', rechazo('image.too_large', texto)),
    );
    fireEvent.click(within(sub).getByRole('button', { name: 'Subir imagen' }));
    expect(await within(sub).findByText(texto)).toBeTruthy();
    expect(agregar.disabled).toBe(true);
  });

  it('HE-04-HU07-CA05 · Sin imagen seleccionada', async () => {
    const { n, agregar } = await abrir();
    expect(agregar.disabled).toBe(true);
    expect(llamadasA(n, 'widget_add')).toEqual([]);
  });

  it('HE-04-HU07-CA06 · Regresar sin agregar', async () => {
    const { n, sub } = await abrir();
    fireEvent.click(within(sub).getByRole('button', { name: 'Regresar' }));
    // ET05: vuelve a la subpantalla Agregar widget.
    expect(await screen.findByRole('main', { name: 'Agregar widget' })).toBeTruthy();
    expect(llamadasA(n, 'widget_add')).toEqual([]);
  });

  it('HE-04-HU07-ET03 · Sin la miniatura en el computador, el catálogo muestra un espacio y no una imagen rota', async () => {
    const SIN_ARCHIVO = { id: 'monte', name: 'Monte', thumbnail_url: '' } as CatalogItem;
    const { sub } = await abrir((n) =>
      n.responder('catalog_list', () => ({ ok: true, value: [MAR, SIN_ARCHIVO] })),
    );
    fireEvent.click(within(sub).getByRole('button', { name: 'Catálogo de imágenes' }));
    const lista = await within(sub).findByRole('list', { name: 'Catálogo de imágenes' });
    const [mar, monte] = within(lista).getAllByRole('button');
    expect(mar?.querySelector('img')?.getAttribute('src')).toBe('mar-t.jpg');
    expect(monte?.querySelector('img')).toBeNull();
    expect(monte?.querySelector('.wg-subpantalla-widget__sin-miniatura')).not.toBeNull();
  });

  it('RD-60 · «Regresar» va al final de las acciones, después de «Agregar», y no en el encabezado', async () => {
    const { sub } = await abrir();
    const nombres = within(sub)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(nombres.slice(-4)).toEqual(['Subir imagen', 'Catálogo de imágenes', 'Agregar', 'Regresar']);
    expect(within(sub).getAllByRole('button', { name: 'Regresar' })).toHaveLength(1);
    fireEvent.click(within(sub).getByRole('button', { name: 'Regresar' }));
    expect(await screen.findByRole('main', { name: 'Agregar widget' })).toBeTruthy();
  });
});
