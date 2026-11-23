import { expect, test } from '@playwright/test';

// P28 · Rediseño de las pantallas de cuenta (docs/rediseno.md): el modo Claro/Oscuro y la ventana angosta en un
// navegador real, con el Núcleo simulado (src/ipc/simulado.ts).

test('RD-02, RD-03, RD-04 · El modo elegido cambia la apariencia y se conserva al recargar', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const raiz = page.locator('.wg-cuenta-raiz');
  // RD-03: la primera vez toma el modo de Windows (aquí, claro).
  await expect(raiz).toHaveAttribute('data-modo', 'claro');
  const fondoClaro = await raiz.evaluate((e) => getComputedStyle(e).backgroundColor);
  await page.getByRole('radio', { name: 'Oscuro' }).click();
  await expect(raiz).toHaveAttribute('data-modo', 'oscuro');
  await expect(page.getByRole('radio', { name: 'Oscuro' })).toHaveAttribute('aria-checked', 'true');
  expect(await raiz.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(fondoClaro);
  await page.reload();
  await expect(page.locator('.wg-cuenta-raiz')).toHaveAttribute('data-modo', 'oscuro');
});

test('RD-03 · Sin modo guardado, Windows en oscuro abre las pantallas de cuenta en Oscuro', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('.wg-cuenta-raiz')).toHaveAttribute('data-modo', 'oscuro');
});

test('RD-07 · Windi se ve en la ventana ancha y se oculta en la angosta', async ({ page }) => {
  await page.setViewportSize({ width: 1240, height: 820 });
  await page.goto('/');
  await expect(page.getByRole('complementary', { name: 'Windi' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Bienvenido a Windgets' })).toBeVisible();
  await page.setViewportSize({ width: 900, height: 820 });
  await expect(page.getByRole('complementary', { name: 'Windi' })).toBeHidden();
  // El formulario sigue completo y usable.
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

test('RD-12 · En Registro, «¿Ya tienes cuenta? Inicia sesión» abre Inicio de sesión', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Regístrate' }).click();
  await expect(page.getByRole('main', { name: 'Registro' })).toBeVisible();
  await page.getByRole('link', { name: 'Inicia sesión' }).click();
  await expect(page.getByRole('main', { name: 'Inicio de sesión' })).toBeVisible();
});

// Caja de un elemento en px CSS, redondeada: [x, y, ancho, alto].
async function caja(page: import('@playwright/test').Page, selector: string) {
  const r = await page.locator(selector).first().boundingBox();
  if (!r) throw new Error(`${selector} no se ve`);
  return [r.x, r.y, r.width, r.height].map(Math.round);
}

// Compara con lo medido sobre el marco del Figma, con ±2 px (RD-19, RD-20).
function cerca(real: number[], figma: number[]) {
  real.forEach((v, i) =>
    expect(Math.abs(v - figma[i]), `posición ${i}: ${v} frente a ${figma[i]}`).toBeLessThanOrEqual(2),
  );
}

test('RD-19 · Inicio de sesión y Registro siguen la composición del Figma (66:4, 66:162)', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 1240, height: 820 });
  await page.goto('/');
  cerca(await caja(page, '.wg-nota'), [602, 135, 552, 624]);
  cerca(await caja(page, '.wg-globo'), [141, 269, 347, 84]);
  cerca(await caja(page, '.wg-cuenta__ilustracion'), [58, 361, 513, 319]);
  // A 1240 × 820 la pantalla cabe sin desplazarse.
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(820);
  // Tampoco en la ventana de 1200 × 800, el tamaño con que abre.
  await page.setViewportSize({ width: 1200, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(800);

  await page.setViewportSize({ width: 1240, height: 930 });
  await page.getByRole('link', { name: 'Regístrate' }).click();
  await expect(page.getByRole('main', { name: 'Registro' })).toBeVisible();
  const [, arriba, ancho] = await caja(page, '.wg-nota');
  cerca([arriba, ancho], [138, 552]);
  // El globo de Registro queda a la izquierda de la nota, sin tocarla.
  const [gx, , gancho] = await caja(page, '.wg-globo');
  const [nx] = await caja(page, '.wg-nota');
  expect(gx + gancho).toBeLessThan(nx);
});

test('RD-20 · Las pantallas centradas siguen el Figma (84:22) con el logo centrado sobre la nota', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 790 });
  await page.goto('/');
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
  await expect(page.getByRole('main', { name: 'Recuperar contraseña' })).toBeVisible();
  const nota = await caja(page, '.wg-nota');
  cerca(nota, [355, 131, 570, 420]);
  const logo = await caja(page, '.wg-cuenta__logo');
  cerca([logo[0] + logo[2] / 2], [nota[0] + nota[2] / 2]);
  // Márgenes iguales a los dos lados de la nota.
  cerca([nota[0]], [1280 - nota[0] - nota[2]]);
});

test('RD-21 · Windi se oculta por debajo de 1000 px y la nota no cambia de altura', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 820 });
  await page.goto('/');
  await expect(page.getByRole('complementary', { name: 'Windi' })).toBeVisible();
  const [, arriba] = await caja(page, '.wg-nota');
  // El globo no se sale de su columna ni corta el texto.
  const [gx, , gancho] = await caja(page, '.wg-globo');
  const [nx] = await caja(page, '.wg-nota');
  expect(gx).toBeGreaterThanOrEqual(0);
  expect(gx + gancho).toBeLessThan(nx);

  await page.setViewportSize({ width: 999, height: 820 });
  await expect(page.getByRole('complementary', { name: 'Windi' })).toBeHidden();
  const nota = await caja(page, '.wg-nota');
  cerca([nota[1]], [arriba]);
  cerca([nota[0]], [999 - nota[0] - nota[2]]);

  await page.setViewportSize({ width: 960, height: 600 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(960);
});

test('RD-22 · El selector «Apariencia» se maneja con las flechas', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('radio', { name: 'Claro' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.wg-cuenta-raiz')).toHaveAttribute('data-modo', 'oscuro');
  await expect(page.getByRole('radio', { name: 'Oscuro' })).toBeFocused();
});

test('RD-23 · Con un tema de contraste, la opción elegida y el paso actual siguen distinguiéndose', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', forcedColors: 'active' });
  await page.goto('/');
  const fondo = (nombre: string) =>
    page.getByRole('radio', { name: nombre }).evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(await fondo('Claro')).not.toBe(await fondo('Oscuro'));
  await page.getByRole('link', { name: 'Regístrate' }).click();
  const contorno = await page
    .locator('.wg-pasos__paso--actual')
    .evaluate((e) => getComputedStyle(e).outlineStyle);
  expect(contorno).toBe('solid');
});
