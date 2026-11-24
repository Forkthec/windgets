import { useCallback, useState, type ReactNode } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import textos from '@/types/messages.es.json';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';

// HE-16-HU03 (cerrar sesión): M-11 o, con cambios sin sincronizar, M-12 (ET01, ET02, ET05). Lo usan Configuración y,
// desde rediseno_final_backend.md §4.2 (P09), el ícono al pie del menú lateral: el mismo flujo, sin cambio de
// contrato.

/** La confirmación abierta: M-11 sin cambios pendientes, M-12 con cambios pendientes. */
type Confirmar = 'M-11' | 'M-12' | null;

export interface CerrarSesionProps {
  /** El control que abre la confirmación; recibe la función que la abre y si ya se está abriendo. */
  disparador: (abrir: () => void, enCurso: boolean) => ReactNode;
  /** CA07, ET09: el token no se pudo borrar; la sesión sigue iniciada. */
  alFallar: (mensaje: string) => void;
}

export function CerrarSesion({ disparador, alFallar }: CerrarSesionProps) {
  const { invocar } = useNucleo();
  const { sesionCerrada } = useNavegacion();
  const mostrar = useMensajeDeResultado();
  const [confirmar, setConfirmar] = useState<Confirmar>(null);

  // IPC-AUTH-13: si hay cambios pendientes, la vista muestra el aviso de CA03 (M-12).
  const pedirCierre = useCallback(async () => {
    const r = await invocar('auth_get_sign_out_info', {});
    setConfirmar(r.ok && r.value.pending_count > 0 ? 'M-12' : 'M-11');
  }, [invocar]);
  const abrir = useEnvioUnico(pedirCierre);

  // IPC-AUTH-14: el Núcleo cierra la sesión y oculta el wallpaper; la ventana abre Inicio de sesión y muestra
  // «Sesión cerrada.» (CA01, CA04, ET06). Si no pudo borrar el token, la sesión sigue iniciada (CA07, ET09).
  const cerrar = useCallback(async () => {
    const r = await invocar('auth_sign_out', {});
    setConfirmar(null);
    if (!r.ok) {
      alFallar(r.error.message || textos.NO_PUDIMOS_CERRAR_LA_SESION);
      return;
    }
    sesionCerrada();
    mostrar(r.result_message?.message ?? textos.SESION_CERRADA);
  }, [alFallar, invocar, mostrar, sesionCerrada]);
  const { ejecutar } = useEnvioUnico(cerrar);

  return (
    <>
      {disparador(() => void abrir.ejecutar(), abrir.enCurso)}
      {confirmar && (
        // DUDA: HE-16-HU03 el título de M-11 y M-12 no está definido; se usa «Cerrar sesión».
        <Confirmacion
          titulo="Cerrar sesión"
          texto={
            confirmar === 'M-12'
              ? textos.CAMBIOS_SIN_SINCRONIZAR_AL_CERRAR_SESION
              : textos.DESEAS_CERRAR_SESION
          }
          opcionPrincipal={confirmar === 'M-12' ? 'Confirmar' : 'Cerrar sesión'}
          alConfirmar={() => void ejecutar()}
          // CA02: «Cancelar» cierra el mensaje y la sesión sigue iniciada.
          alCancelar={() => setConfirmar(null)}
        />
      )}
    </>
  );
}
