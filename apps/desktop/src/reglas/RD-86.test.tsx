// docs/rediseno.md RD-86: un tema que se eliminó en otro computador se dice con su texto y la lista se vuelve a
// leer. Las reglas del Núcleo: rd_86_* en servicio_de_personalizacion_y_configuracion.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  abrirPantalla,
  fijarHoy,
  llamadasA,
  screen,
  type NucleoDelPlanificador,
} from '@/screens/kanban/pruebas';
import { Personalization } from '@/screens/personalization/Personalization';
import { Themes } from '@/screens/themes/Themes';
import type { CommandName, ThemeDraftView, ThemeSummary } from '@/types';

const TEXTO = 'Este tema ya no existe.';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const resumen = (id: string, name: string, is_applied: boolean): ThemeSummary => ({
  id,
  name,
  last_modified_at: '2026-11-02T00:00:00.000Z',
  is_applied,
  has_unapplied_changes: false,
  has_unsaved_changes: false,
});

/** «Mi tema» y «Verano»; el comando dado responde `theme.not_found` y «Verano» deja de venir en la lista. */
function eliminado(n: NucleoDelPlanificador, comando: CommandName) {
  let quitado = false;
  n.responder('theme_list', () => ({
    ok: true,
    value: [resumen('t1', 'Mi tema', true), ...(quitado ? [] : [resumen('t2', 'Verano', false)])],
  }));
  n.responder(comando, () => {
    quitado = true;
    return { ok: false, error: { code: 'theme.not_found', message: TEXTO } };
  });
}

const pulsar = (donde: HTMLElement, nombre: string) =>
  act(async () => {
    fireEvent.click(within(donde).getByRole('button', { name: nombre }));
  });

async function seDiceYSeQuita(nucleo: NucleoDelPlanificador) {
  expect(screen.getByRole('alert').textContent).toContain(TEXTO);
  await vi.waitFor(() => expect(llamadasA(nucleo, 'theme_list').length).toBeGreaterThan(1));
}

describe('RD-86 · Temas: el tema ya no existe', () => {
  const filaDeVerano = () => screen.getByText('Verano').closest('li') as HTMLElement;
  const accion = async (opcion: string) => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Acciones de Verano' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: opcion }));
    });
  };

  it.each([
    [
      'aplicar',
      'theme_apply',
      async () => {
        await pulsar(filaDeVerano(), 'Aplicar');
        await pulsar(screen.getByRole('dialog'), 'Aplicar');
      },
    ],
    [
      'eliminar',
      'theme_delete',
      async () => {
        await accion('Eliminar');
        await pulsar(screen.getByRole('dialog'), 'Confirmar');
      },
    ],
    [
      'renombrar',
      'theme_rename',
      async () => {
        await accion('Renombrar');
        await pulsar(screen.getByRole('dialog'), 'Guardar');
      },
    ],
  ] as const)('RD-86 · al %s lo dice, cierra la ventana y quita el tema', async (_, comando, hacer) => {
    const nucleo = await abrirPantalla('themes', 'Temas', Themes, [], (n) => eliminado(n, comando));
    await screen.findByText('Verano');
    await hacer();
    await seDiceYSeQuita(nucleo);
    expect(screen.queryByRole('dialog')).toBeNull();
    await vi.waitFor(() => expect(screen.queryByText('Verano')).toBeNull());
  });
});

describe('RD-86 · Personalización: el tema ya no existe', () => {
  const borrador: ThemeDraftView = {
    theme_id: 't2',
    name: 'Verano',
    content: {
      template_id: 'default',
      background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
      colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
      palette_id: null,
      font: { id: 'nunito', size: 'medium' },
    },
    dirty: true,
    applied_unsaved: false,
    legibility: { ok: true, items: [], suggestion: null },
  };
  const abrir = (comando: CommandName, abierto: ThemeDraftView) =>
    abrirPantalla('personalization', 'Personalización del wallpaper', Personalization, [], (n) => {
      eliminado(n, comando);
      n.responder('theme_draft_open', () => ({ ok: true, value: abierto }));
      n.responder('catalog_list', () => ({ ok: true, value: [] }));
    });
  const lista = () => screen.getByLabelText('Tema en edición') as HTMLSelectElement;

  it.each([
    ['«Guardar»', 'theme_draft_save', 'Guardar'],
    ['«Aplicar»', 'theme_draft_apply', 'Aplicar'],
  ] as const)(
    'RD-86 · %s lo dice como error y el tema en edición sigue a la vista',
    async (_, comando, boton) => {
      const nucleo = await abrir(comando, borrador);
      await act(async () => {
        fireEvent.click(await screen.findByRole('button', { name: boton }));
      });
      await seDiceYSeQuita(nucleo);
      // La lista conserva el tema en edición: sus cambios se pueden guardar como un tema nuevo.
      await vi.waitFor(() => expect(lista().value).toBe('t2'));
      expect([...lista().options].map((o) => o.textContent)).toEqual(['Verano', 'Mi tema']);
    },
  );

  it('RD-86 · elegir en la lista un tema eliminado lo dice y lo quita', async () => {
    const enEdicion = { ...borrador, theme_id: 't1', name: 'Mi tema', dirty: false };
    const nucleo = await abrir('theme_draft_select', enEdicion);
    await screen.findByRole('option', { name: 'Verano' });
    await act(async () => {
      fireEvent.change(lista(), { target: { value: 't2' } });
    });
    await seDiceYSeQuita(nucleo);
    await vi.waitFor(() => expect(screen.queryByRole('option', { name: 'Verano' })).toBeNull());
    expect(lista().value).toBe('t1');
  });
});
