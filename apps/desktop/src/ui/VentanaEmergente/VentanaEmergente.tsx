import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface VentanaEmergenteProps {
  titulo: string;
  children: ReactNode;
  /** «Cerrar» o «Cancelar»; también lo ejecuta la tecla Esc (RT-02-ET05). */
  alSalir: () => void;
  acciones?: ReactNode;
}

/** Avisa a la ventana principal que hay una ventana emergente abierta, para bloquear el fondo (RT-02-ET08). */
export const ContextoDeBloqueo = createContext<((abierta: boolean) => void) | null>(null);

// Se abre sobre la pantalla actual, que sigue visible de fondo (RT-02-ET02): la capa de fondo no tiene color
// (sin transparencias apiladas, interfaz.md) pero recibe la selección, así que la pantalla de fondo y el menú
// principal no responden (ET08). Se dibuja fuera de la pantalla para que el bloqueo no la alcance.
export function VentanaEmergente({ titulo, children, alSalir, acciones }: VentanaEmergenteProps) {
  const ventana = useRef<HTMLDivElement>(null);
  const salir = useRef(alSalir);
  const bloquear = useContext(ContextoDeBloqueo);
  useEffect(() => {
    salir.current = alSalir;
  }, [alSalir]);
  useEffect(() => {
    bloquear?.(true);
    return () => bloquear?.(false);
  }, [bloquear]);
  useEffect(() => {
    ventana.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') salir.current();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, []);
  return createPortal(
    <div className="wg-fondo-emergente">
      <div
        ref={ventana}
        className="wg-emergente"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
      >
        <h2>{titulo}</h2>
        {children}
        {acciones && <div className="wg-fila wg-emergente__acciones">{acciones}</div>}
      </div>
    </div>,
    document.body,
  );
}
