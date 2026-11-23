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

test('RD-37 · Planificador diario a la medida de 81:21', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await page.getByRole('button', { name: 'Nueva tarjeta' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Revisar los bocetos');
  await page.getByRole('button', { name: 'Guardar' }).click();
  const fila = page.getByRole('list', { name: 'Tarjetas de hoy' }).getByRole('listitem').first();
  await expect(fila).toBeVisible();
  // 81:22 la fecha en (330, 206) y 81:23 «Nueva tarjeta» en y = 203, terminando en x = 1257.
  await esperarCaja(page.locator('.wg-planificador__fecha'), [330, 206, null, null]);
  const nueva = await caja(page.getByRole('button', { name: 'Nueva tarjeta' }));
  expect(Math.abs(nueva.y - 203)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(nueva.x + nueva.width - 1257)).toBeLessThanOrEqual(TOLERANCIA);
  // 81:25 «Completadas» en y = 282 y 81:26 la barra de 8 px en y = 325.
  await esperarCaja(page.getByText('Completadas: 0 de 1'), [330, 282, null, null]);
  await esperarCaja(page.getByRole('progressbar', { name: 'Avance del día' }), [330, 325, 925, 8]);
  // 81:28 la casilla de 22 × 22 en (330, 398), 81:31 la hora en x = 382 y 81:32 el título en (502, 394).
  await esperarCaja(fila.getByRole('checkbox'), [330, 398, 22, 22]);
  await esperarCaja(fila.locator('.wg-planificador__hora'), [382, null, null, null]);
  await esperarCaja(fila.locator('.wg-tarjeta__titulo'), [502, 394, null, null]);
});

test('RD-41 · Configuración a la medida de 81:199', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await abrir(page, 'Configuración');
  // 81:201 el interruptor de 58 × 30 en (1178, 225); 81:203 el divisor en y = 309; 81:205 «Cerrar sesión» termina
  // en x = 1237 con y = 350.
  await esperarCaja(page.getByRole('switch', { name: 'Inicio automático' }), [1178, 225, 58, 30]);
  await esperarCaja(page.locator('.wg-configuracion__divisor'), [332, 309, 922, 1]);
  const cerrar = await caja(page.getByRole('button', { name: 'Cerrar sesión' }));
  expect(Math.abs(cerrar.x + cerrar.width - 1237)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(cerrar.y - 350)).toBeLessThanOrEqual(TOLERANCIA);
  await esperarCaja(page.getByRole('heading', { level: 2, name: 'Sesión' }), [332, null, null, null]);
});

test('RD-42 a RD-46 · Personalización del wallpaper a la medida de 91:1638 (1360 × 850)', async ({
  page,
}) => {
  await entrar(page, 1360, 850);
  await claro(page);
  await abrir(page, 'Wallpaper');
  await expect(menu(page)).toHaveCount(0);
  // 91:1639 «windgets» en (38, 22) y 91:1640 «Personalización» en x = 220.
  await esperarCaja(page.locator('.wg-cabecera-completa__marca'), [38, 22, null, null]);
  await esperarCaja(page.getByRole('button', { name: 'Personalización' }), [220, null, null, null]);
  // 91:1642 título en (42, 92), 91:1643 subtítulo en (43, 146) y 91:1644 «Tema en edición» de 317 × 68 en (1000, 89).
  await esperarCaja(page.getByRole('heading', { level: 1 }), [42, 92, null, null]);
  await esperarCaja(page.locator('.wg-wallpaper__subtitulo'), [43, 146, null, null]);
  await esperarCaja(page.locator('.wg-wallpaper__tema'), [1000, 89, 317, 68]);
  // 91:1647 en y = 216, 91:1648 el monitor de 774 × 422 en (42, 257) y 91:1670 el pie de 220 × 9 en (317, 680).
  await esperarCaja(page.getByRole('heading', { level: 2, name: /^Vista previa de / }), [
    43,
    216,
    null,
    null,
  ]);
  await esperarCaja(page.locator('.wg-wallpaper__monitor'), [42, 257, 774, 422]);
  await esperarCaja(page.locator('.wg-wallpaper__pie'), [317, 680, 220, 9]);
  // 91:1671 el inspector de 469 × 524 en (848, 201) y 91:1672 el encabezado de 445 × 39 en (860, 213).
  await esperarCaja(page.locator('.wg-wallpaper__inspector'), [848, 201, 469, 524]);
  await esperarCaja(page.getByRole('button', { name: 'Plantillas' }), [860, 213, 445, 39]);
  // 91:1711 la barra de 1275 × 69 en (42, 751).
  await esperarCaja(page.locator('.wg-wallpaper__acciones'), [42, 751, 1275, 69]);
  // Cabe en la ventana sin desplazarse.
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(850);
  expect(await sinScrollHorizontal(page)).toBe(true);
  // «Personalización» vuelve al marco con el menú.
  await page.getByRole('button', { name: 'Personalización' }).click();
  await expect(menu(page).getByRole('button', { name: 'Wallpaper' })).toHaveAttribute('aria-current', 'page');
});

