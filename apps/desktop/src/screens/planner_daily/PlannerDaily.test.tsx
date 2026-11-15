// HE-12-HU01 · Consultar el planificador diario con las tarjetas de hoy. Una prueba por CA en la vista; las
// reglas del Núcleo tienen su prueba ca_he_12_hu01_* en servicio_del_planificador/pruebas_del_planificador_diario.rs.
// Hoy es el 14/11/2026.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirPantalla, fijarHoy, HECHO, HOY, screen, tarjeta } from '../kanban/pruebas';
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
