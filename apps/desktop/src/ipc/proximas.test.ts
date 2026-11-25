// RD-98 (D-06) · IPC-CARD-16 `card_list_upcoming` en el Núcleo simulado.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { invocarSimulado } from './simulado';

async function crear(title: string, due_date: string, priority?: 'high' | 'low') {
  const r = await invocarSimulado('card_create', { title, due_date, priority });
  if (!r.ok) throw new Error(r.error.code);
  return r.value;
}

async function proximas(limit: number) {
  const r = await invocarSimulado('card_list_upcoming', { limit });
  if (!r.ok) throw new Error(r.error.code);
  return r.value.map((t) => t.title);
}

describe('RD-98 · card_list_upcoming en el Núcleo simulado', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 14, 12));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it('entrega como mucho las pedidas, sin vencidas, hechas ni eliminadas, la más cercana primero', async () => {
    await crear('Ayer', '2026-11-13');
    await crear('Diciembre', '2026-12-01');
    await crear('Mañana baja', '2026-11-15', 'low');
    await crear('Mañana alta', '2026-11-15', 'high');
    const hecha = await crear('Hecha', '2026-11-14');
    await invocarSimulado('card_set_completed', { card_id: hecha.id, completed: true });
    const eliminada = await crear('Eliminada', '2026-11-14');
    await invocarSimulado('card_delete', { id: eliminada.id });
    await crear('Hoy', '2026-11-14');
    expect(await proximas(3)).toEqual(['Hoy', 'Mañana alta', 'Mañana baja']);
    expect(await proximas(1)).toEqual(['Hoy']);
  });

  it('un límite fuera de 1 a 3 responde limit.out_of_range en limit', async () => {
    for (const limit of [-1, 0, 4]) {
      await expect(invocarSimulado('card_list_upcoming', { limit })).resolves.toEqual({
        ok: false,
        error: { code: 'limit.out_of_range', message: '', field: 'limit' },
      });
    }
  });
});
