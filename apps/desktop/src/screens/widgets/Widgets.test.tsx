// HE-04 en P07 · Widgets. Una prueba por CA en la vista; las reglas del Núcleo tienen su prueba ca_he_04_* en
// servicio_de_personalizacion_y_configuracion/pruebas_de_widgets.rs.
import { render, screen as pantalla, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Capa } from '@/capa/Capa';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, LayerInitialState, WidgetItem, WidgetRect } from '@/types';
import { abrirPantalla, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Widgets } from './Widgets';

function widget(datos: Partial<WidgetItem> & Pick<WidgetItem, 'widget_id' | 'type' | 'display_name'>) {
  return {
    distinguishing_value: null,
    is_default: false,
    is_active: true,
    can_configure: false,
    can_delete: true,
    paused_by_load: false,
    config: {},
    ...datos,
  } as WidgetItem;
}

const POR_DEFECTO: WidgetItem[] = [
  widget({ widget_id: 'reloj', type: 'clock', display_name: 'Reloj', is_default: true, can_delete: false }),
  widget({
    widget_id: 'cal',
    type: 'calendar',
    display_name: 'Calendario',
    is_default: true,
    can_delete: false,
  }),
  widget({
    widget_id: 'tareas',
    type: 'daily_tasks',
    display_name: 'Tareas del día',
    is_default: true,
    can_delete: false,
  }),
  widget({
    widget_id: 'kanban',
    type: 'kanban',
    display_name: 'Kanban',
    is_default: true,
    can_delete: false,
  }),
];

const AGREGADOS: WidgetItem[] = [
  widget({
    widget_id: 'clima',
    type: 'weather',
    display_name: 'Clima',
    distinguishing_value: 'Bogotá',
    can_configure: true,
    config: { city: 'Bogotá' },
  }),
  widget({
    widget_id: 'texto',
    type: 'text',
    display_name: 'Texto',
    distinguishing_value: 'Hola',
    can_configure: true,
  }),
  widget({ widget_id: 'noticias', type: 'news', display_name: 'Noticias', is_active: false }),
];

/** Abre Widgets con la lista que devuelve el Núcleo (ya en orden). */
async function abrir(lista: WidgetItem[]): Promise<NucleoDelPlanificador & { widgets: WidgetItem[] }> {
  const widgets = lista.map((w) => ({ ...w }));
  const nucleo = await abrirPantalla('widgets', 'Widgets', Widgets, [], (n) =>
    n.responder('widget_list', () => ({ ok: true, value: widgets.map((w) => ({ ...w })) })),
  );
  await screen.findByRole('list', { name: 'Lista de widgets' });
  return Object.assign(nucleo, { widgets });
}

function filas() {
  return within(screen.getByRole('list', { name: 'Lista de widgets' })).getAllByRole('listitem');
}

function fila(i: number): HTMLElement {
  const f = filas()[i];
  if (!f) throw new Error(`No hay fila ${i}`);
  return f;
}

/** La capa del escritorio con los rectángulos de los widgets activos que da el Núcleo. */
async function pintarCapa(widgets: WidgetRect[]) {
  const estado: LayerInitialState = {
    applied: {
      template_id: 'default',
      background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
      colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
      palette_id: null,
      font: { id: 'nunito', size: 'medium' },
    },
    widgets,
    monitors: [],
    wallpaper_state: 'ok',
  };
  const invocar = ((comando: string) =>
    Promise.resolve(
      comando === 'layer_get_initial_state'
        ? { ok: true, value: estado }
        : { ok: true, value: { url: '', state: 'unavailable' } },
    )) as unknown as Invoke;
  const escuchar = (() => () => {}) as unknown as Escuchar;
  const { unmount } = render(<Capa invocar={invocar} escuchar={escuchar} />);
  const wallpaper = await pantalla.findByRole('main', { name: 'Wallpaper' });
  return { wallpaper, unmount };
}

