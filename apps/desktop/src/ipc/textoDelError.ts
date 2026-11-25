import type { AppError } from '@/types';
import textos from '@/types/messages.es.json';

/**
 * El texto con el que una vista muestra un error (docs/rediseno.md RD-83, que extiende RD-24 a toda la app): el del
 * Núcleo o, si llega sin texto (`internal.unexpected` y los códigos «sin texto» de contratos.md), el genérico.
 */
export function textoDelError(error: Pick<AppError, 'message'>): string {
  return error.message || textos.ERROR_INESPERADO;
}
