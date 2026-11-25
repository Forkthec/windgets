import { useCallback, useEffect, useState } from 'react';
import type { CalendarDay } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import textos from '@/types/messages.es.json';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from '../tarjeta/fechas';
import { NOMBRE_DE_PRIORIDAD, NOMBRE_DE_TIPO } from '../tarjeta/nombres';
import { NombreEmergente } from '@/ui/NombreEmergente/NombreEmergente';

// P-CAL-02 Panel del día (Menú principal > Planificador > Calendario > Panel del día; HE-10-HU03). Subpantalla de
// la pantalla Calendario: la fecha del día, sus tarjetas (IPC-CARD-14) y las opciones «Nueva tarjeta» y
// «Cerrar» (ET02, ET03). El título de una tarjeta abre el Detalle de tarjeta sobre el Calendario y el panel sigue
// abierto al cerrarlo (ET05, ET06).

export interface PanelDelDiaProps {
  /** El día, AAAA-MM-DD. */
  fecha: string;
  alAbrirTarjeta: (id: string) => void;
  /** «Nueva tarjeta» lleva a HE-10-HU04 (ET07). */
  alNuevaTarjeta: (dia: CalendarDay) => void;
  alCerrar: () => void;
}

export function PanelDelDia({ fecha, alAbrirTarjeta, alNuevaTarjeta, alCerrar }: PanelDelDiaProps) {
  const { invocar, escuchar } = useNucleo();
  const [dia, setDia] = useState<CalendarDay | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('calendar_get_day', { date: fecha });
    if (r.ok) setDia(r.value);
  }, [fecha, invocar]);

  useEffect(() => {
    setDia(null);
    void leer();
    return escuchar('cards_changed', () => void leer());
  }, [escuchar, leer]);

  return (
    <section className="wg-panel-del-dia" aria-label="Panel del día" aria-busy={dia === null}>
      {/* RD-78 (rediseno_final_prototipos.md §6.3): panel lateral derecho de 360 px junto al calendario, con «×»
          arriba, la fecha y «+ Nueva tarjeta». */}
      <div className="wg-fila wg-panel-del-dia__cabecera">
        {/* ET02: la fecha del día. */}
        <h3>{fechaVisible(fecha)}</h3>
        <NombreEmergente texto="Cerrar">
          <button
            type="button"
            className="wg-icono-boton wg-panel-del-dia__cerrar"
            aria-label="Cerrar"
            onClick={alCerrar}
          >
            ×
          </button>
        </NombreEmergente>
      </div>
      <div className="wg-fila">
        {/* HE-10-HU04-ET01, ET07: abre el Formulario de tarjeta; en un día pasado va deshabilitada con su texto. */}
        {/* docs/rediseno.md RD-53 (84:334): «Nueva tarjeta» es la acción principal. */}
        <Boton
          principal
          className="wg-boton--mas"
          disabled={dia?.can_create === false}
          motivo={dia?.can_create === false ? textos.NO_CREAR_EN_DIAS_PASADOS : undefined}
          onClick={() => dia && alNuevaTarjeta(dia)}
        >
          Nueva tarjeta
        </Boton>
      </div>
      {dia &&
        (dia.cards.length === 0 ? (
          // ET04: estado vacío (RT-04).
          <EstadoVacio texto="No tienes tarjetas para este día." />
        ) : (
          <ul className="wg-columna__tarjetas" aria-label="Tarjetas del día">
            {dia.cards.map((t) => (
              // ET03: tipo, título, prioridad y columna.
              <li key={t.id} className="wg-tarjeta wg-fila">
                <span>{NOMBRE_DE_TIPO[t.type]}</span>
                <button type="button" className="wg-tarjeta__titulo" onClick={() => alAbrirTarjeta(t.id)}>
                  {t.title}
                </button>
                {t.priority && <span>{NOMBRE_DE_PRIORIDAD[t.priority]}</span>}
                <span>{t.column_name}</span>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
