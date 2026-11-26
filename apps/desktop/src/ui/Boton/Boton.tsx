import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { NombreEmergente } from '../NombreEmergente/NombreEmergente';

/** La jerarquía de botones (docs/rediseno.md RD-99). */
export type VarianteDeBoton = 'principal' | 'secundario' | 'icono' | 'destructivo';

export interface BotonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  /** Sin decirla, «secundario». Un botón «icono» no tiene texto visible: lleva `aria-label`. */
  variante?: VarianteDeBoton;
  /** Atajo de `variante="principal"`; si se dan los dos, gana `variante`. */
  principal?: boolean;
  /** «normal» mide 36 px; «fila», el de las acciones de una fila de lista, 32 px. */
  tam?: 'normal' | 'fila';
  /** Texto del motivo de una opción deshabilitada (RT-04). Si no hay espacio, va en el nombre emergente (RD-100). */
  motivo?: string;
  motivoAlPasar?: boolean;
}

export function Boton({
  children,
  variante,
  principal = false,
  tam = 'normal',
  motivo,
  motivoAlPasar = false,
  disabled,
  className,
  ...resto
}: BotonProps) {
  const nivel = variante ?? (principal ? 'principal' : 'secundario');
  const clases = ['wg-boton', `wg-boton--${nivel}`, tam === 'fila' ? 'wg-boton--fila' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  const boton = (
    <button type="button" className={clases} disabled={disabled} {...resto}>
      {children}
    </button>
  );
  // Siempre envuelto con `motivoAlPasar`, para que habilitarlo no vuelva a montar el botón ni le quite el foco.
  if (motivoAlPasar) return <NombreEmergente texto={disabled ? motivo : undefined}>{boton}</NombreEmergente>;
  if (!disabled || !motivo) return boton;
  return (
    <span className="wg-fila">
      {boton}
      <span className="wg-motivo">{motivo}</span>
    </span>
  );
}
