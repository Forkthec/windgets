import { useCallback, useEffect, useId, useState, type KeyboardEvent } from 'react';
import type { WindiMessage } from '@/types';
import textos from '@/types/messages.es.json';
import { Aviso } from '@/ui/Aviso/Aviso';
import { Boton } from '@/ui/Boton/Boton';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// P-IA-01 Agente de IA (Menú principal > Planificador > Agente de IA; HE-14-HU01). La conversación vive en el
// Núcleo mientras la aplicación está abierta (IPC-WIN-01; ET14). Cada mensaje va a Windi por IPC-WIN-02, que
// espera la respuesta como máximo 15 s (RNF-11). Sin conexión no se puede escribir (ET12).
// DUDA: HE-14-HU01 el campo «Escribe un mensaje» no define si «Enter» con Mayúsculas hace un salto de línea.
// Valor usado: «Enter» envía (ET05) y Mayúsculas + «Enter» hace un salto de línea (docs/DUDAS.md).

/** Largo máximo de un mensaje (HE-14-HU01-ET03). */
export const LARGO_MAXIMO = 2000;

export function Windi() {
  const { invocar, escuchar } = useNucleo();
  const [mensajes, setMensajes] = useState<WindiMessage[] | null>(null);
  const [enLinea, setEnLinea] = useState(true);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  // CA08: el mensaje que falló, para «Reintentar».
  const [fallido, setFallido] = useState<string | null>(null);
  const idCampo = useId();

  const leer = useCallback(async () => {
    const r = await invocar('windi_get_conversation', {});
    if (!r.ok) return;
    setMensajes(r.value.messages);
    setEnLinea(r.value.online);
  }, [invocar]);

  useEffect(() => {
    void leer();
    // ET12, ET13: al perder o recuperar la conexión se habilita o deshabilita el chat.
    return escuchar('connectivity_changed', (carga) => setEnLinea(carga.online));
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
    if (!r.ok) {
      if (r.error.code === 'net.offline') setEnLinea(false);
      else setFallido(mensaje);
    }
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
    <main aria-label="Agente de IA" aria-busy={mensajes === null}>
      {/* ET13: sin conexión, el aviso (RT-04); el historial sigue visible. */}
      {!enLinea && <Aviso texto={textos.WINDI_SIN_CONEXION} />}
      {/* ET01: el área de conversación. */}
      <ol className="wg-windi__conversacion" aria-label="Conversación" aria-live="polite">
        {(mensajes ?? []).map((m) => (
          <li key={m.id} className={`wg-windi__mensaje wg-windi__mensaje--${m.role}`}>
            {m.role === 'assistant' && <span className="wg-windi__autor">Windi</span>}
            <p>{m.text}</p>
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
        <div className="wg-fila">
          {/* ET01: el contador «<caracteres> / 2000». */}
          <span id={`${idCampo}-contador`}>{`${largo} / ${LARGO_MAXIMO}`}</span>
          {/* ET04 (RT-04): el motivo de «Enviar» deshabilitado. */}
          {muyLargo && <span className="wg-motivo">{textos.MENSAJE_MUY_LARGO}</span>}
          <Boton principal disabled={!puedeEnviar} onClick={enviarCampo}>
            Enviar
          </Boton>
        </div>
      </div>
    </main>
  );
}
