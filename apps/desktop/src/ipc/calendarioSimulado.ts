import type { CalendarMonth, Card } from '@/types';

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
