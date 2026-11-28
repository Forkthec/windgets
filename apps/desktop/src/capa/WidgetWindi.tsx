import type { Invoke } from '@/types';
import { DibujoDeWindi } from '@/ui/OjosDeWindi/DibujoDeWindi';
import { abrirPantalla } from './abrirPantalla';

// Widget de escritorio «Windi» (docs/rediseno_final_backend.md §5.5, D-07; docs/rediseno.md RD-71): el dibujo de
// Windi con sus ojos (MB-27, C3-05: colores fijos, ya no el color de acción). Es interactivo: al seleccionarlo abre la ventana
// principal con el panel de Windi abierto (IPC-DESK-03 `app_open_screen { screen: 'windi' }`, HE-06-HU08).
export function WidgetWindi({ invocar }: { invocar: Invoke }) {
  return (
    <button
      type="button"
      className="wg-widget-windi"
      aria-label="Abrir Windi"
      onClick={() => abrirPantalla(invocar, 'windi')}
    >
      <DibujoDeWindi tamano={64} />
    </button>
  );
}
