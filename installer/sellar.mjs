// Sella el instalador para su verificación de integridad (CD-02-HU01-CA12, ET17; installer.nsi,
// VerificarIntegridad). Agrega al final del .exe 8 bytes: la marca "WGI1" y el CRC-32 (little-endian) de todo lo
// anterior. Una descarga incompleta pierde la marca; una dañada no coincide con el CRC.
//
// Si a la descarga le falta el final, NSIS la rechaza antes de abrir el instalador, con su propio mensaje fijo en
// inglés. Por eso `traducir` cambia en el .exe ese mensaje por el de CD-02-HU01-CA12 antes de sellar.
//
// Uso: node installer/sellar.mjs <ruta del .exe>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { crc32 } from 'node:zlib';

export const MARCA = Buffer.from('WGI1', 'ascii');

// Textos del ejecutable de NSIS (UTF-16) y su reemplazo, que se rellena con ceros hasta el largo original.
export const MENSAJE_NSIS =
  'Installer integrity check has failed. Common causes include\nincomplete download and damaged media. Contact the\n' +
  "installer's author to obtain a new copy.\n\nMore information at:\nhttp://nsis.sf.net/NSIS_Error";
export const MENSAJE_DANADO =
  'El instalador está incompleto o dañado. Descárgalo de nuevo desde la landing page.';
export const TITULO_NSIS = 'NSIS Error';
export const TITULO = 'Windgets';

function reemplazar(contenido, original, nuevo) {
  const buscado = Buffer.from(original + '\0', 'utf16le');
  const posicion = contenido.indexOf(buscado);
  if (posicion < 0 || contenido.indexOf(buscado, posicion + 1) >= 0) {
    throw new Error(`No se encontró una sola vez el texto de NSIS «${original.split('\n')[0]}».`);
  }
  const reemplazo = Buffer.alloc(buscado.length);
  reemplazo.write(nuevo, 'utf16le');
  const resultado = Buffer.from(contenido);
  reemplazo.copy(resultado, posicion);
  return resultado;
}

/** Cambia el mensaje y el título en inglés con que NSIS rechaza un instalador incompleto. */
export function traducir(contenido) {
  return reemplazar(reemplazar(contenido, MENSAJE_NSIS, MENSAJE_DANADO), TITULO_NSIS, TITULO);
}

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
  writeFileSync(ruta, sellar(traducir(readFileSync(ruta))));
  console.log(`Instalador sellado: ${ruta}`);
}
