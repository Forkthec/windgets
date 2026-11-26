import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { textoDelError } from '@/ipc/textoDelError';
import type { AppError } from '@/types';
import { NombreEmergente } from '../NombreEmergente/NombreEmergente';

// Mensajes emergentes (rediseno_final_prototipos.md §3.5; rediseno_final_backend.md §4.3; docs/rediseno.md RD-63).
// Una cola global montada en la raíz, encima de las ventanas emergentes y del panel de Windi, en la esquina inferior
// derecha: máximo 3 visibles, el más nuevo arriba (el cuarto reemplaza al más antiguo). Éxito e información duran 4 s
// (RNF-27); advertencia, 6 s; el error no se cierra solo: se queda hasta «×» (RD-104, IM-07). Se pausan al pasar el
// mouse y mientras tienen el foco; «×» los cierra antes. No bloquean clics ni teclado (RT-04-ET01 a ET03).
// RD-104: el contenedor se dibuja en `body` con `ATRIBUTO_SIN_INERTE`, que `VentanaEmergente` respeta, para que con una
// ventana emergente abierta (fondo `inert`, RD-103) el mensaje siga pudiéndose pausar y cerrar. Nunca toma el foco.

export type TipoDeMensaje = 'exito' | 'info' | 'advertencia' | 'error';

export const DURACION_RESULTADO_MS = 4000; // RNF-27: se oculta a los 4 s
export const DURACION_AVISO_MS = 6000;
export const MAXIMO_VISIBLES = 3;

/** Atributo de un hijo de `body` que las ventanas emergentes no vuelven `inert` (RD-104). */
export const ATRIBUTO_SIN_INERTE = 'data-wg-sin-inerte';

/** Milisegundos hasta el cierre automático; `null`: no se cierra solo (error, RD-104). */
export const DURACION_DEL_TIPO: Record<TipoDeMensaje, number | null> = {
  exito: DURACION_RESULTADO_MS,
  info: DURACION_RESULTADO_MS,
  advertencia: DURACION_AVISO_MS,
  error: null,
};

const ICONO_DEL_TIPO: Record<TipoDeMensaje, string> = {
  exito: '✓',
  info: 'ⓘ',
  advertencia: '⚠',
  error: '⛔',
};

/**
 * El tipo de un texto existente cuando la pantalla no lo dice (tabla de §3.5): los errores de la operación son
 * «error»; la conexión perdida y lo que se resuelve solo, «advertencia»; lo que solo informa, «info»; lo demás,
 * «éxito».
 */
export function tipoDelTexto(texto: string): TipoDeMensaje {
  if (/^(Sin conexión|Se perdió la conexión|No pudimos mostrar tu wallpaper)/.test(texto))
    return 'advertencia';
  if (
    /^(No pudimos|No pude|No fue posible|No se pudo|Ocurrió un error|Ya no existe|La tarjeta ya no existe)/.test(
      texto,
    )
  )
    return 'error';
  if (/^(Si el correo|Te enviamos|Sincronizado|No se guardaron cambios)/.test(texto)) return 'info';
  return 'exito';
}

export interface MensajeResultadoProps {
  texto: string;
  tipo?: TipoDeMensaje;
  alOcultar: () => void;
}

export function MensajeResultado({ texto, tipo = 'exito', alOcultar }: MensajeResultadoProps) {
  // El temporizador no se reinicia si la pantalla vuelve a dibujarse con otra función `alOcultar`.
  const ocultar = useRef(alOcultar);
  useEffect(() => {
    ocultar.current = alOcultar;
  }, [alOcultar]);
  // Pausa por el puntero o por el foco dentro del mensaje (RD-104).
  const [conPuntero, setConPuntero] = useState(false);
  const [conFoco, setConFoco] = useState(false);
  const pausado = conPuntero || conFoco;
  const restante = useRef(DURACION_DEL_TIPO[tipo]);
  useEffect(() => {
    if (pausado || restante.current === null) return;
    const inicio = Date.now();
    const t = setTimeout(() => ocultar.current(), restante.current);
    return () => {
      clearTimeout(t);
      restante.current = Math.max(0, (restante.current ?? 0) - (Date.now() - inicio));
    };
  }, [pausado]);
  return (
    <div
      className={`wg-resultado wg-resultado--${tipo} wg-fila`}
      role={tipo === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setConPuntero(true)}
      onMouseLeave={() => setConPuntero(false)}
      onFocus={() => setConFoco(true)}
      onBlur={(e) => {
        // El foco que pasa de un control del mensaje a otro del mismo mensaje no lo reanuda.
        if (!e.currentTarget.contains(e.relatedTarget)) setConFoco(false);
      }}
    >
      <span className="wg-resultado__icono" aria-hidden="true">
        {ICONO_DEL_TIPO[tipo]}
      </span>
      <span className="wg-resultado__texto">{texto}</span>
      <NombreEmergente texto="Cerrar">
        <button
          type="button"
          className="wg-resultado__cerrar"
          aria-label="Cerrar mensaje"
          onClick={alOcultar}
        >
          ×
        </button>
      </NombreEmergente>
    </div>
  );
}

type Mostrar = (texto: string, tipo?: TipoDeMensaje) => void;

const ContextoDeResultado = createContext<Mostrar | null>(null);

interface Mensaje {
  id: number;
  texto: string;
  tipo: TipoDeMensaje;
}

/**
 * Aloja la cola de mensajes de la ventana principal (C-01). El texto lo define cada HU; los comandos lo traen en
 * `Ok.result_message` (contratos.md, 1.3). Un texto vacío no se muestra.
 */
export function ProveedorDeResultado({ children }: { children: ReactNode }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const siguiente = useRef(0);
  const mostrar = useCallback<Mostrar>((texto, tipo) => {
    if (!texto) return;
    siguiente.current += 1;
    const nuevo = { id: siguiente.current, texto, tipo: tipo ?? tipoDelTexto(texto) };
    // El mismo texto que ya se ve no se repite: se reemplaza por el nuevo, arriba.
    setMensajes((antes) => [nuevo, ...antes.filter((m) => m.texto !== texto)].slice(0, MAXIMO_VISIBLES));
  }, []);
  const ocultar = useCallback((id: number) => setMensajes((antes) => antes.filter((m) => m.id !== id)), []);
  return (
    <ContextoDeResultado.Provider value={mostrar}>
      {children}
      {mensajes.length > 0 &&
        createPortal(
          <div className="wg-resultados" {...{ [ATRIBUTO_SIN_INERTE]: '' }}>
            {mensajes.map((m) => (
              <MensajeResultado key={m.id} texto={m.texto} tipo={m.tipo} alOcultar={() => ocultar(m.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ContextoDeResultado.Provider>
  );
}

/** Muestra un mensaje emergente (RT-04). Requiere `ProveedorDeResultado`. */
export function useMensajeDeResultado(): Mostrar {
  const mostrar = useContext(ContextoDeResultado);
  if (!mostrar) throw new Error('useMensajeDeResultado necesita ProveedorDeResultado');
  return mostrar;
}

/** Muestra el error de una acción como mensaje emergente de tipo «error»: su texto o el genérico (RD-83). */
export function useMostrarError(): (error: Pick<AppError, 'message'>) => void {
  const mostrar = useMensajeDeResultado();
  return useCallback((error) => mostrar(textoDelError(error), 'error'), [mostrar]);
}
