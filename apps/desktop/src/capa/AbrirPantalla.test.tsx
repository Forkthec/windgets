// HE-06-HU08 · Abrir la pantalla relacionada de la aplicación desde un widget interactivo. Cada CA se prueba en sus
// dos lados: la capa (C-02) pide la pantalla con IPC-DESK-03 `app_open_screen`, y la ventana principal (C-01), al
// recibir EV-23 `navigate_requested` con esa carga, abre la pantalla con el detalle, el panel o la vista. Las
// selecciones llegan como las entrega la capa (HE-06-HU01, `entregarSeleccion`). Hoy es el 14/11/2026.
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArrastreReenviado } from '@/ipc/arrastreReenviado';
import { Calendario } from '@/screens/calendar/Calendario';
import { Kanban } from '@/screens/kanban/Kanban';
import { PlannerDaily } from '@/screens/planner_daily/PlannerDaily';
import type { AppOpenScreenParams, Card, LayerInitialState } from '@/types';
import { VentanaPrincipal } from '@/ventana_principal/VentanaPrincipal';
import { crearNucleo, fijarHoy, HOY, llamadasA, tarjeta } from '../screens/kanban/pruebas';
import { Capa } from './Capa';

const ESTADO: LayerInitialState = {
  applied: {
    template_id: 'default',
    background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
    colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
    palette_id: null,
    font: { id: 'nunito', size: 'medium' },
  },
  // Los cuatro widgets por defecto (H-D-18).
  widgets: [
    { widget_id: 'reloj', type: 'clock', x: 40, y: 40, width: 320, height: 160, is_active: true },
    { widget_id: 'calendario', type: 'calendar', x: 40, y: 220, width: 320, height: 340, is_active: true },
    { widget_id: 'tareas', type: 'daily_tasks', x: 380, y: 40, width: 360, height: 520, is_active: true },
    { widget_id: 'kanban', type: 'kanban', x: 760, y: 40, width: 640, height: 520, is_active: true },
  ],
  monitors: [],
  wallpaper_state: 'ok',
};

const elementFromPoint = document.elementFromPoint;
beforeEach(() => {
  fijarHoy();
});
afterEach(() => {
  document.elementFromPoint = elementFromPoint;
  vi.useRealTimers();
});

/** Pinta la capa con los widgets por defecto y las tarjetas indicadas. */
async function pintarCapa(tarjetas: Card[] = []) {
  const n = crearNucleo(tarjetas);
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  const oyentes: Array<(a: ArrastreReenviado) => void> = [];
  const escucharArrastre = (alRecibir: (a: ArrastreReenviado) => void) => {
    oyentes.push(alRecibir);
    return () => void oyentes.splice(oyentes.indexOf(alRecibir), 1);
  };
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} escucharArrastre={escucharArrastre} />);
  await screen.findByRole('region', { name: 'Kanban' });
  await act(async () => {});
  const widget = (nombre: string) => screen.getByRole('region', { name: nombre });

  /** La selección que reenvía el Núcleo sobre `elemento` (EV-18) y, si se pide, la soltada en el mismo punto. */
  const seleccionar = async (elemento: Element, soltar = false) => {
    document.elementFromPoint = () => elemento;
    n.nucleo.emitir('pointer_forwarded', { x: 50, y: 50, monitor_id: '0', button: 'primary' });
    if (soltar) await act(async () => oyentes.forEach((o) => o({ x: 50, y: 50, phase: 'up' })));
    await act(async () => {});
  };
  const pedidas = () => llamadasA(n.nucleo, 'app_open_screen') as AppOpenScreenParams[];
  return { ...n, widget, seleccionar, pedidas };
}

/** Abre la ventana principal con sesión iniciada en el Planificador diario. */
async function abrirAplicacion(tarjetas: Card[] = []) {
  const n = crearNucleo(tarjetas);
  render(
    <VentanaPrincipal
      invocar={n.invocar}
      escuchar={n.escuchar}
      pantallas={{ planner_daily: PlannerDaily, kanban: Kanban, calendar: Calendario }}
    />,
  );
  await screen.findByRole('main', { name: 'Planificador diario' });
  await act(async () => {});
  /** El Núcleo emite EV-23 con lo que pidió la capa (IPC-DESK-03). */
  const navegar = async (pedido: AppOpenScreenParams) => {
    n.nucleo.emitir('navigate_requested', pedido);
    await act(async () => {});
    await act(async () => {});
  };
  return { ...n, navegar };
}

