import { useCallback, useEffect, useRef, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Column, Invoke, PlannerItem, PlannerToday } from '@/types';
import { MoverA } from '@/screens/tarjeta/MoverA';
import { NOMBRE_DE_PRIORIDAD } from '@/screens/tarjeta/nombres';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { abrirPantalla, esUnControl } from './abrirPantalla';

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
  invocar: Invoke;
  /** Vuelve a leer el día tras una acción, además de EV-07 (RNF-01). */
  alCambiar: () => void;
}

/** Una tarjeta del widget: casilla, título, hora, prioridad y «⋮» con «Mover a». */
function Elemento({ item, invocar, alCambiar }: ElementoProps) {
  const { card, hour } = item;
  const [opciones, setOpciones] = useState(false);
  const [columnas, setColumnas] = useState<Column[]>([]);
  const caja = useRef<HTMLDivElement>(null);

  // HE-06-HU04-ET05: seleccionar un área del widget fuera del menú lo cierra sin mover la tarjeta.
  // DUDA: HE-06-HU04 una selección fuera del widget no llega a la capa (D-186); solo cierra la de dentro.
  useEffect(() => {
    if (!opciones) return;
    const alSeleccionar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setOpciones(false);
    };
    document.addEventListener('click', alSeleccionar);
    return () => document.removeEventListener('click', alSeleccionar);
  }, [opciones]);

  const abrir = async () => {
    if (opciones) {
      setOpciones(false);
      return;
    }
    // HE-06-HU04-ET02: todas las columnas del tablero en su orden (IPC-COL-01).
    const r = await invocar('column_list', {});
    if (!r.ok) return;
    setColumnas(r.value);
    setOpciones(true);
  };

  return (
    // HE-06-HU02-ET03, HE-06-HU03-ET04: una tarjeta completada va tachada y con la casilla marcada.
    <li
      className={`wg-tarjeta wg-fila${card.is_completed ? ' wg-tachada' : ''}`}
      // HE-06-HU08-CA01, ET01: la tarjeta, fuera de la casilla y de «⋮», abre su detalle en el Planificador diario.
      data-tarjeta={card.id}
      onClick={(e) => {
        if (!esUnControl(e.target)) abrirPantalla(invocar, 'planner_daily', { card_id: card.id });
      }}
    >
      {/* HE-06-HU03-ET06: la casilla tiene un área de selección de al menos 32 × 32 píxeles; seleccionar cualquier
          punto de esa área la alterna y no abre la aplicación (CA05). */}
      <label className="wg-widget__casilla">
        <input
          type="checkbox"
          checked={card.is_completed}
          aria-label={card.title}
          // HE-06-HU03: marcar mueve a Hecho; desmarcar la devuelve (IPC-CARD-07). En el widget no hay mensaje.
          onChange={(e) => {
            const completed = e.target.checked;
            void invocar('card_set_completed', { card_id: card.id, completed }).then(alCambiar);
          }}
        />
      </label>
      <span className="wg-tarjeta__titulo">{card.title}</span>
      {hour !== null && <span>{horaVisible(hour)}</span>}
      {card.priority && <span>{NOMBRE_DE_PRIORIDAD[card.priority]}</span>}
      <div ref={caja} className="wg-fila">
        {/* HE-06-HU04-ET01: «⋮» abre «Mover a». DUDA: HE-06-HU04 «⋮» muestra el botón «Mover a». */}
        <button type="button" className="wg-boton" aria-expanded={opciones} onClick={() => void abrir()}>
          ⋮
        </button>
        {opciones && (
          <MoverA
            enLugar
            columnas={columnas}
            actual={card.column_id}
            alElegir={(columna) => {
              setOpciones(false);
              // HE-06-HU04-CA01, CA03: al final de la columna elegida (IPC-CARD-06).
              void invocar('card_move', {
                card_id: card.id,
                column_id: columna,
                placement: { kind: 'end' },
              }).then(alCambiar);
            }}
          />
        )}
      </div>
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
    <div
      style={{ width: '100%', height: '100%', overflow: 'auto' }}
      // HE-06-HU08-CA02, ET02, ET03: los espacios sin tarjetas abren el Planificador diario.
      onClick={(e) => {
        if (e.target instanceof Element && !e.target.closest('[data-tarjeta]'))
          abrirPantalla(invocar, 'planner_daily');
      }}
    >
      {dia.items.length === 0 ? (
        // HE-06-HU02-CA05: estado vacío (RT-04).
        <EstadoVacio texto="No tienes tarjetas para hoy." />
      ) : (
        <ul className="wg-columna__tarjetas wg-planificador" aria-label="Tarjetas de hoy">
          {dia.items.map((item) => (
            <Elemento key={item.card.id} item={item} invocar={invocar} alCambiar={() => void leer()} />
          ))}
        </ul>
      )}
    </div>
  );
}
