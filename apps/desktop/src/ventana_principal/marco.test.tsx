// docs/rediseno.md RD-62, RD-65 y RD-66 (rediseno_final_backend.md §4.1 y §4.2) · El marco de la ventana principal con sesión. Una prueba por RD. La
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

/** Abre Widgets con el tema aplicado en `inicial`. */
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

describe('Rediseño final · marco de la ventana principal con sesión', () => {
  it('RD-62 · Con sesión no hay modo fijo: la ventana usa los tokens del tema aplicado', async () => {
    await abrir('oscuro');
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue('--wg-marco')).toBe('#201B2B'),
    );
    expect(document.body.dataset.modo).toBeUndefined();
    expect('sesion' in document.body.dataset).toBe(true);
  });

  it('RD-62 · Sin selector Claro/Oscuro en el encabezado (D-01)', async () => {
    await abrir('claro');
    expect(screen.queryByRole('radiogroup', { name: 'Apariencia' })).toBeNull();
  });

  it('RD-65 · Contraer el menú deja solo los íconos y se recuerda en este computador (D-25)', async () => {
    const nucleo = await abrir('claro');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar menú' }));
    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    // La pantalla sigue abierta y su opción sigue marcada.
    expect(screen.getByRole('main', { name: 'Widgets' })).toBeTruthy();
    expect(within(menu).getByRole('button', { name: 'Widgets' }).getAttribute('aria-current')).toBe('page');
    expect(within(menu).getByRole('button', { name: 'Widgets' }).textContent).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar menú' }));
    expect(within(menu).getByRole('button', { name: 'Widgets' }).textContent).toBe('Widgets');
    expect(llamadasA(nucleo, 'app_set_menu_collapsed')).toEqual([{ collapsed: true }, { collapsed: false }]);
  });

  it('RD-65 · El menú abre contraído si así quedó', async () => {
    await abrirPantalla('widgets', 'Widgets', Widgets, [], (n) => {
      n.responder('app_get_menu_collapsed', () => ({ ok: true, value: { collapsed: true } }));
      n.responder('widget_list', () => ({ ok: true, value: [] }));
    });
    expect(await screen.findByRole('button', { name: 'Ampliar menú' })).toBeTruthy();
  });

  it('RD-65 · «Cerrar sesión» al pie del menú abre M-11', async () => {
    await abrir('claro');
    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    fireEvent.click(within(menu).getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('RD-66 · La miga de pan y el título de la pantalla', async () => {
    await abrir('claro');
    const encabezado = screen.getByRole('banner');
    expect(within(encabezado).getByText('Personalización › Widgets')).toBeTruthy();
    expect(within(encabezado).getByRole('heading', { level: 1, name: 'Widgets' })).toBeTruthy();
    // El indicador de sincronización va en el encabezado (91:1558).
    expect(within(encabezado).getByText('Sincronizado')).toBeTruthy();
    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    fireEvent.click(within(menu).getByRole('button', { name: 'Tablero Kanban' }));
    expect(await within(encabezado).findByText('Planificador › Tablero Kanban')).toBeTruthy();
    fireEvent.click(within(menu).getByRole('button', { name: 'Configuración' }));
    // A-04: la miga de Configuración es «Configuración».
    expect(await within(encabezado).findByRole('heading', { level: 1, name: 'Configuración' })).toBeTruthy();
    expect(encabezado.querySelector('.wg-encabezado-pantalla__seccion')?.textContent).toBe('Configuración');
  });
});
