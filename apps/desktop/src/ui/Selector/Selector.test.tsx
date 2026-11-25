import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Selector, type SelectorProps } from './Selector';

const OPCIONES = [
  { valor: 'mes', texto: 'Mes' },
  { valor: 'semana', texto: 'Semana', deshabilitada: true },
  { valor: 'dia', texto: 'Día' },
];

function Segmentada(props: Partial<SelectorProps>) {
  const [valor, setValor] = useState('mes');
  return (
    <Selector
      variante="segmentado"
      etiqueta="Vista"
      opciones={OPCIONES}
      {...props}
      valor={props.valor ?? valor}
      alCambiar={setValor}
    />
  );
}

const opcion = (nombre: string) => screen.getByRole<HTMLButtonElement>('radio', { name: nombre });

describe('Selector', () => {
  it('Selector informa el cambio', () => {
    const alCambiar = vi.fn();
    render(
      <Selector
        etiqueta="Selector"
        valor="a"
        alCambiar={alCambiar}
        opciones={[
          { valor: 'a', texto: 'A' },
          { valor: 'b', texto: 'B' },
        ]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Selector'), { target: { value: 'b' } });
    expect(alCambiar).toHaveBeenCalledWith('b');
  });
});

describe('RD-99 · Selector segmentado', () => {
  it('sin variante sigue siendo la lista desplegable', () => {
    render(<Selector etiqueta="Vista" valor="mes" alCambiar={vi.fn()} opciones={OPCIONES} />);
    expect(screen.getByRole('combobox', { name: 'Vista' })).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('deja las opciones a la vista como un grupo de radios y marca la elegida', () => {
    render(<Segmentada />);
    expect(screen.getByRole('radiogroup', { name: 'Vista' })).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(opcion('Mes').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(opcion('Día'));
    expect(opcion('Día').getAttribute('aria-checked')).toBe('true');
    expect(opcion('Mes').getAttribute('aria-checked')).toBe('false');
  });

  it('tiene una sola parada del tabulador y las flechas cambian la opción y llevan el foco', () => {
    render(<Segmentada />);
    expect([opcion('Mes').tabIndex, opcion('Día').tabIndex]).toEqual([0, -1]);
    opcion('Mes').focus();
    fireEvent.keyDown(opcion('Mes'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(opcion('Día'));
    expect(opcion('Día').getAttribute('aria-checked')).toBe('true');
    expect([opcion('Mes').tabIndex, opcion('Día').tabIndex]).toEqual([-1, 0]);
    fireEvent.keyDown(opcion('Día'), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(opcion('Mes'));
  });

  it('una opción deshabilitada no se elige con el clic ni con las flechas', () => {
    render(<Segmentada />);
    expect(opcion('Semana').disabled).toBe(true);
    fireEvent.click(opcion('Semana'));
    expect(opcion('Mes').getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(opcion('Mes'), { key: 'ArrowDown' });
    expect(opcion('Día').getAttribute('aria-checked')).toBe('true');
  });

  it('si la elegida está deshabilitada, el tabulador entra por la primera que se puede elegir', () => {
    render(<Segmentada valor="semana" />);
    expect([opcion('Mes').tabIndex, opcion('Semana').tabIndex]).toEqual([0, -1]);
  });

  it('el selector deshabilitado deshabilita todas las opciones', () => {
    render(<Segmentada deshabilitado />);
    for (const nombre of ['Mes', 'Semana', 'Día']) expect(opcion(nombre).disabled).toBe(true);
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
    expect(opcion('Mes').getAttribute('aria-checked')).toBe('true');
  });

  it('el mensaje de error queda unido al grupo y el id lleva el cursor a la opción elegida', () => {
    render(<Segmentada id="vista" mensaje="Mensaje de prueba" />);
    const grupo = screen.getByRole('radiogroup', { name: 'Vista' });
    expect(grupo.getAttribute('aria-invalid')).toBe('true');
    const descripcion = grupo.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(descripcion)?.textContent).toBe('Mensaje de prueba');
    document.getElementById('vista')?.focus();
    expect(document.activeElement).toBe(opcion('Mes'));
  });
});
