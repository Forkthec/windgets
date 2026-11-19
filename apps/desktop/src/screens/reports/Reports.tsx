import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CompletedReport,
  ComplianceReport,
  Label,
  ReportMeta,
  ResolvedRange,
  StatusBreakdown,
} from '@/types';
import { EstadoVacio } from '@/ui/EstadoVacio/EstadoVacio';
import { useNucleo } from '@/ventana_principal/VentanaPrincipal';
import { fechaVisible } from '../tarjeta/fechas';
import { useVentanasDeTarjeta } from '../tarjeta/useVentanasDeTarjeta';
import { EstadosTarjetas } from './EstadosTarjetas';
import { FiltroEtiquetas } from './FiltroEtiquetas';
import { GraficaCompletadas } from './GraficaCompletadas';
import { SelectorRango } from './SelectorRango';
import { TasaCumplimiento } from './TasaCumplimiento';

// P-REP-01 Reportes (Menú principal > Planificador > Reportes; HE-13). Arriba la barra de filtros y debajo las
// secciones (HE-13-HU02-ET01); el rango de fechas aplica a todas (HE-13-HU01-ET09). Cada sección pide su cálculo
// al Núcleo por separado y se muestra apenas llega (HE-13-HU02-ET16).

const SIN_TARJETAS = 'Aún no tienes tarjetas. Tus reportes aparecerán cuando crees la primera.';

export function Reports() {
  const { invocar, escuchar } = useNucleo();
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [rango, setRango] = useState<ResolvedRange | null>(null);
  const [completadas, setCompletadas] = useState<CompletedReport | null>(null);
  const [cumplimiento, setCumplimiento] = useState<ComplianceReport | null>(null);
  const [estados, setEstados] = useState<StatusBreakdown | null>(null);
  // HE-13-HU05: las etiquetas del filtro y las elegidas (vacío = «Todas las etiquetas», ET05).
  const [etiquetas, setEtiquetas] = useState<Label[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  // El rango y las etiquetas elegidas sin volver a crear `aplicar` (que dispara «Últimos 30 días» al abrir).
  const elegidasRef = useRef<string[]>([]);
  elegidasRef.current = elegidas;

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
  // HE-13-HU05-ET04: el filtro de etiquetas aplica a todas las secciones.
  const aplicar = useCallback(
    (nuevo: ResolvedRange, etiquetasElegidas: string[] = elegidasRef.current) => {
      setRango(nuevo);
      setCompletadas(null);
      setCumplimiento(null);
      setEstados(null);
      const filter = {
        range: { kind: 'custom' as const, start: nuevo.start, end: nuevo.end },
        label_ids: etiquetasElegidas,
      };
      void invocar('report_get_completed', { filter }).then((r) => {
        if (r.ok) setCompletadas(r.value);
      });
      // HE-13-HU03-ET05: la tasa de cumplimiento con los mismos filtros.
      void invocar('report_get_compliance', { filter }).then((r) => {
        if (r.ok) setCumplimiento(r.value);
      });
      // HE-13-HU04-ET06: vencidas, pendientes y completadas con los mismos filtros.
      void invocar('report_get_status_breakdown', { filter }).then((r) => {
        if (r.ok) setEstados(r.value);
      });
    },
    [invocar],
  );

  const cambiarEtiquetas = (nuevas: string[]) => setElegidas(nuevas);

  // HE-13-HU05-ET07, ET08: al eliminar una etiqueta elegida, se quita del filtro; si era la única, vuelve a «Todas
  // las etiquetas» y los reportes se recalculan.
  useEffect(() => {
    let vigente = true;
    const leer = () =>
      void invocar('label_list', {}).then((r) => {
        if (!vigente || !r.ok) return;
        setEtiquetas(r.value);
        setElegidas((actuales) => {
          const quedan = actuales.filter((id) => r.value.some((e) => e.id === id));
          return quedan.length === actuales.length ? actuales : quedan;
        });
      });
    leer();
    const dejar = escuchar('labels_changed', leer);
    return () => {
      vigente = false;
      dejar();
    };
  }, [escuchar, invocar]);

  // Cada cambio del filtro (elegido o por una etiqueta eliminada) recalcula los reportes con el rango actual.
  const elegidasAplicadas = useRef(elegidas);
  useEffect(() => {
    if (elegidasAplicadas.current === elegidas) return;
    elegidasAplicadas.current = elegidas;
    if (rango) aplicar(rango, elegidas);
  }, [aplicar, elegidas, rango]);

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

  // HE-13-HU04-ET09: el Detalle de tarjeta sobre Reportes (RT-02); al cambiar una tarjeta, se recalcula.
  const tarjetas = useVentanasDeTarjeta(
    useCallback(() => {
      if (rango) aplicar(rango);
    }, [aplicar, rango]),
  );

  const sinTarjetas = meta !== null && !meta.has_cards;
  return (
    <main aria-label="Reportes" aria-busy={meta === null}>
      {/* HE-13-HU02-ET12: sin tarjetas, la barra de filtros deshabilitada y el mensaje en lugar de las secciones. */}
      <SelectorRango alAplicar={(nuevo) => aplicar(nuevo)} deshabilitado={meta === null || sinTarjetas} />
      <FiltroEtiquetas
        etiquetas={etiquetas}
        elegidas={elegidas}
        alCambiar={cambiarEtiquetas}
        deshabilitado={meta === null || sinTarjetas}
      />
      {rango?.clipped_start && (
        // HE-13-HU02-ET14
        <p>
          Mostrando datos desde el {fechaVisible(rango.clipped_start)}, cuando creaste tu primera tarjeta.
        </p>
      )}
      {sinTarjetas ? (
        <EstadoVacio texto={SIN_TARJETAS} />
      ) : (
        meta && (
          <>
            <GraficaCompletadas reporte={completadas} />
            <TasaCumplimiento reporte={cumplimiento} />
            <EstadosTarjetas reporte={estados} rango={rango} alAbrir={tarjetas.abrirDetalle} />
          </>
        )
      )}
      {tarjetas.ventanas}
    </main>
  );
}
