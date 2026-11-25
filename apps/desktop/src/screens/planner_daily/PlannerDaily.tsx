import { useCallback, useEffect, useRef, useState } from 'react';
import type { Label, PlannerItem, PlannerSummary, PlannerToday, ScreenParams } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado, useMostrarError } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo, useParametrosDeNavegacion } from '@/ventana_principal/VentanaPrincipal';
import { fechaLarga } from '../tarjeta/fechas';
import { NOMBRE_DE_PRIORIDAD, NOMBRE_DE_TIPO } from '../tarjeta/nombres';
import './planificador.css';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';

// P-PLA-01 Planificador diario, la pantalla principal (Menú principal > Planificador > Planificador diario;
// HE-12-HU01). Las tarjetas vienen del Núcleo (IPC-CARD-08), que lee solo la base local: sin conexión muestra
// lo guardado (ET09). La casilla de completada actúa con HE-12-HU02 y el resumen de avance es de HE-12-HU03.
// El indicador «Sin conexión» de CA05 es de HE-15-HU02.

/**
 * rediseno_final_backend.md §3.1 (P32): una casilla que se cambia varias veces seguidas envía solo el último valor,
 * 300 ms después del último clic. Mientras tanto la fila muestra el valor elegido.
 */
export const ESPERA_DE_CASILLAS_MS = 300;

/** «08:00»: la hora de inicio del bloque horario (ET05). */
function horaVisible(hora: number): string {
  return `${String(hora).padStart(2, '0')}:00`;
}

/**
 * Una tarjeta de la lista: casilla de completada, título, hora si la tiene, prioridad y el botón de información
 * «i» (ET04). Toda la tarjeta, salvo la «i», es la etiqueta de la casilla: seleccionar cualquier parte la alterna
 * (HE-12-HU02-ET01). La «i» abre el Detalle de tarjeta (ET10).
 */
interface ElementoProps {
  item: PlannerItem;
  /** Los nombres de las etiquetas del usuario, por id (RD-39). */
  etiquetas: ReadonlyMap<string, string>;
  alAbrir: (id: string) => void;
  alCompletar: (id: string, completada: boolean) => void;
}

/**
 * docs/rediseno.md RD-39 (Figma 81:32, 81:33): debajo del título, el tipo y los nombres de las etiquetas
 * («Tarea · Proyecto»).
 */
export function detalleDeLaFila(item: PlannerItem, etiquetas: ReadonlyMap<string, string>): string {
  const nombres = item.card.label_ids.flatMap((id) => etiquetas.get(id) ?? []);
  return [NOMBRE_DE_TIPO[item.card.type], ...nombres].join(' · ');
}

// Figma 81:28 a 81:34 «Planificador diario · Claro»: casilla, hora, título con su detalle y prioridad; RD-39 conserva
// la «i» al final.
function Elemento({ item, etiquetas, alAbrir, alCompletar }: ElementoProps) {
  const { card, hour } = item;
  return (
    // ET07 y HE-12-HU02-ET05: una tarjeta en Hecho va tachada y con la casilla marcada.
    // HE-12-HU02-ET01 (P26): un clic en el borde vacío de la tarjeta, fuera de la casilla y de la «i», también la
    // alterna. La casilla sigue siendo el control del teclado.
    <li
      className={`wg-tarjeta wg-fila wg-planificador__fila${card.is_completed ? ' wg-tachada' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCompletar(card.id, !card.is_completed);
      }}
    >
      <label className="wg-fila wg-planificador__casilla">
        {/* HE-12-HU02-ET01; ET10: la casilla conserva como nombre accesible el título de la tarjeta. */}
        <input
          type="checkbox"
          className="wg-planificador__marca"
          checked={card.is_completed}
          aria-label={card.title}
          onChange={(e) => alCompletar(card.id, e.target.checked)}
        />
        <span className="wg-planificador__hora">{hour !== null ? horaVisible(hour) : 'Sin hora'}</span>
        <span className="wg-planificador__texto">
          <span className="wg-tarjeta__titulo">{card.title}</span>
          <span className="wg-planificador__detalle">{detalleDeLaFila(item, etiquetas)}</span>
        </span>
        <span className="wg-planificador__prioridad">
          {card.priority ? NOMBRE_DE_PRIORIDAD[card.priority] : ''}
        </span>
      </label>
      <button
        type="button"
        className="wg-boton wg-boton-informacion"
        aria-label={`Ver detalle de ${card.title}`}
        onClick={() => alAbrir(card.id)}
      >
        i
      </button>
    </li>
  );
}

/**
 * HE-12-HU03: «Completadas: <c> de <t>», «Te quedan <n>» (no con 0, ET07; D-169) y «<p> %» (ET01 a ET03). Con
 * todas completadas agrega «¡Completaste todas tus tarjetas de hoy!» (ET05). docs/rediseno.md RD-38 (Figma 81:25 a
 * 81:27): se ven «Completadas» y una barra; «Te quedan» y el porcentaje quedan para los lectores de pantalla.
 */
function Resumen({ summary }: { summary: PlannerSummary }) {
  const { total, completed, remaining, percent } = summary;
  return (
    <section aria-label="Resumen de avance" className="wg-planificador__resumen">
      <span className="wg-planificador__completadas">{`Completadas: ${completed} de ${total}`}</span>
      {remaining > 0 && <span className="wg-oculto">{`Te quedan ${remaining}`}</span>}
      <div
        className="wg-planificador__barra"
        role="progressbar"
        aria-label="Avance del día"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent} %`}
      >
        <div className="wg-planificador__avance" style={{ width: `${percent}%` }} />
      </div>
      {/* DUDA: HE-12-HU03 es de tipo resultado, pero CA04 pide verlo al consultar: va en el resumen. */}
      {remaining === 0 && <span>¡Completaste todas tus tarjetas de hoy!</span>}
    </section>
  );
}

