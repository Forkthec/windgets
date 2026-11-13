import { isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { EventMap } from '@/types';

/** Escucha un evento del Núcleo (contratos.md, «Eventos»). Devuelve la función que deja de escucharlo. */
export type Escuchar = <E extends keyof EventMap>(
  evento: E,
  alRecibir: (carga: EventMap[E]) => void,
) => () => void;

// Fuera de Tauri (Núcleo simulado de `pnpm dev`) no llega ningún evento.
export const escuchar: Escuchar = (evento, alRecibir) => {
  if (!isTauri()) return () => {};
  let dejar: (() => void) | undefined;
  let cancelado = false;
  void listen<EventMap[typeof evento]>(evento, (e) => alRecibir(e.payload)).then((quitar) => {
    if (cancelado) quitar();
    else dejar = quitar;
  });
  return () => {
    cancelado = true;
    dejar?.();
  };
};
