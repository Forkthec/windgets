import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgendaDay, Card } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaIso, fechaVisible, hoy } from '../tarjeta/fechas';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';

// P-AGE-01 Agenda diaria (Menú principal > Planificador > Agenda diaria; HE-11-HU01). Los bloques y las tarjetas
// vienen del Núcleo (IPC-CARD-09), que lee solo la base local: sin conexión muestra lo guardado (ET08). El
// indicador «Sin conexión» de CA06 es de HE-15-HU02.

/** «10:00 – 11:00» (contratos.md, `CardDetail.time_block.label`). */
export function textoDelBloque(hora: number): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(hora)}:00 – ${dos((hora + 1) % 24)}:00`;
}

/** El día anterior o siguiente a `iso` (AAAA-MM-DD). */
function otroDia(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return fechaIso(new Date(anio ?? 0, (mes ?? 1) - 1, (dia ?? 1) + dias));
}

/** El título de una tarjeta abre el Detalle de tarjeta (HE-07-HU03, T-090). */
function TituloDeTarjeta({ tarjeta, alAbrir }: { tarjeta: Card; alAbrir: (id: string) => void }) {
  return (
    <li className="wg-tarjeta">
      <button type="button" className="wg-tarjeta__titulo" onClick={() => alAbrir(tarjeta.id)}>
        {tarjeta.title}
      </button>
    </li>
  );
}

export function Agenda() {
  const { invocar, escuchar } = useNucleo();
  const [dia, setDia] = useState(() => fechaIso(hoy()));
  const [agenda, setAgenda] = useState<AgendaDay | null>(null);
  // ET01, ET07: al abrir y con «Hoy», la vista se ubica en el bloque de la hora actual.
  const [ubicar, setUbicar] = useState(true);
  const bloques = useRef<Array<HTMLElement | null>>([]);

  const leer = useCallback(async () => {
    const r = await invocar('agenda_get_day', { date: dia });
    if (r.ok) setAgenda(r.value);
  }, [dia, invocar]);

  useEffect(() => {
    void leer();
    return escuchar('cards_changed', () => void leer());
  }, [escuchar, leer]);

  useEffect(() => {
    if (!ubicar || !agenda || agenda.date !== dia) return;
    if (agenda.current_hour !== null)
      bloques.current[agenda.current_hour]?.scrollIntoView?.({ block: 'start' });
    setUbicar(false);
  }, [agenda, dia, ubicar]);

  const tarjetas = useVentanasDeTarjeta(useCallback(() => void leer(), [leer]));

  return (
    <main aria-label="Agenda diaria" aria-busy={agenda === null}>
      {/* ET02: la fecha del día consultado y la navegación entre días (ET06, ET07). */}
      <div className="wg-fila">
        <Boton onClick={() => setDia((d) => otroDia(d, -1))}>Día anterior</Boton>
        <Boton
          onClick={() => {
            setDia(fechaIso(hoy()));
            setUbicar(true);
          }}
        >
          Hoy
        </Boton>
        <Boton onClick={() => setDia((d) => otroDia(d, 1))}>Día siguiente</Boton>
        <h2 className="wg-agenda__fecha">{fechaVisible(dia)}</h2>
      </div>
      {agenda && (
        <div className="wg-agenda">
          {/* ET01, ET03: 24 bloques de una hora con sus tarjetas. */}
          <ol className="wg-agenda__bloques" aria-label="Bloques horarios">
            {agenda.blocks.map((bloque) => (
              <li
                key={bloque.hour}
                ref={(nodo) => {
                  bloques.current[bloque.hour] = nodo;
                }}
                className={`wg-agenda__bloque${bloque.hour === agenda.current_hour ? ' wg-agenda__bloque--actual' : ''}`}
              >
                <section aria-label={textoDelBloque(bloque.hour)}>
                  <h3 className="wg-agenda__hora">{textoDelBloque(bloque.hour)}</h3>
                  {bloque.cards.length > 0 && (
                    <ul className="wg-columna__tarjetas">
                      {bloque.cards.map((t) => (
                        <TituloDeTarjeta key={t.id} tarjeta={t} alAbrir={tarjetas.abrirDetalle} />
                      ))}
                    </ul>
                  )}
                </section>
              </li>
            ))}
          </ol>
          {/* ET04, ET05: las tarjetas que no están en Hecho ni tienen bloque horario. */}
          <section className="wg-agenda__sin-horario" aria-label="Tarjetas sin horario">
            <h3>Tarjetas sin horario</h3>
            {agenda.unscheduled.length === 0 ? (
              <EstadoVacio texto="No tienes tarjetas pendientes por programar." />
            ) : (
              <ul className="wg-columna__tarjetas">
                {agenda.unscheduled.map((t) => (
                  <TituloDeTarjeta key={t.id} tarjeta={t} alAbrir={tarjetas.abrirDetalle} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      {tarjetas.ventanas}
    </main>
  );
}
