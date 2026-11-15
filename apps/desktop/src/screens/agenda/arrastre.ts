import type { CardAssignTimeBlockParams } from '@/types';

// Drag-and-drop de la agenda diaria (HE-11-HU02-ET01): cada bloque horario es un lugar donde soltar.

/** Lo que lleva cada bloque horario donde se puede soltar una tarjeta. */
export type BloqueDeSoltar = { hora: number };

/**
 * La asignación que corresponde a soltar la tarjeta `id`, que está en el bloque `horaActual` (o sin horario),
 * sobre `bloque` del día `dia`. Fuera de todo bloque, o en su mismo bloque, no hay asignación y la tarjeta
 * vuelve a su lugar de origen.
 */
export function asignacionDelArrastre(
  id: string,
  horaActual: number | null,
  bloque: BloqueDeSoltar | undefined,
  dia: string,
): CardAssignTimeBlockParams | null {
  if (!bloque || bloque.hora === horaActual) return null;
  return { card_id: id, date: dia, hour: bloque.hora };
}
