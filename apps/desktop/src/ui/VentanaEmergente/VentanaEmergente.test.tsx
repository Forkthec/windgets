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

describe('RD-72 · Ventana emergente', () => {
  it('«×» arriba a la derecha la cierra; el contenido va en un cuerpo con su propio desplazamiento', () => {
    const alSalir = vi.fn();
    const { getByRole, getByText } = render(
      <VentanaEmergente titulo="Ventana" alSalir={alSalir} acciones={<button type="button">Guardar</button>}>
        contenido
      </VentanaEmergente>,
    );
    fireEvent.click(getByRole('button', { name: 'Cerrar' }));
    expect(alSalir).toHaveBeenCalled();
    expect(getByText('contenido').classList.contains('wg-emergente__cuerpo')).toBe(true);
    expect(getByRole('dialog').parentElement?.classList.contains('wg-fondo-emergente')).toBe(true);
  });
});
