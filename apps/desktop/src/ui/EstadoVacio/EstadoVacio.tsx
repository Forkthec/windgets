export interface EstadoVacioProps {
  /** El texto lo define la HU (RT-04). */
  texto: string;
}

export function EstadoVacio({ texto }: EstadoVacioProps) {
  return <div className="wg-vacio">{texto}</div>;
}
