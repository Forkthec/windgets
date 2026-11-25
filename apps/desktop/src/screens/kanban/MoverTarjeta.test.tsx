// HE-09-HU02 · Mover una tarjeta entre columnas mediante drag-and-drop o con la opción «Mover a». Una prueba por
// CA en la vista; las reglas del Núcleo tienen su prueba ca_he_09_hu02_* en
// servicio_del_planificador/pruebas_del_tablero.rs. jsdom no calcula posiciones, así que el drag-and-drop se
// prueba con la regla que traduce el lugar donde se suelta a un movimiento (arrastre.ts) y con el Núcleo de
// prueba; «Mover a» se prueba en la pantalla.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CardMoveParams } from '@/types';
import estilos from '@/ui/tema/tokens.css?raw';
import { movimientoDelArrastre } from './arrastre';
import { Kanban } from './Kanban';
import {
  abrirPantalla,
  EN_PROGRESO,
  fijarHoy,
  HECHO,
  llamadasA,
  POR_HACER,
  screen,
  tarjeta,
} from './pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const ENTREGAR = 'Entregar informe';

/** El movimiento que la prueba sabe que existe. */
function seguro(movimiento: CardMoveParams | null): CardMoveParams {
  if (!movimiento) throw new Error('Se esperaba un movimiento');
  return movimiento;
}

function columna(nombre: string) {
  return screen.getByRole('region', { name: nombre });
}

function titulosDe(nombre: string) {
  return within(columna(nombre))
    .queryAllByRole('button', { name: /./ })
    .filter((b) => b.classList.contains('wg-tarjeta__titulo'))
    .map((b) => b.textContent);
}

function cantidadDe(nombre: string) {
  return columna(nombre).querySelector('.wg-columna__cantidad')?.textContent;
}

function tarjetaEnTablero(titulo: string) {
  return screen.getByRole('button', { name: titulo }).closest('li') as HTMLElement;
}

/** Abre «Mover a» en el botón de acciones «⋮» de la tarjeta (ET10). */
async function abrirMoverA(titulo: string) {
  fireEvent.click(within(tarjetaEnTablero(titulo)).getByRole('button', { name: `Acciones de ${titulo}` }));
  await act(async () => {
    fireEvent.click(screen.getByRole('menuitem', { name: 'Mover a' }));
  });
  return screen.getByRole('menu', { name: 'Mover a' });
}

/** «Mover a» de la tarjeta y la columna elegida. */
async function moverA(titulo: string, destino: string) {
  await abrirMoverA(titulo);
  await act(async () => {
    fireEvent.click(screen.getByRole('menuitemradio', { name: destino }));
  });
}

