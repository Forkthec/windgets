import { describe, expect, it } from 'vitest';
import { contraste, tokensDeLosColores } from './derivar';
import { aplicarTokens } from './tokens';
import { TEMAS_DE_WINDGETS, TOKENS_POR_DEFECTO } from './tokens_por_defecto';

// RD-99: los pares de color de los botones y del selector segmentado. Cómo se pintan se comprueba en un navegador real
// (`e2e/rediseno-botones.spec.ts`).
const letra = { fuente: 'x', tamano: '16px' };
const TEMAS = [
  ['Windgets claro', tokensDeLosColores({ ...TEMAS_DE_WINDGETS.claro.colores, ...letra })],
  ['Windgets oscuro', tokensDeLosColores({ ...TEMAS_DE_WINDGETS.oscuro.colores, ...letra })],
] as const;

describe('RD-99 · Contraste de botones, selector segmentado y foco', () => {
  it.each(TEMAS)('%s: texto del principal, del destructivo y de la opción elegida a 4,5:1', (_, t) => {
    expect(contraste(t.sobre_accion, t.accion)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.error ?? '', t.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.superficie, t.secundario ?? '')).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.tinta, t.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.texto, t.superficie_baja)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(TEMAS)('%s: bordes y contorno de foco a 3:1 sobre cada fondo', (_, t) => {
    for (const fondo of [t.marco, t.superficie, t.superficie_alta, t.superficie_baja]) {
      expect(contraste(t.tinta, fondo), `foco sobre ${fondo}`).toBeGreaterThanOrEqual(3);
    }
    expect(contraste(t.borde, t.superficie)).toBeGreaterThanOrEqual(3);
    expect(contraste(t.borde, t.superficie_baja)).toBeGreaterThanOrEqual(3);
  });

  it('en un tema sin «secundario» ni «error», el respaldo del destructivo cumple 4,5:1 y 3:1', () => {
    const t = TOKENS_POR_DEFECTO;
    expect(contraste(t.tinta, t.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.estado_vencida, t.superficie)).toBeGreaterThanOrEqual(3);
  });

  it.each(TEMAS)('%s: sobre «secundario» se escribe con la superficie del tema', (_, t) => {
    const raiz = document.createElement('div');
    aplicarTokens(t, raiz);
    expect(raiz.style.getPropertyValue('--wg-sobre-secundario')).toBe(t.superficie);
    aplicarTokens(TOKENS_POR_DEFECTO, raiz);
    expect(raiz.style.getPropertyValue('--wg-sobre-secundario')).toBe('');
    expect(raiz.style.getPropertyValue('--wg-secundario')).toBe('');
    expect(raiz.style.getPropertyValue('--wg-error')).toBe('');
  });
});
