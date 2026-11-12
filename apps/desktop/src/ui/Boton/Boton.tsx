import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface BotonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  principal?: boolean;
  /** Texto del motivo de una opción deshabilitada (RT-04). Si no hay espacio, va como sugerencia al pasar el mouse. */
  motivo?: string;
  motivoAlPasar?: boolean;
}

export function Boton({
  children,
  principal = false,
  motivo,
  motivoAlPasar = false,
  disabled,
  className,
  ...resto
}: BotonProps) {
  const clases = ['wg-boton', principal ? 'wg-boton--principal' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  const boton = (
    <button
      type="button"
      className={clases}
      disabled={disabled}
      title={disabled && motivoAlPasar ? motivo : undefined}
      {...resto}
    >
      {children}
    </button>
  );
  if (!disabled || !motivo || motivoAlPasar) return boton;
  return (
    <span className="wg-fila">
      {boton}
      <span className="wg-motivo">{motivo}</span>
    </span>
  );
}
