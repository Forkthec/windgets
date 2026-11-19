// HE-08-HU03 · Editar el nombre y el color de una etiqueta; HE-08-HU04 · Eliminar una etiqueta. Las reglas del
// Núcleo tienen sus pruebas ca_he_08_hu03_* y ca_he_08_hu04_* en servicio_del_planificador/pruebas_de_etiquetas.rs.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ErrorCode, Label } from '@/types';
import { abrirPantalla, fijarHoy, llamadasA, screen, type NucleoDelPlanificador } from '../kanban/pruebas';
import { Labels } from './Labels';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const ESTUDIO: Label = { id: 'e1', name: 'Estudio', color_id: 'blue', color_hex: '#2196F3', card_count: 0 };

async function abrir(preparar?: (n: NucleoDelPlanificador) => void) {
  const nucleo = await abrirPantalla('labels', 'Etiquetas', Labels);
  nucleo.etiquetas.splice(0, nucleo.etiquetas.length, ESTUDIO);
  preparar?.(nucleo);
  nucleo.emitir('labels_changed', { ids: [], op: 'upsert', origin: 'local' });
  const lista = await screen.findByRole('list', { name: 'Lista de etiquetas' });
  return { nucleo, fila: within(lista).getAllByRole('listitem')[0] as HTMLElement };
}

async function editar(preparar?: (n: NucleoDelPlanificador) => void) {
  const { nucleo, fila } = await abrir(preparar);
  fireEvent.click(within(fila).getByRole('button', { name: 'Editar' }));
  const ventana = await screen.findByRole('dialog', { name: 'Editar etiqueta' });
  await within(ventana).findByRole('radio', { name: 'Verde' });
  return { nucleo, ventana };
}

const nombre = (v: HTMLElement) => within(v).getByLabelText('Nombre') as HTMLInputElement;
const guardar = (v: HTMLElement) => fireEvent.click(within(v).getByRole('button', { name: 'Guardar' }));
const mensajeDe = (control: HTMLElement) =>
  control.closest('.wg-campo')?.querySelector('.wg-campo__mensaje')?.textContent;
const rechazo = (code: ErrorCode, message: string, field: string) => () => ({
  ok: false as const,
  error: { code, message, field },
});

