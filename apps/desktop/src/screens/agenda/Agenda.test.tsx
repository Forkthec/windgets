// HE-11-HU01 · Consultar la agenda diaria. Una prueba por CA en la vista; las reglas del Núcleo tienen su prueba
// ca_he_11_hu01_* en servicio_del_planificador/pruebas_de_la_agenda.rs. Hoy es el 14/11/2026 y son las 14:25.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirPantalla, fijarHoy, HECHO, llamadasA, screen, tarjeta } from '../kanban/pruebas';
import { Agenda } from './Agenda';

let ubicados: Element[];

beforeEach(() => {
  fijarHoy();
  ubicados = [];
  // jsdom no desplaza: se registra en qué bloque se ubicó la vista.
  Element.prototype.scrollIntoView = function (this: Element) {
    ubicados.push(this);
  };
});
afterEach(() => {
  vi.useRealTimers();
});

function bloque(texto: string) {
  return screen.getByRole('region', { name: texto });
}

function sinHorario() {
  return screen.getByRole('region', { name: 'Tarjetas sin horario' });
}

/** El bloque donde quedó ubicada la vista. */
function bloqueUbicado() {
  return ubicados.at(-1)?.querySelector('h3')?.textContent;
}

async function elegir(opcion: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: opcion }));
  });
}

describe('HE-11-HU01 · Agenda diaria', () => {
  it('HE-11-HU01-CA01 · Consultar la agenda diaria de hoy', async () => {
    await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Estudiar redes', scheduled_date: '2026-11-14', scheduled_hour: 16 }),
      tarjeta({ title: 'Pagar la luz' }),
      tarjeta({ title: 'Leer capítulo 3', column_id: HECHO.id, is_completed: true }),
    ]);
    // ET02: la fecha de hoy y las tres opciones.
    expect(screen.getByRole('heading', { name: '14/11/2026' })).toBeTruthy();
    for (const opcion of ['Día anterior', 'Día siguiente', 'Hoy']) {
      expect(screen.getByRole('button', { name: opcion })).toBeTruthy();
    }
    // ET01: 24 bloques de 00:00 a 23:00 y la vista en el bloque de la hora actual.
    const horas = within(screen.getByRole('list', { name: 'Bloques horarios' })).getAllByRole('heading');
    expect(horas).toHaveLength(24);
    expect(horas[0]?.textContent).toBe('00:00 – 01:00');
    expect(horas[23]?.textContent).toBe('23:00 – 00:00');
    expect(bloqueUbicado()).toBe('14:00 – 15:00');
    // ET03, ET04
    expect(within(bloque('16:00 – 17:00')).getByRole('button', { name: 'Estudiar redes' })).toBeTruthy();
    const pendientes = within(sinHorario())
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(pendientes).toEqual(['Pagar la luz']);
  });

  it('HE-11-HU01-CA02 · Navegar al día siguiente', async () => {
    await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Estudiar redes', scheduled_date: '2026-11-15', scheduled_hour: 9 }),
    ]);
    expect(within(bloque('09:00 – 10:00')).queryByText('Estudiar redes')).toBeNull();
    await elegir('Día siguiente');
    // ET06
    expect(screen.getByRole('heading', { name: '15/11/2026' })).toBeTruthy();
    expect(within(bloque('09:00 – 10:00')).getByRole('button', { name: 'Estudiar redes' })).toBeTruthy();
  });

  it('HE-11-HU01-CA03 · Navegar al día anterior', async () => {
    await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Leer capítulo 3', scheduled_date: '2026-11-13', scheduled_hour: 8 }),
    ]);
    await elegir('Día anterior');
    expect(screen.getByRole('heading', { name: '13/11/2026' })).toBeTruthy();
    expect(within(bloque('08:00 – 09:00')).getByRole('button', { name: 'Leer capítulo 3' })).toBeTruthy();
  });

  it('HE-11-HU01-CA04 · Sin tarjetas por programar', async () => {
    await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Hecha', column_id: HECHO.id, is_completed: true }),
      tarjeta({ title: 'Con bloque', scheduled_date: '2026-11-18', scheduled_hour: 10 }),
    ]);
    // ET05
    expect(within(sinHorario()).getByText('No tienes tarjetas pendientes por programar.')).toBeTruthy();
  });

  it('HE-11-HU01-CA05 · Volver al día de hoy', async () => {
    await abrirPantalla('agenda', 'Agenda diaria', Agenda);
    await elegir('Día siguiente');
    await elegir('Día siguiente');
    ubicados = [];
    await elegir('Hoy');
    // ET07: la fecha de hoy y la vista en el bloque de la hora actual (D-169).
    expect(screen.getByRole('heading', { name: '14/11/2026' })).toBeTruthy();
    expect(bloqueUbicado()).toBe('14:00 – 15:00');
  });

  it('HE-11-HU01-CA06 · Consultar la agenda diaria sin conexión', async () => {
    // ET08: la agenda sale de la base local del Núcleo; sin conexión la vista no cambia. El indicador
    // «Sin conexión» es de HE-15-HU02.
    await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Estudiar redes', scheduled_date: '2026-11-14', scheduled_hour: 16 }),
    ]);
    expect(within(bloque('16:00 – 17:00')).getByRole('button', { name: 'Estudiar redes' })).toBeTruthy();
  });

  it('el título de una tarjeta abre el Detalle de tarjeta (T-090)', async () => {
    await abrirPantalla('agenda', 'Agenda diaria', Agenda, [tarjeta({ title: 'Pagar la luz' })]);
    await elegir('Pagar la luz');
    expect(screen.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeTruthy();
  });
});

