import type { ReactNode } from 'react';

export interface HipervinculoProps {
  children: ReactNode;
  alSeleccionar: () => void;
  deshabilitado?: boolean;
}

/** Hipervínculo de las pantallas de cuenta: navega dentro de la aplicación, sin abrir el navegador. */
export function Hipervinculo({ children, alSeleccionar, deshabilitado = false }: HipervinculoProps) {
  return (
    <a
      href="#"
      className="wg-enlace"
      aria-disabled={deshabilitado || undefined}
      onClick={(e) => {
        e.preventDefault();
        if (!deshabilitado) alSeleccionar();
      }}
    >
      {children}
    </a>
  );
}
