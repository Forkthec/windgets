import { expect, test, type Locator, type Page } from '@playwright/test';

// P37 · Rediseño de las subpantallas de Agregar widget y del indicador de sincronización (docs/rediseno.md RD-58 a
// RD-61; Figma «Windgets (Copy)» 84:726 a 84:888 y 84:918). Medidas a ±2 px (regla 11) con el Núcleo simulado.

const TOLERANCIA = 2;

async function entrar(page: Page) {
  await page.setViewportSize({ width: 1360, height: 1100 });
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  // RD-62: con sesión no hay Claro/Oscuro; los colores salen del tema aplicado.
  await expect(page.locator('body')).toHaveAttribute('data-sesion', '');
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

/** El color en `rgb()` de una variable del tema (RD-62: ya no hay colores fijos por modo). */
const colorDe = (page: Page, variable: string) =>
  page.evaluate((v) => {
    const muestra = document.createElement('div');
    muestra.style.backgroundColor = `var(${v})`;
    document.body.append(muestra);
    const color = getComputedStyle(muestra).backgroundColor;
    muestra.remove();
    return color;
  }, variable);

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
  expect(await estilo(filas.nth(0), 'background-color')).toBe(await colorDe(page, '--wgm-columna'));
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
  expect(await estilo(dato, 'background-color')).toBe(await colorDe(page, '--wgm-columna'));
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

test('RD-61, RD-66 · El indicador de sincronización en 12 px y el color del texto secundario', async ({
  page,
}) => {
  await entrar(page);
  const indicador = page.getByRole('status', { name: 'Indicador de sincronización' });
  await expect(indicador).toHaveText('Sincronizado');
  expect(await estilo(indicador, 'font-size')).toBe('12px');
  expect(await estilo(indicador, 'color')).toBe(await colorDe(page, '--wg-texto'));
});

test('RD-91 · Carrusel: el mensaje del intervalo no mueve las acciones y el clic en «Regresar» responde', async ({
  page,
}) => {
  await entrar(page);
  const sub = await agregarWidget(page);
  await sub.getByRole('button', { name: /^Carrusel de imágenes/ }).click();
  const carrusel = page.getByRole('main', { name: 'Carrusel de imágenes' });
  const regresar = carrusel.getByRole('button', { name: 'Regresar', exact: true });
  const campo = carrusel.getByLabel('Intervalo (segundos)');
  const antes = await caja(regresar);
  await campo.fill('2');
  await campo.blur();
  const mensaje = carrusel.getByText('El intervalo debe estar entre 3 y 60 segundos.');
  await expect(mensaje).toBeVisible();
  cerca((await caja(regresar)).y, antes.y);
  // El mensaje cabe entre el campo y el texto de formatos, sin taparlo.
  const m = await caja(mensaje);
  const formatos = await caja(carrusel.getByText('JPG, JPEG o PNG. Máximo 20 MB.'));
  expect(formatos.y - (m.y + m.height)).toBeGreaterThanOrEqual(8 - TOLERANCIA);
  // Con el cursor en el campo y un valor mal, un clic cerca del borde superior de «Regresar» responde.
  await campo.fill('1');
  await regresar.click({ position: { x: 10, y: 3 } });
  await expect(page.getByRole('main', { name: 'Agregar widget' })).toBeVisible();
});
