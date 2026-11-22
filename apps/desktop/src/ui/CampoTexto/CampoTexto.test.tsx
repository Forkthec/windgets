import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CampoTexto } from './CampoTexto';

describe('Campo de texto', () => {
  it('Campo de texto muestra el mensaje de campo y marca el error', () => {
    render(
      <CampoTexto etiqueta="Nombre" valor="" alCambiar={() => {}} mensaje="Este campo es obligatorio." />,
    );
    expect(screen.getByLabelText('Nombre').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Este campo es obligatorio.')).toBeTruthy();
  });

  // docs/rediseno.md RD-10 y RD-11.
  it('RD-10: el contador muestra los caracteres escritos sobre el máximo sin cortar lo escrito', () => {
    const { rerender } = render(<CampoTexto etiqueta="Alias" valor="" alCambiar={() => {}} maximo={30} />);
    expect(screen.getByText('0/30')).toBeTruthy();
    rerender(<CampoTexto etiqueta="Alias" valor={'a'.repeat(31)} alCambiar={() => {}} maximo={30} />);
    expect(screen.getByText('31/30')).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>('Alias').value).toHaveLength(31);
  });

  it('RD-11: la ayuda fija describe el campo junto al mensaje y la marca de obligatorio no cambia la etiqueta', () => {
    render(
      <CampoTexto
        etiqueta="Contraseña"
        valor=""
        alCambiar={() => {}}
        obligatorio
        ayuda="8 a 64 caracteres con al menos una mayúscula, una minúscula y un número."
        mensaje="Este campo es obligatorio."
      />,
    );
    const campo = screen.getByLabelText('Contraseña');
    expect(campo.getAttribute('aria-required')).toBe('true');
    const descritoPor = (campo.getAttribute('aria-describedby') ?? '').split(' ');
    const textos = descritoPor.map((id) => document.getElementById(id)?.textContent);
    expect(textos).toEqual([
      '8 a 64 caracteres con al menos una mayúscula, una minúscula y un número.',
      'Este campo es obligatorio.',
    ]);
    expect(document.querySelector('.wg-campo__etiqueta--obligatoria')).toBeTruthy();
  });
});
