import { HexColorPicker } from 'react-colorful';

export interface SelectorColoresProps {
  etiqueta: string;
  /** `#RRGGBB` (el Núcleo normaliza a mayúsculas). */
  valor: string;
  alCambiar: (hex: string) => void;
}

export function SelectorColores({ etiqueta, valor, alCambiar }: SelectorColoresProps) {
  return (
    <div className="wg-campo" role="group" aria-label={etiqueta}>
      <span className="wg-campo__etiqueta">{etiqueta}</span>
      <HexColorPicker color={valor} onChange={(hex) => alCambiar(hex.toUpperCase())} />
    </div>
  );
}
