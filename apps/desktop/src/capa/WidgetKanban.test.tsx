// HE-06-HU05 y HE-06-HU06 · Widget Kanban en la capa (C-02). Una prueba por CA en la vista; las reglas del Núcleo
// tienen sus pruebas en servicio_del_planificador/pruebas_del_widget_kanban.rs (orden, cantidades, 5 títulos,
// «+N más», completar al llegar a Hecho y al salir) y host_del_wallpaper/seleccion.rs (el arrastre reenviado).
// jsdom no calcula posiciones: cada punto del arrastre se asocia al elemento que hay en él.
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ArrastreReenviado } from '@/ipc/arrastreReenviado';
import type { Card, LayerInitialState, WidgetRect } from '@/types';
import {
  crearNucleo,
  EN_PROGRESO,
  HECHO,
  HOY,
  llamadasA,
  POR_HACER,
  tarjeta,
} from '../screens/kanban/pruebas';
import estilos from '@/ui/tema/tokens.css?raw';
import { Capa } from './Capa';

const KANBAN: WidgetRect = {
  widget_id: 'kanban',
  type: 'kanban',
  x: 760,
  y: 40,
  width: 560,
  height: 360,
  is_active: true,
};
const TAREAS: WidgetRect = {
  widget_id: 'tareas',
  type: 'daily_tasks',
  x: 380,
  y: 40,
  width: 360,
  height: 520,
  is_active: true,
};

function estado(widgets: WidgetRect[]): LayerInitialState {
  return {
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
    wallpaper_fit: [],
  };
}

const elementFromPoint = document.elementFromPoint;
afterEach(() => {
  document.elementFromPoint = elementFromPoint;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** Pinta la capa con el widget Kanban activo (y los demás indicados) y las tarjetas indicadas. */
async function pintar(tarjetas: Card[] = [], widgets: WidgetRect[] = [KANBAN]) {
  const n = crearNucleo(tarjetas);
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: estado(widgets) }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  const oyentes: Array<(a: ArrastreReenviado) => void> = [];
  const escucharArrastre = (alRecibir: (a: ArrastreReenviado) => void) => {
    oyentes.push(alRecibir);
    return () => void oyentes.splice(oyentes.indexOf(alRecibir), 1);
  };
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} escucharArrastre={escucharArrastre} />);
  const widget = await screen.findByRole('region', { name: 'Kanban' });
  await act(async () => {});

  // Cada punto de la capa y el elemento que hay en él.
  const puntos = new Map<string, Element>();
  document.elementFromPoint = (x: number, y: number) => puntos.get(`${x},${y}`) ?? null;
  let siguiente = 0;
  const punto = (elemento: Element | null) => {
    siguiente += 10;
    if (elemento) puntos.set(`${siguiente},${siguiente}`, elemento);
    return { x: siguiente, y: siguiente };
  };
  const reenviarArrastre = async (a: ArrastreReenviado) => {
    await act(async () => oyentes.forEach((o) => o(a)));
  };

  /** Selecciona `desde` (EV-18), lo lleva sobre `hasta` y suelta el botón ahí (`null`: fuera del widget). */
  const arrastrar = async (desde: Element, hasta: Element | null, alMover?: () => void) => {
    const inicio = punto(desde);
    n.nucleo.emitir('pointer_forwarded', { ...inicio, monitor_id: '0', button: 'primary' });
    const fin = punto(hasta);
    await reenviarArrastre({ ...fin, phase: 'move' });
    alMover?.();
    await reenviarArrastre({ ...fin, phase: 'up' });
    await act(async () => {});
  };
  return { ...n, widget, arrastrar };
}

function titulo(widget: HTMLElement, texto: string) {
  return within(widget).getByText(texto);
}

function columna(widget: HTMLElement, nombre: string) {
  return within(widget).getByRole('region', { name: nombre });
}

/** Cada columna del widget: nombre, cantidad, títulos y «+N más». */
function columnas(widget: HTMLElement) {
  return within(widget)
    .getAllByRole('region')
    .map((columna) => {
      const encabezado = within(columna).getByRole('heading');
      const [, nombre, cantidad] = Array.from(encabezado.children).map((h) => h.textContent);
      return {
        nombre,
        cantidad,
        titulos: within(columna)
          .queryAllByRole('listitem')
          .map((li) => li.textContent),
        mas: columna.querySelector('.wg-columna__mas')?.textContent ?? null,
      };
    });
}