for (const [ancho, alto] of [
  [1200, 800],
  [999, 800],
  [768, 480],
]) {
  test(`RD-42 · Wallpaper a ${ancho} × ${alto} sin scroll horizontal`, async ({ page }) => {
    await entrar(page, ancho, alto);
    await abrir(page, 'Wallpaper');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Personalización del wallpaper' }),
    ).toBeVisible();
    expect(await sinScrollHorizontal(page)).toBe(true);
    await expect(page.getByRole('button', { name: 'Aplicar' })).toBeVisible();
  });
}

test('RD-47, RD-48 · Tablero Kanban a la medida de 84:85', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await abrir(page, 'Tablero Kanban');
  await page.getByRole('button', { name: 'Nueva tarjeta' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Revisar los bocetos');
  await page.getByLabel('Fecha límite', { exact: true }).fill('27/11/2026');
  await page.getByRole('button', { name: 'Guardar' }).click();
  // 93:2 «Nueva tarjeta»: 40 px de alto, en la esquina de la tarjeta de la pantalla.
  await esperarCaja(page.getByRole('button', { name: 'Nueva tarjeta' }), [332, 206, null, 40]);
  // 93:6 la columna de 274 px; 93:17 la siguiente a 12 px.
  const columnas = page.locator('.wg-kanban .wg-columna');
  const primera = await caja(columnas.nth(0));
  const segunda = await caja(columnas.nth(1));
  expect(Math.abs(primera.width - 274)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(segunda.x - (primera.x + 274 + 12))).toBeLessThanOrEqual(TOLERANCIA);
  // 93:9 la tarjeta de 252 px, a 11 px del borde de la columna.
  const tarjeta = await caja(page.locator('.wg-kanban__tarjeta').first());
  expect(Math.abs(tarjeta.width - 252)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(tarjeta.x - primera.x - 11)).toBeLessThanOrEqual(TOLERANCIA);
  await expect(page.locator('.wg-kanban__tarjeta').first().getByText('27 nov')).toBeVisible();
  expect(await sinScrollHorizontal(page)).toBe(true);
});

test('RD-52 · Agenda diaria a la medida de 84:361', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await abrir(page, 'Agenda diaria');
  // 93:39 a 93:43: los botones de 40 px a la derecha de la fecha.
  for (const nombre of ['Día anterior', 'Hoy', 'Día siguiente']) {
    await esperarCaja(page.getByRole('button', { name: nombre, exact: true }), [null, null, null, 40]);
  }
  const siguiente = await caja(page.getByRole('button', { name: 'Día siguiente' }));
  expect(Math.abs(siguiente.x + siguiente.width - 1258)).toBeLessThanOrEqual(TOLERANCIA);
  // 93:61 «Tarjetas sin horario» de 371 px, alineada a la derecha de la tarjeta.
  const panel = await caja(page.getByRole('region', { name: 'Tarjetas sin horario' }));
  expect(Math.abs(panel.width - 371)).toBeLessThanOrEqual(TOLERANCIA);
  expect(Math.abs(panel.x + panel.width - 1258)).toBeLessThanOrEqual(TOLERANCIA);
  // 93:45: un bloque cada 65 px.
  const nueve = await caja(page.getByRole('region', { name: '09:00 – 10:00' }));
  const diez = await caja(page.getByRole('region', { name: '10:00 – 11:00' }));
  expect(Math.abs(diez.y - nueve.y - 65)).toBeLessThanOrEqual(TOLERANCIA);
  expect(await sinScrollHorizontal(page)).toBe(true);
});

test('RD-53 · Calendario: días abreviados y «Hoy», «Mes», «Semana» abajo', async ({ page }) => {
  await entrar(page);
  await claro(page);
  await abrir(page, 'Calendario');
  await expect(page.getByRole('columnheader').first()).toHaveText('Lun');
  const hoy = await caja(page.getByRole('button', { name: 'Hoy' }));
  const tabla = await caja(page.getByRole('table'));
  expect(hoy.y).toBeGreaterThan(tabla.y + tabla.height);
  expect(await sinScrollHorizontal(page)).toBe(true);
});
