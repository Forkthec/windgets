import { useId } from 'react';
import { Segmentado } from '../Segmentado/Segmentado';

export interface OpcionSelector {
  valor: string;
  texto: string;
  deshabilitada?: boolean;
}

export interface SelectorProps {
  /** «segmentado» deja todas las opciones a la vista, para cuando son pocas (docs/rediseno.md RD-99). */
  variante?: 'lista' | 'segmentado';
  etiqueta: string;
  opciones: OpcionSelector[];
  valor: string;
  alCambiar: (valor: string) => void;
  mensaje?: string;
  deshabilitado?: boolean;
  /** El id del campo, para llevar el cursor a él con un error (RT-04-ET06). */
  id?: string;
}

export function Selector({
  variante = 'lista',
  etiqueta,
  opciones,
  valor,
  alCambiar,
  mensaje,
  deshabilitado = false,
  id: idPropio,
}: SelectorProps) {
  const idGenerado = useId();
  const id = idPropio ?? idGenerado;
  if (variante === 'segmentado') {
    return (
      <Segmentado
        etiqueta={etiqueta}
        opciones={opciones}
        valor={valor}
        alCambiar={alCambiar}
        mensaje={mensaje}
        deshabilitado={deshabilitado}
        id={id}
      />
    );
  }
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
        aria-describedby={mensaje ? `${id}-mensaje` : undefined}
        onChange={(e) => alCambiar(e.target.value)}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor} disabled={o.deshabilitada}>
            {o.texto}
          </option>
        ))}
      </select>
      {mensaje && (
        <span id={`${id}-mensaje`} className="wg-campo__mensaje">
          {mensaje}
        </span>
      )}
    </div>
  );
}