export function PlannerDaily() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const mostrarError = useMostrarError();
  const [dia, setDia] = useState<PlannerToday | null>(null);
  // RD-39: los nombres de las etiquetas para el detalle de cada fila.
  const [etiquetas, setEtiquetas] = useState<ReadonlyMap<string, string>>(new Map());
  // §3.1: el valor elegido de cada casilla mientras espera su envío, y sus temporizadores.
  const [elegidas, setElegidas] = useState<ReadonlyMap<string, boolean>>(new Map());
  const temporizadores = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const diaActual = useRef<PlannerToday | null>(null);
  diaActual.current = dia;

  const leer = useCallback(async () => {
    const [r, e] = await Promise.all([invocar('planner_get_today', {}), invocar('label_list', {})]);
    if (e.ok) setEtiquetas(new Map(e.value.map((l: Label) => [l.id, l.name])));
    if (r.ok) setDia(r.value);
  }, [invocar]);

  useEffect(() => {
    void leer();
    // §3.1: con una casilla esperando su envío no se vuelve a leer por el evento: la lectura llega tras enviarla.
    const dejarTarjetas = escuchar('cards_changed', () => {
      if (temporizadores.current.size === 0) void leer();
    });
    const dejarEtiquetas = escuchar('labels_changed', () => void leer());
    return () => {
      dejarTarjetas();
      dejarEtiquetas();
    };
  }, [escuchar, leer]);

  const tarjetas = useVentanasDeTarjeta(useCallback(() => void leer(), [leer]));
  // HE-06-HU08-CA01: desde el widget Tareas del día, el Detalle de tarjeta de la tarjeta seleccionada.
  const { abrirDetalle } = tarjetas;
  useParametrosDeNavegacion(
    'planner_daily',
    useCallback(
      ({ card_id }: ScreenParams) => {
        if (card_id) abrirDetalle(card_id);
      },
      [abrirDetalle],
    ),
  );

  // HE-12-HU02: marcar mueve a Hecho y muestra «¡Bien hecho! Tarjeta completada.» (ET07); desmarcar la
  // devuelve a su columna anterior o a Por hacer (IPC-CARD-07). El resumen se actualiza al volver a leer
  // (HE-12-HU03-ET04).
  const enviar = useCallback(
    async (id: string, completada: boolean) => {
      temporizadores.current.delete(id);
      const actual = diaActual.current?.items.find((i) => i.card.id === id)?.card.is_completed;
      // §3.1: si volvió al valor que ya tenía (A → B → A), no hay nada que enviar.
      if (actual !== completada) {
        const r = await invocar('card_set_completed', { card_id: id, completed: completada });
        if (r.ok && r.result_message) mostrarResultado(r.result_message.message);
        if (!r.ok) mostrarError(r.error);
      }
      await leer();
      if (!temporizadores.current.has(id))
        setElegidas((antes) => {
          const nuevas = new Map(antes);
          nuevas.delete(id);
          return nuevas;
        });
    },
    [invocar, leer, mostrarError, mostrarResultado],
  );
  const completar = useCallback(
    (id: string, completada: boolean) => {
      setElegidas((antes) => new Map(antes).set(id, completada));
      clearTimeout(temporizadores.current.get(id));
      temporizadores.current.set(
        id,
        setTimeout(() => void enviar(id, completada), ESPERA_DE_CASILLAS_MS),
      );
    },
    [enviar],
  );
  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <main aria-label="Planificador diario" aria-busy={dia === null}>
      {dia && (
        <>
          {/* ET01: la fecha de hoy y la lista de tarjetas. RD-40: la fecha larga del Figma (81:22).
              ET11, ET12 (D-214): «Nueva tarjeta» abre el Formulario de tarjeta con la fecha límite de hoy, que el
              usuario puede cambiar; se crea con las reglas de HE-07-HU01 y muestra «Tarjeta creada.». También
              acompaña al estado vacío (ET06; HE-12-HU03-ET06). Va a la derecha de la fecha (81:23). */}
          <div className="wg-fila wg-planificador__cabecera">
            <h2 className="wg-planificador__fecha">{fechaLarga(dia.date)}</h2>
            <Boton principal onClick={() => tarjetas.abrirNueva(dia.date)}>
              Nueva tarjeta
            </Boton>
          </div>
          {dia.items.length === 0 ? (
            // ET06
            <EstadoVacio texto="No tienes tarjetas para hoy." />
          ) : (
            <>
              {/* HE-12-HU03-ET06: sin tarjetas no hay resumen. */}
              <Resumen summary={dia.summary} />
              {/* ET02, ET03: por hora y después las sin hora, como las ordena el Núcleo. */}
              <ul className="wg-columna__tarjetas wg-planificador" aria-label="Tarjetas de hoy">
                {dia.items.map((item) => (
                  <Elemento
                    key={item.card.id}
                    item={
                      elegidas.has(item.card.id)
                        ? {
                            ...item,
                            card: { ...item.card, is_completed: elegidas.get(item.card.id) === true },
                          }
                        : item
                    }
                    etiquetas={etiquetas}
                    alAbrir={tarjetas.abrirDetalle}
                    alCompletar={completar}
                  />
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {tarjetas.ventanas}
    </main>
  );
}
