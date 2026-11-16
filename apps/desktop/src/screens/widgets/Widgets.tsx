import { useCallback, useEffect, useState } from 'react';
import type { WidgetItem } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { Interruptor } from '@/ui/Interruptor/Interruptor';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

// P-WID-01 Widgets (Menú principal > Personalización > Widgets; HE-04-HU01). La lista sale del Núcleo ya en
// orden: primero los widgets por defecto y luego los agregados (IPC-WID-01 widget_list). «Editar escritorio»
// abre la pantalla de edición con HE-05-HU01 (P14); «Configurar» y «Eliminar» actúan con HE-04-HU12 y HU13
// (P21) (docs/DUDAS.md).

/** El tipo que muestra la lista (HE-04-HU01-ET03): «Por defecto», «Externo» (Clima y Noticias) o «Local». */
export function tipoDeWidget(widget: WidgetItem): string {
  if (widget.is_default) return 'Por defecto';
  return widget.type === 'weather' || widget.type === 'news' ? 'Externo' : 'Local';
}

export function Widgets() {
  const { invocar, escuchar } = useNucleo();
  const [widgets, setWidgets] = useState<WidgetItem[] | null>(null);

  const leer = useCallback(async () => {
    const r = await invocar('widget_list', {});
    if (r.ok) setWidgets(r.value);
  }, [invocar]);

  // HE-04-HU02: alterna el widget entre activo e inactivo; el Núcleo lo refleja en el escritorio (EV-12) y la
  // lista vuelve a leer, también si el widget ya no existe (`widget.not_found`).
  const alternar = useCallback(
    async (widget: WidgetItem, activo: boolean) => {
      await invocar('widget_set_active', { widget_id: widget.widget_id, active: activo });
      await leer();
    },
    [invocar, leer],
  );

  useEffect(() => {
    void leer();
    // EV-12: al activar, desactivar, agregar, configurar o eliminar un widget la lista vuelve a leer.
    return escuchar('widgets_changed', () => void leer());
  }, [escuchar, leer]);

  return (
    <main aria-label="Widgets" aria-busy={widgets === null}>
      {/* ET01: «Agregar widget» y «Editar escritorio» encima de la lista. */}
      <div className="wg-fila">
        <Boton principal>Agregar widget</Boton>
        <Boton>Editar escritorio</Boton>
      </div>
      {widgets && (
        <ul className="wg-lista" aria-label="Lista de widgets">
          {widgets.map((w) => (
            // ET03: nombre, tipo, dato que lo distingue, interruptor y las opciones que aplican.
            <li key={w.widget_id} className="wg-fila wg-lista__elemento">
              <span className="wg-lista__nombre">{w.display_name}</span>
              {w.distinguishing_value && <span>{w.distinguishing_value}</span>}
              <span>{tipoDeWidget(w)}</span>
              <Interruptor
                etiqueta={w.is_active ? 'Activo' : 'Inactivo'}
                activo={w.is_active}
                alCambiar={(activo) => void alternar(w, activo)}
              />
              {w.can_configure && <Boton>Configurar</Boton>}
              {w.can_delete && <Boton>Eliminar</Boton>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
