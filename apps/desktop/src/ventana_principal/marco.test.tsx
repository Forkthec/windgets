// docs/rediseno.md RD-28, RD-29, RD-31 y RD-32 · El marco de la ventana principal con sesión. Una prueba por RD. La
// geometría contra el Figma está en e2e/rediseno-marco.spec.ts.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppliedThemeView } from '@/types';
import { Widgets } from '@/screens/widgets/Widgets';
import {
  abrirPantalla,
  fijarHoy,
  llamadasA,
  screen,
  type NucleoDelPlanificador,
} from '@/screens/kanban/pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const PALETAS = {
  claro: { primary: '#F5F0FF', secondary: '#B6A560', text: '#17131D' },
  oscuro: { primary: '#201B2B', secondary: '#5D566B', text: '#F8F5FF' },
};

function aplicado(paleta: keyof typeof PALETAS): AppliedThemeView {
  return {
    theme_id: 't1',
    name: 'Mi tema',
    content: {
      template_id: 'default',
      background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
      colors: PALETAS[paleta],
      palette_id: paleta,
      font: { id: 'rubik', size: 'medium' },
    },
    has_unapplied_changes: false,
    has_unsaved_changes: false,
  };
}

/** Abre Widgets con el tema aplicado en `inicial`; `aplicar` decide si el Núcleo acepta aplicar la paleta. */
async function abrir(inicial: keyof typeof PALETAS, aplicar = true): Promise<NucleoDelPlanificador> {
  let paleta = inicial;
  let enBorrador: keyof typeof PALETAS | null = null;
  return abrirPantalla('widgets', 'Widgets', Widgets, [], (n) => {
    n.responder('theme_get_applied', () => ({ ok: true, value: aplicado(paleta) }));
    n.responder('catalog_list', ({ kind }) => ({
      ok: true,
      value:
        kind === 'palette'
          ? [
              { id: 'claro', name: 'Claro', thumbnail_url: '', is_cached: true },
              { id: 'oscuro', name: 'Oscuro', thumbnail_url: '', is_cached: true },
            ]
          : [{ id: 'rubik', name: 'Rubik', thumbnail_url: '', is_cached: true }],
    }));
    n.responder('widget_list', () => ({ ok: true, value: [] }));
    n.responder('sync_get_status', () => ({
      ok: true,
      value: { status: 'synced', pending_count: 0, last_sync_at: null },
    }));
    n.responder('theme_draft_open', () => ({ ok: true, value: {} as never }));
    n.responder('theme_draft_update', ({ patch }) => {
      enBorrador = patch.palette_id as keyof typeof PALETAS;
      return { ok: true, value: {} as never };
    });
    n.responder('theme_draft_discard', () => ({ ok: true, value: {} as never }));
    n.responder('theme_draft_apply', () => {
      if (!aplicar) return { ok: false, error: { code: 'internal.unexpected', message: '' } };
      if (enBorrador) paleta = enBorrador;
      return { ok: true, value: { theme_id: 't1' } };
    });
  });
}

const modoDeLaVentana = () => document.body.dataset.modo;

describe('Rediseño · marco de la ventana principal con sesión', () => {
  it('RD-28 · La ventana toma el modo del tema aplicado', async () => {
    await abrir('oscuro');
    await waitFor(() => expect(modoDeLaVentana()).toBe('oscuro'));
  });

  it('RD-28 · Un tema de fondo claro deja la ventana en modo claro', async () => {
    await abrir('claro');
    await waitFor(() => expect(modoDeLaVentana()).toBe('claro'));
  });

  it('RD-29 · «Claro» aplica la paleta Claro al tema sin cambiar la tipografía', async () => {
    const nucleo = await abrir('oscuro');
    const selector = await screen.findByRole('radiogroup', { name: 'Apariencia' });
    expect(within(selector).getByRole('radio', { name: 'Oscuro' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(within(selector).getByRole('radio', { name: 'Claro' }));
    await waitFor(() => expect(modoDeLaVentana()).toBe('claro'));
    expect(llamadasA(nucleo, 'theme_draft_update')).toEqual([{ patch: { palette_id: 'claro' } }]);
    expect(llamadasA(nucleo, 'theme_draft_apply')).toEqual([{ mode: 'save_and_apply' }]);
    expect(within(selector).getByRole('radio', { name: 'Claro' }).getAttribute('aria-checked')).toBe('true');
  });

  it('RD-29 · Si no se puede aplicar, el mensaje de RD-15 y el modo no cambia', async () => {
    await abrir('oscuro', false);
    const selector = await screen.findByRole('radiogroup', { name: 'Apariencia' });
    fireEvent.click(within(selector).getByRole('radio', { name: 'Claro' }));
    expect(
      await screen.findByText('No pudimos aplicar el tema Claro. Puedes elegirlo en Personalización.'),
    ).toBeTruthy();
    expect(modoDeLaVentana()).toBe('oscuro');
    expect(within(selector).getByRole('radio', { name: 'Oscuro' }).getAttribute('aria-checked')).toBe('true');
  });

  it('RD-31 · «Ocultar menú» y «Ampliar menú»', async () => {
    await abrir('claro');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar menú' }));
    expect(screen.queryByRole('navigation', { name: 'Menú principal' })).toBeNull();
    // La pantalla sigue abierta.
    expect(screen.getByRole('main', { name: 'Widgets' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar menú' }));
    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    expect(within(menu).getByRole('button', { name: 'Widgets' }).getAttribute('aria-current')).toBe('page');
  });

  it('RD-32 · La sección y el título de la pantalla', async () => {
    await abrir('claro');
    const encabezado = screen.getByRole('banner');
    expect(within(encabezado).getByText('Personalización')).toBeTruthy();
    expect(within(encabezado).getByRole('heading', { level: 1, name: 'Widgets' })).toBeTruthy();
    // El indicador de sincronización va en el encabezado (91:1558).
    expect(within(encabezado).getByText('Sincronizado')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    fireEvent.click(within(menu).getByRole('button', { name: 'Agente de IA' }));
    expect(await within(encabezado).findByRole('heading', { level: 1, name: 'Windi' })).toBeTruthy();
    expect(within(encabezado).getByText('Planificador')).toBeTruthy();
    fireEvent.click(within(menu).getByRole('button', { name: 'Configuración' }));
    expect(await within(encabezado).findByText('Preferencias')).toBeTruthy();
  });
});
