import { expect, test, type Page } from '@playwright/test';

// HE-09-HU05 · Reordenar las columnas con drag-and-drop del encabezado: lo que necesita un navegador real
// (dnd-kit mide las cajas). Usa la aplicación con el Núcleo simulado (pnpm dev). La regla del orden está en
// src/screens/kanban/ReordenarColumnas.test.ts (Vitest).

/** Arrastra con el mouse el encabezado de la columna `nombre` hasta el punto indicado, en pasos. */
async function arrastrarEncabezado(page: Page, nombre: string, x: number, y: number) {
  const encabezado = page.getByRole('region', { name: nombre }).locator('.wg-columna__encabezado');
  const caja = await encabezado.boundingBox();
  if (!caja) throw new Error('El encabezado no tiene caja');
  await page.mouse.move(caja.x + 8, caja.y + caja.height / 2);
  await page.mouse.down();
  await page.mouse.move(caja.x + 18, caja.y + caja.height / 2 + 10, { steps: 4 });
  await page.mouse.move(x, y, { steps: 12 });
  await page.mouse.move(x + 1, y + 1);
  await page.waitForTimeout(150);
  await page.mouse.up();
}

function nombresDeColumnas(page: Page) {
  return page.locator('.wg-columna').evaluateAll((cs) => cs.map((c) => c.getAttribute('aria-label')));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña').fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('button', { name: 'Tablero Kanban' })
    .click();
  await expect.poll(() => nombresDeColumnas(page)).toEqual(['Por hacer', 'En progreso', 'Hecho']);
});

test('HE-09-HU05-CA01 · Reordenar las columnas', async ({ page }) => {
  const destino = await page.getByRole('region', { name: 'Por hacer' }).boundingBox();
  if (!destino) throw new Error('La columna no tiene caja');
  await arrastrarEncabezado(page, 'Hecho', destino.x + 20, destino.y + destino.height / 2);
  await expect.poll(() => nombresDeColumnas(page)).toEqual(['Hecho', 'Por hacer', 'En progreso']);
  // ET04: se conserva al volver a abrir el tablero.
  const menu = page.getByRole('navigation', { name: 'Menú principal' });
  await menu.getByRole('button', { name: 'Etiquetas' }).click();
  await menu.getByRole('button', { name: 'Tablero Kanban' }).click();
  await expect.poll(() => nombresDeColumnas(page)).toEqual(['Hecho', 'Por hacer', 'En progreso']);
});

test('HE-09-HU05-CA02 · Soltar una columna fuera del tablero', async ({ page }) => {
  // ET02: fuera del área de columnas (sobre la fila de opciones del tablero) se mantiene el orden anterior.
  // RD-74: la fila de opciones es la del interruptor de vista.
  const fila = await page.getByRole('group', { name: 'Vista de las tarjetas' }).boundingBox();
  if (!fila) throw new Error('La opción no tiene caja');
  await arrastrarEncabezado(page, 'Hecho', fila.x - 300, fila.y + fila.height / 2);
  await page.waitForTimeout(300);
  expect(await nombresDeColumnas(page)).toEqual(['Por hacer', 'En progreso', 'Hecho']);
});
