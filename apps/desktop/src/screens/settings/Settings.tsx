import { useCallback, useEffect, useState } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import textos from '@/types/messages.es.json';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { Interruptor } from '@/ui/Interruptor/Interruptor';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';

// P-CFG-01 Configuración (Menú principal > Configuración).
// - HE-16-HU02 (inicio automático): el interruptor muestra siempre el estado que tiene Windows (ET06) y al
//   alternarlo muestra el resultado o el aviso de CA05.
// - HE-16-HU03 (cerrar sesión): el botón «Cerrar sesión» abre M-11 o, con cambios sin sincronizar, M-12 (ET01, ET02,
//   ET05).
// - HE-16-HU01 (indicador de sincronización): es el de la ventana principal, junto al menú (D-203).

/** La confirmación abierta: M-11 sin cambios pendientes, M-12 con cambios pendientes. */
type Confirmar = 'M-11' | 'M-12' | null;

export function Settings() {
  const { invocar } = useNucleo();
  const { sesionCerrada } = useNavegacion();
  const mostrar = useMensajeDeResultado();
  const [confirmar, setConfirmar] = useState<Confirmar>(null);
  const [inicio, setInicio] = useState<boolean | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // IPC-DESK-10: el estado real de Windows, al abrir la pantalla (CA03).
  const leerInicio = useCallback(async () => {
    const r = await invocar('autostart_get', {});
    if (r.ok) setInicio(r.value.enabled);
  }, [invocar]);
  // Al volver a la ventana se lee de nuevo: la persona pudo cambiarlo en las aplicaciones de arranque de Windows.
  useEffect(() => {
    void leerInicio();
    const alVolver = () => void leerInicio();
    window.addEventListener('focus', alVolver);
    return () => window.removeEventListener('focus', alVolver);
  }, [leerInicio]);

  // IPC-DESK-11: guarda la preferencia en Windows (ET03). Con `autostart.failed` el interruptor vuelve al estado que
  // tiene Windows y se ve el aviso (CA05, ET09).
  const alternarInicio = useCallback(
    async (enabled: boolean) => {
      const r = await invocar('autostart_set', { enabled });
      if (r.ok) {
        setAviso(null);
        setInicio(r.value.enabled);
        if (r.result_message) mostrar(r.result_message.message);
        return;
      }
      setAviso(r.error.message || textos.NO_PUDIMOS_CAMBIAR_EL_INICIO_AUTOMATICO);
      await leerInicio();
    },
    [invocar, leerInicio, mostrar],
  );
  const cambiarInicio = useEnvioUnico(alternarInicio);

  // IPC-AUTH-13: si hay cambios pendientes, la vista muestra el aviso de CA03 (M-12).
  const pedirCierre = useCallback(async () => {
    const r = await invocar('auth_get_sign_out_info', {});
    setConfirmar(r.ok && r.value.pending_count > 0 ? 'M-12' : 'M-11');
  }, [invocar]);
  const abrir = useEnvioUnico(pedirCierre);

  // IPC-AUTH-14: el Núcleo cierra la sesión y oculta el wallpaper; la ventana abre Inicio de sesión y muestra
  // «Sesión cerrada.» (CA01, CA04, ET06).
  const cerrar = useCallback(async () => {
    const r = await invocar('auth_sign_out', {});
    if (!r.ok) return;
    setConfirmar(null);
    sesionCerrada();
    mostrar(r.result_message?.message ?? textos.SESION_CERRADA);
  }, [invocar, mostrar, sesionCerrada]);
  const { ejecutar } = useEnvioUnico(cerrar);

  return (
    <main aria-label="Configuración" aria-busy={inicio === null}>
      {aviso && <Aviso texto={aviso} />}
      {/* ET01 (HE-16-HU02): el interruptor «Inicio automático». */}
      {inicio !== null && (
        <Interruptor
          etiqueta="Inicio automático"
          activo={inicio}
          deshabilitado={cambiarInicio.enCurso}
          alCambiar={(activo) => void cambiarInicio.ejecutar(activo)}
        />
      )}
      <Boton disabled={abrir.enCurso} onClick={() => void abrir.ejecutar()}>
        Cerrar sesión
      </Boton>
      {confirmar && (
        // DUDA: HE-16-HU03 el título de M-11 y M-12 no está definido; se usa «Cerrar sesión».
        <Confirmacion
          titulo="Cerrar sesión"
          texto={
            confirmar === 'M-12'
              ? textos.CAMBIOS_SIN_SINCRONIZAR_AL_CERRAR_SESION
              : textos.DESEAS_CERRAR_SESION
          }
          opcionPrincipal="Cerrar sesión"
          alConfirmar={() => void ejecutar()}
          // CA02: «Cancelar» cierra el mensaje y la sesión sigue iniciada.
          alCancelar={() => setConfirmar(null)}
        />
      )}
    </main>
  );
}
