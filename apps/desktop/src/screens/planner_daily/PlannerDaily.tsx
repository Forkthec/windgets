import { useCallback, useEffect, useState } from 'react';
import type { PlannerItem, PlannerSummary, PlannerToday, ScreenParams } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo, useParametrosDeNavegacion } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from '../tarjeta/fechas';
import { NOMBRE_DE_PRIORIDAD } from '../tarjeta/nombres';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';

// P-PLA-01 Planificador diario, la pantalla principal (Menú principal > Planificador > Planificador diario;
// HE-12-HU01). Las tarjetas vienen del Núcleo (IPC-CARD-08), que lee solo la base local: sin conexión muestra
// lo guardado (ET09). La casilla de completada actúa con HE-12-HU02 y el resumen de avance es de HE-12-HU03.
// El indicador «Sin conexión» de CA05 es de HE-15-HU02.

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
  alAbrir: (id: string) => void;
  alCompletar: (id: string, completada: boolean) => void;
}

function Elemento({ item, alAbrir, alCompletar }: ElementoProps) {
  const { card, hour } = item;
  return (
    // ET07 y HE-12-HU02-ET05: una tarjeta en Hecho va tachada y con la casilla marcada.
    // HE-12-HU02-ET01 (P26): un clic en el borde vacío de la tarjeta, fuera de la casilla y de la «i», también la
    // alterna. La casilla sigue siendo el control del teclado.
    <li
      className={`wg-tarjeta wg-fila${card.is_completed ? ' wg-tachada' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) alCompletar(card.id, !card.is_completed);
      }}
    >
      <label className="wg-fila wg-planificador__casilla">
        {/* HE-12-HU02-ET01; ET10: la casilla conserva como nombre accesible el título de la tarjeta. */}
        <input
          type="checkbox"
          checked={card.is_completed}
          aria-label={card.title}
          onChange={(e) => alCompletar(card.id, e.target.checked)}
        />
        <span className="wg-tarjeta__titulo">{card.title}</span>
        {hour !== null && <span>{horaVisible(hour)}</span>}
        {card.priority && <span>{NOMBRE_DE_PRIORIDAD[card.priority]}</span>}
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
 * todas completadas agrega «¡Completaste todas tus tarjetas de hoy!» (ET05).
 */
function Resumen({ summary }: { summary: PlannerSummary }) {
  const { total, completed, remaining, percent } = summary;
  return (
    <section aria-label="Resumen de avance" className="wg-fila">
      <span>{`Completadas: ${completed} de ${total}`}</span>
      {remaining > 0 && <span>{`Te quedan ${remaining}`}</span>}
      <span>{`${percent} %`}</span>
      {/* DUDA: HE-12-HU03 es de tipo resultado, pero CA04 pide verlo al consultar: va en el resumen. */}
      {remaining === 0 && <span>¡Completaste todas tus tarjetas de hoy!</span>}
    </section>
  );
}

export function PlannerDaily() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [dia, setDia] = useState<PlannerToday | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('planner_get_today', {});
    if (r.ok) setDia(r.value);
  }, [invocar]);

  useEffect(() => {
    void leer();
    return escuchar('cards_changed', () => void leer());
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
  const completar = useCallback(
    async (id: string, completada: boolean) => {
      const r = await invocar('card_set_completed', { card_id: id, completed: completada });
      if (r.ok && r.result_message) mostrarResultado(r.result_message.message);
      if (!r.ok && r.error.code === 'card.not_found') mostrarResultado(r.error.message);
      await leer();
    },
    [invocar, leer, mostrarResultado],
  );

  return (
    <main aria-label="Planificador diario" aria-busy={dia === null}>
      {dia && (
        <>
          {/* ET01: la fecha de hoy y la lista de tarjetas. */}
          <h2 className="wg-agenda__fecha">{fechaVisible(dia.date)}</h2>
          {/* ET11, ET12 (D-214): «Nueva tarjeta» abre el Formulario de tarjeta con la fecha límite de hoy, que el
              usuario puede cambiar; se crea con las reglas de HE-07-HU01 y muestra «Tarjeta creada.». También
              acompaña al estado vacío (ET06; HE-12-HU03-ET06). */}
          <div className="wg-fila">
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
                    item={item}
                    alAbrir={tarjetas.abrirDetalle}
                    alCompletar={(id, completada) => void completar(id, completada)}
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
