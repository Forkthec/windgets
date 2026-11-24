import { useEffect, useRef } from 'react';
import textos from '@/types/messages.es.json';
import type { WallpaperState } from '@/types';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from './VentanaPrincipal';

// HE-02-HU01-CA04, ET06: si el wallpaper aplicado no se pudo mostrar, la ventana principal lo avisa. El estado lo
// da el Host del wallpaper (IPC-DESK-02) y cambia con EV-16. rediseno_final_backend.md §3.4 (P45, RD-64): antes era un
// aviso fijo que nunca se iba; ahora es un mensaje emergente de advertencia (6 s) que se muestra una vez cada vez que
// el estado pasa a `fallback_default`.
export function AvisoDelWallpaper() {
  const { invocar, escuchar } = useNucleo();
  const mostrar = useMensajeDeResultado();
  const anterior = useRef<WallpaperState | null>(null);

  useEffect(() => {
    let vigente = true;
    const recibir = (estado: WallpaperState) => {
      if (estado === 'fallback_default' && anterior.current !== 'fallback_default')
        mostrar(textos.NO_SE_PUDO_MOSTRAR_EL_WALLPAPER, 'advertencia');
      anterior.current = estado;
    };
    void invocar('wallpaper_get_status', {}).then((r) => {
      if (vigente && r.ok) recibir(r.value.state);
    });
    const dejar = escuchar('wallpaper_status_changed', (carga) => recibir(carga.state));
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar, mostrar]);

  return null;
}
