import { test } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARCO_REFERENCIA, TAMANOS, compararPantalla } from './geometria/arnes';
import { PANTALLAS } from './geometria/pantallas';

// F6-03 · Guion de comparación con el Figma (docs/implementacion/PLAN.md, fase 6 punto 3 y «Pruebas contra el Figma
// sin capturas»; COLA.md F6-03). Solo avisa: recorre las pantallas registradas en e2e/geometria/pantallas.ts, en
// cada tema y en 1093×560, 1200×800 y 960×600, las compara con sus huellas y deja la evidencia en
// .trabajo/comparacion/ (JSON y un resumen en Markdown). Nunca falla y no corre en la CI: tiene su propia
// configuración (playwright.comparar.config.ts). Uso: `pnpm --filter desktop comparar`.

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', '..', '..', '.trabajo', 'comparacion');
const INDICE = JSON.parse(readFileSync(join(AQUI, 'figma', 'indice.json'), 'utf-8')) as {
  familias: {
    pagina: string;
    nombre: string;
    ids: Record<string, string>;
    huellas: Record<string, { formato: string }>;
  }[];
};

interface Resultado {
  familia: string;
  nombre: string;
  tema: string;
  marco: string;
  diferencias: string[];
  error?: string;
}

test('F6-03 · comparación de las pantallas registradas con sus huellas (solo aviso)', async ({ page }) => {
  test.setTimeout(30 * 60 * 1000);
  const resultados: Resultado[] = [];
  for (const pantalla of PANTALLAS)
    for (const tema of pantalla.temas)
      for (const marco of [MARCO_REFERENCIA, ...TAMANOS]) {
        const r: Resultado = {
          familia: pantalla.familia,
          nombre: pantalla.nombre,
          tema,
          marco: `${marco.width}×${marco.height}`,
          diferencias: [],
        };
        try {
          await page.setViewportSize(marco);
          await pantalla.preparar(page, tema);
          r.diferencias = await compararPantalla(page, pantalla.filas);
        } catch (e) {
          r.error = e instanceof Error ? e.message.split('\n')[0] : String(e);
        }
        resultados.push(r);
      }

  const registradas = new Set(PANTALLAS.map((p) => p.familia));
  const sinRegistrar = INDICE.familias.filter((f) => !registradas.has(f.ids.claro ?? ''));
  const iguales = resultados.filter((r) => !r.error && r.diferencias.length === 0).length;
  const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  mkdirSync(SALIDA, { recursive: true });
  writeFileSync(join(SALIDA, `${fecha}.json`), `${JSON.stringify({ resultados, sinRegistrar }, null, 1)}\n`);

  const lineas = [
    `# Comparación con las huellas · ${new Date().toISOString()}`,
    '',
    `Pantallas registradas: ${PANTALLAS.length} de ${INDICE.familias.length} familias. Comparaciones: ${resultados.length}; sin diferencias: ${iguales}.`,
    'Solo aviso: la diferencia se juzga con la geometría y los tokens de la spec (PLAN.md, fase 6 punto 3).',
    '',
    '## Con diferencias o error',
    '',
    ...resultados
      .filter((r) => r.error || r.diferencias.length > 0)
      .flatMap((r) => [
        `### ${r.familia} · ${r.nombre} · ${r.tema} · ${r.marco}`,
        ...(r.error ? [`- Error: ${r.error}`] : r.diferencias.map((d) => `- ${d}`)),
        '',
      ]),
    '## Familias sin pantalla registrada',
    '',
    ...sinRegistrar.map(
      (f) =>
        `- ${f.ids.claro} · ${f.nombre} (${f.pagina}; huella: ${Object.values(f.huellas)[0]?.formato ?? 'sin huella propia'})`,
    ),
    '',
  ];
  writeFileSync(join(SALIDA, `${fecha}.md`), lineas.join('\n'));
  console.log(
    `Evidencia en .trabajo/comparacion/${fecha}.md (${iguales} de ${resultados.length} sin diferencias)`,
  );
});
