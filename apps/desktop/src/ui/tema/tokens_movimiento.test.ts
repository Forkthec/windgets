import { describe, expect, it } from 'vitest';
import estilos from './tokens.css?raw';

// TK-06 · Tokens de movimiento y bloque «reducir movimiento» (docs/implementacion/ANIMACIONES.md §3 y §4, regla 10).
// La prueba global (movimiento.test.ts, puntos 4 y 6) comprueba los mismos valores en todos los CSS; esta mira el
// bloque de tokens.css y que sea el único de la aplicación.

const CSS = import.meta.glob('/src/**/*.css', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const MEDIA = '@media (prefers-reduced-motion: reduce)';

/** Las declaraciones `--dur-*`, `--ease-*` y `--mov-*` de un trozo de CSS. */
const tokens = (css: string) =>
  Object.fromEntries(
    [...css.matchAll(/(--(?:dur|ease|mov)-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]?.trim()]),
  );

const css = sinComentarios(estilos);
const [fuera = '', ...bloques] = css.split(MEDIA);
const reducido = bloques[0]?.split('\n}')[0] ?? '';

describe('TK-06 · tokens de movimiento (ANIMACIONES.md §3)', () => {
  it('las duraciones, curvas y distancias valen lo de §3', () => {
    expect(tokens(fuera)).toEqual({
      '--dur-instante': '100ms',
      '--dur-corto': '150ms',
      '--dur-medio': '200ms',
      '--dur-giro': '1000ms',
      '--dur-parpadeo': '1200ms',
      '--ease-salida': 'cubic-bezier(0, 0, 0.58, 1)',
      '--ease-estandar': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      '--ease-lineal': 'linear',
      '--ease-parpadeo': 'cubic-bezier(0.42, 0, 0.58, 1)',
      '--mov-corto': '8px',
      '--mov-aviso': '12px',
      '--mov-panel': '24px',
    });
  });

  it('no existen --dur-largo ni --ease-entrada', () => {
    for (const fuente of Object.values(CSS))
      expect(sinComentarios(fuente)).not.toMatch(/--dur-largo|--ease-entrada/);
  });
});

describe('TK-06 · «reducir movimiento» (ANIMACIONES.md §4, regla 10)', () => {
  it('hay un solo bloque en toda la aplicación y está en tokens.css', () => {
    const conBloque = Object.entries(CSS).filter(([, fuente]) =>
      sinComentarios(fuente).includes('prefers-reduced-motion'),
    );
    expect(conBloque.map(([ruta]) => ruta)).toEqual(['/src/ui/tema/tokens.css']);
    expect(bloques).toHaveLength(1);
  });

  it('quita el desplazamiento y deja toda transición en fundido de 100 ms', () => {
    expect(tokens(reducido)).toEqual({
      '--mov-corto': '0px',
      '--mov-aviso': '0px',
      '--mov-panel': '0px',
      '--dur-corto': '100ms',
      '--dur-medio': '100ms',
    });
  });

  it('deja quietos los lazos (giro y parpadeo) y el aviso que entra', () => {
    const quietos = reducido.match(/([^{}]+)\{\s*animation: none;\s*\}/)?.[1] ?? '';
    expect(quietos.split(',').map((s) => s.trim())).toEqual([
      '.wg-resultado',
      '.wg-cargando',
      '.wg-icono--girando',
      '.wg-ojos-de-windi--parpadeando .wg-ojos-de-windi__ojo',
    ]);
  });
});
