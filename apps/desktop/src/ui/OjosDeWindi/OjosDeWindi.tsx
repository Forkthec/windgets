// Los ojos de Windi (docs/implementacion/SPEC_Marco_y_componentes_base.md MB-27, pieza C3-05): los ojos del dibujo de
// Windi de 48×48 del Figma (`2004:334`), en sus mismas coordenadas, para que el dibujo (`DibujoDeWindi`) los ponga
// encima de la cara. Color fijo #27152B en todos los temas (D2/C7; reemplaza el color de acción de RD-70).
// Estados (F0b §3): en reposo, dos óvalos en la caja (14, 23.5) de 18,5×4,5; escribiendo, 2 px a la derecha; sin
// conexión o con error, cerrados (dos arcos de trazo 1,2). Parpadean mientras Windi responde (A-22); con «reducir
// movimiento» no parpadean.
export type EstadoDeLosOjos = 'reposo' | 'escribiendo' | 'cerrados';

export interface OjosDeWindiProps {
  /** Lado en px del dibujo de 48 en el que van los ojos. */
  tamano: number;
  estado?: EstadoDeLosOjos;
  parpadeando?: boolean;
  className?: string;
}

/** Color fijo de los ojos y la boca de Windi (D2/C7). */
export const COLOR_DE_LOS_OJOS = '#27152B';

export function OjosDeWindi({
  tamano,
  estado = 'reposo',
  parpadeando = false,
  className = '',
}: OjosDeWindiProps) {
  const clases = [
    'wg-ojos-de-windi',
    estado === 'escribiendo' && 'wg-ojos-de-windi--escribiendo',
    estado !== 'cerrados' && parpadeando && 'wg-ojos-de-windi--parpadeando',
    className,
  ].filter(Boolean);
  return (
    <svg
      className={clases.join(' ')}
      data-testid="windi-ojos"
      data-estado={estado}
      width={tamano}
      height={tamano}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      {estado === 'cerrados' ? (
        <g fill="none" stroke={COLOR_DE_LOS_OJOS} strokeWidth="1.2" strokeLinecap="round">
          <path
            className="wg-ojos-de-windi__cerrado"
            d="M14.1575 26.1524C14.8451 27.8015 16.2201 27.8015 16.9076 26.1524"
          />
          <path
            className="wg-ojos-de-windi__cerrado"
            d="M29.6758 24.8697C30.3633 26.5189 31.7384 26.5189 32.4259 24.8697"
          />
        </g>
      ) : (
        <g transform={estado === 'escribiendo' ? 'translate(2 0)' : undefined} fill={COLOR_DE_LOS_OJOS}>
          <ellipse className="wg-ojos-de-windi__ojo" cx="15.5326" cy="26.6471" rx="1.375" ry="1.6491" />
          <ellipse className="wg-ojos-de-windi__ojo" cx="31.0509" cy="25.3645" rx="1.375" ry="1.6491" />
        </g>
      )}
    </svg>
  );
}
