// HE-10-HU01 · Consultar las tarjetas en el calendario en vista mensual. Una prueba por CA en la vista; las reglas
// del Núcleo tienen su prueba ca_he_10_hu01_* en servicio_del_planificador/pruebas_del_calendario.rs. Hoy es el
// sábado 14/11/2026.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '@/types';
import { mesDelCalendario } from '@/ipc/calendarioSimulado';
import { contraste, derivarTokens } from '@/ui/tema/derivar';
import {
  abrirPantalla,
  EN_PROGRESO,
  fijarHoy,
  HECHO,
  llamadasA,
  POR_HACER,
  screen,
  tarjeta,
} from '../kanban/pruebas';
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
    // docs/rediseno.md RD-53 (Figma 84:188): se ve el día abreviado; el nombre completo es el nombre accesible.
    expect(screen.getAllByRole('columnheader').map((d) => d.getAttribute('aria-label'))).toEqual([
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

/** Los días de la vista semanal: «<día> <fecha>» y sus tarjetas como «hora · título» o «título». */
function semana() {
  return Array.from(document.querySelectorAll('.wg-calendario-semana > section')).map((dia) => ({
    dia: dia.getAttribute('aria-label'),
    tarjetas: within(dia as HTMLElement)
      .queryAllByRole('listitem')
      .map((li) =>
        Array.from(li.children)
          .map((s) => s.textContent)
          .join(' · '),
      ),
  }));
}

describe('HE-10-HU02 · Calendario en vista semanal', () => {
  it('HE-10-HU02-CA01 · Abrir la vista semanal', async () => {
    const nucleo = await abrir([
      ...[1, 2, 3, 4, 5].map((i) => tarjeta({ title: `Tarjeta ${i}`, due_date: '2026-11-11' })),
      tarjeta({ title: 'Pagar la luz', due_date: '2026-11-15' }),
      tarjeta({ title: 'Otra semana', due_date: '2026-11-16' }),
    ]);
    await elegir('Semana');
    // ET01: la semana actual (el lunes 9); ET02: de lunes a domingo.
    expect(llamadasA(nucleo, 'calendar_get_week')).toEqual([{ week_start: '2026-11-09' }]);
    expect(screen.getByRole('heading', { name: 'Semana del 09/11/2026 al 15/11/2026' })).toBeTruthy();
    const dias = semana();
    expect(dias.map((d) => d.dia)).toEqual([
      'Lunes 09/11/2026',
      'Martes 10/11/2026',
      'Miércoles 11/11/2026',
      'Jueves 12/11/2026',
      'Viernes 13/11/2026',
      'Sábado 14/11/2026',
      'Domingo 15/11/2026',
    ]);
    // ET03: cada día con todas sus tarjetas, sin «+N más».
    expect(dias[2]?.tarjetas).toEqual(['Tarjeta 1', 'Tarjeta 2', 'Tarjeta 3', 'Tarjeta 4', 'Tarjeta 5']);
    expect(dias[6]?.tarjetas).toEqual(['Pagar la luz']);
    expect(document.querySelectorAll('.wg-calendario__mas')).toHaveLength(0);
    // El día actual va resaltado.
    expect(screen.getByRole('region', { current: 'date' }).getAttribute('aria-label')).toBe(
      'Sábado 14/11/2026',
    );
    // ET04: las opciones de la vista semanal.
    for (const opcion of ['Semana anterior', 'Semana siguiente', 'Hoy', 'Mes']) {
      expect(screen.getByRole('button', { name: opcion })).toBeTruthy();
    }
    expect(screen.queryByRole('button', { name: 'Mes anterior' })).toBeNull();
  });

  it('HE-10-HU02-CA02 · Tarjeta con bloque horario', async () => {
    await abrir([
      tarjeta({ title: 'Pagar la luz', due_date: '2026-11-12' }),
      tarjeta({
        title: 'Entregar informe',
        due_date: '2026-11-12',
        scheduled_date: '2026-11-12',
        scheduled_hour: 14,
      }),
    ]);
    await elegir('Semana');
    // ET05: la hora de inicio de su bloque, 14:00.
    expect(semana()[3]?.tarjetas).toEqual(['14:00 · Entregar informe', 'Pagar la luz']);
  });

  it('HE-10-HU02-CA03 · Navegar a la semana siguiente', async () => {
    const nucleo = await abrir([tarjeta({ title: 'Entregar informe', due_date: '2026-11-22' })]);
    await elegir('Semana');
    await elegir('Semana siguiente');
    // ET06: de a una semana.
    expect(llamadasA(nucleo, 'calendar_get_week').at(-1)).toEqual({ week_start: '2026-11-16' });
    const dias = semana();
    expect(dias[0]?.dia).toBe('Lunes 16/11/2026');
    expect(dias[6]).toEqual({ dia: 'Domingo 22/11/2026', tarjetas: ['Entregar informe'] });
  });

  it('HE-10-HU02-CA04 · Navegar a la semana anterior', async () => {
    const nucleo = await abrir([tarjeta({ title: 'Informe', due_date: '2026-11-02' })]);
    await elegir('Semana');
    await elegir('Semana anterior');
    expect(llamadasA(nucleo, 'calendar_get_week').at(-1)).toEqual({ week_start: '2026-11-02' });
    const dias = semana();
    expect(dias[0]).toEqual({ dia: 'Lunes 02/11/2026', tarjetas: ['Informe'] });
    expect(dias[6]?.dia).toBe('Domingo 08/11/2026');
  });

  it('HE-10-HU02-CA05 · Cambiar a la vista mensual', async () => {
    const nucleo = await abrir();
    await elegir('Semana');
    for (let i = 0; i < 3; i += 1) await elegir('Semana siguiente');
    expect(screen.getByRole('heading', { name: 'Semana del 30/11/2026 al 06/12/2026' })).toBeTruthy();
    // ET07: el mes que contiene el lunes de la semana consultada.
    await elegir('Mes');
    expect(llamadasA(nucleo, 'calendar_get_month').at(-1)).toEqual({ year: 2026, month: 11 });
    expect(screen.getByRole('heading', { name: 'Noviembre 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeTruthy();
  });

  it('HE-10-HU02-CA06 · Cambiar a la vista mensual con una semana que cruza dos meses', async () => {
    await abrir([
      tarjeta({ title: 'Fin de septiembre', due_date: '2026-09-30' }),
      tarjeta({ title: 'Inicio de octubre', due_date: '2026-10-04' }),
    ]);
    await elegir('Semana');
    for (let i = 0; i < 6; i += 1) await elegir('Semana anterior');
    expect(screen.getByRole('heading', { name: 'Semana del 28/09/2026 al 04/10/2026' })).toBeTruthy();
    expect(semana()[2]?.tarjetas).toEqual(['Fin de septiembre']);
    expect(semana()[6]?.tarjetas).toEqual(['Inicio de octubre']);
    // ET09 (D-168): septiembre, el mes del lunes de esa semana.
    await elegir('Mes');
    expect(screen.getByRole('heading', { name: 'Septiembre 2026' })).toBeTruthy();
    expect(contenido(30).titulos).toEqual(['Fin de septiembre']);
  });

  it('HE-10-HU02-CA07 · Ir a la semana actual', async () => {
    const nucleo = await abrir();
    await elegir('Semana');
    await elegir('Semana anterior');
    await elegir('Semana anterior');
    expect(screen.getByRole('heading', { name: 'Semana del 26/10/2026 al 01/11/2026' })).toBeTruthy();
    // ET08: «Hoy» muestra la semana actual.
    await elegir('Hoy');
    expect(llamadasA(nucleo, 'calendar_get_week').at(-1)).toEqual({ week_start: '2026-11-09' });
    expect(screen.getByRole('heading', { name: 'Semana del 09/11/2026 al 15/11/2026' })).toBeTruthy();
    expect(semana()).toHaveLength(7);
  });
});

function panel() {
  return screen.getByRole('region', { name: 'Panel del día' });
}

/** Cada tarjeta del Panel del día como «tipo · título · prioridad · columna». */
function tarjetasDelPanel() {
  return within(panel())
    .queryAllByRole('listitem')
    .map((li) =>
      Array.from(li.children)
        .map((h) => h.textContent)
        .join(' · '),
    );
}

async function seleccionarDia(nombre: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: nombre }));
  });
}

