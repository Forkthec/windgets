import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { NavegacionDeFecha } from '@/ui/NavegacionDeFecha/NavegacionDeFecha';
import { fechaIso, fechaLarga, hoy } from '../tarjeta/fechas';
import { NombreEmergente } from '@/ui/NombreEmergente/NombreEmergente';

// Navegación de la Agenda diaria (docs/rediseno_final_prototipos.md §6.4; rediseno_final_backend.md §4.6, D-26;
// docs/rediseno.md RD-79): la fecha larga es un botón que abre un mini calendario para saltar a cualquier día;
// flechas ‹ › e «Ir a hoy»; y debajo la tira semanal (L 23 · M 24 · … · D 29) con el día elegido resaltado. Todo queda
// fijo arriba; solo la cuadrícula de horas se desplaza. Es solo navegación: el mismo `agenda_get_day`.

const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const NOMBRES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function deIso(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio ?? 0, (mes ?? 1) - 1, dia ?? 1);
}

/** Los 7 días (lunes a domingo) de la semana de `iso`. */
export function semanaDe(iso: string): Date[] {
  const fecha = deIso(iso);
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - ((fecha.getDay() + 6) % 7));
  return Array.from(
    { length: 7 },
    (_, i) => new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i),
  );
}

export interface NavegacionDeLaAgendaProps {
  dia: string;
  alCambiar: (iso: string) => void;
  /** «Ir a hoy»: vuelve a hoy y se ubica en la hora actual (HE-11-HU01-ET07). */
  alIrAHoy: () => void;
}

export function NavegacionDeLaAgenda({ dia, alCambiar, alIrAHoy }: NavegacionDeLaAgendaProps) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);
  const mover = (dias: number) => {
    const f = deIso(dia);
    alCambiar(fechaIso(new Date(f.getFullYear(), f.getMonth(), f.getDate() + dias)));
  };
  const hoyEs = fechaIso(hoy());
  return (
    <div className="wg-agenda__navegacion">
      <NavegacionDeFecha
        titulo={
          <div ref={caja} className="wg-selector-mes">
            <h2 className="wg-agenda__fecha">
              <NombreEmergente texto="Elegir un día">
                <button
                  type="button"
                  className="wg-boton-titulo"
                  aria-expanded={abierto}
                  onClick={() => setAbierto((a) => !a)}
                >
                  {fechaLarga(dia)}
                </button>
              </NombreEmergente>
            </h2>
            {abierto && (
              <div
                className="wg-flotante wg-selector-fecha__flotante"
                role="dialog"
                aria-label="Elegir un día"
              >
                <DayPicker
                  mode="single"
                  locale={es}
                  selected={deIso(dia)}
                  defaultMonth={deIso(dia)}
                  onSelect={(fecha) => {
                    if (fecha) alCambiar(fechaIso(fecha));
                    setAbierto(false);
                  }}
                />
              </div>
            )}
          </div>
        }
        anterior="Día anterior"
        siguiente="Día siguiente"
        alAnterior={() => mover(-1)}
        alSiguiente={() => mover(1)}
        alIrAHoy={alIrAHoy}
        diaDeHoy={Number(hoyEs.slice(8))}
      />
      {/* D-26: la tira semanal. */}
      <div className="wg-agenda__tira" role="group" aria-label="Días de la semana">
        {semanaDe(dia).map((f, i) => {
          const iso = fechaIso(f);
          return (
            <button
              key={iso}
              type="button"
              className="wg-segmentado__opcion wg-agenda__dia-de-la-tira"
              aria-pressed={iso === dia}
              aria-label={`${NOMBRES[i]} ${f.getDate()}`}
              aria-current={iso === hoyEs ? 'date' : undefined}
              onClick={() => alCambiar(iso)}
            >
              {`${LETRAS[i]} ${f.getDate()}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
