// HE-08-HU01 · Consultar las etiquetas creadas. Una prueba por CA en la vista; las reglas del Núcleo tienen su
// prueba ca_he_08_hu01_* en servicio_del_planificador/pruebas_de_etiquetas.rs.
import { fireEvent, within } from '@testing-library/react';
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
    // ET02: nombre, color y el botón de acciones «⋮» con «Editar» y «Eliminar» en cada una (RT-02-ET10);
    // ET03: «Nueva etiqueta».
    for (const [i, fila] of filas.entries()) {
      const nombre = ['Casa', 'Estudio'][i] as string;
      expect(fila.querySelector('.wg-muestra-color')).toBeTruthy();
      const acciones = within(fila).getByRole('button', { name: `Acciones de ${nombre}` });
      expect(acciones.textContent).toBe('⋮');
      fireEvent.click(acciones);
      const menu = screen.getByRole('menu', { name: `Acciones de ${nombre}` });
      expect(
        within(menu)
          .getAllByRole('menuitem')
          .map((o) => o.textContent),
      ).toEqual(['Editar', 'Eliminar']);
      fireEvent.keyDown(menu, { key: 'Escape' });
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
        .map((li) => li.querySelector('.wg-lista__nombre')?.textContent),
    ).toEqual(['casa', 'Estudio', 'Trabajo']);
  });
});

describe('Rediseño · Etiquetas (P35)', () => {
  it('RD-54 · Cada etiqueta en una fila y «Nueva etiqueta» abajo como acción principal', async () => {
    await abrir([etiqueta('Proyecto', 0), etiqueta('Universidad', 1)]);
    const lista = screen.getByRole('list', { name: 'Lista de etiquetas' });
    const nueva = screen.getByRole('button', { name: 'Nueva etiqueta' });
    expect(nueva.classList.contains('wg-boton--principal')).toBe(true);
    // Va después de la lista.
    expect(lista.compareDocumentPosition(nueva) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(lista).getAllByRole('listitem')[0]?.classList.contains('wg-lista__elemento')).toBe(true);
  });
});
