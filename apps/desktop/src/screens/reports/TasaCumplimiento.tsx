import type { ComplianceReport } from '@/types';
import { Seccion } from './Seccion';

// Sección Tasa de cumplimiento (HE-13-HU03): un indicador con el porcentaje y el texto, no una gráfica (ET01).

/** ET04: un decimal, coma decimal y un espacio antes de «%». */
export function porcentaje(valor: number): string {
  return `${valor.toFixed(1).replace('.', ',')} %`;
}

/** ET02, ET09: «<a tiempo> de <total> tarjetas completadas a tiempo»; con total 1, en singular (D-163). */
export function textoDeCumplimiento(aTiempo: number, total: number): string {
  const tarjetas = total === 1 ? 'tarjeta completada' : 'tarjetas completadas';
  return `${aTiempo} de ${total} ${tarjetas} a tiempo`;
}

export interface TasaCumplimientoProps {
  /** `null` mientras se calcula. */
  reporte: ComplianceReport | null;
}

export function TasaCumplimiento({ reporte }: TasaCumplimientoProps) {
  return (
    <Seccion titulo="Tasa de cumplimiento" vacia={reporte ? reporte.is_empty : null}>
      {reporte && reporte.percent !== null && (
        <>
          <p className="wg-indicador">{porcentaje(reporte.percent)}</p>
          <p>{textoDeCumplimiento(reporte.on_time, reporte.total)}</p>
        </>
      )}
    </Seccion>
  );
}
