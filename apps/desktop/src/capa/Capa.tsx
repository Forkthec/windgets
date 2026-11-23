import { useEffect, useRef, useState } from 'react';
import { invocar as invocarNucleo } from '@/ipc/cliente';
import { escuchar as escucharNucleo, type Escuchar } from '@/ipc/eventos';
import { escucharArrastreReenviado, type EscucharArrastre } from '@/ipc/arrastreReenviado';
import { desplazarConLaRueda, escucharRuedaReenviada, type EscucharRueda } from '@/ipc/ruedaReenviada';
import { urlDeArchivo } from '@/ipc/archivos';
import { Reloj } from './Reloj';
import { TareasDelDia } from './TareasDelDia';
import { WidgetCalendario } from './WidgetCalendario';
import { WidgetKanban } from './WidgetKanban';
import { WidgetClima } from './WidgetClima';
import { WidgetNoticias } from './WidgetNoticias';
import { WidgetImagen } from './WidgetImagen';
import { WidgetCarrusel } from './WidgetCarrusel';
import { WidgetAnimacion } from './WidgetAnimacion';
import { WidgetTexto } from './WidgetTexto';
import { WidgetReproductor } from './WidgetReproductor';
import { fondosPorMonitor } from './fondo';
import { tokensDelTema } from '@/ui/tema/temaAplicado';
import { aplicarTokens } from '@/ui/tema/tokens';
import type {
  AssetResolveParams,
  EventMapPointerReleased,
  Invoke,
  LayerInitialState,
  Monitor,
  ThemeContent,
  WidgetRect,
  WidgetType,
} from '@/types';

// C-02 Capa del wallpaper y los widgets (P-WAL-02, HE-02-HU01). Es la ventana anclada detrás de los íconos del
// escritorio (D-131): pinta el wallpaper del tema aplicado a partir de lo guardado, sin red (IPC-DESK-01; RNF-08).
// Encima pinta los widgets activos del tema aplicado en su posición y tamaño (HE-04-HU01-CA01, CA03). El
// contenido de cada widget llega con su HU: el Reloj (HE-04-HU03), Tareas del día (HE-06-HU02), Kanban
// (HE-06-HU05) y Calendario (HE-06-HU07); los opcionales llegan en P21 y P22 (docs/DUDAS.md).

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
 * EV-27 `pointer_released` (HE-06-HU01-CA01, ET03; HE-06-HU08-ET08): la capa no recibe el mouse (está detrás de
 * los íconos, D-186); el Núcleo le reenvía la selección con el botón principal sobre un widget interactivo, al
 * soltarlo sin mover el puntero más de 4 píxeles, y la capa la entrega al elemento del widget que está en ese
 * punto. Fuera de un widget interactivo no hace nada (CA02). EV-18 `pointer_forwarded`, al presionar, solo
 * empieza el drag-and-drop del widget Kanban (HE-06-HU06).
 */
