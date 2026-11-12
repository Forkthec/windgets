import { useEffect, useRef, type ReactNode } from 'react';

export interface VentanaEmergenteProps {
  titulo: string;
  children: ReactNode;
  /** «Cerrar» o «Cancelar»; también lo ejecuta la tecla Esc (RT-02). */
  alSalir: () => void;
  acciones?: ReactNode;
}

// Se abre sobre la pantalla actual; mientras está abierta, el fondo no responde a la selección (RT-02).
export function VentanaEmergente({ titulo, children, alSalir, acciones }: VentanaEmergenteProps) {
  const ventana = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ventana.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alSalir();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [alSalir]);
  return (
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
    </div>
  );
}
