import { describe, expect, it } from 'vitest';
import { NOMBRES_TOKEN } from './tokens';
import { TOKENS_POR_DEFECTO } from './tokens_por_defecto';

// Luminancia relativa y contraste de WCAG 2.1, como los define interfaz.md («Legibilidad»).
function luminancia(hex: string): number {
  const canal = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}
const contraste = (a: string, b: string) => {
  const mayor = Math.max(luminancia(a), luminancia(b));
  const menor = Math.min(luminancia(a), luminancia(b));
  return (mayor + 0.05) / (menor + 0.05);
};

describe('tokens del tema por defecto', () => {
  it('define todos los tokens', () => {
    for (const nombre of NOMBRES_TOKEN) expect(TOKENS_POR_DEFECTO[nombre]).toBeTruthy();
  });

  it('da los valores que fija interfaz.md para el tema por defecto', () => {
    expect(TOKENS_POR_DEFECTO.superficie).toBe('#CDD6D3');
    expect(TOKENS_POR_DEFECTO.accion).toBe('#61746D');
    expect(TOKENS_POR_DEFECTO.marco).toBe('#96B2B2');
  });

  it('cumple los tres pares de legibilidad sobre la superficie (R-13)', () => {
    const { superficie, tinta, texto, accion } = TOKENS_POR_DEFECTO;
    expect(contraste(tinta, superficie)).toBeGreaterThanOrEqual(7);
    expect(contraste(texto, superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(accion, superficie)).toBeGreaterThanOrEqual(3);
  });

  it('el texto sobre el marco y sobre la acción llega a 4,5:1', () => {
    const t = TOKENS_POR_DEFECTO;
    expect(contraste(t.sobre_marco, t.marco)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.sobre_accion, t.accion)).toBeGreaterThanOrEqual(4.5);
  });

  it('los colores de estado llegan a 3:1 con la superficie', () => {
    const t = TOKENS_POR_DEFECTO;
    for (const estado of [t.estado_vencida, t.estado_pendiente, t.estado_completada]) {
      expect(contraste(estado, t.superficie)).toBeGreaterThanOrEqual(3);
    }
  });
});
