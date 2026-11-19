import { useEffect, useRef, useState } from 'react';
import { urlDeArchivo } from '@/ipc/archivos';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke } from '@/types';

// Widget Animación en la capa (HE-04-HU09): reproduce la animación del catálogo de forma continua (CA01). Con alto
// consumo de recursos (EV-21) se pausa en el cuadro actual y muestra el ícono de pausa en una esquina; al reanudar
// sigue desde ese cuadro (CA04, CA05, ET07).

export interface WidgetAnimacionProps {
  widgetId: string;
  invocar: Invoke;
  escuchar: Escuchar;
}

export function WidgetAnimacion({ widgetId, invocar, escuchar }: WidgetAnimacionProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [enPausa, setEnPausa] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      const lista = await invocar('widget_list', {});
      if (!lista.ok) return;
      const w = lista.value.find((x) => x.widget_id === widgetId);
      if (!w) return;
      setEnPausa(w.paused_by_load);
      const config = w.config;
      if (!('animation_id' in config)) return;
      const archivo = await invocar('asset_resolve', { kind: 'catalog_animation', id: config.animation_id });
      if (vigente && archivo.ok && archivo.value.state === 'ready') setUrl(urlDeArchivo(archivo.value.url));
    };
    void leer();
    const dejarWidgets = escuchar('widgets_changed', () => void leer());
    const dejarPausa = escuchar('animation_pause_changed', (carga) => {
      if (carga.widget_ids.includes(widgetId)) setEnPausa(carga.paused);
    });
    return () => {
      vigente = false;
      dejarWidgets();
      dejarPausa();
    };
  }, [escuchar, invocar, widgetId]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (enPausa) v.pause();
    else void v.play()?.catch(() => undefined);
  }, [enPausa, url]);

  return (
    <div className="wg-widget-animacion" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {url && (
        <video
          ref={video}
          src={url}
          autoPlay={!enPausa}
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {enPausa && (
        <span
          role="img"
          aria-label="En pausa"
          className="wg-widget-animacion__pausa"
          style={{ position: 'absolute', top: 4, right: 4 }}
        >
          ⏸
        </span>
      )}
    </div>
  );
}
