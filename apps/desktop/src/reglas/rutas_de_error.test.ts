import { describe, expect, it } from 'vitest';
import COLA from '../../../../docs/implementacion/COLA.md?raw';
import ERRORES from '../../../../docs/implementacion/ERRORES_Y_PRUEBAS.md?raw';

// SEED-01 · «Huérfanas»: ninguna ruta R de ERRORES_Y_PRUEBAS.md queda sin pieza dueña (COLA.md §3.10). Cada ruta va a
// una pieza que existe en la cola, o queda aceptada, retirada o atada a la decisión V-01. Si al cerrar la cola alguna
// quedara sin dueña, va a ER-04 (COLA.md, SEED-01).

/** Las rutas R01…R32 de la tabla de ERRORES_Y_PRUEBAS.md. */
const RUTAS = [...new Set([...ERRORES.matchAll(/^\| (R\d{2}) \|/gm)].map((m) => m[1] ?? ''))];

/** Los ids de pieza de las tablas de COLA.md (`| [ ] | ID |` o `| [x] | ID |`). */
const PIEZAS = new Set([...COLA.matchAll(/^\| \[[ x]\] \| ([A-Z0-9-]+[a-z]*) \|/gm)].map((m) => m[1] ?? ''));

/** «R05», «R27-R29» o «R09 y R13» → la lista de rutas. */
function rutasDe(texto: string): string[] {
  const salida: string[] = [];
  for (const m of texto.matchAll(/R(\d{2})(?:-R(\d{2}))?/g)) {
    const desde = Number(m[1]);
    const hasta = m[2] ? Number(m[2]) : desde;
    for (let n = desde; n <= hasta; n++) salida.push(`R${String(n).padStart(2, '0')}`);
  }
  return salida;
}

/** El párrafo de §3.10 que reparte las rutas: «R01-R04 WI-04; R05 CF-04r y CF-04; …. Aceptadas, sin pieza: …». */
function reparto() {
  const parrafo = COLA.split('### 3.10')[1]?.split('\n| |')[0] ?? '';
  const [asignadas = '', ...resto] = parrafo.split('. Aceptadas');
  const otras = resto.join('. Aceptadas');
  const duenas = new Map<string, string[]>();
  const cuerpo = asignadas.split('(arriba):')[1] ?? '';
  for (const tramo of cuerpo.split(';')) {
    const m = tramo.trim().match(/^((?:R\d{2}(?:-R\d{2})?(?:\s+y\s+)?)+)\s+(.+)$/);
    if (!m) continue;
    const piezas = (m[2] ?? '').split(/\s+y\s+/).map((p) => p.trim().replace(/\.$/, ''));
    for (const r of rutasDe(m[1] ?? '')) duenas.set(r, piezas);
  }
  const grupo = (titulo: RegExp) => rutasDe(otras.match(titulo)?.[1] ?? '');
  return {
    duenas,
    aceptadas: grupo(/sin pieza:\s*([^.]+)\./),
    retiradas: grupo(/Retiradas:\s*([^.]+)\./),
    v01: grupo(/((?:R\d{2}[, y]*)+) siguen la decisión V-01/),
  };
}

describe('SEED-01 · cada ruta de error tiene pieza dueña', () => {
  it('lee las 32 rutas del catálogo y las piezas de la cola', () => {
    expect(RUTAS).toHaveLength(32);
    expect(PIEZAS.has('SEED-01')).toBe(true);
    expect(PIEZAS.has('ER-04')).toBe(true);
  });

  it('ninguna ruta queda huérfana y cada dueña es una pieza de COLA.md', () => {
    const { duenas, aceptadas, retiradas, v01 } = reparto();
    const sinDuena = RUTAS.filter(
      (r) => !duenas.has(r) && !aceptadas.includes(r) && !retiradas.includes(r) && !v01.includes(r),
    );
    expect(sinDuena).toEqual([]);
    const piezasQueNoExisten = [...duenas.values()].flat().filter((p) => !PIEZAS.has(p));
    expect(piezasQueNoExisten).toEqual([]);
    // V-01 la cierra ER-04.
    expect(v01).toEqual(['R22', 'R23', 'R24']);
    expect(aceptadas).toEqual(['R16', 'R18', 'R31']);
    expect(retiradas).toEqual(['R15', 'R26']);
    expect(duenas.size).toBe(32 - 3 - 2 - 3);
  });
});
