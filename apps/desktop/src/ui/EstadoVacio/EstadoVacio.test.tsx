import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EstadoVacio } from './EstadoVacio';

describe('Estado vacío', () => {
  it('Estado vacío muestra su texto', () => {
    render(<EstadoVacio texto="No hay elementos" />);
    expect(screen.getByText('No hay elementos')).toBeTruthy();
  });
});
