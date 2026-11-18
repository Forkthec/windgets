// HE-06-HU05 · Widget Kanban en la capa (C-02). Una prueba por CA en la vista; las reglas del Núcleo tienen sus
// pruebas en servicio_del_planificador/pruebas_del_widget_kanban.rs (orden, cantidades, 5 títulos y «+N más»).
import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Card, LayerInitialState } from '@/types';
import { crearNucleo, EN_PROGRESO, HECHO, POR_HACER, tarjeta } from '../screens/kanban/pruebas';
import { Capa } from './Capa';

const ESTADO: LayerInitialState = {
  applied: {
    template_id: 'default',
    background: { source: 'template_default', catalog_image_id: null, uploaded_image_id: null },
    colors: { primary: '#96B2B2', secondary: '#829890', text: '#14201C' },
    palette_id: null,
    font: { id: 'nunito', size: 'medium' },
  },
  widgets: [{ widget_id: 'kanban', type: 'kanban', x: 760, y: 40, width: 560, height: 360, is_active: true }],
  monitors: [],
  wallpaper_state: 'ok',
};

afterEach(() => {
  vi.restoreAllMocks();
});

/** Pinta la capa con el widget Kanban activo y las tarjetas indicadas. */
async function pintar(tarjetas: Card[] = []) {
  const n = crearNucleo(tarjetas);
  n.nucleo.responder('layer_get_initial_state', () => ({ ok: true, value: ESTADO }));
  n.nucleo.responder('asset_resolve', () => ({ ok: true, value: { url: '', state: 'unavailable' } }));
  render(<Capa invocar={n.invocar} escuchar={n.escuchar} />);
  const widget = await screen.findByRole('region', { name: 'Kanban' });
  await act(async () => {});
  return { ...n, widget };
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
