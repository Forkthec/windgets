import { useCallback, useEffect, useRef, useState, type PointerEvent as EventoDePuntero } from 'react';
import { NOMBRE_DEL_WIDGET, recursoDelFondo } from '@/capa/Capa';
import { urlDeArchivo } from '@/ipc/archivos';
import { invocar as invocarNucleo } from '@/ipc/cliente';
import { escuchar as escucharNucleo, type Escuchar } from '@/ipc/eventos';
import type { Invoke, LayerInitialState, Monitor, WidgetRect } from '@/types';
import textos from '@/types/messages.es.json';
import { Boton } from '@/ui/Boton/Boton';
import { Confirmacion } from '@/ui/Confirmacion/Confirmacion';

// C-03 Pantalla de edición de la distribución (HE-05): a pantalla completa sobre el escritorio, sin menú principal
// (HE-05-HU01-ET01). Pinta el wallpaper y los widgets activos en su posición y tamaño reales (ET02), cada uno con
// un borde que indica que se puede mover y redimensionar (ET03), y la barra superior (ET04). Las reglas de mover y
// redimensionar (área visible, sin superponerse, 100 × 100) viven en el Núcleo (IPC-LAY-02, 03).

/** El monitor principal, como en el Núcleo (`monitor_principal`). */
function principal(monitores: Monitor[]): Monitor {
  return (
    monitores.find((m) => m.x <= 0 && 0 < m.x + m.width && m.y <= 0 && 0 < m.y + m.height) ??
    monitores[0] ?? { id: '0', x: 0, y: 0, width: 1920, height: 1080, scale_factor: 1 }
  );
}

