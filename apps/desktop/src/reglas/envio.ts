import { useCallback, useRef, useState } from 'react';

/**
 * Envío de una acción con su botón deshabilitado mientras se procesa (RT-04-ET26): mientras la primera
 * solicitud no termina, una segunda selección no envía nada.
 */
export function useEnvioUnico<A extends unknown[], R>(accion: (...argumentos: A) => Promise<R>) {
  const [enCurso, setEnCurso] = useState(false);
  const ocupado = useRef(false);
  const ejecutar = useCallback(
    async (...argumentos: A): Promise<R | undefined> => {
      if (ocupado.current) return undefined;
      ocupado.current = true;
      setEnCurso(true);
      try {
        return await accion(...argumentos);
      } finally {
        ocupado.current = false;
        setEnCurso(false);
      }
    },
    [accion],
  );
  return { ejecutar, enCurso };
}
