import { expect, test, type Page } from '@playwright/test';

// F6-04a · Prueba en vivo de animaciones (docs/implementacion/ANIMACIONES.md §7, «Prueba en vivo»). Arnés: recorre
// todos los elementos de la pantalla principal y lee su estilo calculado, con y sin reduced-motion, en 1200×800 y
// 960×600. Las comprobaciones de cada A-nn (abrir la ventana, el menú, el aviso…) las agrega su pieza AN-nn.
//
// Igual que la prueba global (src/ui/tema/movimiento.test.ts), exige que los hallazgos sean exactamente los de
// PENDIENTES; TK-06v la cierra con la lista vacía.

const TAMANOS = [
  { width: 1200, height: 800 },
  { width: 960, height: 600 },
];
// Duraciones permitidas en segundos (§7): 0, instante, corto, medio. Los lazos (giro 1 s, parpadeo 1,2 s) aparte.
const PERMITIDAS = [0, 0.1, 0.15, 0.2];
const LAZOS = [1, 1.2];

async function entrar(page: Page) {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sesion', '');
}

interface Movimiento {
  elemento: string;
  propiedades: string;
  duraciones: number[];
  animacion: string;
  duracionAnimacion: number[];
}

/** El estilo de movimiento de cada elemento que se mueve (transición de más de 0 s o una animación). */
function leerMovimiento(page: Page): Promise<Movimiento[]> {
  return page.evaluate(() => {
    const segundos = (v: string) => v.split(',').map((t) => parseFloat(t));
    const nombre = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.classList.length ? '.' + [...el.classList].join('.') : ''}`;
    return [...document.querySelectorAll('*')]
      .map((el) => ({ el, s: getComputedStyle(el) }))
      .filter(({ s }) => segundos(s.transitionDuration).some((t) => t > 0) || s.animationName !== 'none')
      .map(({ el, s }) => ({
        elemento: nombre(el),
        propiedades: s.transitionProperty,
        duraciones: segundos(s.transitionDuration),
        animacion: s.animationName,
        duracionAnimacion: segundos(s.animationDuration),
      }));
  });
}

const cerca = (t: number, lista: number[]) => lista.some((p) => Math.abs(p - t) < 0.001);

function hallazgos(movimientos: Movimiento[], reduce: boolean): string[] {
  const salida = new Set<string>();
  for (const m of movimientos) {
    if (m.duraciones.some((t) => t > 0) && m.propiedades.split(',').some((p) => p.trim() === 'all'))
      salida.add(`transition all: ${m.elemento}`);
    for (const t of m.duraciones)
      if (!cerca(t, reduce ? [0, 0.1] : PERMITIDAS)) salida.add(`duración ${t}s: ${m.elemento}`);
    if (m.animacion !== 'none') {
      if (reduce) salida.add(`animación con reduced-motion: ${m.animacion} en ${m.elemento}`);
      for (const t of m.duracionAnimacion)
        if (!cerca(t, [...PERMITIDAS, ...LAZOS]))
          salida.add(`animación ${t}s: ${m.animacion} en ${m.elemento}`);
    }
  }
  return [...salida];
}

// Lo que falta el 27-nov-2026 en la pantalla principal; lo cierran TK-06 y AN-01 a AN-07.
const PENDIENTES: Record<'no-preference' | 'reduce', string[]> = { 'no-preference': [], reduce: [] };

for (const tamano of TAMANOS)
  for (const reducedMotion of ['no-preference', 'reduce'] as const)
    test(`F6-04a · movimiento de la pantalla principal (${tamano.width}×${tamano.height}, ${reducedMotion})`, async ({
      page,
    }) => {
      await page.setViewportSize(tamano);
      await page.emulateMedia({ reducedMotion });
      await entrar(page);
      const movimientos = await leerMovimiento(page);
      expect(hallazgos(movimientos, reducedMotion === 'reduce').sort()).toEqual(
        [...PENDIENTES[reducedMotion]].sort(),
      );
    });

// AN-06 · A-36: el texto del indicador de sincronización entra con un fundido de opacidad de 150 ms (100 ms con
// «reducir movimiento»).
for (const reducedMotion of ['no-preference', 'reduce'] as const)
  test(`AN-06 · A-36 fundido del indicador de sincronización (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await entrar(page);
    const texto = page
      .getByRole('status', { name: 'Indicador de sincronización' })
      .locator('.wg-indicador-sincronizacion__estado');
    await expect(texto).toHaveText('Sincronizado');
    await expect(texto).toHaveCSS('transition-property', 'opacity');
    await expect(texto).toHaveCSS('transition-duration', reducedMotion === 'reduce' ? '0.1s' : '0.15s');
    // Termina el fundido y el texto queda del todo visible.
    await expect(texto).toHaveCSS('opacity', '1');
  });

// AN-07 · A-20, A-21 (Calendario) y A-24, A-37 (Windi).
const abrirDelMenu = (page: Page, opcion: string) =>
  page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('button', { name: opcion, exact: true })
    .click();

/** El color calculado de una variable de color del tema. */
const colorDe = (page: Page, variable: string) =>
  page.evaluate((v) => {
    const sonda = document.createElement('div');
    sonda.style.backgroundColor = `var(${v})`;
    document.body.append(sonda);
    const color = getComputedStyle(sonda).backgroundColor;
    sonda.remove();
    return color;
  }, variable);

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  const fundido = reducedMotion === 'reduce' ? '0.1s' : '0.15s';

  test(`AN-07 · A-20 el día se resalta al pasar el puntero; A-21 el mes cambia sin transición (${reducedMotion})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.emulateMedia({ reducedMotion });
    await entrar(page);
    await abrirDelMenu(page, 'Calendario');
    const dia = page
      .locator(
        'td.wg-calendario__celda:not(.wg-calendario__dia--pendiente):not(.wg-calendario__dia--vencida)',
      )
      .first();
    await expect(dia).toHaveCSS('transition-property', 'background-color');
    await expect(dia).toHaveCSS('transition-duration', fundido);
    await dia.hover();
    await expect(dia).toHaveCSS('background-color', await colorDe(page, '--wg-superficie-baja'));
    // A-21: la rejilla no anima el cambio de mes.
    const rejilla = page.locator('.wg-calendario').first();
    await expect(rejilla).toHaveCSS('transition-duration', '0s');
    await expect(rejilla).toHaveCSS('animation-name', 'none');
  });

  test(`AN-07 · A-24 el mensaje nuevo entra con fundido; A-37 el campo cambia de opacidad con fundido (${reducedMotion})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.emulateMedia({ reducedMotion });
    await entrar(page);
    await page.getByRole('button', { name: 'Windi', exact: true }).click();
    const campo = page.getByPlaceholder('Escribe un mensaje');
    await expect(campo).toHaveCSS('transition-property', 'opacity');
    await expect(campo).toHaveCSS('transition-duration', fundido);
    await campo.fill('Hola, Windi');
    await campo.press('Enter');
    const mensaje = page
      .getByRole('list', { name: 'Conversación' })
      .locator('.wg-windi__mensaje', { hasText: 'Hola, Windi' });
    await expect(mensaje).toHaveCSS('transition-property', 'opacity, transform');
    await expect(mensaje).toHaveCSS('transition-duration', `${fundido}, ${fundido}`);
    await expect(mensaje).toHaveCSS('opacity', '1');
  });
}

