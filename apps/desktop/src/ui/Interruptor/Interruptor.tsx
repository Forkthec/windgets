import { useId } from 'react';

export interface InterruptorProps {
  etiqueta: string;
  activo: boolean;
  alCambiar: (activo: boolean) => void;
  deshabilitado?: boolean;
}

export function Interruptor({ etiqueta, activo, alCambiar, deshabilitado = false }: InterruptorProps) {
  const id = useId();
  return (
    <span className="wg-fila">
      <button
        id={id}
        type="button"
        role="switch"
        className="wg-interruptor"
        aria-checked={activo}
        disabled={deshabilitado}
        onClick={() => alCambiar(!activo)}
      />
      <label htmlFor={id}>{etiqueta}</label>
    </span>
  );
}
