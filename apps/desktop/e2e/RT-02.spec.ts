import { expect, test, type Locator } from '@playwright/test';

// RT-02 · Ventanas emergentes: lo que necesita un navegador real (el fondo inerte no recibe el clic).
// Las demás pruebas de RT-02 están en src/reglas/RT-02.test.tsx (Vitest).

/** Clic del mouse donde se ve el elemento, como lo haría el usuario (sin pasar por el elemento). */
async function clicEnElCentro(elemento: Locator) {
  const caja = await elemento.boundingBox();
  if (!caja) throw new Error('El elemento no tiene caja');
  await elemento.page().mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/pantallas/rt.html?caso=emergente');
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('button', { name: 'Tablero Kanban' })
    .click();
  await page.getByRole('button', { name: 'Leer el capítulo 3' }).click();
  await expect(page.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeVisible();
});

test('RT-02-CA08 · Pantalla de fondo bloqueada', async ({ page }) => {
  // RT-02-ET02: la pantalla de fondo sigue visible.
  await expect(page.getByText('Selecciones del fondo: 0')).toBeVisible();
  await clicEnElCentro(page.getByRole('button', { name: 'Nueva columna', includeHidden: true }));
  await expect(page.getByText('Selecciones del fondo: 0')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeVisible();
});

test('RT-02-CA09 · Menú principal bloqueado', async ({ page }) => {
  await clicEnElCentro(page.getByRole('button', { name: 'Calendario', includeHidden: true }));
  await expect(page.getByRole('main', { name: 'Calendario', includeHidden: true })).toHaveCount(0);
  await expect(page.getByRole('main', { name: 'Tablero Kanban', includeHidden: true })).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeVisible();
});
