import { TARJETA_ETIQUETAS_MAX } from '@/reglas/limites';
import type { Label } from '@/types';
import textos from '@/types/messages.es.json';

// Filtro Etiquetas de la barra de filtros de Reportes (HE-13-HU05-ET01): «Todas las etiquetas» y cada etiqueta con
// su color; se eligen una o varias (ET02). Sin etiquetas, deshabilitado con «Aún no tienes etiquetas.» (ET06).
// Hasta 3 elegidas (RD-96): al llegar, las demás quedan deshabilitadas con el motivo.

export const SIN_ETIQUETAS = 'Aún no tienes etiquetas.';

export interface FiltroEtiquetasProps {
  etiquetas: readonly Label[];
  elegidas: readonly string[];
  alCambiar: (elegidas: string[]) => void;
  deshabilitado?: boolean;
}

export function FiltroEtiquetas({
  etiquetas,
  elegidas,
  alCambiar,
  deshabilitado = false,
}: FiltroEtiquetasProps) {
  const sinEtiquetas = etiquetas.length === 0;
  const apagado = deshabilitado || sinEtiquetas;
  const alLimite = elegidas.length >= TARJETA_ETIQUETAS_MAX;
  const alternar = (id: string) =>
    alCambiar(elegidas.includes(id) ? elegidas.filter((e) => e !== id) : [...elegidas, id]);
  return (
    <fieldset className="wg-fila wg-filtro-etiquetas" disabled={apagado} aria-label="Etiquetas">
      <legend>Etiquetas</legend>
      <button type="button" aria-pressed={elegidas.length === 0} onClick={() => alCambiar([])}>
        Todas las etiquetas
      </button>
      {etiquetas.map((e) => (
        <button
          key={e.id}
          type="button"
          aria-pressed={elegidas.includes(e.id)}
          disabled={alLimite && !elegidas.includes(e.id)}
          onClick={() => alternar(e.id)}
        >
          <span className="wg-muestra-color" style={{ background: e.color_hex }} aria-hidden="true" />
          {e.name}
        </button>
      ))}
      {sinEtiquetas && <span className="wg-motivo">{SIN_ETIQUETAS}</span>}
      {alLimite && <span className="wg-motivo">{textos.MAXIMO_ETIQUETAS_DEL_FILTRO}</span>}
    </fieldset>
  );
}
