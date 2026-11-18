import { useCallback, useEffect, useState } from 'react';
import type { CalendarMonth, CalendarMonthDay, CalendarWeek, CalendarWeekDay } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaIso, fechaVisible, hoy } from '../tarjeta/fechas';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';
import { DIAS, nombreDelMes, semanasDelMes } from './mes';
import { PanelDelDia } from './PanelDelDia';

// P-CAL-01 Calendario (Menú principal > Planificador > Calendario). Al abrir muestra la vista mensual del mes
// actual (HE-10-HU01-ET01); «Semana» cambia a la vista semanal (HE-10-HU02). Los días y sus tarjetas vienen del
// Núcleo (IPC-CARD-12 y 13); la pantalla se vuelve a leer con cards_changed y al cambiar el día.
// DUDA: HE-10-HU02 el encabezado de la vista semanal y de cada día no está definido. Valor usado: «Semana del
// <lunes> al <domingo>» y «<día> <DD/MM/AAAA>» (docs/DUDAS.md).

/** Lo que se muestra: un mes (año y mes de 0 a 11) o una semana (su lunes). */
type Vista = { tipo: 'mes'; anio: number; mes: number } | { tipo: 'semana'; lunes: Date };

function mesDe(fecha: Date): Vista {
  return { tipo: 'mes', anio: fecha.getFullYear(), mes: fecha.getMonth() };
}

/** El lunes de la semana de `fecha` (la semana va de lunes a domingo, HE-10-HU02-ET02). */
function lunesDe(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - ((fecha.getDay() + 6) % 7));
}

function masDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/** «14:00»: la hora de inicio del bloque horario (D-169). */
function horaVisible(hora: number): string {
  return `${String(hora).padStart(2, '0')}:00`;
}

