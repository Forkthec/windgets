import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo } from '@/reglas/formulario';
import type { AppError } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { Hipervinculo } from '../cuenta/Hipervinculo';
import { TEXTOS } from '../cuenta/textos';
import { PasoDeRecuperacion } from './PasoDeRecuperacion';

// Recuperar contraseña > paso Diligenciar código (HE-01-HU07). Campo Código de verificación, «Verificar»,
// «Reenviar código», miga de pan y «Regresar» (ET01).

const CAMPOS = ['code'] as const;
const VALIDADORES = { code: (v: string) => (estaVacio(v) ? TEXTOS.CAMPO_OBLIGATORIO : undefined) };

export interface DiligenciarCodigoProps {
  /** `resend_available_at` del último envío (ET05, ET11). */
  reenvioDisponible: string;
  /** Aviso de HE-01-HU06-ET09 que llega del paso Correo electrónico. */
  avisoInicial: string | null;
  /** Código correcto: pasa al paso Nueva contraseña (CA01). */
  alVerificar: () => void;
  /** Vuelve al paso Correo electrónico con el correo diligenciado (CA08, ET09). */
  alRegresar: () => void;
}

/** Segundos que faltan para poder reenviar, redondeados hacia arriba. */
const segundosHasta = (instante: number, ahora: number) => Math.max(0, Math.ceil((instante - ahora) / 1000));

export function DiligenciarCodigo({ reenvioDisponible, avisoInicial, alVerificar, alRegresar }: DiligenciarCodigoProps) {
  const { invocar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const { enLinea, sinConexion } = useConexion();
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState<string | null>(avisoInicial);
  const [disponibleEn, setDisponibleEn] = useState(() => Date.parse(reenvioDisponible));
  const [ahora, setAhora] = useState(() => Date.now());
  const campos = useMensajesDeCampo(CAMPOS, VALIDADORES);

  // ET12: los segundos restantes se actualizan cada segundo y el hipervínculo se habilita en 0.
  const segundos = segundosHasta(disponibleEn, ahora);
  useEffect(() => {
    if (segundos === 0) return undefined;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [segundos]);

  const fallo = useCallback(
    (error: AppError) => {
      // CA02 a CA04: mensajes del campo; CA09: sin conexión, el aviso arriba del paso.
      if (error.field) campos.mostrarDelNucleo([error]);
      else if (error.code === 'net.offline') sinConexion();
      else if (error.code === 'code.resend_too_soon') {
        const faltan = Number(error.params?.seconds ?? 0);
        setAhora(Date.now());
        setDisponibleEn(Date.now() + faltan * 1000);
      } else if (error.message) setAviso(error.message);
    },
    [campos, sinConexion],
  );

  const verificar = useCallback(async () => {
    setAviso(null);
    if (!campos.validarTodo({ code: codigo })) return;
    const r = await invocar('auth_recovery_verify', { code: codigo });
    if (!r.ok) return fallo(r.error);
    alVerificar();
  }, [alVerificar, campos, codigo, fallo, invocar]);
  const envioVerificar = useEnvioUnico(verificar);

  const reenviar = useCallback(async () => {
    setAviso(null);
    const r = await invocar('auth_recovery_resend', {});
    if (!r.ok) return fallo(r.error);
    setAhora(Date.now());
    setDisponibleEn(Date.parse(r.value.resend_available_at));
    // CA06: «Te enviamos un nuevo código.» es un mensaje de resultado (RT-04).
    if (r.result_message) mostrarResultado(r.result_message.message);
  }, [fallo, invocar, mostrarResultado]);
  const envioReenviar = useEnvioUnico(reenviar);

  // CA09, ET14: sin conexión, «Verificar» y «Reenviar código» deshabilitados; el código se conserva.
  const puedeReenviar = enLinea && segundos === 0 && !envioReenviar.enCurso;

  return (
    <PasoDeRecuperacion nombre="Diligenciar código" enLinea={enLinea} alRegresar={alRegresar}>
      {aviso && enLinea && <Aviso texto={aviso} />}
      <form
        className="wg-formulario"
        aria-label="Formulario"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void envioVerificar.ejecutar();
        }}
      >
        <CampoTexto
          id={campos.ids.code}
          etiqueta="Código de verificación"
          inputMode="numeric"
          autoComplete="one-time-code"
          valor={codigo}
          alCambiar={(valor) => {
            setCodigo(valor);
            campos.alCorregir('code', valor);
          }}
          mensaje={campos.mensajes.code}
        />
        <Boton principal type="submit" disabled={!enLinea || envioVerificar.enCurso}>
          Verificar
        </Boton>
        <p className="wg-fila">
          <Hipervinculo deshabilitado={!puedeReenviar} alSeleccionar={() => void envioReenviar.ejecutar()}>
            Reenviar código
          </Hipervinculo>
          {/* CA07, ET11: antes de los 60 segundos, el motivo con los segundos restantes. */}
          {segundos > 0 && (
            <span className="wg-motivo">
              {TEXTOS.REENVIO_EN_SEGUNDOS.replace('<segundos restantes>', String(segundos))}
            </span>
          )}
        </p>
      </form>
    </PasoDeRecuperacion>
  );
}
