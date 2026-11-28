import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SIN_DATOS, Seccion } from './Seccion';

// AN-06 · La sección del reporte con el esqueleto de carga (docs/implementacion/ANIMACIONES.md A-32, §7; RD-110).

const avanzar = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const seccion = () => screen.getByRole('region', { name: 'Tarjetas completadas' });

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AN-06 · Seccion con esqueleto (A-32)', () => {
  it('mientras calcula: título y aria-busy de inmediato; el esqueleto, pasados 200 ms', () => {
    render(<Seccion titulo="Tarjetas completadas" vacia={null} />);
    expect(within(seccion()).getByRole('heading', { name: 'Tarjetas completadas' })).toBeTruthy();
    expect(seccion().getAttribute('aria-busy')).toBe('true');
    expect(within(seccion()).queryByRole('status')).toBeNull();
    avanzar(201);
    expect(within(seccion()).getByRole('status', { name: 'Cargando' })).toBeTruthy();
    // El giro de antes ya no se usa.
    expect(seccion().querySelector('.wg-cargando')).toBeNull();
  });

  it('un cálculo de menos de 200 ms muestra el contenido sin esqueleto', () => {
    const { rerender } = render(<Seccion titulo="Tarjetas completadas" vacia={null} />);
    avanzar(100);
    rerender(
      <Seccion titulo="Tarjetas completadas" vacia={false}>
        <p>Gráfica</p>
      </Seccion>,
    );
    expect(within(seccion()).getByText('Gráfica')).toBeTruthy();
    expect(seccion().getAttribute('aria-busy')).toBe('false');
    avanzar(1000);
    expect(within(seccion()).queryByRole('status')).toBeNull();
  });

  it('con el esqueleto visible, el contenido espera sus 300 ms y la sección sigue ocupada', () => {
    const { rerender } = render(<Seccion titulo="Tarjetas completadas" vacia={null} />);
    avanzar(250);
    rerender(<Seccion titulo="Tarjetas completadas" vacia />);
    expect(within(seccion()).getByRole('status', { name: 'Cargando' })).toBeTruthy();
    expect(seccion().getAttribute('aria-busy')).toBe('true');
    expect(within(seccion()).queryByText(SIN_DATOS)).toBeNull();
    avanzar(250);
    expect(within(seccion()).queryByRole('status')).toBeNull();
    expect(within(seccion()).getByText(SIN_DATOS)).toBeTruthy();
    expect(seccion().getAttribute('aria-busy')).toBe('false');
  });
});
