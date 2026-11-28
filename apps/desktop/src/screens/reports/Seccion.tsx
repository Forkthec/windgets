import type { ReactNode } from 'react';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { Esqueleto, useEsqueleto } from '@/ui/Esqueleto/Esqueleto';

// Una sección del reporte (HE-13-HU02-ET01, D-060): su título se ve de inmediato y su contenido apenas termina su
// cálculo, sin esperar a las demás (ET16). Sin tarjetas que evaluar, el estado vacío en lugar del contenido (regla de
// vacío, ET10, ET11). Mientras calcula (ET15), el esqueleto de carga (ANIMACIONES.md A-32, docs/rediseno.md RD-110):
// solo si el cálculo pasa de 200 ms, y entonces al menos 300 ms. La sección queda `aria-busy` desde el principio.

export const SIN_DATOS = 'No hay datos para este rango de fechas y estos filtros.';

export interface SeccionProps {
  titulo: string;
  /** `null` mientras se calcula. */
  vacia: boolean | null;
  children?: ReactNode;
}

export function Seccion({ titulo, vacia, children }: SeccionProps) {
  const esqueleto = useEsqueleto(vacia === null);
  let contenido: ReactNode;
  if (esqueleto) contenido = <Esqueleto />;
  else if (vacia === null) contenido = null;
  else if (vacia) contenido = <EstadoVacio texto={SIN_DATOS} />;
  else contenido = children;
  return (
    <section className="wg-seccion" aria-label={titulo} aria-busy={vacia === null || esqueleto}>
      <h2>{titulo}</h2>
      {contenido}
    </section>
  );
}
