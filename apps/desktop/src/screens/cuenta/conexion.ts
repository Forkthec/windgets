import { useCallback, useEffect, useState } from 'react';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';

/**
 * Estado de la conexión para las pantallas de cuenta, que exigen conexión (contratos.md, 1.5). Lee
 * `connectivity_get` al abrirse, escucha `connectivity_changed` (EV-03) y pasa a «sin conexión» cuando un
 * comando responde `net.offline`. Sin conexión, las opciones que la exigen se deshabilitan hasta que vuelva
 * (RT-04; HE-01-HU01-CA12).
 */
export function useConexion() {
  const { invocar, escuchar } = useNucleo();
  const [enLinea, setEnLinea] = useState(true);
  useEffect(() => {
    let vigente = true;
    void invocar('connectivity_get', {}).then((r) => {
      if (vigente && r.ok) setEnLinea(r.value.online);
    });
    const dejar = escuchar('connectivity_changed', (carga) => setEnLinea(carga.online));
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar]);
  const sinConexion = useCallback(() => setEnLinea(false), []);
  return { enLinea, sinConexion };
}
