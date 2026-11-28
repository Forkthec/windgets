import { describe, expect, it } from 'vitest';
import pantalla from './calendario.css?raw';
import estilos from '@/ui/tema/tokens.css?raw';

// AN-07 · Calendario (docs/implementacion/ANIMACIONES.md A-20, A-21, A-22b): el día resalta al pasar el puntero con
// `superficie_baja` (CONSISTENCIA E18); el cambio de mes o de semana y el día de hoy no se animan.

const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const reglas = (css: string) =>
  [...sinComentarios(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', cuerpo = '']) => ({
    selector: selector.replace(/\s+/g, ' ').trim(),
    cuerpo,
  }));
const TODAS = [...reglas(estilos), ...reglas(pantalla)];

describe('AN-07 · A-20 el día resalta al pasar el puntero', () => {
  it('la celda transiciona solo `background-color` con `--dur-corto` y `--ease-salida`', () => {
    const celda = TODAS.find((r) => r.selector === '.wg-calendario-pantalla .wg-calendario__celda');
    expect(celda?.cuerpo).toMatch(/transition: background-color var\(--dur-corto\) var\(--ease-salida\);/);
  });

  it('con el puntero encima, `superficie_baja`, salvo en los días con vencidas o pendientes', () => {
    const hover = TODAS.find(
      (r) => r.selector.endsWith(':hover') && r.selector.includes('wg-calendario__celda'),
    );
    expect(hover?.selector).toBe(
      '.wg-calendario-pantalla .wg-calendario__celda:not(.wg-calendario__dia--pendiente):not(.wg-calendario__dia--vencida):hover',
    );
    expect(hover?.cuerpo).toMatch(/background: var\(--wg-superficie-baja\);/);
  });
});

describe('AN-07 · A-21 y A-22b sin animación', () => {
  it('la rejilla del mes, la semana, el widget y el día de hoy no declaran transición ni animación', () => {
    const quietas = TODAS.filter((r) =>
      /(^|[\s,])\.wg-calendario(-semana|-widget)?(\s|,|$)|wg-calendario__dia--hoy/.test(r.selector),
    );
    expect(quietas.length).toBeGreaterThan(0);
    for (const r of quietas) expect(r.cuerpo, r.selector).not.toMatch(/\b(transition|animation)/);
  });
});
