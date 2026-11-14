import { expect, test } from '@playwright/test';
import { informar, WINDOWS_X64 } from './navegador';

// CD-01-HU01 · Consultar la descripción, las funciones y los requisitos del sistema en la landing page.
// Textos literales de los CA, carácter por carácter.

const SIN_WINDOWS = 'Windgets está disponible solo para Windows 10 versión 22H2 y Windows 11, de 64 bits.';
const ARQUITECTURA =
  'Es posible que tu equipo no cumpla los requisitos. El instalador lo comprobará antes de instalar.';

test('CD-01-HU01-CA01 · Consultar la landing page', async ({ page }) => {
  await informar(page, WINDOWS_X64);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Windgets');
  await expect(
    page.getByText(
      'Windgets es una aplicación para Windows que combina un wallpaper personalizable con un planificador.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole('list', { name: 'Funciones principales' }).getByRole('listitem')).toHaveText([
    'Wallpaper personalizable: pon tu wallpaper como fondo real del escritorio de Windows.',
    'Widgets: coloca widgets de planificación y de información en tu escritorio.',
    'Planificador: organiza tus tarjetas en un tablero Kanban, un calendario, una agenda diaria y un planificador diario, y consulta reportes.',
    'Windi: pide ayuda a Windi, el agente de IA de la aplicación.',
    'Sincronización: encuentra tu información en cualquier computador y trabaja también sin conexión.',
  ]);
  const descarga = page.getByRole('region', { name: 'Descarga' });
  await expect(descarga.getByRole('button', { name: 'Descargar para Windows' })).toBeEnabled();
  await expect(
    descarga.getByText(
      'Requisitos: Windows 10 versión 22H2 o Windows 11, de 64 bits (x64), con al menos 500 MB libres y conexión a internet para iniciar sesión por primera vez.',
      { exact: true },
    ),
  ).toBeVisible();
  // Con Windows de 64 bits no hay avisos de compatibilidad.
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('CD-01-HU01-CA02 · Consultar la landing page desde un dispositivo sin Windows', async ({ page }) => {
  await informar(page, {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
    platform: 'macOS',
  });
  await page.goto('/');
  const descarga = page.getByRole('region', { name: 'Descarga' });
  await expect(descarga.getByRole('alert')).toHaveText(SIN_WINDOWS);
  await expect(descarga.getByRole('button', { name: 'Descargar para Windows' })).toBeEnabled();
});

test('CD-01-HU01-CA02 · Sin userAgentData se usa el userAgent (Firefox en Linux)', async ({ page }) => {
  await informar(page, {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Descarga' }).getByRole('alert')).toHaveText(SIN_WINDOWS);
});

test('CD-01-HU01-CA03 · Consultar la landing page desde Windows con arquitectura distinta de x64', async ({
  page,
}) => {
  for (const [architecture, bitness] of [
    ['arm', '64'],
    ['x86', '32'],
  ]) {
    await informar(page, { ...WINDOWS_X64, architecture, bitness });
    await page.goto('/');
    const descarga = page.getByRole('region', { name: 'Descarga' });
    await expect(descarga.getByRole('alert')).toHaveText(ARQUITECTURA);
    await expect(descarga.getByRole('button', { name: 'Descargar para Windows' })).toBeEnabled();
  }
});

test('CD-01-HU01-CA03 · Windows de 32 bits informado solo por el userAgent', async ({ page }) => {
  await informar(page, {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Descarga' }).getByRole('alert')).toHaveText(ARQUITECTURA);
});
