import { expect, test, type Locator } from '@playwright/test';

// RT-02 · Ventanas emergentes: lo que necesita un navegador real (el fondo inerte no recibe el clic).
// Las demás pruebas de RT-02 están en src/reglas/RT-02.test.tsx (Vitest).

/** Clic del mouse donde se ve el elemento, como lo haría el usuario (sin pasar por el elemento). */
async function clicEnElCentro(elemento: Locator) {
  const caja = await elemento.boundingBox();
  if (!caja) throw new Error('El elemento no tiene caja');
  await elemento.page().mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
}

/**
 * Clic que empieza dentro de la ventana y termina sobre el fondo. Desde RD-103 un clic entero en el velo cierra la
 * ventana, así que para comprobar que el fondo no responde con la ventana abierta el gesto debe empezar dentro de ella.
 */
async function arrastrarDesdeLaVentanaHasta(elemento: Locator) {
  const page = elemento.page();
  const ventana = await page.getByRole('dialog', { name: 'Detalle de tarjeta' }).boundingBox();
  const caja = await elemento.boundingBox();
  if (!ventana || !caja) throw new Error('Falta la caja de la ventana o del elemento');
  await page.mouse.move(ventana.x + ventana.width / 2, ventana.y + ventana.height / 2);
  await page.mouse.down();
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.up();
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
  const nuevaColumna = page.getByRole('button', { name: 'Nueva columna', includeHidden: true });
  await arrastrarDesdeLaVentanaHasta(nuevaColumna);
  await expect(page.getByText('Selecciones del fondo: 0')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeVisible();
  // RD-103: el clic entero sobre el fondo lo recibe el velo (cierra la ventana) y el fondo no responde.
  await clicEnElCentro(nuevaColumna);
  await expect(page.getByRole('dialog', { name: 'Detalle de tarjeta' })).toHaveCount(0);
  await expect(page.getByText('Selecciones del fondo: 0')).toBeVisible();
});

test('RT-02-CA09 · Menú principal bloqueado', async ({ page }) => {
  const calendario = page.getByRole('button', { name: 'Calendario', includeHidden: true });
  await arrastrarDesdeLaVentanaHasta(calendario);
  await expect(page.getByRole('main', { name: 'Calendario', includeHidden: true })).toHaveCount(0);
  await expect(page.getByRole('main', { name: 'Tablero Kanban', includeHidden: true })).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeVisible();
  // RD-103: el clic entero sobre el menú lo recibe el velo (cierra la ventana) y el menú no cambia de pantalla.
  await clicEnElCentro(calendario);
  await expect(page.getByRole('dialog', { name: 'Detalle de tarjeta' })).toHaveCount(0);
  await expect(page.getByRole('main', { name: 'Calendario', includeHidden: true })).toHaveCount(0);
  await expect(page.getByRole('main', { name: 'Tablero Kanban', includeHidden: true })).toHaveCount(1);
});