describe('HE-11-HU03 · Quitar una tarjeta de un bloque horario', () => {
  it('HE-11-HU03-CA01 · Quitar una tarjeta de un bloque horario', async () => {
    const nucleo = await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Estudiar redes', scheduled_date: '2026-11-14', scheduled_hour: 10 }),
      tarjeta({ title: 'Pagar la luz' }),
    ]);
    // ET01: la tarjeta del bloque ofrece «Quitar del horario»; las de Tarjetas sin horario no.
    expect(within(sinHorario()).queryByRole('button', { name: 'Quitar del horario' })).toBeNull();
    await act(async () => {
      fireEvent.click(within(bloque('10:00 – 11:00')).getByRole('button', { name: 'Quitar del horario' }));
    });
    expect(llamadasA(nucleo, 'card_unassign_time_block')).toEqual([{ card_id: nucleo.tarjetas[0]?.id }]);
    // ET02: sale del bloque, vuelve a Tarjetas sin horario y no se elimina.
    expect(within(bloque('10:00 – 11:00')).queryByRole('button', { name: 'Estudiar redes' })).toBeNull();
    const pendientes = within(sinHorario())
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(pendientes).toEqual(['Estudiar redes', 'Pagar la luz']);
    expect(llamadasA(nucleo, 'card_delete')).toEqual([]);
    // ET03: el mensaje de resultado (RT-04).
    expect(screen.getByText('Tarjeta quitada del horario.')).toBeTruthy();
  });

  it('HE-11-HU03-CA02 · Efecto de quitar la tarjeta en el planificador diario', async () => {
    const redes = tarjeta({
      title: 'Estudiar redes',
      due_date: '2026-11-15',
      scheduled_date: '2026-11-14',
      scheduled_hour: 10,
    });
    const nucleo = await abrirPantalla('agenda', 'Agenda diaria', Agenda, [redes]);
    const delDia = async () => {
      const r = await nucleo.invocar('planner_get_today', {});
      return r.ok ? r.value.items.map((i) => i.card.title) : [];
    };
    expect(await delDia()).toEqual(['Estudiar redes']);
    await act(async () => {
      fireEvent.click(within(bloque('10:00 – 11:00')).getByRole('button', { name: 'Quitar del horario' }));
    });
    // ET04, ET05: sin bloque de hoy y con fecha límite mañana, deja de estar en el planificador diario (y en el
    // widget Tareas del día, que lee lo mismo: IPC-CARD-08).
    expect(await delDia()).toEqual([]);
  });
});
