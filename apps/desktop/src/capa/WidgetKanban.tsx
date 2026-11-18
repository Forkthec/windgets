import { useCallback, useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, KanbanWidgetColumn, KanbanWidgetData } from '@/types';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';

// Widget Kanban de la capa (P-WAL-02, HE-06-HU05). Muestra las columnas del tablero en su orden, con su nombre,
// su color y su cantidad de tarjetas, y hasta 5 títulos por columna con «+N más» (IPC-CARD-15; ET01, ET02).
// Se vuelve a leer con EV-07 y EV-09 (ET03). El contenido queda dentro del rectángulo del widget: el Núcleo
// solo reenvía las selecciones que caen dentro (HE-06-HU01).

/** Una columna del widget: encabezado con color, nombre y cantidad, y sus títulos. */
function Columna({ columna }: { columna: KanbanWidgetColumn }) {
  const { column, titles, extra_count } = columna;
  return (
    <section className="wg-columna wg-columna--widget" aria-label={column.name}>
      <h2 className="wg-fila wg-columna__encabezado">
        {/* El color acompaña al nombre: el significado no depende solo del color (interfaz.md). */}
        <span className="wg-muestra-color" style={{ background: column.color_hex }} aria-hidden="true" />
        <span>{column.name}</span>
        <span className="wg-columna__cantidad">{column.card_count}</span>
      </h2>
      {titles.length > 0 && (
        <ul className="wg-columna__tarjetas">
          {titles.map((t) => (
            <li key={t.card_id} className="wg-tarjeta wg-tarjeta__titulo">
              {t.title}
            </li>
          ))}
        </ul>
      )}
      {/* HE-06-HU05-CA03: la cantidad de tarjetas que no caben en el widget. */}
      {extra_count > 0 && <p className="wg-columna__mas">{`+${extra_count} más`}</p>}
    </section>
  );
}

export interface WidgetKanbanProps {
  invocar: Invoke;
  escuchar: Escuchar;
}

export function WidgetKanban({ invocar, escuchar }: WidgetKanbanProps) {
  const [tablero, setTablero] = useState<KanbanWidgetData | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('kanban_widget_get', {});
    if (r.ok) setTablero(r.value);
  }, [invocar]);

  useEffect(() => {
    void leer();
    // HE-06-HU05-ET03: EV-07 al crear, mover o eliminar tarjetas y EV-09 al cambiar columnas (CA02).
    const dejarTarjetas = escuchar('cards_changed', () => void leer());
    const dejarColumnas = escuchar('columns_changed', () => void leer());
    return () => {
      dejarTarjetas();
      dejarColumnas();
    };
  }, [escuchar, leer]);

  if (!tablero) return null;
  const sinTarjetas = tablero.columns.every((c) => c.column.card_count === 0);
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      {/* HE-06-HU05-CA04: las columnas vacías y el estado vacío del tablero (RT-04). */}
      {sinTarjetas && <EstadoVacio texto="Tu tablero no tiene tarjetas." />}
      <div className="wg-tablero wg-tablero--widget">
        {tablero.columns.map((c) => (
          <Columna key={c.column.id} columna={c} />
        ))}
      </div>
    </div>
  );
}
