import { useEffect } from 'react';

export const DURACION_RESULTADO_MS = 4000; // RNF-27: se oculta a los 4 s

export interface MensajeResultadoProps {
  texto: string;
  alOcultar: () => void;
}

// Esquina inferior derecha, sin bloquear la pantalla; «×» lo cierra antes (RT-04).
export function MensajeResultado({ texto, alOcultar }: MensajeResultadoProps) {
  useEffect(() => {
    const t = setTimeout(alOcultar, DURACION_RESULTADO_MS);
    return () => clearTimeout(t);
  }, [texto, alOcultar]);
  return (
    <div className="wg-resultado wg-fila" role="status">
      <span>{texto}</span>
      <button type="button" className="wg-boton" aria-label="Cerrar mensaje" onClick={alOcultar}>
        ×
      </button>
    </div>
  );
}
