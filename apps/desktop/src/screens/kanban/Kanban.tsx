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
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BoardColumn,
  Card,
  CardMoveParams,
  Column,
  Label,
  PreferenceBoardCardView,
  ScreenParams,
} from '@/types';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { MenuDeAcciones } from '@/ui/MenuDeAcciones/MenuDeAcciones';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import textos from '@/types/messages.es.json';
import { FormularioColumna } from './FormularioColumna';
import { useNucleo, useParametrosDeNavegacion } from '@/ventana_principal/VentanaPrincipal';
import { IndicadorDeEstado, estadoDeTarjeta } from '../tarjeta/EstadoDeTarjeta';
import { fechaCorta, fechaIso, hoy } from '../tarjeta/fechas';
import { opcionesDeMoverA } from '../tarjeta/MoverA';
import { NOMBRE_DE_PRIORIDAD, NOMBRE_DE_TIPO } from '../tarjeta/nombres';
import './kanban.css';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';
import { ENCABEZADO, type LugarDeSoltar, movimientoDelArrastre, ordenDelArrastre } from './arrastre';

// P-KAN-01 Tablero Kanban (Menú principal > Planificador > Tablero Kanban; HE-09-HU01). Las columnas y las
// tarjetas vienen del Núcleo (IPC-CARD-05); la pantalla se vuelve a leer con cards_changed y columns_changed.

/** Acciones del tablero que usan las tarjetas y las columnas. */
interface AccionesDelTablero {
  columnas: readonly Column[];
  alAbrir: (id: string) => void;
  /** «Editar» y «Eliminar» del botón de acciones «⋮» de una tarjeta (HE-07-HU04-ET22). */
  alEditarTarjeta: (id: string) => void;
  alEliminarTarjeta: (id: string) => void;
  alMover: (movimiento: CardMoveParams) => void;
  /** HE-09-HU07: la vista de las tarjetas y las etiquetas para mostrar sus nombres en la vista expandida. */
  vista: PreferenceBoardCardView;
  etiquetas: readonly Label[];
  /** ¿Acaba de terminar un arrastre? Soltar una tarjeta no abre su detalle. */
  recienArrastrada: () => boolean;
  /** D-08: «+» del encabezado de Por hacer. */
  alNuevaTarjeta: () => void;
}

/** HE-09-HU07-ET04: los primeros 200 caracteres de la descripción. */
const DESCRIPCION_VISIBLE = 200;

