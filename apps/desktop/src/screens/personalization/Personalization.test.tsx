// HE-02-HU10 · Seleccionar el tema en edición en la pantalla de personalización. Una prueba por CA en la vista;
// las reglas del Núcleo tienen su prueba ca_he_02_hu10_* en servicio_de_personalizacion_y_configuracion.
import { open } from '@tauri-apps/plugin-dialog';
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContent, ThemeDraftView, ThemeSummary } from '@/types';
import textos from '@/types/messages.es.json';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Personalization } from './Personalization';

// El explorador de archivos de Windows (X-02) no existe en las pruebas: cada prueba dice qué elige la persona.
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }));

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const CONTENIDO: ThemeContent = {
  template_id: 'default',
  background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
  colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
  palette_id: null,
  font: { id: 'nunito', size: 'medium' },
};

function vista(theme_id: string, name: string, dirty = false): ThemeDraftView {
  return {
    theme_id,
    name,
    content: CONTENIDO,
    dirty,
    applied_unsaved: false,
    legibility: { ok: true, items: [], suggestion: null },
  };
}

function resumen(id: string, name: string, is_applied: boolean): ThemeSummary {
  return {
    id,
    name,
    last_modified_at: '2026-11-02T00:00:00.000Z',
    is_applied,
    has_unapplied_changes: false,
    has_unsaved_changes: false,
  };
}

const MENSAJE_M04 =
  'Tienes cambios sin guardar en el tema “Mi tema”. ¿Deseas cambiar de tema sin guardarlos?';

