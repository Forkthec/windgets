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
const [, principal, , texto] = semilla.match(
  /'templates\/default\/background\.jpg',\s*'(#[0-9A-F]{6})', '(#[0-9A-F]{6})', '(#[0-9A-F]{6})'/i,
);

// Fondo «Amanecer» de la figura 11: cielo durazno, sol y colinas verdes. DUDA: el mockup no da los colores
// exactos; valores tomados de la figura (docs/DUDAS.md, P23).
const COLINAS = ['#C3D2B9', '#A7BEA2', '#88A58B', '#668B75', '#3F6152'];
const fondoAmanecer = () =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">` +
      `<defs><linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#F7E6D2"/><stop offset="1" stop-color="#F3D6B8"/></linearGradient></defs>` +
      `<rect width="1920" height="1080" fill="url(#cielo)"/>` +
      `<circle cx="1560" cy="560" r="160" fill="#F2B27E"/>` +
      [
        'M0,650 C320,580 640,630 960,660 S1600,640 1920,610 V1080 H0 Z',
        'M0,710 C360,650 720,710 1080,725 S1680,640 1920,650 V1080 H0 Z',
        'M0,780 C400,730 760,810 1120,800 S1720,730 1920,750 V1080 H0 Z',
        'M0,860 C420,810 820,890 1200,870 S1760,830 1920,850 V1080 H0 Z',
        'M0,955 C480,905 880,965 1280,955 S1800,925 1920,935 V1080 H0 Z',
      ]
        .map((d, i) => `<path d="${d}" fill="${COLINAS[i]}"/>`)
        .join('') +
      `</svg>`,
  );

// Miniatura de la figura 11: la distribución de los cuatro widgets por defecto (0003_funciones.sql, sobre
// 1920 × 1080) reducida a 320 × 180, sobre el color principal de la plantilla.
const WIDGETS_POR_DEFECTO = [
  [40, 40, 320, 160],
  [40, 220, 320, 340],
  [380, 40, 360, 520],
  [760, 40, 640, 520],
];
const miniatura = () =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 1920 1080">` +
      `<rect width="1920" height="1080" fill="${principal}"/>` +
      WIDGETS_POR_DEFECTO.map(
        ([x, y, w, h]) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#DCE3DA" stroke="${texto}" stroke-width="9"/>`,
      ).join('') +
      `</svg>`,
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
crear(join(salida, 'templates/default/background.jpg'));
await sharp(fondoAmanecer()).jpeg({ quality: 90 }).toFile(join(salida, 'templates/default/background.jpg'));
await sharp(miniatura()).png().toFile(join(salida, 'templates/default/thumbnail.png'));

// Cabecera del instalador (P23): 150 × 57 en BMP de 24 bits (MUI_HEADERIMAGE), el logo horizontal sobre el color
// de la cabecera (MUI_BGCOLOR de installer/installer.nsi). Un solo identificador de marca (R-10).
const FONDO_DE_CABECERA = '#DCE3DA';
const logo = await sharp(join(docs, 'marca/logo/logo_horizontal_color_para-fondo-claro_transparente.png'))
  .resize({ height: 26 })
  .toBuffer({ resolveWithObject: true });
const { data: pixeles } = await sharp({
  create: { width: 150, height: 57, channels: 3, background: FONDO_DE_CABECERA },
})
  .composite([
    { input: logo.data, left: Math.round((150 - logo.info.width) / 2), top: Math.round((57 - 26) / 2) },
  ])
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const fila = Math.ceil((150 * 3) / 4) * 4;
const bmp = Buffer.alloc(54 + fila * 57);
bmp.write('BM', 0, 'ascii');
bmp.writeUInt32LE(bmp.length, 2);
bmp.writeUInt32LE(54, 10);
bmp.writeUInt32LE(40, 14);
bmp.writeInt32LE(150, 18);
bmp.writeInt32LE(57, 22);
bmp.writeUInt16LE(1, 26);
bmp.writeUInt16LE(24, 28);
bmp.writeUInt32LE(fila * 57, 34);
for (let y = 0; y < 57; y++) {
  for (let x = 0; x < 150; x++) {
    const o = (y * 150 + x) * 3;
    const d = 54 + (56 - y) * fila + x * 3; // de abajo hacia arriba, en BGR
    bmp[d] = pixeles[o + 2];
    bmp[d + 1] = pixeles[o + 1];
    bmp[d + 2] = pixeles[o];
  }
}
writeFileSync(join(app, '../../installer/cabecera.bmp'), bmp);

// Tipografías de seed.sql: peso 400, subconjunto latín
const requerir = createRequire(import.meta.url);
for (const [id, paquete] of [
  ['inter', 'inter'],
  ['merriweather', 'merriweather'],
  ['poppins', 'poppins'],
  ['jetbrains-mono', 'jetbrains-mono'],
  ['nunito', 'nunito'],
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
