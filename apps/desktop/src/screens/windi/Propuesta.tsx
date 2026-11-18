import type { WindiProposal } from '@/types';
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
};
const VALORES: Record<string, string> = {
  task: 'Tarea',
  reminder: 'Recordatorio',
  event: 'Evento',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

/** Un valor de la tarjeta como se lee en la propuesta. DUDA: HE-14-HU05 las etiquetas se muestran por cantidad. */
function valorVisible(dato: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return 'Sin valor';
  if (dato === 'due_date' && typeof valor === 'string') return fechaVisible(valor);
  if (Array.isArray(valor)) return String(valor.length);
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
}

export function Propuesta({ propuesta, habilitada, alConfirmar, alRechazar }: PropuestaProps) {
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
                    {`${DATOS[dato] ?? dato}: ${valorVisible(dato, (item.current as Record<string, unknown> | null)?.[dato])} → ${valorVisible(dato, nuevo)}`}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
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
