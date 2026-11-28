import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import estilos from '../tema/tokens.css?raw';
import { EstadoVacio } from './EstadoVacio';

describe('Estado vacío', () => {
  it('Estado vacío muestra su texto', () => {
    render(<EstadoVacio texto="No hay elementos" />);
    expect(screen.getByText('No hay elementos')).toBeTruthy();
  });
});

// AN-06 · A-33 (docs/implementacion/ANIMACIONES.md): el Figma dibuja el estado vacío sin movimiento (217:10646, F2a:31).
describe('AN-06 · A-33 estado vacío sin animación', () => {
  it('`.wg-vacio` no declara transición ni animación', () => {
    const reglas = [...estilos.matchAll(/([^{}]*\.wg-vacio(?![\w-])[^{}]*)\{([^}]*)\}/g)];
    expect(reglas.length).toBeGreaterThan(0);
    for (const [, , cuerpo] of reglas) expect(cuerpo).not.toMatch(/\b(transition|animation)/);
  });
});
