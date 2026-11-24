import type { Invoke } from '@/types';
import { OjosDeWindi } from '@/ui/OjosDeWindi/OjosDeWindi';
import { abrirPantalla } from './abrirPantalla';

// Widget de escritorio «Windi» (docs/rediseno_final_backend.md §5.5, D-07; docs/rediseno.md RD-71): los dos ojos de
// Windi con el color de acción del tema, sin la ilustración. Es interactivo: al seleccionarlo abre la ventana
// principal con el panel de Windi abierto (IPC-DESK-03 `app_open_screen { screen: 'windi' }`, HE-06-HU08).
export function WidgetWindi({ invocar }: { invocar: Invoke }) {
  return (
    <button
      type="button"
      className="wg-widget-windi"
      aria-label="Abrir Windi"
      onClick={() => abrirPantalla(invocar, 'windi')}
    >
      <OjosDeWindi tamano={64} />
    </button>
  );
}