/** Un día de la vista mensual: su número, hasta 3 títulos y «+N más» (HE-10-HU01-ET03, ET05). */
function DiaDelMes({
  numero,
  dia,
  esHoy,
  alSeleccionar,
}: {
  numero: number;
  dia: CalendarMonthDay | undefined;
  esHoy: boolean;
  alSeleccionar: () => void;
}) {
  return (
    <td
      // HE-10-HU01-ET02: el día actual resaltado.
      className={`wg-calendario__dia${esHoy ? ' wg-calendario__dia--hoy' : ''}`}
      aria-current={esHoy ? 'date' : undefined}
    >
      {/* HE-10-HU03-ET01: seleccionar el día abre el Panel del día. */}
      <button type="button" className="wg-calendario__numero" onClick={alSeleccionar}>
        {numero}
      </button>
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

/** Un día de la vista semanal: todas sus tarjetas, con la hora de inicio de su bloque (HE-10-HU02-ET03, ET05). */
function DiaDeLaSemana({
  nombre,
  dia,
  esHoy,
  alSeleccionar,
}: {
  nombre: string;
  dia: CalendarWeekDay;
  esHoy: boolean;
  alSeleccionar: () => void;
}) {
  return (
    <section
      className={`wg-calendario__dia${esHoy ? ' wg-calendario__dia--hoy' : ''}`}
      aria-label={`${nombre} ${fechaVisible(dia.date)}`}
      aria-current={esHoy ? 'date' : undefined}
    >
      <h3>
        {/* HE-10-HU03-ET08: también desde la vista semanal. */}
        <button type="button" className="wg-calendario__numero" onClick={alSeleccionar}>
          {`${nombre} ${fechaVisible(dia.date)}`}
        </button>
      </h3>
      {dia.cards.length > 0 && (
        <ul className="wg-calendario__tarjetas">
          {dia.cards.map(({ card, start_hour }) => (
            <li key={card.id} className="wg-calendario__tarjeta wg-fila">
              {start_hour !== null && <span>{horaVisible(start_hour)}</span>}
              <span>{card.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Datos = { tipo: 'mes'; mes: CalendarMonth } | { tipo: 'semana'; semana: CalendarWeek };

export function Calendario() {
  const { invocar, escuchar } = useNucleo();
  const [vista, setVista] = useState<Vista>(() => mesDe(hoy()));
  const [datos, setDatos] = useState<Datos | null>(null);
  const [hoyEs, setHoyEs] = useState(() => fechaIso(hoy()));
  // P-CAL-02: el día del Panel del día abierto, o ninguno (HE-10-HU03).
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);

  const leer = useCallback(async () => {
    if (vista.tipo === 'mes') {
      const r = await invocar('calendar_get_month', { year: vista.anio, month: vista.mes + 1 });
      if (r.ok) setDatos({ tipo: 'mes', mes: r.value });
    } else {
      const r = await invocar('calendar_get_week', { week_start: fechaIso(vista.lunes) });
      if (r.ok) setDatos({ tipo: 'semana', semana: r.value });
    }
  }, [invocar, vista]);

  useEffect(() => {
    setDatos(null);
    void leer();
    const dejarTarjetas = escuchar('cards_changed', () => void leer());
    // «Hoy» es la fecha del computador: a las 00:00 cambia el día resaltado (EV-22).
    const dejarDia = escuchar('day_changed', () => setHoyEs(fechaIso(hoy())));
    return () => {
      dejarTarjetas();
      dejarDia();
    };
  }, [escuchar, leer]);

  // Detalle de tarjeta sobre el Calendario (T-090, HE-10-HU03-ET05).
  const tarjetas = useVentanasDeTarjeta(useCallback(() => void leer(), [leer]));

  /** «Mes anterior» o «Semana anterior» (n = -1), y «Mes siguiente» o «Semana siguiente» (n = 1). */
  const mover = (n: number) =>
    setVista((v) =>
      v.tipo === 'mes'
        ? mesDe(new Date(v.anio, v.mes + n, 1))
        : // HE-10-HU02-ET06: de a una semana.
          { tipo: 'semana', lunes: masDias(v.lunes, 7 * n) },
    );
  // HE-10-HU01-ET07 y HE-10-HU02-ET08: «Hoy» vuelve al mes o a la semana actual.
  const irAHoy = () =>
    setVista((v) => (v.tipo === 'mes' ? mesDe(hoy()) : { tipo: 'semana', lunes: lunesDe(hoy()) }));
  // HE-10-HU02-ET07, ET09 (D-168): «Mes» muestra el mes que contiene el lunes de la semana consultada.
  const aMes = () => setVista((v) => (v.tipo === 'mes' ? v : mesDe(v.lunes)));
  // HE-10-HU02-ET01: «Semana» abre la semana actual.
  const aSemana = () =>
    setVista((v) => (v.tipo === 'semana' ? v : { tipo: 'semana', lunes: lunesDe(hoy()) }));

  const esMes = vista.tipo === 'mes';
  const titulo =
    vista.tipo === 'mes'
      ? nombreDelMes(vista.anio, vista.mes)
      : `Semana del ${fechaVisible(fechaIso(vista.lunes))} al ${fechaVisible(fechaIso(masDias(vista.lunes, 6)))}`;
  return (
    <main aria-label="Calendario" aria-busy={datos === null}>
      {/* HE-10-HU01-ET04 y HE-10-HU02-ET04: las opciones de cada vista. */}
      <div className="wg-fila">
        <Boton onClick={() => mover(-1)}>{esMes ? 'Mes anterior' : 'Semana anterior'}</Boton>
        <Boton onClick={() => mover(1)}>{esMes ? 'Mes siguiente' : 'Semana siguiente'}</Boton>
        <Boton onClick={irAHoy}>Hoy</Boton>
        <Boton principal={esMes} aria-pressed={esMes} onClick={aMes}>
          Mes
        </Boton>
        {esMes && (
          <Boton aria-pressed={false} onClick={aSemana}>
            Semana
          </Boton>
        )}
      </div>
      <h2>{titulo}</h2>
      {vista.tipo === 'mes' && (
        <VistaMensual
          vista={vista}
          mes={datos?.tipo === 'mes' ? datos.mes : null}
          hoyEs={hoyEs}
          titulo={titulo}
          alSeleccionar={setDiaAbierto}
        />
      )}
      {vista.tipo === 'semana' && datos?.tipo === 'semana' && (
        <div className="wg-calendario-semana" aria-label={titulo}>
          {datos.semana.days.map((dia, i) => (
            <DiaDeLaSemana
              key={dia.date}
              nombre={DIAS[i] ?? ''}
              dia={dia}
              esHoy={dia.date === hoyEs}
              alSeleccionar={() => setDiaAbierto(dia.date)}
            />
          ))}
        </div>
      )}
      {diaAbierto && (
        <PanelDelDia
          fecha={diaAbierto}
          alAbrirTarjeta={tarjetas.abrirDetalle}
          alNuevaTarjeta={() => undefined}
          alCerrar={() => setDiaAbierto(null)}
        />
      )}
      {tarjetas.ventanas}
    </main>
  );
}

interface VistaMensualProps {
  vista: { anio: number; mes: number };
  mes: CalendarMonth | null;
  hoyEs: string;
  titulo: string;
  alSeleccionar: (fecha: string) => void;
}

function VistaMensual({ vista, mes, hoyEs, titulo, alSeleccionar }: VistaMensualProps) {
  const porFecha = new Map((mes?.days ?? []).map((d) => [d.date, d]));
  return (
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
        {semanasDelMes(vista.anio, vista.mes).map((semana, i) => (
          <tr key={i}>
            {semana.map((numero, j) => {
              if (numero === null) return <td key={j} />;
              const fecha = fechaIso(new Date(vista.anio, vista.mes, numero));
              return (
                <DiaDelMes
                  key={j}
                  numero={numero}
                  dia={porFecha.get(fecha)}
                  esHoy={fecha === hoyEs}
                  alSeleccionar={() => alSeleccionar(fecha)}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
