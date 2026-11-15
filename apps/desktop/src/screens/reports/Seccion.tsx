import type { ReactNode } from 'react';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';

// Una sección del reporte (HE-13-HU02-ET01, D-060): su título se ve de inmediato con un indicador de carga
// (ET15) y su contenido apenas termina su cálculo, sin esperar a las demás (ET16). Sin tarjetas que evaluar,
// el estado vacío en lugar del contenido (regla de vacío, ET10, ET11).

export const SIN_DATOS = 'No hay datos para este rango de fechas y estos filtros.';

export interface SeccionProps {
  titulo: string;
  /** `null` mientras se calcula. */
  vacia: boolean | null;
  children?: ReactNode;
}

export function Seccion({ titulo, vacia, children }: SeccionProps) {
  return (
    <section className="wg-seccion" aria-label={titulo} aria-busy={vacia === null}>
      <h2>{titulo}</h2>
      {/* DUDA: HE-13-HU02 el indicador de carga no tiene texto definido; se usa uno sin texto visible. */}
      {vacia === null ? (
        <span className="wg-cargando" role="status" aria-label="Cargando" />
      ) : vacia ? (
        <EstadoVacio texto={SIN_DATOS} />
      ) : (
        children
      )}
    </section>
  );
}
