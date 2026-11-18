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
import type { BoardColumn, Card, CardMoveParams, Column, ScreenParams } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import textos from '@/types/messages.es.json';
import { FormularioColumna } from './FormularioColumna';
import { useNucleo, useParametrosDeNavegacion } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from '../tarjeta/fechas';
import { MoverA } from '../tarjeta/MoverA';
import { NOMBRE_DE_PRIORIDAD, NOMBRE_DE_TIPO } from '../tarjeta/nombres';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';
import { ENCABEZADO, type LugarDeSoltar, movimientoDelArrastre, ordenDelArrastre } from './arrastre';

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
function Columna({ columna, alEditar }: { columna: BoardColumn; alEditar: (columna: Column) => void }) {
  const { column, cards } = columna;
  const lugar: LugarDeSoltar = { columna: column.id };
  const soltar = useDroppable({ id: `columna:${column.id}`, data: lugar });
  // HE-09-HU05-ET01: el encabezado se arrastra para cambiar el orden de las columnas.
  const arrastre = useDraggable({ id: `${ENCABEZADO}${column.id}` });
  const { transform } = arrastre;
  return (
    <section
      ref={soltar.setNodeRef}
      className={`wg-columna${soltar.isOver ? ' wg-columna--destino' : ''}`}
      aria-label={column.name}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
    >
      <h2 ref={arrastre.setNodeRef} className="wg-fila wg-columna__encabezado" {...arrastre.listeners}>
        {/* El color acompaña al nombre: el significado no depende solo del color (interfaz.md). */}
        <span className="wg-muestra-color" style={{ background: column.color_hex }} aria-hidden="true" />
        <span>{column.name}</span>
        <span className="wg-columna__cantidad">{column.card_count}</span>
        {/* HE-09-HU04-ET01: cada columna tiene «Editar». */}
        <Boton onClick={() => alEditar(column)}>Editar</Boton>
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
  // Formulario de columna abierto: `null` para crear (HE-09-HU03) o la columna que se edita (HE-09-HU04).
  const [formularioColumna, setFormularioColumna] = useState<{ columna: Column | null } | null>(null);

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
  // HE-09-HU05: reordenar con el encabezado. Sin mensaje de resultado (DP-05); el tablero se vuelve a leer.
  const reordenar = useCallback(
    async (orden: string[]) => {
      await invocar('column_reorder', { column_ids: orden });
      await leer();
    },
    [invocar, leer],
  );
  const soltada = useCallback(
    ({ active, over }: DragEndEvent) => {
      const id = String(active.id);
      const lugar = over?.data.current as LugarDeSoltar | undefined;
      if (id.startsWith(ENCABEZADO)) {
        const orden = ordenDelArrastre(
          columnas?.map((c) => c.column.id) ?? [],
          id.slice(ENCABEZADO.length),
          lugar,
        );
        if (orden) void reordenar(orden);
        return;
      }
      const movimiento = movimientoDelArrastre(id, lugar);
      if (movimiento) void mover(movimiento);
    },
    [columnas, mover, reordenar],
  );
  const { abrirDetalle } = tarjetas;
  // HE-06-HU08-CA03: desde el widget Kanban, el Detalle de tarjeta de la tarjeta seleccionada.
  useParametrosDeNavegacion(
    'kanban',
    useCallback(
      ({ card_id }: ScreenParams) => {
        if (card_id) abrirDetalle(card_id);
      },
      [abrirDetalle],
    ),
  );
  const acciones = useMemo<AccionesDelTablero>(
    () => ({
      columnas: columnas?.map((c) => c.column) ?? [],
      alAbrir: abrirDetalle,
      alMover: (m) => void mover(m),
    }),
    [abrirDetalle, columnas, mover],
  );

  /** Columnas del tablero, contadas las tres por defecto (HE-09-HU03-ET07, D-167). */
  const enElMaximo = (columnas?.length ?? 0) >= 10;

  return (
    <main aria-label="Tablero Kanban" aria-busy={columnas === null}>
      {/* ET03. El cambio de vista es de HE-09-HU07. */}
      <div className="wg-fila">
        <Boton principal onClick={() => tarjetas.abrirNueva()}>
          Nueva tarjeta
        </Boton>
        {/* HE-09-HU03-ET01, ET08: con 10 columnas, deshabilitada con su texto (RT-04). */}
        <Boton
          disabled={enElMaximo}
          motivo={enElMaximo ? textos.MAXIMO_DE_COLUMNAS : undefined}
          onClick={() => setFormularioColumna({ columna: null })}
        >
          Nueva columna
        </Boton>
        <Boton>Vista expandida</Boton>
      </div>
      {columnas && (
        <ContextoDelTablero.Provider value={acciones}>
          {/* ET09: cuenta el punto donde se suelta (el puntero), no lo que tapa la tarjeta arrastrada. */}
          <DndContext sensors={sensores} collisionDetection={pointerWithin} onDragEnd={soltada}>
            <div className="wg-tablero">
              {columnas.map((c) => (
                <Columna
                  key={c.column.id}
                  columna={c}
                  alEditar={(columna) => setFormularioColumna({ columna })}
                />
              ))}
            </div>
          </DndContext>
        </ContextoDelTablero.Provider>
      )}
      {tarjetas.ventanas}
      {formularioColumna && (
        <FormularioColumna
          columna={formularioColumna.columna ?? undefined}
          alCancelar={() => setFormularioColumna(null)}
          alGuardar={(_, mensaje) => {
            // HE-09-HU03-CA01, HE-09-HU04-CA01: el tablero muestra la columna nueva o editada y el mensaje.
            setFormularioColumna(null);
            mostrarResultado(mensaje);
            void leer();
          }}
        />
      )}
    </main>
  );
}
