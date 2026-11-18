import type { Invoke, ScreenId, ScreenParams } from '@/types';

// HE-06-HU08: un widget interactivo abre la pantalla relacionada de la aplicación (IPC-DESK-03 `app_open_screen`).
// El Núcleo muestra la ventana principal al frente, aunque esté minimizada o solo en el área de notificación
// (CA07, ET06), y le pide la pantalla con EV-23.

/** Los controles propios de un widget (casilla, «⋮», menú «Mover a»): seleccionarlos no abre ninguna pantalla. */
export const CONTROLES_DEL_WIDGET = 'input, button, [role="menu"]';

/** ¿La selección cayó en un control propio del widget? */
export function esUnControl(objetivo: EventTarget | null): boolean {
  return objetivo instanceof Element && objetivo.closest(CONTROLES_DEL_WIDGET) !== null;
}

export function abrirPantalla(invocar: Invoke, screen: ScreenId, params?: ScreenParams) {
  void invocar('app_open_screen', params ? { screen, params } : { screen });
}
