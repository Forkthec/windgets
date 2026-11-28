import { describe, expect, it } from 'vitest';
import estilos from './tokens.css?raw';
import marco from '../../ventana_principal/marco.css?raw';
import kanban from '../../screens/kanban/kanban.css?raw';
import configuracion from '../../screens/settings/configuracion.css?raw';

// AN-03 · Hover, foco y pulsado (docs/implementacion/ANIMACIONES.md §4, reglas 1 a 3; A-05b, A-05c, A-23, A-25 a
// A-29; tabla de selectores de §7).

const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
interface Regla {
  selectores: string[];
  cuerpo: string;
}
/** Parte una lista de selectores por sus comas de primer nivel (no las de `:is(...)` ni `:where(...)`). */
function partirSelectores(cabeza: string): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let desde = 0;
  for (let i = 0; i < cabeza.length; i++) {
    if (cabeza[i] === '(') nivel++;
    else if (cabeza[i] === ')') nivel--;
    else if (cabeza[i] === ',' && nivel === 0) {
      partes.push(cabeza.slice(desde, i));
      desde = i + 1;
    }
  }
  partes.push(cabeza.slice(desde));
  return partes;
}
const reglas = (css: string): Regla[] =>
  [...sinComentarios(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, cabeza = '', cuerpo = '']) => ({
    selectores: partirSelectores(cabeza).map((s) => s.replace(/\s+/g, ' ').trim()),
    cuerpo,
  }));
const TODAS = [estilos, marco, kanban, configuracion].flatMap(reglas);
/** Las reglas cuyo selector es exactamente `selector`. */
const de = (selector: string) => TODAS.filter((r) => r.selectores.includes(selector));

const CONTROLES = [
  '.wg-boton',
  '.wg-campo__entrada',
  '.wg-interruptor',
  '.wg-enlace',
  '.wg-miga__nivel',
  '.wg-menu-acciones__opcion',
  '.wg-menu__ocultar',
  '.wg-emergente__cerrar',
  '.wg-resultado__cerrar',
  '.wg-panel-windi__cerrar',
  '.wg-windi-flotante',
  '.wg-ciudad__opcion',
  '.wg-widget-noticias__titular',
  '.wg-icono-boton',
  '.wg-boton-titulo',
  '.wg-columna-fantasma',
  '.wg-campo__ojo',
];
const LISTA = [
  'background-color var(--dur-corto) var(--ease-salida)',
  'border-color var(--dur-corto) var(--ease-salida)',
  'color var(--dur-corto) var(--ease-salida)',
  'box-shadow var(--dur-corto) var(--ease-salida)',
  'outline-color var(--dur-instante) var(--ease-salida)',
];
const transicion = (cuerpo: string) =>
  cuerpo
    .match(/transition:\s*([^;]+);/)?.[1]
    ?.split(',')
    .map((p) => p.replace(/\s+/g, ' ').trim());

