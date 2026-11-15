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

/** Prefijo del id de arrastre del encabezado de una columna (HE-09-HU05-ET01). */
export const ENCABEZADO = 'encabezado:';

/**
 * El orden completo de las columnas (IPC-COL-04) al soltar el encabezado de la columna `id` en `lugar`: la
 * columna queda en el lugar de la columna donde se soltó (también al soltarla sobre una de sus tarjetas). Fuera
 * del área de columnas, o sobre sí misma, no hay cambio y se mantiene el orden anterior (HE-09-HU05-ET02).
 */
export function ordenDelArrastre(
  orden: readonly string[],
  id: string,
  lugar: LugarDeSoltar | undefined,
): string[] | null {
  if (!lugar || lugar.columna === id) return null;
  const destino = orden.indexOf(lugar.columna);
  if (destino < 0 || !orden.includes(id)) return null;
  const sin = orden.filter((c) => c !== id);
  sin.splice(destino, 0, id);
  return sin;
}
