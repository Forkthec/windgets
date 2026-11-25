import { useCallback, useEffect, useState } from 'react';
import type { Escuchar } from '@/ipc/eventos';
import type { Invoke, WallpaperFit, WallpaperFitSettings } from '@/types';
import { Selector } from '@/ui/Selector/Selector';
import { textoDelError } from '@/ipc/textoDelError';

// HE-02-HU14 (P29) · Ajuste de la imagen de fondo en cada monitor, como en Windows. Es propio de este computador:
// se guarda y se pinta al elegirlo, sin «Guardar» ni «Aplicar» (no es parte del tema). Hasta 6 monitores; los demás
// usan el ajuste del principal (CA06).

export const AJUSTES: { valor: WallpaperFit; texto: string }[] = [
  { valor: 'fill', texto: 'Rellenar' },
  { valor: 'fit', texto: 'Ajustar' },
  { valor: 'stretch', texto: 'Expandir' },
  { valor: 'tile', texto: 'Mosaico' },
  { valor: 'center', texto: 'Centrar' },
  { valor: 'span', texto: 'Extender' },
];

export interface AjusteDelFondoProps {
  invocar: Invoke;
  escuchar: Escuchar;
}

export function AjusteDelFondo({ invocar, escuchar }: AjusteDelFondoProps) {
  const [ajustes, setAjustes] = useState<WallpaperFitSettings | null>(null);
  const [mensaje, setMensaje] = useState<{ monitor: string; texto: string } | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('wallpaper_fit_get', {});
    if (r.ok) setAjustes(r.value);
  }, [invocar]);

  useEffect(() => {
    void leer();
    // EV-17: al conectar o desconectar un monitor, la lista se actualiza (CA07).
    return escuchar('monitors_changed', () => void leer());
  }, [escuchar, leer]);

  const elegir = async (monitor_id: string, fit: WallpaperFit) => {
    const r = await invocar('wallpaper_fit_set', { monitor_id, fit });
    if (!r.ok) {
      // CA06, CA07: el motivo va junto al monitor y la lista se vuelve a leer.
      setMensaje({ monitor: monitor_id, texto: textoDelError(r.error) });
      void leer();
      return;
    }
    setMensaje(null);
    setAjustes(r.value);
  };

  if (!ajustes || ajustes.monitors.length === 0) return null;
  const varios = ajustes.monitors.length + ajustes.other_monitors > 1;
  return (
    <div role="group" aria-label="Ajuste de la imagen por monitor">
      {ajustes.monitors.map((m) => (
        <Selector
          key={m.monitor_id}
          // Con un solo monitor no hace falta nombrarlo.
          etiqueta={
            varios
              ? `Ajuste del monitor ${m.number}${m.is_primary ? ' (principal)' : ''}`
              : 'Ajuste de la imagen'
          }
          valor={m.fit}
          // Extender necesita más de un monitor.
          opciones={AJUSTES.filter((a) => varios || a.valor !== 'span')}
          alCambiar={(fit) => void elegir(m.monitor_id, fit as WallpaperFit)}
          mensaje={mensaje?.monitor === m.monitor_id ? mensaje.texto : undefined}
        />
      ))}
      {ajustes.monitors.some((m) => m.fit === 'span') && (
        <p>Extender pone una sola imagen sobre todos los monitores.</p>
      )}
      {ajustes.other_monitors > 0 && (
        <p>
          {ajustes.other_monitors === 1
            ? 'El otro monitor usa el ajuste del monitor principal.'
            : `Los otros ${ajustes.other_monitors} monitores usan el ajuste del monitor principal.`}
        </p>
      )}
    </div>
  );
}
