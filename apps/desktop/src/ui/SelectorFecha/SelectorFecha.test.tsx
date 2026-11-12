import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SelectorFecha } from './SelectorFecha';

describe('Selector de fecha', () => {
  it('Selector de fecha se muestra', () => {
    render(<SelectorFecha etiqueta="Fecha" valor={undefined} alCambiar={() => {}} />);
    expect(screen.getByRole('group', { name: 'Fecha' })).toBeTruthy();
  });
});
