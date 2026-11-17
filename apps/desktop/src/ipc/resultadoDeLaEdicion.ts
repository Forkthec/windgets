import { isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ResultMessage } from '@/types';

// El mensaje de resultado de «Guardar» o «Cancelar» de la pantalla de edición (HE-05-HU04, HU05), que el Núcleo
// manda a la ventana principal al cerrar la ventana de edición (`ventana_de_edicion.rs`).
// DUDA: HE-05-HU04 ningún evento del contrato lleva ese mensaje (docs/DUDAS.md).

export type EscucharResultado = (alRecibir: (mensaje: ResultMessage) => void) => () => void;

export const escucharResultadoDeLaEdicion: EscucharResultado = (alRecibir) => {
  if (!isTauri()) return () => {};
  let dejar: (() => void) | undefined;
  let cancelado = false;
  void listen<ResultMessage>('layout_edit_result', (e) => alRecibir(e.payload)).then((quitar) => {
    if (cancelado) quitar();
    else dejar = quitar;
  });
  return () => {
    cancelado = true;
    dejar?.();
  };
};
