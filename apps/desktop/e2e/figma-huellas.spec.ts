import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error: guion .mjs sin tipos; solo se usan dos funciones puras.
import { formatoDe, leerFamilias, leerTexto } from '../scripts/copiar_huellas.mjs';

// F6-05 · Huellas del Figma copiadas a e2e/figma/ (docs/implementacion/PLAN.md, «Pruebas contra el Figma sin
// capturas»; COLA.md F6-05). No abre el navegador: comprueba los archivos que usará el arnés de geometría (F6-02).
// Se regeneran con `node apps/desktop/scripts/copiar_huellas.mjs`.

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..', '..');
const FIGMA = join(AQUI, 'figma');
const ORIGEN = join(RAIZ, '.trabajo', 'figma', 'huellas');

type Tema = 'claro' | 'oscuro' | 'rosa' | 'enfoque';
type Huella = { archivo: string; formato: string; medidos: number; bases: string[] };
type Familia = {
  pagina: string;
  nombre: string;
  ids: Record<Tema, string>;
  huellas: Partial<Record<Tema, Huella>>;
  variantes?: (Huella & { id: string })[];
  cubierta_por?: string | null;
};

const indice: { familias: Familia[] } = JSON.parse(readFileSync(join(FIGMA, 'indice.json'), 'utf-8'));
const archivos = readdirSync(FIGMA).filter((f) => f.endsWith('.json') && f !== 'indice.json');
const leer = (f: string) => JSON.parse(readFileSync(join(FIGMA, f), 'utf-8'));
const todasLasHuellas = (fam: Familia) =>
  [...Object.values(fam.huellas), ...(fam.variantes ?? [])] as Huella[];

test.describe('F6-05 · Huellas del Figma en e2e/figma', () => {
  test('el índice tiene una entrada por cada familia vigente de TRAZABILIDAD.md, con sus mismos ids', () => {
    const familias = leerFamilias(
      readFileSync(join(RAIZ, 'docs', 'implementacion', 'TRAZABILIDAD.md'), 'utf-8'),
    );
    expect(familias).toHaveLength(436);
    expect(indice.familias.map((f) => f.ids)).toEqual(familias.map((f: Familia) => f.ids));
  });

  test('cada familia tiene su huella o un archivo que la mide, y ese archivo existe y cita su id', () => {
    for (const fam of indice.familias) {
      for (const [tema, h] of Object.entries(fam.huellas)) {
        expect(h.archivo, `${fam.nombre} (${tema})`).toBe(`${fam.ids[tema as Tema].replace(':', '-')}.json`);
        expect(existsSync(join(FIGMA, h.archivo)), h.archivo).toBe(true);
      }
      if (Object.keys(fam.huellas).length > 0) continue;
      const cubierta = fam.cubierta_por ?? '';
      expect(cubierta, `${fam.nombre}: sin huella ni archivo que la mida`).not.toBe('');
      const ruta = cubierta.startsWith('.trabajo/') ? join(RAIZ, cubierta) : join(FIGMA, cubierta);
      const texto = readFileSync(ruta, 'utf-8');
      const ids = Object.values(fam.ids).filter((i) => i !== '-');
      expect(
        ids.some((i) => texto.includes(i)),
        `${fam.nombre} en ${cubierta}`,
      ).toBe(true);
    }
  });

  test('cada archivo es UTF-8 válido y JSON, y el id de la huella es el de su nombre de archivo', () => {
    expect(archivos.length).toBeGreaterThanOrEqual(445);
    for (const f of archivos) {
      const bytes = readFileSync(join(FIGMA, f));
      expect(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes), f).not.toThrow();
      const h = leer(f);
      if (/^\d+-\d+\.json$/.test(f)) expect(h.id, f).toBe(f.slice(0, -5).replace('-', ':'));
    }
  });

  test('las copias son iguales al origen en .trabajo/figma/huellas (solo cambia la codificación)', () => {
    for (const f of readdirSync(ORIGEN).filter((x) => x.endsWith('.json'))) {
      const { texto } = leerTexto(join(ORIGEN, f));
      expect(readFileSync(join(FIGMA, f), 'utf-8').trimEnd(), f).toBe(texto.trimEnd());
    }
  });

  test('cada base que cita una huella existe, y el formato del índice es el de la huella', () => {
    for (const fam of indice.familias)
      for (const h of todasLasHuellas(fam)) {
        expect(formatoDe(leer(h.archivo)).formato, h.archivo).toBe(h.formato);
        for (const b of h.bases)
          expect(existsSync(join(FIGMA, `${b.replace(':', '-')}.json`)), `${h.archivo} → ${b}`).toBe(true);
      }
  });

  test('los elementos medidos traen caja numérica y relleno, borde, radio, sombra, fuente y texto con su tipo', () => {
    const tipos: Record<string, string> = {
      fill: 'string',
      stroke: 'string',
      sw: 'number',
      r: 'number',
      sh: 'string',
      font: 'string',
      txt: 'string',
    };
    const conCaja = (e: Record<string, unknown>) =>
      ['x', 'y', 'w', 'h'].every((k) => typeof e[k] === 'number');
    const vistos = new Set<string>();
    for (const fam of indice.familias)
      for (const h of todasLasHuellas(fam)) {
        if (h.medidos === 0) continue;
        // Los elementos repetidos («(x8)») vienen agrupados, con rangos o sin x; el arnés solo mide los que traen caja.
        const medidos = leer(h.archivo).el.filter(
          (x: unknown) => x && typeof x === 'object' && conCaja(x as Record<string, unknown>),
        );
        expect(medidos.length, h.archivo).toBe(h.medidos);
        for (const e of medidos) {
          for (const k of ['x', 'y', 'w', 'h'])
            expect(Number.isFinite(e[k]), `${h.archivo} ${e.n ?? e.txt} ${k}`).toBe(true);
          for (const [k, t] of Object.entries(tipos))
            if (k in e && e[k] !== null) {
              vistos.add(k);
              // El radio puede venir por esquina («8 8 0 0»).
              if (!(k === 'r' && typeof e[k] === 'string')) expect(typeof e[k], `${h.archivo} ${k}`).toBe(t);
            }
        }
      }
    expect([...vistos].sort()).toEqual(expect.arrayContaining(['fill', 'font', 'r', 'stroke', 'txt']));
  });
});
