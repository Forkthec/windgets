import { useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, MediaSession } from '@/types';
import textos from '@/types/messages.es.json';

// Widget Reproductor de música en la capa (HE-04-HU11-ET03; D-175): el título, el artista y la carátula (o un ícono
// genérico, CA05) de la sesión actual de Windows, con reproducir/pausar, anterior y siguiente. Se actualiza con
// EV-19 en menos de 5 s (ET08). Es un widget local: no muestra avisos de conexión (CA06).

export interface WidgetReproductorProps {
  invocar: Invoke;
  escuchar: Escuchar;
}

export function WidgetReproductor({ invocar, escuchar }: WidgetReproductorProps) {
  const [sesion, setSesion] = useState<MediaSession | null>(null);

  useEffect(() => {
    let vigente = true;
    void invocar('media_get_session', {}).then((r) => {
      if (vigente && r.ok) setSesion(r.value);
    });
    const dejar = escuchar('media_session_changed', setSesion);
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar]);

  const hay = sesion?.has_session ?? false;
  return (
    <div className="wg-widget-reproductor">
      {hay ? (
        <div className="wg-fila">
          {sesion?.thumbnail_url ? (
            <img src={sesion.thumbnail_url} alt="" width={64} height={64} />
          ) : (
            <span role="img" aria-label="Música" className="wg-widget-reproductor__icono">
              ♪
            </span>
          )}
          <div>
            <p>{sesion?.title ?? ''}</p>
            <p>{sesion?.artist ?? ''}</p>
          </div>
        </div>
      ) : (
        <p>{textos.SIN_MUSICA}</p>
      )}
      {/* ET07: sin sesión, los controles deshabilitados (RT-04). */}
      <div className="wg-fila">
        <button
          type="button"
          aria-label="Anterior"
          disabled={!hay || !sesion?.can_previous}
          onClick={() => void invocar('media_skip_previous', {})}
        >
          ⏮
        </button>
        <button
          type="button"
          aria-label={sesion?.status === 'playing' ? 'Pausar' : 'Reproducir'}
          disabled={!hay || !sesion?.can_play_pause}
          onClick={() => void invocar('media_toggle_play_pause', {})}
        >
          {sesion?.status === 'playing' ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          disabled={!hay || !sesion?.can_next}
          onClick={() => void invocar('media_skip_next', {})}
        >
          ⏭
        </button>
      </div>
    </div>
  );
}
