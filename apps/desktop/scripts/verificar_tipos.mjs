// Comprueba que los tipos que genera ts-rs (src/types/index.ts) son iguales a docs/tipos.ts.
// Igualdad estructural: cada tipo exportado de docs/tipos.ts existe en el generado y cada uno es
// asignable al otro. Uso: node scripts/verificar_tipos.mjs [referencia] [generado]
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const ref = resolve(process.argv[2] ?? join(aqui, '../../../docs/tipos.ts'));
const gen = resolve(process.argv[3] ?? join(aqui, '../src/types/index.ts'));
const nombres = [...readFileSync(ref, 'utf8').matchAll(/^export (?:type|interface) (\w+)(<[^>=]+>)?/gm)].map(
  (m) => [m[1], m[2] ? '<string>' : ''],
);
const dir = mkdtempSync(join(tmpdir(), 'tipos-'));
const sinExt = (p) => p.replace(/\.ts$/, '');
const lineas = [
  `import type * as R from '${sinExt(ref)}';`,
  `import type * as G from '${sinExt(gen)}';`,
  'type Igual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
  'type Exigir<T extends true> = T;',
  ...nombres.map(([n, g]) => `export type _${n} = Exigir<Igual<R.${n}${g}, G.${n}${g}>>;`),
];
const archivo = join(dir, 'verificar.ts');
writeFileSync(archivo, lineas.join('\n') + '\n');
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
try {
  execFileSync(
    process.execPath,
    [
      tsc,
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--allowImportingTsExtensions',
      '--moduleResolution',
      'bundler',
      '--module',
      'esnext',
      '--target',
      'es2022',
      archivo,
    ],
    { stdio: 'inherit' },
  );
  console.log(`TIPOS IGUALES: ${nombres.length} tipos de docs/tipos.ts`);
} catch {
  console.error('Los tipos generados no coinciden con docs/tipos.ts');
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
