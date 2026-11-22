// HE-06-HU01 · Seleccionar un widget interactivo directamente en el escritorio. Pruebas de la capa (C-02): recibe
// EV-18 al presionar y EV-27 al soltar sin mover el puntero, y solo entonces entrega la selección al widget
// (HE-06-HU08-ET08). Las reglas del Núcleo (íconos, otras ventanas, botón secundario, widgets
// no interactivos) tienen sus pruebas ca_he_06_hu01_* en host_del_wallpaper/seleccion.rs; Raw Input se prueba a
// mano en Windows 11.
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Escuchar } from '@/ipc/eventos';
import type { EventMapPointerReleased, Invoke, LayerInitialState, WidgetRect } from '@/types';
import { Capa } from './Capa';

const WIDGETS: WidgetRect[] = [
  { widget_id: 'reloj', type: 'clock', x: 40, y: 40, width: 320, height: 160, is_active: true },
  { widget_id: 'tareas', type: 'daily_tasks', x: 380, y: 40, width: 360, height: 520, is_active: true },
];

const ESTADO: LayerInitialState = {
  applied: {
    template_id: 'default',
    background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
    colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
    palette_id: null,
    font: { id: 'nunito', size: 'medium' },
  },
  widgets: WIDGETS,
  monitors: [],
  wallpaper_state: 'ok',
};

/** Pinta la capa y devuelve cómo emitir EV-18 `pointer_forwarded` y EV-27 `pointer_released`. */
async function pintar() {
  const invocar = ((comando: string) =>
    Promise.resolve(
      comando === 'layer_get_initial_state'
        ? { ok: true, value: ESTADO }
        : comando === 'asset_resolve'
          ? { ok: true, value: { url: '', state: 'unavailable' } }
          : { ok: false, error: { code: 'internal.unexpected', message: '' } },
    )) as unknown as Invoke;
  const oyentes = new Map<string, Array<(carga: EventMapPointerReleased) => void>>();
  const escuchar = ((evento: string, alRecibir: (carga: EventMapPointerReleased) => void) => {
    oyentes.set(evento, [...(oyentes.get(evento) ?? []), alRecibir]);
    return () => {};
  }) as unknown as Escuchar;
  render(<Capa invocar={invocar} escuchar={escuchar} />);
  const wallpaper = await screen.findByRole('main', { name: 'Wallpaper' });
  const emitir = (evento: string, x: number, y: number) =>
    act(() => (oyentes.get(evento) ?? []).forEach((o) => o({ x, y, monitor_id: '0', button: 'primary' })));
  const presionar = (x: number, y: number) => emitir('pointer_forwarded', x, y);
  const reenviar = async (x: number, y: number) => {
    await presionar(x, y);
    await emitir('pointer_released', x, y);
  };
  return { wallpaper, presionar, reenviar };
}

/** jsdom no calcula posiciones: el elemento en cada punto sale de los rectángulos de los widgets. */
function elementoEn(wallpaper: HTMLElement) {
  return (x: number, y: number) => {
    const w = WIDGETS.find((r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
    return w ? wallpaper.querySelector(`[data-widget-id="${w.widget_id}"]`) : wallpaper;
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HE-06-HU01 · Selección de un widget interactivo', () => {
  it('HE-06-HU01-CA01 · Seleccionar un widget interactivo', async () => {
    const { wallpaper, presionar, reenviar } = await pintar();
    document.elementFromPoint = elementoEn(wallpaper);
    const tareas = within(wallpaper).getByRole('region', { name: 'Tareas del día' });
    expect(tareas.dataset.interactivo).toBe('true');
    const seleccion = vi.fn();
    tareas.addEventListener('click', seleccion);
    // HE-06-HU08-ET08: presionar (EV-18) todavía no selecciona; solo empieza un posible arrastre.
    await presionar(400, 100);
    expect(seleccion).not.toHaveBeenCalled();
    // ET03: la selección con el botón principal que reenvía el Núcleo llega al elemento del widget al soltar.
    await reenviar(400, 100);
    expect(seleccion).toHaveBeenCalledTimes(1);
  });

  it('HE-06-HU01-CA02 · Seleccionar un widget que no es interactivo', async () => {
    const { wallpaper, reenviar } = await pintar();
    document.elementFromPoint = elementoEn(wallpaper);
    const reloj = within(wallpaper).getByRole('region', { name: 'Reloj' });
    // ET02: el Reloj no es interactivo; aunque llegara una selección, no ejecuta ninguna acción.
    expect(reloj.dataset.interactivo).toBe('false');
    const seleccion = vi.fn();
    reloj.addEventListener('click', seleccion);
    await reenviar(100, 100);
    expect(seleccion).not.toHaveBeenCalled();
  });
});
