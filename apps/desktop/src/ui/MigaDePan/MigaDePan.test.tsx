import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MigaDePan } from './MigaDePan';

describe('Miga de pan', () => {
  it('Miga de pan marca la pantalla actual', () => {
    render(
      <MigaDePan
        niveles={[
          { texto: 'Widgets', alElegir: () => {} },
          { texto: 'Agregar widget', alElegir: () => {} },
          { texto: 'Clima' },
        ]}
      />,
    );
    expect(screen.getByText('Clima').closest('li')?.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('button', { name: 'Clima' })).toBeNull();
  });
});
