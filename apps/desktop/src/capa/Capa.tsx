import { useEffect, useState } from 'react';
import { invocar as invocarNucleo } from '@/ipc/cliente';
import { escuchar as escucharNucleo, type Escuchar } from '@/ipc/eventos';
import { urlDeArchivo } from '@/ipc/archivos';
import type { AssetResolveParams, Invoke, LayerInitialState, ThemeContent } from '@/types';

// C-02 Capa del wallpaper y los widgets (P-WAL-02, HE-02-HU01). Es la ventana anclada detrás de los íconos del
// escritorio (D-131): pinta el wallpaper del tema aplicado a partir de lo guardado, sin red (IPC-DESK-01; RNF-08).
// Los widgets llegan con P07 (docs/DUDAS.md).

/** El archivo del fondo del tema: la imagen propia, la del catálogo o la de la plantilla. */
export function recursoDelFondo(contenido: ThemeContent): AssetResolveParams | null {
  const { background, template_id } = contenido;
  switch (background.source) {
    case 'own':
      return background.uploaded_image_id
        ? { kind: 'uploaded_image', id: background.uploaded_image_id }
        : null;
    case 'catalog':
      return background.catalog_image_id ? { kind: 'catalog_image', id: background.catalog_image_id } : null;
    case 'template_default':
      return { kind: 'catalog_template', id: template_id };
  }
}

interface Pintado {
  estado: LayerInitialState;
  imagen: string | null;
}

export interface CapaProps {
  invocar?: Invoke;
  escuchar?: Escuchar;
}

export function Capa({ invocar = invocarNucleo, escuchar = escucharNucleo }: CapaProps) {
  const [pintado, setPintado] = useState<Pintado | null>(null);

  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      const r = await invocar('layer_get_initial_state', {});
      if (!r.ok) return;
      let imagen: string | null = null;
      const recurso = r.value.wallpaper_state === 'hidden' ? null : recursoDelFondo(r.value.applied);
      if (recurso) {
        const archivo = await invocar('asset_resolve', recurso);
        if (archivo.ok && archivo.value.state === 'ready') imagen = urlDeArchivo(archivo.value.url);
      }
      if (vigente) setPintado({ estado: r.value, imagen });
    };
    void leer();
    // EV-16: al iniciar o cerrar sesión, o si el wallpaper no se pudo mostrar, la capa vuelve a leer. EV-11: al
    // aplicar un tema se pinta sin reiniciar la aplicación (HE-02-HU12-CA05, ET05).
    const dejarEstado = escuchar('wallpaper_status_changed', () => void leer());
    const dejarTema = escuchar('applied_theme_changed', () => void leer());
    return () => {
      vigente = false;
      dejarEstado();
      dejarTema();
    };
  }, [escuchar, invocar]);

  // Sin sesión la capa no pinta y se ve el fondo original de Windows (HE-02-HU01-CA05, ET07).
  if (!pintado || pintado.estado.wallpaper_state === 'hidden') return null;

  const { colors } = pintado.estado.applied;
  return (
    <main
      aria-label="Wallpaper"
      style={{
        position: 'fixed',
        inset: 0,
        background: colors.primary,
        color: colors.text,
        // La imagen cubre el escritorio sin deformarse (HE-02-HU03-ET05).
        ...(pintado.imagen
          ? {
              backgroundImage: `url("${pintado.imagen}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}),
      }}
    />
  );
}
