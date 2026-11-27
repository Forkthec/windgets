// F6-05 · Copia las huellas del Figma de `.trabajo/figma/huellas/` a `apps/desktop/e2e/figma/`.
//
// Fuente de las familias vigentes: la tabla principal de `docs/implementacion/TRAZABILIDAD.md`
// (una fila por familia, ids Claro / Oscuro / Rosa / Enfoque). Se copian las huellas de esas familias,
// las bases que citan (campo `base`, en cadena) y los archivos de grupo que cubren a las familias sin
// huella propia. Todo se escribe en UTF-8. Al final se escribe `indice.json` con, por familia, sus
// huellas por tema, el formato de cada una y la cadena de bases.
//
// Uso (desde la raíz del repo): node apps/desktop/scripts/copiar_huellas.mjs

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ORIGEN = join(RAIZ, '.trabajo', 'figma', 'huellas');
const DESTINO = join(RAIZ, 'apps', 'desktop', 'e2e', 'figma');
const TRAZABILIDAD = join(RAIZ, 'docs', 'implementacion', 'TRAZABILIDAD.md');
const INVENTARIOS = join(RAIZ, '.trabajo', 'figma');
const TEMAS = ['claro', 'oscuro', 'rosa', 'enfoque'];

const aArchivo = (id) => id.replace(':', '-');
const ID_NODO = /^(\d+)[:-](\d+)$/;

/** Lee un archivo como UTF-8; si no lo es, como Windows-1252 (dos huellas venían así). */
export function leerTexto(ruta) {
  const bytes = readFileSync(ruta);
  try {
    return { texto: new TextDecoder('utf-8', { fatal: true }).decode(bytes), recodificado: false };
  } catch {
    return { texto: new TextDecoder('windows-1252').decode(bytes), recodificado: true };
  }
}

