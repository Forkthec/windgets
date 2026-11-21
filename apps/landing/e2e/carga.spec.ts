import { expect, test } from '@playwright/test';

// Prueba de humo: la landing compila, se sirve y carga. No prueba ningún CA (criterio de aceptación) de CD-01.
test('la landing page carga', async ({ page }) => {
  const respuesta = await page.goto('/');
  expect(respuesta?.ok()).toBe(true);
  await expect(page.locator('#app')).toBeAttached();
});

test('la landing page tiene el ícono de la pestaña', async ({ page, request }) => {
  await page.goto('/');
  const iconos = page.locator('link[rel="icon"]');
  await expect(iconos).toHaveCount(2);
  for (const href of await iconos.evaluateAll((ls) => ls.map((l) => l.getAttribute('href') ?? ''))) {
    const respuesta = await request.get(href);
    expect(respuesta.ok()).toBe(true);
    expect((await respuesta.body()).length).toBeGreaterThan(0);
  }
});
