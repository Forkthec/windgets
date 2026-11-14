import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useEnvioUnico } from '@/reglas/envio';
import { estaVacio, useMensajesDeCampo } from '@/reglas/formulario';
import { EncabezadoDeRuta } from '@/reglas/ruta';
import type { AppError } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { CampoTexto } from '@/ui/CampoTexto/CampoTexto';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNavegacion, useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { useConexion } from '../cuenta/conexion';
import { Hipervinculo } from '../cuenta/Hipervinculo';
import { TEXTOS } from '../cuenta/textos';

// Registro > paso Verificar correo (HE-01-HU03). «Regresar» sin miga de pan (RT-03-ET08).

const CAMPOS = ['code'] as const;
const VALIDADORES = { code: (v: string) => (estaVacio(v) ? TEXTOS.CAMPO_OBLIGATORIO : undefined) };

export interface VerificarCorreoProps {
  /** Correo al que se envió el código (ET01). */
  correo: string;
  /** `resend_available_at` del último envío (ET05, ET12). */
  reenvioDisponible: string;
  /** Vuelve al paso Formulario con lo diligenciado (CA08, ET10). */
  alRegresar: () => void;
}

/** Segundos que faltan para poder reenviar, redondeados hacia arriba. */
const segundosHasta = (instante: number, ahora: number) => Math.max(0, Math.ceil((instante - ahora) / 1000));

export function VerificarCorreo({ correo, reenvioDisponible, alRegresar }: VerificarCorreoProps) {
  const { invocar } = useNucleo();
  const { sesionIniciada } = useNavegacion();
  const mostrarResultado = useMensajeDeResultado();
  const { enLinea, sinConexion } = useConexion();
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [disponibleEn, setDisponibleEn] = useState(() => Date.parse(reenvioDisponible));
  const [ahora, setAhora] = useState(() => Date.now());
  const campos = useMensajesDeCampo(CAMPOS, VALIDADORES);

  // ET13: los segundos restantes se actualizan cada segundo.
  const segundos = segundosHasta(disponibleEn, ahora);
  useEffect(() => {
    if (segundos === 0) return undefined;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [segundos]);

  const fallo = useCallback(
    (error: AppError) => {
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
    const r = await invocar('auth_register_verify', { code: codigo });
    if (!r.ok) return fallo(r.error);
    if (r.result_message) mostrarResultado(r.result_message.message);
    sesionIniciada();
  }, [campos, codigo, fallo, invocar, mostrarResultado, sesionIniciada]);
  const envioVerificar = useEnvioUnico(verificar);

  const reenviar = useCallback(async () => {
    setAviso(null);
    const r = await invocar('auth_register_resend', {});
    if (!r.ok) return fallo(r.error);
    setAhora(Date.now());
    setDisponibleEn(Date.parse(r.value.resend_available_at));
    if (r.result_message) mostrarResultado(r.result_message.message);
  }, [fallo, invocar, mostrarResultado]);
  const envioReenviar = useEnvioUnico(reenviar);

  const puedeReenviar = enLinea && segundos === 0 && !envioReenviar.enCurso;

  return (
    <section className="wg-formulario" aria-label="Verificar correo">
      <EncabezadoDeRuta alRegresar={alRegresar} />
      {/* ET14: sin conexión, el aviso va en la parte superior del paso. */}
      {!enLinea && <Aviso texto={TEXTOS.SIN_CONEXION_REGISTRO} />}
      {aviso && enLinea && <Aviso texto={aviso} />}
      <p>{correo}</p>
      <form
        className="wg-formulario"
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
          {/* ET12: antes de los 60 segundos, el motivo con los segundos restantes. */}
          {segundos > 0 && (
            <span className="wg-motivo">
              {TEXTOS.REENVIO_EN_SEGUNDOS.replace('<segundos restantes>', String(segundos))}
            </span>
          )}
        </p>
      </form>
    </section>
  );
}