// AN-01 · A-01, A-02 (ventana emergente) y A-03, A-04 (menú ⋮).
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  const medio = reducedMotion === 'reduce' ? '0.1s' : '0.2s';
  const corto = reducedMotion === 'reduce' ? '0.1s' : '0.15s';

  test(`AN-01 · A-01 la ventana entra en 200 ms y A-02 sale y se quita (${reducedMotion})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.emulateMedia({ reducedMotion });
    await entrar(page);
    await abrirDelMenu(page, 'Etiquetas');
    await page.getByRole('button', { name: 'Nueva etiqueta', exact: true }).click();
    const ventana = page.getByRole('dialog', { name: 'Nueva etiqueta' });
    await expect(ventana).toHaveClass(/wg-emergente--abierta/);
    await expect(ventana).toHaveCSS('transition-property', 'opacity, transform');
    await expect(ventana).toHaveCSS('transition-duration', `${medio}, ${medio}`);
    await expect(ventana).toHaveCSS('opacity', '1');
    await expect(ventana).toHaveCSS('transform', 'none');
    await page.keyboard.press('Escape');
    await expect(ventana).toHaveCount(0);
    // La copia que sale se quita sola y no tapa la pantalla.
    await expect(page.locator('[data-saliendo]')).toHaveCount(0);
  });

  test(`AN-01 · A-03 el menú abre en 150 ms y A-04 cierra (${reducedMotion})`, async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.emulateMedia({ reducedMotion });
    await entrar(page);
    await abrirDelMenu(page, 'Tablero Kanban');
    await page.getByRole('button', { name: 'Acciones de Por hacer', exact: true }).click();
    const menu = page.getByRole('menu');
    await expect(menu).toHaveClass(/wg-menu-acciones__lista--abierta/);
    await expect(menu).toHaveCSS('transition-property', 'opacity, transform');
    await expect(menu).toHaveCSS('transition-duration', `${corto}, ${corto}`);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(page.locator('.wg-menu-acciones__lista')).toHaveCount(0);
  });
}
