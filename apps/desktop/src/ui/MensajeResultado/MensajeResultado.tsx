import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export const DURACION_RESULTADO_MS = 4000; // RNF-27: se oculta a los 4 s

export interface MensajeResultadoProps {
  texto: string;
  alOcultar: () => void;
}

// Esquina inferior derecha, sin bloquear la pantalla; «×» lo cierra antes (RT-04-ET01 a ET03).
export function MensajeResultado({ texto, alOcultar }: MensajeResultadoProps) {
  // El temporizador no se reinicia si la pantalla vuelve a dibujarse con otra función `alOcultar`.
  const ocultar = useRef(alOcultar);
  useEffect(() => {
    ocultar.current = alOcultar;
  }, [alOcultar]);
  useEffect(() => {
    const t = setTimeout(() => ocultar.current(), DURACION_RESULTADO_MS);
    return () => clearTimeout(t);
  }, [texto]);
  return (
    <div className="wg-resultado wg-fila" role="status">
      <span>{texto}</span>
      <button type="button" className="wg-boton" aria-label="Cerrar mensaje" onClick={alOcultar}>
        ×
      </button>
    </div>
  );
}

type Mostrar = (texto: string) => void;

const ContextoDeResultado = createContext<Mostrar | null>(null);

/**
 * Aloja el mensaje de resultado de la ventana principal (C-01): uno a la vez, el más reciente.
 * El texto lo define cada HU; los comandos lo traen en `Ok.result_message` (contratos.md, 1.3).
 */
export function ProveedorDeResultado({ children }: { children: ReactNode }) {
  const [mensaje, setMensaje] = useState<{ id: number; texto: string } | null>(null);
  const siguiente = useRef(0);
  const mostrar = useCallback<Mostrar>((texto) => {
    siguiente.current += 1;
    setMensaje({ id: siguiente.current, texto });
  }, []);
  const ocultar = useCallback(() => setMensaje(null), []);
  return (
    <ContextoDeResultado.Provider value={mostrar}>
      {children}
      {mensaje && <MensajeResultado key={mensaje.id} texto={mensaje.texto} alOcultar={ocultar} />}
    </ContextoDeResultado.Provider>
  );
}

/** Muestra un mensaje de resultado (RT-04). Requiere `ProveedorDeResultado`. */
export function useMensajeDeResultado(): Mostrar {
  const mostrar = useContext(ContextoDeResultado);
  if (!mostrar) throw new Error('useMensajeDeResultado necesita ProveedorDeResultado');
  return mostrar;
}
