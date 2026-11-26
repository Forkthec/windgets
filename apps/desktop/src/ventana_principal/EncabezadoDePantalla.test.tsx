// docs/rediseno.md RD-105 (IM-08) · La ranura `acciones` del encabezado: el título y los controles comparten fila; sin
// ella el DOM no cambia. La geometría (misma línea, bajar a una segunda, sin scroll horizontal) está en
// e2e/rediseno-marco.spec.ts.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EncabezadoDePantalla } from './EncabezadoDePantalla';

// El indicador depende del Núcleo; aquí solo importa dónde queda.
vi.mock('./IndicadorSincronizacion', () => ({
  IndicadorSincronizacion: () => <p>Sincronizado</p>,
}));

describe('RD-105 · EncabezadoDePantalla', () => {
  it('con `acciones`, el título y los controles quedan en el mismo contenedor de fila', () => {
    render(<EncabezadoDePantalla pantalla="widgets" acciones={<button type="button">Nuevo</button>} />);
    const titulo = screen.getByRole('heading', { level: 1, name: 'Widgets' });
    const control = screen.getByRole('button', { name: 'Nuevo' });
    const fila = titulo.closest('.wg-encabezado-pantalla__fila');
    expect(fila).not.toBeNull();
    expect(fila?.contains(control)).toBe(true);
    expect(control.closest('.wg-encabezado-pantalla__acciones')?.parentElement).toBe(fila);
    // El título va antes que los controles (a la izquierda) y la miga sigue encima de la fila.
    expect(titulo.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const encabezado = screen.getByRole('banner');
    expect(encabezado.firstElementChild?.className).toBe('wg-encabezado-pantalla__seccion');
    expect(encabezado.children[1]).toBe(fila);
    expect(screen.getByText('Sincronizado').closest('.wg-encabezado-pantalla__derecha')).not.toBeNull();
  });

  it('sin `acciones`, el DOM es el de siempre: sin fila ni contenedor de controles', () => {
    render(<EncabezadoDePantalla pantalla="widgets" />);
    const encabezado = screen.getByRole('banner');
    expect(encabezado.querySelector('.wg-encabezado-pantalla__fila')).toBeNull();
    expect(encabezado.querySelector('.wg-encabezado-pantalla__acciones')).toBeNull();
    expect(Array.from(encabezado.children).map((e) => e.className)).toEqual([
      'wg-encabezado-pantalla__seccion',
      'wg-encabezado-pantalla__titulo',
      'wg-encabezado-pantalla__derecha',
    ]);
    expect(screen.getByRole('heading', { level: 1, name: 'Widgets' }).parentElement).toBe(encabezado);
  });
});
