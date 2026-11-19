import { isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// El arrastre que sigue a una selección reenviada (EV-18) hasta que se suelta el botón principal, para el
// drag-and-drop del widget Kanban (HE-06-HU06). Lo emite el Núcleo desde Raw Input (`host_del_wallpaper/
// raw_input.rs`, `seleccion::Arrastre`), en coordenadas de la capa como EV-18.
// DUDA: HE-06-HU06 ningún evento del contrato lleva el movimiento ni el lugar donde se suelta (docs/DUDAS.md).

export interface ArrastreReenviado {
  x: number;
  y: number;
  /** `move` mientras el botón sigue presionado; `up` al soltarlo. */
  phase: 'move' | 'up';
}

export type EscucharArrastre = (alRecibir: (arrastre: ArrastreReenviado) => void) => () => void;

// Fuera de Tauri (Núcleo simulado de `pnpm dev`) no llega ningún evento.
export const escucharArrastreReenviado: EscucharArrastre = (alRecibir) => {
  if (!isTauri()) return () => {};
  let dejar: (() => void) | undefined;
  let cancelado = false;
  void listen<ArrastreReenviado>('pointer_drag_forwarded', (e) => alRecibir(e.payload)).then((quitar) => {
    if (cancelado) quitar();
    else dejar = quitar;
  });
  return () => {
    cancelado = true;
    dejar?.();
  };
};
