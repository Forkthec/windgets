// HE-07-HU02 · Asignar etiquetas a una tarjeta. Una prueba por CA en la vista; el Núcleo valida `labels.too_many`
// y `labels.not_found` (pruebas ca_he_07_hu01_* y ca_he_07_hu02_* en servicio_del_planificador).
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Label } from '@/types';
import { Kanban } from '../kanban/Kanban';
import { abrirPantalla, fijarHoy, llamadasA } from '../kanban/pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

function etiqueta(name: string, i: number): Label {
  return { id: `x${i}`, name, color_id: 'blue', color_hex: '#2196F3', card_count: 0 };
}

/** Tablero Kanban con el Formulario de tarjeta abierto y las etiquetas indicadas (en el orden del Núcleo). */
async function abrirFormulario(etiquetas: Label[]) {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
  nucleo.etiquetas.splice(0, nucleo.etiquetas.length, ...etiquetas);
  fireEvent.click(screen.getByRole('button', { name: 'Nueva tarjeta' }));
  const formulario = screen.getByRole('dialog', { name: 'Formulario de tarjeta' });
  await act(async () => {}); // label_list
  return { nucleo, formulario };
}

/** Selecciona el campo Etiquetas: abre la lista desplegable (ET01). */
function abrirCampo(formulario: HTMLElement) {
  fireEvent.click(within(formulario).getByRole('button', { name: 'Etiquetas asignadas' }));
}

function escribir(formulario: HTMLElement, campo: string, valor: string) {
  fireEvent.change(within(formulario).getByLabelText(campo), { target: { value: valor } });
}

describe('HE-07-HU02 · Asignar etiquetas a una tarjeta', () => {
  it('HE-07-HU02-CA01 · Asignar etiquetas a la tarjeta', async () => {
    const { nucleo, formulario } = await abrirFormulario([etiqueta('Casa', 1), etiqueta('Estudio', 2)]);
    escribir(formulario, 'Título', 'Repasar');
    escribir(formulario, 'Fecha límite', '20/11/2026');
    abrirCampo(formulario);
    fireEvent.click(within(formulario).getByLabelText('Estudio'));
    // El campo muestra la etiqueta asignada.
    expect(within(formulario).getByRole('button', { name: 'Etiquetas asignadas' }).textContent).toBe(
      'Estudio',
    );
    await act(async () => {
      fireEvent.click(within(formulario).getByRole('button', { name: 'Guardar' }));
    });
    // ET05: se conserva en la tarjeta al guardar.
    expect(llamadasA(nucleo, 'card_create')).toEqual([
      expect.objectContaining({ title: 'Repasar', label_ids: ['x2'] }),
    ]);
  });

  it('HE-07-HU02-CA02 · Asignar más de 5 etiquetas', async () => {
    const nombres = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const { formulario } = await abrirFormulario(nombres.map(etiqueta));
    abrirCampo(formulario);
    for (const n of nombres.slice(0, 5)) fireEvent.click(within(formulario).getByLabelText(n));
    // ET06: las demás, deshabilitadas con el texto.
    for (const n of ['F', 'G']) {
      expect((within(formulario).getByLabelText(n) as HTMLInputElement).disabled).toBe(true);
    }
    expect((within(formulario).getByLabelText('A') as HTMLInputElement).disabled).toBe(false);
    expect(within(formulario).getByText('Puedes asignar máximo 5 etiquetas por tarjeta.')).toBeTruthy();
  });

  it('HE-07-HU02-CA03 · Consultar el campo Etiquetas sin etiquetas creadas', async () => {
    const { formulario } = await abrirFormulario([]);
    abrirCampo(formulario);
    // ET07
    expect(within(formulario).getByText('Aún no tienes etiquetas.')).toBeTruthy();
    expect(within(formulario).getByRole('button', { name: 'Nueva etiqueta' })).toBeTruthy();
  });

  it('HE-07-HU02-CA04 · Crear una etiqueta desde el campo Etiquetas', async () => {
    const { formulario } = await abrirFormulario([]);
    escribir(formulario, 'Título', 'Repasar');
    escribir(formulario, 'Descripción', 'Capítulo 3');
    abrirCampo(formulario);
    // ET08: el Formulario de etiqueta se abre sobre el Formulario de tarjeta.
    fireEvent.click(within(formulario).getByRole('button', { name: 'Nueva etiqueta' }));
    let etiquetaNueva = await screen.findByRole('dialog', { name: 'Nueva etiqueta' });
    // ET09: al cancelar, regresa con los datos.
    fireEvent.click(within(etiquetaNueva).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull());
    expect((within(formulario).getByLabelText('Título') as HTMLInputElement).value).toBe('Repasar');
    // ET09: al guardar, regresa con los datos y la etiqueta nueva queda en el campo.
    fireEvent.click(within(formulario).getByRole('button', { name: 'Nueva etiqueta' }));
    etiquetaNueva = await screen.findByRole('dialog', { name: 'Nueva etiqueta' });
    fireEvent.change(within(etiquetaNueva).getByLabelText('Nombre'), { target: { value: 'Estudio' } });
    fireEvent.click(await within(etiquetaNueva).findByRole('radio', { name: 'Azul' }));
    fireEvent.click(within(etiquetaNueva).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull());
    expect(screen.getByRole('dialog', { name: 'Formulario de tarjeta' })).toBe(formulario);
    expect((within(formulario).getByLabelText('Título') as HTMLInputElement).value).toBe('Repasar');
    expect((within(formulario).getByLabelText('Descripción') as HTMLInputElement).value).toBe('Capítulo 3');
    expect(await within(formulario).findByLabelText('Estudio')).toBeTruthy();
  });

  it('HE-07-HU02-CA05 · Consultar el campo Etiquetas en orden alfabético', async () => {
    const { formulario } = await abrirFormulario([
      etiqueta('casa', 1),
      etiqueta('Estudio', 2),
      etiqueta('Trabajo', 3),
    ]);
    abrirCampo(formulario);
    // ET10: el orden del Núcleo, de la A a la Z.
    const lista = within(formulario).getByRole('list', { name: 'Lista de etiquetas' });
    expect(
      within(lista)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['casa', 'Estudio', 'Trabajo']);
  });
});
