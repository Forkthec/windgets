import { useCallback, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { useMensajesDeCampo } from '@/reglas/formulario';
import type { AppError } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { MarcoDeCuenta } from '../cuenta/MarcoDeCuenta';
import { validarCorreo } from '../cuenta/validaciones';
import { DiligenciarCodigo } from './DiligenciarCodigo';
import { NuevaContrasena } from './NuevaContrasena';
import { PasoDeRecuperacion } from './PasoDeRecuperacion';

// P-CTA-03 Recuperar contraseña (HE-01-HU06 a HU08). Tres pasos en este orden: Correo electrónico, Diligenciar
// código y Nueva contraseña (HE-01-HU06-ET02). En todos, la miga de pan «Inicio de sesión > Recuperar
// contraseña» y «Regresar» (ET03, RT-03).

type Paso = 'correo' | 'codigo' | 'nueva';

const CAMPOS = ['email'] as const;
const VALIDADORES = { email: validarCorreo };

export function Recovery() {
  const { invocar } = useNucleo();
  const { abrirCuenta, correoDeCuenta } = useNavegacion();
  const { enLinea, sinConexion } = useConexion();
  const [paso, setPaso] = useState<Paso>('correo');
  // Desde Inicio de sesión, «¿Olvidaste tu contraseña?» llega con el correo diligenciado (HE-01-HU04-CA11).
  const [correo, setCorreo] = useState(correoDeCuenta);
  const [aviso, setAviso] = useState<string | null>(null);
  const [reenvioDisponible, setReenvioDisponible] = useState('');
  const campos = useMensajesDeCampo(CAMPOS, VALIDADORES);

  const fallo = useCallback(
    (error: AppError) => {
      if (error.field) campos.mostrarDelNucleo([error]);
      else if (error.code === 'net.offline') sinConexion();
      else if (error.message) setAviso(error.message);
    },
    [campos, sinConexion],
  );

  const enviar = useCallback(async () => {
    setAviso(null);
    if (!campos.validarTodo({ email: correo })) return;
    const r = await invocar('auth_recovery_request', { email: correo });
    if (!r.ok) return fallo(r.error);
    // CA01, CA02: el mismo aviso exista o no la cuenta (ET09), en el paso Diligenciar código.
    setAviso(r.result_message?.message ?? null);
    setReenvioDisponible(r.value.resend_available_at);
    setPaso('codigo');
  }, [campos, correo, fallo, invocar]);
  const envio = useEnvioUnico(enviar);

  const alVerificar = useCallback(() => {
    setAviso(null);
    setPaso('nueva');
  }, []);
  const regresarAlCorreo = useCallback(() => {
    setAviso(null);
    setPaso('correo');
  }, []);
  const regresarAlCodigo = useCallback(() => setPaso('codigo'), []);

  if (paso === 'nueva') {
    return (
      <MarcoDeCuenta nombre="Recuperar contraseña">
        {/* HE-01-HU07-CA01, HE-01-HU08: el paso Nueva contraseña; «Regresar» vuelve a Diligenciar código. */}
        <NuevaContrasena alRegresar={regresarAlCodigo} />
      </MarcoDeCuenta>
    );
  }

  if (paso === 'codigo') {
    return (
      <MarcoDeCuenta nombre="Recuperar contraseña">
        {/* HE-01-HU07-CA08, ET09: «Regresar» vuelve al paso Correo electrónico con el correo diligenciado.
            DUDA: HE-01-HU07 sin IPC para invalidar el código al regresar (ver docs/DUDAS.md). */}
        <DiligenciarCodigo
          reenvioDisponible={reenvioDisponible}
          avisoInicial={aviso}
          alVerificar={alVerificar}
          alRegresar={regresarAlCorreo}
        />
      </MarcoDeCuenta>
    );
  }

  return (
    <MarcoDeCuenta nombre="Recuperar contraseña">
      <PasoDeRecuperacion nombre="Correo electrónico" enLinea={enLinea} alRegresar={() => abrirCuenta('sign_in')}>
        <form
          className="wg-formulario"
          aria-label="Formulario"
          noValidate
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void envio.ejecutar();
          }}
        >
          {aviso && enLinea && <Aviso texto={aviso} />}
          <CampoTexto
            id={campos.ids.email}
            etiqueta="Correo electrónico"
            type="email"
            valor={correo}
            alCambiar={(valor) => {
              setCorreo(valor);
              campos.alCorregir('email', valor);
            }}
            mensaje={campos.mensajes.email}
          />
          {/* ET12: sin conexión, «Enviar código» se ve deshabilitado hasta que vuelva la conexión. */}
          <Boton principal type="submit" disabled={!enLinea || envio.enCurso}>
            Enviar código
          </Boton>
        </form>
      </PasoDeRecuperacion>
    </MarcoDeCuenta>
  );
}
