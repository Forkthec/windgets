import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BoardColumn, Card, CardMoveParams, Column } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from '../tarjeta/fechas';
import { MoverA } from '../tarjeta/MoverA';
import { NOMBRE_DE_PRIORIDAD, NOMBRE_DE_TIPO } from '../tarjeta/nombres';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';
import { type LugarDeSoltar, movimientoDelArrastre } from './arrastre';

// P-KAN-01 Tablero Kanban (Menú principal > Planificador > Tablero Kanban; HE-09-HU01). Las columnas y las
// tarjetas vienen del Núcleo (IPC-CARD-05); la pantalla se vuelve a leer con cards_changed y columns_changed.

/** Acciones del tablero que usan las tarjetas y las columnas. */
interface AccionesDelTablero {
  columnas: readonly Column[];
  alAbrir: (id: string) => void;
  alMover: (movimiento: CardMoveParams) => void;
}

const ContextoDelTablero = createContext<AccionesDelTablero | null>(null);

function useTablero(): AccionesDelTablero {
  const tablero = useContext(ContextoDelTablero);
  if (!tablero) throw new Error('useTablero necesita el Tablero Kanban');
  return tablero;
}

/**
 * Una tarjeta en la vista compacta (HE-09-HU01-ET05): tipo (HE-07-HU01-ET15), título, fecha límite y prioridad.
 * Se arrastra a otra columna o a otra posición (HE-09-HU02-ET01) y tiene «Mover a» (ET10).
 */
function Tarjeta({ tarjeta }: { tarjeta: Card }) {
  const { columnas, alAbrir, alMover } = useTablero();
  const arrastre = useDraggable({ id: tarjeta.id });
  const lugar: LugarDeSoltar = { columna: tarjeta.column_id, tarjeta: tarjeta.id };
  const soltar = useDroppable({ id: `tarjeta:${tarjeta.id}`, data: lugar });
  const { transform } = arrastre;
  return (
    <li
      ref={(nodo) => {
        arrastre.setNodeRef(nodo);
        soltar.setNodeRef(nodo);
      }}
      className={`wg-tarjeta${arrastre.isDragging ? ' wg-tarjeta--arrastrada' : ''}${
        soltar.isOver && !arrastre.isDragging ? ' wg-tarjeta--destino' : ''
      }`}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      {...arrastre.listeners}
    >
      <span className="wg-tarjeta__tipo">{NOMBRE_DE_TIPO[tarjeta.type]}</span>
      {/* HE-07-HU03-ET02: el título abre el Detalle de tarjeta. */}
      <button type="button" className="wg-tarjeta__titulo" onClick={() => alAbrir(tarjeta.id)}>
        {tarjeta.title}
      </button>
      <span className="wg-fila">
        <span>{fechaVisible(tarjeta.due_date)}</span>
        {/* HE-09-HU01-ET06, ET07: «Vencida» solo fuera de la columna Hecho. */}
        {tarjeta.is_overdue && <span className="wg-indicador">Vencida</span>}
      </span>
      {tarjeta.priority && <span>{NOMBRE_DE_PRIORIDAD[tarjeta.priority]}</span>}
      <MoverA
        columnas={columnas}
        actual={tarjeta.column_id}
        alElegir={(columna) =>
          alMover({ card_id: tarjeta.id, column_id: columna, placement: { kind: 'end' } })
        }
      />
    </li>
  );
}

/** Una columna con su nombre, su color y su cantidad de tarjetas (HE-09-HU01-ET01); se suelta al final. */
function Columna({ columna }: { columna: BoardColumn }) {
  const { column, cards } = columna;
  const lugar: LugarDeSoltar = { columna: column.id };
  const soltar = useDroppable({ id: `columna:${column.id}`, data: lugar });
  return (
    <section
      ref={soltar.setNodeRef}
      className={`wg-columna${soltar.isOver ? ' wg-columna--destino' : ''}`}
      aria-label={column.name}
    >
      <h2 className="wg-fila wg-columna__encabezado">
        {/* El color acompaña al nombre: el significado no depende solo del color (interfaz.md). */}
        <span className="wg-muestra-color" style={{ background: column.color_hex }} aria-hidden="true" />
        <span>{column.name}</span>
        <span className="wg-columna__cantidad">{column.card_count}</span>
      </h2>
      {cards.length === 0 ? (
        // HE-09-HU01-ET04: estado vacío de la columna (RT-04).
        <EstadoVacio texto="No hay tarjetas en esta columna." />
      ) : (
        <ul className="wg-columna__tarjetas">
          {cards.map((t) => (
            <Tarjeta key={t.id} tarjeta={t} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function Kanban() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [columnas, setColumnas] = useState<BoardColumn[] | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('card_list_board', {});
    if (r.ok) setColumnas(r.value.columns);
  }, [invocar]);

  useEffect(() => {
    void leer();
    const dejarTarjetas = escuchar('cards_changed', () => void leer());
    const dejarColumnas = escuchar('columns_changed', () => void leer());
    return () => {
      dejarTarjetas();
      dejarColumnas();
    };
  }, [escuchar, leer]);

  // Detalle, formulario y confirmación de eliminar de una tarjeta (HE-07-HU01, HU03 a HU05).
  const tarjetas = useVentanasDeTarjeta(useCallback(() => void leer(), [leer]));

  // HE-09-HU02: mover con drag-and-drop o con «Mover a». El tablero se vuelve a leer con la respuesta, que
  // trae las cantidades (ET02), la fecha de completado y el indicador «Vencida» actualizados (ET04 a ET07).
  const mover = useCallback(
    async (movimiento: CardMoveParams) => {
      const r = await invocar('card_move', movimiento);
      if (!r.ok && r.error.code === 'card.not_found') mostrarResultado(r.error.message);
      await leer();
    },
    [invocar, leer, mostrarResultado],
  );
  // Arrastrar empieza al desplazar el puntero unos píxeles: así seleccionar el título o «Mover a» no arrastra.
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const soltada = useCallback(
    ({ active, over }: DragEndEvent) => {
      const movimiento = movimientoDelArrastre(
        String(active.id),
        over?.data.current as LugarDeSoltar | undefined,
      );
      if (movimiento) void mover(movimiento);
    },
    [mover],
  );
  const { abrirDetalle } = tarjetas;
  const acciones = useMemo<AccionesDelTablero>(
    () => ({
      columnas: columnas?.map((c) => c.column) ?? [],
      alAbrir: abrirDetalle,
      alMover: (m) => void mover(m),
    }),
    [abrirDetalle, columnas, mover],
  );

  return (
    <main aria-label="Tablero Kanban" aria-busy={columnas === null}>
      {/* ET03. «Nueva columna» es de HE-09-HU03 y el cambio de vista, de HE-09-HU07. */}
      <div className="wg-fila">
        <Boton principal onClick={tarjetas.abrirNueva}>
          Nueva tarjeta
        </Boton>
        <Boton>Nueva columna</Boton>
        <Boton>Vista expandida</Boton>
      </div>
      {columnas && (
        <ContextoDelTablero.Provider value={acciones}>
          {/* ET09: cuenta el punto donde se suelta (el puntero), no lo que tapa la tarjeta arrastrada. */}
          <DndContext sensors={sensores} collisionDetection={pointerWithin} onDragEnd={soltada}>
            <div className="wg-tablero">
              {columnas.map((c) => (
                <Columna key={c.column.id} columna={c} />
              ))}
            </div>
          </DndContext>
        </ContextoDelTablero.Provider>
      )}
      {tarjetas.ventanas}
    </main>
  );
}
