import { useCallback, useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, PlannerItem, PlannerToday } from '@/types';
import { NOMBRE_DE_PRIORIDAD } from '@/screens/tarjeta/nombres';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';

// Widget Tareas del día de la capa (P-WAL-02). Muestra las tarjetas del planificador diario (IPC-CARD-08) con
// su casilla de completada, su título, la hora del bloque horario si la tiene y su prioridad, en el mismo orden
// (HE-06-HU02-ET01). La casilla las completa (HE-06-HU03) y «⋮» abre «Mover a» (HE-06-HU04). La capa no recibe
// el mouse: el Núcleo reenvía cada selección dentro del widget y la capa hace `click()` en el elemento
// (HE-06-HU01, `entregarSeleccion`). Por eso todo el contenido queda dentro del rectángulo del widget.

/** «08:00»: la hora de inicio del bloque horario (D-169). */
function horaVisible(hora: number): string {
  return `${String(hora).padStart(2, '0')}:00`;
}

interface ElementoProps {
  item: PlannerItem;
}

/** Una tarjeta del widget: casilla, título, hora y prioridad. */
function Elemento({ item }: ElementoProps) {
  const { card, hour } = item;
  return (
    // HE-06-HU02-ET03: una tarjeta completada va tachada y con la casilla marcada.
    <li className={`wg-tarjeta wg-fila${card.is_completed ? ' wg-tachada' : ''}`}>
      <input type="checkbox" checked={card.is_completed} aria-label={card.title} readOnly />
      <span className="wg-tarjeta__titulo">{card.title}</span>
      {hour !== null && <span>{horaVisible(hour)}</span>}
      {card.priority && <span>{NOMBRE_DE_PRIORIDAD[card.priority]}</span>}
    </li>
  );
}

export interface TareasDelDiaProps {
  invocar: Invoke;
  escuchar: Escuchar;
}

export function TareasDelDia({ invocar, escuchar }: TareasDelDiaProps) {
  const [dia, setDia] = useState<PlannerToday | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('planner_get_today', {});
    if (r.ok) setDia(r.value);
  }, [invocar]);

  useEffect(() => {
    void leer();
    // HE-06-HU02-ET02: EV-07 tras crear, editar, completar, mover o eliminar tarjetas (CA02 a CA04).
    const dejarTarjetas = escuchar('cards_changed', () => void leer());
    // HE-06-HU02-ET04: EV-22 cuando la hora local pasa a las 00:00 (CA06).
    const dejarDia = escuchar('day_changed', () => void leer());
    return () => {
      dejarTarjetas();
      dejarDia();
    };
  }, [escuchar, leer]);

  if (!dia) return null;
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      {dia.items.length === 0 ? (
        // HE-06-HU02-CA05: estado vacío (RT-04).
        <EstadoVacio texto="No tienes tarjetas para hoy." />
      ) : (
        <ul className="wg-columna__tarjetas wg-planificador" aria-label="Tarjetas de hoy">
          {dia.items.map((item) => (
            <Elemento key={item.card.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
