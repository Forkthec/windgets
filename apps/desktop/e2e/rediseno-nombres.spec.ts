import { expect, test, type Locator, type Page } from '@playwright/test';

// P44 · Nombre emergente de los botones (docs/rediseno.md RD-100, IM-03): lo que necesita un navegador real (la
// posición, que nada lo tape ni lo recorte, el foco que deja el puntero y los botones deshabilitados) y que todo
// botón sin texto visible tenga nombre. Los casos de cada componente están en Vitest (NombreEmergente.test.tsx).

const VENTANA = { width: 1200, height: 800 };
const SIN_ELIMINAR_COLUMNA = 'Las columnas por defecto no se pueden eliminar.';

async function entrar(page: Page) {
  await page.setViewportSize(VENTANA);
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sesion', '');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function abrir(page: Page, opcion: string) {
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('button', { name: opcion, exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

const boton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

const nombreEmergente = (page: Page) => page.locator('.wg-nombre-emergente:visible');

async function caja(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('sin caja');
  return b;
}

/** El color que pinta una variable del tema dentro de `raiz`. */
const color = (raiz: Locator, variable: string) =>
  raiz.evaluate((e, v) => {
    const muestra = document.createElement('span');
    muestra.style.color = `var(${v})`;
    e.append(muestra);
    const pintado = getComputedStyle(muestra).color;
    muestra.remove();
    return pintado;
  }, variable);

/** Nada lo tapa ni lo recorta: es lo que se pinta en su centro y junto a sus cuatro esquinas. */
const seVeEntero = (nombre: Locator) =>
  nombre.evaluate((n: HTMLElement) => {
    n.style.pointerEvents = 'auto';
    const r = n.getBoundingClientRect();
    const puntos: [number, number][] = [
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.left + 7, r.top + 7],
      [r.right - 7, r.top + 7],
      [r.left + 7, r.bottom - 7],
      [r.right - 7, r.bottom - 7],
    ];
    const entero = puntos.every(([x, y]) => n.contains(document.elementFromPoint(x, y)));
    n.style.pointerEvents = '';
    return entero;
  });

async function dentroDeLaVentana(nombre: Locator) {
  const c = await caja(nombre);
  expect(c.x).toBeGreaterThanOrEqual(3.5);
  expect(c.x + c.width).toBeLessThanOrEqual(VENTANA.width - 3.5);
  expect(c.y).toBeGreaterThanOrEqual(0);
  expect(c.y + c.height).toBeLessThanOrEqual(VENTANA.height);
}

test('RD-100 · Debajo, a 8 px, centrado y con el estilo de la tinta', async ({ page }) => {
  await entrar(page);
  await abrir(page, 'Calendario');
  const hoy = boton(page, 'Ir a hoy');
  await hoy.hover();
  const nombre = nombreEmergente(page);
  await expect(nombre).toHaveText('Ir a hoy');
  await expect(nombre).toHaveAttribute('data-lado', 'abajo');
  const [b, n] = [await caja(hoy), await caja(nombre)];
  expect(Math.abs(n.y - (b.y + b.height) - 8)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(n.x + n.width / 2 - (b.x + b.width / 2))).toBeLessThanOrEqual(1);
  const raiz = page.locator('body');
  const tinta = await color(raiz, '--wg-tinta');
  await expect(nombre).toHaveCSS('background-color', tinta);
  await expect(nombre).toHaveCSS('color', await color(raiz, '--wg-marco'));
  await expect(nombre).toHaveCSS('font-size', '13px');
  await expect(nombre).toHaveCSS('font-weight', '500');
  await expect(nombre).toHaveCSS('border-radius', '6px');
  await expect(nombre).toHaveCSS('padding', '6px 10px');
  expect(
    await nombre.evaluate((e) => {
      const flecha = getComputedStyle(e, '::before');
      return [flecha.borderBottomWidth, flecha.borderBottomColor];
    }),
  ).toEqual(['6px', tinta]);
  expect(await hoy.getAttribute('title')).toBeNull();
  await page.mouse.move(600, 600);
  await expect(nombre).toHaveCount(0);
});

test('RD-100 · Arriba si no cabe debajo, sin salirse por la derecha', async ({ page }) => {
  await entrar(page);
  const windi = boton(page, 'Windi');
  await windi.hover();
  const nombre = nombreEmergente(page);
  await expect(nombre).toHaveText('Windi');
  await expect(nombre).toHaveAttribute('data-lado', 'arriba');
  const [b, n] = [await caja(windi), await caja(nombre)];
  expect(Math.abs(b.y - (n.y + n.height) - 8)).toBeLessThanOrEqual(0.5);
  await dentroDeLaVentana(nombre);
  expect(await seVeEntero(nombre)).toBe(true);
});

test('RD-100 · Menú contraído: no se sale por la izquierda ni queda detrás del menú', async ({ page }) => {
  await entrar(page);
  await boton(page, 'Ocultar menú').click();
  const opcion = boton(page, 'Planificador diario');
  await opcion.hover();
  const nombre = nombreEmergente(page);
  await expect(nombre).toHaveText('Planificador diario');
  await dentroDeLaVentana(nombre);
  expect(Math.abs((await caja(nombre)).x - 4)).toBeLessThanOrEqual(0.5);
  expect(await seVeEntero(nombre)).toBe(true);
});

test('RD-100 · Se ve sobre la ventana emergente y un solo Esc la sigue cerrando', async ({ page }) => {
  await entrar(page);
  await abrir(page, 'Tablero Kanban');
  await boton(page, 'Nueva columna').click();
  const ventana = page.getByRole('dialog');
  await expect(ventana).toBeVisible();
  await ventana.getByRole('button', { name: 'Cerrar', exact: true }).hover();
  const nombre = nombreEmergente(page);
  await expect(nombre).toHaveText('Cerrar');
  await dentroDeLaVentana(nombre);
  expect(await seVeEntero(nombre)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(ventana).toHaveCount(0);
  await expect(nombre).toHaveCount(0);
});

test('RD-100 · Con el teclado aparece; el clic del puntero no lo deja puesto', async ({ page }) => {
  await entrar(page);
  await abrir(page, 'Calendario');
  const hoy = boton(page, 'Ir a hoy');
  await hoy.click();
  await page.waitForTimeout(600);
  await expect(nombreEmergente(page)).toHaveCount(0);
  await page.mouse.move(600, 600);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(hoy).toBeFocused();
  await expect(nombreEmergente(page)).toHaveText('Ir a hoy');
  await page.keyboard.press('Escape');
  await expect(nombreEmergente(page)).toHaveCount(0);
  await expect(hoy).toBeFocused();
});

test('RD-100 · Una opción deshabilitada muestra su motivo sobre el menú y un solo Esc lo cierra', async ({
  page,
}) => {
  await entrar(page);
  await abrir(page, 'Tablero Kanban');
  await boton(page, 'Acciones de Por hacer').click();
  const eliminar = page.getByRole('menuitem', { name: 'Eliminar' });
  await expect(eliminar).toBeDisabled();
  await expect(eliminar).toHaveAccessibleDescription(SIN_ELIMINAR_COLUMNA);
  await eliminar.hover({ force: true });
  const nombre = nombreEmergente(page);
  await expect(nombre).toHaveText(SIN_ELIMINAR_COLUMNA);
  await expect(page.getByRole('tooltip')).toHaveText(SIN_ELIMINAR_COLUMNA);
  await dentroDeLaVentana(nombre);
  expect(await seVeEntero(nombre)).toBe(true);
  // El clic en el botón deshabilitado también lo oculta.
  await eliminar.click({ force: true });
  await expect(nombre).toHaveCount(0);
  await page.mouse.move(600, 600);
  await eliminar.hover({ force: true });
  await expect(nombre).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(nombre).toHaveCount(0);
});

test('RD-100 · El widget por defecto muestra su motivo y lo conserva como descripción', async ({ page }) => {
  await entrar(page);
  await abrir(page, 'Widgets');
  const motivo = 'Los widgets por defecto no se pueden eliminar. Puedes desactivarlos.';
  const eliminar = boton(page, 'Eliminar').first();
  await expect(eliminar).toBeDisabled();
  await expect(eliminar).toHaveAccessibleDescription(motivo);
  await eliminar.hover({ force: true });
  await expect(nombreEmergente(page)).toHaveText(motivo);
  await dentroDeLaVentana(nombreEmergente(page));
});

test('RD-100 · En las pantallas de cuenta usa los colores de su modo', async ({ page }) => {
  await page.setViewportSize(VENTANA);
  await page.goto('/');
  for (const modo of ['Claro', 'Oscuro']) {
    await page.getByRole('radio', { name: modo }).click();
    await page.mouse.move(0, 0);
    await boton(page, 'Mostrar contraseña').hover();
    const nombre = nombreEmergente(page);
    await expect(nombre).toHaveText('Mostrar contraseña');
    const raiz = page.locator('.wg-cuenta-raiz[data-modo]');
    await expect(nombre).toHaveCSS('background-color', await color(raiz, '--wg-tinta'));
    await expect(nombre).toHaveCSS('color', await color(raiz, '--wg-marco'));
    expect(await seVeEntero(nombre), modo).toBe(true);
    await page.mouse.move(0, 0);
    await expect(nombre).toHaveCount(0);
  }
});

/**
 * Los botones a la vista que no muestran ni una letra ni un número (un ícono o un signo como «×») y no tienen
 * `aria-label`. El texto oculto para la vista (`wg-oculto`) y el dibujado en un ícono no cuentan. Un interruptor
 * toma su nombre de la etiqueta visible que tiene al lado (DUDA: P44, docs/DUDAS.md).
 */
const sinNombre = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('button'))
      .filter((b) => b.checkVisibility({ checkVisibilityCSS: true }))
      .filter((b) => {
        const textos = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
        for (let t = textos.nextNode(); t; t = textos.nextNode()) {
          const padre = t.parentElement;
          if (!padre || padre.closest('svg, .wg-oculto')) continue;
          if (!padre.checkVisibility({ checkVisibilityCSS: true })) continue;
          if (/[\p{L}\p{N}]/u.test(t.textContent ?? '')) return false;
        }
        const conEtiqueta =
          b.getAttribute('role') === 'switch' && Array.from(b.labels).some((l) => l.innerText.trim());
        return !conEtiqueta && !b.getAttribute('aria-label')?.trim();
      })
      .map((b) => b.outerHTML.slice(0, 200)),
  );

test('RD-100 · Todo botón sin texto visible tiene `aria-label`', async ({ page }) => {
  const faltan: string[] = [];
  const revisar = async (donde: string) => {
    for (const html of await sinNombre(page)) faltan.push(`${donde}: ${html}`);
  };
  const cerrarConEsc = async () => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  };

  // Pantallas de cuenta.
  await page.setViewportSize(VENTANA);
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'Inicio de sesión' })).toBeVisible();
  await revisar('Inicio de sesión');
  await page.getByRole('link', { name: 'Regístrate' }).click();
  await expect(page.getByLabel('Alias', { exact: true })).toBeVisible();
  await revisar('Registro');
  await page.goto('/');
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
  await expect(page.getByRole('main', { name: 'Inicio de sesión' })).toHaveCount(0);
  await revisar('Recuperar contraseña');

  await entrar(page);
  await revisar('Planificador diario');

  await abrir(page, 'Tablero Kanban');
  await boton(page, 'Nueva tarjeta').first().click();
  await revisar('Nueva tarjeta');
  await page.getByLabel('Título').fill('Entregar informe');
  const hoy = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  await page
    .getByRole('textbox', { name: 'Fecha límite' })
    .fill(`${dos(hoy.getDate())}/${dos(hoy.getMonth() + 1)}/${hoy.getFullYear()}`);
  await boton(page, 'Guardar').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await revisar('Tablero Kanban');
  await boton(page, 'Acciones de Por hacer').click();
  await revisar('Menú de columna');
  await page.keyboard.press('Escape');
  await page.getByText('Entregar informe').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await revisar('Detalle de tarjeta');
  await cerrarConEsc();
  await boton(page, 'Nueva columna').click();
  await revisar('Nueva columna');
  await cerrarConEsc();
  await boton(page, 'Vista expandida').click();
  await expect(boton(page, 'Vista compacta')).toBeVisible();
  await revisar('Tablero Kanban expandido');
  await boton(page, 'Vista compacta').click();

  await abrir(page, 'Calendario');
  await revisar('Calendario, mes');
  await page.locator('[aria-haspopup="dialog"]').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await revisar('Mes y año');
  await page.keyboard.press('Escape');
  await page.getByText('Entregar informe').first().click();
  await revisar('Panel del día');
  await abrir(page, 'Calendario');
  await boton(page, 'Semana').click();
  await revisar('Calendario, semana');

  await abrir(page, 'Agenda diaria');
  await revisar('Agenda diaria');
  await page.locator('.wg-agenda__fecha button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await revisar('Agenda, elegir un día');
  await page.keyboard.press('Escape');

  await abrir(page, 'Reportes');
  await revisar('Reportes');

  await abrir(page, 'Etiquetas');
  await revisar('Etiquetas');
  await boton(page, 'Nueva etiqueta').click();
  await revisar('Nueva etiqueta');
  await cerrarConEsc();

  await abrir(page, 'Temas');
  await revisar('Temas');
  await abrir(page, 'Widgets');
  await revisar('Widgets');
  await boton(page, 'Agregar widget').click();
  await revisar('Agregar widget');
  await abrir(page, 'Configuración');
  await revisar('Configuración');

  await boton(page, 'Windi').click();
  await revisar('Panel de Windi');
  await page.getByRole('complementary', { name: 'Windi' }).getByRole('button', { name: 'Cerrar' }).click();
  await boton(page, 'Ocultar menú').click();
  await revisar('Menú contraído');
  // Wallpaper va al final: la pantalla ocupa la ventana, sin el menú principal.
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('button', { name: 'Wallpaper', exact: true })
    .click();
  await expect(page.getByRole('region', { name: 'Vista previa del escritorio' })).toBeVisible();
  await revisar('Wallpaper');
  for (const seccion of ['Imagen de fondo', 'Colores', 'Tipografía', 'Paletas']) {
    await boton(page, seccion).click();
    await revisar(`Wallpaper, ${seccion}`);
  }
  await boton(page, 'Guardar como tema').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await revisar('Guardar como tema');

  expect(faltan).toEqual([]);
});
