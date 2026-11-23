import { useId, type InputHTMLAttributes } from 'react';

export interface CampoTextoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  /** Mensaje de campo (RT-04): va debajo del campo y resalta su borde. */
  mensaje?: string;
  multilinea?: boolean;
  /**
   * Contador «n/máx» a la derecha de la etiqueta (docs/rediseno.md RD-10). Solo informa: no corta lo que se
   * escribe; el límite lo sigue avisando el mensaje de campo.
   */
  maximo?: number;
  /** Texto de ayuda fijo debajo del campo (docs/rediseno.md RD-11). */
  ayuda?: string;
  /** Marca « *» en la etiqueta y `aria-required` (docs/rediseno.md RD-11). */
  obligatorio?: boolean;
}

export function CampoTexto({
  etiqueta,
  valor,
  alCambiar,
  mensaje,
  multilinea = false,
  maximo,
  ayuda,
  obligatorio = false,
  id,
  ...resto
}: CampoTextoProps) {
  const generado = useId();
  const idCampo = id ?? generado;
  const idMensaje = `${idCampo}-mensaje`;
  const idAyuda = `${idCampo}-ayuda`;
  const descritoPor = [ayuda ? idAyuda : '', mensaje ? idMensaje : ''].filter(Boolean).join(' ');
  const comunes = {
    id: idCampo,
    className: 'wg-campo__entrada',
    value: valor,
    'aria-invalid': mensaje ? true : undefined,
    'aria-describedby': descritoPor || undefined,
    'aria-required': obligatorio ? true : undefined,
  };
  const etiquetaDelCampo = (
    // La « *» va en CSS (sin texto alternativo): el nombre accesible del campo sigue siendo la etiqueta del CA.
    <label
      className={obligatorio ? 'wg-campo__etiqueta wg-campo__etiqueta--obligatoria' : 'wg-campo__etiqueta'}
      htmlFor={idCampo}
    >
      {etiqueta}
    </label>
  );
  return (
    <div className="wg-campo">
      {maximo === undefined ? (
        etiquetaDelCampo
      ) : (
        <div className="wg-campo__cabecera">
          {etiquetaDelCampo}
          <span className="wg-campo__contador" aria-hidden="true">
            {valor.length}/{maximo}
          </span>
        </div>
      )}
      {multilinea ? (
        <textarea {...comunes} onChange={(e) => alCambiar(e.target.value)} />
      ) : (
        <input type="text" {...resto} {...comunes} onChange={(e) => alCambiar(e.target.value)} />
      )}
      {ayuda && (
        <span id={idAyuda} className="wg-campo__ayuda">
          {ayuda}
        </span>
      )}
      {mensaje && (
        <span id={idMensaje} className="wg-campo__mensaje">
          {mensaje}
        </span>
      )}
    </div>
  );
}
