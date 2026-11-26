import type { Tokens } from './tokens';
import { temaDeWindgets } from './tokens_por_defecto';

// Tokens de la interfaz a partir de los colores y la tipografía de un tema (interfaz.md, «Tema a tokens»).
// DUDA: HE-03-HU06 IPC-THEME-02 devuelve el contenido del tema, no los tokens, aunque interfaz.md dice que el
// Núcleo los calcula. Valor usado: esta función pura, con las mismas fórmulas que la legibilidad del Núcleo
// (`legibilidad.rs`); la regla de negocio (los mínimos de contraste) sigue en el Núcleo (docs/DUDAS.md).

type Rgb = readonly [number, number, number];

const OSCURO = '#121216';
const BLANCO = '#FFFFFF';

const deHex = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb;

const aHex = (c: Rgb): string => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** «Mezclar A con B al n %»: `A × (1 − n) + B × n`, redondeado por canal. */
function mezclar(a: string, b: string, n: number): string {
  const [x, y] = [deHex(a), deHex(b)];
  return aHex(x.map((v, i) => Math.round(v * (1 - n) + (y[i] ?? 0) * n)) as unknown as Rgb);
}

/** Luminancia relativa de WCAG 2.1. */
function luminancia(hex: string): number {
  const [r, g, b] = deHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `#121216` o `#FFFFFF`, el que dé más contraste con el fondo. */
const sobre = (fondo: string): string =>
  contraste(OSCURO, fondo) >= contraste(BLANCO, fondo) ? OSCURO : BLANCO;

/** HSL → `#RRGGBB`, con la saturación y la luminosidad de 0 a 100. */
function deHsl(h: number, s: number, l: number): string {
  const [sat, lum] = [s / 100, l / 100];
  const c = (1 - Math.abs(2 * lum - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lum - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return aHex([r, g, b].map((v) => Math.round((v + m) * 255)) as unknown as Rgb);
}

/**
 * Color de estado: tono fijo, saturación 70 %; luminosidad inicial 50 %, que se mueve de a 1 % alejándose de la
 * superficie hasta alcanzar 3:1 con ella.
 */
function estado(tono: number, superficie: string): string {
  const paso = luminancia(superficie) >= 0.18 ? -1 : 1;
  for (let l = 50; l >= 0 && l <= 100; l += paso) {
    const color = deHsl(tono, 70, l);
    if (contraste(color, superficie) >= 3) return color;
  }
  return sobre(superficie);
}

export interface TemaParaTokens {
  primary: string;
  secondary: string;
  text: string;
  /** Familia CSS de la fuente. */
  fuente: string;
  /** Tamaño del texto en CSS (HE-02-HU06-ET05). */
  tamano: string;
}

/** Los tres colores de estado sobre la superficie y sus rellenos. */
function estadosSobre(superficie: string) {
  const vencida = estado(4, superficie);
  const pendiente = estado(45, superficie);
  const completada = estado(140, superficie);
  return {
    estado_vencida: vencida,
    estado_pendiente: pendiente,
    estado_completada: completada,
    relleno_vencida: mezclar(vencida, superficie, 0.3),
    relleno_pendiente: mezclar(pendiente, superficie, 0.3),
    relleno_completada: mezclar(completada, superficie, 0.3),
  };
}

export function derivarTokens({ primary: P, secondary: S, text: X, fuente, tamano }: TemaParaTokens): Tokens {
  const extremo = luminancia(X) >= 0.18 ? OSCURO : BLANCO;
  const superficie = mezclar(S, extremo, 0.6);
  const accion = mezclar(S, X, 0.3);
  return {
    marco: P.toUpperCase(),
    sobre_marco: sobre(P),
    superficie,
    superficie_alta: mezclar(S, extremo, 0.65),
    superficie_baja: mezclar(S, extremo, 0.45),
    linea: mezclar(P, extremo, 0.1),
    tinta: X.toUpperCase(),
    texto: mezclar(X, superficie, 0.15),
    accion,
    sobre_accion: sobre(accion),
    borde: mezclar(X, P, 0.4),
    ...estadosSobre(superficie),
    fuente,
    tamano_fuente: tamano,
  };
}

/**
 * Los tokens con los que se pinta un tema: la tabla fija si es «Windgets claro» u «oscuro» (docs/rediseno.md RD-94)
 * y, en cualquier otro, los derivados. Los estados no están en la tabla: salen con la misma fórmula sobre la
 * superficie fija.
 */
export function tokensDeLosColores(tema: TemaParaTokens): Tokens {
  const derivados = derivarTokens(tema);
  const fijo = temaDeWindgets(tema);
  return fijo ? { ...derivados, ...fijo.tokens, ...estadosSobre(fijo.tokens.superficie) } : derivados;
}
