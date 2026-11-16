// HE-02-HU10 · Seleccionar el tema en edición en la pantalla de personalización. Una prueba por CA en la vista;
// las reglas del Núcleo tienen su prueba ca_he_02_hu10_* en servicio_de_personalizacion_y_configuracion.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContent, ThemeDraftView, ThemeSummary } from '@/types';
import textos from '@/types/messages.es.json';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Personalization } from './Personalization';

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
