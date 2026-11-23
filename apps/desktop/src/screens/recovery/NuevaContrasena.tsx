import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { useMensajesDeCampo } from '@/reglas/formulario';
import type { AppError } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { TEXTOS } from '../cuenta/textos';
import { AccionesDelPaso } from '../cuenta/PasoCentrado';
import { AYUDA_NUEVA_CONTRASENA, PASOS_CENTRADOS, REQUIERE_CONEXION } from '../cuenta/textosDelRediseno';
import { validarContrasena } from '../cuenta/validaciones';
import { PasoDeRecuperacion } from './PasoDeRecuperacion';

// Recuperar contraseña > paso Nueva contraseña (HE-01-HU08). Campos Nueva contraseña y Confirmar contraseña,
// «Guardar contraseña», miga de pan y «Regresar» (ET01).

const CAMPOS = ['password', 'password_confirmation'] as const;
type Valores = Record<(typeof CAMPOS)[number], string>;

export interface NuevaContrasenaProps {
  /** «Regresar»: el paso anterior, Diligenciar código (T-034). */
  alRegresar: () => void;
}

export function NuevaContrasena({ alRegresar }: NuevaContrasenaProps) {
  const { invocar } = useNucleo();
  const { abrirCuenta } = useNavegacion();
  const mostrarResultado = useMensajeDeResultado();
  const { enLinea, sinConexion } = useConexion();
  const [valores, setValores] = useState<Valores>({ password: '', password_confirmation: '' });
  const [aviso, setAviso] = useState<string | null>(null);
  // ET02 a ET05: la regla de la Contraseña del registro; Confirmar contraseña, idéntica (como el Núcleo, vacía
  // y distinta es «Las contraseñas no coinciden.»).
  const validadores = useMemo(
    () => ({
      password: validarContrasena,
      password_confirmation: (valor: string) =>
        valor === valores.password ? undefined : TEXTOS.CONTRASENAS_NO_COINCIDEN,
    }),
    [valores.password],
  );
  const campos = useMensajesDeCampo(CAMPOS, validadores);

  const cambiar = (campo: keyof Valores) => (valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    campos.alCorregir(campo, valor);
  };

  const fallo = useCallback(
    (error: AppError) => {
      // CA03, CA07: debajo del campo; CA06: sin conexión, el aviso arriba y lo diligenciado se conserva.
      if (error.field) campos.mostrarDelNucleo([error]);
      else if (error.code === 'net.offline') sinConexion();
      else if (error.message) setAviso(error.message);
    },
    [campos, sinConexion],
  );

  const guardar = useCallback(async () => {
    setAviso(null);
    if (!campos.validarTodo(valores)) return;
    const r = await invocar('auth_recovery_set_password', valores);
    if (!r.ok) return fallo(r.error);
    // CA01, T-033: abre Inicio de sesión con el mensaje de resultado.
    if (r.result_message) mostrarResultado(r.result_message.message);
    abrirCuenta('sign_in');
  }, [abrirCuenta, campos, fallo, invocar, mostrarResultado, valores]);
  const envio = useEnvioUnico(guardar);

  return (
    <PasoDeRecuperacion nombre="Nueva contraseña" {...PASOS_CENTRADOS.nueva} enLinea={enLinea}>
      {aviso && enLinea && <Aviso texto={aviso} />}
      <form
        className="wg-formulario"
        aria-label="Formulario"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void envio.ejecutar();
        }}
      >
        <CampoTexto
          id={campos.ids.password}
          etiqueta="Nueva contraseña"
          type="password"
          ayuda={AYUDA_NUEVA_CONTRASENA}
          autoComplete="new-password"
          valor={valores.password}
          alCambiar={cambiar('password')}
          mensaje={campos.mensajes.password}
        />
        <CampoTexto
          id={campos.ids.password_confirmation}
          etiqueta="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          valor={valores.password_confirmation}
          alCambiar={cambiar('password_confirmation')}
          mensaje={campos.mensajes.password_confirmation}
        />
        {/* CA05, ET06, ET07: sin conexión, «Guardar contraseña» deshabilitado hasta que vuelva la conexión. */}
        {/* docs/rediseno.md RD-17, RD-18: «Regresar» junto a «Guardar contraseña». */}
        <AccionesDelPaso
          alRegresar={alRegresar}
          motivoSinConexion={enLinea ? null : REQUIERE_CONEXION('Guardar contraseña')}
        >
          <Boton principal type="submit" disabled={!enLinea || envio.enCurso}>
            Guardar contraseña
          </Boton>
        </AccionesDelPaso>
      </form>
    </PasoDeRecuperacion>
  );
}
