// HE-10-HU01 · Consultar las tarjetas en el calendario en vista mensual. Una prueba por CA en la vista; las reglas
// del Núcleo tienen su prueba ca_he_10_hu01_* en servicio_del_planificador/pruebas_del_calendario.rs. Hoy es el
// sábado 14/11/2026.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '@/types';
import { abrirPantalla, fijarHoy, llamadasA, screen, tarjeta } from '../kanban/pruebas';
import { Calendario } from './Calendario';

beforeEach(() => {
  fijarHoy();
});
afterEach(() => {
  vi.useRealTimers();
});

function abrir(tarjetas: Card[] = []) {
  return abrirPantalla('calendar', 'Calendario', Calendario, tarjetas);
}

async function elegir(opcion: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: opcion }));
  });
}

/** La celda del día `numero` del mes que se muestra. */
function dia(numero: number) {
  const celda = within(screen.getByRole('table'))
    .getAllByRole('cell')
    .find((c) => c.querySelector('.wg-calendario__numero')?.textContent === String(numero));
  if (!celda) throw new Error(`No está el día ${numero}`);
  return celda;
}

/** Los títulos y el «+N más» de un día. */
function contenido(numero: number) {
  const celda = dia(numero);
  return {
    titulos: within(celda)
      .queryAllByRole('listitem')
      .map((li) => li.textContent),
    mas: celda.querySelector('.wg-calendario__mas')?.textContent ?? null,
  };
}

/** Los números de los días del mes, en orden. */
function numeros() {
  return Array.from(document.querySelectorAll('.wg-calendario__numero')).map((n) => Number(n.textContent));
}

describe('HE-10-HU01 · Calendario en vista mensual', () => {
  it('HE-10-HU01-CA01 · Abrir la vista mensual', async () => {
    const nucleo = await abrir([
      tarjeta({ title: 'Entregar informe', due_date: '2026-11-20' }),
      tarjeta({ title: 'Pagar la luz', due_date: '2026-11-14' }),
    ]);
    // ET01: al abrir, el mes actual (IPC-CARD-12 con el mes del computador).
    expect(llamadasA(nucleo, 'calendar_get_month')).toEqual([{ year: 2026, month: 11 }]);
    // ET02: el nombre del mes y el año, los días de lunes a domingo y el día actual resaltado.
    expect(screen.getByRole('heading', { name: 'Noviembre 2026' })).toBeTruthy();
    expect(screen.getAllByRole('columnheader').map((d) => d.textContent)).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ]);
    // El 1 de noviembre de 2026 es domingo: va en la última columna de la primera semana.
    const primeraSemana = screen.getAllByRole('row')[1];
    expect(primeraSemana && within(primeraSemana).getAllByRole('cell').at(-1)?.textContent).toBe('1');
    expect(numeros()).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(screen.getByRole('cell', { current: 'date' })).toBe(dia(14));
    expect(document.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
    // ET03: cada tarjeta en el día de su fecha límite, con su título.
    expect(contenido(20).titulos).toEqual(['Entregar informe']);
    expect(contenido(14).titulos).toEqual(['Pagar la luz']);
    // ET04: las opciones de la vista.
    for (const opcion of ['Mes anterior', 'Mes siguiente', 'Hoy', 'Mes', 'Semana']) {
      expect(screen.getByRole('button', { name: opcion })).toBeTruthy();
    }
  });

  it('HE-10-HU01-CA02 · Más de 3 tarjetas en un día', async () => {
    await abrir([1, 2, 3, 4, 5].map((i) => tarjeta({ title: `Tarjeta ${i}`, due_date: '2026-11-20' })));
    // ET05: 3 títulos y «+2 más».
    expect(contenido(20)).toEqual({ titulos: ['Tarjeta 1', 'Tarjeta 2', 'Tarjeta 3'], mas: '+2 más' });
  });

  it('HE-10-HU01-CA03 · Navegar al mes siguiente', async () => {
    const nucleo = await abrir([tarjeta({ title: 'Navidad', due_date: '2026-12-24' })]);
    await elegir('Mes siguiente');
    // ET06: de a un mes, con su nombre y su año y las tarjetas de ese mes.
    expect(llamadasA(nucleo, 'calendar_get_month').at(-1)).toEqual({ year: 2026, month: 12 });
    expect(screen.getByRole('heading', { name: 'Diciembre 2026' })).toBeTruthy();
    expect(numeros()).toHaveLength(31);
    expect(contenido(24).titulos).toEqual(['Navidad']);
    // Diciembre no tiene el día actual.
    expect(screen.queryByRole('cell', { current: 'date' })).toBeNull();
    await elegir('Mes siguiente');
    expect(screen.getByRole('heading', { name: 'Enero 2027' })).toBeTruthy();
  });

  it('HE-10-HU01-CA04 · Navegar al mes anterior', async () => {
    const nucleo = await abrir([tarjeta({ title: 'Informe de octubre', due_date: '2026-10-31' })]);
    await elegir('Mes anterior');
    expect(llamadasA(nucleo, 'calendar_get_month').at(-1)).toEqual({ year: 2026, month: 10 });
    expect(screen.getByRole('heading', { name: 'Octubre 2026' })).toBeTruthy();
    expect(contenido(31).titulos).toEqual(['Informe de octubre']);
  });

  it('HE-10-HU01-CA05 · Ir al mes actual', async () => {
    await abrir();
    await elegir('Mes anterior');
    await elegir('Mes anterior');
    expect(screen.getByRole('heading', { name: 'Septiembre 2026' })).toBeTruthy();
    // ET07: «Hoy» vuelve al mes actual con el día actual resaltado.
    await elegir('Hoy');
    expect(screen.getByRole('heading', { name: 'Noviembre 2026' })).toBeTruthy();
    expect(screen.getByRole('cell', { current: 'date' })).toBe(dia(14));
  });

  it('HE-10-HU01-CA06 · Mes sin tarjetas', async () => {
    await abrir([tarjeta({ title: 'Otro mes', due_date: '2026-12-01' })]);
    // Todos los días del mes, sin tarjetas.
    expect(numeros()).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(within(screen.getByRole('table')).queryAllByRole('listitem')).toEqual([]);
    expect(document.querySelectorAll('.wg-calendario__mas')).toHaveLength(0);
  });
});
