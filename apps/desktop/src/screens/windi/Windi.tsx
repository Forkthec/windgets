import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Label, WindiMessage, WindiProposal } from '@/types';
import textos from '@/types/messages.es.json';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import windiSaludo from '../cuenta/activos/windi-saludo.svg';
import { Propuesta } from './Propuesta';
import './windi.css';
import { useAvisarEscribiendo } from '@/ventana_principal/PanelDeWindi';

// P-IA-01 Agente de IA (Menú principal > Planificador > Agente de IA; HE-14-HU01). La conversación vive en el
// Núcleo mientras la aplicación está abierta (IPC-WIN-01; ET14). Cada mensaje va a Windi por IPC-WIN-02, que
// espera la respuesta como máximo 15 s (RNF-11). Sin conexión no se puede escribir (ET12).
// DUDA: HE-14-HU01 el campo «Escribe un mensaje» no define si «Enter» con Mayúsculas hace un salto de línea.
// Valor usado: «Enter» envía (ET05) y Mayúsculas + «Enter» hace un salto de línea (docs/DUDAS.md).
// HE-14-HU03: cada propuesta va en el chat después de la respuesta que la trajo, con «Confirmar» y «Rechazar».
// DUDA: HE-14-HU03 IPC-WIN-01 devuelve solo la última propuesta. Valor usado: la vista guarda las anteriores
// mientras está abierta, para mostrar la «Descartada» (CA04) (docs/DUDAS.md).

/** Largo máximo de un mensaje (HE-14-HU01-ET03). */
export const LARGO_MAXIMO = 2000;

/** Una propuesta y el mensaje de Windi después del cual se muestra. */
interface PropuestaEnElChat {
  despuesDe: string;
  propuesta: WindiProposal;
}

/** Agrega `nueva` y deja como «Descartada» la activa anterior (HE-14-HU03-ET04). */
function conNueva(lista: PropuestaEnElChat[], nueva: PropuestaEnElChat): PropuestaEnElChat[] {
  const anteriores = lista
    .filter((p) => p.propuesta.id !== nueva.propuesta.id)
    .map((p) =>
      p.propuesta.state === 'active'
        ? { ...p, propuesta: { ...p.propuesta, state: 'discarded' as const } }
        : p,
    );
  return [...anteriores, nueva];
}

function conEstado(lista: PropuestaEnElChat[], id: string, state: WindiProposal['state']) {
  return lista.map((p) => (p.propuesta.id === id ? { ...p, propuesta: { ...p.propuesta, state } } : p));
}

