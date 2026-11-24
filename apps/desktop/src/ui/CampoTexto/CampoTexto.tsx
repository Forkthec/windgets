import { useId, useState, type InputHTMLAttributes } from 'react';

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
  // docs/rediseno.md RD-81 (rediseno_final_prototipos.md §3.9, P54): las contraseñas llevan un ojo para mostrarlas u
  // ocultarlas.
  const [visible, setVisible] = useState(false);
  const esContrasena = resto.type === 'password';
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
      ) : !esContrasena ? (
        <input type="text" {...resto} {...comunes} onChange={(e) => alCambiar(e.target.value)} />
      ) : (
        <div className="wg-campo__con-ojo">
          <input
            {...resto}
            type={visible ? 'text' : 'password'}
            {...comunes}
            onChange={(e) => alCambiar(e.target.value)}
          />
          <button
            type="button"
            className="wg-campo__ojo"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M1.5 9C3 5.4 5.7 3.6 9 3.6C12.3 3.6 15 5.4 16.5 9C15 12.6 12.3 14.4 9 14.4C5.7 14.4 3 12.6 1.5 9Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle cx="9" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.4" />
              {visible && <path d="M2.7 15.3L15.3 2.7" stroke="currentColor" strokeWidth="1.4" />}
            </svg>
          </button>
        </div>
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
