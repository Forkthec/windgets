// HE-04-HU08 · Agregar el widget Carrusel de imágenes (subpantalla). El Núcleo tiene sus pruebas ca_he_04_hu08_* en
// pruebas_de_agregar_imagen.rs; el cambio de imagen en la capa, en WidgetCarrusel.test.tsx.
import { open } from '@tauri-apps/plugin-dialog';
import { fireEvent, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CatalogItem, ErrorCode } from '@/types';
import { abrirPantalla, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Widgets } from './Widgets';

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }));

const IMAGENES: CatalogItem[] = ['Mar', 'Monte', 'Río'].map(
  (name) => ({ id: name.toLowerCase(), name, thumbnail_url: `${name}.jpg` }) as CatalogItem,
);

async function abrir(preparar?: (n: NucleoDelPlanificador) => void) {
  const n = await abrirPantalla('widgets', 'Widgets', Widgets, [], (n) => {
    n.responder('widget_list', () => ({ ok: true, value: [] }));
    n.responder('widget_catalog_get', () => ({
      ok: true,
      value: {
        external: [],
        local: [
          {
            type: 'image_carousel',
            name: 'Carrusel de imágenes',
            description: 'Varias imágenes.',
            enabled: true,
            disabled_reason: null,
          },
        ],
      },
    }));
    n.responder('catalog_list', () => ({ ok: true, value: IMAGENES }));
    n.responder('widget_add', () => ({ ok: true, value: {} as never }));
    preparar?.(n);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Agregar widget' }));
  const enCatalogo = await screen.findByRole('main', { name: 'Agregar widget' });
  fireEvent.click(await within(enCatalogo).findByRole('button', { name: /Carrusel de imágenes/ }));
  const sub = await screen.findByRole('main', { name: 'Carrusel de imágenes' });
  const boton = (nombre: string) => within(sub).getByRole('button', { name: nombre }) as HTMLButtonElement;
  return { n, sub, boton };
}

/** Elige del catálogo las imágenes indicadas, en ese orden. */
async function delCatalogo(sub: HTMLElement, nombres: string[]) {
  fireEvent.click(within(sub).getByRole('button', { name: 'Catálogo de imágenes' }));
  const lista = await within(sub).findByRole('list', { name: 'Catálogo de imágenes' });
  for (const nombre of nombres) fireEvent.click(within(lista).getByRole('button', { name: nombre }));
}

const intervalo = (sub: HTMLElement) =>
  within(sub).getByLabelText('Intervalo (segundos)') as HTMLInputElement;
const elegidas = (sub: HTMLElement) =>
  within(within(sub).getByRole('list', { name: 'Imágenes elegidas' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent);

describe('HE-04-HU08 · Agregar el widget Carrusel de imágenes', () => {
  it('HE-04-HU08-CA01 · Agregar el carrusel de imágenes', async () => {
    const { n, sub, boton } = await abrir();
    // ET01: miga de pan, contador, intervalo de 5 por defecto.
    expect(within(sub).getByRole('navigation', { name: 'Miga de pan' }).textContent).toBe(
      'Widgets>Agregar widget>Carrusel de imágenes',
    );
    expect(within(sub).getByText('0 de 10')).toBeTruthy();
    expect(intervalo(sub).value).toBe('5');
    await delCatalogo(sub, ['Mar', 'Monte', 'Río']);
    expect(within(sub).getByText('3 de 10')).toBeTruthy();
    fireEvent.click(boton('Agregar'));
    expect(await screen.findByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(llamadasA(n, 'widget_add')).toEqual([
      {
        type: 'image_carousel',
        config: {
          items: ['mar', 'monte', 'río'].map((id) => ({ source: 'catalog', catalog_image_id: id })),
          interval_seconds: 5,
        },
      },
    ]);
  });

  it('HE-04-HU08-CA02 · Combinar imágenes propias y del catálogo de imágenes', async () => {
    vi.mocked(open).mockResolvedValue(['C:\\fotos\\yo.jpg']);
    const { n, sub, boton } = await abrir((n) =>
      n.responder('image_import', () => ({ ok: true, value: { uploaded_image_id: 'u1', preview_url: 'x' } })),
    );
    fireEvent.click(boton('Subir imagen'));
    await waitFor(() => expect(elegidas(sub)).toEqual(['yo.jpg']));
    await delCatalogo(sub, ['Mar', 'Monte']);
    expect(elegidas(sub)).toEqual(['yo.jpg', 'Mar', 'Monte']);
    fireEvent.click(boton('Agregar'));
    await screen.findByRole('main', { name: 'Widgets' });
    expect(llamadasA(n, 'widget_add')[0]).toMatchObject({
      config: {
        items: [
          { source: 'own', uploaded_image_id: 'u1' },
          { source: 'catalog', catalog_image_id: 'mar' },
          { source: 'catalog', catalog_image_id: 'monte' },
        ],
      },
    });
  });

  it('HE-04-HU08-CA03 · Menos de 2 imágenes', async () => {
    const { sub, boton } = await abrir();
    await delCatalogo(sub, ['Mar']);
    expect(boton('Agregar').disabled).toBe(true);
    expect(within(sub).getByText('Selecciona al menos 2 imágenes para el carrusel.')).toBeTruthy();
  });

  it('HE-04-HU08-CA04 · Límite fijo de 10 imágenes', async () => {
    const { sub, boton } = await abrir();
    await delCatalogo(sub, Array<string>(10).fill('Mar'));
    expect(within(sub).getByText('10 de 10')).toBeTruthy();
    // ET06: las dos opciones deshabilitadas con el texto.
    expect(boton('Subir imagen').disabled).toBe(true);
    expect(boton('Catálogo de imágenes').disabled).toBe(true);
    expect(within(sub).getAllByText('Puedes agregar máximo 10 imágenes al carrusel.').length).toBeGreaterThan(
      0,
    );
  });

  it('HE-04-HU08-CA04 · varias a la vez que superan el límite: solo entran las que caben', async () => {
    vi.mocked(open).mockResolvedValue(['a.jpg', 'b.jpg', 'c.jpg']);
    const { n, sub, boton } = await abrir((n) =>
      n.responder('image_import', () => ({ ok: true, value: { uploaded_image_id: 'u', preview_url: 'x' } })),
    );
    await delCatalogo(sub, Array<string>(9).fill('Mar'));
    fireEvent.click(boton('Subir imagen'));
    await waitFor(() => expect(within(sub).getByText('10 de 10')).toBeTruthy());
    expect(llamadasA(n, 'image_import')).toHaveLength(1);
  });

  for (const [ca, nombre, code, texto] of [
    [
      'HE-04-HU08-CA05 · Imagen con formato no permitido',
      'mapa.gif',
      'image.format_not_allowed',
      'Formato no permitido. Selecciona imágenes JPG, JPEG o PNG.',
    ],
    [
      'HE-04-HU08-CA06 · Imagen de más de 20 MB',
      'foto.png',
      'image.too_large',
      'La imagen supera el tamaño máximo de 20 MB.',
    ],
  ] as const) {
    it(ca, async () => {
      vi.mocked(open).mockResolvedValue([`C:\\${nombre}`]);
      const { sub, boton } = await abrir((n) =>
        n.responder('image_import', () => ({
          ok: false as const,
          error: { code: code as ErrorCode, message: texto },
        })),
      );
      fireEvent.click(boton('Subir imagen'));
      expect(await within(sub).findByText(texto)).toBeTruthy();
      expect(elegidas(sub)).toEqual([]);
    });
  }

  it('HE-04-HU08-CA07 · Intervalo fuera de rango', async () => {
    const { n, sub, boton } = await abrir();
    await delCatalogo(sub, ['Mar', 'Monte', 'Río']);
    for (const valor of ['2', '61']) {
      fireEvent.change(intervalo(sub), { target: { value: valor } });
      fireEvent.click(boton('Agregar'));
      expect(await within(sub).findByText('El intervalo debe estar entre 3 y 60 segundos.')).toBeTruthy();
    }
    expect(llamadasA(n, 'widget_add')).toEqual([]);
  });

  it('HE-04-HU08-CA08 · Intervalo vacío', async () => {
    const { n, sub, boton } = await abrir();
    await delCatalogo(sub, ['Mar', 'Monte', 'Río']);
    fireEvent.change(intervalo(sub), { target: { value: '' } });
    fireEvent.click(boton('Agregar'));
    expect(await within(sub).findByText('Este campo es obligatorio.')).toBeTruthy();
    expect(llamadasA(n, 'widget_add')).toEqual([]);
  });
});

describe('RD-91 · Todos los errores del Carrusel a la vez', () => {
  const FUERA = 'El intervalo debe estar entre 3 y 60 segundos.';
  const POCAS = 'Selecciona al menos 2 imágenes para el carrusel.';

  it('RD-91 · pocas imágenes e intervalo fuera de rango se ven a la vez al salir del campo', async () => {
    const { n, sub, boton } = await abrir();
    await delCatalogo(sub, ['Mar']);
    fireEvent.focus(intervalo(sub));
    fireEvent.change(intervalo(sub), { target: { value: '2' } });
    // Mientras se escribe no aparece el mensaje.
    expect(within(sub).queryByText(FUERA)).toBeNull();
    fireEvent.blur(intervalo(sub));
    expect(within(sub).getByText(FUERA)).toBeTruthy();
    expect(within(sub).getByText(POCAS)).toBeTruthy();
    expect(boton('Agregar').disabled).toBe(true);
    expect(llamadasA(n, 'widget_add')).toEqual([]);
  });

  it('RD-91 · al salir del campo vacío dice que es obligatorio; al corregirlo se quita', async () => {
    const { sub } = await abrir();
    fireEvent.change(intervalo(sub), { target: { value: ' ' } });
    fireEvent.blur(intervalo(sub));
    expect(within(sub).getByText('Este campo es obligatorio.')).toBeTruthy();
    fireEvent.change(intervalo(sub), { target: { value: '10' } });
    fireEvent.blur(intervalo(sub));
    expect(sub.querySelectorAll('.wg-campo__mensaje')).toHaveLength(0);
  });

  it('RD-91 · salir de un intervalo válido no borra lo que respondió el Núcleo', async () => {
    const { sub, boton } = await abrir((n) =>
      n.responder('widget_add', () => ({
        ok: false as const,
        error: { code: 'interval.out_of_range' as ErrorCode, message: FUERA, field: 'interval_seconds' },
      })),
    );
    await delCatalogo(sub, ['Mar', 'Monte']);
    fireEvent.click(boton('Agregar'));
    expect(await within(sub).findByText(FUERA)).toBeTruthy();
    fireEvent.blur(intervalo(sub));
    expect(within(sub).getByText(FUERA)).toBeTruthy();
  });
});
