import { useCallback } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import type { CardDetail } from '@/types';
import textos from '@/types/messages.es.json';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// M-08 Confirmación de eliminar una tarjeta (HE-07-HU05-ET01, ET02): ventana emergente sobre el Detalle de
// tarjeta (RT-02, RT-04). La tarjeta se elimina solo al confirmar (CA01).

export interface ConfirmarEliminacionProps {
  tarjeta: CardDetail;
  /** La tarjeta se eliminó: la pantalla cierra las ventanas y muestra el mensaje (CA02). */
  alEliminar: (mensaje: string) => void;
  /** «Cancelar»: cierra el mensaje y vuelve al detalle sin cambios (CA03). */
  alCancelar: () => void;
  /** La tarjeta ya no existe (DP-04). */
  alNoExistir: (mensaje: string) => void;
}

export function ConfirmarEliminacion({
  tarjeta,
  alEliminar,
  alCancelar,
  alNoExistir,
}: ConfirmarEliminacionProps) {
  const { invocar } = useNucleo();
  const eliminar = useCallback(async () => {
    const r = await invocar('card_delete', { id: tarjeta.id });
    if (r.ok) alEliminar(r.result_message?.message ?? textos.TARJETA_ELIMINADA);
    else if (r.error.code === 'card.not_found') alNoExistir(r.error.message);
  }, [alEliminar, alNoExistir, invocar, tarjeta.id]);
  const { ejecutar } = useEnvioUnico(eliminar);
  return (
    // DUDA: HE-07-HU05 el título de la ventana de confirmación no está definido; se usa «Eliminar».
    <Confirmacion
      titulo="Eliminar"
      destructiva
      texto={`¿Deseas eliminar la tarjeta “${tarjeta.title}”? Esta acción no se puede deshacer.`}
      opcionPrincipal="Confirmar"
      alConfirmar={() => void ejecutar()}
      alCancelar={alCancelar}
    />
  );
}
