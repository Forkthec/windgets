import { expect, test, type Page } from '@playwright/test';
import {
  MARCO_REFERENCIA,
  TAMANOS,
  buscarCapa,
  cajaEsperada,
  compararPantalla,
  leerFuente,
  type Fila,
} from './geometria/arnes';

// F6-02 · Prueba del arnés de geometría (COLA.md F6-02). Una página sintética con dos capas reales de la huella
// 204-3109 (Configuración, claro): el título «Configuración» y la tarjeta «Preferencias de la cuenta». Comprueba que
// el arnés da [] cuando todo coincide, que traslada y estira la caja según el anclaje en 1200×800 y 960×600, y que
// detecta cada clase de diferencia. Las pantallas reales usan el arnés en las pruebas de su pieza.

const TITULO: Fila = { testid: 'titulo', huella: '204-3109', capa: 'Configuración', indice: 1 };
const TARJETA: Fila = {
  testid: 'tarjeta',
  huella: '204-3109',
  capa: 'Preferencias de la cuenta',
  anclaje: { h: 'estira' },
};

interface Opciones {
  dx?: number;
  ancho?: number;
  relleno?: string;
  peso?: number;
  texto?: string;
  sinTarjeta?: boolean;
}

async function pintar(page: Page, o: Opciones = {}) {
  const marco = page.viewportSize() ?? MARCO_REFERENCIA;
  const ancho = o.ancho ?? 842 + (marco.width - MARCO_REFERENCIA.width);
  await page.setContent(`<!doctype html>
    <style>
      :root { --wg-superficie: #ffffff; --wg-linea: #d9d0e6; --wg-tinta: #17131d; }
      body { margin: 0; }
      #titulo { position: absolute; left: ${200 + (o.dx ?? 0)}px; top: 49px; width: 167px; height: 35px; margin: 0;
        font: ${o.peso ?? 700} 26px 'Nunito', sans-serif; color: var(--wg-tinta); }
      #tarjeta { position: absolute; left: 200px; top: 104px; width: ${ancho}px; height: 326px; box-sizing: border-box;
        background: ${o.relleno ?? 'var(--wg-superficie)'}; border: 1px solid var(--wg-linea); border-radius: 8px; }
    </style>
    <h1 id="titulo" data-testid="titulo">${o.texto ?? 'Configuración'}</h1>
    ${o.sinTarjeta ? '' : '<div id="tarjeta" data-testid="tarjeta"></div>'}`);
}

test.describe('F6-02 · arnés de geometría', () => {
  test('lee la capa de la huella y, si se repite el nombre, la del índice pedido', () => {
    expect(buscarCapa(TITULO)).toMatchObject({
      x: 200,
      y: 49,
      w: 167,
      h: 35,
      font: 'Nunito Bold 26',
      fill: 'tinta',
    });
    expect(buscarCapa({ ...TITULO, indice: 0 })).toMatchObject({ y: 19, font: 'Nunito Regular 13' });
    expect(() => buscarCapa({ ...TITULO, capa: 'No existe' })).toThrow(/no tiene la capa/);
  });

  test('busca la capa también en la base de una huella de diferencias', () => {
    // 204-1766 (Filtrar etiquetas) solo trae el selector; el botón «Ir · Más reportes» está en su base 204-1683.
    expect(buscarCapa({ testid: 'x', huella: '204-1766', capa: 'Ir · Más reportes' })).toMatchObject({
      x: 1033,
      y: 48,
      w: 36,
      h: 36,
    });
  });

  test('traslada y estira la caja según el anclaje de la spec', () => {
    const base = { x: 1029, y: 496, w: 48, h: 48 };
    const marco = { width: 1200, height: 800 };
    expect(cajaEsperada(base, {}, marco)).toEqual(base);
    expect(cajaEsperada(base, { h: 'derecha', v: 'abajo' }, marco)).toEqual({
      x: 1136,
      y: 736,
      w: 48,
      h: 48,
    });
    expect(cajaEsperada(base, { h: 'centro' }, marco)).toEqual({ ...base, x: 1082.5 });
    expect(
      cajaEsperada({ x: 200, y: 104, w: 842, h: 326 }, { h: 'estira' }, { width: 960, height: 600 }),
    ).toEqual({
      x: 200,
      y: 104,
      w: 709,
      h: 326,
    });
    expect(
      cajaEsperada(
        { x: 200, y: 104, w: 842, h: 326 },
        { ancho: (m) => Math.min(842, m.width - 176 - 48) },
        marco,
      ),
    ).toMatchObject({ w: 842 });
  });

  test('lee las fuentes de las huellas en sus dos formatos', () => {
    expect(leerFuente('Nunito Bold 26')).toEqual({
      familia: 'Nunito',
      peso: 700,
      tamano: 26,
      alto: undefined,
    });
    expect(leerFuente('Nunito M 15')).toMatchObject({ peso: 500, tamano: 15 });
    expect(leerFuente('Space Grotesk SemiBold 12/16')).toEqual({
      familia: 'Space Grotesk',
      peso: 600,
      tamano: 12,
      alto: 16,
    });
  });

  for (const tamano of [MARCO_REFERENCIA, ...TAMANOS])
    test(`sin diferencias cuando la pantalla es igual a la huella (${tamano.width}×${tamano.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(tamano);
      await pintar(page);
      expect(await compararPantalla(page, [TITULO, TARJETA])).toEqual([]);
    });

  test('acepta ±2 px y rechaza 3 px', async ({ page }) => {
    await page.setViewportSize(MARCO_REFERENCIA);
    await pintar(page, { dx: 2 });
    expect(await compararPantalla(page, [TITULO])).toEqual([]);
    await pintar(page, { dx: 3 });
    expect(await compararPantalla(page, [TITULO])).toEqual(['titulo: x = 203.0, la huella pide 200 (±2)']);
  });

  test('detecta el ancho que no se estiró, el relleno, el peso, el texto y la capa que falta', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await pintar(page, { ancho: 842, relleno: '#ff0000', peso: 400, texto: 'Ajustes' });
    expect(await compararPantalla(page, [TITULO, TARJETA])).toEqual([
      'titulo: peso 400, la huella pide 700',
      'titulo: texto «Ajustes», la huella pide «Configuración»',
      'tarjeta: w = 842.0, la huella pide 949 (±2)',
      'tarjeta: relleno rgb(255, 0, 0), la huella pide superficie (rgb(255, 255, 255))',
    ]);
    await pintar(page, { sinTarjeta: true });
    expect(await compararPantalla(page, [TARJETA])).toEqual(['tarjeta: no está en la pantalla']);
  });

  test('usa la caja de la spec cuando la huella no la trae (FC-HUELLAS)', async ({ page }) => {
    await page.setViewportSize(MARCO_REFERENCIA);
    await pintar(page);
    // 83-4-diff-familias.json no trae cajas por capa: la fila lleva la de la spec.
    const fila: Fila = {
      testid: 'tarjeta',
      huella: '83-4-diff-familias',
      caja: { x: 200, y: 104, w: 842, h: 326 },
    };
    expect(await compararPantalla(page, [fila])).toEqual([]);
    expect(await compararPantalla(page, [{ ...fila, caja: { x: 88, y: 48, w: 424, h: 160 } }])).toHaveLength(
      4,
    );
  });
});
