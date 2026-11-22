import type { Invoke, ScreenId, ScreenParams } from '@/types';

// HE-06-HU08: un widget interactivo abre la pantalla relacionada de la aplicación (IPC-DESK-03 `app_open_screen`).
// El Núcleo muestra la ventana principal al frente, aunque esté minimizada o solo en el área de notificación
// (CA07, ET06), y le pide la pantalla con EV-23. La capa entrega la selección al soltar el botón sin mover el
// puntero (EV-27 `pointer_released`, ET08), así que empezar un arrastre no abre la aplicación (CA10).

/**
 * Los controles propios de un widget (casilla y su área, «⋮», menú «Mover a»): seleccionarlos no abre ninguna
 * pantalla (HE-06-HU03-ET06).
 */
export const CONTROLES_DEL_WIDGET = 'input, label, button, [role="menu"]';

/** ¿La selección cayó en un control propio del widget? */
export function esUnControl(objetivo: EventTarget | null): boolean {
  return objetivo instanceof Element && objetivo.closest(CONTROLES_DEL_WIDGET) !== null;
}

/** HE-06-HU08-ET08: dos selecciones en menos de 600 ms cuentan como una (CA09). */
export const ANTIRREBOTE_MS = 600;

// La última apertura de cada Núcleo (en la aplicación hay uno; en las pruebas, uno por prueba).
const ultimaApertura = new WeakMap<Invoke, number>();

export function abrirPantalla(invocar: Invoke, screen: ScreenId, params?: ScreenParams) {
  const ahora = Date.now();
  const anterior = ultimaApertura.get(invocar);
  if (anterior !== undefined && ahora - anterior < ANTIRREBOTE_MS) return;
  ultimaApertura.set(invocar, ahora);
  void invocar('app_open_screen', params ? { screen, params } : { screen });
}
