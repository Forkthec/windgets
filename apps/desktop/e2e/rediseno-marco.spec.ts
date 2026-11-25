import { expect, test, type Locator, type Page } from '@playwright/test';

// P39 · Marco de la ventana principal del rediseño final (docs/rediseno.md RD-62 a RD-69;
// docs/rediseno_final_prototipos.md §3.1 y §4). Reemplaza las medidas del Figma anterior (RD-28 a RD-36), que esas
// decisiones dejan sin efecto. Se verifica en el tamaño de referencia: 1366 × 768 a 125 % de escala de Windows, con un
// área útil de ≈ 1093 × 560 px, y también a 1920 × 1080. Navegador real con el Núcleo simulado (src/ipc/simulado.ts).

const TOLERANCIA = 2;
const REFERENCIA = { width: 1093, height: 560 };

async function entrar(page: Page, tamano = REFERENCIA) {
  await page.setViewportSize(tamano);
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sesion', '');
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

const cerca = (medido: number, esperado: number) =>
  expect(Math.abs(medido - esperado), `${medido} ≠ ${esperado}`).toBeLessThanOrEqual(TOLERANCIA);

/** Sin scroll de página: el documento no es más alto ni más ancho que la ventana (§3.1). */
const sinScrollDePagina = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollHeight <= window.innerHeight &&
      document.documentElement.scrollWidth <= window.innerWidth,
  );

const estilo = (l: Locator, propiedad: string) =>
  l.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), propiedad);

test('RD-62 · Con sesión no hay selector Claro/Oscuro y la opción actual usa la acción del tema', async ({
  page,
}) => {
  await entrar(page);
  await expect(page.getByRole('radiogroup', { name: 'Apariencia' })).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveAttribute('data-modo', /.+/);
  const accion = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--wg-accion').trim(),
  );
  const actual = menu(page).getByRole('button', { name: 'Planificador diario' });
  const fondo = await estilo(actual, 'background-color');
  // El fondo de la opción actual es el color de acción del tema (no el cian de marca #00D9E2).
  const rgb = await page.evaluate((hex) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  }, accion);
  expect(fondo).toBe(rgb);
  expect(fondo).not.toBe('rgb(0, 217, 226)');
});