describe('HE-09-HU02 · Mover una tarjeta', () => {
  it('HE-09-HU02-CA01 · Mover una tarjeta a otra columna', async () => {
    // ET01: soltar sobre la columna En progreso la deja al final de ella.
    const movimiento = movimientoDelArrastre('t1', { columna: EN_PROGRESO.id });
    expect(movimiento).toEqual({ card_id: 't1', column_id: EN_PROGRESO.id, placement: { kind: 'end' } });
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ id: 't1', title: ENTREGAR }),
    ]);
    await act(async () => {
      await nucleo.responderYMover(seguro(movimiento));
    });
    // ET02, ET03: la tarjeta en su nueva columna y las cantidades actualizadas.
    expect(titulosDe('En progreso')).toEqual([ENTREGAR]);
    expect([cantidadDe('Por hacer'), cantidadDe('En progreso')]).toEqual(['0', '1']);
  });

  it('HE-09-HU02-CA02 · Mover una tarjeta a la columna Hecho', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({
        id: 't1',
        title: ENTREGAR,
        column_id: EN_PROGRESO.id,
        due_date: '2026-11-10',
        is_overdue: true,
      }),
    ]);
    expect(within(tarjetaEnTablero(ENTREGAR)).getByText('Vencida')).toBeTruthy();
    await act(async () => {
      await nucleo.responderYMover(seguro(movimientoDelArrastre('t1', { columna: HECHO.id })));
    });
    // ET04 a ET06: completada, con fecha de completado y sin «Vencida».
    expect(titulosDe('Hecho')).toEqual([ENTREGAR]);
    expect(nucleo.tarjetas[0]).toMatchObject({ is_completed: true, completed_on: '2026-11-14' });
    expect(within(tarjetaEnTablero(ENTREGAR)).queryByText('Vencida')).toBeNull();
  });

  it('HE-09-HU02-CA03 · Sacar una tarjeta de la columna Hecho', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({
        id: 't1',
        title: ENTREGAR,
        column_id: HECHO.id,
        is_completed: true,
        completed_on: '2026-11-12',
      }),
    ]);
    await act(async () => {
      await nucleo.responderYMover(seguro(movimientoDelArrastre('t1', { columna: POR_HACER.id })));
    });
    // ET07
    expect(titulosDe('Por hacer')).toEqual([ENTREGAR]);
    expect(nucleo.tarjetas[0]).toMatchObject({ is_completed: false, completed_on: null });
  });

  it('HE-09-HU02-CA04 · Reordenar tarjetas dentro de una columna', async () => {
    // Soltar «Llamar al cliente» sobre la primera tarjeta la pone antes de ella (ET08).
    const movimiento = movimientoDelArrastre('t3', { columna: POR_HACER.id, tarjeta: 't1' });
    expect(movimiento).toEqual({
      card_id: 't3',
      column_id: POR_HACER.id,
      placement: { kind: 'before', card_id: 't1' },
    });
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ id: 't1', title: ENTREGAR, position: 1024 }),
      tarjeta({ id: 't2', title: 'Pagar factura', position: 2048 }),
      tarjeta({ id: 't3', title: 'Llamar al cliente', position: 3072 }),
    ]);
    await act(async () => {
      await nucleo.responderYMover(seguro(movimiento));
    });
    expect(titulosDe('Por hacer')).toEqual(['Llamar al cliente', ENTREGAR, 'Pagar factura']);
  });

  it('HE-09-HU02-CA05 · Soltar una tarjeta fuera de una columna', async () => {
    // ET09: fuera de toda columna (o sobre sí misma) no hay movimiento: vuelve a su lugar.
    expect(movimientoDelArrastre('t1', undefined)).toBeNull();
    expect(movimientoDelArrastre('t1', { columna: POR_HACER.id, tarjeta: 't1' })).toBeNull();
  });

  it('HE-09-HU02-CA06 · Mover una tarjeta con la opción «Mover a»', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Ya estaba', column_id: EN_PROGRESO.id }),
      tarjeta({ title: ENTREGAR }),
    ]);
    await moverA(ENTREGAR, 'En progreso');
    // ET10, ET12: al final de la columna elegida.
    expect(llamadasA(nucleo, 'card_move')).toEqual([
      { card_id: expect.any(String), column_id: EN_PROGRESO.id, placement: { kind: 'end' } },
    ]);
    expect(titulosDe('En progreso')).toEqual(['Ya estaba', ENTREGAR]);
  });

  it('HE-09-HU02-CA07 · Mover una tarjeta a la columna Hecho con la opción «Mover a»', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Hecha antes', column_id: HECHO.id, is_completed: true }),
      tarjeta({ title: ENTREGAR, column_id: EN_PROGRESO.id, due_date: '2026-11-10', is_overdue: true }),
    ]);
    await moverA(ENTREGAR, 'Hecho');
    // ET13: al final de Hecho y sin «Vencida».
    expect(titulosDe('Hecho')).toEqual(['Hecha antes', ENTREGAR]);
    expect(within(tarjetaEnTablero(ENTREGAR)).queryByText('Vencida')).toBeNull();
  });

  it('HE-09-HU02-CA08 · Sacar una tarjeta de la columna Hecho con la opción «Mover a»', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Primera' }),
      tarjeta({ title: ENTREGAR, column_id: HECHO.id, is_completed: true, completed_on: '2026-11-12' }),
    ]);
    await moverA(ENTREGAR, 'Por hacer');
    expect(titulosDe('Por hacer')).toEqual(['Primera', ENTREGAR]);
    expect(nucleo.tarjetas.find((t) => t.title === ENTREGAR)).toMatchObject({
      is_completed: false,
      completed_on: null,
    });
  });

  it('HE-09-HU02-CA09 · Columna actual en la opción «Mover a»', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: ENTREGAR })]);
    // ET11: todas las columnas en su orden, con la actual marcada y deshabilitada.
    const opciones = within(await abrirMoverA(ENTREGAR)).getAllByRole('menuitemradio');
    expect(opciones.map((o) => o.textContent)).toEqual(['Por hacer', 'En progreso', 'Hecho']);
    const [actual] = opciones;
    expect(actual?.getAttribute('aria-checked')).toBe('true');
    expect((actual as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(actual as HTMLElement);
    expect(llamadasA(nucleo, 'card_move')).toHaveLength(0);
  });

  it('HE-09-HU02-CA10 · «Mover a» en la última tarjeta de una columna', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: ENTREGAR }),
      tarjeta({ title: 'Llamar al cliente' }),
    ]);
    expect(titulosDe('Por hacer').at(-1)).toBe('Llamar al cliente');
    const menu = await abrirMoverA('Llamar al cliente');
    // ET14 (RT-02-ET12): la lista completa se dibuja fuera del tablero, que no la recorta.
    expect(
      within(menu)
        .getAllByRole('menuitemradio')
        .map((o) => o.textContent),
    ).toEqual(['Por hacer', 'En progreso', 'Hecho']);
    const tablero = document.querySelector('.wg-tablero') as HTMLElement;
    expect(tablero.contains(menu)).toBe(false);
    expect(menu.parentElement).toBe(document.body);
    // ET14: el tablero de la pantalla no tiene barra vertical propia; el widget Kanban no cambia.
    const reglaDelTablero = /\.wg-tablero \{([^}]*)\}/.exec(estilos)?.[1] ?? '';
    expect(reglaDelTablero).toContain('overflow-x: auto;');
    expect(reglaDelTablero).toContain('overflow-y: hidden;');
    expect(tablero.classList.contains('wg-tablero--widget')).toBe(false);
    const reglaDelWidget = /\.wg-tablero--widget \{([^}]*)\}/.exec(estilos)?.[1] ?? '';
    expect(reglaDelWidget).toContain('overflow-y: visible;');
  });
});

describe('RD-92 · La columna de destino ya no existe', () => {
  it('RD-92 · mover una tarjeta a una columna eliminada lo dice y vuelve a leer el tablero', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ id: 't1', title: ENTREGAR }),
    ]);
    nucleo.responder('card_move', () => {
      nucleo.columnas.splice(1, 1); // En progreso se eliminó en otro computador
      return { ok: false, error: { code: 'column.not_found', message: 'Esta columna ya no existe.' } };
    });
    const lecturas = llamadasA(nucleo, 'card_list_board').length;
    await moverA(ENTREGAR, 'En progreso');
    expect(screen.getByRole('alert').textContent).toContain('Esta columna ya no existe.');
    expect(screen.queryByRole('region', { name: 'En progreso' })).toBeNull();
    expect(titulosDe('Por hacer')).toEqual([ENTREGAR]);
    expect(llamadasA(nucleo, 'card_list_board').length).toBeGreaterThan(lecturas);
  });
});
