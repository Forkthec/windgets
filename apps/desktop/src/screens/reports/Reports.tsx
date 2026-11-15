import { useCallback, useEffect, useState } from 'react';
import type { ResolvedRange } from '@/types';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { SelectorRango } from './SelectorRango';

// P-REP-01 Reportes (Menú principal > Planificador > Reportes; HE-13). El rango de fechas aplica a todas las
// secciones del reporte (HE-13-HU01-ET09); las secciones llegan con HE-13-HU02 a HU04.

export function Reports() {
  const { invocar } = useNucleo();
  const [rango, setRango] = useState<ResolvedRange | null>(null);

  // HE-13-HU01-ET16: al abrir, «Últimos 30 días».
  useEffect(() => {
    let vigente = true;
    void invocar('report_resolve_range', { range: { kind: 'last_30' } }).then((r) => {
      if (vigente && r.ok) setRango(r.value);
    });
    return () => {
      vigente = false;
    };
  }, [invocar]);

  const aplicar = useCallback((nuevo: ResolvedRange) => setRango(nuevo), []);

  return (
    <main aria-label="Reportes" aria-busy={rango === null}>
      <SelectorRango alAplicar={aplicar} />
    </main>
  );
}
