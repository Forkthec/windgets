import type { Label, WindiProposal } from '@/types';
import { Boton } from '@/ui/Boton/Boton';
import { fechaVisible } from '../tarjeta/fechas';

// HE-14-HU05-ET01: el nombre de cada dato que cambia y cómo se muestra su valor.
const DATOS: Record<string, string> = {
  type: 'Tipo',
  title: 'Título',
  due_date: 'Fecha límite',
  description: 'Descripción',
  priority: 'Prioridad',
  label_ids: 'Etiquetas',
  time_block: 'Bloque horario',
};
// HE-14-HU05-ET12: cómo se lee un dato que se quita.
const SIN_VALOR: Record<string, string> = {
  priority: 'Sin prioridad',
  description: 'Sin descripción',
  time_block: 'Sin bloque horario',
  label_ids: 'Sin etiquetas',
};
const VALORES: Record<string, string> = {
  task: 'Tarea',
  reminder: 'Recordatorio',
  event: 'Evento',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const hora = (h: number) => `${String(h).padStart(2, '0')}:00`;

/**
 * El bloque horario «10:00 – 11:00», con « del DD/MM/AAAA» cuando es el valor nuevo (HE-14-HU04-CA10; HE-14-HU05-CA11,
 * CA12). DUDA: CA12 muestra el valor actual sin la fecha (docs/DUDAS.md).
 */
export function bloqueVisible(valor: unknown, conFecha: boolean): string | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const { date, start_hour } = valor as { date?: unknown; start_hour?: unknown };
  if (typeof date !== 'string' || typeof start_hour !== 'number') return null;
  const texto = `${hora(start_hour)} – ${hora((start_hour + 1) % 24)}`;
  return conFecha ? `${texto} del ${fechaVisible(date)}` : texto;
}

/** Un valor de la tarjeta como se lee en la propuesta; las etiquetas por su nombre (HE-14-HU05-ET11). */
function valorVisible(dato: string, valor: unknown, etiquetas: Label[], nuevo: boolean): string {
  const vacio =
    valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && !valor.length);
  if (vacio) return SIN_VALOR[dato] ?? 'Sin valor';
  if (dato === 'due_date' && typeof valor === 'string') return fechaVisible(valor);
  if (dato === 'time_block') return bloqueVisible(valor, nuevo) ?? 'Sin bloque horario';
  if (Array.isArray(valor))
    return valor.map((id) => etiquetas.find((e) => e.id === id)?.name ?? String(id)).join(', ');
  if (typeof valor === 'string') return VALORES[valor] ?? valor;
  return String(valor);
}

// Una propuesta de Windi en el chat (HE-14-HU03): lo que se va a cambiar y las opciones «Confirmar» y «Rechazar»
// (ET02). Una propuesta «Descartada» las muestra deshabilitadas (ET04); sin conexión también (ET07).
// DUDA: HE-14-HU03 solo «Descartada» tiene texto; una propuesta confirmada o rechazada no muestra estado. Valor
// usado: sus opciones quedan deshabilitadas (docs/DUDAS.md).

export interface PropuestaProps {
  propuesta: WindiProposal;
  /** Si se puede confirmar o rechazar: hay conexión y no se está esperando otra respuesta. */
  habilitada: boolean;
  alConfirmar: () => void;
  alRechazar: () => void;
  /** Las etiquetas del usuario, para mostrarlas por su nombre (HE-14-HU05-ET11). */
  etiquetas?: Label[];
}

export function Propuesta({
  propuesta,
  habilitada,
  alConfirmar,
  alRechazar,
  etiquetas = [],
}: PropuestaProps) {
  const activa = propuesta.state === 'active';
  return (
    <section className="wg-windi__propuesta" aria-label="Propuesta">
      {propuesta.state === 'discarded' && <p className="wg-indicador">Descartada</p>}
      <ul className="wg-windi__propuesta-tarjetas">
        {propuesta.items.map((item, i) => (
          <li key={item.card_id ?? `nueva-${i}`}>
            {item.title}
            {propuesta.action === 'edit' && item.changes && (
              <ul aria-label="Cambios">
                {Object.entries(item.changes).map(([dato, nuevo]) => (
                  <li key={dato}>
                    {`${DATOS[dato] ?? dato}: ${valorVisible(dato, (item.current as Record<string, unknown> | null)?.[dato], etiquetas, false)} → ${valorVisible(dato, nuevo, etiquetas, true)}`}
                  </li>
                ))}
              </ul>
            )}
            {propuesta.action === 'create' &&
              bloqueVisible((item.changes as Record<string, unknown> | null)?.time_block, true) && (
                <p>{`Bloque horario: ${bloqueVisible((item.changes as Record<string, unknown> | null)?.time_block, true)}`}</p>
              )}
            {propuesta.action === 'move' && item.changes && (
              <p>{`Columna: ${String((item.changes as Record<string, unknown>).from_column)} → ${String((item.changes as Record<string, unknown>).to_column)}`}</p>
            )}
          </li>
        ))}
      </ul>
      {propuesta.action === 'delete' && propuesta.items.length > 1 && (
        // DUDA: HE-14-HU07 la cantidad (ET02) no tiene texto literal.
        <p>{`${propuesta.items.length} tarjetas`}</p>
      )}
      {propuesta.warnings.map((w) => (
        <p key={w} className="wg-motivo">
          {w}
        </p>
      ))}
      <div className="wg-fila">
        <Boton principal disabled={!activa || !habilitada} onClick={alConfirmar}>
          Confirmar
        </Boton>
        <Boton disabled={!activa || !habilitada} onClick={alRechazar}>
          Rechazar
        </Boton>
      </div>
    </section>
  );
}
