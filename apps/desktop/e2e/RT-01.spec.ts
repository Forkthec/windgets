import { expect, test } from '@playwright/test';

// RT-01 · Ventana principal con el menú principal a la izquierda. En la prueba manual del 22-nov (P26), en Agente de
// IA y en Personalización del wallpaper se desplazaba toda la página, incluido el menú principal. Lo que se mide aquí
// (alto del documento y posición del menú) necesita un navegador real. Usa la aplicación con el Núcleo simulado.

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña').fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
});

// docs/rediseno.md RD-30: la opción de Personalización del wallpaper dice «Wallpaper». RD-70: Windi ya no es una pantalla
// (su panel tiene su propia prueba en rediseno-marco.spec.ts).
for (const pantalla of ['Wallpaper']) {
  test(`RT-01 · En ${pantalla} solo se desplaza la pantalla, no el menú principal`, async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Menú principal' });
    await menu.getByRole('button', { name: pantalla }).click();
    // docs/rediseno.md RD-42: Wallpaper ocupa la ventana; «Personalización» vuelve a mostrar el menú.
    if (pantalla === 'Wallpaper') await page.getByRole('button', { name: 'Personalización' }).click();
    await expect(menu.getByRole('button', { name: pantalla })).toHaveAttribute('aria-current', 'page');
    // La página no tiene desplazamiento propio: el documento mide lo mismo que la ventana.
    const { documento, ventana } = await page.evaluate(() => ({
      documento: document.documentElement.scrollHeight,
      ventana: window.innerHeight,
    }));
    expect(documento).toBeLessThanOrEqual(ventana);
    // Al girar la rueda sobre la pantalla, el menú principal no se mueve.
    const antes = await menu.boundingBox();
    const panel = page.locator('.wg-ventana-principal__pantalla');
    await panel.hover();
    await page.mouse.wheel(0, 2000);
    await expect.poll(async () => (await menu.boundingBox())?.y).toBe(antes?.y);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
}
