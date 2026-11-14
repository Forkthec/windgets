import { expect, test, type Page, type Route } from '@playwright/test';
import { informar, WINDOWS_X64 } from './navegador';

// CD-01-HU02 · Descargar el instalador desde la landing page. La API de GitHub y la descarga se simulan con
// el repositorio de prueba de playwright.config.ts (INT-12).

const API = 'https://api.github.com/repos/prueba/windgets/releases/latest';
const DESCARGA = 'https://github.com/prueba/windgets/releases/latest/download/Windgets-Setup.exe';
const AVISO = 'No pudimos iniciar la descarga. Intenta de nuevo.';

const RELEASE = {
  tag_name: 'v1.0.0',
  assets: [
    {
      name: 'Windgets-Setup.exe',
      size: 94371840,
      browser_download_url: 'https://github.com/prueba/windgets/releases/download/v1.0.0/Windgets-Setup.exe',
    },
  ],
};

async function servirInstalador(page: Page) {
  await page.route(DESCARGA, (ruta) =>
    ruta.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="Windgets-Setup.exe"',
      },
      body: 'MZ',
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await informar(page, WINDOWS_X64);
});

test('CD-01-HU02-CA01 · Descargar el instalador', async ({ page }) => {
  let consultas = 0;
  await page.route(API, (ruta) => {
    consultas += 1;
    return ruta.fulfill({ json: RELEASE });
  });
  await servirInstalador(page);
  await page.goto('/');
  // La consulta se hace al seleccionar el botón, no al cargar la página (CD-01-HU02-ET05).
  expect(consultas).toBe(0);
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar para Windows' }).click();
  expect((await descarga).suggestedFilename()).toBe('Windgets-Setup.exe');
  expect(consultas).toBe(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

const sinInstalador: Array<[string, (ruta: Route) => Promise<void>]> = [
  ['la release no tiene el instalador', (r) => r.fulfill({ json: { tag_name: 'v1.0.0', assets: [] } })],
  ['no hay releases (404)', (r) => r.fulfill({ status: 404, json: { message: 'Not Found' } })],
  [
    'límite de consultas (403)',
    (r) => r.fulfill({ status: 403, json: { message: 'API rate limit exceeded' } }),
  ],
  ['sin conexión', (r) => r.abort('internetdisconnected')],
];

for (const [caso, responder] of sinInstalador) {
  test(`CD-01-HU02-CA02 · Error en la descarga: ${caso}`, async ({ page }) => {
    await page.route(API, responder);
    let descargas = 0;
    page.on('download', () => (descargas += 1));
    await page.goto('/');
    const boton = page.getByRole('button', { name: 'Descargar para Windows' });
    await boton.click();
    const zona = page.getByRole('region', { name: 'Descarga' });
    await expect(zona.getByRole('alert')).toHaveText(AVISO);
    await expect(boton).toBeEnabled();
    // Un segundo intento fallido no repite el aviso.
    await boton.click();
    await expect(zona.getByRole('alert')).toHaveCount(1);
    expect(descargas).toBe(0);
  });
}

test('CD-01-HU02-CA02 · El aviso desaparece cuando la descarga inicia en otro intento', async ({ page }) => {
  let disponible = false;
  await page.route(API, (r) =>
    disponible ? r.fulfill({ json: RELEASE }) : r.fulfill({ status: 404, json: { message: 'Not Found' } }),
  );
  await servirInstalador(page);
  await page.goto('/');
  const boton = page.getByRole('button', { name: 'Descargar para Windows' });
  await boton.click();
  await expect(page.getByRole('alert')).toHaveText(AVISO);
  disponible = true;
  const descarga = page.waitForEvent('download');
  await boton.click();
  await descarga;
  await expect(page.getByRole('alert')).toHaveCount(0);
});
