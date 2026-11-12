import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Selector } from './Selector';

describe('Selector', () => {
  it('Selector informa el cambio', () => {
    const alCambiar = vi.fn();
    render(
      <Selector
        etiqueta="Selector"
        valor="a"
        alCambiar={alCambiar}
        opciones={[
          { valor: 'a', texto: 'A' },
          { valor: 'b', texto: 'B' },
        ]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Selector'), { target: { value: 'b' } });
    expect(alCambiar).toHaveBeenCalledWith('b');
  });
});
