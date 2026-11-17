// HE-04-HU03 · Consultar la hora del sistema en el widget Reloj. Prueba de la capa (C-02).
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reloj } from './Reloj';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 14, 8, 59, 30));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('HE-04-HU03 · Widget Reloj', () => {
  it('HE-04-HU03-CA01 · Widget Reloj', () => {
    render(<Reloj />);
    // ET01: la hora actual del sistema…
    expect(screen.getByText('08:59')).toBeTruthy();
    // …que se actualiza cuando cambia el minuto (30 s después) y en cada minuto siguiente.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText('09:00')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('09:01')).toBeTruthy();
  });
});