function color(widget: HTMLElement, columna: string) {
  const region = within(widget).getByRole('region', { name: columna });
  return (region.querySelector('.wg-muestra-color') as HTMLElement).style.background;
}

describe('HE-06-HU05 · Tablero Kanban en el widget', () => {
  it('HE-06-HU05-CA01 · Tablero en el widget', async () => {
    const { widget } = await pintar([
      tarjeta({ title: 'Entregar informe' }),
      tarjeta({ title: 'Estudiar redes', column_id: EN_PROGRESO.id }),
      tarjeta({ title: 'Leer capítulo 3' }),
      tarjeta({ title: 'Pagar la luz', column_id: HECHO.id }),
    ]);
    // ET01: las columnas en el orden del tablero, con nombre, color y cantidad. ET02: los títulos.
    expect(columnas(widget)).toEqual([
      { nombre: 'Por hacer', cantidad: '2', titulos: ['Entregar informe', 'Leer capítulo 3'], mas: null },
      { nombre: 'En progreso', cantidad: '1', titulos: ['Estudiar redes'], mas: null },
      { nombre: 'Hecho', cantidad: '1', titulos: ['Pagar la luz'], mas: null },
    ]);
    expect(color(widget, 'Por hacer')).toBe('rgb(158, 158, 158)');
    expect(color(widget, 'En progreso')).toBe('rgb(33, 150, 243)');
    expect(color(widget, 'Hecho')).toBe('rgb(76, 175, 80)');
    expect(within(widget).queryByText('Tu tablero no tiene tarjetas.')).toBeNull();
  });

  it('HE-06-HU05-CA02 · Tarjeta movida', async () => {
    const informe = tarjeta({ title: 'Entregar informe' });
    const { nucleo, widget } = await pintar([informe, tarjeta({ title: 'Leer capítulo 3' })]);
    // Movida en el tablero Kanban: llega EV-07 y el widget se actualiza sin otra lectura (ET03, RNF-01).
    await act(async () => {
      await nucleo.responderYMover({
        card_id: informe.id,
        column_id: EN_PROGRESO.id,
        placement: { kind: 'end' },
      });
    });
    const [porHacer, enProgreso] = columnas(widget);
    expect(porHacer).toMatchObject({ cantidad: '1', titulos: ['Leer capítulo 3'] });
    expect(enProgreso).toMatchObject({ cantidad: '1', titulos: ['Entregar informe'] });
  });

  it('HE-06-HU05-CA03 · Más de 5 tarjetas en una columna', async () => {
    const tarjetas = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => tarjeta({ title: `Tarjeta ${i}` }));
    const { widget } = await pintar(tarjetas);
    const [porHacer] = columnas(widget);
    expect(porHacer).toEqual({
      nombre: 'Por hacer',
      cantidad: '8',
      titulos: ['Tarjeta 1', 'Tarjeta 2', 'Tarjeta 3', 'Tarjeta 4', 'Tarjeta 5'],
      mas: '+3 más',
    });
  });

  it('HE-06-HU05-CA04 · Tablero sin tarjetas', async () => {
    const { widget } = await pintar();
    // Las columnas vacías y el estado vacío del tablero (RT-04).
    expect(columnas(widget)).toEqual(
      [POR_HACER, EN_PROGRESO, HECHO].map((c) => ({ nombre: c.name, cantidad: '0', titulos: [], mas: null })),
    );
    expect(within(widget).getByText('Tu tablero no tiene tarjetas.')).toBeTruthy();
  });
});

