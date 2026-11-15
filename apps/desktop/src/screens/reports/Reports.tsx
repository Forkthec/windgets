import { useCallback, useEffect, useState } from 'react';
import type { CompletedReport, ReportMeta, ResolvedRange } from '@/types';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from '../tarjeta/fechas';
import { GraficaCompletadas } from './GraficaCompletadas';
import { SelectorRango } from './SelectorRango';

// P-REP-01 Reportes (Menú principal > Planificador > Reportes; HE-13). Arriba la barra de filtros y debajo las
// secciones (HE-13-HU02-ET01); el rango de fechas aplica a todas (HE-13-HU01-ET09). Cada sección pide su cálculo
// al Núcleo por separado y se muestra apenas llega (HE-13-HU02-ET16).

const SIN_TARJETAS = 'Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.';

export function Reports() {
  const { invocar } = useNucleo();
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [rango, setRango] = useState<ResolvedRange | null>(null);
  const [completadas, setCompletadas] = useState<CompletedReport | null>(null);

  useEffect(() => {
    let vigente = true;
    void invocar('report_get_meta', {}).then((r) => {
      if (vigente && r.ok) setMeta(r.value);
    });
    return () => {
      vigente = false;
    };
  }, [invocar]);

  // HE-13-HU01-ET09: cada rango aplicado recalcula las secciones; mientras, su indicador de carga (ET15).
  const aplicar = useCallback(
    (nuevo: ResolvedRange) => {
      setRango(nuevo);
      setCompletadas(null);
      // DUDA: HE-13-HU02 el filtro Etiquetas es de HE-13-HU05; hasta entonces, «Todas las etiquetas» (ET02).
      const filter = {
        range: { kind: 'custom' as const, start: nuevo.start, end: nuevo.end },
        label_ids: [],
      };
      void invocar('report_get_completed', { filter }).then((r) => {
        if (r.ok) setCompletadas(r.value);
      });
    },
    [invocar],
  );

  // HE-13-HU01-ET16: al abrir, «Últimos 30 días».
  useEffect(() => {
    if (!meta?.has_cards) return;
    let vigente = true;
    void invocar('report_resolve_range', { range: { kind: 'last_30' } }).then((r) => {
      if (vigente && r.ok) aplicar(r.value);
    });
    return () => {
      vigente = false;
    };
  }, [aplicar, invocar, meta?.has_cards]);

  const sinTarjetas = meta !== null && !meta.has_cards;
  return (
    <main aria-label="Reportes" aria-busy={meta === null}>
      {/* HE-13-HU02-ET12: sin tarjetas, la barra de filtros deshabilitada y el mensaje en lugar de las secciones. */}
      <SelectorRango alAplicar={aplicar} deshabilitado={meta === null || sinTarjetas} />
      {rango?.clipped_start && (
        // HE-13-HU02-ET14
        <p>
          Mostrando datos desde el {fechaVisible(rango.clipped_start)}, cuando creaste tu primera tarjeta.
        </p>
      )}
      {sinTarjetas ? (
        <EstadoVacio texto={SIN_TARJETAS} />
      ) : (
        meta && <GraficaCompletadas reporte={completadas} />
      )}
    </main>
  );
}
