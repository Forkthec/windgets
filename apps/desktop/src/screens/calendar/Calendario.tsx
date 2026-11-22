import { useCallback, useEffect, useState } from 'react';
import type { CalendarMonth, CalendarMonthDay, CalendarWeek, CalendarWeekDay, ScreenParams } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { IconoAlerta, IconoReloj } from '@/ui/Iconos/Iconos';
import { useNucleo, useParametrosDeNavegacion } from '@/ventana_principal/VentanaPrincipal';
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

/** Vencidas y pendientes de un día (HE-10-HU05): lo que comparten las vistas mensual y semanal (ET08). */
type EstadoDelDia = Pick<CalendarMonthDay, 'overdue_count' | 'has_overdue' | 'has_pending'>;

/** Las clases del día: hoy (HE-10-HU01-ET02), rojo con vencidas (ET03) y amarillo con pendientes (ET04). */
function clasesDelDia(esHoy: boolean, estado: EstadoDelDia | undefined): string {
  return [
    'wg-calendario__dia',
    esHoy && 'wg-calendario__dia--hoy',
    estado?.has_overdue && 'wg-calendario__dia--vencida',
    estado?.has_pending && 'wg-calendario__dia--pendiente',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * El número o el nombre del día y el ícono de reloj con pendientes (ET17). El número es un botón para llegar con
 * el teclado; su selección sube a la celda, que abre el Panel del día (HE-10-HU03-ET01, ET08).
 */
function EncabezadoDelDia({ texto, estado }: { texto: string; estado: EstadoDelDia | undefined }) {
  return (
    <span className="wg-fila wg-calendario__encabezado">
      <button type="button" className="wg-calendario__numero">
        {texto}
      </button>
      {estado?.has_pending && <IconoReloj />}
    </span>
  );
}

/** «1 vencida» o «<cantidad> vencidas» con el ícono de alerta (ET06, ET07, ET13). */
function Vencidas({ estado }: { estado: EstadoDelDia | undefined }) {
  if (!estado?.has_overdue) return null;
  const n = estado.overdue_count;
  return (
    <span className="wg-fila wg-calendario__vencidas">
      <IconoAlerta />
      {`${n} ${n === 1 ? 'vencida' : 'vencidas'}`}
    </span>
  );
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
    // HE-10-HU03-ET01, ET08: cualquier parte de la celda, con sus títulos y «+N más», abre el Panel del día.
    <td
      className={`${clasesDelDia(esHoy, dia)} wg-calendario__celda`}
      aria-current={esHoy ? 'date' : undefined}
      onClick={alSeleccionar}
    >
      <EncabezadoDelDia texto={String(numero)} estado={dia} />
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
      {/* HE-10-HU05-ET15: debajo de las tarjetas y de «+N más». */}
      <Vencidas estado={dia} />
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
    // HE-10-HU03-ET08: también en la vista semanal, cualquier parte del día abre el Panel del día.
    <section
      className={`${clasesDelDia(esHoy, dia)} wg-calendario__celda`}
      aria-label={`${nombre} ${fechaVisible(dia.date)}`}
      aria-current={esHoy ? 'date' : undefined}
      onClick={alSeleccionar}
    >
      <h3>
        <EncabezadoDelDia texto={`${nombre} ${fechaVisible(dia.date)}`} estado={dia} />
      </h3>
      <Vencidas estado={dia} />
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
    // HE-10-HU05-ET09: también se vuelve a leer, porque las pendientes de ayer pasan a vencidas.
    const dejarDia = escuchar('day_changed', () => {
      setHoyEs(fechaIso(hoy()));
      void leer();
    });
    return () => {
      dejarTarjetas();
      dejarDia();
    };
  }, [escuchar, leer]);

  // Detalle de tarjeta sobre el Calendario (T-090, HE-10-HU03-ET05).
  const tarjetas = useVentanasDeTarjeta(useCallback(() => void leer(), [leer]));

  // HE-06-HU08: desde el widget Calendario, el Panel de un día en la vista mensual de ese mes (CA05) o la vista
  // mensual del mes actual (CA06).
  useParametrosDeNavegacion(
    'calendar',
    useCallback(({ date, calendar_view }: ScreenParams) => {
      if (date) {
        const [anio, mes, dia] = date.split('-').map(Number);
        setVista(mesDe(new Date(anio ?? 0, (mes ?? 1) - 1, dia ?? 1)));
        setDiaAbierto(date);
      } else if (calendar_view === 'month') {
        setVista(mesDe(hoy()));
        setDiaAbierto(null);
      }
    }, []),
  );

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
          // HE-10-HU04-ET02: el Formulario de tarjeta con la fecha límite del día ya diligenciada.
          alNuevaTarjeta={(dia) => tarjetas.abrirNueva(dia.date)}
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
              // HE-10-HU03-ET09: las celdas que no son de un día del mes no abren el Panel del día.
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
