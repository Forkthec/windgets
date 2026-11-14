export interface NivelDeMiga {
  texto: string;
  /** Lleva a ese nivel sin completar la acción de la ruta (RT-03-ET04). El último nivel es el actual. */
  alElegir?: () => void;
}

export interface MigaDePanProps {
  /** Niveles de la ruta, por ejemplo «Widgets > Agregar widget > Clima» (RT-03-ET02). */
  niveles: readonly NivelDeMiga[];
}

// En la parte superior de la pantalla, subpantalla o paso con ruta definida (RT-03-ET01).
export function MigaDePan({ niveles }: MigaDePanProps) {
  return (
    <nav aria-label="Miga de pan">
      <ol className="wg-miga">
        {niveles.map((nivel, i) => {
          const actual = i === niveles.length - 1;
          return (
            <li key={`${i}-${nivel.texto}`} className="wg-fila" aria-current={actual ? 'page' : undefined}>
              {i > 0 && <span aria-hidden="true">&gt;</span>}
              {!actual && nivel.alElegir ? (
                <button type="button" className="wg-miga__nivel" onClick={nivel.alElegir}>
                  {nivel.texto}
                </button>
              ) : (
                <span>{nivel.texto}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