/** Filas cortas o filas largas: el ícono de cada vista. */
function IconoDeVista({ expandida }: { expandida: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {expandida ? (
        <path
          d="M2.7 2.7H15.3V7.2H2.7V2.7ZM2.7 10.8H15.3V15.3H2.7V10.8Z"
          stroke="currentColor"
          strokeWidth="1.44"
        />
      ) : (
        <path
          d="M2.7 3.6H15.3M2.7 7.2H15.3M2.7 10.8H15.3M2.7 14.4H15.3"
          stroke="currentColor"
          strokeWidth="1.44"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

const ContextoDelTablero = createContext<AccionesDelTablero | null>(null);

function useTablero(): AccionesDelTablero {
  const tablero = useContext(ContextoDelTablero);
  if (!tablero) throw new Error('useTablero necesita el Tablero Kanban');
  return tablero;
}

/** D-11: hasta 3 barras de color, una por etiqueta. */
const BARRAS_MAX = 3;

/** «Hoy · 09:00», «Mañana · 09:00» o «27 nov · 09:00»: el bloque horario en la vista expandida (§6.2). */
function bloqueHorario(tarjeta: Card): string | null {
  if (!tarjeta.scheduled_date || tarjeta.scheduled_hour === null) return null;
  const hora = `${String(tarjeta.scheduled_hour).padStart(2, '0')}:00`;
  const dia = hoy();
  const manana = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);
  const fecha =
    tarjeta.scheduled_date === fechaIso(dia)
      ? 'Hoy'
      : tarjeta.scheduled_date === fechaIso(manana)
        ? 'Mañana'
        : fechaCorta(tarjeta.scheduled_date);
  return `${fecha} · ${hora}`;
}

/**
 * Una tarjeta del tablero (HE-09-HU01-ET05; docs/rediseno.md RD-74, que reemplaza RD-48; rediseno_final_prototipos.md
 * §6.2). Compacta: una barra de color por etiqueta (hasta 3, D-11; sin etiquetas, sin barra), el título en dos
 * líneas, la fecha corta con su estado (D-03) y la prioridad. Expandida (HE-09-HU07): además el tipo, las etiquetas
 * como chips de su color, la descripción en 3 líneas, el bloque horario y la marca de completada. Toda la tarjeta
 * abre el Detalle de tarjeta (HE-07-HU03, P37); el «⋮» y el arrastre no lo abren.
 */
function Tarjeta({ tarjeta }: { tarjeta: Card }) {
  const {
    columnas,
    alAbrir,
    alEditarTarjeta,
    alEliminarTarjeta,
    alMover,
    vista,
    etiquetas,
    recienArrastrada,
  } = useTablero();
  const expandida = vista === 'expanded';
  const suyas = tarjeta.label_ids.flatMap((id) => etiquetas.find((e) => e.id === id) ?? []);
  const arrastre = useDraggable({ id: tarjeta.id });
  const lugar: LugarDeSoltar = { columna: tarjeta.column_id, tarjeta: tarjeta.id };
  const soltar = useDroppable({ id: `tarjeta:${tarjeta.id}`, data: lugar });
  const { transform } = arrastre;
  const estado = estadoDeTarjeta(tarjeta);
  const bloque = expandida ? bloqueHorario(tarjeta) : null;
  return (
    <li
      ref={(nodo) => {
        arrastre.setNodeRef(nodo);
        soltar.setNodeRef(nodo);
      }}
      className={`wg-tarjeta wg-kanban__tarjeta${estado ? ` wg-kanban__tarjeta--${estado}` : ''}${
        arrastre.isDragging ? ' wg-tarjeta--arrastrada' : ''
      }${soltar.isOver && !arrastre.isDragging ? ' wg-tarjeta--destino' : ''}`}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      {...arrastre.listeners}
      onClick={(e) => {
        // El «⋮», su menú y el título (que ya abre) no cuentan; un arrastre que termina tampoco.
        if ((e.target as Element).closest('.wg-menu-acciones, button') || recienArrastrada()) return;
        alAbrir(tarjeta.id);
      }}
    >
      {suyas.length > 0 && (
        <span className="wg-kanban__barras" aria-hidden="true">
          {suyas.slice(0, BARRAS_MAX).map((e) => (
            <span key={e.id} className="wg-kanban__barra" style={{ background: e.color_hex }} />
          ))}
        </span>
      )}
      {/* HE-07-HU03-ET02: el título es el nombre accesible del botón que abre el Detalle de tarjeta. */}
      <button type="button" className="wg-tarjeta__titulo" onClick={() => alAbrir(tarjeta.id)}>
        {tarjeta.title}
      </button>
      <span className="wg-kanban__detalle">
        {/* HE-07-HU01-ET15: el nombre del tipo, también en la compacta. */}
        <span>{NOMBRE_DE_TIPO[tarjeta.type]}</span>
        {/* HE-09-HU01-ET05 y RD-49: la fecha corta («27 nov») con su estado (RD-73). */}
        <span className={estado ? `wg-kanban__fecha wg-kanban__fecha--${estado}` : 'wg-kanban__fecha'}>
          {fechaCorta(tarjeta.due_date)}
        </span>
        {tarjeta.priority && <span className="wg-chip">{NOMBRE_DE_PRIORIDAD[tarjeta.priority]}</span>}
        {tarjeta.is_completed && expandida && (
          <span className="wg-estado wg-estado--completada">
            <span aria-hidden="true">✓</span>
            Completada
          </span>
        )}
      </span>
      {/* HE-09-HU01-ET06, ET07 y RD-73: «Vencida» en rojo o la próxima a vencer en amarillo. */}
      <IndicadorDeEstado tarjeta={tarjeta} />
      {expandida && suyas.length > 0 && (
        <ul className="wg-fila wg-tarjeta__etiquetas" aria-label="Etiquetas">
          {suyas.map((e) => (
            <li key={e.id} className="wg-chip wg-chip--etiqueta">
              <span className="wg-muestra-color" style={{ background: e.color_hex }} aria-hidden="true" />
              {e.name}
            </li>
          ))}
        </ul>
      )}
      {/* HE-09-HU07-ET04: en la vista expandida, la descripción (200 caracteres; en 3 líneas, §6.2). */}
      {expandida && tarjeta.description && (
        <p className="wg-tarjeta__descripcion">
          {[...tarjeta.description].slice(0, DESCRIPCION_VISIBLE).join('')}
        </p>
      )}
      {bloque && <span className="wg-kanban__bloque">{bloque}</span>}
      {/* HE-07-HU04-ET22 (RT-02-ET10): Editar, Mover a y Eliminar en el «⋮» de la tarjeta. «Mover a» es la
          alternativa sin drag-and-drop (HE-09-HU02-ET10). */}
      <MenuDeAcciones
        nombre={tarjeta.title}
        opciones={[
          { etiqueta: 'Editar', alElegir: () => alEditarTarjeta(tarjeta.id) },
          {
            etiqueta: 'Mover a',
            submenu: opcionesDeMoverA(columnas, tarjeta.column_id, (columna) =>
              alMover({ card_id: tarjeta.id, column_id: columna, placement: { kind: 'end' } }),
            ),
          },
          // HE-07-HU03-CA05: el detalle también se abre desde el menú.
          { etiqueta: 'Vista detallada', alElegir: () => alAbrir(tarjeta.id) },
          { etiqueta: 'Eliminar', alElegir: () => alEliminarTarjeta(tarjeta.id) },
        ]}
      />
    </li>
  );
}
/** Una columna con su nombre, su color y su cantidad de tarjetas (HE-09-HU01-ET01); se suelta al final. */
function Columna({
  columna,
  alEditar,
  alEliminar,
}: {
  columna: BoardColumn;
  alEditar: (columna: Column) => void;
  alEliminar: (columna: Column) => void;
}) {
  const { column, cards } = columna;
  const { alNuevaTarjeta } = useTablero();
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
        {/* D-08 (RD-74): «+» solo en el encabezado de Por hacer; la tarjeta nace allí (HE-07-HU01). */}
        {column.role === 'todo' && (
          <button
            type="button"
            className="wg-icono-boton wg-columna__nueva"
            aria-label="Nueva tarjeta"
            title="Nueva tarjeta"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={alNuevaTarjeta}
          >
            +
          </button>
        )}
        {/* HE-09-HU04-ET01, HE-09-HU06-ET01 (RT-02-ET10): «Editar» y «Eliminar» en el botón de acciones «⋮» de
            cada columna. En las por defecto, «Eliminar» está deshabilitada y su motivo aparece al pasar el mouse
            (HE-09-HU06-ET02, RT-04-ET11). */}
        <MenuDeAcciones
          nombre={column.name}
          opciones={[
            { etiqueta: 'Editar', alElegir: () => alEditar(column) },
            {
              etiqueta: 'Eliminar',
              deshabilitada: column.is_default,
              motivo: textos.COLUMNA_POR_DEFECTO_NO_ELIMINABLE,
              alElegir: () => alEliminar(column),
            },
          ]}
        />
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
  // HE-09-HU06: la columna que se va a eliminar con el texto de su confirmación (M-09 o M-13).
  const [porEliminar, setPorEliminar] = useState<{ columna: Column; texto: string } | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('card_list_board', {});
    if (r.ok) setColumnas(r.value.columns);
  }, [invocar]);

  // HE-09-HU07: la vista guardada (compacta por defecto, ET02) y las etiquetas para la vista expandida.
  const [vista, setVista] = useState<PreferenceBoardCardView>('compact');
  const [etiquetas, setEtiquetas] = useState<Label[]>([]);
  useEffect(() => {
    let vigente = true;
    void invocar('preference_get', {}).then((r) => {
      if (vigente && r.ok) setVista(r.value.board_card_view);
    });
    const leerEtiquetas = () =>
      void invocar('label_list', {}).then((r) => {
        if (vigente && r.ok) setEtiquetas(r.value);
      });
    leerEtiquetas();
    const dejarEtiquetas = escuchar('labels_changed', leerEtiquetas);
    const dejarVista = escuchar('preference_changed', (c) => setVista(c.board_card_view));
    return () => {
      vigente = false;
      dejarEtiquetas();
      dejarVista();
    };
  }, [escuchar, invocar]);

  // HE-09-HU07-CA01 a CA03: cambia de vista y la guarda.
  const cambiarVista = async (nueva: PreferenceBoardCardView) => {
    if (nueva === vista) return;
    setVista(nueva);
    await invocar('preference_set', { board_card_view: nueva });
  };

  // Un arrastre que termina dispara un clic sobre la tarjeta: durante ese instante no se abre el detalle.
  const arrastrando = useRef(false);
  const recienArrastrada = useCallback(() => arrastrando.current, []);

  // HE-09-HU06-CA01, CA03, CA07: M-09 sin tarjetas o M-13 con la cantidad y el nombre actual de Por hacer.
  const preguntarEliminar = async (columna: Column) => {
    const r = await invocar('column_get_delete_info', { id: columna.id });
    if (!r.ok) return;
    const { name, card_count, destination_name } = r.value;
    const texto =
      card_count === 0
        ? textos.CONFIRMAR_ELIMINAR_COLUMNA.replace('<nombre de la columna>', name)
        : textos.CONFIRMAR_ELIMINAR_COLUMNA_CON_TARJETAS.replace('<nombre de la columna>', name)
            .replace('<cantidad>', String(card_count))
            .replace('<nombre de la columna destino>', destination_name);
    setPorEliminar({ columna, texto });
  };

  // HE-09-HU06-CA02, CA04: las tarjetas pasan al final de Por hacer y la columna se quita.
  const eliminarColumna = async (columna: Column) => {
    setPorEliminar(null);
    const r = await invocar('column_delete', { id: columna.id });
    mostrarResultado(r.ok ? (r.result_message?.message ?? textos.COLUMNA_ELIMINADA) : r.error.message);
    void leer();
  };

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
  const { abrirDetalle, abrirEdicion, abrirEliminacion } = tarjetas;
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
  const { abrirNueva } = tarjetas;
  const acciones = useMemo<AccionesDelTablero>(
    () => ({
      columnas: columnas?.map((c) => c.column) ?? [],
      alAbrir: abrirDetalle,
      alEditarTarjeta: abrirEdicion,
      alEliminarTarjeta: abrirEliminacion,
      alMover: (m) => void mover(m),
      vista,
      etiquetas,
      recienArrastrada,
      alNuevaTarjeta: () => abrirNueva(),
    }),
    [
      abrirDetalle,
      abrirEdicion,
      abrirEliminacion,
      abrirNueva,
      columnas,
      etiquetas,
      mover,
      recienArrastrada,
      vista,
    ],
  );

  /** Columnas del tablero, contadas las tres por defecto (HE-09-HU03-ET07, D-167). */
  const enElMaximo = (columnas?.length ?? 0) >= 10;

  return (
    <main className="wg-kanban" aria-label="Tablero Kanban" aria-busy={columnas === null}>
      {/* HE-09-HU07-ET01 y RD-74 (§3.6): el cambio de vista es un interruptor de dos íconos, con la vista actual
          resaltada (`aria-pressed`). «Nueva tarjeta» va en Por hacer y «Nueva columna» es la columna fantasma. */}
      <div className="wg-fila wg-kanban__barra-superior">
        <div className="wg-segmentado" role="group" aria-label="Vista de las tarjetas">
          <button
            type="button"
            className="wg-segmentado__opcion"
            aria-label="Vista compacta"
            title="Vista compacta"
            aria-pressed={vista === 'compact'}
            onClick={() => void cambiarVista('compact')}
          >
            <IconoDeVista expandida={false} />
          </button>
          <button
            type="button"
            className="wg-segmentado__opcion"
            aria-label="Vista expandida"
            title="Vista expandida"
            aria-pressed={vista === 'expanded'}
            onClick={() => void cambiarVista('expanded')}
          >
            <IconoDeVista expandida />
          </button>
        </div>
      </div>
      {columnas && (
        <ContextoDelTablero.Provider value={acciones}>
          {/* ET09: cuenta el punto donde se suelta (el puntero), no lo que tapa la tarjeta arrastrada. */}
          <DndContext
            sensors={sensores}
            collisionDetection={pointerWithin}
            onDragStart={() => {
              arrastrando.current = true;
            }}
            onDragEnd={(evento) => {
              soltada(evento);
              setTimeout(() => {
                arrastrando.current = false;
              }, 0);
            }}
            onDragCancel={() => {
              arrastrando.current = false;
            }}
          >
            {/* D-10: las columnas se estrechan hasta su ancho mínimo; recién ahí el tablero hace scroll horizontal. */}
            <div className="wg-tablero">
              {columnas.map((c) => (
                <Columna
                  key={c.column.id}
                  columna={c}
                  alEditar={(columna) => setFormularioColumna({ columna })}
                  alEliminar={(columna) => void preguntarEliminar(columna)}
                />
              ))}
              {/* D-09 (RD-74): «+» gris tras la última columna. HE-09-HU03-ET01, ET08: con 10 columnas,
                  deshabilitada con su motivo (RT-04). */}
              <button
                type="button"
                className="wg-columna-fantasma"
                aria-label="Nueva columna"
                title={enElMaximo ? textos.MAXIMO_DE_COLUMNAS : 'Nueva columna'}
                disabled={enElMaximo}
                aria-describedby={enElMaximo ? 'wg-motivo-nueva-columna' : undefined}
                onClick={() => setFormularioColumna({ columna: null })}
              >
                +
              </button>
              {enElMaximo && (
                <span id="wg-motivo-nueva-columna" className="wg-oculto">
                  {textos.MAXIMO_DE_COLUMNAS}
                </span>
              )}
            </div>
          </DndContext>
        </ContextoDelTablero.Provider>
      )}
      {tarjetas.ventanas}
      {porEliminar && (
        // M-09 o M-13. DUDA: HE-09-HU06 las ventanas no definen título. Valor usado: «Eliminar».
        <Confirmacion
          titulo="Eliminar"
          destructiva
          texto={porEliminar.texto}
          opcionPrincipal="Confirmar"
          alConfirmar={() => void eliminarColumna(porEliminar.columna)}
          alCancelar={() => setPorEliminar(null)}
        />
      )}
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
