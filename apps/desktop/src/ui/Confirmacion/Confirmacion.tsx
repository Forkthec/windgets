import { Boton } from '@/ui/Boton/Boton';
import { VentanaEmergente } from '@/ui/VentanaEmergente/VentanaEmergente';

export interface ConfirmacionProps {
  titulo: string;
  texto: string;
  /** La opción principal; en M-06 a M-10 y M-12 a M-14, «Confirmar» (docs/rediseno.md RD-34). */
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
  // docs/rediseno.md RD-34 (Figma 85:2 «M-01 · Claro», 85:8 «M-01 · Oscuro»): sin título visible, la pregunta
  // arriba y las opciones abajo a la izquierda, primero la principal y al final la de salir.
  return (
    <VentanaEmergente
      titulo={titulo}
      alSalir={alCancelar}
      clase="wg-confirmacion"
      tituloOculto
      acciones={
        <>
          <Boton principal onClick={alConfirmar}>
            {opcionPrincipal}
          </Boton>
          {opcionSecundaria && <Boton onClick={alElegirSecundaria}>{opcionSecundaria}</Boton>}
          <Boton onClick={alCancelar}>{opcionSalir}</Boton>
        </>
      }
    >
      <p className="wg-confirmacion__pregunta">{texto}</p>
    </VentanaEmergente>
  );
}
