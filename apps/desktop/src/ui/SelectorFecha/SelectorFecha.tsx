import { useEffect, useRef, useState } from 'react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { NombreEmergente } from '../NombreEmergente/NombreEmergente';

export interface SelectorFechaProps {
  etiqueta: string;
  valor: Date | undefined;
  alCambiar: (fecha: Date | undefined) => void;
  /**
   * `false` cuando el selector acompaña a un campo de texto que ya muestra la etiqueta (Fecha límite del
   * Formulario de tarjeta, HE-07-HU01-ET04): la etiqueta queda solo para los lectores de pantalla.
   */
  etiquetaVisible?: boolean;
  /** docs/rediseno.md RD-75 (§3.6-1, §3.8): los días que no se pueden elegir quedan deshabilitados. */
  deshabilitados?: Matcher | Matcher[];
  /**
   * RD-75 (§3.8): en vez de estar siempre abierto, el calendario se abre flotando desde un botón con ícono junto al
   * campo, y se cierra al elegir un día, con Esc o al hacer clic fuera.
   */
  flotante?: boolean;
}

export function SelectorFecha({
  etiqueta,
  valor,
  alCambiar,
  etiquetaVisible = true,
  deshabilitados,
  flotante = false,
}: SelectorFechaProps) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla, true);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla, true);
    };
  }, [abierto]);

  const calendario = (
    <DayPicker
      mode="single"
      locale={es}
      selected={valor}
      defaultMonth={valor}
      disabled={deshabilitados}
      onSelect={(fecha) => {
        alCambiar(fecha);
        setAbierto(false);
      }}
    />
  );
  if (!flotante)
    return (
      <div className="wg-campo" role="group" aria-label={etiqueta}>
        {etiquetaVisible && <span className="wg-campo__etiqueta">{etiqueta}</span>}
        {calendario}
      </div>
    );
  return (
    <div ref={caja} className="wg-selector-fecha" role="group" aria-label={etiqueta}>
      <NombreEmergente texto="Elegir en el calendario">
        <button
          type="button"
          className="wg-icono-boton wg-selector-fecha__abrir"
          aria-label={`Abrir ${etiqueta.toLowerCase()}`}
          aria-expanded={abierto}
          onClick={() => setAbierto((a) => !a)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M1.8 7.2H16.2M5.4 1.8V4.5M12.6 1.8V4.5M1.8 4.5H16.2V15.3H1.8V4.5Z"
              stroke="currentColor"
              strokeWidth="1.44"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </NombreEmergente>
      {abierto && <div className="wg-selector-fecha__flotante">{calendario}</div>}
    </div>
  );
}
