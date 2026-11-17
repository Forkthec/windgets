import { describe, expect, it } from 'vitest';
import { contraste, derivarTokens } from './derivar';
import { TOKENS_POR_DEFECTO } from './tokens_por_defecto';

describe('tokens a partir del tema (interfaz.md, «Tema a tokens»)', () => {
  it('el tema por defecto da los tokens por defecto', () => {
    expect(
      derivarTokens({
        primary: '#96B2B2',
        secondary: '#829890',
        text: '#14201C',
        fuente: TOKENS_POR_DEFECTO.fuente,
        tamano: TOKENS_POR_DEFECTO.tamano_fuente,
      }),
    ).toEqual(TOKENS_POR_DEFECTO);
  });

  it('con un texto claro el extremo es #121216 y los estados llegan a 3:1', () => {
    const t = derivarTokens({
      primary: '#0B3954',
      secondary: '#087E8B',
      text: '#F5F5F5',
      fuente: 'x',
      tamano: '16px',
    });
    expect(t.superficie).toBe('#0E3D45');
    for (const e of [t.estado_vencida, t.estado_pendiente, t.estado_completada]) {
      expect(contraste(e, t.superficie)).toBeGreaterThanOrEqual(3);
    }
    expect(contraste(t.sobre_marco, t.marco)).toBeGreaterThanOrEqual(4.5);
  });
});
