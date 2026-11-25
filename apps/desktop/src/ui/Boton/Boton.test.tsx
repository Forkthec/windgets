import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Boton } from './Boton';

describe('Botón', () => {
  it('Botón deshabilitado muestra el motivo y no responde', () => {
    const alSeleccionar = vi.fn();
    render(
      <Boton disabled motivo="Motivo de prueba" onClick={alSeleccionar}>
        Guardar
      </Boton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(alSeleccionar).not.toHaveBeenCalled();
    expect(screen.getByText('Motivo de prueba')).toBeTruthy();
  });
});

describe('RD-99 · Jerarquía de botones', () => {
  const clases = (nombre: string) => [...screen.getByRole('button', { name: nombre }).classList];

  it('sin decir la variante es secundario', () => {
    render(<Boton>Cancelar</Boton>);
    expect(clases('Cancelar')).toEqual(['wg-boton', 'wg-boton--secundario']);
  });

  it.each(['principal', 'secundario', 'icono', 'destructivo'] as const)('variante «%s»', (variante) => {
    render(
      <Boton variante={variante} aria-label="Acción">
        +
      </Boton>,
    );
    expect(clases('Acción')).toEqual(['wg-boton', `wg-boton--${variante}`]);
  });

  it('el atajo «principal» de los usos actuales sigue dando el principal', () => {
    render(<Boton principal>Guardar</Boton>);
    expect(clases('Guardar')).toEqual(['wg-boton', 'wg-boton--principal']);
  });

  it('si se dan el atajo y la variante, gana la variante', () => {
    render(
      <Boton principal variante="destructivo">
        Eliminar
      </Boton>,
    );
    expect(clases('Eliminar')).toEqual(['wg-boton', 'wg-boton--destructivo']);
  });

  it('la confirmación destructiva actual conserva el principal y su clase', () => {
    render(
      <Boton principal className="wg-boton--peligro">
        Confirmar
      </Boton>,
    );
    expect(clases('Confirmar')).toEqual(['wg-boton', 'wg-boton--principal', 'wg-boton--peligro']);
  });

  it('el tamaño «fila» se marca y el normal no', () => {
    render(
      <>
        <Boton tam="fila">Editar</Boton>
        <Boton tam="normal">Aplicar</Boton>
      </>,
    );
    expect(clases('Editar')).toContain('wg-boton--fila');
    expect(clases('Aplicar')).not.toContain('wg-boton--fila');
  });

  it('el botón de ícono se llama como su etiqueta accesible', () => {
    const alSeleccionar = vi.fn();
    render(
      <Boton variante="icono" aria-label="Nueva tarjeta" onClick={alSeleccionar}>
        +
      </Boton>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nueva tarjeta' }));
    expect(alSeleccionar).toHaveBeenCalledTimes(1);
  });
});
