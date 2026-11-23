import type { KeyboardEvent } from 'react';
import { useApariencia, type ModoDeCuenta } from './apariencia';

// docs/rediseno.md RD-02: el selector «Apariencia» con «Claro» (sol) y «Oscuro» (luna), arriba a la derecha de las
// pantallas de cuenta. Los trazos de los íconos son los del Figma («Sol», «Luna») con el color del texto.

function Sol() {
  return (
    <svg
      className="wg-selector-modo__icono"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.1 9C12.1 10.7121 10.7121 12.1 9 12.1C7.28792 12.1 5.9 10.7121 5.9 9C5.9 7.28792 7.28792 5.9 9 5.9C10.7121 5.9 12.1 7.28792 12.1 9Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <path
        d="M9 1V3M9 15V17M1 9H3M15 9H17M3.3 3.3L4.7 4.7M13.3 13.3L14.7 14.7M14.7 3.3L13.3 4.7M4.7 13.3L3.3 14.7"
        strokeWidth="1.5"
        strokeLinecap="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function Luna() {
  return (
    <svg
      className="wg-selector-modo__icono"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.7 11.5C13.5649 11.8027 12.3703 11.8016 11.2358 11.4968C10.1013 11.1921 9.06684 10.5944 8.2362 9.7638C7.40556 8.93316 6.8079 7.89872 6.50317 6.76422C6.19844 5.62973 6.19735 4.43505 6.5 3.3C5.32473 3.58227 4.24593 4.1727 3.3747 5.01049C2.50347 5.84828 1.87128 6.90315 1.54325 8.06647C1.21521 9.2298 1.20318 10.4595 1.50839 11.6291C1.8136 12.7986 2.42503 13.8656 3.2797 14.7203C4.13438 15.575 5.20141 16.1864 6.37094 16.4916C7.54046 16.7968 8.7702 16.7848 9.93353 16.4568C11.0969 16.1287 12.1517 15.4965 12.9895 14.6253C13.8273 13.7541 14.4177 12.6753 14.7 11.5Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        stroke="currentColor"
      />
    </svg>
  );
}

const OPCIONES: readonly { modo: ModoDeCuenta; texto: string; Icono: () => JSX.Element }[] = [
  { modo: 'claro', texto: 'Claro', Icono: Sol },
  { modo: 'oscuro', texto: 'Oscuro', Icono: Luna },
];

// RD-22: como grupo de radios (WAI-ARIA APG), solo la opción elegida entra en el orden de tabulación y las flechas
// cambian de opción, la eligen y le pasan el foco.
const SIGUIENTE: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export interface SelectorDeModoProps {
  /**
   * Con la sesión iniciada (RD-29), el modo del tema aplicado y la acción de aplicarle la paleta; sin ellos, el
   * modo de las pantallas de cuenta (RD-02).
   */
  conSesion?: { modo: ModoDeCuenta; cambiar: (modo: ModoDeCuenta) => void };
}

export function SelectorDeModo({ conSesion }: SelectorDeModoProps = {}) {
  const deCuenta = useApariencia();
  const { modo, cambiar } = conSesion ?? deCuenta;
  const alTeclear = (evento: KeyboardEvent<HTMLDivElement>) => {
    const paso = SIGUIENTE[evento.key];
    if (paso === undefined) return;
    evento.preventDefault();
    const actual = OPCIONES.findIndex((o) => o.modo === modo);
    const destino = (actual + paso + OPCIONES.length) % OPCIONES.length;
    const siguiente = OPCIONES[destino];
    if (!siguiente) return;
    cambiar(siguiente.modo);
    const botones = evento.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    botones[destino]?.focus();
  };
  return (
    <div className="wg-selector-modo" role="radiogroup" aria-label="Apariencia" onKeyDown={alTeclear}>
      {OPCIONES.map(({ modo: opcion, texto, Icono }) => (
        <button
          key={opcion}
          type="button"
          role="radio"
          aria-checked={modo === opcion}
          tabIndex={modo === opcion ? 0 : -1}
          className="wg-selector-modo__opcion"
          onClick={() => cambiar(opcion)}
        >
          <Icono />
          {texto}
        </button>
      ))}
    </div>
  );
}