export function entregarSeleccion({ x, y }: EventMapPointerReleased, documento: Document = document) {
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

/** El monitor principal, como en el Núcleo (`monitor_principal`): el que contiene el origen, o el primero. */
export function monitorPrincipal(monitores: readonly Monitor[]): Monitor {
  return (
    monitores.find((m) => m.x <= 0 && 0 < m.x + m.width && m.y <= 0 && 0 < m.y + m.height) ??
    monitores[0] ?? { id: '0', x: 0, y: 0, width: 1920, height: 1080, scale_factor: 1 }
  );
}

/**
 * HE-05-HU02-ET07: las medidas de los widgets están en píxeles físicos del monitor; la ventana las dibuja en
 * píxeles de pantalla, divididos por la escala de Windows del monitor principal (100 %, 125 %, 150 %…).
 */
export function aEscala(w: WidgetRect, monitor: Monitor, origen = { x: 0, y: 0 }) {
  const escala = monitor.scale_factor > 0 ? monitor.scale_factor : 1;
  return {
    left: (w.x - origen.x) / escala,
    top: (w.y - origen.y) / escala,
    width: w.width / escala,
    height: w.height / escala,
  };
}

interface Pintado {
  estado: LayerInitialState;
  imagen: string | null;
}

export interface CapaProps {
  invocar?: Invoke;
  escuchar?: Escuchar;
  /** El arrastre que sigue a una selección reenviada (HE-06-HU06). */
  escucharArrastre?: EscucharArrastre;
  /** La rueda del mouse sobre un widget (HE-06-HU01-CA09). */
  escucharRueda?: EscucharRueda;
}

export function Capa({
  invocar = invocarNucleo,
  escuchar = escucharNucleo,
  escucharArrastre = escucharArrastreReenviado,
  escucharRueda = escucharRuedaReenviada,
}: CapaProps) {
  const [pintado, setPintado] = useState<Pintado | null>(null);
  // HE-05-HU04-ET05: varias lecturas pueden cruzarse (guardar la distribución avisa con EV-13 y otros eventos);
  // solo la última pinta, para que una lectura vieja no deje los widgets donde estaban.
  const lectura = useRef(0);

  useEffect(() => {
    let vigente = true;
    const leer = async () => {
      const numero = ++lectura.current;
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
      if (!vigente || numero !== lectura.current) return;
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
    // EV-17: al cambiar un monitor o la escala de Windows, la capa vuelve a leer los monitores y dibuja los widgets
    // con la escala nueva, sin reiniciar la aplicación (RNF-34, HE-05-HU02-ET07; P26).
    const dejarMonitores = escuchar('monitors_changed', () => void leer());
    // EV-30 (HE-02-HU14; P29): al cambiar el ajuste del fondo de un monitor, se pinta sin reiniciar.
    const dejarAjuste = escuchar('wallpaper_fit_changed', () => void leer());
    const dejarSeleccion = escuchar('pointer_released', (carga) => entregarSeleccion(carga));
    // HE-06-HU01-CA09 (P29): la rueda sobre un widget desplaza su contenido.
    const dejarRueda = escucharRueda((rueda) => void desplazarConLaRueda(rueda));
    return () => {
      vigente = false;
      dejarEstado();
      dejarTema();
      dejarWidgets();
      dejarDistribucion();
      dejarMonitores();
      dejarAjuste();
      dejarSeleccion();
      dejarRueda();
    };
  }, [escuchar, escucharRueda, invocar]);

  // Sin sesión la capa no pinta y se ve el fondo original de Windows (HE-02-HU01-CA05, ET07).
  if (!pintado || pintado.estado.wallpaper_state === 'hidden') return null;

  const { colors } = pintado.estado.applied;
  // HE-02-HU14 (P29): cada monitor con su ajuste; `null` es Extender (una sola imagen sobre todos).
  const principal = monitorPrincipal(pintado.estado.monitors);
  const fondos = pintado.imagen
    ? fondosPorMonitor(pintado.estado.monitors, pintado.estado.wallpaper_fit ?? [], principal.scale_factor)
    : null;
  return (
    <main
      aria-label="Wallpaper"
      style={{
        position: 'fixed',
        inset: 0,
        background: colors.primary,
        color: colors.text,
        // La imagen cubre el escritorio sin deformarse (HE-02-HU03-ET05).
        ...(pintado.imagen && !fondos
          ? {
              backgroundImage: `url("${pintado.imagen}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}),
      }}
    >
      {pintado.imagen &&
        fondos?.map((f) => (
          <div
            key={f.monitor_id}
            className="wg-fondo"
            data-monitor-id={f.monitor_id}
            aria-hidden="true"
            style={{ ...f.estilo, backgroundImage: `url("${pintado.imagen}")` }}
          />
        ))}
      {pintado.estado.widgets.map((w) => (
        <section
          key={w.widget_id}
          aria-label={NOMBRE_DEL_WIDGET[w.type]}
          className="wg-widget"
          data-widget-id={w.widget_id}
          data-interactivo={INTERACTIVOS.includes(w.type)}
          style={{ position: 'absolute', ...aEscala(w, monitorPrincipal(pintado.estado.monitors)) }}
        >
          {w.type === 'clock' && <Reloj invocar={invocar} escuchar={escuchar} />}
          {w.type === 'daily_tasks' && <TareasDelDia invocar={invocar} escuchar={escuchar} />}
          {w.type === 'kanban' && (
            <WidgetKanban invocar={invocar} escuchar={escuchar} escucharArrastre={escucharArrastre} />
          )}
          {w.type === 'calendar' && <WidgetCalendario invocar={invocar} escuchar={escuchar} />}
          {w.type === 'weather' && (
            <WidgetClima widgetId={w.widget_id} invocar={invocar} escuchar={escuchar} />
          )}
          {w.type === 'news' && (
            <WidgetNoticias widgetId={w.widget_id} invocar={invocar} escuchar={escuchar} />
          )}
          {w.type === 'static_image' && (
            <WidgetImagen widgetId={w.widget_id} invocar={invocar} escuchar={escuchar} />
          )}
          {w.type === 'image_carousel' && (
            <WidgetCarrusel widgetId={w.widget_id} invocar={invocar} escuchar={escuchar} />
          )}
          {w.type === 'animation' && (
            <WidgetAnimacion widgetId={w.widget_id} invocar={invocar} escuchar={escuchar} />
          )}
          {w.type === 'text' && <WidgetTexto widgetId={w.widget_id} invocar={invocar} escuchar={escuchar} />}
          {w.type === 'music_player' && <WidgetReproductor invocar={invocar} escuchar={escuchar} />}
        </section>
      ))}
    </main>
  );
}
