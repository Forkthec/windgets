import { useId } from 'react';

export interface OpcionSelector {
  valor: string;
  texto: string;
}

export interface SelectorProps {
  etiqueta: string;
  opciones: OpcionSelector[];
  valor: string;
  alCambiar: (valor: string) => void;
  mensaje?: string;
  deshabilitado?: boolean;
}

export function Selector({
  etiqueta,
  opciones,
  valor,
  alCambiar,
  mensaje,
  deshabilitado = false,
}: SelectorProps) {
  const id = useId();
  return (
    <div className="wg-campo">
      <label className="wg-campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <select
        id={id}
        className="wg-campo__entrada"
        value={valor}
        disabled={deshabilitado}
        aria-invalid={mensaje ? true : undefined}
        onChange={(e) => alCambiar(e.target.value)}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {mensaje && <span className="wg-campo__mensaje">{mensaje}</span>}
    </div>
  );
}
