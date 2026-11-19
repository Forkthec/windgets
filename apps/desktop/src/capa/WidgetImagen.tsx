import { useEffect, useState } from 'react';
import { urlDeArchivo } from '@/ipc/archivos';
import type { Escuchar } from '@/ipc/eventos';
import type { AssetResolveParams, ImageRef, Invoke } from '@/types';

// Widget Imagen estática en la capa (HE-04-HU07-CA01, CA02): la imagen propia o del catálogo sobre el wallpaper.
// La imagen sale de la configuración del widget (IPC-WID-01) y el archivo, de `asset_resolve`.

export interface WidgetImagenProps {
  widgetId: string;
  invocar: Invoke;
  escuchar: Escuchar;
}

/** El archivo de una imagen de widget: propia o del catálogo de imágenes. */
export function recursoDeImagen(imagen: ImageRef): AssetResolveParams | null {
  if (imagen.source === 'own') {
    return imagen.uploaded_image_id ? { kind: 'uploaded_image', id: imagen.uploaded_image_id } : null;
  }
  return imagen.catalog_image_id ? { kind: 'catalog_image', id: imagen.catalog_image_id } : null;
}

export function WidgetImagen({ widgetId, invocar, escuchar }: WidgetImagenProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      const lista = await invocar('widget_list', {});
      if (!lista.ok) return;
      const config = lista.value.find((w) => w.widget_id === widgetId)?.config;
      const recurso = config && 'source' in config ? recursoDeImagen(config as ImageRef) : null;
      if (!recurso) return;
      const archivo = await invocar('asset_resolve', recurso);
      if (vigente && archivo.ok && archivo.value.state === 'ready') setUrl(urlDeArchivo(archivo.value.url));
    };
    void leer();
    // EV-12: al configurar el widget o al descargarlo de otro computador.
    const dejar = escuchar('widgets_changed', () => void leer());
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar, widgetId]);

  return url ? (
    <img
      className="wg-widget-imagen"
      src={url}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  ) : null;
}
