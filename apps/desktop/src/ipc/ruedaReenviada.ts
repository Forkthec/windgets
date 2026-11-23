import { isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// La rueda del mouse sobre un widget (HE-06-HU01-CA09; P29). La capa no recibe el mouse (D-186), así que el Núcleo
// le reenvía el giro desde Raw Input (`host_del_wallpaper/raw_input.rs`, `seleccion::rueda`), en coordenadas de la
// capa como EV-18. DUDA: P29 ningún evento del contrato lleva la rueda (docs/DUDAS.md).

export interface RuedaReenviada {
  x: number;
  y: number;
  /** Giro horizontal en unidades de Windows (120 por muesca); positivo es hacia la derecha. */
  delta_x: number;
  /** Giro vertical en unidades de Windows (120 por muesca); positivo es hacia arriba. */
  delta_y: number;
}

export type EscucharRueda = (alRecibir: (rueda: RuedaReenviada) => void) => () => void;

// Fuera de Tauri (Núcleo simulado de `pnpm dev`) no llega ningún evento: el navegador ya desplaza con la rueda.
export const escucharRuedaReenviada: EscucharRueda = (alRecibir) => {
  if (!isTauri()) return () => {};
  let dejar: (() => void) | undefined;
  let cancelado = false;
  void listen<RuedaReenviada>('pointer_wheel_forwarded', (e) => alRecibir(e.payload)).then((quitar) => {
    if (cancelado) quitar();
    else dejar = quitar;
  });
  return () => {
    cancelado = true;
    dejar?.();
  };
};

/** Píxeles que avanza una muesca de la rueda (120 unidades): tres líneas de 16 px, como Windows por defecto. */
export const PIXELES_POR_MUESCA = 48;

function sePuedeDesplazar(elemento: HTMLElement, eje: 'x' | 'y'): boolean {
  const estilo = getComputedStyle(elemento);
  const desborde = eje === 'y' ? estilo.overflowY : estilo.overflowX;
  if (desborde !== 'auto' && desborde !== 'scroll') return false;
  return eje === 'y'
    ? elemento.scrollHeight > elemento.clientHeight
    : elemento.scrollWidth > elemento.clientWidth;
}

/**
 * Desplaza el contenedor desplazable más cercano al punto, como haría el navegador con la rueda. Si no hay uno
 * vertical, el giro vertical desplaza el horizontal (el tablero del widget Kanban). Devuelve si desplazó algo.
 */
export function desplazarConLaRueda(
  { x, y, delta_x, delta_y }: RuedaReenviada,
  documento: Document = document,
): boolean {
  let elemento: Element | null = documento.elementFromPoint(x, y);
  const vertical = (-delta_y / 120) * PIXELES_POR_MUESCA;
  const horizontal = (delta_x / 120) * PIXELES_POR_MUESCA;
  while (elemento instanceof HTMLElement) {
    if (vertical !== 0 && sePuedeDesplazar(elemento, 'y')) {
      elemento.scrollBy({ top: vertical });
      return true;
    }
    if (sePuedeDesplazar(elemento, 'x') && (horizontal !== 0 || vertical !== 0)) {
      elemento.scrollBy({ left: horizontal !== 0 ? horizontal : vertical });
      return true;
    }
    if (elemento.classList.contains('wg-widget')) return false;
    elemento = elemento.parentElement;
  }
  return false;
}