const PAGAR = tarjeta({ title: 'Pagar la luz', due_date: HOY });
const INFORME = tarjeta({ title: 'Entregar informe', due_date: '2026-11-20' });

describe('HE-06-HU08 · Abrir la pantalla relacionada desde un widget', () => {
  it('HE-06-HU08-CA01 · Abrir el detalle de una tarjeta de Tareas del día', async () => {
    const capa = await pintarCapa([PAGAR]);
    const tareas = capa.widget('Tareas del día');
    // ET01: la tarjeta, fuera de la casilla y de «⋮», abre su detalle.
    await capa.seleccionar(within(tareas).getByText('Pagar la luz'));
    expect(capa.pedidas()).toEqual([{ screen: 'planner_daily', params: { card_id: PAGAR.id } }]);
    // La casilla y «⋮» no abren pantallas.
    await capa.seleccionar(within(tareas).getByRole('button', { name: '⋮' }));
    await capa.seleccionar(within(tareas).getByRole('checkbox', { name: 'Pagar la luz' }));
    expect(capa.pedidas()).toHaveLength(1);
    // ET07: un widget que no es interactivo (Reloj) no abre pantallas.
    await capa.seleccionar(capa.widget('Reloj'));
    expect(capa.pedidas()).toHaveLength(1);

    document.body.innerHTML = '';
    const app = await abrirAplicacion([PAGAR]);
    await app.navegar({ screen: 'planner_daily', params: { card_id: PAGAR.id } });
    // El Planificador diario con el Detalle de tarjeta de esa tarjeta (RT-02).
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    const detalle = await screen.findByRole('dialog', { name: 'Detalle de tarjeta' });
    expect(within(detalle).getByText('Pagar la luz')).toBeTruthy();
    expect(llamadasA(app.nucleo, 'card_get')).toEqual([{ id: PAGAR.id }]);
  });

  it('HE-06-HU08-CA02 · Abrir el planificador diario desde Tareas del día', async () => {
    const capa = await pintarCapa([PAGAR]);
    // ET02, ET03: un espacio sin tarjetas del widget.
    const espacio = capa.widget('Tareas del día').firstElementChild;
    expect(espacio).toBeTruthy();
    if (espacio) await capa.seleccionar(espacio);
    expect(capa.pedidas()).toEqual([{ screen: 'planner_daily' }]);

    document.body.innerHTML = '';
    const app = await abrirAplicacion();
    await app.navegar({ screen: 'kanban' });
    await app.navegar({ screen: 'planner_daily' });
    expect(screen.getByRole('main', { name: 'Planificador diario' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('HE-06-HU08-CA03 · Abrir el detalle de una tarjeta del widget Kanban', async () => {
    const capa = await pintarCapa([INFORME]);
    const titulo = within(capa.widget('Kanban')).getByText('Entregar informe');
    // ET05: seleccionada y soltada sin moverla.
    await capa.seleccionar(titulo, true);
    expect(capa.pedidas()).toEqual([{ screen: 'kanban', params: { card_id: INFORME.id } }]);
    expect(llamadasA(capa.nucleo, 'card_move')).toEqual([]);

    document.body.innerHTML = '';
    const app = await abrirAplicacion([INFORME]);
    await app.navegar({ screen: 'kanban', params: { card_id: INFORME.id } });
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    const detalle = await screen.findByRole('dialog', { name: 'Detalle de tarjeta' });
    expect(within(detalle).getByText('Entregar informe')).toBeTruthy();
  });

  it('HE-06-HU08-CA03 · ET05: una tarjeta que se mueve no abre su detalle', async () => {
    const capa = await pintarCapa([INFORME]);
    const titulo = within(capa.widget('Kanban')).getByText('Entregar informe');
    document.elementFromPoint = () => titulo;
    capa.nucleo.emitir('pointer_forwarded', { x: 50, y: 50, monitor_id: '0', button: 'primary' });
    await act(async () => {});
    expect(capa.pedidas()).toEqual([]);
  });

  it('HE-06-HU08-CA04 · Abrir el tablero Kanban desde el widget Kanban', async () => {
    const capa = await pintarCapa([1, 2, 3, 4, 5, 6].map((i) => tarjeta({ title: `Tarjeta ${i}` })));
    const kanban = capa.widget('Kanban');
    // ET04: el encabezado de una columna, el texto «+N más» y los espacios sin tarjetas.
    await capa.seleccionar(within(kanban).getByRole('heading', { name: /En progreso/ }));
    await capa.seleccionar(within(kanban).getByText('+1 más'));
    await capa.seleccionar(within(kanban).getByRole('region', { name: 'Hecho' }));
    expect(capa.pedidas()).toEqual([{ screen: 'kanban' }, { screen: 'kanban' }, { screen: 'kanban' }]);

    document.body.innerHTML = '';
    const app = await abrirAplicacion();
    await app.navegar({ screen: 'kanban' });
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
  });

  it('HE-06-HU08-CA05 · Abrir el panel de un día desde el widget Calendario', async () => {
    const capa = await pintarCapa();
    await capa.seleccionar(within(capa.widget('Calendario')).getByRole('button', { name: '20' }));
    expect(capa.pedidas()).toEqual([{ screen: 'calendar', params: { date: '2026-11-20' } }]);

    document.body.innerHTML = '';
    const app = await abrirAplicacion([INFORME]);
    await app.navegar({ screen: 'calendar', params: { date: '2026-11-20' } });
    // La pantalla Calendario con el Panel del día abierto en ese día.
    expect(screen.getByRole('main', { name: 'Calendario' })).toBeTruthy();
    const panel = await screen.findByRole('region', { name: 'Panel del día' });
    expect(within(panel).getByRole('heading', { name: '20/11/2026' })).toBeTruthy();
    expect(within(panel).getByText('Entregar informe')).toBeTruthy();
  });

  it('HE-06-HU08-CA06 · Abrir la vista mensual desde el widget Calendario', async () => {
    const capa = await pintarCapa();
    await capa.seleccionar(within(capa.widget('Calendario')).getByRole('button', { name: 'Noviembre 2026' }));
    expect(capa.pedidas()).toEqual([{ screen: 'calendar', params: { calendar_view: 'month' } }]);

    document.body.innerHTML = '';
    const app = await abrirAplicacion();
    // Aunque el Calendario ya estuviera abierto en vista semanal, vuelve a la vista mensual.
    await app.navegar({ screen: 'calendar' });
    await act(async () => {
      screen.getByRole('button', { name: 'Semana' }).click();
    });
    expect(screen.queryByRole('heading', { name: 'Noviembre 2026' })).toBeNull();
    await app.navegar({ screen: 'calendar', params: { calendar_view: 'month' } });
    expect(screen.getByRole('heading', { name: 'Noviembre 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeTruthy();
  });

  it('HE-06-HU08-CA07 · Aplicación minimizada', async () => {
    // ET06: la capa siempre pide la pantalla al Núcleo (IPC-DESK-03), que muestra la ventana al frente aunque
    // esté minimizada o solo en el área de notificación (`area_de_notificacion::abrir_pantalla`; se comprueba a
    // mano en Windows). Cada elemento que abre una pantalla pasa por ese comando.
    const capa = await pintarCapa([PAGAR, INFORME]);
    await capa.seleccionar(within(capa.widget('Tareas del día')).getByText('Pagar la luz'));
    await capa.seleccionar(within(capa.widget('Kanban')).getByText('Entregar informe'), true);
    await capa.seleccionar(within(capa.widget('Calendario')).getByRole('button', { name: '14' }));
    expect(capa.pedidas().map((p) => p.screen)).toEqual(['planner_daily', 'kanban', 'calendar']);

    document.body.innerHTML = '';
    const app = await abrirAplicacion([INFORME]);
    // Con la ventana en otra pantalla, EV-23 la lleva a la pantalla correspondiente.
    await app.navegar({ screen: 'kanban', params: { card_id: INFORME.id } });
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
  });
});
