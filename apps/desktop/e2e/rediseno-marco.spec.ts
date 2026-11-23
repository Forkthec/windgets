import { expect, test, type Locator, type Page } from '@playwright/test';

// P30 · Rediseño de la ventana principal con sesión (docs/rediseno.md RD-28 a RD-36). La composición se fija con la
// geometría de los marcos del Figma «Windgets (Copy)» (KP2qmNWNT55KMceQI8hFGu) a ±2 px (regla 11), en un navegador
// real con el Núcleo simulado (src/ipc/simulado.ts).

const TOLERANCIA = 2;

async function entrar(page: Page, ancho = 1360, alto = 890) {
  await page.setViewportSize({ width: ancho, height: alto });
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña').fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-modo', /claro|oscuro/);
}

async function claro(page: Page) {
  await page.getByRole('radio', { name: 'Claro' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-modo', 'claro');
}

const menu = (page: Page) => page.getByRole('navigation', { name: 'Menú principal' });

async function abrir(page: Page, opcion: string) {
  await menu(page).getByRole('button', { name: opcion, exact: true }).click();
}

async function caja(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('sin caja');
  return b;
}

/** Compara la caja con el marco: [x, y, ancho, alto]; `null` no se compara. */
async function esperarCaja(l: Locator, esperado: Array<number | null>) {
  const b = await caja(l);
  const medido = [b.x, b.y, b.width, b.height];
  esperado.forEach((valor, i) => {
    if (valor !== null)
      expect(Math.abs((medido[i] ?? 0) - valor), `${i}: ${medido[i]} ≠ ${valor}`).toBeLessThanOrEqual(
        TOLERANCIA,
      );
  });
}

async function fondo(l: Locator) {
  return l.evaluate((e) => getComputedStyle(e).backgroundColor);
}

const sinScrollHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('RD-28, RD-29 · El selector cambia la paleta del tema y la ventana toma los colores del modo', async ({
  page,
}) => {
  await entrar(page);
  // El simulado empieza con la plantilla por defecto, de fondo oscuro (81:45: #1C1922, menú #2B2534).
  await expect(page.locator('body')).toHaveAttribute('data-modo', 'oscuro');
  expect(await fondo(page.locator('.wg-ventana-principal'))).toBe('rgb(28, 25, 34)');
  expect(await fondo(page.locator('.wg-menu'))).toBe('rgb(43, 37, 52)');
  await claro(page);
  // 81:2: fondo #F7F4FB, menú y tarjeta #FFFFFF, opción actual #EDE2FF.
  expect(await fondo(page.locator('.wg-ventana-principal'))).toBe('rgb(247, 244, 251)');
  expect(await fondo(page.locator('.wg-menu'))).toBe('rgb(255, 255, 255)');
  expect(await fondo(page.locator('.wg-ventana-principal__pantalla'))).toBe('rgb(255, 255, 255)');
  expect(await fondo(menu(page).getByRole('button', { name: 'Planificador diario' }))).toBe(
    'rgb(237, 226, 255)',
  );
});

test('RD-30, RD-32 · Menú y encabezado a la medida de 81:2 (1360 × 890)', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await esperarCaja(page.locator('.wg-menu'), [0, 0, 248, 890]);
  await esperarCaja(page.locator('.wg-menu__simbolo'), [22, 32, 42, 38]);
  await esperarCaja(page.getByRole('button', { name: 'Ocultar menú' }), [194, 82, 40, 36]);
  // 81:5 «Actual» y las opciones cada 54 px (81:6 en y = 132, 81:7 en 186).
  const opciones = menu(page).getByRole('button');
  await esperarCaja(opciones.nth(0), [12, 123, 220, 40]);
  await esperarCaja(opciones.nth(1), [12, 177, 220, 40]);
  await esperarCaja(opciones.nth(10), [12, 663, 220, 40]);
  await esperarCaja(opciones.nth(0).locator('svg'), [19, 132, 18, 18]);
  // 81:17 sección (y = 44), 81:18 título (y = 82, 43 px) y 81:21 tarjeta.
  await esperarCaja(page.locator('.wg-encabezado-pantalla__seccion'), [300, 44, null, 19]);
  await esperarCaja(page.getByRole('heading', { level: 1 }), [300, 82, null, 51]);
  await esperarCaja(page.locator('.wg-ventana-principal__pantalla'), [300, 174, 990, 620]);
  // 81:19: el selector termina a 70 px del borde derecho.
  const selector = await caja(page.getByRole('radiogroup', { name: 'Apariencia' }));
  expect(Math.abs(selector.x + selector.width - 1290)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(selector.y - 47)).toBeLessThanOrEqual(TOLERANCIA);
});

test('RD-31 · Sin menú, el encabezado y la tarjeta empiezan en x = 180 (85:332)', async ({ page }) => {
  await entrar(page);
  await page.getByRole('button', { name: 'Ocultar menú' }).click();
  await expect(menu(page)).toHaveCount(0);
  await esperarCaja(page.getByRole('button', { name: 'Ampliar menú' }), [20, 32, 44, 44]);
  await esperarCaja(page.getByRole('heading', { level: 1 }), [180, 82, null, null]);
  await esperarCaja(page.locator('.wg-ventana-principal__pantalla'), [180, 174, 1110, 620]);
  await page.getByRole('button', { name: 'Ampliar menú' }).click();
  await expect(menu(page)).toBeVisible();
});

test('RD-33, RD-35 · Widgets a la medida de 81:109', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await abrir(page, 'Widgets');
  const lista = page.getByRole('list', { name: 'Lista de widgets' });
  await esperarCaja(page.getByRole('button', { name: 'Agregar widget' }), [332, 206, null, 44]);
  const nombres = lista.locator('.wg-lista__nombre');
  await esperarCaja(nombres.nth(0), [332, 314, null, null]);
  await esperarCaja(nombres.nth(1), [332, 446, null, null]);
  await esperarCaja(lista.locator('.wg-lista-widgets__descripcion').nth(0), [332, 353, null, null]);
  // 81:117 interruptor de 48 × 25 en (910, 317) y 81:119 «Eliminar» en x = 1135.
  await esperarCaja(lista.getByRole('switch').nth(0), [910, 317, 48, 25]);
  await esperarCaja(lista.getByRole('button', { name: 'Eliminar' }).nth(0), [1135, null, null, null]);
  await expect(lista.getByText('Widget por defecto').first()).toBeVisible();
});

