import type { CardType, Priority } from '@/types';

// Nombres visibles de los valores de una tarjeta (glosario: Tarjeta; HE-07-HU01-ET05, ET11).

export const NOMBRE_DE_TIPO: Record<CardType, string> = {
  task: 'Tarea',
  reminder: 'Recordatorio',
  event: 'Evento',
};

export const NOMBRE_DE_PRIORIDAD: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};
