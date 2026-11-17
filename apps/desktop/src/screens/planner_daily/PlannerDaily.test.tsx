// HE-12-HU01 · Consultar el planificador diario con las tarjetas de hoy; HE-12-HU02 · Alternar la casilla de
// completada; HE-12-HU03 · Consultar el resumen de avance del día. Una prueba por CA en la vista; las reglas del
// Núcleo tienen sus pruebas en servicio_del_planificador/pruebas_del_planificador_diario.rs y
// pruebas_de_completar.rs. Hoy es el 14/11/2026.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  abrirPantalla,
  EN_PROGRESO,
  fijarHoy,
  HECHO,
  HOY,
  llamadasA,
  POR_HACER,
  screen,
  tarjeta,
} from '../kanban/pruebas';
import { PlannerDaily } from './PlannerDaily';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

function abrir(tarjetas: Parameters<typeof abrirPantalla>[3] = []) {
  return abrirPantalla('planner_daily', 'Planificador diario', PlannerDaily, tarjetas);
}

/** Cada tarjeta de la lista como «título · hora · prioridad». */
function lista() {
  return within(screen.getByRole('list', { name: 'Tarjetas de hoy' }))
    .getAllByRole('listitem')
    .map((li) =>
      Array.from(li.children)
        .filter((h) => h.tagName !== 'INPUT')
        .map((h) => h.textContent)
        .join(' · '),
    );
}

describe('HE-12-HU01 · Planificador diario', () => {
  it('HE-12-HU01-CA01 · Consultar el planificador diario', async () => {
    await abrir([
      tarjeta({ title: 'Pagar la luz', due_date: HOY, priority: 'high' }),
      tarjeta({ title: 'Estudiar redes', scheduled_date: HOY, scheduled_hour: 10 }),
      tarjeta({ title: 'Leer capítulo 3', scheduled_date: HOY, scheduled_hour: 8, priority: 'low' }),
      tarjeta({ title: 'Otro día', due_date: '2026-11-20' }),
    ]);
    // ET01: la fecha de hoy. ET02 a ET05: en ese orden, con hora HH:MM si la tiene y prioridad.
    expect(screen.getByRole('heading', { name: '14/11/2026' })).toBeTruthy();
    expect(lista()).toEqual([
      'Leer capítulo 3 · 08:00 · Baja',
      'Estudiar redes · 10:00',
      'Pagar la luz · Alta',
    ]);
    // Cada una con su casilla de completada.
    for (const titulo of ['Leer capítulo 3', 'Estudiar redes', 'Pagar la luz']) {
      expect(screen.getByRole('checkbox', { name: titulo })).toBeTruthy();
    }
  });

  it('HE-12-HU01-CA02 · Tarjeta con fecha límite y bloque horario de hoy sin duplicados', async () => {
    await abrir([
      tarjeta({ title: 'Estudiar redes', due_date: HOY, scheduled_date: HOY, scheduled_hour: 10 }),
    ]);
    expect(lista()).toEqual(['Estudiar redes · 10:00']);
  });

  it('HE-12-HU01-CA03 · Sin tarjetas para hoy', async () => {
    await abrir([tarjeta({ title: 'Otro día', due_date: '2026-11-20' })]);
    expect(screen.getByText('No tienes tarjetas para hoy.')).toBeTruthy(); // ET06
  });

  it('HE-12-HU01-CA04 · Tarjeta completada en el planificador diario', async () => {
    await abrir([tarjeta({ title: 'Pagar la luz', due_date: HOY, column_id: HECHO.id, is_completed: true })]);
    // ET07: tachada y con la casilla marcada.
    const casilla = screen.getByRole('checkbox', { name: 'Pagar la luz' }) as HTMLInputElement;
    expect(casilla.checked).toBe(true);
    expect(casilla.closest('li')?.classList.contains('wg-tachada')).toBe(true);
  });

  it('HE-12-HU01-CA05 · Consultar el planificador diario sin conexión', async () => {
    // ET09: sale de la base local del Núcleo. El indicador «Sin conexión» es de HE-15-HU02.
    await abrir([tarjeta({ title: 'Estudiar redes', scheduled_date: HOY, scheduled_hour: 10 })]);
    expect(lista()).toEqual(['Estudiar redes · 10:00']);
  });

  it('el título de una tarjeta abre el Detalle de tarjeta (T-090)', async () => {
    await abrir([tarjeta({ title: 'Pagar la luz', due_date: HOY })]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pagar la luz' }));
    });
    expect(screen.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeTruthy();
  });
});

/** Alterna la casilla de completada de una tarjeta. */
async function alternar(titulo: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox', { name: titulo }));
  });
}

function tachada(titulo: string) {
  return screen.getByRole('checkbox', { name: titulo }).closest('li')?.classList.contains('wg-tachada');
}

/** Los textos del resumen de avance. */
function resumen() {
  return Array.from(screen.getByRole('region', { name: 'Resumen de avance' }).children).map(
    (h) => h.textContent,
  );
}

