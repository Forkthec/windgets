import { useEffect, useState } from 'react';
import { invocar as invocarNucleo } from '@/ipc/cliente';
import { escuchar as escucharNucleo, type Escuchar } from '@/ipc/eventos';
import { urlDeArchivo } from '@/ipc/archivos';
import { Reloj } from './Reloj';
import { TareasDelDia } from './TareasDelDia';
import { tokensDelTema } from '@/ui/tema/temaAplicado';
import { aplicarTokens } from '@/ui/tema/tokens';
import type {
  AssetResolveParams,
  EventMapPointerForwarded,
  Invoke,
  LayerInitialState,
  ThemeContent,
  WidgetType,
} from '@/types';

// C-02 Capa del wallpaper y los widgets (P-WAL-02, HE-02-HU01). Es la ventana anclada detrás de los íconos del
// escritorio (D-131): pinta el wallpaper del tema aplicado a partir de lo guardado, sin red (IPC-DESK-01; RNF-08).
// Encima pinta los widgets activos del tema aplicado en su posición y tamaño (HE-04-HU01-CA01, CA03). El
// contenido de cada widget llega con su HU: el Reloj (HE-04-HU03) y Tareas del día (HE-06-HU02) ya lo tienen; faltan
// Kanban HE-06-HU05 y Calendario HE-06-HU07 (docs/DUDAS.md).

/** Nombre de cada widget (glosario). */
export const NOMBRE_DEL_WIDGET: Record<WidgetType, string> = {
  clock: 'Reloj',
  calendar: 'Calendario',
  daily_tasks: 'Tareas del día',
  kanban: 'Kanban',
  weather: 'Clima',
  news: 'Noticias',
  music_player: 'Reproductor de música',
  animation: 'Animación',
  image_carousel: 'Carrusel de imágenes',
  static_image: 'Imagen estática',
  text: 'Texto',
};

/** Widgets interactivos: Tareas del día, Kanban, Calendario, Reproductor de música y Noticias (HE-06-HU01-ET01). */
export const INTERACTIVOS: readonly WidgetType[] = [
  'daily_tasks',
  'kanban',
  'calendar',
  'music_player',
  'news',
];

/**
 * EV-18 `pointer_forwarded` (HE-06-HU01-CA01, ET03): la capa no recibe el mouse (está detrás de los íconos,
 * D-186); el Núcleo le reenvía la selección con el botón principal sobre un widget interactivo y la capa la
 * entrega al elemento del widget que está en ese punto. Fuera de un widget interactivo no hace nada (CA02).
 */
export function entregarSeleccion({ x, y }: EventMapPointerForwarded, documento: Document = document) {
  const elemento = documento.elementFromPoint(x, y);
  if (!(elemento instanceof HTMLElement) || !elemento.closest('[data-interactivo="true"]')) return;
  elemento.click();
}

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
      // HE-03-HU06-ET04: los widgets también toman los colores y la tipografía del tema aplicado.
      const tokens = await tokensDelTema(invocar, r.value.applied);
      if (!vigente) return;
      aplicarTokens(tokens);
      setPintado({ estado: r.value, imagen });
    };
    void leer();
    // EV-16: al iniciar o cerrar sesión, o si el wallpaper no se pudo mostrar, la capa vuelve a leer. EV-11: al
    // aplicar un tema se pinta sin reiniciar la aplicación (HE-02-HU12-CA05, ET05).
    const dejarEstado = escuchar('wallpaper_status_changed', () => void leer());
    const dejarTema = escuchar('applied_theme_changed', () => void leer());
    // EV-12: al activar o desactivar un widget la capa lo muestra u oculta en 5 s o menos (HE-04-HU02-ET01).
    const dejarWidgets = escuchar('widgets_changed', () => void leer());
    // EV-13: al guardar la distribución, los widgets se pintan en su nueva posición y tamaño (HE-05-HU04-CA01).
    const dejarDistribucion = escuchar('layout_changed', () => void leer());
    const dejarSeleccion = escuchar('pointer_forwarded', (carga) => entregarSeleccion(carga));
    return () => {
      vigente = false;
      dejarEstado();
      dejarTema();
      dejarWidgets();
      dejarDistribucion();
      dejarSeleccion();
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
    >
      {pintado.estado.widgets.map((w) => (
        <section
          key={w.widget_id}
          aria-label={NOMBRE_DEL_WIDGET[w.type]}
          data-widget-id={w.widget_id}
          data-interactivo={INTERACTIVOS.includes(w.type)}
          style={{ position: 'absolute', left: w.x, top: w.y, width: w.width, height: w.height }}
        >
          {w.type === 'clock' && <Reloj />}
          {w.type === 'daily_tasks' && <TareasDelDia invocar={invocar} escuchar={escuchar} />}
        </section>
      ))}
    </main>
  );
}
