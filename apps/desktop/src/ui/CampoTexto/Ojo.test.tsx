import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CampoTexto } from './CampoTexto';

describe('RD-81 · El ojo de la contraseña (P54)', () => {
  it('muestra y oculta la contraseña sin perder lo escrito', () => {
    render(<CampoTexto etiqueta="Contraseña" type="password" valor="Clave123" alCambiar={() => {}} />);
    const campo = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(campo.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campo.type).toBe('text');
    expect(campo.value).toBe('Clave123');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(campo.type).toBe('password');
  });

  it('los campos que no son contraseña no tienen ojo', () => {
    render(<CampoTexto etiqueta="Correo electrónico" valor="" alCambiar={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
