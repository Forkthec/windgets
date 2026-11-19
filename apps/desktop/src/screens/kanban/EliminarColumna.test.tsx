// HE-09-HU06 · Eliminar las columnas creadas. Las reglas del Núcleo tienen sus pruebas ca_he_09_hu06_* en
// servicio_del_planificador/pruebas_del_tablero.rs.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Column } from '@/types';
import { Kanban } from './Kanban';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from './pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const REVISION: Column = {
  id: 'col-revision',
  name: 'Revisión',
  color_id: 'gray',
  color_hex: '#9E9E9E',
  role: 'custom',
  position: 4096,
  card_count: 3,
  is_default: false,
};

async function abrirTablero(cantidad: number, destino = 'Por hacer') {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
  nucleo.columnas.push({ ...REVISION, card_count: cantidad });
  nucleo.responder('column_get_delete_info', () => ({
    ok: true,
    value: { name: 'Revisión', card_count: cantidad, destination_name: destino },
  }));
  nucleo.responder('column_delete', () => ({
    ok: true,
    value: null,
    result_message: { code: 'column_delete', message: 'Columna eliminada.' },
  }));
  nucleo.emitir('columns_changed', { ids: [], op: 'upsert', origin: 'local' });
  await screen.findByRole('region', { name: 'Revisión' });
  return nucleo;
}

async function pedirEliminar(nucleo: NucleoDelPlanificador) {
  fireEvent.click(
    within(screen.getByRole('region', { name: 'Revisión' })).getByRole('button', { name: 'Eliminar' }),
  );
  const ventana = await screen.findByRole('dialog');
  return { nucleo, ventana };
}

describe('HE-09-HU06 · Eliminar las columnas creadas', () => {
  it('HE-09-HU06-CA01 · Confirmar la eliminación de una columna sin tarjetas', async () => {
    const { nucleo, ventana } = await pedirEliminar(await abrirTablero(0));
    expect(
      within(ventana).getByText('¿Deseas eliminar la columna “Revisión”? Esta acción no se puede deshacer.'),
    ).toBeTruthy();
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(llamadasA(nucleo, 'column_delete')).toEqual([]);
  });

  it('HE-09-HU06-CA02 · Eliminar una columna sin tarjetas', async () => {
    const { nucleo, ventana } = await pedirEliminar(await abrirTablero(0));
    fireEvent.click(within(ventana).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Columna eliminada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'column_delete')).toEqual([{ id: 'col-revision' }]);
  });

  it('HE-09-HU06-CA03 · Confirmar la eliminación de una columna con tarjetas', async () => {
    const { ventana } = await pedirEliminar(await abrirTablero(3));
    expect(
      within(ventana).getByText(
        'La columna “Revisión” tiene 3 tarjetas. Se moverán a “Por hacer”. ¿Deseas continuar?',
      ),
    ).toBeTruthy();
  });

  it('HE-09-HU06-CA04 · Eliminar una columna con tarjetas', async () => {
    const { nucleo, ventana } = await pedirEliminar(await abrirTablero(3));
    fireEvent.click(within(ventana).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Columna eliminada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'column_delete')).toEqual([{ id: 'col-revision' }]);
  });

  it('HE-09-HU06-CA05 · Columna por defecto', async () => {
    await abrirTablero(0);
    for (const nombre of ['Por hacer', 'En progreso', 'Hecho']) {
      const boton = within(screen.getByRole('region', { name: nombre })).getByRole('button', {
        name: 'Eliminar',
      }) as HTMLButtonElement;
      expect(boton.disabled).toBe(true);
    }
    expect(screen.getAllByText('Las columnas por defecto no se pueden eliminar.').length).toBeGreaterThan(0);
  });

  it('HE-09-HU06-CA06 · Cancelar la eliminación', async () => {
    const { nucleo, ventana } = await pedirEliminar(await abrirTablero(3));
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(nucleo, 'column_delete')).toEqual([]);
    expect(screen.getByRole('region', { name: 'Revisión' })).toBeTruthy();
  });

  it('HE-09-HU06-CA07 · Columna Por hacer renombrada', async () => {
    const { ventana } = await pedirEliminar(await abrirTablero(3, 'Prioridades'));
    expect(
      within(ventana).getByText(
        'La columna “Revisión” tiene 3 tarjetas. Se moverán a “Prioridades”. ¿Deseas continuar?',
      ),
    ).toBeTruthy();
  });
});
