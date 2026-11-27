import { describe, expect, it } from 'vitest';
import estilos from './tokens.css?raw';

// TK-05 · Nombres y valores distintos (docs/implementacion/TEMAS_Y_TOKENS.md §8.2 y §8.3; docs/rediseno.md RD-107).
// Lo que pinta el navegador lo miden `rediseno-botones.spec.ts` y las pruebas de cada pantalla; aquí se comprueba que
// las reglas de la hoja de estilos usan los tokens que piden las decisiones.

/** Las declaraciones de la primera regla cuyo selector es exactamente este. */
const regla = (selector: string): string => {
  const inicio = estilos.indexOf(`\n${selector} {`);
  expect(inicio, selector).toBeGreaterThan(-1);
  return estilos.slice(inicio, estilos.indexOf('}', inicio));
};

describe('TK-05 · radio, trazo y sombra de siempre (§8.3)', () => {
  it('radio 9 y trazo 1,5 de los controles; sombra dura 3,5 con `borde` sin tema de Windgets', () => {
    expect(estilos).toContain('--wg-radio: var(--wg-radio-control);');
    expect(estilos).toContain('--wg-borde-ancho: var(--wg-trazo-control);');
    expect(estilos).toContain('--wg-sombra: 3px 5px 0 var(--wg-borde);');
  });
});

describe('TK-05 · anillo de foco (D6): 2 px `tinta`, separado 3 px', () => {
  it.each([
    '.wg-boton:focus-visible',
    '.wg-interruptor:focus-visible',
    '.wg-miga__nivel:focus-visible',
    '.wg-enlace:focus-visible',
    'button.wg-tarjeta__titulo:focus-visible',
  ])('%s', (selector) => {
    const r = regla(selector);
    expect(r).toContain('outline: var(--wg-trazo-foco) solid var(--wg-trazo-foco-color)');
    expect(r).toContain('outline-offset: var(--wg-separacion-foco)');
  });

  it('ningún foco usa ya la acción', () => {
    for (const bloque of estilos.split('}').filter((b) => b.includes(':focus-visible')))
      expect(bloque).not.toMatch(/outline:[^;]*--wg-accion/);
  });
});

describe('TK-05 · avisos (D1 y P2)', () => {
  it('el texto va en `texto`; el color del tipo es la variable de estado', () => {
    expect(regla('.wg-resultado')).toContain('color: var(--wg-texto);');
    expect(regla('.wg-resultado')).toContain('--wg-resultado-color: var(--wg-estado-completada);');
    expect(regla('.wg-resultado--advertencia')).toContain('var(--wg-estado-pendiente)');
    expect(regla('.wg-resultado--error')).toContain('var(--wg-error, var(--wg-estado-vencida))');
    expect(regla('.wg-resultado--info')).toContain('var(--wg-informacion, var(--wg-accion))');
    expect(estilos).not.toMatch(/--wg-mensaje-(exito|advertencia)/);
  });
});

describe('TK-05 · nombres distintos (§8.2)', () => {
  it('la opción elegida del selector segmentado va en `seleccion` y `sobre_seleccion`', () => {
    const r = regla(".wg-segmentado__opcion[aria-pressed='true']");
    expect(r).toContain('background: var(--wg-seleccion, var(--wg-accion));');
    expect(r).toContain('color: var(--wg-sobre-seleccion, var(--wg-sobre-accion));');
  });

  it('el día actual del widget Calendario y del Calendario va en `detalle`', () => {
    const widget = regla('.wg-calendario-widget__hoy');
    expect(widget).toContain('background: var(--wg-detalle, var(--wg-accion));');
    expect(widget).toContain('color: var(--wg-sobre-detalle, var(--wg-sobre-accion));');
    expect(regla('.wg-calendario__dia--hoy')).toContain('var(--wg-detalle, var(--wg-accion))');
  });
});
