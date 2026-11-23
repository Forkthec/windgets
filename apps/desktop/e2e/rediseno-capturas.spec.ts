import { expect, test, type Page } from '@playwright/test';

// P28 · Capturas de las pantallas de cuenta (docs/rediseno.md, «Reglas de implementación del rediseño», regla 11):
// cada pantalla al tamaño de su marco del Figma y a 1200 × 800 (el tamaño con que abre la ventana), en claro y
// oscuro. Solo corren en el contenedor `windgets-ci` (`verificar.sh` pone WG_CAPTURAS=1), para que el render sea el
// mismo en cualquier computador; las capturas de referencia están junto a este archivo.
// Para regenerarlas tras un cambio visual aprobado, en el contenedor y con /src escribible: instalar, correr
// `WG_CAPTURAS=1 pnpm --filter desktop exec playwright test rediseno-capturas --update-snapshots` y copiar a /src la
// carpeta `e2e/rediseno-capturas.spec.ts-snapshots`.

test.skip(!process.env.WG_CAPTURAS, 'Las capturas solo se comparan en el contenedor windgets-ci');

type Modo = 'claro' | 'oscuro';

interface Pantalla {
  nombre: string;
  marco: { width: number; height: number };
  abrir: (page: Page) => Promise<void>;
}

const PANTALLAS: Pantalla[] = [
  {
    // Figma 66:4
    nombre: 'inicio-de-sesion',
    marco: { width: 1240, height: 820 },
    abrir: async (page) => {
      await expect(page.getByRole('main', { name: 'Inicio de sesión' })).toBeVisible();
    },
  },
  {
    // Figma 66:162
    nombre: 'registro',
    marco: { width: 1240, height: 930 },
    abrir: async (page) => {
      await page.getByRole('link', { name: 'Regístrate' }).click();
      await expect(page.getByRole('main', { name: 'Registro' })).toBeVisible();
    },
  },
  {
    // Figma 84:2
    nombre: 'verificar-correo',
    marco: { width: 1280, height: 790 },
    abrir: async (page) => {
      await page.getByRole('link', { name: 'Regístrate' }).click();
      await page.getByLabel('Alias', { exact: true }).fill('Ana');
      await page.getByLabel('Correo electrónico').fill('ana@example.com');
      await page.getByLabel('Contraseña', { exact: true }).fill('Clave123');
      await page.getByLabel('Confirmar contraseña').fill('Clave123');
      await page.getByRole('button', { name: 'Crear cuenta' }).click();
      await expect(page.getByRole('region', { name: 'Verificar correo' })).toBeVisible();
      // El mensaje de resultado dura 4 s (RNF-27): se espera a que se vaya para que la captura no dependa del tiempo.
      await expect(page.locator('.wg-resultado')).toBeHidden({ timeout: 10_000 });
    },
  },
  {
    // Figma 84:22
    nombre: 'recuperar-correo',
    marco: { width: 1280, height: 790 },
    abrir: async (page) => {
      await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
      await expect(page.getByRole('main', { name: 'Recuperar contraseña' })).toBeVisible();
    },
  },
  {
    // Figma 84:42
    nombre: 'diligenciar-codigo',
    marco: { width: 1280, height: 790 },
    abrir: async (page) => {
      await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
      await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('usuario.prueba@example.com');
      await page.getByRole('button', { name: 'Enviar código' }).click();
      await expect(page.getByLabel('Código de verificación')).toBeVisible();
    },
  },
  {
    // Figma 84:62
    nombre: 'nueva-contrasena',
    marco: { width: 1280, height: 790 },
    abrir: async (page) => {
      await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
      await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('usuario.prueba@example.com');
      await page.getByRole('button', { name: 'Enviar código' }).click();
      await page.getByLabel('Código de verificación').fill('123456');
      await page.getByRole('button', { name: 'Verificar' }).click();
      await expect(page.getByRole('region', { name: 'Nueva contraseña' })).toBeVisible();
    },
  },
];

const TAMANOS = (p: Pantalla) => [
  { etiqueta: 'marco', ...p.marco },
  { etiqueta: '1200x800', width: 1200, height: 800 },
];

for (const pantalla of PANTALLAS) {
  for (const modo of ['claro', 'oscuro'] as Modo[]) {
    for (const tamano of TAMANOS(pantalla)) {
      test(`Captura · ${pantalla.nombre} · ${modo} · ${tamano.etiqueta}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: modo === 'claro' ? 'light' : 'dark' });
        await page.setViewportSize({ width: tamano.width, height: tamano.height });
        await page.goto('/');
        await pantalla.abrir(page);
        await expect(page.locator('.wg-cuenta-raiz')).toHaveAttribute('data-modo', modo);
        // Sin foco en ningún campo, para que la captura no dependa de por dónde entró el recorrido.
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${pantalla.nombre}-${modo}-${tamano.etiqueta}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.01,
          // La cuenta regresiva del reenvío cambia con el tiempo.
          mask: [page.locator('.wg-motivo')],
        });
      });
    }
  }
}
