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
});
