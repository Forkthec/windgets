import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MenuPrincipal } from './MenuPrincipal';

describe('Menú principal', () => {
  it('Menú principal marca solo la pantalla actual', () => {
    render(<MenuPrincipal actual="kanban" alElegir={() => {}} />);
    const marcadas = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
    expect(marcadas.map((b) => b.textContent)).toEqual(['Tablero Kanban']);
  });

  it('RD-30 · Once opciones en el orden del Figma, cada una con su ícono y sin títulos de sección', () => {
    render(<MenuPrincipal actual="planner_daily" alElegir={() => {}} />);
    expect(screen.queryAllByRole('heading')).toEqual([]);
    const opciones = screen.getAllByRole('button');
    expect(opciones.map((b) => b.textContent)).toEqual([
      'Planificador diario',
      'Tablero Kanban',
      'Calendario',
      'Agenda diaria',
      'Reportes',
      'Etiquetas',
      'Agente de IA',
      'Wallpaper',
      'Temas',
      'Widgets',
      'Configuración',
    ]);
    for (const opcion of opciones) {
      const icono = opcion.querySelector('svg');
      expect(icono?.getAttribute('aria-hidden')).toBe('true');
      expect(icono?.getAttribute('width')).toBe('18');
    }
  });
});
