import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

// F6-02 · Arnés de geometría (docs/implementacion/PLAN.md, «Pruebas contra el Figma sin capturas»; COLA.md F6-02).
// Mide cada `data-testid` de la pantalla y lo compara con la capa de su huella (e2e/figma/<id>.json): caja ±2 px,
// color exacto por token, misma fuente y mismo texto. Las coordenadas de la huella son las del marco de referencia
// (1093×560); en otro tamaño de marco la caja se traslada o se estira según el anclaje que dice la spec en su columna
// «Comportamiento al cambiar el marco». Si la huella no trae la caja (DECISIONES.md FC-HUELLAS), la fila la da a mano
// con los valores de la spec.

const FIGMA = join(dirname(fileURLToPath(import.meta.url)), '..', 'figma');
export const MARCO_REFERENCIA = { width: 1093, height: 560 };
export const TAMANOS = [
  { width: 1200, height: 800 },
  { width: 960, height: 600 },
];
export const TOLERANCIA = 2;

export interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Un elemento de la huella (solo las claves que usa el arnés). */
export interface Capa extends Partial<Caja> {
  n?: string;
  txt?: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  r?: number | string;
  font?: string;
}

/**
 * Cómo se mueve la caja cuando el marco no mide 1093×560 (columna «Comportamiento» de la spec):
 * `izquierda`/`arriba` = fija; `derecha`/`abajo` = anclada a ese borde; `centro` = se mueve la mitad;
 * `estira` = crece lo mismo que el marco. `ancho`/`alto` permiten un valor calculado (por ejemplo `min(842, zona − 48)`).
 */
export interface Anclaje {
  h?: 'izquierda' | 'derecha' | 'centro' | 'estira';
  v?: 'arriba' | 'abajo' | 'centro' | 'estira';
  ancho?: (marco: { width: number; height: number }) => number;
  alto?: (marco: { width: number; height: number }) => number;
}

export interface Fila {
  testid: string;
  /** Id de la huella con guion (`204-3109`). */
  huella: string;
  /** Nombre de la capa (`n`) en la huella o en sus bases. */
  capa?: string;
  /** Si hay varias capas con el mismo nombre, la de índice `indice` (0 = la primera). */
  indice?: number;
  /** Caja de la spec cuando la huella no la trae (FC-HUELLAS); gana sobre la de la huella. */
  caja?: Caja;
  anclaje?: Anclaje;
  /** Qué comparar además de la caja (por defecto, lo que traiga la capa). */
  sin?: ('caja' | 'relleno' | 'borde' | 'radio' | 'fuente' | 'texto')[];
}

type Huella = { id?: string; base?: string | null; el?: unknown[] };

export function leerHuella(id: string): Huella {
  const ruta = join(FIGMA, `${id}.json`);
  if (!existsSync(ruta)) throw new Error(`No existe la huella ${id}.json en e2e/figma`);
  return JSON.parse(readFileSync(ruta, 'utf-8')) as Huella;
}

/** Las capas medidas de la huella y, detrás, las de su cadena de bases. */
export function capasDe(id: string): Capa[] {
  const capas: Capa[] = [];
  const vistas = new Set<string>();
  let actual: string | null = id;
  while (actual && !vistas.has(actual)) {
    vistas.add(actual);
    const h = leerHuella(actual);
    for (const e of h.el ?? []) if (e && typeof e === 'object') capas.push(e as Capa);
    actual = typeof h.base === 'string' && /^\d+[:-]\d+$/.test(h.base) ? h.base.replace(':', '-') : null;
  }
  return capas;
}

export function buscarCapa(fila: Fila): Capa {
  if (!fila.capa) return {};
  const iguales = capasDe(fila.huella).filter((c) => c.n === fila.capa);
  const capa = iguales[fila.indice ?? 0];
  if (!capa)
    throw new Error(`La huella ${fila.huella} no tiene la capa «${fila.capa}» (índice ${fila.indice ?? 0})`);
  return capa;
}

/** La caja que debe tener el elemento en un marco de tamaño `marco`, según su anclaje. */
export function cajaEsperada(base: Caja, anclaje: Anclaje = {}, marco = MARCO_REFERENCIA): Caja {
  const dx = marco.width - MARCO_REFERENCIA.width;
  const dy = marco.height - MARCO_REFERENCIA.height;
  const caja = { ...base };
  if (anclaje.h === 'derecha') caja.x += dx;
  if (anclaje.h === 'centro') caja.x += dx / 2;
  if (anclaje.h === 'estira') caja.w += dx;
  if (anclaje.v === 'abajo') caja.y += dy;
  if (anclaje.v === 'centro') caja.y += dy / 2;
  if (anclaje.v === 'estira') caja.h += dy;
  if (anclaje.ancho) caja.w = anclaje.ancho(marco);
  if (anclaje.alto) caja.h = anclaje.alto(marco);
  return caja;
}

const PESOS: Record<string, number> = {
  thin: 100,
  light: 300,
  r: 400,
  regular: 400,
  m: 500,
  medium: 500,
  sb: 600,
  semibold: 600,
  b: 700,
  bold: 700,
};

