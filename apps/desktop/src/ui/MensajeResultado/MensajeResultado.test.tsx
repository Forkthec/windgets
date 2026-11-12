import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DURACION_RESULTADO_MS, MensajeResultado } from './MensajeResultado';

describe('Mensaje de resultado', () => {
  it('Mensaje de resultado se oculta a los 4 segundos', () => {
    vi.useFakeTimers();
    const alOcultar = vi.fn();
    render(<MensajeResultado texto="Listo" alOcultar={alOcultar} />);
    act(() => vi.advanceTimersByTime(DURACION_RESULTADO_MS));
    expect(alOcultar).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
