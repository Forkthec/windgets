import { useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Headline, Invoke, WidgetDataStatus } from '@/types';
import textos from '@/types/messages.es.json';

// Widget Noticias en la capa (HE-04-HU06-ET02): los 5 titulares más recientes con su fuente. El dato lo trae el
// Núcleo de la caché local (IPC-WID-07) y lo actualiza con EV-20 cada 60 min, al volver la conexión o al fallar
// (ET03, ET05, ET06). Abrir un titular en el navegador llega con HE-06-HU10 (P22).

export interface WidgetNoticiasProps {
  widgetId: string;
  invocar: Invoke;
  escuchar: Escuchar;
}

export function WidgetNoticias({ widgetId, invocar, escuchar }: WidgetNoticiasProps) {
  const [estado, setEstado] = useState<WidgetDataStatus>('ok');
  const [titulares, setTitulares] = useState<Headline[]>([]);

  useEffect(() => {
    let vigente = true;
    void invocar('widget_get_data', { widget_id: widgetId }).then((r) => {
      if (!vigente || !r.ok) return;
      setEstado(r.value.status);
      if (r.value.payload && 'headlines' in r.value.payload) setTitulares(r.value.payload.headlines);
    });
    const dejar = escuchar('widget_data_changed', (carga) => {
      if (carga.widget_id !== widgetId) return;
      setEstado(carga.status);
      if (carga.payload && 'headlines' in carga.payload) setTitulares(carga.payload.headlines);
    });
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar, widgetId]);

  // CA03, CA04: el aviso según el estado (RT-04).
  const aviso =
    estado === 'error'
      ? textos.NOTICIAS_NO_DISPONIBLES
      : estado === 'offline'
        ? textos.WIDGET_EXTERNO_SIN_CONEXION
        : null;
  return (
    <div className="wg-widget-noticias">
      <ul aria-label="Titulares">
        {titulares.slice(0, 5).map((t) => (
          <li key={t.url}>
            <span>{t.title}</span> <span>{t.source}</span>
          </li>
        ))}
      </ul>
      {aviso && <p role="status">{aviso}</p>}
    </div>
  );
}
