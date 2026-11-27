// HE-03-HU06 · Consultar la aplicación con los colores del tema y la tipografía del tema aplicado. Una prueba por
// CA en la vista; el Núcleo tiene ca_he_03_hu06_ca04 y ca08 en servicio_de_personalizacion_y_configuracion
// (pruebas_de_temas.rs). Que con «Grande» ningún texto se corte (CA03) se revisa además a mano en Windows 11.
import { waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentType } from 'react';
import type { AppliedThemeView } from '@/types';
import { Labels } from '@/screens/labels/Labels';
import { Settings } from '@/screens/settings/Settings';
import {
  abrirPantalla,
  fijarHoy,
  llamadasA,
  screen,
  type NucleoDelPlanificador,
} from '@/screens/kanban/pruebas';
import { TOKENS_POR_DEFECTO } from '@/ui/tema/tokens_por_defecto';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const token = (nombre: string) => document.documentElement.style.getPropertyValue(`--wg-${nombre}`);

function aplicado(cambios: Partial<AppliedThemeView['content']> = {}): AppliedThemeView {
  return {
    theme_id: 't1',
    name: 'Mi tema',
    content: {
      template_id: 'default',
      background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
      colors: { primary: '#0B3954', secondary: '#087E8B', text: '#F5F5F5' },
      palette_id: null,
      font: { id: 'inter', size: 'medium' },
      ...cambios,
    },
    has_unapplied_changes: false,
    has_unsaved_changes: false,
  };
}

/** Abre una pantalla con el tema aplicado que diga `tema()`, y el catálogo de tipografías. */
async function abrir(
  tema: () => AppliedThemeView,
  pantalla: Parameters<typeof abrirPantalla>[0] = 'labels',
  nombre = 'Etiquetas',
  componente: ComponentType = Labels,
): Promise<NucleoDelPlanificador> {
  const nucleo = await abrirPantalla(pantalla, nombre, componente, [], (n) => {
    n.responder('theme_get_applied', () => ({ ok: true, value: tema() }));
    n.responder('catalog_list', ({ kind }) => ({
      ok: true,
      value:
        kind === 'font'
          ? [
              { id: 'nunito', name: 'Nunito', thumbnail_url: '', is_cached: true },
              { id: 'inter', name: 'Inter', thumbnail_url: '', is_cached: true },
            ]
          : [],
    }));
  });
  await waitFor(() => expect(token('marco')).not.toBe(''));
  return nucleo;
}

describe('HE-03-HU06 · La aplicación con el tema aplicado', () => {
  it('HE-03-HU06-CA01 · Aplicación con el tema aplicado', async () => {
    await abrir(() => aplicado());
    // ET01, ET02 (interfaz.md, «Tema a tokens»): el marco con el principal, la acción con el secundario y la
    // tinta con el del texto; la fuente del tema.
    await waitFor(() => expect(token('marco')).toBe('#0B3954'));
    expect(token('tinta')).toBe('#F5F5F5');
    expect(token('accion')).toBe('#4FA2AB');
    expect(token('fuente')).toContain('Inter');
    expect(token('tamano-fuente')).toBe('14px');
  });

  it('HE-03-HU06-CA02 · Aplicar colores del tema', async () => {
    let tema = aplicado();
    const nucleo = await abrir(() => tema);
    await waitFor(() => expect(token('marco')).toBe('#0B3954'));
    // Al aplicar llega EV-11 y la aplicación toma el color nuevo sin reiniciarse (ET04).
    tema = aplicado({ colors: { primary: '#AA3300', secondary: '#087E8B', text: '#F5F5F5' } });
    nucleo.emitir('applied_theme_changed', { theme_id: 't1', origin: 'local', has_unsaved_draft: false });
    await waitFor(() => expect(token('marco')).toBe('#AA3300'));
  });

  it('HE-03-HU06-CA03 · Tipografía de tamaño grande', async () => {
    await abrir(() => aplicado({ font: { id: 'inter', size: 'large' } }));
    // ET05: el tamaño del texto de toda la aplicación es el «Grande» del tema (18 px, P4 y RD-107).
    await waitFor(() => expect(token('tamano-fuente')).toBe('18px'));
  });

  it('HE-03-HU06-CA04 · Cambios guardados o sin aplicar no afectan la aplicación', async () => {
    let tema = aplicado();
    const nucleo = await abrir(() => tema);
    await waitFor(() => expect(token('marco')).toBe('#0B3954'));
    // ET06: guardar (EV-10) no aplica nada; la aplicación sigue con la última versión aplicada.
    tema = aplicado({ colors: { primary: '#AA3300', secondary: '#087E8B', text: '#F5F5F5' } });
    nucleo.emitir('themes_changed', { ids: ['t1'], op: 'upsert', origin: 'local' });
    await new Promise((r) => setTimeout(r, 0));
    expect(token('marco')).toBe('#0B3954');
    expect(llamadasA(nucleo, 'theme_get_applied')).toHaveLength(1);
  });

  it('HE-03-HU06-CA05 · Aplicar un tema guardado', async () => {
    let tema = aplicado();
    const nucleo = await abrir(() => tema);
    await waitFor(() => expect(token('marco')).toBe('#0B3954'));
    tema = { ...aplicado({ font: { id: 'nunito', size: 'small' } }), theme_id: 't2', name: 'Verano' };
    nucleo.emitir('applied_theme_changed', { theme_id: 't2', origin: 'local', has_unsaved_draft: false });
    await waitFor(() => expect(token('fuente')).toContain('Nunito'));
    expect(token('tamano-fuente')).toBe('12px');
  });

  it('HE-03-HU06-CA06 · Colores de etiquetas y columnas', async () => {
    await abrir(() => aplicado());
    // ET03: cada etiqueta conserva el color del catálogo de colores, aunque el tema tenga otros colores.
    const lista = await screen.findByRole('list', { name: 'Lista de etiquetas' });
    const muestras = Array.from(lista.querySelectorAll<HTMLElement>('.wg-muestra-color'));
    expect(muestras.map((m) => m.style.background)).toEqual(['rgb(33, 150, 243)', 'rgb(76, 175, 80)']);
  });

  it('HE-03-HU06-CA07 · Sin modo claro ni oscuro', async () => {
    await abrir(() => aplicado(), 'settings', 'Configuración', Settings);
    const configuracion = screen.getByRole('main', { name: 'Configuración' });
    // ET01: ninguna opción de modo claro, modo oscuro, colores ni tipografía propios de la aplicación.
    expect(within(configuracion).queryByText(/modo claro|modo oscuro|tema claro|tema oscuro/i)).toBeNull();
    expect(within(configuracion).queryByText(/colores|tipografía|fuente/i)).toBeNull();
  });

  it('HE-03-HU06-CA08 · Primer inicio de sesión', async () => {
    await abrir(() =>
      aplicado({
        // P29 (0008): la plantilla por defecto «Windgets» con los colores de la marca y Rubik.
        colors: { primary: '#201B2B', secondary: '#DC026C', text: '#FFFFFF' },
        font: { id: 'rubik', size: 'medium' },
      }),
    );
    // ET07: los colores y la tipografía de la plantilla por defecto.
    await waitFor(() => expect(token('marco')).toBe(TOKENS_POR_DEFECTO.marco));
    for (const nombre of ['superficie', 'tinta', 'accion', 'borde'] as const) {
      expect(token(nombre)).toBe(TOKENS_POR_DEFECTO[nombre]);
    }
    expect(token('fuente')).toContain('Rubik');
  });
});