const seSuperponen = (a: WidgetRect, b: WidgetRect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

interface Arrastre {
  widgetId: string;
  modo: 'mover' | 'redimensionar';
  inicioX: number;
  inicioY: number;
  rect: WidgetRect;
}

export interface EdicionProps {
  invocar?: Invoke;
  escuchar?: Escuchar;
}

export function Edicion({ invocar = invocarNucleo, escuchar = escucharNucleo }: EdicionProps) {
  const [estado, setEstado] = useState<{ monitor: Monitor; imagen: string | null; fondo: string } | null>(
    null,
  );
  const [widgets, setWidgets] = useState<WidgetRect[]>([]);
  // HE-05-HU02-ET04, HE-05-HU03-CA04: los widgets que se superponen mientras se mueve o se redimensiona.
  const [choques, setChoques] = useState<string[]>([]);
  const [salida, setSalida] = useState(false);
  // HE-15-HU04-CA08: aviso al recibir una distribución más reciente de otro computador con cambios sin guardar.
  const [avisoRemoto, setAvisoRemoto] = useState(false);
  useEffect(
    () =>
      escuchar('layout_changed', (carga) => {
        if (carga.origin !== 'remote') return;
        void invocar('layout_edit_get_status', {}).then((r) => {
          if (r.ok && r.value.dirty) setAvisoRemoto(true);
        });
      }),
    [escuchar, invocar],
  );
  const arrastre = useRef<Arrastre | null>(null);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      const r = await invocar('layer_get_initial_state', {});
      if (!r.ok || !vigente) return;
      const capa: LayerInitialState = r.value;
      const recurso = recursoDelFondo(capa.applied);
      let imagen: string | null = null;
      if (recurso) {
        const archivo = await invocar('asset_resolve', recurso);
        if (archivo.ok && archivo.value.state === 'ready') imagen = urlDeArchivo(archivo.value.url);
      }
      if (!vigente) return;
      setEstado({ monitor: principal(capa.monitors), imagen, fondo: capa.applied.colors.primary });
      setWidgets(capa.widgets.filter((w) => w.is_active));
    })();
    return () => {
      vigente = false;
    };
  }, [invocar]);

  // HE-05-HU05: «Cancelar» o Esc. Con cambios, M-02; sin cambios, cierra sin mensaje (CA05, ET06; D-204).
  const cancelar = useCallback(async () => {
    const r = await invocar('layout_edit_get_status', {});
    if (r.ok && r.value.dirty) setSalida(true);
    else await invocar('layout_edit_cancel', {});
  }, [invocar]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !salida) void cancelar();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [cancelar, salida]);

  const empezar = (w: WidgetRect, modo: Arrastre['modo']) => (e: EventoDePuntero<HTMLElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    arrastre.current = { widgetId: w.widget_id, modo, inicioX: e.clientX, inicioY: e.clientY, rect: w };
  };

  // Una sola petición al Núcleo a la vez: mientras espera, solo se guarda el último movimiento del puntero. Sin
  // esto cada `pointermove` hacía su propia llamada y se acumulaban (arrastre lento en las pruebas manuales, P23).
  const enVuelo = useRef(false);
  const siguiente = useRef<{ a: Arrastre; pedido: WidgetRect } | null>(null);

  const enviar = async () => {
    enVuelo.current = true;
    try {
      while (siguiente.current) {
        const { a, pedido } = siguiente.current;
        siguiente.current = null;
        const r =
          a.modo === 'mover'
            ? await invocar('layout_edit_move', { widget_id: a.widgetId, x: pedido.x, y: pedido.y })
            : await invocar('layout_edit_resize', {
                widget_id: a.widgetId,
                x: pedido.x,
                y: pedido.y,
                width: pedido.width,
                height: pedido.height,
              });
        if (!r.ok) continue;
        // Con un movimiento más nuevo esperando, el widget sigue al puntero; si no, queda donde lo dejó el Núcleo.
        if (!siguiente.current) {
          setWidgets((ws) => ws.map((w) => (w.widget_id === a.widgetId ? r.value.rect : w)));
        }
        setChoques(
          r.value.collided && arrastre.current
            ? [
                a.widgetId,
                ...widgets
                  .filter((o) => o.widget_id !== a.widgetId && seSuperponen(pedido, o))
                  .map((o) => o.widget_id),
              ]
            : [],
        );
      }
    } finally {
      enVuelo.current = false;
    }
  };

  const seguir = (e: EventoDePuntero<HTMLElement>) => {
    const a = arrastre.current;
    if (!a) return;
    const dx = e.clientX - a.inicioX;
    const dy = e.clientY - a.inicioY;
    const pedido: WidgetRect =
      a.modo === 'mover'
        ? { ...a.rect, x: a.rect.x + dx, y: a.rect.y + dy }
        : { ...a.rect, width: a.rect.width + dx, height: a.rect.height + dy };
    // El widget se mueve con el puntero sin esperar al Núcleo; las reglas (área visible, sin superponerse, 100 ×
    // 100) las aplica la respuesta del Núcleo.
    setWidgets((ws) => ws.map((w) => (w.widget_id === a.widgetId ? pedido : w)));
    siguiente.current = { a, pedido };
    if (!enVuelo.current) void enviar();
  };

  // Al soltar, el widget queda donde lo dejó el Núcleo: su última posición libre (HE-05-HU02-ET03).
  const soltar = () => {
    arrastre.current = null;
    setChoques([]);
  };

  if (!estado) return null;
  const { monitor } = estado;
  return (
    <main
      aria-label="Pantalla de edición"
      className="wg-edicion"
      style={{
        position: 'fixed',
        inset: 0,
        background: estado.fondo,
        ...(estado.imagen
          ? {
              backgroundImage: `url("${estado.imagen}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}),
      }}
      onPointerMove={seguir}
      onPointerUp={soltar}
    >
      {avisoRemoto && (
        <p role="status" className="wg-edicion__aviso">
          {textos.PERSONALIZACION_REMOTA_CON_CAMBIOS}
        </p>
      )}
      {/* ET04: la barra superior con el texto y las opciones «Guardar» y «Cancelar». */}
      <div className="wg-edicion__barra wg-fila" role="toolbar" aria-label="Barra de edición">
        <span>{textos.INSTRUCCION_DE_EDICION}</span>
        <Boton principal onClick={() => void invocar('layout_edit_save', {})}>
          Guardar
        </Boton>
        <Boton onClick={() => void cancelar()}>Cancelar</Boton>
      </div>
      {widgets.map((w) => (
        // ET02, ET03: en su posición y tamaño reales, con el borde que indica que se puede mover y redimensionar.
        <section
          key={w.widget_id}
          aria-label={NOMBRE_DEL_WIDGET[w.type]}
          data-widget-id={w.widget_id}
          className={`wg-edicion__widget${choques.includes(w.widget_id) ? ' wg-edicion__widget--choque' : ''}`}
          style={{
            position: 'absolute',
            left: w.x - monitor.x,
            top: w.y - monitor.y,
            width: w.width,
            height: w.height,
          }}
          onPointerDown={empezar(w, 'mover')}
        >
          {NOMBRE_DEL_WIDGET[w.type]}
          {/* HE-05-HU03-ET01: se redimensiona desde la esquina inferior derecha. */}
          <span
            className="wg-edicion__esquina"
            aria-hidden="true"
            data-esquina={w.widget_id}
            onPointerDown={empezar(w, 'redimensionar')}
          />
        </section>
      ))}
      {salida && (
        // M-02 (HE-05-HU05-CA01, CA02; ET02). DUDA: HE-05-HU05 M-02 no define el título. Valor usado: «Salir».
        <Confirmacion
          titulo="Salir"
          texto={textos.SALIR_SIN_GUARDAR}
          opcionPrincipal="Salir sin guardar"
          opcionSalir="Seguir editando"
          // CA03: cada widget vuelve a su posición y tamaño anteriores y se abre la pantalla Widgets.
          alConfirmar={() => void invocar('layout_edit_cancel', {})}
          // CA04: se cierra el mensaje y se conservan los cambios.
          alCancelar={() => setSalida(false)}
        />
      )}
    </main>
  );
}