export function Windi() {
  const { invocar, escuchar } = useNucleo();
  const [mensajes, setMensajes] = useState<WindiMessage[] | null>(null);
  const [propuestas, setPropuestas] = useState<PropuestaEnElChat[]>([]);
  const [enLinea, setEnLinea] = useState(true);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  // RD-70: los ojos del botón y del panel parpadean mientras Windi responde.
  useAvisarEscribiendo(escribiendo);
  // CA08: el mensaje que falló, para «Reintentar».
  const [fallido, setFallido] = useState<string | null>(null);
  // HE-14-HU03-CA02: se perdió la conexión al confirmar.
  const [sinConexionAlConfirmar, setSinConexionAlConfirmar] = useState(false);
  // HE-14-HU03-CA07, ET12: «Confirmar» falló; la propuesta sigue con «Confirmar» y «Rechazar» habilitadas.
  const [avisoAlConfirmar, setAvisoAlConfirmar] = useState<string | null>(null);
  // HE-14-HU05-ET11: la propuesta muestra las etiquetas por su nombre.
  const [etiquetas, setEtiquetas] = useState<Label[]>([]);
  const idCampo = useId();
  // docs/rediseno.md RD-57: la conversación se desplaza dentro de la tarjeta (RD-36); con cada mensaje, propuesta,
  // «Escribiendo…» o falla nueva, baja hasta el final para que se vea lo último.
  const conversacion = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const lista = conversacion.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensajes, propuestas, escribiendo, fallido]);

  const leer = useCallback(async () => {
    void invocar('label_list', {}).then((e) => {
      if (e.ok) setEtiquetas(e.value);
    });
    const r = await invocar('windi_get_conversation', {});
    if (!r.ok) return;
    setMensajes(r.value.messages);
    setEnLinea(r.value.online);
    const actual = r.value.proposal;
    const ultimoDeWindi = r.value.messages.filter((m) => m.role === 'assistant').at(-1);
    if (actual && ultimoDeWindi) {
      setPropuestas((lista) =>
        lista.some((p) => p.propuesta.id === actual.id)
          ? conEstado(lista, actual.id, actual.state)
          : conNueva(lista, { despuesDe: ultimoDeWindi.id, propuesta: actual }),
      );
    }
  }, [invocar]);

  useEffect(() => {
    void leer();
    // ET12, ET13: al perder o recuperar la conexión se habilita o deshabilita el chat.
    return escuchar('connectivity_changed', (carga) => {
      setEnLinea(carga.online);
      if (carga.online) setSinConexionAlConfirmar(false);
    });
  }, [escuchar, leer]);

  const enviar = async (mensaje: string) => {
    setEscribiendo(true);
    setFallido(null);
    // ET06: el mensaje enviado se ve de inmediato, con «Escribiendo…» hasta que llega la respuesta.
    setMensajes((m) => {
      const lista = m ?? [];
      const ultimo = lista.at(-1);
      if (ultimo?.role === 'user' && ultimo.failed && ultimo.text === mensaje) {
        return [...lista.slice(0, -1), { ...ultimo, failed: false }];
      }
      return [
        ...lista,
        { id: `local-${lista.length}`, role: 'user', text: mensaje, sent_at: '', failed: false },
      ];
    });
    const r = await invocar('windi_send_message', { message: mensaje });
    setEscribiendo(false);
    if (r.ok) {
      const { reply, proposal } = r.value;
      if (proposal) setPropuestas((lista) => conNueva(lista, { despuesDe: reply.id, propuesta: proposal }));
    } else if (r.error.code === 'net.offline') {
      setEnLinea(false);
    } else {
      setFallido(mensaje);
    }
    await leer();
  };

  const confirmar = async (propuesta: WindiProposal) => {
    setEscribiendo(true);
    setAvisoAlConfirmar(null);
    const r = await invocar('windi_confirm_proposal', { proposal_id: propuesta.id });
    setEscribiendo(false);
    if (r.ok) {
      const { outcome, reply, new_proposal } = r.value;
      setPropuestas((lista) => {
        const actualizada = conEstado(lista, propuesta.id, outcome === 'applied' ? 'confirmed' : 'discarded');
        return new_proposal
          ? conNueva(actualizada, { despuesDe: reply.id, propuesta: new_proposal })
          : actualizada;
      });
    } else if (r.error.code === 'net.offline') {
      // ET07: no aplica, deshabilita «Confirmar» y «Rechazar» y muestra el aviso.
      setSinConexionAlConfirmar(true);
    } else if (r.error.code === 'proposal.discarded') {
      setPropuestas((lista) => conEstado(lista, propuesta.id, 'discarded'));
    } else {
      setAvisoAlConfirmar(r.error.message || textos.WINDI_NO_PUDE_APLICAR);
    }
    await leer();
  };

  const rechazar = async (propuesta: WindiProposal) => {
    const r = await invocar('windi_reject_proposal', { proposal_id: propuesta.id });
    setPropuestas((lista) => conEstado(lista, propuesta.id, r.ok ? 'rejected' : 'discarded'));
    await leer();
  };

  const largo = [...texto].length;
  const muyLargo = largo > LARGO_MAXIMO;
  // ET02, ET04, ET12: «Enviar» deshabilitado vacío, con más de 2000 caracteres, sin conexión o mientras responde.
  const puedeEnviar = enLinea && !escribiendo && texto.trim().length > 0 && !muyLargo;

  const enviarCampo = () => {
    if (!puedeEnviar) return;
    const mensaje = texto;
    setTexto('');
    void enviar(mensaje);
  };

  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // ET05: «Enter» envía igual que «Enviar».
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarCampo();
    }
  };

  return (
    // RD-70: la conversación va dentro del panel lateral de Windi (`ventana_principal/PanelDeWindi`), no como pantalla.
    <section className="wg-windi" aria-label="Conversación con Windi" aria-busy={mensajes === null}>
      {/* ET13: sin conexión, el aviso (RT-04); el historial sigue visible. */}
      {!enLinea && <Aviso texto={textos.WINDI_SIN_CONEXION} />}
      {sinConexionAlConfirmar && <Aviso texto={textos.WINDI_SIN_CONEXION_AL_CONFIRMAR} />}
      {avisoAlConfirmar !== null && <Aviso texto={avisoAlConfirmar} />}
      {/* ET01: el área de conversación. */}
      <ol ref={conversacion} className="wg-windi__conversacion" aria-label="Conversación" aria-live="polite">
        {(mensajes ?? []).map((m) => (
          // docs/rediseno.md RD-36 (Figma 76:27 «Tu mensaje», 76:29 a 76:42): tus mensajes en un globo a la derecha;
          // los de Windi a la izquierda, con su ilustración y su nombre.
          <li key={m.id} className={`wg-windi__mensaje wg-windi__mensaje--${m.role}`}>
            {m.role === 'assistant' && (
              <img className="wg-windi__ilustracion" src={windiSaludo} alt="" width={77} height={48} />
            )}
            {m.role === 'assistant' && <span className="wg-windi__autor">Windi</span>}
            <p className="wg-windi__texto">{m.text}</p>
            {propuestas
              .filter((p) => p.despuesDe === m.id)
              .map(({ propuesta }) => (
                <Propuesta
                  key={propuesta.id}
                  propuesta={propuesta}
                  habilitada={enLinea && !escribiendo && !sinConexionAlConfirmar}
                  alConfirmar={() => void confirmar(propuesta)}
                  alRechazar={() => void rechazar(propuesta)}
                  etiquetas={etiquetas}
                />
              ))}
          </li>
        ))}
        {escribiendo && <li className="wg-windi__escribiendo">Escribiendo…</li>}
      </ol>
      {/* ET16: si el servicio no responde, el mensaje y «Reintentar», que vuelve a enviar el mismo mensaje. */}
      {fallido !== null && !escribiendo && (
        <div className="wg-fila wg-windi__falla" role="alert">
          <span>{textos.WINDI_NO_DISPONIBLE}</span>
          <Boton disabled={!enLinea} onClick={() => void enviar(fallido)}>
            Reintentar
          </Boton>
        </div>
      )}
      {/* RD-36 (Figma 76:52 «Redactar mensaje»): el campo, el contador y «Enviar» en una caja. */}
      <div className="wg-windi__escribir">
        <label className="wg-oculto" htmlFor={idCampo}>
          Escribe un mensaje
        </label>
        <textarea
          id={idCampo}
          className="wg-campo__entrada"
          placeholder="Escribe un mensaje"
          value={texto}
          disabled={!enLinea}
          aria-describedby={`${idCampo}-contador`}
          aria-invalid={muyLargo || undefined}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={alTeclear}
        />
        <div className="wg-fila wg-windi__pie">
          {/* ET01: el contador «<caracteres> / 2000». */}
          <span id={`${idCampo}-contador`}>{`${largo} / ${LARGO_MAXIMO}`}</span>
          {/* ET04 (RT-04): el motivo de «Enviar» deshabilitado. */}
          {muyLargo && <span className="wg-motivo">{textos.MENSAJE_MUY_LARGO}</span>}
          <Boton principal disabled={!puedeEnviar} onClick={enviarCampo}>
            Enviar
          </Boton>
        </div>
      </div>
    </section>
  );
}
