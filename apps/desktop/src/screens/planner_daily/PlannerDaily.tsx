import { useCallback, useEffect, useState } from 'react';
import type { PlannerItem, PlannerToday } from '@/types';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
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

/** Una tarjeta de la lista: casilla de completada, título, hora si la tiene y prioridad (ET04). */
interface ElementoProps {
  item: PlannerItem;
  alAbrir: (id: string) => void;
  alCompletar: (id: string, completada: boolean) => void;
}

function Elemento({ item, alAbrir, alCompletar }: ElementoProps) {
  const { card, hour } = item;
  return (
    // ET07 y HE-12-HU02-ET05: una tarjeta en Hecho va tachada y con la casilla marcada.
    <li className={`wg-tarjeta wg-fila${card.is_completed ? ' wg-tachada' : ''}`}>
      {/* HE-12-HU02-ET01: la casilla de completada de cada tarjeta. */}
      <input
        type="checkbox"
        checked={card.is_completed}
        aria-label={card.title}
        onChange={(e) => alCompletar(card.id, e.target.checked)}
      />
      <button type="button" className="wg-tarjeta__titulo" onClick={() => alAbrir(card.id)}>
        {card.title}
      </button>
      {hour !== null && <span>{horaVisible(hour)}</span>}
      {card.priority && <span>{NOMBRE_DE_PRIORIDAD[card.priority]}</span>}
    </li>
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
          {dia.items.length === 0 ? (
            // ET06
            <EstadoVacio texto="No tienes tarjetas para hoy." />
          ) : (
            <>
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
