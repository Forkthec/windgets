import { expect, test, type Locator, type Page } from '@playwright/test';

// P37 · Rediseño de las subpantallas de Agregar widget y del indicador de sincronización (docs/rediseno.md RD-58 a
// RD-61; Figma «Windgets (Copy)» 84:726 a 84:888 y 84:918). Medidas a ±2 px (regla 11) con el Núcleo simulado.

const TOLERANCIA = 2;

async function entrar(page: Page) {
  await page.setViewportSize({ width: 1360, height: 1100 });
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña').fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('radio', { name: 'Claro' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-modo', 'claro');
}

async function caja(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('sin caja');
  return b;
}

const cerca = (medido: number, esperado: number) =>
  expect(Math.abs(medido - esperado), `${medido} ≠ ${esperado}`).toBeLessThanOrEqual(TOLERANCIA);

const estilo = (l: Locator, propiedad: string) =>
  l.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), propiedad);

async function agregarWidget(page: Page) {
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('button', { name: 'Widgets' })
    .click();
  await page.getByRole('button', { name: 'Agregar widget' }).click();
  return page.getByRole('main', { name: 'Agregar widget' });
}

test('RD-58 · Agregar widget: filas de 57 px con fondo de columna y «Regresar» abajo a la izquierda', async ({
  page,
}) => {
  await entrar(page);
  const sub = await agregarWidget(page);
  const filas = sub.locator('.wg-subpantalla-widget__catalogo').first().getByRole('button');
  const primera = await caja(filas.nth(0));
  const segunda = await caja(filas.nth(1));
  cerca(primera.height, 57);
  // 84:730 y 84:732: una fila cada 72 px.
  cerca(segunda.y - primera.y, 72);
  expect(await estilo(filas.nth(0), 'background-color')).toBe('rgb(242, 236, 248)');
  expect(await estilo(filas.nth(0), 'border-radius')).toBe('8px');
  // «Regresar» ya no va en el encabezado: va después de la última fila, a la izquierda.
  const regresar = sub.getByRole('button', { name: 'Regresar', exact: true });
  await expect(regresar).toHaveCount(1);
  const ultima = await caja(
    sub.locator('.wg-subpantalla-widget__catalogo').last().getByRole('button').last(),
  );
  const r = await caja(regresar);
  cerca(r.x, ultima.x);
  expect(r.y).toBeGreaterThan(ultima.y + ultima.height);
  cerca(r.height, 48);
});

test('RD-59 · Clima: campo de 522 px y «Agregar» y «Regresar» de 48 px abajo a la izquierda', async ({
  page,
}) => {
  await entrar(page);
  const sub = await agregarWidget(page);
  await sub.getByRole('button', { name: /^Clima/ }).click();
  const clima = page.getByRole('main', { name: 'Clima' });
  const campo = await caja(
    clima.getByRole('combobox', { name: 'Ciudad' }).or(clima.getByLabel('Ciudad')).first(),
  );
  cerca(campo.width, 522);
  const agregar = await caja(clima.getByRole('button', { name: 'Agregar', exact: true }));
  const regresar = await caja(clima.getByRole('button', { name: 'Regresar', exact: true }));
  cerca(agregar.x, campo.x);
  cerca(agregar.height, 48);
  cerca(regresar.y, agregar.y);
  // 84:756 a 84:758: «Regresar» a la derecha de «Agregar», 12 px después.
  cerca(regresar.x - (agregar.x + agregar.width), 12);
  expect(await estilo(clima.getByRole('button', { name: 'Agregar', exact: true }), 'border-radius')).toBe(
    '9px',
  );
});

test('RD-60 · Noticias e Imagen estática: el dato en una fila de fondo de columna y las acciones abajo', async ({
  page,
}) => {
  await entrar(page);
  let sub = await agregarWidget(page);
  await sub.getByRole('button', { name: /^Noticias/ }).click();
  const noticias = page.getByRole('main', { name: 'Noticias' });
  const dato = noticias.locator('.wg-subpantalla-widget__dato');
  expect((await caja(dato)).height).toBeGreaterThanOrEqual(57 - TOLERANCIA);
  expect(await estilo(dato, 'background-color')).toBe('rgb(242, 236, 248)');
  const agregar = await caja(noticias.getByRole('button', { name: 'Agregar', exact: true }));
  expect(agregar.y).toBeGreaterThan((await caja(dato)).y);
  await noticias.getByRole('button', { name: 'Regresar', exact: true }).click();

  sub = page.getByRole('main', { name: 'Agregar widget' });
  await sub.getByRole('button', { name: /^Imagen estática/ }).click();
  const imagen = page.getByRole('main', { name: 'Imagen estática' });
  // 84:796 a 84:800: «Subir imagen», «Catálogo de imágenes» y «Agregar» en una fila, y después «Regresar».
  const nombres = await imagen
    .locator('.wg-subpantalla-widget__acciones')
    .getByRole('button')
    .allTextContents();
  expect(nombres).toEqual(['Subir imagen', 'Catálogo de imágenes', 'Agregar', 'Regresar']);
  const subir = await caja(imagen.getByRole('button', { name: 'Subir imagen' }));
  const regresar = await caja(imagen.getByRole('button', { name: 'Regresar', exact: true }));
  cerca(regresar.y, subir.y);
});

test('RD-61 · El indicador de sincronización en 15 px y el color del texto secundario', async ({ page }) => {
  await entrar(page);
  const indicador = page.getByRole('status', { name: 'Indicador de sincronización' });
  await expect(indicador).toHaveText('Sincronizado');
  expect(await estilo(indicador, 'font-size')).toBe('15px');
  expect(await estilo(indicador, 'color')).toBe('rgb(95, 85, 107)');
});
