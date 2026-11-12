import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

export interface SelectorFechaProps {
  etiqueta: string;
  valor: Date | undefined;
  alCambiar: (fecha: Date | undefined) => void;
}

export function SelectorFecha({ etiqueta, valor, alCambiar }: SelectorFechaProps) {
  return (
    <div className="wg-campo" role="group" aria-label={etiqueta}>
      <span className="wg-campo__etiqueta">{etiqueta}</span>
      <DayPicker mode="single" locale={es} selected={valor} onSelect={alCambiar} />
    </div>
  );
}