describe('AN-03 · reglas 1 y 2: hover y pulsado', () => {
  it.each(CONTROLES)(
    '%s transiciona sus colores en `--dur-corto` y el anillo en `--dur-instante`',
    (selector) => {
      const conTransicion = de(selector).filter((r) => /transition:/.test(r.cuerpo));
      expect(conTransicion).toHaveLength(1);
      expect(transicion(conTransicion[0]?.cuerpo ?? '')).toEqual(LISTA);
    },
  );

  it('al pulsar, todo el control responde en `--dur-instante`', () => {
    const pulsado = TODAS.find((r) => r.selectores.some((s) => /^:is\(\s*\.wg-boton,/.test(s)));
    expect(pulsado?.selectores.at(-1)).toMatch(/\):active$/);
    const todos = pulsado?.selectores.join(',') ?? '';
    for (const c of CONTROLES) expect(todos).toContain(c);
    expect(pulsado?.cuerpo.replace(/\s+/g, ' ')).toMatch(
      /transition-duration: var\(--dur-instante\), var\(--dur-instante\), var\(--dur-instante\), var\(--dur-instante\), var\(--dur-instante\);/,
    );
  });

  it('E1: el botón con el puntero encima es `superficie_baja`; Principal pulsado pierde su sombra', () => {
    expect(de('.wg-boton:where(:hover:not(:disabled, .wg-boton--principal))')[0]?.cuerpo).toMatch(
      /background: var\(--wg-superficie-baja\);/,
    );
    expect(de('.wg-boton.wg-boton--principal:active:not(:disabled)')[0]?.cuerpo).toMatch(/box-shadow: none;/);
  });

  it('A-25: el contorno de la tarjeta del Kanban aparece con fundido en `--dur-corto`', () => {
    const base = de('.wg-kanban__tarjeta')[0]?.cuerpo ?? '';
    expect(base).toMatch(/outline: 1px solid transparent;/);
    expect(base).toMatch(/transition: outline-color var\(--dur-corto\) var\(--ease-salida\);/);
    expect(de('.wg-kanban__tarjeta:hover')[0]?.cuerpo).toMatch(/outline-color: var\(--wg-linea\);/);
  });
});

describe('AN-03 · regla 3: el anillo de foco existe siempre', () => {
  it.each([
    '.wg-boton',
    '.wg-campo__entrada',
    '.wg-interruptor',
    '.wg-enlace',
    '.wg-miga__nivel',
    '.wg-windi-flotante',
  ])('%s declara `outline` transparente en su estado base', (selector) => {
    const cuerpos = de(selector).map((r) => r.cuerpo);
    expect(cuerpos.some((c) => /outline: var\(--wg-trazo-foco\) solid transparent;/.test(c))).toBe(true);
    for (const c of cuerpos) expect(c).not.toMatch(/outline:\s*none/);
  });
});

describe('AN-03 · A-27 campo y A-28 interruptor', () => {
  it('A-27: el campo con el puntero encima pone el borde `tinta`, salvo con error', () => {
    expect(
      de(".wg-campo__entrada:where(:hover:not(:disabled, :focus-visible, [aria-invalid='true']))")[0]?.cuerpo,
    ).toMatch(/border-color: var\(--wg-tinta\);/);
    expect(
      de('.wg-campo__mensaje').some((r) => /transition: opacity var\(--dur-medio\)/.test(r.cuerpo)),
    ).toBe(true);
  });

  it('A-28: la perilla se mueve con `transform` y `--ease-estandar`, ya no con `left`', () => {
    expect(
      de('.wg-interruptor::after').some((r) =>
        /transition: transform var\(--dur-corto\) var\(--ease-estandar\);/.test(r.cuerpo),
      ),
    ).toBe(true);
    const marcadas = TODAS.filter((r) =>
      r.selectores.some((s) => s.endsWith(".wg-interruptor[aria-checked='true']::after")),
    );
    for (const r of marcadas) expect(r.cuerpo).not.toMatch(/\bleft:/);
    expect(
      de(".wg-interruptor[aria-checked='true']::after").some((r) =>
        /transform: translateX\(var\(--wg-recorrido-perilla\)\);/.test(r.cuerpo),
      ),
    ).toBe(true);
    // El recorrido de cada tamaño: 20 px el base, 22 px el de la sesión y 28 px el de Configuración.
    expect(estilos).toMatch(/--wg-recorrido-perilla: calc\(var\(--wg-unidad\) \* 5\);/);
    expect(marco).toMatch(/--wg-recorrido-perilla: 22px;/);
    expect(configuracion).toMatch(/--wg-recorrido-perilla: 28px;/);
  });

  it('A-28: con «reducir movimiento» la perilla salta', () => {
    const reducido = estilos.split('@media (prefers-reduced-motion: reduce)')[1]?.split('\n}')[0] ?? '';
    expect(reducido).toMatch(/:root \.wg-interruptor::after \{\s*transition: none;/);
  });
});
