import { useEffect, useRef, useState } from 'react';
import { MESES, nombreDelMes } from './mes';

// Selector «Mes y año» del Calendario (docs/rediseno_final_prototipos.md §6.3; rediseno_final_backend.md §4.6;
// docs/rediseno.md RD-77): el título del mes es un botón que abre una cuadrícula de 12 meses con el año, que se
// cambia con ‹ › o se escribe (A-09: de 1970 a 2100). Elegir un mes lo abre en la vista mensual. Es solo navegación:
// usa el mismo `calendar_get_month`.

export const ANIO_MINIMO = 1970;
export const ANIO_MAXIMO = 2100;

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface SelectorMesAnioProps {
  anio: number;
  mes: number;
  alElegir: (anio: number, mes: number) => void;
}

export function SelectorMesAnio({ anio, mes, alElegir }: SelectorMesAnioProps) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(String(anio));
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => setTexto(String(anio)), [anio, abierto]);
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

  const numero = Number(texto);
  // A-09: solo años de 1970 a 2100; con otro valor los meses quedan deshabilitados.
  const valido = /^\d{4}$/.test(texto) && numero >= ANIO_MINIMO && numero <= ANIO_MAXIMO;
  const mover = (paso: number) => {
    const base = valido ? numero : anio;
    setTexto(String(Math.min(ANIO_MAXIMO, Math.max(ANIO_MINIMO, base + paso))));
  };

  return (
    <div ref={caja} className="wg-selector-mes">
      <h2 className="wg-calendario__titulo">
        <button
          type="button"
          className="wg-boton-titulo"
          aria-expanded={abierto}
          aria-haspopup="dialog"
          title="Elegir mes y año"
          onClick={() => setAbierto((a) => !a)}
        >
          {nombreDelMes(anio, mes)}
        </button>
      </h2>
      {abierto && (
        <div className="wg-flotante wg-selector-mes__flotante" role="dialog" aria-label="Mes y año">
          <div className="wg-fila wg-selector-mes__anio">
            <button
              type="button"
              className="wg-icono-boton"
              aria-label="Año anterior"
              title="Año anterior"
              disabled={valido && numero <= ANIO_MINIMO}
              onClick={() => mover(-1)}
            >
              ‹
            </button>
            <input
              className="wg-campo__entrada"
              aria-label="Año"
              inputMode="numeric"
              maxLength={4}
              value={texto}
              aria-invalid={!valido || undefined}
              onChange={(e) => setTexto(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            <button
              type="button"
              className="wg-icono-boton"
              aria-label="Año siguiente"
              title="Año siguiente"
              disabled={valido && numero >= ANIO_MAXIMO}
              onClick={() => mover(1)}
            >
              ›
            </button>
          </div>
          <div className="wg-selector-mes__meses">
            {MESES_CORTOS.map((corto, i) => (
              <button
                key={corto}
                type="button"
                className="wg-segmentado__opcion"
                aria-label={MESES[i]}
                aria-pressed={valido && numero === anio && i === mes}
                disabled={!valido}
                onClick={() => {
                  alElegir(numero, i);
                  setAbierto(false);
                }}
              >
                {corto}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
