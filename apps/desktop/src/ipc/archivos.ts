import { convertFileSrc } from '@tauri-apps/api/core';

/** La URL con la que una ventana muestra un archivo del computador (fuera de Tauri, la misma ruta). */
export function urlDeArchivo(ruta: string): string {
  try {
    return convertFileSrc(ruta);
  } catch {
    return ruta;
  }
}
