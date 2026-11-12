import { useId, type InputHTMLAttributes } from 'react';

export interface CampoTextoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  /** Mensaje de campo (RT-04): va debajo del campo y resalta su borde. */
  mensaje?: string;
  multilinea?: boolean;
}

export function CampoTexto({
  etiqueta,
  valor,
  alCambiar,
  mensaje,
  multilinea = false,
  id,
  ...resto
}: CampoTextoProps) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idMensaje = `${idCampo}-mensaje`;
  const comunes = {
    id: idCampo,
    className: 'wg-campo__entrada',
    value: valor,
    'aria-invalid': mensaje ? true : undefined,
    'aria-describedby': mensaje ? idMensaje : undefined,
  };
  return (
    <div className="wg-campo">
      <label className="wg-campo__etiqueta" htmlFor={idCampo}>
        {etiqueta}
      </label>
      {multilinea ? (
        <textarea {...comunes} onChange={(e) => alCambiar(e.target.value)} />
      ) : (
        <input type="text" {...resto} {...comunes} onChange={(e) => alCambiar(e.target.value)} />
      )}
      {mensaje && (
        <span id={idMensaje} className="wg-campo__mensaje">
          {mensaje}
        </span>
      )}
    </div>
  );
}
