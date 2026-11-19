import type { CalendarDay, CalendarMonth, CalendarWeek, Card, Column } from '@/types';

// El Calendario del Núcleo simulado y del Núcleo de prueba, con las reglas de IPC-CARD-12 (servicio del
// planificador, `mes_del_calendario`): todos los días del mes, hasta 3 títulos por día en el orden del tablero
// y la cantidad restante (HE-10-HU01-ET03, ET05).

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * Vencidas y pendientes de un día (HE-10-HU05, `EstadoDelDia`): fuera de Hecho, antes de `hoy` es vencida y desde
 * `hoy` pendiente; amarillo solo sin vencidas.
 */
function estadoDelDia(delDia: readonly Card[], date: string, hoy: string) {
  const abiertas = delDia.filter((t) => !t.is_completed).length;
  const [overdue_count, pending_count] = date < hoy ? [abiertas, 0] : [0, abiertas];
  return {
    overdue_count,
    pending_count,
    has_overdue: overdue_count > 0,
    has_pending: pending_count > 0 && overdue_count === 0,
  };
}

/** `month` va de 1 a 12, como en el contrato. */
export function mesDelCalendario(
  tarjetas: readonly Card[],
  year: number,
  month: number,
  hoy: string,
): CalendarMonth {
  const dias = new Date(year, month, 0).getDate();
  return {
    days: Array.from({ length: dias }, (_, i) => {
      const date = `${year}-${dos(month)}-${dos(i + 1)}`;
      const delDia = tarjetas.filter((t) => t.due_date === date).sort((a, b) => a.position - b.position);
      return {
        date,
        preview: delDia.slice(0, 3).map((t) => ({ id: t.id, title: t.title })),
        extra_count: Math.max(delDia.length - 3, 0),
        ...estadoDelDia(delDia, date, hoy),
      };
    }),
  };
}

/**
 * IPC-CARD-13 (`semana_del_calendario`): los 7 días desde el lunes `week_start` con todas las tarjetas de su fecha
 * límite; primero las de bloque horario por hora y después las demás (HE-10-HU02-ET02, ET03, ET05).
 */
export function semanaDelCalendario(
  tarjetas: readonly Card[],
  week_start: string,
  hoy: string,
): CalendarWeek {
  const [anio, mes, dia] = week_start.split('-').map(Number);
  return {
    days: Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(anio ?? 0, (mes ?? 1) - 1, (dia ?? 1) + i);
      const date = `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
      const delDia = tarjetas
        .filter((t) => t.due_date === date)
        .sort((a, b) => (a.scheduled_hour ?? 99) - (b.scheduled_hour ?? 99) || a.position - b.position);
      const cards = delDia.map((card) => ({ card, start_hour: card.scheduled_hour }));
      // HE-10-HU05-ET08: los mismos conteos que la vista mensual.
      return { date, cards, ...estadoDelDia(delDia, date, hoy) };
    }),
  };
}

/**
 * IPC-CARD-14 (`dia_del_calendario`): las tarjetas cuya fecha límite es `date`, con su tipo, título, prioridad y
 * columna, en el orden del tablero (HE-10-HU03-ET03). `can_create` es falso antes de `hoy` (HE-10-HU04-CA04).
 */
export function diaDelCalendario(
  tarjetas: readonly Card[],
  columnas: readonly Column[],
  date: string,
  hoy: string,
): CalendarDay {
  const cards = tarjetas
    .filter((t) => t.due_date === date)
    .sort((a, b) => a.position - b.position)
    .map((t) => ({
      id: t.id,
      type: t.type,
      title: t.title,
      priority: t.priority,
      column_name: columnas.find((c) => c.id === t.column_id)?.name ?? '',
    }));
  return { date, cards, can_create: date >= hoy };
}
