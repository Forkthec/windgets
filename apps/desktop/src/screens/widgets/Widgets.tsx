import { useCallback, useEffect, useState } from 'react';
import { escucharResultadoDeLaEdicion } from '@/ipc/resultadoDeLaEdicion';
import { useRuta } from '@/reglas/ruta';
import type { WidgetItem } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';
import { Interruptor } from '@/ui/Interruptor/Interruptor';
import { useMensajeDeResultado } from '@/ui/MensajeResultado/MensajeResultado';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { AgregarWidget } from './AgregarWidget';
import { FormularioDeWidget } from './FormularioDeWidget';

// P-WID-01 Widgets (Menú principal > Personalización > Widgets; HE-04-HU01). La lista sale del Núcleo ya en
// orden: primero los widgets por defecto y luego los agregados (IPC-WID-01 widget_list). «Editar escritorio»
// abre la pantalla de edición con HE-05-HU01; «Eliminar» actúa con HE-04-HU13 y «Configurar» con HE-04-HU12
// (P21) (docs/DUDAS.md).

/** El tipo que muestra la lista (HE-04-HU01-ET03): «Por defecto», «Externo» (Clima y Noticias) o «Local». */
export function tipoDeWidget(widget: WidgetItem): string {
  if (widget.is_default) return 'Por defecto';
  return widget.type === 'weather' || widget.type === 'news' ? 'Externo' : 'Local';
}

export function Widgets() {
  const { invocar, escuchar } = useNucleo();
  const mostrarResultado = useMensajeDeResultado();
  const [widgets, setWidgets] = useState<WidgetItem[] | null>(null);
  // HE-04-HU13: el widget del mensaje de confirmación M-07.
  const [porEliminar, setPorEliminar] = useState<WidgetItem | null>(null);
  // HE-04-HU12: el widget que se está configurando (Formulario de widget).
  const [porConfigurar, setPorConfigurar] = useState<WidgetItem | null>(null);
  // T-064: «Agregar widget» abre la subpantalla Agregar widget (HE-04-HU04-CA01).
  const ruta = useRuta<'widgets' | 'agregar'>('widgets');

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

  // HE-04-HU13-CA01, CA04, CA05: lo quita de la cuenta y de todos los temas, con «Widget eliminado.».
  const eliminar = async (widget: WidgetItem) => {
    setPorEliminar(null);
    const r = await invocar('widget_delete', { widget_id: widget.widget_id });
    mostrarResultado(r.ok ? (r.result_message?.message ?? '') : r.error.message);
    await leer();
  };

  useEffect(() => {
    void leer();
    // EV-12: al activar, desactivar, agregar, configurar o eliminar un widget la lista vuelve a leer.
    const dejarWidgets = escuchar('widgets_changed', () => void leer());
    // HE-04-HU09-ET07: al pausar o reanudar una animación por alto consumo de recursos (EV-21).
    const dejarPausa = escuchar('animation_pause_changed', () => void leer());
    return () => {
      dejarWidgets();
      dejarPausa();
    };
  }, [escuchar, leer]);

  // HE-05-HU04, HU05: al cerrar la pantalla de edición, el Núcleo vuelve a esta pantalla con «Cambios guardados.»
  // o «No se guardaron cambios.» (sin cambios, sin mensaje).
  useEffect(
    () =>
      escucharResultadoDeLaEdicion((mensaje) => {
        mostrarResultado(mensaje.message);
        void leer();
      }),
    [leer, mostrarResultado],
  );

  if (ruta.actual === 'agregar') return <AgregarWidget alRegresar={ruta.regresar} />;

  return (
    <main aria-label="Widgets" aria-busy={widgets === null}>
      {/* ET01: «Agregar widget» y «Editar escritorio» encima de la lista. */}
      <div className="wg-fila">
        <Boton principal onClick={() => ruta.avanzar('agregar')}>
          Agregar widget
        </Boton>
        {/* HE-05-HU01-ET05: oculta esta ventana y abre la pantalla de edición (IPC-LAY-01). */}
        <Boton onClick={() => void invocar('layout_edit_open', {})}>Editar escritorio</Boton>
      </div>
      {widgets && (
        <ul className="wg-lista" aria-label="Lista de widgets">
          {widgets.map((w) => (
            // ET03: nombre, tipo, dato que lo distingue, interruptor y las opciones que aplican.
            <li key={w.widget_id} className="wg-fila wg-lista__elemento">
              <span className="wg-lista__nombre">{w.display_name}</span>
              {w.distinguishing_value && <span>{w.distinguishing_value}</span>}
              <span>{tipoDeWidget(w)}</span>
              {w.paused_by_load && <span>{textos.ANIMACION_EN_PAUSA}</span>}
              <Interruptor
                etiqueta={w.is_active ? 'Activo' : 'Inactivo'}
                activo={w.is_active}
                alCambiar={(activo) => void alternar(w, activo)}
              />
              {w.can_configure && <Boton onClick={() => setPorConfigurar(w)}>Configurar</Boton>}
              {/* HE-04-HU13-ET04: en los widgets por defecto, deshabilitada con su motivo (RT-04). */}
              <Boton
                disabled={!w.can_delete}
                motivo={textos.WIDGET_POR_DEFECTO_NO_ELIMINABLE}
                onClick={() => setPorEliminar(w)}
              >
                Eliminar
              </Boton>
            </li>
          ))}
        </ul>
      )}
      {porConfigurar && (
        <FormularioDeWidget
          widget={porConfigurar}
          alGuardar={() => {
            setPorConfigurar(null);
            void leer();
          }}
          alCancelar={() => setPorConfigurar(null)}
        />
      )}
      {porEliminar && (
        // M-07 (HE-04-HU13-CA06, ET01). DUDA: HE-04-HU13 M-07 no define el título. Valor usado: «Eliminar», como M-08.
        <Confirmacion
          titulo="Eliminar"
          texto={textos.CONFIRMAR_ELIMINAR_WIDGET.replace('<nombre del widget>', porEliminar.display_name)}
          opcionPrincipal="Eliminar"
          alConfirmar={() => void eliminar(porEliminar)}
          // CA03, ET07: se cierra sin cambios.
          alCancelar={() => setPorEliminar(null)}
        />
      )}
    </main>
  );
}
