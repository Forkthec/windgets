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

  it('RD-34 · Sin título visible, la pregunta y las opciones con la principal primero', () => {
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
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Guardar y aplicar',
      'Aplicar sin guardar',
      'Cancelar',
    ]);
  });
});
