// HE-09-HU07 · Alternar entre la vista compacta y la vista expandida de las tarjetas. El Núcleo tiene sus pruebas
// ca_he_09_hu07_* en servicio_del_planificador/pruebas_del_tablero.rs.
import { fireEvent, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, PreferenceBoardCardView } from '@/types';
import { Kanban } from './Kanban';
import { abrirPantalla, fijarHoy, llamadasA, POR_HACER, screen } from './pruebas';

beforeEach(fijarHoy);
afterEach(() => {
  vi.useRealTimers();
});

const TARJETA = {
  id: 't1',
  type: 'task',
  title: 'Informe',
  description: 'x'.repeat(250),
  priority: 'high',
  due_date: '2026-11-20',
  column_id: POR_HACER.id,
  position: 1024,
  previous_column_id: null,
  completed_on: null,
  scheduled_date: null,
  scheduled_hour: null,
  label_ids: ['e1'],
  is_completed: false,
  is_overdue: false,
  created_at: '2026-11-10T00:00:00.000Z',
} as unknown as Card;

async function abrir(vista: PreferenceBoardCardView = 'compact') {
  const nucleo = await abrirPantalla('kanban', 'Tablero Kanban', Kanban, [TARJETA], (n) => {
    n.responder('preference_get', () => ({ ok: true, value: { board_card_view: vista } }));
    n.responder('preference_set', () => ({ ok: true, value: null }));
    n.etiquetas.splice(0, n.etiquetas.length, {
      id: 'e1',
      name: 'Estudio',
      color_id: 'blue',
      color_hex: '#2196F3',
      card_count: 1,
    });
  });
  const tarjeta = (await screen.findByText('Informe')).closest('li') as HTMLElement;
  return { nucleo, tarjeta: () => (screen.getByText('Informe').closest('li') as HTMLElement) ?? tarjeta };
}

describe('HE-09-HU07 · Vista compacta y vista expandida', () => {
  it('HE-09-HU07-CA01 · Alternar a la vista expandida', async () => {
    const { tarjeta } = await abrir();
    // ET01, ET02: compacta por defecto, la opción dice «Vista expandida».
    expect(within(tarjeta()).queryByText(/^x+$/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Vista expandida' }));
    // ET04: tipo, título, fecha, 200 caracteres de la descripción, prioridad y etiquetas.
    await waitFor(() => expect(within(tarjeta()).getByText('x'.repeat(200))).toBeTruthy());
    expect(within(tarjeta()).getByText('Tarea')).toBeTruthy();
    expect(within(tarjeta()).getByText('Alta')).toBeTruthy();
    expect(
      within(within(tarjeta()).getByRole('list', { name: 'Etiquetas' })).getByText('Estudio'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Vista compacta' })).toBeTruthy();
  });

  it('HE-09-HU07-CA02 · Alternar a la vista compacta', async () => {
    const { tarjeta } = await abrir('expanded');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Vista compacta' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Vista compacta' }));
    // ET03: título, fecha límite y prioridad; sin descripción ni etiquetas.
    await waitFor(() => expect(within(tarjeta()).queryByText('x'.repeat(200))).toBeNull());
    expect(within(tarjeta()).queryByRole('list', { name: 'Etiquetas' })).toBeNull();
    expect(within(tarjeta()).getByText('Alta')).toBeTruthy();
  });

  it('HE-09-HU07-CA03 · Conservar la vista elegida', async () => {
    const { nucleo } = await abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Vista expandida' }));
    // ET05: el Núcleo la guarda; al volver a abrir, preference_get la devuelve.
    await waitFor(() =>
      expect(llamadasA(nucleo, 'preference_set')).toEqual([{ board_card_view: 'expanded' }]),
    );
  });
});
