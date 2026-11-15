import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

export interface SelectorFechaProps {
  etiqueta: string;
  valor: Date | undefined;
  alCambiar: (fecha: Date | undefined) => void;
  /**
   * `false` cuando el selector acompaña a un campo de texto que ya muestra la etiqueta (Fecha límite del
   * Formulario de tarjeta, HE-07-HU01-ET04): la etiqueta queda solo para los lectores de pantalla.
   */
  etiquetaVisible?: boolean;
}

export function SelectorFecha({ etiqueta, valor, alCambiar, etiquetaVisible = true }: SelectorFechaProps) {
  return (
    <div className="wg-campo" role="group" aria-label={etiqueta}>
      {etiquetaVisible && <span className="wg-campo__etiqueta">{etiqueta}</span>}
      <DayPicker mode="single" locale={es} selected={valor} onSelect={alCambiar} />
    </div>
  );
}
