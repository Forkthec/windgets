import { expect, test, type Locator, type Page } from '@playwright/test';

// HE-09-HU02 · Mover una tarjeta con drag-and-drop: lo que necesita un navegador real (dnd-kit mide las cajas
// de las columnas y las tarjetas). Usa la aplicación con el Núcleo simulado (pnpm dev). Las demás pruebas de
// la HU están en src/screens/kanban/MoverTarjeta.test.tsx (Vitest).

/** Arrastra con el mouse desde el centro de `desde` hasta el punto indicado, en pasos, como el usuario. */
async function arrastrar(page: Page, desde: Locator, x: number, y: number) {
  const caja = await desde.boundingBox();
  if (!caja) throw new Error('La tarjeta no tiene caja');
  await page.mouse.move(caja.x + caja.width / 2, caja.y + 6);
  await page.mouse.down();
  await page.mouse.move(caja.x + caja.width / 2 + 10, caja.y + 16, { steps: 4 });
  await page.mouse.move(x, y, { steps: 12 });
  // dnd-kit decide sobre qué está el puntero en el siguiente cuadro: un último movimiento y una espera corta
  // antes de soltar, como hace una persona (en la CI, más lenta, soltar al instante no lo alcanzaba).
  await page.mouse.move(x + 1, y + 1);
  await page.waitForTimeout(150);
  await page.mouse.up();
}

async function centroDe(elemento: Locator) {
  const caja = await elemento.boundingBox();
  if (!caja) throw new Error('El elemento no tiene caja');
  return { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 };
}

function columna(page: Page, nombre: string) {
  return page.getByRole('region', { name: nombre });
}

function titulos(page: Page, nombre: string) {
  return columna(page, nombre).locator('.wg-tarjeta__titulo');
}

async function crearTarjeta(page: Page, titulo: string) {
  await page.getByRole('button', { name: 'Nueva tarjeta' }).click();
  await page.getByLabel('Título').fill(titulo);
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  await page.getByRole('textbox', { name: 'Fecha límite' }).fill(fecha);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
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
  for (const titulo of ['Entregar informe', 'Pagar factura', 'Llamar al cliente']) {
    await crearTarjeta(page, titulo);
  }
  await expect(titulos(page, 'Por hacer')).toHaveText([
    'Entregar informe',
    'Pagar factura',
    'Llamar al cliente',
  ]);
});

test('HE-09-HU02-CA01 · Mover una tarjeta a otra columna con drag-and-drop', async ({ page }) => {
  const destino = await centroDe(columna(page, 'En progreso'));
  await arrastrar(
    page,
    page.getByRole('listitem').filter({ hasText: 'Entregar informe' }),
    destino.x,
    destino.y,
  );
  await expect(titulos(page, 'En progreso')).toHaveText(['Entregar informe']);
  await expect(columna(page, 'En progreso').locator('.wg-columna__cantidad')).toHaveText('1');
  await expect(columna(page, 'Por hacer').locator('.wg-columna__cantidad')).toHaveText('2');
});

test('HE-09-HU02-CA04 · Reordenar tarjetas dentro de una columna', async ({ page }) => {
  const primera = await centroDe(page.getByRole('listitem').filter({ hasText: 'Entregar informe' }));
  await arrastrar(
    page,
    page.getByRole('listitem').filter({ hasText: 'Llamar al cliente' }),
    primera.x,
    primera.y,
  );
  await expect(titulos(page, 'Por hacer')).toHaveText([
    'Llamar al cliente',
    'Entregar informe',
    'Pagar factura',
  ]);
});

test('HE-09-HU02-CA05 · Soltar una tarjeta fuera de una columna', async ({ page }) => {
  // RD-74: fuera de las columnas, sobre la fila del interruptor de vista (encima del tablero).
  const boton = await centroDe(page.getByRole('group', { name: 'Vista de las tarjetas' }));
  await arrastrar(
    page,
    page.getByRole('listitem').filter({ hasText: 'Entregar informe' }),
    boton.x - 400,
    boton.y,
  );
  await expect(titulos(page, 'Por hacer')).toHaveText([
    'Entregar informe',
    'Pagar factura',
    'Llamar al cliente',
  ]);
});
