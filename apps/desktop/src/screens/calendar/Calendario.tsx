import { useCallback, useEffect, useState } from 'react';
import type { CalendarMonth, CalendarMonthDay } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaIso, hoy } from '../tarjeta/fechas';
import { DIAS, nombreDelMes, semanasDelMes } from './mes';

// P-CAL-01 Calendario (Menú principal > Planificador > Calendario; HE-10-HU01). Al abrir muestra la vista
// mensual del mes actual (ET01). Los días y los títulos de sus tarjetas vienen del Núcleo (IPC-CARD-12); la
// pantalla se vuelve a leer con cards_changed y al cambiar el día.

/** El mes que se muestra: año y mes de 0 (enero) a 11. */
interface Mes {
  anio: number;
  mes: number;
}

function mesDe(fecha: Date): Mes {
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
}

/** El mes `n` meses antes o después. */
function otroMes({ anio, mes }: Mes, n: number): Mes {
  return mesDe(new Date(anio, mes + n, 1));
}

/** Un día de la vista mensual: su número, hasta 3 títulos y «+N más» (ET03, ET05). */
function Dia({ numero, dia, esHoy }: { numero: number; dia: CalendarMonthDay | undefined; esHoy: boolean }) {
  return (
    <td
      // ET02: el día actual resaltado.
      className={`wg-calendario__dia${esHoy ? ' wg-calendario__dia--hoy' : ''}`}
      aria-current={esHoy ? 'date' : undefined}
    >
      <span className="wg-calendario__numero">{numero}</span>
      {dia && dia.preview.length > 0 && (
        <ul className="wg-calendario__tarjetas">
          {dia.preview.map((t) => (
            <li key={t.id} className="wg-calendario__tarjeta">
              {t.title}
            </li>
          ))}
        </ul>
      )}
      {dia && dia.extra_count > 0 && <span className="wg-calendario__mas">{`+${dia.extra_count} más`}</span>}
    </td>
  );
}

export function Calendario() {
  const { invocar, escuchar } = useNucleo();
  const [visto, setVisto] = useState<Mes>(() => mesDe(hoy()));
  const [datos, setDatos] = useState<{ visto: Mes; mes: CalendarMonth } | null>(null);
  const [hoyEs, setHoyEs] = useState(() => fechaIso(hoy()));

  const leer = useCallback(async () => {
    const r = await invocar('calendar_get_month', { year: visto.anio, month: visto.mes + 1 });
    if (r.ok) setDatos({ visto, mes: r.value });
  }, [invocar, visto]);

  useEffect(() => {
    void leer();
    const dejarTarjetas = escuchar('cards_changed', () => void leer());
    // «Hoy» es la fecha del computador: a las 00:00 cambia el día resaltado (EV-22).
    const dejarDia = escuchar('day_changed', () => setHoyEs(fechaIso(hoy())));
    return () => {
      dejarTarjetas();
      dejarDia();
    };
  }, [escuchar, leer]);

  const porFecha = new Map((datos?.mes.days ?? []).map((d) => [d.date, d]));
  const titulo = nombreDelMes(visto.anio, visto.mes);
  return (
    <main aria-label="Calendario" aria-busy={datos === null}>
      {/* ET04: las opciones de la vista mensual. «Semana» es de HE-10-HU02. */}
      <div className="wg-fila">
        <Boton onClick={() => setVisto((v) => otroMes(v, -1))}>Mes anterior</Boton>
        <Boton onClick={() => setVisto((v) => otroMes(v, 1))}>Mes siguiente</Boton>
        <Boton onClick={() => setVisto(mesDe(hoy()))}>Hoy</Boton>
        <Boton principal aria-pressed>
          Mes
        </Boton>
        <Boton aria-pressed={false}>Semana</Boton>
      </div>
      {/* ET02: el nombre del mes y el año. */}
      <h2>{titulo}</h2>
      <table className="wg-calendario" aria-label={titulo}>
        <thead>
          <tr>
            {DIAS.map((d) => (
              <th key={d} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanasDelMes(visto.anio, visto.mes).map((semana, i) => (
            <tr key={i}>
              {semana.map((numero, j) => {
                if (numero === null) return <td key={j} />;
                const fecha = fechaIso(new Date(visto.anio, visto.mes, numero));
                return <Dia key={j} numero={numero} dia={porFecha.get(fecha)} esHoy={fecha === hoyEs} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
