import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MenuPrincipal } from './MenuPrincipal';

describe('Menú principal', () => {
  it('Menú principal marca solo la pantalla actual', () => {
    render(<MenuPrincipal actual="kanban" alElegir={() => {}} />);
    const marcadas = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
    expect(marcadas.map((b) => b.textContent)).toEqual(['Tablero Kanban']);
  });
});
