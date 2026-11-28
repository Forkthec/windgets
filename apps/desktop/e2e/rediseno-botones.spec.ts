import { expect, test, type Locator, type Page } from '@playwright/test';

// P44 · Componentes base: jerarquía de botones y selector segmentado (docs/rediseno.md RD-99, IM-02). Ninguna pantalla
// usa todavía «icono», «destructivo» ni «fila» (se aplican pantalla por pantalla después), así que se agrega a la
// ventana con sesión una muestra con las clases que escriben `Boton` y `Segmentado` (comprobadas en sus pruebas de
// Vitest) y se mide lo que pinta el navegador con las hojas de estilo de la aplicación.

const TEMAS = {
  claro: {
    colores: { primary: '#F5F0FF', secondary: '#B6A560', text: '#17131D' },
    superficie: 'rgb(255, 255, 255)',
    superficie_baja: 'rgb(237, 227, 255)',
    tinta: 'rgb(23, 19, 29)',
    accion: 'rgb(0, 217, 226)',
    sobre_accion: 'rgb(11, 42, 46)', // TK-05, P3
    borde: 'rgb(36, 28, 48)',
    sombra: 'rgb(36, 28, 48) 3px 5px 0px 0px',
    error: 'rgb(179, 38, 30)',
    secundario: 'rgb(102, 4, 230)',
    seleccion: 'rgb(102, 4, 230)',
    sobre_seleccion: 'rgb(255, 255, 255)',
  },
  oscuro: {
    colores: { primary: '#201B2B', secondary: '#5D566B', text: '#F8F5FF' },
    superficie: 'rgb(43, 37, 52)',
    superficie_baja: 'rgb(67, 50, 88)',
    tinta: 'rgb(248, 245, 255)',
    accion: 'rgb(0, 217, 226)',
    sobre_accion: 'rgb(11, 42, 46)', // TK-05, P3
    borde: 'rgb(175, 161, 192)',
    sombra: 'rgb(16, 13, 21) 3px 5px 0px 0px',
    error: 'rgb(255, 138, 128)',
    secundario: 'rgb(211, 178, 255)',
    seleccion: 'rgb(0, 217, 226)',
    sobre_seleccion: 'rgb(11, 42, 46)',
  },
} as const;

/** Un tema que no define `secundario`, `sombra` ni `error`. */
const OTRO = { primary: '#201B2B', secondary: '#DC026C', text: '#FFFFFF' };

