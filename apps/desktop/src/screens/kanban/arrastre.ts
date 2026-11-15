import type { CardMoveParams } from '@/types';

// Drag-and-drop del Tablero Kanban (HE-09-HU02-ET01). Cada columna y cada tarjeta es un lugar donde soltar.

/** Lo que lleva cada lugar donde se puede soltar una tarjeta. */
export type LugarDeSoltar = { columna: string; tarjeta?: string };

/**
 * El movimiento que corresponde a soltar la tarjeta `id` en `lugar`. Sobre otra tarjeta: antes de ella (ET08);
 * sobre una columna: al final. Fuera de toda columna, o sobre sí misma, no hay movimiento y la tarjeta vuelve a
 * su columna y posición originales (ET09).
 */
export function movimientoDelArrastre(id: string, lugar: LugarDeSoltar | undefined): CardMoveParams | null {
  if (!lugar || lugar.tarjeta === id) return null;
  return {
    card_id: id,
    column_id: lugar.columna,
    placement: lugar.tarjeta ? { kind: 'before', card_id: lugar.tarjeta } : { kind: 'end' },
  };
}