describe('HE-04-HU01 · Widgets', () => {
  it('HE-04-HU01-CA01 · Widgets por defecto al primer inicio', async () => {
    await abrir(POR_DEFECTO);
    // ET01, ET04: Reloj, Calendario, Tareas del día y Kanban con el interruptor «Activo».
    expect(filas().map((f) => f.querySelector('.wg-lista__nombre')?.textContent)).toEqual([
      'Reloj',
      'Calendario',
      'Tareas del día',
      'Kanban',
    ]);
    for (const fila of filas()) {
      expect(within(fila).getByRole('switch').getAttribute('aria-checked')).toBe('true');
      expect(within(fila).getByText('Activo')).toBeTruthy();
    }
    // La capa los pinta sobre el wallpaper en su posición por defecto (H-D-18).
    const { wallpaper, unmount } = await pintarCapa([
      { widget_id: 'reloj', type: 'clock', x: 40, y: 40, width: 320, height: 160, is_active: true },
      { widget_id: 'cal', type: 'calendar', x: 40, y: 220, width: 320, height: 340, is_active: true },
      { widget_id: 'tareas', type: 'daily_tasks', x: 380, y: 40, width: 360, height: 520, is_active: true },
      { widget_id: 'kanban', type: 'kanban', x: 760, y: 40, width: 640, height: 520, is_active: true },
    ]);
    const reloj = within(wallpaper).getByRole('region', { name: 'Reloj' });
    expect([reloj.style.left, reloj.style.top, reloj.style.width, reloj.style.height]).toEqual([
      '40px',
      '40px',
      '320px',
      '160px',
    ]);
    expect(
      within(wallpaper)
        .getAllByRole('region')
        .map((r) => r.getAttribute('aria-label')),
    ).toEqual(['Reloj', 'Calendario', 'Tareas del día', 'Kanban']);
    unmount();
  });

  it('HE-04-HU01-CA02 · Consultar la lista de widgets', async () => {
    await abrir([...POR_DEFECTO, ...AGREGADOS]);
    expect(screen.getByRole('button', { name: 'Agregar widget' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Editar escritorio' })).toBeTruthy();
    const [reloj, clima, texto, noticias] = [fila(0), fila(4), fila(5), fila(6)];
    // ET02: primero los por defecto y luego los agregados; ET03: nombre, tipo, dato, interruptor y opciones.
    expect(within(reloj).getByText('Reloj')).toBeTruthy();
    expect(within(reloj).getByText('Por defecto')).toBeTruthy();
    expect(within(reloj).queryByRole('button', { name: 'Configurar' })).toBeNull();
    expect(within(reloj).queryByRole('button', { name: 'Eliminar' })).toBeNull();
    expect(within(clima).getByText('Clima')).toBeTruthy();
    expect(within(clima).getByText('Bogotá')).toBeTruthy();
    expect(within(clima).getByText('Externo')).toBeTruthy();
    expect(within(clima).getByText('Activo')).toBeTruthy();
    expect(within(clima).getByRole('button', { name: 'Configurar' })).toBeTruthy();
    expect(within(clima).getByRole('button', { name: 'Eliminar' })).toBeTruthy();
    expect(within(texto).getByText('Local')).toBeTruthy();
    expect(within(noticias).getByText('Externo')).toBeTruthy();
    expect(within(noticias).getByText('Inactivo')).toBeTruthy();
    expect(within(noticias).queryByRole('button', { name: 'Configurar' })).toBeNull();
  });

  it('HE-04-HU01-CA03 · Todos los widgets inactivos', async () => {
    await abrir(POR_DEFECTO.map((w) => ({ ...w, is_active: false })));
    for (const fila of filas()) {
      expect(within(fila).getByRole('switch').getAttribute('aria-checked')).toBe('false');
      expect(within(fila).getByText('Inactivo')).toBeTruthy();
    }
    // ET05: el Núcleo no da rectángulos y la capa muestra solo el wallpaper.
    const { wallpaper, unmount } = await pintarCapa([]);
    expect(within(wallpaper).queryAllByRole('region')).toHaveLength(0);
    unmount();
  });
});
