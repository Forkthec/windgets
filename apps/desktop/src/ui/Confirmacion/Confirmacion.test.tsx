import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Confirmacion } from './Confirmacion';

describe('Confirmación', () => {
  it('Confirmación tiene la opción principal y «Cancelar»', () => {
    const alConfirmar = vi.fn();
    const alCancelar = vi.fn();
    render(
      <Confirmacion
        titulo="Eliminar"
        texto="¿Seguro?"
        opcionPrincipal="Eliminar"
        alConfirmar={alConfirmar}
        alCancelar={alCancelar}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(alCancelar).toHaveBeenCalled();
    expect(alConfirmar).toHaveBeenCalled();
  });
});
