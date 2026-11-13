import { expect, test, type Locator } from '@playwright/test';

// RT-04 · Mensajes, opciones deshabilitadas y alineación: lo que necesita el diseño real del navegador.
// Las demás pruebas de RT-04 están en src/reglas/RT-04.test.tsx (Vitest).

async function centroVertical(elemento: Locator): Promise<number> {
  const caja = await elemento.boundingBox();
  if (!caja) throw new Error('El elemento no tiene caja');
  return caja.y + caja.height / 2;
}

test('RT-04-CA11 · Alineación vertical centrada', async ({ page }) => {
  await page.goto('/e2e/pantallas/rt.html?caso=alineacion');
  for (const titulo of ['Leer el capítulo 3', 'Preparar la exposición']) {
    const casilla = page.getByRole('checkbox', { name: titulo });
    const texto = page.getByText(titulo, { exact: true });
    const diferencia = Math.abs((await centroVertical(casilla)) - (await centroVertical(texto)));
    expect(diferencia).toBeLessThanOrEqual(1);
  }
});

test('RT-04-ET01 · Mensaje de resultado en la esquina inferior derecha', async ({ page }) => {
  await page.goto('/e2e/pantallas/rt.html?caso=resultado');
  await page.getByRole('button', { name: 'Guardar' }).click();
  const mensaje = page.getByRole('status');
  await expect(mensaje).toContainText('Tarjeta creada.');
  const caja = await mensaje.boundingBox();
  const ventana = page.viewportSize();
  if (!caja || !ventana) throw new Error('Sin medidas');
  // Pegado a la esquina inferior derecha, con el margen de la biblioteca (4 unidades de 4 px).
  expect(ventana.width - (caja.x + caja.width)).toBeLessThanOrEqual(24);
  expect(ventana.height - (caja.y + caja.height)).toBeLessThanOrEqual(24);
  // No bloquea: el botón de la pantalla sigue respondiendo con el mensaje visible.
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(mensaje).toBeVisible();
});