/** «Nunito Bold 26», «Nunito M 15» o «Rubik Medium 13/18» → familia, peso, tamaño y alto de línea. */
export function leerFuente(font: string) {
  const m = font.trim().match(/^(.+?)\s+(\w+)\s+(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/);
  if (!m) throw new Error(`Fuente sin formato conocido: «${font}»`);
  const [, familia = '', peso = '', tamano = '', alto] = m;
  const valor = PESOS[peso.toLowerCase()];
  if (valor === undefined) throw new Error(`Peso desconocido «${peso}» en «${font}»`);
  return { familia, peso: valor, tamano: Number(tamano), alto: alto ? Number(alto) : undefined };
}

const esVariable = (v: string) => /^[a-z_]+$/.test(v);

/** Medida y estilo calculado de un `data-testid`, más el color de cada token pedido resuelto en la página. */
async function medir(page: Page, testid: string, tokens: string[]) {
  return page.evaluate(
    ({ testid, tokens }) => {
      const el = document.querySelector(`[data-testid="${testid}"]`);
      const resolver = (css: string) => {
        const p = document.createElement('span');
        p.style.color = css;
        document.body.append(p);
        const c = getComputedStyle(p).color;
        p.remove();
        return c;
      };
      const colores = Object.fromEntries(
        tokens.map((t) => [t, resolver(t.startsWith('#') ? t : `var(--wg-${t.replace(/_/g, '-')})`)]),
      );
      if (!el) return { existe: false as const, colores };
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        existe: true as const,
        colores,
        caja: { x: r.x, y: r.y, w: r.width, h: r.height },
        relleno: s.backgroundColor,
        texto: s.color,
        borde: s.borderTopColor,
        anchoBorde: parseFloat(s.borderTopWidth),
        radio: parseFloat(s.borderTopLeftRadius),
        familia: s.fontFamily,
        peso: Number(s.fontWeight),
        tamano: parseFloat(s.fontSize),
        altoLinea: s.lineHeight === 'normal' ? undefined : parseFloat(s.lineHeight),
        contenido: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      };
    },
    { testid, tokens },
  );
}

/** Las diferencias de una fila con su huella en el marco actual de la página ([] = igual). */
export async function compararFila(page: Page, fila: Fila, marco = MARCO_REFERENCIA): Promise<string[]> {
  const capa = { ...buscarCapa(fila), ...(fila.caja ?? {}) };
  const sin = new Set(fila.sin ?? []);
  const colores = [capa.fill, capa.stroke].filter(
    (c): c is string => !!c && (esVariable(c) || /^#[0-9a-f]{6}$/i.test(c)),
  );
  const m = await medir(page, fila.testid, colores);
  const d = (que: string) => `${fila.testid}: ${que}`;
  if (!m.existe) return [d('no está en la pantalla')];
  const salida: string[] = [];

  if (!sin.has('caja') && [capa.x, capa.y, capa.w, capa.h].every((v) => typeof v === 'number')) {
    const e = cajaEsperada(capa as Caja, fila.anclaje, marco);
    for (const k of ['x', 'y', 'w', 'h'] as const)
      if (Math.abs(m.caja[k] - e[k]) > TOLERANCIA)
        salida.push(d(`${k} = ${m.caja[k].toFixed(1)}, la huella pide ${e[k]} (±${TOLERANCIA})`));
  }
  const esTexto = typeof capa.txt === 'string' || typeof capa.font === 'string';
  if (!sin.has('relleno') && capa.fill && colores.includes(capa.fill)) {
    const real = esTexto ? m.texto : m.relleno;
    if (real !== m.colores[capa.fill])
      salida.push(
        d(`${esTexto ? 'color' : 'relleno'} ${real}, la huella pide ${capa.fill} (${m.colores[capa.fill]})`),
      );
  }
  if (!sin.has('borde') && capa.stroke && colores.includes(capa.stroke)) {
    if (m.borde !== m.colores[capa.stroke])
      salida.push(d(`borde ${m.borde}, la huella pide ${capa.stroke} (${m.colores[capa.stroke]})`));
    if (typeof capa.sw === 'number' && Math.abs(m.anchoBorde - capa.sw) > 0.01)
      salida.push(d(`ancho de borde ${m.anchoBorde}, la huella pide ${capa.sw}`));
  }
  if (!sin.has('radio') && typeof capa.r === 'number' && Math.abs(m.radio - capa.r) > 0.5)
    salida.push(d(`radio ${m.radio}, la huella pide ${capa.r}`));
  if (!sin.has('fuente') && capa.font) {
    const f = leerFuente(capa.font);
    const primera = m.familia.split(',')[0]?.replace(/["']/g, '').trim();
    if (primera !== f.familia) salida.push(d(`fuente ${primera}, la huella pide ${f.familia}`));
    if (m.peso !== f.peso) salida.push(d(`peso ${m.peso}, la huella pide ${f.peso}`));
    if (Math.abs(m.tamano - f.tamano) > 0.01)
      salida.push(d(`tamaño ${m.tamano}, la huella pide ${f.tamano}`));
    if (f.alto !== undefined && m.altoLinea !== undefined && Math.abs(m.altoLinea - f.alto) > 0.5)
      salida.push(d(`alto de línea ${m.altoLinea}, la huella pide ${f.alto}`));
  }
  if (
    !sin.has('texto') &&
    typeof capa.txt === 'string' &&
    m.contenido !== capa.txt.replace(/\s+/g, ' ').trim()
  )
    salida.push(d(`texto «${m.contenido}», la huella pide «${capa.txt}»`));
  return salida;
}

/** Compara todas las filas en el marco actual. */
export async function compararPantalla(page: Page, filas: Fila[]): Promise<string[]> {
  const marco = page.viewportSize() ?? MARCO_REFERENCIA;
  const salida: string[] = [];
  for (const fila of filas) salida.push(...(await compararFila(page, fila, marco)));
  return salida;
}
