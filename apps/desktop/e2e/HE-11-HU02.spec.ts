import { expect, test, type Locator, type Page } from '@playwright/test';

// HE-11-HU02 · Asignar una tarjeta a un bloque horario con drag-and-drop: lo que necesita un navegador real.
// Usa la aplicación con el Núcleo simulado (pnpm dev) y la fecha y la hora del navegador. Las reglas del
// Núcleo tienen su prueba ca_he_11_hu02_* en servicio_del_planificador/pruebas_de_la_agenda.rs.

const dos = (n: number) => String(n).padStart(2, '0');

/** DD/MM/AAAA de hoy más `dias`. */
function fecha(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

async function arrastrar(page: Page, desde: Locator, hasta: Locator) {
  const origen = await desde.boundingBox();
  if (!origen) throw new Error('La tarjeta no tiene caja');
  // El bloque se centra en la pantalla: pegado al borde de la tarjeta, el desplazamiento automático de dnd-kit
  // movería la lista mientras se arrastra (P30, docs/rediseno.md RD-32: la pantalla se desplaza dentro de la tarjeta).
  await hasta.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await page.mouse.move(origen.x + origen.width / 2, origen.y + 6);
  await page.mouse.down();
  await page.mouse.move(origen.x + origen.width / 2 + 10, origen.y + 16, { steps: 4 });
  const destino = await hasta.boundingBox();
  if (!destino) throw new Error('El bloque no tiene caja');
  await page.mouse.move(destino.x + destino.width / 2, destino.y + destino.height / 2, { steps: 12 });
  // dnd-kit decide sobre qué está el puntero en el siguiente cuadro: un último movimiento y una espera corta
  // antes de soltar, como hace una persona (en la CI, más lenta, soltar al instante no lo alcanzaba).
  await page.mouse.move(destino.x + destino.width / 2 + 1, destino.y + destino.height / 2 + 1);
  await page.waitForTimeout(150);
  await page.mouse.up();
}

async function crearTarjeta(page: Page, titulo: string, fechaLimite: string) {
  await page.getByRole('button', { name: 'Nueva tarjeta' }).click();
  await page.getByLabel('Título').fill(titulo);
  await page.getByRole('textbox', { name: 'Fecha límite' }).fill(fechaLimite);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

function menu(page: Page, opcion: string) {
  return page.getByRole('navigation', { name: 'Menú principal' }).getByRole('button', { name: opcion });
}

function sinHorario(page: Page) {
  return page.getByRole('region', { name: 'Tarjetas sin horario' });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill('usuario.prueba@example.com');
  await page.getByLabel('Contraseña').fill('Clave123');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await menu(page, 'Tablero Kanban').click();
  await crearTarjeta(page, 'Estudiar redes', fecha(3));
  await crearTarjeta(page, 'Pagar la luz', fecha(0));
  await menu(page, 'Agenda diaria').click();
  await expect(sinHorario(page).getByRole('listitem')).toHaveCount(2);
});

test('HE-11-HU02-CA01 · Asignar una tarjeta a un bloque horario', async ({ page }) => {
  await page.getByRole('button', { name: 'Día siguiente' }).click();
  const bloque = page.getByRole('region', { name: '10:00 – 11:00' });
  await arrastrar(page, sinHorario(page).getByRole('listitem').filter({ hasText: 'Estudiar redes' }), bloque);
  await expect(bloque.getByRole('button', { name: 'Estudiar redes' })).toBeVisible();
  await expect(sinHorario(page).getByText('Estudiar redes')).toHaveCount(0);
  await expect(page.getByText('Tarjeta asignada al bloque 10:00 – 11:00.')).toBeVisible();
});

test('HE-11-HU02-CA04 · Asignar una tarjeta a un bloque horario que ya pasó', async ({ page }) => {
  await page.getByRole('button', { name: 'Día anterior' }).click();
  const bloque = page.getByRole('region', { name: '09:00 – 10:00' });
  await arrastrar(page, sinHorario(page).getByRole('listitem').filter({ hasText: 'Estudiar redes' }), bloque);
  await expect(page.getByText('No puedes asignar tarjetas a un bloque horario que ya pasó.')).toBeVisible();
  await expect(bloque.getByText('Estudiar redes')).toHaveCount(0);
  await expect(sinHorario(page).getByText('Estudiar redes')).toBeVisible();
});

test('HE-11-HU02-CA05 · Asignar una tarjeta después de su fecha límite', async ({ page }) => {
  await page.getByRole('button', { name: 'Día siguiente' }).click();
  const bloque = page.getByRole('region', { name: '10:00 – 11:00' });
  await arrastrar(page, sinHorario(page).getByRole('listitem').filter({ hasText: 'Pagar la luz' }), bloque);
  await expect(page.getByText('No puedes programar la tarjeta después de su fecha límite.')).toBeVisible();
  await expect(sinHorario(page).getByText('Pagar la luz')).toBeVisible();
});
