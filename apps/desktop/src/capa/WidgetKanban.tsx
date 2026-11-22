import { useCallback, useEffect, useRef, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { EscucharArrastre } from '@/ipc/arrastreReenviado';
import type { Invoke, KanbanWidgetColumn, KanbanWidgetData } from '@/types';
import { type LugarDeSoltar, movimientoDelArrastre } from '@/screens/kanban/arrastre';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { abrirPantalla } from './abrirPantalla';

// Widget Kanban de la capa (P-WAL-02, HE-06-HU05). Muestra las columnas del tablero en su orden, con su nombre,
// su color y su cantidad de tarjetas, y hasta 5 títulos por columna con «+N más» (IPC-CARD-15; ET01, ET02).
// Se vuelve a leer con EV-07 y EV-09 (ET03). El contenido queda dentro del rectángulo del widget: el Núcleo
// solo reenvía las selecciones que caen dentro (HE-06-HU01).
//
// Drag-and-drop (HE-06-HU06): la capa no recibe el mouse (D-186). Una selección reenviada (EV-18) sobre una
// tarjeta visible la toma; el Núcleo reenvía después el movimiento y el lugar donde se suelta
// (`pointer_drag_forwarded`) y el widget mueve la tarjeta con IPC-CARD-06, como el tablero (`arrastre.ts`).

/** HE-06-HU06-ET08: un arrastre que no termina en este tiempo devuelve la tarjeta a su columna original. */
export const LIMITE_DEL_ARRASTRE_MS = 10_000;

/** La tarjeta que se arrastra: dónde se tomó, dónde va el puntero y el lugar donde se soltaría. */
interface Arrastre {
  id: string;
  origen: { x: number; y: number };
  punto: { x: number; y: number };
  lugar: LugarDeSoltar | undefined;
  /** Si el puntero se desplazó desde que se tomó: solo entonces la tarjeta sigue al puntero. */
  movido: boolean;
}

interface ColumnaProps {
  columna: KanbanWidgetColumn;
  arrastre: Arrastre | null;
}

/** Una columna del widget: encabezado con color, nombre y cantidad, y sus títulos. */
function Columna({ columna, arrastre }: ColumnaProps) {
  const { column, titles, extra_count } = columna;
  const destino = arrastre?.lugar?.columna === column.id && !arrastre.lugar.tarjeta;
  return (
    <section
      className={`wg-columna wg-columna--widget${destino ? ' wg-columna--destino' : ''}`}
      aria-label={column.name}
      data-columna={column.id}
    >
      <h2 className="wg-fila wg-columna__encabezado">
        {/* El color acompaña al nombre: el significado no depende solo del color (interfaz.md). */}
        <span className="wg-muestra-color" style={{ background: column.color_hex }} aria-hidden="true" />
        <span>{column.name}</span>
        <span className="wg-columna__cantidad">{column.card_count}</span>
      </h2>
      {titles.length > 0 && (
        <ul className="wg-columna__tarjetas">
          {titles.map((t) => {
            const arrastrada = arrastre?.id === t.card_id;
            const clases = [
              'wg-tarjeta',
              'wg-tarjeta__titulo',
              arrastrada && 'wg-tarjeta--arrastrada',
              arrastre?.lugar?.tarjeta === t.card_id && !arrastrada && 'wg-tarjeta--destino',
            ];
            return (
              // HE-06-HU06-ET02: solo las tarjetas visibles se arrastran; las de «+N más», desde el tablero.
              <li
                key={t.card_id}
                className={clases.filter(Boolean).join(' ')}
                data-tarjeta={t.card_id}
                // La tarjeta sigue al puntero y no tapa el lugar donde se suelta. Sin moverla, sigue siendo el
                // elemento que recibe la selección al soltar (HE-06-HU08-ET05).
                style={
                  arrastrada && arrastre.movido
                    ? {
                        transform: `translate(${arrastre.punto.x - arrastre.origen.x}px, ${
                          arrastre.punto.y - arrastre.origen.y
                        }px)`,
                        pointerEvents: 'none',
                      }
                    : undefined
                }
              >
                {t.title}
              </li>
            );
          })}
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
  escucharArrastre: EscucharArrastre;
}

export function WidgetKanban({ invocar, escuchar, escucharArrastre }: WidgetKanbanProps) {
  const [tablero, setTablero] = useState<KanbanWidgetData | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const actual = useRef<Arrastre | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const cambiar = (siguiente: Arrastre | null) => {
      actual.current = siguiente;
      setArrastre(siguiente);
    };
    /** El elemento del widget que está en el punto, o nada si el punto cae fuera del widget. */
    const enElWidget = (x: number, y: number) => {
      const elemento = document.elementFromPoint(x, y);
      return elemento instanceof HTMLElement && raiz.current?.contains(elemento) ? elemento : null;
    };
    /** Sobre una tarjeta: antes de ella; sobre una columna: al final; fuera de las columnas: ninguno (ET05). */
    const lugarEn = (x: number, y: number): LugarDeSoltar | undefined => {
      const elemento = enElWidget(x, y);
      const columna = elemento?.closest<HTMLElement>('[data-columna]')?.dataset.columna;
      if (!elemento || !columna) return undefined;
      return { columna, tarjeta: elemento.closest<HTMLElement>('[data-tarjeta]')?.dataset.tarjeta };
    };
    let limite: ReturnType<typeof setTimeout> | undefined;
    // EV-18: la selección sobre una tarjeta visible la toma; cualquier otra no empieza un arrastre.
    const dejarSeleccion = escuchar('pointer_forwarded', ({ x, y }) => {
      clearTimeout(limite);
      const id = enElWidget(x, y)?.closest<HTMLElement>('[data-tarjeta]')?.dataset.tarjeta;
      cambiar(id ? { id, origen: { x, y }, punto: { x, y }, lugar: lugarEn(x, y), movido: false } : null);
      // HE-06-HU06-ET08: si el arrastre no termina en 10 s, la tarjeta vuelve a su columna original, como al
      // soltarla fuera de las columnas (CA04).
      if (id) limite = setTimeout(() => cambiar(null), LIMITE_DEL_ARRASTRE_MS);
    });
    const dejarArrastre = escucharArrastre(({ x, y, phase }) => {
      const tomada = actual.current;
      if (!tomada) return;
      if (phase === 'up') clearTimeout(limite);
      const lugar = lugarEn(x, y);
      if (phase === 'move') {
        const movido = tomada.movido || x !== tomada.origen.x || y !== tomada.origen.y;
        cambiar({ ...tomada, punto: { x, y }, lugar, movido });
        return;
      }
      cambiar(null);
      // HE-06-HU08-ET05, ET08: seleccionada sin moverla no se mueve; su detalle lo abre la selección al soltar
      // (EV-27), no el arrastre.
      if (!tomada.movido && x === tomada.origen.x && y === tomada.origen.y) return;
      // HE-06-HU06-ET01, ET03, ET04: el Núcleo mueve la tarjeta y la completa o la saca de Hecho. Soltada fuera
      // de las columnas o sobre sí misma no cambia (ET05). El widget no se mueve ni cambia de tamaño (ET06).
      const movimiento = movimientoDelArrastre(tomada.id, lugar);
      if (movimiento) void invocar('card_move', movimiento).then(() => leer());
    });
    return () => {
      clearTimeout(limite);
      dejarSeleccion();
      dejarArrastre();
    };
  }, [escuchar, escucharArrastre, invocar, leer]);

  if (!tablero) return null;
  const sinTarjetas = tablero.columns.every((c) => c.column.card_count === 0);
  return (
    <div
      ref={raiz}
      style={{ width: '100%', height: '100%', overflow: 'auto' }}
      // HE-06-HU08-CA03, ET05: una tarjeta abre su detalle en el Tablero Kanban. CA04, ET04: el encabezado de una
      // columna, «+N más» y los espacios sin tarjetas abren el tablero.
      onClick={(e) => {
        if (!(e.target instanceof Element)) return;
        const id = e.target.closest<HTMLElement>('[data-tarjeta]')?.dataset.tarjeta;
        abrirPantalla(invocar, 'kanban', id ? { card_id: id } : undefined);
      }}
    >
      {/* HE-06-HU05-CA04: las columnas vacías y el estado vacío del tablero (RT-04). */}
      {sinTarjetas && <EstadoVacio texto="Tu tablero no tiene tarjetas." />}
      <div className="wg-tablero wg-tablero--widget">
        {tablero.columns.map((c) => (
          <Columna key={c.column.id} columna={c} arrastre={arrastre} />
        ))}
      </div>
    </div>
  );
}
