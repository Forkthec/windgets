import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MenuPrincipal } from './MenuPrincipal';

describe('Menú principal', () => {
  it('Menú principal marca solo la pantalla actual', () => {
    render(<MenuPrincipal actual="kanban" alElegir={() => {}} />);
    const marcadas = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
    expect(marcadas.map((b) => b.textContent)).toEqual(['Tablero Kanban']);
  });

  it('RD-65 · Dos bloques con título, Etiquetas al final de Planificador y Configuración al pie', () => {
    render(<MenuPrincipal actual="planner_daily" alElegir={() => {}} />);
    expect(screen.queryAllByRole('heading')).toEqual([]);
    expect(
      Array.from(document.querySelectorAll('.wg-menu__titulo-bloque')).map((t) => t.textContent),
    ).toEqual(['Planificador', 'Personalización']);
    const textos = (nombre: string) =>
      within(screen.getByRole('group', { name: nombre }))
        .getAllByRole('button')
        .map((b) => b.textContent);
    expect(textos('Planificador')).toEqual([
      'Planificador diario',
      'Tablero Kanban',
      'Calendario',
      'Agenda diaria',
      'Reportes',
      'Etiquetas',
    ]);
    expect(textos('Personalización')).toEqual(['Wallpaper', 'Temas', 'Widgets']);
    const opciones = screen.getAllByRole('button');
    expect(opciones.at(-1)?.textContent).toBe('Configuración');
    for (const opcion of opciones) {
      const icono = opcion.querySelector('svg');
      expect(icono?.getAttribute('aria-hidden')).toBe('true');
      expect(icono?.getAttribute('width')).toBe('18');
    }
  });

  it('D-25 · Contraído muestra solo los íconos, con su nombre accesible y su texto al pasar el mouse', async () => {
    render(<MenuPrincipal actual="kanban" alElegir={() => {}} contraido />);
    expect(document.querySelectorAll('.wg-menu__titulo-bloque')).toHaveLength(0);
    const kanban = screen.getByRole('button', { name: 'Tablero Kanban' });
    expect(kanban.textContent).toBe('');
    expect(kanban.getAttribute('aria-current')).toBe('page');
    // RD-100: el texto sale en el nombre emergente; repite el nombre accesible y no describe al botón.
    fireEvent.pointerEnter(kanban);
    await waitFor(() =>
      expect(document.querySelector('.wg-nombre-emergente:not([hidden])')?.textContent).toBe(
        'Tablero Kanban',
      ),
    );
    expect(kanban.getAttribute('aria-describedby')).toBeNull();
  });
});
