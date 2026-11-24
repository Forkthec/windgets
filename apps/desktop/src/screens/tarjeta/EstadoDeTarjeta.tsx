import type { Card } from '@/types';
import { fechaIso, hoy } from './fechas';

// Colores de estado de una tarjeta (docs/rediseno_final_prototipos.md §3.4; rediseno_final_backend.md §4.6, D-03;
// docs/rediseno.md RD-73). Vencida (no completada y fecha límite pasada: `is_overdue` del Núcleo) siempre en rojo
// con ⚠ y «Vencida»; próxima a vencer (no completada, fecha límite hoy o mañana) en amarillo con el reloj y «Vence
// hoy» o «Vence mañana». El significado nunca depende solo del color (R-12): ícono y texto.

export type EstadoDeTarjeta = 'vencida' | 'proxima' | null;

/** D-03: la regla de presentación con la fecha local del computador. */
export function estadoDeTarjeta(
  tarjeta: Pick<Card, 'due_date' | 'is_completed' | 'is_overdue'>,
  dia = hoy(),
) {
  if (tarjeta.is_completed) return null;
  if (tarjeta.is_overdue) return 'vencida';
  const manana = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  if (tarjeta.due_date === fechaIso(dia) || tarjeta.due_date === fechaIso(manana)) return 'proxima';
  return null;
}

export function IndicadorDeEstado({
  tarjeta,
}: {
  tarjeta: Pick<Card, 'due_date' | 'is_completed' | 'is_overdue'>;
}) {
  const estado = estadoDeTarjeta(tarjeta);
  if (!estado) return null;
  if (estado === 'vencida')
    return (
      <span className="wg-estado wg-estado--vencida">
        <span aria-hidden="true">⚠</span>
        Vencida
      </span>
    );
  // DUDA: rediseno_final D-03 · el texto de «próxima a vencer» no está definido. Valor usado: «Vence hoy» o
  // «Vence mañana».
  return (
    <span className="wg-estado wg-estado--proxima">
      <span aria-hidden="true">🕒</span>
      {tarjeta.due_date === fechaIso(hoy()) ? 'Vence hoy' : 'Vence mañana'}
    </span>
  );
}
