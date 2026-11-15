// HE-08-HU01 · Consultar las etiquetas creadas. Una prueba por CA en la vista; las reglas del Núcleo tienen su
// prueba ca_he_08_hu01_* en servicio_del_planificador/pruebas_de_etiquetas.rs.
import { within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Label } from '@/types';
import { abrirPantalla, fijarHoy, screen } from '../kanban/pruebas';
import { Labels } from './Labels';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

function etiqueta(name: string, i: number): Label {
  return { id: `e${i}`, name, color_id: 'blue', color_hex: '#2196F3', card_count: 0 };
}

/** Abre Etiquetas con las etiquetas que devuelve el Núcleo (ya en orden alfabético, D-165). */
async function abrir(etiquetas: Label[]) {
  const nucleo = await abrirPantalla('labels', 'Etiquetas', Labels);
  nucleo.etiquetas.splice(0, nucleo.etiquetas.length, ...etiquetas);
  nucleo.emitir('labels_changed', { ids: [], op: 'upsert', origin: 'local' });
  await screen.findByRole('main', { name: 'Etiquetas' });
  return nucleo;
}

describe('HE-08-HU01 · Etiquetas', () => {
  it('HE-08-HU01-CA01 · Consultar la lista de etiquetas', async () => {
    await abrir([etiqueta('Casa', 1), etiqueta('Estudio', 2)]);
    const lista = await screen.findByRole('list', { name: 'Lista de etiquetas' });
    const filas = within(lista).getAllByRole('listitem');
    // ET02: nombre, color, «Editar» y «Eliminar» en cada una; ET03: «Nueva etiqueta».
    for (const fila of filas) {
      expect(fila.querySelector('.wg-muestra-color')).toBeTruthy();
      expect(within(fila).getByRole('button', { name: 'Editar' })).toBeTruthy();
      expect(within(fila).getByRole('button', { name: 'Eliminar' })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Nueva etiqueta' })).toBeTruthy();
  });

  it('HE-08-HU01-CA02 · Consultar la pantalla Etiquetas sin etiquetas creadas', async () => {
    await abrir([]);
    // ET04: el estado vacío en lugar de la lista, con «Nueva etiqueta».
    expect(
      await screen.findByText('Aún no tienes etiquetas. Crea una para clasificar tus tarjetas.'),
    ).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Lista de etiquetas' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Nueva etiqueta' })).toBeTruthy();
  });

  it('HE-08-HU01-CA03 · Consultar las etiquetas en orden alfabético', async () => {
    await abrir([etiqueta('casa', 1), etiqueta('Estudio', 2), etiqueta('Trabajo', 3)]);
    const lista = await screen.findByRole('list', { name: 'Lista de etiquetas' });
    // ET05: la vista conserva el orden del Núcleo, de la A a la Z.
    expect(
      within(lista)
        .getAllByRole('listitem')
        .map((li) => li.textContent?.replace('EditarEliminar', '')),
    ).toEqual(['casa', 'Estudio', 'Trabajo']);
  });
});
