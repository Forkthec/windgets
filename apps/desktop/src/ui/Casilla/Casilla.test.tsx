import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Casilla } from './Casilla';

describe('Casilla', () => {
  it('Casilla informa el cambio', () => {
    const alCambiar = vi.fn();
    render(<Casilla etiqueta="Casilla" marcada={false} alCambiar={alCambiar} />);
    fireEvent.click(screen.getByLabelText('Casilla'));
    expect(alCambiar).toHaveBeenCalledWith(true);
  });
});
