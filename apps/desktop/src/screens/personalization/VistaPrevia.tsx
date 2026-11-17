import type { CSSProperties } from 'react';
import { NOMBRE_DEL_WIDGET } from '@/capa/Capa';
import type { Monitor, ThemeContent, WidgetRect } from '@/types';
import { derivarTokens } from '@/ui/tema/derivar';

// Vista previa del escritorio de Personalización del wallpaper (HE-02-HU09): el wallpaper y los widgets activos
// con los cambios del tema en edición, antes de aplicarlos (ET01, ET03). Se pinta con lo que devuelve el Núcleo
// en cada cambio, sin tocar el escritorio (ET04).
// DUDA: HE-02-HU09 ningún contrato da los widgets del tema en edición. Valor usado: los widgets activos y el
// monitor principal que pinta la capa (IPC-DESK-01, el tema aplicado), a escala (docs/DUDAS.md).

export interface VistaPreviaProps {
  contenido: ThemeContent;
  /** La imagen de fondo que se muestra, si la hay. */
  imagen?: string;
  /** Familia CSS y tamaño del texto (HE-02-HU06). */
  fuente?: string;
  tamano: string;
  widgets: WidgetRect[];
  monitor: Monitor | null;
}

const porcentaje = (valor: number, total: number) => `${(valor / total) * 100}%`;

export function VistaPrevia({ contenido, imagen, fuente, tamano, widgets, monitor }: VistaPreviaProps) {
  const { colors } = contenido;
  const tokens = derivarTokens({
    primary: colors.primary,
    secondary: colors.secondary,
    text: colors.text,
    fuente: fuente ?? '',
    tamano,
  });
  const estilo: CSSProperties = {
    background: colors.primary,
    color: colors.text,
    fontFamily: fuente,
    fontSize: tamano,
    // HE-02-HU03-ET05: la imagen se ajusta al escritorio sin deformarse.
    ...(imagen
      ? { backgroundImage: `url("${imagen}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {}),
  };
  return (
    <section aria-label="Vista previa del escritorio" className="wg-vista-previa" style={estilo}>
      {monitor &&
        widgets
          .filter((w) => w.is_active)
          .map((w) => (
            // ET03: los widgets activos, con el fondo y la tinta del tema (interfaz.md, «Tema a tokens»).
            <div
              key={w.widget_id}
              role="img"
              aria-label={NOMBRE_DEL_WIDGET[w.type]}
              className="wg-vista-previa__widget"
              style={{
                left: porcentaje(w.x - monitor.x, monitor.width),
                top: porcentaje(w.y - monitor.y, monitor.height),
                width: porcentaje(w.width, monitor.width),
                height: porcentaje(w.height, monitor.height),
                background: tokens.superficie,
                color: tokens.tinta,
                borderColor: tokens.borde,
              }}
            >
              {NOMBRE_DEL_WIDGET[w.type]}
            </div>
          ))}
    </section>
  );
}
