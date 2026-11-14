import { expect, test } from '@playwright/test';

// P05 · Cuentas (HE-01-HU01 a HU04): los recorridos de la ventana principal en un navegador real, con el
// Núcleo simulado (src/ipc/simulado.ts). Cada CA (criterio de aceptación) tiene su prueba en Vitest; aquí se
// comprueba que las tres pantallas funcionan juntas.

test('HE-01-HU04-CA01 · Iniciar sesión con la cuenta de prueba abre el Planificador diario', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('main', { name: 'Inicio de sesión' })).toBeVisible();
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña').fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  // El Planificador diario aún no está construido (P09): la pantalla vacía existe pero no tiene alto.
  await expect(page.getByRole('main', { name: 'Planificador diario', includeHidden: true })).toBeAttached();
});

test('HE-01-HU04-CA08 · Contraseña incorrecta muestra el mensaje sin abrir la aplicación', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña').fill('Otra123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('alert')).toHaveText('Correo electrónico o contraseña incorrectos.');
  await expect(page.getByRole('main', { name: 'Planificador diario' })).toHaveCount(0);
});

test('HE-01-HU04-CA03 · Iniciar sesión sin datos muestra los dos mensajes a la vez', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Este campo es obligatorio.')).toHaveCount(2);
});

test('HE-01-HU01-CA01 y HE-01-HU03-CA01 · Registrar una cuenta y verificar el correo abre el Planificador diario', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Regístrate' }).click();
  await page.getByLabel('Alias', { exact: true }).fill('Ana');
  await page.getByLabel('Correo electrónico').fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Clave123');
  await page.getByLabel('Confirmar contraseña').fill('Clave123');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('region', { name: 'Verificar correo' })).toBeVisible();
  await page.getByLabel('Código de verificación').fill('123456');
  await page.getByRole('button', { name: 'Verificar' }).click();
  // El Planificador diario aún no está construido (P09): la pantalla vacía existe pero no tiene alto.
  await expect(page.getByRole('main', { name: 'Planificador diario', includeHidden: true })).toBeAttached();
});
