import { useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke } from '@/types';
import { DIAS, nombreDelMes, semanasDelMes } from '@/screens/calendar/mes';
import { fechaIso } from '@/screens/tarjeta/fechas';
import { abrirPantalla } from './abrirPantalla';

// Widget Calendario de la capa (P-WAL-02, HE-06-HU07). Muestra el mes actual con el día actual resaltado; no es
// la vista Calendario del planificador (ET01). «Hoy» es la fecha del computador (zona horaria local) y cambia con
// EV-22 `day_changed`.
// DUDA: HE-06-HU07 el CA no pide datos de tarjetas, así que el widget no lee IPC-CARD-12 (llega con HE-10-HU01,
// P17). El encabezado y los nombres de los días no están definidos. Valor usado: «<Mes> <año>» y los días de
// lunes a domingo con su inicial, como la vista mensual (HE-10-HU01-ET02) (docs/DUDAS.md).

export interface WidgetCalendarioProps {
  invocar: Invoke;
  escuchar: Escuchar;
}

export function WidgetCalendario({ invocar, escuchar }: WidgetCalendarioProps) {
  const [hoy, setHoy] = useState(() => new Date());

  // A las 00:00 el Núcleo avisa que cambió el día y el widget pasa al día (y al mes) nuevo.
  useEffect(() => escuchar('day_changed', () => setHoy(new Date())), [escuchar]);

  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const titulo = nombreDelMes(anio, mes);
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <table className="wg-calendario-widget" aria-label={titulo}>
        <caption>
          {/* HE-06-HU08-CA06: el nombre del mes abre el Calendario en vista mensual. */}
          <button
            type="button"
            className="wg-calendario-widget__mes"
            onClick={() => abrirPantalla(invocar, 'calendar', { calendar_view: 'month' })}
          >
            {titulo}
          </button>
        </caption>
        <thead>
          <tr>
            {DIAS.map((d) => (
              <th key={d} scope="col" abbr={d}>
                {d[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanasDelMes(anio, mes).map((semana, i) => (
            <tr key={i}>
              {semana.map((dia, j) => {
                const esHoy = dia === hoy.getDate();
                return (
                  <td
                    key={j}
                    // ET01: el día actual resaltado.
                    className={esHoy ? 'wg-calendario-widget__hoy' : undefined}
                    aria-current={esHoy ? 'date' : undefined}
                  >
                    {dia !== null && (
                      // HE-06-HU08-CA05: un día abre el Calendario con el Panel de ese día.
                      <button
                        type="button"
                        className="wg-calendario-widget__dia"
                        onClick={() =>
                          abrirPantalla(invocar, 'calendar', { date: fechaIso(new Date(anio, mes, dia)) })
                        }
                      >
                        {dia}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
