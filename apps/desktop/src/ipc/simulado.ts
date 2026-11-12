import type { Err } from '@/types';

// Núcleo simulado para `pnpm --filter desktop dev`: «solo las vistas en el navegador, con IPC simulado»
// (convenciones.md, «Ejecutar en desarrollo»). Responde a todo comando con un error neutro hasta que cada HU
// (historia de usuario) defina la respuesta simulada de su comando. El mensaje va vacío porque ningún CA
// (criterio de aceptación) lo define (tipos.ts, AppError.message).
export async function invocarSimulado(): Promise<Err> {
  return { ok: false, error: { code: 'internal.unexpected', message: '' } };
}
