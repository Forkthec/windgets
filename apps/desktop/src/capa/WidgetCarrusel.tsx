import { useEffect, useState } from 'react';
import { urlDeArchivo } from '@/ipc/archivos';
import type { Escuchar } from '@/ipc/eventos';
import type { CarouselConfig, Invoke } from '@/types';
import { recursoDeImagen } from './WidgetImagen';

// Widget Carrusel de imágenes en la capa (HE-04-HU08-CA01, ET02, ET04): las imágenes una tras otra, en el orden
// elegido, cambiando cada `interval_seconds` segundos (5 por defecto).

export interface WidgetCarruselProps {
  widgetId: string;
  invocar: Invoke;
  escuchar: Escuchar;
}

export function WidgetCarrusel({ widgetId, invocar, escuchar }: WidgetCarruselProps) {
  const [urls, setUrls] = useState<string[]>([]);
  const [segundos, setSegundos] = useState(5);
  const [actual, setActual] = useState(0);

  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      const lista = await invocar('widget_list', {});
      if (!lista.ok) return;
      const config = lista.value.find((w) => w.widget_id === widgetId)?.config;
      if (!config || !('items' in config)) return;
      const carrusel = config as CarouselConfig;
      const leidas: string[] = [];
      for (const imagen of carrusel.items) {
        const recurso = recursoDeImagen(imagen);
        if (!recurso) continue;
        const archivo = await invocar('asset_resolve', recurso);
        if (archivo.ok && archivo.value.state === 'ready') leidas.push(urlDeArchivo(archivo.value.url));
      }
      if (!vigente) return;
      setUrls(leidas);
      setSegundos(carrusel.interval_seconds ?? 5);
    };
    void leer();
    const dejar = escuchar('widgets_changed', () => void leer());
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar, widgetId]);

  useEffect(() => {
    if (urls.length < 2) return;
    const id = setInterval(() => setActual((i) => (i + 1) % urls.length), segundos * 1000);
    return () => clearInterval(id);
  }, [segundos, urls.length]);

  const url = urls[actual % Math.max(urls.length, 1)];
  return url ? (
    <img
      className="wg-widget-imagen"
      src={url}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  ) : null;
}
