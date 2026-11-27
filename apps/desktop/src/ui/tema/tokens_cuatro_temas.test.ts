import { describe, expect, it } from 'vitest';
import DOC from '../../../../../docs/implementacion/TEMAS_Y_TOKENS.md?raw';
import { tokensDeLosColores } from './derivar';
import { TEMAS_DE_WINDGETS } from './tokens_por_defecto';

// F6-01a · Prueba de tokens de la fase 6 (docs/implementacion/PLAN.md, «Fase 6», punto 1; TEMAS_Y_TOKENS.md §1, §6,
// §7 y el guion de §9, del que se portan PARES, CONTROLES y ARREGLOS). Compara los cuatro temas del código con la
// tabla 1, calcula los contrastes y comprueba la regla de morado y cian.
//
// Mientras falten tokens, la prueba no exige cero diferencias: exige que las diferencias sean exactamente las de
// PENDIENTES (lo que falta, escrito abajo). Cada pieza que cierra algo (TK-01, TK-02, TK-05) quita sus líneas de
// PENDIENTES; TK-01v la cierra con la lista vacía. Una diferencia nueva, o una que ya no está, hace fallar la prueba.

type Tema = 'claro' | 'oscuro' | 'rosa' | 'enfoque';
const TEMAS: Tema[] = ['claro', 'oscuro', 'rosa', 'enfoque'];
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

