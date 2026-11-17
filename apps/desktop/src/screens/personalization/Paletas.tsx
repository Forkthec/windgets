import type { CatalogItem } from '@/types';

// Sección «Paletas» de Personalización del wallpaper (HE-02-HU07-ET01): el catálogo de paletas con el nombre y
// los tres colores de cada una, y la paleta del tema en edición marcada o el texto «Personalizada».

export interface PaletasProps {
  paletas: CatalogItem[];
  /** La paleta del tema en edición; `null` si los colores no son los de una paleta (ET03). */
  actual: string | null;
  alElegir: (id: string) => void;
}

export function Paletas({ paletas, actual, alElegir }: PaletasProps) {
  return (
    <>
      {actual === null && <p>Personalizada</p>}
      <ul className="wg-lista" aria-label="Catálogo de paletas">
        {paletas.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className="wg-fila"
              aria-pressed={p.id === actual}
              onClick={() => alElegir(p.id)}
            >
              <span>{p.name}</span>
              {[p.color_primary, p.color_secondary, p.color_text].map((color, i) => (
                <span
                  key={i}
                  className="wg-muestra-color"
                  aria-hidden="true"
                  style={{ background: color ?? '' }}
                />
              ))}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
