// HE-09-HU01 · Consultar las tarjetas en el tablero Kanban organizadas por columnas. Una prueba por CA en la
// vista; las reglas del Núcleo tienen su prueba ca_he_09_hu01_* en servicio_del_planificador.rs.
import { fireEvent, within } from '@testing-library/react';
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
    // docs/rediseno.md RD-49 (Figma 93:12): la fecha corta.
    expect(within(leer).getByText('18 nov')).toBeTruthy();
    expect(within(leer).getByText('Alta')).toBeTruthy();
    expect(within(columna('En progreso')).getByText('Ensayo')).toBeTruthy();
    expect(within(columna('En progreso')).getByText('Baja')).toBeTruthy();
  });

  it('RD-74 · Una barra por etiqueta (hasta 3), sin barra sin etiquetas, y «Tipo · fecha · prioridad»', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({
        title: 'Leer el capítulo 3',
        due_date: '2026-11-18',
        priority: 'high',
        label_ids: ['e1', 'e2'],
      }),
      tarjeta({ title: 'Ensayo', due_date: '2027-01-05' }),
    ]);
    const leer = within(columna('Por hacer')).getByText('Leer el capítulo 3').closest('li') as HTMLElement;
    const barras = Array.from(leer.querySelectorAll<HTMLElement>('.wg-kanban__barra'));
    // D-11: todas las etiquetas, no solo la primera.
    expect(barras).toHaveLength(2);
    expect(barras[0]?.style.background).toBe('rgb(33, 150, 243)');
    expect(leer.querySelector('.wg-kanban__barras')?.getAttribute('aria-hidden')).toBe('true');
    const detalle = Array.from(leer.querySelectorAll('.wg-kanban__detalle > span')).map((e) => e.textContent);
    expect(detalle).toEqual(['Tarea', '18 nov', 'Alta']);
    // Sin etiquetas no hay barra (antes salía roja); de otro año, la fecha lleva el año.
    const ensayo = within(columna('Por hacer')).getByText('Ensayo').closest('li') as HTMLElement;
    expect(ensayo.querySelector('.wg-kanban__barra')).toBeNull();
    expect(within(ensayo).getByText('5 ene 2027')).toBeTruthy();
    // El menú «⋮» se conserva (RT-02-ET10).
    expect(within(ensayo).getByRole('button', { name: 'Acciones de Ensayo' })).toBeTruthy();
  });

  it('RD-74 · Cualquier parte de la tarjeta abre el detalle; el «⋮» no', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Ensayo' })]);
    const ensayo = within(columna('Por hacer')).getByText('Ensayo').closest('li') as HTMLElement;
    fireEvent.click(within(ensayo).getByRole('button', { name: 'Acciones de Ensayo' }));
    expect(screen.queryByRole('dialog', { name: 'Detalle de tarjeta' })).toBeNull();
    fireEvent.click(ensayo.querySelector('.wg-kanban__detalle') as HTMLElement);
    expect(await screen.findByRole('dialog', { name: 'Detalle de tarjeta' })).toBeTruthy();
  });

  it('RD-74 · «+» de nueva tarjeta solo en Por hacer y «Nueva columna» como columna fantasma (D-08, D-09)', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
    expect(within(columna('Por hacer')).getByRole('button', { name: 'Nueva tarjeta' })).toBeTruthy();
    expect(within(columna('En progreso')).queryByRole('button', { name: 'Nueva tarjeta' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Nueva tarjeta' })).toHaveLength(1);
    const fantasma = screen.getByRole('button', { name: 'Nueva columna' });
    expect(fantasma.classList.contains('wg-columna-fantasma')).toBe(true);
    expect(fantasma.textContent).toBe('+');
  });

  it('RD-74 · El interruptor de vista resalta la vista actual', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban);
    const compacta = screen.getByRole('button', { name: 'Vista compacta' });
    const expandida = screen.getByRole('button', { name: 'Vista expandida' });
    expect(compacta.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(expandida);
    expect(expandida.getAttribute('aria-pressed')).toBe('true');
    expect(compacta.getAttribute('aria-pressed')).toBe('false');
  });

  it('RD-73 · La tarjeta que vence hoy o mañana se marca en amarillo con «Vence…» (D-03)', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Hoy', due_date: '2026-11-14' }),
      tarjeta({ title: 'Lejos', due_date: '2026-11-30' }),
    ]);
    const hoy = screen.getByText('Hoy').closest('li') as HTMLElement;
    expect(hoy.classList.contains('wg-kanban__tarjeta--proxima')).toBe(true);
    expect(within(hoy).getByText('Vence hoy')).toBeTruthy();
    const lejos = screen.getByText('Lejos').closest('li') as HTMLElement;
    expect(lejos.className).not.toContain('--proxima');
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