/** «Pagar la luz» completada, que venía de la columna indicada. */
function completada(anterior: string) {
  return tarjeta({
    title: 'Pagar la luz',
    due_date: HOY,
    column_id: HECHO.id,
    previous_column_id: anterior,
    completed_on: HOY,
    is_completed: true,
  });
}

describe('HE-12-HU02 · Casilla de completada en el planificador diario', () => {
  it('HE-12-HU02-CA01 · Marcar una tarjeta como completada', async () => {
    const pagar = tarjeta({ title: 'Pagar la luz', due_date: HOY, column_id: EN_PROGRESO.id });
    const nucleo = await abrir([pagar]);
    await alternar('Pagar la luz');
    expect(llamadasA(nucleo, 'card_set_completed')).toEqual([{ card_id: pagar.id, completed: true }]);
    // ET02: en Hecho. ET05: tachada. ET07: el mensaje de resultado (RT-04).
    expect(pagar.column_id).toBe(HECHO.id);
    expect(tachada('Pagar la luz')).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('¡Bien hecho! Tarjeta completada.');
  });

  it('HE-12-HU02-CA02 · Desmarcar una tarjeta completada', async () => {
    const pagar = completada(EN_PROGRESO.id);
    const nucleo = await abrir([pagar]);
    await alternar('Pagar la luz');
    expect(llamadasA(nucleo, 'card_set_completed')).toEqual([{ card_id: pagar.id, completed: false }]);
    // ET03: vuelve a En progreso, sin tachar y sin mensaje.
    expect(pagar.column_id).toBe(EN_PROGRESO.id);
    expect(tachada('Pagar la luz')).toBe(false);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('HE-12-HU02-CA03 · Desmarcar una tarjeta cuya columna anterior fue eliminada', async () => {
    // La columna Revisión ya no existe (ET04).
    const pagar = completada('col-revision');
    await abrir([pagar]);
    await alternar('Pagar la luz');
    expect(pagar.column_id).toBe(POR_HACER.id);
    expect(tachada('Pagar la luz')).toBe(false);
  });
});

describe('HE-12-HU03 · Resumen de avance del día', () => {
  /** 3 tarjetas para hoy: «Pagar la luz» y otras dos, con las completadas indicadas. */
  function tres(completadas: number, pagarCompletada: boolean) {
    const otras = [
      tarjeta({ title: 'Estudiar redes', due_date: HOY }),
      tarjeta({ title: 'Leer capítulo 3', due_date: HOY }),
    ];
    const pagar = pagarCompletada
      ? completada(EN_PROGRESO.id)
      : tarjeta({ title: 'Pagar la luz', due_date: HOY });
    const resto = completadas - (pagarCompletada ? 1 : 0);
    otras.slice(0, resto).forEach((t) => Object.assign(t, { column_id: HECHO.id, is_completed: true }));
    return [pagar, ...otras];
  }

  it('HE-12-HU03-CA01 · Consultar el resumen de avance', async () => {
    await abrir(tres(2, false));
    // ET01 a ET03: 2 ÷ 3 = 66,7 → «67 %».
    expect(resumen()).toEqual(['Completadas: 2 de 3', 'Te quedan 1', '67 %']);
  });

  it('HE-12-HU03-CA02 · Resumen actualizado al marcar una tarjeta como completada', async () => {
    await abrir(tres(1, false));
    expect(resumen()).toEqual(['Completadas: 1 de 3', 'Te quedan 2', '33 %']);
    await alternar('Pagar la luz');
    // ET04: sin recargar la pantalla.
    expect(resumen()).toEqual(['Completadas: 2 de 3', 'Te quedan 1', '67 %']);
  });

  it('HE-12-HU03-CA03 · Resumen actualizado al desmarcar una tarjeta completada', async () => {
    await abrir(tres(2, true));
    expect(resumen()).toEqual(['Completadas: 2 de 3', 'Te quedan 1', '67 %']);
    await alternar('Pagar la luz');
    expect(resumen()).toEqual(['Completadas: 1 de 3', 'Te quedan 2', '33 %']);
  });

  it('HE-12-HU03-CA04 · Todas las tarjetas de hoy completadas', async () => {
    await abrir(tres(3, true));
    // ET05 y ET07: sin «Te quedan 0».
    expect(resumen()).toEqual(['Completadas: 3 de 3', '100 %', '¡Completaste todas tus tarjetas de hoy!']);
  });

  it('HE-12-HU03-CA05 · Sin tarjetas para hoy', async () => {
    await abrir([tarjeta({ title: 'Otro día', due_date: '2026-11-20' })]);
    // ET06: solo el estado vacío.
    expect(screen.queryByRole('region', { name: 'Resumen de avance' })).toBeNull();
    expect(screen.getByText('No tienes tarjetas para hoy.')).toBeTruthy();
  });
});