const DEL_VEINTE = [
  tarjeta({ title: 'Pagar la luz', due_date: '2026-11-20', type: 'reminder', priority: 'high' }),
  tarjeta({ title: 'Entregar informe', due_date: '2026-11-20', column_id: EN_PROGRESO.id }),
  tarjeta({ title: 'Otro día', due_date: '2026-11-21' }),
];

describe('HE-10-HU03 · Tarjetas de un día desde el calendario', () => {
  it('HE-10-HU03-CA01 · Consultar las tarjetas de un día', async () => {
    const nucleo = await abrir(DEL_VEINTE);
    expect(screen.queryByRole('region', { name: 'Panel del día' })).toBeNull();
    // ET01: seleccionar el día en la vista mensual abre el Panel del día.
    await seleccionarDia('20');
    expect(llamadasA(nucleo, 'calendar_get_day')).toEqual([{ date: '2026-11-20' }]);
    // ET02: la fecha del día y las opciones «Nueva tarjeta» y «Cerrar».
    expect(within(panel()).getByRole('heading', { name: '20/11/2026' })).toBeTruthy();
    expect(within(panel()).getByRole('button', { name: 'Nueva tarjeta' })).toBeTruthy();
    expect(within(panel()).getByRole('button', { name: 'Cerrar' })).toBeTruthy();
    // ET03: las 2 tarjetas, con tipo, título, prioridad y columna.
    expect(tarjetasDelPanel()).toEqual([
      'Recordatorio · Pagar la luz · Alta · Por hacer',
      'Tarea · Entregar informe · En progreso',
    ]);
    // «Cerrar» vuelve al Calendario (T-120).
    await act(async () => {
      fireEvent.click(within(panel()).getByRole('button', { name: 'Cerrar' }));
    });
    expect(screen.queryByRole('region', { name: 'Panel del día' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Noviembre 2026' })).toBeTruthy();
  });

  it('HE-10-HU03-CA02 · Consultar las tarjetas de un día desde la vista semanal', async () => {
    const nucleo = await abrir(DEL_VEINTE);
    await elegir('Semana');
    await elegir('Semana siguiente');
    // ET08: también desde la vista semanal.
    await seleccionarDia('Viernes 20/11/2026');
    expect(llamadasA(nucleo, 'calendar_get_day')).toEqual([{ date: '2026-11-20' }]);
    expect(within(panel()).getByRole('heading', { name: '20/11/2026' })).toBeTruthy();
    expect(tarjetasDelPanel()).toHaveLength(2);
    expect(within(panel()).getByRole('button', { name: 'Nueva tarjeta' })).toBeTruthy();
    expect(within(panel()).getByRole('button', { name: 'Cerrar' })).toBeTruthy();
  });

  it('HE-10-HU03-CA03 · Día sin tarjetas', async () => {
    await abrir(DEL_VEINTE);
    await seleccionarDia('19');
    // ET04: estado vacío (RT-04).
    expect(within(panel()).getByText('No tienes tarjetas para este día.')).toBeTruthy();
    expect(tarjetasDelPanel()).toEqual([]);
  });

  it('HE-10-HU03-CA05 · Seleccionar la celda del día fuera de su número', async () => {
    const nucleo = await abrir(DEL_VEINTE);
    // ET09: una celda que no es de un día del mes no abre el Panel del día.
    const vacia = within(screen.getByRole('table'))
      .getAllByRole('cell')
      .find((c) => c.querySelector('.wg-calendario__numero') === null);
    await act(async () => {
      fireEvent.click(vacia as HTMLElement);
    });
    expect(screen.queryByRole('region', { name: 'Panel del día' })).toBeNull();
    // ET01: un espacio de la celda fuera del número abre el Panel del día con sus 2 tarjetas.
    await act(async () => {
      fireEvent.click(dia(20));
    });
    expect(llamadasA(nucleo, 'calendar_get_day')).toEqual([{ date: '2026-11-20' }]);
    expect(within(panel()).getByRole('heading', { name: '20/11/2026' })).toBeTruthy();
    expect(tarjetasDelPanel()).toHaveLength(2);
    expect(within(panel()).getByRole('button', { name: 'Nueva tarjeta' })).toBeTruthy();
    expect(within(panel()).getByRole('button', { name: 'Cerrar' })).toBeTruthy();
    // ET01: también el título de una de sus tarjetas.
    await act(async () => {
      fireEvent.click(within(panel()).getByRole('button', { name: 'Cerrar' }));
    });
    await act(async () => {
      fireEvent.click(within(dia(20)).getByText('Pagar la luz'));
    });
    expect(within(panel()).getByRole('heading', { name: '20/11/2026' })).toBeTruthy();
  });

  it('HE-10-HU03-CA04 · Abrir una tarjeta desde el día', async () => {
    await abrir(DEL_VEINTE);
    await seleccionarDia('20');
    // ET05: el Detalle de tarjeta sobre la pantalla Calendario.
    await act(async () => {
      fireEvent.click(within(panel()).getByRole('button', { name: 'Entregar informe' }));
    });
    const detalle = await screen.findByRole('dialog', { name: 'Detalle de tarjeta' });
    expect(screen.getByRole('main', { name: 'Calendario' })).toBeTruthy();
    // ET06: al cerrar el detalle, el Panel del día sigue abierto.
    await act(async () => {
      fireEvent.click(within(detalle).getByRole('button', { name: 'Cerrar' }));
    });
    expect(screen.queryByRole('dialog', { name: 'Detalle de tarjeta' })).toBeNull();
    expect(within(panel()).getByRole('heading', { name: '20/11/2026' })).toBeTruthy();
    expect(tarjetasDelPanel()).toHaveLength(2);
  });
});

function formulario() {
  return screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
}

function campo(etiqueta: string) {
  return within(formulario()).getByLabelText(etiqueta) as HTMLInputElement;
}

/** El Formulario de tarjeta abierto con «Nueva tarjeta» desde el Panel del día `numero`. */
async function nuevaDesde(numero: string, tarjetas: Card[] = []) {
  const nucleo = await abrir(tarjetas);
  await seleccionarDia(numero);
  await act(async () => {
    fireEvent.click(within(panel()).getByRole('button', { name: 'Nueva tarjeta' }));
  });
  return nucleo;
}

async function enFormulario(boton: 'Guardar' | 'Cancelar') {
  await act(async () => {
    fireEvent.click(within(formulario()).getByRole('button', { name: boton }));
  });
}

describe('HE-10-HU04 · Crear una tarjeta desde un día del calendario', () => {
  it('HE-10-HU04-CA01 · Crear una tarjeta desde un día', async () => {
    const nucleo = await nuevaDesde('20');
    fireEvent.change(campo('Título'), { target: { value: 'Preparar informe' } });
    await enFormulario('Guardar');
    // ET03: con la fecha límite de ese día, en Por hacer (IPC-CARD-01).
    expect(llamadasA(nucleo, 'card_create')).toEqual([
      expect.objectContaining({ title: 'Preparar informe', due_date: '2026-11-20' }),
    ]);
    expect(nucleo.tarjetas.at(-1)).toMatchObject({ title: 'Preparar informe', column_id: POR_HACER.id });
    // ET04: se cierra el formulario, sigo en el Calendario y veo «Tarjeta creada.».
    expect(screen.queryByRole('dialog', { name: 'Formulario de tarjeta' })).toBeNull();
    expect(screen.getByRole('main', { name: 'Calendario' })).toBeTruthy();
    expect(screen.getByText('Tarjeta creada.')).toBeTruthy();
    // ET05: la tarjeta en su día del calendario y, con EV-07 del Núcleo, en el Panel del día, que sigue abierto.
    expect(contenido(20).titulos).toEqual(['Preparar informe']);
    const creada = nucleo.tarjetas.at(-1);
    nucleo.emitir('cards_changed', { ids: creada ? [creada.id] : [], op: 'upsert', origin: 'local' });
    await act(async () => {});
    expect(tarjetasDelPanel()).toEqual(['Tarea · Preparar informe · Por hacer']);
  });

  it('HE-10-HU04-CA02 · Fecha límite precargada', async () => {
    await nuevaDesde('20');
    // ET01, ET08: el Formulario de tarjeta de HE-07-HU01, con la fecha del día ya diligenciada (ET02).
    expect(formulario()).toBeTruthy();
    expect(campo('Fecha límite').value).toBe('20/11/2026');
    expect(campo('Título').value).toBe('');
  });

  it('HE-10-HU04-CA03 · Validaciones del formulario', async () => {
    const nucleo = await nuevaDesde('20');
    await enFormulario('Guardar');
    // ET06: las mismas validaciones de HE-07-HU01, debajo del campo.
    const id = campo('Título').getAttribute('aria-describedby');
    expect(id && document.getElementById(id)?.textContent).toBe('Este campo es obligatorio.');
    expect(llamadasA(nucleo, 'card_create')).toEqual([]);
    expect(formulario()).toBeTruthy();
  });

  it('HE-10-HU04-CA04 · Día pasado', async () => {
    await abrir();
    await seleccionarDia('13');
    // ET07: «Nueva tarjeta» deshabilitada con su texto (RT-04); no abre el formulario.
    const nueva = within(panel()).getByRole('button', { name: 'Nueva tarjeta' }) as HTMLButtonElement;
    expect(nueva.disabled).toBe(true);
    expect(within(panel()).getByText('No puedes crear tarjetas en días pasados.')).toBeTruthy();
    await act(async () => {
      fireEvent.click(nueva);
    });
    expect(screen.queryByRole('dialog', { name: 'Formulario de tarjeta' })).toBeNull();
    // Hoy sí se puede.
    await seleccionarDia('14');
    expect(
      (within(panel()).getByRole('button', { name: 'Nueva tarjeta' }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('HE-10-HU04-CA05 · Cancelar la creación', async () => {
    const nucleo = await nuevaDesde('20');
    fireEvent.change(campo('Título'), { target: { value: 'Preparar informe' } });
    await enFormulario('Cancelar');
    // ET09: se cierra, no crea y el Panel del día sigue abierto en el Calendario.
    expect(screen.queryByRole('dialog', { name: 'Formulario de tarjeta' })).toBeNull();
    expect(llamadasA(nucleo, 'card_create')).toEqual([]);
    expect(screen.getByRole('main', { name: 'Calendario' })).toBeTruthy();
    expect(within(panel()).getByRole('heading', { name: '20/11/2026' })).toBeTruthy();
  });
});

/** El resaltado de la celda del día `numero` en la vista mensual. */
function resaltado(numero: number) {
  const celda = dia(numero);
  if (celda.classList.contains('wg-calendario__dia--vencida')) return 'rojo';
  if (celda.classList.contains('wg-calendario__dia--pendiente')) return 'amarillo';
  return 'sin resaltado';
}

function vencidas(celda: HTMLElement) {
  return celda.querySelector('.wg-calendario__vencidas');
}

describe('HE-10-HU05 · Días con tarjetas vencidas o pendientes', () => {
  it('HE-10-HU05-CA01 · Día con una tarjeta vencida', async () => {
    await abrir([tarjeta({ title: 'Pagar la luz', due_date: '2026-11-10', column_id: EN_PROGRESO.id })]);
    // ET03: en rojo; ET06: «1 vencida»; ET13: con el ícono de alerta junto al texto.
    expect(resaltado(10)).toBe('rojo');
    const texto = vencidas(dia(10));
    expect(texto?.textContent).toBe('1 vencida');
    expect(texto?.querySelector('svg')).toBeTruthy();
    // ET11, ET12: el rojo es un color de estado del tema (tono 4°, 3:1 con la superficie), con relleno y borde.
    const tokens = derivarTokens({ ...TEMA, fuente: 'Nunito', tamano: '16px' });
    expect(tonoDe(tokens.estado_vencida)).toBe(4);
    expect(contraste(tokens.estado_vencida, tokens.superficie)).toBeGreaterThanOrEqual(3);
    expect(tokens.relleno_vencida).not.toBe(tokens.estado_vencida);
  });

  it('HE-10-HU05-CA02 · Día con varias tarjetas vencidas', async () => {
    await abrir([1, 2, 3, 4, 5].map((i) => tarjeta({ title: `Tarjeta ${i}`, due_date: '2026-11-10' })));
    // ET07, ET14: «5 vencidas», sin el límite de 3 de la vista previa.
    expect(resaltado(10)).toBe('rojo');
    const celda = dia(10);
    expect(vencidas(celda)?.textContent).toBe('5 vencidas');
    // ET15: debajo de las tarjetas y de «+N más».
    const partes = Array.from(celda.children).map((h) => h.className);
    expect(partes.indexOf('wg-fila wg-calendario__vencidas')).toBeGreaterThan(
      partes.indexOf('wg-calendario__mas'),
    );
    expect(partes.indexOf('wg-calendario__mas')).toBeGreaterThan(partes.indexOf('wg-calendario__tarjetas'));
  });

  it('HE-10-HU05-CA03 · Día con tarjetas pendientes', async () => {
    await abrir([
      tarjeta({ title: 'Hoy', due_date: '2026-11-14' }),
      tarjeta({ title: 'Después', due_date: '2026-11-20', column_id: EN_PROGRESO.id }),
    ]);
    // ET04: en amarillo; ET17: el ícono de reloj junto al número del día; sin texto de vencidas.
    for (const n of [14, 20]) {
      expect(resaltado(n)).toBe('amarillo');
      expect(dia(n).querySelector('.wg-calendario__encabezado svg')).toBeTruthy();
      expect(vencidas(dia(n))).toBeNull();
    }
    // ET16: el amarillo es un color de estado del tema (tono 45°, 3:1 con la superficie).
    const tokens = derivarTokens({ ...TEMA, fuente: 'Nunito', tamano: '16px' });
    expect(tonoDe(tokens.estado_pendiente)).toBe(45);
    expect(contraste(tokens.estado_pendiente, tokens.superficie)).toBeGreaterThanOrEqual(3);
  });

  it('HE-10-HU05-CA04 · Día solo con tarjetas completadas', async () => {
    await abrir([
      tarjeta({ title: 'Hecha', due_date: '2026-11-20', column_id: HECHO.id, is_completed: true }),
      tarjeta({ title: 'Hecha antes', due_date: '2026-11-10', column_id: HECHO.id, is_completed: true }),
    ]);
    // ET05: sin resaltado.
    expect(resaltado(20)).toBe('sin resaltado');
    expect(resaltado(10)).toBe('sin resaltado');
  });

  it('HE-10-HU05-CA05 · Día sin tarjetas', async () => {
    await abrir();
    expect(resaltado(10)).toBe('sin resaltado');
    expect(resaltado(20)).toBe('sin resaltado');
  });

  it('HE-10-HU05-CA06 · Tarjeta vencida completada', async () => {
    const pagar = tarjeta({ title: 'Pagar la luz', due_date: '2026-11-10' });
    const nucleo = await abrir([pagar]);
    expect(resaltado(10)).toBe('rojo');
    // ET10: pasa a Hecho; con EV-07 el calendario se actualiza.
    await act(async () => {
      await nucleo.responderYMover({ card_id: pagar.id, column_id: HECHO.id, placement: { kind: 'end' } });
    });
    expect(resaltado(10)).toBe('sin resaltado');
    expect(vencidas(dia(10))).toBeNull();
  });

  it('HE-10-HU05-CA07 · Cambio de día', async () => {
    vi.setSystemTime(new Date(2026, 10, 13, 23, 59, 0));
    const nucleo = await abrir([tarjeta({ title: 'Entregar informe', due_date: '2026-11-13' })]);
    const hoyEs = (fecha: string) =>
      nucleo.responder('calendar_get_month', ({ year, month }) => ({
        ok: true,
        value: mesDelCalendario(nucleo.tarjetas, year, month, fecha),
      }));
    hoyEs('2026-11-13');
    await elegir('Hoy');
    expect(resaltado(13)).toBe('amarillo');
    // ET09, ET18: a las 00:00 del computador (EV-22) la tarjeta de ayer pasa a vencida.
    vi.setSystemTime(new Date(2026, 10, 14, 0, 0, 0));
    hoyEs('2026-11-14');
    nucleo.emitir('day_changed', { date: '2026-11-14' });
    await act(async () => {});
    expect(resaltado(13)).toBe('rojo');
    expect(vencidas(dia(13))?.textContent).toBe('1 vencida');
    expect(screen.getByRole('cell', { current: 'date' })).toBe(dia(14));
  });

  it('HE-10-HU05-CA08 · Resaltado en la vista semanal', async () => {
    await abrir([
      tarjeta({ title: 'Pagar la luz', due_date: '2026-11-10' }),
      tarjeta({ title: 'Entregar informe', due_date: '2026-11-15' }),
    ]);
    await elegir('Semana');
    // ET08: el mismo resaltado en la vista semanal.
    const martes = screen.getByRole('region', { name: 'Martes 10/11/2026' });
    expect(martes.classList.contains('wg-calendario__dia--vencida')).toBe(true);
    expect(vencidas(martes)?.textContent).toBe('1 vencida');
    const domingo = screen.getByRole('region', { name: 'Domingo 15/11/2026' });
    expect(domingo.classList.contains('wg-calendario__dia--pendiente')).toBe(true);
  });
});

/** El tono (0 a 360) de un color #RRGGBB. */
function tonoDe(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((((h * 60) % 360) + 360) % 360);
}

const TEMA = { primary: '#96B2B2', secondary: '#829890', text: '#14201C' };

describe('Rediseño · Calendario (P34)', () => {
  it('RD-53 · Los días abreviados y «Hoy», «Mes» y «Semana» abajo, con «Hoy» como acción principal', async () => {
    await abrirPantalla('calendar', 'Calendario', Calendario, []);
    expect(screen.getAllByRole('columnheader').map((d) => d.textContent)).toEqual([
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
      'Dom',
    ]);
    const hoy = screen.getByRole('button', { name: 'Hoy' });
    expect(hoy.classList.contains('wg-boton--principal')).toBe(true);
    const vistas = hoy.parentElement as HTMLElement;
    expect(Array.from(vistas.querySelectorAll('button')).map((b) => b.textContent)).toEqual([
      'Hoy',
      'Mes',
      'Semana',
    ]);
    // El mes y su navegación arriba.
    const titulo = screen.getByRole('heading', { level: 2, name: 'Noviembre 2026' });
    expect(
      within(titulo.parentElement as HTMLElement).getByRole('button', { name: 'Mes anterior' }),
    ).toBeTruthy();
  });
});
