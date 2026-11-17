import type { ReactNode } from 'react';
import type { CatalogItem, FontSize, ThemeContentFont } from '@/types';

// Sección «Tipografía» de Personalización del wallpaper (HE-02-HU06-ET01): el catálogo de tipografías, con el
// nombre de cada fuente escrito en esa fuente, los tamaños «Pequeño», «Mediano» y «Grande», y «Restablecer
// tipografía» (HE-02-HU08).

/** Los tamaños del texto (ET04), en este orden. */
const TAMANOS: ReadonlyArray<readonly [FontSize, string]> = [
  ['small', 'Pequeño'],
  ['medium', 'Mediano'],
  ['large', 'Grande'],
];

/** ET05: 14 px en «Pequeño», 16 px en «Mediano» y 20 px en «Grande». */
export const PIXELES_DEL_TAMANO: Record<FontSize, string> = { small: '14px', medium: '16px', large: '20px' };

/** La familia CSS de una fuente del catálogo (declarada en `ui/tema/tokens.css`). */
export const familia = (nombre: string): string => `'${nombre}', 'Segoe UI', sans-serif`;

export interface TipografiaProps {
  fuentes: CatalogItem[];
  tipografia: ThemeContentFont;
  alElegirFuente: (id: string) => void;
  alElegirTamano: (tamano: FontSize) => void;
  /** La opción «Restablecer tipografía» (HE-02-HU08). */
  restablecer: ReactNode;
}

export function Tipografia({
  fuentes,
  tipografia,
  alElegirFuente,
  alElegirTamano,
  restablecer,
}: TipografiaProps) {
  return (
    <>
      {/* ET03: solo el catálogo de tipografías. */}
      <ul className="wg-lista" aria-label="Catálogo de tipografías">
        {fuentes.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className="wg-fila"
              aria-pressed={f.id === tipografia.id}
              style={{ fontFamily: familia(f.name) }}
              onClick={() => alElegirFuente(f.id)}
            >
              {f.name}
            </button>
          </li>
        ))}
      </ul>
      <div className="wg-fila" role="group" aria-label="Tamaño">
        {TAMANOS.map(([tamano, nombre]) => (
          <button
            key={tamano}
            type="button"
            className="wg-boton"
            aria-pressed={tamano === tipografia.size}
            onClick={() => alElegirTamano(tamano)}
          >
            {nombre}
          </button>
        ))}
      </div>
      {restablecer}
    </>
  );
}
