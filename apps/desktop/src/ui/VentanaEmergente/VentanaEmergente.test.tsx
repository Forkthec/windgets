import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VentanaEmergente } from './VentanaEmergente';

describe('Ventana emergente', () => {
  it('Ventana emergente sale con Esc', () => {
    const alSalir = vi.fn();
    render(
      <VentanaEmergente titulo="Ventana" alSalir={alSalir}>
        contenido
      </VentanaEmergente>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(alSalir).toHaveBeenCalled();
  });
});
