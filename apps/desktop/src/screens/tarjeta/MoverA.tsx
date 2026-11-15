import { useEffect, useId, useRef, useState } from 'react';
import type { Column } from '@/types';
import { Boton } from '@/ui/Boton/Boton';

// «Mover a» (HE-09-HU02-ET10, ET11): la alternativa sin drag-and-drop para cambiar una tarjeta de columna.
// Muestra todas las columnas del tablero en su orden, con la columna actual marcada y deshabilitada (RT-04).

export interface MoverAProps {
  columnas: readonly Column[];
  /** Columna en la que está la tarjeta. */
  actual: string;
  /** Columna elegida: la tarjeta va al final de ella (ET12). */
  alElegir: (columna: string) => void;
}

export function MoverA({ columnas, actual, alElegir }: MoverAProps) {
  const [abierto, setAbierto] = useState(false);
  const idMenu = useId();
  const menu = useRef<HTMLUListElement>(null);

  // Esc cierra el menú; al abrirlo, el foco va a la primera columna que se puede elegir (RNF-30).
  useEffect(() => {
    if (!abierto) return;
    menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setAbierto(false);
      }
    };
    document.addEventListener('keydown', alTeclear, true);
    return () => document.removeEventListener('keydown', alTeclear, true);
  }, [abierto]);

  return (
    <div className="wg-mover-a">
      <Boton
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={idMenu}
        onClick={() => setAbierto((a) => !a)}
      >
        Mover a
      </Boton>
      {abierto && (
        <ul ref={menu} id={idMenu} role="menu" aria-label="Mover a" className="wg-mover-a__menu">
          {columnas.map((c) => {
            const esActual = c.id === actual;
            return (
              <li key={c.id} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={esActual}
                  disabled={esActual}
                  className="wg-mover-a__opcion"
                  onClick={() => {
                    setAbierto(false);
                    alElegir(c.id);
                  }}
                >
                  {c.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
