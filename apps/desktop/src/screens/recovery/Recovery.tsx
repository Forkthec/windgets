import { useCallback, useState, type FormEvent, type ReactNode } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { useMensajesDeCampo } from '@/reglas/formulario';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { AppError } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { MarcoDeCuenta } from '../cuenta/MarcoDeCuenta';
import { TEXTOS } from '../cuenta/textos';
import { validarCorreo } from '../cuenta/validaciones';

// P-CTA-03 Recuperar contraseña (HE-01-HU06 a HU08). Tres pasos en este orden: Correo electrónico, Diligenciar
// código y Nueva contraseña (HE-01-HU06-ET02). En todos, la miga de pan «Inicio de sesión > Recuperar
// contraseña» y «Regresar» (ET03, RT-03).

type Paso = 'correo' | 'codigo';

const CAMPOS = ['email'] as const;
const VALIDADORES = { email: validarCorreo };

/** Paso de Recuperar contraseña con su encabezado de ruta y, sin conexión, el aviso arriba del paso. */
function PasoDeRecuperacion({
  nombre,
  enLinea,
  alRegresar,
  children,
}: {
  nombre: string;
  enLinea: boolean;
  alRegresar: () => void;
  children: ReactNode;
}) {
  const { abrirCuenta } = useNavegacion();
  return (
    <section className="wg-formulario" aria-label={nombre}>
      {/* CA07, ET04: «Inicio de sesión» en la miga de pan abre Inicio de sesión sin cambiar la contraseña. */}
      <EncabezadoDeRuta
        niveles={[{ texto: 'Inicio de sesión', alElegir: () => abrirCuenta('sign_in') }, { texto: 'Recuperar contraseña' }]}
        alRegresar={alRegresar}
      />
      {/* HE-01-HU06-ET11: sin conexión, el aviso va en la parte superior del paso. */}
      {!enLinea && <Aviso texto={TEXTOS.SIN_CONEXION_RECUPERAR} />}
      {children}
    </section>
  );
}

export function Recovery() {
  const { invocar } = useNucleo();
  const { abrirCuenta, correoDeCuenta } = useNavegacion();
  const { enLinea, sinConexion } = useConexion();
  const [paso, setPaso] = useState<Paso>('correo');
  // Desde Inicio de sesión, «¿Olvidaste tu contraseña?» llega con el correo diligenciado (HE-01-HU04-CA11).
  const [correo, setCorreo] = useState(correoDeCuenta);
  const [aviso, setAviso] = useState<string | null>(null);
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
    setPaso('codigo');
  }, [campos, correo, fallo, invocar]);
  const envio = useEnvioUnico(enviar);

  if (paso === 'codigo') {
    return (
      <MarcoDeCuenta nombre="Recuperar contraseña">
        <PasoDeRecuperacion
          nombre="Diligenciar código"
          enLinea={enLinea}
          alRegresar={() => {
            setAviso(null);
            setPaso('correo');
          }}
        >
          {aviso && enLinea && <Aviso texto={aviso} />}
        </PasoDeRecuperacion>
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
