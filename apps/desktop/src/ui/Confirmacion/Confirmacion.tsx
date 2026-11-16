import { Boton } from '@/ui/Boton/Boton';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';

export interface ConfirmacionProps {
  titulo: string;
  texto: string;
  /** Verbo de la acción, por ejemplo «Eliminar» (RT-04). */
  opcionPrincipal: string;
  /** «Cancelar», salvo en el instalador («Seguir instalando», D-149). */
  opcionSalir?: string;
  /** Una segunda acción, entre la de salir y la principal (por ejemplo «Aplicar sin guardar», M-15). */
  opcionSecundaria?: string;
  alConfirmar: () => void;
  alElegirSecundaria?: () => void;
  alCancelar: () => void;
}

export function Confirmacion({
  titulo,
  texto,
  opcionPrincipal,
  opcionSalir = 'Cancelar',
  opcionSecundaria,
  alConfirmar,
  alElegirSecundaria,
  alCancelar,
}: ConfirmacionProps) {
  return (
    <VentanaEmergente
      titulo={titulo}
      alSalir={alCancelar}
      acciones={
        <>
          <Boton onClick={alCancelar}>{opcionSalir}</Boton>
          {opcionSecundaria && <Boton onClick={alElegirSecundaria}>{opcionSecundaria}</Boton>}
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
