import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import type { Card, ResolvedRange, StatusBreakdown } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from '../tarjeta/fechas';
import { Seccion } from './Seccion';
import { porcentaje } from './TasaCumplimiento';

// Sección Vencidas, pendientes y completadas (HE-13-HU04): gráfica de anillo con un segmento por estado y el
// total en el centro (ET01); la cantidad y el porcentaje de cada estado (ET03); al seleccionar un estado, la
// lista de sus tarjetas debajo (ET07, ET08), y cada título abre el Detalle de tarjeta (ET09).

type Estado = 'overdue' | 'pending' | 'completed';

// ET02: rojo para vencidas, amarillo para pendientes (como en el calendario) y el color principal del tema.
const ESTADOS: Array<{ estado: Estado; nombre: string; color: string }> = [
  { estado: 'overdue', nombre: 'Vencidas', color: 'var(--wg-estado-vencida)' },
  { estado: 'pending', nombre: 'Pendientes', color: 'var(--wg-estado-pendiente)' },
  { estado: 'completed', nombre: 'Completadas', color: 'var(--wg-accion)' },
];

const PORCENTAJE: Record<Estado, keyof StatusBreakdown> = {
  overdue: 'percent_overdue',
  pending: 'percent_pending',
  completed: 'percent_completed',
};

/** ET05: el estado actual de la tarjeta, como lo calcula el Núcleo. */
function estadoDe(tarjeta: Card): Estado {
  if (tarjeta.is_completed) return 'completed';
  return tarjeta.is_overdue ? 'overdue' : 'pending';
}

export interface EstadosTarjetasProps {
  /** `null` mientras se calcula. */
  reporte: StatusBreakdown | null;
  rango: ResolvedRange | null;
  alAbrir: (id: string) => void;
}

export function EstadosTarjetas({ reporte, rango, alAbrir }: EstadosTarjetasProps) {
  const { invocar } = useNucleo();
  const [elegido, setElegido] = useState<Estado | null>(null);
  const [lista, setLista] = useState<Card[]>([]);

  // Un nuevo cálculo (otro filtro) cierra la lista.
  useEffect(() => setElegido(null), [reporte]);

  useEffect(() => {
    if (!elegido || !rango) return;
    let vigente = true;
    // DUDA: HE-13-HU04 IPC-REP-05 no devuelve las tarjetas de cada estado; la lista sale de las tarjetas del
    // tablero (IPC-CARD-05) con fecha límite en el rango y en ese estado.
    void invocar('card_list_board', {}).then((r) => {
      if (!vigente || !r.ok) return;
      setLista(
        r.value.columns
          .flatMap((c) => c.cards)
          .filter((t) => t.due_date >= rango.start && t.due_date <= rango.end && estadoDe(t) === elegido)
          .sort((a, b) => a.due_date.localeCompare(b.due_date)),
      );
    });
    return () => {
      vigente = false;
    };
  }, [elegido, invocar, rango]);

  // ET10: un estado sin tarjetas no tiene segmento.
  const segmentos = reporte ? ESTADOS.filter((e) => reporte[e.estado] > 0) : [];
  const nombreElegido = ESTADOS.find((e) => e.estado === elegido)?.nombre;

  return (
    <Seccion titulo="Vencidas, pendientes y completadas" vacia={reporte ? reporte.is_empty : null}>
      {reporte && (
        <>
          <PieChart width={240} height={240} aria-label="Gráfica de vencidas, pendientes y completadas">
            <Pie
              data={segmentos.map((e) => ({ nombre: e.nombre, valor: reporte[e.estado] }))}
              dataKey="valor"
              nameKey="nombre"
              innerRadius={70}
              outerRadius={110}
              isAnimationActive={false}
              onClick={(_, i) => {
                const e = segmentos[i];
                if (e) setElegido(e.estado);
              }}
            >
              {segmentos.map((e) => (
                <Cell key={e.estado} fill={e.color} />
              ))}
            </Pie>
            <text x={120} y={120} textAnchor="middle" dominantBaseline="middle" className="wg-indicador">
              {reporte.total}
            </text>
          </PieChart>
          {/* ET03, ET07: la cantidad y el porcentaje de cada estado; seleccionarla abre su lista. */}
          <div className="wg-fila" role="group" aria-label="Estados">
            {ESTADOS.map((e) => (
              <Boton
                key={e.estado}
                aria-pressed={elegido === e.estado}
                onClick={() => setElegido(e.estado)}
                disabled={reporte[e.estado] === 0}
                // DUDA: HE-13-HU04 RT-04 no fija el motivo de un estado sin tarjetas; se usa un texto neutro.
                motivo="No hay tarjetas en este estado."
                motivoAlPasar
              >
                {`${e.nombre}: ${reporte[e.estado]} (${porcentaje(reporte[PORCENTAJE[e.estado]] as number)})`}
              </Boton>
            ))}
          </div>
          {elegido && (
            <ul aria-label={`Tarjetas ${nombreElegido?.toLowerCase() ?? ''}`}>
              {lista.map((t) => (
                <li key={t.id}>
                  <button type="button" className="wg-enlace" onClick={() => alAbrir(t.id)}>
                    {t.title}
                  </button>{' '}
                  <span>{fechaVisible(t.due_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Seccion>
  );
}
