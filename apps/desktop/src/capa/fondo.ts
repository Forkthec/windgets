import type { CSSProperties } from 'react';
import type { Monitor, WallpaperFit, WallpaperMonitorFit } from '@/types';

// HE-02-HU14 (P29) · La imagen de fondo en cada monitor con su ajuste, como en Windows. La capa cubre el escritorio
// virtual; cada monitor pinta su propio rectángulo con la imagen. Extender (`span`) es una sola imagen sobre todo el
// escritorio virtual, como pintaba la capa antes de P29.

/** Cómo se dibuja la imagen en un monitor con cada ajuste. */
export const ESTILO_DEL_AJUSTE: Record<Exclude<WallpaperFit, 'span'>, CSSProperties> = {
  // Rellenar: cubre el monitor sin deformarse; recorta lo que sobra.
  fill: { backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
  // Ajustar: la imagen entera, sin deformarse; el resto del monitor queda con el color principal del tema.
  fit: { backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
  // Expandir: ocupa todo el monitor aunque se deforme.
  stretch: { backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' },
  // Mosaico: la imagen a su tamaño, repetida desde la esquina superior izquierda.
  tile: { backgroundSize: 'auto', backgroundPosition: 'left top', backgroundRepeat: 'repeat' },
  // Centrar: la imagen a su tamaño, en el centro.
  center: { backgroundSize: 'auto', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' },
};

export interface FondoDeMonitor {
  monitor_id: string;
  estilo: CSSProperties;
}

/**
 * El fondo de cada monitor, en píxeles de la capa (físicos divididos por la escala, como los widgets; HE-05-HU02-ET07).
 * `null` si se extiende una sola imagen sobre todos los monitores o si no hay monitores. Un monitor sin ajuste es
 * Rellenar (CA01).
 */
export function fondosPorMonitor(
  monitores: readonly Monitor[],
  ajustes: readonly WallpaperMonitorFit[],
  escala: number,
): FondoDeMonitor[] | null {
  if (monitores.length === 0) return null;
  const principal = ajustes.find((a) => a.is_primary);
  if (principal?.fit === 'span') return null;
  const e = escala > 0 ? escala : 1;
  // La capa empieza en la esquina superior izquierda del escritorio virtual.
  const origen = { x: Math.min(...monitores.map((m) => m.x)), y: Math.min(...monitores.map((m) => m.y)) };
  return monitores.map((m) => {
    const fit = ajustes.find((a) => a.monitor_id === m.id)?.fit ?? 'fill';
    return {
      monitor_id: m.id,
      estilo: {
        position: 'absolute',
        left: (m.x - origen.x) / e,
        top: (m.y - origen.y) / e,
        width: m.width / e,
        height: m.height / e,
        ...ESTILO_DEL_AJUSTE[fit === 'span' ? 'fill' : fit],
      },
    };
  });
}
