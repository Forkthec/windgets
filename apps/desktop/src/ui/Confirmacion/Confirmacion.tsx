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
  /** RD-72: la acción principal destruye algo («Eliminar», M-06 a M-10): va en rojo. */
  destructiva?: boolean;
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
  destructiva = false,
}: ConfirmacionProps) {
  // docs/rediseno.md RD-34: sin título visible y la pregunta arriba. RD-72 (D-23, reemplaza RD-34 en ese punto): las
  // opciones abajo a la derecha, primero la de salir y al final, a la derecha, la principal.
  return (
    <VentanaEmergente
      titulo={titulo}
      alSalir={alCancelar}
      clase="wg-confirmacion"
      tituloOculto
      acciones={
        <>
          <Boton onClick={alCancelar}>{opcionSalir}</Boton>
          {opcionSecundaria && <Boton onClick={alElegirSecundaria}>{opcionSecundaria}</Boton>}
          <Boton principal className={destructiva ? 'wg-boton--peligro' : undefined} onClick={alConfirmar}>
            {opcionPrincipal}
          </Boton>
        </>
      }
    >
      <p className="wg-confirmacion__pregunta">{texto}</p>
    </VentanaEmergente>
  );
}
