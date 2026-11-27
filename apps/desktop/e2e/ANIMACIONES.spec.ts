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
