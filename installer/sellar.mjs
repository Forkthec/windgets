// Sella el instalador para su verificación de integridad (CD-02-HU01-CA12, ET17; installer.nsi,
// VerificarIntegridad). Agrega al final del .exe 8 bytes: la marca "WGI1" y el CRC-32 (little-endian) de todo lo
// anterior. Una descarga incompleta pierde la marca; una dañada no coincide con el CRC.
//
// Uso: node installer/sellar.mjs <ruta del .exe>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

export const MARCA = Buffer.from('WGI1', 'ascii');

/** Devuelve el contenido sellado. Falla si ya estaba sellado, para no sellar dos veces. */
export function sellar(contenido) {
  if (estaSellado(contenido)) throw new Error('El instalador ya está sellado.');
  const cola = Buffer.alloc(8);
  MARCA.copy(cola, 0);
  cola.writeUInt32LE(crc32(contenido), 4);
  return Buffer.concat([contenido, cola]);
}

/** La misma comprobación que hace el instalador al abrirse. */
export function estaSellado(contenido) {
  if (contenido.length <= 8) return false;
  const cuerpo = contenido.subarray(0, contenido.length - 8);
  const cola = contenido.subarray(contenido.length - 8);
  return cola.subarray(0, 4).equals(MARCA) && cola.readUInt32LE(4) === crc32(cuerpo);
}

// Solo al ejecutarse como programa, no al importarse desde las pruebas.
if (argv[1] && fileURLToPath(import.meta.url) === resolve(argv[1])) {
  const ruta = argv[2];
  if (!ruta) {
    console.error('Uso: node installer/sellar.mjs <ruta del .exe>');
    exit(1);
  }
  writeFileSync(ruta, sellar(readFileSync(ruta)));
  console.log(`Instalador sellado: ${ruta}`);
}
