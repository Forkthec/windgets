import type { ReactNode } from 'react';

// Navegación de fechas (docs/rediseno_final_prototipos.md §3.6, §6.3 y §6.4; docs/rediseno.md RD-76): arriba, el
// título (que puede abrir un selector), las flechas ‹ › con su nombre accesible y su tooltip, y «Ir a hoy» como un
// ícono de calendario con el número del día actual.

export interface NavegacionDeFechaProps {
  /** El título o el botón que abre el selector de mes y año o el mini calendario. */
  titulo: ReactNode;
  anterior: string;
  siguiente: string;
  alAnterior: () => void;
  alSiguiente: () => void;
  alIrAHoy: () => void;
  /** El número del día de hoy, que se ve dentro del ícono. */
  diaDeHoy: number;
  /** Lo que va a la derecha (por ejemplo, Mes | Semana). */
  derecha?: ReactNode;
}

function Flecha({ izquierda }: { izquierda: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={izquierda ? 'M11.25 3.6L5.85 9L11.25 14.4' : 'M6.75 3.6L12.15 9L6.75 14.4'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavegacionDeFecha({
  titulo,
  anterior,
  siguiente,
  alAnterior,
  alSiguiente,
  alIrAHoy,
  diaDeHoy,
  derecha,
}: NavegacionDeFechaProps) {
  return (
    <div className="wg-navegacion-fecha">
      <div className="wg-navegacion-fecha__titulo">{titulo}</div>
      <button
        type="button"
        className="wg-icono-boton"
        aria-label={anterior}
        title={anterior}
        onClick={alAnterior}
      >
        <Flecha izquierda />
      </button>
      <button
        type="button"
        className="wg-icono-boton"
        aria-label={siguiente}
        title={siguiente}
        onClick={alSiguiente}
      >
        <Flecha izquierda={false} />
      </button>
      <button
        type="button"
        className="wg-icono-boton wg-navegacion-fecha__hoy"
        aria-label="Ir a hoy"
        title="Ir a hoy"
        onClick={alIrAHoy}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M3 6H19V19H3V6ZM3 9.5H19M7 3V6M15 3V6" stroke="currentColor" strokeWidth="1.4" />
          <text x="11" y="17.2" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="currentColor">
            {diaDeHoy}
          </text>
        </svg>
      </button>
      {derecha && <div className="wg-navegacion-fecha__derecha">{derecha}</div>}
    </div>
  );
}
