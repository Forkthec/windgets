// HE-08-HU02 · Crear una etiqueta con nombre y color. Una prueba por CA en la vista; las reglas del Núcleo tienen
// su prueba ca_he_08_hu02_* en servicio_del_planificador/pruebas_de_etiquetas.rs.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Label } from '@/types';
import { abrirPantalla, fijarHoy, llamadasA, screen } from '../kanban/pruebas';
import { Labels } from './Labels';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

function etiqueta(name: string, i: number): Label {
  return { id: `x${i}`, name, color_id: 'blue', color_hex: '#2196F3', card_count: 0 };
}

async function abrir(etiquetas: Label[] = []) {
  const nucleo = await abrirPantalla('labels', 'Etiquetas', Labels);
  nucleo.etiquetas.splice(0, nucleo.etiquetas.length, ...etiquetas);
  nucleo.emitir('labels_changed', { ids: [], op: 'upsert', origin: 'local' });
  await screen.findByRole('main', { name: 'Etiquetas' });
  return nucleo;
}

/** Abre el Formulario de etiqueta con «Nueva etiqueta» y espera el catálogo de colores. */
async function abrirFormulario() {
  fireEvent.click(await screen.findByRole('button', { name: 'Nueva etiqueta' }));
  const ventana = await screen.findByRole('dialog', { name: 'Nueva etiqueta' });
  await within(ventana).findByRole('radio', { name: 'Verde' });
  return ventana;
}

function escribirNombre(ventana: HTMLElement, nombre: string) {
  fireEvent.change(within(ventana).getByLabelText('Nombre'), { target: { value: nombre } });
}

function guardar(ventana: HTMLElement) {
  fireEvent.click(within(ventana).getByRole('button', { name: 'Guardar' }));
}

/** El mensaje de campo que queda debajo de un control (RT-04). */
function mensajeDe(control: HTMLElement) {
  return control.closest('.wg-campo')?.querySelector('.wg-campo__mensaje')?.textContent;
}

describe('HE-08-HU02 · Crear una etiqueta', () => {
  it('HE-08-HU02-CA01 · Crear una etiqueta con nombre y color', async () => {
    const nucleo = await abrir([etiqueta('Casa', 1)]);
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Estudio');
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Verde' }));
    guardar(ventana);
    // ET08, ET09: cierra el formulario, la lista la muestra y el mensaje es «Etiqueta creada.».
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull());
    expect(await screen.findByText('Etiqueta creada.')).toBeTruthy();
    const lista = await screen.findByRole('list', { name: 'Lista de etiquetas' });
    expect(await within(lista).findByText('Estudio')).toBeTruthy();
    expect(llamadasA(nucleo, 'label_create')).toEqual([{ name: 'Estudio', color_id: 'green' }]);
  });

  it('HE-08-HU02-CA02 · Rechazar un nombre vacío', async () => {
    const nucleo = await abrir();
    const ventana = await abrirFormulario();
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Azul' }));
    guardar(ventana);
    // ET10
    await waitFor(() =>
      expect(mensajeDe(within(ventana).getByLabelText('Nombre'))).toBe('Este campo es obligatorio.'),
    );
    expect(llamadasA(nucleo, 'label_create')).toEqual([]);
  });

  it('HE-08-HU02-CA03 · Rechazar un nombre de más de 30 caracteres', async () => {
    const nucleo = await abrir();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'a'.repeat(31));
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Azul' }));
    guardar(ventana);
    // ET11
    await waitFor(() =>
      expect(mensajeDe(within(ventana).getByLabelText('Nombre'))).toBe(
        'El nombre de la etiqueta no puede superar los 30 caracteres.',
      ),
    );
    expect(llamadasA(nucleo, 'label_create')).toEqual([]);
  });

  it('HE-08-HU02-CA04 · Rechazar un nombre duplicado', async () => {
    const nucleo = await abrir([etiqueta('Estudio', 1)]);
    // ET04, ET12: la unicidad la responde el Núcleo.
    nucleo.responder('label_create', () => ({
      ok: false,
      error: { code: 'name.duplicate', message: 'Ya existe una etiqueta con ese nombre.', field: 'name' },
    }));
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'ESTUDIO');
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Azul' }));
    guardar(ventana);
    await waitFor(() =>
      expect(mensajeDe(within(ventana).getByLabelText('Nombre'))).toBe(
        'Ya existe una etiqueta con ese nombre.',
      ),
    );
    expect(screen.getByRole('dialog', { name: 'Nueva etiqueta' })).toBeTruthy();
  });

  it('HE-08-HU02-CA05 · Rechazar una etiqueta sin color', async () => {
    const nucleo = await abrir();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Estudio');
    guardar(ventana);
    // ET14: sin color por defecto, el mensaje va debajo del campo Color.
    const color = within(ventana).getByRole('radiogroup', { name: 'Color' });
    await waitFor(() =>
      expect(color.querySelector('.wg-campo__mensaje')?.textContent).toBe('Este campo es obligatorio.'),
    );
    expect(llamadasA(nucleo, 'label_create')).toEqual([]);
  });

  it('HE-08-HU02-CA06 · Alcanzar el máximo de etiquetas', async () => {
    await abrir(Array.from({ length: 20 }, (_, i) => etiqueta(`Etiqueta ${i}`, i)));
    // ET07: deshabilitada con su texto, y no abre el formulario.
    const boton = await screen.findByRole('button', { name: 'Nueva etiqueta' });
    await waitFor(() => expect((boton as HTMLButtonElement).disabled).toBe(true));
    expect(
      screen.getByText('Alcanzaste el máximo de 20 etiquetas. Elimina una para crear otra.'),
    ).toBeTruthy();
    fireEvent.click(boton);
    expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull();
  });

  it('HE-08-HU02-CA07 · Cancelar la creación de la etiqueta', async () => {
    const nucleo = await abrir();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Estudio');
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull());
    expect(llamadasA(nucleo, 'label_create')).toEqual([]);
  });

  it('HE-08-HU02-CA08 · Crear una etiqueta sin conexión', async () => {
    // ET15: el Núcleo guarda en el computador y responde igual sin conexión; la vista no distingue.
    await abrir();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Casa');
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Gris' }));
    guardar(ventana);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva etiqueta' })).toBeNull());
    expect(await screen.findByText('Etiqueta creada.')).toBeTruthy();
  });

  it('HE-08-HU02-CA09 · Abrir el Formulario de etiqueta', async () => {
    await abrir([etiqueta('Casa', 1)]);
    const ventana = await abrirFormulario();
    // Título «Nueva etiqueta», Nombre vacío, catálogo de colores sin color elegido, «Guardar» y «Cancelar».
    expect((within(ventana).getByLabelText('Nombre') as HTMLInputElement).value).toBe('');
    const radios = within(ventana).getAllByRole('radio') as HTMLInputElement[];
    expect(radios.map((r) => r.labels?.[0]?.textContent)).toEqual(['Gris', 'Azul', 'Verde']);
    expect(radios.some((r) => r.checked)).toBe(false);
    expect(within(ventana).getByRole('button', { name: 'Guardar' })).toBeTruthy();
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });
});
