// Los ojos de Windi (docs/rediseno_final_prototipos.md §4.3; rediseno_final_backend.md §5.5, D-07; docs/rediseno.md
// RD-70): dos óvalos del color de acción del tema (`currentColor`), sin la ilustración de Windi. Parpadean mientras
// Windi responde («Escribiendo…»); con «reducir movimiento» no parpadean.
export interface OjosDeWindiProps {
  /** Lado en px. */
  tamano: number;
  parpadeando?: boolean;
  className?: string;
}

export function OjosDeWindi({ tamano, parpadeando = false, className = '' }: OjosDeWindiProps) {
  return (
    <svg
      className={`wg-ojos-de-windi${parpadeando ? ' wg-ojos-de-windi--parpadeando' : ''} ${className}`.trim()}
      width={tamano}
      height={tamano}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <ellipse className="wg-ojos-de-windi__ojo" cx="13" cy="20" rx="5" ry="8" fill="currentColor" />
      <ellipse className="wg-ojos-de-windi__ojo" cx="27" cy="20" rx="5" ry="8" fill="currentColor" />
    </svg>
  );
}
