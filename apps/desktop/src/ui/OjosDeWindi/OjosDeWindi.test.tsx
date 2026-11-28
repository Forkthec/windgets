import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import estilos from '@/ui/tema/tokens.css?raw';
import { tokensDeLosColores } from '@/ui/tema/derivar';
import { aplicarTokens } from '@/ui/tema/tokens';
import { TEMAS_DE_WINDGETS, TOKENS_POR_DEFECTO } from '@/ui/tema/tokens_por_defecto';
import { DibujoDeWindi } from './DibujoDeWindi';
import { OjosDeWindi } from './OjosDeWindi';

// C3-05 · Ojos de Windi (docs/implementacion/SPEC_Marco_y_componentes_base.md MB-27; F0b §3, Figma 2004:334).

afterEach(cleanup);

const ojos = (c: HTMLElement) => c.querySelector('[data-testid="windi-ojos"]') as SVGSVGElement;
const num = (e: Element, a: string) => Number(e.getAttribute(a));

/** Caja de los dos óvalos en las coordenadas del dibujo de 48, con el desplazamiento del grupo. */
function caja(svg: SVGSVGElement) {
  const dx = Number(
    svg
      .querySelector('g')
      ?.getAttribute('transform')
      ?.match(/translate\(([\d.]+)/)?.[1] ?? 0,
  );
  const elipses = [...svg.querySelectorAll('ellipse')];
  const x = Math.min(...elipses.map((e) => num(e, 'cx') - num(e, 'rx'))) + dx;
  const y = Math.min(...elipses.map((e) => num(e, 'cy') - num(e, 'ry')));
  const derecha = Math.max(...elipses.map((e) => num(e, 'cx') + num(e, 'rx'))) + dx;
  const abajo = Math.max(...elipses.map((e) => num(e, 'cy') + num(e, 'ry')));
  return { x, y, ancho: derecha - x, alto: abajo - y };
}
const cerca = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(0.5);

describe('C3-05 · OjosDeWindi', () => {
  it('en reposo: dos óvalos en la caja (14, 23.5) de 18,5×4,5 del dibujo de 48, decorativos', () => {
    const { container } = render(<OjosDeWindi tamano={48} />);
    const svg = ojos(container);
    expect(svg.getAttribute('viewBox')).toBe('0 0 48 48');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelectorAll('ellipse')).toHaveLength(2);
    const c = caja(svg);
    cerca(c.x, 14);
    cerca(c.y, 23.5);
    cerca(c.ancho, 18.5);
    cerca(c.alto, 4.5);
  });

  it('escribiendo: los ojos se desplazan 2 px a la derecha, a la misma altura', () => {
    const { container } = render(<OjosDeWindi tamano={48} estado="escribiendo" />);
    const c = caja(ojos(container));
    cerca(c.x, 16);
    cerca(c.y, 23.5);
  });

  it('sin conexión o con error: ojos cerrados, dos arcos de trazo 1,2 y sin óvalos', () => {
    const { container } = render(<OjosDeWindi tamano={48} estado="cerrados" parpadeando />);
    const svg = ojos(container);
    expect(svg.querySelectorAll('ellipse')).toHaveLength(0);
    expect(svg.querySelectorAll('.wg-ojos-de-windi__cerrado')).toHaveLength(2);
    expect(svg.querySelector('g')?.getAttribute('stroke-width')).toBe('1.2');
    // Cerrados no parpadean.
    expect(svg.classList.contains('wg-ojos-de-windi--parpadeando')).toBe(false);
  });

  it('la prop `parpadeando` pone la clase del parpadeo (A-22)', () => {
    const { container, rerender } = render(<OjosDeWindi tamano={28} />);
    expect(ojos(container).classList.contains('wg-ojos-de-windi--parpadeando')).toBe(false);
    rerender(<OjosDeWindi tamano={28} parpadeando />);
    expect(ojos(container).classList.contains('wg-ojos-de-windi--parpadeando')).toBe(true);
  });

  it('con «reducir movimiento» no parpadean', () => {
    const reducido = estilos.split('@media (prefers-reduced-motion: reduce)').slice(1);
    expect(
      reducido.some((b) =>
        /\.wg-ojos-de-windi--parpadeando \.wg-ojos-de-windi__ojo \{\s*animation: none;/.test(
          b.split('\n}')[0] ?? '',
        ),
      ),
    ).toBe(true);
  });

  it.each([
    ['claro', TEMAS_DE_WINDGETS.claro.colores],
    ['oscuro', TEMAS_DE_WINDGETS.oscuro.colores],
    ['derivado', { primary: '#201B2B', secondary: '#DC026C', text: '#FFFFFF' }],
  ])('color fijo #27152B en el tema %s (no usa la acción)', (_, colores) => {
    aplicarTokens(tokensDeLosColores({ ...colores, fuente: 'x', tamano: '14px' }));
    const { container } = render(<OjosDeWindi tamano={48} />);
    const svg = ojos(container);
    expect(svg.querySelector('g')?.getAttribute('fill')).toBe('#27152B');
    expect(svg.innerHTML).not.toContain('currentColor');
    aplicarTokens(TOKENS_POR_DEFECTO);
  });
});

describe('C3-05 · DibujoDeWindi (MB-05 §3)', () => {
  it('cuerpo amarillo fijo con trazo 1,5, boca y los ojos encima', () => {
    const { container } = render(<DibujoDeWindi tamano={64} />);
    const dibujo = container.querySelector('[data-testid="windi-dibujo"]') as SVGSVGElement;
    expect(dibujo.getAttribute('width')).toBe('64');
    const cuerpo = dibujo.querySelector('.wg-dibujo-de-windi__cuerpo');
    expect(cuerpo?.getAttribute('fill')).toBe('#FFCA22');
    expect(cuerpo?.getAttribute('stroke-width')).toBe('1.5');
    expect(dibujo.querySelector('.wg-dibujo-de-windi__boca')?.getAttribute('stroke')).toBe('#27152B');
    expect(dibujo.lastElementChild?.getAttribute('data-testid')).toBe('windi-ojos');
    expect(estilos).toMatch(/\.wg-dibujo-de-windi__cuerpo \{\s*stroke: var\(--wg-borde\);/);
  });

  it('sin conexión o con error: boca recta y ojos cerrados', () => {
    const { container } = render(<DibujoDeWindi tamano={48} estado="cerrados" />);
    expect(container.querySelector('.wg-dibujo-de-windi__boca')?.getAttribute('d')).toBe(
      'M20.0505 30.0292H24.5685',
    );
    expect(ojos(container).dataset.estado).toBe('cerrados');
  });
});

// AN-07 · A-22 (docs/implementacion/ANIMACIONES.md): el parpadeo con sus tokens y el fin del ciclo abierto.
describe('AN-07 · A-22 parpadeo de los ojos', () => {
  const parpadea = (c: HTMLElement) => ojos(c).classList.contains('wg-ojos-de-windi--parpadeando');

  afterEach(() => vi.unstubAllGlobals());

  it('al dejar de parpadear, la clase sigue hasta el fin del ciclo (animationiteration) y luego se quita', () => {
    const { container, rerender } = render(<OjosDeWindi tamano={28} parpadeando />);
    rerender(<OjosDeWindi tamano={28} parpadeando={false} />);
    expect(parpadea(container)).toBe(true);
    fireEvent.animationIteration(ojos(container).querySelector('ellipse') as Element);
    expect(parpadea(container)).toBe(false);
  });

  it('si vuelve a parpadear antes del fin del ciclo, sigue parpadeando', () => {
    const { container, rerender } = render(<OjosDeWindi tamano={28} parpadeando />);
    rerender(<OjosDeWindi tamano={28} parpadeando={false} />);
    rerender(<OjosDeWindi tamano={28} parpadeando />);
    fireEvent.animationIteration(ojos(container));
    expect(parpadea(container)).toBe(true);
  });

  it('con «reducir movimiento», la clase se quita de inmediato', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }) as MediaQueryList);
    const { container, rerender } = render(<OjosDeWindi tamano={28} parpadeando />);
    rerender(<OjosDeWindi tamano={28} parpadeando={false} />);
    expect(parpadea(container)).toBe(false);
  });

  it('el lazo usa `--dur-parpadeo` y `--ease-parpadeo`', () => {
    expect(estilos).toMatch(
      /\.wg-ojos-de-windi--parpadeando \.wg-ojos-de-windi__ojo \{\s*animation: wg-parpadeo var\(--dur-parpadeo\) var\(--ease-parpadeo\) infinite;/,
    );
  });
});
