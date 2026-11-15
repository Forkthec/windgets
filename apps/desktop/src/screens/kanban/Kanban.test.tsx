// HE-09-HU01 · Consultar las tarjetas en el tablero Kanban organizadas por columnas. Una prueba por CA en la
// vista; las reglas del Núcleo tienen su prueba ca_he_09_hu01_* en servicio_del_planificador.rs.
import { within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kanban } from './Kanban';
import { abrirPantalla, EN_PROGRESO, fijarHoy, HECHO, screen, tarjeta } from './pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const VACIA = 'No hay tarjetas en esta columna.';

function columna(nombre: string) {
  return screen.getByRole('region', { name: nombre });
}

function cantidadDe(nombre: string) {
  return columna(nombre).querySelector('.wg-columna__cantidad')?.textContent;
}

describe('HE-09-HU01 · Tablero Kanban', () => {
  it('HE-09-HU01-CA01 · Tablero sin tarjetas', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
    // ET02: las columnas por defecto, en ese orden; ET01: nombre, color y cantidad 0; ET04: estado vacío.
    const nombres = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'));
    expect(nombres).toEqual(['Por hacer', 'En progreso', 'Hecho']);
    for (const nombre of nombres as string[]) {
      expect(cantidadDe(nombre)).toBe('0');
      expect(columna(nombre).querySelector('.wg-muestra-color')).toBeTruthy();
      expect(within(columna(nombre)).getByText(VACIA)).toBeTruthy();
    }
    // ET03: las tres opciones del tablero.
    for (const opcion of ['Nueva tarjeta', 'Nueva columna', 'Vista expandida']) {
      expect(screen.getByRole('button', { name: opcion })).toBeTruthy();
    }
  });

  it('HE-09-HU01-CA02 · Tablero con tarjetas', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Leer el capítulo 3', due_date: '2026-11-18', priority: 'high' }),
      tarjeta({ title: 'Resumen', due_date: '2026-11-19' }),
      tarjeta({ title: 'Ensayo', column_id: EN_PROGRESO.id, priority: 'low' }),
    ]);
    expect([cantidadDe('Por hacer'), cantidadDe('En progreso'), cantidadDe('Hecho')]).toEqual([
      '2',
      '1',
      '0',
    ]);
    // ET05: vista compacta con título, fecha límite y prioridad.
    const leer = within(columna('Por hacer')).getByText('Leer el capítulo 3').closest('li') as HTMLElement;
    expect(within(leer).getByText('18/11/2026')).toBeTruthy();
    expect(within(leer).getByText('Alta')).toBeTruthy();
    expect(within(columna('En progreso')).getByText('Ensayo')).toBeTruthy();
    expect(within(columna('En progreso')).getByText('Baja')).toBeTruthy();
  });

  it('HE-09-HU01-CA03 · Columna sin tarjetas entre columnas con tarjetas', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Sola' })]);
    expect(within(columna('Por hacer')).queryByText(VACIA)).toBeNull();
    expect(within(columna('En progreso')).getByText(VACIA)).toBeTruthy();
    expect(within(columna('Hecho')).getByText(VACIA)).toBeTruthy();
  });

  it('HE-09-HU01-CA04 · Tarjeta vencida en el tablero', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Atrasada', due_date: '2026-11-13', is_overdue: true }),
    ]);
    const atrasada = screen.getByText('Atrasada').closest('li') as HTMLElement;
    expect(within(atrasada).getByText('Vencida')).toBeTruthy(); // ET06
  });

  it('HE-09-HU01-CA05 · Tarjeta completada en el tablero', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Hecha', due_date: '2026-11-01', column_id: HECHO.id, is_completed: true }),
    ]);
    const hecha = within(columna('Hecho')).getByText('Hecha').closest('li') as HTMLElement;
    expect(within(hecha).queryByText('Vencida')).toBeNull(); // ET07
  });

  it('vuelve a leer el tablero cuando cambian las tarjetas (EV-07)', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
    nucleo.tarjetas.push(tarjeta({ title: 'Desde otro lugar' }));
    nucleo.emitir('cards_changed', { ids: ['x'], op: 'upsert', origin: 'remote' });
    expect(await within(columna('Por hacer')).findByText('Desde otro lugar')).toBeTruthy();
  });
});
