import { useCallback, useState } from 'react';

/**
 * Ventanas emergentes de una pantalla (RT-02). Solo se ve la última. `pasarA` reemplaza la ventana visible y
 * recuerda la anterior: así «Editar» en el Detalle de tarjeta abre el Formulario de tarjeta en modo edición y,
 * al guardar o cancelar, `volver` abre otra vez el Detalle (RT-02-ET07). Con una sola ventana, `volver` la
 * cierra y el usuario sigue en la misma pantalla (ET06).
 */
export function useVentanasEmergentes<V>() {
  const [pila, setPila] = useState<readonly V[]>([]);
  const abrir = useCallback((ventana: V) => setPila([ventana]), []);
  const pasarA = useCallback((ventana: V) => setPila((p) => [...p, ventana]), []);
  const volver = useCallback(() => setPila((p) => p.slice(0, -1)), []);
  const actual: V | undefined = pila[pila.length - 1];
  return { actual, abrir, pasarA, volver };
}
