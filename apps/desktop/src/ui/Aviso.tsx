export interface AvisoProps {
  /** Qué ocurrió y qué puede hacer el usuario (RT-04). El texto lo define la HU. */
  texto: string;
}

// Arriba de la pantalla, sección, widget o paso afectado; no bloquea el resto de la aplicación.
export function Aviso({ texto }: AvisoProps) {
  return (
    <div className="wg-aviso" role="alert">
      {texto}
    </div>
  );
}
