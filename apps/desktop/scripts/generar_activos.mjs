// Genera los activos del catálogo que docs/ no incluye (convenciones.md, «Activos del catálogo») y
// los tamaños pequeños del ícono (convenciones.md, «Marca e íconos»). Los resultados quedan versionados.
// Requisitos: sharp (dependencia de desarrollo) y ffmpeg con libvpx-vp9 en el PATH (o en FFMPEG).
// Uso: pnpm --filter desktop run assets
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(app, '../../docs');
const salida = join(app, 'assets');
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const ANGULO = 18; // R-06: un solo ángulo diagonal de 18°

// Colores de la plantilla por defecto, leídos de seed.sql para no repetirlos.
const semilla = readFileSync(join(docs, 'supabase/seed.sql'), 'utf8');
const [, principal, secundario] = semilla.match(
  /'templates\/default\/background\.jpg',\s*'(#[0-9A-F]{6})', '(#[0-9A-F]{6})'/i,
);

function degradado(ancho, alto, desde, hasta) {
  const rad = (ANGULO * Math.PI) / 180;
  const dx = Math.cos(rad) * ancho;
  const dy = Math.sin(rad) * ancho;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">` +
      `<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${dx}" y2="${dy}">` +
      `<stop offset="0" stop-color="${desde}"/><stop offset="1" stop-color="${hasta}"/></linearGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
}

const crear = (ruta) => mkdirSync(dirname(ruta), { recursive: true });

async function imagen(ruta, ancho, alto, desde, hasta) {
  crear(ruta);
  const svg = sharp(degradado(ancho, alto, desde, hasta));
  await (ruta.endsWith('.png') ? svg.png() : svg.jpeg({ quality: 90 })).toFile(ruta);
}

// Plantilla por defecto
await imagen(join(salida, 'templates/default/background.jpg'), 1920, 1080, principal, secundario);
await imagen(join(salida, 'templates/default/thumbnail.png'), 320, 180, principal, secundario);

// Tipografías de seed.sql: peso 400, subconjunto latín
const requerir = createRequire(import.meta.url);
for (const [id, paquete] of [
  ['inter', 'inter'],
  ['merriweather', 'merriweather'],
  ['poppins', 'poppins'],
  ['jetbrains-mono', 'jetbrains-mono'],
]) {
  const origen = requerir.resolve(`@fontsource/${paquete}/files/${paquete}-latin-400-normal.woff2`);
  const destino = join(salida, `fonts/${id}.woff2`);
  crear(destino);
  copyFileSync(origen, destino);
}

// Imágenes de catálogo 01 a 06 (DUDA en docs/DUDAS.md: pares de colores no definidos)
const PARES = [
  ['#00D9E2', '#DC026C'],
  ['#DCBA04', '#DC026C'],
  ['#0B6E99', '#00D9E2'],
  ['#6604E6', '#DC026C'],
  ['#30A46C', '#00D9E2'],
  ['#F76B15', '#DCBA04'],
];
for (const [i, [desde, hasta]] of PARES.entries()) {
  await imagen(join(salida, `catalog/images/0${i + 1}.jpg`), 1920, 1080, desde, hasta);
}

// Animaciones de catálogo 01 a 03: 320 × 180, 5 s en bucle (una vuelta completa del degradado)
const VUELTA = (2 * Math.PI) / (25 * 5);
for (const [i, [desde, hasta]] of PARES.slice(0, 3).entries()) {
  const destino = join(salida, `catalog/animations/0${i + 1}.webm`);
  crear(destino);
  const filtro = `gradients=s=320x180:r=25:d=5:n=2:type=linear:speed=${VUELTA}:seed=1:c0=0x${desde.slice(1)}:c1=0x${hasta.slice(1)}`;
  execFileSync(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    filtro,
    '-c:v',
    'libvpx-vp9',
    '-b:v',
    '0',
    '-crf',
    '40',
    '-pix_fmt',
    'yuv420p',
    destino,
  ]);
}

// Ícono: 16 a 32 px con las versiones pequeñas del isotipo; 48 y 256 px desde la marca.
const tamanos = join(docs, 'marca/isotipo/tamanos');
const cuadrado = (archivo, lado) =>
  sharp(archivo)
    .resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
const capas = [
  [16, await cuadrado(join(tamanos, 'isotipo_16px_version-pequena.png'), 16)],
  [24, await cuadrado(join(tamanos, 'isotipo_24px_version-pequena.png'), 24)],
  [32, await cuadrado(join(tamanos, 'isotipo_32px_version-pequena.png'), 32)],
  [48, await cuadrado(join(tamanos, 'isotipo_48px.png'), 48)],
  [256, await cuadrado(join(docs, 'marca/isotipo/isotipo_color_transparente.png'), 256)],
];
const iconos = join(app, 'src-tauri/icons');
writeFileSync(join(iconos, '32x32.png'), capas[2][1]);
const cabecera = Buffer.alloc(6 + 16 * capas.length);
cabecera.writeUInt16LE(0, 0);
cabecera.writeUInt16LE(1, 2);
cabecera.writeUInt16LE(capas.length, 4);
let desplazamiento = cabecera.length;
capas.forEach(([lado, png], i) => {
  const e = 6 + i * 16;
  cabecera.writeUInt8(lado === 256 ? 0 : lado, e);
  cabecera.writeUInt8(lado === 256 ? 0 : lado, e + 1);
  cabecera.writeUInt16LE(1, e + 4);
  cabecera.writeUInt16LE(32, e + 6);
  cabecera.writeUInt32LE(png.length, e + 8);
  cabecera.writeUInt32LE(desplazamiento, e + 12);
  desplazamiento += png.length;
});
writeFileSync(join(iconos, 'icon.ico'), Buffer.concat([cabecera, ...capas.map(([, png]) => png)]));

console.log('Activos generados en apps/desktop/assets y src-tauri/icons');
