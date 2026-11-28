import { describe, expect, it } from 'vitest';

// F6-04a · Prueba global de animaciones (docs/implementacion/ANIMACIONES.md §7, «Prueba global», puntos 1 a 7; §3 y
// §4). Lee todos los CSS de src/ sin navegador.
//
// Los tokens de movimiento ya están (TK-06). Mientras falten las piezas AN-01 a AN-07, la prueba no exige cero
// hallazgos: exige que los hallazgos sean exactamente los de PENDIENTES (lo que falta, escrito abajo). Cada pieza quita
// sus líneas; TK-06v la cierra con la lista vacía. Un hallazgo nuevo, o uno que ya no está, hace fallar la prueba.

const CSS = import.meta.glob('/src/**/*.css', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const CODIGO = import.meta.glob(['/src/**/*.ts', '/src/**/*.tsx', '!/src/**/*.test.*'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const sinComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const archivo = (ruta: string) => ruta.replace(/^\/src\//, '');

interface Declaracion {
  archivo: string;
  selector: string;
  /** Pila de bloques @ que la contienen (por ejemplo `@media (prefers-reduced-motion: reduce)`). */
  en: string[];
  propiedad: string;
  valor: string;
}

/** Recorre el CSS por llaves y devuelve cada declaración con su selector y sus bloques @. */
function declaraciones(ruta: string, fuente: string): Declaracion[] {
  const css = sinComentarios(fuente);
  const salida: Declaracion[] = [];
  const pila: string[] = [];
  let desde = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      pila.push(css.slice(desde, i).trim());
      desde = i + 1;
    } else if (c === ';' || c === '}') {
      const texto = css.slice(desde, i).trim();
      const dos = texto.indexOf(':');
      if (texto && dos > 0 && pila.length > 0) {
        const selector = pila[pila.length - 1] ?? '';
        salida.push({
          archivo: archivo(ruta),
          selector,
          en: pila.filter((p) => p.startsWith('@')),
          propiedad: texto.slice(0, dos).trim().toLowerCase(),
          valor: texto.slice(dos + 1).trim(),
        });
      }
      if (c === '}') pila.pop();
      desde = i + 1;
    }
  }
  return salida;
}

const TODAS = Object.entries(CSS).flatMap(([ruta, fuente]) => declaraciones(ruta, fuente));
const REDUCE = (d: Declaracion) => d.en.some((e) => /prefers-reduced-motion:\s*reduce/.test(e));
// Por archivo y selector, no por línea: así la lista no cambia cuando otra pieza edita el CSS.
const dondeEsta = (d: Declaracion) => `${d.archivo} «${d.selector.replace(/\s+/g, ' ')}»`;

const MOVIMIENTO = new Set([
  'transition',
  'transition-duration',
  'transition-delay',
  'transition-timing-function',
  'animation',
  'animation-duration',
  'animation-delay',
  'animation-timing-function',
]);

/** Valor de un token `--dur-*` fuera del bloque reduced-motion, en milisegundos. */
const TOKENS_DUR = new Map(
  TODAS.filter((d) => d.propiedad.startsWith('--dur-') && !REDUCE(d)).map((d) => [d.propiedad, d.valor]),
);
const ms = (t: string) => (t.endsWith('ms') ? Number(t.slice(0, -2)) : Number(t.slice(0, -1)) * 1000);
const resolver = (valor: string) =>
  valor.replace(/var\((--dur-[\w-]+)(?:,\s*([^)]+))?\)/g, (_, nombre: string, respaldo?: string) => {
    return TOKENS_DUR.get(nombre) ?? respaldo ?? '0ms';
  });
const tiempos = (texto: string) => (texto.match(/(?<![\w.-])\d*\.?\d+m?s\b/g) ?? []).map(ms);

const DISPOSICION = new Set([
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-width',
  'grid-template-columns',
]);
const LAZOS = ['wg-girar', 'wg-parpadeo'];
const TOPE = 400;
const TOPE_LAZO = 1500;

/** Propiedades transicionadas por una declaración `transition` o `transition-property`. */
function propiedadesTransicionadas(d: Declaracion): string[] {
  const partes = d.valor.split(',').map((p) => p.trim());
  if (d.propiedad === 'transition-property') return partes;
  return partes.map((p) => p.split(/\s+/)[0] ?? '');
}

/** Todos los hallazgos de los puntos 1 a 7, en el mismo formato que PENDIENTES. */
function hallazgos(): string[] {
  const salida: string[] = [];
  // 1. Ninguna `transition: all`.
  for (const d of TODAS)
    if (/^transition(-property)?$/.test(d.propiedad) && /\ball\b/.test(d.valor))
      salida.push(`1 transition all: ${dondeEsta(d)}`);

  // 2. Ninguna duración + retraso pasa el tope (lazos infinitos: 1500 ms).
  for (const d of TODAS) {
    if (d.propiedad.startsWith('--dur-') && !REDUCE(d)) {
      const lazo = d.propiedad === '--dur-giro' || d.propiedad === '--dur-parpadeo';
      const [t = 0] = tiempos(d.valor);
      if (t > (lazo ? TOPE_LAZO : TOPE)) salida.push(`2 tope: ${d.propiedad} ${t}ms en ${dondeEsta(d)}`);
      continue;
    }
    if (!MOVIMIENTO.has(d.propiedad)) continue;
    for (const item of resolver(d.valor).split(',')) {
      const [duracion = 0, retraso = 0] = tiempos(item);
      const lazo = /\binfinite\b/.test(item);
      if (duracion + retraso > (lazo ? TOPE_LAZO : TOPE))
        salida.push(`2 tope: ${duracion + retraso}ms en ${dondeEsta(d)}`);
    }
  }

  // 3. Los valores de movimiento salen de los tokens.
  for (const d of TODAS) {
    if (!MOVIMIENTO.has(d.propiedad)) continue;
    const sinVar = d.valor.replace(/var\(--(dur|ease)-[\w-]+\)/g, '');
    if (/var\(/.test(sinVar) && /var\(--(dur|ease)-[\w-]+,/.test(d.valor))
      salida.push(`3 respaldo literal: ${dondeEsta(d)}`);
    else if (
      tiempos(sinVar).length > 0 ||
      /cubic-bezier\(|steps\(|\b(ease|ease-in|ease-out|ease-in-out|linear)\b/.test(sinVar)
    )
      salida.push(`3 literal: ${dondeEsta(d)}`);
  }

  // 4. Los tokens existen y valen lo de §3; no existen --dur-largo ni --ease-entrada.
  const definidos = new Map(
    TODAS.filter((d) => /^--(dur|ease)-/.test(d.propiedad) && !REDUCE(d)).map((d) => [d.propiedad, d.valor]),
  );
  const ESPERADOS: Record<string, string | null> = {
    '--dur-instante': '100ms',
    '--dur-corto': '150ms',
    '--dur-medio': '200ms',
    '--dur-giro': '1000ms',
    '--dur-parpadeo': '1200ms',
    '--ease-salida': 'cubic-bezier(0, 0, 0.58, 1)',
    '--ease-estandar': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    '--ease-lineal': 'linear',
    '--ease-parpadeo': 'cubic-bezier(0.42, 0, 0.58, 1)',
  };
  for (const [token, valor] of Object.entries(ESPERADOS)) {
    const real = definidos.get(token);
    if (real === undefined) salida.push(`4 falta el token ${token}`);
    else if (valor && real.replace(/\s+/g, ' ') !== valor)
      salida.push(`4 ${token} vale ${real}, no ${valor}`);
  }
  for (const prohibido of ['--dur-largo', '--ease-entrada'])
    if (definidos.has(prohibido)) salida.push(`4 sobra el token ${prohibido}`);

  // 5. Ninguna propiedad de disposición se anima (lista cerrada, por igualdad).
  for (const d of TODAS) {
    if (d.propiedad === 'transition' || d.propiedad === 'transition-property')
      for (const p of propiedadesTransicionadas(d))
        if (DISPOSICION.has(p)) salida.push(`5 anima ${p}: ${dondeEsta(d)}`);
    if (d.en.some((e) => e.startsWith('@keyframes')) && DISPOSICION.has(d.propiedad))
      salida.push(
        `5 anima ${d.propiedad} en ${d.en.find((e) => e.startsWith('@keyframes'))}: ${dondeEsta(d)}`,
      );
  }

  // 6. Un bloque reduced-motion que apaga el movimiento y los lazos.
  const reduce = TODAS.filter(REDUCE);
  const valeEnReduce = (token: string) => reduce.find((d) => d.propiedad === token)?.valor;
  for (const [token, valor] of [
    ['--mov-corto', '0px'],
    ['--mov-aviso', '0px'],
    ['--mov-panel', '0px'],
    ['--dur-corto', '100ms'],
    ['--dur-medio', '100ms'],
  ] as const)
    if (valeEnReduce(token) !== valor) salida.push(`6 reduced-motion no pone ${token} a ${valor}`);
  for (const d of TODAS) {
    if (REDUCE(d) || !/^animation(-name)?$/.test(d.propiedad)) continue;
    const lazo = LAZOS.find((l) => new RegExp(`\\b${l}\\b`).test(d.valor));
    if (!lazo) continue;
    const apagado = reduce.some(
      (r) => /^animation(-name)?$/.test(r.propiedad) && r.valor === 'none' && r.selector.includes(d.selector),
    );
    if (!apagado) salida.push(`6 reduced-motion no apaga ${lazo} en ${d.selector} (${dondeEsta(d)})`);
  }

  // 7. Sin scroll-behavior; `wheel` solo se registra en ventana_principal/bloquearZoom.ts (A-38).
  for (const d of TODAS)
    if (d.propiedad === 'scroll-behavior') salida.push(`7 scroll-behavior: ${dondeEsta(d)}`);
  for (const [ruta, fuente] of Object.entries(CODIGO))
    if (
      archivo(ruta) !== 'ventana_principal/bloquearZoom.ts' &&
      /addEventListener\(\s*['"]wheel['"]|\bonWheel\b/.test(fuente)
    )
      salida.push(`7 wheel: ${archivo(ruta)}`);
  return salida;
}

// Lo que falta el 27-nov-2026 (ANIMACIONES.md §2 y §6). Lo cierran AN-01 a AN-07 (TK-06 ya quitó sus líneas).
const PENDIENTES: string[] = [
  // AN-02: el aviso entra con `transition`, no con @keyframes (regla 8; hoy 200ms ease-out).
  '3 literal: ui/tema/tokens.css «.wg-resultado»',
  // AN-07: el parpadeo de los ojos con --dur-parpadeo y --ease-parpadeo (hoy 1.2s ease-in-out).
  '3 literal: ui/tema/tokens.css «.wg-ojos-de-windi--parpadeando .wg-ojos-de-windi__ojo»',
];

describe('F6-04a · movimiento en los CSS (ANIMACIONES.md §7, prueba global)', () => {
  it('lee los CSS de las pantallas y del tema', () => {
    for (const f of ['ui/tema/tokens.css', 'ventana_principal/marco.css', 'screens/kanban/kanban.css'])
      expect(Object.keys(CSS).map(archivo)).toContain(f);
    expect(TODAS.length).toBeGreaterThan(1000);
  });

  it('solo quedan los hallazgos que faltan por cerrar (puntos 1 a 7)', () => {
    expect([...hallazgos()].sort()).toEqual([...PENDIENTES].sort());
  });
});
