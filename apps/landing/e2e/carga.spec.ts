import { expect, test } from '@playwright/test';

// Prueba de humo: la landing compila, se sirve y carga. No prueba ningún CA (criterio de aceptación) de CD-01.
test('la landing page carga', async ({ page }) => {
  const respuesta = await page.goto('/');
  expect(respuesta?.ok()).toBe(true);
  await expect(page.locator('#app')).toBeAttached();
});
