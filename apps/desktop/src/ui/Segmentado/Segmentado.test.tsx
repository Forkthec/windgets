import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Segmentado } from './Segmentado';

function Prueba() {
  const [valor, setValor] = useState<'a' | 'b' | 'c'>('a');
  return (
    <Segmentado
      etiqueta="Tipo"
      opciones={[
        { valor: 'a', texto: 'Tarea' },
        { valor: 'b', texto: 'Recordatorio' },
        { valor: 'c', texto: 'Evento' },
      ]}
      valor={valor}
      alCambiar={setValor}
    />
  );
}

describe('RD-75 · Control segmentado', () => {
  it('es un grupo de radios con nombre; el clic y las flechas cambian la opción', () => {
    render(<Prueba />);
    const grupo = screen.getByRole('radiogroup', { name: 'Tipo' });
    expect(screen.getByRole('radio', { name: 'Tarea' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Evento' }));
    expect(screen.getByRole('radio', { name: 'Evento' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.keyDown(grupo, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Tarea' }).getAttribute('aria-checked')).toBe('true');
  });
});
