import { describe, expect, it } from 'vitest';
import { aplicarTokens, NOMBRES_TOKEN, type Tokens } from './tokens';

describe('tokens del tema', () => {
  it('aplica los tokens del tema como variables CSS', () => {
    const tokens = Object.fromEntries(NOMBRES_TOKEN.map((n) => [n, `valor-${n}`])) as Tokens;
    aplicarTokens(tokens);
    expect(document.documentElement.style.getPropertyValue('--wg-superficie-alta')).toBe(
      'valor-superficie_alta',
    );
  });

  it('incluye los tokens del marco y de las superficies de WG-MK-01 (interfaz.md, «Tema a tokens»)', () => {
    for (const nombre of ['marco', 'sobre_marco', 'superficie_baja', 'linea'] as const) {
      expect(NOMBRES_TOKEN).toContain(nombre);
    }
    const tokens = Object.fromEntries(NOMBRES_TOKEN.map((n) => [n, `valor-${n}`])) as Tokens;
    aplicarTokens(tokens);
    expect(document.documentElement.style.getPropertyValue('--wg-sobre-marco')).toBe('valor-sobre_marco');
  });
});
