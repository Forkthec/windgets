import { expect, test, type Page } from '@playwright/test';
import { informar, WINDOWS_X64 } from './navegador';

// Rediseño visual de la landing page (CD-01-HU01): movimiento, selector de tema y estructura. Los textos de
// los CA se prueban en CD-01-HU01.spec.ts y CD-01-HU02.spec.ts.

const FUNCIONES = [
  'Wallpaper personalizable: pon tu wallpaper como fondo real del escritorio de Windows.',
  'Widgets: coloca widgets de planificación y de información en tu escritorio.',
  'Planificador: organiza tus tarjetas en un tablero Kanban, un calendario, una agenda diaria y un planificador diario, y consulta reportes.',
  'Windi: pide ayuda a Windi, el agente de IA de la aplicación.',
  'Sincronización: encuentra tu información en cualquier computador y trabaja también sin conexión.',
];

const funciones = (page: Page) =>
  page.getByRole('list', { name: 'Funciones principales' }).getByRole('listitem');
const boton = (page: Page) => page.getByRole('button', { name: 'Descargar para Windows' });
const panel = (page: Page) => page.locator('.panel');

async function abrir(page: Page, reducedMotion: 'reduce' | 'no-preference') {
  await page.emulateMedia({ reducedMotion });
  await informar(page, WINDOWS_X64);
  await page.goto('/');
}

/** Animaciones y transiciones en curso o por empezar, de CSS o de la API de animación. */
async function animaciones(page: Page) {
  return page.evaluate(() => document.getAnimations().filter((a) => a.playState !== 'finished').length);
}

async function estilo(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elementos) =>
    elementos.map((el) => {
      const { transform, clipPath } = getComputedStyle(el);
      return { transform, clipPath };
    }),
  );
}

const QUIETO = { transform: 'none', clipPath: 'none' };
const PIEZAS_EN_REPOSO = '.pieza:not(.activa)';

