import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { useMensajesDeCampo } from '@/reglas/formulario';
import type { AppError, AuthRegisterStartResult } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { useInicioConGoogle } from '../cuenta/google';
import { Hipervinculo } from '../cuenta/Hipervinculo';
import { Divisor } from '../cuenta/IndicadorDePasos';
import { MarcoDeCuenta } from '../cuenta/MarcoDeCuenta';
import {
  AYUDA_CONTRASENA,
  ERROR_INESPERADO,
  MAXIMO,
  PANTALLAS,
  PASOS_DE_REGISTRO,
} from '../cuenta/textosDelRediseno';
import { VerificarCorreo } from './VerificarCorreo';
import { TEXTOS } from '../cuenta/textos';
import { validarAlias, validarConfirmacion, validarContrasena, validarCorreo } from '../cuenta/validaciones';

// P-CTA-02 Registro (HE-01-HU01 a HU03): paso Formulario y paso Verificar correo (este con miga de pan, docs/rediseno.md RD-16).

const CAMPOS = ['alias', 'email', 'password', 'password_confirmation'] as const;
type Campo = (typeof CAMPOS)[number];
type Valores = Record<Campo, string>;

export function Register() {
  const { invocar } = useNucleo();
  const { abrirCuenta, correoDeCuenta } = useNavegacion();
  const mostrarResultado = useMensajeDeResultado();
  const { enLinea, sinConexion } = useConexion();
  // ET14: los campos vienen vacíos.
  const [valores, setValores] = useState<Valores>({
    alias: '',
    email: correoDeCuenta,
    password: '',
    password_confirmation: '',
  });
  const [envio, setEnvio] = useState<AuthRegisterStartResult | null>(null);
  const [registrado, setRegistrado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // Confirmar contraseña se compara con la contraseña diligenciada (HE-01-HU02-ET05).
  const validadores = useMemo(
    () => ({
      alias: validarAlias,
      email: validarCorreo,
      password: validarContrasena,
      password_confirmation: (valor: string) => validarConfirmacion(valores.password, valor),
    }),
    [valores.password],
  );
  const campos = useMensajesDeCampo(CAMPOS, validadores);
  // HE-01-HU05-CA09, ET11: el mismo inicio con Google, sin tomar los datos del formulario.
  const google = useInicioConGoogle(sinConexion);

  const cambiar = (campo: Campo) => (valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    campos.alCorregir(campo, valor);
    if (campo === 'email') setRegistrado(false);
  };

  const fallo = useCallback(
    (error: AppError) => {
      if (error.field) campos.mostrarDelNucleo([error]);
      else if (error.code === 'email.already_registered') setRegistrado(true);
      else if (error.code === 'net.offline') sinConexion();
      else setAviso(error.message || ERROR_INESPERADO);
    },
    [campos, sinConexion],
  );

  const crear = useCallback(async () => {
    setAviso(null);
    setRegistrado(false);
    if (!campos.validarTodo(valores)) return;
    const r = await invocar('auth_register_start', valores);
    if (!r.ok) return fallo(r.error);
    if (r.result_message) mostrarResultado(r.result_message.message);
    setEnvio(r.value);
  }, [campos, fallo, invocar, mostrarResultado, valores]);
  const { ejecutar, enCurso } = useEnvioUnico(crear);

  const correo = valores.email.trim();

  if (envio) {
    // HE-01-HU03-CA08: «Regresar» descarta el registro pendiente en el Núcleo y conserva lo diligenciado.
    const regresar = () => {
      void invocar('auth_register_cancel', {});
      setEnvio(null);
    };
    return (
      // docs/rediseno.md RD-16: Verificar correo va en la nota centrada, sin Windi ni indicador de pasos.
      <MarcoDeCuenta nombre="Registro">
        <VerificarCorreo reenvioDisponible={envio.resend_available_at} alRegresar={regresar} />
      </MarcoDeCuenta>
    );
  }

  return (
    <MarcoDeCuenta nombre="Registro" {...PANTALLAS.registro} pasos={{ lista: PASOS_DE_REGISTRO, actual: 0 }}>
      <form
        className="wg-formulario"
        aria-label="Formulario"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        {/* ET11: sin conexión, el aviso va en la parte superior del formulario. */}
        {!enLinea && <Aviso texto={TEXTOS.SIN_CONEXION_REGISTRO} />}
        {aviso && enLinea && <Aviso texto={aviso} />}
        {enLinea && google.aviso}
        {registrado && (
          <div className="wg-aviso" role="alert">
            {TEXTOS.CORREO_YA_REGISTRADO}{' '}
            <Hipervinculo alSeleccionar={() => abrirCuenta('sign_in', correo)}>Iniciar sesión</Hipervinculo>{' '}
            <Hipervinculo alSeleccionar={() => abrirCuenta('recovery', correo)}>
              Recuperar contraseña
            </Hipervinculo>
          </div>
        )}
        {/* docs/rediseno.md RD-10, RD-11: contadores, ayuda fija de la contraseña y marca de obligatorio. */}
        <CampoTexto
          id={campos.ids.alias}
          etiqueta="Alias"
          obligatorio
          maximo={MAXIMO.alias}
          valor={valores.alias}
          alCambiar={cambiar('alias')}
          mensaje={campos.mensajes.alias}
        />
        <CampoTexto
          id={campos.ids.email}
          etiqueta="Correo electrónico"
          type="email"
          obligatorio
          maximo={MAXIMO.correo}
          valor={valores.email}
          alCambiar={cambiar('email')}
          mensaje={campos.mensajes.email}
        />
        <CampoTexto
          id={campos.ids.password}
          etiqueta="Contraseña"
          type="password"
          obligatorio
          maximo={MAXIMO.contrasena}
          ayuda={AYUDA_CONTRASENA}
          valor={valores.password}
          alCambiar={cambiar('password')}
          mensaje={campos.mensajes.password}
        />
        <CampoTexto
          id={campos.ids.password_confirmation}
          etiqueta="Confirmar contraseña"
          type="password"
          obligatorio
          valor={valores.password_confirmation}
          alCambiar={cambiar('password_confirmation')}
          mensaje={campos.mensajes.password_confirmation}
        />
        {/* docs/rediseno.md RD-12: «Crear cuenta» a lo ancho, el divisor, «Continuar con Google» y el texto
            «¿Ya tienes cuenta? Inicia sesión» centrado.
            ET12: sin conexión, los botones se ven deshabilitados en vez de mostrar un error al seleccionarlos.
            HE-01-HU05-CA07: «Continuar con Google» también. */}
        <Boton principal type="submit" disabled={!enLinea || enCurso}>
          Crear cuenta
        </Boton>
        <Divisor />
        <Boton disabled={!enLinea || google.enCurso} onClick={() => void google.continuar()}>
          Continuar con Google
        </Boton>
        <p className="wg-cuenta__centro">
          ¿Ya tienes cuenta?{' '}
          <Hipervinculo alSeleccionar={() => abrirCuenta('sign_in')}>Inicia sesión</Hipervinculo>
        </p>
      </form>
    </MarcoDeCuenta>
  );
}
