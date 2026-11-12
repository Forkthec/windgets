export interface MigaDePanProps {
  /** Ruta de la pantalla, por ejemplo ["Menú principal", "Planificador", "Etiquetas"] (RT-03). */
  ruta: string[];
}

export function MigaDePan({ ruta }: MigaDePanProps) {
  return (
    <nav aria-label="Miga de pan">
      <ol className="wg-miga">
        {ruta.map((paso, i) => (
          <li key={`${i}-${paso}`} aria-current={i === ruta.length - 1 ? 'page' : undefined}>
            {i > 0 && <span aria-hidden="true">&gt; </span>}
            {paso}
          </li>
        ))}
      </ol>
    </nav>
  );
}
