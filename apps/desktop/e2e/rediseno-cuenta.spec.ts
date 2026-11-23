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