test('RD-65, RD-68 · Menú de 212 px en dos bloques, opciones de 32 px y sin scroll', async ({ page }) => {
  await entrar(page);
  const lateral = page.locator('.wg-menu');
  cerca((await caja(lateral)).width, 212);
  cerca((await caja(menu(page).getByRole('button', { name: 'Tablero Kanban' }))).height, 32);
  // El menú completo cabe: Configuración y «Cerrar sesión» se ven sin scroll (ni vertical ni horizontal).
  await expect(menu(page).getByRole('button', { name: 'Configuración' })).toBeInViewport();
  await expect(menu(page).getByRole('button', { name: 'Cerrar sesión' })).toBeInViewport();
  expect(
    await lateral.evaluate((e) => e.scrollHeight <= e.clientHeight && e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  // El botón de contraer va al lado del logo, en la misma fila.
  const ocultar = await caja(page.getByRole('button', { name: 'Ocultar menú' }));
  const logo = await caja(page.locator('.wg-menu__simbolo'));
  expect(Math.abs(ocultar.y + ocultar.height / 2 - (logo.y + logo.height / 2))).toBeLessThanOrEqual(4);
  cerca(ocultar.width, 36);
});

test('RD-65 · Contraído, el menú mide 56 px con solo los íconos y se recuerda al volver a entrar', async ({
  page,
}) => {
  await entrar(page);
  await page.getByRole('button', { name: 'Ocultar menú' }).click();
  cerca((await caja(page.locator('.wg-menu'))).width, 56);
  await expect(menu(page).getByRole('button', { name: 'Tablero Kanban' })).toHaveText('');
  await expect(page.getByRole('button', { name: 'Ampliar menú' })).toBeVisible();
  await page.getByRole('button', { name: 'Ampliar menú' }).click();
  cerca((await caja(page.locator('.wg-menu'))).width, 212);
});

test('RD-66 · Miga de pan de 13 px, título de 26 px y márgenes de 24 px', async ({ page }) => {
  await entrar(page);
  await abrir(page, 'Tablero Kanban');
  const miga = page.locator('.wg-encabezado-pantalla__seccion');
  await expect(miga).toHaveText('Planificador › Tablero Kanban');
  expect(await estilo(miga, 'font-size')).toBe('13px');
  const titulo = page.getByRole('heading', { level: 1 });
  expect(await estilo(titulo, 'font-size')).toBe('26px');
  cerca((await caja(titulo)).x, 212 + 24);
  const tarjeta = await caja(page.locator('.wg-ventana-principal__pantalla'));
  cerca(tarjeta.x + tarjeta.width, REFERENCIA.width - 24);
  await abrir(page, 'Configuración');
  await expect(miga).toHaveText('Configuración');
});

test('RD-68 · Ninguna pantalla del menú hace scroll de página a 1093 × 560', async ({ page }) => {
  await entrar(page);
  for (const opcion of [
    'Planificador diario',
    'Tablero Kanban',
    'Calendario',
    'Agenda diaria',
    'Reportes',
    'Etiquetas',
    'Temas',
    'Widgets',
    'Configuración',
  ]) {
    await abrir(page, opcion);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await sinScrollDePagina(page), opcion).toBe(true);
  }
});

// RD-99 reemplaza la altura de RD-68: 36 px.
test('RD-68, RD-99 · Botones de 36 px con texto de 14 px', async ({ page }) => {
  await entrar(page);
  await abrir(page, 'Widgets');
  const agregar = page.getByRole('button', { name: 'Agregar widget' });
  cerca((await caja(agregar)).height, 36);
  expect(await estilo(agregar, 'font-size')).toBe('14px');
});

test('RD-68 · A 1920 × 1080 tampoco hay scroll de página', async ({ page }) => {
  await entrar(page, { width: 1920, height: 1080 });
  await abrir(page, 'Tablero Kanban');
  expect(await sinScrollDePagina(page)).toBe(true);
});

test('RD-33 · Foco visible en el menú y en los botones', async ({ page }) => {
  await entrar(page);
  const opcion = menu(page).getByRole('button', { name: 'Tablero Kanban' });
  await opcion.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const contorno = await opcion.evaluate((e) => getComputedStyle(e).outlineStyle);
  expect(contorno).toBe('solid');
});

test('RD-69 · Ctrl + rueda no cambia el zoom de la página', async ({ page }) => {
  await entrar(page);
  const cancelado = await page.evaluate(() => {
    const evento = new WheelEvent('wheel', { ctrlKey: true, cancelable: true });
    window.dispatchEvent(evento);
    return evento.defaultPrevented;
  });
  expect(cancelado).toBe(true);
});

test('RD-53 · Calendario: días abreviados', async ({ page }) => {
  await entrar(page);
  await abrir(page, 'Calendario');
  await expect(page.getByRole('columnheader').first()).toHaveText('Lun');
});

test('RD-57 · La conversación con Windi baja sola hasta el último mensaje', async ({ page }) => {
  await entrar(page, { width: 1200, height: 800 });
  // RD-70: Windi se abre con su botón flotante, en el panel lateral.
  await page.getByRole('button', { name: 'Windi', exact: true }).click();
  const campo = page.getByPlaceholder('Escribe un mensaje');
  const lista = page.getByRole('list', { name: 'Conversación' });
  for (let i = 1; i <= 20; i += 1) {
    await campo.fill(`Mensaje número ${i} para llenar la conversación`);
    await campo.press('Enter');
    await expect(lista.getByText(`Mensaje número ${i} para llenar la conversación`)).toBeVisible();
  }
  // El final de la conversación queda a la vista.
  await expect
    .poll(() => lista.evaluate((e) => e.scrollHeight - e.scrollTop - e.clientHeight))
    .toBeLessThanOrEqual(2);
  expect(await lista.evaluate((e) => e.scrollHeight > e.clientHeight)).toBe(true);
});

test('RD-70 · El botón flotante abre el panel de Windi de 360 px sin cambiar la pantalla; × y Esc lo cierran', async ({
  page,
}) => {
  await entrar(page);
  await abrir(page, 'Tablero Kanban');
  const flotante = page.getByRole('button', { name: 'Windi', exact: true });
  const b = await caja(flotante);
  cerca(b.width, 40);
  cerca(b.x + b.width, REFERENCIA.width - 16);
  await flotante.click();
  const panel = page.getByRole('complementary', { name: 'Windi' });
  await expect(panel).toBeVisible();
  const p = await caja(panel);
  cerca(p.width, 360);
  cerca(p.height, REFERENCIA.height);
  // La pantalla y la miga no cambian.
  await expect(page.locator('.wg-encabezado-pantalla__seccion')).toHaveText('Planificador › Tablero Kanban');
  await panel.getByRole('button', { name: 'Cerrar' }).click();
  await expect(panel).toBeHidden();
  await flotante.click();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});