async function entrar(page: Page) {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sesion', '');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

const pintar = (page: Page, colores: { primary: string; secondary: string; text: string }) =>
  page.evaluate(async (c) => {
    // Los mismos módulos que usa la aplicación, servidos por Vite.
    const rutas = ['/src/ui/tema/derivar.ts', '/src/ui/tema/tokens.ts'];
    const [derivar, tokens] = await Promise.all(rutas.map((r) => import(/* @vite-ignore */ r)));
    tokens.aplicarTokens(derivar.tokensDeLosColores({ ...c, fuente: 'Rubik', tamano: '16px' }));
  }, colores);

async function muestra(page: Page) {
  await page.evaluate(() => {
    const boton = (id: string, clases: string, contenido: string) =>
      `<button type="button" id="${id}" class="wg-boton ${clases}">${contenido}</button>`;
    // Con la clase y las medidas que escriben los íconos de `ui/Iconos` (RD-101).
    const icono =
      '<svg class="wg-icono" viewBox="0 0 18 18" width="1em" height="1em" aria-hidden="true">' +
      '<path d="M3.6 9H14.4" stroke="currentColor"/></svg>';
    const caja = document.createElement('div');
    caja.id = 'muestra';
    caja.style.cssText =
      'position:fixed;inset:0;z-index:999;display:flex;flex-direction:column;align-items:flex-start;' +
      'gap:20px;padding:20px;background:var(--wg-superficie)';
    caja.innerHTML =
      '<button type="button" id="antes">antes</button>' +
      boton('principal', 'wg-boton--principal', '<span>Guardar</span>') +
      boton('secundario', 'wg-boton--secundario', '<span>Cancelar cambios</span>') +
      boton('destructivo', 'wg-boton--destructivo', '<span>Eliminar</span>') +
      boton('icono', 'wg-boton--icono', icono) +
      boton('fila', 'wg-boton--secundario wg-boton--fila', '<span>Aplicar</span>') +
      boton('icono-fila', 'wg-boton--icono wg-boton--fila', icono) +
      '<div class="wg-segmentado" id="grupo">' +
      '<button type="button" id="elegida" class="wg-segmentado__opcion" aria-pressed="true">Mes</button>' +
      '<button type="button" id="otra" class="wg-segmentado__opcion" aria-pressed="false">Semana</button>' +
      '</div>';
    document.body.append(caja);
  });
}

/** El valor calculado al terminar las transiciones del elemento (AN-03: hover, foco y tema se animan). */
const estilo = (l: Locator, propiedad: string) =>
  l.evaluate(async (e, p) => {
    const transiciones = e.getAnimations().filter((a) => a instanceof CSSTransition);
    await Promise.all(transiciones.map((a) => a.finished.catch(() => undefined)));
    return getComputedStyle(e).getPropertyValue(p);
  }, propiedad);

/** Distancias entre el borde del botón y su contenido: izquierda, derecha, arriba y abajo. */
const margenes = (l: Locator) =>
  l.evaluate((e) => {
    const b = e.getBoundingClientRect();
    const c = (e.firstElementChild as Element).getBoundingClientRect();
    return [c.left - b.left, b.right - c.right, c.top - b.top, b.bottom - c.bottom] as const;
  });

test('RD-99 · Alturas de 36 y 32 px, contenido centrado y ancho según el texto', async ({ page }) => {
  await entrar(page);
  await muestra(page);
  for (const id of ['principal', 'secundario', 'destructivo', 'icono', 'fila', 'icono-fila']) {
    const boton = page.locator(`#${id}`);
    const caja = await boton.boundingBox();
    expect(caja?.height, id).toBe(id.endsWith('fila') ? 32 : 36);
    const [izquierda, derecha, arriba, abajo] = await margenes(boton);
    expect(Math.abs(izquierda - derecha), `${id}: horizontal`).toBeLessThanOrEqual(1);
    expect(Math.abs(arriba - abajo), `${id}: vertical`).toBeLessThanOrEqual(1);
  }
  for (const id of ['principal', 'secundario', 'destructivo', 'fila']) {
    const boton = page.locator(`#${id}`);
    expect(await estilo(boton, 'padding-left'), id).toBe('16px');
    expect(await estilo(boton, 'padding-right'), id).toBe('16px');
    expect(await estilo(boton, 'column-gap'), id).toBe('8px');
    // 16 px de relleno y 1,5 px de borde a cada lado: no hay ancho fijo.
    // El borde pintado puede ser de 1 o de 1,5 px según la escala de la pantalla.
    const borde = Number.parseFloat(await estilo(boton, 'border-left-width'));
    expect((await margenes(boton))[0], id).toBeCloseTo(16 + borde, 0);
  }
  const ancho = async (id: string) => (await page.locator(`#${id}`).boundingBox())?.width ?? 0;
  expect(await ancho('secundario')).toBeGreaterThan(await ancho('principal'));
});

test('RD-99 · El botón de ícono es cuadrado, con ícono de 20 px y relleno solo al pasar el puntero', async ({
  page,
}) => {
  await entrar(page);
  await pintar(page, TEMAS.claro.colores);
  await muestra(page);
  for (const [id, lado] of [
    ['icono', 36],
    ['icono-fila', 32],
  ] as const) {
    const boton = page.locator(`#${id}`);
    const caja = await boton.boundingBox();
    expect([caja?.width, caja?.height], id).toEqual([lado, lado]);
    const dibujo = await boton.locator('svg').boundingBox();
    expect([dibujo?.width, dibujo?.height], id).toEqual([20, 20]);
    expect(await estilo(boton, 'border-top-width')).toBe('0px');
    expect(await estilo(boton, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    await boton.hover();
    expect(await estilo(boton, 'background-color')).toBe(TEMAS.claro.superficie_baja);
  }
});

for (const [nombre, tema] of Object.entries(TEMAS)) {
  test(`RD-99 · Windgets ${nombre}: principal, secundario, destructivo y opción elegida`, async ({
    page,
  }) => {
    await entrar(page);
    await pintar(page, tema.colores);
    await muestra(page);
    const principal = page.locator('#principal');
    expect(await estilo(principal, 'background-color')).toBe(tema.accion);
    expect(await estilo(principal, 'color')).toBe(tema.sobre_accion);
    expect(await estilo(principal, 'border-top-color')).toBe(tema.borde);
    expect(await estilo(principal, 'box-shadow')).toBe(tema.sombra);

    const secundario = page.locator('#secundario');
    expect(await estilo(secundario, 'background-color')).toBe(tema.superficie);
    expect(await estilo(secundario, 'color')).toBe(tema.tinta);
    expect(await estilo(secundario, 'border-top-color')).toBe(tema.borde);
    expect(await estilo(secundario, 'box-shadow')).toBe('none');

    for (const boton of [principal, secundario, page.locator('#destructivo')]) {
      // Chromium redondea el borde de 1,5 px a píxeles del dispositivo: a escala 100 % informa 1 px.
      expect(['1px', '1.5px']).toContain(await estilo(boton, 'border-top-width'));
      expect(await estilo(boton, 'border-top-left-radius')).toBe('9px');
      expect(await estilo(boton, 'font-weight')).toBe('500');
      expect(await estilo(boton, 'font-size')).toBe('14px');
    }

    const destructivo = page.locator('#destructivo');
    expect(await estilo(destructivo, 'background-color')).toBe(tema.superficie);
    expect(await estilo(destructivo, 'color')).toBe(tema.error);
    expect(await estilo(destructivo, 'border-top-color')).toBe(tema.error);

    expect(await estilo(page.locator('#grupo'), 'border-top-color')).toBe(tema.borde);
    // RD-107 (TK-05): la opción elegida va en `seleccion` y `sobre_seleccion`.
    expect(await estilo(page.locator('#elegida'), 'background-color')).toBe(tema.seleccion);
    expect(await estilo(page.locator('#elegida'), 'color')).toBe(tema.sobre_seleccion);
    expect(await estilo(page.locator('#otra'), 'background-color')).toBe('rgba(0, 0, 0, 0)');
  });

  test(`RD-99 · Windgets ${nombre}: el foco del teclado se ve en cada botón`, async ({ page }) => {
    await entrar(page);
    await pintar(page, tema.colores);
    await muestra(page);
    await page.locator('#antes').focus();
    for (const id of [
      'principal',
      'secundario',
      'destructivo',
      'icono',
      'fila',
      'icono-fila',
      'elegida',
      'otra',
    ]) {
      await page.keyboard.press('Tab');
      const boton = page.locator(`#${id}`);
      await expect(boton).toBeFocused();
      expect(await estilo(boton, 'outline-style'), id).toBe('solid');
      expect(await estilo(boton, 'outline-width'), id).toBe('2px');
      expect(await estilo(boton, 'outline-color'), id).toBe(tema.tinta);
    }
  });
}

test('RD-99 · En un tema sin esos colores, el respaldo usa la tinta, la vencida y la acción', async ({
  page,
}) => {
  await entrar(page);
  // Primero Windgets: al cambiar de tema no puede quedar ningún color suyo.
  await pintar(page, TEMAS.claro.colores);
  await pintar(page, OTRO);
  await muestra(page);
  const token = (nombre: string) =>
    page.evaluate((n) => {
      const prueba = document.createElement('span');
      prueba.style.color = `var(${n})`;
      document.body.append(prueba);
      const color = getComputedStyle(prueba).color;
      prueba.remove();
      return color;
    }, nombre);
  const destructivo = page.locator('#destructivo');
  expect(await estilo(destructivo, 'color')).toBe(await token('--wg-tinta'));
  expect(await estilo(destructivo, 'border-top-color')).toBe(await token('--wg-estado-vencida'));
  const elegida = page.locator('#elegida');
  expect(await estilo(elegida, 'background-color')).toBe(await token('--wg-accion'));
  expect(await estilo(elegida, 'color')).toBe(await token('--wg-sobre-accion'));
  // La sombra es la de la hoja de estilos, con el borde del tema.
  expect(await estilo(page.locator('#principal'), 'box-shadow')).toContain(await token('--wg-borde'));
});

test('RD-99 · Con contraste alto de Windows la opción elegida lleva contorno', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await entrar(page);
  await muestra(page);
  expect(await estilo(page.locator('#elegida'), 'outline-style')).toBe('solid');
  expect(await estilo(page.locator('#otra'), 'outline-style')).toBe('none');
});

test('RD-99 · Las opciones del menú y del catálogo siguen alineadas a la izquierda', async ({ page }) => {
  await entrar(page);
  /** Píxeles entre el borde interior (borde más relleno) y donde empieza el contenido. */
  const desfase = (l: Locator) =>
    l.evaluate((e) => {
      const rango = document.createRange();
      rango.selectNodeContents(e);
      const css = getComputedStyle(e);
      const interior =
        e.getBoundingClientRect().left + parseFloat(css.borderLeftWidth) + parseFloat(css.paddingLeft);
      return rango.getBoundingClientRect().left - interior;
    });
  const menu = page.getByRole('navigation', { name: 'Menú principal' });
  const opcion = menu.getByRole('button', { name: 'Widgets', exact: true });
  expect(Math.abs(await desfase(opcion))).toBeLessThanOrEqual(1);
  await opcion.click();
  await page.getByRole('button', { name: 'Agregar widget' }).click();
  const fila = page.locator('.wg-catalogo .wg-boton').first();
  expect(Math.abs(await desfase(fila))).toBeLessThanOrEqual(1);
});

test('RD-99 · En las pantallas, Mes y Semana usan «secundario» y la tira de la Agenda conserva la acción', async ({
  page,
}) => {
  await entrar(page);
  const menu = page.getByRole('navigation', { name: 'Menú principal' });
  const elegida = (selector: string) => page.locator(`${selector}[aria-pressed='true']`).first();
  await menu.getByRole('button', { name: 'Calendario', exact: true }).click();
  await expect(elegida('.wg-segmentado__opcion')).toBeVisible();
  await pintar(page, TEMAS.claro.colores);
  expect(await estilo(elegida('.wg-segmentado__opcion'), 'background-color')).toBe(TEMAS.claro.seleccion);
  await menu.getByRole('button', { name: 'Agenda diaria', exact: true }).click();
  await expect(elegida('.wg-agenda__dia-de-la-tira')).toBeVisible();
  await pintar(page, TEMAS.claro.colores);
  expect(await estilo(elegida('.wg-agenda__dia-de-la-tira'), 'background-color')).toBe(TEMAS.claro.accion);
});

test('RD-99 · Excepción: en las pantallas de cuenta el botón principal sigue a lo ancho', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1240, height: 820 });
  await page.goto('/');
  const boton = page.getByRole('button', { name: 'Iniciar sesión' });
  const formulario = await page.locator('.wg-nota .wg-formulario').boundingBox();
  const caja = await boton.boundingBox();
  expect(caja?.width).toBeCloseTo(formulario?.width ?? 0, 0);
  expect(caja?.height).toBe(47);
});
