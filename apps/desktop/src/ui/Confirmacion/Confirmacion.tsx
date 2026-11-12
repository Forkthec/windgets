import { Boton } from '@/ui/Boton/Boton';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';

export interface ConfirmacionProps {
  titulo: string;
  texto: string;
  /** Verbo de la acción, por ejemplo «Eliminar» (RT-04). */
  opcionPrincipal: string;
  /** «Cancelar», salvo en el instalador («Seguir instalando», D-149). */
  opcionSalir?: string;
  alConfirmar: () => void;
  alCancelar: () => void;
}

export function Confirmacion({
  titulo,
  texto,
  opcionPrincipal,
  opcionSalir = 'Cancelar',
  alConfirmar,
  alCancelar,
}: ConfirmacionProps) {
  return (
    <VentanaEmergente
      titulo={titulo}
      alSalir={alCancelar}
      acciones={
        <>
          <Boton onClick={alCancelar}>{opcionSalir}</Boton>
          <Boton principal onClick={alConfirmar}>
            {opcionPrincipal}
          </Boton>
        </>
      }
    >
      <p>{texto}</p>
    </VentanaEmergente>
  );
}