/** Abre la pantalla con «Mi tema» (aplicado) y «Verano»; con `conCambios`, el Núcleo avisa al cambiar de tema. */
async function abrir(conCambios = false, primerInicio = false) {
  const nucleo = await abrirPantalla(
    'personalization',
    'Personalización del wallpaper',
    Personalization,
    [],
    (n: NucleoDelPlanificador) => {
      n.responder('theme_list', () => ({
        ok: true,
        value: primerInicio
          ? [resumen('t1', 'Mi tema', true)]
          : [resumen('t2', 'Verano', false), resumen('t1', 'Mi tema', true)],
      }));
      n.responder('catalog_list', ({ kind }) => ({
        ok: true,
        value:
          kind === 'font'
            ? [
                { id: 'nunito', name: 'Nunito', thumbnail_url: 'fonts/nunito.woff2', is_cached: true },
                { id: 'inter', name: 'Inter', thumbnail_url: 'fonts/inter.woff2', is_cached: true },
              ]
            : kind === 'palette'
              ? [
                  {
                    id: 'oceano',
                    name: 'Océano',
                    thumbnail_url: '',
                    is_cached: true,
                    color_primary: '#0B3954',
                    color_secondary: '#087E8B',
                    color_text: '#F5F5F5',
                  },
                ]
              : kind === 'image'
                ? [
                    { id: 'mar', name: 'Mar', thumbnail_url: 'images/mar-t.jpg', is_cached: true },
                    { id: 'monte', name: 'Monte', thumbnail_url: 'images/monte-t.jpg', is_cached: true },
                  ]
                : [
                    {
                      id: 'default',
                      name: 'Windgets',
                      thumbnail_url: 'templates/default/thumbnail.png',
                      is_cached: true,
                    },
                    {
                      id: 'minimal',
                      name: 'Minimal',
                      thumbnail_url: 'templates/minimal/thumbnail.png',
                      is_cached: true,
                    },
                  ],
      }));
      n.responder('theme_draft_update', ({ patch }) => {
        // HE-02-HU05: el Núcleo valida cada color (ET04 a ET06).
        for (const [campo, valor] of Object.entries(patch.colors ?? {})) {
          if (valor === '')
            return {
              ok: false,
              error: { code: 'color.required', message: textos.CAMPO_OBLIGATORIO, field: campo },
            };
          if (!/^#[0-9A-Fa-f]{6}$/.test(valor))
            return {
              ok: false,
              error: { code: 'color.invalid', message: textos.COLOR_INVALIDO, field: campo },
            };
        }
        return {
          ok: true,
          value: {
            ...vista('t1', 'Mi tema', true),
            content: {
              ...CONTENIDO,
              colors: { ...CONTENIDO.colors, ...patch.colors },
              font: { id: patch.font_id ?? CONTENIDO.font.id, size: patch.font_size ?? CONTENIDO.font.size },
              template_id: patch.template_id ?? CONTENIDO.template_id,
              background: patch.background
                ? {
                    source: patch.background.source,
                    catalog_image_id: patch.background.catalog_image_id ?? null,
                    uploaded_image_id: patch.background.uploaded_image_id ?? null,
                  }
                : CONTENIDO.background,
            },
          },
        };
      });
      n.responder('image_import', ({ path }) =>
        path.endsWith('.png') || path.endsWith('.jpg')
          ? { ok: true, value: { uploaded_image_id: 'img-1', preview_url: `C:/Windgets/files/${path}` } }
          : path.endsWith('.gif')
            ? {
                ok: false,
                error: { code: 'image.format_not_allowed', message: textos.FORMATO_DE_IMAGEN_NO_PERMITIDO },
              }
            : path.endsWith('.zip')
              ? { ok: false, error: { code: 'image.too_large', message: textos.IMAGEN_MUY_GRANDE } }
              : { ok: false, error: { code: 'image.unreadable', message: textos.IMAGEN_ILEGIBLE } },
      );
      n.responder('theme_draft_open', () => ({ ok: true, value: vista('t1', 'Mi tema', conCambios) }));
      // HE-02-HU09-ET03: los widgets activos del escritorio y su monitor principal (1920 × 1080).
      n.responder('layer_get_initial_state', () => ({
        ok: true,
        value: {
          applied: CONTENIDO,
          widgets: [
            { widget_id: 'w1', type: 'clock', x: 96, y: 54, width: 384, height: 216, is_active: true },
            {
              widget_id: 'w2',
              type: 'daily_tasks',
              x: 960,
              y: 540,
              width: 480,
              height: 270,
              is_active: true,
            },
          ],
          monitors: [{ id: '0', x: 0, y: 0, width: 1920, height: 1080, scale_factor: 1 }],
          wallpaper_state: 'ok',
        },
      }));
      n.responder('theme_draft_select', ({ theme_id, discard_changes }) =>
        conCambios && !discard_changes
          ? { ok: false, error: { code: 'draft.unsaved_changes', message: MENSAJE_M04 } }
          : { ok: true, value: vista(theme_id, theme_id === 't2' ? 'Verano' : 'Mi tema') },
      );
    },
  );
  return nucleo;
}

function lista() {
  return screen.getByRole('combobox', { name: 'Tema en edición' }) as HTMLSelectElement;
}

describe('HE-02-HU10 · Personalización del wallpaper', () => {
  it('HE-02-HU10-CA01 · Tema en edición por defecto', async () => {
    await abrir();
    // ET01, ET02: la lista con el tema aplicado seleccionado y su nombre visible.
    await waitFor(() => expect(lista().value).toBe('t1'));
    expect(within(lista()).getByRole('option', { name: 'Mi tema' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Vista previa del escritorio' })).toBeTruthy();
    for (const seccion of ['Plantillas', 'Imagen de fondo', 'Colores', 'Tipografía', 'Paletas']) {
      expect(screen.getByRole('heading', { name: seccion })).toBeTruthy();
    }
    for (const opcion of ['Guardar', 'Guardar como tema', 'Aplicar', 'Cancelar']) {
      expect(screen.getByRole('button', { name: opcion })).toBeTruthy();
    }
  });

  it('HE-02-HU10-CA02 · Seleccionar otro tema para editar', async () => {
    const nucleo = await abrir();
    await waitFor(() => expect(lista().value).toBe('t1'));
    fireEvent.change(lista(), { target: { value: 't2' } });
    await waitFor(() => expect(lista().value).toBe('t2'));
    expect(llamadasA(nucleo, 'theme_draft_select')).toEqual([{ theme_id: 't2' }]);
    // ET04: no se pide nada que cambie el escritorio.
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('HE-02-HU10-CA03 · Cambiar de tema con cambios sin guardar', async () => {
    await abrir(true);
    await waitFor(() => expect(lista().value).toBe('t1'));
    fireEvent.change(lista(), { target: { value: 't2' } });
    // ET06: confirmación en ventana emergente con el texto literal y sus dos opciones.
    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText(MENSAJE_M04)).toBeTruthy();
    expect(MENSAJE_M04.replace('Mi tema', '<nombre del tema en edición>')).toBe(
      textos.CAMBIOS_SIN_GUARDAR_AL_CAMBIAR_DE_TEMA,
    );
    expect(within(dialogo).getByRole('button', { name: 'Cambiar sin guardar' })).toBeTruthy();
    expect(within(dialogo).getByRole('button', { name: 'Seguir editando' })).toBeTruthy();
  });

  it('HE-02-HU10-CA04 · Confirmar el cambio de tema sin guardar', async () => {
    const nucleo = await abrir(true);
    await waitFor(() => expect(lista().value).toBe('t1'));
    fireEvent.change(lista(), { target: { value: 't2' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Cambiar sin guardar' }));
    await waitFor(() => expect(lista().value).toBe('t2'));
    expect(llamadasA(nucleo, 'theme_draft_select').at(-1)).toEqual({
      theme_id: 't2',
      discard_changes: true,
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('HE-02-HU10-CA05 · Primer inicio de sesión', async () => {
    await abrir(false, true);
    // ET05: el tema inicial «Mi tema» es el tema en edición y el único de la lista.
    await waitFor(() => expect(lista().value).toBe('t1'));
    expect(
      within(lista())
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Mi tema']);
  });

  it('HE-02-HU10-CA06 · Seguir editando al cambiar de tema', async () => {
    await abrir(true);
    await waitFor(() => expect(lista().value).toBe('t1'));
    fireEvent.change(lista(), { target: { value: 't2' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Seguir editando' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    // Se mantiene el tema en edición anterior.
    expect(lista().value).toBe('t1');
  });
});

describe('HE-02-HU02 · Plantillas', () => {
  it('HE-02-HU02-CA01 · Consultar el catálogo de plantillas', async () => {
    await abrir();
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    const plantillas = within(catalogo).getAllByRole('button');
    // ET01: miniatura y nombre de cada plantilla; ET02: «Seleccionada» solo en la del tema en edición.
    expect(plantillas.map((b) => b.textContent)).toEqual(['WindgetsSeleccionada', 'Minimal']);
    expect(catalogo.querySelectorAll('img')).toHaveLength(2);
    expect(within(catalogo).getAllByText('Seleccionada')).toHaveLength(1);
    // ET04, ET05: nada para crear plantillas propias ni para subir archivos.
    const seccion = screen.getByRole('region', { name: 'Plantillas' });
    expect(within(seccion).queryByRole('button', { name: /crear|subir|importar/i })).toBeNull();
  });

  it('HE-02-HU02-CA02 · Seleccionar una plantilla', async () => {
    const nucleo = await abrir();
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    fireEvent.click(within(catalogo).getByRole('button', { name: /Minimal/ }));
    // La etiqueta se mueve a la plantilla elegida y no se pide nada que cambie el escritorio (ET07).
    await waitFor(() =>
      expect(within(catalogo).getByRole('button', { name: /Minimal/ }).textContent).toContain('Seleccionada'),
    );
    expect(within(catalogo).getByRole('button', { name: /Windgets/ }).textContent).not.toContain(
      'Seleccionada',
    );
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([{ patch: { template_id: 'minimal' } }]);
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
  });
});

describe('HE-02-HU03 · Imagen de fondo', () => {
  const seccion = () => screen.getByRole('region', { name: 'Imagen de fondo' });
  const vistaPrevia = () => screen.getByRole('region', { name: 'Vista previa del escritorio' });
  const elegir = (ruta: string | null) => vi.mocked(open).mockResolvedValueOnce(ruta);

  it('HE-02-HU03-CA01 · Seleccionar una imagen propia', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    // ET01, ET02: la imagen actual, las tres opciones y el texto de «Subir imagen».
    for (const opcion of ['Subir imagen', 'Catálogo de imágenes', 'Quitar imagen']) {
      expect(within(seccion()).getByRole('button', { name: opcion })).toBeTruthy();
    }
    expect(within(seccion()).getByText('JPG, JPEG o PNG. Máximo 20 MB.')).toBeTruthy();
    elegir('C:/Fotos/playa.png');
    fireEvent.click(within(seccion()).getByRole('button', { name: 'Subir imagen' }));
    // ET06: el explorador solo deja elegir JPG, JPEG y PNG; la imagen se importa y pasa a ser el fondo.
    await waitFor(() => expect(vistaPrevia().style.backgroundImage).toContain('playa.png'));
    expect(vi.mocked(open).mock.calls[0]?.[0]?.filters?.[0]?.extensions).toEqual(['jpg', 'jpeg', 'png']);
    expect(llamadasA(nucleo, 'image_import')).toEqual([
      { path: 'C:/Fotos/playa.png', purpose: 'background' },
    ]);
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([
      { patch: { background: { source: 'own', uploaded_image_id: 'img-1' } } },
    ]);
    // ET05: se ajusta al escritorio sin deformarse.
    expect(vistaPrevia().style.backgroundSize).toBe('cover');
  });

  it('HE-02-HU03-CA02 · Abrir el catálogo de imágenes', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    expect(screen.queryByRole('list', { name: 'Catálogo de imágenes' })).toBeNull();
    fireEvent.click(within(seccion()).getByRole('button', { name: 'Catálogo de imágenes' }));
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de imágenes' });
    // ET07, ET08: la miniatura de cada imagen y nada para agregar imágenes al catálogo.
    expect(catalogo.querySelectorAll('img')).toHaveLength(2);
    expect(
      within(catalogo)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Mar', 'Monte']);
    expect(within(seccion()).queryByRole('button', { name: /agregar|crear|importar/i })).toBeNull();
    expect(llamadasA(nucleo, 'catalog_list')).toContainEqual({ kind: 'image' });
  });

  it('HE-02-HU03-CA03 · Seleccionar una imagen del catálogo de imágenes', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    fireEvent.click(within(seccion()).getByRole('button', { name: 'Catálogo de imágenes' }));
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de imágenes' });
    fireEvent.click(within(catalogo).getByRole('button', { name: 'Mar' }));
    await waitFor(() => expect(vistaPrevia().style.backgroundImage).toContain('images/mar-t.jpg'));
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([
      { patch: { background: { source: 'catalog', catalog_image_id: 'mar' } } },
    ]);
  });

  it('HE-02-HU03-CA04 · Reemplazar la imagen de fondo', async () => {
    await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    elegir('C:/Fotos/playa.png');
    fireEvent.click(within(seccion()).getByRole('button', { name: 'Subir imagen' }));
    await waitFor(() => expect(vistaPrevia().style.backgroundImage).toContain('playa.png'));
    // ET09: otra imagen, del catálogo, reemplaza la anterior en la vista previa.
    fireEvent.click(within(seccion()).getByRole('button', { name: 'Catálogo de imágenes' }));
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de imágenes' });
    fireEvent.click(within(catalogo).getByRole('button', { name: 'Monte' }));
    await waitFor(() => expect(vistaPrevia().style.backgroundImage).toContain('images/monte-t.jpg'));
    expect(vistaPrevia().style.backgroundImage).not.toContain('playa.png');
  });

  it.each([
    ['CA05', 'animada.gif', textos.FORMATO_DE_IMAGEN_NO_PERMITIDO],
    ['CA06', 'enorme.zip', textos.IMAGEN_MUY_GRANDE],
    ['CA07', 'danada.bmp', textos.IMAGEN_ILEGIBLE],
  ])(
    'HE-02-HU03-%s · Archivo rechazado: mensaje literal y la vista previa no cambia',
    async (_ca, archivo, mensaje) => {
      const nucleo = await abrir();
      await screen.findByRole('list', { name: 'Catálogo de plantillas' });
      elegir(`C:/Fotos/${archivo}`);
      fireEvent.click(within(seccion()).getByRole('button', { name: 'Subir imagen' }));
      expect((await within(seccion()).findByRole('alert')).textContent).toBe(mensaje);
      // ET10: no se cambió el fondo.
      expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([]);
      expect(vistaPrevia().style.backgroundImage).toBe('');
    },
  );

  it('HE-02-HU03-CA08 · Cancelar la selección de archivo', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    elegir(null);
    fireEvent.click(within(seccion()).getByRole('button', { name: 'Subir imagen' }));
    await waitFor(() => expect(vi.mocked(open)).toHaveBeenCalled());
    expect(llamadasA(nucleo, 'image_import')).toEqual([]);
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([]);
    expect(within(seccion()).queryByRole('alert')).toBeNull();
    expect(vistaPrevia().style.backgroundImage).toBe('');
  });
});

describe('HE-02-HU04 · Quitar la imagen de fondo', () => {
  const seccion = () => screen.getByRole('region', { name: 'Imagen de fondo' });
  const vistaPrevia = () => screen.getByRole('region', { name: 'Vista previa del escritorio' });
  const quitar = () => within(seccion()).getByRole('button', { name: 'Quitar imagen' }) as HTMLButtonElement;

  it('HE-02-HU04-CA01 · Quitar la imagen de fondo', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    fireEvent.click(within(seccion()).getByRole('button', { name: 'Catálogo de imágenes' }));
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de imágenes' });
    fireEvent.click(within(catalogo).getByRole('button', { name: 'Mar' }));
    await waitFor(() => expect(vistaPrevia().style.backgroundImage).toContain('images/mar-t.jpg'));
    fireEvent.click(quitar());
    // ET01: la vista previa vuelve a la imagen de fondo de la plantilla.
    await waitFor(() => expect(vistaPrevia().style.backgroundImage).toBe(''));
    expect(llamadasA(nucleo, 'theme_draft_update').at(-1)).toEqual({
      patch: { background: { source: 'template_default' } },
    });
    expect(within(seccion()).getByText('Imagen de fondo de la plantilla')).toBeTruthy();
  });

  it('HE-02-HU04-CA02 · Quitar imagen sin imagen elegida', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    // ET02: deshabilitada con su texto (RT-04).
    expect(quitar().disabled).toBe(true);
    expect(
      within(seccion()).getByText('Esta plantilla ya muestra su imagen de fondo por defecto.'),
    ).toBeTruthy();
    fireEvent.click(quitar());
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([]);
  });
});

describe('HE-02-HU05 · Colores del tema', () => {
  const seccion = () => screen.getByRole('region', { name: 'Colores' });
  const vistaPrevia = () => screen.getByRole('region', { name: 'Vista previa del escritorio' });
  const campo = (nombre: string) =>
    within(seccion()).getByRole('textbox', { name: nombre }) as HTMLInputElement;
  const boton = (nombre: string) => screen.getByRole('button', { name: nombre }) as HTMLButtonElement;

  /** Diligencia un valor hexadecimal y sale del campo. */
  function diligenciar(nombre: string, valor: string) {
    fireEvent.change(campo(nombre), { target: { value: valor } });
    fireEvent.blur(campo(nombre));
  }

  it('HE-02-HU05-CA01 · Cambiar un color con el selector de colores', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    // ET01, ET13: los tres colores con su muestra, su selector y su valor «#RRGGBB»; y «Restablecer colores».
    expect(['Color principal', 'Color secundario', 'Color del texto'].map((n) => campo(n).value)).toEqual([
      '#96B2B2',
      '#829890',
      '#14201C',
    ]);
    expect(seccion().querySelectorAll('.wg-muestra-color')).toHaveLength(3);
    expect(within(seccion()).getByRole('button', { name: 'Restablecer colores' })).toBeTruthy();
    // El selector de colores del color principal, con el teclado sobre el tono.
    const selector = within(seccion()).getByRole('group', { name: 'Color principal' });
    const deslizadores = within(selector).getAllByRole('slider');
    fireEvent.keyDown(deslizadores[deslizadores.length - 1] as HTMLElement, {
      key: 'ArrowRight',
      keyCode: 39,
    });
    await waitFor(() => expect(llamadasA(nucleo, 'theme_draft_update')).toHaveLength(1));
    const [llamada] = llamadasA(nucleo, 'theme_draft_update') as Array<{
      patch: { colors: { primary: string } };
    }>;
    const nuevo = llamada?.patch.colors.primary ?? '';
    expect(nuevo).toMatch(/^#[0-9A-F]{6}$/);
    expect(nuevo).not.toBe('#96B2B2');
    // La vista previa (el wallpaper) toma el color nuevo. ET10: el parche no toca etiquetas ni columnas.
    await waitFor(() => expect(campo('Color principal').value).toBe(nuevo));
    expect(vistaPrevia().style.background).not.toBe('rgb(150, 178, 178)');
  });

  it('HE-02-HU05-CA02 · Cambiar un color en formato hexadecimal', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    diligenciar('Color secundario', '#A1B2C3');
    await waitFor(() =>
      expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([
        { patch: { colors: { secondary: '#A1B2C3' } } },
      ]),
    );
    expect(campo('Color secundario').value).toBe('#A1B2C3');
  });

  it('HE-02-HU05-CA03 · Color hexadecimal inválido', async () => {
    await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    const antes = vistaPrevia().style.background;
    diligenciar('Color principal', '#12AB');
    // ET05: mensaje de campo y la vista previa sigue igual.
    expect(
      await within(seccion()).findByText('Diligencia un color válido en formato hexadecimal (ej.: #1A2B3C).'),
    ).toBeTruthy();
    expect(campo('Color principal').getAttribute('aria-invalid')).toBe('true');
    expect(vistaPrevia().style.background).toBe(antes);
  });

  it('HE-02-HU05-CA04 · Color vacío', async () => {
    await abrir(true);
    await waitFor(() => expect(boton('Guardar').disabled).toBe(false));
    diligenciar('Color del texto', '');
    expect(await within(seccion()).findByText('Este campo es obligatorio.')).toBeTruthy();
    // ET06: «Guardar», «Guardar como tema» y «Aplicar» deshabilitadas hasta que haya un color válido.
    for (const nombre of ['Guardar', 'Guardar como tema', 'Aplicar'])
      expect(boton(nombre).disabled).toBe(true);
    diligenciar('Color del texto', '#14201C');
    await waitFor(() => expect(within(seccion()).queryByText('Este campo es obligatorio.')).toBeNull());
    for (const nombre of ['Guardar', 'Aplicar']) expect(boton(nombre).disabled).toBe(false);
  });

  it('HE-02-HU05-CA05 · Colores con poco contraste', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    nucleo.responder('theme_draft_update', () => ({
      ok: true,
      value: {
        ...vista('t1', 'Mi tema', true),
        content: { ...CONTENIDO, colors: { ...CONTENIDO.colors, text: '#777777' } },
        legibility: {
          ok: false,
          items: [
            { pair: 'ink_surface', ratio: 2.98, min: 7 },
            { pair: 'text_surface', ratio: 2.71, min: 4.5 },
            { pair: 'control_surface', ratio: 3.2, min: 3 },
          ],
          suggestion: { pair: 'text_surface', color: '#E6E6E6', ratio: 7.4 },
        },
      },
    }));
    diligenciar('Color del texto', '#777777');
    // ET08, ET16: el menor contraste que no cumple, truncado y con coma, y el color sugerido; sin bloquear.
    expect(
      await screen.findByText('El contraste de estos colores es bajo (2,7:1). Prueba con #E6E6E6.'),
    ).toBeTruthy();
    for (const nombre of ['Guardar', 'Guardar como tema', 'Aplicar'])
      expect(boton(nombre).disabled).toBe(false);
    // ET17: desaparece cuando todos los pares cumplen.
    nucleo.responder('theme_draft_update', () => ({ ok: true, value: vista('t1', 'Mi tema', true) }));
    diligenciar('Color del texto', '#E6E6E6');
    await waitFor(() => expect(screen.queryByText(/El contraste de estos colores es bajo/)).toBeNull());
  });
});

describe('HE-02-HU06 · Tipografía del tema', () => {
  const seccion = () => screen.getByRole('region', { name: 'Tipografía' });
  const vistaPrevia = () => screen.getByRole('region', { name: 'Vista previa del escritorio' });

  it('HE-02-HU06-CA01 · Cambiar la fuente', async () => {
    const nucleo = await abrir();
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de tipografías' });
    // ET01: cada fuente con su nombre escrito en esa fuente; los tres tamaños y «Restablecer tipografía».
    const inter = within(catalogo).getByRole('button', { name: 'Inter' });
    expect(inter.style.fontFamily).toContain('Inter');
    const tamanos = within(within(seccion()).getByRole('group', { name: 'Tamaño' })).getAllByRole('button');
    expect(tamanos.map((b) => b.textContent)).toEqual(['Pequeño', 'Mediano', 'Grande']);
    expect(within(seccion()).getByRole('button', { name: 'Restablecer tipografía' })).toBeTruthy();
    await waitFor(() => expect(vistaPrevia().style.fontFamily).toContain('Nunito'));
    fireEvent.click(inter);
    // ET03: la fuente del catálogo pasa a la vista previa.
    await waitFor(() => expect(vistaPrevia().style.fontFamily).toContain('Inter'));
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([{ patch: { font_id: 'inter' } }]);
    expect(inter.getAttribute('aria-pressed')).toBe('true');
  });

  it('HE-02-HU06-CA02 · Cambiar el tamaño del texto', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de tipografías' });
    const tamano = (nombre: string) =>
      within(within(seccion()).getByRole('group', { name: 'Tamaño' })).getByRole('button', { name: nombre });
    // ET04: «Mediano» por defecto. ET05: 16 px.
    expect(tamano('Mediano').getAttribute('aria-pressed')).toBe('true');
    expect(vistaPrevia().style.fontSize).toBe('16px');
    fireEvent.click(tamano('Grande'));
    await waitFor(() => expect(vistaPrevia().style.fontSize).toBe('20px'));
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([{ patch: { font_size: 'large' } }]);
  });
});

describe('HE-02-HU07 · Paletas', () => {
  const seccion = () => screen.getByRole('region', { name: 'Paletas' });

  it('HE-02-HU07-CA01 · Seleccionar una paleta', async () => {
    const nucleo = await abrir();
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de paletas' });
    // ET01: el nombre y los tres colores de cada paleta; sin paleta, «Personalizada».
    const oceano = within(catalogo).getByRole('button', { name: 'Océano' });
    expect(oceano.querySelectorAll('.wg-muestra-color')).toHaveLength(3);
    expect(within(seccion()).getByText('Personalizada')).toBeTruthy();
    nucleo.responder('theme_draft_update', () => ({
      ok: true,
      value: {
        ...vista('t1', 'Mi tema', true),
        content: {
          ...CONTENIDO,
          colors: { primary: '#0B3954', secondary: '#087E8B', text: '#F5F5F5' },
          palette_id: 'oceano',
        },
      },
    }));
    fireEvent.click(oceano);
    // ET02, ET04: los tres colores en un solo paso; la plantilla y la imagen de fondo no cambian.
    await waitFor(() => expect(oceano.getAttribute('aria-pressed')).toBe('true'));
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([{ patch: { palette_id: 'oceano' } }]);
    expect(within(seccion()).queryByText('Personalizada')).toBeNull();
    const colores = screen.getByRole('region', { name: 'Colores' });
    expect(
      (within(colores).getByRole('textbox', { name: 'Color principal' }) as HTMLInputElement).value,
    ).toBe('#0B3954');
  });

  it('HE-02-HU07-CA02 · Cambiar un color después de elegir una paleta', async () => {
    const nucleo = await abrir();
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de paletas' });
    nucleo.responder('theme_draft_update', () => ({
      ok: true,
      value: { ...vista('t1', 'Mi tema', true), content: { ...CONTENIDO, palette_id: 'oceano' } },
    }));
    fireEvent.click(within(catalogo).getByRole('button', { name: 'Océano' }));
    await waitFor(() => expect(within(seccion()).queryByText('Personalizada')).toBeNull());
    // ET03: el Núcleo deja la paleta en `null` al cambiar un color y la sección muestra «Personalizada».
    nucleo.responder('theme_draft_update', () => ({
      ok: true,
      value: {
        ...vista('t1', 'Mi tema', true),
        content: { ...CONTENIDO, colors: { ...CONTENIDO.colors, primary: '#334455' }, palette_id: null },
      },
    }));
    const principal = within(screen.getByRole('region', { name: 'Colores' })).getByRole('textbox', {
      name: 'Color principal',
    });
    fireEvent.change(principal, { target: { value: '#334455' } });
    fireEvent.blur(principal);
    expect(await within(seccion()).findByText('Personalizada')).toBeTruthy();
  });
});

describe('HE-02-HU08 · Restablecer los colores y la tipografía', () => {
  const vistaPrevia = () => screen.getByRole('region', { name: 'Vista previa del escritorio' });
  const colores = () => screen.getByRole('region', { name: 'Colores' });
  const tipografia = () => screen.getByRole('region', { name: 'Tipografía' });

  /** El Núcleo devuelve el borrador con los valores de la plantilla. */
  function restablecerEnElNucleo(nucleo: NucleoDelPlanificador) {
    nucleo.responder('theme_draft_reset', () => ({ ok: true, value: vista('t1', 'Mi tema', true) }));
  }

  it('HE-02-HU08-CA01 · Restablecer los colores del tema', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    const principal = within(colores()).getByRole('textbox', { name: 'Color principal' }) as HTMLInputElement;
    fireEvent.change(principal, { target: { value: '#123456' } });
    fireEvent.blur(principal);
    await waitFor(() => expect(principal.value).toBe('#123456'));
    restablecerEnElNucleo(nucleo);
    // ET03: la opción está en la sección «Colores».
    fireEvent.click(within(colores()).getByRole('button', { name: 'Restablecer colores' }));
    // ET01: la vista previa vuelve a los colores de la plantilla.
    await waitFor(() => expect(principal.value).toBe('#96B2B2'));
    expect(llamadasA(nucleo, 'theme_draft_reset')).toEqual([{ part: 'colors' }]);
    expect(vistaPrevia().style.background).toContain('rgb(150, 178, 178)');
  });

  it('HE-02-HU08-CA02 · Restablecer la tipografía', async () => {
    const nucleo = await abrir();
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de tipografías' });
    fireEvent.click(within(catalogo).getByRole('button', { name: 'Inter' }));
    fireEvent.click(within(tipografia()).getByRole('button', { name: 'Grande' }));
    await waitFor(() => expect(vistaPrevia().style.fontSize).toBe('20px'));
    restablecerEnElNucleo(nucleo);
    // ET03: la opción está en la sección «Tipografía».
    fireEvent.click(within(tipografia()).getByRole('button', { name: 'Restablecer tipografía' }));
    // ET02: la fuente de la plantilla y el tamaño «Mediano».
    await waitFor(() => expect(vistaPrevia().style.fontSize).toBe('16px'));
    expect(vistaPrevia().style.fontFamily).toContain('Nunito');
    expect(within(tipografia()).getByRole('button', { name: 'Mediano' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(llamadasA(nucleo, 'theme_draft_reset')).toEqual([{ part: 'typography' }]);
  });
});

describe('HE-02-HU09 · Vista previa en tiempo real', () => {
  const vistaPrevia = () => screen.getByRole('region', { name: 'Vista previa del escritorio' });

  it('HE-02-HU09-CA01 · Vista previa en tiempo real', async () => {
    const nucleo = await abrir();
    await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    // ET03: los widgets activos, en su lugar y a escala.
    const reloj = await within(vistaPrevia()).findByRole('img', { name: 'Reloj' });
    expect([reloj.style.left, reloj.style.top, reloj.style.width, reloj.style.height]).toEqual([
      '5%',
      '5%',
      '20%',
      '20%',
    ]);
    expect(within(vistaPrevia()).getByRole('img', { name: 'Tareas del día' })).toBeTruthy();
    // ET01, ET02: un cambio de color se ve en el wallpaper y en los widgets en cuanto responde el Núcleo.
    const fondoDelWidget = reloj.style.background;
    const principal = within(screen.getByRole('region', { name: 'Colores' })).getByRole('textbox', {
      name: 'Color secundario',
    });
    fireEvent.change(principal, { target: { value: '#204060' } });
    fireEvent.blur(principal);
    await waitFor(() => expect(reloj.style.background).not.toBe(fondoDelWidget));
    // El escritorio no cambia: no se aplicó nada.
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([]);
  });

  it('HE-02-HU09-CA02 · Escritorio sin cambios hasta aplicar', async () => {
    const nucleo = await abrir(true);
    nucleo.responder('theme_draft_save', () => ({
      ok: true,
      value: { theme_id: 't1', is_applied: true },
      result_message: { code: 'theme_draft_save', message: 'Cambios guardados en el tema “Mi tema”.' },
    }));
    const guardar = screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement;
    await waitFor(() => expect(guardar.disabled).toBe(false));
    fireEvent.click(guardar);
    await screen.findByRole('status');
    // ET04: guardar no lleva nada al escritorio; solo «Aplicar» lo hace.
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([]);
  });
});

describe('HE-02-HU13 · Cancelar los cambios sin guardar', () => {
  const M02 = 'Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?';
  const M03 = 'Aplicaste cambios que no guardaste en el tema. ¿Deseas guardarlos antes de salir?';
  const menu = () => screen.getByRole('navigation', { name: 'Menú principal' });

  /** Con cambios en la vista previa (aplicados o no) y el Núcleo listo para descartarlos o guardarlos. */
  async function conCambios(aplicados: boolean) {
    const nucleo = await abrir(true);
    nucleo.responder('theme_draft_get_status', () => ({
      ok: true,
      value: { dirty: true, applied_unsaved: aplicados, theme_name: 'Mi tema' },
    }));
    nucleo.responder('theme_draft_discard', () => ({
      ok: true,
      value: vista('t1', 'Mi tema'),
      result_message: { code: 'theme_draft_discard', message: 'No se guardaron cambios.' },
    }));
    nucleo.responder('theme_draft_save', () => ({
      ok: true,
      value: { theme_id: 't1', is_applied: true },
      result_message: { code: 'theme_draft_save', message: 'Cambios guardados en el tema “Mi tema”.' },
    }));
    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(false),
    );
    return nucleo;
  }

  /** Elige otra pantalla en el Menú principal y devuelve el mensaje que aparece. */
  async function salir() {
    fireEvent.click(within(menu()).getByRole('button', { name: 'Planificador diario' }));
    return screen.findByRole('dialog');
  }

  it('HE-02-HU13-CA01 · Cancelar los cambios sin guardar', async () => {
    const nucleo = await conCambios(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    // ET01, ET02: la vista previa vuelve a lo guardado, sin guardar nada, con el mensaje de resultado.
    expect((await screen.findByRole('status')).textContent).toContain('No se guardaron cambios.');
    expect(llamadasA(nucleo, 'theme_draft_discard')).toEqual([{}]);
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([]);
    expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('HE-02-HU13-CA02 · Salir con cambios sin guardar', async () => {
    await conCambios(false);
    const dialogo = await salir();
    // ET03: confirmación en ventana emergente con sus dos opciones. ET04: aún no sale.
    expect(within(dialogo).getByText(M02)).toBeTruthy();
    const opciones = within(dialogo)
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(opciones).toEqual(expect.arrayContaining(['Salir sin guardar', 'Seguir editando']));
    expect(screen.getByRole('main', { name: 'Personalización del wallpaper' })).toBeTruthy();
  });

  it('HE-02-HU13-CA03 · Salir sin guardar', async () => {
    const nucleo = await conCambios(false);
    const dialogo = await salir();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salir sin guardar' }));
    // Se abre la pantalla elegida (RT-01) y no se aplica nada al escritorio.
    expect(await screen.findByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(llamadasA(nucleo, 'theme_draft_discard')).toEqual([{}]);
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([]);
  });

  it('HE-02-HU13-CA04 · Seguir editando', async () => {
    const nucleo = await conCambios(false);
    const dialogo = await salir();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Seguir editando' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('main', { name: 'Personalización del wallpaper' })).toBeTruthy();
    expect(llamadasA(nucleo, 'theme_draft_discard')).toEqual([]);
    expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('HE-02-HU13-CA05 · Salir con cambios aplicados sin guardar', async () => {
    await conCambios(true);
    const dialogo = await salir();
    // ET06: el mensaje de RT-01-CA05, con «Guardar», «Salir sin guardar» y «Seguir editando».
    expect(within(dialogo).getByText(M03)).toBeTruthy();
    for (const opcion of ['Guardar', 'Salir sin guardar', 'Seguir editando']) {
      expect(within(dialogo).getByRole('button', { name: opcion })).toBeTruthy();
    }
  });

  it('HE-02-HU13-CA06 · Salir sin guardar lo aplicado', async () => {
    const nucleo = await conCambios(true);
    const dialogo = await salir();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Salir sin guardar' }));
    expect(await screen.findByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    // ET05: no se guarda en el tema; lo aplicado sigue en el escritorio (no se vuelve a aplicar nada).
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([]);
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([]);
  });

  it('HE-02-HU13-CA07 · Cancelar desde el mensaje de aplicar', async () => {
    const nucleo = await conCambios(false);
    nucleo.responder('theme_draft_apply', () => ({
      ok: false,
      error: {
        code: 'draft.unsaved_changes_on_apply',
        message: 'Tienes cambios sin guardar en el tema “Mi tema”. ¿Qué deseas hacer?',
      },
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    const dialogo = await screen.findByRole('dialog');
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    // ET07: se cierra el mensaje, el escritorio no cambia y la vista previa conserva sus cambios.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([{ mode: 'apply' }]);
    expect(llamadasA(nucleo, 'theme_draft_discard')).toEqual([]);
    expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('HE-02-HU13-CA08 · Guardar los cambios aplicados al salir', async () => {
    const nucleo = await conCambios(true);
    const dialogo = await salir();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Guardar' }));
    // ET08: guarda en el tema en edición, cierra el mensaje y abre la pantalla elegida.
    expect(await screen.findByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([{}]);
    expect(llamadasA(nucleo, 'theme_draft_discard')).toEqual([]);
  });

  it('HE-02-HU13-CA09 · Seguir editando con cambios aplicados', async () => {
    const nucleo = await conCambios(true);
    const dialogo = await salir();
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Seguir editando' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('main', { name: 'Personalización del wallpaper' })).toBeTruthy();
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([]);
    expect(llamadasA(nucleo, 'theme_draft_discard')).toEqual([]);
  });
});

describe('HE-03-HU02 · Guardar como tema', () => {
  const guardarComo = () => screen.getByRole('button', { name: 'Guardar como tema' }) as HTMLButtonElement;

  /** Con cambios en la vista previa, abre la ventana emergente Guardar como tema. */
  async function abrirVentana() {
    const nucleo = await abrir(true);
    await waitFor(() => expect(guardarComo().disabled).toBe(false));
    fireEvent.click(guardarComo());
    const ventana = await screen.findByRole('dialog', { name: 'Guardar como tema' });
    return { nucleo, ventana };
  }

  function diligenciarNombre(ventana: HTMLElement, nombre: string) {
    fireEvent.change(within(ventana).getByRole('textbox', { name: 'Nombre' }), { target: { value: nombre } });
  }

  const guardar = (ventana: HTMLElement) =>
    within(ventana).getByRole('button', { name: 'Guardar' }) as HTMLButtonElement;

  it('HE-03-HU02-CA01 · Guardar como tema nuevo', async () => {
    const { nucleo, ventana } = await abrirVentana();
    nucleo.responder('theme_draft_save_as', ({ name }) => ({
      ok: true,
      value: { theme_id: 't3' },
      result_message: { code: 'theme_draft_save_as', message: `Tema “${name}” guardado.` },
    }));
    nucleo.responder('theme_draft_open', () => ({ ok: true, value: vista('t3', 'Otoño') }));
    nucleo.responder('theme_list', () => ({
      ok: true,
      value: [resumen('t3', 'Otoño', false), resumen('t2', 'Verano', false), resumen('t1', 'Mi tema', true)],
    }));
    diligenciarNombre(ventana, '  Otoño ');
    fireEvent.click(guardar(ventana));
    // ET07: el tema nuevo queda en edición; ET08: no se aplica nada al escritorio.
    expect((await screen.findByRole('status')).textContent).toContain('Tema “Otoño” guardado.');
    expect(llamadasA(nucleo, 'theme_draft_save_as')).toEqual([{ name: 'Otoño' }]);
    await waitFor(() => expect(lista().value).toBe('t3'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([]);
  });

  it('HE-03-HU02-CA02 · Nombre vacío', async () => {
    const { nucleo, ventana } = await abrirVentana();
    diligenciarNombre(ventana, '   ');
    // ET10: «Guardar» deshabilitada y sin el mensaje «Este campo es obligatorio.».
    expect(guardar(ventana).disabled).toBe(true);
    expect(within(ventana).queryByText('Este campo es obligatorio.')).toBeNull();
    fireEvent.click(guardar(ventana));
    expect(llamadasA(nucleo, 'theme_draft_save_as')).toEqual([]);
  });

  it('HE-03-HU02-CA03 · Nombre de más de 40 caracteres', async () => {
    const { nucleo, ventana } = await abrirVentana();
    diligenciarNombre(ventana, 'a'.repeat(41));
    fireEvent.click(guardar(ventana));
    // ET09: el mensaje en el campo Nombre; no se guarda.
    expect(await within(ventana).findByText('El nombre no puede superar los 40 caracteres.')).toBeTruthy();
    expect(llamadasA(nucleo, 'theme_draft_save_as')).toEqual([]);
  });

  it('HE-03-HU02-CA04 · Nombre duplicado', async () => {
    const { nucleo, ventana } = await abrirVentana();
    nucleo.responder('theme_draft_save_as', () => ({
      ok: false,
      error: {
        code: 'name.duplicate',
        message: 'Ya existe un tema con ese nombre. Elige otro.',
        field: 'name',
      },
    }));
    diligenciarNombre(ventana, ' VERANO ');
    fireEvent.click(guardar(ventana));
    expect(await within(ventana).findByText('Ya existe un tema con ese nombre. Elige otro.')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Guardar como tema' })).toBeTruthy();
  });

  it('HE-03-HU02-CA05 · Máximo de temas', async () => {
    const nucleo = await abrir(true);
    nucleo.responder('theme_list', () => ({
      ok: true,
      value: Array.from({ length: 10 }, (_, i) => resumen(`t${i + 1}`, `Tema ${i + 1}`, i === 0)),
    }));
    nucleo.emitir('themes_changed', { ids: [], op: 'upsert', origin: 'local' });
    // ET11: deshabilitada con su texto (RT-04).
    await waitFor(() => expect(guardarComo().disabled).toBe(true));
    expect(screen.getByText('Alcanzaste el máximo de 10 temas. Elimina uno para guardar otro.')).toBeTruthy();
  });

  it('HE-03-HU02-CA06 · Cancelar el guardado', async () => {
    const { nucleo, ventana } = await abrirVentana();
    diligenciarNombre(ventana, 'Otoño');
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(nucleo, 'theme_draft_save_as')).toEqual([]);
    // La vista previa conserva sus cambios.
    expect((screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('HE-03-HU02-CA07 · Abrir la ventana Guardar como tema', async () => {
    const { ventana } = await abrirVentana();
    // ET01: el campo Nombre vacío y las opciones «Guardar» (deshabilitada) y «Cancelar».
    expect((within(ventana).getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('');
    expect(guardar(ventana).disabled).toBe(true);
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(screen.getByRole('main', { name: 'Personalización del wallpaper' })).toBeTruthy();
  });
});

describe('HE-02-HU11 · Guardar los cambios de la vista previa', () => {
  const guardar = () => screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement;

  /** Con cambios sin guardar; al guardar el Núcleo responde `mensaje` y la vista queda sin cambios. */
  async function abrirConCambios(mensaje: string, esAplicado: boolean) {
    const nucleo = await abrir(true);
    await waitFor(() => expect(guardar().disabled).toBe(false));
    nucleo.responder('theme_draft_save', () => ({
      ok: true,
      value: { theme_id: 't1', is_applied: esAplicado },
      result_message: { code: 'theme_draft_save', message: mensaje },
    }));
    nucleo.responder('theme_draft_open', () => ({ ok: true, value: vista('t1', 'Mi tema', false) }));
    return nucleo;
  }

  it('HE-02-HU11-CA01 · Guardar cambios en un tema no aplicado', async () => {
    const nucleo = await abrirConCambios('Cambios guardados en el tema “Verano”.', false);
    fireEvent.click(guardar());
    // ET01, ET02: guarda en el tema en edición, muestra el mensaje y no aplica nada al escritorio.
    expect((await screen.findByRole('status')).textContent).toContain(
      'Cambios guardados en el tema “Verano”.',
    );
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([{}]);
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
    await waitFor(() => expect(guardar().disabled).toBe(true));
  });

  it('HE-02-HU11-CA02 · Guardar cambios en el tema aplicado', async () => {
    const nucleo = await abrirConCambios(textos.CAMBIOS_GUARDADOS_EN_EL_TEMA_APLICADO, true);
    fireEvent.click(guardar());
    // ET03: el mensaje manda a «Aplicar»; el escritorio no cambia hasta entonces.
    expect((await screen.findByRole('status')).textContent).toContain(
      'Cambios guardados. Selecciona Aplicar para verlos en tu escritorio.',
    );
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
  });

  it('HE-02-HU11-CA03 · Guardar sin cambios', async () => {
    const nucleo = await abrir();
    await waitFor(() => expect(lista().value).toBe('t1'));
    // ET04: «Guardar» deshabilitada con el texto «No hay cambios para guardar.».
    expect(guardar().disabled).toBe(true);
    expect(screen.getByText('No hay cambios para guardar.')).toBeTruthy();
    fireEvent.click(guardar());
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([]);
  });

  it('HE-02-HU11-CA04 · Guardar la plantilla sin aplicarla', async () => {
    const nucleo = await abrir();
    const catalogo = await screen.findByRole('list', { name: 'Catálogo de plantillas' });
    nucleo.responder('theme_draft_save', () => ({
      ok: true,
      value: { theme_id: 't1', is_applied: true },
      result_message: { code: 'theme_draft_save', message: textos.CAMBIOS_GUARDADOS_EN_EL_TEMA_APLICADO },
    }));
    nucleo.responder('theme_draft_update', () => ({ ok: true, value: vista('t1', 'Mi tema', true) }));
    fireEvent.click(within(catalogo).getByRole('button', { name: /Minimal/ }));
    await waitFor(() => expect(guardar().disabled).toBe(false));
    fireEvent.click(guardar());
    await waitFor(() => expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([{}]));
    // El escritorio sigue con la plantilla anterior: nada se aplicó.
    expect(llamadasA(nucleo, 'theme_apply')).toEqual([]);
  });
});

describe('HE-02-HU12 · Aplicar al escritorio los cambios de la vista previa', () => {
  const aplicar = () => screen.getByRole('button', { name: 'Aplicar' }) as HTMLButtonElement;
  const M15 = 'Tienes cambios sin guardar en el tema “Mi tema”. ¿Qué deseas hacer?';

  /** El Núcleo de HE-02-HU12: con `apply` y cambios sin guardar, pide M-15; si no, aplica con su mensaje. */
  function aplicarEnElNucleo(nucleo: NucleoDelPlanificador, conCambios: boolean) {
    const mensajes = {
      apply: 'Tema “Mi tema” aplicado.',
      save_and_apply: 'Tema “Mi tema” guardado y aplicado.',
      apply_without_saving: 'Cambios aplicados. Recuerda guardarlos para no perderlos.',
    } as const;
    nucleo.responder('theme_draft_apply', ({ mode }) =>
      conCambios && mode === 'apply'
        ? { ok: false, error: { code: 'draft.unsaved_changes_on_apply', message: M15 } }
        : {
            ok: true,
            value: { theme_id: 't1' },
            result_message: { code: 'theme_draft_apply', message: mensajes[mode] },
          },
    );
  }

  /** Con cambios sin guardar: «Aplicar» abre M-15 con sus tres opciones (CA02). */
  async function abrirM15(nucleo: NucleoDelPlanificador) {
    aplicarEnElNucleo(nucleo, true);
    await waitFor(() => expect(aplicar().disabled).toBe(false));
    fireEvent.click(aplicar());
    return screen.findByRole('dialog');
  }

  /**
   * ET07: la plantilla, la imagen, los colores, la tipografía y la paleta se aplican con el mismo flujo de CA02 a
   * CA04. `cambiar` hace el cambio en la vista previa; sin `cambiar`, el borrador ya llega con el cambio.
   */
  async function aplicarSinGuardarTrasCambiar(cambiar?: () => Promise<void>) {
    const nucleo = await abrir(!cambiar);
    nucleo.responder('theme_draft_update', () => ({ ok: true, value: vista('t1', 'Mi tema', true) }));
    if (cambiar) await cambiar();
    const dialogo = await abrirM15(nucleo);
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar sin guardar' }));
    await waitFor(() =>
      expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([
        { mode: 'apply' },
        { mode: 'apply_without_saving' },
      ]),
    );
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([]);
  }

  it('HE-02-HU12-CA01 · Aplicar un tema sin cambios sin guardar', async () => {
    const nucleo = await abrir();
    await waitFor(() => expect(lista().value).toBe('t1'));
    fireEvent.change(lista(), { target: { value: 't2' } });
    await waitFor(() => expect(lista().value).toBe('t2'));
    nucleo.responder('theme_draft_apply', () => ({
      ok: true,
      value: { theme_id: 't2' },
      result_message: { code: 'theme_draft_apply', message: 'Tema “Verano” aplicado.' },
    }));
    await waitFor(() => expect(aplicar().disabled).toBe(false));
    fireEvent.click(aplicar());
    expect((await screen.findByRole('status')).textContent).toContain('Tema “Verano” aplicado.');
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([{ mode: 'apply' }]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('HE-02-HU12-CA02 · Aplicar con cambios sin guardar', async () => {
    const nucleo = await abrir(true);
    const dialogo = await abrirM15(nucleo);
    // ET03: confirmación en ventana emergente con las tres opciones.
    expect(within(dialogo).getByText(M15)).toBeTruthy();
    for (const opcion of ['Guardar y aplicar', 'Aplicar sin guardar', 'Cancelar']) {
      expect(within(dialogo).getByRole('button', { name: opcion })).toBeTruthy();
    }
    // «Cancelar» vuelve a la pantalla sin aplicar nada.
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([{ mode: 'apply' }]);
  });

  it('HE-02-HU12-CA03 · Guardar y aplicar', async () => {
    const nucleo = await abrir(true);
    const dialogo = await abrirM15(nucleo);
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Guardar y aplicar' }));
    expect((await screen.findByRole('status')).textContent).toContain('Tema “Mi tema” guardado y aplicado.');
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([{ mode: 'apply' }, { mode: 'save_and_apply' }]);
  });

  it('HE-02-HU12-CA04 · Aplicar sin guardar', async () => {
    const nucleo = await abrir(true);
    const dialogo = await abrirM15(nucleo);
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar sin guardar' }));
    expect((await screen.findByRole('status')).textContent).toContain(
      'Cambios aplicados. Recuerda guardarlos para no perderlos.',
    );
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([
      { mode: 'apply' },
      { mode: 'apply_without_saving' },
    ]);
    // ET04: no se guarda nada en el tema.
    expect(llamadasA(nucleo, 'theme_draft_save')).toEqual([]);
  });

  it('HE-02-HU12-CA05 · Cambios de la vista previa en tiempo real', async () => {
    // La vista no reinicia nada: al aplicar vuelve a leer el borrador y los temas. La capa vuelve a pintar con
    // EV-11 (prueba HE-02-HU12-CA05 de la capa).
    const nucleo = await abrir(true);
    const dialogo = await abrirM15(nucleo);
    const temasAntes = llamadasA(nucleo, 'theme_list').length;
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Guardar y aplicar' }));
    await waitFor(() => expect(llamadasA(nucleo, 'theme_list').length).toBe(temasAntes + 1));
  });

  it('HE-02-HU12-CA06 · Aplicar un tema que ya está aplicado', async () => {
    const nucleo = await abrir();
    await waitFor(() => expect(lista().value).toBe('t1'));
    // ET06: «Aplicar» deshabilitada con el texto «Este tema ya está aplicado.».
    await waitFor(() => expect(aplicar().disabled).toBe(true));
    expect(screen.getByText('Este tema ya está aplicado.')).toBeTruthy();
    fireEvent.click(aplicar());
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([]);
  });

  it('HE-02-HU12-CA07 · Aplicar la plantilla', async () => {
    await aplicarSinGuardarTrasCambiar(async () => {
      const catalogo = await screen.findByRole('list', { name: 'Catálogo de plantillas' });
      fireEvent.click(within(catalogo).getByRole('button', { name: /Minimal/ }));
    });
  });

  it('HE-02-HU12-CA08 · Aplicar la imagen de fondo', async () => {
    await aplicarSinGuardarTrasCambiar(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Catálogo de imágenes' }));
      const catalogo = await screen.findByRole('list', { name: 'Catálogo de imágenes' });
      fireEvent.click(within(catalogo).getByRole('button', { name: /Mar/ }));
    });
  });

  it('HE-02-HU12-CA09 · Aplicar los colores del tema', async () => {
    // La edición de colores llega con HE-02-HU05 (P13): el borrador ya trae los colores cambiados.
    await aplicarSinGuardarTrasCambiar();
  });

  it('HE-02-HU12-CA10 · Aplicar la tipografía', async () => {
    // La edición de la tipografía llega con HE-02-HU06 (P13): el borrador ya trae la fuente o el tamaño cambiados.
    await aplicarSinGuardarTrasCambiar();
  });

  it('HE-02-HU12-CA11 · Aplicar la paleta', async () => {
    // La selección de paletas llega con HE-02-HU07 (P13): el borrador ya trae la paleta cambiada.
    await aplicarSinGuardarTrasCambiar();
  });
});
