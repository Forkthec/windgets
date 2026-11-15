// HE-09-HU04 · Editar una columna. Una prueba por CA en la vista; las reglas del Núcleo tienen su prueba
// ca_he_09_hu04_* en servicio_del_planificador/pruebas_del_tablero.rs.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Column } from '@/types';
import { Kanban } from './Kanban';
import { abrirPantalla, fijarHoy, HECHO, llamadasA, screen, type NucleoDelPlanificador } from './pruebas';

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
  card_count: 0,
  is_default: false,
};

/** Tablero con las columnas por defecto y las indicadas al final. */
async function abrirTablero(extra: Column[] = [REVISION]): Promise<NucleoDelPlanificador> {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
  nucleo.columnas.push(...extra);
  nucleo.emitir('columns_changed', { ids: [], op: 'upsert', origin: 'local' });
  await screen.findByRole('region', { name: extra.at(-1)?.name ?? 'Hecho' });
  return nucleo;
}

/** «Editar» de la columna indicada (ET01). */
async function editar(nombre: string) {
  const columna = screen.getByRole('region', { name: nombre });
  fireEvent.click(within(columna).getByRole('button', { name: 'Editar' }));
  const ventana = await screen.findByRole('dialog', { name: 'Editar columna' });
  await within(ventana).findByRole('radio', { name: 'Gris' });
  return ventana;
}

function escribirNombre(ventana: HTMLElement, nombre: string) {
  fireEvent.change(within(ventana).getByLabelText('Nombre'), { target: { value: nombre } });
}

function guardar(ventana: HTMLElement) {
  fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
}

function mensajeDeNombre(ventana: HTMLElement) {
  return within(ventana).getByLabelText('Nombre').closest('.wg-campo')?.querySelector('.wg-campo__mensaje')
    ?.textContent;
}

async function cerrada() {
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar columna' })).toBeNull());
}

describe('HE-09-HU04 · Editar una columna', () => {
  it('HE-09-HU04-CA01 · Cambiar el nombre de una columna', async () => {
    const nucleo = await abrirTablero();
    const ventana = await editar('Revisión');
    escribirNombre(ventana, 'Revisión final');
    guardar(ventana);
    await cerrada();
    expect(await screen.findByText('Columna actualizada.')).toBeTruthy();
    // ET07: el tablero muestra el nombre nuevo.
    expect(await screen.findByRole('region', { name: 'Revisión final' })).toBeTruthy();
    expect(llamadasA(nucleo, 'column_update')).toEqual([
      { id: 'col-revision', name: 'Revisión final', color_id: 'gray' },
    ]);
  });

  it('HE-09-HU04-CA02 · Cambiar el color de una columna', async () => {
    const nucleo = await abrirTablero();
    const ventana = await editar('Revisión');
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Azul' }));
    guardar(ventana);
    await cerrada();
    expect(await screen.findByText('Columna actualizada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'column_update')).toEqual([
      { id: 'col-revision', name: 'Revisión', color_id: 'blue' },
    ]);
  });

  it('HE-09-HU04-CA03 · Renombrar la columna Hecho', async () => {
    // ET06: la vista solo envía el nombre; el Núcleo conserva la función (ca_he_09_hu04_ca03).
    const nucleo = await abrirTablero([]);
    const ventana = await editar('Hecho');
    escribirNombre(ventana, 'Terminadas');
    guardar(ventana);
    await cerrada();
    expect(llamadasA(nucleo, 'column_update')).toEqual([
      { id: HECHO.id, name: 'Terminadas', color_id: HECHO.color_id },
    ]);
    expect(await screen.findByRole('region', { name: 'Terminadas' })).toBeTruthy();
  });

  it('HE-09-HU04-CA04 · Nombre vacío', async () => {
    const nucleo = await abrirTablero();
    const ventana = await editar('Revisión');
    escribirNombre(ventana, '');
    guardar(ventana);
    await waitFor(() => expect(mensajeDeNombre(ventana)).toBe('Este campo es obligatorio.'));
    expect(llamadasA(nucleo, 'column_update')).toEqual([]);
  });

  it('HE-09-HU04-CA05 · Nombre de más de 30 caracteres', async () => {
    const nucleo = await abrirTablero();
    const ventana = await editar('Revisión');
    escribirNombre(ventana, 'a'.repeat(31));
    guardar(ventana);
    await waitFor(() =>
      expect(mensajeDeNombre(ventana)).toBe('El nombre de la columna no puede superar los 30 caracteres.'),
    );
    expect(llamadasA(nucleo, 'column_update')).toEqual([]);
  });

  it('HE-09-HU04-CA06 · Nombre duplicado', async () => {
    const nucleo = await abrirTablero([
      REVISION,
      { ...REVISION, id: 'col-bloqueadas', name: 'Bloqueadas', position: 5120 },
    ]);
    // ET04: la unicidad la responde el Núcleo.
    nucleo.responder('column_update', () => ({
      ok: false,
      error: { code: 'name.duplicate', message: 'Ya existe una columna con ese nombre.', field: 'name' },
    }));
    const ventana = await editar('Bloqueadas');
    escribirNombre(ventana, 'revisión');
    guardar(ventana);
    await waitFor(() => expect(mensajeDeNombre(ventana)).toBe('Ya existe una columna con ese nombre.'));
    expect(screen.getByRole('dialog', { name: 'Editar columna' })).toBeTruthy();
  });

  it('HE-09-HU04-CA07 · Cancelar la edición', async () => {
    const nucleo = await abrirTablero();
    const ventana = await editar('Revisión');
    escribirNombre(ventana, 'Revisión final');
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await cerrada();
    expect(llamadasA(nucleo, 'column_update')).toEqual([]);
    expect(screen.getByRole('region', { name: 'Revisión' })).toBeTruthy();
  });

  it('HE-09-HU04-CA08 · Abrir el Formulario de columna en edición', async () => {
    await abrirTablero([{ ...REVISION, color_id: 'green', color_hex: '#4CAF50' }]);
    const ventana = await editar('Revisión');
    // ET02: título «Editar columna», el nombre y el color actuales, «Guardar» y «Cancelar».
    expect((within(ventana).getByLabelText('Nombre') as HTMLInputElement).value).toBe('Revisión');
    expect((within(ventana).getByRole('radio', { name: 'Verde' }) as HTMLInputElement).checked).toBe(true);
    expect(within(ventana).getByRole('button', { name: 'Guardar' })).toBeTruthy();
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });
});