describe('HE-08-HU03 · Editar una etiqueta', () => {
  it('HE-08-HU03-CA07 · Abrir el Formulario de etiqueta en edición', async () => {
    const { ventana } = await editar();
    // ET01, ET02: título, nombre y color actuales, «Guardar» y «Cancelar».
    expect(nombre(ventana).value).toBe('Estudio');
    expect((within(ventana).getByRole('radio', { name: 'Azul' }) as HTMLInputElement).checked).toBe(true);
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('HE-08-HU03-CA01 · Editar el nombre y el color de una etiqueta', async () => {
    const { nucleo, ventana } = await editar((n) =>
      n.responder('label_update', (p) => ({
        ok: true,
        value: { ...ESTUDIO, name: p.name, color_id: p.color_id },
        result_message: { code: 'label_update', message: 'Etiqueta actualizada.' },
      })),
    );
    fireEvent.change(nombre(ventana), { target: { value: 'Trabajo' } });
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Verde' }));
    guardar(ventana);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar etiqueta' })).toBeNull());
    expect(await screen.findByText('Etiqueta actualizada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'label_update')).toEqual([{ id: 'e1', name: 'Trabajo', color_id: 'green' }]);
  });

  it('HE-08-HU03-CA02 · Rechazar un nombre vacío', async () => {
    const { nucleo, ventana } = await editar();
    fireEvent.change(nombre(ventana), { target: { value: '' } });
    guardar(ventana);
    await waitFor(() => expect(mensajeDe(nombre(ventana))).toBe('Este campo es obligatorio.'));
    expect(llamadasA(nucleo, 'label_update')).toEqual([]);
  });

  it('HE-08-HU03-CA03 · Rechazar un nombre de más de 30 caracteres', async () => {
    const { nucleo, ventana } = await editar();
    fireEvent.change(nombre(ventana), { target: { value: 'a'.repeat(31) } });
    guardar(ventana);
    await waitFor(() =>
      expect(mensajeDe(nombre(ventana))).toBe('El nombre de la etiqueta no puede superar los 30 caracteres.'),
    );
    expect(llamadasA(nucleo, 'label_update')).toEqual([]);
  });

  it('HE-08-HU03-CA04 · Rechazar un nombre duplicado', async () => {
    const { ventana } = await editar((n) =>
      n.responder(
        'label_update',
        rechazo('name.duplicate', 'Ya existe una etiqueta con ese nombre.', 'name'),
      ),
    );
    fireEvent.change(nombre(ventana), { target: { value: 'TRABAJO' } });
    guardar(ventana);
    await waitFor(() => expect(mensajeDe(nombre(ventana))).toBe('Ya existe una etiqueta con ese nombre.'));
  });

  it('HE-08-HU03-CA05 · Rechazar una etiqueta sin color', async () => {
    const { ventana } = await editar((n) =>
      n.responder('label_update', rechazo('color.required', 'Este campo es obligatorio.', 'color_id')),
    );
    guardar(ventana);
    const color = within(ventana).getByRole('radio', { name: 'Azul' });
    await waitFor(() => expect(mensajeDe(color)).toBe('Este campo es obligatorio.'));
  });

  it('HE-08-HU03-CA06 · Cancelar la edición de la etiqueta', async () => {
    const { nucleo, ventana } = await editar();
    fireEvent.change(nombre(ventana), { target: { value: 'Otro' } });
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar etiqueta' })).toBeNull());
    expect(llamadasA(nucleo, 'label_update')).toEqual([]);
  });
});

describe('HE-08-HU04 · Eliminar una etiqueta', () => {
  async function eliminar(cantidad: number, preparar?: (n: NucleoDelPlanificador) => void) {
    const { nucleo, fila } = await abrir((n) => {
      n.responder('label_get_delete_info', () => ({
        ok: true,
        value: { name: 'Estudio', card_count: cantidad },
      }));
      n.responder('label_delete', () => ({
        ok: true,
        value: null,
        result_message: { code: 'label_delete', message: 'Etiqueta eliminada.' },
      }));
      preparar?.(n);
    });
    fireEvent.click(within(fila).getByRole('button', { name: 'Eliminar' }));
    const ventana = await screen.findByRole('dialog');
    return { nucleo, ventana };
  }

  it('HE-08-HU04-CA01 · Abrir el mensaje de confirmación para eliminar una etiqueta sin tarjetas', async () => {
    const { nucleo, ventana } = await eliminar(0);
    expect(
      within(ventana).getByText('¿Deseas eliminar la etiqueta “Estudio”? Esta acción no se puede deshacer.'),
    ).toBeTruthy();
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(llamadasA(nucleo, 'label_delete')).toEqual([]);
  });

  it('HE-08-HU04-CA02 · Eliminar una etiqueta sin tarjetas', async () => {
    const { nucleo, ventana } = await eliminar(0);
    fireEvent.click(within(ventana).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Etiqueta eliminada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'label_delete')).toEqual([{ id: 'e1' }]);
  });

  it('HE-08-HU04-CA03 · Abrir el mensaje de confirmación para eliminar una etiqueta asignada a varias tarjetas', async () => {
    const { ventana } = await eliminar(3);
    expect(
      within(ventana).getByText(
        'La etiqueta “Estudio” está asignada a 3 tarjetas. Se quitará de ellas, pero las tarjetas no se eliminarán. ¿Deseas continuar?',
      ),
    ).toBeTruthy();
  });

  it('HE-08-HU04-CA04 · Abrir el mensaje de confirmación para eliminar una etiqueta asignada a una tarjeta', async () => {
    const { ventana } = await eliminar(1);
    expect(
      within(ventana).getByText(
        'La etiqueta “Estudio” está asignada a 1 tarjeta. Se quitará de ella, pero la tarjeta no se eliminará. ¿Deseas continuar?',
      ),
    ).toBeTruthy();
  });

  it('HE-08-HU04-CA05 · Eliminar una etiqueta asignada confirmada', async () => {
    const { nucleo, ventana } = await eliminar(2);
    fireEvent.click(within(ventana).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Etiqueta eliminada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'label_delete')).toEqual([{ id: 'e1' }]);
  });

  it('HE-08-HU04-CA06 · Cancelar la eliminación de la etiqueta', async () => {
    const { nucleo, ventana } = await eliminar(0);
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(llamadasA(nucleo, 'label_delete')).toEqual([]);
  });
});