const seccion = (desde: string, hasta: string) => (DOC.split(desde)[1] ?? '').split(hasta)[0] ?? '';
/** Celda i de una fila ('' si no existe). */
const en = (c: string[], i: number) => c[i] ?? '';
const filas = (bloque: string) =>
  bloque
    .split(/\r?\n/)
    .filter((l) => l.startsWith('|'))
    .map((l) =>
      l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim().replace(/`/g, '')),
    );

/** Tabla 1: variable → valor por tema. */
const TABLA: Record<string, Record<Tema, string>> = Object.fromEntries(
  filas(seccion('\n## 1.', '\n## 2.'))
    .filter((c) => c.length >= 6 && HEX.test(en(c, 1)))
    .map((c) => [en(c, 0), { claro: en(c, 1), oscuro: en(c, 2), rosa: en(c, 3), enfoque: en(c, 4) }]),
);

/** Normaliza un valor del código: hex en minúsculas; la sombra `3px 5px 0 #241C30` se compara por su color. */
const normalizar = (v: string) => (v.match(/#[0-9a-fA-F]{6,8}\b/)?.[0] ?? v).toLowerCase();

/** Los tokens que el código pinta en cada tema (vacío = el código no define ese tema). */
function tokensDelCodigo(tema: Tema): Record<string, string> {
  if (tema !== 'claro' && tema !== 'oscuro') return {};
  const t = tokensDeLosColores({ ...TEMAS_DE_WINDGETS[tema].colores, fuente: '', tamano: '' });
  return Object.fromEntries(
    Object.entries(t)
      .filter(([k]) => k in TABLA)
      .map(([k, v]) => [k, normalizar(v as string)]),
  );
}
const CODIGO = Object.fromEntries(TEMAS.map((t) => [t, tokensDelCodigo(t)])) as Record<
  Tema,
  Record<string, string>
>;

// Contraste WCAG 2.x con la fórmula de TEMAS_Y_TOKENS.md §6.
const lineal = (c: number) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const lum = (h: string) => {
  const canal = (i: number) => lineal(parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
};
const contraste = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/** Tabla 6.1: par → { umbral, primer plano, fondo, valor y FALLA por tema }. */
const PARES = filas(seccion('#### 6.1', '#### 6.2'))
  .filter((c) => c.length === 7 && /^\d/.test(en(c, 2)))
  .map((c) => {
    const [fg = '', bg = ''] = (en(c, 0).split(' ')[0] ?? '').split('/');
    return {
      par: en(c, 0),
      fg,
      bg,
      umbral: Number(en(c, 2)),
      tema: Object.fromEntries(
        TEMAS.map((t, k) => [
          t,
          { valor: en(c, 3 + k).split(' ')[0] ?? '', falla: en(c, 3 + k).includes('FALLA') },
        ]),
      ) as Record<Tema, { valor: string; falla: boolean }>,
    };
  });

// Regla de morado y cian (TEMAS_Y_TOKENS.md §7; listas cerradas del guion de §9).
const CIAN: Record<Tema, string[]> = {
  claro: ['#00d9e2'],
  oscuro: ['#00d9e2', '#0e4a4d'],
  rosa: [],
  enfoque: [],
};
const MORADO: Record<Tema, string[]> = {
  claro: ['#6604e6'],
  oscuro: ['#d3b2ff', '#433258'],
  rosa: [],
  enfoque: [],
};
const TEXTO_SOBRE_CIAN = '#0b2a2e'; // DECIDIDO P3, solo sobre #00d9e2
const CONTROLES: [string, Record<string, string>][] = [
  ['Boton Principal (4.1)', { relleno: 'accion', texto: 'sobre_accion', borde: 'borde', sombra: 'sombra' }],
  ['Boton Secundario (4.1)', { relleno: 'superficie', texto: 'tinta', borde: 'borde' }],
  ['Boton Secundario, puntero encima (4.1)', { relleno: 'superficie_baja', texto: 'tinta', borde: 'borde' }],
  ['Boton Destructivo (4.1)', { relleno: 'superficie', texto: 'error', borde: 'error' }],
  [
    'Selector segmentado, opcion elegida (4.1)',
    { relleno: 'seleccion', texto: 'sobre_seleccion', borde: 'borde' },
  ],
  [
    'Fila de lista seleccionada (4.1)',
    { relleno: 'superficie_baja', texto: 'tinta', trazo: 'principal_legible' },
  ],
  [
    'Campo editable, foco (4.1)',
    { relleno: 'superficie', texto: 'texto', borde: 'borde_campo', anillo: 'tinta' },
  ],
  [
    'Interruptor encendido (4.1)',
    { relleno: 'principal_legible', borde: 'principal_legible', perilla: 'perilla' },
  ],
  ['Casilla de tarjeta marcada (4.1)', { relleno: 'seleccion', borde: 'seleccion' }],
  [
    'Aviso Informacion (D1)',
    { relleno: 'superficie_alta', texto: 'principal_legible', borde: 'informacion' },
  ],
  [
    'Aviso Exito (D1)',
    { relleno: 'superficie_alta', texto: 'estado_completada', borde: 'estado_completada' },
  ],
  [
    'Aviso Advertencia (D1)',
    { relleno: 'superficie_alta', texto: 'estado_pendiente', borde: 'estado_pendiente' },
  ],
  ['Aviso Error (D1)', { relleno: 'superficie_alta', texto: 'error', borde: 'error' }],
  [
    'Widget Calendario, dia actual (4.3)',
    { relleno: 'detalle', texto: 'sobre_detalle', fondo: 'superficie' },
  ],
  [
    'Widget Tareas: casilla marcada sobre fila (4.3)',
    { relleno: 'superficie_baja', casilla: 'seleccion', texto: 'tinta' },
  ],
  [
    'Widget Kanban: columna elegida al arrastrar (F6)',
    { relleno: 'superficie_baja', trazo: 'seleccion', texto: 'tinta' },
  ],
  ['Burbuja propia de Windi (4.2)', { relleno: 'burbuja_propia', texto: 'tinta', borde: 'borde' }],
  ['Barra lateral (4.5)', { relleno: 'marco', texto: 'sobre_marco' }],
];
const ARREGLOS: [string, Tema | null, string, string][] = [
  ['Fila de lista seleccionada (4.1)', 'oscuro', 'trazo', 'tinta'], // P1
  ['Widget Tareas: casilla marcada sobre fila (4.3)', 'oscuro', 'casilla', 'tinta'], // P1
  ['Widget Kanban: columna elegida al arrastrar (F6)', 'oscuro', 'trazo', 'tinta'], // P1
  ['Aviso Informacion (D1)', null, 'texto', 'texto'], // P2
  ['Aviso Exito (D1)', null, 'texto', 'texto'], // P2
  ['Aviso Advertencia (D1)', null, 'texto', 'texto'], // P2
  ['Aviso Error (D1)', null, 'texto', 'texto'], // P2
];

function rolesDe(control: string, roles: Record<string, string>, tema: Tema) {
  const r = { ...roles };
  for (const [c, t, rol, variable] of ARREGLOS)
    if (c === control && (t === null || t === tema)) r[rol] = variable;
  return r;
}

/** Todo lo que hoy separa al código de la tabla, en el mismo formato que PENDIENTES. */
function diferencias(): string[] {
  const salida: string[] = [];
  for (const tema of TEMAS) {
    const codigo = CODIGO[tema];
    for (const [variable, valores] of Object.entries(TABLA)) {
      if (!(variable in codigo)) salida.push(`${tema}.${variable}: falta`);
      else if (codigo[variable] !== valores[tema])
        salida.push(`${tema}.${variable}: código ${codigo[variable]}, tabla ${valores[tema]}`);
    }
    for (const p of PARES) {
      const [fg, bg] = [codigo[p.fg], codigo[p.bg]];
      if (!fg || !bg || p.tema[tema].falla) continue;
      const c = contraste(fg, bg);
      if (c < p.umbral) salida.push(`${tema} contraste ${p.par}: ${c.toFixed(2)} < ${p.umbral}`);
    }
    for (const [control, roles] of CONTROLES) {
      const valores = Object.entries(rolesDe(control, roles, tema)).map(
        ([rol, v]) => [rol, codigo[v] ?? ''] as const,
      );
      if (valores.some(([, v]) => !v)) continue; // un rol sin token: ya cuenta como «falta»
      const cian = valores.some(([, v]) => CIAN[tema].includes(v.slice(0, 7)));
      const morado = valores.some(([, v]) => MORADO[tema].includes(v.slice(0, 7)));
      if (cian && morado) salida.push(`${tema} morado y cian: ${control}`);
      const relleno = valores.find(([rol]) => rol === 'relleno')?.[1];
      const texto = valores.find(([rol]) => rol === 'texto')?.[1];
      if (relleno === '#00d9e2' && texto && texto !== TEXTO_SOBRE_CIAN)
        salida.push(`${tema} texto sobre cian: ${control} usa ${texto}`);
    }
  }
  return salida;
}

// Lo que falta en el código el 27-nov-2026 (TEMAS_Y_TOKENS.md §8.1 y §8.3). Lo cierran TK-01, TK-02 y TK-05.
const PENDIENTES: string[] = [
  // TK-01: las 11 variables de color nuevas en claro y oscuro (§8.1).
  'claro.borde_campo: falta',
  'claro.burbuja_propia: falta',
  'claro.fondo: falta',
  'claro.detalle: falta',
  'claro.sobre_detalle: falta',
  'claro.principal_legible: falta',
  'claro.sobre_seleccion: falta',
  'claro.perilla: falta',
  'claro.informacion: falta',
  'claro.seleccion: falta',
  'claro.velo: falta',
  'oscuro.borde_campo: falta',
  'oscuro.burbuja_propia: falta',
  'oscuro.fondo: falta',
  'oscuro.detalle: falta',
  'oscuro.sobre_detalle: falta',
  'oscuro.principal_legible: falta',
  'oscuro.sobre_seleccion: falta',
  'oscuro.perilla: falta',
  'oscuro.informacion: falta',
  'oscuro.seleccion: falta',
  'oscuro.velo: falta',
  // TK-05: P3 (texto sobre cian #0b2a2e) y Q1 (relleno_* como tabla fija), con los contrastes y la regla que dependen de ellos (§8.3).
  'claro.sobre_accion: código #17131d, tabla #0b2a2e',
  'claro.relleno_vencida: código #e47067, tabla #f4c2be',
  'claro.relleno_pendiente: código #c9af62, tabla #e8ddbc',
  'claro.relleno_completada: código #62c382, tabla #bbe5c9',
  'claro texto sobre cian: Boton Principal (4.1) usa #17131d',
  'oscuro.sobre_accion: código #17131d, tabla #0b2a2e',
  'oscuro.relleno_vencida: código #a52e2a, tabla #5f2930',
  'oscuro.relleno_pendiente: código #a5842a, tabla #5f4e30',
  'oscuro.relleno_completada: código #28a354, tabla #2a5b42',
  'oscuro contraste tinta/relleno_pendiente: 3.29 < 4.5',
  'oscuro contraste tinta/relleno_completada: 3.02 < 4.5',
  'oscuro texto sobre cian: Boton Principal (4.1) usa #17131d',
  // TK-02: los temas Rosa y Enfoque, 32 colores cada uno (§8.1.1).
  'rosa.principal: falta',
  'rosa.secundario: falta',
  'rosa.marco: falta',
  'rosa.sobre_marco: falta',
  'rosa.superficie: falta',
  'rosa.superficie_alta: falta',
  'rosa.superficie_baja: falta',
  'rosa.linea: falta',
  'rosa.tinta: falta',
  'rosa.texto: falta',
  'rosa.accion: falta',
  'rosa.sobre_accion: falta',
  'rosa.borde: falta',
  'rosa.sombra: falta',
  'rosa.error: falta',
  'rosa.borde_campo: falta',
  'rosa.burbuja_propia: falta',
  'rosa.fondo: falta',
  'rosa.detalle: falta',
  'rosa.sobre_detalle: falta',
  'rosa.principal_legible: falta',
  'rosa.sobre_seleccion: falta',
  'rosa.perilla: falta',
  'rosa.informacion: falta',
  'rosa.seleccion: falta',
  'rosa.estado_vencida: falta',
  'rosa.relleno_vencida: falta',
  'rosa.estado_pendiente: falta',
  'rosa.relleno_pendiente: falta',
  'rosa.estado_completada: falta',
  'rosa.relleno_completada: falta',
  'rosa.velo: falta',
  'enfoque.principal: falta',
  'enfoque.secundario: falta',
  'enfoque.marco: falta',
  'enfoque.sobre_marco: falta',
  'enfoque.superficie: falta',
  'enfoque.superficie_alta: falta',
  'enfoque.superficie_baja: falta',
  'enfoque.linea: falta',
  'enfoque.tinta: falta',
  'enfoque.texto: falta',
  'enfoque.accion: falta',
  'enfoque.sobre_accion: falta',
  'enfoque.borde: falta',
  'enfoque.sombra: falta',
  'enfoque.error: falta',
  'enfoque.borde_campo: falta',
  'enfoque.burbuja_propia: falta',
  'enfoque.fondo: falta',
  'enfoque.detalle: falta',
  'enfoque.sobre_detalle: falta',
  'enfoque.principal_legible: falta',
  'enfoque.sobre_seleccion: falta',
  'enfoque.perilla: falta',
  'enfoque.informacion: falta',
  'enfoque.seleccion: falta',
  'enfoque.estado_vencida: falta',
  'enfoque.relleno_vencida: falta',
  'enfoque.estado_pendiente: falta',
  'enfoque.relleno_pendiente: falta',
  'enfoque.estado_completada: falta',
  'enfoque.relleno_completada: falta',
  'enfoque.velo: falta',
];

describe('F6-01a · los cuatro temas del código frente a TEMAS_Y_TOKENS.md', () => {
  it('la tabla 1 trae las 32 variables de color en los cuatro temas', () => {
    expect(Object.keys(TABLA)).toHaveLength(32);
    for (const v of Object.values(TABLA)) for (const t of TEMAS) expect(v[t]).toMatch(HEX);
  });

  it('los contrastes de la tabla 6.1 salen de la tabla 1, y FALLA va justo donde no llegan al umbral', () => {
    expect(PARES.length).toBeGreaterThanOrEqual(40);
    for (const p of PARES)
      for (const t of TEMAS) {
        const c = contraste(TABLA[p.fg]?.[t] ?? '', TABLA[p.bg]?.[t] ?? '');
        expect(c.toFixed(2), `${p.par} ${t}`).toBe(p.tema[t].valor);
        expect(c < p.umbral, `${p.par} ${t} FALLA`).toBe(p.tema[t].falla);
      }
  });

  it('el código solo difiere de la tabla, de sus contrastes y de la regla de morado y cian en lo que falta', () => {
    expect([...diferencias()].sort()).toEqual([...PENDIENTES].sort());
  });
});
