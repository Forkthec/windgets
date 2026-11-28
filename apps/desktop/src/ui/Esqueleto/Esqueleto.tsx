import { useEffect, useRef, useState } from 'react';

// Esqueleto de carga (docs/implementacion/ANIMACIONES.md A-32, regla 7; pieza AN-06). La forma sale del Figma
// (Reportes · Cargando, 217:16400): cinco barras `linea` de 16 de alto, de 324, 300, 276, 252 y 228 de ancho, con paso
// vertical de 54 y radio 6; las medidas están en tokens.css. Sin brillo ni pulso: entra con un fundido de opacidad.
// Anti-parpadeo (PROPUESTA de A-32): solo aparece si la carga dura más de 200 ms y, una vez visible, se queda al menos
// 300 ms. Si la carga termina antes, nunca se pinta.

/** Espera desde que empieza la carga hasta que el esqueleto aparece (A-32: `--dur-medio`). */
export const RETRASO_DEL_ESQUELETO = 200;
/** Tiempo mínimo que el esqueleto queda visible (A-32). */
export const PERMANENCIA_DEL_ESQUELETO = 300;

const BARRAS = 5;

/**
 * Si se ve el esqueleto mientras `cargando`. Pasa a `true` a los 200 ms de carga y vuelve a `false` cuando la carga
 * termina, pero no antes de 300 ms visible. Mientras devuelve `true`, el contenido espera.
 */
export function useEsqueleto(cargando: boolean): boolean {
  const [visible, setVisible] = useState(false);
  const desde = useRef<number | null>(null);

  useEffect(() => {
    if (cargando) {
      // Una carga nueva con el esqueleto ya visible lo deja como está.
      if (desde.current !== null) return undefined;
      const espera = setTimeout(() => {
        desde.current = Date.now();
        setVisible(true);
      }, RETRASO_DEL_ESQUELETO);
      return () => clearTimeout(espera);
    }
    if (desde.current === null) return undefined;
    const resta = PERMANENCIA_DEL_ESQUELETO - (Date.now() - desde.current);
    const espera = setTimeout(
      () => {
        desde.current = null;
        setVisible(false);
      },
      Math.max(0, resta),
    );
    return () => clearTimeout(espera);
  }, [cargando]);

  return visible;
}

/** Las barras del esqueleto. Tiene el mismo nombre accesible que el indicador de carga al que reemplaza. */
export function Esqueleto() {
  return (
    <div className="wg-esqueleto" role="status" aria-label="Cargando" data-testid="esqueleto">
      {Array.from({ length: BARRAS }, (_, i) => (
        <span key={i} className="wg-esqueleto__barra" />
      ))}
    </div>
  );
}
