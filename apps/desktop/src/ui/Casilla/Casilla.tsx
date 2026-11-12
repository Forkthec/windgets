import { useId } from 'react';

export interface CasillaProps {
  etiqueta: string;
  marcada: boolean;
  alCambiar: (marcada: boolean) => void;
  deshabilitada?: boolean;
}

export function Casilla({ etiqueta, marcada, alCambiar, deshabilitada = false }: CasillaProps) {
  const id = useId();
  return (
    <span className={`wg-fila${deshabilitada ? ' wg-deshabilitado' : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={marcada}
        disabled={deshabilitada}
        onChange={(e) => alCambiar(e.target.checked)}
      />
      <label htmlFor={id}>{etiqueta}</label>
    </span>
  );
}
