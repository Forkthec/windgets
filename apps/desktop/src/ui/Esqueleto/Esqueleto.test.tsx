import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import estilos from '../tema/tokens.css?raw';
import { Esqueleto, useEsqueleto } from './Esqueleto';

// AN-06 · Esqueleto de carga (docs/implementacion/ANIMACIONES.md A-32, regla 7; §7 P-A32) con tiempo simulado.

function Prueba({ cargando }: { cargando: boolean }) {
  return useEsqueleto(cargando) ? <Esqueleto /> : <p>Contenido</p>;
}

const esqueleto = () => screen.queryByTestId('esqueleto');
const avanzar = (ms: number) => act(() => vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AN-06 · A-32 esqueleto de carga', () => {
  it('a los 199 ms de carga no existe; a los 201 ms sí', () => {
    render(<Prueba cargando />);
    avanzar(199);
    expect(esqueleto()).toBeNull();
    avanzar(2);
    expect(esqueleto()).not.toBeNull();
  });

  it('si el dato llega a los 350 ms, el esqueleto sigue hasta los 500 ms', () => {
    const { rerender } = render(<Prueba cargando />);
    avanzar(350);
    rerender(<Prueba cargando={false} />);
    avanzar(149);
    expect(esqueleto()).not.toBeNull();
    avanzar(2);
    expect(esqueleto()).toBeNull();
    expect(screen.getByText('Contenido')).toBeTruthy();
  });

  it('si la carga termina antes de 200 ms, nunca se pinta', () => {
    const { rerender } = render(<Prueba cargando />);
    avanzar(150);
    rerender(<Prueba cargando={false} />);
    avanzar(1000);
    expect(esqueleto()).toBeNull();
  });

  it('una carga larga lo deja visible mientras dura y lo quita al terminar', () => {
    const { rerender } = render(<Prueba cargando />);
    avanzar(2000);
    expect(esqueleto()).not.toBeNull();
    rerender(<Prueba cargando={false} />);
    avanzar(0);
    expect(esqueleto()).toBeNull();
  });

  it('son cinco barras con el nombre «Cargando», como el indicador al que reemplaza', () => {
    render(<Esqueleto />);
    const estado = screen.getByRole('status', { name: 'Cargando' });
    expect(estado.querySelectorAll('.wg-esqueleto__barra')).toHaveLength(5);
  });

  it('la forma del Figma: barras `linea` de 16, radio 6, paso 54 y anchos de 324 a 228', () => {
    expect(estilos).toMatch(
      /\.wg-esqueleto__barra \{[^}]*height: 16px;[^}]*border-radius: 6px;[^}]*background: var\(--wg-linea\);/,
    );
    // Paso vertical 54 = barra 16 + separación 38.
    expect(estilos).toMatch(/\.wg-esqueleto \{[^}]*gap: 38px;/);
    const anchos = [...estilos.matchAll(/\.wg-esqueleto__barra:nth-child\((\d)\) \{\s*width: (\d+)px;/g)].map(
      (m) => [Number(m[1]), Number(m[2])],
    );
    expect(anchos).toEqual([
      [1, 324],
      [2, 300],
      [3, 276],
      [4, 252],
      [5, 228],
    ]);
  });

  it('entra con un fundido de opacidad de `--dur-corto` y `--ease-salida`, sin brillo ni pulso', () => {
    const bloque = estilos.match(/\.wg-esqueleto \{[^}]*\}/)?.[0] ?? '';
    expect(bloque).toMatch(/transition: opacity var\(--dur-corto\) var\(--ease-salida\);/);
    expect(estilos).toMatch(/@starting-style \{\s*\.wg-esqueleto \{\s*opacity: 0;/);
    expect(estilos).not.toMatch(/\.wg-esqueleto[^{]*\{[^}]*animation/);
  });
});
