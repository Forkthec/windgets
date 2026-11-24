import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Confirmacion } from './Confirmacion';

describe('Confirmación', () => {
  it('Confirmación tiene la opción principal y «Cancelar»', () => {
    const alConfirmar = vi.fn();
    const alCancelar = vi.fn();
    render(
      <Confirmacion
        titulo="Eliminar"
        texto="¿Seguro?"
        opcionPrincipal="Eliminar"
        alConfirmar={alConfirmar}
        alCancelar={alCancelar}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(alCancelar).toHaveBeenCalled();
    expect(alConfirmar).toHaveBeenCalled();
  });

  it('RD-34, RD-72 · Sin título visible, «×» arriba y las opciones con la principal a la derecha', () => {
    render(
      <Confirmacion
        titulo="Aplicar"
        texto="Tienes cambios sin guardar en el tema “Mi tema”. ¿Qué deseas hacer?"
        opcionPrincipal="Guardar y aplicar"
        opcionSecundaria="Aplicar sin guardar"
        alConfirmar={() => {}}
        alElegirSecundaria={() => {}}
        alCancelar={() => {}}
      />,
    );
    // Figma 85:174 «M-15»: el título queda como nombre accesible de la ventana, pero no se ve.
    const ventana = screen.getByRole('dialog', { name: 'Aplicar' });
    expect(ventana.classList.contains('wg-confirmacion')).toBe(true);
    expect(screen.getByRole('heading', { name: 'Aplicar' }).classList.contains('wg-oculto')).toBe(true);
    expect(screen.getByText(/¿Qué deseas hacer\?/).classList.contains('wg-confirmacion__pregunta')).toBe(
      true,
    );
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Cerrar',
      'Cancelar',
      'Aplicar sin guardar',
      'Guardar y aplicar',
    ]);
  });

  it('RD-72 · Una confirmación destructiva pinta la principal en rojo', () => {
    render(
      <Confirmacion
        titulo="Eliminar"
        texto="¿Seguro?"
        opcionPrincipal="Confirmar"
        destructiva
        alConfirmar={() => {}}
        alCancelar={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Confirmar' }).classList.contains('wg-boton--peligro')).toBe(
      true,
    );
  });
});
