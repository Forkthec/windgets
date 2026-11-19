import { useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke } from '@/types';

// Widget Texto en la capa (HE-04-HU10-CA01, CA04; ET04, D-041): el texto con la tipografía del tema (fuente y
// tamaño) y el color del texto del tema, que la capa aplica a todos los widgets como variables CSS (HE-03-HU06-ET04).

export interface WidgetTextoProps {
  widgetId: string;
  invocar: Invoke;
  escuchar: Escuchar;
}

export function WidgetTexto({ widgetId, invocar, escuchar }: WidgetTextoProps) {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      const lista = await invocar('widget_list', {});
      if (!vigente || !lista.ok) return;
      const config = lista.value.find((w) => w.widget_id === widgetId)?.config;
      if (config && 'text' in config) setTexto(config.text);
    };
    void leer();
    // EV-12: al configurar el texto (HE-04-HU12).
    const dejar = escuchar('widgets_changed', () => void leer());
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar, widgetId]);

  return (
    <p className="wg-widget-texto" style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {texto}
    </p>
  );
}
