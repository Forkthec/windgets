import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { CompletedReport } from '@/types';
import { fechaVisible } from '../tarjeta/fechas';
import { Seccion } from './Seccion';

// Sección Tarjetas completadas (HE-13-HU02): gráfica de líneas con las fechas en el eje horizontal y la cantidad
// en el eje vertical (ET03), agrupada por día, semana o mes según el rango (ET06 a ET08).

export interface GraficaCompletadasProps {
  /** `null` mientras se calcula (ET15). */
  reporte: CompletedReport | null;
}

export function GraficaCompletadas({ reporte }: GraficaCompletadasProps) {
  // DUDA: HE-13-HU02 no se define la etiqueta de cada período en el eje; se usa su primer día en DD/MM/AAAA.
  const datos =
    reporte?.points.map((p) => ({ periodo: fechaVisible(p.period_start), cantidad: p.count })) ?? [];
  return (
    <Seccion titulo="Tarjetas completadas" vacia={reporte ? reporte.is_empty : null}>
      <LineChart width={640} height={240} data={datos} aria-label="Gráfica de tarjetas completadas">
        {/* docs/rediseno.md RD-56 (84:397): la línea en el color de selección y la cuadrícula suave. */}
        <CartesianGrid stroke="var(--wgm-linea-agenda, var(--wg-borde))" />
        <XAxis dataKey="periodo" />
        <YAxis allowDecimals={false} />
        <Line
          type="linear"
          dataKey="cantidad"
          stroke="var(--wgm-seleccion-texto, var(--wg-accion))"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </Seccion>
  );
}
