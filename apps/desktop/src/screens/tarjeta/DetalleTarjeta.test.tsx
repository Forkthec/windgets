// HE-07-HU03 · Consultar el detalle de una tarjeta. Una prueba por CA en la vista; las reglas del Núcleo tienen
// su prueba ca_he_07_hu03_* en servicio_del_planificador.rs.
import { act, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kanban } from '../kanban/Kanban';
import { abrirPantalla, EN_PROGRESO, fijarHoy, screen, tarjeta } from '../kanban/pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

/** Selecciona el título de la tarjeta en el tablero y espera el detalle (ET02). */
async function abrirDetalle(titulo: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: titulo }));
  });
  return screen.getByRole('dialog', { name: 'Detalle de tarjeta' });
}

/** El valor que muestra el detalle debajo del nombre del dato. */
function valorDe(detalle: HTMLElement, nombre: string) {
  const dt = within(detalle).getByText(nombre, { selector: 'dt' });
  return dt.nextElementSibling as HTMLElement;
}

describe('HE-07-HU03 · Detalle de tarjeta', () => {
  it('HE-07-HU03-CA01 · Consultar el detalle de una tarjeta', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({
        title: 'Feria',
        type: 'event',
        due_date: '2026-11-20',
        description: 'Stand 4',
        priority: 'medium',
        label_ids: ['e1', 'e2'],
        column_id: EN_PROGRESO.id,
        scheduled_date: '2026-11-16',
        scheduled_hour: 10,
      }),
    ]);
    const detalle = await abrirDetalle('Feria');
    // ET01: sobre la pantalla actual, que sigue de fondo.
    expect(screen.getByRole('main', { name: 'Tablero Kanban', hidden: true })).toBeTruthy();
    // ET03
    expect(valorDe(detalle, 'Tipo').textContent).toBe('Evento');
    expect(valorDe(detalle, 'Título').textContent).toBe('Feria');
    expect(valorDe(detalle, 'Fecha límite').textContent).toBe('20/11/2026');
    expect(valorDe(detalle, 'Descripción').textContent).toBe('Stand 4');
    expect(valorDe(detalle, 'Prioridad').textContent).toBe('Media');
    const etiquetas = valorDe(detalle, 'Etiquetas');
    expect(within(etiquetas).getByText('Estudio')).toBeTruthy();
    expect(within(etiquetas).getByText('Casa')).toBeTruthy();
    expect(etiquetas.querySelectorAll('.wg-muestra-color')).toHaveLength(2); // con su color
    expect(valorDe(detalle, 'Columna').textContent).toBe('En progreso');
    expect(valorDe(detalle, 'Bloque horario').textContent).toBe('16/11/2026 10:00 – 11:00');
    // ET04
    for (const opcion of ['Editar', 'Eliminar', 'Cerrar']) {
      expect(within(detalle).getByRole('button', { name: opcion })).toBeTruthy();
    }
  });

  it('HE-07-HU03-CA02 · Consultar una tarjeta sin descripción, prioridad ni etiquetas', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Simple' })]);
    const detalle = await abrirDetalle('Simple');
    expect(valorDe(detalle, 'Descripción').textContent).toBe('Sin descripción');
    expect(valorDe(detalle, 'Prioridad').textContent).toBe('Sin prioridad');
    expect(valorDe(detalle, 'Etiquetas').textContent).toBe('Sin etiquetas');
    // Sin bloque horario no se muestra ese dato («si lo tiene»).
    expect(within(detalle).queryByText('Bloque horario')).toBeNull();
  });

  it('HE-07-HU03-CA03 · Consultar una tarjeta vencida', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [
      tarjeta({ title: 'Atrasada', due_date: '2026-11-10', is_overdue: true }),
    ]);
    const detalle = await abrirDetalle('Atrasada');
    expect(within(valorDe(detalle, 'Fecha límite')).getByText('Vencida')).toBeTruthy(); // ET07
  });

  it('HE-07-HU03-CA04 · Cerrar el detalle de una tarjeta', async () => {
    await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Simple' })]);
    const detalle = await abrirDetalle('Simple');
    fireEvent.click(within(detalle).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('main', { name: 'Tablero Kanban' })).toBeTruthy(); // ET08
  });

  it('una tarjeta que ya no existe cierra el detalle con «Esta tarjeta ya no existe.» (DP-04)', async () => {
    const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [tarjeta({ title: 'Borrada' })]);
    nucleo.tarjetas.length = 0;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Borrada' }));
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Esta tarjeta ya no existe.')).toBeTruthy();
  });
});
