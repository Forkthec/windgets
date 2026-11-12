import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Boton } from './Boton';

describe('Botón', () => {
  it('Botón deshabilitado muestra el motivo y no responde', () => {
    const alSeleccionar = vi.fn();
    render(
      <Boton disabled motivo="Motivo de prueba" onClick={alSeleccionar}>
        Guardar
      </Boton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(alSeleccionar).not.toHaveBeenCalled();
    expect(screen.getByText('Motivo de prueba')).toBeTruthy();
  });
});
