import { useCallback, useEffect, useState } from 'react';
import type { Invoke } from '@/types';
import type { ColorDelCatalogo } from './CatalogoColores';

/**
 * Los colores del catálogo de colores (IPC-CAT-01; HE-08-HU02-ET05, HE-09-HU03-ET05). `recargar` los vuelve a
 * pedir cuando el Núcleo dice que el elegido ya no está disponible (docs/rediseno.md RD-85).
 */
export function useColoresDelCatalogo(invocar: Invoke) {
  const [colores, setColores] = useState<ColorDelCatalogo[]>([]);
  const [lectura, setLectura] = useState(0);

  useEffect(() => {
    let vigente = true;
    void invocar('catalog_list', { kind: 'color' }).then((r) => {
      if (vigente && r.ok) setColores(r.value.map((c) => ({ id: c.id, name: c.name, hex: c.hex ?? '' })));
    });
    return () => {
      vigente = false;
    };
  }, [invocar, lectura]);

  const recargar = useCallback(() => setLectura((n) => n + 1), []);
  return { colores, recargar };
}
