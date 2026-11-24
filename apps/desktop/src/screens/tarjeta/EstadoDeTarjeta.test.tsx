import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { estadoDeTarjeta, IndicadorDeEstado } from './EstadoDeTarjeta';

const DIA = new Date(2026, 10, 24);
const tarjeta = (due_date: string, extra: { is_completed?: boolean; is_overdue?: boolean } = {}) => ({
  due_date,
  is_completed: false,
  is_overdue: false,
  ...extra,
});

describe('RD-73 · Colores de estado de una tarjeta (D-03)', () => {
  it('vencida en rojo; próxima a vencer si vence hoy o mañana; nada si vence después o está completada', () => {
    expect(estadoDeTarjeta(tarjeta('2026-11-20', { is_overdue: true }), DIA)).toBe('vencida');
    expect(estadoDeTarjeta(tarjeta('2026-11-24'), DIA)).toBe('proxima');
    expect(estadoDeTarjeta(tarjeta('2026-11-25'), DIA)).toBe('proxima');
    expect(estadoDeTarjeta(tarjeta('2026-11-26'), DIA)).toBeNull();
    expect(estadoDeTarjeta(tarjeta('2026-11-24', { is_completed: true }), DIA)).toBeNull();
  });

  it('el indicador lleva ícono y texto, no solo color (R-12)', () => {
    render(<IndicadorDeEstado tarjeta={tarjeta('2026-11-20', { is_overdue: true })} />);
    const vencida = screen.getByText('Vencida');
    expect(vencida.classList.contains('wg-estado--vencida')).toBe(true);
    expect(vencida.textContent).toContain('⚠');
  });
});
