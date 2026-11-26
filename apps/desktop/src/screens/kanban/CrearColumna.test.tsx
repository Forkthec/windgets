// HE-09-HU03 · Crear una columna. Una prueba por CA en la vista; las reglas del Núcleo tienen su prueba
// ca_he_09_hu03_* en servicio_del_planificador/pruebas_del_tablero.rs.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Column } from '@/types';
import textos from '@/types/messages.es.json';
import { Kanban } from './Kanban';
import { abrirPantalla, fijarHoy, llamadasA, screen } from './pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

async function abrirTablero() {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
  await screen.findByRole('main', { name: 'Tablero Kanban' });
  return nucleo;
}

async function abrirFormulario() {
  fireEvent.click(await screen.findByRole('button', { name: 'Nueva columna' }));
  const ventana = await screen.findByRole('dialog', { name: 'Nueva columna' });
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

/** Nombres de las columnas del tablero, de izquierda a derecha. */
function columnasDelTablero() {
  return screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'));
}

describe('HE-09-HU03 · Crear una columna', () => {
  it('HE-09-HU03-CA01 · Crear una columna con nombre y color', async () => {
    const nucleo = await abrirTablero();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Revisión');
    fireEvent.click(within(ventana).getByRole('radio', { name: 'Azul' }));
    guardar(ventana);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva columna' })).toBeNull());
    expect(await screen.findByText('Columna creada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'column_create')).toEqual([{ name: 'Revisión', color_id: 'blue' }]);
    // ET09: al final del tablero.
    await waitFor(() => expect(columnasDelTablero().at(-1)).toContain('Revisión'));
  });

  it('HE-09-HU03-CA02 · Crear una columna con el color por defecto', async () => {
    const nucleo = await abrirTablero();
    const ventana = await abrirFormulario();
    // ET06: gris marcado por defecto.
    expect((within(ventana).getByRole('radio', { name: 'Gris' }) as HTMLInputElement).checked).toBe(true);
    escribirNombre(ventana, 'Revisión');
    guardar(ventana);
    expect(await screen.findByText('Columna creada.')).toBeTruthy();
    expect(llamadasA(nucleo, 'column_create')).toEqual([{ name: 'Revisión', color_id: 'gray' }]);
  });

  it('HE-09-HU03-CA03 · Nombre vacío', async () => {
    const nucleo = await abrirTablero();
    const ventana = await abrirFormulario();
    guardar(ventana);
    await waitFor(() => expect(mensajeDeNombre(ventana)).toBe('Este campo es obligatorio.'));
    expect(llamadasA(nucleo, 'column_create')).toEqual([]);
  });

  it('HE-09-HU03-CA04 · Nombre de más de 30 caracteres', async () => {
    const nucleo = await abrirTablero();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'a'.repeat(31));
    guardar(ventana);
    await waitFor(() =>
      expect(mensajeDeNombre(ventana)).toBe('El nombre de la columna no puede superar los 30 caracteres.'),
    );
    expect(llamadasA(nucleo, 'column_create')).toEqual([]);
  });

  it('HE-09-HU03-CA05 · Nombre duplicado', async () => {
    const nucleo = await abrirTablero();
    // ET04: la unicidad la responde el Núcleo.
    nucleo.responder('column_create', () => ({
      ok: false,
      error: { code: 'name.duplicate', message: 'Ya existe una columna con ese nombre.', field: 'name' },
    }));
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'revisión');
    guardar(ventana);
    await waitFor(() => expect(mensajeDeNombre(ventana)).toBe('Ya existe una columna con ese nombre.'));
    expect(screen.getByRole('dialog', { name: 'Nueva columna' })).toBeTruthy();
  });

  it('HE-09-HU03-CA06 · Máximo de columnas', async () => {
    const nucleo = await abrirTablero();
    const base = nucleo.columnas[0] as Column;
    for (let i = 0; i < 7; i++) {
      nucleo.columnas.push({ ...base, id: `c${i}`, name: `C${i}`, role: 'custom', position: 5000 + i });
    }
    nucleo.emitir('columns_changed', { ids: [], op: 'upsert', origin: 'local' });
    // ET07, ET08: 10 columnas, contadas las tres por defecto.
    // El botón deshabilitado se dibuja de nuevo con su motivo al lado: se busca otra vez.
    await waitFor(() =>
      expect((screen.getByRole('button', { name: 'Nueva columna' }) as HTMLButtonElement).disabled).toBe(
        true,
      ),
    );
    const boton = screen.getByRole('button', { name: 'Nueva columna' });
    expect(
      screen.getByText('Alcanzaste el máximo de 10 columnas. Elimina una para crear otra.'),
    ).toBeTruthy();
    fireEvent.click(boton);
    expect(screen.queryByRole('dialog', { name: 'Nueva columna' })).toBeNull();
  });

  it('HE-09-HU03-CA07 · Cancelar la creación', async () => {
    const nucleo = await abrirTablero();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Revisión');
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nueva columna' })).toBeNull());
    expect(llamadasA(nucleo, 'column_create')).toEqual([]);
  });

  it('HE-09-HU03-CA08 · Abrir el Formulario de columna', async () => {
    await abrirTablero();
    const ventana = await abrirFormulario();
    expect((within(ventana).getByLabelText('Nombre') as HTMLInputElement).value).toBe('');
    expect(within(ventana).getAllByRole('radio').length).toBe(3);
    expect(within(ventana).getByRole('button', { name: 'Guardar' })).toBeTruthy();
    expect(within(ventana).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });
});

describe('RD-91 · Todos los errores del Formulario de columna a la vez', () => {
  it('RD-91 · solo el nombre puede estar mal: el color ya viene elegido (HE-09-HU03-ET06)', async () => {
    const nucleo = await abrirTablero();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, '   ');
    guardar(ventana);
    await waitFor(() => expect(mensajeDeNombre(ventana)).toBe('Este campo es obligatorio.'));
    expect(ventana.querySelectorAll('.wg-campo__mensaje')).toHaveLength(1);
    expect((within(ventana).getByRole('radio', { name: 'Gris' }) as HTMLInputElement).checked).toBe(true);
    expect(llamadasA(nucleo, 'column_create')).toEqual([]);
  });
});

describe('RD-106 · Columna: «×» y Esc piden «Salir sin guardar» solo si hay datos', () => {
  it('RD-106 · con datos escritos, «×» muestra la confirmación de descarte', async () => {
    await abrirTablero();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Revisión');
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cerrar' }));
    expect(screen.getByText(textos.SALIR_SIN_GUARDAR)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Nueva columna' })).toBeTruthy();
  });

  it('RD-106 · con datos escritos, Esc muestra la confirmación de descarte', async () => {
    await abrirTablero();
    const ventana = await abrirFormulario();
    escribirNombre(ventana, 'Revisión');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByText(textos.SALIR_SIN_GUARDAR)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Nueva columna' })).toBeTruthy();
  });

  it('RD-106 · sin cambios, «×» cierra sin confirmar', async () => {
    await abrirTablero();
    const ventana = await abrirFormulario();
    fireEvent.click(within(ventana).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText(textos.SALIR_SIN_GUARDAR)).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Nueva columna' })).toBeNull();
  });
});
