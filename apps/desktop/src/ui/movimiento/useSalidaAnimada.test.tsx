import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import estilos from '../tema/tokens.css?raw';
import { duracionDeLaTransicion, SEGURO_DE_SALIDA, useSalidaAnimada } from './useSalidaAnimada';

// AN-01 · Hook de salidas con desmontaje (docs/implementacion/ANIMACIONES.md §4, regla 13).

function Prueba({ abierto }: { abierto: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { montado, estado } = useSalidaAnimada(abierto, ref);
  return montado ? <div ref={ref} data-testid="caja" data-estado={estado} /> : null;
}

const caja = () => screen.queryByTestId('caja');

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AN-01 · useSalidaAnimada (regla 13)', () => {
  it('entra con el estado base y pasa a «abierta» en el fotograma siguiente', async () => {
    render(<Prueba abierto />);
    expect(caja()?.dataset.estado).toBe('entrando');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(caja()?.dataset.estado).toBe('abierta');
  });

  it('al cerrar sigue montado, inerte, hasta el seguro (duración + 50 ms) y luego se desmonta', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Prueba abierto />);
    rerender(<Prueba abierto={false} />);
    expect(caja()?.dataset.estado).toBe('saliendo');
    expect(caja()?.hasAttribute('inert')).toBe(true);
    act(() => vi.advanceTimersByTime(SEGURO_DE_SALIDA - 1));
    expect(caja()).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(caja()).toBeNull();
  });

  it('`transitionend` del propio elemento lo desmonta antes del seguro', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Prueba abierto />);
    rerender(<Prueba abierto={false} />);
    fireEvent.transitionEnd(caja() as Element);
    expect(caja()).toBeNull();
  });

  it('si se vuelve a abrir mientras sale, cancela la salida', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Prueba abierto />);
    rerender(<Prueba abierto={false} />);
    rerender(<Prueba abierto />);
    expect(caja()?.dataset.estado).toBe('abierta');
    expect(caja()?.hasAttribute('inert')).toBe(false);
    act(() => vi.advanceTimersByTime(1000));
    expect(caja()).not.toBeNull();
  });

  it('la duración calculada suma duración y retraso y toma la más larga', () => {
    const el = document.createElement('div');
    el.style.transitionDuration = '0.15s, 100ms';
    el.style.transitionDelay = '0.2s, 0s';
    expect(duracionDeLaTransicion(el)).toBe(350);
    expect(duracionDeLaTransicion(null)).toBe(0);
  });
});

describe('AN-01 · tiempos en tokens.css (A-01 a A-04)', () => {
  /** El cuerpo de la última regla con exactamente ese selector (la del bloque AN-01). */
  const bloque = (selector: string) => {
    const reglas = [...estilos.matchAll(/(^|\n)([^{}\n][^{}]*)\{([^}]*)\}/g)].filter(
      (m) => (m[2] ?? '').trim() === selector,
    );
    return reglas[reglas.length - 1]?.[3] ?? '';
  };

  it('la ventana entra en `--dur-medio` y sale en `--dur-corto`; el velo igual', () => {
    expect(bloque('.wg-emergente')).toMatch(
      /transition:\s*opacity var\(--dur-medio\) var\(--ease-salida\),\s*transform var\(--dur-medio\) var\(--ease-salida\);/,
    );
    expect(bloque('.wg-emergente--saliendo')).toMatch(
      /transition-duration: var\(--dur-corto\), var\(--dur-corto\);/,
    );
    expect(bloque('.wg-fondo-emergente--saliendo')).toMatch(/transition-duration: var\(--dur-corto\);/);
    expect(bloque('.wg-fondo-emergente--apilado')).toMatch(/background: transparent;/);
  });

  it('el menú y el calendario flotante abren en `--dur-corto` y cierran en `--dur-instante`', () => {
    expect(estilos).toMatch(
      /\.wg-menu-acciones__lista,\s*\.wg-selector-fecha__flotante \{[^}]*transition:\s*opacity var\(--dur-corto\) var\(--ease-salida\),\s*transform var\(--dur-corto\) var\(--ease-salida\);/,
    );
    expect(estilos).toMatch(
      /\.wg-menu-acciones__lista--saliendo,\s*\.wg-selector-fecha__flotante--saliendo \{[^}]*transition-duration: var\(--dur-instante\), var\(--dur-instante\);/,
    );
  });
});
