import { useEffect, useState } from 'react';
import textos from '@/types/messages.es.json';
import type { WallpaperState } from '@/types';
import { Aviso } from '@/ui/Aviso/Aviso';
import { useNucleo } from './VentanaPrincipal';

// HE-02-HU01-CA04, ET06: si el wallpaper aplicado no se pudo mostrar, la ventana principal lo avisa (tipo aviso
// de RT-04). El estado lo da el Host del wallpaper (IPC-DESK-02) y cambia con EV-16.
export function AvisoDelWallpaper() {
  const { invocar, escuchar } = useNucleo();
  const [estado, setEstado] = useState<WallpaperState | null>(null);

  useEffect(() => {
    let vigente = true;
    void invocar('wallpaper_get_status', {}).then((r) => {
      if (vigente && r.ok) setEstado(r.value.state);
    });
    const dejar = escuchar('wallpaper_status_changed', (carga) => setEstado(carga.state));
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar]);

  return estado === 'fallback_default' ? <Aviso texto={textos.NO_SE_PUDO_MOSTRAR_EL_WALLPAPER} /> : null;
}
