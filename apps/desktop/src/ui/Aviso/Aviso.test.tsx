import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Aviso } from './Aviso';

describe('Aviso', () => {
  it('Aviso muestra su texto', () => {
    render(<Aviso texto="Sin conexión" />);
    expect(screen.getByRole('alert').textContent).toBe('Sin conexión');
  });
});
