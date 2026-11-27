import { afterEach, describe, expect, it } from 'vitest';
import DOC from '../../../../../docs/implementacion/TEMAS_Y_TOKENS.md?raw';
import estilos from './tokens.css?raw';
import { tokensDeLosColores } from './derivar';
import { aplicarTokens } from './tokens';
import { TEMAS_DE_WINDGETS, TOKENS_POR_DEFECTO } from './tokens_por_defecto';

// TK-03 · Radios, trazos, sombras y anillo de foco (docs/implementacion/TEMAS_Y_TOKENS.md §2 y §4). Las tablas se
// leen del documento: si el documento cambia un valor, la prueba exige el mismo cambio en tokens.css.

const seccion = (desde: string, hasta: string) => (DOC.split(desde)[1] ?? '').split(hasta)[0] ?? '';
const filas = (bloque: string) =>
  bloque
    .split(/\r?\n/)
    .filter((l) => l.startsWith('|') && !/^\|[-\s|]+\|$/.test(l))
    .slice(1)
    .map((l) =>
      l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim().replace(/`/g, '')),
    );
const numeros = (texto: string) => (texto.match(/\d+(,\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.')));

/** El valor de una variable CSS en el bloque TK-03 de tokens.css. */
const BLOQUE = estilos.split('/* TK-03')[1]?.split('\n}')[0] ?? '';
const variable = (nombre: string) =>
  BLOQUE.match(new RegExp(`--wg-${nombre.replace(/_/g, '-')}:\\s*([^;]+);`))?.[1]?.trim();
const px = (nombre: string) => {
  const v = variable(nombre);
  return v === undefined ? undefined : Number(v.replace(/px$/, ''));
};

describe('TK-03 · radios, trazos y sombras del rediseño', () => {
  it('§4.1 · cada radio de la tabla es un token con su valor en px', () => {
    const tabla = filas(seccion('### 4.1', '### 4.2'));
    expect(tabla.length).toBeGreaterThan(15);
    for (const [tokens = '', valor = ''] of tabla) {
      for (const token of tokens.split(', ')) {
        if (token === 'radio_widgets' || token === 'radio_anillo_foco') continue; // abajo
        expect(px(token), token).toBe(numeros(valor)[0]);
      }
    }
    // Los segundos valores de una fila.
    expect(px('radio_perilla_interruptor')).toBe(5);
    expect(px('radio_aviso_interno')).toBe(4);
  });

  it('§2 y R11 · radio de widgets: Rectas 0, Base = variable FLOAT 9, Redondas 22; la base es la de partida', () => {
    const float = filas(seccion('## 2.', '## 3.')).find((c) => c[0] === 'Radio de widgets');
    expect(px('radio_widgets_base')).toBe(Number(float?.[2]));
    const [rectas, base, redondas] = numeros(
      filas(seccion('### 4.1', '### 4.2')).find((c) => c[0] === 'radio_widgets')?.[1] ?? '',
    );
    expect([px('radio_widgets_rectas'), px('radio_widgets_base'), px('radio_widgets_redondas')]).toEqual([
      rectas,
      base,
      redondas,
    ]);
    expect(variable('radio_widgets')).toBe('var(--wg-radio-widgets-base)');
  });

  it('§4.2 · cada trazo es un token con su grosor y, si la tabla lo da, su color', () => {
    const tabla = filas(seccion('### 4.2', '### 4.3'));
    expect(tabla.length).toBe(7);
    for (const [token = '', valor = ''] of tabla) {
      expect(px(token), token).toBe(numeros(valor)[0]);
      const color = valor.match(/color (\w+)/)?.[1];
      if (color)
        expect(variable(`${token}_color`), token).toMatch(
          new RegExp(`^var\\(--wg-${color.replace(/_/g, '-')}\\b`),
        );
    }
  });

  it('§4.3 · las sombras son duras, con el desplazamiento y el color de la tabla', () => {
    const tabla = filas(seccion('### 4.3', '### 4.4'));
    expect(tabla.length).toBe(4);
    for (const [token = '', desplazamiento = '', color = ''] of tabla) {
      const valor = variable(token) ?? '';
      expect(numeros(valor.split(/\s(?=var|#)/)[0] ?? ''), token).toEqual(numeros(desplazamiento));
      const nombre = color.split(' ')[0] ?? '';
      if (nombre.startsWith('#')) expect(valor.endsWith(nombre), token).toBe(true);
      else if (nombre === 'sombra')
        expect(valor, token).toMatch(/var\(--wg-sombra-color, var\(--wg-borde\)\)$/);
      else expect(valor, token).toMatch(new RegExp(`var\\(--wg-${nombre}\\)$`));
    }
  });

  it('§4.4 · anillo de foco: 2 px `tinta`, separado 3 px, radio del control + 3 (12; interruptor 11)', () => {
    expect(px('trazo_foco')).toBe(2);
    expect(variable('trazo_foco_color')).toBe('var(--wg-tinta)');
    expect(px('separacion_foco')).toBe(3);
    expect(variable('radio_anillo_foco')).toBe('calc(var(--wg-radio-control) + var(--wg-separacion-foco))');
    expect(variable('radio_anillo_foco_interruptor')).toBe(
      'calc(var(--wg-radio-interruptor) + var(--wg-separacion-foco))',
    );
    expect((px('radio_control') ?? 0) + (px('separacion_foco') ?? 0)).toBe(12);
    expect((px('radio_interruptor') ?? 0) + (px('separacion_foco') ?? 0)).toBe(11);
  });
});

describe('TK-03 · color de la sombra según el tema', () => {
  const raiz = document.createElement('div');
  afterEach(() => raiz.removeAttribute('style'));
  const tokensDe = (tema: 'claro' | 'oscuro') =>
    tokensDeLosColores({ ...TEMAS_DE_WINDGETS[tema].colores, fuente: 'x', tamano: '14px' });

  it('Windgets claro y oscuro escriben el color de su `sombra`', () => {
    aplicarTokens(tokensDe('claro'), raiz);
    expect(raiz.style.getPropertyValue('--wg-sombra-color').toLowerCase()).toBe('#241c30');
    aplicarTokens(tokensDe('oscuro'), raiz);
    expect(raiz.style.getPropertyValue('--wg-sombra-color').toLowerCase()).toBe('#100d15');
  });

  it('un tema sin `sombra` lo quita y la hoja de estilos usa `borde`', () => {
    aplicarTokens(tokensDe('claro'), raiz);
    aplicarTokens(TOKENS_POR_DEFECTO, raiz);
    expect(TOKENS_POR_DEFECTO.sombra).toBeUndefined();
    expect(raiz.style.getPropertyValue('--wg-sombra-color')).toBe('');
  });
});