/** Familias vigentes de la tabla principal de TRAZABILIDAD.md (secciones `### <página> · …`). */
export function leerFamilias(md) {
  const familias = [];
  let pagina = null;
  for (const linea of md.split(/\r?\n/)) {
    if (linea.startsWith('## ') && pagina) {
      // Termina la tabla principal (sección 3 en adelante).
      if (!linea.startsWith('## 2.')) pagina = null;
    }
    const sec = linea.match(/^### (\d+:\d+) · /);
    if (sec) pagina = sec[1];
    if (!pagina || !linea.startsWith('| ')) continue;
    const celdas = linea.split('|').map((c) => c.trim());
    const ids = celdas[1].split('/').map((c) => c.trim());
    if (ids.length === 4 && ids.every((i) => i === '-' || ID_NODO.test(i))) {
      familias.push({ pagina, nombre: celdas[2], ids: Object.fromEntries(TEMAS.map((t, k) => [t, ids[k]])) });
      continue;
    }
    // Componentes de Fundamentos (0:1): un solo id, a veces con variantes entre paréntesis.
    const sueltos = celdas[1].match(/\d+:\d+/g);
    if (!sueltos || !celdas[1].startsWith(sueltos[0])) continue;
    familias.push({
      pagina,
      nombre: celdas[2],
      ids: { claro: sueltos[0], oscuro: '-', rosa: '-', enfoque: '-' },
      ...(sueltos.length > 1 ? { otros: sueltos.slice(1) } : {}),
    });
  }
  return familias;
}

/** Formato de una huella: `medida` si sus elementos traen caja numérica; `texto` si vienen descritos. */
export function formatoDe(h) {
  const el = Array.isArray(h.el) ? h.el : [];
  const medidos = el.filter(
    (e) => e && typeof e === 'object' && ['x', 'y', 'w', 'h'].every((k) => typeof e[k] === 'number'),
  ).length;
  const base = typeof h.base === 'string' && ID_NODO.test(h.base) ? h.base.replace('-', ':') : null;
  if (medidos > 0) return { formato: base ? 'diferencia-medida' : 'medida', base, medidos };
  return { formato: base ? 'diferencia-texto' : 'texto', base, medidos: 0 };
}

function main() {
  const huellas = new Map();
  const recodificadas = [];
  for (const f of readdirSync(ORIGEN).filter((f) => f.endsWith('.json'))) {
    const { texto, recodificado } = leerTexto(join(ORIGEN, f));
    if (recodificado) recodificadas.push(f);
    huellas.set(f.slice(0, -5), { texto, json: JSON.parse(texto) });
  }

  const inventarios = readdirSync(INVENTARIOS)
    .filter((f) => /^F\d.*\.md$/.test(f))
    .map((f) => ({ f, texto: readFileSync(join(INVENTARIOS, f), 'utf-8') }));
  const grupos = [...huellas.keys()].filter((k) => !ID_NODO.test(k));

  const familias = leerFamilias(readFileSync(TRAZABILIDAD, 'utf-8'));
  const aCopiar = new Set();
  const cadenaDe = (archivo) => {
    const cadena = [];
    let actual = huellas.get(archivo);
    while (actual) {
      const { base } = formatoDe(actual.json);
      if (!base || cadena.includes(base)) break;
      cadena.push(base);
      aCopiar.add(aArchivo(base));
      actual = huellas.get(aArchivo(base));
    }
    return cadena;
  };

  const indice = familias.map((fam) => {
    const porTema = {};
    for (const t of TEMAS) {
      const id = fam.ids[t];
      if (id === '-' || !huellas.has(aArchivo(id))) continue;
      aCopiar.add(aArchivo(id));
      const { formato, medidos } = formatoDe(huellas.get(aArchivo(id)).json);
      porTema[t] = { archivo: `${aArchivo(id)}.json`, formato, medidos, bases: cadenaDe(aArchivo(id)) };
    }
    const entrada = { ...fam, huellas: porTema };
    const variantes = (fam.otros ?? [])
      .filter((id) => huellas.has(aArchivo(id)))
      .map((id) => {
        aCopiar.add(aArchivo(id));
        const { formato, medidos } = formatoDe(huellas.get(aArchivo(id)).json);
        return { id, archivo: `${aArchivo(id)}.json`, formato, medidos, bases: cadenaDe(aArchivo(id)) };
      });
    if (variantes.length) entrada.variantes = variantes;
    if (Object.keys(porTema).length === 0) {
      // Sin huella propia: se busca qué archivo de grupo o inventario la mide.
      const ids = [...TEMAS.map((t) => fam.ids[t]), ...(fam.otros ?? [])].filter((i) => i !== '-');
      const grupo = grupos.find((g) => ids.some((i) => huellas.get(g).texto.includes(i)));
      const inv = inventarios.find(({ texto }) => ids.some((i) => texto.includes(i)));
      if (grupo) {
        aCopiar.add(grupo);
        entrada.cubierta_por = `${grupo}.json`;
      } else if (inv) {
        entrada.cubierta_por = `.trabajo/figma/${inv.f}`;
      } else {
        entrada.cubierta_por = null;
      }
    }
    return entrada;
  });
  // Lo que ninguna familia usa también se copia: las specs lo citan por nombre de huella
  // (por ejemplo `204-32300`, barra lateral contraída, en SPEC_Marco MB-02) y los grupos de muestras de tema.
  const usadas = new Set(aCopiar);
  for (const k of huellas.keys()) aCopiar.add(k);

  if (existsSync(DESTINO)) rmSync(DESTINO, { recursive: true });
  mkdirSync(DESTINO, { recursive: true });
  for (const k of [...aCopiar].sort()) {
    const h = huellas.get(k);
    if (!h) throw new Error(`Falta la huella ${k}.json en ${ORIGEN}`);
    writeFileSync(join(DESTINO, `${k}.json`), h.texto.endsWith('\n') ? h.texto : `${h.texto}\n`, 'utf-8');
  }

  const formatos = {};
  for (const fam of indice)
    for (const h of Object.values(fam.huellas)) formatos[h.formato] = (formatos[h.formato] ?? 0) + 1;
  const resumen = {
    familias: indice.length,
    con_huella: indice.filter((f) => Object.keys(f.huellas).length > 0).length,
    cubiertas_por_grupo_o_inventario: indice.filter((f) => f.cubierta_por).length,
    sin_medida: indice.filter((f) => f.cubierta_por === null).length,
    archivos_copiados: aCopiar.size,
    huellas_por_formato: formatos,
    recodificadas_a_utf8: recodificadas,
    fuera_de_familias: [...huellas.keys()]
      .filter((k) => !usadas.has(k))
      .sort()
      .map((k) => `${k}.json`),
  };
  writeFileSync(
    join(DESTINO, 'indice.json'),
    `${JSON.stringify({ fuente: 'docs/implementacion/TRAZABILIDAD.md', resumen, familias: indice }, null, 1)}\n`,
    'utf-8',
  );
  console.log(JSON.stringify(resumen, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
