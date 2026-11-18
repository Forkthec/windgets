import type { CalendarMonth, CalendarWeek, Card } from '@/types';

// El Calendario del Núcleo simulado y del Núcleo de prueba, con las reglas de IPC-CARD-12 (servicio del
// planificador, `mes_del_calendario`): todos los días del mes, hasta 3 títulos por día en el orden del tablero
// y la cantidad restante (HE-10-HU01-ET03, ET05).

const dos = (n: number) => String(n).padStart(2, '0');

/** `month` va de 1 a 12, como en el contrato. */
export function mesDelCalendario(tarjetas: readonly Card[], year: number, month: number): CalendarMonth {
  const dias = new Date(year, month, 0).getDate();
  return {
    days: Array.from({ length: dias }, (_, i) => {
      const date = `${year}-${dos(month)}-${dos(i + 1)}`;
      const delDia = tarjetas.filter((t) => t.due_date === date).sort((a, b) => a.position - b.position);
      return {
        date,
        preview: delDia.slice(0, 3).map((t) => ({ id: t.id, title: t.title })),
        extra_count: Math.max(delDia.length - 3, 0),
        overdue_count: 0,
        pending_count: 0,
        has_overdue: false,
        has_pending: false,
      };
    }),
  };
}

/**
 * IPC-CARD-13 (`semana_del_calendario`): los 7 días desde el lunes `week_start` con todas las tarjetas de su fecha
 * límite; primero las de bloque horario por hora y después las demás (HE-10-HU02-ET02, ET03, ET05).
 */
export function semanaDelCalendario(tarjetas: readonly Card[], week_start: string): CalendarWeek {
  const [anio, mes, dia] = week_start.split('-').map(Number);
  return {
    days: Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(anio ?? 0, (mes ?? 1) - 1, (dia ?? 1) + i);
      const date = `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
      const cards = tarjetas
        .filter((t) => t.due_date === date)
        .sort((a, b) => (a.scheduled_hour ?? 99) - (b.scheduled_hour ?? 99) || a.position - b.position)
        .map((card) => ({ card, start_hour: card.scheduled_hour }));
      return { date, cards, overdue_count: 0, pending_count: 0, has_overdue: false, has_pending: false };
    }),
  };
}
