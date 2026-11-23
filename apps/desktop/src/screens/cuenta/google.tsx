import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { Aviso } from '@/ui/Aviso/Aviso';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useApariencia } from './apariencia';
import { Hipervinculo } from './Hipervinculo';
import { TEXTOS } from './textos';
import { ERROR_INESPERADO } from './textosDelRediseno';

// «Continuar con Google» (HE-01-HU05), igual en Inicio de sesión y en Registro > paso Formulario (ET01, CA09).
// `auth_google_start` no lleva parámetros: no toma los datos del formulario (ET11). El resultado llega por
// EV-02 `auth_google_result`; con la sesión iniciada llega también EV-01 `session_changed` (RT-01-CA02).

/** CA08: el mensaje con «Regístrate» como hipervínculo que abre la pantalla Registro. */
function CorreoMuyLargo({ alRegistrarse }: { alRegistrarse: () => void }) {
  const [antes, despues] = TEXTOS.GOOGLE_CORREO_MUY_LARGO.split('Regístrate');
  return (
    <div className="wg-aviso" role="alert">
      {antes}
      <Hipervinculo alSeleccionar={alRegistrarse}>Regístrate</Hipervinculo>
      {despues}
    </div>
  );
}

export interface InicioConGoogle {
  /** Abre la página de Google en el navegador predeterminado (RNF-36). */
  continuar: () => Promise<void>;
  enCurso: boolean;
  /** El aviso del resultado (CA05, CA06, CA08), para la parte superior de la pantalla (RT-04). */
  aviso: ReactNode;
}

export function useInicioConGoogle(sinConexion: () => void): InicioConGoogle {
  const { invocar, escuchar } = useNucleo();
  const { abrirCuenta, sesionIniciada } = useNavegacion();
  const mostrarResultado = useMensajeDeResultado();
  const { modo } = useApariencia();
  const [aviso, setAviso] = useState<ReactNode>(null);

  useEffect(
    () =>
      escuchar('auth_google_result', (r) => {
        if (r.status === 'success') {
          // CA01, CA03, CA04: cuenta nueva con la bienvenida; CA02: cuenta existente, sin mensaje.
          if (r.is_new_account && r.message) mostrarResultado(r.message);
          // docs/rediseno.md RD-15: solo una cuenta nueva toma la paleta del modo en su primer tema.
          sesionIniciada(r.is_new_account ? { paleta: modo } : undefined);
        } else if (r.status === 'email_too_long') {
          setAviso(<CorreoMuyLargo alRegistrarse={() => abrirCuenta('register')} />);
        } else {
          setAviso(r.message);
        }
      }),
    [abrirCuenta, escuchar, modo, mostrarResultado, sesionIniciada],
  );

  const iniciar = useCallback(async () => {
    setAviso(null);
    const r = await invocar('auth_google_start', {});
    if (r.ok) return;
    // CA07, ET10: sin conexión el botón queda deshabilitado con el aviso de la pantalla.
    if (r.error.code === 'net.offline') sinConexion();
    else setAviso(r.error.message || ERROR_INESPERADO);
  }, [invocar, sinConexion]);
  const { ejecutar, enCurso } = useEnvioUnico(iniciar);

  return {
    continuar: ejecutar,
    enCurso,
    aviso: typeof aviso === 'string' ? <Aviso texto={aviso} /> : aviso,
  };
}
