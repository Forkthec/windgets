import type { WindiProposal } from '@/types';
import { Boton } from '@/ui/Boton/Boton';

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
          <li key={item.card_id ?? `nueva-${i}`}>{item.title}</li>
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
