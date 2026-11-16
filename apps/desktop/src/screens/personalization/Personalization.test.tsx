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
          kind === 'image'
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
      n.responder('theme_draft_update', ({ patch }) => ({
        ok: true,
        value: {
          ...vista('t1', 'Mi tema', true),
          content: {
            ...CONTENIDO,
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
      }));
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
