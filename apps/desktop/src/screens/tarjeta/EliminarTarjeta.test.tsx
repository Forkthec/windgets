// HE-07-HU05 · Eliminar una tarjeta. Una prueba por CA en la vista; las reglas del Núcleo tienen su prueba
// ca_he_07_hu05_* en servicio_del_planificador/pruebas_de_edicion.rs.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kanban } from '../kanban/Kanban';
import {
  abrirPantalla,
  fijarHoy,
  llamadasA,
  type NucleoDelPlanificador,
  screen,
  tarjeta,
} from '../kanban/pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const PREGUNTA = '¿Deseas eliminar la tarjeta “Informe”? Esta acción no se puede deshacer.';

/** Tablero con la tarjeta «Informe», su detalle abierto y la confirmación abierta con «Eliminar». */
async function abrirConfirmacion(): Promise<NucleoDelPlanificador> {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
    tarjeta({ title: 'Informe' }),
    tarjeta({ title: 'Otra' }),
  ]);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Informe' }));
  });
  const detalle = screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
  fireEvent.click(within(detalle).getByRole('button', { name: 'Eliminar' }));
  return nucleo;
}

describe('HE-07-HU05 · Eliminar una tarjeta', () => {
  it('HE-07-HU05-CA01 · Abrir el mensaje de confirmación para eliminar una tarjeta', async () => {
    const nucleo = await abrirConfirmacion();
    // ET01, ET02: confirmación con el título de la tarjeta y las opciones «Eliminar» y «Cancelar».
    const confirmacion = screen.getByRole('dialog');
    expect(within(confirmacion).getByText(PREGUNTA)).toBeTruthy();
    expect(within(confirmacion).getByRole('button', { name: 'Eliminar' })).toBeTruthy();
    expect(within(confirmacion).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    // ET03: todavía no se elimina.
    expect(llamadasA(nucleo, 'card_delete')).toHaveLength(0);
  });

  it('HE-07-HU05-CA02 · Eliminar una tarjeta confirmada', async () => {
    const nucleo = await abrirConfirmacion();
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    });
    expect(llamadasA(nucleo, 'card_delete')).toHaveLength(1);
    // ET04, ET05: cierra la ventana, sigue en el tablero y la tarjeta ya no está.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Informe' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Otra' })).toBeTruthy();
    expect(screen.getByText('Tarjeta eliminada.')).toBeTruthy(); // ET06
  });

  it('HE-07-HU05-CA03 · Cancelar la eliminación de la tarjeta', async () => {
    const nucleo = await abrirConfirmacion();
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    });
    expect(llamadasA(nucleo, 'card_delete')).toHaveLength(0);
    // Cierra el mensaje: vuelve al detalle y la tarjeta sigue igual.
    expect(screen.getByRole('dialog', { name: 'Detalle de tarjeta' })).toBeTruthy();
    expect(screen.queryByText(PREGUNTA)).toBeNull();
    expect(screen.getByRole('button', { name: 'Informe', hidden: true })).toBeTruthy();
  });

  it('HE-07-HU05-CA04 · Eliminar desde el menú de la tarjeta', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Informe' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de Informe' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    });
    // ET01: el mismo mensaje de confirmación de CA01, sin el detalle debajo; la tarjeta sigue hasta confirmar.
    const confirmacion = screen.getByRole('dialog');
    expect(within(confirmacion).getByText(PREGUNTA)).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Detalle de tarjeta' })).toBeNull();
    expect(llamadasA(nucleo, 'card_delete')).toHaveLength(0);
    // ET05: «Cancelar» deja al usuario en el tablero, con la tarjeta.
    await act(async () => {
      fireEvent.click(within(confirmacion).getByRole('button', { name: 'Cancelar' }));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Informe' })).toBeTruthy();
    // ET05: al confirmar, se elimina y el usuario sigue en el tablero.
    fireEvent.click(screen.getByRole('button', { name: 'Acciones de Informe' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    });
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    });
    expect(llamadasA(nucleo, 'card_delete')).toHaveLength(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy();
    expect(screen.getByText('Tarjeta eliminada.')).toBeTruthy();
  });
});