test.describe('escritorio', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('CD-01-HU01 · Con «reducir movimiento» la página está completa y quieta', async ({ page }) => {
    await abrir(page, 'reduce');
    await expect(page.locator('html')).not.toHaveClass(/con-movimiento/);
    await expect(page.locator('.isotipo-animado')).toHaveCount(0);
    expect(await animaciones(page)).toBe(0);

    // Nada sigue al puntero.
    await page.mouse.move(5, 5);
    await page.mouse.move(900, 500, { steps: 5 });
    expect(await animaciones(page)).toBe(0);

    // El botón no se desplaza al pasar el puntero.
    await boton(page).hover();
    expect(await estilo(page, '.boton')).toEqual([QUIETO]);
    expect(await animaciones(page)).toBe(0);

    // Al llegar a la última función cambia la pieza activa, sin moverse: solo pasa a borde de 3 px.
    await funciones(page).last().scrollIntoViewIfNeeded();
    await funciones(page).last().hover();
    const etiqueta = page.locator('.sincronizado');
    await expect(etiqueta).toHaveClass(/activa/);
    expect(await animaciones(page)).toBe(0);
    await funciones(page).nth(2).hover();
    await expect(page.locator('.kanban')).toHaveClass(/activa/);
    await expect(page.locator('.kanban')).toHaveCSS('border-top-width', '3px');
    expect(await animaciones(page)).toBe(0);

    // Logo, panel, piezas y las cinco funciones, sin `transform` ni `clip-path`.
    for (const selector of ['.identificador__logo', '.panel', '.pieza', '.funcion']) {
      for (const encontrado of await estilo(page, selector)) expect(encontrado, selector).toEqual(QUIETO);
    }
    await expect(funciones(page)).toHaveCount(5);
  });

  test('CD-01-HU01 · Con «reducir movimiento» el tema cambia de inmediato', async ({ page }) => {
    await abrir(page, 'reduce');
    await page.getByRole('radio', { name: 'Enfoque rojo y negro' }).check();
    await expect(panel(page)).toHaveAttribute('data-tema', 'rojo-negro');
    expect(await animaciones(page)).toBe(0);
    await expect(page.locator('.fondo--saliente')).toHaveCount(0);
    await expect(page.locator('.fondo--activo')).toHaveAttribute('data-fondo', 'rojo-negro');
  });

  test('CD-01-HU01 · Con movimiento, la entrada termina con el logo oficial y todo en su sitio', async ({
    page,
  }) => {
    await abrir(page, 'no-preference');
    await expect(page.locator('html')).toHaveClass(/con-movimiento/);
    // El isotipo animado existe mientras dura la entrada y se retira al anclarse.
    await expect(page.locator('.isotipo-animado')).toHaveCount(1);
    await expect(page.locator('.isotipo-animado')).toHaveCount(0);
    await expect(page.locator('img')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 }).locator('img')).toHaveCount(1);
    await expect(page.locator('svg.isotipo-animado, [class*="isotipo"]')).toHaveCount(0);

    // Al terminar la entrada no queda nada desplazado ni recortado.
    await expect.poll(() => animaciones(page), { timeout: 15_000 }).toBe(0);
    // (La pieza activa, si hay alguna función a la vista, sube a propósito: es la animación 6.)
    for (const selector of [
      '.identificador__logo',
      '.funcion',
      '.funciones',
      '.descarga',
      PIEZAS_EN_REPOSO,
    ]) {
      for (const encontrado of await estilo(page, selector)) expect(encontrado, selector).toEqual(QUIETO);
    }
    await expect(funciones(page)).toHaveCount(5);
  });

  test('CD-01-HU01 · El botón queda listo antes de 3 s desde que empieza la entrada', async ({ page }) => {
    await abrir(page, 'no-preference');
    // Fin de la animación de la zona de descarga (espera más duración), medido desde el inicio de la entrada.
    const fin = await page
      .locator('#descarga')
      .evaluate((zona) =>
        Math.max(...zona.getAnimations().map((a) => Number(a.effect?.getComputedTiming().endTime))),
      );
    expect(fin).toBeGreaterThan(0);
    expect(fin).toBeLessThan(3000);
    // Y el botón responde: `trial` espera a que esté quieto y reciba el puntero, sin pulsarlo.
    await boton(page).click({ trial: true });
    expect(await estilo(page, '#descarga')).toEqual([QUIETO]);
  });

  for (const movimiento of ['reduce', 'no-preference'] as const) {
    test(`CD-01-HU01 · «Elige un tema» cambia el panel y nada más (${movimiento})`, async ({ page }) => {
      await abrir(page, movimiento);
      const h1 = page.getByRole('heading', { level: 1 });
      const lista = page.getByRole('list', { name: 'Funciones principales' });
      const descarga = page.getByRole('region', { name: 'Descarga' });
      const grupo = page.getByRole('group', { name: 'Elige un tema' });
      await expect(grupo.getByRole('radio')).toHaveCount(3);
      await expect(grupo.getByRole('radio', { name: 'Windgets' })).toBeChecked();
      await expect(panel(page)).toHaveAttribute('data-tema', 'windgets');
      // Durante la entrada el isotipo se construye sobre el logo; el `h1` se compara ya con la imagen oficial.
      await expect(page.locator('.isotipo-animado')).toHaveCount(0);
      const antes = await Promise.all(
        [h1, lista, descarga].map((zona) => zona.evaluate((el) => el.outerHTML)),
      );

      // Con el puntero.
      await grupo.getByRole('radio', { name: 'Rosa pastel' }).check();
      await expect(panel(page)).toHaveAttribute('data-tema', 'rosa-pastel');
      await expect(page.locator('.fondo--activo')).toHaveAttribute('data-fondo', 'rosa-pastel');

      // Con el teclado: las flechas recorren las opciones del grupo.
      await grupo.getByRole('radio', { name: 'Rosa pastel' }).focus();
      await page.keyboard.press('ArrowLeft');
      await expect(grupo.getByRole('radio', { name: 'Enfoque rojo y negro' })).toBeChecked();
      await expect(panel(page)).toHaveAttribute('data-tema', 'rojo-negro');
      await page.keyboard.press('ArrowRight');
      await expect(grupo.getByRole('radio', { name: 'Rosa pastel' })).toBeChecked();
      await expect(panel(page)).toHaveAttribute('data-tema', 'rosa-pastel');

      // El wallpaper anterior se retira al terminar el barrido y las piezas quedan en su plantilla.
      await expect(page.locator('.fondo--saliente')).toHaveCount(0);
      await expect.poll(() => animaciones(page), { timeout: 15_000 }).toBe(0);
      for (const encontrado of await estilo(page, PIEZAS_EN_REPOSO)) expect(encontrado).toEqual(QUIETO);

      const despues = await Promise.all(
        [h1, lista, descarga].map((zona) => zona.evaluate((el) => el.outerHTML)),
      );
      expect(despues).toEqual(antes);
      await expect(h1).toHaveText('Windgets');
    });
  }

  test('CD-01-HU01 · Los widgets del panel no se superponen en ningún tema (R-09)', async ({ page }) => {
    await abrir(page, 'reduce');
    for (const tema of ['Windgets', 'Enfoque rojo y negro', 'Rosa pastel']) {
      await page.getByRole('radio', { name: tema }).check();
      const cajas = await page
        .locator('.pieza')
        .evaluateAll((piezas) => piezas.map((p) => p.getBoundingClientRect().toJSON() as DOMRect));
      expect(cajas).toHaveLength(5);
      for (const [i, a] of cajas.entries()) {
        for (const b of cajas.slice(i + 1)) {
          const separadas =
            a.right <= b.left + 0.5 ||
            b.right <= a.left + 0.5 ||
            a.bottom <= b.top + 0.5 ||
            b.bottom <= a.top + 0.5;
          expect(separadas, `${tema}: dos piezas se superponen`).toBe(true);
        }
      }
    }
  });

  test('CD-01-HU01 · Estructura: un identificador, un botón y los textos literales', async ({ page }) => {
    await abrir(page, 'reduce');
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.locator('h1').evaluate((el) => el.textContent)).toBe('Windgets');
    await expect(boton(page)).toHaveCount(1);
    // El `textContent` de cada función es el literal exacto: los dibujos no agregan texto.
    expect(await funciones(page).evaluateAll((lis) => lis.map((li) => li.textContent))).toEqual(FUNCIONES);
    expect(await page.locator('li svg text, li svg title').count()).toBe(0);
    // El panel es un grupo con nombre; no lleva logo ni isotipo, ni avisos.
    await expect(page.getByRole('group', { name: 'Escritorio de ejemplo' })).toHaveCount(1);
    await expect(panel(page).locator('img, [role="alert"]')).toHaveCount(0);
    // Orden de tabulación: botón, selector y enlace del cierre.
    await page.keyboard.press('Tab');
    await expect(boton(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'Windgets' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Volver a la descarga' })).toBeFocused();
    // Ninguna petición sale a servidores de terceros al cargar (fuentes y logo se sirven desde el sitio).
    const externas = await page.evaluate((origen) => {
      const recursos = performance.getEntriesByType('resource').map((r) => r.name);
      return recursos.filter((url) => !url.startsWith(origen));
    }, new URL(page.url()).origin);
    expect(externas).toEqual([]);
  });

  test('CD-01-HU01 · El héroe cabe en 1366 × 768 y el panel queda entero y quieto en la ventana', async ({
    page,
  }) => {
    await abrir(page, 'reduce');
    for (const zona of [boton(page), page.getByRole('group', { name: 'Elige un tema' })]) {
      await expect(zona).toBeInViewport({ ratio: 1 });
    }
    await expect(panel(page)).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1366);
    // El lienzo cabe entero en el panel: el escritorio no se recorta.
    const cajas = await page.evaluate(() => {
      const caja = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().toJSON();
      return { panel: caja('.panel') as DOMRect, lienzo: caja('.lienzo') as DOMRect };
    });
    expect(cajas.lienzo.right).toBeLessThanOrEqual(cajas.panel.right);
    expect(cajas.lienzo.bottom).toBeLessThanOrEqual(cajas.panel.bottom);
    // Al recorrer la página hasta el final, el panel no se mueve.
    const arriba = await panel(page).boundingBox();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByRole('link', { name: 'Volver a la descarga' })).toBeInViewport();
    expect(await panel(page).boundingBox()).toEqual(arriba);
    await expect(panel(page)).toBeInViewport({ ratio: 1 });
  });

  test('CD-01-HU01 · El escritorio de ejemplo se puede usar', async ({ page }) => {
    await abrir(page, 'reduce');
    const escritorio = page.getByRole('group', { name: 'Escritorio de ejemplo' });

    // Tareas del día: completar y deshacer cambia la palabra, el ícono y la cuenta.
    const tarea = escritorio.getByRole('button', { name: 'Entregar ensayo de historia' });
    await expect(tarea).toHaveText('Entregar ensayo de historiaPendiente');
    await expect(escritorio.getByText('1 de 3 completadas')).toBeVisible();
    await tarea.click();
    await expect(tarea).toHaveText('Entregar ensayo de historiaCompletada');
    await expect(tarea).toHaveAttribute('aria-pressed', 'true');
    await expect(escritorio.getByText('2 de 3 completadas')).toBeVisible();
    await tarea.press('Enter');
    await expect(escritorio.getByText('1 de 3 completadas')).toBeVisible();

    // Calendario: se elige un día con el puntero y se cambia con las flechas.
    const dia = (n: number) => escritorio.getByRole('button', { name: String(n), exact: true });
    await expect(dia(5)).toHaveAttribute('aria-pressed', 'true');
    await dia(14).click();
    await expect(dia(14)).toHaveAttribute('aria-pressed', 'true');
    await expect(dia(5)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('ArrowDown');
    await expect(dia(21)).toHaveAttribute('aria-pressed', 'true');
    await expect(dia(21)).toBeFocused();

    // Kanban: pulsar una tarjeta la pasa a la columna siguiente; arrastrarla, a la columna donde se suelta.
    const tarjetas = () =>
      page
        .locator('.columna')
        .evaluateAll((columnas) => columnas.map((c) => c.querySelectorAll('.tarjeta').length));
    expect(await tarjetas()).toEqual([3, 2, 4]);
    await page.locator('.columna').first().locator('.tarjeta').first().click();
    expect(await tarjetas()).toEqual([2, 3, 4]);
    const origen = await page.locator('.columna').nth(2).locator('.tarjeta').first().boundingBox();
    const destino = await page.locator('.columna').first().boundingBox();
    if (!origen || !destino) throw new Error('El Kanban no está a la vista');
    await page.mouse.move(origen.x + origen.width / 2, origen.y + origen.height / 2);
    await page.mouse.down();
    await page.mouse.move(destino.x + destino.width / 2, destino.y + destino.height - 10, { steps: 6 });
    await page.mouse.up();
    expect(await tarjetas()).toEqual([3, 3, 3]);
    for (const encontrado of await estilo(page, '.tarjeta')) expect(encontrado).toEqual(QUIETO);

    // Windi: «Confirmar» mueve una tarjeta a «Por hacer» y la propuesta queda respondida.
    await escritorio.getByRole('button', { name: 'Confirmar' }).click();
    expect(await tarjetas()).toEqual([4, 2, 3]);
    await expect(page.locator('.columna').first().locator('.tarjeta--movida')).toHaveCount(1);
    await expect(escritorio.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    await expect(escritorio.getByRole('button', { name: 'Rechazar' })).toBeDisabled();

    // Pestaña «Personalización»: elegir un tema ahí es lo mismo que en «Elige un tema».
    await escritorio.getByRole('tab', { name: 'Personalización' }).click();
    await expect(escritorio.getByRole('tabpanel', { name: 'Personalización' })).toBeVisible();
    await expect(escritorio.getByText('Agente de IA', { exact: true })).toBeHidden();
    await escritorio.getByRole('button', { name: 'Rosa pastel' }).click();
    await expect(panel(page)).toHaveAttribute('data-tema', 'rosa-pastel');
    await expect(page.getByRole('radio', { name: 'Rosa pastel' })).toBeChecked();
    await page.getByRole('radio', { name: 'Windgets' }).check();
    await expect(escritorio.getByRole('button', { name: 'Windgets' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // Nada de lo anterior tocó la descarga ni mostró avisos.
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(await animaciones(page)).toBe(0);
  });

  test('CD-01-HU01 · «Rechazar» deja la propuesta respondida sin mover tarjetas', async ({ page }) => {
    await abrir(page, 'reduce');
    await page.getByRole('button', { name: 'Rechazar' }).click();
    expect(
      await page
        .locator('.columna')
        .evaluateAll((cs) => cs.map((c) => c.querySelectorAll('.tarjeta').length)),
    ).toEqual([3, 2, 4]);
    await expect(page.locator('.tarjeta--movida')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Rechazar' })).toBeDisabled();
  });
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const tema of ['Windgets', 'Enfoque rojo y negro', 'Rosa pastel']) {
    test(`CD-01-HU01 · A 375 px no hay desplazamiento horizontal (${tema})`, async ({ page }) => {
      await abrir(page, 'reduce');
      // El botón se ve sin desplazar.
      await expect(boton(page)).toBeInViewport({ ratio: 1 });
      await page.getByRole('radio', { name: tema }).check();
      const ancho = await page.evaluate(() => ({
        pagina: document.documentElement.scrollWidth,
        ventana: document.documentElement.clientWidth,
      }));
      expect(ancho.pagina).toBe(ancho.ventana);
      // Las áreas táctiles miden 44 px o más.
      const altos = await page
        .locator('.boton, .tema, .cierre__enlace')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      for (const alto of altos) expect(alto).toBeGreaterThanOrEqual(44);
      // El panel recortado muestra Reloj, Tareas del día y Calendario.
      await expect(page.locator('.pieza:visible')).toHaveCount(3);
    });
  }
});
