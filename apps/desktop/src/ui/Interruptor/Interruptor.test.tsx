import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Interruptor } from './Interruptor';

describe('Interruptor', () => {
  it('Interruptor informa el cambio', () => {
    const alCambiar = vi.fn();
    render(<Interruptor etiqueta="Interruptor" activo={false} alCambiar={alCambiar} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(alCambiar).toHaveBeenCalledWith(true);
  });
});
