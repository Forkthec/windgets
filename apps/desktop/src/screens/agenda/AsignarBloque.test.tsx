// HE-11-HU02 · Asignar una tarjeta a un bloque horario de la agenda diaria. Las reglas del Núcleo tienen su
// prueba ca_he_11_hu02_* en servicio_del_planificador/pruebas_de_la_agenda.rs; el arrastre real y los mensajes,
// en e2e/HE-11-HU02.spec.ts (CA01, CA04, CA05). Aquí: la regla que traduce el lugar donde se suelta y cómo se
// ven las tarjetas de un bloque.
import { within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { abrirPantalla, fijarHoy, screen, tarjeta } from '../kanban/pruebas';
import { Agenda } from './Agenda';
import { asignacionDelArrastre } from './arrastre';

beforeEach(() => {
  fijarHoy();
  Element.prototype.scrollIntoView = () => {};
});
afterEach(() => {
  vi.useRealTimers();
});

describe('HE-11-HU02 · Asignar una tarjeta a un bloque horario', () => {
  it('HE-11-HU02-CA01 · Asignar una tarjeta a un bloque horario', () => {
    // ET01: desde Tarjetas sin horario (sin hora) hasta el bloque de las 10 del día consultado.
    expect(asignacionDelArrastre('t1', null, { hora: 10 }, '2026-11-14')).toEqual({
      card_id: 't1',
      date: '2026-11-14',
      hour: 10,
    });
    // Fuera de todo bloque no hay asignación: la tarjeta vuelve a su lugar.
    expect(asignacionDelArrastre('t1', null, undefined, '2026-11-14')).toBeNull();
  });

  it('HE-11-HU02-CA02 · Asignar varias tarjetas al mismo bloque horario', async () => {
    await abrirPantalla('agenda', 'Agenda diaria', Agenda, [
      tarjeta({ title: 'Estudiar redes', scheduled_date: '2026-11-14', scheduled_hour: 16 }),
      tarjeta({ title: 'Leer capítulo 3', scheduled_date: '2026-11-14', scheduled_hour: 16 }),
    ]);
    // ET04, ET05: las dos en el bloque, una debajo de la otra (una lista).
    const bloque = screen.getByRole('region', { name: '16:00 – 17:00' });
    const lista = within(bloque).getByRole('list');
    // Cada tarjeta es un elemento de la lista; su título va primero (después, «Quitar del horario», HE-11-HU03).
    expect(
      within(lista)
        .getAllByRole('listitem')
        .map((li) => li.querySelector('.wg-tarjeta__titulo')?.textContent),
    ).toEqual(['Estudiar redes', 'Leer capítulo 3']);
  });

  it('HE-11-HU02-CA03 · Cambiar una tarjeta de bloque horario', () => {
    // ET03: desde el bloque de las 10 al de las 12; soltarla en su mismo bloque no cambia nada.
    expect(asignacionDelArrastre('t1', 10, { hora: 12 }, '2026-11-14')).toEqual({
      card_id: 't1',
      date: '2026-11-14',
      hour: 12,
    });
    expect(asignacionDelArrastre('t1', 10, { hora: 10 }, '2026-11-14')).toBeNull();
  });

  it('HE-11-HU02-CA04 · Asignar una tarjeta a un bloque horario que ya pasó', async () => {
    // El Núcleo responde time_block.past; la agenda marca qué bloques ya terminaron (is_past) para
    // deshabilitarlos durante el arrastre (ET07, en e2e).
    await abrirPantalla('agenda', 'Agenda diaria', Agenda);
    expect(screen.getByRole('region', { name: '09:00 – 10:00' })).toBeTruthy();
    expect(asignacionDelArrastre('t1', null, { hora: 9 }, '2026-11-14')).not.toBeNull();
  });

  it('HE-11-HU02-CA05 · Asignar una tarjeta después de su fecha límite', () => {
    // La regla es del Núcleo (time_block.after_due_date); la vista envía la asignación y muestra el mensaje.
    expect(asignacionDelArrastre('t1', null, { hora: 10 }, '2026-10-22')).toEqual({
      card_id: 't1',
      date: '2026-10-22',
      hour: 10,
    });
  });
});