describe('HE-06-HU06 · Mover tarjetas con drag-and-drop en el widget Kanban', () => {
  it('HE-06-HU06-CA01 · Mover una tarjeta a otra columna', async () => {
    const { nucleo, widget, arrastrar } = await pintar([
      tarjeta({ title: 'Entregar informe' }),
      tarjeta({ title: 'Leer capítulo 3' }),
      tarjeta({ title: 'Estudiar redes', column_id: EN_PROGRESO.id }),
    ]);
    // ET01: se arrastra la tarjeta sobre la columna En progreso (al final) y se suelta ahí.
    await arrastrar(titulo(widget, 'Entregar informe'), columna(widget, 'En progreso'), () => {
      // Mientras se arrastra, la tarjeta sigue al puntero y la columna de destino se marca.
      expect(titulo(widget, 'Entregar informe').classList.contains('wg-tarjeta--arrastrada')).toBe(true);
      expect(columna(widget, 'En progreso').classList.contains('wg-columna--destino')).toBe(true);
    });
    expect(llamadasA(nucleo, 'card_move')).toEqual([
      { card_id: nucleo.tarjetas[0]?.id, column_id: EN_PROGRESO.id, placement: { kind: 'end' } },
    ]);
    // El widget muestra la tarjeta en la columna de destino y las cantidades de ambas columnas al día.
    expect(columnas(widget).slice(0, 2)).toEqual([
      { nombre: 'Por hacer', cantidad: '1', titulos: ['Leer capítulo 3'], mas: null },
      { nombre: 'En progreso', cantidad: '2', titulos: ['Estudiar redes', 'Entregar informe'], mas: null },
    ]);
    // Soltada sobre otra tarjeta, queda antes de ella (IPC-CARD-06 «before», como en el tablero).
    await arrastrar(titulo(widget, 'Leer capítulo 3'), titulo(widget, 'Estudiar redes'));
    expect(columnas(widget)[1]?.titulos).toEqual(['Leer capítulo 3', 'Estudiar redes', 'Entregar informe']);
  });

  it('HE-06-HU06-CA01 · ET02: las tarjetas de «+N más» no se arrastran', async () => {
    const tarjetas = [1, 2, 3, 4, 5, 6].map((i) => tarjeta({ title: `Tarjeta ${i}` }));
    const { nucleo, widget, arrastrar } = await pintar(tarjetas);
    await arrastrar(within(widget).getByText('+1 más'), columna(widget, 'En progreso'));
    expect(llamadasA(nucleo, 'card_move')).toEqual([]);
  });

  it('HE-06-HU06-CA02 · Mover una tarjeta a Hecho', async () => {
    const pagar = tarjeta({ title: 'Pagar la luz', due_date: HOY, column_id: EN_PROGRESO.id });
    const { nucleo, widget, arrastrar } = await pintar([pagar], [TAREAS, KANBAN]);
    const tareas = screen.getByRole('region', { name: 'Tareas del día' });
    const tachada = () =>
      within(tareas)
        .getByRole('checkbox', { name: 'Pagar la luz' })
        .closest('li')
        ?.classList.contains('wg-tachada');
    expect(tachada()).toBe(false);
    await arrastrar(within(widget).getByText('Pagar la luz'), columna(widget, 'Hecho'));
    // ET03: completada y con la fecha de completado de hoy.
    expect(llamadasA(nucleo, 'card_move')).toEqual([
      { card_id: pagar.id, column_id: HECHO.id, placement: { kind: 'end' } },
    ]);
    expect(pagar).toMatchObject({ is_completed: true, completed_on: HOY });
    // El Núcleo avisa con EV-07 y Tareas del día la muestra tachada, porque es del día.
    nucleo.emitir('cards_changed', { ids: [pagar.id], op: 'upsert', origin: 'local' });
    await act(async () => {});
    expect(tachada()).toBe(true);
  });

  it('HE-06-HU06-CA03 · Sacar una tarjeta de Hecho', async () => {
    const pagar = tarjeta({
      title: 'Pagar la luz',
      column_id: HECHO.id,
      is_completed: true,
      completed_on: HOY,
      previous_column_id: POR_HACER.id,
    });
    const { nucleo, widget, arrastrar } = await pintar([pagar]);
    await arrastrar(titulo(widget, 'Pagar la luz'), columna(widget, 'En progreso'));
    // ET04: deja de estar completada y se borra su fecha de completado.
    expect(llamadasA(nucleo, 'card_move')).toEqual([
      { card_id: pagar.id, column_id: EN_PROGRESO.id, placement: { kind: 'end' } },
    ]);
    expect(pagar).toMatchObject({ is_completed: false, completed_on: null });
    expect(columnas(widget)[1]?.titulos).toEqual(['Pagar la luz']);
  });

  it('HE-06-HU06-CA04 · Soltar una tarjeta fuera de una columna', async () => {
    const { nucleo, widget, arrastrar } = await pintar([
      tarjeta({ title: 'Entregar informe' }),
      tarjeta({ title: 'Estudiar redes', column_id: EN_PROGRESO.id }),
    ]);
    // ET05: fuera del widget, en el widget pero fuera de las columnas, y sobre sí misma: no cambia de columna.
    await arrastrar(titulo(widget, 'Entregar informe'), null);
    await arrastrar(titulo(widget, 'Entregar informe'), widget.querySelector('.wg-tablero--widget'));
    await arrastrar(titulo(widget, 'Entregar informe'), titulo(widget, 'Entregar informe'));
    expect(llamadasA(nucleo, 'card_move')).toEqual([]);
    expect(columnas(widget)[0]).toMatchObject({ cantidad: '1', titulos: ['Entregar informe'] });
    // La tarjeta vuelve a su lugar: ya no sigue al puntero.
    expect(titulo(widget, 'Entregar informe').classList.contains('wg-tarjeta--arrastrada')).toBe(false);
    expect(titulo(widget, 'Entregar informe').style.transform).toBe('');
  });

  it('HE-06-HU06-CA06 · Arrastrar sin la selección del escritorio', async () => {
    // El gancho de mouse que impide el rectángulo de selección de Windows es del Núcleo (ET07, D-215;
    // `ca_he_06_hu06_ca06` en host_del_wallpaper/gancho.rs, spike manual en Windows 11). En la capa: mover la
    // tarjeta no abre la aplicación (HE-06-HU08-CA10) y el arrastre no selecciona el texto del widget.
    const { nucleo, widget, arrastrar } = await pintar([tarjeta({ title: 'Entregar informe' })]);
    await arrastrar(titulo(widget, 'Entregar informe'), columna(widget, 'En progreso'));
    expect(llamadasA(nucleo, 'card_move')).toHaveLength(1);
    expect(llamadasA(nucleo, 'app_open_screen')).toEqual([]);
    const regla = /\.wg-widget \{([^}]*)\}/.exec(estilos)?.[1] ?? '';
    expect(regla).toContain('user-select: none;');
  });

  it('HE-06-HU06-ET08 · Un arrastre que no termina en 10 segundos devuelve la tarjeta', async () => {
    // Como en CA04: la tarjeta vuelve a su columna original y soltarla después ya no la mueve.
    const { nucleo, widget, arrastrar } = await pintar([tarjeta({ title: 'Entregar informe' })]);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await arrastrar(titulo(widget, 'Entregar informe'), columna(widget, 'En progreso'), () => {
      expect(titulo(widget, 'Entregar informe').classList.contains('wg-tarjeta--arrastrada')).toBe(true);
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(titulo(widget, 'Entregar informe').classList.contains('wg-tarjeta--arrastrada')).toBe(false);
    });
    expect(llamadasA(nucleo, 'card_move')).toEqual([]);
    expect(columnas(widget)[0]).toMatchObject({ cantidad: '1', titulos: ['Entregar informe'] });
  });

  it('HE-06-HU06-CA05 · Mantener la posición del widget', async () => {
    const { nucleo, widget, arrastrar } = await pintar([tarjeta({ title: 'Entregar informe' })]);
    const antes = widget.getAttribute('style');
    await arrastrar(titulo(widget, 'Entregar informe'), columna(widget, 'En progreso'), () => {
      // ET06: durante el arrastre solo se desplaza la tarjeta; el widget sigue en su posición y tamaño.
      expect(widget.getAttribute('style')).toBe(antes);
    });
    expect(widget.getAttribute('style')).toBe(antes);
    expect(widget.style).toMatchObject({ left: '760px', top: '40px', width: '560px', height: '360px' });
    const distribucion = nucleo.llamadas.filter((l) => l.comando.startsWith('layout_edit_'));
    expect(distribucion).toEqual([]);
  });
});
