import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SelectorColores } from './SelectorColores';

describe('Selector de colores', () => {
  it('Selector de colores se muestra', () => {
    render(<SelectorColores etiqueta="Color" valor="#00D9E2" alCambiar={() => {}} />);
    expect(screen.getByRole('group', { name: 'Color' })).toBeTruthy();
  });
});
