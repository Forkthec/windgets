import { useCallback, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo } from '@/reglas/formulario';
import type { AppError } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { Hipervinculo } from '../cuenta/Hipervinculo';
import { MarcoDeCuenta } from '../cuenta/MarcoDeCuenta';
import { TEXTOS } from '../cuenta/textos';
import { validarCorreo } from '../cuenta/validaciones';

// P-CTA-01 Inicio de sesión (HE-01-HU04). Disposición de la figura 01 del equipo (WG-MK-01); los textos salen
// solo de los CA. Sin miga de pan (RT-03-ET08).

const CAMPOS = ['email', 'password'] as const;
type Campo = (typeof CAMPOS)[number];
type Valores = Record<Campo, string>;

// ET02 a ET05. La contraseña solo es obligatoria: sus límites son «NO DEFINIDO» en la HU.
const VALIDADORES = {
  email: validarCorreo,
  password: (v: string) => (estaVacio(v) ? TEXTOS.CAMPO_OBLIGATORIO : undefined),
};

export function SignIn() {
  const { invocar } = useNucleo();
  const { abrirCuenta, correoDeCuenta, sesionIniciada } = useNavegacion();
  const { enLinea, sinConexion } = useConexion();
  // Desde Registro, «Iniciar sesión» del correo ya registrado llega con ese correo diligenciado.
  const [valores, setValores] = useState<Valores>({ email: correoDeCuenta, password: '' });
  const [aviso, setAviso] = useState<string | null>(null);
  const campos = useMensajesDeCampo(CAMPOS, VALIDADORES);

  const cambiar = (campo: Campo) => (valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    campos.alCorregir(campo, valor);
  };

  const fallo = useCallback(
    (error: AppError) => {
      if (error.field) campos.mostrarDelNucleo([error]);
      else if (error.code === 'net.offline') sinConexion();
      else if (error.message) setAviso(error.message);
    },
    [campos, sinConexion],
  );

  const iniciar = useCallback(async () => {
    setAviso(null);
    if (!campos.validarTodo(valores)) return;
    const r = await invocar('auth_sign_in', valores);
    if (!r.ok) return fallo(r.error);
    sesionIniciada();
  }, [campos, fallo, invocar, sesionIniciada, valores]);
  const { ejecutar, enCurso } = useEnvioUnico(iniciar);

  return (
    <MarcoDeCuenta nombre="Inicio de sesión">
      <form
        className="wg-formulario"
        aria-label="Formulario"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void ejecutar();
        }}
      >
        {/* ET09: sin conexión, el aviso va en la parte superior de la pantalla. */}
        {!enLinea && <Aviso texto={TEXTOS.SIN_CONEXION_INICIO} />}
        {aviso && enLinea && <Aviso texto={aviso} />}
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
        {/* CA11: abre Recuperar contraseña (HE-01-HU06, P12) con el correo diligenciado. */}
        <p className="wg-cuenta__derecha">
          <Hipervinculo alSeleccionar={() => abrirCuenta('recovery', valores.email.trim())}>
            ¿Olvidaste tu contraseña?
          </Hipervinculo>
        </p>
        {/* ET10: sin conexión, los botones se ven deshabilitados hasta que vuelva la conexión. */}
        <Boton principal type="submit" disabled={!enLinea || enCurso}>
          Iniciar sesión
        </Boton>
        {/* El inicio con Google es HE-01-HU05 (P12, Cuentas: Google y recuperación). */}
        <Boton disabled={!enLinea}>Continuar con Google</Boton>
        <p className="wg-cuenta__centro">
          ¿No tienes cuenta?{' '}
          <Hipervinculo alSeleccionar={() => abrirCuenta('register')}>Regístrate</Hipervinculo>
        </p>
      </form>
    </MarcoDeCuenta>
  );
}
