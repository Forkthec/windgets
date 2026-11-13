import type { ReactNode } from 'react';

export interface EstadoVacioProps {
  /** El texto lo define la HU (RT-04-ET19). */
  texto: string;
  /** Opción que la HU pone junto al texto, por ejemplo «Nueva etiqueta» (RT-04-CA10). */
  accion?: ReactNode;
}

// Ocupa el lugar del contenido vacío; no muestra errores ni ceros (RT-04-ET19).
export function EstadoVacio({ texto, accion }: EstadoVacioProps) {
  return (
    <div className="wg-vacio">
      <p>{texto}</p>
      {accion}
    </div>
  );
}
