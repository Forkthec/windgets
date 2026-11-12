import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MigaDePan } from './MigaDePan';

describe('Miga de pan', () => {
  it('Miga de pan marca la pantalla actual', () => {
    render(<MigaDePan ruta={['Menú principal', 'Planificador', 'Etiquetas']} />);
    expect(screen.getByText('Etiquetas').getAttribute('aria-current')).toBe('page');
  });
});