test('RD-34 · Confirmación a la medida de 85:2', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await abrir(page, 'Configuración');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Cerrar sesión' });
  const d = await caja(dialogo);
  expect(Math.abs(d.width - 800)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(d.height - 250)).toBeLessThanOrEqual(TOLERANCIA);
  expect(await fondo(dialogo)).toBe('rgb(247, 244, 251)');
  const pregunta = await caja(dialogo.getByText('¿Deseas cerrar sesión?'));
  expect(Math.abs(pregunta.x - d.x - 28)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(pregunta.y - d.y - 32)).toBeLessThanOrEqual(TOLERANCIA);
  // 85:128 la principal en (28, 169) y 45 px de alto; la de salir a su derecha.
  const principal = await caja(dialogo.getByRole('button', { name: 'Cerrar sesión' }));
  const salir = await caja(dialogo.getByRole('button', { name: 'Cancelar' }));
  expect(Math.abs(principal.x - d.x - 28)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(principal.y - d.y - 169)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(principal.height - 45)).toBeLessThanOrEqual(TOLERANCIA);
  expect(salir.x).toBeGreaterThan(principal.x + principal.width);
  // Sin título visible: queda solo para los lectores de pantalla (1 × 1 px).
  const titulo = await caja(dialogo.getByRole('heading', { name: 'Cerrar sesión' }));
  expect(titulo.width * titulo.height).toBeLessThanOrEqual(1);
});

test('RD-36 · Agente de IA: Windi, «Windi» a 18 px y la caja de 134 px', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await abrir(page, 'Agente de IA');
  await expect(page.getByRole('heading', { level: 1, name: 'Windi' })).toBeVisible();
  const ilustracion = await caja(page.locator('.wg-windi__ilustracion').first());
  expect(Math.abs(ilustracion.width - 77)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(ilustracion.height - 48)).toBeLessThanOrEqual(TOLERANCIA);
  const autor = await caja(page.locator('.wg-windi__autor').first());
  expect(Math.abs(autor.x - (ilustracion.x + 77 + 18))).toBeLessThanOrEqual(TOLERANCIA);
  const escribir = page.locator('.wg-windi__escribir');
  await esperarCaja(escribir, [332, null, 926, 134]);
  await esperarCaja(escribir.getByRole('button', { name: 'Enviar' }), [null, null, 106, 40]);
  // La caja queda dentro de la tarjeta, abajo.
  const tarjeta = await caja(page.locator('.wg-ventana-principal__pantalla'));
  const c = await caja(escribir);
  expect(Math.abs(tarjeta.y + tarjeta.height - 32 - (c.y + c.height))).toBeLessThanOrEqual(TOLERANCIA);
});

for (const [ancho, alto] of [
  [1200, 800],
  [1000, 800],
  [999, 800],
  [960, 600],
  // Zoom de 125 % sobre la ventana mínima (regla 4).
  [768, 480],
]) {
  test(`RD-32 · A ${ancho} × ${alto} no hay scroll horizontal y todo se alcanza`, async ({ page }) => {
    await entrar(page, ancho, alto);
    expect(await sinScrollHorizontal(page)).toBe(true);
    for (const opcion of ['Widgets', 'Agente de IA', 'Configuración']) {
      await abrir(page, opcion);
      expect(await sinScrollHorizontal(page)).toBe(true);
      const tarjeta = await caja(page.locator('.wg-ventana-principal__pantalla'));
      expect(tarjeta.x + tarjeta.width).toBeLessThanOrEqual(ancho);
      expect(tarjeta.height).toBeGreaterThan(100);
    }
    // El selector no se monta sobre el título.
    const selector = await caja(page.getByRole('radiogroup', { name: 'Apariencia' }));
    expect(selector.x + selector.width).toBeLessThanOrEqual(ancho);
  });
}

test('RD-33 · Foco visible en el menú y en los botones', async ({ page }) => {
  await entrar(page);
  await claro(page);
  const opcion = menu(page).getByRole('button', { name: 'Tablero Kanban' });
  await opcion.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const contorno = await opcion.evaluate((e) => getComputedStyle(e).outlineStyle);
  expect(contorno).toBe('solid');
});
