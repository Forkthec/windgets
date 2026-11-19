import { useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, WeatherData, WidgetDataStatus } from '@/types';
import textos from '@/types/messages.es.json';

// Widget Clima en la capa (HE-04-HU05-ET02, ET14): la ciudad, la temperatura redondeada «21 °C» y la condición, en
// ese orden. El dato lo trae el Núcleo de la caché local (IPC-WID-07) y lo actualiza con EV-20 cada 30 min, al
// volver la conexión o al fallar (ET05, ET07, ET08).

export interface WidgetClimaProps {
  widgetId: string;
  invocar: Invoke;
  escuchar: Escuchar;
}

/** ET14: la temperatura redondeada al entero más cercano, como «21 °C». */
export function temperatura(grados: number): string {
  return `${Math.round(grados)} °C`;
}

export function WidgetClima({ widgetId, invocar, escuchar }: WidgetClimaProps) {
  const [estado, setEstado] = useState<WidgetDataStatus>('ok');
  const [clima, setClima] = useState<WeatherData | null>(null);

  useEffect(() => {
    let vigente = true;
    void invocar('widget_get_data', { widget_id: widgetId }).then((r) => {
      if (!vigente || !r.ok) return;
      setEstado(r.value.status);
      if (r.value.payload && 'city' in r.value.payload) setClima(r.value.payload);
    });
    const dejar = escuchar('widget_data_changed', (carga) => {
      if (carga.widget_id !== widgetId) return;
      setEstado(carga.status);
      if (carga.payload && 'city' in carga.payload) setClima(carga.payload);
    });
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar, widgetId]);

  // CA07, CA08: el aviso según el estado (RT-04).
  const aviso =
    estado === 'error'
      ? textos.CLIMA_NO_DISPONIBLE
      : estado === 'offline'
        ? textos.WIDGET_EXTERNO_SIN_CONEXION
        : null;
  return (
    <div className="wg-widget-clima">
      {clima && (
        <>
          <p className="wg-widget-clima__ciudad">{clima.city}</p>
          <p className="wg-widget-clima__temperatura">{temperatura(clima.temperature_c)}</p>
          <p>{clima.condition_text}</p>
        </>
      )}
      {aviso && <p role="status">{aviso}</p>}
    </div>
  );
}
