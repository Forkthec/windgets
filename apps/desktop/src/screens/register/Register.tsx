import { useCallback, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { useMensajesDeCampo } from '@/reglas/formulario';
import type { AppError, AuthRegisterStartResult } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { Hipervinculo } from '../cuenta/Hipervinculo';
import { MarcoDeCuenta } from '../cuenta/MarcoDeCuenta';
import { TEXTOS } from '../cuenta/textos';
import { validarAlias, validarCorreo } from '../cuenta/validaciones';

// P-CTA-02 Registro (HE-01-HU01 a HU03): paso Formulario y paso Verificar correo. Sin miga de pan (RT-03-ET08).

const CAMPOS = ['alias', 'email', 'password', 'password_confirmation'] as const;
type Campo = (typeof CAMPOS)[number];
type Valores = Record<Campo, string>;

const VALIDADORES = { alias: validarAlias, email: validarCorreo };

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
  const [paso, setPaso] = useState<'formulario' | 'verificar'>('formulario');
  const [, setEnvio] = useState<AuthRegisterStartResult | null>(null);
  const [registrado, setRegistrado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const campos = useMensajesDeCampo(CAMPOS, VALIDADORES);

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
      else if (error.message) setAviso(error.message);
    },
    [campos, sinConexion],
  );

  const crear = useCallback(async () => {
    setAviso(null);
    setRegistrado(false);
    if (!campos.validarTodo(valores)) return;
    const r = await invocar('auth_register_start', valores);
    if (!r.ok) return fallo(r.error);
    setEnvio(r.value);
    if (r.result_message) mostrarResultado(r.result_message.message);
    setPaso('verificar');
  }, [campos, fallo, invocar, mostrarResultado, valores]);
  const { ejecutar, enCurso } = useEnvioUnico(crear);

  const correo = valores.email.trim();

  if (paso === 'verificar') {
    return <MarcoDeCuenta nombre="Registro">{null}</MarcoDeCuenta>;
  }

  return (
    <MarcoDeCuenta nombre="Registro">
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
        {registrado && (
          <div className="wg-aviso" role="alert">
            {TEXTOS.CORREO_YA_REGISTRADO}{' '}
            <Hipervinculo alSeleccionar={() => abrirCuenta('sign_in', correo)}>Iniciar sesión</Hipervinculo>{' '}
            <Hipervinculo alSeleccionar={() => abrirCuenta('recovery', correo)}>
              Recuperar contraseña
            </Hipervinculo>
          </div>
        )}
        <CampoTexto
          id={campos.ids.alias}
          etiqueta="Alias"
          valor={valores.alias}
          alCambiar={cambiar('alias')}
          mensaje={campos.mensajes.alias}
        />
        <CampoTexto
          id={campos.ids.email}
          etiqueta="Correo electrónico"
          type="email"
          valor={valores.email}
          alCambiar={cambiar('email')}
          mensaje={campos.mensajes.email}
        />
        <CampoTexto
          id={campos.ids.password}
          etiqueta="Contraseña"
          type="password"
          valor={valores.password}
          alCambiar={cambiar('password')}
          mensaje={campos.mensajes.password}
        />
        <CampoTexto
          id={campos.ids.password_confirmation}
          etiqueta="Confirmar contraseña"
          type="password"
          valor={valores.password_confirmation}
          alCambiar={cambiar('password_confirmation')}
          mensaje={campos.mensajes.password_confirmation}
        />
        {/* ET12: sin conexión, los botones se ven deshabilitados en vez de mostrar un error al seleccionarlos.
            El inicio con Google es HE-01-HU05 (P12, Cuentas: Google y recuperación). */}
        <Boton disabled={!enLinea}>Continuar con Google</Boton>
        <div className="wg-fila wg-cuenta__pie">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Hipervinculo alSeleccionar={() => abrirCuenta('sign_in')}>Iniciar sesión</Hipervinculo>
          </p>
          <Boton principal type="submit" disabled={!enLinea || enCurso}>
            Crear cuenta
          </Boton>
        </div>
      </form>
    </MarcoDeCuenta>
  );
}
